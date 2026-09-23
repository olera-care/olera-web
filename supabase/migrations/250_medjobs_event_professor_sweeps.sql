-- ===========================================================================
-- 250 — the campus event and professor sweeps
-- ===========================================================================
-- Two more sections that could not be started. "Research career fairs and
-- events" and "Identify professors from the directory" were the first rungs
-- of their ladders, rendered against a placeholder record with a synthetic
-- id, and pressing the button posted that id to a server that answered
--
--   404  "That record does not exist yet. Start it before editing it."
--
-- the same way the orgs rung did before 249. Both become sweeps.
--
-- Events also move house. They lived in campus_channel_records, on the
-- reasoning that an event is not someone you run follow-up rounds at — but
-- an event now has a ladder of its own: inquire, assign a leader, prepare,
-- attend. That is exactly a student_outreach row, and keeping events
-- somewhere else would mean a second record creator, a second task table and
-- attachments filed under the wrong kind. The rows already in
-- campus_channel_records still read; nothing is migrated out of them.
-- ===========================================================================

-- ── student_outreach.kind learns about events ─────────────────────────────
-- 072 constrained this column, and anything outside the list is refused
-- outright — which is what would happen to every event the sweep created.
ALTER TABLE student_outreach DROP CONSTRAINT IF EXISTS student_outreach_kind_check;
ALTER TABLE student_outreach
  ADD CONSTRAINT student_outreach_kind_check
  CHECK (kind IN ('student_org', 'advisor', 'professor', 'dept_head', 'provider', 'event'));

-- ── two more sweep task types ─────────────────────────────────────────────
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
    'professor_sweep'
  ));

CREATE UNIQUE INDEX IF NOT EXISTS uq_site_tasks_event_sweep
  ON site_tasks (campus_id) WHERE task_type = 'event_sweep';

CREATE UNIQUE INDEX IF NOT EXISTS uq_site_tasks_professor_sweep
  ON site_tasks (campus_id) WHERE task_type = 'professor_sweep';

-- ── confirm ───────────────────────────────────────────────────────────────
SELECT pg_get_constraintdef(oid) AS student_outreach_kind
FROM pg_constraint
WHERE conrelid = 'student_outreach'::regclass AND conname = 'student_outreach_kind_check';

SELECT indexname FROM pg_indexes
WHERE tablename = 'site_tasks' AND indexname LIKE 'uq_site_tasks_%_sweep'
ORDER BY indexname;
