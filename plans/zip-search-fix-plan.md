# Plan: Fix ZIP Code Search + Graceful No-Coverage Handling

Created: 2026-03-23
Status: Not Started

## Goal

Make ZIP code search return results for all metros where we have provider data (NYC boroughs, Butte-Silver Bow), and show a delightful fallback experience for areas where we don't have coverage yet.

## Problem Summary

Three issues discovered during exploration:

1. **NYC borough mismatch (HIGH):** ZIP 10001 → resolves to "New York" → 0 results. DB stores providers under "Manhattan", "Brooklyn", "Bronx", "Queens" — never "New York". ~153 invisible NYC providers.
2. **Butte-Silver Bow mismatch (LOW):** ZIP 59701 → resolves to "Butte" → 0 results. DB stores as "Butte-Silver Bow". 10 invisible providers.
3. **No-coverage empty state (MEDIUM):** Small towns with no providers (Battle Ground WA, Ada OK, etc.) show a cold "No providers found yet" message with just a state-level browse link. Not delightful.

Abbreviation audit (St./Saint, Ft./Fort, Mt./Mount) came back clean — no mismatches.

## Success Criteria

- [ ] ZIP 10001 → "Home Care in New York, NY" shows Manhattan/Brooklyn/Bronx/Queens providers
- [ ] ZIP 59701 → "Assisted Living in Butte, MT" shows Butte-Silver Bow providers
- [ ] All 6 care type power pages work for NYC ZIPs
- [ ] Small towns with 0 providers show a warm fallback with nearby city suggestions
- [ ] No regression for working metros (LA, Chicago, Houston, etc.)
- [ ] Browse page search also handles aliases (wildcard path)

## Tasks

### Phase 1: City Alias Map (fixes the data mismatch)

- [ ] 1. Create `lib/city-aliases.ts` — shared alias lookup
      - Map: `{ "New York": ["Manhattan", "Brooklyn", "Bronx", "Queens", "Staten Island"], "Butte": ["Butte-Silver Bow"] }`
      - Export a function: `expandCityAliases(city: string): string[]` — returns the alias list if one exists, otherwise `[city]`
      - Keep it simple — flat map, not a database call
      - Files: `lib/city-aliases.ts` (new)
      - Verify: Unit-level — import and call with "New York" → expect 5 boroughs

- [ ] 2. Update `fetchPowerPageData()` to use alias expansion
      - When `city` has aliases, use `.in("city", aliases)` instead of `.ilike("city", city)`
      - Apply to both the `olera-providers` query and the `business_profiles` query
      - Sum counts across all alias cities
      - Files: `lib/power-pages.ts` (lines 193-223)
      - Depends on: Task 1
      - Verify: `fetchPowerPageData({ category: "Home Care (Non-medical)", stateAbbrev: "NY", city: "New York" })` returns providers from Manhattan + Brooklyn + Bronx + Queens

- [ ] 3. Update `CityBrowseClient` to use alias expansion for client-side queries
      - The client-side refetch (when user changes filters) also needs alias-aware queries
      - When the initial `cityName` has aliases, expand the Supabase query
      - Files: `components/browse/CityBrowseClient.tsx` (around line 167)
      - Depends on: Task 1
      - Verify: Filter changes on NYC power page still return results

### Phase 2: Graceful No-Coverage Fallback

- [ ] 4. Create `lib/nearest-city.ts` — find nearest city with providers
      - Use the cities-tier1.json data (top 200 cities with lat/lng + population)
      - Given a city name + state, find the closest city in the same state (or neighboring state) that has provider coverage
      - Haversine distance calculation — pick the closest major city
      - Export: `getNearestCoveredCity(cityName: string, state: string): { city: string, state: string, distance: number, slug: string } | null`
      - Files: `lib/nearest-city.ts` (new)
      - Verify: "Battle Ground, WA" → suggests "Seattle, WA" (~25 mi)

- [ ] 5. Redesign the empty state in the power page
      - Replace the cold "No providers found yet" with a warm, helpful experience:
        - Heading: "We're expanding to {cityName} soon"
        - Subtext: "We don't have {category} providers in {cityName} yet, but we're growing fast."
        - **Nearest city CTA**: "In the meantime, explore {count} {category} providers in {nearestCity}" with a button linking to that power page
        - **Cross-category links**: Keep existing "More Senior Care Options in {State}" section
        - **Notify me (stretch)**: Optional email capture — "Get notified when we add providers in {cityName}" (can defer this)
      - Files: `app/[category]/[state]/[city]/page.tsx` (lines 149-179)
      - Depends on: Task 4
      - Verify: Visit `/home-care/washington/battle-ground` → see warm fallback with Seattle suggestion

- [ ] 6. Handle alias cities in page metadata and SEO
      - When NYC aliases are expanded, the H1 should still say "Home Care in New York, NY" (not "Home Care in Manhattan, NY")
      - The provider count in the description should reflect the combined total
      - JSON-LD breadcrumbs stay as "New York"
      - Files: `app/[category]/[state]/[city]/page.tsx` (metadata + seoContent)
      - Depends on: Task 2
      - Verify: Page title for `/home-care/new-york/new-york` says "Home Care in New York, NY" with correct count

### Phase 3: Testing & Polish

- [ ] 7. Manual verification matrix
      - Test these ZIPs end-to-end (search → page → results):
        - 10001 (NYC) — should show 100+ providers across boroughs
        - 10003 (NYC, East Village) — same as above
        - 11201 (Brooklyn ZIP) — should show Brooklyn + other borough providers
        - 59701 (Butte, MT) — should show 10 providers
        - 90210 (Beverly Hills) — should still work (no alias needed)
        - 60601 (Chicago) — should still work
        - 98604 (Battle Ground, WA) — should show warm fallback → Seattle
        - 74820 (Ada, OK) — should show warm fallback → nearest OK city
      - Files: none (manual testing)
      - Verify: All 8 scenarios pass

- [ ] 8. Audit for additional alias candidates
      - Query Supabase for any other cities where zip-index name ≠ DB name
      - Check consolidated city-county names (like Butte-Silver Bow)
      - Add any new aliases to the map
      - Files: `lib/city-aliases.ts`
      - Depends on: Task 7
      - Verify: No new failures in expanded test

## Risks

- **SEO impact**: NYC power pages currently have 0 providers → low authority. Adding providers is purely additive for SEO. No regression risk.
- **Query performance**: `.in("city", [...5 boroughs])` is fast — Supabase handles IN clauses efficiently with the existing city index.
- **Alias map maintenance**: New pipeline cities could introduce new mismatches. The alias map is manually maintained — consider a periodic audit script.
- **URL stability**: URLs stay as `/home-care/new-york/new-york` — no URL changes, no redirect needed.

## Notes

- The alias map is intentionally a code-level constant, not a DB table. There are only 2 known mismatches (NYC + Butte). If this grows to 20+, consider moving to Supabase.
- The nearest-city fallback needs lat/lng data. cities-tier1.json already has this for top 200 cities. For smaller towns, we can use the zip-index.json which also has coordinates.
- Phase 2 (graceful fallback) is the more user-visible improvement. Phase 1 (alias map) fixes the data bug. Both are important but could ship independently.
