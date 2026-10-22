// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component, createRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { TooltipPositioner } from "./tooltip-positioner.js";
import type { TooltipPosition } from "./tooltip-positioner.js";
export interface TooltipProps {
  readonly id: string;
  readonly label: string;
  readonly content: string;
  readonly direction: "ltr" | "rtl";
  readonly theme: "light" | "dark";
}
interface State {
  ready: boolean;
  focused: boolean;
  hovered: boolean;
  dismissed: boolean;
  position: TooltipPosition;
}
/** Short, non-interactive supplementary text with an owned, keyboard-focusable help button. */
export class Tooltip extends Component<TooltipProps, State> {
  override state: State = {
    ready: false,
    focused: false,
    hovered: false,
    dismissed: false,
    position: { top: 0, left: 0, placement: "above" },
  };
  private readonly trigger = createRef<HTMLButtonElement>();
  private readonly bubble = createRef<HTMLDivElement>();
  private readonly positioner = new TooltipPositioner();
  private portal: HTMLDivElement | null = null;
  private listening = false;
  override componentDidMount(): void {
    const button = this.trigger.current;
    if (!button) return;
    this.portal = button.ownerDocument.createElement("div");
    // Stay in the native modal's top layer when the trigger belongs to a dialog.
    (button.closest("dialog") ?? button.ownerDocument.body).append(this.portal);
    this.setState({ ready: true });
  }
  override componentDidUpdate(): void {
    if (this.visible()) {
      this.listen();
      this.reposition();
    } else this.unlisten();
  }
  override componentWillUnmount(): void {
    this.unlisten();
    this.portal?.remove();
    this.portal = null;
  }
  private visible(): boolean {
    return (
      this.state.ready &&
      !this.state.dismissed &&
      (this.state.focused || this.state.hovered)
    );
  }
  private listen(): void {
    if (this.listening) return;
    const owner = this.trigger.current?.ownerDocument;
    if (!owner) return;
    owner.addEventListener("keydown", this.onKeyDown, true);
    owner.addEventListener("scroll", this.reposition, true);
    owner.defaultView?.addEventListener("resize", this.reposition);
    owner.fonts.addEventListener("loadingdone", this.reposition);
    this.listening = true;
  }
  private unlisten(): void {
    const owner = this.trigger.current?.ownerDocument;
    owner?.removeEventListener("keydown", this.onKeyDown, true);
    owner?.removeEventListener("scroll", this.reposition, true);
    owner?.defaultView?.removeEventListener("resize", this.reposition);
    owner?.fonts.removeEventListener("loadingdone", this.reposition);
    this.listening = false;
  }
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.setState({ dismissed: true });
    }
  };
  private readonly reposition = (): void => {
    const trigger = this.trigger.current,
      bubble = this.bubble.current,
      view = trigger?.ownerDocument.defaultView;
    if (!trigger || !bubble || !view || !this.visible()) return;
    const anchor = trigger.getBoundingClientRect(),
      box = bubble.getBoundingClientRect();
    if (anchor.bottom < 0 || anchor.top > view.innerHeight) {
      this.setState({ dismissed: true });
      return;
    }
    const gap =
      Number.parseFloat(view.getComputedStyle(bubble).paddingBlockStart) || 0;
    const position = this.positioner.place(
      anchor,
      box,
      { width: view.innerWidth, height: view.innerHeight },
      gap,
    );
    if (
      position.top !== this.state.position.top ||
      position.left !== this.state.position.left ||
      position.placement !== this.state.position.placement
    )
      this.setState({ position });
  };
  private contains(target: EventTarget | null): boolean {
    const NodeType = this.trigger.current?.ownerDocument.defaultView?.Node;
    return Boolean(
      NodeType &&
      target instanceof NodeType &&
      (this.trigger.current?.contains(target) ||
        this.bubble.current?.contains(target)),
    );
  }
  override render(): ReactNode {
    const { id, label, content, direction, theme } = this.props;
    if (
      !id ||
      /\s/.test(id) ||
      !label.trim() ||
      !content.trim() ||
      content.length > 160 ||
      !["ltr", "rtl"].includes(direction) ||
      !["light", "dark"].includes(theme)
    )
      throw new TypeError(
        "Tooltip requires a unique id, label, short text, direction and theme",
      );
    return (
      <>
        <button
          ref={this.trigger}
          type="button"
          className="summit-button summit-button--secondary"
          aria-describedby={id}
          onFocus={() => this.setState({ focused: true, dismissed: false })}
          onBlur={(event) => {
            if (!this.contains(event.relatedTarget))
              this.setState({ focused: false });
          }}
          onMouseEnter={() =>
            this.setState({ hovered: true, dismissed: false })
          }
          onMouseLeave={(event) => {
            if (!this.contains(event.relatedTarget))
              this.setState({ hovered: false });
          }}
        >
          {label}
        </button>
        {!this.state.ready && (
          <span id={id} hidden>
            {content}
          </span>
        )}
        {this.portal &&
          createPortal(
            <div
              ref={this.bubble}
              id={id}
              role="tooltip"
              hidden={!this.visible()}
              dir={direction}
              data-summit-theme={theme}
              data-placement={this.state.position.placement}
              className="summit-theme summit-tooltip"
              style={{
                top: this.state.position.top,
                left: this.state.position.left,
              }}
              onMouseEnter={() => this.setState({ hovered: true })}
              onMouseLeave={(event) => {
                if (!this.contains(event.relatedTarget))
                  this.setState({ hovered: false });
              }}
            >
              <div className="summit-tooltip-text">{content}</div>
            </div>,
            this.portal,
          )}
      </>
    );
  }
}
