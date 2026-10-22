// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
export type Locale = "ar" | "en";
export interface LocaleOptions {
  readonly numberingSystem?: "arab" | "latn";
  readonly calendar?: "gregory" | "islamic-umalqura";
  readonly timeZone?: string;
}
export interface UiMessages {
  readonly loading: string;
  readonly empty: string;
  readonly error: string;
  readonly retry: string;
  readonly close: string;
  readonly previous: string;
  readonly next: string;
  readonly page: string;
  readonly selected: string;
}
/** One locale drives direction and UI labels; no mutable global locale. */
export class Localization {
  constructor(readonly locale: Locale) {}
  get direction(): "rtl" | "ltr" {
    return this.locale === "ar" ? "rtl" : "ltr";
  }
  get messages(): Readonly<UiMessages> {
    return this.locale === "ar"
      ? Object.freeze({
          loading: "جارٍ التحميل…",
          empty: "لا توجد نتائج",
          error: "تعذّر تحميل البيانات",
          retry: "إعادة المحاولة",
          close: "إغلاق",
          previous: "السابق",
          next: "التالي",
          page: "الصفحة",
          selected: "محدد",
        })
      : Object.freeze({
          loading: "Loading…",
          empty: "No results",
          error: "Unable to load data",
          retry: "Retry",
          close: "Close",
          previous: "Previous",
          next: "Next",
          page: "Page",
          selected: "Selected",
        });
  }
}
/** Instants require an explicit offset; calendar-only dates never shift time zones. */
export class LocaleFormatter {
  constructor(
    private readonly locale: Locale,
    private readonly options: LocaleOptions = {},
  ) {}
  number(value: number): string {
    if (!Number.isFinite(value))
      throw new RangeError("A finite number is required");
    return new Intl.NumberFormat(this.locale, {
      numberingSystem: this.options.numberingSystem,
    }).format(value);
  }
  instant(iso: string): string {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        iso,
      )
    )
      throw new RangeError("An ISO instant with an offset is required");
    this.plainDate(iso.slice(0, 10));
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime()))
      throw new RangeError("Invalid instant");
    return new Intl.DateTimeFormat(this.locale, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: this.options.timeZone ?? "UTC",
      calendar: this.options.calendar,
      numberingSystem: this.options.numberingSystem,
    }).format(date);
  }
  plainDate(iso: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso))
      throw new RangeError("A plain ISO date is required");
    const date = new Date(`${iso}T12:00:00Z`);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== iso
    )
      throw new RangeError("Invalid calendar date");
    return new Intl.DateTimeFormat(this.locale, {
      dateStyle: "medium",
      timeZone: "UTC",
      calendar: this.options.calendar,
      numberingSystem: this.options.numberingSystem,
    }).format(date);
  }
}
export { WorkspaceMessages } from './workspace.js';
export type { WorkspaceMessageKey } from './workspace.js';
