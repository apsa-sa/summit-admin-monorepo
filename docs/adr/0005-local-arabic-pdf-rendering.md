<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# ADR-0005 — bounded local Arabic PDF rendering

Date: 2026-10-23. Status: implemented, verification pending. Owner-authorized PDF
scope; no new framework entry exception. Extends ADR-0004's injected binary port.

Use existing pinned Playwright/Chromium 1.64.1 as a declared runtime consumer,
without changing its already locked resolution. Native text layout handles Arabic
shaping/bidi; the existing Noto Sans Arabic 5.2.8 OFL fonts are embedded as an
actual ESM/types print-font export built from the same assets as the design tokens.
PDF remains independent of remote services and runtime font filesystem discovery.
A Latin-only PDF library cannot prove readable Arabic. Adding another browser
engine or font-shaping stack would duplicate dependencies already present.

PdfDocument owns only escaped static HTML and approved light token styling;
PdfExporter composes it with PdfPrintPort and ExportLeasePort. ChromiumPdfPrinter
is infrastructure: owned context/process, JavaScript disabled, offline and all
routes aborted, fonts ready before print, bounded launch/render/output, sanitized
failures, no inherited application secrets. No arbitrary URL/HTML endpoint exists.
The operator supplies appropriate host/container isolation for the local browser;
target-host security review remains part of release acceptance.

A request-local semaphore would not limit concurrent Next roots. A PostgreSQL
transaction advisory lock provides nonblocking admission per installation, with
release on commit/rollback and idle transaction timeout. No mutable singleton,
service locator, schema change, subscription or cross-installation coordination.
1000-record PDF cap is explicit; CSV/Excel retain 10k and do not truncate silently.

The existing adapter route dispatches `format=pdf`; no React function/hook/new
Next boundary is introduced. Missing browser is a 503, busy a 429, cap a 422;
all remain JSON without attachment headers. Client uses a 20s bounded download
and separates transport errors from table-loading state.

Primary references:
- https://playwright.dev/docs/api/class-page#page-pdf
- https://playwright.dev/docs/api/class-browsertype#browser-type-launch
- https://www.postgresql.org/docs/17/explicit-locking.html#ADVISORY-LOCKS
- https://github.com/microsoft/playwright/tree/v1.64.1

Acceptance requires actual browser downloads, independent PDF parsing/rasterized
Arabic/mixed-text review, real PostgreSQL lease contention/isolation/release,
existing full gates and exact-head evidence. A PDF signature or unit double alone
is not acceptance. Roll back via reviewed scoped source revert; no data migration.
