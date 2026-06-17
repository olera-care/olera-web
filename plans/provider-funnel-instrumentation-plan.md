# Plan: Provider funnel instrumentation (Find Families / Your Market / Managed Ads)

Created: 2026-06-14
Status: In progress

## Goal
Replicate the old Find Families measurement (event stream → provider_activity → Activity Center + selective Slack) for the reworked IA, instrumenting the surfaces that are now uninstrumented (the managed-ads funnel + Your Market). "See everything" — generous Slack per TJ; tune later.

## Mechanics (reuse existing rails)
client `trackProviderEvent()` → POST `/api/activity/track` → `provider_activity` row → Activity Center label (`lib/activity/provider-categories.ts`) + per-event Slack conditional in the track route. New event_types need BOTH the app allowlist (`PROVIDER_EVENT_TYPES`) AND the DB CHECK extended (migration) — the 7-hour lesson.

## New events (need migration 105)
- `managed_ads_cta_clicked` `{ source: dashboard_card | ff_pitch | ff_banner }` — Slack ✓
- `managed_ads_boost_viewed` `{ state: gate|apply|in_motion, completeness }` — Slack ✓
- `managed_ads_requested` `{ setup_week, channel }` — Activity Center entry (Slack already via slackAdBoostRequested in the request route; no double-ping)
- `your_market_viewed` `{ covered }` — Slack ✓
- `your_market_playbook_clicked` `{ item }` — Slack ✓

## No-migration changes
- Relabel `market_diagnostic_viewed_no_leads` → "Saw the managed-ads pitch" (Activity Center label only; keeps firing on FF no-leads = pitch shown).
- (FF leads-vs-pitch split is already answered: pitch = market_diagnostic_viewed_no_leads fires; leads = matches_page_viewed without it. Not adding state metadata to avoid mount-timing risk.)

## Activity Center grouping
- "Finding families" (outbound): keep matches_page_viewed/card_clicked/message_generated/outreach_sent.
- NEW "Growth" category: market_diagnostic_viewed_no_leads, market_outreach_status_updated, managed_ads_*, your_market_*.

## Slack
4 new builders mirroring slackHeroCtaClicked style: slackManagedAdsCtaClicked, slackBoostViewed, slackYourMarketViewed, slackYourMarketPlaybookClicked. Provider display fields passed via metadata from the client (same as slackMarketDiagnosticNoLeads).

## Tasks
1. Migration 105 — extend provider_activity CHECK with the 5 new events.
2. track route — add 5 to PROVIDER_EVENT_TYPES + 4 Slack conditionals.
3. lib/slack.ts — 4 new builders.
4. lib/analytics/track-provider-event.ts — shared client helper.
5. provider-categories.ts — relabel + 5 new labels + "growth" category.
6. Wire surfaces (prop-drill providerId where needed):
   - BoostCard (dashboard) → cta_clicked source=dashboard_card
   - ManagedAdsPitch (FF no-leads, when ctaHref) → cta_clicked source=ff_pitch
   - ManagedAdsCTA (FF has-leads banner) → cta_clicked source=ff_banner
   - boost page → boost_viewed on state resolve; managed_ads_requested on submit success
   - /provider/market page → your_market_viewed
   - FindFamiliesMarketView → MarketDiagnostic → PlaybookAction → playbook_clicked {item}

## Honest framing
Click/view events are intent; the only confirmed conversions stay the ad_campaign_requests row + benefits_completed delivery.
