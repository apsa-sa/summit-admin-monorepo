// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { AuditStore, PermissionPolicy } from '../contracts/ports.js';
import { SessionService } from '../auth/index.js';
export class AuditApplicationService {
  constructor(private readonly store:AuditStore,private readonly sessions:SessionService,private readonly policy:PermissionPolicy) {}
  async list(digest:string) {
    this.policy.require(await this.sessions.authenticate(digest),'audit:read');
    return this.store.events();
  }
}
