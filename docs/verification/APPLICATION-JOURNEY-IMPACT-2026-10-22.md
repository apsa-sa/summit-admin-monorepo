<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Application journey pre-change impact record

Baseline: 1da68bd; isolated branch work/application-journey-20261022, stacked on
work/architecture-integration-20261022. Owner requested continued development
under the same conditions; main, merge and production deployment remain excluded.

Inspected server routes, browser imports, repository call sites, schema, CLI,
fixtures and proof composition. Existing public DTOs and local paths remain.
No source file, route, migration or original checkpoint is deleted. No new
Next.js framework entry exception is introduced. Code extraction is limited to
responsibilities currently reachable from the local reference app and its tests.

| Existing responsibility | Destination / compatibility |
|---|---|
| PostgreSQL mapping, identity, users, drafts, audit | Dedicated adapter classes; PostgresRepository remains the existing public facade, pool and method signatures retained |
| Authentication / CRUD / draft / audit orchestration | Constructor-injected application services depending on narrow storage interfaces |
| HTTP cookies, JSON, origin and response mapping | Dedicated HTTP controller / cookie / body classes |
| Node transport / public assets / startup | Explicit transport and composition root; same loopback address and port |
| Browser response casts | Shared runtime decoders; explicit static allowlist entry for emitted decoder module |
| Draft timers and versions | Account-scoped autosave controller; old responses invalidated by session generation |

Risks: transaction/lock ordering regression, accidental response/status change,
static module resolution, stale UI callbacks, UTF-8 corruption, loss of draft
edits, and misclassified authentication failures. Tests must cover original
integration cases plus real HTTP login, drafts, RBAC, audit and CSV in Chromium.
Independent provider TLS, multi-admin deadlocks, distributed limiting and full
Next.js admin migration remain release gates. No unused-code removal is justified.

Rollback: retain this branch and PR as evidence; close without merge if rejected.
If later merged with authorization, use reviewed revert commits, not history
rewriting. Database schema is unchanged, so no production data rollback applies.

## Owner steering during implementation

The owner explicitly authorized merge and public developer release **if all
project requirements and verification gates are satisfied**. This conditional
authority supersedes the earlier need to ask again, not the release criteria.
Current work does not satisfy every v1.0 requirement, so this stage must not be
merged/published as a complete production product merely because its CI passes.

Concurrency review identified a user-lock upgrade risk in simultaneous self
edits and opposite-direction admin edits. The user adapter now locks both user
rows in sorted UUID order with FOR UPDATE, before locking the session. Dedicated
real-PostgreSQL tests must prove both cases and preserve revocation-race coverage.
This serializes mutations involving the same actor; throughput is not certified.
