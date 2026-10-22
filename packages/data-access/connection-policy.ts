// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type { PoolConfig } from 'pg';
import { DomainError } from '../core/index.js';

/** Independent of any particular managed-PostgreSQL provider. */
export class DatabaseConnectionPolicy {
  configure(connectionString: string): PoolConfig {
    if (typeof connectionString !== 'string' || connectionString.length < 1 || connectionString.length > 8192) {
      throw new DomainError(422, 'invalid_database_url');
    }
    let parsed: URL;
    try {
      parsed = new URL(connectionString);
    } catch {
      throw new DomainError(422, 'invalid_database_url');
    }
    if (!['postgres:', 'postgresql:'].includes(parsed.protocol) ||
        !parsed.hostname || !parsed.username || !parsed.pathname || parsed.pathname === '/' ||
        parsed.hash || parsed.username.length > 256) {
      throw new DomainError(422, 'invalid_database_url');
    }
    // Connection-string parameters can override host and TLS settings in pg.
    for (const forbidden of ['host', 'hostaddr', 'ssl', 'uselibpqcompat', 'sslcert', 'sslkey']) {
      if (parsed.searchParams.has(forbidden)) throw new DomainError(422, 'unsafe_database_options');
    }
    if (parsed.searchParams.getAll('sslmode').length > 1) {
      throw new DomainError(422, 'unsafe_database_options');
    }
    const mode = parsed.searchParams.get('sslmode');
    const host = parsed.hostname.toLowerCase();
    const local = host === '127.0.0.1' || host === 'localhost' || host === '[::1]';
    if (!local && mode !== 'verify-full') {
      throw new DomainError(422, 'database_tls_required');
    }
    if (local && mode && mode !== 'verify-full' && mode !== 'disable') {
      throw new DomainError(422, 'unsafe_database_options');
    }
    // pg 8 interprets sslmode=verify-full as certificate+hostname validated TLS.
    // Never set rejectUnauthorized:false or silently downgrade remote TLS.
    return { connectionString, max: 8 };
  }
}
