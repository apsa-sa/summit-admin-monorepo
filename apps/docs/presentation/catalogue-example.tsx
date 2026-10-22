// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Input,
  Select,
  FormField,
  Table,
  Pagination,
  Drawer,
} from "@summit/ui";
import type { TableColumn } from "@summit/ui";
import {
  DocsMessages,
  Localization,
  LocaleFormatter,
} from "@summit/localization";
import type { DocsPreferences } from "../next/preferences.js";
import type { ComponentContract } from "./catalogue.js";
interface Props extends DocsPreferences {
  readonly entries: readonly ComponentContract[];
}
interface State {
  query: string;
  page: number;
  descending: boolean;
  mode: "ready" | "loading" | "empty" | "error";
  selected: ReadonlySet<string>;
  details: ComponentContract | null;
}
export class DocsCatalogueExample extends Component<Props, State> {
  override state: State = {
    query: "",
    page: 1,
    descending: false,
    mode: "ready",
    selected: new Set(),
    details: null,
  };
  override render(): ReactNode {
    const m = new DocsMessages(this.props.locale),
      local = new Localization(this.props.locale),
      format = new LocaleFormatter(this.props.locale);
    const all = this.props.entries
      .filter((row) =>
        row.name.toLowerCase().includes(this.state.query.toLowerCase()),
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name) * (this.state.descending ? -1 : 1),
      );
    const rows =
      this.state.mode === "empty"
        ? []
        : all.slice((this.state.page - 1) * 4, this.state.page * 4);
    const columns: readonly TableColumn<ComponentContract>[] = [
      {
        id: "name",
        label: m.t("component"),
        sortable: true,
        cell: (row) => <bdi>{row.name}</bdi>,
      },
      {
        id: "contract",
        label: m.t("interface"),
        cell: (row) => <bdi>{row.contract}</bdi>,
      },
      {
        id: "inspect",
        label: m.t("source"),
        cell: (row) => (
          <Button
            variant="secondary"
            onClick={() => this.setState({ details: row })}
          >
            {m.t("inspect")}: {row.name}
          </Button>
        ),
      },
    ];
    return (
      <section className="docs-example" aria-labelledby="docs-catalogue-title">
        <h3 id="docs-catalogue-title">{m.t("catalogue")}</h3>
        <p>{m.t("catalogueHint")}</p>
        <FormField id="docs-catalogue-search" label={m.t("search")}>
          <Input
            value={this.state.query}
            maxLength={120}
            onChange={(event) =>
              this.setState({ query: event.target.value, page: 1 })
            }
          />
        </FormField>
        <FormField id="docs-catalogue-mode" label={m.t("states")}>
          <Select
            value={this.state.mode}
            onChange={(event) => {
              const mode = event.target.value;
              if (
                mode === "ready" ||
                mode === "loading" ||
                mode === "empty" ||
                mode === "error"
              )
                this.setState({ mode });
            }}
          >
            <option value="ready">{m.t("ready")}</option>
            <option value="loading">{m.t("busy")}</option>
            <option value="empty">{m.t("empty")}</option>
            <option value="error">{m.t("error")}</option>
          </Select>
        </FormField>
        <Table<ComponentContract>
          caption={m.t("catalogue")}
          rows={rows}
          columns={columns}
          rowKey={(row) => row.name}
          loading={this.state.mode === "loading"}
          loadingLabel={local.messages.loading}
          emptyLabel={local.messages.empty}
          retryLabel={local.messages.retry}
          {...(this.state.mode === "error"
            ? { error: local.messages.error }
            : {})}
          onRetry={() => this.setState({ mode: "ready" })}
          sort={{
            column: "name",
            direction: this.state.descending ? "desc" : "asc",
          }}
          onSort={() =>
            this.setState((previous) => ({
              descending: !previous.descending,
              page: 1,
            }))
          }
          selected={this.state.selected}
          selectionLabel={(row) => `${local.messages.selected} ${row.name}`}
          onSelect={(name, checked) =>
            this.setState((previous) => {
              const selected = new Set(previous.selected);
              if (checked) selected.add(name);
              else selected.delete(name);
              return { selected };
            })
          }
        />
        <p role="status">
          {m.t("selected")}: {format.number(this.state.selected.size)}
        </p>
        <Pagination
          page={this.state.page}
          pageSize={4}
          total={all.length}
          label={local.messages.page}
          previousLabel={local.messages.previous}
          nextLabel={local.messages.next}
          formatNumber={(number) => format.number(number)}
          onChange={(page) => this.setState({ page })}
          disabled={this.state.mode !== "ready"}
        />
        <Drawer
          id="docs-contract-drawer"
          title={this.state.details?.name ?? m.t("interface")}
          open={this.state.details !== null}
          closeLabel={local.messages.close}
          onClose={() => this.setState({ details: null })}
          direction={local.direction}
          theme={this.props.theme}
        >
          <p>{this.state.details?.contract}</p>
          <p>{m.t("source")}</p>
          <code>{this.state.details?.source}</code>
        </Drawer>
      </section>
    );
  }
}
