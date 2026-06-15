# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Session Log

### 2026-04-06 — AiA S2E2 YouTube Rollout Review

**What happened:**
- Reviewed Chantelle's Notion rollout plan for Rob Arnold (Aging in America S2E2, publishing Apr 7)
- Analyzed title options, thumbnail options, description, tags, and timestamps
- Identified that S2E1 underperformed (~200 views vs S1E1's ~190K), likely because S1E1 was picked up by YouTube algorithm (TV recommendations at senior facilities + organic sharing), not because of metadata
- Recommended: new title ("The Truth About Caring for Aging Parents | Family Caregiver Story"), thumbnail option 1, front-loaded description, expanded tags, timestamp tweak
- Sent consolidated feedback message to #aging-in-america Slack channel for Chantel

**Decisions made:**
- Metadata optimization is best practice but won't close the 190K gap alone. Real unlock is active distribution and getting algorithm pickup again
- TJ will create a LinkedIn post and Olera blog post to support the rollout

**Next steps:**
- Write LinkedIn post for Rob Arnold episode
- Write Olera blog post for Rob Arnold episode
- Rob Arnold YouTube ID goes live Apr 7
- Investigate S1 distribution channels to understand what's replicable

---

## Current Focus

- **Aging in America — Framer → Olera Web Migration** — SHIPPED TO PRODUCTION ✅
  - Migrated aginginamerica.co (Framer) into olera.care/aging-in-america
  - Dark cinematic landing page, episode detail pages, lazy YouTube player, JSON-LD
  - PRs: #493 (initial), #494 (Rob Arnold fix), #495-#499 (promotions + fixes)
  - Hero image: Viviane Koenig still (replaced YouTube thumbnail with watermark text)
  - Sitemap: AIA pages added to dynamic sitemap
  - S1E3 thumbnail: fallback to sddefault (maxresdefault 404s for VqqAyeqiZ9M)
  - DNS: aginginamerica.co → olera.care/aging-in-america (301 via GoDaddy forwarding, configured)
  - **Next**: Rob Arnold YouTube ID (Apr 7), responsive polish

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

1. Rob Arnold YouTube ID (goes up Apr 7) → plug into data file + flip status to "published"
2. AIA responsive polish pass (mobile/tablet)
3. Update homepage CommunitySection to link to /aging-in-america
5. MedJobs candidates detail page taste pass
6. SEO Action 1: City-specific content sections
7. SEO Action 2: Internal linking
8. Merge PR #463 (user account separation)
9. Continue staging → main promotion

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Dark mode scoped to AIA layout wrapper, not site-wide | Documentary section is a "theater mode" experience. Navbar/footer stay light. Dark bg only within `app/aging-in-america/layout.tsx` |
| 2026-04-06 | Static data file for AIA episodes, not DB table | Editorial content (~10 episodes) that changes rarely. TypeScript array is simpler, faster, and type-safe. Move to CMS if library grows past 30+ |
| 2026-04-06 | olera.care/aging-in-america subdirectory over subdomain | Subdirectory inherits domain authority from olera.care. Google treats subdomains as separate sites. Also cleaner, speakable URL for TV viewers. |
| 2026-04-06 | Lazy YouTube: poster image → iframe on click | Eager YouTube iframes destroy LCP. Poster with play button overlay loads instantly, iframe only on interaction. |
| 2026-04-06 | Season 1 = "Chapters" on YouTube, grouped as Season 1 on site | YouTube titles say "Chapter 1/2/3" but the site organizes by season for clarity. TiVrqkrYhEc is S1 Ch1, not S2 trailer (was incorrectly labeled in codebase). |
| 2026-04-06 | Use custom hero image, not YouTube thumbnail | YouTube maxresdefault has "OLERA PRESENTS / Aging in America" watermark that doubles with the h1 title. Viviane Koenig still is cleaner. |
| 2026-04-06 | GoDaddy forwarding for domain redirect, not Vercel | aginginamerica.co domain is on GoDaddy. Forwarding tab does 301 redirect in 2 clicks — no DNS record changes, no Vercel domain config needed. |
| 2026-03-28 | Onboard page is platform showcase, not profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail Link Tracking Protection strips params named "token". `otk` (one-time key) works. |
| 2026-03-27 | City page SEO = content depth + authority, not technical fixes | Pages rank 35-60 because they're thin on a DA ~5 domain. On-page fixes → 20-25; page 1 needs 3-6mo authority building. |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-04-06 (Session 68) — AIA UI Polish + Ship to Production + Follow-up Fixes

**Branch:** `thirsty-hugle` → merged | **PRs: #493–#499**

**UI critique against BFNA Docs + Water.org references:**
- Hero gradients too heavy → lightened, matched Framer's uppercase editorial copy
- Added subtle scroll parallax on hero image (0.3x speed, respects prefers-reduced-motion)
- Replaced accordion with flat season sections (only 7 episodes)
- Slimmed episode cards: removed summary text, image-forward like BFNA
- Reordered page: Hero → S2 → Trailer → S1 → About → CTA
- Added branded placeholders for coming-soon episodes

**Bugs caught + fixed:**
- Rob Arnold `status: "published"` with TODO YouTube ID → broken detail page. Fixed to "coming-soon" (#494)
- Hero YouTube thumbnail had "OLERA PRESENTS" watermark → swapped to Viviane Koenig still (#497)
- S1E3 `maxresdefault.jpg` returns 404 → fallback to `sddefault` (#498)
- AIA pages missing from sitemap → added to shard 0 (#496)

**Shipped:** PRs #495 + #499 promoted staging → main.
**DNS:** aginginamerica.co → olera.care/aging-in-america via GoDaddy Forwarding (301, configured).

### 2026-04-06 (Session 67) — Aging in America: Framer → Olera Web Migration

**Branch:** `thirsty-hugle` | **2 commits pushed**

**Context:** aginginamerica.co runs on Framer — a static single-page site built when dev was expensive (x5 contractors). Now that we have full Next.js capability, migrating into olera.care/aging-in-america.

**Implementation:**
- `lib/aging-in-america-data.ts` — Episode type + all content from Notion + YouTube IDs from TJ
- Dark cinematic index page: Hero → FeaturedTrailer → About → SeasonAccordion → CTA
- Episode detail pages with lazy YouTube player (poster → iframe), pull quotes, related episodes
- JSON-LD structured data (CreativeWorkSeries + VideoObject)
- Footer link added under Company column

**Blocked:** Rob Arnold (S2E2) YouTube ID — goes up Apr 7. Jason Goldstein and Robert Sutton coming May/Jun.

### 2026-04-03 (Session 66) — Browse Card Image Fallback Fix + R2 Migration Plan

**Branch:** `humble-euler` | **PR #475 merged to staging**

- Provider images on browse pages broken — `cdn-api.olera.care` CloudFront dead
- Fix: `imgFailed` → placeholder directly instead of logo mode (same broken URL)
- R2 migration: 72 min, 41,202 photos uploaded, 21,997 DB updated, 0 errors
- `hero_image_url` column doesn't exist in production DB

