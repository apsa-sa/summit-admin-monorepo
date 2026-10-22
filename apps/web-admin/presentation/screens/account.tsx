// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import { Button } from "@summit/ui";
import { WorkspaceScreen } from "./screen.js";
export class AccountPanel extends WorkspaceScreen {
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      user = s.user,
      m = this.messages();
    if (!user) return null;
    const input = {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      version: user.version,
    };
    return (
      <section className="admin-card" aria-labelledby="admin-account-title">
        <h2 id="admin-account-title">{m.t("profile")}</h2>
        <dl className="admin-account-details">
          <dt>{m.t("name")}</dt>
          <dd id="admin-account-name">{user.name}</dd>
          <dt>{m.t("email")}</dt>
          <dd>
            <bdi>{user.email}</bdi>
          </dd>
          <dt>{m.t("role")}</dt>
          <dd>{m.t(user.role)}</dd>
          <dt>{m.t("status")}</dt>
          <dd>{m.t(user.status)}</dd>
          <dt>{m.t("version")}</dt>
          <dd>{this.format().number(user.version)}</dd>
          <dt>{m.t("createdAt")}</dt>
          <dd>
            <bdi>{this.format().instant(user.createdAt)}</bdi>
          </dd>
        </dl>
        {c.can("users:update", user, input) && (
          <Button variant="secondary" onClick={() => c.edit(user)}>
            {m.t("accountEdit")}
          </Button>
        )}
      </section>
    );
  }
}
