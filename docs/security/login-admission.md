<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Login admission across request scopes

The original standalone reference server owns a long-lived composition root and
an in-memory limiter. A future Next.js request-scoped root must select the
PostgreSQL adapter explicitly:

```ts
const root = new AdminCompositionRoot(databaseUrl, origin, 'database');
```

The default remains `memory` for backward compatibility with the existing
standalone proof. The bounded Next.js session proof has no login endpoint and
is unchanged. Do not deploy a request-scoped login route with the memory adapter.

`LoginAttemptPolicy` is an application port, supporting synchronous or asynchronous
admission. Authentication awaits it before reading/verifying credentials or issuing
a session. Storage failure fails closed. `PostgresRateLimiter` stores SHA-256 peer
keys in each installation's database; these are pseudonymous and potentially
guessable for low-entropy IPs, not anonymous. No raw peer/email/password is stored
in this table. The adapter does not trust request headers or determine peer identity.
A deployer must enforce any trusted proxy boundary before accepting forwarded IPs.

Each key allows 15 attempts per one-minute database-clock window. Denied counts
saturate at 16 until expiry. A transaction advisory lock makes capacity/allowance
consistent across workers, with a 3-second statement timeout. At capacity (default
10,000 active keys), new peers fail closed; existing peers retain their remaining
allowance. Expired entries are removed during admission. This is a bounded abuse
control, not a complete DDoS defense or lockout/recovery policy.

Run migrations with a dedicated migration role. Runtime login admission needs
SELECT/INSERT/UPDATE/DELETE on `request_limits`; it needs no DDL privilege or
write access to `schema_migrations`. Keep database TLS policy and per-installation
storage isolation. Do not run this migration against an unknown/production DB.
The migration command remains an explicit operator action, never an application
startup side effect.

`MigrationRunner` applies the known immutable SQL list atomically, serializing
concurrent runners and recording file SHA-256 checksums. Existing unjournaled
001 is deliberately reapplied under its already-tested idempotence contract.
Editing a journaled migration fails; append a reviewed new migration instead.
The initial SQL is not modified. No destructive down migration is provided.
A rollback to the previous app can leave the additive tables in place safely;
reverting application code is distinct from deleting operational data.

العربية: عند نقل تسجيل الدخول إلى طلبات Next.js، يجب اختيار محدِّد PostgreSQL
المشترك صراحةً؛ المحدِّد الذاكري لا يحافظ على عدّاده عند إنشاء جذر جديد لكل طلب.
تُجرى الترحيلات بأمر مستقل على قاعدة معلومة، وتُرفض المصادقة عند تعذّر التحقق
من عدد المحاولات. لا تُغيَّر نقاط دخول إثبات Next.js الحالي في هذه المرحلة.
