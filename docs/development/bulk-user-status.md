<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Page-bounded bulk status / تغيير حالة عدة مستخدمين

The reference admin selects at most eight eligible records from the currently
loaded server page. Choose Active or Suspended, select rows and review their names
in the confirmation dialog. The existing user update policy must permit each
specific resource/input; viewers/editors cannot acquire status-write permission
through selection. Self status changes remain forbidden. Selection is transient,
cleared by query/page/navigation changes and logout, and never stored in preferences.

## Transaction semantics

This is an explicit **per-record** workflow over the existing versioned PUT user
contract, not an atomic batch endpoint. Each successful update commits its own
transaction/audit event and revokes target sessions when status changes. The next
record starts only after acknowledgement. No new server grant, broad update SQL,
user-ID filter, dependency, schema or framework exception is introduced.

The first rejection or unknown outcome stops further writes. Results distinguish:

- Updated on server: matching ID, role, requested status and next version confirmed.
- Rejected by server: an authoritative 403/404/409/422/429 rejection.
- Unconfirmed: timeout/network/5xx/malformed acknowledgement. The write may have
  committed; reload confirmed rows before an explicit retry. Never assume rollback.
- Not attempted: no request was sent for that remaining record.

**Stop after current request** does not abort a potentially committed mutation.
It waits for that request's confirmation and sends no remaining mutation. A
15-second client transport deadline bounds fetch/body reads; timers/listeners are
cleared after every request. Session invalidation aborts transport, clears account
state and prevents delayed replies from restoring the previous account's results.
No automatic retry or background mutation queue runs. A fresh row load supplies
versions before any explicit retry, preventing silent overwrite or duplicate audit.

The result list receives focus after completion and announces per-record outcomes.
Loading/busy states disable selection and controls; no color-only result or fake
all-success toast is shown. The shared Table exposes only generic canSelect and
selectionDisabled presentation props; authorization stays outside the component.

## العربية

اختر الحالة الجديدة وصفوفاً من الصفحة الحالية، ثم راجع أسماء السجلات في نافذة
التأكيد. الحد الأقصى ثمانية سجلات، وتُفحص صلاحية كل سجل وإصداره على الخادم. كل سجل
عملية مستقلة، لذلك لا يعني نجاح سجل نجاح بقية المجموعة. عند الرفض أو غياب التأكيد
تتوقف الطلبات التالية وتُعرض نتيجة كل سجل بوضوح. زر الإيقاف ينتظر الطلب الجاري، ولا
يدّعي إلغاء عملية ربما حُفظت. أعد تحميل النسخة المؤكدة قبل إعادة المحاولة عند انقطاع
الاتصال أو التعارض. لا تتغير صلاحيات المشاهد أو المحرر، ولا يُسمح بتغيير حالة الحساب
نفسه عبر هذه الواجهة. لا توجد كتابة جماعية إلى قاعدة مجهولة أو عملية حذف جماعي.
