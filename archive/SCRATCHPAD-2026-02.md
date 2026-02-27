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

## Archived Sessions

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
