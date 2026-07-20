-- Migration: Provider Outreach States
--
-- Tracks which US states have been "added" for outreach work.
-- Instead of just filtering by state, admins explicitly add states to work on,
-- enabling progress tracking and coverage visibility.
--
-- Workflow:
--   1. Admin clicks "Add State" → picks a state (e.g., CA)
--   2. State row created here with status='active'
--   3. Admin works on providers in that state
--   4. Stats update as providers move through stages
--   5. Admin can mark state as 'completed' when done
--
-- Apply via Supabase dashboard (NOT CLI).

-- ============================================================================
-- 1. provider_outreach_states table
-- ============================================================================

CREATE TABLE IF NOT EXISTS provider_outreach_states (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- US state code (e.g., "CA", "TX") - unique, one row per state
  state_code         TEXT NOT NULL UNIQUE,

  -- Work status for this state
  status             TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed')),

  -- Who added this state and when
  added_by           UUID REFERENCES auth.users(id),
  added_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Denormalized provider counts per stage (refreshed on demand or periodically)
  -- These are counts of providers in this state at each outreach stage
  total_providers    INT NOT NULL DEFAULT 0,
  not_contacted      INT NOT NULL DEFAULT 0,
  in_sequence        INT NOT NULL DEFAULT 0,
  needs_call         INT NOT NULL DEFAULT 0,
  called             INT NOT NULL DEFAULT 0,
  claimed            INT NOT NULL DEFAULT 0,
  archived           INT NOT NULL DEFAULT 0,
  hidden             INT NOT NULL DEFAULT 0,

  -- Admin notes about this state's outreach
  notes              TEXT,

  -- Last time stats were refreshed
  stats_refreshed_at TIMESTAMPTZ,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing active states
CREATE INDEX IF NOT EXISTS idx_provider_outreach_states_status
  ON provider_outreach_states (status);

-- Service-role only (admin access via service client)
ALTER TABLE provider_outreach_states ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Auto-update updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_provider_outreach_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_provider_outreach_states_updated_at
  BEFORE UPDATE ON provider_outreach_states
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_outreach_states_updated_at();

-- ============================================================================
-- 3. Function to refresh stats for a single state
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_provider_outreach_state_stats(target_state_code TEXT)
RETURNS void AS $$
DECLARE
  v_total INT;
  v_not_contacted INT;
  v_in_sequence INT;
  v_needs_call INT;
  v_called INT;
  v_claimed INT;
  v_archived INT;
  v_hidden INT;
  v_unclaimed_total INT;
BEGIN
  -- First, count UNCLAIMED providers at each stage
  -- (providers without a business_profile with account_id)
  SELECT
    COUNT(*),
    COALESCE(SUM(CASE WHEN pot.stage IS NULL OR pot.stage = 'not_contacted' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pot.stage = 'in_sequence' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pot.stage = 'needs_call' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pot.stage = 'called' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pot.stage = 'archived' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN pot.stage = 'hidden' THEN 1 ELSE 0 END), 0)
  INTO v_unclaimed_total, v_not_contacted, v_in_sequence, v_needs_call, v_called, v_archived, v_hidden
  FROM "olera-providers" op
  LEFT JOIN provider_outreach_tracking pot ON pot.provider_id = op.provider_id
  WHERE op.state = target_state_code
    AND op.deleted IS NOT TRUE
    AND NOT EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.source_provider_id = op.provider_id
        AND bp.account_id IS NOT NULL
    );

  -- Second, count CLAIMED providers (business_profile with account_id exists)
  SELECT COUNT(*)
  INTO v_claimed
  FROM "olera-providers" op
  WHERE op.state = target_state_code
    AND op.deleted IS NOT TRUE
    AND EXISTS (
      SELECT 1 FROM business_profiles bp
      WHERE bp.source_provider_id = op.provider_id
        AND bp.account_id IS NOT NULL
    );

  -- Total = unclaimed + claimed
  v_total := v_unclaimed_total + v_claimed;

  -- Update the state row (only if it exists)
  UPDATE provider_outreach_states
  SET
    total_providers = v_total,
    not_contacted = v_not_contacted,
    in_sequence = v_in_sequence,
    needs_call = v_needs_call,
    called = v_called,
    claimed = v_claimed,
    archived = v_archived,
    hidden = v_hidden,
    stats_refreshed_at = now()
  WHERE state_code = target_state_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
