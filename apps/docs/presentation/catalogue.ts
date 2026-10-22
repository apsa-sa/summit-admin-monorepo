// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
export type UiSymbol = keyof typeof import("@summit/ui");
export interface ComponentContract {
  readonly name: UiSymbol;
  readonly contract: string;
  readonly source: string;
}
/** Names are checked against actual built UI exports. No unfinished Calendar is advertised. */
export class ComponentCatalogue {
  entries(): readonly ComponentContract[] {
    return [
      {
        name: "Card",
        contract: "CardProps · semantic section and native attributes",
        source: "packages/ui/src/surfaces.tsx",
      },
      {
        name: "Alert",
        contract: "AlertProps · title, tone, children and native attributes",
        source: "packages/ui/src/surfaces.tsx",
      },
      {
        name: "Tooltip",
        contract:
          "TooltipProps · id, label, short content, direction, theme; owned help button",
        source: "packages/ui/src/tooltip.tsx",
      },
      {
        name: "Button",
        contract: "ButtonProps · native button attributes, variant, loading",
        source: "packages/ui/src/controls.tsx",
      },
      {
        name: "Input",
        contract:
          "InputProps · native input attributes, invalid, instance focus()",
        source: "packages/ui/src/controls.tsx",
      },
      {
        name: "Select",
        contract:
          "SelectProps · native select attributes, invalid, instance focus()",
        source: "packages/ui/src/controls.tsx",
      },
      {
        name: "Textarea",
        contract: "TextareaHTMLAttributes · instance focus()",
        source: "packages/ui/src/controls.tsx",
      },
      {
        name: "Checkbox",
        contract:
          "CheckboxProps · label, checked, indeterminate, native attributes",
        source: "packages/ui/src/controls.tsx",
      },
      {
        name: "FormField",
        contract:
          "FormFieldProps · id, label, control child, description, error, required",
        source: "packages/ui/src/form-field.tsx",
      },
      {
        name: "Dialog",
        contract:
          "DialogProps · id, open, title, closeLabel, onClose, direction, theme",
        source: "packages/ui/src/dialog.tsx",
      },
      {
        name: "Modal",
        contract: "Alias of Dialog with the same DialogProps contract",
        source: "packages/ui/src/dialog.tsx",
      },
      {
        name: "Drawer",
        contract: "DrawerProps · Dialog contract at the logical end",
        source: "packages/ui/src/dialog.tsx",
      },
      {
        name: "Toast",
        contract: "ToastProps · children, closeLabel, onClose, optional tone",
        source: "packages/ui/src/toast.tsx",
      },
      {
        name: "Tabs",
        contract:
          "TabItem/TabsProps · labelled items, activeId, onChange, direction",
        source: "packages/ui/src/tabs.tsx",
      },
      {
        name: "Table",
        contract:
          "TableProps<Row> · typed page, columns, sort, selection, row eligibility, retry",
        source: "packages/ui/src/table.tsx",
      },
      {
        name: "Pagination",
        contract:
          "PaginationProps · finite page/pageSize/total, labels, formatter, onChange",
        source: "packages/ui/src/pagination.tsx",
      },
    ];
  }
}
