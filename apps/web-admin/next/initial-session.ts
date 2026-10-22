// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { User } from "../../../packages/contracts/index.js";
import { ResponseContracts } from "../../../packages/contracts/decoders.js";
import { AdminCompositionRoot } from "../server/composition-root.js";
/** Server-only request adapter; returns an explicitly decoded DTO, never service instances. */
export class AdminInitialSession {
  async load(token: string | undefined): Promise<User | null> {
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
    const url = process.env.DATABASE_URL,
      origin = process.env.APP_ORIGIN;
    if (!url || !origin) return null;
    try {
      const root = new AdminCompositionRoot(url, origin, "database");
      try {
        const request = new Request(`${origin}/api/me`, {
          headers: { cookie: `summit_session=${token}` },
        });
        const response = await root.controller.handle(request, "ssr");
        if (!response.ok) return null;
        const value: unknown = await response.json();
        return new ResponseContracts().userEnvelope(value);
      } finally {
        await root.close();
      }
    } catch {
      return null;
    }
  }
}
