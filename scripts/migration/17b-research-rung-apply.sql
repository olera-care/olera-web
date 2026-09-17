-- ===========================================================================
-- Step 5b -- insert the Research rung, and credit the Arizona pass. WRITES.
-- ===========================================================================
-- Run 17a-research-rung-rehearsal.sql first and read the numbers. That file
-- carries the explanation of what this does and why. Run 17c afterwards to
-- see that it landed.
--
-- ONE statement, on purpose. This has now failed in the Supabase SQL editor
-- three ways:
--
--   as a procedural block   the editor lost track of the dollar quoting and
--                           cut the body short, twice, in different places
--   as five statements      the editor ran one of the five and reported
--                           success, having written nothing
--
-- A single statement cannot be half-run, cannot be split, and needs no
-- transaction wrapper: Postgres already makes one statement all-or-nothing.
-- Keep it one statement.
--
-- The reason this works as one statement rather than five is that every
-- branch below reads the same snapshot -- the state before any of it ran.
-- Postgres guarantees that for data-modifying CTEs, so "already in outreach"
-- means what it meant at the start even though the first branch is busy
-- changing the very rows that decide it.
--
-- Safe to run twice: the working set skips anything already stamped, and the
-- stamp goes on in the same statement.
--
-- It returns one row of counts, which is the report.
-- ===========================================================================

WITH todo AS (
  SELECT so.id,
         so.campus_id,
         so.status,
         so.last_edited_at,
         -- Worked means a task has been completed, or a task sits past the
         -- first rung. Either is enough: both mean the stored step numbers
         -- describe the old ladder and have to move.
         EXISTS (SELECT 1 FROM student_outreach_tasks t
                  WHERE t.outreach_id = so.id
                    AND (t.status = 'completed'
                         OR COALESCE((t.payload->>'step')::INT, 0) > 0)) AS in_flight
    FROM student_outreach so
   WHERE so.kind = 'provider'
     AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM 'research-rung-v1'
),

asu AS (
  SELECT id FROM student_outreach_campuses WHERE slug = 'arizona-state'
),

-- The date the pass happened, for the Arizona records that were read and
-- needed no correction. Those carry no edit stamp of their own.
pass AS (
  SELECT COALESCE(max(so.last_edited_at), now()) AS at
    FROM student_outreach so
   WHERE so.campus_id = (SELECT id FROM asu)
     AND so.kind = 'provider'
),

-- 1. Move the records already in outreach up one rung, so their history
--    keeps pointing at the rung it describes.
shifted AS (
  UPDATE student_outreach_tasks t
     SET payload = jsonb_set(
           COALESCE(t.payload, '{}'::jsonb),
           '{step}',
           to_jsonb(COALESCE((t.payload->>'step')::INT, 0) + 1))
   WHERE t.outreach_id IN (SELECT id FROM todo WHERE in_flight)
  RETURNING t.id
),

-- 2. Arizona, untouched records: the pending step 0 task IS the Research
--    rung, so closing it is the whole of the credit.
credited AS (
  UPDATE student_outreach_tasks t
     SET status       = 'completed',
         task_type    = 'research_initial',
         completed_at = COALESCE(q.last_edited_at, (SELECT at FROM pass)),
         notes        = COALESCE(t.notes,
                          'Reviewed in the Arizona pass, before this rung existed.')
    FROM todo q
   WHERE q.id = t.outreach_id
     AND NOT q.in_flight
     AND q.campus_id = (SELECT id FROM asu)
     AND q.status <> 'archived'
     AND t.status = 'pending'
     AND COALESCE((t.payload->>'step')::INT, 0) = 0
  RETURNING t.outreach_id
),

-- 3. Arizona, records already in outreach: branch 1 moved their tasks up, so
--    step 0 is free. Write the Research rung in as completed.
written AS (
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, completed_at, payload, notes)
  SELECT q.id,
         'research_initial',
         'completed',
         COALESCE(q.last_edited_at, (SELECT at FROM pass))::date,
         COALESCE(q.last_edited_at, (SELECT at FROM pass)),
         '{"step":0,"round":0}'::jsonb,
         'Reviewed in the Arizona pass, before this rung existed.'
    FROM todo q
   WHERE q.in_flight
     AND q.campus_id = (SELECT id FROM asu)
     AND q.status <> 'archived'
  RETURNING outreach_id
),

-- 4. Arizona: queue the call behind it, for every record that will be left
--    with nothing to do. An untouched record always will be -- branch 2 just
--    closed its only task. A record mid-outreach will only if it had nothing
--    waiting already.
queued AS (
  INSERT INTO student_outreach_tasks
    (outreach_id, task_type, status, due_at, payload)
  SELECT q.id, 'outreach_contact', 'pending', CURRENT_DATE, '{"step":1,"round":0}'::jsonb
    FROM todo q
   WHERE q.campus_id = (SELECT id FROM asu)
     AND q.status <> 'archived'
     AND (NOT q.in_flight
          OR NOT EXISTS (SELECT 1 FROM student_outreach_tasks x
                          WHERE x.outreach_id = q.id
                            AND x.status = 'pending'))
  RETURNING outreach_id
),

-- 5. Stamp every record this run covered, so a second run finds nothing.
stamped AS (
  UPDATE student_outreach so
     SET research_data = COALESCE(so.research_data, '{}'::jsonb)
           || jsonb_build_object('research_rung_migrated', 'research-rung-v1')
   WHERE so.id IN (SELECT id FROM todo)
  RETURNING so.id
)

SELECT (SELECT count(*) FROM stamped)  AS providers_migrated,
       (SELECT count(*) FROM shifted)  AS tasks_moved_up,
       (SELECT count(*) FROM credited) AS arizona_rungs_closed,
       (SELECT count(*) FROM written)  AS arizona_rungs_written,
       (SELECT count(*) FROM queued)   AS arizona_calls_queued;
