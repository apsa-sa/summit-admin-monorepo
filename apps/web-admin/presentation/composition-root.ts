// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
import type { User } from "../../../packages/contracts/index.js";
import { AuthorizationPolicy } from "../../../packages/core-rbac/index.js";
import { AdminApiClient } from "../browser/api.js";
import {
  DraftAutosaveController,
  BrowserDraftScheduler,
} from "../browser/draft-controller.js";
import { WorkspaceStore } from "./state.js";
import type { WorkspaceState } from "./state.js";
import { WorkspaceController } from "./controller.js";
import { DraftPresenter } from "./draft-presenter.js";
import {
  BrowserNavigation,
  BrowserPreferences,
  BrowserDownloads,
} from "./browser-adapters.js";
import { TablePreferenceController } from "./table-preferences.js";
import { BulkUserController } from "./bulk-users.js";
export class WorkspaceCompositionRoot {
  create(
    locale: Locale,
    theme: Theme,
    user: User | null,
    publish: (value: WorkspaceState) => void,
  ): WorkspaceController {
    const store = new WorkspaceStore(locale, theme, user, publish),
      api = new AdminApiClient();
    const drafts = new DraftAutosaveController(
      api,
      new DraftPresenter(store, () => api.endSession()),
      new BrowserDraftScheduler(),
    );
    return new WorkspaceController(
      store,
      api,
      drafts,
      new BrowserNavigation(),
      new BrowserPreferences(),
      new AuthorizationPolicy(),
      new TablePreferenceController(store, api, drafts),
      new BulkUserController(store, api, drafts, new AuthorizationPolicy()),
      new BrowserDownloads(),
    );
  }
}
