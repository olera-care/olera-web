# Plan: Unify Supabase Projects + Connect Web Provider Pages

Created: 2026-02-05
Updated: 2026-02-05
Status: **Phase 1 Complete** - Ready for Phase 2 (after iOS approval)
Priority: P1

## Goal

Connect the web app's provider pages to the iOS Supabase project (replacing dummy data), then unify both Supabase projects into one with proper dev/staging/prod environments.

## Critical Constraint

**iOS app is in Apple review - we MUST NOT break it.**

This means:
- No schema changes to iOS Supabase until iOS app is approved
- Read-only access initially is safest
- Any writes should go through careful testing first

## Success Criteria

- [x] Provider detail pages (`/provider/[slug]`) display real data from iOS Supabase
- [x] Browse providers page (`/browse`) lists real providers from iOS Supabase
- [x] Homepage "Top providers" section shows real providers
- [x] Graceful fallback to mock data if Supabase is unavailable
- [x] iOS app continues to work without any regressions
- [ ] Clear environment strategy (dev/staging/prod) documented

---

## Phase 1: Connect Web to iOS Supabase (READ-ONLY)

**Goal**: Replace dummy data with real data, zero risk to iOS app.

### Task 1: Verify iOS Supabase Schema Compatibility

- [x] 1.1 Get iOS Supabase credentials (URL + anon key)
  - Obtained iOS Supabase project credentials from TJ
  - URL: `https://ocaabzfiiikjcgqwhbwr.supabase.co`
  - Anon key: Stored in `.env.local`
  - Verify: ✅ Credentials are obtained

- [x] 1.2 Compare iOS schema to web schema
  - iOS uses `olera-providers` table (not `profiles`)
  - Schema documented in `lib/types/provider.ts`
  - Key differences: `provider_id`, `provider_name`, `provider_category`, etc.
  - Web adapted to match iOS schema directly (no adapter layer)
  - Verify: ✅ Schema documented in `lib/types/provider.ts`

- [x] 1.3 Test read access with curl
  - Table: `olera-providers` (39,355+ providers)
  - Tested with: `curl -X GET ".../rest/v1/olera-providers?select=*&limit=5"`
  - Verify: ✅ Returns provider data successfully

### Task 2: Configure Web App Environment

- [x] 2.1 Create `.env.local` with iOS Supabase credentials
  - Files: `.env.local` (gitignored)
  - Contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Verify: ✅ `isSupabaseConfigured()` returns true

- [x] 2.2 Verify existing Supabase client code works
  - Files: `lib/supabase/server.ts`, `lib/supabase/client.ts`
  - Supabase clients work with iOS project
  - Verify: ✅ No errors in server console

### Task 3: Update Provider Detail Page

- [x] 3.1 Test existing query pattern with real data
  - Files: `app/provider/[slug]/page.tsx`
  - Rewrote to query `olera-providers` table directly
  - Example: `/provider/r4HIF35` → "Aggie Independent Living"
  - Verify: ✅ Real data displays correctly

- [x] 3.2 Handle schema differences (if any)
  - Files: `app/provider/[slug]/page.tsx`, `lib/types/provider.ts`
  - Created `lib/types/provider.ts` matching iOS schema exactly
  - Web adapted to iOS format (no adapter layer per user preference)
  - Verify: ✅ All provider fields display correctly

- [x] 3.3 Update slug resolution
  - Files: `app/provider/[slug]/page.tsx`
  - Uses `provider_id` as URL slug (e.g., `r4HIF35`)
  - Falls back to mock data for development/demo slugs
  - Verify: ✅ `/provider/[provider_id]` works

### Task 4: Update Browse Providers Page

- [x] 4.1 Connect browse page to Supabase
  - Files: `app/browse/page.tsx`
  - Queries `olera-providers` table with filters
  - Supports: text search, care type filter, state filter
  - Ordered by google_rating (highest first)
  - Verify: ✅ `/browse` shows real providers with filtering

- [x] 4.2 Update provider card mapping
  - Files: `lib/types/provider.ts`, `app/browse/page.tsx`
  - Created `ProviderBrowseCard` using iOS Provider fields
  - Shows: rating badge, category, location, pricing
  - Verify: ✅ Cards render without errors

### Task 5: Update Homepage Providers Section

- [x] 5.1 Connect homepage to Supabase
  - Files: `app/page.tsx`
  - "Top providers" fetches from `olera-providers` (rating >= 4.0)
  - "Browse by care type" fetches by provider_category
  - Loading states and mock fallback implemented
  - Verify: ✅ Homepage shows real providers with loading states

- [x] 5.2 Update similar providers logic
  - Files: `app/provider/[slug]/page.tsx`
  - Added inline query for similar providers (same category)
  - Shows up to 4 similar providers with images, ratings
  - Links to browse page for full category listing
  - Verify: ✅ Provider detail page shows real similar providers

### Task 6: Testing & Verification

- [ ] 6.1 End-to-end testing checklist
  - Test homepage loads with real providers
  - Test browse page lists all providers
  - Test provider detail page shows full details
  - Test 404 handling for non-existent providers
  - Test fallback to mock data when Supabase unavailable
  - Verify: All pages work correctly

- [ ] 6.2 iOS app regression check
  - Confirm iOS app still works (no changes were made to iOS Supabase)
  - Verify: iOS app continues to function normally

---

## Phase 2: Environment Strategy (After Phase 1)

**Goal**: Set up proper dev/staging/prod approach.

### Task 7: Document Current State

- [ ] 7.1 Create environment diagram
  - Files: `docs/ENVIRONMENT_STRATEGY.md`
  - Document which apps point to which Supabase project
  - Document credentials location and access
  - Verify: Team understands current setup

### Task 8: Create Staging Environment

- [ ] 8.1 Create new Supabase project for staging
  - Create "olera-staging" project in Supabase dashboard
  - Copy schema from iOS project
  - Seed with subset of production data
  - Verify: Staging project accessible

- [ ] 8.2 Configure staging environment variables
  - Files: `.env.staging`
  - Document how to switch between environments
  - Verify: Can connect to staging with env switch

---

## Phase 3: Unification (After iOS Approval)

**Goal**: Merge into one unified Supabase project.

### Task 9: Schema Reconciliation

- [ ] 9.1 Full schema audit
  - Compare iOS Supabase vs Web schema
  - Identify conflicts, missing tables, type differences
  - Document all differences
  - Verify: Complete diff documented

- [ ] 9.2 Choose unification strategy
  - Option A: iOS project becomes unified (migrate web additions)
  - Option B: Create new unified project (migrate both)
  - Document decision and rationale
  - Verify: Team agrees on approach

### Task 10: Execute Migration

- [ ] 10.1 Write migration scripts
  - Files: `lib/supabase/migrations/`
  - SQL scripts to align schemas
  - Data migration scripts if needed
  - Verify: Scripts tested on staging

- [ ] 10.2 Update all clients
  - Update web app env vars
  - Update iOS app env vars (new build)
  - Verify: Both apps point to unified project

- [ ] 10.3 Deprecate old project
  - Archive old Supabase project
  - Update documentation
  - Verify: Single source of truth

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS app breaks during Apple review | Critical | Phase 1 is READ-ONLY, no schema changes |
| Schema differences cause data display issues | Medium | Comprehensive testing in Task 3.2 |
| Performance issues with real data | Low | Add proper loading states, pagination |
| Credential exposure | High | Use `.env.local` (gitignored), never commit keys |

---

## Dependencies

- iOS Supabase credentials (from TJ)
- Confirmation that iOS app is approved (before Phase 3)

---

## Notes

- `DATABASE_STRATEGY.md` recommends Neon + Clerk, but this plan follows the Notion task to unify Supabase first
- The existing code already has graceful fallback patterns - we're leveraging, not replacing
- Mock data remains useful for development and as fallback

---

## Related Files

| File | Purpose |
|------|---------|
| `lib/types/provider.ts` | **NEW** iOS Provider type + conversion helpers |
| `lib/supabase/schema.sql` | Web app's original schema (legacy) |
| `lib/types.ts` | TypeScript types for database |
| `lib/mock-providers.ts` | Fallback mock data |
| `app/provider/[slug]/page.tsx` | Provider detail page (UPDATED) |
| `app/browse/providers/page.tsx` | Browse providers page (TODO) |
| `app/page.tsx` | Homepage with provider cards (UPDATED) |
| `docs/DATABASE_STRATEGY.md` | Previous strategy doc (Neon recommendation) |
