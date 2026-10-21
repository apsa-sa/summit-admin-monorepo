// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { PostgresRepository } from '../../../packages/data-access/index.js';
import { AuthorizationPolicy } from '../../../packages/core-rbac/index.js';
import { Validation, DomainError } from '../../../packages/core/index.js';
import { PasswordHasher, SessionToken, RateLimiter } from '../../../packages/security/index.js';
import { SessionService } from '../../../packages/auth/index.js';
import { CsvExporter } from '../../../packages/exports/index.js';
import { SafeLogger } from '../../../packages/observability/index.js';
export class AdminServer {
 private readonly repository:PostgresRepository; private readonly policy=new AuthorizationPolicy(); private readonly tokens=new SessionToken(); private readonly limiter=new RateLimiter();private readonly logger=new SafeLogger();private readonly origin:string;
 constructor(){const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is required');this.repository=new PostgresRepository(url);this.origin=process.env.APP_ORIGIN??'http://localhost:3210';}
 private respond(res:ServerResponse,status:number,data:unknown):void {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));}
 private async body(req:IncomingMessage):Promise<unknown>{if(!req.headers['content-type']?.startsWith('application/json'))throw new DomainError(415,'json_required');let body='';for await(const chunk of req){body+=String(chunk);if(Buffer.byteLength(body)>16384)throw new DomainError(413,'body_too_large');}try{const parsed:unknown=JSON.parse(body);return parsed;}catch{throw new DomainError(400,'invalid_json');}}
 private digest(req:IncomingMessage):string {const cookie=req.headers.cookie?.split(';').map(v=>v.trim()).find(v=>v.startsWith('summit_session='));return this.tokens.digest(cookie?.slice('summit_session='.length)??'');}
 private cookie(token:string,clear=false):string{return `summit_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear?0:28800}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
 async handle(req:IncomingMessage,res:ServerResponse):Promise<void>{const requestId=randomUUID();res.setHeader('X-Request-Id',requestId);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
 try{const url=new URL(req.url??'/',this.origin);const method=req.method??'GET';
 if(!['GET','POST','PUT','DELETE'].includes(method))throw new DomainError(405,'method_not_allowed');
 if(method!=='GET'&&req.headers.origin!==this.origin)throw new DomainError(403,'invalid_origin');
 if(url.pathname==='/api/health'){await this.repository.pool.query('SELECT 1');this.respond(res,200,{status:'ok'});return;}
 if(!url.pathname.startsWith('/api/')){if(method!=='GET')throw new DomainError(405,'method_not_allowed');const files:Record<string,[string,string]>={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};const file=files[url.pathname];if(!file)throw new DomainError(404,'not_found');const bytes=await readFile(new URL('../public/'+file[0],import.meta.url));res.writeHead(200,{'Content-Type':file[1]});res.end(bytes);return;}
 if(url.pathname==='/api/login'&&method==='POST'){this.limiter.check(req.socket.remoteAddress??'unknown');const input=Validation.record(await this.body(req));const email=Validation.text(input.email,254).toLowerCase();const password=Validation.text(input.password,128);const found=await this.repository.credentials(email);const hasher=new PasswordHasher();const dummy='00000000000000000000000000000000:'+ '0'.repeat(128);if(!hasher.verify(password,found?.hash??dummy)||!found)throw new DomainError(401,'invalid_credentials');const token=this.tokens.create();await this.repository.session(this.tokens.digest(token),found.user.id);res.setHeader('Set-Cookie',this.cookie(token));this.respond(res,200,{user:found.user});return;}
 const digest=this.digest(req);const actor=await new SessionService(this.repository).authenticate(digest);
 if(url.pathname==='/api/logout'&&method==='POST'){await this.repository.logout(digest);res.setHeader('Set-Cookie',this.cookie('',true));this.respond(res,200,{ok:true});return;}
 if(url.pathname==='/api/me'&&method==='GET'){this.respond(res,200,{user:await this.repository.self(actor.id)});return;}
 if(url.pathname==='/api/draft'){this.policy.require(actor,'draft:write');if(method==='GET')this.respond(res,200,await this.repository.getDraft(actor.id));else if(method==='PUT')this.respond(res,200,await this.repository.saveDraft(actor.id,Validation.draft(await this.body(req))));else throw new DomainError(405,'method_not_allowed');return;}
 if(url.pathname==='/api/users'&&method==='GET'){this.policy.require(actor,'users:read');this.respond(res,200,await this.repository.list(Validation.query(url.searchParams)));return;}
 if(url.pathname==='/api/users/export'&&method==='GET'){this.policy.require(actor,'users:export');const data=await this.repository.list(Validation.query(url.searchParams),true);res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="summit-users.csv"'});res.end(new CsvExporter().render(data.rows,url.searchParams.get('locale')??'ar'));return;}
 if(url.pathname==='/api/audit'&&method==='GET'){this.policy.require(actor,'audit:read');this.respond(res,200,{rows:await this.repository.events()});return;}
 const match=/^\/api\/users\/([0-9a-f-]{36})$/.exec(url.pathname);if((url.pathname==='/api/users'&&method==='POST')||(match&&(method==='PUT'||method==='DELETE'))){this.policy.require(actor,method==='POST'?'users:create':method==='PUT'?'users:update':'users:delete');this.respond(res,method==='POST'?201:200,{user:await this.repository.mutate(actor,match?.[1]??null,method==='DELETE'?null:Validation.user(await this.body(req)),requestId,this.policy)});return;}
 throw new DomainError(404,'not_found');
 }catch(error:unknown){const domain=error instanceof DomainError?error:new DomainError(500,'internal_error');if(domain.status===500)this.logger.error(requestId,domain.code);this.respond(res,domain.status,{error:domain.code,requestId});}}
 start():void{const port=Validation.integer(Number(process.env.PORT??3210),1024,65535);createServer(this.handle.bind(this)).listen(port,'127.0.0.1',()=>console.log(`Summit local: http://localhost:${port}`));}
}
new AdminServer().start();
