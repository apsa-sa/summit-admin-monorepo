<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase E — actual Excel export and controlled downloads

Date: 2026-10-23 (Asia/Riyadh). Baseline: verified main
`dbd1919999b55826c555328373e3f981f94d5ffc`. Scope branch:
`work/export-formats-20261023`. Owner authorized the remaining original Excel/PDF,
files, analytics, DX and release-verification work. This report closes only the
bounded XLSX/download increment after its exact-head gates; no new framework
exception, production operation or deletion is authorized by this report.

## Inspected gap / implementation

CSV was the only implemented format. Users could navigate to a raw JSON error
through an ordinary export link. Direct binary transport also needed bounded
reads, cancellation and account-epoch handling. The historical unverified local
spreadsheet prototype was read but not blindly copied; it depended on obsolete
localization and silently removed characters. The implemented writer follows
current contracts, safe string encoding, localized roles/statuses and real styles.

- New portable format/provider/download interfaces: packages/contracts/exports.ts.
- New class SpreadsheetText preserves reserved escapes/controls and rejects
  malformed Unicode. SpreadsheetExporter emits six actual OOXML ZIP parts,
  string-only cells, AR/EN/RTL, styles, freeze and filter; 10k rows/4M text bound.
- UserApplicationService receives immutable duplicate-checked providers by DI;
  legacy CSV export remains. New download method uses the same policy and
  filtered server query; typed 422/503 errors stay JSON. Shared HTTP controller
  assigns successful artifact headers only after the awaited content exists.
- AdminCompositionRoot wires the actual XLSX provider. No migration or database
  write is required. The original server and Next adapter share the implementation.
- AdminApiClient's existing JSON deadline/session/receiver behavior is retained
  through a shared response consumer. Actual downloads validate HTTP, MIME,
  fixed filename, magic and capped stream size. BrowserDownload port/adapter
  owns URLs/timers. Workspace state/controller prevent duplicate downloads,
  preserve errors/filter context, allow explicit retry and ignore stale accounts.
- Next users view has real CSV/Excel links; translated progress/error/download
  messages are in the shared localization package. Viewer controls remain absent;
  server permissions do not depend on hidden UI. No unimplemented PDF control.
- turbo.json hashes imported server sources for the Next admin build. A source
  change outside default package inputs previously left the hash unchanged;
  the guarded probe now changes it and restores original bytes. No ignored
  dependency/cache files enter these scoped inputs.
- package.json/packages/exports/package.json/pnpm-lock.yaml add exact fflate
  0.8.3 and existing workspace-localization links, with no old resolution change.
  Upstream MIT license is copied verbatim under docs/licenses; notices and ADR-0004
  explain compatibility, alternatives, limits and the offline metadata situation.

## Direct tests / acceptance status

Local direct evidence at initial checkpoint:
- `pnpm check`: 112 unit/contracts, four native asset contracts, zero failed/skipped;
  strict types/build and actual packed ESM/declarations/CSS/notices PASS.
- Manifest-only frozen-lock/offline validation: PASS. First registry-resolution
  attempt had no offline fflate metadata; no successful registry install is
  inferred from it. Fresh GitHub Actions frozen install/audit is mandatory.
- Independent openpyxl reader opened actual generated AR/EN XLSX files and
  verified Unicode/mixed text, string cell type, dimensions, freeze/filter/RTL.
- Cache dry-run probe: before source-input fix, exporter change did NOT change
  admin task hash; after fix it DOES. Original bytes restored, no probe committed.
- Actual production proof/admin/docs builds and publication audit: PASS locally.
  Exact-head PostgreSQL/Chromium must be recorded in PR closure after execution.

Tests added/strengthened:
- HTTP CSV tests retained; XLSX success, 422 format/locale, missing provider,
  session/permission/row-cap error representation added.
- XML escaping/Unicode/control/literal escape handling; zero/max/oversize rows,
  text bounds, formula/macro/external-link absence and default CSV URL compatibility.
- Native receiver/scope, malformed MIME/filename/signature, oversized stream
  cancellation and session-end transport cancellation.
- Controller scope snapshot/concurrent click guard; privacy on delayed account
  response; failure/retry without navigation; session expiry cleanup.
- All four existing native and Next locale/theme journeys add real XLSX byte
  reads. A browser DOMParser independently checks every XML part, exact filtered
  row, header/direction, plain cells and no formulas/external relationships.
  Viewer direct binary request must be rejected, retaining all old assertions.

The writer/independent-reader local contracts are VERIFIED locally. Overall
feature acceptance stays PARTIAL until exact-head CI completes. Baseline main
success is not transferred to this feature head. No test skips or weakened
assertions were added; no mock is represented as real database evidence.

## Files / cleanup / compatibility

Changed code is confined to export contracts/implementation, user application
service and its server composition/controller, browser API and class presentation
ports/state/controller/adapter/composition/users view, localization, tests,
dependency manifests/lock and scoped Turbo inputs. Added docs: ADR-0004, this
report, exact upstream MIT notice and current export guide/third-party notices.

No source file, migration, proof, adapter or historic report was deleted. Existing
CSV method/provider/URLs remain compatible; the optional format/sort link
parameters are additive. JSON request behavior retains its tests and deadlines.
Owned object URLs/timers are released, not arbitrary application/global resources.
New workspace dependency aliases reused installed exact packages locally; CI must
prove fresh independent installation. No artifact under dist/.next/node_modules/
test-results or local logs is committed. No debug log, `any`, forced cast, global
mutable service, hook or expanded framework exception is introduced.

## Remaining scope / rollback

P1: actual Arabic PDF, upload/type/image/storage sample, complete reference
analytics, remaining UI/Tailwind/localization/DX acceptance. P0 launch: measured
100k records, isolated recovery drill, full license/SBOM, comprehensive/manual
accessibility/security release checks and RC/owner approval. These are not closed
by XLSX. Continue the authorized stages after exact-head verification.

Rollback via a reviewed scoped code revert; no schema/data reversal or cleanup.
Retain the old native app/proof and compatible CSV behavior. No stable Release,
production deployment or public launch announcement is included in this scope.
