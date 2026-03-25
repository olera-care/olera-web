# Plan: Data-Driven Provider Highlights + Care Service Label Dedup

Created: 2026-03-24
Status: Not Started
Notion: [Task](https://www.notion.so/Logan-s-Audit-QA-de-duplicate-care-service-labels-on-all-provider-pages-32c5903a0ffe8166a12bf29c98319e7e)

## Problem

Three layered issues on provider pages:

1. **Duplicate labels** — "Home care", "Non-medical home care", "In-home care" appear as separate highlights because dedup only catches exact case-insensitive matches, not synonyms.
2. **Highlights are services in disguise** — "In-Home Care" on a Home Care agency page is tautological. Highlights should answer "why trust this provider?", not "what category are they?"
3. **Zero differentiation** — Every Home Care agency shows the same 4 hardcoded highlights. 10K+ providers, identical badges. Users notice. Feels auto-generated.

## Goal

Replace static category-template highlights with a data-driven system that shows the most compelling *verified* facts about each specific provider, gracefully degrading to fewer (not faker) highlights when data is sparse.

## Success Criteria

- [ ] No duplicate or near-duplicate labels on any provider page (detail or card)
- [ ] Highlights are sourced from real per-provider data when available (trust signals, reviews, CMS)
- [ ] Providers with no per-provider data show 0-2 honest labels, not 4 generic ones
- [ ] Browse cards and detail page both use the same highlight generation logic
- [ ] The two duplicate `CATEGORY_HIGHLIGHTS` maps are consolidated into one
- [ ] `next build` passes with zero errors

## Design: Priority Waterfall

Generate highlights by working through tiers of data quality, filling up to 4 slots:

| Tier | Source | Example Highlights | Coverage |
|------|--------|--------------------|----------|
| 1 | AI Trust Signals (confirmed) | "State Licensed", "Accredited", "BBB Rated", "Clean Record" | ~40-50% |
| 2 | Longevity + Social Proof | "Est. 2008", "Highly Rated" (≥4.5★, 10+ reviews) | ~50-60% |
| 3 | CMS Medicare Quality | "Medicare Quality: 5/5" (5-star only in highlights) | ~10-15% |
| 4 | Staff Screening | "Background-Checked", "Licensed", "Insured" | ~10-20% |
| 5 | One capability label | "Home Care", "Skilled Nursing" (max 1, normalized) | 100% fallback |

**Key rule**: Stop filling when we run out of verified data. 1 real highlight > 4 fake ones.

### Detail Page vs Browse Card

- **Detail page**: Full waterfall, up to 4 items in the 2x2 grid.
- **Browse card**: Simpler — 1-3 items. Cards already show CMS badge and "X Verified Credentials" as separate UI elements, so card highlights focus on the strongest trust signal + one capability.

## Tasks

### Phase 1: Core Highlight Engine

- [ ] 1. Create `lib/provider-highlights.ts` — the shared highlight builder
      - New function: `buildHighlights({ trustSignals, googleReviews, cmsData, staffScreening, careTypes, category }): HighlightItem[]`
      - Each `HighlightItem` = `{ label: string; tier: number; icon: HighlightIconType }`
      - Implements the 5-tier waterfall above
      - Max 4 items for detail page, configurable `maxItems` param
      - Synonym normalization map for care_types (Tier 5)
      - Exported `normalizeCareLabel(label: string): string` for reuse
      - Files: `lib/provider-highlights.ts` (NEW)
      - Depends on: none
      - Verify: Unit-testable pure function — import and call with mock data

- [ ] 2. Create synonym normalization map
      - ~20-30 entries mapping variant strings → canonical display labels
      - Covers: "Home Care (Non-medical)" → "Home Care", "In-home care" → "In-Home Care", etc.
      - Also normalizes care_types for the CareServicesList (detail page services section)
      - Files: `lib/provider-highlights.ts` (same file, exported map)
      - Depends on: Task 1
      - Verify: All known variants from `CATEGORY_HIGHLIGHTS`, `categoryHighlights`, and `COMMON_SERVICES` are mapped

- [ ] 3. Delete duplicate `CATEGORY_HIGHLIGHTS` in `lib/types/provider.ts`
      - Remove the hardcoded map at line 132-140 and `getHighlightsForCategory()` at line 142-144
      - These are replaced by the waterfall in `lib/provider-highlights.ts`
      - Keep `CATEGORY_FALLBACK_POOLS` (images) — those are unrelated
      - Files: `lib/types/provider.ts`
      - Depends on: Task 1
      - Verify: No imports of `getHighlightsForCategory` remain; `next build` passes

### Phase 2: Detail Page Integration

- [ ] 4. Replace highlight builder in provider detail page
      - Replace lines 483-500 in `app/provider/[slug]/page.tsx` with call to `buildHighlights()`
      - Pass in: `aiTrustSignals`, `googleReviewsData`, `cmsData`, `staffScreening`, `profile.care_types`, `profile.category`
      - All data already fetched — zero new queries needed
      - Files: `app/provider/[slug]/page.tsx`
      - Depends on: Tasks 1, 3
      - Verify: Load provider pages with varying data richness; confirm highlight variety

- [ ] 5. Update `HighlightIcon` component to handle new highlight types
      - Current icon matching (lines 193-241) uses keyword sniffing on labels
      - Add patterns for new Tier 1-3 labels: "Accredited" → badge, "Est. 20XX" → clock, "Highly Rated" → star, "Medicare Quality" → shield, "BBB" → badge, "Clean Record" → shield-check
      - Refactor: switch from keyword sniffing to `HighlightIconType` enum passed from builder (cleaner, no regex fragility)
      - Files: `app/provider/[slug]/page.tsx` (HighlightIcon function)
      - Depends on: Task 4
      - Verify: Each highlight type renders with an appropriate icon

- [ ] 6. Support variable highlight count in detail page layout
      - Current: always renders 4 items in a 2x2 grid
      - New: 1 item = single row, 2 items = 1x2 row, 3 items = grid with one spanning, 4 items = 2x2 grid
      - Or simpler: flex-wrap row that naturally flows 1-4 items
      - Files: `app/provider/[slug]/page.tsx` (highlight rendering, lines 787-806)
      - Depends on: Task 4
      - Verify: Visually test with 1, 2, 3, and 4 highlights

- [ ] 7. Apply normalization to CareServicesList data
      - In the careServices builder (lines 473-481), run each label through `normalizeCareLabel()` before dedup
      - This fixes the services section too, not just highlights
      - Files: `app/provider/[slug]/page.tsx`
      - Depends on: Task 2
      - Verify: No near-duplicate services appear in the services grid

### Phase 3: Browse Card Integration

- [ ] 8. Update `toCardFormat()` to use `buildHighlights()` for seeded providers
      - Currently calls `getHighlightsForCategory()` (static defaults)
      - Pass `provider.ai_trust_signals`, `provider.google_reviews_data`, `provider.cms_data` into `buildHighlights()`
      - Use `maxItems: 3` for card context
      - Files: `lib/types/provider.ts` (toCardFormat, line 352)
      - Depends on: Tasks 1, 3
      - Verify: Browse page cards show varied highlights per provider

- [ ] 9. Update `businessProfileToCardFormat()` similarly
      - Currently calls `getHighlightsForCategory()` (static defaults)
      - Business profiles may lack trust signals — the builder handles this gracefully (falls through to Tier 5)
      - Files: `lib/types/provider.ts` (businessProfileToCardFormat, line 490)
      - Depends on: Tasks 1, 3
      - Verify: Claimed provider cards show appropriate highlights

- [ ] 10. Remove duplicate `categoryHighlights` map from `lib/provider-utils.ts`
      - Lines 56-69 duplicate the same data as `CATEGORY_HIGHLIGHTS` in provider.ts
      - `getCategoryHighlights()` at line 71-73 is used in the detail page builder (being replaced in Task 4)
      - Verify no other callers remain, then delete
      - Files: `lib/provider-utils.ts`
      - Depends on: Tasks 4, 8, 9
      - Verify: `next build` passes, no dead imports

### Phase 4: Design Polish (from Notion task — "give deep thought to the highlight section")

- [ ] 11. Taste pass on highlight visual treatment
      - Current: 2x2 grid of gray cards (mobile) / bordered cards (desktop)
      - Evaluate against Airbnb/Luma aesthetic: calm, clean, restrained
      - Consider: inline horizontal layout (like Airbnb key facts) vs card grid
      - Consider: subtle tier-based styling (trust signals get shield accent, capabilities get neutral)
      - No new features — less UI, fewer boxes, reduce cognitive load
      - Files: `app/provider/[slug]/page.tsx` (highlight rendering section)
      - Depends on: Task 6
      - Verify: Visual review on mobile + desktop

### Phase 5: Verification

- [ ] 12. Full QA pass
      - Load 10+ provider pages across categories with varying data richness
      - Confirm: no duplicate labels, no tautological highlights, honest sparse displays
      - Confirm: browse cards reflect per-provider data
      - Confirm: `next build` clean
      - Files: none (testing only)
      - Depends on: All above
      - Verify: Zero duplicate or near-duplicate labels across all tested pages

## Risks

| Risk | Mitigation |
|------|------------|
| Providers with no trust signals show empty/sparse highlights | Tier 5 fallback ensures at least 1 capability label. 0 highlights is also acceptable — better than 4 fake ones |
| Removing `getHighlightsForCategory` breaks other callers | Grep for all imports before deleting. `toCardFormat` and `businessProfileToCardFormat` are the only callers besides the detail page |
| Browse page perf regression from reading trust signals into cards | Trust signals are already on the provider object (`ai_trust_signals` column) — no new queries, just reading existing data |
| Synonym map doesn't cover all variants in production data | Start with known variants from code. Can query Supabase for distinct `care_types` values to catch more. Map is easy to extend |

## Notes

- **No database migration needed.** All normalization is render-time.
- **No LLM generation.** Trust signals are already AI-verified (Perplexity Sonar). No additional AI cost.
- **No new data collection.** Works with what's already in the database.
- The `categoryServices` map in `provider-utils.ts` (lines 119-180) stays — it's for the services list, not highlights.
- The `categoryDescriptionTemplates` in `provider-utils.ts` (lines 79-104) stays — it's for fallback descriptions.
