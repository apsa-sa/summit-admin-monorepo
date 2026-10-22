<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# ADR-0004 — typed tabular downloads, first binary format XLSX

Date: 2026-10-23. Status: implementation decision inside the owner's approved
CSV/Excel/PDF scope; exact-head verification is required. No new framework-entry
exception; ADR-0003 R1–R6 remain unchanged. Baseline main: dbd1919.

## Decision and alternatives

The required users export has four text columns, at most 10,000 filtered rows,
and must not turn user input into formulas. Adopt a bounded class-owned
SpreadsheetML writer with pinned fflate 0.8.3 ZIP, rather than reimplementing
ZIP/CRC/DEFLATE. Upstream tagged metadata/license were read: MIT, no runtime
dependencies, Node ESM/types exports. Node 22.23.1, TypeScript 7.0.2, pnpm 9.0.0,
Next 16.4.2 and React 19.3.1 remain unchanged.

A full workbook editing/calculation/chart library adds surface not required by
this writer. Hand-built ZIP duplicates mature infrastructure; renamed CSV is not
XLSX. Actual XML parsing/downloads and an independent openpyxl reader verify the
file. No arbitrary Excel editing, macros, formulas or external relationships
are promised. The OOXML workbook/worksheet/relationship structure follows the
Microsoft reference below. Values use inlineStr; reserved ST_Xstring escapes and
controls are preserved, malformed Unicode rejected. Headers/roles/statuses are
AR/EN, with RTL sheet view, freeze, styles and filter. Rows/text/owned ZIP paths
are bounded. PDF follows as a separate real renderer, not a placeholder button.

## Application and browser boundaries

BinaryUserExporter keeps application services independent of ZIP, Next, React
and PostgreSQL. Providers enter at the composition root. Existing CSV render and
export contracts remain; shared HTTP headers are assigned only after successful
content creation. Invalid formats/locales return typed JSON, never attachments.

The class UI intercepts accessible download links, preserving real href fallback.
The API shares existing bounded/cancellable transport, validating MIME, filename,
signature and a 32 MB stream limit. Error JSON stays in the workspace instead of
navigating away. The controller snapshots scope and session epoch, rejects
concurrent duplicate requests and ignores late account responses. An injected
browser adapter owns/revokes URLs/timers. No hooks, global registry or automatic
retry. Server authorization remains authoritative.

## Dependencies and build compatibility

fflate is runtime-only in packages/exports and the exact same version is a root
development dependency for archive tests. Existing localization is a workspace
runtime dependency. Existing lock package/snapshot entries stay unchanged; only
these importer links and one pinned resolution/snapshot are added. Offline local
registry metadata was unavailable; the existing exact package/integrity were
inspected and a manifest-only frozen lock validation passed. Fresh CI install,
advisory audit and full gates remain mandatory.

The admin imports server packages using existing relative contracts. Its build
must hash those sources, too: default package-local inputs can miss export-only
changes. A source-hash dry-run probe checks this before/after explicit app inputs,
without node_modules, dist, .next or secrets, and restores probe bytes exactly.
No global cache disabling or new toolchain version is introduced.

References:
- https://github.com/101arrowz/fflate/releases/tag/v0.8.3
- https://github.com/101arrowz/fflate/blob/v0.8.3/package.json
- https://github.com/101arrowz/fflate/blob/v0.8.3/LICENSE
- https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document
- https://turborepo.dev/docs/crafting-your-repository/configuring-tasks

This bounded decision does not close PDF, uploads, analytics, 100k/recovery,
license/SBOM or RC. No database, old app/proof or source history is removed.
Rollback is a reviewed scoped code revert; no schema/data reversal is required.
