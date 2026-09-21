-- The one-off Google Maps sweep, per university.
--
-- The provider list for a campus comes from the directory, and the directory
-- can only offer agencies it has heard of. The map pack has ones it has not,
-- and those stay invisible to us until somebody searches. So every university
-- earns one task, once: search the map pack and add what is missing.
--
-- It is a site_task rather than an outreach task because it belongs to the
-- university, not to any agency. There is no provider it could hang off.
--
-- No rows are inserted. The board shows the sweep for any campus without a
-- completed one, so a campus created tomorrow gets it with no backfill and
-- no hook in the campus-creation path to forget. The only row ever written
-- is the completed one, when somebody does it.

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
    'provider_map_sweep'            -- one per campus, ever
  ));

-- One per campus, ever, enforced where it cannot be got around. A double
-- click on Swept would otherwise write two rows, and "has this university
-- been swept" would stop being a question with one answer.
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_tasks_provider_map_sweep
  ON site_tasks (campus_id)
  WHERE task_type = 'provider_map_sweep';
