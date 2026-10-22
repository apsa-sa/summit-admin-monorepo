// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Pool } from 'pg';
import type { Draft } from '../contracts/index.js';
import type { PermissionPolicy } from '../contracts/ports.js';
import { DomainError } from '../core/index.js';
import { PostgresSessionGuard } from './session-guard.js';
export class PostgresDraftRepository {
  constructor(private readonly pool: Pool, private readonly sessions: PostgresSessionGuard) {}
  async getDraft(id:string):Promise<Draft>{const result=await this.pool.query<Draft>('SELECT name,organization,version FROM drafts WHERE user_id=$1',[id]);return result.rows[0]??{name:'',organization:'',version:0};}
  async saveDraft(id:string,draft:Draft):Promise<Draft>{const client=await this.pool.connect();try{await client.query('BEGIN');await client.query("INSERT INTO drafts(user_id) VALUES($1) ON CONFLICT DO NOTHING",[id]);const result=await client.query<Draft>('UPDATE drafts SET name=$2,organization=$3,version=version+1 WHERE user_id=$1 AND version=$4 RETURNING name,organization,version',[id,draft.name,draft.organization,draft.version]);if(!result.rows[0])throw new DomainError(409,'version_conflict');await client.query('COMMIT');return result.rows[0];}catch(error:unknown){await client.query('ROLLBACK');throw error;}finally{client.release();}}

  async loadDraftForSession(digest: string, policy: PermissionPolicy): Promise<Draft> {
    return this.authorized(digest, policy);
  }
  async saveDraftForSession(digest: string, draft: Draft, policy: PermissionPolicy): Promise<Draft> {
    return this.authorized(digest, policy, draft);
  }
  private async authorized(digest: string, policy: PermissionPolicy, draft?: Draft): Promise<Draft> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const actor = await this.sessions.require(client, digest);
      policy.require(actor, 'draft:write');
      if (draft) {
        await client.query('INSERT INTO drafts(user_id) VALUES($1) ON CONFLICT DO NOTHING', [actor.id]);
        const result = await client.query<Draft>('UPDATE drafts SET name=$2,organization=$3,version=version+1 WHERE user_id=$1 AND version=$4 RETURNING name,organization,version', [actor.id,draft.name,draft.organization,draft.version]);
        if (!result.rows[0]) throw new DomainError(409, 'version_conflict');
        await client.query('COMMIT'); return result.rows[0];
      }
      const result = await client.query<Draft>('SELECT name,organization,version FROM drafts WHERE user_id=$1', [actor.id]);
      await client.query('COMMIT'); return result.rows[0] ?? { name:'', organization:'', version:0 };
    } catch (error: unknown) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
}
