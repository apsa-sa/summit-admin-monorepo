// © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { PostgresRepository } from '../../data-access/index.js';
import { DatabaseConnectionPolicy } from '../../data-access/connection-policy.js';

/** Creates and cleans up only uniquely named databases owned by this test instance. */
export class DatabaseFixture {
  private readonly names: string[] = [];
  private readonly repositories: PostgresRepository[] = [];
  private readonly control: Pool;
  private readonly url: URL;

  constructor() {
    const value = process.env.TEST_DATABASE_URL;
    if (!value || process.env.SUMMIT_TEST_DB_APPROVED !== '1') throw new Error('Explicit isolated test database approval is required');
    this.url = new URL(value);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(this.url.hostname) ||
        this.url.pathname !== '/summit_test' || this.url.search || this.url.hash) {
      throw new Error('Tests require loopback control database named summit_test, without URL overrides');
    }
    this.control = new Pool(new DatabaseConnectionPolicy().configure(value));
  }

  async create(): Promise<PostgresRepository> {
    const name = `summit_test_${randomUUID().replaceAll('-', '')}`;
    // Identifier is exclusively generated here, never taken from an environment/input.
    await this.control.query(`CREATE DATABASE "${name}"`);
    this.names.push(name);
    const url = new URL(this.url);
    url.pathname = `/${name}`;
    const repository = new PostgresRepository(url.toString(), new DatabaseConnectionPolicy());
    this.repositories.push(repository);
    const migration = await readFile(new URL('../../data-access/migrations/001_initial.sql', import.meta.url), 'utf8');
    await repository.pool.query(migration);
    await repository.pool.query(migration); // Reapplying the existing initial migration must preserve data/schema.
    return repository;
  }

  async close(): Promise<void> {
    const results = await Promise.allSettled(this.repositories.map(repository => repository.pool.end()));
    try {
      for (const name of this.names) await this.control.query(`DROP DATABASE "${name}"`);
    } finally { await this.control.end(); }
    if (results.some(result => result.status === 'rejected')) throw new Error('Fixture connection cleanup failed');
  }
}
