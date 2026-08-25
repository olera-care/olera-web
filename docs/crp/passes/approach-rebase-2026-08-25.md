# Approach re-base from first principles

Status: design proposal from Logan's 2026-08-25 instruction to re-base the Approach
rather than inherit it. Not application text. Supersedes the sequence proposed in
`approach-figure-architecture-2026-08-25.md` section 5; the Aim-to-brief map in that
file's section 2 remains the record of what the current Approach says.

Project period assumed: **June 1, 2027 to May 31, 2030.**

## 1. Two external checks that changed the design

**Clinical-trial status is a design constraint, not a compliance footnote.** NIH's
definition turns on four questions: human subjects, *prospectively assigned* to an
intervention, designed to evaluate the effect of that intervention, on a
*health-related* biomedical or behavioral outcome. All four must be yes.
(https://grants.nih.gov/policy-and-compliance/policy-topics/clinical-trials/ct-decision)
This matters because the payer evidence Logan wants points straight at health-related
outcomes. If we prospectively assign families or markets to navigation versus no
navigation and measure emergency use or institutionalization, the project becomes an
NIH-defined clinical trial, which changes the NOFO eligibility question, the review
criteria applied, and the registration and reporting burden. **Design consequence:**
every primary endpoint in the re-based Approach is operational or economic and comes
from platform, billing, and employment records; health-related outcomes are secondary,
observational, and never assigned. That keeps the answer to question 2 no.
**Must verify before submission:** whether PAR-27-098 is clinical-trial-optional,
required, or not allowed. The reviewer reference does not record it.

**Stated-preference pricing is not defensible on its own.** Van Westendorp and
Gabor-Granger are the standard B2B instruments, and the documented failure mode is
that both overstate willingness to pay relative to incentive-aligned or revealed
measures. **Design consequence:** stated preference is demoted to a range-setting
instrument in Aim 2, and the primary pricing evidence is a randomized offer-price
field experiment under real billing in Aim 3. Sources to verify before any of this
enters application prose with a citation: the specific hypothetical-bias magnitudes
reported for Van Westendorp.

## 2. The claims audit: what Figures 1 to 14 promised, and what would prove it

Every substantive claim in the figure set, and the evidence the CRP would have to
produce for it to be true. Rows marked **NEW** are claims the current Approach does
not measure at all.

| Claim (figure) | Evidence required at award end | Where it lives in the re-base |
|---|---|---|
| Unmet need drives a cascade (1) | Settled literature; nothing to prove | Cited, not studied |
| Navigation across the whole ecosystem is what breaks it (2, 5) | Care-establishment rate and time to establishment, by funding source, verified against expert review | Aim 1 |
| Providers cannot serve the demand navigation sends (3) | Decline-for-staffing rate and fill rate in study markets, and whether navigation-referred families are actually served | Aim 2 **NEW** |
| Navigation and capacity together break the cycle (4) | Establishment rate and time where the staffing pipeline is live versus where it is not | Aim 3 market contrast, observational **NEW** |
| Agents execute until care starts (5, 12) | Agreement with blinded expert panel, application error rate, follow-up reliability, outcome ascertainment | Aim 1 |
| We add workers rather than move them (5, 13) | Share of placed students with **no prior direct-care employment**, plus 90-day and 12-month retention | Aim 2 **NEW, and decisive** |
| No referral fees, so every provider is listed (5) | Structural, not empirical; assert and hold | Nothing to prove |
| Providers pay for staffing (6, 7) | Revealed conversion at randomized offer prices under real billing, retention, churn | Aim 3 |
| Institutions will pay for completed navigation (6, 7) | Not provable in three years. What is provable: linkage feasibility, measured intermediate outcomes, an actuarial value model, and signed intent | Aim 3 payer evidence stream **NEW** |
| County economics of roughly $200K at maturity (7) | Measured CAC, price, retention, cost to serve, per market, with variance across markets | Aim 3 |
| No alternative covers the whole path (8) | Our own establishment rate against published benchmarks; the coverage claim itself is structural | Aim 1, secondary |
| What remains open is operational (9) | The Aim 1 and Aim 2 results are the answer | Aims 1 and 2 |
| Each hurdle has an experiment (10) | Each hurdle's own metric | All aims |
| The database sharpens with every case (14) | Growth in records from executed cases, and measured improvement in eligibility accuracy over time | Aim 1 **NEW** |

Three of these are not measured anywhere in the current Approach, and two of them
(net-new workers, database sharpening) are the mechanisms that make Innovations 2 and
3 true. That alone justifies the re-base.

## 3. The re-based aims

The current aims are organized by **product side** (family product, provider product,
revenue model). The re-based aims are organized by **the three things that must be
true for the thesis in Figures 1 to 14 to hold**. The work inside them is largely the
work already drafted; the framing, the endpoints, and two studies are new.

**Aim 1. Establish care reliably, and prove it was established.** (Years 1 to 2)
The unknown: whether an agentic system can carry a household from screened need to
established aid or care at a quality a licensed professional would sign, and at a cost
that falls. Technical activities: build the execution and follow-up loops; blinded
expert-panel verification; IRB usability and trust validation with family caregivers;
instrumented funnel and time-driven activity-based costing. Primary endpoints: care
establishment rate, time to establishment, agent-panel agreement, application error
rate, cost per established case. New: **database learning rate**, the improvement in
eligibility accuracy as executed cases accumulate, which is the only direct test of
Innovation 3.

**Aim 2. Create capacity that did not exist, and sell it.** (Years 1 to 3)
Staffing only. The unknown: whether the student pathway produces workers who were not
already in direct care, whether they stay, and whether providers will pay. Technical
activities: verify the staffing pipeline end to end; formative and field validation
with providers and students; concentrated recruitment in anchor markets; stated-
preference pricing range-setting late in Year 1. Primary endpoints: qualified
applicants per campus-term, time to hire, **net-new-worker share**, 90-day and
12-month retention, provider fill rate, and provider value endpoint completion. The
net-new-worker share is a baseline question on the student intake form and costs
nothing to collect; without it, Innovation 2 is an assertion.

**Aim 3. Show the economics replicate and the value is bankable.** (Years 2 to 3)
Two streams under one aim, because they answer the same question from two sides.
*Stream A, the beachhead:* randomized offer-price field experiment under real billing;
unit economics with confidence intervals; retention by survival analysis; independent
CPA rebuild. *Stream B, the emerging customers:* the payer evidence package, described
in section 6. Primary endpoints: paid conversion by offer price, LTV:CAC, payback
period, per-market margin variance, and the cross-side test that provider revenue at
steady state covers the cost of serving families.

**What was dropped and why.** Three of the four provider modules (referral network,
review generation, Managed Ads) leave the Approach entirely, per Logan's instruction
that staffing is the beachhead. This removes the `[SETTLE: three or four]` marker in
the Research Strategy, aligns the Approach with the locked SPINE's insistence that the
CRP tests a narrow commercial hypothesis, and matches Figures 5 through 7, which
already show one sold product. **Consequence to accept:** the SPINE names two products
(Managed Ads and Staff Recruitment). Dropping to one requires reopening one sentence
of a locked document. Flagged, not edited.

## 4. Market design, derived rather than inherited

Markets exist in this design to do four jobs: reach the density at which connections
complete; test whether the playbook transfers; sample the heterogeneity that plausibly
changes the economics; and produce enough per-market observations to report variance
rather than a single number.

The heterogeneity that matters is not geographic, it is structural. Three axes change
the economics materially:

1. **State HCBS and waiver generosity** (high / low). Drives how much aid a household
   can secure, which drives establishment rate and the payer story.
2. **Provider density and urbanicity** (metro / small metro or rural). Drives how many
   providers exist to sell to and how hard staffing is.
3. **Health-professions campus presence** (present / absent). Drives whether the
   student pipeline can run at all.

Two levels on three axes is a 2 x 2 x 2 grid of eight cells. **Eight replication
markets, one per cell**, is the minimum that lets us say the playbook was tested where
it should work and where it should struggle, rather than only where it was convenient.
Add **four anchor markets** carrying the deep instrumentation, the IRB studies, and
the mechanism work, selected where existing family traffic and provider base are
strongest. **Total: twelve.**

Twelve now has a derivation rather than a history: 8 heterogeneity cells + 4 depth
markets. It is also the number the Aims page and CP Section 5 already carry, so
nothing needs reopening.

**What twelve does not buy, stated plainly.** Twelve markets cannot power a
market-level randomized comparison; six clusters per arm is descriptive, not
inferential, which the current Approach already concedes. That is exactly why the
price experiment moves to account-level randomization (section 5), which removes the
statistical reason to inflate the market count and lets the count be set by
heterogeneity and operations instead.

## 5. Pricing: bound by stated preference, decided by revealed behavior

**Prior evidence.** The Texas A&M pilot produced paid placements, which is revealed
behavior rather than intent, and is the strongest pricing evidence Olera has. Two
candidate structures follow from it: roughly $275 per month for unlimited hiring, or
roughly $150 per successful hire. Both are hypotheses.

**Three-stage design.**

*Stage 1, Year 1, bound the range (stated preference, cheap).* Van Westendorp in the
Aim 2 provider interviews establishes the acceptable band and the too-cheap floor;
Gabor-Granger converts a shortlist into a demand curve. Both are recorded as
range-setting instruments with their upward bias stated, and neither sets the price.

*Stage 2, Year 2, decide the structure (discrete choice).* A discrete-choice
experiment over the two structures crossed with service levels answers the question a
field experiment cannot afford to test: subscription versus per-hire, and what a
provider trades off. Modest sample, run inside the Aim 2 interview base.

*Stage 3, Years 2 to 3, decide the price (revealed preference, primary).* Randomized
offer prices under real billing, assigned **at the account level** stratified by
market and provider size, with three price points per structure. With roughly 300
accounts this yields about 100 per arm, which supports an actual test of conversion
differences rather than description. Contamination is the standard objection;
individualized quotes are normal in B2B, and the pre-registered mitigations are a
contamination monitor (did providers report comparing prices), market-level assignment
as a pre-specified sensitivity analysis, and non-adjacent market pairing.

The primary outcome is paid conversion within 60 days of offer; secondary outcomes are
retention at 6 and 12 months and revenue per account, because a price that converts
and churns is worse than a price that does neither.

## 6. Emerging customers: sell nothing, evidence everything

Logan's distinction is right and it is the sharpest new idea in this re-base:
**beachhead customers get a product tested on them; emerging customers get an evidence
package built for them.** The trap to avoid is promising payer outcomes a three-year
program cannot deliver. The honest question is not "can we prove we reduce avoidable
utilization" but "can we finish this award holding what a payer requires before it
will contract."

What a risk-bearing organization requires, in order:

1. **A measurable unit.** A defined navigation episode with a start, an end, and a
   verifiable establishment event. Aim 1 produces this.
2. **A population it can identify.** Attribution rules that match the payer's members
   to our episodes. Requires a data-use agreement, not a study.
3. **Linkage that works.** Proof that our episode records can be joined to their claims
   or encounter data at acceptable match rates.
4. **Intermediate outcomes with face validity.** Aid dollars secured, ADL and IADL
   needs closed, time to established care, share of episodes ending in established
   care, and caregiver strain on a validated instrument.
5. **A defensible value model.** An actuarial model translating those intermediates
   into expected cost impact, built on published effect sizes such as CAPABLE, with
   sensitivity analysis and stated assumptions.
6. **A first observational read.** A matched-comparison analysis, pre-registered, with
   its confounding limits stated in the same breath.

Items 1, 2, 3, 4, and 5 are all deliverable in three years. Item 6 is deliverable as a
first read, not as proof. **Nothing in this stream prospectively assigns anyone to
anything**, which is what keeps the project outside the clinical-trial definition.

**Milestone for the stream:** at least two signed data-use agreements with
risk-bearing organizations, a demonstrated linkage at a pre-specified match rate, a
delivered actuarial model, and at least one letter of intent contingent on the
evidence. That is a commercialization milestone a reviewer and an investor both
recognize, and it is honest about what three years can buy.

**Boundary flag.** `docs/crp/CLAUDE.md` records the Qiping boundary: care established
is operational telemetry, never a clinical endpoint. This stream stays inside that
boundary for primary endpoints but deliberately builds toward clinical and economic
outcomes as secondary observational measures. That is an extension of the boundary and
needs Logan and Qiping to ratify it before it enters the Research Strategy.

## 7. The timetable, built backward from May 31, 2030

What must be true at the end, and what each requirement forces:

| Must be true on 2030-05-31 | Forces |
|---|---|
| Analyst-verified unit economics with retention measured, not modeled | Paid conversion begins no later than Q2 of Year 2 (autumn 2028), giving 18 to 20 months of billing history |
| LTV from restricted mean survival at 12 months | Every account in the primary analysis is enrolled by mid Year 3 |
| Per-market margin variance across the heterogeneity grid | All 8 replication markets open by end of Year 2 |
| A price decision the company operates on | Field experiment runs Q2 Year 2 through Q1 Year 3 |
| Payer evidence package with a first observational read | Episode cohort accrues from Q1 Year 2; data-use agreements signed by Q4 Year 2 |
| Student retention at 12 months | Placements begin by Q3 Year 2 at the latest |
| Investor package assembled and reviewed | Independent rebuild Q3 Year 3, package Q4 Year 3 |

Which produces:

**Year 1 (Jun 2027 to May 2028), build and verify.** Execution and follow-up loops
built. Expert-panel verification (Aim 1). IRB usability and trust study. Four anchor
markets open, two by Q2 and two by Q4. Staffing pipeline verified end to end and live
in anchors; first student cohorts placed. Formative provider and student validation.
Stated-preference pricing instruments run in Q4. **Gate at month 12:** agent-panel
agreement, application error rate, SUS and trust bars, staffing path completes.

**Year 2 (Jun 2028 to May 2029), replicate and price.** Eight replication markets open
in two waves, Q1 and Q3. Paid conversion opens Q2 with randomized offer prices.
Discrete-choice structure experiment Q1. Episode cohort accrues for the payer stream;
data-use agreements negotiated and signed by Q4. Field validation of the staffing
module at volume. **Gate at month 24:** value endpoint and repeat-use bars, at least
one provider and one student channel at or below ceiling, conversion measurable at
every price arm, playbook executed as written in replication markets.

**Year 3 (Jun 2029 to May 2030), prove and hand off.** Retention and churn mature.
Cross-side test computed. Independent CPA rebuild Q3. Actuarial value model and first
observational read Q3. Investor evidence package Q4. **Final gates:** payback under 12
months, LTV:CAC at least 3:1, margin at or above the derived sustainability threshold,
provider revenue covering the cost of serving families, and the payer package
delivered with signed intent.

## 8. Proposed figure sequence, 15 onward

| # | Title | Question it answers | Format |
|---|---|---|---|
| 15 | So What Would Actually Prove It? | Which claim from Figures 1 to 14 needs which evidence, and which aim produces it? | Claim-to-evidence ledger, three columns, with the three unmeasured claims marked |
| 16 | Three Aims, One Chain of Evidence | How do the aims depend on each other and what does each de-risk? | Dependency diagram with graduation gates |
| 17 | Aim 1: Can Care Actually Get Established? | Unknown, activity, measure, threshold, uncertainty removed | Five-beat band per task, thresholds as numeric chips |
| 18 | Aim 2: Can We Create Capacity, and Will Providers Buy It? | Same five beats, staffing only | Same template; net-new-worker share given its own row |
| 19 | Aim 3: Do the Economics Hold, and Do They Replicate? | Same five beats | Same template; two cohorts as the contrast |
| 20 | Twelve Markets, Chosen So the Answer Generalizes | Why twelve, and which twelve? | The 2x2x2 heterogeneity grid plus four anchors |
| 21 | What Providers Will Pay, Measured by What They Do | How is price determined without trusting stated intent? | Three-stage funnel: range, structure, revealed price |
| 22 | While We Sell Staffing, We Build the Payer Case | What do emerging customers get if we sell them nothing? | Six-item readiness ladder, each tagged deliverable or open |
| 23 | Every Gate Has a Number, and a Move If We Miss | What do success and failure mean numerically? | Gate ladder: metric, threshold, pre-committed consequence |
| 24 | Three Years, and When Each Answer Arrives | Sequencing, dependency, decision timing | Swimlanes across twelve quarters with decision diamonds |
| 25 | What Olera Owns on May 31, 2030 | What exists that did not before? | Inventory tagged by producing aim, mapped to Figure 7 revenue lines |
| 26 | No FDA Pathway Stands in the Way | What regulation applies? | Smallest figure in the set: decision path plus what does govern |

## 9. Decisions required before Figure 15 is drawn

1. **Ratify the re-based aims** (section 3), or reject and keep the current three.
   Reopening the Aims page is required either way if the product count changes.
2. **Staffing only** removes two provider products the locked SPINE names. Confirm.
3. **The payer evidence stream** extends the Qiping boundary. Needs Logan and Qiping.
4. **Clinical-trial status of PAR-27-098** must be verified. The whole endpoint
   architecture in section 3 is built to keep the answer no, but the NOFO language
   should be read directly.
5. **Figure 7's beachhead price** should move to the pricing hypotheses in section 5
   (about $275 per month or about $150 per hire) rather than the $100 or $200 debate,
   since those come from the actual pilot.
