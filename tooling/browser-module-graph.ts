// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { SourceTextModule } from "node:vm";
export interface BrowserModuleSource {
  read(path: string): Promise<Response>;
}
/** Parses static native ESM dependencies without evaluating browser code. E2E covers runtime behavior. */
export class BrowserModuleGraph {
  constructor(private readonly assets: BrowserModuleSource) {}
  async verify(): Promise<number> {
    const pending = ["/app.js"],
      seen = new Set<string>();
    while (pending.length) {
      const path = pending.pop();
      if (!path || seen.has(path)) continue;
      seen.add(path);
      const response = await this.assets.read(path);
      if (
        response.status !== 200 ||
        !response.headers.get("content-type")?.startsWith("text/javascript")
      )
        throw new Error("Browser module is not served as JavaScript");
      // Node's parser is enabled for this build-only process; neither link nor evaluate is called.
      const module = new SourceTextModule(await response.text(), {
        identifier: path,
      });
      for (const specifier of module.dependencySpecifiers) {
        if (!specifier.startsWith("."))
          throw new Error(
            "Browser module requires an unsupported external import",
          );
        const url = new URL(specifier, `http://assets.local${path}`);
        if (
          url.origin !== "http://assets.local" ||
          url.search ||
          url.hash ||
          !url.pathname.endsWith(".js")
        )
          throw new Error("Unsupported browser import URL");
        pending.push(url.pathname);
      }
    }
    return seen.size;
  }
}
