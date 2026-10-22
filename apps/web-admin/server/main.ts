// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import { Validation } from '../../../packages/core/index.js';
import { AdminCompositionRoot } from './composition-root.js';
/** Compatibility CLI entry; all dependencies are assembled at the composition root. */
export class AdminServer {
  start():void {
    const url=process.env.DATABASE_URL;if(!url)throw new Error('DATABASE_URL is required');
    const origin=process.env.APP_ORIGIN??'http://localhost:3210';
    const root=new AdminCompositionRoot(url,origin);
    const port=Validation.integer(Number(process.env.PORT??3210),1024,65535);
    const server=root.server.start(port);
    server.once('listening',()=>console.log(`Summit local: http://localhost:${port}`));
    const shutdown=():void=>{server.close(()=>{void root.close();});};
    process.once('SIGTERM',shutdown);process.once('SIGINT',shutdown);
  }
}
new AdminServer().start();
