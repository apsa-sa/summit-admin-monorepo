<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Run the reference Next admin / تشغيل تطبيق الإدارة المرجعي

Development increment; complete release acceptance remains open. Node 22.23.1 and
pnpm 9.0.0 are pinned. The Next app and retained standalone DOM app are separate
consumers of the same services/contracts/database; each must use its own exact origin.

## Isolated local setup

From the repository root:

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Edit your private `.env`: select your own isolated development `DATABASE_URL`,
set `APP_ORIGIN=http://127.0.0.1:3212`, and provide a unique 12–128 character
`SEED_ADMIN_PASSWORD`. Never commit this file. The local Docker configuration is
optional (`docker compose up -d postgres`); a compatible independently operated
PostgreSQL installation is equally valid. Inspect the selected database before
running the following explicit state changes; do not use a live/unknown database.

```bash
node --env-file=.env --import tsx tooling/scripts/database.ts migrate
node --env-file=.env --import tsx tooling/scripts/database.ts seed
pnpm build:packages
pnpm admin:dev
```

Visit **http://127.0.0.1:3212** and sign in as `admin@summit.test` using the password
you provided privately. The seed preserves existing users/passwords; changing the
environment does not reset an existing account. `pnpm db:migrate` / `pnpm db:seed`
are equivalent only when their required variables are already exported; unlike
the Next wrapper, these aliases do not automatically load `.env`.

The Next wrapper loads the root `.env`, defaults to loopback port 3212, and accepts
`SUMMIT_ADMIN_PORT`/`SUMMIT_ADMIN_HOST`. Keep APP_ORIGIN exactly aligned with the
browser URL including hostname and port. A mismatched origin is rejected rather
than silently weakening CSRF protection. `TRUSTED_CLIENT_IP_HEADER` is optional
and must stay unset unless a trusted proxy enforces that boundary.

## Build and verify

```bash
pnpm check
NODE_ENV=production pnpm admin:build
NODE_ENV=production pnpm admin:start
```

`check` validates strict root compilation, unit/contracts, original DOM compilation
and real shared package exports. `admin:build` builds the Next consumer and its
package dependencies. These commands do not prove all runtime/security/release
requirements. Real PostgreSQL/Chromium run in CI using explicit disposable test DB
approval; see [integration run guide](../verification/RUN-ARCHITECTURE-GATE.md).
Never point test fixtures at a non-test database. Starting the app never migrates
or seeds automatically.

Implemented core journey: login → server draft/resume → paged users/search/filter/
sort → permitted Drawer CRUD → audit → authorized CSV → logout/revocation.
See [table views](table-views.md) and [account/preferences](account-preferences.md).
Excel/PDF/files, reference analytics, full component/docs gallery, large-data
performance/recovery and RC acceptance remain separate gates. No empty navigation
item represents these unfinished features.

The retained DOM app uses `pnpm dev` and a separately chosen APP_ORIGIN/PORT
(default localhost:3210). The bounded Next proof remains under `proof:*`; it is
not replaced or relabelled as the final app. Never run consumers with conflicting
ports or assume one origin setting works for all three.

## العربية

ثبّت الإصدارات المحددة، ثم انسخ `.env.example` إلى `.env` واضبط قاعدة التطوير
المستقلة و`APP_ORIGIN=http://127.0.0.1:3212` وكلمة مرور ابتدائية خاصة بك. أوامر Node
أعلاه تقرأ `.env` صراحةً قبل الترحيل والبيانات التجريبية. ابنِ الحزم المشتركة ثم شغّل
`pnpm admin:dev` وافتح العنوان نفسه. التطبيق الأصلي وإثبات Next باقيان، ولكل مستهلك
أصل ومنفذ مستقلان. لا يُنفّذ التشغيل ترحيلاً أو تعبئة تلقائية. نجاح البناء لا يعني
اعتماد المشروع للإطلاق؛ نتائج كل التزام وحدودها موثقة في تقارير التحقق وPR.
