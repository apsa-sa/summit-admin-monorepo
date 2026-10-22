// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { PublicationPolicy } from '../../packages/security/publication-policy.js';

/** Read-only inspection of the exact repository, including reachable Git blobs. */
export class PublicationAuditCommand {
  constructor(private readonly policy: PublicationPolicy, private readonly directory: string) {}

  private git(args: string[]): Buffer {
    return execFileSync('git', args, {
      cwd: this.directory,
      encoding: 'buffer',
      maxBuffer: 16 * 1024 * 1024,
      timeout: 20000,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  private checkContent(bytes: Buffer, path: string, problems: Set<string>): void {
    if (bytes.byteLength > 2_000_000 || bytes.includes(0)) {
      problems.add(`${path}: binary_or_large_file_review_required`);
      return;
    }
    for (const rule of this.policy.findings(bytes.toString('utf8'), path)) {
      problems.add(`${path}: ${rule}`);
    }
  }

  run(): number {
    const problems = new Set<string>();
    try {
      const root = this.git(['rev-parse', '--show-toplevel']).toString('utf8').trim();
      const manifest = JSON.parse(readFileSync(resolve(this.directory, 'package.json'), 'utf8')) as unknown;
      if (root !== this.directory || typeof manifest !== 'object' || manifest === null ||
          !('name' in manifest) || manifest.name !== 'summit-admin-monorepo') {
        throw new Error('project_identity_mismatch');
      }
      const paths = this.git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
        .toString('utf8').split('\0').filter(Boolean);
      for (const path of paths) {
        if (this.policy.forbiddenPath(path)) {
          problems.add(`${path}: forbidden_filename`);
          continue;
        }
        const fullPath = resolve(this.directory, path);
        if (relative(this.directory, fullPath).startsWith('..')) {
          problems.add(`${path}: path_outside_repository`);
          continue;
        }
        try {
          if (lstatSync(fullPath).isSymbolicLink()) {
            problems.add(`${path}: symlink_review_required`);
            continue;
          }
          const physical = realpathSync(fullPath);
          if (physical !== this.directory && !physical.startsWith(`${this.directory}/`)) {
            problems.add(`${path}: path_outside_repository`);
            continue;
          }
          this.checkContent(readFileSync(fullPath), path, problems);
        } catch { problems.add(`${path}: unreadable_file`); }
      }
      // All blobs reachable from local branches/tags, not only current HEAD.
      const objects = this.git(['rev-list', '--objects', '--all']).toString('utf8').trim().split('\n');
      for (const entry of objects) {
        if (!entry) continue;
        const space = entry.indexOf(' ');
        if (space === -1) continue;
        const hash = entry.slice(0, space);
        const path = entry.slice(space + 1);
        if (this.git(['cat-file', '-t', hash]).toString('utf8').trim() !== 'blob') continue;
        if (this.policy.forbiddenPath(path)) {
          problems.add(`${path}: forbidden_filename_in_history`);
          continue;
        }
        this.checkContent(this.git(['cat-file', 'blob', hash]), path, problems);
      }
    } catch (error: unknown) {
      problems.add('audit_incomplete: git_read_or_identity_error');
      if (process.env.SUMMIT_AUDIT_DIAGNOSTICS === '1' && error instanceof Error) {
        // No underlying tool stdout/stderr, paths or credential-bearing URLs.
        console.error('Publication audit failed before completion.');
      }
    }
    if (problems.size) {
      for (const finding of [...problems].sort()) console.error(`BLOCKED: ${finding}`);
      console.error(`Publication audit: FAIL (${problems.size} findings). No secrets were printed.`);
      return 1;
    }
    console.log('Publication audit: PASS (working tree + reachable local history, signatures only).');
    console.log('Still required: independent secret scanner, dependency review and owner approval.');
    return 0;
  }
}

process.exitCode = new PublicationAuditCommand(new PublicationPolicy(), resolve(process.cwd())).run();
