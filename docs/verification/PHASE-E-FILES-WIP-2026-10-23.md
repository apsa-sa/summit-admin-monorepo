# Phase E — private files checkpoint (PARTIAL)

Reference: main d788e96c526429e778464b44588a9c18a0fbb7da.

## Scope

The existing owner brief requires real-type/size/permission validation and a
clear path for WebP, HEIC and PDF. This checkpoint adds contracts, domain
validation, application service, injected Sharp adapter, a private PostgreSQL
repository, append-only migration 004, bounded raw HTTP transport and server
composition. Existing app/proof/exports and immutable migrations are preserved.
No new Next framework exception, hook, service locator or global mutable
processing semaphore is introduced.

JPEG/PNG/WebP receive a genuinely decoded, bounded, metadata-free WebP preview.
Original bytes are retained. HEIC and PDF are classified container/header data
and stored as original-only; neither rendering nor antivirus safety is claimed.
Animated supported rasters are original-only.

Per account: 5,000,000-byte original, 10 objects, 50,000,000 combined stored bytes.
Image processing: at most 16,000,000 pixels, 1600px preview edge, 1,000,000 preview
bytes; native processing has a deadline. PostgreSQL transaction admission limits
parallel processing per installation, and owner locks serialize quota/retry
checks. Retries reuse a UUID and matching digest/name/type; one audit only.
Every read/write is scoped to the current session owner, including administrators.
The live clock is checked after lock waits and processing, not transaction now().
Audit failure rolls back bytes and mutations. No external storage credential.

## Direct evidence and limits

- Local baseline plus preparation tests: 121 unit/contracts PASS, 0 failed/skipped.
- Native browser asset contract: 4 PASS.
- Package ESM/declarations/CSS/notice consumption contracts PASS.
- Strict typecheck including new integration source PASS.
- Added seven real-PostgreSQL scenarios: preservation/preview, ownership, concurrent
  retry, audit rollback, processing admission, expiry/logout, quota/deletion.
  Executed on a1d7b0f: all 42 PostgreSQL tests PASS, including these scenarios.
  Run 39902301625 also passed locked installation, security/secret scans and all
  builds. E2E had 34 PASS and one exact-capability count failure: adding files:read
  changed the viewer contract from three to four grants. The follow-up preserves
  exact cardinality, asserts all four grants and forbidden write grants, and adds
  direct file read/POST/DELETE checks; the complete run must pass on its new head.
- A local PostgreSQL launch was unavailable: this container maps only UID 0, and
  PostgreSQL requires a non-root user. No test is skipped or replaced with a mock.
- File browser client, UI, E2E and complete native license review remain NOT IMPLEMENTED.
- New code is not approved for merge or public release by this checkpoint.

## Hosting evidence

A separate private Sites derivative hosts the real component workbench from
verified main, not the administration backend. Site source commit
bdf3c65176277e4b2e82067b322fc074e9b83cc0; deployment
appgdep_6adae61b29f88191b5cb62467299590a succeeded.
https://summit-component-review.abloomwand2.chatgpt.site

Only static export, fixed initial Arabic/light preferences and an explicit scope
notice differ in that derivative. The original GitHub docs runtime is unchanged.
Browser checked language switching, dark appearance, dialog opening, closing
and focus restoration. This does not prove PostgreSQL or full administration on Sites.

## Remaining / rollback

P1: real PostgreSQL execution, client/UI, E2E and races, remaining file security
contracts and licenses, documentation. No main merge until complete.
To abandon: close the draft and retain main. Migration 004 has not run on any
production database. Once used, preserve its history and data; never blindly
drop attachment tables. Full release performance/restore/security/SBOM gates
remain open independently of this checkpoint.
