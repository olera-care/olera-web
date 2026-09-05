# Marketplace Liquidity Layer (2026-08-18)

The operational layer under the ratified Aims 2–3 architecture: how enough family,
provider, and student activity is created in each county for the three products to get
a fair test. Built from the existing RS, the codebase, and preliminary evidence.
Companion: `provider-flowmap.html` (the pipeline), `aim2-aim3-simplified.md`.

## 1. What the existing RS already provides (recovered, not invented)

**The passive/active distinction exists** and is well-formed:

- *Passive (already operating, verified in codebase):* organic search into benefits
  screening, care guides, provider pages, caregiver community (15,530 visitors in July
  2026); family-demand-driven provider arrivals ("providers also arrive on their own
  when a family asks about their organization" — Task 2.3A); claimed-base growth
  (≈150/month); ≈2,400 family leads/month already flowing to providers.
- *Active family channels (Task 1.3A):* paid media (search + social), partnerships
  (Area Agencies on Aging, Alzheimer's Association chapters, caregiver creators),
  direct outreach (email, phone, events, webinars, PR) — each under a set budget,
  fixed window, and stated decision rule; channels graduate at or below their cost
  ceiling or close.
- *Active provider channels (Task 2.3A):* national brand and association
  relationships, business-line calls, paid digital, conferences, direct mail for
  high-value accounts; activations tagged by source/county/wave.
- *Active student channels (Task 2.3A):* campus advisors, health-professions
  organizations, digital outreach — and the codebase already runs a student-outreach
  engine (cadences, seasonal logic, 48 curated universities) plus the provider
  outreach engine with day-level attribution.

**Market selection logic exists (Task 1.3A)** and is exactly the three-sided density
argument: counties ranked on (1) existing family arrivals, (2) provider count,
(3) aid generosity under state rules, (4) campus proximity. Two sides of demand and
the workforce side, plus the benefits engine's fuel.

**Verdict on Logan's conceptualization:** correct, and already the intended design.
The change needed is presentation, not invention: the RS should say plainly that
Aim 1's family funnels and Task 2.3's provider/student acquisition are the
*marketplace build* — the operational infrastructure the products are tested inside —
and the research cohort sits within that marketplace rather than creating it.

**Acquisition is operations, not a human-subjects experiment — confirmed.** The
current text already treats it that way: budgets, windows, ceilings, decision rules —
business discipline, no HS protocol. Two nuances keep it rigorous without making it a
study: acquisition *cost* is a measured input (it feeds the plausibility gate and
Aim 3 CAC), and the pre-registered channel decision rules are what make the spending
auditable. "Which channel wins" is answered by cost accounting, not hypothesis tests.

## 2. Product prerequisites — worked backward from the endpoints

Ordering discovery: the three products differ sharply in how liquidity-hungry they
are, and the order matches their build maturity — which turns sequencing into one
coherent story.

**Visibility/Boost — least demand-constrained.** Endpoint: attributable qualified
inquiries. Two fuel sources: platform family traffic (passive + Aim 1 active) *and*
external ad platforms (Google/Meta/Nextdoor — budget-limited, not Olera-traffic-
limited; Managed Ads already operates this way). Baseline: ≈2,400 leads/month across
≈725 claimed providers ≈ 3+ leads/provider/month nationally *before* any
concentration — already near plausible endpoint rates. Prerequisite: an eligible
provider (complete profile) in a county with baseline family search activity, plus ad
budget. Fair test available earliest.

**Staffing — campus-constrained, county-specific.** Endpoint: hire + first verified
paid shift. Chain: hires ← qualified candidates per vacancy (pilot: 900 applications
→ 100 accepted → 25 placed at one campus in 8 months [pilot-record numbers to be
confirmed]) ← activated campus pipeline + providers with declared vacancies. One
campus supplied one county in the pilot; campus proximity is therefore a
market-selection criterion with load-bearing weight, and Staffing is evaluated in the
subset of counties whose campus pipeline is activated. Prerequisites: campus partner
engaged and application flow started; providers declare vacancies at activation (a
small product feature to add).

**Conversion — most demand-constrained.** Endpoint: admission/service start from a
tracked lead. A provider needs sustained inquiry flow (from any source, including its
own marketing) for the workflow to have material — at plausible inquiry→admission
rates, roughly tens of leads per evaluation window per provider. This is where Aim 1's
concentration is load-bearing. Prerequisite: providers with live inquiry flow, which
means counties where family funnels have been running. Conversion is validated last
for two reinforcing reasons: it is built during the award, and it needs the demand
density Aim 1 spends Year 1 creating. Say both.

**"Enough activity," operationally:** expressed as per-provider eligibility
conditions (already in the design: complete profile / declared vacancy + campus /
live inquiry flow) plus per-county infrastructure conditions (family funnels running;
campus activated where applicable). A county is "ready for product X" when its
infrastructure condition holds — **not every county needs all three sides at equal
maturity**, and the RS already implies this for Staffing. Numeric floors are set from
baseline data, not invented: county-level lead counts, search volumes, and claiming
rates are pullable from the analytics now, and the pre-award market-selection
analysis should be run on real data. <!-- TBD: liquidity floors, from baseline pull -->

## 3. The three numbers, separated (and why sampling gets easier)

1. **Marketplace population** — everyone using CareNavigator in the 12 counties
   (families, providers, students). Liquidity requirements bind here. Built by
   operations; measured operationally.
2. **Product users** — providers (and students) who activate each product. These are
   observed, not recruited: the operational denominators for value rates. Expected to
   reach hundreds of provider accounts across counties by mid-award.
3. **Human-subjects cohort** — the ~30–40 consented never-user providers + student
   research participants + interviewees. Statistical needs bind only here, and they
   are modest (estimation + qualitative saturation).

This is the standard population / exposed / sampled distinction; it is compatible
with Qiping's person-vs-account separation and her "market as reporting stratum," and
it means marketplace volume and research sample size are different problems with
different owners — operations builds the first, the protocol sizes the third.

## 4. Geography: why counties, why twelve, how sequenced

- **Why a county:** care is delivered and staffed locally (families choose within
  driving distance; labor markets are local); the database, SEO pages, and
  market-diagnostic tooling are already organized county/city-wise; a county is small
  enough to saturate with bounded spend and large enough to hold the CP's ≈25–50+
  addressable providers.
- **Why twelve:** the number is driven as much by Aim 3 as Aim 2 — pricing conditions
  are assigned across matched *counties* (the cluster unit), and twelve is the
  cluster count that design needs; it also provides the family-demand variation the
  cross-side liquidity analysis requires, within operational capacity. Surface this
  justification — it currently lives only inside Aim 3's methods.
- **Selection:** the four existing criteria, applied to real baseline data
  (county-level family arrivals, provider counts, aid generosity, campus proximity) —
  an analysis worth running before submission so the criteria are demonstrated, not
  asserted.
- **Sequencing:** counties open in waves (existing design). Within a county the
  build order is: family funnels + provider claiming first; campus activation where
  applicable; product evaluations turn on as their prerequisites become true; the
  research cohort enrolls in counties whose infrastructure is live (cohort waves
  follow market waves). The 18-market question (12 + ~6 paid-first) remains an open
  reconciliation item and is unaffected by this layer.

## 5. Student safety: the smallest defensible architecture

**The claim we actually make (and should state as such):** a *structural* claim, not
a clinical one — students never go directly to families; they enter employment with
licensed providers who interview, hire, train, credential, insure, supervise, and
deploy them, so care-delivery safety obligations sit exactly where state licensure
and employment law already enforce them. Olera is a recruiting and matching conduit;
it does not deliver care and does not certify clinical competence.

**Preliminary support:** the pilot operated this model through franchisees of four
national brands (placements confirmed from the pilot record — numbers pending Logan's
consolidation; if the record contains incident data, cite it; if not, claim nothing
about incidents).

**Division of responsibility, stated plainly:** Olera — eligibility screening
(student status, work eligibility), matching, timestamped verified-hours records, and
platform conduct rules. Provider/employer — background checks per its licensure,
training, supervision, insurance (workers' compensation and liability), and all care
delivery.

**What Olera still monitors (minimal, operational, not research endpoints):**
(1) at placement, an attestation that the employing provider is licensed and will
train, supervise, and insure the student per its licensure; (2) a passive incident
channel — any safety incident reported to Olera involving a placed student is logged
and reviewed as quality assurance; (3) within the *research* layer only, standard
IRB adverse-event/distress procedures for research procedures (surveys, interviews),
plus supervision-adequacy items in the student experience survey as implementation
outcomes feeding product improvement — not safety endpoints.

**Students' dual role, kept explicit:** as workers using the product they are
operational users; as survey/interview participants they are human subjects with
consent — and the existing protections stay verbatim in spirit (compensation not
contingent on hiring; withdrawal does not affect placement; responses never shared
with employers).

**What a skeptical reviewer expects, and gets:** who does background checks (the
licensed employer, per state requirements); what happens if a student is harmed or
harms (employer insurance and licensure obligations; Olera's incident log); contact
with a vulnerable population (only through licensed care under employer supervision);
and evidence the model has operated (the pilot). What we do **not** do — and should
say once, confidently — is convert a commercialization study of a staffing product
into a clinical safety trial the design does not need and could not power.

## 6. Genuinely missing (small list)

1. County-level baseline activity analysis from real data (leads, searches, claims by
   county) — to select/justify the 12 and set liquidity floors. Pullable now.
2. Provider vacancy declaration at activation (small product feature; Staffing
   eligibility needs it).
3. Placement attestation + incident log (small operational features).
4. The market-entry sequencing stated as a one-paragraph playbook in the RS
   (currently implicit across Tasks 1.3/2.3).
5. Liquidity floor numbers — TBD from the baseline pull, with the biostatistician.
