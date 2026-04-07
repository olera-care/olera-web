# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Senior Benefits Pipeline & Data Quality System** (branch: `noble-pare`) — READY FOR PR
  - Exploration-first pipeline for benefits data: explore → dive → compare → report
  - **7 commits on `noble-pare`**, not yet PR'd to staging
  - **What's built**:
    - Verification metadata on types (`WaiverProgram`, `BenefitProgram`): `sourceUrl`, `lastVerifiedDate`, `verifiedBy`, `savingsSource`, `savingsVerified`
    - Chantel's Texas audit ingested: 12 programs corrected (SNAP income $1,729→$2,152, MEPD $994→$967, free services fixed, etc.)
    - SQL migration `034_sbf_verification_metadata.sql` — run on Supabase
    - Seed endpoint passes verification fields + dry_run shows coverage stats
    - `/admin/benefits` dashboard: state grid → program detail → content preview → deep links to live pages
    - Pipeline findings surfaced inline in dashboard (diffs, novel fields, explored date)
    - `scripts/benefits-pipeline.js` — exploration-first pipeline (explore → dive → compare → report)
    - Auto-generates `data/pipeline-summary.ts` so dashboard sees findings without manual updates
    - Michigan test run: 16 programs, 4 data errors found, 5 novel fields, 765-line report
  - **Key files**:
    - `scripts/benefits-pipeline.js` — The pipeline script
    - `data/pipeline-summary.ts` — Auto-generated, imported by admin dashboard
    - `data/pipeline/MI/` — Michigan exploration output (explore.json, dive.json, compare.json, exploration_report.md)
    - `app/admin/benefits/page.tsx` — Admin dashboard
    - `data/waiver-library.ts` — Source of truth (528 programs, 12 TX verified)
    - `plans/benefits-pipeline-plan.md` — System design doc
    - `plans/benefits-data-model-plan.md` — Data model redesign plan (deferred — taxonomy comes after exploration)
  - **Pipeline usage**:
    - `node scripts/benefits-pipeline.js --state MI` — dry-run preview
    - `node scripts/benefits-pipeline.js --state MI --run` — full exploration (~3 min, $0.09)
    - `node scripts/benefits-pipeline.js --state MI --phase explore --run` — single phase
    - Output: `data/pipeline/{STATE}/exploration_report.md` + auto-updated `pipeline-summary.ts`
  - **Next**:
    1. PR to staging → deploy → test dashboard live
    2. Run pipeline on FL and CA to see patterns across states
    3. Review reports with Chantel + Logan → decide what data model changes are needed
    4. Seed TX programs: `/api/admin/seed-sbf-programs?state=TX&confirm=true`

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

1. PR `noble-pare` to staging → deploy → test admin dashboard live
2. Run pipeline on FL + CA → compare patterns across 3 states
3. Review reports with Chantel + Logan (Apr 7 meeting)
4. Seed TX: `/api/admin/seed-sbf-programs?state=TX&confirm=true`
5. Based on multi-state patterns → formalize data model changes
6. Rob Arnold YouTube ID (due Apr 7)
7. MedJobs candidates detail page taste pass
8. SEO city-specific content sections
9. Merge PR #463 (user account separation)
10. Continue staging → main promotion

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-06 | Exploration before taxonomy | 5-shape taxonomy derived from 12 TX programs was too small a sample. Pipeline observes what data exists, taxonomy emerges from patterns across states. |
| 2026-04-06 | Pipeline auto-generates dashboard data | `pipeline-summary.ts` is auto-written after each run. No manual step between pipeline and dashboard. |
| 2026-04-06 | Dashboard shows pipeline findings inline, not in separate view | Pipeline diffs appear as amber warnings on program rows. Dashboard stays a quality lens, not a pipeline viewer. |
| 2026-04-06 | No Airtable — AI-first workflow with admin viewer | Provider data uses Supabase + Claude directly. Benefits follows same pattern. Problem was viewing, not editing. |
| 2026-04-06 | Empty string for free-service savingsRange | UI renders "Save {savingsRange}" — empty string = badge hidden. Free-service info lives in savingsSource. |
| 2026-04-06 | Verification gate: no state goes live without verification | YMYL content — Google can suppress the whole domain for inaccurate benefits info. |
| 2026-03-28 | Onboard page is platform showcase, not profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms." |
| 2026-03-27 | Rename `token` query param to `otk` in email links | Apple Mail strips params named "token". |
| 2026-03-25 | Quick discovery mode (3 terms/category) sufficient for batch | Standard mode costs 4x more but yields mostly duplicates. |
| 2026-03-24 | Highlights are earned, not defaulted | Users see through templated labels. 1 verified fact > 4 defaults. |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Benefits data: 528 programs across 50 states in `data/waiver-library.ts` (11,664 lines)
- Chantel Research files: `~/Desktop/olera-hq/Senior Benefits/Chantel Research/` — TX audit CSV + accuracy docx
- Notion strategy docs: "Benefits: Turning Traffic into Platform Users" + "Benefits Data: Getting It Right Before We Scale"
- Waiver library pages auto-generate via `generateStaticParams` — adding programs = pages on deploy
- Texas has special SEO routes at `/texas/benefits/`, other states at `/waiver-library/{state}/`
- Pipeline reference: `scripts/pipeline-batch.js` (city pipeline, 1322 lines)
- Michigan pipeline findings: PACE age wrong (65→55), SNAP age wrong (65→60), Ombudsman has fake savings, 4 source URLs missing, 5 data fields model can't capture (asset_limits, regional_variations, waitlist, documents_required, household_size_table)

---

## Session Log

### 2026-04-06 (Session 68) — Senior Benefits Data Quality System

**Branch:** `noble-pare` | **7 commits pushed**

**Scope:** End-to-end benefits data quality system — from data model through pipeline to admin dashboard.

**Phase 1 — Foundation:**
- Added verification metadata fields to `WaiverProgram` + `BenefitProgram` types
- SQL migration for `sbf_state_programs` + `sbf_federal_programs`
- Ingested Chantel's TX audit: 12 programs corrected (income limits, savings, sources)
- Self-review caught 4 bugs before TJ tested: "Save Free service" UI, FAQ/step content inconsistencies, badge overflow

**Phase 2 — Admin Dashboard:**
- Built `/admin/benefits`: state grid → program detail → content preview
- Deep links to live waiver library pages
- Sidebar link under Operations
- Key design choice: viewer not editor — AI edits data, humans review visually

**Phase 3 — Pipeline v1 (abandoned):**
- Built rigid 5-phase pipeline (discover → verify → generate → QA → finalize)
- Michigan test: 20 programs found but QA gate was meaningless (Perplexity self-assessment, not real verification)
- TJ challenged: "we can do better" — pipeline was doing generic research, not targeted verification

**Phase 4 — Pipeline v2 (exploration-first):**
- Rebuilt as explore → dive → compare → report
- Open-ended questions ("what matters for this program?") instead of predetermined forms
- Compare phase cross-references against existing data with normalized name matching
- Produces 765-line markdown report for human review
- Auto-generates `pipeline-summary.ts` for dashboard

**Phase 5 — Dashboard + Pipeline integration:**
- State cards show pipeline status (explored date, issues found)
- Program rows show inline diffs with amber warnings
- Pipeline summary auto-generated after each run

**Key pivot:** Abandoned predetermined 5-shape taxonomy. Taxonomy comes after exploration across multiple states, not before. "We need enough humility to grant this could be the beginning of the right approach."

### 2026-04-06 (Session 67) — Aging in America: Framer → Olera Web Migration

**Branch:** `thirsty-hugle` | **Merged via PRs #493-498**

- Full AIA migration: dark cinematic index + episode detail pages
- YouTube IDs confirmed, hero image, sitemap, thumbnail fallback
