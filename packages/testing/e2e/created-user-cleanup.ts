// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { Pool } from "pg";
import { ResponseContracts } from "../../contracts/decoders.js";
import type { User } from "../../contracts/index.js";
import { DatabaseFixture } from "../support/database-fixture.js";
/** Cleans only explicitly captured synthetic rows in the approved loopback control DB. */
export class CreatedUserCleanup {
  private readonly created = new Map<string, string>();
  track(payload: unknown, expectedEmail: string): User {
    const user = new ResponseContracts().userEnvelope(payload);
    if (
      !/^[a-f0-9-]{36}@example\.test$/.test(expectedEmail) ||
      user.email !== expectedEmail ||
      user.role !== "viewer" ||
      user.version !== 0
    )
      throw new Error("Unexpected synthetic creation response");
    this.created.set(user.id, expectedEmail);
    return user;
  }
  async clean(): Promise<void> {
    if (this.created.size === 0) return;
    if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL)
      throw new Error("Approved isolated control DB required");
    const approval = new DatabaseFixture();
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    try {
      for (const [id, email] of this.created) {
        const found = await pool.query<{ email: string; role: string }>(
          "SELECT email,role FROM users WHERE id=$1",
          [id],
        );
        if (
          found.rows[0] &&
          (found.rows[0].email !== email || found.rows[0].role !== "viewer")
        )
          throw new Error("Synthetic row ownership changed; cleanup refused");
        await pool.query(
          "DELETE FROM users WHERE id=$1 AND email=$2 AND role='viewer'",
          [id, email],
        );
        this.created.delete(id);
      }
    } finally {
      const results = await Promise.allSettled([pool.end(), approval.close()]);
      if (results.some((result) => result.status === "rejected"))
        throw new Error("Synthetic cleanup connection close failed");
    }
  }
}
