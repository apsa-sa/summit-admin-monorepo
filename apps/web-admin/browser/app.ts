// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type {User, UserInput, UserPage, Role, Status} from '../../../packages/contracts/index.js';
import {AdminApiClient, ApiFailure} from './api.js';
import {Localizer, type TranslationKey} from './localization.js';
import {DraftAutosaveController,BrowserDraftScheduler} from './draft-controller.js';

class Dom {
  byId<T extends HTMLElement>(id:string):T {
    const element=document.getElementById(id);
    if(!element)throw new Error(`Missing element: ${id}`);
    return element as T;
  }
  show(id:string,visible:boolean):void {this.byId(id).hidden=!visible;}
  text(id:string,value:string):void {this.byId(id).textContent=value;}
  node(tag:string,text:string,className=''):HTMLElement {const element=document.createElement(tag);element.textContent=text;element.className=className;return element;}
}

class AdminApplication {
  private currentUser:User|null=null;
  private page:UserPage|null=null;
  private selected:User|null=null;
  private filterPage=1;
  private userLoadSequence=0;
  private readonly dom=new Dom();
  private activeTab:'users'|'drafts'|'audit'='users';
  private readonly drafts:DraftAutosaveController;
  private sessionGeneration=0;

  constructor(private readonly api:AdminApiClient,private readonly lang:Localizer){
    this.drafts=new DraftAutosaveController(api,{
      fields:()=>({name:this.dom.byId<HTMLInputElement>('draft-name').value,organization:this.dom.byId<HTMLInputElement>('draft-organization').value}),
      fill:draft=>{this.dom.byId<HTMLInputElement>('draft-name').value=draft.name;this.dom.byId<HTMLInputElement>('draft-organization').value=draft.organization;},
      disabled:value=>{this.dom.byId<HTMLInputElement>('draft-name').disabled=value;this.dom.byId<HTMLInputElement>('draft-organization').disabled=value;},
      status:value=>this.dom.text('draft-status',this.lang.t(value)),
      error:error=>this.dom.text('draft-status',this.message(error)),
    },new BrowserDraftScheduler());
  }

  async mount():Promise<void>{
    this.bind();this.lang.apply();this.setTheme('dark');
    try{this.currentUser=await this.api.me();this.enter();}catch(error:unknown){
      if(error instanceof ApiFailure && error.status!==401)this.notify(error);
      this.loginScreen();
    }finally{this.dom.byId<HTMLButtonElement>('login-submit').disabled=false;}
  }

  private bind():void{
    this.dom.byId<HTMLFormElement>('login-form').addEventListener('submit',event=>{
      event.preventDefault();void this.login();
    });
    this.dom.byId('signout-button').addEventListener('click',()=>{void this.logout();});
    for(const id of ['language-button','auth-language'])this.dom.byId(id).addEventListener('click',()=>{
      this.lang.set(this.lang.current==='ar'?'en':'ar');this.lang.apply();this.render();
    });
    for(const id of ['theme-button','auth-theme'])this.dom.byId(id).addEventListener('click',()=>{
      this.setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
    });
    this.dom.byId('nav-users').addEventListener('click',()=>this.navigate('users'));
    this.dom.byId('nav-drafts').addEventListener('click',()=>this.navigate('drafts'));
    this.dom.byId('nav-audit').addEventListener('click',()=>this.navigate('audit'));
    this.dom.byId<HTMLInputElement>('search').addEventListener('input',()=>{this.filterPage=1;void this.loadUsers();});
    this.dom.byId('filter-role').addEventListener('change',()=>{this.filterPage=1;void this.loadUsers();});
    this.dom.byId('filter-status').addEventListener('change',()=>{this.filterPage=1;void this.loadUsers();});
    this.dom.byId('previous').addEventListener('click',()=>{this.filterPage=Math.max(1,this.filterPage-1);void this.loadUsers();});
    this.dom.byId('next').addEventListener('click',()=>{this.filterPage++;void this.loadUsers();});
    this.dom.byId('add-user').addEventListener('click',()=>this.edit(null));
    this.dom.byId('export-button').addEventListener('click',()=>this.exportUsers());
    this.dom.byId<HTMLFormElement>('user-form').addEventListener('submit',event=>{event.preventDefault();void this.saveUser();});
    this.dom.byId('delete-user').addEventListener('click',()=>{void this.deleteUser();});
    this.dom.byId('cancel-user').addEventListener('click',()=>this.dom.byId<HTMLDialogElement>('user-dialog').close());
    this.dom.byId('draft-name').addEventListener('input',()=>this.drafts.changed());
    this.dom.byId('draft-organization').addEventListener('input',()=>this.drafts.changed());
    this.dom.byId('draft-retry').addEventListener('click',()=>{void this.drafts.retry();});
    this.dom.byId('draft-reload').addEventListener('click',()=>{if(window.confirm(this.lang.t('confirmReload')))void this.drafts.reloadConfirmed();});
    window.addEventListener('popstate',()=>{const hash=location.hash.replace('#','');if(hash==='users'||hash==='drafts'||hash==='audit')this.navigate(hash,false);});
  }

  private setTheme(value:'dark'|'light'):void{document.documentElement.dataset.theme=value;this.dom.byId('theme-button').setAttribute('aria-label',this.lang.t('theme'));}
  private loginScreen():void{
    this.sessionGeneration++;this.userLoadSequence++;this.api.endSession();this.drafts.deactivate();
    this.page=null;this.selected=null;this.filterPage=1;
    this.dom.byId<HTMLDialogElement>('user-dialog').close();
    this.dom.byId('users-body').replaceChildren();this.dom.byId('audit-body').replaceChildren();
    this.dom.byId<HTMLInputElement>('search').value='';
    this.dom.byId<HTMLSelectElement>('filter-role').value='';this.dom.byId<HTMLSelectElement>('filter-status').value='';
    this.dom.text('record-total','—');this.dom.text('actor-name','');this.dom.text('actor-role','');
    this.dom.byId<HTMLInputElement>('draft-name').value='';this.dom.byId<HTMLInputElement>('draft-organization').value='';
    this.currentUser=null;
    this.dom.show('login-screen',true);this.dom.show('workspace',false);
    this.dom.byId<HTMLInputElement>('password').value='';
  }
  private async login():Promise<void>{
    const submit=this.dom.byId<HTMLButtonElement>('login-submit');submit.disabled=true;
    try{
      this.currentUser=await this.api.login(this.dom.byId<HTMLInputElement>('email').value,this.dom.byId<HTMLInputElement>('password').value);
      this.dom.byId<HTMLInputElement>('password').value='';
      this.dom.text('login-error','');this.enter();
    }catch(error:unknown){this.dom.text('login-error',this.message(error));}
    finally{submit.disabled=false;}
  }
  private async logout():Promise<void>{
    try{await this.api.logout();this.loginScreen();}
    catch(error:unknown){this.notify(error);this.dom.text('flash',this.lang.t('confirmLogout'));}
  }
  private enter():void{
    this.dom.show('login-screen',false);this.dom.show('workspace',true);
    this.sessionGeneration++;if(this.currentUser)this.drafts.activate(this.currentUser.id);
    this.dom.text('actor-name',this.currentUser?.name??'');
    this.dom.text('actor-role',this.currentUser?this.lang.t(this.currentUser.role):'');
    this.dom.show('add-user',this.currentUser?.role==='admin');
    this.dom.show('export-button',this.currentUser?.role!=='viewer');
    this.dom.show('nav-audit',this.currentUser?.role==='admin');
    const hash=location.hash.replace('#','');
    this.navigate(hash==='drafts'||(hash==='audit'&&this.currentUser?.role==='admin')?hash:'users');
  }
  private navigate(tab:'users'|'drafts'|'audit',push=true):void{
    if(tab==='audit'&&this.currentUser?.role!=='admin')return;
    this.activeTab=tab;
    for(const name of ['users','drafts','audit'] as const){
      this.dom.show(`panel-${name}`,name===tab);
      this.dom.byId(`nav-${name}`).setAttribute('aria-current',tab===name?'page':'false');
    }
    if(push&&location.hash!==`#${tab}`)history.pushState(null,'',`#${tab}`);
    this.dom.text('page-title',this.lang.t(tab));
    if(tab==='users')void this.loadUsers();
    if(tab==='drafts')void this.drafts.load();
    if(tab==='audit')void this.loadAudit();
  }
  private message(error:unknown):string{
    if(error instanceof ApiFailure){
      if(error.status===401&&error.code!=='invalid_credentials')this.loginScreen();
      const key=error.code as TranslationKey;
      return key in Localizer.ar?this.lang.t(key):`${this.lang.t('request_failed')} (${error.code})`;
    }
    return this.lang.t('request_failed');
  }
  private notify(error:unknown):void {this.dom.text('flash',this.message(error));}
  private render():void{
    if(!this.currentUser)return;
    this.dom.text('actor-role',this.lang.t(this.currentUser.role));
    this.dom.text('page-title',this.lang.t(this.activeTab));
    if(this.activeTab==='users'&&this.page)this.renderUsers(this.page);
    if(this.activeTab==='audit')void this.loadAudit();
  }
  private async loadUsers():Promise<void>{
    if(!this.currentUser)return;
    const sequence=++this.userLoadSequence;
    this.dom.text('table-status',this.lang.t('loading'));
    try{
      const data=await this.api.users(this.filterPage,this.dom.byId<HTMLInputElement>('search').value,
        this.dom.byId<HTMLSelectElement>('filter-role').value,this.dom.byId<HTMLSelectElement>('filter-status').value);
      if(sequence!==this.userLoadSequence || this.activeTab!=='users')return;
      this.page=data;this.renderUsers(data);this.dom.text('table-status','');
    }catch(error:unknown){if(sequence===this.userLoadSequence)this.dom.text('table-status',this.message(error));}
  }
  private renderUsers(data:UserPage):void{
    const rows=this.dom.byId('users-body');rows.replaceChildren();
    const me=this.currentUser;
    for(const user of data.rows){
      const tr=document.createElement('tr');
      const identity=document.createElement('td');
      identity.append(this.dom.node('strong',user.name),this.dom.node('small',user.email,'cell-subtitle'));
      tr.append(identity,this.dom.node('td',this.lang.t(user.role)),this.dom.node('td',this.lang.t(user.status)));
      const actions=document.createElement('td');
      if(me && (me.role==='admin'||(me.role==='editor'&&user.role!=='admin'))){
        const button=this.dom.node('button',this.lang.t('edit'),'table-action');
        button.setAttribute('type','button');button.addEventListener('click',()=>this.edit(user));actions.append(button);
      }
      tr.append(actions);rows.append(tr);
    }
    if(!data.rows.length){const tr=document.createElement('tr');const td=this.dom.node('td',this.lang.t('noResults'),'empty-row');td.setAttribute('colspan','4');tr.append(td);rows.append(tr);}
    this.dom.text('record-total',String(data.total));
    this.dom.text('page-number',`${this.lang.t('page')} ${data.page}`);
    this.dom.byId<HTMLButtonElement>('previous').disabled=data.page<=1;
    this.dom.byId<HTMLButtonElement>('next').disabled=data.page*data.pageSize>=data.total;
  }
  private edit(user:User|null):void{
    this.selected=user;
    const input=this.dom.byId<HTMLFormElement>('user-form');input.reset();
    this.dom.byId<HTMLInputElement>('user-name').value=user?.name??'';
    this.dom.byId<HTMLInputElement>('user-email').value=user?.email??'';
    this.dom.byId<HTMLSelectElement>('user-role').value=user?.role??'viewer';
    this.dom.byId<HTMLSelectElement>('user-status').value=user?.status??'active';
    this.dom.text('form-status','');this.dom.byId<HTMLButtonElement>('save-user').disabled=false;
    this.dom.text('modal-title',user?this.lang.t('editUser'):this.lang.t('newUser'));
    this.dom.show('delete-user',!!user&&this.currentUser?.role==='admin'&&user.role!=='admin'&&user.id!==this.currentUser.id);
    const editor=this.currentUser?.role==='editor';
    this.dom.byId<HTMLSelectElement>('user-role').disabled=!!editor;
    this.dom.byId<HTMLSelectElement>('user-status').disabled=!!editor;
    this.dom.byId<HTMLDialogElement>('user-dialog').showModal();
  }
  private async saveUser():Promise<void>{
    const input:UserInput={
      name:this.dom.byId<HTMLInputElement>('user-name').value,
      email:this.dom.byId<HTMLInputElement>('user-email').value,
      role:this.selected?.role&&this.currentUser?.role==='editor'?this.selected.role:this.dom.byId<HTMLSelectElement>('user-role').value as Role,
      status:this.selected?.status&&this.currentUser?.role==='editor'?this.selected.status:this.dom.byId<HTMLSelectElement>('user-status').value as Status,
      version:this.selected?.version??0,
    };
    const generation=this.sessionGeneration;
    const button=this.dom.byId<HTMLButtonElement>('save-user');button.disabled=true;
    try{
      if(this.selected)await this.api.updateUser(this.selected.id,input);
      else await this.api.createUser(input);
      if(generation!==this.sessionGeneration)return;
      this.dom.byId<HTMLDialogElement>('user-dialog').close();await this.loadUsers();
    }catch(error:unknown){if(generation===this.sessionGeneration)this.dom.text('form-status',this.message(error));}
    finally{if(generation===this.sessionGeneration)button.disabled=false;}
  }
  private async deleteUser():Promise<void>{
    if(!this.selected||!window.confirm(this.lang.t('confirmDelete')))return;
    const generation=this.sessionGeneration;
    try{await this.api.deleteUser(this.selected.id);if(generation!==this.sessionGeneration)return;this.dom.byId<HTMLDialogElement>('user-dialog').close();await this.loadUsers();}
    catch(error:unknown){this.dom.text('form-status',this.message(error));}
  }
  private exportUsers():void{
    if(!this.currentUser||this.currentUser.role==='viewer')return;
    const link=document.createElement('a');
    link.href=this.api.exportUrl(this.lang.current,this.dom.byId<HTMLInputElement>('search').value,this.dom.byId<HTMLSelectElement>('filter-role').value,this.dom.byId<HTMLSelectElement>('filter-status').value);
    link.rel='noopener';link.click();
  }
  private async loadAudit():Promise<void>{
    const generation=this.sessionGeneration;
    try{
      const rows=await this.api.audit();if(generation!==this.sessionGeneration||this.activeTab!=='audit')return;const tbody=this.dom.byId('audit-body');tbody.replaceChildren();
      for(const event of rows){const tr=document.createElement('tr');for(const cell of [new Date(event.createdAt).toLocaleString(this.lang.current),event.action,event.resourceId])tr.append(this.dom.node('td',cell));tbody.append(tr);}
      if(rows.length===0){const tr=document.createElement('tr');const td=this.dom.node('td',this.lang.t('emptyAudit'));td.setAttribute('colspan','3');tr.append(td);tbody.append(tr);}
    }catch(error:unknown){if(generation===this.sessionGeneration)this.dom.text('flash',this.message(error));}
  }
}

new AdminApplication(new AdminApiClient(),new Localizer()).mount().catch(error=>{
  document.getElementById('flash')!.textContent=error instanceof Error?error.message:'Initialization failed';
});
