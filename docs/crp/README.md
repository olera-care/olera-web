# CRP Application — Working Home

This folder is the working home for Olera's NIH SBIR Commercialization Readiness Pilot
(CRP) application. It holds a small number of authoritative files that establish the
current truth of the application, plus this orientation. It is deliberately not an
archive: historical drafts, superseded architectures, and session notes live elsewhere.

**Submission target: September 1, 2026 go/no-go decision** (details below).

## Files in this folder

| File | What it is | Human-review surface |
|---|---|---|
| `specific-aims.md` | Specific Aims, snapshot 2026-08-17 | Google Drive → Live Grant Documents → "1. Specific Aims" |
| `research-strategy.md` | Research Strategy, snapshot 2026-08-17 after TJ and Qiping's structural passes | Drive → "2. Research Plan" |
| `commercialization-plan.html` | Commercialization Plan, canonical staging v0.24.0 (11 SF424/NOFO sections, 10 figures, 10 tables) | Drive → "3. Commercialization Plan" (Word export) |
| `solicitation-reviewer-reference.md` | Verbatim NIH solicitation/NOFO text: section requirements, review criteria, scoring | — (reference) |

**Source-of-truth rule.** This folder is where reasoning and revision happen; Google
Drive's *Live Grant Documents* folder is where Marcia Ory and other human reviewers
comment. Mature drafts move from here to Drive; comments and human edits flow back and
are reconciled here with a dated snapshot. Every file carries a provenance header —
check it before trusting a snapshot's currency.

**Truthfulness rule (non-negotiable).** Never infer that a feature, metric, workflow,
or dataset exists because it would strengthen the proposal. When this codebase or the
current documents establish something, cite it. When they do not, mark the uncertainty
and ask Logan. This repo is also the codebase for olera.care itself, which means claims
about product architecture, instrumentation, analytics, and workflows can and should be
grounded in the actual implementation before they appear in the proposal.

## Where the application stands (2026-08-17)

TJ Falohun, Qiping Fan, and Logan DuBose met 2026-08-17 after TJ and Qiping completed
substantial passes on the Research Strategy. The architecture is much stronger —
particularly the human-subjects work and the structure of Aims 1 and 2 — but each
component still needs to be made rigorous, internally consistent, and clearly tied to
commercialization. The current Research Strategy is not final prose needing polish;
important scientific and commercial questions remain unresolved.

**Immediate goal:** within ~72 hours of 2026-08-17, get the Research Strategy cogent
and mature enough to send to senior advisor Dr. Marcia Ory for critical review.

## The September 1 decision framework

- TJ's weekend concern was taken seriously: the strongest application might require
  more commercial evidence, not better writing. Waiting a cycle could let MedJobs,
  Managed Ads, provider revenue, and investor interest mature — but postponement does
  not guarantee a materially stronger application, while submitting now preserves an
  earlier shot and the possibility of resubmission.
- **Decision: do not postpone now. Run a focused two-week sprint.**
- TJ's current internal estimate: **~35 overall impact score**. Goal: **≤30 by
  September 1**, aspiring substantially toward 10 if the work supports it.
- On September 1: honest go/no-go. If genuinely competitive → submit. If not →
  seriously consider postponing, and do not submit merely because of sunk effort.

**The standard for every major revision** is not "does this make the prose better" but:
*does this materially reduce a likely reviewer concern and improve the probability of
funding?* And for every section: clear enough for a tired reviewer, rigorous enough for
a scientist, concrete enough for an investor, true to what Olera has actually built,
and directly connected to commercial readiness.

## The three weaknesses most likely to move the score

### 1. Commercial readiness and preliminary commercialization evidence

The application must show Olera has already moved meaningfully toward
commercialization, and that CRP activities logically convert today's preliminary work
into commercially viable products. The provider-side offering must be especially clear.

Organizing framework — three provider needs/products, understood as **related modules
addressing different provider problems** (not one identical intervention every provider
needs):

- **Staffing** — helping providers find and hire workers. MedJobs is important
  preliminary work. *Most mature: real implementation experience.*
- **Visibility / Boost** — helping providers reach more families and generate qualified
  demand, including Managed Ads and provider profiles. Complete profiles fit naturally
  here rather than as a confusing fourth product. *Emerging real-world implementation.*
- **Conversion** — helping providers turn inquiries into clients (qualification,
  follow-up, intake, workflow support). *Least mature — must not be described as built
  or commercially validated.*

State these maturity differences plainly. Strengthen preliminary-work sections with
evidence that actually exists: MedJobs activity, provider participation, documented
hires/placements, provider-profile activity, Managed Ads experience, family demand,
benefits traffic, provider claims, funnel data. Qiping's specific note: documented
evidence that providers hired students **and those students actually worked with
families** would materially strengthen Aim 2's preliminary foundation.

**The test for every commercial activity and milestone:** if we achieve this milestone,
will a reviewer understand why we are materially closer to sustainable revenue? Metrics
are not included because they are academically measurable; success metrics should be
revenue or clearly revenue-adjacent.

### 2. Human-subjects research must be exceptionally rigorous and easy to understand

Historic vulnerability; must become rock solid. Organizing simplification:

**Verify → Validate → Scale**

- *Verify*: was the system built correctly and does it function as intended? Largely
  no human-subjects research required.
- *Validate*: does the system actually solve the intended problem for real users? This
  is where the carefully designed human-subjects studies belong.
- *Scale*: can we reproducibly acquire users and operate the validated system at
  commercially meaningful scale?

**Aim 1.** One focused study of the integrated CareNavigator with family caregivers:
usability, acceptability, and trust, with considered secondary outcomes. Explicitly
moved away from recruiting only funnel drop-outs (biased/narrow view). Reviewer's
mental model: *can family caregivers use and accept the integrated CareNavigator, and
does it provide recommendations they can trust?* Then conventional rigor: population,
research question, hypothesis where appropriate, primary/secondary endpoints, validated
instruments, sample-size rationale, analysis, inclusion/exclusion, recruitment,
protections, and an explicit interpretation of what success means for
commercialization. The Scale portion tests acquisition channels and their economics
(organic provider/benefits pages, paid, direct outreach, community/partners, emerging
AI interfaces) — which channels acquire families efficiently and reproducibly.

**Aim 2.** Qiping's two-stage validation of the Provider Growth Suite: (1) smaller
usability/acceptability study with providers and student caregivers; (2) prospective
field test of real use, workload, engagement, barriers, facilitators, operational
outcomes. Qualitative work deliberately includes different user experiences — activate,
disengage, fail to activate — not only successful users. **Unresolved issue: the
intervention must be defined precisely.** A reviewer must be able to answer: what
exactly is the Growth Suite; what modules; what does each do; who uses which; what are
providers and students actually asked to perform; what data are generated; how do
activities lead to endpoints; what is success; why does success mean commercial
progress. Candidate approach from the meeting: present the Growth Suite as the unified
intervention, instrument module use, analyze module-specific behavior secondarily.

**Aim 3.** Needs another major intellectual pass. Its purpose is unmistakably
commercial: *can Olera convert these validated products into a business in which
provider revenue exceeds the cost to acquire, serve, and retain those providers?*
Qiping proposed sequential mixed-method provider research (revenue, cost to serve,
retention, willingness to continue/pay, provider experience, with interviews explaining
why provider groups did or did not convert/remain). TJ's guardrail: Aim 3 must not
become so academically sophisticated that it fails the common-sense investor test —
*are these products going to make money, and will it exceed what they cost to
deliver?* — visible through design, milestones, endpoints, and interpretation.

### 3. Investor and customer support must become real evidence, not decorative letters

Letters may have disproportionate value: they directly address the application's
largest vulnerabilities (limited revenue, no committed growth capital). Wanted:

- **Customers/providers** who actually used relevant Olera products and can describe
  the value received and, where truthful, willingness to continue using or paying.
- **Investors** who understand the company and can say the CRP milestones address the
  evidence they would need to evaluate Olera for investment, that they will advise or
  stay engaged during the award, and that achieving milestones could lead to serious
  investment consideration.

Leads: Aggie Angel Network / Blake Petty and other age-tech investors in discussion;
TJ pursuing current Growth Suite users — **~15 providers already signed up for the
Growth Suite** are the starting pool. Letters must remain truthful: interest is not a
commitment and must never be made to sound like one.

## Standing conceptual decisions

- **The "three companies at once" concern is answered with the system, not
  defensiveness.** Benefits and navigation attract families → family demand attracts
  providers → providers get neutral/free family connections → Olera sells providers
  tools for their major business problems (staffing, visibility, conversion). The
  pieces reinforce one another. Olera's Phase I/IIB track record shows it reduces broad
  problems to finite executable components. Make this architecture obvious.
- **Engineering supports the research; it does not dominate the aims.** Each aim opens
  with: what exists now, what is partially developed, what remains to be completed
  under the CRP, what verification precedes human validation. Ordinary product
  development is not dressed up as scientific hypotheses or commercialization
  milestones. Research questions and milestones focus on the commercial uncertainties
  the CRP exists to resolve.
- **Commercialization Plan model canon (v0.24.0):** one market = one county; Table 9
  mature-market economics (enter ≈$30K, serve ≈$1K/mo, ≈$2.5K/mo mature revenue over
  ~18 months, ≈11 paying providers of ≈60 addressable); national self-serve channel;
  break-even engineered to land at award end; post-award expansion paced by operating
  margin; Scenario B = ≥$4M growth capital accelerating the validated playbook.

## Known cross-document consistency flags (open)

1. **Market count:** Specific Aims say "twelve local markets"; the CP models 18 active
   markets by end of Year 2 (12 pilot + 6 paid-first). Reconcile deliberately.
2. **Paid-first market timing:** CP moved the 6 paid-first entries from Year 3 into
   late Year 2 (to land break-even at award end). Research Strategy cadence must match.
3. **Headline metrics:** Aims/RS say 15,500+ visitors and 725+ providers; CP canon says
   15,000+ and ≈750 claimed profiles growing ≈150/month. Pick one set, ground it in
   analytics, use it everywhere.
4. **Aims say "self-funding market" gate; CP says company-level sustainability at award
   end.** These are compatible but must be stated so a reviewer sees one model.
