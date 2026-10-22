// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { PermissionPolicy, UserStore } from "../contracts/ports.js";
import { Validation } from "../core/index.js";
import { SessionService } from "../auth/index.js";
import { CsvExporter } from "../exports/index.js";
import type {
  BinaryUserExporter,
  DownloadArtifact,
} from "../contracts/exports.js";
import { DomainError } from "../core/index.js";
export class UserApplicationService {
  constructor(
    private readonly store: UserStore,
    private readonly sessions: SessionService,
    private readonly policy: PermissionPolicy,
    private readonly csv: CsvExporter,
    exporters: readonly BinaryUserExporter[] = [],
  ) {
    if (
      new Set(exporters.map((exporter) => exporter.format)).size !==
      exporters.length
    )
      throw new TypeError("Duplicate export provider");
    this.exporters = Object.freeze([...exporters]);
  }
  private readonly exporters: readonly BinaryUserExporter[];
  async list(digest: string, params: URLSearchParams) {
    this.policy.require(await this.sessions.authenticate(digest), "users:read");
    return this.store.list(Validation.query(params));
  }
  async mutate(
    digest: string,
    id: string | null,
    value: unknown,
    action: "create" | "update" | "delete",
    requestId: string,
  ) {
    this.policy.require(
      await this.sessions.authenticate(digest),
      `users:${action}`,
    );
    return this.store.mutateForSession(
      digest,
      id,
      action === "delete" ? null : Validation.user(value),
      requestId,
      this.policy,
    );
  }
  async export(digest: string, params: URLSearchParams): Promise<string> {
    await this.authorizeExport(digest);
    return this.csv.render(
      await this.exportRows(params),
      params.get("locale") ?? "ar",
    );
  }
  private async authorizeExport(digest: string): Promise<void> {
    this.policy.require(
      await this.sessions.authenticate(digest),
      "users:export",
    );
  }
  private async exportRows(params: URLSearchParams) {
    return (await this.store.list(Validation.query(params), true)).rows;
  }
  async download(
    digest: string,
    params: URLSearchParams,
  ): Promise<DownloadArtifact> {
    await this.authorizeExport(digest);
    const format = params.get("format") ?? "csv";
    if (format === "csv")
      return {
        body: this.csv.render(
          await this.exportRows(params),
          params.get("locale") ?? "ar",
        ),
        contentType: "text/csv; charset=utf-8",
        filename: "summit-users.csv",
      };
    if (format !== "xlsx" && format !== "pdf") throw new DomainError(422, "invalid_export_format");
    const locale = params.get("locale") ?? "ar";
    if (locale !== "ar" && locale !== "en")
      throw new DomainError(422, "invalid_export_locale");
    const renderer = this.exporters.find(
      (exporter) => exporter.format === format,
    );
    if (!renderer) throw new DomainError(503, "export_unavailable");
    const bytes = await renderer.render(await this.exportRows(params), locale);
    return {
      body: bytes,
      contentType:
        format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      filename: format === "pdf" ? "summit-users.pdf" : "summit-users.xlsx",
    };
  }
}
