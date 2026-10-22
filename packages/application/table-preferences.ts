// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { TablePreferenceStore } from "../contracts/table-preferences.js";
import type { PermissionPolicy } from "../contracts/ports.js";
import { DomainError } from "../core/index.js";
import { TablePreferenceValidation } from "../core/table-preferences.js";
export class TablePreferenceService {
  constructor(
    private readonly store: TablePreferenceStore,
    private readonly policy: PermissionPolicy,
    private readonly validation: TablePreferenceValidation,
  ) {}
  load(digest: string) {
    return this.store.load(digest, this.policy);
  }
  save(digest: string, value: unknown) {
    const parsed = this.validation.parse(value);
    if (parsed.version === 2147483647)
      throw new DomainError(409, "version_conflict");
    return this.store.save(digest, parsed, this.policy);
  }
}
