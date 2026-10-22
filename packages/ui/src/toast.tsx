// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { ReactNode } from "react";
import { Button } from "./controls.js";
export interface ToastProps {
  readonly children: ReactNode;
  readonly closeLabel: string;
  readonly onClose: () => void;
  readonly tone?: "info" | "success" | "error";
}
/** Persistent notification; consumer controls lifetime. */
export class Toast extends Component<ToastProps> {
  override render() {
    const { children, closeLabel, onClose, tone = "info" } = this.props;
    return (
      <div className={`summit-toast summit-toast--${tone}`}>
        <div role={tone === "error" ? "alert" : "status"}>{children}</div>
        <Button variant="ghost" onClick={onClose}>
          {closeLabel}
        </Button>
      </div>
    );
  }
}
