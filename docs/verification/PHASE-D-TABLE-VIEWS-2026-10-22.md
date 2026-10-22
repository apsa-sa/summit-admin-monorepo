<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase D increment — account-owned table views and Arabic reflow

Reference before implementation: d35c3d0b99c1f5b1531de90898a34471533347cf
on work/reference-admin-20261022 / PR7. Protected main remains
65e82cd2e89c328b8ab007a57c8c7030849eb507. Owner explicitly authorized continued
Phase D implementation under the original brief/standards. No merge, production
migration, deployment or release is performed.

## Inspect and root cause

Original brief §§4, 10b, 12 requires saved search/filter/sort/page/column preferences
and readable Arabic/mixed-text tables at mobile/200%. Direct inspection established
that query state lived only in URLs and column configuration was fixed. Actual
4bc799f CI screenshot showed short Arabic role/status labels breaking into separate
fragments because all table cells allowed anywhere wrapping without column minima.
This is new missing behavior and a directly observed presentation defect; retained
VERIFIED auth/drafts/admission/proof are regression-tested, not rebuilt.

## Changes and boundaries

- Typed preference DTO/store port → strict runtime schema → application service →
  PostgreSQL adapter, constructor DI at existing composition roots. Per-account
  storage uses only the authenticated actor ID, never an input owner ID.
- Additive migration 003, fixed schema constraints/FK and version guard. Journal
  expectation changes from 2 to 3 because one ordered migration was added; no old
  assertion was removed. Applied migrations 001/002 remain unchanged.
- Transactional user/session authorization through commit, parameterized SQL,
  five-second statement timeout, exactly one optimistic writer. No write after
  completed revocation; installation separation retained. All valid roles can
  manage their own preferences; no user management privilege is granted.
- Separate presentation controller/panel; explicit Save/Reload and local edit
  preservation. Shared epoch protects pending preference/table results from logout,
  account change and 401. Repeated reload while busy cannot invalidate the active
  operation's sequence or leave it stuck. Direct URL query overrides saved query.
- Named keyboard-focusable table scroll region; sufficient user-table minimum width
  and unbroken short labels. Document overflow assertion is retained, not hidden.
  Shared design tokens, no copied palette/new dependency/new framework exception.

## Verification status at checkpoint

Local Node22.23.1/pnpm9: final pnpm check PASS, 76/76 units/contracts,
zero fail/skip. Next admin production build PASS; strict root unused
locals/parameters check, package artifact contracts, publication audit and diff
whitespace check PASS. Fresh locked CI install, real PostgreSQL (expected 30
results: 23 retained + 6 preference scenarios + parent) and 26 strengthened
Chromium cases still require execution on the proposed exact head. Expected
registration counts are not reported as execution results.

| Requirement | Status | Evidence / next gate |
|---|---|---|
| Account-owned query/column persistence | PARTIAL | Local contracts/build passed; direct PostgreSQL/Chromium CI pending |
| Conflict/network/logout/race behavior | PARTIAL | Unit scenarios added; final-head execution pending |
| Arabic/table/200% keyboard region | PARTIAL | Real browser measurements/screenshots required on new head |
| Retained unit/PG/proof/admin/browser/security gates | PARTIAL | Must execute on new exact head |
| All Phase D | PARTIAL | Bulk actions, remaining account/role/DX/gallery scope still open |
| Phase E/F/G and production release | NOT IMPLEMENTED/PARTIAL | Separate features, performance/recovery/licenses/RC/release gates |

## Cleanliness and compatibility review

No source file deleted; no old app/proof/adapter/migration removed. Reused native
Checkbox/Button/Table and localization, separated controller/schema/persistence/UI
responsibilities. No package/dependency/lockfile changes. No skip/only, compiler
suppression, explicit any, forced validation-bypassing cast, debug log or tracked
build/report archive added. Literal `as const` only preserves narrow enum types.
Strict unused checks and scope/diff scans are required again before upload.
Cleanup removes only reproducible ignored package build outputs through the
existing guarded builder; no database cleanup added in this increment.

## File inventory

| Change | Path | Reason |
|---|---|---|
| MODIFIED | `apps/web-admin/app/workspace.css` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/browser/api.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/presentation/browser-adapters.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/presentation/composition-root.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/presentation/controller.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/presentation/ports.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/presentation/screens/users.tsx` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/presentation/state.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/server/composition-root.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `apps/web-admin/server/http-controller.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `packages/core-rbac/index.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `packages/data-access/migration-runner.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `packages/localization/src/workspace.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `packages/testing/e2e/next-admin.spec.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `packages/testing/integration/login-admission.test.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `packages/testing/workspace-controller.test.ts` | Integrate account preferences, UI behavior or retained/new verification |
| MODIFIED | `packages/ui/src/table.tsx` | Integrate account preferences, UI behavior or retained/new verification |
| ADDED | `apps/web-admin/presentation/screens/table-preferences.tsx` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `apps/web-admin/presentation/table-preferences.ts` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `docs/development/table-views.md` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `packages/application/table-preferences.ts` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `packages/contracts/table-preferences.ts` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `packages/core/table-preferences.ts` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `packages/data-access/migrations/003_table_preferences.sql` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `packages/data-access/table-preference-repository.ts` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `packages/testing/integration/table-preferences.test.ts` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `packages/testing/table-preferences.test.ts` | Scoped preference contract/implementation, test or bilingual usage guide |
| ADDED | `docs/verification/PHASE-D-TABLE-VIEWS-2026-10-22.md` | This inventory/evidence/risk/rollback checkpoint |

## Remaining risks and next scope

P1 release scope: bulk actions, full account/role presentation, docs/gallery,
remaining shared components/Tailwind requirement; Excel/PDF/files/analytics,
full API/DX, 100k benchmark/recovery/license/SBOM and RC still require evidence.
P2: full manual WCAG and additional browser engines are not certified by these
Chromium/axe checks. No performance result claimed. New table is one small row
per account; all user list pagination remains server-side (existing eight-row
page), not an unbounded browser download.

Rollback: reviewed code revert on the isolated development branch. Leave additive
003 data/table in place; never edit journaled migrations or apply destructive
DOWN/cleanup to unknown databases. Old app/proof remain compatible. Next: inspect
fresh CI logs and actual four-mode/mobile table screenshots, fix any failure
without weakening assertions, record exact head/run, then proceed to remaining
Phase D scope under the existing approval.
