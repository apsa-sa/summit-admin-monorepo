<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Account-owned user table views / عروض جدول المستخدمين

This development feature is part of the reference Next admin, not an approved release.
Start from the pinned Node/pnpm setup in README. On your own isolated development
installation, apply `pnpm db:migrate`, then run `pnpm admin:dev` (loopback port 3212).
Migrations are explicit; starting the app never migrates a database automatically.
The legacy DOM app and bounded Next proof remain available under their existing scripts.

## Use and behavior

Open Users → Visible columns. Name stays visible and actions remain controlled by
RBAC. Other fields may be hidden. **Save table view** stores the current search,
role/status filters, sort, page and visible columns for the authenticated account.
It reports success only after server confirmation. Search input is included even
if its Search button has not yet been submitted; submitting Search applies it to
the current page. Column visibility does not alter export authorization or fields.

Reloading `/?view=users` restores the saved query/columns. An explicit query control
in a direct URL takes precedence over the saved query; omitted query controls then
use normal defaults. Columns still come from the account's saved view. Navigation
and browser history keep their explicit URL state. **Reload saved table view**
replaces local query/column edits with the server-confirmed version and reloads rows.
A conflict blocks further saves until that explicit reload; network failures retain
local edits and allow another explicit Save. There is no automatic retry/write queue.

The table has a named, keyboard-focusable scroll region. Narrow screens and 200%
text keep document reflow while allowing two-dimensional table content to scroll.
Short Arabic role/status labels stay intact. Long names/emails remain plain text;
existing XSS and mixed-direction regression cases remain enabled.

## Additive API contract

- `GET /api/preferences/users`: authenticated user's view, or defaults at version 0.
- `PUT /api/preferences/users`: same-origin JSON, expected version; returns confirmed
  view with incremented version. No user/installation ID is accepted in the body.
- Request and response: `UserTablePreferences` in `packages/contracts/table-preferences.ts`.
- Columns: unique subset of name/email/role/status/created_at, always including name.
- Query: search ≤120 characters, validated role/status, page 1–100000, sort name/created_at.
- 401: expired/revoked/missing session; 403: origin or policy denied; 409: version
  conflict (or exhausted version); 422: invalid/missing/extra fields. Unsupported
  methods return 405. Standard request IDs/no-store headers and body-size limit apply.

Application depends on the `TablePreferenceStore` port. PostgreSQL implements it
using parameterized queries, user/session locks through commit, optimistic updates,
and bounded statement timeout. The composition root wires services; no framework
entry, hook, dependency version or mutable global is added. Migration 003 adds one
account-owned table with FK/constraints. Applied 001/002 remain byte-for-byte unchanged.
Preference data may contain account-specific search text; it is never stored in
localStorage or copied to another account. Existing URLs may contain search text;
operators should keep query strings out of access logs according to their privacy policy.

## العربية

من «المستخدمون» افتح «الأعمدة الظاهرة»، ثم اختر الأعمدة واحفظ عرض الجدول. يبقى الاسم
ظاهراً، وتخضع أزرار الإجراءات للصلاحيات. يحفظ الخادم البحث والتصفية والفرز والصفحة
والأعمدة للحساب الحالي فقط. للرابط الذي يحتوي معايير بحث صريحة الأولوية على البحث
المحفوظ. زر «استعادة عرض الجدول المحفوظ» يستبدل التعديلات المحلية بالنسخة المؤكدة.
عند التعارض تُوقف الكتابة إلى حين الاستعادة؛ وعند انقطاع الشبكة تبقى التعديلات لإعادة
المحاولة يدوياً. انتهاء الجلسة يمسح سياق الحساب ويمنع الاستجابات القديمة من إعادته.
شغّل الترحيلات صراحةً على قاعدة التطوير المستقلة قبل تشغيل التطبيق. هذا جزء تطويري
مختبر ضمن مرحلته، ولا يمثل اعتماد المشروع كله للإطلاق.
