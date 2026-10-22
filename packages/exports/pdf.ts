// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { BinaryUserExporter, ExportLocale } from "../contracts/exports.js";
import type { User } from "../contracts/index.js";
import type { PdfPrintPort, ExportLeasePort } from "../contracts/pdf.js";
import { DomainError } from "../core/index.js";
import { PdfDocument } from "./pdf-document.js";
export class PdfExporter implements BinaryUserExporter {
  readonly format = "pdf";
  constructor(private readonly document: PdfDocument, private readonly printer: PdfPrintPort,
    private readonly lease: ExportLeasePort) {}
  async render(users: readonly User[], locale: ExportLocale): Promise<ArrayBuffer> {
    if (users.length > 1000) throw new DomainError(422, "pdf_export_limit");
    const html = this.document.render(users, locale);
    return this.lease.run(() => this.printer.print(html));
  }
}
