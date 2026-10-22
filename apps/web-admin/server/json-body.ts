// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { DomainError } from '../../../packages/core/index.js';
/** Bounded streaming reader: UTF-8 is decoded once, after byte boundaries are rejoined. */
export class JsonBody {
  readonly limit=16384;
  async bytes(stream:ReadableStream<Uint8Array>|null):Promise<Uint8Array> {
    if(!stream)return new Uint8Array();
    const reader=stream.getReader(); const chunks:Uint8Array[]=[];let size=0;
    try {
      while(true){const part=await reader.read();if(part.done)break;
        size+=part.value.byteLength;
        if(size>this.limit){await reader.cancel();throw new DomainError(413,'body_too_large');}
        chunks.push(part.value);
      }
    } finally {reader.releaseLock();}
    const result=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength;}
    return result;
  }
  async parse(request:Request):Promise<unknown> {
    const media=request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if(media!=='application/json')throw new DomainError(415,'json_required');
    const bytes=await this.bytes(request.body);
    try { const value:unknown=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));return value; }
    catch {throw new DomainError(400,'invalid_json');}
  }
}
