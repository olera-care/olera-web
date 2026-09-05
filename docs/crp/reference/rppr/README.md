# Phase IIB progress reports — the technical record

Extracted from Google Drive 2026-08-19. **These are the authoritative record of what
was actually built and tested under the Phase IIB award**, and they establish a
technical history the current production codebase does not show, because the
multi-agent system was developed and evaluated separately from the olera-web
production repository.

| File | Award year | Reporting period |
|---|---|---|
| `phase-iib-year1-rppr.md` | Year 1 | 08/01/2024 to 05/31/2025 |
| `phase-iib-year2-rppr.md` | Year 2 | 06/01/2025 to 05/31/2026 |

## What the record establishes, by status

**Built and reported in Year 1.** A Needs Assessment Agent prototype on GPT-4o-mini,
trained against the curated eldercare benefits repository. A unified Aid Matching and
Care Planning Agent on GPT-4.5, **enhanced through Parameter-Efficient Fine-Tuning
(PEFT)** with data curated for senior-care benefits and care-planning scenarios.
Agent orchestration through a centralized messaging system. A **flexible model
backend** letting each agent run different models, local (Ollama) or commercial API,
chosen per task for performance and cost. An agent conversation manager holding
conversation state. Roughly 320 registered elder-care stakeholders as a beta cohort,
and Clemson IRB approval. A research finding worth keeping: resource matching and
care planning were **merged into one agent** because model reasoning had advanced
enough to make the split unnecessary.

**Built and reported in Year 2.** Full integration of the multi-agent system, called
the eldercare-AI Network, with a caregiver-facing intelligent user interface
supporting **voice-to-voice conversation** plus text input and text-to-voice output.
Aim 1 refinement through **expert-in-the-loop review by licensed clinicians and
elder-care subject-matter experts**, explicitly to mitigate the risk of unreviewed
model behavior reaching caregivers. EMCR expansion across LTSS providers and federal,
state, and local aid programs, with provider and program-manager self-update
workflows and human fallback pathways, and a fallback that directs non-qualifying
families to their local Area Agency on Aging. Reported to NIH under C.3 Technologies:
**"Reinforcement learning with expert feedback (RLHF) and Retrieval-Augmented
Generation (RAG) to refine LLM responses."**

**Evaluated with users.** The integrated system was tested in the Aim 2 pilot with
AD/ADRD family caregivers using UXIE, MARS, the modified TAS, and qualitative
interviews. The Year 2 RPPR reports this as **n=25**; the CARE-NAV TAS manuscript
reports **N=31** with data collected January to April 2026, inside the same window.
Almost certainly the protocol target versus the final analyzed sample, **but this must
be confirmed with Qiping before either number is used in the CRP.**

**Not established here.** Whether the vector database for semantic search, listed as
next-phase work in Year 1, was completed. RAG is reported as a technique in Year 2,
which implies retrieval grounding, but no vector-store implementation is described.

**Not in production.** None of this architecture appears in the olera-web codebase,
which runs deterministic rules-based eligibility matching plus a single
human-approved LLM navigator letter. The multi-agent system and the production
platform are two different systems; integrating them is CRP work.

## Cautions

- The Year 2 RPPR states the team is **"intentionally not reporting preliminary
  quantitative benchmarks before formal analysis is complete"**, pending the JMIR
  manuscript. Using the TAS result in the CRP is legitimate, but it must be labeled
  as unpublished with a manuscript in preparation.
- The Year 2 RPPR describes the EMCR heading **"toward and beyond 100,000 indexed
  LTSS entities"**, and carryover funds expansion beyond 100,000. The Research
  Strategy still says 72,000+. Reconcile before use.
- "Fine-tuned" appears in Year 1 describing the Needs Assessment Agent in a loose
  sense alongside GPT-4o-mini. PEFT is claimed specifically for the Aid Matching and
  Care Planning Agent on GPT-4.5. Keep that distinction; do not generalize either.
