// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { createHash } from "node:crypto";
import type { Pool } from "pg";
import type { LoginAttemptPolicy } from "../contracts/ports.js";
import { DomainError } from "../core/index.js";
/** Shared admission across request scopes/workers. Peer hashes are pseudonymous, not anonymous. */
export class PostgresRateLimiter implements LoginAttemptPolicy {
  constructor(
    private readonly pool: Pool,
    private readonly capacity = 10000,
  ) {
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 10000)
      throw new DomainError(422, "invalid_number");
  }
  async check(peer: string): Promise<void> {
    if (!peer || peer.length > 256) throw new DomainError(429, "rate_limited");
    const key = createHash("sha256").update(peer).digest("hex");
    const client = await this.pool.connect();
    let admitted = false;
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = 3000");
      await client.query("SELECT pg_advisory_xact_lock(73422002)");
      await client.query("DELETE FROM request_limits WHERE resets_at <= now()");
      const existing = await client.query(
        "SELECT 1 FROM request_limits WHERE key=$1",
        [key],
      );
      if (existing.rowCount === 0) {
        const result = await client.query<{ total: string }>(
          "SELECT count(*) AS total FROM request_limits",
        );
        const total = Number(result.rows[0]?.total);
        if (!Number.isSafeInteger(total) || total < 0 || total >= this.capacity)
          throw new DomainError(429, "rate_limited");
      }
      // Saturation prevents counter overflow while retaining denial until expiry.
      const result = await client.query<{ count: number }>(
        "INSERT INTO request_limits(key,count,resets_at) VALUES($1,1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET count=LEAST(request_limits.count+1,16) RETURNING count",
        [key],
      );
      const count = result.rows[0]?.count;
      if (
        !Number.isSafeInteger(count) ||
        count === undefined ||
        count < 1 ||
        count > 16
      )
        throw new Error("Invalid admission result");
      admitted = count <= 15;
      await client.query("COMMIT");
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    // Rejections remain counted: do not throw before commit and roll them back.
    if (!admitted) throw new DomainError(429, "rate_limited");
  }
}
