# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Benefits Pipeline v2: Content Production System** (branch: `eager-ride`) — IN PROGRESS
  - Evolving pipeline from research/QA tool → full content production system
  - Five-phase lifecycle: Identify → Research → Classify → Draft → Review
  - See Notion doc for full spec: "Benefits Pipeline v2 — Content Production System"
  - **Phase 1: Foundation** — COMPLETE (`d8baefec`)
    - [x] Data model evolution (programType, geographicScope, complexity, contentSections, contentStatus)
    - [x] Classify phase — tested on MI: 11 benefit, 2 resource, 2 navigator, 1 employment
    - [x] Draft phase — 16/16 MI programs drafted via Claude API, zero errors
    - [x] Admin dashboard summary bar (4 metric cards, state readiness color-coding)
    - [x] Admin dashboard draft preview (DraftPreview component, Draft/Current toggle per program)
    - [x] Auto-generated `pipeline-drafts.ts` for dashboard import
    - [x] Slash command updated for 6-phase lifecycle
    - [x] Self-review: 4 bugs found and fixed (classify misclassification, prompt bloat, token limits, JSON template)
    - [x] Build fix: LLM extra fields in income table rows stripped by generator
    - [ ] Page component taste pass (shape variants, typography, spacing, tone) — NEXT SESSION
  - **Phase 2: First Test States** (next)
    - [x] MI draft phase run successfully (16/16 programs, $0.30)
    - [ ] Run pipeline on FL or CA
    - [ ] Review draft quality with Chantel
    - [ ] Page taste pass using draft output

- **Admin Panel 2.0 QA Fixes** (branch: `noble-yalow`) — MERGED (PR #509)
  - All code items complete. Only remaining: purchase Perplexity AI premium (non-code)

- **Senior Benefits Pipeline** (branch: `noble-pare`) — MERGED (PR #502)

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

1. **Benefits Pipeline v2** — page component taste pass (shape variants per programType)
2. Review MI draft quality in dashboard, iterate on content voice
3. Run pipeline on FL or CA
4. Seed TX: `/api/admin/seed-sbf-programs?state=TX&confirm=true`
4. MedJobs candidates detail page taste pass
5. SEO city-specific content sections
6. Merge PR #463 (user account separation)
7. Continue staging → main promotion

---

## Decisions Made

| Date | Decision | Rationale |
| 2026-04-08 | Pipeline evolves from research tool → content production system | Pipeline already "understands" programs after dive phase but throws understanding away by outputting a report. Content generation and research are one skill, not two separate steps. |
| 2026-04-08 | Four program types: benefit, resource, navigator, employment | Derived from 28 real programs across TX (Chantel audit) and MI (pipeline). Chantel flagged resource vs benefit distinction explicitly. Navigator is meta-programs like MiCAFE. |
| 2026-04-08 | Geographic scope is a property of the program, not the URL | PACE = service areas, SNAP = statewide, Respite = 14 TX counties. Can't force rigid state→city hierarchy. Pipeline discovers scope. |
| 2026-04-08 | Backwards compatibility via option C (gradual migration) | 1,145 existing programs stay in flat format. New pipeline runs produce rich content. Migration happens state-by-state as pipeline processes them. |
| 2026-04-08 | Content voice follows TJ's writing principles | Lead with caregiver need, specific numbers with sources, causal chains, inline jargon clarification, decisive next steps. Extracted from TJ-hq docs. |
| 2026-04-08 | Admin dashboard gets summary bar + content quality indicators | TJ had no visibility into 1,145 programs (98.7% template scaffolding). Dashboard becomes operational command center for benefits content operation. |
| 2026-04-08 | Draft preview in dashboard, not separate tool | TJ: "The draft should be viewable from the admin dashboard; that's the UI/UX-friendly approach." Chantel won't read JSON files. |
| 2026-04-08 | Anthropic API key set up for pipeline draft phase | Key `olera-benefits-pipeline` in Olera org, Default workspace. $15 credits added. Key in `~/Desktop/olera-web/.env.local`. |
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
- Benefits data: 1,145 programs across 50 states in `data/waiver-library.ts` (~11,740 lines). Only 15 (1.3%, all TX) have real content.
- Chantel Research files: `~/Desktop/olera-hq/Senior Benefits/Chantel Research/` — TX audit CSV + accuracy docx
- Notion strategy docs: "Benefits: Turning Traffic into Platform Users" + "Benefits Data: Getting It Right Before We Scale"
- Waiver library pages auto-generate via `generateStaticParams` — adding programs = pages on deploy
- Texas has special SEO routes at `/texas/benefits/`, other states at `/waiver-library/{state}/`
- Pipeline reference: `scripts/pipeline-batch.js` (city pipeline, 1322 lines)
- Michigan pipeline findings: PACE age wrong (65→55), SNAP age wrong (65→60), Ombudsman has fake savings, 4 source URLs missing, 5 data fields model can't capture (asset_limits, regional_variations, waitlist, documents_required, household_size_table)

---

## Session Log

### 2026-04-08 (Session 70) — Benefits Pipeline v2: Content Production System Design

**Branch:** `eager-ride` | **Committed `bcb1d116`, pushed to origin**

**Deep review completed:**
- Pipeline script (`scripts/benefits-pipeline.js`, 1145 lines) — all 4 phases
- Slash command (`.claude/commands/benefits-pipeline.md`, 253 lines)
- Admin dashboard (`app/admin/benefits/page.tsx`, 553 lines)
- Data model (`WaiverProgram` type + `waiver-library.ts`, 11,740 lines)
- Michigan pipeline output (explore.json, dive.json, compare.json, exploration_report.md)
- Chantel's TX audit CSV (12 programs) + Benefits Hub Accuracy Analysis docx
- April 7 meeting notes (Chantel + Logan): "Benefits Hub Next Steps & Olera Growth Plan"
- TJ-hq writing style docs (Renora, Oculo, investment thesis, tj-voice.md)

**Key findings:**
- 1,145 programs across 50 states (more than expected)
- Only 15 (1.3%) have real content (intros, FAQs, verification) — all Texas
- 1,131 programs are template scaffolding with generic application steps
- Pipeline discovers rich data (income tables, asset limits, county offices, wait times) but outputs a report, not page content

**Built and committed:**
- Data model: `WaiverProgram` extended with 13 new optional types (programType, geographicScope, complexity, applicationGuide, structuredEligibility, contentSections, contentStatus, etc.)
- Classify phase: local processing, tested on MI — 9 benefit, 4 resource, 2 navigator, 1 employment
- Draft phase: Claude API content generation with TJ voice principles as hard constraints
- Admin dashboard: summary bar (4 metric cards), state cards with readiness color-coding + content depth
- Slash command: full 6-phase lifecycle documentation
- Pipeline summary: auto-generates classify + draft metadata for dashboard
- TypeScript compiles clean. Pre-existing Next.js prerender errors (InvariantError) unrelated.

**Files modified:** `data/waiver-library.ts`, `scripts/benefits-pipeline.js` (+524 lines), `app/admin/benefits/page.tsx`, `data/pipeline-summary.ts`, `.claude/commands/benefits-pipeline.md`, `SCRATCHPAD.md`
**Files created:** `data/pipeline/MI/classify.json`

**Notion doc created:** "Benefits Pipeline v2 — Content Production System" for team visibility
**Memory saved:** `project_benefits_pipeline_v2.md`

**Testing & debugging (continued same session):**
- Set up Anthropic API: created key `olera-benefits-pipeline` in Olera org, $15 credits
- Ran draft phase on MI: 16/16 programs drafted, 0 errors, ~9 min runtime
- Self-review caught 4 bugs before TJ tested: Weatherization misclassified, prompt bloat from `_raw`, token limit too low, JSON template issues
- Build error: LLM added `"program"` field to income table rows — fixed by stripping extra fields in generator
- Built DraftPreview component for admin dashboard: renders full draft content (intro, structured eligibility with income tables + asset limits, application guide, content sections, FAQs)
- Draft/Current toggle on each program row
- Auto-generated `pipeline-drafts.ts` (like pipeline-summary.ts) for dashboard import

**Commits:** `bcb1d116` → `c197fb54` → `27da06e0` → `e6308ece` → `d8baefec` (5 commits)
**Files created:** `data/pipeline-drafts.ts`, `data/pipeline/MI/drafts.json`, `data/pipeline/MI/classify.json`
**Files modified:** `data/waiver-library.ts`, `scripts/benefits-pipeline.js`, `app/admin/benefits/page.tsx`, `data/pipeline-summary.ts`, `.claude/commands/benefits-pipeline.md`, `SCRATCHPAD.md`

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

*Sessions 67-68 archived to `archive/SCRATCHPAD-2026-04.md`*
