// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import { Table } from "@summit/ui";
import type { TableColumn } from "@summit/ui";
import type { AuditEvent } from "../../../../packages/contracts/index.js";
import { WorkspaceScreen } from "./screen.js";
export class AuditScreen extends WorkspaceScreen {
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      m = this.messages(),
      f = this.format();
    const columns: readonly TableColumn<AuditEvent>[] = [
      {
        id: "action",
        label: m.t("audit"),
        cell: (event) => <bdi>{event.action}</bdi>,
      },
      {
        id: "actor",
        label: m.t("profile"),
        cell: (event) => <bdi>{event.actorId}</bdi>,
      },
      {
        id: "created",
        label: m.t("createdAt"),
        cell: (event) => <bdi>{f.instant(event.createdAt)}</bdi>,
      },
    ];
    return (
      <section className="admin-card">
        <h2>{m.t("audit")}</h2>
        <Table<AuditEvent>
          caption={m.t("audit")}
          rows={s.audit}
          columns={columns}
          rowKey={(event) => event.id}
          loading={s.loading}
          loadingLabel={m.t("loading")}
          emptyLabel={m.t("noResults")}
          retryLabel={m.t("retry")}
          {...(s.error ? { error: s.message } : {})}
          onRetry={() => {
            void c.load();
          }}
        />
      </section>
    );
  }
}
