// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { BoundedBody } from "./bounded-body.js";
import { DomainError } from '../../../packages/core/index.js';
/** Bounded streaming reader: UTF-8 is decoded once, after byte boundaries are rejoined. */
export class JsonBody {
  readonly limit=16384;
  private readonly reader = new BoundedBody(this.limit);
  bytes(stream: ReadableStream<Uint8Array> | null): Promise<Uint8Array> { return this.reader.bytes(stream); }
  async parse(request:Request):Promise<unknown> {
    const media=request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if(media!=='application/json')throw new DomainError(415,'json_required');
    const bytes=await this.bytes(request.body);
    try { const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return value; }
    catch {throw new DomainError(400,'invalid_json');}
  }
}
