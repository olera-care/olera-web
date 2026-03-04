# Plan: Backend Integration Roadmap for Olera 2.0 Migration

Created: 2026-03-03
Status: Not Started
Analysis: `docs/backend-integration-analysis.md`
Notion Task: [Backend Integration Roadmap](https://www.notion.so/3185903a0ffe800982bbd55176cb46e2)

## Goal

Close the backend integration gaps between the legacy Rails backend and v2.0 Next.js app — email notifications, error tracking, admin alerts, SMS, and background job infrastructure — so Olera 2.0 can fully replace v1.0 after DNS cutover.

## Success Criteria

- [ ] Families receive email when a provider responds to their connection request
- [ ] Providers receive email when a family sends a connection request
- [ ] Admin team gets Slack alerts for new leads, reported content, and provider claims
- [ ] Sentry captures and reports errors in production
- [ ] Twilio sends SMS verification codes (replacing or supplementing email OTP)
- [ ] At least one Vercel Cron job runs successfully (e.g., daily digest or cleanup)
- [ ] All email sending goes through a shared utility (`lib/email.ts`), not inline in routes

## Architecture Decisions Needed

> These should be resolved before or during Phase 1. TJ to decide.

1. **Email service:** Keep Resend (already integrated) or switch to SendGrid (legacy used it)?
   - **Recommendation:** Keep Resend — already works, modern API, React Email support
2. **Marketing automation:** Keep Loops (legacy used it) or consolidate into Resend?
   - **Recommendation:** Defer to Phase 4. Resend can handle transactional; Loops decision later
3. **Airtable lead sync:** Still needed or consolidate leads in Supabase?
   - **Recommendation:** Defer. Admin leads page exists. Revisit if team actively uses Airtable
4. **Background jobs:** Vercel Cron vs Supabase Edge Functions vs Inngest?
   - **Recommendation:** Vercel Cron for scheduled tasks (simple, no infra). Supabase DB triggers for event-driven work. Inngest if we need complex workflows later

---

## Tasks

### Phase 1: Email Notification Foundation (1-2 sessions)

> **Why first:** Users will notice missing notifications immediately after cutover. This is the #1 gap.

- [ ] 1. Create shared email utility library
      - Files: `lib/email.ts` (new), `lib/email-templates.tsx` (new)
      - What: Resend client singleton, `sendEmail()` helper, base HTML template with Olera branding
      - Refactor: Move inline Resend logic from `app/api/claim/send-code/route.ts` to use shared util
      - Verify: Existing claim verification emails still work after refactor

- [ ] 2. Connection request email (family → provider)
      - Files: `app/api/connections/request/route.ts`, `lib/email-templates.tsx`
      - What: When a family sends a connection request, email the provider with: family name, care type, message preview, CTA to respond
      - Template: Adapt copy from legacy `notifications_mailer.rb`
      - Verify: Create test connection → provider receives email

- [ ] 3. Connection response email (provider → family)
      - Files: `app/api/connections/respond-interest/route.ts`, `lib/email-templates.tsx`
      - What: When a provider responds to a request, email the family with: provider name, response status, CTA to view
      - Verify: Respond to test connection → family receives email

- [ ] 4. New message notification email
      - Files: `app/api/connections/message/route.ts`, `lib/email-templates.tsx`
      - What: When a new message is sent in a connection thread, email the other party
      - Debounce: Don't send if recipient was active in last 5 minutes (check connection metadata)
      - Verify: Send test message → other party receives email

- [ ] 5. Provider claim notification email (to admin)
      - Files: `app/api/claim/finalize/route.ts`, `lib/email-templates.tsx`
      - What: When a provider claims their page, notify admin team
      - Verify: Complete test claim → admin email received

### Phase 2: Error Tracking & Admin Alerts (1 session)

> **Why second:** Need visibility into production errors before cutover. Slack alerts keep the team informed.

- [ ] 6. Add Sentry error tracking
      - Files: `package.json`, `sentry.client.config.ts` (new), `sentry.server.config.ts` (new), `sentry.edge.config.ts` (new), `next.config.ts`, `app/global-error.tsx` (new)
      - What: Install `@sentry/nextjs`, configure for client + server + edge, add global error boundary
      - Env: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (Vercel env vars)
      - Verify: Trigger test error → appears in Sentry dashboard

- [ ] 7. Add Slack admin notification utility
      - Files: `lib/slack.ts` (new)
      - What: Slack webhook client — `sendSlackAlert(channel, message, blocks?)` helper
      - Env: `SLACK_WEBHOOK_URL` (Vercel env var)
      - Verify: Call helper → message appears in Slack channel

- [ ] 8. Wire Slack alerts to key admin events
      - Files: `app/api/claim/finalize/route.ts`, `app/api/connections/request/route.ts`, `app/api/disputes/route.ts`, `app/api/admin/providers/route.ts`
      - What: Send Slack notification on: new provider claim, new connection request (lead), new dispute, provider approval/rejection
      - Verify: Each action → Slack message with relevant details

### Phase 3: SMS & Twilio Integration (1 session)

> **Why third:** SMS verification adds a second factor for provider claims and improves trust.

- [ ] 9. Add Twilio SMS utility
      - Files: `lib/twilio.ts` (new), `package.json`
      - What: Install `twilio`, create `sendSMS(to, body)` helper with US +1 formatting
      - Env: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
      - Verify: Send test SMS → received on phone

- [ ] 10. SMS verification for provider claims (alternative to email)
      - Files: `app/api/claim/send-code/route.ts` (modify), `lib/twilio.ts`
      - What: If provider has phone number, offer SMS as verification option alongside email
      - Store code in same `claim_verification_codes` table
      - Verify: Request SMS code → received → can verify

- [ ] 11. SMS notification for new connection requests
      - Files: `app/api/connections/request/route.ts`
      - What: If provider has phone number and SMS notifications enabled, send brief SMS: "New care inquiry on Olera from {name}. View: {url}"
      - Verify: Create connection → provider gets SMS

### Phase 4: Background Jobs & Scheduled Tasks (1 session)

> **Why fourth:** Enables async work like daily digests, cleanup, and eventual marketing automation.

- [ ] 12. Set up Vercel Cron infrastructure
      - Files: `vercel.json` (new), `app/api/cron/daily-digest/route.ts` (new)
      - What: Configure Vercel Cron with `CRON_SECRET` for auth. First cron: daily digest of new leads/connections for admin
      - Env: `CRON_SECRET` (Vercel env var)
      - Verify: Trigger cron manually via curl → runs successfully, sends digest email

- [ ] 13. Unread message reminder cron
      - Files: `app/api/cron/unread-reminders/route.ts` (new), `vercel.json`
      - What: Every 6 hours, check for unread messages older than 24h. Send reminder email to recipient.
      - Verify: Seed unread message → cron sends reminder

- [ ] 14. Orphan cleanup cron
      - Files: `app/api/cron/cleanup/route.ts` (new), `vercel.json`
      - What: Daily cleanup — expired verification codes, stale draft connections, orphaned uploads
      - Verify: Seed expired data → cron removes it

### Phase 5: Marketing & Growth Integrations (Future — not this sprint)

> Deferred until after DNS cutover and Phase 1-4 are stable.

- [ ] 15. Loops marketing integration (or Resend sequences)
      - Decision: TJ to decide if Loops is still the marketing tool
      - What: Event triggers for new signups, new leads, new reviews → marketing sequences

- [ ] 16. Airtable lead sync
      - Decision: TJ to decide if Airtable is still used for lead tracking
      - What: Sync new connection requests to Airtable table

- [ ] 17. Google reviews sync cron
      - What: Monthly cron to refetch Google reviews for providers
      - Depends on: Google Places API key + review access

---

## File Impact Summary

### New Files
| File | Purpose |
|------|---------|
| `lib/email.ts` | Shared Resend client + `sendEmail()` helper |
| `lib/email-templates.tsx` | React Email templates (connection request, response, message, claim) |
| `lib/slack.ts` | Slack webhook helper |
| `lib/twilio.ts` | Twilio SMS helper |
| `sentry.client.config.ts` | Sentry browser config |
| `sentry.server.config.ts` | Sentry server config |
| `sentry.edge.config.ts` | Sentry edge runtime config |
| `app/global-error.tsx` | Global error boundary |
| `vercel.json` | Cron job definitions |
| `app/api/cron/daily-digest/route.ts` | Daily admin digest |
| `app/api/cron/unread-reminders/route.ts` | Unread message reminders |
| `app/api/cron/cleanup/route.ts` | Orphan data cleanup |

### Modified Files
| File | Change |
|------|--------|
| `app/api/claim/send-code/route.ts` | Refactor to use `lib/email.ts` |
| `app/api/claim/finalize/route.ts` | Add email + Slack notification |
| `app/api/connections/request/route.ts` | Add email + SMS + Slack notification |
| `app/api/connections/respond-interest/route.ts` | Add email notification |
| `app/api/connections/message/route.ts` | Add email notification (debounced) |
| `app/api/disputes/route.ts` | Add Slack notification |
| `app/api/admin/providers/route.ts` | Add Slack notification |
| `next.config.ts` | Sentry webpack plugin |
| `package.json` | Add @sentry/nextjs, twilio |

---

## Environment Variables Needed

| Variable | Service | Phase | Where to Set |
|----------|---------|-------|-------------|
| `RESEND_API_KEY` | Resend | 1 | Already exists in Vercel |
| `SENTRY_DSN` | Sentry | 2 | Vercel env vars |
| `SENTRY_AUTH_TOKEN` | Sentry | 2 | Vercel env vars |
| `SLACK_WEBHOOK_URL` | Slack | 2 | Vercel env vars |
| `TWILIO_ACCOUNT_SID` | Twilio | 3 | Vercel env vars |
| `TWILIO_AUTH_TOKEN` | Twilio | 3 | Vercel env vars |
| `TWILIO_FROM_NUMBER` | Twilio | 3 | Vercel env vars |
| `CRON_SECRET` | Vercel Cron | 4 | Vercel env vars |

---

## Risks

1. **Email deliverability** — New email flows from `noreply@olera.care` need SPF/DKIM configured. Resend handles this if domain is verified.
   - **Mitigation:** Verify domain in Resend dashboard before Phase 1.

2. **SMS costs** — Twilio charges per SMS. Need rate limiting to prevent abuse.
   - **Mitigation:** Rate limit SMS to 3/hour per number (same as email codes). Monitor spend.

3. **Sentry bundle size** — `@sentry/nextjs` adds ~30KB to client bundle.
   - **Mitigation:** Use lazy loading + tree shaking. Only import on error boundary.

4. **Cron reliability** — Vercel Cron is best-effort on Hobby plan, reliable on Pro.
   - **Mitigation:** Olera is on Pro plan. Add error reporting to cron handlers via Sentry.

5. **Notification spam** — Multiple email/SMS notifications for the same event.
   - **Mitigation:** Debounce logic in message notifications. Rate limits on all channels.

6. **Connection route modifications** — These are core user flows. Changes must not break the connection state machine.
   - **Mitigation:** Add notifications AFTER the main database write succeeds. Wrap in try/catch so notification failures don't break the flow.

---

## Session Estimates

| Phase | Sessions | Priority |
|-------|----------|----------|
| Phase 1: Email notifications | 1-2 | **Do first** — highest user impact |
| Phase 2: Sentry + Slack | 1 | **Do second** — visibility before cutover |
| Phase 3: Twilio SMS | 1 | **Do third** — enhances trust |
| Phase 4: Cron jobs | 1 | **Do fourth** — enables automation |
| Phase 5: Marketing/Growth | Future | **Defer** — after cutover is stable |

**Total: ~4-5 sessions for Phases 1-4**

---

## Notes

- Legacy backend repo is at `olera-care/olera-backend` on GitHub (cloned to `/tmp/olera-backend` for reference)
- Legacy email templates in `app/mailers/` and `app/views/` of the Rails repo have good copy to adapt
- Legacy Loops integration in `app/services/loops/` has 14 event types — useful reference for what marketing events to track
- All notification sending should be fire-and-forget (don't block the main request)
- Use `waitUntil()` from `next/server` for async notification sending in edge routes if available, otherwise wrap in try/catch
