// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import type { User } from "../contracts/index.js";
import { PdfDocument } from "../exports/pdf-document.js";
import { PdfExporter } from "../exports/pdf.js";
import { printFontCss } from "@summit/design-tokens/print-fonts";
class PdfExportSuite {
  private user: User = { id: "00000000-0000-4000-8000-000000000001", name: 'قمة <script>bad()</script> & "Summit"', email: "reader@example.test", role: "viewer", status: "active", version: 1, createdAt: "2026-01-01T00:00:00Z" };
  register(): void {
    test("PDF template escapes untrusted text, localizes all columns and embeds licensed offline fonts", () => {
      assert.ok(printFontCss.includes("data:font/woff2;base64,"));
      assert.equal(printFontCss.includes("./files/"), false);
      const ar = new PdfDocument(printFontCss).render([this.user], "ar");
      assert.ok(ar.includes('lang="ar" dir="rtl"'));
      assert.ok(ar.includes("&lt;script&gt;bad()&lt;/script&gt; &amp; &quot;Summit&quot;"));
      assert.equal(ar.includes("<script>"), false);
      assert.ok(ar.includes("font-src data:"));
      assert.ok(ar.includes("table-header-group"));
      assert.ok(ar.includes('<footer dir="ltr">'));
      assert.ok(ar.includes("white-space:pre-wrap"));
      assert.ok(ar.includes("مشاهد"));
      const en = new PdfDocument(printFontCss).render([this.user], "en");
      assert.ok(en.includes('lang="en" dir="ltr"'));
      assert.ok(en.includes("Viewer"));
      for (const forbidden of ["password_hash", "session", "<iframe", "<img", "<a "])
        assert.equal(ar.includes(forbidden), false);
    });
    test("PDF bounds reject oversized rows/text without silently truncating", () => {
      const document = new PdfDocument("");
      assert.doesNotThrow(() => document.render([], "ar"));
      assert.doesNotThrow(() => document.render(Array.from({ length: 1000 }, () => this.user), "en"));
      assert.throws(() => document.render(Array.from({ length: 1001 }, () => this.user), "en"), RangeError);
      assert.throws(() => document.render([{ ...this.user, name: "x".repeat(32768) }], "ar"), RangeError);
    });
    test("PDF provider passes owned HTML through injected lease/printer and preserves failures", async () => {
      const order: string[] = [];
      const exporter = new PdfExporter(new PdfDocument(""), { print: async html => {
        assert.ok(html.startsWith("<!doctype html>")); order.push("print"); return new ArrayBuffer(5);
      } }, { run: async operation => { order.push("lease"); const value = await operation(); order.push("release"); return value; } });
      assert.equal((await exporter.render([this.user], "ar")).byteLength, 5);
      assert.deepEqual(order, ["lease", "print", "release"]);
      await assert.rejects(exporter.render(Array.from({ length: 1001 }, () => this.user), "ar"), { status: 422, code: "pdf_export_limit" });
      assert.equal(order.length, 3);
      const failure = new Error("owned failure");
      const broken = new PdfExporter(new PdfDocument(""), { print: async () => { throw failure; } }, { run: async operation => operation() });
      await assert.rejects(broken.render([], "en"), failure);
    });
  }
}
new PdfExportSuite().register();
