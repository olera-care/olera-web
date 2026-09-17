-- ===========================================================================
-- Step 5a -- what inserting the Research rung would do. READ ONLY.
-- ===========================================================================
-- Nothing here writes. Run it, read the numbers, and if they look right run
-- 17b-research-rung-apply.sql.
--
-- The providers ladder gained a rung in front of every other one:
--
--     0  Research                             <- new
--     1  Call to confirm the right contact        (was 0, and was named
--                                                  "Call to get the right email")
--     2  Send the program info                    (was 1)
--     3  Follow ups 1-7                           (was 2)
--     ...
--
-- Task rows carry their rung as payload.step, so the numbers stored in the
-- database have to move with the ladder or every record would read as being
-- one rung further along than it is.
--
-- Three groups, treated differently on purpose.
--
--   untouched      Nobody has called them; their one pending task sits at
--                  step 0. Nothing is written: step 0 now means Research,
--                  which is exactly the first thing to do to a record
--                  nobody has looked at.
--
--   in_outreach    Gracie called these, and the history that came off her
--                  spreadsheet is against specific rungs. Every task moves
--                  up one so the history keeps pointing at the rung it
--                  describes. They get no Research task: you do not
--                  research a provider you are three follow-ups deep with.
--
--   arizona        Every provider on that board was reviewed by hand in
--                  September. That is the Research rung, done before it
--                  existed. Each one is marked complete, dated from the
--                  record last_edited_at stamp where there is one and from
--                  the date of the pass where the record was read and left
--                  alone, and the call is queued behind it.
--
-- Archived records are left out of the Arizona credit: they are not on the
-- board, so a completed rung on them would be bookkeeping nobody reads. The
-- renumber still covers them, so reviving one lands it on the right rung.
--
-- ---------------------------------------------------------------------------
-- A NOTE ON THE SUPABASE SQL EDITOR
-- ---------------------------------------------------------------------------
-- This began life as one procedural block and the dashboard could not run it.
-- Twice it cut the block short and the whole thing failed to parse with
--
--   ERROR: 42601: unterminated dollar-quoted string
--
-- The first time it also spliced row-level-security statements into the
-- middle of the body, having decided that a temporary working table and a
-- variable holding a count were both new tables.
--
-- So there is no procedural block here any more, and no dollar quoting for it
-- to lose track of. Both files are plain statements. Keep them that way.
-- ===========================================================================

WITH todo AS (
  SELECT so.id,
         so.campus_id,
         so.status,
         -- Worked means a task has been completed, or a task sits past the
         -- first rung. Either is enough: both mean the stored step numbers
         -- describe the old ladder and have to move.
         EXISTS (SELECT 1 FROM student_outreach_tasks t
                  WHERE t.outreach_id = so.id
                    AND (t.status = 'completed'
                         OR COALESCE((t.payload->>'step')::INT, 0) > 0)) AS in_flight,
         -- After the Arizona credit, a record with nothing pending but its
         -- step 0 task is the one that needs the call queueing.
         NOT EXISTS (SELECT 1 FROM student_outreach_tasks t
                      WHERE t.outreach_id = so.id
                        AND t.status = 'pending'
                        AND COALESCE((t.payload->>'step')::INT, 0) <> 0) AS needs_call
    FROM student_outreach so
   WHERE so.kind = 'provider'
     -- Every record the apply touches is stamped, and a stamped record is
     -- skipped. That is what makes a second run a no-op, and it is why this
     -- report empties out once the apply has been run.
     AND so.research_data->>'research_rung_migrated' IS DISTINCT FROM 'research-rung-v1'
)
SELECT c.name                                                  AS campus,
       count(*)                                                AS providers,
       count(*) FILTER (WHERE NOT p.in_flight)                 AS untouched,
       count(*) FILTER (WHERE p.in_flight)                     AS in_outreach,
       (SELECT count(*)
          FROM student_outreach_tasks t
          JOIN todo q ON q.id = t.outreach_id
         WHERE q.in_flight
           AND q.campus_id = c.id)                             AS tasks_moved_up,
       count(*) FILTER (WHERE c.slug = 'arizona-state'
                          AND p.status <> 'archived')          AS research_credited,
       count(*) FILTER (WHERE c.slug = 'arizona-state'
                          AND p.status <> 'archived'
                          AND p.needs_call)                    AS calls_queued
  FROM todo p
  JOIN student_outreach_campuses c ON c.id = p.campus_id
 GROUP BY c.id, c.name, c.slug
 ORDER BY c.name;
