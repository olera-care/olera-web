# Plan: Fix Provider Onboarding Routing + Provider Data Mismatch

Created: 2026-03-26
Status: Not Started
Branch: loving-swartz
Notion: [Task](https://www.notion.so/Claude-Code-task-Fix-provider-onboarding-routing-provider-data-mismatch-089aad975c5d4ba0930c8da33b8a6597)

## Goal

Fix 5 provider onboarding bugs so that: providers don't see redundant auth after OTP, email links route correctly, claimed providers skip onboarding, `source_provider_id` is always populated, and review emails send for all providers.

## Success Criteria

- [ ] OTP verification → auto-sign-in → claim finalized (no auth modal)
- [ ] All email entry points (manage, lead, question, review, campaign, magic link) land on correct destination with no redundant auth
- [ ] Claimed + logged-in providers never flash the onboarding page
- [ ] New provider accounts created from scratch get `source_provider_id` populated
- [ ] Review notification emails send for all providers (BP-only, olera-providers-only, or linked)
- [ ] Build passes (`next build`)

## Tasks

### Phase 1: Extract Shared Routing Helper (Issue 2 — prerequisite for others)

- [ ] 1. Extract `getActionRedirectUrl(action, actionId)` helper function
      - Files: `app/provider/[slug]/onboard/page.tsx`
      - What: The same action→destination mapping is copy-pasted at lines 131-144, 314-328, and 521-532. Extract into a single function at the top of the file.
      - Mapping:
        - `lead` + id → `/provider/inbox?id={id}`
        - `message` + id → `/provider/inbox?id={id}`
        - `question` + id → `/provider/qna?id={id}`
        - `review` + id → `/provider/reviews?id={id}`
        - `campaign` → `/provider` (default hub)
        - default → `/provider`
      - Verify: All 3 locations use the helper. No behavioral change. Build passes.

### Phase 2: Fix Double Auth After OTP (Issue 1)

- [ ] 2. Replace `openAuth()` with auto-sign-in after OTP verification
      - Files: `app/provider/[slug]/onboard/page.tsx` (lines 455-472)
      - What: After OTP verification completes and `!user`, the current code opens the auth modal. Instead:
        1. The OTP step already collected and verified the provider's email
        2. Use server-side `generateLink` (via a new API endpoint or existing pattern) to create an auth account for the verified email
        3. Use `verifyOtp` client-side with the token to establish a session (same pattern as MedJobs `app/medjobs/apply/page.tsx`)
        4. Then call `handleFinalize()`
      - Approach: Create a lightweight `/api/auth/auto-sign-in` endpoint that:
        - Accepts `{ email }` (already verified via OTP)
        - Calls `supabase.auth.admin.generateLink({ type: "magiclink", email })` to get/create the auth user
        - Returns `{ token_hash, user_id }` to the client
        - Client calls `supabase.auth.verifyOtp({ token_hash, type: "magiclink" })` to establish session
      - Guard: Only callable when a valid claim session exists (prevents abuse)
      - Verify: OTP verify → no auth modal → auto-signed-in → claim finalizes → lands on success page

- [ ] 3. Clean up auth modal deferred action handling
      - Files: `app/provider/[slug]/onboard/page.tsx`
      - What: Remove the `openAuth({ deferred: { action: "claim" } })` code path since it's no longer needed after Task 2.
      - Verify: No references to `openAuth` remain in the onboard page.

### Phase 3: Fix Claimed Provider Flash (Issue 3)

- [ ] 4. Add `claim_state` check to middleware for provider routing
      - Files: `lib/supabase/middleware.ts` (lines 99-121)
      - What: Currently middleware finds a provider profile and always routes to `/provider/{slug}/onboard`. Should check:
        - If `claim_state === "claimed"` → allow through to destination (don't redirect to onboard)
        - If `claim_state !== "claimed"` → redirect to onboard (existing behavior)
      - Change: Add `claim_state` to the `select()` at line 102, then conditionally skip the onboard redirect.
      - Edge case: Provider with `onboarding_completed: false` but `claim_state: "claimed"` — this means they claimed but haven't finished setup. Still allow through since the claim is done; onboarding completion can be prompted in-app.
      - Verify: Log in as a claimed provider → navigate to `/portal/inbox` → no flash of onboard page, lands directly on inbox.

### Phase 4: Fix `source_provider_id` NULL (Issue 4)

- [ ] 5. Auto-link `source_provider_id` during claim finalization
      - Files: `app/api/claim/finalize/route.ts`
      - What: The finalize endpoint already sets `source_provider_id: providerId` at line 201 when creating a new BP from directory. But for providers who created accounts from scratch (not claiming a directory listing), this field stays NULL.
      - Root cause: When a provider creates a fresh account via `/api/auth/create-profile` (provider intent, lines 204-251), no `source_provider_id` is set because there's no olera-providers record to link to.
      - Fix: After profile creation in create-profile, attempt a fuzzy match against `olera-providers` by `provider_name` + `city` + `state`. If exactly 1 match found, set `source_provider_id` to that record's `provider_id`.
      - Guard: Only auto-link if exactly 1 match (no ambiguity). If 0 or 2+ matches, leave NULL — the provider can still function, just without legacy data linkage.
      - Verify: Create a test provider account from scratch → `business_profiles.source_provider_id` is populated if a matching olera-providers record exists.

- [ ] 6. Backfill existing NULL `source_provider_id` records
      - Files: New script `scripts/backfill-source-provider-id.js`
      - What: One-time script to link existing `business_profiles` records (where `source_provider_id IS NULL` and `type IN ('organization', 'caregiver')`) to their matching `olera-providers` records.
      - Match strategy:
        1. Exact slug match: `olera-providers.slug = business_profiles.slug`
        2. Name + city + state match: exact match on all 3 fields
        3. Skip if 0 or 2+ matches (log for manual review)
      - Output: Dry-run mode by default, `--apply` flag to execute updates. Log all matches and skips.
      - Verify: Run in dry-run mode first, review output, then apply.

### Phase 5: Fix Review Email Notifications (Issue 5)

- [ ] 7. Add fallback provider lookup for review email notifications
      - Files: `app/api/reviews/public/route.ts` (lines 149-153)
      - What: Currently only queries `business_profiles` by slug. If no BP match, provider doesn't get the email.
      - Fix: After the BP slug lookup, if no result:
        1. Check `olera-providers` table for the slug
        2. If found, look up `business_profiles` by `source_provider_id = olera_provider.provider_id`
        3. If found, use that BP's `account_id` to send the email
      - Also: If BP found but `account_id` is NULL, check if there's a linked BP via `source_provider_id` that does have an `account_id`.
      - Verify: Submit a review for a provider that only exists in `olera-providers` → email sends. Submit for a provider with NULL `source_provider_id` → email still sends via fallback.

### Phase 6: Verification & Cleanup

- [ ] 8. End-to-end verification of all 7 entry points
      - Entry points to test:
        1. `manage this listing` (onboard page, no action param)
        2. `lead` email → `/provider/{slug}/onboard?action=lead&actionId=xxx`
        3. `question` email → `/provider/{slug}/onboard?action=question&actionId=xxx`
        4. `review` email → `/provider/{slug}/onboard?action=review&actionId=xxx`
        5. `campaign` email → `/provider/{slug}/onboard?action=campaign&token=xxx`
        6. Magic link (direct auth callback)
        7. Google OAuth callback for provider
      - For each: verify correct destination, no redundant auth, no onboarding flash
      - Files: Create `docs/provider-onboarding-test-matrix.md` with manual test checklist

- [ ] 9. Build verification
      - Run `next build` — must pass with zero errors
      - Verify no TypeScript errors introduced

## Risks

| Risk | Mitigation |
|------|------------|
| Auto-sign-in endpoint could be abused | Guard with claim session validation — only works if caller has a valid, verified claim session |
| Middleware `claim_state` check adds a DB query | Already querying `business_profiles` — just adding `claim_state` to the SELECT, no extra query |
| Fuzzy match for `source_provider_id` could link wrong provider | Require exact match on all 3 fields (name + city + state) AND exactly 1 result |
| Backfill script could incorrectly link records | Dry-run mode by default, human review before applying |
| Review email fallback adds latency | Fallback only triggers when primary lookup fails (rare path), and it's fire-and-forget anyway |

## Architecture Notes

- The `source_provider_id` field bridges two systems: `olera-providers` (pipeline-seeded directory) and `business_profiles` (user-created/claimed accounts). Many queries need to check both sides of this bridge.
- PR #407 (visibility-only, not merged) contains useful patterns: `.in("provider_id", [slug, source_provider_id].filter(Boolean))` — we should adopt this pattern where relevant.
- The auto-sign-in approach mirrors MedJobs (`app/medjobs/apply/page.tsx`) which uses `generateLink` + `verifyOtp` for seamless account creation.

## File Change Summary

| File | Changes |
|------|---------|
| `app/provider/[slug]/onboard/page.tsx` | Extract routing helper, replace openAuth with auto-sign-in |
| `lib/supabase/middleware.ts` | Add claim_state to select, skip onboard for claimed providers |
| `app/api/auth/auto-sign-in/route.ts` | **NEW** — Lightweight endpoint for OTP-verified auto-sign-in |
| `app/api/auth/create-profile/route.ts` | Auto-link source_provider_id on fresh provider creation |
| `app/api/claim/finalize/route.ts` | No changes needed (already sets source_provider_id) |
| `app/api/reviews/public/route.ts` | Add fallback provider lookup for email notifications |
| `scripts/backfill-source-provider-id.js` | **NEW** — One-time backfill script |
| `docs/provider-onboarding-test-matrix.md` | **NEW** — Manual test checklist |
