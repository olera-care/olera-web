-- Rename the "both" ad channel to the precise "google_meta".
--
-- "both" says how many channels, not which ones. It was misread in conversation
-- on 23 Sep 2026 as meaning "launch the Nextdoor ads" on rows being moved OFF
-- Nextdoor, which is the opposite of what it meant. It is also fragile rather
-- than merely vague: the moment a third channel exists, "both" is wrong instead
-- of unclear.
--
-- 'both' is deliberately LEFT in the CHECK. Rows written by an older deploy
-- during the rollout must not fail an insert, and the application normalises it
-- to 'google_meta' on read (normalizeBoostChannel in lib/ad-boost/boost-state).
-- It can be dropped once no row has carried it for a full release cycle.

alter table ad_campaign_requests
  drop constraint if exists ad_campaign_requests_channel_check;

alter table ad_campaign_requests
  add constraint ad_campaign_requests_channel_check
  check (
    channel is null
    or channel = any (array['google'::text, 'meta'::text, 'google_meta'::text, 'both'::text, 'nextdoor'::text])
  );

update ad_campaign_requests
set channel = 'google_meta'
where channel = 'both';
