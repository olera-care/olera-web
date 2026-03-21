# Olera Web — Systems & Background Processes

> Living reference for all automated systems, cron jobs, background processes, and data pipelines. If it runs without someone clicking a button, it should be documented here.

---

## Google Reviews Pipeline

Fetches and caches Google review data (rating, review count, review snippets) for provider pages and browse cards.

### Data Flow

```
Google Places API (New)  →  olera-providers.google_reviews_data (JSONB)  →  Provider pages + Browse cards
```

### Three Mechanisms

#### 1. Monthly Cron Job (Scheduled)

- **File:** `app/api/cron/google-reviews/route.ts`
- **Schedule:** 1st of each month, 3 AM UTC (`0 3 1 * *` in `vercel.json`)
- **What it does:** Refreshes Google review data using a tiered strategy:
  - **Tier 1:** Claimed/verified providers (from `business_profiles`) — refresh if >30 days stale
  - **Tier 2:** Recently viewed providers (`last_viewed_at` within 30 days) — refresh if >30 days stale
  - **Tier 3:** Long-tail providers — refresh if >90 days stale OR never synced
- **Batch size:** 50 providers at a time, 200ms delay between batches
- **Cost:** ~$100/month at 100K providers (covered by Google's $200/month free Maps Platform credit)
- **Writes to:** `olera-providers.google_reviews_data`

#### 2. On-Demand Backfill (Triggered by Page Views)

- **Trigger file:** `app/provider/[slug]/page.tsx` (lines ~452-458)
- **Endpoint:** `POST /api/internal/backfill-google-review` (`app/api/internal/backfill-google-review/route.ts`)
- **When it fires:** Every time a family views a provider page, IF that provider has a `place_id` but no cached `google_reviews_data`
- **Behavior:** Fire-and-forget (non-blocking). Page renders immediately; review data appears on next visit.
- **Authentication:** None (internal endpoint, not exposed to users)
- **Writes to:**
  - `olera-providers.google_reviews_data` (for iOS-seeded providers)
  - `business_profiles.metadata.google_reviews_data` (for business profile providers)
- **Cost:** $0.005 per page view that triggers a backfill
- **Why this matters:** Over time, organic traffic gradually fills in review data for providers that families actually care about. This is why coverage grows without manual intervention.

#### 3. Admin Seed Endpoint (Manual)

- **File:** `app/api/admin/seed-google-reviews/route.ts`
- **Endpoint:** `POST /api/admin/seed-google-reviews`
- **Authentication:** Master admin only (`isMasterAdmin` check)
- **Parameters:**
  - `?limit=100` — batch size (max 500)
  - `&offset=0` — pagination
  - `&dry_run=true` — count eligible without fetching
  - `&force=true` — re-fetch even if already cached
  - `&require_rating=true` — only providers with existing `google_rating > 0` (default)
  - `&categories=Home Care (Non-medical),Assisted Living` — filter by category
- **When to use:** Bulk backfill for new categories or initial seeding
- **Cost:** $5 per 1,000 providers

### View Tracking (Side Effect)

- **File:** `app/provider/[slug]/page.tsx` (lines ~444-449)
- **What:** Updates `olera-providers.last_viewed_at` on each page view
- **Debouncing:** Only writes if >24 hours since last update
- **Purpose:** Enables Tier 2 of the monthly cron (recently viewed providers get priority refresh)

### Coverage (as of 2026-03-21)

| Metric | Count | % of ~36,668 |
|--------|-------|-------------|
| Have `google_reviews_data` | 20,512 | 56% |
| Have actual review text | 19,324 | 53% |
| No review data | ~16,156 | 44% |

Coverage grows automatically via on-demand backfill and monthly cron.

### Key Files

| File | Purpose |
|------|---------|
| `lib/google-places.ts` | Google Places API fetch utility |
| `app/api/cron/google-reviews/route.ts` | Monthly cron handler |
| `app/api/internal/backfill-google-review/route.ts` | On-demand backfill handler |
| `app/api/admin/seed-google-reviews/route.ts` | Manual bulk seed |
| `supabase/migrations/021_google_reviews.sql` | Schema (JSONB column + index) |
| `vercel.json` | Cron schedule configuration |
| `docs/google-reviews-seed-log.md` | Initial seed operation log |

### Compliance

- Google Places API allows caching for **30 days** (including review text)
- Must display Google attribution when showing reviews
- Must refresh cached data within 30-day window (cron handles this)
- `place_id` can be stored indefinitely

---

## CMS Medicare Data Pipeline

Fetches federal quality data from CMS (Centers for Medicare & Medicaid Services) and matches against Olera providers.

### Data Flow

```
CMS Public APIs (data.cms.gov)  →  Name+ZIP matching  →  olera-providers.cms_data (JSONB)
```

### Endpoint

- **File:** `app/api/admin/import-cms-data/route.ts`
- **Authentication:** Master admin only
- **Sources:** Home Health, Nursing Home, Hospice (three CMS datasets)
- **Matching:** Normalized provider name + ZIP code
- **Parameters:**
  - `?state=TX` — single state
  - `?state=all&batch=1` — all states, batched (5 states per batch)
  - `&source=home_health|nursing_home|hospice|all`
  - `&dry_run=true`
  - `&force=true`
- **Coverage:** ~30% match rate for eligible categories (home health, nursing homes, hospice only)
- **Cost:** Free (CMS APIs are public, no key needed)
- **Refresh:** Quarterly (CMS updates quarterly). No automated cron yet — manual runs.

### Key Files

| File | Purpose |
|------|---------|
| `lib/cms-data.ts` | CMS API fetch + matching logic |
| `app/api/admin/import-cms-data/route.ts` | Import endpoint |

---

## AI Trust Signal Verification

Uses Perplexity Sonar API to verify trust signals for providers NOT covered by CMS (non-medical home care, assisted living, memory care, independent living).

### Data Flow

```
Perplexity Sonar API  →  Web search verification  →  olera-providers.ai_trust_signals (JSONB)
```

### Endpoint

- **File:** `app/api/admin/verify-trust-signals/route.ts`
- **Authentication:** Master admin only
- **Parameters:**
  - `?state=TX` — required (2-letter state code)
  - `&limit=20` — batch size (max 30)
  - `&offset=0` — pagination
  - `&dry_run=true`
  - `&force=true`
  - `&categories=...` — comma-separated (defaults to non-CMS categories)
- **Cost:** ~$1 per 1,000 providers
- **Status:** Under evaluation — avg confirmed signals may be too low for practical use

### Signals Verified (v2)

| Signal | What it checks |
|--------|---------------|
| State Licensed | State licensing databases/registries |
| Accredited | JCAHO, CHAP, CARF, ACHC |
| BBB Rated | Better Business Bureau profile |
| Years in Operation | Business incorporation date |
| Clean Record | No regulatory actions |
| Active Website | Website resolves with content |
| Google Business | Google Business Profile listing |
| Community Presence | Social media, directories |

### Key Files

| File | Purpose |
|------|---------|
| `lib/ai-trust-signals.ts` | Perplexity API prompt + parsing |
| `app/api/admin/verify-trust-signals/route.ts` | Verification endpoint |
| `components/providers/AiTrustSignalsSection.tsx` | UI component |

---

## Family Notification Emails (Cron)

Automated email nudges for care-seeking families who signed up but haven't completed key actions.

### Data Flow

```
Vercel Cron (daily 3 PM UTC)  →  Query business_profiles (type=family)  →  Loops transactional email
```

### Endpoint

- **File:** `app/api/cron/family-nudges/route.ts`
- **Schedule:** Daily at 3 PM UTC (`0 15 * * *` in `vercel.json`)
- **Authentication:** `CRON_SECRET` (Vercel auto-sends for cron, also supports `?secret=` for browser testing)

### Emails Sent (Priority Waterfall)

At most ONE email per family per cron run. First matching condition wins:

| Priority | Email | Trigger | Timing | Guard |
|----------|-------|---------|--------|-------|
| 1 | **Go Live Reminder** | Profile complete, Matches not active | Day 1+ | `go_live_reminder_sent` |
| 2 | **Profile Incomplete** | Missing care_types or location | Day 3+ | `profile_incomplete_reminder_sent` |
| 3 | **Provider Recommendation** | Complete profile, zero connections | Day 5+ | `provider_recommendation_sent` |
| 4 | **Dormant Re-engagement** | Zero connections | Day 14+ | `dormant_reengagement_sent` |
| 5 | **Post-Connection Follow-up** | Has connection 30+ days old | Day 30+ | `post_connection_followup_sent` |

**Value-driven content:** Go Live, Recommendation, and Dormant emails include real provider cards (name, category, rating, review count, review snippet) matched to the family's location and care needs.

### Safety

- Each email is **one-shot** — a metadata flag prevents re-sending
- Max 500 families processed per run
- At most ONE email per family per cron run (priority waterfall with `continue`)
- Email resolved from `business_profiles.email` → falls back to `auth.users.email` via account lookup
- Provider queries cached per city/state/careTypes combo (prevents duplicate DB queries)
- Supports `?dry_run=true` for testing without sending

### Key Files

| File | Purpose |
|------|---------|
| `app/api/cron/family-nudges/route.ts` | Cron handler with priority waterfall |
| `lib/email-templates.tsx` | All email templates including provider card helpers |
| `lib/email.ts` | `sendEmail()` — sends via Resend transactional API |

---

## Vercel Cron Schedule

All cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/google-reviews",
      "schedule": "0 3 1 * *"
    },
    {
      "path": "/api/cron/cms-refresh",
      "schedule": "0 6 15 1,4,7,10 *"
    },
    {
      "path": "/api/cron/family-nudges",
      "schedule": "0 15 * * *"
    }
  ]
}
```

| Job | Schedule | Description |
|-----|----------|-------------|
| Google Reviews Refresh | 1st of month, 3 AM UTC | Tiered refresh of cached Google review data |
| CMS Data Refresh | 15th of Jan/Apr/Jul/Oct, 6 AM UTC | Re-import CMS Medicare quality data |
| Family Nudge Emails | Daily, 3 PM UTC | One-shot go-live and profile-incomplete reminders |

---

## Admin Endpoints Summary

All require master admin authentication. All support GET (browser URL bar) and POST.

| Endpoint | Purpose | Cost |
|----------|---------|------|
| `/api/admin/seed-google-reviews` | Bulk seed Google reviews | $5/1K |
| `/api/admin/import-cms-data` | Import CMS quality data | Free |
| `/api/admin/verify-trust-signals` | AI trust signal verification | $1/1K |

---

## Complete Email System Catalog

Every automated email sent by Olera, organized by trigger type. All emails sent via Resend API (`lib/email.ts`). Templates in `lib/email-templates.tsx` (family/provider) and `lib/medjobs-email-templates.tsx` (students).

### Family Nurture Sequence (Cron — daily 3 PM UTC)

| Email | Subject | Trigger | Guard |
|-------|---------|---------|-------|
| Go Live Reminder | "[X] providers in [city] are looking for families like yours" | Profile complete, Matches not active, Day 1+ | `go_live_reminder_sent` |
| Profile Incomplete | Dynamic: "Tell us what you're looking for" / "Add your location" | Missing care_types or location, Day 3+ | `profile_incomplete_reminder_sent` |
| Provider Recommendation | "Top-rated providers in [city] for you" | Complete profile, zero connections, Day 5+ | `provider_recommendation_sent` |
| Dormant Re-engagement | "Families in [state] are finding care on Olera" | Zero connections, Day 14+ | `dormant_reengagement_sent` |
| Post-Connection Follow-up | "How was your experience with [Provider]?" | Connection 30+ days old | `post_connection_followup_sent` |

### Connection & Messaging (Event-triggered)

| Email | Trigger | File |
|-------|---------|------|
| Connection Sent | Family sends inquiry to provider | `app/api/connections/request/route.ts` |
| Connection Response | Provider accepts/declines inquiry | `app/api/connections/respond-interest/route.ts` |
| Provider Reach Out | Provider discovers family on Matches | `app/api/matches/notify-reach-out/route.ts` |
| New Message | Message sent in conversation thread | `app/api/connections/message/route.ts` |

### Unread Reminders (Cron)

| Email | Schedule | Trigger | File |
|-------|----------|---------|------|
| Unread Message (Inquiry) | Every 6 hours | Message from other party unread 24h+ | `app/api/cron/unread-reminders/route.ts` |
| Unread Message (Matches) | Every 1 hour | Matches message unread 1h+, recipient inactive 5+ min | `app/api/cron/matches-unread/route.ts` |

### Provider Nudges (Cron — daily)

| Email | Trigger | Guard | File |
|-------|---------|-------|------|
| Matches Nudge | 2+ family inquiries, 1 quiet 48h, Matches off | `matches_nudge_email_sent` | `app/api/cron/matches-nudge/route.ts` |
| Provider Incomplete Profile | Profile 48h+ old, missing 2+ fields | `profile_incomplete_email_sent` | `app/api/cron/matches-nudge/route.ts` |

### Onboarding & Auth (Event-triggered)

| Email | Trigger | File |
|-------|---------|------|
| Welcome | New signup (OAuth or email OTP) | `app/api/auth/ensure-account/route.ts` |
| Verification Code | Provider claim flow | `app/api/claim/send-code/route.ts` |
| Matches Live | Family activates Matches | `app/api/care-post/activate-matches/route.ts` |

### MedJobs (Cron + Event-triggered)

| Email | Schedule/Trigger | File |
|-------|-----------------|------|
| Student Profile Nudge | Daily 10 AM CT (<70% complete, 48h+ old) | `app/api/cron/medjobs-nudge/route.ts` |
| Provider Candidate Digest | Weekly Mon 8 AM CT | `app/api/cron/medjobs-digest/route.ts` |
| Application Confirmation | Student applies to provider | `app/api/medjobs/apply/route.ts` |

### Admin

| Email | Schedule | File |
|-------|----------|------|
| Daily Digest | Daily 8 AM CT | `app/api/cron/daily-digest/route.ts` |

### Email Infrastructure

| File | Purpose |
|------|---------|
| `lib/email.ts` | `sendEmail()` — Resend API wrapper, fire-and-forget safe |
| `lib/email-templates.tsx` | All family/provider email templates + layout helpers |
| `lib/medjobs-email-templates.tsx` | MedJobs-specific templates |

### Anti-Spam Guards

- **One-shot flags**: Metadata fields like `go_live_reminder_sent` prevent re-sending
- **Priority waterfall**: Family nurture sends max 1 email per family per cron run
- **Time windows**: Each email has minimum account age before triggering
- **Connection checks**: Batch-fetched to avoid per-family queries
- **Provider query cache**: Same city/state/careTypes only queried once per cron run

---

*Last updated: 2026-03-21*
