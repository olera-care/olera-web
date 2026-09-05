# Growth System — business experiment workspace (parked 2026-08-22)

Captured from the 2026-08-22 strategy session with Logan, then parked so the CRP
sprint keeps the team's focus through 2026-09-04. Everything here is pre-revenue
hypothesis, not commitment. Nothing here changes the grant documents; where the two
worlds touch, the grant vocabulary wins (Provider Growth Suite: Staffing,
Visibility/Boost, Conversion).

## The concept

A full-funnel, done-for-you growth and intake service for eldercare providers:
we make the provider easy to find everywhere families look (Google Business
Profile, reviews, website, Olera page, managed ads, AI-search visibility), then
answer and work every inquiry in the provider's name until it becomes a booked
assessment on their calendar. One service, not a tool bundle: intake is the heart,
presence is the wrapper, and the funding check (screening every family for VA,
Medicaid, and other aid) is the differentiator no competitor can copy. "Booked
assessment" is the deliberate endpoint: verifiable, near-term, and far from any
per-client referral fee.

## Collateral (concept mocks, provider-facing)

- `collateral/growth-system-onepager.html` — the sales one-pager (v3, the ratified
  happy medium: v2's calm layout, v1's substance). Logan approved direction.
- `collateral/market-snapshot-sample.html` — the free per-provider audit that opens
  the funnel (v2, approved as-is). SAMPLE DATA watermark; all figures illustrative.
- Render either with headless Chromium print-to-PDF (Letter, zero margins; both
  verified one page).

Placeholders that need decisions before any provider sees these: product name
("Olera Growth System"), URL (`olera.care/grow` does not exist), price ($749/month,
$1,500 setup waived, 3 per market), the "answered in minutes" service level (viable
via AI first-touch text around the clock with humans in working hours), and the
AI-search-visibility bullet (thin substance today; TJ's call).

## Pricing plan (test, not belief)

First ~15 pitches in three arms: $499 / $749 / $999 per month, setup waived as
"founding market pilot," 90 days, cancel anytime. Track close rate and the spoken
objection. No performance component until attribution exists; if one is added later
it prices the booked assessment, never the admitted client.

## Funnel, grounded in what exists in this codebase

Discovery: TJ's direct provider outreach armed with real Market Snapshots; a
section on the existing `/for-providers` page plus a `/grow` landing route; a CTA
card on the provider portal's Your Market page (`app/provider/growth`), which
already shows the provider their competitive gap. CTA: "Get your free Market
Snapshot" → short form (agency, market, contact, lead sources, volume, bottleneck)
→ instant text acknowledgment → call-center callback within a day.

Reuse map: Boost (`app/provider/boost`) is the ads module; the Reviews page with
its working Request-a-Review generator is the review engine; Inbox/Connections are
the lead objects (add source + SLA timestamps in metadata); lead-outcome and
campaign-outcome pages are the reporting spine; the admin provider-fact-sheet route
is ~70% of a Snapshot generator; `growth_page_metrics` supplies "views of your
page." Genuinely new for a pilot: one tracked phone number per provider.

Quick builds when green-lit (~1 day each): the `/grow` landing + interest form; a
snapshot generator (slug in, rendered PDF out, using the collateral template); the
Your Market CTA card.

## Operating model per client

Setup month ~12-16 hours (snapshot + walkthrough, GBP cleanup, page/website
content, review engine, tracked line + form routing, intake script). Ongoing
presence ops ~2-3 hours/week (review requests and responses, GBP upkeep, ad checks,
lead-log QA, monthly report). Intake work scales with lead volume, not weeks.

Staffing split (decided 2026-08-22): a paid marketing intern (A&M pipeline,
~15 hrs/week, under Chantelle) runs presence ops for 4-6 clients and writes the SOP
as they learn; the existing call-center team plus AI first-touch owns every family
conversation, in the provider's name, with the funding screens. The intern never
answers a family in crisis. Hire the intern at first client signature, not before.
The SOP the intern produces is the service-to-software path.

## Traction census (prerequisite for target selection)

`scripts/traction-census.js` (committed 2026-08-21): top provider pages by
impressions/clicks/users over a trailing window, top markets by attention and by
180-day inquiries, and concentration statistics, from `growth_page_metrics`,
`connections`, `business_profiles`, and `olera-providers`. Read-only; needs
`.env.local` Supabase credentials (absent in remote Claude containers). Run
`node scripts/traction-census.js --json census.json` locally, or add the two env
vars to the Claude environment. Interpretation rule: split attention pockets into
evaluation traffic (branded queries: sell presence, enrichment, analytics) versus
discovery traffic (non-branded rank: demand framing is honest there).

## Strategy taxonomy from the session (for the record)

1. Monetize now with existing assets: price the built review generator; enrichment
   and verified profiles sold against top-attention pages (verify facts free, sell
   depth; payment never touches ranking); pending-inquiry rescue as the Conversion
   demo; per-provider "who is evaluating you" reports as the door-opener.
2. Where the census finds liquidity: Boost priced per market; activating the built
   Outreach/Matches loop; enrichment with measurable before/after.
3. Traction-independent: this Growth System; an after-hours eldercare intake line
   (call center as product, ~$200-500/month); tour/assessment booking widget for
   the provider's own site (OpenTable pattern); Olera Sites (website generated from
   the structured profile); funding qualification of the provider's existing
   pipeline (benefits engine as B2B revenue front-end, the Phreesia pattern);
   Staffing and Managed Ads (established roadmap).
4. Later: franchisor network-telemetry dashboards; data licensing; AI answer-engine
   data layer; anything transaction-shaped.
5. Rejected: the $1-5 page-claiming fee (all barrier, no business: taxes the claim
   funnel that feeds the upsell engine, contradicts the open-marketplace hypothesis,
   and the engagement signal it buys already exists in activity telemetry).

## Relationship to the CRP

None of this requires touching the grant. If the service works, it is evidence for
the Commercialization Plan and consistent with the commercial hypothesis (premium
provider tools, never payment for referrals). Semantic note: "Growth System" is a
sales-collateral name; grant vocabulary remains Provider Growth Suite with exactly
three products.
