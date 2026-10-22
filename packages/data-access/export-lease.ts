// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Pool } from "pg";
import type { ExportLeasePort } from "../contracts/pdf.js";
import { DomainError } from "../core/index.js";
/** Transaction-scoped advisory lock: no schema change, hidden process singleton or cross-installation state. */
export class PostgresExportLease implements ExportLeasePort {
  constructor(private readonly pool: Pool) {}
  async run<T>(operation: () => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL idle_in_transaction_session_timeout = '20s'");
      const result = await client.query<{ acquired: boolean }>(
        "SELECT pg_try_advisory_xact_lock(1398099277, 1) AS acquired");
      if (result.rows[0]?.acquired !== true) throw new DomainError(429, "pdf_export_busy");
      const value = await operation();
      await client.query("COMMIT");
      return value;
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
}
