// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
import type { UserInput, Role, Status, UserQuery, Draft } from '../contracts/index.js';
export class DomainError extends Error { constructor(public readonly status: number, public readonly code: string) { super(code); } }
export class Validation {
  static record(value: unknown): Record<string, unknown> { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new DomainError(422, 'invalid_input'); return Object.fromEntries(Object.entries(value)); }
  static text(value: unknown, max = 120): string { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new DomainError(422, 'invalid_input'); return value.trim(); }
  static integer(value: unknown, min = 0, max = 2147483647): number { if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new DomainError(422, 'invalid_number'); return value; }
  static role(value: unknown): Role { if (value !== 'admin' && value !== 'editor' && value !== 'viewer') throw new DomainError(422, 'invalid_role'); return value; }
  static status(value: unknown): Status { if (value !== 'active' && value !== 'invited' && value !== 'suspended') throw new DomainError(422, 'invalid_status'); return value; }
  static user(value: unknown): UserInput { const v = this.record(value); const email = this.text(v.email, 254).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError(422, 'invalid_email'); return { name: this.text(v.name), email, role: this.role(v.role), status: this.status(v.status), version: this.integer(v.version) }; }
  static draft(value: unknown): Draft { const v = this.record(value); const field = (input: unknown): string => { if (typeof input !== 'string' || input.length > 120) throw new DomainError(422, 'invalid_input'); return input; }; if (Object.keys(v).some(key => !['name', 'organization', 'version'].includes(key))) throw new DomainError(422, 'invalid_input'); return { name: field(v.name), organization: field(v.organization), version: this.integer(v.version) }; }
  static query(params: URLSearchParams): UserQuery { const page = params.has('page') ? Number(params.get('page')) : 1; const role = params.get('role') ?? ''; const status = params.get('status') ?? ''; if (role) this.role(role); if (status) this.status(status); const sort = params.get('sort') ?? 'created_at'; if (sort !== 'name' && sort !== 'created_at') throw new DomainError(422, 'invalid_sort'); return {search:(params.get('search') ?? '').slice(0,120), role,status,page:this.integer(page,1,100000),sort}; }
}
export class Money {
  readonly minor: number; readonly currency: string;
  constructor(minor: unknown, currency: unknown) { this.minor = Validation.integer(minor, 0, Number.MAX_SAFE_INTEGER); this.currency = Validation.text(currency, 3); if (!/^[A-Z]{3}$/.test(this.currency)) throw new DomainError(422, 'invalid_currency'); }
}
