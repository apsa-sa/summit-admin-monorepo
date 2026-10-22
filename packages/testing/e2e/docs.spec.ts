// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test, expect } from "@playwright/test";
import { EvidenceCapture } from "./evidence-capture.js";
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
          // New surfaces are real public package consumers, not catalogue-only names.
          await expect(page.locator("#docs-start")).toHaveClass(/summit-card/);
          await expect(page.locator(".docs-main > .summit-alert")).toHaveRole(
            "status",
          );
          await expect(
            page.locator(".docs-main > .summit-alert"),
          ).toContainText(m.t("status"));
          const help = page.locator('[aria-describedby="docs-help-tip"]'),
            tip = page.locator("#docs-help-tip");
          await help.hover();
          await expect(tip).toBeVisible();
          await tip.hover();
          await expect(tip).toBeVisible();
          await page.locator("h1").hover();
          await expect(tip).toBeHidden();
          await help.focus();
          await expect(tip).toBeVisible();
          await expect(help).toHaveAccessibleDescription(m.t("helpText"));
          await expect(tip).toHaveAttribute("dir", local.direction);
          await expect(tip).toHaveAttribute("data-summit-theme", theme);
          await page.keyboard.press("Escape");
          await expect(tip).toBeHidden();
          await expect(help).toBeFocused();
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
          const dialogHelp = page.locator(
              '[aria-describedby="docs-dialog-tip"]',
            ),
            dialogTip = page.locator("#docs-dialog-tip");
          await dialogHelp.focus();
          await expect(dialogTip).toBeVisible();
          // Visibility alone cannot prove a portal paints above a native modal backdrop.
          expect(
            await dialogTip.evaluate((node) => {
              const r = node.getBoundingClientRect();
              return node.contains(
                document.elementFromPoint(
                  r.left + r.width / 2,
                  r.top + r.height / 2,
                ),
              );
            }),
          ).toBe(true);
          await page.keyboard.press("Escape");
          await expect(dialogTip).toBeHidden();
          await expect(dialogHelp).toBeFocused();
          await expect(page.locator("#docs-example-dialog")).toBeVisible();
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
          await new EvidenceCapture().fullPage(page, `docs-${locale}-${theme}`);
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
      await page.locator("#docs-workbench-tab-form").click();
      const help = page.locator('[aria-describedby="docs-help-tip"]'),
        tip = page.locator("#docs-help-tip");
      await help.focus();
      await expect(tip).toBeVisible();
      expect(
        await tip.evaluate((node) => {
          const r = node.getBoundingClientRect();
          return (
            r.left >= 0 &&
            r.right <= innerWidth &&
            r.top >= 0 &&
            r.bottom <= innerHeight
          );
        }),
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(tip).toBeHidden();
      await page.locator("#docs-workbench-tab-catalogue").click();
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
      await new EvidenceCapture().fullPage(page, "docs-mobile-ar-dark-200");
    });
  }
}
new DocumentationBrowserSuite().register();
