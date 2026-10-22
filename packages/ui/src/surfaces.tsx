// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { HTMLAttributes, ReactNode } from "react";
export interface CardProps extends HTMLAttributes<HTMLElement> {}
/** A semantic section; consumers supply its heading or accessible name. */
export class Card extends Component<CardProps> {
  override render(): ReactNode {
    const { className = "", children, ...attributes } = this.props;
    return (
      <section {...attributes} className={`summit-card ${className}`}>
        {children}
      </section>
    );
  }
}
export type AlertTone = "info" | "success" | "warning" | "error";
export interface AlertProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "role" | "title"
> {
  readonly title: string;
  readonly tone?: AlertTone;
}
/** Persistent, non-dismissible message. Meaning is conveyed by title/text as well as colour. */
export class Alert extends Component<AlertProps> {
  override render(): ReactNode {
    const {
      title,
      tone = "info",
      className = "",
      children,
      ...attributes
    } = this.props;
    if (
      !title.trim() ||
      !["info", "success", "warning", "error"].includes(tone)
    )
      throw new TypeError("Alert requires a title and a supported tone");
    return (
      <div
        {...attributes}
        role={tone === "error" ? "alert" : "status"}
        className={`summit-alert summit-alert--${tone} ${className}`}
      >
        <strong>{title}</strong>
        <div>{children}</div>
      </div>
    );
  }
}
