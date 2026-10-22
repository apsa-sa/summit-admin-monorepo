<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Tabular export contracts / عقود التصدير

CSV/XLSX retain their verified contracts. PDF adds a local Chromium renderer;
its exact-head browser and visual acceptance must be recorded before approval.

Authenticate to the installation, then use the same-origin session cookie:

```http
GET /api/users/export?locale=en&search=Summit&role=viewer&status=active&sort=name
```

The API authorizes `users:export` on the server (admin/editor; viewer denied).
`search`, `role`, `status`, `sort` and `page` share user-query validation. Export
retrieves the filtered result rather than only the visible page. The repository
caps it at 10,000 rows; narrow filters if it returns `export_limit`. This limit is
not proof of the owner's separate 100,000-record performance requirement.

Success is 200, `text/csv; charset=utf-8` and
`Content-Disposition: attachment; filename="summit-users.csv"`. Bytes start with
the UTF-8 BOM. Columns are name/email/role/status, with AR/EN header labels;
`locale=en` selects English and the existing default is Arabic. Cell quotes are
escaped, and leading formula-like input is neutralized as text. Password/session
fields are not exported. Keep `Cache-Control: no-store` and `nosniff` intact.

Failures return `application/json` with no attachment disposition:

```json
{"error":"invalid_sort","requestId":"<request-id>"}
```

Typical statuses: 401 unauthenticated, 403 forbidden, 422 invalid query or
export_limit, and sanitized 500 internal_error. `X-Request-Id` matches the body.
Do not treat a failed request as a downloadable CSV, retry uncertain writes,
show underlying database diagnostics or expose another account's session.
A download is a read operation; existing write-origin checks remain required
for login/logout and all mutations.

The native client and reference Next adapter share the same class controller.
`AdminApiClient.exportUrl(locale, search, role, status)` generates the current
filtered export link. Custom consumers should validate response status/MIME before
saving bytes. Add new formats behind an explicit typed exporter contract and
retain all existing response/security/consumer regression tests.

العربية: يوضح القسم الأول عقد CSV المتوافق مع التطبيق السابق. تُراجع الصلاحية على الخادم، ويشمل التصدير
النتائج المصفاة بحد 10 آلاف سجل. الأخطاء JSON بلا ترويسة تنزيل؛ التحقق النهائي من PDF وقياس
الأداء على 100 ألف سجل أعمال متبقية، ولا تُعرض على أنها مكتملة.

## Excel / XLSX

Use `GET /api/users/export?format=xlsx&locale=ar` with the same scope parameters.
The exact MIME is `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
and the filename is `summit-users.xlsx`. This is an OOXML ZIP workbook, not renamed
CSV. Four text columns have localized headers and role/status values, Arabic RTL
sheet view, fixed header row and filter. Every value is an inline string: a user
value beginning with `=`, `+`, `-` or `@` cannot become a spreadsheet formula.
No macros, external relationships or hyperlinks are emitted. Invalid Unicode
is rejected; control/literal-escape handling follows SpreadsheetML string rules.
The same 10,000-record database export cap and server `users:export` permission
apply. Unsupported formats/locales return 422; a custom composition missing its
binary provider returns 503 `export_unavailable`. Neither error is an attachment.

The reference class UI controls both downloads: HTTP/MIME/filename/signature and
32 MB read bound are checked before saving. It keeps filters and edits in place
on failure, displays progress/errors, prevents duplicate active downloads and
allows an explicit retry. Ending the session cancels transport; late prior-account
responses cannot save a file. The browser adapter owns/revokes its temporary URLs.
Real hrefs remain as fallback; full no-JavaScript admin operation is not claimed.

`BinaryUserExporter` in `packages/contracts/exports.ts` is the provider port;
register class providers in `AdminCompositionRoot`. Runtime ZIP dependency
fflate is pinned at 0.8.3 (MIT, zero runtime dependencies). Its notice and the
compatibility decision are in `THIRD_PARTY_NOTICES.md` and ADR-0004. No mandatory
provider account or subscription is required.

العربية: ينشئ Excel ملف XLSX فعلياً بالنطاق والصلاحية نفسيهما، مع خلايا نصية
واتجاه عربي وعناوين مترجمة. لا يُحوّل المدخلات إلى صيغ، ولا يخرج المستخدم من
الواجهة عند فشل التنزيل. تتطلب إضافة PDF اعتماد اختبارات الطباعة الفعلية أدناه.

## Arabic PDF and operator setup

`GET /api/users/export?format=pdf&locale=ar` applies the identical server permission,
filters and sort, returning `application/pdf` and `summit-users.pdf`. At most 1,000
filtered records are rendered; `pdf_export_limit` is a 422 JSON response, never a
truncated document. Narrow the filters or use CSV/Excel (10k cap). The reference
UI validates the PDF signature and uses the same controlled download lifecycle.

The installation runs Playwright's pinned local Chromium; install its system
requirements/browser after frozen dependency installation:

```sh
pnpm exec playwright install --with-deps chromium
```

This requires an operator permitted to install host packages, or a prepared
container. No remote PDF service, provider account or subscription is required.
Missing/incompatible browser runtime returns sanitized 503 JSON rather than a
corrupt download. Install in the same runtime user/environment as the server.
Deploy Chromium using your host/container isolation and resource policy; the
reference prints only its own escaped HTML, never arbitrary URLs or input HTML.

Fonts are embedded at package build time from the existing licensed Noto Sans
Arabic files; no network font request or runtime filesystem font path is needed.
Arabic/Latin mixed text uses bidi isolation. Headers repeat on printed pages;
PDF output uses the approved light palette for legibility independent of UI mode.
Printing waits for fonts, owns/closes its browser/context, blocks script and network
access, excludes application secrets from the browser process environment, has a
10s render watchdog after a 5s launch deadline and a 16 MB result cap. The client
allows a bounded 20s request for PDF. Database-backed nonblocking advisory admission
permits one concurrent PDF per installation, even across separate Next request
roots; another installation is independent. Busy returns 429 with explicit retry,
no hidden global process pool or database migration. Rendering errors release the
lease by rollback and close owned browser resources. Normal server DB credentials
remain subject to the existing TLS/least-privilege policy.

Generated PDFs are downloads, not retained by the application. The four bilingual/
theme journeys save synthetic PDFs only as short-lived CI verification artifacts.
PDF visual/text review and host security/resource verification remain explicit
acceptance evidence; the presence of a `%PDF-` prefix alone is insufficient.
