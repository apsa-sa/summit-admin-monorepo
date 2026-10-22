// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PasswordHasher,SessionToken } from '../../security/index.js';
import { Validation } from '../../core/index.js';
import { DatabaseFixture } from '../support/database-fixture.js';
export interface JourneyAccount {id:string;email:string;password:string;}
export class JourneyFixture {
  static readonly origin='http://127.0.0.1:3210';
  private pool():Pool{
    if(process.env.DATABASE_URL!==process.env.TEST_DATABASE_URL)throw new Error('Journey server must use the approved disposable test control database');
    return new Pool({connectionString:process.env.TEST_DATABASE_URL});
  }
  async setup():Promise<void>{
    const approval=new DatabaseFixture();const pool=this.pool();
    try{
      await pool.query(await readFile(new URL('../../data-access/migrations/001_initial.sql',import.meta.url),'utf8'));
      const accounts:Record<string,JourneyAccount>={};
      for(const role of ['admin','editor','viewer']){
        const id=randomUUID();const password=` ${new SessionToken().create()} `;const email=`${id}@example.test`;
        await pool.query('INSERT INTO users(id,name,email,role,status,password_hash) VALUES($1,$2,$3,$4,$5,$6)',[id,`Journey ${role}`,email,role,'active',new PasswordHasher().hash(password)]);
        accounts[role]={id,email,password};
      }
      // Synthetic, per-run credentials stay in process memory, never source or logs.
      process.env.SUMMIT_JOURNEY_DATA=JSON.stringify(accounts);
    }finally{await pool.end();await approval.close();}
  }
  account(role:'admin'|'editor'|'viewer'):JourneyAccount{
    const payload:unknown=JSON.parse(process.env.SUMMIT_JOURNEY_DATA??'null');const row=Validation.record(Validation.record(payload)[role]);
    if(typeof row.password!=='string'||row.password.length>128)throw new Error('Invalid synthetic test credential');
    return {id:Validation.text(row.id,36),email:Validation.text(row.email,254),password:row.password};
  }
  async teardown():Promise<void>{
    if(!process.env.SUMMIT_JOURNEY_DATA)return;
    const approval=new DatabaseFixture();const pool=this.pool();
    try{for(const role of ['admin','editor','viewer'] as const)await pool.query('DELETE FROM users WHERE id=$1',[this.account(role).id]);}
    finally{delete process.env.SUMMIT_JOURNEY_DATA;await pool.end();await approval.close();}
  }
}
