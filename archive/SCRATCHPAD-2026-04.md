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


---

### 2026-04-17 (Session 81) — Two-table problem band-aids: org search + admin directory

**Branches:** `clever-mirzakhani` (merged as PR #582), `admin-directory-union` (PR #583 open)

**The big idea:** Follow up on the two-table diagnosis (TJ's 2026-04-16 Slack). Ship the first two band-aids so providers and admins can find each other while the structural unification P1 ramps up.

**What shipped:**

1. **PR #582 — Organization search union** (merged to staging, promoted path)
   - Rewrote `/api/organization-search` as a true union across `olera-providers` + `business_profiles`, dedup by `source_provider_id`, claim state precedence, `Promise.allSettled` partial-failure tolerance
   - Fixes MedJobs "Your organization" search for franchise locations (Home Instead Houston) + orphan BPs (Aggie Assisted Living)
   - New helper: `lib/organization-search.ts`
   - Real root cause (caught by pre-test review): `hero_image_url` column doesn't exist in `olera-providers` — every OP query was erroring silently. Effy's two prior fixes (aba9f23a, 28aefbbd) tweaked merge logic without touching the broken select

2. **PR #583 — Admin directory union** (open, ready for QA)
   - Surfaces orphan BPs in admin directory search so admins can find user-created providers (172 orphan BPs total, more than Esther's ~110 estimate)
   - Scope locked to Option A: search-triggered union only. Browse-without-search stays OP-only. Detail/PATCH/POST unchanged (defer to unification)
   - BP↔OP category mapping for filter + display (pre-test caught that `assisted_living` vs "Assisted Living" vocabulary mismatch would have silently broken the fix under category filter)
   - UI: "User-created" badge (renamed from "BP-only" — internal jargon), click-through to `/provider/{slug}` new tab, Delete hidden on BP rows
   - Bundled `/slack-notes` slash command for team updates in TJ's voice

**Process improvements:**
- `/slack-notes` slash command created and refined. First draft was too verbose (bulleted outcomes, root-cause paragraph, sign-off emoji). TJ's actual shipped Slack note was 3 sentences: name the problem, what shipped, ask for bug reports. Slash command rewritten with ✅/❌ examples from the actual PR #582 announcements.
- Pre-test reviews caught 2 critical bugs across both PRs — both would have silently hidden the fix: hero_image_url in #582, snake_case categories in #583. Lesson: when a query returns empty, check for silently-swallowed column errors OR vocabulary mismatches before tweaking merge logic.
- Memory `feedback_select_star_admin.md` flagged the `hero_image_url` issue months ago — reading memory at the start of #582 would have caught it before the first implementation attempt.

**Design decisions (both PRs):**

| Date | Decision | Rationale |
| 2026-04-17 | Don't "mirror admin pattern" for org search (ticket's Option A) | Admin has the OPPOSITE bug (misses BP-only orphans). Mirroring would have regressed Aggie visibility. True union is the real fix. |
| 2026-04-17 | Always set `source` field on merged results, even when collapsed | Consumer code in `/provider/onboarding/page.tsx` branches 10+ times on `source`. Preserve the enum even when BP is layered onto OP (set to "olera-providers" when OP is the display source). |
| 2026-04-17 | Admin directory union: search-triggered only, not browse-mode | Admins always use search for specific providers. Browse mode without search is rare. Search-triggered keeps pagination simple and preserves existing fast path. |
| 2026-04-17 | Admin directory: read-only for BP rows (no Delete/edit actions) | Full CRUD parity for BPs requires changes to PATCH endpoint, detail page UI, and navigation. Defer to structural unification P1. "User-created" badge + public-page click-through solves the "can't find" problem. |
| 2026-04-17 | Badge label "User-created" not "BP-only" | "BP-only" is internal DB jargon. "User-created" tells the admin what's actually true — this provider signed up themselves instead of claiming a scraped listing. |
| 2026-04-17 | Slack ship notes: problem-focused, not task- or detail-technical | TJ's voice frames ships by user problem, not code paths. 2-4 sentences, no bullets, no root-cause paragraphs. Captured in `/slack-notes` slash command. |

**Companion Notion work:**
- Filed [admin directory fix ticket](https://www.notion.so/3455903a0ffe81b49d43c73058359bbe) when exploring #582, then shipped it as #583 same day
- PR #582 merge report logged to Product Development > PR Merge Reports

**What's next:**
1. TJ UI-tests PR #583 on Vercel preview (Aggie + Category=Assisted Living, Home Instead Houston regression)
2. Merge #583 to staging → promote staging → main with #582 + #583 together
3. Backfill ~110-172 orphan BPs with `source_provider_id` (separate P2 task per Esther's analysis)
4. Structural unification of `olera-providers` + `business_profiles` (separate P1 — multi-week strangler-fig migration)

### 2026-04-16 (Session 80) — Provider onboard front door: question → profile preview → reviews

**Branch:** `humble-brahe` | **Merged:** PRs #568-575 → staging

**The big idea:** Questions are the front door for providers. A provider who responds to a question on the onboard page should immediately see what their public profile looks like — creating ownership and revealing the reviews gap naturally.

**What shipped (8 PRs merged to staging):**

1. **PR #568 — Inline Q&A response.** Providers respond to questions directly on the onboard page without navigating to /provider/qna. Textarea + "Send Response" in the notification card. Retry-on-401 for the background auth race condition.

2. **PR #569 — Single-card post-response CTA.** After responding, success state flows into "Get your first review" CTA inside the same card. No visual gap, no separate toolkit section to scroll past. "or browse caregiver candidates →" as quiet text link.

3. **PR #570 — Tailwind fix.** `w-4.5` is not a valid Tailwind class. Changed to `w-5`.

4. **PR #572 — 429 retry.** Vercel rate limits during rapid testing caused "Failed to send response." Added 429 to retry logic alongside 401.

5. **PR #574 — Dissolve + Google reviews.** After responding, mascot header + question text dissolve. Reviews section shows real Google stars + count when available, falls back to empty stars for providers without reviews.

6. **PR #575 — Profile preview always visible.** The profile preview (provider identity + Q&A + reviews gap) now renders in BOTH pre- and post-response states. Before answering: shows "1 unanswered question · 0 reviews" + provider identity + "Families searching for senior care in {city} can find this page." After answering: dissolves header, shows Q&A preview + reviews CTA. PlatformShowcase toolkit hidden for notification entries.

**Also in this session (planning, no code):**
- Thorough senior benefits architectural review (structure, SEO, scaling risks)
- Reviewed marketer's Breadcrumb Structure doc (11 pages) — adopted category layer + subpages with refinements
- Reviewed 2026-04-15 product dev meeting + Esther's PRs #547/#548
- Created 15 Notion tickets on Web App Action Items/Roadmap board (11 benefits scaling + 2 provider front door + 1 suspicious sign-ins + 1 reviews messaging)

**Bugs fixed during testing:**
- `.single()` crash in PATCH /api/provider/questions when account has multiple org profiles (detached archived profiles)
- VPN triggering Vercel Attack Challenge Mode (429 on entire domain) — not a code bug, resolved by disabling VPN
- `tfalohun@gmail.com` account cluttered with test profiles causing wrong provider name on sign-in — cleaned up, display_name → "TJ"

**Files changed:**
- `components/provider-onboarding/ActionCard.tsx` — InlineQuestionResponse, ProfilePreviewCard, dissolve logic, Google reviews
- `components/provider-onboarding/SmartDashboardShell.tsx` — hide PlatformShowcase for notification entries
- `components/provider-onboarding/PlatformShowcase.tsx` — copy updates ("Your Olera toolkit", outcome-oriented subtext)

**Design decisions:**

| Date | Decision | Rationale |
| 2026-04-16 | Inline response replaces "View and answer" redirect | Provider came to answer a question. Let them do it where they land. Same API, no context switch. |
| 2026-04-16 | Don't show activity stats for low-traffic providers | 65K+ providers have <10 views/month. Showing small numbers destroys trust. Anchor to the specific moment instead. |
| 2026-04-16 | Single-card CTA, not separate toolkit section | Momentum dies in visual gaps. One primary CTA inside the card preserves post-action energy. |
| 2026-04-16 | "Get your first review" not "Get more reviews" | "More" assumes they have some. "First" meets them where they are. |
| 2026-04-16 | Profile preview as the conversion bridge (mirror concept) | Showing a mirror of their public presence creates ownership. Empty reviews next to populated Q&A creates visual tension more motivating than any copy. |
| 2026-04-16 | Show profile preview BEFORE answering too | Non-answerers (50%+) need trust and awareness. Seeing their own business on Olera creates "you exist here whether you know it or not." |
| 2026-04-16 | Hide PlatformShowcase for notification entries, let the page end | Perena/Wispr principle: treat empty space as confidence, not waste. The profile preview does the conversion work; adding toolkit below dilutes it. |
| 2026-04-16 | Show real Google reviews when available | Static "No reviews yet" is dishonest for providers with Google reviews. Two states: has reviews → amber stars + count + "Get more reviews"; no reviews → gray stars + gap + "Get your first review." |

**What's next:**
1. Test the full flow on staging (VPN off) — pre-response profile preview + response + post-response dissolve + reviews CTA
2. Reviews landing page messaging (Notion ticket): answer "why Olera vs Google?", 3-step how-it-works, integrated suite framing
3. Benefits scaling roadmap: partition pipeline-drafts.ts → state-suffixed names → noindex legacy → category pages

### 2026-04-03 (Session 66) — Browse Card Image Fallback Fix + R2 Migration Plan

**Branch:** `humble-euler` | **PR #475 merged to staging**

**Root Cause Investigation:**
- Provider images on browse pages flickering/broken — traced to `cdn-api.olera.care` CloudFront distribution being dead (DNS resolves to CNAME but CloudFront returns 0 A records)
- ALL ~35K provider image URLs in DB point to this dead CDN
- Some images still appeared to work due to Vercel `/_next/image` cache — ticking clock as caches expire
- `BrowseCard.tsx` had broken fallback: `imgFailed` → logo mode (same broken URL) instead of placeholder

**Fix (Move 1):**
- `components/browse/BrowseCard.tsx`: `imgFailed` now triggers `showPlaceholder` directly instead of `showAsLogo`
- `app/browse/BrowsePageClient.tsx`: Added `imgFailed` state + `onError` handlers (had none before)
- Verified: `ProviderCard.tsx` and `ProviderHeroGallery.tsx` already had correct error handling
- Staging verified: broken cards now show initials + category on gradient, no flickering

**Move 2 (R2 Image Migration):**
- Script: `scripts/migrate-images-to-r2.mjs` — installed `@aws-sdk/client-s3` as devDep
- Optimizations: 20 concurrent workers (global rate limiter at ~30 QPS), direct photo download (follow redirect instead of 2-step), landscape-first photo ranking from API metadata
- Test batch (10 providers): 17 photos → R2, 9 DB updates, 0 errors, all images 200 OK
- Full migration: 72 min, 41,202 photos uploaded, 21,997 DB updated, 0 errors, 7,380 no photos
- Notion backlog: custom domain `images.olera.care` for R2 bucket
- **Next: run `classify-provider-images.mjs` for hero selection**

**Key discovery:** `hero_image_url` column doesn't exist in production DB (TypeScript type has it but DB doesn't). Classification script would need the column created first.

### 2026-04-20 (evening) — Benefits review workflow operational + 3 FL programs shipped

**End-of-day state. Post-compact continuation notes at the bottom.**

**5 PRs merged to staging today (in order):**
- **#602** FL SNAP remediation + Notion-based review workflow introduced (`335f9a8a`)
- **#605** FL Weatherization (WAP) remediation (`f1dcc31b`)
- **#606** Removed "Check if you qualify" widget globally (`37a6895d`)
- **#607** System-wide "your parent" → "your loved one" framing sweep, ~7,900 replacements across 51 states + waiver-library (`9a65c34e`)
- **#608** FL SMMC-LTC remediation + TJ attribution (`5c01f15d`)

Staging head: `5c01f15d`.

### Benefits review workflow — NOW OPERATIONAL

Pivoted from the original state-row queue model to two program-level queues. Admin dashboard demoted to read-only auditor's viewer; reviewers compose findings in Notion Audit Results pages.

**Notion DBs (IDs load-bearing for post-compact resume):**
- **Program Review Queue** — `https://www.notion.so/fb03b87a9918460086ae728ee879b9e2` — data source ID `035ff597-d5ff-4813-b744-6f717e77dbe0`
  - 14 FL program rows seeded (FL SNAP/WAP/SMMC-LTC = Approved; 11 others open)
  - 50 other states NOT seeded yet (decision: seed JIT as TJ begins auditing each state)
  - Columns: Program · State · Program Type · Severity · High-Sev/Total Flags · Flagged Fields · Reviewer · Status · 5 checkboxes (Numbers/Phones/URLs/Tone/FAQ fact-checked) · Live Page · Admin · Source URL · Program ID
  - Row titles always prefixed with state: `FL — SNAP (Supplemental Nutrition Assistance Program)`
- **State Overview Review Queue** — `https://www.notion.so/5c2c64faee88488eac7d04e620891f42` — data source ID `746f7dd0-edde-4e47-b342-24287aac7c03`
  - All 51 states seeded (TX pre-marked Approved — Chantel's March review)
  - 6 checkboxes (Overview copy / Start-here / ByNeed / Quick facts / Cross-program consistency / Tone)
- **Process Guide** — `https://www.notion.so/3475903a0ffe81d0a4ddecf27a6a3fae` — updated to reflect new workflow
- **Old Tier 1 Queue** — renamed to "Benefits QA — Tier 1 Review Queue (LEGACY)" with description pointing to new queues
- **PR Merge Reports parent** — `3135903a-0ffe-81e1-bee6-c3cdabd61965` (publish reports here after every merge)

**Reviewer attribution (critical):**
- `data/benefits-verifiers.ts` — per-program `PROGRAM_VERIFIERS` registry. After each audit, add `"fl:program-id": { slug: "tj-falohun", reviewedAt: "YYYY-MM-DD" }` to surface "Reviewed by TJ Falohun" byline instead of default Dr. DuBose.
- Currently attributed to TJ: `fl:snap-food-benefits`, `fl:weatherization-assistance-program`, `fl:smmc-ltc-hcbs-waivers`
- `getProgramVerifier()` reads this; UI renders in `ProgramPageV3.tsx` byline.

### FL audit progress

| Program | Status | Notion row |
|---------|--------|-----------|
| SNAP | Approved (PR #602) | `3485903a-0ffe-81de-afe2-c1011ca8dea2` |
| Weatherization | Approved (PR #605) | `3485903a-0ffe-816a-a538-c95fdc8f4870` |
| SMMC-LTC | Approved (PR #608) | `3485903a-0ffe-8143-9de2-e471b25af74b` |
| SMMC-LTC Medicare Savings | Not Started | `3485903a-0ffe-81b7-b512-c5fc816d7c9d` |
| PACE | Not Started | `3485903a-0ffe-8177-b56c-e70577ec587d` |
| LIHEAP | Not Started | `3485903a-0ffe-8107-93a9-d9ec605960a8` |
| SHINE | Not Started | `3485903a-0ffe-8142-ab97-de2f71a95bb0` |
| Meals on Wheels | Not Started | `3485903a-0ffe-8161-96d9-cde3df46f57a` |
| ADI Respite | Not Started | `3485903a-0ffe-8185-bd07-ebc30441a576` |
| SCSEP | Not Started | `3485903a-0ffe-81cd-b465-c4ad4fb0ab73` |
| Legal Aid | Not Started | `3485903a-0ffe-8100-a74d-c6823abf64c5` |
| HCE | Not Started | `3485903a-0ffe-8179-b2f4-ee51aee6ace9` |
| CCE (phone flag) | Not Started | `3485903a-0ffe-815f-8bcd-ec210e84a2bf` |
| Elder Options | Not Started | `3485903a-0ffe-811f-ba4d-fd023994e0a7` |

### Workflow conventions locked in this session

- **Audit flow:** TJ audits live page against pre-verified facts I stage in the Notion row → logs findings in Audit Results H2 with issue-type subsections (Numbers / Links / Phone / Copy / Structure / FAQs) → I process into drafts.json → regen drafts.ts → PR → /pr-merge → publish Notion report to PR Merge Reports
- **Pre-verification pattern:** before TJ audits, I pull .gov sources and pre-populate "Pre-verified facts" section at top of each Notion row with income/asset/age/phone/URL/agency data as ground truth
- **Copy rules TJ has flagged:**
  - "What your parent can keep" → "What doesn't count" (GLOBAL, done in #602)
  - "your parent" → "your loved one" (GLOBAL, done in #607 — ~7,900 replacements)
  - **Em dashes are AI-tell, should be removed** (flagged #608 on SMMC-LTC; NOT yet swept globally)
- **Audience framing:** works for adult children, spouses, siblings, self-applicants, friends. Default to "loved one" unless describing a specific relationship role.

### IMMEDIATE NEXT UP — em-dash sweep (pending compact)

**Scope:** Remove em dashes (`—` U+2014) across all benefits content. System-wide sweep analogous to PR #607's "loved one" sweep.

**Files to sweep:**
- `data/pipeline/*/drafts.json` (51 files)
- `data/waiver-library.ts`
- Regenerate drafts.ts via `node scripts/benefits-pipeline.js --regen-index`

**Replacement strategy (from my analysis, TJ hasn't explicitly specified):**
- `X — Y` → `X, Y` (most common; works in most contexts)
- `X — Y.` → `X. Y.` (restructure to period when — introduces independent clause)
- Use judgment per context: comma, colon, period, or restructure

**Cautions:**
- Em dashes inside legitimate program names / proper nouns should stay (rare but possible)
- Some em dashes legitimately punctuate parenthetical asides — decide per occurrence (probably keep as `,` wrap)

**Branch name:** `chore/em-dash-sweep`
**Approach:** sed-based sweep like #607, validate JSON, regen, typecheck, PR

### After em-dash sweep — continuing FL audits

TJ's auditing pattern:
1. Pick next FL program (suggest by traffic/severity — CCE has phone flag so touch it; otherwise PACE or MSP as next high-traffic programs)
2. I pre-verify .gov sources → stage in Notion row
3. TJ audits, logs findings
4. I process, PR, merge, Notion report

**After FL is done:** Tier 1 priority queue per Process Guide — OH HEAP (70% income error — worst single flag in queue) → IN → NC → NY. These 4 states need Program Review Queue rows seeded JIT when TJ's ready.

### Other open items

- **Admin dashboard counter gap** (non-blocking): admin/benefits state cards count `pipeline-draft` vs `approved/published`, but programs in `under-review` status fall through both counts. Per-program badge still renders correctly. Separate follow-up ticket if worth fixing.
- **CTA Link buttons** elsewhere saying "Check if you qualify" (in shadow routes, ChecklistClient) still exist — PR #606 only removed the inline widget. TJ aware; separate decision if he wants those killed too.

### Post-compact resume instructions

If starting fresh post-compact, the key handoff points:
1. **Context doc:** this SCRATCHPAD entry is the authoritative state
2. **Next action:** em-dash sweep (branch `chore/em-dash-sweep` not yet created)
3. **Branch convention:** off `origin/staging`, PR back to `staging`, merge with `--admin` flag
4. **Worktree:** `/Users/tfalohun/.claude-worktrees/olera-web/sparky-bohr` (sparky-bohr branch merged but worktree persists)
5. **Admin bypass pattern:** `gh pr merge <N> --merge --delete-branch --admin` — local checkout step fails because staging worktree is at `/speedy-jemison`, but server-side merge succeeds

---

### 2026-04-20 (afternoon) — PR #603 reviewed_at merged to staging ✅

Delivered the PR 2 scope promised in #601. Now live on staging at commit `5ff8d2a4`.

**PR**: https://github.com/olera-care/olera-web/pull/603 (merged 2026-04-20 @ 19:11 UTC via squash + admin bypass)

**What shipped:**
- New `reviewed_at timestamptz` column on `content_articles` (migration `043_article_reviewed_at.sql`)
- Admin **Dates** section in `/admin/content/[articleId]` — side-by-side Published/Verified pickers + "Mark reviewed" quick button that stamps `NOW()`
- `reviewed_at` added to `EDITABLE_FIELDS` allowlist in PATCH route
- Public byline on `/caregiver-support/[slug]` and `/texas/[slug]` shows `Verified [date]` when `reviewed_at` is non-null (pre-migration: renders clean with no claim)

**Why the separate column (not reuse `updated_at`):** `updated_at` bumps on any admin save — it's a dirty signal, and was bulk-tainted on 2025-03-07. `reviewed_at` is set *only* by explicit admin action (button or picker), so the "Verified [date]" claim is truthful.

**Pre-test review:** 0 bugs. Two non-blocking observations (both pre-existing):
- 🟢 ISR 60s cache lag between admin save and public page (no `revalidatePath` on PATCH — pre-existing across all admin edits)
- 🟢 Late-night "Mark reviewed" clicks in PT/ET produce tomorrow's UTC date (negligible during business hours)

**Merge analysis:** zero file overlap with staging. 7 critical watchlist files verified unchanged post-merge (Footer discovery zone, AuthProvider 24hr cache, 108 permanent redirects in next.config, self-hosted fonts + GA4, Navbar, middleware, types/content).

**Notion report:** https://www.notion.so/3485903a0ffe8101865dd333d00f0437

### Blocked / Pending manual step

⚠️ **Migration 043 not yet applied to Supabase.** TJ will apply via dashboard SQL editor when QA'ing. SQL is safe/additive:
```sql
ALTER TABLE content_articles ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
```
Public pages are null-safe pre-migration — no "Verified [date]" claim appears until admin stamps it.

### Out of scope (deliberately deferred from #603)

- `/admin/benefits` per-program `lastVerifiedDate` overrides — different plumbing (pipeline data, not DB column)
- Making `updated_at` user-editable — leaving auto-managed-on-save intact
- Optional backfill script to set `reviewed_at` on articles actually reviewed on Mar 7
- Adding `revalidatePath` to admin PATCH route to eliminate the 60s lag — would affect every admin edit, scope for a separate PR

---

### 2026-04-20 — Verified-by byline across editorial surfaces (PR #601, READY FOR QA)

Recovered Chantel's orphan commit `0dd777b6` (Add verified-by reviewer support for articles) from the tip of `waiver-library-redesign` — single commit stranded when that long-lived branch merged in chunks and this one missed every PR. Extended it into a proper byline system across four surfaces.

**PR**: https://github.com/olera-care/olera-web/pull/601 (branch: `feature/article-verified-by`)

**Surfaces touched:**
- `/caregiver-support/[slug]` (83 articles) — new byline with `Published by` / `Written by` / `Verified by` distinctions
- `/texas/[slug]` — existing verifier (hardcoded Dr. DuBose) made DB-overridable with fallback
- `StatePageV3` (50 state benefits pages) — new `Reviewed by Dr. Logan DuBose` strip
- `ProgramPageV3` (~500 program pages) — strip with `lastVerifiedDate`/`reviewedAt` surfacing

**Key decisions (honest > posturing):**
- **Dropped "Medically reviewed by"** — felt like posturing. Settled on plain "Reviewed by" on state/program pages and "Verified by" on articles.
- **Collapsed byline when author === reviewer** — `Dr. DuBose · Verified by Dr. DuBose` read as double-signature redundancy. Now shows single name via `lib/article-byline.ts::getBylineRules`.
- **Added "Published by Olera team" explicit segment** when author is org-level — previously hidden via `showAuthorCard`, which left `[reviewer avatar] Verified by Dr. DuBose · Verified [date]` reading as "two Verifieds." Now: `Published by Olera team · Verified by Dr. DuBose · [date]`.
- **Dropped the "Verified [date]" claim everywhere.** Our only signal was `content_articles.updated_at`, which got bulk-refreshed across all 83 articles on 2025-03-07 (CMS import or schema touch). Every article was falsely claiming "Verified Mar 7, 2025." Now shows only `published_at` naked on articles. Program pages show `lastVerifiedDate`/`reviewedAt` only when hand-curated in pipeline data (accurate). State pages: no date (no state-level verification signal exists).
- **Migration `042_article_reviewer_fields.sql` not auto-applied** — nullable columns + scoped seed UPDATE. Preview works without it via hardcoded Dr. DuBose fallback. Apply via Supabase dashboard when happy with the look.

**Pre-test catches this session:**
- 🔴 Admin `EDITABLE_FIELDS` allowlist in `/api/admin/content/[articleId]/route.ts` didn't include `reviewer_name` / `reviewer_role` — dropdown would have silently dropped values on PATCH. Fixed before TJ tested.
- 🟢 Unused `updatedAt` local in caregiver-support — removed.

**Bonus diagnosis:**
- Vercel mis-attributing Chantel's deploys to Logan = her git config has `chantelwright@chantels-MacBook-Air.local` as author email (macOS default when `user.email` was never set). `.local` emails don't match any Vercel team member, so fallback attribution kicks in. One-line fix on her side: `git config --global user.email <her-github-email>`.

**Next up — PR 2 scope (admin editability):**
- Add proper `reviewed_at timestamptz` column + "Mark as reviewed" button in `/admin/content/[articleId]`
- Editable Published/Updated/Verified date inputs with smart server-side defaults (empty published_at → NOW() on publish; updated_at → NOW() on save)
- Override `lastVerifiedDate` per program in `/admin/benefits`
- Once shipped, reintroduce `Verified [date]` claim on articles — truthful because it'll only set when admin explicitly clicks
### 2026-04-20 — Benefits review workflow pivot + FL SNAP remediation

PR #602 open against staging: https://github.com/olera-care/olera-web/pull/602 (branch `sparky-bohr`)

**What happened:**
- Dogfooded the Tier 1 review process on FL (lightest — 14 programs, 2 high-sev flags)
- While auditing SNAP, TJ surfaced 7 classes of issue the rigid per-field admin comment format couldn't hold: numeric, broken links, wrong phone, missing mechanics, voice/audience framing, FAQ verbosity, structural confusion (Senior SNAP ↔ general SNAP)
- Admin comment format captures ~20% of real review signal. Shifted composing space to each state's Notion row under a new **Audit Results** H2 (H3 per program + bullets grouped by Numbers / Links / Phone / Copy / Structure / FAQs)
- Admin dashboard demoted to read-only auditor's view

**Code changes (PR #602):**
- `data/pipeline/FL/drafts.json` + regenerated `drafts.ts` — FL SNAP patches:
  - `income_1: $1,255 → $2,610`, `income_2: $1,703 → $3,525` (200% FPL — FL uses BBCE for seniors, not 100% FPL baseline)
  - Phone `1-866-762-2237 → (850) 300-4323` (official DCF Customer Call Center)
  - Broken `myflfamilies.com/service-programs/access/` → `myaccess.myflfamilies.com`
  - Added 3 contentSections callouts: ESAP senior pathway (tip), benefit calc formula (info), Healthy SNAP restrictions effective 2026-04-20 (warning)
  - Tightened 6 FAQs (removed cross-answer repetition) + added 1 new FAQ on Healthy SNAP
  - `contentStatus: "under-review"`, `reviewedBy: "TJ"`, `lastVerifiedDate: 2026-04-20`
- `components/waiver-library/ProgramPageV3.tsx` + `ProgramPageV2.tsx` — label "What your parent can keep" → "What doesn't count" (global fix — works for adult children, spouses, self-advocates, self-applicants)
- `data/pipeline-drafts-types.ts` — `PipelineDraft` gains optional `reviewedBy`/`reviewedAt`/`lastVerifiedDate` per documented v2 lifecycle spec

**Notion changes (no code):**
- Process Guide: new "Composing space: the Audit Results section" block; Step 1 numeric-action rewritten; "Where things live" updated; promotion section updated
- All 4 remaining Tier 1 rows (IN, NC, OH, NY) got the Audit Results scaffold appended + obsolete dashboard-comment references cleaned up
- FL row is the canonical example — TJ's SNAP audit was the template

**Pre-test review (pre-test command run):** 0 bugs. One cosmetic flag (not a bug in this commit): admin state counter doesn't count "under-review" separately — programs in that status fall through both "drafted" and "approved" counts. Per-program badge still renders correctly. Separate follow-up candidate.

**Key decisions:**
- Kept `age: 60` on SNAP despite factcheck flagging 60→65 (ESAP pathway uses 60+; factcheck parser quirk documented in process guide)
- Kept `assets_individual/couple: 4500` (elderly/disabled limit — verified against DCF, not the $3,000 non-senior limit)
- Did NOT split SNAP into two programs for ESAP — one page with an ESAP callout is cleaner than two parallel entries for what's fundamentally one benefit with two application tracks

### Next up
- TJ continues auditing the remaining 13 FL programs using the new Audit Results pattern (Weatherization has real numeric flags; then LIHEAP, Medicaid, etc.)
- After FL is fully audited + approved, move to Tier 1 priority queue: IN (P1, 6 high-sev), NC (P2), OH (P3 — HEAP 70% error is the single worst in the queue), NY (P4)
- Separate low-priority follow-up: add "under-review" count to admin state card

### 2026-04-19 — Benefits SEO day (all 4 P1s shipped)

Four PRs in sequence, each unblocking the next. Entire benefits-SEO quadrant of the P1 roadmap closed.

- **Append state to program names** — MERGED ✅ (PR #595, 2026-04-19, staging @ `6791af5d`)
  - New pure helper `lib/program-name.ts::getDisplayName(program, state)` with skip-suffix detection (state name OR 2-letter abbreviation as standalone word)
  - Zero runtime deps — client-component-safe (doesn't pull waiver-library / pipeline-drafts into client bundle)
  - Updates: `generateMetadata` title/OG on program pages (main + Texas parallel), `ProgramPageV3` H1 + breadcrumb last-crumb, `StatePageV3` program list rows (×2)
  - New 3-item BreadcrumbList JSON-LD on both program routes (Hub → State → Program)
  - /pre-test pivot: initially put helper in `lib/program-data.ts` but that would have bundle-bloated the client. Moved to pure-deps file. Lesson: audit helper's source file imports before importing into client components.
  - Notion report: https://www.notion.so/3475903a0ffe81dd803dfa8ac160c87e

- **Benefits URL Canonicalization** — MERGED ✅ (PR #592, 2026-04-19, staging @ `99556606`)
  - Notion ticket literally asked for `robots: noindex`, but /explore revealed the Tier 7 redirects already made that a no-op. Real issue: `/senior-benefits/:state/:benefit` redirect dropped `:benefit`, sending Google to the state page. Plus sitemap emitted non-canonical `/senior-benefits/*` URLs.
  - Fix: `next.config.ts` redirects preserve `:benefit`; `buildStateUrl/buildProgramUrl` emit canonical `/benefits/...` for non-Texas; `buildWaiverLibraryUrl` aligned
  - Texas stays on parallel URL — TX_OLD_TO_NEW reconciliation is a separate ticket
  - Notion report: https://www.notion.so/3475903a0ffe81ecac7ddf63709d7b9d

- **Sitemap: Pipeline-Only States** — MERGED ✅ (PR #590, 2026-04-19, staging @ `ea4a541f`)
  - Problem: `app/api/sitemap/route.ts` iterated waiver-library states only → DC (only pipeline-only state today) was invisible to Google
  - Fix: added `pipelineDrafts` loop after waiver-library loop with `isRegion` filter; `SLUG_TO_ABBREV` / `ABBREV_TO_SLUG` maps mirrored from `lib/program-data.ts`
  - /pre-test caught: orphan-programs block (ported from the dead shadow `app/sitemap.ts`) would have emitted ~12 redirect-only duplicate URLs for Texas because pipeline v3 IDs don't match waiver-library legacy IDs. Scoped down to pipeline-only STATES only.
  - Notion report: https://www.notion.so/3475903a0ffe812ea201fa0a27411994

- **Pipeline Drafts Partition** — MERGED ✅ (PR #587, 2026-04-19, staging @ `ce1ff9df`)
  - 114,388 lines → 127-line barrel + 51 per-state `data/pipeline/{STATE}/drafts.ts` files
  - New `data/pipeline-drafts-types.ts` (hand-maintained) breaks the circular import
  - New `--regen-index` CLI flag on `scripts/benefits-pipeline.js` re-renders all per-state files
  - Default pipeline runs now write only active state's drafts.ts + barrel
  - Atomic tmp+rename writes; identSafe prefixes `_` to handle digit-leading/reserved-word region slugs
  - Deep-equal of all 51 states against pre-partition monolith confirmed byte-identical
  - Unblocks ~1,900 new benefits routes (category pages + program subpages)
  - Out of scope (follow-up): `data/pipeline-summary.ts` (368 KB sibling, same pattern)
  - Notion report: https://www.notion.so/3475903a0ffe8130ad1ff70833c836be

### 2026-04-19 (evening) — Strategic pivot: Category Pages P1 retired

Pulled the top P1 🔥 ("Category pages per state") for exploration and, on critical review, retired it. The UX job is already solved by the inline category pills on `StatePageV3.tsx:722-810` + `getCategory()` in `lib/waiver-category.ts` — pills with live counts, one-click filter. The only unshipped piece was crawlable URLs at state × category grain, i.e. pure SEO bet.

Killed it because:
- **Same structural bet as city pages, which already failed.** Per `zen-perlman` analysis, city × care-type pages sit at position 35-60 with near-zero CTR due to DA ~5 vs competitors DA 60-75. No mechanism by which state × category ranks better on the same domain.
- **Reinforces a content group already flagged dead in the SEO Running Thread.** `/state/` at CTR 0.08% position 48.9; adding 200 pages below that hub compounds the problem instead of fixing it.
- **Hidden content cost** — 200 pages need per-category intro copy to avoid thin-content doorway classification. Pipeline drafts are program-level, not category-level. Editorial workstream wasn't in the 1-2 day estimate.
- **Algorithm tailwind against us** — Google HCU + 2024 core updates specifically target programmatic SEO at scale.

Actions taken:
- Demoted the Notion ticket to Backlog priority + page-level comment pointing to reasoning: https://www.notion.so/3445903a0ffe81c3b622f42960e0b3c5
- Full reasoning logged as mid-week addendum in SEO Running Thread: https://www.notion.so/3455903a0ffe81888526d1f4bdf7e1f4
- Meta-note in the Running Thread: **first time a prior-documented Pattern (content-group ROI ranking) directly retired an incoming P1** — exactly what that doc was built to do.

Spun off a follow-up task instead — the same reasoning discipline applied to the BCBS/VA caregiver-page question TJ raised:
- **Freshness audit across /caregiver-support/ (83 articles)** — P2, Olera Action Items board (not Web App — see new memory `feedback_notion_board_split.md`): https://www.notion.so/3475903a0ffe81349dbee7ba16082370
- Data job, not editorial. Run `diagnose_editorial_decay.py` across all 83 URLs → ranked decay list → feeds Logan's refresh queue data-driven, not vibes-driven.
- Doesn't block on VA refresh; the decision to *act* on the audit list depends on whether VA refresh lifts position after ship.

Prereq PRs shipped earlier today (#587 partition, #590 sitemap, #592 canonicalization, #595 state-in-program-name) stand on their own merits — no sunk cost.

### Next up (P1 🔥 queue)

- (Category Pages per state — **RETIRED → Backlog, 2026-04-19**. See above. If revisited, pilot shape only: one category × 10-15 strong states, 60-90 day measurement before scaling.)
- **Make sure we have a thoughtful data/code/system backup system in place** (P2) — now the highest-priority outstanding item on the Web App board.

### Standalone follow-ups (low priority)

- `data/pipeline-summary.ts` (368 KB sibling monolith) — same partition pattern as PR #587. Not blocking anything.
- Texas `/texas/benefits/:slug` URL reconciliation — requires TX_OLD_TO_NEW slug mapping awareness in `/benefits/[slug]/[program]` resolver.
- Dead `/senior-benefits/*` route handlers in `app/senior-benefits/` — redirects make them unreachable; cleanup not urgent.
- Dead `app/sitemap.ts` — shadowed by rewrite to `/api/sitemap`. Cleanup ticket.
- `navigator.share` title in `ProgramPageV3` still uses `program.name` (not `getDisplayName`). Minor UX inconsistency.

- **Admin Directory Union** (branch: `admin-directory-union`) — MERGED ✅ (PR #583, 2026-04-17)
  - Notion: [Fix admin directory search hiding orphan business_profiles](https://www.notion.so/3455903a0ffe81b49d43c73058359bbe)
  - Fix: search-triggered union with orphan BPs (`source_provider_id IS NULL, type IN (organization, caregiver)`); BP↔OP category mapping (snake_case ↔ title-case); "User-created" badge on BP rows, click-through opens public page, Delete hidden on BP rows
  - Confirmed working in admin Activity Center (orphan BPs like `aggie-assisted-living-college-station-tx-166r` now visible with `suspicious_claim` flag)
  - Also bundled `/slack-notes` slash command in same PR

- **Organization Search Union Rewrite** — MERGED ✅ (PR #582, 2026-04-17)
  - Fixed MedJobs "Your organization" search for franchise locations (Home Instead Houston)
  - True union across olera-providers + business_profiles via canonical identity dedup
  - Actual root cause: `hero_image_url` column doesn't exist in olera-providers — all OP queries were erroring silently. Two prior fix attempts never touched the column
  - Helper module: `lib/organization-search.ts`
  - Plan: `plans/organization-search-union-rewrite-plan.md`

- **Aging in America — Framer → Olera Web Migration** (branch: `thirsty-hugle`) — IN PROGRESS
  - Migrating aginginamerica.co (Framer) into olera.care/aging-in-america
  - Dark cinematic landing page with season accordion + episode detail pages
  - Design refs: bfnadocs.org (primary), thewhy.dk (season accordion), water.org (human storytelling), NYT Op-Docs (clean grid)
  - Data file: `lib/aging-in-america-data.ts` — all S1 (3 eps) + S2 (trailer + 4 eps) content
  - Components: HeroSection, AboutSection, SeasonAccordion, EpisodeCard, YouTubePlayer, CtaSection
  - Pages: `/aging-in-america` (index) + `/aging-in-america/[slug]` (detail)
  - **BLOCKED: Need YouTube video IDs** for S2 episodes (Carol Dean, Rob Arnold, Jason Goldstein, Robert Sutton) — marked as TODO in data file
  - Build passes clean, all routes generating
  - Plan: `plans/aging-in-america-plan.md`
  - **Next**: Get YouTube IDs from TJ, responsive polish, update homepage CommunitySection link, sitemap

- **Homepage De-Jank + Mega Menu + Search Bar Polish** (branch: `gifted-rosalind`) — READY FOR QA
  - Fixed mega menu flicker: redesigned hover architecture — backdrop `onMouseEnter` as leave detector instead of fragile `onMouseLeave` on panel
  - Fixed search bar height shift: `truncate` on care type label prevents "Independent Living" from wrapping
  - Fixed hero dropdown z-index: stacking context was `z-10`, trapping dropdowns behind provider card hearts — bumped to `z-20`
  - De-janked search bar inputs: `transition-colors` → `transition-all` for smooth ring animation, fixed heights (`h-12`)
  - Redesigned care type dropdown: entrance animation, rounded pill items, primary dot selection indicator
  - Removed decorative heart icon from care type trigger
  - Files changed: `Navbar.tsx`, `FindCareMegaMenu.tsx`, `HeroSection.tsx`, `globals.css`

- **Provider Image Migration to R2** — DONE ✅
  - `cdn-api.olera.care` CloudFront was dead → 33,319 providers with broken image URLs
  - Browse card fallback fix merged (PR #475)
  - Migration completed: 72 min, 41,202 photos uploaded, 21,997 DB rows updated, 0 errors
  - 7,380 providers had no photos on Google → still show initials placeholder
  - Images live on `pub-e9cff84835324ecca87386d81c641a56.r2.dev`, verified on production
  - Backlog: custom domain `images.olera.care` → [Notion ticket](https://www.notion.so/3375903a0ffe8199b1f6e381b3f4c87a)
  - **Next: run `classify-provider-images.mjs` to pick hero images**

- **Provider Page CTA Conversion Redesign — 2026-04-02** — PUSHED TO `fine-dijkstra`, TESTING ON VERCEL PREVIEW
  - **Problem**: Provider page CTA converts at 0.44%. Getting to 3% = 329 connections/month (6.9x increase).
  - Email-only form, post-submit enrichment with localized pricing, care report email
  - **Branch**: `fine-dijkstra` — 10 commits, pushed to origin
  - **Next**: PR to staging → QA → monitor conversion vs 0.44% baseline

- **City Expansion Batch — 2026-04-17** — DONE ✅
  - 185 cities processed end-to-end (small suburbs, pop 16K-19K)
  - Discovery: 31,745 raw providers (1h46m, quick mode, 1 transient connection error auto-recovered)
  - Pipeline: cleaned → uploaded → enriched, total runtime 2h52m
  - **2,312 active providers across 179 cities** (main batch)
  - Cost: discovery $187 + pipeline $231 = **$418 total** (vs $4,625 original estimate — ~$2.26/city)
  - Enrichment: 1,016 trust-signals confirmed, 1,465 deleted as false positives (unified entity+trust check working well), 2,937 review snippets, 2,345 images
  - Spot-check came back clean on all 6 dimensions (0 out-of-state coords, 0 null place_ids, 0 invalid categories, 0 LLC/Inc name suffixes, 0 slug collisions)
  - **Diagnosed stale-checkout bug, not a code regression**: 6 pre-existing cities initially came back "empty" because the script I was running was from `~/Desktop/olera-web` on `fix/dedupe-tier3` (494 commits behind staging). That stale copy was missing the `.eq('deleted', false)` filter on phaseClean dedup and phaseLoad "already in DB" count. Staging already has the fix — running from a worktree off staging would've avoided the issue. Applied the same fix manually to the stale script, re-ran the 6 cities → salvaged 4 real providers in Round Lake IL (other 5 correctly re-classified as false positives). Memory added: always run pipeline-batch.js from a fresh worktree.
  - 185 Notion pages created + flipped to Complete
  - **Next**: monitor a few city pages on olera.care after ISR warm (1 hr)
  - Expansion board: previous 476 Complete + 185 = **~661 Complete cities**

- **City Expansion Batch — 2026-04-04** — DONE ✅
  - 193 new cities processed end-to-end via batch pipeline
  - Discovery: ~35,000 raw providers (53 min, quick mode)
  - Pipeline: cleaned → uploaded → enriched, total cost ~$263 (~$1.36/city)
  - Fixed `pipeline-batch.js`: removed redundant re-hydration loop (22K sequential Supabase writes) that hung the pipeline for 16+ hours — Stream D and Stream B already handled the same work
  - 193 Notion pages created + all marked Complete
  - Spot-checked 4 cities (Birmingham MI, Fort Walton Beach FL, Golden CO, Makakilo HI) — all rendering with ratings, reviews, images, descriptions, trust signals
  - Updated city pipeline cost estimator: actual ~$4/city, not $25/city
  - Added postmortem for the re-hydration hang to `docs/POSTMORTEMS.md`
  - Added batch script debugging guidance to `/troubleshoot` command
  - **Notion board: 476 Complete cities (283 prior + 193 new)**

- **City Expansion Batch — 2026-04-01** — DONE ✅
  - 90 new cities processed end-to-end via batch pipeline
  - Discovery: 18,191 raw providers (45 min, ~$102 Google Places)
  - Pipeline: cleaned → uploaded → enriched across all 343 cities (6h 21m, ~$323)
  - 13,814 total providers in DB after dedup + AI verification
  - Fixed `pipeline-batch.js`: added `relax_quotes: true` + `relax_column_count: true` + try-catch for malformed CSVs
  - 90 Notion pages created, all marked Complete
  - Live site verified: providers rendering with ratings/reviews on olera.care
  - Total cost: ~$425
  - **Notion board: 283 Complete cities (193 prior + 90 new), 7 Planning remain**

- **Strict User Account Type Separation** (branch: `feature/user-accounts-separation-logic`) — READY FOR MERGE (PR #463)
  - **22 commits**, clean fast-forward from staging, no conflicts
  - **Phase 1**: Fix broken provider experience (stop auto-creating family profiles, fix menus/dropdowns, account settings by type)
  - **Phase 2**: Block family-only actions (save buttons, connection card, server-side guards, guest provider email detection)
  - **Auth flow fix**: Sign out existing session when provider creates family account with different email
  - **Context-aware navigation**: Logo redirects to "home base" by account type (family→/, provider→/for-providers, caregiver→/medjobs). Hide MedJobs/For Providers from family accounts in nav.
  - **Cleanup**: Removed obsolete "Remove this profile" (154 lines), updated save tooltips to dark style
  - **Principle**: One email = one account type. No mixing. Defense in depth (UI → API → email check)
  - **PR URL**: https://github.com/olera-care/olera-web/pull/463
  - **Testing**: Provider logged in → sees blocking UI on save/connect. Guest with provider email → "Provider email detected" UI. Family users unaffected.

- **Staging → Main Promotion** — IN PROGRESS
  - Audited full staging diff: 253 commits, 225 files changed, ~31K lines across ~90 PRs
  - Key areas: one-click onboarding, provider dashboard, MedJobs, reviews, activity center, email revamp, highlights waterfall, city expansion, admin improvements
  - Caught missing PR #435 (funny-turing nav cleanup + 2-card PlatformShowcase) — rebased and merged
  - Caught PR #438 (breadcrumb fix) would silently regress Navbar — rebased and merged clean
  - **Next: Continue merging remaining open PRs, then promote staging → main**

- **MedJobs Candidates Redesign** (branch: `keen-perlman`) — MERGED ✅ (PR #436)
  - Dense scannable list rows, infinite scroll, shared CandidateRow/CandidateFilters
  - **Next: Detail page taste pass, test auth flow end-to-end**

- **Provider Onboard + Nav Cleanup** (branch: `funny-turing`) — MERGED ✅ (PR #433 + #435)
  - Onboard: profile-editor → platform showcase with 2 cards (Families + Hire Staff)
  - Nav: Home | Find Families | Hire Staff, conditional Inbox/Leads, Q&A/Reviews hidden
  - MedJobs provider experience: photo cards + aspirational empty state

- **SEO: Breadcrumb Fix** (branch: `helpful-mendel`) — MERGED ✅ (PR #438)
  - Fixed 3,082 GSC errors: added `item` URL to final breadcrumb entry across 7 page types
  - Need to trigger GSC validation after staging deploys

- **SEO: City/Browse Page Optimization** (branch: `zen-perlman`) — ANALYSIS COMPLETE, IMPLEMENTATION NEXT
  - GSC 7-day report analyzed (Mar 19-25): 690K impressions, 2.7K clicks, 0.4% CTR, avg position 26.7
  - City pages ranking position 35-60 for "[care type] [city]" queries — massive impressions, near-zero clicks
  - Root cause: content thinness + domain authority gap (DA ~5 vs competitors DA 60-75)
  - Caregiver articles are SEO engine (positions 4-6) but authority doesn't flow to city pages
  - Full analysis + action plan in Notion: https://www.notion.so/3305903a0ffe818bbd86e106f8dbfb26
  - **Next: Implement Action 1 (city-specific content sections) + Action 2 (internal linking) + Action 3 (structured data)**

- **DNS Cutover v1.0 → v2.0** (branch: `peaceful-wiles`) — DONE ✅
  - olera.care now serving v2.0 Next.js app via Vercel
  - Provider slug migration done (008 + 009): 477/500 top GSC pages passing
  - Sitemap fixed: `/sitemap.xml` → sitemap index + dynamic API shards
  - OG image replaced: shutterstock caregiver photo (1200x630)
  - GSC sitemap submitted: 4,943 pages in shard 0 (provider shards auto-discovered via index)
  - Reviews API hotfix: GET switched to anon client (was 5xx from service key dependency)
  - All PRs merged, main ↔ staging fully synced

- **Migration Quick Wins + SEO + Traffic Recovery** (branch: `stellar-stonebraker`) — DONE ✅
  - PRs #165-171 all merged to staging

- **Editorial Content Polish** (branch: `stellar-stonebraker`) — DONE ✅
  - PRs #172-176 all merged to staging
  - Author pages at `/author/[slug]` with Person JSON-LD
  - Topic-based filter tabs (6 categories replacing care_type tabs)
  - Author linking in article bylines + avatar fallback to static data
  - CMS admin: author dropdown + topic category dropdown
  - OG/Twitter metadata audit — all page types now have full social previews
  - LinkedIn URLs corrected for TJ and Logan

- **Surface Approved Providers in Public Search** (branch: `vibrant-keller`) — DONE ✅
  - Approved business_profiles now appear in all 4 public discovery surfaces
  - Parallel queries with deduplication via source_provider_id

- **Leadership Team Page** (branch: `joyful-goodall`) — DONE ✅
  - PR #106 merged to staging
  - New `/team` page with editorial design, scroll animations, expanded bios
  - Crosslink from `/for-providers` LeadershipSection, footer link, sitemap entry

- **Admin Silent Failures Fix** (branch: `joyful-goodall`) — DONE ✅
  - PR #108 merged to staging
  - Error banners on 5 admin pages: overview, images, leads, providers, team
  - Replaced `alert()` with inline banners on team page

- **Raw `<img>` Tags Fix** (branch: `joyful-goodall`) — DONE ✅
  - PR #107 merged to staging
  - Swapped 4 raw `<img>` → `next/image` in caregiver-support page

- **Research & Press Blog Section** (branch: `fine-wright`) — DONE ✅

- **Caregiver Support Editorial Redesign** (branch: `joyful-turing`) — DONE ✅

- **v1.0 → v2.0 Migration Playbook** (branch: `seo/structured-data-p1`) — REDIRECTS COMPLETE
  - **Remaining:** P2 SEO polish, CMS migration, DNS cutover ops

- **Migration Sanity Check** (branch: `helpful-williams`) — DONE ✅
  - PR #152: Full audit of v1.0 codebase against v2.0
  - Found 13 gaps not in original playbook; fixed 11 in this session
  - Added 14 redirect rules (next.config.ts) + 2 middleware rules
  - Expanded sitemap with `generateSitemaps()`, articles, waiver library, browse pages
  - Created `docs/migration-sanity-check.md` tracking all findings
  - Created `docs/cutover-runbook.md` — step-by-step DNS cutover with pre-flight, rollback
  - Item #1 (gated provider portal page) assigned to Esther
  - Items #12, #13 are monitor-only (research-and-press redirect verify, forum content loss)

- **Senior Benefits Finder Voice + Results Redesign** — MERGED TO STAGING ✅
  - PR #256 merged 2026-03-13 → staging at `3c14db7`
  - Combined work from `guided-voice-sbf` + `results-redesign-sbf` into `sbf-voice-and-results-redesign`
  - **Voice Input (Phases 1-7):**
    - Speech recognition hook, voice intent parser, guided mode with conversational prompts
    - TTS audio narration via Web Speech Synthesis API (narrates each question, mic auto-starts after)
    - Mode selection: "Fill it out myself" (primary) / "Talk through it" (secondary)
    - Browser detection: disables voice on unsupported browsers
    - Auth gate removed from submit — results shown to everyone, auth on bookmark only
  - **Results Redesign (Progressive Disclosure):**
    - "Great news" header with savings estimate folded into one line
    - "Recommended First Step" hero card with "When you call, say this" script
    - Confidence bars (green/amber/gray) replacing tier labels
    - Savings badges ($X–$Y/mo) on program cards
    - "How to Apply" numbered steps generated from existing data
    - Progressive reveal: top 5 programs, "See X more" button for rest
    - Document checklist collapsed behind toggle (4 category cards, 20 items)
    - Print: expands all programs + checklist, hides nav/sidebar/interactive
    - Removed: SaveResultsBanner, FinancialImpactDashboard (folded into header), ActionPlan (replaced by hero), standalone AAA card
  - **New files:** 13 components, 3 hooks, 2 plans, voice-intent-parser, speech-recognition types
  - **Design principle:** Progressive disclosure — 3 beats: (1) moment of relief, (2) explore at your pace, (3) tools when ready

- **Provider Email Outreach Revamp** (branch: `joyful-pasteur`) — DONE ✅
  - PR #354 merged
  - Rewrite 3 provider-facing emails (question, connection, review) from cold → warm/trust-building

- **City Pipeline: Sunrise Manor, NV** (branch: `bright-dijkstra`) — DONE ✅
  - 632 discovered → 315 active providers after 3 rounds of filtering
  - All enrichment complete: descriptions, reviews, images, trust signals
  - Notion: all 14 checkboxes checked, status Complete

- **Ramapo, NY City Expansion** (branch: `great-euler`, no code changes) — COMPLETE ✅
  - Full pipeline: discovery → classification → upload → enrichment
  - 204 legitimate providers across 6 categories

- **Greece, NY City Expansion** (branch: `silly-thompson`, no code changes) — COMPLETE ✅
  - Full pipeline: discovery → classification → dedup → upload → geocoding → parallel enrichment
  - 109 legitimate providers across 6 categories
  - Notion: all 14 checkboxes checked, status Complete

- **Batch Pipeline Optimization** (branch: `silly-thompson`) — IMPLEMENTED, NEEDS E2E TEST
  - Plan: `plans/batch-pipeline-optimization-plan.md`
  - `scripts/discovery-batch.py` — non-interactive batch discovery with `--batch` CLI
  - `scripts/pipeline-batch.js` — 4-phase processor (clean/load/enrich/finalize)
  - Clean phase validated: 3 cities processed, dedup CSV loaded once, AI batch-50 working
  - `.claude/commands/city-pipeline.md` updated with new batch mode instructions
  - Next: full E2E test with fresh cities, then 80-city batch

- **MedJobs: Full Onboarding Overhaul** (branch: `fresh-ramanujan`, PR #368) — MERGED ✅ + ACCOUNT FIX MERGED ✅
  - Plan: `plans/medjobs-account-creation-plan.md`
  - Notion: [Task](https://www.notion.so/32c5903a0ffe811e80eadeb088f96bd3)
  - **Account creation:** Auth user + account created after step 1 (name+email), not step 4. Auto-sign-in via verifyOtp token.
  - **Two-phase profile:** Partial profile on step 1 (`application_completed: false`), full update on step 4 (`application_completed: true`)
  - **Student dashboard:** `/portal/medjobs` — completion checklist with inline doc upload, locked items when application incomplete
  - **Seamless return flow:** All auth paths (OAuth, magic link, OTP) auto-redirect incomplete students to dashboard
  - **UI redesign:** Typeform-inspired — borderless inputs, custom searchable dropdowns, letter-badged multi-select cards, slide transitions, warm microcopy
  - **Email distinction:** New user = "Welcome to MedJobs!", returning user = "Welcome back!", no Loops seeker drip
  - **Document upload:** Private `student-documents` bucket, auth-gated endpoint, inline on dashboard + submit-video page
  - **Footer hidden** on apply/submit-video/portal-medjobs pages
  - **Bugs fixed:** Duplicate email, generic welcome email to students, Loops drip, nudge cron inactive profiles, dropdown clipping

- **Provider Highlights Dedup + Data-Driven Generation** (branch: `fair-morse`, PR #376) — MERGED ✅

- **88-City Batch Expansion** (branch: `magical-knuth`, PR #383 merged) — COMPLETE ✅
  - **Batch 1 (10 cities):** 598 verified providers. Oyster Bay NY, Richardson TX, Highlands Ranch CO, Pasco WA, Chino Hills CA, Bristol TN, Brookline MA, Pico Rivera CA, Piscataway NJ, Euless TX. Cost: ~$30
  - **Batch 2 (78 cities):** 6,542 verified providers (from 16,006 discovered). 78 cities across 25 states. Cost: ~$240. 4 parallel processing + enrichment batches
  - **Combined: 88 cities, ~7,140 verified providers added in one session**
  - New batch discovery script: `scripts/discovery-batch.py`
  - 30+ state bounding boxes added to `scripts/process-city.js`
  - ~1,100 false positives caught by trust signal verification across both batches
  - Total cost: ~$270 (vs $2,200 combined estimate — 88% under budget)
  - Notion: all 88 pages marked Complete with all checkboxes checked
  - 6 cities needed enrichment retry (Supabase statement timeouts from 4 concurrent batches) — all succeeded on sequential retry
  - Plan: `plans/provider-highlights-dedup-plan.md`
  - Notion: [Task](https://www.notion.so/Logan-s-Audit-QA-de-duplicate-care-service-labels-on-all-provider-pages-32c5903a0ffe8166a12bf29c98319e7e)
  - 5-tier highlight waterfall: trust signals → social proof → CMS → staff screening → capability
  - Browse cards skip tautological category label (skipCapability flag)
  - "Well Reviewed" tier added (4.0★ + 15 reviews) below "Highly Rated" (4.5★ + 10)
  - Synonym normalization map (~25 entries) for care_types dedup
  - Deleted duplicate CATEGORY_HIGHLIGHTS maps from provider.ts + provider-utils.ts
  - **Backfill Pass 1 DONE**: 8,101 providers hydrated with google_reviews_data (free)
  - **Backfill Pass 2 DONE**: 22,292 non-CMS providers processed — 20,841 confirmed (trust signals saved), 1,317 soft-deleted (false positives), 134 errors (JSON parse). ~$22 cost, ~3hrs runtime
  - **1,317 false positives cleaned up**: apartment complexes, golf courses, staffing agencies, rec centers, disability care, closed/unverifiable businesses. Soft-deleted (deleted=true, deleted_at set). No audit trail yet — tracked as P2 Notion task.
  - Backfill script: `scripts/backfill-highlights-data.js` (paginated queries, 10 concurrent workers, 429 retry)
  - To query the 1,317 deletions: `deleted=true AND deleted_at >= '2026-03-24T21:00:00Z' AND ai_trust_signals IS NULL AND provider_category IN ('Home Care (Non-medical)', 'Assisted Living', 'Memory Care', 'Independent Living')`

- **Admin Photo Deletion** (branch: `gentle-newton`, PR #395) — MERGED ✅
  - Plan: `plans/admin-delete-photos-plan.md`
  - Notion: [Task](https://www.notion.so/Admin-dashboard-Add-the-ability-for-providers-to-delete-photos-3295903a0ffe805dbc3bec53b1eca849)
  - API: `delete_image` action added to PATCH `/api/admin/images/[providerId]`
  - UI: hover overlay with trash icon + confirm dialog on both classified and raw image grids
  - Root cause fix: `hero_image_url` column doesn't exist in `olera-providers` — handler was selecting it explicitly, Supabase 500'd

- **MedJobs Account Fix + Admin Documents** (PRs #397, #398) — MERGED ✅
  - PR #397: Fix account creation failing on full form submit (root cause: UPDATE path had no account creation logic)
  - PR #398: Add Documents section to admin student detail page (driver's license + car insurance upload status)
  - Type fix: Added document fields to `StudentMetadata` in `lib/types.ts`

- **Provider Activity Center** (branch: `fond-keller`) — DONE ✅
  - Plan: `plans/provider-activity-center-plan.md`
  - Notion: [Track provider activity in "Activity Center"](https://www.notion.so/Track-provider-activity-in-Activity-Center-32f5903a0ffe80c8ad21ebd8b3176a6f)
  - Track email click-throughs from provider notifications, surface in admin dashboard
  - 5 phases: DB table → instrument emails → capture clicks → API → admin UI
  - PRs #404 merged to staging, #405 promoted to main

- **Provider Onboarding Routing Fix + UX + One-Click Flow** (branch: `loving-swartz`) — E2E WORKING, PR #428 OPEN
  - Plan: `plans/provider-onboarding-routing-plan.md`
  - Notion: [Task](https://www.notion.so/089aad975c5d4ba0930c8da33b8a6597)
  - PRs: #421 merged, #427 merged, #428 open (all fixes from session 62)
  - 5 routing bugs fixed + notification card UX redesign + privacy masking
  - One-click flow fully working: email link → auto-sign-in → auto-claim → onboard page with notification card
  - Root cause of all prior failures: Apple Mail Link Tracking Protection strips params named `token`
  - Fix: renamed `token` to `otk` (one-time key) — Apple doesn't strip it

- **Care Seeker Connection Flow De-Jank** (branch: `helpful-euler`) — IN PROGRESS
  - Enrichment questions → /welcome page transition redesign
  - Fixed 6-second blank white screen: removed force-dynamic from /welcome, moved to static page + client-side data fetching
  - /welcome page taste pass: warm bg (#FAFAF8), side-by-side connection card, flat step cards, Airbnb Trips / Perena inspired
  - `/dejank` slash command created for systematic jank removal methodology
  - **Still TODO:** Test full enrichment → /welcome transition end-to-end, verify connection card skeleton works, continue design polish

- **Family Activity Center** (branch: `logical-mahavira`) — IN PROGRESS
  - Plan: `plans/family-activity-center-plan.md`
  - Expand Activity Center into unified engagement hub: Providers | Families | Feed
  - Track family signals: connection_sent, profile_enriched, email_click, question_asked, matches_activated
  - New seeker_activity table, instrument 16 family email types with tracking, family engagement heat
  - Replaces Matches admin page (funnel metrics → per-person engagement view)
  - 5 phases: DB schema → instrument events → email tracking → admin API → admin UI

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — DONE ✅
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell`) — DONE ✅
  - Plan: `plans/provider-home-page-plan.md`

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — DONE ✅
  - Plan: `plans/provider-deletion-request-plan.md`

- **Backend Integration Roadmap** — PHASES 1-5 COMPLETE ✅ + Notification Testing IN PROGRESS
  - Plan: `plans/backend-integration-roadmap-plan.md`
  - Analysis: `docs/backend-integration-analysis.md`
  - Notion: [Backend Integration Roadmap](https://www.notion.so/3185903a0ffe800982bbd55176cb46e2)
  - PRs: #111 (Email + Slack), #112 (Twilio SMS), #113 (Vercel Cron), #123-#129 (Loops Marketing), #138 (Approval Email + Loops), #141 (Fix: accounts table lookup), #147 (Family emails + remove mock leads)
  - Phases: ~~Email~~ ✅ → ~~Slack~~ ✅ → ~~Twilio SMS~~ ✅ → ~~Vercel Cron~~ ✅ → ~~Marketing (Loops)~~ ✅ → Sentry (P4 backlog)
  - **Notification Test Matrix:** [Notion](https://www.notion.so/Notification-Test-Matrix-2026-03-04-3195903a0ffe8190be95d95554e52dd1) — 18 tests across Email/SMS/Slack/Cron/Loops

---
