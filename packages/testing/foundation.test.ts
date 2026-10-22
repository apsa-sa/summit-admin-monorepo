// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import type {Actor, User, UserInput} from '../contracts/index.js';
import {DomainError, Validation, Money} from '../core/index.js';
import {AuthorizationPolicy} from '../core-rbac/index.js';
import {PasswordHasher, SessionToken, RateLimiter} from '../security/index.js';
import {SessionService, type SessionStore} from '../auth/index.js';
import {CsvExporter} from '../exports/index.js';
import {DatabaseConnectionPolicy} from '../data-access/connection-policy.js';
import {PublicationPolicy} from '../security/publication-policy.js';
import {Localizer} from '../../apps/web-admin/browser/localization.js';

class FakeSessionStore implements SessionStore {
  constructor(private readonly actor:Actor|null) {}
  async actorForSession(_digest:string):Promise<Actor|null> {return this.actor;}
}
class FoundationTestSuite {
  private readonly policy=new AuthorizationPolicy();
  private readonly admin:Actor={id:'admin-1',role:'admin'};
  private readonly editor:Actor={id:'editor-1',role:'editor'};
  private readonly viewer:Actor={id:'viewer-1',role:'viewer'};
  private readonly stored:User={id:'viewer-1',name:'Sam',email:'sam@example.test',role:'viewer',status:'active',version:3,createdAt:'2026-01-01T00:00:00.000Z'};
  private readonly valid:UserInput={name:'Sam',email:'sam@example.test',role:'viewer',status:'active',version:3};
  private error(code:string, operation:()=>unknown):void {
    assert.throws(operation,(err:unknown)=>err instanceof DomainError&&err.code===code);
  }
  register():void {
    test('Validation rejects arrays, null, primitives',()=>{
      for(const value of [null,[],1,'a'])this.error('invalid_input',()=>Validation.record(value));
    });
    test('Validation rejects missing, blank and oversized names',()=>{
      for(const value of [null,0,'','    ','a'.repeat(121)])this.error('invalid_input',()=>Validation.text(value));
    });
    test('Validation accepts a trimmed name',()=>assert.equal(Validation.text('  Muna  '),'Muna'));
    test('Validation rejects noninteger, negative and nonfinite values',()=>{
      for(const value of [-1,1.1,Number.NaN,Infinity,'5',null])this.error('invalid_number',()=>Validation.integer(value));
    });
    test('Validation normalizes user email without mutating input',()=>{
      const original={...this.valid,email:'  SAM@EXAMPLE.TEST '};
      const user=Validation.user(original);
      assert.equal(user.email,'sam@example.test');assert.equal(original.email,'  SAM@EXAMPLE.TEST ');
    });
    test('Validation rejects unsupported roles and statuses',()=>{
      this.error('invalid_role',()=>Validation.role('super-admin'));
      this.error('invalid_status',()=>Validation.status('deleted'));
      this.error('invalid_email',()=>Validation.user({...this.valid,email:'not-email'}));
    });
    test('Validation query defaults and validates page/sort',()=>{
      assert.equal(Validation.query(new URLSearchParams()).page,1);
      this.error('invalid_number',()=>Validation.query(new URLSearchParams('page=0')));
      this.error('invalid_number',()=>Validation.query(new URLSearchParams('page=NaN')));
      this.error('invalid_sort',()=>Validation.query(new URLSearchParams('sort=password_hash')));
    });
    test('Validation draft rejects extraneous data and invalid version',()=>{
      this.error('invalid_input',()=>Validation.draft({name:'',organization:'',version:0,password:'secret'}));
      this.error('invalid_number',()=>Validation.draft({name:'',organization:'',version:-1}));
      assert.equal(Validation.draft({name:'',organization:'APSA',version:0}).organization,'APSA');
    });
    test('Money rejects negative, float and unsupported currencies',()=>{
      this.error('invalid_number',()=>new Money(-100,'SAR'));
      this.error('invalid_number',()=>new Money(1.3,'SAR'));
      this.error('invalid_currency',()=>new Money(100,'sar'));
      assert.equal(new Money(100,'SAR').minor,100);
    });
    test('Policy denies unknown roles/actions by default',()=>{
      this.error('forbidden',()=>this.policy.require(this.viewer,'unknown'));
      this.error('forbidden',()=>this.policy.require(this.viewer,'users:export'));
      this.error('forbidden',()=>this.policy.require(this.viewer,'users:create'));
    });
    test('Policy allows viewer read but not updates',()=>{
      assert.doesNotThrow(()=>this.policy.require(this.viewer,'users:read'));
      this.error('forbidden',()=>this.policy.require(this.viewer,'users:update',this.stored,this.valid));
    });
    test('Policy prohibits editor privilege escalation',()=>{
      this.error('forbidden',()=>this.policy.require(this.editor,'users:update',this.stored,{...this.valid,role:'admin'}));
      this.error('forbidden',()=>this.policy.require(this.editor,'users:update',this.stored,{...this.valid,status:'suspended'}));
      this.error('forbidden',()=>this.policy.require(this.editor,'users:update',{...this.stored,role:'admin'},this.valid));
    });
    test('Policy permits editor to update unprivileged profile fields',()=>{
      assert.doesNotThrow(()=>this.policy.require(this.editor,'users:update',this.stored,{...this.valid,name:'Edited'}));
    });
    test('Policy prohibits admin self-demotion and self-suspension',()=>{
      const self={...this.stored,id:this.admin.id,role:'admin' as const};
      this.error('self_privilege_change',()=>this.policy.require(this.admin,'users:update',self,{...this.valid,role:'viewer'}));
      this.error('self_privilege_change',()=>this.policy.require(this.admin,'users:update',self,{...this.valid,role:'admin',status:'suspended'}));
    });
    test('Policy blocks admin and self deletion',()=>{
      this.error('protected_user',()=>this.policy.require(this.admin,'users:delete',{...this.stored,id:this.admin.id}));
      this.error('protected_user',()=>this.policy.require(this.admin,'users:delete',{...this.stored,role:'admin'}));
    });
    test('Policy permits admin create',()=>assert.doesNotThrow(()=>this.policy.require(this.admin,'users:create')));
    test('PasswordHasher rejects short passwords',()=>this.error('invalid_password',()=>new PasswordHasher().hash('short')));
    test('PasswordHasher verifies correct password and rejects wrong one',()=>{
      const hash=new PasswordHasher().hash('Long strong passphrase 2026');
      assert.equal(new PasswordHasher().verify('Long strong passphrase 2026',hash),true);
      assert.equal(new PasswordHasher().verify('different password',hash),false);
    });
    test('PasswordHasher uses different random salts',()=>{
      const hasher=new PasswordHasher();assert.notEqual(hasher.hash('Long strong passphrase 2026'),hasher.hash('Long strong passphrase 2026'));
    });
    test('PasswordHasher rejects malformed hashes without throwing',()=>{
      assert.equal(new PasswordHasher().verify('Long strong passphrase 2026','invalid'),false);
    });
    test('SessionToken issues unpredictable tokens and stable digests',()=>{
      const token=new SessionToken();const first=token.create();const second=token.create();
      assert.notEqual(first,second);assert.equal(first.length,64);
      assert.equal(token.digest(first),token.digest(first));assert.notEqual(token.digest(first),first);
    });
    test('SessionService rejects missing and accepts valid sessions',async()=>{
      await assert.rejects(new SessionService(new FakeSessionStore(null)).authenticate('digest'),{code:'unauthenticated'});
      assert.deepEqual(await new SessionService(new FakeSessionStore(this.admin)).authenticate('digest'),this.admin);
    });
    test('RateLimiter blocks request 16 in same minute',()=>{
      const limiter=new RateLimiter();for(let i=0;i<15;i++)assert.doesNotThrow(()=>limiter.check('test',500));
      this.error('rate_limited',()=>limiter.check('test',500));
      assert.doesNotThrow(()=>limiter.check('test',60501));
    });
    test('RateLimiter enforces a bounded key space',()=>{
      const limiter=new RateLimiter(2);limiter.check('one',100);limiter.check('two',100);
      this.error('rate_limited',()=>limiter.check('third',100));
      limiter.check('third',60101);
    });
    test('CSV exporter escapes quotes and prefixes formula-like content',()=>{
      const rows=[{...this.stored,name:'=2+2',email:'"hello"@example.test'}];
      const csv=new CsvExporter().render(rows,'en');
      assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes("\"'=2+2\""));assert.ok(csv.includes('""hello""'));
    });
    test('Database policy accepts loopback-only development database',()=>{
      const policy=new DatabaseConnectionPolicy();
      const url='postgresql://' + 'demo:disposable@127.0.0.1:55439/demo';
      assert.equal(policy.configure(url).connectionString,url);
      assert.equal(policy.configure('postgres://' + 'demo:disposable@localhost:5432/demo').max,8);
    });
    test('Database policy rejects remote connection without full TLS verification',()=>{
      const policy=new DatabaseConnectionPolicy();
      for(const suffix of ['', '?sslmode=disable', '?sslmode=require', '?sslmode=no-verify']) {
        this.error('database_tls_required',()=>policy.configure('postgresql://' + 'user:password@db.example.test:5432/app'+suffix));
      }
    });
    test('Database policy accepts provider-neutral remote verify-full URLs',()=>{
      const policy=new DatabaseConnectionPolicy();
      const url='postgresql://' + 'user:password@db.example.test:5432/app?sslmode=verify-full';
      assert.equal(policy.configure(url).connectionString,url);
    });
    test('Database policy rejects host and TLS override options',()=>{
      const policy=new DatabaseConnectionPolicy();
      for(const query of ['host=db.example.test','ssl=false','uselibpqcompat=true','sslkey=/temp/key','sslmode=verify-full&sslmode=disable','hostaddr=203.0.113.5']) {
        this.error('unsafe_database_options',()=>policy.configure('postgresql://' + 'user:pass@localhost/db?'+query));
      }
    });
    test('Database policy rejects invalid URL syntax without exposing credentials',()=>{
      const policy=new DatabaseConnectionPolicy();
      for(const value of ['','http://not-postgres/db','postgresql:///db','not-a-url']) {
        this.error('invalid_database_url',()=>policy.configure(value));
      }
    });
    test('Publication policy identifies secrets without exposing their contents',()=>{
      const policy=new PublicationPolicy();
      assert.deepEqual(policy.findings('token='+('ghp_'+'A'.repeat(24)),'example.txt'),['github_token']);
      assert.deepEqual(policy.findings('database='+'postgresql://'+'alice:p4ssword@remote.example.test/db','config.md'),['secret_database_url']);
      assert.equal(policy.forbiddenPath('secrets/.env.production'),true);
      assert.equal(policy.forbiddenPath('.env.example'),false);
    });
    test('Publication policy allows only the disposable local example connection',()=>{
      const policy=new PublicationPolicy();
      const local='DATABASE_URL=postgresql://'+'summit:summit_local_only@127.0.0.1:55439/summit';
      assert.deepEqual(policy.findings(local,'.env.example'),[]);
      assert.deepEqual(policy.findings(local,'prod.env'),['secret_database_url']);
    });
    test('SUMMIT is officially localized as قمة in Arabic',()=>{
      assert.equal(Localizer.ar.product,'قمة');
      assert.equal(Localizer.en.product,'SUMMIT');
    });
    test('CSV exporter supports Arabic headers',()=>{
      assert.ok(new CsvExporter().render([this.stored],'ar').includes('الاسم'));
    });
  }
}
new FoundationTestSuite().register();
