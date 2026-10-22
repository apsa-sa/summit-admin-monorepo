// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseFixture } from "../support/database-fixture.js";
import { PostgresExportLease } from "../../data-access/export-lease.js";
class ExportLeaseSuite {
  register(): void {
    test("PDF admission is exclusive per installation and releases after success/failure", { timeout: 30000 }, async context => {
      const fixture = new DatabaseFixture();
      try {
        const first = await fixture.create(), second = await fixture.create();
        const lease = new PostgresExportLease(first.pool), rival = new PostgresExportLease(first.pool);
        let entered = () => {}, release = () => {};
        const ready = new Promise<void>(resolve => { entered = resolve; });
        const held = new Promise<void>(resolve => { release = resolve; });
        const ongoing = lease.run(async () => { entered(); await held; return "first"; });
        await ready;
        try {
          await context.test("separate request scope cannot launch a concurrent renderer", async () => {
            let invoked = false;
            await assert.rejects(rival.run(async () => { invoked = true; }), { status: 429, code: "pdf_export_busy" });
            assert.equal(invoked, false);
          });
          await context.test("independent installation does not share the render lock", async () => {
            assert.equal(await new PostgresExportLease(second.pool).run(async () => "independent"), "independent");
          });
        } finally { release(); await ongoing; }
        await context.test("commit and rollback both release admission for the next renderer", async () => {
          assert.equal(await rival.run(async () => 7), 7);
          const failure = new Error("Synthetic print failure");
          await assert.rejects(lease.run(async () => { throw failure; }), failure);
          assert.equal(await rival.run(async () => 9), 9);
        });
      } finally { await fixture.close(); }
    });
  }
}
new ExportLeaseSuite().register();
