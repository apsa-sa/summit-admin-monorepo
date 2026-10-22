// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import * as UI from "@summit/ui";
import { DocsPreferencePolicy } from "../../apps/docs/next/preferences.js";
import { DocsController } from "../../apps/docs/presentation/controller.js";
import { ComponentCatalogue } from "../../apps/docs/presentation/catalogue.js";
import type { DocsPreferences } from "../../apps/docs/next/preferences.js";
class DocsContractSuite {
  register(): void {
    test("Documentation preference boundary accepts only approved language/theme enums", () => {
      const policy = new DocsPreferencePolicy();
      assert.deepEqual(policy.resolve("en", "dark"), {
        locale: "en",
        theme: "dark",
      });
      for (const unsafe of [
        undefined,
        null,
        {},
        "EN",
        "<script>",
        "dark; color:red",
      ])
        assert.deepEqual(policy.resolve(unsafe, unsafe), {
          locale: "ar",
          theme: "light",
        });
    });
    test("Documentation controller has injected appearance and publishes only after applying it", () => {
      const events: string[] = [],
        states: DocsPreferences[] = [];
      const controller = new DocsController(
        {
          apply: (value) => {
            events.push(value.locale);
          },
        },
        (value) => {
          events.push("published");
          states.push(value);
        },
      );
      controller.change({ locale: "en", theme: "dark" });
      assert.deepEqual(events, ["en", "published"]);
      assert.deepEqual(states, [{ locale: "en", theme: "dark" }]);
      const broken = new DocsController(
        {
          apply: () => {
            throw new Error("appearance unavailable");
          },
        },
        () => {
          throw new Error("must not publish");
        },
      );
      assert.throws(
        () => broken.change({ locale: "ar", theme: "light" }),
        /appearance unavailable/,
      );
    });
    test("Documentation catalogue advertises only unique actual public UI exports with source contracts", () => {
      const entries = new ComponentCatalogue().entries();
      assert.equal(
        new Set(entries.map((entry) => entry.name)).size,
        entries.length,
      );
      for (const entry of entries) {
        assert.ok(Object.hasOwn(UI, entry.name));
        assert.equal(typeof UI[entry.name], "function");
        assert.ok(entry.contract.length > 10);
        assert.ok(entry.source.startsWith("packages/ui/src/"));
      }
      assert.equal(
        entries.some((entry) => String(entry.name) === "Tooltip"),
        false,
      );
    });
  }
}
new DocsContractSuite().register();
