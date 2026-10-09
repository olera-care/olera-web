-- MedJobs: allow standalone notes in a record's history (PR #2475).
--
-- The tasks-board "add_note" action inserts an instantly completed task with
-- task_type 'custom_note'. The CHECK below did not list it, so every note
-- failed with a constraint violation. This copies the live list exactly
-- (read from pg_constraint on 2026-10-09) and adds 'custom_note'. Additive
-- only: every existing value stays allowed.

ALTER TABLE student_outreach_tasks
  DROP CONSTRAINT IF EXISTS student_outreach_tasks_task_type_check;

ALTER TABLE student_outreach_tasks
  ADD CONSTRAINT student_outreach_tasks_task_type_check
  CHECK (task_type IN (
    'research_initial',
    'outreach_day_0',
    'outreach_multichannel_orgs',
    'outreach_email_send',
    'outreach_followup_email',
    'outreach_followup_call',
    'outreach_contact',
    'meeting_held_logging',
    'agreement_followup',
    'distribution_confirmation',
    'move_to_active_partner',
    'partner_seasonal_checkin',
    'partner_share_update',
    'partner_event_coordination',
    'approval_request_followup',
    'yearly_leadership_recheck',
    'manual_followup',
    'custom_note'                  -- standalone admin note, never a ladder rung
  ));
