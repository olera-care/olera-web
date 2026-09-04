-- 183_family_answer_jobs.sql
--
-- Work queue for the Family Answers Engine. One row per inbound care-seeker
-- message that needs a researched reply drafted.
--
-- Why a queue at all: the research chain (library lookup, web search, draft,
-- adversarial check, rebuttal) takes minutes, and the Twilio webhook has to
-- answer in well under a second. So the webhook does the cheap, deterministic
-- work — crisis check, dedupe, acknowledgement — and drops a job here. A cron
-- worker drains it.
--
-- PHASE 1 NOTE: this table is written but not yet read. Phase 1 ships the
-- webhook side only, so jobs accumulate in 'pending' until the Phase 2 worker
-- exists. That is intentional and harmless: at roughly one inbound question a
-- day the backlog is trivial, and having the capture in place first means no
-- message from the pilot period is lost to the gap between phases.
--
-- Apply via Supabase dashboard (NOT CLI).

CREATE TABLE IF NOT EXISTS family_answer_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_last10      TEXT NOT NULL,                     -- thread key, matches sms_inbound.phone_last10
  profile_id        UUID,                              -- business_profiles.id when a family matched
  twilio_sid        TEXT,                              -- joins to sms_inbound.twilio_sid (the message that triggered this)
  body              TEXT NOT NULL,                     -- the question as the family wrote it
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'running', 'ready', 'sent', 'failed', 'skipped')),
  attempts          INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT,
  -- The review packet the worker produces: draft, per-claim sources, the
  -- drafter/checker disagreements, and person-fact risks. Shape owned by
  -- lib/family-answers, deliberately loose here so Phase 2 can iterate on it
  -- without a migration.
  packet            JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  -- Stamped when a human sends a reply off the back of this job. Together with
  -- packet->>'draft' this gives the draft-vs-sent edit distance, which is the
  -- cheapest honest signal of whether the engine is any good.
  sent_body         TEXT,
  sent_at           TIMESTAMPTZ,
  sent_by           TEXT
);

-- The worker claims the oldest pending job.
CREATE INDEX IF NOT EXISTS idx_family_answer_jobs_pending
  ON family_answer_jobs (created_at)
  WHERE status = 'pending';

-- Thread view: every job for one phone, newest first.
CREATE INDEX IF NOT EXISTS idx_family_answer_jobs_phone
  ON family_answer_jobs (phone_last10, created_at DESC);

ALTER TABLE family_answer_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on family_answer_jobs"
  ON family_answer_jobs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

COMMENT ON TABLE family_answer_jobs IS
  'Work queue for the Family Answers Engine. Enqueued by the Twilio inbound webhook when a family sends a free-form question; drained by the Phase 2 research worker, which writes a review packet for a human to approve. Never auto-sends.';
