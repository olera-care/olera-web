# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — IN PROGRESS
  - Transform from narrow mobile wizard → desktop-native Care Planning Console
  - Two-panel layout, persistent sidebar, real-time eligibility preview, transparent scoring
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`
  - Notion: P1 — "Senior Benefits Finder Improvements & Optimizations"

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

---

## Notes & Observations

- Project is a TypeScript/Next.js web app for senior care discovery
- iOS OleraClean design tokens extracted from `/Users/tfalohun/Desktop/OleraClean/OleraClean`
- Key iOS colors: #5AAEC4 (accent), #06B6D4 (accentBright), #F9F6F2 (vanilla bg)
- Slash commands reference iOS patterns in some places — update for web as needed

---

## Session Log

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
