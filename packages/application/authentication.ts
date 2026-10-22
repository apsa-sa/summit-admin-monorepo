// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { IdentityStore, LoginAttemptPolicy } from '../contracts/ports.js';
import { DomainError, Validation } from '../core/index.js';
import { SessionService } from '../auth/index.js';
import { PasswordHasher, SessionToken } from '../security/index.js';
export class AuthenticationService {
  constructor(private readonly identities: IdentityStore, private readonly sessions: SessionService,
    private readonly hasher: PasswordHasher, private readonly tokens: SessionToken, private readonly limiter: LoginAttemptPolicy) {}
  async login(value: unknown, peer: string) {
    await this.limiter.check(peer);
    const input = Validation.record(value);
    const email = Validation.text(input.email,254).toLowerCase();
    // Password whitespace is significant; never normalize a credential as display text.
    const password = input.password;
    if (typeof password !== 'string' || password.length < 1 || password.length > 128) throw new DomainError(422,'invalid_password');
    const found = await this.identities.credentials(email);
    const dummy = '00000000000000000000000000000000:' + '0'.repeat(128);
    if (!this.hasher.verify(password, found?.hash ?? dummy) || !found) throw new DomainError(401,'invalid_credentials');
    const token = this.tokens.create();
    await this.identities.session(this.tokens.digest(token), found.user.id, found.user.version);
    return { user:found.user, token };
  }
  authenticate(digest: string) { return this.sessions.authenticate(digest); }
  async me(digest: string) { return this.identities.self((await this.authenticate(digest)).id); }
  async logout(digest: string): Promise<void> { await this.identities.logout(digest); }
}
