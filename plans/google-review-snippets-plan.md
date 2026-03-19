# Plan: Google Review Snippets on Provider Pages

Created: 2026-03-19
Status: Not Started

## Goal

Display Google review snippets (star rating, review count, 2 recent reviews) on provider detail pages, coupled with the Olera Score and positioned right below the Q&A section. Use a tiered refresh strategy to keep API costs sustainable as we scale to 100K+ providers.

## Success Criteria

- [ ] Google reviews visible on provider detail pages (star rating + count + 2 review cards)
- [ ] Olera Score moved up to sit right below Q&A (before About)
- [ ] Google attribution present (Google logo + "See all reviews on Google" link)
- [ ] Tiered cron refreshes reviews based on provider activity — not blindly for all
- [ ] Polished, editorial feel matching Olera's design system
- [ ] No Google API calls on page load — all data pre-fetched and cached in Supabase
- [ ] Monthly API cost stays under $100 at 100K providers

## Cost Strategy: Tiered Refresh (Strategy C)

### Why not refresh everything monthly?

At 100K providers, a blind monthly refresh = $500/month ($300 after $200 free credit).
Most provider pages get zero visits in any given month. Paying to refresh data
nobody sees is waste.

### The tiered approach

| Tier | Who | Refresh cadence | Est. count (at 100K) | Monthly cost |
|------|-----|----------------|----------------------|-------------|
| 1: Claimed/verified | Providers who claimed their page | Monthly (30 days) | ~500 | $2.50 |
| 2: Recently viewed | Pages visited in last 30 days | Monthly (30 days) | ~5,000-10,000 | $25-50 |
| 3: Long tail | Everyone else with place_id | Quarterly (90 days) | ~90,000 | ~$150/quarter = $50/mo avg |
| **Total** | | | | **~$75-100/month** |

After Google's $200/month free Maps credit, this is **effectively $0** until well past 100K.

### How it works

1. **`last_viewed_at` timestamp** on `olera-providers` — updated (debounced) when a provider page is server-rendered
2. **Cron runs monthly** but uses tiered logic:
   - Tier 1: `claim_state = 'claimed'` AND `last_synced > 30 days ago`
   - Tier 2: `last_viewed_at > 30 days ago` AND `last_synced > 30 days ago`
   - Tier 3: `last_synced > 90 days ago` OR `last_synced IS NULL`
3. **Initial seed** only targets providers with `google_rating > 0` (have actual Google reviews). Skip the rest — they'll get fetched when someone visits their page via on-demand backfill.

### On-demand backfill (safety net)

If a provider page is viewed and has `place_id` but no `google_reviews_data`:
- **Don't block the page render** (no latency hit, critical for SEO)
- Instead, fire a lightweight background API call (`fetch()` with no `await`) to populate the cache
- Next visitor sees the reviews. First visitor sees the page without reviews (graceful — component simply doesn't render)
- This catches the long tail without paying for a bulk seed of 100K providers

### Cost at scale

| Provider count | Blind monthly (Strategy A) | Tiered (Strategy C) | Savings |
|---------------|---------------------------|--------------------|---------|
| 39K (today) | $195 (~$0 after credit) | ~$50 (~$0 after credit) | 75% |
| 100K (2 months) | $500 ($300 after credit) | ~$100 (~$0 after credit) | 80% |
| 200K (future) | $1,000 ($800 after credit) | ~$150 (~$0 after credit) | 85% |
| 500K (long-term) | $2,500 ($2,300 after credit) | ~$300 ($100 after credit) | 96% |

The $200 free credit covers us for a long time with Strategy C. Without it, we're still under $150/month at 200K.

## Architecture

### Data Flow

```
Google Places API → Vercel Cron (monthly, tiered) → Supabase → Provider Page (server render)
                         ↓
              Initial seed (providers with google_rating > 0 only)
                         ↓
              On-demand backfill (first page view, non-blocking)
```

### Storage: JSONB column on `olera-providers`

```
google_reviews_data JSONB:
{
  "rating": 4.2,
  "review_count": 47,
  "reviews": [
    {
      "author_name": "Jane Smith",
      "rating": 5,
      "text": "Wonderful staff...",
      "relative_time": "2 months ago",
      "profile_photo_url": "https://...",
      "time": 1708300800
    }
  ],
  "last_synced": "2026-03-19T00:00:00Z"
}

last_viewed_at TIMESTAMPTZ:  -- tracks page views for tiered refresh
```

**Why JSONB on existing table vs new table:**
- Only storing 2 reviews per provider — not worth a join
- The `olera-providers` table already has `place_id` and `google_rating`
- Simpler queries on the provider detail page (already fetching this row)
- v1 used a separate table because it stored ALL reviews; we only cache 2

## Tasks

### Phase 1: Google Cloud Setup & Data Layer

- [ ] 1. **Set up Google Cloud project + API key**
      - Enable Places API (New) in Google Cloud Console
      - Create restricted API key (Places API only, server-side)
      - Add `GOOGLE_PLACES_API_KEY` to Vercel env vars (staging + production)
      - Verify: API key works with a test curl

- [ ] 2. **Add Supabase columns**
      - Migration adds two columns:
        - `google_reviews_data JSONB DEFAULT NULL`
        - `last_viewed_at TIMESTAMPTZ DEFAULT NULL`
      - Files: `supabase/migrations/020_google_reviews.sql`
      - Verify: Columns exist in Supabase dashboard

- [ ] 3. **Create Google Places fetch utility**
      - New file: `lib/google-places.ts`
      - Function: `fetchGoogleReviews(placeId: string)` → returns rating, count, top 2 reviews
      - Uses Places API (New) `places/{placeId}` with field mask `reviews,rating,userRatingCount`
      - Handles: missing place_id, API errors, rate limits
      - Files: `lib/google-places.ts`, `lib/types.ts` (add GoogleReviewData type)
      - Verify: Manual test with a known place_id

### Phase 2: Cron + Seed + View Tracking

- [ ] 4. **Create tiered cron API route**
      - New file: `app/api/cron/google-reviews/route.ts`
      - Tiered query logic:
        - Tier 1: claimed providers with stale data (>30 days)
        - Tier 2: recently viewed (last_viewed_at within 30 days) with stale data
        - Tier 3: everything else with stale data (>90 days) or null
      - Batch processes in chunks (50 per batch, 200ms delay)
      - Logs: total refreshed, cost estimate, errors
      - Auth: Vercel cron secret header check
      - Files: `app/api/cron/google-reviews/route.ts`, `vercel.json`
      - Verify: Hit manually, check Supabase for populated data

- [ ] 5. **Create seed endpoint (initial population)**
      - New file: `app/api/admin/seed-google-reviews/route.ts`
      - Only targets providers where `google_rating > 0` AND `place_id IS NOT NULL`
      - First run: count query to report how many providers qualify (cost preview)
      - Accepts `?limit=100&offset=0&dry_run=true` for safe batched seeding
      - Admin-auth protected
      - Files: `app/api/admin/seed-google-reviews/route.ts`
      - Verify: Dry run shows count + cost estimate; wet run populates data

- [ ] 6. **Add last_viewed_at tracking to provider detail page**
      - In `app/provider/[slug]/page.tsx`: after fetching provider data, fire a non-blocking
        Supabase update: `UPDATE "olera-providers" SET last_viewed_at = NOW() WHERE provider_id = ?`
      - Debounce: only update if `last_viewed_at` is null or >24 hours old (avoid write spam)
      - Files: `app/provider/[slug]/page.tsx`
      - Verify: Visit a provider page, check last_viewed_at in Supabase

- [ ] 7. **Add on-demand backfill trigger**
      - In `app/provider/[slug]/page.tsx`: if provider has `place_id` but no `google_reviews_data`,
        fire a non-blocking fetch to `/api/internal/backfill-google-review?provider_id=xxx`
      - New file: `app/api/internal/backfill-google-review/route.ts`
      - Does NOT block page render — first visitor sees no reviews, next visitor sees them
      - Files: `app/provider/[slug]/page.tsx`, `app/api/internal/backfill-google-review/route.ts`
      - Verify: Visit uncached provider, revisit — reviews appear on second load

### Phase 3: UI — Move Olera Score + Add Google Reviews Section

- [ ] 8. **Move Olera Score section up (below Q&A, before About)**
      - In `app/provider/[slug]/page.tsx`:
        - Cut the Olera Score block (lines 901-939) from current position
        - Paste right after Q&A section (after line 835)
        - Update section nav order to match
      - Files: `app/provider/[slug]/page.tsx`
      - Verify: Olera Score appears between Q&A and About

- [ ] 9. **Create GoogleReviewSnippets component**
      - New file: `components/providers/GoogleReviewSnippets.tsx`
      - Props: `googleReviewsData: GoogleReviewData | null`, `providerName: string`, `placeId: string | null`
      - Layout:
        - Header: "Google Reviews" with Google "G" logo
        - Summary bar: ★ 4.2 · 47 reviews · "See all on Google →"
        - 2 review cards: author photo/initial, name, star rating, relative time, review text (~150 chars)
      - Renders nothing if `googleReviewsData` is null (graceful degradation)
      - Google attribution: link to Google Maps listing
      - Files: `components/providers/GoogleReviewSnippets.tsx`
      - Verify: Renders with mock data, looks polished

- [ ] 10. **Integrate into provider detail page**
       - Fetch `google_reviews_data` from `olera-providers` in existing provider query
       - Place component right below the (moved) Olera Score section
       - Both sit in a combined "Ratings & Reviews" zone below Q&A
       - Files: `app/provider/[slug]/page.tsx`
       - Depends on: 8, 9
       - Verify: Pages with data show snippets; pages without gracefully hide

### Phase 4: Polish

- [ ] 11. **Design polish pass**
       - Visual cohesion between Olera Score circle and Google review cards
       - Star rendering: fractional fills (not just full/empty)
       - Mobile responsive: stack vertically on small screens
       - Google "G" logo: official colors, proper sizing
       - Files: `components/providers/GoogleReviewSnippets.tsx`, `app/provider/[slug]/page.tsx`
       - Verify: Looks good on mobile (375px) and desktop (1440px)

- [ ] 12. **Update JSON-LD structured data**
       - Add Google review data to LocalBusiness schema
       - Include `aggregateRating` with Google rating + count
       - Files: `app/provider/[slug]/page.tsx`
       - Verify: Google Rich Results validator

## Section Order (After Implementation)

```
Care Services
Staff Screening
Q&A
── Olera Score (MOVED UP) ──
── Google Review Snippets (NEW) ──
About
Pricing
Payment / Insurance
What Families Are Saying (existing Olera reviews)
Facility Manager
Disclaimer
```

## Risks

| Risk | Mitigation |
|------|------------|
| Google API cost at scale | Tiered refresh: only refresh viewed/claimed providers monthly, rest quarterly. ~$100/month at 100K vs $500 blind. |
| Google removes $200/month free credit | Strategy C stays under $150/month at 200K even without credit |
| Not all providers have `place_id` | Graceful degradation — component renders nothing. On-demand backfill catches future additions. |
| Google ToS: must attribute reviews | Google "G" logo + "See all on Google" link on every snippet |
| Rate limits during seed | Batch processing with delays (50/batch, 200ms gap). Resumable via offset/limit. |
| `olera-providers` shared with iOS | JSONB + timestamp columns are additive-only — iOS ignores unknowns |
| Write spam from `last_viewed_at` | Debounced: only update if >24h stale. No write on every page view. |

## Dependencies

- Google Cloud project with Places API enabled
- `GOOGLE_PLACES_API_KEY` environment variable in Vercel
- Supabase migration for new columns

## Notes

- v1 reference: `olera-backend/app/services/reviews/import_from_google.rb` + `olera-fe-experiments/components/provider-details/ratings.js`
- Separate Notion task (P2): "Port ScoreCalculator from v1 — Olera Rating 2.0 weighted formula"
- Google Places API (New) returns up to 5 reviews; we store the 2 most recent
- v1 used legacy Places API; v2 uses new API (`places/{placeId}`) with better pricing
- Scaling to 100K providers expected within 2 months — tiered strategy designed for this
- Review velocity in senior care is low — 90-day cache for long tail is perfectly acceptable
