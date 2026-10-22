// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import AxeBuilder from "@axe-core/playwright";
import { JourneyFixture } from "./journey-fixture.js";
import { DatabaseFixture } from "../support/database-fixture.js";
import { CreatedUserCleanup } from "./created-user-cleanup.js";
import { ResponseContracts } from "../../contracts/decoders.js";
class NextAdminBrowserSuite {
  private readonly origin = "http://127.0.0.1:3212";
  private readonly fixture = new JourneyFixture();
  private readonly cleanup = new CreatedUserCleanup();
  private async login(
    page: Page,
    role: "admin" | "editor" | "viewer",
    locale: "ar" | "en" = "ar",
    theme: "light" | "dark" = "light",
  ): Promise<void> {
    const account = this.fixture.account(role);
    await page.context().addCookies([
      { name: "summit_locale", value: locale, url: this.origin },
      { name: "summit_theme", value: theme, url: this.origin },
    ]);
    await page.goto(this.origin);
    await expect(
      page.getByRole("button", {
        name: locale === "ar" ? "تسجيل الدخول" : "Sign in",
        exact: true,
      }),
    ).toBeEnabled();
    await page.locator("#admin-email").fill(account.email);
    await page.locator("#admin-password").fill(account.password);
    const response = page.waitForResponse(
      (response) =>
        response.url() === `${this.origin}/api/login` &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", {
        name: locale === "ar" ? "تسجيل الدخول" : "Sign in",
        exact: true,
      })
      .click();
    expect((await response).status()).toBe(200);
    await expect(page.locator("#admin-content")).toBeVisible();
  }
  register(): void {
    test.afterEach(async () => {
      await this.cleanup.clean();
    });
    for (const locale of ["ar", "en"] as const)
      for (const theme of ["light", "dark"] as const) {
        test(`Next class admin ${locale}/${theme}: login, draft, drawer CRUD, audit, CSV and revocation`, async ({
          page,
        }) => {
          const errors: string[] = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await this.login(page, "admin", locale, theme);
          await expect(page.locator("html")).toHaveAttribute(
            "dir",
            locale === "ar" ? "rtl" : "ltr",
          );
          await expect(page.locator("html")).toHaveAttribute(
            "data-summit-theme",
            theme,
          );
          const nav = page.locator(".admin-sidebar nav");
          await nav
            .getByRole("link", {
              name: locale === "ar" ? "المسودة المحفوظة" : "Saved draft",
              exact: true,
            })
            .click();
          await expect(page.locator("#admin-draft-name")).toBeEnabled();
          const name = `قمة ${randomUUID().slice(0, 8)}`;
          await page.locator("#admin-draft-name").fill(name);
          await page
            .locator("#admin-draft-organization")
            .fill("Synthetic APSA fixture");
          await expect(page.locator("#admin-draft-status")).toHaveText(
            locale === "ar" ? "تم الحفظ في الخادم" : "Saved on server",
          );
          await page.reload();
          await expect(page.locator("#admin-draft-name")).toHaveValue(name);
          await nav
            .getByRole("link", {
              name: locale === "ar" ? "المستخدمون" : "Users",
              exact: true,
            })
            .click();
          await page
            .getByRole("button", {
              name: locale === "ar" ? "إضافة مستخدم" : "Add user",
              exact: true,
            })
            .click();
          await expect(page.locator("#admin-user-drawer")).toBeVisible();
          await page.locator("#admin-user-name").fill(name);
          const email = `${randomUUID()}@example.test`;
          await page.locator("#admin-user-email").fill(email);
          const creation = page.waitForResponse(
            (response) =>
              response.url() === `${this.origin}/api/users` &&
              response.request().method() === "POST",
          );
          await page
            .locator("#admin-user-drawer")
            .getByRole("button", {
              name: locale === "ar" ? "حفظ" : "Save",
              exact: true,
            })
            .click();
          const createdResponse = await creation;
          expect(createdResponse.status()).toBe(201);
          const created = this.cleanup.track(
            await createdResponse.json(),
            email,
          );
          await expect(page.locator("#admin-user-drawer")).not.toBeVisible();
          await page.locator("#admin-search").fill(name);
          await page
            .locator(".admin-filters")
            .getByRole("button", {
              name: locale === "ar" ? "بحث" : "Search",
              exact: true,
            })
            .click();
          const row = page
            .locator(".summit-table tbody tr")
            .filter({ hasText: name });
          await expect(row).toHaveCount(1);
          await row
            .getByRole("button", {
              name: locale === "ar" ? "تعديل" : "Edit",
              exact: true,
            })
            .click();
          const edited = `${name} <script>fixture</script>`;
          await page.locator("#admin-user-name").fill(edited);
          await page
            .locator("#admin-user-drawer")
            .getByRole("button", {
              name: locale === "ar" ? "حفظ" : "Save",
              exact: true,
            })
            .click();
          await expect(page.locator("#admin-user-drawer")).not.toBeVisible();
          await expect(row).toContainText(edited);
          await expect(row.locator("script")).toHaveCount(0);
          const downloadPromise = page.waitForEvent("download");
          await page
            .getByRole("link", {
              name:
                locale === "ar"
                  ? "تصدير CSV المصرّح به"
                  : "Export authorized CSV",
              exact: true,
            })
            .click();
          const download = await downloadPromise;
          const path = await download.path();
          expect(path).not.toBeNull();
          if (!path) throw new Error("Missing CSV");
          const csv = await readFile(path, "utf8");
          expect(csv).toContain(edited);
          expect(csv).not.toContain("password_hash");
          expect(csv).toContain(locale === "ar" ? "الاسم" : "Name");
          expect(
            (
              await new AxeBuilder({ page })
                .include("#admin-content")
                .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
                .analyze()
            ).violations,
          ).toEqual([]);
          await page.screenshot({
            path: `test-results/admin-${locale}-${theme}.png`,
            fullPage: true,
          });
          await nav
            .getByRole("link", {
              name: locale === "ar" ? "سجل التدقيق" : "Audit log",
              exact: true,
            })
            .click();
          await expect(page.locator("#admin-content")).toContainText(
            "users:update",
          );
          const auditBefore: unknown = await (
            await page.request.get(`${this.origin}/api/audit`)
          ).json();
          expect(
            new ResponseContracts()
              .audit(auditBefore)
              .some(
                (event) =>
                  event.action === "users:update" &&
                  event.resourceId === created.id,
              ),
          ).toBe(true);
          await nav
            .getByRole("link", {
              name: locale === "ar" ? "المستخدمون" : "Users",
              exact: true,
            })
            .click();
          await expect(row).toContainText(edited);
          await row
            .getByRole("button", {
              name: locale === "ar" ? "حذف" : "Delete",
              exact: true,
            })
            .click();
          const removal = page.waitForResponse(
            (response) =>
              response.url() === `${this.origin}/api/users/${created.id}` &&
              response.request().method() === "DELETE",
          );
          await page
            .locator("#admin-delete-dialog")
            .getByRole("button", {
              name: locale === "ar" ? "حذف" : "Delete",
              exact: true,
            })
            .click();
          expect((await removal).status()).toBe(200);
          await expect(page.locator("#admin-delete-dialog")).not.toBeVisible();
          await expect(row).toHaveCount(0);
          const auditAfter: unknown = await (
            await page.request.get(`${this.origin}/api/audit`)
          ).json();
          const events = new ResponseContracts().audit(auditAfter);
          expect(
            events.some(
              (event) =>
                event.action === "users:delete" &&
                event.resourceId === created.id,
            ),
          ).toBe(true);
          expect(
            events.some(
              (event) =>
                event.action === "users:update" &&
                event.resourceId === created.id,
            ),
          ).toBe(true);
          await page
            .getByRole("button", {
              name: locale === "ar" ? "تسجيل الخروج" : "Sign out",
              exact: true,
            })
            .click();
          await expect(page.locator("#admin-email")).toBeVisible();
          expect(
            (await page.request.get(`${this.origin}/api/me`)).status(),
          ).toBe(401);
          expect(errors).toEqual([]);
        });
      }
    test("Next viewer permissions apply to navigation, commands and direct requests", async ({
      page,
    }) => {
      await this.login(page, "viewer");
      const me: unknown = await (
        await page.request.get(`${this.origin}/api/me`)
      ).json();
      expect(new ResponseContracts().userEnvelope(me).role).toBe("viewer");
      await page
        .locator(".admin-sidebar nav")
        .getByRole("link", { name: "المستخدمون", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "إضافة مستخدم", exact: true }),
      ).toHaveCount(0);
      await expect(
        page
          .locator(".admin-sidebar nav")
          .getByRole("link", { name: "سجل التدقيق", exact: true }),
      ).toHaveCount(0);
      await page.keyboard.press("Control+k");
      await expect(page.locator("#admin-command-palette")).toBeVisible();
      await expect(
        page
          .locator("#admin-command-palette")
          .getByRole("button", { name: "سجل التدقيق", exact: true }),
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
      expect(
        (await page.request.get(`${this.origin}/api/audit`)).status(),
      ).toBe(403);
      expect(
        (await page.request.get(`${this.origin}/api/users/export`)).status(),
      ).toBe(403);
      expect(
        (
          await page.request.post(`${this.origin}/api/users`, {
            headers: { origin: this.origin },
            data: {
              name: "Escalation",
              email: "forbidden@example.test",
              role: "admin",
              status: "active",
              version: 0,
            },
          })
        ).status(),
      ).toBe(403);
    });
    test("Next editor cannot alter an administrator and cross-origin mutation is rejected", async ({
      page,
    }) => {
      await this.login(page, "editor");
      const admin = this.fixture.account("admin");
      expect(
        (
          await page.request.put(`${this.origin}/api/users/${admin.id}`, {
            headers: { origin: this.origin },
            data: {
              name: "Blocked",
              email: admin.email,
              role: "admin",
              status: "active",
              version: 0,
            },
          })
        ).status(),
      ).toBe(403);
      expect(
        (
          await page.request.post(`${this.origin}/api/logout`, {
            headers: { origin: "https://untrusted.example" },
          })
        ).status(),
      ).toBe(403);
      expect((await page.request.get(`${this.origin}/api/me`)).status()).toBe(
        200,
      );
    });
    test("Next offline draft preserves edits and explicit retry; preferences survive mobile reload and 200% text", async ({
      page,
    }) => {
      await this.login(page, "admin");
      await page
        .locator(".admin-sidebar nav")
        .getByRole("link", { name: "المسودة المحفوظة", exact: true })
        .click();
      await expect(page.locator("#admin-draft-name")).toBeEnabled();
      let fail = true;
      await page.route(`${this.origin}/api/draft`, async (route) => {
        if (fail && route.request().method() === "PUT") {
          fail = false;
          await route.abort("internetdisconnected");
        } else await route.continue();
      });
      const name = `Offline ${randomUUID().slice(0, 8)}`;
      await page.locator("#admin-draft-name").fill(name);
      await expect(
        page.locator("#admin-content").getByRole("alert"),
      ).toContainText("تعذر الاتصال");
      await expect(page.locator("#admin-draft-name")).toHaveValue(name);
      await page
        .locator("#admin-content")
        .getByRole("button", { name: "إعادة المحاولة", exact: true })
        .click();
      await expect(page.locator("#admin-draft-status")).toHaveText(
        "تم الحفظ في الخادم",
      );
      await page.getByRole("button", { name: "English", exact: true }).click();
      await expect(page.locator("#admin-draft-name")).toHaveValue(name);
      await page
        .getByRole("button", { name: "Appearance", exact: true })
        .click();
      await expect(page.locator("body")).toHaveAttribute(
        "data-summit-theme",
        "dark",
      );
      await page.reload();
      await expect(page.locator("body")).toHaveAttribute(
        "data-summit-theme",
        "dark",
      );
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("#admin-draft-name")).toHaveValue(name);
      await page.setViewportSize({ width: 360, height: 800 });
      await page
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
      await expect(page.locator("#admin-mobile-navigation")).toBeVisible();
      await page.keyboard.press("Escape");
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await page.screenshot({
        path: "test-results/admin-mobile-200.png",
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });
    test("Next SSR preferences work without JavaScript and request scopes share the real admission counter", async ({
      browser,
      request,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      try {
        await context.addCookies([
          { name: "summit_locale", value: "en", url: this.origin },
          { name: "summit_theme", value: "dark", url: this.origin },
        ]);
        const page = await context.newPage();
        const response = await page.goto(this.origin);
        await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
        await expect(page.locator("html")).toHaveAttribute(
          "data-summit-theme",
          "dark",
        );
        await expect(page.locator("#admin-email")).toBeVisible();
        await expect(page.locator("form")).toHaveAttribute("method", "post");
        expect(response?.headers()["content-security-policy"]).toContain(
          "'nonce-",
        );
        expect(response?.headers()["content-security-policy"]).not.toContain(
          "unsafe-eval",
        );
      } finally {
        await context.close();
      }
      const approval = new DatabaseFixture();
      if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL)
        throw new Error("Isolated control DB required");
      const pool = new Pool({
        connectionString: process.env.TEST_DATABASE_URL,
      });
      try {
        const key = createHash("sha256").update("shared").digest("hex");
        for (let index = 0; index < 2; index++) {
          const before = await pool.query<{ count: number; window: string }>(
            "SELECT count,resets_at::text AS window FROM request_limits WHERE key=$1",
            [key],
          );
          expect(
            (
              await request.post(`${this.origin}/api/login`, {
                headers: { origin: this.origin },
                data: {
                  email: `${randomUUID()}@example.test`,
                  password: "synthetic-invalid",
                },
              })
            ).status(),
          ).toBe(401);
          const after = await pool.query<{ count: number; window: string }>(
            "SELECT count,resets_at::text AS window FROM request_limits WHERE key=$1",
            [key],
          );
          const expected =
            before.rows[0]?.window === after.rows[0]?.window
              ? (before.rows[0]?.count ?? 0) + 1
              : 1;
          expect(after.rows[0]?.count).toBe(expected);
        }
      } finally {
        await pool.end();
        await approval.close();
      }
    });
  }
}
new NextAdminBrowserSuite().register();
