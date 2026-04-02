# Plan: Candidate References & Reviews

Created: 2026-04-02
Status: Not Started

## Goal

Add two new sections to MedJobs candidate profile pages: **References** (uploaded by students) and **Reviews** (left by clients/employers about students).

## Success Criteria

- [ ] Students can upload references (name, relationship, contact info, optional document) via their portal
- [ ] Reviews can be left on student profiles by authenticated clients/employers
- [ ] Both sections display on the public candidate profile page
- [ ] Aggregate rating (from reviews) visible on candidate cards in browse list
- [ ] Data stored in two new Supabase tables with proper RLS

---

## Data Model

### Table: `medjobs_student_references`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| student_profile_id | uuid FK → business_profiles | The student |
| referee_name | text | "Dr. Jane Smith" |
| referee_title | text | "Professor of Biology" |
| referee_organization | text | "UT Austin" |
| referee_email | text | Optional contact |
| referee_phone | text | Optional contact |
| relationship | text | CHECK: professor, employer, supervisor, colleague, other |
| document_url | text | Optional uploaded letter (PDF/image in private storage) |
| display_order | smallint | Student controls ordering |
| status | text | pending / published — admin can moderate |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:** Students CRUD own references. Public can read `status = 'published'`.

### Table: `medjobs_student_reviews`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| student_profile_id | uuid FK → business_profiles | The student being reviewed |
| reviewer_profile_id | uuid FK → business_profiles | The reviewer (client/employer) |
| reviewer_name | text | Display name |
| rating | smallint | 1-5 stars |
| title | text | Optional headline |
| comment | text | Min 50 chars (matches existing reviews pattern) |
| relationship | text | CHECK: client, employer, supervisor, coworker |
| status | text | published / under_review / removed |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**RLS:** One review per reviewer per student. Public can read `status = 'published'`. Authenticated users can insert. Reviewer can update own.

### StudentMetadata additions

```typescript
// Added to StudentMetadata in lib/types.ts
references_count?: number;    // denormalized for card display
average_rating?: number;      // denormalized for card display  
review_count?: number;        // denormalized for card display
```

---

## Tasks

### Phase 1: Database & Types (foundation)

- [ ] 1. Create migration `030_medjobs_references_reviews.sql`
      - Files: `supabase/migrations/030_medjobs_references_reviews.sql`
      - Both tables, indexes, RLS policies, triggers
      - Verify: Migration SQL is syntactically valid, matches patterns in 019

- [ ] 2. Update TypeScript types
      - Files: `lib/types.ts`
      - Add `references_count`, `average_rating`, `review_count` to `StudentMetadata`
      - Verify: `npm run build` passes (type-check)

### Phase 2: API Routes

- [ ] 3. Student references CRUD API
      - Files: `app/api/medjobs/references/route.ts`
      - GET (by student_profile_id), POST (create), PUT (reorder/edit), DELETE
      - Auth: student owns the profile
      - Verify: Manual test with curl / browser

- [ ] 4. Reference document upload API
      - Files: `app/api/medjobs/upload-reference/route.ts`
      - Follows existing `upload-document` pattern (private bucket, 10MB, PDF/image)
      - Storage path: `{profileId}/references/{referenceId}.{ext}`
      - Verify: Upload returns URL, file accessible via signed URL

- [ ] 5. Student reviews API
      - Files: `app/api/medjobs/student-reviews/route.ts`
      - GET (by student_profile_id, public), POST (authenticated, one per reviewer per student)
      - Follows existing `reviews` table pattern from migration 009
      - Verify: Can create and fetch reviews

### Phase 3: Portal UI (student uploads references)

- [ ] 6. References management section in student portal
      - Files: `app/portal/medjobs/page.tsx` (or new `app/portal/medjobs/references/page.tsx`)
      - Add/edit/delete/reorder references
      - Upload reference letter documents
      - Inline form (name, title, org, relationship, optional doc)
      - Verify: Student can add, see, reorder, and remove references

### Phase 4: Public Candidate Page (display)

- [ ] 7. References section on candidate profile
      - Files: `app/medjobs/candidates/[slug]/page.tsx`
      - New card below existing grid: shows referee name, title, org, relationship
      - Document link hidden on public page (referee contact info also hidden — just name/title/org)
      - Verify: References appear on public profile

- [ ] 8. Reviews section on candidate profile
      - Files: `app/medjobs/candidates/[slug]/page.tsx`
      - Star rating summary + individual review cards
      - Follows visual pattern of existing provider reviews
      - Verify: Reviews appear with ratings on public profile

- [ ] 9. Review submission form (for clients/employers)
      - Files: `app/medjobs/candidates/[slug]/ReviewForm.tsx` (new client component)
      - Auth-gated: must be logged in, cannot review self
      - Rating stars + title + comment (min 50 chars) + relationship dropdown
      - Verify: Authenticated user can submit a review

### Phase 5: Browse List Integration

- [ ] 10. Show aggregate rating on candidate cards
      - Files: `components/medjobs/CandidateRow.tsx`
      - Display average star rating + review count badge (if any reviews exist)
      - Verify: Rating appears on browse page cards for reviewed candidates

### Phase 6: Provider View

- [ ] 11. Mirror references/reviews on provider-facing candidate page
      - Files: `app/provider/medjobs/candidates/[slug]/page.tsx`
      - Same display as public page, potentially with referee contact info visible to providers
      - Verify: Provider sees references and reviews

---

## Risks

- **Schema coupling:** References and reviews are separate tables from the existing provider `reviews` table — no migration conflicts
- **RLS complexity:** Need careful policies so students can't write their own reviews. Reviewer must have a different profile than the student
- **Denormalized counts:** `average_rating` / `review_count` on metadata need to be updated when reviews change. Options: (a) Supabase trigger function, (b) compute on read. Recommend compute on read for now (small scale), add trigger later
- **Storage bucket:** Reference documents go in existing `student-documents` bucket (private). No new bucket needed
- **Empty states:** Both sections need graceful empty states (no references yet, no reviews yet)

## Open Questions

1. **Should references auto-publish or require admin approval?** Recommend auto-publish (status = 'published' on create) since students control their own references
2. **Should reviews require the reviewer to have an existing connection/experience log with the student?** This would prevent fake reviews but adds friction. Recommend starting without this gate
3. **Rating display on cards:** Stars or numeric? Recommend stars with count like "4.8 (3)"
4. **Should the portal show a "Reviews received" section?** Students would want to see their reviews — add read-only view in portal

## Notes

- Existing provider `reviews` table (migration 009) is a good pattern to follow for student reviews
- Existing `upload-document` API (private bucket) is the pattern for reference letter uploads
- The candidate page is a server component — reviews section with the submit form will need a client component island
- Consider adding reviews to the candidate API response (`/api/medjobs/candidates`) for browse page rating display
