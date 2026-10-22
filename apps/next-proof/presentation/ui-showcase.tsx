// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
"use client";
import { Component } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  Drawer,
  FormField,
  Input,
  Pagination,
  Select,
  Table,
  Tabs,
  Textarea,
  Toast,
} from "@summit/ui";
import type { TableColumn } from "@summit/ui";
import { Localization, LocaleFormatter } from "@summit/localization";
import type { Locale } from "@summit/localization";
import type { ProofTheme } from "./preferences";
interface Props {
  readonly locale: Locale;
  readonly theme: ProofTheme;
}
interface Row {
  readonly id: string;
  readonly name: string;
}
interface State {
  name: string;
  selection: string;
  checked: boolean;
  dialog: boolean;
  drawer: boolean;
  toast: boolean;
  tab: string;
  page: number;
  descending: boolean;
  selected: ReadonlySet<string>;
  tableState: "ready" | "loading" | "empty" | "error";
}
class ShowcaseMessages {
  for(locale: Locale) {
    return locale === "ar"
      ? {
          title: "معرض الحزم المشتركة",
          note: "بيانات تفاعلية محلية لاختبار المكونات؛ لا تُحفظ على الخادم.",
          name: "اسم العرض",
          description: "يمكن إدخال نص عربي أو إنجليزي.",
          choice: "نوع العرض",
          standard: "قياسي",
          compact: "مضغوط",
          agree: "تفعيل خيار تجريبي",
          dialog: "فتح الحوار",
          drawer: "فتح اللوحة",
          notify: "عرض إشعار",
          notification: "إشعار تجريبي من مكتبة المكونات",
          tabs: "أمثلة التبويبات",
          first: "النموذج",
          second: "الجدول",
          disabled: "غير متاح",
          table: "سجلات محلية تجريبية",
          notes: "ملاحظات العرض",
          states: "حالة الجدول",
          ready: "جاهز",
          loading: "تحميل",
          empty: "فارغ",
          error: "خطأ",
          selected: "تحديد",
          sample: "سجل تجريبي",
        }
      : {
          title: "Shared package gallery",
          note: "Local interactive fixtures for component verification; nothing is saved to the server.",
          name: "Display name",
          description: "Arabic and English text are supported.",
          choice: "Display density",
          standard: "Standard",
          compact: "Compact",
          agree: "Enable sample option",
          dialog: "Open dialog",
          drawer: "Open drawer",
          notify: "Show notification",
          notification: "Sample notification from the component library",
          tabs: "Tab examples",
          first: "Form",
          second: "Table",
          disabled: "Unavailable",
          table: "Local sample records",
          notes: "Display notes",
          states: "Table state",
          ready: "Ready",
          loading: "Loading",
          empty: "Empty",
          error: "Error",
          selected: "Select",
          sample: "Sample record",
        };
  }
}
/** Real package consumer, deliberately separate from the final reference admin product. */
export class UiPackageShowcase extends Component<Props, State> {
  private readonly messages = new ShowcaseMessages();
  override state: State = {
    name: "",
    selection: "standard",
    checked: false,
    dialog: false,
    drawer: false,
    toast: false,
    tab: "form",
    page: 1,
    descending: false,
    selected: new Set(),
    tableState: "ready",
  };
  private rows(label: string): Row[] {
    const rows = Array.from({ length: 5 }, (_, index) => ({
      id: String(index + 1),
      name: `${label} ${index + 1}`,
    }));
    return this.state.descending ? rows.reverse() : rows;
  }
  override render() {
    const text = this.messages.for(this.props.locale);
    const local = new Localization(this.props.locale);
    const format = new LocaleFormatter(this.props.locale);
    const columns: readonly TableColumn<Row>[] = [
      {
        id: "name",
        label: text.name,
        sortable: true,
        cell: (row) => <bdi>{row.name}</bdi>,
      },
    ];
    const allRows = this.rows(text.sample);
    const rows =
      this.state.tableState === "empty"
        ? []
        : allRows.slice((this.state.page - 1) * 2, this.state.page * 2);
    return (
      <section
        className="summit-theme summit-showcase"
        data-summit-theme={this.props.theme}
        dir={local.direction}
        lang={this.props.locale}
        aria-labelledby="gallery-title"
      >
        <h2 id="gallery-title">{text.title}</h2>
        <p className="summit-secondary">{text.note}</p>
        <Tabs
          id="gallery"
          label={text.tabs}
          direction={local.direction}
          activeId={this.state.tab}
          onChange={(tab) => this.setState({ tab })}
          items={[
            {
              id: "form",
              label: text.first,
              content: (
                <div>
                  <FormField
                    id="gallery-name"
                    label={text.name}
                    description={text.description}
                  >
                    <Input
                      value={this.state.name}
                      maxLength={120}
                      onChange={(event) =>
                        this.setState({ name: event.target.value })
                      }
                    />
                  </FormField>
                  <FormField id="gallery-density" label={text.choice}>
                    <Select
                      value={this.state.selection}
                      onChange={(event) =>
                        this.setState({ selection: event.target.value })
                      }
                    >
                      <option value="standard">{text.standard}</option>
                      <option value="compact">{text.compact}</option>
                    </Select>
                  </FormField>
                  <FormField id="gallery-notes" label={text.notes}>
                    <Textarea rows={2} />
                  </FormField>
                  <Checkbox
                    label={text.agree}
                    checked={this.state.checked}
                    onChange={(event) =>
                      this.setState({ checked: event.target.checked })
                    }
                  />
                </div>
              ),
            },
            {
              id: "disabled",
              label: text.disabled,
              disabled: true,
              content: null,
            },
            {
              id: "table",
              label: text.second,
              content: (
                <div>
                  <FormField id="gallery-table-state" label={text.states}>
                    <Select
                      value={this.state.tableState}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          value === "ready" ||
                          value === "loading" ||
                          value === "empty" ||
                          value === "error"
                        )
                          this.setState({ tableState: value });
                      }}
                    >
                      <option value="ready">{text.ready}</option>
                      <option value="loading">{text.loading}</option>
                      <option value="empty">{text.empty}</option>
                      <option value="error">{text.error}</option>
                    </Select>
                  </FormField>
                  <Table<Row>
                    caption={text.table}
                    rows={rows}
                    columns={columns}
                    rowKey={(row) => row.id}
                    loading={this.state.tableState === "loading"}
                    loadingLabel={local.messages.loading}
                    emptyLabel={local.messages.empty}
                    retryLabel={local.messages.retry}
                    {...(this.state.tableState === "error"
                      ? { error: local.messages.error }
                      : {})}
                    onRetry={() => this.setState({ tableState: "ready" })}
                    sort={{
                      column: "name",
                      direction: this.state.descending ? "desc" : "asc",
                    }}
                    onSort={() =>
                      this.setState((previous) => ({
                        descending: !previous.descending,
                        page: 1,
                      }))
                    }
                    selected={this.state.selected}
                    selectionLabel={(row) => `${text.selected} ${row.name}`}
                    onSelect={(key, checked) =>
                      this.setState((previous) => {
                        const selected = new Set(previous.selected);
                        if (checked) selected.add(key);
                        else selected.delete(key);
                        return { selected };
                      })
                    }
                  />
                  <Pagination
                    page={this.state.page}
                    pageSize={2}
                    total={5}
                    label={local.messages.page}
                    previousLabel={local.messages.previous}
                    nextLabel={local.messages.next}
                    formatNumber={(value) => format.number(value)}
                    onChange={(page) => this.setState({ page })}
                    disabled={this.state.tableState !== "ready"}
                  />
                </div>
              ),
            },
          ]}
        />
        <div className="summit-showcase-actions">
          <Button onClick={() => this.setState({ dialog: true })}>
            {text.dialog}
          </Button>
          <Button
            variant="secondary"
            onClick={() => this.setState({ drawer: true })}
          >
            {text.drawer}
          </Button>
          <Button
            variant="ghost"
            onClick={() => this.setState({ toast: true })}
          >
            {text.notify}
          </Button>
        </div>
        <Dialog
          id="gallery-dialog"
          title={text.dialog}
          closeLabel={local.messages.close}
          open={this.state.dialog}
          onClose={() => this.setState({ dialog: false })}
          direction={local.direction}
          theme={this.props.theme}
        >
          <p>{text.description}</p>
          <FormField id="gallery-dialog-name" label={text.name}>
            <Input />
          </FormField>
        </Dialog>
        <Drawer
          id="gallery-drawer"
          title={text.drawer}
          closeLabel={local.messages.close}
          open={this.state.drawer}
          onClose={() => this.setState({ drawer: false })}
          direction={local.direction}
          theme={this.props.theme}
        >
          <p>{text.note}</p>
        </Drawer>
        {this.state.toast && (
          <Toast
            closeLabel={local.messages.close}
            onClose={() => this.setState({ toast: false })}
          >
            {text.notification}
          </Toast>
        )}
      </section>
    );
  }
}
