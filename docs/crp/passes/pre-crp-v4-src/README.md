# Pre-CRP plan, iteration 4, house style

Source: `Olera_Pre_CRP_RnD_Commercialization_Execution_Plan_Iteration_4.docx`
(Logan, 2026-09-02), kept here as `orig.docx`. Five pages, PDF and Word.

```
export PYTHONPATH=../cp-rebase-src:../statement-of-need-src
python3 build_v4.py                  # plan.html, then print to PDF
python3 raster_v4.py                 # png/fig2.png at 300 dpi
WORD_EXPORT=1 python3 build_v4.py    # plan_word.html
python3 mkdocx_v4.py                 # Olera_Pre_CRP_RD_Commercialization_and_Execution_Plan.docx
```

`text.json` was extracted straight from `orig.docx` and is what the build reads,
so no sentence is retyped. Tables 5 and 6 were subsequently rewritten in
`text.json` at Logan's instruction (see **Scorecard and week plan**, below); every
other word is the author's. A check confirms that every paragraph and table cell
in `text.json` appears verbatim in the rendered PDF.

## What changed

Formatting, with the dash changes listed below.

- House type: 11pt Arial justified, 9pt tables and captions, uppercase section
  heads with a rule, bold run-in lead-ins, teal row labels.
- The three subsection headings (A, B, C) become the bold lead-in of the
  paragraph beneath them rather than a second bold line stacked above one.
- One caption added to each of the six tables. The source had none, and a table
  without a caption is not house style.
- **Figure 1** is the author's own image, lifted out of `orig.docx` into
  `media/image1.png` and placed full width with its caption underneath. In the
  source the caption sat in the body text with the image above it.
- The date line under the title becomes the lede; the closing "living planning
  memo" paragraph becomes a working note.
- Table 1's first column carries stage, timeframe and status on three separate
  lines, as in the source. The status words become the small marker used
  elsewhere in the house, grey for COMPLETE and teal for WE ARE HERE, and the
  "we are here" row is shaded.

## Scorecard and week plan

Redrafted 2026-09-02 at Logan's instruction, after reading Table 5 against the
NOFO's three Statement of Need questions and the scored review criteria in
`../../solicitation-reviewer-reference.md`, and against the 2026-08-21 mock
review in `../mock-review-2026-08-21.md`.

Three changes to Table 5:

1. **Institutional buyers**: the stretch became the target. Convergent interviews
   are market research; a written, milestone-conditional letter naming population,
   endpoint, POC size and budget is what the third Statement of Need question
   turns on.
2. **Independent financing** replaces "private investors" and is written against
   the Fundraising criterion's actual test, third-party funds equal to or
   exceeding the NIH request, currently about $4 million. The target names the
   number and the forms of evidence the NOFO accepts.
3. **Phase IIB evidence** gains a count of episodes reaching verified established
   care. Uncontrolled and small, but it is the only pre-CRP observation of the
   endpoint the whole CRP rests on.

The eighteen weeks were reflowed to serve those rows: the letter of intent drafted
in Week 3 and first presented in Week 8, investor conversations opened in Week 6
rather than left to the award period, the care-establishment count added to the
study instrumentation in Week 4, and the $4 million proportionality answer written
into the CP in Week 12.

A fourth Table 5 row, platform coupling, was drafted and then removed at Logan's
instruction, along with its Gantt bar. Two week entries went with it: Week 14's
"report the coupling measurement", which after the removal reported into nothing,
and the words "instrument the coupling" from Week 2's job title. Week 2 keeps the
instrumentation task itself, because recording each customer's acquisition source
is worth having whether or not it is a tracked risk.

**Figure 2** is new: the same eighteen weeks as a Gantt, so the overlaps are
visible. Built by `figs_v4.py` in the house figure system; `checkfigs.check` is
clean. It asserts rather than clips if a row label is too long for the gutter.

## Wording changes

All dashes, all in `EDITS` in `build_v4.py`, applied to the extracted text at
build time so the source file stays untouched.

Four spaced hyphens doing a dash's work:

1. Three subsection headings, "Provider commercialization - retire
   commercial-execution risk" and the two like it, take a colon.
2. "technologies - including automation, AI, and robotics - can be incorporated"
   takes commas.

Hyphens in ranges become en dashes, which is the one place house style allows
them: the date line, the four stage timeframes in Table 1, the price range in
Table 2, and the eighteen week spans in Table 6.

No em dashes anywhere. The only non-ASCII character in the rendered document is
the en dash.

## Left alone, flagged instead

- **Figure 1 is a 1200 by 585 raster**, which is about 164 ppi at 7.3 inches
  wide. It reads correctly on screen and acceptably in print, but its type is
  softer than the vector figures elsewhere in the application. A vector rebuild
  in the house figure system is the fix if this figure is going in front of
  reviewers rather than the team.
- **Ampersands** in "Phase I & II" and "Find & Convert". The author's, left as
  written.
- **Slashes** in "MA/ACO", "usability/feasibility", "target/stretch",
  "Letters/LOIs" and the like. The author's shorthand.
- **Table 6 splits** across pages 4 and 5 with its header repeating. Held whole
  it would leave about 350pt of white at the foot of page 4.
- **Figure 2's row height is set by pagination, not preference.** At 25 units the
  figure opened its own page and left the working note stranded on a sixth; at 19
  it lands at the foot of page 5 with the note under it and the document ends
  there. Adding or removing a workstream will move this again.

## Notes on the two exports

Both are five pages and all five pages begin at the same point. Getting there
needed four corrections to the Word builder, each one matching a stylesheet rule
the export had been ignoring:

- `cell_margins` sets the table cell margins to the stylesheet's `td` padding,
  nothing on the left and 6pt on the right. Word's default 0.08in on both sides
  narrowed every column by 0.16in, wrapped headers mid-word, and made rows taller
  than in the print render.
- `cant_split` sets `w:cantSplit` on every row, the equivalent of
  `tr { break-inside: avoid }`. Without it Word splits a row across a page break.
- `repeat_header` sets `w:tblHeader` on the header row, the equivalent of
  `thead { display: table-header-group }`.
- Header-row paragraphs get `keep_with_next`, so a header cannot be stranded
  alone at the foot of a page.

The figure block's image-to-caption gap is set by measurement at 6pt.
LibreOffice adds its own font leading under an inline image and ignores an exact
line height on the line holding it. The correction is the same for both figures,
which suggests the leading comes from the paragraph's font rather than the image;
re-measure if a third figure is added.
