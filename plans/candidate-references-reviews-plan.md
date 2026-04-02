# Plan: Candidate References & Reviews (MVP)

Created: 2026-04-02
Status: Not Started

## Goal

Add two new sections to MedJobs candidate profile pages: **References** (requested by students, written by referees via unique link) and **Reviews** (left by unauthenticated clients/employers about students).

## Success Criteria

- [ ] Students can request references by entering a referee's email — referee gets a unique link to write a recommendation
- [ ] Referees can write a recommendation via the unique link (no account needed)
- [ ] Unauthenticated clients/employers can leave reviews on student profiles (go to under_review)
- [ ] Both sections display on the public candidate profile page
- [ ] Aggregate rating (from reviews) visible on candidate cards in browse list
- [ ] Reviews received shown inline on the student's existing portal page (read-only)
- [ ] Data stored in two new Supabase tables with proper RLS

---

## Data Model

### Table: `medjobs_student_references`

References are **requested by students** and **written by referees** via a unique token link (no account needed).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| student_profile_id | uuid FK → business_profiles | The student |
| referee_name | text | Filled by referee when they write the rec |
| referee_title | text | "Professor of Biology" |
| referee_organization | text | "UT Austin" |
| referee_email | text NOT NULL | Student provides this to send the request |
| relationship | text | professor, employer, supervisor, colleague, other |
| recommendation | text | The actual recommendation text (written by referee) |
| token | text UNIQUE NOT NULL | Secret token for the referee's unique write link |
| status | text | requested / completed |
| display_order | smallint DEFAULT 0 | Student controls ordering of completed refs |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Flow:**
1. Student enters referee email + relationship in portal → row created with `status = 'requested'`, token generated
2. Student shares link with referee: `/medjobs/reference/{token}`
3. Referee fills in name, title, org, recommendation text → `status = 'completed'`
4. Completed references display on candidate profile

### Table: `medjobs_student_reviews`

Reviews are left by **unauthenticated users** (clients/employers). No account required for MVP.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| student_profile_id | uuid FK → business_profiles | The student being reviewed |
| reviewer_name | text NOT NULL | Display name |
| reviewer_email | text | For dedup / follow-up (not displayed) |
| rating | smallint NOT NULL | 1-5 stars |
| comment | text NOT NULL | Min 50 chars |
| relationship | text NOT NULL | client, employer, supervisor, coworker |
| status | text | published / under_review / removed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**No auth required for MVP.** Reviews go to `status = 'under_review'` by default. Admin approves via direct DB update for now (no admin UI in MVP).

### RLS Strategy

**Key decision: All writes go through service-role API routes, NOT through RLS.**

Both tables involve unauthenticated users writing data (referees, reviewers). If we added permissive INSERT policies with the anon key, anyone could bypass our API validation and insert directly via the Supabase API. Instead:

- **SELECT only** via RLS: `status = 'completed'` for references, `status = 'published'` for reviews
- **All INSERT/UPDATE** via service-role key in API routes (like existing `upload-document` pattern)
- Student reads of own references: service-role query in API route filtered by profile ownership

### StudentMetadata additions

```typescript
// Added to StudentMetadata in lib/types.ts
average_rating?: number;      // denormalized, updated when admin approves/removes reviews
review_count?: number;        // denormalized, updated when admin approves/removes reviews
```

**Denormalized ratings** (not computed on read) to avoid N+1 queries on the browse page. Updated by the review submission API and when review status changes. Follows the existing `profile_completeness` denormalization pattern.

---

## Architecture Notes

### Server vs Client Component Patterns

The codebase has two different candidate detail pages with different rendering strategies:

1. **Public page** (`app/medjobs/candidates/[slug]/page.tsx`) — **Server component**. Fetches data server-side. Client interactivity via component islands (see `ContactSection.tsx` pattern). References and reviews display can be server-rendered. Review form needs a client component island (`ReviewSection.tsx`).

2. **Provider page** (`app/provider/medjobs/candidates/[slug]/page.tsx`) — **Client component**. Fetches data in `useEffect`. References and reviews need separate client-side fetches, not "same display as public page." Will need `useEffect` calls to `/api/medjobs/references?studentProfileId=X` and `/api/medjobs/student-reviews?studentProfileId=X`.

### Portal Page Decomposition

The portal page is already 270 lines. Adding references management + reviews display inline would bloat it. Extract:
- `<ReferencesSection profileId={...} />` — client component with form + list
- `<ReviewsReceivedSection profileId={...} />` — client component, read-only

Imported into the portal page below the existing "all done" state.

---

## Tasks

### Phase 1: Database & Types

- [ ] 1. Create migration `030_medjobs_references_reviews.sql`
      - Files: `supabase/migrations/030_medjobs_references_reviews.sql`
      - Both tables, indexes, SELECT-only RLS policies, updated_at triggers
      - NO insert/update RLS policies — all writes via service-role API routes
      - Verify: SQL is valid, matches patterns in 019

- [ ] 2. Update TypeScript types
      - Files: `lib/types.ts`
      - Add `average_rating`, `review_count` to `StudentMetadata`
      - Verify: `npm run build` passes

### Phase 2: API Routes

- [ ] 3. Reference request API (student-facing, authenticated)
      - Files: `app/api/medjobs/references/route.ts`
      - GET: fetch references for a student profile (public: completed only via service-role)
      - POST: student creates a reference request (referee email, relationship) → generates token via `crypto.randomUUID()`
      - DELETE: student can cancel/remove a reference request
      - Auth: student owns the profile (for POST/DELETE), verified via accounts → business_profiles chain
      - Uses service-role client for all DB operations
      - Verify: Creates row with token, returns reference list

- [ ] 4. Reference submission API (referee-facing, unauthenticated)
      - Files: `app/api/medjobs/references/submit/route.ts`
      - GET: validate token, return student name + relationship context (only if `status = 'requested'`)
      - POST: referee submits name, title, org, recommendation text via token
      - **Server-side enforcement:** reject if `status != 'requested'` (not just UI-side)
      - Uses service-role client (unauthenticated caller)
      - Verify: Token lookup works, submission updates row to completed, resubmission rejected

- [ ] 5. Student reviews API (unauthenticated)
      - Files: `app/api/medjobs/student-reviews/route.ts`
      - GET: fetch published reviews for a student (public, service-role with status filter)
      - POST: anyone submits a review (name, email, rating, comment, relationship) → `status = 'under_review'`
      - Basic spam prevention: email dedup per student (one review per email per student)
      - Uses service-role client for writes
      - Verify: Can create and fetch reviews

### Phase 3: Portal UI (inline on existing page, extracted components)

- [ ] 6. ReferencesSection component for student portal
      - Files: `components/medjobs/ReferencesSection.tsx` (new client component)
      - Form: referee email + relationship dropdown → POST to API → shows shareable link
      - List of requested/completed references with status indicators
      - Student can delete pending requests
      - Copy-link button for sharing with referee
      - Imported into `app/portal/medjobs/page.tsx` below the "all done" state
      - Verify: Student can request, see status, copy link, and delete references

- [ ] 7. ReviewsReceivedSection component for student portal (read-only)
      - Files: `components/medjobs/ReviewsReceivedSection.tsx` (new client component)
      - Read-only list of published reviews with star ratings
      - Empty state: "No reviews yet"
      - Imported into `app/portal/medjobs/page.tsx` below references section
      - Verify: Student sees their published reviews

### Phase 4: Referee Submission Page

- [ ] 8. Public referee form page
      - Files: `app/medjobs/reference/[token]/page.tsx`
      - Server component that validates token via API on load
      - Shows student first name and relationship context
      - Client component island for the form: name, title, organization, recommendation text
      - Thank-you state after submission
      - Already-completed state if token was already used
      - Invalid-token state if token doesn't exist
      - Verify: Referee can write and submit a recommendation via the link

### Phase 5: Public Candidate Page (display)

- [ ] 9. References display on candidate profile (server-rendered)
      - Files: `app/medjobs/candidates/[slug]/page.tsx`
      - Fetch completed references server-side in the same page function (service-role query by student profile ID)
      - New card: referee name, title, org, relationship, recommendation text
      - Section hidden if no completed references (no empty state shown)
      - Verify: References appear on public profile

- [ ] 10. ReviewSection client component for candidate profile
      - Files: `app/medjobs/candidates/[slug]/ReviewSection.tsx` (new client component, like ContactSection pattern)
      - Display: star rating summary + individual review cards (server-passed as props or client-fetched)
      - Form: name, email, rating stars, comment (min 50 chars), relationship dropdown
      - Success state after submission ("Your review has been submitted and is pending approval")
      - Section hidden if no published reviews AND user hasn't opened the form
      - Verify: Reviews display, form submits, success message shown

### Phase 6: Browse List + Provider View

- [ ] 11. Show aggregate rating on candidate cards
      - Files: `components/medjobs/CandidateRow.tsx`
      - Read `average_rating` and `review_count` from `metadata` (already in the data — no extra query)
      - Display stars + count like "4.8 (3)" if reviews exist
      - Verify: Rating appears on browse page cards

- [ ] 12. References and reviews on provider candidate page (client-side fetching)
      - Files: `app/provider/medjobs/candidates/[slug]/page.tsx`
      - Add `useEffect` fetches to `/api/medjobs/references?studentProfileId=X` and `/api/medjobs/student-reviews?studentProfileId=X`
      - Display references and reviews sections (reuse display components from public page or extract shared components)
      - Verify: Provider sees both sections

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Token in URL exposed via browser history/referrer | Acceptable for MVP. Token is single-use (status check server-side). |
| Spam reviews without auth | Reviews default to `under_review`. Admin approves via DB. Email dedup in API. |
| Anon key bypass for writes | No INSERT/UPDATE RLS policies. All writes via service-role in API routes. |
| Portal page bloat | Extract `ReferencesSection` and `ReviewsReceivedSection` as separate client components. |
| N+1 queries on browse page | Denormalized `average_rating`/`review_count` in metadata, updated on review status change. |
| Provider page needs different fetch pattern | Explicit client-side `useEffect` fetches, not copy-paste of server component code. |

## Decisions Made

1. **References auto-publish** — no admin approval. Students request, referees write, completed references are public
2. **Reviews require admin approval** — `under_review` → `published` via direct DB update (no admin UI in MVP)
3. **Reviews are unauthenticated** — no account needed, just name + email
4. **Reference flow is token-based** — student enters email, gets a shareable link for the referee
5. **Portal integration is inline** — extracted components added to existing `/portal/medjobs` page, no new tabs
6. **Email sending deferred** — MVP generates the link, student shares it manually
7. **All writes via service-role** — no permissive RLS INSERT/UPDATE policies
8. **Denormalized ratings** — `average_rating`/`review_count` in metadata, not computed on read
