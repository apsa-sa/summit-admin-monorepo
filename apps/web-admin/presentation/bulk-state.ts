// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
export type BulkStatus = "active" | "suspended";
export type BulkOutcome =
  "updated" | "rejected" | "unconfirmed" | "not_attempted";
export interface BulkResult {
  readonly id: string;
  readonly name: string;
  readonly outcome: BulkOutcome;
  readonly message: string;
}
export interface BulkState {
  readonly target: BulkStatus;
  readonly selected: ReadonlySet<string>;
  readonly confirm: boolean;
  readonly results: readonly BulkResult[];
  readonly stopping: boolean;
  readonly completion: number;
}
export class BulkStateModel {
  defaults(): BulkState {
    return {
      target: "suspended",
      selected: new Set(),
      confirm: false,
      results: [],
      stopping: false,
      completion: 0,
    };
  }
}
