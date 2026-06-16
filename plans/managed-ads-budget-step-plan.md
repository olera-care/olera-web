# Managed Ads — Budget Step + Lead Estimate (spec, v1)

**Status:** spec for sign-off. No code yet.
**Branch (when we build):** off `staging`.
**Context docs:** `app/managed-ads-terms/page.tsx` (the governing terms — read first), memory `project_managed_ads_positioning`, `project_engagement_reframe`.

---

## 1. Goal

Add a **budget step** to the Managed Ads request flow (`/provider/boost`) that:
- captures a **non-binding intended monthly budget** (no charge — Stripe stays inert; concierge confirms before any spend, per the terms),
- shows an **honest lead/reach estimate** that scales with the budget,
- tells the truth structurally — *visibility is cheap, real leads need real spend* — without a lecture,
- stays light, concrete, and on-brand (Airbnb/Apple restraint).

**Audience:** the next cohort. The current pilot provider stays on the white-glove concierge conversation; we recalibrate the estimate model from her real numbers.

---

## 2. The honesty model (the heart of it)

The budget control itself carries the message. As budget rises, the estimate **shifts from reach language → lead language**. The low end never promises leads — it promises visibility. Lead numbers only appear, and only get confident, higher up.

**Fixed stops** (no free slider — calmer, concrete, each stop has pre-written copy):

| Budget | Estimate copy (right-rail summary) | Tone |
|---|---|---|
| **$50** *(on us)* | "You're live. Local families start seeing your page." | Reach — **no lead count** |
| **$150/mo** | "A few inquiries a month — enough to learn what families respond to." | Modest, lumpy |
| **$300/mo** | "Roughly 2–5 inquiries a month." | Estimated range |
| **$600+/mo** *(Recommended for steady leads)* | "Steady, consistent inquiries — the level most agencies run for real flow." | Confident |

**The one honest line** (under the stops — factual + social-proofed, not a warning):
> "Your first $50 is on us to get you live. Steady inquiries really begin around $600/mo — that's where most agencies run for consistent leads."

**Caveat (shown once, near the estimate):**
> "Estimate — actual results vary with your market, budget, and how fast you respond. We'll show you exactly what your campaign delivered."

This caveat is the verbatim bridge to the **existing live `delivered` counter** ("N families reached out so far") — the truthful payoff that justifies not promising leads upfront.

---

## 3. The estimate numbers (researched — see §9 for sources)

**Category truth:** non-medical home care is *local personal-services* economics, **not** assisted-living facilities. Facility CPLs ($250–$700) do **not** apply.

- Home-care **search CPC**: ~$6–$18 (competitive metros).
- Home-care **CPL**: $40–$300; optimized best case $40–$55; realistic effective ~$80–$150 (real agencies spend $4–8k/mo for 30–60 leads → ~$100–150 effective CPL).
- **Click→lead conversion**: 8–15% (and it happens on the Olera page — page completeness *is* the conversion rate, which is why the 70% gate matters).
- **Two honesty pressures, both push us to under-promise:** (1) $50–$300 are *micro-budgets* — an order of magnitude below the ~$1,500/mo "minimum viable," so they run at the *worse* end of CPL with lumpy volume; (2) conversion on the provider page is unmeasured. → use a **conservative planning band of ~$80–$150 CPL** and widen ranges.

**All numbers live in one tunable constants file** (`lib/ad-boost/estimate.ts`) so the pilot's real spend→`delivered` ratio replaces the benchmark band with zero UI change:

```ts
// lib/ad-boost/estimate.ts  (illustrative)
export const BUDGET_STOPS = [
  { value: 50,  label: "$50",  note: "on us" },
  { value: 150, label: "$150" },
  { value: 300, label: "$300" },
  { value: 600, label: "$600+", note: "Recommended for steady leads", recommended: true },
] as const;

export const STEADY_LEADS_THRESHOLD = 600;
// Conservative planning band; recalibrate from pilot delivered/spend.
export const PLANNING_CPL = { low: 80, high: 150 };
// Per-stop copy lives here too, keyed by value, so estimate text is data not JSX.
```

---

## 4. Flow shape (light multi-step, Airbnb pattern)

Keep the existing two-column skeleton (action spine left, sticky "Your campaign" summary right). Add budget as a step, with a breadcrumb and one decision per screen:

```
Step 1 — Timing & channel   (exists: week picker + Google/Meta/both)
Step 2 — Budget             (NEW: fixed stops + estimate + honest line)
Step 3 — Review & confirm   (summary of week/channel/budget; "$50 on us";
                             "no guaranteed results" reassurance; confirm CTA)
```

- Breadcrumb top (Airbnb `1 Timing › 2 Budget › 3 Confirm`), Back + one primary action per step.
- The right-rail **CampaignSummary accumulates** (Launch week → Channel → Budget → live estimate). Source of truth, fills in as they go.
- **"No charge yet"** reassurance under every CTA (already the pattern). Confirm step CTA: "Request my campaign".
- Mobile: stacks; summary collapses to a one-line live confirmation above the CTA (existing pattern).
- **Standing-order interplay:** under 70% still queues as `pending_profile`; budget is captured regardless (non-binding) and surfaced to concierge at promotion. Budget step shows for both eligible and queued paths.

---

## 5. Data model

Migration **`108_ad_campaign_budget.sql`** — extend `ad_campaign_requests`:

```sql
ALTER TABLE ad_campaign_requests
  ADD COLUMN IF NOT EXISTS intended_monthly_budget INTEGER;  -- whole dollars; NULL = not chosen
-- Optional, deferred: intro_credit_applied BOOLEAN DEFAULT false (the $50). Not needed for v1 capture.
```

- **No payment columns, no charge.** Intended budget only. Stripe stays inert.
- `intended_monthly_budget` seeds the concierge conversation; concierge confirms before spend (terms §4).

---

## 6. API

`app/api/provider/ad-boost/request/route.ts`:
- **POST**: accept optional `intendedMonthlyBudget` (validate: integer, in the allowed stop set `{50,150,300,600}` — reject arbitrary values to keep it concrete). Persist to the new column. Non-binding; does not gate anything.
- **GET**: return `intended_monthly_budget` on the `request` object so the in-motion / pending states can echo the chosen budget.
- **Slack**: include the intended budget in the concierge alert (both the immediate `requested` ping and the `launchReady` auto-promotion ping) so ops knows the budget to confirm.

---

## 7. Taste pass (surgical edits — now that screens are known)

**Thesis:** a calm, three-beat request flow that feels like Olera quietly handling the hard part — not an ad-platform console. Less UI, honest microcopy, one decision per screen.

1. **Budget = fixed stop cards, not a slider** — 4 cards in a row (mobile: 2×2 or stack), selected = teal ring on white (match the channel picker exactly; reuse its component if practical).
2. **The recommended stop gets one quiet marker** ("Recommended for steady leads") — a small label, not a badge explosion. No "BEST VALUE" sticker energy.
3. **Estimate lives in the right-rail summary, not under each card** — one calm line that updates on selection; keeps the left spine to pure choices.
4. **One honest line, one caveat line. That's the entire "you must spend for leads" message.** No bullet list of disclaimers.
5. **Type scale:** estimate line at body scale, the dollar amounts at the same weight as the week labels — no oversized pricing-page numbers (this is not a pricing page).
6. **Motion:** estimate text cross-fades (~150ms) on stop change — Telegram-responsive, not a layout jump. Reserve summary card height so it never reflows.
7. **Breadcrumb is text, not a stepper widget** — `1 Timing · 2 Budget · 3 Confirm`, current bolded. Restrained.
8. **Confirm step is the Airbnb "Confirm" beat** — summary + "$50 on us" + a single soft "No guaranteed results — here's what we measure" link to `/managed-ads-terms`, then the black CTA. "You won't be charged" underneath.

---

## 8. Discipline / guardrails

- **No guarantees.** Estimate copy is ranges + the caveat, never a promise of a specific number (terms §5 "No Guaranteed Results"). The $50 stop shows **no lead count**.
- **No charge in v1.** Intended budget only; concierge confirms (terms §4). Do not build a checkout.
- **Reuse, don't invent.** Channel-picker component for budget stops; existing CampaignSummary; existing `delivered` counter for the payoff. No new event enums needed (budget rides on the existing `managed_ads_requested` event metadata — add `intendedMonthlyBudget` to its payload; no DB CHECK migration for events).
- **Tunable.** Band + stops + copy in `lib/ad-boost/estimate.ts`; recalibrate from pilot.
- **tsc clean, one-tsc-at-a-time.** Pre-test before commit.

---

## 9. Sources (estimate research, June 2026)

- [ClicksGeek — Google Ads for Non-Medical Home Care](https://clicksgeek.com/google-ads-for-non-medical-home-care/) — CPC $6–$18, conv 8–15%, $4–8k/mo steady.
- [Sagapixel — PPC for Home Care](https://sagapixel.com/ppc/home-care/) — CPL $40–$300; optimized $40–$55; ~$1,500/mo typical start.
- [WordStream 2026 Google Ads Benchmarks](https://www.wordstream.com/blog/2026-google-ads-benchmarks) — Personal Services CPL $54.60; Home & Home Improvement CPL $90.92.
- [LocaliQ 2025 Home Services Benchmarks](https://localiq.com/blog/home-services-search-advertising-benchmarks/) — CPC $7.85, CVR 7.33%, CPL $90.92.
- [LocaliQ Facebook Benchmarks](https://localiq.com/blog/facebook-advertising-benchmarks/) — FB avg CPL $27.66 (2025).
- [DigitalAnd — Assisted Living CPL](https://digitaland.co/blog/assisted-living-senior-housing-google-ads-costs-cpl-benchmarks-budgets-and-what-affects-price/) — **facility** CPL $250–$700 (excluded; wrong category).

---

## 10. Build sequence (when greenlit)

1. `lib/ad-boost/estimate.ts` — stops, threshold, planning band, per-stop copy.
2. Migration `108_ad_campaign_budget.sql` (+ apply, probe live CHECK/insert).
3. Budget step UI on `/provider/boost` (reuse channel-picker; breadcrumb; summary wires estimate).
4. API: POST accepts + persists budget; GET returns it; Slack includes it.
5. Confirm step + "$50 on us" + terms link.
6. Pre-test ×1, tsc clean, browser QA on staging-preview, then PR → staging.

## 11. Non-goals (v1)
- No payment / Stripe activation. No live CPC ingestion. No per-channel estimate split (blended Google-led; Meta noted as cheaper/softer later). No slider. No new higher tier beyond $600+ (revisit after pilot).
