-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
CREATE TABLE IF NOT EXISTS request_limits (
  key text PRIMARY KEY CHECK(key ~ '^[a-f0-9]{64}$'),
  count integer NOT NULL CHECK(count BETWEEN 1 AND 16),
  resets_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS request_limits_expiry_idx ON request_limits(resets_at);
