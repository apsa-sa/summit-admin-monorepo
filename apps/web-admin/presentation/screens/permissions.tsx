// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import type { WorkspaceMessageKey } from "@summit/localization";
import { WorkspaceScreen } from "./screen.js";
export class PermissionPanel extends WorkspaceScreen {
  override render(): ReactNode {
    const m = this.messages();
    const labels: Readonly<Record<string, WorkspaceMessageKey>> = {
      "users:read": "permissionReadUsers",
      "users:create": "permissionCreateUsers",
      "users:update": "permissionUpdateUsers",
      "users:delete": "permissionDeleteUsers",
      "users:export": "permissionExportUsers",
      "audit:read": "permissionReadAudit",
      "draft:write": "permissionWriteDraft",
      "preferences:write": "permissionWritePreferences",
    };
    return (
      <section className="admin-card" aria-labelledby="admin-permissions-title">
        <h2 id="admin-permissions-title">{m.t("capabilities")}</h2>
        <p>{m.t("capabilityHint")}</p>
        <ul id="admin-account-permissions">
          {this.props.controller.availableActions().map((action) => {
            const label = labels[action];
            return (
              <li key={action} data-permission={action}>
                {label ? m.t(label) : action}
              </li>
            );
          })}
        </ul>
      </section>
    );
  }
}
