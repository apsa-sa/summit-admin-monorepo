<!-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid. SPDX-License-Identifier: MIT -->
# Public-source publication gate / بوابة نشر المصدر العام

**Target repository only:** `apsa-sa/summit-admin-monorepo`.
**Development branch only:** `work/local-foundation` (no direct push to `main`).

1. Verify local repository root, active branch, current HEAD, worktree contents,
   remote URL, active GitHub account and `push` permission. Do not rely on the
   browser's login as evidence of the Terminal's login.
2. Run `pnpm install --frozen-lockfile`, `pnpm check`,
   `pnpm audit:publication` and `git diff --check` on the same source.
3. Examine **all changes including untracked files**. Verify license and
   ownership notices, MIT rights of third-party files, and no personal
   data, screenshots, service credentials, private business materials or
   backup/database dumps in the planned commit.
4. `pnpm audit:publication` inspects candidate source files and all Git blobs
   reachable from local branches/tags. It reports **only file paths and rule
   names**, never matched secrets. It is a **limited signature/path check**.
   Also run an independent history-aware tool (Gitleaks or TruffleHog) and
   review false positives manually before public publication. Never treat
   an empty regex scan as conclusive proof of no secrets.
5. Review all ancestors of the branch being pushed; remember Git publishes
   the entire reachable history, not only the latest working-tree files.
   A secret in a historical commit blocks the push even if later removed.
6. Confirm the public branch does not trigger unapproved external CI or
   automatic deployment. A `push` event may trigger configured workflows;
   review Actions and environments before pushing.
7. Push only the specified development ref, never force-push or rewrite main.
   Record the resulting SHA, GitHub URL and post-push checks. Merge is a
   separate reviewed operation; histories that differ must not be blindly
   combined or replaced.

**STOP / BLOCKED:** any unknown secret, incomplete history check, personal
information, unsigned release permission, failing test, unexpected git diff,
unknown remote, mismatched account or CI workflow with deployment privileges.
If a real secret was exposed, revoke and rotate it **before** any history
remediation; never paste its value into chats or issue trackers.

This gate approves at most a **development checkpoint**, not a production
application. Next.js, PostgreSQL integration, browser E2E, access-control
integration, accessibility and security gates remain open.
