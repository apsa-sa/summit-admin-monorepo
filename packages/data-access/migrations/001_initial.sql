-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
-- SPDX-License-Identifier: MIT
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
 email text UNIQUE NOT NULL, role text NOT NULL CHECK(role IN ('admin','editor','viewer')),
 status text NOT NULL CHECK(status IN ('active','invited','suspended')),
 password_hash text, version integer NOT NULL DEFAULT 0 CHECK(version >= 0), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_created_idx ON users(created_at DESC,id);
CREATE TABLE IF NOT EXISTS sessions (digest text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE TABLE IF NOT EXISTS drafts (user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,name text NOT NULL DEFAULT '',organization text NOT NULL DEFAULT '',version integer NOT NULL DEFAULT 0 CHECK(version >= 0));
CREATE TABLE IF NOT EXISTS audit_events (id uuid PRIMARY KEY,actor_id uuid NOT NULL,action text NOT NULL,resource_id uuid NOT NULL,request_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_events(created_at DESC);
