# Plan: Migrate v1.0 Reviews + Admin Review Visibility

Created: 2026-03-10
Status: Complete

## Goal

Import 34 legitimate v1.0 reviews into the v2.0 Supabase `reviews` table and build an admin reviews page for moderation visibility across all providers.

## Success Criteria

- [ ] 34 v1.0 reviews with real user content appear on their respective provider pages
- [ ] Migrated reviews are distinguishable from organic v2.0 reviews (via `migration_source` column)
- [ ] Admin can view all reviews at `/admin/reviews` with filter tabs (All, Published, Under Review, Rejected)
- [ ] Admin can change review status (approve/reject/remove) from the admin page
- [ ] Existing review flows (submit, edit, provider reply) remain unaffected

## Data Summary

- **CSV**: `docs/review_2026-03-10_12h38m42.csv` — 66 total rows
- **To migrate**: 34 reviews (Status=Submitted, have real Content)
- **To skip**: 32 reviews (Status=Draft, Content=" - " or blank)
- **5 providers have 2 reviews each** — no conflict (unique index uses account_id, which will be NULL)
- **15 reviews have "Additional details"** — preserve in comment (appended)
- **All 34 have Author names** — no blank anonymous names in the migratable set
- **Rating distribution**: 1-star (28), 2-star (3), 4-star (2), 5-star (33) — polarized

## Column Mapping

| v1.0 CSV Column | v2.0 reviews Column | Transform |
|---|---|---|
| (auto-generated) | id | gen_random_uuid() |
| Slug [Provider] | provider_id | Direct — matches business_profiles.slug |
| — | account_id | NULL (requires schema change — currently NOT NULL) |
| Author name | reviewer_name | As-is; if blank + Anonymous=true → "Anonymous" |
| Rating | rating | Cast to SMALLINT |
| — | title | NULL |
| Content | comment | Raw user text; append "Additional details" if present |
| — | relationship | 'Not specified' |
| — | status | 'published' |
| Created at | created_at | Parse "November 16, 2025 10:54" → TIMESTAMPTZ |
| Created at | updated_at | Same as created_at |
| — | provider_reply | NULL |
| — | replied_at | NULL |
| — | replied_by | NULL |
| — | migration_source | 'olera_v1' (new column) |

## Tasks

### Phase 1: Schema Changes (migration 016)

- [ ] 1. Create `supabase/migrations/016_reviews_migration_support.sql`
      - ALTER TABLE reviews: make `account_id` nullable (`DROP NOT NULL`)
      - ALTER TABLE reviews: make `relationship` nullable or set default
      - ADD COLUMN `migration_source` TEXT (nullable, for tracking import origin)
      - Update RLS: ensure migrated reviews (account_id=NULL) are still publicly readable
      - Files: `supabase/migrations/016_reviews_migration_support.sql`
      - Verify: Run migration against Supabase, confirm `account_id` accepts NULL

### Phase 2: Data Migration (migration 017)

- [ ] 2. Create `supabase/migrations/017_import_v1_reviews.sql`
      - INSERT 34 reviews with mapped columns
      - Use Content column for comment; append Additional details with separator when present
      - Parse v1.0 timestamps to TIMESTAMPTZ
      - Set migration_source = 'olera_v1'
      - Set relationship = 'Not specified'
      - Validate provider_id slugs exist in business_profiles before insert (skip orphans)
      - Files: `supabase/migrations/017_import_v1_reviews.sql`
      - Verify: Query `SELECT count(*) FROM reviews WHERE migration_source = 'olera_v1'` → 34

- [ ] 3. Create `scripts/generate-v1-review-migration.ts` (optional helper)
      - Node script that reads CSV, filters Content != " - ", outputs SQL INSERT statements
      - Handles CSV parsing edge cases (commas in content, multiline reviews)
      - This generates the SQL for migration 017 — not run in production
      - Files: `scripts/generate-v1-review-migration.ts`
      - Verify: Output SQL is valid, matches expected 34 rows

### Phase 3: Admin Reviews API

- [ ] 4. Create `app/api/admin/reviews/route.ts` (GET)
      - Auth check via `getAuthUser()` + `getAdminUser()`
      - Query params: `status` (all/published/under_review/rejected/removed), `search`, `limit`, `offset`
      - Join with business_profiles to get provider name
      - Service role client (bypass RLS)
      - Response: `{ reviews: [...], count: number }`
      - Files: `app/api/admin/reviews/route.ts`
      - Verify: `curl /api/admin/reviews` returns all reviews with provider names

- [ ] 5. Create `app/api/admin/reviews/[id]/route.ts` (PATCH)
      - Auth + admin check
      - Body: `{ action: "approve" | "reject" | "remove" }`
      - Map: approve → status="published", reject → "rejected", remove → "removed"
      - Log via `logAuditAction()`
      - Response: `{ success: true, review: {...} }`
      - Files: `app/api/admin/reviews/[id]/route.ts`
      - Verify: PATCH changes review status, audit log entry created

### Phase 4: Admin Reviews Page

- [ ] 6. Create `app/admin/reviews/page.tsx`
      - "use client" — follows existing admin page patterns
      - Filter tabs: All | Published | Under Review | Rejected
      - Table columns: Provider, Reviewer, Rating (stars), Comment (truncated), Status (Badge), Date, Source (v1/organic), Actions
      - Search box: filter by provider name or reviewer name
      - Actions: Approve/Reject buttons (context-dependent on current status)
      - Expand row to see full comment text
      - Loading/error/empty states matching other admin pages
      - Files: `app/admin/reviews/page.tsx`
      - Verify: Navigate to `/admin/reviews`, see all reviews, filter works, actions work

- [ ] 7. Add Reviews to AdminSidebar nav
      - Add nav item with icon + href="/admin/reviews"
      - Files: `components/admin/AdminSidebar.tsx`
      - Verify: "Reviews" appears in sidebar, links correctly

- [ ] 8. Add review count to admin overview dashboard
      - Fetch total + pending review counts
      - Add stat card on `/admin` overview page
      - Files: `app/admin/page.tsx`
      - Verify: Dashboard shows review stats

### Phase 5: Cleanup & Type Updates

- [ ] 9. Update Review type to reflect nullable fields
      - `account_id: string | null`
      - `relationship: string | null`
      - Add `migration_source?: string | null`
      - Files: `lib/types.ts`
      - Verify: No TypeScript errors across codebase

- [ ] 10. Verify existing flows unaffected
      - Public provider page still shows reviews correctly
      - Submit review flow still works (account_id still populated for organic reviews)
      - Provider dashboard reviews page still works
      - Provider reply flow still works
      - Files: (no changes — manual verification)
      - Verify: Test each flow on staging after deploy

## Risks

| Risk | Mitigation |
|---|---|
| Making account_id nullable could break existing queries | Audit all queries for `.eq('account_id', ...)` — they should still work since organic reviews have non-null account_id |
| Unique index on (provider_id, account_id) — NULL account_id allows duplicates per provider | This is actually desired: NULL != NULL in Postgres, so multiple migrated reviews per provider are allowed |
| Some v1.0 provider slugs may not exist in v2.0 business_profiles | Validate slugs before insert; skip orphans and log them |
| Multiline CSV content (e.g., Rocky Mountain review spans many lines) | Use proper CSV parser in generation script, not naive line splitting |
| Comment text may contain special SQL characters (quotes, backslashes) | Use dollar-quoted strings in SQL (`$$content$$`) or parameterized inserts |

## Notes

- The 50-char comment minimum was already dropped in migration 010 — no issue for short v1.0 reviews
- v1.0 "Generated text" column (AI-polished) is intentionally NOT used — only raw Content
- v1.0 "Additional details" field has valuable context for 15 reviews — appended to comment with a separator
- Existing review API (GET /api/reviews) uses anon client and filters `status = 'published'` — migrated reviews will appear automatically once inserted with status='published'
- No email notifications should fire for migrated reviews (they're inserted via SQL, not the API)
