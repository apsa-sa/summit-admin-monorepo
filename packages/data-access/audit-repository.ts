// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Pool, PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
import type { AuditEvent } from '../contracts/index.js';
export class PostgresAuditRepository {
  constructor(private readonly pool: Pool) {}
  async append(client:PoolClient,actor:string,action:string,resource:string,request:string):Promise<void>{await client.query('INSERT INTO audit_events(id,actor_id,action,resource_id,request_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),actor,action,resource,request]);}
  async events():Promise<AuditEvent[]>{const r=await this.pool.query<{id:string;actor_id:string;action:string;resource_id:string;request_id:string;created_at:Date}>('SELECT * FROM audit_events ORDER BY created_at DESC,id LIMIT 100');return r.rows.map(v=>({id:v.id,actorId:v.actor_id,action:v.action,resourceId:v.resource_id,requestId:v.request_id,createdAt:v.created_at.toISOString()}));}
}
