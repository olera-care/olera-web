# Provider Journey Context: Banners, Digests & Your Market

This document captures the provider journey touchpoints for building a unified "journey-aware" section on Your Market.

---

## 1. Dashboard Banner System (DashboardHero.tsx)

**One banner per visit** — strict priority stack, highest-matching wins.

### Priority Tiers

| Tier | ID | Trigger | Headline Example |
|------|------|---------|------------------|
| 1 | `leads` | `newLeadsThisPeriod > 0` | "3 new inquiries this month" |
| 2 | `questions` | `unansweredQuestions > 0` | "2 questions waiting for your answer" |
| 3 | `find_families_live` | `nearbyFamilies.count > 0` | "A family near you is looking for care" |
| 4 | `view_spike` | `deltaPct >= 25% AND views >= 5` | "Your page views are up 40% this month" |
| 5 | `completion:{section}` | `views >= 10 AND incomplete section` | "Add photos so families can picture your space" |
| 6A | `managed_ads` | Cold traffic (default) | "Reach families already searching for care" |
| 6B | `find_families_intel` | Every 3rd cold visit | "See who's searching in your market" |
| 6C | `completion:{section}` | Every 3rd cold visit (rotation) | Section-specific completion nudge |
| 7 | `managed_ads` | Fallback (complete + sparse traffic) | Managed ads pitch |

### Key Rules
- **Action signals (Tiers 1-4) bypass rotation** — always show immediately
- **Cold tiers rotate every 3rd visit** — localStorage counter
- **Dismissal resets daily** — non-essential banners can be X'd
- **Essential banners never dismissible** — leads, questions, nearby family, view spike

### Completion Sections (7 nudgeable)
1. `overview` — name, category, location, photo
2. `pricing` — starting price
3. `screening` — background checks, training
4. `services` — care types
5. `gallery` — photos
6. `about` — description
7. `payment` — payment methods

---

## 2. Weekly Provider Digest Email

**Schedule**: Weekdays 8 AM ET, each provider assigned one day (hash-based)

### Variant Priority Cascade

| Priority | Variant | Trigger |
|----------|---------|---------|
| 1 | `family_question` | Open question ≤30 days old |
| 2 | `leads` | New inquiries this week |
| 3 | `find_families` | Nearby published care-seeker |
| 4 | `cold_rank` | Rank-eligible + unclaimed + zero activity |
| 5 | `completion` | Claimed but missing owner story |
| 6 | `managed_ads` | No higher signal (rotated 1-in-3 weeks) |
| 7 | `referral_teaser` | Has market rank + touched market work |
| 8 | `market_rank` | Rank resolves, no higher signal |
| 9 | `weekly_digest` | Default analytics (views + trend) |

### Question Decay (Prevents Fatigue)
- **Fresh (≤30 days)**: Lead with question
- **Stale (31-89 days)**: Demoted, flows to next rung
- **Resurface (90+ days)**: Quarterly resurface

### Provider State → Digest Adaptation

| State | Digest Variant |
|-------|----------------|
| Unclaimed/cold | `cold_rank` or `managed_ads` |
| Activity signal | `weekly_digest` (tier-aware) |
| Has question/lead | `family_question` or `leads` |
| Claimed, gaps | `completion` |
| Near published seeker | `find_families` |
| Ranked in market | `market_rank` or `referral_teaser` |

---

## 3. Your Market Page (Current)

### 4 Sections
1. **Competition** — bar chart ranking by review count, self-rank overlay
2. **Referral Map & Call Sheet** — hospitals, rehab, hospice, AL, elder-law
3. **Where to Focus** — ZIPs ranked by seniors × income
4. **Playbook** — prioritized channels (reviews → community → ads)

### Data Sources
- Google Places (competitors + referral sources)
- Census ACS5 (demographics)
- Claude Haiku (place classification)
- Supabase (Olera demand)

---

## 4. Provider Journey States

Cross-referencing banners + digests, providers fall into these states:

| State | Banner | Digest | Key Signal |
|-------|--------|--------|------------|
| **Has active leads** | Tier 1: leads | `leads` | Highest priority everywhere |
| **Has questions** | Tier 2: questions | `family_question` | Direct family engagement |
| **Nearby seeker** | Tier 3: find_families_live | `find_families` | Published family need |
| **Traffic spike** | Tier 4: view_spike | `weekly_digest` (positive) | Momentum signal |
| **Traffic + gaps** | Tier 5: completion | `completion` | Convert existing traffic |
| **Sparse/no traffic** | Tier 6: managed_ads | `managed_ads` | Generate demand |
| **Has market rank** | (via rotation) | `market_rank` | Competitive positioning |
| **Working referrals** | (via market page) | `referral_teaser` | BD activity |

---

## 5. Proposed: Journey-Aware Your Market Header

### Concept
Add a top section to Your Market that:
1. Reflects the provider's current journey state
2. Surfaces the same priority signal as dashboard banner + digest
3. Creates continuity: email → dashboard → Your Market all aligned

### Potential Header Variants

| Journey State | Header Content |
|---------------|----------------|
| Has leads | "You have X families waiting — respond first, then build your market" → CTA: View inquiries |
| Has questions | "X questions waiting — families want to hear from you" → CTA: Answer questions |
| Nearby seeker | "A family in [town] is actively searching" → CTA: See their profile |
| Traffic spike | "Your visibility is up X% — here's how to convert it" → flows into market |
| Working referrals | "You've contacted X targets, Y responding" → progress bar |
| Cold/sparse | Current Your Market (no header override) |

### Implementation Notes
- Reuse `resolveHook()` logic from DashboardHero
- Same data: `greeting.newLeadsThisPeriod`, `greeting.unansweredQuestions`, `nearbyFamilies`
- Header should be dismissible (daily reset like dashboard)
- Track: `your_market_journey_header_impression`, `your_market_journey_header_clicked`

---

## 6. New Feature: Your Market Action Hub

### Overview

Enhance `/provider/market` with a focused action layer on top of the existing market analysis. The current market page (Competition, Referral Map, Where to Focus, Playbook) collapses below, accessible via "View your full market analysis ▼".

### Architecture

**Three Tabs:**

| Tab | Focus | Reuses |
|-----|-------|--------|
| **Reviews** | Request reviews, climb ranking | Competition section data, `/provider/reviews` functionality |
| **Referrals** | Work the call sheet | Referral targets from market diagnostic |
| **Ads** | Managed ads pitch | Links to `/provider/boost` |

### Tab 1: Reviews

**Purpose:** Gamify review collection, show progress toward competitors

**UI Elements:**
- "Your move this week" header
- Headline: "Three reviews from #3." (dynamic based on rank)
- Subline: "Each happy client you add climbs you toward [Competitor Name]."
- Visual: Progress indicator showing current rank → target rank (dashed circles with + icons)
- Form: Client name + Phone/email → Request review
- "or copy a link to share yourself"
- "Preview the message ›"
- Footer: "★ Goes straight to your Google page · we send it and follow up · X this week"

**Data needed:**
- Provider's current rank (from market diagnostic `selfRank`)
- Next competitor to beat (name + review count from `competitorLandscape.ranked`)
- Reviews requested this week (from `email_log` where `email_type='review_request'`)

**Existing components to reuse:**
- `SendRequestForm` from `/app/provider/reviews/page.tsx` (lines 504-1044)
  - Handles both email and link delivery methods
  - Form fields: client name, email, custom message
  - Success states with copy-to-clipboard
  - Google connection prompts
- `reviewRequestEmail()` from `lib/email-templates.tsx` for email sending
- API: `POST /api/review-requests` for sending requests
- API: `GET /api/review-requests` for fetching sent requests with status

**Reviews System Overview:**
- Two review sources: Family reviews (`reviews` table) + Guest reviews (`olera_reviews` table)
- Review requests logged in `email_log` with `email_type='review_request'`
- Matching logic: Links sent emails to received reviews via case-insensitive name matching
- Admin tracking: `/admin/reviews` shows all providers requesting reviews with counts

**New data to calculate:**
```typescript
// From market diagnostic
const selfRank = marketData.selfRank; // { rank: 6, outOf: 21 }
const competitors = marketData.competitorLandscape.ranked;
const nextCompetitor = competitors.find(c => c.rank === selfRank.rank - 1);
const reviewsNeeded = nextCompetitor.reviewCount - providerReviewCount;

// From email_log
const thisWeekRequests = await countReviewRequestsThisWeek(providerId);
```

### Tab 2: Referrals

**Purpose:** Surface the call sheet for quick action

**UI Elements:**
- Prioritized referral targets (reuse `ReferralTargets` component)
- Status tracking (to_contact → contacted → responded → referring)
- Per-target scripts and contact info
- Progress bar: "X worked · Y referring"

**Data needed:**
- Referral targets from market diagnostic
- Provider's outreach status from `market_referral_outreach` table

### Tab 3: Ads

**Purpose:** Entry point to managed ads

**UI Elements:**
- Managed ads pitch (reuse copy from `managed_ads` banner)
- Local demand number: "X families searched your area"
- CTA: "Get my launch plan" → `/provider/boost`

**Data needed:**
- Local demand from market diagnostic or provider stats
- Reuse `managedAdsPitchCopy()` for messaging

### Banner Routing (No Changes)

| Banner | Current Route | Change? |
|--------|---------------|---------|
| `find_families_live` | `/provider/matches` | **No change** - real families |
| `find_families_intel` | `/provider/market` | **No change** - already routes here |
| `managed_ads` | `/provider/boost` | **No change** - full ads experience |
| `leads` | `/provider/connections` | **No change** |
| `questions` | `/provider/qna` | **No change** |

### Urgent Items Notification

If provider has pending leads or questions, show a small notification bar at top:
> "2 families reached out · 1 question waiting" → links to respective pages

This keeps focus on proactive growth while not hiding urgent items.

### Collapsed Market Analysis

Below the tabs, add collapsible section:
- "View your full market analysis ▼"
- Expands to show the entire current market page (Competition, Referral Map, Where to Focus, Playbook)
- Collapsed by default to focus attention on the action tabs

### Tracking Events

New events to add:
- `your_market_tab_viewed` - which tab, provider context
- `your_market_review_requested` - review request submitted
- `your_market_ads_cta_clicked` - clicked through to /provider/boost

---

## 7. Key Files

### Banners
- `components/provider-dashboard/v2/DashboardHero.tsx` — priority logic
- `lib/next-best-action.ts` — section picking + copy
- `components/provider-dashboard/v2/heroDismiss.ts` — dismissal state

### Digests
- `app/api/cron/weekly-provider-digest/route.ts` — main orchestration
- `lib/providers/digest.server.ts` — helper functions
- `lib/email-templates.tsx` — email templates

### Your Market
- `app/provider/market/page.tsx` — entry point
- `components/provider/FindFamiliesMarketView.tsx` — polling + rendering
- `components/provider/market/MarketDiagnostic.tsx` — main UI
- `lib/market-diagnostic.ts` — compute logic
