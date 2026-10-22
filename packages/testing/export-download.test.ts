// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { AdminApiClient } from "../../apps/web-admin/browser/api.js";
class DownloadTransportSuite {
  private headers = { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": 'attachment; filename="summit-users.xlsx"' };
  register():void{
    test("Export transport preserves native receiver, scope and valid bytes",async()=>{
      let requested='';const expected=this.headers;
      const transport:typeof fetch=async function(this:unknown,url,init){assert.equal(this,globalThis);assert.equal(init?.credentials,'same-origin');requested=String(url);return new Response(new Uint8Array([80,75,3,4,1]),{headers:expected});};
      const file=await new AdminApiClient('https://example.test',transport).downloadExport('ar','عربي &','viewer','active','xlsx','name');
      assert.deepEqual([...new Uint8Array(file.bytes)],[80,75,3,4,1]);assert.equal(file.filename,'summit-users.xlsx');
      const params=new URL(requested).searchParams;assert.equal(params.get('search'),'عربي &');assert.equal(params.get('sort'),'name');assert.equal(params.get('format'),'xlsx');
    });
    test("Export HTTP failures retain sanitized codes and malformed success MIME/filename/signature fails closed",async()=>{
      const rejected:typeof fetch=async()=>Response.json({error:'export_limit',requestId:'synthetic'},{status:422});
      await assert.rejects(new AdminApiClient('',rejected).downloadExport('en','','','','xlsx','name'),{status:422,code:'export_limit'});
      for(const response of [new Response('not a workbook',{headers:this.headers}),new Response(new Uint8Array([80,75,3,4]),{headers:{...this.headers,'content-type':'text/html'}}),new Response(new Uint8Array([80,75,3,4]),{headers:{...this.headers,'content-disposition':'attachment; filename="other.xlsx"'}})]){
        await assert.rejects(new AdminApiClient('',async()=>response).downloadExport('en','','','','xlsx','name'),{code:'invalid_response'});
      }
    });
    test("Malformed download headers cancel unread response bytes", async () => {
      let cancelled = false;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) { controller.enqueue(new Uint8Array([80, 75, 3, 4])); },
        cancel() { cancelled = true; },
      });
      const transport: typeof fetch = async () => new Response(stream, {
        headers: { ...this.headers, "content-type": "text/html" },
      });
      await assert.rejects(new AdminApiClient("", transport).downloadExport("en", "", "", "", "xlsx", "name"), { code: "invalid_response" });
      assert.equal(cancelled, true);
    });
    test("Export stream refuses oversized bodies and cancels the reader",async()=>{
      let cancelled=false;
      const stream=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(32_000_001));},cancel(){cancelled=true;}});
      await assert.rejects(new AdminApiClient('',async()=>new Response(stream,{headers:this.headers})).downloadExport('en','','','','xlsx','name'),{code:'invalid_response'});
      assert.equal(cancelled,true);
    });
    test("Session end cancels pending export transport and returns a classified network failure",async()=>{
      let signal:AbortSignal|null|undefined;
      const transport:typeof fetch=async(_url,init)=>new Promise((_resolve,reject)=>{signal=init?.signal;signal?.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});});
      const api=new AdminApiClient('',transport);const result=api.downloadExport('en','','','','xlsx','name');const rejection=assert.rejects(result,{code:'network_error'});api.endSession();await rejection;assert.equal(signal?.aborted,true);
    });
  }
}
new DownloadTransportSuite().register();
