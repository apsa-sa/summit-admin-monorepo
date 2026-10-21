// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { DomainError } from '../core/index.js';
export class PasswordHasher {
  hash(password: string): string { if (password.length < 12 || password.length > 128) throw new DomainError(422,'invalid_password'); const salt=randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
  verify(password: string, stored: string): boolean { if (password.length > 128) return false; const [salt,hash]=stored.split(':'); if (!salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false; return timingSafeEqual(Buffer.from(hash,'hex'),scryptSync(password,salt,64)); }
}
export class SessionToken { create(): string { return randomBytes(32).toString('hex'); } digest(token: string): string { return createHash('sha256').update(token).digest('hex'); } }
export class RateLimiter {
  private readonly entries=new Map<string,{count:number;until:number}>();
  check(key: string, now=Date.now()): void { for (const [k,v] of this.entries) if(v.until<=now) this.entries.delete(k); const entry=this.entries.get(key) ?? {count:0,until:now+60000}; entry.count++; this.entries.set(key,entry); if(entry.count>15) throw new DomainError(429,'rate_limited'); }
}
