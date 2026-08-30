# Innovation (v5), house style

Source: `Olera_CRP_Innovation_Final_TwoPage_v5.pdf` (`v5.pdf` here). Output is
2.45 pages: two full pages plus a little under half of page 3. PDF and Word
paginate identically.

```
export PYTHONPATH=../cp-rebase-src:../statement-of-need-src:../innovation-src
python3 build_v5.py                  # v5_house.html, then print to PDF
python3 raster_v5.py                 # png/ at 300 dpi
WORD_EXPORT=1 python3 build_v5.py    # v5_word.html
python3 mkdocx_v5.py                 # Olera_CRP_Innovation_v5.docx
```

## Figures

All four rebuilt in the house vector system (`figs_v5.py`). Same concepts, same
reading order. Nothing prints below the 9.5pt floor, and `checkfigs` reports no
clipped or colliding text in any of them.

The draft's figures put most of their labels between 3 and 5pt and let text run
outside its own boxes. The fix is structural: boxes here are sized from their
measured content (`_cardh`, `_card`, `_row`) rather than from a guessed constant,
which is what let the draft's text escape its containers.

| Figure | What it carries |
|---|---|
| 5 | Fragmented inputs, the Phase IIB eldercare LLM, the seven-domain Care Establishment Model |
| 6 | A general-purpose answer that stops at a list, against execution and the field-learning loop |
| 7 | Where cases stop by county, and the supply chain directed at that deficit |
| 8 | Three entry paths, one interface over four layers, one verified endpoint |

The county bottleneck figures in Figure 7 (workforce 41%, execution 18%, funding
12%, provider capacity 9%) are the draft's own illustrative numbers. They are
labeled "illustrative" in the figure so they cannot be read as measured results.

## Condensation

1,189 words down to 1,000, in two passes. Every claim in the draft survives. What
came out was material the figures now carry (input lists, tool lists, the three
use-case walkthrough in the closing paragraph) and sentence pairs that restated
each other. Two examples:

- The closing paragraph walked through all three use cases in prose. Figure 8
  shows them, so the prose now names them in one clause and points at the figure.
- "The model also makes the pathway measurable ... Olera can therefore observe
  where, why, and how quickly care establishment fails" became one sentence.

Subheadings became bold run-in lead-ins, the convention in every other section.

## Getting to two pages

Not reachable without cutting substance. The four figures are 8.3in of the 20in
a two-page section has, leaving about 10.5in for text, or roughly 640 words
against the 1,000 that remain after condensing. Landing at 2.45 pages took the
condensation above plus moving Figure 6 up one paragraph, directly after the
sentence that first references it, which recovered about two inches of
page-break waste on page 1.

To reach two pages, roughly 350 more words would have to go, or one figure. The
cheapest single cut is Figure 5, whose content is partly restated in Figure 6's
left-hand block.
