// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { DocsPreferences } from "../next/preferences.js";
export interface DocsAppearance {
  apply(value: DocsPreferences): void;
}
export class BrowserDocsAppearance implements DocsAppearance {
  apply(value: DocsPreferences): void {
    document.documentElement.lang = value.locale;
    document.documentElement.dir = value.locale === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.summitTheme = value.theme;
    document.body.dataset.summitTheme = value.theme;
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `summit_locale=${value.locale}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
    document.cookie = `summit_theme=${value.theme}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
  }
}
