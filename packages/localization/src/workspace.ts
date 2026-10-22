// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Locale } from "./index.js";
const en = Object.freeze({
  product: "SUMMIT",
  tagline: "Your workspace. Your installation.",
  signIn: "Sign in",
  email: "Email",
  password: "Password",
  signOut: "Sign out",
  loading: "Loading…",
  retry: "Retry",
  error: "The operation could not be completed.",
  network: "Connection failed. Your edits are preserved. Retry explicitly.",
  expired: "Your session expired. Sign in again.",
  forbidden: "This action is not permitted.",
  invalid: "Check the entered values.",
  conflict: "This record changed. Reload the confirmed version before editing.",
  credentialsError: "Email or password is incorrect.",
  rateLimited: "Too many attempts. Wait one minute and retry.",
  notConfigured:
    "The installation is not configured. Check the server environment and migrations.",
  emailExists: "This email is already in use.",
  overview: "Overview",
  users: "Users",
  drafts: "Saved draft",
  audit: "Audit log",
  settings: "Preferences",
  navigation: "Workspace navigation",
  menu: "Open navigation",
  collapse: "Collapse navigation",
  commands: "Commands",
  commandSearch: "Find an available destination",
  source: "Data source",
  sourceHint:
    "Live records from this installation’s PostgreSQL database. The count reflects the latest server response.",
  name: "Name",
  organization: "Organization",
  role: "Role",
  status: "Status",
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
  search: "Search",
  all: "All",
  create: "Add user",
  edit: "Edit",
  remove: "Delete",
  save: "Save",
  cancel: "Cancel",
  close: "Close",
  confirmRemove: "Confirm deletion",
  deleteHint:
    "The selected user and their sessions/draft will be removed. The audit event is retained.",
  exportCsv: "Export authorized CSV",
  createdAt: "Created",
  version: "Version",
  page: "Page",
  next: "Next",
  previous: "Previous",
  noResults: "No results",
  userSaved: "User saved on the server.",
  userRemoved: "User deleted on the server.",
  draftHint:
    "Saved on the server for your account. Passwords and verification codes are never draft fields.",
  draft_loading: "Loading confirmed draft…",
  draft_saving: "Saving…",
  draft_saved: "Saved on server",
  draft_unsaved: "Unsaved edits",
  reloadDraft: "Discard local edits and reload confirmed draft",
  language: "العربية",
  theme: "Appearance",
  light: "Light",
  dark: "Dark",
  skip: "Skip to main content",
  details: "User details",
  offline: "You are offline. Keep your edits and retry when connected.",
  copyright:
    "© 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.",
  count: "User records",
  firstPage: "Return to first page",
  profile: "Signed-in account",
  logoutFailed:
    "Server logout was not confirmed. Retry logout before changing accounts.",
});
export type WorkspaceMessageKey = keyof typeof en;
const ar: Readonly<Record<WorkspaceMessageKey, string>> = Object.freeze({
  product: "قمة",
  tagline: "مساحة عملك. تثبيتك المستقل.",
  signIn: "تسجيل الدخول",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  signOut: "تسجيل الخروج",
  loading: "جارٍ التحميل…",
  retry: "إعادة المحاولة",
  error: "تعذّر إكمال العملية.",
  network: "تعذر الاتصال. حُفظت تعديلاتك في الواجهة؛ أعد المحاولة صراحةً.",
  expired: "انتهت الجلسة. سجّل الدخول مجدداً.",
  forbidden: "لا تملك صلاحية هذا الإجراء.",
  invalid: "تحقق من القيم المدخلة.",
  conflict: "تغيّر السجل. استعد النسخة المؤكدة قبل التعديل.",
  credentialsError: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  rateLimited: "محاولات كثيرة. انتظر دقيقة ثم أعد المحاولة.",
  notConfigured: "لم يُضبط التثبيت بعد. تحقق من بيئة الخادم والترحيلات.",
  emailExists: "البريد الإلكتروني مستخدم مسبقاً.",
  overview: "نظرة عامة",
  users: "المستخدمون",
  drafts: "المسودة المحفوظة",
  audit: "سجل التدقيق",
  settings: "التفضيلات",
  navigation: "التنقل في مساحة العمل",
  menu: "فتح قائمة التنقل",
  collapse: "طي قائمة التنقل",
  commands: "الأوامر",
  commandSearch: "ابحث عن وجهة متاحة",
  source: "مصدر البيانات",
  sourceHint:
    "سجلات فعلية من PostgreSQL الخاصة بهذا التثبيت. العدد وفق آخر استجابة للخادم.",
  name: "الاسم",
  organization: "المؤسسة",
  role: "الدور",
  status: "الحالة",
  admin: "مدير",
  editor: "محرر",
  viewer: "مشاهد",
  active: "نشط",
  invited: "مدعو",
  suspended: "موقوف",
  search: "بحث",
  all: "الكل",
  create: "إضافة مستخدم",
  edit: "تعديل",
  remove: "حذف",
  save: "حفظ",
  cancel: "إلغاء",
  close: "إغلاق",
  confirmRemove: "تأكيد الحذف",
  deleteHint:
    "سيُحذف المستخدم المحدد وجلساته ومسودته، مع الاحتفاظ بحدث التدقيق.",
  exportCsv: "تصدير CSV المصرّح به",
  createdAt: "تاريخ الإنشاء",
  version: "الإصدار",
  page: "الصفحة",
  next: "التالي",
  previous: "السابق",
  noResults: "لا توجد نتائج",
  userSaved: "حُفظ المستخدم في الخادم.",
  userRemoved: "حُذف المستخدم في الخادم.",
  draftHint: "محفوظة في الخادم لحسابك. لا تتضمن كلمات مرور أو رموز تحقق.",
  draft_loading: "جارٍ تحميل المسودة المؤكدة…",
  draft_saving: "جارٍ الحفظ…",
  draft_saved: "تم الحفظ في الخادم",
  draft_unsaved: "تعديلات غير محفوظة",
  reloadDraft: "تجاهل التعديلات المحلية واستعادة المسودة المؤكدة",
  language: "English",
  theme: "المظهر",
  light: "فاتح",
  dark: "داكن",
  skip: "الانتقال إلى المحتوى الرئيسي",
  details: "تفاصيل المستخدم",
  offline: "الاتصال منقطع. احتفظ بتعديلاتك وأعد المحاولة عند عودة الاتصال.",
  copyright:
    "© 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.",
  count: "سجلات المستخدمين",
  firstPage: "العودة إلى الصفحة الأولى",
  profile: "الحساب الحالي",
  logoutFailed:
    "لم يؤكد الخادم تسجيل الخروج. أعد محاولة الخروج قبل تبديل الحساب.",
});
export class WorkspaceMessages {
  constructor(readonly locale: Locale) {}
  t(key: WorkspaceMessageKey): string {
    return this.locale === "ar" ? ar[key] : en[key];
  }
  error(value: unknown): string {
    const code =
      typeof value === "object" && value !== null && "code" in value
        ? value.code
        : "";
    const status =
      typeof value === "object" && value !== null && "status" in value
        ? value.status
        : 0;
    if (code === "invalid_credentials") return this.t("credentialsError");
    if (code === "rate_limited") return this.t("rateLimited");
    if (code === "not_configured") return this.t("notConfigured");
    if (code === "email_exists") return this.t("emailExists");
    if (code === "version_conflict") return this.t("conflict");
    if (code === "network_error") return this.t("network");
    if (status === 401) return this.t("expired");
    if (status === 403) return this.t("forbidden");
    if (status === 422) return this.t("invalid");
    return this.t("error");
  }
}
