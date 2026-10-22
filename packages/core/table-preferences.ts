// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type {
  UserTableColumn,
  UserTablePreferences,
} from "../contracts/table-preferences.js";
import { Validation, DomainError } from "./index.js";
/** Shared runtime schema. Unknown fields and unsupported column IDs never become SQL/HTML identifiers. */
export class TablePreferenceValidation {
  defaults(): UserTablePreferences {
    return {
      query: { search: "", role: "", status: "", page: 1, sort: "created_at" },
      columns: ["name", "email", "role", "status", "created_at"],
      version: 0,
    };
  }
  column(value: unknown): UserTableColumn {
    if (
      value === "name" ||
      value === "email" ||
      value === "role" ||
      value === "status" ||
      value === "created_at"
    )
      return value;
    throw new DomainError(422, "invalid_input");
  }
  parse(value: unknown): UserTablePreferences {
    const row = Validation.record(value),
      query = Validation.record(row.query);
    if (
      Object.keys(row).some(
        (key) => !["query", "columns", "version"].includes(key),
      ) ||
      Object.keys(query).some(
        (key) => !["search", "role", "status", "page", "sort"].includes(key),
      )
    )
      throw new DomainError(422, "invalid_input");
    if (
      typeof query.search !== "string" ||
      query.search.length > 120 ||
      typeof query.role !== "string" ||
      typeof query.status !== "string"
    )
      throw new DomainError(422, "invalid_input");
    if (query.sort !== "name" && query.sort !== "created_at")
      throw new DomainError(422, "invalid_sort");
    if (
      !Array.isArray(row.columns) ||
      row.columns.length < 1 ||
      row.columns.length > 5
    )
      throw new DomainError(422, "invalid_input");
    const columns = row.columns.map((value) => this.column(value));
    if (new Set(columns).size !== columns.length || !columns.includes("name"))
      throw new DomainError(422, "invalid_input");
    const parsed = Validation.query(
      new URLSearchParams({
        search: query.search,
        role: query.role,
        status: query.status,
        page: String(Validation.integer(query.page, 1, 100000)),
        sort: query.sort,
      }),
    );
    return {
      query: parsed,
      columns,
      version: Validation.integer(row.version, 0, 2147483647),
    };
  }
}
