-- Migration: v4 auto-send pipeline support.
--
-- Adds the `outreach_email_send` task type used by the cron-driven
-- auto-send executor (scans for due tasks every 15 min and sends
-- via Resend). Also supersedes any legacy v3 outreach tasks that
-- would never fire under v4, so they don't pollute the queue.
--
-- Apply via Supabase dashboard.

-- 1) Allow outreach_email_send as a task_type.
ALTER TABLE student_outreach_tasks
  DROP CONSTRAINT IF EXISTS student_outreach_tasks_task_type_check;

ALTER TABLE student_outreach_tasks
  ADD CONSTRAINT student_outreach_tasks_task_type_check
  CHECK (task_type IN (
    'research_initial',
    'outreach_day_0',
    'outreach_multichannel_orgs',
    'outreach_email_send',                -- v4: scheduled auto-send
    'outreach_followup_email',
    'outreach_followup_call',
    'meeting_held_logging',
    'agreement_followup',
    'distribution_confirmation',
    'move_to_active_partner',
    'partner_seasonal_checkin',
    'partner_share_update',
    'partner_event_coordination',
    'approval_request_followup',
    'yearly_leadership_recheck',
    'manual_followup'
  ));

-- 2) Supersede any v3 pending outreach tasks. They were admin-driven
--    and would never auto-fire under v4. Admin should re-run
--    "Schedule outreach sequence" on those rows. Safe no-op if there
--    are no such rows yet.
UPDATE student_outreach_tasks
   SET status = 'superseded',
       completed_at = NOW(),
       payload = COALESCE(payload, '{}'::jsonb) || '{"reason":"v4_migration"}'::jsonb
 WHERE status = 'pending'
   AND task_type IN (
     'outreach_day_0',
     'outreach_multichannel_orgs',
     'outreach_followup_email',
     'outreach_followup_call'
   );
