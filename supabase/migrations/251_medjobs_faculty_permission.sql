-- ===========================================================================
-- 251 — permission to contact faculty, as a task on the campus
-- ===========================================================================
-- Naming who approved us changes a faculty email more than any other word in
-- it. But the approval does not come from a pre-health advisor: it comes
-- from a department chair, industry or corporate relations, or a
-- marketing/communications office — so it does not belong on the advisors
-- ladder, and it is not a step on any one professor's record either.
--
-- It is a fact about the campus. One task, asked once, recorded once, and
-- read by every professor email after it.
--
-- Deliberately not a gate. 250 removed the rung that blocked all faculty
-- outreach behind an approval that may never arrive; this records the
-- approval when it comes and leaves the cold email working until it does.
-- ===========================================================================

ALTER TABLE site_tasks DROP CONSTRAINT IF EXISTS site_tasks_task_type_check;
ALTER TABLE site_tasks
  ADD CONSTRAINT site_tasks_task_type_check
  CHECK (task_type IN (
    'manual_followup',
    'activation_job_board_check',
    'activation_listserv_confirm',
    'activation_listserv_remind',
    'activation_org_reconnect',
    'activation_event_review',
    'activation_event_day',
    'activation_professor_reengage',
    'provider_map_sweep',
    'advisor_sweep',
    'org_sweep',
    'event_sweep',
    'professor_sweep',
    'faculty_permission'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS uq_site_tasks_faculty_permission
  ON site_tasks (campus_id) WHERE task_type = 'faculty_permission';

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT indexname FROM pg_indexes
WHERE tablename = 'site_tasks' AND indexname LIKE 'uq_site_tasks_%'
ORDER BY indexname;
