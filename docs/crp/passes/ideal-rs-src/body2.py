# -*- coding: utf-8 -*-
"""Research Strategy prose, part 2: Approach and CRP Progress Report."""

APPROACH_OPEN = r"""
<p class="sec first-sec"><b>Overall research design and the chain of evidence.</b> Two
NIH awards and our own capital have retired five commercial risks, which the CRP Progress
Report documents. One remains, and research funding alone cannot retire it: <b>can a
single local market pay for itself, and can we repeat it?</b> Three aims answer that as
one chain of evidence rather than three parallel projects (Figure 4).</p>

<p>Aim 1 establishes care and proves it was established. Aim 2 supplies the caregivers
without whom Aim 1 routes family demand at a supply side that cannot absorb it. Both run
in the same markets across Years 1 and 2, because family demand is what makes provider
staffing worth buying. Each carries a gate into Aim 3, which asks whether providers pay,
whether the unit economics survive real costs, and whether the model repeats. Primary
endpoints throughout are operational or economic and come from platform, billing, and
employment records.</p>

<p>Three bounded human subjects studies sit inside the aims as Tasks 1.3, 2.3, and 3.3,
conducted under Clemson University IRB approval with Dr. Fan as protocol lead. The
project is designed to remain outside the NIH definition of a clinical trial: no
participant is prospectively assigned to receive or not receive navigation, health-related
outcomes appear only as secondary observational measures on a cohort that all receives
the service, and the price arms in Aim 3 are assigned to business accounts with purchase
as the outcome. Formal determinations will be obtained rather than assumed, including for
the streams we expect to be non-human-subjects research, and each determination is
recorded in the corresponding task.</p>

<p class="sec"><b>Market architecture.</b> The design sets the number of markets, not the
reverse (Table 3). <b>Two anchor markets</b> open in Year 1 where existing organic traffic
and provider density are strongest; they carry the three IRB studies and the deep cost
instrumentation. <b>Eight replication markets</b> run the documented playbook as written
across a two-by-two design on the two axes that plausibly change the economics, workforce
source and provider density, with two markets per cell so that variation within a cell can
be distinguished from the identity of any single market. Socioeconomic status is measured
and reported as a stratification variable rather than made a third axis, because three
axes at two levels yields eight cells with one market apiece and no way to separate a
market effect from noise.</p>

<p>Ten also satisfies the sample requirement independently. The pricing experiment
randomizes accounts that are <i>offered</i> a price, and estimating conversion to a
95 percent interval of plus or minus 12 points across three arms requires roughly 180
offers, which ten markets supply at realistic provider density. <b>Six of the ten sit as
two clusters of three inside single payer footprints</b>, so that episode volume is
concentrated enough to support claims linkage rather than spread thin across unrelated
regions. Entry is staged two, four, and four across the three years. At approximately
$30,000 to enter a market, market entry is under eight percent of the requested budget;
the binding constraint is operating attention, not capital, and the staging reflects it.</p>
"""

AIM1 = r"""
<p class="aimhead">Specific Aim 1: Establish care reliably, and prove it was established.
<i>(Years 1 to 2)</i></p>
<p>Families identify aid and providers on the platform today and are lost while executing
applications and again while waiting for decisions. This aim builds the execution and
follow-up capability, verifies its output against expert judgment, validates it with
family caregivers, and measures what it costs.</p>

<p><b>Task 1.1: Build the execution and follow-up loops.</b> Three subtasks.
<i>(Task 1.1A) Application execution:</i> agents assemble and submit applications for the
programs identified during screening, with a human review checkpoint before any
submission. <i>(Task 1.1B) Document handling:</i> the system requests, tracks, and
attaches the supporting documentation each program requires, which is the most common
point of abandonment in current practice. <i>(Task 1.1C) Follow-through to decision:</i>
scheduled follow-ups, response handling, and confirmation of the decision and of the date
care began.</p>

<p><b>Task 1.2: Verify output quality against blinded expert review.</b> A panel of
licensed social workers and benefits specialists, blinded to whether output was
system-generated, independently adjudicates a stratified random sample of cases each
quarter for eligibility accuracy, plan appropriateness, and material error. The panel's
adjudication is the gold standard against which the system is measured, and disagreement
is itself analyzed to improve the retrieval layer.</p>

<p><b>Task 1.3: Validate usability, trust, and task completion with family caregivers.</b>
<i>(Human subjects research; Clemson University IRB.)</i> Twenty-five family caregivers
recruited from the anchor markets use the integrated system over four weeks. Measures are
the System Usability Scale, a validated trust-in-automation instrument, task completion
and abandonment points captured from platform telemetry, perception of AI error and the
escalation experience, and semi-structured exit interviews. This is an evaluation of an
information tool with no clinical intervention and no assignment; a formal determination
will be obtained before enrollment.</p>

<p><b>Task 1.4: Measure cost to acquire and cost to serve from live records.</b>
Acquisition cost is measured per family by channel; cost to serve is measured per
established case from actual staff time, compute, and support costs, recalculated
quarterly so that the trajectory rather than a single figure is the result.</p>
"""

PP1 = r"""
<p class="sec"><b>Potential problems and alternative strategies.</b> The expert panel is
the measurement instrument for Aim 1, so panel disagreement could reflect reviewer
variability rather than system error. We will establish inter-rater reliability before
any system output is adjudicated and will report it alongside every accuracy figure;
cases with panel disagreement are adjudicated by a third reviewer and analyzed
separately. Program eligibility rules change during a three-year award, which would
degrade accuracy through no fault of the agents; the database maintenance pipeline
re-verifies records against current sources on a rolling schedule, and we will report
accuracy separately for rules that changed within the measurement window. If agreement
stalls below the 85 percent criterion, the alternative is to narrow scope rather than
widen it: we will restrict automated execution to the program families where accuracy
is highest, route the remainder to human-assisted execution, and report the boundary
honestly rather than reporting an average that conceals it.</p>
"""

AIM2 = r"""
<p class="aimhead">Specific Aim 2: Bring new caregivers into the workforce.
<i>(Years 1 to 3)</i></p>
<p>This aim tests whether people who were not in the direct-care labor market can be
recruited, verified, employed by licensed providers, and retained, and whether providers
find the resulting hires valuable. Providers pay nothing for staffing in this aim; paid
conversion is tested in Aim 3.</p>

<p><b>Task 2.1: Verify the recruitment, screening, and verified-record pipeline.</b>
Campus and community recruitment channels, eligibility and background screening, training
completion, and the construction of the verified experience record that accumulates hours,
competencies, populations served, and supervisor evaluations across employers.</p>

<p><b>Task 2.2: Establish and instrument the placement pathway.</b> Provider onboarding,
role matching, offer and hire, and shift confirmation, with each step timestamped so that
time to interview, time to hire, and fill rate are measured rather than estimated.</p>

<p><b>Task 2.3: Validate acceptability, appropriateness, and feasibility with providers
and workers.</b> <i>(Human subjects research; Clemson University IRB.)</i> Structured
assessment using the Acceptability, Appropriateness, and Feasibility of Intervention
Measures with provider supervisors and with placed workers, plus semi-structured
interviews on safety, supervision, workflow fit, and barriers. Research participation is
firewalled from employment decisions, shift allocation, and sales in the protocol, and
consent language states this explicitly.</p>

<p><b>Task 2.4: Measure net-new-worker share and retention.</b> Prior direct-care
employment is ascertained at intake, before placement, so that the share of workers new
to the field is measured rather than inferred. Retention is reported by cohort at 90 days
and at 12 months, and separately for workers who remain with the placing provider and
those who move to another employer carrying their record.</p>

<p><b>Task 2.5: Second worker-pool feasibility pilot.</b> <i>(Year 3, two campus-poor
markets.)</i> A bounded pilot recruiting career changers and recent retirees through the
same pathway, with feasibility endpoints only: whether the pathway can recruit, verify,
and place a non-student cohort at comparable cost and retention.</p>
"""

PP2 = r"""
<p class="sec"><b>Potential problems and alternative strategies.</b> <b>Retention is the
most consequential risk in this application.</b> If workers new to the field leave
within 90 days, providers will not pay a second time and the commercial model in Aim 3
weakens regardless of how well Aim 1 performs. Two responses are pre-specified. First,
we will report retention two ways: retention with the placing provider, and retention in
direct care with any licensed employer, because a worker who moves employers carrying a
verified record still represents capacity added to the field even though the original
provider lost the hire. Second, if 90-day retention with the placing provider falls
below expectations while workforce retention holds, the product emphasis shifts from
placement to the portable record itself, which providers value as reduced screening
burden. Campus seasonality could create hiring gaps between terms; cohorts will be
staggered and the second worker-pool pilot in Task 2.5 will be moved earlier if gaps
appear. If providers prove unwilling to employ new entrants at the rate assumed, despite
the paid precedent already established, we will shift emphasis to per-diem and
supplemental roles, which carry lower onboarding cost and are where declined cases
concentrate.</p>
"""

AIM3 = r"""
<p class="aimhead">Specific Aim 3: Determine whether providers pay and the economics hold.
<i>(Years 2 to 3)</i></p>
<p>Each offering enters this aim at its gate. Two cohorts are followed: a conversion
cohort drawn from Aim 2's free pilots, and a paid-entry cohort that is charged from first
contact, so that willingness to pay is not confounded with the experience of having
received the service at no cost.</p>

<p><b>Task 3.1: Set price and packaging under real billing.</b> Offer prices are
randomized at the account level, stratified by market and provider size, with three arms
anchored on the prices providers have already paid us, approximately $275 per month and
approximately $150 per hire. The design is adaptive: a pre-registered interim analysis at
month 30 drops a dominated arm and reallocates. The decision rule, registered before the
first offer, selects the price maximizing expected 12-month revenue per account rather
than conversion alone, because a price that converts and then churns is worse than one
that does neither. Contamination is monitored, markets are paired non-adjacently, and
market-level assignment is pre-specified as a sensitivity analysis.</p>

<p><b>Task 3.2: Measure unit economics and retention from live billing.</b> Paid
conversion within 60 days of offer, revenue per account, cost to serve one paying account
from actual billing and support records, retention at 6 and 12 months, churn by survival
analysis, customer acquisition cost, payback period, and per-market contribution margin
after the cost of serving that market's families.</p>

<p><b>Task 3.3: Qualitative adoption, perceived value, and price fairness.</b>
<i>(Human subjects research; Clemson University IRB.)</i> Semi-structured interviews with
approximately 30 provider decision-makers spanning converters, non-converters, and
churned accounts, examining what was purchased, what value was perceived, how price was
judged, and why accounts lapsed.</p>

<p><b>Task 3.4: Independent rebuild of the economics.</b> An independent financial analyst
engaged in Year 3 reconstructs unit economics from raw billing, payroll, and cost records
without access to our model, and reports discrepancies. This converts a claimed number
into an audited one, which is the form an investor and a reviewer both require.</p>

<p><b>Task 3.5: Assemble the payer evidence package.</b> Negotiate and execute data-use
agreements with at least two risk-bearing organizations; demonstrate that our episode
records link to their claims or encounter data at a pre-specified match rate; deliver
intermediate outcomes with face validity, namely aid dollars secured, needs closed, time
to established care, and share of episodes ending in established care; and deliver an
actuarial cost model built on published effect sizes with sensitivity analysis and stated
assumptions.</p>
"""

PP3 = r"""
<p class="sec"><b>Potential problems, alternative strategies, and the stop rule.</b>
Account-level price assignment invites contamination, because providers in a market talk
to one another. Individualized quotes are normal in business software, and the
pre-registered mitigations are a contamination monitor built into the offer workflow,
non-adjacent market pairing, and market-level assignment specified in advance as a
sensitivity analysis. Conversion could prove too low at every price for the arms to be
distinguishable; the adaptive design reallocates away from dominated arms at the interim
analysis, and if all arms fall below 20 percent, that is itself the finding rather than
an inconvenience. Negotiating data-use agreements with risk-bearing organizations is
outside our control; we will pursue at least two independent counterparties in parallel
beginning in Year 1, and if none executes by month 30 we will deliver the cost model
against a de-identified internal cohort and state the linkage limitation plainly rather
than deferring the deliverable.</p>

<p><b>A stated stop rule.</b> If, at the month-24 decision point, fewer than 40 percent
of placed workers remain in direct care at 90 days <i>and</i> paid conversion is below
20 percent at every offered price, we will report the provider-funded model as
disconfirmed, halt market expansion at wave one, and redirect the remaining effort to
completing the payer evidence package and publishing the negative result. A
commercialization program should fund projects that are willing to find out they are
wrong, and we would rather report that outcome than spend Year 3 defending it.</p>
"""

APPROACH_CLOSE = r"""
<p class="sec"><b>What this award establishes, and what it prepares.</b> A risk-bearing
organization requires six things before it will contract: a measured case with verified
establishment, a way to match its members to our cases, demonstrated linkage to its own
claims records, intermediate outcomes it values, a defensible cost model, and proof of
reduced hospital use and institutional placement. This award delivers the first five.
<b>It does not deliver the sixth, and we will not claim it does.</b> Establishing that
navigation causally reduces utilization requires a design this project deliberately does
not run, because running it would make the award a clinical trial and would answer a
question no payer will fund us to ask before the first five items exist. The refusal is
what makes the first five credible, and completing them is what makes the sixth
fundable by someone other than NIH.</p>

<p class="sec"><b>Technical assistance and project oversight.</b> Three external
providers carry defined deliverables. <b>Clemson University</b>, through Dr. Fan as
Co-Investigator at 25 percent effort, designs and executes the three human subjects
studies and holds the protocols; integration runs through joint quarterly protocol review
and shared data-management procedures specified in the subaward. <b>An independent
financial analyst</b>, engaged in Year 3, performs Task 3.4. <b>Actuarial consultation</b>
supports the cost model in Task 3.5. The Principal Investigator holds integration
authority and all go/no-go decisions, supported by a weekly cross-aim operating review and
a quarterly milestone review against the criteria in Tables 4 through 6. Consultant
scopes, deliverables, and reporting cadence are specified in the Project Management Plan.</p>

<p class="sec"><b>Regulatory plan.</b> No federal premarket pathway applies. CareNavigator
is navigational and administrative software that does not diagnose, treat, or make
clinical decisions, and therefore is not a medical device; no premarket authorization
gates commercialization and nothing in this plan waits on a federal approval. Four
regimes do govern and are addressed operationally. Family data is handled under
HIPAA-aligned safeguards. Because no fee is charged for a referral, no steering incentive
exists, which is also what allows federally reimbursed providers to participate.
Employment, training, insurance, and supervision of every placed worker rest with the
licensed provider, not with Olera. And no payer record is joined without an executed
data-use agreement and an IRB determination, which Task 3.5 sequences accordingly.</p>

<p class="sec"><b>Timetable, decision points, and the state at award end.</b> Figure 5
gives the quarter-by-quarter schedule, the sequencing among the aims, and three formal
decision points. At month 12, the execution loops must be verified and the staffing
pipeline running before wave one opens. At month 24, the Aim 1 and Aim 2 gates must be met
and the stop rule evaluated before wave two opens. At award end, the independent rebuild
and the payer package are delivered.</p>

<p><b>Successful completion leaves Olera holding four things that do not exist today: a
product verified against blinded expert review, a price chosen by experiment rather than
assumption, unit economics an outside analyst rebuilt from records, and a market-entry
playbook run as written across four market types with its variance reported.</b> Together
with signed data-use agreements, demonstrated claims linkage, and a delivered cost model,
that is the evidence a private investor requires to fund national expansion and the
evidence an institutional payer requires to begin its own validation.</p>
"""

PROGRESS = r"""
<p class="sec first-sec"><b>Development status of the technology.</b> CareNavigator
operates in production today. Families screen their needs and means, receive matched aid
programs and providers drawn from an expert-curated national database of more than 72,000
records covering all fifty states, and receive AI-drafted, expert-approved guidance. The
multi-agent navigation layer, developed and evaluated under Phase IIB using
retrieval-augmented generation, parameter-efficient fine-tuning, and reinforcement
learning from expert feedback, is in production integration during the remaining Phase IIB
year. Execution and follow-up, the capability this application builds, do not exist in the
product today and are not funded by any existing award.</p>

<p class="sec"><b>What Phase I through IIB established.</b> The technology was developed
across NIA SBIR Phase I/II Fast-Track and Phase IIB awards (1R44AG074116), which received
impact scores of 20 and 25 respectively. Four peer-reviewed studies evaluated the
platform with family caregivers: usability scored 4.57 of 5 on the Mobile Application
Rating Scale, and technology acceptance scored 5.83 of 7 after four weeks of independent
use among 65 caregivers, with every item above 5.0 and higher use frequency associated
with higher acceptance.<sup>REF25,REF26,REF27,REF28</sup> The multi-agent version scored
5.73 of 7 among 31 dementia family caregivers in a study now in preparation.<sup>REF29</sup>
The Phase IIB review assessed the platform's commercial potential as extremely high,
citing its ability to help caregivers access eligible funding.</p>

<p class="sec"><b>Commercialization progress, including work beyond the Phase II
scope.</b> Table 7 records what each activity retired and which funding produced it. Two
of the five risks were retired outside the Phase II scope, using I-Corps support and the
company's own capital, which is the record of commercialization initiative this program
is designed to reward.</p>

<p class="sec"><b>Ongoing Phase IIB work this award does not re-fund.</b> The remaining
Phase IIB year completes production integration of the agent system and continues database
expansion. This application begins where that work reasonably ends and duplicates none of
it. No budget line in this proposal supports agent development already funded under Phase
IIB; the engineering requested here builds execution, follow-up, confirmation, and the
workforce infrastructure, none of which is in scope for the existing award.</p>


<p class="sec"><b>The team that will execute this work.</b> Dr. Falohun has served as
Principal Investigator on both prior NIA awards, which were scored at 20 and 25 and
delivered against their milestones. Dr. DuBose, a physician with an MBA, leads product
and market operations and built the organic acquisition channel and the provider
pipeline described above. Dr. Fan, at Clemson University, serves as Co-Investigator at
25 percent effort and leads all human subjects protocols; she is a co-author on the
platform evaluation record cited here. Dr. Marcia Ory of Texas A&amp;M University, whose
NIH research career spans aging services and implementation, advises on study design and
dissemination and is likewise a co-author on that record. David Qu advises on
commercialization, go-to-market, and investor readiness, and has reviewed and pressure
tested the commercial plan in this application.</p>

<p>Olera operates as a fully distributed company: two full-time and two part-time
employees, dedicated engineering and marketing support, a two-person care navigation
call center, and contract staff engaged as work requires, scaling with this award into
market operations and workforce operations roles. Distributed operation is not a
limitation for this project but the reason a ten-market design is feasible for a company
of this size, because no market requires a local office. Staged entry, two markets in
Year 1 and four in each subsequent year, is matched to that operating model and gated at
each wave.</p>

<p class="sec"><b>The risk that remains.</b> Nine years of federal and company investment
retired every commercial risk that could be retired without customers. What none of it
purchased is proof that a local market pays for itself and that the result repeats,
because that cannot be purchased. It has to be measured in real markets, with real money
changing hands, over a period long enough to observe retention and churn. <b>That is the
uncertainty the three aims are designed to remove, and it is the reason this application
exists.</b></p>
"""
