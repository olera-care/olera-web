# Google Reviews Seed Log

## Initial Seed — 2026-03-19

### Summary

Seeded Google review snippets for all eligible providers in `olera-providers` table using the Google Places API (New).

### Results

| Metric | Value |
|--------|-------|
| Total providers (active) | 36,668 |
| With `place_id` + `google_rating > 0` | 22,442 |
| **Processed (API calls)** | **27,497** |
| **Updated (have reviews)** | **5,423** |
| No reviews on Google | ~22,000 |
| Errors | 0 |
| API cost (gross) | $137.48 |
| API cost (actual) | **$0** (covered by Google's $200/month free Maps Platform credit) |

### Why only 5,423 out of 22K?

~17K providers had `google_rating > 0` from the v1 data import but returned no reviews from the current Google Places API. Likely causes:
- Business was removed from Google Maps
- All reviews were deleted by Google
- The `google_rating` was sourced from a different data pipeline in v1 (not directly from Google Places)
- The `place_id` is stale or invalid

These providers gracefully show the empty state ("Write a review") — no broken UI.

### Process

1. **Run 1** — offset-based pagination, processed 7,500 providers. Had a bug: positional offset skipped rows as the `IS NULL` result set shrank during updates. Updated 2,070.
2. **Run 2** — cursor-based pagination (fixed), processed remaining 19,997 providers. Updated 2,928 more.
3. **Script** — `scripts/seed-google-reviews.sh` committed to repo for future use. Has $150 hard cost ceiling.

### Ongoing Refresh

- **Monthly cron** (`/api/cron/google-reviews`) runs 1st of each month at 3 AM UTC
- **Tiered strategy**: claimed providers monthly, recently viewed monthly, long tail quarterly
- **On-demand backfill**: new providers get reviews on first page view (non-blocking)
- **Projected monthly cost at 100K providers**: ~$100 (covered by free credit)

### Related

- Plan: `plans/google-review-snippets-plan.md`
- Migration: `supabase/migrations/021_google_reviews.sql`
- Notion tasks: "Add Google Review Snippets to provider pages" (P1), "Port ScoreCalculator from v1" (P2)
- PRs: #296 (main implementation), #297 (section reorder), #298 (business_profiles extension), #299 (build fix), #300 (production promotion), #301 (seed script)
