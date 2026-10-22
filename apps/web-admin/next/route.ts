// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { AdminCompositionRoot } from "../server/composition-root.js";
/** R3: framework adapter only; original application/controller contracts are retained. */
export class NextAdminRoute {
  static async handle(request: Request): Promise<Response> {
    const url = process.env.DATABASE_URL,
      origin = process.env.APP_ORIGIN;
    if (!url || !origin)
      return Response.json(
        { error: "not_configured" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    try {
      const root = new AdminCompositionRoot(url, origin, "database");
      try {
        // Header attribution is disabled unless the deployment enforces a trusted proxy boundary.
        const header = process.env.TRUSTED_CLIENT_IP_HEADER;
        const peer = header
          ? (request.headers.get(header) ?? "shared")
          : "shared";
        return await root.controller.handle(request, peer);
      } finally {
        await root.close();
      }
    } catch {
      return Response.json(
        { error: "internal_error" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
}
