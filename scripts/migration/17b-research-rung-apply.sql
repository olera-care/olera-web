-- ===========================================================================
-- Step 5b -- insert the Research rung, and credit the Arizona pass. WRITES.
-- ===========================================================================
-- Run 17a-research-rung-rehearsal.sql first and read the numbers. That file
-- also carries the explanation of what this does and why; this one is the
-- five statements that do it.
--
-- Safe to run twice. Every statement skips a record already carrying the
-- batch stamp, and the stamp is written last, inside the same transaction --
-- so either the whole thing lands and the records are stamped, or nothing
-- lands and nothing is stamped. There is no half-migrated state to reason
-- about, and a second run finds nothing to do.
--
-- Read the note on the Supabase SQL editor at the foot of 17a before
-- reaching for a procedural block here. It cannot run one.
-- ===========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Move the records already in outreach up one rung.
-- ---------------------------------------------------------------------------
-- The subquery reads the task table this statement is writing to. Postgres
-- gives it the snapshot from before the update, so "sits past the first rung"
-- means what it meant when the statement started.
UPDATE student_outreach_tasks t
   SET payload = jsonb_set(
         COALESCE(t.payload, '{}'::jsonb),
         '{step}',
         to_jsonb(COALESCE((t.payload->>'step')::INT, 0) + 1))
  FROM student_outreach so
 WHERE so.id = t.outreach_id
   AND so.kind = 'provider'
   AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM 'research-rung-v1'
   AND EXISTS (SELECT 1 FROM student_outreach_tasks x
                WHERE x.outreach_id = so.id
                  AND (x.status = 'completed'
                       OR COALESCE((x.payload->>'step')::INT, 0) > 0));

-- ---------------------------------------------------------------------------
-- 2. Arizona, untouched records: the pending step 0 task IS the Research
--    rung, so closing it is the whole of the credit.
-- ---------------------------------------------------------------------------
-- Dated from the record own edit stamp where there is one. Where there is
-- not, the record was read and needed no correction, so it takes the date of
-- the pass: the last edit made anywhere on that campus.
WITH pass AS (
  SELECT COALESCE(max(so.last_edited_at), now()) AS at
    FROM student_outreach so
    JOIN student_outreach_campuses c ON c.id = so.campus_id
   WHERE c.slug = 'arizona-state' AND so.kind = 'provider'
)
UPDATE student_outreach_tasks t
   SET status       = 'completed',
       task_type    = 'research_initial',
       completed_at = COALESCE(so.last_edited_at, pass.at),
       notes        = COALESCE(t.notes,
                        'Reviewed in the Arizona pass, before this rung existed.')
  FROM student_outreach so
  JOIN student_outreach_campuses c ON c.id = so.campus_id
  CROSS JOIN pass
 WHERE so.id = t.outreach_id
   AND c.slug = 'arizona-state'
   AND so.kind = 'provider'
   AND so.status <> 'archived'
   AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM 'research-rung-v1'
   AND t.status = 'pending'
   AND COALESCE((t.payload->>'step')::INT, 0) = 0
   AND NOT EXISTS (SELECT 1 FROM student_outreach_tasks x
                    WHERE x.outreach_id = so.id
                      AND (x.status = 'completed'
                           OR COALESCE((x.payload->>'step')::INT, 0) > 0));

-- ---------------------------------------------------------------------------
-- 3. Arizona, records already in outreach: their tasks moved up in statement
--    1, so step 0 is empty. Write the Research rung in as completed.
-- ---------------------------------------------------------------------------
-- Having no task at step 0 is what now distinguishes them: an untouched
-- record still has one, completed by statement 2.
WITH pass AS (
  SELECT COALESCE(max(so.last_edited_at), now()) AS at
    FROM student_outreach so
    JOIN student_outreach_campuses c ON c.id = so.campus_id
   WHERE c.slug = 'arizona-state' AND so.kind = 'provider'
)
INSERT INTO student_outreach_tasks
  (outreach_id, task_type, status, due_at, completed_at, payload, notes)
SELECT so.id,
       'research_initial',
       'completed',
       COALESCE(so.last_edited_at, pass.at)::date,
       COALESCE(so.last_edited_at, pass.at),
       '{"step":0,"round":0}'::jsonb,
       'Reviewed in the Arizona pass, before this rung existed.'
  FROM student_outreach so
  JOIN student_outreach_campuses c ON c.id = so.campus_id
  CROSS JOIN pass
 WHERE c.slug = 'arizona-state'
   AND so.kind = 'provider'
   AND so.status <> 'archived'
   AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM 'research-rung-v1'
   AND NOT EXISTS (SELECT 1 FROM student_outreach_tasks x
                    WHERE x.outreach_id = so.id
                      AND COALESCE((x.payload->>'step')::INT, 0) = 0);

-- ---------------------------------------------------------------------------
-- 4. Arizona: queue the call behind it, for any record now left with nothing
--    to do. A record still mid-outreach already has one.
-- ---------------------------------------------------------------------------
INSERT INTO student_outreach_tasks
  (outreach_id, task_type, status, due_at, payload)
SELECT so.id, 'outreach_contact', 'pending', CURRENT_DATE, '{"step":1,"round":0}'::jsonb
  FROM student_outreach so
  JOIN student_outreach_campuses c ON c.id = so.campus_id
 WHERE c.slug = 'arizona-state'
   AND so.kind = 'provider'
   AND so.status <> 'archived'
   AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM 'research-rung-v1'
   AND NOT EXISTS (SELECT 1 FROM student_outreach_tasks x
                    WHERE x.outreach_id = so.id AND x.status = 'pending');

-- ---------------------------------------------------------------------------
-- 5. Stamp every record this run covered, so a second run is a no-op.
-- ---------------------------------------------------------------------------
-- Last on purpose. Until it lands, every statement above still sees work to
-- do, which is what makes the transaction all-or-nothing rather than
-- all-or-half.
UPDATE student_outreach so
   SET research_data = COALESCE(so.research_data, '{}'::jsonb)
         || jsonb_build_object('research_rung_migrated', 'research-rung-v1')
 WHERE so.kind = 'provider'
   AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM 'research-rung-v1';

COMMIT;

-- ---------------------------------------------------------------------------
-- What the board now holds. Arizona should read every provider researched and
-- none open; every other campus should read none researched, with the ones
-- nobody has called yet waiting on it.
-- ---------------------------------------------------------------------------
SELECT c.name                                                              AS campus,
       count(*)                                                            AS providers,
       count(*) FILTER (WHERE r.done_research)                             AS research_done,
       count(*) FILTER (WHERE r.open_research)                             AS research_open,
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
