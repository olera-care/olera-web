# Plan: Trust Signals & Smart Ranking — Replacing the Olera Score

Created: 2026-03-20
Status: Not Started
Notion Doc: https://www.notion.so/3295903a0ffe810e9baada745e4ebbad

## Goal

Replace the AI-derived Olera Score with a trust system built on independently verifiable data (Google Reviews, CMS federal quality data, behavioral demand), and update browse ranking to surface best-evidenced providers first.

## Success Criteria

- [ ] No Olera Score (stars + number) visible anywhere on provider pages or browse cards
- [ ] Google rating displayed with attribution ("on Google") where available
- [ ] Browse page sorts by evidence density (Google rating × review count + CMS when available)
- [ ] CMS quality data displayed on matched provider pages (~30% of providers)
- [ ] Google review backfill prioritizes CMS-uncovered categories (non-medical home care, assisted living, independent living)
- [ ] Provider pages without reviews show honest "No reviews yet" state
- [ ] No regressions in page load, SEO, or existing review functionality

---

## Phase 1: Remove the Olera Score

### Task 1: Remove score computation and JSON-LD from provider page
- Files: `app/provider/[slug]/page.tsx`
- What: Delete `oleraScore` computation (line 455), `hasOleraScore` (line 462), `scoreBreakdown` + `hasScoreBreakdown` (lines 497-502), `aggregateRating` from JSON-LD (lines 560-568). Remove the 3 prop passes: `oleraScore={oleraScore}` at lines 631, 1042, 1079.
- Keep: `rating` variable (used in hero for Google rating display), `googleReviewsData`, all review logic
- Verify: Provider page loads without score badge in header, hero, sidebar, or mobile sheet. No console errors.

### Task 2: Remove score display from SectionNav (sticky header)
- Files: `components/providers/SectionNav.tsx`
- What: Remove `oleraScore` from props interface (line 16), destructuring (line 28), and the conditional score badge + stars render block (lines 160-182). Keep the provider name and CTA button.
- Verify: Sticky header shows provider name + CTA without score badge.

### Task 3: Remove score display from MobileStickyBottomCTA
- Files: `components/providers/MobileStickyBottomCTA.tsx`
- What: Remove `oleraScore` from interface (line 131), destructuring (line 147), prop pass (line 182), and the score + stars display block (lines 433-448).
- Verify: Mobile bottom sheet opens without score display. Connection flow still works.

### Task 4: Remove score display from ConnectionCard sidebar
- Files: `components/providers/connection-card/CardTopSection.tsx`, `components/providers/connection-card/types.ts`
- What: Remove `oleraScore` from types.ts interface (line 48). Remove from CardTopSection.tsx: interface (line 5), destructuring (line 48), `hasScore` check (line 54), star rendering (line 89), numeric display (line 93).
- Verify: Desktop sidebar connection card renders without score. Connection flow works.

### Task 5: Remove score from admin directory editing
- Files: `app/admin/directory/[providerId]/page.tsx`, `app/api/admin/directory/[providerId]/route.ts`
- What: Remove the "Scores" section with Community Score, Value Score, Info Availability inputs (page.tsx lines 502-508). Remove `community_Score`, `value_score`, `information_availability_score` from updatable fields list (route.ts lines 26-28).
- Note: Don't delete the DB columns — they're in the iOS-owned table. Just stop displaying/editing.
- Verify: Admin directory page loads without score edit fields.

### Task 6: Clean up score mapping in data hooks
- Files: `hooks/useProviderDashboardData.ts`, `components/provider-onboarding/SmartDashboardShell.tsx`, `lib/mock-providers.ts`
- What: Remove `community_Score, value_score, information_availability_score` from Supabase select query in useProviderDashboardData (line 52). Remove the metadata mapping lines (74-85). Remove corresponding lines in SmartDashboardShell (166-168) and mock-providers (709-711).
- Note: Keep the type definitions in `lib/types.ts` and `lib/types/provider.ts` — they describe the iOS schema which we don't own.
- Verify: Provider dashboard and onboarding still load. No missing data errors.

### Task 7: Update hero section rating display
- Files: `app/provider/[slug]/page.tsx`
- What: The hero currently shows `rating` with a star icon (lines 728-734 mobile, 760-766 desktop). This is fine IF it's the Google rating. Add "on Google" attribution text next to the rating. If `google_rating` is null, don't show any rating.
- Verify: Hero shows "4.8 ★ on Google" when Google rating exists, nothing when it doesn't.

### Task 8: Update browse cards to remove score, attribute Google rating
- Files: `components/browse/BrowseCard.tsx`, `components/browse/BrowsePageClient.tsx`
- What: BrowseCard (lines 126-133) shows `rating` with a star. Add "on Google" text. If rating is 0, hide it entirely. Same for legacy BrowsePageClient.
- Verify: Browse cards show "4.8 ★ on Google" or nothing. No "0.0" ratings displayed.

**Phase 1 Verify:** Full walkthrough of provider page (with and without Google reviews), browse page, admin directory, provider dashboard, mobile views. No score visible anywhere. Google ratings properly attributed.

---

## Phase 2: Google Review Backfill for CMS-Uncovered Categories

### Task 9: Add category filter to seed endpoint
- Files: `app/api/admin/seed-google-reviews/route.ts`
- What: Add optional `categories` query param (comma-separated). When provided, add `.in("provider_category", categories)` to the Supabase query. This allows running the seed targeted at specific categories.
- Example: `?categories=Home Care (Non-medical),Assisted Living,Independent Living&limit=500`
- Verify: Dry run with category filter returns correct count. Actual run only processes providers in specified categories.

### Task 10: Run targeted backfill for CMS-uncovered categories
- Files: None (operational task using the endpoint from Task 9)
- What: Execute the seed for categories NOT covered by CMS:
  1. `Home Care (Non-medical)` — largest gap
  2. `Assisted Living`
  3. `Independent Living`
  4. `Memory Care`
- Run as dry_run first to estimate cost, then execute in batches.
- Verify: Check `google_reviews_data` population rate for these categories before and after.

---

## Phase 3: CMS Data Integration

### Task 11: Build CMS data matching script
- Files: New `scripts/cms-match.py` (one-time script, not committed to prod)
- What: Download CMS Home Health (6jpm-sxkc) and Nursing Home (4pq5-n9py) CSV datasets. Match against olera-providers by normalized name + ZIP. Output matched pairs with CMS CCN (certification number) for storage.
- Matching strategy: Normalize names (lowercase, strip LLC/Inc/Corp, standardize St/Saint), match on name + ZIP, fallback to address + ZIP. Manual review of fuzzy matches.
- Verify: Match rate report. Sample of 20 matches manually verified for accuracy.

### Task 12: Add CMS data columns to provider schema
- Files: New `supabase/migrations/022_cms_data.sql`
- What: Add JSONB column `cms_data` to `olera-providers` table. Structure:
  ```json
  {
    "ccn": "string",
    "source": "home_health|nursing_home|hospice",
    "overall_rating": 4,
    "health_inspection_rating": 3,
    "staffing_rating": 4,
    "quality_rating": 5,
    "certification_date": "2015-03-01",
    "deficiency_count": 0,
    "penalty_count": 0,
    "last_synced": "2026-03-20"
  }
  ```
- Verify: Migration runs. Column accessible via Supabase API.

### Task 13: Build CMS data import endpoint
- Files: New `app/api/admin/import-cms-data/route.ts`
- What: Admin endpoint that accepts CSV/JSON of matched CMS data and updates `olera-providers.cms_data` for matched providers. Requires master admin auth.
- Verify: Import 10 test providers. Verify `cms_data` populated correctly in Supabase.

### Task 14: Display CMS data on provider pages
- Files: `app/provider/[slug]/page.tsx`, new `components/providers/CMSQualitySection.tsx`
- What: Read `cms_data` from provider data. If present, render a "Quality & Safety" section showing CMS star ratings, certification date, deficiency status. Position after Reviews section and before About.
- Design: Card with CMS star rating (1-5), key metrics, "Data from Medicare.gov" attribution link.
- Verify: Provider page with CMS data shows the section. Provider page without CMS data doesn't show it. Section links to Medicare.gov.

### Task 15: Display CMS data on browse cards
- Files: `components/browse/BrowseCard.tsx`, `lib/types/provider.ts`
- What: Add `cmsRating` to ProviderCardData. Show "Medicare Quality: ★★★★" on browse cards when CMS data exists. Below the Google rating line.
- Verify: Browse cards show CMS rating where available, nothing where not.

### Task 16: Build CMS quarterly refresh cron
- Files: New `app/api/cron/cms-refresh/route.ts`, update `vercel.json`
- What: Quarterly cron that re-downloads CMS CSVs and re-matches against olera-providers. Updates `cms_data` for all matched providers. Schedule: `0 6 15 1,4,7,10 *` (15th of Jan/Apr/Jul/Oct, 6 AM UTC — after CMS quarterly releases).
- Verify: Cron runs successfully in test mode. Data updates match CMS source.

---

## Phase 4: Smart Ranking on Browse Pages

### Task 17: Update "Recommended" sort to use evidence density
- Files: `components/browse/BrowseClient.tsx`
- What: Replace current `rating × reviewCount` sort (line ~375) with evidence-weighted ranking:
  ```
  score = (googleRating × log(reviewCount + 1) × 3)
        + (cmsRating × 2)
        + (viewCount > 0 ? log(viewCount) : 0)
        + (profileCompleteness × 0.5)
  ```
  Providers with more evidence sources naturally rank higher. Providers with NO signals fall to bottom.
- Depends on: Task 15 (CMS data on cards)
- Verify: Browse page "Recommended" sort puts providers with Google reviews + CMS data at top. Providers with neither at bottom. Order feels intuitively correct.

### Task 18: Update rating filter to handle dual ratings
- Files: `components/browse/BrowseClient.tsx`
- What: Rating filter currently checks `rating` (Google). Update to check `max(googleRating, cmsRating)` so providers with good CMS ratings but no Google reviews aren't filtered out.
- Verify: "4.0+ Stars" filter includes providers with CMS 4-star but no Google rating.

---

## Phase 5: State Licensing Data (Future — Not in MVP)

Deferred. Requires state-by-state data integration starting with California and New York. Plan separately when Phase 3 is validated.

---

## Phase 6: Provider Dashboard Updates (Future — Not in MVP)

Deferred. Show providers their public signals (Google rating, CMS data). Plan separately after Phases 1-4 ship.

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Removing score breaks SEO rich snippets | aggregateRating was likely not driving significant traffic. Can re-add sourced from Google data if needed. |
| Provider pages look too sparse without score | Google rating attribution + CMS data + Q&A + existing content fill the gap. Honest sparse > fake full. |
| CMS matching produces false positives | Manual review of fuzzy matches. Store CMS CCN for future re-matching. Conservative matching thresholds. |
| Google backfill cost for CMS-uncovered categories | Dry run first. Estimated ~$50-100 for remaining providers within Google $200/month credit. |
| Browse ranking feels wrong without score | Keep "Highest Rated" and "Most Reviewed" sorts as fallbacks. Default "Recommended" is the only one changing. |
| Breaking changes in components that receive oleraScore prop | TypeScript will catch missing prop passes. All removal points are documented with line numbers. |

## Notes

- Phase 1 is the only blocking phase. Phases 2-4 can run in parallel after Phase 1 ships.
- The iOS `olera-providers` table is read-only from our perspective. We add columns (JSONB) but don't modify existing ones.
- Google review backfill (Phase 2) can start immediately — it's independent of Phase 1.
- CMS data integration (Phase 3) is the highest-leverage enrichment: ~10,800 providers get federal quality data at zero ongoing cost.
- Keep type definitions for `community_score`, `value_score`, `info_score` in `lib/types.ts` — they describe the iOS schema. Just stop reading/displaying them.
