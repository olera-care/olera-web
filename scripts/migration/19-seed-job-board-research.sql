-- ===========================================================================
-- Step 6 -- give every job board its first rung. WRITES.
-- ===========================================================================
-- The job board ladder had no task rows at all. That is why the drawer showed
-- a STILL TO COME list and nothing to do: the record sat on rung 0 with
-- nothing queued against it, so no checkbox ever appeared.
--
-- This queues Research on every campus that has a job board channel and has
-- never had a job board task. One row per campus.
--
-- ONE statement, and no procedural block: read the note at the foot of
-- 17a-research-rung-rehearsal.sql for why. Safe to run twice -- the second
-- run finds the task it queued and queues nothing.
--
-- The rung lives in payload.step, the same as every other ladder, so no new
-- work type is needed. activation_job_board_check is the type the schema
-- already carries for this channel.
-- ===========================================================================

WITH seeded AS (
  INSERT INTO site_tasks
    (campus_id, channel, task_type, status, due_at, payload)
  SELECT ch.campus_id,
         'st3',
         'activation_job_board_check',
         'pending',
         date_trunc('day', now()),
         '{"step":0,"round":0}'::jsonb
    FROM campus_channels ch
   WHERE ch.channel = 'st3'
     AND NOT EXISTS (
       SELECT 1 FROM site_tasks t
        WHERE t.campus_id = ch.campus_id
          AND t.channel = 'st3'
          AND t.record_id IS NULL
          AND t.status IN ('pending', 'completed'))
  RETURNING campus_id
)
SELECT c.name                     AS campus,
       count(s.campus_id)         AS research_queued
  FROM student_outreach_campuses c
  LEFT JOIN seeded s ON s.campus_id = c.id
 GROUP BY c.name
 ORDER BY c.name;
