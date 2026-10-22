<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase E — local Arabic PDF increment

Baseline: Excel head 58085ffe09c341e006e783cf58429aa95b71010e, incorporated in
main merge 5b70718771408fb2e0567e212d1958ac0a611d69. This increment preserves
that source/history and its separate export-state correction.

Gap: no actual Arabic PDF. Added typed print/admission ports, escaped/localized
PdfDocument, injected PdfExporter, bounded Chromium infrastructure printer and
PostgresExportLease. Composition root wires the actual provider; application and
browser contracts/metadata/UI/localization add only the implemented format.
Design-token asset builder emits print-fonts.js/declarations from existing OFL
assets; package exports/real tarball contract verify actual output. Exact existing
Playwright 1.64.1 resolution is now declared by runtime consumers; no dependency
upgrade or new lock package/snapshot. Next externalizes the server runtime only.

Added tests: PDF HTML escape/locale/font/bounds/provider lifecycle, HTTP metadata/
renderer failure and denied viewer, real-PG contention/installation isolation/
commit+rollback release. Four existing Next journeys now download actual PDFs;
viewer direct PDF is denied. CI retains actual synthetic PDF artifacts for
independent text/visual QA. Existing assertions and original apps/proof remain.

Local 117 unit/contracts + 4 asset contracts PASS before final exact-head run;
admin production build PASS at initial provider checkpoint. Final complete builds,
frozen installation, security/audits, real PG/browser and visual verification must
be recorded on this PR's exact head. Overall PDF remains PARTIAL until then.
No true PDF has yet been visually inspected at this report checkpoint.

No source/history/schema deletion or new framework exception. No PDF files,
node_modules/build outputs or synthetic credentials committed. Owned browser
process/context/timer and transaction admission are closed/released. Font/license
notices preserved; upstream Playwright LICENSE/NOTICE copied verbatim. Remaining
P1: files/analytics/DX/localization acceptance. Remaining P0: 100k, recovery,
full license/SBOM/security/accessibility and owner RC approval. No production
release or launch announcement. Scoped source revert needs no data rollback.
