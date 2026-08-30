# Innovation section, house style

Source: Logan's Innovation draft, 2026-08-30, supplied as a screenshot. The prose
is transcribed from it; the four figures are raster illustrations whose source
files are not yet in hand.

## Filling in the figures

`build_inn.py` looks for each figure at a fixed path. Drop the file in and
rebuild; nothing else changes.

| Slot | Path | Contents in the draft |
|---|---|---|
| Figure 1 | `png/fig1.png` | Photo plus the seven-step pathway strip |
| (unnumbered) | `png/case-record.png` | Longitudinal Case Record band, seven fields |
| Figure 2 | `png/fig2.png` | General-purpose AI row above, CareNavigator row below |
| Figure 3 | `png/fig3.png` | Redistributing the same pool vs creating new supply |
| (unnumbered) | `png/capacity.png` | Olera Capacity Intelligence box with the map |
| Figure 4 | `png/fig4.png` | Three case cards with the phone and laptop mockups |

Supply them at 300 dpi or better for the printed width in `FIGS` (Figure 2 and
Figure 4 run the full 7.3in column, so 2200px wide or more). They are placed at
their native resolution and never resampled up.

The widths and heights in `FIGS` are read off the draft and are estimates. Adjust
each to the real image's aspect ratio when it arrives; the render is three pages
on the placeholder heights and should come back to two.

```
python3 build_inn.py                  # inn.html, then print to PDF
WORD_EXPORT=1 python3 build_inn.py    # inn_word.html
```

## Changes made to the prose

Transcribed as written, with three em dashes removed per house style:

1. "early pathway states&mdash;needs and means, available benefits/aid, and
   relevant providers&mdash;through Phase I-IIB" became "the early pathway states
   through Phase I to IIB: needs and means, available benefits and aid, and
   relevant providers." The colon carries what the dashes were carrying;
   "benefits/aid" became "benefits and aid".
2. "downstream innovations&mdash;AI execution ... and capacity intelligence ..."
   became "the downstream innovations below: AI execution ... and capacity
   intelligence ...".
3. Figure 4's caption, "the same outcome&mdash;care established", became "the
   same outcome: care established".

Subheadings became bold run-in lead-ins, which is the house convention in every
other section and recovers roughly a third of a page across the two.

## Open question

The draft's Key Innovations 1, 2 and 3 are not the Key Innovations 1, 2 and 3 in
the live Research Strategy, which are "Infrastructure that adds formal caregivers
to the field", "A database that turns real outcomes into better accuracy and
better judgment", and "A care system that carries the case to confirmed care".
This draft replaces all three. Confirm that is the intent before it goes into the
live document, and note that the old Key Innovation 1 carried the
population-agnostic argument and the Aim 2 campus-versus-no-campus test, which
this draft does not.
