# Scratchpad

> A living document for tracking work in progress, decisions, and context between sessions.
> Older sessions archived to `archive/SCRATCHPAD-2026-02.md` and `archive/SCRATCHPAD-2026-03.md`

---

## Current Focus

- **Olera MedJobs: Student Caregiver Talent Marketplace** — IN PROGRESS (Phases 1-5 done, design polish in progress)
  - Plan: `plans/medjobs-plan.md`
  - Phases 1-5 DONE, PR #273 merged to staging
  - Design polish PR #279 (branch `shiny-knuth`): photo-forward candidate cards, real testimonial photos, hero image tuning, university partner logos, optional photo upload in application
  - **Deferred:** Phase 6 (credential engine UI), Phase 7 (Stripe billing)

- **SBF Accuracy Audit** — AUDIT COMPLETE, FIXES PLANNED
  - 7 findings across geography, logic, taxonomy, ranking, data quality
  - 4-phase improvement plan in Notion (Phases 1-2 = P1 🔥)
  - Audit doc: `docs/sbf-accuracy-audit.md`

- **Provider Deletion Request & Admin Approval** — ON STAGING ✅

---

## Blocked / Needs Input

_(Nothing currently blocked)_

---

## Next Up

1. **Push MedJobs to main** — promote staging after design polish PR merges
2. **Test photo upload end-to-end** on staging preview deploy
3. **SBF Phase 1: Fix Critical Bugs** — ZIP→county resolution, AAA matching fix, carePreference in scoring (P1 🔥)
4. **SBF Phase 2: Unify Data** — Parse Chantel's 528 programs into structured format, migrate to Supabase (P1 🔥)
5. **Monitor GSC for 404 spikes** — ongoing post-cutover
6. **Send XFive cutover memo** — request spot check + Q&A/user account export from v1
7. **Continue notification test matrix** — tests #3-5, #8, #11-12, #14-18 remaining
8. **Delete fake seed connections** from Supabase (Sarah Reynolds, James Adeyemi, etc.)

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-17 | University logos: grayscale default, color on hover | 5 partner schools with existing connections (TAMU, Michigan, Houston, Prairie View, Maryland) |
| 2026-03-17 | Hero image uses native square aspect ratio | Source is 1080x1080; forced aspect ratios looked awkward |
| 2026-03-17 | Photo upload is no-auth, fire-and-forget | Students aren't signed in during application; profile creates first, photo is best-effort |
| 2026-03-17 | Minh-Nguyet Hoang is MD/MBA Candidate at Texas A&M | Not PA / Health Science Center as initially assumed |
| 2026-03-14 | SBF accuracy issues are systemic, not surface-level | Root cause is structural: no county resolution, two disconnected data systems, no sub-state geo intelligence |
| 2026-03-14 | Chantel's 528-program waiver library is the path forward | Must be parsed into structured format and migrated to Supabase to power recommendations |
| 2026-03-13 | OAuth post-auth: 5-min window detection | Replace always-on onboarding popup with targeted check: only auto-open for accounts created <5 minutes ago |
| 2026-03-13 | Voice intake for Benefits Finder (Chrome/Edge only) | TTS + speech recognition for guided conversational intake. Disabled on Firefox/Safari (no API support) |
| 2026-03-12 | Simple inquiry form over multi-step wizard | Multi-step intent wizard had too much friction. Single form fires lead immediately |
| 2026-03-12 | Fire-first UX for Q&A | Question submits immediately, then optional enrichment. Zero friction > data completeness |

---

## Notes & Observations

- Project is a TypeScript/Next.js 16 web app for senior care discovery
- Key colors: #198087 (primary teal), warm orange palette, serif headings for editorial feel
- Homepage components: `components/home/` — HeroSection, TopProvidersSection, ExploreCareSection, CommunitySection, CTASection
- Shared hooks: `hooks/use-in-view.ts`, `hooks/use-animated-counters.ts`, `hooks/use-city-search.ts`

---

## Session Log

### 2026-03-17 (Session 54) — MedJobs Design Polish: Cards, Photos, Logos, Testimonials

**Branch:** `shiny-knuth` (from staging) — PR #279

**What:** Major design polish pass on MedJobs landing page and candidate browse. Photo-forward candidate cards, real testimonial photos, hero image tuning, and university partner logos.

**Changes (7 commits):**
- `app/medjobs/candidates/page.tsx` — Full card redesign: large photo (aspect-[3/4]) at top with gradient+initial fallback, structured criteria rows (Track, Location, Availability, Care Experience, Certifications, Verified Hours), "View Profile →" button
- `app/medjobs/apply/page.tsx` — Optional circular photo upload in "About You" step, fire-and-forget upload after profile creation
- `app/api/medjobs/upload-photo/route.ts` — New API: no-auth photo upload to Supabase `profile-images` bucket, updates `image_url` on business_profile
- `app/medjobs/page.tsx` — Multiple iterations:
  - Testimonials: Minh-Nguyet Hoang (MD/MBA, Texas A&M) and Jeswin Vennatt (MD/MBA, Texas A&M) with real photos
  - Hero image: tuned from 4/3 → 3/4 → 4/5 → square (native 1080x1080)
  - University trust bar: text list → real logos (Texas A&M, Michigan, Houston, Prairie View A&M, Maryland) with grayscale hover effect
- `public/images/medjobs/` — jeswin-vennatt.png, minh-nguyet-hoang.jpg, universities/ (5 logos)

**Decisions:**
- Photo upload is no-auth (students aren't signed in during application)
- Upload is fire-and-forget — profile creates first, photo is best-effort
- Candidate cards use gradient backgrounds with initials as fallback when no photo
- Hero image uses native square aspect ratio (1080x1080 source) — no cropping
- University logos: grayscale by default, color on hover — 5 partner schools with existing connections
- Minh-Nguyet Hoang is MD/MBA Candidate at Texas A&M (not PA / Health Science Center)

**Also:** Marked Provider Home Page as DONE, Provider Deletion as ON STAGING. GSC sitemap re-submission discussed.

**Next session:** Push MedJobs to main, test photo upload end-to-end on staging, add real pilot photos to "Meet the Students" cards, continue SBF Phase 1 bug fixes.

---

### 2026-03-17 (Session 53) — MedJobs Phases 4-5, Migration Fixes, Competitive Analysis, Design Polish

**Branch:** `modest-dijkstra` (continued)

**What:** Completed Phases 4-5 implementation, fixed 3 migration issues discovered during production deploy, ran competitive analysis (CareYaYa, Papa, Honor, Caring Support), and iterated on landing page design 3 times based on taste pass and competitive patterns.

**Migration fixes (ran on production):**
- `profile_type` is TEXT + CHECK constraint, not a PostgreSQL enum (schema.sql is misleading)
- Trigger function is `update_updated_at_column()` not `update_updated_at()`
- Table is `business_profiles` not `profiles`
- Saved these learnings to memory: `feedback_schema_text_not_enum.md`

**Competitive analysis highlights:**
- CareYaYa: 30K+ students, $15-18/hr, scrapbook aesthetic, career outcome hook ("double acceptance rate")
- Papa: $241M funded, companionship model, playful SVG animations, segmented hero
- Olera's moat: verified credential engine (no competitor has this)
- Report in Notion under original MedJobs task page

**Landing page evolution:**
1. Template version (dark gradient, numbered circles) → too generic
2. Minimal Perena version (warm stone bg, flat lists) → too cold/corporate
3. Photo-forward version (split hero, photo mosaic, testimonials) → warm but needed real photos
4. Refined with competitive patterns: career outcome hook in hero ("that counts toward your degree"), specific hour requirements (PA: 1,000-2,000), woven testimonials, provider stat cards
5. Added real pilot photos from TJ's files

**Files created/modified this session:**
- `app/api/cron/medjobs-digest/route.ts` — weekly candidate digest
- `app/api/cron/medjobs-nudge/route.ts` — profile completion nudge
- `lib/slack.ts` — MedJobs alert helpers
- `vercel.json` — added 2 cron schedules
- `components/shared/Navbar.tsx` — MedJobs link
- `components/shared/Footer.tsx` — MedJobs link
- `components/admin/AdminSidebar.tsx` — MedJobs nav item
- `app/admin/medjobs/page.tsx` — admin student table
- `app/api/sitemap/route.ts` — medjobs entries
- `app/medjobs/page.tsx` — redesigned 3x
- `supabase/migrations/019_medjobs_foundation.sql` — 3 fixes

**Next session:** Get real pilot photos for remaining placeholders, test application flow end-to-end on preview deploy, consider Phase 6 (credential engine UI).

---

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
