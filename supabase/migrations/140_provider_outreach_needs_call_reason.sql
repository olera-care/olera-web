-- Migration: Provider Outreach Follow-Up Reason
--
-- Context: Track why each provider entered the Follow Up (needs_call) stage.
-- This allows the UI to show a reason chip (e.g., "Sequence done", "Manual")
-- so admins understand at a glance why each provider needs a call.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Add reason column ─────────────────────────────────────────────────────

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS needs_call_reason TEXT;

-- ── Update trigger to set reason when entering needs_call ─────────────────

-- Drop and recreate the existing trigger function to add reason handling
-- IMPORTANT: Preserves all existing logic from migrations 131, 132, 137, 139
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
      -- Set default reason if not already provided by application code
      IF NEW.needs_call_reason IS NULL THEN
        NEW.needs_call_reason = 'manual';
      END IF;
    END IF;

    -- When entering re_engage, set the timestamp
    -- (preserved from migration 139)
    IF NEW.stage = 're_engage' THEN
      NEW.re_engage_entered_at = now();
    END IF;

    -- Clear re_engage_entered_at when leaving re_engage
    -- (preserved from migration 139)
    IF OLD.stage = 're_engage' AND NEW.stage != 're_engage' THEN
      NEW.re_engage_entered_at = NULL;
    END IF;

    -- Clear needs_call_reason when leaving needs_call
    IF OLD.stage = 'needs_call' AND NEW.stage != 'needs_call' THEN
      NEW.needs_call_reason = NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Update INSERT trigger for new records ─────────────────────────────────

CREATE OR REPLACE FUNCTION provider_outreach_tracking_set_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- For new records entering needs_call, set follow-up queue defaults
  IF NEW.stage = 'needs_call' THEN
    NEW.due_date = COALESCE(NEW.due_date, CURRENT_DATE);
    NEW.resend_count = COALESCE(NEW.resend_count, 0);
    NEW.no_answer_count = COALESCE(NEW.no_answer_count, 0);
    NEW.needs_call_reason = COALESCE(NEW.needs_call_reason, 'manual');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Triggers themselves were created in earlier migrations and will
-- automatically use the updated functions.

-- ── Backfill existing needs_call providers with 'manual' reason ───────────

UPDATE provider_outreach_tracking
SET needs_call_reason = 'manual'
WHERE stage = 'needs_call' AND needs_call_reason IS NULL;
