<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# Isolated development checkpoint — 2026-10-22

## Source identity and scope

Owner Mac baseline at start: `work/local-foundation` / `176942e`, clean.
This checkpoint describes modifications made to a **copy from an uploaded ZIP**.
It does not assert the user's current Mac branch/commit have remained unchanged.
Files in the sibling `sources/` folder were not modified. No changes were
made to GitHub, Sites, external CI or any deployed service.

## Work completed in this isolated copy

1. Added three class-based browser modules: `api.ts`, `localization.ts`,
   `app.ts`, plus accessible HTML and CSS theme foundation.
2. Restored a meaningful browser build by adding actual TypeScript sources and
   adjusting the local server's allowlisted browser routes.
3. Added 26 focused unit tests for validation, RBAC, authentication primitives,
   rate-limiting, financial type constraints and CSV injection handling.
4. Bounded the in-memory rate limiter's tracked keys and kept the server's
   backend authorization enforcement intact. In-memory limiting still has
   cross-instance security limitations and is not suitable for deployment.
5. Added the original MIT text and APSA notice, basic docs, limited dependency
   notice from package metadata, and company/project engineering standards.
6. Documented the unresolved Next.js class-only App Router incompatibility
   without implementing a prohibited functional glue adapter.

## Verification in this session

- Linux sandbox: Node 22.16.0 (below project's required 22.23.1), TypeScript
  global 5.8.3 (not the pinned 7.0.2). Mac-installed TypeScript 7.0.2 is a
  platform package and cannot be executed on this Linux container.
- Global tsc typecheck: **PASS** (sandbox only, not pinned version).
- Global tsc browser build: **PASS** (sandbox only, not pinned version).
- Compiled Node unit suite: **26/26 PASS**.
- PostgreSQL integration: **NOT RUN** (no supported local PostgreSQL service).
- HTTP static asset smoke: **PASS** (five public assets returned HTTP 200 and `.env` returned HTTP 404, with a dummy disconnected database URL).
- Browser E2E and accessibility: **NOT RUN**.
- Next.js App Router: **BLOCKED** (owner decision pending; no false claim).
- GitHub push, Sites creation, external CI, production deployment: **NOT RUN**.

## Continued work and release decision

Before applying any patch on Mac, confirm exact original branch/commit and
clean status and inspect `git apply --check`. Rerun `pnpm install --frozen-lockfile`
then `pnpm check` in the original supported environment. Verify PostgreSQL
using an explicitly approved isolated database before treating the server as
validated. Resolve ADR-0001 before implementing the requested Next.js product.
Do not merge, publish or claim ready for production until release gates pass.

## Continuation — developer privacy and publication safety

- Clarified core purpose as an MIT-licensed, developer-oriented, self-hostable
  admin starter. No shared APSA database for developers is required.
- Added `docs/security/database-deployment.md` and publication checklist. The
  first release is an independently operated PostgreSQL database per install,
  not a multi-tenant platform. Railway/Neon/Supabase are **optional** choices.
- Added `DatabaseConnectionPolicy` and constructor injection to repository
  call sites. Off-loopback database URLs require `sslmode=verify-full`, with
  unsafe TLS/host overrides rejected before pool construction. A live remote
  certificate handshake was not tested in this environment.
- Added deterministic source+reachable-history publication signature scanner
  (`pnpm audit:publication`). It is intentionally NOT a security certificate
  or substitute for Gitleaks/TruffleHog and manual legal/privacy review.
- Added unit tests for the above controls. Preserve the prior checkpoint,
  source files, recorded architecture block and unresolved release gates.
- Must validate these changes on the owner's actual Mac and re-audit its
  current branches and reflog before any public upload. No external push was
  performed by this continuation.
