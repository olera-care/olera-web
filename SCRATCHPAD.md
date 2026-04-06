# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Aging in America — Framer → Olera Web Migration** (branch: `thirsty-hugle`) — PUSHED, AWAITING PR
  - Migrating aginginamerica.co (Framer) into olera.care/aging-in-america
  - Dark cinematic landing page (`bg-[#0a0a0a]`) with season accordion + episode detail pages
  - Design refs: bfnadocs.org (primary template), thewhy.dk (season accordion), water.org (human storytelling cards), NYT Op-Docs (clean grid)
  - **Files created**:
    - `lib/aging-in-america-data.ts` — Episode type + static data for S1 (3 eps) + S2 (trailer + 4 eps)
    - `app/aging-in-america/layout.tsx` — Dark layout wrapper + SEO metadata
    - `app/aging-in-america/page.tsx` — Index: Hero → FeaturedTrailer → About → SeasonAccordion → CTA + JSON-LD
    - `app/aging-in-america/[slug]/page.tsx` — Episode detail: back nav, metadata pills, lazy YouTube player, pull quote, related episodes
    - `components/aging-in-america/` — HeroSection, FeaturedTrailer, AboutSection, SeasonAccordion, EpisodeCard, YouTubePlayer, CtaSection
    - `plans/aging-in-america-plan.md` — Full implementation plan with design refs
  - **Footer updated**: Added "Aging in America" link under Company column
  - **YouTube IDs confirmed from TJ's channel** (804 subscribers, 16 videos):
    - S1 Ch1 "Stay at Home vs Assisted Living": `TiVrqkrYhEc` (193K views, viral)
    - S1 Ch2 "Who Takes Care of the Caregiver?": `-rUirbsNmzA` (7.8K views)
    - S1 Ch3 "What 24/7 Dementia Care Really Looks Like": `VqqAyeqiZ9M` (9.9K views)
    - S2 Trailer: `kbKOG8vmJl0` (92 views, 1:00)
    - S2E1 Carol Dean: `aF_fekzYNDw` (163 views, 5:40)
    - S2E2 Rob Arnold: TBD — goes up Apr 7
    - S2E3 Jason Goldstein: TBD — coming May 12
    - S2E4 Robert Sutton: TBD — coming Jun 17
  - Build passes clean, 2 commits pushed to `thirsty-hugle`
  - **Next**: PR to staging, Rob Arnold YouTube ID, responsive polish, homepage CommunitySection link, sitemap, DNS redirect

- **Database Dedup Cleanup — 2026-04-06** — DONE ✅
  - 539 soft-deleted via Tier 1+2 (address-confirmed), Tier 3 improved but needs manual review

- **Homepage De-Jank + Mega Menu + Search Bar Polish** (branch: `gifted-rosalind`) — READY FOR QA

- **Provider Page CTA Conversion Redesign** — PUSHED TO `fine-dijkstra`, TESTING ON VERCEL PREVIEW

- **City Expansion Batch — 2026-04-04** — DONE ✅ (193 cities, 476 total)

- **Strict User Account Type Separation** (PR #463) — READY FOR MERGE

- **Staging → Main Promotion** — IN PROGRESS (253 commits audited)

- **SEO: City/Browse Page Optimization** — ANALYSIS COMPLETE, IMPLEMENTATION NEXT

- **Care Seeker Connection Flow De-Jank** (branch: `helpful-euler`) — IN PROGRESS

- **Family Activity Center** (branch: `logical-mahavira`) — IN PROGRESS

---

## Blocked / Needs Input

(none active)

---

## Next Up

1. Rob Arnold YouTube ID (goes up Apr 7) → plug into data file
2. PR `thirsty-hugle` to staging → preview AIA page
3. AIA responsive polish pass (mobile/tablet)
4. Update homepage CommunitySection to link to /aging-in-america
5. DNS: point aginginamerica.co → olera.care/aging-in-america (301 redirect)
6. MedJobs candidates detail page taste pass
7. SEO Action 1: City-specific content sections
8. SEO Action 2: Internal linking
9. Merge PR #463 (user account separation)
10. Continue staging → main promotion

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Dark mode scoped to AIA layout wrapper, not site-wide | Documentary section is a "theater mode" experience. Navbar/footer stay light. Dark bg only within `app/aging-in-america/layout.tsx` |
| 2026-04-06 | Static data file for AIA episodes, not DB table | Editorial content (~10 episodes) that changes rarely. TypeScript array is simpler, faster, and type-safe. Move to CMS if library grows past 30+ |
| 2026-04-06 | olera.care/aging-in-america subdirectory over subdomain | Subdirectory inherits domain authority from olera.care. Google treats subdomains as separate sites. Also cleaner, speakable URL for TV viewers. |
| 2026-04-06 | Lazy YouTube: poster image → iframe on click | Eager YouTube iframes destroy LCP. Poster with play button overlay loads instantly, iframe only on interaction. |
| 2026-04-06 | Season 1 = "Chapters" on YouTube, grouped as Season 1 on site | YouTube titles say "Chapter 1/2/3" but the site organizes by season for clarity. TiVrqkrYhEc is S1 Ch1, not S2 trailer (was incorrectly labeled in codebase). |
| 2026-03-28 | Onboard page is platform showcase, not profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail Link Tracking Protection strips params named "token". `otk` (one-time key) works. |
| 2026-03-27 | City page SEO = content depth + authority, not technical fixes | Pages rank 35-60 because they're thin on a DA ~5 domain. On-page fixes → 20-25; page 1 needs 3-6mo authority building. |
| 2026-03-25 | Quick discovery mode (3 terms/category) sufficient for batch | Standard mode (12 terms) costs 4x more but yields mostly duplicates. |
| 2026-03-24 | Highlights are earned, not defaulted — fewer honest > 4 generic | Users see through templated labels. 1 verified fact builds more trust than 4 defaults. |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-04-06 (Session 67) — Aging in America: Framer → Olera Web Migration

**Branch:** `thirsty-hugle` | **2 commits pushed**

**Context:** aginginamerica.co runs on Framer — a static single-page site built when dev was expensive (x5 contractors). Now that we have full Next.js capability, migrating into olera.care/aging-in-america.

**Research phase:**
- Deep dive on aging-in-America market (demographics, costs, competitors, caregiver crisis)
- Pulled all AIA episode data from Notion (S1 chapters + S2 episodes with titles, descriptions, pull quotes, timestamps)
- TJ provided design references: bfnadocs.org (primary), thewhy.dk (season accordion), water.org (human storytelling), NYT Op-Docs (clean grid)
- Crafted Perplexity/Gemini/Grok prompt for TJ to find better design refs (Claude's initial suggestions were dated)

**Implementation:**
- `lib/aging-in-america-data.ts` — Episode type + all content from Notion + YouTube IDs from TJ
- Dark cinematic index page: Hero → FeaturedTrailer → About → SeasonAccordion → CTA
- Episode detail pages with lazy YouTube player (poster → iframe), pull quotes, related episodes
- JSON-LD structured data (CreativeWorkSeries + VideoObject)
- Footer link added under Company column
- Build clean, all routes generating

**YouTube ID corrections:**
- `TiVrqkrYhEc` was labeled "Chapter 1" in homepage embed but is actually S1 Ch1 (Stay at Home vs Assisted Living, 193K views)
- `kbKOG8vmJl0` is the S2 trailer (1:00)
- S1 has 3 separate videos, not a compilation

**Blocked:** Rob Arnold (S2E2) YouTube ID — goes up Apr 7. Jason Goldstein and Robert Sutton coming May/Jun.

### 2026-04-03 (Session 66) — Browse Card Image Fallback Fix + R2 Migration Plan

**Branch:** `humble-euler` | **PR #475 merged to staging**

- Provider images on browse pages broken — `cdn-api.olera.care` CloudFront dead
- Fix: `imgFailed` → placeholder directly instead of logo mode (same broken URL)
- R2 migration: 72 min, 41,202 photos uploaded, 21,997 DB updated, 0 errors
- `hero_image_url` column doesn't exist in production DB

### 2026-03-31 (Session 65) — Worktree Cleanup + URL/Breadcrumb System Docs

**Branch:** `speedy-jemison`

- Removed 174 local worktree folders, deleted ~185 stale remote branches
- Added URL & Breadcrumb Strategy to `docs/SYSTEMS.md`

### 2026-03-30 (Session 64) — Fix Orphaned Question/Lead Notifications

**Branch:** `fancy-lamarr` | **1 commit** | `cd60db73`

- "Provider already has an email" error on admin Questions. Root cause: deferred notification system tightly coupled save-email + send-notifications.
- Fix: removed hard block, added bidirectional cross-clearing, pre-fill email input, duplicate-send guard.
