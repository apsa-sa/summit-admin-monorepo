<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Application journey verification checkpoint

Baseline: `1da68bd`. Branch: `work/application-journey-20261022`, stacked on the
architecture proof branch. This checkpoint is not a v1.0 release approval.

## Scope and root causes

The reference server combined HTTP transport, authorization, SQL and application
orchestration. Browser success responses were trusted without runtime decoding.
Draft callbacks could outlive an account and saving during continued edits could
overwrite newer local input or present a false saved state.

Application services now use constructor-injected storage interfaces. PostgreSQL
identity, users, drafts, audit and row mapping have separate adapter classes;
the existing repository facade and method paths remain compatible. HTTP handling,
bounded UTF-8 JSON parsing, cookies, static assets and Node transport are separate
classes wired through one composition root. Password whitespace is preserved.

The browser decodes response contracts and aborts requests when a session ends.
Draft autosave tracks account generation, local revision and server version;
failed saves preserve fields, and conflicts require explicit confirmed reload.
Draft ownership is derived from the live session inside a database transaction.
User mutations lock participating user rows in UUID order before the session,
preventing lock upgrades and opposite-direction mutation deadlocks.

## Verification and evidence

- Local pinned Node 22.23.1 / pnpm 9.0.0: TypeScript, 52 unit/contract tests and
  reference browser compilation passed with zero skipped tests.
- Next.js production proof build, dependency/publication audits and source/history
  secret scans are pre-publication gates; final results are recorded in the PR.
- PostgreSQL suite adds live-session draft isolation and two concurrent-user
  mutation scenarios. Its result must come from a real PostgreSQL CI service.
- Chromium adds eight reference-app scenarios alongside four Next.js proof tests:
  Arabic/English × light/dark journeys, direct viewer/editor privilege denial,
  network retry and delayed cross-account response protection. No local browser
  result is claimed: the local browser download environment is unavailable.

All remotely executed results must identify the tested commit and workflow run
in the PR; an unexecuted test is not evidence. No production database is used.

## Limits and remaining release gates

The reference admin remains the existing DOM application; the Next.js proof has
only the four previously bounded framework entries. A complete Next.js product
integration and any additional framework exceptions require explicit scope review.
The reference app resets language/theme on reload; it is not the final persisted
preference experience. The deterministic mutation locks serialize work involving
the same actor; performance is not certified.

Full design system, accessible component gallery, advanced tables, Excel/PDF,
uploads, documented extension examples, provider coverage, distributed rate
limiting, comprehensive security/accessibility testing, backup/restore and the
100,000-record benchmark are not closed by this checkpoint. Actual product
screenshots must be captured from the running completed UI, never synthesized as
evidence. No production-ready claim, GitHub Release or deployment is made here.

The owner's latest authorization allows merge and public release once **all**
requirements pass. Passing this checkpoint alone does not meet that condition.
Preserve prior work/history; no force push, source deletion or schema change.
