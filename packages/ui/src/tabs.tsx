// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { KeyboardEvent, ReactNode } from "react";
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}
export interface TabsProps {
  readonly id: string;
  readonly label: string;
  readonly items: readonly TabItem[];
  readonly activeId: string;
  readonly onChange: (id: string) => void;
  readonly direction?: "rtl" | "ltr";
}
/** Manual activation: arrows move focus; Enter/Space activates. */
export class Tabs extends Component<TabsProps> {
  private move(event: KeyboardEvent<HTMLButtonElement>, id: string): void {
    const enabled = this.props.items.filter((item) => !item.disabled);
    const index = enabled.findIndex((item) => item.id === id);
    let target: TabItem | undefined;
    if (event.key === "Home") target = enabled[0];
    else if (event.key === "End") target = enabled.at(-1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const step =
        (event.key === "ArrowRight" ? 1 : -1) *
        (this.props.direction === "rtl" ? -1 : 1);
      target = enabled[(index + step + enabled.length) % enabled.length];
    }
    if (target) {
      event.preventDefault();
      document.getElementById(`${this.props.id}-tab-${target.id}`)?.focus();
    }
  }
  override render() {
    const { id, label, items, activeId, onChange, direction } = this.props;
    if (!items.some((item) => item.id === activeId && !item.disabled))
      throw new RangeError("Tabs requires an enabled activeId");
    if (new Set(items.map((item) => item.id)).size !== items.length)
      throw new RangeError("Tab IDs must be unique");
    return (
      <div className="summit-tabs" dir={direction}>
        <div role="tablist" aria-label={label}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${id}-tab-${item.id}`}
              aria-controls={`${id}-panel-${item.id}`}
              aria-selected={item.id === activeId}
              tabIndex={item.id === activeId ? 0 : -1}
              disabled={item.disabled}
              onKeyDown={(event) => this.move(event, item.id)}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {items.map((item) => (
          <section
            key={item.id}
            role="tabpanel"
            id={`${id}-panel-${item.id}`}
            aria-labelledby={`${id}-tab-${item.id}`}
            hidden={item.id !== activeId}
            tabIndex={0}
          >
            {item.content}
          </section>
        ))}
      </div>
    );
  }
}
