# -*- coding: utf-8 -*-
"""Research Strategy prose, part 1: Significance and Innovation.

Innovation is TJ's section and his pass supersedes this text. Citations are
written as <sup>@key</sup> and numbered at build time in order of first
appearance; see build.REFS for the key registry.
"""

SIGNIFICANCE = r"""
<p class="sec first-sec"><b>The unmet need.</b> If we are fortunate, each of us will grow old,
and reach the point where we, or someone we love, needs help with bathing, dressing, meals,
medications, and moving safely through the home. Most families meet that moment at its worst, after a fall or a hospitalization, and are expected to become experts in eldercare overnight.</p>

<p>A recognized need becomes established care only if a family clears three gates (Figure 1).
They must <b>find</b> the right care across four systems with separate eligibility rules and nobody accountable for whether care begins. They must <b>afford</b> it: full-time home care runs
$80,080 a year,<sup>@genworth</sup> Medicare does not cover custodial home care, Medicaid pays only after spend-down, and an estimated $58 billion in assistance goes unclaimed each year because families cannot navigate the programs.<sup>@ncoa2025</sup> And someone must
be available to <b>deliver</b> it: 63.3 percent of home-care providers declined cases in 2023
they could not staff.<sup>@activatedInsights2024</sup></p>

<p><b>Failure at any one gate leaves a vulnerable older adult in the vicious cycle.</b>
Nearly a third of older adults with difficulty in daily activities go without bathing, meals, or medications in a given month,<sup>@freedmanSpillman2014</sup> and unmet
needs of this kind independently predict emergency department use, readmission, nursing home
placement, and mortality.<sup>@unmetNeedsSR2024,@hass2017,@depalma2013</sup></p>

<p class="sec"><b>Where the money already goes.</b> Demand is rising while both sources of supply contract (Figure 2): the population over 65 reaches 82
million by 2050<sup>@censusProj2023</sup> while family caregivers per adult over 80 fall from more than
seven to four,<sup>@aarpCareGap2013</sup> and the paid workforce that would have to absorb the difference
faces 9.7 million direct-care job openings between 2024 and 2034.<sup>@phi2025</sup></p>

<p>The cost of that shortfall is already being paid, just not where anyone planned. Family caregiving costs working Americans $107 billion a year in earnings they do not make, and their employers roughly $26 billion more in lost productivity.<sup>@mudrazija2025</sup>
Families then spend down what they saved, so a lifetime of retirement savings, and often the inheritance behind it, goes into a few years of long-term care. Medicaid picks the bill up only once that money is gone, by which point the family has lost its assets, the employer the work, and the public system has inherited a more expensive person to care for.<sup>@kffLtss2022</sup> CAPABLE showed how avoidable that is: roughly $3,000 in program cost against more than $20,000 in reduced Medicaid spending per participant.<sup>@szanton2018,@szanton2021</sup> <b>The money largely exists today; too much of it is spent later, on worse outcomes and more expensive care.</b> Every dollar of that consequence sits on an identifiable
balance sheet: a health plan's, a state Medicaid budget's, a health system's, an employer's,
or a family's. That is what makes this an addressable market and not only a public health
problem.</p>

<p class="sec"><b>Why information is not the bottleneck.</b> Knowing what exists is not the
hard part. A family has to work out which aid program applies, which insurance benefit applies, and which service or provider is needed, then complete the same sequence for each: applications, documentation, intake, scheduling, waiting, follow-up requests, provider availability, approval, and confirmation that care began. Families are lost to follow-up somewhere in that sequence, and existing help stops earlier: a discharge planner hands over a printed list and the case closes at the hospital door, information services return directories, referral marketplaces introduce a provider and are paid on placement. None is accountable for whether care was established, and even where navigation succeeds there may be no local caregiver capacity to deliver it.</p>

<p>Two things are therefore required at once: navigation that runs through to established
care meeting the family's needs, and an available caregiver or provider to deliver it.
<b>Neither is sufficient alone, and that is the structural claim of this application.</b> A product that helps families find and afford care still fails if the local system lacks the caregivers to deliver it, which is a faster path back into the vicious cycle.</p>

<p class="sec"><b>The product and the north star.</b> Olera exists to increase the effective
capacity of America's aging-care system: to unlock financial resources that already exist, to
bring new caregivers into a workforce short of them, and to use AI to turn both into care that
actually begins.</p>

<p>CareNavigator is an eldercare AI navigation system built over an expert-curated national database of aid programs and providers, developed across NIA SBIR Phases I through IIB. It screens a household's needs and means and returns a care and funding plan with the steps each resource requires (Figure 3). What this award adds is execution: task-scoped agents that carry those steps out against a validated schema, follow up on a cadence, escalate to a person when a counterparty answers off-script, and confirm the date care began.
Alongside it, Olera recruits and verifies new caregivers and places them with licensed providers, who employ, train, insure, and supervise them. Together they turn a recognized need into established care, which is how the cycle in Figure 1 is interrupted.</p>

<p><b>CareNavigator is free to families, and no provider pays to be listed or to receive a
family connection.</b> Nothing about a family's access depends on who has paid, which removes the gating on who can be helped, keeps the network from tilting toward whoever bought placement, leaves no incentive to steer anyone, and lets federally reimbursed providers participate, which pay-per-referral models cannot accommodate.
<b>Caregiver Staffing is the product sold and priced during this award.</b></p>

<p class="sec"><b>Market segments and customers.</b> The beachhead customer for our staffing product is healthcare and long-term services and supports providers, roughly 165,000 of which operate in the United States.<sup>@nhe2023,@cdcNpals2020</sup> The published median cost of
acquiring a caregiver is $520 per hire, and that figure is for word of mouth, the cheapest
channel an agency has.<sup>@caregiverCAC2025</sup> Providers fill roughly 970,000 direct-care
positions a year;<sup>@phi2025</sup> at the 16 percent of annual pay published work puts on
replacing an hourly worker,<sup>@capTurnover2012</sup> against a direct-care median just under
$26,000, that is about $4 billion a year spent replacing people who left. Table 1 sets our
pilot pricing against what providers pay to acquire caregivers today.</p>

<p>A second customer class is emerging, and this award generates the evidence needed to
develop products for it. The organizations named above bear the cost when care does not get established, in avoidable emergency visits, readmissions, premature institutionalization, and caregiver breakdown, and Medicare now pays directly for care navigation through the GUIDE model.<sup>@cmsGuide2024</sup> Evidence that care was established, paired with defensible estimates of the utilization it avoids, is what makes that proposition real. The Commercialization Plan models both; at modeled steady state a single market carries about 50 paying provider accounts and $165,000 in annual recurring revenue against roughly $30,000 to enter it, with lifetime value above four times acquisition cost.</p>

<p class="sec"><b>Competitive environment and our advantage.</b> Table 2 places our two products against every category of alternative across the path a family travels. Each solves only part of it, and families can still fall through before care is established.</p>

<p>Human navigators are the strongest competitors: social workers, hospital case managers,
discharge planners, and private geriatric care managers do this work well and cover more of
the path than any product does. They are also scarce, and the constraint cannot be solved by hiring: healthcare social workers are projected to grow six percent by 2034, about 13,600 positions, against a population over 65 growing far faster.<sup>@blsSocialWork2025</sup> The closest commercial analogues are the navigation
platforms sold to employers and health plans, where access depends on who employs or insures a family,<sup>@navPlatforms2026</sup> and referral
marketplaces charge placement fees, which determines who appears and has drawn sustained
criticism.<sup>@wapoAPFM2024</sup> <b>Olera builds the pathways that bring new people into caregiving,</b> the subject of Key Innovation 1.</p>

<p class="sec"><b>Related development efforts in academia and industry.</b> What the science
has settled is that hands-on navigation works. Unmet daily-activity needs predict downstream utilization and placement,<sup>@freedmanSpillman2014,@unmetNeedsSR2024</sup> which is why we
measure care established rather than clinical endpoints, and home-based support trials,
principally CAPABLE, show that function-focused support reduces disability with savings well
above program cost. Studies of digital caregiver navigation tools, four of them our own,
establish that such platforms can be built and measured as usable and
accepted.<sup>@fan2023,@fan2024,@dubose2024,@hoang2026</sup> What remains unresolved is how to deliver that support at open access, at scale, through to a confirmed start, and on economics that sustain themselves without a grant. That is a commercialization problem
rather than a scientific one.</p>

<p>The causes of the caregiver shortage are equally well documented and economic: median annual earnings for direct-care workers are just under $26,000,<sup>@phi2025</sup>
the work is demanding, career ladders are short, and median turnover in home care runs near
75 percent a year.<sup>@caregiverCAC2025</sup> Both the literature and the industry response concentrate on retaining and competing for workers already in the field. Comparatively little has addressed enlarging the pool itself, which is the gap Key Innovation 1 addresses.</p>

<p class="sec"><b>Hurdles to adoption.</b> Three groups have to adopt this, and each has a
distinct reason not to. <i>Families</i> must trust an AI system with decisions about someone
they love, and acceptance research finds willingness that is real but conditional: among 199 family caregivers surveyed, 62 percent intended to use AI-enabled care technology, with trust and perceived cost among the significant predictors.<sup>@yee2025</sup> We answer trust with verification rather than assurance. The Phase IIB evaluation now underway measures acceptance in 200 diverse family caregivers and reports before this award begins; Aim 1 then audits execution outputs against a blinded panel and tests the execution experience with families. We answer cost by charging families nothing.</p>

<p><i>Providers</i> are wary of platforms that promise volume and deliver overhead, so Aim 2
removes the purchase decision by giving them the product free, leaving only the question of
whether the workflow produces hires; Aim 3 then asks a different set of providers to pay, once
that is answered on operating data rather than a pitch. <i>New caregivers</i> must be safely integrated into the workforce and well received by the providers who take them on, which is why Aim 2 measures the pathway end to end. All three have to happen in one market at once, at a cost that market's revenue
supports. <b>The aims are built around these hurdles, with prespecified alternative strategies if
any gate fails.</b></p>
"""

INNOVATION = r"""
<p class="sec first-sec"><b>Key Innovation 1: infrastructure that adds caregivers to the
field.</b> Every staffing channel serving this industry, whether an agency, a job board, or a
gig platform, competes for workers already inside the direct-care labor market. One provider's
hire is another's vacancy, and the national shortage does not shrink by a single worker. Olera
builds the infrastructure to bring in people who were not in the field (Figure 4).</p>

<p>That infrastructure is the innovation, not the recruiting. It is a technical pathway carrying a person with no eldercare experience through online training, screening, identity and credential verification, placement with a licensed employer, and supervised work, and issuing <b>a verified, longitudinal record of their caregiving experience</b>: hours, employers, training, competencies, populations served including dementia care, supervisor evaluations, reliability, background checks, and references. That record travels with the worker. Nothing like it exists today, so a caregiver who changes employers starts over and is re-screened on work already verified. The
record is what makes any new worker pool viable, and it improves with every shift worked.
<b>[TJ: confirm the name and scope of the verified worker record.]</b></p>

<p><b>The first population is health-professions students,</b> chosen because admission to their programs requires documented patient-care hours, which makes recruitment structurally inexpensive rather than a matter of wage competition. Health professions confer 263,800
undergraduate degrees a year,<sup>@nces2024</sup> entry into nursing, medicine, and physician
assistant training turns on documented direct patient care,<sup>@paeaStudent2025</sup> and our
own pilot drew more than 900 applicants. Nothing in the pathway is specific to students,
though: it is population-agnostic by design, and Aim 2 measures it in one market with a
health-professions campus nearby and one without, so the dependency is tested rather than
assumed. Every step a worker takes also writes to the record described in Key Innovation
3.</p>

<p class="sec"><b>Key Innovation 2: execution, not information.</b> The prevailing paradigm is that tools inform and families execute. Every step after the information is handed over is left to the family, and those are precisely the steps at which families are lost.</p>

<p>CareNavigator's agents perform that work and the family decides. The system operates
across the whole ecosystem in Figure 1 rather than across benefit programs alone: public aid,
insurance coverage, healthcare services, and long-term services and supports differ in what
they pay for and are alike in what they require, and it is that shared administrative sequence
the agents execute. A case runs from a detected need through eligibility and funding, a plan, the administrative work it requires, a provider with capacity, a caregiver to fill it, confirmed care, and what happened after. <b>The unit of success changes from information delivered to care established.</b> Agents that complete multi-step administrative work are being built across many industries; the general capability is not ours, the substrate they act on is. No competing effort holds a county-level record of what a given agency actually decided, so a general-purpose agent can draft an application and cannot tell a family whether this county's waiting list is open. That makes the outcome measurable, and saleable to an organization bearing the cost of unmet need.</p>

<p class="sec"><b>Key Innovation 3: a county-level record of what actually happens.</b>
Eldercare information exists in three layers, and almost everyone works from the first. The open web holds public directories and program rules, often neither accurate nor current, and equally available to any general-purpose AI system, which is why a chatbot can describe a benefit and cannot tell a family whether their county's waiting list is open.</p>

<p>Beneath that sit local program realities and provider truths that were never published: which office actually processes an application, what a program requires in practice rather than on its form, and which providers take which payment sources and have capacity. We assembled that layer through field work, expert curation, and direct outreach, into more than 72,000 records across all fifty states.</p>

<p>Beneath that sits a third layer that can only be learned by operating. For a specific
household in a specific county: what looked appropriate, what was submitted, what the agency
then asked for, where the process stalled, whether it was approved, how long it took, whether
provider capacity existed, and what care was established. <b>No public dataset holds it.</b>
NHATS is a survey; claims data record what was billed, not what was needed and refused.
Neither observes the interval between recognizing a need and care beginning, which is the
interval in which the system fails them.</p>

<p>Execution produces that layer, and it compounds: more families produce more executed cases, which produce more observed rules, capacity, and outcomes, which produce better navigation for more families. <b>What this project builds is
the first longitudinal, county-level administrative record of what older adults need, what
they qualify for, where the system fails them, and whether care was established.</b> A competitor who copies every feature begins with an empty database, and the measurement exists nowhere else for researchers or the state agencies that plan around it. We commit to publishing from it.</p>
"""
