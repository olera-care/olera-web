# Approach figure architecture: the Aim-to-brief map and the proposed sequence

Status: planning record for Logan's 2026-08-25 request, produced before any Figure 15
is drawn. Not application text. Companion to
`payer-horizon-strategy-2026-08-24.md` (Figures 1-14) and
`../figures/README.md` (house style).

## 1. What the brief asks of the Approach

From `solicitation-reviewer-reference.md` II.3, verbatim requirements:

1. Describe the technical assistance used to accomplish the specific aims.
2. Provide a tentative timetable.
3. Describe how successful completion advances the product toward commercialization.
4. Describe quantitative milestones for measuring success on each objective.
5. If federal regulatory approval is involved, give the plan or say when it will exist.

Scored review criteria III.4 add two things the figures should serve: "potential
problems, alternative strategies, and benchmarks for success," and "a detailed,
feasible Project Management Plan," which is scored under Approach even though it
lives in the CP.

## 2. The Aim-to-brief map

Sources: `research-strategy.md` APPROACH (lines 99-267) and `specific-aims.md`.

### Aim 1. Verify, validate, and drive adoption of CareNavigator for families (Yr 1-2)

| Task | Technical activities | Key experiment | Quantitative milestone | Commercial question answered |
|---|---|---|---|---|
| 1.1 Verify against expert review | Build execution loop (in development) and follow-up loop (not yet built); blinded expert panel of licensed clinical social workers, no equity | Panel determines eligibility blinded to platform answer; hand-prepares applications for a sample; compared category by category and field by field | Agent-panel agreement >=85% and no lower than panel-panel agreement; material errors in <=10% of prepared applications; 100% of workflows carry state and next step; 95% of follow-ups sent on due date; zero applications transmitted without family action; >=80% outcome ascertainment | Can the product do the work correctly enough to be sold as doing it? |
| 1.2 Validate with family caregivers | IRB study at Clemson; 25 dementia family caregivers; 60-min moderated sessions; SUS, TIAS, think-aloud, 4-week and 3-month follow-up | Task success against pre-defined criteria plus usability and trust instruments | Mean SUS >=72 against the 68 benchmark; mean TIAS >=5 of 7; every engineering refinement resolved | Will families actually use and trust it? |
| 1.3 Drive adoption, measure CAC and cost to serve | Active acquisition in twelve markets across paid media, partnerships, direct outreach; instrumented funnel; time-driven activity-based costing | Each channel runs to a set budget, window, and decision rule; channels graduate or close on cost per acquired family | Task completion >=90% with <=10% drop-off per step across two consecutive cycles; re-runnable cost-to-serve and cost-to-acquire models from live records; >=2 channels at or below ceiling | What does it cost to acquire and serve a family, and is that cost falling? |

**Dependency:** none upstream. **Feeds:** Aim 2 (consented family demand, family
market-entry playbook), Aim 3 (cost to serve families, the denominator in the
cross-side test). **Advances if successful:** hardened product at its
commercial-readiness endpoint plus a repeatable family market-entry playbook.

### Aim 2. Verify, validate, and drive adoption of the Growth Suite for providers (Yr 1-2)

| Task | Technical activities | Key experiment | Quantitative milestone | Commercial question answered |
|---|---|---|---|---|
| 2.1 Verify the Suite works end to end | Test case runs each module's full path; counted events fixed in advance; reconciliation against the outside record | A module whose path does not complete does not deploy | 4 of 4 modules complete their full path with the promised result recorded exactly once; every count reconciles to the outside record | Does the product produce the outcome providers would be paying for? |
| 2.2 Validate with providers and students | Formative usability (30 providers, 20 students), then prospective field test (~80 provider accounts, >=20 per module, ~100 students followed 3 months); SUS, AIM/IAM/FIM, NASA-TLX; GEE with clustering at provider organization | Sequential mixed methods; CFIR-informed interviews with 20 providers and 20 students across non-activators, one-time and retained users | Mean SUS >=72; operational means >=4.0 on AIM, IAM, FIM; >=90% critical-task completion | Does it fit the way providers actually work? |
| 2.3 Drive provider and student adoption | Concentrated acquisition in the same twelve markets; every activation tagged by source, market, module, cohort, wave; staged pre-registered waves | Value and cost bars gate each wave; automated share of activations must rise while cost per activation falls | >=70% of activated accounts reach the module value endpoint (staffing reports first verified paid shift plus 30- and 90-day status); >=50% of those repeat or sustain at 60 days; >=1 provider channel and >=1 student channel at or below ceiling | Do providers get value worth paying for, and does acquisition get cheaper with scale? |

**Dependency:** Aim 1 supplies consented family demand for the referral module only;
the other modules are deliberately independent of Aim 1 so provider value does not
wait on family-side results. **Feeds:** Aim 3 (graduated modules, activated base,
provider playbook). **Advances if successful:** validated staffing workflow, module
readiness status, activated provider and student base, provider market-entry playbook.

### Aim 3. Validate a sustainable provider-funded revenue model (Yr 2-3)

| Task | Technical activities | Key experiment | Quantitative milestone | Commercial question answered |
|---|---|---|---|---|
| 3.1 Set price and packaging under real billing | Van Westendorp seeding survey with ~120 decision-makers under IRB; pre-registered price points, packages, contrast, horizon, decision rules; assignment across matched markets, not accounts | Two cohorts: conversion cohort from Aim 2 free pilots, paid-entry cohort new under paid terms. Primary contrast is paid conversion within 60 days of offer, GEE at account level with market as cluster | Execution bars: survey completed with >=120 decision-makers; experiments run to the pre-registered plan across both cohorts; a documented price and package decision | What will providers actually pay, as opposed to say they would pay? |
| 3.2 Provider value, retention, cross-side liquidity | Unit economics from live billing and cost records; discrete-time survival on account-months with competing risks; RMST at 12 months for lifetime; AIM/IAM/FIM; ~30 explanatory interviews | Cross-side liquidity modeled as realized provider value against lagged qualified family demand, market as random effect, <=6 covariates sized to 60-100 churn events across ~200 accounts | Delivered model with confidence intervals; cause-specific retention curves by cohort; LTV with CI from RMST; derived sustainability threshold; user-rated >=4.0 on AIM, IAM, FIM | Is an account worth more than it costs to win and keep? |
| 3.3 Independent financial validation | Independent CPA analyst under subcontract rebuilds revenue, CAC, cost to serve, margin, retention, market profitability, reinvestment capacity from records | Discrepancies between the rebuild and the operating model are investigated and reported, not reconciled silently | Rebuild completed and reported in full including discrepancies; investor evidence package delivered against acceptance bars set in advance | Will someone with no stake in the answer confirm the numbers? |

**Aim-level outcome bars (at the decision point, not the tasks):** payback under 12
months; LTV:CAC at least 3:1; margin at or above the derived sustainability
threshold; and provider revenue at steady state covering the Task 1.3 cost of serving
families. **Dependency:** requires graduated offerings from Aims 1 and 2 and Aim 1's
cost-to-serve figure. **Advances if successful:** a validated business model and the
investor evidence package the CP's fundraising strategy is built on.

## 3. Gaps and conflicts the map exposed

**Blocking, must be settled before Aim 2 figures can be drawn.**

1. **The provider product count is unresolved in the source text itself.**
   `research-strategy.md` line 93 carries a literal `[SETTLE: three or four]` marker.
   Aim 2 then describes **four** modules (staffing, referral network, review
   generation, Managed Ads). `SPINE.md`, which is locked, says **two** provider
   products (Managed Ads and Staff Recruitment). CP Section 9 says **three**
   (Staffing, Boost, Conversion). RS Aim 3 says "across both lines," implying two.
   Figures 5 to 7 show one sold product, Caregiver Staffing, plus free navigation.
   `strategic-context-2026-08-20.md` section 5 decision 1 deferred this "until the
   top-down pass reaches the Approach." It has arrived. Any Aim 2 figure must state a
   number, and the number must match the Aims page.

2. **There is no tentative timetable anywhere.** The Approach opens "Overall design
   and timetable (Figure A)," but Figure A is an aims-and-tasks overview, not a
   schedule. Aims carry year ranges (1-2, 1-2, 2-3) and CP Section 9 carries a market
   opening schedule, and that is all. The brief requires a timetable. Drawing one
   forces decisions that do not currently exist on paper: which quarter each task
   opens, when the pricing experiments run, when markets open, and when each decision
   point falls.

**Numerical conflicts that a cross-reading reviewer would find.**

3. **Market count: twelve everywhere except one CP section.** RS Tasks 1.3A, 2.3,
   3.1A say twelve markets; `specific-aims.md` says twelve; CP Section 5 says 12
   counties. CP Section 9 says 18 markets, opened 5 in Year 1 and the rest by end of
   Year 2. CP Section 9 is the outlier and is the section to correct.

4. **Per-provider price: the Figure 7 beachhead is now at half the planned price, and
   that is my error.** RS Aim 3's planning estimate is roughly 300 paying accounts at
   about $200 per month, about $720K ARR; CP Section 5 independently says 12 counties
   and approximately 300 paying providers. Those two agree exactly and imply about 25
   accounts per market at about $200 per month, or about $60K per county per year,
   which is what Figure 7's beachhead row originally said. In the 2026-08-25 pressure
   test I anchored the beachhead to CP Section 9's Table 9 instead (about $2,500 a
   month per mature market, about $30K a year) and halved the price to about $100 a
   month. CP Section 9 is the outlier on this number as well as on market count.
   **Recommendation:** restore the beachhead to about $200 per month, about 25
   providers, about $60K per county per year, matching RS Aim 3 and CP Section 5, and
   correct CP Section 9 rather than the figure. The emerging-layer corrections from
   that pressure test (episode volumes cut from 1,000 to 250, the non-double-counting
   rule, the segment totals) are unaffected and stand. Revised county total becomes
   about $200K per year rather than about $170K.

**Content gaps that the figures will surface rather than hide.**

5. **Aim 3's task-level milestones are execution certifications, not outcome bars.**
   Tasks 3.1 and 3.3 certify that a study ran to its pre-registered plan. The outcome
   bars (payback, LTV:CAC, margin, cross-side coverage) live at the aim decision
   point. This is methodologically correct for a measurement aim, but a milestone
   figure that lists task milestones alone would read as though Aim 3 has no numbers.
   The gate figure must show both levels.

6. **The failure paths are real and currently invisible.** Each aim has a
   pre-committed behavior when a bar is missed: the family offering stays in
   Build-Measure-Learn while provider modules advance; a module that misses its
   endpoint stays behind while others graduate; if the bundle underperforms at every
   price, pre-registered alternatives run in order (unbundle, re-tier, add value where
   interviews locate the gap, re-test). Reviewers reward this. No figure shows it.

## 4. The question the sequence has to answer

**What does a reviewer need to see, in what order, to believe these aims are
technically feasible, measurable, commercially consequential, and executable in three
years?**

In that order, they need:

1. That the three aims are one experiment with a dependency structure, not three
   workstreams that happen to share a budget.
2. That each aim starts from a named unknown rather than from an activity list.
3. That each unknown has a pre-specified measurement and a number attached to it
   before the work starts.
4. That missing a number has a pre-committed consequence.
5. That the calendar has room for all of it, with the commercial decisions falling
   early enough to act on.
6. That what remains at the end is an asset, not a report.

That ordering is the figure sequence.

## 5. Proposed figures 15 to 22

Each entry: title, the single question it answers, recommended visual format, and the
handoff to the next figure. Formats deliberately vary; the running count of
architectures used in Figures 1-14 is noted where reuse is a risk.

**15. So We Built the Award as Three Experiments**
Question: how do Aims 1, 2, and 3 relate, and what does each one de-risk?
Format: a dependency diagram, not three boxes in a row. Aims 1 and 2 run as parallel
tracks through Years 1-2, each ending in a graduation gate; Aim 3 sits downstream in
Years 2-3 and can only open on what has graduated. Draw the three real couplings as
labeled arrows: Aim 1's consented family demand into Aim 2's referral module, Aim 1's
cost to serve into Aim 3's cross-side test, and both playbooks into Aim 3. Show
graduation as a gate glyph, because independent graduation is the structural feature
of this design.
Handoff: the reader accepts the architecture and wants to know what the first
experiment actually does.

**16. Aim 1: Can We Carry a Family All the Way to Established Care?**
Question: what is unknown, what will be done, what will be measured, what threshold
counts, and what commercial uncertainty that removes?
Format: the five-beat spine as a single left-to-right band per task, with the
threshold rendered as a numeric chip so the numbers read at a glance. Bottom band
carries the commercial question answered. This five-beat layout becomes the template
reused for Aims 2 and 3, deliberately: the reader learns to read it once.
Handoff: the family side can be carried; but care is established only when a provider
says yes.

**17. Aim 2: Will Providers Use It, and Can They Staff the Care?**
Question: same five beats, provider side.
Format: same template as 16, with one structural addition that distinguishes it:
modules graduate independently, so the graduation column shows per-module status
rather than a single gate.
Handoff: value is demonstrated while the product is free; the question left standing
is whether anyone pays.

**18. Aim 3: Will Providers Pay Enough to Sustain It?**
Question: same five beats, revenue side.
Format: same template, with the two cohorts (conversion and paid-entry) shown as the
experimental contrast, and the outcome bars pulled to the decision point rather than
the tasks, per gap 5 above.
Handoff: the aims produce numbers; what number counts as success?

**19. Every Aim Has a Number It Must Hit, and a Move If It Misses**
Question: what do success and failure mean numerically?
Format: a gate ladder. Each gate is a horizontal bar carrying the metric, the
pre-registered threshold, and the pre-committed consequence of missing it. The
failure column is the point of the figure and is what separates it from Figure 10;
Figure 10 pairs hurdles with responses, this pairs thresholds with consequences.
Handoff: the bars are set; when does each one get tested?

**20. And Here Is When Each Answer Arrives**
Question: sequencing, dependency, overlap, and when commercial decisions occur.
Format: swimlanes by aim across twelve quarters, with decision diamonds at graduation
gates, market openings marked on the calendar, and the IRB-gated studies shown as
their own band. This is the figure the brief requires and the application does not
currently have.
Handoff: the calendar works; what does the company hold at the end of it?

**21. What Olera Owns on the Last Day of the Award**
Question: if the aims succeed, what exists that did not exist before?
Format: an inventory mapped back to the commercial claims of Figures 6 and 7, each
item tagged with the aim that produced it: hardened product at its readiness
endpoint, two market-entry playbooks, a validated price and package, unit economics
with confidence intervals, an independently rebuilt model, the investor evidence
package, an activated provider and student base. Where an item supports a Figure 7
revenue line, say which one.
Handoff: the asset is real; what stands between it and the market?

**22. No FDA Pathway Stands in the Way**
Question: what regulatory requirements apply, and what governs ongoing operations?
Format: deliberately the smallest figure in the set. A short decision path (is it a
medical device? no, it is navigational and administrative software, so no premarket
authorization is required) plus what does govern: privacy, marketing and referral
practices in the CP, and IRB coverage for the human-subjects tasks in Aims 1, 2, and
3. Alternative: fold this into Figure 21 as a band. Recommend keeping it separate,
because the brief asks the question explicitly and a reviewer should find the answer
without hunting.

**Optional 23. Who Does the Work, and How the Subcontract Is Run**
The Project Management Plan is scored under Approach, and the reviewer reference
flags that "robust oversight of CROs" targets the Clemson relationship specifically.
If the CP's PMP is thin on oversight mechanics, a figure here would score. Proposed
only if Logan wants it; it is the one figure in this set that serves a review
criterion rather than the narrative.

## 6. Title strategy

Figures 1-14 established two title registers, and the Approach set should keep both.
Argument figures carry a connective that continues the sentence the previous title
started ("Therefore," "So," "But," "And"). Reference figures carry a plain label
(Figure 7, Figures 12-14). The Approach opens on "So" because Figure 11's "But We
Have Three Key Innovations" leaves a claim that now has to be tested. Figures 16-18
use the aim number plus the question the aim answers, phrased as a question, which
keeps the register interrogative rather than declarative and matches how a reviewer
reads an Approach. Figure 19's title carries the failure clause because the failure
clause is what a reviewer is looking for. Figure 20 resumes the connective. Figure 21
states possession, which is the commercial payoff the whole set has been building
toward.

## 7. What has to be decided before Figure 15 is drawn

1. **Product count for Aim 2**: two, three, or four. Everything in Figures 17, 19, 20,
   and 21 depends on it.
2. **Market count**: twelve, with CP Section 9 corrected, or eighteen, with the Aims
   page reopened. The Aims page is locked, so the expected answer is twelve.
3. **The beachhead price**: restore Figure 7 to about $200 per month per provider, per
   gap 4, or keep about $100 and correct RS Aim 3 instead.
4. **The timetable itself**: quarters for each task, market opening schedule, and
   decision-point dates. This is content that does not exist yet and cannot be
   invented in a figure.
