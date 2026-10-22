// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT

/** Conservative pre-publication checks; NOT a comprehensive credential scanner. */
export class PublicationPolicy {
  private readonly rules: ReadonlyArray<readonly [string, RegExp]> = [
    ['private_key', /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/],
    ['github_token', /(?:github_pat_[A-Za-z0-9_]{20,}|gh[opusr]_[A-Za-z0-9_]{20,})/],
    ['aws_access_key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ['stripe_secret', /\bsk_live_[A-Za-z0-9]{16,}\b/],
    ['slack_token', /\bxox[baprs]-[A-Za-z0-9-]{15,}\b/],
    ['secret_database_url', /\bpost(?:gres|gresql):\/\/[A-Za-z0-9._%~-]+:[^\s@/'"+]+@[A-Za-z0-9.-]+/i],
  ];

  forbiddenPath(path: string): boolean {
    const normalized = path.replaceAll('\\', '/');
    const name = normalized.split('/').at(-1) ?? '';
    if (name === '.env.example') return false;
    return /^(?:\.env(?:\..*)?|id_(?:rsa|ed25519)|credentials\.json|service[-_]account(?:\.json)?|\.pgpass)$/i.test(name) ||
      /\.(?:pem|p12|pfx|key|sqlite|sqlite3|db|dump|bak)$/i.test(name);
  }

  findings(text: string, path: string): string[] {
    const found: string[] = [];
    for (const [id, rule] of this.rules) {
      if (!rule.test(text)) continue;
      // This is the deliberately disposable local Docker credential; it is
      // allowed ONLY in the checked-in example pointing at loopback.
      if (id === 'secret_database_url' && path === '.env.example' &&
          /^DATABASE_URL=postgresql:\/\/summit:summit_local_only@127\.0\.0\.1:55439\/summit$/m.test(text) &&
          text.split(/\r?\n/).filter(line => /\bpost(?:gres|gresql):\/\//i.test(line)).length === 1) {
        continue;
      }
      found.push(id);
    }
    return found;
  }
}
