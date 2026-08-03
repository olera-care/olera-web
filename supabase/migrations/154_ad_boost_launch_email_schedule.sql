-- Migration: Ad Boost scheduled launch email
--
-- Flipping a campaign to `live` fires the "Your Find Families campaign is
-- live" provider email immediately — which lands at whatever hour the admin
-- happens to flip it (TJ operates from Thailand, so that's often the middle
-- of the US night). Adds an optional send time so the flip can happen at the
-- operator's convenience while the email waits for the provider's morning;
-- the hourly ad-boost-launch-scheduler cron delivers it once due and clears
-- this column. Same pattern as the benefits navigator scheduled sends.
--
-- Apply via Supabase dashboard (NOT CLI).

ALTER TABLE ad_campaign_requests ADD COLUMN IF NOT EXISTS launched_email_scheduled_at TIMESTAMPTZ;

COMMENT ON COLUMN ad_campaign_requests.launched_email_scheduled_at IS
'When to send the campaign-launched provider email (UTC; picked as US Eastern in the admin UI). NULL = send immediately on the live flip. Cleared by the cron after the send fires; ignored once launched_email_sent_at is set.';
