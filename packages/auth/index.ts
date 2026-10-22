// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type { Actor } from '../contracts/index.js';
import { DomainError } from '../core/index.js';
export interface SessionStore { actorForSession(digest: string): Promise<Actor | null>; }
export class SessionService {
 constructor(private readonly store: SessionStore) {}
 async authenticate(digest: string): Promise<Actor> { const actor=await this.store.actorForSession(digest); if(!actor) throw new DomainError(401,'unauthenticated'); return actor; }
}
