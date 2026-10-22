// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { QueryResultRow } from 'pg';
import type { User } from '../contracts/index.js';
import { Validation } from '../core/index.js';
export interface UserRow extends QueryResultRow { id:string;name:string;email:string;role:unknown;status:unknown;version:unknown;created_at:Date;password_hash:string|null; }
export class UserRowMapper {
  user(row: UserRow): User { return {id:row.id,name:row.name,email:row.email,role:Validation.role(row.role),status:Validation.status(row.status),version:Validation.integer(row.version),createdAt:row.created_at.toISOString()}; }
}
