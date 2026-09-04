-- Migration: Per-campaign case log for Ad Boost
--
-- Context: Ad Boost has 19 migrations and not one of them records what happened
-- to a campaign after setup. Everything is columns on a single `ad_campaign_requests`
-- row, and `admin_note` is one TEXT blob written at build time and never touched
-- again. The cost of that showed up on 2026-09-04: reconstructing why one campaign
-- went from 3 inquiries at ~$12 each to zero impressions took a full manual read of
-- the Google Ads UI, and two facts that would have explained it were already sitting
-- in per-campaign notes that nobody had connected.
--
-- This table makes a campaign a case with a history instead of a row with a status.
--
-- Two design decisions worth keeping:
--
--  1. Keyed on BOTH request_id and google_campaign_id. A provider's story often
--     spans several campaign objects — Franchil ran as 23961292547 in June and was
--     rebuilt as 24166094865 in August. Querying by google_campaign_id keeps flights
--     linked when the Olera-side row is replaced.
--
--  2. A `tweak` entry cannot be saved without declaring expected_signal and
--     review_after (see the CHECK below). That is the difference between a log and a
--     lab notebook. The 23 August rebuild would have been visible on 26 August rather
--     than 4 September if someone had had to write down what they expected it to do.
--
-- occurred_at is separate from created_at so historical entries can be backfilled
-- without pretending they were written at the time.
--
-- Apply via Supabase dashboard (NOT CLI), per project convention.

CREATE TABLE IF NOT EXISTS ad_campaign_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Either may be null: an entry can predate the Olera row, or describe a Google
  -- campaign we never tracked. At least one must be present (see CHECK below).
  request_id         UUID REFERENCES ad_campaign_requests(id) ON DELETE CASCADE,
  google_campaign_id TEXT,
  campaign_tag       TEXT,

  entry_type         TEXT NOT NULL,
  summary            TEXT NOT NULL,
  detail             TEXT,

  -- Structured before/after for tweaks. Free-form so it can hold keyword lists,
  -- budget values, negative-list membership, whatever the change touched.
  before_state       JSONB,
  after_state        JSONB,

  -- The lab-notebook fields. Required on tweaks.
  expected_signal    TEXT,
  review_after       TIMESTAMPTZ,
  reviewed_at        TIMESTAMPTZ,
  review_outcome     TEXT,

  -- Point-in-time metrics, so an entry carries the numbers as they stood.
  metrics_snapshot   JSONB,

  occurred_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author             TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ad_campaign_log_entry_type_check CHECK (
    entry_type IN (
      'setup',          -- campaign built: config as launched
      'hypothesis',     -- what we expect this campaign to do and why
      'tweak',          -- a change we made (requires expected_signal + review_after)
      'observation',    -- something we noticed, including diagnosis work
      'check_in',       -- a scheduled look, with what we found
      'alert',          -- something the system flagged
      'provider_comms', -- what the provider was told, and when
      'outcome'         -- how a flight ended, or what the provider reported
    )
  ),

  -- A tweak with no stated expectation is how a change gets forgotten.
  CONSTRAINT ad_campaign_log_tweak_requires_review CHECK (
    entry_type <> 'tweak'
    OR (expected_signal IS NOT NULL AND review_after IS NOT NULL)
  ),

  -- An entry has to attach to something.
  CONSTRAINT ad_campaign_log_needs_subject CHECK (
    request_id IS NOT NULL OR google_campaign_id IS NOT NULL
  )
);

-- Admin-only, same as ad_campaign_requests (migration 104): RLS on, no policies.
-- The server API reads and writes with the service-role client, which bypasses RLS.
-- Everything else — including the anon key that ships in the browser — gets nothing.
-- This table holds provider names, spend, and candid internal assessments; it must
-- not be readable through PostgREST.
ALTER TABLE ad_campaign_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS ad_campaign_log_request_idx
  ON ad_campaign_log (request_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS ad_campaign_log_google_campaign_idx
  ON ad_campaign_log (google_campaign_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS ad_campaign_log_tag_idx
  ON ad_campaign_log (campaign_tag, occurred_at DESC);

-- Powers the "overdue check-in" badge on the queue: tweaks past their review date
-- that nobody has come back to.
CREATE INDEX IF NOT EXISTS ad_campaign_log_pending_review_idx
  ON ad_campaign_log (review_after)
  WHERE reviewed_at IS NULL AND review_after IS NOT NULL;

COMMENT ON TABLE ad_campaign_log IS
  'Append-oriented case history per Ad Boost campaign. One row per thing that happened: setup, hypothesis, tweak, observation, check-in, alert, provider comms, outcome. Replaces the single ad_campaign_requests.admin_note blob, which was written once at build time and never updated.';

COMMENT ON COLUMN ad_campaign_log.google_campaign_id IS
  'Google Ads campaign ID. Set this even when request_id is present — a provider''s story can span multiple campaign objects (rebuilds), and this is what keeps the flights linked.';

COMMENT ON COLUMN ad_campaign_log.expected_signal IS
  'What we expect this change to produce, and roughly when. Required on tweaks. A change with no stated expectation cannot be evaluated later.';

COMMENT ON COLUMN ad_campaign_log.review_after IS
  'When to come back and check the tweak worked. Required on tweaks. Drives the overdue-check-in badge in the admin queue.';

COMMENT ON COLUMN ad_campaign_log.occurred_at IS
  'When the thing actually happened. Separate from created_at so history can be backfilled honestly rather than appearing to have been written at the time.';
