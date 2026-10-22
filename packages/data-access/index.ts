// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { Pool } from 'pg';
import type { Actor, UserQuery, UserInput, Draft } from '../contracts/index.js';
import type { PermissionPolicy } from '../contracts/ports.js';
import { DatabaseConnectionPolicy } from './connection-policy.js';
import { UserRowMapper } from './row-mapper.js';
import { PostgresIdentityRepository } from './identity-repository.js';
import { PostgresUserRepository } from './user-repository.js';
import { PostgresDraftRepository } from './draft-repository.js';
import { PostgresAuditRepository } from './audit-repository.js';
import { PostgresSessionGuard } from './session-guard.js';

/** Backward-compatible facade and connection owner; each adapter has one responsibility. */
export class PostgresRepository {
  readonly pool: Pool;
  readonly identities: PostgresIdentityRepository;
  readonly users: PostgresUserRepository;
  readonly drafts: PostgresDraftRepository;
  readonly audit: PostgresAuditRepository;
  constructor(url: string, policy: DatabaseConnectionPolicy) {
    this.pool = new Pool(policy.configure(url));
    const mapper = new UserRowMapper();
    this.identities = new PostgresIdentityRepository(this.pool, mapper);
    this.audit = new PostgresAuditRepository(this.pool);
    this.users = new PostgresUserRepository(this.pool, this.identities, mapper, this.audit);
    this.drafts = new PostgresDraftRepository(this.pool, new PostgresSessionGuard());
  }
  actorForSession(digest:string) { return this.identities.actorForSession(digest); }
  credentials(email:string) { return this.identities.credentials(email); }
  session(digest:string,id:string,version?:number) { return this.identities.session(digest,id,version); }
  logout(digest:string) { return this.identities.logout(digest); }
  self(id:string) { return this.identities.self(id); }
  list(query:UserQuery,exporting=false) { return this.users.list(query,exporting); }
  mutate(actor:Actor,id:string|null,input:UserInput|null,requestId:string,policy:PermissionPolicy) { return this.users.mutate(actor,id,input,requestId,policy); }
  mutateForSession(digest:string,id:string|null,input:UserInput|null,requestId:string,policy:PermissionPolicy) { return this.users.mutateForSession(digest,id,input,requestId,policy); }
  getDraft(id:string) { return this.drafts.getDraft(id); }
  saveDraft(id:string,draft:Draft) { return this.drafts.saveDraft(id,draft); }
  loadDraftForSession(digest:string,policy:PermissionPolicy) { return this.drafts.loadDraftForSession(digest,policy); }
  saveDraftForSession(digest:string,draft:Draft,policy:PermissionPolicy) { return this.drafts.saveDraftForSession(digest,draft,policy); }
  events() { return this.audit.events(); }
  async health():Promise<void> { await this.pool.query('SELECT 1'); }
}
