// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { AttachmentHttpController } from "./attachment-controller.js";
import { randomUUID } from 'node:crypto';
import type { HealthStore } from '../../../packages/contracts/ports.js';
import { DomainError } from '../../../packages/core/index.js';
import { AuthenticationService } from '../../../packages/application/authentication.js';
import { UserApplicationService } from '../../../packages/application/users.js';
import { DraftApplicationService } from '../../../packages/application/drafts.js';
import { AuditApplicationService } from '../../../packages/application/audit.js';
import { SafeLogger } from '../../../packages/observability/index.js';
import { SessionCookie } from './session-cookie.js';
import { JsonBody } from './json-body.js';
import type { TablePreferenceService } from '../../../packages/application/table-preferences.js';
export class AdminHttpController {
  constructor(private readonly auth:AuthenticationService,private readonly users:UserApplicationService,
    private readonly drafts:DraftApplicationService,private readonly audit:AuditApplicationService,
    private readonly health:HealthStore,private readonly cookie:SessionCookie,private readonly body:JsonBody,
    private readonly logger:SafeLogger,private readonly origin:string,private readonly tablePreferences:TablePreferenceService,private readonly attachments:AttachmentHttpController|null=null) {}
  private json(value:unknown,headers:Headers,status=200):Response {return Response.json(value,{status,headers});}
  async handle(request:Request,peer:string):Promise<Response> {
    const requestId=randomUUID(); const headers=new Headers({'X-Request-Id':requestId,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    try {
      const {pathname,searchParams}=new URL(request.url);const method=request.method;
      if(!['GET','POST','PUT','DELETE'].includes(method))throw new DomainError(405,'method_not_allowed');
      if(method!=='GET'&&request.headers.get('origin')!==this.origin)throw new DomainError(403,'invalid_origin');
      if(pathname==='/api/health'){
        if(method!=='GET')throw new DomainError(405,'method_not_allowed');
        await this.health.health();return this.json({status:'ok'},headers);
      }
      if(pathname==='/api/login'&&method==='POST'){
        const result=await this.auth.login(await this.body.parse(request),peer);
        headers.set('Set-Cookie',this.cookie.issue(result.token));return this.json({user:result.user},headers);
      }
      const digest=this.cookie.digest(request);
      if(pathname==='/api/logout'&&method==='POST'){
        // Revocation is idempotent even when a session expired; storage failure never reports success.
        await this.auth.logout(digest);headers.set('Set-Cookie',this.cookie.clear());return this.json({ok:true},headers);
      }
      // Authenticate unknown protected routes too; unauthenticated requests reveal no route details.
      await this.auth.authenticate(digest);
      if(pathname==='/api/files'||pathname.startsWith('/api/files/')){
        if(!this.attachments)throw new DomainError(404,'not_found');
        return await this.attachments.handle(request,digest,requestId,headers);
      }
      if(pathname==='/api/me'&&method==='GET')return this.json({user:await this.auth.me(digest)},headers);
      if(pathname==='/api/preferences/users'){
        if(method==='GET')return this.json(await this.tablePreferences.load(digest),headers);
        if(method==='PUT')return this.json(await this.tablePreferences.save(digest,await this.body.parse(request)),headers);
        throw new DomainError(405,'method_not_allowed');
      }
      if(pathname==='/api/draft'){
        if(method==='GET')return this.json(await this.drafts.load(digest),headers);
        if(method==='PUT')return this.json(await this.drafts.save(digest,await this.body.parse(request)),headers);
        throw new DomainError(405,'method_not_allowed');
      }
      if(pathname==='/api/users'&&method==='GET')return this.json(await this.users.list(digest,searchParams),headers);
      if(pathname==='/api/users/export'&&method==='GET'){
        const artifact=await this.users.download(digest,searchParams);
        headers.set('Content-Type',artifact.contentType);headers.set('Content-Disposition',`attachment; filename="${artifact.filename}"`);
        return new Response(artifact.body,{headers});
      }
      if(pathname==='/api/audit'&&method==='GET')return this.json({rows:await this.audit.list(digest)},headers);
      const match=/^\/api\/users\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/.exec(pathname);
      if(pathname==='/api/users'&&method==='POST')return this.json({user:await this.users.mutate(digest,null,await this.body.parse(request),'create',requestId)},headers,201);
      if(match&&(method==='PUT'||method==='DELETE'))return this.json({user:await this.users.mutate(digest,match[1]??null,method==='PUT'?await this.body.parse(request):null,method==='PUT'?'update':'delete',requestId)},headers);
      throw new DomainError(404,'not_found');
    } catch(error:unknown) {
      const failure=error instanceof DomainError?error:new DomainError(500,'internal_error');
      if(failure.status===500)this.logger.error(requestId,failure.code);
      return this.json({error:failure.code,requestId},headers,failure.status);
    }
  }
}
