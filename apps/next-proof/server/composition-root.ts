// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
import { PostgresRepository } from '../../../packages/data-access/index.js';
import { DatabaseConnectionPolicy } from '../../../packages/data-access/connection-policy.js';
import { SessionService } from '../../../packages/auth/index.js';
import { SessionProfileService } from '../../../packages/auth/profile-service.js';
import { SessionToken } from '../../../packages/security/index.js';
import { SessionController } from './session-controller.js';

/** Request-scoped proof composition; no singleton connection, state, or hidden locator. */
export class ProofCompositionRoot {
  async handle(request: Request): Promise<Response> {
    const url = process.env.DATABASE_URL;
    const origin = process.env.PROOF_ORIGIN;
    if (!url || !origin) {
      return Response.json({ error: 'proof_not_configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
    const repository = new PostgresRepository(url, new DatabaseConnectionPolicy());
    try {
      const service = new SessionProfileService(repository, new SessionService(repository), new SessionToken());
      return await new SessionController(service, origin).handle(request);
    } finally {
      await repository.pool.end();
    }
  }
}
