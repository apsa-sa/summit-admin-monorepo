<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# ADR-0002 — shared package build and consumption

Status: implementation/verification pending. Baseline: main 65e82cd.

The owner explicitly requested real ESM, declaration and CSS output for UI,
with exact exports and a real Next.js consumer. No new framework exception is
introduced: all UI units are React classes and the existing bounded proof entry
functions remain unchanged. No hooks, procedural application services, provider
dependency or global mutable registry is added.

## Build alternatives reviewed 2026-10-22

- [tsup](https://github.com/egoist/tsup): upstream README states it is no longer
  actively maintained and recommends tsdown; it also describes CSS support as
  experimental. Do not add it merely because a manifest example mentioned it.
- [tsdown](https://github.com/rolldown/tsdown): maintained Rolldown-based library
  bundling and declarations; a viable future choice when bundling is justified.
  It introduces another compiler/bundler and directive-preservation surface.
- [TypeScript](https://github.com/microsoft/TypeScript): already pinned at 7.0.2
  in the accepted repository. Emit individual ESM modules and declarations with
  tsc. Native Node class build scripts produce deterministic CSS/font assets.

Decision: use the existing compiler, retaining module boundaries and `use client`
directives. This needs no new bundler or fictitious @summit/tsconfig package.
Shared build options live at tooling/typescript/library.json, an actual file.
Turborepo orders tokens/localization before UI and the Next.js consumer.

## Public contracts

- tokens: dist/index.js, dist/index.d.ts, dist/index.css, licensed local fonts.
- localization: dist/index.js and dist/index.d.ts; no nonexistent CSS export.
- UI: src public entry; dist/index.js, dist/index.d.ts and dist/index.css.
  React/React DOM peer ranges match the tested 19.3.1 line. Workspace builds and
  consumer imports must prove every declared export, including CSS and types.
- Token values have one source. Generated CSS is not hand-edited. Fontsource
  Noto Sans Arabic 5.2.8 is an exact pinned asset dependency, OFL-1.1, with its
  license retained. No third-party UI source or new visual identity is copied.
- Controls receive text/labels through props; formatters/translations live in
  localization. No authorization, persistence, API client or business validation
  belongs in the presentational UI package.

## Dependency review

`@axe-core/playwright` 4.14.0 is a development-only accessibility test adapter
(MPL-2.0), using axe-core 4.14.0, with Node >=22.12 and Playwright peer compatibility
verified against the installed package metadata. It executes in the existing
Chromium gate, never the shipped UI bundle. Upstream notices remain in the
installed packages; no upstream source is copied into project-owned components.
No existing dependency version is upgraded in this scope. The lockfile reuses
the accepted resolved graph and adds only the font and two axe entries. A frozen
lockfile check and a fresh CI install are required; reused local node_modules do
not prove reproducibility. Local advisory access is blocked by network policy;
the unchanged mandatory CI audit must execute successfully before acceptance.

## Acceptance gates

Clean package builds, actual export files, declaration/type consumption,
retained client directives, React SSR, Next.js production build/hydration,
keyboard/focus/RTL/theme/state tests, measured contrast, font/license assets,
package contents and exact-head CI. Existing 52/17/12 baseline tests stay intact.
No package-complete claim until those gates have direct execution evidence.

Rollback: close the isolated PR or use a reviewed revert later. No schema or
data change. The original admin/proof and historical records are retained.
