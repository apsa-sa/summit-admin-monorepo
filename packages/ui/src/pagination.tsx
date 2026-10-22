// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import { Button } from "./controls.js";
export interface PaginationProps {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly onChange: (page: number) => void;
  readonly label: string;
  readonly previousLabel: string;
  readonly nextLabel: string;
  readonly formatNumber: (value: number) => string;
  readonly disabled?: boolean;
}
export class Pagination extends Component<PaginationProps> {
  override render() {
    const {
      page,
      pageSize,
      total,
      onChange,
      label,
      previousLabel,
      nextLabel,
      formatNumber,
      disabled,
    } = this.props;
    if (
      ![page, pageSize, total].every(Number.isSafeInteger) ||
      pageSize < 1 ||
      total < 0 ||
      page < 1
    )
      throw new RangeError("Invalid pagination values");
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (page > pages) throw new RangeError("Page exceeds page count");
    return (
      <nav className="summit-pagination" aria-label={label}>
        <Button
          variant="secondary"
          disabled={disabled || page === 1}
          onClick={() => onChange(page - 1)}
        >
          {previousLabel}
        </Button>
        <span aria-live="polite">
          {label} {formatNumber(page)} / {formatNumber(pages)}
        </span>
        <Button
          variant="secondary"
          disabled={disabled || page === pages}
          onClick={() => onChange(page + 1)}
        >
          {nextLabel}
        </Button>
      </nav>
    );
  }
}
