-- ===========================================================================
-- 246 — the advisor sweep
-- ===========================================================================
-- The universities side had no way to start. An advisor record could only
-- come from the fan-out on the research rung, the fan-out had no server
-- behind it, and nothing put that rung in front of anybody in the first
-- place — so the Advisors section of every campus sat empty and there was
-- no button that would have filled it.
--
-- This is the providers' Google Maps sweep, one section over: one task per
-- campus, derived rather than seeded, gone once it is done. What it finds
-- becomes advisor records, each starting its own outreach.
--
-- Career centre managers, programme directors and deans all come in as
-- advisors. The enum stays as it is and the real job title goes in the
-- contact's role, which is what a human reads anyway.
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
    'advisor_sweep'
  ));

-- One per campus, ever, the same as the map sweep.
--
-- Partial, and deliberately not merged with the map sweep's index into one
-- unique on (campus_id, task_type): manual_followup must stay repeatable.
-- The write does not use ON CONFLICT against these — a partial index cannot
-- satisfy a bare ON CONFLICT (campus_id), which is why pressing Swept has
-- been returning a 500 since the map sweep shipped. It inserts and treats
-- 23505 as the no-op it is.
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_tasks_advisor_sweep
  ON site_tasks (campus_id)
  WHERE task_type = 'advisor_sweep';
