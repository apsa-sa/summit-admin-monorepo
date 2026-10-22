// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DatabaseFixture } from "../support/database-fixture.js";
import { MigrationRunner } from "../../data-access/migration-runner.js";
import { PostgresTablePreferenceRepository } from "../../data-access/table-preference-repository.js";
import { PostgresSessionGuard } from "../../data-access/session-guard.js";
import { TablePreferenceValidation } from "../../core/table-preferences.js";
import { AuthorizationPolicy } from "../../core-rbac/index.js";
import { DomainError } from "../../core/index.js";
import { SessionToken } from "../../security/index.js";
class TablePreferenceIntegrationSuite {
  register(): void {
    test(
      "Account-scoped saved views on real isolated PostgreSQL",
      { timeout: 60000 },
      async (context) => {
        const fixture = new DatabaseFixture(),
          schema = new TablePreferenceValidation(),
          policy = new AuthorizationPolicy();
        try {
          const repo = await fixture.create(),
            other = await fixture.create();
          await new MigrationRunner().apply(repo.pool);
          await new MigrationRunner().apply(other.pool);
          const ids = [randomUUID(), randomUUID()];
          const digests: string[] = [];
          for (const id of ids) {
            await repo.pool.query(
              "INSERT INTO users(id,name,email,role,status) VALUES($1,'Synthetic viewer',$2,'viewer','active')",
              [id, `${id}@example.test`],
            );
            const digest = new SessionToken().digest(
              new SessionToken().create(),
            );
            await repo.session(digest, id);
            digests.push(digest);
          }
          const first = digests[0],
            second = digests[1];
          assert.ok(first && second);
          const store = new PostgresTablePreferenceRepository(
            repo.pool,
            new PostgresSessionGuard(),
            schema,
          );
          await context.test(
            "Authenticated viewer can save own view; a different account retains defaults",
            async () => {
              assert.deepEqual(
                await store.load(first, policy),
                schema.defaults(),
              );
              const value = {
                ...schema.defaults(),
                query: {
                  search: "قمة %' OR 1=1 --",
                  role: "viewer",
                  status: "active",
                  page: 2,
                  sort: "name" as const,
                },
                columns: ["name", "status"] as const,
              };
              const saved = await store.save(first, value, policy);
              assert.equal(saved.version, 1);
              assert.equal(saved.query.search, value.query.search);
              assert.deepEqual(await store.load(first, policy), saved);
              assert.deepEqual(
                await store.load(second, policy),
                schema.defaults(),
              );
            },
          );
          await context.test(
            "Concurrent initial writes and stale versions accept exactly one writer",
            async () => {
              const initial = schema.defaults();
              const results = await Promise.allSettled([
                store.save(second, initial, policy),
                store.save(second, { ...initial, columns: ["name"] }, policy),
              ]);
              assert.equal(
                results.filter((r) => r.status === "fulfilled").length,
                1,
              );
              const rejected = results.find((r) => r.status === "rejected");
              assert.ok(
                rejected?.status === "rejected" &&
                  rejected.reason.code === "version_conflict",
              );
              const confirmed = await store.load(second, policy);
              assert.equal(confirmed.version, 1);
              await assert.rejects(store.save(second, initial, policy), {
                code: "version_conflict",
              });
              assert.deepEqual(await store.load(second, policy), confirmed);
            },
          );
          await context.test(
            "Denied policy rolls back before writing; repeated migrations preserve saved state",
            async () => {
              const confirmed = await store.load(first, policy);
              await assert.rejects(
                store.save(first, confirmed, {
                  require: () => {
                    throw new DomainError(403, "forbidden");
                  },
                }),
                { code: "forbidden" },
              );
              await new MigrationRunner().apply(repo.pool);
              assert.deepEqual(await store.load(first, policy), confirmed);
            },
          );
          await context.test(
            "Database constraints reject unknown/duplicate columns, missing name and invalid filters",
            async () => {
              const confirmed = await store.load(first, policy);
              for (const columns of [
                ["name", "password_hash"],
                ["name", "name"],
                ["email"],
                ["name", null],
              ])
                await assert.rejects(
                  repo.pool.query(
                    "UPDATE user_table_preferences SET columns=$2 WHERE user_id=$1",
                    [ids[0], columns],
                  ),
                  { code: "23514" },
                );
              await assert.rejects(
                repo.pool.query(
                  "UPDATE user_table_preferences SET role='superadmin' WHERE user_id=$1",
                  [ids[0]],
                ),
                { code: "23514" },
              );
              await assert.rejects(
                repo.pool.query(
                  "UPDATE user_table_preferences SET page=0 WHERE user_id=$1",
                  [ids[0]],
                ),
                { code: "23514" },
              );
              assert.deepEqual(await store.load(first, policy), confirmed);
            },
          );
          await context.test(
            "Independent installation cannot load or write a foreign session",
            async () => {
              const independent = new PostgresTablePreferenceRepository(
                other.pool,
                new PostgresSessionGuard(),
                schema,
              );
              await assert.rejects(independent.load(first, policy), {
                code: "unauthenticated",
              });
              await assert.rejects(
                independent.save(first, schema.defaults(), policy),
                { code: "unauthenticated" },
              );
              assert.equal(
                (await other.pool.query("SELECT * FROM user_table_preferences"))
                  .rowCount,
                0,
              );
            },
          );
          await context.test(
            "Expired and completed-revoked sessions cannot read or write preferences",
            async () => {
              const confirmed = await store.load(first, policy);
              await repo.pool.query(
                "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE digest=$1",
                [first],
              );
              await assert.rejects(store.load(first, policy), {
                code: "unauthenticated",
              });
              await assert.rejects(store.save(first, confirmed, policy), {
                code: "unauthenticated",
              });
              await repo.logout(second);
              await assert.rejects(
                store.save(second, schema.defaults(), policy),
                { code: "unauthenticated" },
              );
              assert.equal(
                (await repo.pool.query("SELECT * FROM user_table_preferences"))
                  .rowCount,
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
new TablePreferenceIntegrationSuite().register();
