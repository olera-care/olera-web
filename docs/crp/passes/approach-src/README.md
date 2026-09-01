# Approach, house style

Source: `Olera_CRP_Approach_Draft.docx` (`orig.docx` here). Four pages, all
filled, PDF and Word paginating identically. 2,091 words of the author's text,
unchanged.

```
export PYTHONPATH=../cp-rebase-src:../statement-of-need-src
python3 build_ap.py                  # ap_house.html, then print to PDF
python3 raster_ap.py                 # png/timetable.png at 300 dpi
WORD_EXPORT=1 python3 build_ap.py    # ap_word.html
python3 mkdocx_ap.py                 # Olera_CRP_Approach.docx
```

`text.json` is extracted straight from `orig.docx` and is what the build reads,
so no sentence is retyped. Every sentence and every table cell was verified
verbatim against the rendered PDF.

## What changed: formatting

- House type: 11pt Arial justified, 9pt captions and tables, the rule under the
  section head. Aim statements are standalone bold teal lines; task and
  contingency lead-ins are bold run-ins, the convention in every other section.
- The three criteria tables are house `table.dat`, with the human-protection
  row shaded in each, since it is the one row that stops an aim rather than
  describing it.
- The timetable was a 17 x 13 grid of bullet characters. It is now a figure:
  same quarters, same spans, drawn as continuous bars so a reader sees a task's
  span instead of counting dots, with year bands across the top and the three
  gates as diamonds on the quarter they fall in.

## What was added

The draft's three tables carried no captions and the timetable carried the
placeholder "Figure X". Added:

- `Table 1/2/3. Aim N success criteria, and the source of each measurement.`
- The figure number, keeping the author's caption text otherwise intact.

## Numbering is provisional

`FIG_START = 9` and `TABLE_START = 1` at the top of `build_ap.py` are a guess.
Figures continue from the Innovation v5 draft, which ends at Figure 8. Tables
restart at 1 because the Significance table count is not settled. Change the two
constants when the merge fixes the real numbering; nothing else needs editing.

## Fit

Four pages with no wasted tails. Getting there took two small adjustments:
timetable row height at 13 units and table cell padding at 1.9pt. Before those,
the timetable did not fit the tail of page 4 and pushed onto a fifth page that
held nothing else.

## Figure 9 is ahead of `text.json`

`figs_ap.py` was rebuilt on 2026-08-31 against
`2. Research Plan [Most Updated 8.31.26] V2`, whose Approach differs from the
draft in `orig.docx`: Aim 2 is three tasks running nine months in eight markets
rather than four tasks, and Aim 3 is two tasks rather than four. `text.json`
still holds the older draft, so **running `build_ap.py` now produces a document
whose prose and timetable disagree.** Re-extract the Approach from the 8.31
Research Strategy before rebuilding the section.

The standalone figure is current: `Figure9_timetable.pdf` and `.png`.
