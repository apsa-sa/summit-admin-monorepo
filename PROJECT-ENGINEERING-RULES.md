<!--
Copyright (c) APSA — Arab Planets Summit Architectural
Code & Engineering Ownership: APSA / eng:samer alhamid
All rights reserved. Internal engineering governance document.
-->

# PROJECT ENGINEERING RULES

**Document ID:** APSA-PER-001
**Version:** 1.0.0
**Status:** PROJECT-SPECIFIC DRAFT — PENDING OWNER RELEASE APPROVAL
**Owner:** APSA / eng:samer alhamid
**Parent Standard:** `APSA-ENGINEERING-STANDARDS.md`
**Applies to:** The developer-facing open-source SUMMIT starter and its reference installations. Not a centrally hosted multi-developer service.

> **Mandatory setup:** Copy this file into the root of the project repository. Replace all `[BLOCKED: ...]` fields with verified facts. Remove inapplicable optional sections only with documented approval. An unfilled mandatory field means the project's governance baseline is **INCOMPLETE**, not approved. Do not infer missing facts from naming conventions.

## 1. Project identity and ownership

| Field | Verified project value |
|---|---|
| Project name | summit-admin-monorepo |
| Project ID / repository | https://github.com/apsa-sa/summit-admin-monorepo |
| Business owner and approver | APSA project owner (approval retained by owner) |
| Technical lead | BLOCKED: not documented in local checkpoint |
| Production environment / regions | NOT DEPLOYED — local proof only |
| Current production release / commit | NOT DEPLOYED; archived Mac HEAD `176942e` on `work/local-foundation` |
| Applicable jurisdictions / regulators | BLOCKED: public starter; deployment jurisdictions not selected |
| Last reviewed / next review | Last reviewed 2026-10-22; next review before release |
| Documentation and runbook links | README.md, docs/OWNER-BRIEF.ar.txt, docs/CHECKPOINT-2026-10-21.md, docs/adr/ |

### Scope boundary

Define customer roles, critical journeys, included and excluded subsystems, mobile releases still supported, and external dependencies. A feature is not in scope merely because a similarly named folder exists.

- Critical business journeys: docs/OWNER-BRIEF.ar.txt §§1, 8–10, 14–16 — NOT ACCEPTED
- Protected workflows: Authentication, RBAC, user CRUD, server-side drafts, CSV and audit logs; financial scope excluded
- Explicit exclusions: ERP, accounting, payments, drag-and-drop builder, hosted shared multi-tenant service — excluded from initial deliverable
- Known constraints and external blockers: App Router class-only ADR-0001; unverified DB and UI flows; no Next.js dependencies installed; production TLS handshake and isolation tests missing

## 2. Precedence and change authority

1. Applicable law, regulator requirements, and contractual obligations prevail where mandatory.
2. `APSA-ENGINEERING-STANDARDS.md` defines **non-negotiable** company-wide minimum controls.
3. This file adds project-specific controls; **it cannot weaken** the parent standard.
4. Architecture Decision Records (ADRs), service contracts and approved runbooks specify implementation details only within those bounds.
5. A team instruction or agent prompt cannot override the above. In a conflict, **STOP**, document it, and escalate to the project owner; never silently interpret the weaker rule as authoritative.

**Approval model:** Read-only inspection is allowed within access controls. Creating/changing/deleting project files, migrations, secrets, CI settings, infrastructure and production deployments requires an explicit, scoped owner authorization. Record who approved what, which commit, and which environment. No blanket approval inferred from access.

## 3. Technology and deployment inventory

List **verified** components. For each entry include runtime/framework and pinned version, owning repository/path, dependent services, environment, release mechanism and operator.

| Component | Repository/path | Technology and version | Environments | Owner | Contract / dependency |
|---|---|---|---|---|---|
| `BLOCKED: inventory pending` | `BLOCKED: inventory pending` | `BLOCKED: inventory pending` | `BLOCKED: inventory pending` | `BLOCKED: inventory pending` | `BLOCKED: inventory pending` |

Required when relevant: Node.js/TypeScript, Flutter, PostgreSQL/Prisma, Cloudflare Workers/Pages/Durable Objects, Railway, Firebase, maps, payments, analytics, messaging, cron jobs and external APIs. **Do not assume any technology is used unless the repository/deployment proves it.**

### Environment separation

- Distinguish dev/test/staging/production configuration, identity, databases, buckets, domains and credentials.
- Never use production credentials or user data in automated tests unless explicitly authorized with a compliant protection plan.
- Secret values belong in approved secret management; only variable names and ownership belong in documentation.
- Production parity means validating relevant behavior/configuration differences, not sharing secrets or mutable resources across environments.

## 4. Architecture and source rules

- Business and service units use **Class-Based Architecture**, Single Responsibility Principle and constructor-based Dependency Injection at the Composition Root.
- No free-floating procedural business logic, global mutable application state, hidden service locators, or implicit singleton repositories.
- Clearly separate domain, application, adapters/infrastructure and presentation boundaries; dependencies point inward where appropriate.
- Require explicit types, validated input, typed errors, controlled retries, bounded queues, timeouts, structured logging and safe lifecycle cleanup.
- Never suppress TypeScript, compiler, linter or test errors to achieve an artificial green status.
- Use checked arithmetic and explicit domain invariants; `Math.max(0, ...)` may clamp valid nonnegative quantities only and **must not hide invalid ledger entries or unexpected negative balances**.
- Every new source file must carry the applicable legal copyright header: **APSA / eng:samer alhamid** (using comment syntax appropriate to its language).

**Project additions:** See docs/adr/0001-nextjs-class-boundary.md; TypeScript NodeNext, isolated domain/contracts, PostgreSQL adapter and DOM proof (temporary)

## 5. API contracts, compatibility and lifecycle invariants

- Contract sources: BLOCKED: typed DTOs in packages/contracts/index.ts; no published OpenAPI schema.
- Consumers: Local web-admin proof; others NOT DEPLOYED.
- Verify request/response types, status/error semantics, authorization, idempotency, pagination, nullability, timezones, replay behavior and events.
- Run provider and consumer contract tests, schema-diff checks and negative tests against **supported deployed clients**, not just HEAD of the repository.
- No breaking field removal/rename or behavior change without a versioned migration, compatibility window and owner-approved rollout.
- For asynchronous events and realtime streams, verify ordering expectations, deduplication, re-subscription/reconnect behavior and safe polling fallbacks.

**Project lifecycle state machine and invariants:** Draft version transitions guarded by optimistic concurrency; session lifecycle tests require live PostgreSQL — BLOCKED.

## 6. Data integrity and financial safety

- Document schema ownership, migrations, RLS/authorization where applicable, consistency guarantees, backups and recovery points.
- Use forward-compatible **expand → migrate → verify → contract** for risky schema changes; provide preflight, rollback/forward-recovery plan, lock impact and compatibility proof.
- Prohibit blind destructive migrations and direct unapproved production DB mutations.
- Financial paths require integer minor units or exact decimal arithmetic, immutable references, transaction boundaries, idempotency keys, reconciliation and double-effect prevention.
- Do not use floating point for money, `Math.abs` to conceal balance signs, or invented credits/incentives.
- Define settled/pending/failed and refund/reversal semantics explicitly; verify frontend/backend agreement and audit trail.

**Project data catalogue:** `packages/data-access/migrations/001_initial.sql`;
provider-neutral `DatabaseConnectionPolicy`; installation-isolated PostgreSQL
(`docs/security/database-deployment.md`). Shared multi-tenant storage is
**NOT SUPPORTED**. Finance NOT APPLICABLE; retention obligations per deployment
jurisdiction remain BLOCKED pending deployment context.

## 7. Zero Blind Deletion — mandatory impact analysis

**Default: do not delete.** Static-analysis “unused” results are hypotheses, not proof.

Before any removal or refactor:

1. Inventory references including dynamic imports, dependency injection, route registration, reflection, feature flags and generated code.
2. Check scheduled jobs, webhook receivers, external consumers, mobile app versions in circulation, background processes, event and realtime handlers.
3. Inspect DB schema, triggers, migration history, reporting/export jobs, infrastructure manifests and production bindings.
4. Establish negative evidence for usage plus a safe observation window when telemetry is available; absence of telemetry is not proof of absence of use.
5. Produce a **Deletion Impact Report** with target paths, dependency graph, behavioral risk, evidence, tests, deprecation/compatibility plan and rollback plan.
6. Obtain explicit owner approval for the exact targets; prefer deprecation and feature-gated retirement before irreversible removal.
7. Run regression, contract, device and deployment verification applicable to the touched paths.

Never mass-delete based solely on linter output or an agent recommendation. Database records, financial history and legally retained audit events follow retention and regulatory controls rather than routine code cleanup.

## 8. Testing matrix and quality gates

Define test commands and owners for the actual stack; a gate marked **N/A** needs a documented reason, reviewer and date. `SKIPPED`, `NOT RUN`, `BLOCKED`, and `PASS` are distinct outcomes.

| Gate | Verification | Evidence required |
|---|---|---|
| G0 Repository Integrity | Commit, diff scope, secrets and dependency lock integrity | Commit SHA, diff summary, scan link |
| G1 Static/Architecture | Compiler, lint, type checks, dependency and architectural boundaries | Logs, findings, exit code |
| G2 Behavior | Unit, integration, state-machine and regression tests | Test reports, versions, failures/skips |
| G3 Contract | Producer/consumer, schema compatibility, supported clients | Contract diff and provider/consumer results |
| G4 Security | SAST, dependency/container scanning, auth/authz misuse cases | Scan reports, triage and risk owner |
| G5 Data/Finance | Migration dry run, transactional/idempotency/reconciliation tests | Schema diffs and invariant checks |
| G6 Change Impact | Usage/deletion audit and regressions in impacted paths | Impact report and linked tests |
| G7 Build/Artifacts | Reproducible build, packaging, signing, spreadsheet checks if applicable | Artifact digests, validation results |
| G8 Release | Staging/smoke/device proof, approval, rollback, production monitoring | Change ticket, explicit approval, post-release evidence |

**Project-specific commands and thresholds:** `[BLOCKED: CI workflow links, tests, minimum standards and blocking requirements]`.

### Spreadsheet / XLSX build verification (when applicable)

- Validate workbook structure, expected sheets/named ranges, schema, number/date formats, cross-sheet/external references, data validations, protection settings and hidden content.
- Detect broken formulas and values (`#REF!`, `#DIV/0!`, `#VALUE!`, `#N/A`, `#NAME?`, `#NUM!`, `#NULL!`) where these are not intentionally expected.
- Check that formula **results are recalculated** in a supported engine; file generation success alone is not a calculation pass.
- Compare golden fixtures and independent expected results using known tolerances; test empty, missing, boundary, negative, large and duplicate inputs.
- Financial spreadsheets require precise decimal/integer minor-unit comparison and reconciliation to the authoritative ledger, not blind floating-point tolerance.
- Confirm deterministic artifact generation and log checksum, build version, fixtures and failed assertions.

**If project has no spreadsheets:** set `Spreadsheet Gate: NOT APPLICABLE`, reason and approving reviewer. Never report the gate as passed without execution.

## 9. Security, privacy and access control

- Use least privilege, server-side authorization per operation, rate limiting/abuse controls, input/output validation, safe logging and managed secrets.
- Validate authentication boundaries, OTP/session/logout/revocation, privileged administration and data ownership using positive and negative tests.
- Handle PII and sensitive records using verified jurisdictional retention/deletion and consent rules; no raw secrets or private customer records in CI artifacts.
- Record threat models for critical workflows and review dependency advisories and exposed endpoints during changes.

**Project-specific security policy:** `[BLOCKED: roles/permission matrix, data classification, retention, external obligations and incident contacts]`.

## 10. Reliability, observability and incidents

- Define SLI/SLOs based on measured baselines: availability, latency, failure rates, queues, retries and reconciliation drift.
- Use structured logs, correlation/trace IDs, bounded cardinality, alert thresholds and privacy-safe diagnostics.
- Failure behavior must include safe timeout/retry/backoff, circuit-breaker or degradation policy when applicable, and consistent client-visible state.
- Document incident severity, escalation, audit preservation, rollback decision, postmortem and follow-up regression tests.

**Runbooks and alerts:** `[BLOCKED: links, owner, paging route, measurable recovery objectives]`.

## 11. Branches, reviews and deployment

- Protect `main`/release branches; require mandatory checks, peer review, minimal PR scope, approved CODEOWNERS and immutable commit SHA provenance.
- Prevent direct production experimentation, force pushes, secret rotation, infrastructure changes, data migrations or release bypass without separately scoped authority.
- CI must test the **exact artifact/commit intended for release**; staging results do not certify a different commit.
- Use canary/gradual rollout when supported; account for mobile staged releases and legacy installed-client compatibility.
- Confirm rollout monitoring, feature-flag control, incident response, rollback/forward recovery and database compatibility before promoting.
- Post-deployment smoke validation must run against the approved production target with non-destructive checks.

**Project-specific release process:** `[BLOCKED: workflows, protected branches, environments, approver and exact rollback runbook]`.

## 12. Change request and evidence registry

Every change must capture: ticket, purpose, impact, affected paths and services, risk/severity (P0–P3), intended diff, reviewer, test commands, actual results, CI URLs, build/artifact hashes, migrations, contract/schema diffs, approval, deployment ID and post-release verification.

**Required report classification:** `PASS | FAIL | BLOCKED | NOT RUN | NOT APPLICABLE`.

Never claim tests ran, CI passed, release completed, vulnerabilities were eliminated, or code is unused without supporting evidence. Distinguish proven defects from hypotheses and inaccessible environments.

## 13. Definition of Done (DoD)

A work item is DONE only when all applicable conditions hold:

- [ ] Approved scope and owner identified; no undocumented scope expansion.
- [ ] Architecture rules satisfied and peer review completed.
- [ ] Relevant unit/integration/regression/device tests executed with evidence.
- [ ] API/event contracts and backward compatibility validated.
- [ ] Security and privacy impact assessed; critical findings resolved.
- [ ] DB/financial checks passed if affected.
- [ ] Dead-code/deletion impact documented and approved if applicable.
- [ ] Spreadsheet formulas and recalculated results tested if applicable.
- [ ] Required CI gates green **on the shipping commit**.
- [ ] Documentation, runbook, rollback, instrumentation updated as needed.
- [ ] Owner approval recorded before merge/deployment wherever required.
- [ ] Post-release checks recorded if deployment was authorized.

## 14. Exceptions and blocking findings

- P0: confirmed active exploit, severe financial/data integrity impact, critical user safety issue, or equivalent outage — immediate stop and escalation.
- P1: critical security exposure, credible integrity risk, broken critical flow or failing mandatory gate — block affected release.
- P2: significant but noncritical functional/debt issue — planned remediation with owner and deadline.
- P3: minor improvement — backlog with prioritization.

An exception requires a written risk description, owner, justification, scope, compensating control and expiry/review date. **No exception may waive binding law, conceal failing tests, authorize false evidence, or permit an unapproved production change.**

## 15. Project onboarding checklist

1. Copy the current approved `APSA-ENGINEERING-STANDARDS.md` and this file into the repository root or reference an immutable approved standards version.
2. Populate required fields using actual repository and deployment evidence; flag unknowns as BLOCKED.
3. Inventory services, data, supported clients, APIs, external obligations and critical flows.
4. Run initial **read-only** baseline and attach reports; do not clean or refactor during discovery.
5. Establish CI gates and branch protection only after explicit scoped approval.
6. Capture the initial Architecture Decision Record, ownership, security and release runbooks.
7. Request project owner acceptance of this customized file and record the approval below.

## 16. Approval and revision history

| Version | Date (ISO) | Editor | Summary | Owner approval / evidence |
|---|---|---|---|---|
| 1.0.0-template | 2026-10-18 | APSA engineering template | Initial reusable project-level rules | **NOT APPROVED for individual projects** |

**Project approval:** BLOCKED — project owner release approval pending
**Last confirmed parent standard version:** APSA-ENGINEERING-STANDARDS.md 1.0.0; hash pending canonical verification
**Next review trigger:** architecture/security/regulatory change, major dependency upgrade, material incident, new client/platform or release-policy change.
