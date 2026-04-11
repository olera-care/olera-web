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

**Benefits Pipeline v3** (branch: `eager-ride`) — discovery platform state pages + tabbed program pages + Chantel-depth content.

### What's shipped (v3 — Session 72, Apr 10)
- **StatePageV3** (`components/waiver-library/StatePageV3.tsx`): Full redesign from editorial article to discovery platform
  - **Archetype entry** ("What's your situation?"): 4 always-visible situation cards (home care, paying for care, where to start, caregiver support). Clicking filters entire page — matching programs highlighted, non-matching dimmed to 35% opacity. Need groups dim. Counter shows "Showing X programs related to [situation]". Toggle on/off.
  - **Quick orientation strip**: key stats (savings, program count, "Free to apply", resources) as quiet serif numbers
  - **Save buttons** on "Where to start" cards + every program in directory (bookmark icons, auth-gated via SavedProgramsProvider)
  - **Benefits finder CTA**: "Not sure which programs apply?" warm vanilla card linking to /benefits/finder
  - **Provider bridge**: 4 care category cards (Home Care, Home Health, Assisted Living, Nursing Homes) linking to browse page with correct ?type=&location= params
  - **Share with family**: Web Share API with clipboard fallback
  - **Explore other states** link
  - Intro shortens to 1 paragraph when archetype active. Quick facts hidden when archetype active. Width variation preserved from v2.
- **URL migration**: `/waiver-library/*` → `/senior-benefits/*` (31 files, 177 replacements, 301 redirects)
- **Texas v3 pipeline**: 12/12 programs + state overview drafted
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
1. **Program page polish iteration** — TJ reviewing the single-scroll redesign on Vercel. May need further adjustments to spacing, section ordering, or visual treatments based on feedback.
2. **Admin review guide** — embed quality-check directions directly in the admin dashboard (tooltip or inline).
3. **Re-run v3 pipeline on all states** — SD + TX validated, full batch for v3-quality content
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
| 2026-04-11 | Program page: tabs → single scroll | Tabs are an app pattern, not a content pattern. Airbnb listings, Apple product pages, Claude.ai — all single scrolls with visual rhythm. Tabs hide content from crawlers (SEO), force users to hunt across views, and create a "dashboard" feel instead of a "guide" feel. Single scroll with sticky section nav gives wayfinding without hiding content. |
| 2026-04-11 | Eligibility check as the hook, phone CTA as the action | Caregivers arrive in research mode ("does my parent qualify?"). The eligibility check answers that in 10 seconds. THEN the phone CTA hits — they have a reason to call. Hook → motivation → action, not cold CTA. |
| 2026-04-11 | Document checklist: gradient fade, not full collapse | Showing 3 items + gradient fade previews enough to be useful without overwhelming. Full collapse risks users missing the checklist entirely. Full expand is one click away. |
| 2026-04-11 | How to Apply gets background shift | Two white content zones back-to-back (Eligibility → Apply) bleed together visually. Subtle `bg-vanilla-200/30` on the Apply zone signals "new territory" like the warm contact block does. |
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
*Older decisions (Apr 8-9) archived to `archive/SCRATCHPAD-2026-04.md`*
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

### 2026-04-11 (Session 73) — Program Page Single-Scroll Redesign + Texas Route Fix

**Branch:** `eager-ride` | **Latest: `f63ab28d`**

**Program page v3 iteration** (initial pass):
- Typography pass: bumped all text sizes, gray-400→500 for readability
- Phosphor icons throughout: CheckCircle, FileText, Clock, HourglassHigh, Globe, etc.
- Quick eligibility check widget: 2-field form (age + income), client-side matching
- Related programs as clickable links via `findProgramSlug()` fuzzy matching
- Share button (Web Share + clipboard feedback) + print checklist button
- Processing time/waitlist as distinct visual cards (amber waitlist styling)

**Self-review bug sweep (3 bugs caught):**
1. `w-4.5 h-4.5` invalid Tailwind class on Clock/HourglassHigh icons
2. Label/input association missing on eligibility check (a11y)
3. No clipboard copy feedback on share button

**Texas route fix (post-mortem documented):**
- Root cause: Texas has parallel routes (`/texas/benefits/` and `/texas/benefits/[slug]/`) that shadow generic `/senior-benefits/` routes via 301 redirects. These routes were hardcoded V1/V2 pages that never got V3.
- Fixed `lib/program-data.ts`: added state-prefix-stripped matching + name-based fallback to `findDraftMatch` (handles `texas-snap` vs `tx-snap` ID mismatch)
- Fixed `app/texas/benefits/[slug]/page.tsx`: switched to `getEnrichedProgram` + `ProgramPageV3`
- Fixed `app/texas/benefits/page.tsx`: wired to `pipelineDrafts` + `StatePageV3`
- Added prevention rules to CLAUDE.md + memory

**Program page redesign — tabs → single scroll (TJ design direction):**
- TJ: "tabs don't feel like the most awesome experience" — tabs are for apps, not content pages
- Killed tabs entirely. Page is now one continuous scroll with visual rhythm
- Section order: hero → eligibility check → intro → what's covered (icon grid) → stat band → eligibility details → how to apply → service areas map → contact block → related programs → FAQs
- Sticky horizontal section nav (pill bar, IntersectionObserver tracking, smooth scroll)
- "What's covered" icon grid: Phosphor icons extracted from intro text (medical, dental, transport, etc.)
- Contact block: warm vanilla background, elevated prominence
- Resource/navigator programs keep one-pager layout

**Taste pass (from /ui-critique):**
- Killed redundant at-a-glance pills (eligibility info showed twice)
- Document checklist: gradient fade collapse (show 3 + "Show all 14 documents")
- Moved dark stat band between Eligibility and How to Apply (visual break)
- How to Apply zone gets `bg-vanilla-200/30` background for zone contrast
- Stronger section headings: SectionLabel above ("ELIGIBILITY DETAILS" / "APPLICATION PROCESS")

**Post-mortem:** Texas parallel routes (documented in `docs/POSTMORTEMS.md`, CLAUDE.md, memory)

**Build:** Clean (tsc --noEmit passes). Pushed to Vercel.

**Commits:** `e99b4cf7` → `92c32678` → `5d46950e` → `eed9f9a2` → `feea4db3` → `f63ab28d`

---

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

**State page cleanup pass:**
- Killed quick orientation strip (redundant with dark stat band)
- Page restructures when archetype active: hides "Where to start", quick facts, "Browse by need" — response panel + filtered directory handle it. 12 sections → 8.
- Pipeline-only programs now get pages (synthetic WaiverProgram from draft data, generateStaticParams includes pipeline IDs)
- "Where to start" + "Browse by need" pills now find programs across both waiver-library and pipeline via findProgramByName()
- Fixed startHere programId mismatch (LLM generates short slugs like "mi-options" but actual draft ID is "michigan-mi-options-counseling")

**Final session work (after cleanup pass):**
- Inline benefits check: 2-field form (age + Medicaid), instant client-side matching
- Spend-down calculator link in "paying for care" archetype response
- "Families are asking" social proof: Supabase query with provider slug lookup, clickable (opens provider page in new tab)
- Removed "Browse by need" section (redundant with archetype panel + directory)
- Provider bridge simplified: 4 boxed cards → 1 line + pill links
- Social proof simplified: killed card wrappers + avatar circles → clean text
- Program directory: killed white card wrapper, compact rows with right-aligned savings
- Response panel redesign: teal left border, serif message, sorted by savings, hierarchy
- Typography pass: all text bumped for readability (text-xs→sm, text-sm→base, gray-400→500)
- Dead code cleanup: removed ~120 lines of unused Browse by need SVGs/functions
- Phosphor Icons installed (`@phosphor-icons/react`), better-icons MCP server configured system-wide

**Commits:** `3a3bd30c` → ... → `f8a2889a`

**Self-review bugs caught (session total: 14):**
- 6 in ProgramPageV3 (crash on null phone, duplicate FAQs, duplicate savings, checklist state loss, empty stateId, stale SEO metadata)
- 3 in StatePageV3 (wrong browse query params, unused imports, nonexistent Tailwind class)
- 2 in build (toLocaleString on null monthlyLimit from 117 LLM rows, non-numeric householdSize)
- 2 in pipeline programs (programId mismatch in startHere, synthetic description=tagline hiding tagline)
- 1 dead links (pipeline-only programs had no pages)

*Session 71 archived to `archive/SCRATCHPAD-2026-04.md`. Sessions 67-70b also in that archive.*
