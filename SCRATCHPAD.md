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

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell`) — IN PROGRESS
  - 9-section marketing landing page at `/for-providers` to convert providers
  - Plan: `plans/provider-home-page-plan.md`
  - Notion: P2 — "Provider home page development"

- **Homepage Section-by-Section Refactor** (branch: TBD) — PLANNED
  - Break 1,440-line monolith into composable sections, reorder flow, polish per section
  - Plan: `plans/homepage-refactor-plan.md`
  - Notion: P1 — "Claude Code Prompt: Section-by-Section Homepage Refactor"

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — PLANNED
  - Port iOS deletion request/approve/deny/restore/purge flow to web
  - Plan: `plans/provider-deletion-request-plan.md`
  - 4 phases: DB migration → Provider portal UI → Admin deletions tab → Polish

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
| 2026-02-21 | Server-side pagination for directory (not client-side) | 36K+ records — must use Supabase `.range()` with `count: "exact"` |
| 2026-02-21 | Field allowlist for PATCH updates | Explicit `EDITABLE_FIELDS` set prevents injection of unexpected columns |
| 2026-02-21 | `hero_image_url` column doesn't exist on `olera-providers` | Removed from SELECT; detail uses `SELECT *` which handles gracefully |
| 2026-02-26 | Content regression checks needed beyond git merge-base | Revert→re-apply cycles make commit topology misleading; must compare actual file content for critical files |
| 2026-02-26 | PR merge reports go to Notion | Automated reports in Product Development > PR Merge Reports for audit trail and team visibility |
| 2026-02-26 | Smaller, more frequent merges to staging | Avoids big reconciliation sessions when multiple contributors touch shared files |
| 2026-02-26 | Only TJ can merge to main/staging | Rulesets + merge-admins team. Prevents uncontrolled merges that caused regressions (Feb 26 post-mortem) |
| 2026-02-26 | jakub300 keeps org admin | XFive tech lead needs admin for transfer tasks; not in merge-admins so can't merge |

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

### 2026-02-28 (Session 22) — Care Seeker Hero Redesign

**Branch:** `lively-yalow`

**What:** Redesigned the care seeker homepage hero banner to match the provider page's edge-to-edge style. Inspired by Zillow/Airbnb left-aligned layout patterns.

**Changes:**
- `app/page.tsx` — hero section: removed rounded container (`rounded-[2rem]`, `mx-4/6/8`), shortened height from `75vh` → fixed `400-520px`, removed "48,000+ care providers" pill, swapped to left-aligned bottom-anchored layout, single clean gradient overlay
- `public/images/hero-home.jpg` — new hero image (B.jpg: father & son outdoor scene)
- Cover images A-G stored in `files/cover images/` for future iteration

**Design decisions:**
- Left-aligned text + search bar (Zillow-style) instead of centered — creates clear hierarchy
- Single `from-black/60` gradient (matching provider hero) instead of dual warm gradients
- `font-serif` on heading for editorial feel matching provider page
- Image B chosen for authentic warmth, good left-side space for text overlay

**Commits:** `0ef1987`, `6c3bac0`, `f5daacc`, `155cc26`, `11944d6`

---

### 2026-02-27 (Session 21) — Provider Home Page Polish

**Branch:** `shiny-maxwell`

**What:** Continued iterating on `/for-providers` marketing landing page to match Figma mockups. Focused on leadership section and set-up-profile section polish.

**Changes:**
- `components/for-providers/LeadershipSection.tsx` — added `border border-gray-200` to cards, widened container from `max-w-4xl` → `max-w-6xl`, headshot column from `w-36/w-44` → `w-44/w-52`
- `components/for-providers/SetUpProfileSection.tsx` — wrapped form + screenshot in unified `bg-gray-50 rounded-2xl` container (was separate bordered card on white)

**Commits:** `b5ea4d6`, `029b146`, `b334769`

---

### 2026-02-26 (Session 20) — Merge Access Lockdown

**Branch:** `neat-morse`

**What:** Locked down merge access so only TJ can merge PRs to `main` and `staging`. Implemented via GitHub rulesets + org team, downgraded collaborator roles, updated all docs.

**GitHub changes (via API):**
- Created `merge-admins` org team (TJ as sole member)
- Created `main-branch-protection` ruleset (active) — only `merge-admins` can bypass
- Created `staging-branch-protection` ruleset (active) — only `merge-admins` can bypass
- Deleted old classic branch protection on `main`
- Downgraded chantel-stack to org member + repo maintain
- logan447 stays at write (COO, 2nd in charge)
- jakub300 stays at org admin (XFive tech lead, needs admin for transfer tasks)
- Efuanyamekye stays at write

**Final roles:**
| User | Role | Can Merge |
|------|------|-----------|
| tfalohun | admin | Yes (sole merger) |
| jakub300 | admin | No (not in merge-admins) |
| logan447 | write | No |
| chantel-stack | maintain | No |
| Efuanyamekye | write | No |

**Files created/modified:**
- `CLAUDE.md` — added merge permissions section
- `CONTRIBUTING.md` — updated branch protection, Step 8, hands-on Step 7, golden rule
- `docs/GITHUB_SETUP.md` — replaced classic branch protection with rulesets, updated role guidance
- `docs/MERGE_PERMISSIONS.md` — new reference doc (who can merge, how it works, emergency procedure)

---

### 2026-02-26 (Session 19) — Staging Reconciliation + PR Merge Command

**Branch:** `wonderful-euler` → `reconcile-staging` (PR #67, merged) + `pr-merge-improvements`

**What:** Processed Esther's PRs #66 and #65 to staging, discovered they regressed TJ's SEO/auth/branding work, reconciled both workstreams, then built tooling to prevent it from happening again.

**PR merge sequence:**
- PR #66 (Provider Hub Redesign, 81 files) → merged to staging
- PR #65 (Refinements, 20 files) → converted from draft, merged to staging
- Discovered regression: footer discovery zone, homepage power page routing, auth OTP performance, GA4 analytics, v1.0 redirects, provider detail JSON-LD, teal bird branding all silently reverted
- PR #67 (Reconciliation) → started from `fond-fermi`, merged staging in, restored TJ's 17 care-seeker/SEO/auth files while keeping Esther's provider hub files. Build passes.

**New tooling created:**
- `.claude/commands/pr-merge.md` — slash command for safe PR merges with analysis, content regression detection, and Notion reporting
- Phase 2.5: Content Regression Check — compares actual file content (not just commit history) against a critical file watchlist
- Phase 6: Notion Reporting — auto-creates merge reports in Product Development > PR Merge Reports
- Notion folder: "PR Merge Reports" under Product Development

**Post-mortem:**
- Logged in `docs/POSTMORTEMS.md` — root cause was revert→re-apply cycle making git merge-base unreliable
- Key lesson: git merge-base detects structural conflicts, not semantic regressions

**Files created/modified:**
- `.claude/commands/pr-merge.md` — new slash command (created), then upgraded with Phase 2.5 + Phase 6
- `docs/POSTMORTEMS.md` — new post-mortem entry
- `app/provider/[slug]/page.tsx` — removed `isActive` prop (type fix for Esther's refactored ConnectionCard)

---

### 2026-02-25 (Session 18) — Branding Update: Teal Bird Logo + App Store Badge

**Branch:** `fond-fermi` | **PR:** #63 targeting staging (merged)

**What:** Replaced all Olera branding with the teal bird logo and added App Store badge to benefits finder.

**Changes:**
- `public/images/olera-logo.png` — replaced with teal bird (was 3D heart briefly, then swapped to bird)
- `app/icon.png` (32x32) + `app/apple-icon.png` (180x180) — new favicon/touch icon using bird
- `components/shared/Navbar.tsx` — replaced hardcoded blue "O" div with `<img>` tag
- `components/shared/Footer.tsx` — replaced hardcoded blue "O" div with `<img>` tag
- `components/auth/UnifiedAuthModal.tsx` — already referenced `/images/olera-logo.png`, auto-updated
- `public/images/app-store-badge.png` — official "Download on the App Store" badge
- `components/benefits/CareProfileSidebar.tsx` — replaced text link with App Store badge image

**Status:** Merged to staging via PR #63.

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_
