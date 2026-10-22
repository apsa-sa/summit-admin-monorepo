// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type { Draft } from '../contracts/index.js';
import { DraftAutosaveController,type DraftApi,type DraftView,type DraftScheduler } from '../../apps/web-admin/browser/draft-controller.js';
class ManualScheduler implements DraftScheduler {
  pending:(()=>void)|null=null;
  schedule(action:()=>void){this.pending=action;}cancel(){this.pending=null;}
}
class DraftPanel implements DraftView {
  value={name:'',organization:''};statuses:string[]=[];errors:unknown[]=[];locked=false;
  fields(){return {...this.value};}fill(draft:Draft){this.value={name:draft.name,organization:draft.organization};}
  disabled(value:boolean){this.locked=value;}status(value:string){this.statuses.push(value);}error(error:unknown){this.errors.push(error);}
}
class DeferredSaveApi implements DraftApi {
  loaded:Draft={name:'Initial',organization:'Org',version:0};
  saves:Draft[]=[];resolveSave:((draft:Draft)=>void)|null=null;rejectSave:((error:unknown)=>void)|null=null;
  async draft(){return {...this.loaded};}
  async saveDraft(draft:Draft):Promise<Draft>{this.saves.push(draft);return new Promise((resolve,reject)=>{this.resolveSave=resolve;this.rejectSave=reject;});}
}
class DraftLifecycleTests {
  register():void{
    test('Account switch cancels scheduled work and ignores old account responses',async()=>{
      const api=new DeferredSaveApi();const panel=new DraftPanel();const scheduler=new ManualScheduler();const controller=new DraftAutosaveController(api,panel,scheduler);
      controller.activate('account-a');await controller.load();panel.value.name='A private note';controller.changed();
      const pending=controller.save();controller.deactivate();api.loaded={name:'B name',organization:'B org',version:0};
      controller.activate('account-b');await controller.load();api.resolveSave?.({name:'A private note',organization:'Org',version:1});await pending;
      assert.equal(panel.value.name,'B name');assert.equal(scheduler.pending,null);
    });
    test('Changes during a save remain unsaved and next request uses acknowledged version',async()=>{
      const api=new DeferredSaveApi();const panel=new DraftPanel();const scheduler=new ManualScheduler();const controller=new DraftAutosaveController(api,panel,scheduler);
      controller.activate('account-a');await controller.load();panel.value.name='First';controller.changed();const pending=controller.save();
      panel.value.name='Second';controller.changed();api.resolveSave?.({name:'First',organization:'Org',version:1});await pending;
      assert.equal(panel.statuses.at(-1),'unsaved');assert.equal(panel.value.name,'Second');
      const second=controller.save();assert.equal(api.saves[1]?.version,1);assert.equal(api.saves[1]?.name,'Second');
      api.resolveSave?.({name:'Second',organization:'Org',version:2});await second;assert.equal(panel.statuses.at(-1),'saved');
    });
    test('Network failure preserves edits and requires explicit retry without a loop',async()=>{
      const api=new DeferredSaveApi();const panel=new DraftPanel();const scheduler=new ManualScheduler();const controller=new DraftAutosaveController(api,panel,scheduler);
      controller.activate('account-a');await controller.load();panel.value.name='Keep me';controller.changed();const pending=controller.save();
      api.rejectSave?.(new Error('offline'));await pending;assert.equal(panel.value.name,'Keep me');assert.equal(scheduler.pending,null);assert.equal(api.saves.length,1);
      const retry=controller.retry();assert.equal(api.saves.length,2);api.resolveSave?.({name:'Keep me',organization:'Org',version:1});await retry;
    });
    test('Version conflict preserves local fields until an explicit confirmed reload',async()=>{
      const api=new DeferredSaveApi();const panel=new DraftPanel();const controller=new DraftAutosaveController(api,panel,new ManualScheduler());
      controller.activate('account-a');await controller.load();panel.value.name='Local edit';controller.changed();const pending=controller.save();
      api.rejectSave?.({status:409});await pending;await controller.retry();assert.equal(api.saves.length,1);assert.equal(panel.value.name,'Local edit');
      api.loaded={name:'Remote edit',organization:'Remote',version:9};await controller.reloadConfirmed();assert.equal(panel.value.name,'Remote edit');
    });
  }
}
new DraftLifecycleTests().register();
