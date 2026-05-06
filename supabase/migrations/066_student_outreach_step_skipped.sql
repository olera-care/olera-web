-- Migration: Add `step_skipped` to student_outreach_touchpoints CHECK constraint.
--
-- v3 introduces an explicit step-by-step outreach workflow. When an admin
-- skips an optional step (e.g. IG DM when no officer has Instagram), we
-- log a `step_skipped` touchpoint with payload `{ day, step_id }` so the
-- step list knows not to keep prompting.
--
-- We drop the existing constraint and re-add it with the new value.
-- The CHECK constraint is auto-named by Postgres as
-- `<table>_<column>_check` for inline CHECK clauses; using IF EXISTS
-- keeps the migration safe to re-run.

ALTER TABLE student_outreach_touchpoints
  DROP CONSTRAINT IF EXISTS student_outreach_touchpoints_touchpoint_type_check;

ALTER TABLE student_outreach_touchpoints
  ADD CONSTRAINT student_outreach_touchpoints_touchpoint_type_check
  CHECK (touchpoint_type IN (
    -- email
    'email_sent','email_replied','email_bounced',
    -- phone
    'call_no_answer','call_voicemail','call_connected','call_wrong_number',
    -- alt channels
    'ig_dm_sent','ig_dm_replied','contact_form_submitted',
    -- meetings
    'meeting_scheduled','meeting_held','meeting_no_show','meeting_rescheduled',
    -- approvals
    'approval_requested','approval_granted','approval_denied','approval_expired',
    -- distribution
    'distribution_confirmed',
    -- contacts
    'contact_added','contact_marked_stale','contact_replaced',
    -- workflow
    'redirect_initiated','stage_change','note_added',
    'snoozed','task_cancelled','task_superseded','step_skipped',
    -- system
    'system_seasonal_due'
  ));
