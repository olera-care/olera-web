-- ===========================================================================
-- MedJobs site purge — removes all outreach data for non-focus sites
-- ===========================================================================
-- Run scripts/medjobs-site-purge-preflight.sql FIRST and read its query 1
-- output, which names every site this will empty.
--
-- HOW TO RUN IT
--   1. Paste this whole file into the Supabase SQL editor and run it.
--      As shipped it is a REHEARSAL: it performs every delete, reports what
--      it did, then rolls the whole thing back. Nothing changes.
--   2. Read the report in the error panel. That is the rehearsal's output,
--      not a failure — it says "REHEARSAL COMPLETE".
--   3. To apply for real, change ONE line below — v_apply := FALSE  →  TRUE
--      — and run it again.
--
-- WHY IT IS ONE BIG DO BLOCK
--   The Supabase SQL editor does not reliably keep one transaction across
--   several statements, so a script of separate statements wrapped in
--   BEGIN/ROLLBACK is not actually protected, and temp tables created in one
--   statement are not visible to the next. A single DO block is one
--   statement: it either all happens or none of it does, on any client.
--
-- WHAT IT DELETES, for every site that is NOT one of the five keepers:
--   provider partner rows and university org/advisor/professor rows,
--   their contacts, touchpoints (calls, emails, meetings), approvals and
--   tasks, plus the site's own site_tasks, campus_channels and channel
--   records.
--
-- WHAT IT LEAVES ALONE:
--   the campus row itself — deactivated (is_active = false), not deleted,
--     so this is reversible. See v_delete_campus_rows.
--   business_profiles — provider directory listings and student profiles
--     are shared records, not site data.
--   business_profile_tasks — candidate and client tasks are not campus-
--     scoped and survive. Handle separately if you want them gone.
-- ===========================================================================

DO $$
DECLARE
  -- ⬇⬇ THE ONLY LINE YOU CHANGE. FALSE = rehearsal. TRUE = apply for real.
  v_apply              BOOLEAN := FALSE;

  -- Also delete the campus rows outright instead of just deactivating them.
  -- Leave FALSE unless you are certain: this is the one step that cannot be
  -- undone by flipping is_active back on.
  v_delete_campus_rows BOOLEAN := FALSE;

  -- The five sites MedJobs is focusing on. Everything else is a target.
  -- Matched case-insensitively on trimmed name.
  v_keep TEXT[] := ARRAY[
    'Arizona State University',
    'Florida State University',
    'Indiana University Bloomington',
    'University of Utah',
    'University of Wisconsin-Madison'
  ];

  v_missing  TEXT;
  v_targets  TEXT;
  v_n_target INT;
  n_recs INT; n_chan INT; n_stask INT; n_task INT;
  n_appr INT; n_tp INT; n_cont INT; n_out INT; n_camp INT;
  v_report TEXT;
BEGIN
  -- ── Guard: every keeper must resolve, or we stop before touching data ──
  SELECT string_agg(k, ', ') INTO v_missing
    FROM unnest(v_keep) AS k
   WHERE NOT EXISTS (
     SELECT 1 FROM student_outreach_campuses c
      WHERE lower(btrim(c.name)) = lower(btrim(k))
   );
  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION
      'ABORTED, nothing deleted. These focus sites match no university in the database: %. Fix the spelling in v_keep.',
      v_missing;
  END IF;

  -- ── Name the targets up front, for the report ──────────────────────────
  SELECT count(*), string_agg(c.name, E'\n    ' ORDER BY c.name)
    INTO v_n_target, v_targets
    FROM student_outreach_campuses c
   WHERE NOT EXISTS (
     SELECT 1 FROM unnest(v_keep) AS k
      WHERE lower(btrim(k)) = lower(btrim(c.name))
   );

  IF v_n_target = 0 THEN
    RAISE EXCEPTION 'Nothing to do: every site in the database is already a keeper.';
  END IF;

  -- ── Touchpoints are append-only; the trigger must come off to delete ───
  -- Inside this block, so a rollback restores it with everything else.
  ALTER TABLE student_outreach_touchpoints
    DISABLE TRIGGER student_outreach_touchpoints_no_mutate;

  -- ── Deletes, children first. No temp tables: each statement re-derives
  --    the target set from v_keep, so there is no state to go stale. ──────

  -- site_tasks first: its record_id FK to campus_channel_records is
  -- ON DELETE CASCADE, so deleting the records first would take bound
  -- site to-dos with them and this count would under-report.
  DELETE FROM site_tasks st
   USING student_outreach_campuses c
   WHERE c.id = st.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_stask = ROW_COUNT;

  DELETE FROM campus_channel_records r
   USING campus_channels ch, student_outreach_campuses c
   WHERE ch.id = r.channel_id AND c.id = ch.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_recs = ROW_COUNT;

  DELETE FROM campus_channels ch
   USING student_outreach_campuses c
   WHERE c.id = ch.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_chan = ROW_COUNT;


  DELETE FROM student_outreach_tasks t
   USING student_outreach so, student_outreach_campuses c
   WHERE so.id = t.outreach_id AND c.id = so.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_task = ROW_COUNT;

  DELETE FROM student_outreach_approvals a
   USING student_outreach so, student_outreach_campuses c
   WHERE so.id = a.outreach_id AND c.id = so.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_appr = ROW_COUNT;

  DELETE FROM student_outreach_touchpoints tp
   USING student_outreach so, student_outreach_campuses c
   WHERE so.id = tp.outreach_id AND c.id = so.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_tp = ROW_COUNT;

  DELETE FROM student_outreach_contacts ct
   USING student_outreach so, student_outreach_campuses c
   WHERE so.id = ct.outreach_id AND c.id = so.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_cont = ROW_COUNT;

  -- Parent last: campus_id is ON DELETE RESTRICT. The self-referencing FKs
  -- (permission_dependency_id / redirected_to_id / referred_from_id) are
  -- ON DELETE SET NULL, so pointers from kept rows simply go null.
  DELETE FROM student_outreach so
   USING student_outreach_campuses c
   WHERE c.id = so.campus_id
     AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                      WHERE lower(btrim(k)) = lower(btrim(c.name)));
  GET DIAGNOSTICS n_out = ROW_COUNT;

  ALTER TABLE student_outreach_touchpoints
    ENABLE TRIGGER student_outreach_touchpoints_no_mutate;

  -- ── Retire the emptied sites ───────────────────────────────────────────
  IF v_delete_campus_rows THEN
    DELETE FROM student_outreach_campuses c
     WHERE NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                        WHERE lower(btrim(k)) = lower(btrim(c.name)));
    GET DIAGNOSTICS n_camp = ROW_COUNT;
  ELSE
    UPDATE student_outreach_campuses c
       SET is_active = FALSE, updated_at = NOW()
     WHERE c.is_active
       AND NOT EXISTS (SELECT 1 FROM unnest(v_keep) k
                        WHERE lower(btrim(k)) = lower(btrim(c.name)));
    GET DIAGNOSTICS n_camp = ROW_COUNT;
  END IF;

  -- ── Report ─────────────────────────────────────────────────────────────
  v_report := format(
    E'\n  Sites emptied (%s):\n    %s\n'
    || E'\n  Rows removed:'
    || E'\n    provider partner + university org rows ... %s'
    || E'\n    calls / emails / meetings (touchpoints) . %s'
    || E'\n    follow-up tasks ......................... %s'
    || E'\n    approval requests ....................... %s'
    || E'\n    contacts ................................ %s'
    || E'\n    site to-dos ............................. %s'
    || E'\n    activation channels ..................... %s'
    || E'\n    activation channel records .............. %s'
    || E'\n    campus rows %s ... %s\n',
    v_n_target, v_targets,
    n_out, n_tp, n_task, n_appr, n_cont, n_stask, n_chan, n_recs,
    CASE WHEN v_delete_campus_rows THEN 'deleted     ' ELSE 'deactivated ' END, n_camp);

  IF v_apply THEN
    RAISE NOTICE '%', E'\nPURGE APPLIED.' || v_report;
  ELSE
    -- Raising rolls the whole block back. The message is the report.
    RAISE EXCEPTION E'REHEARSAL COMPLETE — nothing was changed.\n%\n  To apply this for real, set  v_apply := TRUE  and run again.', v_report;
  END IF;
END $$;
