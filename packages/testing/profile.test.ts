// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { SessionProfileService, type SessionProfileStore } from '../auth/profile-service.js';
import { SessionService } from '../auth/index.js';
import { SessionToken } from '../security/index.js';
import type { Actor, User } from '../contracts/index.js';
import { SessionController } from '../../apps/next-proof/server/session-controller.js';

class ProfileStore implements SessionProfileStore {
  readonly user: User = { id: randomUUID(), name: 'Test', email: 'user@example.test', role: 'viewer', status: 'active', version: 0, createdAt: new Date(0).toISOString() };
  valid = true;
  logoutFails = false;
  async actorForSession(): Promise<Actor | null> { return this.valid ? this.user : null; }
  async self(): Promise<User> { return this.user; }
  async logout(): Promise<void> { if (this.logoutFails) throw new Error('private database detail'); this.valid = false; }
}
class ProfileTests {
  register(): void {
    test('Profile application service rejects malformed token before storage access', async () => {
      const store = new ProfileStore();
      const service = new SessionProfileService(store, new SessionService(store), new SessionToken());
      await assert.rejects(service.profile('bad'), { code: 'unauthenticated' });
    });
    test('Profile application service revokes a session and rejects reuse', async () => {
      const store = new ProfileStore(); const tokens = new SessionToken(); const token = tokens.create();
      const service = new SessionProfileService(store, new SessionService(store), tokens);
      assert.equal((await service.profile(token)).id, store.user.id);
      await service.signOut(token);
      await assert.rejects(service.profile(token), { code: 'unauthenticated' });
      await service.signOut(token); // Idempotent after expiry/revocation.
    });
    test('HTTP contract returns 401, safe JSON and no-store for missing session', async () => {
      const store = new ProfileStore();
      const controller = new SessionController(new SessionProfileService(store, new SessionService(store), new SessionToken()), 'http://localhost:3211');
      const response = await controller.handle(new Request('http://localhost:3211/api/session'));
      const body: unknown = await response.json();
      assert.equal(response.status, 401); assert.equal(response.headers.get('Cache-Control'), 'no-store');
      assert.ok(typeof body === 'object' && body !== null && 'error' in body && body.error === 'unauthenticated');
      assert.ok(response.headers.get('X-Request-Id'));
    });
    test('HTTP security blocks cross-origin logout without revoking the session', async () => {
      const store = new ProfileStore();
      const controller = new SessionController(new SessionProfileService(store, new SessionService(store), new SessionToken()), 'http://localhost:3211');
      const response = await controller.handle(new Request('http://localhost:3211/api/session/logout', { method: 'POST', headers: { origin: 'https://untrusted.example' } }));
      assert.equal(response.status, 403); assert.equal(store.valid, true);
    });
    test('HTTP security never reports successful logout when storage fails', async () => {
      const store = new ProfileStore(); store.logoutFails = true;
      const controller = new SessionController(new SessionProfileService(store, new SessionService(store), new SessionToken()), 'https://example.test');
      const response = await controller.handle(new Request('https://example.test/api/session/logout', { method: 'POST', headers: { origin: 'https://example.test', cookie: `summit_session=${new SessionToken().create()}` } }));
      assert.equal(response.status, 500); assert.equal(response.headers.has('Set-Cookie'), false);
      assert.ok(!(await response.text()).includes('private database detail'));
    });
    test('HTTP logout clears HttpOnly cookie with Secure on HTTPS', async () => {
      const store = new ProfileStore();
      const controller = new SessionController(new SessionProfileService(store, new SessionService(store), new SessionToken()), 'https://example.test');
      const response = await controller.handle(new Request('https://example.test/api/session/logout', { method: 'POST', headers: { origin: 'https://example.test', cookie: `summit_session=${new SessionToken().create()}` } }));
      assert.equal(response.status, 200);
      for (const flag of ['HttpOnly', 'SameSite=Strict', 'Max-Age=0', 'Secure']) assert.ok(response.headers.get('Set-Cookie')?.includes(flag));
    });
  }
}
new ProfileTests().register();
