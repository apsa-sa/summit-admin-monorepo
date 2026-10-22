// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DocsPreferencePolicy } from "./preferences";
export class DocsDocument {
  static async render({
    children,
  }: {
    children: ReactNode;
  }): Promise<ReactNode> {
    const values = await cookies(),
      p = new DocsPreferencePolicy().resolve(
        values.get("summit_locale")?.value,
        values.get("summit_theme")?.value,
      );
    return (
      <html
        lang={p.locale}
        dir={p.locale === "ar" ? "rtl" : "ltr"}
        data-summit-theme={p.theme}
      >
        <body className="summit-theme" data-summit-theme={p.theme}>
          {children}
        </body>
      </html>
    );
  }
}
