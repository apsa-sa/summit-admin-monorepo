-- © 2026 apsa.sa — Arab Planets Summit Architectural — Eng: Samer alhamid.
-- SPDX-License-Identifier: MIT
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),
  media_type text NOT NULL CHECK(media_type IN ('image/png','image/jpeg','image/webp','image/heic','application/pdf')),
  original bytea NOT NULL CHECK(octet_length(original) BETWEEN 1 AND 5000000),
  sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
  preview bytea CHECK(octet_length(preview) BETWEEN 1 AND 1000000),
  preview_width integer CHECK(preview_width BETWEEN 1 AND 1600),
  preview_height integer CHECK(preview_height BETWEEN 1 AND 1600),
  original_only_reason text CHECK(original_only_reason IN ('pdf-original','heic-original','animation-original')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id,operation_id),
  CHECK((preview IS NOT NULL AND preview_width IS NOT NULL AND preview_height IS NOT NULL AND original_only_reason IS NULL)
     OR (preview IS NULL AND preview_width IS NULL AND preview_height IS NULL AND original_only_reason IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS attachments_owner_created_idx ON attachments(owner_id,created_at DESC,id);
