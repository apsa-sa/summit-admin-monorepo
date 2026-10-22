// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import { Pool, type PoolClient, type QueryResultRow } from 'pg';
import { randomUUID } from 'node:crypto';
import { DatabaseConnectionPolicy } from './connection-policy.js';
import type { Actor, User, UserPage, UserQuery, UserInput, Draft, AuditEvent } from '../contracts/index.js';
import { DomainError, Validation } from '../core/index.js';
import { AuthorizationPolicy } from '../core-rbac/index.js';
interface UserRow extends QueryResultRow { id:string;name:string;email:string;role:unknown;status:unknown;version:unknown;created_at:Date;password_hash:string|null; }
export class PostgresRepository {
  readonly pool: Pool;
  constructor(url: string, policy: DatabaseConnectionPolicy) { this.pool=new Pool(policy.configure(url)); }
  private user(row: UserRow): User { return {id:row.id,name:row.name,email:row.email,role:Validation.role(row.role),status:Validation.status(row.status),version:Validation.integer(row.version),createdAt:row.created_at.toISOString()}; }
  async actorForSession(digest:string):Promise<Actor|null> { const result=await this.pool.query<UserRow>("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.digest=$1 AND s.expires_at>now() AND u.status='active'",[digest]);const row=result.rows[0]; return row?{id:row.id,role:Validation.role(row.role)}:null; }
  async credentials(email:string):Promise<{user:User;hash:string}|null> {const result=await this.pool.query<UserRow>("SELECT * FROM users WHERE email=$1 AND status='active'",[email]); const row=result.rows[0];return row?.password_hash?{user:this.user(row),hash:row.password_hash}:null;}
  async session(digest:string,id:string):Promise<void> {await this.pool.query("INSERT INTO sessions(digest,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[digest,id]);}
  async logout(digest:string):Promise<void> {await this.pool.query('DELETE FROM sessions WHERE digest=$1',[digest]);}
  async self(id:string):Promise<User> { const result=await this.pool.query<UserRow>('SELECT * FROM users WHERE id=$1',[id]);const row=result.rows[0];if(!row) throw new DomainError(404,'not_found');return this.user(row); }
  async list(query:UserQuery,exporting=false):Promise<UserPage> { const values=[`%${query.search.replaceAll('\\','\\\\').replaceAll('%','\\%').replaceAll('_','\\_')}%`,query.role,query.status]; const where="(name ILIKE $1 OR email ILIKE $1) AND ($2='' OR role=$2) AND ($3='' OR status=$3)"; const count=await this.pool.query<{total:string}>(`SELECT count(*) AS total FROM users WHERE ${where}`,values);const total=Validation.integer(Number(count.rows[0]?.total),0);if(exporting&&total>10000) throw new DomainError(422,'export_limit'); const size=exporting?10000:8; const result=await this.pool.query<UserRow>(`SELECT * FROM users WHERE ${where} ORDER BY ${query.sort==='name'?'name ASC':'created_at DESC'},id LIMIT $4 OFFSET $5`,[...values,size,exporting?0:(query.page-1)*size]);return {rows:result.rows.map(row=>this.user(row)),total,page:query.page,pageSize:size}; }
  async mutate(actor:Actor,id:string|null,input:UserInput|null,requestId:string,policy:AuthorizationPolicy):Promise<User|null> {
    const client=await this.pool.connect();try{await client.query('BEGIN');let existing:User|undefined;
    // Recheck the live actor under the transaction so role changes cannot race writes.
    const acting=await client.query<UserRow>("SELECT * FROM users WHERE id=$1 AND status='active' FOR SHARE",[actor.id]);const live=acting.rows[0];if(!live) throw new DomainError(401,'unauthenticated');const currentActor={id:live.id,role:Validation.role(live.role)};
    if(id){const locked=await client.query<UserRow>('SELECT * FROM users WHERE id=$1 FOR UPDATE',[id]);if(!locked.rows[0])throw new DomainError(404,'not_found');existing=this.user(locked.rows[0]);}
    const action=id?(input?'users:update':'users:delete'):'users:create';policy.require(currentActor,action,existing,input??undefined);
    const target=id??randomUUID();let output:User|null=null;
    if(input){if(existing&&input.version!==existing.version)throw new DomainError(409,'version_conflict'); const result=existing?await client.query<UserRow>('UPDATE users SET name=$1,email=$2,role=$3,status=$4,version=version+1 WHERE id=$5 RETURNING *',[input.name,input.email,input.role,input.status,target]):await client.query<UserRow>('INSERT INTO users(id,name,email,role,status) VALUES($1,$2,$3,$4,$5) RETURNING *',[target,input.name,input.email,input.role,input.status]); const row=result.rows[0];if(!row)throw new DomainError(500,'storage_error');output=this.user(row);
    if(existing&&(existing.role!==input.role||existing.status!==input.status))await client.query('DELETE FROM sessions WHERE user_id=$1',[target]);}
    else await client.query('DELETE FROM users WHERE id=$1',[target]);
    await this.audit(client,actor.id,action,target,requestId);await client.query('COMMIT');return output;
    }catch(error:unknown){await client.query('ROLLBACK');if(typeof error==='object'&&error!==null&&'code' in error&&error.code==='23505')throw new DomainError(409,'email_exists');throw error;}finally{client.release();}
  }
  private async audit(client:PoolClient,actor:string,action:string,resource:string,request:string):Promise<void>{await client.query('INSERT INTO audit_events(id,actor_id,action,resource_id,request_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),actor,action,resource,request]);}
  async getDraft(id:string):Promise<Draft>{const result=await this.pool.query<Draft>('SELECT name,organization,version FROM drafts WHERE user_id=$1',[id]);return result.rows[0]??{name:'',organization:'',version:0};}
  async saveDraft(id:string,draft:Draft):Promise<Draft>{const client=await this.pool.connect();try{await client.query('BEGIN');await client.query("INSERT INTO drafts(user_id) VALUES($1) ON CONFLICT DO NOTHING",[id]);const result=await client.query<Draft>('UPDATE drafts SET name=$2,organization=$3,version=version+1 WHERE user_id=$1 AND version=$4 RETURNING name,organization,version',[id,draft.name,draft.organization,draft.version]);if(!result.rows[0])throw new DomainError(409,'version_conflict');await client.query('COMMIT');return result.rows[0];}catch(error:unknown){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  async events():Promise<AuditEvent[]>{const r=await this.pool.query<{id:string;actor_id:string;action:string;resource_id:string;request_id:string;created_at:Date}>('SELECT * FROM audit_events ORDER BY created_at DESC,id LIMIT 100');return r.rows.map(v=>({id:v.id,actorId:v.actor_id,action:v.action,resourceId:v.resource_id,requestId:v.request_id,createdAt:v.created_at.toISOString()}));}
}
