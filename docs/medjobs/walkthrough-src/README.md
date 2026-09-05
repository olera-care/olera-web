# MedJobs operating-system walkthrough, house style

Source: `MedJobs_Operating_System_Walkthrough_Summary.docx` (Logan, 2026-09-04),
kept here as `orig.docx`. Two pages, PDF and Word.

```
python3 build_wt.py                  # wt.html, then print to PDF
WORD_EXPORT=1 python3 build_wt.py    # wt_word.html
python3 mkdocx_wt.py                 # MedJobs_Operating_System_Walkthrough_Summary.docx
```

`text.json` is extracted straight from `orig.docx` and is what the build reads,
so no sentence is retyped. A check confirms every paragraph and table cell
appears verbatim in the rendered PDF.

## What changed

Formatting, with the two wording changes below.

- House type: 11pt Arial justified, 9pt tables and captions, uppercase section
  heads with a rule, bold run-in lead-ins, teal row labels.
- The title line, the subtitle and the date line become a doctitle and one lede.
  The pipe separator becomes the house middle dot.
- **The callout box becomes a note.** The source puts "How to use this guide" in
  a one-cell table, which reads as a table with one enormous cell. It is now a
  9.5pt grey note with a rule down the left, which is what house style uses for
  an aside.
- **The seven run-in labels the author already wrote are bolded**: "Target list
  and outbound work.", "Founder meeting.", "Client Success.", "Advisor
  prospecting and outbound.", "Advisor meeting and handoff.", "University
  activation.", "Application." The four paragraphs that begin with an ordinary
  sentence are left alone.
- **Section 6's bullets become a real list** with the label bolded. The colon
  after each label becomes a period, which is how a run-in lead-in is set
  everywhere else in the house.
- "Bottom line:" is set the same way and given a little space above it.
- One caption added to the stage table. The source had none, and a table without
  a caption is not house style.

## Wording changes

1. **Curly apostrophes become straight ones**, three of them, matching every
   other Olera document.
2. **"Walkthrough Summary & Reader Guide" becomes "and"**, since it is a
   description rather than a proper name.

No em dashes in the source and none added. The only non-ASCII characters left in
the rendered document are the arrows in the section headings and the middle dot
in the lede.

## Left alone, flagged instead

- **The ampersand in Section 3's heading**, "University & Student Side". The
  author's, and in a heading rather than running text.
- **The arrows** in the Section 2, 3 and 4 headings. The author's notation, and
  U+2192 is in Arial's core set.
- **Nothing was reconciled against `../OPERATIONAL_BRIEF.md`.** This was a
  formatting pass. If the walkthrough and the engineering reference disagree
  about the funnel, that is a question for a separate read.

## Notes on the two exports

Both are two pages, and both pages begin at the same point, within about 3pt
through the document.

`mkdocx_wt.py` is `../../crp/passes/pre-crp-v4-src/mkdocx_v4.py` with three
changes: the note carries a left paragraph border to match the stylesheet, the
"Bottom line" paragraph gets its own branch, and a table caption's bottom
spacing is zeroed because the stylesheet's 5pt margin collapses into the
following heading's 11pt while Word adds them.

The stage table's caption has to fit on one line. At its first length it wrapped
in Word but not in the print render, and one wrapped caption line was enough to
push the last line of the document onto a third page.
