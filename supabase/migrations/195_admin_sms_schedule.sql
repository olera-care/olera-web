-- 195_admin_sms_schedule.sql
--
-- Lets a HUMAN reply from /admin/inbox be held for the recipient's quiet-hours
-- window, the way an automated reactive alert already is.
--
-- The gap this closes: lib/sms/reactive-alerts.ts checks quiet hours and defers
-- into sms_queue, but the admin reply box calls sendSMS directly and checks
-- nothing. So the one path a person drives was the only path that could put a
-- text on someone's nightstand at 6am. On 2026-08-31 a reply to a care seeker
-- in GA was ready to send at 6:52am ET with nothing in the UI to say so.
--
-- Two things make an admin-queued row different from a reactive one, and both
-- are why this migration exists rather than reusing the table as-is:
--
--   1. Bookkeeping moves to delivery time. An immediate admin send stamps the
--      answer job, clears the draft, and marks the thread handled in one shot.
--      A scheduled one cannot claim 'sent' at queue time -- sent_at would be a
--      lie and the draft-vs-sent comparison would measure a message that had
--      not gone out. So the job parks in a new 'queued' state and the flush
--      promotes it to 'sent' on actual delivery.
--
--   2. The flush can CANCEL. It re-checks opt-out and the daily throttle at
--      delivery, so a scheduled reply can legitimately never send. A human who
--      pressed a button and walked away must not be left believing it did.
--      answer_job_id and queued_by carry enough identity for the flush to put
--      the thread back in the inbox when that happens.
--
-- Apply via Supabase dashboard (NOT CLI).

-- ── sms_queue: carry the admin context through to the flush ──────────────────

ALTER TABLE sms_queue ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'reactive';
ALTER TABLE sms_queue ADD COLUMN IF NOT EXISTS queued_by TEXT;
ALTER TABLE sms_queue ADD COLUMN IF NOT EXISTS answer_job_id UUID;
ALTER TABLE sms_queue ADD COLUMN IF NOT EXISTS phone_last10 TEXT;

-- Existing rows predate the column and are all reactive alerts; the DEFAULT
-- above already backfilled them. Constrain only after that is true.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sms_queue_origin_check'
  ) THEN
    ALTER TABLE sms_queue
      ADD CONSTRAINT sms_queue_origin_check
      CHECK (origin IN ('reactive', 'admin_reply'));
  END IF;
END $$;

-- The inbox asks "is there a scheduled reply for this thread?" on every thread
-- open, so it needs to be a keyed lookup rather than a scan of the due index.
CREATE INDEX IF NOT EXISTS idx_sms_queue_pending_phone
  ON sms_queue (phone_last10)
  WHERE status = 'pending';

COMMENT ON COLUMN sms_queue.origin IS
  'reactive = enqueued by lib/sms/reactive-alerts.ts. admin_reply = a human reply from /admin/inbox held by quiet hours; the flush owes it the bookkeeping an immediate send would have done.';
COMMENT ON COLUMN sms_queue.answer_job_id IS
  'family_answer_jobs.id this reply answers, when it came off a researched packet. Stamped to sent on delivery, reopened on cancel.';
COMMENT ON COLUMN sms_queue.queued_by IS
  'Admin email that scheduled the send. Becomes family_answer_jobs.sent_by on delivery.';

-- ── family_answer_jobs: a reply can now be committed but not yet sent ────────

ALTER TABLE family_answer_jobs DROP CONSTRAINT IF EXISTS family_answer_jobs_status_check;
ALTER TABLE family_answer_jobs
  ADD CONSTRAINT family_answer_jobs_status_check
  CHECK (status IN ('pending', 'running', 'ready', 'queued', 'sent', 'failed', 'skipped'));

COMMENT ON COLUMN family_answer_jobs.status IS
  'pending/running/ready = engine lifecycle. queued = a human approved a reply but quiet hours held it; sent_body and sent_by are set, sent_at is NULL until the flush delivers. sent = on the wire. Back to ready if the flush cancels.';

-- Records the adversarial re-check a human ran against an EDITED draft. The
-- packet's own objections were raised against packet->>'draft'; the moment a
-- human rewrites it those objections describe a message that no longer exists,
-- and until now there was no way to re-attack the replacement. Kept as history
-- (append-only array) so the record shows what was challenged and what the
-- reviewer did about it, not just the last state.
ALTER TABLE family_answer_jobs ADD COLUMN IF NOT EXISTS rechecks JSONB;

COMMENT ON COLUMN family_answer_jobs.rechecks IS
  'Append-only array of adversarial re-checks run against a human-edited draft: {at, by, draft, claims, objections, suggestedDraft}. Shape owned by lib/family-answers.';
