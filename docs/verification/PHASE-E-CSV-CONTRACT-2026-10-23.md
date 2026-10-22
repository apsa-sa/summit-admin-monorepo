<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase E — CSV HTTP failure contract

Date: 2026-10-23 (Asia/Riyadh). Baseline:
`6a9b4dccaf2afb180df7884fec4c06eda76436b5` (UI/Docs scope with strengthened logout
acknowledgement test). Branch: `work/export-response-20261023`.
Authorization: owner's original CSV/security/contract acceptance scope and
continuation order. No extra dependency, architecture exception or release action.

## Root cause and direct failing evidence

`AdminHttpController.handle` set Content-Type=text/csv and Content-Disposition
before awaiting `UserApplicationService.export`. Validation, authorization,
row-limit or storage failures then reached the shared JSON error handler with
those CSV headers still set. Response.json preserves an explicitly supplied
Content-Type; the result was JSON labelled/downloaded as CSV. An unauthenticated
request failed before entering the export branch and was unaffected.

A new protocol suite ran against the unchanged controller first: six tests,
two passed and four failed. The four failures were invalid_sort (422),
export_limit (422), forbidden (403) and sanitized unexpected storage failure
(500). Local raw logs are transient test output; no production data was used.
After awaiting export completion before setting success-only headers, the same
six tests pass, with no assertion removed or weakened. The success contract
retains exact attachment filename/MIME, Arabic/English header, UTF-8 BOM,
formula neutralization and exclusion of credential fields. The existing 401,
no-store, nosniff, request-id and sanitized error-code contracts are retained.

## Files and impact

- `apps/web-admin/server/http-controller.ts`: await the CSV into a local const,
  then assign CSV headers and construct the successful Response. Shared error
  handling, HTTP routes, RBAC, origin checks and application services unchanged.
- `packages/testing/export-response.test.ts`: six direct controller/service
  contracts using constructor-injected storage doubles. These prove HTTP error
  representation, not database row limits or real authentication. The actual
  policy/session services remain in the test composition; log assertions ensure
  underlying private diagnostics do not escape the API or structured logger.
- `packages/testing/e2e/admin-journey.spec.ts` and `next-admin.spec.ts`: retain
  every journey assertion, add actual authenticated invalid-filter export
  requests in all four locale/theme cases for both server consumers. Require
  422 application/json, no attachment and matching request-id error body.
- `docs/development/exports.md`: actual CSV consumer/API/error documentation,
  with explicit current format/limit/authorization and remaining formats.
- This report records evidence, limits, inventory and rollback.

No file/dependency/export/route/schema was deleted. No full-file reformat of the
old controller/native browser test, no generated output, broad cleanup, test
skip, `any` or forced type assertion. The defect is shared by the original
server and Next adapter; both are tested rather than replacing either consumer.

## Verification status at source checkpoint

- Direct red baseline: 2/6 passed, 4/6 failed with the original CSV header leak.
- Same contracts after correction: 6/6 PASS, zero failures/skips.
- `pnpm check`: PASS, 98 unit/contracts plus four native asset contracts, zero
  failures/skips; real packed ESM/types/CSS/notices verified.
- `pnpm admin:build`: PASS, production Next consumer.
- `pnpm audit:publication`: PASS, working tree and reachable local history
  signatures. Independent Gitleaks/dependency gates remain required in CI.
- Real PostgreSQL and Chromium on the committed head: GitHub Actions required;
  NOT RUN locally. No live PostgreSQL row-limit or 100,000-row performance claim.
- No new dependencies or database writes were required by the added protocol
  tests. Existing real database security/integration gates remain mandatory.

## Remaining work / rollback

VERIFIED locally: six CSV response protocol contracts after the fix.
PARTIAL: overall Phase E; CSV is one exporter, not Excel/PDF completion.
P1: Excel/PDF, uploads/storage and remaining original product features.
P0 launch: comprehensive release gates, performance/recovery/SBOM and owner RC
approval remain open. This repair does not certify production readiness.

Rollback: reviewed code revert of the scoped commit. No migration or data
reversal is required. Keep all tests and inspect the exact failing contract
before any alternative correction. Continue from the accepted feature branch;
main protection and the owner release process stay intact.

العربية: صُحح عقد أخطاء CSV كي تبقى الأخطاء JSON واضحة، وتُضاف ترويسات تنزيل
الملف بعد نجاح التصدير فقط. لا يشمل هذا التقرير ادعاء اكتمال Excel أو PDF أو الإطلاق.

The branch incorporates the ordinary merge of PR #11's cookie-header inspection
correction; all existing logout acknowledgement, cookie clearing and old-session
replay assertions remain. Exact-head CI must pass on the combined source.
