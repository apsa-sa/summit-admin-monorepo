// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { ExportDownload } from "../../../packages/contracts/exports.js";
import type { FileDownloadPort } from "./ports.js";
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
import { Validation } from "../../../packages/core/index.js";
import type { UserQuery } from "../../../packages/contracts/index.js";
import type { ViewName } from "./state.js";
export class BrowserPreferences {
  apply(locale: Locale, theme: Theme): void {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.summitTheme = theme;
    document.body.dataset.summitTheme = theme;
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `summit_locale=${locale}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
    document.cookie = `summit_theme=${theme}; Path=/; SameSite=Lax; Max-Age=31536000${secure}`;
  }
}
export class BrowserNavigation {
  read(fallback?: UserQuery): { view: ViewName; query: UserQuery } {
    const params = new URLSearchParams(location.search);
    const value = params.get("view");
    const view: ViewName =
      value === "users" ||
      value === "drafts" ||
      value === "audit" ||
      value === "settings"
        ? value
        : "overview";
    const saved = fallback
      ? new URLSearchParams({
          search: fallback.search,
          role: fallback.role,
          status: fallback.status,
          page: String(fallback.page),
          sort: fallback.sort,
        })
      : new URLSearchParams();
    // A direct URL is an explicit view; saved state applies only without query controls.
    const explicit = ["search", "role", "status", "page", "sort"].some((key) =>
      params.has(key),
    );
    return { view, query: Validation.query(explicit ? params : saved) };
  }
  url(view: ViewName, query: UserQuery): string {
    return `/?${new URLSearchParams({ view, search: query.search, role: query.role, status: query.status, page: String(query.page), sort: query.sort })}`;
  }
  write(view: ViewName, query: UserQuery, replace = false): void {
    const url = this.url(view, query);
    if (replace) history.replaceState(null, "", url);
    else history.pushState(null, "", url);
  }
}

/** Only owned object URLs/timers are retained, and all are revoked on session end/unmount. */
export class BrowserDownloads implements FileDownloadPort {
  private readonly urls = new Map<string, number>();
  save(file: ExportDownload): void {
    if (!/^summit-users\.(csv|xlsx|pdf)$/.test(file.filename))
      throw new TypeError("Invalid download filename");
    const url = URL.createObjectURL(
      new Blob([file.bytes], { type: file.contentType }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.filename;
    anchor.hidden = true;
    try {
      document.body.append(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      this.urls.set(
        url,
        window.setTimeout(() => {
          URL.revokeObjectURL(url);
          this.urls.delete(url);
        }, 1000),
      );
    }
  }
  dispose(): void {
    for (const [url, timer] of this.urls) {
      window.clearTimeout(timer);
      URL.revokeObjectURL(url);
    }
    this.urls.clear();
  }
}
