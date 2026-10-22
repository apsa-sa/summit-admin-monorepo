// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { User, UserInput } from "../contracts/index.js";
import { AuthorizationPolicy } from "../core-rbac/index.js";
import {
  ApiFailure,
  AdminApiClient,
} from "../../apps/web-admin/browser/api.js";
import { BulkUserController } from "../../apps/web-admin/presentation/bulk-users.js";
import { WorkspaceStore } from "../../apps/web-admin/presentation/state.js";
class Pending<T> {
  readonly promise: Promise<T>;
  private complete: (value: T) => void = () => {};
  constructor() {
    this.promise = new Promise((resolve) => {
      this.complete = resolve;
    });
  }
  resolve(value: T): void {
    this.complete(value);
  }
}
class BulkApiFixture {
  readonly calls: { id: string; input: UserInput }[] = [];
  readonly pending = new Map<string, Pending<User>>();
  readonly failures = new Map<string, ApiFailure>();
  wrongId = false;
  ends = 0;
  constructor(private readonly rows: readonly User[]) {}
  endSession(): void {
    this.ends++;
  }
  async updateUser(id: string, input: UserInput): Promise<User> {
    this.calls.push({ id, input });
    const failure = this.failures.get(id);
    if (failure) throw failure;
    const pending = this.pending.get(id);
    if (pending) return pending.promise;
    const row = this.rows.find((user) => user.id === id);
    assert.ok(row);
    return {
      ...row,
      ...input,
      id: this.wrongId ? randomUUID() : id,
      version: input.version + 1,
    };
  }
}
class BulkUserSuite {
  private setup(count = 3) {
    const actor: User = {
      id: randomUUID(),
      name: "Actor",
      email: "actor@example.test",
      role: "admin",
      status: "active",
      version: 0,
      createdAt: new Date(0).toISOString(),
    };
    const rows: User[] = Array.from({ length: count }, (_, index) => ({
      ...actor,
      id: randomUUID(),
      name: `Fixture ${index}`,
      email: `fixture${index}@example.test`,
      role: "viewer",
    }));
    const store = new WorkspaceStore("en", "light", actor, () => {});
    store.patch({
      view: "users",
      page: { rows, total: count, page: 1, pageSize: count },
    });
    const api = new BulkApiFixture(rows),
      drafts = { deactivate: () => {} },
      bulk = new BulkUserController(
        store,
        api,
        drafts,
        new AuthorizationPolicy(),
      );
    for (const row of rows) bulk.toggle(row.id, true);
    store.patch({ bulk: { ...store.snapshot.bulk, confirm: true } });
    return { actor, rows, store, api, bulk };
  }
  register(): void {
    test("Bulk status uses exact IDs/versions and confirms each independent successful update", async () => {
      const { rows, store, api, bulk } = this.setup();
      await bulk.run();
      assert.deepEqual(
        api.calls.map((call) => call.id),
        rows.map((row) => row.id),
      );
      assert.ok(
        api.calls.every(
          (call) =>
            call.input.status === "suspended" &&
            call.input.version === 0 &&
            call.input.role === "viewer",
        ),
      );
      assert.deepEqual(
        store.snapshot.bulk.results.map((row) => row.outcome),
        ["updated", "updated", "updated"],
      );
      assert.equal(store.snapshot.busy, false);
      assert.equal(store.snapshot.bulk.selected.size, 0);
      assert.equal(bulk.isRunning(), false);
    });
    test("Bulk conflict stops the queue and distinguishes confirmed updates, rejection and unattempted records", async () => {
      const { rows, store, api, bulk } = this.setup();
      const second = rows[1];
      assert.ok(second);
      api.failures.set(second.id, new ApiFailure(409, "version_conflict"));
      await bulk.run();
      assert.equal(api.calls.length, 2);
      assert.deepEqual(
        store.snapshot.bulk.results.map((row) => row.outcome),
        ["updated", "rejected", "not_attempted"],
      );
      assert.equal(store.snapshot.busy, false);
    });
    test("Network/invalid acknowledgement is unconfirmed and never automatically retried", async () => {
      for (const malformed of [false, true]) {
        const { rows, store, api, bulk } = this.setup();
        const first = rows[0];
        assert.ok(first);
        if (malformed) api.wrongId = true;
        else api.failures.set(first.id, new ApiFailure(0, "network_error"));
        await bulk.run();
        assert.equal(api.calls.length, 1);
        assert.deepEqual(
          store.snapshot.bulk.results.map((row) => row.outcome),
          ["unconfirmed", "not_attempted", "not_attempted"],
        );
      }
    });
    test("Stop waits for the in-flight confirmed request and makes no remaining mutation", async () => {
      const { rows, store, api, bulk } = this.setup();
      const first = rows[0];
      assert.ok(first);
      const pending = new Pending<User>();
      api.pending.set(first.id, pending);
      const run = bulk.run();
      assert.equal(api.calls.length, 1);
      bulk.stop();
      assert.equal(store.snapshot.bulk.stopping, true);
      pending.resolve({ ...first, status: "suspended", version: 1 });
      await run;
      assert.equal(api.calls.length, 1);
      assert.deepEqual(
        store.snapshot.bulk.results.map((row) => row.outcome),
        ["updated", "not_attempted", "not_attempted"],
      );
      assert.equal(store.snapshot.bulk.stopping, false);
    });
    test("Logout/session expiry clears context and ignores delayed bulk responses", async () => {
      const delayed = this.setup();
      const first = delayed.rows[0];
      assert.ok(first);
      const pending = new Pending<User>();
      delayed.api.pending.set(first.id, pending);
      const run = delayed.bulk.run();
      delayed.store.advanceEpoch();
      delayed.store.clear();
      pending.resolve({ ...first, status: "suspended", version: 1 });
      await run;
      assert.equal(delayed.api.calls.length, 1);
      assert.equal(delayed.store.snapshot.bulk.results.length, 0);
      assert.equal(delayed.store.snapshot.user, null);
      const expired = this.setup();
      const target = expired.rows[0];
      assert.ok(target);
      expired.api.failures.set(
        target.id,
        new ApiFailure(401, "unauthenticated"),
      );
      await expired.bulk.run();
      assert.equal(expired.api.ends, 1);
      assert.equal(expired.store.snapshot.user, null);
      assert.equal(expired.store.snapshot.bulk.results.length, 0);
      assert.equal(expired.store.snapshot.busy, false);
    });
    test("Bulk selection is page-bounded, rejects self/forbidden roles, and cannot exceed eight writes", async () => {
      const setup = this.setup(9);
      assert.equal(setup.store.snapshot.bulk.selected.size, 8);
      setup.store.patch({
        bulk: {
          ...setup.store.snapshot.bulk,
          selected: new Set(setup.rows.map((row) => row.id)),
        },
      });
      await setup.bulk.run();
      assert.equal(setup.api.calls.length, 0);
      assert.equal(setup.bulk.eligible(setup.actor), false);
      for (const role of ["viewer", "editor"] as const) {
        setup.store.patch({
          user: { ...setup.actor, role },
          bulk: { ...setup.store.snapshot.bulk, selected: new Set() },
        });
        assert.equal(setup.bulk.available(), false);
        const row = setup.rows[0];
        assert.ok(row);
        setup.bulk.toggle(row.id, true);
        assert.equal(setup.store.snapshot.bulk.selected.size, 0);
      }
    });
    test("API deadlines and session cancellation terminate stalled transport without retry", async () => {
      let calls = 0;
      const stalled: typeof fetch = async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          calls++;
          init?.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true },
          );
        });
      const timed = new AdminApiClient("", stalled, 20);
      await assert.rejects(timed.users(1, ""), {
        status: 0,
        code: "network_error",
      });
      assert.equal(calls, 1);
      const cancelled = new AdminApiClient("", stalled, 1000);
      const request = cancelled.users(1, "");
      cancelled.endSession();
      await assert.rejects(request, { status: 0, code: "network_error" });
      assert.equal(calls, 2);
      for (const invalid of [0, NaN, Infinity, 60001])
        assert.throws(
          () => new AdminApiClient("", stalled, invalid),
          RangeError,
        );
    });
  }
}
new BulkUserSuite().register();
