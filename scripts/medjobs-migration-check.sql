-- ===========================================================================
-- Which MedJobs migrations are applied, and is there anything to repair?
-- ===========================================================================
-- Read-only. Nothing here changes anything, so it is always safe to run.
--
-- ONE statement on purpose. The Supabase SQL editor only shows the result of
-- the last statement it ran, so a script that asks several questions answers
-- only the last one. Everything below is a single SELECT.
--
-- Paste the whole thing in and read the rows top to bottom.
-- ===========================================================================

WITH damaged AS (
  -- Records the failed "another set of rounds" left live with nothing queued:
  -- it cancelled the pending rounds, then the insert that should have replaced
  -- them was rejected by the old constraint.
  SELECT COUNT(*) AS n
  FROM student_outreach o
  WHERE o.status NOT IN (
          'active_partner','not_interested','no_response_closed',
          'do_not_contact','wrong_contact','archived')
    AND EXISTS (
          SELECT 1 FROM student_outreach_tasks t
          WHERE t.outreach_id = o.id AND t.status = 'cancelled')
    AND NOT EXISTS (
          SELECT 1 FROM student_outreach_tasks t
          WHERE t.outreach_id = o.id AND t.status = 'pending')
),

rows_out AS (

  SELECT
    1 AS ord,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'student_outreach_tasks'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%outreach_contact%'
    ) THEN 'APPLIED' ELSE 'RUN IT' END AS status,
    'Logging a follow-up round' AS what_it_affects,
    'supabase/migrations/233_outreach_contact_task.sql' AS what_to_run

  UNION ALL

  SELECT
    2,
    CASE WHEN to_regclass('public.campus_channels') IS NOT NULL
         THEN 'APPLIED' ELSE 'RUN IT' END,
    'The five channel dots on the board',
    'supabase/migrations/219_university_activation.sql'

  UNION ALL

  SELECT
    3,
    CASE WHEN to_regclass('public.site_tasks') IS NOT NULL
         THEN 'APPLIED' ELSE 'RUN IT' END,
    'Job board tasks',
    'supabase/migrations/075_medjobs_polymorphic_tasks.sql'

  UNION ALL

  SELECT
    4,
    CASE WHEN (SELECT n FROM damaged) = 0 THEN 'NOTHING TO FIX' ELSE 'REPAIR' END,
    (SELECT n FROM damaged)::text || ' record(s) left live with no work queued',
    'scripts/medjobs-recover-cancelled-rounds.sql'
)

SELECT status, what_it_affects, what_to_run
FROM rows_out
ORDER BY ord;
