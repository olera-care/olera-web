-- ===========================================================================
-- 234 — medjobs_excluded_records
-- ===========================================================================
-- What an admin deleted from the MedJobs board, and why.
--
-- Deleting a provider record is not enough on its own. The catchment
-- populate skips a provider only when a record for it already exists on
-- that campus, so a hard delete is undone the next time the populate runs
-- and the same junk comes back. This table is the memory that stops that.
--
-- Archiving needs no entry here: an archived record still exists, so the
-- populate already skips it. This is only for records that were destroyed.
--
-- Keyed by campus and the directory provider it pointed at. A record with
-- no directory provider behind it (an advisor, or a row created from the
-- spreadsheet) cannot come back from the populate, so it is recorded for
-- the audit trail with a null provider and nothing depends on it.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS medjobs_excluded_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id         UUID NOT NULL REFERENCES student_outreach_campuses(id) ON DELETE CASCADE,
  -- olera-providers.provider_id, when the deleted record pointed at one.
  olera_provider_id TEXT,
  organization_name TEXT NOT NULL,
  kind              TEXT NOT NULL,
  reason            TEXT,
  -- Everything the record held, kept verbatim so a delete can be explained
  -- or undone by hand. Includes the call history.
  snapshot          JSONB NOT NULL DEFAULT '{}',
  deleted_by        UUID,
  deleted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The lookup the populate does: has this provider been removed from this
-- campus before?
CREATE UNIQUE INDEX IF NOT EXISTS idx_medjobs_excluded_campus_provider
  ON medjobs_excluded_records (campus_id, olera_provider_id)
  WHERE olera_provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_medjobs_excluded_campus
  ON medjobs_excluded_records (campus_id);

ALTER TABLE medjobs_excluded_records ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE medjobs_excluded_records IS
  'Records an admin deleted from the MedJobs board. The catchment populate '
  'checks this so a deleted provider is not recreated on the next run. '
  'Archived records need no entry: they still exist and are skipped anyway.';

-- ===========================================================================
-- medjobs_purge_touchpoints
-- ===========================================================================
-- student_outreach_touchpoints is append-only, guarded by a trigger that
-- raises on UPDATE or DELETE. The guard fires on a cascade delete too, so
-- destroying an outreach record fails while any touchpoint hangs off it.
--
-- Rather than let the API disable a global trigger — which would apply to
-- every other session for as long as it was off — deleting goes through
-- this function. It is SECURITY DEFINER and turns the guard off only for
-- the rows belonging to one record, inside one transaction, and turns it
-- back on in an EXCEPTION block so a failure cannot leave it off.
-- ===========================================================================

CREATE OR REPLACE FUNCTION medjobs_purge_touchpoints(p_outreach_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  n INT := 0;
BEGIN
  ALTER TABLE student_outreach_touchpoints
    DISABLE TRIGGER student_outreach_touchpoints_no_mutate;

  DELETE FROM student_outreach_touchpoints WHERE outreach_id = p_outreach_id;
  GET DIAGNOSTICS n = ROW_COUNT;

  ALTER TABLE student_outreach_touchpoints
    ENABLE TRIGGER student_outreach_touchpoints_no_mutate;

  RETURN n;
EXCEPTION WHEN OTHERS THEN
  ALTER TABLE student_outreach_touchpoints
    ENABLE TRIGGER student_outreach_touchpoints_no_mutate;
  RAISE;
END;
$fn$;

REVOKE ALL ON FUNCTION medjobs_purge_touchpoints(UUID) FROM PUBLIC;

COMMENT ON FUNCTION medjobs_purge_touchpoints(UUID) IS
  'Removes the touchpoints of one outreach record so it can be deleted. '
  'Disables the append-only guard for the length of one transaction and '
  'restores it even on failure. Used only by the MedJobs delete action.';
