<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase D increment — class documentation app and real component workbench

Baseline: 5722e27b4cdc073f07884e02f2db90702b716c7d / PR9.
https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39830356929
84 units/contracts +4 asset contracts +30 real PostgreSQL +27 Chromium, zero fail/skip;
strict builds/install/publication/advisory/Gitleaks PASS on that exact baseline.
Current branch work/admin-docs-20261022. Protected main remains 65e82cd. Owner
continuation and ADR-0003 alternative1 authorize exact R5/R6 class-method framework
entries. No merge, protection change, production migration/deploy/release performed.

## Gap, architecture and package contracts

apps/docs was a manifest-only shell. Built a real Next consumer using approved
R5 layout → DocsDocument.render and R6 page → DocsPage.render; class error/404,
class workspace, composition root/controller/appearance port, distinct form and
catalogue example responsibilities. Server cookie values become validated enum DTOs,
not repositories/services; no this-dependent static methods. No functional React UI,
hooks, Server Actions, new route/proxy/metadata generator or new exception.

Real built @summit/ui/css/types, localization and tokens consumed by public names.
Catalogue names are typed against actual public UI values and runtime contract-tested;
no placeholder Tooltip/Calendar/Chart is advertised. Examples implement actual local
form states, Dialog/Drawer focus/escape, toast, tabs, catalogue search/sort/selection/
pagination and labelled error/loading/empty/retry states. Data is clearly local, not
production. Documentation includes startup, versions/uncertain writes and DI extension
boundaries, without claiming complete OpenAPI or final release documentation.

Shared native launcher validates a two-app allowlist/port and keeps admin defaults.
Docs does not load admin .env; known database/bootstrap/fixture credentials are
removed from the runtime child environment. No secrets serialized or logged.
Turbo globalDependencies includes the launcher. App owns strict bundler TS checks
(also unused/override), rather than being mischecked as NodeNext root JSX.
Lockfile-only frozen offline validation PASS in a manifest-only isolated copy.
Resolved packages/snapshots dictionaries are exactly unchanged; only the docs
importer now references existing pinned dependencies. No new package/version/parser.

## Actual local gates; fresh exact-head CI still required

pnpm check PASS: 87/87 units/contracts (84 retained +3 cookie/DI/public export
contracts), 4/4 native asset build contracts, zero fail/skip. Production builds of
docs, admin and original proof PASS after launcher/cache-input change. Strict root
unused checks PASS, package pack contracts: tokens28/localization9/UI23 files.
Six new browser cases are registered (four locale/theme/axe/hydration/dialog/catalogue,
server no-JS/preferences/native-history/404/secret-response checks, and RTL keyboard/
360px/200% contained scrolling). All 27 retained browsers and 30 PG results remain
mandatory. Expected 33 browser cases are not claimed passed before execution.
Fresh CI clean install is reproducibility evidence; local reused dependencies are not.

| Requirement | Status | Evidence / next gate |
|---|---|---|
| R5/R6 compatibility / real app package consumer | PARTIAL | Production build passed; final browser/SSR acceptance pending |
| Bilingual workbench and direct section/history navigation | PARTIAL | Typed examples and six new browser cases; execution pending |
| Retained auth/PG/original proof/admin/asset contracts | PARTIAL | Local contracts/build passed; repeat all exact-head CI gates |
| Dependency compatibility | PARTIAL | Frozen importer validation and unchanged resolved graph; clean CI required |
| Tailwind | PARTIAL | Version/compatibility review remains open; token CSS is not relabelled |
| Complete Phase D/v1 release | PARTIAL | Remaining shared component/state coverage, E/F/G/manual gates remain |

## Cleanliness / files

Original admin and proof/gallery source retained, no source removal. Reused UI,
localization/tokens and launcher instead of duplicated component implementations
or an untracked custom build pipeline. Separate panels and typed catalogue/controllers.
No package graph upgrade, dead navigation, debug statements, explicit any/suppression,
test skip/only, generated declarations/build outputs or archives tracked. The shared
locale package gains its own typed immutable AR/EN documentation catalogue.

| Change | Path | Purpose |
|---|---|---|
| MODIFIED | `.github/workflows/ci.yml` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `.gitignore` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `apps/docs/package.json` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `package.json` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `packages/localization/src/index.ts` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `playwright.config.ts` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `pnpm-lock.yaml` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `tooling/scripts/run-next.mjs` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `tsconfig.json` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| MODIFIED | `turbo.json` | Integrate docs app/manifest/build/CI/locale/strict checks without altering unrelated services |
| ADDED | `apps/docs/app/docs.css` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/app/error.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/app/layout.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/app/not-found.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/app/page.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/next.config.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/next/document.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/next/page.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/next/preferences.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/presentation/appearance.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/presentation/catalogue-example.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/presentation/catalogue.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/presentation/composition-root.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/presentation/controller.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/presentation/form-example.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/presentation/workspace.tsx` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `apps/docs/tsconfig.json` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `docs/development/documentation-app.md` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `packages/localization/src/docs.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `packages/testing/docs-contract.test.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `packages/testing/e2e/docs.spec.ts` | Class document/page/workbench, bounded configuration, source contract or bilingual usage |
| ADDED | `docs/verification/PHASE-D-DOCS-2026-10-22.md` | This inventory/evidence/rollback checkpoint |

## Risks, rollback and continuation

P1: accept only after new-head CI install/build/87+4/30/33/security gates; fix every
failure without relaxing assertions. Tailwind compatibility decision and missing
shared components remain release scope. P2: no full manual screen-reader/WCAG or
other-engine certification from Chromium/axe alone. Performance, exports/files/
analytics, full API/DX, recovery/licenses/SBOM/RC remain separate requirements.
Rollback: reviewed code revert of this isolated docs scope, no database migration
or cleanup. Root old app/proof remain runnable. Next: inspect exact CI counts and
actual screenshots in all modes/mobile, record head/run and continue open scope.
