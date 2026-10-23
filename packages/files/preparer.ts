// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import sharp from "sharp";
import { createHash } from "node:crypto";
import { AttachmentLimits } from "../contracts/attachments.js";
import type { AttachmentCandidate, AttachmentPreview, AttachmentPreparer } from "../contracts/attachments.js";
import { DomainError } from "../core/index.js";
import { AttachmentValidation } from "../core/attachment-validation.js";
import { AttachmentClassifier } from "./classifier.js";
/** Keeps an owned original byte-for-byte; only a separate raster preview is re-encoded. */
export class SharpAttachmentPreparer implements AttachmentPreparer {
  constructor(private readonly classifier: AttachmentClassifier, private readonly validation: AttachmentValidation) {}
  fingerprint(bytes: Uint8Array): string { return createHash("sha256").update(bytes).digest("hex"); }
  identify(bytes: Uint8Array, name: string, declaredType: string, operationId: string): AttachmentCandidate {
    if (bytes.byteLength < 1) throw new DomainError(422, "file_empty");
    if (bytes.byteLength > AttachmentLimits.bytes) throw new DomainError(413, "file_too_large");
    const original = Uint8Array.from(bytes);
    const mediaType = this.classifier.detect(original);
    if (declaredType !== "application/octet-stream" && declaredType !== mediaType) throw new DomainError(415, "file_type_mismatch");
    this.validation.extension(name, mediaType);
    return { original, mediaType, name, operationId, sha256: this.fingerprint(original) };
  }
  async preview(candidate: AttachmentCandidate): Promise<AttachmentPreview> {
    if (candidate.mediaType === "application/pdf") return { data: null, originalOnlyReason: "pdf-original" };
    if (candidate.mediaType === "image/heic") return { data: null, originalOnlyReason: "heic-original" };
    const image = sharp(candidate.original, { failOn: "warning", limitInputPixels: AttachmentLimits.pixels, limitInputChannels: 4 });
    try {
      const metadata = await image.metadata();
      const expected = candidate.mediaType === "image/jpeg" ? "jpeg" : candidate.mediaType === "image/png" ? "png" : "webp";
      if (metadata.format !== expected || !metadata.width || !metadata.height) throw new DomainError(422, "invalid_file");
      if ((metadata.pages ?? 1) > 1) return { data: null, originalOnlyReason: "animation-original" };
      const result = await image.autoOrient().resize({ width: AttachmentLimits.dimension, height: AttachmentLimits.dimension,
        fit: "inside", withoutEnlargement: true }).webp({ quality: 80, effort: 3 }).timeout({ seconds: 5 }).toBuffer({ resolveWithObject: true });
      if (result.data.byteLength > AttachmentLimits.previewBytes) throw new DomainError(413, "file_preview_too_large");
      return { data: { bytes: Uint8Array.from(result.data), width: result.info.width, height: result.info.height }, originalOnlyReason: null };
    } catch (error: unknown) {
      if (error instanceof DomainError) throw error;
      throw new DomainError(422, "invalid_file");
    } finally { image.destroy(); }
  }
}
