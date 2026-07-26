-- Migration: Add touchpoint logging to auto-claim detection
--
-- Context: The auto-claim trigger (migration 133) updates provider_outreach_tracking
-- when a provider claims their account, but doesn't log a touchpoint. This creates
-- inconsistency in the audit trail - manual stage changes log touchpoints, but
-- auto-detected claims don't.
--
-- This migration updates the trigger function to also insert a touchpoint record
-- when an auto-claim is detected.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ============================================================================
-- Update the auto-claim detection function to log touchpoints
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_provider_outreach_on_claim()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_id TEXT;
  v_old_stage TEXT;
  v_did_update BOOLEAN := FALSE;
BEGIN
  -- Only trigger when account_id transitions from NULL to non-NULL
  -- This is the moment a provider claims their account
  IF OLD.account_id IS NULL AND NEW.account_id IS NOT NULL THEN
    -- Get the source_provider_id (link to olera-providers)
    v_provider_id := NEW.source_provider_id;

    -- If we have a source_provider_id, update or create tracking
    IF v_provider_id IS NOT NULL THEN
      -- Check if tracking record exists and get current stage
      SELECT stage INTO v_old_stage
      FROM provider_outreach_tracking
      WHERE provider_id = v_provider_id
        AND stage != 'claimed';

      -- Try to update existing tracking row
      UPDATE provider_outreach_tracking
      SET
        stage = 'claimed',
        stage_changed_at = now(),
        claimed_at = now()
      WHERE provider_id = v_provider_id
        AND stage != 'claimed';

      IF FOUND THEN
        v_did_update := TRUE;
      ELSE
        -- If no row was updated (provider wasn't in tracking), create one
        -- This handles providers who claimed without ever being in outreach
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

        -- Check if INSERT actually inserted/updated anything
        IF FOUND THEN
          v_did_update := TRUE;
          v_old_stage := NULL; -- No previous stage for new records
        END IF;
      END IF;

      -- Only log touchpoint if we actually updated or inserted a tracking record
      IF v_did_update THEN
        INSERT INTO provider_outreach_touchpoints (
          provider_id,
          touchpoint_type,
          details,
          admin_user_id,
          created_at
        ) VALUES (
          v_provider_id,
          'stage_changed',
          jsonb_build_object(
            'old_stage', COALESCE(v_old_stage, 'none'),
            'new_stage', 'claimed',
            'auto_detected', true,
            'trigger', 'business_profile_claim',
            'business_profile_id', NEW.id,
            'account_id', NEW.account_id
          ),
          NULL,  -- No admin for system action
          now()
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The triggers themselves (trigger_sync_provider_outreach_on_claim and
-- trigger_sync_provider_outreach_on_claim_insert) were created in migration 133
-- and don't need to be recreated - they will automatically use the updated function.
