// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Draft } from '../../../packages/contracts/index.js';
export interface DraftApi { draft():Promise<Draft>;saveDraft(draft:Draft):Promise<Draft>; }
export interface DraftView {
  fields():{name:string;organization:string};
  fill(draft:Draft):void;disabled(value:boolean):void;
  status(value:'loading'|'saved'|'unsaved'|'saving'):void;
  error(error:unknown):void;
}
export interface DraftScheduler {schedule(action:()=>void):void;cancel():void;}
export class BrowserDraftScheduler implements DraftScheduler {
  private timer:ReturnType<typeof setTimeout>|null=null;
  constructor(private readonly delay=600){}
  schedule(action:()=>void):void{this.cancel();this.timer=setTimeout(()=>{this.timer=null;action();},this.delay);}
  cancel():void{if(this.timer){clearTimeout(this.timer);this.timer=null;}}
}
/** One controller per workspace; generation invalidates every previous account callback. */
export class DraftAutosaveController {
  private owner:string|null=null;private generation=0;private revision=0;private loadSequence=0;
  private draft:Draft|null=null;private saving=false;private dirty=false;private conflict=false;
  constructor(private readonly api:DraftApi,private readonly view:DraftView,private readonly scheduler:DraftScheduler){}
  activate(owner:string):void{if(this.owner===owner)return;this.deactivate();this.owner=owner;}
  deactivate():void{this.scheduler.cancel();this.generation++;this.owner=null;this.draft=null;this.saving=false;this.dirty=false;this.conflict=false;this.revision=0;}
  async load():Promise<void>{
    if(!this.owner||this.dirty||this.saving)return;
    const generation=this.generation;const sequence=++this.loadSequence;this.view.disabled(true);this.view.status('loading');
    try{const draft=await this.api.draft();if(generation!==this.generation||sequence!==this.loadSequence)return;
      this.draft=draft;this.conflict=false;this.view.fill(draft);this.view.status('saved');
    }catch(error:unknown){if(generation===this.generation&&sequence===this.loadSequence)this.view.error(error);}
    finally{if(generation===this.generation&&sequence===this.loadSequence)this.view.disabled(this.draft===null);}
  }
  changed():void{
    if(!this.owner||!this.draft)return;this.revision++;this.dirty=true;this.view.status('unsaved');
    this.scheduler.schedule(()=>{void this.save();});
  }
  async retry():Promise<void>{if(this.conflict)return;if(!this.draft)await this.load();else await this.save();}
  async reloadConfirmed():Promise<void>{if(this.saving)return;this.scheduler.cancel();this.dirty=false;this.conflict=false;await this.load();}
  async save():Promise<void>{
    if(!this.owner||!this.draft||this.conflict||this.saving||!this.dirty)return;
    this.scheduler.cancel();const generation=this.generation;const revision=this.revision;
    const fields=this.view.fields();const value={...fields,version:this.draft.version};
    this.saving=true;this.view.status('saving');
    let success=false;
    try{
      const saved=await this.api.saveDraft(value);if(generation!==this.generation)return;
      this.draft=saved;success=true;this.dirty=this.revision!==revision;
      this.view.status(this.dirty?'unsaved':'saved');
    }catch(error:unknown){if(generation!==this.generation)return;
      this.conflict=typeof error==='object'&&error!==null&&'status' in error&&error.status===409;
      this.view.error(error); // Preserve current fields; explicit reload is required after conflict.
    }finally{
      if(generation===this.generation){this.saving=false;if(success&&this.dirty)this.scheduler.schedule(()=>{void this.save();});}
    }
  }
}
