-- Migration: Ad Boost auto-end + scheduled wrap-up email
--
-- Ending a campaign was entirely manual: someone had to notice that
-- flight_end_date had passed and flip the status to `ended` in the admin
-- detail page, which is also what fires the "Your starter campaign is
-- complete" wrap-up email (the demand receipt + the subscribe ask). Campaigns
-- were sitting `live` for days past their flight, so the one email in the
-- journey that asks for money went out late or not at all.
--
-- Adds:
--   ended_at                          — when the campaign actually ended
--   ended_reason                      — who ended it: the concierge, or the cron
--   promo_complete_email_scheduled_at — when to send the wrap-up
--
-- The schedule column exists because "the flight ended" and "the provider
-- should read about it" are different moments. The hourly cron notices the
-- end at whatever hour it runs (often the middle of the US night), so it
-- parks the send at the next 10:15 AM ET business morning instead of firing
-- immediately. Same pattern as launched_email_scheduled_at (migration 154).
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE ad_campaign_requests ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

ALTER TABLE ad_campaign_requests ADD COLUMN IF NOT EXISTS ended_reason TEXT;

-- TEXT + CHECK rather than a Postgres enum, matching every other status-ish
-- column in this schema (adding a value stays a one-line constraint swap).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ad_campaign_requests_ended_reason_check'
  ) THEN
    ALTER TABLE ad_campaign_requests
      ADD CONSTRAINT ad_campaign_requests_ended_reason_check
      CHECK (ended_reason IS NULL OR ended_reason IN ('admin', 'flight_end'));
  END IF;
END $$;

ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS promo_complete_email_scheduled_at TIMESTAMPTZ;

COMMENT ON COLUMN ad_campaign_requests.ended_at IS
'When the campaign moved to `ended`. Set by the admin flip and by the ad-boost-end-scheduler cron; NULL for campaigns that ended before this column existed.';

COMMENT ON COLUMN ad_campaign_requests.ended_reason IS
'How the campaign ended: `admin` (a concierge flipped the status) or `flight_end` (the cron auto-ended it the morning after flight_end_date).';

COMMENT ON COLUMN ad_campaign_requests.promo_complete_email_scheduled_at IS
'When to send the promo-complete wrap-up email (UTC; a 10:15 AM ET business-morning slot). Set on the flip to `ended`; cleared by the cron once the send fires or is permanently blocked. Ignored once promo_complete_email_sent_at is set.';

-- Backfill: existing `ended` rows already had their wrap-up sent (or were
-- ended before the email existed). Stamp ended_at from updated_at so the
-- admin surfaces have something to show, and mark them `admin` — every end
-- before this migration was a human flip by definition. Leaves the send
-- schedule NULL so nothing retroactively emails.
UPDATE ad_campaign_requests
SET ended_at = COALESCE(ended_at, updated_at),
    ended_reason = COALESCE(ended_reason, 'admin')
WHERE status = 'ended';
