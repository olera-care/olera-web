# Backend Integration Analysis — Legacy v1.0 vs v2.0

> **Date:** 2026-03-03 | **Source:** Claude Code exploration of `olera-care/olera-backend` (Rails 8) vs `olera-care/olera-web` (Next.js 16)
> **Purpose:** Full audit of legacy backend integrations vs v2.0 capabilities to produce a migration roadmap.

---

## Legacy Backend (olera-backend)

**Stack:** Ruby 3.4.2 / Rails 8.0.0 / PostgreSQL + PostGIS / Sidekiq + Redis / Heroku

| Integration | Service | What It Does |
|-------------|---------|-------------|
| Payments | Stripe | Full subscription lifecycle — checkout, renewals, cancellations, failed payments, customer portal |
| SMS | Twilio | Phone verification codes, notification delivery |
| Transactional Email | SendGrid | 7 mailer classes — answer notifications, share confirmations, provider published, email changes |
| Marketing Email | Loops | 14 event-triggered jobs — new leads, questions, reviews, messages (runs every 15 min) |
| Lead Management | Airtable | Syncs form submissions + new user registrations |
| Admin Alerts | Slack | Webhook notifications for reported content, new posts, missing providers |
| AI | OpenAI | Content generation/recommendations |
| CMS | Sanity | Category sync, content delivery |
| Maps | Google Places | Autocomplete, geocoding, place search |
| Errors | Sentry | Error tracking across web + Sidekiq workers |
| Files | AWS S3 | Logo uploads, provider images, user avatars |
| Background Jobs | Sidekiq + Redis | 27 job types, 3 cron schedules |
| Auth | Devise + Doorkeeper | Password auth, OAuth2 tokens, JWT, role-based (Pundit) |

### Legacy Environment Variables

<details>
<summary>Full list of env vars from legacy backend</summary>

**Stripe:**
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`

**Twilio:**
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`

**SendGrid:**
- `SENDGRID_USERNAME`, `SENDGRID_PASSWORD`, `DEFAULT_SENDER`

**Loops:**
- `LOOPS_API_KEY`, `MARKETING_CAMPAIGN_ENABLED`

**Airtable:**
- `AIRTABLE_ACCESS_TOKEN`, `AIRTABLE_EVENT_BASE_ID`, `AIRTABLE_EVENT_TABLE_NAME`, `AIRTABLE_CAREGIVER_LEADS_BASE_ID`, `AIRTABLE_CAREGIVER_LEADS_TABLE_NAME`

**Slack:**
- `SLACK_WEBHOOK_URL`, `SLACK_DEFAULT_CHANNEL`, `SLACK_SUPPORT_CHANNEL`, `SLACK_SUPPORT_WEBHOOK_URL`

**OpenAI:**
- `OPENAI_API_KEY`, `OPENAI_ADMIN_TOKEN`, `OPENAI_ORGANIZATION_ID`

**Sanity:**
- `SANITY_TOKEN`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`

**Database/Redis:**
- `DATABASE_URL` (PostGIS), `REDIS_URL`

**Auth:**
- `DEVISE_JWT_SECRET_KEY`, `TURNSTILE_SECRET_KEY`

</details>

### Legacy Sidekiq Jobs (27 types)

<details>
<summary>Background job inventory</summary>

**Email Jobs:** Verification emails, notification emails, provider Q&A notifications, review request/confirmation emails

**Data Sync Jobs:** Airtable registration sync, Loops event creation, Category CMS sync, Provider Google Place name updates, Review refetch from Google

**Media Processing:** Download logos/assets, Process ActionText images, Image variant generation

**Scheduled Crons:**
- `DeleteOrphanBlobsJob` — Daily 1 AM (remove unused file attachments)
- `Reviews::RefetchForAllJob` — Monthly 1st at 2 AM (sync Google reviews)
- `Loops::NewMessagesJob` — Every 15 min (sync new messages to Loops)

</details>

---

## v2.0 Backend (olera-web)

**Stack:** Next.js 16 / React 19 / TypeScript / Supabase / Vercel

| Integration | Service | Status |
|-------------|---------|--------|
| Payments | Stripe | ✅ Working — checkout, webhooks, subscription lifecycle, trial periods |
| Email | Resend | ⚠️ Partial — only verification codes for provider claims |
| SMS/Twilio | — | ❌ Not integrated |
| Marketing Email | — | ❌ Not integrated |
| Lead Management | — | ❌ In-app only (admin/leads page) |
| Admin Alerts | — | ❌ Not integrated |
| AI | Claude Vision | ✅ Image classification (heuristic + vision) |
| CMS | Supabase | ✅ 103 articles migrated, admin editor working |
| Maps | MapTiler/MapLibre | ✅ Browse page map view |
| Errors | — | ❌ No error tracking service |
| Files | Supabase Storage | ✅ Profile images, content uploads |
| Background Jobs | — | ❌ None — everything request/webhook-driven |
| Auth | Supabase Auth | ✅ Google OAuth + email OTP, role-based middleware |

---

## Gap Analysis

| Capability | Legacy | v2.0 | Gap Size |
|------------|--------|------|----------|
| Stripe subscriptions | Full | Full | **None** — v2 already has this |
| Transactional email | SendGrid (7 mailers) | Resend (1 flow) | **Large** — need connection notifications, admin alerts, provider emails |
| SMS notifications | Twilio | None | **Full gap** — need for verification + notifications |
| Marketing automation | Loops (14 events) | None | **Full gap** — decide Loops vs Resend |
| Slack admin alerts | Webhooks | None | **Medium** — useful but not critical |
| Background jobs | Sidekiq (27 jobs) | None | **Architecture gap** — need Vercel Cron or Supabase Edge Functions |
| Error tracking | Sentry | None | **Medium** — should add before cutover |
| Lead sync (Airtable) | Full | None | **Decide** — still using Airtable? |
| Google reviews sync | Monthly cron | None | **Feature gap** — monthly refetch |

---

## What's Reusable from Legacy

1. **Stripe webhook event types** — Same events, same logic. v2 already handles them.
2. **Email templates/copy** — 7 mailer classes have good notification copy to adapt.
3. **Loops event structure** — 14 event types map to v2 user actions.
4. **Slack notification format** — Rich message formatting patterns.
5. **Twilio phone formatting** — US +1 formatting, test number handling.

## What Needs to Be Built from Scratch

1. **Background job infrastructure** — Rails had Sidekiq+Redis. v2 needs Vercel Cron or Supabase Edge Functions.
2. **Email notification system** — Resend is in v2 but only one flow. Need templates + triggers for all user events.
3. **Event bus** — Legacy had Sidekiq jobs triggered by controller actions. v2 needs equivalent (database triggers → Edge Functions, or API route → queue).

---

## Recommended Phased Approach

### Phase 1: Pre-Cutover (User-Facing)
- Email notifications for connections (family requests, provider responses)
- This is what users notice first when interacting with the platform

### Phase 2: Post-Cutover (Operations)
- Sentry error tracking
- Slack admin alerts
- SMS verification via Twilio

### Phase 3: Growth
- Marketing automation (Loops or Resend sequences)
- Airtable lead sync (if still needed)
- Google review sync (monthly cron)

---

## Risks

1. **No background processing in v2** — Biggest architectural gap. Every legacy notification was a Sidekiq background job.
2. **Supabase Edge Functions vs Vercel Cron** — Need to decide execution model for async work.
3. **Loops dependency** — Decide: keep Loops, switch to Resend sequences, or skip for now.
4. **Airtable dependency** — If team still uses Airtable for lead tracking, needs rebuild.

---

> **Next step:** Create detailed implementation plan. This analysis will span multiple sessions.
