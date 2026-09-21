-- ===========================================================================
-- Step 7 -- record the meeting with Matthew, on the day it happened. WRITES.
-- ===========================================================================
-- He was met on 16 September and nothing recorded it, so the board has him on
-- the meeting rung. Clicking Meeting held would fix that but date it today.
-- This dates it the 16th and queues the rung he is actually on, which is
-- completing his application.
--
-- It will only write if exactly one student matches the name. If it finds
-- none, or more than one, it reports what it found and writes nothing: a
-- statement that guesses which person you meant is worse than one that stops.
-- Run it, read students_matched, and if it is not 1 tell me what it found
-- rather than adjusting the name yourself.
--
-- ONE statement, and nothing but SELECT and INSERT: read the note at the foot
-- of 17a-research-rung-rehearsal.sql for why. Safe to run twice -- the second
-- run finds the rows it wrote and writes nothing.
-- ===========================================================================

WITH match AS (
  SELECT bp.id,
         bp.display_name,
         bp.email,
         bp.metadata->>'university' AS university,
         bp.created_at::date        AS applied
    FROM business_profiles bp
   WHERE bp.type = 'student'
     AND bp.display_name ILIKE '%matthew%'
),

-- Exactly one, or nothing at all.
one AS (
  SELECT id FROM match WHERE (SELECT count(*) FROM match) = 1
),

-- The meeting, on the day it happened.
held AS (
  INSERT INTO business_profile_tasks
    (business_profile_id, kind, task_type, status, due_at, completed_at, payload, notes)
  SELECT one.id,
         'candidate',
         'manual_followup',
         'completed',
         DATE '2026-09-16',
         TIMESTAMPTZ '2026-09-16 17:00:00+00',
         '{"step":0,"round":0}'::jsonb,
         'Met on 16 September. Recorded afterwards.'
    FROM one
   WHERE NOT EXISTS (
     SELECT 1 FROM business_profile_tasks t
      WHERE t.business_profile_id = one.id
        AND t.kind = 'candidate'
        AND COALESCE((t.payload->>'step')::INT, 0) = 0)
  RETURNING business_profile_id
),

-- And the rung behind it. Without this the board would find history but
-- nothing waiting, and put him back on the meeting.
next_rung AS (
  INSERT INTO business_profile_tasks
    (business_profile_id, kind, task_type, status, due_at, payload)
  SELECT one.id, 'candidate', 'manual_followup', 'pending', CURRENT_DATE,
         '{"step":1,"round":0}'::jsonb
    FROM one
   WHERE NOT EXISTS (
     SELECT 1 FROM business_profile_tasks t
      WHERE t.business_profile_id = one.id
        AND t.kind = 'candidate'
        AND t.status = 'pending')
  RETURNING business_profile_id
)

SELECT match.display_name,
       match.email,
       match.university,
       match.applied,
       (SELECT count(*) FROM match)     AS students_matched,
       (SELECT count(*) FROM held)      AS meeting_recorded,
       (SELECT count(*) FROM next_rung) AS application_rung_queued
  FROM match
 ORDER BY match.display_name;
