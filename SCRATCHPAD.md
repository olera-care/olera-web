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
    - [x] Page component taste pass — ProgramPageV2 component built and deployed
  - **Phase 2: First Test States + Page Refinement** (in progress)
    - [x] MI draft phase run successfully (16/16 programs, $0.30)
    - [x] MI Choice Waiver applied as first v2 test program with full draft content
    - [x] V2 page live: content-forward layout, prose-width, no dark hero, no card soup
    - [x] Taste refinements: asset limits as prose, callouts merged, pre-footer hidden
    - [x] Save program to profile (auth-gated bookmark, /saved page, Supabase table)
    - [x] Draft review workflow (status, comments, history in admin dashboard)
    - [x] Preview button in admin dashboard draft view
    - [x] Slash command auto-detects approved drafts
    - [x] State-level content generation (pipeline + StatePageV2 component)
    - [x] State page preview link in admin dashboard
    - [ ] Run pipeline on FL or CA
    - [ ] Apply approved MI drafts to waiver-library.ts (batch via slash command)
    - [ ] Review draft quality with Chantel

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

1. Apply approved MI drafts to waiver-library.ts (run `/benefits-pipeline`)
2. Run pipeline on FL or CA
3. Review draft quality with Chantel
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
| 2026-04-08 | V2 page is content-forward, not card-based | Design thesis: reads like a guide from someone who cares, not a dashboard of equally-weighted cards. Typography creates hierarchy, decoration is rare and meaningful. |
| 2026-04-08 | Save program feature is auth-gated | No localStorage fallback. If user has no account, prompt sign-in. Follows existing saved providers pattern but requires auth. |
| 2026-04-08 | Review workflow lives in admin dashboard, not Slack/Notion | Status + comments on each draft keeps review context co-located with the content being reviewed. |
| 2026-04-08 | Slash command auto-detects approved drafts | Instead of per-state apply commands, Step 0 checks all states for approved drafts and offers batch apply. |
| 2026-04-08 | Pipeline generates state-level overview content | State page was a bare index with no editorial content. Pipeline now generates intro, start-here picks, need-based groupings, quick facts. |
| 2026-04-08 | State page v2 matches program page v2 design language | Same content-forward, prose-width, quiet labels. Consistent feel across the benefits experience. |
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

### 2026-04-08 (Session 70b) — V2 Page Design + Save Program Feature

**Branch:** `eager-ride` | **Latest: `09177d30`**

**ProgramPageV2 component** (`components/waiver-library/ProgramPageV2.tsx`):
- Content-forward layout: light header with serif title, no dark hero banner
- Single-column prose-width (max-w-2xl), wider for maps/tables
- Section labels as quiet uppercase markers
- Structured eligibility with income tables, asset limits as prose, functional requirements
- Application steps as flowing content with numbered circles
- Callouts merged into "Things to know" prose section
- Clean FAQ as details/summary
- No bottom CTA banner, no pre-footer (hidden via ConditionalFooter)

**Applied MI Choice Waiver** as first v2 test program with full pipeline draft content.

**Taste refinements based on TJ review:**
- Asset limits: redesigned from colored comparison boxes → natural language prose
- Stacked callout boxes → merged into single "Things to know" section
- Processing/waitlist metadata → flowing paragraph after steps
- Pre-footer hidden on all waiver-library pages

**Save program feature:**
- `hooks/use-saved-programs.tsx` — auth-gated context provider, Supabase persistence, optimistic UI
- Bookmark icon in ProgramPageV2 header — muted outline → filled teal on save
- If not logged in, opens auth modal (no localStorage fallback)
- `/saved` page updated: programs section above providers with state/type/savings
- Migration 035: `saved_programs` table with RLS

**Draft review workflow:**
- `DraftReviewPanel` component in admin dashboard draft view
- Statuses: Draft → Reviewed → Needs Changes → Approved → Published
- Comment thread with reviewer name, timestamp, history (latest 5)
- API: `/api/admin/draft-reviews` (GET/POST, auth-gated)
- Migration 036: `draft_reviews` table
- Self-review caught: API had no auth check — fixed

**Preview button** on each program's draft view — opens rendered page in new tab

**Slash command updated:** Step 0 now auto-detects approved drafts across all states. Presents "N programs approved — apply all?" before doing anything else.

**State-level content generation:**
- Pipeline draft phase now generates state overview: intro, "where to start" picks, "browse by need" groups, quick facts, resources vs benefits explanation
- `StatePageV2` component: content-forward state page matching program v2 design
- Michigan regenerated with state overview (3 start-here, 5 need groups)
- State page auto-switches to v2 when pipeline stateOverview exists
- Preview link added to admin dashboard state detail header

**Commits:** `3f6ca8a6` → `34fa0e10` → `09177d30` → `e728d7c4` → `ddfe6514` → `2c9a5988` → `f2c211e0` → `d15bfd78` → `4e658f3c` → `a3b08ba0` → `32be6219`

*Sessions 67-70 archived to `archive/SCRATCHPAD-2026-04.md`*
