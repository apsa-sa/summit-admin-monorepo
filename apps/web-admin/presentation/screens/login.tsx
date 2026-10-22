// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button, Input, FormField } from "@summit/ui";
import { WorkspaceMessages } from "@summit/localization";
import type { ScreenProps } from "./screen.js";
export class LoginScreen extends Component<
  ScreenProps,
  { email: string; password: string }
> {
  override state = { email: "", password: "" };
  private submit(event: FormEvent): void {
    event.preventDefault();
    const { email, password } = this.state;
    this.setState({ password: "" });
    void this.props.controller.login(email, password);
  }
  override render(): ReactNode {
    const s = this.props.state,
      c = this.props.controller,
      m = new WorkspaceMessages(s.locale);
    return (
      <main className="admin-login">
        <section className="admin-login-brand">
          <a className="admin-brand" href="/">
            SUMMIT <span>/ قمة</span>
          </a>
          <h1>{m.t("tagline")}</h1>
          <p>{m.t("sourceHint")}</p>
        </section>
        <section className="admin-login-form">
          <div className="admin-actions">
            <Button
              variant="ghost"
              onClick={() =>
                c.preferencesChanged(s.locale === "ar" ? "en" : "ar", s.theme)
              }
            >
              {m.t("language")}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                c.preferencesChanged(
                  s.locale,
                  s.theme === "light" ? "dark" : "light",
                )
              }
            >
              {m.t("theme")}
            </Button>
          </div>
          <h2>{m.t("signIn")}</h2>
          {s.message && <p role="alert">{s.message}</p>}
          {s.offline && <p role="status">{m.t("offline")}</p>}
          {s.logoutFailed ? (
            <div>
              <p>{m.t("logoutFailed")}</p>
              <Button
                loading={s.busy}
                onClick={() => {
                  void c.logout();
                }}
              >
                {m.t("retry")} · {m.t("signOut")}
              </Button>
            </div>
          ) : (
            <form
              method="post"
              action="/api/login"
              onSubmit={(event) => this.submit(event)}
            >
              <FormField id="admin-email" label={m.t("email")} required>
                <Input
                  name="email"
                  type="email"
                  autoComplete="username"
                  maxLength={254}
                  value={this.state.email}
                  disabled={s.busy}
                  onChange={(event) =>
                    this.setState({ email: event.target.value })
                  }
                />
              </FormField>
              <FormField id="admin-password" label={m.t("password")} required>
                <Input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  maxLength={128}
                  value={this.state.password}
                  disabled={s.busy}
                  onChange={(event) =>
                    this.setState({ password: event.target.value })
                  }
                />
              </FormField>
              <Button type="submit" loading={s.busy} disabled={s.booting}>
                {s.booting ? m.t("loading") : m.t("signIn")}
              </Button>
            </form>
          )}
          <p className="admin-copyright">{m.t("copyright")}</p>
        </section>
      </main>
    );
  }
}
