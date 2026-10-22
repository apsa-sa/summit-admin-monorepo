// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { TablePreferenceValidation } from "../core/table-preferences.js";
import { TablePreferenceService } from "../application/table-preferences.js";
import { AuthorizationPolicy } from "../core-rbac/index.js";
import {
  ApiFailure,
  AdminApiClient,
} from "../../apps/web-admin/browser/api.js";
import type {
  TablePreferenceStore,
  UserTablePreferences,
} from "../contracts/table-preferences.js";
class TablePreferenceContractSuite {
  register(): void {
    test("Saved view schema preserves Arabic/mixed search and returns only explicit fields", () => {
      const schema = new TablePreferenceValidation(),
        initial = schema.defaults();
      const parsed = schema.parse({
        ...initial,
        query: {
          search: "قمة %' OR 1=1 --",
          role: "viewer",
          status: "active",
          page: 4,
          sort: "name",
        },
        columns: ["name", "status"],
      });
      assert.deepEqual(parsed.columns, ["name", "status"]);
      assert.equal(parsed.query.page, 4);
      assert.equal(parsed.query.search, "قمة %' OR 1=1 --");
      assert.notEqual(schema.defaults().columns, schema.defaults().columns);
    });
    test("Saved view rejects unknown ownership, columns, duplicates, malformed filters and non-finite versions", () => {
      const schema = new TablePreferenceValidation(),
        v = schema.defaults();
      for (const bad of [
        null,
        [],
        { ...v, userId: "other" },
        { ...v, columns: [] },
        { ...v, columns: ["email"] },
        { ...v, columns: ["name", "name"] },
        { ...v, columns: ["name", "password_hash"] },
        { ...v, columns: ["name", null] },
        { ...v, query: { ...v.query, search: "x".repeat(121) } },
        { ...v, query: { ...v.query, role: "superadmin" } },
        { ...v, query: { ...v.query, status: "unknown" } },
        { ...v, query: { ...v.query, sort: "email" } },
        { ...v, query: { ...v.query, page: 0 } },
        { ...v, query: { ...v.query, page: "1" } },
        { ...v, query: { ...v.query, owner: "other" } },
        { ...v, version: NaN },
        { ...v, version: Infinity },
        { ...v, version: -1 },
      ])
        assert.throws(() => schema.parse(bad), { status: 422 });
    });
    test("Preference application refuses invalid input and exhausted version before invoking storage", async () => {
      let calls = 0;
      const schema = new TablePreferenceValidation();
      const store: TablePreferenceStore = {
        load: async () => schema.defaults(),
        save: async (_digest, value) => {
          calls++;
          return value;
        },
      };
      const service = new TablePreferenceService(
        store,
        new AuthorizationPolicy(),
        schema,
      );
      assert.throws(
        () =>
          service.save("session", {
            ...schema.defaults(),
            columns: ["name", "secret"],
          }),
        { status: 422 },
      );
      assert.throws(
        () =>
          service.save("session", {
            ...schema.defaults(),
            version: 2147483647,
          }),
        { status: 409 },
      );
      assert.equal(calls, 0);
      await service.save("session", schema.defaults());
      assert.equal(calls, 1);
    });
    test("Preference API runtime decoding rejects drift and retains typed conflict errors", async () => {
      const schema = new TablePreferenceValidation();
      const malformed = new AdminApiClient("", async () =>
        Response.json({
          ...schema.defaults(),
          columns: ["name", "password_hash"],
        }),
      );
      await assert.rejects(malformed.tablePreferences(), {
        code: "invalid_response",
      });
      const conflict = new AdminApiClient("", async () =>
        Response.json({ error: "version_conflict" }, { status: 409 }),
      );
      await assert.rejects(
        conflict.saveTablePreferences(schema.defaults()),
        (error) =>
          error instanceof ApiFailure &&
          error.status === 409 &&
          error.code === "version_conflict",
      );
      const saved: UserTablePreferences = { ...schema.defaults(), version: 1 };
      const valid = new AdminApiClient("", async () => Response.json(saved));
      assert.deepEqual(await valid.tablePreferences(), saved);
    });
  }
}
new TablePreferenceContractSuite().register();
