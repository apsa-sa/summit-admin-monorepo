<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Phase D prerequisite — request-scoped login admission

Status: PARTIAL; local checks passed, real PostgreSQL/current-head CI pending.
Baseline: main `65e82cd2e89c328b8ab007a57c8c7030849eb507`.
Independent branch `work/next-runtime-security-20261022`. This does not depend on
PR #4 or change its verified UI package head.

## Inspection and root cause

The reference composition root constructs a new in-memory RateLimiter. This is
valid for its long-lived standalone server. Reusing that root per request for a
Next.js login endpoint would reset counters, allowing brute-force attempts across
fresh instances/workers. The bounded Next proof exposes session/logout only, so
this is a prerequisite of the proposed login integration, not a claim that a
currently shipped Next login was exploited or that prior closed work regressed.

## Changes and contracts

- `packages/contracts/ports.ts`: additive LoginAttemptPolicy check(): void|Promise<void>.
- `packages/application/authentication.ts`: inject the port and await admission
  before credential reads; no credential/session contract changes.
- `packages/data-access/rate-limiter.ts`: PostgreSQL adapter, transactions,
  installation-local admission, hashed peer keys, bounded capacity/counts/timeouts.
- `packages/data-access/migration-runner.ts`: ordered atomic/checksummed migrations.
- `packages/data-access/migrations/002_login_attempts.sql`: additive bounded table/index.
  Existing 001 remains byte-for-byte unchanged.
- `apps/web-admin/server/composition-root.ts`: explicit optional database adapter
  mode; default retains existing standalone behavior. No Next entry added yet.
- `tooling/scripts/database.ts`: explicit migration command uses the runner.
- `packages/testing/login-admission.test.ts`: two unit tests, fail-closed async
  admission and constructor validation without opening a database connection.
- `packages/testing/integration/login-admission.test.ts`: five real DB scenarios
  plus parent: concurrent/idempotent migration preservation; fresh-instance limits
  and install isolation; concurrent allowance/expiry; capacity/invalid keys/SQL
  input safety; checksum mismatch/data preservation.
- Added `docs/security/login-admission.md` and this report.

Dependencies/upgrades/removals: NONE. No unrelated formatting or source deletions.
No main/ruleset change, production data access, merge, release or deployment.
No new architecture exception or framework boundary. Constructor DI and the
existing application/controller/session/RBAC contracts are preserved.

## Actual evidence before CI

Node 22.23.1 / pnpm 9.0.0, accepted pins unchanged. `pnpm check`: strict typecheck,
54/54 units/contracts (52 retained + 2 added), zero fail/skip, original browser
build PASS. Publication audit PASS. Real PostgreSQL cases, bounded Next build,
12 retained browser tests, dependency audit and Gitleaks remain NOT RUN on this
new head until GitHub Actions executes them. No local DB gate was substituted
with mocks. Prior main/PR4 results certify their own commits only.

P1: current-head CI and real DB evidence; then wire the database mode in the
final Next login route and prove its end-to-end journey. Final reference product
remains PARTIAL/NOT IMPLEMENTED as the Phase A matrix specifies. No performance
or production-ready claim. This adapter is not an exhaustive anti-abuse system.

Rollback: abandon the isolated PR or reviewed application-code revert. Additive
tables may remain; no destructive down migration or silent data cleanup. Further
schema work must append an immutable migration and preserve the recorded hashes.
Next: full Next reference app using the proven shared packages, existing services,
request-scoped database admission, and preserved DOM/proof compatibility.
