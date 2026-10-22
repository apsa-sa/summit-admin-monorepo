// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AdminInitialSession } from "./initial-session.js";
import { WorkspacePreferences } from "./preferences.js";
import { AdminWorkspace } from "../presentation/workspace.js";
/** R2: serializable initial preferences only; class controller loads authenticated state. */
export class AdminPage {
  static async render(): Promise<ReactNode> {
    const values = await cookies(),
      preferences = new WorkspacePreferences();
    return (
      <AdminWorkspace
        locale={preferences.locale(values.get("summit_locale")?.value)}
        theme={preferences.theme(values.get("summit_theme")?.value)}
        initialUser={await new AdminInitialSession().load(
          values.get("summit_session")?.value,
        )}
      />
    );
  }
}
