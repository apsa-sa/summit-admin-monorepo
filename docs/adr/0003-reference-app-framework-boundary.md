<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# ADR-0003 — final admin/docs framework boundary

Status: OWNER AUTHORIZED FOR ALTERNATIVE 1 — IMPLEMENTATION ACCEPTANCE PENDING.
Baseline: protected main `65e82cd2e89c328b8ab007a57c8c7030849eb507`.
This document records the bounded owner authorization; compatibility and acceptance still require direct implementation evidence.

## Context and approval trigger

ADR-0001 authorizes only B1–B4 in `apps/next-proof`: layout, page, session GET
and logout POST. The owner's continuation explicitly says to preserve that scope
and requires a separate ADR, alternatives and owner approval for any new
exception. The requested final apps are `apps/web-admin` and `apps/docs`.
Copying/renaming proof entry functions into those apps would expand the approved
boundary. The full-product local WIP remains unaccepted; a preliminary local
build is not authorization or final integration proof.

Verified prerequisites are reviewable independently:

- [PR #4](https://github.com/apsa-sa/summit-admin-monorepo/pull/4), head
  `a1688833175af0b524e7d9a18c6de5c52c9fb6d5`: actual shared ESM/types/CSS,
  class UI, approved palettes/local font, locale formatters and real Next consumer.
  [Push CI](https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39775008741):
  60 units/contracts, 17 PostgreSQL results, 18 Chromium cases; builds, clean
  install, advisory/publication audits and Gitleaks passed, no failures/skips.
- [PR #5](https://github.com/apsa-sa/summit-admin-monorepo/pull/5), head
  `e33cb7d307edc54329c3ce0fdd5f4e8f8b806bc2`: asynchronous admission port,
  transactional PostgreSQL limiter and checksummed migration journal.
  [Push CI](https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39776030479):
  54 units/contracts, 23 PostgreSQL results, 12 Chromium cases; all gates passed.

These certify their individual heads. Neither PR is merged; integration must be
verified again on the combined implementation head. No final-app completion or
production-ready claim follows from either prerequisite.

## Alternatives

1. **Recommended: a strictly enumerated framework boundary whose exports delegate
   to class methods.** All application/domain/infrastructure/presentation units
   and interactive React components remain classes. A framework may invoke an
   exported class method as a function. This is acknowledged as a function-valued
   framework boundary, not disguised as proof that React Server Components are
   ordinary React class components. No `this` binding or mutable static service.
2. **Enumerated small entry functions mirroring B1–B4**, delegating immediately
   to the same classes. This has a clearer syntactic exception but more project
   function declarations. Needs the same explicit owner approval; not a silent
   fallback if method exports fail.
3. **Keep authorization at the existing proof only.** Continue independent
   packages/security work, but leave final Next apps BLOCKED. Do not relabel the
   proof or standalone server as the finished product or replace Next.js.

Proposed choice: alternative 1. If Next.js rejects it in build/SSR/hydration,
report the failure and stop that boundary. Alternative 2 is not automatically
approved. No alternate framework/UI library is selected.

## Exact proposed scope

| ID | Framework entry | Proposed allowed delegation |
|---|---|---|
| R1 | apps/web-admin/app/layout.tsx | Export AdminDocument class method for document shell, language/direction/theme and serializable children |
| R2 | apps/web-admin/app/page.tsx | Export AdminPage class method; obtain request preferences/session through adapters, render class workspace, serialize only approved DTOs |
| R3 | apps/web-admin/app/api/[...path]/route.ts | GET/POST/PUT/DELETE refer to NextAdminRoute class handler; request-scoped composition root and existing typed HTTP controllers; route/permission logic stays in classes |
| R4 | apps/web-admin/proxy.ts | Export SecurityProxy class method for framework CSP/nonce/security headers; no identity/authorization decisions or repositories |
| R5 | apps/docs/app/layout.tsx | Export DocsDocument class method for bilingual document shell/preferences |
| R6 | apps/docs/app/page.tsx | Export DocsPage class method that composes class documentation views and real shared component examples |

These are six exact files, not directory-wide authorization. Framework-required
configuration constants (runtime, matcher, metadata) remain plain configuration,
not business services. Error/not-found UI must use class components. Existing
proof B1–B4 remains intact. No new functional React UI components, hooks, Server
Actions, metadata-generator functions, implicit singletons/service locators or
business logic at module scope is included. New paths or exceptions need a new
reviewed decision. Do not use `any`, forced casts or disabled checks to fit Next.

## Dependency and request boundaries

Domain/contracts/application services depend on ports, not React/Next/PostgreSQL.
Infrastructure implements those ports. Request adapters create the composition
root, inject services and close owned resources. The final login route must use
shared database admission from PR #5, not a fresh memory counter per request.
No database/secret/service instance crosses the Server/Client boundary. Locale
and theme are established on first render; client changes preserve editing state.
UI imports the real built packages from PR #4, not source-path aliases or duplicate
CSS. No new dependency/version upgrade is approved by this ADR itself.

The standalone admin, original routes, data contracts, migrations and Next proof
stay present until a complete replacement journey and compatibility are proven.
Independent installation databases remain the model; no provider subscription,
shared APSA database or multi-tenant SaaS claim is introduced.

## Required acceptance evidence after approval

- Exact pinned Node/pnpm/TypeScript/Next/React matrix already recorded in ADR-0001.
- Strict package/app typechecks and production builds from a clean locked install.
- Real ESM/declaration/CSS consumption and retained client directives.
- SSR initial preferences, class hydration, direct URLs and browser back/forward.
- Login/logout/session expiry/revocation and cross-origin rejection on real PG.
- Full login → draft resume/autosave → server-filtered users → class Drawer edit
  → server validation/RBAC → persisted audit → authorized CSV journey in all four
  language/theme combinations. Then remaining v1 features under subsequent gates.
- Stale-response/account-switch/version-conflict/offline/retry failure cases.
- Keyboard/focus/axe/RTL/mobile/200% tests, plus documented manual WCAG gaps.
- No changes to existing assertions/skips/protected branch rules to gain green CI.
- Repeat all retained tests and audit the combined exact implementation head.
- Bilingual run/customization docs consistent with actual behavior, followed by
  performance/recovery/license/SBOM/RC gates. Owner release approval stays separate.

## Rollback and approval record

Current proposal is documentation only; abandon this PR to withdraw it. After an
approved implementation, use reviewed code reverts. Do not delete legacy code or
operational data, rewrite history or apply destructive down migrations.

Owner decision recorded 2026-10-22 (Asia/Riyadh): the owner replied
«اعتمد اذا هي صحيحة ومثالية ... واكمل العمل حسب المطلوب والتزم الشروط»
to the explicit alternative-1/six-path question. This authorizes implementation
of alternative 1 within R1–R6, subject to the original engineering gates. It is
not a statement that an untested implementation is ideal, secure or production
ready. Alternative 2 remains unapproved. No extra UI function/hook, source
removal, dependency upgrade, merge or release permission is inferred.

Engineering review: this is a coherent separation between framework invocation
and class-owned application/presentation/infrastructure logic. Direct exported
class methods must not depend on `this`. Source syntax alone is insufficient:
build, SSR, hydration, route contracts and the complete journey must verify the
combined head. Failure is reported and corrected inside this scope; a different
boundary design needs a fresh decision, without silent fallback.

## نطاق اعتماد المالك

اعتمد المالك تنفيذ البديل الأول لنقاط الدخول الست المحددة أعلاه، بحيث تكون صادرات Next.js
مراجع إلى أساليب كلاسات صغيرة عند حدود الإطار فقط، مع بقاء مكونات العرض ومنطق
المشروع والخدمات والوصول للبيانات بالكلاسات وSRP وDI، ودون Hooks أو مكونات عرض دالية.

هذا اعتماد تنفيذ محدود لحدود الإطار، مشروط بإثبات الصحة بالاختبارات؛ ولا يعني
اعتماد المنتج للإنتاج أو السماح بالدمج أو الإصدار خارج بواباتهما.
