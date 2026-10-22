<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# PostgreSQL deployment and developer-data isolation / نشر قاعدة البيانات وعزل البيانات

## Product boundary / حدود المنتج

SUMMIT is an open-source **starter kit for developers**. Its first release is designed
for **independent, self-hosted installations**. APSA does not need to operate a
shared accounts database for developers who clone and deploy the starter.
There is **no hosted multi-developer account service in the current source**.

Each installation owns its runtime, database, backups, secrets, users, retention
policy and operating jurisdiction. Source distribution on GitHub is distinct
from hosting anyone's application or receiving their data. This statement
is a product architecture requirement, **not a security or privacy guarantee**.
No service may claim that data can never be leaked.

## Supported deployment patterns / أوضاع التشغيل

| Profile | Database | Access boundary | Status |
|---|---|---|---|
| Local demonstration | Dedicated Docker PostgreSQL on loopback (`127.0.0.1`) | Mac/developer only | Local config supplied; integration unverified |
| Self-hosted | A PostgreSQL instance belonging to that developer | App server owns DB credentials; users cannot access DB directly | Architecture target, not deployment certified |
| Hosted PostgreSQL | Managed PostgreSQL (e.g. Neon, Supabase, Railway), independently provisioned per developer | TLS with certificate+hostname verification; provider-specific network controls | Supported connection *policy*, no provider certified |
| Shared APSA SaaS / Multi-Tenant | One or more provider databases spanning unrelated developers | Tenant authorization, RLS or physical isolation, isolation tests, separate threat model | **OUT OF SCOPE / BLOCKED** |

No provider is mandatory. The project does not bundle a managed DB account,
API key, cloud project, payment subscription or remote telemetry destination.
Choose services on their documented security, retention, residency and
recovery characteristics; free tiers are for trials, not guaranteed production SLAs.

## Connection contract / متطلبات الاتصال

The backend accepts `DATABASE_URL` only from a protected runtime environment.
Never embed it in browser code, `.env.example` with real credentials, GitHub
commits, container images, logs or issue reports.

`DatabaseConnectionPolicy` enforces the following before constructing a pool:

1. Parse a PostgreSQL URI, with a host, login and database name.
2. Loopback (`127.0.0.1`, `localhost`, `::1`) is allowed for development without TLS.
3. Any other hostname **requires** `sslmode=verify-full` in `DATABASE_URL`.
   Certificate chain and hostname verification must succeed; provide the
   operator's trusted CA via properly reviewed runtime configuration if needed.
4. Reject connection-string parameters that can override host or TLS policy.
   Never use `rejectUnauthorized:false`, `sslmode=no-verify` or permissive TLS.
5. Encryption in transit is not equivalent to network isolation or
   authorization. Use private networking/firewall rules where supported.

**Limits:** validation does not itself prove network encryption, a trustworthy
CA bundle or platform security. Actual remote handshakes and failures must be
tested against the chosen provider. CI must cover those tests on the release.

## Required security controls / الضوابط المطلوبة

- Create distinct database identities and databases for dev/test/production.
- Apply minimum privileges to the app account; migrations use a separate,
  temporary role. No superuser credentials in an application runtime.
- Treat migration and seed commands as **data mutations**: verify target,
  backup, volume and approval before execution. Do not blindly rerun seeds on
  a database that contains real users.
- Encrypt and separately authorize backups; test point-in-time or scripted
  recovery with synthetic data; define retention and deletion.
- Use query parameters for untrusted values and authorization on the server.
- Record session revocation and audit changes atomically where required.
- Disable public DB exposure unless the deployment has reviewed compensating
  controls. Protect logs from personal data and connection credentials.
- Never claim tenant isolation for the existing schema; it lacks `tenant_id`
  and the associated ownership/RLS constraints. Separate installations are
  the MVP isolation boundary.

## Release-blocking verification / الفحوص قبل التشغيل الحقيقي

Current status is **NOT VERIFIED** for live PostgreSQL integration, rate limiting
across replicas, TLS handshakes, abuse resilience, access revocation races,
restore drills, residency obligations and cross-tenant safety. No production
usage or shared multi-developer service should be enabled on the basis of the
present source alone.
