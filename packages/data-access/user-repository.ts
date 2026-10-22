// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import type { Actor, User, UserPage, UserQuery, UserInput } from '../contracts/index.js';
import type { PermissionPolicy, IdentityStore } from '../contracts/ports.js';
import { DomainError, Validation } from '../core/index.js';
import { UserRowMapper, type UserRow } from './row-mapper.js';
import { PostgresAuditRepository } from './audit-repository.js';
export class PostgresUserRepository {
  constructor(private readonly pool: Pool, private readonly identities: IdentityStore, private readonly mapper: UserRowMapper, private readonly audit: PostgresAuditRepository) {}
  async list(query:UserQuery,exporting=false):Promise<UserPage> { const values=[`%${query.search.replaceAll('\\','\\\\').replaceAll('%','\\%').replaceAll('_','\\_')}%`,query.role,query.status]; const where="(name ILIKE $1 OR email ILIKE $1) AND ($2='' OR role=$2) AND ($3='' OR status=$3)"; const count=await this.pool.query<{total:string}>(`SELECT count(*) AS total FROM users WHERE ${where}`,values);const total=Validation.integer(Number(count.rows[0]?.total),0);if(exporting&&total>10000) throw new DomainError(422,'export_limit'); const size=exporting?10000:8; const result=await this.pool.query<UserRow>(`SELECT * FROM users WHERE ${where} ORDER BY ${query.sort==='name'?'name ASC':'created_at DESC'},id LIMIT $4 OFFSET $5`,[...values,size,exporting?0:(query.page-1)*size]);return {rows:result.rows.map(row=>this.mapper.user(row)),total,page:query.page,pageSize:size}; }
  async mutate(actor:Actor,id:string|null,input:UserInput|null,requestId:string,policy:PermissionPolicy):Promise<User|null> {
    return this.executeMutation(actor,id,input,requestId,policy);
  }
  /** HTTP callers must bind authorization to the actual session, not a stale Actor. */
  async mutateForSession(digest:string,id:string|null,input:UserInput|null,requestId:string,policy:PermissionPolicy):Promise<User|null> {
    const actor=await this.identities.actorForSession(digest);
    if(!actor)throw new DomainError(401,'unauthenticated');
    return this.executeMutation(actor,id,input,requestId,policy,digest);
  }
  private async executeMutation(actor:Actor,id:string|null,input:UserInput|null,requestId:string,policy:PermissionPolicy,digest?:string):Promise<User|null> {
    const client=await this.pool.connect();try{await client.query('BEGIN');let existing:User|undefined;
    // Lock participating users in one deterministic order. This prevents self-edit
    // lock upgrades and opposite-direction administrator edits from deadlocking.
    const ids=id?[actor.id,id]:[actor.id];
    const locked=await client.query<UserRow>('SELECT * FROM users WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE',[ids]);
    const live=locked.rows.find(row=>row.id===actor.id);
    if(!live||live.status!=='active')throw new DomainError(401,'unauthenticated');
    const currentActor={id:live.id,role:Validation.role(live.role)};
    if(digest!==undefined){
      const session=await client.query("SELECT digest FROM sessions WHERE digest=$1 AND user_id=$2 AND expires_at>now() FOR SHARE",[digest,currentActor.id]);
      if(!session.rows[0])throw new DomainError(401,'unauthenticated');
    }
    if(id){const row=locked.rows.find(row=>row.id===id);if(!row)throw new DomainError(404,'not_found');existing=this.mapper.user(row);}
    const action=id?(input?'users:update':'users:delete'):'users:create';policy.require(currentActor,action,existing,input??undefined);
    const target=id??randomUUID();let output:User|null=null;
    if(input){if(existing&&input.version!==existing.version)throw new DomainError(409,'version_conflict'); const result=existing?await client.query<UserRow>('UPDATE users SET name=$1,email=$2,role=$3,status=$4,version=version+1 WHERE id=$5 RETURNING *',[input.name,input.email,input.role,input.status,target]):await client.query<UserRow>('INSERT INTO users(id,name,email,role,status) VALUES($1,$2,$3,$4,$5) RETURNING *',[target,input.name,input.email,input.role,input.status]); const row=result.rows[0];if(!row)throw new DomainError(500,'storage_error');output=this.mapper.user(row);
    if(existing&&(existing.role!==input.role||existing.status!==input.status))await client.query('DELETE FROM sessions WHERE user_id=$1',[target]);}
    else await client.query('DELETE FROM users WHERE id=$1',[target]);
    await this.audit.append(client,actor.id,action,target,requestId);await client.query('COMMIT');return output;
    }catch(error:unknown){await client.query('ROLLBACK');if(typeof error==='object'&&error!==null&&'code' in error&&error.code==='23505')throw new DomainError(409,'email_exists');throw error;}finally{client.release();}
  }
}
