// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import { Button } from "@summit/ui";
import { WorkspaceScreen } from "./screen.js";
import { AccountPanel } from "./account.js";
import { PermissionPanel } from "./permissions.js";
export class SettingsScreen extends WorkspaceScreen {
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      m = this.messages();
    return (
      <>
        <AccountPanel {...this.props} />
        <PermissionPanel {...this.props} />
        <section className="admin-card">
          <h2>{m.t("settings")}</h2>
          <div className="admin-actions">
            <Button
              variant="secondary"
              onClick={() =>
                c.preferencesChanged(s.locale === "ar" ? "en" : "ar", s.theme)
              }
            >
              {m.t("language")}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                c.preferencesChanged(
                  s.locale,
                  s.theme === "light" ? "dark" : "light",
                )
              }
            >
              {m.t("theme")}: {m.t(s.theme)}
            </Button>
          </div>
        </section>
      </>
    );
  }
}
