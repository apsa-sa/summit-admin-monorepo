// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { PermissionPolicy, UserStore } from '../contracts/ports.js';
import { Validation } from '../core/index.js';
import { SessionService } from '../auth/index.js';
import { CsvExporter } from '../exports/index.js';
export class UserApplicationService {
  constructor(private readonly store: UserStore, private readonly sessions: SessionService,
    private readonly policy: PermissionPolicy, private readonly csv: CsvExporter) {}
  async list(digest: string, params: URLSearchParams) {
    this.policy.require(await this.sessions.authenticate(digest),'users:read');
    return this.store.list(Validation.query(params));
  }
  async mutate(digest: string, id: string | null, value: unknown, action: 'create'|'update'|'delete', requestId: string) {
    this.policy.require(await this.sessions.authenticate(digest),`users:${action}`);
    return this.store.mutateForSession(digest,id,action==='delete'?null:Validation.user(value),requestId,this.policy);
  }
  async export(digest: string, params: URLSearchParams): Promise<string> {
    this.policy.require(await this.sessions.authenticate(digest),'users:export');
    const data = await this.store.list(Validation.query(params),true);
    return this.csv.render(data.rows,params.get('locale')??'ar');
  }
}
