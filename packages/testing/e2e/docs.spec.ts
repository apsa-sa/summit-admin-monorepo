// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DocsMessages, Localization } from "@summit/localization";
class DocumentationBrowserSuite {
  private readonly origin = "http://127.0.0.1:3213";
  register(): void {
    for (const locale of ["ar", "en"] as const)
      for (const theme of ["light", "dark"] as const) {
        test(`Docs class SSR/hydration and real component workbench ${locale}/${theme}`, async ({
          page,
        }) => {
          const errors: string[] = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await page.context().addCookies([
            { name: "summit_locale", value: locale, url: this.origin },
            { name: "summit_theme", value: theme, url: this.origin },
          ]);
          const m = new DocsMessages(locale),
            local = new Localization(locale);
          const response = await page.goto(this.origin);
          expect(response?.status()).toBe(200);
          expect(response?.headers()["x-powered-by"]).toBeUndefined();
          await expect(page.locator(".docs-shell")).toHaveAttribute(
            "data-docs-ready",
            "true",
          );
          await expect(page.locator("html")).toHaveAttribute("lang", locale);
          await expect(page.locator("html")).toHaveAttribute(
            "dir",
            local.direction,
          );
          await expect(page.locator("body")).toHaveAttribute(
            "data-summit-theme",
            theme,
          );
          const name = "قمة <script>safe</script>";
          await page.locator("#docs-example-name").fill(name);
          await page
            .getByRole("checkbox", { name: m.t("checkbox"), exact: true })
            .check();
          await expect(page.locator("#docs-open-dialog")).toBeDisabled();
          await page
            .getByRole("checkbox", { name: m.t("checkbox"), exact: true })
            .uncheck();
          await page.locator("#docs-open-dialog").click();
          await expect(page.locator("#docs-example-dialog")).toBeVisible();
          await expect(page.locator("#docs-example-dialog")).toContainText(
            name,
          );
          await expect(page.locator("#docs-example-dialog script")).toHaveCount(
            0,
          );
          await page.keyboard.press("Escape");
          await expect(page.locator("#docs-open-dialog")).toBeFocused();
          await page
            .getByRole("button", { name: m.t("drawer"), exact: true })
            .click();
          await expect(page.locator("#docs-example-drawer")).toBeVisible();
          await page.keyboard.press("Escape");
          await page
            .getByRole("button", { name: m.t("notify"), exact: true })
            .click();
          await expect(
            page.locator("#docs-workbench-panel-form").getByRole("status"),
          ).toContainText(m.t("notice"));
          await page.locator("#docs-workbench-tab-catalogue").click();
          const panel = page.locator("#docs-workbench-panel-catalogue");
          await page.locator("#docs-catalogue-search").fill("Button");
          await expect(panel.locator("tbody tr")).toHaveCount(1);
          await panel
            .getByRole("checkbox", {
              name: `${local.messages.selected} Button`,
              exact: true,
            })
            .check();
          await panel
            .getByRole("button", {
              name: `${m.t("inspect")}: Button`,
              exact: true,
            })
            .click();
          await expect(page.locator("#docs-contract-drawer")).toContainText(
            "ButtonProps",
          );
          await expect(page.locator("#docs-contract-drawer")).toContainText(
            "packages/ui/src/controls.tsx",
          );
          await page.keyboard.press("Escape");
          await page.locator("#docs-catalogue-mode").selectOption("error");
          await expect(panel.getByRole("alert")).toContainText(
            local.messages.error,
          );
          await panel
            .getByRole("button", { name: local.messages.retry, exact: true })
            .click();
          await expect(page.locator("#docs-catalogue-mode")).toHaveValue(
            "ready",
          );
          await page
            .locator("#docs-catalogue-search")
            .fill("NotAnImplementedComponent");
          await expect(panel.getByRole("table")).toContainText(
            local.messages.empty,
          );
          await page.locator("#docs-catalogue-search").fill("");
          expect(
            (
              await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
                .analyze()
            ).violations,
          ).toEqual([]);
          await page.screenshot({
            path: `test-results/docs-${locale}-${theme}.png`,
            fullPage: true,
          });
          await page.locator("#docs-workbench-tab-form").click();
          await expect(page.locator("#docs-example-name")).toHaveValue(name);
          let navigations = 0;
          page.on("framenavigated", (frame) => {
            if (frame === page.mainFrame()) navigations++;
          });
          await page.locator("#docs-language").click();
          await expect(page.locator("html")).toHaveAttribute(
            "lang",
            locale === "ar" ? "en" : "ar",
          );
          await expect(page.locator("#docs-example-name")).toHaveValue(name);
          expect(navigations).toBe(0);
          await page.locator("#docs-theme").click();
          await expect(page.locator("body")).toHaveAttribute(
            "data-summit-theme",
            theme === "light" ? "dark" : "light",
          );
          await page.reload();
          await expect(page.locator(".docs-shell")).toHaveAttribute(
            "data-docs-ready",
            "true",
          );
          await expect(page.locator("html")).toHaveAttribute(
            "lang",
            locale === "ar" ? "en" : "ar",
          );
          await expect(page.locator("body")).toHaveAttribute(
            "data-summit-theme",
            theme === "light" ? "dark" : "light",
          );
          expect(errors).toEqual([]);
        });
      }
    test("Docs English/dark server preferences and anchor history work without JavaScript; 404 is bounded", async ({
      browser,
    }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      try {
        await context.addCookies([
          { name: "summit_locale", value: "en", url: this.origin },
          { name: "summit_theme", value: "dark", url: this.origin },
        ]);
        const page = await context.newPage();
        const response = await page.goto(this.origin);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
        await expect(page.locator("body")).toHaveAttribute(
          "data-summit-theme",
          "dark",
        );
        await expect(
          page.getByRole("heading", {
            name: "Developer documentation",
            exact: true,
          }),
        ).toBeVisible();
        const html = await response?.text();
        expect(
          Boolean(
            process.env.DATABASE_URL &&
            html?.includes(process.env.DATABASE_URL),
          ),
        ).toBe(false);
        expect(
          Boolean(
            process.env.SUMMIT_CI_DB_PASSWORD &&
            html?.includes(process.env.SUMMIT_CI_DB_PASSWORD),
          ),
        ).toBe(false);
        await page
          .locator("nav")
          .getByRole("link", { name: "Application contracts", exact: true })
          .click();
        await expect(page).toHaveURL(/#docs-contracts$/);
        await page
          .locator("nav")
          .getByRole("link", { name: "Run locally", exact: true })
          .click();
        await expect(page).toHaveURL(/#docs-start$/);
        await page.goBack();
        await expect(page).toHaveURL(/#docs-contracts$/);
        expect(
          (await page.goto(`${this.origin}/missing-example`))?.status(),
        ).toBe(404);
        await expect(
          page.getByRole("heading", { name: "404", exact: true }),
        ).toBeVisible();
      } finally {
        await context.close();
      }
    });
    test("Docs skip link, RTL tabs and contained table/code scrolling work at 360px and 200 percent", async ({
      page,
    }) => {
      await page.context().addCookies([
        { name: "summit_locale", value: "ar", url: this.origin },
        { name: "summit_theme", value: "dark", url: this.origin },
      ]);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(this.origin);
      await expect(page.locator(".docs-shell")).toHaveAttribute(
        "data-docs-ready",
        "true",
      );
      await page.keyboard.press("Tab");
      await expect(page.locator(".docs-skip")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#docs-main")).toBeFocused();
      await page.locator("#docs-workbench-tab-form").focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator("#docs-workbench-tab-catalogue")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(
        page.locator("#docs-workbench-panel-catalogue"),
      ).toBeVisible();
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      const region = page.locator(
        "#docs-workbench-panel-catalogue .summit-table-scroll",
      );
      await region.focus();
      await expect(region).toBeFocused();
      expect(
        await region.evaluate((node) => node.scrollWidth > node.clientWidth),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: "test-results/docs-mobile-ar-dark-200.png",
        fullPage: true,
      });
    });
  }
}
new DocumentationBrowserSuite().register();
