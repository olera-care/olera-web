-- Add display_name column to admin_users for human-readable name chips
-- Backfill from email (portion before @)

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Backfill: extract username from email (portion before @)
UPDATE admin_users
  SET display_name = split_part(email, '@', 1)
  WHERE display_name IS NULL;
