// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import { Button } from "@summit/ui";
import { WorkspaceScreen } from "./screen.js";
export class OverviewScreen extends WorkspaceScreen {
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      m = this.messages();
    return (
      <section className="admin-card">
        <h2>{m.t("overview")}</h2>
        {s.loading ? (
          <p role="status">{m.t("loading")}</p>
        ) : (
          <>
            <p>{m.t("count")}</p>
            <strong className="admin-metric">
              {s.page ? this.format().number(s.page.total) : "—"}
            </strong>
            <h3>{m.t("source")}</h3>
            <p>{m.t("sourceHint")}</p>
            <Button
              variant="secondary"
              onClick={() => {
                void c.load();
              }}
            >
              {m.t("retry")}
            </Button>
          </>
        )}
      </section>
    );
  }
}
