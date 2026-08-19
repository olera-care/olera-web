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

## Who we are writing for (ratified 2026-08-19)

Four reviewer behaviors, all present on a real panel, all served at once:

1. **Top-down.** Reads the Research Strategy straight through and expects one
   continuous argument from Significance to Innovation to Preliminary Work to
   Approach. Served by continuity: what each paragraph receives and hands off.
2. **Section-by-section.** Scores one criterion, reading that section largely in
   isolation. Served by each major section carrying enough context to stand alone,
   even when that repeats something established earlier.
3. **Scanning.** Reads headings, first sentences, figures, captions, bold run-ins,
   and closing sentences. Served by making the whole argument recoverable from
   those elements alone. Every run-in heading and caption is load-bearing.
4. **Copy-and-paste.** Lifts sentences straight into the written critique. Served
   by deliberately supplying concise, defensible sentences that state why something
   is significant, innovative, feasible, or commercially important, in language a
   reviewer can quote without editing.

**Consequence: some repetition, signposting, and cross-referencing is good
grantmanship, not redundancy.** The test is whether a given repetition serves one
of these four readers. Restating a point because a section must stand alone is
earned; restating it because we forgot we said it is not.

## What made Key Innovation 1 work (2026-08-19)

The rebuild that finally landed did not come from reconciling sentences. It came
from refusing to write until we could state the single claim the section had to
prove. The sequence that produced it, and that should be reused for any section
scored against a criterion:

1. **Extract the criterion verbatim** and build a private mapping table:
   reviewer question, what the current text says, what our strongest answer
   actually is, what evidence supports it, what is missing. Never write into
   a criterion from memory.
2. **Name the incumbent paradigm in the first sentence.** "Staffing agencies,
   job boards, and gig platforms compete for workers already in that constrained
   market" gave the reviewer the contrast in one line. A section that opens by
   describing our thing has already lost the comparison.
3. **State the departure, then support it.** Everything after the paradigm
   sentence either explains why the approach can work, how we reach it, or what
   evidence exists. Anything that does none of those comes out.
4. **Split prose and figure by job, not by volume.** The figure took the
   conceptual claim, which is what the criterion scores and what prose says
   badly; the prose kept the concrete mechanism and the evidence. The wrapped
   figure at the top right means the reviewer meets claim and picture together.
5. **Evidence establishes credibility, then stops.** Enough to answer "is there
   any reason to believe this?" and not one number more; Preliminary Work carries
   the rest. Innovation is not a second Preliminary Work section.
6. **Verify every attribute before it earns a sentence.** Three of ten candidate
   attributes did not survive checking, and cutting them made the argument
   stronger, not weaker, because what remained was all defensible.
7. **Watch for the strongest counterargument and answer it or log it.** Adding
   short-tenure workers to a high-turnover field is the obvious attack on Key
   Innovation 1; naming it early meant we could decide deliberately rather than
   be surprised by it.

## Evolving this file

Append dated lessons below as they are learned; do not rewrite the method's
history. Major changes to the loop itself get ratified by Logan first.
