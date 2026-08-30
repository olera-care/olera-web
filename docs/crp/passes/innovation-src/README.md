# Innovation section, house style

Source: Logan's Innovation draft, 2026-08-30. Two pages, both filled, PDF and
Word paginating identically.

```
export PYTHONPATH=../cp-rebase-src:../statement-of-need-src
python3 build_inn.py                  # inn.html, then print to PDF
python3 raster_inn.py                 # png/ at 300 dpi
WORD_EXPORT=1 python3 build_inn.py    # inn_word.html
python3 mkdocx_inn.py                 # Olera_CRP_Innovation.docx
```

## The figures

Redrawn in the house vector system (`figs_inn.py`) rather than reproduced from
the draft's illustrations. The draft arrived as a roughly 90 dpi screenshot, so
cropping would have degraded them; vector holds at any size, matches the rest of
the application, and packs the same content into far less vertical space, which
is what got the section to two pages.

Each figure keeps the draft's content and reading order:

| Figure | Draft | House version |
|---|---|---|
| 1 | Photo, seven-step strip, separate case-record band | One figure: the seven events above, dashed writes down into the case record below |
| 2 | Two rows with illustrated households and a laptop | Same two rows, same five tools, same five verified steps |
| 3 | Comparison panels plus a separate capacity-intelligence box with a map | One figure: the pool cycle and capacity intelligence on the left, the new-supply chain on the right, an arrow showing intelligence directing supply |
| 4 | Three case cards flanking phone and laptop mockups | Three case cards converging on one case record and one endpoint |

What is lost: the photographs, the illustrated people, and the device mockups.
Those carried warmth rather than argument, and the device mockups in particular
cost about two inches of height for content already stated in the prose. If the
originals are wanted instead, drop them in `png/` as `fig1.png` through
`fig4.png` and set `WORD_EXPORT`; the layout takes them at native resolution.

`checkfigs` reports no clipped and no colliding text in any of the four. Type is
9.5pt in the figures and 11pt in the body, with 9pt captions.

## Changes to the prose

Transcribed as written, with three em dashes removed per house style:

1. "early pathway states&mdash;needs and means, available benefits/aid, and
   relevant providers&mdash;through Phase I-IIB" became "the early pathway states
   through Phase I to IIB: needs and means, available benefits and aid, and
   relevant providers"; "benefits/aid" became "benefits and aid".
2. "downstream innovations&mdash;AI execution ... and capacity intelligence ..."
   became "the foundation the other two innovations stand on: AI execution ...
   and capacity intelligence ...".
3. Figure 4's caption, "the same outcome&mdash;care established", became "the
   same outcome: care established".

Structural, to reach two pages:

- Subheadings became bold run-in lead-ins, the convention in every other section.
- Key Innovation 1's two paragraphs joined, and Key Innovation 3's two joined.
  No sentence was cut.
- Figure 1 absorbed the separate case-record band, and Figure 3 absorbed the
  separate capacity-intelligence box, so six graphics became four figures.

## Open question

These Key Innovations 1, 2 and 3 are not the ones in the live Research Strategy,
which are "Infrastructure that adds formal caregivers to the field", "A database
that turns real outcomes into better accuracy and better judgment", and "A care
system that carries the case to confirmed care". This draft replaces all three.
Confirm that is the intent, and note that the old Key Innovation 1 carried the
population-agnostic argument and the Aim 2 campus-versus-no-campus test, and the
old Key Innovation 2 carried the three-layer data argument and the open-weight
post-training commitment. None of those appear here.
