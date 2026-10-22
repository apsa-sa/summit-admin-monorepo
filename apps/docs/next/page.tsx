// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { DocsPreferencePolicy } from "./preferences";
import { DocsWorkspace } from "../presentation/workspace";
export class DocsPage {
  static async render(): Promise<ReactNode> {
    const values = await cookies(),
      preferences = new DocsPreferencePolicy().resolve(
        values.get("summit_locale")?.value,
        values.get("summit_theme")?.value,
      );
    return <DocsWorkspace {...preferences} />;
  }
}
