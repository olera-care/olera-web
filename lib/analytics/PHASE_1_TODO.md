# Provider Analytics — Phase 1 TODO

Items deferred from Phase 0 instrumentation. Each entry has a one-line "why deferred" so future-you can judge priority without re-deriving context.

Strategy doc: https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f
Phase 0 plan: `plans/provider-analytics-phase-0-instrumentation-plan.md`

## Event capture

- **`search_impression`** — log every provider card *rendered* in a search/browse result (not just clicked). High volume per page-load (10–50 cards each); needs design for batching to avoid hammering `/api/activity/track`. Defer until we have real data and know the volume profile.
- **`dwell_time`** — measure how long care seekers stay on a provider page. Requires `beforeunload` + visibility API + duration math. Worth doing once we have a baseline page_view count to compare against.
- **`referrer_source` enrichment** — currently we capture domain-only referrer. Phase 1 should parse UTM params, classify Google/Bing/social, and detect organic vs paid. Useful for funnel attribution.

## CTA tracking on the public provider page

Phase 0 wired only `cta_click_public` for the Save button. The bigger components were left with `// TODO Phase 1:` markers because they need careful threading rather than drop-in tracking:

- **`components/providers/ConnectionCardWithRedirect.tsx`** → wire `cta=contact` at the inner `ConnectionCard`'s form-open and submit-attempt boundaries (not just on success — that's already covered by `lead_received` server-side).
- **`components/providers/MobileStickyBottomCTA.tsx`** → wire `cta=contact` for the Connect button, `cta=phone` for the `PhoneButton` reveal, and any Share affordances on the mobile sticky surface.

The funnel insight these unlock: views → cta-clicks → submitted-leads. High drop-off between cta-click and submission means the form is broken; high drop-off between view and cta-click means the page isn't selling.

## Search-click enrichment

`components/browse/BrowseCard.tsx` currently fires `search_click` with only `metadata.source` (inferred from path). Phase 1 should thread two more props from the rendering parents:

- **`position`** — the card's index in the results list (1, 2, 3…). Needed for rank-vs-conversion analysis.
- **`query`** — the search terms / active filters that produced this list. Needed for query-intent analysis.

Both are parent-level concerns; the card doesn't know them today. Add as optional `BrowseCardProps`.

## Aggregation cron robustness

- **Discriminate provider-actor vs anonymous page_views.** `event_type='page_view'` lives in BOTH `PROVIDER_EVENT_TYPES` and `ANONYMOUS_EVENT_TYPES`. Today only the anonymous branch writes them, but if any future code logs provider-actor page_views to the same table, the cron will conflate them. Currently the cron filters by `metadata->>'session_id' IS NOT NULL` (anonymous events carry session_id; provider events don't), so this is already handled — but it's a load-bearing implicit contract. Make explicit by adding an `actor_type` column to `provider_activity` and filtering by it.
- **Bot rejection counter persistence.** `lib/analytics/bot-filter.ts` keeps `botRejectsToday` in module-level memory. On Vercel with multiple lambdas/regions, this undercounts globally and resets on cold start. Promote to a KV-backed counter (Vercel KV / Upstash) once we care about a precise number.

## Data retention

- **90-day cleanup cron for raw `provider_activity`.** Aggregation tables stay indefinite (small, denormalized, useful for trends), but raw events should age out. Documented as policy in the Phase 0 privacy review; build the cron in Phase 1.

## API hardening

- **Rate limit `/api/activity/track`.** Today the anonymous branch accepts unauthenticated POSTs with no rate limit (mirrors the pre-existing endpoint behavior). If we see abuse pre-Phase-1, add a Vercel Edge rate limit (cheap fast-follow). Ten requests per minute per IP is a reasonable starting point — anything more probably isn't a real care seeker.

## Database access for the provider dashboard

- **Provider-owner RLS policies** on `provider_page_view_stats` and `city_category_view_benchmarks`. Phase 0 leaves them service-role only. Phase 1 should let an authenticated provider read rows for *their own* `provider_id` (joined through `business_profiles.account_id` → `accounts.user_id`). Without this, the dashboard endpoint must use the service role for every read — workable but coarse.

## Other

- **Bot filter on staging vs prod.** `isbot` ships on the latest `5.x`. If false positives appear in staging logs, tune via Olera-specific allowlist (e.g., our own monitoring). Don't loosen the filter generally — honest numbers are brand-defining.
- **Onboard-page analytics teaser card.** This is the actual Phase 1 deliverable, not a deferred Phase 0 item. Out of scope here. See plan + strategy doc.
