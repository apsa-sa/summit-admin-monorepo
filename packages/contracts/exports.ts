// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { User } from "./index.js";
export type UserExportFormat = "csv" | "xlsx";
export type ExportLocale = "ar" | "en";
export interface BinaryUserExporter {
  readonly format: "xlsx";
  render(rows: readonly User[], locale: ExportLocale): Promise<ArrayBuffer>;
}
export interface DownloadArtifact {
  readonly body: string | ArrayBuffer;
  readonly contentType:
    | "text/csv; charset=utf-8"
    | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  readonly filename: "summit-users.csv" | "summit-users.xlsx";
}

export interface ExportDownload {
  readonly bytes: ArrayBuffer;
  readonly contentType: string;
  readonly filename: "summit-users.csv" | "summit-users.xlsx";
}
