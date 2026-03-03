# Plan: Research and Press Blog Section

Created: 2026-03-03
Status: Not Started

## Goal

Create a separate "Research & Press" section at `/research-and-press` with its own polished design, backed by the same `content_articles` Supabase table but differentiated via a new `section` column, with CMS updates for admin management and a footer link.

## Context

- In Olera 1.0, "Research and Press" was a separate section for announcements/news (18 articles migrated from Sanity)
- Those 18 articles were imported alongside 85 educational articles into `content_articles` with no distinguishing field — all got `category: "guide"`
- Currently `/research-and-press` and `/research-and-press/:slug*` redirect to homepage (v1.0 migration redirects in `next.config.ts`)
- The CMS already supports full article management (Tiptap editor, image uploads, SEO, audit logging)

## Success Criteria

- [ ] `/research-and-press` renders a polished listing page with its own design identity
- [ ] `/research-and-press/[slug]` renders individual articles with back-link to the section
- [ ] Admin can assign articles to "Caregiver Support" or "Research & Press" via a section picker in the editor
- [ ] Admin content listing can filter by section
- [ ] Footer has a "Company" column with "Research & Press" link
- [ ] Caregiver Support pages only show their own articles (no cross-contamination)
- [ ] Existing SEO redirects removed so the new routes work
- [ ] Build passes (`next build`)

## Tasks

### Phase 1: Database & Types

- [ ] 1. Add `section` column to `content_articles` table
      - SQL migration: `ALTER TABLE content_articles ADD COLUMN section text NOT NULL DEFAULT 'caregiver-support';`
      - Valid values: `'caregiver-support'` | `'research-and-press'`
      - Files: `sql/` (new migration file)
      - Verify: Run in Supabase SQL Editor, confirm column exists with default

- [ ] 2. Update TypeScript types
      - Add `ContentSection` type: `"caregiver-support" | "research-and-press"`
      - Add `section` field to `ContentArticle` and `ContentArticleListItem`
      - Files: `types/content.ts`
      - Verify: `npx tsc --noEmit` passes

### Phase 2: API & Data Layer

- [ ] 3. Update public API to filter by section
      - Add `?section=` query param to `GET /api/caregiver-support`
      - Default to `section=caregiver-support` so existing page is unchanged
      - Files: `app/api/caregiver-support/route.ts`
      - Verify: `curl` with `?section=research-and-press` returns only R&P articles

- [ ] 4. Create public API route for Research & Press
      - New route `GET /api/research-and-press` that proxies to the same logic but defaults `section=research-and-press`
      - OR: reuse `/api/caregiver-support?section=research-and-press` from the R&P page directly
      - Decision: **Reuse existing API with section param** (simpler, less duplication)
      - Files: `app/api/caregiver-support/route.ts` (already updated in task 3)
      - Verify: API returns filtered results

- [ ] 5. Update `lib/content.ts` server-side queries
      - Add optional `section` param to `getPublishedArticles()`, `getArticleBySlug()`, `getRelatedArticles()`
      - `getArticleBySlug()` doesn't need section filter (slugs are unique), but add section to return data
      - Files: `lib/content.ts`
      - Verify: Functions accept and apply section filter

- [ ] 6. Update admin API endpoints
      - Add `section` to `EDITABLE_FIELDS` in PATCH endpoint
      - Add `section` to list fields in GET endpoint
      - Add `?section=` filter to admin listing endpoint
      - Add `section` to POST (create) endpoint with default `'caregiver-support'`
      - Files: `app/api/admin/content/route.ts`, `app/api/admin/content/[articleId]/route.ts`
      - Verify: Admin API accepts section field in create/update/filter

### Phase 3: Admin CMS Updates

- [ ] 7. Add section picker to admin article editor
      - Add a "Section" dropdown (Caregiver Support / Research & Press) in the Settings section
      - Position it prominently — above status dropdown
      - Files: `app/admin/content/[articleId]/page.tsx`
      - Verify: Section dropdown appears, saves correctly

- [ ] 8. Add section filter to admin content listing
      - Add a section dropdown filter alongside existing category/author/featured filters
      - Show section badge on article rows
      - Files: `app/admin/content/page.tsx`
      - Verify: Filtering by section works, badge displays

### Phase 4: Public Pages

- [ ] 9. Remove v1.0 redirects for `/research-and-press`
      - Remove the two redirect rules from `next.config.ts` (lines 48 and 54)
      - Files: `next.config.ts`
      - Verify: `/research-and-press` no longer redirects to homepage

- [ ] 10. Create `/research-and-press` listing page
      - New page with polished design distinct from Caregiver Support:
        - **Header:** "Research & Press" with subtitle like "The latest in senior care research, industry news, and Olera announcements"
        - **No care type category filters** (R&P articles are topical, not care-type-specific)
        - **Article grid:** 2-column on desktop (larger cards, more excerpt text), date-prominent
        - **No featured hero section** (simpler, news-feed style)
        - Uses same `ArticleFromAPI` → `Resource` mapping pattern
        - Fetches from `/api/caregiver-support?section=research-and-press&per_page=200`
      - Files: `app/research-and-press/page.tsx` (new), `app/research-and-press/layout.tsx` (new, for metadata)
      - Verify: Page renders with correct articles, distinct from caregiver-support

- [ ] 11. Create `/research-and-press/[slug]` detail page
      - Reuse the same editorial layout from caregiver-support article detail
      - Key differences:
        - Back link says "Research & Press" and links to `/research-and-press`
        - Breadcrumbs reference "Research & Press" instead of "Caregiver Support"
        - Related articles filtered to same section
        - No care-type contextual CTA (or optional)
        - Canonical URL uses `/research-and-press/[slug]`
      - Approach: Extract shared article layout into a reusable component, or duplicate and customize
      - Decision: **Extract shared component** — both pages use identical body/TOC/author rendering
      - Files: `app/research-and-press/[slug]/page.tsx` (new), possibly `components/article/ArticleDetailLayout.tsx` (new shared component)
      - Verify: Article pages render correctly with proper back-links and breadcrumbs

- [ ] 12. Update Caregiver Support pages to filter by section
      - Listing page: fetch with `?section=caregiver-support` so R&P articles don't appear
      - Detail page: no change needed (slugs are unique, but back-link already points to `/caregiver-support`)
      - Files: `app/caregiver-support/page.tsx`
      - Verify: Caregiver Support listing no longer shows R&P articles

### Phase 5: Footer & Navigation

- [ ] 13. Add "Company" column to footer with Research & Press link
      - Add new column between brand and "For Families":
        ```
        Company
        - Research & Press → /research-and-press
        - Caregiver Support → /caregiver-support
        ```
      - Adjust grid from `md:grid-cols-4` to `md:grid-cols-5` (or keep 4 and reduce brand col-span)
      - Files: `components/shared/Footer.tsx`
      - Verify: Footer renders with new column, links work

### Phase 6: Data Migration & Cleanup

- [ ] 14. Migrate existing research & press articles
      - Write a SQL query or small script to identify the 18 Sanity-imported R&P articles and set `section = 'research-and-press'`
      - Identification strategy: Match by slug against known Sanity R&P slugs, or identify by tags/content patterns
      - Alternative: Manually update via admin CMS using the new section picker
      - Files: `sql/` (migration script) or manual admin work
      - Verify: R&P articles appear on `/research-and-press`, not on `/caregiver-support`

### Phase 7: Verification

- [ ] 15. Full build & smoke test
      - Run `next build` to confirm no type errors or build failures
      - Manual checks:
        - `/research-and-press` shows R&P articles only
        - `/research-and-press/[slug]` renders article with correct back-link
        - `/caregiver-support` shows only caregiver support articles
        - Admin editor has section picker that saves correctly
        - Admin listing filters by section
        - Footer "Company" column renders with links
      - Files: None (testing only)
      - Verify: Build passes, all pages render correctly

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Removing redirects breaks SEO for v1.0 `/research-and-press/*` URLs | Old links 404 if slugs don't match | The v1.0 slugs were from Sanity — if the imported slugs match, the new pages will catch them. If not, we add individual slug redirects. |
| Section column migration on production DB | Downtime or data issues | Migration is additive (new column with default) — zero downtime. All existing articles get `'caregiver-support'` by default. |
| Shared article detail component refactor | Could break existing caregiver-support article pages | Extract carefully, test both paths. If too risky, duplicate the page with modifications instead. |
| 18 R&P articles hard to identify in bulk | Wrong articles moved | Cross-reference with Sanity import script — query by slugs that were `_type: "researchAndPress"` in Sanity. |

## Architecture Decisions

1. **Single table, section column** — NOT a separate table. Keeps the CMS unified, avoids duplicating admin UI, and allows articles to be moved between sections easily.

2. **Reuse existing API with section param** — NOT a new API route. Less code duplication, single source of truth for article queries.

3. **Extract shared article detail component** — Both sections use identical article body rendering (TOC, prose, author card, tags). Only the header, breadcrumbs, back-link, and related articles differ.

4. **2-column news-feed layout for R&P** — Distinct from the 3-column grid + featured hero of Caregiver Support. Reflects the different content nature (news/announcements vs educational guides).

## Notes

- The Sanity import script (`scripts/import-sanity.ts`) fetched both `eduMaterial` and `researchAndPress` types but didn't store the Sanity `_type` — we'll need to re-identify R&P articles by slug matching or manual review
- The `ResourceCategory` type already has `"news"` — R&P articles could use this category, but section is the primary differentiator
- Consider adding a `section` filter to the Sanity import script if re-import is ever needed
