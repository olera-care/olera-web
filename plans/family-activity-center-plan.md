# Plan: Family Activity Center (Unified Engagement Hub)

Created: 2026-03-26
Status: Not Started

## Goal

Expand the Activity Center into a unified engagement hub that tracks care seeker (family) activity alongside provider activity. Families who connect with providers, complete their profile, or click email links generate visible engagement signals — enabling the team to identify families who need help now vs. those who've gone cold.

## Context

The Provider Activity Center tracks one signal (email clicks) from one actor (providers). This expansion adds a **Families** lens tracking three signals:

| Signal | Event Type | Weight | Source |
|--------|-----------|--------|--------|
| Connected with a provider | `connection_sent` | High | Connection request API |
| Enriched profile (filled care needs, timeline, budget) | `profile_enriched` | Medium-high | Profile edit wizard (client) + portal API |
| Clicked an email link to return to platform | `email_click` | Medium | Magic link handler + portal pages |
| Asked a question | `question_asked` | Medium | Questions API |
| Activated Matches profile | `matches_activated` | Medium | Care post activation API |

The existing Matches admin page (`/admin/matches`) shows aggregate funnel metrics but doesn't identify specific families to act on. It will be replaced by the Families view in Activity Center.

## Success Criteria

- [ ] Activity Center has top-level toggle: **Providers | Families | Feed**
- [ ] Families view shows per-person engagement: connections sent, events count, engagement heat, last active
- [ ] Feed view shows chronological events from both providers AND families (distinguished by actor badge)
- [ ] All 16 family-facing email types have click tracking (`?ref=email&eid=` params)
- [ ] Connection requests log `connection_sent` to `seeker_activity`
- [ ] Profile saves log `profile_enriched` to `seeker_activity`
- [ ] Email click-backs from family emails log `email_click` to `seeker_activity`
- [ ] Matches page sidebar link replaced by Activity Center (or removed)
- [ ] Engagement heat: Hot (3+ events in 7d), Active (1+ in 7d), Gone quiet (0 in 7d)

## Architecture Decisions

**Separate table (`seeker_activity`) vs. expanding `provider_activity`:**
Separate table. Identity keys differ (provider_id is TEXT slug, profile_id is UUID FK). Event types differ. Hydration queries hit different tables. Merging creates a polymorphic mess with nullable columns. Two focused tables > one overloaded table.

**Profile enrichment tracking (client-side Supabase writes):**
The ProfileEditWizard saves directly to Supabase from the client (no API endpoint). Rather than refactoring that, we fire-and-forget a POST to `/api/activity/track` from the client after a successful save. Same pattern as provider email click tracking.

**Family engagement heat formula:**
Same thresholds as providers (3+ events = Hot, 1+ = Active, 0 = Gone quiet), but the events themselves carry different weight. A single `connection_sent` event is higher intent than an email click. For v1, count all events equally — the mix of event types in the breakdown badges gives the admin enough context to judge.

**What NOT to track:**
- Anonymous question-askers (no profile_id to key on)
- Page views (too noisy, low signal for families)
- Welcome email sends (admin action, not family engagement)

## Tasks

### Phase 1: Database Schema
- [ ] 1. Create `seeker_activity` table migration
      - Files: `supabase/migrations/027_seeker_activity.sql`
      - Schema: id, profile_id (FK business_profiles), event_type, email_log_id, email_type, related_provider_id (TEXT, which provider was involved), metadata (JSONB), created_at
      - Event types: `connection_sent`, `profile_enriched`, `email_click`, `question_asked`, `matches_activated`
      - Indexes: created_at DESC (feed), profile_id (aggregation), profile_id+created_at (per-person timeline), event_type, email_type
      - RLS enabled, service role only
      - Depends on: none
      - Verify: Run migration against Supabase, confirm table + indexes exist

### Phase 2: Instrument Backend Events
- [ ] 2. Log `connection_sent` when family connects with provider
      - Files: `app/api/connections/request/route.ts`
      - Insert into `seeker_activity` after connection is created (fire-and-forget, non-blocking)
      - Include: profile_id (family), related_provider_id (provider slug), metadata (care_type, timeline, guest flag)
      - Depends on: 1
      - Verify: Create test connection, confirm row in seeker_activity

- [ ] 3. Log `question_asked` when family submits a question (authenticated only)
      - Files: `app/api/questions/route.ts`
      - Only for authenticated users with a profile (skip anonymous guests)
      - Include: profile_id, related_provider_id, metadata (question preview)
      - Depends on: 1
      - Verify: Submit test question as auth user, confirm row

- [ ] 4. Log `matches_activated` when family activates care post
      - Files: `app/api/care-post/activate-matches/route.ts`
      - Include: profile_id, metadata (care_types, city, state)
      - Depends on: 1
      - Verify: Activate matches as test user, confirm row

- [ ] 5. Extend `/api/activity/track` to accept family events
      - Files: `app/api/activity/track/route.ts`
      - Add `actor_type` param: "provider" (default, existing behavior) or "family"
      - When actor_type=family: insert into `seeker_activity` instead of `provider_activity`
      - Accept `profile_id` as the identity key for family events
      - Add new valid event types for family: `email_click`, `profile_enriched`
      - Depends on: 1
      - Verify: POST with actor_type=family, confirm row in seeker_activity

- [ ] 6. Log `profile_enriched` from ProfileEditWizard (client-side)
      - Files: `components/portal/profile/ProfileEditWizard.tsx`
      - After successful Supabase update, fire POST to `/api/activity/track` with actor_type=family
      - Debounce: only fire once per save session (not per keystroke — the wizard already debounces at 800ms, batch the activity log to fire once when the wizard step changes or closes)
      - Include: profile_id, metadata (which fields were filled, step number)
      - Depends on: 5
      - Verify: Edit profile in portal, confirm row in seeker_activity

### Phase 3: Family Email Click Tracking
- [ ] 7. Instrument all family-facing emails with tracking params
      - Files: (16 email send points across 10 files)
        - `app/api/connections/request/route.ts` — verify_email (~L644), connection_sent (~L1313)
        - `app/api/matches/notify-reach-out/route.ts` — provider_reach_out (~L78)
        - `app/api/connections/message/route.ts` — new_message (~L225, when recipient is family)
        - `app/api/questions/route.ts` — question_confirmation (~L290, ~L389)
        - `app/api/review-requests/route.ts` — review_request (~L95, already has manual ref=email)
        - `app/api/cron/family-nudges/route.ts` — go_live_reminder (~L300), family_profile_incomplete (~L344), provider_recommendation (~L376), dormant_reengagement (~L408), post_connection_followup (~L452)
        - `app/api/cron/matches-nudge/route.ts` — matches_nudge (~L95)
        - `app/api/cron/matches-unread/route.ts` — unread_reminder (~L137, when family)
        - `app/api/cron/unread-reminders/route.ts` — unread_reminder (~L102, when family)
        - `app/api/care-post/activate-matches/route.ts` — matches_live (~L252)
        - `app/api/auth/ensure-account/route.ts` — welcome (~L173, ~L332)
      - Pattern: `reserveEmailLogId()` before HTML generation, `appendTrackingParams()` on all URLs in the email, pass emailLogId to `sendEmail()`
      - For emails that don't currently use `reserveEmailLogId`: add it
      - Depends on: 1
      - Verify: Trigger a family email, inspect HTML for `?ref=email&eid=` params

- [ ] 8. Add family email click capture to magic-link handler
      - Files: `app/auth/magic-link/page.tsx`
      - Currently only tracks provider clicks (checks for `/provider/` in URL path)
      - Add detection for family destinations: `/portal/inbox`, `/portal/matches`, `/browse`, `/welcome`
      - When detected: POST to `/api/activity/track` with actor_type=family, profile_id from session
      - Depends on: 5, 7
      - Verify: Click a family magic link, confirm seeker_activity row

- [ ] 9. Add family email click capture to portal pages
      - Files: `app/portal/inbox/page.tsx`, `app/portal/matches/page.tsx` (and potentially browse page)
      - Detect `ref=email&eid` in URL searchParams (same pattern as provider onboard page)
      - POST to `/api/activity/track` with actor_type=family
      - Clean up URL params after tracking (replaceState)
      - Depends on: 5, 7
      - Verify: Visit portal page with tracking params, confirm seeker_activity row

### Phase 4: Admin API
- [ ] 10. Add families view to `/api/admin/activity`
      - Files: `app/api/admin/activity/route.ts`
      - New `actor` query param: "providers" (default) | "families"
      - When actor=families, query `seeker_activity` instead of `provider_activity`
      - `handleFamiliesFeedView()`: chronological events, hydrate with business_profiles (display_name, email, city, state, care_types, metadata.timeline)
      - `handleFamiliesPeopleView()`: aggregate per profile_id — total_events, recent_events_7d, last_active, event_types breakdown, connections_count
      - Engagement heat: same thresholds (3+ = Hot, 1+ = Active, 0 = Gone quiet)
      - Filter by event_type (connection_sent, profile_enriched, email_click, etc.)
      - Search by family display_name or email
      - Time window: 7d, 30d, 90d
      - Pagination: same pattern as providers
      - total_count endpoint for header stat (all-time family events)
      - Depends on: 1
      - Verify: GET with actor=families, confirm JSON response structure matches UI needs

### Phase 5: Admin UI
- [ ] 11. Add Families tab to Activity Center
      - Files: `app/admin/activity/page.tsx`
      - Top-level toggle: Providers | Families | Feed
      - When "Families" selected: fetch with actor=families, render FamiliesView
      - FamiliesView (People sub-view): table with columns — Family | Events | Connections | Status | Last active
        - Family: display_name, location, care type badges, timeline (ASAP/1mo/3mo/Exploring)
        - Events: total count
        - Connections: count of connection_sent events (distinct related_provider_id)
        - Status: Hot / Active this week / Gone quiet (same colors as providers)
        - Last active: relative time
        - Event type breakdown badges: Connection (blue), Profile (purple), Email (amber), Question (teal)
        - Click family name → `/admin/care-seekers/{profileId}` (existing detail page)
      - FamiliesView (Feed sub-view): chronological events with family name + event description
      - Feed tab (existing): show BOTH provider and family events, add actor badge to distinguish
      - Update email type filter dropdown for families context (Connection, Profile, Email Click, Question, Matches)
      - Update search placeholder based on active tab
      - Update header subtitle to count both actor types
      - Depends on: 10
      - Verify: Navigate to Activity Center, switch tabs, see family data

- [ ] 12. Update admin sidebar — retire Matches link
      - Files: `components/admin/AdminSidebar.tsx`
      - Remove "Matches" from ACTIVITY section
      - Activity Center already exists in sidebar — no new link needed
      - Keep "Care Seekers" link (static CRM page still useful for profile details + deletion)
      - Depends on: 11
      - Verify: Check sidebar, Matches link gone

- [ ] 13. Add redirect from `/admin/matches` to `/admin/activity`
      - Files: `app/admin/matches/page.tsx` (or next.config.ts redirect)
      - Redirect with `?actor=families` param so it lands on Families tab
      - Depends on: 11
      - Verify: Navigate to /admin/matches, redirects to Activity Center Families view

## Risks

- **ProfileEditWizard client-side tracking**: The wizard saves directly to Supabase from the browser. Adding a POST to `/api/activity/track` means an extra network call per save. Mitigated: fire-and-forget with `.catch(() => {})`, debounced to once per step change, non-blocking.

- **Family email volume from cron jobs**: 5 cron nudge types could generate many email_log rows. The tracking params are lightweight (just appending query strings), but the seeker_activity table could grow faster than provider_activity. Mitigated: same 5000-row cap on aggregation queries, pagination on feed.

- **Guest families without accounts**: Some guest connections create profiles with `account_id = null`. These will still get seeker_activity rows (keyed on profile_id), but the magic-link click capture needs a session to identify the user. For guests clicking direct links (not magic links), we may not be able to attribute the click to a profile_id. Mitigated: fall back to email_log_id lookup to resolve profile_id.

- **Dual-recipient emails (new_message, unread_reminder)**: These emails go to either family or provider depending on who sent the message. The tracking instrumentation needs to check recipient type and route to the correct activity table. Already handled by the actor_type param on `/api/activity/track`.

## Notes

- The Care Seekers admin page (`/admin/care-seekers`) remains unchanged — it's the static CRM for viewing profile details and deleting accounts. The Activity Center Families view is the *engagement* lens; Care Seekers is the *profile* lens.
- The `seeker_activity.related_provider_id` field captures which provider was involved in each event. This enables future drill-downs like "which providers is this family comparing?" — not in v1 scope but the data will be there.
- The email instrumentation in Phase 3 is the highest-effort phase (16 send points across 10 files), but it's mechanical — same pattern repeated. Could be batched.
- Profile enrichment tracking (task 6) is a nice-to-have for v1. If it adds too much complexity, we can ship without it and add later. The connection + email click signals alone tell a strong engagement story.
