// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { WorkspaceController } from '../../apps/web-admin/presentation/controller.js';
import { WorkspaceStore } from '../../apps/web-admin/presentation/state.js';
import { DraftPresenter } from '../../apps/web-admin/presentation/draft-presenter.js';
import type { WorkspaceApi,WorkspaceNavigation } from '../../apps/web-admin/presentation/ports.js';
import { ApiFailure } from '../../apps/web-admin/browser/api.js';
import { DraftAutosaveController } from '../../apps/web-admin/browser/draft-controller.js';
import { AuthorizationPolicy } from '../core-rbac/index.js';
import type { User,UserPage,UserInput,Draft,AuditEvent } from '../contracts/index.js';
class Deferred<T> {
  readonly promise:Promise<T>;private complete:(value:T)=>void=()=>{};
  constructor(){this.promise=new Promise(resolve=>{this.complete=resolve;});}
  resolve(value:T):void{this.complete(value);}
}
class FakeWorkspaceApi implements WorkspaceApi {
  readonly user:User={id:randomUUID(),name:'Fixture',email:'fixture@example.test',role:'admin',status:'active',version:0,createdAt:new Date(0).toISOString()};
  readonly loads:Deferred<UserPage>[]=[];logoutError:Error|null=null;
  endSession():void{}
  async me():Promise<User>{return this.user;}
  async login():Promise<User>{return this.user;}
  async logout():Promise<void>{if(this.logoutError)throw this.logoutError;}
  users():Promise<UserPage>{const value=new Deferred<UserPage>();this.loads.push(value);return value.promise;}
  async createUser(_input:UserInput):Promise<User>{return this.user;}
  async updateUser(_id:string,_input:UserInput):Promise<User>{return this.user;}
  async deleteUser():Promise<void>{}
  async draft():Promise<Draft>{return {name:'',organization:'',version:0};}
  async saveDraft(draft:Draft):Promise<Draft>{return {...draft,version:draft.version+1};}
  async audit():Promise<AuditEvent[]>{return [];}
  exportUrl():string{return '/api/users/export';}
}
class WorkspaceControllerSuite {
  private setup(){
    const api=new FakeWorkspaceApi(),store=new WorkspaceStore('ar','light',api.user,()=>{});
    const presenter=new DraftPresenter(store,()=>api.endSession());
    const drafts=new DraftAutosaveController(api,presenter,{schedule:()=>{},cancel:()=>{}});
    const navigation:WorkspaceNavigation={read:()=>({view:'settings',query:store.snapshot.query}),write:()=>{},url:()=>'/'};
    const controller=new WorkspaceController(store,api,drafts,navigation,{apply:()=>{}},new AuthorizationPolicy());
    return {api,store,controller,presenter};
  }
  private page(user:User,page:number):UserPage{return {rows:[user],total:16,page,pageSize:8};}
  register():void{
    test('Next workspace retains only the latest server table response without React state timing assumptions',async()=>{
      const {api,store,controller}=this.setup();store.patch({view:'users'});
      const first=controller.load();controller.queryChanged({page:2});const second=controller.load();
      const newest=api.loads[1];assert.ok(newest);newest.resolve(this.page(api.user,2));await second;
      const oldest=api.loads[0];assert.ok(oldest);oldest.resolve(this.page(api.user,1));await first;
      assert.equal(store.snapshot.page?.page,2);assert.equal(store.snapshot.loading,false);
    });
    test('Logout clears account context and ignores a delayed prior-account response even when transport ignores cancellation',async()=>{
      const {api,store,controller}=this.setup();store.patch({view:'users',draft:{name:'Private A',organization:'Private A',version:1}});
      const old=controller.load();await controller.logout();
      const response=api.loads[0];assert.ok(response);response.resolve(this.page(api.user,1));await old;
      assert.equal(store.snapshot.user,null);assert.equal(store.snapshot.page,null);assert.equal(store.snapshot.draft.name,'');assert.equal(store.snapshot.query.search,'');assert.equal(store.snapshot.busy,false);
    });
    test('Draft session expiry advances the shared epoch so pending table results cannot repopulate the workspace',async()=>{
      const {api,store,controller,presenter}=this.setup();store.patch({view:'users'});const old=controller.load();
      presenter.error(new ApiFailure(401,'unauthenticated'));const response=api.loads[0];assert.ok(response);response.resolve(this.page(api.user,1));await old;
      assert.equal(store.snapshot.user,null);assert.equal(store.snapshot.page,null);assert.equal(store.snapshot.draftDisabled,true);assert.equal(store.snapshot.busy,false);
    });
    test('Failed server logout is explicit and retryable; it is never presented as confirmed logout',async()=>{
      const {api,store,controller}=this.setup();api.logoutError=new ApiFailure(0,'network_error');await controller.logout();
      assert.equal(store.snapshot.logoutFailed,true);assert.equal(store.snapshot.user,null);assert.equal(store.snapshot.error,true);assert.equal(store.snapshot.busy,false);
      api.logoutError=null;await controller.logout();assert.equal(store.snapshot.logoutFailed,false);assert.equal(store.snapshot.error,false);
    });
    test('Command destinations and client actions reflect policy while server authorization stays authoritative',()=>{
      const {api,store,controller}=this.setup();store.patch({user:{...api.user,role:'viewer'}});
      assert.equal(controller.destinations().includes('audit'),false);assert.equal(controller.can('users:create'),false);assert.equal(controller.can('users:export'),false);
      controller.navigate('audit');assert.equal(store.snapshot.view,'overview');
    });
  }
}
new WorkspaceControllerSuite().register();
