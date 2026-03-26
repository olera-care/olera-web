# Plan: Provider Pricing Strategy & Disclaimers Overhaul

Created: 2026-03-23
Status: Not Started
Notion: [Task](https://www.notion.so/Provider-Pricing-Strategy-Disclaimers-Overhaul-32d5903a0ffe8076b473df7f96d02937)

## Goal

Replace the one-size-fits-all pricing display with a category-aware system that shows estimates where appropriate, leads with coverage education where prices are misleading (nursing homes, hospice), and uses free public data to fill the gap left by 33K providers with no pricing data.

## Context & Problem

- **33K seeded providers have NULL pricing** — every one shows "Contact for pricing"
- **City page "Avg. Cost" badge** is calculated from near-zero sample sizes (misleading or empty)
- **Single generic disclaimer** ("Price is an estimate and may vary") applied identically across all 7 care categories, despite radically different payment realities
- **No coverage education** — a family seeing "$8,000/mo" on a nursing home has no idea Medicare covers rehab stays or Medicaid covers long-term care
- **Hospice prices shown as dollars** when the Medicare Hospice Benefit covers nearly everything
- Providers who claimed their profiles entered real data, but it's presented identically to estimates

## Success Criteria

- [ ] Each care category has a tailored pricing disclaimer appropriate to its payment model
- [ ] Nursing homes and hospice lead with coverage/payment education, not raw dollar estimates
- [ ] Provider cards and city pages show defensible regional cost context instead of "Contact for pricing" everywhere
- [ ] Provider-entered prices are visually distinguished from regional estimates
- [ ] City page "Avg. Cost" either has sufficient sample size or falls back to state-level data
- [ ] No external API costs incurred (all data from free public sources)

## Care Category Pricing Tiers

| Tier | Categories | Strategy |
|------|-----------|----------|
| **Tier 1: Estimates Welcome** | Home Care, Independent Living, Assisted Living | Show ranges with standard disclaimer |
| **Tier 2: Estimates + Education** | Memory Care, Home Health | Show ranges with payment context (Medicare, acuity notes) |
| **Tier 3: Education First** | Nursing Home, Hospice | Lead with coverage info, price secondary |

## Tasks

### Phase 1: Category-Aware Pricing Config (data layer)

- [ ] 1. Create `lib/pricing-config.ts` — central pricing configuration
      - Define `PricingTier` type and `CATEGORY_PRICING_CONFIG` map
      - Per-category: tier (1/2/3), disclaimer text, coverage notes, default unit, show-estimate boolean
      - State-level median cost ranges from public Genworth/AARP data (static JSON, ~50 states × 6 categories)
      - `getPricingConfig(category: string)` helper
      - `getRegionalEstimate(category: string, state: string)` helper
      - Files: `lib/pricing-config.ts` (new)
      - Verify: Unit test or manual import — config returns correct tier/disclaimer for each category

- [ ] 2. Curate state-level pricing data from public sources
      - Compile median cost ranges by state and care category from Genworth Cost of Care Survey (published free), AARP, and Medicare.gov
      - Structure as `public/data/pricing-by-state.json` (or inline in config if small enough)
      - Only need the 6 display categories × 50 states = 300 entries
      - Include `source` and `year` fields for transparency
      - Files: `public/data/pricing-by-state.json` (new) or inline in `lib/pricing-config.ts`
      - Verify: Spot-check 5 states against published Genworth data

### Phase 2: Disclaimer & Education Components (UI layer)

- [ ] 3. Refactor `PriceEstimate` component to be category-aware
      - Accept `category` prop (or `pricingTier`)
      - **Tier 1**: Current behavior — price + "est." + tooltip ("Costs vary based on room type, care level, and location")
      - **Tier 2**: Price + "est." + expanded tooltip with coverage note ("Many home health services are covered by Medicare. Out-of-pocket costs vary.")
      - **Tier 3 (Nursing Home)**: Reframe — "Medicare covers short-term rehab. Medicaid covers long-term care for eligible individuals." Price shown smaller/secondary
      - **Tier 3 (Hospice)**: "Typically covered by Medicare at no cost to patients" — suppress dollar estimate unless provider-entered
      - Files: `components/providers/PriceEstimate.tsx`
      - Depends on: 1
      - Verify: Visual check — each category shows its correct disclaimer

- [ ] 4. Create `PricingEducationBadge` component for Tier 3 categories
      - Small inline badge/note for nursing home & hospice cards and detail pages
      - Nursing Home: "Medicare / Medicaid may cover" with info icon
      - Hospice: "Usually covered by Medicare" with info icon
      - Designed to replace the dollar price label on cards, not supplement it
      - Files: `components/providers/PricingEducationBadge.tsx` (new)
      - Depends on: 1
      - Verify: Component renders correctly for nursing home and hospice

- [ ] 5. Add `RegionalEstimateLabel` component to distinguish provider-entered vs. regional data
      - When price is provider-entered: show as today (bold, no extra label)
      - When price is a regional fallback: show with "Regional avg." prefix + different styling (lighter, italic)
      - Files: `components/providers/RegionalEstimateLabel.tsx` (new)
      - Depends on: 1
      - Verify: Visual distinction is clear between provider-entered and regional prices

### Phase 3: Integration — Provider Detail Page

- [ ] 6. Wire category-aware pricing into provider detail page
      - Pass `provider_category` to `PriceEstimate` component
      - For Tier 3 categories, show `PricingEducationBadge` in hero instead of dollar price
      - In the pricing detail section, add category-specific footer note from config
      - If provider has no pricing but regional estimate exists, show `RegionalEstimateLabel`
      - Files: `app/provider/[slug]/page.tsx`, `components/providers/connection-card/CardTopSection.tsx`
      - Depends on: 3, 4, 5
      - Verify: Check a nursing home detail page — shows coverage info first. Check an assisted living page — shows price + standard disclaimer. Check a hospice page — shows Medicare note, no dollar amount (unless provider-entered)

### Phase 4: Integration — Cards & Browse Pages

- [ ] 7. Wire category-aware pricing into provider cards
      - `ProviderCard`, `CompactProviderCard`, `BrowseCard` — pass category through, use appropriate display
      - For Tier 3 categories on cards: show `PricingEducationBadge` instead of "Contact for pricing"
      - For Tier 1/2 with no provider price: show regional estimate via `RegionalEstimateLabel`
      - Files: `components/providers/ProviderCard.tsx`, `components/providers/CompactProviderCard.tsx`, `components/browse/BrowseCard.tsx`
      - Depends on: 3, 4, 5
      - Verify: Browse a city page — cards show appropriate pricing treatment per category

- [ ] 8. Update `formatPriceRange()` and card data transformation to support regional fallbacks
      - `formatPriceRange()` in `lib/types/provider.ts` — add optional `state` param, return regional estimate when provider has no price
      - `providerToCardFormat()` — populate `priceRange` with regional fallback + flag `isRegionalEstimate: boolean`
      - `businessProfileToCardFormat()` — same treatment
      - Add `isRegionalEstimate` field to `ProviderCardData` interface
      - Files: `lib/types/provider.ts`, `lib/profile-card.ts`
      - Depends on: 1
      - Verify: A provider with NULL pricing in Texas shows the Texas state average for its category

### Phase 5: Integration — City Pages & SEO

- [ ] 9. Fix city page average cost calculation
      - In `power-pages.ts`: require minimum sample size (n >= 5) before showing provider-based average
      - When sample < 5: fall back to state-level median from `pricing-config.ts`
      - Label appropriately: "Based on X providers in [city]" vs. "State average for [category]"
      - Files: `lib/power-pages.ts`, `app/[category]/[state]/[city]/page.tsx`
      - Depends on: 1
      - Verify: A city with 2 priced providers shows state average instead of misleading n=2 average

- [ ] 10. Add cost context to city page SEO content
      - Below the "Avg. Cost" badge, add a 1-2 sentence category-specific note
      - Tier 1: "Costs in [city] range from $X to $Y per month based on room type and care level."
      - Tier 2: "Many home health services may be covered by Medicare. Private-pay rates average $X-$Y/hr."
      - Tier 3: "Most nursing home stays are covered by Medicare (short-term) or Medicaid (long-term)."
      - Include data source attribution: "Source: Genworth Cost of Care Survey, 2025"
      - Files: `components/browse/CityBrowseClient.tsx`
      - Depends on: 1, 9
      - Verify: City page for nursing homes shows coverage context, not just a dollar figure

### Phase 6: Provider Dashboard (Portal Side)

- [ ] 11. Add pricing guidance to `EditPricingModal`
      - Show category-specific helper text in the pricing edit modal
      - Nursing home: "Note: Many families use Medicare or Medicaid. Consider listing both private-pay rates and accepted coverage."
      - Hospice: "Most hospice care is covered by Medicare. If you accept Medicare, consider noting that instead of listing a dollar amount."
      - All categories: "Accurate pricing builds trust with families. Prices are shown as estimates with a disclaimer."
      - Files: `components/provider-dashboard/edit-modals/EditPricingModal.tsx`
      - Depends on: 1
      - Verify: Open pricing modal for a nursing home — see contextual guidance

### Phase 7: Structured Data & Schema

- [ ] 12. Update JSON-LD `priceSpecification` to respect Tier 3 suppression
      - For hospice: omit `priceSpecification` from JSON-LD unless provider explicitly entered pricing
      - For nursing home: include but add `description` noting Medicare/Medicaid coverage
      - For all: ensure `unitText` correctly reflects hourly vs monthly vs daily
      - Files: `app/provider/[slug]/page.tsx` (JSON-LD section)
      - Depends on: 1
      - Verify: View page source for a hospice provider — no priceSpecification unless provider-entered

## Risks

- **Stale regional data**: State averages from Genworth are annual snapshots. Mitigate by including `year` field and displaying "2025 state average" rather than presenting as current
- **Category mismatch**: A provider categorized as "Home Health Care" might actually be private-pay only (no Medicare). The education badge could be misleading. Mitigate: phrasing uses "many" and "may" rather than absolutes
- **Visual complexity**: Adding education badges, regional labels, and category disclaimers could clutter cards. Mitigate: keep card treatment minimal (badge replaces price, doesn't add to it)
- **SEO impact**: Removing dollar amounts from hospice/nursing home structured data could reduce rich snippet eligibility. Mitigate: only suppress when no provider-entered data exists; the education content adds topical relevance

## Data Source Notes

**Free sources for state-level medians:**
- Genworth Cost of Care Survey — published annually, state-level medians for AL, MC, HH, HC, NH. Free PDFs, no API needed
- AARP Long-Term Care Cost Calculator — uses same Genworth data, publicly accessible
- Medicare.gov Nursing Home Compare — quality data (not pricing), but useful for coverage context
- State Medicaid agency rate sheets — published publicly per state

**What we're NOT using (costs money):**
- Genworth/CareScout API — real-time, zip-level data. Costs per query. Not needed for MVP
- Caring.com / A Place for Mom APIs — proprietary, licensed

## Implementation Notes

- Phase 1-2 can be done in one session (config + components)
- Phase 3-5 are the integration passes — one session each
- Phase 6-7 are small follow-ups
- Total: ~4-5 focused sessions
- All changes are frontend/config — no database migrations, no API changes
- The regional pricing JSON can start small (top 10 states) and expand
