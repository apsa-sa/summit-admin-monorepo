// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { execFileSync } from "node:child_process";
import { lstat, realpath, rm } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
/** Only resets generated dist of the three owned library packages; never source/history. */
class LibraryBuildCommand {
  async run() {
    const root = fileURLToPath(new URL("../../", import.meta.url));
    const directory = await realpath(process.cwd());
    const packages = ["design-tokens", "localization", "ui"];
    const name = packages.find(
      (value) => resolve(root, "packages", value) === directory,
    );
    if (!name)
      throw new Error("Library build must run in an owned package directory");
    const output = resolve(directory, "dist");
    const stat = await lstat(output).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink()))
      throw new Error("Unsafe generated output path");
    await rm(output, { recursive: true, force: true });
    execFileSync("tsc", ["-p", "tsconfig.json"], {
      stdio: "inherit",
      timeout: 60000,
    });
    if (name !== "localization")
      await import(pathToFileURL(resolve(directory, "build-assets.mjs")).href);
  }
}
await new LibraryBuildCommand().run();
