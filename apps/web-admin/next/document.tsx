// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { WorkspacePreferences } from "./preferences.js";
export class AdminDocument {
  static async render({
    children,
  }: {
    children: ReactNode;
  }): Promise<ReactNode> {
    const values = await cookies();
    const preferences = new WorkspacePreferences();
    const locale = preferences.locale(values.get("summit_locale")?.value);
    const theme = preferences.theme(values.get("summit_theme")?.value);
    return (
      <html
        lang={locale}
        dir={locale === "ar" ? "rtl" : "ltr"}
        data-theme={theme}
        data-summit-theme={theme}
      >
        <body className="summit-theme" data-summit-theme={theme}>
          {children}
        </body>
      </html>
    );
  }
}
