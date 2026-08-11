-- Migration: Fix provider outreach re_engage stage and channel tracking
--
-- This migration captures database fixes that were applied manually:
-- 1. Add 're_engage' to the stage CHECK constraint (was missing, blocking stage transitions)
-- 2. Add 'channel_entered_at' column for channel lifecycle timing
--
-- Context: The re_engage stage was used in code but never added to the CHECK constraint.
-- This caused "Resend Claim Link" and other actions to fail with "Failed to update tracking record".
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.
-- NOTE: If you already ran these fixes manually, this migration is idempotent.

-- ============================================================================
-- 1. Update stage CHECK constraint to include 're_engage'
-- ============================================================================

-- Drop the old constraint (may have different name depending on how it was created)
ALTER TABLE provider_outreach_tracking
  DROP CONSTRAINT IF EXISTS provider_outreach_tracking_stage_check;

-- Add updated constraint with re_engage included
ALTER TABLE provider_outreach_tracking
  ADD CONSTRAINT provider_outreach_tracking_stage_check
  CHECK (stage = ANY (ARRAY[
    'not_contacted'::text,
    'in_sequence'::text,
    'needs_call'::text,
    're_engage'::text,
    'called'::text,
    'claimed'::text,
    'not_interested'::text,
    'archived'::text,
    'hidden'::text
  ]));

-- ============================================================================
-- 2. Add channel_entered_at column for channel lifecycle tracking
-- ============================================================================

-- Used by the channel lifecycle cron to track when a provider entered their
-- current re-engagement channel (fax → linkedin → direct_mail progression)
ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS channel_entered_at TIMESTAMPTZ;

-- Index for efficient lifecycle queries
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_channel_entered
  ON provider_outreach_tracking (channel_entered_at ASC)
  WHERE stage = 're_engage' AND channel_entered_at IS NOT NULL;
