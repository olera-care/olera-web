-- Ad Boost: record the Nextdoor pilot as a first-class paid channel.
--
-- `requested_setup_week` is provider intent, not necessarily the day an ad
-- platform actually starts serving. Cross-channel tests also need the real
-- platform budget (and whether it is a daily budget or a hard lifetime cap),
-- so those operational facts live separately instead of being buried in the
-- admin note.

ALTER TABLE ad_campaign_requests
  DROP CONSTRAINT IF EXISTS ad_campaign_requests_channel_check;

ALTER TABLE ad_campaign_requests
  ADD CONSTRAINT ad_campaign_requests_channel_check
  CHECK (channel IS NULL OR channel IN ('google', 'meta', 'both', 'nextdoor'));

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS flight_start_date DATE,
  ADD COLUMN IF NOT EXISTS ad_budget_cents INTEGER
    CHECK (ad_budget_cents IS NULL OR ad_budget_cents > 0),
  ADD COLUMN IF NOT EXISTS ad_budget_type TEXT
    CHECK (ad_budget_type IS NULL OR ad_budget_type IN ('daily', 'lifetime'));

ALTER TABLE ad_campaign_requests
  DROP CONSTRAINT IF EXISTS ad_campaign_requests_budget_pair_check;

ALTER TABLE ad_campaign_requests
  ADD CONSTRAINT ad_campaign_requests_budget_pair_check
  CHECK (
    (ad_budget_cents IS NULL AND ad_budget_type IS NULL)
    OR (ad_budget_cents IS NOT NULL AND ad_budget_type IS NOT NULL)
  );

COMMENT ON COLUMN ad_campaign_requests.flight_start_date IS
  'First serving day from the ad platform. Distinct from the provider-chosen requested_setup_week.';

COMMENT ON COLUMN ad_campaign_requests.ad_budget_cents IS
  'Budget configured in the ad platform, in cents. Pair with ad_budget_type; this is not actual spend.';

COMMENT ON COLUMN ad_campaign_requests.ad_budget_type IS
  'How the ad-platform budget is enforced: daily or lifetime. Lifetime is a hard flight cap.';
