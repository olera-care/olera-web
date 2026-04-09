# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`, `archive/SCRATCHPAD-2026-03.md`, and `archive/SCRATCHPAD-2026-04.md`

---

## North Star

**The benefits pipeline is a content production system, not a data quality tool.**

The pivot (Apr 8): the pipeline used to research programs and output a report for humans to act on. Now it researches, classifies, and generates the actual page content — intro paragraphs, structured eligibility, application guides, FAQs — in Olera's voice. Research and content generation are one skill, not two steps with a lossy handoff.

**Where we're headed:**
- Every state gets pipeline-generated content: a state overview page and individual program pages, each tailored to the program's type and complexity
- The admin dashboard pivots from a verification viewer to the **operational command center** for the entire benefits content operation: review drafts, leave comments, track status, preview both old and new pages, approve for publishing. The dashboard is where content quality is governed — not Slack, not Notion, not JSON files.
- The team runs `/benefits-pipeline` to process states. Approved drafts flow into the codebase automatically. Pages go live on deploy.
- Geographic entities are flexible — a program's natural scope (state, county, service area, region, city) is discovered by the pipeline, not forced into a URL hierarchy. "PACE in Harris County" and "SNAP in Texas" and "PACE in the DMV" all work.

**What's different about Olera's approach:** Most benefits sites dump government data into templates. Our pages read like a thoughtful guide written by someone who understands the program and cares whether your family gets help. The pipeline enforces this: caregiver-first voice, specific numbers with sources, honest about unknowns, no bureaucratic filler.

**Open architectural questions:**
1. **Entity model for geography** — programs need county, city, region, and service-area support. Current data model has `geographicScope` with `localEntities` but the page routing is still `/waiver-library/{state}/{program}`. Need to evolve to support sub-state entities without rigid hierarchy.
2. **State page old/new toggle in admin** — program-level has Draft/Current, state-level doesn't yet. Need parity.
3. **Batch apply workflow** — slash command detects approved drafts, but the actual "write to waiver-library.ts" step hasn't been tested at scale.
4. **Content freshness** — income limits and program rules change annually. Pipeline needs a re-verification mode, not just initial generation.

---

## Current Focus

**Benefits Pipeline v2** (branch: `eager-ride`) — the system is built, now proving it works.

### What's shipped
- 6-phase pipeline: explore → dive → compare → classify → draft → report
- Data model: programType, geographicScope, complexity, structuredEligibility, applicationGuide, contentSections, contentStatus
- Admin dashboard: summary bar, content quality indicators, draft preview with old/new toggle, review workflow (status + comments), preview buttons
- ProgramPageV2: content-forward, prose-width, serif headings, structured eligibility as prose, clean FAQs, no card soup
- StatePageV2: hand-drawn SVG illustrations, "where to start" picks, need-based groupings, quick facts, organic design language
- Save program: auth-gated bookmark, Supabase persistence, /saved page
- Michigan: 16 programs drafted + state overview generated. MI Choice applied as live v2 test.

### What's next
1. State page old/new toggle in admin dashboard
2. Apply approved MI drafts to waiver-library.ts (all 16 programs)
3. Run pipeline on FL or CA — prove the system generalizes
4. Review draft quality with Chantel
5. Evolve geographic entity model for sub-state routing

### Other active work (different branches)
- Homepage de-jank + mega menu (`gifted-rosalind`) — ready for QA
- Provider page CTA redesign (`fine-dijkstra`) — testing on Vercel
- User account separation (PR #463) — ready for merge
- Staging → main promotion — 253 commits audited, in progress
- SEO city optimization — analysis done, implementation next
- Care seeker connection flow (`helpful-euler`) — in progress
- Family activity center (`logical-mahavira`) — in progress

---

## Blocked / Needs Input

(none active)

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

## Design Language (v2 Benefits Pages)

The v2 design was approved Apr 8-9. Reuse and extend this language for all new benefits content.

**Core principles:**
- Content-forward: the page reads like a guide, not a dashboard of cards
- Typography creates hierarchy: serif headings, quiet uppercase section labels, prose-width body
- Decoration is rare and meaningful — when it exists, it adds warmth, not noise

**Visual elements (StatePageV2 — approved direction):**
- Hand-drawn SVG illustrations: organic teal blobs (#96c8c8), warm accent blobs (#e9bd91), floating circles
- Wavy divider SVG between sections (not hard lines)
- Hand-drawn underline on key heading words
- Need category icons: custom SVG vignettes (home, medical, food, advice, money, work) with teal strokes + warm accents
- "Where to start" cards: numbered picks, white bg, subtle border, hover shadow
- "Browse by need" groups: icons + linked program pills in primary-50
- Program list: clean rows with type badges, not card grid

**Program page (ProgramPageV2):**
- Light header with serif title, no dark hero banner
- Single column at max-w-2xl (readable), wider for maps/tables
- Eligibility as prose: "Assets must be under $9,950 — but not everything counts. Your parent can keep their primary residence..."
- Application steps as numbered flowing content, not equal-sized cards
- Callouts merged into "Things to know" prose (not stacked colored boxes)
- Clean FAQ as details/summary with chevron
- No bottom CTA banner — page ends when content ends
- Auth-gated bookmark icon next to title

**State page (StatePageV2):**
- Organic blob illustrations in header
- "13 programs to help your family" (not "Saving families up to $35,000")
- State-specific intro with real numbers
- "Where to start" with top 3 ranked programs
- "Good to know" quick facts
- "Browse by what you need" with custom SVG icons per category
- Resources vs benefits explanation
- All programs as clean list rows

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Benefits data: 1,145 programs across 50 states in `data/waiver-library.ts` (~11,740 lines). Only 15 (1.3%, all TX) have real content. Michigan has 16 pipeline drafts.
- Pipeline cost: ~$0.40/state (research + content generation)
- Chantel Research files: `~/Desktop/olera-hq/Senior Benefits/Chantel Research/` — TX audit CSV + accuracy docx
- Notion docs: "Benefits Pipeline v2 — Content Production System" (spec), "Benefits Hub Next Steps" (Apr 7 meeting)
- Waiver library pages auto-generate via `generateStaticParams` — adding programs = pages on deploy
- Anthropic API: key `olera-benefits-pipeline` in Olera org, $15 credits. Key in `~/Desktop/olera-web/.env.local`
- Supabase tables added: `saved_programs` (035), `draft_reviews` (036)

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
