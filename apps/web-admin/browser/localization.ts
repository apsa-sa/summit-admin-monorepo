// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
export type Locale = 'ar' | 'en';
export type TranslationKey = keyof typeof Localizer.ar;

export class Localizer {
  static readonly ar = {
    product:'SUMMIT', subtitle:'مساحة إدارة متكاملة', workspace:'مساحة العمل', dashboard:'نظرة عامة',
    users:'المستخدمون', drafts:'المسودات', audit:'سجل التدقيق', signIn:'تسجيل الدخول',
    email:'البريد الإلكتروني', password:'كلمة المرور', signOut:'تسجيل الخروج',
    signInNote:'استخدم حساب المشرف الذي أنشأته في قاعدة البيانات المحلية.',
    search:'ابحث بالاسم أو البريد', filterRole:'جميع الأدوار', filterStatus:'جميع الحالات',
    name:'الاسم', role:'الدور', status:'الحالة', actions:'إجراءات', edit:'تعديل', add:'إضافة مستخدم',
    save:'حفظ', cancel:'إلغاء', delete:'حذف', export:'تصدير CSV',
    prev:'السابق', next:'التالي', page:'صفحة', total:'إجمالي السجلات',
    noResults:'لا توجد نتائج مطابقة', loading:'جارٍ التحميل…', retry:'إعادة المحاولة',
    network_error:'تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.',
    forbidden:'ليس لديك صلاحية لتنفيذ هذا الإجراء.', unauthenticated:'انتهت الجلسة. سجّل الدخول من جديد.',
    invalid_credentials:'بيانات الدخول غير صحيحة.', version_conflict:'تعارض في الإصدار. حدث البيانات ثم أعد المحاولة.',
    email_exists:'البريد الإلكتروني مستخدم بالفعل.', request_failed:'تعذّر إتمام العملية.',
    profile:'إعداد ملف المؤسسة', organization:'اسم المؤسسة', saveState:'حالة الحفظ', saved:'تم الحفظ في الخادم',
    saving:'جارٍ الحفظ…', unsaved:'هناك تغييرات غير محفوظة',
    overview:'نظرة عامة على إدارة المستخدمين والعمليات',
    account:'الحساب النشط', activeUsers:'المستخدمون النشطون في الصفحة', availableActions:'الإجراءات المسموحة',
    auditTime:'التوقيت', auditAction:'العملية', auditResource:'المورد',
    emptyAudit:'لا توجد أحداث تدقيق أو لا تتوفر الصلاحية.',
    confirmDelete:'هل تريد حذف هذا المستخدم؟ لا يمكن التراجع عن الحذف.',
    confirmLogout:'تعذّر تسجيل الخروج من الخادم. أعد المحاولة قبل ترك الجهاز.',
    close:'إغلاق', theme:'تغيير المظهر', language:'اللغة', disconnected:'لا يوجد اتصال بالخادم',
    active:'نشط', invited:'مدعو', suspended:'موقوف', admin:'مدير', editor:'محرر', viewer:'مشاهد',
    records:'سجل', session:'جلسة آمنة', editUser:'بيانات المستخدم', version:'إصدار السجل',
    application:'تطبيق تجريبي محلي غير معتمد للإنتاج', newUser:'مستخدم جديد',
  } as const;
  static readonly en: Record<TranslationKey,string> = {
    product:'SUMMIT', subtitle:'Enterprise administration workspace', workspace:'Workspace', dashboard:'Overview',
    users:'Users', drafts:'Drafts', audit:'Audit log', signIn:'Sign in',
    email:'Email address', password:'Password', signOut:'Sign out',
    signInNote:'Use the administrator account created in your local database.',
    search:'Search name or email', filterRole:'All roles', filterStatus:'All statuses',
    name:'Name', role:'Role', status:'Status', actions:'Actions', edit:'Edit', add:'Add user',
    save:'Save', cancel:'Cancel', delete:'Delete', export:'Export CSV',
    prev:'Previous', next:'Next', page:'Page', total:'Total records',
    noResults:'No matching records', loading:'Loading…', retry:'Try again',
    network_error:'Cannot reach the server. Check your connection and retry.',
    forbidden:'You do not have permission to perform this action.', unauthenticated:'Session expired. Sign in again.',
    invalid_credentials:'Invalid credentials.', version_conflict:'Version conflict. Refresh and retry.',
    email_exists:'This email address is already in use.', request_failed:'Unable to complete the request.',
    profile:'Organization profile', organization:'Organization name', saveState:'Save status', saved:'Saved on server',
    saving:'Saving…', unsaved:'Unsaved changes',
    overview:'Overview of users and operations',
    account:'Signed-in account', activeUsers:'Active users on this page', availableActions:'Permitted actions',
    auditTime:'Time', auditAction:'Action', auditResource:'Resource',
    emptyAudit:'No audit events or insufficient permissions.',
    confirmDelete:'Delete this user? This action cannot be undone.',
    confirmLogout:'Server sign-out failed. Retry before leaving the device.',
    close:'Close', theme:'Toggle theme', language:'Language', disconnected:'Server unavailable',
    active:'Active', invited:'Invited', suspended:'Suspended', admin:'Administrator', editor:'Editor', viewer:'Viewer',
    records:'records', session:'Secure session', editUser:'User details', version:'Record version',
    application:'Local proof of concept — not production certified', newUser:'New user',
  };
  private locale: Locale = 'ar';
  get current(): Locale {return this.locale;}
  set(value: Locale): void {this.locale=value; document.documentElement.lang=value; document.documentElement.dir=value==='ar'?'rtl':'ltr';}
  t(key: TranslationKey): string {return this.locale==='ar'?Localizer.ar[key]:Localizer.en[key];}
  apply(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach(element=>{
      const key=element.dataset.i18n as TranslationKey | undefined;
      if(key && key in Localizer.ar)element.textContent=this.t(key);
    });
    root.querySelectorAll<HTMLInputElement>('[data-placeholder]').forEach(element=>{
      const key=element.dataset.placeholder as TranslationKey | undefined;
      if(key && key in Localizer.ar)element.placeholder=this.t(key);
    });
  }
}
