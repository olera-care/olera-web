---
name: visualize
description: >
  Take whatever is currently on the table and render it as a published artifact TJ can look at, choosing
  the visual form that shows the thing's real structure. Use this skill when TJ says "visualize",
  "/visualize", "let me see it", "show me this visually", "I can't picture this", "put this in a
  document/PDF/artifact", "make this visual", "I'm struggling to see it", or otherwise signals that prose
  in the chat is not landing. Takes no arguments by default — infer the subject from the conversation.
  Works on anything: a document being restructured, a set of edits, competing options, a decision, a
  plan, research findings, or work that will be scored against someone else's criteria. The judgment
  this skill carries is form selection, not tool invocation.
---

# /visualize — show TJ the shape of the thing

TJ sometimes cannot see a structure from prose, and he should not have to know how to ask for a
particular kind of picture. He says "let me see it" and gets the right thing.

**Your job is form selection.** Calling the Artifact tool is the easy part. Choosing what shape actually
reveals this particular subject is the work.

## Take no arguments

Infer the subject from the conversation. It is almost always the thing you were both just working on. Do
not ask "what would you like me to visualize?" unless two genuinely different subjects are live at once,
and then ask in one line and pick a default.

## First: does it have a shape worth showing?

An artifact earns its place when there is structure prose cannot carry — hierarchy, parallelism, order,
gaps, tradeoffs, before-and-after, or several layers that need to be seen at once. **Say so and skip the
artifact when the content is a single answer, a short list, or something with no internal structure.** A
decorated summary is worse than a paragraph, and it costs TJ a click to learn nothing.

## Second: what job is the page doing?

The same subject supports completely different pages, and picking the wrong job wastes the whole thing.
A critique of a document can be a **verification** page, is every claim true and sourced, or a
**persuasion** page, will this land with the person who reads it and get the outcome it is for. Those
produce different columns, different findings, and different fixes.

**Verification is the easier instinct and is usually not the job.** Fact-checking feels like rigor and
is mostly a checklist. When the subject is going somewhere to be read and judged, TJ is asking about the
reader, not about the facts. Ask who the eventual reader is and what they will do with it. If the answer
is score it, approve it, fund it, buy from it, or decide on it, the page is about that reader, and
credibility problems belong in it only where they change what that reader concludes.

## Don't argue with someone who isn't in the room

Context TJ gives you is context, not a challenge. When he mentions a constraint, a history, or a
number's backstory, he is handing you material — he is not asking you to defend the work against it.
The failure mode is writing a section that rebuts an objection nobody made: a headline like "X was
not Y," a paragraph beginning "set against Z, this looks bad, but," a table assembled to prove the
spend was justified. It reads as defensive, it inflates the page, and TJ has to cut it.

Two checks before a section ships:

- **Name the reader's actual question.** If you cannot state it in one sentence without inventing a
  skeptic, the section is answering a question nobody had. Cut it.
- **State, don't defend.** "An inquiry costs $81 and we do not yet know the placement rate" is a fact
  a reader can use. "The $812 was not customer acquisition, it was priced discovery" is a rebuttal to
  an accusation that was never made.

Related: when the honest answer is that a number is unknown, say it is unknown and say what would
settle it. Do not reach for an adjacent number you *do* have and let it stand in — a measured
cost-per-inquiry is not a cost-per-converted-client, and presenting one as the other is the same
error as reading a rate off a sample too small to carry it.

## Then: pick the form

| What is on the table | Form that shows it |
|---|---|
| A document section being restructured | One row per part: skeleton on the left, real prose on the right, annotations beneath |
| A set of edits | Paired before and after, with the changed span marked inline, never whole paragraphs |
| Competing options | A matrix, one row per option, columns only for axes that actually differ |
| A decision | The options, the crux named explicitly, the recommendation marked, what would change it |
| A process or pipeline | Left-to-right sequence with the state of each step encoded, not just labelled |
| Research findings | Hierarchy of claim, evidence, and source quality — source tier is usually the useful column |
| A plan | Dependency order. What blocks what, what is decided, what is still open |
| Numbers across time or categories | A chart. Load the `dataviz` skill before writing any chart code |
| Work that will be scored or judged | The criteria as rows — the judge's own wording against what the work currently supplies, coverage marked. See the next section |

If none fits, build the shape the subject actually has rather than forcing it into one of these.

## When you draw a diagram

The default failure is a picture of the *document's structure* rather than of its *subject* — boxes
holding abstract nouns, joined by arrows. `/academic-figures` diagnosed this in Aug 2026 and TJ rejected
a whole set for it again in Sept 2026: *"the stock Claude visuals maker does a lot of boxes with texts
and arrows, something like an unartistic MBA would make."* Four rules that fix it:

- **Draw quantities, not nouns.** A box labelled "reserve" is a noun. A vessel with a level in it that
  drains at a stated rate is a quantity. Everything drawn should be something you could put a number on.
- **Arrows point at evidence, never at abstractions.** An arrow annotating something real in the frame —
  a line in a document, a row on a screen, a point on a chart — is fine and is what Vox does well. An
  arrow connecting two labelled boxes is a diagram of a taxonomy. If the second kind is the only thing
  holding the picture together, the picture is a sentence.
- **Fidelity is hierarchy.** One element carried sharp; the rest greeked, dimmed or defocused. On a *real*
  document use a highlight on the one clause rather than greeking the page — the point of showing a real
  document is that it is real.
- **One idea per figure.** If it needs two sentences of caption to explain, it is two figures.

## Check the geometry before you publish, programmatically

**Never trust a visual read for overlap.** In Sept 2026 two published frames shipped with colliding text
and a shape sitting on top of another; both survived a careful look and both were obvious to TJ
immediately. Eyeballing a downscaled render does not catch this.

After the page renders, walk every `<svg>` and compare bounding boxes: flag any two `<text>` nodes whose
boxes overlap by more than a few units, and any element extending outside the `viewBox`. It is a dozen
lines of `getBBox()` in the browser and it catches the entire class of defect at once. Fix, re-run, and
only then publish.

## When the subject will be judged against explicit criteria

Grant applications, RFP responses, pitch decks facing diligence, anything with a published rubric. This
is the case where the form is not a judgement call, because the criteria are the spine.

**Go read the actual criteria first.** The source document, not a summary of it and not what you
remember about the mechanism. This changes the analysis substantially and it is cheap. For NIH work the
scored criteria are in the announcement's Section V, and TJ keeps the full announcement in the project's
FOA folder.

Then build the map: one row per criterion, the criterion's **own words** quoted on one side, what the
work currently hands it on the other, and a coverage mark. Paraphrasing the criteria lets you
unconsciously grade against your own standard instead of the reader's.

- **Coverage is the finding.** A criterion getting nothing is worth more attention than a weak answer to
  one already covered. The most useful thing this form surfaces is that a section can be genuinely
  strong and still be answering only one of the four questions being asked of it.
- **Rank findings by what they cost against those criteria**, not by how wrong they are. A true
  statement in the wrong place can cost more than an unsourced one.
- **Watch for evidence inverted against weighting** — the work is strongest where the reader scores
  lightly and thinnest where they score hardest. It is common, invisible in prose, and obvious on the
  page once coverage is drawn.

## Layering is where the value is

The single most useful move is putting **two or three layers on one surface** so they can be read
against each other. Structure and content. Content and annotation. Current and proposed. Prose in a chat
can only show one at a time, which is exactly why the picture helps.

- **Encode state in form, not only in words.** Highlight, weight, a tag, a rule. TJ should be able to see
  the *scale* of something before reading any of it — how much is new, how many are unresolved.
- **Keep the layers visually distinct.** Different type family for the apparatus than for the subject
  matter is usually enough, and it reads as considered rather than decorated.
- **Show the real content, never a paraphrase.** If it is document prose, use the actual sentences. The
  point is to assess the thing, not a description of it.
- **If he has to act on it, put the actions on the same page and wire them to the analysis.** A critique
  he agrees with and cannot execute is half a deliverable. Number the concrete changes, then link each
  finding to the change that closes it and each change back to the finding, so the page works read from
  either end. Analysis and action are the two layers, and the wiring between them is the third.
- **Leave a visible blank rather than a plausible value.** When a number, name, threshold or citation is
  needed and you cannot source it, style the slot so it reads as a slot and say who owns it. A marked
  blank is a task someone completes; an invented value is a liability that survives into the final
  document.

## Design

Load the `artifact-design` skill before writing the page — the harness requires it, and it carries the
theming rules that keep the page readable in both light and dark.

Beyond that, two things specific to TJ:

- **This is almost always a working document, not a landing page.** Utilitarian treatment done well.
  Real typographic hierarchy, considered spacing, a palette chosen for the subject. No giant hero.
- **His taste runs anti-corny.** Reach past the obvious visual move. No emoji as section markers, no
  gradient heroes, no centered everything.

## Close by pointing

Do not hand over a dense page and stop. **End the message with the one thing the visual reveals** that
was hard to see in prose, and where to look for it. He asked for this because he could not see it;
finish the job by aiming him at it.

## Mechanics

- Publish it. Give him the link.
- **If the project already has a page format for this kind of work, read it and match it.** Check the
  repo for a prior artifact or its archive before inventing a second layout. Consistency across a
  project's pages is worth more than a better format he has to relearn, and the older page usually
  encodes decisions you would otherwise re-derive. `/crp-review` owns the edit-panel anatomy for TJ's
  grant work, number and tag, before and after side by side, a shaded block to paste and internal notes
  after it, warnings inside the edit they gate. Follow that spec rather than restating it here.
- Mention printing to PDF if the thing is likely to be shared with a team or filed in Drive.
- To revise, republish the same file path in the same conversation, which keeps the URL. Do not mint a
  new link for an iteration.
- Artifacts are private until he shares them.
