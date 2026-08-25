# CRP figure house style

Default standard for every CRP figure. Extracted from the lessons paid for while
building the ecosystem figure (`figure-ecosystem.html`, LOCKED 2026-08-24;
Figure 2 in the current sequence), which is the
reference point for the quality bar. Apply these before drafting, not after
feedback.

## Principles

1. **Purpose before pixels.** State the figure's single intellectual purpose in
   one sentence before designing. If the sentence needs "and," it is two figures.
2. **One argument per figure.** Everything on the canvas either advances that
   argument or comes off. A figure is not a place to store facts.
3. **Use the full canvas, and spend whitespace deliberately.** Breathing room is
   a design element, not leftover space. Cramped corners and dead margins both
   signal a layout problem.
4. **Show, don't caption.** Prefer visual storytelling (characters, devices,
   arrows, a drawn cycle) over boxes filled with prose. If a box exists only to
   hold sentences, redesign it.
5. **Text is short, concrete, and large.** Fragments over sentences, nouns over
   abstractions, and the biggest font size the layout allows. If text must
   shrink below ~8pt to fit, cut words instead.
6. **Containers span their full width.** No orphaned half-width boxes creating
   accidental columns.
7. **No boxes inside boxes** unless the nesting itself carries meaning (a thing
   genuinely contains another thing). Nesting for tidiness reads as clutter.
8. **No decoration.** No pills, badges, tier color-coding, or redundant
   subtitles. Every visual element must earn its place in the argument.
9. **Vocabulary discipline.** Use only ratified terms (see the strategy record
   and logos outline). One name per concept across all figures; never introduce
   a new coinage inside a figure.
10. **Consistent visual language across the set.** Same palette, same arrow
    grammar, same box semantics (solid = today, dashed = emerging or
    counterfactual) in every figure.
11. **Never repeat a prior figure's information.** Each figure assumes the
    reader has the previous one. Repetition is a signal the sequence is wrong.
12. **Serious QA before showing.** Render to PDF, verify the page count, and
    inspect a screenshot at true print width. Look for text overflowing
    containers, elements colliding, arrows detached from targets, and clipping
    at canvas edges. Logan should never be the one to catch an obvious defect.
13. **The bar:** quick to grasp at a glance, rewards closer inspection, and has
    no defect a careful reader would notice.

## House craft (mechanics)

- **Format:** single HTML file, inline SVG, landscape letter, 0.35in margins
  (`@page { size: letter landscape; margin: 0.35in; }`), Arial.
- **Palette:** `#1a7f4e` (primary green), `#eaf5ee` / `#f5faf7` (green fills),
  `#1f4534` (dark green), `#1f2a24` (text). Counterfactual/negative content:
  `#b04040` strokes on `#fdf3f2`, dashed.
- **Canvas:** `viewBox="0 0 980 600"` for a full landscape page. True print
  content width is 979px; QA screenshots at `--window-size=979,...`, never
  wider (a 1056px screenshot passes layouts that print rejects).
- **Render:** headless Chromium `--print-to-pdf` with `--no-pdf-header-footer`;
  verify page count with `grep -ac MediaBox file.pdf`. One figure = one page,
  always.
- **Geometry is computed, not eyeballed.** Rings, arcs, and arrowheads come
  from a small Python script (nodes at clockwise angles via
  `(cx + r*sin(t), cy - r*cos(t))`, arc gaps of 13-16 degrees, tangent-aligned
  arrowheads).
- **No em dashes anywhere**, in figures as in prose. En dashes only in numeric
  ranges.
- **Locked figures** live in this directory as standalone HTML plus rendered
  PDF, with a LOCK comment in the file header. Working drafts stay in
  `../passes/`. A locked figure changes only on Logan's explicit direction.

## Failure modes we have actually shipped

- **Chart cosplay.** Borrowing the look of a chart (bands, axes, timelines) for
  information that is not quantitative. If neither axis encodes a value and no
  length or position carries meaning, it is a diagram wearing a chart's clothes,
  and it reads as filler. Match the grammar to the shape of the information:
  quantities get charts, relationships get diagrams, exchanges get paired
  arrows, attributes across cases get tables.
- **Containers larger than their contents.** A box whose text occupies half its
  width is not "breathing room," it is dead space. Size containers to content.
- **Repeating a neighbor's composition.** Two adjacent figures doing different
  intellectual jobs must not share a layout archetype, or the reader reads them
  as variations of one slide. Vary the architecture across the sequence while
  holding palette, type scale, and icon set constant.
