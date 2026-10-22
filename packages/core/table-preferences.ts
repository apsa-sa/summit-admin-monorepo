// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { UserTablePreferences } from "../contracts/table-preferences.js";
import { ResponseContracts, ContractViolation } from "../contracts/decoders.js";
import { DomainError } from "./index.js";
/** Shared runtime schema. Unknown fields and unsupported column IDs never become SQL/HTML identifiers. */
export class TablePreferenceValidation {
  defaults(): UserTablePreferences {
    return {
      query: { search: "", role: "", status: "", page: 1, sort: "created_at" },
      columns: ["name", "email", "role", "status", "created_at"],
      version: 0,
    };
  }
  parse(value: unknown): UserTablePreferences {
    try {
      return new ResponseContracts().tablePreferences(value);
    } catch (error: unknown) {
      if (error instanceof ContractViolation)
        throw new DomainError(422, "invalid_input");
      throw error;
    }
  }
}
