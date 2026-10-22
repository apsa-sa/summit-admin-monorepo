// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import { WorkspaceMessages, LocaleFormatter } from "@summit/localization";
import type { WorkspaceState } from "../state.js";
import type { WorkspaceController } from "../controller.js";
export interface ScreenProps {
  readonly state: WorkspaceState;
  readonly controller: WorkspaceController;
}
export class WorkspaceScreen extends Component<ScreenProps> {
  protected messages(): WorkspaceMessages {
    return new WorkspaceMessages(this.props.state.locale);
  }
  protected format(): LocaleFormatter {
    return new LocaleFormatter(this.props.state.locale);
  }
}
