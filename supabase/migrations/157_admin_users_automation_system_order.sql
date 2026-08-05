-- Per-admin ordering for the Automation control center's system cards.
-- JSONB mirrors admin_users.favorites: preferences follow the person across
-- devices, while code validates keys and appends newly introduced systems.

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS automation_system_order JSONB NOT NULL DEFAULT '[]'::jsonb;
