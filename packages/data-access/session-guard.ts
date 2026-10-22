// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { PoolClient } from 'pg';
import type { Actor } from '../contracts/index.js';
import { DomainError, Validation } from '../core/index.js';
/** Transactional authorization; acquire the user lock before the session lock. */
export class PostgresSessionGuard {
  async require(client: PoolClient, digest: string): Promise<Actor> {
    const users = await client.query<{id:string; role:unknown}>(
      "SELECT id,role FROM users WHERE id=(SELECT user_id FROM sessions WHERE digest=$1) AND status='active' FOR SHARE", [digest]);
    const user = users.rows[0];
    if (!user) throw new DomainError(401,'unauthenticated');
    const sessions = await client.query('SELECT digest FROM sessions WHERE digest=$1 AND user_id=$2 AND expires_at>now() FOR SHARE', [digest,user.id]);
    if (!sessions.rows[0]) throw new DomainError(401,'unauthenticated');
    return { id:user.id, role:Validation.role(user.role) };
  }
}
