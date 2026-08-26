# -*- coding: utf-8 -*-
"""Research Strategy prose, part 2: the re-based Approach and the CRP Progress Report."""

APPROACH_OPEN = r"""
<p class="sec first-sec"><b>Overall research design.</b> Olera builds two products,
CareNavigator and Caregiver Staffing. During this award only Caregiver Staffing is sold
and priced. Two NIH awards and our own capital have retired five commercial risks, which
the CRP Progress Report documents. One remains, and research funding alone cannot retire
it: <b>can a single local market pay for itself, and can we repeat it?</b></p>

<p>The award answers that in three stages (Figure 4). <b>Aim 1</b> builds and verifies the
technology both products require, in Year 1. <b>Aim 2</b> runs both products in two
markets at no charge, with real families, real caregivers, and real providers, and
measures whether care gets established and whether the staffing pathway completes.
<b>Aim 3</b> opens six new markets, charges for staffing, and measures whether providers
pay, whether the unit economics hold after real costs, and whether the playbook repeats.</p>

<p>The sequence is the design, not a schedule. <b>Every parameter Aim 3 prices against is
produced by Aim 2 at no commercial risk</b>: baseline conversion, cost to serve, fill rate
and time to hire, 90-day worker retention, and the market-entry playbook itself. Aim 3 is
Aim 2 run larger, in markets we did not design in, with money changing hands. Each stage
carries a gate, so failure is contained rather than propagated: if Aim 1 misses
verification, Aim 2 does not activate; if Aim 2 misses establishment, wave one is held.</p>

<p>Primary endpoints throughout are operational or economic and come from platform,
billing, and employment records. Human subjects research sits inside the aims as Tasks 2.3,
2.5, and 3.4, under Clemson University IRB approval with Dr. Fan as protocol lead. The
project remains outside the NIH definition of a clinical trial by design: no participant is
prospectively assigned to receive or not receive navigation, health-related outcomes appear
only as secondary observational measures on a cohort that all receives the service, and the
price conditions in Aim 3 are assigned to markets with purchase as the outcome. Formal
determinations will be obtained rather than assumed, including for streams we expect to be
non-human-subjects research.</p>

<p class="sec"><b>Market architecture.</b> The design sets the number of markets, not the
reverse (Table 4). <b>Two markets in Aim 2</b>, run at no charge. One market cannot
distinguish a product that works from a market that happens to work, so two are needed for
any replication signal at all. They are chosen to differ on workforce source, one
campus-rich and one campus-poor, because the riskiest assumption in this application is
whether people new to care work can be recruited and retained. If that pipeline depends on
proximity to a health-professions campus, we need to know while it is free to learn.</p>

<p><b>Six markets in Aim 3</b>, all new, all paid. Price is assigned at the matched-market
level rather than the account level, because providers in neighboring markets compare
quotes, so the market is the unit of assignment and market count sets the precision of the
price contrast. Three price points, two markets per arm, and within each arm one
campus-rich and one campus-poor market, so price condition is crossed with market type
rather than confounded with it. The six open in two waves of three: wave one at month 21,
the only wave with runway to observe 12-month retention, and wave two at month 30, run from
the written playbook by staff who did not design it. Socioeconomic status and urbanicity are
measured and reported as stratification variables rather than made design axes. At roughly
$30,000 to enter a market, market entry is about six percent of the requested budget; the
binding constraint is operating attention, not capital.</p>
"""

AIM1 = r"""
<p class="aimhead">Specific Aim 1: Build and verify the technology both products require.
<i>(Year 1)</i></p>
<p>Central question: can we engineer the capabilities that make care establishment and
caregiver placement work reliably enough to test commercially? Phase IIB built
identification. This aim builds execution, the workforce infrastructure, and the data
layer underneath both, and proves the output is good enough to put in front of families
before any market is activated.</p>

<p><b>Task 1.1: Execution and follow-up, across aid and services.</b> Families are lost at
the same two points whether they are securing a benefit or securing care: while completing
what the program or provider requires, and again while waiting for an answer. The loops
built here handle both. For aid, that is assembling and submitting applications, tracking the
documentation each program requires, and following the case to a decision. For services it
is the same abstraction applied to a different counterparty: preparing and sending the
intake packet, scheduling the assessment, following up with more than one provider so a
single decline does not end the case, and confirming the date care began.</p>

<p><b>Task 1.2: The aid, provider, and outcomes database, and the domain model built on
it.</b> Expansion and re-verification of the curated record, the instrumentation that
captures what each completed case decided, and the domain-specific model trained on that
record. <i>(Detailed scope owned by the PI; see Innovation.)</i></p>

<p><b>Task 1.3: Caregiver workforce infrastructure and the verified experience record.</b>
Recruitment and screening workflows, training completion tracking, the provider-facing
placement interface, and the verified record that accumulates hours, competencies,
populations served, and supervisor evaluations and travels with the worker.</p>

<p><b>Task 1.4: Verification against blinded expert review.</b> A panel of licensed
clinical social workers, independent of the engineering team and holding no equity in
Olera, audits a stratified random sample of cases each quarter. For each audited household
the panel determines eligibility blinded to what the platform produced, and for a subset
prepares the applications by hand. Both are compared with the platform's output, category
by category for eligibility and field by field for applications. Agreement is reported as
percent agreement with a 95 percent confidence interval and as Cohen's kappa, inter-rater
reliability among panelists is established before any system output is adjudicated, and
disagreements are routed to error analysis. Audited households are held out of tuning data.
This is internal product verification, not human subjects research, and a determination
will be obtained to that effect.</p>
"""

PP1 = r"""
<p class="sec"><b>Potential problems and alternative strategies.</b> Panel disagreement
could reflect reviewer variability rather than system error, which is why inter-rater
reliability is established first and reported alongside every accuracy figure. Program
rules change during a three-year award and would degrade accuracy through no fault of the
system; the maintenance pipeline re-verifies records on a rolling schedule and accuracy is
reported separately for rules that changed inside the measurement window. If agreement
stalls below the gate, the alternative is to narrow scope rather than widen it: restrict
automated execution to the program and service categories where accuracy is highest, route
the remainder to human-assisted execution, and report the boundary rather than an average
that conceals it. Aim 2 activation is held until the gate is met, which is what the month
12 decision point exists to enforce.</p>
"""

AIM2 = r"""
<p class="aimhead">Specific Aim 2: Validate both products in two markets, at no charge.
<i>(Years 1 to 2)</i></p>
<p>Central question: with real households, real providers, and real caregivers
concentrated in one place, does care get established, does the staffing pathway complete
end to end, and do all three sides accept it? This aim is where the commercial risk is
removed. Nothing is charged, so adoption is not confounded with price, and every parameter
Aim 3 needs in order to price is measured here first.</p>

<p><b>Task 2.1: Activate two markets.</b> Two markets are opened, one campus-rich and one
campus-poor, selected on existing organic family traffic, provider density, and state aid
generosity. Families arrive through organic search, local partners including Area Agencies
on Aging and Alzheimer's Association chapters, and direct outreach. Providers are recruited
from the onboarded base and by direct outreach and are offered both products at no cost for
the duration of the aim. Every activation is tagged by source, market, and cohort.</p>

<p><b>Task 2.2: Measure care establishment.</b> The operational stream. Each household is
followed from screening through the identified aid and services to a confirmed start date,
with the step at which any household stops recorded. Reported outcomes are the share reaching established aid or
care, time from first contact to established care, aid dollars secured, drop-off by step,
and eligibility accuracy against the accumulating volume of executed cases, which tests
whether the database sharpens with use. This is platform telemetry, not human subjects
research.</p>

<p><b>Task 2.3: Validate CareNavigator with family caregivers.</b> <i>(Human subjects
research; Clemson University IRB.)</i> Twenty-five family caregivers of people living with
dementia complete a mixed-methods evaluation of the integrated product, following the User
Experience Evaluation in Intelligent Environments framework, with the sample size informed
by our prior work. In a 60-minute moderated session each participant completes a needs
assessment, reviews eligibility matches, prepares one application package, and locates the
status of a filed application, thinking aloud while the moderator records task success
against pre-defined criteria, time on task, errors, and assists. Post-use measures are the
System Usability Scale and the 12-item trust-in-automation scale, followed by a
semi-structured interview on where the system lost them. Surveys at four weeks and three
months record whether the participant reached aid or care. Transcripts are analyzed
thematically against a shared codebook by two independent coders with inter-coder agreement
reported, and findings are integrated in a joint display that converts into an engineering
backlog.</p>

<p><b>Task 2.4: Recruit, place, and retain caregivers.</b> Recruitment runs through campus
advisors, health-professions organizations, and community channels. Prior direct-care
employment is ascertained at intake, before placement, so the share of workers new to the
field is measured rather than inferred. Each placement is timestamped from application
through screening, provider interview, hire, and first confirmed shift, which yields time
to hire and fill rate. Retention is reported by cohort at 90 days, and separately for
workers who remain with the placing provider and those who move to another licensed
employer carrying their verified record, because a worker who changes employers still
represents capacity added to the field. Placed workers are also invited into the interview
component of Task 2.5; research participation is firewalled from employment decisions,
shift allocation, and any commercial conversation, and consent language states this.</p>

<p><b>Task 2.5: Validate the staffing product with providers and workers.</b> <i>(Human
subjects research; Clemson University IRB.)</i> A sequential mixed-methods implementation
study in two phases. The formative phase enrolls approximately 30 provider participants
across owner, recruiter, and scheduler roles and approximately 20 placed workers, who
complete role-specific tasks against pre-defined criteria and then a guided interview on
workflow fit, supervision and safety, training needs, and priorities for improvement.
Recruitment continues in small batches until no new high-priority issue emerges in two
consecutive batches. The field phase follows the refined product through live semester
cohorts in both markets. Measures are the System Usability Scale and the Acceptability,
Appropriateness, and Feasibility of Intervention Measures, reported with 95 percent
confidence intervals as implementation estimates rather than between-group tests. A
stated-preference component, administered apart from any sales conversation, seeds the
price range Aim 3 tests.</p>

<p><b>Task 2.6: Measure cost to acquire and cost to serve.</b> Acquisition cost is measured
per family and per provider by channel and market. Cost to serve is measured per
established case and per placed worker using time-driven activity-based costing over the
compute behind the agents, the messages the loops send, navigator time, and support time.
Both formulas are fixed before measurement begins and both read from live records. These
figures are the denominators of every economic claim in Aim 3.</p>
"""

PP2 = r"""
<p class="sec"><b>Potential problems and alternative strategies.</b> <b>Worker retention is
the most consequential risk in this application.</b> If people new to the field leave
within 90 days, providers will not pay a second time and the commercial model in Aim 3
weakens regardless of how well navigation performs. Two responses are pre-specified.
Retention is reported both with the placing provider and in direct care with any licensed
employer, because those answer different questions and only the second speaks to capacity
added. If retention with the placing provider is poor while workforce retention holds, the
product emphasis shifts from placement to the verified record itself, which providers value
as reduced screening burden. Campus seasonality could create hiring gaps between terms, so
cohorts are staggered across the two markets. If the campus-poor market produces no
caregivers, that is a finding rather than a loss: the family side continues there and Aim
3's market selection is revised toward the conditions that worked, with the boundary stated.
If family volume in either market is too low for providers to experience value, family
acquisition is reallocated before any provider-side conclusion is drawn. The pathway is
population-agnostic by design, and a non-student worker pool is the first extension after
the award.</p>
"""

AIM3 = r"""
<p class="aimhead">Specific Aim 3: Determine whether providers pay and the market model
repeats. <i>(Years 2 to 3)</i></p>
<p>Central question: will providers pay for staffing, do the unit economics hold after real
costs, and does the playbook repeat in markets we did not design in? Aims 1 and 2
establish that the products work. This aim tests whether that value converts into recurring
revenue at a price and a cost structure that sustain a market, which is the condition on
which the business, and any private investment in it, depends.</p>

<p><b>Task 3.1: Open six markets in two waves.</b> Wave one opens three markets at month 21 and wave two
three more at month 30. Both run the playbook documented in Aim 2; wave two is executed by
staff who did not write it, with deviations logged. Waves are compared on time to first
provider, cost per activation, and the share of activations that are self-service rather
than staffed, which tests whether the model repeats affordably rather than merely
repeats.</p>

<p><b>Task 3.2: Set price and packaging under real billing.</b> Three price points are
tested, seeded by the stated-preference work in Task 2.5 and anchored on the prices
providers have already paid us, approximately $275 per month and approximately $150 per
placement. Conditions are assigned at the matched-market level rather than the account
level, because providers in neighboring markets compare quotes; markets are paired
non-adjacently and a contamination monitor runs in the offer workflow. Price points,
package variants, the primary contrast, the follow-up horizon, and the decision rule are
pre-registered before any outcome is reviewed. The primary outcome is paid conversion
within 60 days of offer, analyzed with generalized estimating equations at the account
level with market as the cluster and small-sample corrections. With six markets, arm-level
contrasts are estimated with confidence intervals rather than significance-tested, which is
the honest use of this design. A pre-registered interim analysis at month 30 drops a
dominated arm and reallocates to wave two. The decision rule selects the price maximizing
expected 12-month revenue per account rather than conversion alone, because a price that
converts and then churns is worse than one that does neither.</p>

<p><b>Task 3.3: Measure unit economics and retention.</b> Every figure comes from live
billing, payroll, and cost records. Customer acquisition cost includes spending on
non-converters. Monthly net account margin is revenue less the cost to serve defined in
Task 2.6. Retention is estimated at 3, 6, and 12 months. Time to churn is analyzed with
discrete-time survival models on account-month records matching the monthly billing cycle,
with voluntary cancellation, uncured payment failure, and downgrade treated as competing
events, and cause-specific hazards and cumulative incidence reported. Restricted mean
survival time at 12 months gives expected account lifetime, and lifetime multiplied by
monthly net margin gives lifetime value with a confidence interval, so the payback and
lifetime-to-acquisition-cost criteria carry measured uncertainty rather than point
estimates. Per-market contribution margin is reported after the cost of serving that
market's families, which is the number that determines whether a market pays for itself.</p>

<p><b>Task 3.4: The Aim 2 instruments at scale.</b> <i>(Human subjects research; Clemson
University IRB.)</i> The implementation measures from Task 2.5 are administered across the
paid cohort, with a baseline at enrollment and follow-up at four weeks and three months or
after a key event such as activation, downgrade, or churn, with approximately 150 provider
decision-makers expected. Semi-structured interviews with converters, non-converters, and
churned accounts examine what was purchased, what value was perceived, how price was judged,
and why accounts lapsed. Baseline perceived value enters the Task 3.3 survival models as a
pre-specified predictor of churn. The person-level participant and the account-level
economic unit are defined separately throughout.</p>

<p><b>Task 3.5: Independent rebuild and the investor evidence package.</b> An independent
analyst engaged under subcontract, working from the pre-specified analysis plan and the raw
billing, payroll, and cost records, rebuilds revenue, acquisition cost, cost to serve,
margin, retention, and per-market profitability without access to our operating model. The
analyst does not set price or packaging. Discrepancies between the rebuild and the
operating model are investigated and reported rather than silently reconciled. The package assembles the confirmed model into two forward
trajectories, expansion funded by reinvested margin and accelerated expansion under private
capital, and is the evidence base for the Commercialization Plan's fundraising
strategy.</p>
"""

PP3 = r"""
<p class="sec"><b>Potential problems, alternative strategies, and the stop rule.</b>
Contamination across neighboring markets is the standard objection to market-level
assignment; the pre-registered mitigations are non-adjacent pairing, a contamination
monitor in the offer workflow, and account-level assignment specified in advance as a
sensitivity analysis. Conversion could prove too low at every price for the arms to be
distinguishable, in which case the interim analysis reallocates and the finding is
reported as a finding. If price sits below cost to serve, the pre-registered alternatives
run in order: improve the product where the Task 3.4 interviews locate the gap, reduce
acquisition and serving cost, repackage, and re-test in wave two. If margins are positive
but below the level a market needs to fund itself, no further markets open until the cost
structure improves. If wave two slips, wave one still carries the pricing, unit economics,
and 12-month retention results, and replication is reported on the markets that opened.</p>

<p><b>The stop rule.</b> If, at the month 30 interim analysis, fewer than 40 percent of
placed workers remain in direct care at 90 days <i>and</i> paid conversion is below 20
percent at every offered price, we will report the provider-funded model as disconfirmed,
hold wave two, and redirect the remaining effort to completing and publishing the analysis.
A commercialization program should fund projects willing to find out they are wrong.</p>

<p><b>If staffing revenue alone proves insufficient.</b> The reviewer's fair question is
whether one product can carry a market. Two-thirds of home-care providers turned away business in 2023 for
lack of staff,<sup>REF3</sup> so the demand is not in doubt, and the price sits far below
what those providers already pay to hire. Should the measured economics still fall short,
Olera holds assets this award produces that support adjacent revenue without new invention:
the provider growth tools already operating today, an employer-paid caregiver benefit on the
same navigation product, contracted navigation for risk-bearing organizations on the
precedent of the Medicare GUIDE model,<sup>REF19</sup> and aggregate market intelligence
from the outcomes record. <b>None is tested in this award and none carries an endpoint
here.</b> They are modeled in the Commercialization Plan.</p>
"""

APPROACH_CLOSE = r"""
<p class="sec"><b>Technical assistance and project oversight.</b> Three external providers
carry defined deliverables. <b>Clemson University</b>, through Dr. Fan as Co-Investigator
at 25 percent effort, designs and executes the human subjects studies in Tasks 2.3, 2.5, and
3.4 and holds the protocols, integrated through joint quarterly protocol review and shared
data-management procedures specified in the subaward. <b>An independent financial analyst</b>
performs Task 3.5, and <b>pricing and actuarial consultation</b> supports the
pre-registration in Task 3.2. The Principal Investigator holds integration authority and all
gate decisions, supported by a weekly cross-aim operating review and a quarterly milestone
review against Tables 5 through 7. Consultant scopes and reporting cadence are specified in
the Project Management Plan.</p>

<p class="sec"><b>Regulatory plan.</b> No federal premarket pathway applies. CareNavigator
is navigational and administrative software that does not diagnose, treat, or make clinical
decisions, and is therefore not a medical device; no premarket authorization gates
commercialization and nothing in this plan waits on a federal approval. Four regimes govern and are addressed
operationally: family data under HIPAA-aligned safeguards; referral practice, where charging
no fee means no steering incentive exists and federally reimbursed providers can
participate; employment, training, insurance, and supervision of every placed worker, which
rest with the licensed provider rather than with Olera; and any joining of an external
record to ours, which requires an executed data-use agreement and an IRB determination.</p>

<p class="sec"><b>Timetable and what the award leaves behind.</b> Figure 5 gives the
quarter-by-quarter schedule and the four decision points. At month 12 the Aim 1 gate must
be met or market activation is held. At month 21 the Aim 2 gate must be met or wave one is
held. At month 30 the interim price analysis runs and the stop rule is evaluated before
wave two opens. At award end the independent rebuild is delivered.</p>

<p><b>Successful completion leaves Olera holding four things that do not exist today: a
product verified against blinded expert review, a price chosen by experiment rather than
assumption, unit economics an outside analyst rebuilt from records, and a market-entry
playbook run as written in six markets by people who did not write it.</b> That is the
evidence a private investor requires to fund national expansion, and it is the operational
record on which the adjacent revenue lines in the Commercialization Plan rest.</p>
"""

PROGRESS = r"""
<p class="sec first-sec"><b>Development status of the technology.</b> CareNavigator
operates in production today. Families screen their needs and means, receive matched aid
programs and providers drawn from an expert-curated national database of more than 72,000
records covering all fifty states, and receive AI-drafted, expert-approved guidance. The
multi-agent navigation layer, developed and evaluated under Phase IIB using
retrieval-augmented generation, parameter-efficient fine-tuning, and reinforcement learning
from expert feedback, is in production integration during the remaining Phase IIB year.
Execution and follow-up, the capability Aim 1 builds, do not exist in the product today and
are not funded by any existing award.</p>

<p class="sec"><b>What Phase I through IIB established.</b> The technology was developed
across NIA SBIR Phase I/II Fast-Track and Phase IIB awards (1R44AG074116), which received
impact scores of 20 and 25 respectively. Four peer-reviewed studies evaluated the platform with
family caregivers: usability scored 4.57 of 5, and technology acceptance scored 5.83 of 7
after four weeks of independent use among 65 caregivers, with higher use frequency
associated with higher acceptance.<sup>REF25,REF26,REF27,REF28</sup> The multi-agent
version scored 5.73 of 7 among 31 dementia caregivers in a study now in
preparation.<sup>REF29</sup> The Phase IIB review assessed the platform's commercial
potential as extremely high, citing its ability to help caregivers access eligible
funding.</p>

<p class="sec"><b>Commercialization progress, including work beyond the Phase II
scope.</b> Table 8 records what each activity retired and which funding produced it. Two of
the five risks were retired outside the Phase II scope, using I-Corps support and the
company's own capital, which is the record of commercialization initiative this program is
designed to reward.</p>

<p class="sec"><b>Ongoing Phase IIB work this award does not re-fund.</b> The remaining
Phase IIB year completes production integration of the agent system and continues database
expansion. This application begins where that work ends and duplicates none of it. No budget
line here supports agent development already funded under Phase IIB; Aim 1 builds execution,
follow-up, confirmation, and the workforce infrastructure, none of which is in scope for the
existing award.</p>

<p class="sec"><b>The team that will execute this work.</b> Dr. Falohun has served as
Principal Investigator on both prior NIA awards, which were scored at 20 and 25 and
delivered against their milestones. Dr. DuBose, a physician with an MBA, leads product and
market operations and built the organic acquisition channel and the provider pipeline
described above. Dr. Fan, at Clemson University, serves as Co-Investigator at 25 percent
effort and leads all human subjects protocols; she is a co-author on the platform
evaluation record cited here. Dr. Marcia Ory of Texas A&amp;M University, whose NIH career spans
aging services and implementation research, advises on study design and dissemination and
is likewise a co-author on that record. David Qu advises on commercialization and investor
readiness and has pressure tested the commercial plan in this application.</p>

<p>Olera operates as a fully distributed company: two full-time and two part-time
employees, dedicated engineering and marketing support, a two-person care navigation call
center, and contract staff, scaling with this award into market and workforce operations
roles. Being distributed is why an eight-market design is feasible at this size: no market
requires a local office.</p>

<p class="sec"><b>The risk that remains.</b> Nine years of federal and company investment
retired every commercial risk that could be retired without customers. What none of it
purchased is proof that a local market pays for itself and that the result repeats, because
that cannot be purchased. It has to be measured in real markets, with real money changing
hands, over long enough to observe churn. <b>That is the uncertainty the three aims remove,
and it is the reason this application exists.</b></p>
"""
