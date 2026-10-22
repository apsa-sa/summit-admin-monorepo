// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import type { ReactNode } from "react";
import {
  Button,
  Input,
  Select,
  FormField,
  Table,
  Pagination,
} from "@summit/ui";
import type { TableColumn } from "@summit/ui";
import type { User } from "../../../../packages/contracts/index.js";
import { WorkspaceScreen } from "./screen.js";
export class UsersScreen extends WorkspaceScreen {
  override render(): ReactNode {
    const { state: s, controller: c } = this.props,
      m = this.messages(),
      f = this.format();
    const columns: readonly TableColumn<User>[] = [
      {
        id: "name",
        label: m.t("name"),
        sortable: true,
        cell: (user) => <strong>{user.name}</strong>,
      },
      {
        id: "email",
        label: m.t("email"),
        cell: (user) => <bdi>{user.email}</bdi>,
      },
      { id: "role", label: m.t("role"), cell: (user) => m.t(user.role) },
      { id: "status", label: m.t("status"), cell: (user) => m.t(user.status) },
      {
        id: "created_at",
        label: m.t("createdAt"),
        sortable: true,
        cell: (user) => <bdi>{f.instant(user.createdAt)}</bdi>,
      },
      {
        id: "actions",
        label: m.t("details"),
        cell: (user) => {
          const input = {
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            version: user.version,
          };
          return (
            <div className="admin-actions">
              {c.can("users:update", user, input) && (
                <Button variant="secondary" onClick={() => c.edit(user)}>
                  {m.t("edit")}
                </Button>
              )}
              {c.can("users:delete", user) && (
                <Button
                  variant="danger"
                  onClick={() => c.store.patch({ removing: user })}
                >
                  {m.t("remove")}
                </Button>
              )}
            </div>
          );
        },
      },
    ];
    const total = s.page?.total ?? 0,
      maximum = Math.max(1, Math.ceil(total / (s.page?.pageSize ?? 8)));
    return (
      <section className="admin-card">
        <div className="admin-section-heading">
          <h2>{m.t("users")}</h2>
          <div className="admin-actions">
            {c.can("users:create") && (
              <Button onClick={() => c.edit(null)}>{m.t("create")}</Button>
            )}
            {c.can("users:export") && (
              <a className="admin-action-link" href={c.exportUrl()}>
                {m.t("exportCsv")}
              </a>
            )}
          </div>
        </div>
        <form
          className="admin-filters"
          onSubmit={(event) => {
            event.preventDefault();
            c.queryChanged({ page: 1 }, true);
          }}
        >
          <FormField id="admin-search" label={m.t("search")}>
            <Input
              value={s.query.search}
              maxLength={120}
              onChange={(event) =>
                c.queryChanged({ search: event.target.value })
              }
            />
          </FormField>
          <FormField id="admin-role-filter" label={m.t("role")}>
            <Select
              value={s.query.role}
              onChange={(event) =>
                c.queryChanged({ role: event.target.value, page: 1 }, true)
              }
            >
              <option value="">{m.t("all")}</option>
              {(["admin", "editor", "viewer"] as const).map((role) => (
                <option key={role} value={role}>
                  {m.t(role)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="admin-status-filter" label={m.t("status")}>
            <Select
              value={s.query.status}
              onChange={(event) =>
                c.queryChanged({ status: event.target.value, page: 1 }, true)
              }
            >
              <option value="">{m.t("all")}</option>
              {(["active", "invited", "suspended"] as const).map((status) => (
                <option key={status} value={status}>
                  {m.t(status)}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="submit" loading={s.loading}>
            {m.t("search")}
          </Button>
        </form>
        <Table<User>
          caption={m.t("users")}
          rows={s.page?.rows ?? []}
          columns={columns}
          rowKey={(user) => user.id}
          loading={s.loading}
          loadingLabel={m.t("loading")}
          emptyLabel={m.t("noResults")}
          retryLabel={m.t("retry")}
          {...(s.error ? { error: s.message } : {})}
          onRetry={() => {
            void c.load();
          }}
          sort={{
            column: s.query.sort,
            direction: s.query.sort === "name" ? "asc" : "desc",
          }}
          onSort={(column) => {
            if (column === "name" || column === "created_at")
              c.queryChanged({ sort: column, page: 1 }, true);
          }}
        />
        {s.query.page <= maximum ? (
          <Pagination
            page={s.query.page}
            pageSize={s.page?.pageSize ?? 8}
            total={total}
            label={m.t("page")}
            previousLabel={m.t("previous")}
            nextLabel={m.t("next")}
            formatNumber={(value) => f.number(value)}
            disabled={s.loading || s.error}
            onChange={(page) => c.queryChanged({ page }, true)}
          />
        ) : (
          <Button
            variant="secondary"
            onClick={() => c.queryChanged({ page: 1 }, true)}
          >
            {m.t("firstPage")}
          </Button>
        )}
      </section>
    );
  }
}
