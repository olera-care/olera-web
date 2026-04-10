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
1. **Batch apply workflow** — slash command detects approved drafts, but the actual "write to waiver-library.ts" step hasn't been tested at scale.
2. **Content freshness** — income limits and program rules change annually. Pipeline needs a re-verification mode, not just initial generation.

---

## Current Focus

**Benefits Pipeline v3** (branch: `eager-ride`) — tabbed program pages + Chantel-depth content + layout intent.

### What's shipped (v3 — Session 72, Apr 10)
- **ProgramPageV3** (`components/waiver-library/ProgramPageV3.tsx`): 4-tab structure (About / Eligibility / How to Apply / Resources) with "painting outside the lines" design language
- **Tab availability adapts to program type**: deep benefits get 4 tabs, resources/navigators get a one-pager, simple benefits get 3 tabs
- **Tabs use CSS hidden/shown** (not conditional render) so interactive state (document checklist) survives tab switches
- **Reusable component vocabulary**: IncomeTable (with row highlighting), AssetLimitsDisplay, DocumentChecklist (interactive with progress bar), StepJourney (visual with connecting line), ContactCards (null-safe for phone), StatCallout (dark band), ApplicationNotes (amber callouts), FaqSection
- **FAQs only on About tab** — not duplicated across all 4 tabs
- **Width variation within tabs**: prose at max-w-2xl, tools (income table, checklist) at max-w-3xl, maps at max-w-5xl — same principle as state pages
- **Organic SVG elements on program pages**: HeaderAccent (softer than state page blobs), WavyDividers between sections
- **Resource one-pager**: prominent phone CTA, no tabs, warm design
- **Program data merge layer** (`lib/program-data.ts`): combines waiver-library base data with pipeline draft content. Hand-curated always wins. Pipeline programs now render through V3 automatically. SEO metadata also uses enriched data.
- **5 new schema fields**: `documentsNeeded`, `contacts`, `applicationNotes`, `relatedPrograms`, `regionalApplications` — on both `WaiverProgram` and `PipelineDraft`
- **Layout intent**: pipeline decides which visual components best serve each program (`layoutIntent.aboutHighlight`, `eligibilityDisplay`, `applyDisplay`, `hasDocumentChecklist`, `hasLocationFinder`, `visualTone`)
- **Pipeline v3 prompt** (`scripts/benefits-pipeline.js`): few-shot exemplars from Chantel's Texas content, "never cite Olera" constraint, component menu for Claude to select from, higher token limits (8K deep, 6K medium, 4K simple), FAQ minimums by complexity
- **Pipeline v3 validated**: SD Medicaid drafted successfully with all new fields populated (documentsNeeded, contacts, applicationNotes, relatedPrograms, layoutIntent). Remaining 15 SD programs hit API overload (529).
- **Admin program-level preview links**: each ProgramRow shows "Preview v2" (eye icon) or "Preview current" + "No v2" label on top right
- **Admin state detail taste pass**: state overview collapsed by default, header condensed to one line (back + name + counts + previews), pipeline summary box killed, progress bar killed, binary toggle replaced with disclosure
- **48-state batch** committed (225K lines). 44/46 batch succeeded, KY+SD pending retry.

**Self-review bug sweep (6 bugs caught and fixed before TJ tested):**
1. CRASH: ContactCards called `.replace()` on null phone from pipeline
2. DUPLICATE: Same FAQs rendered on all 4 tabs
3. DUPLICATE: Savings shown twice on About tab (stat callout + text)
4. STATE LOSS: Document checklist reset on tab switch (component unmounted)
5. MISSING DATA: ServiceAreasMap got `stateId=""` instead of `state.id`
6. SEO: `generateMetadata` used scaffold data instead of enriched pipeline data

### What's shipped (continued, later in session 72)
- **Texas v3 pipeline run**: 12/12 programs drafted with v3 quality + state overview. STAR+PLUS: 14 documents, 8 FAQs, 4 app notes, 2 contacts, layoutIntent=waitlist.
- **Program `/current` route**: `/waiver-library/{state}/{benefit}/current` renders legacy page with amber "Legacy view" banner. Noindex. Admin links fixed: "Preview current" → `/current`, "Preview v2" → main URL.
- **Related Articles section** in ProgramPageV3: optional prop, renders article cards with cover images. Texas articles will show automatically.
- **Admin dashboard taste pass**: state overview collapsed by default, header condensed to single line, pipeline summary box killed, progress bar killed, binary toggle → disclosure.
- **contacts.phone made optional** across all interfaces — pipeline returns null for online-only contacts (e.g., Meals on Wheels finder).
- **Generator script interface synced** — v3 fields in the pipeline's interface template so regeneration doesn't revert schema changes.

### What's shipped (v2 — from previous sessions)
- 6-phase pipeline: explore → dive → compare → classify → draft → report
- Concurrent pipeline, batch runner, region-flexible pipeline
- Admin dashboard: content production command center
- StatePageV2: hand-drawn SVGs, organic blobs, wavy dividers, dark stat band
- Save program, state page review workflow
- Michigan: 16 programs drafted + state overview. MI Choice as live test.
- All 50 states + DC explored and researched

### What's next
1. **State page v3 redesign** — evolve from editorial article to discovery platform. Archetype-based entry ("What brought you here?"), interactive tools (benefits finder mini-intake, spend-down calculator links), provider cross-link section (3-4 featured), social proof (real questions from families), save buttons on cards. Inspired by TripAdvisor/GetYourGuide discovery pages but with Olera's editorial warmth — not a visual travel page, not a 2015 content wall. Something in between that transcends both.
2. **Program page v3 iteration** — after state page is nailed, evolve program pages. Component vocabulary exists (tabs, checklist, step journey). Needs: deeper interactive elements (calculators, maps), Chantel-depth content via v3 pipeline.
3. **Re-run v3 pipeline on all states** — SD + TX validated. Full batch for v3-quality content with new fields.
4. Apply approved MI drafts
5. Review draft quality with Chantel

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
| 2026-04-10 | State page evolves from article to discovery platform | Current page is a well-designed article but fundamentally passive. The TripAdvisor/GetYourGuide model (category entry, visual cards, curated picks, interactive tools, social proof) applied to senior benefits — but NOT visual-heavy like travel. Olera's version: editorial warmth meets interactive purpose. "Something in between that transcends both." |
| 2026-04-10 | Archetype-based entry is always visible | 3-4 situation cards ("My parent needs help at home", "We're going broke on facility costs", etc.) that filter/reorder the page. Not a quiz or flow — a gentle "What brought you here?" Like Airbnb's category bar. Always present, not a one-time orientation. |
| 2026-04-10 | State pages first, then program pages | State page is the entry point — the discovery layer. Once that's nailed, program page improvements follow naturally. The program page component vocabulary is already built. |
| 2026-04-10 | Cross-link providers after programs, not inline | Dedicated section with 3-4 featured provider cards after the program list + contextual mentions. "MI Choice pays for home care. [Browse providers who accept Medicaid →]" Not forced, answers a question the person already has. |
| 2026-04-10 | Bad examples: Caring.com, PayingForSeniorCare, SGMays | Content walls, H2 after H2, no interactivity, no visual variety, government pamphlet feel. Good examples: TripAdvisor, GetYourGuide, Expedia — discovery platforms with category entry, visual cards, curated picks, social proof, interactive tools. |
| 2026-04-10 | URL migration: `/waiver-library/*` → `/senior-benefits/*` | "Waiver library" is internal jargon no caregiver searches for. "/senior-benefits/texas" matches high-volume queries ("senior benefits in Texas"), signals topic to Google, differentiates from generic "/benefits" (employee, VA). Breadcrumbs render as `olera.care > senior-benefits > texas > program`. 301 redirects from old URLs preserve existing rankings. |
| 2026-04-10 | Program pages get "painting outside the lines" design — not just editorial | TJ: program pages should have the same design energy as state pages. Current ProgramPageV2 was editorially solid but visually flat. V3 adds HeaderAccent SVGs, WavyDividers, StatCallout dark band, width variation within tabs. |
| 2026-04-10 | Design first, pipeline second | Design the component vocabulary using STAR+PLUS as reference specimen, then upgrade pipeline prompt to produce content that fills those shapes. Avoids guessing what the design needs. |
| 2026-04-10 | Take Chantel's content patterns, not her UI patterns | Chantel's 4-tab structure, document checklists, decision-grade FAQs, contacts = keep. Her container-soup card-based design = don't keep. Our design language renders her content depth. |
| 2026-04-10 | Pipeline decides visual components (layoutIntent) | During research, Claude selects which components best serve each program from a menu (income table, checklist, map, stat callout, etc.). Programs with regional offices get a map; hotlines get a phone CTA. Not a uniform template. |
| 2026-04-10 | Tabs rendered with CSS hidden, not conditional unmount | Interactive state (document checklist progress) must survive tab switches. User checks 10 documents, looks at eligibility, comes back — checklist intact. |
| 2026-04-10 | Admin state overview starts collapsed | The state overview pushed programs below the fold. Programs are what you came to manage. Overview is reference material, one click away. |
| 2026-04-09 | Region-flexible pipeline: flat slug routing at `/benefits/{slug}` | State-level hierarchy too rigid. PACE operates in service areas, DMV spans 3 states, Miami-Dade has county-specific programs. Pipeline should research any geographic entity. Option A (flat slugs) chosen — "michigan" and "miami-dade-fl" are peers, no nesting. |
| 2026-04-09 | Admin dashboard: verification → content production | Review workflow is the new quality gate, not verification dots. Killed inferCategory heuristic, replaced with pipeline programType. Filters now readiness-based (Published/Drafted/Explored/Scaffolding). |
| 2026-04-09 | StatePageV2 "painting outside the lines" design approved | Hand-drawn SVG illustrations, wavy dividers, dark stat band, width variation between sections. Inspired by Wispr Flow (character, bold moments) + Perena (atmospheric warmth). Visual elements are scanning aids, not decoration. |
| 2026-04-09 | State page version toggle via `/current` sub-route, NOT query params | Admin needs to compare old vs new. Initially used `?v=1` but self-review caught that `searchParams` makes pages dynamic (ƒ) instead of static (●) — 50+ pages lost CDN caching. Replaced with `/waiver-library/{state}/current` route (static, noindex). |
| 2026-04-09 | Reviewer name persisted in localStorage | Chantel shouldn't type her name 16 times. Small friction, big annoyance. |
| 2026-04-09 | Ship breadth first, iterate depth | Don't perfect one state before touching the next. Run pipeline on all 50 states with v1 drafts, then iteratively improve. Review workflow supports this — nothing goes live without approval. A decent draft across 50 > a perfect draft for 1. |
| 2026-04-09 | Parallelize pipeline: 5x dive, 3x draft, parallel explore | Per-state drops from ~4min to ~1.5min. Separate rate limiters per API. 50 states × 3 concurrent ≈ 25min total. |
| 2026-04-09 | Admin dashboard needs active/backlog split | UI critique: 48 identical gray "Template only" cards drown the 2 states with real data. Promote active states, compress scaffolding. Single status line beats 3 metric boxes. |
| 2026-04-09 | Draft phase must be sequential — Claude API rate limit | 8K output tokens/min on Tier 1 key. Concurrency of 3 caused 85% failure (429s). Sequential + retry = 100% success at ~8 min/state. Speed < reliability. |
|------|----------|-----------|
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
| 2026-04-06 | Verification gate: no state goes live without verification | YMYL content — Google can suppress the whole domain for inaccurate benefits info. |

*Older decisions archived to `archive/SCRATCHPAD-2026-04.md` and `archive/SCRATCHPAD-2026-03.md`*

---

## Design Language (v2 Benefits Pages)

The v2 design was approved Apr 8-9. Two complementary treatments that share core principles but differ in visual expression.

**Design inspirations:** Wispr Flow (character, illustrations as context, bold scale shifts, one dark moment), Perena (soft atmospheric warmth, organic shapes), Airbnb (clean hierarchy, trust), Claude (calm confidence, whitespace). The goal is a page that feels like someone cared — not a template, not a UI kit demo, not AI-generated.

### Shared Principles
- **Content-forward**: pages read like guides, not dashboards of equally-weighted cards
- **Typography creates hierarchy**: serif headings (font-serif, display scale), quiet uppercase section labels (`text-[11px] tracking-[0.1em]`), prose-width body
- **Light backgrounds** (vanilla-100), no dark hero banners (except the one intentional dark moment on state pages)
- **Decoration is rare and meaningful** — every visual element is a scanning aid, not decoration. People skim; illustrations, dividers, and layout shifts give the eye reasons to stop.
- **No bottom CTA banners** — pages end when content ends

### State Page — "Painting Outside the Lines"

The discovery layer. The problem it solves: a long page of text is intimidating. People don't read — they scan. The state page uses **visual rhythm** to make scanning productive: illustrations, width variation, a dark band, and layout shifts ensure no two sections look the same. Scrolling feels like progression, not repetition.

**The spirit:** character, spunk, warmth. Wispr Flow's playfulness — hand-drawn shapes, organic paths, small floating dots that say "a human designed this." Not rigid, not geometric, not pixel-perfect. Confident imperfection.

**Rhythm through width variation** (this IS "painting outside the lines"):
- `max-w-3xl` — header with blobs floating right
- `max-w-2xl` — intro prose (readable, focused)
- `max-w-4xl` — "Where to start" 3-column card grid (spatial prominence for editorial picks)
- Full-width — dark stat band (the scroll-stopping moment)
- `max-w-3xl` — "Browse by need" cards with SVG icons
- `max-w-2xl` — grouped program list (back to focused reading)

The page deliberately breaks its own max-width between sections. The width change IS the visual interest.

**Visual elements:**
- **Organic blob illustrations** in header: teal (#96c8c8) + warm amber (#e9bd91) blobs with floating circles/dots. Positioned absolutely, ~12% opacity. Atmospheric, not literal — like Perena's soft photographic presence but built from SVG code.
- **Hand-drawn underline** on the state name in the headline — organic SVG path, teal, slightly imperfect.
- **Wavy dividers** between major zones — organic SVG stroke, not straight lines or empty space. Signals "new chapter."
- **Need category vignettes**: custom hand-drawn SVG icons per need (house, pill, apple, speech bubble, coin, briefcase). Teal strokes (#417272) with small warm accent dots (#e9bd91). Not Lucide's pixel-perfect lines — softer, rounder, slightly imperfect.
- **Dark stat band** (`bg-gray-900`): big serif numbers (program count, top savings, benefit count, free resources count) in white. The "one bold moment" — inspired by Wispr Flow's dark "Flow Pro" screen. Full-width break that resets the eye and signals the transition from curated editorial to full directory. Also absorbs the resources-vs-benefits explanation (killed the old blue callout box).

**Sections in order:**
1. Header — large serif headline (`display-md`/`display-lg`), hand-drawn underline, floating blobs, "{N} programs to help your family"
2. Intro — prose paragraph with real numbers and caregiver-first voice
3. Wavy divider
4. "Where to start" — 3 numbered cards in horizontal grid, `bg-vanilla-200` circles (not black), hover reveals "Learn more"
5. "Good to know" — quick facts as quiet bulleted prose
6. Dark stat band — big numbers on `bg-gray-900`, resources-vs-benefits as muted text
7. "Browse by what you need" — white cards with SVG vignettes + program pill links
8. Wavy divider
9. All programs — **grouped by type** (Benefits ✦ / Resources ◇ / Navigators ↗ / Employment ◆), each group in a white card surface with count. "Show all" per group.

### Program Page — "The Editorial"

The deep dive. Restrained, lets content breathe. Reads like a well-researched article. Where the state page has personality, the program page has authority.

- **No illustrations** — the content IS the page. The restraint is intentional.
- **Serif title** (text-3xl/4xl) with type + scope badges and bookmark icon
- **Savings as quiet text** (not a big green badge): "Estimated savings: $10,000–$30,000/year"
- **Eligibility as natural language prose**: "Assets must be under $9,950 — but not everything counts. Your parent can keep their primary residence, one vehicle, and personal belongings."
- **Application steps** as numbered flowing content — each step gets the space it needs
- **"Things to know"** section: merged callouts as prose paragraphs, not stacked colored boxes
- **FAQ** as clean details/summary with chevron — no teal-tinted cards
- **Source + contact** as quiet links at the end
- **Wider containers** (max-w-5xl) only for maps and service area grids

### Extending the Language
- The state page style ("painting outside the lines") should evolve to program pages where appropriate — e.g., a "benefit" program could get a subtle illustration element, while a "resource" page stays purely editorial
- County, region, and city pages (when built) should inherit the state page's warmth since they're also discovery/orientation pages — they're discovery surfaces, not deep dives
- The admin dashboard stays functional — no illustrations there, just clean data
- New visual elements should follow the same material: organic SVG paths, teal + warm amber palette, slight imperfection, always functional (aids scanning) never purely decorative

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Benefits data: 1,145 programs across 50 states in `data/waiver-library.ts` (~11,740 lines). Only 15 (1.3%, all TX) have real content. 48 states now have pipeline-drafted content in `pipeline-drafts.ts` (~87K lines). V3 prompt produces richer content (documents, contacts, layout intent).
- Pipeline cost: ~$0.40/state. 50-state batch: ~$20. Time: ~8 min/state sequential (rate-limited by 8K output tokens/min on Anthropic Tier 1). Dive is parallelized (5x), draft is sequential with 429 retry.
- Chantel Research files: `~/Desktop/olera-hq/Senior Benefits/Chantel Research/` — TX audit CSV + accuracy docx
- Notion docs: "Benefits Pipeline v2 — Content Production System" (spec), "Benefits Hub Next Steps" (Apr 7 meeting)
- Waiver library pages auto-generate via `generateStaticParams` — adding programs = pages on deploy
- Anthropic API: key `olera-benefits-pipeline` in Olera org, $15 credits. Key in `~/Desktop/olera-web/.env.local`
- Supabase tables added: `saved_programs` (035), `draft_reviews` (036)

---

## Session Log

### 2026-04-10 (Session 72) — ProgramPageV3 + Pipeline v3 + Admin UX

**Branch:** `eager-ride` | **Latest: `8d68ec02`**

**Context gathering:** Read Chantel meeting transcript (Notion), PR #523 diff (660KB), context brief. Aligned with TJ on key distinction: take Chantel's content patterns (4-tab, document checklists, decision FAQs, contacts), keep our design language (painting outside the lines, organic SVGs, editorial feel, Claude latitude for page structure).

**ProgramPageV3** (`components/waiver-library/ProgramPageV3.tsx` — 1,200 lines):
- 4-tab system: About / Eligibility / How to Apply / Resources
- Tab availability adapts: deep=4 tabs, simple=3 tabs, resource/navigator=one-pager
- Tabs rendered with CSS `hidden` (not conditional) to preserve interactive state
- Reusable components: IncomeTable, AssetLimitsDisplay, DocumentChecklist (interactive + progress bar), StepJourney (visual connecting line), ContactCards, StatCallout (dark band), ApplicationNotes, FaqSection
- Width variation within tabs: 2xl prose → 3xl tools → 5xl maps
- Organic HeaderAccent SVG, WavyDividers between sections
- ResourceOnePager variant: prominent phone CTA, warm design, no tabs
- FAQs only on About tab (not duplicated across all 4)
- Savings shown once (stat callout OR text, not both)

**Program data merge layer** (`lib/program-data.ts`):
- `getEnrichedProgram(stateId, programId)` merges waiver-library + pipeline drafts
- Hand-curated fields always win over pipeline-generated
- Normalized fuzzy ID matching for pipeline draft lookups
- State slug → abbreviation map (all 50 + DC)
- Used by both page render AND metadata generation (SEO fix)

**Schema update** (`data/waiver-library.ts`, `data/pipeline-drafts.ts`):
- 5 new fields: `documentsNeeded`, `contacts`, `applicationNotes`, `relatedPrograms`, `regionalApplications`
- `layoutIntent` field: `aboutHighlight`, `eligibilityDisplay`, `applyDisplay`, `hasLocationFinder`, `hasDocumentChecklist`, `visualTone`

**Pipeline v3 prompt** (`scripts/benefits-pipeline.js`):
- Few-shot exemplars from Chantel's Texas content (MEPD 15-item document list, CEAP 6-item list, decision-grade FAQ examples, contact card examples, application note examples)
- "Never cite Olera" constraint (circular AI sourcing)
- Component menu: Claude selects visual components per program
- Higher token limits: 8K deep, 6K medium, 4K simple (was 6K/4K/3K)
- FAQ minimums: 6+ deep, 4+ medium, 2+ simple
- Validated: SD Medicaid drafted with all v3 fields. API overload (529) blocked remaining.

**Admin dashboard** (`app/admin/benefits/page.tsx`):
- Program rows: preview links on top right ("Preview v2" with eye icon, or "Preview current" + "No v2")
- State detail taste pass: overview collapsed by default, header condensed to one line, pipeline summary box killed, progress bar killed, binary toggle → disclosure pattern

**Self-review bug sweep (6 bugs caught before TJ tested):**
1. CRASH: ContactCards `.replace()` on null phone
2. DUPLICATE: FAQs on all 4 tabs
3. DUPLICATE: Savings shown twice on About
4. STATE LOSS: Checklist reset on tab switch
5. MISSING DATA: ServiceAreasMap got empty stateId
6. SEO: generateMetadata used scaffold data

**URL migration** (`/waiver-library/*` → `/senior-benefits/*`):
- Route dir: `app/waiver-library` → `app/senior-benefits`
- 177 URL string replacements across 37 files, import paths preserved
- 301 redirects in next.config.ts for all old URL patterns
- Slash command docs updated
- 31 files changed total

**Texas v3 pipeline**: 12/12 programs drafted + state overview. STAR+PLUS: 14 docs, 8 FAQs, 4 app notes, layoutIntent=waitlist.

**Program `/current` route**: `app/senior-benefits/[state]/[benefit]/current/page.tsx` — legacy page with amber banner.

**Admin fixes**: Preview current → `/current` URL, Preview v2 → main URL. State detail taste pass (overview collapsed, compact header).

**State page v3 design direction** (discussion, not code):
- Deep repo exploration: 39K providers (state-filterable), benefits finder (ZIP+age+income intake), spend-down calculator, saved programs, Q&A system (76 questions/day), articles, care seeker profiles
- Design references studied: Good = TripAdvisor/GetYourGuide/Expedia (discovery platforms). Bad = Caring.com/PayingForSeniorCare/SGMays (content walls).
- Key insight: state page should be a discovery platform, not an article. Archetype-based entry, interactive tools, provider cross-links, social proof, save buttons. But not visual-heavy like travel — editorial warmth meets interactive purpose.
- TJ: "transcend what I've said, think outside the box"

**Build:** Clean (tsc --noEmit passes). Pushed to Vercel.

**Commits:** `3a3bd30c` → ... → `61c11d5f` → `d21b5a94` → `0fb5f0ac`

---

### 2026-04-09 (Session 71) — State Page Redesign + Dashboard Streamlining + Region System

**Branch:** `eager-ride` | **Latest: `ff26b594`**

**StatePageV2 redesign** (`components/waiver-library/StatePageV2.tsx`):
- Full rewrite with hand-drawn SVG illustrations (organic teal + amber blobs in header, floating circles/dots)
- Hand-drawn underline accent on state name in headline
- Wavy SVG dividers between major sections
- "Where to start" as 3-column horizontal card grid (was stacked list)
- Dark stat band (`bg-gray-900`) with big serif numbers — the bold moment
- "Browse by need" with custom SVG vignettes per category (house, pill, apple, speech bubble, coin, briefcase)
- Program list grouped by type (Benefits ✦ / Resources ◇ / Navigators ↗ / Employment ◆) in white card surfaces
- Width variation between sections: `max-w-3xl` → `max-w-2xl` → `max-w-4xl` → full-width → `max-w-3xl` → `max-w-2xl`
- Blue callout box killed — resources-vs-benefits folded into dark stat band
- Design inspirations: Wispr Flow (character, illustration as context, one dark moment), Perena (atmospheric warmth)

**State page review workflow:**
- `/waiver-library/{state}/current` route renders legacy page (static, noindex) — NOT `?v=1` (that broke SSG)
- Dual preview links in admin: "Preview v2" + "Preview current"
- `DraftReviewPanel` on state overview with `programId: "state-overview"`
- Draft State Overview / Programs Only toggle in admin state detail
- Slash command updated: Step 0 checks state overview approval, Step 3 includes state page verification

**Admin dashboard streamlining** (`app/admin/benefits/page.tsx`):
- Filter pills: Verified/Partial/Unverified → Published/Drafted/Explored/Scaffolding (readiness-based)
- Summary bar: verification metrics → Pipeline Coverage (X/50), Drafts Generated, State Readiness
- Title: "Benefits Data" → "Benefits Content"
- Killed `inferCategory` heuristic, replaced with pipeline `programType`
- Killed `VerificationDot`, `CategoryBadge`, `CATEGORY_COLORS`
- Added `TypeBadge` with pipeline type colors (benefit/resource/navigator/employment)
- Program rows simplified: 6 signals → 3 (type badge + review status + savings)
- Reviewer name persisted in `localStorage` — type once, auto-populated everywhere
- Review API fetch lifted to `StateDetail` level — one call per state, passed down to all DraftReviewPanels
- `DraftReviewPanel` now accepts `allReviews` + `onReviewAdded` props for lifted fetch pattern
- Regions section below state grid (visible when regions exist)

**Region-flexible pipeline** (all 4 layers built):
- Layer 1 (`scripts/benefits-pipeline.js`): `--region` + `--parent-state` flags. `resolveEntity()` normalizes both into unified entity. Explore queries adapt (federal+state-unique for states, general+local for regions). All 6 phases accept entity object. Tested: `--state MI` and `--region "Miami-Dade County, FL" --parent-state FL` both work.
- Layer 2 (`data/pipeline-drafts.ts`): `PipelineStateDrafts` gains regionName, parentState, slug, isRegion. `generatePipelineDrafts()` scans all dirs (not just `[A-Z]{2}`). States keyed by code, regions by slug.
- Layer 3 (`app/benefits/[slug]/page.tsx`): Flat route — "michigan" and "miami-dade-county-fl" are peers. Resolves slug → state or region. Regions build synthetic state object from draft data for StatePageV2.
- Layer 4 (`app/admin/benefits/page.tsx`): Regions grid below states. Click into region → overview preview + review panel + program list.

**Bugs caught in self-review (4 fixed):**
1. `phaseReport` wrote to parent state dir instead of region dir (stateCode → dirName)
2. Report template referenced undefined `stateCode` variable (would crash on region runs)
3. Admin: clicking state didn't clear selectedRegion (both selected simultaneously)
4. **`searchParams` made ALL state pages dynamic** — reading `?v=1` turned 50+ pages from SSG (●) to dynamic (ƒ). Replaced with `/current` sub-route. Pages back to static.

**Known limitations:**
- Region program links in StatePageV2 will 404 (no individual program pages for regions yet)
- Region programs in admin are display-only (no expandable ProgramRow)

**Pipeline concurrency + batch runner:**
- `runConcurrent()` utility: batched async executor with concurrency limit
- Explore: 2 Perplexity queries run via `Promise.all` (was sequential)
- Dive: 5 concurrent workers via `runConcurrent` (was 1-at-a-time for loop)
- Draft: 3 concurrent workers (lower than dive — Claude rate limits are tighter)
- Separate `perplexityLimiter` (200ms) and `claudeLimiter` (300ms) instead of shared
- Batch runner (`scripts/benefits-batch.js`): spawns child processes, 3 concurrent states, auto-skips existing drafts, shows live progress, gives retry command for failures

**50-state batch run:**
- First run: 49/50 failed — `stateCode is not defined` in phaseDive return value (missed during entity refactor). Explore phase succeeded for all states.
- Fixed: `state: stateCode` → `state: entity.stateCode` in dive return object
- Second run: in progress, resuming from dive phase (explore data cached)

**Admin dashboard UI critique** (analysis done, build next):
- Top 5 template smells: equal-weight card grid, 0% progress bars, "Template only" ×48, disconnected metric boxes, no visual hierarchy
- Design thesis: command center not warehouse — promote active, compress backlog
- 8 surgical edits: active/backlog split, single status line, kill scaffolding progress bars, richer active cards, denser scaffolding grid, serif title, better readiness bar

**Bugs caught:** 5 total this session
1. phaseReport wrote to wrong dir for regions (stateCode → dirName)
2. Report template referenced undefined stateCode (ReferenceError)
3. Admin state/region selection collision
4. searchParams made state pages dynamic (SSG regression) — replaced with /current route
5. phaseDive return referenced undefined stateCode (crashed all 49 batch states)

**50-state batch run:**
- First run: 49/50 failed — phaseDive `stateCode` undefined (bug #5). Explore succeeded for all 50.
- Fixed, second run: 47/50 succeeded in 19.4 min. 568 programs. 3 retried (IL, KS, MT) — all succeeded.
- 28 states have full drafts with state overviews. 22 states have explore+dive but drafts didn't generate (likely parse errors or token limits). Need `--force` re-run.
- Generator fix: non-string `found` values in pipeline-summary.ts (LLM returned objects, stringify them)
- All raw pipeline data committed: 292 files, 125K+ lines across `data/pipeline/*/`

**Admin dashboard taste pass** (`app/admin/benefits/page.tsx`):
- 3 metric boxes → single status line with readiness bar
- Grid split into Active zone (promoted cards) + Backlog zone (8-col compressed abbreviation+count)
- StateCard stripped: 7 metadata fields → 3 (abbreviation, name, one status line)
- Kill progress bars on scaffolding, "Template only" text, pipeline data dumps on cards
- Serif display title (`font-serif text-display-xs`)
- Filter pills removed (visual split handles it)

**Post-mortem** (`docs/POSTMORTEMS.md`):
- Documented entity refactor pattern: 5 bugs from incomplete variable rename
- Root cause: renaming function params without grepping for all downstream references in return objects, template literals, console.log
- Memory saved: `feedback_grep_after_refactor.md`
- Memory saved: `feedback_grep_after_refactor.md`
- Slash commands reviewed — no updates needed, existing coverage is sufficient

**Rate limit fix** (`scripts/benefits-pipeline.js`):
- Root cause: 85% draft failure was Claude API 429 rate limiting (8K output tokens/min), NOT parse errors. Never read the actual error messages across 3 batch runs.
- Fix: 429 retry with exponential backoff (up to 5 retries, 15-60s waits), Claude rate limiter 300ms → 8s, draft concurrency 3 → 1, batch concurrency 3 → 1
- FL test: 16/16 drafted (was 3/16). AL/AK/AZ/AR also 100%.
- Post-mortem #2 documented + memory saved: `feedback_api_rate_limits_first.md`

**Browser back button** (`app/admin/benefits/page.tsx`):
- `history.pushState` on state/region selection, `popstate` listener clears selection
- "All states" back button uses `history.back()`

**46-state batch running** in background via `nohup` (PID 59012). ~6 hours to complete all programs for all states at 100% rate.

**Commits:** `86530f8e` → `643d70bb` → `4f10a0f7` → `f1cfed6b` → `33b767fa` → `2c690789` → `ff26b594` → `c852b379` → `2e11a804` → `ec460d15` → `f423eced` → `67516447` → `4eae7868` → `8c0e92d7` → `a87503fa` → `91b44e73` → `51e2792b` → `460eec1e`

*Sessions 67-70b archived to `archive/SCRATCHPAD-2026-04.md`*
