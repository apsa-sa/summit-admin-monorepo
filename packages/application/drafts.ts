// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { DraftStore, PermissionPolicy } from '../contracts/ports.js';
import { Validation } from '../core/index.js';
export class DraftApplicationService {
  constructor(private readonly store: DraftStore, private readonly policy: PermissionPolicy) {}
  load(digest:string) { return this.store.loadDraftForSession(digest,this.policy); }
  save(digest:string,value:unknown) { return this.store.saveDraftForSession(digest,Validation.draft(value),this.policy); }
}
