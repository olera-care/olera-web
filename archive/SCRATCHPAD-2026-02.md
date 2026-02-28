# Scratchpad Archive - February 2026

> Archived sessions from SCRATCHPAD.md

---

## Archived Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-30 | Added Claude Code slash commands | Standardize workflow for explore → plan → build → save cycle |
| 2026-02-05 | Use shared tables for PR #21 (not separate web tables) | iOS approved, avoid duplication |
| 2026-02-05 | Keep our browse/provider pages when merging PR #21 | Working filtering, Esther's design already merged |
| 2026-02-05 | No adapter layer for iOS schema | User feedback: keep both uniform, simpler code |
| 2026-02-05 | Server-side browse page over client-side | Real Supabase data requires server components |
| 2026-02-10 | Single UnifiedAuthModal replaces 2 modals | Eliminated ~2,000 LOC of duplication |
| 2026-02-10 | Google OAuth primary CTA, auth-first flow | One-click auth is fastest path |
| 2026-02-12 | Staging environment: staging branch + Vercel domain + branch protection | Buffer between dev and production |
| 2026-02-20 | Primary palette: teal/cyan (#06B6D4) replacing green (#319266) | Match iOS OleraClean accent colors |
| 2026-02-20 | Vanilla backgrounds (#F9F6F2) for warm feel | Match iOS oleraVanilla bg |
| 2026-02-20 | Serif font (New York/Georgia) for display headings | Match iOS OleraClean typography |
| 2026-02-20 | Remove white card wrappers from hero and content sections | Reduce "containers within containers" nesting |
| 2026-02-20 | Hero above grid, sidebar starts at Highlights level | Give hero breathing room, sticky sidebar enters at content |
| 2026-02-20 | Olera Score: centered circle + 4 breakdown cards | Match Olera 1.0 Figma rating layout |
| 2026-02-20 | Highlights as 2x2 transparent badges in identity area | Fill dead space, surface trust signals without visual clutter |

---

## Archived Reference Material

### Architecture Research: Directory City Page Patterns (2026-02-24)

> Critical findings from researching how top directories handle SEO + interactive browse.
> This informs the unified browse/power page architecture for Olera v2.0.

#### Key Finding: Every Top Directory Uses ONE Page

Every major directory — Zillow, A Place for Mom, Caring.com, Zocdoc, Apartments.com — uses a **single page** per city+category that serves BOTH as the SEO landing page AND the interactive search/browse page. Nobody maintains separate "SEO page" and "search page."

The architecture is: **server-render the first load** (Google sees full HTML with listings, meta, JSON-LD), then **hydrate client-side** for filters/sort/map.

#### Two-Tier URL Strategy (Universal Pattern)

| Tier | URL Type | Example | Indexed? |
|------|----------|---------|----------|
| Tier 1 | Clean path (high-value combos) | `/assisted-living/texas/houston` | Yes |
| Tier 2 | Query params (user-applied filters) | `?rating=4&sort=price` | Blocked in robots.txt |

#### Site-Specific Findings

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

#### Implications for Olera

1. Current architecture (separate `/browse` client page + `/[category]/[state]/[city]` server power page) is **wrong**
2. Must merge into a single page that is server-rendered for SEO + client-hydrated for interactivity
3. Filters should operate client-side without changing URL (or use query params blocked in robots.txt)
4. The hero search CTA can stay pointing to `/browse` as a fallback for ZIP/geolocation searches
5. All internal links (footer, nav, bento grid) should point to power page clean paths

---

### Phase 4 Plan: Unified Browse+Power Page

> Merge the interactive browse experience into the power page architecture.
> Single URL serves both SEO (server-rendered) and UX (client-hydrated).

#### Architecture

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

#### Key Decisions Needed

1. **Map on city pages**: Yes/No? (A Place for Mom has no map; Zillow does)
2. **Which filters**: Rating, sort, payment? (Keep it simple initially)
3. **What happens to `/browse`**: Keep as fallback for ZIP/geolocation, or redirect?
4. **Provider limit**: Server fetches 48 currently; browse fetches 100. What limit for unified?

#### Implementation Steps (Estimated)

1. Create `CityBrowseClient` component — takes server-fetched providers, adds filter/sort/map
2. Update city power page to use `CityBrowseClient` instead of static grid
3. Preserve all existing SEO elements (metadata, JSON-LD, breadcrumbs, ISR)
4. Port map component (already exists in `BrowseMap.tsx`)
5. Port filter UI (rating, sort, payment) from `BrowseClient.tsx`
6. Update robots.txt to block `/*?` query params on power pages
7. Decide fate of `/browse` (keep as fallback or redirect)
8. Test: verify server HTML contains full listings for Google, filters work client-side

---

## Archived Sessions

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

**What:** Created a comprehensive Web QA Test Plan database on Notion, modeled after the existing App Store QA Test Plan. 85 test cases across 13 sections.

**Notion database:** https://www.notion.so/9f68deb000be474f919f215dee5f4605

**Handed off to:** Esther for QA execution

---

### 2026-02-21 (Session 16) — Admin Provider Directory Editor

**Branch:** `stellar-hypatia` → merged to `staging` via PR #40

**Provider Directory Editor:** Full CRUD directory (list page with search/filters/tabs/pagination, detail/edit page with 7 sections), API routes with field allowlist + audit logging, sidebar restructure, admin links in navbar/portal, dashboard stat card.

**Key files:** `app/admin/directory/page.tsx`, `app/admin/directory/[providerId]/page.tsx`, `app/api/admin/directory/route.ts`, `app/api/admin/directory/[providerId]/route.ts`

---

### 2026-02-20 (Session 15b) — Browse Page Polish + Bug Fixes

**Branch:** `staging`

Bug fixes: filter dropdown clipping, z-index, deleted provider filtering, AbortError in useEffect.

---

### 2026-02-20 (Session 15) — Browse Page Redesign

**Branch:** `staging`

Redesigned browse page: removed carousel/grid/map views → single list+map layout. Created `BrowseCard.tsx`, refactored `BrowseClient.tsx`.

---

### 2026-02-20 (Session 14) — Smart Defaults & Description Backfill

**Branch:** `quiet-elion`

Smart defaults (highlights, services, descriptions inferred from category). Description backfill: 33,631 of 36,623 NULL descriptions filled from RAG CSV.

---

### 2026-02-20 (Session 13) — Provider Page Design Polish

**Branch:** `quiet-elion`

**Design Language Alignment:**
- Extracted iOS OleraClean design system (colors, fonts, spacing, component patterns)
- Updated `tailwind.config.ts`: teal primary palette, vanilla backgrounds, serif font families
- Commit: `f85fe14`

**Hero Section Iteration (7 commits):**
1. `935593e` — Remove nested containers (white card wrappers → content sits on vanilla bg)
2. `a84c0df` — Match Highlights and Managed By to Olera 1.0 Figma (white cards, unique icons)
3. `04346a6` — Always show 4 highlights, white background cards
4. `c781503` — Move hero above grid, sidebar starts at Highlights level (sticky positioning)
5. `5b8f893` — Replace rating with Olera 1.0 centered score (circle + stars + 4 breakdowns)
6. `a3e7e3a` — Move highlights into hero identity area as 2x2 transparent badges

---

### 2026-02-12 (Session 12)

**Staging Environment Setup:**
- Created `staging` branch from `main` and pushed
- Updated `CONTRIBUTING.md` with staging workflow, branch strategy, deployment flow

---

### 2026-02-10 (Session 11)

**Auth Overhaul — All 3 Phases Complete:**
- Replaced ~3,000 lines of auth code with ~1,000-line unified system
- Phase 1: `UnifiedAuthModal` with Google OAuth + email-first flow
- Phase 2: Post-auth onboarding inside modal (no separate /onboarding page)
- Phase 3: Cleanup — deleted 6 legacy files, migrated 13 files

---

### 2026-02-09 (Session 10)

**Admin Dashboard MVP:**
- Built full admin dashboard at `/admin` (Overview, Providers, Leads, Team)
- Changed provider claim flow: new claims → `pending` (admin review first)
- Added portal banners for pending/rejected states
- Auth gating via middleware + layout
- SQL migration: admin_users, audit_log tables with RLS

---

### 2026-02-07 (Session 9)

**Merged PR #22 - Esther's Design + Our Supabase Data:**

- **Merged PR #22** (browse-page-refinement from Esther's fork)
  - Conflicts resolved: SCRATCHPAD.md (kept ours), Navbar.tsx (kept ours — auth integration)
  - Esther's changes merged: Community forum V2, navbar updates, browse filter widths
- **Fixed homepage city search regression** — removed default "New York, NY" pre-fill
- **Integrated Esther's browse design with Supabase data**
  - Switched `/browse` to `BrowseClient` component with Supabase fetching
  - Queries `olera-providers` table (39K+ providers)
  - Filters by care type, location, rating, payment type
- **Verified provider detail page** with Esther's Olera Score breakdown, reviews, similar providers

**Commits:** `c0e0abf`, `c1e3a92`, `e5b0e1a`

---

### 2026-02-07 (Session 8)

**"Email me a code instead" - OTP Sign-in Option:**

- **Added OTP sign-in option to match iOS app UX**
  - User couldn't sign in (forgot password) - wanted OTP option like iOS app
  - Added "Email me a code instead" link below password field in sign-in forms

- **Files modified:**
  - `components/auth/AuthFlowModal.tsx`:
    - Added `handleSendOtpForSignIn` handler using `signInWithOtp`
    - Updated `AuthStep` component with new `onSendOtpCode` prop
  - `components/auth/AuthModal.tsx`:
    - Added `verify-otp` view type
    - Added OTP handlers and 8-digit code input UI

- **PR #24 merged** - OTP sign-in feature live

**Provider Portal Cleanup:**

- **Closed PR #21** (Logan's original) with comment explaining it was integrated via PR #23
- Logan's code was merged with schema modifications, not his original PR

**Supabase Schema Documentation:**

Documented actual table usage for team clarity:

| Table | iOS | Web | Purpose |
|-------|-----|-----|---------|
| `olera-providers` | Yes | Yes | 39K provider directory (shared) |
| `profiles` | Yes | No | iOS user identity |
| `care_requests` | Yes | No | iOS connection requests |
| `care_need_profiles` | Yes | No | iOS family care needs |
| `matches` | Yes | No | iOS family-provider matching |
| `conversations` / `messages` | Yes | No | iOS chat |
| `accounts` | No | Yes | Web user identity (NEW) |
| `business_profiles` | No | Yes | Web business listings (NEW) |
| `connections` | No | Yes | Web inquiries/saves (NEW) |
| `memberships` | No | Yes | Web subscriptions (NEW) |

**Key clarification:** `profiles` -> `business_profiles` rename was because iOS uses `profiles` for user identity, not business listings.

---

### 2026-02-06 (Session 7)

**Provider Portal Integration - Phase 2 Code Merge:**

- **Analyzed iOS Supabase schema** to reconcile with Logan's expected schema
- **Key Decision**: Rename Logan's `profiles` -> `business_profiles` to avoid iOS conflict
- **Created SQL migration**: `supabase/migrations/001_provider_portal_tables.sql`
- **Merged PR #21 code** on `feature/provider-portal` branch
- **Updated all table references**: `profiles` -> `business_profiles` in merged files
- **Build passes**
- **Resolved data architecture question**: Add `source_provider_id` column to `business_profiles`
- **Created PR #23**: https://github.com/olera-care/olera-web/pull/23
- **SQL Migration Run** - Tables created in Supabase

---

### 2026-02-05 (Sessions 5-6)

**Provider Portal Integration Planning:**

- **Merged PR #20** (Esther's provider details consolidation)
- **Analyzed PR #21** (Logan's provider portal)
- **Created integration plan**: `plans/provider-portal-integration.md`
- **iOS APPROVED!** - Can now proceed with portal integration

**Supabase Unification - Phase 1 Implementation:**

- Fixed browse page showing mock data instead of real Supabase data
- Added server-side filtering to browse page
- Connected web app to iOS Supabase (`ocaabzfiiikjcgqwhbwr`)
- Created `lib/types/provider.ts` - iOS Provider schema + helpers
- Updated provider detail, homepage, browse pages to use real data
- 39,355+ real providers accessible
- Resolved merge conflicts in PR #16, created PR #17
- Merged PRs #16, #17, #18

---

### 2026-02-03

**Hero Section Redesign:**
- Added HousingAnywhere-inspired pill-style search bar
- Added social proof pill ("48,000+ verified providers listed")
- Added background image with overlay

**Provider Card Spacing Fixes:**
- Set image section to 256px, content to 256px (total 512px)
- Standardized vertical stacks for consistent layout

---

### 2026-02-02

- Added "Top providers near you" section to homepage with 4 provider cards
- Created `ProviderCard` component
- Created provider detail page
- Using dummy data (will connect to Supabase later)

---

### 2026-01-30

- Set up Claude GitHub App for olera-care organization
- Created slash commands: `/resume`, `/explore`, `/plan`, `/commit`, `/save`, `/quicksave`, `/troubleshoot`, `/postmortem`, `/ui-critique`, `/compact`
- Created SCRATCHPAD.md
