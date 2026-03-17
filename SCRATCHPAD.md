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

- **Guest Connection Flow (Remove Auth Gate)** — DONE ✅
  - PRs #243, #245, #248, #250, #251, #252 all merged to staging + promoted to main
  - Auth gate replaced with simple inquiry form (email, name, phone, message)
  - Guest placeholder profiles + magic link for account creation
  - Pre-fill for signed-in users, enrichment (who/when) shown post-submit in card
  - Honeypot spam protection + rate limiting (5/hr per email)
  - Reconciled with Phase 1+2 (#251) and enrichment PR (#252)

- **Guest Q&A (Remove Auth Gate)** — DONE ✅
  - PRs #254, #257 merged to staging + promoted to main (#255, #258)
  - Guests ask questions without signing in — fire-first, optional enrichment
  - Slack notifications (#notifications) + email to provider and asker
  - Admin approval (pending status), rate limiting, honeypot
  - Hotfix #258: email notifications for provider + asker on question submit

- **V1.0 Reviews Migration** — DONE ✅
  - PR #226 merged to staging + promoted to main (#227)
  - 34 legitimate v1.0 reviews imported via migrations 016 + 017
  - Admin `/admin/reviews` page with filter, search, moderation controls
  - Schema: nullable account_id/relationship, migration_source column

- **Waiver Library Redesign** — DONE ✅
  - PRs #236 (forms pages), #247 (hero, map, CTA) merged to staging
  - Teal sticky headers, searchable program lists, localStorage checklist persistence
  - Hero: "Save Up to $10,000 on Care", redesigned map with full-name pills
  - 528 programs populated with application forms across all 50 states

- **Senior Benefits Finder: Voice + Results Redesign** — DONE ✅
  - PR #256 merged to staging
  - Guided voice mode: conversational intake with TTS narration (Chrome/Edge)
  - Results redesign: progressive disclosure, confidence bars, savings badges, "Recommended First Step" hero card
  - Print optimization, document checklist behind toggle
  - Auth gate removed from intake — results shown to everyone

- **Phase 1+2: Benefits Auth + Provider UX + Family Onboarding** — DONE ✅
  - PR #239, reconciled via #251, merged to staging
  - Unauthenticated Benefits Finder results, soft auth banner
  - Provider matches: "who needs care" display, all care type tags
  - Family onboarding: Matches Invite step, refresh fix, email robustness

- **Phase 3: Discovery UX Improvements** — DONE ✅
  - PR #259 merged to staging (2026-03-13)
  - Welcome banner (glassmorphism) for "I'll explore first" users
  - Matches promotion on /saved page, profile quality labels on family cards
  - OAuth post-auth fix: full onboarding for new users
  - Removed publish restrictions for family Matches profiles
  - Cleaned up 13 debug console.logs before merge

- **Notes from the Field Issue 1** — DONE ✅
  - PR #241 merged to staging + promoted to main (#242)
  - PDF at `/docs/NotesFromTheField_Issue1.pdf`
  - Article live at `/research-and-press/notes-from-the-field-issue-1`

- **Paywall Removal** — DONE ✅
  - PRs #229, #232 merged — all features free, `canEngage()` always returns true
  - Onboarding popup removed for family users (#234)
  - Post-auth onboarding improved (#231)

- **SBF Accuracy Audit & Recommendation Quality Review** — AUDIT COMPLETE ✅
  - Full audit of recommendation engine: 7 findings across geography, logic, taxonomy, ranking, data quality
  - Root cause of College Station bug: county field is never populated → AAA fallback = first alphabetically
  - Critical: Chantel's 528-program waiver library is disconnected from the matching engine
  - 4-phase improvement plan created in Notion (Phases 1-2 = P1 🔥, Phases 3-4 = P2)
  - Audit doc: `docs/sbf-accuracy-audit.md`

- **Olera MedJobs: Student Caregiver Talent Marketplace** (branch: `modest-dijkstra`) — IN PROGRESS (Phases 1-3 done)
  - Plan: `plans/medjobs-plan.md`
  - Notion tasks: Original + Enhanced v2 (both P1 🔥)
  - **Phase 1 DONE:** Migration 019 (student profile type, experience_logs, universities, job_posts tables), TypeScript types, 50 TX universities seed
  - **Phase 2 DONE:** Landing page `/medjobs`, 4-step application form `/medjobs/apply`, candidate browse `/medjobs/candidates`, student profile pages, 6 email templates
  - **Phase 3 DONE:** Provider dashboard `/provider/medjobs`, candidate browsing `/provider/medjobs/candidates`, full student profile view, application API with email/SMS/Slack notifications
  - **Next:** Phase 4 (Loops events, weekly digest cron, profile nudge cron), Phase 5 (nav integration, sitemap, admin panel)
  - **Deferred:** Phase 6 (credential engine UI), Phase 7 (Stripe billing)

- **Provider Home Page (Marketing Landing)** (branch: `shiny-maxwell`) — IN PROGRESS
  - Plan: `plans/provider-home-page-plan.md`

- **Provider Deletion Request & Admin Approval** (branch: `relaxed-babbage`) — PLANNED
  - Plan: `plans/provider-deletion-request-plan.md`

- **Backend Integration Roadmap** — PHASES 1-5 COMPLETE ✅
  - Plan: `plans/backend-integration-roadmap-plan.md`
  - Phases: ~~Email~~ ✅ → ~~Slack~~ ✅ → ~~Twilio SMS~~ ✅ → ~~Vercel Cron~~ ✅ → ~~Marketing (Loops)~~ ✅ → Sentry (P4 backlog)
  - **Notification Test Matrix:** [Notion](https://www.notion.so/Notification-Test-Matrix-2026-03-04-3195903a0ffe8190be95d95554e52dd1) — 18 tests across Email/SMS/Slack/Cron/Loops

---

## Blocked / Needs Input

- ~~**Migration Playbook → Notion:**~~ ✅ Done (2026-03-01) — updated via Notion MCP
- ~~**Top 100 pages from Search Console:**~~ ✅ Done — GSC export analyzed, 0 404 risks found
- ~~**Editorial content redirect decision:**~~ ✅ Done — all v1.0 content routes now have redirects in `next.config.ts`: `/research-and-press/*` → homepage, `/caregiver-forum/*` → `/`, `/caregiver-relief-network/*` → homepage, `/company/*` → dedicated pages

---

## Next Up

1. **SBF Phase 1: Fix Critical Bugs** — ZIP→county resolution, AAA matching fix, carePreference in scoring (P1 🔥)
2. **SBF Phase 2: Unify Data** — Parse Chantel's 528 programs into structured format, migrate to Supabase, fix needs-to-categories mapping (P1 🔥)
3. **SBF Phase 3: Improve Matching Quality** — Sub-state geo data, weighted scoring model, validation layer (P2)
4. **SBF Phase 4: Ongoing Quality** — Test harness with 10-20 personas, admin review tool (P2)
5. **Fix Supabase 1000-row limit** in provider sitemap shards (returns 1000 instead of 10,000)
6. **Monitor GSC for 404 spikes** — ongoing post-cutover
7. **Send XFive cutover memo** — request spot check + Q&A/user account export from v1
8. **Continue notification test matrix** — tests #3-5, #8, #11-12, #14-18 remaining
9. **Delete fake seed connections** from Supabase (Sarah Reynolds, James Adeyemi, etc.)
10. **Provider Home Page** — next feature work (plan exists)
11. **Provider Deletion Request** — planned (plan exists)

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
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
| 2026-03-11 | Remove auth gate for family connections (magic link approach) | Traffic flowing but no connect requests — auth wall killing conversion. Collect email inline, fire lead immediately, send magic link for optional account creation. Logan approved. |
| 2026-03-11 | Remove paywall entirely — all features free | Startup should focus on usage before gating. `canEngage()` always returns true. Can re-add later. |
| 2026-02-21 | Server-side pagination for directory | 36K+ records — must use Supabase `.range()` |
| 2026-03-12 | Simple inquiry form over multi-step wizard | Multi-step intent wizard had too much friction. Single form (email, name, phone, message) fires lead immediately, optional enrichment post-submit |
| 2026-03-12 | Fire-first UX for Q&A | Question submits immediately, then optional enrichment prompt for name/email. Zero friction > data completeness |
| 2026-03-13 | OAuth post-auth: 5-min window detection | Replace always-on onboarding popup with targeted check: only auto-open for accounts created <5 minutes ago. Prevents nagging returning users |
| 2026-03-13 | Voice intake for Benefits Finder (Chrome/Edge only) | TTS + speech recognition for guided conversational intake. Disabled on Firefox/Safari (no API support) |
| 2026-03-13 | Progressive disclosure for Benefits results | 3 beats: moment of relief → explore at your pace → tools when ready. Top 5 programs shown, rest behind "See more" |
| 2026-03-14 | SBF accuracy issues are systemic, not surface-level | Root cause is structural: no county resolution, two disconnected data systems, no sub-state geo intelligence. Needs phased fix, not a patch. |
| 2026-03-14 | Chantel's 528-program waiver library is the path forward | Must be parsed into structured format and migrated to Supabase to power recommendations. Currently only used for static Waiver Library pages. |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-03-16 (Session 52) — MedJobs Architecture + Phases 1-3 Implementation

**Branch:** `modest-dijkstra` (from staging)

**What:** Designed and began implementing Olera MedJobs — a student caregiver talent marketplace. Read both Notion tasks in full, explored existing codebase (auth, email, Supabase schema, notifications), created architecture plan, then implemented Phases 1-3.

**Architecture decisions:**
- Student as new `profile_type` enum value (safe additive migration)
- 3 new tables: `medjobs_experience_logs`, `medjobs_universities`, `medjobs_job_posts`
- Reuse `connections` table for student→provider applications
- StudentMetadata JSONB with credential engine fields from day one
- Separate MedJobs email templates file for modularity
- RLS: student profiles public (like org/caregiver), contact info gated at API layer

**Files created (3,712 lines across 3 commits):**
- `supabase/migrations/019_medjobs_foundation.sql` — schema
- `scripts/seed-universities.sql` — 50 TX universities
- `plans/medjobs-plan.md` — 7-phase, 24-task plan
- `lib/types.ts` — updated with StudentMetadata + MedJobs types
- `lib/medjobs-email-templates.tsx` — 6 email templates
- `app/medjobs/page.tsx` — landing page
- `app/medjobs/apply/page.tsx` — 4-step application form
- `app/medjobs/candidates/page.tsx` — public candidate browse
- `app/medjobs/candidates/[slug]/page.tsx` — student profile (public)
- `app/api/medjobs/apply/route.ts` — student application API
- `app/api/medjobs/candidates/route.ts` — candidate query API
- `app/api/medjobs/apply-to-provider/route.ts` — application + notifications
- `app/provider/medjobs/page.tsx` — provider MedJobs dashboard
- `app/provider/medjobs/candidates/page.tsx` — provider candidate browse
- `app/provider/medjobs/candidates/[slug]/page.tsx` — provider student profile view

**Next session:** Phase 4 (Loops events, weekly digest cron, profile nudge cron), Phase 5 (nav integration, sitemap, admin panel)

---

### 2026-03-14 (Session 51) — SBF Accuracy Audit & Recommendation Quality Review

**Branch:** `great-shaw` (from staging)

**What:** Full audit of the Senior Benefits Finder recommendation engine per Notion P1 task. Deep exploration of matching logic, geographic resolution, data systems, and scoring model.

**7 Findings:**
1. **Critical:** County is never populated — AAA matching falls back to first agency alphabetically (root cause of College Station → Alamo AAA bug)
2. **Critical:** Two disconnected data systems — Chantel's 528-program waiver library (`data/waiver-library.ts`) is not used by the recommendation engine (which queries smaller Supabase `sbf_*` tables)
3. **High:** No sub-state geographic intelligence — all state programs shown to all state users
4. **Medium:** `carePreference` collected but never used in scoring
5. **Medium:** `needsToCategories` mapping has blind spots — housing, food, utilities categories unreachable
6. **Medium:** Additive scoring model has no geographic component, causes score compression
7. **Low:** Name-based deduplication is fragile

**Files created:**
- `docs/sbf-accuracy-audit.md` — Full audit document with all findings and recommendations

**Notion:**
- Audit document: [SBF Accuracy Audit & Recommendation Quality Review](https://www.notion.so/3235903a0ffe81ff9a44cd35ced4b12a)
- 4 phase tasks created in Web App Action Items/Roadmap:
  - Phase 1: Fix Critical Bugs (P1 🔥)
  - Phase 2: Unify Data (P1 🔥)
  - Phase 3: Improve Matching Quality (P2)
  - Phase 4: Ongoing Quality (P2)

**No code changes** — this was a research/audit session only.

---

### 2026-03-13 (Session 50) — PR #259 Merge + SCRATCHPAD Refresh + Staging → Main Promotion

**Branch:** `scratchpad-session-50` (from staging)

**What:** Merged Esther's Phase 3: Discovery UX PR, audited all recent activity (20+ PRs merged in 3 days), refreshed SCRATCHPAD and memory, then promoted staging to main.

**PR #259 merge:**
- Cleaned up 13 debug console.logs from AuthProvider.tsx and PostAuthOnboarding.tsx
- Verified all critical files intact post-merge (Footer, AuthProvider CACHE_TTL, GA4, redirects)
- Notion merge report published

**SCRATCHPAD refresh:**
- Marked 9 items DONE: Guest connections, Guest Q&A, V1.0 reviews, Waiver library, Benefits Finder voice+results, Phase 1+2, Phase 3, Notes from the Field, Paywall removal
- Updated Next Up: removed 3 completed items, added staging→main promotion
- Added 5 new decisions to Decisions table

**Memory updates:**
- `project_current_state.md` — current shipped vs staging state
- `project_team_contributors.md` — team members and patterns
- `project_ux_pattern_fire_first.md` — fire-first UX pattern

**Staging → main promotion:** PR #260 (53 commits)

---

### 2026-03-12 (Session 49) — Guest Connection Flow Takeover

**Branch:** `zealous-gauss` (fresh from staging)

**Context:** Esther handed off `feature/remove-auth-gate-connection-flow` (PR #237). Magic link redirects were blocked by Supabase redirect URL allowlist. TJ taking over to finish.

**Completed:**
- Added `https://*.vercel.app/**` to Supabase Auth redirect URL allowlist (was the main blocker)
- Verified existing redirect URLs: `olera.care/portal/inbox`, `www.olera.care/portal/inbox`, Site URL = `https://olera.care`
- Applied Esther's full 30-file diff cleanly onto staging (no merge conflicts — her branch was current with staging)
- Removed debug `console.log` statements from `lib/site-url.ts` and `app/api/connections/request/route.ts`
- Fixed cross-device magic link bug in `AuthProvider.tsx`: hash token handler now checks URL `next` param before falling back to localStorage (supports users clicking magic link on different device/browser)
- TypeScript compilation passes clean

**Files changed:** 22 modified + 8 new files (+1604/-235 lines)

**Key new files:**
- `lib/site-url.ts` — Environment-aware URL resolution
- `components/providers/connection-card/EmailCapture.tsx` — Guest email collection
- `app/auth/magic-link/page.tsx` — Client-side implicit flow handler
- `app/api/auth/claim-profiles/route.ts` — Placeholder → real profile migration
- `app/api/connections/guest-inbox/route.ts` — Guest inbox (bypasses RLS)
- `app/api/connections/guest-profile/route.ts` — Guest profile lookup by token
- `components/auth/MagicLinkHandler.tsx` — localStorage redirect persistence
- `supabase/migrations/018_guest_connection_flow.sql` — DB migration (already run)

**Architecture:**
1. Guest visits provider → clicks Connect → 2-step intent (who + when)
2. Email capture step → guest email collected
3. Placeholder family profile created (account_id = NULL, claim_token = UUID)
4. Connection created with guest_email for rate limiting (5/hr per email)
5. Magic link generated via Supabase Admin API → combined email sent
6. Guest redirected to /connected/[id] success page → can access guest inbox
7. Magic link click → /auth/magic-link processes hash tokens → sets session → ensure-account → claim-profiles migrates connections → redirect to inbox
8. Placeholder deleted, connections moved to real family profile

**Still TODO:**
- [ ] Run full build on Vercel (preview deployment via push)
- [ ] End-to-end test: guest connect → email → magic link → inbox
- [ ] Review security: rate limiting, CAPTCHA decision
- [ ] PR to staging

---

### 2026-03-11 (Session 48) — PR Merges + Unblock Guest Connection Flow

**Branch:** `sunny-pike`

**What:** Merged Esther's 2 PRs to staging, then unblocked her guest connection flow (remove auth gate) by configuring Supabase + Vercel + running migration.

**PRs merged:**
- #232 — Remove paywall completely, all users have full access (3 files, +90/-930)
- #234 — Fix: Remove onboarding popup for family users + fix inbox refresh (3 files, +14/-8)
- #219 — Skipped (Chantel's waiver library, still needs cleanup)

**Guest connection flow unblock (Esther's `feature/remove-auth-gate-connection-flow`):**
- Verified Supabase redirect URLs already present (3 inbox URLs)
- Added Vercel `NEXT_PUBLIC_SITE_URL` = `https://olera.care` for Production environment (Preview was already set)
- Ran migration 018 on Supabase: `claim_token` UUID, nullable `account_id`, `guest_email` on connections
- Reviewed Esther's 10-commit branch: EmailCapture component, guest connection API, claim-profiles API, guest-inbox API, middleware guest token bypass
- Flagged merge conflicts: AuthProvider.tsx (#234 removed onboarding popup, her branch re-adds with claim token skip), membership.ts + pro/page.tsx (#232 gutted paywall, her branch has old version)

**Notion reports:** PR #232 and #234 merge reports published to PR Merge Reports folder

**Staging:** `b5b2248` — all critical files verified intact post-merge

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
