-- ===========================================================================
-- Which MedJobs migrations are actually applied?
-- ===========================================================================
-- Read-only. Nothing here changes anything, so it is always safe to run.
--
-- Paste the whole thing into the Supabase SQL editor. One row per thing that
-- matters, each saying APPLIED or RUN IT, and which file to run.
-- ===========================================================================

WITH checks AS (

  -- 233: one contact task per round. Without it, logging a follow-up and
  -- "another set of rounds" both fail with a check-constraint violation.
  SELECT
    1 AS ord,
    '233_outreach_contact_task.sql' AS script,
    'Log a follow-up round' AS what_it_unblocks,
    EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'student_outreach_tasks'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%outreach_contact%'
    ) AS ok

  UNION ALL

  -- 219: the university activation tables the Tasks board reads for its
  -- channel dots. Long applied, checked so the board's dots are accounted for.
  SELECT
    2,
    '219_university_activation.sql',
    'The five channel dots on the board',
    to_regclass('public.campus_channels') IS NOT NULL

  UNION ALL

  -- 075: the task table the job board's work lives in.
  SELECT
    3,
    '075_medjobs_polymorphic_tasks.sql',
    'Job board tasks',
    to_regclass('public.site_tasks') IS NOT NULL
)

SELECT
  CASE WHEN ok THEN '✅ APPLIED' ELSE '⛔ RUN IT' END AS status,
  what_it_unblocks,
  script
FROM checks
ORDER BY ord;

-- ===========================================================================
-- Rows damaged by the failed "another set of rounds"
-- ===========================================================================
-- Before 233 was written, that button cancelled a record's pending rounds
-- and then failed to insert the replacement, leaving the record live with
-- nothing queued. This counts them. If it returns 0, there is nothing to
-- repair and you can skip the recovery script.

SELECT COUNT(*) AS records_left_with_no_work
FROM student_outreach o
WHERE o.status NOT IN (
        'active_partner','not_interested','no_response_closed',
        'do_not_contact','wrong_contact','archived')
  AND EXISTS (
        SELECT 1 FROM student_outreach_tasks t
        WHERE t.outreach_id = o.id AND t.status = 'cancelled')
  AND NOT EXISTS (
        SELECT 1 FROM student_outreach_tasks t
        WHERE t.outreach_id = o.id AND t.status = 'pending');
