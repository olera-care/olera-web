-- v9.0 Phase 8 webhook touchpoint emission.
--
-- The Resend webhook now emits a student_outreach_touchpoints row for
-- bounce / complained / failed events so the drawer Timeline + Stage
-- derivation pick them up immediately (bounce_fix stage, auto-DNC,
-- send-failure retry hint). The existing CHECK constraint allows
-- email_sent / email_replied / email_bounced but not the new types —
-- this migration widens it.
--
-- Idempotent via IF EXISTS / re-add pattern (mirrors migration 066's
-- step_skipped addition).

ALTER TABLE student_outreach_touchpoints
  DROP CONSTRAINT IF EXISTS student_outreach_touchpoints_touchpoint_type_check;

ALTER TABLE student_outreach_touchpoints
  ADD CONSTRAINT student_outreach_touchpoints_touchpoint_type_check
  CHECK (touchpoint_type IN (
    -- email
    'email_sent','email_replied','email_bounced','email_complained','email_failed',
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
