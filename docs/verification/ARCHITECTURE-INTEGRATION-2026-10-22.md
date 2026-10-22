<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Architecture and integration gate — 2026-10-22

## Scope and authority / النطاق والتفويض

Repository: `apsa-sa/summit-admin-monorepo` only.
Branch: `work/architecture-integration-20261022`.
Baseline: `1d4f5e19a35b30b7f44dc078832b3faae1ffaa96`.
The existing integration branch `4b114aa` has the **same source tree** as this
baseline and is its parent. Building on main preserves that integration and
all earlier history. No original branch is overwritten or force-pushed.

Owner authorized development following the staged plan and reiterated ten
conditions. Main modification, merge and production deployment remain excluded.
PR #1 was already merged before this work; this stage does not merge it again.
The bounded framework exception is recorded in ADR-0001. No other project,
cloud service, existing database or production secret is accessed or modified.

## Preflight findings and changes / الفحص والتغييرات

1. Original `pnpm check` typecheck succeeded; its tsx CLI failed locally because
   this sandbox disallows its Unix IPC socket. `node --import tsx --test` ran all
   original 34 tests successfully under the pinned runtime. Scripts now use
   that supported loader, preserving the test runner and assertions.
2. The repository checked live actor role during mutations but did not bind
   the transaction to the session that authorized the HTTP request. A completed
   logout could therefore leave an in-flight Actor capable of writing.
   New `mutateForSession` rechecks/locks the actual session through commit;
   HTTP mutations use it. `mutate` remains a **trusted internal** method for
   compatibility, not an HTTP authorization boundary.
3. Login could issue a new session after the user changed between credential
   lookup and session insertion. Issuance now locks the active user and the
   HTTP login supplies the credential version; mismatches fail closed.
4. A separate `apps/next-proof` exercises framework/server/client integration
   without deleting/replacing the original local admin app. It demonstrates
   SSR preferences, Arabic/English, light/dark, client class hydration,
   authenticated profile and real logout adapters. It is not a finished login
   screen or migrated admin application. Its note field is explicitly temporary;
   server-backed drafts remain in the original app and integration tests.
5. `SessionProfileService` depends on a storage port, a session service and
   token primitive injected through its constructor. HTTP cookies, origin,
   error envelopes and correlation IDs stay in `SessionController`.
6. Added disposable real-database integration, HTTP contract/security tests and
   Chromium E2E. New CI job has PostgreSQL 17.6 and no deployment permissions.

## Verification matrix / أدلة التحقق

| Gate | Local result | Scope / limitation |
|---|---|---|
| Original baseline units | PASS, 34/34 | Pinned Node 22.23.1, pnpm 9.0.0 |
| Typecheck + units + original browser build | PASS, 40/40 units | Six new profile/HTTP contracts; no skipped tests |
| Next.js production build | PASS | Webpack proof, no TypeScript suppression |
| Publication signature/history audit | PASS | Limited scanner only |
| PostgreSQL integration | BLOCKED locally | Cannot change OS user to start PostgreSQL in sandbox; real service configured in CI |
| Chromium E2E | BLOCKED locally | Browser archive download truncated; required in CI |
| Independent secret scan | PASS | Gitleaks 8.30.1, reachable history and exact 78-file source candidate; no findings |
| Dependency advisory audit | PASS | pnpm audit --audit-level low: no known vulnerabilities reported |
| Full accessibility / visual / 100k performance | NOT RUN | Not claimed by this proof |
| Main merge / deployment / release | NOT RUN | Explicitly excluded |

### Confirmed CI evidence

[Run 39739417801](https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39739417801)
on commit `714804cec34c222606c1d7b411e4b01fbf45e184` completed successfully.
Both foundation and architecture/integration jobs passed. Retrieved job logs confirm:

- 40/40 unit and HTTP-contract tests, zero failed/skipped.
- PostgreSQL 17.6: 13 integration scenarios plus their parent suite (Node reports
  14/14 tests), zero failed/skipped. These include the observed lock-wait
  revocation race, rollback and independent database installation tests.
- Next.js production build and 4/4 Playwright Chromium tests passed: SSR without
  JavaScript, hydration and preference changes preserving input, 360px keyboard/
  overflow checks, real session lookup/logout and cross-origin rejection.
- Foundation publication, dependency and Gitleaks checks passed.

The local BLOCKED entries above describe local environmental limits, not skipped
CI gates. Final report/notice/telemetry-only follow-up changes require a fresh
CI result on the final branch head before acceptance. No product readiness or
full WCAG/cross-browser coverage is inferred from these limited tests.

CI evidence is the job result on the uploaded commit, not this document's
existence. A green foundation-only job does not replace the integration job.
Failures block acceptance; no skip, continue-on-error, mocked PostgreSQL, or
successful migration claim is substituted for real execution.

## Database safety and concurrency / سلامة قاعدة البيانات

`test:integration` requires `SUMMIT_TEST_DB_APPROVED=1`, loopback and control
database **summit_test**. It creates uniquely named databases with generated
identifiers, applies only the checked-in migration and drops only databases
created by that fixture after closing connections. E2E seeds/deletes only its
own generated test user in the disposable CI control database. There is no
production restore or data cleanup command. No real credentials enter source.

Tests cover independent database installations, SQL constraints, repeated initial
migration, session expiry/revocation, RBAC denial, stale roles, concurrent
versioned edits/drafts, audit rollback, duplicate email and literal search input.
A login/session race test and a revocation/write test cover the added paths.
They do not certify every possible interleaving or all multi-admin deadlocks.
A write already authorized and locked may commit before logout finishes;
a revocation completed before the transactional check rejects the write.

## Compatibility, impact and rollback / الأثر والتراجع

- Existing local routes, SQL schema, workspace packages and old checkpoints
  remain. No original source file, feature, branch or migration is deleted.
- `session` has a backward-compatible optional expected version; HTTP login
  supplies it. The new session-bound mutation method leaves the old internal
  signature intact. HTTP response DTOs and status/error envelopes are preserved.
- No production migration and no new schema table. The test fixture requires a
  database-creating role exclusively in disposable test environments.
- New dependencies are isolated to the proof/test tooling. The lockfile is
  updated; full recursive notices/SBOM remain release work.
- Rollback before merge: close draft PR, retain its branch as evidence. If later
  approved and merged, use a reviewed revert commit; never rewrite history.

## Remaining release gates / ما تبقى

Close ADR acceptance using CI evidence; review concurrency and transaction
boundaries further; split remaining repository/server responsibilities; build
the full Next.js reference journey; implement shared tokens/components,
Tailwind, complete localization/error states, advanced tables, Excel/PDF,
secure uploads, demo analytics and developer docs. Verify remote provider TLS,
least-privilege DB roles, proxy/origin policy, distributed rate limiting,
backup/restore, licensing/SBOM, WCAG and performance. No claim of production
readiness or v1.0 completion is made.

## File inventory / الملفات المعدّلة

- Framework proof: `apps/next-proof/` (four explicit framework entries, class
  presentation/preferences, server controller/composition root, styles and config).
- Application port/service: `packages/auth/profile-service.ts`.
- Session-bound transactions: `packages/data-access/index.ts`; HTTP callers:
  `apps/web-admin/server/main.ts`. Existing response contracts are preserved.
- Verification: `packages/testing/profile.test.ts`, `packages/testing/integration/`,
  `packages/testing/e2e/`, `packages/testing/support/`, `playwright.config.ts`.
- Execution and reproducibility: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`,
  `.gitignore`, `.github/workflows/ci.yml`.
- Documentation: `README.md`, `THIRD_PARTY_NOTICES.md`, ADR-0001, publication
  checklist and these two verification guides. Exact diff: draft PR #2.

No deletion cleanup was performed: no unused-code hypothesis has been accepted
as sufficient evidence to remove an original module. The webpack proof scripts
explicitly disable Next.js telemetry for supported Linux/macOS commands.
