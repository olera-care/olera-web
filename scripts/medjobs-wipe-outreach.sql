-- ===========================================================================
-- Wipe the MedJobs outreach system back to empty
-- ===========================================================================
-- DESTRUCTIVE. Removes every campus and everything hanging off it: channels,
-- channel records, outreach rows, their contacts, tasks, touchpoints and
-- approvals, and all site tasks. There is no undo.
--
-- WHAT IT DOES NOT TOUCH, so you can tell me to widen it:
--   · student applicants and their profiles
--   · provider business profiles
--   · anything outside the campus / outreach tables
--
-- ── How to use ─────────────────────────────────────────────────────────
-- Run it once as-is. It counts what it WOULD delete, prints that, and then
-- raises an exception so the whole thing rolls back — nothing is removed.
--
-- When the counts look right, change ONE line:
--
--     v_apply BOOLEAN := FALSE;      →      v_apply BOOLEAN := TRUE;
--
-- and run it again. That run commits.
--
-- The rehearsal guarantees a rollback by failing on purpose, because the
-- Supabase SQL editor does not hold a transaction across statements — a
-- BEGIN/ROLLBACK wrapper there would be theatre.
-- ===========================================================================

DO $$
DECLARE
  v_apply BOOLEAN := FALSE;   -- ← the only line to change

  n_campuses   INT;
  n_channels   INT;
  n_records    INT;
  n_outreach   INT;
  n_contacts   INT;
  n_tasks      INT;
  n_touch      INT;
  n_approvals  INT;
  n_site       INT;
  report       TEXT;
BEGIN
  SELECT count(*) INTO n_campuses  FROM student_outreach_campuses;
  SELECT count(*) INTO n_channels  FROM campus_channels;
  SELECT count(*) INTO n_records   FROM campus_channel_records;
  SELECT count(*) INTO n_outreach  FROM student_outreach;
  SELECT count(*) INTO n_contacts  FROM student_outreach_contacts;
  SELECT count(*) INTO n_tasks     FROM student_outreach_tasks;
  SELECT count(*) INTO n_touch     FROM student_outreach_touchpoints;
  SELECT count(*) INTO n_approvals FROM student_outreach_approvals;
  SELECT count(*) INTO n_site      FROM site_tasks;

  report := format(
    E'\n  universities        %s\n  channels            %s\n  channel records     %s'
     '\n  outreach records    %s\n  contacts            %s\n  outreach tasks      %s'
     '\n  touchpoints         %s\n  approvals           %s\n  site tasks          %s\n',
    n_campuses, n_channels, n_records, n_outreach,
    n_contacts, n_tasks, n_touch, n_approvals, n_site);

  IF NOT v_apply THEN
    RAISE EXCEPTION E'REHEARSAL — nothing deleted. This is what would go:\n%\nSet v_apply := TRUE and run again to delete it.', report;
  END IF;

  -- ── the delete, children first ───────────────────────────────────────
  -- Touchpoints are append-only, so the guard comes off for this block.
  ALTER TABLE student_outreach_touchpoints DISABLE TRIGGER student_outreach_touchpoints_no_mutate;

  -- site_tasks.record_id cascades from campus_channel_records, which is how
  -- a previous purge silently took site tasks with it. Site tasks go first
  -- so the count above matches what actually happens.
  DELETE FROM site_tasks;
  DELETE FROM campus_channel_records;
  DELETE FROM campus_channels;

  DELETE FROM student_outreach_touchpoints;
  DELETE FROM student_outreach_approvals;
  DELETE FROM student_outreach_tasks;
  DELETE FROM student_outreach_contacts;

  -- student_outreach points at itself three ways. Break those links before
  -- deleting, or the rows guard each other.
  UPDATE student_outreach
     SET permission_dependency_id = NULL,
         redirected_to_id         = NULL,
         referred_from_id         = NULL;
  DELETE FROM student_outreach;

  DELETE FROM student_outreach_campuses;

  ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;

  RAISE NOTICE E'Deleted:%', report;

EXCEPTION WHEN OTHERS THEN
  -- Never leave the append-only guard off, even on the rehearsal's
  -- deliberate failure.
  BEGIN
    ALTER TABLE student_outreach_touchpoints ENABLE TRIGGER student_outreach_touchpoints_no_mutate;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  RAISE;
END $$;
