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
import { TablePreferenceController } from '../../apps/web-admin/presentation/table-preferences.js';
import { TablePreferenceValidation } from '../core/table-preferences.js';
import type { UserTablePreferences } from '../contracts/table-preferences.js';
import { BulkUserController } from "../../apps/web-admin/presentation/bulk-users.js";
class Deferred<T> {
  readonly promise:Promise<T>;private complete:(value:T)=>void=()=>{};
  constructor(){this.promise=new Promise(resolve=>{this.complete=resolve;});}
  resolve(value:T):void{this.complete(value);}
}
class FakeWorkspaceApi implements WorkspaceApi {
  readonly user:User={id:randomUUID(),name:'Fixture',email:'fixture@example.test',role:'admin',status:'active',version:0,createdAt:new Date(0).toISOString()};
  readonly loads:Deferred<UserPage>[]=[];logoutError:Error|null=null;logoutPending:Promise<void>|null=null;
  preferenceLoad:Promise<UserTablePreferences>|null=null;preferenceError:ApiFailure|null=null;preferenceWrites=0;
  endSession():void{}
  async me():Promise<User>{return this.user;}
  async login():Promise<User>{return this.user;}
  async logout():Promise<void>{if(this.logoutError)throw this.logoutError;if(this.logoutPending)await this.logoutPending;}
  users():Promise<UserPage>{const value=new Deferred<UserPage>();this.loads.push(value);return value.promise;}
  async createUser(_input:UserInput):Promise<User>{return this.user;}
  async updateUser(_id:string,input:UserInput):Promise<User>{return {...this.user,...input,version:input.version+1};}
  async deleteUser():Promise<void>{}
  async draft():Promise<Draft>{return {name:'',organization:'',version:0};}
  async saveDraft(draft:Draft):Promise<Draft>{return {...draft,version:draft.version+1};}
  async tablePreferences():Promise<UserTablePreferences>{return this.preferenceLoad??new TablePreferenceValidation().defaults();}
  async saveTablePreferences(value:UserTablePreferences):Promise<UserTablePreferences>{this.preferenceWrites++;if(this.preferenceError)throw this.preferenceError;return {...value,version:value.version+1};}
  async audit():Promise<AuditEvent[]>{return [];}
  exportUrl():string{return '/api/users/export';}
}
class WorkspaceControllerSuite {
  private setup(){
    const api=new FakeWorkspaceApi(),store=new WorkspaceStore('ar','light',api.user,()=>{});
    const presenter=new DraftPresenter(store,()=>api.endSession());
    const drafts=new DraftAutosaveController(api,presenter,{schedule:()=>{},cancel:()=>{}});
    const navigation:WorkspaceNavigation={read:()=>({view:'settings',query:store.snapshot.query}),write:()=>{},url:()=>'/'};
    const controller=new WorkspaceController(store,api,drafts,navigation,{apply:()=>{}},new AuthorizationPolicy(),new TablePreferenceController(store,api,drafts),new BulkUserController(store,api,drafts,new AuthorizationPolicy()));
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
    test('Pending logout hides private data immediately but remains busy until the server acknowledges',async()=>{
      const {api,store,controller}=this.setup(),pending=new Deferred<void>();api.logoutPending=pending.promise;
      store.patch({draft:{name:'Private draft',organization:'Private organization',version:1}});
      const logout=controller.logout();assert.equal(store.snapshot.user,null);assert.equal(store.snapshot.draft.name,'');assert.equal(store.snapshot.busy,true);
      pending.resolve();await logout;assert.equal(store.snapshot.busy,false);assert.equal(store.snapshot.logoutFailed,false);
    });
    test('Failed server logout is explicit and retryable; it is never presented as confirmed logout',async()=>{
      const {api,store,controller}=this.setup();api.logoutError=new ApiFailure(0,'network_error');await controller.logout();
      assert.equal(store.snapshot.logoutFailed,true);assert.equal(store.snapshot.user,null);assert.equal(store.snapshot.error,true);assert.equal(store.snapshot.busy,false);
      api.logoutError=null;await controller.logout();assert.equal(store.snapshot.logoutFailed,false);assert.equal(store.snapshot.error,false);
    });
    test('Delayed preference load cannot restore private account filters after logout',async()=>{
      const {api,store,controller}=this.setup(),pending=new Deferred<UserTablePreferences>();api.preferenceLoad=pending.promise;
      const load=controller.table.load();await controller.logout();
      pending.resolve({...new TablePreferenceValidation().defaults(),query:{search:'Private A',role:'',status:'',page:3,sort:'name'},columns:['name']});
      assert.equal(await load,false);assert.equal(store.snapshot.query.search,'');assert.equal(store.snapshot.tableReady,false);assert.equal(store.snapshot.tableBusy,false);
    });
    test('Repeated preference reload while busy leaves the original operation live and clears its busy state',async()=>{
      const {api,store,controller}=this.setup(),pending=new Deferred<UserTablePreferences>();api.preferenceLoad=pending.promise;
      const first=controller.table.load();assert.equal(await controller.table.load(),false);
      pending.resolve(new TablePreferenceValidation().defaults());assert.equal(await first,true);
      assert.equal(store.snapshot.tableBusy,false);assert.equal(store.snapshot.tableReady,true);
    });
    test('Preference conflict preserves edits and blocks overwrite until explicit server reload',async()=>{
      const {api,store,controller}=this.setup();await controller.table.load();controller.table.toggle('email',false);
      store.patch({query:{...store.snapshot.query,search:'Local search'}});api.preferenceError=new ApiFailure(409,'version_conflict');
      await controller.table.save();assert.equal(store.snapshot.tableReady,false);assert.equal(store.snapshot.tableError,true);
      assert.equal(store.snapshot.query.search,'Local search');assert.equal(store.snapshot.tablePreferences.columns.includes('email'),false);
      await controller.table.save();assert.equal(api.preferenceWrites,1);
      api.preferenceError=null;assert.equal(await controller.table.load(),true);assert.equal(store.snapshot.query.search,'');assert.equal(store.snapshot.tablePreferences.columns.includes('email'),true);
    });
    test('Network failure preserves table edits, exposes retry and confirms success only after storage responds',async()=>{
      const {api,store,controller}=this.setup();await controller.table.load();controller.table.toggle('role',false);controller.table.toggle('name',false);
      assert.equal(store.snapshot.tablePreferences.columns.includes('name'),true);
      api.preferenceError=new ApiFailure(0,'network_error');await controller.table.save();
      assert.equal(store.snapshot.tablePreferences.version,0);assert.equal(store.snapshot.tableError,true);assert.equal(store.snapshot.tableBusy,false);assert.equal(store.snapshot.tableReady,true);
      api.preferenceError=null;await controller.table.save();assert.equal(store.snapshot.tablePreferences.version,1);assert.equal(store.snapshot.tableError,false);assert.equal(store.snapshot.tablePreferences.columns.includes('role'),false);
    });
    test('Preference session expiry invalidates shared pending table responses',async()=>{
      const {api,store,controller}=this.setup();store.patch({view:'users'});const old=controller.load();
      await controller.table.load();api.preferenceError=new ApiFailure(401,'unauthenticated');await controller.table.save();
      const response=api.loads[0];assert.ok(response);response.resolve(this.page(api.user,1));await old;
      assert.equal(store.snapshot.user,null);assert.equal(store.snapshot.page,null);assert.equal(store.snapshot.tableReady,false);
    });
    test('Confirmed self-profile edits update account DTO; capabilities come from the same policy and clear on logout',async()=>{
      const {api,store,controller}=this.setup();store.patch({view:'settings'});const updated={name:'Confirmed profile',email:api.user.email,role:api.user.role,status:api.user.status,version:api.user.version};
      assert.deepEqual(controller.availableActions(),new AuthorizationPolicy().actionsFor(api.user));
      await controller.saveUser(updated,api.user.id);assert.equal(store.snapshot.user?.name,'Confirmed profile');assert.equal(store.snapshot.user?.version,1);
      await controller.logout();assert.deepEqual(controller.availableActions(),[]);
    });
    test('Command destinations and client actions reflect policy while server authorization stays authoritative',()=>{
      const {api,store,controller}=this.setup();store.patch({user:{...api.user,role:'viewer'}});
      assert.equal(controller.destinations().includes('audit'),false);assert.equal(controller.can('users:create'),false);assert.equal(controller.can('users:export'),false);
      controller.navigate('audit');assert.equal(store.snapshot.view,'overview');
    });
  }
}
new WorkspaceControllerSuite().register();
