-- ─────────────────────────────────────────────────────────────────────────
-- Migration 070 — Contact first_name + last_name (for personalization).
--
-- Existing `name` column stays as the legacy display name. Going forward,
-- new contacts populate first_name + last_name directly (used by email
-- templates for personalization like "Hi {{first_name}}").
--
-- Backfill is best-effort: split existing `name` on the first space.
-- "Marcus Reyes" → first="Marcus", last="Reyes". Imperfect for prefixed
-- names like "Dr. Sarah Chen" → first="Dr.", last="Sarah Chen", but the
-- admin can fix those in the drawer if it matters.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE student_outreach_contacts
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name  TEXT;

UPDATE student_outreach_contacts
   SET first_name = CASE
                      WHEN POSITION(' ' IN name) > 0
                        THEN SUBSTRING(name FROM 1 FOR POSITION(' ' IN name) - 1)
                      ELSE name
                    END,
       last_name  = CASE
                      WHEN POSITION(' ' IN name) > 0
                        THEN TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
                      ELSE NULL
                    END
 WHERE first_name IS NULL
   AND name IS NOT NULL;

COMMENT ON COLUMN student_outreach_contacts.first_name IS
  'Given name. Used by email templates for personalization. Falls back to first word of name when missing.';
COMMENT ON COLUMN student_outreach_contacts.last_name IS
  'Family name. Optional.';
