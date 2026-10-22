// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
class NextApplicationCommand {
  async run() {
    const application = process.argv[3] ?? "web-admin";
    if (application !== "web-admin" && application !== "docs")
      throw new Error("Unsupported SUMMIT application");
    const envFile = fileURLToPath(new URL("../../.env", import.meta.url));
    if (application !== "docs" && existsSync(envFile))
      process.loadEnvFile(envFile);
    const command = process.argv[2];
    if (!["dev", "build", "start"].includes(command))
      throw new Error("Use dev, build or start");
    const directory = fileURLToPath(
      new URL(`../../apps/${application}/`, import.meta.url),
    );
    const require = createRequire(
      new URL(`../../apps/${application}/package.json`, import.meta.url),
    );
    const port = Number(
      application === "docs"
        ? (process.env.SUMMIT_DOCS_PORT ?? 3213)
        : (process.env.SUMMIT_ADMIN_PORT ?? 3212),
    );
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
      throw new Error(
        application === "docs"
          ? "Invalid SUMMIT_DOCS_PORT"
          : "Invalid SUMMIT_ADMIN_PORT",
      );
    const args = [require.resolve("next/dist/bin/next"), command];
    if (command !== "start") args.push("--webpack");
    if (command !== "build")
      args.push(
        "--hostname",
        (application === "docs"
          ? process.env.SUMMIT_DOCS_HOST
          : process.env.SUMMIT_ADMIN_HOST) ?? "127.0.0.1",
        "--port",
        String(port),
      );
    const childEnvironment = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
    // Runtime children never need bootstrap credentials or the test fixture payload.
    for (const key of [
      "SEED_ADMIN_PASSWORD",
      "SUMMIT_JOURNEY_DATA",
      "SUMMIT_CI_DB_PASSWORD",
      "TEST_DATABASE_URL",
    ])
      delete childEnvironment[key];
    if (application === "docs") delete childEnvironment.DATABASE_URL;
    const child = spawn(process.execPath, args, {
      cwd: directory,
      stdio: "inherit",
      env: childEnvironment,
    });
    const interrupt = () => child.kill("SIGTERM");
    process.on("SIGTERM", interrupt);
    process.on("SIGINT", interrupt);
    try {
      await new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (code) => {
          process.exitCode = code ?? 1;
          resolve();
        });
      });
    } finally {
      process.off("SIGTERM", interrupt);
      process.off("SIGINT", interrupt);
    }
  }
}
await new NextApplicationCommand().run();
