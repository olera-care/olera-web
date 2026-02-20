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
| 2026-02-20 | Primary palette: teal/cyan (#06B6D4) replacing green (#319266) | Match iOS OleraClean accent colors |
| 2026-02-20 | Vanilla backgrounds (#F9F6F2) for warm feel | Match iOS oleraVanilla bg |
| 2026-02-20 | Serif font (New York/Georgia) for display headings | Match iOS OleraClean typography |
| 2026-02-20 | Remove white card wrappers from hero and content sections | Reduce "containers within containers" nesting |
| 2026-02-20 | Hero above grid, sidebar starts at Highlights level | Give hero breathing room, sticky sidebar enters at content |
| 2026-02-20 | Olera Score: centered circle + 4 breakdown cards | Match Olera 1.0 Figma rating layout |
| 2026-02-20 | Highlights as 2x2 transparent badges in identity area | Fill dead space, surface trust signals without visual clutter |
| 2026-02-20 | Category-inferred smart defaults for highlights, services, descriptions | Every provider page shows 4 highlights, 9+ services, and an About section — superseded by real data |
| 2026-02-20 | Backfill descriptions from OleraClean CSV archive | 33,631 of 36,623 NULL descriptions filled; ~2,992 use category fallback |
| 2026-02-20 | Browse page: single list+map layout (remove carousel/grid) | Matches TripAdvisor/Airbnb pattern — simpler, more focused UX |
| 2026-02-20 | Category-inferred highlights on browse cards | 4 highlights per card from provider_category; superseded when provider claims page |
| 2026-02-20 | Sticky filter bar with dynamic top (not -mt-16 hack) | Simpler CSS, no document flow issues |
| 2026-02-20 | 2-column vertical card grid (Realtor.com style) | Better space efficiency, image-first like property listings |
| 2026-02-20 | TripAdvisor score bubbles on map (not price pills) | Cleaner, more distinctive; Olera score is the differentiator |
| 2026-02-20 | AbortController for Supabase fetch in useEffect | Prevents React effect cleanup from causing AbortError |
| 2026-02-12 | Staging environment: staging branch + Vercel domain + branch protection | Buffer between dev and production |
| 2026-02-10 | Single UnifiedAuthModal replaces 2 modals | Eliminated ~2,000 LOC of duplication |
| 2026-02-10 | Google OAuth primary CTA, auth-first flow | One-click auth is fastest path |

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

### 2026-02-20 (Session 13) — Provider Page Design Polish

**Branch:** `quiet-elion`

**Design Language Alignment:**
- Extracted iOS OleraClean design system (colors, fonts, spacing, component patterns)
- Updated `tailwind.config.ts`: teal primary palette, vanilla backgrounds, serif font families
- Updated Notion task (30c5903a) with complete design language documentation
- Commit: `f85fe14`

**Hero Section Iteration (7 commits):**
1. `935593e` — Remove nested containers (white card wrappers → content sits on vanilla bg)
2. `a84c0df` — Match Highlights and Managed By to Olera 1.0 Figma (white cards, unique icons)
3. `04346a6` — Always show 4 highlights, white background cards
4. `c781503` — Move hero above grid, sidebar starts at Highlights level (sticky positioning)
5. `5b8f893` — Replace rating with Olera 1.0 centered score (circle + stars + 4 breakdowns)
6. `a3e7e3a` — Move highlights into hero identity area as 2x2 transparent badges

**Key components added/modified:**
- `HighlightIcon` — maps highlight labels to contextual SVG icons (shield, house, badge, etc.)
- `SaveButton` — added `variant="icon"` and `variant="pill"` props
- `ProviderHeroGallery` — removed shadow, kept compact max-w-md aspect-[3/2]
- Provider page structure: hero (gallery + identity side-by-side) → grid (content + sticky sidebar)

**Current state:** Hero has gallery left + identity right. Identity shows name, context line (category·location·rating), price, address, 2x2 highlight badges, managed by. User noted "too much empty space" — needs further refinement.

---

### 2026-02-12 (Session 12)

**Staging Environment Setup:**
- Created `staging` branch from `main` and pushed
- Updated `CONTRIBUTING.md` with staging workflow, branch strategy, deployment flow
- Created plan: `plans/staging-environment-plan.md`

**Manual steps for TJ:**
- [ ] Vercel: Add staging domain alias linked to `staging` branch
- [ ] GitHub: Add branch protection on `main`

---

### 2026-02-10 (Session 11)

**Auth Overhaul — All 3 Phases Complete:**
- Replaced ~3,000 lines of auth code with ~1,000-line unified system
- Phase 1: `UnifiedAuthModal` with Google OAuth + email-first flow
- Phase 2: Post-auth onboarding inside modal (no separate /onboarding page)
- Phase 3: Cleanup — deleted 6 legacy files, migrated 13 files
- Premium modal UI (Luma/Linear-inspired, Olera hummingbird logo)

---

### 2026-02-09 (Session 10)

**Admin Dashboard MVP:**
- Built full admin dashboard at `/admin` (Overview, Providers, Leads, Team)
- Changed provider claim flow: new claims → `pending` (admin review first)
- Added portal banners for pending/rejected states
- Auth gating via middleware + layout
- Auto-seed: `ADMIN_EMAILS` env var bootstraps master_admin
- SQL migration: admin_users, audit_log tables with RLS

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_
