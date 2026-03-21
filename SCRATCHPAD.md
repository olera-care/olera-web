# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Trust Signals & Smart Ranking — Replacing the Olera Score** — IN PROGRESS
  - Plan: `plans/trust-signals-plan.md`
  - Notion: [Trust Signals & Smart Ranking](https://www.notion.so/3295903a0ffe810e9baada745e4ebbad)
  - Replaces AI-derived Olera Score with verifiable signals (Google Reviews, CMS data, behavioral demand)
  - Phase 1: Remove score from all UI. Phase 2: Google backfill for uncovered categories. Phase 3: CMS integration. Phase 4: Smart ranking.
  - Branch: `gentle-hawking`

- **Google Review Snippets on Provider Pages** — LIVE ON PRODUCTION ✅
  - Plan: `plans/google-review-snippets-plan.md`
  - Seed log: `docs/google-reviews-seed-log.md`
  - 5,423 providers seeded with Google reviews ($0 actual cost)
  - Unified "What families are saying" section with source badges
  - Tiered monthly cron + on-demand backfill + Google Business linking in onboarding
  - PRs: #296, #297, #298, #299, #300, #301

- **Admin Lead Deletion + Search + Pagination** — IN REVIEW (PR pending)
  - Plan: `plans/admin-delete-leads-plan.md`
  - Notion task: "Add ability to quickly delete leads from admin dashboard" (P1 🔥)
  - Inline per-row trash icon + bulk checkbox select + delete
  - Hard delete with confirmation dialog, audit-logged
  - Server-side search by profile name (debounced 300ms)
  - Pagination at 25 per page with Previous/Next controls

- **"Manage this page" CTA + Fix Provider Email Links** — DONE ✅ (merged PR #289)

- **Meet the Owner Section** — SHIPPED TO PRODUCTION ✅ (PRs #302, #303)
  - Plan: `plans/meet-the-owner-plan.md`
  - Notion task: "Meet the owner section" (P1 🔥)
  - Two placements: compact "Managed by" badge + full "Facility Manager" section
  - Provider portal edit modal for owner info + admin directory editing

- **Olera MedJobs: Student Caregiver Talent Marketplace** — DONE (on staging)
  - Plan: `plans/medjobs-plan.md`
  - Phases 1-5 DONE, PR #273 merged to staging
  - Design polish PR #279 merged
  - **Deferred:** Phase 6 (credential engine UI), Phase 7 (Stripe billing)

- **SBF Accuracy Audit** — AUDIT COMPLETE, FIXES PLANNED
  - 7 findings across geography, logic, taxonomy, ranking, data quality
  - 4-phase improvement plan in Notion (Phases 1-2 = P1 🔥)
  - Audit doc: `docs/sbf-accuracy-audit.md`

---

## Blocked / Needs Input

_(Nothing currently blocked)_

---

## Next Up

1. **Run full TX AI verification** — `staging-olera2-web.vercel.app/api/admin/verify-trust-signals?state=TX&limit=20&offset=5` (keep incrementing offset)
2. **Run TX home health CMS import** — `staging-olera2-web.vercel.app/api/admin/import-cms-data?state=TX&source=home_health`
3. **Run nationwide CMS import** — `?state=all&source=home_health&batch=1` then `&batch=2` etc, repeat for `source=nursing_home`
4. **Run nationwide AI verification** — all states, non-CMS categories
5. **Tune AI prompt if needed** — avg confirmed signals is 1.0, may need to relax constraints
6. **Phase 4: Smart ranking** — evidence-density sort on browse page
7. **SBF Phase 1: Fix Critical Bugs** — ZIP→county resolution, AAA matching (P1 🔥)
8. **SBF Phase 2: Unify Data** — Parse Chantel's 528 programs into Supabase (P1 🔥)

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Tiered refresh strategy (not blind monthly) | At 100K providers, blind refresh = $500/month. Tiered (claimed > viewed > long tail) = ~$100/month. Scales to 500K. |
| 2026-03-20 | Replace Olera Score with Trust Signals system | Score was AI opinion (Perplexity) presented as fact. Both care seekers and providers rejected it. Replace with verifiable signals: Google Reviews, CMS federal data, behavioral demand. Olera becomes curator, not judge. |
| 2026-03-20 | CMS data integration viable (~30% match rate) | CMS Home Health + Nursing Home + Hospice datasets = ~32.5K providers. Free API, no key needed, quarterly updates. ~10,800 Olera providers enrichable. |
| 2026-03-20 | Google Reviews is primary quality signal, not Olera Score | Care seekers want "what others are saying" not algorithmic opinion. Google rating available for 61% of providers. Star color changed teal→amber with "on Google" attribution. |
| 2026-03-19 | Remove Olera Score from reviews zone (keep in header/sidebar) | Until ScoreCalculator v2 is ported, two disconnected scores (Olera 4.3 vs Google 5.0) erode trust. Bring back when data is connected. |
| 2026-03-19 | Unified reviews feed with source badges | v1 had separate sections. Merged into one "What families are saying" with Google/Olera badges per card. Less cognitive load. |
| 2026-03-19 | JSONB on olera-providers (not separate table) | Only storing 2 reviews per provider. Not worth a join. Simpler queries. |
| 2026-03-19 | Places API (New) over legacy | $5/1K vs $17/1K for place details with reviews. Same data. |
| 2026-03-19 | Created Notion task for ScoreCalculator v2 (P2) | Port from olera-backend Ruby. Weights shift as Google review count grows: Reputation 0.7→0.3, Google 0.2→0.6, Profile 0.1 constant. |
| 2026-03-17 | University logos: grayscale default, color on hover | 5 partner schools with existing connections (TAMU, Michigan, Houston, Prairie View, Maryland) |
| 2026-03-17 | Hero image uses native square aspect ratio | Source is 1080x1080; forced aspect ratios looked awkward |
| 2026-03-17 | Photo upload is no-auth, fire-and-forget | Students aren't signed in during application; profile creates first, photo is best-effort |
| 2026-03-14 | SBF accuracy issues are systemic, not surface-level | Root cause is structural: no county resolution, two disconnected data systems, no sub-state geo intelligence |
| 2026-03-13 | OAuth post-auth: 5-min window detection | Replace always-on onboarding popup with targeted check: only auto-open for accounts created <5 minutes ago |
| 2026-03-12 | Fire-first UX for Q&A | Question submits immediately, then optional enrichment. Zero friction > data completeness |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Google Places API key: restricted to Places API (New) only, project "Olera Provider API" (olera-provider-api)
- 36,668 active providers, 32,042 with place_id, 22,337 with google_rating > 0
- 5 providers seeded with Google reviews as test data (hanstel-homehealth, hanameel-at-peace-home-care, etc.)
- Scaling to 100K providers expected within 2 months

---

## Session Log

### 2026-03-20 (Session 58) — Replace Olera Score with Trust Signals (Phase 1)

**Branch:** `gentle-hawking` (from staging)

**What:** Deep exploration of Olera Score trust problem, designed new Trust Signals system, implemented Phase 1 (complete score removal from all UI).

**Exploration & Strategy (3+ hours):**
- Read `olera_score_evaluator.py` — discovered score is Perplexity AI opinion with built-in upward bias (target ~4.3, random boosting)
- Identified root cause: algorithmic assessment in visual language of social proof
- Designed 3-layer replacement: Google Reviews (social proof) → CMS Data (federal quality) → Behavioral Demand (organic)
- Tested CMS enrichment feasibility: ~30% match rate = ~10,800 providers enrichable with federal quality data
- Created Notion strategy doc: "Trust Signals & Smart Ranking — Replacing the Olera Score"
- Iterated through 3 revisions based on TJ feedback (provider cooperation constraints, CMS-uncovered categories, ranking without score)

**Phase 1 Implementation (Tasks 1-8) — committed `302a4e5`:**
- Removed `oleraScore` from all 10 files (computation, props, rendering, structured data, admin, hooks)
- Changed hero star color teal→amber with "on Google" attribution
- JSON-LD `aggregateRating` now sourced from Google reviews data only (not AI score)
- Removed admin score editing (Community, Value, Info Availability fields)
- Cleaned score mapping from dashboard hooks, onboarding shell, mock providers
- Browse cards updated: star color amber, "on Google" attribution text
- TypeScript compiles clean

**Phase 2 Start (Task 9) — committed `f479ffa`:**
- Added optional `categories` query param to Google review seed endpoint
- Allows targeted backfill for CMS-uncovered categories (Home Care, Assisted Living, Independent Living)

**Files modified:**
- `app/provider/[slug]/page.tsx` — score removal, Google attribution, JSON-LD fix
- `components/providers/SectionNav.tsx` — removed score badge from sticky header
- `components/providers/MobileStickyBottomCTA.tsx` — removed score from mobile sheet
- `components/providers/connection-card/CardTopSection.tsx` — removed score display, simplified to price-only
- `components/providers/connection-card/types.ts` — removed oleraScore from interface
- `app/admin/directory/[providerId]/page.tsx` — removed score edit fields
- `app/api/admin/directory/[providerId]/route.ts` — removed score from updatable fields
- `hooks/useProviderDashboardData.ts` — removed score from Supabase query
- `components/provider-onboarding/SmartDashboardShell.tsx` — removed score mapping
- `lib/mock-providers.ts` — removed score from metadata

**Files created:**
- `docs/olera-score-backup.md` — full backup of all removed code for revert
- `plans/trust-signals-plan.md` — 18-task implementation plan across 4 phases

**Next session:** Task 10 (run targeted backfill for CMS-uncovered categories), then Phase 3 (CMS data integration).

---

### 2026-03-20 (Session 57) — Admin Lead Deletion + Search + Pagination

**Branch:** `eager-lovelace` (from staging)

**What:** Added inline and bulk delete for connections on `/admin/leads`, plus server-side search and pagination.

**Implementation:**
1. DELETE API with audit logging
2. Confirmation dialog (inline + bulk)
3. Checkbox select-all + bulk delete bar
4. Optimistic UI with rollback
5. Server-side search (debounced 300ms)
6. Pagination (25/page)

**Files:** `app/admin/leads/page.tsx`, `app/api/admin/leads/route.ts`, `plans/admin-delete-leads-plan.md`

---

### 2026-03-19 (Session 56) — Meet the Owner Section: Full Implementation

**Branch:** `fair-franklin` (from staging) — PR #302 merged to staging, PR #303 promoted to main

**What:** End-to-end "Meet the Owner" feature — facility manager section on provider detail pages with portal and admin editing. Fetched Notion roadmap, picked "Meet the owner section" (P1), explored codebase, planned, implemented, and shipped.

**Implementation (6 tasks across 4 phases):**
1. `lib/types.ts` — New `StaffInfo` interface with `care_motivation` field, added to `OrganizationMetadata`
2. `app/provider/[slug]/page.tsx` — Verified badge on "Managed by" compact badge + full "Facility Manager" section with shadow card, care motivation, trust line, Connect CTA
3. `components/provider-dashboard/edit-modals/EditOwnerModal.tsx` — Portal edit modal (name, position, photo upload, care motivation, bio)
4. `components/provider-dashboard/OwnerCard.tsx` — Dashboard card wired into `DashboardPage.tsx`
5. `app/admin/directory/[providerId]/` — Admin owner editing with auto-creation of `business_profiles` for unclaimed providers
6. `app/provider/[slug]/page.tsx` — Fixed staff data loading for iOS providers (claim lookup now fetches metadata)

**Key debugging:**
- Staff data for iOS providers wasn't showing because claim state lookup only fetched `claim_state, account_id` — not `metadata`. Fixed to also fetch and merge `staff` from `business_profiles.metadata`.
- Auto-create `business_profiles` when admin saves owner info for unclaimed providers (no linked record existed before).
- TJ tested on wrong Vercel deploy (commit before the metadata fix) — identified by checking deployment commit hash.

**UI polish iterations:**
- Photo card: w-40→w-52, p-5→px-6 pt-8 pb-6, rounded-xl→rounded-2xl, added shadow-md
- Avatar: 80px→96px, verified badge 20px→24px
- Name: text-sm→text-base font-bold, position: text-xs→text-sm

**Files created:**
- `components/provider-dashboard/OwnerCard.tsx`
- `components/provider-dashboard/edit-modals/EditOwnerModal.tsx`
- `plans/meet-the-owner-plan.md`

**Files modified:**
- `app/provider/[slug]/page.tsx` — owner section + staff data merge from business_profiles
- `app/admin/directory/[providerId]/page.tsx` — owner editing UI
- `app/api/admin/directory/[providerId]/route.ts` — staff save + auto-create business_profiles
- `components/provider-dashboard/DashboardPage.tsx` — OwnerCard + EditOwnerModal wiring
- `components/provider-dashboard/edit-modals/types.ts` — added "owner" SectionId
- `lib/types.ts` — StaffInfo interface
- `lib/profile-completeness.ts` — StaffInfo type reference

**Next session:** Continue with remaining P1 tasks from Notion roadmap (Google Review Snippets to provider pages, Olera Score refinement, admin lead deletion).

---

### 2026-03-19 (Session 55) — Google Review Snippets: Full Implementation

**Branch:** `fresh-ride` (from staging) — PRs #296, #297 merged

**What:** End-to-end Google review snippets on provider pages. Explored v1 repos (olera-backend, olera-fe-experiments), designed tiered cost strategy, built full pipeline, iterated on UI/UX through 3 design passes.

**Exploration phase:**
- Fetched Notion roadmap, identified "Add Google Review Snippets to provider pages" (P1 🔥)
- Cloned and analyzed `olera-backend` (Ruby) and `olera-fe-experiments` (TypeScript) for v1 review implementation
- Found: v1 used monthly cron, Google Places Details API, `google_reviews` table, ScoreCalculator with dynamic weights
- Found: `olera-providers` table already has `place_id` (32K providers) and `google_rating` (22K)
- Created Notion task for ScoreCalculator v2 port (P2)

**Cost analysis (deep dive):**
- Blind monthly at 100K providers = $500/month ($300 after credit)
- Designed tiered strategy: claimed monthly, viewed monthly, long tail quarterly = ~$100/month
- Includes `last_viewed_at` tracking for tier 2 decisions
- On-demand backfill as safety net (non-blocking, doesn't hurt page load)

**Implementation (12 tasks across 4 phases):**
1. Google Cloud setup — API key created, restricted to Places API (New)
2. Supabase migration 021 — `google_reviews_data` JSONB + `last_viewed_at` columns + index
3. `lib/google-places.ts` — fetch utility with batch support
4. `app/api/cron/google-reviews/route.ts` — tiered monthly cron (1st of month, 3 AM UTC)
5. `app/api/admin/seed-google-reviews/route.ts` — admin seed with dry_run mode
6. View tracking — non-blocking `last_viewed_at` updates (debounced >24h)
7. `app/api/internal/backfill-google-review/route.ts` — on-demand backfill trigger
8. `components/providers/GoogleReviewSnippets.tsx` — standalone component (later merged into ReviewsSection)
9. Provider page integration — google_reviews_data + place_id captured from raw query

**UI/UX evolution (3 iterations):**
1. **v1:** Olera Score circle + breakdown bars + separate Google Reviews section → two competing scores, dashboard feel
2. **v2:** Removed Olera Score from zone, single "What families are saying" with Google data only → clean but disconnected from Olera reviews
3. **v3 (shipped):** Unified feed merging Google + Olera reviews with source badges ("Google review" with G icon, "Olera review 🌿") → one section, one story

**Key design decisions:**
- Removed Olera Score circle + breakdown bars until ScoreCalculator v2 is ported (scores contradict without connected data)
- Olera Score still visible in header badge + connection card sidebar
- Warm header: "What families are saying" (not "Google Reviews")
- Reviews positioned above About (Q&A → Reviews → About)

**Dry run results:**
- 36,668 active providers, 22,337 eligible for seed (google_rating > 0)
- Initial seed cost: ~$112 one-time
- 5 providers seeded as test batch — all worked end-to-end

**Files created:**
- `lib/google-places.ts` — Google Places API fetch utility
- `app/api/cron/google-reviews/route.ts` — tiered monthly cron
- `app/api/admin/seed-google-reviews/route.ts` — admin seed endpoint
- `app/api/internal/backfill-google-review/route.ts` — on-demand backfill
- `components/providers/GoogleReviewSnippets.tsx` — standalone component (kept for reference)
- `supabase/migrations/021_google_reviews.sql` — schema changes
- `plans/google-review-snippets-plan.md` — detailed plan with cost projections

**Files modified:**
- `app/provider/[slug]/page.tsx` — google_reviews_data capture, view tracking, backfill trigger, section reorder
- `components/providers/ReviewsSection.tsx` — accepts googleReviewsData, merged feed, source badges
- `components/providers/AllReviewsModal.tsx` — DisplayReview type extended, normalizeReviews merges Google
- `lib/types.ts` — GoogleReviewSnippet, GoogleReviewsData types
- `lib/types/provider.ts` — google_reviews_data, last_viewed_at fields
- `vercel.json` — added google-reviews cron schedule
- `.env.example` — GOOGLE_PLACES_API_KEY

**Gap identified:** Pipeline only works for `olera-providers` table. New providers in `business_profiles` don't get Google reviews. Next steps: extend page to read from BP metadata, add Google linking to onboarding, add to admin directory.

**Next session:** Extend Google reviews pipeline to business_profiles (steps A/B/C), then bulk seed.
