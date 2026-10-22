// © 2026 APSA / eng:samer alhamid — apsa.sa, Arab Planets Summit Architectural.
// SPDX-License-Identifier: MIT
import type { User } from '../contracts/index.js';
import type { SessionStore } from './index.js';
import { SessionService } from './index.js';
import { DomainError } from '../core/index.js';
import { SessionToken } from '../security/index.js';

export interface SessionProfileStore extends SessionStore {
  self(id: string): Promise<User>;
  logout(digest: string): Promise<void>;
}

/** Framework-independent application service; credentials never reach presentation. */
export class SessionProfileService {
  constructor(
    private readonly store: SessionProfileStore,
    private readonly sessions: SessionService,
    private readonly tokens: SessionToken,
  ) {}

  private digest(token: string): string {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new DomainError(401, 'unauthenticated');
    return this.tokens.digest(token);
  }

  async profile(token: string): Promise<User> {
    const actor = await this.sessions.authenticate(this.digest(token));
    return this.store.self(actor.id);
  }

  async signOut(token: string): Promise<void> {
    // Idempotent revocation: expired/deleted sessions can still clear their cookie.
    await this.store.logout(this.digest(token));
  }
}
