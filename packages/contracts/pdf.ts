// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
/** The renderer accepts only an owned template, never a URL or arbitrary remote HTML. */
export interface PdfPrintPort { print(html: string): Promise<ArrayBuffer>; }
/** Serializes expensive rendering across all request scopes of one installation. */
export interface ExportLeasePort { run<T>(operation: () => Promise<T>): Promise<T>; }
