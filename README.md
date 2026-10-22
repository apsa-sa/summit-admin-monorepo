<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# SUMMIT Admin Monorepo / قمة — أساس مفتوح المصدر للوحات الإدارة

**Status: DEVELOPMENT FOUNDATION — NOT PRODUCTION READY**
**الحالة: أساس تطويري غير معتمد للنشر الإنتاجي.**

## Original repository charter / التعريف الأصلي

The original `main` README described the intended project as:

> Enterprise Monorepo Starter Boilerplate with Next.js, Tailwind CSS, Native RTL/LTR, and RBAC

This is the original product objective, not a statement that Next.js or Tailwind CSS has already been implemented. See the architecture status below.

## Who is this for? / لمن صُمّم؟

**SUMMIT is a developer-first, MIT-licensed open-source foundation** for
creating professional administration panels and reusable back-office tools.
It helps software developers and their organizations bootstrap applications;
it is **not** a shared hosted admin service that collects their customer data.

قمة أساس مفتوح المصدر لمساعدة المطورين على بناء لوحات الإدارة  وليس
منصة مركزية تستضيف بيانات مستخدمي المطورين أو تتطلب حساباً لدى APSA.

The intended distributable product combines reusable class-based TypeScript
application services, RBAC, authentication, PostgreSQL data access, bilingual
RTL/LTR interface components and self-hosting documentation. A reference
workflow demonstrates the integration end-to-end. Much of that deliverable is
**still missing or unverified**; the current HTML server is only a local proof.
ERP, accounting, payments and visual drag-and-drop builders are out of scope.

### Developer privacy boundary / ملكية المطور للبيانات

- One independently operated database **per installation**; the developer
  chooses local Docker, self-hosted PostgreSQL or a compatible managed service.
- **No required APSA-managed database, Railway subscription or developer-data
  ingestion.** Runtime database URLs and credentials stay with each deployer.
- The existing SQL schema is **single-installation only**. It is *not*
  multi-tenant SaaS and cannot safely host unrelated developer accounts in
  one shared schema without additional isolation and verification.
- The existing code has **no verified privacy or production-security
  certification**. Security controls, backups, logging and network exposure
  remain the deployer's responsibility until corresponding gates are proven.

See [database and privacy deployment policy](docs/security/database-deployment.md)
and [public source release gate](docs/security/publication-checklist.md).

## Checkpoint and ownership / نقطة الاستئناف

The original owner-provided Mac worktree was on branch `work/local-foundation`,
commit `176942e`, and clean when verified. This patch was developed in an
**isolated copy of those files**, and must be applied to that same worktree
only after checking that its branch, commit and status still match.

Original requirements: [`docs/OWNER-BRIEF.ar.txt`](docs/OWNER-BRIEF.ar.txt).
Original checkpoint: [`docs/CHECKPOINT-2026-10-21.md`](docs/CHECKPOINT-2026-10-21.md).
Current progress: [`docs/CHECKPOINT-2026-10-22.md`](docs/CHECKPOINT-2026-10-22.md).

© 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
Original authored code: [MIT](LICENSE); third-party licenses remain separate
([THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)).

## Architecture status / الحالة المعمارية

- **Source architecture:** pnpm workspaces, Turbo, TypeScript, class-based
  validation/auth/RBAC/data-access, minimal local HTTP server and PostgreSQL.
- **Added browser proof:** class-based DOM controllers and API client in
  `apps/web-admin/browser/`, with RTL/LTR, themes, protected operations,
  server drafts and localized interface. **Not** a Next.js App Router app.
- **BLOCKED:** Next.js App Router compatibility with the owner's strict
  class-only entry point requirement; see
  [`ADR-0001`](docs/adr/0001-nextjs-class-boundary.md). No framework adapter
  exception was introduced.

## Local verification / التحقق المحلي

On a supported Mac with Node 22.23.1 and pnpm 9.0.0, in the **correct**
project directory:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` runs TypeScript checking, actual Node test cases, then browser
TypeScript compilation. **A passing check does not validate PostgreSQL, Next.js,
accessibility, browser E2E, production security or release readiness.**

### Optional local database — mutating commands

**Only after inspecting** `.env.example`, the target database URL, the Docker
volume, schema and backup, and obtaining the applicable data-change approval:

```bash
docker compose up -d postgres
# export DATABASE_URL to the intended isolated local database
pnpm db:migrate
# provide an appropriate secret through your private environment only
pnpm db:seed
pnpm dev
```

Never run these commands against an unfamiliar or live database. The local
server binds loopback only (`127.0.0.1`) and requires an explicit `DATABASE_URL`.
The demo login (if seeded) is `admin@summit.test`; no default password is committed.
Open `http://localhost:3210` locally only. The UI is a class-based proof that
can exercise the existing server; it is **not** deployment-ready Next.js.

## Layout / بنية المشروع

- `apps/web-admin`: standalone local prototype server, DOM controller and assets
- `packages/core`, `packages/contracts`, `packages/core-rbac`: validation and RBAC
- `packages/auth`, `packages/security`: session and security primitives
- `packages/data-access`: PostgreSQL repository/schema and provider-neutral TLS connection policy (integration unverified)
- `packages/exports`: CSV exporter
- `packages/testing`: real unit/contract tests
- `packages/design-tokens`, `packages/ui`, `packages/localization`: planned shared packages; not fully implemented
- `docs`: requirements, checkpoints and ADRs

## Release gates / بوابات الإصدار

**Open:** Next.js decision and proof, server/PostgreSQL integration, session
revocation under concurrency, actual browser E2E, full English/Arabic UX,
export to Excel/PDF, file upload, accessibility and performance testing,
complete license/SBOM audit, security threat model, CI checks on the shipping
commit, owner acceptance, and controlled GitHub/hosting publication.

Before any public push, run `pnpm audit:publication` as an additional
read-only gate; its limited signatures are not a substitute for a separate
secret history scanner.

See [`SECURITY.md`](SECURITY.md),
[`APSA-ENGINEERING-STANDARDS.md`](APSA-ENGINEERING-STANDARDS.md), and
[`PROJECT-ENGINEERING-RULES.md`](PROJECT-ENGINEERING-RULES.md).

**Do not interpret this repository or its examples as an approved production
release. Do not use the development database credentials in production.**
