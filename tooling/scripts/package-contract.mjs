// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
/** Inspects real pack tarballs, not a manifest promise. No registry publication. */
class PackageContractCommand {
  async run() {
    const destination = await mkdtemp(join(tmpdir(), "summit-pack-"));
    try {
      for (const name of ["design-tokens", "localization", "ui"]) {
        const cwd = resolve("packages", name);
        const manifest = JSON.parse(
          await readFile(join(cwd, "package.json"), "utf8"),
        );
        execFileSync("pnpm", ["pack", "--pack-destination", destination], {
          cwd,
          stdio: "pipe",
          timeout: 30000,
        });
        const archive = join(
          destination,
          `summit-${name}-${manifest.version}.tgz`,
        );
        const files = execFileSync("tar", ["-tzf", archive], {
          encoding: "utf8",
        })
          .trim()
          .split("\n");
        for (const required of [
          "dist/index.js",
          "dist/index.d.ts",
          "LICENSE",
          "README.md",
        ])
          assert.ok(
            files.includes(`package/${required}`),
            `${name}: missing ${required}`,
          );
        if (name !== "localization")
          for (const required of ["dist/index.css", "dist/css.d.ts"])
            assert.ok(files.includes(`package/${required}`));
        if (name === "design-tokens")
          assert.ok(files.includes("package/dist/fonts/OFL-LICENSE.txt"));
        for (const file of files)
          assert.ok(
            /^package\/(?:dist\/|README\.md$|LICENSE$|package\.json$)/.test(
              file,
            ),
            `Unexpected packed path: ${file}`,
          );
        console.log(
          `${name}: packed ESM/declarations${name === "localization" ? "" : "/CSS"} and notices verified (${files.length} files)`,
        );
      }
    } finally {
      await rm(destination, { recursive: true, force: true });
    }
  }
}
await new PackageContractCommand().run();
