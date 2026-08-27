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
billing, payroll, and employment records. Human subjects research sits inside the aims as Tasks 1.5 and 2.4, under Clemson University IRB
approval with Dr. Fan as protocol lead; consent, privacy, data security, and risk assessment are in the
PHS Human Subjects and Clinical Trials Information form. <b>Phase IIB is the first stage in Figure 5:</b> where this award relies on a Phase IIB result, the contingency is stated.</p>

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

<p class="sec"><b>Engineering approach.</b> The platform runs today as a TypeScript and React web application over managed Postgres, with agent and data services in Python, under trunk-based development; staging runs on a synthetic household corpus, so no real family record is used in testing.
<b>Agents are task-scoped rather than conversational.</b> One assembles a packet, one submits it,
one follows up, one confirms the start date, each with a bounded set of tools and a single unit of
work. An orchestration service holds case state in the database rather than a model's context window, so a case survives restarts and can be replayed exactly. Tools are exposed through the Model Context Protocol, so the same definitions run against either the Anthropic or OpenAI agent runtimes and neither model nor vendor becomes a structural dependency. Model selection is by task: a reasoning model for planning and adjudication, a smaller one for extraction and classification. Every model output entering a workflow is validated against a strict schema, so a care and funding plan is a checked data object rather than prose to be parsed. <b>[TJ: confirm runtime
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
start date. Intake requirements are modeled per resource type rather than hard-coded per program, which is what lets aid and services share one sequence. Every action is idempotent and logged, and nothing leaves the system without the family's approval.</p>

<p class="sec"><b>Task 1.2: The aid, provider, and outcomes database.</b> The curated record of
more than 72,000 aid programs and providers is expanded and re-verified on a rolling schedule, so
accuracy does not decay as program rules change, and new instrumentation captures what each
completed case decided: what was applied for, what was approved or denied, how long it took, and
what care started. Retrieval is hybrid over program rules, forms, and the county-level operational record, and <b>every assertion an agent makes carries a pointer to the record it came from</b>, which is what makes the Task 1.4 audit possible at all.</p>

<p class="sec"><b>Task 1.3: Caregiver workforce infrastructure.</b> This task builds recruitment
and screening workflows, training and credential tracking, and the provider-facing placement
interface, replacing the manual delivery that capped the pilot. The verified experience record
accumulates hours, competencies, populations served, supervisor evaluations, and credential status,
and is issued to the worker as a portable credential. Identity, background check, and credential
verification run through third-party services behind one internal interface, and provider-side
integration is by scheduled export and a documented API rather than per-agency custom work, which is
what makes the eight-market entry in Aim 3 affordable.</p>

<p class="sec"><b>Task 1.4: Verify the execution outputs against blinded expert review.</b> Phase IIB already measures how accurately CareNavigator identifies what a household qualifies for, at a greater than 90 percent target against a manually determined standard. <b>This task does not re-measure that;</b> it measures whether the packages the execution agents assemble are correct enough to send to an agency on a family's behalf. A case is one household scenario; the output under review is the application package the system generates and the executable task list that carries the case to a confirmed start. A three-person panel of licensed clinical social workers, independent of the engineering team and holding no equity in Olera, prepares the same packages by hand, blinded to the platform's output. The two are compared field by field and the plans rated against a rubric for appropriateness, accuracy, and completeness. A stratified random sample of 60 cases in each of the two quarters before the gate, 120 in all, sizes cumulative agreement to a 95 percent half-width of about 6 points, and the audit repeats annually. Agreement is reported with a confidence interval and as Cohen's kappa, inter-rater reliability is established before any output is adjudicated, every material error is confirmed by a second reader, and audited households are held out of tuning data. <b>The bar is 90 percent field-level agreement, the standard Phase IIB set
for identification,</b> applied to the harder task of assembling a filing. Nick <b>[SURNAME TBD]</b>,
LCSW, leads the panel; his Letter of Support is included. This is internal product verification, not
human subjects research, and a determination will be obtained.</p>

<p class="sec"><b>Task 1.5: Test the technology with the people who will use it.</b> <i>(Human subjects
research; Clemson University IRB.)</i> Verified output is not usable output. Before any market opens, the
two populations who interact directly with what Aim 1 builds evaluate it. <i>Families</i> use the execution capability, which is new: they review a care and funding plan, approve a filing, respond to a documentation request, and locate the status of a submission. <b>This is not a repeat of the Phase IIB evaluation,</b> which measures acceptance of navigation and planning. What is untested is whether a family understands and trusts an agent acting on their behalf and catches an error when one appears. <i>Workers</i> move through the entry pathway end to end: training, screening, credential verification, and the issuing of the verified record.
Twenty to twenty-five families and fifteen to twenty prospective workers complete role-specific tasks against criteria set in advance, thinking aloud while a moderator outside the engineering team records task success, time, errors, and assists, followed by an interview on comprehension and trust. Recruitment runs in batches until two consecutive rounds raise no new high-priority issue. Post-use measures are the System Usability Scale and the 12-item trust-in-automation scale, and safety is the rate at which a participant would have submitted something incorrect without noticing. Findings
convert into an engineering backlog that must clear before the gate.</p>

<p class="sec"><b>Potential problems, alternative strategies, and the gate to Aim 2.</b> Program rules
change during a three-year award and would degrade accuracy through no fault of the system; the
re-verification schedule in Task 1.2 addresses this. If expert agreement falls short we narrow scope rather than widen it: automated execution is restricted to the resource categories where accuracy is highest, the remainder routed to human-assisted execution, and the boundary reported. <b>Aim 1 relies on the Phase IIB evaluation for family acceptance of navigation and planning.</b>
That study completes before this award begins; if it misses its predefined milestones, the corresponding
validation is added to Task 1.5 and no market activates until it clears. <b>The gate to Aim 2 is
two-part: the criteria in Table 4 must be met, and the people who have to use the product must be able
to.</b> Year 1 also ends with the two markets selected and partnerships signed, so month 12 is a launch
decision rather than a software review.</p>
"""

PP1 = r""""""

AIM2 = r"""
<p class="aimhead"><b>Specific Aim 2: Validate both products in two markets, at no
charge.</b> <i>(Years 1 to 2)</i></p>

<p>With real households, providers, and caregivers concentrated in one place, does care get
established, does the staffing pathway complete, and do all three sides accept it? Nothing is
charged, so adoption is not confounded with price, and Aim 2 also measures what it costs to
acquire and serve the participants a working market requires.</p>

<p class="sec"><b>Task 2.1: Activate the two pilot markets.</b> Markets are ranked on organic family traffic, provider density, what a household can secure under that state's aid rules, and proximity to a health-professions campus. Two are selected, one with a campus nearby and one without, so the dependency is tested while it is still free to learn. The fair question is how enough families and providers reach one local market at all. Table 3 lists the channels and what each has already produced. Providers get both products free for the life of the award, every activation is tagged by source, market, and cohort, and any channel that misses its cost ceiling is closed rather than carried.</p>

<p class="sec"><b>Task 2.2: Recruit, place, and retain caregivers.</b> Table 3 also lists the workforce channels. Prior direct-care employment is ascertained at intake, so the share new to the field is measured rather than inferred, and each placement is timestamped from application to first confirmed shift, giving time to hire and fill rate. Retention is reported by cohort at 90 days, separately for workers who stay with the placing provider and those who move to another licensed employer carrying their record, because a worker who changes employers still represents capacity added. <b>The month 21 gate requires half of the Aim 2 placements still in direct care at 90 days.</b> Below that a provider replaces half of what they bought within a quarter, which is where this stops being cheaper than what they do now.</p>

<p class="sec"><b>Task 2.3: Measure care establishment.</b> Each household is followed from screening to a confirmed start date, recording the step at which any household stops. Enrollment is 400 households across the two markets, sizing the establishment proportion to a 95 percent half-width of five points or better. Reported outcomes are the share reaching established aid or care, time to established care, aid dollars secured, drop-off by step, and eligibility accuracy against the accumulating volume of executed cases, which tests whether the record sharpens with use. What counts is fixed before measurement begins, and an outcome counts once. <i>No published benchmark exists
for how often a family reaches established care, because no one measures it.</i> Aim 2 therefore reports establishment as an estimate with stated precision rather than against a threshold we would have to invent, and gates instead on the loops completing for both aid and services.</p>

<p class="sec"><b>Task 2.4: Measure the value the integrated product created, with everyone who
experienced it.</b> <i>(Human subjects research; Clemson University IRB.)</i> Aim 1 asked whether the technology works for its users. This asks what can only be asked afterward: <b>under real market conditions, did the integrated product create the value each side needed?</b> Platform data shows whether care was established and whether workers stayed. It cannot show whether a provider considers the workflow worth keeping, whether a worker felt supported enough to remain in the field, or whether a family would have reached care without us.</p>

<p><i>Participants and measures.</i> Adults 18 or older in three roles, all of whom used the products: about 40 family caregivers who reached a decision point, 30 provider accounts across owner, recruiter, and scheduler roles, and 40 placed workers. Sampling is purposive across outcome strata, so households and accounts that did not succeed are represented alongside those that did. The older adults receiving care are beneficiaries and are not enrolled. Recruitment targets at least
the racial and ethnic composition of the two markets, and enrollment targets by sex, race, ethnicity, and
age appear in the PHS Inclusion Enrollment Report. A semi-structured interview across all three groups examines what was expected, what was received, what nearly failed, and what would have to be true to continue. Providers also complete the Acceptability, Appropriateness, and Feasibility of Intervention Measures and a willingness-to-pay item feeding the Aim 3 price range; workers complete items on supervision, integration, and intent to remain in direct care; families report whether they would have reached care unaided. Closed-ended outcomes are analyzed with generalized estimating equations using a logit link and an exchangeable working correlation, clustered at the provider organization with small-sample corrections, market a reporting stratum rather than a model term, reported with 95 percent confidence intervals as implementation estimates rather than between-group tests. Interviews are analyzed thematically against a shared codebook by two independent coders with inter-coder agreement reported, guided by the Consolidated Framework for Implementation Research and checked against COREQ. Research participation is separated from employment decisions and commercial conversation, and worker responses are not shared with employers. Findings are integrated in a joint display and reviewed before the month 21 gate.</p>

<p class="sec"><b>Task 2.5: Measure what it costs, and what it is worth.</b> Acquisition cost is measured per family and per provider by channel and market, each running under a budget, attribution window, cost ceiling, and decision rule set in advance. Cost to serve is measured per established case and per placed worker by time-driven activity-based costing over agent compute, messages, navigator time, and support. <b>These figures are the denominators of every
economic claim in Aim 3.</b> The same task asks free-pilot providers what the product was worth:
shifts filled, workers hired, business they could accept that they would otherwise have declined,
and what they consider a fair price. That runs apart from any sales conversation and seeds the
price range Aim 3 tests.</p>

<p class="sec"><b>Potential problems, alternative strategies, and the gate to Aim 3.</b> <b>Worker retention is the most consequential risk in this application.</b> If people new to the field leave within 90 days, providers will not pay twice and Aim 3 weakens no matter how well navigation performs. Retention is therefore reported both with the placing provider and in direct care with any licensed employer, because only the second speaks to capacity added; if the first is poor while the second holds, the emphasis shifts from placement to the verified record, which providers value as reduced screening burden. If the campus-free market produces no caregivers, that is a finding rather than a loss: the family
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

<p class="sec"><b>Task 3.1: Set the price range and pre-register the experiment.</b> What providers
will actually pay is not something we know yet, which is why it is measured rather than assumed. The starting range comes from three sources: prices providers have already paid us, about $275 per month and $150 per placement; what the Aim 2 providers said the product was worth once they had used it, from Tasks 2.4 and 2.5; and a Van Westendorp price-sensitivity survey of about 120 provider decision-makers screened for purchase authority across both market types, whose cumulative response curves define the acceptable range. That survey runs under IRB approval, apart from any sales conversation. Four
candidate prices, the packages, the assignment rule, the primary contrast, the follow-up horizon, and the
decision rule are all pre-registered before a single market opens.</p>

<p class="sec"><b>Task 3.2: Open eight markets under assigned prices and measure conversion.</b> The eight are selected on the Task 2.1 criteria applied nationally, and open in two waves of four: wave one at month 21, wave two at month 30. Wave one tells us what the playbook gets wrong in a market we did not design in, and those corrections go into it before wave two, which is then run by staff who did not write it, with every deviation logged. That is the test of whether market entry transfers to people rather than living in the founders' heads. Each market runs the Aim 2 acquisition playbooks, and the waves are compared on time to first provider, cost per activation, and the self-service share of activations. Entering a market costs roughly $30,000, so all ten are about $300,000, under eight percent of the funds requested.</p>

<p><b>Each of the four prices is assigned to two of the eight markets,</b> by market rather than by account because providers in the same market compare quotes. Two prices would show only whether demand rises or falls; four show where it turns. Within each pair, one market has a health-professions campus nearby and one does not, so price is crossed with workforce source rather than confounded with it. The primary outcome is paid conversion within 60 days of offer, and every market here is new, so conversion carries no prior-gift confound. The primary comparison uses randomization inference: the observed difference between arms is referred to the distribution of differences the other possible price assignments would have produced, which is valid with eight units of assignment. <b>That comparison resolves a market-level difference of
roughly 20 percentage points or more; smaller differences are reported as ordered but not separated, and
the decision rule is built for that resolution rather than assuming a finer one.</b> Account-level generalized estimating equations with market as the cluster are pre-specified as secondary: about 40 accounts per market reach a priced offer, 320 in all and 80 per arm, sizing account-level conversion to a 95 percent half-width near 10 points, confirmed by a biostatistician against the rate measured in Aim 2. Markets are paired non-adjacently and a contamination monitor runs in
the offer workflow. A pre-registered interim analysis at month 30 drops a dominated arm and reallocates to
wave two. The decision rule selects the price maximizing expected 12-month revenue per account rather than
conversion alone, because a price that converts and then churns is worse than one that does neither.</p>

<p class="sec"><b>Task 3.3: Measure the economics, and have them independently validated.</b> Every figure comes from live billing, payroll, and cost records. Acquisition cost includes spending on accounts that never converted, and monthly margin is revenue less the cost to serve from Task 2.5. Retention is estimated at 3, 6, 9, and 12 months using discrete-time survival models on account-month records, treating cancellation, uncured payment failure, and downgrade as separate ways of leaving; expected lifetime times monthly margin gives lifetime value with a confidence interval rather than a point estimate. Profitability is reported market by market, flagged as descriptive below 20 paying accounts. <b>ADC, a strategic accounting and CPA firm, then independently validates those numbers,</b> working from the raw records and the pre-specified analysis plan without access to our operating model. ADC confirms revenue, acquisition cost, operating cost, retention, customer economics, and market-level profitability and produces the financial package an investor requires; discrepancies are reported rather than quietly reconciled. Their Letter of Support is included.</p>

<p class="sec"><b>Task 3.4: Assemble the evidence package for institutional buyers.</b> The second
customer class buys on avoided cost, and this task builds what that conversation requires without
overclaiming what the award can prove. It assembles three things: the Aim 2 and Aim 3 records of what care began, for whom, and when; utilization-linked operational data wherever a partner can share it and a data-use agreement and IRB determination permit; and a model built with external actuarial consultation, estimating the hospitalization and premature institutionalization established care would be expected to avoid, from published effect sizes and our measured establishment rates. <b>That is modeled and estimated avoided
cost, not causal proof, and is labeled that way in every artifact.</b> What it delivers is a defensible
starting number and a specification of what a post-award proof-of-concept with a payer would have to
measure.</p>

<p class="sec"><b>Potential problems and alternative strategies.</b> Contamination across neighboring markets is the standard objection to market-level assignment; account-level assignment is specified in advance as a sensitivity analysis alongside the mitigations above. If conversion is too low at every price for the arms to be distinguishable, the interim analysis reallocates and the result is reported as a finding. If price sits below cost to serve, the pre-registered
alternatives run in order: improve the product where the Aim 2 value study locates the gap, reduce acquisition and serving cost, repackage, re-test in wave two. Revenue pathways beyond staffing, including the institutional customer class Task 3.4 makes available, are developed in the Commercialization Plan. There is also a point at which we would stop. If, at the month 30 interim analysis,
fewer than 40 percent of the workers placed in the wave-one paid markets remain in direct care at
90 days <b>and</b> paid conversion is below 20 percent at every offered price, we hold wave two
and redirect the remaining effort to completing and publishing the analysis. <b>A commercialization program should fund projects willing to find out they are wrong.</b></p>

<p class="sec"><b>What exists at the end of three years.</b> A commercially tested CareNavigator and workforce system, verified against expert review and used by the people it was built for; market economics measured on live billing and independently validated; a market-entry playbook executed by staff who did not write it, in eight markets we did not design in; and an evidence package specifying what a payer proof-of-concept would have to measure. <b>That is the de-risked asset, and it is what follow-on investment underwrites.</b> The ten-market footprint is deliberately small: the markets are an instrument, not the deliverable, and the same dollars spent on a larger one would buy more revenue and less evidence.</p>
"""

PP3 = r""""""

APPROACH_CLOSE = r"""
<p class="sec"><b>Technical assistance and project oversight.</b> Three external providers carry defined deliverables. <b>Clemson University</b>, through Dr. Fan as Co-Investigator at 25 percent effort, designs and executes the human subjects studies in Tasks 1.5 and 2.4 and holds the protocols, with Dr. Marcia Ory of Texas A&amp;M supervising as she has on Phase IIB, integrated through quarterly protocol review and the subaward's data-management procedures. <b>ADC</b> performs the independent financial validation in Task 3.3, and <b>pricing, biostatistical, and actuarial consultation</b> supports the arm sizing in Task 3.1 and the modeling in Task 3.4. The Principal Investigator holds integration authority and every gate decision, against a quarterly milestone review of Tables 4 through 6. Consultant scopes and commercialization milestones are in the Project Management Plan.</p>

<p class="sec"><b>Timetable.</b> Figure 6 gives the quarter-by-quarter schedule and the four decision points, each of which holds the next stage until its gate is met.</p>
"""

PROGRESS = r"""
<p class="sec first-sec"><b>Development status of the technology.</b> CareNavigator runs in production today, doing the screening and matching described in Significance. The multi-agent navigation layer, developed under Phase IIB using retrieval-augmented generation, parameter-efficient fine-tuning, and reinforcement learning from expert feedback, is in production integration during the remaining Phase IIB year. Execution and follow-up, which Aim 1 builds, do not exist in the product today and are not in scope for the existing award, so no budget line here re-funds Phase IIB work.</p>

<p class="sec"><b>What prior funding established.</b> The technology was developed across NIA SBIR
Phase I/II Fast-Track and Phase IIB awards (1R44AG074116), scored at 20 and 25, and the Phase IIB review
assessed the platform's commercial potential as extremely high. Table 7 records what each activity established and which funding produced it; two of the five were funded outside the Phase II scope, using I-Corps support and company capital. <b>The Phase IIB evaluation now underway is the
largest of them.</b> Two hundred family caregivers of people living with dementia, from diverse backgrounds and at least half reporting a documented social need, are evaluating the integrated CareNavigator before and after use on technology acceptance, usability, self-efficacy, and caregiving appraisals. It reports before this award begins. Among providers with a claimed account, platform activity runs about fifteen times higher on the day a family lead arrives. The provider tools launched nationwide in July 2026 with no paywall, so there is no pricing
history to read and Aim 3 sets the first one.</p>



<p class="sec"><b>Who set these endpoints, and who executes them.</b> Olera has been evaluated by
Ziegler, the leading underwriter of financing for nonprofit senior living providers, and by Equitage
Ventures, an early-stage fund dedicated to the aging economy, and the aims were additionally reviewed by
David Qu <b>[TITLE, AFFILIATION]</b> as an independent reviewer. <b>That diligence set the commercial endpoints in Tables 4 through 6, so the milestones here are the ones our prospective investors said they would need.</b> Dr. Falohun was PI on both prior NIA awards and delivered against their milestones. Dr. Fan is Co-Investigator and holds every human subjects protocol, with Dr. Marcia Ory of the Center for Population Health and Aging at Texas A&amp;M University supervising, as she has on Phase IIB. Market operations are led by <b>[TEAM: who leads
market operations]</b> at <b>[TEAM: staff per market at steady state]</b>, the staffing level the
ten-market schedule in Figure 6 was built on. Nine years of investment answered everything that could be
answered without customers; whether a local market pays for itself, and whether that repeats, has to be
measured with real money changing hands. <b>That is what the three aims do.</b></p>
"""
