// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
export class WorkspacePreferences {
  locale(value: string | undefined): Locale {
    return value === "en" ? "en" : "ar";
  }
  theme(value: string | undefined): Theme {
    return value === "dark" ? "dark" : "light";
  }
}
