-- ===========================================================================
-- 249 — the student org sweep
-- ===========================================================================
-- "Identify the student orgs" was the first rung of the orgs ladder and it
-- could not be done. A campus with no org records got a placeholder record
-- with a synthetic id, the rung rendered against it, and pressing the button
-- posted that id to the server, which answered:
--
--   404  "That record does not exist yet. Start it before editing it."
--
-- Nothing surfaced it. The section had no way to start, the same way the
-- advisors side had none before 246, and for the same reason: the rung that
-- was meant to fill it had no server behind it.
--
-- This is the advisor sweep, one section over. One task per campus, derived
-- rather than seeded, gone once it is done, and what it finds becomes org
-- records — each with its contacts, each starting its own outreach.
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
    'org_sweep'
  ));

-- One per campus, ever. Partial for the same reason the other two are:
-- manual_followup has to stay repeatable, so a plain unique on
-- (campus_id, task_type) would be wrong.
CREATE UNIQUE INDEX IF NOT EXISTS uq_site_tasks_org_sweep
  ON site_tasks (campus_id)
  WHERE task_type = 'org_sweep';

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'site_tasks'::regclass AND conname = 'site_tasks_task_type_check';

SELECT indexname FROM pg_indexes
WHERE tablename = 'site_tasks' AND indexname LIKE 'uq_site_tasks_%_sweep';
