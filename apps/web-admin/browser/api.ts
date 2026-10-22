// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type { AuditEvent, Draft, User, UserInput, UserPage } from '../../../packages/contracts/index.js';

export class ApiFailure extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}

export class AdminApiClient {
  constructor(private readonly base = '') {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.base}${path}`, {
        ...init,
        credentials: 'same-origin',
        headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      });
    } catch {
      throw new ApiFailure(0, 'network_error');
    }
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const code = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error : 'request_failed';
      throw new ApiFailure(response.status, code);
    }
    return (await response.json()) as T;
  }

  async login(email: string, password: string): Promise<User> {
    const result = await this.request<{user: User}>('/api/login', {
      method: 'POST', body: JSON.stringify({email, password}),
    });
    return result.user;
  }
  async me(): Promise<User> { return (await this.request<{user: User}>('/api/me')).user; }
  async logout(): Promise<void> { await this.request('/api/logout', {method: 'POST'}); }
  async users(page: number, search: string, role = '', status = ''): Promise<UserPage> {
    const query = new URLSearchParams({page: String(page), search, role, status});
    return this.request<UserPage>(`/api/users?${query}`);
  }
  async createUser(input: UserInput): Promise<User> {
    const result = await this.request<{user: User}>('/api/users', {method:'POST', body:JSON.stringify(input)});
    return result.user;
  }
  async updateUser(id: string, input: UserInput): Promise<User> {
    const result = await this.request<{user: User}>(`/api/users/${encodeURIComponent(id)}`, {method:'PUT', body:JSON.stringify(input)});
    return result.user;
  }
  async deleteUser(id: string): Promise<void> {
    await this.request(`/api/users/${encodeURIComponent(id)}`, {method:'DELETE'});
  }
  async draft(): Promise<Draft> { return this.request<Draft>('/api/draft'); }
  async saveDraft(draft: Draft): Promise<Draft> {
    return this.request<Draft>('/api/draft', {method:'PUT', body:JSON.stringify(draft)});
  }
  async audit(): Promise<AuditEvent[]> {return (await this.request<{rows: AuditEvent[]}>('/api/audit')).rows;}
  exportUrl(locale: 'ar'|'en', search: string, role: string, status: string): string {
    return `${this.base}/api/users/export?${new URLSearchParams({locale, search, role, status})}`;
  }
}
