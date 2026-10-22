// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import type { IdentityStore } from "../contracts/ports.js";
import { AuthenticationService } from "../application/authentication.js";
import { SessionService } from "../auth/index.js";
import { PasswordHasher, SessionToken } from "../security/index.js";
import { PostgresRateLimiter } from "../data-access/rate-limiter.js";
import { Pool } from "pg";
class LoginAdmissionSuite {
  register(): void {
    test("Authentication awaits admission and does not read credentials when shared storage fails", async () => {
      let reads = 0;
      const identities: IdentityStore = {
        actorForSession: async () => null,
        credentials: async () => {
          reads++;
          return null;
        },
        session: async () => {},
        logout: async () => {},
        self: async () => {
          throw new Error("not_requested");
        },
      };
      const failure = new Error("admission_unavailable");
      const service = new AuthenticationService(
        identities,
        new SessionService(identities),
        new PasswordHasher(),
        new SessionToken(),
        {
          check: async () => {
            await Promise.resolve();
            throw failure;
          },
        },
      );
      await assert.rejects(
        service.login(
          { email: "nobody@example.test", password: "not-a-secret-fixture" },
          "peer",
        ),
        (error) => error === failure,
      );
      assert.equal(reads, 0);
    });
    test("Shared admission validates its capacity before opening a database connection", async () => {
      const pool = new Pool({ max: 1 });
      try {
        for (const capacity of [0, -1, 1.5, NaN, Infinity, 10001])
          assert.throws(() => new PostgresRateLimiter(pool, capacity), {
            code: "invalid_number",
          });
      } finally {
        await pool.end();
      }
    });
  }
}
new LoginAdmissionSuite().register();
