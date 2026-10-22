// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import { Button, Checkbox } from "@summit/ui";
import { TablePreferenceValidation } from "../../../../packages/core/table-preferences.js";
import { WorkspaceScreen } from "./screen.js";
export class TablePreferencesPanel extends WorkspaceScreen {
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      m = this.messages();
    return (
      <details className="admin-table-preferences">
        <summary>{m.t("columns")}</summary>
        <p>{m.t("savedViewHint")}</p>
        <fieldset disabled={s.tableBusy || !s.tableReady}>
          <legend>{m.t("columns")}</legend>
          <div className="admin-actions">
            {new TablePreferenceValidation()
              .defaults()
              .columns.map((column) => (
                <Checkbox
                  key={column}
                  id={`admin-column-${column}`}
                  label={m.t(column === "created_at" ? "createdAt" : column)}
                  checked={s.tablePreferences.columns.includes(column)}
                  disabled={column === "name"}
                  onChange={(event) =>
                    c.table.toggle(column, event.target.checked)
                  }
                />
              ))}
          </div>
        </fieldset>
        <div className="admin-actions">
          <Button
            id="admin-save-view"
            disabled={!s.tableReady}
            loading={s.tableBusy}
            onClick={() => {
              void c.table.save();
            }}
          >
            {m.t("saveView")}
          </Button>
          <Button
            id="admin-restore-view"
            variant="secondary"
            disabled={s.tableBusy}
            onClick={() => {
              void c.restoreTable();
            }}
          >
            {m.t("restoreView")}
          </Button>
        </div>
        <p id="admin-view-status" role={s.tableError ? "alert" : "status"}>
          {s.tableBusy ? m.t("loading") : s.tableMessage}
        </p>
      </details>
    );
  }
}
