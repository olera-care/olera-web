-- Migration: allow 'paid_social' as a growth traffic channel
--
-- WHY
-- `trafficChannel()` in app/api/activity/track-growth/route.ts was extended to
-- classify managed paid-social arrivals (Nextdoor) as 'paid_social'. Before
-- that, every Nextdoor landing fell through to the referrer check and was filed
-- as 'direct' or 'referral' -- 140 landings in the Aug 2026 flights alone.
--
-- The CHECK constraint from migration 174 was never widened to match, so
-- 'paid_social' violates it. The insert in that route logs and swallows its
-- error, which means the violation does not surface as a failure: the ENTIRE
-- page_landed row is rejected and the landing simply disappears. Because
-- traffic_channel is only set for page_landed, it is exactly the landings that
-- vanish -- the denominator for every rate in the campaign funnel.
--
-- Five Nextdoor campaigns tagged utm_medium=paid_social run Sep 1-7 2026.
-- Without this, their landings are silently dropped and the Nextdoor-vs-Meta
-- comparison has no data to rest on.
--
-- Apply via the Supabase dashboard BEFORE deploying the track-growth change.
-- Idempotent: safe to re-run.

ALTER TABLE growth_attribution_events
  DROP CONSTRAINT IF EXISTS growth_attribution_events_traffic_channel_check;

ALTER TABLE growth_attribution_events
  ADD CONSTRAINT growth_attribution_events_traffic_channel_check CHECK (
    traffic_channel IS NULL OR traffic_channel IN (
      'organic_search',
      'paid_search',
      'paid_social',
      'direct',
      'referral',
      'social',
      'ai_chat',
      'olera_internal',
      'other'
    )
  );
