// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { UserQuery } from "./index.js";
import type { PermissionPolicy } from "./ports.js";
export type UserTableColumn =
  "name" | "email" | "role" | "status" | "created_at";
/** Account-owned saved view. Name remains visible; actions are never hidden by this contract. */
export interface UserTablePreferences {
  readonly query: UserQuery;
  readonly columns: readonly UserTableColumn[];
  readonly version: number;
}
export interface TablePreferenceStore {
  load(digest: string, policy: PermissionPolicy): Promise<UserTablePreferences>;
  save(
    digest: string,
    value: UserTablePreferences,
    policy: PermissionPolicy,
  ): Promise<UserTablePreferences>;
}
