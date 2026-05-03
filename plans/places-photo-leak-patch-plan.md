# Plan: Patch Places Photo API Leak (Path A)

Created: 2026-05-02
Status: Not Started
Notion: [P1 — Patch Places Photo API leak](https://www.notion.so/4275903a0ffe8166-9d6f-000b1b51cb11)
Related: $25K/yr Mercury alert (May 1, 2026), $4,531 April Google Cloud bill, +184% MoM on Places API (New)

## Goal

Stop `app/api/provider/[slug]/info/route.ts` from calling Google Places Photo API on requests where we already have the photo URL cached in our own database. Reuse `olera-providers.provider_images` (already populated for 81% of providers via the city pipeline) before falling back to a paid API call.

## Success Criteria

- [ ] Route reads `olera-providers.provider_images` and uses it as the image URL when present, in BOTH lookup branches (legacy-only providers AND `business_profiles` with linked legacy record)
- [ ] When the API IS called (only ~19% of providers), the result is written back to `olera-providers.provider_images` so the next visit costs nothing
- [ ] Cached URLs are permanent (Google CDN form via `skipHttpRedirect=true`), not signed-redirect form — so loading the image in the browser does NOT trigger another billable API call
- [ ] Vercel preview build passes; manual test of `/review/[slug]` shows photo for both a cached-provider slug and a leaky-provider slug
- [ ] Google Cloud billing dashboard shows Places API (New) usage drop within 24-48hrs of merge

## Tasks

### Phase 1: Read DB before calling API (the 81% win, ~30 min)

- [ ] **1. Add `provider_images` to the legacy-provider SELECT statements (both branches)**
  - Files: `app/api/provider/[slug]/info/route.ts`
  - Update SELECT at line 56 (`bySlug`) and line 67 (`byProviderId`) to include `provider_images`
  - Update SELECT at line 108 (`linkedProvider` for the business_profiles branch) to include `provider_images`
  - Verify: TypeScript compiles; manually log the query result for a known-cached provider, confirm `provider_images` is populated

- [ ] **2. Use `provider_images` before falling back to API in the LEGACY branch**
  - Files: `app/api/provider/[slug]/info/route.ts` (lines 75-95)
  - Replace lines 77-80:
    ```ts
    let imageUrl: string | null = legacyProvider.provider_images || null;
    if (!imageUrl && legacyProvider.place_id) {
      imageUrl = await fetchGooglePlacePhoto(legacyProvider.place_id);
      // write-back handled in Phase 3
    }
    ```
  - Verify: hit `/api/provider/[cached-slug]/info`, confirm response shows `image_url` matches the DB value AND no Google API call appears in logs

- [ ] **3. Use `provider_images` before falling back to API in the BUSINESS_PROFILES branch**
  - Files: `app/api/provider/[slug]/info/route.ts` (lines 102-122)
  - After the `linkedProvider` query, if `profile.image_url` is empty, also try `linkedProvider?.provider_images`. Only call `fetchGooglePlacePhoto` if both are empty.
  - Verify: hit `/api/provider/[business-profile-slug]/info` for a profile whose linked olera-provider has `provider_images`, confirm response uses that URL without API call

### Phase 2: Write-back + permanent URL form (the 19% gradual fill, ~30 min)

- [ ] **4. Update `fetchGooglePlacePhoto` to return the permanent CDN URL instead of the signed-redirect form**
  - Files: `lib/google-places.ts` (lines 144-153)
  - After fetching photo metadata, make a SECOND request to `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxSize}&key=${apiKey}&skipHttpRedirect=true` and parse `photoUri` from the JSON response (mirrors the pattern at `scripts/enrich-city.js:491-497`)
  - Return `mediaData.photoUri` (a Google CDN URL with no API key embedded — permanent and free to load)
  - Cost note: this changes the fetch from 1 API call to 2, BUT the returned URL is then permanent. Net cost over time: massively lower because the URL is cached forever instead of re-billed per page load.
  - Verify: call the function with a known place_id, confirm returned URL starts with `https://lh3.googleusercontent.com/` (or similar CDN host) and does NOT contain `key=`

- [ ] **5. Write the fetched URL back to `olera-providers.provider_images` in the route**
  - Files: `app/api/provider/[slug]/info/route.ts`
  - In BOTH branches, after `fetchGooglePlacePhoto` returns a non-null URL, fire-and-forget an UPDATE to `olera-providers` setting `provider_images` to that URL (keyed by `provider_id`)
    - Legacy branch: key = `legacyProvider.provider_id`
    - Business_profiles branch: key = `profile.source_provider_id` (only if non-null)
  - Do NOT await the update (don't block the response). Wrap in `.catch(err => console.warn(...))` so failures don't crash anything
  - Verify: hit `/api/provider/[uncached-slug]/info` once, confirm Google API call happens. Hit it a second time after a few seconds, confirm NO Google API call (URL served from DB).

### Phase 3: Ship + monitor (~15 min)

- [ ] **6. Push to staging branch, open PR targeting `staging`**
  - Per CLAUDE.md branch rules
  - PR description: link to Mercury alert, summarize the leak + fix
  - Verify: Vercel preview build passes

- [ ] **7. Manual smoke test on staging preview URL**
  - Test `/review/[slug]` with: a provider that already has `provider_images` (should load fast, no API call), a provider with `place_id` but no `provider_images` (should call API once, then be cached on subsequent loads), a provider with no `place_id` (should return `image_url: null` gracefully)
  - Verify: all 3 cases behave as expected; image renders for the first two

- [ ] **8. After merge to main, watch Google Cloud billing for 24-48hrs**
  - Expected: Places API (New) Photos line item drops by ~80%+
  - If costs spike unexpectedly: revert the PR (normal git revert — bleed is slow enough that a code revert is sufficient, no env-var kill-switch needed)

## Risks

- **Risk: `provider_images` value format varies** (string URL vs JSON array vs object with multiple URLs). Verified via `scripts/enrich-city.js:498` — the script writes a single string URL (`mediaData.photoUri`). All 63K populated rows came from this script, so format is consistent. Safe to treat as `string | null`.
- **Risk: Some `provider_images` URLs are stale or broken** (e.g. provider photo got removed from Google). Mitigation: out of scope — old behavior would have hit the same broken photo. We're not making it worse. Future task: cron script to re-enrich stale entries.
- **Risk: Phase 3 changes the URL format returned by `fetchGooglePlacePhoto`**, which is also called by other code paths. Audit confirmed only the `/info` route uses it. Pipeline scripts use their own inline calls. Safe.
- **Risk: Write-back race condition** — two simultaneous requests for the same uncached provider could both call the API before either writes back. Acceptable: at worst we pay for the photo twice instead of N times. Postgres last-write-wins is fine here.
- **Risk: Build fails on Vercel due to TypeScript strict mode on `linkedProvider?.provider_images`**. Mitigation: explicitly type the SELECT result if needed, or use `any` cast on the SELECT (the existing code already uses untyped `.maybeSingle()` returns, so should be consistent).

## Out of Scope (deferred)

- Pipeline discovery throttling (separate $1.5-7K/yr leak in `scripts/discovery-batch.py`)
- One-time backfill script for the 14,477 leaky providers (~$180 in API costs to fully populate, but write-back covers them organically as visited)
- Path B: download image bytes to Supabase Storage bucket (not needed — Google CDN URLs are permanent enough)
- Removing the `business_profiles.image_url` column or unifying with `provider_images` (out of scope for hotpatch)

## Notes

- The route's existing `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` headers stay as-is — they're orthogonal to the API fix and still useful for reducing route invocations themselves.
- After this ships, the `business_profiles` provider profile flow (Esther's web portal work) is unaffected — `image_url` continues to take priority when set.
- This is a hotpatch, not a refactor. Resist the urge to clean up the dual-table lookup pattern in this PR.
