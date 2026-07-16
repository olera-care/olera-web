-- Migration: Add sequence and claim timestamp tracking to provider_outreach_tracking
--
-- Context: Adds tracking fields for better funnel analytics:
--   - sequence_started_at: When provider entered in_sequence stage
--   - claimed_at: When provider claimed their account
--
-- These fields enable:
--   - Accurate time-to-claim calculations
--   - Sequence duration metrics
--   - Historical funnel analysis
--
-- Apply via Supabase dashboard (NOT CLI).

-- ============================================================================
-- 1. Add new timestamp columns
-- ============================================================================

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS sequence_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Index for sequence analytics (time range queries on sequence start)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_sequence_started_at
  ON provider_outreach_tracking (sequence_started_at)
  WHERE sequence_started_at IS NOT NULL;

-- Index for claim analytics (time range queries on claim date)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_claimed_at
  ON provider_outreach_tracking (claimed_at)
  WHERE claimed_at IS NOT NULL;

-- ============================================================================
-- 2. Update trigger to auto-populate timestamps on stage changes
-- ============================================================================

CREATE OR REPLACE FUNCTION update_provider_outreach_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();

  -- Track when stage changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_changed_at = now();

    -- Set sequence_started_at when entering in_sequence (if not already set)
    IF NEW.stage = 'in_sequence' AND NEW.sequence_started_at IS NULL THEN
      NEW.sequence_started_at = now();
    END IF;

    -- Set claimed_at when entering claimed stage
    IF NEW.stage = 'claimed' THEN
      NEW.claimed_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger already exists from migration 131, this replaces the function.
-- No need to recreate the trigger itself.
