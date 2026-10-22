// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type { Actor, User, UserInput } from '../contracts/index.js';
import { DomainError } from '../core/index.js';
export class AuthorizationPolicy {
  require(actor: Actor, action: string, resource?: User, input?: UserInput): void {
    const grants: Record<string, readonly string[]> = {admin:['users:read','users:create','users:update','users:delete','users:export','audit:read','draft:write'],editor:['users:read','users:update','users:export','draft:write'],viewer:['users:read','draft:write']};
    if (!grants[actor.role]?.includes(action)) throw new DomainError(403,'forbidden');
    if (action === 'users:update' && resource && input) {
      if (actor.id === resource.id && (input.role !== resource.role || input.status !== resource.status)) throw new DomainError(403,'self_privilege_change');
      if (actor.role === 'editor' && (resource.role === 'admin' || input.role !== resource.role || input.status !== resource.status)) throw new DomainError(403,'forbidden');
    }
    if (action === 'users:delete' && (resource?.id === actor.id || resource?.role === 'admin')) throw new DomainError(403,'protected_user');
  }
}
