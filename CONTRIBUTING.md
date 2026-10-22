<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# Contributing / المساهمة

Work in a dedicated branch and do not overwrite the owner's checkpoint or
unrelated files. Before editing, read `docs/OWNER-BRIEF.ar.txt`,
`APSA-ENGINEERING-STANDARDS.md`, `PROJECT-ENGINEERING-RULES.md` and ADRs.

Use class-based, single-responsibility, constructor-injected services.
No hard-coded credentials, global mutable business state, procedural modules,
mock-success tests, silent error swallowing, or changing CI gates to hide
failures. Submit small changes with tests and migration impact descriptions.

Run `pnpm install --frozen-lockfile` and `pnpm check` on the pinned Mac runtime
before opening a pull request. PostgreSQL tests require an explicitly isolated,
reviewed test database. Keep generated files and downloaded dependencies out of
the source patch. Provide reproducible test output linked to the exact commit.

Arabic and English contributions are both welcomed. Never delete or replace
third-party copyright or licensing notices.
