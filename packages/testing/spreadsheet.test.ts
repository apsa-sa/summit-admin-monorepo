// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import { SpreadsheetText } from "../exports/spreadsheet-text.js";
import { SpreadsheetExporter } from "../exports/spreadsheet.js";
import { AdminApiClient } from "../../apps/web-admin/browser/api.js";
import type { User } from "../contracts/index.js";
class SpreadsheetSuite {
  private readonly user: User = {
    id: "00000000-0000-4000-8000-000000000001",
    name: "قمة & <Summit> 😀",
    email: "data@example.test",
    role: "viewer",
    status: "active",
    version: 0,
    createdAt: new Date(0).toISOString(),
  };
  register(): void {
    test("Spreadsheet text escapes XML, preserves controls/literal escape sequences and rejects broken Unicode", () => {
      const text = new SpreadsheetText();
      assert.equal(text.encode("&< >\"'"), "&amp;&lt; &gt;&quot;&apos;");
      assert.equal(text.encode("A\u0001B\rC\tD\nE"), "A_x0001_B_x000D_C\tD\nE");
      assert.equal(
        text.encode("_x0001_ literal _xABCD_"),
        "_x005F_x0001_ literal _x005F_xABCD_",
      );
      assert.equal(text.encode("عربي 😀"), "عربي 😀");
      for (const input of ["\uD800", "\uDC00", "\uD800x"])
        assert.throws(() => text.encode(input), TypeError);
    });
    test("Workbook empty/maximum page and string values remain structured, readable and formula-free", async () => {
      const exporter = new SpreadsheetExporter(new SpreadsheetText());
      for (const locale of ["ar", "en"] as const) {
        const empty = unzipSync(
          new Uint8Array(await exporter.render([], locale)),
        );
        assert.match(
          strFromU8(empty["xl/worksheets/sheet1.xml"]!),
          /dimension ref="A1:D1"/,
        );
        const data = unzipSync(
          new Uint8Array(
            await exporter.render(
              [
                {
                  ...this.user,
                  name: '=HYPERLINK("https://example.test","X")',
                },
              ],
              locale,
            ),
          ),
        );
        const xml = strFromU8(data["xl/worksheets/sheet1.xml"]!);
        assert.match(xml, /t="inlineStr"/);
        assert.doesNotMatch(xml, /<f(?:\s|>)/);
        assert.match(xml, /freeze|state="frozen"/);
        assert.match(xml, /autoFilter ref="A1:D2"/);
        for (const file of Object.values(data))
          assert.doesNotMatch(
            strFromU8(file),
            /TargetMode="External"|vbaProject|<hyperlink/,
          );
      }
      await assert.rejects(
        exporter.render(
          Array.from({ length: 10001 }, () => this.user),
          "ar",
        ),
        RangeError,
      );
      await assert.rejects(
        exporter.render([{ ...this.user, name: "x".repeat(32768) }], "ar"),
        RangeError,
      );
      const full = unzipSync(
        new Uint8Array(
          await exporter.render(
            Array.from({ length: 10000 }, () => this.user),
            "ar",
          ),
        ),
      );
      assert.match(
        strFromU8(full["xl/worksheets/sheet1.xml"]!),
        /dimension ref="A1:D10001"/,
      );
    });
    test("Export links retain legacy CSV default while encoding XLSX, current scope and sort", () => {
      const client = new AdminApiClient("https://example.test");
      assert.equal(
        client.exportUrl("en", "", "", ""),
        "https://example.test/api/users/export?locale=en&search=&role=&status=",
      );
      const url = new URL(
        client.exportUrl("ar", "عربي & =", "viewer", "active", "xlsx", "name"),
      );
      assert.equal(url.searchParams.get("search"), "عربي & =");
      assert.equal(url.searchParams.get("role"), "viewer");
      assert.equal(url.searchParams.get("status"), "active");
      assert.equal(url.searchParams.get("sort"), "name");
      assert.equal(url.searchParams.get("format"), "xlsx");
    });
  }
}
new SpreadsheetSuite().register();
