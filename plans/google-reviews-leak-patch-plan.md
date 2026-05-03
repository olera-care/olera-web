# Plan: Patch Google Reviews API Per-Pageview Leak

Created: 2026-05-02
Status: Not Started
Related: Mercury alert May 1 (Places API New, +184% MoM, $25K/yr pace) — sibling to PR #717 photo leak patch
Branch: TBD (new branch off staging — DO NOT extend `fierce-panini` since #717 is already in review)

## Goal

Stop `app/api/internal/backfill-google-review/route.ts` from re-calling Google Places Reviews API on every visit to provider pages where Google has no reviews (or the API returned null/error). Currently the route silently returns without writing to DB on any null response, so the page condition `!googleReviewsData` stays true forever and re-triggers the call on every subsequent visit.

This is likely the dominant Places API cost driver (high-traffic page + 12.4% of providers in the leak surface + per-pageview multiplier).

## Success Criteria

- [ ] After a provider page is visited once, NO subsequent visit to that same page triggers another call to `fetchGoogleReviews`, even if Google returns no reviews or errors
- [ ] Provider page rendering is unchanged — "no reviews" UI still displays correctly for providers without Google reviews
- [ ] Vercel preview build passes
- [ ] After merge: Google Cloud billing dashboard shows Places API (New) usage drop materially within 24-48hrs (this should be the bigger win compared to PR #717)

## Tasks

### Phase 1: Sentinel write-back (the actual fix, ~20 min)

- [ ] **1. Write a sentinel marker on null response from `fetchGoogleReviews`**
  - Files: `app/api/internal/backfill-google-review/route.ts`
  - Replace lines 21-24 (early-exit on null) with a sentinel write. Build an object like:
    ```ts
    const cacheValue = data ?? {
      rating: 0,
      review_count: 0,
      reviews: [],
      last_synced: new Date().toISOString(),
    };
    ```
  - Then write `cacheValue` to the DB in BOTH branches (business_profiles.metadata.google_reviews_data and olera-providers.google_reviews_data) — same code paths as the existing success path, just always run them
  - Verify: hit `/api/internal/backfill-google-review` for a known place_id with no Google reviews, confirm `google_reviews_data` column is now populated with the sentinel

- [ ] **2. Confirm consumer code handles sentinel without breakage**
  - Files: `app/provider/[slug]/page.tsx` (read-only check)
  - Verified during planning — all 6 consumer references (lines 483, 553, 609, 964, 1044, 980) check `reviews.length > 0` or `rating > 0`, not truthy-on-object. Safe.
  - Verify: visit `/provider/[slug-of-no-review-provider]` on preview, confirm "no reviews" empty state renders cleanly

### Phase 2: Ship + monitor (~15 min)

- [ ] **3. Push branch and open PR targeting `staging`**
  - Per CLAUDE.md branch rules
  - PR description: link Mercury alert, link PR #717 (sibling), explain this is the bigger lever (provider profile pages = high-traffic surface)
  - Verify: Vercel preview build passes

- [ ] **4. Manual smoke test on staging preview URL**
  - Test cases:
    - Visit `/provider/[slug]` for a provider WITH cached `google_reviews_data` → reviews display, no API call (no change)
    - Visit `/provider/[slug]` for a provider WITHOUT cached reviews where Google has reviews → first visit calls API, writes cache; second visit serves from cache, no API call
    - Visit `/provider/[slug]` for a provider WITHOUT cached reviews where Google returns null → first visit calls API, writes sentinel; second visit serves from cache (sentinel), **no API call** ← this is the bug fix
  - Verify: third case is the critical one — confirm second visit does NOT trigger network call to backfill route (check browser dev tools or server logs)

- [ ] **5. After merge to main, watch Google Cloud billing for 24-48hrs**
  - Expected: Places API (New) Place Details (Pro/Advanced fields with reviews) line item drops sharply
  - If costs spike unexpectedly: revert PR (slow-onset bleed → code revert window is fine)

## Risks

- **Risk: Sentinel hides real reviews if API was just temporarily erroring.** A 500 from Google would write the "no reviews" sentinel and we'd never re-fetch. Mitigation A (chosen): accept the trade-off for now. Stale "no reviews" is better than runaway cost. A future TTL refresh (out of scope for this PR) can re-fetch periodically. Mitigation B (rejected, scope creep): distinguish HTTP errors from genuine no-data and only write sentinel on the latter. Defer.
- **Risk: Consumer code somewhere outside `provider/[slug]/page.tsx` breaks on sentinel.** Verified only the provider page consumes `google_reviews_data` directly. The Schema.org block (line 609) guards on `rating > 0`, safe. Other code paths read via this page.
- **Risk: Existing 9,159 leaky providers continue triggering calls until each is visited once.** Acceptable — each visit is now self-healing (writes sentinel or real data and stops). Cost ramps DOWN over time, not up. No proactive backfill needed; self-heal pattern matches PR #717.
- **Risk: cron job `app/api/cron/google-reviews/route.ts` has the same bug.** Out of scope for this PR — but should be checked. Crons are bounded (run on schedule, not per-request) so the leak shape is different, less urgent.

## Out of Scope (deferred)

- TTL-based re-fetch of stale review data (e.g., re-call Google every 30 days to keep reviews fresh)
- Distinguishing transient API errors from genuine no-data responses
- Cron job fix at `app/api/cron/google-reviews/route.ts` (verify whether it has the same null-write-skip pattern)
- Discovery pipeline throttling (`scripts/discovery-batch.py` — separate plan)
- Path B: download review data and serve from Supabase Storage (not needed)

## Notes

- This patch is structurally identical to PR #717: read DB first, write back on miss, prevent re-fetch loops. Same lesson, different file.
- Provider profile pages are the high-traffic surface. PR #717 fixed the wrong page (low-traffic review form). This PR fixes the right one.
- The diagnosis was driven by code-walking + DB stats (12.4% leak surface = 9,159 providers without cached reviews). NOT yet validated against SKU-level Google Cloud billing breakdown — TJ should confirm post-merge that this line item drops materially. If it doesn't, the next suspect is `discovery-batch.py` Text Search.
- Branch name suggestion: `quiet-tabby` or any random worktree name — must branch off `staging`, NOT `main`, NOT `fierce-panini`.
