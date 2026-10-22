// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component, createRef } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: "primary" | "secondary" | "danger" | "ghost";
  /** Disables activation while retaining the accessible name. */
  readonly loading?: boolean;
}
export class Button extends Component<ButtonProps> {
  override render() {
    const {
      variant = "primary",
      loading = false,
      disabled,
      className = "",
      children,
      type = "button",
      ...rest
    } = this.props;
    return (
      <button
        {...rest}
        type={type}
        className={`summit-button summit-button--${variant} ${className}`}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
      >
        {loading && <span className="summit-spinner" aria-hidden="true" />}
        {children}
      </button>
    );
  }
}
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
}
export class Input extends Component<InputProps> {
  private readonly element = createRef<HTMLInputElement>();
  focus(): void {
    this.element.current?.focus();
  }
  override render() {
    const { invalid, className = "", ...rest } = this.props;
    return (
      <input
        {...rest}
        ref={this.element}
        className={`summit-input ${className}`}
        aria-invalid={invalid || rest["aria-invalid"]}
      />
    );
  }
}
export class Textarea extends Component<
  TextareaHTMLAttributes<HTMLTextAreaElement>
> {
  private readonly element = createRef<HTMLTextAreaElement>();
  focus(): void {
    this.element.current?.focus();
  }
  override render() {
    const { className = "", ...rest } = this.props;
    return (
      <textarea
        {...rest}
        ref={this.element}
        className={`summit-input ${className}`}
      />
    );
  }
}
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly invalid?: boolean;
}
/** Native select retains platform keyboard behavior. */
export class Select extends Component<SelectProps> {
  private readonly element = createRef<HTMLSelectElement>();
  focus(): void {
    this.element.current?.focus();
  }
  override render() {
    const { invalid, className = "", ...rest } = this.props;
    return (
      <select
        {...rest}
        ref={this.element}
        className={`summit-input ${className}`}
        aria-invalid={invalid || rest["aria-invalid"]}
      />
    );
  }
}
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "children"
> {
  readonly label: ReactNode;
  readonly indeterminate?: boolean;
}
export class Checkbox extends Component<CheckboxProps> {
  private readonly element = createRef<HTMLInputElement>();
  override componentDidMount(): void {
    this.sync();
  }
  override componentDidUpdate(): void {
    this.sync();
  }
  private sync(): void {
    if (this.element.current)
      this.element.current.indeterminate = this.props.indeterminate ?? false;
  }
  override render() {
    const { label, indeterminate, className = "", ...rest } = this.props;
    return (
      <label className={`summit-checkbox ${className}`}>
        <input
          {...rest}
          ref={this.element}
          type="checkbox"
          aria-checked={indeterminate ? "mixed" : rest.checked}
        />
        <span>{label}</span>
      </label>
    );
  }
}
