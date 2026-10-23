// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { AdminHttpController } from "../../apps/web-admin/server/http-controller.js";
import { SessionCookie } from "../../apps/web-admin/server/session-cookie.js";
import { JsonBody } from "../../apps/web-admin/server/json-body.js";
import { AuthenticationService } from "../application/authentication.js";
import { UserApplicationService } from "../application/users.js";
import { DraftApplicationService } from "../application/drafts.js";
import { AuditApplicationService } from "../application/audit.js";
import { TablePreferenceService } from "../application/table-preferences.js";
import { TablePreferenceValidation } from "../core/table-preferences.js";
import { DomainError } from "../core/index.js";
import { SessionService } from "../auth/index.js";
import { AuthorizationPolicy } from "../core-rbac/index.js";
import {
  PasswordHasher,
  SessionToken,
  RateLimiter,
} from "../security/index.js";
import { SafeLogger } from "../observability/index.js";
import { SpreadsheetExporter } from "../exports/spreadsheet.js";
import { SpreadsheetText } from "../exports/spreadsheet-text.js";
import { unzipSync, strFromU8 } from "fflate";
import type { BinaryUserExporter } from "../contracts/exports.js";
import { CsvExporter } from "../exports/index.js";
import type { User, Actor, UserPage } from "../contracts/index.js";
import type {
  IdentityStore,
  UserStore,
  DraftStore,
  AuditStore,
  HealthStore,
} from "../contracts/ports.js";
import type { TablePreferenceStore } from "../contracts/table-preferences.js";
/** Protocol-only storage double. Database authentication/integrity remain separate real-PG gates. */
class ExportStores
  implements
    IdentityStore,
    UserStore,
    DraftStore,
    AuditStore,
    HealthStore,
    TablePreferenceStore
{
  readonly user: User = {
    id: randomUUID(),
    name: "=2+2",
    email: "export@example.test",
    role: "admin",
    status: "active",
    version: 0,
    createdAt: new Date(0).toISOString(),
  };
  actor: Actor | null = this.user;
  failure: Error | null = null;
  listCalls = 0;
  async actorForSession() {
    return this.actor;
  }
  async credentials() {
    return null;
  }
  async session(): Promise<void> {
    throw new Error("Unexpected session write");
  }
  async logout(): Promise<void> {
    throw new Error("Unexpected logout");
  }
  async self() {
    return this.user;
  }
  async list(): Promise<UserPage> {
    this.listCalls++;
    if (this.failure) throw this.failure;
    return { rows: [this.user], total: 1, page: 1, pageSize: 10000 };
  }
  async mutateForSession(): Promise<never> {
    throw new Error("Unexpected user write");
  }
  async loadDraftForSession(): Promise<never> {
    throw new Error("Unexpected draft read");
  }
  async saveDraftForSession(): Promise<never> {
    throw new Error("Unexpected draft write");
  }
  async events(): Promise<never> {
    throw new Error("Unexpected audit read");
  }
  async health(): Promise<never> {
    throw new Error("Unexpected health read");
  }
  async load(): Promise<never> {
    throw new Error("Unexpected preference read");
  }
  async save(): Promise<never> {
    throw new Error("Unexpected preference write");
  }
}
class ExportLogger extends SafeLogger {
  readonly errors: { requestId: string; code: string }[] = [];
  override error(requestId: string, code: string): void {
    this.errors.push({ requestId, code });
  }
}
class ExportContractFixture {
  readonly store = new ExportStores();
  readonly logger = new ExportLogger();
  readonly controller: AdminHttpController;
  constructor(
    exporters: readonly BinaryUserExporter[] = [
      new SpreadsheetExporter(new SpreadsheetText()),
    ],
  ) {
    const sessions = new SessionService(this.store),
      policy = new AuthorizationPolicy(),
      tokens = new SessionToken();
    this.controller = new AdminHttpController(
      new AuthenticationService(
        this.store,
        sessions,
        new PasswordHasher(),
        tokens,
        new RateLimiter(),
      ),
      new UserApplicationService(
        this.store,
        sessions,
        policy,
        new CsvExporter(),
        exporters,
      ),
      new DraftApplicationService(this.store, policy),
      new AuditApplicationService(this.store, sessions, policy),
      this.store,
      new SessionCookie(tokens, false),
      new JsonBody(),
      this.logger,
      "http://localhost",
      new TablePreferenceService(
        this.store,
        policy,
        new TablePreferenceValidation(),
      ),
    );
  }
  response(query = "") {
    return this.controller.handle(
      new Request(`http://localhost/api/users/export${query}`),
      "contract-peer",
    );
  }
  async error(response: Response, status: number, code: string): Promise<void> {
    assert.equal(response.status, status);
    assert.match(
      response.headers.get("content-type") ?? "",
      /^application\/json\b/,
    );
    assert.equal(response.headers.get("content-disposition"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const requestId = response.headers.get("x-request-id");
    assert.match(requestId ?? "", /^[0-9a-f-]{36}$/);
    assert.deepEqual(await response.json(), { error: code, requestId });
  }
}
class ExportResponseSuite {
  register(): void {
    test("PDF protocol preserves binary metadata and refuses renderer failures/viewer access as JSON", async () => {
      let rendered = 0;
      const fixture = new ExportContractFixture([{ format: "pdf", render: async () => {
        rendered++; return new TextEncoder().encode("%PDF-synthetic protocol fixture").buffer;
      } }]);
      const response = await fixture.response("?format=pdf&locale=ar");
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "application/pdf");
      assert.equal(response.headers.get("content-disposition"), 'attachment; filename="summit-users.pdf"');
      assert.equal((await response.text()).startsWith("%PDF-"), true);
      fixture.store.actor = { id: fixture.store.user.id, role: "viewer" };
      const denied = await fixture.response("?format=pdf");
      assert.equal(denied.status, 403);
      assert.equal(denied.headers.has("content-disposition"), false);
      assert.equal(rendered, 1);
      const broken = new ExportContractFixture([{ format: "pdf", render: async () => { throw new DomainError(503, "pdf_render_failed"); } }]);
      const failure = await broken.response("?format=pdf");
      assert.equal(failure.status, 503);
      assert.equal(failure.headers.has("content-disposition"), false);
      assert.equal((await failure.json()).error, "pdf_render_failed");
    });

    test("CSV success alone carries attachment/MIME, locale headers and formula-safe content", async () => {
      const fixture = new ExportContractFixture();
      for (const locale of ["ar", "en"]) {
        const response = await fixture.response(`?locale=${locale}`);
        assert.equal(response.status, 200);
        assert.equal(
          response.headers.get("content-type"),
          "text/csv; charset=utf-8",
        );
        assert.equal(
          response.headers.get("content-disposition"),
          'attachment; filename="summit-users.csv"',
        );
        assert.equal(response.headers.get("cache-control"), "no-store");
        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        const bytes = new Uint8Array(await response.arrayBuffer());
        assert.deepEqual([...bytes.slice(0, 3)], [239, 187, 191]);
        const content = new TextDecoder().decode(bytes);
        assert.ok(content.includes(locale === "ar" ? '"الاسم"' : '"Name"'));
        assert.ok(content.includes('"\'=2+2"'));
        assert.ok(!content.includes("password_hash"));
      }
    });
    test("CSV validation failure is JSON without attachment headers and never queries storage", async () => {
      const fixture = new ExportContractFixture();
      await fixture.error(
        await fixture.response("?sort=unsupported"),
        422,
        "invalid_sort",
      );
      assert.equal(fixture.store.listCalls, 0);
    });
    test("CSV row-limit failure is JSON without attachment headers", async () => {
      const fixture = new ExportContractFixture();
      fixture.store.failure = new DomainError(422, "export_limit");
      await fixture.error(await fixture.response(), 422, "export_limit");
      assert.equal(fixture.store.listCalls, 1);
    });
    test("CSV authorization failure stays JSON and does not query storage", async () => {
      const fixture = new ExportContractFixture();
      fixture.store.actor = { id: fixture.store.user.id, role: "viewer" };
      await fixture.error(await fixture.response(), 403, "forbidden");
      assert.equal(fixture.store.listCalls, 0);
    });
    test("Unexpected CSV storage failure is sanitized JSON and logs only its request id/code", async () => {
      const fixture = new ExportContractFixture();
      fixture.store.failure = new Error("private storage diagnostic");
      const response = await fixture.response();
      await fixture.error(response, 500, "internal_error");
      assert.deepEqual(fixture.logger.errors, [
        {
          requestId: response.headers.get("x-request-id"),
          code: "internal_error",
        },
      ]);
    });
    test("XLSX success is a real bounded string-only workbook with Arabic headers and no credential columns", async () => {
      const fixture = new ExportContractFixture();
      for (const locale of ["ar", "en"]) {
        const response = await fixture.response(
          `?format=xlsx&locale=${locale}&sort=name&search=scope`,
        );
        assert.equal(response.status, 200);
        assert.equal(
          response.headers.get("content-type"),
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
        assert.equal(
          response.headers.get("content-disposition"),
          'attachment; filename="summit-users.xlsx"',
        );
        const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
        assert.deepEqual(
          Object.keys(archive).sort(),
          [
            "[Content_Types].xml",
            "_rels/.rels",
            "xl/_rels/workbook.xml.rels",
            "xl/styles.xml",
            "xl/workbook.xml",
            "xl/worksheets/sheet1.xml",
          ].sort(),
        );
        const sheet = strFromU8(archive["xl/worksheets/sheet1.xml"]!);
        assert.ok(sheet.includes(locale === "ar" ? "الاسم" : "Name"));
        assert.ok(sheet.includes(`rightToLeft="${locale === "ar" ? 1 : 0}"`));
        assert.ok(sheet.includes('t="inlineStr"'));
        assert.ok(sheet.includes("=2+2"));
        assert.doesNotMatch(sheet, /<f[ >]|password_hash|<hyperlink/);
      }
    });
    test("Unsupported binary export format/locale fails as JSON before querying storage", async () => {
      for (const [query, code] of [
        ["?format=exe", "invalid_export_format"],
        ["?format=xlsx&locale=unknown", "invalid_export_locale"],
      ]) {
        const fixture = new ExportContractFixture();
        await fixture.error(await fixture.response(query), 422, code!);
        assert.equal(fixture.store.listCalls, 0);
      }
    });
    test("XLSX enforces server export permission, session validity, row cap and provider availability", async () => {
      const viewer = new ExportContractFixture();
      viewer.store.actor = { id: viewer.store.user.id, role: "viewer" };
      await viewer.error(
        await viewer.response("?format=xlsx"),
        403,
        "forbidden",
      );
      assert.equal(viewer.store.listCalls, 0);
      const expired = new ExportContractFixture();
      expired.store.actor = null;
      await expired.error(
        await expired.response("?format=xlsx"),
        401,
        "unauthenticated",
      );
      assert.equal(expired.store.listCalls, 0);
      const limited = new ExportContractFixture();
      limited.store.failure = new DomainError(422, "export_limit");
      await limited.error(
        await limited.response("?format=xlsx"),
        422,
        "export_limit",
      );
      const absent = new ExportContractFixture([]);
      await absent.error(
        await absent.response("?format=xlsx"),
        503,
        "export_unavailable",
      );
      assert.equal(absent.store.listCalls, 0);
    });
    test("Unauthenticated CSV request is rejected before storage or attachment setup", async () => {
      const fixture = new ExportContractFixture();
      fixture.store.actor = null;
      await fixture.error(await fixture.response(), 401, "unauthenticated");
      assert.equal(fixture.store.listCalls, 0);
    });
  }
}
new ExportResponseSuite().register();
