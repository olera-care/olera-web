# Plan: Automated Lead Notification & Email Completion Workflow

Created: 2026-03-09
Status: Not Started

## Goal

When a care seeker connects to a provider without an email on file, flag the provider, alert the team via Slack, and auto-send the lead notification once an admin adds the missing email.

## Success Criteria

- [ ] Connections to email-less providers are flagged in connection metadata (`needs_provider_email: true`)
- [ ] A distinct Slack alert fires for missing-email leads (includes provider name, admin link)
- [ ] Admin leads page highlights connections needing email with a visual badge and quick-link to provider editor
- [ ] When admin adds email via provider editor, pending connections with `needs_provider_email` auto-trigger the lead notification email
- [ ] No duplicate emails — if email existed at connection time, the normal flow handles it; the deferred flow only fires for previously-missing emails

## Tasks

### Phase 1: Flag & Alert (Connection API)

- [ ] 1. Add missing-email detection + metadata flag in `/api/connections/request`
      - Files: `app/api/connections/request/route.ts`
      - After step 9b (provider email lookup, lines 402-445), if no email found:
        - Set `connectionMetadata.needs_provider_email = true` (move metadata build before email section, or patch after insert)
        - Actually: simpler to check email availability before insert and set the flag in metadata at step 7
      - Verify: Create a connection to a provider with no email → check connection metadata in Supabase

- [ ] 2. Add `slackMissingEmail()` helper and fire it for flagged connections
      - Files: `lib/slack.ts`, `app/api/connections/request/route.ts`
      - New Slack formatter: header "Missing Provider Email", fields for family name, provider name, link to admin directory editor
      - Fire after connection insert when `needs_provider_email` is true
      - Verify: Trigger a connection to email-less provider → Slack channel gets the alert

### Phase 2: Admin Visibility

- [ ] 3. Extend admin leads API to return `needs_provider_email` flag + provider email status
      - Files: `app/api/admin/leads/route.ts`
      - Add `metadata` to the select query on connections
      - Optionally add a `needs_email` filter param
      - Verify: Call API with `needs_email=true` → only flagged connections returned

- [ ] 4. Update admin leads page UI with email-needed badges and provider editor links
      - Files: `app/admin/leads/page.tsx`
      - Add a "Needs Email" tab/filter alongside existing type filters
      - Show a warning badge on rows where `metadata.needs_provider_email === true`
      - Add a "Add Email" link on those rows → navigates to `/admin/directory/[providerId]`
      - Need to include `to_profile.source_provider_id` in the API response for linking to directory editor
      - Verify: Admin leads page shows flagged leads with visual distinction + working link

### Phase 3: Auto-Send on Email Addition

- [ ] 5. Extend admin directory PATCH to detect email addition and send deferred lead notifications
      - Files: `app/api/admin/directory/[providerId]/route.ts`
      - After successful update, if `email` changed from empty/null → non-empty:
        - Query `connections` where `to_profile.source_provider_id = providerId` AND `metadata->needs_provider_email = true` AND `status = 'pending'`
        - For each matching connection:
          - Send `connectionRequestEmail` to the new email
          - Update connection metadata: `needs_provider_email = false`, `email_sent_at = now()`
        - Log audit action for the deferred email sends
      - Verify: Add email to a provider with pending flagged connections → email sends, metadata clears

- [ ] 6. Also sync email to `business_profiles` when updated in `olera-providers`
      - Files: `app/api/admin/directory/[providerId]/route.ts`
      - After updating `olera-providers.email`, also update matching `business_profiles` record (by `source_provider_id`)
      - This ensures future connections don't re-flag the provider
      - Verify: Update email in admin → both `olera-providers` and `business_profiles` reflect the change

## Architecture Notes

### Data flow for missing-email connections:

```
Care seeker clicks Connect
        ↓
POST /api/connections/request
        ↓
Provider has no email?
  YES → metadata.needs_provider_email = true
      → Slack: "Missing Provider Email" alert
      → Email to provider: SKIPPED (no email)
      → Email to family: SENT (confirmation)
      → SMS to provider: SENT (if phone exists)
  NO  → Normal flow (all notifications sent)
        ↓
Admin sees flagged lead in /admin/leads
        ↓
Admin clicks "Add Email" → /admin/directory/[providerId]
        ↓
Admin saves email
        ↓
PATCH /api/admin/directory/[providerId]
        ↓
Detects email: null → "new@email.com"
        ↓
Queries flagged pending connections
        ↓
Sends connectionRequestEmail for each
        ↓
Clears needs_provider_email flag
```

### Key implementation details:

- **No schema changes needed** — uses existing `metadata` JSONB column on `connections`
- **Provider ID linking**: `olera-providers.provider_id` ↔ `business_profiles.source_provider_id` — admin directory uses `provider_id` from `olera-providers`, so we query connections via the `business_profiles` bridge
- **Email template reuse**: `connectionRequestEmail()` already exists and works perfectly for the deferred send
- **Fire-and-forget pattern**: All new notifications follow the existing try/catch-never-throw pattern

## Risks

- **Race condition**: Admin adds email while a new connection comes in simultaneously → mitigated by checking `needs_provider_email` flag specifically
- **Multiple pending connections**: One provider could have several flagged leads → the PATCH handler must loop through all, not just one
- **Provider in both tables**: Email must be synced to both `olera-providers` and `business_profiles` to prevent re-flagging

## Estimated Scope

~200 lines of changes across 5 files. No new dependencies, no schema migrations, no new pages — purely extending existing patterns.
