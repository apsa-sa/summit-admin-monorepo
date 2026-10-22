// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
import { randomUUID } from 'node:crypto';
import { SessionProfileService } from '../../../packages/auth/profile-service.js';
import { DomainError } from '../../../packages/core/index.js';

/** HTTP adapter only: cookie, origin, response headers and safe error mapping. */
export class SessionController {
  constructor(private readonly service: SessionProfileService, private readonly origin: string) {}

  private token(request: Request): string {
    const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim())
      .find(value => value.startsWith('summit_session='));
    return cookie?.slice('summit_session='.length) ?? '';
  }

  async handle(request: Request): Promise<Response> {
    const requestId = randomUUID();
    const headers = new Headers({
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'X-Request-Id': requestId, 'Content-Type': 'application/json; charset=utf-8',
    });
    try {
      if (request.method === 'GET') {
        return Response.json({ user: await this.service.profile(this.token(request)) }, { headers });
      }
      if (request.method !== 'POST') throw new DomainError(405, 'method_not_allowed');
      if (request.headers.get('origin') !== this.origin) throw new DomainError(403, 'invalid_origin');
      await this.service.signOut(this.token(request));
      headers.set('Set-Cookie', `summit_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${new URL(this.origin).protocol === 'https:' ? '; Secure' : ''}`);
      return Response.json({ ok: true }, { headers });
    } catch (error: unknown) {
      const failure = error instanceof DomainError ? error : new DomainError(500, 'internal_error');
      return Response.json({ error: failure.code, requestId }, { status: failure.status, headers });
    }
  }
}
