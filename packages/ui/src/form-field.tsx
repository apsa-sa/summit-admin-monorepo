// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component, cloneElement } from "react";
import type { AriaAttributes, ReactElement, ReactNode } from "react";
export interface FieldControlProps extends AriaAttributes {
  readonly id?: string | undefined;
  readonly required?: boolean | undefined;
}
export interface FormFieldProps {
  /** Stable unique ID supplied by the consumer. */
  readonly id: string;
  readonly label: ReactNode;
  readonly description?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: ReactElement<FieldControlProps>;
}
export class FormField extends Component<FormFieldProps> {
  override render() {
    const { id, label, description, error, required, children } = this.props;
    const describedBy = [
      children.props["aria-describedby"],
      description ? `${id}-description` : "",
      error ? `${id}-error` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <div className="summit-field">
        <label htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        {cloneElement(children, {
          id,
          required: required ?? children.props.required ?? false,
          "aria-invalid": error ? true : children.props["aria-invalid"],
          "aria-describedby": describedBy || undefined,
        })}
        {description && (
          <p id={`${id}-description`} className="summit-secondary">
            {description}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="summit-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
}
