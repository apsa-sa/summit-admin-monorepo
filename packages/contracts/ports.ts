// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Actor, User, UserPage, UserQuery, UserInput, Draft, AuditEvent } from './index.js';
export interface PermissionPolicy {
  require(actor: Actor, action: string, resource?: User, input?: UserInput): void;
}
export interface IdentityStore {
  actorForSession(digest: string): Promise<Actor | null>;
  credentials(email: string): Promise<{ user: User; hash: string } | null>;
  session(digest: string, id: string, expectedVersion?: number): Promise<void>;
  logout(digest: string): Promise<void>;
  self(id: string): Promise<User>;
}
export interface UserStore {
  list(query: UserQuery, exporting?: boolean): Promise<UserPage>;
  mutateForSession(digest: string, id: string | null, input: UserInput | null, requestId: string, policy: PermissionPolicy): Promise<User | null>;
}
export interface DraftStore {
  loadDraftForSession(digest: string, policy: PermissionPolicy): Promise<Draft>;
  saveDraftForSession(digest: string, draft: Draft, policy: PermissionPolicy): Promise<Draft>;
}
export interface AuditStore { events(): Promise<AuditEvent[]>; }
export interface HealthStore { health(): Promise<void>; }
