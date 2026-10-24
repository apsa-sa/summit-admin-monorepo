// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { DomainError } from "./index.js";
import type { AttachmentMediaType } from "../contracts/attachments.js";
/** Filename and protocol metadata only; never selects a filesystem path. */
export class AttachmentValidation {
  metadata(name: string, declaredType: string, operationId: string): { name: string; declaredType: string; operationId: string } {
    if (!name || name.length > 120 || name !== name.trim() || /[\x00-\x1f\x7f/\\\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(name))
      throw new DomainError(422, "invalid_file_name");
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(operationId))
      throw new DomainError(422, "invalid_upload_key");
    const media = declaredType.toLowerCase().split(";")[0]?.trim() ?? "";
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "image/heif", "application/pdf", "application/octet-stream"].includes(media))
      throw new DomainError(415, "unsupported_file_type");
    return { name, declaredType: media === "image/jpg" ? "image/jpeg" : media === "image/heif" ? "image/heic" : media, operationId };
  }
  extension(name: string, type: AttachmentMediaType): void {
    const extension = name.toLowerCase().split(".").at(-1);
    const accepted: Readonly<Record<AttachmentMediaType, readonly string[]>> = {
      "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"],
      "image/heic": ["heic", "heif"], "application/pdf": ["pdf"],
    };
    if (!extension || !accepted[type].includes(extension)) throw new DomainError(415, "file_type_mismatch");
  }
}
