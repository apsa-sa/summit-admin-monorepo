// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { chromium } from "playwright";
import type { PdfPrintPort } from "../contracts/pdf.js";
import { DomainError } from "../core/index.js";
/** Per-operation process/context ownership. Does not reuse authenticated pages or access URLs. */
export class ChromiumPdfPrinter implements PdfPrintPort {
  async print(html: string): Promise<ArrayBuffer> {
    const browser = await chromium.launch({ headless: true, timeout: 5000, env: { PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: process.env.HOME ?? "/tmp", LANG: "C.UTF-8" } })
      .catch(() => { throw new DomainError(503, "pdf_renderer_unavailable"); });
    const deadline = setTimeout(() => { void browser.close().catch(() => undefined); }, 10000);
    try {
      const context = await browser.newContext({ javaScriptEnabled: false, offline: true, serviceWorkers: "block" });
      await context.route("**/*", route => route.abort());
      const page = await context.newPage();
      await page.setContent(html, { waitUntil: "load", timeout: 5000 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        if (!document.fonts.check('10px "Noto Sans Arabic"', "قمة Summit"))
          throw new Error("Required print font unavailable");
      });
      const bytes = await page.pdf({ format: "A4", landscape: true, printBackground: true, tagged: true });
      if (bytes.byteLength > 16_000_000 || bytes.subarray(0, 5).toString() !== "%PDF-")
        throw new Error("Invalid PDF output");
      return Uint8Array.from(bytes).buffer;
    } catch {
      throw new DomainError(503, "pdf_render_failed");
    } finally {
      clearTimeout(deadline);
      await browser.close().catch(() => undefined);
    }
  }
}
