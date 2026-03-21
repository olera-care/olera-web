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

### Emails Sent

| Email | Trigger | Timing | Guard |
|-------|---------|--------|-------|
| **Go Live Reminder** | Profile ≥50% complete (has care_types + city/state) but care_post not active | Account is 24-48 hours old | `metadata.go_live_reminder_sent = true` (sent once, ever) |
| **Profile Incomplete** | Profile <50% complete (missing care_types or city/state) | Account is 3+ days old | `metadata.profile_incomplete_reminder_sent = true` (sent once, ever) |

### Safety

- Each email is **one-shot** — a metadata flag prevents re-sending
- Max 500 families processed per run
- If a family qualifies for both, only the go-live reminder is sent (not both)
- Email resolved from `business_profiles.email` → falls back to `auth.users.email` via account lookup

### Key Files

| File | Purpose |
|------|---------|
| `app/api/cron/family-nudges/route.ts` | Cron handler |
| `lib/email-templates.ts` | `goLiveReminderEmail()`, `familyProfileIncompleteEmail()` |
| `lib/email.ts` | `sendEmail()` — sends via Loops transactional API |

### Future Improvements (P2)

- Evolve from one-shot to behavioral nurture sequence
- Add provider-recommendation emails ("Top providers near [city] families love")
- Add post-connection follow-up ("How was your experience with [provider]?") — builds Olera review system
- Adapt timing to user urgency signals instead of fixed account age

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

*Last updated: 2026-03-21*
