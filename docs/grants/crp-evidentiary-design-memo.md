# The Evidentiary Design for CareNavigator

**A first-principles redesign of Aims 2 and 3, worked backward from what a risk-bearing buyer must believe**

Prepared for: Olera CRP resubmission · 1 September 2026

---

## The short answer

You are right that the proposal currently slides across three claims of increasing strength without changing the evidence that supports them. The fix is not a bigger study. It is a **reallocation of the study you already planned**, plus two small additions.

Three findings drive everything below.

**1. The commercially relevant counterfactual is not "no help."** It is "the best digital self-service alternative" — which, conveniently, is your own deployed Phase IIB product. Testing agentic execution against standard CareNavigator is ethical (nobody is denied anything they can get today), operationally trivial (a feature flag at enrollment), scientifically clean (an active comparator is a *harder* test, not a strawman), and it is precisely the increment the CRP is paying for. A payer's real alternative — their existing care management — cannot be studied without their population, and that boundary is exactly where the CRP should stop.

**2. Randomizing costs you no sample size.** At ~400 analyzable episodes split 1:1, you can detect a 13.4-point absolute difference in 90-day care establishment with 80% power against a 30% control rate. Pooled across all sixteen markets (Aims 2 and 3, ~800 analyzable) you can detect 9.4 points. A lift smaller than ~10 points on a 30% base would not change a payer's decision anyway. **The N you already proposed is the right N for a randomized trial.** What changes is allocation, blinded adjudication, pre-registration, and about three months of follow-up time.

**3. The utilization study is 10–40× the CRP's scale and structurally requires a payer.** A randomized encouragement design powered on ED visits needs roughly 3,300 members in a per-protocol comparison and on the order of 11,000–37,000 routed members under intent-to-treat dilution at realistic engagement rates. Even the most favorable framing — a high-risk dual-eligible or post-acute population with a 15% relative reduction — needs ~650 members with 12 months of claims on both sides. That is not a CRP study under any redesign. It is the post-CRP proof of concept, and saying so plainly is a strength, not a concession.

So: **prove effectiveness during the CRP; model economics during the CRP; measure economics after the CRP, in the buyer's population, on the buyer's claims.** That boundary is defensible, it is what a sophisticated buyer expects to hear, and drawing it explicitly is worth more commercially than blurring it.

---

## 1. The claim ladder, made explicit

Your instinct to separate care-establishment effectiveness from downstream economic value is correct, but the ladder has more rungs than two, and the rungs matter because each one has a different minimum sufficient design.

| | Claim | Minimum sufficient design | Feasible in CRP? |
|---|---|---|---|
| **C0** | We can reach and engage families who need help | Single-arm with a defined denominator; **routed** referrals for the payer-relevant version | Yes — but only with a routed-referral stream (§6.3) |
| **C1** | Among families who engage, *N%* reach verified care establishment within 90 days | Single-arm, pre-registered endpoint, blinded adjudication | Yes — this is what you have |
| **C2a** | Agentic execution **increases** establishment relative to the best digital alternative | Individually randomized, active-controlled trial | **Yes** — and at your current N |
| **C2b** | The effect **replicates** in new markets and is not an artifact of eight counties | Pre-registered continuation into Aim 3 markets; pooled with heterogeneity test | Yes |
| **C2c** | The effect holds in populations that **look like a payer's members** | Pre-specified strata + routed-referral cohort | Partially — see §6.3 |
| **C3a** | Establishment converts **eligibility into delivered benefit dollars** | Measured inside the randomized trial | Yes — and undervalued |
| **C3b** | Establishment **reduces** avoidable utilization | Claims data, 12+ months follow-up, payer population, ~1,000–20,000 members | **No** — post-CRP |
| **C3c** | The program produces **net savings / positive ROI** | C3b plus a full cost accounting on the payer's book | **No** — post-CRP |

The application currently asserts C1 and lets the reader infer C2a and C3b. A skeptical reviewer and a skeptical payer both notice. The redesign below earns C2a–C2c and C3a inside the award, and hands C3b–C3c to a properly specified payer-sponsored study.

### The three counterfactuals

Naming these resolves most of the confusion:

- **CF-A — no assistance at all.** Unobtainable (families who reach you came looking for help), unethical to construct, and *irrelevant*: no buyer is choosing between CareNavigator and nothing.
- **CF-B — the best available digital self-service.** Obtainable today: it is your deployed, peer-reviewed Phase IIB product. Isolates exactly the increment the CRP funds. **This is the CRP's counterfactual.**
- **CF-C — the plan's existing care management in an attributed member population.** This is the buyer's true alternative. It requires their members, their care-management arm, and their claims. **This is the post-CRP counterfactual.**

Stating this three-way distinction in the Research Strategy does more work than any other single paragraph you could add. It tells the reviewer you understand the inferential limits, and it tells the payer exactly which question you are answering now and which one you are proposing to answer with them.

---

## 2. What the current single-arm design can and cannot defensibly support

### Can support

- **Descriptive rates.** The proportion of episodes reaching verified establishment; median and distribution of time-to-establishment; the distribution of terminal states (established / declined / stalled / ineligible / lost).
- **Failure-point cartography.** Where in the seven-domain pathway cases die, by program, provider type, payer source, and geography. This is genuinely novel and nobody else has it.
- **Operational performance.** Agent-execution share, authorization and denial rates by action class, escalation rate, human-touch minutes per episode, safety and correction events.
- **Unit economics.** CAC by channel, cost to serve, cost per established care event.
- **Feasibility.** That you can recruit, instrument, follow, and confirm — which is a real precondition for any POC.
- **Internal variation.** Market-to-market heterogeneity in all of the above, which supports market-selection logic.
- **Hypothesis generation.** Which case characteristics predict success, for stratifying the POC.

### Cannot support

- **Any comparative or causal verb.** "Increases," "improves," "accelerates," "reduces," "prevents," "compared with usual care." None of these are available from a single arm, and every one of them appears or is implied in the current documents.
- **Attribution to the CRP-funded work.** Aim 1 builds the Care Establishment Model, agents, and field learning; a single-arm Aim 2 cannot say any of it mattered. This is as damaging to the NIH review as it is to the payer conversation: it is possible to spend $4M and be unable to say whether the $4M did anything.
- **Any economic claim.** Not utilization, not cost, not ROI, not offset — and not even a defensible modeled claim, because the model's input parameter (the *incremental* establishment rate) does not exist without a comparison.
- **Transportability.** A rate measured in self-referred, digitally engaged, English-speaking families does not describe what happens in a plan's attributed population. This is true *even if you ran a perfect RCT*, and it is the reason §6.3 matters as much as randomization does.
- **Durability.** A 90-day establishment event says nothing about whether care was still in place at 6 or 12 months, which is what any utilization effect would depend on.

There is one more subtle problem worth naming, because it is the kind of thing that gets a study dismissed rather than debated. In the current design, the **primary need is assigned by the system**, the **outcome is ascertained by the same system** (partly through agent-initiated contact), and the **success threshold is set by the sponsor**. A payer's analytics team will see numerator, denominator, and adjudication all under one roof and stop reading. Randomization fixes the comparison; **pre-registration and blinded adjudication fix the credibility**, and they are nearly free.

---

## 3. What an institutional buyer actually requires

Work backward from the decision you are actually asking for. At the end of the CRP you are not asking a Medicare Advantage plan to cover CareNavigator. You are asking a plan's clinical-innovation, Stars, or VBC-operations team to **fund a scoped proof of concept** — typically a six-figure, 12–18-month engagement with a defined member cohort. That is a materially lower bar than a coverage decision, and it is reachable.

### Tier 1 — to take the category seriously (you already clear this)

Problem framing, demographic pressure, the GUIDE Model as purchasing precedent, published association between unmet HCBS need and acute utilization.

### Tier 2 — to fund a proof of concept (this is what the CRP must deliver)

1. **A population they can identify in their own data.** Not "families with eldercare needs." Something like: members ≥65 with a new ADL-limitation flag; members discharged to home without home health within 30 days; dual-eligibles with an HCBS waiver but no service claims in 90 days; members with a dementia diagnosis and an identified caregiver. If they cannot write the attribution SQL, they cannot pilot you.
2. **An engagement rate on a *routed* population.** This is the single most common reason navigation pilots die, and self-referred web traffic *cannot* produce this number no matter how large the study. Of 1,000 members we send you, how many reach a defined activation state, in how long, at what outreach cost? Plans have been burned by vendors reporting excellent outcomes among "engaged members" at 4% engagement.
3. **A randomized proximal effect with independent adjudication.** Pre-registered, blinded outcome assessment, intention-to-treat. They do not need a cost effect yet. They need to believe the mechanism is real and that you did not grade your own exam.
4. **Benefit and aid dollars activated.** Concrete, measurable, and — for MA in particular — immediately valuable (see §9.1).
5. **An operational and safety record.** Incident log for agent actions, member complaints, corrections, escalation rates, human-in-the-loop boundaries, the clinical-activity guardrail, and an explicit non-steering / anti-kickback posture given that navigation touches provider selection.
6. **Operational readiness artifacts.** BAA-ready posture, security review answers, data-exchange design (member roster in, outcomes out), SLAs, staffing model per 1,000 routed members, escalation paths into their care management.
7. **A transparent, parameterized economic model — presented as a threshold analysis, not an ROI claim.** More on this in §9.2.
8. **A protocol-ready POC design** with the comparison, sample size, endpoints, data flows, and analysis plan already worked out — so their team's job is to approve it, not to design it.
9. **A pricing structure they recognize**, ideally including an outcome-based component (§9.3).

### Tier 3 — to contract at scale (explicitly post-CRP)

Claims-based utilization or total-cost-of-care effect in their own population; Stars/CAHPS impact; durability at 12 months; a second site or plan.

**The honest verdict on sufficiency:** a CRP that delivers all of Tier 2 is commercially sufficient to secure a proof of concept and to support a Series A conversation framed on POC pipeline. It is not sufficient to secure an at-scale contract, and no redesign of the CRP makes it sufficient for that. Claiming otherwise is the failure mode to avoid.

---

## 4. Is a comparison group necessary?

**Yes.** Not because peer reviewers like RCTs, but because every item in Tier 2 that carries commercial weight is comparative, and because you cannot build even a credible economic *model* without an incremental effect estimate. Without a comparison, the model's central input is a number you made up.

The right question is not whether to have a comparison but **which comparison, and against what**. Here is the full option set, assessed on strength of inference, feasibility for Olera, and commercial persuasiveness.

| Design | Causal strength | Feasibility for Olera | Buyer persuasiveness | Verdict |
|---|---|---|---|---|
| **A. Randomize CareNavigator vs. nothing** | High | Very low — you cannot recruit families seeking help and give them nothing; they would leave and use the free site anyway | Low — answers an irrelevant question | **Reject** |
| **B. Randomize agentic execution vs. standard CareNavigator (active control), with delayed access at day 90** | High | **High** — feature flag at enrollment; no new recruiting; nobody denied current best offering | **High** — a conservative, non-strawman comparison against a real product | **Recommended core** |
| **C. Stepped wedge / staggered market rollout** | Moderate | Moderate | Moderate | **Reject as primary.** Eight to sixteen clusters gives poor power, secular trends confound, and it randomizes markets when the intervention is delivered to individuals |
| **D. Waitlist / delayed-start randomization** | High for speed, weaker for 90-day rates | High | Moderate–high | **Fold into B** as its implementation form (control gains full access at day 90) |
| **E. Matched historical or external controls on the primary endpoint** | Low | Moderate | Low | **Reject as primary.** There is no external population in which "verified care establishment" has ever been measured — that is the point of the innovation. You cannot benchmark a metric you invented |
| **F. External benchmarks on specific sub-outcomes** | Low, but non-zero | Moderate | Moderate as corroboration | **Adopt as supporting triangulation only** (§7) |
| **G. Within-episode task-level randomization** | High for task completion | Moderate | Low — task completion is not the commercially meaningful endpoint | **Reject** — complexity without commercial payoff |
| **H. Regression discontinuity / natural experiment** | Moderate | Low — no credible running variable or instrument | Low | **Reject** |
| **I. Randomized encouragement with IV/CACE analysis** | High | High | High | **Adopt as the analysis frame for B**, since compliance will be imperfect by design |

### Why B is the right answer, spelled out

- **It is ethically clean.** Both arms receive the nationally deployed CareNavigator, both retain full access to the human support team, and the control arm receives the full agentic system at day 90. What is withheld for 90 days is *automation*, not help. Add a pre-specified safety valve: defined escalation criteria (imminent placement, unsafe discharge, benefits deadline) immediately move a control family to full support, recorded as a crossover and analyzed by ITT.
- **It tests what NIH is buying.** The CRP funds the Care Establishment Model, the agent suite, and field learning. Design B is the only option that asks whether those things worked. It converts the Approach criterion's largest weakness into a strength.
- **It is a conservative test.** Beating your own peer-reviewed product is a much stronger claim than beating a strawman — and it means a positive result survives the obvious objection.
- **It produces a marketing asset either way.** The control arm gives you a clean, defensible measurement of standard CareNavigator's own performance, which is a number you have never had.
- **It costs no additional recruitment.**

### Known limitations of B, and how to handle them

- **Spillover through field learning.** Knowledge that agents acquire in treatment cases improves the shared data layer that control families also see. This biases the estimate **toward the null**, making a positive result conservative. Pre-specify it as a limitation, and add a sensitivity analysis using market-level enrollment order (early vs. late enrollees) to bound it. If spillover looks large, note that a cluster design would be required — and that its power cost is prohibitive at sixteen markets. Do not attempt to fix it; name it.
- **Contamination from the open web.** Control families can still use the free public site and general-purpose AI. This is realistic, ITT-conservative, and matches the counterfactual a payer cares about. Agents must be hard-gated by arm.
- **Differential ascertainment is the real threat.** If treatment families get agent-initiated confirmation calls and control families do not, you manufacture an effect. **Outcome ascertainment must be identical in both arms**: same instrument, same schedule, same number of contact attempts, administered by the Clemson team, with source-document corroboration attempted equally in both arms.
- **Unblinded participants.** Unavoidable. Blind the adjudicators — that is where blinding matters for this endpoint.

---

## 5. Recommended redesign — Aim 2

> **Aim 2 (revised): Determine whether bounded agent execution increases verified care establishment relative to standard digital navigation, and characterize where and for whom it works.**

**Design.** Pragmatic, individually randomized, parallel-group, active-controlled trial with delayed access, nested in live operations across eight county markets.

**Population.** Families initiating a CareNavigator episode in a study market, with a completed needs assessment, a caregiver or care recipient aged ≥60 with at least one ADL/IADL need, and consent to 90-day follow-up.

**Randomization.** 1:1, **after** the needs assessment is complete and the primary need is committed and timestamped. Stratified by (a) market and (b) **payer pathway** — Medicaid/LTSS-pathway, Medicare/insurance-benefit-pathway, private-pay — because that stratification is what lets a buyer reason about their own mix.

**Arms.**
- *Enhanced (treatment):* full CRP system — Care Establishment Model, agentic execution, proactive follow-up, field learning.
- *Standard (active control):* deployed Phase IIB CareNavigator — assessment, plan, benefit identification, provider matching, resource guides — plus unchanged access to the human support team. Full system unlocked at day 90.

**Endpoints.**
- *Co-primary (hierarchically tested):* (1) verified establishment of the pre-registered primary need by day 90; (2) time to establishment, compared by restricted mean survival time over 90 days with competing risks. Adding the time-to-event endpoint is worth doing — speed is likely to move more than the binary rate, and it is the outcome families and discharge planners feel.
- *Key secondary:* aid and benefit dollars activated per episode; proportion of eligible administrative actions completed without human execution; number of family-hours displaced; escalation and correction rate; 180-day durability in a subsample.
- *Exploratory (not powered, pre-labeled as such):* self-reported ED visits, hospitalizations, and nursing-home admission at 90 days.

**Adjudication.** Independent, blinded adjudication of the primary endpoint by the Clemson team against a written rubric, with dual review on a 20% sample and a reported kappa. Source-document corroboration (approval letter, service agreement, first-visit confirmation) attempted identically in both arms.

**Analysis.** ITT primary. CACE/instrumental-variable secondary using randomization as the instrument for actual agent-execution uptake — this is the estimate that describes the effect among families who will actually authorize automation, which is the one a payer should use. Pre-specified subgroup analyses by payer pathway and by baseline need complexity, reported as effect modification with interaction tests, not as separate claims. Multiple imputation for missing outcomes with a tipping-point sensitivity analysis.

**Pre-registration.** ClinicalTrials.gov plus a public statistical analysis plan locked before the first enrollment. Cheap, and it converts your endpoint from "sponsor-defined" to "publicly committed."

### Add Task 1.6 — the baseline cohort (do this in Year 1)

You cannot power the trial without knowing the control rate, and the reviewer critique correctly noted you have never measured it. In months 4–10 of Year 1, run a **prospective baseline cohort of ~150 current CareNavigator users** on the deployed product, with the same 90-day ascertainment instrument you will use in Aim 2.

This is small, cheap, and does four jobs at once: it anchors the power calculation; it validates the ascertainment instrument and adjudication rubric before they carry a trial; it gives the resubmission the baseline number whose absence is the single most quotable gap in the current Progress Report; and it produces a publishable descriptive paper. At n=150 a 30% rate is estimated to ±7.3 points, which is sufficient for planning.

Add a **blinded sample-size re-estimation** at 40% of Aim 2 enrollment, using the pooled event rate only. Standard, pre-specifiable, and it protects you if the control rate is far from 30%.

---

## 6. Recommended redesign — Aim 3

Aim 3 currently does one job (paid Staffing economics) and claims to do another (institutional evidence) that it does not do. It should do four, and one of them is new and disproportionately valuable.

### 6.1 Continue the randomization — pool, don't re-power

Run the same randomized protocol in the eight Aim 3 markets. Pre-specify the confirmatory analysis as **pooled across all sixteen markets** with a fixed-effects estimate and a formal heterogeneity test, rather than treating Aim 3 as an independently powered replication. This buys precision (MDE ~9.4 points on ~800 analyzable, versus ~13.4 on ~400) and it buys the sentence a buyer wants: *the effect was consistent across sixteen independent county markets.*

Note a structural clarification this forces, which improves the application on its own: **CareNavigator randomization runs across all sixteen markets; the free-to-paid transition applies only to Caregiver Staffing.** The current documents conflate "free validation markets" and "paid markets" across two products that monetize differently. Separating them removes a real source of reviewer confusion.

### 6.2 Randomize the Staffing price

Unrelated to the causal question but sitting right there: assign the eight Aim 3 markets to two or three price points ($175 / $250 / $325). Revenue is hires × price × markets; testing one price yields no demand curve on one of three multiplicands. This costs nothing and materially strengthens the unit-economics package.

### 6.3 Add a routed-referral cohort — the highest-value addition in this memo

This is the piece that self-referred consumer traffic can never produce, and no amount of randomization substitutes for it.

Secure one or two **non-payer institutional referral partners** — an Area Agency on Aging or ADRC, a hospital discharge-planning unit, an FQHC, a home health agency, a large employer's benefits team, or a Medicare Advantage broker/FMO. They route a *defined list* of individuals to Olera. You do not need a contract, a BAA-heavy data feed, or money to change hands; you need a denominator you did not select.

That produces the numbers a payer will ask for in the first ten minutes:

- Of *N* people routed, how many reached first contact, completed assessment, and initiated an episode? (reach and engagement)
- What did outreach cost per engaged episode, and how many touches?
- How did engagement and outcomes differ from self-referred families?

Report the routed cohort as a **pre-specified stratum** within the randomized trial. Even 150–250 routed episodes transforms the evidence package, because it converts "here is our rate among people who found us" into "here is our yield on a population somebody else defined" — which is the only version a plan can extrapolate from.

### 6.4 Recast Task 3.2 as a protocol, not a specification

"A contracting-ready evidence package and proof-of-concept specification" is too soft. Deliver an actual **POC protocol**: population and attribution logic, design, endpoints, sample size computed from CRP-measured parameters, data flows and BAA structure, timeline, analysis plan, governance, and pricing structure. A plan's team should be able to route it for approval rather than design it. Producing a protocol rather than a specification is also a much more defensible NIH deliverable.

---

## 7. Can an external or national benchmark serve as the counterfactual?

**Not for the primary endpoint.** "Verified care establishment" as you define it has never been measured in any external population — that is the innovation. There is no national rate, no registry, no survey item, and no claims proxy that shares your numerator and denominator. Any comparison would be confounded by population, definition, and ascertainment simultaneously, and a payer's analyst will say so in one sentence.

**For specific sub-outcomes, yes — as corroboration, never as effect estimation.** There are a handful of places where defensible external reference data exist:

| Sub-outcome | Available external reference | Usable how |
|---|---|---|
| Medicaid LTSS / waiver application → determination | State Medicaid determination timeliness reporting; MACPAC analyses | Compare *median days to determination* for applications your agents filed against published state timelines — same unit, similar definition |
| Medicare Savings Program / LIS / SNAP take-up among eligibles | Well-studied national participation rates | Compare *take-up among identified-eligible* families in your cohort against published take-up |
| VA Aid & Attendance processing | VBA published processing times | Same as LTSS |
| Home-care referral → service start | Industry benchmarking reports | Weakest of the set; definitions vary widely |

For any of these to be scientifically defensible you must satisfy all of: identical denominator definition; identical outcome definition and ascertainment window; documented and, where possible, adjusted case mix; contemporaneous time period; pre-registration of the comparison before you see your own data; and a sensitivity analysis over the benchmark's own uncertainty. In practice you will satisfy the first two and partially the third. **So label these as descriptive context, present them alongside the randomized estimate rather than in place of it, and never attach a causal verb to them.** Their real function is plausibility: they let a reader confirm your absolute numbers are not implausible, which is worth something once the randomized comparison has already done the causal work.

One further note on your question "could we establish the expected rate without CareNavigator?" The honest answer is that CF-A is not estimable and CF-B is. The baseline cohort (Task 1.6) and the trial's control arm give you the expected rate *on the best available digital alternative*, which is both obtainable and the more useful number.

---

## 8. Downstream utilization — measure, model, or defer?

All three, in defined proportions.

### 8.1 Measure — but only the plumbing, not the effect

Two things are worth doing inside the CRP, neither of which is powered to detect anything:

**(a) Self-reported utilization at 90 days.** Four questions appended to the ascertainment survey: ED visits, hospitalizations, observation stays, and any nursing-home or rehab admission since enrollment. Near-zero marginal cost. It gives directionality, supplies a prior for POC power calculations, and answers the inevitable "did you even look?" It must be pre-labeled as exploratory and underpowered, with no hypothesis test reported as confirmatory.

**(b) A claims-linkage feasibility sub-study (n≈75–100).** For consenting Medicare fee-for-service beneficiaries, authorize a CMS Blue Button 2.0 connection to pull Parts A/B/D claims directly, with beneficiary (or documented authorized-representative) consent. The purpose is **to prove the data pipeline works**, not to estimate an effect: consent rate, connection success rate, data completeness, claims lag, and the analytic feasibility of constructing utilization outcomes. Caveats are real and should be stated up front — FFS only, so it excludes the MA members who are your primary buyer's population; consent burden is meaningful; a 2–3 month claims lag; and the sample is far too small for inference. But demonstrating that you can lawfully assemble member-consented claims is a concrete de-risking item for the POC and something almost no navigation vendor brings to a first meeting.

### 8.2 Model — as a threshold analysis, not an ROI claim

Build one economic model, parameterized so that **every Olera-supplied input is something you measured in the trial** (incremental establishment rate, time-to-establishment, engagement rate on a routed population, benefit dollars activated, cost to serve) and **every downstream input is a cited literature value that the buyer can overwrite**.

Then present it the way an actuary will actually use it: **as a break-even threshold, not a projected return.** "Given your PMPM, your baseline ED and SNF rates in this cohort, and whatever you believe about the effect of established HCBS on utilization, here is the effect size at which our price breaks even, and here is the region of that parameter space our measured proximal effects put you in." Payer actuaries discount vendor ROI decks reflexively and respect threshold analysis, because it hands them the pen. Include a full probabilistic sensitivity analysis and publish the model's structure. Make explicit that the causal link from established care to reduced utilization is **assumed from literature, not demonstrated by Olera** — that sentence, in the model itself, buys more credibility than it costs.

### 8.3 Defer — and show why, with numbers

This is the part worth putting in the application, because it converts "we didn't do it" into "here is the arithmetic showing why it must be done with you."

Sizing a POC powered on ED utilization:

| Population and effect | Per arm | Total (per-protocol comparison) | Under ITT dilution at 30% engagement |
|---|---|---|---|
| General MA/ACO population (0.9 ED visits/yr), 10% relative reduction | ~1,660 | ~3,300 | ~37,000 routed |
| General population, 15% relative reduction | ~720 | ~1,440 | ~16,000 routed |
| **High-risk dual-eligible or post-acute (2.0 ED visits/yr), 12% relative reduction** | **~510** | **~1,030** | ~11,400 routed |
| High-risk, 15% relative reduction | ~325 | ~650 | ~7,200 routed |

Two conclusions follow, and both are design guidance rather than excuses.

First, **no version of this fits in the CRP.** Even the most favorable cell requires ~650 members with 12 months of claims on both sides, in a population you cannot assemble without a plan.

Second — and this is the useful part — **the POC is three to five times cheaper in a high-risk stratum**, which means the CRP's job is to produce the *stratum-specific* effect estimates that justify targeting one. That is exactly what the pre-specified stratification in §5 delivers. The CRP's stratified results are not a nice-to-have; they are the input that makes the POC affordable enough for a plan to say yes to.

**Recommendation: reserve the causal utilization and total-cost questions entirely for the payer-sponsored POC.** Measure feasibility, model thresholds, and specify the study.

---

## 9. Three commercial consequences worth acting on

### 9.1 For Medicare Advantage, benefit activation is a shorter path than cost offset

MA plans already purchase supplemental benefits — in-home support services, meals, transportation, caregiver supports, SSBCI — with famously poor utilization. A product that **converts benefits the plan is already paying for into services members actually receive** creates value without requiring an actuarial cost-offset argument at all. The same logic applies to Medicaid MCOs and HCBS waiver initiation, and to ACOs and care-management enrollment.

This reframes C3a from a secondary endpoint into a primary commercial claim, and it is fully measurable inside the randomized trial. It is also plausibly linked to CAHPS domains that drive Star Ratings ("Getting Needed Care," "Care Coordination," customer service), so consider adding two or three CAHPS-aligned items to the 90-day instrument. Stars movement is a currency MA plans buy on today, with a much shorter proof chain than total cost of care.

### 9.2 Sell the model, not the number

Follow §8.2. Ship the model as an artifact the buyer's team can run with their own inputs. Vendors who hand over a locked ROI number get discounted; vendors who hand over a transparent threshold model get a second meeting.

### 9.3 Outcome-based pricing partly substitutes for causal evidence

You are, uniquely, a vendor that *measures the outcome it sells*. That makes a per-verified-establishment or per-engaged-member fee structurally available to you in a way it is not to most navigation vendors. This matters more than it looks: if the plan pays only when care is verifiably established, and the price sits below their internal threshold for that event, **their exposure to the unresolved counterfactual question drops sharply**. You are no longer asking them to believe your causal claim before paying; you are asking them to believe it is worth *X* to them when it happens.

That is a real commercial answer to the evidence gap, it converts the measurement infrastructure from a cost center into pricing power, and it should appear in the Commercialization Plan's revenue section alongside PMPM. Use the CRP to collect buyer reaction to all three structures (PMPM, per-engaged-member, per-verified-establishment with an at-risk component).

---

## 10. Sample size, power, and timeline

### Power

Assuming a 30% control-arm establishment rate at 90 days, two-sided α = 0.05:

| Analyzable per arm | Total analyzable | Detectable difference at 80% power | Power for +15 pts | +13 pts | +10 pts |
|---|---|---|---|---|---|
| 150 | 300 | 15.5 pts | 78% | 66% | 45% |
| **200** | **400 (Aim 2 as currently sized)** | **13.4 pts** | **88%** | **78%** | 56% |
| 250 | 500 | 11.9 pts | 94% | 86% | 65% |
| 300 | 600 | 10.9 pts | 97% | 92% | 73% |
| **400** | **800 (Aims 2 + 3 pooled)** | **9.4 pts** | 99% | 97% | **85%** |

Read this as the reassuring result it is: **your existing enrollment target is already the right size for a randomized trial**, if you accept a minimum detectable effect of ~13 points in Aim 2 alone and ~9.4 points pooled. An effect smaller than 10 points on a 30% base is a 33% relative improvement — below that, the commercial argument weakens regardless of statistical significance. The design is right-sized rather than under-sized.

Two protections: run the baseline cohort first so the 30% assumption is empirical rather than assumed, and pre-specify blinded sample-size re-estimation at 40% enrollment.

### Timeline

The single largest timeline defect in the current plan is that no interval exists for outcome ascertainment. Randomization does not add time; the 90-day endpoint does, and it would have been needed anyway.

| Months | Activity |
|---|---|
| 1–12 | Aim 1 engineering; IRB; ClinicalTrials.gov registration; SAP locked |
| 4–10 | **Task 1.6 baseline cohort** (n≈150), instrument and rubric validation |
| 10–12 | Aim 1 technical gate; protocol finalization; referral-partner onboarding |
| 13–21 | Aim 2 accrual (8 markets, 9 months) |
| 16 | Blinded sample-size re-estimation |
| 13–24 | Rolling 90-day ascertainment; last outcome at month 24 |
| 22–24 | Aim 3 market preparation in parallel (does not require Aim 2 results) |
| 25 | Aim 2 primary analysis and adjudication complete |
| 25–31 | Aim 3 accrual (8 new markets, 7 months) with routed-referral cohort and Staffing price randomization |
| 28–34 | Aim 3 ascertainment |
| 34–36 | Pooled sixteen-market analysis; economic model; **POC protocol**; buyer package |

Aim 3 accrual compresses from nine months to seven to fit ascertainment inside the award. This is the honest version of what the current schedule already implies — the Commercialization Plan's own "six paid-month equivalents" in Year 3 concedes the compression without the Research Strategy acknowledging it.

### What this costs

No additional enrollment. Incremental cost is blinded adjudication capacity at Clemson, a dedicated trial statistician, ClinicalTrials.gov and DSMP administration, the baseline cohort, and the claims-linkage sub-study — realistically $200–300K across three years, against a $4M request. The randomization itself is a feature flag.

### One administrative consequence you must plan for

Prospectively assigning families to intervention arms to evaluate an effect on a health-related outcome almost certainly makes this an **NIH-defined clinical trial**. Consequences: the clinical-trial forms and Study Record; ClinicalTrials.gov registration and results reporting; a Data and Safety Monitoring Plan; and evaluation under the clinical-trial review criteria in the NOFO. This is manageable and the NOFO explicitly contemplates it — the scoring criteria already carry the "In addition, for applications involving clinical trials" addenda, which means reviewers are prepared to reward the design work. Budget for the administrative load, and treat the registration as a commercial asset: a registered, pre-specified trial is a materially different artifact in a payer meeting than an internal pilot report.

---

## 11. Risks of the redesign, and how to hold them

| Risk | Severity | Mitigation |
|---|---|---|
| **The effect is null or small** | High impact, real probability | Active comparator makes this a genuine risk. Mitigate with the co-primary time-to-establishment endpoint (speed likely moves more than the binary rate); pre-specify the CACE estimate; and pre-commit to publishing a null. A well-run null in a registered trial is a far better commercial position than an unfalsifiable single-arm number, and it redirects the company faster |
| **Differential ascertainment manufactures an effect** | Fatal to credibility | Identical instrument, schedule, contact attempts, and corroboration effort in both arms; blinded adjudication; report ascertainment completeness by arm |
| **Spillover through field learning biases toward null** | Moderate | Name it; bound it with an early-vs-late enrollee sensitivity analysis; accept the conservative direction |
| **Consent framing reduces enrollment** | Moderate | Simple, honest delayed-access framing: everyone gets the full system, some immediately and some after 90 days. Monitor consent rate weekly from first enrollment |
| **Withholding automation from families in crisis** | Ethical | Control arm keeps standard product *and* full human support; pre-specified escalation criteria trigger immediate crossover, analyzed by ITT |
| **Clinical-trial administrative load** | Moderate | Budget for it; Clemson already carries IRB and protocol capability; start registration in Year 1 |
| **Routed-referral partner does not materialize** | Moderate | Line up three candidates and require only one; the cohort is a pre-specified stratum, not a gate, so the trial proceeds regardless |
| **90-day ascertainment window too short for LTSS determinations** | Moderate | Pre-specify competing-risk handling and a "pending determination at 90 days" terminal state; add the 180-day durability subsample to catch late establishment |

---

## 12. The end-of-CRP evidence package

### What you will be able to say

1. **"In a pre-registered, randomized, actively controlled trial across sixteen county markets (n≈800), adding bounded AI agent execution to a peer-reviewed digital navigation platform increased verified establishment of a family's pre-specified primary care or aid need by X percentage points (95% CI …) at 90 days, and reduced median time to establishment by N days."** With blinded adjudication and an intention-to-treat analysis.
2. **"The effect was consistent across sixteen markets"** — with a heterogeneity test — **"and was larger in the Medicaid/LTSS pathway stratum,"** or wherever it lands.
3. **"Among families offered agent execution, Y% authorized at least one consequential action; agents completed Z% of eligible administrative actions without human execution, with an escalation rate of A% and B documented corrections across N,NNN actions."**
4. **"Each established episode activated a median of $D in aid or benefit value that the family was already eligible for and had not obtained."**
5. **"In a routed-referral cohort of N individuals identified by an external organization rather than self-referred, E% engaged and F% reached verified establishment, at a per-engaged-episode acquisition cost of $G."**
6. **"Cost to serve per episode was $H, and cost per verified establishment was $I."**
7. **"We can lawfully assemble member-consented Medicare claims"** — with the demonstrated consent and connection rates from the feasibility sub-study.
8. **"Under a transparent threshold model, at our proposed price, break-even requires a relative utilization reduction of J% in this population — here is the model, run it with your own inputs."**
9. **"Here is a protocol-ready proof-of-concept design sized from our measured parameters: population, attribution logic, N, endpoints, data flows, timeline, and analysis plan."**

### What you still will not be able to say — and should say you cannot

1. That CareNavigator reduces ED visits, hospitalizations, readmissions, nursing-home placement, or total cost of care. **You will have no causal evidence for any of these.**
2. That any dollar of savings has been demonstrated. The economic work is a threshold model built on literature-derived downstream parameters, and it should carry that label on every slide.
3. That effects observed in self-referred families — or even in a modest routed cohort — transfer to a plan's full attributed population. Transportability remains an assumption.
4. That CareNavigator outperforms a plan's existing care management. You will never have tested that comparison; only a POC can.
5. That established care is durable beyond 90 days, except in the 180-day subsample.
6. Anything about clinical or functional outcomes, caregiver burden trajectories, or mortality.
7. Anything about populations you did not enroll: non-English-speaking households, families without a digitally engaged caregiver, institutionalized older adults, and — depending on your recruitment fixes — rural and low-broadband geographies.

Writing this list into the evidence package, verbatim, is a commercial asset rather than a liability. The buyer's analyst is going to construct it anyway. Handing it to them first is the difference between a vendor who is managing them and a partner who is telling them the truth.

---

## 13. Where the CRP stops and the payer study begins

The boundary, stated once:

> **The CRP establishes that agentic execution increases and accelerates verified care establishment relative to the best available digital alternative, quantifies engagement on a routed population, measures the aid and benefit value activated, and delivers a threshold economic model and a protocol-ready proof-of-concept design. The CRP does not, and is not designed to, establish that improved care establishment reduces avoidable utilization or total cost of care. That question requires a defined member population, claims data, and twelve to eighteen months of follow-up, and is therefore reserved for a payer-sponsored proof of concept — for which the CRP produces the population targeting, effect-size priors, engagement assumptions, data-linkage feasibility, and study protocol.**

Put that paragraph in the Statement of Need, in Aim 3, and on the first page of the buyer package. It is the sentence that makes everything else believable.

### POC sketch the CRP should deliver

- **Population:** the highest-risk stratum the CRP identifies — most likely dual-eligible or post-acute members with a documented ADL limitation and an identifiable caregiver, where baseline ED rates near 2.0/year make the study three to five times cheaper.
- **Design:** randomized encouragement (plan routes members; randomization determines outreach), analyzed ITT with a CACE secondary. Fallback where randomization is refused: matched difference-in-differences on engaged versus propensity-matched non-engaged members with 12 months of pre-period claims.
- **N:** ~500–700 per arm in the high-risk stratum for a 12–15% relative ED reduction; more under ITT dilution, with the precise figure computed from the CRP's measured engagement rate rather than assumed.
- **Endpoints:** primary, ED visits per member-year; secondary, all-cause admissions, 30-day readmissions, SNF/NH admission, HCBS or supplemental-benefit utilization, total cost of care, CAHPS-aligned experience items.
- **Duration:** 6-month enrollment, 12-month outcome window, 3-month claims runout.
- **Commercials:** fixed POC fee with an outcome-based component tied to verified establishment, and a pre-agreed conversion path to a PMPM or per-engaged-member contract on defined success criteria.

---

## 14. What to change in the application

| # | Change | Where | Why |
|---|---|---|---|
| 1 | Add the three-counterfactual framing (CF-A / CF-B / CF-C) | Research Strategy, Significance + Aim 2 opening | Establishes inferential discipline in one paragraph and preempts the reviewer's central objection |
| 2 | Convert Aim 2 to a randomized, actively controlled, delayed-access trial | Aim 2, Task 2.1 | Turns the largest score-driving weakness into a strength; the only design that tests what the CRP funds |
| 3 | Add co-primary time-to-establishment endpoint | Aim 2 | More sensitive than the binary rate; matches what families and discharge planners experience |
| 4 | Add Task 1.6 baseline cohort (n≈150) | Aim 1 | Supplies the missing baseline, powers the trial empirically, validates the instrument |
| 5 | Blinded independent adjudication + pre-registration + locked SAP | Aim 2 | Removes the numerator/denominator/adjudication-under-one-roof objection |
| 6 | Identical ascertainment protocol in both arms | Aim 2 | The one design flaw that could manufacture a false positive |
| 7 | Stratify by market and payer pathway; pre-specify effect modification | Aims 2–3 | Makes POC targeting possible and materially cheaper |
| 8 | Continue randomization into Aim 3; pre-specify pooled 16-market analysis | Aim 3, Task 3.1 | MDE improves from 13.4 to 9.4 points; adds the consistency claim |
| 9 | **Add a routed-referral cohort from 1–2 non-payer institutions** | Aim 3 | Produces the engagement-on-a-defined-denominator number that self-referral can never produce |
| 10 | Randomize Staffing price across Aim 3 markets | Aim 3 | Free demand curve on a dominant revenue lever |
| 11 | Add exploratory self-reported utilization + claims-linkage feasibility sub-study | Aims 2–3 | Proves the POC plumbing; supplies effect-size priors; costs almost nothing |
| 12 | Recast the economic work as a threshold model, not ROI | Commercialization Plan §8; Task 3.2 | How actuaries actually evaluate vendors |
| 13 | Recast Task 3.2 output from "specification" to **POC protocol** | Aim 3 | A protocol can be approved; a specification has to be designed |
| 14 | Separate CareNavigator randomization (all 16 markets) from the Staffing free→paid transition | Both documents | Removes a genuine source of confusion between two products with different monetization |
| 15 | Add outcome-based pricing structure alongside PMPM | Commercialization Plan §8 | Converts measurement infrastructure into pricing power and reduces the buyer's exposure to the unresolved counterfactual |
| 16 | Add the explicit "what we cannot say" list to the evidence package deliverable | Aim 3 / Commercialization Plan | Credibility with both reviewers and buyers |
| 17 | Rebuild the timeline with an ascertainment window | Research Strategy timetable | The current schedule has no time for the 90-day endpoint, with or without randomization |
| 18 | Plan for NIH-defined clinical trial status | Throughout | Forms, registration, DSMP, clinical-trial review criteria — manageable, and the criteria reward the design work |

### Expected effect on the NIH review

The randomization, pre-registration, blinded adjudication, empirically grounded power calculation, and repaired timeline address most of what drove the Approach score. Clarifying that the CRP produces effectiveness evidence and a protocol — not a cost claim — addresses the Significance concern about the institutional pathway. A reasonable expectation is Approach moving from 5 toward 3, Significance from 3 toward 2–3, and Overall Impact from 4 to 3. Not guaranteed, but this is the change with the highest expected score movement per dollar of added scope, and it happens to be the same change that makes the product sellable.
