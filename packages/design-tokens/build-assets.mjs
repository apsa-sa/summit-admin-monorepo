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
    let printCss = "";
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
      let embedded = upstream;
      for (const match of upstream.matchAll(/url\(['"]?\.\/files\/([^)'"\s]+)['"]?\)/g)) {
        const bytes = await readFile(join(source, "files", match[1]));
        const type = match[1].endsWith(".woff2") ? "woff2" : "woff";
        embedded = embedded.replaceAll(`./files/${match[1]}`, `data:font/${type};base64,${bytes.toString("base64")}`);
      }
      printCss += embedded;

    }
    await writeFile(new URL("print-fonts.js", output),
      `// Noto Sans Arabic 5.2.8, SIL OFL-1.1; see fonts/OFL-LICENSE.txt.\nexport const printFontCss = ${JSON.stringify(printCss)};\n`);
    await writeFile(new URL("print-fonts.d.ts", output), "export declare const printFontCss: string;\n");
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
