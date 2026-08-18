# Aim 1 Line-by-Line Brief (2026-08-19)

Prep for the Aim 1 pass: what each block does, what needs to change, what needs
Logan's decision. Aim 1 spans the aim heading through its decision point
(research-strategy.md, currently ~p6–8 of the render). Cross-references: opener
promises (opening-reconciliation.md drift check), retired placeholders (twelve
markets), truthfulness rule (README §9).

## Block-by-block

### 1. Aim heading + Rationale

Current: "Specific Aim 1: Verify, validate, and drive adoption of the CareNavigator
for families. Rationale: Financial aid is one of the main reasons families come to
Olera. Matching runs nationally today but families lose the aid while completing the
steps and again after filing (Preliminary Work)..."

- **Add the year span** "(Years 1–2)" to the heading, matching the Aims page and
  Figure A — this is also the first installment of the timetable reinstatement owed
  since Table 1 came out.
- **Terminology**: heading says "drive adoption," opener says "build adoption" —
  pick one (recommend "build," it's the ratified opener's verb).
- **Evidence check**: "families lose the aid while completing the steps and again
  after filing" — the drop-off claim needs a ledger status: instrumented funnel
  data, or observed-pattern-without-numbers? State at the strength we can prove.

### 2. Platform block (The CareNavigator Platform / three loops)

The maturity labels (live / in development / yet to be developed) are the
truthfulness rule working — preserve them exactly.

- **Settled-decision check (AI agents)**: "Three agents run over Olera's curated,
  versioned database using retrieval-augmented generation" — verify this describes
  the production system (structured screening/matching + expert-curated guidance),
  not the in-development agentic layer in the separate codebase. Wording may need
  one calibrating clause.
- The execution-loop paragraph carries the VA-accreditation and never-submits
  design; it stays (this is the proximal benefits-navigation compliance home).

### 3. Task 1.1 Verify + metrics

Solid: blinded expert panel, kappa, holdout from tuning data.

- Normalize "Task 1.1" to "Task 1.1:" (house-style known fix).
- Metrics reference the execution and follow-up loops (100% workflow state, 95%
  follow-ups) — fine, but the pass should say explicitly that verification runs
  after the loops are built (sequencing within Years 1–2).
- ">=80% outcome ascertainment" is the anchor for the opener's "aid and care
  established" claim — keep prominent.

### 4. Task 1.2 Validate + metrics

The n=25 ADRD-caregiver study.

- **ADRD defense (settled decision)**: the population choice must be argued, not
  asserted — one or two sentences: ADRD caregivers are NIA's population, the
  highest-navigation-burden users, and the hardest usability case; success
  generalizes down, not up. Needs Logan/Qiping sign-off on the exact rationale.
- **Recruitment**: "online aging and caregiving communities and the platform's
  caregiver community" — confirm this answers the no-dropout-only-recruiting
  weakness; consider naming a primary channel.
- Sample-size sentence has a bare \[cite\]; the SUS/TIAS benchmarks are sourced —
  fill citations in this pass.
- Inclusion (sex/race/ethnicity/age) justification is scored (III.4 HS paragraph) —
  confirm the HS attachment carries it and the RS says one sentence.

### 5. Task 1.3 Drive adoption (1.3A/1.3B) + metrics

The heavy block.

- **"Twelve markets" appears here first** (retired placeholder). Decision needed:
  (a) de-numerify now ("selected markets," count set with the biostatistician when
  Aim 3's design is fixed), or (b) derive the number in this pass. Note the number
  is load-bearing in Task 3.1A's stats language, so the final count is an Aim 3
  decision; recommend (a) now with a marker.
- **Selection criteria**: 1.3A's ranking (family arrivals, provider presence, aid
  generosity, campus proximity) is the "strongest starting point" logic the opener
  promises — align the wording; no demand-variation claim exists here (good).
- 1.3B: TDABC cost-to-serve, cost-to-acquire, opt-in referral seed ("the profile a
  provider sees carries the need and not the name") — strong; mostly wording-level.
- **Metrics**: funnel "task completion 90 percent or higher with drop-off 10
  percent or lower per step" — flag assumption status (ambitious bar); "two
  consecutive cycles" is good pre-specification.

### 6. Aim 1 decision point and deliverable

Consistent with the new opener (criteria set in advance; graduates into Aim 3;
misses stay in Build-Measure-Learn). One fix: "the provider modules advance" —
module taxonomy drift; becomes "provider products" (three-product decision).

## Cross-cutting for this pass

- Timetable reinstatement, installment 1: year spans on the aim heading + wave
  timing language in 1.3A.
- Fill or mark every \[cite\] in Aim 1.
- Opener-promise check: "aid and care actually established" (carried by Task 1.1
  ascertainment + 1.2 follow-ups) and "what a family costs to acquire and serve"
  (carried by 1.3B) — both hold; keep the language linked.

## Decisions Logan owns in this pass

1. Twelve-markets treatment: de-numerify with marker (recommended) or derive now.
2. ADRD rationale wording (with Qiping).
3. Funnel bar (90/10) — keep, soften, or justify.
4. "Drive" vs "build" adoption as the standard verb.
