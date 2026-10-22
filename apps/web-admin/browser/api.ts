// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
import type {
  UserExportFormat,
  ExportDownload,
} from "../../../packages/contracts/exports.js";
// SPDX-License-Identifier: MIT
import type {
  AuditEvent,
  Draft,
  User,
  UserInput,
  UserPage,
} from "../../../packages/contracts/index.js";
import { ResponseContracts } from "../../../packages/contracts/decoders.js";
import type { UserTablePreferences } from "../../../packages/contracts/table-preferences.js";
export class ApiFailure extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}
export class AdminApiClient {
  private readonly contracts = new ResponseContracts();
  private scope = new AbortController();
  endSession(): void {
    this.scope.abort();
    this.scope = new AbortController();
  }
  constructor(
    private readonly base = "",
    private readonly transport: typeof fetch = fetch,
    private readonly timeoutMs = 15000,
  ) {
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000)
      throw new RangeError("Invalid request deadline");
  }
  private request<T>(
    path: string,
    decode: (value: unknown) => T,
    init: RequestInit = {},
  ): Promise<T> {
    return this.consume(
      path,
      async (response) => decode(await response.json()),
      init,
    );
  }
  private async consume<T>(
    path: string,
    decode: (response: Response) => Promise<T>,
    init: RequestInit = {},
  ): Promise<T> {
    const session = this.scope.signal,
      request = new AbortController();
    const cancel = () => request.abort();
    session.addEventListener("abort", cancel, { once: true });
    if (session.aborted) cancel();
    const timeout = setTimeout(cancel, this.timeoutMs);
    try {
      let response: Response;
      // Native browser fetch requires its global receiver; storing it as a class
      // field must not turn the API client into the receiver (Illegal invocation).
      try {
        response = await this.transport.call(
          globalThis,
          `${this.base}${path}`,
          {
            ...init,
            signal: request.signal,
            credentials: "same-origin",
            headers: {
              ...(init.body ? { "Content-Type": "application/json" } : {}),
              ...init.headers,
            },
          },
        );
      } catch {
        throw new ApiFailure(0, "network_error");
      }
      if (!response.ok) {
        const payload: unknown = await response.json().catch(() => null);
        const code =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "request_failed";
        throw new ApiFailure(response.status, code);
      }
      try {
        return await decode(response);
      } catch {
        throw new ApiFailure(
          request.signal.aborted ? 0 : response.status,
          request.signal.aborted ? "network_error" : "invalid_response",
        );
      }
    } finally {
      clearTimeout(timeout);
      session.removeEventListener("abort", cancel);
    }
  }
  async login(email: string, password: string): Promise<User> {
    return this.request(
      "/api/login",
      (value) => this.contracts.userEnvelope(value),
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
  }
  me(): Promise<User> {
    return this.request("/api/me", (value) =>
      this.contracts.userEnvelope(value),
    );
  }
  logout(): Promise<void> {
    return this.request("/api/logout", (value) => this.contracts.ok(value), {
      method: "POST",
    });
  }
  users(
    page: number,
    search: string,
    role = "",
    status = "",
    sort: "name" | "created_at" = "created_at",
  ): Promise<UserPage> {
    return this.request(
      `/api/users?${new URLSearchParams({ page: String(page), search, role, status, sort })}`,
      (value) => this.contracts.page(value),
    );
  }
  createUser(input: UserInput): Promise<User> {
    return this.request(
      "/api/users",
      (value) => this.contracts.userEnvelope(value),
      { method: "POST", body: JSON.stringify(input) },
    );
  }
  updateUser(id: string, input: UserInput): Promise<User> {
    return this.request(
      `/api/users/${encodeURIComponent(id)}`,
      (value) => this.contracts.userEnvelope(value),
      { method: "PUT", body: JSON.stringify(input) },
    );
  }
  deleteUser(id: string): Promise<void> {
    return this.request(
      `/api/users/${encodeURIComponent(id)}`,
      (value) => this.contracts.deleted(value),
      { method: "DELETE" },
    );
  }
  draft(): Promise<Draft> {
    return this.request("/api/draft", (value) => this.contracts.draft(value));
  }
  saveDraft(draft: Draft): Promise<Draft> {
    return this.request("/api/draft", (value) => this.contracts.draft(value), {
      method: "PUT",
      body: JSON.stringify(draft),
    });
  }
  tablePreferences(): Promise<UserTablePreferences> {
    return this.request("/api/preferences/users", (value) =>
      this.contracts.tablePreferences(value),
    );
  }
  saveTablePreferences(
    value: UserTablePreferences,
  ): Promise<UserTablePreferences> {
    return this.request(
      "/api/preferences/users",
      (payload) => this.contracts.tablePreferences(payload),
      { method: "PUT", body: JSON.stringify(value) },
    );
  }
  audit(): Promise<AuditEvent[]> {
    return this.request("/api/audit", (value) => this.contracts.audit(value));
  }
  downloadExport(
    locale: "ar" | "en",
    search: string,
    role: string,
    status: string,
    format: UserExportFormat,
    sort: "name" | "created_at",
  ): Promise<ExportDownload> {
    const params = new URLSearchParams({
      locale,
      search,
      role,
      status,
      format,
      sort,
    });
    return this.consume(`/api/users/export?${params}`, async (response) => {
      const contentType =
        format === "csv"
          ? "text/csv; charset=utf-8"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const filename =
        format === "csv" ? "summit-users.csv" : "summit-users.xlsx";
      if (
        response.headers.get("content-type") !== contentType ||
        response.headers.get("content-disposition") !==
          `attachment; filename="${filename}"`
      )
        throw new TypeError("Invalid download response");
      const reader = response.body?.getReader();
      if (!reader) throw new TypeError("Missing download body");
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        for (;;) {
          const chunk = await reader.read();
          if (chunk.done) break;
          length += chunk.value.byteLength;
          if (length > 32_000_000) {
            await reader.cancel();
            throw new RangeError("Download too large");
          }
          chunks.push(chunk.value);
        }
      } finally {
        reader.releaseLock();
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const signature = format === "csv" ? [239, 187, 191] : [80, 75, 3, 4];
      if (!signature.every((value, index) => bytes[index] === value))
        throw new TypeError("Invalid download signature");
      return { bytes: bytes.buffer, filename, contentType };
    });
  }
  exportUrl(
    locale: "ar" | "en",
    search: string,
    role: string,
    status: string,
    format: UserExportFormat = "csv",
    sort: "name" | "created_at" = "created_at",
  ): string {
    const params = new URLSearchParams({ locale, search, role, status });
    if (format !== "csv") params.set("format", format);
    if (sort !== "created_at") params.set("sort", sort);
    return `${this.base}/api/users/export?${params}`;
  }
}
