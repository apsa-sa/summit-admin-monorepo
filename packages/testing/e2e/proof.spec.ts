// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { SessionToken } from '../../security/index.js';
import { DatabaseFixture } from '../support/database-fixture.js';

class NextProofBrowserSuite {
  register(): void {
    test('Server renders Arabic RTL and switches language/theme without losing client context', async ({ page }) => {
      const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto('/');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await page.getByLabel('ملاحظة تجريبية غير محفوظة').fill('Preserved note');
      await page.getByRole('button', { name: 'English', exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
      await expect(page.getByLabel('Temporary note — not saved')).toHaveValue('Preserved note');
      await page.getByRole('button', { name: 'Toggle theme' }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      expect(errors).toEqual([]);
    });
    test('English preferences are present in server HTML with JavaScript disabled', async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      try {
        await context.addCookies([{ name: 'summit_locale', value: 'en', url: 'http://127.0.0.1:3211' }]);
        const page = await context.newPage(); await page.goto('http://127.0.0.1:3211');
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('A clear foundation. Room to grow.');
      } finally { await context.close(); }
    });
    test('360px viewport has no document overflow and keyboard reaches primary actions', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 }); await page.goto('/');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: 'SUMMIT / قمة' })).toBeFocused();
      await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'English', exact: true })).toBeFocused();
    });
    test('Next HTTP session contract enforces real PostgreSQL revocation and CSRF origin', async ({ request }) => {
      const fixture = new DatabaseFixture();
      try {
        // Server uses the shared control DB, not fixture databases. Seed only an owned UUID in it.
        // Dedicated control DB is created by CI solely for this job; no existing data is touched.
        const { Pool } = await import('pg');
        const control = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
        const id = randomUUID(); const tokens = new SessionToken(); const token = tokens.create();
        try {
          const { readFile } = await import('node:fs/promises');
          await control.query(await readFile(new URL('../../data-access/migrations/001_initial.sql', import.meta.url), 'utf8'));
          await control.query("INSERT INTO users(id,name,email,role,status) VALUES($1,'Browser test',$2,'viewer','active')", [id, `${id}@example.test`]);
          await control.query("INSERT INTO sessions(digest,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [tokens.digest(token), id]);
          const cookie = `summit_session=${token}`;
          expect((await request.get('/api/session')).status()).toBe(401);
          const response = await request.get('/api/session', { headers: { cookie } });
          expect(response.status()).toBe(200);
          const payload = await response.json(); expect(payload.user.id).toBe(id); expect(payload.user.password_hash).toBeUndefined();
          expect(response.headers()['cache-control']).toBe('no-store');
          expect((await request.post('/api/session/logout', { headers: { cookie, origin: 'https://untrusted.example' } })).status()).toBe(403);
          expect((await request.get('/api/session', { headers: { cookie } })).status()).toBe(200);
          expect((await request.post('/api/session/logout', { headers: { cookie, origin: 'http://127.0.0.1:3211' } })).status()).toBe(200);
          expect((await request.get('/api/session', { headers: { cookie } })).status()).toBe(401);
        } finally {
          await control.query('DELETE FROM users WHERE id=$1', [id]);
          await control.end();
        }
      } finally { await fixture.close(); }
    });
  }
}
new NextProofBrowserSuite().register();
