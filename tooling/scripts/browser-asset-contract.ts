// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { test } from "node:test";
import assert from "node:assert/strict";
import { PublicAssets } from "../../apps/web-admin/server/assets.js";
import { BrowserModuleGraph } from "../browser-module-graph.js";
class BrowserAssetContractSuite {
  private modules(files: Readonly<Record<string, string>>): BrowserModuleGraph {
    return new BrowserModuleGraph({
      read: async (path) => {
        const source = files[path];
        return new Response(source ?? "", {
          status: source === undefined ? 404 : 200,
          headers: { "Content-Type": "text/javascript" },
        });
      },
    });
  }
  register(): void {
    test("Browser asset contract parses static imports/reexports and cycles without running code", async () => {
      const graph = this.modules({
        "/app.js": "import './api.js'; throw new Error('Must never execute');",
        "/api.js": "export {value} from './contract.js'",
        "/contract.js": "import './api.js'; export const value=1",
      });
      assert.equal(await graph.verify(), 3);
    });
    test("Browser asset contract rejects the missing-module failure before shipping a disabled login", async () => {
      await assert.rejects(
        this.modules({
          "/app.js": "import './api.js'",
          "/api.js": "import './packages/core/unserved.js'",
        }).verify(),
        /not served/,
      );
    });
    test("Browser asset contract rejects unsupported imports, invalid syntax and wrong MIME responses", async () => {
      await assert.rejects(
        this.modules({ "/app.js": "import 'node:fs'" }).verify(),
        /unsupported external/,
      );
      await assert.rejects(
        this.modules({ "/app.js": "export const =" }).verify(),
        SyntaxError,
      );
      await assert.rejects(
        new BrowserModuleGraph({
          read: async () => Response.json({}),
        }).verify(),
        /not served/,
      );
    });
    test("Actual compiled standalone browser entry has a completely served static module graph", async () => {
      assert.equal(
        await new BrowserModuleGraph(new PublicAssets()).verify(),
        5,
      );
    });
  }
}
new BrowserAssetContractSuite().register();
