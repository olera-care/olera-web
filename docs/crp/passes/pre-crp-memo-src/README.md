# Pre-CRP R&D, Commercialization, and Execution Plan, house style

Eight pages, PDF and Word. Replaces the two September drafts kept for provenance
in `../pre-crp-src/` and `../pre-crp-plan-src/`; neither of those ships a
deliverable any more.

```
export PYTHONPATH=../cp-rebase-src:../statement-of-need-src
python3 build_memo.py                  # memo.html, then print to PDF
python3 raster_memo.py                 # png/fig1.png at 300 dpi
WORD_EXPORT=1 python3 build_memo.py    # memo_word.html
python3 mkdocx_memo.py                 # Olera_Pre_CRP_RD_Commercialization_and_Execution_Plan.docx
```

## Structure

Ten sections: purpose; the ecosystem and the pathway (Figure 1); the five-year
sequence (Table 1); provider commercialization; CareNavigator's current state and
its CRP-entry definition; institutional-buyer development (fifteen questions);
private investors (seven-part thesis); the January scorecard (Tables 2 and 3);
the week-by-week plan (Table 4 and eighteen week blocks); the intended end state.

The scorecard is organized by the risk each result addresses rather than by the
activity that produced it, and the week plan is a section rather than an
attachment. Week blocks carry no owners; owners are set in the Week 1 session,
which is itself a Week 1 task. Each task carries the risk tag it addresses.

## Register

Plain and declarative. No aphorisms, rhetorical inversions, or restatement of one
idea in three forms. No reference to earlier drafts of the plan or to the review
process that shaped it: the document reads as the first statement of the plan.

## Evidence discipline

Four terms are defined in Section 1 and used consistently: known, hypothesized,
target, stretch. Two facts are stated against interest in Section 5:

1. The Phase IIB Aim 3 study measures acceptance and caregiver outcomes (modified
   TAS, MARS, CSES-8, PANAC, with QDRS as covariate), not care establishment, so
   it is not preliminary effectiveness evidence for the CRP endpoint.
2. It runs through Q2 2027, so the January application cannot rely on its results.

Source: `../../reference/rppr/phase-iib-year2-rppr.md`.

Provider figures (900+ student applicants, 25 placed, four agencies trialed and
three paid at roughly $275 per placement, 700+ claimed listings, 72,000+ records)
come from `../../living/Research_Strategy_2026-08-31`. The $250 stretch price is
below what agencies have paid to date.

No conference date is confirmed. Table 4 says so and Week 1 carries the task.

## Calendar facts

- Week 1 is the week of Monday 31 August 2026; Week 18 ends Friday 1 January 2027.
- Week 13 is Thanksgiving; Weeks 17 and 18 contain Christmas and New Year. No new
  work is planned into any of them.
- The internal deadline is **Week 16, 18 December**, not 1 January.

## Notes on the two exports

Both are eight pages, and each page break falls inside the same paragraph or
table in both. Breaks can differ by one line, because Word and the print renderer
round a justified line differently and a paragraph occasionally wraps to one more
line in one than the other.

Four differences in `mkdocx_memo.py` relative to its siblings, all needed to get
that close:

- `flatten()` unwraps the nested week `div` and pushes a quiet week's class down
  onto its children.
- `add_runs` keeps a span stack, so the risk tags and the checkpoint and holiday
  markers get their own size and colour.
- `exact()` pins every paragraph's line box to the PDF's computed line height.
  Word's SINGLE rule is a font-metric height, about 1.15 em, and left alone the
  two drift roughly half a point a line.
- Widow control is off for body prose, and the figure block's own spacing is
  zeroed to offset the roughly 10pt of font leading LibreOffice adds under an
  inline image.

The checkpoint and holiday markers are words on the header line rather than a
left rule: a rule set with a negative margin lands inside the `@page` margin box,
which Chromium clips out of a print render.

A bold first table column keeps its bold across a `<br>`; the one-paragraph-per-
line split that avoids Word's run-level break bleed would otherwise drop it.
