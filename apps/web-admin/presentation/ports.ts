// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type {
  UserExportFormat,
  ExportDownload,
} from "../../../packages/contracts/exports.js";
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
import type {
  User,
  UserInput,
  UserPage,
  UserQuery,
  AuditEvent,
} from "../../../packages/contracts/index.js";
import type { DraftApi } from "../browser/draft-controller.js";
import type { ViewName } from "./state.js";
import type { UserTablePreferences } from "../../../packages/contracts/table-preferences.js";
export interface TablePreferenceApi {
  tablePreferences(): Promise<UserTablePreferences>;
  saveTablePreferences(
    value: UserTablePreferences,
  ): Promise<UserTablePreferences>;
}
export interface WorkspaceApi extends DraftApi, TablePreferenceApi {
  endSession(): void;
  me(): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  users(
    page: number,
    search: string,
    role?: string,
    status?: string,
    sort?: "name" | "created_at",
  ): Promise<UserPage>;
  createUser(input: UserInput): Promise<User>;
  updateUser(id: string, input: UserInput): Promise<User>;
  deleteUser(id: string): Promise<void>;
  audit(): Promise<AuditEvent[]>;
  downloadExport(
    locale: Locale,
    search: string,
    role: string,
    status: string,
    format: UserExportFormat,
    sort: "name" | "created_at",
  ): Promise<ExportDownload>;
  exportUrl(
    locale: Locale,
    search: string,
    role: string,
    status: string,
    format?: UserExportFormat,
    sort?: "name" | "created_at",
  ): string;
}
export interface WorkspaceNavigation {
  read(fallback?: UserQuery): { view: ViewName; query: UserQuery };
  url(view: ViewName, query: UserQuery): string;
  write(view: ViewName, query: UserQuery, replace?: boolean): void;
}
export interface WorkspacePreferenceWriter {
  apply(locale: Locale, theme: Theme): void;
}

export interface FileDownloadPort {
  save(file: ExportDownload): void;
  dispose(): void;
}
