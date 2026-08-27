# Approach improvement backlog and visualization plan

Working record, opened 2026-08-27. Canonical source for everything we are holding
between the reviewer assessment and the Approach visualization exercise. Nothing in
here should be lost; anything implemented gets struck through with the commit that
did it.

Governing question for the whole exercise, from Logan:

> Which activities actually resolve a critical uncertainty, and which activities are
> merely nice to have?

---

## 1. Complete Approach inventory

Extracted from the delivered 12-page Research Strategy. Word counts are current.
This is the checklist; nothing may be silently dropped.

### Overall Approach (254 w)

| # | Unit | Words |
|---|------|-------|
| A0.1 | Overall research design | 59 |
| A0.2 | Gates, endpoints, and HSR placement (unheaded paragraph) | 101 |
| A0.3 | Regulatory plan | 94 |

Assets: Figure 5 (three stages, two gates).

### Aim 1 — Engineer and verify (1,008 w)

| # | Unit | Words |
|---|------|-------|
| A1.0 | Aim heading and objective statement | 65 |
| A1.E | Engineering approach (architecture, environments, orchestration, MCP, model strategy, schema validation) | 212 |
| A1.1 | Task 1.1 Execution and follow-up | 170 |
| A1.2 | Task 1.2 The aid, provider, and outcomes database | 108 |
| A1.3 | Task 1.3 Caregiver workforce infrastructure | 94 |
| A1.4 | Task 1.4 Verification against blinded expert review (non-HSR; determination to be obtained) | 245 |
| A1.G | Potential problems, alternative strategies, and the gate to Aim 2 | 114 |
| A1.M | Table 4, Aim 1 quantitative success criteria (4 rows, 2 gating) | table |

### Aim 2 — Validate free in two markets (1,284 w)

| # | Unit | Words |
|---|------|-------|
| A2.0 | Aim heading and objective statement | 70 |
| A2.1 | Task 2.1 Activate the two pilot markets | 120 |
| A2.2 | Task 2.2 Recruit, place, and retain caregivers | 164 |
| A2.3 | Task 2.3 Measure care establishment (platform telemetry, non-HSR) | 160 |
| A2.4 | Task 2.4 Validate the integrated system — task frame, participants, inclusion | 83 |
| A2.4A | Stream A, families (HSR, n=25, UEEIE, SUS, TIAS) | 139 |
| A2.4B | Stream B, providers and workers (HSR, formative + field, SUS/AIM-IAM-FIM, GEE, CFIR, COREQ) | 251 |
| A2.5 | Task 2.5 Measure what it costs, and what it is worth | 128 |
| A2.G | Potential problems, alternative strategies, and the gate to Aim 3 | 169 |
| A2.M | Table 5, Aim 2 quantitative success criteria (8 rows) | table |
| A2.T | Table 3, acquisition channels (shared by 2.1 and 2.2) | table |

### Aim 3 — Commercialize in eight paid markets (1,307 w)

| # | Unit | Words |
|---|------|-------|
| A3.0 | Aim heading and objective statement | 61 |
| A3.1 | Task 3.1 Open eight new markets (two waves) | 177 |
| A3.2 | Task 3.2 Set the price — starting range and sources | 107 |
| A3.2B | Four-price design, assignment, pre-registration, randomization inference, sizing, interim | 273 |
| A3.3 | Task 3.3 Measure the economics and have them independently validated (ADC) | 179 |
| A3.4 | Task 3.4 The Aim 2 instruments at scale (HSR) | 136 |
| A3.5 | Task 3.5 Assemble the evidence package for institutional buyers | 151 |
| A3.G | Potential problems and alternative strategies (now including the insufficiency branch and the stop rule) | 223 |
| A3.M | Table 6, Aim 3 quantitative success criteria (7 rows) | table |

### Approach close (217 w)

| # | Unit | Words |
|---|------|-------|
| AC.1 | Technical assistance and project oversight | 117 |
| AC.2 | Timetable and end deliverable | 100 |

Assets: Figure 6 (three-year Gantt, four decision points).

### CRP Progress Report (319 w, after this pass)

| # | Unit | Words |
|---|------|-------|
| P.1 | Development status of the technology (now carries the Phase IIB non-overlap sentence) | 84 |
| P.2 | What prior funding established | 129 |
| P.3 | Investor diligence set these milestones | 127 |
| P.T | Table 7, risks retired and the risk that remains | table |

---

## 2. Preserved weaknesses from the reviewer assessment

Held deliberately for TJ and Qiping. Each is the specific thing standing between the
criterion and the next point.

### Innovation, currently 3, with a point available

1. **No engagement with what is in development elsewhere.** The criterion asks
   whether the product is innovative against "all existing approaches **as well as
   those in development**." The section is silent on the agentic workflow automation
   field, which in 2026 is crowded and well capitalized. This is the clearest single
   thing holding the criterion below 2.
2. **Key Innovation 2 reads as workflow automation.** The mechanism is described at
   the level of "agents perform the work and the family decides." No technical
   novelty is claimed at a level a technical reviewer can evaluate.
3. **The verified worker record has no stated defensibility.** Nothing says why a
   staffing agency, a state workforce board, or a credentialing vendor could not
   issue the same record. Key Innovation 3 supplies a moat for the database; nothing
   supplies one for the worker record.
4. **Technical depth is in the wrong section.** MCP, task-scoped agents, schema
   validation and orchestration state all live in Approach, where they support
   feasibility rather than novelty. Innovation is scored on Innovation.
5. **`[TJ: confirm the name and scope of the verified worker record.]`** sits inside
   the flagship innovation.

### Approach, currently 3, with a point available

1. **The primary Aim 3 comparison has no stated precision.** The document sizes
   account-level conversion to a 95 percent half-width near 10 points. The primary
   comparison is at the market level across four arms with two markets each, and the
   interval that comparison delivers is never stated. Most technically damaging line
   available to a methodologist.
2. **The Aim 2 headline outcome has no performance threshold.** Table 5 gives
   "Households reaching established aid or care" the criterion "Estimated, ±5 pts,"
   which is a precision target. Half of reviewers read intellectual honesty; the
   other half read an outcome that cannot fail.
3. **Operating attention is named as the binding constraint and never addressed.**
   No headcount, no per-market staffing model, no evidence a single market has been
   run end to end. Largest unmitigated risk in the application.
4. **Aim 1 milestones are thin.** Table 4 carries four criteria for a year-long aim,
   only two gating, and Tasks 1.1 through 1.3 have no criterion of their own against
   a requirement for milestones covering each objective.
5. **The 85 percent agreement bar is unanchored** to literature or prior performance.
6. **`[TJ: confirm runtime and model choices.]`** terminates the paragraph whose
   whole job is establishing technical feasibility.
7. **The Project Management Plan is scored under Approach and lives in the CP.** Not
   a defect, but an explicit dependency: if the PMP is thin, Approach pays.

---

## 3. Straightforward edits made 2026-08-27

| Edit | Where | Rationale |
|---|---|---|
| Comma corrected to a period after the CAPABLE citation | Significance, p1 | Sentence-boundary error visible in the delivered PDF |
| "Manual delivery capped scale" reframed to deliberate sequencing: "Delivery was deliberately manual, to learn what the workflow had to do before building infrastructure for it" | Table 7, workforce row | Prevented a reviewer reading a limitation where the record shows a deliberate learn-then-build sequence |
| Standalone "Ongoing Phase IIB work this award does not re-fund" paragraph removed; the non-overlap point compressed to one clause inside Development status | CRP Progress Report | Not required by II.4. The distinction still needs making, but not at 64 words in its own section |
| "The endpoints this application works to" retitled "Investor diligence set these milestones" | CRP Progress Report | The heading did not describe the paragraph's argument, which is that Ziegler and Equitage diligence set the milestone tables |
| "If staffing revenue alone proves insufficient" folded into the Aim 3 alternatives paragraph as a continuation rather than a bolded sub-section | Aim 3 | Logan's preferred option; it was already inside the section but reading as standalone |

Net effect: 12 pages held, last page headroom up from 20pt to 98pt.

---

## 3b. Architecture revision executed 2026-08-27 (34 changes)

Logan's HSR mapping, adopted in full: **Aim 1** families + workers, pre-market;
**Aim 2** families + workers + providers, post-use; **Aim 3** no HSR. Executed
together with the accumulated decisions since the last major revision.

### Structural

| Change | Where | Why |
|---|---|---|
| **Figure 5 rebuilt as the evidence chain** and merged with the proposed non-duplication figure: four bands, Phase IIB / Aim 1 / Aim 2 / Aim 3, a dashed RELIED ON arrow from Phase IIB, and two gate arrows | Approach opener | The chain figure and the stage figure would have been near-duplicates. Merging made the non-duplication argument the figure's job and saved roughly 100pt |
| **Aim 2 Stream A (n=25 family usability) deleted** | Aim 2 | Duplicates the Phase IIB Year 3 n=200 evaluation, which reports 31 May 2027, before this award begins. See removal-log entry 85 |
| **New Task 1.5**, pre-market study with 20–25 families and 15–20 workers: task-based think-aloud, SUS + 12-item TIAS, safety as the unnoticed-incorrect-submission rate | Aim 1 | Families and workers test the *execution* experience, which Phase IIB does not touch. This is what Aim 1's HSR is for |
| **Task 1.4 narrowed to execution outputs**, bar anchored at 90 percent field-level agreement, "the standard Phase IIB set for identification" | Aim 1 | Phase IIB Aim 1 Task 1.2 already measures eligibility-matching accuracy >90%. Task 1.4 measures the harder downstream task, assembling a filing. Resolves D-7 |
| **Two-part gate to Aim 2**: Table 4 criteria met, and the people who have to use the product able to | Aim 1 | The gate now has a human-factors half |
| **Task 2.4 rebuilt as one three-group post-use value study**: ~40 families, 30 provider accounts, 40 placed workers, purposive across outcome strata, AIM/IAM/FIM + willingness-to-pay, GEE, CFIR, COREQ | Aim 2 | One study, three populations, one IRB protocol, instead of two streams |
| **Tasks 3.1 and 3.2 reversed**: 3.1 sets the price range and pre-registers; 3.2 opens eight markets under assigned prices | Aim 3 | Pre-registration has to precede the first market opening, not follow it |
| **Task 3.4 (old) deleted; old 3.5 renumbered 3.4** | Aim 3 | See removal-log entry 86 |
| **End-deliverable statement moved to close Aim 3** as "What exists at the end of three years" | Aim 3 | Investor readiness belongs where the evidence it rests on has just been described |
| **Phase IIB contingency stated** in Aim 1 Potential Problems | Aim 1 | If the n=200 study misses its milestones, the corresponding validation is added to Task 1.5 and no market activates |

### Evidence and framing

| Change | Where | Why |
|---|---|---|
| **The Phase IIB n=200 study written into the Progress Report** with its design, population, and reporting date | Progress Report | It appeared nowhere in the delivered draft. It is the largest piece of prior-funding evidence we have |
| **Marcia Ory corrected**: she is the named HSR supervision consultant *on Phase IIB*, not a prospective advisor | Progress Report, Technical assistance | She is already committed. Understating that lost an Environment point. Closes half of T-1 |
| **David Qu added** as an independent reviewer who informed the aims, with `[TITLE, AFFILIATION]` and no commitment stated | Progress Report | Logan's instruction: include him as someone who informed the aims, not as committed to a number. Closes the other half of T-1 |
| **Revenue model headline quoted**: ~50 paying accounts and $165,000 ARR per mature market against ~$30,000 to enter, LTV above 4x CAC, with the Commercialization Plan signposted for assumptions | Significance | Closes T-3. Model at `docs/crp/models/staffing_revenue_model.py` |
| **Table 2 pilot-scale note added** distinguishing production-scale from pilot-scale coverage | Significance | Closes T-9 |
| **Aim 3 market-level precision stated**: resolves a difference of roughly 20 percentage points or more; smaller differences reported as ordered but not separated | Aim 3 | Closes D-4. A reviewer who computes this themselves and finds it unstated discounts the design |
| **Table 4 expanded to 8 rows** covering Tasks 1.1–1.3 and 1.5 | Aim 1 | Closes D-6 |
| **Three lost citations restored** (`censusProj2023`, `aarpCareGap2013`, `wapoAPFM2024`) | Significance | Silently dropped in the earlier compression pass; caught by the new key-based citation resolver's uncited-reference check |
| **Technical mechanisms pulled up** and in-development sentences added to Key Innovation 2 | Innovation | Reviewer read the Innovation section as claiming built capability |
| **Team placeholders inserted**: `[TEAM: who leads market operations]`, `[TEAM: staff per market at steady state]` | Progress Report | T-2 remains open, but the gap is now visible rather than invisible |

### Defects found and fixed during the render pass

| Defect | Fix |
|---|---|
| Table 2's Olera row label was teal text on a teal background, invisible in both the PDF and the Word export | Added `table.matrix td.rowlab.own { color: #fff }`; `td.rowlab` was out-specifying `.own` |
| `Task 3.5` cross-reference in Aim 3 Potential Problems, pointing at a task that no longer exists | Reference removed with the sentence (removal-log 87) |
| `"where the the Aim 2 value study"` | Corrected |

**Page budget: 12 pages held.** Body fell from 9,413 to 9,227 rendered words across
roughly twenty compressions, none of which removed a method, a metric, a citation, or
a contingency. The largest single recovery was removing prose that a figure or table
already carried. Word export verified at the same page count via LibreOffice.

### Now closed

D-1 (HSR architecture, resolved by Logan's mapping), D-2 (Aim 3 HSR, eliminated),
D-4, D-6, D-7, D-10 (Task 3.5 scope, resolved by renumbering and deletion),
T-1, T-3, T-9.

### Still open

D-3 (scope reduction), D-5 (Aim 2 establishment threshold, currently defended as
precision-only), D-8 (two waves in Aim 3), D-9 (four price arms), T-2, T-4, T-5,
T-6, T-7, T-8. Seven placeholders remain in the document: two `[TJ: ...]`,
`[SURNAME TBD]`, `[TITLE, AFFILIATION]`, two `[TEAM: ...]`, and
`[CONFIRM EDITION AND YEAR]` in reference 1.

---

## 3c. Reconciliation with the live Drive copy, 2026-08-27

**The living document.** `2. Research Plan [Most Updated 8.26.26]`, Drive id
`1eicajMItCyBEdz4YJrZ9kHfVnnDxRKtn`. It is a `.docx` export of our own master,
uploaded at commit `f1a12bd` and hand-edited in Drive since.

**Method.** Rather than diff the live copy against our current head, which would
have buried five real edits under a full generation of our own changes, the
ancestor was identified first by exact-paragraph matching across every historical
`.docx` in the branch. `f1a12bd` matched 93.4 percent verbatim; the next best was
`4b4a2f3` at 87.7 percent and everything older fell to 16 percent or less. The
diff was then run against `f1a12bd` only, in both directions, at sentence level,
with markdown-table rows and figure-caption flattening excluded as converter
artifacts.

**Result: exactly five human edits**, all in Significance and Approach. Two merged
cleanly, three were sentence deletions.

| # | Team edit | Disposition |
|---|---|---|
| A | "no capacity in the local market" to "no **caregiver** capacity in the local market" | Merged with our own compression as "no local caregiver capacity to deliver it" |
| B | Deleted "We did not choose workforce development; it was a binding constraint on our own product working." | Honored, on Logan's instruction against my recommendation. Logged as removal 91 |
| C | Dropped "which is" from the Key Innovation 1 pointer | Merged, together with our cut of "and infrastructure" |
| D | Deleted "Year 1 also ends with the two markets selected and partnerships signed..." | Honored, on Logan's instruction. Removal 91 |
| E | Deleted "Below that a provider replaces half of what they bought within a quarter..." | Honored, on Logan's instruction. Removal 91 |

My recommendation on B, D, and E was to keep all three, on the grounds that each
answers a "why" a reviewer would otherwise ask: why workforce is not scope creep,
why the month 12 gate is commercial rather than technical, and why the retention
bar sits at 50 percent. Logan overrode that and the deletions were applied. All
three sentences are preserved verbatim in the removal log for reuse in the
Commercialization Plan and in reviewer responses.

**Twelve pages held.** Last-page headroom improved from 25pt to 52pt.

### Standing risk

The Drive copy is now a full generation behind the master. It does not contain
Task 1.5, the reversed Aim 3 tasks, the deleted Aim 2 Stream A, Figure 5 as the
evidence chain, the Phase IIB n=200 study, the Ory correction, David Qu, the
revenue-model headline, the Table 2 pilot-scale note, the Aim 3 precision
statement, Table 4's eight rows, three restored citations, or the Table 2
label-visibility fix. **Anyone editing it is working on a superseded base.** It
should be replaced with the current export before further team review.

---

## 4. Deferred to the visualization exercise

Do not touch these before the relevant visual exists.

| ID | Item | Which visual decides it |
|---|---|---|
| D-1 | **HSR architecture.** Move family validation from Task 2.4 to Aim 1 so navigation is confirmed before market entry? Collapse Aim 2 into one integrated three-population study? Eliminate Aim 3 HSR entirely? | V-14 paired with V-21 |
| D-2 | **Is Aim 3 HSR redundant with operational behavior?** Providers pay or do not; customers retain or churn; workers stay or leave; families complete or fail. | V-21, the incremental-information map |
| D-3 | **Scope reduction.** Which activities resolve a critical uncertainty and which are nice to have. | V-25 first, then every evidence chain |
| D-4 | **Aim 3 market-level precision.** State it, or change the design. | V-19 |
| D-5 | **Aim 2 establishment threshold.** Keep precision-only and defend it, or set a performance bar. | V-13 and V-10 |
| D-6 | **Aim 1 milestone coverage** for Tasks 1.1 to 1.3. | V-3 and V-9 |
| D-7 | **The 85 percent agreement anchor.** | V-8 |
| D-8 | **Two waves in Aim 3.** Necessary, or is one wave of eight simpler and equally informative? | V-18 |
| D-9 | **Does the pricing design need four arms?** Three arms across eight markets doubles per-arm density. | V-19 |
| D-10 | **Task 3.5 scope.** Three components may be two. | V-22 |

---

## 5. Requires team input or evidence outside this document

| ID | Item | Owner | Notes |
|---|---|---|---|
| T-1 | **David Qu and Marcia Ory in the advisory and environment story.** Marcia Ory (Texas A&M) on study design and dissemination; David Qu as advisor and prospective LoS author. Letters recorded as intended, not confirmed. | Logan | Primary home is Letters of Support and the Environment criterion, with a named mention in Technical assistance and project oversight. Do not write in until letters are committed |
| T-2 | **Team and execution plan.** Who runs ten markets, at what headcount, with what prior operating experience. | Logan, TJ | Answers the largest unmitigated risk. Partly PMP, partly a short RS paragraph, partly biosketches |
| T-3 | **Revenue model rebuild in the Commercialization Plan.** Bottom-up, defensible, then the strongest credible headline quoted briefly in the RS with the CP signposted for assumptions. | Logan | Existing model at `docs/crp/models/staffing_revenue_model.py` is the honest floor, not the ceiling. Do not inflate |
| T-4 | **Reference 1**, Genworth Cost of Care edition and year, currently `[CONFIRM EDITION AND YEAR]` in the bibliography | Logan | Small, visible, cheap |
| T-5 | **Reference 5**, the unmet-ADL-needs systematic review, currently has no authors or journal | Qiping | Either supply the citation or drop it and let refs 6 and 7 carry the claim |
| T-6 | **`[SURNAME TBD]`** for Nick, LCSW, expert panel lead | Logan | |
| T-7 | **`[TJ: confirm runtime and model choices.]`** and **`[TJ: confirm the name and scope of the verified worker record.]`** | TJ | |
| T-8 | **Open-source model training on the proprietary outcomes record.** Mentioned as discussed; not written because it cannot be verified. Would raise Innovation if real. | TJ | |
| T-9 | **Table 2 accuracy.** Olera carries a checkmark in all five columns; "Establish care" describes what Aim 1 builds, and "Staff it" is true at pilot scale. A reviewer who catches it discounts the rest. | Logan | Recommend a one-line note distinguishing pilot-scale from award-delivered coverage. Needs Logan's call because it touches a scored competitive claim |

---

## 6. Visualization plan

One visual per unit. The device is chosen to reveal the design, not to decorate it.
"Verify" names the external framework, instrument, or method whose citation the
rigor depends on.

### Phase A — decide the shape (nothing else starts until these land)

| V | Unit | Question the visual must answer | Device | Verify |
|---|---|---|---|---|
| V-25 | AC.2 Timetable | Is the schedule feasible at our actual headcount? | Resource-loaded timeline: the Gantt with a headcount lane per aim | — |
| V-14 | A2.4 HSR | Do we need two streams, and does the design support the inferences claimed? | Cohort design: participants, n, timing, instruments, analysis, per stream | UEEIE; SUS (Brooke 1996) and the 68/72 benchmark (Bangor 2008); 12-item TIAS (Jian, Bisantz, Drury 2000); AIM/IAM/FIM (Weiner 2017); CFIR (Damschroder 2022); COREQ (Tong 2007) |
| V-21 | A3.4 HSR at scale | For each construct, what does operational data already tell us, and what does the study add? | Incremental-information map: construct × operational signal × study signal × decision it changes | Same instrument set as V-14 |
| V-10 | A2.0 | What claim must Aim 2 support, and which task supports it? | Evidence chain: claim → measurement → threshold → decision | — |
| V-17 | A3.0 | Two questions, two measurements. Which task answers which? | Question-to-evidence map | — |

**Phase A output:** the final task list. Redundant tasks die here, before anyone draws them.

### Phase B — the two scored attack surfaces

| V | Unit | Question | Device | Verify |
|---|---|---|---|---|
| V-19 | A3.2, A3.2B | Can four arms across eight markets resolve anything? | Experiment schematic with a precision panel: assignment, arms, n per arm, the interval each comparison delivers | Van Westendorp; randomization inference with few clusters (Gerber and Green; Athey and Imbens); small-sample GEE corrections (Mancl and DeRouen; Fay and Graubard) |
| V-24 | AC.1 | Who does what, and who checks? | Responsibility map (RACI) across PI, Qiping, TJ, ADC, Nick, David, Marcia, and the operations roles T-2 defines | — |

### Phase C — Aim 1 engineering, with TJ

| V | Unit | Question | Device | Verify |
|---|---|---|---|---|
| V-4 | A1.E | Would an engineer know what to build? | System architecture: services, data stores, model calls, human escalation | Model Context Protocol spec; Anthropic and OpenAI agent runtime capabilities |
| V-5 | A1.1 | What is the case state machine, and where can a case die? | State machine with terminal states and escalation triggers | — |
| V-6 | A1.2 | What flows in and out, and what makes the provenance claim true? | Data-flow diagram: sources → curation → hybrid retrieval → agent assertion → pointer back to record | — |
| V-8 | A1.4 | Is this a valid measurement design or a demo? | Experiment schematic: scenario generation, blinding, two independent arms, comparison logic, agreement statistics | Cohen's kappa interpretation (Landis and Koch 1977); reference-standard language (STARD 2015) |
| V-3 | A1.0 | Are the three builds separable, or is one a subset of another? | Component architecture with shared dependencies and each build's contribution to the gate | — |
| V-9 | A1.G | Is the gate binary, and is the fallback executable? | Decision gate with the pass branch and a concrete narrow-scope fallback | — |

### Phase D — the operational spine

| V | Unit | Question | Device | Verify |
|---|---|---|---|---|
| V-11 | A2.1 | What must be true before a market can start, and how long does that take? | Market readiness checklist on a timeline | — |
| V-12 | A2.2 | What is the funnel, and where is the attrition? | Recruitment funnel: application → screening → interview → hire → first shift → 90 days | Activated Insights benchmark funnel (800 applicants → 195 interviews → 63 hires) as the industry comparator |
| V-13 | A2.3 | What exactly counts as established care, and where do households drop? | Household journey with the terminal event defined and drop-off per step | — |
| V-15 | A2.5 | What are the cost buckets, and how do they roll into the Aim 3 denominators? | Unit-economics model: CAC and cost-to-serve composition feeding margin and LTV | Time-driven activity-based costing (Kaplan and Anderson) |
| V-16 | A2.G | Same gate question as V-9 | Decision gate | — |

### Phase E — closing

| V | Unit | Question | Device | Verify |
|---|---|---|---|---|
| V-18 | A3.1 | Is the two-wave design necessary, and what does wave one change? | Market map plus wave timeline with the learning loop between them | — |
| V-20 | A3.3 | What does the independent analyst receive and return? | Audit flow: raw records → our model → ADC rebuild → discrepancy report | RMST; discrete-time survival with competing risks |
| V-22 | A3.5 | What is the chain from our measurement to a payer's decision? | Evidence chain with the causal claim explicitly bounded | Published avoided-utilization effect sizes (CAPABLE; GUIDE evaluation); actuarial modeling conventions |
| V-23 | A3.G | What are the failure branches and where do they land? | Decision tree | — |
| V-1 | A0.1 | Does the three-stage logic require three stages? | Dependency graph: what each stage consumes from the prior and produces for the next | — |
| V-2 | A0.3 | Are the four regimes complete, and does any gate an activity? | Compliance map: regime × tasks touched × blocks or governs | FDA Clinical Decision Support guidance, 21st Century Cures §3060, for the not-a-device basis |

---

## 7. Working method

Per unit, in the phase order above:

1. Draw the visual from the design, not from the prose.
2. Put the current prose beside it, with the relevant citations.
3. Ask the unit's question. If the visual is simpler than the prose, the prose is wrong.
   If the visual is empty, the task may be unnecessary.
4. Simplify the prose to match the design.
5. Logan approves. The section is then locked and returns to the staging Research
   Strategy.

Locked sections are recorded here with the commit that locked them.
