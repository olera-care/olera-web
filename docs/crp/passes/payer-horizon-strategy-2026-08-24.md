# Payer horizon strategy: what sits one level above the marketplace

Status: strategy record from Logan's 2026-08-24 pressure-test session (thinking
work run while TJ drafts the Aims narrative). Not application text. Companion
visuals: `payer-horizon-visuals-2026-08-24.html` (internal thinking tools, not
grant figures). Ratification of the adoption list below is Logan's, with the team.

## Figures 8 to 11+: the Significance and Innovation sequence (2026-08-25)

The chain of reviewer questions the sequence answers, each figure leaving the
next one's question standing:

- Figure 7 ends on who pays. The reviewer thinks: someone already sells this.
  **Figure 8: But There Is Competition.**
- Figure 8 ends on a coverage gap. The reviewer thinks: academics have surely
  studied this. **Figure 9: And Related Academic Efforts.**
- Figure 9 ends on what is established and what is not. The reviewer thinks: so
  why has nobody done it? **Figure 10: And Hurdles to Adoption.**
- Figure 10 ends on the barriers. The reviewer thinks: what makes you able to
  get past them? **Figure 11: But We Have Three Key Innovations**, then one
  figure each.

### Figure 8, and why not a matrix

A competitive matrix was the obvious form and is wrong for this argument. A
checkbox grid frames the gap as missing features, which invites the reviewer to
conclude a competitor could add a column. The actual claim is about span: a
family travels from unmet need to a caregiver arriving, and every existing
service covers one stretch of that path and stops.

So Figure 8 is a coverage diagram. Five stages across the top (assess needs,
find aid and insurance, match providers, establish care, staff the care), one
bar per category of alternative, and bar length encodes how far that category
carries a family. Where each bar ends is the argument, and the note explaining
why it ends sits in the gap the bar leaves. Length and position both carry
meaning, so this is not chart cosplay. Rows are ordered by where each bar starts,
which produces a staircase and reads as movement along the path.

Categories and the honesty decisions behind each:

- **Public information services** (Eldercare Locator, BenefitsCheckUp): solid
  through find-aid, then a dashed extension through establish-care labeled
  "bounded by staff capacity." The references file explicitly warns against
  calling these information-only, because NCOA's Benefits Enrollment Centers and
  the Locator's Certified Information Specialists give real hands-on help. The
  accurate distinction is that screening serves anyone while assistance is
  bounded by staff and funding, and the dashed segment states exactly that.
- **General AI assistants**: included because a reviewer will ask. They reach
  match-providers and stop; the note is "answers questions; cannot file, follow
  up, or confirm." CP Section 5 frames these as interoperability rather than
  competition, which the figure does not contradict.
- **Human navigators**: the longest bar, covering four of five stages, with
  "excellent, scarce, episodic." They are the quality benchmark, not a foil, and
  the figure says so.
- **Referral marketplaces**: match and establish only, with "aid and insurance
  skipped; placement fees decide who is listed" sitting in the two stages they
  never touch (`wapoAPFM2024`, `caseyAPFM2024`, CP Table 7).
- **Staffing channels**: the last stage only, with "moves workers between
  employers; the shortage does not shrink," which is RS Table 2's sharpest row.

Provider-side tooling (eldercare CRMs, advertising channels) is deliberately
absent: the figure's frame is the family's path to established care, and those
vendors sit outside it. They remain in CP Table 7 and RS Table 2.

The benefit is stated, not implied, twice: inside the green bar ("One system
carries the family the whole way, and adds the caregivers the last step needs")
and in the closing line ("The advantage is coverage, not features. Every
alternative solves one stretch of the path and stops at the handoff that loses
families.").

### Material gathered for Figures 9 to 11

Figure 9 will be built from verified references only. Available and relevant:
CAPABLE (`szanton2021`, `szanton2018`) for home-based function-focused support
reducing disability and Medicaid spending; the unmet-need literature
(`freedmanSpillman2014`, `hass2017`, `depalma2013`, `unmetNeedsSR2024`) for the
cycle Figure 1 draws; Olera's own peer-reviewed platform work (`fan2023`,
`fan2024`, `dubose2024`, `hoang2026`) and the CARE-NAV evaluation
(`careNavTAS2026`, unpublished, manuscript in preparation); the pre-health
patient-care-hours literature (`paProgramPCE`, `paeaStudent2025`, `nces2024`)
for the workforce pathway. Anything beyond this set requires verification before
it appears in a figure, and the figure must not manufacture differentiation
where academic groups are doing similar work.

Figure 10 has ratified source material in two places that should be reconciled
rather than reinvented: CP Section 5's four acceptance hurdles (provider
conversion after bad experiences with per-lead models, student caregiver safety,
family trust in AI navigation, campus-by-campus dependence) and the RS's
Significance close, which names local density as the primary hurdle (families,
providers, and workforce concentrated in one market at a cost that market's
revenue sustains). The RS hurdle is the load-bearing one and the CP's four are
specific; the figure should keep hurdle and response visually distinct so the
reviewer sees that each barrier has an experiment attached.

## Figure 12: Key Innovation 1 (2026-08-25)

Three beats in one composition: two parallel tracks over the same five steps,
with the difference between them being where the family ends up.

**What exists today** is the top track. The first step is filled, because
today's tools genuinely do identify aid. The next three are dashed and empty,
because the family executes them alone, and two red arrows drop out of the track
at the two points where Aim 1 says families are actually lost: while executing
the application, and again after filing while waiting for a decision. Both
drop-off points come from Preliminary Work, not from a general claim about
navigation. "Care established" on that track is dashed, because it is the
outcome many never reach. **No quantities appear anywhere**: Preliminary Work
establishes that families are lost at those two points but does not give
percentages, and a funnel with invented numbers would be the easiest thing on
this page for a reviewer to break.

**What we do differently** is the bottom track: the same five steps, all
carried, ending in a filled endpoint. The mechanism line states it without
adjectives: agents prepare, gather, schedule, and follow the case to a decision,
then confirm care started. The left-hand labels carry the real contrast, "tools
inform; the family executes" against "agents execute; the family decides." That
second half matters for the trust hurdle in Figure 10: agents do the work, the
family keeps the decisions.

**Why it matters** is the closing band: the unit of success changes from
information delivered to care established, the same families already arriving
convert instead of falling out, and every completed case teaches Key Innovation
3. The middle claim is the commercially load-bearing one, because it means the
innovation improves yield on demand we already have rather than requiring more
acquisition spend.

**Live versus proposed** is stated on the figure rather than left to inference:
the multi-agent system was evaluated with 31 dementia family caregivers
(`careNavTAS2026`, manuscript in preparation), and the CRP builds the execution
and follow-up loops and verifies them against blinded expert review. The
evaluation is done; the execution loop is the work being funded. The technology
acceptance score is deliberately left off the figure, since an unpublished
number invites a question the figure cannot answer in place.

## Figure 11, and why the three are not three peers (2026-08-25)

The lazy version of this figure is three equal boxes in a row, which would be
false. Key Innovations 1 and 2 are the two systems that act, and they are the
two capabilities Figure 5 already showed the reader. Key Innovation 3 is what
they run on and what they write to: navigation reads which programs actually pay
and writes back what each case decided; the workforce reads where capacity is
short and writes back placements and retention.

So the architecture is two above, one wide beneath, joined by bidirectional
arrows. The deliberate echo of Figure 5 is the point: the reader recognizes the
two capabilities and then sees the thing underneath them they had not been shown
before. The database earns its place visually by being the only element that
touches both.

The three at the level this figure states them:

1. **AI-assisted navigation.** Agents complete the work: applications,
   documents, follow-up, and confirmation that care started. The mechanism is
   completion, not answering.
2. **New caregiver workforce.** Capacity created rather than moved, through a
   pathway students' careers already require.
3. **Aid, provider, and outcomes database.** What programs actually decide,
   county by county, learned from completed cases and never published on the
   open web.

The closing line is the moat argument stated plainly: "The first two are what we
do. The third is what makes doing it repeatedly hard to copy: it can only be
built by executing cases, and it sharpens with every family served." This is
drawn from RS Key Innovation 3's own paragraph (a competitor who copies the
features starts with an empty database) rather than invented here.

**Held back for Figures 12 to 14, deliberately.** Nothing on this figure states
what exists today or why each difference matters, because that is the three-beat
each innovation figure owes: what exists now, what we do differently, why the
difference matters. Figure 11 only has to make the reader want those three
figures. The discipline Logan named applies there: an innovation is not
innovative because it uses AI, holds a database, or recruits caregivers, so each
figure has to land on a mechanism, and the mechanism has to be one an existing or
emerging competitor cannot simply adopt.

## Figure 10, and the two hurdle framings it reconciles (2026-08-25)

We had two ratified hurdle statements that had never been put in the same place.
The RS Significance close names one primary hurdle: local density, meaning
families, providers, and workforce concentrated in the same market at a cost
that market's revenue sustains. CP Section 5 names four acceptance hurdles:
provider wariness after per-lead and per-placement models, student caregiver
safety, family trust in AI navigation, and campus-by-campus dependence.

Figure 10 treats the RS hurdle as the container and the CP four as what sits
inside it, which is how they actually relate: each of the four, unresolved,
stops one of the groups from concentrating. The primary hurdle is a full-width
red band across the top; the four sit beneath it as columns tagged by whose
adoption they block (providers, families, workforce, every market).

Hurdle and response are kept visually distinct by color rather than by label:
red block above (the barrier, in the house grammar Figures 1 and 3 established
for the problem), green block below (what we do), with an arrow between them.
Each response block ends with the aim that measures it, below a divider, so the
reviewer sees that every hurdle has an experiment attached rather than a
reassurance:

- Providers wary of platforms → start free, pay after value. **Aim 3**:
  conversion and churn under real billing.
- Families trusting AI with care → expert-curated database, audited. **Aim 1**:
  acceptance validated under IRB.
- Student caregiver safety → licensed providers hire, train, insure, supervise.
  **Aim 2**: the pathway measured end to end.
- Each market repeating affordably → self-service portals and a documented
  playbook. **Aims 1 and 2**: acquisition cost per market.

Closing line: "Each of these is an uncertainty the aims are built to measure,
not a risk to be argued away." That is the handoff into Figure 11, which answers
what makes the measurements come out our way.

**Conflict found while mapping the aims, not resolved here.** The number of
markets the CRP opens is stated three different ways in ratified documents:
Specific Aims says "the twelve markets," CP Section 5 says "The CRP targets 12
counties and approximately 300 paying providers," and CP Section 9 says "The CRP
opens all 18 markets early: 5 in Year 1 and the rest by the end of Year 2." The
Aims page is locked, so this is flagged rather than edited. Figure 10 avoids the
number entirely, saying "each market." Note the Figure 7 pressure test above
used 18 markets from CP Section 9 for its national scaling check; if 12 is
correct, that check becomes more conservative, not less.

Vocabulary note: the Aims name the provider products "Managed Ads" and "Staff
Recruitment," while the figure set uses "Caregiver Staffing" and dropped the
client-growth products entirely. Figure 10 refers to what is tested rather than
to product names, which sidesteps the drift README section 10 already flags.

## Figure 9, and the honesty problem it had to solve (2026-08-25)

The trap in a "related academic efforts" figure is manufacturing distance from
work we are actually part of. Olera has four peer-reviewed studies of its own
platform; pretending the academic landscape is something happening elsewhere
would be both false and easy for a reviewer to check. So the figure puts our own
work inside the established column, on the digital-caregiver-tools row, and says
so ("including our published work").

Form: two panels per strand, established on the left in solid blocks, open on
the right in dashed blocks, using the house grammar where dashed means not yet
settled. Our response sits in green under each open question, so the reviewer
never has to infer the relationship. A chevron between the panels makes each row
read as movement from settled to open rather than as a table cell pair.

The five strands and the reference each rests on:

1. **Unmet need research** (`freedmanSpillman2014`, `hass2017`, `depalma2013`,
   `unmetNeedsSR2024`). Established: unmet ADL and IADL need predicts emergency
   visits, readmission, and placement. This row exists to show restraint: we
   claim no novelty here, and the response states the Qiping boundary in the
   figure's own words, that we measure care established rather than clinical
   endpoints.
2. **Home-based support trials** (`szanton2021`, `szanton2018`). CAPABLE proves
   the value of getting support into the home and that the savings exceed the
   program cost. What it does not solve is how a family outside a trial finds
   and funds that support, which is exactly our front door.
3. **Digital caregiver tools and AI** (`fan2023`, `fan2024`, `dubose2024`,
   `hoang2026`, `careNavTAS2026`). Established: these platforms can be built and
   measured as usable and accepted. Open: whether AI agents can complete
   applications and follow a case to decision, which is Key Innovation 1.
4. **Payer-funded navigation** (`cmsGuide2024`, added to `references.yaml` this
   session). Established: Medicare pays for care navigation, caregiver support,
   and respite in dementia. Open: whether navigation beyond dementia is paid the
   same way, which is what the emerging revenue in Figures 6 and 7 rests on.
   **Verification note:** the CMS model page returns 403 to automated fetching,
   so the entry was verified against the AHA news report of the launch, and the
   participant count is deliberately not stated anywhere because the 2026-07-08
   announcement was reported both as 390 organizations and as "over 400."
5. **Health-professions pipeline** (`paProgramPCE`, `paeaStudent2025`,
   `nces2024`). Established: admission requires documented patient-care hours.
   Open: whether that requirement converts into durable eldercare capacity,
   which is Key Innovation 2.

Deliberately absent: academic dementia care navigation trials such as the Care
Ecosystem and D-CARE. They are real and relevant, but nothing about them is in
`references.yaml` and the citation invariant forbids putting an unverified
program name in a figure. GUIDE carries the payer-funded navigation strand until
those are verified. **Open item:** verify one or two academic navigation trials
and decide whether they earn a sixth row or replace the GUIDE row's framing.

The closing band, "Much of the science is settled. What remains open is
operational: whether execution and new capacity can be delivered where families
actually live," is the handoff into Figure 10. It converts the academic question
into an adoption question, which is what the hurdles figure answers.

## Pressure test of the Figure 7 economics (2026-08-25)

Logan asked whether the illustrative per-county economics would survive a
challenge. They would not have. The findings, and what changed:

**1. The figure contradicted the Commercialization Plan by roughly 17x.** CP
Section 9 states the ratified per-market economics: one market is one county,
mature revenue is about $2,500 a month (about $30K a year), entering cost about
$30K, and the whole company reaches about $0.87M a year across 18 markets by the
end of the award, about $2.8M at roughly 70 markets by 2037 self-funded, about
$5.7M at roughly 180 markets with growth capital. Figure 7 claimed about $500K
per county per year. The beachhead row alone, at about $60K, was already double
the CP's entire mature-market revenue. A reviewer reading both documents finds
the contradiction immediately, and the CP is the ratified number.

**Fix:** the beachhead row is now about $30K per county per year, matching CP
Table 9 exactly: about 25 paying providers at about $100 a month equivalent.
Note the modeling nuance: CP Table 9's $2,500 a month covers three provider
products (Staffing, Boost, Conversion), while the figure shows only Caregiver
Staffing. Attributing the full ratified figure to Staffing alone is the
conservative choice for the figure, but if Boost and Conversion stay in the CP,
per-county provider revenue splits among the three rather than adding to them.

**2. Provider count and per-hire price both hold up.** About 25 paying providers
per county is consistent with the CP's own about 1,500 paying providers across
about 70 markets (about 21 per market), and with roughly 165,000 providers
nationally across roughly 3,100 counties (market-denominator note, section 2).
The about $500 per hire price is well anchored: the median caregiver acquisition
cost in the same note is $520 (`caregiverCAC2025`). At about $100 a month
equivalent, we are assuming roughly two to three hires per provider per year
through Olera, a small share of the hiring a provider with 75% turnover does. It
is conservative by construction.

**3. The episode volumes assumed near-total sponsor penetration.** The old set
had 1,000 sponsored episodes a year in one county, which required an MA plan, a
Medicaid MCO, a health system, an employer, and an aging agency all under
contract simultaneously and at full volume. Cut to 250 episodes (120 + 50 + 80),
roughly 4% of the high-need older adults in a mid-sized county (about 250K
residents, about 45K aged 65+, of whom perhaps 6,000 have significant unmet LTSS
need in a year). That is a defensible at-maturity ceiling rather than an
assumption of universal contracting.

**4. Double-counting risk was real and is now stated on the figure.** MA plans,
Medicaid MCOs, and health systems are not disjoint populations: the same
discharge for the same person could plausibly be sponsored by a plan or by the
system that discharged them. The figure now says "Each episode is counted once,
under the sponsor that pays for it." A second modeling artifact stays flagged
here rather than on the figure: MA and Medicaid contracts are signed at plan
level, not county level, so per-county attribution is an allocation by member
volume, not a sales unit.

**5. National scaling now lands in a defensible place.** At the old numbers,
every US county at maturity implied about $1.6B a year, and the CP's own 2037
capital case is $5.7M. At the revised numbers, about $170K per county gives
about $30M a year across the CP's 180-market capital case and about $530M if
every county in the country were mature, under 0.1% of the roughly $553B care
economy. Large, but no longer arithmetic a reviewer can puncture.

Per-segment revisions: MA about 120 episodes at about $400 (about $50K);
Medicaid MCO about 50 at about $500 (about $25K); health systems about 80 at
about $200 (about $15K); employers one contract (about $25K); public aging
agencies about $25K per contract. County total about $170K, of which about $30K
is the validated beachhead and about $140K depends on outcomes evidence this
project produces. That split is now stated in the figure's signpost, which points
to CP Section 9, Tables 8-9, and Figure 10 for the underlying build.

## Innovation numbering corrected (2026-08-25)

The Figure 5 signpost shipped with the stale Innovation order taken from
`research-strategy.md` (working snapshot, 2026-08-17). The ratified order is in
`strategic-context-2026-08-20.md` section 5, decision 3: **AI navigation,
database, workforce**, and it explicitly notes README section 10 is stale on
this. Logan then set the order himself: the signpost reads Key Innovation 1
(AI-assisted navigation), Key Innovation 2 (new caregiver workforce), Key
Innovation 3 (aid, provider, and outcomes database). Note this swaps the
database and workforce positions relative to the strategic-context shorthand
("AI navigation, database, workforce"), so the Innovation section itself must
end up in the order the figure now states.

**Open item for whoever finalizes Innovation:** `research-strategy.md` still
carries the old numbering and calls KI 3 "a proprietary national resource and
outcomes database." The Aims page says "aid, services, and providers over an
expert-curated national database." The figure now uses Logan's "aid, provider,
and outcomes database." These three should converge on one name before
submission.

**Vocabulary flag, not fixed:** Figure 6's second customer block is labeled
"Insurance and healthcare organizations," but Figure 7's emerging rows include
self-insured employers and public aging agencies, which are neither. Figure 4's
band says "providers, insurers, and public programs." One of the two should
move. Recommendation: Figure 6 becomes "Insurers, health systems, and public
programs," which matches Figure 4 and covers everything in Figure 7 except the
employer row. Left for Logan because it changes which segments Figure 6 implies.

## Figure 5 signposts the Innovation section (2026-08-25)

One gray line under the two capability boxes: *"Developed in Innovation: Key
Innovation 1 (student caregiver workforce), Key Innovation 2 (AI-assisted
navigation), Key Innovation 3 (the outcomes database behind both)."* It tells a
reviewer that the figure is a summary, not the whole argument, and it names the
one innovation the figure cannot show. Figure 5 has two boxes; the Innovation
section has three innovations, and the third, the national resource and outcomes
database, sits under both capabilities rather than inside either. Naming it in
the signpost is the honest way to say there is more.

Numbering verified against `research-strategy.md` (KI 1 workforce, KI 2
navigation, KI 3 database) as of 2026-08-25. **Dependency:** README section 10
records that the Innovation order has been renumbered once already and that the
Key Innovation 1 lock predates the reorder. If Innovation is renumbered again,
this line changes with it. If that churn continues, drop the numbers and name
the three innovations instead.

## Figure 4 answers the marketability question (2026-08-25)

The solicitation asks applicants to "explain how the proposed project will lead
to a marketable product, process, or service." Figure 5 now answers it in one
concluding statement, placed at the end of Figure 4 rather than inside Figure 5:
**"Care that gets established creates value for everyone the cycle harms, and
the providers, insurers, and public programs that absorb its cost will pay for
it."** The logic is the one Logan stated: breaking the vicious cycle is itself
the marketable thing, because establishing preventive geriatric care creates
value for every participant that bears the clinical or economic consequence of
unmet need.

Placement matters. The statement first sat under Figure 5's two capability
boxes; Logan moved it to Figure 4, where it primes marketability before the
product appears, and leaves Figure 5 lighter so the reader looks at
CareNavigator. It also lands where its subject already is: Figure 4's third box
is care established and the cycle broken, so the band states what that outcome
is worth. It sits in a band spanning all three boxes, with a short arrow down
from the outcome box, and it hands the reader into Figure 5 already knowing the
solution is worth something.

The Care Navigation differentiators were rewritten to state the three things
that separate CareNavigator from a directory or a referral marketplace:

- *Open online to any family, no referral or eligibility gate.* Broad access.
  Contrasts with plan-sponsored or program-gated navigation, which serves only
  the members or beneficiaries a sponsor refers.
- *Eldercare LLM assesses needs and means; AI agents execute until care starts.*
  Assessment and execution in one system, ending at care establishment rather
  than at a list of options. This is the differentiator no directory has.
- *Coordinates public aid, insurance, healthcare, and LTSS, not just private-pay.*
  Full-ecosystem coordination. Contrasts with referral marketplaces, whose
  placement-fee economics limit them to private-pay providers who can pay.

Truthfulness flags carried forward: the Eldercare LLM, the agentic execution
loop, and care-establishment tracking are CRP work, in development, not live
features. The figure states them as capability claims in the same present tense
as the rest of the set; if the set is ever required to distinguish live from
proposed, that is a change across all seven figures, not this one bullet.
Workforce bullets held at three lines so the two sides stay balanced.

## The structural fact everything else rests on

The commercial rule is "no provider pays for a referral." It constrains the
supply side only. Institutional payers (MA plans, Medicaid MCOs, health systems,
employers) are not a third side of the market: they are sponsors of the demand
side, paying for navigation on behalf of families they are financially
responsible for, the way employers sponsor Wellthy and CMS sponsors GUIDE.
Neutrality survives because nothing about what families see or how providers
rank ever changes; money enters on the side with no steering incentive.
(Diligence flag, parked: payer-funded navigation that produces provider
connections gets an anti-kickback review before any contract is signed;
plan-paid care coordination is an established category.)

## Payer mechanics (plausible categories only)

- **Medicare Advantage plans.** Capitated; avoidable utilization is their cost;
  stars and retention are revenue. They would send defined cohorts (post-
  discharge, ADL-flagged, dual-eligible candidates) into the navigation loop and
  receive back the establishment record (care in place, date, services, benefit
  dollars secured; dual qualification is an existing paid vendor category).
  Entry contract: case rate per completed navigation episode; PMPM at scale.
  Evidence to sign a first pilot: operational, not RCT-grade. Establishment
  rate, time to care, cost per episode, member experience, reliability in their
  counties. That is the Aim 1 evidence package.
- **Medicaid MCOs and state aging agencies.** Strongest economics: institutional
  care costs Medicaid roughly 2-3x home and community care; every state has a
  rebalancing goal; waivers go underused because navigation is broken; our
  staffing product addresses the capacity constraint on their side too. Case
  rates per completed establishment; procurement runs 12-24 months, which is
  exactly why this is post-CRP revenue.
- **Health systems and ACOs.** The discharge planner's daily problem is our
  sentence: reaching a provider with capacity to start. Delayed discharges cost
  bed-days now; readmissions cost penalties. Per-episode navigation fee paid by
  the system; the receiving provider pays nothing.
- **Self-insured employers.** Real category (Wellthy, Homethrive comps), PEPM,
  broker-mediated cycles. Later horizon, one CP line.
- **Anchor precedent:** CMS GUIDE (July 2024, 390 organizations) means the
  largest payer already prices navigation episodes. GUIDE participants owe
  community-connection they mostly cannot operationalize: channel, not
  competitor.

## Answers to the four questions

1. **What are we building, one level up?** The system that establishes care and
   proves it: a capacity-aware map of the supply side, execution machinery from
   need to start, and the confirmed record of the outcome. The marketplace is
   the chassis that makes navigation completable; the completion records are
   what institutions will pay for. "Infrastructure" is earned only when other
   actors route through it; today only families and providers do. Claim the
   trajectory, not the noun.
2. **How do payers plug in?** Operationally: defined cohorts enter the same
   loop; the establishment record returns. Economically: case rates first, PMPM
   at scale, outcomes-linked later. Structurally: demand-side sponsors, never
   buyers of placement.
3. **Does the outcome / economic value / replicability broadening strengthen or
   dilute?** The logos already is that triad: outcome = H1; economic value =
   H2/H3/H5/H6; replicability = the twelve-market playbook. Adopt it as the
   award-end framing at zero design cost. It dilutes only if clinical
   utilization outcomes become tested endpoints or payer revenue becomes a
   tested hypothesis. Neither survives the constraint check (claims data,
   comparison groups, counterparty procurement cycles).
4. **Three years vs beyond: the bright line.** Measurable from our own platform
   records or participant self-report = CRP. Requires claims data or comparison
   populations = post-CRP hypothesis, addressed to the payer whose data answers
   it; the first payer pilot IS that study, co-funded by the payer.

## Adoption list (pending ratification)

- **Add "time to established care" as a headline Aim 1 metric.** The measurable
  face of "earlier, before needs cascade"; pure telemetry once the follow-up
  loop exists; the number every payer conversation opens with. Discipline: we
  report our own distribution and improvement, never a counterfactual claim.
- Award-end story framed as outcome / economic value / replicability (CP
  "Value, outcomes, impact" section structure).
- CP gains one payer-horizon passage: demand-side sponsor logic, GUIDE
  precedent, case-rate entry model; optionally one payer LOI or pilot MOU as a
  Year 2-3 commercialization activity (never a research aim).
- One CP sentence each: telemetry/data asset compounding; self-insured
  employers as later segment.
- **Aim 3 packaging experiment (Logan, 2026-08-24 visuals review):** for Staff
  Recruitment, flat monthly subscription vs fee per placement is itself one of
  the pre-registered pricing experiments, not a pre-decided choice.
- Free-rider answer on record: the platform is free to all by design; sponsors
  buy accountable completion for a defined population (outreach, follow-through,
  verification, returned documentation), not access. Plans that point members at
  the free site still grow the marketplace at near-zero cost to us.
- Buyer-scope answers on record: traditional Medicare enters via CMS models
  (GUIDE), not sales; commercial insurance enters as employer caregiver
  benefits because the older adult is usually not the commercial member.

## Resolved definitions (conceptual alignment round, 2026-08-24)

- **Aid vs insurance boundary.** Legal categories blur (Medicaid is both; MA
  supplemental benefits are aid-like things inside insurance). The functional
  cut is what the family must do to unlock the money: aid-shaped resources
  require qualifying and applying (VA pension, SNAP, waivers); coverage-shaped
  resources are already held but unused (Medicare, MA benefits, LTC policies);
  family funds are the third source, and real cases combine them. Figure 1 maps
  the actors; Figure 2 maps the unlock mechanics.
- **Care established, defined.** The resource actually begins and we confirm it
  with a record. Per category: a basic-needs benefit is approved and first pays
  out; a coverage benefit is activated and first used; healthcare has its first
  completed visit; personal and long-term care serves its first shift or
  completes move-in. Identified and referred do not count. Family-level
  measures: share of identified needs established, time to first establishment.
  Partial success is the expected case.
- **No dead ends (fallback rule).** Not eligible: switch funding routes or step
  down to a community alternative. No capacity: alternative service or managed
  waitlist with scheduled re-checks. Nothing fits: the family leaves with a
  plan and a re-check date. A plan alone never counts as established.
- **What institutions buy (no gating).** The free site cannot serve an
  institution even in principle: it cannot start itself (outreach to a named
  list), cannot report back (consent, matching, data agreements), cannot commit
  (service levels, dedicated staffing), cannot prove population results.
  Institutions buy initiation, integration, accountability, and evidence, never
  access. External proof: 211 and BenefitsCheckUp are free and long-standing,
  yet plans pay Unite Us, findhelp, and Wellthy-type vendors for outreach,
  closed loop, and reporting; GUIDE pays for delivered navigation with
  reporting obligations. Residual uncertainty is price, which is post-CRP.
- **Students parked out of thinking figures** (Logan). The workforce innovation
  is real but distracts from the coordination architecture. It remains in the
  logos (H4) and the Aims; it returns to figures when the fundamentals are
  settled.
- **Traction metrics removed from the architecture figure.** Monthly visitors
  and onboarded provider counts are evidence, not architecture.
- Figure 2 rebuilt around branches (three funding routes, four establishment
  outcomes, fallback band). The earlier pain row and revenue row were dropped
  from that figure to keep it to one question; the money question lives in
  Figure 3.

## Round four: convergence to two figures (Logan, 2026-08-24)

- The figure set converged to two, per Logan's direction: (1) the ecosystem
  plus an archetypal family journey through it, one page; (2) who pays and why.
- The journey is told through artifacts, not process boxes: the family's own
  words, the persistent family profile, the assessed domains, the care and
  funding plan (need, what pays, next step), execution, and tangible outcomes.
  Family approval is a checkpoint on an arrow, not a box. Persistence is a
  loop line, not a step.
- **New named concept: the persistent family profile.** Built once, reused,
  never re-asked; the plan updates as needs, benefits, or providers change
  instead of starting over. This is new to the working model and matters
  downstream: it is the consent anchor for the IRB design, the substrate of
  the longitudinal data asset, and the mechanism behind follow-up and
  re-engagement in Aim 1. Needs verification against what the platform
  actually persists today before any application claim.
- **CareNavigator drawn as a capability layer, not a step**: the website and
  app, AI agents that prepare and file, automated communications, and human
  navigators when judgment is needed, working beneath every step of the
  journey. This framing matches how the technology should appear in the RS.
- Logan's direction of travel: the concrete workflow should dictate the
  abstraction (marketplace, platform, infrastructure), not the reverse. The
  category label question is deliberately deferred.

## Figure 5 carries the differentiators; Figure 6 refined (Logan, 2026-08-25)

- **Figure 5 now answers "what is different about each half," not just "what is
  it."** Each capability box gained a divider and three one-line
  differentiators, replacing the generic activity description that overlapped
  them. Logan's restraint instruction was explicit (no bullet lists, no
  buzzwords, prefer mechanisms over adjectives), so each line names a mechanism
  and each contrasts with a real alternative documented in CP section 2.
  - **Care Navigation:** files the applications and follows through until care
    starts (vs. Eldercare Locator, BenefitsCheckUp, and AAAs, which inform and
    screen but do not execute); covers public aid and insurance, not only
    private-pay services (vs. referral platforms limited to in-network
    private-pay); no referral fees, so every provider is listed (vs. the
    placement-fee model that biases recommendations).
  - **New Caregiver Workforce:** adds new workers instead of competing for the
    same pool (vs. staffing agencies drawing on the same constrained labor
    pool); new cohorts arrive every season, so the pipeline refills (vs.
    one-time placement against ~75% annual turnover); providers hire, train,
    and supervise, so care stays licensed (the safety and compliance answer).
- **These six lines are the seed for the Figure 8 competitive figure.** Each one
  is already a differentiator stated against a named class of alternative, so
  Figure 8 can put the alternatives on one axis rather than inventing new
  claims.
- **Truthfulness flag for prose migration:** "files the applications and follows
  through until care starts" describes the execution and follow-up loop, which
  is CRP work, not a live feature. Figure 5's title ("Olera Is Building
  CareNavigator") carries that, but any prose derived from these lines must
  preserve the live / in development / proposed distinction.
- **Figure 6 refinements:** subtext in both customer blocks unwrapped to single
  full-width lines, and the caregiver trio removed from the spine with the
  compass enlarged and centred, rather than forcing a second icon into a narrow
  column.

## Figures 6 and 7: the handoff into the business model (Logan, 2026-08-25)

- **The handoff device.** Figure 5 ends with one system and two capabilities,
  both of which cost money to run while families never pay. Figure 6 therefore
  inverts Figure 5's fan: where Figure 5 showed one system branching down into
  two capabilities, Figure 6 shows two customers paying up into one system.
- **The structural argument that makes it inevitable: each capability has its
  own customer.** Caregiver Staffing is the workforce capability monetized, and
  providers buy it because they cannot serve the families navigation sends them
  without caregivers. Sponsored navigation is the navigation capability
  monetized, and institutions sponsor it because unmet needs become their costs.
  Neither solution is a cost center waiting for outside subsidy.
- **Roadmap version rejected and replaced (Logan, 2026-08-25).** Logan's verdict
  on the roadmap was blunt and correct: it picked a chart grammar for
  information that is not quantitative. The bands had no y-value and their
  length carried no meaning beyond one start offset, so it was a chart shape
  wrapped around two text boxes with most of the canvas dead, violating the
  house rules against containers that exist only to hold sentences and against
  leftover rather than intentional whitespace. **Lesson for the house style:
  borrowing the look of a chart without the substance of one is a recognizable
  failure mode; match the grammar to the shape of the information.**
- **Replacement: a value-exchange map.** A business model is an exchange, and
  Figure 2 already established the house device for exchange, the paired
  directional arrows with give and get labels. Figure 6 now applies that device
  to money: a tall CareNavigator spine on the left carrying both capability
  icons and "Free for families, always."; two customer blocks stacked on the
  right; and between them, for each customer, a rightward arrow labeled with
  what we deliver and a leftward arrow carrying a coin and labeled with what
  they pay. Solid for the beachhead, dashed for the emerging buyers. The
  composition is a two-row exchange ledger with a shared spine, which is
  distinct from every other figure while reusing established vocabulary.
- **Superseded note (the roadmap description below is retained for the record).**
- **Figure 6, first version, roadmap (superseded).** The first
  version repeated Figure 5's box-and-arrow grammar and read as a variation of
  the same slide. Every figure through 5 is a diagram (horizontal sequence in
  1 and 4, radial in 2, two-column contrast in 3, Y-fan in 5), so the unused
  grammar, and the one that fits "who pays and when" best, is chart-like: two
  revenue bands laid on a time axis. After five diagram pages it reads as
  turning the page to the business.
- **How it encodes the argument.** A full-width slab across the top names what
  the revenue must sustain (CareNavigator, both capabilities, free for families
  always). Below it, the beachhead band starts at Today and runs the full
  width; the emerging band starts partway across and runs to the end, so the
  horizontal offset *is* the temporal claim rather than a label asserting it. A
  dashed gate line at the offset ties both to the axis tick, "Preventive
  geriatric care outcomes demonstrated." Each band carries the customer, what
  they buy, and one reason. A solid coin sits on the beachhead band's origin
  and a dashed coin on the emerging band's, marking where each revenue stream
  begins. The trio and compass icons carry over so each customer visibly buys
  the capability it maps to.
- **Sequence pacing after the redesign:** 1 paired boxes, 2 radial ecosystem
  (deliberately the densest page, since complexity is its argument), 3
  two-column contrast, 4 three-box sequence, 5 Y-fan with a hero, 6 roadmap
  chart, 7 table. Intentional variation inside one palette, type scale, and
  icon set.
- **Figure 7 is the audit layer**, rebuilt to Logan's column spec: customer
  segment, why they pay, Olera offering, payment model, illustrative economics.
  Two bands separate beachhead from emerging so no stream reads as equally
  mature. Six segments, an illustrative county total of ~$500K+, and a footnote
  carrying the neutrality rules and the pricing anchors. This is also the
  artifact that answers the solicitation's market-segment-and-customers
  requirement.
- **Reconciliation completed.** The long-standing flag that Figure 7's table
  contradicted the figure set is now closed: the Client Growth Services row is
  gone (the product left the model in August), band naming matches the
  beachhead/emerging vocabulary, and every row's offering matches what Figure 6
  shows.
- **Open, Logan's call:** the two-layer revenue-over-time trajectory from the
  retired commercial figure is not in the new pair. Figures 6 and 7 answer who
  pays and why but not "how large could this become." If that question needs a
  visual, the trajectory is the candidate and would be a Figure 8.

## Figure 5 built: the product introduction (Logan, 2026-08-25)

- **Seven-page sequence now.** 1 vicious cycle, 2 navigation requirement,
  3 capacity bottleneck, 4 therefore both are needed, 5 the product,
  6 how it gets paid, 7 the detail table. Figures 4's title gained "Therefore,"
  at Logan's direction, making the deductive chain explicit.
- **Figure 5's job, deliberately narrow:** show that CareNavigator is the one
  system providing the two requirements the reader has just accepted. Not a
  feature tour, no traction metrics (per the standing figures rule), no
  commercial content.
- **Composition:** the product on top (the app mockup retired from Figure 2,
  scaled up as the hero, with the CareNavigator by Olera wordmark), two arrows
  fanning down to two capability boxes. Left reuses the compass and is titled
  Care Navigation; right reuses the caregiver trio and is titled New Caregiver
  Workforce. The italic subtitle under each answers the earlier figure by
  echoing its title: "navigates the complex eldercare ecosystem" (Figure 2) and
  "relieves the caregiver-capacity bottleneck" (Figure 3). One concrete
  sentence each states what the capability actually does.
- Figure 3's workforce-pools line (Students, Career changers, Gig workers,
  Retirees) removed at Logan's direction; the pools remain recorded in the
  removal log and in CP section 2.
- **Truthfulness note for prose migration:** the figure says Olera *is
  building* CareNavigator, which is the honest framing. The navigation
  platform is deployed, the execution and follow-up loop is CRP work, and the
  workforce program has a completed pilot. Any prose derived from this figure
  must preserve those distinctions rather than implying the whole system is
  live.

## Product introduction deferred; Figure 2 becomes the navigation problem (Logan, 2026-08-25)

- **Strategic decision: the reader should understand why the product must
  exist before seeing the product.** Figures 1 through 4 now argue the problem
  and the required shape of a solution in generic terms; CareNavigator is not
  named until Figure 5.
- **Figure 2 retitled** "To Break the Cycle, You Must Navigate a Complex
  Eldercare Ecosystem." The center is now **Care Navigation**: the app mockup
  and the CareNavigator by Olera wordmark are replaced by a compass inside the
  same five-step ring. The ecosystem, the exchange arrows, the four
  stakeholder boxes, and the step vocabulary are unchanged.
- **Figure 2 now ends in the green cycle, not the red one.** The dashed red
  arrow to the vicious cycle becomes a solid green arrow to the positive
  cycle (Needs met, Stays home, Care in place, dotted exit to less long-term
  care placement), in the same top-right position. Figures 1 and 2 now mirror
  each other exactly: same family, same gesture rightward, opposite outcome.
- **Vocabulary consequence, applied deliberately:** the product was also named
  in Figures 3 and 4, which would have made a Figure 5 "introduction"
  incoherent. Figure 3's caption is now "Care navigation aggregates family
  demand" and Figure 4's first box is "Care Navigation." The compass now
  appears inside Figure 4's navigation ring as well, so one symbol carries
  navigation across the set. Verified: "CareNavigator" appears only in
  Figure 5.
- **Figure 4 keeps the full green cycle** rather than condensing it. The two
  appearances do different work: in Figure 2 the cycle is the target that
  navigation aims at (smaller, no house icon); in Figure 4 it is the achieved
  result of navigation plus capacity (larger, house icon, titled). The house
  icon is the visual marker of the difference.
- **Open: whether a dedicated product-introduction figure earns its place.**
  Recommendation recorded for Logan's decision, not yet built.

## The vicious cycle gets its own opening figure (Logan, 2026-08-25)

- Figure 3 retitled to name the turn in the argument rather than the fact:
  "Navigation Alone Encounters a Major Caregiver-Capacity Bottleneck"
  (was "A Major Bottleneck Is the Caregiver Shortage").
- Logan's diagnosis: the ecosystem figure was carrying two introductions at
  once, the needs older adults face and the ecosystem CareNavigator
  coordinates. The vicious cycle now opens the sequence on its own page, and
  everything downstream shifts by one.
- **Sequence is now six pages.** 1: When older adults' needs go unmet, a
  vicious cycle follows. 2: CareNavigator coordinates the eldercare ecosystem
  (the former Figure 1, deloaded). 3: A major bottleneck is the caregiver
  shortage. 4: Navigation and new capacity together break the vicious cycle.
  5: How CareNavigator gets paid. 6: the detail table.
- **New Figure 1 is assembled from existing parts, not redesigned.** The
  older-adults box (title, family icons, the needs sentence) on the left, a
  dashed red arrow, and the vicious-cycle box on the right, both scaled up for
  a dedicated page. The cycle content is untouched: unmet needs, hospital, no
  care, repeating, with the dotted exit to a long-term care facility.
- **Figure 2 deloaded.** The large older-adults box is gone, replaced by the
  family icon and a one-line label; the full cycle is replaced by the
  condensed treatment already used in Figure 3 (dashed box, header, unlabeled
  mini ring) with a "see Figure 1" pointer. Everything else in the ecosystem
  figure is unchanged: the needs lane, the preventive geriatric care return
  arrow, the CareNavigator center, and the four stakeholder boxes.
- **Locked artifact renamed** from `figure-1-ecosystem` to `figure-ecosystem`
  and refreshed, since its old name now contradicts its position in the
  sequence. References in `figures/README.md` and this file updated.

## Workforce concept broadened; Figure 2 recomposed (Logan, 2026-08-25)

- **The workforce concept is no longer student-specific.** "Health-professions
  students each year (evergreen)" becomes **New Caregiver Workforce**, with the
  candidate pools shown lightly beneath the cycle: Students, Career changers,
  Gig workers, Retirees. "Next semester" becomes "next season" so the pipeline
  is not defined by an academic calendar. Figure 3's box carries the same name
  with no subtitle, so the vocabulary matches exactly across both figures.
- **The unverified "1M health-professions students each year" is gone.** It was
  the ring's center text and is replaced by the New Caregiver Workforce label,
  which retires the truthfulness flag raised when it was added. The only
  quantitative claim left in Figure 2 is the 9.7M shortage, which CP section 2
  already cites.
- **Figure 2 recomposed around paired headers.** The caregiver trio moved out
  of the cycle to become the right-hand header icon, directly resolving the
  icon, node, and label collision Logan flagged. Both columns now open with an
  icon group over a bold statement on a shared baseline (y=112): "CareNavigator
  aggregates family demand" and "New workforce capacity is needed." The
  problem now reads left to right before any detail: demand aggregates,
  providers hit the bottleneck, new capacity is needed.
- **The pipeline gained a fourth node** so it reads as Logan specified:
  Hire, next season, New cohort, Recruit, Vet, back to Hire (node labels
  shortened to single verbs 2026-08-25). Providers hire stays at the ring's leftmost point on the
  provider box centerline, so the straight connector is unchanged.
- **Figure 3** gains a home icon above "Needs met," matching the icon-over-
  concept language of the other two boxes and grounding the outcome in the
  community rather than an institution.

## Refinement pass: node labels, arrow origins, three matched boxes (Logan, 2026-08-25)

- **Figure 1.** Cycle labels moved beside their dots ("No care" left, "Hospital"
  right, shortened from "ED visits, hospitalization"); the dotted exit now runs
  directly from the Hospital node to "Long-term care facility" centered
  beneath. Reads: unmet need, hospital, no care, repeat, with a secondary
  dotted path hospital to facility. Locked artifact updated.
- **Figure 2.** Retitled "A Major Bottleneck Is the Caregiver Shortage"; ring
  center now reads "each year (evergreen)". The workforce ring was rotated so
  its nodes sit at 30, 150, and 270 degrees, putting "Providers hire" at the
  ring's leftmost point exactly on the provider box's vertical centerline
  (y=221). The connector is therefore a straight horizontal line from that
  node into the box, and the node label sits outside the ring above the line.
  Flow around the ring is unchanged: New cohort, Olera recruits, Providers
  hire, with the "next semester" return arc.
- **Figure 3 rebuilt in the commercial figure's box language.** Three equal
  boxes (268 x 300) on one grid: CareNavigator (heavy border, #eaf5ee, family
  icons and the dashed five-node ring, "Free for families, always." removed) +
  Evergreen caregiver workforce (Beachhead-panel styling, #f5faf7, student
  icons and the three-node pipeline ring) then a heavy arrow into the cycle
  broken (heavy border, #eaf5ee, Figure 1's cycle geometry in green: Needs met,
  Stays home, Care in place, with the dotted exit now pointing to less
  long-term care placement). All three rings share a centerline (y=217) and
  all titles and subtitles share baselines (y=291, y=305).
- The visual system is now closed: one clockwise three-node circle appears red
  in Figures 1 and 2 and green in Figure 3; the same family, student, and
  caregiver icons recur; box fills, borders, and type scale are shared.

## Causal correction and three-block synthesis (Logan, 2026-08-25)

- **Figure 1 cycle direction corrected.** Logan caught that the loop ran the
  wrong way. The causal sequence is now unmet need, ED visit and
  hospitalization, discharge without care established, back to the same unmet
  need. Clockwise: Unmet needs (top), "ED visits, hospitalization" (lower
  right), "No care" (lower left, renamed from "No preventive geriatric
  care"), repeating. The dashed exit runs from the ED node to "Long-term care
  facility" centered beneath. Locked artifact updated.
- **Figure 2 stripped to the bottleneck claim.** Title: "The Bottleneck Is the
  Caregiver Shortage." The explanatory caption and the standalone shortage
  stat are gone; the evidence now rides on the label itself, "9.7M unfilled
  roles by 2034." Right column: "New workforce capacity is needed" (one line)
  over a three-node pipeline (New cohort, Olera recruits, Providers hire) with
  the "next semester" return arc and the ring center reading "1M
  health-professions students each year." The connector to the provider box
  is a straight horizontal line on that box's centerline (y=231).
- **TRUTHFULNESS FLAG, unverified:** "1M health-professions students each
  year" is on the figure at Logan's direction but has no source in
  references.yaml. It must be verified (or replaced with a sourced figure)
  before it appears in any submitted document. The 9.7M figure is already
  cited in CP section 2.
- **Figure 3 rebuilt as three blocks on one grid:** CareNavigator (dashed
  five-node ring from Figure 1's center) + Evergreen caregiver workforce
  (Figure 2's pipeline ring) then a heavy arrow into the cycle turned green.
  The green cycle reuses Figure 1's exact geometry and node positions with
  the semantics reversed: Needs met (top), "Fewer ED visits, hospitalization"
  (lower right), "Preventive care" (lower left), so the flow reads preventive
  care, needs met, fewer ED visits, sustained. The dashed exit from the ED
  node now points at "The vicious cycle breaks / less long-term care
  placement" instead of into a facility. All three blocks share a ring
  centerline (y=245) and title and subtitle baselines (y=345, y=361).
- Visual grammar across the set is now fixed: the same clockwise three-node
  circle appears red in Figures 1 and 2 and green in Figure 3; icons, type
  scale, and spacing conventions are shared.

## Five-figure narrative ratified: interrupt, bottleneck, synthesis, then revenue (Logan, 2026-08-25)

- Logan resequenced the deck so the commercial figure comes only after the
  reader understands why staffing is core, not a side business: Figure 1 what
  CareNavigator does and the vicious cycle it interrupts; Figure 2 why
  navigation alone is insufficient (caregiver capacity is the bottleneck);
  Figure 3 the synthesis (navigation plus new capacity breaks the cycle);
  Figure 4 the commercial figure (unchanged); Figure 5 the detail table.
- **Figure 1 final corrections applied:** exit originates from the ED node,
  "Long-term care facility" centered beneath the cycle with whitespace,
  lower labels stacked directly under their dots, and the node renamed
  "No preventive geriatric care" per Logan's stacking instruction (ties the
  cycle to the title vocabulary). Locked artifact updated.
- **Figure 2 reframed as the bottleneck argument.** Title: "The Delivery of
  Preventive Geriatric Care Is Bottlenecked by the Caregiver Shortage." Left:
  demand aggregates into providers with unfilled roles ("Workforce capacity
  is the bottleneck." + the 9.7M line), then a red dashed arrow into a
  miniature of Figure 1's red box ("THE VICIOUS CYCLE OF UNMET NEED ...
  keeps running"), reusing the cycle visually instead of prose. Right: "New
  workforce capacity is needed to break the cycle" over the three-node
  evergreen pipeline. No revenue content.
- **Figure 3 built: the synthesis.** Two inputs (CareNavigator, coordinates
  the right care; New caregivers, create the capacity to deliver it)
  converge with a plus sign into the cycle transformed green: a four-node
  clockwise ring (needs identified, care coordinated, care delivered, needs
  met) around Preventive Geriatric Care, with CareNavigator feeding the
  identification side and caregivers feeding the delivery side. To the
  right, Figure 1's red box grammar returns transformed: a dashed green box,
  "THE VICIOUS CYCLE BREAKS," with green down-arrows on the red-world
  outcomes (ED visits and hospitalization; institutionalization).
- Visual grammar now codified across the set: red counterclockwise ring =
  the vicious cycle; green clockwise rings = the interventions; the dashed
  outcome box changes from red to green when the cycle breaks.

## Friction pass on Figures 1-2 (Logan, 2026-08-25)

- **Figure 1 vicious cycle simplified to three nodes** at Logan's direction:
  Unmet needs, No preventive care, ED visits and hospitalization, looping,
  with the dashed exit relabeled simply "Long-term care facility." After
  Logan rejected the first lopsided draft ("make it a proper circle"), the
  loop is a true circle with three even computed arcs: Unmet needs on top,
  No preventive care lower-left, ED visits lower-right, so the bottom pair
  reads left to right in causal order; flow runs counterclockwise and the
  exit forks off the return arc, where discharge diverges (home still unmet,
  or out to a facility). Dropped from the miniature:
  falls/malnutrition/medication errors, rehab-discharge, same-gaps,
  recurrence-worse-baseline (logged; CP fig-01 remains the full-fidelity
  version). The red box is now 220 wide at x730, flush with the ecosystem
  boxes below it. Locked artifact updated.
- **Figure 2 tightened.** Title is now the bridge sentence itself
  ("CareNavigator can find the right care and still fail if no provider has
  the staff to deliver it."), no lede. "CareNavigator aggregates family
  demand" feeds the provider card, whose caption is now "Workforce capacity
  is the bottleneck." over "9.7 million caregiving jobs to fill nationally,
  2024-2034" (the standalone stat block is folded in; the turned-away
  caption retired). Pipeline reduced to three nodes: New cohort enters,
  Olera recruits, Providers hire train supervise, with the "next semester"
  return arc; caption now "Adding caregivers to the system." The closing
  navigation-capacity-care chain is removed (the figure carries the
  relationship itself).
- **Open item:** the why-students rationale (career value of patient-care
  experience, continuous cohort renewal, schedule fit, geographic spread,
  per CP section 2) deliberately stays OFF the figure; its home is prose
  (CP section 2 already carries it; RS Approach may want one sentence).
## Three-figure architecture ratified; value-path figure retired (Logan, 2026-08-25)

- Logan's verdict on the value-path Figure 2: mostly a regression; the previous
  commercial figure is preferred. One survivor, kept as Figure 2's lede: "CareNavigator
  can find the right care and still fail if no provider has the staff to
  deliver it." Diagnosis adopted: one figure was being asked to explain why
  staffing exists, how it works, why it matters, how it earns, who future
  buyers are, and how much, all at once.
- **Ratified sequence: coordinate, deliver, monetize.** Figure 1: how
  CareNavigator coordinates preventive geriatric care (plus the vicious
  cycle). Figure 2: what prevents that care from being delivered (capacity)
  and how Olera expands it (the evergreen student pipeline). Figure 3: how the
  system gets paid (the restored commercial figure). Figure 4: the detail
  table (renumbered; reconciliation still pending).
- **Figure 1 red box rebuilt as a faithful miniature of CP fig-01** at Logan's
  direction: a six-node circular cycle (daily needs go unmet; falls,
  malnutrition, medication errors; ED visits, hospitalization; rehab,
  discharge home; same gaps at home; recurrence, worse baseline) with the
  dashed exit to premature institutionalization. The CP figure's entry ("care
  need emerges") is played by the existing dashed arrow from the family box;
  its two Olera interception arrows are not redrawn because Figure 1's whole
  composition is those interventions. Box grew to 222x222; locked artifact
  updated.
- **Figure 2 is now the capacity figure.** Left: CareNavigator brings families
  to a provider card whose staff row shows three filled and three dashed
  unfilled roles ("Too few caregivers. Shifts go unfilled. Cases are turned
  away."), anchored by the CP-cited 9.7 million caregiving jobs to fill
  2024-2034. Right: the evergreen caregiver pipeline as a five-node ring (new
  cohort enters; students apply; Olera vets them; providers hire, train,
  supervise; students gain patient-care experience; return arc "next
  semester") around "A new caregiving workforce," captioned "Adding
  caregivers to the workforce, not competing for them," with an arrow from
  the hire step into the card's unfilled roles. Closing chain: navigation
  coordinates the care, capacity delivers it, Preventive Geriatric Care.
- **Figure 3 restored** from the ratified commercial figure (Beachhead
  Offering / free family core / Emerging Offering, coin-on-shaft payment
  arrows, two-layer revenue trajectory with the GUIDE anchor). Left panel no
  longer redraws the pipeline (Figure 2 owns it): it names Caregiver Staffing,
  the recruit-and-vet-from-the-pipeline description, the subscription-vs-
  per-hire packaging (no prices), and the new insight line "The same sale that
  earns revenue adds the capacity navigation depends on." Lede restored to
  "Revenue comes from organizations that benefit when needed care is
  coordinated and established."
- The value-path band figure (pinched flow with hanging revenue tags) is
  retired and logged; it lives at commit 435e12c if wanted.

## Figures 1-2 unified: the bottleneck handoff (Logan, 2026-08-25)

- Logan's diagnosis: Figure 2 opened with staffing too abruptly ("why did a
  care-navigation company suddenly become a staffing company?"). Directive:
  make the progression feel inevitable, solve the narrative transition first.
- **Discovery that settled it: the CP's own Figure 1 (fig-01.svg) already
  encodes the two-intervention story.** Its vicious cycle (care need emerges,
  daily needs go unmet, falls and crises, ED and hospitalization, discharge
  home to the same gaps, recurrence at a worse baseline, exit to premature
  institutionalization) carries two marked interception points: "Olera 1:
  existing aid and care reached in time" and "Olera 2: workforce capacity
  added." Figures 1 and 2 now mirror settled CP logic rather than inventing a
  bridge.
- **Figure 1 amended (minimum change, on Logan's direction; lock otherwise
  holds).** The red cascade is reframed as "The Vicious Cycle of Unmet Need":
  four beats (daily needs go unmet; decline, falls, crises at home; ED visits,
  hospitalization; discharge home, gaps remain) closed by a return arc, with
  "Exit: premature institutionalization, higher costs" below the loop. The
  "caregiver breakdown" beat came off (logged in removed-material-log.md).
  Locked artifact and PDF in figures/ updated to match.
- **Figure 2 rebuilt as the value chain with a visible bottleneck.** One
  full-width flow band that starts wide (CareNavigator brings families),
  physically pinches at the bottleneck (Providers lack staff, with the red
  callback "the vicious cycle keeps running" beneath the thin section),
  re-widens where Olera injects caregivers (health-professions students, new
  cohorts every semester), and flows through care established in time
  (preventive geriatric care delivered) to outcomes improve (fewer
  hospitalizations, readmissions, less institutional care). Three tags hang
  from the chain: "Free for families, always." (no coin) under navigation; a
  solid $ coin, Beachhead Revenue, providers pay for staffing, under the
  capacity step; a dashed $ coin, Emerging Revenue, institutions that bear
  those costs sponsor navigation, under outcomes. Solid vs dashed coins carry
  now vs later; the tags' left-to-right order is the temporal order. Staffing
  now reads as the response to the bottleneck navigation encounters, serving
  its three recorded purposes (revenue, provider capacity, higher
  establishment likelihood).
- Lede changed to the bridge sentence: "CareNavigator can find the right care
  and still fail if no provider has the staff to deliver it." The prior
  revenue-origin lede is retired; its idea now lives in the chain itself.
- The three-panel architecture (free core center, offering panels left/right)
  is retired, including the center family+mini-cycle block, which repeated
  Figure 1 content. The revenue-over-time chart stays as the temporal band,
  amplified to fill its space, labels matched exactly to the tag vocabulary
  (Beachhead Revenue / Emerging Revenue).

## Figure 2 round two: the temporal architecture (Logan, 2026-08-25)

- Logan reframed the figure's job: anticipate the reviewer's question after
  Figure 1 (who pays, what are they buying, could this become a meaningful
  business) and answer it before it is asked. Directive: push the thinking,
  not just execute the layout.
- **Ratified architecture: top band structural, bottom band temporal.** Two
  parallel panels flank the free core, each making the same two-beat argument
  (customer + pain, then mechanism): Beachhead Offering, "Healthcare and LTSS
  providers need staff," with the evergreen workforce cycle (health-professions
  students apply, Olera screens, providers hire, return arc labeled "next
  semester") around a Caregiver Staffing hub, closed by "Adding caregivers to
  the workforce, not competing for them"; Emerging Offering, "Insurance and
  healthcare organizations bear the costs of unmet needs," with the logic
  Preventive geriatric care to fewer avoidable downstream costs
  (hospitalizations, readmissions, institutional care), closed by "So they
  sponsor navigation." The right panel deliberately reuses "preventive
  geriatric care" as the handoff from Figure 1.
- **Purchase mechanics deliberately unstated.** Per Logan, the figure claims
  only the economic reason to pay; episode fees, PMPM, and contracting are not
  resolved and are not shown.
- **Payment arrows redesigned** as coin-on-shaft glyphs (a $ coin riding the
  arrow into the CareNavigator box), computed from panel edges so alignment is
  exact.
- **The county ledger is retired from Figure 2** along with proposed pricing,
  the demand-capacity-staffing chain, "staffing is their largest problem,"
  "longer sales cycles," "they buy completion, not access," "families always
  enter free," and all assumption footnotes. The county economics remain
  recorded here and in Figure 3's table.
- **Bottom band: revenue over time, chosen over alternatives.** A two-layer
  area chart ("Revenue builds in two layers"): Beachhead revenue solid from
  today; Emerging revenue dashed, starting around year 4 and growing past the
  beachhead by year 10, annotated "Evidence opens institutional buyers" and
  "Medicare already prices navigation (GUIDE)" as the one verified scale
  anchor. Valley of Death rejected (it argues the funding gap, the CP's job,
  not opportunity size); market-sizing rejected for now on truthfulness
  grounds (customers x value needs market counts we have not verified).
  Axes carry no dollar values: the chart claims sequence and structure, not
  magnitude.
- **Open item: magnitude.** The trajectory answers "how does it grow," not
  "how large." Upgrade path once verified: national counts of home care and
  LTSS establishments, MA enrollment 65+, GUIDE's 390 participating
  organizations. A research task before it becomes a figure task.
- Figure 3 remains inconsistent with Figure 2 (county ledger, Client Growth
  Services row, band naming) and now also with the no-pricing decision; the
  reconciliation decision is still Logan's, queued with the fourth figure.

## Figure 1 LOCKED; house style extracted; Figure 2 rebuilt on the beachhead (Logan, 2026-08-24)

- **Figure 1 locked.** Final edit: the cascade caption ("The cascade preventive
  geriatric care interrupts.") removed; the cascade panel itself stays. The
  figure is frozen as a proposal artifact at `../figures/figure-ecosystem.html`
  (canonical, with rendered PDF); the working copy in the visuals file mirrors
  it. Changes only on Logan's explicit direction.
- **Figure house style ratified** at `../figures/README.md`: the default
  standard for all future CRP figures, generalized from the Figure 1 lessons
  (one argument per figure, full canvas, visual storytelling over prose boxes,
  short large text, no nesting without meaning, no decoration, vocabulary
  discipline, consistent visual grammar, no cross-figure repetition, serious
  QA at true print width before showing).
- **Figure 2 rebuilt around the caregiver-staffing beachhead.** The beachhead
  is one product: Caregiver Staffing for healthcare and LTSS providers, shown
  as the logic chain demand (families arrive needing care) to capacity
  (serving them takes caregivers) to staffing (we recruit, providers hire),
  with healthcare-professions students introduced visually as the new supply
  entering the staffing step, no operational detail. Two strategic reasons on
  record: staffing is providers' largest problem, and students expand the
  caregiver supply rather than competing for it. Actual proposed pricing now
  on the figure: ~$200 per month subscription or ~$500 per hire (the
  subscription-vs-per-hire choice remains an Aim 3 packaging experiment).
- **Client Growth Services removed from Figure 2** (removal logged in
  `removed-material-log.md`). The name and product record stand in the naming
  section below; the offering is unchanged strategically, it is simply not
  beachhead. Center panel keeps the family, mini-cycle, and "Free for
  families, always." and drops "Every provider is listed free / no referral
  fees" (Figure 3's footnote still carries the no-gating statement).
- Right panel redesigned to the first-principles argument with minimal text:
  unmet needs become their costs, established care avoids those costs; they
  buy completion, not access; fee per completed navigation episode; families
  always enter free. No nested cards.
- Revenue strip renamed to Logan's two categories: **Beachhead Revenue** ~$60K
  per county per year (assumes ~25 provider staffing subscriptions at ~$200
  per month) and **Emerging Revenue** ~$400K+ (assumes ~1,000 sponsored
  episodes plus employer contracts, at maturity). Unifying line placed as the
  figure lede: "Revenue comes from organizations that benefit when needed
  care is coordinated and established."
- **FLAG, not silently harmonized: Figure 3 is now inconsistent with Figure 2.**
  The table still carries the Client Growth Services row (~$25K), the "selling
  today" band naming, and an ~$85K provider subtotal implied by both products.
  Reconciliation (drop the row and rename bands to Beachhead / Emerging, or
  keep the table as the fuller product universe) is a Logan decision, queued
  with the fourth figure (delivery economics).

## Figure 1 addendum: the unmet-needs cascade (Logan, 2026-08-24)

- Added the counterfactual branch to the finalized figure: a dashed
  warning-toned arrow from Older Adults and Families to a "When needs go
  unmet" panel (preventable decline and crises at home; ED visits,
  hospitalizations, readmissions; caregiver breakdown; premature
  institutionalization and higher costs), captioned "The cascade preventive
  geriatric care interrupts." Language matches the locked RS spine's vicious
  cycle; no new claims introduced. The green return arrow and the red cascade
  now visually oppose each other as prevented vs unprevented futures.

## Figures 2 and 3 rebuilt as the revenue layer (Logan, 2026-08-24)

- Figure sequence ratified by Logan: (1) what CareNavigator does, (2) how it
  gets paid, (3) what each customer buys and what it could generate; a future
  figure covers how it is delivered economically. The family journey figure is
  retired; the county ledger and all CRP/approach framing are deferred to the
  later layer at Logan's direction.
- Figure 2 is the layered value-flow: free family core center (free for
  families always; every provider listed free; no referral fees), providers of
  care selling-today panel left, institutional emerging-buyers panel right
  (dashed), money arrows inward, and a two-bar magnitude strip (~$85K provider,
  ~$400K+ institutional per mid-sized county per year, labeled assumptions).
- Figure 3 is the disciplined detail table with group bands for
  selling-today vs emerging buyers and an illustrative ~$500K+/county total.
- **Naming decisions pending team ratification:** the provider growth offering
  is "Client Growth Services" (one name retiring Managed Ads / Boost /
  visibility drift; growth framing avoids the paid-bias connotation Qiping
  flagged); the institutional product is "Sponsored Navigation Episodes"
  (outreach, completion, integration, verified reporting; never gated access).
- Economics discipline: provider pricing anchored to pilot willingness to pay;
  institutional pricing anchored to comparable navigation vendors and CMS's
  existing dementia-navigation payment; every figure labeled assumption.

## Figure 1 FINALIZED (Logan, 2026-08-24)

Ratified composition: title only ("CareNavigator Coordinates the Eldercare
Ecosystem to Deliver Preventive Geriatric Care", no subtitle); family box with
left-aligned needs sentence and family figures; thin needs+means lane down; a
solid block arrow up labeled Preventive Geriatric Care as the primary outcome;
enlarged center with the five-step cycle (assess needs + means, update profile,
build plan, execute plan, track outcomes) around the app and CareNavigator
wordmark; four flanking boxes (Public Aid Programs, Insurance Coverage,
Healthcare Services, LTSS) each with paired directional exchange labels.
Figure 2 (journey) must now reconcile to this vocabulary; Figure 3 redesign
still deferred.

## Round eight: vocabulary discipline pass on figure 1 (Logan, 2026-08-24)

- Cycle fixed at five short steps: assess needs + means, update profile, build
  plan, execute plan, track outcomes. The care-plan phone mockup returned to
  the center element so the product reads as digital, not conceptual.
- "Personal Care & Support" renamed to Long-Term Services & Supports (LTSS),
  with "long-term care" removed from the Healthcare Services examples so the
  clinical/non-clinical boundary is clean: Healthcare = home health, hospice,
  skilled nursing, rehabilitation, physician services; LTSS = home care,
  assisted living, adult day, non-medical daily-living help.
- **"Preventive geriatric care" adopted on the return arrow, with a grounding
  subline** ("coordinated support, established and maintained at home").
  Pressure-test result, FLAGGED for prose migration: clinically, "geriatric
  care" implies clinician-delivered medical services; CareNavigator
  coordinates rather than delivers. Internal figures may carry the phrase;
  NIH prose needs the grounded form or establishment language. Same standing
  caveat applies to "operating system" in the figure subtitle (previously
  rejected for NIH prose; retained here as Logan's internal test balloon).
- Layout: side boxes narrowed, lanes lengthened, return arrow made the
  heaviest stroke on the page as the figure's culmination.

## Round seven: figure 1 visual excellence pass (Logan, 2026-08-24)

- Center redesigned as the CareNavigator cycle: assess needs, create living
  profile, build care + funding plan, help execute the plan, track aid and
  care established, looping back to assess. The ring encodes the
  continuous-reassessment claim visually; CareNavigator sits at the hub.
- Family figures moved into the Older Adults and Families box; pills removed
  everywhere in favor of plain sentences; type enlarged across the figure;
  bottom summary sentence removed; whole figure vertically centered.

## Round six: the ecosystem becomes its own figure (Logan, 2026-08-24)

- Figures split again, now three: (1) the CareNavigator ecosystem as a
  hub-and-spoke with the family + app at center; (2) the family journey,
  unchanged pending semantic reconciliation; (3) who pays.
- Figure 1's working definition, per Logan: a digital navigation platform that
  helps older adults and families meet social determinants of health by
  coordinating public aid, insurance coverage, healthcare services, and
  personal care around one plan.
- Every spoke is now a labeled two-way exchange: Public Aid Programs
  (applications out, aid back), Insurance Coverage (eligibility out, benefits
  back), Healthcare Services (health needs out, healthcare back), Personal
  Care & Support (ADL/IADL needs out, daily assistance back); family to
  CareNavigator (needs + means down, care + funding plan and established
  support back up).
- **Category change, FLAGGED: "Healthcare organizations" became "Healthcare
  Services."** With home health, hospice, skilled nursing, rehabilitation, and
  long-term care as the examples, the box describes care delivery, not
  institutions. Hospitals, health systems, and ACOs dropped out of the
  ecosystem figure entirely; they are referral sources and prospective payers
  and live in the who-pays figure. This diverges from the earlier four-actor
  taxonomy and needs reconciling in the journey figure and any prose that
  inherits it. Note also that Personal Care & Support vs Healthcare Services
  now splits what the old "care and support providers" box lumped together.
- Center carries five functions: assesses needs, creates a living profile,
  builds a care + funding plan, helps execute the plan, tracks aid and care
  established. "Living profile" joins "persistent profile" as candidate
  vocabulary; one term should win before prose.
- Journey figure reconciliation is the named next step.

## Round five: the journey becomes an illustration (Logan, 2026-08-24)

- The family journey is now drawn, not boxed: family figures with their own
  words, a phone bearing the persistent profile, needs as icons branching from
  it, four labeled streams descending from the ecosystem into the plan
  document (need, what pays, next step), an approval checkpoint diamond,
  execution as actions in motion (applications flying, visits scheduled,
  providers called, approvals stamped), and a home vignette holding the
  outcomes, with the persistence loop drawn as a dashed return path.
- The capability band (website/app, AI agents, automation, human navigators)
  was removed as a container per Logan; the AI-and-humans line survives as a
  single caption under the execution scene.
- Design rule adopted for these figures: text labels and clarifies, the
  illustration carries the meaning.

## Round three of the figures (Logan, 2026-08-24)

- Figure set is now three: ecosystem map (how-it-works-today band removed,
  commercial insurance added to coverage), the product experience (entry
  pathways through follow-up, absorbing the storyboard without the sponsored
  framing), and the payer table with an illustrative per-county revenue column.
- The sponsored-case storyboard page is retired; its concreteness lives in the
  new Figure 2 step 7 examples. An illustrated generic-family version can be
  rebuilt later if wanted.
- The fallback branch ("when the answer is no") is parked at Logan's direction
  until the primary pathway is settled. The no-dead-ends rule above still
  stands conceptually.
- Per-county revenue figures are labeled illustrative assumptions: providers
  ~$60K, MA plans ~$200K, Medicaid MCOs ~$100K, health systems ~$60K, aging
  agencies ~$25-50K per county per year. Volumes, capture rates, and prices are
  all untested; only the provider row is CRP-tested. These numbers exist to
  size the opportunity, never to be quoted in application prose.
- Logan's working insight this round: the model is easier to understand when it
  starts from the job performed for a family across a fragmented ecosystem,
  not from labels like marketplace or coordination infrastructure. Candidate
  input for TJ's narrative pass.

## Visuals review outcomes (Logan, 2026-08-24)

- Figures 4 (flywheel), 5 (proof bands), and 6 (thesis comparison) retired at
  Logan's direction; replaced by one "expanded conception" figure carrying the
  claim, customer, award-end proof, gains, risks, and post-award trajectory.
- Wording fix ratified: name the downstream buyers directly ("the insurers and
  health systems that end up paying for the ER visits, hospital stays, and
  nursing-home placements that follow when care is never established"), not
  "organizations financially responsible for what happens."
- **Market count deprecated in thinking documents.** Logan: stop the "12
  counties" habit; the number is a residual artifact and David's "why 12, why
  not more" stands unanswered. This restores SPINE.md's deliberate wording
  ("selected local markets"; the number follows from the Approach redesign).
  FLAG, not silently harmonized: the ratified logos outline and the Aims drafts
  still say twelve; reconciliation happens in the Approach work, where market
  selection criteria get derived.
- **"Concentrated organic demand" language retired as self-contradictory.**
  Organic demand is diffuse by nature. How local market density is actually
  built (paid local acquisition, partnerships, thresholds, or something else)
  is open Approach work, not settled language.

## Explicitly unchanged

H1-H6, the three aims and their endpoints, the neutrality rule,
the Qiping boundary (care established = operational telemetry), and the funding
thesis that the CRP tests provider-funded self-sufficiency. Rejected for the
CRP: clinical utilization endpoints, payer revenue as tested hypothesis,
"operating system" language in NIH prose.
