// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { copyFile, writeFile } from "node:fs/promises";
class UiAssetBuilder {
  async run() {
    await writeFile(
      new URL("./dist/css.d.ts", import.meta.url),
      "export {};\n",
    );
    await copyFile(
      new URL("./src/index.css", import.meta.url),
      new URL("./dist/index.css", import.meta.url),
    );
  }
}
await new UiAssetBuilder().run();
