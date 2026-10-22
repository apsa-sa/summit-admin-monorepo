// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Pool } from 'pg';
import type { Actor, User } from '../contracts/index.js';
import type { IdentityStore } from '../contracts/ports.js';
import { DomainError, Validation } from '../core/index.js';
import { UserRowMapper, type UserRow } from './row-mapper.js';
export class PostgresIdentityRepository implements IdentityStore {
  constructor(private readonly pool: Pool, private readonly mapper: UserRowMapper) {}
  async actorForSession(digest:string):Promise<Actor|null> { const result=await this.pool.query<UserRow>("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.digest=$1 AND s.expires_at>now() AND u.status='active'",[digest]);const row=result.rows[0]; return row?{id:row.id,role:Validation.role(row.role)}:null; }
  async credentials(email:string):Promise<{user:User;hash:string}|null> {const result=await this.pool.query<UserRow>("SELECT * FROM users WHERE email=$1 AND status='active'",[email]); const row=result.rows[0];return row?.password_hash?{user:this.mapper.user(row),hash:row.password_hash}:null;}
  async session(digest:string,id:string,expectedVersion?:number):Promise<void> {
    const client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      // Same lock order as role changes: user before session. A stale login cannot
      // issue a new session after credentials were checked against an old version.
      const result=await client.query<UserRow>("SELECT * FROM users WHERE id=$1 AND status='active' FOR SHARE",[id]);
      const row=result.rows[0];
      if(!row || (expectedVersion!==undefined && Validation.integer(row.version)!==expectedVersion))throw new DomainError(401,'unauthenticated');
      await client.query("INSERT INTO sessions(digest,user_id,expires_at) VALUES($1,$2,now()+interval '8 hours')",[digest,id]);
      await client.query('COMMIT');
    } catch(error:unknown) {await client.query('ROLLBACK');throw error;} finally {client.release();}
  }
  async logout(digest:string):Promise<void> {await this.pool.query('DELETE FROM sessions WHERE digest=$1',[digest]);}
  async self(id:string):Promise<User> { const result=await this.pool.query<UserRow>('SELECT * FROM users WHERE id=$1',[id]);const row=result.rows[0];if(!row) throw new DomainError(404,'not_found');return this.mapper.user(row); }
}
