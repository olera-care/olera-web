-- ===========================================================================
-- Step 5 — insert the Research rung, and credit the Arizona pass
-- ===========================================================================
-- WRITES. Read the rehearsal switch below before running.
--
-- The providers ladder gained a rung in front of every other one:
--
--     0  Research                        <- new
--     1  Call to confirm the right contact   (was 0, and was named
--                                             "Call to get the right email")
--     2  Send the program info               (was 1)
--     3  Follow ups 1-7                      (was 2)
--     ...
--
-- Task rows carry their rung as payload.step, so the numbers stored in the
-- database have to move with the ladder or every record would read as being
-- one rung further along than it is.
--
-- Three groups, treated differently on purpose.
--
--   Untouched records. Nobody has called them; their one pending task sits
--   at step 0. Nothing is written: step 0 now means Research, which is
--   exactly the first thing to do to a record nobody has looked at.
--
--   Records already in outreach. Gracie called these, and the history that
--   came off her spreadsheet is against specific rungs. Every task moves up
--   one so the history keeps pointing at the rung it actually describes.
--   They get no Research task: you do not research a provider you are three
--   follow-ups deep with.
--
--   Arizona State. Every provider on that board was reviewed by hand in
--   September - names, websites and addresses corrected, 66 of them archived
--   as too far. That is the Research rung, done before it existed. Each one
--   is marked complete, dated from the record last_edited_at stamp where
--   there is one and from the date of the pass where the record was read and
--   left alone, and the call is queued behind it.
--
-- Archived records are left off the Arizona credit: they are not on the
-- board, so a completed rung on them would be bookkeeping nobody reads. The
-- renumber still covers them, so reviving one lands it on the right rung.
--
-- ── A NOTE ON THE SUPABASE SQL EDITOR ─────────────────────────────────
-- The dashboard scans pasted SQL for tables it believes are being made, and
-- appends a row-level-security statement for each one it finds. Its parser
-- does not understand that it is reading inside a DO block, so the first
-- version of this script had those statements spliced into the middle of the
-- dollar-quoted body, and the whole thing failed with
--
--   ERROR: 42601: unterminated dollar-quoted string
--
-- Two things set it off: a temporary working table, and a count assigned by
-- putting two totals INTO two variables, which it read as making a table
-- named after the first variable. Nothing executed - the statement never
-- parsed - but nothing useful happened either.
--
-- The rewrite gives that scan nothing to find. The working set is held as
-- two arrays of ids, and every total is assigned with := instead. Keep it
-- that way, and keep those two spellings out of this file entirely, comments
-- included: a scanner naive enough to splice inside a DO block is naive
-- enough to match a keyword in a comment.
--
-- ── REHEARSAL ─────────────────────────────────────────────────────────
-- v_apply is FALSE below. As shipped this counts what it would change,
-- raises the totals on the exception, and rolls the whole thing back.
-- Change the one line to TRUE to commit.
-- ===========================================================================

DO $$
DECLARE
  v_apply     BOOLEAN := FALSE;      -- <<< the only line to change
  v_batch     TEXT    := 'research-rung-v1';
  v_slug      TEXT    := 'arizona-state';
  v_note      TEXT    := 'Reviewed in the Arizona pass, before this rung existed.';
  v_todo      UUID[];                -- every provider this run touches
  v_inflight  UUID[];                -- of those, the ones already in outreach
  v_asu       UUID;
  v_pass      TIMESTAMPTZ;
  v_shifted   INT := 0;
  v_research  INT := 0;
  v_calls     INT := 0;
  v_added     INT;
BEGIN

  -- ── 1. which providers this run covers, and which have been worked ───
  -- Held as two arrays of ids rather than a temp table, and every total is
  -- assigned rather than selected into. Both are deliberate: see the note
  -- on the Supabase SQL editor at the top of this file.
  --
  -- Every record this run touches is stamped at the end, and a stamped
  -- record is skipped. Without that a second run would read the rung it
  -- inserted the first time as history and shift everything again.
  v_todo := ARRAY(
    SELECT so.id
      FROM student_outreach so
     WHERE so.kind = 'provider'
       AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM v_batch);

  -- Worked means a task has been completed, or a task sits past the first
  -- rung. Either is enough: both mean the stored step numbers describe the
  -- old ladder and have to move.
  v_inflight := ARRAY(
    SELECT so.id
      FROM student_outreach so
     WHERE so.id = ANY(v_todo)
       AND EXISTS (SELECT 1 FROM student_outreach_tasks t
                    WHERE t.outreach_id = so.id
                      AND (t.status = 'completed'
                           OR COALESCE((t.payload->>'step')::INT, 0) > 0)));

  v_asu := (SELECT id FROM student_outreach_campuses WHERE slug = v_slug);
  IF v_asu IS NULL THEN
    RAISE EXCEPTION 'No campus with slug %', v_slug;
  END IF;

  -- The day the pass happened, for the records that were read and needed no
  -- correction. Those carry no edit stamp of their own.
  v_pass := COALESCE(
    (SELECT max(last_edited_at) FROM student_outreach
      WHERE campus_id = v_asu AND kind = 'provider'),
    now());

  -- ── 2. move the records already in outreach up one rung ──────────────
  UPDATE student_outreach_tasks t
     SET payload = jsonb_set(
           COALESCE(t.payload, '{}'::jsonb),
           '{step}',
           to_jsonb(COALESCE((t.payload->>'step')::INT, 0) + 1))
   WHERE t.outreach_id = ANY(v_inflight);
  GET DIAGNOSTICS v_shifted = ROW_COUNT;

  -- ── 3. Arizona State ─────────────────────────────────────────────────
  -- 3a. Untouched Arizona records: the pending step 0 task IS the Research
  --     rung, so closing it is the whole of the credit.
  UPDATE student_outreach_tasks t
     SET status       = 'completed',
         task_type    = 'research_initial',
         completed_at = COALESCE(so.last_edited_at, v_pass),
         notes        = COALESCE(t.notes, v_note)
    FROM student_outreach so
   WHERE so.id = t.outreach_id
     AND t.outreach_id = ANY(v_todo)
     AND NOT (t.outreach_id = ANY(v_inflight))
     AND so.campus_id = v_asu
     AND so.status <> 'archived'
     AND t.status = 'pending'
     AND COALESCE((t.payload->>'step')::INT, 0) = 0;
  GET DIAGNOSTICS v_research = ROW_COUNT;

  -- 3b. Arizona records already in outreach: their tasks just moved up, so
  --     step 0 is now empty. Write the Research rung in as completed.
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, completed_at, payload, notes)
  SELECT so.id,
         'research_initial',
         'completed',
         COALESCE(so.last_edited_at, v_pass)::date,
         COALESCE(so.last_edited_at, v_pass),
         '{"step":0,"round":0}'::jsonb,
         v_note
    FROM student_outreach so
   WHERE so.id = ANY(v_inflight)
     AND so.campus_id = v_asu
     AND so.status <> 'archived'
     AND NOT EXISTS (
       SELECT 1 FROM student_outreach_tasks t
        WHERE t.outreach_id = so.id
          AND COALESCE((t.payload->>'step')::INT, 0) = 0);
  GET DIAGNOSTICS v_added = ROW_COUNT;
  v_research := v_research + v_added;

  -- 3c. Queue the call behind it, for any Arizona record now left with
  --     nothing to do. A record still mid-outreach already has one.
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, payload)
  SELECT so.id, 'outreach_contact', 'pending', CURRENT_DATE, '{"step":1,"round":0}'::jsonb
    FROM student_outreach so
   WHERE so.id = ANY(v_todo)
     AND so.campus_id = v_asu
     AND so.status <> 'archived'
     AND NOT EXISTS (
       SELECT 1 FROM student_outreach_tasks t
        WHERE t.outreach_id = so.id AND t.status = 'pending');
  GET DIAGNOSTICS v_calls = ROW_COUNT;

  -- ── 4. stamp what was done, so a second run is a no-op ───────────────
  UPDATE student_outreach so
     SET research_data = jsonb_set(
           COALESCE(so.research_data, '{}'::jsonb),
           '{research_rung_migrated}',
           to_jsonb(v_batch))
   WHERE so.id = ANY(v_todo);

  -- ── the report ───────────────────────────────────────────────────────
  -- The Supabase SQL editor does not display RAISE NOTICE, so in rehearsal
  -- the totals ride on the exception, which it does display.
  IF NOT v_apply THEN
    RAISE EXCEPTION
      'REHEARSAL, nothing saved - untouched % · in outreach % · tasks moved up % · Arizona research rungs closed % · Arizona calls queued %. Set v_apply := TRUE to commit.',
      cardinality(v_todo) - cardinality(v_inflight), cardinality(v_inflight),
      v_shifted, v_research, v_calls;
  END IF;

  RAISE NOTICE 'Applied: % moved, % research, % calls', v_shifted, v_research, v_calls;
END $$;

-- After an apply, this reports the same thing from the database.
SELECT c.name                                                        AS campus,
       count(*)                                                      AS providers,
       count(*) FILTER (WHERE r.done_research)                       AS research_done,
       count(*) FILTER (WHERE r.open_research)                       AS research_open,
       count(*) FILTER (WHERE NOT r.done_research AND NOT r.open_research) AS no_research_rung
  FROM student_outreach so
  JOIN student_outreach_campuses c ON c.id = so.campus_id
  CROSS JOIN LATERAL (
    SELECT
      EXISTS (SELECT 1 FROM student_outreach_tasks t
               WHERE t.outreach_id = so.id
                 AND t.status = 'completed'
                 AND COALESCE((t.payload->>'step')::INT, 0) = 0) AS done_research,
      EXISTS (SELECT 1 FROM student_outreach_tasks t
               WHERE t.outreach_id = so.id
                 AND t.status = 'pending'
                 AND COALESCE((t.payload->>'step')::INT, 0) = 0) AS open_research
  ) r
 WHERE so.kind = 'provider'
   AND so.status <> 'archived'
 GROUP BY c.name
 ORDER BY c.name;
