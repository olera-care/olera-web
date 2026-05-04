-- Migration: v7 cleanup — supersede zombie manual_followup tasks.
--
-- v7 collapses the "cadence ended cold" task type into a "stale row"
-- visual badge inside the Replies tab. The auto-queueing logic is being
-- removed, so any tasks left over from v4-v6 sweeps would otherwise sit
-- in the DB invisible (no UI surfaces them).
--
-- This UPDATE supersedes those zombie tasks. Custom tasks (reason='custom')
-- are NOT touched — they remain admin-actionable.

UPDATE student_outreach_tasks
   SET status = 'superseded',
       completed_at = NOW(),
       payload = COALESCE(payload, '{}'::jsonb) || '{"reason_v7":"obsolete_cadence_ended_followup"}'::jsonb
 WHERE status = 'pending'
   AND task_type = 'manual_followup'
   AND payload->>'reason' IN (
     'cadence_ended_cold',
     'continue_dialogue',
     'no_recipients_at_send_time',
     'all_recipients_failed'
   );
