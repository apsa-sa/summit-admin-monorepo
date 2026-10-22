// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MigrationRunner } from "../../data-access/migration-runner.js";
import { PostgresRateLimiter } from "../../data-access/rate-limiter.js";
import { DatabaseFixture } from "../support/database-fixture.js";
class LoginAdmissionIntegrationSuite {
  register(): void {
    test(
      "Shared login admission and migration journal on isolated PostgreSQL",
      { timeout: 60000 },
      async (context) => {
        const fixture = new DatabaseFixture();
        try {
          const repository = await fixture.create();
          const independent = await fixture.create();
          const pool = repository.pool;
          const id = randomUUID();
          await pool.query(
            "INSERT INTO users(id,name,email,role,status) VALUES($1,'Migration sentinel',$2,'viewer','active')",
            [id, `${id}@example.test`],
          );
          await context.test(
            "Concurrent/repeated migrations preserve existing rows and record exact checksums once",
            async () => {
              await Promise.all([
                new MigrationRunner().apply(pool),
                new MigrationRunner().apply(pool),
              ]);
              await new MigrationRunner().apply(pool);
              assert.equal(
                (await pool.query("SELECT * FROM schema_migrations")).rowCount,
                3,
              );
              assert.equal(
                (await repository.self(id)).name,
                "Migration sentinel",
              );
              await assert.rejects(
                pool.query(
                  "INSERT INTO request_limits(key,count,resets_at) VALUES('raw-peer',1,now())",
                ),
                { code: "23514" },
              );
            },
          );
          await context.test(
            "Fresh limiter instances share allowance; denied attempts stay saturated at sixteen",
            async () => {
              for (let index = 0; index < 15; index++)
                await new PostgresRateLimiter(pool).check("worker-peer");
              for (let index = 0; index < 3; index++)
                await assert.rejects(
                  new PostgresRateLimiter(pool).check("worker-peer"),
                  { code: "rate_limited" },
                );
              const result = await pool.query<{ key: string; count: number }>(
                "SELECT key,count FROM request_limits",
              );
              assert.equal(result.rows[0]?.count, 16);
              assert.notEqual(result.rows[0]?.key, "worker-peer");
              await new MigrationRunner().apply(independent.pool);
              await new PostgresRateLimiter(independent.pool).check(
                "worker-peer",
              );
              assert.equal(
                (
                  await independent.pool.query<{ count: number }>(
                    "SELECT count FROM request_limits",
                  )
                ).rows[0]?.count,
                1,
              );
            },
          );
          await context.test(
            "Concurrent workers admit exactly fifteen and expiry resets admission",
            async () => {
              const results = await Promise.allSettled(
                Array.from({ length: 20 }, () =>
                  new PostgresRateLimiter(pool).check("concurrent-peer"),
                ),
              );
              assert.equal(
                results.filter((result) => result.status === "fulfilled")
                  .length,
                15,
              );
              assert.equal(
                results.filter((result) => result.status === "rejected").length,
                5,
              );
              await pool.query(
                "UPDATE request_limits SET resets_at=now()-interval '1 second'",
              );
              await new PostgresRateLimiter(pool).check("concurrent-peer");
              assert.equal(
                (
                  await pool.query<{ count: number }>(
                    "SELECT count FROM request_limits",
                  )
                ).rows[0]?.count,
                1,
              );
            },
          );
          await context.test(
            "Capacity rejects only new peers and invalid keys; SQL input remains data",
            async () => {
              const limiter = new PostgresRateLimiter(pool, 2);
              await limiter.check("peer'; DROP TABLE users;--");
              await limiter.check("concurrent-peer"); // Existing key remains usable at capacity.
              await assert.rejects(limiter.check("third-peer"), {
                code: "rate_limited",
              });
              await assert.rejects(limiter.check(""), { code: "rate_limited" });
              await assert.rejects(limiter.check("x".repeat(257)), {
                code: "rate_limited",
              });
              assert.equal(
                (await pool.query("SELECT * FROM request_limits")).rowCount,
                2,
              );
              assert.equal((await repository.self(id)).id, id);
            },
          );
          await context.test(
            "Edited applied migration checksum is rejected without changing user data",
            async () => {
              await pool.query(
                "UPDATE schema_migrations SET checksum=$1 WHERE name='001_initial.sql'",
                ["0".repeat(64)],
              );
              await assert.rejects(new MigrationRunner().apply(pool), {
                message: "migration_checksum_mismatch",
              });
              assert.equal((await repository.self(id)).id, id);
              assert.equal(
                (await pool.query("SELECT * FROM request_limits")).rowCount,
                2,
              );
            },
          );
        } finally {
          await fixture.close();
        }
      },
    );
  }
}
new LoginAdmissionIntegrationSuite().register();
