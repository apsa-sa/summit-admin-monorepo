<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Account and capability presentation / الحساب والصلاحيات

The Next reference admin Preferences page displays the authenticated account DTO:
name, email, role, status, version and creation instant. No invented profile fields,
password editor, identity provider integration or mutable role-builder UI is exposed.

**Edit account profile** reuses the real user Drawer and PUT user contract only
when AuthorizationPolicy permits that exact resource/input. The current starter
allows administrators and editors to update permitted name/email records, including
their own; viewers have no user-write permission. The self role/status controls are
locked in the UI and forbidden by the server. Confirmed self updates replace the
workspace user DTO before reporting success; a subsequent reload reads PostgreSQL.
The existing server transaction, optimistic version, unique-email rules, audit event
and session/revocation checks are reused unchanged.

Current role capabilities come from the same AuthorizationPolicy grant catalogue
used by require(), not a second UI permission array. This is a coarse capability
summary: resource-specific restrictions still apply. For example, users:delete does
not permit deleting yourself or an administrator. There is no API grant from hiding
or displaying a button. Role/status administration uses authorized user edits;
changing those fields revokes the target sessions under the retained server contract.

Original auth/user/security tests remain mandatory. All four locale/theme browser
journeys additionally verify actual self edits, locked role/status controls and
persistence through reload; the viewer case verifies its own three capabilities
and absence of the profile mutation button. This is a development increment, not
certification of all account/recovery/security flows or a production release.

## العربية

تعرض صفحة «التفضيلات» بيانات الحساب الفعلية وصلاحيات دوره من السياسة نفسها المستخدمة
في فحوص الخادم. يتاح «تعديل بيانات الحساب» عندما تسمح صلاحية تعديل المستخدم بهذا
السجل؛ حساب المشاهد لا يملك هذه الصلاحية. يُقفل تغيير دور الحساب وحالته ذاتياً في
الواجهة والخادم. لا تُعرض نتيجة الحفظ إلا بعد تأكيد الخادم، وتُحدث بيانات الحساب
المعروضة من الاستجابة المؤكدة. تبقى قيود السجلات وإبطال الجلسات مطبّقة؛ قائمة الصلاحيات
المعروضة ليست إذناً لتجاوزها. لإدارة الدور والحالة استخدم تعديل المستخدم المصرّح به.
