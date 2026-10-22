// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Pool } from "pg";
/** Ordered immutable migrations. An existing unjournaled 001 is safe to reapply by its accepted contract. */
export class MigrationRunner {
  private readonly names = Object.freeze([
    "001_initial.sql",
    "002_login_attempts.sql",
  ]);
  async apply(pool: Pool): Promise<void> {
    const migrations = await Promise.all(
      this.names.map(async (name) => {
        const sql = await readFile(
          new URL(`./migrations/${name}`, import.meta.url),
          "utf8",
        );
        return {
          name,
          sql,
          checksum: createHash("sha256").update(sql).digest("hex"),
        };
      }),
    );
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = 10000");
      await client.query("SELECT pg_advisory_xact_lock(73422001)");
      await client.query(
        "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, checksum text NOT NULL CHECK(length(checksum)=64), applied_at timestamptz NOT NULL DEFAULT now())",
      );
      for (const migration of migrations) {
        const recorded = await client.query<{ checksum: string }>(
          "SELECT checksum FROM schema_migrations WHERE name=$1",
          [migration.name],
        );
        if (recorded.rows[0]) {
          if (recorded.rows[0].checksum !== migration.checksum)
            throw new Error("migration_checksum_mismatch");
          continue;
        }
        await client.query(migration.sql);
        await client.query(
          "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
          [migration.name, migration.checksum],
        );
      }
      await client.query("COMMIT");
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
