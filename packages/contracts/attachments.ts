// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { PermissionPolicy } from "./ports.js";
export type AttachmentMediaType = "image/png" | "image/jpeg" | "image/webp" | "image/heic" | "application/pdf";
export type OriginalOnlyReason = "pdf-original" | "heic-original" | "animation-original";
export class AttachmentLimits {
  static readonly bytes = 5_000_000;
  static readonly previewBytes = 1_000_000;
  static readonly pixels = 16_000_000;
  static readonly dimension = 1600;
  static readonly count = 10;
  static readonly accountBytes = 50_000_000;
}
export class AttachmentMedia {
  extension(type: AttachmentMediaType): string {
    switch (type) {
      case "image/png": return "png";
      case "image/jpeg": return "jpg";
      case "image/webp": return "webp";
      case "image/heic": return "heic";
      case "application/pdf": return "pdf";
    }
  }
  downloadName(id: string, type: AttachmentMediaType): string {
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) throw new TypeError("Invalid attachment identifier");
    return `summit-file-${id}.${this.extension(type)}`;
  }
}
export interface AttachmentSummary {
  readonly id: string;
  readonly name: string;
  readonly mediaType: AttachmentMediaType;
  readonly size: number;
  readonly sha256: string;
  readonly createdAt: string;
  readonly preview: { readonly width: number; readonly height: number; readonly bytes: number } | null;
  readonly originalOnlyReason: OriginalOnlyReason | null;
}
export interface AttachmentCandidate {
  readonly name: string;
  readonly operationId: string;
  readonly mediaType: AttachmentMediaType;
  readonly original: Uint8Array;
  readonly sha256: string;
}
export interface AttachmentPreview {
  readonly data: { readonly bytes: Uint8Array; readonly width: number; readonly height: number } | null;
  readonly originalOnlyReason: OriginalOnlyReason | null;
}
export interface AttachmentPreparer {
  identify(bytes: Uint8Array, name: string, declaredType: string, operationId: string): AttachmentCandidate;
  preview(candidate: AttachmentCandidate): Promise<AttachmentPreview>;
  fingerprint(bytes: Uint8Array): string;
}
export interface StoredAttachment {
  readonly summary: AttachmentSummary;
  readonly bytes: Uint8Array;
}
export interface AttachmentStore {
  listForSession(digest: string, policy: PermissionPolicy): Promise<readonly AttachmentSummary[]>;
  getForSession(digest: string, id: string, preview: boolean, policy: PermissionPolicy): Promise<StoredAttachment>;
  createForSession(digest: string, candidate: AttachmentCandidate, requestId: string, policy: PermissionPolicy,
    prepare: () => Promise<AttachmentPreview>): Promise<{ readonly file: AttachmentSummary; readonly replayed: boolean }>;
  deleteForSession(digest: string, id: string, requestId: string, policy: PermissionPolicy): Promise<void>;
}
