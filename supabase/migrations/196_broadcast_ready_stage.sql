-- Migration: Add broadcast_ready stage for city broadcasts
--
-- WHY
-- City broadcasts send engagement emails to dormant providers when family
-- activity occurs in their city. To ensure email quality, providers must be
-- explicitly moved to broadcast_ready by an admin after verifying:
--   - At least 1 email successfully delivered
--   - Zero bounces
--   - Zero complaints
--   - Admin has called the provider
--
-- This migration adds the broadcast_ready stage to the CHECK constraint.
--
-- Idempotent: safe to re-run.

-- Drop the old constraint
ALTER TABLE provider_outreach_tracking
  DROP CONSTRAINT IF EXISTS provider_outreach_tracking_stage_check;

-- Add updated constraint with broadcast_ready and call_exhausted included
ALTER TABLE provider_outreach_tracking
  ADD CONSTRAINT provider_outreach_tracking_stage_check
  CHECK (stage = ANY (ARRAY[
    'not_contacted'::text,
    'in_sequence'::text,
    'needs_call'::text,
    'broadcast_ready'::text,
    're_engage'::text,
    'call_exhausted'::text,
    'called'::text,
    'claimed'::text,
    'not_interested'::text,
    'archived'::text,
    'hidden'::text
  ]));

-- Index for efficient broadcast eligibility queries
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_broadcast_ready
  ON provider_outreach_tracking (city, state)
  WHERE stage = 'broadcast_ready';
