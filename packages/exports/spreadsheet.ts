// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { zipSync, strToU8 } from "fflate";
import { WorkspaceMessages } from "@summit/localization";
import type { User } from "../contracts/index.js";
import type { BinaryUserExporter, ExportLocale } from "../contracts/exports.js";
import { SpreadsheetText } from "./spreadsheet-text.js";
/** Bounded, macro-free SpreadsheetML. Every value is an inline string, never a formula or external relationship. */
export class SpreadsheetExporter implements BinaryUserExporter {
  readonly format = "xlsx";
  constructor(private readonly text: SpreadsheetText) {}
  async render(
    users: readonly User[],
    locale: ExportLocale,
  ): Promise<ArrayBuffer> {
    if (users.length > 10000 || (locale !== "ar" && locale !== "en"))
      throw new RangeError("Invalid spreadsheet export bounds");
    const messages = new WorkspaceMessages(locale);
    const rows = [
      [
        messages.t("name"),
        messages.t("email"),
        messages.t("role"),
        messages.t("status"),
      ],
      ...users.map((user) => [
        user.name,
        user.email,
        messages.t(user.role),
        messages.t(user.status),
      ]),
    ];
    let total = 0;
    const cells = rows
      .map(
        (row, index) =>
          `<row r="${index + 1}">${row
            .map((value, column) => {
              if (value.length > 32767 || (total += value.length) > 4_000_000)
                throw new RangeError("Spreadsheet text limit exceeded");
              return `<c r="${String.fromCharCode(65 + column)}${index + 1}" s="${index === 0 ? 1 : 0}" t="inlineStr"><is><t xml:space="preserve">${this.text.encode(value)}</t></is></c>`;
            })
            .join("")}</row>`,
      )
      .join("");
    const files: Record<string, Uint8Array> = {};
    const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
    files["[Content_Types].xml"] = strToU8(
      xml +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    );
    files["_rels/.rels"] = strToU8(
      xml +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    );
    files["xl/workbook.xml"] = strToU8(
      xml +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="SUMMIT" sheetId="1" r:id="rId1"/></sheets></workbook>',
    );
    files["xl/_rels/workbook.xml.rels"] = strToU8(
      xml +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    );
    files["xl/styles.xml"] = strToU8(
      xml +
        `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" readingOrder="${locale === "ar" ? 2 : 1}" wrapText="1"/></xf><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" readingOrder="${locale === "ar" ? 2 : 1}" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    );
    files["xl/worksheets/sheet1.xml"] = strToU8(
      xml +
        `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:D${rows.length}"/><sheetViews><sheetView workbookViewId="0" rightToLeft="${locale === "ar" ? 1 : 0}"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><cols><col min="1" max="1" width="32" customWidth="1"/><col min="2" max="2" width="42" customWidth="1"/><col min="3" max="4" width="20" customWidth="1"/></cols><sheetData>${cells}</sheetData><autoFilter ref="A1:D${rows.length}"/></worksheet>`,
    );
    return Uint8Array.from(zipSync(files, { level: 6 })).buffer;
  }
}
