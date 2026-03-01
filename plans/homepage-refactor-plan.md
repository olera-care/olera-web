# Plan: Section-by-Section Homepage Refactor

Created: 2026-02-28
Status: Not Started
Notion: P1 — "Claude Code Prompt: Section-by-Section Homepage Refactor"

## Goal

Transform the homepage from a monolithic marketing page into a structured **discovery and decision surface** that guides care seekers through **Search → Narrow → Confidence → Action** — iterating one section at a time.

## Success Criteria

- [ ] Homepage `app/page.tsx` reduced from 1,440 lines to <200 (composition of section components)
- [ ] Each section is an independent component in `components/home/`
- [ ] No redundant sections (the two "browse care" sections consolidated into one)
- [ ] Page flow follows Search → Narrow → Confidence → Action
- [ ] No visual regressions — screenshot comparison before/after each phase
- [ ] Build passes (`next build`) after every phase

## Current State (from audit)

```
1,440-line monolithic app/page.tsx with 8 sections:

1. Hero (search)                    ← KEEP (recently redesigned, strong)
2. Top Providers Near You           ← KEEP (good discovery)
3. Explore Care Options (bento)     ← REDUNDANT with #6
4. Social Proof Stats (animated)    ← HEAVY (264 lines for 3 numbers)
5. Aging in America (video)         ← INTERRUPTS flow
6. Browse by Care Type (tabs)       ← REDUNDANT with #3
7. Community Forum (mock data)      ← MOCK DATA liability
8. Final CTA                        ← KEEP (standard)
```

**Problem:** The flow goes Search → Providers → Categories → *Stats pause* → *Video pause* → More Categories → Community → CTA. Stats and video break discovery momentum. Two category sections compete.

## Tasks

### Phase 1: Extract Sections into Components (structural, no visual changes)

This is the prerequisite for all future section work. Break the monolith so each section can be iterated independently.

- [ ] 1. Extract Hero section → `components/home/HeroSection.tsx`
      - Files: `app/page.tsx`, new `components/home/HeroSection.tsx`
      - Includes: search logic, geolocation, city search, care type dropdown, routing
      - Move `useCitySearch` import, `stateAbbreviations`, `careTypeOptions` with it
      - Verify: Page renders identically, search works, geolocation works

- [ ] 2. Extract Top Providers section → `components/home/TopProvidersSection.tsx`
      - Files: `app/page.tsx`, new `components/home/TopProvidersSection.tsx`
      - Includes: Supabase fetch, scroll carousel, BrowseCard rendering
      - Verify: Provider cards load, scroll arrows work, "View all" links correctly

- [ ] 3. Extract Bento Grid section → `components/home/ExploreCareSection.tsx`
      - Files: `app/page.tsx`, new `components/home/ExploreCareSection.tsx`
      - Includes: `bentoCards` data, `BentoGridSection` function
      - Verify: Grid renders, hover effects work, links route correctly

- [ ] 4. Extract Social Proof + Video → `components/home/SocialProofSection.tsx`
      - Files: `app/page.tsx`, new `components/home/SocialProofSection.tsx`
      - Includes: `useInView`, `useAnimatedCounters` hooks, animated counters, SVG, YouTube embed
      - Move inline hooks to `hooks/use-in-view.ts` and `hooks/use-animated-counters.ts`
      - Verify: Counter animations trigger on scroll, video plays

- [ ] 5. Extract Community Forum → `components/home/CommunitySection.tsx`
      - Files: `app/page.tsx`, new `components/home/CommunitySection.tsx`
      - Includes: mock data rendering, forum cards, resource/benefits links
      - Verify: Cards render, links work, time formatting correct

- [ ] 6. Extract Final CTA → `components/home/CTASection.tsx`
      - Files: `app/page.tsx`, new `components/home/CTASection.tsx`
      - Verify: Buttons link correctly

- [ ] 7. Verify clean composition in `app/page.tsx`
      - Files: `app/page.tsx`
      - Final file should be ~50-100 lines: imports + section composition
      - Verify: `npm run build` passes, full page screenshot matches before-state

### Phase 2: Reorder & Consolidate the Flow

With sections extracted, reorganize the page to follow Search → Narrow → Confidence → Action.

- [ ] 8. Consolidate the two category browse sections
      - Merge Bento Grid (#3) and Browse by Care Type (#6) into a single unified section
      - Keep the bento grid visual (it's more compelling) but add the tab-switching behavior
      - OR keep the tabbed carousel but remove the bento grid entirely
      - **Decision needed from TJ:** Which browse pattern to keep?
      - Files: `components/home/ExploreCareSection.tsx`, `components/home/BrowseByCareTypeSection.tsx`
      - Verify: Single browse section, no redundancy, all care types accessible

- [ ] 9. Reposition Social Proof as a lightweight trust strip
      - Move from a heavy animated section to a subtle inline trust bar
      - e.g., "48,000+ providers · 12,000+ families connected · 500+ cities"
      - Position between Hero and first content section (not between browse sections)
      - Files: `components/home/SocialProofSection.tsx` (simplify dramatically)
      - Verify: Trust info visible without interrupting discovery flow

- [ ] 10. Decide Aging in America placement
      - Options: (a) Move to Resources page, (b) Embed in Community section, (c) Remove from homepage
      - **Decision needed from TJ**
      - Files: `components/home/SocialProofSection.tsx` or relevant section
      - Verify: Video accessible from wherever it lands, homepage flow uninterrupted

- [ ] 11. New page order implementation
      - Target flow:
        ```
        1. Hero (Search)
        2. Trust strip (Confidence — lightweight)
        3. Top Providers Near You (Narrow)
        4. Explore/Browse Care [consolidated] (Narrow)
        5. Community + Resources (Confidence)
        6. CTA (Action)
        ```
      - Files: `app/page.tsx` (reorder imports)
      - Verify: Full page screenshot review, flow feels like Search → Narrow → Confidence → Action

### Phase 3: Section-by-Section Polish (iterate per Notion task)

Each section gets its own deep-dive improvement pass, as described in the Notion task.

- [ ] 12. Hero section deep dive
      - Follow the Notion task's "Hero deep dive" protocol
      - Evaluate: decision moment quality, secondary path for unsure users, guided start
      - Files: `components/home/HeroSection.tsx`

- [ ] 13. Top Providers section polish
      - Evaluate card density, information hierarchy, personalization potential
      - Files: `components/home/TopProvidersSection.tsx`

- [ ] 14. Unified browse section polish
      - Evaluate as "fast intent accelerator"
      - Files: whichever component survives from task 8

- [ ] 15. Community section — real data or remove
      - Either connect to real forum data or remove mock posts
      - Keep resource/benefits links regardless
      - Files: `components/home/CommunitySection.tsx`

## Risks

| Risk | Mitigation |
|------|-----------|
| Breaking search functionality during Hero extraction | Test geolocation, city search, routing after extraction |
| Losing scroll state/animations during extraction | Each section is already self-contained with refs; should port cleanly |
| Two card components (BrowseCard vs ProviderCard) cause inconsistency | Standardize on BrowseCard for homepage (already used in Top Providers) |
| Mock forum data ships to production | Phase 3 addresses this — either connect real data or remove |
| Large diff when extracting sections | Commit after each extraction (tasks 1-6) to keep diffs reviewable |

## Decisions Needed Before Phase 2

1. **Which browse pattern to keep?** Bento grid (visual) vs Tabbed carousel (functional) vs Hybrid
2. **Where does Aging in America go?** Resources page / Community section / Remove
3. **Card component standardization:** BrowseCard everywhere, or keep ProviderCard for tabbed section?

## Notes

- Phase 1 is purely structural — zero visual changes, just extraction. Safe to do without design review.
- Phase 2 requires TJ's input on 2-3 design decisions before implementation.
- Phase 3 follows the Notion task's section-by-section protocol (Hero first, then next section, etc.)
- The homepage is `"use client"` — all extracted sections will also be client components.
- Branch from `staging` per CLAUDE.md workflow.
