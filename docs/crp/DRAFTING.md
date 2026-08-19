# The Drafting Method (ratified 2026-08-19)

The paragraph-level workflow that produced the locked opening sections ("The unmet
need," Figure 1, "The product and the business model," "The market"). This is the
default whenever Logan says "next paragraph" or names a section to work on. House
style (the mechanical rules) lives in README section 6; this file is how we get to
strong prose. Not a checklist to recite — the way to reason.

## The loop: Purpose → Requirements → Evidence → Argument → Prose → Continuity → Verification

1. **Purpose.** State the single job this paragraph must do, in one sentence,
   before touching the text.
2. **Requirements.** What do the CRP solicitation, the SF424 instructions, and the
   review criteria require or reward *here*? (All captured verbatim in
   `solicitation-reviewer-reference.md`.) The governing documents guide the
   paragraph's job; they are never dumped into the prose as a visible checklist.
3. **Evidence.** What can we actually substantiate? Check our own materials first:
   the codebase, platform data, the CP, Preliminary Work, prior awards, customer
   discovery, the evidence ledger. Reconciliation beats invention — the CP already
   held the 165K provider denominator and the case-refusal statistic when we went
   looking. Then primary and federal external sources. Search the code when a
   product, data, or feasibility claim could be verified or strengthened by what
   exists; not as ritual. Never write around a placeholder; never stretch a
   related source to fit.
4. **Argument.** Given the requirements and the facts, state the simplest truthful
   argument in plain words before any grant language ("Americans spend over $400B
   a year on eldercare. Providers only earn it if they keep finding clients and
   caregivers, and they already pay for help with both."). Logan often supplies
   this as rough language or stream of consciousness; extract the logic and
   pressure-test it — preserve his intent without deference to his wording,
   evidence, or even his conclusion. Disagreement with reasons is the job.
5. **Prose.** The fewest words that carry the argument: clear, direct, mature,
   professional, simple. No jargon, no semicolon chains, no ornament, nothing that
   sounds sophisticated without adding clarity. The rigor moves underneath — into
   citations, workspace notes (`market-denominator.md` is the template), and the
   ledger — it never disappears.
6. **Continuity.** What does the paragraph receive from the one before, and what
   must it hand to the one after? Reuse vocabulary planted upstream (caregivers,
   clients, inquiries) instead of coining near-synonyms. The document is one
   continuous argument.
7. **Verification.** Before locking: unsupported claims, citation gaps, semantic
   drift, repetition of something said elsewhere, conflicts with the CP or Aims,
   anything a skeptical reviewer could challenge. Then render, look at the actual
   page, incorporate, commit. Lock provisionally and move on; reopen locked text
   only when downstream work reveals real inconsistency or missing setup.

## Four sources of truth (in authority order when they conflict)

1. CRP solicitation + current SF424 instructions — what must be established.
2. Olera's actual evidence: codebase, platform data, pilots, measurements.
3. The approved application architecture and fixed terminology (README).
4. External literature and industry evidence.
5. Our hypotheses and projections — always labeled as such.

Polished prose, an older draft, or a convenient business assumption never
overrides a governing instruction or the evidence.

## Lessons from the locked sections (grounded, not generic)

- **Truth constraints do creative work.** The strongest formulations came *from*
  verification limits: "requires no medical records" exists because the code check
  found a `memoryCare` intake option would undercut "no diagnoses"; "roughly half
  a trillion" exists because category overlap blocked a precise sum; the $5B
  estimate persuades *because* every input is the published low end and every
  omission biases it downward. When evidence forces a weaker claim, the weaker
  claim is usually the stronger sentence.
- **The workspace absorbs what the prose sheds.** Every simplification needs a
  place to put the displaced rigor, or "simplify" becomes "lose the thinking."
- **Iterate on reader reaction, not on wording.** Logan reads as a reader and
  names where he loses the thread; the fix is usually in the underlying thought.
  The market paragraph's topic sentence arrived in round four, after two whole
  framings were built and discarded. Expect the best sentences to arrive late,
  and do not defend first drafts.
- **Logan's decision vocabulary**: "approve" / "use this text" / "lock it" means
  install verbatim (flag, never silently fix, anything the evidence cannot
  support); "take out X" means remove and log; "I lose the thread here" means the
  argument, not the words, needs work. Ratified decisions and provisional numbers
  are different things — the README tracks which is which.
- **Preserve the team's work.** TJ's and Qiping's material is reconciled, not
  replaced: keep what still fits, relocate what belongs elsewhere, log every
  removal with a future home. The strongest sentences of theirs (Figure 1's
  panels, "two scarce inputs" until it was consciously retired) survive on merit.
- **Not every paragraph needs everything.** Requirements guide thinking, not
  coverage; code is searched when it can contribute; market numbers appear where
  the reader needs them and nowhere else.

## Evolving this file

Append dated lessons below as they are learned; do not rewrite the method's
history. Major changes to the loop itself get ratified by Logan first.
