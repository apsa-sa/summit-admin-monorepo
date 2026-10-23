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

## Architecture proof additions (2026-10-22)

| Package | Exact version | Declared license | Usage |
|---|---|---|---|
| next | 16.4.2 | MIT | Isolated App Router compatibility proof |
| react / react-dom | 19.3.1 | MIT | Proof rendering and hydration |
| @types/react / @types/react-dom | 19.3.0 | MIT | Proof type declarations |
| @playwright/test | 1.64.1 | Apache-2.0 | Browser and HTTP contracts |

This list supplements the baseline. It does not replace recursive license
review, copied notice texts, dependency advisory checks or the release SBOM.
No UI framework source, fonts or third-party image assets were copied.

## Spreadsheet exporter addition (2026-10-23)

| Package | Exact version | License | Usage |
|---|---|---|---|
| fflate | 0.8.3 | MIT, Copyright (c) 2026 Arjun Barrett | Server ZIP creation for macro-free SpreadsheetML; root development tests inspect generated archives |

Verified against upstream tagged [package metadata](https://github.com/101arrowz/fflate/blob/v0.8.3/package.json)
and [license](https://github.com/101arrowz/fflate/blob/v0.8.3/LICENSE).
The exact upstream notice is retained in [fflate-0.8.3-LICENSE.txt](docs/licenses/fflate-0.8.3-LICENSE.txt).
This version declares no runtime dependencies. Existing resolutions were not
upgraded. This is an addition to the historical baseline above, not the final SBOM.
The existing design-token build distributes Noto Sans Arabic 5.2.8 font subsets
with their OFL notice; that earlier addition does not change this MIT notice.

## PDF rendering runtime

Playwright 1.64.1 (Microsoft, Apache-2.0) is already the pinned browser-test
engine; this increment also declares its actual server runtime consumers without
changing the existing package/snapshot resolution. Exact upstream LICENSE and
NOTICE copies are in docs/licenses/playwright-1.64.1-*.txt. Its ThirdPartyNotices
remain distributed with the dependency. Chromium is installed by the operator
using the pinned Playwright installer; its own bundled notices apply. PDF embeds
Noto Sans Arabic 5.2.8 under SIL OFL-1.1, including its existing packaged notice.

## Private file preparation (work in progress)

Sharp 0.35.5 is now an explicit runtime dependency of the file adapter and Next
admin, and a development dependency for real image fixtures. It was already
resolved by the pinned Next version; package/snapshot resolutions are unchanged.
Sharp is Apache-2.0; its exact license is retained in
`docs/licenses/sharp-0.35.5-LICENSE.txt`. Native libvips and its bundled codecs
retain their separate licenses (including LGPL obligations); the final recursive
license review and SBOM remain release gates. This notice does not certify every
native codec as MIT or grant rights beyond the upstream licenses.
