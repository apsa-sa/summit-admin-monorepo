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

## 2026-10-22 — bounded owner authorization and proof

The owner answered **«ابدا موافق ولكن التزم الشروط»** to the plan explicitly
requesting a limited exception for framework entry functions, while retaining
Class-Based / SRP / constructor DI for project logic. The accompanying owner
conditions prohibit **unapproved or silent** exceptions. This is recorded as
approval for the following bounded proof only; no blanket functional rewrite,
merge, production launch, or governance waiver is authorized.

| ID | Entry | Allowed work |
|---|---|---|
| B1 | `apps/next-proof/app/layout.tsx` | Read framework cookies, delegate preferences, emit document shell |
| B2 | `apps/next-proof/app/page.tsx` | Read framework cookies, pass serializable preferences to a class component |
| B3 | `apps/next-proof/app/api/session/route.ts` | Delegate GET to request-scoped composition root |
| B4 | `apps/next-proof/app/api/session/logout/route.ts` | Delegate POST to request-scoped composition root |

`next.config.ts` and `playwright.config.ts` are framework/tool configuration,
not domain services. The webpack resolution callback only maps NodeNext `.js`
imports to their TypeScript sources. Existing test callbacks remain test-runner
boundaries. No business rules, SQL, permission decisions, or shared mutable
services may be introduced into these boundaries.

The proof uses Next.js **16.4.2**, React / React DOM **19.3.1**, TypeScript
**7.0.2**, Node **22.23.1**, pnpm **9.0.0**. These are exact installed pins,
not a claim that all transitive dependencies have received a full license or
security certification. Package notices and lockfile retain separate ownership.

Application code is class-based: `SessionProfileService`, `SessionController`,
`ProofCompositionRoot`, `ProofPreferences`, `ProofMessages`, `ProofWorkspace`.
Only plain data crosses the server/client boundary; no service or repository
instance is serialized. The original DOM proof remains intact and runnable.

**Status: PROOF IMPLEMENTED — ACCEPTANCE PENDING.** Production build passed
locally. SSR, hydration and PostgreSQL/browser integration are executable gates
in the new CI job; their actual results must be reviewed before closing this ADR.
This proof does not deliver the final admin app, login UI, full reference journey,
Tailwind integration, docs app, error-boundary behavior or all rendering modes.
Revisit before extending the boundary or selecting additional UI libraries.
