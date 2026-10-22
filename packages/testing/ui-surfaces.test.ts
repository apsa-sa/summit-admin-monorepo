// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Card, Alert, Tooltip } from "@summit/ui";
import { TooltipPositioner } from "../ui/src/tooltip-positioner.js";
class SurfaceContractSuite {
  register(): void {
    test("Card forwards section naming, native attributes and escaped content", () => {
      const html = renderToString(
        createElement(
          Card,
          { id: "example", "aria-label": "Details", className: "consumer" },
          "<script>",
        ),
      );
      assert.match(
        html,
        /<section id="example" aria-label="Details" class="summit-card consumer"/,
      );
      assert.match(html, /&lt;script&gt;/);
      assert.doesNotMatch(html, /<script>/);
    });
    test("Alert exposes meaningful title/text and severity semantics for all tones", () => {
      for (const tone of ["info", "success", "warning", "error"] as const) {
        const html = renderToString(
          createElement(Alert, { title: "<Status>", tone }, "<Details>"),
        );
        assert.match(
          html,
          new RegExp(`role="${tone === "error" ? "alert" : "status"}"`),
        );
        assert.match(html, /<strong>&lt;Status&gt;<\/strong>/);
        assert.match(html, /&lt;Details&gt;/);
      }
      assert.throws(
        () => renderToString(createElement(Alert, { title: "  " })),
        TypeError,
      );
    });
    test("Tooltip SSR has a native named help button and a safe description without DOM access", () => {
      const props = {
        id: "help",
        label: "Help",
        content: "<script>",
        direction: "rtl" as const,
        theme: "dark" as const,
      };
      const html = renderToString(createElement(Tooltip, props));
      assert.match(html, /type="button"/);
      assert.match(html, /aria-describedby="help"/);
      assert.match(html, /<span id="help" hidden="">&lt;script&gt;<\/span>/);
      for (const invalid of [
        { id: "" },
        { id: "two ids" },
        { label: " " },
        { content: " " },
        { content: "x".repeat(161) },
      ])
        assert.throws(
          () =>
            renderToString(createElement(Tooltip, { ...props, ...invalid })),
          TypeError,
        );
    });
    test("Tooltip geometry fits viewport edges, flips below and rejects invalid dimensions", () => {
      const policy = new TooltipPositioner(),
        viewport = { width: 360, height: 800 },
        size = { width: 160, height: 64 };
      assert.deepEqual(
        policy.place(
          { top: 100, bottom: 140, left: 100, right: 160 },
          size,
          viewport,
          8,
        ),
        { top: 36, left: 50, placement: "above" },
      );
      assert.deepEqual(
        policy.place(
          { top: 0, bottom: 40, left: 0, right: 40 },
          size,
          viewport,
          8,
        ),
        { top: 40, left: 8, placement: "below" },
      );
      assert.equal(
        policy.place(
          { top: 100, bottom: 140, left: 320, right: 360 },
          size,
          viewport,
          8,
        ).left,
        192,
      );
      for (const width of [NaN, Infinity, -1])
        assert.throws(
          () =>
            policy.place(
              { top: 0, bottom: 40, left: 0, right: 40 },
              { width, height: 64 },
              viewport,
              8,
            ),
          RangeError,
        );
      assert.throws(
        () =>
          policy.place(
            { top: 40, bottom: 0, left: 0, right: 40 },
            size,
            viewport,
            8,
          ),
        RangeError,
      );
    });
  }
}
new SurfaceContractSuite().register();
