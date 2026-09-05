# Pre-CRP R&D, Commercialization, and Execution Plan, house style

> **SUPERSEDED.** Superseded on 2026-09-02 by `../pre-crp-v4-src/`, iteration 4
> of the same plan. Kept for provenance; the build here no longer ships a
> deliverable.

Source: `Olera_Pre_CRP_Plan_Regenerated.docx` (Logan, 2026-09-02), kept here as
`orig.docx`. Six pages, PDF and Word.

```
python3 build_v2.py                  # plan.html, then print to PDF
WORD_EXPORT=1 python3 build_v2.py    # plan_word.html
python3 mkdocx_v2.py                 # Olera_Pre_CRP_RD_Commercialization_and_Execution_Plan.docx
```

`text.json` is extracted straight from `orig.docx` and is what the build reads,
so no sentence is retyped. Every paragraph and every table cell was checked
against the rendered PDF.

## What changed

Formatting, with the three wording changes listed below.

- House type: 11pt Arial justified, 9pt tables and captions, uppercase section
  heads with a rule, bold run-in lead-ins, teal row labels.
- The three subsection headings become the bold lead-in of the paragraph beneath
  them rather than a second bold line stacked above one.
- The three bullets under "Why this strengthens CareNavigator" become a real list.
- One caption added to each of the four tables. The source had none, and a table
  without a caption is not house style.
- The eighteen weeks become blocks: week number and dates on the header line, the
  week's job as the line under it, the tasks as a numbered list, and the output as
  a run-in footer. The "Week's job" and "Tasks" labels are dropped because
  position now carries them; "Output" is kept as a run-in. The tasks are the
  author's own semicolon-separated sentence, one item per clause.
- Weeks 13 and 17 are marked HOLIDAY and weeks 5 and 9 CHECKPOINT. These are the
  four the author's own text identifies: two holiday weeks, a Month 1 scorecard
  review, and a go or re-cut decision before November.
- The title is set on one line. The source breaks it after "R&D,".

## Wording changes

Three em dashes, which house style does not permit. All three are in `EDITS` in
`build_v2.py`, applied to the extracted text at build time so the source file
stays untouched.

1. "is execution&mdash;whether Olera can" becomes "is execution: whether Olera can".
2. "care establishment&mdash;finding appropriate clients and maintaining enough
   workers to serve them&mdash;and Olera can address both" becomes "care
   establishment: finding appropriate clients and maintaining enough workers to
   serve them. Olera can address both". A comma pair here would have made four
   clauses in one sentence, so the sentence is split instead.
3. "Future technologies&mdash;including more capable AI systems or new forms of
   care delivery&mdash;can plug" becomes the same with commas.

Two colons removed: "Olera Pro: Client Growth" and "Olera Pro: Staffing" become
"Olera Pro Client Growth" and "Olera Pro Staffing", because as run-in lead-ins
they are immediately followed by "Customer promise:".

All en dashes are date or numeric ranges and are left as written.

## Left alone, flagged instead

- **Ampersands in the Table 1 row labels** ("Find & fund", "Plan & execute",
  "Staff & deliver", "Establish & verify"). Every other Olera document spells out
  "and", but these are the author's row labels and changing them is an editorial
  call rather than a typographic one.
- **The arrows** in Table 4 ("acquisition &rarr; activation &rarr; paid-product
  funnel", "Phase IIB &rarr; CRP &rarr; POC"). Author's notation; U+2192 is in
  Arial's core set and renders correctly.
- **No figure.** Table 1 carries the pathway in more detail than a diagram would.
  An ecosystem and pathway figure exists in `../pre-crp-memo-src/figs_memo.py` if
  one is wanted later.

## Notes on the two exports

Both are six pages. Four of the six page starts are identical; two differ by one
table row, where Tables 2 and 4 split. Holding either table whole costs more in
white space than the split costs in consistency, so both are left to break with
their headers repeating.

`mkdocx_v2.py` is `mkdocx_memo.py` with the table cell padding set to the
stylesheet's 2.8pt top and bottom. That build had it lower to offset drift the
figure introduced; there is no figure here.
