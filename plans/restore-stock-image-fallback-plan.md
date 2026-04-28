# Plan: Restore category stock-image fallback on provider pages

Created: 2026-04-28
Status: Not Started
Notion: [P2 task](https://www.notion.so/Restore-category-stock-image-fallback-on-provider-pages-replace-gradient-initials-placeholder)

## Goal

Replace the gradient + initials + "No photos yet" placeholder with a tasteful category stock image on (a) the provider detail page hero and (b) browse listing cards, restoring the v1.0 behavior. The infrastructure already exists in code — we're reconnecting it.

## Success Criteria

- [ ] `/provider/accel-at-college-station` (and any photoless provider) shows a home-care stock photo in the hero, not the gradient + "CK"-style initials block
- [ ] `/browse` cards for unclaimed business profiles (e.g. Comfort Keepers, Visiting Angels in current screenshot) show category-appropriate stock photos, not gradient + initials
- [ ] Same provider always gets the same stock image across renders (deterministic hash, no flicker)
- [ ] All 6 in-scope categories work: Home Care (Non-medical), Home Health Care, Assisted Living, Independent Living, Memory Care, Nursing Home
- [ ] Artifact categories (hospice/rehab/adult day care/wellness/private caregiver) gracefully fall through to home-care imagery via `DEFAULT_FALLBACK_POOL` — no gradient remains visible anywhere
- [ ] Typecheck clean, build clean, no eslint regression

## Diagnosis (from exploration)

The fallback pools + helper function already exist at `lib/types/provider.ts:187-259`:
- `CATEGORY_FALLBACK_POOLS` (5 buckets × 3 stock images)
- `getCategoryFallbackImage(category, providerId)` (deterministic per-provider picker)
- `DEFAULT_FALLBACK_POOL` (home-care photos as the catch-all)

Two bugs prevent it from rendering:

**Bug 1 — Detail page hero** (`components/providers/ProviderHeroGallery.tsx:42-55`)
The gallery component was never integrated. When `images.length === 0`, it renders the gradient block. It doesn't import the helper or accept `providerId` as a prop.

**Bug 2 — Browse card business profiles** (`lib/types/provider.ts:475-476`)
`businessProfileToCardFormat()` does call `getCategoryFallbackImage()` to set `image`, but then returns `imageType: hasImage ? "photo" : "placeholder"`. The "placeholder" branch causes all three card components (`BrowsePageClient`, `BrowseCard`, `ProviderCard`) to render the gradient block instead of the stock image URL that's sitting right there in `image`.

Note: seeded provider browse cards (`resolveCardImage()` at line 276-292) already return `imageType: "photo"` for fallback URLs — they should be working today. The visible "broken" cards in the user's screenshot (Comfort Keepers, Visiting Angels) are unclaimed **business profiles**, which is why bug 2 is the live regression.

## Tasks

### Phase 1: Wire up detail page hero

- [ ] **1. Export the fallback helper from `lib/types/provider.ts`**
  - Files: `lib/types/provider.ts`
  - Action: add `export` to `getCategoryFallbackImage` (line 255). Add a new exported convenience wrapper `getProfileCategoryFallbackImage(category: ProfileCategory | null, providerId: string)` that internally maps via the existing `PROFILE_CAT_TO_SUPABASE_CAT` (line 412) and delegates to `getCategoryFallbackImage`. Keeps the page simple.
  - Verify: `npx tsc --noEmit` clean
  - Depends on: none

- [ ] **2. Append fallback image to `images` array on detail page when empty**
  - Files: `app/provider/[slug]/page.tsx` (around line 724 where `<ProviderHeroGallery>` is rendered with `images={images}`)
  - Action: after the existing `images` array is built but before passing to `<ProviderHeroGallery>`, if `images.length === 0`, push `getProfileCategoryFallbackImage(profile.category, profile.id)` so the gallery has exactly one stock photo to render through its existing `<Image fill>` path.
  - Verify: `npm run dev`, visit `/provider/accel-at-college-station` — should see a home-care stock photo where the gradient was. No "No photos yet" caption. Carousel arrows + counter should NOT appear (only 1 image).
  - Depends on: 1

### Phase 2: Fix browse card for unclaimed business profiles

- [ ] **3. Change `businessProfileToCardFormat` to return `imageType: "photo"` for fallback URLs**
  - Files: `lib/types/provider.ts` (lines 475-476 in `businessProfileToCardFormat`)
  - Action: change `imageType: hasImage ? "photo" : "placeholder"` → `imageType: "photo"`. Rationale: `image` is always set now (either real photo, primary metadata image, or stock fallback) — none of those should render as gradient. The "placeholder" branch was the bug.
  - Verify: `npm run dev`, visit `/browse?careType=home-care&location=college-station-tx` (or any city) — Comfort Keepers and Visiting Angels-style unclaimed cards should show home-care stock photos instead of gradient + initials. Cards with real photos (Homewatch, Century Home Care) unchanged.
  - Depends on: none (independent of Phase 1)

### Phase 3: Verify & ship

- [ ] **4. Smoke test across categories**
  - Manual checks (one provider per category, prefer photoless ones):
    - [ ] Home Care detail + browse card
    - [ ] Home Health Care detail + browse card
    - [ ] Assisted Living detail + browse card
    - [ ] Independent Living detail + browse card
    - [ ] Memory Care detail + browse card
    - [ ] Nursing Home detail + browse card
    - [ ] One artifact category (hospice or rehab) — should fall through to home-care imagery, no gradient
  - Verify: every page shows a real stock photo, no gradient, no broken `<img>` (404)
  - Depends on: 2, 3

- [ ] **5. Build + typecheck + lint**
  - Files: full repo
  - Action: `npx tsc --noEmit && npm run build && npm run lint`
  - Verify: 0 type errors, build succeeds, no NEW lint errors (8 pre-existing on `<a href="/provider/reviews">` are baseline)
  - Depends on: 4

- [ ] **6. Open PR to staging**
  - Branch off `staging` (current branch `funny-wu` is fine). PR title: `Restore category stock-image fallback on provider pages`. Body: link to Notion task, before/after screenshots of detail + browse, note that the helper has existed since `d4ffa24a` and was simply unwired.
  - Depends on: 5

## Risks

- **Visual regression on detail pages with real images** — None expected; we only modify the `images.length === 0` branch. Existing photo carousels untouched.
- **Visual regression on browse cards with claimed profiles** — None expected; claimed profiles set `image_url` so `primaryImage` is truthy and stock fallback is skipped.
- **Stock image 404s** — All 15 files exist in `public/images/fallback/` (verified via `ls`). Next.js serves from `/public/`, so paths like `/images/fallback/home-care-1.jpg` resolve correctly.
- **Hydration mismatch** — `getCategoryFallbackImage` is deterministic on `providerId`, so SSR and client compute identical URLs. No mismatch.
- **`ProviderHeroGallery` 0-image gradient code path becomes dead** — Acceptable. Leaving it as defensive fallback (e.g. for future surfaces that don't pass providerId). Not removing in this PR per "don't expand scope" memory.

## Out of scope

- Cleaning up artifact categories (hospice/rehab/adult day care/wellness/private caregiver) — separate project per TJ
- Sourcing additional stock images — current library is sufficient
- Success-metric instrumentation (bounce rate, CTR) — visual cleanup, not a measurement task
- Removing the dead gradient branch in `ProviderHeroGallery` — leave defensive
- The `imageType: "placeholder"` enum value itself — still used by other card components for the broken-image-load `imgFailed` state, keep it

## Notes

- Helper introduced in commit `d4ffa24a` ("Surface approved providers in public search results") — design intent was always to use stock fallbacks; `ProviderHeroGallery` integration was simply forgotten/dropped during the v1→v2 hero rewrite
- Stock image library at `public/images/fallback/`: 5 buckets × 3 images = 15 photos total (assisted-living, home-care, independent-living, memory-care, nursing-home)
- Two home-care types (non-medical + home-health) intentionally share the home-care pool per TJ — imagery is largely the same
- Memory to re-check before recommending: the file paths (`lib/types/provider.ts`, `components/providers/ProviderHeroGallery.tsx`, `app/provider/[slug]/page.tsx`, `app/browse/BrowsePageClient.tsx`) are all current as of 2026-04-28 (verified via grep during exploration)
