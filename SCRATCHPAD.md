# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **CTA Experimentation Infrastructure** (branch: `glad-wu`) — PUSHED, DB MIGRATED, NEEDS PR + PREVIEW TEST
  - Plan: `plans/cta-experimentation-plan.md`
  - **DB migration ran successfully** in Supabase (tables + seed data live)
  - Bug fix: `update_updated_at()` function didn't exist — added `create or replace` to migration script
  - Branch pushed to origin (3 commits: infrastructure, scratchpad, migration fix)
  - **Next: create PR to staging → get Vercel preview → test 3 variants → activate experiment**
  - **All Phase 1-3 code complete + build passing**
  - Committed: `77d54994` — 18 files, 1805 insertions
  - 3 variants seeded (33/33/34 traffic split):
    - `contact` (control): old "Get in Touch" with 4 fields, no enrichment
    - `pricing`: current "What does this cost?" email-only, pricing post-submit
    - `eligibility`: "See if you qualify" email-only, eligibility-framed post-submit with funding options shown expanded
  - **To go live:**
    1. Push branch + create PR to staging
    2. Run `scripts/migrate-experiments.sql` in Supabase SQL editor
    3. Set experiment to `active` via `/admin/experiments` or SQL
  - **Key files created:**
    - `lib/experiments.ts` — core library (assignment, cookies, stats)
    - `components/providers/ExperimentProvider.tsx` — `useExperiment()` hook
    - `components/providers/ExperimentCTAs.tsx` — desktop + mobile wrappers
    - `components/providers/connection-card/EligibilityEnrichment.tsx` — eligibility post-submit
    - `app/admin/experiments/page.tsx` — admin dashboard with significance testing
    - `app/api/experiments/impression/route.ts` — impression tracking
    - `scripts/migrate-experiments.sql` — DB migration + seed data
  - **Key files modified:**
    - `connection-card/types.ts`, `InquiryForm.tsx`, `index.tsx`, `use-connection-card.ts` — variant-aware CTA
    - `MobileStickyBottomCTA.tsx` — variant-aware sticky bar + sheet
    - `ConnectionCardWithRedirect.tsx` — passes variant props through
    - `app/provider/[slug]/page.tsx` — uses `ExperimentDesktopCTA` + `ExperimentMobileCTA`
    - `app/api/connections/request/route.ts` — persists `experiment_variant_id` on connections
  - **Architecture decisions:**
    - Cookie-based assignment (`olera_exp`, 30-day, no PII) — no third-party tools needed
    - Server component page stays ISR; client wrappers handle experiment resolution
    - `postSubmitFlow` config drives which enrichment component renders
    - `basic` flow (old CTA) skips enrichment entirely → connected state
    - Impression tracking is fire-and-forget (best-effort, non-blocking)
  - **Next: availability + matches variants (Phase 4 in plan), form field variation tests**

- **Provider Page CTA Conversion Redesign — 2026-04-02** — MERGED TO STAGING (`fine-dijkstra`)
  - Now the `pricing` variant in the experiment system
  - Email-only form, post-submit enrichment with localized pricing, care report email

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

- **Provider Page CTA Conversion Redesign — 2026-04-02** — MERGED TO STAGING ✅
  - Now the `pricing` variant in the CTA experiment system above
  - 0.44% baseline → targeting 2-5% via A/B testing

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

## Blocked / Needs Input

- (none currently)

---

## Next Up

1. **MedJobs candidates detail page taste pass** — Apply warm surface + Perena-inspired styling to `/medjobs/candidates/[slug]` and `/provider/medjobs/candidates/[slug]`
2. **MedJobs provider onboarding flow** — Ensure MedJobs tab → browse → candidate detail → auth → contact is butter smooth end-to-end
3. **Enrichment questions after connection** — Add follow-up questions after seeker submits connection to feed into their profile (separate workstream from onboard redesign)
4. **De-jank provider transitions** — Airbnb-smooth state transitions across provider flows (notification → dashboard, claim → portal)
5. **SEO Action 1: City-specific content sections** — Add cost snapshot, "Paying for Care" module (waiver library links), city stats, FAQ section to browse pages
2. **SEO Action 2: Internal linking** — Link caregiver articles → city pages, waiver library → city pages, nearby city cross-links
3. **SEO Action 3: Structured data + meta** — FAQ schema, AggregateRating schema, cost/review-enriched meta descriptions
4. **SEO Action 4: More caregiver content** — 10-15 articles targeting financial/benefits queries (Medicare, Medicaid, cost guides)
5. **Merge PR #219** (waiver library redesign) — waiting on Chantel to remove `package.json.tmp` + `.mcp.json`
6. **Fix Supabase 1000-row limit** in provider sitemap shards (returns 1000 instead of 10,000)
7. **Debug auto-sign-in** — check `[OneClick]` console logs, fix background auth
8. **Phase 2: Activity Center PII tracking** — log "viewed_lead_pii" events, Slack alerts for sensitive interactions
9. **Unmask question/review content** on onboard notification cards (public data, no privacy concern)
10. **Delete fake seed connections** from Supabase (Sarah Reynolds, James Adeyemi, etc.)
11. **Run backfill script** for source_provider_id (dry-run first): `scripts/backfill-source-provider-id.js`
12. **Add `CLAIM_TOKEN_SECRET` env var** to Vercel (currently falls back to SUPABASE_SERVICE_ROLE_KEY)

---

## Decisions Made

> Older decisions archived to `archive/SCRATCHPAD-2026-03.md`

| Date | Decision | Rationale |
| 2026-04-06 | Cookie-based experiment assignment, no third-party tools | At ~600 visitors/day, Optimizely/LaunchDarkly is overkill. Supabase + cookies = tight integration with connection attribution |
| 2026-04-06 | 3 variants (control + 2 tests) at 33/33/34 split | 600/day ÷ 3 = 200/variant/day. 2 weeks = 2,800 per variant — enough for significance on 1%+ differences |
| 2026-04-06 | "basic" postSubmitFlow skips enrichment entirely | Old "Get in Touch" CTA never had enrichment. Sending control users through pricing post-submit would contaminate the test |
| 2026-04-06 | Eligibility variant reuses pricing data, reframes as "qualify" | No new data sources needed. Same funding options shown expanded (not collapsed) with green eligibility framing. Logan's insight: this matches what's actually happening in the ecosystem |
| 2026-04-06 | Server component page stays ISR; client wrappers handle experiments | Provider page is ISR (1hr cache). Experiment resolution happens client-side via `useExperiment()` hook to avoid cache-busting |
| 2026-03-28 | Onboard page is a platform showcase, not a profile editor | Provider's first impression should be "here's what Olera can do" not "fill out these 7 forms" |
| 2026-03-28 | MedJobs candidates page is a search tool, not a gallery | Hiring is purposeful evaluation. List rows let providers scan 8-10 candidates per screen vs 3 |
| 2026-03-27 | Never name URL params `token`, `session`, `key` in email links | Email clients strip params that look like auth credentials. Use abbreviations: `otk`, `sid`, `k` |
| 2026-03-27 | One-click flow stays on onboard page, not redirect to Leads | Trojan horse: lead hooks, dashboard sells. Redirecting to Leads table gives first-time providers nothing to trust |
| 2026-03-26 | One-click email tokens for provider onboarding | Email IS the verification — asking for OTP after clicking the email proves the same thing twice. Signed JWT = zero friction |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

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

### 2026-03-31 (Session 65) — Worktree Cleanup + URL/Breadcrumb System Docs

**Branch:** `speedy-jemison` | **1 commit**

**Cleanup:**
- Removed 174 local worktree folders from `~/.claude-worktrees/olera-web/` (175 → 1)
- Deleted ~185 stale remote branches from GitHub (kept `main`, `staging`, + 4 branches with open PRs)
- Pruned all stale git worktree references

**Documentation:**
- Added URL & Breadcrumb Strategy section to `docs/SYSTEMS.md` — covers core URL patterns, slug conventions, category aliases, specialized routes, breadcrumb implementations, redirect/rewrite layer, sitemap sharding, link generation patterns, and known issues

### 2026-03-30 (Session 64) — Fix Orphaned Question/Lead Notifications

**Branch:** `fancy-lamarr` | **1 commit** | `cd60db73`

**Problem:** Graize reported "Provider already has an email" error on admin Questions > Needs Email tab. Root cause: deferred notification system tightly coupled "save email" and "send notifications" — if email arrived through any other path (leads add-email, profile claim, etc.), questions were permanently orphaned with `needs_provider_email: true` flag never cleared.

**Fix (4 files):**
- `app/api/admin/questions/add-email/route.ts` — Removed hard block on existing email. Now saves/overwrites email and always sends deferred notifications. Added `email_sent_at` duplicate-send guard.
- `app/api/admin/leads/add-email/route.ts` — Same fix + added bidirectional cross-clearing (sends deferred question notifications when email added via leads, not just lead notifications).
- `app/api/admin/questions/route.ts` (GET) — Enriches response with `provider_email` from business_profiles/olera-providers.
- `app/admin/questions/page.tsx` — Pre-fills email input when provider has email on file. Button: "Send" vs "Add & Send". Success: "Question forwarded" vs "Email saved — question forwarded". Amber "Email on file" indicator.

**Self-review caught 2 issues before testing:**
1. Success message said "Email saved" even when email was pre-existing — fixed to show "Question forwarded" instead
2. Dynamic import inside loop in leads endpoint — moved outside

**Testing:** TJ verified Test 1 (orphaned questions with pre-filled emails) — Send button, Email on file badge, and forwarding all working.

### 2026-04-06 (Session 67) — CTA A/B Testing Infrastructure

**Branch:** `glad-wu` | **3 commits** | Build passing

**Built complete CTA experimentation system:**
- DB: `experiments`, `experiment_variants`, `cta_impressions` tables + `experiment_variant_id` on connections
- Library: `lib/experiments.ts` — cookie-based variant assignment, weighted random, impression tracking, z-test stats
- Components: `ExperimentProvider.tsx` (useExperiment hook), `ExperimentCTAs.tsx` (desktop+mobile wrappers), `EligibilityEnrichment.tsx` (eligibility post-submit)
- API: `POST /api/experiments/impression` (fire-and-forget counter)
- Admin: `/admin/experiments` dashboard with variant stats, significance testing, weight controls
- Modified: InquiryForm (variant-driven fields/copy), ConnectionCard (impression tracking + flow routing), MobileStickyBottomCTA (variant-aware), connection request API (attribution)

**3 variants seeded:** contact (control, 33%), pricing (33%), eligibility (34%)
**DB migration ran successfully.** Bug: `update_updated_at()` function didn't exist — fixed with `create or replace`.
**Meeting context (Apr 6):** Logan proposed eligibility/availability/matches angles. TJ wants parallel testing, not sequential. 600 visitors/day = enough for 3-way split.

**Next:** Create PR → Vercel preview → test all 3 variants → activate → monitor.

---

_Older sessions archived to `archive/SCRATCHPAD-2026-03.md`_
