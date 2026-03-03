# Plan: Caregiver Support Page — Editorial Redesign

Created: 2026-03-02
Status: Not Started
Branch: `joyful-turing` (from `staging`)

## Goal

Redesign `/caregiver-support` from a generic CMS grid into an editorial surface — calm, premium, spacious, high-trust — inspired by Fuse, Craft, Perplexity, and Notion blogs.

## Success Criteria

- [ ] Hero header with serif title, generous vertical padding, no gradient/banner
- [ ] Featured section showing 1 dominant + 2 secondary articles (asymmetric layout)
- [ ] Category filters redesigned as soft text pills with subtle active state
- [ ] Article grid with larger images, stronger typography hierarchy, more whitespace
- [ ] Subtle hover states (image scale or fade, not color change)
- [ ] Page feels "composed, not assembled" — spacing creates structure, not borders
- [ ] Works on mobile, tablet, and desktop
- [ ] Mock data fallback preserved
- [ ] No changes to individual article pages (`/caregiver-support/[slug]`)
- [ ] `next build` passes

## Current State

**File:** `app/caregiver-support/page.tsx` (349 lines)

The page is a single client component that:
- Fetches all articles from `/api/caregiver-support?per_page=200`
- Falls back to `MOCK_RESOURCES` if API fails
- Filters by care type (pill buttons)
- Paginates at 12 articles/page
- Renders a uniform 3-column grid with `ArticleCard`
- Includes `ProviderBanner` CTA after row 2

**Data model:** `featured: boolean` exists on `ContentArticle` but is unused in the listing UI. The API already returns the `featured` field.

## Tasks

### Phase 1: Data Layer — Featured Articles Support

- [ ] **1. Add `featured` query param to the API route**
  - File: `app/api/caregiver-support/route.ts`
  - Add optional `?featured=true` query param that filters `.eq("featured", true)`
  - Verify: `curl localhost:3000/api/caregiver-support?featured=true` returns only featured articles

- [ ] **2. Ensure featured articles exist in Supabase**
  - Use the admin dashboard (`/admin/content`) to mark 3 articles as featured
  - If no articles are featured, the featured section should gracefully hide
  - Verify: API returns at least 1 article with `featured: true`

### Phase 2: Page Restructure — Editorial Layout

- [ ] **3. Restructure the page into section components**
  - File: `app/caregiver-support/page.tsx`
  - Break the monolith into inline sections (no new component files — keep it in one page file like the original, just better organized):
    - `HeroHeader` — serif title, subtitle, generous padding
    - `FeaturedSection` — asymmetric featured layout
    - `CategoryFilters` — redesigned pills
    - `ArticleGrid` — editorial grid
    - `LoadingSkeleton` — updated to match new layout
  - Keep all state management in `ResourcesPageContent`
  - Verify: Page renders with same data, new visual structure

- [ ] **4. Build the Hero Header**
  - Large serif heading (`font-display text-display-lg md:text-display-xl`)
  - Subtle subheading in sans-serif, muted color
  - White/near-white background
  - Generous vertical padding (`py-20 md:py-28`)
  - Left-aligned on desktop (editorial feel), centered on mobile
  - Verify: Hero feels spacious and intentional, not template-y

- [ ] **5. Build the Featured Section**
  - Fetch featured articles (filter from the already-loaded data, `featured: true`)
  - Layout: 1 dominant article (left, ~60% width) + 2 secondary (right, stacked)
  - Dominant: large image, large serif headline, excerpt, reading time
  - Secondary: smaller image, smaller headline, reading time
  - Image-forward — images should be the dominant visual element
  - No heavy cards, thick shadows, or boxed containers
  - Spacing creates structure, not borders
  - Fallback: if 0 featured articles → skip section entirely; if 1 → show it full-width; if 2 → show side-by-side
  - Mobile: stack vertically (dominant first, then secondary)
  - Verify: Featured section has clear visual hierarchy between primary and secondary

- [ ] **6. Redesign Category Filters**
  - Text-based soft pills (not heavy toggle buttons)
  - Subtle active state — think thin underline or soft background, not dark pill
  - Remove count numbers from pills (cleaner)
  - Smooth transition on state change
  - Remove the white backdrop/shadow container — pills should float naturally
  - Verify: Filters feel minimal and elegant, not UI-heavy

- [ ] **7. Redesign the Article Grid**
  - 3-column on desktop, 2 on tablet, 1 on mobile
  - Larger image thumbnails (`aspect-[3/2]` instead of `aspect-[2/1]`)
  - Image hover: subtle scale (`scale-[1.02]`) with slow ease
  - Title in bolder weight, left-aligned, no line-clamp on desktop
  - Show: category tag (small, muted), title, reading time
  - No date in the grid (save for article detail page)
  - Remove the ProviderBanner from the grid (it breaks the editorial flow)
  - Tighter vertical rhythm but more horizontal breathing room
  - Verify: Grid images feel dominant, text breathes

### Phase 3: Typography & Spacing Polish

- [ ] **8. Typography pass**
  - Hero title: `font-display` (New York serif)
  - Featured headline: `font-display` large
  - Grid article titles: `font-sans` (Inter), bold, confident sizing
  - Category labels: `font-sans`, small, muted — not emoji-heavy
  - Remove emojis from category pills (cleaner editorial look)
  - Control line length on titles (max-w where needed)
  - Generous line-height throughout
  - Verify: Clear hierarchy — hero > featured headline > grid headlines > metadata

- [ ] **9. Spacing & whitespace pass**
  - Increase whitespace more than instinct suggests (per Notion task)
  - Section gaps: `py-16 md:py-24` between major sections
  - Page background: `bg-white` (not `bg-gray-50` — editorial pages are white)
  - Consistent vertical rhythm
  - Max content width: keep `max-w-7xl` but consider `max-w-6xl` for tighter editorial feel
  - Verify: Page feels spacious, not cramped

- [ ] **10. Loading skeleton update**
  - Match new layout structure (hero skeleton, featured skeleton, grid skeleton)
  - Same proportions as final layout
  - Verify: Skeleton → content transition feels smooth

### Phase 4: Visual Details & Edge Cases

- [ ] **11. Visual refinements**
  - Subtle grayscale treatment on grid images (optional — try it, revert if heavy)
  - Reduce border-radius on images (editorial = less rounded — `rounded-lg` not `rounded-xl`)
  - Slight asymmetry: featured section's 60/40 split creates natural visual interest
  - Restrained color — let gray scale and typography do the work
  - Verify: Page feels like a publication, not a SaaS dashboard

- [ ] **12. Edge cases**
  - 0 articles: show empty state
  - 0 featured articles: skip featured section, go straight to filters + grid
  - 1-2 articles total: grid still looks good (responsive columns handle this)
  - API failure: mock data fallback still works
  - Category with 0 articles: show "No articles found" message
  - Verify: All edge cases handled gracefully

- [ ] **13. Final build check**
  - `next build` passes with no errors
  - No TypeScript errors
  - No unused imports
  - Verify: Production-ready

## Architecture Notes

### What changes
- `app/caregiver-support/page.tsx` — full rewrite of the UI (same data flow)
- `app/api/caregiver-support/route.ts` — minor: add `featured` query param support

### What stays the same
- `app/caregiver-support/[slug]/page.tsx` — untouched
- `app/caregiver-support/layout.tsx` — untouched
- `lib/content.ts` — untouched
- `types/content.ts` — untouched
- `data/mock/resources.ts` — untouched
- All admin content pages — untouched

### Data flow (unchanged)
```
page.tsx → fetch("/api/caregiver-support?per_page=200")
         → API route → Supabase content_articles (RLS)
         → Returns articles with `featured` field
         → Client filters featured vs. regular
         → Client filters by care type
         → Client paginates
```

### No new files needed
Everything lives in `page.tsx` — the page is self-contained. No new component files, no new hooks, no new libraries.

## Risks

| Risk | Mitigation |
|------|------------|
| No articles marked as featured in Supabase | Featured section hides gracefully. Task 2 covers flagging articles |
| Images missing on imported articles | Already have fallback: `"/images/home-health.webp"` |
| Typography changes affect other pages | All changes scoped to `page.tsx` — no global CSS changes |
| Increased whitespace might feel too empty on mobile | Test responsive breakpoints carefully |

## Design Reference (from Notion task)

**Tone:** Calm, premium, editorial, spacious, intentional, high-trust
**Avoid:** SaaS dashboard feel, heavy card UI, loud borders, aggressive shadows, symmetric "AI-generated" look
**Win on:** Typography, whitespace, image dominance
**Principle:** "The page should feel composed, not assembled"
