// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PostgresRepository } from '../../packages/data-access/index.js';
import { PasswordHasher } from '../../packages/security/index.js';
export class DatabaseCommand {
 async run():Promise<void>{const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is required');const repo=new PostgresRepository(url);try{
 if(process.argv[2]==='migrate'){await repo.pool.query(await readFile(new URL('../../packages/data-access/migrations/001_initial.sql',import.meta.url),'utf8'));console.log('Migration applied.');}
 else if(process.argv[2]==='seed'){const password=process.env.SEED_ADMIN_PASSWORD;if(!password)throw new Error('SEED_ADMIN_PASSWORD is required (12-128 characters)');const hash=new PasswordHasher().hash(password);await repo.pool.query("INSERT INTO users(id,name,email,role,status,password_hash) VALUES($1,'مدير القمة','admin@summit.test','admin','active',$2) ON CONFLICT(email) DO NOTHING",[randomUUID(),hash]);const names=['ليان الحربي','عمر العتيبي','نورة القحطاني','خالد الدوسري','سارة الغامدي','أحمد الزهراني','ريم الشهري','عبدالله المطيري','هند السبيعي','يوسف المالكي','دانة العنزي','محمد السالم'];for(const [i,name] of names.entries())await repo.pool.query('INSERT INTO users(id,name,email,role,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(email) DO NOTHING',[randomUUID(),name,`member${i+1}@summit.test`,i%3===0?'editor':'viewer',i%5===0?'invited':'active']);console.log('Demo seed applied; existing users and passwords preserved.');}
 else throw new Error('Use migrate or seed');}finally{await repo.pool.end();}}
}
await new DatabaseCommand().run();
