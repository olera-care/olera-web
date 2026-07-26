-- Migration: Provider Outreach Re-Engage Cycle Tracking
--
-- Context: Add cycle tracking for the re-engagement workflow.
-- Providers get two cycles maximum through the outreach sequence.
-- After exhausting both cycles without a claim, they're auto-archived.
--
-- New columns:
--   - cycle_number: which outreach cycle (1 or 2), default 1
--   - re_engage_entered_at: when provider entered re_engage stage (for 30-day wait calculation)
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Add new columns ─────────────────────────────────────────────────────────

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS cycle_number INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS re_engage_entered_at TIMESTAMPTZ;

-- ── Add check constraint for cycle_number ───────────────────────────────────

ALTER TABLE provider_outreach_tracking
  ADD CONSTRAINT chk_cycle_number_valid CHECK (cycle_number IN (1, 2));

-- ── Index for efficient re-engage queue queries ─────────────────────────────

-- Partial index on re_engage_entered_at for re_engage stage
-- Enables fast queries: WHERE stage = 're_engage' ORDER BY re_engage_entered_at
CREATE INDEX IF NOT EXISTS idx_provider_outreach_tracking_re_engage_queue
  ON provider_outreach_tracking (re_engage_entered_at ASC)
  WHERE stage = 're_engage';

-- ── Update trigger to set re_engage_entered_at when entering re_engage ──────

-- Drop and recreate the existing trigger function to add new behavior
-- IMPORTANT: Preserves existing logic from migrations 132 and 137
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
    -- (preserved from migration 137)
    IF NEW.stage = 'needs_call' THEN
      NEW.due_date = CURRENT_DATE;
      NEW.resend_count = 0;
      NEW.no_answer_count = 0;
    END IF;

    -- When entering re_engage, record the timestamp
    -- (new in migration 139)
    IF NEW.stage = 're_engage' THEN
      NEW.re_engage_entered_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Handle INSERT case for new records ──────────────────────────────────────

-- Update the defaults trigger to handle re_engage and cycle_number
CREATE OR REPLACE FUNCTION provider_outreach_tracking_set_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure cycle_number has a default
  NEW.cycle_number = COALESCE(NEW.cycle_number, 1);

  -- For new records entering needs_call, set follow-up queue defaults
  -- (preserved from migration 137)
  IF NEW.stage = 'needs_call' THEN
    NEW.due_date = COALESCE(NEW.due_date, CURRENT_DATE);
    NEW.resend_count = COALESCE(NEW.resend_count, 0);
    NEW.no_answer_count = COALESCE(NEW.no_answer_count, 0);
  END IF;

  -- For new records entering re_engage, set timestamp
  -- (new in migration 139)
  IF NEW.stage = 're_engage' THEN
    NEW.re_engage_entered_at = COALESCE(NEW.re_engage_entered_at, now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger itself (trigger_provider_outreach_tracking_set_defaults)
-- was created in migration 137 and doesn't need to be recreated - it will
-- automatically use the updated function.

-- ── Backfill existing re_engage records ─────────────────────────────────────

-- Set re_engage_entered_at for existing records in re_engage stage
-- Use stage_changed_at as the best approximation
UPDATE provider_outreach_tracking
SET re_engage_entered_at = COALESCE(stage_changed_at, updated_at, now())
WHERE stage = 're_engage' AND re_engage_entered_at IS NULL;
