-- Provider Paid Ad Boost — "standing order" model.
--
-- Previously a provider had to clear the 70% completeness gate BEFORE they
-- could request a campaign — the boost page slammed a door and handed them a
-- chore list, killing the momentum the funnel just built. New model: a
-- provider can queue a campaign (pick week + channel) at ANY completeness. If
-- they're under 70% the request lands as `pending_profile` (queued, quiet — the
-- concierge team is NOT paged yet). The moment they cross 70% (re-checked when
-- they re-load /provider/boost), it auto-promotes to `requested` and pings the
-- team. Profile completion thus RELEASES a campaign they already committed to,
-- rather than gating entry.
--
-- This adds the new `pending_profile` value to the status CHECK. Keep the app
-- allowlist in sync (the status unions in app/provider/boost/page.tsx and the
-- request route) — an unlisted status value fails the insert silently
-- (memory feedback_event_allowlist_needs_db_migration / feedback_schema_text_not_enum).

ALTER TABLE ad_campaign_requests
  DROP CONSTRAINT IF EXISTS ad_campaign_requests_status_check;

ALTER TABLE ad_campaign_requests
  ADD CONSTRAINT ad_campaign_requests_status_check
  CHECK (status IN ('pending_profile','requested','scheduled','live','ended','cancelled'));
