<!-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT -->
# CI browser-dependency mirror latency

Scope: disposable Ubuntu24.04 GitHub Actions job only, before the unchanged
`pnpm exec playwright install --with-deps chromium`. No workstation/hosting/database,
branch protection, dependency version, assertion or required check is changed.

Direct prior log evidence: run 39824857279 / job119985344212. Browser dependency
installation began 17:42:26 UTC. Ubuntu font packages from azure.archive.ubuntu.com
continued until 17:53:50. Chromium/FFmpeg/headless-shell then downloaded within
approximately six seconds. This explains that CI preparation delay, not any
unobserved cause of a ChatGPT UI hang. Other runs were faster; no universal network
speed or project performance claim is inferred.

Inspected upstream runner image configuration at exact commit:
https://github.com/actions/runner-images/blob/5b6567dc8f6adb65a208b8203b7947bf8323de37/images/ubuntu/scripts/build/configure-apt-sources.sh
It installs the same three mirrors with Azure priority1, the official HTTPS archive
priority2 and security.ubuntu.com priority3. Ubuntu's own archive documentation:
https://ubuntu.com/project/docs/how-ubuntu-is-made/concepts/package-archive/

A bounded workflow step now swaps only those two exact known priority strings in
`/etc/apt/apt-mirrors.txt` on this ephemeral runner. It retains every URL/fallback,
including the security mirror, all signing/key configuration and the complete
Playwright dependency set/fonts. Missing/symlinked/customized configurations are
left intact with an explicit diagnostic. No insecure APT flags, skipped font,
removed dependency, softened assertion or extended test timeout is introduced.
This is project CI provisioning, never a command run on an unknown user machine.

Files: .github/workflows/ci.yml, this report. No source file deleted or dependency/
lockfile upgrade. YAML/embedded Python syntax checked locally; actual complete CI
and duration still required on the new exact head. Status PARTIAL until executed.
Rollback: revert this one workflow step; the original signed mirror defaults and
all tests remain. Docs/workbench feature acceptance still needs all 33 browsers,
30 real PG, 87 units/contracts, four asset contracts and security/build gates.
