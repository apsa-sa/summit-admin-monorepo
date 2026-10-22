// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { ReactNode } from "react";
import {
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  FormField,
  Dialog,
  Drawer,
  Toast,
} from "@summit/ui";
import {
  DocsMessages,
  Localization,
  WorkspaceMessages,
} from "@summit/localization";
import type { DocsPreferences } from "../next/preferences.js";
interface State {
  name: string;
  role: string;
  disabled: boolean;
  dialog: boolean;
  drawer: boolean;
  toast: boolean;
}
/** Local component interactions, explicitly labelled as examples without server persistence. */
export class DocsFormExample extends Component<DocsPreferences, State> {
  override state: State = {
    name: "",
    role: "viewer",
    disabled: false,
    dialog: false,
    drawer: false,
    toast: false,
  };
  override render(): ReactNode {
    const m = new DocsMessages(this.props.locale),
      local = new Localization(this.props.locale),
      common = new WorkspaceMessages(this.props.locale);
    return (
      <section className="docs-example" aria-labelledby="docs-form-title">
        <h3 id="docs-form-title">{m.t("preview")}</h3>
        <p>{m.t("catalogueHint")}</p>
        <FormField
          id="docs-example-name"
          label={m.t("field")}
          description={m.t("fieldHint")}
        >
          <Input
            value={this.state.name}
            maxLength={120}
            onChange={(event) => this.setState({ name: event.target.value })}
          />
        </FormField>
        <FormField id="docs-example-role" label={m.t("choice")}>
          <Select
            value={this.state.role}
            onChange={(event) => this.setState({ role: event.target.value })}
          >
            <option value="viewer">{common.t("viewer")}</option>
            <option value="editor">{common.t("editor")}</option>
          </Select>
        </FormField>
        <FormField id="docs-example-notes" label={m.t("notes")}>
          <Textarea rows={2} />
        </FormField>
        <Checkbox
          label={m.t("checkbox")}
          checked={this.state.disabled}
          onChange={(event) =>
            this.setState({ disabled: event.target.checked })
          }
        />
        <div className="docs-actions">
          <Button
            id="docs-open-dialog"
            disabled={this.state.disabled}
            onClick={() => this.setState({ dialog: true })}
          >
            {m.t("preview")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => this.setState({ drawer: true })}
          >
            {m.t("drawer")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => this.setState({ toast: true })}
          >
            {m.t("notify")}
          </Button>
          <Button disabled>{m.t("disabled")}</Button>
          <Button loading>{m.t("loading")}</Button>
        </div>
        <Dialog
          id="docs-example-dialog"
          title={m.t("preview")}
          closeLabel={local.messages.close}
          open={this.state.dialog}
          onClose={() => this.setState({ dialog: false })}
          direction={local.direction}
          theme={this.props.theme}
        >
          <p>{this.state.name || m.t("sample")}</p>
          <FormField id="docs-dialog-input" label={m.t("field")}>
            <Input />
          </FormField>
        </Dialog>
        <Drawer
          id="docs-example-drawer"
          title={m.t("source")}
          closeLabel={local.messages.close}
          open={this.state.drawer}
          onClose={() => this.setState({ drawer: false })}
          direction={local.direction}
          theme={this.props.theme}
        >
          <p>{m.t("fieldHint")}</p>
          <p>{m.t("code")}</p>
          <pre tabIndex={0}>
            <code>{`import { Component } from 'react';
import { Button } from '@summit/ui';
export class Action extends Component<Record<string, never>, { pressed: boolean }> {
  override state = { pressed: false };
  override render() {
    return <Button onClick={() => this.setState({ pressed: true })}>
      {this.state.pressed ? 'Confirmed locally' : 'SUMMIT'}
    </Button>;
  }
}`}</code>
          </pre>
        </Drawer>
        {this.state.toast && (
          <Toast
            closeLabel={local.messages.close}
            onClose={() => this.setState({ toast: false })}
          >
            {m.t("notice")}
          </Toast>
        )}
      </section>
    );
  }
}
