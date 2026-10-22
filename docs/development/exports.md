<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# CSV export contract / عقد التصدير

The current implemented exporter is CSV. Excel and PDF remain unimplemented in
the verified feature branches; do not advertise buttons or API formats for them.

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

العربية: CSV هو التصدير المنفذ حالياً. تُراجع الصلاحية على الخادم، ويشمل التصدير
النتائج المصفاة بحد 10 آلاف سجل. الأخطاء JSON بلا ترويسة تنزيل؛ Excel وPDF وقياس
الأداء على 100 ألف سجل أعمال متبقية، ولا تُعرض على أنها مكتملة.
