# SUMMIT appearance correction . 2026-10-23

Reference main: d788e96c526429e778464b44588a9c18a0fbb7da.

Owner request: remove the link underlines shown in the component workbench and
replace displayed em dash separators with periods. Only SUMMIT is in scope.

The docs shell now styles normal, visited, hovered and focused semantic links
without text decoration, with the approved primary color and an explicit visible
keyboard outline. Link targets and semantics remain unchanged. The docs title,
shared bilingual status/copyright strings, dashboard empty placeholder and PDF
footer use periods. Copyright comments, original license text and third-party
notices are preserved. No dependency, authentication, database, role or API change.

Local strict typecheck, existing 117 unit/contracts, 4 native asset contracts,
package build/consumption and notice contracts passed without skips. The actual
Sites export is rebuilt from the same source changes; browser and deployment
results are reported by the matching Site version rather than assumed here.
Full GitHub Actions on the proposed commit must pass before merge.

Rollback: revert this focused change. No data migration or cleanup is involved.
The private Sites workbench remains a component/documentation preview; it does
not claim to host the complete PostgreSQL administration runtime. Cloudflare
account connectivity was verified read-only. No Cloudflare resources, DNS,
existing projects or production databases were changed during this correction.
