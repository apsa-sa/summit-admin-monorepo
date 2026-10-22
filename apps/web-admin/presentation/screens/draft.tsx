// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import { Button, Input, FormField } from "@summit/ui";
import { WorkspaceScreen } from "./screen.js";
export class DraftScreen extends WorkspaceScreen {
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      m = this.messages();
    return (
      <section className="admin-card">
        <h2>{m.t("drafts")}</h2>
        <p>{m.t("draftHint")}</p>
        <FormField id="admin-draft-name" label={m.t("name")}>
          <Input
            value={s.draft.name}
            maxLength={120}
            disabled={s.draftDisabled}
            onChange={(event) =>
              c.draftChanged(event.target.value, s.draft.organization)
            }
          />
        </FormField>
        <FormField id="admin-draft-organization" label={m.t("organization")}>
          <Input
            value={s.draft.organization}
            maxLength={120}
            disabled={s.draftDisabled}
            onChange={(event) =>
              c.draftChanged(s.draft.name, event.target.value)
            }
          />
        </FormField>
        <p role="status" id="admin-draft-status">
          {m.t(`draft_${s.draftStatus}`)}
        </p>
        {s.draftError && <p role="alert">{s.draftError}</p>}
        <div className="admin-actions">
          <Button
            variant="secondary"
            onClick={() => {
              void c.drafts.retry();
            }}
          >
            {m.t("retry")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void c.drafts.reloadConfirmed();
            }}
          >
            {m.t("reloadDraft")}
          </Button>
        </div>
      </section>
    );
  }
}
