// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import sharp from "sharp";
import { AttachmentLimits, AttachmentMedia } from "../contracts/attachments.js";
import { AttachmentValidation } from "../core/attachment-validation.js";
import { AttachmentClassifier } from "../files/classifier.js";
import { SharpAttachmentPreparer } from "../files/preparer.js";
class AttachmentPreparationSuite {
  private readonly validation = new AttachmentValidation();
  private readonly preparer = new SharpAttachmentPreparer(new AttachmentClassifier(), this.validation);
  register(): void {
    test("Attachment metadata rejects paths/control/ambiguous extension and unsupported declarations", () => {
      for (const name of ["../photo.png", "folder\\photo.png", "photo\n.png", "photo\u202e.png", "photo.png ", "", "x".repeat(121)])
        assert.throws(() => this.validation.metadata(name, "image/png", randomUUID()), { code: "invalid_file_name" });
      assert.throws(() => this.validation.metadata("photo.png", "text/html", randomUUID()), { code: "unsupported_file_type" });
      assert.throws(() => this.validation.metadata("photo.png", "image/png", "same"), { code: "invalid_upload_key" });
      assert.equal(this.validation.metadata("مخطط القمة.png", "application/octet-stream", randomUUID()).name, "مخطط القمة.png");
      assert.throws(() => this.validation.extension("image.png.exe", "image/png"), { code: "file_type_mismatch" });
      assert.equal(new AttachmentMedia().downloadName("00000000-0000-4000-8000-000000000001", "image/jpeg"), "summit-file-00000000-0000-4000-8000-000000000001.jpg");
      assert.throws(() => new AttachmentMedia().downloadName("../x", "image/png"), TypeError);
    });
    test("PNG/JPEG/WebP are actually decoded; originals retain bytes/hash and previews are bounded WebP without source metadata", async () => {
      const source = sharp({ create: { width: 24, height: 12, channels: 4, background: { r: 40, g: 90, b: 70, alpha: 1 } } });
      const variants = [
        { bytes: await source.clone().png().toBuffer(), name: "قمة.png", type: "image/png" },
        { bytes: await source.clone().jpeg().toBuffer(), name: "قمة.jpg", type: "image/jpeg" },
        { bytes: await source.clone().webp().toBuffer(), name: "قمة.webp", type: "image/webp" },
      ];
      source.destroy();
      for (const variant of variants) {
        const expected = Buffer.from(variant.bytes);
        const candidate = this.preparer.identify(variant.bytes, variant.name, variant.type, randomUUID());
        variant.bytes.fill(0); // candidate owns its original; caller mutation must not corrupt it.
        assert.deepEqual(Buffer.from(candidate.original), expected);
        assert.equal(candidate.sha256, createHash("sha256").update(expected).digest("hex"));
        const preview = await this.preparer.preview(candidate);
        assert.ok(preview.data);
        assert.equal(preview.originalOnlyReason, null);
        assert.ok(preview.data.bytes.byteLength <= AttachmentLimits.previewBytes);
        const metadata = await sharp(preview.data.bytes).metadata();
        assert.equal(metadata.format, "webp");
        assert.equal(metadata.width, 24);
        assert.equal(metadata.height, 12);
        assert.equal(metadata.exif, undefined);
        assert.deepEqual(Buffer.from(candidate.original), expected);
      }
    });
    test("Actual size/type and corrupt raster bytes fail before storage, including excessive input dimensions", async () => {
      assert.throws(() => this.preparer.identify(new Uint8Array(), "x.png", "image/png", randomUUID()), { code: "file_empty" });
      assert.throws(() => this.preparer.identify(new Uint8Array(AttachmentLimits.bytes + 1), "x.png", "image/png", randomUUID()), { code: "file_too_large" });
      assert.throws(() => this.preparer.identify(new TextEncoder().encode("<svg/>"), "x.png", "image/png", randomUUID()), { code: "unsupported_file_type" });
      const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "white" } }).png().toBuffer();
      assert.throws(() => this.preparer.identify(png, "x.png", "application/pdf", randomUUID()), { code: "file_type_mismatch" });
      const broken = this.preparer.identify(png.subarray(0, 16), "x.png", "image/png", randomUUID());
      await assert.rejects(this.preparer.preview(broken), { code: "invalid_file" });
      const big = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: "white" } }).png().toBuffer();
      await assert.rejects(this.preparer.preview(this.preparer.identify(big, "large.png", "image/png", randomUUID())), { code: "invalid_file" });
    });
    test("PDF and recognized HEIC containers remain original-only, with no false preview/codec claim", async () => {
      const pdf = new TextEncoder().encode("%PDF-1.7\n% original document fixture, not renderer evidence\n%%EOF\n");
      const candidate = this.preparer.identify(pdf, "original.pdf", "application/pdf", randomUUID());
      assert.deepEqual(await this.preparer.preview(candidate), { data: null, originalOnlyReason: "pdf-original" });
      assert.deepEqual(candidate.original, pdf);
      const heic = new Uint8Array(24);
      new DataView(heic.buffer).setUint32(0, 24);
      heic.set(new TextEncoder().encode("ftypheic"), 4);
      heic.set(new TextEncoder().encode("mif1heic"), 16);
      const container = this.preparer.identify(heic, "original.heic", "image/heic", randomUUID());
      assert.deepEqual(await this.preparer.preview(container), { data: null, originalOnlyReason: "heic-original" });
      assert.deepEqual(container.original, heic);
      assert.throws(() => this.preparer.identify(pdf.subarray(0, 10), "bad.pdf", "application/pdf", randomUUID()), { code: "unsupported_file_type" });
    });
  }
}
new AttachmentPreparationSuite().register();
