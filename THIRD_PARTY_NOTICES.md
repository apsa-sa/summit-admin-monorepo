<!-- Copyright (c) 2026 APSA / eng:samer alhamid. SPDX-License-Identifier: MIT -->
# Third-party components (development baseline)

The project-owned source is licensed under MIT. Each dependency retains its own
copyright and license. This inventory was derived from the **installed package
metadata included in the owner's local checkpoint archive**, not a current
registry audit; no third-party source has been copied into this deliverable.

| Package | Pinned version | Declared license | Usage |
|---|---|---|---|
| pg | 8.23.1 | MIT | PostgreSQL client |
| typescript | 7.0.2 | Apache-2.0 | Type checking and browser compilation |
| tsx | 4.23.15 | MIT | TypeScript local runtime and test runner |
| turbo | 2.11.10 | MIT | Monorepo task runner |
| @types/node | 22.20.5 | MIT | Node.js type declarations |
| @types/pg | 8.23.1 | MIT | PostgreSQL type declarations |

**Release blocker:** recursively audit `pnpm-lock.yaml` for all production,
development, optional and transitive packages, retain applicable license texts,
report unknown licenses and generate an SBOM before distribution. A dependency's
license is never replaced by this project's MIT declaration. No external fonts,
logos or icon assets are bundled in the authored UI.
