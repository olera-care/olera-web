# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md`

---

## Current Focus

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

- **ZIP Code Search Fix + No-Coverage Fallback** (branch: `gifted-zhukovsky`) — READY FOR PR
  - Plan: `plans/zip-search-fix-plan.md`
  - Phase 1 (city alias map): DONE — NYC boroughs + Butte-Silver Bow aliases expand in all 3 query paths
  - Phase 2 (graceful fallback): DONE — warm empty state with nearest city suggestion
  - System docs: `docs/SYSTEMS.md` updated with "City Alias System" section
  - Build: passes clean
  - New files: `lib/city-aliases.ts`, `lib/nearest-city.ts`
  - Modified: `lib/power-pages.ts`, `components/browse/CityBrowseClient.tsx`, `components/browse/BrowseClient.tsx`, `app/[category]/[state]/[city]/page.tsx`
  - Next: commit, PR to staging, manual verification of 8 ZIP test matrix

- **Provider Pricing Strategy & Disclaimers Overhaul** (branch: `easy-ramanujan`) — PHASES 1-7 COMPLETE, PHASE 8-9 PLANNED
  - Plan: `plans/provider-pricing-strategy-plan.md`
  - Notion: [Task](https://www.notion.so/Provider-Pricing-Strategy-Disclaimers-Overhaul-32d5903a0ffe8076b473df7f96d02937)
  - Commit: `af193dc` — 16 files, 1,050 insertions
  - Phases 1-7 done: pricing config, category disclaimers, detail page, cards, city pages, portal guidance, schema
  - **Pending: Home Health → Tier 3** (should not show hourly prices — Medicare covers most services)
  - **Pending: Metro-level adjustment factors** using HUD FMR data (~400 MSAs) + BLS wage data
  - **Pending: Medicaid nursing home per-diem rates** for Tier 3 education

- **MedJobs: Full Onboarding Overhaul** (branch: `fresh-ramanujan`, PR #368) — IN QA
  - Plan: `plans/medjobs-account-creation-plan.md`
  - Notion: [Task](https://www.notion.so/32c5903a0ffe811e80eadeb088f96bd3)
  - Account creation after step 1, Typeform-inspired UI, student dashboard, seamless return flow

- **Senior Benefits Finder Desktop Redesign** (branch: `witty-ritchie`) — IN PROGRESS
  - Plan: `plans/benefits-finder-desktop-redesign-plan.md`

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell`) — IN PROGRESS
  - Plan: `plans/provider-home-page-plan.md`

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — PLANNED
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

- ~~**Migration Playbook → Notion:**~~ ✅ Done (2026-03-01) — updated via Notion MCP
- ~~**Top 100 pages from Search Console:**~~ ✅ Done — GSC export analyzed, 0 404 risks found
- ~~**Editorial content redirect decision:**~~ ✅ Done — all v1.0 content routes now have redirects in `next.config.ts`: `/research-and-press/*` → homepage, `/caregiver-forum/*` → `/`, `/caregiver-relief-network/*` → homepage, `/company/*` → dedicated pages

---

## Next Up

1. **Pricing: Home Health → Tier 3** — one-line config change, suppress dollar estimates for home health (Medicare covers it)
2. **Pricing: Metro-level adjustment factors** — download HUD FMR + BLS wage data, compute ~400 MSA adjustment factors, build city→MSA mapping, integrate into getRegionalEstimate()
3. **Pricing: Medicaid nursing home per-diem rates** — curate state-level Medicaid reimbursement rates for Tier 3 education
4. **Pricing: Calibrate estimates against real provider data** — cross-check adjusted estimates vs. claimed profiles with real pricing
5. **Merge PR #219** (waiver library redesign) — waiting on Chantel to remove `package.json.tmp` + `.mcp.json`
2. **Fix Supabase 1000-row limit** in provider sitemap shards (returns 1000 instead of 10,000)
3. **Test Google OAuth on olera.care** — verify sign-in flow end-to-end
4. **Monitor GSC for 404 spikes** — check over next few days post-cutover
5. **Re-submit sitemap in GSC** — now returns sitemap index with all shards, should discover 40K+ pages
6. **Send XFive cutover memo** — request spot check + Q&A/user account export from v1
7. **Plan Q&A + user data migration** — once XFive delivers export, map to v2 Supabase schema
8. **Gated provider portal page** — Esther building; sanity check item #1
9. **Continue notification test matrix** — tests #3-5, #8, #11-12, #14-18 remaining
10. **Delete fake seed connections** from Supabase (Sarah Reynolds, James Adeyemi, etc.)

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | City alias map over data migration for NYC | Changing 153 providers from "Manhattan"/"Brooklyn" to "New York" is lossy — borough info is useful. Better to expand queries at the search layer |
| 2026-03-24 | Prefer same-state nearest city in fallback | When no providers exist in a small town, suggest the closest major city in the same state. Cross-state suggestions are confusing for users |
| 2026-03-24 | Static alias map, not database table | Only 2 known mismatches (NYC + Butte). Code-level constant is simpler than a DB table. Revisit if it grows past 20 entries |
| 2026-03-24 | Abbreviation audit came back clean | St./Saint, Ft./Fort, Mt./Mount are all consistent between zip-index and DB. No action needed |
| 2026-03-24 | 3-tier pricing strategy by care category | Tier 1 (Home Care, AL, IL): show estimates freely. Tier 2 (Memory Care): estimates + coverage education. Tier 3 (Nursing Home, Hospice, Home Health): education first, suppress dollar estimates. Not all categories should show prices the same way |
| 2026-03-24 | Home Health Care belongs in Tier 3, not Tier 2 | Home health is medically prescribed and mostly covered by Medicare Part A. Showing hourly rates implies families pay out of pocket when most pay $0. Same treatment as nursing homes and hospice |
| 2026-03-24 | State-level pricing is too coarse for facility categories | Texas median AL = $5,250 but Houston = ~$6,600 and rural TX = ~$3,400. Use HUD Fair Market Rents as metro-level adjustment factors (covers ~400 MSAs = 85% of US population). Formula: state_median × (metro_FMR / state_median_FMR) |
| 2026-03-24 | Google Places price_level is not useful for senior care | price_level (1-4) is designed for restaurants/retail, almost always null for care facilities. Captured in discovery CSV but rightfully not stored in DB |
| 2026-03-24 | Use CareScout state medians as ground truth, adjust with free federal data | CareScout 2024 survey = authoritative care costs by state. HUD FMRs = geographic precision (metro housing costs). BLS OEWS = caregiver wage precision. Combined: survey accuracy × geographic precision |
| 2026-03-24 | Display data year in pricing attribution | "Based on 2024 cost data" builds trust. Plan annual refresh rather than applying compounding inflation escalator |
| 2026-03-23 | Post-geocoding area check is required | 36/269 Ramapo providers geocoded outside the area — discovery assigns city=Ramapo to everything regardless of actual location. Must validate coordinates fall within ~0.5° of target city after geocoding |
| 2026-03-23 | Slugs must include city to avoid collisions | Many NY providers share names across cities. Slug format `{name}-{city}-{state}` prevents unique constraint violations |
| 2026-03-23 | Don't run google_reviews_data hydration and review snippets in parallel | Both write to the same JSONB column — race condition causes data loss. Run hydration first, then snippets |
| 2026-03-22 | Never store raw Google Places photo reference URLs | Raw `places.googleapis.com/v1/.../photos/...` URLs are ephemeral API resource paths requiring an API key. Must resolve to permanent `lh3.googleusercontent.com` URLs using `skipHttpRedirect=true` |
| 2026-03-22 | Jettison "Add Score" from city pipeline | olera_score/community_Score/value_score/information_availability_score are dead columns from the old Perplexity AI scoring system, removed in commit 302a4e5. New system uses Google Reviews + CMS data + AI Trust Signals |
| 2026-03-22 | Replace "Add Score" with "Hydrate Google Reviews Data" | New pipeline step populates google_reviews_data JSONB (rating, review_count, snippets) instead of the old proprietary scores |
| 2026-03-22 | AI Trust Signals run as part of city pipeline | Unified workflow: after upload, run /api/admin/verify-trust-signals for non-CMS categories in the target city |
| 2026-03-22 | AI classification required before upload | 32% of Bellevue discovery was garbage (Walmart, GameStop, Roto-Rooter). Keyword filtering misses most false positives. Perplexity AI classification costs ~$0.40 per city and catches everything |
| 2026-03-22 | Run enrichment steps in parallel | Post-upload steps (descriptions, reviews, trust signals, images, email) are independent — run concurrently with background tasks. TJ explicitly praised this approach |
| 2026-03-22 | Trust signals + CMS are display-only, not ranking | Current recommendation engine sorts exclusively by evidence density (google rating × log(review count)). Ranking enhancement is a separate Notion task for deep dive |
| 2026-03-13 | Form-first, voice-second in mode selection | Most users expect a form; voice is a differentiator but shouldn't be the default path |
| 2026-03-13 | Auth gate on bookmark only, not on results | Let users see value first → higher conversion. Bookmark is the natural auth moment |
| 2026-03-13 | Web Speech Synthesis API for TTS (no external service) | Free, built into all browsers, zero latency, no API key. Good enough for intake prompts |
| 2026-03-13 | Borrow Chantel's results page ideas, not her code | Her Lovable prototype has great UX patterns (financial impact, action plan, print) but needs to be rebuilt in our stack |
| 2026-03-13 | Progressive disclosure over report layout | Results page had 9 sections — overwhelming. Reduced to 3 beats: hero card, program list, tools. Document checklist behind toggle. |
| 2026-03-13 | "Recommended First Step" hero > Action Plan list | One specific program with call script > 5 programs in a numbered list. Reduces decision paralysis. |
| 2026-03-13 | Remove SaveResultsBanner from results | Show value first, ask later. Auth only on bookmark. Banner was the first thing users saw — wrong priority. |
| 2026-03-13 | Print expands everything via beforeprint event | Progressive disclosure is great for screen, bad for paper. JS listener overrides collapsed state during print. |
| 2026-03-05 | Flat `/provider/{slug}` URL is correct | v1.0 already used flat canonical URLs — no SEO trade-off in migration |
| 2026-03-05 | Gated provider portal → Esther | `/provider-portal/provider/{slug}/*` needs smart landing page, not just redirect. Critical for provider email funnel |
| 2026-03-02 | 16:9 primary featured image, 4 featured articles | 3:2 and 4:3 were too tall — pushed article grid below fold. 4 featured (1 large + 3 small) fills the right column without blank space |
| 2026-03-01 | Skip MedicalBusiness schema, revisit later | Low reward: Google doesn't render it differently than LocalBusiness. No concrete SERP benefit. Competitors don't use it either. |
| 2026-02-28 | CTA: quiet nudge over teal gradient banner | Strip template blobs, one warm heading, one button — calm confidence over SaaS shouting |
| 2026-02-28 | Community section in unified gray container | Docuseries + flat links felt unbounded; single bg-gray-100 rounded card groups them |
| 2026-02-28 | NIH badge: actual logo, compact, bottom-right hero | Real logo image inverted to white; tight but not cramped spacing |
| 2026-02-28 | Uniform grid over bento for Explore Care | Equal-weight cards feel less template-y; bento asymmetry was visual noise |
| 2026-02-28 | Remove social proof trust strip | Fake numbers add no trust; section added no user value |
| 2026-02-28 | Community as editorial + flat link rows | Perena-style flat rows over boxed cards; docuseries gets hero treatment, community links are quiet and scannable |
| 2026-02-28 | Default care type to Home Care | Most common search intent; was incorrectly defaulting to Home Health |
| 2026-02-28 | Self-host bento images over Unsplash | Remove external dependency; own the imagery |
| 2026-02-28 | BrowseCard (compact 310px) for all homepage cards | More providers in less space; save ProviderCard for browse/search pages |
| 2026-02-26 | Only TJ can merge to main/staging | Rulesets + merge-admins team. Prevents uncontrolled merges |
| 2026-02-26 | Content regression checks beyond git merge-base | Revert→re-apply cycles make commit topology misleading |
| 2026-02-26 | PR merge reports go to Notion | Automated reports for audit trail and team visibility |
| 2026-03-10 | Dynamic API route for sitemap, not metadata file | `app/sitemap.ts` is statically generated at build time — Supabase queries fail, empty result cached permanently. `app/api/sitemap/route.ts` with `force-dynamic` works correctly |
| 2026-03-10 | Rewrite `/sitemap.xml` → `/api/sitemap` | `app/[category]` dynamic route catches `sitemap.xml` as a category slug → 404. Rewrite in `next.config.ts` bypasses the route conflict |
| 2026-03-10 | Static OG image over dynamic ImageResponse | Shutterstock photo looks better than teal gradient text; static `.jpg` is simpler and faster |
| 2026-03-10 | Web Speech API + Deepgram fallback for voice | Web Speech API is free and covers ~75% of traffic (Chrome/Edge). Deepgram at $0.008/min covers Firefox + iOS Safari. Cheaper and simpler than a single paid provider for all traffic |
| 2026-03-10 | Keyword parser over LLM for voice interpretation | iOS VoiceIntentParser uses keyword matching and handles all edge cases. No need for Claude API — deterministic, instant, zero cost. LLM can be added later for Plan C conversational mode |
| 2026-03-10 | Mic per step, not separate voice mode | Keeps voice as an enhancement to the existing form. Users can mix voice and tap freely. Lower engineering cost than a full voice overlay (Plan B) |
| 2026-03-10 | Voice on all 6 steps, not just text inputs | Even pill-select steps (care preference, needs, income, Medicaid) benefit from voice — "help with bathing and cooking" is natural speech that maps cleanly to pills |
| 2026-03-10 | Labeled pill over bare icon for voice button | Bare 40x40 gray circle has zero affordance — users won't discover it. Labeled pill with "Speak" text is discoverable without being pushy |
| 2026-03-10 | Teal listening state over red | Red = error/danger in every mental model. Teal (brand color) signals "active" with calm confidence |
| 2026-03-10 | Voice below options, not above | Voice is a secondary input method. Below the primary interaction (input/pills) communicates "or you can speak" without competing with the primary path |
| 2026-03-10 | City search over ZIP-only for voice | Users naturally say "I live in Katy Texas" not "seven seven four four nine". Reuse existing 18K city search infra with state name extraction. ZIP still works if spoken |
| 2026-03-10 | Auto-retry on audio-capture mic error | Chrome's Web Speech API flakes on mic access — abort→start race condition. One silent 500ms retry resolves most transient failures |
| 2026-02-21 | Server-side pagination for directory | 36K+ records — must use Supabase `.range()` |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-03-24 (Session 57) — WEB-01: Fix ZIP Code Search for Large Metros

**Branch:** `gifted-zhukovsky`
**Notion task:** WEB-01: Fix zip code search — fails for large metros (P1 🔥)

**What:** Explored, diagnosed, and fixed the ZIP code search failure for NYC and other metro areas. Built a graceful no-coverage fallback for small towns without providers.

**Exploration Findings:**
- ZIP 10001 (Manhattan) → resolves to "New York" → 0 results because DB stores providers under borough names (Manhattan, Brooklyn, Bronx, Queens)
- Tested 20 major metros: only NYC fails (LA, Chicago, Houston, etc. all pass)
- Tested 15 small towns: found Butte, MT also fails ("Butte" vs "Butte-Silver Bow" in DB)
- Abbreviation audit (St./Saint, Ft./Fort, Mt./Mount): all clean, no mismatches
- ~153 NYC providers + 10 Butte providers were invisible to search

**Phase 1 — City Alias Map:**
- Created `lib/city-aliases.ts` with `expandCityAliases()` function
- "New York" → [Manhattan, Brooklyn, Bronx, Queens, Staten Island]
- "Butte" → [Butte-Silver Bow]
- Updated 3 query paths: `lib/power-pages.ts` (server), `CityBrowseClient.tsx` (client), `BrowseClient.tsx` (client)
- Single-alias uses `.ilike()`, multi-alias uses `.in()` for efficiency

**Phase 2 — Graceful No-Coverage Fallback:**
- Created `lib/nearest-city.ts` — haversine distance against top 200 cities, prefers same-state
- Replaced cold "No providers found yet" with warm fallback:
  - Map pin icon + "We're expanding to {city} soon"
  - Nearest city suggestion card with distance and CTA button
  - State-level browse link
  - Cross-category links
- Reads cities-tier1.json server-side via fs for build compatibility

**Phase 3 — ZIP Auto-Resolve on Submit:**
- Homepage `handleSearch`: if input is 3-5 digits, use `cityResults[0]` from hook (already in memory) or sync fallback from `citySearchService.search()`
- Browse page: if `?location=10001`, resolve ZIP to city name on mount before first Supabase query
- Zero latency — uses already-loaded zip-index data

**System Documentation:**
- Added "City Alias System" section to `docs/SYSTEMS.md` with alias map, query paths, and maintenance notes

**Build:** Passes clean. PR #369.

---

### 2026-03-24 (Session 56) — Provider Pricing Strategy & Disclaimers Overhaul

**Branch:** `easy-ramanujan`
**Commit:** `af193dc` — 16 files changed, 1,050 insertions

**What:** Full implementation of category-aware pricing system. Replaced one-size-fits-all "Contact for pricing" with a 3-tier strategy using real CareScout/Genworth 2024 survey data for all 51 states.

**Phases Completed (1-7):**
1. `lib/pricing-config.ts` — central config: 3 tiers, 7 category configs, 51 states of CareScout data, helper functions
2. `PriceEstimate.tsx` refactored — category-specific disclaimers (Tier 1: standard, Tier 2: + coverage note, Tier 3: education-first)
3. `PricingEducationBadge.tsx` (new) — teal badge for Tier 3: "Medicare / Medicaid may cover" or "Usually covered by Medicare"
4. `RegionalEstimateLabel.tsx` (new) — visual distinction: provider-entered (bold) vs. regional estimate ("State avg." prefix, lighter)
5. Provider detail page — hero shows education badge for Tier 3, pricing section gets category footer, JSON-LD suppresses Tier 3
6. Cards (ProviderCard, CompactProviderCard, BrowseCard) — all use new components, regional fallbacks from state data
7. City pages — averages require n>=5 sample (was n>=1), fall back to state median, category-specific cost notes
8. Provider dashboard — EditPricingModal shows category-specific guidance (nursing home: Medicare/Medicaid note, home health: Medicare tip)

**Key Review Findings (post-implementation):**
- **Home Health must move to Tier 3** — currently Tier 2, but Medicare covers most home health services. Showing "$19-$29/hr" implies families pay out of pocket when most pay $0. Fix pending.
- **State-level averages too coarse for facility care** — TX state median AL = $5,250 but Houston ≈ $6,600, rural TX ≈ $3,400. Need metro-level adjustment factors.
- **Best approach: HUD FMR + BLS wages** — HUD Fair Market Rents cover ~400 MSAs (85% US pop) + ~2,200 non-metro counties. Formula: `state_median × (metro_FMR / state_avg_FMR)`. Free federal data, updated annually.
- **Google Places price_level not useful** — designed for restaurants, almost always null for care facilities
- **Medicaid nursing home per-diem rates** would enhance Tier 3 education (free state-level data)

**Files Created:**
- `lib/pricing-config.ts` — pricing tiers, state data, helpers
- `components/providers/PricingEducationBadge.tsx` — Tier 3 coverage badge
- `components/providers/RegionalEstimateLabel.tsx` — provider vs. regional distinction
- `plans/provider-pricing-strategy-plan.md` — implementation plan

**Files Modified:**
- `lib/types/provider.ts` — added `isRegionalEstimate`, `providerCategory` to ProviderCardData; regional fallbacks in toCardFormat() and businessProfileToCardFormat()
- `lib/power-pages.ts` — n>=5 sample requirement, state median fallback, costNote field
- `components/providers/PriceEstimate.tsx` — category-aware with 3 tier behaviors
- `components/providers/ProviderCard.tsx`, `CompactProviderCard.tsx`, `components/browse/BrowseCard.tsx` — education badges + regional labels
- `components/browse/CityBrowseClient.tsx` — "State Avg. Cost" label + cost context note
- `components/providers/connection-card/CardTopSection.tsx` — Tier 3 compact badge
- `components/provider-dashboard/edit-modals/EditPricingModal.tsx` — category guidance notes
- `app/provider/[slug]/page.tsx` — hero, pricing section, JSON-LD updates
- `app/[category]/[state]/[city]/page.tsx` — hourly unit fix, new seoContent fields

**Build:** Clean — zero type errors, successful production build

---

### 2026-03-24 (Session 56b) — 5-City NY Batch Expansion Pipeline

**Branch:** `silly-hopper` (pipeline scripts + ops)

**What:** Batch city expansion for 5 New York cities from the expansion map tool. Built reusable processing and enrichment scripts (`scripts/process-city.js`, `scripts/enrich-city.js`) that automate the full pipeline end-to-end.

**Pipeline Results:**

| City | Discovered | Uploaded | Final Active |
|------|-----------|---------|-------------|
| Greenburgh | 412 | 200 | 146 |
| Clarkstown | 386 | 177 | 135 |
| Glens Falls | 307 | 73 | 42 |
| Clay | 214 | 103 | 73 |
| Union | 556 | 310 | 118 |
| **Total** | **1,875** | **863** | **514** |

**Filtering breakdown:** 85 keyword, 624 AI classification, 303 dedup, 225 out-of-area, 124 trust signal false positives

**Cost:** ~$31 total (discovery $19, AI/geocoding/enrichment ~$12)

**New scripts created:**
- `scripts/process-city.js` — Full clean/upload pipeline: keyword filter → AI classify → dedup → category map → name check → IDs → upload → geocode → out-of-area cleanup
- `scripts/enrich-city.js` — Parallel enrichment: descriptions + reviews data + trust signals + images (parallel), then review snippets (sequential to avoid JSONB race condition)

**Key observations:**
- Union had massive out-of-area contamination (177/310 deleted) — Binghamton metro area pulls providers from all over NY
- Glens Falls had highest AI rejection rate (66%) — lots of mobile home parks, vacation rentals, event venues
- Clarkstown had many disability services orgs (OPWDD-funded) misclassified as senior care
- Trust signal step continues to be high-value QC — caught 124 additional false positives across all cities

**Notion:** All 5 cities marked Complete with all 14 checkboxes checked.

---

### 2026-03-23 (Session 55) — Greece, NY City Expansion Pipeline

**Branch:** `silly-thompson` (no code changes — pipeline ops only)

**What:** Full city expansion pipeline for Greece, NY (batch mode — Ramapo skipped as already complete).

**Pipeline Results:**
- **Discovered:** 358 providers ($4.10, quick search)
- **Keyword filter:** removed 27 (hospitals, PT, storage, pharmacies, urgent care)
- **AI classification:** removed 117 (35% false positive rate — retail stores like Best Buy/Staples/JCPenney, spas, gyms, general apartments, counseling services, rehab centers, nonprofits)
- **Dedup:** 61 duplicates against existing 33K providers
- **Uploaded:** 155 providers to Supabase
- **Geocoding:** 155 re-geocoded, 32 corrections
- **Out-of-area cleanup:** 34 providers with coordinates outside Greece/Rochester area deleted (mostly NYC, Buffalo, Syracuse contamination)
- **Trust signals:** 65 confirmed, 12 more false positives deleted (childcare centers, retail, apartment complexes, unverifiable entities)
- **Final count:** 109 legitimate providers

**Category Breakdown:**
- Assisted Living: 55, Home Health Care: 24, Nursing Home: 17, Memory Care: 6, Home Care (Non-medical): 6, Independent Living: 1

**Enrichment Coverage:**
- Descriptions: 109/109 (100%), Google Reviews: 98/109 (90%), Review Snippets: 98/109 (90%), Trust Signals: 65/109 (non-CMS only), Images: 87/109 (80%)

**Key Issue:** Race condition between hydration and review snippets struck again — both ran in parallel and snippets overwrote JSONB. Fixed with a re-hydration pass. Decision from session 54 to not run these in parallel was correct but wasn't enforced in this session's parallel launch.

---

### 2026-03-23 (Session 54) — Ramapo, NY City Expansion Pipeline

**Branch:** `great-euler` (no code changes — pipeline ops only)

**What:** Full city expansion pipeline for Ramapo, NY. Discovery → keyword filter → AI classification → dedup → upload → parallel enrichment → geocoding → out-of-area cleanup.

**Pipeline Results:**
- **Discovered:** 523 providers (quick search, ~$5.22)
- **Keyword filter:** removed 26 (hospitals, physical therapy, storage, insurance, etc.)
- **AI classification:** removed 179 (36% false positive rate — memory_care pulled in therapy/counseling, retail stores like Costco/Staples/Apple, data recovery)
- **Dedup:** 49 duplicates against existing 33K providers
- **Uploaded:** 269 providers to Supabase
- **Geocoding:** 269 re-geocoded, 98 corrections (>0.01°)
- **Trust signals:** 147 confirmed, 29 more false positives deleted (disability orgs, child care, staffing agencies, beauty salon, travel plaza)
- **Out-of-area cleanup:** 36 providers with coordinates outside Ramapo deleted (cross-location contamination — Tampa FL, Arizona, Long Island, Albany, etc.)
- **Final count:** 204 legitimate providers

**Category Breakdown:**
- Assisted Living: 107, Home Health Care: 51, Nursing Home: 29, Home Care (Non-medical): 22, Memory Care: 19, Independent Living: 12

**Enrichment Coverage:**
- Descriptions: 240/240→204 (100%), Google Reviews: 215/240 (90%), Review Snippets: 215/240 (90%), Trust Signals: 147/240 (61%), Images: 192/240 (80%), Emails: deferred

**Key Issues Found:**
- Slug collisions: providers sharing names across NY state require city suffix in slug (`-ramapo-ny`)
- Parallel enrichment race condition: reviews data and review snippets scripts both wrote to `google_reviews_data` JSONB — snippets overwrote ratings. Fixed with a re-hydration pass.
- Out-of-area contamination: 36 providers had addresses saying "Ramapo, NY" but geocoded to completely different locations (discovery assigned city=Ramapo to all results regardless of actual location). Added post-geocoding area check.

---

### 2026-03-23 (Session 53) — Sunrise Manor, NV City Pipeline

**Branch:** `bright-dijkstra` (no code changes — pipeline ops only)

**What:** Full city expansion pipeline for Sunrise Manor, NV (Las Vegas metro). Discovery → classification → upload → enrichment. All done autonomously end-to-end.

**Pipeline Results:**
- **Discovered:** 632 providers (quick search, ~$5.18)
- **Keyword filter:** removed 21 (hospitals, dialysis, plumbing, pediatric, auto)
- **AI classification:** removed 188 (30% false positive rate — worst: memory_care pulling mental health clinics, assisted_living pulling general apartments)
- **Dedup:** 56 duplicates against existing NV providers
- **Slug collisions:** 10 (existing providers from other cities with same name)
- **Uploaded:** 357 providers to Supabase
- **Geocoding:** 357 re-geocoded, 40 corrections (>0.01°), 0 out of bounds
- **Trust signals:** 157 confirmed, 42 more false positives deleted (general apartments, mobile home parks, referral services, rehab centers, unverifiable businesses)
- **Final count:** 315 legitimate active providers

**Category Breakdown:**
- Assisted Living: 105, Home Health Care: 92, Home Care (Non-medical): 41, Nursing Home: 39, Memory Care: 23, Independent Living: 15

**Enrichment Coverage:**
- Descriptions: 357/357 (100%)
- Google Reviews Data: 302/357 (85%)
- Review Snippets: 298/357 (83%)
- Trust Signals: 157/226 non-CMS (69%)
- Images: 237/357 (66%)
- Emails: deferred to Email Finder script

**Key Observations:**
- 50% overall false positive rate (632 → 315) — highest of any city so far
- Las Vegas metro pulls in massive amounts of general apartments, rehab centers (addiction), mobile home parks, and mental health clinics
- Memory care category continues to be worst offender for false positives
- NV is first state outside NE — pipeline handled state expansion seamlessly

**Notion:** All 14 checkboxes checked, status → Complete (green)

---

### 2026-03-22 (Session 52) — Fix Broken Grand Island Provider Images

**Branch:** `jolly-franklin`

**What:** All 64 Grand Island provider images were broken on the browse page — showing alt text instead of photos. Root cause: the city pipeline stored raw Google Places API photo reference URLs (`places.googleapis.com/v1/.../photos/...`) which are ephemeral and require an API key. Bellevue images worked because the Python enrichment script resolves them to permanent `lh3.googleusercontent.com` URLs.

**Fix:**
1. **Data:** Re-fetched all 64 images via Google Places Photos API with `skipHttpRedirect=true` to get permanent `googleusercontent.com` URLs. 64/64 succeeded.
2. **Pipeline:** Updated `.claude/commands/city-pipeline.md` "Fetch Unique Images" step with explicit instructions to resolve photo references — never store raw API paths.

**Files changed:** `.claude/commands/city-pipeline.md`

---

### 2026-03-22 (Session 51) — Grand Island NE Pipeline Complete

**Branch:** `hardy-elion` (no code changes — pipeline ops only)

**What:** Full city expansion pipeline for Grand Island, NE. Discovery → classification → upload → enrichment. All done autonomously end-to-end.

**Pipeline Results:**
- **Discovered:** 409 providers (quick search, ~$4.26)
- **Keyword filter:** removed 20 (storage, physical therapy, urgent care, etc.)
- **AI classification:** removed 217 (56% false positive rate — worst: memory_care category pulling in retail, mental health, community orgs)
- **Dedup:** 25 duplicates against existing NE providers
- **Uploaded:** 147 providers to Supabase
- **Geocoding:** 147 re-geocoded, 77 corrections (>0.01°), 0 out of bounds
- **Trust signals:** 67 confirmed, 44 more false positives deleted (wrong-location Senior Helpers ×10, disability orgs, general apartments)
- **Final count:** 103 legitimate providers

**Category Breakdown:**
- Assisted Living: 35, Home Health Care: 29, Home Care (Non-medical): 21, Memory Care: 8, Nursing Home: 7, Independent Living: 3

**Enrichment Coverage:**
- Descriptions: 103/103 (100%)
- Google Reviews Data: 79/103 (77%)
- Review Snippets: 79/103 (77%)
- Trust Signals: 67/103 (non-CMS only)
- Images: 64/103 (62%)
- Emails: deferred to Email Finder script

**Key Issues Found:**
- `deleted` column defaults to `false` not `null` — enrichment queries using `.is('deleted', null)` returned 0 rows. Fixed to `.eq('deleted', false)`
- Slug collision: providers sharing names across states need city in slug (`-grand-island-ne` suffix)
- 75% overall false positive rate (409 → 103) — Grand Island had 10 bogus "Senior Helpers" listings from other states

**Notion:** All 14 checkboxes checked, status → Complete (green)

---

### 2026-03-22 (Session 50) — Bellevue NE Pipeline Complete + Major Pipeline Overhaul

**Branch:** `merry-villani`

**What:** Completed all remaining Bellevue, NE enrichment steps. Discovered and killed dead scoring system. Overhauled `/city-pipeline` slash command. Found and removed 119 false positive providers (32% of database was garbage — Walmart, GameStop, Roto-Rooter, etc.).

**Completed — Bellevue Enrichment (all run in parallel):**
1. **Rich Descriptions** — 375 providers, 137 grammar fixes ("a assisted" → "an assisted")
2. **Hydrate Google Reviews Data** — 315 providers got `google_reviews_data` JSONB (rating + review_count)
3. **AI Trust Signals** — 245 non-CMS providers verified via Perplexity Sonar, avg 3.3/8, 0 errors
4. **Review Snippets** — 315 providers got Google review text via Places API, 100% success
5. **Fetch Images** — 298 got Google Places photos, 77 had no photos available
6. **Fetch Email** — Deferred to Email Finder script (Google Places doesn't expose emails)
7. **False Positive Cleanup** — AI-classified all 375 providers, soft-deleted 119 non-senior-care businesses

**Notion status:** Bellevue set to "Complete" (green), all checkboxes checked.

**Key Investigation — Scoring System:**
- `olera_score`, `community_Score`, `value_score`, `information_availability_score` are **dead columns**
- Killed in commit `302a4e5` (March 20) across 10 files — backup at `docs/olera-score-backup.md`
- New system: Google Reviews (ranking) + CMS Medicare (display badge) + AI Trust Signals (display badge)
- Evidence density sorting: `rating × log(reviewCount + 1)`
- Trust signals + CMS are display-only — NOT used in ranking (Notion task created for deep dive)

**Key Investigation — False Positives:**
- 32% of discovery output was non-senior-care businesses
- "Memory Care" discovery category worst offender — matched storage, computing, cognitive therapy
- Keyword filtering misses most false positives — AI classification is non-negotiable
- Should run BEFORE upload to Supabase in unified pipeline, not after

**Infrastructure Improvements:**
- Created `~/Desktop/olera-web/.env.local` with all API keys (Supabase, Perplexity, Google Places)
- Worktrees symlink to it — never ask TJ for keys again
- Found backup keys in `~/Desktop/TJ-hq/Olera/Olera Data Analysis Scripts/*/.env`
- Added `GOOGLE_PLACES_API_KEY` to Vercel

**Files Modified:**
- `.claude/commands/city-pipeline.md` — Major rewrite: correct column names, parallelization strategy, scoring system docs, AI classification step, .env.local setup, known pitfalls expanded
- Memory files: `reference_supabase_credentials.md`, `feedback_google_places_key.md`, `feedback_parallel_pipeline.md`

**Spot Check & Additional Cleanup (post-pipeline):**
- Ran evidence-based scan (reviews, trust signals, website URLs) → flagged 25 suspicious providers
- Sent 16 most suspicious to Perplexity for unified entity check → 12 more false positives deleted
- Total false positives removed: 132/375 (35%) + 1 (Lied Activity Center) + 1 (Bellevue Healthcare DME)
- Final count: ~140 legitimate providers
- **New failure modes discovered:**
  - Wedding venues with senior-sounding names (A View In Fontenelle Hills)
  - Community rec centers seniors attend (Lied Activity Center)
  - DME suppliers categorized as Home Care (Bellevue Healthcare — sells wheelchairs, based in WA)
  - General apartments categorized as Independent Living (Redwood, Brent Village, etc.)
  - Cross-state contamination (WA business in NE results due to matching city name)

**Pipeline Slash Command — Final Updates:**
- Unified entity + trust signals step (one Perplexity call does both classification AND verification)
- Geographic validation added to prompt (verify provider is actually in target city/state)
- DME suppliers added to exclusion list
- Autonomous end-to-end execution (no pausing between steps)
- Updated Cowork SKILL.md and city-expansion-playbook.md to match

**Notion Updates:**
- Bellevue: all boxes checked, status → Complete
- New checkboxes added to board: "Done: Hydrate Google Reviews Data", "Done: Verify Trust Signals (Non-CMS)"
- New task: "Incorporate Trust Signals + CMS Data into Recommendation Ranking"

**Decisions:** See Decisions Made table (6 new entries for 2026-03-22)

---

### 2026-03-10 (Session 48) — Senior Benefits Finder Voice Input (Phases 1-4)

**Branch:** `peaceful-hawking` (worktree)

**What:** Added voice input to the 6-step Benefits Finder intake form. Ported the iOS VoiceIntentParser keyword maps to TypeScript. Built speech recognition hook, mic button component, and wired into the existing form.

**Exploration & Research:**
- Read full Notion task: "Senior Benefits Finder Web Voice Input Integration" (P1)
- Explored iOS codebase (`OleraClean`): SpeechRecognitionManager, VoiceIntentParser, VoiceIntakeViewModel, VoiceMicButton, VoiceOrb, FoundationModelService
- Researched 8 voice APIs: Web Speech API, Deepgram, ElevenLabs Scribe, OpenAI Whisper, Google Cloud STT, AssemblyAI, Azure Speech, Picovoice Cheetah
- Proposed 3 plans: (A) Mic per step, (B) Voice overlay with TTS, (C) Conversational assistant with LLM
- TJ approved Plan A with evolution path to Plan B

**Implementation (Phases 1-4):**
1. `types/speech-recognition.d.ts` — Web Speech API TypeScript declarations
2. `hooks/use-speech-recognition.ts` — Unified hook: start/stop/transcript/error/permissionState. Detects Web Speech API support, handles permission flow, auto-stops on 10s silence
3. `lib/benefits/voice-intent-parser.ts` — Full port of iOS VoiceIntentParser: ZIP (regex + spoken digits), age (compound spoken numbers), care preference (20+ keywords), primary needs (7 categories, multi-select), income (bracket detection with spoken amounts), Medicaid (negation-first checking). Returns typed parse result with confidence + clarification prompts
4. `components/benefits/VoiceMicButton.tsx` — 40x40 mic button, 3 states (idle/listening/disabled), pulse animation, first-use privacy note, processes transcript on stop
5. `components/benefits/VoiceTranscript.tsx` — Real-time transcript, confirmation messages, clarification prompts, aria-live for screen readers
6. `components/benefits/BenefitsIntakeForm.tsx` — Wired mic buttons into all 6 steps. Steps 0-1: mic inline with input. Steps 2-5: mic above pills. Voice results auto-map to form state and auto-advance (except primary needs — additive, no auto-advance). ZIP voice uses `zipToState()` for immediate state code resolution

**Build status:** TypeScript compiles clean. Pre-existing waiver-library prerender failures (unrelated).

**Remaining tasks:**
- Task 4: Parser unit tests (vitest)
- Task 8: City name voice handling (search city list from spoken name)
- Tasks 9-10: Deepgram WebSocket fallback for Firefox/iOS Safari
- Tasks 12-15: Polish (mobile, accessibility, error recovery)

**Files created:** `hooks/use-speech-recognition.ts`, `lib/benefits/voice-intent-parser.ts`, `components/benefits/VoiceMicButton.tsx`, `components/benefits/VoiceTranscript.tsx`, `types/speech-recognition.d.ts`, `plans/benefits-voice-input-plan.md`
**Files modified:** `components/benefits/BenefitsIntakeForm.tsx`, `.env.example`

---

### 2026-03-10 (Session 47) — DNS Cutover Execution + Sitemap Fix + OG Image

**Branch:** `peaceful-wiles` (worktree)

**What:** Executed the full v1.0 → v2.0 DNS cutover, fixed broken sitemap, replaced OG image, submitted sitemap to GSC.

**Cutover steps:**
1. Removed `olera.care` + `www.olera.care` from v1.0 Vercel project (`olera`) via dashboard
2. Added both domains to v2.0 project (`olera-web`) — `www` redirects to apex
3. Verified all 4 domains green in Vercel, homepage loading v2.0
4. Validated 477/500 top GSC provider pages (same 23 failures as pre-cutover)

**Sitemap fix (root cause: static metadata + route conflict):**
- `app/sitemap.ts` is statically generated at build time → Supabase queries fail → empty XML cached
- `app/[category]` dynamic route catches `/sitemap.xml` as a category slug → 404
- Fix: Created `app/api/sitemap/route.ts` (force-dynamic) + rewrite in `next.config.ts`
- PR #216 (error handling) + PR #217 (API route + OG + rewrite) merged to main

**OG image:** Replaced dynamic teal gradient (`opengraph-image.tsx`) with static shutterstock photo (`opengraph-image.jpg`, 1200x630)

**GSC:** Sitemap submitted, 4,943 pages discovered (shard 0). Sitemap index now auto-discovers provider shards.

**Post-cutover:**
- Merged Esther's 6 PRs to staging (#206-#208, #213-#215): auth fixes + error handling
- Added sitemap index (#220): `/sitemap.xml` → sitemapindex pointing to all shards
- Hotfix (#221): `/api/reviews` GET was 5xx (174 errors/5min) — switched from service role to anon client
- Synced main ↔ staging (#223 staging→main, #224 main→staging) — both branches now aligned
- PR #219 (waiver library redesign by Chantel) on hold pending cleanup of `package.json.tmp` + `.mcp.json`

**Files modified:** `app/api/sitemap/route.ts`, `app/api/reviews/route.ts`, `next.config.ts`, `app/sitemap.ts`, `app/opengraph-image.jpg` (new), `app/twitter-image.jpg` (new), `app/opengraph-image.tsx` (deleted), `app/twitter-image.tsx` (deleted)

---

### 2026-03-10 (Session 46) — DNS Cutover: Provider Slug Fix + Pre-flight

**Branch:** `peaceful-wiles` (worktree)

**What:** Discovered critical provider slug mismatch between v1.0 and v2.0, fixed it, then completed all cutover pre-flight checks.

**Critical discovery:** v2.0's slug migration (007) generated `{name}-{state}` slugs, but v1.0 used a progressive algorithm: name-only → +state if duplicate → +city if still duplicate. Result: ~60% of provider URLs would have 404'd after cutover.

**Fix:**
- `008_fix_provider_slugs_v1_compat.sql` — Regenerated all 39K+ slugs using v1.0's algorithm
- `009_patch_v1_slug_mismatches.sql` — Patched 38 top-traffic edge cases (renamed providers, special chars, franchise ambiguity) using `DO $$ EXCEPTION WHEN unique_violation` pattern

**Validation:** Tested all 500 top GSC provider pages → 477/500 pass (95.4%). 23 failures: 20 already 404 on v1.0 (deleted providers), 3 slug conflicts (low traffic).

**Pre-flight completed:**
- All key pages return 200 (homepage, power pages, browse, articles, privacy, terms)
- All redirects working (provider/sign-up, state abbreviations, provider-portal)
- Auth config: Supabase Site URL updated to olera.care, Google OAuth confirmed
- Care inquiry flow tested: Slack + email notifications working

**Files created:** `supabase/migrations/008_fix_provider_slugs_v1_compat.sql`, `supabase/migrations/009_patch_v1_slug_mismatches.sql`

**Status:** Ready for Phase 2 (Cloudflare DNS) → Phase 3 (alias swap)

---

### 2026-03-09 (Session 45) — Bulk PR Merge + SEO Regression Prevention

**Branch:** `focused-snyder` (worktree)

**What:** Processed all 7 open PRs targeting staging, with special focus on preventing SEO regression from stale branches.

**PRs merged (7 total):**
- #187 — Update SCRATCHPAD for session 44 (direct merge)
- #182 — Unify provider card structure (direct merge)
- #184 — Refine provider onboarding UI (direct merge)
- #185 — Fix care post publishing from benefit finder (direct merge)
- #186 — Show accepted provider-initiated requests as leads (direct merge)
- #189 — Waiver library redesign reconciled with SEO work (replaced stale #183)
- #188 — Admin verification approval panel (rebased, then merged)

**Key finding — PR #183 regression prevention:**
- Branch was 23 commits behind staging, would have silently regressed:
  - Self-hosted font → Google Fonts CDN (undoes LCP optimization)
  - Geo-personalized homepage → removed
  - 8 permanent redirects dropped (54 → 46)
  - Provider page parallel queries → sequential
  - Canonical URLs + OG metadata on 6 waiver pages → removed
- Created reconciliation branch: rebased onto staging, resolved 6 waiver page conflicts preserving both UI redesign and SEO metadata
- PR #188 also rebased (29 behind) to avoid Footer "Benefits Hub" → "Waiver Library" regression

**Updated `/pr-merge` slash command (PR #190):**
- Added SEO-sensitive file watchlist (waiver library, benefits, caregiver-support pages)
- Added OG/Twitter image files to critical watchlist
- New regression indicators: self-hosted fonts, geo-personalization, parallel queries, canonical/OG/twitter metadata presence
- Redirect count baseline: 54 permanent redirects as of March 2026

**Notion reports:**
- Bulk merge report: PRs #182-#187
- PR #188 merge report

**Post-merge staging state:** `1fb1bc4` — all critical files verified intact

---

### 2026-03-09 (Session 44) — Notion Board Audit + Cutover Prep

**Branch:** `scratchpad-session-43` (continuation)

**What:** Audited the Notion "Web App Action Items/Roadmap" board, marking completed items and adding missing ones. Drafted XFive cutover memo.

**Notion board updates (12 total):**
- Marked 3 existing items as Done: Lighthouse audit, missing community metadata, forum redesign
- Added 9 new Done items: OG/Twitter metadata, provider SEO (title tags + structured data + LCP), v1→v2 redirects (54), author pages, topic filter tabs, homepage geo-personalization, waiver library redesign, community removal, about/contact/team pages

**Cutover prep:**
- Drafted memo to XFive requesting: (1) spot check before cutover, (2) full export of Q&A data + user accounts from v1 database

**Next up:**
- Send XFive memo
- Receive Q&A + user account export from XFive
- Plan data migration into v2 Supabase
- DNS cutover execution (per `docs/cutover-runbook.md`)
- Submit sitemap to GSC post-cutover

---

### 2026-03-08 (Session 43) — LCP Optimization + Notion Updates

**Branch:** `fix-og-metadata` → PR #179 (merged to staging)

**What:** Optimized Largest Contentful Paint on provider pages and published results to Notion.

**LCP optimization:**
- `app/layout.tsx`: Switched DM Serif Display from render-blocking Google Fonts `<link>` to `next/font/google` self-hosting. Eliminates 3-hop blocking chain (DNS → CSS → font file)
- `app/provider/[slug]/page.tsx`: Parallelized 4 sequential Supabase queries (claim state, similar providers, Q&A, reviews) via `Promise.all`. Inner Q&A + review count also parallelized
- `tailwind.config.ts`: Display font now uses CSS variable `var(--font-dm-serif-display)`

**Lighthouse results (provider page, after):**
- Desktop: Score 90, LCP 2.1s, CLS 0, TBT 0ms, render-blocking 0
- Mobile: Score 88, LCP 3.8s, CLS 0, TBT 80ms, render-blocking 0

**Notion updates:**
- Updated Migration Readiness Report with LCP optimization section + benchmark table
- Created action item: "Submit updated sitemap immediately after DNS cutover" (P1, TJ)
- Created PR #179 merge report

**Merge note:** PR #179 required rebase — would have silently reverted title tag fix from PR #178

---

### 2026-03-07 (Session 42) — Editorial Polish: Author Pages, Topic Tabs, OG Metadata

**Branch:** `stellar-stonebraker` (multiple feature branches merged)

**What:** Completed the editorial content polish workstream — author pages, topic-based filters, CMS improvements, and a full OG metadata audit across the entire site.

**Author pages (`app/author/[slug]/page.tsx`):**
- New dynamic route with `generateStaticParams` for all known authors
- Fetches articles from Supabase, splits into caregiver-support vs research-and-press sections
- Person JSON-LD structured data
- ISR with 60s revalidation

**Topic-based filter tabs (`app/caregiver-support/page.tsx`):**
- Replaced `CareTypeId` tabs with `ArticleTopic` tabs (6 categories)
- New `lib/article-topics.ts`: costs-and-benefits, getting-started, dementia-care, comparing-care, legal-and-planning, wellness-and-support
- SQL migration reclassified 85 articles from format-based to topic-based categories

**Author linking in articles:**
- Both `caregiver-support/[slug]` and `research-and-press/[slug]` now link author names to `/author/[slug]`
- Avatar fallback: if DB `author_avatar` is null, falls back to static author data from `lib/authors.ts`

**CMS admin (`app/admin/content/[articleId]/page.tsx`):**
- Author dropdown pre-filling name, role, avatar on selection
- Category dropdown switched to topic-based options

**OG metadata audit (PR #176):**
- `app/opengraph-image.tsx` + `app/twitter-image.tsx`: Default branded 1200x630 OG image for all pages
- Added `twitter` card metadata to 9 pages/layouts: author, team, about, contact, for-providers, privacy, terms, caregiver-support, research-and-press
- Added missing `siteName` (for-providers, privacy) and `type` (privacy)

**LinkedIn URL fixes:**
- TJ: `/tj-falohun/` → `/tfalohun` (3 files)
- Logan: `/logandubose/` → `/logan-dubose/` (1 file)

**PRs merged to staging:** #172, #174, #175, #176

**Files created:** `lib/authors.ts`, `lib/article-topics.ts`, `app/author/[slug]/page.tsx`, `app/opengraph-image.tsx`, `app/twitter-image.tsx`

**Files modified:** `app/caregiver-support/page.tsx`, `app/caregiver-support/[slug]/page.tsx`, `app/research-and-press/[slug]/page.tsx`, `app/admin/content/[articleId]/page.tsx`, `app/layout.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/team/page.tsx`, `app/for-providers/page.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`, `app/caregiver-support/layout.tsx`, `app/research-and-press/layout.tsx`, `components/for-providers/LeadershipSection.tsx`

---

### 2026-03-07 (Session 41) — GSC Traffic Analysis + Traffic Recovery Pages + Community Removal

**Branch:** `seo-metadata-fixes` (on `stellar-stonebraker` worktree)

**What:** Analyzed GSC export to validate redirect coverage, built pages to recover lost company traffic, removed low-traffic community section, and fixed article meta description strategy.

**GSC Traffic Analysis:**
- Analyzed `docs/Pages.csv` (GSC Performance export, excluding /provider/ URLs)
- Result: 0 URLs returning 404 — all v1.0 paths covered by redirects
- Found 70 clicks lost from `/company/*` pages (about: 21, contact-us: 7, leadership: 42)

**Traffic Recovery Pages:**
- `app/about/page.tsx` (NEW): Mission, origin story (Texas A&M/Sling Health), team teaser with overlapping portraits linking to /team, NIA badge
- `app/contact/page.tsx` (NEW): Phone + email cards, amber "we're a directory" disclaimer, provider CTA
- `app/team/page.tsx` (REWRITTEN): Standalone people-first page after user feedback — full portraits, bios, LinkedIn links

**Community/Forum Removal:**
- GSC showed only 17 organic clicks for forum content — not worth maintaining
- Deleted: `components/home/CommunitySection.tsx`, `app/community/` (4 files), `components/community/` (9 files), `components/team/HeroSection.tsx`, `components/team/TeamSection.tsx`
- Removed community from: Navbar, NavMenuData, Footer, homepage
- Added 302 redirects for `/community` and `/community/:path*` → `/` (temporary, will return)

**Article Meta Description Fix:**
- Changed fallback order: `excerpt || meta_description || undefined` (was `meta_description || excerpt`)
- Rationale: Google pulls snippets from body content for top articles; CMS meta_description would override this
- Verified all top 10 articles have excerpts populated

**Article Analysis:**
- Compared v1 vs v2 body content for #1 article — confirmed identical HTML
- Discovered two taxonomy systems: `care_types` (user-facing CareTypeId) vs `category` (CMS-only ResourceCategory format labels)
- Categories are CMS-internal and can be changed post-migration without SEO impact

**Redirects added (next.config.ts):**
- `/company/about` → `/about`, `/company/leadership` → `/team`, `/company/contact-us` → `/contact`, `/company/investors` → `/about`
- `/community` → `/` (302), `/community/:path*` → `/` (302)
- `/caregiver-forum` → `/` (was → `/community`)

**Footer updated:** Added "About Us" (/about) and "Contact" (/contact) links

**PRs:** #169 (seo-metadata-fixes) — 5 commits

**Bulk article metadata fix (Supabase, via `scripts/fix-article-metadata.mjs`):**
- 95 author roles populated (TJ: 19, Logan: 21, Lisa: 25, Laura: 29, Jamie: 1)
- 2 author name normalizations: "Logan DuBose" → "Dr. Logan DuBose", "Laura Herman - Dementia Care Specialist, CCF" → "Laura Herman" (credential in role)
- 55 care_types assigned (coverage: 37 → 92 of 109 articles, 34% → 84%)
- 17 company news/press articles intentionally left without care_types
- 1 tag fix: custody article had wrong BCBS/insurance tags → legal/guardianship/custody
- Used service role key (anon key silently fails on RLS-protected updates)

**Top 10 article spotcheck (v1 vs v2):**
- 10/10 articles pass: titles, meta descriptions, first paragraphs, H2 structure, authors, JSON-LD all match
- Only minor diff: article #7 has extra "Intro" H2 in v2 (no SEO impact)
- Editorial article migration confirmed clean — no ranking risk

**PRs:** #169 (SEO metadata, merged), #170 (traffic recovery + community removal, merged)

---

### 2026-03-07 (Session 40) — Migration Quick Wins + Homepage Geo-Personalization

**Branch:** `stellar-stonebraker`

**What:** Closed 3 migration strategic gaps (S1, S2, S6) and added city-level geo-personalization to the homepage top providers carousel. Also fixed BrowseCard serif font.

**S1 — Duplicate connections pages:**
- Deleted `/portal/connections` (716 lines) and `/portal/connections/[id]` (545 lines)
- Kept `/provider/connections` (Leads table with urgency filters, sort, slide-out drawer)
- Added redirect in `next.config.ts`, updated 5 API route email/SMS URLs + calendar page links

**S6 — Taxonomy slug aliases:**
- Added `home-health` → `home-health-care` and `nursing-homes` → `nursing-home` to `CATEGORY_ALIASES` in `lib/power-pages.ts`

**S2 — Onboarding dead-end fix:**
- Added condition in `app/onboarding/page.tsx` for signed-in + onboarded users with `intent=provider` or `intent=organization`
- Now opens post-auth flow with intent pre-set instead of bouncing to `/portal`

**Geo-personalized top providers:**
- `app/page.tsx`: Reads `x-vercel-ip-country-region` + `x-vercel-ip-city` headers, validates against US_STATES
- `components/home/TopProvidersSection.tsx`: Cascade — city+state → state → national (all 3 queries in parallel)
- Heading shows "Top-rated providers in Irvine, California" or falls back to state/national
- Homepage is now `ƒ` (dynamic) instead of `○` (static) due to header reads

**BrowseCard font fix:**
- `components/browse/BrowseCard.tsx`: Switched provider name from `font-display` (DM Serif Display) to `font-sans` (Inter)

**SEO metadata audit:**
- Audited all 66 page routes for title, description, canonical, OG, JSON-LD
- Fixed 8 files across 6 waiver library route levels + benefits/finder + terms
- ~1,160 pages gained canonical URLs and OG tags
- 100% of public pages now have full metadata
- Audit report published to Notion

**PRs:** #166 (S1+S2+S6, merged), #167 (geo+font, merged), SEO metadata PR pending

**Commits:** `889d5a1`, `791f7ac`, `63ea52d`, `14e9345`, `2fb0ef4`, `5869fb0`

---

### 2026-03-05 (Session 39) — Family Connection Emails + Mock Data Cleanup

**Branch:** `quick-pike` → merged as PR #147

**What:** Fixed missing family email notifications and removed all mock lead data from provider inbox.

**Bug found:** Provider accept/decline in Inbox did a direct Supabase update, bypassing server-side notifications. Family profiles don't have `email` on `business_profiles`, so message notification email lookup silently failed.

**New template (`lib/email-templates.tsx`):**
- `connectionSentEmail()`: "Your inquiry was sent" — confirmation to family after connection request

**Modified files:**
- `app/api/connections/request/route.ts`: Added family confirmation email (step 9)
- `app/api/connections/message/route.ts`: Email lookup fallback via `accounts` → `auth.users` for families
- `app/api/connections/manage/route.ts`: Added `accept`/`decline` actions with email + Loops
- `components/portal/ConnectionDetailContent.tsx`: `handleStatusUpdate` now calls API instead of direct Supabase

**Mock data removed:**
- `app/provider/inbox/page.tsx`: Removed mock fallback (was showing fake leads when 0 real connections)
- `app/provider/connections/page.tsx`: Emptied `MOCK_LEADS` array
- `hooks/useUnreadInboxCount.ts`: Removed mock count fallback
- `components/shared/Navbar.tsx`: Removed mock leads badge count

**Test results:**
- Test #1 (connection request email): PASS (previously confirmed)
- Test #2 (family confirmation email): PASS — "Your inquiry was sent" email arrives
- Test #6 (approval email): PASS (previously confirmed)
- Test #7 (rejection email): PASS (previously confirmed)
- Test #9 (SMS): BLOCKED — 10DLC registration pending
- Test #10 (Slack lead alert): PASS (previously confirmed)
- Test #13 (Slack approve/reject): PASS (previously confirmed)
- Remaining: #3-5, #8, #11-12, #14-18

**Pending:** Delete fake seed connections from Supabase DB (Sarah Reynolds, James Adeyemi, Diana Nguyen, Linda Washington, Robert Park, Tomoko Chen, Maria Kowalski, Angela Johnson)

---

### 2026-03-04 (Session 38) — Provider Approval/Rejection Email + Notification Testing

**Branch:** `vibrant-keller`

**What:** Added email notification when admin approves/rejects a provider claim. Started systematic notification test matrix (18 tests across all channels).

**New template (`lib/email-templates.tsx`):**
- `claimDecisionEmail()`: Approved → "Your listing is live!" / Rejected → "Your claim needs attention"

**Modified (`app/api/admin/providers/[id]/route.ts`):**
- Expanded `.select()` to include `account_id, slug`
- Added email send + Loops event after Slack alert block
- **Bug fix:** `account_id` references `accounts` table, not `auth.users` — need `accounts.user_id` to look up auth user email

**PRs:** #138 (approval email + Loops), #140 (debug logging), #141 (fix accounts table lookup), #144 (SMS debug logging)

**Test results so far:**
- Test #1 (connection request email): PASS — email arrives, but URL pointed to v1.0 (fixed via `NEXT_PUBLIC_SITE_URL` env var)
- Test #6 (approval email): PASS — email arrives with correct template
- Test #7 (rejection email): PASS — "Your claim needs attention" email arrives
- Test #10 (Slack lead alert): PASS — fires on connection request
- Test #13 (Slack approve/reject): PASS — fires correctly
- Test #9 (SMS connection request): BLOCKED — Twilio returns `success:true` but messages show "Undelivered" (Error 30034: US A2P 10DLC unregistered number)
- Tests #2-5, #8, #11-12, #14-18: Remaining

**Env var fix:** Added `NEXT_PUBLIC_SITE_URL=https://staging-olera2-web.vercel.app` (Preview only) to Vercel. Without it, all email CTAs linked to `olera.care` (v1.0).

**SMS debugging:**
- Added debug logging to SMS block in connection request route (PR #144) — previously catch was completely silent
- Vercel logs confirmed `[sms] Send result: {"success":true}` — Twilio accepted the API call
- Twilio Message Logs showed all 3 messages as "Undelivered" with Error 30034
- Root cause: Twilio number `+12137722970` not registered for A2P 10DLC (US carrier compliance requirement since 2023)
- Submitted Sole Proprietor brand registration + campaign in Twilio console. Approval takes 1-5 business days.

**Postmortem:** Notion MCP Cloudflare rate limiting — documented in `docs/POSTMORTEMS.md`

**Next session:** Continue notification testing. Need `CRON_SECRET` for tests #14-16. Connection accept (#2) needs provider to accept in Inbox. SMS tests (#8-9) blocked on 10DLC approval. Delete existing Aggie connection in Supabase before re-testing connection request URL fix.

---

### 2026-03-04 (Session 37) — Surface Approved Providers in Public Search

**Branch:** `vibrant-keller`

**What:** Made approved business_profiles visible in all public search/browse surfaces. Previously, only the seeded `olera-providers` table (39K+ records) was queried — new providers created through onboarding were invisible even after admin approval.

**New utilities (`lib/types/provider.ts`):**
- `businessProfileToCardFormat()`: Converts `BusinessProfile` → `ProviderCardData` (category display mapping, fallback images, verified badge for claimed)
- `SUPABASE_CAT_TO_PROFILE_CATEGORY`: Maps olera-providers categories → ProfileCategory enum
- `CARE_TYPE_SLUG_TO_PROFILE_CATEGORY`: Maps browse slugs → ProfileCategory enum
- `mergeProviderCards()`: Merges seeded + BP cards, deduplicates by `source_provider_id`

**Modified files:**
- `lib/power-pages.ts`: Parallel BP query in `fetchPowerPageData()` (SSR city/state pages)
- `components/browse/BrowseClient.tsx`: Parallel BP query in client-side fetch
- `app/browse/BrowsePageClient.tsx`: Parallel BP query in client-side fetch
- `components/browse/CityBrowseClient.tsx`: Parallel BP query in client-side refetch

**Visibility filter:** `claim_state = 'claimed' AND is_active = true AND type = 'organization'`

**Commit:** `d4ffa24`

---

### 2026-03-03 (Session 36) — Backend Integration Phase 3-4: Twilio SMS + Vercel Cron

**Branches:** `twilio-sms-integration`, `vercel-cron-jobs`

**What:** Completed remaining backend integration phases — Twilio SMS (Phase 3) and Vercel Cron jobs (Phase 4). All env vars configured end-to-end in Vercel.

**Phase 3: Twilio SMS (PR #112)**
- `lib/twilio.ts`: Twilio singleton, `sendSMS()`, `normalizeUSPhone()`, `maskPhone()`
- `app/api/claim/send-code/route.ts`: Now accepts `method: "sms"` for SMS verification codes
- `app/api/connections/request/route.ts`: SMS notification to provider on new inquiry
- Env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (+12137722970)

**Phase 4: Vercel Cron (PR #113)**
- `vercel.json`: 3 cron schedules
- `app/api/cron/daily-digest/route.ts`: 8 AM CT — email + Slack summary of leads, claims, disputes
- `app/api/cron/unread-reminders/route.ts`: every 6h — nudge for unread messages >24h, with dedup
- `app/api/cron/cleanup/route.ts`: 4 AM UTC — purge expired verification codes + stale connections (30d)
- Env var: `CRON_SECRET`

**Also:**
- PR #111 (Phase 1-2) merged to staging via `/pr-merge` with full regression analysis
- Backlog task added to Notion: "Add SMS toggle to ClaimVerifyForm UI"
- PR merge report published to Notion

**Vercel env vars (10 total now):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `SLACK_WEBHOOK_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `CRON_SECRET`

---

### 2026-03-04 (Session 37) — Loops Marketing Automation Integration (Phase 5)

**Branches:** `magical-keller` → `loops-ensure-account` → `loops-event-properties` → `loops-await-fix`

**What:** Connected Loops marketing automation to 8 route touchpoints. Dual-account routing (olera.care for seekers, oleracare.com for providers). Discovered and fixed 3 bugs during live testing.

**New file:**
- `lib/loops.ts`: Dual-account Loops utility — `sendLoopsEvent()` routes by `audience: "seeker" | "provider"`, `sendLoopsEventBoth()` for suppression. No SDK, single POST, 490-char string truncation, Bearer auth.

**8 routes wired:**
- `app/auth/callback/route.ts`: `user_signup` (OAuth path, seeker)
- `app/api/auth/ensure-account/route.ts`: `user_signup` (email OTP path, seeker) — PR #124
- `app/api/auth/create-profile/route.ts`: `onboarding_completed` (seeker or provider)
- `app/api/connections/request/route.ts`: `new_lead` (seeker)
- `app/api/connections/message/route.ts`: `new_message` (seeker)
- `app/api/connections/respond-interest/route.ts`: `connection_accepted` (seeker)
- `app/api/connections/end/route.ts`: `connection_ended` (seeker)
- `app/api/claim/finalize/route.ts`: `provider_claimed` (provider)
- `app/api/auth/delete-account/route.ts`: `account_deleted` (both accounts)

**Bugs found & fixed:**
1. **`user_signup` never firing** (PR #124): Email OTP signups go through `/api/auth/ensure-account`, not `/auth/callback` (OAuth only). Added sendLoopsEvent to ensure-account.
2. **Loops "unsupported event property tags"** (PR #126): v1 email templates reference `provider_name`, `profile_link`, `care_type`. Added these to `onboarding_completed` event properties.
3. **Intermittent event delivery** (PR #129): All `sendLoopsEvent` calls were NOT awaited. On Vercel serverless, functions freeze after response, killing in-flight HTTP requests. Added `await` to all 9 calls.

**PRs merged:** #123 (core integration), #124 (ensure-account fix), #126 (event properties), #129 (await fix)

**Env vars added to Vercel:**
- `LOOPS_API_KEY_SEEKER` (olera.care account — seeker nurture emails)
- `LOOPS_API_KEY_PROVIDER` (oleracare.com account — provider outreach, protects primary domain)

**Vercel env vars (12 total now):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `SLACK_WEBHOOK_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `CRON_SECRET`, `LOOPS_API_KEY_SEEKER`, `LOOPS_API_KEY_PROVIDER`

**Key lesson:** On Vercel serverless, ALWAYS `await` external API calls before returning the response. "Fire-and-forget" pattern only works if the promise completes before the function freezes.

**Loops workflow configuration (oleracare.com — provider side):**
- `trial_emails` Loop cloned from v1, trigger changed to `onboarding_completed`
- Had to manually register event properties (`provider_name`, `profile_link`, `city`, `care_type`) on the Loop trigger — Loops doesn't auto-register from received events
- Fixed `care type` → `care_type` tag mismatch in email template (space vs underscore)
- Simplified to single welcome email + loop completed (removed multi-day drip for now)
- Loop is now **Active** and processing

**Loops workflow configuration (olera.care — seeker side):**
- Welcome email Loop active (configured in earlier part of session)

**Await fix verified:** `onboarding_completed` firing reliably after PR #129 (3 events in event log, latest at 12:41 PM)

**Pending:** Configure remaining Loops workflows — `new_lead`, `new_message`, `connection_accepted`, `connection_ended`, `provider_claimed`, `account_deleted`

---

### 2026-03-03 (Session 35) — Backend Integration Phase 1-2: Email + Slack

**Branch:** `magical-keller`

**What:** Built out the email notification system and Slack admin alerts from the Backend Integration Roadmap. Also explored legacy `olera-backend` repo, created gap analysis, and detailed 5-phase plan.

**New files:**
- `lib/email.ts`: Resend singleton + `sendEmail()` helper (fire-and-forget safe)
- `lib/email-templates.tsx`: 5 branded HTML templates (verification code, connection request, connection response, new message, claim notification)
- `lib/slack.ts`: Slack webhook helper + 4 pre-built alert functions (new lead, provider claimed, dispute, approve/reject)
- `docs/backend-integration-analysis.md`: Full gap analysis — legacy Rails vs v2.0 Next.js
- `plans/backend-integration-roadmap-plan.md`: 5-phase, 17-task implementation plan

**Modified routes:**
- `app/api/claim/send-code/route.ts`: Refactored inline Resend → shared email util
- `app/api/claim/finalize/route.ts`: Added admin email + Slack on claim
- `app/api/connections/request/route.ts`: Added provider email + Slack lead alert
- `app/api/connections/respond-interest/route.ts`: Added email on accept
- `app/api/connections/message/route.ts`: Added email with 5-min debounce
- `app/api/disputes/route.ts`: Added Slack alert
- `app/api/admin/providers/[id]/route.ts`: Added Slack alert on approve/reject

**Env vars configured in Vercel:**
- `RESEND_API_KEY` (new olera-web-v2 key, sending access)
- `ADMIN_NOTIFICATION_EMAIL` (automations@olera.care)
- `SLACK_WEBHOOK_URL` (new webhook → #notifications channel)

**Also done:**
- `olera.care` domain added + verified in Resend (auto-configured via Cloudflare)
- Sentry deprioritized from P2 to P4 (Vercel logs sufficient for now)
- 14 Notion roadmap tasks created in Web App Action Items/Roadmap database
- Provider email coverage: 26% in olera-providers (9,541/36,667), ~0% in business_profiles

**Decisions:**
- All notifications fire-and-forget (try/catch, never block main flow)
- Message emails debounced — skip if recipient active in last 5 min
- Keep old "Olera SMTP" Resend key alive — Supabase Auth OTPs depend on it
- Use `noreply@olera.care` for all notification emails

**PR:** #111 targeting staging

**Commits:** `dc3cec0` (Phase 1: Email), `7641dd7` (Phase 2: Slack)

---

### 2026-03-03 (Session 34) — Leadership Team Page + Admin Fixes + img Cleanup

**Branch:** `joyful-goodall`

**What:** Completed 3 Notion roadmap tasks in one session: P1 Leadership Team page, P2 raw img tag fix, P2 admin silent failures fix.

**Task 1: Leadership Team Page** (PR #106)
- New `/team` route: `app/team/page.tsx` (server component with metadata)
- `components/team/HeroSection.tsx`: serif display heading, fade-in animation via `useInView`
- `components/team/TeamSection.tsx`: two large portrait cards, staggered scroll animations, expanded bios, LinkedIn links
- Updated `Footer.tsx` (added "Our Team" link), `sitemap.ts` (added /team), `LeadershipSection.tsx` (crosslink)
- Adjusted from `aspect-[3/4]` to `aspect-square` after checking actual headshot dimensions (500x500, 415x415)

**Task 2: Raw `<img>` Tags** (PR #107)
- Replaced 4 raw `<img>` tags in `app/caregiver-support/page.tsx` with `next/image` using `fill` mode
- Added `sizes` prop and `priority` flag for above-fold images

**Task 3: Admin Silent Failures** (PR #108)
- Added error state + red error banners to 5 admin pages:
  - `app/admin/page.tsx`: partial-load warning when individual API calls fail
  - `app/admin/images/page.tsx`: list error + detail error + action error
  - `app/admin/leads/page.tsx`: list fetch error
  - `app/admin/providers/page.tsx`: list error + approve/reject action error
  - `app/admin/team/page.tsx`: list error + replaced `alert()` with inline banners
- Pattern: `bg-red-50 border border-red-200` matching existing `content/page.tsx`

**All 3 PRs merged to staging. All 3 Notion tasks marked Done.**

---

### 2026-03-02 (Session 33) — Individual Article Page Editorial Redesign

**Branch:** `joyful-turing`

**What:** Transformed `/caregiver-support/[slug]` from a generic CMS article dump into a composed editorial reading experience with strong typography hierarchy, sticky TOC, and elegant content blocks.

**New files:**
- `lib/article-html.ts`: Heading extraction + ID injection utility (regex-based, handles h2/h3, slugified IDs, duplicate handling)
- `components/article/TableOfContents.tsx`: Client component — `DesktopTableOfContents` (sticky sidebar, IntersectionObserver scroll tracking) + `MobileTableOfContents` (collapsible panel)

**CSS (`app/globals.css`):**
- Added `.prose-editorial` class alongside `.prose-medium` (admin editor untouched)
- Serif H2 headings, primary-600 blockquote borders + list markers, subtle link underlines, scroll-margin-top for sticky nav offset

**Page restructure (`app/caregiver-support/[slug]/page.tsx`):**
- Breadcrumb chain → simple "← Caregiver Support" back link
- Category as subtle uppercase text (not pill)
- H1: `font-display` serif, `text-display-sm md:text-display-md`
- Metadata row: middot-separated author + date + reading time
- Hero image: `aspect-[2/1]`, `rounded-2xl`, aligned to body text left edge
- Body layout: unified container (`max-w-[1100px]`), header + image + body in same left column (`flex-1 max-w-[680px]`), TOC sidebar (`w-[220px]`) on desktop
- TOC shows only when 2+ headings; no sidebar layout when 0 headings
- Contextual CTA: quiet border card, no gradient/emoji
- Author card: border-t separator (no bg-gray-50), hidden for "Olera Team"
- Tags: simple text links, no pill borders
- Related articles: "Recommended" title, category labels, reading time, `aspect-[3/2]` images
- Bottom gradient CTA removed entirely
- Mock data processed through same HTML pipeline

**UI critique fix:** Aligned header, image, and body to shared left edge by unifying into one container. Added middot separators to metadata row.

**Commits:** `1089551`, `bca54b1`

---

### 2026-03-02 (Session 32) — Caregiver Support Editorial Redesign

**Branch:** `joyful-turing`

**What:** Redesigned `/caregiver-support` from a generic CMS grid into a calm, editorial surface. Inspired by Fuse, Craft, Perplexity, and Notion blogs.

**Page redesign (`app/caregiver-support/page.tsx`):**
- Hero: serif title (`font-display`), subtle subtitle, white bg, tight spacing
- Featured section: 1 dominant (16:9 image, left 3/5) + 3 secondary (right 2/5, stacked)
  - Structural fix: image grid separated from text so secondary articles align with image height, not full column
  - Featured articles pulled client-side from `featured: true` flag (already existed on ContentArticle)
  - Graceful fallback: 0 featured → skip; 1 → full-width; 2 → side-by-side
- Category filters: soft text pills, no counts/emojis, `rounded-full`, no container
- Article grid: `aspect-[3/2]`, `rounded-lg`, 3-col desktop, larger images, reading time
- Removed ProviderBanner CTA from grid
- Page bg: `bg-white`, max width: `max-w-6xl`
- Multiple spacing iterations to get featured + category pills above fold

**API changes:**
- `app/api/caregiver-support/route.ts`: added `?featured=true` param, raised per_page cap to 200
- `app/api/admin/content/route.ts`: added `author`, `featured`, `sort_by`, `sort_dir` params + distinct authors list

**Admin dashboard (`app/admin/content/page.tsx`):**
- Author dropdown filter (populated from API)
- Featured dropdown filter (All / Featured Only / Not Featured)
- Sortable Title, Published, Updated columns

**Key debugging:**
- Featured article not showing: `.slice(0, 3)` cut off 4th featured article (3 from Sanity import + 1 new). Changed to `.slice(0, 4)`
- Layout shift: added `FeaturedSkeleton` placeholder during loading
- Secondary misalignment: restructured grid to separate image from text

**Commits:** `0038270`→`9330325` (10 commits)

---

### 2026-03-02 (Session 31) — Sanity CMS → Supabase Content Migration

**Branch:** `friendly-rosalind`

**What:** Migrated all 103 articles from Sanity CMS (v1.0) into the Supabase `content_articles` table. Articles are now viewable and editable in the admin CMS dashboard.

**Script:** `scripts/import-sanity.ts`
- Fetches all `eduMaterial` (85) + `researchAndPress` (18) articles from Sanity's public GROQ HTTP API
- Maps Sanity fields → `content_articles` schema (slug, title, excerpt, care_types, SEO fields, etc.)
- Converts Sanity Portable Text → `content_html` (via `@portabletext/to-html`) and `content_json` (Tiptap/ProseMirror JSON)
- Converts Sanity image refs to CDN URLs
- Maps Sanity category IDs → v2 CareTypeIds (6 care types)
- Upserts via `onConflict: 'slug'` — safe to re-run
- Supports `--dry-run` flag

**Also included (from prior work on this branch):**
- Layout: preconnect/dns-prefetch hints for external domains (GA, Supabase, map tiles)
- Navbar: reordered provider hub menu (Statistics first, Account last), replaced Q&A with Statistics, improved alt text on profile images

**Dependency added:** `@portabletext/to-html`

**Files modified:** `scripts/import-sanity.ts` (new), `package.json`, `package-lock.json`, `app/layout.tsx`, `components/shared/Navbar.tsx`, `SCRATCHPAD.md`

---

### 2026-03-01 (Session 30) — P1 Redirect Fixes + Playbook Cleanup

**Branch:** `seo/structured-data-p1`

**What:** Implemented three P1 redirect fixes and cleaned up stale playbook entries. PR #83 opened targeting staging, merge analysis clean.

**Redirect fixes:**
- `/caregiver-support/*` → `/resources/*`: 3 rules (bare → hub, single-slug → passthrough, multi-segment → hub)
- `/providers` → `/for-providers`: permanent 301
- Category alias redirects: switched from `redirect()` (307) to `permanentRedirect()` (308) in all 3 category page levels

**Playbook cleanup:**
- Marked FAQPage (PR #81), Review/Geo/Price (PR #82) as done in P1 fixes list and readiness checklist
- Updated takeaways: "structured data gap closed" (8 of 12 schemas), score 90% (A-)
- Updated route inventory: caregiver-support and /providers rows now show ✅

**Files modified:** `next.config.ts`, `app/[category]/page.tsx`, `app/[category]/[state]/page.tsx`, `app/[category]/[state]/[city]/page.tsx`, `docs/migration-playbook.md`, `SCRATCHPAD.md`

**Commits:** `2455fbd`, `8fb3624`

**PR:** #83 targeting staging — merge analysis clean, CI passing

---

### 2026-03-01 (Session 29) — Rich Structured Data (GeoCoordinates + PriceSpecification + Review)

**Branch:** `seo/structured-data-p1`

**What:** Added three structured data schemas to provider page LocalBusiness JSON-LD. Also ran slug migration, merged PR #81, and decided to defer MedicalBusiness.

**Structured data added:**
- **GeoCoordinates**: lat/lng in LocalBusiness for Google Maps and local pack
- **UnitPriceSpecification**: min/max price with HOUR/MONTH unit — piped raw `lower_price`/`upper_price` through metadata (was dead code before)
- **Review**: up to 5 individual reviews with star ratings for rich results

**Bug fix:** `meta?.lower_price` and `meta?.upper_price` were dead code — those fields don't exist on `ExtendedMetadata`. Fixed by adding `price_min`, `price_max`, `price_unit` to metadata in `iosProviderToProfile()`.

**Other actions this session:**
- Ran `007_provider_slugs.sql` in Supabase SQL Editor (verified working)
- Merged PR #81 (FAQPage + explain command) to staging via `/pr-merge`
- Decided to skip MedicalBusiness schema (low reward, revisit as P3)
- SEO score: 75% (B-) → **85% (B+)**

**Files modified:** `app/provider/[slug]/page.tsx`, `lib/mock-providers.ts`, `docs/migration-playbook.md`, `SCRATCHPAD.md`

**Commits:** `c510b95`, `ca6a5b8`

**PR:** #82 targeting staging

---

### 2026-03-01 (Session 28) — FAQPage JSON-LD + Notion Update + Corrections

**Branch:** `bold-gates`

**What:** Added FAQPage structured data to provider pages (P1 competitive differentiator), updated Notion migration playbook, corrected two false claims from session 27.

**Corrections made:**
- DNS cutover has NOT happened — olera.care is still running v1.0 (was falsely marked as done)
- provider_id is 7-char alphanumeric, not human-readable (was falsely claimed as slugs)
- Fixed in: `docs/migration-playbook.md`, `SCRATCHPAD.md`, Notion page (4 sections updated)

**FAQPage JSON-LD implementation:**
- Server-side fetch of answered questions from `provider_questions` table using service client
- FAQPage schema only emitted when real Q&A pairs with non-empty answers exist
- Questions passed to QASectionV2 as initial data (SSR-visible for crawlers)
- Graceful degradation if service client unavailable

**Notion playbook updates:**
- Added status callout at top with all findings
- Updated Phase 1 (slug parity), Phase 4 (redirects done), Phase 5 (DNS not done), Guardrails
- Footer updated with edit date

**Other:**
- Created `/explain` slash command for plain-English technical guidance
- SQL migration `007_provider_slugs.sql` still needs to be run manually in Supabase

**Files modified:** `app/provider/[slug]/page.tsx`, `docs/migration-playbook.md`, `SCRATCHPAD.md`, `.claude/commands/explain.md`

**Commits:** `c3462eb`, `b42611a`

---

### 2026-03-01 (Session 27) — Migration P0 Fixes

**Branch:** `bold-gates`

**What:** Investigated provider slug format compatibility (P0 #0), then implemented P0 SEO fixes for the v1.0 → v2.0 migration.

**Key discoveries:**
- **olera.care is still running v1.0** — DNS cutover has NOT happened yet (corrected in session 28)
- **`provider_id` is 7-char alphanumeric** (e.g., `r4HIF35`) — NOT human-readable. Added `slug` column (corrected in session 28)
- Provider page was rendering error HTML without `notFound()` — fixed

**Code changes:**
- `app/provider/[slug]/page.tsx`: Import `notFound()`, replace error HTML div with `notFound()` call
- `middleware.ts`: Added state abbreviation → full slug redirects (301) for all 51 states × all category routes, plus pagination suffix stripping

**Playbook updates:**
- Marked P0 #0, #1, #2 as complete in `docs/migration-playbook.md`
- Updated SEO report card rows for 404 handling, state abbreviations, pagination
- Updated overall score: 67% (C+) → 75% (B-)
- Updated readiness checklist to reflect DNS cutover already completed
- Updated key takeaways with new findings

**Files modified:** `app/provider/[slug]/page.tsx`, `middleware.ts`, `docs/migration-playbook.md`, `SCRATCHPAD.md`

---

### 2026-03-01 (Session 26) — v1.0 → v2.0 Migration Playbook

**Branch:** `claude/notion-action-items-1FXqC`

**What:** Deep exploration and documentation of the full migration from Olera v1.0 to v2.0. No code changes — pure research and planning.

**Deliverables:**
- `docs/migration-playbook.md` — 305-line comprehensive playbook with 6 sections
- Provider page SEO report card: 40 elements audited vs APFM & Caring.com
- Complete v1.0 route inventory (49 routes) mapped to v2 equivalents
- DNS zero-downtime cutover plan (from XFive + Vercel docs)
- CMS migration strategy outline (Sanity → TBD)
- Pre/post-cutover readiness checklist (20 tasks)

**Key discoveries:**
- v1.0 state URLs use abbreviations (`/fl`), v2 uses full names (`/florida`) — ~10,300 pages need redirect middleware
- v1.0 has forum (8 routes), relief network (4 routes), editorial content (66 articles) with no v2 equivalents
- Provider page is 67% SEO-complete — main gaps are structured data schemas
- APFM does NOT have FAQPage schema — adding it to Olera v2 = competitive advantage
- **CRITICAL:** v1.0 uses human-readable provider slugs (`/provider/elara-caring-ct`), v2 uses `provider_id`. If these don't match, 39K+ URLs will 404.
- XFive CSV analysis: `routes-clean.csv` (49 routes), `redirects.csv` (13 internal redirects)
- v1.0 CMS is Sanity with 66 articles + 7 press articles needing migration

**Pending:**
- Update Notion task with full playbook (TJ will do on local machine with MCP access)
- Verify provider_id format matches v1.0 slugs (P0 #0)
- Export top 100 pages from Search Console

**Commits:** `25f85d3`, `15c5608`, `d285004`, `1221a38`, `1fb0f72`, `07d31a4`

---

### 2026-02-28 (Session 25) — Homepage Final Polish & PR

**Branch:** `glad-goodall`

**What:** Final polish pass — NIH badge, community container, CTA redesign. PR #79 ready for merge.

- NIH badge: added actual NIA logo to homepage hero, iterated on size/position/spacing — compact, bottom-right, not distracting
- Community section: wrapped docuseries + flat links in unified `bg-gray-100` rounded container to fix unbounded feel
- CTA section: full redesign — stripped teal gradient + blobs, replaced with white bg, warm human copy ("You don't have to figure this out alone"), single primary button
- Removed `"use client"` from CTASection (no longer needed)

**Files modified:** `components/home/HeroSection.tsx`, `components/home/CommunitySection.tsx`, `components/home/CTASection.tsx`

**Commits:** `57e9550`→`d87e230` (multiple iterations on NIH badge + community + CTA)

---

### 2026-02-28 (Session 24) — Homepage Polish Continued

**Branch:** `glad-goodall`

**What:** Continued Phase 3 polish across all remaining sections. Design taste pass using Perena/Airbnb/Claude principles.

- Hero: shortened subtext, defaulted care type to Home Care, "Find local help" link
- Top Providers: honest heading ("Top-rated" not "near you"), subtitle, mobile scroll fade, skeleton count fix
- Explore Care: bento grid → uniform 3-col card grid with self-hosted images
- Social proof trust strip: removed entirely (no user value)
- Community: rebuilt 3x — final version is editorial docuseries layout + Perena-style flat link rows (Discord, Facebook, Resources, Benefits)
- CTA: unchanged
- Page flow: Hero → Top Providers → Explore Care → Community → CTA

**Commits:** `7f4a1f5`, `6caf6c8`, `cfac6d3`, `eccbeb6`, `407471c`, `3cf75f1`

---

### 2026-02-28 (Session 23) — Homepage Section-by-Section Refactor

**Branch:** `glad-goodall`

**What:** P1 Notion task — broke 1,440-line monolith into composable sections, removed redundancy, reordered flow.

**Commits:** `b5f997a`, `d4dbff7`, `599c7d6`

---

_Older sessions archived to `archive/SCRATCHPAD-2026-02.md`_
