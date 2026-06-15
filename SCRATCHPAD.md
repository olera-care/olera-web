# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Admin Panel 2.0 QA Fixes** (branch: `noble-yalow`) — IN PROGRESS
  - From Apr 7 meeting with Graize & Cecille
  - **Bug fixes**:
    - [x] Fix "Needs Email" counter — added status=pending filter to exclude non-actionable leads
    - [x] Restore delete-reason modal — required free-text reason field, logged in audit
  - **Claims page enhancements**:
    - [x] CSV export for provider claims — new /api/admin/providers/export endpoint + Export CSV button
    - [x] Multi-select + bulk approve/reject/delete on claims — checkboxes, bulk action bar
  - **Provider portal UX**:
    - [x] Fix auto-sign-in from lead notification emails — deferred send now uses `generateNotificationUrl` with `otk` token
    - [x] Provider engagement tracking — added `contact_revealed` event type, tracks email/phone copy clicks
    - [x] Provider unsubscribe/opt-out — `/unsubscribe/[slug]` page, API endpoint, email off-ramp link, send gating
  - **Manual (non-code)**:
    - [ ] Purchase Perplexity AI premium subscription for ops team

- **Benefits Pipeline v3** (branch: `plucky-rubin`) — SUPERSEDED BY EAGER-RIDE
  - Built rendering + prompt upgrades here, but `eager-ride` is where the pipeline actually lives
  - Vercel build passed, 4-tab pages render correctly, but this branch lost eager-ride's rate limit tuning, state overview generation, draft review workflow, v2 state page rendering
  - **Decision:** Redo this work on `eager-ride` instead. Context brief saved to `~/.claude/projects/-Users-tfalohun-Desktop-olera-web/memory/project_benefits_v3_context_brief.md`
  - **What to carry forward:** 5 new fields, few-shot exemplars, BenefitPageShell pattern (not layout.tsx), tab availability rules, pipeline modes (refine/update), null-vs-undefined lesson

- **Senior Benefits Pipeline v2** (branch: `noble-pare`) — MERGED (PR #502)

- **Aging in America** — SHIPPED (PRs #493-498 merged)

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

1. **Reopen `eager-ride` branch** — apply v3 context brief (meeting notes, editorial patterns, new fields, rendering, modes)
2. Feed it: Notion meeting transcript + `gh pr diff 523` + context brief from memory
3. MedJobs candidates detail page taste pass
4. SEO city-specific content sections
7. Merge PR #463 (user account separation)
8. Continue staging → main promotion

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-09 | BenefitPageShell component, not layout.tsx | layout.tsx at `[benefit]/` level wraps ALL child routes (checklist, forms) — causing double hero. Shell component lets each tab page opt in. |
| 2026-04-09 | Pipeline drafts stay separate from waiver-library.ts | Merge at read-time via `lib/program-data.ts`. Hand-curated always wins. Keeps 11K-line waiver-library stable and 5MB pipeline-drafts regeneratable. |
| 2026-04-09 | Tab structure adapts to program type | Benefits get 4 tabs, resources/navigators get About+Resources only. Pipeline classifies types; rendering follows. |
| 2026-04-09 | JSON null tolerance in TypeScript interfaces | JSON has no undefined — pipeline data uses null for absent arrays. All interfaces must accept `| null` for array fields. |
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

### 2026-04-09 (Session 70) — Benefits Pipeline v3: Editorial Quality + 4-Tab Rendering

**Branch:** `plucky-rubin` | **From Apr 9 meeting with Chantel (Notion: Benefits Hub Next Steps)**

**Context:** Chantel built Texas benefits pages (PR #523) with 4-tab structure and deeply editorial content. TJ's pipeline (eager-ride) had 44 states drafted. Task: extract best of Chantel's editorial quality into the pipeline framework, render through data-driven 4-tab pages.

**Data Model:**
- Extended `WaiverProgram` + `PipelineDraft` with v3 fields: `documentsNeeded`, `contacts`, `regionalApplications`, `applicationNotes`, `relatedPrograms`
- Created `lib/program-data.ts` — merge layer combining waiver-library (hand-curated) with pipeline-drafts (generated)

**4-Tab Rendering:**
- `components/waiver-library/ProgramTabs.tsx` — sticky tab nav, adapts per program type
- `components/waiver-library/BenefitPageShell.tsx` — shared hero+tabs (not layout.tsx — would break checklist/forms)
- New pages: `eligibility/page.tsx`, `apply/page.tsx`, `resources/page.tsx`
- Refactored `page.tsx` (About tab) to use enriched pipeline data

**Pipeline Upgrades:**
- Draft prompt: added 5 new field schemas + few-shot exemplars from Chantel's TX content
- Added `--mode refine` (improve weak drafts) and `--mode update` (patch changed data)
- Ported 44-state pipeline data from `eager-ride`

**Build Fixes:**
- 2 Vercel failures: JSON `null` vs TypeScript `undefined` for array fields. Fixed by adding `| null` to all array types in both `PipelineDraft` and `WaiverProgram` interfaces.

**Course Correction (Apr 10):**
- Vercel build passed, 4-tab pages render correctly on preview
- TJ realized this should have been built on `eager-ride` (where the pipeline actually lives) not `plucky-rubin`
- `eager-ride` has rate limit tuning, state overview generation, draft review workflow, v2 state page rendering — all lost when we cherry-picked files
- **Decision:** This branch is reference only. Redo on `eager-ride` with the context brief as guide.
- Saved context brief to Claude memory: `project_benefits_v3_context_brief.md`

**Key files created/modified:**
- `lib/program-data.ts` (new) — data merge layer
- `components/waiver-library/ProgramTabs.tsx` (new)
- `components/waiver-library/BenefitPageShell.tsx` (new)
- `app/waiver-library/[state]/[benefit]/{eligibility,apply,resources}/page.tsx` (new)
- `app/waiver-library/[state]/[benefit]/page.tsx` (refactored)
- `data/waiver-library.ts` (interface extended)
- `data/pipeline-drafts.ts` (interface extended + 44-state data)
- `scripts/benefits-pipeline.js` (v3 prompts + modes)
- `.claude/commands/benefits-pipeline.md` (updated)

### 2026-04-07 (Session 69) — Admin Panel 2.0 QA Fixes

**Branch:** `noble-yalow` | **From Apr 7 meeting with Graize & Cecille**

**Bug Fixes:**
- Fixed "Needs Email" counter: added `status=pending` filter to exclude non-actionable leads
- Restored delete-reason modal: required free-text reason, logged in audit trail

**Claims Page Enhancements:**
- CSV export via `/api/admin/providers/export` + Export CSV button
- Multi-select with checkboxes + bulk approve/reject/delete bar
- Bulk API endpoints: PATCH + DELETE on `/api/admin/providers`

**Provider Portal UX:**
- Fixed auto-sign-in: deferred lead emails now use `generateNotificationUrl` with `otk` token
- Added `contact_revealed` event tracking on email/phone copy buttons
- Built unsubscribe flow: `/unsubscribe/[slug]` page + API + email link + send gating

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
