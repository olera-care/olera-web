# CRP Application — Working Home

This folder is the working home for Olera's NIH SBIR Commercialization Readiness Pilot
(CRP) application. It holds a small number of authoritative files that establish the
current truth of the application, plus this orientation. It is deliberately not an
archive: historical drafts, superseded architectures, and session notes live elsewhere.

**Submission target: September 1, 2026 go/no-go decision** (framework below).

## Canonical files

| File | Role | Source | Imported | Status |
|---|---|---|---|---|
| `specific-aims.md` | **Canonical** Aims text | Drive → Live Grant Documents → "1. Specific Aims" (Google Doc `18HLcTa0…`) | 2026-08-17 | Current (Drive last modified 08-14) |
| `research-strategy.md` | **Canonical** RS text | Drive → "2. Research Plan" (docx `1dWDYwyS…`) | 2026-08-17 | Current (Drive modified 08-17 14:04, post TJ/Qiping passes); 72-hour revision target |
| `commercialization-plan.md` | **Canonical** CP text | Drive → "3. Commercialization Plan" (docx `1Vutumdd…`) | 2026-08-17 | Current (Drive modified 08-17 11:20); team-edited; carries known internal inconsistencies (below) |
| `commercialization-plan-staging-v0.24.html` | Reference only | Claude/Logan CP staging pipeline (artifact `3683cb25…`) | 2026-08-17 | Superseded as text canon by the Drive import; remains the source for figure artwork, the print-check pipeline, and the revenue-model derivation |
| `solicitation-reviewer-reference.md` | Reference | Verbatim NIH NOFO/SF424 text captured from the solicitation | 2026-08-17 | Stable |
| `evidence-ledger.md` | Working tool | Maintained during this pass | 2026-08-17 | Live — every empirical claim, its source, and verification status |

**Source-of-truth rule.** The Google Drive *Live Grant Documents* versions were imported
2026-08-17 as the starting source of truth (Logan's instruction). This folder is where
reasoning and revision happen; Drive is where Marcia Ory and other humans comment.
Mature drafts move from here to Drive; comments flow back and are reconciled here with a
dated snapshot. Check each file's provenance header before trusting its currency.
Do not overwrite or consolidate across sources without flagging differences first.

**Truthfulness rule (non-negotiable).** Never infer that a feature, metric, workflow, or
dataset exists because it would strengthen the proposal. Distinguish four evidence
levels and use them explicitly: (1) what the code proves exists; (2) what analytics or
operational records prove has actually been **used**; (3) what is in development; (4)
what is planned/proposed. A feature existing in code is not evidence of adoption or
commercial value. When sources establish something, cite it; when they do not, mark the
uncertainty and ask Logan. This repo is also the olera.care codebase, so product claims
can be grounded in the actual implementation.

## Working principles (Logan, 2026-08-17)

1. **Separate "current," "in development," and "proposed"** — especially for AI agents,
   Conversion, and parts of the Growth Suite.
2. **Never repair inconsistencies silently.** If the RS, CP, Aims, codebase, or
   operational data disagree, show the discrepancy and recommend a resolution.
3. **Commercial milestones must have an interpretation.** For every endpoint: *if we
   achieve this, what exactly have we learned about commercial readiness?* Vague answer
   → the metric needs work.
4. **Scientific rigor and commercial relevance both matter.** A methodologically
   beautiful study that reduces no commercialization risk is useless for a CRP.
5. **Use the repository creatively, but don't let it dictate the story.** The codebase
   is evidence and context; the solicitation and review criteria determine what must be
   proven.
6. **Vocabulary discipline across documents.** Canonical terms: CareNavigator ·
   Provider Growth Suite · Staffing · Visibility / Boost · Conversion · family /
   caregiver terminology · provider terminology · market = county · commercial
   readiness / sustainability. Flag semantic drift on sight.
7. **During the line-by-line pass, Logan's edits are not automatically load-bearing.**
   Challenge unsupported claims, study designs that miss the commercial question,
   conflicting numbers, terminology drift, oversized logical leaps for reviewers, and
   anywhere a simpler, more rigorous architecture exists. Preserve the strongest
   truthful argument, not the draft.

## Settled decisions (2026-08-17)

- **Provider products: exactly three.** Staffing · Visibility/Boost · Conversion. Do not
  introduce a fourth product; richer provider profiles sit under Visibility. Use these
  terms consistently in RS and CP unless the pass surfaces a compelling reason to change.
- **AI-agent claims must be restated.** The fully agentic navigation layer is being
  developed in a separate codebase over roughly the next 12 months, with integration
  into CareNavigator beginning ~3 months out — before the proposed award period. Do
  not describe the agentic version as existing today. Current-state language must be
  substantiated against what exists (see evidence ledger, "AI navigation" rows) and
  distinguish: (1) navigation functionality that exists now, (2) where AI is used now,
  (3) where a human/expert is involved now, (4) what is in development pre-CRP,
  (5) what the CRP validates or scales.
- **End-state numbers are provisional, reconciliation-required.** Break-even/
  sustainability targets, payer counts, and award-end revenue get locked only after
  Aims 2 and 3 are redesigned; then reconcile the chain Aim 3 milestones → award-end
  economics → CP financial model → break-even at award end → sustainable post-award
  operations. Do not optimize the RS around numbers originally inserted to make the
  end-to-end draft coherent. When RS and CP numbers conflict: **flag, never silently
  harmonize.**
- **ADRD caregiver population (Aim 1) must be defended, not assumed.** Defensible
  rationale: high navigation burden and complex needs; continuity with prior NIH-funded
  research (expertise, recruitment pathways, preliminary evidence); a high-need,
  high-complexity population is a rigorous initial validation context while the
  commercial population is broader. Do NOT claim "if it works for ADRD caregivers it
  works for everyone" — too strong. Pressure-test against the solicitation during the
  Aim 1 pass.
- **Pilot-evidence consolidation is a pending task (owner: Logan).** One internal record
  summarizing the MedJobs/Texas A&M pilot: participating providers and students,
  applications, interviews, hires, documented caregiving work, payments, dates, provider
  feedback, source links. Build when the Aim 2 / Preliminary Work pass needs it (or
  earlier if it becomes the bottleneck); cite it consistently thereafter.

## Where the application stands (2026-08-17)

TJ Falohun, Qiping Fan, and Logan DuBose met 2026-08-17 after TJ and Qiping completed
substantial passes on the Research Strategy. The architecture is much stronger —
particularly the human-subjects work and Aims 1–2 structure — but components still need
rigor, internal consistency, and clear commercial connection. The RS is not final prose
needing polish; important scientific and commercial questions remain open.

**Immediate goal:** within ~72 hours of 2026-08-17, get the RS cogent and mature enough
for senior advisor Dr. Marcia Ory's critical review. Not every sentence final — but
architecture, studies, aims, commercial logic, and major numbers coherent enough that
her feedback improves a serious proposal rather than cataloguing basic gaps.

## The September 1 decision framework

- TJ's weekend concern was taken seriously: the strongest application might require more
  commercial evidence, not better writing. Waiting a cycle could let MedJobs, Managed
  Ads, provider revenue, and investor interest mature — but postponement guarantees
  nothing, while submitting now preserves an earlier shot and resubmission.
- **Decision: do not postpone now. Run a focused two-week sprint.**
- TJ's current internal estimate: **~35 impact score**. Goal: **≤30 by September 1**,
  aspiring substantially toward 10 if the work supports it.
- September 1: honest go/no-go. Genuinely competitive → submit. Not → seriously
  consider postponing; sunk effort is not a reason to submit.

**The standard for every revision:** not "does this make the prose better" but *does
this materially reduce a likely reviewer concern and improve the probability of
funding?* Every section: clear enough for a tired reviewer, rigorous enough for a
scientist, concrete enough for an investor, true to what Olera has actually built,
directly connected to commercial readiness.

## The three weaknesses most likely to move the score

### 1. Commercial readiness and preliminary commercialization evidence

Show that Olera has already moved meaningfully toward commercialization and that CRP
activities logically convert today's preliminary work into commercially viable
products. The provider-side offering must be especially clear, using the three-product
framework above — related modules addressing different provider problems, not one
identical intervention. **State the maturity differences plainly:** Staffing has real
implementation experience; Visibility/Managed Ads has emerging real-world
implementation; Conversion is least mature and must not be described as built or
commercially validated. Strengthen preliminary-work sections with evidence that
actually exists (see `evidence-ledger.md`). Qiping's note: documented evidence that
providers hired students **and those students actually worked with families** would
materially strengthen Aim 2's foundation. Success metrics should be revenue or clearly
revenue-adjacent — not merely academically measurable.

### 2. Human-subjects research: exceptionally rigorous and easy to understand

Organizing simplification: **Verify → Validate → Scale.** Verify = built correctly,
functions as intended (largely non-human-subjects). Validate = solves the real problem
for real users (the carefully designed human-subjects studies). Scale = reproducible
acquisition and operation at commercially meaningful scale.

- **Aim 1:** one focused study of the integrated CareNavigator with family caregivers —
  usability, acceptability, trust; no funnel-dropout-only recruiting. Then conventional
  rigor end to end, plus explicit interpretation of what success means commercially.
  Scale portion tests acquisition channels and economics.
- **Aim 2:** two-stage Growth Suite validation (usability/acceptability study, then
  prospective field test) with qualitative work spanning different user experiences
  including disengagement and non-activation. **Unresolved: the intervention must be
  defined precisely** — what the Suite is, what modules, who uses which, what
  activities, what data, how activities lead to endpoints, what success means
  commercially. Candidate approach: Suite as unified intervention, module use
  instrumented, module-specific behavior analyzed secondarily.
- **Aim 3:** least developed; needs a major pass (deliberately left provisional until
  the whole system was coherent). By end of this pass it must state: the commercial
  uncertainty resolved, products tested, what providers experience, pricing/packaging
  experiments, conversion and retention measures, unit economics, cost to acquire and
  serve, revenue-adjacent primary outcomes, success threshold, expected award-end
  markets/providers/users, and why achieving them means commercial readiness. TJ's
  guardrail: it must pass the common-sense investor test — *will these products make
  money, exceeding what they cost to deliver?*

### 3. Investor and customer support as real evidence, not decorative letters

Letters directly address the biggest vulnerabilities (limited revenue, no committed
growth capital). Wanted: **customers/providers** who actually used the products and can
describe value and, where truthful, willingness to continue or pay; **investors** who
can say CRP milestones address the evidence they need, that they will stay engaged, and
that milestones achieved could lead to serious consideration. Leads: Aggie Angel
Network / Blake Petty and age-tech investors in discussion; TJ pursuing the ~15
providers already signed up for Growth Suite tools. Interest is not a commitment and
must never sound like one.

## Standing conceptual frames

- **"Three companies at once" is answered with the system:** benefits and navigation
  attract families → family demand attracts providers → providers get neutral/free
  connections → Olera sells providers tools for staffing, visibility, and conversion.
  The pieces reinforce one another; Phase I/IIB showed Olera reduces broad problems to
  finite executable components. Make the architecture obvious.
- **Engineering supports the research; it does not dominate the aims.** Each aim opens
  with: exists now / partially developed / to be completed under CRP / verification
  before human validation. Research questions and milestones focus on the commercial
  uncertainties the CRP exists to resolve.

## Known cross-document conflicts (open — flag, don't silently fix)

1. **Market count:** Aims and CP §5/§7/§11 say 12 markets (+~6 paid-first in CP §7/§11);
   CP §9 (Revenue Streams) models 18 active markets by end of Year 2. RS says twelve.
   Resolve during Aims 2–3 redesign, then propagate once.
2. **Award-end economics (three versions in play):** CP §9 says ≈$0.87M run rate at
   award end covering all operating costs (no financing gap); CP §11 timeline says ≈300
   paying providers, ≈$0.5M revenue, exiting above a $0.7M run rate; RS Aim 3 says ≈300
   accounts × ~$200/month ≈ $720K ARR. Provisional until Aim 3 matures.
3. **CP internal structure:** section numbering skips 10 (…§9 Revenue Streams → §11
   PMP); Fundraising Plan is folded into §7; two different tables are both numbered
   "Table 8." Check against SF424 CP section requirements before submission.
4. **MedJobs pilot outcomes:** CP §2 says 900 applications, 100 accepted, **25 placed**;
   RS Preliminary Work says "placed about **100** of them." Resolve from pilot records
   (Logan's consolidation task).
5. **Turnover figure:** CP says ≈75% (matches verified Activated Insights 2024 figure);
   RS says "approaches 80 percent."
6. **Headline metrics:** 15,500+ visitors (RS/Aims) vs "15K+ users" (CP) vs 15,000+
   canon; 725 vs ≈750 providers; 72,000+ indexed vs a "39K+ providers" comment in
   `app/sitemap.ts`; "+≈50,000 profiles annually to list all providers by 2029" (CP,
   new claim). Verify against GA4/GSC snapshots and the production database; unify.
7. **AI-agent present-tense claims:** RS Innovation 2 / Aim 1 describe live RAG
   navigation agents; this codebase implements deterministic screening/matching plus
   AI-drafted, expert-approved guidance; the agentic layer is pre-CRP in-development
   (separate codebase). Restate per settled decision above.
8. **Growth Suite launch claim:** RS says all provider tools "built and launched
   nationwide in July 2026"; codebase shows Boost/Managed Ads productized and billing,
   Staffing as a free pilot with payments stubbed, Conversion as components rather than
   a product, and no packaged "Growth Suite." State maturity honestly per weakness #1.
