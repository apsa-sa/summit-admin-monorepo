<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# ADR-0001 — Next.js App Router and class-only boundary

**Status:** BLOCKED — requires owner architecture decision and a compatibility proof.
**Evidence baseline:** owner brief, checkpoint 176942e, Next.js App Router docs reviewed 2026-10-22.

## Mandatory constraints

- Owner requested Next.js App Router, server-side auth and data access.
- Every project-owned unit and screen must use a class. No functional glue
  component, root layout or route handler without explicit authorization.
- No substitute standalone HTTP server may be described as the Next.js target.

## Verified facts

- Next.js App Router registers `app/page.tsx`, `app/layout.tsx` and route handler
  files by convention. Layouts/pages are Server Components by default.
- React supports class components, but class components are ordinarily Client
  Components and cannot simply replace all Server Component/route-handler
  entry points without a documented compatibility proof.
- The checkpoint did not install or test Next.js. The independent local HTTP
  server and DOM-based UI remain **temporary architecture proofs only**.

References:
- https://nextjs.org/docs/app/getting-started/layouts-and-pages
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://react.dev/reference/react/Component

## Decision pending

1. Prove a fully class-only App Router implementation with an exact pinned
   Next.js/React compatibility matrix, including layout, page, route handlers,
   build, SSR, client hydration, errors and auth.
2. If not possible, obtain **explicit owner authorization** for a minimal
   framework-mandated functional entry boundary while keeping all domain,
   application and infrastructure logic class-based.

Neither alternative has been approved or demonstrated. Do not mark this ADR
closed based on the standalone DOM view delivered in this patch.
