// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { PermissionPolicy } from "../contracts/ports.js";
import type { AttachmentStore, AttachmentPreparer } from "../contracts/attachments.js";
import { AttachmentMedia } from "../contracts/attachments.js";
import { SessionService } from "../auth/index.js";
import { AttachmentValidation } from "../core/attachment-validation.js";
import { DomainError } from "../core/index.js";
/** Application coordination; image processing and persistence remain injected ports. */
export class AttachmentApplicationService {
  constructor(private readonly store: AttachmentStore, private readonly sessions: SessionService,
    private readonly policy: PermissionPolicy, private readonly validation: AttachmentValidation,
    private readonly preparer: AttachmentPreparer, private readonly media: AttachmentMedia) {}
  async authorizeUpload(digest: string): Promise<void> {
    this.policy.require(await this.sessions.authenticate(digest), "files:create");
  }
  async upload(digest: string, name: string, type: string, operationId: string, bytes: Uint8Array, requestId: string) {
    await this.authorizeUpload(digest);
    const input = this.validation.metadata(name, type, operationId);
    const candidate = this.preparer.identify(bytes, input.name, input.declaredType, input.operationId);
    return this.store.createForSession(digest, candidate, requestId, this.policy, () => this.preparer.preview(candidate));
  }
  async list(digest: string) {
    this.policy.require(await this.sessions.authenticate(digest), "files:read");
    return this.store.listForSession(digest, this.policy);
  }
  async download(digest: string, id: string, preview: boolean) {
    this.policy.require(await this.sessions.authenticate(digest), "files:read");
    const result = await this.store.getForSession(digest, id, preview, this.policy);
    if (!preview && this.preparer.fingerprint(result.bytes) !== result.summary.sha256) throw new DomainError(500, "file_integrity_error");
    return { bytes: Uint8Array.from(result.bytes).buffer, contentType: preview ? "image/webp" : result.summary.mediaType,
      disposition: preview ? "inline" : "attachment", filename: this.media.downloadName(id, preview ? "image/webp" : result.summary.mediaType) };
  }
  async remove(digest: string, id: string, requestId: string): Promise<void> {
    this.policy.require(await this.sessions.authenticate(digest), "files:delete");
    await this.store.deleteForSession(digest, id, requestId, this.policy);
  }
}
