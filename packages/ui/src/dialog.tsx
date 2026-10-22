// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component, createRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./controls.js";
import { FocusCycle } from "./focus-cycle.js";
export interface DialogProps {
  readonly id: string;
  readonly open: boolean;
  readonly title: string;
  readonly closeLabel: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly description?: string;
  readonly direction?: "rtl" | "ltr";
  readonly theme?: "light" | "dark";
  readonly placement?: "center" | "end";
}
/** Native modal provides focus containment and inert background without a portal. */
export class Dialog extends Component<DialogProps> {
  private readonly element = createRef<HTMLDialogElement>();
  private readonly focus = new FocusCycle();
  private previousFocus: HTMLElement | null = null;
  override componentDidMount(): void {
    this.sync();
  }
  override componentDidUpdate(): void {
    this.sync();
  }
  override componentWillUnmount(): void {
    this.close();
  }
  private sync(): void {
    const element = this.element.current;
    if (this.props.open && element && !element.open) {
      this.previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      element.showModal();
    } else if (!this.props.open) this.close();
  }
  private close(): void {
    if (this.element.current?.open) {
      this.element.current.close();
      if (this.previousFocus?.isConnected) this.previousFocus.focus();
      this.previousFocus = null;
    }
  }
  override render() {
    const {
      id,
      title,
      description,
      closeLabel,
      children,
      direction,
      theme,
      placement = "center",
      onClose,
    } = this.props;
    return (
      <dialog
        ref={this.element}
        id={id}
        dir={direction}
        data-summit-theme={theme}
        className={`summit-theme summit-dialog summit-dialog--${placement}`}
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        onKeyDown={(event) => {
          if (this.element.current) this.focus.tab(event, this.element.current);
        }}
        onClose={() => {
          if (this.props.open) this.props.onClose();
        }}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <div className="summit-dialog-heading">
          <h2 id={`${id}-title`}>{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            {closeLabel}
          </Button>
        </div>
        {description && <p id={`${id}-description`}>{description}</p>}
        {children}
      </dialog>
    );
  }
}
export interface DrawerProps extends Omit<DialogProps, "placement"> {}
export class Drawer extends Component<DrawerProps> {
  override render() {
    return <Dialog {...this.props} placement="end" />;
  }
}
