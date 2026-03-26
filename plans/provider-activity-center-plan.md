# Plan: Provider Activity Center

Created: 2026-03-25
Status: Not Started
Notion: [Track provider activity in "Activity Center"](https://www.notion.so/Track-provider-activity-in-Activity-Center-32f5903a0ffe80c8ad21ebd8b3176a6f)

## Goal

Track which providers engage with our email notifications (leads, Q&A, reviews) so we can identify conversion-ready prospects and surface them in an admin Activity Center.

## Success Criteria

- [ ] Every provider email link carries a tracking reference (`ref=email&eid={emailLogId}`)
- [ ] When a provider clicks an email link, an event is logged to `provider_activity`
- [ ] Admin can see a live Activity Center showing: who clicked, when, what type, engagement frequency
- [ ] Admin can identify "hot" providers (multiple clicks, recent activity) vs "cold" (sent emails, never clicked)
- [ ] Existing email flows (lead, Q&A, review) continue to work identically

## Architecture

### Tracking Flow

```
Email sent → email_log row created (has id, provider_id, email_type)
                ↓
Email link includes: ?ref=email&eid={email_log_id}
                ↓
Provider clicks → magic link handler (/auth/magic-link)
                ↓
Handler detects ref=email → logs to provider_activity table
                ↓
Redirects provider to destination (unchanged behavior)
```

### Data Model

```sql
provider_activity (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id     TEXT NOT NULL,          -- olera-providers.provider_id or business_profiles.source_provider_id
  profile_id      UUID,                   -- business_profiles.id (if claimed)
  event_type      TEXT NOT NULL,          -- 'email_click', 'page_view', 'lead_opened', 'question_responded', 'review_viewed'
  email_log_id    UUID,                   -- FK to email_log.id (for email_click events)
  email_type      TEXT,                   -- 'connection_request', 'question_received', 'new_review'
  metadata        JSONB DEFAULT '{}',     -- flexible: { source_url, user_agent, etc. }
  created_at      TIMESTAMPTZ DEFAULT now()
)
```

Why this shape:
- `provider_id` (TEXT) matches `email_log.provider_id` and `olera-providers.provider_id` — works for unclaimed providers
- `profile_id` (UUID, nullable) links to `business_profiles` when the provider has claimed — enables join to account data
- `email_log_id` ties the click back to the specific email that drove it
- `email_type` denormalized here so the admin query doesn't need to join `email_log` for every row

---

## Tasks

### Phase 1: Database — Activity Table
- [ ] 1. Create migration `supabase/migrations/026_provider_activity.sql`
      - Table: `provider_activity` with columns above
      - Indexes: `provider_id`, `event_type`, `created_at DESC`, `email_type`, `profile_id`
      - RLS: service role only (like email_log)
      - Files: `supabase/migrations/026_provider_activity.sql`
      - Verify: Migration SQL is valid, indexes cover admin query patterns

### Phase 2: Instrument Email Links
- [ ] 2. Thread `email_log.id` back from `sendEmail()` so callers can embed it in links
      - `sendEmail()` currently logs fire-and-forget. Change to: insert email_log row FIRST, return `{ success, emailLogId }`, then send via Resend
      - This gives callers the `eid` before generating the email HTML — needed for tracking links
      - Files: `lib/email.ts`
      - Verify: `sendEmail` returns `emailLogId`, email_log row created even if Resend fails

- [ ] 3. Add tracking params to connection request email links
      - In `/api/connections/request/route.ts`: pass `eid` to magic link URL and fallback URL
      - In `/api/admin/leads/add-email/route.ts`: same treatment
      - URL pattern: existing `?next=...` gains `&ref=email&eid={emailLogId}`
      - Files: `app/api/connections/request/route.ts`, `app/api/admin/leads/add-email/route.ts`
      - Verify: Sent lead emails contain `ref=email&eid=` in their links

- [ ] 4. Add tracking params to Q&A notification email links
      - In `/api/admin/questions/add-email/route.ts`: pass `eid` to magic link URL
      - Files: `app/api/admin/questions/add-email/route.ts`
      - Verify: Sent Q&A emails contain tracking params

- [ ] 5. Add tracking params to review notification email links
      - In `/api/reviews/route.ts` and `/api/reviews/public/route.ts`: pass `eid`
      - Files: `app/api/reviews/route.ts`, `app/api/reviews/public/route.ts`
      - Verify: Sent review emails contain tracking params

### Phase 3: Capture Click Events
- [ ] 6. Create activity logging API endpoint
      - `POST /api/activity/track` — accepts `{ provider_id, profile_id?, event_type, email_log_id?, email_type?, metadata? }`
      - Uses service role client, validates required fields
      - Files: `app/api/activity/track/route.ts`
      - Verify: POST with valid payload creates row in `provider_activity`

- [ ] 7. Log email clicks in the magic link handler
      - In `/app/auth/magic-link/page.tsx`: after successful session set, check for `ref=email` + `eid` in URL params
      - If present, fire `fetch('/api/activity/track', ...)` (non-blocking, fire-and-forget)
      - Extract provider context from the `next` URL or from the authenticated user's profile
      - Files: `app/auth/magic-link/page.tsx`
      - Verify: Clicking a tracked email link creates a `provider_activity` row with correct event_type and email_log_id

- [ ] 8. Log email clicks on fallback direct URLs (onboard page)
      - When magic link generation fails, emails link directly to `/provider/{slug}/onboard?action=...&ref=email&eid=...`
      - The onboard page should also detect and log `ref=email` clicks
      - Files: `app/provider/[slug]/onboard/page.tsx`
      - Verify: Direct link clicks also log activity

### Phase 4: Admin Activity Center — API
- [ ] 9. Create admin activity API endpoint
      - `GET /api/admin/activity` with query params:
        - `view=feed|providers` (feed = chronological events, providers = aggregated per provider)
        - `email_type=connection_request|question_received|new_review` (filter)
        - `days=7|30|90` (time window)
        - `search=` (provider name search)
        - `limit=` + `offset=` (pagination)
      - Feed view: returns events joined with provider name/category from `olera-providers`
      - Providers view: returns aggregated stats per provider (total clicks, last click, email types breakdown, claimed status)
      - Files: `app/api/admin/activity/route.ts`
      - Verify: Both views return correct data, pagination works

### Phase 5: Admin Activity Center — UI
- [ ] 10. Add "Activity Center" to admin sidebar navigation
       - Add nav item under the "Activity" section, between existing items or as first item
       - Route: `/admin/activity`
       - Files: `components/admin/AdminSidebar.tsx`
       - Verify: New nav item appears, links correctly, active state works

- [ ] 11. Build the Activity Center page
       - Two views toggled by segmented control: **Feed** (default) and **Providers**
       - **Feed view**: Chronological list of engagement events
         - Each row: provider name, event type badge, email type, relative timestamp
         - Click row → links to provider in directory
       - **Providers view**: Aggregated engagement per provider
         - Each row: provider name, category, city/state, total clicks, last active, engagement sparkline or heat indicator, claimed status
         - Sort by: last active (default), total clicks
         - "Hot" badge for providers with 3+ clicks in last 7 days
       - Shared controls: time window selector (7d/30d/90d), email type filter, search
       - Empty state: "No provider activity yet. Activity will appear here as providers engage with email notifications."
       - Files: `app/admin/activity/page.tsx`
       - Verify: Both views render, filters work, pagination works

## Design Direction

### Thesis
The Activity Center should feel like a sales intelligence tool, not a log viewer. The primary question it answers is: **"Which providers should I call today?"** Every pixel should serve that decision.

### Surgical Edits (vs typical admin template)
1. **No card grid** — single clean table/list. Data density over decoration
2. **Warm status language** — "Active this week" not "3 events". "Gone quiet" not "0 events in 30d"
3. **Time-relative language** — "2h ago", "Yesterday", "Mar 18" — not ISO timestamps
4. **Engagement heat** — subtle color gradient on provider rows (warm teal for active, neutral gray for cold). No traffic lights, no red/green
5. **Claimed badge** — small pill showing claimed vs unclaimed. Unclaimed + active = conversion opportunity
6. **Quiet filters** — inline segmented controls and dropdowns, not a filter bar with labels. Filters feel like view modes, not query builders
7. **Zero-chrome layout** — no panel borders, no card shadows, no section headers in ALL CAPS. Content creates structure via spacing and typography weight
8. **Provider name as anchor** — name is the heaviest element in each row. Everything else is supporting context at lighter weight

### Spacing & Typography
- Page padding: `px-6 py-8` (matches admin layout)
- Section gap: `space-y-6`
- Table row height: `py-3.5` with `border-b border-gray-100`
- Provider name: `text-sm font-medium text-gray-900`
- Supporting text: `text-sm text-gray-500`
- Badges: `text-xs font-medium px-2 py-0.5 rounded-full`
- Engagement heat: `bg-teal-50 text-teal-700` (active) → `bg-gray-50 text-gray-500` (cold)

### Motion
- Page load: content fades in (no skeleton flicker for fast loads — use 200ms delay before showing skeleton)
- Filter change: list crossfades (opacity transition, 150ms)
- No bounces, no slides, no scale transforms

## Risks

1. **email_log.id availability before send** — Task 2 restructures `sendEmail()` to insert the log row first. If Resend send fails after logging, we have a log entry with no sent email. Mitigation: update status to 'failed' on Resend error (already happens).

2. **Magic link hash vs query params** — Supabase magic links put tokens in the URL hash fragment, but our tracking params need to survive the redirect. The `next` param is already in the query string and survives. We append `ref` and `eid` to the `next` URL's own query string, so they arrive at the final destination.

3. **Provider identification for unclaimed providers** — Unclaimed providers don't have a `business_profiles.id`. We use `provider_id` (TEXT from olera-providers) as the primary key for activity. When they claim, we can backfill `profile_id`.

4. **Click ≠ engagement** — A click means the provider opened the link. It doesn't mean they read the lead or responded. Phase 2 enhancement: track deeper actions (lead viewed, question answered). For now, clicks are the signal we need.

## Notes

- The `ref=email` pattern is extensible — future sources: `ref=sms`, `ref=qr`, `ref=direct`
- `event_type` is extensible beyond email_click — can add `profile_claimed`, `first_response`, `subscription_started` later
- Consider a weekly digest email to admin with "Top 10 most active unclaimed providers" — but that's a separate task
- The `provider_activity` table will grow fast. Add a retention policy or partitioning if it exceeds 1M rows (unlikely in near term with ~40K providers)
