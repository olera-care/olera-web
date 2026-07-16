-- Migration: Auto-claim detection trigger for provider outreach
--
-- Context: When a provider claims their account (business_profiles.account_id
-- becomes non-null), automatically update provider_outreach_tracking to mark
-- them as claimed. This ensures the outreach funnel accurately reflects claims
-- regardless of how the provider claimed (cold email, question notification,
-- lead notification, organic, etc.).
--
-- Apply via Supabase dashboard (NOT CLI).

-- ============================================================================
-- 1. Function to detect claims and update outreach tracking
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_provider_outreach_on_claim()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_id TEXT;
BEGIN
  -- Only trigger when account_id transitions from NULL to non-NULL
  -- This is the moment a provider claims their account
  IF OLD.account_id IS NULL AND NEW.account_id IS NOT NULL THEN
    -- Get the source_provider_id (link to olera-providers)
    v_provider_id := NEW.source_provider_id;

    -- If we have a source_provider_id, update or create tracking
    IF v_provider_id IS NOT NULL THEN
      -- Try to update existing tracking row
      UPDATE provider_outreach_tracking
      SET
        stage = 'claimed',
        stage_changed_at = now(),
        claimed_at = now()
      WHERE provider_id = v_provider_id
        AND stage != 'claimed';  -- Don't update if already claimed

      -- If no row was updated (provider wasn't in tracking), create one
      -- This handles providers who claimed without ever being in outreach
      IF NOT FOUND THEN
        INSERT INTO provider_outreach_tracking (
          provider_id,
          stage,
          city,
          state,
          stage_changed_at,
          claimed_at,
          notes
        )
        SELECT
          v_provider_id,
          'claimed',
          p.city,
          p.state,
          now(),
          now(),
          'Auto-detected claim (not from outreach sequence)'
        FROM "olera-providers" p
        WHERE p.provider_id = v_provider_id
        ON CONFLICT (provider_id) DO UPDATE
          SET
            stage = 'claimed',
            stage_changed_at = now(),
            claimed_at = now();
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. Trigger on business_profiles for claim detection
-- ============================================================================

-- Drop if exists (safe re-run)
DROP TRIGGER IF EXISTS trigger_sync_provider_outreach_on_claim ON business_profiles;

CREATE TRIGGER trigger_sync_provider_outreach_on_claim
  AFTER UPDATE ON business_profiles
  FOR EACH ROW
  WHEN (OLD.account_id IS NULL AND NEW.account_id IS NOT NULL)
  EXECUTE FUNCTION sync_provider_outreach_on_claim();

-- Also trigger on INSERT with account_id already set (rare, but possible)
DROP TRIGGER IF EXISTS trigger_sync_provider_outreach_on_claim_insert ON business_profiles;

CREATE TRIGGER trigger_sync_provider_outreach_on_claim_insert
  AFTER INSERT ON business_profiles
  FOR EACH ROW
  WHEN (NEW.account_id IS NOT NULL AND NEW.source_provider_id IS NOT NULL)
  EXECUTE FUNCTION sync_provider_outreach_on_claim();
