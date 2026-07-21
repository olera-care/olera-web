-- Migration: Provider Outreach Follow-Up Queue
--
-- Context: Transform the Follow Up tab from a simple list into a working call queue
-- with due dates, outcome tracking, and automatic stage transitions.
--
-- Adds tracking columns for call queue management:
--   - due_date: when to call this provider
--   - resend_count: times the "resend link" action was used
--   - no_answer_count: times "no answer" was recorded
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Add new columns ─────────────────────────────────────────────────────────

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS resend_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS no_answer_count INT NOT NULL DEFAULT 0;

-- ── Index for efficient Follow Up queue sorting ─────────────────────────────

-- Partial index on due_date for needs_call stage (Follow Up queue)
-- Enables fast queries: ORDER BY due_date ASC WHERE stage = 'needs_call'
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_follow_up_queue
  ON provider_outreach_tracking (due_date ASC)
  WHERE stage = 'needs_call';

-- ── Update trigger to reset counters when entering needs_call ───────────────

-- Drop and recreate the existing trigger function to add new behavior
-- IMPORTANT: Preserves existing logic from migration 132 (sequence_started_at, claimed_at)
CREATE OR REPLACE FUNCTION update_provider_outreach_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();

  -- Update stage_changed_at if stage changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_changed_at = now();

    -- Set sequence_started_at when entering in_sequence (if not already set)
    -- (preserved from migration 132)
    IF NEW.stage = 'in_sequence' AND NEW.sequence_started_at IS NULL THEN
      NEW.sequence_started_at = now();
    END IF;

    -- Set claimed_at when entering claimed stage
    -- (preserved from migration 132)
    IF NEW.stage = 'claimed' THEN
      NEW.claimed_at = now();
    END IF;

    -- When entering needs_call (Follow Up), set defaults for call queue
    IF NEW.stage = 'needs_call' THEN
      NEW.due_date = CURRENT_DATE;
      NEW.resend_count = 0;
      NEW.no_answer_count = 0;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger itself (trigger_provider_outreach_tracking_updated_at)
-- was created in migration 131 and doesn't need to be recreated - it will
-- automatically use the updated function.

-- ── Handle INSERT case for new records entering needs_call ──────────────────

CREATE OR REPLACE FUNCTION provider_outreach_tracking_set_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- For new records entering needs_call, set follow-up queue defaults
  IF NEW.stage = 'needs_call' THEN
    NEW.due_date = COALESCE(NEW.due_date, CURRENT_DATE);
    NEW.resend_count = COALESCE(NEW.resend_count, 0);
    NEW.no_answer_count = COALESCE(NEW.no_answer_count, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_provider_outreach_tracking_set_defaults ON provider_outreach_tracking;
CREATE TRIGGER trigger_provider_outreach_tracking_set_defaults
  BEFORE INSERT ON provider_outreach_tracking
  FOR EACH ROW
  EXECUTE FUNCTION provider_outreach_tracking_set_defaults();
