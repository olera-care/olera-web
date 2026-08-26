# -*- coding: utf-8 -*-
"""Research Strategy prose, part 2: the Approach and the CRP Progress Report.

Master build. Aim 1 engineers, Aim 2 pilots free in two markets, Aim 3 pilots
paid in eight new markets. Ten markets total.
"""

APPROACH_OPEN = r"""
<p class="sec first-sec"><b>Overall research design.</b> Olera builds two products,
CareNavigator and Caregiver Staffing, and during this award only Caregiver Staffing is sold
and priced. Everything that could be established without customers has been (Table 7). One
question remains, and it is not a research question. <b>Can a single local market pay for
itself, and can we repeat it?</b></p>

<p>The award answers that in three stages (Figure 4): engineer the technology, pilot it
free in two markets, then pilot it paid in eight new ones.</p>

<p>The sequence is the design, not a schedule. <b>Every parameter Aim 3 prices against
is produced by Aim 2 at no commercial risk</b>, as Figure 4 sets out. Aim 3 is Aim 2 run
larger, in markets we did not design in, with money changing hands. Each stage carries a
gate, so a failure stops rather than spreads: if Aim 1 misses verification, no market
activates; if Aim 2 misses establishment, wave one is held.</p>

<p>Primary endpoints are operational or economic and come from platform, billing, payroll,
and employment records. Human subjects research sits inside the aims as Tasks 2.3, 2.5,
and 3.4, under Clemson University IRB approval with Dr. Fan as protocol lead. Consent,
privacy, data security, and risk assessment for all three studies are detailed in the PHS
Human Subjects and Clinical Trials Information form. The project is not a clinical trial:
no participant is assigned to receive or withhold navigation, health-related outcomes
appear only as secondary observational measures on a cohort that all receives the service,
and the Aim 3 price conditions are assigned to markets with purchase as the outcome.
Determinations will be obtained rather than assumed, including for the streams we expect
to be non-human-subjects research.</p>

<p class="sec"><b>Ten markets, and why that number.</b> Table 3 derives the count from
what each aim has to measure: two free markets that differ on workforce source, then eight
paid markets that let price be tested at four points without confounding price with market
type. At roughly $30,000 to enter a market, ten markets is about seven percent of the
requested budget. The binding constraint is operating attention, not capital.</p>
"""

AIM1 = r"""
<p class="aimhead"><b>Specific Aim 1: Engineer the technology and infrastructure both
products require.</b> <i>(Year 1)</i></p>

<p>Phase IIB built identification. This aim builds execution, the workforce
infrastructure, and the data layer underneath both, and proves the output is good enough to
put in front of families before any market opens.</p>

<p class="sec"><b>Task 1.1: Execution and follow-up, across aid and services.</b>
CareNavigator today screens a household and identifies the aid and services it qualifies
for. That much runs nationally. The execution loop is in development and the follow-up
loop does not exist. This task builds both. Families are lost at the same two points
whether they are securing a benefit or securing care: while assembling what is required,
and again while waiting for an answer. For aid, the loops assemble and submit
applications, track each program's documentation, and follow the case to a decision. For
services they apply the same pattern to a different counterparty: prepare and send the
intake packet, schedule the assessment, follow up with more than one provider so a single
decline does not end the case, and confirm the date care began. Nothing is transmitted
without the family's approval.</p>

<p class="sec"><b>Task 1.2: The aid, provider, and outcomes database, and the domain model
built on it.</b> The curated record of more than 72,000 aid programs and providers is expanded and
re-verified on a rolling schedule, so accuracy does not decay as program rules change. New
instrumentation captures what each completed case decided: what was applied for, what was
approved or denied, how long it took, and what care started. Model development continues
the retrieval-augmented and expert-feedback methods evaluated under Phase IIB, now over a
record that includes outcomes rather than rules alone.</p>

<p class="sec"><b>Task 1.3: Caregiver workforce infrastructure and the verified experience
record.</b> Recruitment and screening workflows, training completion tracking, and the
provider-facing placement interface, replacing the manual delivery that capped the pilot.
The verified record accumulates hours, competencies, populations served, supervisor
evaluations, and credential status, and travels with the worker to any licensed
employer.</p>

<p class="sec"><b>Task 1.4: Verification against blinded expert review.</b> A panel of
licensed clinical social workers, independent of the engineering team and holding no
equity in Olera, audits a stratified random sample of cases each quarter. For each audited
household the panel determines eligibility blinded to what the platform produced, and for
a subset prepares the applications by hand. Both are compared with the platform's output, category by category for eligibility and
field by field for applications. Agreement is reported as percent agreement with a 95
percent confidence interval and as Cohen's kappa. Inter-rater reliability among panelists
is established before any system output is adjudicated, so panel disagreement is not
mistaken for system error. Every material error is reviewed rather than sampled and
confirmed by a second reader, and audited households are held out of tuning data. This is
internal product verification, not human subjects research, and a determination will be
obtained.</p>

<p class="sec"><b>Task 1.5: Market selection and preparation.</b> Markets are ranked on
existing organic family traffic, provider density, what a household can secure under that
state's aid rules, and proximity to a health-professions campus. The two Aim 2 markets are
selected from that ranking, with partnerships in place before activation. Year 1 ends with
markets ready, not software alone, so the month 12 gate is a launch decision.</p>
"""

PP1 = r"""
<p class="sec"><b>Potential problems and alternative strategies.</b> Program rules change
during a three-year award and would degrade accuracy through no fault of the system. The
re-verification schedule in Task 1.2 addresses this, and accuracy is reported separately for
rules that changed inside the measurement window. If agreement stalls below the gate, we
narrow scope rather than widen it: automated execution is restricted to the categories where
accuracy is highest, the remainder routed to human-assisted execution, and the boundary
reported rather than averaged away. Aim 2 activation is held until the gate is met.</p>
"""

AIM2 = r"""
<p class="aimhead"><b>Specific Aim 2: Pilot both products in two markets, at no
charge.</b> <i>(Years 1 to 2)</i></p>

<p>With real households, providers, and caregivers concentrated in one place, does care
get established, does the staffing pathway complete, and do all three sides accept it?
Nothing is charged, so adoption is not confounded with price, and every parameter Aim 3
needs in order to price is measured here first.</p>

<p class="sec"><b>Task 2.1: Activate two markets.</b> The two markets selected in Task 1.5
open, one with a health-professions campus nearby and one without. Families arrive through
organic search, local partners, and direct outreach. Providers come from the onboarded base
and direct outreach and are offered both products at no cost, grandfathered for the life of
the award, so no pilot provider faces a purchase decision that could color the answers they
give here and Aim 3 tests price only on customers who were never given anything free. Every
activation is tagged by source, market, and cohort.</p>

<p class="sec"><b>Task 2.2: Measure care establishment.</b> Each household is followed
from screening through the identified aid and services to a confirmed start date, with the
step at which any household stops recorded. Reported outcomes are the share reaching established aid or care, time to established
care, aid dollars secured, drop-off by step, and eligibility accuracy against the
accumulating volume of executed cases, which tests whether the record sharpens with use.
What counts is fixed before measurement begins: clicks, impressions, and repeat contacts
are excluded, an outcome counts once, and every count is reconciled against the outside
record of the same event. This is platform telemetry, not human subjects research.</p>

<p class="sec"><b>Task 2.3: Validate CareNavigator with family caregivers.</b> <i>(Human
subjects research; Clemson University IRB.)</i> Twenty-five family caregivers of people
living with dementia complete a mixed-methods evaluation of the integrated product,
following the User Experience Evaluation in Intelligent Environments framework.
Participants are adults caring for a person living with Alzheimer's disease or a related
dementia and involved in arranging or paying for that care, recruited from aging and
caregiving organizations and our own community, sampled to reflect the range of our
users. <i>Sample size.</i> Detecting a medium effect on the pre-post
usability comparison at 80 percent power and a two-sided alpha of 0.05 requires 15
completers; enrollment is set at 25 against the 35 to 40 percent attrition reported for
dementia caregiver studies. In a 60-minute moderated session each participant completes a
needs assessment, reviews eligibility matches, prepares one application package, and
locates the status of a filed application, thinking aloud while a moderator outside the
engineering team records task success against criteria defined in advance, time on task,
errors, and assists. Post-use measures are the System Usability Scale and the 12-item
trust-in-automation scale, followed by a semi-structured interview on where the system
lost them. Surveys at four weeks and three months record whether the participant reached
aid or care. Transcripts are analyzed thematically against a shared codebook by two
independent coders with inter-coder agreement reported and qualitative reporting against
the COREQ checklist. Findings are integrated in a joint display and converted into an
engineering backlog that must clear before the month 21 gate.</p>

<p class="sec"><b>Task 2.4: Recruit, place, and retain caregivers.</b> Recruitment runs
through campus advisors, health-professions organizations, and community channels. Prior
direct-care employment is ascertained at intake, before placement, so the share of workers
new to the field is measured rather than inferred. Each placement is timestamped from
application through screening, interview, hire, and first confirmed shift, which yields
time to hire and fill rate. Retention is reported by cohort at 90 days, separately for
workers who stay with the placing provider and those who move to another licensed employer
carrying their verified record, because a worker who changes employers still represents
capacity added to the field.</p>

<p class="sec"><b>Task 2.5: Validate the staffing product with providers and workers.</b>
<i>(Human subjects research; Clemson University IRB.)</i> A sequential mixed-methods
implementation study in two phases. <i>Formative phase.</i> Approximately 30 provider
participants across owner, recruiter, and scheduler roles and approximately 20 placed
workers complete role-specific tasks against criteria defined in advance, then a guided
interview on workflow fit, supervision and safety, training needs, and priorities for
improvement. The target provides at least five users per role, consistent with
problem-discovery guidance, and recruitment continues in small batches until no new
high-priority issue emerges in two consecutive batches. <i>Field phase.</i> The refined
product runs through live semester cohorts in both markets with approximately 60 provider
accounts and approximately 100 placed workers followed for three months, a target that
carries a 20 percent attrition allowance. <i>Measures and analysis.</i> The System
Usability Scale is the primary usability outcome; the Acceptability, Appropriateness, and
Feasibility of Intervention Measures are secondary. Behavioral outcomes are critical-task
completion, time to first value, repeat use, and support minutes. Binary outcomes are
analyzed with generalized estimating equations using a logit link and an exchangeable
working correlation, clustered at the provider organization with small-sample corrections;
market is a reporting stratum rather than a model term, and mixed models are pre-specified
as a sensitivity analysis. Estimates are reported with 95 percent confidence intervals as
implementation estimates, not between-group tests. Interviews follow a guide informed by
the Consolidated Framework for Implementation Research and are analyzed by two analysts in
a framework matrix with an audit trail. <i>Safeguards.</i> Research participation is separated from employment decisions, shift
allocation, and any commercial conversation; worker responses are not shared with
employers; and withdrawal affects neither platform access nor placement. A
stated-preference component, run apart from any sales conversation, seeds the price range
Aim 3 tests.</p>

<p class="sec"><b>Task 2.6: Measure cost to acquire and cost to serve.</b> Acquisition
cost is measured per family and per provider by channel and market. Each channel runs
under a budget, an attribution window, a cost ceiling, and a decision rule set in advance;
channels that miss their ceiling are closed rather than carried. Cost to serve is measured
per established case and per placed worker by time-driven activity-based costing over
agent compute, messages sent, navigator time, and support time. Both formulas are fixed
before measurement begins and both read from live records. These figures are the
denominators of every economic claim in Aim 3.</p>
"""

PP2 = r"""
<p class="sec"><b>Potential problems and alternative strategies. <b>Worker retention is
the most consequential risk in this application.</b></b> If people new to the field leave
within 90 days, providers will not pay a second time and Aim 3 weakens no matter how well
navigation performs. Two responses are set in advance. Retention is reported both with the
placing provider and in direct care with any licensed employer, because those answer
different questions and only the second speaks to capacity added. If retention with the placing provider is poor while workforce retention holds, the
product emphasis shifts from placement to the verified record itself, which providers value
as reduced screening burden. Campus seasonality could open hiring gaps between terms, so
cohorts are staggered across the two markets. If the market without a campus produces no
caregivers, that is a finding rather than a loss: the family side continues there and Aim
3's market selection is revised toward the conditions that worked, with the boundary
stated. If family volume is too low for providers to experience value, family acquisition
is reallocated before any provider-side conclusion is drawn.</p>
"""

AIM3 = r"""
<p class="aimhead"><b>Specific Aim 3: Pilot the paid products in eight new markets.</b>
<i>(Years 2 to 3)</i></p>

<p>Aims 1 and 2 establish that the products work. This aim asks whether providers pay,
whether the unit economics hold after real costs, and whether the playbook repeats in
markets we did not design in. That is the condition on which the business, and any private
investment in it, depends.</p>

<p class="sec"><b>Task 3.1: Open eight new markets in two waves of four.</b> Wave one
opens four markets at month 21, wave two four more at month 30. Both run the playbook
documented in Aim 2, and wave two is executed by staff who did not write it, with every
deviation logged. Waves are compared on time to first provider, cost per activation, and
the self-service share of activations, which tests whether the model repeats affordably
rather than merely repeats. These providers are new customers who were never given the
product free, so conversion carries no prior-gift confound.</p>

<p class="sec"><b>Task 3.2: Set price and packaging under real billing.</b> Four price
points are tested, two markets each. Two points would show which direction demand moves;
four show the shape of the curve, which is what choosing a price requires. Within each
pair, one market has a health-professions campus nearby and one does not, so price is
crossed with workforce source rather than confounded with it. Candidate prices are seeded
by a Van Westendorp price-sensitivity survey of approximately 120 provider
decision-makers screened for purchase authority and drawn from both market types, whose
cumulative response curves define the acceptable range and the points entered into the
arms. That survey runs under IRB approval, apart from any sales or renewal conversation.
The arms are anchored on prices providers have already paid us, approximately $275 per
month and approximately $150 per placement. Conditions are assigned by market because
providers in neighboring markets compare quotes; markets are paired non-adjacently and a
contamination monitor runs in the offer workflow. Price points, package variants, the
primary contrast, the follow-up horizon, and the decision rule are pre-registered before
any outcome is reviewed. The primary outcome is paid conversion within 60 days of offer,
analyzed with generalized estimating equations at the account level with market as the
cluster and small-sample corrections. A biostatistician sizes the arms against the
conversion rate measured in Aim 2 rather than an assumed one, and the enrollment window is
set so key proportions carry 95 percent confidence half-widths of no more than seven
points. With eight markets, arm-level contrasts are estimated with confidence intervals
rather than significance-tested, which is the honest use of this design. A pre-registered
interim analysis at month 30 drops a dominated arm and reallocates to wave two. The
decision rule selects the price maximizing expected 12-month revenue per account rather
than conversion alone, because a price that converts and then churns is worse than one
that does neither.</p>

<p class="sec"><b>Task 3.3: Measure unit economics, retention, and cross-side value.</b>
Every figure comes from live billing, payroll, and cost records. Acquisition cost includes
spending on non-converters. Monthly net account margin is revenue less the cost to serve
defined in Task 2.6. Retention is estimated at 3, 6, 9, and 12 months, and time to churn
with discrete-time survival models on account-month records matching the billing cycle,
treating voluntary cancellation, uncured payment failure, and downgrade as competing
events, with cause-specific hazards and cumulative incidence reported. Restricted mean
survival time at 12 months gives expected account lifetime, and lifetime times monthly net
margin gives lifetime value with a confidence interval, so the payback and
lifetime-to-acquisition-cost criteria carry measured uncertainty rather than point
estimates. <i>The two-sided test.</i> That family demand makes a provider account more valuable is a
claim this application makes, so it is tested. Provider value, retention, and margin are
modeled against a prior-period measure of consented, qualified family demand in the same
market rather than same-month demand, with the adjustment set capped at six terms drawn
from provider size and type, baseline activity, acquisition channel, and seasonality,
market as a random effect, and the provider organization as the clustering unit. Per-market
contribution margin is reported after the cost of serving that market's families, the
number that decides whether a market pays for itself.</p>

<p class="sec"><b>Task 3.4: The Aim 2 instruments at scale.</b> <i>(Human subjects
research; Clemson University IRB.)</i> The implementation measures from Task 2.5 are
administered across the paid cohort, with a baseline at enrollment and follow-up at four
weeks and three months or after a key event such as activation, downgrade, or churn.
Baseline perceived value enters the Task 3.3 survival models as a churn predictor
specified in advance. After the interim review, approximately 30 providers are interviewed, sampled purposively
across four groups: never converted, converted then churned, retained with low use, and
retained with high use. Churn subtype, voluntary or payment failure, is recorded and used in
sampling. We target at least six providers per group and document the stopping rule.
Interviews examine what was purchased, what value was perceived, how price was judged, and
why accounts lapsed, and run apart from sales, support, and renewal contact. Providers who
did not convert are offered a shortened format, because a sample of satisfied customers
would answer the wrong question. The person-level participant and the account-level economic
unit are defined separately, and the joint display converts into the packaging decisions
available to Task 3.2.</p>

<p class="sec"><b>Task 3.5: Independent rebuild and the investor evidence package.</b> An independent analyst under subcontract, working from the pre-specified analysis plan and
the raw billing, payroll, and cost records, rebuilds revenue, acquisition cost, cost to
serve, margin, retention, and per-market profitability without access to our operating
model. The analyst does not set price or packaging. Discrepancies between the rebuild and
the operating model are investigated and reported rather than silently reconciled. The
package assembles the confirmed model into two forward trajectories, expansion funded by
reinvested margin and accelerated expansion under private capital. It is the evidence base
for the Commercialization Plan's fundraising strategy, which carries the market sizing,
price list, and multi-year projections in full.</p>
"""

PP3 = r"""
<p class="sec"><b>Potential problems, alternative strategies, and the stop rule.</b>
Contamination across neighboring markets is the standard objection to market-level
assignment; the pre-registered mitigations are non-adjacent pairing, a contamination
monitor in the offer workflow, and account-level assignment specified in advance as a
sensitivity analysis. If conversion is too low at every price for the arms to be
distinguishable, the interim analysis reallocates and the result is reported as a finding.
If price sits below cost to serve, the pre-registered alternatives run in order: improve
the product where the Task 3.4 interviews locate the gap, reduce acquisition and serving
cost, repackage, and re-test in wave two. If margins are positive but below what a market
needs to fund itself, no further markets open until the cost structure improves. If wave
two slips, wave one still carries the pricing, unit economics, and 12-month retention
results.</p>

<p class="sec"><b>The stop rule.</b> If, at the month 30 interim analysis, fewer than 40
percent of placed workers remain in direct care at 90 days <b>and</b> paid conversion is
below 20 percent at every offered price, we will report the provider-funded model as
disconfirmed, hold wave two, and redirect the remaining effort to completing and publishing
the analysis. A commercialization program should fund projects willing to find out they are
wrong.</p>

<p class="sec"><b>If staffing revenue alone proves insufficient.</b> One product may not
carry a market. We expect it will: two-thirds of home-care providers turned away business
in 2023 for lack of staff, and our price sits far below what they already pay to hire. If
the measured economics fall short, this award still produces assets that support other
revenue without new invention: the provider growth tools already operating today, an
employer-paid caregiver benefit on the same navigation product, contracted navigation for
risk-bearing organizations on the GUIDE precedent, and aggregate market intelligence from
the outcomes record. <b>None is tested here and none carries an endpoint.</b> The
Commercialization Plan models them.</p>
"""

APPROACH_CLOSE = r"""
<p class="sec"><b>Technical assistance and project oversight.</b> Three external
providers carry defined deliverables. <b>Clemson University</b>, through Dr. Fan as
Co-Investigator at 25 percent effort, designs and executes the human subjects studies in
Tasks 2.3, 2.5, and 3.4 and holds the protocols, integrated through quarterly protocol
review and the data-management procedures specified in the subaward. <b>An independent
financial analyst</b> performs Task 3.5, and <b>pricing and biostatistical
consultation</b> supports the pre-registration and arm sizing in Task 3.2. The Principal
Investigator holds integration authority and every gate decision, against a quarterly
milestone review of Tables 4 through 6.</p>

<p class="sec"><b>Regulatory plan.</b> No federal premarket pathway applies.
CareNavigator is navigational and administrative software that does not diagnose, treat, or
make clinical decisions, so it is not a medical device and nothing here waits on a federal
approval. Four regimes govern operations: family data under HIPAA-aligned safeguards;
referral practice, where charging no fee means no steering incentive exists; employment,
training, insurance, and supervision of every placed worker, which rest with the licensed
provider rather than with Olera; and any joining of an external record to ours, which
requires a data-use agreement and an IRB determination.</p>

<p class="sec"><b>Timetable and what the award leaves behind.</b> Figure 5 gives the
quarter-by-quarter schedule and the four decision points, each of which holds the next
stage until its gate is met. At award end the independent rebuild is delivered.</p>

<p>Ten markets and one priced product is a deliberately small footprint for an award this
size, because the markets are an instrument and not the deliverable. We are not buying
revenue with this grant. We are buying the four things that let someone else fund the
revenue: <b>a product verified against blinded expert review, a price chosen by experiment
rather than assumption, unit economics an outside analyst rebuilt from our records, and a
market-entry playbook run as written, in markets we did not design in, by people who did
not write it.</b> Those transfer to the next hundred markets. A larger footprint bought
with the same dollars would produce more revenue and less evidence, and evidence is what we
do not have.</p>
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

<p class="sec"><b>What prior funding established.</b> The technology was developed across
NIA SBIR Phase I/II Fast-Track and Phase IIB awards (1R44AG074116), scored at 20 and 25.
The Phase IIB review assessed the platform's commercial potential as extremely high, citing
its ability to help caregivers access eligible funding. Table 7 records what each activity
established and which funding produced it. Two of the five entries were funded outside the
Phase II scope, using I-Corps support and the company's own capital.</p>

<p class="sec"><b>What the operating record already shows.</b> Among providers with a
claimed account, platform activity runs about fifteen times higher on the day a family lead
arrives than on days without one, and a fifth of all growth-tool views fall in the
twenty-four hours after a lead. <b>That is the cross-side effect Task 3.3 tests formally,
already visible in behavior.</b> The provider tools launched nationwide in July 2026 with
no paywall, so there is no pricing history to read and Aim 3 sets the first one. The
staffing model is also replicating with little staff effort: a committed provider and a
university advisor are prepared for a fall pilot in Indiana, seeded by one
coordinator.</p>

<p class="sec"><b>Ongoing Phase IIB work this award does not re-fund.</b> The remaining
Phase IIB year completes production integration of the agent system and continues database
expansion. This application begins where that work ends. No budget line here supports agent
development already funded under Phase IIB; Aim 1 builds execution, follow-up,
confirmation, and the workforce infrastructure, none of which is in scope for the existing
award.</p>

<p class="sec"><b>The team and the endpoints it works to.</b> Dr. Falohun was Principal
Investigator on both prior NIA awards and delivered against their milestones. Dr. DuBose, a
physician with an MBA, leads product and market operations and built the organic
acquisition channel and the provider pipeline described above. Dr. Fan, at Clemson
University, is Co-Investigator at 25 percent effort and leads all human subjects protocols;
Dr. Marcia Ory of Texas A&amp;M University advises on study design. Both are co-authors on
the evaluation record cited here. Olera has also been evaluated by Ziegler, the leading
underwriter of financing for nonprofit senior living providers, and by Equitage Ventures,
an early-stage fund dedicated to the aging economy. <b>That diligence set the commercial
endpoints in Tables 4 through 6, so the milestones here are the ones our prospective
investors said they would need.</b></p>

<p class="sec"><b>The question that remains.</b> Nine years of federal and company
investment answered everything that could be answered without customers. Whether a local
market pays for itself, and whether the result repeats, has to be measured with real money
changing hands, over long enough to observe churn. <b>That is what the three aims do.</b></p>
"""
