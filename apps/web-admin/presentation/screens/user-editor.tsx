// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button, Input, Select, FormField, Drawer } from "@summit/ui";
import { WorkspaceMessages } from "@summit/localization";
import { Validation } from "../../../../packages/core/index.js";
import type {
  User,
  Role,
  Status,
} from "../../../../packages/contracts/index.js";
import type { ScreenProps } from "./screen.js";
interface EditorProps extends ScreenProps {
  readonly user: User | null;
}
interface EditorState {
  name: string;
  email: string;
  role: Role;
  status: Status;
}
export class UserEditor extends Component<EditorProps, EditorState> {
  constructor(props: EditorProps) {
    super(props);
    this.state = {
      name: props.user?.name ?? "",
      email: props.user?.email ?? "",
      role: props.user?.role ?? "viewer",
      status: props.user?.status ?? "active",
    };
  }
  private submit(event: FormEvent): void {
    event.preventDefault();
    void this.props.controller.saveUser(
      { ...this.state, version: this.props.user?.version ?? 0 },
      this.props.user?.id ?? null,
    );
  }
  override render(): ReactNode {
    const { state: s, controller: c, user } = this.props,
      m = new WorkspaceMessages(s.locale),
      locked = s.user?.role !== "admin" || s.user.id === user?.id;
    return (
      <Drawer
        id="admin-user-drawer"
        open
        title={m.t("details")}
        closeLabel={m.t("close")}
        direction={s.locale === "ar" ? "rtl" : "ltr"}
        theme={s.theme}
        onClose={() => {
          if (!s.busy) c.store.patch({ editing: undefined });
        }}
      >
        <form
          method="post"
          action="/api/users"
          onSubmit={(event) => this.submit(event)}
        >
          {s.formError && <p role="alert">{s.formError}</p>}
          <FormField id="admin-user-name" label={m.t("name")} required>
            <Input
              name="name"
              value={this.state.name}
              maxLength={120}
              disabled={s.busy}
              onChange={(event) => this.setState({ name: event.target.value })}
            />
          </FormField>
          <FormField id="admin-user-email" label={m.t("email")} required>
            <Input
              type="email"
              name="email"
              value={this.state.email}
              maxLength={254}
              disabled={s.busy}
              onChange={(event) => this.setState({ email: event.target.value })}
            />
          </FormField>
          <FormField id="admin-user-role" label={m.t("role")}>
            <Select
              value={this.state.role}
              disabled={s.busy || locked}
              onChange={(event) =>
                this.setState({ role: Validation.role(event.target.value) })
              }
            >
              {(["admin", "editor", "viewer"] as const).map((role) => (
                <option key={role} value={role}>
                  {m.t(role)}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="admin-user-status" label={m.t("status")}>
            <Select
              value={this.state.status}
              disabled={s.busy || locked}
              onChange={(event) =>
                this.setState({ status: Validation.status(event.target.value) })
              }
            >
              {(["active", "invited", "suspended"] as const).map((status) => (
                <option key={status} value={status}>
                  {m.t(status)}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="submit" loading={s.busy}>
            {m.t("save")}
          </Button>
        </form>
      </Drawer>
    );
  }
}
