// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { WorkspaceMessages } from "@summit/localization";
import { TokenCatalog } from "@summit/design-tokens";
import type { User } from "../contracts/index.js";
import type { ExportLocale } from "../contracts/exports.js";
/** Escaped, static, paginated print document. No scripts, remote assets or executable user values. */
export class PdfDocument {
  constructor(private readonly fontCss: string) {}
  private text(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  render(users: readonly User[], locale: ExportLocale): string {
    if (users.length > 1000 || (locale !== "ar" && locale !== "en"))
      throw new RangeError("Invalid PDF bounds");
    const messages = new WorkspaceMessages(locale);
    const columns = [messages.t("name"), messages.t("email"), messages.t("role"), messages.t("status")];
    const rows = users.map(user => [user.name, user.email, messages.t(user.role), messages.t(user.status)]);
    let size = 0;
    const body = rows.map(row => `<tr>${row.map(value => {
      if (value.length > 32767 || (size += value.length) > 1_000_000)
        throw new RangeError("PDF text limit exceeded");
      return `<td><bdi dir="auto">${this.text(value)}</bdi></td>`;
    }).join("")}</tr>`).join("");
    const palette = TokenCatalog.light;
    return `<!doctype html><html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src 'none'; base-uri 'none'; form-action 'none'"><title>SUMMIT</title><style>${this.fontCss}
@page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{font-family:'Noto Sans Arabic',sans-serif;font-size:10pt;line-height:1.6;color:${palette.foreground};background:white}h1{font-size:18pt;color:${palette.primary}}table{width:100%;border-collapse:collapse;table-layout:fixed}thead{display:table-header-group}tr{break-inside:avoid}th,td{border:1px solid ${palette.border};padding:6pt;text-align:start;overflow-wrap:anywhere;vertical-align:top}th{font-weight:600;background:${palette.muted}}td:nth-child(2),th:nth-child(2){width:34%}p{margin:5pt 0 12pt}footer{font-size:8pt;margin-top:12pt}</style></head><body><h1>SUMMIT / قمة</h1><p>${this.text(locale === "ar" ? "تصدير المستخدمين المصرّح به" : "Authorized user export")} · ${users.length}</p><table><thead><tr>${columns.map(value => `<th scope="col">${this.text(value)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table><footer>© 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.</footer></body></html>`;
  }
}
