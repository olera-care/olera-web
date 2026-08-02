-- Per-admin pinned sidebar pages. Array of /admin hrefs, rendered as a
-- "Pinned" section at the top of the admin sidebar. Keyed to the person
-- (not the browser) so pins follow admins across devices.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS favorites JSONB NOT NULL DEFAULT '[]'::jsonb;
