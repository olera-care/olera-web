# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

- **Browse/City Page Redesign** (branch: `staging`) — DONE
  - TripAdvisor-style list+map, 2-col vertical cards, score bubble map
  - Blocked on Supabase outage for final verification

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

---

## Blocked / Needs Input

- **Supabase outage** — browse page can't load providers. Monitor [status.supabase.com](https://status.supabase.com). Verify browse page once resolved.

---

## Next Up

1. **Verify browse page after Supabase outage resolves** — confirm data loads, filters work, map bubbles display
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

---

## Notes & Observations

- Project is a TypeScript/Next.js web app for senior care discovery
- iOS OleraClean design tokens extracted from `/Users/tfalohun/Desktop/OleraClean/OleraClean`
- Key iOS colors: #5AAEC4 (accent), #06B6D4 (accentBright), #F9F6F2 (vanilla bg)
- Slash commands reference iOS patterns in some places — update for web as needed

---

## Session Log

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
