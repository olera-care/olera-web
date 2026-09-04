# MedJobs 2.0 Master Implementation Matrix, house style

Source: `MATRIX.md` (Logan, 2026-09-04), with `md2html.py` and `html2pdf.mjs`
from the same hand. 38 pages, down from 57.

```
./build.sh
```

PDF only. The toolchain is markdown to HTML to Chromium, and there is no Word
path through it. Say the word if a `.docx` is wanted and one can be added.

## What changed

### The prose: 297 em dashes

House style permits no em dashes and en dashes only in numeric ranges, and the
source used 297. `dedash.py` removes them, and it is the bulk of the work in
this pass. The rules, in order:

1. A stage heading takes a colon. `PR1 — Target list built` becomes
   `PR1: Target list built`.
2. An exhibit caption takes the house caption form. `**Exhibit A — Sites.**`
   becomes `**Exhibit A. Sites.**`
3. A table cell holding nothing but a dash becomes `None`, 17 of them.
4. A matched pair inside one sentence is parenthetical: commas, or brackets when
   the aside already contains a comma.
5. Anything left introduces or expands the clause after it, so it takes a colon.

The source soft-wraps its paragraphs, so a parenthetical pair frequently
straddles a newline. Paragraphs are joined before the rules run and re-wrapped
at 110 characters afterwards. **Anything inside a fenced code block is left
completely alone**, because the flow diagram's every line and column is
load-bearing; an earlier version of this script joined it into one 4,934
character line and destroyed it.

`fixes.json` holds 27 hand corrections where the automatic choice read badly:
a colon before `or`, a comma splice, `see the deferred list` wanting a full stop
rather than a colon, and a comma that landed inside a quotation mark. The build
asserts every fix still matches, so a future edit to `MATRIX.md` that strands one
fails loudly rather than silently skipping it.

### The look

- 11pt Arial on a 7.5in column, replacing 11.4pt Charter on a 6.7in one.
- Teal `#14453f` for structure, replacing the blue.
- Section heads uppercase with a rule; the circled-numeral layer heads in teal.
- Tables at 9pt with a teal header rule and no zebra striping.
- **Exhibit captions moved under the exhibit**, where house style puts them. The
  source writes the caption as the paragraph above the image; `md2html.py` swaps
  the pair into a `<figure>` that cannot break across a page.
- Blockquotes become house notes: grey, with a rule down the left.
- Page margins 0.5in, from 0.72 and 0.9, which is what recovers the 19 pages.

### Left alone

- **The flow diagram** is still the author's monospace drawing, exactly as
  written. Redrawing it in the house vector figure system would be a better
  artifact and is a separate job.
- **The running footer** with page numbers. Not house style strictly, but this
  is a 38-page reference document and it earns its place.
- **The contents block**, restyled to two columns between rules rather than
  dropped. Same reasoning.
- **Arrows, ticks, checkboxes and middle dots** are interface glyphs quoted from
  the product and stay as written.

## Exhibits

`exhibits/` holds all 30 screenshots. They were recovered from `orig.pdf`, since
the originals did not come with the markdown, and mapped to their filenames by
document order. The mapping was checked two ways: the two portrait images landed
on the flyer and the agreement, which are the only two portrait assets, and
`A-sites.png` was opened and confirmed to be the Sites screen.

They are 640px wide. The plate is capped at 6.6in rather than the full 7.5in
column, which holds them near 97 dpi instead of 85. They will still look soft in
print. Logan's call, 2026-09-04, was to use them rather than re-capture.

## Verification

Every word of `MATRIX.house.md` was compared against the text layer of the
rendered PDF. 559 source words do not appear in the render and all 559 are
accounted for: image alt text, link URLs, markdown rules, and backslash escapes.
Nothing of the document's content is missing.

A second check compares `MATRIX.md` against `MATRIX.house.md` directly: 9 words
changed and 27 added, which is exactly the 17 `None` cells, the 30 exhibit
letters gaining a period, and the capitalisation that follows the hand-corrected
full stops.
