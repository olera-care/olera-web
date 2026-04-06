# Plan: CTA Experimentation Infrastructure

Created: 2026-04-06
Status: Not Started
Branch: TBD (from staging, after fine-dijkstra merges)

## Goal

Build lightweight A/B testing infrastructure so we can simultaneously test multiple CTA variants on provider detail pages, measure real conversion rates, and iterate fast without being emotional about what works.

## Context

From today's meeting (April 6) with Logan and Esther:
- Current: 0.44% conversion (48 connections / ~11K monthly provider page views)
- `fine-dijkstra` branch has the "Get Pricing" redesign (email-only, post-submit pricing) — needs to merge first as the new baseline
- Logan proposed: "Check Eligibility/Qualify for Services", "Check Availability", "Get Personalized Matches"
- TJ wants to test form field combos independently (email-only vs phone vs email+phone)
- Key principle: "speed and not being emotional when it comes to CTA testing"

## CTA Variants (Candidate Pool)

| ID | Copy | Form Fields | Post-Submit Flow | Best For |
|----|------|-------------|------------------|----------|
| `pricing` | "What does this cost?" | Email only | Localized pricing + funding | All care types |
| `contact` | "Get in Touch" | Name, email, phone, message | Confirmation | Baseline comparison |
| `eligibility` | "Check Eligibility" | Email only | Eligibility quiz (care needs + funding) | Skilled nursing, Medicare |
| `availability` | "Check Availability" | Email only | Availability check (days/times) | Home care |
| `matches` | "Get Personalized Matches" | Email only | 3 similar providers | Browsers, low intent |
| `pricing-phone` | "What does this cost?" | Phone only | Same as pricing | Field variation test |
| `pricing-both` | "What does this cost?" | Email + phone | Same as pricing | Field variation test |

Not all will ship at once — this is the testing menu. Start with 2 variants (pricing vs one other).

## Success Criteria

- [ ] Visitors are randomly assigned to a CTA variant on first provider page view
- [ ] Assignment persists across page views (cookie-based)
- [ ] Each connection records which variant produced it
- [ ] Impressions tracked per variant per day (CTA component mount = impression)
- [ ] Admin dashboard at `/admin/experiments` shows: variant, impressions, conversions, rate, confidence
- [ ] Can activate/deactivate variants and adjust traffic weights without code deploy
- [ ] Works for both guest and logged-in users
- [ ] No regression to existing connection flow (email, SMS, WhatsApp, Slack notifications all still fire)

---

## Architecture Decision: Keep It Simple

**Why not use a third-party tool (Optimizely, LaunchDarkly, PostHog)?**
- At ~11K monthly views, we don't need enterprise-grade feature flags
- We already have Supabase — adding another service adds complexity and cost
- We need tight integration with our connection flow (variant → connection attribution)
- We can build this in ~400 lines of infrastructure code

**Approach: Cookie assignment + Supabase tracking**
- Visitor gets a `olera_exp` cookie with their variant assignment on first visit
- CTA component reads the cookie and renders the correct variant
- On impression: increment a daily counter in `cta_impressions` table
- On connection: write `experiment_variant_id` to the connection
- Admin page queries both tables for the dashboard

---

## Tasks

### Phase 1: Database + Assignment (Foundation)

- [ ] **1. Create experiment tables in Supabase**
  - Tables:
    ```sql
    -- Experiment definition
    create table public.experiments (
      id uuid primary key default gen_random_uuid(),
      name text not null,              -- "cta-v1"
      status text not null default 'draft',  -- draft | active | paused | completed
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );

    -- Variant within an experiment
    create table public.experiment_variants (
      id uuid primary key default gen_random_uuid(),
      experiment_id uuid not null references experiments(id),
      name text not null,              -- "pricing", "eligibility"
      config jsonb not null default '{}',  -- { headline, buttonText, fields, postSubmitFlow }
      weight int not null default 50,  -- traffic weight (0-100)
      created_at timestamptz default now()
    );

    -- Daily impression counter (lightweight, no PII)
    create table public.cta_impressions (
      id uuid primary key default gen_random_uuid(),
      variant_id uuid not null references experiment_variants(id),
      date date not null default current_date,
      count int not null default 0,
      unique(variant_id, date)
    );

    -- Attribution: add column to connections
    alter table public.connections
      add column experiment_variant_id uuid references experiment_variants(id);
    ```
  - Files: Run via Supabase SQL editor (no migration files in this project)
  - Verify: Query tables exist, insert test experiment + variants

- [ ] **2. Create experiment assignment library**
  - New file: `lib/experiments.ts`
  - Functions:
    - `getActiveExperiment()` — fetch active experiment + variants (cache with ISR)
    - `assignVariant(experimentId, variants[])` — weighted random selection
    - `getOrAssignVariant(cookies)` — read cookie → return variant, or assign new one
    - `EXPERIMENT_COOKIE = "olera_exp"` — stores `{ experimentId, variantId }`
  - Cookie strategy: `SameSite=Lax`, 30-day expiry, no PII stored (just IDs)
  - Files: `lib/experiments.ts`
  - Depends on: Task 1
  - Verify: Unit test — weighted random produces expected distribution over 1000 runs

- [ ] **3. Create impression tracking API**
  - New file: `app/api/experiments/impression/route.ts`
  - POST endpoint: `{ variantId }` → upsert `cta_impressions` (increment count for today)
  - Use `on conflict (variant_id, date) do update set count = count + 1`
  - Rate limit: fire-and-forget from client, no auth required, no response needed
  - Files: `app/api/experiments/impression/route.ts`
  - Depends on: Task 1
  - Verify: Call API, check row in `cta_impressions`

### Phase 2: CTA Variant Rendering

- [ ] **4. Create variant config schema and default variants**
  - Define the shape of `config` in `experiment_variants`:
    ```typescript
    interface VariantConfig {
      headline: string;           // "What does this cost?"
      buttonText: string;         // "Check cost & availability"
      trustLine: string;          // "No spam. No sales calls."
      fields: ("email" | "phone" | "name")[];  // which fields to show
      postSubmitFlow: "pricing" | "eligibility" | "availability" | "matches" | "basic";
    }
    ```
  - Seed initial variants: `pricing` (current fine-dijkstra) + `contact` (old baseline)
  - Files: `lib/experiments.ts` (type definitions), SQL seed
  - Depends on: Task 1
  - Verify: Variants queryable from Supabase

- [ ] **5. Wire experiment assignment into provider detail page**
  - Read/assign variant in the provider `[slug]/page.tsx` (server component)
  - Pass `variantConfig` as prop to `ConnectionCard` and `MobileStickyBottomCTA`
  - Use `cookies()` API from Next.js to read/write the experiment cookie
  - If no active experiment → fall back to default CTA (no experiment = no regression)
  - Files: `app/provider/[slug]/page.tsx`
  - Depends on: Tasks 2, 4
  - Verify: Hard-refresh provider page twice → same variant. Incognito → may get different variant

- [ ] **6. Make ConnectionCard variant-aware**
  - Modify `useConnectionCard` to accept `variantConfig` prop
  - Use config to control:
    - Headline text (already configurable via props, may need new prop)
    - Button text
    - Which form fields render in `InquiryForm`
    - Trust line copy
  - `InquiryForm` already has email field — add conditional phone/name fields
  - Fire impression tracking on mount (once per page view, deduplicated via ref)
  - Files: `components/providers/connection-card/use-connection-card.ts`, `InquiryForm.tsx`, `ConnectionCard.tsx`
  - Depends on: Tasks 3, 5
  - Verify: Set cookie manually → see different CTA copy/fields

- [ ] **7. Pass variant ID through connection creation**
  - Add `experimentVariantId` param to `submitInquiryForm()` in hook
  - Pass it to `POST /api/connections/request` body
  - API writes it to `connections.experiment_variant_id`
  - Files: `use-connection-card.ts`, `app/api/connections/request/route.ts`
  - Depends on: Tasks 1, 6
  - Verify: Create test connection → check `experiment_variant_id` populated in DB

### Phase 3: Admin Dashboard

- [ ] **8. Build `/admin/experiments` page**
  - New files: `app/admin/experiments/page.tsx`
  - Dashboard shows:
    - Active experiment name + status
    - Table: Variant | Weight | Impressions (sum) | Connections | Conv. Rate | vs Control
    - Date range picker (default: last 14 days)
    - Statistical significance indicator (simple z-test, highlight when p < 0.05)
  - Queries:
    - `experiment_variants` joined with `cta_impressions` (sum by date range)
    - `connections` grouped by `experiment_variant_id` (count by date range)
  - Files: `app/admin/experiments/page.tsx`
  - Depends on: Tasks 1-7
  - Verify: Navigate to `/admin/experiments`, see table with test data

- [ ] **9. Add experiment management controls**
  - On the admin page, add:
    - Toggle experiment status (active ↔ paused)
    - Adjust variant weights (slider or input, must sum to 100)
    - "Add Variant" form (name + config JSON)
    - "Complete Experiment" button (freezes results, stops assignment)
  - API: `app/api/admin/experiments/route.ts` (CRUD for experiments + variants)
  - Files: `app/admin/experiments/page.tsx`, `app/api/admin/experiments/route.ts`
  - Depends on: Task 8
  - Verify: Create experiment in admin → activate → see assignments flowing

### Phase 4: Post-Submit Flow Variants (Build as Needed)

These are the actual CTA experiences. Build one at a time as we're ready to test them.

- [ ] **10. "Check Eligibility" post-submit flow**
  - New component: `EligibilityFlow.tsx` in connection-card/
  - 2-3 step quiz: care needs → funding source → eligibility result
  - Result: "Based on [care type] and [funding], this provider likely accepts your coverage"
  - Captures same data as enrichment (recipient, urgency) but framed as eligibility check
  - Files: `components/providers/connection-card/EligibilityFlow.tsx`
  - Depends on: Task 6
  - Verify: Switch variant to eligibility → see quiz flow post-submit

- [ ] **11. "Check Availability" post-submit flow**
  - New component: `AvailabilityFlow.tsx` in connection-card/
  - Ask: what days/times needed → show generic availability message + "we'll confirm with [provider]"
  - Especially relevant for home care providers
  - Files: `components/providers/connection-card/AvailabilityFlow.tsx`
  - Depends on: Task 6
  - Verify: Switch variant to availability → see availability flow

- [ ] **12. "Get Personalized Matches" post-submit flow**
  - New component: `MatchesFlow.tsx` in connection-card/
  - Show 3 similar providers (same care type, same city/state) immediately
  - Lower commitment — "we found 3 providers that match your needs"
  - Reuse similar-providers query from care report email
  - Files: `components/providers/connection-card/MatchesFlow.tsx`
  - Depends on: Task 6
  - Verify: Switch variant to matches → see provider cards post-submit

---

## Phasing Strategy

**Week 1**: Phase 1 + 2 (Tasks 1-7) — Infrastructure + variant rendering
- Ship with 2 variants: `pricing` (current) vs `contact` (old baseline)
- This alone answers: "Is the new CTA actually better than the old one?"

**Week 2**: Phase 3 (Tasks 8-9) — Admin dashboard
- Can be built while Week 1 experiment runs

**Week 3+**: Phase 4 (Tasks 10-12) — Build next variant when data from first test is in
- Only build the variant that the team is most excited about next
- Each new variant = swap into the active experiment, run for 2-3 weeks

## Risks

| Risk | Mitigation |
|------|-----------|
| Low traffic = slow statistical significance | Start with just 2 variants (50/50 split). At ~370 views/day, 2 weeks = ~5,200 per variant — enough to detect a 1%+ difference |
| Cookie blocked/cleared = re-assignment | Acceptable — slight noise, not a dealbreaker at this scale |
| Shared Supabase (staging + prod) | Prefix experiment names with env (`prod-cta-v1`). Admin page filters by env |
| New post-submit flows (eligibility/availability) are complex | Phase 4 is intentionally deferred. Start with copy + field variations only |
| Regression to connection flow | Variant system is additive — default (no experiment) = current behavior unchanged |

## Notes

- The `fine-dijkstra` branch must merge to staging first — it becomes the `pricing` variant baseline
- Consider adding a `cta_events` table later for funnel analytics (form_started, form_submitted, enrichment_completed) — but not in v1
- Logan's "qualify for services" vs "check eligibility" — TJ noted eligibility fits Medicare/skilled nursing better, while "fit" is better for home care/assisted living. The variant config can be care-type-aware later (Phase 4+)
- TJ's form field variation tests (email vs phone vs both) can run as separate variants within the same experiment — no special infrastructure needed, just different `fields` arrays in the config
