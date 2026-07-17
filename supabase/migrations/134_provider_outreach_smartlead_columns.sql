-- Migration: Add SmartLead tracking columns to provider_outreach_tracking
--
-- Context: Integrates Provider Outreach with SmartLead cold email platform.
-- Tracks which campaign a provider is enrolled in, their lead ID (for
-- operations like pause/resume), and metadata for webhook events.
--
-- Apply via Supabase dashboard (NOT CLI).

-- ============================================================================
-- 1. Add SmartLead tracking columns
-- ============================================================================

ALTER TABLE provider_outreach_tracking
  ADD COLUMN IF NOT EXISTS smartlead_campaign_id INTEGER,
  ADD COLUMN IF NOT EXISTS smartlead_lead_id INTEGER,
  ADD COLUMN IF NOT EXISTS smartlead_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sequence_metadata JSONB DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN provider_outreach_tracking.smartlead_campaign_id IS
  'SmartLead campaign ID this provider is enrolled in. NULL if not enrolled.';

COMMENT ON COLUMN provider_outreach_tracking.smartlead_lead_id IS
  'SmartLead lead ID for this provider. Used for pause/resume operations.';

COMMENT ON COLUMN provider_outreach_tracking.smartlead_enrolled_at IS
  'When the provider was enrolled into the SmartLead campaign.';

COMMENT ON COLUMN provider_outreach_tracking.sequence_metadata IS
  'JSONB for tracking sequence events: enrollment errors, webhook events, etc.';

-- ============================================================================
-- 2. Indexes for SmartLead queries
-- ============================================================================

-- Find all providers in a specific campaign
CREATE INDEX IF NOT EXISTS idx_provider_outreach_smartlead_campaign
  ON provider_outreach_tracking (smartlead_campaign_id)
  WHERE smartlead_campaign_id IS NOT NULL;

-- Find provider by SmartLead lead ID (webhook lookups)
CREATE INDEX IF NOT EXISTS idx_provider_outreach_smartlead_lead
  ON provider_outreach_tracking (smartlead_lead_id)
  WHERE smartlead_lead_id IS NOT NULL;

-- ============================================================================
-- 3. Update trigger to set smartlead_enrolled_at on enrollment
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

  -- Set smartlead_enrolled_at when campaign_id is first set
  IF OLD.smartlead_campaign_id IS NULL AND NEW.smartlead_campaign_id IS NOT NULL THEN
    NEW.smartlead_enrolled_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Trigger already exists from migration 131, this replaces the function.
