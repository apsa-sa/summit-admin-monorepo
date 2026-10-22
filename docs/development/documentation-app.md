<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Documentation and component workbench / التوثيق ومعرض المكونات

The developer-facing Next app is `apps/docs`, using the exact existing pinned
Next16.4.2/React19.3.1/TypeScript7.0.2 matrix and built public UI/localization/tokens.
It requires no database or account and performs no admin API writes. Examples and
the catalogue are explicitly local; no unfinished component is advertised.

```bash
pnpm install --frozen-lockfile
pnpm build:packages
pnpm docs:dev
# Open http://127.0.0.1:3213
```

Production build/start (not permission to publish a release):

```bash
NODE_ENV=production pnpm docs:build
NODE_ENV=production pnpm docs:start
```

`SUMMIT_DOCS_PORT` and `SUMMIT_DOCS_HOST` may be supplied in the process environment.
The shared launcher accepts only the two named SUMMIT apps. Documentation does not
load the admin's root `.env`; it removes known database/bootstrap/test-fixture
credentials from the child environment. Admin keeps its original root `.env` and
origin behavior. The launcher is now a Turbo global build input, so its changes
invalidate affected build caches rather than silently replaying older behavior.

## Implemented examples

- Server-rendered locale/direction/theme and class hydration; changing preferences
  without navigation preserves example state. Cookies restore preferences after reload.
- Actual Button variants/loading/disabled, labelled Input/Select/Textarea/Checkbox,
  FormField descriptions, Tabs and native Dialog/Drawer focus/escape/restoration.
- Local toast, typed component catalogue with search/sort/selection/pagination,
  explicit loading/empty/error simulation and real Retry state transition.
- Per-component interface/source descriptions checked against actual built exports.
- Native section links/history and readable server content without JavaScript;
  interactive controls require hydration. Keyboard skip link and contained table/code scrolling.
- Run commands, existing API boundaries, expected-version/uncertain-write semantics
  and constructor-DI extension guidance. This is a starter guide, not a complete OpenAPI reference.

All application/presentation code is class-based. R5/R6 are the only new function-valued
framework entries, referring to DocsDocument/DocsPage static methods per the owner's
ADR-0003 authorization. No hooks, functional UI, Server Actions or new proxy/route
exception. The original proof/gallery remains unchanged and independently tested.
No dependency version was upgraded; the new lockfile importer reuses the existing
resolved graph. Tailwind remains an explicit open requirement pending its version/
compatibility/maintenance review; native token-based CSS is not called Tailwind.

## العربية

شغّل الأوامر أعلاه وافتح `http://127.0.0.1:3213`. لا يحتاج التوثيق إلى قاعدة بيانات
ولا يقرأ ملف `.env` الخاص بالإدارة. تتضمن الصفحة تعليمات تشغيل وتخصيص، ومعرضاً فعلياً
للمكونات المبنية وحالاتها، مع أمثلة محلية موسومة بوضوح. تبقى حالة المثال عند تغيير
اللغة والمظهر؛ وتستعيد cookies تفضيلات العرض بعد إعادة التحميل. العرض الأول يدعم
العربية والإنجليزية وRTL/LTR، وتبقى روابط الأقسام والمحتوى قابلة للقراءة دون JavaScript.
هذا تسليم تطويري؛ بوابات الأداء والتوثيق الكامل والأمان والإصدار النهائي ما زالت مطلوبة.
