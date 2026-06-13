# Plan: Provider Paid Ad Boost — Managed Lead-Gen (Concierge v1)

Created: 2026-06-13
Status: Not Started

## Goal
Let an eligible provider request a done-for-you external ad campaign (Google/Meta) that drives families to their Olera Door B intake — gated on profile completeness, scheduled into a concierge setup window, with attribution wired so we can prove ROI before automating or self-serving.

## Strategic guardrails (locked in exploration)
- **External ads only.** Olera runs Google/Meta campaigns pointing to the provider's Olera page. We do **NOT** touch internal browse ranking — that collides with the resolved 2026-06-08 "no pay-to-win rank" decision (`project_engagement_reframe`).
- **Concierge, not self-serve.** Humans set up/run the actual ad campaigns. v1 builds the thin request→schedule→measure rails, not an ad-platform integration.
- **Payment is out-of-band in v1.** Stripe is inert (`lib/stripe.ts`, empty `PRICE_IDS`). Invoice manually for the pilot. Building checkout now violates build-value-first (`feedback_build_value_first_gate_later`) — prove ROI first, gate later.
- **Land on Door B**, not the bare profile. `BenefitsDiscoveryModule` produces fully-enriched leads (`project_door_a_vs_door_b_dilemma`); paid traffic deserves the qualified lane.

## Success Criteria
- [ ] A provider below the completeness threshold sees what's missing (deep-linked to editors) and **cannot** submit a campaign request.
- [ ] A provider at/above threshold can submit a request and pick a setup week ("select next week").
- [ ] Each submission notifies the concierge team (Slack) and lands in an admin queue with provider + completeness + chosen week + status.
- [ ] Leads arriving from a managed campaign are tagged with the campaign and counted as server-confirmed connections (`seeker_activity`), viewable per-campaign.
- [ ] No internal browse ranking is altered anywhere.

## The completeness gate (reuse, don't rebuild)
`calculateProfileCompleteness(profile, metadata, reviews?, responseRate?)` already returns `{ overall, sections[] }` with 9 weighted sections (`lib/profile-completeness.ts:217`). Already consumed by `components/provider-dashboard/DashboardPage.tsx`. Reuse it; the gate is just `overall >= THRESHOLD`. Note: Response-Rate section is N/A (excluded, denom → 88) when a provider has received no questions — `overall` already accounts for this, so no special handling needed.

## Tasks

### Phase 1: Eligibility + provider-facing apply flow
- [x] 1. Eligibility helper — DONE (`lib/ad-boost/eligibility.ts` pure evaluator + `eligibility.server.ts` authoritative loader; threshold 70; typechecked)
      - Build `lib/ad-boost/eligibility.ts`: given a providerId, load profile + metadata + reviews + response-rate inputs (same way DashboardPage assembles them), call `calculateProfileCompleteness`, return `{ overall, eligible, missingSections }` where `missingSections` are sub-100 sections sorted by weight. Define `AD_BOOST_THRESHOLD` (decision: start at 70).
      - Files: `lib/ad-boost/eligibility.ts` (new); reference `lib/profile-completeness.ts`, `components/provider-dashboard/DashboardPage.tsx` (for how inputs are gathered)
      - Verify: unit-call with a known complete vs thin provider returns expected eligible/missing.
- [x] 2 + 3. Boost surface + gated apply UI — DONE (decision: **new `/provider/boost`**, Pro page left as-is per TJ)
      - `app/provider/boost/page.tsx`: external-managed-ads value prop (explicitly NOT internal rank). Reads authoritative state from `GET /api/provider/ad-boost/request`. Three states: (a) **gate** when <70% — completeness % + progress hairline + missing sections sorted by weight, each deep-linked (`/provider?edit=…`, or `/provider/reviews` · `/provider/qna`); (b) **apply** when ≥70% — setup-week picker (next 4 Mondays) + channel preference (Google/Meta/Both) + submit; (c) **in-motion** when an open request exists. Inline submit error feedback; 409 folds the existing request into view. TZ-safe local date handling. Typechecked.
      - Entry point: `components/provider-dashboard/BoostCard.tsx` — a completeness-aware CTA on the provider dashboard left column (mobile + desktop), hidden in preview mode. Links to `/provider/boost`. (TJ chose dashboard CTA over global nav.)
      - Auth: `/provider/boost` registered in `app/provider/layout.tsx` HUB_ROUTES + isPublicRoute exclusion so it's auth-gated like other hub routes.
      - Migration 104 APPLIED to Supabase (TJ, 2026-06-13).
- [x] 4. Campaign request submission + concierge notify — DONE
      - Migration `supabase/migrations/104_ad_campaign_requests.sql` (TEXT+CHECK status, RLS service-role-only, mirrors 097). **NOT YET APPLIED to Supabase — ops step.**
      - `app/api/provider/ad-boost/request/route.ts`: POST (server-side 70% gate via `loadAdBoostEligibility`, validates setup week, blocks duplicate open requests, inserts, awaits Slack) + GET (eligibility + latest request for the UI).
      - `slackAdBoostRequested` builder added to `lib/slack.ts`. All typechecked.

### Phase 2: Concierge admin queue + attribution
- [x] 5. Admin campaign queue — DONE
      - `app/api/admin/ad-boost/route.ts`: GET (list, newest-first) + POST (update status/channel/campaign_tag/note/setup-week; admin-gated; auto-sets campaign_tag=id when going live without one).
      - `app/admin/ad-boost/page.tsx`: per-request card with status/channel/tag/note editing, a status badge, and a **copy-ready UTM landing URL** (`/provider/<slug>?utm_source=olera_managed&utm_campaign=<tag>`) to paste into Google/Meta.
      - Linked from `components/admin/AdminSidebar.tsx` (Operations → Ad Boost). Auth via existing admin layout + route guards.
- [x] 6. Campaign attribution plumbing — DONE
      - CORRECTION: Door B submits to `/api/benefits/save-results` (not connections/request — that's Door A), which already writes a `seeker_activity` `benefits_completed` row with a `metadata` JSONB. Attribution rides there — same event Phase 3 ROI reads. No new columns, no referrer changes needed.
      - `lib/ad-boost/utm.ts` (`readUtmParams`, reads `window.location.search` to avoid Suspense bailout) → both `BenefitsDiscoveryModule.tsx` + `.empathic.tsx` pass `utmSource`/`utmCampaign` in the save-results payload → `save-results/route.ts` persists them into the `benefits_completed` metadata (`utm_source`, `utm_campaign`).
      - Query later: `SELECT metadata->>'utm_campaign', COUNT(*) FROM seeker_activity WHERE event_type='benefits_completed' AND metadata->>'utm_source'='olera_managed' GROUP BY 1`.
      - LIMITATION: same-page capture only (no sessionStorage first-touch persistence) — fine for ad-click→convert; lost if the family navigates away and back.

### Phase 3: ROI reporting (thin) — DONE
- [x] 7. Per-campaign results
      - `lib/ad-boost/delivered.server.ts` — `countDeliveredByCampaign(db, tags)`: counts `benefits_completed` seeker_activity events scoped to `utm_source=olera_managed`, grouped by `utm_campaign` tag. Server-confirmed conversions, not clicks.
      - Admin queue: each request card shows an "N delivered" pill (when a campaign_tag is set).
      - Provider `/provider/boost` in-motion state: when live + delivered>0, shows "N families reached out so far" with a link to their leads. GET route returns `delivered`.
      - All typechecked. Same-page UTM capture limitation (Phase 2) applies.

## Risks
- **Scope explosion into an ad platform.** Mitigation: concierge — no Google/Meta API integration, no automated bidding/management in v1. Humans run campaigns.
- **Charging before proving value** (conflicts with build-value-first). Mitigation: out-of-band pilot pricing + Phase 3 ROI reporting before any Stripe/self-serve.
- **Off-strategy internal-rank promise.** The existing Pro page advertises "Priority Search Placement." Must reframe to external ads only; do not wire any boost into `BrowseClient` ranking.
- **Attribution leakage.** Email/privacy clients strip referrers; rely on UTM params on the landing URL (store first-touch), not referrer headers, as the reliable signal. Avoid `token`/`session`/`key` param names in any emailed links (`feedback_email_param_names`).
- **DB CHECK constraints.** Any new event_type or status enum needs a matching migration or inserts fail silently (`feedback_event_allowlist_needs_db_migration`).

## Open decisions — RESOLVED (TJ, 2026-06-13)
1. **Threshold** — ✅ **70%** of `profile-completeness` overall.
2. **Storage** — ✅ **dedicated `ad_campaign_requests` table** (clean admin queue + per-campaign ROI).
3. **Provider-facing ROI** — ✅ **yes, build it** — provider sees a "your campaign delivered N families" summary in v1 (not admin-only).
4. **Pilot anchor** — ✅ **provider-agnostic** — no Comfort Keepers hardcoding; pick the anchor later.

## Notes
- This is the productized, paid evolution of the Comfort Keepers lead-gen ask and the "SEMrush for senior-care acquisition" engine (`project_market_diagnostic`). The Comfort Keepers memory said "learning engagement, not charging" — this plan introduces paid, so flag the shift when proposing to them.
- Rails that already exist and should be reused, not rebuilt: completeness scorer, Door B intake, `connections/request` delivery, `seeker_activity` events, `lib/analytics/referrer` classification, provider dashboard `?edit=` deep-links, admin page patterns.
