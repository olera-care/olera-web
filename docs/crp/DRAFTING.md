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

## Lessons from the logos rebuild (2026-08-23)

Context: Logan asked for a full reconstruction of the application's intellectual
spine from first principles (`passes/logos-outline-2026-08-22.md`), then a new
one-page Specific Aims translated from it
(`passes/aims-logos-draft-2026-08-22.html`). Both went to David, Marcia, TJ, and
Shupeng for review on 2026-08-22. Retrospective recorded at Logan's request
before pausing drafting.

**What worked particularly well.**

- **Argument before prose.** Reconstructing the entire argument as one central
  hypothesis with six falsifiable sub-hypotheses (H1 establishment, H2 family
  economics, H3 provider value, H4 new capacity, H5 willingness-to-pay gradient,
  H6 self-funding markets) before writing a single sentence of the new page.
  Every paragraph of the resulting Aims was a derivation from the outline, not a
  negotiation with older wording.
- **Aims as questions.** "Determine whether..." titles force each aim to have a
  yes/no answer and a pre-committed alternative. The earlier aims read as
  activity lists; activities cannot fail, so they cannot be hypotheses.
- **The skeptic's test.** Asking "what will we know three years from now, and why
  does answering it justify NIH funding now" put the why-NIH argument on the
  page itself (incumbents will not run the experiment; a pre-revenue firm cannot
  run it unaided; NIH already built the identification half).
- **Flag, never force.** Mismatches found during reconstruction (two vs. three
  paid products, the unsupported "volunteer programs" line, 12 vs. 18 markets)
  were recorded as flags in the outline rather than silently harmonized. That is
  why the outline could be ratified quickly: nothing in it was smuggled.
- **Private coherence pass before rendering.** Checking that every paragraph
  advances the single hypothesis, then rendering and looking at the actual page,
  caught drift that sentence-level review had been missing for days.

**What changed in our understanding.**

- The three aims are the causal chain in order: establish care at measured cost,
  show that establishment activity creates provider value, show that provider
  revenue sustains a market. The sequence itself is the hypothesis; reordering
  or blending the aims destroys the logic.
- The twelve county markets are the testbed, not a claim. The application does
  not argue twelve is the right number; it argues the hypothesis must be tested
  somewhere concentrated enough for marketplace effects to appear.
- The open question the CRP answers sits between what SBIR proved
  (identification works, demand exists) and what no one knows (whether the model
  closes financially). Naming that gap plainly is stronger than claiming more.
- Proposed and awaiting ratification: two paid products, not three, with
  conversion/follow-up living inside the free establishment loop (Aim 1) rather
  than as a third SKU. The CP and README section 5 still say three.

**Why spine-first produced a stronger page than the earlier passes.**

The earlier Aims were maintained by patchwork: each edit was locally reasonable
and approved, but edits accumulated against prose whose underlying argument was
never restated, so coherence decayed invisibly. Semantic drift (product naming,
two vs. three products) survived because no single pass ever held the whole
argument at once. Rebuilding the logos first meant the page had one author: the
argument. Where the old text agreed with the argument it was kept; where it did
not, the argument won and the difference was flagged.

**What had not been working earlier, named so we do not repeat it.**

- Semantic drift across documents that were each individually approved.
- Premature prose: polishing sentences whose underlying claim was unsettled.
- Patchwork editing of locked text as the default change mechanism.
- Complexity as camouflage: elaborate structure hiding the weak coupling between
  marketplace activity and the revenue products, which the hypothesis chain now
  makes explicit and testable (H5).
- Aims written as work plans rather than as experiments that can fail.

**Principles to carry forward into the Research Strategy and CP.**

1. No section gets drafted until it can name which hypothesis it advances and
   what it hands to the next section. A section that advances none is questioned
   before it is written.
2. The Approach is re-derived from the logos, not edited from the existing
   draft. It is the largest unowned item and blocks Qiping's work.
3. The evidence locks hold at every speed: "more than 20" placements, "15,500+
   monthly visitors" never "families seeking care", anti-kickback language
   always constraint-scoped, care-established always operational telemetry.
4. Render and look before showing Logan; fit pages by whole-line cuts from the
   longest paragraphs, not word shaving.
5. Flags are cheaper than forced consistency. Record the conflict and keep
   moving; ratification is Logan's, with the team.

**Open questions the team's feedback may answer.**

- Two vs. three paid products (David, TJ; then CP and README section 5 update).
- Whether the "Determine whether..." aim titles and the on-page why-NIH
  paragraph survive reviewer-experienced eyes (Marcia).
- Which of the page-budget sacrifices earn their way back (the daily-tasks
  texture, the pathway steps, "at near-zero cost", product names in Aim 2).
- Whether H1's success measure stays purely operational or needs a clinical
  anchor Qiping would have to carry (current position: operational only).
- Twelve vs. eighteen markets, and the award-end numbers that follow from it.
- Innovation section ordering, with TJ.

**Re-base note (2026-08-23).** When drafting resumes, the conceptual baseline is
`passes/logos-outline-2026-08-22.md` (ratified by Logan) plus
`passes/aims-logos-draft-2026-08-22.html`, subject to team feedback. Do not
automatically carry forward older formulations. The predecessor locks (SPINE.md
2026-08-20, specific-aims.md lock of 2026-08-21) remain the ratified record
until Logan merges the new baseline; where they conflict with the logos outline,
flag the conflict, never silently harmonize in either direction.

## Lessons from the figure sequence (2026-08-25)

Context: Logan asked for concept figures covering the whole application. The result
was 40 slides (`passes/payer-horizon-visuals-2026-08-24.html`), sent to David, Marcia,
TJ, and Qiping on 2026-08-25. The conceptual output is `CANON.md`. What follows is the
method output: what drawing the argument taught us about writing it.

**Visualizing the argument is a test of whether we have one.** Prose can carry a vague
claim for weeks because sentences flow past. A figure cannot. Every defect the figure
pass exposed had been sitting in approved text: a "provider value endpoint" used as a
70 percent threshold with no definition anywhere in the workspace; "county" and
"market" alternating as if the reader knew they were the same thing; two adjacent
sections sharing an entire block verbatim. None of these survived the first attempt to
draw them. **Before drafting a section that has resisted several passes, try to draw
it.** The failure mode of the drawing tells you what is wrong with the thinking.

**One question in, one question out.** The strongest sequencing discipline we found is
to ask, of every unit: what question does the reader arrive with, and what question do
they leave with? A figure that answers a question nobody was asking is filler, and so
is a paragraph. Applied to the whole application this produced the chain in `CANON.md`
section 1, and applied to a single passage it decides whether a sentence stays.

**Titles are the argument, not labels.** "The Competitive Environment" is a topic. "But
There Is Competition" is a move in an argument, and it only works because the previous
title created the need for it. Run-in headings in the Research Strategy should be read
in sequence, on their own, and still tell the story; that is the scanning reviewer's
whole experience of the document.

**Concrete mechanism beats abstract category, every time.** "Social determinants of
health" became "food, housing, income, transportation." "Care coordination" became
assess, build a plan, execute, track. "Providers face workforce challenges" became
"unfilled shifts cap the clients they can take." The abstraction is always shorter and
always weaker, because the reviewer has to convert it back into a mechanism to judge
whether it is true, and some of them will not bother.

**Plain language is a constraint that improves the claim.** Logan's standard for the
progress-report subtexts was twelfth-grade language, two lines. Writing to that
constraint is where "we validated technology acceptance in a mixed-methods evaluation"
became "would families accept it, and four peer-reviewed studies say yes." The second
is not a simplification of the first. It is the first one's actual point, which the
grant register had been hiding.

**Removal has a second step, and skipping it is how a document decays.** Cutting text
leaves a container sized for text that is gone: in the figures, boxes with 50 pixels of
air; in prose, a topic sentence that promises a clause that no longer follows, a
transition into a deleted point, a cross-reference to a removed section. Three
orphaned references survived two deletions in this pass before anyone caught them.
**After any cut, reread what the cut point receives and hands off.**

**New white space is not an invitation to new text.** Logan had to say this explicitly,
which means the instinct is real and it is ours. When a passage is cut for being
overstuffed, the correct next state is a shorter passage.

**Say where the evidence stops, on the page.** The most persuasive element in the deck
is the line that marks where the award ends and refuses the sixth item on the payer
ladder. Naming the limit is what makes the five claims below it credible. The same
move belongs in the prose wherever we are about to be accused of overreach: state the
boundary before the reviewer draws it.

**A number must say what it is.** "9.7M unfilled roles by 2034" is not what PHI
published; the source says 9.7 million total job openings including transfers and
labor-force exits. The wrong version had been carried in figures and drafts alike
because it was more dramatic and nobody re-read the `supports` line. **Re-read the
ledger's `supports` text, not the claim as we last phrased it.**

**Thresholds come from somewhere or they do not go in.** Every gate value in the
Approach figures was either lifted from a value already committed elsewhere in the
application or left out. Inventing a plausible number is the easiest thing in the world
and the least defensible line in a review.

**Vocabulary drift is invisible inside a document and obvious across a set.** The
figures found drift that sentence-level review had missed for weeks, because forty
slides put every synonym on one surface. The cheap version of this check for prose is a
grep for each ratified term and its near-synonyms across the whole workspace, not a
reading pass.

**Vary the architecture, hold the system constant.** Two adjacent figures doing
different jobs must not share a layout, or the reader reads them as variations of one
slide. The prose analogue is real: three consecutive paragraphs that open with a claim
and close with a number read as a template, and a reviewer skims templates. Vary the
shape of the argument while holding voice, vocabulary, and evidence standard constant.

**Surgical edits, and say which unit you changed.** Logan's standing instruction
through the whole sequence was to edit surgically rather than redesign, and the
recurring failure was ambiguity about which unit was being edited (slide numbers moved
under us three times). When a document is being renumbered or restructured, state
which unit you actually changed, in its current numbering, every time.
