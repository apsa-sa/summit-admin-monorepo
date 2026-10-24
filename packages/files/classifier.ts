// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { AttachmentMediaType } from "../contracts/attachments.js";
import { DomainError } from "../core/index.js";
/** Signature/container classification, not a malware scan or document safety certificate. */
export class AttachmentClassifier {
  detect(bytes: Uint8Array): AttachmentMediaType {
    const text = (start: number, end: number) => new TextDecoder().decode(bytes.subarray(start, end));
    if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return "image/png";
    if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
    if (bytes.length >= 12 && text(0, 4) === "RIFF" && text(8, 12) === "WEBP") {
      if (new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(4, true) + 8 !== bytes.byteLength)
        throw new DomainError(422, "invalid_file");
      return "image/webp";
    }
    if (/^%PDF-(?:1\.[0-7]|2\.0)$/.test(text(0, 8)) && (bytes[8] === 10 || bytes[8] === 13) && /%%EOF[\x00\t\n\f\r ]*$/.test(text(Math.max(0, bytes.length - 1024), bytes.length)))
      return "application/pdf";
    if (bytes.length >= 24 && text(4, 8) === "ftyp") {
      const size = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0);
      if (size >= 20 && size <= bytes.length && size % 4 === 0) {
        for (let offset = 8; offset + 4 <= size; offset += 4) {
          if (offset !== 12 && ["heic", "heix", "hevc", "hevx"].includes(text(offset, offset + 4))) return "image/heic";
        }
      }
    }
    throw new DomainError(415, "unsupported_file_type");
  }
}
