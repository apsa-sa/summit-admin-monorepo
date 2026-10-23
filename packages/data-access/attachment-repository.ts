// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Pool, PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import type { Actor } from "../contracts/index.js";
import type { PermissionPolicy } from "../contracts/ports.js";
import { AttachmentLimits } from "../contracts/attachments.js";
import type { AttachmentStore, AttachmentSummary, AttachmentMediaType, AttachmentCandidate, AttachmentPreview, OriginalOnlyReason, StoredAttachment } from "../contracts/attachments.js";
import { DomainError } from "../core/index.js";
import { PostgresSessionGuard } from "./session-guard.js";
import { PostgresAuditRepository } from "./audit-repository.js";
interface AttachmentRow {
  id: string; name: string; media_type: AttachmentMediaType; size: number; sha256: string; created_at: Date;
  preview_width: number | null; preview_height: number | null; preview_size: number; original_only_reason: OriginalOnlyReason | null;
}
/** One independently installed database; every operation is scoped by its live session owner. */
export class PostgresAttachmentRepository implements AttachmentStore {
  private readonly columns = "id,name,media_type,octet_length(original) AS size,sha256,created_at,preview_width,preview_height,COALESCE(octet_length(preview),0) AS preview_size,original_only_reason";
  constructor(private readonly pool: Pool, private readonly guard: PostgresSessionGuard, private readonly audit: PostgresAuditRepository) {}
  private summary(row: AttachmentRow): AttachmentSummary {
    return { id: row.id, name: row.name, mediaType: row.media_type, size: row.size, sha256: row.sha256,
      createdAt: row.created_at.toISOString(), preview: row.preview_width !== null && row.preview_height !== null
        ? { width: row.preview_width, height: row.preview_height, bytes: row.preview_size } : null,
      originalOnlyReason: row.original_only_reason };
  }
  private async session<T>(digest: string, action: string, write: boolean, policy: PermissionPolicy,
    operation: (client: PoolClient, actor: Actor) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = 10000");
      await client.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");
      // Serialize per-owner quota/idempotency checks. Preserve user-before-session lock order.
      if (write) await client.query("SELECT id FROM users WHERE id=(SELECT user_id FROM sessions WHERE digest=$1) FOR UPDATE", [digest]);
      const actor = await this.guard.require(client, digest);
      policy.require(actor, action);
      await this.current(client, digest);
      const value = await operation(client, actor);
      await this.current(client, digest);
      await client.query("COMMIT");
      return value;
    } catch (error: unknown) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }
  private async current(client: PoolClient, digest: string): Promise<void> {
    // Native image work can outlast expiry; transaction-start now() would be stale here.
    const result = await client.query("SELECT digest FROM sessions WHERE digest=$1 AND expires_at>clock_timestamp()", [digest]);
    if (!result.rows[0]) throw new DomainError(401, "unauthenticated");
  }
  listForSession(digest: string, policy: PermissionPolicy): Promise<readonly AttachmentSummary[]> {
    return this.session(digest, "files:read", false, policy, async (client, actor) => {
      const result = await client.query<AttachmentRow>(`SELECT ${this.columns} FROM attachments WHERE owner_id=$1 ORDER BY created_at DESC,id LIMIT 10`, [actor.id]);
      return result.rows.map(row => this.summary(row));
    });
  }
  getForSession(digest: string, id: string, preview: boolean, policy: PermissionPolicy): Promise<StoredAttachment> {
    return this.session(digest, "files:read", false, policy, async (client, actor) => {
      const result = await client.query<AttachmentRow & { payload: Uint8Array | null }>(
        `SELECT ${this.columns},${preview ? "preview" : "original"} AS payload FROM attachments WHERE id=$1 AND owner_id=$2`, [id, actor.id]);
      const row = result.rows[0];
      if (!row || row.payload === null) throw new DomainError(404, "not_found");
      return { summary: this.summary(row), bytes: Uint8Array.from(row.payload) };
    });
  }
  createForSession(digest: string, candidate: AttachmentCandidate, requestId: string, policy: PermissionPolicy,
    prepare: () => Promise<AttachmentPreview>): Promise<{ file: AttachmentSummary; replayed: boolean }> {
    return this.session(digest, "files:create", true, policy, async (client, actor) => {
      const existing = await client.query<AttachmentRow>(`SELECT ${this.columns} FROM attachments WHERE owner_id=$1 AND operation_id=$2`, [actor.id, candidate.operationId]);
      const previous = existing.rows[0];
      if (previous) {
        if (previous.sha256 !== candidate.sha256 || previous.name !== candidate.name || previous.media_type !== candidate.mediaType)
          throw new DomainError(409, "upload_key_conflict");
        return { file: this.summary(previous), replayed: true };
      }
      const used = await client.query<{ count: string; total: string }>(
        "SELECT count(*) AS count,COALESCE(sum(octet_length(original)+COALESCE(octet_length(preview),0)),0) AS total FROM attachments WHERE owner_id=$1", [actor.id]);
      const count = Number(used.rows[0]?.count), total = Number(used.rows[0]?.total);
      if (!Number.isSafeInteger(count) || !Number.isSafeInteger(total) || count >= AttachmentLimits.count || total + candidate.original.byteLength > AttachmentLimits.accountBytes)
        throw new DomainError(409, "file_quota_exceeded");
      const admitted = await client.query<{ admitted: boolean }>("SELECT pg_try_advisory_xact_lock(1398099277, 2) AS admitted");
      if (!admitted.rows[0]?.admitted) throw new DomainError(429, "file_processing_busy");
      const prepared = await prepare();
      if (total + candidate.original.byteLength + (prepared.data?.bytes.byteLength ?? 0) > AttachmentLimits.accountBytes)
        throw new DomainError(409, "file_quota_exceeded");
      await this.current(client, digest);
      const id = randomUUID();
      await client.query("INSERT INTO attachments(id,owner_id,operation_id,name,media_type,original,sha256,preview,preview_width,preview_height,original_only_reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [id, actor.id, candidate.operationId, candidate.name, candidate.mediaType, Buffer.from(candidate.original), candidate.sha256,
          prepared.data ? Buffer.from(prepared.data.bytes) : null, prepared.data?.width ?? null, prepared.data?.height ?? null, prepared.originalOnlyReason]);
      await this.audit.append(client, actor.id, "files:create", id, requestId);
      const result = await client.query<AttachmentRow>(`SELECT ${this.columns} FROM attachments WHERE id=$1`, [id]);
      const row = result.rows[0];
      if (!row) throw new DomainError(500, "storage_error");
      return { file: this.summary(row), replayed: false };
    });
  }
  deleteForSession(digest: string, id: string, requestId: string, policy: PermissionPolicy): Promise<void> {
    return this.session(digest, "files:delete", true, policy, async (client, actor) => {
      await this.current(client, digest);
      const result = await client.query("DELETE FROM attachments WHERE id=$1 AND owner_id=$2 RETURNING id", [id, actor.id]);
      if (!result.rows[0]) throw new DomainError(404, "not_found");
      await this.audit.append(client, actor.id, "files:delete", id, requestId);
    });
  }
}
