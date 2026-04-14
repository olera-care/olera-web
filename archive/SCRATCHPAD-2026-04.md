# Scratchpad Archive — April 2026

> Archived sessions from SCRATCHPAD.md

---

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

### 2026-04-08 (Session 70) — Benefits Pipeline v2: Content Production System

**Branch:** `eager-ride` | **16 commits across the day**

**Scope:** Evolved pipeline from research/QA tool → full content production system. Built end-to-end: data model, classify + draft phases, admin dashboard upgrades, v2 program page, v2 state page, save program feature, draft review workflow.

**Key deliverables:**
- 6-phase pipeline: explore → dive → compare → classify → draft → report
- ProgramPageV2: content-forward layout (no dark hero, prose-width, structured eligibility, clean FAQs)
- StatePageV2: state overview with "where to start", need-based grouping, quick facts
- Admin dashboard: summary bar, content quality indicators, draft preview with Draft/Current toggle, review status + comments
- Save program: auth-gated bookmark, Supabase persistence, /saved page
- Draft review workflow: status tracking (Draft → Reviewed → Needs Changes → Approved → Published) with comment threads
- Michigan: 16/16 programs drafted, state overview generated, MI Choice applied as v2 test
- Slash command auto-detects approved drafts on startup

**Anthropic API:** Key `olera-benefits-pipeline` in Olera org, $15 credits, used for draft generation via Claude Sonnet.

### 2026-04-07 (Session 69) — Admin Panel 2.0 QA Fixes

**Branch:** `noble-yalow` | **From Apr 7 meeting with Graize & Cecille**

- Fixed "Needs Email" counter, restored delete-reason modal
- CSV export + multi-select bulk actions on claims page
- Fixed auto-sign-in from lead emails, added contact_revealed tracking
- Built unsubscribe flow: /unsubscribe/[slug] + API + email link

### 2026-04-08 (Session 70b) — V2 Page Design + Save Program Feature

**Branch:** `eager-ride` | **Latest: `09177d30`**

- ProgramPageV2: content-forward layout, prose-width, serif headings, structured eligibility as prose, clean FAQs, no card soup, no dark hero
- Applied MI Choice Waiver as first v2 test program
- Taste refinements: asset limits → prose, callouts → "Things to know", pre-footer hidden
- Save program: auth-gated bookmark, Supabase persistence, /saved page (migration 035)
- Draft review workflow: DraftReviewPanel, statuses, comments, history (migration 036). Self-review caught missing auth.
- Preview button on draft view, slash command auto-detects approved drafts
- State-level content generation: pipeline generates overview, StatePageV2 component, auto-switches when overview exists

### 2026-04-06 (Session 67) — Aging in America: Framer → Olera Web Migration

**Branch:** `thirsty-hugle` | **Merged via PRs #493-498**

- Full AIA migration: dark cinematic index + episode detail pages
- YouTube IDs confirmed, hero image, sitemap, thumbnail fallback

---

### 2026-04-09 (Session 71) — State Page Redesign + Dashboard Streamlining + Region System

**Branch:** `eager-ride` | **Latest: `ff26b594`**

Session 71 was a massive session covering: StatePageV2 redesign (organic blobs, wavy dividers, dark stat band, width variation), state page review workflow (/current sub-route), admin dashboard streamlining (readiness filters, content metrics, TypeBadge, reviewer persistence), region-flexible pipeline (4 layers: pipeline, data model, flat routing, admin), pipeline concurrency + batch runner, 50-state batch run (47/50 succeeded, 568 programs), admin dashboard taste pass, post-mortems (entity refactor + rate limits), rate limit fix (429 retry, sequential drafts), browser back button in admin.

Bugs caught: 5 (phaseReport dir, undefined stateCode ×2, state/region selection collision, searchParams SSG regression).

**Commits:** `86530f8e` → ... → `460eec1e`

*Full session log preserved in git history at commit `f7d947c6` (SCRATCHPAD.md before compaction)*

---

### 2026-04-11 (Session 75) — Benefits Module: Conversion Flow + Care Seeker Profile Integration

**Branch:** `fond-hypatia` (continues from session 74) | **PR:** #536 | **Latest:** `a5129804`

**The pivot:** After session 74's benefits module looked and felt great but didn't convert, TJ flagged the gap: it's a dead end. The Q&A section has the same issue but it's OK because Q&A generates UGC. Benefits needs to actually capture the user because the information exchange IS the product — "we can't tell you if you qualify without knowing your situation" is a natural, non-forced reason to collect data.

**What was built:** Replaced the 2-field screener with a 4-step guided conversation:

1. **Care situation** (tap one of 4 cards) — Staying at home / Paying for care / Memory & health / Companionship
2. **Age** (type a number)
3. **Financial** (Medicaid pills + income bracket pills)
4. **Results reveal** — personalized matches with "based on X, Y, Z" context. Ungated. Clickable (new tab).
5. **Save** — First name + email. "Don't lose this" framing. Earned, not extractive.

Step order was flipped mid-design: care situation first (tap = less friction than typing, more empathetic mirroring of caregiver mindset).

**Backend: `POST /api/benefits/save-results`** (new):
- Resolves user (already authenticated → use, else create new auth user, else lookup existing by email via magic link + verifyOtp)
- Creates accounts row (user_id + display_name + onboarding_completed — no email column, mirroring `/api/connections/request`)
- Resolves or creates family business_profile with intake metadata (age, care_needs, income_range, medicaid_status, benefits_results blob)
- Sets `active_profile_id` on account
- Batch-upserts matching programs to `saved_programs` with `onConflict: "user_id,program_id"`
- Logs `seeker_activity` event `"profile_enriched"` with `source: "benefits_intake"`
- Sends branded magic link welcome email for new users via Resend
- Returns session tokens so client logs in instantly via `supabase.auth.setSession()`

**Care seeker profile integration:** No new schema. Reuses existing `FamilyMetadata` fields and existing `PrimaryNeed`/`IncomeRange`/`MedicaidStatus` enums from `lib/types/benefits.ts`. UI's 4 care need categories expand to the 7 granular needs when stored, so the data is compatible with connection flow + benefits finder.

**Files changed:**
- `app/api/benefits/save-results/route.ts` (new, ~390 lines)
- `components/providers/BenefitsDiscoveryModule.tsx` (major rewrite — 4-step state machine, ~680 lines)
- `app/provider/[slug]/page.tsx` (pass `providerState` prop, include `incomeTable` in minimal program shape)

**Self-review bugs caught and fixed (4 real bugs before TJ tested):**
1. **CRITICAL**: `accounts` table has no `email` column — my insert would've failed for every new user. Fixed to use `{user_id, display_name, onboarding_completed}` like `/api/connections/request`.
2. **CRITICAL**: `seeker_activity.event_type` CHECK constraint only allows 5 values — `"benefits_intake_completed"` would've been rejected. Changed to `"profile_enriched"` with `source: "benefits_intake"` in metadata.
3. **CRITICAL**: Duplicate profile bug — my original flow created profile with `account_id: null` intending the auth callback to claim it, but the callback doesn't look up by email — it creates a brand new profile on magic-link click. Would've orphaned all intake data. Fixed by creating the account inline so the callback sees it exists and skips duplicate creation.
4. `.single()` instead of `.maybeSingle()` on initial account lookup — swallowed "not found" errors. Fixed.

**Design iterations with TJ (5 rounds):**
1. Program rows too busy — stripped to Q&A-style clean rows
2. Program names alone (STAR+PLUS Waiver) meaningless — added plain-language descriptions
3. Module didn't close the loop — pivoted to progressive intake + save
4. Care need grouping (4 UI categories → 7 granular needs) — TJ confirmed
5. Step order (age first → care situation first) — TJ flipped it, correctly

**Build:** Clean (0 type errors). Pushed to Vercel for testing.

**Commits:** `e610064a` (initial 4-step flow) → `91a74bfd` (scratchpad save) → `a5129804` (4 bug fixes)

---

### 2026-04-11 (Session 74) — Provider Page Benefits Discovery Module

**Branch:** `fond-hypatia` (from staging) | **PR:** #536 | **Latest:** `43ab1729`

**What was built:** A benefits discovery module on provider detail pages that bridges provider discovery and benefits discovery. Sits between Q&A and Care Services sections.

**Architecture:**
- `components/providers/BenefitsDiscoveryModule.tsx` (new, "use client") — the module component
- `lib/program-data.ts` — added `getStateSlug()`, `getTopProgramsForState()`, `parseSavingsUpper()`
- `app/provider/[slug]/page.tsx` — server-side data prep + conditional render + section nav integration
- `components/waiver-library/ProgramPageV3.tsx` — punched ApplicationNotes component

**Module flow:**
1. **Hook** (zero interaction): headline "Your family may qualify for help", subtext with program count + top savings, 3 program rows (name + plain description + savings + arrow)
2. **Screener** (one click to reveal): black CTA → age + Medicaid form (same logic as InlineBenefitsCheck)
3. **Results**: matching program count + clickable pills
4. **Footer**: "View all {state} programs →" link

**Design iterations (3 rounds with TJ):**
1. First version had vanilla container + bordered cards + Heart icon + coin icons + taglines truncating to "..." — too busy, UI kit smell
2. TJ: "look at the Q&A section — clarity and focus, not gibberish words and template containers". Stripped to match Q&A pattern: no container, gray rows, bold headline, one CTA
3. TJ: "program names alone aren't ridiculously easy to understand". Added plain-language descriptions extracted from taglines below each program name

**Self-review bugs caught:**
1. `plainDescription()` JS truncation at 55 chars left dangling words ("for adults 65+ or", "medical costs if"). Fixed by removing JS truncation — first-clause extraction gives complete phrases, CSS `truncate` handles overflow
2. Section nav "Benefits" pill was unconditional — fixed to only show when state has benefits data (`hasBenefitsData`)
3. First version imported heavy data modules in client component — refactored to pass minimal props from server

**Punch: ApplicationNotes (system-wide):**
- 4 amber alert cards → compact "Good to know" section label + bulleted list with amber dots
- Affects all program pages across all states

**Data verified via tsx tests:**
- TX: 3 top programs (STAR+PLUS $50K, PACE $35K, SNAP $21K), 27 total
- MI: 1 top program (MI Choice Waiver), 19 total
- CA, FL, NY, OH, etc.: all return valid data
- Invalid state → null → module doesn't render
- DB confirmed: all providers store 2-letter state codes

**Build:** Clean (0 type errors). Pushed to Vercel for testing.

**Commits:** `20e0b1ba` → `fbc9bb16` → `8bfe8245` → `315616f0` → `43ab1729`

---

### 2026-04-11 (Session 73) — Program Page Single-Scroll Redesign + Texas Route Fix

**Branch:** `eager-ride` | **Latest: `4106da1f`**

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

**Dark stat band removed from program pages:**
- TJ: "on the state level the full-width banner is great, but on the program level it kind of sucks"
- State page stats are genuinely impressive (15 programs, $20K savings). Program page stats are trivial ("6 service areas") or discouraging (waitlist).
- The eligibility check widget is the program page's bold moment — the stat band competed without earning its weight.
- Savings already shown in hero text. Nothing lost.

**`/punch` slash command created** (`.claude/commands/punch.md`):
- Reusable design sharpening tool for any page or component
- Three layers: Design DNA (Wispr Flow + Perena from actual screenshots) → Two Lenses (simplicity/boldness first, character/style second) → Painting Outside the Lines toolkit (width variation, bg shifts, organic elements, typography scale, spacing)
- References `~/Desktop/olera-hq/docs/Design Inspirations/` for Wispr Flow and Perena screenshots
- TJ: "simplicity and boldness are probably even more important" than character/style — reflected in priority order

**Post-mortem:** Texas parallel routes (documented in `docs/POSTMORTEMS.md`, CLAUDE.md, memory)

**Build:** Clean (tsc --noEmit passes). Pushed to Vercel.

**Commits:** `e99b4cf7` → ... → `4106da1f` (10 commits total)

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

