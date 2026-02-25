# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

- **v1.0 → v2.0 Migration** (branch: `swift-faraday`) — IN PROGRESS
  - Phase 1-3 complete (SEO infra, power pages, asked questions). PR #53 targeting staging.
  - Phase 4: Unified browse+power page architecture (see below)
  - Notion: P1 — "Olera v1.0 → v2.0 Migration Playbook"

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — IN PROGRESS
  - Transform from narrow mobile wizard → desktop-native Care Planning Console
  - Two-panel layout, persistent sidebar, real-time eligibility preview, transparent scoring
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`
  - Notion: P1 — "Senior Benefits Finder Improvements & Optimizations"

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage` → merged to `staging` via PR #60) — DONE
  - Ported iOS deletion request/approve/deny/restore/purge flow to web
  - Plan: `plans/provider-deletion-request-plan.md`
  - Also: enforced single family profile per account + cleanup SQL

- **Admin Provider Directory Editor** (branch: `stellar-hypatia` → merged to `staging`) — DONE
  - Django-admin-style CRUD for 36K+ providers in `olera-providers` table
  - Search, filters, server-side pagination, sectioned edit form, audit logging

---

## In Progress

- [x] Initial project setup
- [x] Provider cards on homepage
- [x] Provider detail page
- [x] Hero section redesign
- [x] Provider card spacing standardization
- [x] Browse page with filtering
- [x] iOS Supabase integration (Phase 1)
- [x] PR #20, #21/#23 merged
- [x] Admin dashboard MVP
- [x] Auth overhaul — unified modal, Google OAuth, post-auth onboarding
- [x] Staging environment
- [x] Design language alignment (teal palette, vanilla bg, serif headings)
- [x] **Provider page smart defaults** — highlights, care services, descriptions inferred from category
- [x] **Description backfill** — 33,631 providers updated from RAG CSV via `scripts/backfill-descriptions.mjs`
- [x] **Image classification** — Vision AI script, admin images page, stock fallbacks
- [x] **Admin provider directory** — full CRUD editor, sidebar restructure, admin links in navbar/portal

---

## Blocked / Needs Input

- (none)

---

## Next Up

1. **Add `hero_image_url` column to `olera-providers`** — referenced in images API but doesn't exist yet; needs Supabase migration
2. **Remaining ~2,992 providers without CSV descriptions** — category fallback covers them, but could RAG-generate real ones
3. **Test Google OAuth end-to-end**
4. **Email notifications** for provider approval/rejection
5. **Community forum flagging** for admin moderation

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-20 | Category-inferred smart defaults for highlights, services, descriptions | Every provider page shows 4 highlights, 9+ services, and an About section — superseded by real data |
| 2026-02-20 | Backfill descriptions from OleraClean CSV archive | 33,631 of 36,623 NULL descriptions filled; ~2,992 use category fallback |
| 2026-02-20 | Browse page: single list+map layout (remove carousel/grid) | Matches TripAdvisor/Airbnb pattern — simpler, more focused UX |
| 2026-02-20 | Category-inferred highlights on browse cards | 4 highlights per card from provider_category; superseded when provider claims page |
| 2026-02-20 | Sticky filter bar with dynamic top (not -mt-16 hack) | Simpler CSS, no document flow issues |
| 2026-02-20 | 2-column vertical card grid (Realtor.com style) | Better space efficiency, image-first like property listings |
| 2026-02-20 | TripAdvisor score bubbles on map (not price pills) | Cleaner, more distinctive; Olera score is the differentiator |
| 2026-02-20 | AbortController for Supabase fetch in useEffect | Prevents React effect cleanup from causing AbortError |
| 2026-02-20 | Migrated map from Leaflet to MapLibre GL JS + MapTiler | Vector tiles, retina-sharp, smooth zoom, better performance. See ADR 001 |
| 2026-02-20 | **CLAUDE.md: code > plan docs for design intent** | Post-mortem: stale plan regressed 2-col cards to horizontal. Added rule to ask before overwriting iterated designs |
| 2026-02-21 | Server-side pagination for directory (not client-side) | 36K+ records — must use Supabase `.range()` with `count: "exact"` |
| 2026-02-21 | Field allowlist for PATCH updates | Explicit `EDITABLE_FIELDS` set prevents injection of unexpected columns |
| 2026-02-21 | Reuse existing images API for image actions | Detail page calls `/api/admin/images/[id]` — no code duplication |
| 2026-02-21 | Lightweight admin check in Navbar | Single fetch to `/api/admin/auth`, silently fails for non-admins |
| 2026-02-21 | `hero_image_url` column doesn't exist on `olera-providers` | Removed from SELECT; detail uses `SELECT *` which handles gracefully |
| 2026-02-25 | Deletion columns on `business_profiles` (not separate table) | Mirrors iOS pattern on `provider_claims`; avoids joins, keeps queries simple |
| 2026-02-25 | Single family profile per account | Reduces cognitive load; providers can still have multiple profiles (branches) |

---

## Notes & Observations

- Project is a TypeScript/Next.js web app for senior care discovery
- iOS OleraClean design tokens extracted from `/Users/tfalohun/Desktop/OleraClean/OleraClean`
- Key iOS colors: #5AAEC4 (accent), #06B6D4 (accentBright), #F9F6F2 (vanilla bg)
- Slash commands reference iOS patterns in some places — update for web as needed

---

## Architecture Research: Directory City Page Patterns (2026-02-24)

> Critical findings from researching how top directories handle SEO + interactive browse.
> This informs the unified browse/power page architecture for Olera v2.0.

### Key Finding: Every Top Directory Uses ONE Page

Every major directory — Zillow, A Place for Mom, Caring.com, Zocdoc, Apartments.com — uses a **single page** per city+category that serves BOTH as the SEO landing page AND the interactive search/browse page. Nobody maintains separate "SEO page" and "search page."

The architecture is: **server-render the first load** (Google sees full HTML with listings, meta, JSON-LD), then **hydrate client-side** for filters/sort/map.

### Two-Tier URL Strategy (Universal Pattern)

| Tier | URL Type | Example | Indexed? |
|------|----------|---------|----------|
| Tier 1 | Clean path (high-value combos) | `/assisted-living/texas/houston` | Yes |
| Tier 2 | Query params (user-applied filters) | `?rating=4&sort=price` | Blocked in robots.txt |

### Site-Specific Findings

**Zillow (Next.js SSR)**
- Listings embedded in HTML as `__NEXT_DATA__` JSON. True SSR.
- City page IS the search page. Filters hydrate client-side.
- `robots.txt`: `Disallow: /*?searchQueryState=*` — filter params blocked
- High-value combos get clean paths: `/austin-tx/2-bedrooms/`

**A Place for Mom (Closest Competitor)**
- Fully server-rendered: 25 facility cards in initial HTML
- Extensive JSON-LD: `ItemList`, `LocalBusiness`, `FAQPage`, `BreadcrumbList`
- Filters operate **client-side without changing URL**
- `robots.txt`: blocks `*city=`, `*state=`, `/search-results`
- **One page = SEO + search. No separate browse.**

**Caring.com (Next.js SSR)**
- `robots.txt`: `Disallow: /*?` — ALL query strings blocked (most aggressive)
- Only clean-path pages allowed: `/senior-living/assisted-living/*/*`
- 87 facilities in `ItemList` schema in initial HTML

**Zocdoc (ASP.NET Razor SSR)**
- Creates indexable pages for every `specialty + city` AND `specialty + city + insurance`
- Insurance filter gets its own clean-path URL (high conversion value)
- Dynamic filters (time, gender) operate client-side without URL changes

**Apartments.com**
- Most aggressive programmatic SEO: clean-path URLs for city+bedrooms, city+price, city+amenity
- Each filtered variant has unique title tag with live listing count
- All are server-rendered pages

### Implications for Olera

1. Current architecture (separate `/browse` client page + `/[category]/[state]/[city]` server power page) is **wrong**
2. Must merge into a single page that is server-rendered for SEO + client-hydrated for interactivity
3. Filters should operate client-side without changing URL (or use query params blocked in robots.txt)
4. The hero search CTA can stay pointing to `/browse` as a fallback for ZIP/geolocation searches
5. All internal links (footer, nav, bento grid) should point to power page clean paths

### Current Browse Page Architecture (for reference)

- **Client-side only**: `BrowseClient.tsx` fetches from Supabase browser client
- **100 providers** per query, filtered/sorted entirely on client
- **Map**: MapLibre GL with CartoDB Positron tiles, score bubbles, popup cards
- **Filters**: Location, care type, rating, payment, sort (5 filters, all client-side)
- **Pagination**: Client-side, 24 per page
- **No SSR**: Google sees empty shell

### Current Power Page Architecture

- **Server-rendered**: `fetchPowerPageData()` via server Supabase client
- **48 providers** per query, sorted by community_Score then rating
- **ISR**: 1-hour revalidation
- **JSON-LD**: BreadcrumbList + ItemList
- **No interactivity**: No filters, no sort, no map

---

## Phase 4 Plan: Unified Browse+Power Page

> Merge the interactive browse experience into the power page architecture.
> Single URL serves both SEO (server-rendered) and UX (client-hydrated).

### Architecture

```
/[category]/[state]/[city]/page.tsx (Server Component)
  ├─ Server-fetches providers via fetchPowerPageData()
  ├─ Generates metadata, JSON-LD, breadcrumbs
  ├─ Renders SEO content (H1, description, stats)
  └─ Passes providers as props to:
      └─ <CityBrowseClient providers={serverProviders} /> (Client Component)
          ├─ Hydrates with filter/sort/map interactivity
          ├─ Filter changes update results client-side (no URL change)
          ├─ Map renders with MapLibre GL (existing BrowseMap)
          └─ Pagination client-side (24 per page)
```

### Key Decisions Needed

1. **Map on city pages**: Yes/No? (A Place for Mom has no map; Zillow does)
2. **Which filters**: Rating, sort, payment? (Keep it simple initially)
3. **What happens to `/browse`**: Keep as fallback for ZIP/geolocation, or redirect?
4. **Provider limit**: Server fetches 48 currently; browse fetches 100. What limit for unified?

### Implementation Steps (Estimated)

1. Create `CityBrowseClient` component — takes server-fetched providers, adds filter/sort/map
2. Update city power page to use `CityBrowseClient` instead of static grid
3. Preserve all existing SEO elements (metadata, JSON-LD, breadcrumbs, ISR)
4. Port map component (already exists in `BrowseMap.tsx`)
5. Port filter UI (rating, sort, payment) from `BrowseClient.tsx`
6. Update robots.txt to block `/*?` query params on power pages
7. Decide fate of `/browse` (keep as fallback or redirect)
8. Test: verify server HTML contains full listings for Google, filters work client-side

---

## Session Log

### 2026-02-25 (Session 18) — Provider Deletion Request + Admin Approval

**Branch:** `relaxed-babbage` | **PR:** #60 targeting staging (merged)

**Provider Deletion Request Flow (ported from iOS):**
- `supabase/migrations/006_deletion_request_columns.sql` — adds `deletion_requested`, `deletion_requested_at`, `deletion_approved_at` to business_profiles
- `app/api/portal/request-deletion/route.ts` — provider requests deletion (auth + ownership check)
- `components/provider-dashboard/DashboardPage.tsx` — deletion card in sidebar + pending banner
- `app/portal/settings/page.tsx` — deletion card in settings page (alternate path)

**Admin Dashboard Deletions Tab:**
- `app/admin/deletions/page.tsx` — Requests (pending) + History (deleted) sub-tabs
- `app/api/admin/deletions/route.ts` — GET requests/history
- `app/api/admin/deletions/[profileId]/route.ts` — approve/deny/restore/purge actions
- `components/admin/AdminSidebar.tsx` — added Deletions nav item
- `app/admin/page.tsx` — stat card + audit log formatting for new actions

**Profile Cleanup:**
- `app/api/auth/create-profile/route.ts` — block duplicate family profiles (409)
- `components/shared/ProfileSwitcher.tsx` — hide "Add profile" for family-only users, show "Pending deletion" indicator
- Cleanup SQL provided to delete duplicate family profiles

**Key decisions:**
- Added deletion columns to `business_profiles` (not a separate table) — mirrors iOS `provider_claims` pattern
- Deletion card shows for all org/caregiver profiles, not just claimed ones
- Admin approve soft-deletes from `olera-providers` (if linked) + marks claim_state='rejected'

---

### 2026-02-24 (Session 17b) — v1.0 → v2.0 Migration Phases 1-4 + Internal Linking

**Branch:** `swift-faraday` | **PR:** #53 targeting staging (merged)

**Phase 1 — SEO Infrastructure:**
- `app/robots.ts` — allows `/`, disallows `/admin/`, `/portal/`, `/api/`
- `app/sitemap.ts` — dynamic sitemap: static pages, power pages, 39K+ provider profiles
- `app/layout.tsx` — GA4 (`G-F2F7FG745B`), Organization JSON-LD, enhanced metadata
- `app/provider/[slug]/page.tsx` — `generateMetadata()`, LocalBusiness JSON-LD
- `next.config.ts` — 17 static 301 redirects (v1.0 → v2.0 URLs)
- `middleware.ts` — pattern redirect: `/[category]/[state]/[city]/[slug]` → `/provider/[slug]`

**Phase 2 — Power Pages:**
- `lib/power-pages.ts` — shared utils: 7 categories, 51 states, slug mapping, data fetching
- `app/[category]/page.tsx` — category landing (state grid + top providers)
- `app/[category]/[state]/page.tsx` — state page (city links + provider listing)
- `app/[category]/[state]/[city]/page.tsx` — city page (provider grid + cross-category links)
- All with `generateMetadata()`, JSON-LD, ISR (1hr revalidation)

**Phase 3 — Asked Questions:**
- `supabase/migrations/005_provider_questions.sql` — `provider_questions` table + RLS policies
- `app/api/questions/route.ts` — public GET + authenticated POST
- `app/api/admin/questions/route.ts` — admin moderation GET + PATCH
- `components/providers/QASectionV2.tsx` — wired up with live API
- `app/admin/questions/page.tsx` — moderation UI with status tabs

**Phase 4 — City Browse Experience:**
- `components/browse/CityBrowseClient.tsx` — interactive browse merged into city power pages
- Filters (location, care type, rating), sort, pagination, MapLibre sticky map
- CSS grid + sticky map (Airbnb pattern) so footer renders full-width
- Footer redesign with warm vanilla discovery zone + expandable cities (72 deep internal links)
- Removed hospice from all customer-facing surfaces

**Architecture Research:**
- Deep research on Zillow, A Place for Mom, Caring.com, Zocdoc, Apartments.com, Yelp
- Key finding: ALL use single server-rendered page for SEO + interactive browse

---

### 2026-02-24 (Session 17a) — Web QA Test Plan on Notion

**Branch:** `hopeful-swartz` (no code changes)

**What:** Created a comprehensive Web QA Test Plan database on Notion, modeled after the existing App Store QA Test Plan. Explored the full codebase to identify all major features, pages, and user flows.

**Notion database:** https://www.notion.so/9f68deb000be474f919f215dee5f4605
- Parent: Product Development
- 85 test cases across 13 sections
- Schema: Name (title), Browser (multi_select), Passed (checkbox), Section (select), Risk (P0/P1/P2), Notes (text)
- Grouped by Section in table view (configured manually in Notion UI)

**Sections:**
- A. Smoke Tests (8) — homepage, browse, detail, nav, auth redirects
- B. Auth & Sessions (10) — sign-up, sign-in, OAuth, OTP, session, profile switcher
- C. Browse & Search (8) — city search, care type filter, sort, map, pagination
- D. Provider Detail (10) — gallery, about, services, reviews, CTA, bookmarks
- E. Family Portal (11) — inbox, messaging, connections, matches, saved
- F. Provider Hub (9) — dashboard, completeness, connections, inbox, stats
- G. Community & Resources (8) — forum, posts, resources, benefits finder
- H. Admin Dashboard (9) — overview, provider mgmt, directory, images, team
- I. Onboarding & Claims (7) — wizard, claim search, phone OTP, org creation
- J. Payments & Pro (5) — Stripe checkout, Pro unlock, tier access
- K. Responsive & Mobile (8) — mobile layouts, touch targets, map
- L. SEO & Performance (6) — meta tags, OG, schema.org, lazy load, CLS
- M. Error Handling (6) — 404, API errors, empty states, validation

**Handed off to:** Esther for QA execution

---

### 2026-02-21 (Session 16) — Admin Provider Directory Editor

**Branch:** `stellar-hypatia` → merged to `staging` via PR #40

**Image Classification & Stock Fallbacks (prior commits on this branch):**
- Vision AI classification script (`scripts/classify-provider-images.mjs`)
- Admin images page at `/admin/images` with review/override/hero actions
- Category stock fallback photos (3 per category) for browse cards

**Provider Directory Editor (3 commits):**
- `ee98759` — Full CRUD directory: list page (search, filters, tabs, pagination), detail/edit page (7 sections), API routes with field allowlist + audit logging, sidebar restructure, admin links in navbar/portal, dashboard stat card
- `53377dc` — Surface API errors in red banner for debugging
- `6e3ac70` — Fix: `hero_image_url` column doesn't exist on `olera-providers` — removed from SELECT

**Key files created:**
- `app/admin/directory/page.tsx` — list page with 36K+ providers, server-side pagination
- `app/admin/directory/[providerId]/page.tsx` — sectioned edit form (Basic Info, Contact, Location, Pricing, Scores, Images, Status)
- `app/api/admin/directory/route.ts` — GET with search/filters/pagination via Supabase `.range()`
- `app/api/admin/directory/[providerId]/route.ts` — GET full detail + PATCH with `EDITABLE_FIELDS` allowlist, audit diff

**Key files modified:**
- `components/admin/AdminSidebar.tsx` — "Providers"→"Claims", removed "Images", added "Directory"
- `app/admin/page.tsx` — replaced Images card with Provider Directory stat card (36,689 total)
- `components/shared/Navbar.tsx` — admin check + "Admin Dashboard" link in dropdown
- `app/portal/layout.tsx` — admin check + "Admin Dashboard" link in sidebar
- `lib/types.ts` — `DirectoryProvider`, `DirectoryListItem`, `PROVIDER_CATEGORIES`

**Status:** Merged to staging. Everything working — list, detail, save, filters, pagination, dashboard card.

---

### 2026-02-20 (Session 15b) — Browse Page Polish + Bug Fixes

**Branch:** `staging`

**Card & Map Redesign (continued):**
- `27b24e8` — 2-column vertical card grid (Realtor.com style) + TripAdvisor score bubbles on map
- `442e3d0` — CartoDB Positron tiles, refined zoom controls, polished popup cards

**Bug Fixes:**
- `f80be2b` — Filter dropdowns clipped by `overflow-x-auto` → changed to `flex-wrap`
- `8fff2bf` — Dropdown z-index: heading `z-40` sat above dropdowns → lowered to `z-20`
- `cec3594` — Replaced `.not('deleted','is',true)` with explicit `.or('deleted.is.null,deleted.eq.false')`
- `1e9e96b` — AbortError: inlined fetch into useEffect with AbortController + cancelled flag

**Status:** Supabase outage blocking verification. All code changes pushed and building clean.

**Files modified:**
- `components/browse/BrowseCard.tsx` — vertical card layout, image top, 3 highlights
- `components/browse/BrowseClient.tsx` — 2-col grid, flex-wrap filters, z-index fixes, AbortController fetch
- `components/browse/BrowseMap.tsx` — teal score bubbles, CartoDB tiles, refined controls

---

### 2026-02-20 (Session 15) — Browse Page Redesign

**Branch:** `staging`

**Browse Page Overhaul (4 commits):**
- `7929632` — Redesign browse page: remove carousel/grid/map views → single list+map layout
  - Created `BrowseCard.tsx` (horizontal card), `docs/design-system.md`
  - Refactored `BrowseClient.tsx` (~1100 LOC → ~820 LOC)
- `50ea8fb` — Restore navbar: replaced `setForceHidden(true)` with `enableAutoHide()`
- `a29092f` — Fix filter bar overlap: use dynamic `top` instead of `-mt-16` + `translateY` hack
- `bdec4c5` — Match Figma: larger image, highlights (4 checkmarks), teal CTA button, bigger text

**Files modified:**
- `components/browse/BrowseCard.tsx` — new horizontal card component
- `components/browse/BrowseClient.tsx` — major refactor to single layout
- `lib/types/provider.ts` — added `CATEGORY_HIGHLIGHTS` mapping, `badge` field, longer description slice
- `docs/design-system.md` — new design system reference doc

**Key decisions:**
- Highlights inferred from `provider_category` (4 per card) — real data supersedes when provider claims page
- Fixed map uses `position: fixed` with animated `top`/`height` based on navbar visibility
- Filter bar sticks at `top: 64px` (navbar visible) or `top: 0` (navbar hidden)

---

### 2026-02-20 (Session 14) — Smart Defaults & Description Backfill

**Branch:** `quiet-elion`

**Smart Defaults (3 commits):**
- `bdb746d` — `getCategoryHighlights()`: 4 factual highlights per category, padded after real screening/care_types data
- `d115d61` — `getCategoryServices()`: 9 services per category, padded after real care_types; removed empty state
- `f3b727b` — `getCategoryDescription()`: fallback About text from category+name+location when description is NULL

**Description Backfill:**
- CSV source: `~/Desktop/OleraClean/Current Database/Descriptions/Provider Database-Descriptions.csv` (42,546 RAG descriptions)
- Script: `scripts/backfill-descriptions.mjs` — reads CSV, matches by `provider_id`, updates `provider_description` in Supabase
- Result: 33,631 of 36,623 NULL descriptions filled (92% coverage)
- Remaining ~2,992 covered by `getCategoryDescription()` fallback

**Files modified:**
- `lib/provider-utils.ts` — added `getCategoryHighlights()`, `getCategoryDescription()`, `getCategoryServices()`
- `app/provider/[slug]/page.tsx` — highlights always render, services always render, About uses fallback
- `scripts/backfill-descriptions.mjs` — one-time migration script (requires `SUPABASE_KEY` env var)

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_
