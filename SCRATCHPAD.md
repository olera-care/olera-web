# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Senior Benefits Pipeline & Data Quality System** (branch: `noble-pare`) — IN PROGRESS
  - Building a repeatable pipeline for benefits data: discover → verify → generate → QA gate → deploy
  - Modeled on city pipeline (`pipeline-batch.js`) but for senior benefits content
  - **Completed**:
    - Verification metadata on types (`WaiverProgram`, `BenefitProgram`): `sourceUrl`, `lastVerifiedDate`, `verifiedBy`, `savingsSource`, `savingsVerified`
    - Chantel's Texas audit ingested: 12 programs with corrected income limits, savings, source URLs
    - SQL migration `034_sbf_verification_metadata.sql` created + run on Supabase
    - Seed endpoint updated to pass verification fields + dry_run shows verification stats
    - `/admin/benefits` dashboard: state grid → program detail → content preview with verification dots
    - Admin sidebar link added under Operations
  - **Key data corrections from Chantel's audit**:
    - SNAP income: $1,729 → $2,152/mo; savings: $1,500–$3,600 → $3,576–$21,468/yr
    - MEPD income: $994 → $967/mo (couple: $1,491 → $1,450)
    - Ombudsman/Legal/Companion: fake savings ranges → empty (free services)
    - Respite Care: $2,000–$8,000 → up to $3,600/yr (actual cap)
    - CEAP: $500–$2,000 → $300–$1,500/yr
    - Weatherization: $500–$2,000 → $5,000–$8,000 in free improvements
  - **Bug catches during self-review**: "Save Free service" UI text, FAQ/step content inconsistencies with updated eligibility numbers, savingsRange overflow on badge
  - **Pushed**: 1 commit to `noble-pare`, needs PR to staging
  - **Page generation**: waiver library pages auto-generate from `waiver-library.ts` via `generateStaticParams` — adding programs = pages appear on deploy
  - **Deep links**: Added "View live page" links from admin dashboard → `/waiver-library/{state}/{program}`
  - **Plan doc**: `plans/benefits-pipeline-plan.md` — full system design for Apr 7 meeting with Chantel + Logan
  - **Pushed**: 2 commits to `noble-pare`, needs PR to staging
  - **Pipeline v1 built** (`scripts/benefits-pipeline.js`): 5 phases, tested on Michigan (20 programs found, QA gate correctly failed at 49%)
  - **Key pivot**: Rigid 5-shape taxonomy abandoned. Pipeline should EXPLORE first, let taxonomy emerge from real data across states. Chantel's CSV columns are her emergent taxonomy — the system should learn the same way.
  - **Next approach**: Build exploration-first pipeline that observes what data exists per program, brings it back in flexible format, then humans + AI decide what structure to impose. The taxonomy comes AFTER exploration, not before.
  - **Next**:
    1. Rebuild pipeline as exploration tool (observe → report → learn)
    2. Run exploration on 3-4 diverse states (TX, MI, FL, CA)
    3. Review output together — let patterns emerge
    4. THEN formalize the data model from what we found
    5. PR to staging with foundation work (dashboard, metadata, etc.)

- **Aging in America** — SHIPPED (PRs #493-498 merged)
  - Rob Arnold (S2E2) YouTube ID due Apr 7

- **Homepage De-Jank + Mega Menu + Search Bar Polish** (branch: `gifted-rosalind`) — READY FOR QA

- **Provider Page CTA Conversion Redesign** — PUSHED TO `fine-dijkstra`, TESTING ON VERCEL PREVIEW

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

1. Deep links from `/admin/benefits` → live waiver-library pages
2. Build `scripts/benefits-pipeline.js` — the core engine
3. PR `noble-pare` to staging → deploy → seed → test admin dashboard
4. Rob Arnold YouTube ID (goes up Apr 7) → plug into AIA data
5. MedJobs candidates detail page taste pass
6. SEO Action 1: City-specific content sections
7. SEO Action 2: Internal linking
8. Merge PR #463 (user account separation)
9. Continue staging → main promotion

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Exploration before taxonomy — don't lock in data model before exploring enough states | 5-shape taxonomy was derived from 12 TX programs. That's too small a sample. Let the pipeline observe what data exists, then formalize structure from patterns across multiple states. |
| 2026-04-06 | Admin dashboard reads from waiver-library.ts, not Supabase | Shows source of truth (what will be seeded). Richer data (FAQs, intros, steps). Works without migration. |
| 2026-04-06 | No Airtable — keep AI-first workflow with admin viewer | Provider data (55K records) uses Supabase + Claude Code directly, not Airtable CSVs. Benefits should follow the same pattern. The problem was viewing, not editing. |
| 2026-04-06 | Empty string for free-service savingsRange, not "Free service" text | UI renders "Save {savingsRange}" — "Save Free service" is grammatically wrong. Empty string = badge hidden. Free-service info lives in savingsSource metadata. |
| 2026-04-06 | Verification gate rule: no new state goes live until every program passes verification | YMYL content — Google can suppress the whole domain for inaccurate benefits info. |
| 2026-04-06 | Dark mode scoped to AIA layout wrapper, not site-wide | Documentary section is a "theater mode" experience. Navbar/footer stay light. |
| 2026-04-06 | Static data file for AIA episodes, not DB table | Editorial content (~10 episodes) that changes rarely. TypeScript array is simpler, faster, and type-safe. |
| 2026-04-06 | olera.care/aging-in-america subdirectory over subdomain | Subdirectory inherits domain authority from olera.care. |
| 2026-03-28 | Onboard page is platform showcase, not profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail Link Tracking Protection strips params named "token". `otk` (one-time key) works. |
| 2026-03-27 | City page SEO = content depth + authority, not technical fixes | Pages rank 35-60 because they're thin on a DA ~5 domain. |
| 2026-03-25 | Quick discovery mode (3 terms/category) sufficient for batch | Standard mode (12 terms) costs 4x more but yields mostly duplicates. |
| 2026-03-24 | Highlights are earned, not defaulted — fewer honest > 4 generic | Users see through templated labels. 1 verified fact builds more trust than 4 defaults. |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Benefits data: 528 programs across 50 states in `data/waiver-library.ts` (11,664 lines)
- Chantel Research files: `~/Desktop/olera-hq/Senior Benefits/Chantel Research/` — Texas audit CSV + accuracy analysis docx
- Notion strategy docs: "Benefits: Turning Traffic into Platform Users" + "Benefits Data: Getting It Right Before We Scale"
- Waiver library pages auto-generate via `generateStaticParams` — Texas has special SEO routes at `/texas/benefits/`, other states at `/waiver-library/{state}/`
- Pipeline reference architecture: `scripts/pipeline-batch.js` (1322 lines) — CLEAN → LOAD → ENRICH → FINALIZE

---

## Session Log

### 2026-04-06 (Session 68) — Senior Benefits Data Quality System

**Branch:** `noble-pare` | **1 commit pushed**

**Context:** Benefits pages are getting organic traffic but the data has no citations, no verification dates, and savings estimates are category-based guesses. Chantel did a manual Texas audit (12 programs). Goal: build a system to verify at scale and expand to new states.

**Research phase:**
- Read Chantel's Texas audit CSV (12 programs with detailed verified data)
- Read two Notion strategy docs on benefits traffic-to-conversion and data quality
- Analyzed city pipeline (`pipeline-batch.js`) as reference architecture
- Explored full benefits codebase: types, matcher, seed endpoint, pages, waiver library

**Data model upgrade:**
- Added 5 verification fields to `WaiverProgram` and `BenefitProgram` interfaces
- SQL migration `034_sbf_verification_metadata.sql` — adds columns to both `sbf_state_programs` and `sbf_federal_programs`
- Seed endpoint passes verification fields through; dry_run shows verification coverage stats

**Chantel's Texas audit ingested:**
- 12 programs mapped to existing waiver-library entries
- Fixed real data errors (SNAP income $1,729→$2,152, MEPD $994→$967)
- Corrected fake savings on free services (Ombudsman, Legal, Companion)
- All 12 programs now have sourceUrl, lastVerifiedDate, verifiedBy, savingsSource

**Self-review caught 4 bugs before TJ tested:**
1. "Save Free service" display text — changed to empty string
2. SNAP FAQ/steps still referenced old $1,729 income limit
3. MEPD FAQ/steps still referenced old $994 income limit
4. Weatherization savingsRange too long for badge UI

**Admin dashboard (`/admin/benefits`):**
- State grid overview with verification progress bars
- Click state → program list with green/gray verification dots
- Click program → expand to see rendered preview (overview, eligibility, steps, FAQs, source links)
- Sidebar link added under Operations

**Key decisions:**
- No Airtable — AI-first editing with admin viewer (matches provider workflow)
- Dashboard reads from waiver-library.ts directly (source of truth, richer than DB)
- Verification gate rule: no state goes live without full verification

### 2026-04-06 (Session 67) — Aging in America: Framer → Olera Web Migration

**Branch:** `thirsty-hugle` | **Merged via PRs #493-498**

- Full AIA migration: dark cinematic index page + episode detail pages
- YouTube IDs confirmed, hero image fixed, sitemap added, thumbnail fallback

### 2026-04-03 (Session 66) — Browse Card Image Fallback Fix + R2 Migration Plan

**Branch:** `humble-euler` | **PR #475 merged to staging**

- Provider images broken — CloudFront dead. Fix: direct placeholder fallback.
- R2 migration: 41,202 photos, 21,997 DB updates, 0 errors.

### 2026-03-31 (Session 65) — Worktree Cleanup + URL/Breadcrumb System Docs

**Branch:** `speedy-jemison`

- Removed 174 local worktree folders, deleted ~185 stale remote branches

### 2026-03-30 (Session 64) — Fix Orphaned Question/Lead Notifications

**Branch:** `fancy-lamarr` | **1 commit** | `cd60db73`

- Fixed "Provider already has an email" error on admin Questions
