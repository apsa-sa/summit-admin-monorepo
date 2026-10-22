<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase D increment — confirmed account profile and real capability summary

Baseline before changes: 99faed964fa30a45b2d47d50470d2fc5efc4d998,
work/reference-admin-20261022 / PR7. Owner approved continuation under original
brief §§4, 8, 10c. Main 65e82cd remains protected/unmodified; no merge/deployment.
The table-view increment's final PG/browser CI acceptance is still pending at this
checkpoint. Its code/history is preserved; this is a subsequent scoped increment.

## Gap and changes

Preferences previously displayed only email and locale/theme controls. There was
no current capability summary, and the workspace controller discarded a confirmed
self-update DTO. Added separate class AccountPanel/PermissionPanel, preserving SRP
and reusing the existing Drawer/API/authorization. Own-profile editing is offered
only through existing resource/input policy, with self role/status locked; viewers
remain read-only. Successful saves update the account DTO only on the same epoch.

AuthorizationPolicy now owns one per-instance readonly grants catalogue shared by
require()/actionsFor(). Grant values and all resource/self/status/delete restrictions
are unchanged from the table-view head. It returns a copy to the UI; no mutable
global, alternate authorization source, new permission, dependency or framework
entry is introduced. Localized hint explicitly distinguishes coarse capabilities
from record restrictions; server remains authoritative.

## Files and compatibility

ADDED: apps/web-admin/presentation/screens/account.tsx (real account DTO/policy UI),
apps/web-admin/presentation/screens/permissions.tsx (coarse policy summary),
docs/development/account-preferences.md (bilingual usage/limits), this report.
MODIFIED: screens/settings.tsx (compose panels), presentation/controller.ts
(expose capabilities/retain confirmed self DTO), packages/core-rbac/index.ts
(single-source catalogue, identical grants/restrictions), localization workspace.ts
(AR/EN labels), workspace.css (logical responsive definition list),
workspace-controller.test.ts (confirmed profile/policy/logout regression),
next-admin.spec.ts (retained four-mode self edit/reload and viewer capability checks).
DELETED: NONE. No migration/schema/lockfile/package/dependency change in this increment.

## Executed local evidence / acceptance

pnpm check: 77/77 units/contracts PASS, zero fail/skip. Existing user/RBAC/session
assertions retained. Strict root unused checks, package contracts, Next admin production build,
publication audit and diff checks PASS on this local candidate; fresh CI real PostgreSQL/browser/security acceptance is
not inferred from local tests or the preceding head. Expected retained registration:
30 PostgreSQL results and 26 Chromium cases, strengthened rather than skipped.

| Requirement | Status | Evidence |
|---|---|---|
| Confirmed own profile DTO / policy summary | PARTIAL | Local 77 tests; final CI pending |
| Server role/self/resource restrictions | PARTIAL | Retained tests mandatory on same proposed head |
| Four-mode account edit/reload and viewer controls | PARTIAL | Browser scenarios added; CI pending |
| Complete Phase D | PARTIAL | Bulk operations, remaining component/gallery/docs and unproven states remain |
| Release readiness | NOT IMPLEMENTED | Full E/F/G acceptance and explicit release approval outstanding |

## Cleanliness, risks, rollback and next

Separate panel/controller/policy responsibilities; no duplicated grant values in
presentation (only label mapping), no dead route or fake action. No source deletion,
compiler suppression, test skip/only or debug output. Scoped formatting only in
changed owned files. Strict unused scan/diff inspection retained. Generated output
ignored; no data cleanup or production database operation added.
P1 release gaps remain in full Phase D/E/F/G scope; no new critical issue claimed.
P2 manual accessibility/other browser coverage remains unverified. No performance
or complete WCAG claim. Roll back via reviewed code revert on this isolated branch;
no database rollback needed for this increment. Next: exact-head CI, inspect actual
screenshots/errors, record counts/run/head and proceed within approved scope.
