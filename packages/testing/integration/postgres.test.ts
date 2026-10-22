// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import type { Actor, User, UserInput } from '../../contracts/index.js';
import { PostgresRepository } from '../../data-access/index.js';
import { AuthorizationPolicy } from '../../core-rbac/index.js';
import { SessionService } from '../../auth/index.js';
import { SessionToken, PasswordHasher } from '../../security/index.js';
import { Validation } from '../../core/index.js';
import { DatabaseFixture } from '../support/database-fixture.js';

class PostgresIntegrationSuite {
  private readonly policy = new AuthorizationPolicy();
  private readonly tokens = new SessionToken();
  private input(user: User, overrides: Partial<UserInput> = {}): UserInput {
    return { name: user.name, email: user.email, role: user.role, status: user.status, version: user.version, ...overrides };
  }
  private async seed(repo: PostgresRepository, role: 'admin' | 'editor' | 'viewer'): Promise<User> {
    const id = randomUUID();
    await repo.pool.query('INSERT INTO users(id,name,email,role,status,password_hash) VALUES($1,$2,$3,$4,$5,$6)',
      [id, role, `${id}@example.test`, role, 'active', new PasswordHasher().hash(this.tokens.create())]);
    return repo.self(id);
  }
  register(): void {
    test('Real PostgreSQL integration gate', { timeout: 60000 }, async context => {
      const fixture = new DatabaseFixture();
      try {
        const repo = await fixture.create(); const independent = await fixture.create();
        const admin = await this.seed(repo, 'admin'); const editor = await this.seed(repo, 'editor');
        const viewer = await this.seed(repo, 'viewer'); const actor: Actor = admin;
        await context.test('Migration creates constraints and repeated application preserves schema', async () => {
          await assert.rejects(repo.pool.query("INSERT INTO users(id,name,email,role,status) VALUES($1,'x','x@example.test','invalid','active')", [randomUUID()]), { code: '23514' });
          assert.equal((await repo.self(admin.id)).id, admin.id);
        });
        await context.test('Independent installation databases do not expose each other records', async () => {
          assert.equal((await independent.list(Validation.query(new URLSearchParams()))).total, 0);
          await assert.rejects(independent.self(admin.id), { code: 'not_found' });
          assert.equal((await repo.list(Validation.query(new URLSearchParams()))).total, 3);
        });
        await context.test('Session issuance, expiry and logout are enforced by real storage', async () => {
          const token = this.tokens.create(); const digest = this.tokens.digest(token);
          await repo.session(digest, viewer.id);
          assert.equal((await new SessionService(repo).authenticate(digest)).id, viewer.id);
          await repo.pool.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE digest=$1", [digest]);
          await assert.rejects(new SessionService(repo).authenticate(digest), { code: 'unauthenticated' });
          await repo.logout(digest); await repo.logout(digest);
          assert.equal((await repo.pool.query('SELECT * FROM sessions WHERE digest=$1', [digest])).rowCount, 0);
        });
        await context.test('RBAC blocks editor elevation and rolls back both row and audit', async () => {
          const before = await repo.events();
          await assert.rejects(repo.mutate(editor, viewer.id, this.input(viewer, { role: 'admin' }), randomUUID(), this.policy), { code: 'forbidden' });
          assert.equal((await repo.self(viewer.id)).role, 'viewer'); assert.equal((await repo.events()).length, before.length);
        });
        await context.test('Concurrent edits accept exactly one version and one audit event', async () => {
          const user = await this.seed(repo, 'viewer'); const before = (await repo.events()).length;
          const results = await Promise.allSettled([
            repo.mutate(actor, user.id, this.input(user, { name: 'First' }), randomUUID(), this.policy),
            repo.mutate(actor, user.id, this.input(user, { name: 'Second' }), randomUUID(), this.policy),
          ]);
          assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
          const rejected = results.find(result => result.status === 'rejected');
          assert.ok(rejected?.status === 'rejected' && rejected.reason.code === 'version_conflict');
          assert.equal((await repo.events()).length, before + 1);
          assert.equal((await repo.self(user.id)).version, user.version + 1);
        });
        await context.test('Audit failure rolls back a successful-looking user update', async () => {
          const before = await repo.self(viewer.id);
          await assert.rejects(repo.mutate(actor, viewer.id, this.input(before, { name: 'Must roll back' }), 'invalid-request-id', this.policy));
          assert.deepEqual(await repo.self(viewer.id), before);
        });
        await context.test('Duplicate email returns conflict and creates no audit event', async () => {
          const before = (await repo.events()).length;
          await assert.rejects(repo.mutate(actor, null, this.input(viewer), randomUUID(), this.policy), { code: 'email_exists' });
          assert.equal((await repo.events()).length, before);
        });
        await context.test('User search treats wildcard and injection-like content as data', async () => {
          const query = Validation.query(new URLSearchParams({ search: "%' OR 1=1 --" }));
          assert.equal((await repo.list(query)).total, 0);
          assert.equal((await repo.list(Validation.query(new URLSearchParams({ search: '%' })))).total, 0);
        });
        await context.test('Concurrent initial drafts accept one writer and can resume confirmed values', async () => {
          const draft = { name: 'Name', organization: 'Organization', version: 0 };
          const results = await Promise.allSettled([repo.saveDraft(viewer.id, draft), repo.saveDraft(viewer.id, { ...draft, name: 'Other' })]);
          assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
          const rejected = results.find(result => result.status === 'rejected');
          assert.ok(rejected?.status === 'rejected' && rejected.reason.code === 'version_conflict');
          const saved = await repo.getDraft(viewer.id); assert.equal(saved.version, 1);
          assert.equal((await repo.saveDraft(viewer.id, { ...saved, organization: 'Updated' })).version, 2);
        });
        await context.test('Suspended users and stale credential versions cannot issue sessions', async () => {
          const user = await this.seed(repo, 'editor');
          await repo.mutate(actor, user.id, this.input(user, { status: 'suspended' }), randomUUID(), this.policy);
          await assert.rejects(repo.session(this.tokens.digest(this.tokens.create()), user.id, user.version), { code: 'unauthenticated' });
          const active = await this.seed(repo, 'editor');
          await repo.mutate(actor, active.id, this.input(active, { role: 'viewer' }), randomUUID(), this.policy);
          await assert.rejects(repo.session(this.tokens.digest(this.tokens.create()), active.id, active.version), { code: 'unauthenticated' });
        });
        await context.test('Revocation while a mutation waits for its actor lock rejects the write', async () => {
          const user = await this.seed(repo, 'editor');
          const digest = this.tokens.digest(this.tokens.create()); await repo.session(digest, user.id);
          const blocker = await repo.pool.connect();
          try {
            await blocker.query('BEGIN');
            await blocker.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [user.id]);
            const target = await repo.self(viewer.id);
            const pending = repo.mutateForSession(digest, target.id, this.input(target, { name: 'Must not commit' }), randomUUID(), this.policy);
            const rejection = assert.rejects(pending, { code: 'unauthenticated' });
            // Observe the real lock wait before revoking; elapsed time alone is not proof.
            let waiting = false;
            for (let attempt = 0; attempt < 100; attempt++) {
              await blocker.query('SELECT pg_stat_clear_snapshot()');
              const state = await blocker.query<{ waiting: boolean }>(
                "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE $1) AS waiting",
                ['SELECT * FROM users WHERE id=ANY%FOR UPDATE'],
              );
              if (state.rows[0]?.waiting) { waiting = true; break; }
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            assert.equal(waiting, true, 'mutation must reach the actor lock before logout');
            await repo.logout(digest);
            await blocker.query('COMMIT');
            await rejection;
            assert.equal((await repo.self(target.id)).name, target.name);
          } finally { await blocker.query('ROLLBACK'); blocker.release(); }
        });
        await context.test('Role changes revoke every existing session for the affected user', async () => {
          const user = await this.seed(repo, 'editor'); const digest = this.tokens.digest(this.tokens.create());
          await repo.session(digest, user.id);
          await repo.mutate(actor, user.id, this.input(user, { role: 'viewer' }), randomUUID(), this.policy);
          await assert.rejects(new SessionService(repo).authenticate(digest), { code: 'unauthenticated' });
        });
        await context.test('Session-bound drafts always use the owner from the authenticated session', async () => {
          const owner = await this.seed(repo,'viewer');const other = await this.seed(repo,'viewer');
          const digest = this.tokens.digest(this.tokens.create());await repo.session(digest,owner.id);
          const saved = await repo.saveDraftForSession(digest,{name:'Owner only',organization:'Private',version:0},this.policy);
          assert.equal(saved.version,1);assert.equal((await repo.getDraft(other.id)).name,'');
          assert.equal((await repo.loadDraftForSession(digest,this.policy)).name,'Owner only');
          await repo.logout(digest);
          await assert.rejects(repo.saveDraftForSession(digest,{name:'Rejected',organization:'',version:1},this.policy),{code:'unauthenticated'});
          assert.equal((await repo.getDraft(owner.id)).name,'Owner only');
        });
        await context.test('Concurrent self edits produce a version conflict instead of a lock-upgrade deadlock', async () => {
          const user = await this.seed(repo,'editor');const digest = this.tokens.digest(this.tokens.create());await repo.session(digest,user.id);
          const results = await Promise.allSettled([
            repo.mutateForSession(digest,user.id,this.input(user,{name:'Self one'}),randomUUID(),this.policy),
            repo.mutateForSession(digest,user.id,this.input(user,{name:'Self two'}),randomUUID(),this.policy),
          ]);
          assert.equal(results.filter(result=>result.status==='fulfilled').length,1);
          const failure=results.find(result=>result.status==='rejected');
          assert.ok(failure?.status==='rejected'&&failure.reason.code==='version_conflict');
        });
        await context.test('Opposite-direction administrator edits use deterministic lock ordering', async () => {
          const one=await this.seed(repo,'admin');const two=await this.seed(repo,'admin');
          const first=this.tokens.digest(this.tokens.create());const second=this.tokens.digest(this.tokens.create());
          await repo.session(first,one.id);await repo.session(second,two.id);
          const results=await Promise.allSettled([
            repo.mutateForSession(first,two.id,this.input(two,{name:'Second updated'}),randomUUID(),this.policy),
            repo.mutateForSession(second,one.id,this.input(one,{name:'First updated'}),randomUUID(),this.policy),
          ]);
          assert.equal(results.filter(result=>result.status==='fulfilled').length,2);
        });
        await context.test('Repository rechecks live actor role before accepting a stale authorization', async () => {
          const stale = await this.seed(repo, 'editor');
          await repo.mutate(actor, stale.id, this.input(stale, { role: 'viewer' }), randomUUID(), this.policy);
          const target = await repo.self(viewer.id);
          await assert.rejects(repo.mutate(stale, target.id, this.input(target, { name: 'Forbidden' }), randomUUID(), this.policy), { code: 'forbidden' });
        });
      } finally { await fixture.close(); }
    });
  }
}
new PostgresIntegrationSuite().register();
