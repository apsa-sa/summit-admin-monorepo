// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type { AuditEvent,Draft,User,UserInput,UserPage } from '../../../packages/contracts/index.js';
import { ResponseContracts } from '../../../packages/contracts/decoders.js';
export class ApiFailure extends Error {constructor(readonly status:number,readonly code:string){super(code);}}
export class AdminApiClient {
  private readonly contracts=new ResponseContracts();
  private scope=new AbortController();
  endSession():void{this.scope.abort();this.scope=new AbortController();}
  constructor(private readonly base='',private readonly transport:typeof fetch=fetch){}
  private async request<T>(path:string,decode:(value:unknown)=>T,init:RequestInit={}):Promise<T>{
    let response:Response;
    // Native browser fetch requires its global receiver; storing it as a class
    // field must not turn the API client into the receiver (Illegal invocation).
    try{response=await this.transport.call(globalThis,`${this.base}${path}`,{...init,signal:this.scope.signal,credentials:'same-origin',headers:{...(init.body?{'Content-Type':'application/json'}:{}),...init.headers}});}
    catch{throw new ApiFailure(0,'network_error');}
    if(!response.ok){
      const payload:unknown=await response.json().catch(()=>null);
      const code=payload&&typeof payload==='object'&&'error' in payload&&typeof payload.error==='string'?payload.error:'request_failed';
      throw new ApiFailure(response.status,code);
    }
    try{const value:unknown=await response.json();return decode(value);}
    catch{throw new ApiFailure(response.status,'invalid_response');}
  }
  async login(email:string,password:string):Promise<User>{return this.request('/api/login',value=>this.contracts.userEnvelope(value),{method:'POST',body:JSON.stringify({email,password})});}
  me():Promise<User>{return this.request('/api/me',value=>this.contracts.userEnvelope(value));}
  logout():Promise<void>{return this.request('/api/logout',value=>this.contracts.ok(value),{method:'POST'});}
  users(page:number,search:string,role='',status=''):Promise<UserPage>{
    return this.request(`/api/users?${new URLSearchParams({page:String(page),search,role,status})}`,value=>this.contracts.page(value));
  }
  createUser(input:UserInput):Promise<User>{return this.request('/api/users',value=>this.contracts.userEnvelope(value),{method:'POST',body:JSON.stringify(input)});}
  updateUser(id:string,input:UserInput):Promise<User>{return this.request(`/api/users/${encodeURIComponent(id)}`,value=>this.contracts.userEnvelope(value),{method:'PUT',body:JSON.stringify(input)});}
  deleteUser(id:string):Promise<void>{return this.request(`/api/users/${encodeURIComponent(id)}`,value=>this.contracts.deleted(value),{method:'DELETE'});}
  draft():Promise<Draft>{return this.request('/api/draft',value=>this.contracts.draft(value));}
  saveDraft(draft:Draft):Promise<Draft>{return this.request('/api/draft',value=>this.contracts.draft(value),{method:'PUT',body:JSON.stringify(draft)});}
  audit():Promise<AuditEvent[]>{return this.request('/api/audit',value=>this.contracts.audit(value));}
  exportUrl(locale:'ar'|'en',search:string,role:string,status:string):string{return `${this.base}/api/users/export?${new URLSearchParams({locale,search,role,status})}`;}
}
