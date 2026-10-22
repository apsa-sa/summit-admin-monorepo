// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { readFile } from 'node:fs/promises';
import { DomainError } from '../../../packages/core/index.js';
export class PublicAssets {
  private readonly files:Readonly<Record<string,readonly [string,string]>>={
    '/':['index.html','text/html; charset=utf-8'],
    '/app.js':['apps/web-admin/browser/app.js','text/javascript; charset=utf-8'],
    '/api.js':['apps/web-admin/browser/api.js','text/javascript; charset=utf-8'],
    '/localization.js':['apps/web-admin/browser/localization.js','text/javascript; charset=utf-8'],
    '/draft-controller.js':['apps/web-admin/browser/draft-controller.js','text/javascript; charset=utf-8'],
    '/packages/contracts/decoders.js':['packages/contracts/decoders.js','text/javascript; charset=utf-8'],
    '/style.css':['style.css','text/css; charset=utf-8'],
  };
  async read(path:string):Promise<Response> {
    const file=this.files[path];if(!file)throw new DomainError(404,'not_found');
    return new Response(await readFile(new URL('../public/'+file[0],import.meta.url)),{headers:{'Content-Type':file[1]}});
  }
}
