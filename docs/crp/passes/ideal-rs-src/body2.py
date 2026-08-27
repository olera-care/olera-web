# -*- coding: utf-8 -*-
"""Research Strategy prose, part 2: the Approach and the CRP Progress Report.

Aim 1 engineers and verifies. Aim 2 validates free in two markets. Aim 3
commercializes in eight paid markets. Ten markets total.
"""

APPROACH_OPEN = r"""
<p class="sec first-sec"><b>Overall research design.</b> Olera developed two products across
Phases I through IIB: CareNavigator and Caregiver Staffing. Everything that could be established
without customers has been (Table 7). What this award asks is whether the two work together in a
local market and whether that market can pay for itself. <b>The award answers that question in
three stages</b> (Figure 5).</p>

<p>Each stage carries a gate, and failure triggers a prespecified alternative strategy before the
next stage begins: if Aim 1 misses verification, no market activates until the alternative
engineering plan succeeds; if Aim 2 misses establishment, the alternative implementation plan runs
before anything is sold. Primary endpoints are operational or economic and come from platform,
billing, payroll, and employment records. Human subjects research sits inside the aims as Tasks
2.4 and 3.4, under Clemson University IRB approval with Dr. Fan as protocol lead; consent,
privacy, data security, and risk assessment are in the PHS Human Subjects and Clinical Trials
Information form.</p>

<p class="sec"><b>Regulatory plan.</b> No federal premarket pathway applies. CareNavigator is
navigational and administrative software that does not diagnose, treat, or make clinical
decisions, so it is not a medical device and nothing in this award waits on federal approval. Four
regimes govern operations: family data under HIPAA-aligned safeguards; referral practice, where
charging no fee means no steering incentive exists; employment, training, insurance, and
supervision of placed workers, which rest with the licensed provider rather than with Olera; and
any joining of an external record to ours, which requires a data-use agreement and an IRB
determination.</p>
"""

AIM1 = r"""
<p class="aimhead"><b>Specific Aim 1: Engineer and verify the technology and infrastructure
both products require.</b> <i>(Year 1)</i></p>

<p>Aim 1 builds the AI agents that execute administrative work on a family's behalf, the infrastructure that carries a new caregiver into the workforce, and the data layer underneath both, then verifies that what CareNavigator produces is good enough to put in front of families and providers in Aim 2.</p>

<p class="sec"><b>Engineering approach.</b> The platform runs today as a TypeScript and React web
application over managed Postgres, with the agent and data services in Python, in one repository
under trunk-based development with separate development, staging, and production environments;
staging runs on a synthetic household corpus, so no real family record is used in testing.
<b>Agents are task-scoped rather than conversational.</b> One assembles a packet, one submits it,
one follows up, one confirms the start date, each with a bounded set of tools and a single unit of
work. An orchestration service holds case state in the database rather than a model's context
window, so a case survives restarts, can be paused for family approval, and can be replayed
exactly. Tools are exposed through the Model Context Protocol, so the same definitions run against
either the Anthropic or the OpenAI agent runtimes and neither the model nor the vendor becomes a
structural dependency. Model selection is by task: a reasoning model for planning and adjudication,
a smaller one for extraction and classification, batch processing for offline re-verification.
Every model output entering a workflow is validated against a strict schema before use, so a care
and funding plan is a checked data object rather than prose to be parsed. <b>[TJ: confirm runtime
and model choices.]</b></p>

<p class="sec"><b>Task 1.1: Execution and follow-up.</b> CareNavigator screens a household and
identifies the aid and services it qualifies for; that much runs nationally today. This task builds
what happens next. Families are lost at the same two points whether the resource is a public
benefit, an insurance entitlement, or a home care agency: assembling what is required, and waiting
for an answer. The execution loop builds the required package from the household record and the
resource's requirements, submits it through whichever channel that resource accepts, and records
what was sent. The follow-up loop schedules the next contact, answers requests for further
documentation, escalates to a human navigator when a counterparty responds outside the expected
pattern or model confidence falls below a set threshold, and closes the case only on a confirmed
start date. Intake requirements are modeled per resource type rather than hard-coded per program,
which is what lets aid and services share one sequence. Every action is idempotent and logged, and
nothing leaves the system without the family's explicit approval.</p>

<p class="sec"><b>Task 1.2: The aid, provider, and outcomes database.</b> The curated record of
more than 72,000 aid programs and providers is expanded and re-verified on a rolling schedule, so
accuracy does not decay as program rules change, and new instrumentation captures what each
completed case decided: what was applied for, what was approved or denied, how long it took, and
what care started. Retrieval is hybrid, combining lexical and vector search over program rules,
forms, and the county-level operational record, and <b>every assertion an agent makes carries a
pointer to the record it came from</b>, which is what makes the expert audit in Task 1.4 possible
at all.</p>

<p class="sec"><b>Task 1.3: Caregiver workforce infrastructure.</b> This task builds recruitment
and screening workflows, training and credential tracking, and the provider-facing placement
interface, replacing the manual delivery that capped the pilot. The verified experience record
accumulates hours, competencies, populations served, supervisor evaluations, and credential status,
and is issued to the worker as a portable credential. Identity, background check, and credential
verification run through third-party services behind one internal interface, and provider-side
integration is by scheduled export and a documented API rather than per-agency custom work, which is
what makes the eight-market entry in Aim 3 affordable.</p>

<p class="sec"><b>Task 1.4: Verification against blinded expert review.</b> A three-person
panel of licensed clinical social workers, independent of the engineering team and holding no
equity in Olera, evaluates what CareNavigator produces. <i>What is evaluated.</i> A case is one
household scenario; the output under review is the care and funding plan the system generates
for it, together with the executable tasks that plan produces. <i>Design.</i> Panelists work from predefined household scenarios, blinded to the platform's output, independently determining eligibility and, for a subset, preparing application packages by hand. Both are
compared with the platform's output, category by category for eligibility and field by field
for applications, and the plans are rated against a rubric for appropriateness, accuracy, and
completeness. <i>Sample and analysis.</i> A stratified random sample of 60 cases in each of the
two quarters before the month 12 gate, 120 in all, sizes cumulative agreement to a 95 percent
half-width of about 6 points, and the audit repeats annually thereafter. Agreement is reported
as percent agreement with a 95 percent confidence interval and as Cohen's kappa, and
inter-rater reliability among panelists is established before any system output is adjudicated.
Every material error is reviewed rather than sampled, confirmed by a second reader, and audited households are held out of tuning data. Nick <b>[SURNAME TBD]</b>, LCSW, leads the panel and
recruits its other two members; his Letter of Support is included. This is internal product
verification, not human subjects research, and a determination will be obtained.</p>

<p class="sec"><b>Potential problems, alternative strategies, and the gate to Aim 2.</b> Program
rules change during a three-year award and would degrade accuracy through no fault of the system;
the re-verification schedule in Task 1.2 addresses this. If expert agreement falls short of the gate, we
narrow scope rather than widen it: automated execution is restricted to the resource categories
where accuracy is highest, the remainder routed to human-assisted execution, and the boundary
reported rather than averaged away. <b>The criteria in Table 4 must be met before Aim 2
begins.</b> Year 1 also ends with the two markets selected and partnerships signed, so the month
12 gate is a launch decision rather than a software review.</p>
"""

PP1 = r""""""

AIM2 = r"""
<p class="aimhead"><b>Specific Aim 2: Validate both products in two markets, at no
charge.</b> <i>(Years 1 to 2)</i></p>

<p>With real households, providers, and caregivers concentrated in one place, does care get
established, does the staffing pathway complete, and do all three sides accept it? Nothing is
charged, so adoption is not confounded with price, and Aim 2 also measures what it costs to
acquire and serve the participants a working market requires.</p>

<p class="sec"><b>Task 2.1: Activate the two pilot markets.</b> Markets are ranked on organic
family traffic, provider density, what a household can secure under that state's aid rules, and
proximity to a health-professions campus. Two are selected, one with a campus nearby and one
without, so the campus dependency is tested while it is still free to learn. The fair reviewer
question is how enough families and providers reach one local market at all. Table 3 lists the
channels activated on each side and what each has already produced. Providers get both products free for the life of the award. Every activation is tagged by source, market, and cohort, and any channel that
misses its cost ceiling is closed rather than carried.</p>

<p class="sec"><b>Task 2.2: Recruit, place, and retain caregivers.</b> The same table lists the
workforce channels: campus advisors and pre-health student organizations in the campus market, and
community colleges, workforce boards, and career-changer channels in both. Prior direct-care
employment is ascertained at intake, before placement, so the share of workers new to the field is
measured rather than inferred, and each placement is timestamped from application through
screening, interview, hire, and first confirmed shift, giving time to hire and fill rate. Retention
is reported by cohort at 90 days, separately for workers who stay with the placing provider and
those who move to another licensed employer carrying their verified record, because a worker who
changes employers still represents capacity added to the field. <b>The month 21 gate requires half
of the Aim 2 placements still in direct care at 90 days.</b> Below that a provider replaces half of
what they bought within a quarter, which is where this stops being cheaper than what they already
do.</p>

<p class="sec"><b>Task 2.3: Measure care establishment.</b> Each household is followed from
screening through the identified aid and services to a confirmed start date, recording the step at
which any household stops. Enrollment is 400 households across the two markets, sizing the
establishment proportion to a 95 percent confidence half-width of five points or better. Reported
outcomes are the share reaching established aid or care, time to established care, aid dollars
secured, drop-off by step, and eligibility accuracy against the accumulating volume of executed
cases, which tests whether the record sharpens with use. What counts is fixed before measurement
begins: clicks, impressions, and repeat contacts are excluded, and an outcome counts once. <i>No published benchmark exists
for how often a family reaches established care, because no one measures it.</i> Aim 2 therefore
reports establishment as an estimate with stated precision rather than against a threshold we would
have to invent, and gates instead on the loops completing for both aid and services.</p>

<p class="sec"><b>Task 2.4: Validate the integrated system with families, providers, and
workers.</b> <i>(Human subjects research; Clemson University IRB.)</i> One study, two participant streams. Participants are adults 18 or older in three roles: family
caregivers arranging care, provider decision-makers and staff, and placed caregivers; the older
adults receiving care are the beneficiaries and are not enrolled. Recruitment targets at least
the racial and ethnic composition of the two markets, and enrollment targets by sex, race,
ethnicity, and age appear in the PHS Inclusion Enrollment Report.</p>

<p><i>Stream A, families.</i> Twenty-five family caregivers of people living with dementia complete
a mixed-methods evaluation following the User Experience Evaluation in Intelligent Environments
framework. Detecting a medium effect on the pre-post usability comparison at 80 percent power and a
two-sided alpha of 0.05 requires 15 completers; enrollment is set at 25 against the 35 to 40
percent attrition reported for dementia caregiver studies. In a 60-minute moderated session each
participant completes a needs assessment, reviews eligibility matches, prepares one application
package, and locates the status of a filed application, thinking aloud while a moderator outside
the engineering team records task success against criteria set in advance, time on task, errors,
and assists. Post-use measures are the System Usability Scale and the 12-item trust-in-automation
scale; surveys at four weeks and three months record whether the participant reached aid or
care.</p>

<p><i>Stream B, providers and workers.</i> A sequential design. In the formative phase, about 30
provider participants across owner, recruiter, and scheduler roles and about 20 placed workers
complete role-specific tasks against criteria set in advance, then an interview on workflow fit,
supervision, training needs, and priorities for improvement; that gives at least five users per
role, and recruitment continues in small batches until two raise no new high-priority issue. In
the field phase the refined product runs through live semester cohorts in both markets, following
about 60 provider accounts and 100 placed workers for three months. <i>Measures and analysis.</i>
The System Usability Scale is the primary usability outcome and the Acceptability,
Appropriateness, and Feasibility of Intervention Measures are secondary; behavioral outcomes are
critical-task completion, time to first value, repeat use, and support minutes. Binary outcomes
are analyzed with generalized estimating equations using a logit link and an exchangeable working
correlation, clustered at the provider organization with small-sample corrections, market a
reporting stratum rather than a model term; estimates carry 95 percent confidence intervals and
are implementation estimates, not between-group tests. Interviews across both streams are analyzed
thematically against a shared codebook by two independent coders with inter-coder agreement
reported, guided by the Consolidated Framework for Implementation Research and checked against COREQ. Research participation is separated from employment decisions and any commercial conversation, and worker responses are not shared with employers. Findings are integrated in a joint display and converted into an engineering backlog that must clear before the month 21 gate.</p>

<p class="sec"><b>Task 2.5: Measure what it costs, and what it is worth.</b> Acquisition cost is
measured per family and per provider by channel and market, each channel running under a budget, an
attribution window, a cost ceiling, and a decision rule set in advance. Cost to serve is measured
per established case and per placed worker by time-driven activity-based costing over agent
compute, messages sent, navigator time, and support time. <b>These figures are the denominators of every
economic claim in Aim 3.</b> The same task asks free-pilot providers what the product was worth:
shifts filled, workers hired, business they could accept that they would otherwise have declined,
and what they consider a fair price. That runs apart from any sales conversation and seeds the
price range Aim 3 tests.</p>

<p class="sec"><b>Potential problems, alternative strategies, and the gate to Aim 3.</b> <b>Worker
retention is the most consequential risk in this application.</b> If people new to the field leave
within 90 days, providers will not pay a second time and Aim 3 weakens no matter how well
navigation performs. Retention is therefore reported both with the placing provider and in direct
care with any licensed employer, because only the second speaks to capacity added; if retention
with the placing provider is poor while workforce retention holds, the emphasis shifts from
placement to the verified record itself, which providers value as reduced screening burden. If the campus-free market produces no caregivers, that is a finding rather than a loss: the family
side continues there and Aim 3's market selection is revised toward the conditions that worked. If
family volume is too low for providers to experience value, family acquisition is reallocated
before any provider-side conclusion is drawn. <b>The criteria in Table 5 must be met before any
market is opened for sale.</b></p>
"""

PP2 = r""""""

AIM3 = r"""
<p class="aimhead"><b>Specific Aim 3: Commercialize the products in eight new paid
markets.</b> <i>(Years 2 to 3)</i></p>

<p>Aims 1 and 2 establish that the products work. Aim 3 asks whether the model generates enough
revenue in new paid markets to cover what those markets cost to run, and whether the market-entry
playbook works in the hands of people who did not write it.</p>

<p class="sec"><b>Task 3.1: Open eight new markets.</b> The eight are selected on the Task 2.1 criteria applied to a national ranking, and open in two waves of four: wave one at month 21, wave two at month 30. The waves are sequential
on purpose. Wave one tells us what the playbook gets wrong in a market we did not design in, and
those corrections are written into it before wave two opens; wave two is then run by staff who did not write it, with every deviation logged, which is the test of whether market entry transfers to people rather than living in the founders' heads. Each market runs the acquisition playbooks produced in Aim 2, and the waves are compared on time to first provider, cost per activation, and the self-service share of activations. Every
market here is new, so paid conversion carries no prior-gift confound. Entering a market costs
roughly $30,000, so all ten together are about $300,000, under eight percent of the funds
requested; the binding constraint on this aim is operating attention, not capital.</p>

<p class="sec"><b>Task 3.2: Set the price under real billing.</b> What providers will actually
pay is not something we know yet, which is why it is measured rather than assumed. The starting
range comes from three sources: prices providers have already paid us, about $275 per month and
about $150 per placement; what the free-pilot providers in Task 2.5 said the product was worth
once they had used it; and a Van Westendorp price-sensitivity survey of about 120 provider
decision-makers screened for purchase authority and drawn from both market types, whose
cumulative response curves define the acceptable range. That survey runs under IRB approval,
apart from any sales conversation.</p>

<p><b>Four prices are then offered, each in two of the eight markets.</b> Price is assigned by
market rather than by account because providers in the same market compare quotes. Two prices would
show only whether demand rises or falls; four show where it turns, which is what choosing a price
requires. Within each pair, one market has a health-professions campus nearby and one does not, so
price is crossed with workforce source rather than confounded with it. Price points, packages, the
primary contrast, the follow-up horizon, and the decision rule are pre-registered before any outcome
is reviewed; the primary outcome is paid conversion within 60 days of offer. <i>Eight markets is
eight units of assignment, and the analysis is designed for that rather than around it.</i> The
primary comparison uses randomization inference: the observed difference between arms is referred to
the distribution of differences the other possible price assignments would have produced, which is
valid with few clusters and assumes nothing about large samples. Account-level generalized
estimating equations, with market as the cluster and small-sample corrections, are pre-specified as
secondary. About 40 accounts per market reach a priced offer, roughly 320 in all and 80 per arm,
sizing account-level conversion to a 95 percent half-width near 10 points; a biostatistician
confirms that sizing against the conversion rate measured in Aim 2 rather than an assumed one.
A pre-registered interim analysis at month 30 drops a dominated arm and reallocates to wave two. The
decision rule selects the price maximizing expected 12-month revenue per account rather than
conversion alone, because a price that converts and then churns is worse than one that does
neither.</p>

<p class="sec"><b>Task 3.3: Measure the economics, and have them independently validated.</b> Every
figure comes from live billing, payroll, and cost records. Acquisition cost includes spending on
accounts that never converted, and monthly margin per account is revenue less the cost to serve from
Task 2.5. Retention is estimated at 3, 6, 9, and 12 months using discrete-time survival models on
account-month records matching the billing cycle, treating cancellation, uncured payment failure,
and downgrade as separate ways of leaving; expected account lifetime multiplied by monthly margin
gives lifetime value with a confidence interval rather than a point estimate. Profitability is reported market by market, flagged as descriptive below 20 paying accounts. <b>ADC, a strategic accounting and CPA firm, then independently validates those
numbers</b> under subcontract, working from the raw records and the pre-specified analysis plan
without access to our operating model. ADC confirms revenue, acquisition cost, operating cost, retention, customer economics, and market-level profitability, and produces the financial package an investor requires; discrepancies against our operating model are investigated and reported rather than quietly reconciled. Their Letter of Support is included.</p>

<p class="sec"><b>Task 3.4: The Aim 2 instruments at scale.</b> <i>(Human subjects research; Clemson University IRB.)</i> The Task 2.4 measures are administered across the paid cohort at enrollment, four weeks, three months, and after any churn event; baseline perceived value enters the Task 3.3 survival models as a churn predictor specified in advance. After the interim review, about 30 providers are interviewed, sampled purposively across four groups, never converted, converted then
churned, retained with low use, and retained with high use, at least six per group under a
documented stopping rule. Interviews examine what was purchased, what value was perceived, how
price was judged, and why accounts lapsed, and run apart from sales, support, and renewal contact.
Providers who did not convert are offered a shortened format, because a sample of satisfied
customers would answer the wrong question.</p>

<p class="sec"><b>Task 3.5: Assemble the evidence package for institutional buyers.</b> The second customer class buys on avoided cost, and this task builds what that conversation requires without overclaiming what the award can prove. It assembles three things: the Aim 2 and Aim 3 records of what care began, for whom, and when; utilization-linked operational data wherever a partner can share it and a data-use agreement and IRB determination permit, so establishment is observed alongside real utilization rather than assumed against it; and a model built with external actuarial consultation, estimating the hospitalization and premature institutionalization established care would be expected to avoid, from published effect sizes and our measured establishment rates. <b>That is modeled and estimated avoided cost, not
causal proof, and is labeled that way in every artifact.</b> What it delivers is a defensible
starting number and a specification of what a post-award proof-of-concept with a payer would have
to measure.</p>

<p class="sec"><b>Potential problems and alternative strategies.</b> Contamination across
neighboring markets is the standard objection to market-level assignment; the pre-registered
mitigations are non-adjacent pairing, a contamination monitor in the offer workflow, and
account-level assignment specified in advance as a sensitivity analysis. If conversion is too low
at every price for the arms to be distinguishable, the interim analysis reallocates and the
result is reported as a finding. If price sits below cost to serve, the pre-registered
alternatives run in order: improve the product where the Task 3.4 interviews locate the gap,
reduce acquisition and serving cost, repackage, re-test in wave two. And if staffing revenue alone proves insufficient, the alternative commercialization pathway is the institutional customer class that Task 3.5 makes available, together with an employer-paid caregiver benefit on the same navigation product, contracted navigation for risk-bearing organizations on the GUIDE precedent, and aggregate market intelligence from the outcomes record. There is also a point at which we would stop. If, at the month 30 interim analysis,
fewer than 40 percent of the workers placed in the wave-one paid markets remain in direct care at
90 days <b>and</b> paid conversion is below 20 percent at every offered price, we hold wave two
and redirect the remaining effort to completing and publishing the analysis. <b>A
commercialization program should fund projects willing to find out they are wrong.</b></p>
"""

PP3 = r""""""

APPROACH_CLOSE = r"""
<p class="sec"><b>Technical assistance and project oversight.</b> Three external providers carry defined deliverables. <b>Clemson University</b>, through Dr. Fan as Co-Investigator at 25 percent effort, designs and executes the human subjects studies in Tasks 2.4 and 3.4 and holds the protocols, integrated through quarterly protocol review and the data-management procedures in the subaward. <b>ADC</b>, a strategic accounting and CPA firm, performs the independent financial validation in Task 3.3, and <b>pricing, biostatistical, and actuarial consultation</b> supports the arm sizing in Task 3.2 and the modeling in Task 3.5. The Principal Investigator holds integration authority and every gate decision, against a quarterly milestone review of Tables 4 through 6. Consultant scopes and commercialization milestones are in the Project Management Plan.</p>

<p class="sec"><b>Timetable and end deliverable.</b> Figure 6 gives the quarter-by-quarter schedule
and the four decision points, each of which holds the next stage until its gate is met. <b>What the
award leaves behind is a commercially tested CareNavigator and workforce system, market economics
replicated across eight markets and independently validated, and an evidence package for private
investors and for the emerging institutional customer class.</b> The ten-market footprint is deliberately small: <b>the markets are an instrument, not the deliverable.</b> The same dollars spent on a larger footprint would buy more
revenue and less evidence, and evidence is what we do not have.</p>
"""

PROGRESS = r"""
<p class="sec first-sec"><b>Development status of the technology.</b> CareNavigator runs in
production today, doing the screening and matching described in Significance. The multi-agent
navigation layer, developed and evaluated under Phase IIB using retrieval-augmented generation,
parameter-efficient fine-tuning, and reinforcement learning from expert feedback, is in production
integration during the remaining Phase IIB year. Execution and follow-up, which Aim 1 builds, do not exist in the product today and are not in scope for the existing award, so no budget line here re-funds Phase IIB work.</p>

<p class="sec"><b>What prior funding established.</b> The technology was developed across NIA SBIR
Phase I/II Fast-Track and Phase IIB awards (1R44AG074116), scored at 20 and 25, and the Phase IIB
review assessed the platform's commercial potential as extremely high, citing its ability to help
caregivers access eligible funding. Table 7 records what each activity established and which
funding produced it; two of the five entries were funded outside the Phase II scope, using I-Corps
support and the company's own capital. Among providers with a claimed account, platform activity
runs about fifteen times higher on the day a family lead arrives than on days without one. The
provider tools launched nationwide in July 2026 with no paywall, so there is no pricing history to
read and Aim 3 sets the first one.</p>



<p class="sec"><b>Investor diligence set these milestones.</b> Olera has been evaluated by Ziegler,
the leading underwriter of financing for nonprofit senior living providers, and by Equitage
Ventures, an early-stage fund dedicated to the aging economy. <b>That diligence set the commercial
endpoints in Tables 4 through 6, so the milestones here are the ones our prospective investors said
they would need.</b> Dr. Falohun was Principal Investigator on both prior NIA awards and delivered
against their milestones; Dr. Fan is Co-Investigator at 25 percent effort and holds every human
subjects protocol. Nine years of investment answered everything that could be answered without
customers; whether a local market pays for itself, and whether that repeats, has to be measured
with real money changing hands. <b>That is what the three aims do.</b></p>
"""
