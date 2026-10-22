<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# Security policy / سياسة الأمان

This repository is an **unfinished demonstration foundation**, not a security-
certified or production-ready administrative platform. Do not expose its sample
server or seed data to the public internet.

Report suspected vulnerabilities privately to the project maintainers through
an authorized private channel; do not include live credentials or personal data
in public issues. Maintain least privilege, retain audit evidence, and never
commit `.env`, access tokens, private keys or live data exports.

The current release model is **self-hosted and single-installation**:
APSA does not require a central user/developer database. Deployers must own
and protect their own PostgreSQL instances. Managed PostgreSQL providers are
optional; the application must not silently downgrade TLS on non-loopback
connections. See [database deployment](docs/security/database-deployment.md).

Before publishing source into a public repository, follow the
[publication checklist](docs/security/publication-checklist.md), including
history and dependency scans. Do not post secret values or real user data.

Open security gates: live PostgreSQL integration with session invalidation,
auth concurrency, bounded cross-instance rate limiting, CSRF/origin/proxy
configuration, dependency and license scan, runtime headers, secret scan,
HTTPS and cookie handling, deployment authorization and audit of file uploads.

## Local policy

- `.env.example` is non-secret demonstration configuration, never production.
- `db:migrate` and `db:seed` mutate a database: execute only after checking
  the full URL, active environment, schema, backups and owner authorization.
- Failure to revoke a remote session is not successful logout.
- Authentication/authorization must always be enforced by the server.
