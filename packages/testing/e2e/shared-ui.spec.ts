// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
class SharedUiBrowserSuite {
  register(): void {
    for (const locale of ["ar", "en"] as const)
      for (const theme of ["light", "dark"] as const) {
        test(`built UI consumer hydrates, preserves form state and passes axe: ${locale}/${theme}`, async ({
          page,
          context,
        }) => {
          await context.addCookies([
            {
              name: "summit_locale",
              value: locale,
              url: "http://127.0.0.1:3211",
            },
            {
              name: "summit_theme",
              value: theme,
              url: "http://127.0.0.1:3211",
            },
          ]);
          const errors: string[] = [];
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto("/");
          const gallery = page.locator(".summit-showcase");
          await expect(gallery).toHaveAttribute(
            "dir",
            locale === "ar" ? "rtl" : "ltr",
          );
          await expect(gallery).toHaveAttribute("data-summit-theme", theme);
          const input = page.locator("#gallery-name");
          await input.fill("قمة SUMMIT");
          await page.locator("#gallery-density").selectOption("compact");
          await gallery.getByRole("checkbox").check();
          await gallery
            .getByRole("button", {
              name: locale === "ar" ? "عرض إشعار" : "Show notification",
              exact: true,
            })
            .click();
          await expect(gallery.getByRole("status")).toContainText(
            locale === "ar" ? "إشعار تجريبي" : "Sample notification",
          );
          await gallery
            .getByRole("button", {
              name: locale === "ar" ? "إغلاق" : "Close",
              exact: true,
            })
            .click();
          await page.evaluate(() => document.fonts.ready);
          expect(
            await input.evaluate(
              (element) => getComputedStyle(element).fontFamily,
            ),
          ).toContain("Noto Sans Arabic");
          const axe = await new AxeBuilder({ page })
            .include(".summit-showcase")
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          expect(axe.violations).toEqual([]);
          await page.screenshot({
            path: `test-results/gallery-${locale}-${theme}.png`,
            fullPage: true,
          });
          await page
            .getByRole("button", {
              name: locale === "ar" ? "English" : "العربية",
              exact: true,
            })
            .click();
          await expect(input).toHaveValue("قمة SUMMIT");
          await expect(page.locator("#gallery-density")).toHaveValue("compact");
          await expect(gallery.getByRole("checkbox")).toBeChecked();
          expect(errors).toEqual([]);
        });
      }
    test("class dialogs/drawers contain focus, close with Escape and restore trigger; no 360px/200% overflow", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto("/");
      const trigger = page.getByRole("button", {
        name: "فتح الحوار",
        exact: true,
      });
      await trigger.click();
      const dialog = page.locator("#gallery-dialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "إغلاق", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(page.locator("#gallery-dialog-name")).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        dialog.getByRole("button", { name: "إغلاق", exact: true }),
      ).toBeFocused();
      const result = await new AxeBuilder({ page })
        .include("#gallery-dialog")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      const drawerTrigger = page.getByRole("button", {
        name: "فتح اللوحة",
        exact: true,
      });
      await drawerTrigger.click();
      await expect(page.locator("#gallery-drawer")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(drawerTrigger).toBeFocused();
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.emulateMedia({ reducedMotion: "reduce" });
      const duration = await trigger.evaluate(
        (element) => getComputedStyle(element).transitionDuration,
      );
      expect(duration).toBe("0s");
    });
    test("RTL tabs skip disabled items; table selection, sorting, pagination and retry work", async ({
      page,
    }) => {
      await page.goto("/");
      const formTab = page.getByRole("tab", { name: "النموذج", exact: true });
      const tableTab = page.getByRole("tab", { name: "الجدول", exact: true });
      await formTab.focus();
      await page.keyboard.press("ArrowLeft");
      await expect(tableTab).toBeFocused();
      await expect(formTab).toHaveAttribute("aria-selected", "true");
      await page.keyboard.press("Enter");
      await expect(tableTab).toHaveAttribute("aria-selected", "true");
      await page
        .getByRole("checkbox", { name: "تحديد سجل تجريبي 1", exact: true })
        .check();
      await page.getByRole("button", { name: "التالي", exact: true }).click();
      await expect(
        page.getByRole("cell", { name: "سجل تجريبي 3", exact: true }),
      ).toBeVisible();
      await page.getByRole("button", { name: "السابق", exact: true }).click();
      await expect(
        page.getByRole("checkbox", { name: "تحديد سجل تجريبي 1", exact: true }),
      ).toBeChecked();
      await page
        .getByRole("columnheader")
        .filter({ hasText: "اسم العرض" })
        .getByRole("button")
        .click();
      await expect(
        page.getByRole("columnheader", { name: "اسم العرض" }),
      ).toHaveAttribute("aria-sort", "descending");
      await expect(
        page.getByRole("cell", { name: "سجل تجريبي 5", exact: true }),
      ).toBeVisible();
      await page.locator("#gallery-table-state").selectOption("error");
      await expect(
        page.locator(".summit-showcase").getByRole("alert"),
      ).toContainText("تعذّر تحميل البيانات");
      await page
        .getByRole("button", { name: "إعادة المحاولة", exact: true })
        .click();
      await expect(
        page.locator(".summit-showcase").getByRole("alert"),
      ).toHaveCount(0);
      await page.locator("#gallery-table-state").selectOption("empty");
      await expect(
        page.getByRole("cell", { name: "لا توجد نتائج", exact: true }),
      ).toBeVisible();
      await page.locator("#gallery-table-state").selectOption("loading");
      await expect(
        page.locator(".summit-showcase").getByRole("status"),
      ).toHaveText("جارٍ التحميل…");
      await page.locator("#gallery-table-state").selectOption("ready");
      expect(
        (
          await new AxeBuilder({ page })
            .include(".summit-showcase")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    });
  }
}
new SharedUiBrowserSuite().register();
