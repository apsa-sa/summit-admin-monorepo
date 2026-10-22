-- © 2026 APSA / eng:samer alhamid — apsa.sa. SPDX-License-Identifier: MIT
-- Additive per-installation/account state; existing migrations remain immutable.
CREATE TABLE user_table_preferences (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 search text NOT NULL DEFAULT '' CHECK(length(search)<=120),
 role text NOT NULL DEFAULT '' CHECK(role IN ('','admin','editor','viewer')),
 status text NOT NULL DEFAULT '' CHECK(status IN ('','active','invited','suspended')),
 page integer NOT NULL DEFAULT 1 CHECK(page BETWEEN 1 AND 100000),
 sort text NOT NULL DEFAULT 'created_at' CHECK(sort IN ('name','created_at')),
 columns text[] NOT NULL DEFAULT ARRAY['name','email','role','status','created_at']::text[],
 version integer NOT NULL DEFAULT 0 CHECK(version BETWEEN 0 AND 2147483647),
 CHECK(cardinality(columns) BETWEEN 1 AND 5 AND array_position(columns,NULL) IS NULL
   AND columns <@ ARRAY['name','email','role','status','created_at']::text[]
   AND columns @> ARRAY['name']::text[]
   AND cardinality(columns)=
    (CASE WHEN 'name'=ANY(columns) THEN 1 ELSE 0 END +
     CASE WHEN 'email'=ANY(columns) THEN 1 ELSE 0 END +
     CASE WHEN 'role'=ANY(columns) THEN 1 ELSE 0 END +
     CASE WHEN 'status'=ANY(columns) THEN 1 ELSE 0 END +
     CASE WHEN 'created_at'=ANY(columns) THEN 1 ELSE 0 END))
);
