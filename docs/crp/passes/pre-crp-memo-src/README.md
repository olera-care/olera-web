# Pre-CRP R&D, Commercialization, and Execution Plan, house style

One integrated memo. It replaces the two separate September documents:
`../pre-crp-src/` (the commercialization memo) and `../pre-crp-plan-src/` (the
week-by-week plan). Both source directories are kept for provenance; neither
produces a live deliverable any more.

Nine pages, PDF and Word paginating identically.

```
export PYTHONPATH=../cp-rebase-src:../statement-of-need-src
python3 build_memo.py                  # memo.html, then print to PDF
python3 raster_memo.py                 # png/fig1.png at 300 dpi
WORD_EXPORT=1 python3 build_memo.py    # memo_word.html
python3 mkdocx_memo.py                 # Olera_Pre_CRP_RD_Commercialization_and_Execution_Plan.docx
```

## The architecture

Ten sections, in this order: purpose; the ecosystem and the pathway (Figure 1);
the five-year arc (Table 1); provider commercialization; CareNavigator's current
state and its CRP-entry line; institutional-buyer development (the fifteen
questions); private investors (the seven-part thesis); the January scorecard
(Tables 2 and 3); week by week (Table 4 and the eighteen blocks); the January
end state.

This is not the two old documents pasted together. The week plan is a section
rather than an attachment, the scorecard is organised by the risk each result
retires rather than by the activity that produced it, and Section 2 states the
reason the products belong in one company, which neither source document did.

## What is new relative to the two sources

- **Figure 1**, the orientation figure. Ecosystem, pathway, and which product
  acts on which step. Built by `figs_memo.py`; `checkfigs.check` is clean.
- **Section 3**, the five-year arc, replacing the old four-row CareNavigator
  commercialization path.
- **Section 6's fifteen questions**, replacing a paragraph describing what buyer
  discovery should establish.
- **Section 7's seven-part thesis**, replacing three paragraphs of platform prose.
- **Table 2**, eight risks (R1 to R8) instead of seven activity dimensions, and
  **Table 3**, which maps each January result to a scored review criterion.
- **Table 4**, the conference table. No date in it is confirmed.
- **The week blocks** carry no owners. Owners are assigned in the Week 1 session,
  which is itself a Week 1 task. Every task carries the risk tag it retires.

## Evidence discipline

Four words are used precisely and are defined in Section 1: known, hypothesized,
target, stretch. Two facts in particular are stated against interest rather than
smoothed over, both in Section 5:

1. The Phase IIB Aim 3 study measures acceptance and caregiver outcomes (modified
   TAS, MARS, CSES-8, PANAC, with QDRS as covariate), **not** care establishment,
   so it is not preliminary effectiveness evidence for the CRP endpoint.
2. It runs through Q2 2027, so nothing in the January application can depend on
   its results. Source: `../../reference/rppr/phase-iib-year2-rppr.md`.

Provider figures (900+ student applicants, 25 placed, four agencies trialed and
three paid at roughly $275 per placement, 700+ claimed listings, 72,000+ records)
come from `../../living/Research_Strategy_2026-08-31`. The $250 stretch price is
deliberately set below what agencies have actually paid.

## Calendar facts

- Week 1 is the week of Monday 31 August 2026; Week 18 ends Friday 1 January 2027.
- Week 13 is Thanksgiving; Weeks 17 and 18 contain Christmas and New Year. No new
  work is planned into any of them.
- The internal deadline is **Week 16, 18 December**, not 1 January.

## Notes on the two exports

- The checkpoint and holiday markers are words on the header line, not a left
  rule. A rule set with a negative margin lands inside the `@page` margin box,
  which Chromium clips out of a print render.
- `mkdocx_memo.py` differs from its siblings in three places: `flatten()` unwraps
  the nested week `div` and pushes a quiet week's class down onto its children;
  `add_runs` keeps a span stack so the risk tags and checkpoint markers get their
  own size and colour; and a bold first table column keeps its bold across a
  `<br>`, which the one-paragraph-per-line split would otherwise drop.
- Week-block spacing differs by design between the two builds (PDF `div.wk`
  4pt, Word `wkh` space-before 8.5pt). Word sets single-spaced 10pt tighter than
  the PDF's 1.2 line box; the asymmetry is what makes both fit eight week blocks
  on page 7.
