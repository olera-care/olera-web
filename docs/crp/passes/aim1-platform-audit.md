# Aim 1 "CareNavigator Platform" Subsection Audit (2026-08-19)

No RS edits made. Diagnosis, truth table, redundancy map, recommended structure,
and prose sketch for Logan's review.

## 1. The subsection's unique job

Aim 1 has no build task. The task list is verify (1.1), validate (1.2), adopt
(1.3), and Task 1.1 opens "The **developed** CareNavigator will be verified" — the
development itself is scoped nowhere except this subsection. Its unique job is
therefore: **define the intervention, its build scope, and its maturity, so that
the verify/validate/adopt tasks have a referent.** Task 1.1's metric structure
maps one-to-one onto the subsection's three components (Accuracy → matching;
Execution Reliability → execution loop; Follow-up Reliability → follow-up loop),
which is why TJ put it here and why it should stay. The problems are altitude
(feature mechanics instead of the loop), one accuracy overstatement, and
redundancy with what the reviewer read two pages earlier.

## 2. Truth table (codebase- and evidence-verified)

| Capability | Status | Evidence |
|---|---|---|
| Structured screening intake (7 categorical questions) | **Live** | `lib/types/benefits.ts` (BenefitsIntakeAnswers), production flow |
| Eligibility matching over the curated program database (rule-based; 642 programs, 51 states) | **Live** | `lib/benefits/eligibility.server.ts`, benefits engine |
| AI-assisted guidance with human approval (AI-drafted letters; coordinator composes, TJ approves and signs; model may only use family-provided facts + verified program data) | **Live** | `lib/family-comms/benefits-navigator.server.ts` (honesty rails documented in code) |
| Provider matching / directory + two-way benefits messaging | **Live** | platform; Preliminary Work |
| Expert-gated database ingestion | **Live (process claim)** | KI-3; confirm the every-change gate with Logan/TJ |
| Conversational/agentic architecture (RAG agents) | **In development** — separate codebase, integration expected pre-award (settled decision 5.2: never describe as existing today) | evidence sweep; Logan 2026-08-17 |
| Execution loop (per-program document checklists, application filling, assessment booking, case tracking, navigator escalation) | **Partial today → completed under CRP** (letters/communications exist; full loop does not) | family-comms exists; KI-2: "under the CRP we will build the execution loop" |
| Follow-up loop (case watching, re-engagement, outcome capture to database) | **Not built — CRP work** | RS's own label "yet to be developed"; Prelim: "follow-up does not exist" |

**The overstatement:** "Three agents run over Olera's curated, versioned database
using retrieval-augmented generation" describes the in-development agentic
architecture as the live system. What is live: structured screening, rule-based
eligibility matching, and AI-assisted guidance with expert approval. The code's own
honesty rails are the substantiated version of the grounding claim ("may only
reference facts the family provided; program specifics injected from the verified
pipeline; never invented").

**A maturity-label inconsistency to harmonize:** this subsection says execution
loop "(in development)" while Innovation KI-2 says "under the CRP we will build the
execution loop and the follow-up loop." Both defensible; pick one formulation
("partially built today; completed and hardened under the CRP") and use it in both
places (KI-2 fix goes to the Innovation pass queue).

## 3. Redundancy map (what the reviewer has already read)

| Content in the subsection | Already stated at |
|---|---|
| The closed loop (screen → match → execute → follow up → confirm → record) | Significance product paragraph; Family-side navigation ("six functions"); KI-2 (full workflow, in depth) |
| Live components vs. CRP-built loops | KI-2 closing sentences; Preliminary Work MVP paragraph ("Benefits eligibility, AI guidance, and provider matching are live nationally... Aim 1 builds the execution and follow-up loops") |
| The gap (families fall off during execution; follow-up does not exist) | Preliminary Work, ~25 lines above |
| Outcome learning (decisions returned to the database) | KI-3 (the moat argument); KI-2 |
| Escalation to a human navigator | KI-2 |

**Not redundant (unique, preserve):** the agent grounding constraints (curated
database only, never the open web — restated accurately); the execution safety
design (family submits everything; no portal credentials; VA claims referred to
accredited representatives; document preparation as the default because it works
everywhere); the explicit three-component maturity map; the build scope itself.

## 4. Recommended structure

Keep the subsection, in place, at roughly 60% of current length, reframed at loop
level with maturity as the organizing principle (what exists → what the CRP
completes), not feature mechanics:

1. One sentence: the intervention is the closed navigation loop (understand →
   identify → act → follow through, outcomes feeding the database).
2. *Live today* (~2 sentences): screening, eligibility matching over the
   expert-curated database, guidance with expert-approved responses, provider
   matching; the conversational agent architecture in development.
3. *Completed under the CRP* (~3 sentences): execution (act on findings; prepare
   for family review; book; track; escalate) with the safety clause, and follow-up
   (re-engage; capture outcomes). Implementation specifics (checklists, per-program
   logic, notification design) move to Tasks 1.1/1.3 where they are verified.
4. The three component names survive because Task 1.1's metrics are structured by
   them.

## 5. Prose sketch (~150 words vs. current ~260; saves ~0.1 page)

> The CareNavigator Platform. The intervention is a closed navigation loop:
> understand a family's needs, identify the aid and services they qualify for,
> help them act, and follow each case to a decision whose outcome improves the
> database for the next family. The loop's front half is live nationally today:
> structured screening, eligibility matching over the expert-curated program
> database, guidance built from expert-approved responses, and provider matching.
> A conversational agent architecture that will carry these functions is in
> development. The CRP completes the rest of the loop. The execution loop helps
> families act on their matches: it prepares applications and documents for the
> family's review, books assessments, and tracks each case to decision, escalating
> anything unresolved to a human navigator. The family submits everything; the
> platform holds no portal credentials, and VA claims are referred to accredited
> representatives. The follow-up loop re-engages the family when a step stalls and
> returns every reported decision to the database. Task 1.1 verifies each
> component against pre-specified criteria.

## 6. Evidence flags raised by this audit

1. "Three agents ... RAG" — overstates the live system; fix per truth table.
2. **Figure 4 caption** ("The platform prepares each application and the family
   submits it") — application preparation is not fully live; check what the worked
   example actually did (navigator-assisted?) and align the caption. → evidence
   ledger.
3. "An eldercare-benefits expert confirms every change before it goes live" —
   process claim; confirm with TJ/Logan that the gate is universal.
4. The Aim 1 rationale's falloff claim (from the brief) still needs its ledger
   status: instrumented funnel numbers or observed pattern.
5. KI-2 harmonization ("in development" vs "built under the CRP") → Innovation
   pass queue.
