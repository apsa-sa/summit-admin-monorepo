<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Integration acceptance / قبول دمج الأعمال المنجزة

Date: 2026-10-23 (Asia/Riyadh).
Protected main baseline: `65e82cd2e89c328b8ab007a57c8c7030849eb507`.
Latest combined product source: `d595abaa574a0a43e548da946d7d47afc1433498`.
Integration branch: `work/integration-main-20261023`.

## Authority and scope

The owner asked who should merge the accumulated work, required a cleanliness
and engineering check before merging, and asked when the project can be closed
and announced to developers. This accepts completed development increments for
integration under the original conditions. It does not reclassify an incomplete
v1 as a production release. No production deployment, GitHub Release, release
tag, protection bypass, database migration/cleanup or external announcement is
part of this merge operation.

The integration preserves every existing commit and original app/proof. It adds
only this acceptance report beyond the already tested combined source. Use a
normal GitHub merge commit after exact-head CI and protection checks, then
verify main's actual merge commit again. No squash/rebase/force push, branch
removal or replacement of another team's work is planned.

## Nine-PR inventory and ancestry proof

Direct local `git merge-base --is-ancestor` checks returned true for every head
below against the combined source; no patch was copied over another source tree.

| PR | Accepted feature head | Scope |
|---|---|---|
| #4 | a1688833175af0b524e7d9a18c6de5c52c9fb6d5 | Actual UI/tokens/localization package build and Next consumption |
| #5 | e33cb7d307edc54329c3ce0fdd5f4e8f8b806bc2 | Shared PostgreSQL login admission and immutable migration journal |
| #6 | 8f0a9a58e674cf67fd6011d0ba5ca752c6730e6a | Owner-authorized ADR-0003 boundaries and cleaning review |
| #7 | 5f6fac9aa730ce83d10c831eb9bb7dc3d6bfa6bc | Next reference admin, saved views and native module graph compatibility |
| #8 | 14bdfdc813947c45a5331dc8f0ca8b0469ed4d3e | Account profile/capability presentation |
| #9 | 5722e27b4cdc073f07884e02f2db90702b716c7d | Permission-bound per-record bulk status with explicit partial outcomes |
| #10 | 2a2478a8d7c98e882928d732a97e4b2ef5b46edd | Real class-based bilingual documentation and component workbench |
| #11 | 847ce304be1b3842e7329cc770b02009fc090c42 | Card/Alert/Tooltip and logout acknowledgement/replay checks |
| #12 | d595abaa574a0a43e548da946d7d47afc1433498 | CSV success/error protocol and real consumer regressions |

GitHub read-only inspection found all nine open as drafts, with no review
threads or formal review submissions. This is not an independent human-review
claim. No open GitHub issue was returned; that is not proof that the product has
no unresolved requirements. Owner authorization and automated evidence do not
replace the remaining release criteria.

## Cleanliness and compatibility inspection

Compared with protected main, the combined source changes 161 files with no
source-file deletion. New integration documentation adds one file. Historical
reports, old native app, Next proof and migration 001 remain. Migrations 002/003
are additive; immutable journal checksum and transaction tests remain mandatory.
No source or migration is removed as a cleanup shortcut.

Tracked-source inspection found zero node_modules/dist/.next/test-results/
playwright-report artifacts. Test screenshots and local logs remain ignored.
Worktrees for the final UI and CSV heads were clean. Existing browser assertions
were retained; changes to old tests add owned-row cleanup, migration-journal
setup and CSV failure checks. The explicitly documented logout ordering test
now waits for actual acknowledgement and also rejects replay of the old cookie.
No sleep/retry/skip/assertion weakening was used to obtain the final green head.

Classes, strict Props/contracts, constructor-injected services and enumerated
ADR-0003 R1–R6 entry delegations are retained. Native module allowlists do not
expose application/core/server modules. Package exports correspond to built
ESM, declaration and CSS files; React/DOM peers and OFL font notices are retained.
There is no new dependency or framework exception in this integration report.
Ruleset `25615300` was inspected active: deletion/non-fast-forward protection,
PR-only changes, strict required status checking, required thread resolution and
no bypass actors. No rule change is requested. Both CI jobs are acceptance gates
for this integration even though the ruleset names only the foundation job.

## Direct evidence before integration report

Combined source `d595abaa574a0a43e548da946d7d47afc1433498`:
[Actions 39867163008](https://github.com/apsa-sa/summit-admin-monorepo/actions/runs/39867163008).
Both jobs completed successfully; raw completed-job logs were inspected.

| Gate | Observed result |
|---|---|
| Unit and contracts | 98 PASS; zero failed/skipped |
| Native asset/module contracts | 4 PASS; zero failed/skipped |
| Actual PostgreSQL integration | 30 PASS; zero failed/skipped |
| Chromium end-to-end | 33 PASS; AR/EN, light/dark, native + Next + Docs + proof |
| Strict types and builds | PASS: packages, native browser and Next proof/admin/docs |
| Fresh frozen-lock install and tarball contracts | PASS: ESM, declarations, CSS, notices |
| Dependency vulnerability audit | PASS with audit-level low |
| Publication and Gitleaks history/current-file scans | PASS |
| Accessibility/interaction regression | Automated axe, keyboard/focus, RTL/LTR, 360px/200% PASS; not full manual WCAG certification |

The report commit and GitHub's simulated merge ref must pass fresh CI before
merging. Main's merge SHA must then pass its push CI. Record those exact SHAs,
Actions links and final old-PR disposition in the integration PR closure. A
previous successful source run is not transferred as acceptance to a new head.

## Requirement matrix and public-release blockers

| Requirement area | State and remaining work |
|---|---|
| Architecture/package consumption | VERIFIED for tested boundaries and packages; no broad functional-component exception |
| Original admin journey and PostgreSQL safety | VERIFIED for retained tested scenarios; not blanket production certification |
| UI/localization/admin breadth | PARTIAL: remaining owner-brief states/components, Tailwind acceptance and complete equivalence review |
| CSV | VERIFIED tested AR/EN response protocol and filtered authorized journeys |
| Excel/PDF/readable Arabic PDF | NOT IMPLEMENTED in verified scope — P1 |
| File upload/actual type/image processing/storage | NOT IMPLEMENTED in verified scope — P1 |
| Required reference analytics | NOT IMPLEMENTED as the complete owner-brief deliverable — P1 |
| Developer documentation | PARTIAL — P1: independent clean setup/customization/resource-role-language-adapter acceptance still required |
| 100,000-record performance | NOT IMPLEMENTED as measured release evidence — P0 launch |
| Backup/restore/recovery acceptance | PARTIAL / no completed release drill — P0 launch |
| Full license/SBOM release acceptance | PARTIAL; unchanged dependency notices/audit are not an SBOM — P0 launch |
| Full manual/cross-engine accessibility/security release review | PARTIAL — P0 launch |
| Release candidate and explicit owner release approval | BLOCKED by remaining criteria — P0 launch |

There is no evidence-based date for final v1 closure yet. The bounded merge can
close after its pre/post-merge gates; public release closure requires all P0/P1
items above to be resolved on one tested candidate, current bilingual runbooks,
independent developer setup and explicit owner release approval. Do not tell
developers this is a complete production-ready v1 based only on this merge.

## Rollback / next actions

If pre-merge evidence fails, keep main unchanged and fix the scoped cause on the
integration branch. If post-merge evidence fails, do not publish or announce a
release; inspect and correct/revert through protected PRs. Do not rewrite main,
drop migrations or perform database rollback/cleanup. A reviewed code revert of
the integration merge is available if required; data operations need separate
inspection and authorization.

After verified main integration, retire redundant open PR metadata only after
checking their exact heads are ancestors of main. Preserve their reports and
branches; mark them incorporated/superseded if GitHub does not auto-close them.
Continue original Phase E/F/G work from the verified new main.

العربية: يغلق هذا الدمج تجميع الأعمال المنجزة فقط، ويحفظ كل الالتزامات والتقارير.
تبقى جاهزية الإصدار العام معلّقة على الميزات والاختبارات والتوثيق والاعتماد المذكورة.
لا يوجد موعد إغلاق نهائي موثوق قبل استكمالها، ولا تُرسل إعلانات للمطورين ضمن هذا الإجراء.
