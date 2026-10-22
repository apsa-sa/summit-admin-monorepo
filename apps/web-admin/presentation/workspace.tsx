// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { ReactNode } from "react";
import { Button, Dialog, Drawer, Input, Toast } from "@summit/ui";
import { WorkspaceMessages } from "@summit/localization";
import type { Locale } from "@summit/localization";
import type { Theme } from "@summit/design-tokens";
import type { User } from "../../../packages/contracts/index.js";
import { WorkspaceCompositionRoot } from "./composition-root.js";
import type { WorkspaceState, ViewName } from "./state.js";
import { WorkspaceController } from "./controller.js";
import {
  LoginScreen,
  OverviewScreen,
  UsersScreen,
  UserEditor,
  DraftScreen,
  AuditScreen,
  SettingsScreen,
} from "./views.js";
interface Props {
  readonly locale: Locale;
  readonly theme: Theme;
  readonly initialUser: User | null;
}
export class AdminWorkspace extends Component<Props, WorkspaceState> {
  private mounted = false;
  readonly controller: WorkspaceController;
  constructor(props: Props) {
    super(props);
    this.controller = new WorkspaceCompositionRoot().create(
      props.locale,
      props.theme,
      props.initialUser,
      (snapshot) => {
        if (this.mounted) this.setState(snapshot);
      },
    );
    this.state = this.controller.store.snapshot;
  }
  override componentDidMount(): void {
    this.mounted = true;
    void this.controller.mount();
  }
  override componentWillUnmount(): void {
    this.mounted = false;
    this.controller.dispose();
  }
  private screen(): ReactNode {
    const props = { state: this.state, controller: this.controller };
    switch (this.state.view) {
      case "users":
        return <UsersScreen {...props} />;
      case "drafts":
        return <DraftScreen {...props} />;
      case "audit":
        return <AuditScreen {...props} />;
      case "settings":
        return <SettingsScreen {...props} />;
      default:
        return <OverviewScreen {...props} />;
    }
  }
  private navigation(): ReactNode {
    const m = new WorkspaceMessages(this.state.locale),
      c = this.controller;
    return (
      <nav aria-label={m.t("navigation")}>
        {c.destinations().map((view) => (
          <a
            key={view}
            href={c.href(view)}
            aria-current={view === this.state.view ? "page" : undefined}
            onClick={(event) => {
              if (
                event.button === 0 &&
                !event.ctrlKey &&
                !event.metaKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                c.navigate(view);
              }
            }}
          >
            {m.t(view)}
          </a>
        ))}
      </nav>
    );
  }
  override render(): ReactNode {
    const s = this.state,
      c = this.controller,
      m = new WorkspaceMessages(s.locale);
    if (!s.user) return <LoginScreen state={s} controller={c} />;
    const direction = s.locale === "ar" ? "rtl" : "ltr";
    return (
      <>
        <a className="admin-skip" href="#admin-content">
          {m.t("skip")}
        </a>
        <div className="admin-shell" data-collapsed={s.collapsed}>
          <aside className="admin-sidebar">
            <a className="admin-brand" href="/">
              SUMMIT <span>/ قمة</span>
            </a>
            {this.navigation()}
            <Button
              variant="ghost"
              onClick={() => c.store.patch({ collapsed: !s.collapsed })}
            >
              {m.t("collapse")}
            </Button>
          </aside>
          <div className="admin-main">
            <header className="admin-topbar">
              <Button
                className="admin-mobile-trigger"
                variant="secondary"
                onClick={() => c.store.patch({ mobile: true })}
              >
                {m.t("menu")}
              </Button>
              <h1>{m.t(s.view)}</h1>
              <div className="admin-actions">
                <Button
                  variant="ghost"
                  onClick={() => c.store.patch({ palette: true, command: "" })}
                >
                  {m.t("commands")} <kbd>⌘/Ctrl K</kbd>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    c.preferencesChanged(
                      s.locale === "ar" ? "en" : "ar",
                      s.theme,
                    )
                  }
                >
                  {m.t("language")}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    c.preferencesChanged(
                      s.locale,
                      s.theme === "light" ? "dark" : "light",
                    )
                  }
                >
                  {m.t("theme")}
                </Button>
                <Button
                  variant="secondary"
                  loading={s.busy}
                  onClick={() => {
                    void c.logout();
                  }}
                >
                  {m.t("signOut")}
                </Button>
              </div>
            </header>
            <main id="admin-content" tabIndex={-1}>
              {s.offline && <p role="status">{m.t("offline")}</p>}
              {s.message && (
                <Toast
                  closeLabel={m.t("close")}
                  tone={s.error ? "error" : "success"}
                  onClose={() => c.store.patch({ message: "" })}
                >
                  {s.message}
                </Toast>
              )}
              {this.screen()}
            </main>
            <footer>{m.t("copyright")}</footer>
          </div>
        </div>
        {s.editing !== undefined && (
          <UserEditor
            key={s.editing?.id ?? "new"}
            state={s}
            controller={c}
            user={s.editing}
          />
        )}
        <Dialog
          id="admin-delete-dialog"
          open={s.removing !== null}
          title={m.t("confirmRemove")}
          closeLabel={m.t("cancel")}
          direction={direction}
          theme={s.theme}
          onClose={() => {
            if (!s.busy) c.store.patch({ removing: null });
          }}
        >
          <p>{m.t("deleteHint")}</p>
          <p>{s.removing?.name}</p>
          <Button
            variant="danger"
            loading={s.busy}
            onClick={() => {
              void c.removeUser();
            }}
          >
            {m.t("remove")}
          </Button>
        </Dialog>
        <Drawer
          id="admin-mobile-navigation"
          open={s.mobile}
          title={m.t("navigation")}
          closeLabel={m.t("close")}
          direction={direction}
          theme={s.theme}
          onClose={() => c.store.patch({ mobile: false })}
        >
          {this.navigation()}
        </Drawer>
        <Dialog
          id="admin-command-palette"
          open={s.palette}
          title={m.t("commands")}
          closeLabel={m.t("close")}
          direction={direction}
          theme={s.theme}
          onClose={() => c.store.patch({ palette: false })}
        >
          <label htmlFor="admin-command-search">{m.t("commandSearch")}</label>
          <Input
            id="admin-command-search"
            value={s.command}
            maxLength={120}
            onChange={(event) => c.store.patch({ command: event.target.value })}
          />
          <ul className="admin-command-list">
            {c
              .destinations()
              .filter((view: ViewName) =>
                m
                  .t(view)
                  .toLocaleLowerCase(s.locale)
                  .includes(s.command.toLocaleLowerCase(s.locale)),
              )
              .map((view) => (
                <li key={view}>
                  <Button variant="ghost" onClick={() => c.navigate(view)}>
                    {m.t(view)}
                  </Button>
                </li>
              ))}
          </ul>
        </Dialog>
      </>
    );
  }
}
