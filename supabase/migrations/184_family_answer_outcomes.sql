-- 184_family_answer_outcomes.sql
--
-- Closes the loop on the Family Answers Engine: did the answer we sent
-- actually get the family anywhere?
--
-- Without this we are outcome-blind in exactly the way Ad Boost was. We can
-- measure that a well-sourced draft went out and never learn whether the person
-- got their air conditioner fixed, which means every quality judgement about
-- the engine rests on how good the drafts look rather than on what they did.
--
-- Seven days after a reply is sent, a follow-up asks one question whose answer
-- is machine-readable. That last part is not a detail: asking "did you get
-- help?" and receiving prose would generate another message needing a human,
-- which is the problem this whole system exists to reduce.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE family_answer_jobs
  -- When the 7-day follow-up went out. NULL means it has not been asked yet,
  -- which is what the cron selects on.
  ADD COLUMN IF NOT EXISTS followup_sent_at  TIMESTAMPTZ,
  -- Why we never asked, when we deliberately skipped: 'already_replied',
  -- 'thread_active', 'opted_out', 'no_phone'. Kept so a low follow-up rate can
  -- be explained rather than guessed at.
  ADD COLUMN IF NOT EXISTS followup_skipped  TEXT,
  ADD COLUMN IF NOT EXISTS outcome           TEXT
                             CHECK (outcome IN ('helped', 'not_helped', 'no_response')),
  ADD COLUMN IF NOT EXISTS outcome_at        TIMESTAMPTZ,
  -- Free text when they answer with prose instead of a keyword. The keyword is
  -- the measurement; this is the part worth reading.
  ADD COLUMN IF NOT EXISTS outcome_note      TEXT;

-- The follow-up cron scans for sent answers old enough to ask about.
CREATE INDEX IF NOT EXISTS idx_family_answer_jobs_followup_due
  ON family_answer_jobs (sent_at)
  WHERE status = 'sent' AND followup_sent_at IS NULL;

-- Matching an inbound HELPED / NOTYET reply back to the question it answers.
CREATE INDEX IF NOT EXISTS idx_family_answer_jobs_awaiting_outcome
  ON family_answer_jobs (phone_last10, followup_sent_at DESC)
  WHERE followup_sent_at IS NOT NULL AND outcome IS NULL;

COMMENT ON COLUMN family_answer_jobs.outcome IS
  'Did the answer help? Set from a keyword reply to the 7-day follow-up, or to no_response when the follow-up ages out unanswered. The engine''s only real quality signal besides draft-vs-sent edit distance.';
