// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
import type {
  User,
  UserPage,
  Draft,
  AuditEvent,
  UserQuery,
} from "../../../packages/contracts/index.js";
import type { UserTablePreferences } from "../../../packages/contracts/table-preferences.js";
import { TablePreferenceValidation } from "../../../packages/core/table-preferences.js";
import { BulkStateModel } from "./bulk-state.js";
import type { BulkState } from "./bulk-state.js";
export type ViewName = "overview" | "users" | "drafts" | "audit" | "settings";
export interface WorkspaceState {
  readonly locale: Locale;
  readonly theme: Theme;
  readonly user: User | null;
  readonly busy: boolean;
  readonly loading: boolean;
  readonly booting: boolean;
  readonly message: string;
  readonly error: boolean;
  readonly offline: boolean;
  readonly view: ViewName;
  readonly query: UserQuery;
  readonly page: UserPage | null;
  readonly editing: User | null | undefined;
  readonly removing: User | null;
  readonly formError: string;
  readonly draft: Draft;
  readonly draftDisabled: boolean;
  readonly draftStatus: "loading" | "saving" | "saved" | "unsaved";
  readonly draftError: string;
  readonly audit: readonly AuditEvent[];
  readonly palette: boolean;
  readonly command: string;
  readonly mobile: boolean;
  readonly collapsed: boolean;
  readonly logoutFailed: boolean;
  readonly bulk: BulkState;
  readonly tablePreferences: UserTablePreferences;
  readonly tableBusy: boolean;
  readonly tableReady: boolean;
  readonly tableMessage: string;
  readonly tableError: boolean;
}
export class WorkspaceStore {
  private value: WorkspaceState;
  private epochValue = 0;
  get epoch(): number {
    return this.epochValue;
  }
  advanceEpoch(): void {
    this.epochValue++;
  }
  constructor(
    locale: Locale,
    theme: Theme,
    user: User | null,
    private readonly publish: (value: WorkspaceState) => void,
  ) {
    this.value = {
      locale,
      theme,
      user,
      busy: false,
      loading: false,
      booting: true,
      message: "",
      error: false,
      offline: false,
      view: "overview",
      query: { search: "", role: "", status: "", page: 1, sort: "created_at" },
      page: null,
      editing: undefined,
      removing: null,
      formError: "",
      draft: { name: "", organization: "", version: 0 },
      draftDisabled: true,
      draftStatus: "loading",
      draftError: "",
      audit: [],
      palette: false,
      command: "",
      mobile: false,
      collapsed: false,
      logoutFailed: false,
      bulk: new BulkStateModel().defaults(),
      tablePreferences: new TablePreferenceValidation().defaults(),
      tableBusy: false,
      tableReady: false,
      tableMessage: "",
      tableError: false,
    };
  }
  get snapshot(): WorkspaceState {
    return this.value;
  }
  patch(value: Partial<WorkspaceState>): void {
    this.value = { ...this.value, ...value };
    this.publish(this.value);
  }
  clear(): void {
    this.patch({
      user: null,
      busy: false,
      booting: false,
      logoutFailed: false,
      bulk: new BulkStateModel().defaults(),
      tablePreferences: new TablePreferenceValidation().defaults(),
      tableBusy: false,
      tableReady: false,
      tableMessage: "",
      tableError: false,
      page: null,
      audit: [],
      editing: undefined,
      removing: null,
      formError: "",
      draft: { name: "", organization: "", version: 0 },
      draftDisabled: true,
      draftStatus: "loading",
      draftError: "",
      query: { search: "", role: "", status: "", page: 1, sort: "created_at" },
      palette: false,
      command: "",
      mobile: false,
      message: "",
      error: false,
      loading: false,
    });
  }
}
