// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { DatabaseFixture } from "../support/database-fixture.js";
import type { PostgresRepository } from "../../data-access/index.js";
import { MigrationRunner } from "../../data-access/migration-runner.js";
import { PostgresAttachmentRepository } from "../../data-access/attachment-repository.js";
import { PostgresSessionGuard } from "../../data-access/session-guard.js";
import { PostgresAuditRepository } from "../../data-access/audit-repository.js";
import { AuthorizationPolicy } from "../../core-rbac/index.js";
import { SessionToken } from "../../security/index.js";
import { SharpAttachmentPreparer } from "../../files/preparer.js";
import { AttachmentClassifier } from "../../files/classifier.js";
import { AttachmentValidation } from "../../core/attachment-validation.js";
import type { AttachmentCandidate, AttachmentPreview } from "../../contracts/attachments.js";

class AttachmentIntegrationSuite {
  private readonly policy = new AuthorizationPolicy();
  private readonly tokens = new SessionToken();
  private readonly preparer = new SharpAttachmentPreparer(new AttachmentClassifier(), new AttachmentValidation());
  private async account(repository: PostgresRepository, role: "admin" | "editor" | "viewer") {
    const id = randomUUID(), digest = this.tokens.digest(this.tokens.create());
    await repository.pool.query("INSERT INTO users(id,name,email,role,status) VALUES($1,'File test',$2,$3,'active')", [id, `${id}@example.test`, role]);
    await repository.session(digest, id);
    return { id, digest };
  }
  private store(repository: PostgresRepository) {
    return new PostgresAttachmentRepository(repository.pool, new PostgresSessionGuard(), new PostgresAuditRepository(repository.pool));
  }
  private async candidate(): Promise<AttachmentCandidate> {
    const bytes = await sharp({ create: { width: 20, height: 12, channels: 3, background: "#00735c" } }).png().toBuffer();
    return this.preparer.identify(bytes, "صورة.png", "image/png", randomUUID());
  }
  register(): void {
    test("Private attachments on real isolated PostgreSQL", { timeout: 60000 }, async context => {
      const fixture = new DatabaseFixture();
      try {
        const repository = await fixture.create(), independent = await fixture.create();
        await new MigrationRunner().apply(repository.pool);
        await new MigrationRunner().apply(independent.pool);
        const store = this.store(repository), owner = await this.account(repository, "editor"), other = await this.account(repository, "admin"), viewer = await this.account(repository, "viewer");
        const candidate = await this.candidate();
        const uploaded = await store.createForSession(owner.digest, candidate, randomUUID(), this.policy, () => this.preparer.preview(candidate));
        await context.test("Original bytes and digest are unchanged; preview is actually decoded and metadata is private", async () => {
          const original = await store.getForSession(owner.digest, uploaded.file.id, false, this.policy);
          assert.deepEqual(original.bytes, candidate.original);
          assert.equal(this.preparer.fingerprint(original.bytes), uploaded.file.sha256);
          const preview = await store.getForSession(owner.digest, uploaded.file.id, true, this.policy);
          assert.equal((await sharp(preview.bytes).metadata()).format, "webp");
          assert.deepEqual(uploaded.file.preview && { width: uploaded.file.preview.width, height: uploaded.file.preview.height }, { width: 20, height: 12 });
          const list = await store.listForSession(owner.digest, this.policy);
          assert.equal(list.length, 1);
          assert.deepEqual(Object.keys(list[0]!).sort(), ["id", "name", "mediaType", "size", "sha256", "createdAt", "preview", "originalOnlyReason"].sort());
          await new MigrationRunner().apply(repository.pool);
          assert.deepEqual((await store.getForSession(owner.digest, uploaded.file.id, false, this.policy)).bytes, candidate.original);
        });
        await context.test("Other accounts including administrators cannot list, read, preview or delete an owner's files", async () => {
          assert.deepEqual(await store.listForSession(other.digest, this.policy), []);
          for (const preview of [false, true]) await assert.rejects(store.getForSession(other.digest, uploaded.file.id, preview, this.policy), { code: "not_found" });
          await assert.rejects(store.deleteForSession(other.digest, uploaded.file.id, randomUUID(), this.policy), { code: "not_found" });
          const independentOwner = await this.account(independent, "editor");
          await assert.rejects(this.store(independent).getForSession(independentOwner.digest, uploaded.file.id, false, this.policy), { code: "not_found" });
          assert.deepEqual(await store.listForSession(viewer.digest, this.policy), []);
          await assert.rejects(store.createForSession(viewer.digest, candidate, randomUUID(), this.policy, () => this.preparer.preview(candidate)), { code: "forbidden" });
          await assert.rejects(store.deleteForSession(viewer.digest, uploaded.file.id, randomUUID(), this.policy), { code: "forbidden" });
        });
        await context.test("Concurrent retries create one row and one audit, without processing a replay", async () => {
          const next = await this.candidate(); let preparations = 0;
          const prepare = async () => { preparations++; return this.preparer.preview(next); };
          const results = await Promise.all([store.createForSession(owner.digest, next, randomUUID(), this.policy, prepare), store.createForSession(owner.digest, next, randomUUID(), this.policy, prepare)]);
          assert.equal(results[0].file.id, results[1].file.id);
          assert.deepEqual(results.map(result => result.replayed).sort(), [false, true]);
          assert.equal(preparations, 1);
          assert.equal((await repository.pool.query("SELECT * FROM audit_events WHERE action='files:create' AND resource_id=$1", [results[0].file.id])).rowCount, 1);
          await assert.rejects(store.createForSession(owner.digest, { ...next, name: "different.png" }, randomUUID(), this.policy, prepare), { code: "upload_key_conflict" });
          assert.equal(preparations, 1);
        });
        await context.test("Audit failure rolls back both creation and deletion", async () => {
          const next = await this.candidate(), before = await store.listForSession(owner.digest, this.policy);
          await assert.rejects(store.createForSession(owner.digest, next, "invalid-uuid", this.policy, () => this.preparer.preview(next)), { code: "22P02" });
          assert.deepEqual(await store.listForSession(owner.digest, this.policy), before);
          await assert.rejects(store.deleteForSession(owner.digest, uploaded.file.id, "invalid-uuid", this.policy), { code: "22P02" });
          assert.deepEqual((await store.getForSession(owner.digest, uploaded.file.id, false, this.policy)).bytes, candidate.original);
        });
        await context.test("Installation processing admission returns busy and releases after rollback", async () => {
          const blocker = await repository.pool.connect();
          try {
            await blocker.query("BEGIN"); await blocker.query("SELECT pg_advisory_xact_lock(1398099277, 2)");
            const next = await this.candidate(); let prepared = false;
            await assert.rejects(store.createForSession(other.digest, next, randomUUID(), this.policy, async () => { prepared = true; return this.preparer.preview(next); }), { code: "file_processing_busy" });
            assert.equal(prepared, false);
          } finally { await blocker.query("ROLLBACK"); blocker.release(); }
          const next = await this.candidate();
          assert.equal((await store.createForSession(other.digest, next, randomUUID(), this.policy, () => this.preparer.preview(next))).replayed, false);
        });
        await context.test("Expiry during image processing and completed logout reject writes without audit effects", async () => {
          const expiring = await this.account(repository, "editor"), next = await this.candidate();
          await repository.pool.query("UPDATE sessions SET expires_at=clock_timestamp()+interval '150 milliseconds' WHERE digest=$1", [expiring.digest]);
          const before = (await repository.events()).length;
          const prepare = async (): Promise<AttachmentPreview> => {
            await new Promise(resolve => setTimeout(resolve, 200));
            return this.preparer.preview(next);
          };
          await assert.rejects(store.createForSession(expiring.digest, next, randomUUID(), this.policy, prepare), { code: "unauthenticated" });
          assert.equal((await repository.pool.query("SELECT * FROM attachments WHERE owner_id=$1", [expiring.id])).rowCount, 0);
          assert.equal((await repository.events()).length, before);
          await repository.logout(other.digest);
          await assert.rejects(store.createForSession(other.digest, next, randomUUID(), this.policy, () => this.preparer.preview(next)), { code: "unauthenticated" });
          await assert.rejects(store.listForSession(other.digest, this.policy), { code: "unauthenticated" });
        });
        await context.test("Per-owner count quota rejects the eleventh file before processing; deletion is atomic and audited", async () => {
          const quota = await this.account(repository, "editor");
          for (let index = 0; index < 10; index++) {
            const next = await this.candidate();
            await store.createForSession(quota.digest, next, randomUUID(), this.policy, () => this.preparer.preview(next));
          }
          const next = await this.candidate(); let prepared = false;
          await assert.rejects(store.createForSession(quota.digest, next, randomUUID(), this.policy, async () => { prepared = true; return this.preparer.preview(next); }), { code: "file_quota_exceeded" });
          assert.equal(prepared, false);
          const files = await store.listForSession(quota.digest, this.policy); assert.equal(files.length, 10);
          const id = files[0]!.id; await store.deleteForSession(quota.digest, id, randomUUID(), this.policy);
          await assert.rejects(store.getForSession(quota.digest, id, false, this.policy), { code: "not_found" });
          assert.equal((await store.listForSession(quota.digest, this.policy)).length, 9);
          assert.equal((await repository.pool.query("SELECT * FROM audit_events WHERE action='files:delete' AND resource_id=$1", [id])).rowCount, 1);
        });
      } finally { await fixture.close(); }
    });
  }
}
new AttachmentIntegrationSuite().register();
