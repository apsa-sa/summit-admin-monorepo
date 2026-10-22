// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
export interface DocsPreferences {
  readonly locale: Locale;
  readonly theme: Theme;
}
export class DocsPreferencePolicy {
  resolve(locale: unknown, theme: unknown): DocsPreferences {
    return {
      locale: locale === "en" ? "en" : "ar",
      theme: theme === "dark" ? "dark" : "light",
    };
  }
}
