# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Google Review Snippets on Provider Pages** — ON STAGING ✅ (PRs #296, #297 merged)
  - Plan: `plans/google-review-snippets-plan.md`
  - Notion task: "Add Google Review Snippets to provider pages" (P1 🔥)
  - Unified "What families are saying" section with Google + Olera reviews
  - Tiered cron (monthly) + on-demand backfill + admin seed endpoint
  - **In progress:** Extending pipeline to business_profiles (new providers)
  - **Pending:** Bulk seed of 22K providers (~$112 one-time)

- **Olera MedJobs: Student Caregiver Talent Marketplace** — DONE (on staging)
  - Plan: `plans/medjobs-plan.md`
  - Phases 1-5 DONE, PR #273 merged to staging
  - Design polish PR #279 merged
  - **Deferred:** Phase 6 (credential engine UI), Phase 7 (Stripe billing)

- **SBF Accuracy Audit** — AUDIT COMPLETE, FIXES PLANNED
  - 7 findings across geography, logic, taxonomy, ranking, data quality
  - 4-phase improvement plan in Notion (Phases 1-2 = P1 🔥)
  - Audit doc: `docs/sbf-accuracy-audit.md`

---

## Blocked / Needs Input

_(Nothing currently blocked)_

---

## Next Up

1. **Extend Google reviews to business_profiles** — new providers need place_id + reviews
   - Step A: Read google_reviews_data from business_profiles metadata in provider page
   - Step B: Google Business linking in provider onboarding (Places Autocomplete)
   - Step C: Google Place search in admin directory create/edit
2. **Bulk seed Google reviews** — run admin endpoint for 22K providers (~$112)
3. **Port ScoreCalculator from v1** — Notion task (P2): weighted formula with dynamic Google weights
4. **Push MedJobs to main** — promote staging to production
5. **SBF Phase 1: Fix Critical Bugs** — ZIP→county resolution, AAA matching, carePreference (P1 🔥)
6. **SBF Phase 2: Unify Data** — Parse Chantel's 528 programs into Supabase (P1 🔥)
7. **Delete fake seed connections** from Supabase

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Tiered refresh strategy (not blind monthly) | At 100K providers, blind refresh = $500/month. Tiered (claimed > viewed > long tail) = ~$100/month. Scales to 500K. |
| 2026-03-19 | Remove Olera Score from reviews zone (keep in header/sidebar) | Until ScoreCalculator v2 is ported, two disconnected scores (Olera 4.3 vs Google 5.0) erode trust. Bring back when data is connected. |
| 2026-03-19 | Unified reviews feed with source badges | v1 had separate sections. Merged into one "What families are saying" with Google/Olera badges per card. Less cognitive load. |
| 2026-03-19 | JSONB on olera-providers (not separate table) | Only storing 2 reviews per provider. Not worth a join. Simpler queries. |
| 2026-03-19 | Places API (New) over legacy | $5/1K vs $17/1K for place details with reviews. Same data. |
| 2026-03-19 | Created Notion task for ScoreCalculator v2 (P2) | Port from olera-backend Ruby. Weights shift as Google review count grows: Reputation 0.7→0.3, Google 0.2→0.6, Profile 0.1 constant. |
| 2026-03-17 | University logos: grayscale default, color on hover | 5 partner schools with existing connections (TAMU, Michigan, Houston, Prairie View, Maryland) |
| 2026-03-17 | Hero image uses native square aspect ratio | Source is 1080x1080; forced aspect ratios looked awkward |
| 2026-03-17 | Photo upload is no-auth, fire-and-forget | Students aren't signed in during application; profile creates first, photo is best-effort |
| 2026-03-14 | SBF accuracy issues are systemic, not surface-level | Root cause is structural: no county resolution, two disconnected data systems, no sub-state geo intelligence |
| 2026-03-13 | OAuth post-auth: 5-min window detection | Replace always-on onboarding popup with targeted check: only auto-open for accounts created <5 minutes ago |
| 2026-03-12 | Fire-first UX for Q&A | Question submits immediately, then optional enrichment. Zero friction > data completeness |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Google Places API key: restricted to Places API (New) only, project "Olera Provider API" (olera-provider-api)
- 36,668 active providers, 32,042 with place_id, 22,337 with google_rating > 0
- 5 providers seeded with Google reviews as test data (hanstel-homehealth, hanameel-at-peace-home-care, etc.)
- Scaling to 100K providers expected within 2 months

---

## Session Log

### 2026-03-19 (Session 55) — Google Review Snippets: Full Implementation

**Branch:** `fresh-ride` (from staging) — PRs #296, #297 merged

**What:** End-to-end Google review snippets on provider pages. Explored v1 repos (olera-backend, olera-fe-experiments), designed tiered cost strategy, built full pipeline, iterated on UI/UX through 3 design passes.

**Exploration phase:**
- Fetched Notion roadmap, identified "Add Google Review Snippets to provider pages" (P1 🔥)
- Cloned and analyzed `olera-backend` (Ruby) and `olera-fe-experiments` (TypeScript) for v1 review implementation
- Found: v1 used monthly cron, Google Places Details API, `google_reviews` table, ScoreCalculator with dynamic weights
- Found: `olera-providers` table already has `place_id` (32K providers) and `google_rating` (22K)
- Created Notion task for ScoreCalculator v2 port (P2)

**Cost analysis (deep dive):**
- Blind monthly at 100K providers = $500/month ($300 after credit)
- Designed tiered strategy: claimed monthly, viewed monthly, long tail quarterly = ~$100/month
- Includes `last_viewed_at` tracking for tier 2 decisions
- On-demand backfill as safety net (non-blocking, doesn't hurt page load)

**Implementation (12 tasks across 4 phases):**
1. Google Cloud setup — API key created, restricted to Places API (New)
2. Supabase migration 021 — `google_reviews_data` JSONB + `last_viewed_at` columns + index
3. `lib/google-places.ts` — fetch utility with batch support
4. `app/api/cron/google-reviews/route.ts` — tiered monthly cron (1st of month, 3 AM UTC)
5. `app/api/admin/seed-google-reviews/route.ts` — admin seed with dry_run mode
6. View tracking — non-blocking `last_viewed_at` updates (debounced >24h)
7. `app/api/internal/backfill-google-review/route.ts` — on-demand backfill trigger
8. `components/providers/GoogleReviewSnippets.tsx` — standalone component (later merged into ReviewsSection)
9. Provider page integration — google_reviews_data + place_id captured from raw query

**UI/UX evolution (3 iterations):**
1. **v1:** Olera Score circle + breakdown bars + separate Google Reviews section → two competing scores, dashboard feel
2. **v2:** Removed Olera Score from zone, single "What families are saying" with Google data only → clean but disconnected from Olera reviews
3. **v3 (shipped):** Unified feed merging Google + Olera reviews with source badges ("Google review" with G icon, "Olera review 🌿") → one section, one story

**Key design decisions:**
- Removed Olera Score circle + breakdown bars until ScoreCalculator v2 is ported (scores contradict without connected data)
- Olera Score still visible in header badge + connection card sidebar
- Warm header: "What families are saying" (not "Google Reviews")
- Reviews positioned above About (Q&A → Reviews → About)

**Dry run results:**
- 36,668 active providers, 22,337 eligible for seed (google_rating > 0)
- Initial seed cost: ~$112 one-time
- 5 providers seeded as test batch — all worked end-to-end

**Files created:**
- `lib/google-places.ts` — Google Places API fetch utility
- `app/api/cron/google-reviews/route.ts` — tiered monthly cron
- `app/api/admin/seed-google-reviews/route.ts` — admin seed endpoint
- `app/api/internal/backfill-google-review/route.ts` — on-demand backfill
- `components/providers/GoogleReviewSnippets.tsx` — standalone component (kept for reference)
- `supabase/migrations/021_google_reviews.sql` — schema changes
- `plans/google-review-snippets-plan.md` — detailed plan with cost projections

**Files modified:**
- `app/provider/[slug]/page.tsx` — google_reviews_data capture, view tracking, backfill trigger, section reorder
- `components/providers/ReviewsSection.tsx` — accepts googleReviewsData, merged feed, source badges
- `components/providers/AllReviewsModal.tsx` — DisplayReview type extended, normalizeReviews merges Google
- `lib/types.ts` — GoogleReviewSnippet, GoogleReviewsData types
- `lib/types/provider.ts` — google_reviews_data, last_viewed_at fields
- `vercel.json` — added google-reviews cron schedule
- `.env.example` — GOOGLE_PLACES_API_KEY

**Gap identified:** Pipeline only works for `olera-providers` table. New providers in `business_profiles` don't get Google reviews. Next steps: extend page to read from BP metadata, add Google linking to onboarding, add to admin directory.

**Next session:** Extend Google reviews pipeline to business_profiles (steps A/B/C), then bulk seed.
