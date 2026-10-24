// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { AttachmentLimits } from "../../../packages/contracts/attachments.js";
import { randomUUID } from 'node:crypto';
import { DomainError } from '../../../packages/core/index.js';
import { SafeLogger } from '../../../packages/observability/index.js';
import { AdminHttpController } from './http-controller.js';
import { PublicAssets } from './assets.js';
import { JsonBody } from './json-body.js';
/** Node transport only; no SQL, password handling or permission rules. */
export class NodeAdminServer {
  constructor(private readonly controller:AdminHttpController,private readonly assets:PublicAssets,
    private readonly body:JsonBody,private readonly logger:SafeLogger,private readonly origin:string) {}
  async handle(req:IncomingMessage,res:ServerResponse):Promise<void> {
    const requestId=randomUUID();
    res.setHeader('X-Request-Id',requestId);res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    try {
      const method=req.method??'GET';const url=new URL(req.url??'/',this.origin);
      let response:Response;
      if(url.pathname.startsWith('/api/')){
        const headers=new Headers();for(const [key,value] of Object.entries(req.headers))if(value!==undefined){for(const item of Array.isArray(value)?value:[value])headers.append(key,item);}
        const init:RequestInit={method,headers};
        if(method!=='GET'&&method!=='HEAD'){
          const chunks:Buffer[]=[];let size=0;
          for await(const raw of req){
            const chunk:unknown=raw;
            if(!Buffer.isBuffer(chunk))throw new DomainError(400,'invalid_input');
            size+=chunk.byteLength;if(size>(method==='POST'&&url.pathname==='/api/files'?AttachmentLimits.bytes:this.body.limit))throw new DomainError(413,'body_too_large');
            chunks.push(chunk);
          }
          const bytes=Buffer.concat(chunks);
          // Copy to an owned ArrayBuffer accepted by Fetch; preserve split multibyte text.
          const buffer=new ArrayBuffer(bytes.length);new Uint8Array(buffer).set(bytes);init.body=buffer;
        }
        response=await this.controller.handle(new Request(url,init),req.socket.remoteAddress??'unknown');
      } else {
        if(method!=='GET')throw new DomainError(405,'method_not_allowed');
        response=await this.assets.read(url.pathname);
      }
      response.headers.forEach((value,key)=>res.setHeader(key,value));res.writeHead(response.status);
      res.end(Buffer.from(await response.arrayBuffer()));
    }catch(error:unknown){
      const failure=error instanceof DomainError?error:new DomainError(500,'internal_error');
      if(failure.status===500)this.logger.error(requestId,failure.code);
      res.writeHead(failure.status,{'Content-Type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({error:failure.code,requestId}));
    }
  }
  start(port:number):Server {return createServer(this.handle.bind(this)).listen(port,'127.0.0.1');}
}
