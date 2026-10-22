// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { TokenCatalog } from "./dist/index.js";
class TokenAssetBuilder {
  async run() {
    await writeFile(
      new URL("./dist/css.d.ts", import.meta.url),
      "export {};\n",
    );
    const require = createRequire(import.meta.url);
    const source = dirname(
      require.resolve("@fontsource/noto-sans-arabic/package.json"),
    );
    const output = new URL("./dist/", import.meta.url);
    await mkdir(new URL("fonts/", output), { recursive: true });
    let css = "";
    for (const weight of [400, 600]) {
      const upstream = await readFile(join(source, `${weight}.css`), "utf8");
      for (const match of upstream.matchAll(
        /url\(['"]?\.\/files\/([^)'"\s]+)['"]?\)/g,
      )) {
        await copyFile(
          join(source, "files", match[1]),
          new URL(`fonts/${match[1]}`, output),
        );
      }
      css += upstream.replaceAll("./files/", "./fonts/");
    }
    await copyFile(
      join(source, "LICENSE"),
      new URL("fonts/OFL-LICENSE.txt", output),
    );
    await writeFile(
      new URL("index.css", output),
      css + new TokenCatalog().css(),
    );
  }
}
await new TokenAssetBuilder().run();
