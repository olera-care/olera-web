-- ===========================================================================
-- Step 5c -- did the Research rung land? READ ONLY.
-- ===========================================================================
-- Run this after 17b. It writes nothing, and it answers the only question
-- that matters: is the board in the state the migration was meant to leave
-- it in.
--
--   on_the_board       providers not archived, per campus
--   research_done      of those, the ones whose Research rung is ticked
--   research_waiting   of those, the ones showing an open Research checkbox
--   no_research_rung   of those, the ones already in outreach, which get no
--                      Research rung at all and are meant to read as zero
--                      here on every campus except after a later pass
--   migrated           every provider on that campus carrying the batch
--                      stamp, archived ones included
--
-- What right looks like: Arizona State reads research_done 64 and
-- research_waiting 0. Every other campus reads research_done 0, with its
-- untouched providers under research_waiting. Every migrated count equals
-- that campus total including archived rows -- 130, 22, 19, 25, 73, 20.
--
-- If migrated is 0 everywhere, 17b did not land. Run it again.
-- ===========================================================================

SELECT c.name                                                          AS campus,
       count(*) FILTER (WHERE so.status <> 'archived')                 AS on_the_board,
       count(*) FILTER (WHERE so.status <> 'archived' AND r.done)      AS research_done,
       count(*) FILTER (WHERE so.status <> 'archived' AND r.waiting)   AS research_waiting,
       count(*) FILTER (WHERE so.status <> 'archived'
                          AND NOT r.done AND NOT r.waiting)            AS no_research_rung,
       count(*) FILTER (WHERE so.research_data->>'research_rung_migrated'
                              = 'research-rung-v1')                    AS migrated
  FROM student_outreach so
  JOIN student_outreach_campuses c ON c.id = so.campus_id
  CROSS JOIN LATERAL (
    SELECT EXISTS (SELECT 1 FROM student_outreach_tasks t
                    WHERE t.outreach_id = so.id
                      AND t.status = 'completed'
                      AND COALESCE((t.payload->>'step')::INT, 0) = 0) AS done,
           EXISTS (SELECT 1 FROM student_outreach_tasks t
                    WHERE t.outreach_id = so.id
                      AND t.status = 'pending'
                      AND COALESCE((t.payload->>'step')::INT, 0) = 0) AS waiting
  ) r
 WHERE so.kind = 'provider'
 GROUP BY c.name
 ORDER BY c.name;
