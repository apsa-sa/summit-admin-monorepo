// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import type { Page } from "@playwright/test";
/** Native captures only: await local fonts and reset scroll to avoid displaced fixed elements in full-page captures. */
export class EvidenceCapture {
  async fullPage(page: Page, name: string): Promise<void> {
    if (!/^[a-z0-9-]+$/.test(name))
      throw new TypeError("Invalid evidence name");
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      path: `test-results/${name}.png`,
      fullPage: true,
      animations: "disabled",
      caret: "hide",
    });
  }
}
