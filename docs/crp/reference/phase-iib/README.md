# Phase IIB application (1R44AG074116) — historical reference

**Status: historical source material, not current truth.** Submitted 2023 for the
Phase IIB award that built what CareNavigator is today. Use it to recover prior
framing, argument logic, technical descriptions, figures, and preliminary evidence,
and to keep the scientific story continuous across awards. Where it conflicts with
the current codebase, platform data, or CRP strategy, **the current source wins and
the conflict gets flagged**, never silently carried forward.

| File | What it is |
|---|---|
| `OleraCareNavigator_PhaseIIB.pdf` | The full application as submitted (45 pages incl. bibliographies and letters) |
| `phase-iib-text.md` | Extracted text, page-delimited, for searching and quoting |

## Where things are (PDF page numbers)

| Pages | Content |
|---|---|
| 2-3 | Abstract, Project Narrative |
| 4 | Specific Aims (three aims: AI agents · Multi-Agent Network + UI usability · larger-cohort evaluation) |
| 5-6 | Significance: two challenges (unaffordable, fragmented), product introduction, **the accomplishments bullet list**, AI safety block |
| 6-8 | Innovation: KI-1 eldercare-specific LLM (RAG + PEFT), KI-2 suite of collaborative agents, KI-3 conversational avatars, "Final End-Product" |
| 9-16 | Approach: tasks, pitfalls, study designs |
| 17-28 | Commercialization Plan: problem/solution/value, expected outcomes, market and competition, company overview, finance |
| 29-35 | Bibliographies |
| 36-45 | Letters of support (TAMU School of Public Health, McFerrin Center/Blake Petty, Halsey LLC, LCSW, Alzheimer's Association) |

## What the CRP inherits from it

**The three Phase IIB innovations are now shipped product, not innovations.** They
were: an eldercare-specific LLM fine-tuned with RAG and PEFT; a Multi-Agent Network
of needs-assessment, resource-and-aid-matching, and personalized-care-planning
agents optimized by LCSW review; and conversational avatars as an intelligent UI.
Reviewers familiar with this award will test the CRP's novelty against them, which
is exactly what review criterion III.3 asks ("if the proposed product is trying to
improve over early generations... are the potential advantages truly substantial?").
The honest and available answer: **that generation understands and advises; this one
acts, finishes, and records what happened.**

**The lost-to-follow-up insight originates here** (page 5): "It then requires
applications, phone calls, and time to ultimately initiate a service or utilize an
aid program. Unfortunately, many are lost to follow up or never initiate support
systems, and needs go unmet." The current Aim 1 rationale uses the same framing,
now confirmed by Olera's own platform experience rather than only by the literature.

**Two structural devices worth reusing** (both in Significance, before Innovation):
a compact bullet list of accomplishments to date, which pre-empts the "is this
aspirational?" reaction; and a short AI safety, privacy, and accuracy block.

## Conflicts with current truth (flagged, do not carry forward)

| Phase IIB said | Current truth | Note |
|---|---|---|
| MARS 4.6/5 "among 25 caregivers" | RS Preliminary Work says n=31 | Resolve from the study record; the RS number is the one to verify, and its `\[cite\]` is still open |
| EMCR database "30,000+ resources" | 72,000+ records today | Growth, not conflict; both are point-in-time |
| "$30 billion in unclaimed aid" (2023 source) | $58B unclaimed, `ncoa2025` | Deliberate update to a newer verified source |
| "$6.3 billion in unclaimed food assistance" | folded into the $58B figure | Superseded |
| Product framed around AD/ADRD caregivers | Eldercare broadly; ADRD is one study population | Scope widened after Phase IIB |
| TAM framed as ~61 million caregivers | Provider-side spend of $5B+ across ~165,000 providers | Deliberate replacement; the old framing was a demand-side TAM, not a market we sell into |
