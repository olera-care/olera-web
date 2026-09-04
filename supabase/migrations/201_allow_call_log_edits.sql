-- Migration: Allow call log edits and deletes
--
-- Context: The original provider_outreach_touchpoints table is append-only
-- for audit integrity. However, call logs (touchpoint_type = 'call_attempted')
-- need to be editable and deletable since admins may:
--   - Log the wrong status (e.g., "voicemail" instead of "spoke_with")
--   - Make typos in notes
--   - Log a call by mistake and need to delete it
--
-- This migration modifies the trigger to allow UPDATE/DELETE only for
-- call_attempted touchpoints. All other touchpoint types remain immutable.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

-- ── Replace the append-only function to allow call_attempted edits ──────────

CREATE OR REPLACE FUNCTION provider_outreach_touchpoints_append_only()
  RETURNS TRIGGER AS $$
BEGIN
  -- Allow UPDATE and DELETE for call_attempted touchpoints only
  IF OLD.touchpoint_type = 'call_attempted' THEN
    -- DELETE requires returning OLD, UPDATE requires returning NEW
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  -- Block UPDATE/DELETE for all other touchpoint types (audit integrity)
  RAISE EXCEPTION 'provider_outreach_touchpoints is append-only for % (% blocked)', OLD.touchpoint_type, TG_OP;
END;
$$ LANGUAGE plpgsql;

-- Note: The existing trigger (provider_outreach_touchpoints_no_mutate) already
-- calls this function, so we don't need to recreate it. Just replacing the
-- function definition is sufficient.
