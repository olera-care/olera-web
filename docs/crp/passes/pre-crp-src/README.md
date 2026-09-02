# Pre-CRP Commercialization and Execution Plan, house style

> **SUPERSEDED.** Superseded on 2026-09-02 by `../pre-crp-memo-src/`, which combines this
> memo and the week-by-week plan into one integrated document. Kept for
> provenance: `orig.docx` and `text.json` are still the only verbatim record
> of Logan's 1 September draft. The build here no longer ships a deliverable.

Source: `Olera_Pre_CRP_Commercialization_Plan.docx` (Logan, 2026-09-01), kept here
as `orig.docx`. Four pages, PDF and Word both.

```
python3 build_pre.py                  # pre.html, then print to PDF
WORD_EXPORT=1 python3 build_pre.py    # pre_word.html
python3 mkdocx_pre.py                 # Olera_Pre_CRP_Commercialization_and_Execution_Plan.docx
```

`text.json` is extracted straight from `orig.docx` and is what the build reads,
so no sentence is retyped. Every sentence and table cell was verified verbatim
against the rendered PDF.

## What changed

Formatting only, with two exceptions noted below.

- House type: 11pt Arial justified, 9pt tables and captions, uppercase section
  heads with a rule, bold run-in lead-ins, teal row labels.
- The two subsection headings become the bold lead-in of the paragraph beneath
  them rather than a second bold line stacked above one.
- The eleventh section's bullets become a real list.
- One caption added to each of the four tables. The source had none, and a table
  without a caption is not house style.

Two wording changes:

1. **Title.** "Olera Pre-CRP Commercialization Plan" became "Olera Pre-CRP
   Commercialization and Execution Plan", per Logan's instruction when handing it
   over. It also disambiguates it from the CRP Commercialization Plan itself,
   which is a different document with a different audience.
2. **Two em dashes removed**, both in subsection headings: "Provider Product A —
   Olera Pro: Client Growth" became "Provider Product A, Olera Pro Client
   Growth". Same for Product B. House style permits no em dashes.

The three en dashes are all numeric or date ranges and are left as written.

## Left alone, flagged instead

- "D. Private capital & platform thesis" keeps its ampersand. Every other Olera
  document spells out "and", but this is the author's row label and changing it
  is an editorial call rather than a typographic one.
- Table 4 splits across pages 3 and 4 with its header repeating. It could be kept
  whole by shrinking it, at the cost of tighter rows.
