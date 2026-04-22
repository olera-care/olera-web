# Plan: Provider Analytics — Phase 0 (Instrumentation)

Created: 2026-04-22
Status: Not Started
Strategy doc: https://www.notion.so/34a5903a0ffe81f7ad56d6d85514d52f

## Goal

Stand up the data plumbing — schema, writers, aggregation, admin sanity-check view — so that ~3 weeks from launch we have honest, real per-provider engagement data ready to drive the Phase 1 dashboard. No provider-facing UI in this phase.

## Why this is its own phase

Three reasons:
1. **The metric doesn't exist yet.** `provider_activity.page_view` is in the schema but nothing writes to it. Without instrumentation, the Phase 1 dashboard would launch on zeros.
2. **Honest numbers are brand-defining.** Caring.com / APFM are known for inflated numbers; we explicitly want to differ. The uniqueness model and bot filter are decisions that need to be made *deliberately* before any UI.
3. **Time-to-data is the critical path.** Every day we delay capture is a day pushed back from a believable Phase 1 launch.

## Success Criteria

- [ ] Public provider page (`/provider/[slug]`) writes one `page_view` event to `provider_activity` per visitor session per day, server-deduped, bot-filtered.
- [ ] `question_received`, `lead_received`, `review_received` events are written to `provider_activity` whenever the corresponding source row is created (`provider_questions`, `connections`, `reviews`).
- [ ] `search_click` and `cta_click_public` event types exist in the schema and are written from the relevant care-seeker surfaces.
- [ ] A nightly Vercel Cron aggregates the prior day's `page_view` events into `provider_page_view_stats` (per-provider) and `city_category_view_benchmarks` (peer averages by city × category).
- [ ] An admin-only read view at `/admin/analytics` shows the data flowing — total events, unique sessions, bot-rejection counts, top providers by views, latest 50 raw events — so we can sanity-check during the wait.
- [ ] Privacy review checklist completed — no IP storage, no raw User-Agent storage, referrer sanitization documented, session cookie disclosed in privacy policy.
- [ ] Data is flowing on staging within 48h of merge; let it run 2-3 weeks before Phase 1 design starts.

## Key Design Decisions (read these first)

These are the load-bearing decisions. Everything below flows from them.

### 1. What is a "view"?

**Decision:** A view is one **(provider_id, session_id, calendar-day-UTC)** tuple. We capture every page_view event raw, then dedup at aggregation time. Both raw and unique counts will be available; we'll show whichever is appropriate for the moment.

**Why session-day, not raw-hits:** Raw hits inflate (one bored user refreshes 8 times = 8 views). Session-day matches the standard web analytics norm and is honest.

**Why not user-day:** Care seekers are anonymous. Cookies are the realistic identifier.

**Session = a UUID stored in a first-party cookie `olera_session`**, 30-day sliding TTL. Anonymous, no PII, disclosed in privacy policy.

### 2. Server-side or client-side instrumentation?

**Decision: Client-side.** The public provider page is RSC + ISR (`revalidate = 3600`). Server code does NOT run on cached page hits — most visits would be invisible to a server-side counter. Client-side instrumentation runs on every visit (cache or not) and naturally filters most non-JS-executing bots as a bonus.

A small `<ViewTracker />` client component mounts on the page, reads/sets the session cookie, and POSTs to `/api/activity/track`.

### 3. Bot filtering — yes, even in Phase 0

**Decision:** Add `isbot` library. Filter at the writer endpoint server-side using the User-Agent header. Increment a Redis-less counter (in-memory per-instance, surfaced in admin view as "bot rejects today: ~N").

**Why now and not later:** Per the strategy doc, honest numbers are brand-defining. If our admin sanity-check view shows inflated numbers we won't know what to trust. Cheap to add now (5 lines of code), painful to backfill cleanly later.

### 4. Where do anonymous events live?

**Decision:** Anonymous `page_view` events write to **`provider_activity`** (NOT `seeker_activity`), with `provider_id` = the provider's slug, `profile_id` = NULL, and `metadata` = `{session_id, referrer_domain, ua_class, path}`.

`seeker_activity` requires a known profile; anonymous visitors don't have one. `provider_activity`'s `profile_id` is already nullable. We extend `/api/activity/track` to accept `actor_type: "anonymous"`.

### 5. Session cookie privacy

- First-party cookie, name `olera_session`, value is a UUID v4
- 30-day sliding TTL
- `SameSite=Lax`, `Secure`, `HttpOnly: false` (client-side JS sets it)
- No PII stored. Cannot be linked to any individual.
- Disclose in `/privacy` (already exists per CLAUDE.md context)

---

## Tasks

Tasks are dependency-ordered. Each is sized for one focused session.

### Phase 0A: Schema & writers (week 1)

#### 1. [ ] Schema migration: extend `provider_activity` event types + add `session_id` index
- **Files:** `supabase/migrations/045_provider_analytics_phase_0.sql` (new)
- **Depends on:** none
- **What:** 
  - Drop & recreate the `event_type` CHECK constraint to add: `lead_received`, `review_received`, `search_click`, `cta_click_public`
  - Add a partial index for fast session-dedup lookup: `CREATE INDEX idx_provider_activity_page_view_session ON provider_activity ((metadata->>'session_id'), provider_id, date_trunc('day', created_at)) WHERE event_type = 'page_view';`
  - Make this migration additive and safe per CLAUDE.md
- **Verify:** Apply via Supabase dashboard SQL editor. Run `INSERT INTO provider_activity (provider_id, event_type) VALUES ('test', 'lead_received');` succeeds. Then `DELETE FROM provider_activity WHERE provider_id='test';` cleanup.

#### 2. [ ] Schema migration: aggregation tables
- **Files:** `supabase/migrations/046_provider_view_aggregations.sql` (new)
- **Depends on:** 1
- **What:**
  - Create `provider_page_view_stats(provider_id TEXT, date DATE, raw_view_count INT, unique_view_count INT, city TEXT, state TEXT, category TEXT, created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY (provider_id, date))`
  - Indices on `(city, category, date DESC)`, `(state, category, date DESC)`, `(date DESC)`
  - Create `city_category_view_benchmarks(date DATE, city TEXT, state TEXT, category TEXT, avg_views NUMERIC, p50_views INT, p90_views INT, provider_count INT, PRIMARY KEY (date, city, state, category))`
  - RLS enabled, service role only (Phase 1 will add policies for provider-owner reads)
- **Verify:** Apply migration. `\d provider_page_view_stats` and `\d city_category_view_benchmarks` show expected columns and indices.

#### 3. [ ] Add `isbot` dependency + bot filter helper
- **Files:** `package.json`, `lib/analytics/bot-filter.ts` (new)
- **Depends on:** none (parallel to 1, 2)
- **What:**
  - `npm install isbot`
  - Create `lib/analytics/bot-filter.ts` exporting `isBotRequest(userAgent: string | null): boolean` and an in-memory counter `botRejectsToday` exposed for admin view
  - Counter resets at UTC midnight (simple approach: check date on each call)
- **Verify:** Unit-test or REPL: `isBotRequest('Mozilla/5.0 ...iPhone...')` → false; `isBotRequest('Googlebot/2.1')` → true; `isBotRequest(null)` → true (treat missing UA as bot).

#### 4. [ ] Extend `/api/activity/track` to accept `actor_type: "anonymous"`
- **Files:** `app/api/activity/track/route.ts` (modify)
- **Depends on:** 1, 3
- **What:**
  - Add `"anonymous"` to the `actor_type` union
  - For anonymous events: require `event_type` (validated), `related_provider_id` (slug), and `session_id` in body
  - Apply bot filter — if bot, increment counter, return 204 silently (don't 4xx; don't reveal the filter)
  - Write to `provider_activity` with `provider_id = related_provider_id`, `profile_id = NULL`, `metadata = {session_id, referrer_domain, ua_class, path, ...originalMetadata}`
  - Sanitize referrer to domain-only when not an Olera domain (privacy)
  - Classify UA into `'mobile' | 'desktop' | 'tablet' | 'other'` (no raw UA storage)
- **Verify:** `curl -X POST localhost:3000/api/activity/track -d '{"actor_type":"anonymous","event_type":"page_view","related_provider_id":"test-slug","session_id":"test-uuid"}'` → 200, row appears in `provider_activity`. Same call with `User-Agent: Googlebot` → 204, no row.

#### 5. [ ] Create `<ViewTracker />` client component
- **Files:** `components/analytics/ViewTracker.tsx` (new), `lib/analytics/session.ts` (new)
- **Depends on:** 4
- **What:**
  - `lib/analytics/session.ts` — `getOrCreateSessionId(): string` reads/writes `olera_session` cookie (30d sliding TTL, SameSite=Lax, Secure)
  - `<ViewTracker providerId={slug} />` — `"use client"` component. On mount (`useEffect`), POSTs to `/api/activity/track` with `actor_type: 'anonymous'`, `event_type: 'page_view'`, `related_provider_id`, `session_id`, `metadata: {referrer: document.referrer, path: window.location.pathname}`
  - Fire-and-forget; swallow errors silently. Never block UI.
  - Skip if `navigator.webdriver` is true (additional client-side bot hint)
- **Verify:** Add `<ViewTracker />` to a test page (not provider page yet — task 6). Visit, check Network tab shows POST + `provider_activity` row inserted.

#### 6. [ ] Mount `<ViewTracker />` on the public provider page
- **Files:** `app/provider/[slug]/page.tsx` (modify, minimal)
- **Depends on:** 5
- **What:** Import `<ViewTracker />` and render it once with `providerId={params.slug}`. Place inside the existing provider page layout — purely decorative position, doesn't matter where.
- **CONSTRAINT:** This is the ONLY UI change in Phase 0. Onboard page UNTOUCHED.
- **Verify:** Visit a few provider pages on local dev. Check `provider_activity` rows accumulate with correct `provider_id` (slug). Refresh — no new row (session dedup at agg time, but the raw row is allowed). Open in incognito — new row with new session_id.

#### 7. [ ] Server-side writers: `question_received`, `lead_received`, `review_received`
- **Files:** Find via grep — likely `app/api/questions/route.ts`, `app/api/connections/route.ts` or `app/api/leads/route.ts`, `app/api/reviews/route.ts` (modify each). Also `lib/analytics/provider-events.ts` (new helper).
- **Depends on:** 1
- **What:**
  - Helper: `lib/analytics/provider-events.ts` exporting `recordProviderEvent({provider_id, event_type, profile_id?, metadata?})` — fire-and-forget Supabase service-role insert into `provider_activity`. Wrap in try/catch; never throws.
  - In each creation endpoint, after the source row is inserted, call the helper. Don't await; use `void recordProviderEvent(...)` so the response isn't delayed.
- **Verify:** Submit a test question on a provider page — `provider_activity` shows one `question_received` row alongside the `provider_questions` row. Same for a lead submission and a review submission.

#### 8. [ ] Add `cta_click_public` writer for public-page CTAs
- **Files:** Wherever the public provider page renders the Contact / Save / Share buttons — likely `components/provider-page/*` (find via grep). Modify those to fire a tracking call on click.
- **Depends on:** 4
- **What:**
  - When a care seeker clicks Contact / Save / Share / Phone-reveal on the public provider page, call `/api/activity/track` with `actor_type: 'anonymous'`, `event_type: 'cta_click_public'`, `related_provider_id: slug`, `metadata: {cta: 'contact' | 'save' | 'share' | 'phone'}`.
  - If the user is signed in, the call still works (session-id present) — Phase 1 may upgrade some of these to `actor_type: 'family'` once we've thought it through. Phase 0 keeps them anonymous for simplicity.
- **Verify:** Click Contact button on a provider page → row appears with `event_type='cta_click_public'`, metadata.cta='contact'.

#### 9. [ ] Add `search_click` writer on browse / search results
- **Files:** Wherever the browse page renders provider cards — likely `app/browse/page.tsx` or `components/browse/*` (grep)
- **Depends on:** 4
- **What:** When a care seeker clicks a provider card from a search results surface, fire `/api/activity/track` with `actor_type: 'anonymous'`, `event_type: 'search_click'`, `related_provider_id: card_slug`, `metadata: {position, query, source: 'browse' | 'state-page' | 'category-page'}`.
- **Defer:** `search_impression` (logged for every card rendered in results) — high volume, deferred to Phase 1+ pending design. Add a `// TODO Phase 1: search_impression` comment where this would go.
- **Verify:** Search → click a result → row appears with metadata.position and metadata.query.

### Phase 0B: Aggregation & visibility (week 2)

#### 10. [ ] Nightly aggregation cron
- **Files:** `app/api/cron/aggregate-provider-views/route.ts` (new), `vercel.json` (modify)
- **Depends on:** 2, 6, 7
- **What:**
  - GET endpoint, `Bearer ${process.env.CRON_SECRET}` auth (mirror existing cron pattern)
  - Aggregate yesterday's data:
    1. Per-provider rollup → upsert into `provider_page_view_stats` with both `raw_view_count` and `unique_view_count = COUNT(DISTINCT metadata->>'session_id')`
    2. JOIN to `olera-providers` and `business_profiles` to enrich with city/state/category
    3. Per (city, state, category) rollup → upsert into `city_category_view_benchmarks` with avg, p50 (using `percentile_cont`), p90, provider_count
  - Idempotent — safe to re-run for the same date (uses `ON CONFLICT DO UPDATE`)
  - Add to `vercel.json` crons: `{ "path": "/api/cron/aggregate-provider-views", "schedule": "0 8 * * *" }` (8 AM UTC = 3 AM ET, after midnight cleanup)
  - Log row counts written to `console.log` for Vercel log inspection
- **Verify:** Manually hit the endpoint with the cron secret, confirm rows in both stats tables. Re-hit — same row counts (idempotent).

#### 11. [ ] Admin analytics sanity-check view
- **Files:** `app/admin/analytics/page.tsx` (new), `app/api/admin/analytics/summary/route.ts` (new), `lib/admin-analytics.ts` (new — small helper, do NOT bloat `lib/admin-stats.ts`)
- **Depends on:** 10
- **What:**
  - Read-only `/admin/analytics` page, gated by existing admin middleware
  - Sections:
    1. **Last 24h** — total events, page_views, unique sessions, question_received, lead_received, cta_click_public count, search_click count
    2. **7-day chart** — page_views per day, reuse `lib/admin-stats.ts::buildSeries()` and `<PulseHeader />` pattern from the recent admin pulse work
    3. **Top 10 providers by 7-day views** — table: name, city, view count, unique sessions
    4. **Bot rejection counter** — today's count from in-memory counter (note: per-instance only, accurate for low-traffic; Phase 1+ may move to KV)
    5. **Latest 50 raw events** — table from `provider_activity`, newest first, all event types
  - Use `select("*")` per memory
  - Backend route returns the summary as one JSON; minimal queries
- **Verify:** Visit `/admin/analytics` after data has flowed. All sections render. Numbers match what's in the DB by spot-check SQL.

#### 12. [ ] Privacy review pass
- **Files:** Documentation only — append to this plan file under "Privacy Review" section. Possibly tiny edit to `/privacy` page if cookie disclosure is missing.
- **Depends on:** 1-11
- **What:** Walk the checklist:
  - [ ] No IP addresses stored anywhere (confirm by grepping new code for `req.ip`, `x-forwarded-for`)
  - [ ] No raw User-Agent strings stored (only `ua_class`)
  - [ ] Referrer sanitized to domain-only for non-Olera referrers (confirm in `/api/activity/track` code)
  - [ ] `olera_session` cookie disclosed in `/privacy` page; if not, add a one-paragraph "Anonymous session cookie" entry
  - [ ] Confirm RLS on new tables blocks anonymous reads (only service role)
  - [ ] Document data retention — recommend: raw `provider_activity` rows older than 90 days deleted by a future cleanup cron (don't build the cleanup yet; document the policy)
- **Verify:** Checklist completed and committed in this plan file.

#### 13. [ ] Document the deferred items in code as TODOs
- **Files:** Various, primarily a single `lib/analytics/PHASE_1_TODO.md` (new) plus inline `// TODO Phase 1:` comments where deferred behavior would otherwise have been implemented
- **Depends on:** 1-12
- **What:** Single plain-text doc listing:
  - `search_impression` event capture (high-volume, needs design)
  - `dwell_time` capture (requires beforeunload + visibility tracking)
  - `referrer_source` enrichment (UTM parsing, search-term extraction)
  - 90-day data retention cleanup cron
  - Bot rejection counter persistence (move from in-memory to a KV / DB counter)
  - Provider-owner RLS policies on stats tables (so dashboard can read without service role)
  - Any other "we noticed but didn't build" items found during implementation
- **Verify:** Doc exists, items are concrete (not hand-wavy), each has a 1-line "why deferred."

### Phase 0C: Verify & let it run

#### 14. [ ] Open PR to staging, merge, monitor
- **Files:** PR via `gh pr create`
- **Depends on:** 1-13
- **What:** 
  - Branch is off `origin/staging` per CLAUDE.md
  - PR description summarizes Phase 0 scope and links the strategy doc + this plan
  - After merge, apply migrations 045 + 046 via Supabase dashboard (NOT CLI per memory)
  - Watch `/admin/analytics` for 48h to confirm data is flowing
  - Cron will fire 8 AM UTC the morning after merge → verify aggregation populated
- **Verify:** 7 days post-merge, `/admin/analytics` shows non-trivial counts across all event types and the chart has at least 7 data points.

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| ISR caching makes us miss server-fired events | Certain (already known) | Client-side instrumentation per Decision #2 |
| Bot traffic inflates numbers | High | `isbot` filter at writer endpoint per Decision #3; client-side tracking naturally filters non-JS bots |
| `/api/activity/track` becomes a noisy abuse target (anonymous, no rate limit) | Medium | Phase 0 ships without rate limit (mirror existing endpoint behavior). Add to `lib/analytics/PHASE_1_TODO.md`. If we see abuse pre-Phase 1, add Vercel Edge rate limit (cheap fast-follow). |
| Migration breaks existing event writes | Low | New constraint is a superset of old values — additive only. Test in staging via Supabase dashboard before applying. |
| Aggregation cron OOMs on large day | Low (current scale) | Day-by-day aggregation, not multi-day. At current 39k providers + projected ~100k events/day, well within Postgres norms. |
| Session cookie blocked by user / browser | Low-Medium | Each blocked-cookie visit just looks like a new session — overcounts unique. Acceptable; document as a known limit in Phase 1 README. |
| Aggregation runs before `provider_page_view_stats` table exists | Low | Cron auth requires CRON_SECRET; won't fire pre-deploy. Migration applied before merge. |
| Privacy oversight on referrer (search query leak) | Medium if missed | Sanitize referrer at write time (Task 4) — only domain stored for external referrers. Reviewed in Task 12. |

---

## Privacy Review Checklist (completed 2026-04-22 in Task 12)

- [x] **No IP storage.** Greppped `lib/analytics/`, `app/api/activity/track/`, and `components/analytics/` for `x-forwarded-for`, `req.ip`, `request.ip` — zero matches. We never read or store the requester's IP.
- [x] **No raw User-Agent storage.** `request.headers.get("user-agent")` is read in exactly one place (`app/api/activity/track/route.ts` for the `isbot` check); the raw UA is then discarded and only the classified `ua_class` (`"mobile" | "tablet" | "desktop" | "other"`) is persisted in `metadata`.
- [x] **Referrer sanitized to domain-only.** External referrers are reduced to `hostname` only; internal referrers use `internal:<pathname>` with no query string. See `sanitizeReferrer()` in the track route — query strings (which can leak search terms) are dropped at write time.
- [x] **`olera_session` cookie covered by existing privacy policy.** `/privacy` already discloses use of session and persistent cookies in the Tracking Technologies and Cookies section (line 142+). The new cookie falls under the "Functionality / Necessary" categories already documented. No update required for Phase 0; revisit if Phase 1 introduces user-level identifiers.
- [x] **RLS verified on aggregation tables.** Migration 045 enables RLS with no policies on both `provider_page_view_stats` and `city_category_view_benchmarks`, locking them to service-role only. Phase 1 will add provider-owner read policies when the dashboard exists.
- [x] **Data retention documented.** Raw `provider_activity` rows: target 90-day retention. Aggregation tables (`provider_page_view_stats`, `city_category_view_benchmarks`): indefinite. Cleanup cron deferred to Phase 1 — listed in `lib/analytics/PHASE_1_TODO.md`.

**No PII handled by this phase.** Session cookie is a random UUID with no link to any identity. Anonymous events have no `profile_id`. The only identifying string written is the provider's own URL slug (already public).

---

## Out of Scope (Phase 1+)

These are explicitly deferred. Do NOT pull them into Phase 0.

- Provider-facing analytics teaser card on `/provider/[slug]/onboard`
- Persistent provider analytics dashboard at `/portal/analytics` (or wherever)
- Weekly digest email (return-path mechanism)
- Triage logic for low / medium / high-traffic providers
- Reviews CTA repositioning under analytics
- L3 monetization layer / paywall
- `search_impression` capture (high-volume, needs design)
- `dwell_time` capture
- 90-day data retention cleanup cron
- Per-instance → KV bot counter migration
- Provider-owner RLS policies on stats tables (only needed once dashboard exists)

---

## Notes for future sessions

- **Branch convention:** Off `origin/staging`. PR back to `staging`. Merge with admin bypass per CLAUDE.md (only TJ can merge).
- **Migration application:** Via Supabase dashboard SQL editor. Schema is single shared instance for staging + prod per memory `reference_supabase_single_instance.md`.
- **Testing during the wait:** Don't disturb the data. The 2-3 week wait is real time, not arbitrary. We need actual care-seeker traffic across diverse providers to know what realistic numbers look like before we design Phase 1's triage thresholds.
- **What "done with Phase 0" looks like:** PR merged + migrations applied + `/admin/analytics` showing live data + 7+ days of stats accumulated + privacy checklist signed off.
- **Phase 1 trigger:** When TJ says "let's look at the data and design the dashboard." Not before. The wait is the point.

