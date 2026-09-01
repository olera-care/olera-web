# Rethinking the CRP from first principles

Working from the allowable-activity list (`solicitation-reviewer-reference.md`
Part I-C) against the live documents of 2026-08-31, now stored at
`docs/crp/living/`. This is architecture, not prose. No replacement sections are
drafted here.

**One correction before the analysis.** The premise that the current proposal put
too much ordinary development and commercial execution inside the CRP is right,
and the allowable-activity list settles it rather than leaving it to taste. But
the framing understates one thing in the current proposal's favor: the Phase IIB
award runs through 2027, so the pre-CRP build being proposed is not an unfunded
promise. It is the natural completion of an award already in hand. That fact does
more work than anything else in this redesign, and it should be stated plainly in
the application.

---

## 1. CRP-entry product state

What CareNavigator must be on Day 1, split by what exists now and what the
pre-CRP window has to finish.

### Already established (Phase I to IIB, per the CRP Progress Report)

| Capability | Evidence in hand |
|---|---|
| National curated data infrastructure | 72,000+ aid programs and providers, 578 program guides, all fifty states |
| Eldercare-tuned LLM | In production |
| Household needs-and-means modeling | Phase IIB |
| Eligibility and service matching | Phase IIB |
| Family-facing web and mobile product | Four peer-reviewed evaluations; usability 4.57/5; acceptance 5.83/7 (n=65) |
| Family reach | ~500 organic visits/day from nearly every county |
| Human support function | Two full-time family and provider operations staff, 3+ years |

### Must be finished before Day 1 (currently proposed as CRP Aim 1, Tasks 1.1 to 1.4)

| Capability | Why it belongs pre-CRP |
|---|---|
| Care Establishment Model: longitudinal state across the seven domains | Ordinary software architecture. Nothing about building a data model is late-stage R&D. |
| Bounded execution agents for a defined, frozen set of workflow classes | Ordinary product development. This is the product, not a study. |
| Permission and authority architecture | Same. It is a design requirement, not a research question. |
| Field-learning loop with provenance and QA gating | Same. |
| Escalation to human support | Same, and the support function already exists. |

The consequence: **the CRP does not build CareNavigator. It qualifies it.** The
verb changes from build to verify, validate, and evidence.

### The one thing that makes this credible

Phase IIB runs to 2027 and a CRP submitted in September 2026 would not start
before mid-2027. The pre-CRP build is therefore inside an existing federal award
plus company funds, on a timeline that already exists. The application should say
so explicitly, with the Phase IIB end date and the specific capabilities that
award will deliver, because a reviewer's first question about this architecture is
"what if the product is not actually finished on Day 1?"

**Contingency that must be written, not assumed.** If a workflow class is not
verified-ready at entry, it is excluded from the frozen scope rather than added to
the CRP's build list. The frozen scope shrinks; the calendar does not stretch.

---

## 2. Residual-risk inventory at that entry state

What legitimately remains once a mature CareNavigator exists.

### Technical and quality-system risk

- **T1. The system has never been independently verified against a specification.**
  Internal staging tests by the team that wrote the code are not verification in
  any recognized sense.
- **T2. Permission and authority boundaries are asserted, not proven.** The single
  most consequential failure mode is an agent taking a consequential action
  without proper authority, or inferring legal decision-making authority from
  caregiver status. Nothing currently demonstrates that the control cannot be
  bypassed.
- **T3. Failure behavior is uncharacterized.** External counterparties answer
  off-script, portals change, offices go quiet. Whether failures are detected,
  contained, and escalated rather than silently mis-executed is unknown.
- **T4. There is no change control.** A verified system that changes weekly is not
  a verified system. Nothing currently ties a release to a re-verification.
- **T5. Package accuracy against expert human judgment is unconfirmed in the mature
  product.** Phase IIB measured identification accuracy; execution-ready package
  accuracy is a different and harder claim.
- **T6. Regulatory status is undetermined.** Whether CareNavigator falls inside or
  outside the device definition, and whether it meets the Clinical Decision
  Support exclusion criteria, has not been formally analyzed. This is upstream of
  almost everything else in Aim 1.

### Scientific and effectiveness risk

- **S1. The counterfactual is unknown.** This is the central gap. A single-arm
  observational design can show that families using CareNavigator sometimes reach
  established care. It cannot show that CareNavigator caused it. Families who seek
  out an eldercare navigation platform are self-selected for motivation and
  resources; the comparison to "what would have happened anyway" is exactly where
  that selection bites hardest.
- **S2. Heterogeneity is unknown.** Whether the effect holds in rural versus urban
  counties, for dementia versus non-dementia households, and across payment
  sources, determines who the product is for.
- **S3. Durability is unknown.** Care established and care sustained are different
  outcomes, and the institutional value proposition depends on the second.
- **S4. Downstream utilization effects are untested and should stay untested here.**
  Whether established care reduces hospitalization or total cost cannot be
  answered in three years at this sample size. The CRP should establish the effect
  on care establishment and specify what a subsequent payer study must measure.

### Commercialization-readiness risk

- **C1. Institutional buyers' actual purchasing logic is unknown.** What evidence
  a Medicare Advantage plan or ACO requires, in what form, at what price, under
  what contract structure.
- **C2. The economic case is unquantified.** No actuarial or health-economic model
  connects a care-establishment effect size to a buyer's balance sheet.
- **C3. The IP position is unexamined.** The Care Establishment Model, the
  longitudinal record, and the execution architecture have never been assessed for
  protectability or freedom to operate.
- **C4. Privacy and data posture is informal.** HIPAA business-associate status,
  state privacy law, and the handling of authorized health information inside
  agent execution are asserted rather than analyzed.

---

## 3. Allowable-activity mapping

Each proposed activity against Part I-C. Fit is graded honestly; weak fits are
flagged rather than argued into place.

| Proposed CRP activity | NOFO category | Fit | Note |
|---|---|---|---|
| Formal regulatory determination: device status, CDS exclusion analysis, HIPAA and state privacy posture | TA: regulatory strategy and submissions | **Strong** | Named category. Must come first: it determines what Aim 1's quality system should even be. |
| Requirements definition, traceability, workflow specifications, acceptance criteria, risk and failure-mode analysis, change and configuration control | LSRD: activities to bring development under Design and Quality Systems Control | **Conditional** | See the flag below. This is the weakest link in the architecture. |
| Systematic software verification and validation of integrated workflows | LSRD: Design and Quality Systems Control | **Conditional** | Same flag. Defensible under IEC 62304 applied voluntarily, but only if we say voluntarily. |
| Independent third-party verification of package accuracy against a blinded expert panel | LSRD: independent replication or confirmation of key studies | **Good** | Reads best when framed as independently confirming the Phase IIB accuracy result in the mature product, by parties with no equity and no role in development. |
| Controlled real-world study of care establishment with a concurrent comparison | LSRD: clinical studies and clinical trials | **Strong, conditional on IC** | The category says "subject to participating-IC requirements." NIA's position must be confirmed. See PO questions. |
| Third-party institutional-buyer market research | TA: other third-party technical assistance (market research) | **Strong** | Explicitly named in the NOFO's own example. Must genuinely be third-party. |
| External actuarial or health-economic modeling | TA: other third-party technical assistance | **Good** | Third-party requirement again. Present as modeling and evidence specification, never as demonstrated savings. |
| IP strategy: protectability, freedom to operate, filing strategy | TA: intellectual property strategy | **Strong** | Named category. |
| Protocol and evidence specification for a post-CRP payer proof-of-concept | TA: regulatory/market research, or LSRD study design | **Adequate** | Better framed as an output of the market research and economic modeling than as a standalone activity. |

### Activities with no home in the list

These are the ones to remove, not to re-describe.

| Activity in the current proposal | Why it does not fit |
|---|---|
| Building the Care Establishment Model and the agent suite (Tasks 1.1 to 1.3) | Ordinary product development. Appears in no category. |
| Building Caregiver Staffing infrastructure (Task 1.4) | Ordinary product development for a second product. |
| Caregiver Staffing free pilots (Task 2.2) | Ordinary commercial piloting. |
| Opening eight paid markets and testing conversion, price, and retention (Task 3.1) | Ordinary commercial execution. This is the single clearest mismatch in the current proposal. |
| Acquisition-channel optimization and market-entry playbook transfer | Commercial operations. |
| Provider willingness-to-pay elicitation for Staffing | Market research in form, but for a product that should not be in the CRP. |
| Manufacturing methods and preclinical device development | Not applicable to software. Do not stretch "manufacturing methods" to cover build and release engineering; some applicants do, and it reads as vocabulary borrowing. |

### The flag you asked for

**"Activities to bring development under Design and Quality Systems Control" is
device-regulation vocabulary.** Design Controls under 21 CFR 820.30 and the
quality system regulation apply to medical devices. If the regulatory
determination concludes CareNavigator is not a device, then invoking design
control describes a voluntary conformance exercise, not a regulatory obligation.

That is still legitimate and still fits the category, because the NOFO says
"bring development under Design and Quality Systems Control," not "comply with
21 CFR 820." But three things must be true or the aim becomes an overclaim:

1. The regulatory determination happens first and is reported honestly, including
   the conclusion that no premarket pathway applies if that is the conclusion.
2. The standard being conformed to is named (IEC 62304 for software lifecycle,
   ISO 14971 for risk management, applied voluntarily), and the word voluntary
   appears.
3. We actually implement it. A design history file, a traceability matrix, a
   hazard analysis, and a change-control procedure either exist at the end of the
   award or they do not. This is auditable, and a reviewer with device experience
   will know the difference between a quality system and a description of one.

If we are not prepared to do all three, Aim 1 should be rebuilt around
independent verification alone, which fits category (i) cleanly and needs no
regulatory vocabulary at all. Recommend doing all three: the design-control
framing is what makes this a late-stage R&D award rather than a services
contract, and it is the thing a Series A diligence process will actually want.

---

## 4. Updated Research Strategy sketch

### Significance

The discipline you described is right, and it sharpens the NOFO's own Statement
of Need question rather than merely tightening the prose.

The unmet need is not that eldercare is hard to find. Phase IIB addressed
discovery. The need is that **recommendation is not establishment**: a family can
hold a correct list of benefits, programs, and providers and still fail across the
administrative steps required to obtain them, and nobody in the current system is
accountable for whether care begins.

The commercialization question follows: can a mature CareNavigator safely convert
identified needs into established aid and care, and can rigorous evidence show it
improves that outcome enough to support institutional purchasing?

Two boundaries to hold:

- Do not claim reduced hospitalization or total cost. State that the CRP
  establishes the effect on care establishment and specifies what a subsequent
  payer study must measure. This is a stronger position than a weakly supported
  cost claim, and it converts a reviewer objection into a deliverable.
- Keep the workforce argument, but as context rather than as a product. Provider
  capacity is a real constraint on care establishment; it is simply not something
  this award should fund a product to fix.

**This architecture makes the hardest NOFO question easy.** The Statement of Need
must answer what activities "would not otherwise be possible through independent
third-party investments or would be significantly delayed without additional NIH
support." Under the current proposal the honest answer is uncomfortable: private
capital does fund market expansion, and reviewers know it. Under this
architecture the answer is clean. No investor funds a randomized effectiveness
study of an unmonetized product, and no investor funds a voluntary quality system
before revenue. Both are precisely what an institutional buyer will later demand.

### Innovation

Narrow to CareNavigator alone. The innovation is not agents; tool-using agents are
everywhere. It is the combination:

- a structured Care Establishment Model with longitudinal state;
- bounded administrative agents operating against that state rather than against
  free text;
- explicit permission and authority boundaries, including the separation of the
  person using the platform from the person whose benefits are at stake;
- escalation and failure handling as designed behavior;
- measurement against a real-world terminal state rather than task completion.

**Pressure test, honestly.** Each element alone is not novel. Agentic healthcare
administration is a crowded and fast-moving space. What is defensible is the
conjunction plus the substrate: the county-level record of what programs and
providers actually did, which is expensive to accumulate and cannot be obtained
retrospectively. The Innovation section should lead with the substrate and the
verified terminal-state measurement, not with the agents. If the section can be
paraphrased as "AI agents for eldercare paperwork," it will not survive review in
2027.

### Approach

Three aims, where the third is explicitly a technical-assistance aim. The
solicitation supports this directly: "If requesting technical assistance, state
concisely and realistically what the proposed technical assistance is intended to
accomplish for the product under development. A scientific hypothesis is not
required." Technical assistance can be an aim, and saying so is better than
disguising TA as research.

---

## 5. Aim-by-aim architecture

### Aim 1. Bring CareNavigator under design control and independently verify its critical capabilities

| | |
|---|---|
| **Question** | Does the mature system do what its specification says, and can it be shown to, by someone other than its builders? |
| **Activity** | Regulatory determination; intended-use and requirements definition; requirement-to-implementation-to-test traceability; hazard and failure-mode analysis; permission and authority control specification; change and configuration control; systematic verification; validation of integrated workflows; independent confirmation of package accuracy against a blinded expert panel. |
| **Why CRP funds it** | A company with no revenue does not build a quality system voluntarily, and no investor pays for one pre-revenue. It is required before an institutional buyer will contract, and before the effectiveness study in Aim 2 can be interpreted, because an unfrozen system has no defined intervention. |
| **NOFO category** | LSRD: Design and Quality Systems Control. Independent panel work: LSRD independent confirmation. Regulatory determination: TA regulatory strategy. |
| **Method** | Named voluntary standards (IEC 62304 lifecycle, ISO 14971 risk). Independent verification body with no equity and no development role. Blinded field-level comparison of system-assembled packages against licensed clinical social workers, with a prespecified rubric and inter-rater reliability. |
| **Evidence produced** | Design history file, traceability matrix, hazard analysis, verification and validation reports, a frozen and version-controlled intervention specification, an independent confirmation report, a written regulatory determination. |
| **Success criterion** | Agreement with the expert panel at a prespecified threshold and no lower than panel members reach with each other; zero unmitigated hazards in the consequential-action class; no bypass of a required approval across the verification set; every requirement traced to a passing test. |
| **Risk retired** | T1 to T6. |
| **Post-CRP implication** | The frozen, verified specification is what a payer contracts against and what diligence examines. It is also the thing that makes the Aim 2 result mean something, because it names what was tested. |

### Aim 2. Test whether CareNavigator increases care establishment, against a concurrent comparison

| | |
|---|---|
| **Question** | Does a household that receives CareNavigator execution reach established aid or care more often, and sooner, than a comparable household that does not? |
| **Activity** | A controlled real-world study with a concurrent comparison condition. |
| **Why CRP funds it** | This is the single fact that neither the company nor an investor can produce, and the one an institutional buyer requires. It is also the classic case the mechanism exists for: rigorous evidence on a mature intervention that ordinary product development will never generate. |
| **NOFO category** | LSRD: clinical studies and clinical trials, subject to participating-IC requirements. |
| **Method** | See the design discussion below. |
| **Evidence produced** | A prespecified, registered effect estimate on verified care or aid establishment, with confidence bounds; time to establishment; the step at which unsuccessful pathways stop; prespecified subgroup estimates. |
| **Success criterion** | Prespecified and registered before enrollment, not chosen after. |
| **Risk retired** | S1, S2, partially S3. |
| **Post-CRP implication** | The effect estimate is the input to the economic model, the basis of the payer proof-of-concept protocol, and the first defensible claim Olera can make to a buyer. |

**On the design.** The choice is between randomization and a weaker comparison,
and the honest ranking is:

1. **Individual randomization to immediate versus delayed access.** Strongest, and
   ethically comfortable because everyone eventually receives the product and the
   control condition is the status quo the family would otherwise have. Delay must
   be long enough to observe the endpoint and short enough to be defensible.
2. **Stepped-wedge by market.** Every market eventually crosses over; the
   comparison is contemporaneous. Weaker than individual randomization, more
   complex to analyze, but avoids within-market contamination.
3. **Matched concurrent comparison.** Only if the above are infeasible. Residual
   confounding by motivation is exactly the threat that matters here, so this
   design does not really answer S1.

Recommend (1) unless Clemson or NIA raises an objection that (2) resolves.

**Two design consequences of removing Caregiver Staffing that must be faced.**

- Some pathways will fail because no worker is available, and the intervention
  cannot fix that. This attenuates the measured effect. Prespecify
  capacity-limited failure as a reported category, and consider whether the
  primary endpoint should be **established aid or care**, since the aid pathway is
  not workforce-constrained and is where execution most clearly adds value.
- Market selection should favor adequate provider supply, and that constraint
  should be stated rather than hidden, because it bounds generalizability.

### Aim 3. Technical assistance: convert the validated product into a commercialization-ready position

| | |
|---|---|
| **Question** | What will an institutional buyer actually purchase, on what evidence, at what price, under what contract, and what must a subsequent payer study measure? |
| **Activity** | Third-party institutional-buyer market research; external actuarial or health-economic modeling; IP strategy; regulatory strategy completion; specification of the post-CRP proof-of-concept protocol. |
| **Why CRP funds it** | Explicitly enumerated technical assistance. Each item is third-party expertise a pre-revenue company cannot staff and an investor will not underwrite before there is evidence to analyze. |
| **NOFO category** | TA: other third-party technical assistance (market research); TA: IP strategy; TA: regulatory strategy. |
| **Method** | Contracted third parties with named scopes and deliverables, integrated through a defined oversight process, per the Environment review criterion on CRO and service-provider oversight. |
| **Evidence produced** | A buyer requirements and contracting analysis; an economic model translating the Aim 2 effect into buyer-relevant terms with stated assumptions and explicit causal boundaries; an IP strategy with filings where warranted; a completed regulatory position; a protocol specifying population, endpoints, linkage, comparison, sample size, and follow-up for the payer study. |
| **Success criterion** | Delivered, specific, and actionable. No revenue or contract-count target: those are post-CRP outcomes and asserting them here reintroduces the problem this redesign is fixing. |
| **Risk retired** | C1 to C4, and it specifies rather than answers S4. |
| **Post-CRP implication** | This is the package that supports a raise and a first institutional conversation. |

**Structural note.** If three aims feels forced, the honest alternative is two
research aims plus a technical-assistance workstream carried in the Approach and
the Project Management Plan. The solicitation permits either. Recommend keeping
three, because a named TA aim is easier for a reviewer to score against the
Approach criterion than TA scattered through other aims.

---

## 6. What disappears from the existing proposal

| Work | Disposition | Rationale |
|---|---|---|
| Care Establishment Model build (1.1) | **Pre-CRP**, Phase IIB and company funds | Ordinary development. Becomes CRP-entry state and Progress Report content. |
| Agent suite build (1.2) | **Pre-CRP** | Same. This is the product. |
| Field-learning architecture (1.3) | **Pre-CRP** | Same. |
| Caregiver Staffing infrastructure (1.4) | **Out of the CRP entirely**, company-funded | Separate product; not required to demonstrate CareNavigator; widens scope and weakens the funding rationale. |
| Aim 1.5 usability and acceptance testing | **Partly retained**, folded into Aim 1 validation | Usability of a frozen product is legitimate validation. It is not a standalone aim. |
| Caregiver Staffing free pilots (2.2) | **Out** | Commercial piloting. |
| Single-arm establishment measurement (2.1, 2.3) | **Replaced** by the controlled design | The single-arm version cannot answer S1, which is the question worth funding. |
| Eight paid markets, conversion, retention, price testing (3.1) | **Out**, post-CRP with non-SBIR capital | Ordinary commercial execution. The clearest mismatch with the allowable list. |
| Market-entry playbook transfer to non-founder staff | **Out** | Operations, not R&D. |
| Post-CRP evidence package (3.2) | **Retained**, into Aim 3 | Fits technical assistance cleanly. |
| Independent financial validation (CPA) | **Reduced** | With no CRP revenue to validate, this shrinks to whatever the Fundraising Plan needs. It is not a research deliverable. |

### Consequences for the Commercialization Plan

Removing Staffing removes the CRP's only near-term revenue line. That sounds bad
and mostly is not, but it does force three changes:

1. **Revenue Stream** must present Staffing as a company-funded commercial line
   running alongside the award rather than as a CRP output. The numbers can stay;
   their provenance changes. The current Table 7 assumption of two hires per
   market-month and $48,000 across eight paid markets was never load-bearing for
   the CRP anyway.
2. **The CRP's own commercial outcome becomes the institutional pathway**, gated
   on the Aim 2 effect estimate. That is a longer path to revenue, and the
   Finance and Fundraising Plans must own that honestly.
3. **The Fundraising Plan gets stronger, not weaker.** Ask what an investor would
   rather diligence: eight counties of early staffing revenue, or a registered
   effect estimate on a defined endpoint plus a verified, frozen product and an
   actuarial model. The second is what supports an institutional contract, and
   institutional contracts are the business.

---

## 7. CRP-exit product state

What Olera holds at the end that it does not hold at entry:

1. **A frozen, specified, independently verified product.** Requirements traced to
   tests, hazards analyzed and mitigated, permission boundaries demonstrated
   rather than asserted, changes controlled. A named version that can be pointed
   at in a contract.
2. **A written regulatory position.** Device status determined, CDS exclusion
   analyzed, privacy posture documented. Diligence stops being a discovery
   exercise.
3. **A registered, prespecified effect estimate** on verified care or aid
   establishment, from a controlled design, with subgroup results and a
   characterization of where pathways fail.
4. **An independent confirmation** that the system's administrative output is
   accurate enough to send on a family's behalf, from parties with no stake.
5. **A buyer-facing economic model and requirements analysis**, produced by third
   parties, with causal boundaries stated.
6. **A protocol for the payer proof-of-concept**, specifying exactly what the next
   study must measure.
7. **An IP position** that has been examined rather than assumed.

Why that changes investability: today Olera asks an investor to underwrite both
"does it work" and "will anyone buy it." At CRP exit, the first is answered with
evidence a buyer specified, the product is a controlled artifact rather than a
moving target, and the remaining risk is commercial execution, which is the risk
private capital is actually built to price.

---

## 8. Questions for the Program Officer, separated from questions the NOFO answers

### Genuine interpretive questions worth a PO conversation

1. **Does NIA permit clinical studies or clinical trials under this CRP, and under
   what conditions?** The category is qualified "subject to participating-IC
   requirements," and Aim 2 is the load-bearing aim. This is the one question that
   could invalidate the architecture, so ask it first.
2. **Is a randomized delayed-access design within scope, or does NIA expect
   observational designs at this stage?** Related but distinct: an IC can permit
   clinical studies while preferring a particular level of rigor.
3. **For software outside the device definition, does NIA accept voluntary
   conformance to IEC 62304 and ISO 14971 as "activities to bring development
   under Design and Quality Systems Control"?** This is the interpretive question
   the whole of Aim 1 rests on.
4. **Does the "independent" in "independent replication or confirmation" require an
   external organization, or does an internal-to-the-award but
   independent-of-development party (Clemson, an unaffiliated expert panel)
   satisfy it?**
5. **Is pre-award completion of the product a problem or a virtue in NIA's view?**
   Some POs read a finished product as evidence the applicant no longer needs
   late-stage R&D funding. Worth surfacing rather than discovering at review.

### Answerable from the NOFO and the SF424 without asking

- What the Commercialization Plan must contain and in what order. Settled in
  Parts I-A and I-B of the solicitation reference.
- Whether technical assistance can constitute an aim. Yes, per II.6.
- What reviewers score. Part III.
- Whether ordinary commercial market expansion is allowable. It is not; it appears
  in no category.
- Whether manufacturing categories apply to software. They do not.

### A word on minimizing dependence on permissive readings

The architecture above has exactly one load-bearing interpretive assumption
(question 3, design control for non-device software) and one gating dependency
(question 1, IC permission for clinical studies). Everything else maps to a
category by its plain words. If question 3 goes against us, Aim 1 survives by
narrowing to independent verification and confirmation. If question 1 goes against
us, the architecture does not survive in this form, and that is worth knowing in
week one rather than in June.

---

## What this analysis did not do

No replacement prose. No figures. No page budgeting. The next step, if this
architecture is adopted, is the pre-CRP build plan and the Aim 2 design
consultation with Fan and Clemson, because the study design determines the
budget, the timeline, and whether this is an NIH-defined clinical trial with the
registration and oversight that follow.
