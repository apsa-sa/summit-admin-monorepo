// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { ReactNode } from "react";
import { Button, Tabs, Card, Alert } from "@summit/ui";
import { DocsMessages, WorkspaceMessages } from "@summit/localization";
import type { DocsPreferences } from "../next/preferences.js";
import { DocsCompositionRoot } from "./composition-root";
import type { DocsController } from "./controller.js";
import type { ComponentContract } from "./catalogue.js";
import { DocsFormExample } from "./form-example";
import { DocsCatalogueExample } from "./catalogue-example";
interface State extends DocsPreferences {
  tab: "form" | "catalogue";
  ready: boolean;
}
export class DocsWorkspace extends Component<DocsPreferences, State> {
  override state: State;
  private readonly controller: DocsController;
  private readonly entries: readonly ComponentContract[];
  constructor(props: DocsPreferences) {
    super(props);
    this.state = { ...props, tab: "form", ready: false };
    const root = new DocsCompositionRoot();
    this.controller = root.create((value) => this.setState(value));
    this.entries = root.components();
  }
  override componentDidMount(): void {
    this.setState({ ready: true });
  }
  override render(): ReactNode {
    const m = new DocsMessages(this.state.locale),
      common = new WorkspaceMessages(this.state.locale);
    return (
      <div
        className="docs-shell"
        data-docs-ready={this.state.ready ? "true" : "false"}
      >
        <a className="docs-skip" href="#docs-main">
          {m.t("skip")}
        </a>
        <header className="docs-topbar">
          <a className="docs-brand" href="#docs-start">
            SUMMIT / قمة
          </a>
          <nav aria-label={m.t("navigation")}>
            <a href="#docs-start">{m.t("start")}</a>
            <a href="#docs-components">{m.t("components")}</a>
            <a href="#docs-contracts">{m.t("contracts")}</a>
          </nav>
          <div className="docs-actions">
            <Button
              id="docs-language"
              disabled={!this.state.ready}
              variant="secondary"
              onClick={() =>
                this.controller.change({
                  locale: this.state.locale === "ar" ? "en" : "ar",
                  theme: this.state.theme,
                })
              }
            >
              {common.t("language")}
            </Button>
            <Button
              id="docs-theme"
              disabled={!this.state.ready}
              variant="secondary"
              onClick={() =>
                this.controller.change({
                  locale: this.state.locale,
                  theme: this.state.theme === "light" ? "dark" : "light",
                })
              }
            >
              {common.t("theme")}
            </Button>
          </div>
        </header>
        <main id="docs-main" tabIndex={-1} className="docs-main">
          <h1>{m.t("title")}</h1>
          <p className="docs-lead">{m.t("intro")}</p>
          <Alert title={m.t("status")}>{m.t("catalogueHint")}</Alert>
          <Card
            id="docs-start"
            className="docs-card"
            aria-labelledby="docs-start-title"
          >
            <h2 id="docs-start-title">{m.t("start")}</h2>
            <p>{m.t("startHint")}</p>
            <p>{m.t("environment")}</p>
            <pre tabIndex={0} aria-label={m.t("start")}>
              <code>{`corepack enable
pnpm install --frozen-lockfile
# Configure your private .env first
node --env-file=.env --import tsx tooling/scripts/database.ts migrate
node --env-file=.env --import tsx tooling/scripts/database.ts seed
pnpm build:packages
pnpm admin:dev`}</code>
            </pre>
            <p>{m.t("docsRun")}</p>
            <pre tabIndex={0}>
              <code>{`pnpm docs:dev
# Production builds, each at its own port:
NODE_ENV=production pnpm docs:build
NODE_ENV=production pnpm docs:start`}</code>
            </pre>
          </Card>
          <Card
            id="docs-components"
            className="docs-card"
            aria-labelledby="docs-components-title"
          >
            <h2 id="docs-components-title">{m.t("components")}</h2>
            <Tabs
              id="docs-workbench"
              label={m.t("components")}
              direction={this.state.locale === "ar" ? "rtl" : "ltr"}
              activeId={this.state.tab}
              onChange={(tab) => {
                if (tab === "form" || tab === "catalogue")
                  this.setState({ tab });
              }}
              items={[
                {
                  id: "form",
                  label: m.t("preview"),
                  content: (
                    <DocsFormExample
                      locale={this.state.locale}
                      theme={this.state.theme}
                    />
                  ),
                },
                {
                  id: "catalogue",
                  label: m.t("catalogue"),
                  content: (
                    <DocsCatalogueExample
                      locale={this.state.locale}
                      theme={this.state.theme}
                      entries={this.entries}
                    />
                  ),
                },
              ]}
            />
          </Card>
          <Card
            id="docs-contracts"
            className="docs-card"
            aria-labelledby="docs-contracts-title"
          >
            <h2 id="docs-contracts-title">{m.t("contracts")}</h2>
            <h3>{m.t("transport")}</h3>
            <p>{m.t("transportHint")}</p>
            <p>{m.t("version")}</p>
            <div className="docs-contract-list">
              <code>GET /api/me · POST /api/login · POST /api/logout</code>
              <code>GET/POST /api/users · PUT/DELETE /api/users/:id</code>
              <code>
                GET/PUT /api/draft · GET /api/audit · GET /api/users/export
              </code>
              <code>GET/PUT /api/preferences/users</code>
            </div>
            <h3>{m.t("extension")}</h3>
            <p>{m.t("structure")}</p>
            <pre tabIndex={0}>
              <code>{`packages/contracts → interfaces and DTOs
packages/core → validation and domain rules
packages/application → constructor-injected use cases
packages/data-access → independent PostgreSQL adapters
apps/web-admin/server/composition-root.ts → wiring
apps/web-admin/presentation → class screens and controllers`}</code>
            </pre>
          </Card>
        </main>
        <footer>
          <p>{m.t("license")}</p>
          <a href="https://github.com/apsa-sa/summit-admin-monorepo">
            {m.t("repository")}
          </a>
          <p>{common.t("copyright")}</p>
        </footer>
      </div>
    );
  }
}
