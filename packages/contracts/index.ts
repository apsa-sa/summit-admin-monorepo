// © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
// SPDX-License-Identifier: MIT
export type Role = 'admin' | 'editor' | 'viewer';
export type Status = 'active' | 'invited' | 'suspended';
export interface User { id: string; name: string; email: string; role: Role; status: Status; version: number; createdAt: string; }
export interface Actor { id: string; role: Role; }
export interface Draft { name: string; organization: string; version: number; }
export interface AuditEvent { id: string; actorId: string; action: string; resourceId: string; requestId: string; createdAt: string; }
export interface UserQuery { search: string; role: string; status: string; page: number; sort: 'name' | 'created_at'; }
export interface UserPage { rows: User[]; total: number; page: number; pageSize: number; }
export interface UserInput { name: string; email: string; role: Role; status: Status; version: number; }
