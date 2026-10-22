// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
class NextApplicationCommand {
  async run() {
    const envFile = fileURLToPath(new URL("../../.env", import.meta.url));
    if (existsSync(envFile)) process.loadEnvFile(envFile);
    const command = process.argv[2];
    if (!["dev", "build", "start"].includes(command))
      throw new Error("Use dev, build or start");
    const directory = fileURLToPath(
      new URL("../../apps/web-admin/", import.meta.url),
    );
    const require = createRequire(
      new URL("../../apps/web-admin/package.json", import.meta.url),
    );
    const port = Number(process.env.SUMMIT_ADMIN_PORT ?? 3212);
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
      throw new Error("Invalid SUMMIT_ADMIN_PORT");
    const args = [require.resolve("next/dist/bin/next"), command];
    if (command !== "start") args.push("--webpack");
    if (command !== "build")
      args.push(
        "--hostname",
        process.env.SUMMIT_ADMIN_HOST ?? "127.0.0.1",
        "--port",
        String(port),
      );
    const child = spawn(process.execPath, args, {
      cwd: directory,
      stdio: "inherit",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
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
