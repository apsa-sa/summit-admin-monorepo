// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { JsonBody } from '../../apps/web-admin/server/json-body.js';
import { ResponseContracts,ContractViolation } from '../contracts/decoders.js';
import { AdminApiClient } from '../../apps/web-admin/browser/api.js';
import { AuthenticationService } from '../application/authentication.js';
import { PasswordHasher,SessionToken,RateLimiter } from '../security/index.js';
import { SessionService } from '../auth/index.js';
import type { IdentityStore } from '../contracts/ports.js';
import type { User,Actor } from '../contracts/index.js';

class LoginStore implements IdentityStore {
  readonly password=` ${new SessionToken().create()} `;
  readonly user:User={id:randomUUID(),name:'Test',email:'user@example.test',role:'admin',status:'active',version:2,createdAt:new Date(0).toISOString()};
  issuedVersion:number|undefined;
  async credentials(){return {user:this.user,hash:new PasswordHasher().hash(this.password)};}
  async session(_digest:string,_id:string,version?:number){this.issuedVersion=version;}
  async actorForSession():Promise<Actor|null>{return this.user;}
  async self(){return this.user;}
  async logout(){}
}
class JourneyContractTests {
  register():void{
    test('JSON contract rejects oversized input and misleading content types',async()=>{
      const parser=new JsonBody();
      await assert.rejects(parser.parse(new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json-extra'},body:'{}'})),{code:'json_required'});
      await assert.rejects(parser.parse(new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json'},body:'x'.repeat(16385)})),{code:'body_too_large'});
    });
    test('JSON reader preserves Arabic across single-byte stream fragments',async()=>{
      const bytes=new TextEncoder().encode(JSON.stringify({name:'قمة الكواكب العربية'}));
      const stream=new ReadableStream<Uint8Array>({start(controller){for(const byte of bytes)controller.enqueue(new Uint8Array([byte]));controller.close();}});
      const joined=await new JsonBody().bytes(stream);
      assert.equal(new TextDecoder().decode(joined),new TextDecoder().decode(bytes));
    });
    test('JSON contract distinguishes malformed JSON from valid input',async()=>{
      await assert.rejects(new JsonBody().parse(new Request('http://localhost',{method:'POST',headers:{'content-type':'application/json'},body:'{broken'})),{code:'invalid_json'});
    });
    test('Response decoder rejects malformed roles, versions and pagination',()=>{
      const decoder=new ResponseContracts();const user=new LoginStore().user;
      assert.throws(()=>decoder.user({...user,role:'root'}),ContractViolation);
      assert.throws(()=>decoder.user({...user,version:NaN}),ContractViolation);
      assert.throws(()=>decoder.page({rows:[user],page:1,total:1,pageSize:0}),ContractViolation);
      const safe=decoder.user({...user,password_hash:'must not propagate'});
      assert.equal('password_hash' in safe,false);
    });
    test('Browser API fails closed on structurally invalid success payloads',async()=>{
      const transport:typeof fetch=async()=>Response.json({user:{name:'incomplete'}});
      await assert.rejects(new AdminApiClient('http://localhost',transport).me(),{code:'invalid_response'});
    });
    test('Ending a browser session aborts outstanding requests before account switching',async()=>{
      let signal:AbortSignal|null|undefined;
      const transport:typeof fetch=async(_url,init)=>new Promise((_resolve,reject)=>{
        signal=init?.signal;signal?.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});
      });
      const api=new AdminApiClient('http://localhost',transport);
      const pending=api.me();const rejection=assert.rejects(pending,{code:'network_error'});
      api.endSession();await rejection;
      assert.equal(signal?.aborted,true);
    });
    test('Authentication preserves password whitespace and issues the verified account version',async()=>{
      const store=new LoginStore();const service=new AuthenticationService(store,new SessionService(store),new PasswordHasher(),new SessionToken(),new RateLimiter());
      assert.equal((await service.login({email:store.user.email,password:store.password},'peer')).user.id,store.user.id);
      assert.equal(store.issuedVersion,store.user.version);
      await assert.rejects(service.login({email:store.user.email,password:store.password.trim()},'peer'),{code:'invalid_credentials'});
    });
  }
}
new JourneyContractTests().register();
