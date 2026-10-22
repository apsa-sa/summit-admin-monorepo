// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { TokenCatalog } from "@summit/design-tokens";
import { Localization, LocaleFormatter } from "@summit/localization";
import {
  Button,
  Input,
  Select,
  Checkbox,
  FormField,
  Dialog,
  Drawer,
  Toast,
  Tabs,
  Table,
  Pagination,
} from "@summit/ui";

class Contrast {
  private luminance(hex: string): number {
    const channels = hex
      .slice(1)
      .match(/../g)
      ?.map((channel) => {
        const value = Number.parseInt(channel, 16) / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
    assert.ok(channels && channels.length === 3);
    return (
      channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
    );
  }
  ratio(first: string, second: string): number {
    const a = this.luminance(first),
      b = this.luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
}
class SharedPackageSuite {
  register(): void {
    test("built ESM, declarations and CSS exports exist; client directives survive emit", async () => {
      for (const name of ["ui", "design-tokens", "localization"]) {
        const base = new URL(`../${name}/`, import.meta.url);
        const manifest: unknown = JSON.parse(
          await readFile(new URL("package.json", base), "utf8"),
        );
        assert.ok(
          manifest && typeof manifest === "object" && "exports" in manifest,
        );
        await access(new URL("dist/index.js", base));
        await access(new URL("dist/index.d.ts", base));
        if (name !== "localization") {
          await access(new URL("dist/index.css", base));
          await access(new URL("dist/css.d.ts", base));
        }
      }
      for (const file of (
        await readdir(new URL("../ui/dist/", import.meta.url))
      ).filter((file) => file.endsWith(".js"))) {
        assert.match(
          await readFile(
            new URL(`../ui/dist/${file}`, import.meta.url),
            "utf8",
          ),
          /['"]use client['"]/,
        );
      }
    });
    test("every distributed font CSS URL resolves and preserves upstream OFL notice", async () => {
      const base = new URL("../design-tokens/dist/", import.meta.url);
      const css = await readFile(new URL("index.css", base), "utf8");
      const urls = [
        ...css.matchAll(/url\(['"]?(\.\/fonts\/[^)'"\s]+)['"]?\)/g),
      ];
      assert.equal(urls.length, 20); // Five language subsets × two weights × WOFF/WOFF2.
      for (const match of urls) await access(new URL(match[1]!, base));
      assert.match(
        await readFile(new URL("fonts/OFL-LICENSE.txt", base), "utf8"),
        /SIL OPEN FONT LICENSE/,
      );
      assert.match(css, /prefers-reduced-motion/);
      assert.match(css, /--summit-background:#FDFBF7/);
    });
    test("semantic text/action contrast >=4.5 and essential control borders/focus >=3 in both palettes", () => {
      const contrast = new Contrast();
      for (const theme of ["light", "dark"] as const) {
        const p = new TokenCatalog().palette(theme);
        for (const surface of [p.surface, p.background, p.muted]) {
          for (const text of [p.foreground, p.secondary, p.danger])
            assert.ok(
              contrast.ratio(text, surface) >= 4.5,
              `${theme} text ${text}/${surface}`,
            );
          assert.ok(
            contrast.ratio(p.border, surface) >= 3,
            `${theme} control border`,
          );
          assert.ok(contrast.ratio(p.focus, surface) >= 3, `${theme} focus`);
        }
        for (const background of [p.primary, p.hover, p.active])
          assert.ok(contrast.ratio(p.onPrimary, background) >= 4.5);
        for (const background of [p.danger, p.dangerHover])
          assert.ok(contrast.ratio(p.onDanger, background) >= 4.5);
        assert.ok(Object.isFrozen(p));
      }
    });
    test("locale formatting rejects invalid numeric/date inputs and separates instants from plain dates", () => {
      const en = new LocaleFormatter("en", {
        numberingSystem: "latn",
        timeZone: "America/Los_Angeles",
      });
      const ar = new LocaleFormatter("ar", {
        numberingSystem: "arab",
        calendar: "gregory",
      });
      assert.equal(new Localization("ar").direction, "rtl");
      assert.equal(new Localization("en").messages.retry, "Retry");
      assert.equal(en.number(1234), "1,234");
      assert.match(ar.number(1234), /١/);
      for (const value of [NaN, Infinity, -Infinity])
        assert.throws(() => en.number(value), RangeError);
      for (const value of ["2026-02-30", "2026-13-01", "2026-2-01", ""])
        assert.throws(() => en.plainDate(value), RangeError);
      for (const value of [
        "2026-02-30T00:00:00Z",
        "2026-01-01T00:00:00",
        "invalid",
      ])
        assert.throws(() => en.instant(value), RangeError);
      assert.match(en.instant("2026-01-01T00:00:00Z"), /Dec 31, 2025/);
      assert.match(en.plainDate("2026-01-01"), /Jan 1, 2026/);
    });
    test("controls SSR retain native semantics, labels and safe escaped user text", () => {
      const button = renderToString(
        createElement(Button, { loading: true }, "<script>"),
      );
      assert.match(button, /type="button"/);
      assert.match(button, /disabled=""/);
      assert.match(button, /aria-busy="true"/);
      assert.match(button, /&lt;script&gt;/);
      const field = renderToString(
        createElement(FormField, {
          id: "email",
          label: "Email",
          required: true,
          description: "Public address",
          error: "Invalid",
          children: createElement(Input, {
            type: "email",
            "aria-describedby": "extra",
          }),
        }),
      );
      assert.match(field, /for="email"/);
      assert.match(field, /aria-invalid="true"/);
      assert.match(
        field,
        /aria-describedby="extra email-description email-error"/,
      );
      assert.match(field, /required=""/);
      assert.match(
        renderToString(
          createElement(Checkbox, { label: "Selected", indeterminate: true }),
        ),
        /aria-checked="mixed"/,
      );
      assert.match(
        renderToString(
          createElement(Select, {
            "aria-label": "Choice",
            children: createElement("option", { value: "a" }, "A"),
          }),
        ),
        /<select/,
      );
    });
    test("dialog/drawer/toast SSR and controlled tabs expose accessible names/states", () => {
      const props = {
        id: "d",
        open: false,
        title: "Details",
        closeLabel: "Close",
        onClose: () => {},
        children: "Contents",
      };
      assert.match(
        renderToString(createElement(Dialog, props)),
        /aria-labelledby="d-title"/,
      );
      assert.match(
        renderToString(createElement(Drawer, props)),
        /summit-dialog--end/,
      );
      assert.match(
        renderToString(
          createElement(Toast, {
            closeLabel: "Close",
            onClose: () => {},
            tone: "error",
            children: "Failed",
          }),
        ),
        /role="alert"/,
      );
      const tabs = renderToString(
        createElement(Tabs, {
          id: "t",
          label: "Examples",
          activeId: "a",
          onChange: () => {},
          items: [
            { id: "a", label: "A", content: "One" },
            { id: "b", label: "B", content: "Two", disabled: true },
          ],
        }),
      );
      assert.match(tabs, /role="tablist"/);
      assert.match(tabs, /aria-selected="true"/);
      assert.match(tabs, /hidden=""/);
      assert.throws(
        () =>
          renderToString(
            createElement(Tabs, {
              id: "t",
              label: "Tabs",
              activeId: "missing",
              onChange: () => {},
              items: [],
            }),
          ),
        RangeError,
      );
    });
    test("table distinguishes failed/loading/empty responses and rejects ambiguous row keys", () => {
      const props = {
        caption: "Users",
        columns: [{ id: "name", label: "Name", cell: (row: string) => row }],
        rows: [] as string[],
        rowKey: (row: string) => row,
        loadingLabel: "Loading",
        emptyLabel: "No results",
        retryLabel: "Retry",
      };
      assert.match(
        renderToString(createElement(Table<string>, props)),
        /No results/,
      );
      const failed = renderToString(
        createElement(Table<string>, {
          ...props,
          error: "Failed",
          onRetry: () => {},
        }),
      );
      assert.match(failed, /role="alert"/);
      assert.doesNotMatch(failed, /No results/);
      assert.match(
        renderToString(
          createElement(Table<string>, { ...props, loading: true }),
        ),
        /aria-busy="true"/,
      );
      assert.throws(
        () =>
          renderToString(
            createElement(Table<string>, { ...props, rows: ["same", "same"] }),
          ),
        RangeError,
      );
      assert.throws(
        () =>
          renderToString(
            createElement(Table<string>, { ...props, onSelect: () => {} }),
          ),
        TypeError,
      );
    });
    test("pagination validates finite bounded integers rather than silently repairing invalid values", () => {
      const props = {
        page: 1,
        pageSize: 10,
        total: 0,
        label: "Page",
        previousLabel: "Previous",
        nextLabel: "Next",
        formatNumber: String,
        onChange: () => {},
      };
      const html = renderToString(createElement(Pagination, props));
      assert.match(html, /1.*\/.*1/);
      assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
      for (const invalid of [
        { page: 0 },
        { page: 2 },
        { total: -1 },
        { total: NaN },
        { pageSize: 0 },
        { pageSize: 1.5 },
      ])
        assert.throws(
          () =>
            renderToString(createElement(Pagination, { ...props, ...invalid })),
          RangeError,
        );
    });
  }
}
new SharedPackageSuite().register();
