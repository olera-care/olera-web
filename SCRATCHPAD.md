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

**Provider Page Benefits Module** (branch: `fond-hypatia`, PR #536) — bridging provider discovery and benefits discovery.

**Benefits Pipeline v3** (branch: `eager-ride`, merged) — discovery platform state pages + tabbed program pages + Chantel-depth content.

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
1. **Test the punched welcome page on Vercel** — verify hero card warm vanilla, personalized headline, matches section "Next:" treatment, action steps + pre-footer hidden for intake users
2. **Fix profile completeness for intake users** (deferred bug) — currently shows ~24% because checks don't count `state`, `income_range`, `medicaid_status`. Fix would either add new field checks OR write `care_types`/`payment_methods` from the intake API.
3. **Add `plainLabel` to pipeline prompt** — auto-generate a 4-5 word plain-English label per program (e.g., "Help paying for home care") so provider page descriptions are human-first, not tagline-derived.
3. **Re-run v3 pipeline on all states** — SD + TX validated, full batch for v3-quality content. Benefits module dynamically reflects whatever's in the library.
4. **Admin review guide** — embed quality-check directions directly in the admin dashboard.
5. Apply approved MI drafts
6. Review draft quality with Chantel

### Other active work (different branches)
- Provider page benefits module (`fond-hypatia`, PR #536) — in testing on Vercel
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
| 2026-04-12 | Welcome page is two pages spliced together — hide the generic onboarding for intake users | The welcome page combines a personalized dashboard (top) with generic onboarding (bottom: "Complete profile", "Go live", "Find senior care by city" grid). For users who just completed the benefits intake, the bottom half is irrelevant noise. Cleaner fix than a full restructure: hide the action steps section + pre-footer for intake users only. Same shell, different surface area. Generic users still see the onboarding. |
| 2026-04-12 | Optimistic navigation beats waiting for the API | The save flow had ~2-4 second wait on a "Setting up your dashboard..." spinner because the API ran 11+ sequential operations including a 500-1500ms Resend email send. Two parallel fixes: (1) speed up the API with parallelization + truly fire-and-forget email, (2) navigate to /welcome IMMEDIATELY without awaiting the fetch. Click feels instant. The existing fresh-from-benefits skeleton on the welcome page covers the auth-resolution gap. Risk accepted: failed background saves leave the user on a stuck skeleton. Refresh escapes. Server state stays consistent. |
| 2026-04-12 | The "Next: ..." line on benefit cards is an offer, not a TODO | Original treatment was a quiet gray text line below the program name. Read like a checklist item the eye glides over. Punched: separated by a border, paired with a small dark circle arrow icon. Now visually distinct — reads as "here's what to do next" not "here's another thing on your list." |
| 2026-04-12 | Personalized hero headline must use match count, not generic "Welcome" | Original hero said "Welcome to Olera" — duplicated the page-level subtitle and didn't honor the moment. Now: "{name}, your family may qualify for N programs" — uses the actual match count, addresses by first name, names what just happened. Falls back to "Welcome, {name}" only when matchCount === 0 (rare edge case). Big serif, font-display. |
| 2026-04-12 | Lead with the strongest screen — care-need cards become the entry point | The most visually rich and engaging element in the entire flow was buried at step 1 of the questionnaire, behind a comparatively quiet "hook" intro screen. The conversion gate was weaker than the screen behind it. Pivot: collapse hook + care-need into one first screen. Tapping a card auto-advances to step 2. Result: 5 perceived steps → 4. The user perceives one fewer step AND the strongest screen does the work of getting them in. |
| 2026-04-12 | Typographic support strip beats pills/cards/chrome | The strip below the care-need cards proves real programs exist behind them — but it can't compete visually with the cards themselves. Pills are overdone and look like a UI mess. Studied Wispr Flow (testimonial cards) + Perena (token detail page typography). Landed on Perena editorial style: quiet uppercase "PROGRAMS" label + flowing program names separated by middle-dots, no boxes, no chrome. Typography doing the work — feels like a credit line, not a feature list. |
| 2026-04-12 | Save step progress bar fills as user types (loss aversion) | When the user lands on the save step, the bar shows 4/5 filled — the 5th segment is empty and softly pulsing. As they type their name, it fills to 50%. Valid email = 100%. The empty pulsing segment is a literal visual "you're not done yet." Leaving means leaving with visible incompleteness. Telegram/Robinhood-style live progress, applied to the moment that matters most for conversion. |
| 2026-04-12 | Welcome page must adapt to user journey state, not be one-size-fits-all | The existing welcome page already had multiple states (fresh connection, returning user, fresh state). Adding "post-benefits-intake" as another state was the right move — same shell, smarter content. New signal: `metadata.benefits_results`. Same architecture pattern that the connection flow uses. Generic users still see the existing welcome — only intake users see the personalized variant. |
| 2026-04-12 | Save flow redirects to welcome page, not inline success state | The save step used to show a success state inline on the provider page. Pivoted to redirect to `/welcome?from=benefits` so the personalized welcome page becomes the conversion destination. Mirrors the connection flow's `?connection=` pattern. This makes the welcome page the place where the value loop closes. |
| 2026-04-12 | Live next-step data on welcome page, not hardcoded | New `/api/saved-programs/enriched` endpoint joins user's saved_programs with live data from `getEnrichedProgram()`. Each match card shows `applicationGuide.steps[0].title` as the next step. When the pipeline updates a program, the welcome page reflects it on the next page load. Zero hardcoded program data on the welcome page. |
| 2026-04-12 | "Apply for benefits" beats "Save and find providers" as save button copy | "Save and find providers" is descriptive but flat. "Apply for benefits" is action-oriented — it's the BIG promise. Sounds like doing something real, not bookkeeping. The other candidates (Show me my providers, Get my matches, Continue) all felt either too narrow or too generic. |
| 2026-04-11 | Benefits intake = progressive conversation, not a form | The Q&A section generates content but doesn't convert. The benefits module has a unique advantage: the information exchange IS the product. "We can't tell you if you qualify without knowing your situation" isn't a gate — it's the truth. Each question visibly refines results. Email at the end feels earned, not extractive. Replaced 2-field screener with 4-step flow. |
| 2026-04-11 | Step order: care situation → age → financial → results → save | Original plan was age-first (easy warm-up, always filters). Flipped after pushback: typing a number is MORE friction than tapping a card, and care situation mirrors the caregiver's actual mental state ("I need help with X"). More empathetic, less form-like. |
| 2026-04-11 | Care need: 4 UI categories collapse 7 PrimaryNeeds | Seven granular needs is too many for a 4-step flow. Collapsed into: Staying at home (personalCare + householdTasks + mobilityHelp), Paying for care (financialHelp), Memory & health care (memoryCare + healthManagement), Companionship (companionship). UI stays simple, data stays compatible with existing FamilyMetadata + benefits intake enums. |
| 2026-04-11 | Results reveal is ungated — save is post-value | Show matches fully before asking for name+email. Gating results turns it back into a lead form. Value first, email second. Same philosophy as Q&A post-submit state. |
| 2026-04-11 | Single API endpoint, not batch-save hook | The /api/benefits/save-results route handles everything atomically: auth user creation, account row, family profile, batch saved_programs, activity log, magic link email, session tokens. Cleaner than orchestrating 4 client calls and matches the guest-first pattern of /api/connections/request. |
| 2026-04-11 | Care seeker profile IS the benefits profile | Reuses existing FamilyMetadata fields (age, care_needs, income_range, medicaid_status, benefits_results) and existing PrimaryNeed/IncomeRange/MedicaidStatus enums. No new schema — intake writes to the same place the connection flow and benefits finder would write to. One care seeker profile, multiple entry points. |
| 2026-04-11 | Benefits module matches Q&A section pattern — no container | The Q&A section works because it's content on the page, not a widget. "Families are asking" + clean rows + one input. The benefits module initially had a vanilla container with bordered cards inside (nested boxes = UI kit smell). Stripped to match: bold headline + gray program rows + one black CTA. Module should feel like part of the page, not a dropped-in component. |
| 2026-04-11 | Program rows: name + plain description, not name alone | "STAR+PLUS Waiver" means nothing to a caregiver. The Q&A works because every line is plain English. Program rows now show the name (bold, for people who recognize it) + a plain-language description extracted from the tagline (gray, for everyone else). CSS truncate handles overflow — no JS character truncation (which leaves dangling words like "or", "if", "that"). |
| 2026-04-11 | Benefits module data flows server → client via props | The waiver-library + pipeline-drafts data is ~100K+ lines. Importing it in a "use client" component would bundle it all into client JS. Instead, the server component prepares minimal `BenefitsProgram` objects (id, name, shortName, tagline, savingsRange, ageRequirement) and passes them as props. |
| 2026-04-11 | ApplicationNotes: compact list, not amber alert cards | 4 separate amber callout cards with left borders and info icons made notes look like warnings. They're side notes. Now renders as "GOOD TO KNOW" section label + compact bulleted list with small amber dots. System-wide change — all program pages. |
| 2026-04-11 | Program page: tabs → single scroll | Tabs are an app pattern, not a content pattern. Airbnb listings, Apple product pages, Claude.ai — all single scrolls with visual rhythm. Tabs hide content from crawlers (SEO), force users to hunt across views, and create a "dashboard" feel instead of a "guide" feel. Single scroll with sticky section nav gives wayfinding without hiding content. |
| 2026-04-11 | Eligibility check as the hook, phone CTA as the action | Caregivers arrive in research mode ("does my parent qualify?"). The eligibility check answers that in 10 seconds. THEN the phone CTA hits — they have a reason to call. Hook → motivation → action, not cold CTA. |
| 2026-04-11 | Document checklist: gradient fade, not full collapse | Showing 3 items + gradient fade previews enough to be useful without overwhelming. Full collapse risks users missing the checklist entirely. Full expand is one click away. |
| 2026-04-11 | How to Apply gets background shift | Two white content zones back-to-back (Eligibility → Apply) bleed together visually. Subtle `bg-vanilla-200/30` on the Apply zone signals "new territory" like the warm contact block does. |
| 2026-04-11 | Kill dark stat band on program pages | State page stats are impressive (15 programs, $20K). Program stats are trivial ("6 service areas") or discouraging (waitlist). The eligibility check IS the program page's bold moment. Same visual treatment for unimpressive data = "spotlight on an empty stage." |
| 2026-04-11 | `/punch` combines all design sharpening | Wispr Flow + Perena DNA + Painting Outside the Lines toolkit in one command. Simplicity/boldness first (most important), character/style second. One command: diagnose → direct → implement. |
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

### 2026-04-12 (Session 77) — Benefits Save Latency Debugging (IN PROGRESS, STUCK)

**Branch:** `fond-hypatia` | **PR:** #536 | **Latest:** `15d658e4`

**The problem:** User clicks "Apply for benefits" on the provider page, sees a ~6-10 second spinner before the welcome page loads. Multiple rounds of debugging to pinpoint where the seconds are going.

**The investigation path (chronological):**

1. **First assumption:** API route is slow. Added server-side timing instrumentation to `/api/benefits/save-results`. Vercel logs showed **server is fast** — ~900ms total, `create_user: 430ms`, no single step dominates.

2. **Second attempt:** Optimistic navigation (fire-and-forget fetch + immediate `router.push`). **Reverted** because it caused a race: welcome page mounted before `setSession` wrote cookies, profile fetch 401'd, welcome page stuck in generic state.

3. **Third:** Added CLIENT-side timing with `performance.now()` markers in `BenefitsDiscoveryModule.handleSave`. Log file from the user revealed the smoking gun:
   ```
   before_set_session: 1363ms
   set_session_done:   7311ms  ← 5.9 SECONDS on client-side setSession
   ```

4. **Fourth (current attempt):** Moved `setSession` to the SERVER side. The theory: `supabase.auth.setSession()` internally calls `GET /auth/v1/user` to verify tokens. From the user's browser (Brave + residential network) this was taking 6 seconds. From Vercel → Supabase (same region, no shields) it should be ~200-300ms. Used `createSSRServerClient` from `@supabase/ssr` with a cookie writer attached to `NextResponse`, so cookies are set via `Set-Cookie` headers on the response.

**The current state (STUCK):**

After the server-side setSession fix, the welcome page is **stuck on the shimmering skeleton** that I built for the race window. Specifically:
- URL has `?from=benefits` so `isFreshFromBenefits = true`
- `activeProfile.metadata.benefits_results` never loads, so `hasBenefitsIntake = false`
- The conditional `isFreshFromBenefits && !hasBenefitsIntake` stays true forever → skeleton renders forever
- The greeting "Welcome to Olera" shows above the stuck skeleton (the page subtitle is hidden for intake users only when `hasBenefitsIntake` is true, which never happens)

**What this means:** The cookies from the server-side Set-Cookie headers are NOT being picked up by the browser's Supabase client when the welcome page mounts. Several possibilities:

1. **Cookies aren't being set** — `response.cookies.set()` in Next.js API route may have some quirk
2. **Browser client caches session state** — when `createBrowserClient` was first initialized on the provider page, it may have cached `session = null` in GoTrueClient's in-memory state. Even though `document.cookie` now contains the new session, `getSession()` might return the cached null value instead of re-reading cookies.
3. **Cookie format mismatch** — the SSR server client and browser client might expect different cookie encoding (base64url vs plain JSON vs chunked)
4. **Path/domain mismatch** — the cookies being set might have a path/domain that doesn't match what the browser client reads

**What was NOT tested yet:** Did the server-side `setSession` itself succeed? The response should include `Set-Cookie` headers with names like `sb-{ref}-auth-token`. Need to check Vercel logs for the `write_session_cookies` timing AND check browser DevTools → Application → Cookies to see if the cookies are actually set.

**Files changed in this debugging session:**
- `app/api/benefits/save-results/route.ts` — added timing logs, added server-side setSession via createSSRServerClient
- `components/providers/BenefitsDiscoveryModule.tsx` — added client-side timing logs, removed client-side setSession call
- `components/welcome/WelcomeClient.tsx` — added welcome_mounted/welcome_activeProfile_ready timing logs

**Next steps when debugging resumes:**

1. **Check if cookies are actually being set.** Open DevTools → Application → Cookies → select the Vercel preview domain. After clicking "Apply for benefits", look for `sb-*-auth-token` cookies. If they don't exist, `createSSRServerClient.auth.setSession()` isn't writing them (either the cookie writer callback isn't firing, or the server-side setSession itself is failing).

2. **Check the new `write_session_cookies` server timing.** If it's fast (<500ms), server-side setSession IS completing. If it's missing or also slow, server-side setSession has the same issue.

3. **Fallback option A:** Manually construct the cookie with the known Supabase cookie format. Bypass `setSession` entirely. Write `sb-{ref}-auth-token` cookie with a JSON-encoded session object.

4. **Fallback option B:** Return tokens in JSON body (as before) AND call `setSession` client-side (slow) but trigger the navigation first so the user PERCEIVES it as fast. This reintroduces the race condition we fought earlier. Need a different way to signal "auth in progress" to the welcome page.

5. **Fallback option C:** Skip the whole auth flow — return a magic link in the response body and have the client navigate to it. Supabase's hash-fragment flow handles token delivery. The AuthProvider already has code for this at line 307: `if (window.location.hash.includes("access_token"))`. But this causes a full-page reload, not a client-side navigation.

**Build:** Clean (0 type errors). Pushed. Commits: `6de542ae` (server timing) → `c2cef300` (client timing) → `b75bf028` (server-side setSession) → `15d658e4` (log cleanup).

---

### 2026-04-12 (Session 76) — Closing the Conversion Loop: Welcome Page + Lead with Strongest Screen

**Branch:** `fond-hypatia` | **PR:** #536 | **Latest:** `c47f07c2`

**The conversion problem TJ identified:** Session 75's benefits module looked great but didn't convert. The save step was a dead end — caregivers got the value (saw their matches) and bounced. The save button "Save these to your profile" was archive-action energy. The welcome page they would land on was generic. The whole loop was broken.

**Two big architectural decisions came out of this session:**

1. **The welcome page must deliver on the promise made on the provider page.** When a caregiver completes the intake and lands on /welcome, the page should immediately reflect what they told us — situation summary, their matches, providers filtered to their state + care category. Not a generic "Finding Care Made Simple" hero.

2. **Lead with the strongest screen.** The care-need cards (icons + 4 big tappable options) are the most visually rich and engaging element in the entire flow. Burying them behind a quieter "hook" intro screen meant the conversion gate was weaker than the screen behind it. **Pivot:** care-need cards become the very first thing on the provider page. No more "click to start" intermediate.

**What was built:**

**Welcome page integration** (`components/welcome/WelcomeClient.tsx`):
- New detection signal: `hasBenefitsIntake` reads `activeProfile.metadata.benefits_results`
- New URL signal: `?from=benefits` triggers fresh celebration banner
- New benefits hero card variant: "Welcome to Olera" + "Your matches are saved" badge + situation summary ("Based on age 72, staying at home in TX") + match count + provider count
- New "Your benefits matches" section: top 4 saved programs with name + plain description + **live next step** ("Next: Join the interest list") + savings range. Pulled live from program library — pipeline updates flow through automatically.
- Providers section now filters by state + care category for intake users (e.g. "Home Care in TX" instead of generic "Providers near you")
- Provider category filter uses `ilike` to handle multi-category strings ("Memory Care | Assisted Living")

**New API endpoint** (`app/api/saved-programs/enriched/route.ts`):
- Returns user's saved_programs joined with live data from `getEnrichedProgram()`
- Server-only, cookie auth (RLS-protected, not service role)
- Returns: name, shortName, plain description, savings range, **next step** from `applicationGuide.steps[0].title`
- Falls back to saved snapshot if program not found in library (for renamed/removed programs)

**Provider page module rewrite** (`components/providers/BenefitsDiscoveryModule.tsx`):
- **Collapsed hook + care-need into ONE first screen.** Care-need cards lead. No more 3-program-row hook intermediate.
- Headline: "What kind of help is your family looking for?"
- Subtext: "Texas has 27 programs that may help. Pick the one that fits best."
- New typographic support strip (Perena/Wispr Flow style): quiet uppercase "PROGRAMS" label + flowing list of program names separated by middle-dots, "+ N more" hint, small "Browse all →" link. No pills, no chrome, no boxes — typography doing the work.
- Step 5 (save) progress bar segment now starts EMPTY and fills as user types name + email. Empty segment pulses softly. Loss aversion through visible incompleteness.
- Save button: "Save and find providers" → **"Apply for benefits"**
- After save, redirect to `/welcome?from=benefits&matches=N` (replaces inline success state)
- Result: 5 perceived steps → 4 (cards → age → financial → results → save)

**Self-review bugs caught and fixed (3 rounds):**

Round 1 (welcome page integration):
1. **Race condition flash** — wrong card showed for ~200-500ms before auth resolved on welcome page. Added skeleton during auth resolution window.
2. **Unreachable skeleton** in matches section — parent gated on `length > 0` so the `length === 0` skeleton never rendered. Restructured.
3. **Broken `/portal/benefits` link** — would 404. Replaced with state-aware link to `/texas/benefits` or `/senior-benefits/{slug}`.

Round 2 (architectural review of save-results route):
1. CRITICAL: `accounts` table has no `email` column — my insert would fail. Fixed.
2. CRITICAL: `seeker_activity.event_type` CHECK constraint rejected `"benefits_intake_completed"`. Changed to `"profile_enriched"`.
3. CRITICAL: Duplicate profile bug — auth callback would create a second family profile. Fixed by creating account inline.
4. `.single()` instead of `.maybeSingle()` on initial account lookup.

**Design iterations with TJ (many rounds — this was a long session):**

1. CTA "Save and find providers" → too transactional. Discussed options.
2. Welcome page concept: "Care plan" framing → too abstract. Pivot to "Save my matches and find providers who accept them."
3. Welcome page fully personalized vs minimal: chose **medium scope** — augment existing welcome, don't rebuild.
4. The 4/10 conversion estimate prompted the deeper rethink: not just about copy, about WHERE the save moment lives.
5. "Apply for benefits" copy locked in for both the save button and (later) considered for the hook CTA.
6. Pivot moment: TJ pointed out that step 5 isn't the most important screen — the FIRST screen is. If users don't start, save copy doesn't matter. The strongest visual element (care-need cards) was buried at step 1, not the entry point.
7. Typographic strip design: discussed pills vs chrome vs typography. Studied Wispr Flow + Perena reference screenshots. Landed on flowing middle-dot-separated names — Perena editorial style.
8. Progress bar on save step: should fill as user types (loss aversion through visible incompleteness).

**Files changed (3 commits):**
- `app/api/benefits/save-results/route.ts` — bug fixes
- `app/api/saved-programs/enriched/route.ts` — NEW
- `components/providers/BenefitsDiscoveryModule.tsx` — major restructure
- `components/welcome/WelcomeClient.tsx` — benefits intake state added
- `app/provider/[slug]/page.tsx` — pass providerState prop, include incomeTable

**Build:** Clean (0 type errors). Pushed to Vercel.

**Conversion estimate:** Started at 4/10 (initial save module). After welcome page integration: 6-7/10. After leading with the strongest screen + typographic strip + loss-aversion progress bar: TBD pending TJ test, but the architectural fix is the right move.

**Commits:** `e610064a` → `91a74bfd` → `a5129804` → `2c20944e` → `eb0429f0` → `c47f07c2`

---

**SESSION 76 CONTINUATION — Speed + Welcome Page Punch**

After the initial test, TJ flagged: (1) the "Setting up your dashboard..." spinner takes too long, (2) the welcome page itself feels generic for someone who just completed the intake. Two more arcs:

**Phase 1 — API speed-ups** (`app/api/benefits/save-results/route.ts`):
- Parallelized `getUser()` with the provider-email block check (`Promise.all`)
- Skipped provider-email check entirely for already-authenticated users (already validated at signin)
- Moved welcome email send from "awaited fire-and-forget" to TRULY fire-and-forget (wrapped in IIFE) — biggest win, drops Resend's 500-1500ms from response path
- Parallelized `active_profile_id` update with `saved_programs` upsert after profile creation
- Estimated savings: 700-2000ms per request (mostly from email)

**Phase 2 — Optimistic navigation** (`components/providers/BenefitsDiscoveryModule.tsx`):
- Click "Apply for benefits" → `router.push("/welcome?from=benefits")` IMMEDIATELY
- Fetch fires in the background (detached promise via .then chain)
- The existing fresh-from-benefits skeleton on the welcome page already covers the auth-resolution gap
- Singleton supabase client guarantees `setSession` from the detached promise affects the same client the welcome page uses
- Risk accepted: if the background save fails (rare), user lands on welcome page in a confused state (skeleton stuck). Refresh escapes. Server state stays consistent.
- Result: click feels instant; ~1s of skeleton; then personalized hero appears

**`/pre-test` slash command** (`.claude/commands/pre-test.md`):
- Codifies the bug-sweep pattern that's caught real issues in sessions 75-76
- Includes the mental model (assume bugs, look for them, don't hallucinate), checklist of common bug classes, reference list of past bugs caught
- Now invokable as `/pre-test` after any session before user testing

**Welcome page punch** (`components/welcome/WelcomeClient.tsx` + `components/shared/ConditionalFooter.tsx`):

Killed the noise:
- `ConditionalFooter`: added `/welcome` to `hidePrefooter` list (was showing the generic "Find senior care by city" grid)
- Hidden the action steps section ("Complete profile", "Go live", "Explore benefits") for benefits intake users — they're on a different journey
- Hidden the page-level "Welcome to Olera" subtitle for intake users (was duplicating the hero card headline)

Punched the hero card:
- Warm `bg-vanilla-100` background instead of cold white
- Personalized headline: "{name}, your family may qualify for N programs" — uses match count + addresses by name
- Bigger serif (`text-2xl sm:text-3xl font-display`)
- Killed the weak stats row (2 programs / 6+ providers nearby) — they were whispers competing with the headline

Punched the matches section:
- Section title now serif "Your matches" (was "Your benefits matches")
- Cards have more breathing room (p-5, space-y-3), stronger hover state (border-gray-900 + shadow)
- Program name bumped to `text-base font-semibold`
- "Next: ..." line now visually distinct — separated by border, paired with a small dark circle arrow icon. Reads as an offer, not a TODO

**Self-review bugs (this continuation):**
- Round 1 (post-API rewrite): no bugs found — clean review
- Round 2 (post-zero-matches edge case): caught **1 bug** — save button shown when matchingPrograms.length === 0 would create confusing welcome page state. Replaced with "Browse all programs" CTA + "Adjust my answers" link.
- Round 3 (welcome page punch): no bugs found — clean review (UI polish only, no schema changes)

**Profile completeness bug noted but deferred:** an intake user shows ~24% profile complete because the completeness checks don't count `state`, `income_range`, `medicaid_status`. Real bug, but no longer visible to intake users (action steps card is hidden for them now). Deferred for a separate fix.

**Files changed (continuation):**
- `app/api/benefits/save-results/route.ts` — speed optimizations
- `components/providers/BenefitsDiscoveryModule.tsx` — optimistic navigation, zero-match edge case fix
- `components/welcome/WelcomeClient.tsx` — punch + hide sections for intake users
- `components/shared/ConditionalFooter.tsx` — hide pre-footer on /welcome
- `.claude/commands/pre-test.md` — NEW slash command

**Continuation commits:** `81d52274` (speed) → `5b035bae` (zero-match fix) → `e76aa457` (pre-test command) → `a051e4d8` (welcome page punch)


*Sessions 72-75 archived to `archive/SCRATCHPAD-2026-04.md`.*
