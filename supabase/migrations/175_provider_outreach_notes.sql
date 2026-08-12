-- Migration: Provider Outreach Notes
--
-- Adds a notes history table for tracking admin interactions with providers.
-- Unlike the single `notes` field on provider_outreach_tracking, this allows:
--   - Multiple notes per provider (history)
--   - Admin attribution (who wrote the note)
--   - Timestamps (when each note was added)
--
-- Use case: Admin calls a provider, adds note "Called 8/12, spoke with Jane,
-- she's interested but needs to check with owner." Next week, another admin
-- can see this history and pick up where they left off.

-- ============================================================================
-- 1. provider_outreach_notes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_outreach_notes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- References provider_outreach_tracking.provider_id (TEXT)
  provider_id     TEXT NOT NULL,

  -- Which admin wrote this note
  admin_user_id   UUID NOT NULL REFERENCES admin_users(id),

  -- The note content
  note            TEXT NOT NULL,

  -- When the note was created
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup by provider (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_notes_provider_id
  ON provider_outreach_notes (provider_id);

-- Query by admin (for admin activity reports)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_notes_admin_user_id
  ON provider_outreach_notes (admin_user_id);

-- Composite index for provider + time ordering (fetch notes for provider, newest first)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_notes_provider_created
  ON provider_outreach_notes (provider_id, created_at DESC);

-- Service-role only (admin access via service client)
ALTER TABLE provider_outreach_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Helper view for notes with admin names (optional convenience)
-- ============================================================================

CREATE OR REPLACE VIEW provider_outreach_notes_with_admin AS
SELECT
  n.id,
  n.provider_id,
  n.admin_user_id,
  n.note,
  n.created_at,
  a.display_name AS admin_name
FROM provider_outreach_notes n
LEFT JOIN admin_users a ON a.id = n.admin_user_id;
