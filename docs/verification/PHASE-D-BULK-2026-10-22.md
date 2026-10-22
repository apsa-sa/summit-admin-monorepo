<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase D increment — bounded bulk status and request deadlines

Baseline 14bdfdc813947c45a5331dc8f0ca8b0469ed4d3e, draft PR8:
https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39828080280
77 units/contracts +4 asset contracts +30 real PostgreSQL +26 Chromium, all PASS,
zero fail/skip, exact-head fresh install/build/security/publication/Gitleaks PASS.
Current isolated branch: work/admin-bulk-20261022. Owner authorized continued Phase D
within original brief §10b (selection/bulk actions), §8 RBAC and §12 keyboard access.
Main remains protected at 65e82cd; no merge, production migration/deployment/release.

## Inspect, design and contracts

The reusable Table already supported controlled selection, but the admin never
connected a selection or a bulk action. Existing PUT user transactions enforce
resource/input policy, optimistic version, audit and session revocation. Reuse that
real contract with explicit per-record semantics rather than inventing an atomic
batch promise. Selection is limited to eight current-page eligible records; the
operation snapshots versions, serializes calls, stops after first error/uncertainty,
and records updated/rejected/unconfirmed/not-attempted separately. No auto retry.
Stop waits for current request acknowledgement. Navigation/query changes stop the
remaining queue; account epochs prevent late mutation responses restoring context.

Separate BulkStateModel/BulkUserController/BulkUsersPanel; constructor DI, no React
in orchestration, no hooks/new framework entries/globals/dependencies/schema/API grant.
Current policy is applied to each selected resource/input and the server rechecks.
Matching response ID/status/role/version is required before acknowledging success.
A 15-second client deadline covers fetch/body reads; timer/session listeners are
released in finally. Existing request/cookie/CSRF/runtime DTO contracts are retained.
After timeout, server state is unconfirmed, never falsely reported rolled back.

UI generic Table canSelect/selectionDisabled props remain presentation only and
are documented. Confirmation lists exact selected names. Results receive focus
through a completion token, with explicit text/outcomes. No broad database cleanup
or destructive bulk deletion is added. Existing per-record database tests are
retained; new real browser flow covers actual sequential writes and concurrent
version conflict, independent commit, reload/retry and exact audit counts.

## Actual local checks and pending exact-head CI

pnpm check PASS: 84/84 units/contracts (77 retained +7 meaningful bulk/deadline
scenarios), 4/4 emitted native asset contracts, zero fail/skip. Shared package
build/pack contracts and Next admin production build PASS; strict unused/root
checks and diff whitespace PASS. Fresh locked CI, all 30 retained real PostgreSQL
results and 27 Chromium cases (26 retained +one actual bulk flow) still required.
Expected registration is not an execution claim.

| Requirement | Status | Evidence / next gate |
|---|---|---|
| Bounded selection/status orchestration and deadline | PARTIAL | Local 84+4 tests, production build; final CI pending |
| Per-record versions/RBAC/revocation/audit | PARTIAL | Existing real PG plus new real browser scenario required on this head |
| Partial results/cancel/account epochs/focus | PARTIAL | Local failure tests; new browser focus/axe pending |
| Retained old DOM/proof/gallery/Next compatibility | PARTIAL | Unchanged assertions, repeat all 27 cases |
| Complete Phase D | PARTIAL | Remaining components/docs/gallery/Tailwind/unproven states open |
| Full E/F/G release acceptance | PARTIAL | Export/files/analytics/DX/performance/recovery/licenses/RC remain |

## Cleanliness and changed-file inventory

No source file removed. No migration/lockfile/dependency changes, test skip/only,
compiler suppression/any bypass, debug log or tracked archive/build output. New
class responsibilities are separated; common UI/locale/policy/API reused. The API
file is formatted because transport lifecycle was directly changed, not a repository
formatting sweep. No unrelated prototype refactor. Strict unused scans required
before upload; all original browser asset allowlist and assertions retained.

| Change | File | Purpose |
|---|---|---|
| MODIFIED | `apps/web-admin/app/workspace.css` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `apps/web-admin/browser/api.ts` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `apps/web-admin/presentation/composition-root.ts` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `apps/web-admin/presentation/controller.ts` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `apps/web-admin/presentation/screens/users.tsx` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `apps/web-admin/presentation/state.ts` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `packages/localization/src/workspace.ts` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `packages/testing/e2e/next-admin.spec.ts` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `packages/testing/workspace-controller.test.ts` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `packages/ui/README.md` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| MODIFIED | `packages/ui/src/table.tsx` | Connect selection/orchestration/transport lifecycle, localization, docs or regression coverage |
| ADDED | `apps/web-admin/presentation/bulk-state.ts` | Bulk state/controller/panel, failure contracts or bilingual operating guide |
| ADDED | `apps/web-admin/presentation/bulk-users.ts` | Bulk state/controller/panel, failure contracts or bilingual operating guide |
| ADDED | `apps/web-admin/presentation/screens/bulk-users.tsx` | Bulk state/controller/panel, failure contracts or bilingual operating guide |
| ADDED | `docs/development/bulk-user-status.md` | Bulk state/controller/panel, failure contracts or bilingual operating guide |
| ADDED | `packages/testing/bulk-users.test.ts` | Bulk state/controller/panel, failure contracts or bilingual operating guide |
| ADDED | `docs/verification/PHASE-D-BULK-2026-10-22.md` | This inventory/evidence/rollback checkpoint |

## Risks, rollback and continuation

P1 acceptance: new-head real PG/browser/security gates; any failure must be fixed,
not skipped. Per-record semantics deliberately allow partial success and require
operator review; there is no atomic batch contract. Network uncertainty requires a
fresh row/version before retry. Performance on 100k, full WCAG/manual/other browsers
and complete v1 scope remain unverified. No production-readiness claim.
Rollback is a reviewed code revert of this isolated scope; no DB migration/down or
data cleanup is required. Next: exact-head CI, inspect actual results/screenshots,
record counts/head/run, then remaining Phase D components/docs/gallery and Phase E/F/G.
