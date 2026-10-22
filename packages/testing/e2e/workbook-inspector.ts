// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";
/** Actual OOXML bytes are parsed by the browser's independent XML parser, never rendered as HTML. */
export class WorkbookInspector {
  async inspect(
    page: Page,
    bytes: Uint8Array,
    locale: "ar" | "en",
    expectedName: string,
  ): Promise<void> {
    const files = unzipSync(bytes);
    expect(Object.keys(files).sort()).toEqual(
      [
        "[Content_Types].xml",
        "_rels/.rels",
        "xl/_rels/workbook.xml.rels",
        "xl/styles.xml",
        "xl/workbook.xml",
        "xl/worksheets/sheet1.xml",
      ].sort(),
    );
    const xml = Object.fromEntries(
      Object.entries(files).map(([name, data]) => [name, strFromU8(data)]),
    );
    const result = await page.evaluate(
      ({ xml }) => {
        const parser = new DOMParser();
        const documents = Object.fromEntries(
          Object.entries(xml).map(([name, text]) => [
            name,
            parser.parseFromString(text, "application/xml"),
          ]),
        );
        const sheet = documents["xl/worksheets/sheet1.xml"];
        if (!sheet) throw new Error("Worksheet missing");
        return {
          errors: Object.values(documents).filter((doc) =>
            doc.querySelector("parsererror"),
          ).length,
          rtl: sheet.querySelector("sheetView")?.getAttribute("rightToLeft"),
          rows: [...sheet.querySelectorAll("sheetData row")].map((row) =>
            [...row.querySelectorAll("c")].map((cell) => ({
              type: cell.getAttribute("t"),
              value: cell.querySelector("t")?.textContent,
            })),
          ),
          formulas: sheet.querySelectorAll("f").length,
          external: Object.values(documents).reduce(
            (n, doc) =>
              n + doc.querySelectorAll('[TargetMode="External"]').length,
            0,
          ),
        };
      },
      { xml },
    );
    expect(result.errors).toBe(0);
    expect(result.rtl).toBe(locale === "ar" ? "1" : "0");
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.[0]?.value).toBe(locale === "ar" ? "الاسم" : "Name");
    expect(result.rows[1]?.[0]?.value).toBe(expectedName);
    expect(
      result.rows.every(
        (row) =>
          row.length === 4 && row.every((cell) => cell.type === "inlineStr"),
      ),
    ).toBe(true);
    expect(result.formulas).toBe(0);
    expect(result.external).toBe(0);
  }
}
