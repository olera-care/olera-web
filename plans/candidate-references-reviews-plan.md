# Plan: Candidate References & Reviews (MVP)

Created: 2026-04-02
Status: Not Started

## Goal

Add two new sections to MedJobs candidate profile pages: **References** (requested by students, written by referees via unique link) and **Reviews** (left by unauthenticated clients/employers about students).

## Success Criteria

- [ ] Students can request references by entering a referee's email — referee gets a unique link to write a recommendation
- [ ] Referees can write a recommendation via the unique link (no account needed)
- [ ] Unauthenticated clients/employers can leave reviews on student profiles via a token-based link or public form
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
2. Email sent to referee with link: `/medjobs/reference/{token}`
3. Referee fills in name, title, org, recommendation text → `status = 'completed'`
4. Completed references display on candidate profile

**RLS:** Students read/insert own. Public can read `status = 'completed'`. Unauthenticated update via API (token-validated, not RLS).

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

**No auth required for MVP.** Reviews go to `status = 'under_review'` by default and require admin approval before showing publicly. This prevents spam without requiring accounts.

**RLS:** Public can read `status = 'published'`. Insert is open (via API with basic validation). Admin updates status.

### StudentMetadata additions

```typescript
// Added to StudentMetadata in lib/types.ts
average_rating?: number;      // denormalized for card display  
review_count?: number;        // denormalized for card display
```

---

## Tasks

### Phase 1: Database & Types

- [ ] 1. Create migration `030_medjobs_references_reviews.sql`
      - Files: `supabase/migrations/030_medjobs_references_reviews.sql`
      - Both tables, indexes, RLS policies, triggers
      - Verify: SQL is valid, matches patterns in 019

- [ ] 2. Update TypeScript types
      - Files: `lib/types.ts`
      - Add `average_rating`, `review_count` to `StudentMetadata`
      - Verify: `npm run build` passes

### Phase 2: API Routes

- [ ] 3. Reference request API (student-facing)
      - Files: `app/api/medjobs/references/route.ts`
      - POST: student creates a reference request (referee email, relationship) → generates token
      - GET: fetch references for a student profile (public: completed only)
      - DELETE: student can cancel/remove a reference request
      - Auth: student owns the profile (for POST/DELETE)
      - Verify: Creates row with token, returns reference list

- [ ] 4. Reference submission API (referee-facing, unauthenticated)
      - Files: `app/api/medjobs/references/submit/route.ts`
      - GET: validate token, return student name + relationship context
      - POST: referee submits name, title, org, recommendation text via token
      - No auth required — token is the auth
      - Verify: Token lookup works, submission updates row to completed

- [ ] 5. Student reviews API (unauthenticated)
      - Files: `app/api/medjobs/student-reviews/route.ts`
      - GET: fetch published reviews for a student (public)
      - POST: anyone submits a review (name, email, rating, comment, relationship) → status = under_review
      - Basic spam prevention: rate limit by IP, email dedup per student
      - Verify: Can create and fetch reviews

### Phase 3: Portal UI (inline on existing page)

- [ ] 6. Reference request section on student portal page
      - Files: `app/portal/medjobs/page.tsx`
      - New section below existing steps: "References"
      - Simple form: referee email + relationship dropdown → sends request
      - List of requested/completed references with status indicators
      - Student can delete pending requests
      - Verify: Student can request, see status, and delete references

- [ ] 7. Reviews received section on student portal page (read-only)
      - Files: `app/portal/medjobs/page.tsx`
      - New section below references: "Reviews"
      - Read-only list of published reviews with star ratings
      - Empty state: "No reviews yet"
      - Verify: Student sees their reviews

### Phase 4: Referee Submission Page

- [ ] 8. Public referee form page
      - Files: `app/medjobs/reference/[token]/page.tsx`
      - Validates token → shows student name and relationship context
      - Form: name, title, organization, recommendation text
      - Thank-you state after submission
      - Already-submitted state if token is used
      - Verify: Referee can write and submit a recommendation via the link

### Phase 5: Public Candidate Page (display)

- [ ] 9. References section on candidate profile
      - Files: `app/medjobs/candidates/[slug]/page.tsx`
      - New card: completed references showing referee name, title, org, relationship, recommendation text
      - Empty state hidden (don't show section if no completed references)
      - Verify: References appear on public profile

- [ ] 10. Reviews section on candidate profile
      - Files: `app/medjobs/candidates/[slug]/page.tsx`
      - Star rating summary + individual review cards
      - Simple review form at bottom (name, email, rating, comment, relationship)
      - Empty state hidden (don't show section if no published reviews)
      - Verify: Reviews display, form submits

### Phase 6: Browse List + Provider View

- [ ] 11. Show aggregate rating on candidate cards
      - Files: `components/medjobs/CandidateRow.tsx`
      - Display average star rating + review count if any reviews exist
      - Verify: Rating appears on browse page cards

- [ ] 12. Mirror references/reviews on provider-facing candidate page
      - Files: `app/provider/medjobs/candidates/[slug]/page.tsx`
      - Same display as public page
      - Verify: Provider sees both sections

---

## Risks

- **Spam reviews:** Mitigated by defaulting to `under_review` status — admin must approve before public display
- **Token security:** Reference tokens should be cryptographically random (crypto.randomUUID). Tokens are single-use (status changes to completed)
- **Email delivery:** MVP can skip actual email sending — just generate the link and show it to the student to share manually. Real email integration can come later
- **Denormalized counts:** Compute `average_rating` / `review_count` on read for MVP (join query). Trigger-based denormalization later if needed

## Decisions Made

1. **References auto-publish** — no admin approval. Students control what they request, referees write directly
2. **Reviews require admin approval** — `under_review` → `published` since reviewers are unauthenticated
3. **Reviews are unauthenticated** for MVP — no account needed, just name + email
4. **Reference flow is token-based** — student enters email, gets a shareable link for the referee
5. **Portal integration is inline** — references and reviews sections added to existing `/portal/medjobs` page, no new tabs or pages
6. **Email sending deferred** — MVP generates the link, student shares it manually. Real email can be Phase 2

## Notes

- Reference token link pattern: `/medjobs/reference/{token}` — clean public URL
- The review form on the candidate page is unauthenticated, so it's a simple HTML form with server action or client POST
- For the portal page, add sections after the "all done" state — references and reviews only make sense once the profile is live
