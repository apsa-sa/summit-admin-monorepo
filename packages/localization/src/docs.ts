// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Locale } from "./index.js";
const en = Object.freeze({
  component: "Component",
  notes: "Example notes",
  title: "Developer documentation",
  intro:
    "A self-hosted administration foundation with class-based services and reusable components.",
  status: "Development preview. Release acceptance remains open.",
  navigation: "Documentation navigation",
  start: "Run locally",
  components: "Component workbench",
  contracts: "Application contracts",
  startHint:
    "Use your own isolated PostgreSQL installation. No APSA account or hosting subscription is required.",
  environment:
    "Copy .env.example to a private .env. Set your own DATABASE_URL, APP_ORIGIN=http://127.0.0.1:3212 and a unique SEED_ADMIN_PASSWORD before explicit migration/seed commands.",
  docsRun:
    "This documentation app runs on loopback port 3213; the reference admin runs on 3212. Start them separately after building shared packages.",
  structure:
    "Extend by adding a typed contract, domain rule, application use case, repository adapter and class presentation at the composition root. Keep logic independent of Next.js and PostgreSQL.",
  source: "Example source",
  catalogue: "Implemented public component exports",
  catalogueHint:
    "Local catalogue and controlled UI states. No production records are loaded or saved.",
  search: "Search component names",
  interface: "Public interface",
  inspect: "Inspect contract",
  preview: "Preview dialog",
  drawer: "Open details drawer",
  notify: "Show notification",
  notice: "Local component notification; nothing was saved to a server.",
  field: "Example display name",
  fieldHint:
    "Arabic and English text are supported. Changing language/theme preserves this local example.",
  choice: "Example role",
  checkbox: "Disable the preview button",
  disabled: "Disabled example",
  loading: "Loading example",
  sample: "SUMMIT developer",
  states: "Simulated table state",
  ready: "Ready",
  empty: "Empty",
  error: "Error",
  busy: "Loading",
  selected: "Selected examples",
  code: "Class-based usage",
  transport: "Runtime and security boundaries",
  transportHint:
    "The admin API validates every request and checks permissions on the server. Hiding a control is not authorization. Requests use same-origin cookies and explicit origin checks for writes.",
  version:
    "Expected versions prevent overwrites. A 409 requires reloading confirmed state; a network timeout leaves a write unconfirmed. Bulk status commits independently per record and exposes partial outcomes.",
  extension: "Customization guide",
  license:
    "Original code: MIT. Font and dependency notices retain their own terms.",
  repository: "Official repository",
  skip: "Skip to documentation",
});
export type DocsMessageKey = keyof typeof en;
const ar: Readonly<Record<DocsMessageKey, string>> = Object.freeze({
  component: "المكوّن",
  notes: "ملاحظات تجريبية",
  title: "توثيق المطور",
  intro:
    "أساس للوحات الإدارة بتشغيل ذاتي، وخدمات مبنية بالكلاسات، ومكونات قابلة لإعادة الاستخدام.",
  status: "معاينة تطويرية؛ بوابات اعتماد الإصدار ما زالت مفتوحة.",
  navigation: "التنقل في التوثيق",
  start: "التشغيل المحلي",
  components: "معرض المكونات",
  contracts: "عقود التطبيق",
  startHint:
    "استخدم PostgreSQL مستقلة لتثبيتك. لا يلزم حساب لدى APSA أو اشتراك استضافة محدد.",
  environment:
    "انسخ .env.example إلى .env خاص واضبط DATABASE_URL وAPP_ORIGIN=http://127.0.0.1:3212 وكلمة SEED_ADMIN_PASSWORD خاصة قبل الترحيل والبيانات التجريبية الصريحة.",
  docsRun:
    "يعمل التوثيق محلياً على المنفذ 3213، وتطبيق الإدارة على 3212. شغلهما بصورة مستقلة بعد بناء الحزم المشتركة.",
  structure:
    "لإضافة مورد، أنشئ عقداً مكتوب الأنواع وقاعدة مجال وحالة استخدام ومحول مستودع وعرضاً بالكلاسات، واربطها في Composition Root. أبقِ المنطق مستقلاً عن Next.js وPostgreSQL.",
  source: "مصدر المثال",
  catalogue: "المكونات العامة المنفذة",
  catalogueHint:
    "دليل محلي وحالات عرض قابلة للتحكم. لا تُحمّل أو تحفظ سجلات إنتاجية.",
  search: "البحث بأسماء المكونات",
  interface: "العقد العام",
  inspect: "عرض العقد",
  preview: "معاينة الحوار",
  drawer: "فتح لوحة التفاصيل",
  notify: "عرض إشعار",
  notice: "إشعار محلي للمكون؛ لم تُحفظ بيانات على خادم.",
  field: "اسم عرض تجريبي",
  fieldHint:
    "يمكن إدخال العربية والإنجليزية. تبقى حالة المثال عند تغيير اللغة والمظهر.",
  choice: "دور تجريبي",
  checkbox: "تعطيل زر المعاينة",
  disabled: "مثال معطّل",
  loading: "مثال تحميل",
  sample: "مطور قمة",
  states: "حالة جدول محاكاة",
  ready: "جاهز",
  empty: "فارغ",
  error: "خطأ",
  busy: "تحميل",
  selected: "الأمثلة المحددة",
  code: "مثال استخدام بالكلاسات",
  transport: "حدود التشغيل والأمان",
  transportHint:
    "يتحقق API الإدارة من المدخلات والصلاحيات على الخادم في كل طلب. إخفاء زر ليس تفويضاً أمنياً. تستخدم الطلبات cookies للأصل نفسه وفحصاً صريحاً للأصل عند الكتابة.",
  version:
    "يمنع الإصدار المتوقع الكتابة فوق تعديل أحدث. يتطلب 409 استعادة النسخة المؤكدة؛ وانقطاع الشبكة يترك نتيجة الكتابة غير مؤكدة. في التحديث الجماعي يُحفظ كل سجل مستقلاً وتظهر النتائج الجزئية.",
  extension: "دليل التخصيص",
  license: "الشيفرة الأصلية MIT؛ تحتفظ الخطوط والتبعيات بإشعاراتها وشروطها.",
  repository: "المستودع الرسمي",
  skip: "الانتقال إلى التوثيق",
});
export class DocsMessages {
  constructor(private readonly locale: Locale) {}
  t(key: DocsMessageKey): string {
    return this.locale === "ar" ? ar[key] : en[key];
  }
}
