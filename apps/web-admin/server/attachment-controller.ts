// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { AttachmentLimits } from "../../../packages/contracts/attachments.js";
import { AttachmentApplicationService } from "../../../packages/application/attachments.js";
import { DomainError } from "../../../packages/core/index.js";
import { BoundedBody } from "./bounded-body.js";
export class AttachmentHttpController {
  constructor(private readonly application: AttachmentApplicationService, private readonly body: BoundedBody) {}
  async handle(request: Request, digest: string, requestId: string, headers: Headers): Promise<Response> {
    const url = new URL(request.url), method = request.method;
    if (url.search) throw new DomainError(422, "invalid_file_query");
    if (url.pathname === "/api/files") {
      if (method === "GET") return Response.json({ rows: await this.application.list(digest) }, { headers });
      if (method === "POST") {
        await this.application.authorizeUpload(digest);
        const length = request.headers.get("content-length");
        if (length && (!/^\d+$/.test(length) || Number(length) > AttachmentLimits.bytes)) throw new DomainError(413, "file_too_large");
        const encodedName = request.headers.get("x-summit-filename") ?? "";
        if (encodedName.length > 2048) throw new DomainError(422, "invalid_file_name");
        let name: string;
        try { name = decodeURIComponent(encodedName); } catch { throw new DomainError(422, "invalid_file_name"); }
        const result = await this.application.upload(digest, name, request.headers.get("content-type") ?? "",
          request.headers.get("idempotency-key") ?? "", await this.body.bytes(request.body), requestId);
        return Response.json({ file: result.file, replayed: result.replayed }, { status: result.replayed ? 200 : 201, headers });
      }
      throw new DomainError(405, "method_not_allowed");
    }
    const match = /^\/api\/files\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(\/preview)?$/i.exec(url.pathname);
    const id = match?.[1];
    if (!id) throw new DomainError(404, "not_found");
    if (method === "GET") {
      const file = await this.application.download(digest, id, !!match[2]);
      headers.set("Content-Type", file.contentType);
      headers.set("Content-Disposition", `${file.disposition}; filename="${file.filename}"`);
      return new Response(file.bytes, { headers });
    }
    if (method === "DELETE" && !match[2]) {
      await this.application.remove(digest, id, requestId);
      return Response.json({ ok: true }, { headers });
    }
    throw new DomainError(405, "method_not_allowed");
  }
}
