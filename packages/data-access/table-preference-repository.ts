// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Pool } from "pg";
import type {
  UserTablePreferences,
  TablePreferenceStore,
} from "../contracts/table-preferences.js";
import type { PermissionPolicy } from "../contracts/ports.js";
import { DomainError } from "../core/index.js";
import { TablePreferenceValidation } from "../core/table-preferences.js";
import { PostgresSessionGuard } from "./session-guard.js";
interface PreferenceRow {
  search: string;
  role: string;
  status: string;
  page: number;
  sort: string;
  columns: unknown;
  version: number;
}
/** Locks session/user through commit: a completed logout cannot be followed by a preference write. */
export class PostgresTablePreferenceRepository implements TablePreferenceStore {
  constructor(
    private readonly pool: Pool,
    private readonly sessions: PostgresSessionGuard,
    private readonly validation: TablePreferenceValidation,
  ) {}
  load(
    digest: string,
    policy: PermissionPolicy,
  ): Promise<UserTablePreferences> {
    return this.authorized(digest, policy);
  }
  save(
    digest: string,
    value: UserTablePreferences,
    policy: PermissionPolicy,
  ): Promise<UserTablePreferences> {
    return this.authorized(digest, policy, value);
  }
  private async authorized(
    digest: string,
    policy: PermissionPolicy,
    value?: UserTablePreferences,
  ): Promise<UserTablePreferences> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = 5000");
      const actor = await this.sessions.require(client, digest);
      policy.require(actor, "preferences:write");
      if (value) {
        await client.query(
          "INSERT INTO user_table_preferences(user_id) VALUES($1) ON CONFLICT DO NOTHING",
          [actor.id],
        );
        const q = value.query;
        const updated = await client.query<PreferenceRow>(
          "UPDATE user_table_preferences SET search=$2,role=$3,status=$4,page=$5,sort=$6,columns=$7,version=version+1 WHERE user_id=$1 AND version=$8 RETURNING search,role,status,page,sort,columns,version",
          [
            actor.id,
            q.search,
            q.role,
            q.status,
            q.page,
            q.sort,
            value.columns,
            value.version,
          ],
        );
        if (!updated.rows[0]) throw new DomainError(409, "version_conflict");
        const result = this.decode(updated.rows[0]);
        await client.query("COMMIT");
        return result;
      }
      const found = await client.query<PreferenceRow>(
        "SELECT search,role,status,page,sort,columns,version FROM user_table_preferences WHERE user_id=$1",
        [actor.id],
      );
      const result = found.rows[0]
        ? this.decode(found.rows[0])
        : this.validation.defaults();
      await client.query("COMMIT");
      return result;
    } catch (error: unknown) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  private decode(row: PreferenceRow): UserTablePreferences {
    return this.validation.parse({
      query: {
        search: row.search,
        role: row.role,
        status: row.status,
        page: row.page,
        sort: row.sort,
      },
      columns: row.columns,
      version: row.version,
    });
  }
}
