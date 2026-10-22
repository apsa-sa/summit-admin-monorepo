<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase D — retained native browser compatibility correction

Baseline: 99faed964fa30a45b2d47d50470d2fc5efc4d998 / PR7.
Observed CI: https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39824857279
76/76 units/contracts, 30/30 real PostgreSQL, builds/security gates PASS;
Chromium 18 PASS / 8 FAIL. All eight Next admin cases (including saved columns,
URL priority, account isolation, conflict reload and mobile 200%) passed. All eight
retained standalone DOM cases failed at the initially disabled login button.
No failed assertion is skipped, weakened, or treated as acceptable completion.

## Root cause and bounded repair

The shared AdminApiClient gained a runtime import of core/table-preferences.js.
The original native-ESM browser server intentionally serves an explicit asset
allowlist; that new core module was not served, so the browser module graph could
not load and the original app never reached initialization. Compilation alone did
not validate that its emitted dependency graph could actually be served.

Response validation now lives in the already-served ResponseContracts module.
The application input validator delegates to that same strict schema and maps
contract violations to 422; API response violations remain invalid_response.
No core/server module, source directory or arbitrary file is exposed publicly.
The new input schema's allowed fields/ranges/columns are retained, with a single
runtime parser rather than duplicated client/server validation logic.

The temporary internal column/parser implementation in the newly introduced core
file is replaced by delegation after repository call-site review: only its own
parse method called column(); all actual consumers use defaults()/parse(). No
previously released source, old adapter, proof, migration or test is removed.

Added a build gate that parses the **compiled** standalone entry's static ESM graph
with Node22's SourceTextModule, without linking/evaluating browser code. The flag
--experimental-vm-modules is scoped to this build-only contract process; it changes
no app runtime, framework boundary, dependency version or strictness setting.
The pinned TypeScript7 distribution exposes no compiler AST API; it is not bypassed
or downgraded. No parser dependency or any/cast/compiler suppression was introduced.

Four build-contract tests exercise import/reexport/cycle traversal without executing
code, reject the original missing-module failure, reject external/bad syntax/MIME,
and verify all five actual compiled/served modules. Runtime/dynamic behavior remains
covered by real browser tests; a static graph gate does not replace them.

## Files and verification

MODIFIED: apps/web-admin/browser/api.ts (remove unserved runtime dependency),
packages/contracts/decoders.ts (strict shared preference codec),
packages/core/table-preferences.ts (input validation adapter), package.json
(add emitted native-browser graph build check; no dependency/lockfile change).
ADDED: tooling/browser-module-graph.ts (parse/read port),
tooling/scripts/browser-asset-contract.ts (four positive/negative contracts),
this report. Source files deleted: NONE. Original asset allowlist unchanged.

Local account integration tree: pnpm check PASS: 77 unit/contract tests plus four
separate browser-asset build contracts, zero fail/skip; Next production build and
strict unused/type checks PASS. PR7-only isolated correction preflight also PASS: 76 units/contracts plus four
separate asset contracts, strict unused/type checks and Next production build.
The account head c80862b, run 39826609348, independently passed all eight Next
cases including four-mode profile edits/reloads/axe; it had the same eight native
browser failures and is not accepted as a green combined release.
PR7-only correction and combined account candidate must each receive fresh
exact-head CI acceptance before VERIFIED status. No prior
result certifies a changed head. Actual 99faed9 screenshots inspected: Arabic short
role/status words remain intact; mobile scroll region is focused/contained. These
images contain marked synthetic/XSS fixtures and are verification evidence, not
public marketing screenshots.

| Requirement | Status | Next evidence |
|---|---|---|
| Retained native browser module compatibility | PARTIAL | Actual four-contract local gate PASS; full retained E2E on correction required |
| Saved views PostgreSQL and Next behavior | PARTIAL | 99faed9 30 PG / 8 Next cases PASS; repeat on correction |
| Final correction acceptance | PARTIAL | Fresh install/build/unit/PG/26 browser/security gates required |
| Complete Phase D/release | PARTIAL | Remaining bulk/components/docs/gallery, E/F/G and owner release gates open |

Cleanliness: no extra asset exposure, duplicate parser, debug output, tracked build
artifacts, test skip/only or source deletion. All old assertions preserved.
Rollback: reviewed code revert on the isolated branch; database schema/data need
no change for this correction. Never roll back the immutable migration journal.
Next: run full CI on PR7 correction, carry it into the stacked account PR preserving
both histories, inspect artifacts and record the exact tested heads/runs/counts.
