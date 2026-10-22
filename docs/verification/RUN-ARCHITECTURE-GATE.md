<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# Run the architecture gate / تشغيل بوابة المعمارية

Use Node 22.23.1 and pnpm 9.0.0 from a fresh checkout. This stage supports the
Linux CI and macOS development targets; Windows has not been verified.

```bash
pnpm install --frozen-lockfile
pnpm check
NEXT_TELEMETRY_DISABLED=1 pnpm proof:build
pnpm audit:publication
pnpm audit --audit-level low
```

For the bounded UI proof only:

```bash
NEXT_TELEMETRY_DISABLED=1 pnpm proof:start
```

Open `http://127.0.0.1:3211`. The original app remains `pnpm dev` on port 3210.
Without database/origin configuration the proof's session API returns 503;
it never reports a successful authenticated state from a mock.

For PostgreSQL and E2E, use **only a newly provisioned disposable** local
PostgreSQL service whose control database is `summit_test`. Set
`TEST_DATABASE_URL` privately to that instance, with a dedicated test role
allowed to create databases. Set `DATABASE_URL` to the **same** value for the
Next proof server. Never use a real application's database. Then:

```bash
export SUMMIT_TEST_DB_APPROVED=1
export PROOF_ORIGIN=http://127.0.0.1:3211
export NEXT_TELEMETRY_DISABLED=1
pnpm test:integration
pnpm exec playwright install chromium
pnpm test:e2e
```

The CI job provisions PostgreSQL 17.6 itself and configures these variables.
Integration tests fail when prerequisites are absent; they do not silently skip.
Source privacy requires an independent history-aware scanner in addition to the
limited publication audit. No screenshots are presented as final product images
until the actual interface and visual QA are complete.

هذا نموذج إثبات محدود. نجاحه لا يعني اكتمال واجهة الإدارة أو اعتماد الإنتاج.
قاعدة البيانات التجريبية مستقلة، ولا تُستخدم مفاتيح أو بيانات مشروع آخر.
