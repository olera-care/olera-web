# Plan: Email Audit Log — Admin Panel with Full Send History

Created: 2026-03-24
Status: Not Started
Notion: https://www.notion.so/Email-audit-log-admin-panel-with-full-send-history-32c5903a0ffe819983b2ee8d3d9e56ed

## Goal

Give the admin team (TJ, Logan, Esther, Chantel, Graize, Cess) a searchable, filterable log of every email sent through Resend — so when a provider says "I never got an email," the team can verify in seconds.

## Success Criteria

- [ ] Every `sendEmail()` call logs to a Supabase `email_log` table with type, recipient, status, and full HTML
- [ ] `/admin/emails` page shows a searchable, filterable table of all logged emails
- [ ] Filters work: recipient email, email type, recipient type, date range, delivery status
- [ ] Click-to-expand shows rendered HTML preview of any sent email
- [ ] CSV export downloads filtered results
- [ ] "Emails" nav item appears in admin sidebar
- [ ] Build passes clean, zero regressions on existing email flows

## Architecture Decision

**Option A (chosen): Log to Supabase at send time** — modify `sendEmail()` in `lib/email.ts` to insert into `email_log` after every send. This gives permanent history independent of Resend's 45-day retention, and works even if we switch providers.

**HTML storage:** Store full rendered HTML in `html_body TEXT` column. Templates change over time — regenerating from params won't match what was actually sent. ~5-15KB per email is acceptable for an audit log.

**Resend ID capture:** The Resend SDK returns `{ data: { id }, error }` on send. We currently destructure only `{ error }`. Capture `data.id` as `resend_id` for cross-referencing with Resend dashboard.

## Schema

```sql
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id TEXT,                        -- Resend's email ID for cross-reference
  recipient TEXT NOT NULL,               -- "to" address
  sender TEXT NOT NULL DEFAULT 'Olera <noreply@olera.care>',
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'unknown',  -- e.g. 'connection_request', 'welcome', 'question_received'
  recipient_type TEXT,                   -- 'provider', 'family', 'student', 'admin'
  provider_id TEXT,                      -- FK to business_profiles if applicable
  status TEXT NOT NULL DEFAULT 'sent',   -- 'sent', 'failed'
  error_message TEXT,                    -- error details if failed
  html_body TEXT,                        -- full rendered HTML
  metadata JSONB DEFAULT '{}',           -- extra context (connection_id, question_id, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_log_recipient ON email_log(recipient);
CREATE INDEX idx_email_log_email_type ON email_log(email_type);
CREATE INDEX idx_email_log_created_at ON email_log(created_at DESC);
CREATE INDEX idx_email_log_provider_id ON email_log(provider_id);
CREATE INDEX idx_email_log_status ON email_log(status);
```

## Email Type Catalog

Based on codebase exploration, these are all email types sent through `sendEmail()`:

| email_type | recipient_type | Template Function | Callers |
|---|---|---|---|
| `verification_code` | provider | `verificationCodeEmail` | claim/send-code |
| `claim_notification` | admin | `claimNotificationEmail` | claim/finalize |
| `claim_decision` | provider | `claimDecisionEmail` | admin/providers/[id] |
| `verification_decision` | provider | `verificationDecisionEmail` | admin/verification/[id] |
| `connection_request` | provider | `connectionRequestEmail` | connections/request |
| `connection_sent` | family | `connectionSentEmail` | connections/request |
| `guest_connection` | family | `guestConnectionEmail` | connections/request |
| `verify_email` | family | `verifyEmailEmail` | connections/request |
| `connection_response` | family | `connectionResponseEmail` | connections/respond-interest, connections/manage |
| `new_message` | provider/family | `newMessageEmail` | connections/message |
| `reach_out_accepted` | provider | `reachOutAcceptedEmail` | connections/respond-interest |
| `question_received` | provider | `questionReceivedEmail` | questions |
| `question_answered` | family | `questionAnsweredEmail` | questions |
| `question_confirmation` | family | `questionConfirmationEmail` | questions |
| `new_review` | provider | `newReviewEmail` | reviews |
| `welcome` | family | `welcomeEmail` | auth/ensure-account |
| `matches_live` | family | `matchesLiveEmail` | care-post/activate-matches, care-post/publish |
| `provider_reach_out` | family | `providerReachOutEmail` | matches/notify-reach-out |
| `matches_nudge` | family | `matchesNudgeEmail` | cron/matches-nudge |
| `checklist` | family | `checklistEmail` | benefits/email-checklist |
| `go_live_reminder` | family | `goLiveReminderEmail` | cron/family-nudges |
| `family_profile_incomplete` | family | `familyProfileIncompleteEmail` | cron/family-nudges |
| `provider_recommendation` | family | `providerRecommendationEmail` | cron/family-nudges |
| `post_connection_followup` | family | `postConnectionFollowupEmail` | cron/family-nudges |
| `provider_incomplete_profile` | provider | `providerIncompleteProfileEmail` | cron/family-nudges |
| `student_welcome` | student | `studentWelcomeEmail` | medjobs/apply |
| `student_returning` | student | `studentReturningEmail` | medjobs/apply |
| `application_received` | provider | `applicationReceivedEmail` | medjobs/apply-to-provider |
| `application_sent` | student | `applicationSentEmail` | medjobs/apply-to-provider |
| `application_response` | student | `applicationResponseEmail` | (future) |
| `profile_incomplete_nudge` | student | `profileIncompleteNudgeEmail` | cron/medjobs-nudge |
| `new_candidate_alert` | provider | `newCandidateAlertEmail` | cron/medjobs-digest |
| `daily_digest` | admin | (inline HTML) | cron/daily-digest |
| `unread_reminder` | family/provider | (inline HTML) | cron/unread-reminders, cron/matches-unread |
| `add_email_notification` | provider | (inline HTML) | admin/leads/add-email |

## Tasks

### Phase 1: Backend — Logging Infrastructure
_All changes needed to start capturing email data._

- [ ] **1. Create `email_log` table in Supabase**
  - Files: `supabase/migrations/XXX_email_log.sql` (new)
  - Create table with schema above, indexes, RLS policy (service role only)
  - Verify: Run migration, confirm table exists in Supabase dashboard

- [ ] **2. Extend `sendEmail()` to log every send**
  - Files: `lib/email.ts`
  - Add optional fields to `SendEmailOptions`: `emailType`, `recipientType`, `providerId`, `metadata`
  - Capture `data.id` from Resend response as `resend_id`
  - After send (success or failure), insert into `email_log` — fire-and-forget (don't block on log failure)
  - Store `html_body` from the `html` param
  - Verify: Send a test email, confirm row appears in `email_log` table

- [ ] **3. Add `emailType` to all 30+ sendEmail callers**
  - Files: All API routes that call `sendEmail()` (~30 files)
  - Add `emailType` and `recipientType` to each call
  - Add `providerId` where a provider context exists
  - Add `metadata` for useful cross-references (connection_id, question_id, etc.)
  - Verify: `grep -r "sendEmail(" --include="*.ts" --include="*.tsx"` — confirm no calls missing `emailType`

### Phase 2: Admin API
_Endpoint for the frontend to query._

- [ ] **4. Create `/api/admin/emails` GET endpoint**
  - Files: `app/api/admin/emails/route.ts` (new)
  - Query params: `search` (recipient email), `email_type`, `recipient_type`, `status`, `from_date`, `to_date`, `provider_id`, `limit`, `offset`
  - Returns: `{ emails: EmailLog[], total: number }`
  - Auth: `getAuthUser()` + `getAdminUser()` guard
  - Must support GET (browser-accessible per feedback memory)
  - Verify: `curl` the endpoint with various filter combos

- [ ] **5. Create `/api/admin/emails/export` GET endpoint**
  - Files: `app/api/admin/emails/export/route.ts` (new)
  - Same filters as above, returns CSV with `Content-Type: text/csv`
  - Excludes `html_body` from CSV (too large)
  - Verify: Download CSV, open in Excel/Sheets

### Phase 3: Admin UI
_The page the team will actually use._

- [ ] **6. Build `/admin/emails` page**
  - Files: `app/admin/emails/page.tsx` (new)
  - Follow leads page pattern: search bar + filter tabs + table + pagination
  - Filter tabs: All, Sent, Failed
  - Dropdown filters: Email Type (from catalog), Recipient Type (provider/family/student/admin)
  - Date range picker (from/to inputs)
  - Search: by recipient email (debounced 300ms)
  - Table columns: Timestamp, Recipient, Subject, Type (badge), Status (badge), Provider
  - Click row to expand: rendered HTML preview in iframe/sandboxed div
  - CSV export button in header
  - Verify: Load page, test all filters, expand a row, export CSV

- [ ] **7. Add "Emails" to AdminSidebar**
  - Files: `components/admin/AdminSidebar.tsx`
  - Add envelope icon + nav item between "Leads" and "Removals"
  - Verify: Sidebar shows new item, links to `/admin/emails`, active state works

### Phase 4: Polish & Backfill (Optional)

- [ ] **8. Backfill recent emails from Resend API** (optional)
  - Files: `scripts/backfill-email-log.ts` (new, one-time script)
  - Pull last 45 days from Resend API, insert into `email_log`
  - Won't have `email_type` or `html_body` but gives historical data
  - Verify: Run script, confirm rows appear in admin page

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Log insert fails → email still sends | Low (audit gap) | Fire-and-forget logging — `try/catch` around insert, never block email delivery |
| Large `html_body` column grows DB | Medium | TEXT column is fine for audit log scale. Can add retention policy later if needed |
| Shared Supabase = staging + prod logs mixed | Low | Add `environment` column if needed later. For now, both environments' data is useful |
| 30+ files need `emailType` added | Medium (large PR) | Mechanical change — same pattern everywhere. Can split into sub-PRs if needed |
| Inline HTML emails (cron digests) have no template function name | Low | Use descriptive `emailType` strings like `daily_digest`, `unread_reminder` |

## Notes

- Phase 2 (provider interaction history on detail page) is deferred. Once `email_log` exists, it's a simple query by `provider_id` + join with `audit_log` for a combined timeline.
- Loops emails are NOT logged here — they go through a different system (`lib/loops.ts`). Could add Loops logging in a future iteration.
- The `metadata` JSONB column is intentionally flexible — callers can include whatever context is useful (connection_id, question_id, care_post_id, etc.) without schema changes.
