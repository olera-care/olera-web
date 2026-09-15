-- ===========================================================================
-- 233 — one contact task per round
-- ===========================================================================
-- A round of follow-up is one piece of work: check for a reply, and if there
-- isn't one, call the contact and email them. It was previously two tasks —
-- outreach_followup_call and outreach_email_send — which listed the same
-- person twice in the queue and let half a round look finished.
--
-- `outreach_contact` carries both channels. Its payload records each half as
-- it is logged (call_logged_at / email_logged_at); the task completes when
-- both are set, which is what advances the round.
--
-- Additive only: the existing per-channel types stay valid so tasks queued
-- before this migration keep working and nothing needs backfilling.
--
-- Apply via the Supabase dashboard (NOT the CLI), per project convention.
-- ===========================================================================

-- Guard: if some row already carries a type the new constraint would reject,
-- stop here rather than failing halfway through the ALTER.
DO $$
DECLARE bad TEXT;
BEGIN
  SELECT string_agg(DISTINCT task_type, ', ') INTO bad
  FROM student_outreach_tasks
  WHERE task_type NOT IN (
    'research_initial','outreach_day_0','outreach_multichannel_orgs',
    'outreach_email_send','outreach_followup_email','outreach_followup_call',
    'meeting_held_logging','agreement_followup','distribution_confirmation',
    'move_to_active_partner','partner_seasonal_checkin','partner_share_update',
    'partner_event_coordination','approval_request_followup',
    'yearly_leadership_recheck','manual_followup','outreach_contact');
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION
      'student_outreach_tasks holds task_type values the new constraint would reject: %', bad;
  END IF;
END $$;

-- Drop the existing CHECK by name first, then sweep any differently-named one.
-- Postgres normalises `IN (...)` to `= ANY (ARRAY[...])` in
-- pg_get_constraintdef, so matching on '%IN%' silently finds nothing — which
-- is how the first version of this migration collided with its own ADD.
ALTER TABLE student_outreach_tasks
  DROP CONSTRAINT IF EXISTS student_outreach_tasks_task_type_check;

DO $$
DECLARE cons_name TEXT;
BEGIN
  SELECT conname INTO cons_name
    FROM pg_constraint
   WHERE conrelid = 'student_outreach_tasks'::regclass
     AND contype = 'c'
     AND pg_get_constraintdef(oid) LIKE '%task_type%';
  IF cons_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE student_outreach_tasks DROP CONSTRAINT %I', cons_name);
  END IF;
END $$;

ALTER TABLE student_outreach_tasks
  ADD CONSTRAINT student_outreach_tasks_task_type_check
  CHECK (task_type IN (
    'research_initial',
    'outreach_day_0',
    'outreach_multichannel_orgs',
    'outreach_email_send',
    'outreach_followup_email',
    'outreach_followup_call',
    'outreach_contact',            -- one round: call + email together
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

COMMENT ON COLUMN student_outreach_tasks.task_type IS
  'Work type. ''outreach_contact'' is one round of follow-up carrying both a '
  'call and an email; its payload records call_logged_at and email_logged_at, '
  'and the task completes when both are present.';

-- The Tasks tab reads every pending contact task across all campuses, ordered
-- by when it came due.
CREATE INDEX IF NOT EXISTS idx_so_tasks_contact_due
  ON student_outreach_tasks (due_at)
  WHERE status = 'pending' AND task_type = 'outreach_contact';
