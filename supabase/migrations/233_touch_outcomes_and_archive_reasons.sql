-- 233: call outcomes on the touch log, and a reason on an archived campaign.
--
-- Two small columns behind one operating change: the Ad Boost photo chase is a
-- calling motion now, and a call has to be able to end a campaign. Today an
-- archive records only that someone archived it, so "they said no" and "we
-- gave up chasing" are the same row.
--
-- Both are TEXT + CHECK, not enums — prod convention, and it keeps adding a
-- value to a one-line migration instead of a type rewrite.

-- ── The five things that actually happen on a provider call ─────────────────
-- Optional: a touch that is an email or a meeting has no outcome, and a call
-- logged before this shipped has none either. Only calls and texts set it.
ALTER TABLE provider_touches
  ADD COLUMN IF NOT EXISTS outcome TEXT;

ALTER TABLE provider_touches
  DROP CONSTRAINT IF EXISTS provider_touches_outcome_check;

ALTER TABLE provider_touches
  ADD CONSTRAINT provider_touches_outcome_check
  CHECK (
    outcome IS NULL
    OR outcome IN ('reached', 'no_answer', 'bad_number', 'callback_set', 'not_interested')
  );

COMMENT ON COLUMN provider_touches.outcome IS
  'What the call/text actually produced. NULL for channels where the question does not apply.';

-- ── Why a campaign was archived ─────────────────────────────────────────────
-- Archive already means deleted_at IS NOT NULL. This says why, and the admin
-- API turns ''not_interested'' into a provider-comms pause so a provider who
-- declined stops receiving the weekly digest and dormant re-engagement mail.
ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS archived_reason TEXT;

ALTER TABLE ad_campaign_requests
  DROP CONSTRAINT IF EXISTS ad_campaign_requests_archived_reason_check;

ALTER TABLE ad_campaign_requests
  ADD CONSTRAINT ad_campaign_requests_archived_reason_check
  CHECK (
    archived_reason IS NULL
    OR archived_reason IN ('not_interested', 'unreachable', 'stalled', 'superseded')
  );

COMMENT ON COLUMN ad_campaign_requests.archived_reason IS
  'Why this campaign left the queue. NULL on live rows and on archives predating migration 233.';

-- The queue reads archived rows newest-first and now shows the reason on each;
-- no new index needed (229 already covers deleted_at ordering).
