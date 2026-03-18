# Plan: Olera MedJobs — Student Caregiver Talent Marketplace

Created: 2026-03-16
Status: Not Started

## Goal

Build a self-serve, two-sided marketplace inside Olera 2.0 that connects pre-health students with senior care providers who need staff — with a credential engine data model ready from day one.

## Success Criteria

- [ ] Students can sign up, create a profile, upload a resume, and specify availability/location
- [ ] Providers can browse student candidates, filter by location/availability/experience, and contact them
- [ ] Provider MedJobs subscription ($50/month) gates candidate contact info (billing deferred — free for now)
- [ ] Automated emails: student welcome, provider candidate alerts, weekly candidate digest
- [ ] Data model supports credential engine (hours tracking, provider confirmations) even if UI is Phase 2
- [ ] University is a data dimension — can deploy to new campuses without code changes
- [ ] Zero impact on existing platform performance (modular, lazy-loaded)

---

## Architecture Decisions

### A1: Student as a new profile type

**Decision:** Add `student` to the `profile_type` enum.

**Why:** The `business_profiles` table is already a universal entity. Students fit the same pattern — they have a display name, location, metadata, and participate in connections. Adding a type is one safe migration (`ALTER TYPE profile_type ADD VALUE 'student'`). This doesn't touch existing rows.

**Alternative considered:** Separate `students` table. Rejected because it would duplicate location fields, slugs, account linking, connection patterns, and RLS infrastructure that already exist.

### A2: StudentMetadata in JSONB

**Decision:** Define a `StudentMetadata` interface for the `metadata` JSONB column, following the same pattern as `OrganizationMetadata`, `CaregiverMetadata`, and `FamilyMetadata`.

```typescript
export interface StudentMetadata {
  // Education
  university: string;
  campus?: string;              // For multi-campus universities
  major: string;
  graduation_year: number;
  gpa?: number;
  program_track: StudentProgramTrack;  // "pre_nursing" | "nursing" | "pre_med" | "pre_pa" | "pre_health" | "other"

  // Experience
  certifications?: string[];     // CNA, BLS, First Aid, etc.
  years_caregiving?: number;
  care_experience_types?: string[];  // "dementia", "post_surgical", "mobility", etc.
  languages?: string[];

  // Availability
  availability_type?: "part_time" | "full_time" | "flexible" | "summer_only" | "weekends";
  hours_per_week?: number;
  available_start?: string;      // ISO date
  transportation?: boolean;
  willing_to_relocate?: boolean;
  max_commute_miles?: number;

  // Media
  resume_url?: string;           // Supabase Storage path
  video_intro_url?: string;      // Video intro (v1 differentiator)
  linkedin_url?: string;

  // Credential engine (data model ready, UI Phase 2)
  total_verified_hours?: number;  // Computed from experience_logs
  verified_care_types?: string[]; // Distinct care types from verified logs

  // Status
  profile_completeness?: number;  // 0-100, computed
  seeking_status?: "actively_looking" | "open" | "not_looking";
}
```

### A3: New tables for MedJobs-specific data

Three new tables that don't exist in the current schema:

**1. `medjobs_experience_logs`** — Credential engine backbone

Tracks hours worked at a provider. Provider can confirm/deny. This is the data that eventually becomes the "Clinical Experience Transcript."

```sql
create table public.medjobs_experience_logs (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.profiles(id) on delete cascade,
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
  hours numeric(7,1) not null,
  care_type text not null,           -- "dementia_care", "post_surgical", etc.
  start_date date not null,
  end_date date,
  supervisor_name text,
  supervisor_title text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'disputed')),
  confirmed_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**2. `medjobs_universities`** — University as expansion unit

```sql
create table public.medjobs_universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null,
  state text not null,
  lat double precision,
  lng double precision,
  logo_url text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}',  -- contact info, partnership status, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**3. `medjobs_job_posts`** — Provider job listings (optional, Phase 2+)

Providers can post specific positions. Phase 1 is "browse the candidate pool" (like v1), but the table should exist for future use.

```sql
create table public.medjobs_job_posts (
  id uuid primary key default gen_random_uuid(),
  provider_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  care_types text[] not null default '{}',
  hours_per_week_min integer,
  hours_per_week_max integer,
  pay_rate_min numeric(6,2),
  pay_rate_max numeric(6,2),
  location_type text not null default 'on_site' check (location_type in ('on_site', 'hybrid', 'flexible')),
  status text not null default 'active' check (status in ('draft', 'active', 'paused', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### A4: Connections for applications

**Decision:** Reuse the existing `connections` table for student↔provider applications.

- Student applies to provider: `connection(from=student_profile, to=provider_profile, type='application')`
- Provider invites student: `connection(from=provider_profile, to=student_profile, type='invitation')`
- Messaging uses the same `metadata.thread` pattern

This is already how family→provider inquiries work. Zero new infrastructure.

### A5: Route structure

```
Public pages (no auth):
  /medjobs                          — Landing page (both audiences)
  /medjobs/candidates               — Browse candidates (preview, blurred contact info)
  /medjobs/candidates/[slug]        — Student profile page (public view)
  /medjobs/apply                    — Student application form (creates profile)

Authenticated portal (student):
  /portal/medjobs                   — Student dashboard (my profile, applications, hours)
  /portal/medjobs/profile           — Edit student profile
  /portal/medjobs/hours             — Experience log (Phase 2 UI)

Authenticated portal (provider):
  /provider/medjobs                 — Provider MedJobs dashboard
  /provider/medjobs/candidates      — Browse + filter candidates (full contact info)
  /provider/medjobs/candidates/[slug] — Full student profile

Admin:
  /admin/medjobs                    — MedJobs admin overview
  /admin/medjobs/students           — Student management
  /admin/medjobs/experience-logs    — Hour verification queue

API routes:
  /api/medjobs/students             — CRUD student profiles
  /api/medjobs/apply                — Student application (guest-friendly)
  /api/medjobs/candidates           — Provider candidate browsing + filters
  /api/medjobs/experience-logs      — CRUD experience logs
  /api/medjobs/universities         — University lookup
```

### A6: RLS policies for student profiles

```
- Student profiles are PUBLIC read (like org/caregiver) — no visibility restriction
- Contact info (phone, email, resume_url) gated by application logic, not RLS
  - API returns full data to authenticated providers with active MedJobs subscription
  - API returns redacted data to everyone else
- Students can only update their own profile
- Experience logs visible to student (own) and provider (their confirmations)
```

### A7: Email sequences (Resend + Loops)

**Resend (transactional, event-driven):**
1. `studentWelcomeEmail` — After profile creation, confirm receipt, next steps
2. `studentProfileIncompleteEmail` — Nudge to complete profile (cron, 48h after signup if < 70% complete)
3. `applicationReceivedEmail` — To provider when student applies
4. `applicationSentEmail` — To student confirming application sent
5. `applicationResponseEmail` — To student when provider accepts/declines
6. `experienceLogRequestEmail` — To provider asking to confirm student hours
7. `experienceLogConfirmedEmail` — To student when hours confirmed
8. `newCandidateAlertEmail` — To provider when new matching candidate signs up

**Loops (marketing, audience-based):**
- `medjobs_student_signup` event → student nurture sequence
- `medjobs_provider_activated` event → provider onboarding sequence

**Cron (Vercel):**
- Weekly candidate digest → providers with active MedJobs subscription get top new candidates

### A8: Multi-location / franchise support

**Decision:** Use existing `source_provider_id` or a new `parent_profile_id` field to link franchise locations. A franchise HQ profile can have child location profiles. MedJobs subscription at HQ level covers all locations.

Deferred to Phase 3 — not needed for MVP. Data model just needs to not prevent it.

---

## Tasks

### Phase 1: Data Foundation (Migration + Types)
*Goal: Schema exists, types defined, zero UI yet*

- [ ] 1. **Create migration `019_medjobs_foundation.sql`**
      - Add `student` to `profile_type` enum
      - Create `medjobs_experience_logs` table with indexes + RLS
      - Create `medjobs_universities` table with indexes + RLS
      - Create `medjobs_job_posts` table with indexes + RLS (empty for now)
      - Add RLS policy for student profile visibility
      - Files: `supabase/migrations/019_medjobs_foundation.sql`
      - Verify: Migration runs clean in Supabase SQL editor, no errors

- [ ] 2. **Update TypeScript types**
      - Add `"student"` to `ProfileType` union
      - Add `StudentMetadata` interface
      - Add `StudentProgramTrack` type
      - Add `ExperienceLog`, `University`, `JobPost` interfaces
      - Update `BusinessProfile.metadata` union to include `StudentMetadata`
      - Files: `lib/types.ts`
      - Verify: `npm run build` passes, no type errors

- [ ] 3. **Seed initial university data**
      - Create seed script with ~50 Texas universities (launch market)
      - Include lat/lng for proximity matching
      - Files: `scripts/seed-universities.sql`
      - Verify: Universities queryable in Supabase

### Phase 2: Student Side — Application + Profile
*Goal: Students can discover MedJobs, apply, and create a profile*

- [ ] 4. **MedJobs landing page (`/medjobs`)**
      - Hero: "Gain Verified Clinical Experience" value prop
      - Two CTAs: "Apply as Student" + "Find Talent" (provider)
      - Social proof: "800+ students have applied"
      - How it works section (3 steps)
      - Files: `app/medjobs/page.tsx`, `components/medjobs/MedJobsHero.tsx`
      - Depends on: none
      - Verify: Page renders, responsive, links work

- [ ] 5. **Student application flow (`/medjobs/apply`)**
      - Multi-step form: personal info → education → experience → availability → resume upload
      - Creates `student` profile in `business_profiles`
      - Guest-friendly (fire-first like connections): collect info, then prompt auth
      - Resume upload to Supabase Storage bucket `resumes`
      - Video intro upload (optional)
      - Files: `app/medjobs/apply/page.tsx`, `components/medjobs/StudentApplicationForm.tsx`
      - API: `app/api/medjobs/apply/route.ts`
      - Depends on: 1, 2
      - Verify: Submit form → student profile created in DB with correct metadata

- [ ] 6. **Student onboarding integration**
      - Add "student" intent to PostAuthOnboarding
      - After auth, if profile exists, route to student dashboard
      - Update `ensure-account` to handle student profiles
      - Files: `components/auth/PostAuthOnboarding.tsx`, `app/api/auth/ensure-account/route.ts`
      - Depends on: 2, 5
      - Verify: New user selecting "student" → application flow → profile created

- [ ] 7. **Student public profile page (`/medjobs/candidates/[slug]`)**
      - Public view: name, university, major, experience, certifications
      - Contact info blurred/gated for non-subscribed providers
      - "Interested? Subscribe to contact" CTA
      - Files: `app/medjobs/candidates/[slug]/page.tsx`, `components/medjobs/StudentProfileCard.tsx`
      - Depends on: 2
      - Verify: Profile page renders from DB data

- [ ] 8. **Student dashboard (`/portal/medjobs`)**
      - Profile completeness indicator
      - Application status list
      - Quick edit profile link
      - Hours summary (data ready, minimal UI)
      - Files: `app/portal/medjobs/page.tsx`, `components/medjobs/StudentDashboard.tsx`
      - Depends on: 5, 6
      - Verify: Authenticated student sees their dashboard

### Phase 3: Provider Side — Candidate Browsing
*Goal: Providers can browse, filter, and contact student candidates*

- [ ] 9. **Candidate browsing API (`/api/medjobs/candidates`)**
      - Query student profiles with filters: university, state/city, care_experience_types, availability, program_track
      - Proximity search using lat/lng
      - Pagination (Supabase `.range()`)
      - Returns redacted vs full data based on provider subscription
      - Files: `app/api/medjobs/candidates/route.ts`
      - Depends on: 1, 2
      - Verify: API returns filtered student profiles

- [ ] 10. **Candidate browse page (`/provider/medjobs/candidates`)**
       - Grid of student profile cards (like provider directory)
       - Filter sidebar: university, location, availability, program track, certifications
       - Sort: newest, closest, most experienced
       - Contact info visible to subscribed providers
       - Files: `app/provider/medjobs/candidates/page.tsx`, `components/medjobs/CandidateGrid.tsx`, `components/medjobs/CandidateFilters.tsx`, `components/medjobs/CandidateCard.tsx`
       - Depends on: 7, 9
       - Verify: Provider sees filterable candidate grid

- [ ] 11. **Provider MedJobs dashboard (`/provider/medjobs`)**
       - Overview: new candidates this week, active applications, subscription status
       - Quick links to candidate browsing, applications inbox
       - "MedJobs" tab in provider portal navigation
       - Files: `app/provider/medjobs/page.tsx`, `components/medjobs/ProviderMedJobsDashboard.tsx`
       - Depends on: 10
       - Verify: Provider sees MedJobs dashboard

- [ ] 12. **Application flow (student → provider)**
       - Student can apply to a provider (creates connection type='application')
       - Provider gets email + Slack + SMS notification
       - Provider can accept/decline from their inbox
       - Reuse existing connection/messaging infrastructure
       - Files: `app/api/medjobs/apply-to-provider/route.ts`, update `lib/email-templates.tsx`
       - Depends on: 5, 9
       - Verify: Student applies → provider gets notification → can respond

### Phase 4: Notifications + Automated Emails
*Goal: Self-serve engagement loop — no manual operator needed*

- [ ] 13. **MedJobs email templates**
       - `studentWelcomeEmail` — profile created confirmation
       - `applicationReceivedEmail` — to provider
       - `applicationSentEmail` — to student
       - `applicationResponseEmail` — accept/decline
       - `newCandidateAlertEmail` — to provider (matching candidates)
       - `weeklyDigestEmail` — top new candidates for providers
       - Files: `lib/email-templates.tsx`
       - Depends on: none (templates only)
       - Verify: Templates render correctly (can test with dev preview)

- [ ] 14. **Slack + SMS notifications for MedJobs events**
       - `slackNewApplication()` — student applied to provider
       - `slackNewStudent()` — new student profile created
       - SMS to provider on new application
       - Files: `lib/slack.ts`, `lib/twilio.ts`
       - Depends on: none (helpers only)
       - Verify: Slack messages format correctly

- [ ] 15. **Loops events for MedJobs**
       - `medjobs_student_signup` event
       - `medjobs_provider_activated` event
       - Files: `lib/loops.ts`
       - Depends on: none
       - Verify: Events send to correct Loops audience

- [ ] 16. **Weekly candidate digest cron**
       - New cron: `/api/cron/medjobs-digest`
       - Runs weekly (Monday 8 AM CT)
       - Finds providers with MedJobs interest, sends top new candidates
       - Files: `app/api/cron/medjobs-digest/route.ts`, `vercel.json` (add cron schedule)
       - Depends on: 9, 13
       - Verify: Cron sends digest email with candidate data

- [ ] 17. **Profile completion nudge cron**
       - Extend existing cron or new: `/api/cron/medjobs-nudge`
       - Students with < 70% profile completeness after 48h get a nudge email
       - Files: `app/api/cron/medjobs-nudge/route.ts`
       - Depends on: 5, 13
       - Verify: Incomplete profiles trigger nudge

### Phase 5: Public Browse + SEO
*Goal: Public candidate discovery page for organic traffic*

- [ ] 18. **Public candidate browse (`/medjobs/candidates`)**
       - Public-facing candidate grid (no auth required)
       - Contact info gated — "Sign up as a provider to connect"
       - SEO: meta tags, structured data (JobPosting or similar)
       - Files: `app/medjobs/candidates/page.tsx`
       - Depends on: 7, 9
       - Verify: Page renders, indexed by Google

- [ ] 19. **MedJobs navigation integration**
       - Add "MedJobs" to main site navigation (header/footer)
       - Add to portal sidebar for students
       - Add to provider portal sidebar
       - Sitemap entries for `/medjobs`, `/medjobs/candidates`
       - Files: `components/layout/Header.tsx`, `components/layout/Footer.tsx`, portal layouts
       - Depends on: 4, 18
       - Verify: Navigation links work, sitemap includes new pages

- [ ] 20. **Admin MedJobs panel (`/admin/medjobs`)**
       - Student list with search/filter
       - Application pipeline view
       - Experience log verification queue
       - Files: `app/admin/medjobs/page.tsx`, `app/admin/medjobs/students/page.tsx`, `app/admin/medjobs/experience-logs/page.tsx`
       - Depends on: 1, 2
       - Verify: Admin can view and manage MedJobs data

### Phase 6: Credential Engine UI (Future)
*Goal: Students can log hours and get verified credentials*

- [ ] 21. **Experience log submission UI**
       - Student submits hours worked at a provider
       - Provider gets email to confirm/dispute
       - Confirmed hours update student's `total_verified_hours`
       - Files: `app/portal/medjobs/hours/page.tsx`, `app/api/medjobs/experience-logs/route.ts`
       - Depends on: 1, 8

- [ ] 22. **Experience transcript page**
       - Public shareable page: `/medjobs/transcript/[slug]`
       - Shows verified hours by provider, care type breakdown
       - Printable / PDF export
       - "Verified through Olera MedJobs" badge

- [ ] 23. **Provider hour confirmation flow**
       - Email link → one-click confirm/dispute
       - Bulk confirmation for providers with multiple students

### Phase 7: Billing (Future)
*Goal: $50/month subscription for provider access*

- [ ] 24. **MedJobs subscription tier**
       - Extend `memberships` or create `medjobs_subscriptions` table
       - Stripe Checkout integration
       - Gate candidate contact info behind active subscription
       - Free tier: browse candidates (blurred), see count
       - Paid tier: full profiles, contact info, weekly digest

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Enum migration breaks existing profiles | `ALTER TYPE ADD VALUE` is additive-only, never modifies existing rows. Well-tested PostgreSQL behavior. |
| RLS policy changes affect family profile visibility | Student RLS policies are new `CREATE POLICY` statements, not modifications to existing ones. Test in staging first. |
| Resume upload storage costs | Use Supabase Storage with 10MB file size limit. Monitor usage. |
| Video intro hosting | Store in Supabase Storage initially. Move to dedicated video service if volume warrants. |
| Provider portal complexity | MedJobs is a new tab/section, not modifications to existing provider views. Isolated by route. |
| Performance: large candidate queries | Indexes on university, state, care_experience_types. Pagination via `.range()`. Same pattern as provider directory (37K+ records). |
| Franchise/multi-location | Deferred to Phase 3+. Current data model doesn't prevent it — just needs a `parent_profile_id` column later. |

## Notes

- **The v1 Softr MVP had 800+ students** — supply exists. The constraint is operational burden, which this architecture solves with self-serve + automated emails.
- **$50/month pricing** means the entire experience must be self-serve. No manual matching, no email coordination. The system replaces Diana.
- **Credential engine is the moat.** The job board gets students in the door; verified clinical hours keep them and create the university growth flywheel.
- **University is the expansion unit.** Seed Texas universities first, then expand by adding rows to `medjobs_universities` — no code changes.
- **Multi-location/franchise support** is architecturally possible (profiles already have `source_provider_id` for linking) but UI is deferred.
- **Video intros** were a v1 differentiator — keep this in the student profile. Simple upload to Supabase Storage.
