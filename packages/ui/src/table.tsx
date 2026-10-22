// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import type { ReactNode } from "react";
import { Button, Checkbox } from "./controls.js";
export interface TableColumn<Row> {
  readonly id: string;
  readonly label: string;
  readonly cell: (row: Row) => ReactNode;
  readonly sortable?: boolean;
}
export interface TableProps<Row> {
  readonly caption: string;
  readonly columns: readonly TableColumn<Row>[];
  readonly rows: readonly Row[];
  readonly rowKey: (row: Row) => string;
  readonly loading?: boolean;
  readonly loadingLabel: string;
  readonly emptyLabel: string;
  readonly error?: string;
  readonly retryLabel: string;
  readonly onRetry?: () => void;
  readonly sort?: {
    readonly column: string;
    readonly direction: "asc" | "desc";
  };
  readonly onSort?: (column: string) => void;
  readonly selected?: ReadonlySet<string>;
  readonly selectionLabel?: (row: Row) => string;
  readonly onSelect?: (key: string, selected: boolean) => void;
}
/** Renders the supplied page; fetching and permissions belong to application services. */
export class Table<Row> extends Component<TableProps<Row>> {
  override render() {
    const p = this.props;
    if (p.columns.length === 0)
      throw new RangeError("Table requires at least one column");
    if (
      p.sort &&
      !p.columns.some(
        (column) => column.id === p.sort?.column && column.sortable,
      )
    )
      throw new RangeError("Invalid sort column");
    if (new Set(p.columns.map((column) => column.id)).size !== p.columns.length)
      throw new RangeError("Column IDs must be unique");
    if (new Set(p.rows.map(p.rowKey)).size !== p.rows.length)
      throw new RangeError("Row keys must be unique");
    if (p.onSelect && !p.selectionLabel)
      throw new TypeError("Selectable rows require accessible labels");
    return (
      <div className="summit-table-scroll" aria-busy={p.loading || undefined}>
        <table className="summit-table">
          <caption>{p.caption}</caption>
          <thead>
            <tr>
              {p.onSelect && (
                <th scope="col">
                  <span className="summit-sr-only">{p.caption}</span>
                </th>
              )}
              {p.columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  aria-sort={
                    p.sort?.column === column.id
                      ? p.sort.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {column.sortable && p.onSort ? (
                    <Button
                      variant="ghost"
                      onClick={() => p.onSort?.(column.id)}
                    >
                      {column.label}
                    </Button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.loading || p.error || p.rows.length === 0 ? (
              <tr>
                <td colSpan={p.columns.length + (p.onSelect ? 1 : 0)}>
                  {p.loading ? (
                    <span role="status">{p.loadingLabel}</span>
                  ) : p.error ? (
                    <div role="alert">
                      {p.error}
                      {p.onRetry && (
                        <Button variant="secondary" onClick={p.onRetry}>
                          {p.retryLabel}
                        </Button>
                      )}
                    </div>
                  ) : (
                    p.emptyLabel
                  )}
                </td>
              </tr>
            ) : (
              p.rows.map((row) => {
                const key = p.rowKey(row);
                return (
                  <tr key={key}>
                    {p.onSelect && (
                      <td>
                        <Checkbox
                          label={p.selectionLabel?.(row)}
                          checked={p.selected?.has(key) ?? false}
                          onChange={(event) =>
                            p.onSelect?.(key, event.target.checked)
                          }
                        />
                      </td>
                    )}
                    {p.columns.map((column) => (
                      <td key={column.id}>{column.cell(row)}</td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
