# Aims 2–3 as One Commercialization-Learning System (2026-08-17)

Architectural proposal preceding the Aim 2 line-by-line pass. Decision needed: the
Aim 2 → Aim 3 transition architecture (§5). Everything here respects the settled
decisions in README §5–6 and the truthfulness rule.

## 1. The one-reading answer

*What do we learn in Aim 2 that we do not know today, and how does Aim 3 use it?*

> Today we do not know whether the Growth Suite's products create enough measurable
> value for providers, or which ones do. **Aim 2 answers that:** it deploys the Suite
> free across ~80 providers in twelve markets and measures, product by product, whether
> providers who are eligible for and use each product reach its value endpoint — hires
> made, qualified inquiries generated, admissions converted — and keep using it.
> **Aim 3 takes the products that delivered value and answers the only remaining
> question:** will providers pay more for them than they cost to sell and serve —
> measured under real billing at experimentally set prices, with retention and unit
> economics rebuilt by an independent CPA.

Aim 2 = value. Aim 3 = money. The decision point between them assigns each product a
**readiness state**, and Aim 3's pre-registered second pricing round catches late
maturers, so no product's weakness can stall the study.

## 2. Product component maturity (codebase-verified, 2026-08-17)

| Product | Component | Reality in repo | Maturity |
|---|---|---|---|
| **Staffing** | MedJobs candidate board, application/screening, interview scheduling, placement schema, verified-hours design | `app/medjobs/*`, `lib/medjobs/*` (33 modules), migrations 019–103 | partially built — operating as free pilot; payments stubbed (`placements.ts`); marketplace surfaces flag-hidden |
| | Student outreach/recruitment engine | `lib/student-outreach/*`, SmartLead integration, crons | built & operating (admin-side) |
| | Real placement volume | not evidenced in repo; pilot records exist off-repo | pending Logan's consolidated pilot record |
| **Visibility/Boost** | Provider profiles + claiming + completeness gating | claim APIs, `lib/claim-trust.ts`, completeness scripts | built & operating (most mature system) |
| | Managed Ads: campaign lifecycle, Stripe billing, UTM attribution, delivered-lead counting | `lib/ad-boost/*` (17 modules), 11 migrations, named customer campaigns July–Aug 2026 | built & operating; campaign execution human-in-the-loop |
| | Review generation: request engine with per-provider logs, monthly counts, delivery methods, Google Business connection, review dashboards | `app/api/admin/review-requests/`, `app/api/provider/{reviews,olera-reviews,google-business}` | built & operating, admin-assisted; self-serve packaging partial |
| | Unified Visibility product (one subscription, one dashboard, shared attribution) | does not exist as a package | **CRP work: assemble + instrument** |
| **Conversion** | Lead inbox, matches/connections, lead-outcome tracking, response nudges, weekly digest, Q&A | `app/provider/*`, `app/api/provider/lead-outcome`, crons | components built & operating |
| | Intake/follow-up automation as a provider-facing product | does not exist | **CRP work: build from components, verify, then validate** |
| Free base layer | Referral network (consented family leads, free) | leads flowing (~2,400/mo per RS Fig 3), instrumented | built & operating — **not part of the paid Suite**; measured as cross-side context |

## 3. The system, aim by aim

**Preliminary work feeds in:** Staffing's paid pilot record (fees paid by franchisees of
four national brands; volumes pending consolidation); Managed Ads operating experience
with named campaigns; ~725 onboarded providers incl. ~15 Growth Suite signups; ~2,400
family leads/month; the claims/analytics instrumentation that makes measurement real.

### Aim 2 (Years 1–2)

- **Central question:** does the Growth Suite create measurable value for providers —
  and which products deliver it, for whom, at what workload?
- **Who participates:** ~80 provider accounts (owners/administrators,
  recruiters/schedulers, marketing/intake staff) and ~100 students across the twelve
  markets; interviews deliberately include non-activators and disengagers.
- **What they experience:** free access to the whole Suite after onboarding; product
  *eligibility* determined prospectively (Staffing needs a campus pipeline in-market;
  Visibility needs a claimable/complete profile; Conversion needs active lead flow);
  natural use, fully instrumented; usability sessions, field use, exit interviews.
- **What we measure:** suite-level primary — proportion of activated accounts reaching
  ≥1 product value endpoint within 90 days (with CI) plus repeat use at 60 days;
  product-level secondaries under minimum-exposure rules — endpoint rates,
  time-to-first-value, repeat use, workload (NASA-TLX for staffing/intake tasks),
  implementation outcomes (SUS, AIM/IAM/FIM); acquisition cost per activated provider.
- **Level of inference (stated honestly):** precision-targeted estimation and
  implementation evaluation — not causal efficacy, not between-product comparison.
  Enrollment sized for CI half-widths on the primary; product estimates reported with
  their achieved precision.
- **Products handled as:** one intervention, three products, eligibility-defined
  denominators, pre-registered evaluability thresholds (a product is evaluated only
  once ≥20 eligible accounts have ≥8 weeks' exposure — final numbers with the
  biostatistician).
- **Decision at the end:** each product assigned a pre-registered **readiness state** —
  *price-ready* (value floor met + demand signal + operational readiness) or
  *value-pending* (stays free, in Build-Measure-Learn).
- **Output → Aim 3 input:** the price-ready set (packaging inputs), measured value
  rates (pricing priors), the activated cohort (Aim 3's conversion cohort), provider
  acquisition costs (CAC baseline).

### Aim 3 (Years 2–3)

- **Central question:** will providers pay enough for that value to make markets
  sustainable — revenue above the cost to acquire, serve, and retain?
- **Who participates:** the conversion cohort (Aim 2 accounts) and a paid-entry cohort
  (new providers in new markets, paid terms from first contact); ~120 decision-makers
  in the willingness-to-pay survey; ~30 explanatory interviews sampled across
  non-converters, churned, retained-low-use, retained-high-use.
- **What they experience:** real billing. Price and packaging arms assigned across
  matched markets: Suite bundle plus per-product tiers built from the price-ready set.
  Round 1 prices what is ready; the pre-registered Round 2 re-tests packaging and picks
  up products that matured late.
- **What we measure:** paid conversion (primary), retention/churn (discrete-time
  survival, competing risks), revenue per account, cost to serve, CAC, LTV:CAC,
  payback, market-level sustainability threshold; cross-side liquidity (value and
  retention vs. lagged family demand).
- **Level of inference:** pre-registered experimental estimates at the market-cluster
  level, judged against pre-registered commercial bars (payback <12 months; LTV:CAC
  ≥3:1) — confirmatory where Aim 2 was estimative.
- **Products handled as:** tiers within one commercial offering. Per-product
  willingness-to-pay (Van Westendorp per line) + bundle arms; a weak product's fate is
  a packaging decision under a pre-registered rule, not a study amputation.
- **Decision at the end:** operating price and package; viable-market determination;
  the case where the model misses its bars is pre-committed for honest report.
- **Output:** the award-end evidence package — CPA-rebuilt unit economics, revenue
  quality by product, retention curves, both market-entry playbooks.

## 4. The sampling science (answers to the seven questions)

1. **Power at suite level; product level is pre-specified secondary estimation.** Yes.
   The suite-level primary carries the confirmatory weight Aim 2 can honestly bear;
   product endpoints are estimated with reported precision.
2. **Natural use, not assignment** — assignment to products providers don't need would
   manufacture non-use and destroy external validity. Exposure = eligibility ×
   activation, both recorded.
3. **Prospective eligibility, yes** — it is what makes denominators meaningful, and two
   of three gates already exist in the product (Boost's profile-completeness gate;
   Staffing's campus-catchment logic).
4. **Minimum exposure thresholds, yes** — pre-registered evaluability criteria
   (accounts × weeks × activity floor) decide *whether* a product can be evaluated,
   separating "no evidence of value" from "no evidence."
5. **Estimate, don't "prove."** Aim 2 is a value-estimation and readiness study. Proof
   language belongs to Aim 3's economics.
6. **Sequential, lightly.** Task 2.3's staged waves already are a sequential design:
   enrollment continues by wave until precision targets are met or the account ceiling
   is reached. No formal adaptive machinery needed.
7. **Formal statistical graduation gates are the wrong architecture** at n≈20–30 per
   product. Pre-registered *decision rules* (value floor + demand signal + operational
   readiness) are rigorous, transparent, and defensible; fake power invites
   methodological attack.

## 5. Three transition architectures, compared

**A. Independent product graduation (current RS).** Four (now three) modules, each with
formal bars, each graduating into Aim 3 on its own schedule.
— *Rigor:* superficially strict, statistically fragile (per-product powering with
unknown exposure). *Reviewer simplicity:* moderate-poor; three parallel tracks and an
ambiguous Aim 3 start. *Operations:* brittle; pricing waits on the slowest product.
*Commercial:* treats products as three businesses — feeds the "three companies"
concern; no bundling logic.

**B. Suite-level validation → Aim 3 prices the Suite.** One validation, one pricing
study; product evidence informs packaging only.
— *Rigor:* honest and clean. *Simplicity:* highest. *Operations:* simplest.
*Commercial:* risks pricing an offering containing a product that showed no value;
packaging arms can compensate but the design doesn't say how a weak product is handled
— the difficult case is unmanaged.

**C. Suite validation with product readiness states → packaging-first Aim 3
(recommended).** Aim 2 validates one intervention and ends by assigning each product a
pre-registered readiness state. Aim 3 starts at its planned point regardless: Round 1
prices the price-ready set (bundle + tiers); value-pending products stay free in
Build-Measure-Learn and join the pre-registered Round 2 if they mature. The Suite stays
the commercial unit; products are tiers within it.
— *Rigor:* honest inference levels; decision rules instead of fake tests; Aim 3's
existing two-cohort + two-round design absorbs it without redesign. *Simplicity:* one
sentence — "Aim 2 establishes which products deliver value; Aim 3 prices the ones that
do; a second round catches late maturers." *Operations:* robust — no product can stall
the program; calendar-anchored Aim 3 start preserves the CP's mid-Year-2 paid gate.
*Commercial:* mirrors how software is actually packaged; produces unit economics
regardless of which products carry revenue; "revenue quality by product" is itself
investor evidence.

**Recommendation: C.** It keeps B's surface simplicity while preserving A's per-product
accountability — moved from statistical gates (which the sample sizes cannot honestly
support) to pre-registered decision rules (which reviewers respect).

## 6. The difficult case, walked through under C

Suppose at the readiness decision: **Staffing clearly demonstrates value; Visibility is
promising but uncertain; Conversion misses its floor.**

- Round 1 prices Staffing and Visibility (Visibility's arms carry a wider price range
  reflecting its wider value CI); the bundle arm is Staffing + Visibility.
- Conversion remains free, instrumented, in Build-Measure-Learn; its evaluability
  clock continues. If it matures → it joins Round 2 pricing and the bundle re-forms.
  If it does not → its components (follow-up nudges, intake tooling) persist as
  retention features inside the paid tiers, and the commercial model proceeds on two
  products — with the CP's per-market revenue recomputed accordingly.
- Nothing stalls: both Aim 3 cohorts enroll on schedule, the unit-economics census runs
  on whatever is priced, and the award-end evidence package reports value and revenue
  **by product** — which is more convincing to investors than a forced three-way tie.

This is also why end-state numbers (payers, revenue, market count) stay provisional
until this architecture is ratified: per-market revenue depends on how many products
carry price and at what attach rates.

## 7. What ratifying C changes in the documents

- Aim 2: one intervention block (three products + free base layer), eligibility and
  evaluability rules, suite-level primary, readiness-state decision point. Table 1
  artwork rebuilt.
- Aim 3: essentially intact (two cohorts, Van Westendorp, arms, second round already
  exist) — reframed openings: "prices the price-ready set," packaging rule for weak
  products, calendar-anchored start.
- CP: Growth Suite described as one offering with three tiers; free-leads layer
  language already matches.
- Aims page: "each offering graduates into Aim 3 when it reaches its
  commercial-readiness endpoint" → readiness-state language.
