# Plan: Provider Analytics — Phase 1 (Provider-Facing Surfaces)

Created: 2026-04-22
Status: Not Started
Strategy doc: https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f
Phase 0 plan: `plans/provider-analytics-phase-0-instrumentation-plan.md` (SHIPPED, PR #620)

## Goal

Build the actual provider-facing product: the onboard-page analytics teaser, the persistent dashboard providers return to, and the weekly digest email that pulls them back. Phase 0 captures the signal; Phase 1 turns it into a product experience.

## Why now, not in 3 weeks

Original plan said wait 2–3 weeks for real data before Phase 1. TJ's call: start Phase 1 now so the surfaces are designed, built, tested, and ready to flip from placeholder → real data the moment the distribution is there. We build in parallel with data collection rather than sequentially.

What this means:
- **Phase 1A (design + build)** uses the real `/api/provider/analytics` endpoint but against the thin data we have today. For providers with few or zero views, the copy and UX must gracefully handle that (pipeline-opportunity framing, not "0 views" naked).
- **Phase 1B (launch polish)** switches in the data-derived triage thresholds once the distribution stabilizes. Same code, different constants.

## Success Criteria

- [ ] A provider clicking an email notification sees an analytics teaser card on `/provider/[slug]/onboard` with a grounded pipeline-opportunity stat, positioned above a de-emphasized reviews CTA.
- [ ] The teaser card has a clear "see your full analytics" affordance that pulls into a persistent dashboard at `/portal/analytics`.
- [ ] The dashboard shows historical trend, engagement funnel, source attribution, and peer-cohort framing (pipeline, not competitive).
- [ ] A weekly digest email (Mon morning) is sent to every claimed provider with at least one event in the last week — the return path that makes analytics a habit, not a moment.
- [ ] Traffic-tier triage routes different experiences: low-traffic providers see pipeline-opportunity copy; medium/high see richer funnels and trends.
- [ ] Reviews CTA lives below analytics and uses data-contextualized copy where possible ("Your page has 42 views but 1 review — more reviews typically lift visibility…").
- [ ] No provider-facing "0 views" naked state ever rendered.
- [ ] Ships behind a feature flag so we can A/B the new onboard experience against the current "Get more reviews" CTA.

## Design Decisions (carried forward from strategy doc)

These are the five calls TJ made during the strategy conversation. Everything here flows from them.

1. **Primary frame: pipeline-opportunity, not peer comparison.** "47 families searched for assisted living near you this month" beats "providers in your city average 18 views." Kinder to the long tail of low-traffic providers.
2. **Both onboard card AND dashboard.** Card is the hook + overview. Dashboard is the depth. Not either/or.
3. **Reviews co-exists, sequenced below analytics.** Especially prominent for providers with zero reviews. Two-way door: if dashboard adoption is real, we can graduate reviews into it later.
4. **Return path is committed — weekly digest email.** Without it, analytics is a one-shot. With it, it's a habit.
5. **Triage for low / medium / high-traffic providers.** Different copy, different visual density, different CTAs. Thresholds are data-derived (the one place we DO want to wait for distribution data, but placeholder cutoffs are fine for build phase).

## Key Open Question (from strategy doc, still unanswered)

**What is L3 — the eventual monetizable layer?** Not blocking Phase 1 (free tier only), but worth keeping in view as we design. Candidates per strategy doc:
- Lead-quality scoring / qualified-lead forwarding
- Demographic insight on viewers (anonymized)
- Competitor benchmarking
- Ad-style boosts
- Response-quality AI coaching
- Direct booking / intake forms
- Staffing (interlock with Logan's TAMU pilot)

Phase 1 should NOT gate anything yet. Free-tier must be delightful and complete (Wispr/Airtable principle). Paywall conversation reopens after 6+ months of engagement data.

---

## Tasks

Tasks are dependency-ordered. Each is sized for one focused session except where noted.

### Phase 1A · Data layer (week 1, unblocks all UI)

#### 1. [ ] `/api/provider/analytics` endpoint
Central provider-facing data endpoint. Consumed by both the onboard card and the dashboard. Must be robust to sparse data.

**Returns:**
```json
{
  "provider_id": "aggie-assisted-living",
  "provider_name": "...",
  "city": "College Station",
  "state": "TX",
  "category": "assisted_living",
  "window": "30d",

  "views": {
    "this_period": 4,
    "prior_period": 2,
    "delta_pct": 100,
    "lifetime": 47,
    "trend": [{"date": "2026-04-15", "count": 0}, ...]
  },

  "funnel": {
    "page_views": 4,
    "cta_clicks": 2,
    "questions_received": 1,
    "leads_received": 0,
    "reviews_received": 0
  },

  "sources": {
    "direct": 2,
    "search": 1,
    "browse": 1,
    "other": 0
  },

  "peer_context": {
    "cohort_description": "assisted living providers in College Station",
    "cohort_size": 12,
    "avg_views": 6.5,
    "p50_views": 5,
    "p90_views": 18
  },

  "pipeline_opportunity": {
    "description": "Families searched for assisted living near College Station this month",
    "local_demand_count": 47,
    "reached_your_page_count": 4
  },

  "tier": "low" | "medium" | "high",
  "tier_thresholds": {"low_max": 5, "medium_max": 25},

  "reviews_state": {
    "count": 1,
    "has_reviews": true,
    "last_review_at": "2026-04-10T..."
  }
}
```

- Auth: authenticated provider, RLS-gated to only their own provider_id (see task 2).
- Reads `provider_activity` directly for current-window data + aggregation tables for historical/peer benchmarks once cron has run.
- Handles sparse-data gracefully: never returns negative deltas, never returns dividing-by-zero peer ratios.
- **Files:** `app/api/provider/analytics/route.ts` (new)
- **Depends on:** Phase 0 (shipped). Needs at least one cron run for peer data (tomorrow 8 AM UTC).
- **Verify:** `curl` as an authenticated provider against their own slug → full response; against another provider's slug → 403.

#### 2. [ ] RLS policies so providers can read their own stats
Right now aggregation tables are service-role only. Phase 1 needs provider-owner read.

- **Files:** `supabase/migrations/046_provider_analytics_owner_rls.sql` (new)
- **Policy:** authenticated user can SELECT rows where `provider_id` matches a `business_profiles.slug` owned by their `account_id`.
- **Depends on:** none
- **Verify:** With JWT of a signed-in provider, `SELECT * FROM provider_page_view_stats WHERE provider_id='their-slug'` succeeds; for another provider's slug returns 0 rows.

#### 3. [ ] Pipeline-opportunity query (local-demand count)
The "47 families searched for assisted living near you" number needs a real source.

- **Data source:** Count `search_click` + `page_view` events across ALL providers in the same (city, category) cohort in the window. Approximates "families interested in this cohort."
- **Alternative if numbers look weird:** count `seeker_activity` events scoped by related_provider category/state.
- **Files:** extend `/api/provider/analytics` endpoint; no new schema.
- **Verify:** For a College Station assisted-living provider, the number roughly matches what `/admin/analytics` shows for all College Station assisted-living providers combined.

#### 4. [ ] Triage tier classification
Logic that picks `tier: "low" | "medium" | "high"` based on 30-day views.

- **Placeholder thresholds:** low_max=5, medium_max=25. These are guesses until distribution data firms up (Phase 1B task).
- **Implemented in:** `lib/analytics/triage.ts` (new), consumed by `/api/provider/analytics` and by the email digest cron.
- **Depends on:** 1
- **Verify:** Unit-testable pure function — `classifyTier(views: number, thresholds): Tier`.

### Phase 1B · Onboard teaser card (week 1–2)

#### 5. [ ] Design doc for the analytics teaser card
Before writing code, pin the copy + visual for each tier. Add to the plan file (this doc) as an appendix or to a new `designs/` artifact.

- **What:** Three card variants (low / medium / high). Each with:
  - Headline metric (pipeline opportunity for low, personal-view-count for medium+high)
  - Secondary line (delta, context, or "families searched…")
  - Optional: tiny sparkline for medium/high
  - CTA: "See your analytics" → `/portal/analytics`
- **Why upfront:** without locked copy, the component becomes a moving target.
- **Depends on:** 1 (so we know what data shape to design against)
- **Verify:** TJ approves copy for all three tiers.

#### 6. [ ] `<AnalyticsTeaserCard />` component
The provider-facing card. Triage-aware rendering.

- **Files:** `components/provider-onboarding/AnalyticsTeaserCard.tsx` (new)
- **Props:** `{providerId}`. Fetches `/api/provider/analytics` client-side on mount.
- **States:** loading skeleton, error silent-hide, sparse-data handling per tier.
- **Depends on:** 1, 5

#### 7. [ ] Slot the teaser card into `ProfilePreviewCard`
Replace the current reviews-primary layout with analytics-primary layout.

- **Files:** `components/provider-onboarding/ActionCard.tsx` (modify `ProfilePreviewCard` function around lines 408–632)
- **Structure after change:**
  1. Listing card (unchanged) — provider's Olera page summary
  2. **Analytics teaser (NEW)** — primary CTA
  3. Reviews CTA (moved below, de-emphasized) — especially prominent when `reviews.has_reviews === false`
  4. "View your full profile" link (unchanged)
- **Behind feature flag:** `NEXT_PUBLIC_FF_PROVIDER_ANALYTICS_ONBOARD` — toggleable so we can A/B against the old flow on staging.
- **Depends on:** 6
- **Verify:** With flag on, visit an onboard page with `?otk=...&action=question&actionId=...` — see analytics teaser above reviews. Flag off — see old behavior (reviews primary).

#### 8. [ ] Sequence reviews copy by analytics state
When the flag is on and the provider has >=N views and 0 reviews, the reviews CTA copy references their views:

> "Your page has been viewed 42 times this month but has no reviews yet. Providers with 3+ reviews typically see ~20% more family engagement."

- **Files:** `components/provider-onboarding/ActionCard.tsx` reviews-card section
- **Data:** reuse the `/api/provider/analytics` response already fetched by the teaser card (lift to a shared context or prop-down).
- **Depends on:** 7

### Phase 1C · Persistent dashboard (week 2–3)

#### 9. [ ] Route shape: `/portal/analytics` or `/provider/[slug]/dashboard` decision
One-sentence decision: where does the provider's dashboard live in the app's information architecture?

- **Options:** `/portal/analytics` (cohabits with any future portal features), `/provider/[slug]/dashboard` (stays on the provider-page URL tree), or an admin-style sidebar within an existing portal shell.
- **Pick one, write it into this plan, don't change.**
- **Depends on:** none; just decide.

#### 10. [ ] Dashboard page + layout
The persistent surface the teaser card pulls into.

- **Files:** depends on task 9
- **Sections:**
  1. Header: provider name, period picker (7d / 30d / 90d / custom)
  2. KPI row: views (this period + delta + sparkline), CTA-clicks, leads received, reviews count
  3. Pipeline chart: page_views over time, optionally stacked by source
  4. Funnel: page_views → cta_clicks → leads
  5. Peer context: "Providers like you in College Station average X views per month. You're at Y." — framed as opportunity, not competition
  6. Recent activity: last 10 question/lead events with timestamps
  7. Empty states: each section degrades gracefully when data is sparse
- **Reuse:** `<PulseHeader />` pattern for KPIs where it fits; `lib/admin-stats.ts::buildSeries` for charts.
- **Depends on:** 1, 9

#### 11. [ ] Dashboard auth gate
Must be owner-of-provider to see their dashboard. Not admin-of-Olera; not anonymous.

- **Files:** middleware and/or page-level guard
- **Check:** authenticated user has a `business_profile` with slug matching the URL (or active_profile_id matches).
- **Depends on:** 10

### Phase 1D · Weekly digest email (week 3)

#### 12. [ ] `/api/cron/weekly-provider-digest` endpoint
The return-path mechanism. Sent Monday morning to providers who had events in the prior 7 days.

- **Files:** `app/api/cron/weekly-provider-digest/route.ts` (new)
- **Behavior:**
  1. Query providers with at least one page_view or lead_received event in the last 7 days
  2. For each, fetch their analytics summary (reuse the endpoint from task 1)
  3. Compose email with headline metric + "see full dashboard" link
  4. Send via existing email infrastructure (same pattern as daily-digest cron)
- **Schedule:** add to `vercel.json`: `"0 13 * * 1"` (Monday 8 AM ET / 13:00 UTC)
- **Depends on:** 1, 9

#### 13. [ ] Email template: `providerWeeklyDigestEmail`
Warm, restrained, honest — per the Perena/editorial design memory.

- **Files:** `lib/email-templates.ts` (extend)
- **Copy per tier:**
  - Low: "3 families viewed you this week — up from 1 last week. [n] more families searched for assisted living in College Station."
  - Medium: "12 families viewed you this week — up 20%. See what's driving it →"
  - High: "42 families viewed you this week. Top source: Google search. Trending up 15% over 30 days."
- **Must include:** unsubscribe link (required for CAN-SPAM / existing email infra pattern)
- **Depends on:** 4

#### 14. [ ] Email suppression / frequency controls
Providers should be able to opt out. Existing provider email system has precedents — mirror that.

- **Files:** depends on existing pattern — likely a flag on `business_profiles.metadata.email_preferences`
- **Verify:** an opted-out provider is skipped by the cron; opted-in provider receives the email.

### Phase 1E · Launch polish (week 4 — after some data is in)

#### 15. [ ] Finalize triage thresholds from real distribution
Once ~2 weeks of data have accrued, look at the actual 30-day view histogram across claimed providers and set `low_max` / `medium_max` to natural breaks.

- **Method:** `SELECT percentile_cont(0.33, 0.67) WITHIN GROUP (ORDER BY raw_view_count) FROM provider_page_view_stats WHERE date >= now() - interval '30 days' GROUP BY provider_id` — use 33/67 as the default split, adjust by eye.
- **Files:** `lib/analytics/triage.ts` (modify the constants)
- **Depends on:** 2 weeks of Phase 0/1 data in production

#### 16. [ ] A/B rollout of the onboard card
Feature flag currently all-or-nothing. For real launch, either route a % of providers to the new flow or do a cohort-based rollout (e.g., claimed providers first, unclaimed later).

- **Files:** whatever flag system is already in the app, or GrowthBook if it's configured
- **Measurement:** `reviews_cta_clicked` + `one_click_access` rates as proxy for "engaged with the page"
- **Depends on:** 7, some data

#### 17. [ ] Kill the `/admin/analytics` sanity-check tooltip caveats
Once the bot-reject counter is promoted to something persistent (Phase 1 TODO item), drop the "per-instance" tooltip. Do the promotion as part of this phase since admin usage is picking up.

- **Files:** `lib/analytics/bot-filter.ts`, `app/api/admin/analytics/summary/route.ts`
- **Approach:** either Vercel KV, a Postgres counter row, or just skip and accept the per-instance limitation forever if we never care to bother. Lowest-priority item.

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Provider sees "0 views" naked state and bounces | Medium-High without mitigation | Tier-aware copy per Phase 1B task 5. Low-tier card leads with pipeline-opportunity, not personal count. |
| Peer benchmarks look wrong because cohort is tiny (e.g., 2 providers in a small city) | Medium | Fallback: if cohort < 5, widen to state-category. If still < 5, don't show peer context at all. |
| Weekly digest email creates spam perception | Medium | Frequency cap, clean unsubscribe, only send when there's news (at least one event in the week). |
| Reviews CTA de-emphasis kills the one thing that IS working today | Medium | Feature flag + A/B. Measure `reviews_cta_clicked` rate delta. If it drops catastrophically, promote reviews back up. |
| Dashboard RLS misconfigured, providers see each other's data | Low but CRITICAL | Task 2 RLS migration; integration test that signed-in provider A can NOT read provider B's stats. Explicit verification step. |
| L3 monetization question unanswered — we build a free dashboard with nothing ever paid | Long-term strategic | Out of scope for Phase 1. Keep the question visible; separate exploration workstream. |
| Triage thresholds set wrong, too many low-traffic providers get the "rich" experience (or vice-versa) | Medium | Placeholder thresholds pre-launch, finalize from distribution data in Phase 1E. |
| Parallel-build-with-dummy-data assumption breaks because data is thinner than expected | Low | Phase 1A and 1B don't need rich data to build; only Phase 1E needs it. Order of operations handles this. |

---

## Out of Scope (Phase 2+)

- **Monetization / paywall.** Free-tier only in Phase 1. L3 paid-layer exploration is a separate strategic workstream.
- **Demographic insights on viewers.** Even anonymized ("family in Bryan, $4–6k budget"), needs care-seeker-side data we don't collect yet.
- **Competitor benchmarking.** Deliberate — we decided pipeline-opportunity framing over peer competition.
- **Direct booking / intake forms.** Adjacent product surface.
- **Staffing integration.** Logan's TAMU pilot is separate.
- **Response-quality AI coaching.** Out of scope.
- **Provider-facing "who viewed your profile" demographic reveals.** Privacy-sensitive; deferred until Phase 2 with clear consent design.

---

## Notes for future sessions

- **Branch convention:** `feature/provider-analytics-phase-1-*` off `origin/staging`. Consider splitting into sub-branches per sub-phase (1A/1B/1C/1D) if they land in different weeks.
- **Migration application:** Supabase dashboard, not CLI.
- **Feature flag naming:** `NEXT_PUBLIC_FF_PROVIDER_ANALYTICS_ONBOARD` for the onboard card toggle. Add to `.env` docs.
- **Phase 0 data dependency:** tasks 3 and 10 benefit from cron having populated aggregation tables. First cron run is 2026-04-23 08:00 UTC.
- **Watch for on resume:** the order within Phase 1 matters. 1 (API) → 2 (RLS) → 5 (design doc) → 6+7 (teaser card) → 9+10+11 (dashboard) → 12+13+14 (email) → 15+16+17 (polish). Don't skip the design-doc step — it locks copy before build.
