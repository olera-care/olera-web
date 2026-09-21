-- ===========================================================================
-- 235 — a provider record typed in by hand
-- ===========================================================================
-- The Tasks board can now start a provider from scratch: an agency somebody
-- heard about on a call that the Olera directory has never carried.
--
-- Migration 074 requires every kind = provider row to point at an underlying
-- provider, either through the legacy provider_business_profile_id FK or
-- through research_data.olera_provider_id. A hand-typed record has neither,
-- so the insert was rejected at the database.
--
-- This adds a third accepted form: a record that says outright it was typed
-- in, with research_data.manual_entry = true. The constraint still refuses a
-- provider row that claims nothing at all, which is the point of it — the
-- rule being enforced is that a provider row must say where it came from,
-- not that the directory must have seen it first.
--
-- Note for the catchment populate: a manual record has no olera_provider_id,
-- so it can never collide with a directory provider and the populate will
-- neither skip it nor duplicate it. It simply sits alongside them.
--
-- Apply via the Supabase dashboard (NOT the CLI), per project convention.
-- Re-running is safe: DROP CONSTRAINT IF EXISTS, then ADD.
-- ===========================================================================

-- Guard: stop before the ALTER if some row would fail the new constraint.
-- A widening should never fail halfway, but a row that fails here means the
-- table already holds something neither version accepts, and that is worth
-- seeing rather than guessing at.
DO $$
DECLARE bad INT;
BEGIN
  SELECT count(*) INTO bad
    FROM student_outreach
   WHERE kind = 'provider'
     AND provider_business_profile_id IS NULL
     AND research_data->>'olera_provider_id' IS NULL
     AND research_data->>'manual_entry' IS DISTINCT FROM 'true';
  IF bad > 0 THEN
    RAISE EXCEPTION
      'student_outreach holds % provider row(s) with no provider reference at all', bad;
  END IF;
END $$;

ALTER TABLE student_outreach
  DROP CONSTRAINT IF EXISTS student_outreach_kind_provider_link_check;

ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_kind_provider_link_check
    CHECK (
      (kind = 'provider' AND (
        provider_business_profile_id IS NOT NULL
        OR research_data->>'olera_provider_id' IS NOT NULL
        OR research_data->>'manual_entry' = 'true'
      ))
      OR
      (kind <> 'provider' AND provider_business_profile_id IS NULL)
    );

COMMENT ON CONSTRAINT student_outreach_kind_provider_link_check ON student_outreach IS
  'Provider rows must say where they came from: the legacy '
  'provider_business_profile_id FK, research_data.olera_provider_id set by '
  'the catchment populate, or research_data.manual_entry = true for a record '
  'an admin typed in on the Tasks board. Stakeholder rows must have NULL '
  'provider_business_profile_id.';

-- The board reads manual records on every load; there are few of them and
-- the index keeps that a lookup rather than a scan of the whole table.
CREATE INDEX IF NOT EXISTS idx_so_manual_providers
  ON student_outreach (campus_id)
  WHERE kind = 'provider' AND research_data->>'manual_entry' = 'true';
