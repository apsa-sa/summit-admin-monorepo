// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { SessionToken } from '../../../packages/security/index.js';
export class SessionCookie {
  constructor(private readonly tokens:SessionToken,private readonly secure:boolean) {}
  digest(request:Request):string {
    const cookie=request.headers.get('cookie')?.split(';').map(value=>value.trim()).find(value=>value.startsWith('summit_session='));
    return this.tokens.digest(cookie?.slice('summit_session='.length)??'');
  }
  issue(token:string):string { return `summit_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${this.secure?'; Secure':''}`; }
  clear():string { return `summit_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${this.secure?'; Secure':''}`; }
}
