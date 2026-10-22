// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { createRef } from "react";
import type { ReactNode } from "react";
import type { ScreenProps } from "./screen.js";
import { Button, Select, FormField, Dialog } from "@summit/ui";
import { WorkspaceScreen } from "./screen.js";
export class BulkUsersPanel extends WorkspaceScreen {
  private readonly results = createRef<HTMLUListElement>();
  override componentDidUpdate(previous: ScreenProps): void {
    if (
      previous.state.bulk.completion !== this.props.state.bulk.completion &&
      this.props.state.bulk.results.length > 0
    )
      this.results.current?.focus();
  }
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      m = this.messages(),
      rows = c.bulk.chosen();
    if (!c.bulk.available() && s.bulk.results.length === 0) return null;
    return (
      <section className="admin-bulk" aria-labelledby="admin-bulk-title">
        <h3 id="admin-bulk-title">
          {m.t("bulkTitle")}: {this.format().number(rows.length)}
        </h3>
        <p>{m.t("bulkHint")}</p>
        {c.bulk.available() && (
          <div className="admin-actions">
            <FormField id="admin-bulk-target" label={m.t("bulkTarget")}>
              <Select
                value={s.bulk.target}
                disabled={s.busy || s.loading}
                onChange={(event) => c.bulk.target(event.target.value)}
              >
                <option value="suspended">{m.t("suspended")}</option>
                <option value="active">{m.t("active")}</option>
              </Select>
            </FormField>
            <Button
              id="admin-bulk-open"
              disabled={s.busy || s.loading || rows.length === 0}
              onClick={() =>
                c.store.patch({ bulk: { ...s.bulk, confirm: true } })
              }
            >
              {m.t("bulkApply")}
            </Button>
          </div>
        )}
        {c.bulk.isRunning() && (
          <Button
            disabled={s.bulk.stopping}
            variant="secondary"
            onClick={() => c.bulk.stop()}
          >
            {m.t(s.bulk.stopping ? "bulkStopping" : "bulkStop")}
          </Button>
        )}
        <ul
          id="admin-bulk-results"
          ref={this.results}
          tabIndex={-1}
          aria-label={m.t("bulkTitle")}
          aria-live="polite"
        >
          {s.bulk.results.map((result) => (
            <li key={result.id} data-outcome={result.outcome}>
              <strong>{result.name}</strong>: {m.t(`bulk_${result.outcome}`)}{" "}
              {result.message}
            </li>
          ))}
        </ul>
        <Dialog
          id="admin-bulk-dialog"
          open={s.bulk.confirm}
          title={m.t("bulkConfirm")}
          closeLabel={m.t("close")}
          direction={s.locale === "ar" ? "rtl" : "ltr"}
          theme={s.theme}
          onClose={() =>
            c.store.patch({
              bulk: { ...c.store.snapshot.bulk, confirm: false },
            })
          }
        >
          <p>{m.t("bulkHint")}</p>
          <p>
            {m.t("bulkTarget")}: {m.t(s.bulk.target)}
          </p>
          <ul>
            {rows.map((user) => (
              <li key={user.id}>{user.name}</li>
            ))}
          </ul>
          <Button
            disabled={s.busy || rows.length === 0}
            onClick={() => {
              void c.applyBulk();
            }}
          >
            {m.t("bulkApply")}
          </Button>
        </Dialog>
      </section>
    );
  }
}
