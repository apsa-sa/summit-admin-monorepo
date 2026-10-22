// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
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
export interface WorkspaceApi extends DraftApi {
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
  exportUrl(
    locale: Locale,
    search: string,
    role: string,
    status: string,
  ): string;
}
export interface WorkspaceNavigation {
  read(): { view: ViewName; query: UserQuery };
  url(view: ViewName, query: UserQuery): string;
  write(view: ViewName, query: UserQuery, replace?: boolean): void;
}
export interface WorkspacePreferenceWriter {
  apply(locale: Locale, theme: Theme): void;
}
