// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { DomainError } from "../../../packages/core/index.js";
/** One bounded byte reader; JSON decoding and binary metadata parsing are separate responsibilities. */
export class BoundedBody {
  constructor(readonly limit: number) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 5_000_000) throw new RangeError("Invalid body bound");
  }
  async bytes(stream: ReadableStream<Uint8Array> | null): Promise<Uint8Array> {
    if (!stream) return new Uint8Array();
    const reader = stream.getReader(), chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > this.limit) { await reader.cancel(); throw new DomainError(413, "body_too_large"); }
        chunks.push(part.value);
      }
    } finally { reader.releaseLock(); }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
    return result;
  }
}
