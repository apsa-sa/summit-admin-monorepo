<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase C / D — shared surfaces and supplementary help

Date: 2026-10-23 (Asia/Riyadh). Baseline: `2a2478a8d7c98e882928d732a97e4b2ef5b46edd`
on `work/admin-docs-20261022`. Scope branch: `work/ui-surface-tooltip-20261022`.
Owner authorization: continuation of the executive SUMMIT implementation order,
including required cards, alerts and tooltips in `docs/OWNER-BRIEF.ar.txt`.
No framework-boundary extension, new dependency, migration or production operation.

## Inspected gap and implementation

The verified UI package exported 13 actual components, but the owner brief also
requires cards, alerts and tooltips. Docs duplicated card surface styles and
correctly did not advertise Tooltip. A manifest or a catalogue name was not an
implementation. Existing proof, admin journeys and old native-browser client stay.

- `packages/ui/src/surfaces.tsx` adds class Card (semantic native section) and
  Alert (required textual title, status/alert semantics and four severity tones).
- `packages/ui/src/tooltip.tsx` adds a class supplementary-help control with its
  own native named button. Short plain text only; no arbitrary child-control or
  disabled-trigger compatibility is promised. It owns its portal/listeners, uses
  the trigger's document, stays inside native dialogs, and preserves focus when
  Escape dismisses it. No hooks, global registry, timer or application state.
- `packages/ui/src/tooltip-positioner.ts` isolates validated viewport geometry.
  Transparent bubble padding keeps the hover path contiguous with its trigger;
  visible content is not placed outside the viewport by normal positioning.
- `packages/ui/src/index.ts` exposes implementations and precise Props types;
  `index.css` consumes shared tokens, logical spacing, severity accents and the
  existing reduced-motion/forced-colour foundation.
- `packages/design-tokens/src/index.ts` adds info/success/warning semantic values
  to both palettes. Existing identity values are preserved. Contrast assertions
  now cover these additional values against all three approved surfaces.
- `packages/localization/src/docs.ts` adds actual AR/EN help text.
- Docs `workspace.tsx` consumes Card and Alert; `form-example.tsx` consumes
  Tooltip both in-page and inside a native Dialog. `catalogue.ts` lists the 16
  actual public exports, with typed names and source/Props contracts.
- Docs CSS retains consumer spacing and removes only duplicated card
  background/border/radius/min-width declarations now supplied by Card. Named
  scroll regions still contain wide tables; column headings remain intact.
- UI README documents contracts, examples, keyboard lifecycle and limitations.

## Tests and evidence status

Local direct evidence before this checkpoint:

| Gate | Result |
|---|---|
| `pnpm check` | PASS: strict typecheck/build, 91 unit/contract results, zero failed/skipped |
| Native browser asset graph | PASS: 4 tests, zero failed/skipped |
| Actual package tarballs | PASS: tokens 28, localization 9, UI 29 files; ESM/declarations/CSS/notices |
| `pnpm docs:build` | PASS: production Next build and app strict TypeScript |
| Root `tsc --noEmit` after E2E additions | PASS |
| `pnpm admin:build` and `pnpm proof:build` | PASS: retained consumers production-build successfully |
| `pnpm audit:publication` | PASS: working tree and reachable local history; signature-limited |
| New-head PostgreSQL / Chromium | NOT RUN locally; required GitHub Actions gates pending |

`packages/testing/ui-surfaces.test.ts` adds four behavior contracts: native Card
attributes/escaping, Alert severity/title, SSR help description/invalid inputs,
and viewport flipping/edges/invalid geometry. Existing shared contrast and public
catalogue checks are strengthened, not removed. Calendar remains explicitly
unimplemented; Tooltip is now required to be present as an actual export.

`packages/testing/e2e/docs.spec.ts` retains all six cases and assertions, and adds
all four locale/theme tooltip hover transfer, focus, description, Escape and real
native-modal hit testing. The 360px/200% case additionally checks tooltip bounds.
`evidence-capture.ts` awaits actual font readiness and scrolls to the page start
before native full-page captures to avoid displaced fixed controls. It does not
remove UI, rewrite content or synthesize imagery. Capture output remains ignored
CI evidence, not a claim of publication-ready product screenshots.

The PR closure section must record the exact tested head, Actions URL and actual
new-head database/browser/audit results. Baseline success is not transferred to
this change. Manual screen-reader certification and cross-engine coverage remain
open; automated axe checks do not imply complete WCAG acceptance.

## Cleanliness and deletion impact

No source files, migrations, adapters, historic reports or proof were deleted.
No runtime dependencies, lockfile entries, auth/RBAC grants, exports previously
consumed, route registrations or database schema were removed or upgraded.
The only removed CSS declarations are the four duplicated Docs card declarations;
all three `.docs-card` call sites were changed to actual Card consumers. Consumer
responsive padding and margin remain, so they still work at 360px/200%.
No debug log, test skip, forced cast, `any` escape or disabled gate was added.
Generated dist/.next, screenshots, caches and local logs are not source commits.

## Remaining work and rollback

- P1 / PARTIAL: overall Phase C and D acceptance; this scope does not implement
  every required admin interaction, Tailwind requirement or all component states.
- P1 / NOT IMPLEMENTED in verified branch: Excel/PDF, upload/storage and remaining
  reference analytics; continue Phase E against the original brief.
- P0 launch / PARTIAL: comprehensive security/accessibility/performance, 100,000
  rows, backup/restore, licenses/SBOM, independent developer setup and RC approval.
- Native help is supplementary: essential instructions must remain visible in
  the application. Plain-text contract intentionally excludes interactive popovers.

Rollback is a reviewed code revert of this scoped commit. There is no database
operation to reverse and no production deployment in this scope. Continue
independent approved product work after the exact-head gates pass; main protection,
owner release approval and the original acceptance criteria remain unchanged.

العربية: هذه مرحلة جزئية لإكمال مكونات فعلية واستهلاكها واختبارها؛ لا تعني اكتمال
المنتج أو اعتماده للإطلاق. لم يُحذف التطبيق القديم أو إثبات Next.js أو سجل العمل.

## First exact-head CI finding — logout test ordering

Run [39865767121](https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39865767121)
on `170a21664f5c0b30b0cbfa76e715402ffcfa5304` passed 91 unit/contracts, four
asset contracts, 30 real-PG results, all security gates and all six strengthened
Docs cases. The full browser gate failed: 31 passed, two failed in an inherited
admin logout assertion. It is not an accepted green head.

Downloaded Playwright traces demonstrate the ordering defect in that assertion:
ar/light logout POST began 22:35:29.007 UTC and took 72.689ms; the test's GET /me
began 22:35:29.017 and took 16.209ms (200), before logout completed. In en/dark,
logout began 22:35:44.173 and took 26.951ms; GET began 22:35:44.184 and took
13.103ms (200), also before acknowledgement. The controller intentionally clears
private local data before awaiting server revocation, keeping login inputs busy.
Seeing a login field is not confirmation that the server transaction committed.

Correction retains the exact 401 assertion and adds an explicit matching POST
response barrier, 200/ok acknowledgement, cleared-cookie contract, enabled login
field and replay of the old session cookie expecting 401. No fixed sleep, retry,
skip or weakened assertion. A new deferred-controller unit proves immediate
privacy clearing while busy remains true until the server acknowledgement.
The corrected head must run every gate again; this trace diagnosis is not a
substitute for a passing corrected CI run.
