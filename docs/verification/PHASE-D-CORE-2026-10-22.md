<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase D — reference Next admin core journey

Status: PARTIAL — local engineering gates pass; combined-head CI/browser/PG
acceptance pending. This is a core journey increment, not closure of all Phase D
or the release. Main reference remains 65e82cd2e89c328b8ab007a57c8c7030849eb507.

## Authorized inputs and preserved work

Owner continuation approved ADR-0003 alternative 1 on 2026-10-22, conditional on
engineering correctness. The authorization and executed cleanliness review are
recorded in commit 8f0a9a5 on the decision branch. This working integration
preserves exact prerequisite histories: PR4 a168883, PR5 e33cb7d, ADR 8f0a9a5.
It changes no main/ref protection, rewrites no history, and deploys nothing.
The old DOM app, its server/routes, Next proof and initial migration remain.
The old broad local candidate 32b4abd is not bulk-imported or represented as tested.

## Implemented behavior

- Real Next App Router admin, class-method exports within authorized R1–R4,
  class interactive screens and class error/not-found components. R5/R6 docs app
  remains NOT IMPLEMENTED in this increment. No functional React UI or hooks.
- Built @summit/ui, localization and tokens consumed by public names, not source
  aliases. Existing pinned React/DOM/Next versions are reused; no new versions.
- Request-scoped root selects shared PostgreSQL login admission. Original typed
  auth/users/draft/audit/CSV controller and policies provide server enforcement.
- Initial cookies/SSR document locale/theme and decoded authenticated user DTO;
  client revalidates sessions. CSP nonce/security headers, no serialized service.
- Login/logout with explicit failed logout retry, default-deny UI affordances,
  direct view/query URLs and browser history, responsive nav, permission-filtered
  command destinations, localized preferences, real server list/filter/sort/page,
  class Drawer create/edit, deletion confirmation, server audit and authorized CSV.
- Existing account-scoped autosave reused. Shared session epoch prevents late table
  responses after logout or draft 401 from repopulating cleared account state.
  Explicit retries preserve edits; no uncontrolled request retry loops.
- Login native form fallback is POST, avoiding password-bearing GET URLs if JS
  is unavailable. Full no-JavaScript authentication is not claimed.

## Actual local checks

Node 22.23.1 / pnpm 9.0.0. Strict shared/root checks, 67/67 unit/contract tests
(62 combined retained + 5 new), zero fail/skip, original browser build and real
pack tarballs passed. Tokens 28, localization 7, UI 23 packed files.
Next admin production build passed, including class page/layout/route/proxy
exports and class client graph. App typecheck additionally enforces unused
locals/parameters and explicit overrides. Frozen offline lockfile-only validation
passed in an isolated manifest copy; fresh CI install still required. Local
node_modules reuse is not reproducible-install evidence. Publication audit passed.

26 Chromium cases are registered (18 retained + 8 new); no new browser or PG
success is claimed until the combined proposed head executes in CI. The 23 real
PG results from PR5 remain mandatory regressions on that head. New E2E covers
four modes/full core journey, viewer/editor direct API protection, CSRF, offline
retry/mobile/200%, SSR without JS and shared admission across fresh requests.
CI preserves generated synthetic screenshots/traces; no public product image is
published before inspection and correct locale/theme naming.

## Cleanliness and change inventory

New multi-screen presentation was split into separate class modules by
responsibility; views.tsx is a public barrel. Native UI primitives are imported,
not duplicated. Strict unused checks passed after the split. Existing prototype
assets remain intentionally used by the preserved standalone app; no blind
removal or global formatting of prior sources. Source files deleted: NONE.
Generated admin declarations/build/test outputs are ignored. No test skip, only,
compiler suppression, debug trace or any escape hatch is introduced.

| Change | File | Purpose |
|---|---|---|
| MODIFIED | `.github/workflows/ci.yml` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| MODIFIED | `.gitignore` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| ADDED | `apps/web-admin/app/api/[...path]/route.ts` | Approved class-method entries and class error/not-found UI; token-based layout |
| ADDED | `apps/web-admin/app/error.tsx` | Approved class-method entries and class error/not-found UI; token-based layout |
| ADDED | `apps/web-admin/app/layout.tsx` | Approved class-method entries and class error/not-found UI; token-based layout |
| ADDED | `apps/web-admin/app/not-found.tsx` | Approved class-method entries and class error/not-found UI; token-based layout |
| ADDED | `apps/web-admin/app/page.tsx` | Approved class-method entries and class error/not-found UI; token-based layout |
| ADDED | `apps/web-admin/app/workspace.css` | Approved class-method entries and class error/not-found UI; token-based layout |
| MODIFIED | `apps/web-admin/browser/api.ts` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| ADDED | `apps/web-admin/next.config.ts` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| ADDED | `apps/web-admin/next/document.tsx` | Authorized framework/request adapter; approved DTOs and existing server controller |
| ADDED | `apps/web-admin/next/initial-session.ts` | Authorized framework/request adapter; approved DTOs and existing server controller |
| ADDED | `apps/web-admin/next/page.tsx` | Authorized framework/request adapter; approved DTOs and existing server controller |
| ADDED | `apps/web-admin/next/preferences.ts` | Authorized framework/request adapter; approved DTOs and existing server controller |
| ADDED | `apps/web-admin/next/route.ts` | Authorized framework/request adapter; approved DTOs and existing server controller |
| MODIFIED | `apps/web-admin/package.json` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| ADDED | `apps/web-admin/presentation/browser-adapters.ts` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/presentation/composition-root.ts` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/presentation/controller.ts` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/presentation/draft-presenter.ts` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/presentation/ports.ts` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/presentation/screens/audit.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/screens/draft.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/screens/login.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/screens/overview.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/screens/screen.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/screens/settings.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/screens/user-editor.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/screens/users.tsx` | One class screen per responsibility; shared UI primitives and typed screen props |
| ADDED | `apps/web-admin/presentation/state.ts` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/presentation/views.tsx` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/presentation/workspace.tsx` | Typed state/presentation ports, constructor DI, session epochs and explicit lifecycle |
| ADDED | `apps/web-admin/proxy.ts` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| ADDED | `apps/web-admin/tsconfig.json` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| MODIFIED | `package.json` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| MODIFIED | `packages/localization/src/index.ts` | Immutable bilingual workspace/error catalog exported by built localization package |
| ADDED | `packages/localization/src/workspace.ts` | Immutable bilingual workspace/error catalog exported by built localization package |
| MODIFIED | `packages/testing/e2e/journey-fixture.ts` | Preserved regression contracts plus new behavior/failure/real-browser coverage |
| ADDED | `packages/testing/e2e/next-admin.spec.ts` | Preserved regression contracts plus new behavior/failure/real-browser coverage |
| ADDED | `packages/testing/workspace-controller.test.ts` | Preserved regression contracts plus new behavior/failure/real-browser coverage |
| MODIFIED | `playwright.config.ts` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| MODIFIED | `pnpm-lock.yaml` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| ADDED | `tooling/scripts/run-next.mjs` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |
| MODIFIED | `tsconfig.json` | Build/runtime/consumer integration, exact lockfile, CI or generated-output protection |

## First combined CI and reflow correction

Commit 424d714, push run 39819476166: clean installation, 67 units/contracts,
23 real PostgreSQL results, bounded proof and final admin production builds,
publication/advisory/Gitleaks gates passed. Browser result: 25/26. All four real
Next login/draft/Drawer CRUD/audit/CSV/revocation modes, viewer/editor/CSRF,
SSR/no-JS/shared-admission and retained cases passed. The remaining mobile 200%
assertion caught horizontal overflow; it is not skipped or weakened.

Retrieved the actual trace screenshot: the compound Commands + keyboard-hint
button exceeded the narrow topbar due to intrinsic flex minimum sizes. Corrected
min-inline-size constraints and enabled wrapping of compound button children,
including grid field minima and long-content wrapping. No overflow hiding,
viewport enlargement, font-size reduction or assertion relaxation. Added a named
mobile-200 screenshot before the same overflow assertion for inspectable evidence.
All gates must pass again on the corrected head before accepting this increment.

## Remaining work, risk and rollback

P1: direct combined-head fresh install, PostgreSQL, browser, security/advisory/
secret gates; correct any failure before accepting this core increment. Further
Phase D includes persisted table preferences/columns/bulk UX, full account/settings
and role/permission presentation, docs/gallery integration and any unproven states.
The original Tailwind requirement is still PARTIAL; no new unreviewed toolchain
was added merely to make a build pass. The full design system/manual WCAG and
other browser engines are not certified by current automated checks.

Phase E exports Excel/PDF, files, full reference analytics, API/extension docs,
Phase F 100k benchmark/recovery/security/license/SBOM, and Phase G RC/release remain
PARTIAL/NOT IMPLEMENTED as applicable. No production readiness claim.

Rollback: close the isolated implementation PR or use a reviewed application-code
revert; original app/proof remain runnable. Additive login tables can remain;
never apply destructive down migrations or clean unknown databases. Continue
within the owner-authorized architecture, then rerun all gates on the final head.
