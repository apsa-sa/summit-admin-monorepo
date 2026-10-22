// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test, expect } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
import type { User } from "../../contracts/index.js";
import { PdfDocument } from "../../exports/pdf-document.js";
import { PdfExporter } from "../../exports/pdf.js";
import { ChromiumPdfPrinter } from "../../exports/chromium-pdf.js";
import { PostgresExportLease } from "../../data-access/export-lease.js";
import { DatabaseFixture } from "../support/database-fixture.js";
import { printFontCss } from "@summit/design-tokens/print-fonts";
/** Actual Chromium output for independent multipage Arabic/text/font QA, not a signature-only acceptance claim. */
class PdfLayoutSuite {
  register(): void {
    for (const locale of ["ar", "en"] as const) {
      test(`PDF ${locale}: actual multipage mixed-text print through real installation lease`, async () => {
        const fixture = new DatabaseFixture();
        try {
          const repository = await fixture.create();
          const users: User[] = Array.from({ length: 101 }, (_, index) => ({
            id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
            name: `قمة الكواكب العربية — مستخدم ${index + 1} / Summit <literal> & أمثلة متعددة اللغات`,
            email: `synthetic-${index + 1}@example.test`, role: "viewer", status: "active", version: 1,
            createdAt: "2026-01-01T00:00:00Z",
          }));
          const exporter = new PdfExporter(new PdfDocument(printFontCss), new ChromiumPdfPrinter(), new PostgresExportLease(repository.pool));
          const bytes = new Uint8Array(await exporter.render(users, locale));
          expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe("%PDF-");
          expect(bytes.length).toBeGreaterThan(10000);
          expect(bytes.length).toBeLessThan(16_000_000);
          await mkdir("test-results", { recursive: true });
          await writeFile(`test-results/pdf-layout-${locale}.pdf`, bytes);
        } finally { await fixture.close(); }
      });
    }
  }
}
new PdfLayoutSuite().register();
