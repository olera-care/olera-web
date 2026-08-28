# Commercialization Plan, rebase from the live Google Drive document

**Date:** 2026-08-28
**Baseline:** `3. Commercialization Plan`, Google Drive fileId `1VutumddG9xH-UO3UBklUKsLvMnw0drwn`,
`application/vnd.openxmlformats-officedocument.wordprocessingml.document`, 1,011,546 bytes,
modified `2026-08-28T16:22:24.294Z`.
**Outputs:** `Olera_CRP_CommercializationPlan_rebased.pdf` and `.docx`, 21 pages each.
**Build:** `cp-rebase-src/` (`inspect_truth.py` → `convert_cp.py` → `build_cp.py` → `diff_cp.py`).

The prior workspace Commercialization Plan was discarded. Nothing was merged forward from it.
The rebase carries the live document only.

---

## 1. How the baseline was read

The live file was pulled as raw `.docx` (`download_file_content`) rather than as a text export.
The first attempt used the text export and it silently lost material, so it was thrown away:

- the evidence chain figure between "Institutional CareNavigator" and "There is already precedent"
  did not appear in the text export at all
- the `Federal R&D` row of Table 4 came back empty, because its value sits inside a content control
- eight of the thirteen tables were invisible, for the same reason
- bold runs, floating image anchors and text-box captions were unrecoverable

`inspect_truth.py` walks the XML instead: paragraph runs with bold state, table cells including
cells nested inside a content control, floating image anchors, and text-box captions, in document
order. It asserts that the captured character count equals the total `w:t` character count of the
body. It does: **61,498 = 61,498**.

The live document contains **124 body items**: 111 paragraphs, 13 tables, 14 embedded images
(plus a 70-byte spacer used 8 times), 7 text-box captions, 9 section headings.

## 2. Completeness of the rebase

`diff_cp.py` compares the rendered PDF's own text layer against the structural capture. Four
independent checks, all clean:

| Check | Result |
|---|---|
| 1. Every sentence of every paragraph, every text-box caption, every table cell | 682 units, **0 missing** |
| 2. Every word and numeric token, hyphenation-proof | 2,037 distinct tokens, **0 short** |
| 2b. The two tables now rendered as figures, cell by cell | 40 cells, **all present** |
| 3. Cross references (Figure/Table/Section) | 24 distinct tokens, **0 lost**, counts match one for one |
| 4. Figures | 14 image anchors + 2 figure-tables = 16 in the source, **16 in the render** |

Prose, headings, captions, table cells, quantitative values, cross references, citation markers
and figures are all accounted for. Nothing was summarised, condensed or dropped.

## 3. Figures

The live document's figures are the house figures, pasted in as rasters. They were re-emitted as
the original vector artwork at the same sizes, matched to the source by image anchor:

| Source image | Rendered as | Note |
|---|---|---|
| image11 | Figure 1 | |
| image20 | Figure 2 | |
| image18 | Figure 3 | floats above its anchoring paragraph in Word; placed there |
| image16 | Figure 4 | |
| *(table, 1 row × 5 cols)* | Figure 5 | source holds this figure as a Word table |
| *(table, 2 rows × 3 cols)* | Figure 6 | source holds this figure as a Word table |
| image6 | Figure 7 | |
| image7 | Figure 8 | |
| image4 | Figure 10, financing transition | |
| image13 | Figure 10, growth flywheel | |
| image12 | Figure X, local-market process | redrawn as SVG from the raster, content unchanged |
| image21 | Figure X, organic traffic | redrawn on the house grid; the source raster is a matplotlib chart in a foreign palette |
| image1 | Figure 11 | |
| image3 | *(uncaptioned evidence chain)* | **the text export lost this entirely** |
| image2 | Figure 12 | |
| image5 | Figure 13 | |

Figures 5 and 6 were re-cut in `figs_live.py` to the live document's exact wording, which differed
from the locked Section 3 artwork in seven places (`Provider/workforce discovery` had lost the word
"discovery"; `Add dedicated capacity where…` had been reordered to `Dedicated capacity added
where…`; five `+`, `&` and `/` connectives had been spelled out as "and"). The live wording wins.
The locked `section3-company-src` figures were left untouched.

---

## 4. Mechanical corrections made

Each one is unambiguous, presentational or a single-character repair, and is logged by the build
in `cp-rebase-src/convert_log.json`.

| # | Correction | Where | Count |
|---|---|---|---|
| M1 | Em dash replaced with a comma, the standing house rule | items 1, 2, 51, 97, 105 | 5 |
| M2 | Reference markers restored to superscript. They had been pasted in as body text and read as sentence content ("turnover in 2024.26,27 The problem"). Digits untouched | §4 and Revenue Stream | 13 |
| M3 | Table 8's period cells had lost the line break between the year label and the stage name ("Year 2 (CRP)Validate free") | Table 8, column 1 | 5 |
| M4 | Stray leading period before list item 2 of the four-advantages table (".2. New workforce supply") | four-advantages table | 1 |
| M5 | Stray hyphen inside a word, a soft-hyphen artifact ("rel-evant") | item 81, Finance Plan | 1 |
| M6 | Each floating caption appears twice in the source, once in the figure's text box and once as an inline run of the anchoring paragraph. The inline duplicate was dropped, the text-box copy kept, on the side the author placed it | Figures 1, 2, 3, 4, 10 flywheel, both Figure X | 7 |
| M7 | "Digital product and AI infrastructure" and "Data and workforce infrastructure" are one paragraph with two bold run-in labels in the source; split into two paragraphs, matching how Word displays them | item 87 | 1 |
| M8 | Markdown heading marker stripped from the Production and Marketing heading | item 85 | 1 |

### Layout, added 2026-08-28 after review

| # | Change | Basis |
|---|---|---|
| L1 | Figures 1, 10 (flywheel) and X (organic traffic) now float right with text wrapping around them | the source anchors exactly these three `wrapSquare`; every other image is `wrapTopAndBottom` or inline |
| L2 | Figure X (organic traffic) redrawn at 2.68 x 2.09 in | the size the source floats it at; it had been stretched to full width |
| L3 | Every figure and every short table is bound to its caption in one unbreakable block | a caption on the page after its figure |
| L4 | The five remaining risks set as a numbered list | the prose introduces them as a sequence, the next paragraph says the order matters, and Figure 3 numbers them 1 to 5. Text unchanged |
| L5 | Orphan and widow control on paragraphs, list items kept whole | single stranded lines |
| L6 | Figure 3 re-cut: the red label cleared the terrain line, and the right wall now climbs instead of sitting flat, lifting at Year 3 where the plan's own model starts paid testing | requested |

### Figure typography, rebuilt 2026-08-28

A correction first. Figure sizes in the artwork are SVG user units, and the house
grid puts 100 units to the inch, so a unit is 0.72pt. Everything the figure code called
"9.2" was printing at 6.6pt. Measured off the rendered PDF, the figure set ran **5.5pt
to 8.8pt**, with 5,750 characters below 9pt, not the 7.6 to 9.6pt an earlier note in
this log implied.

NIH's *Format Attachments* rule is that text "must be 11 points or larger. Smaller text
in graphics, figures, graphs, diagrams, and charts is acceptable, as long as it is
legible when the page is viewed at 100%," and NIH's own tips page extends that to
tables, figure legends and footnotes. The separate type-density rule, no more than 15
characters per linear inch, carries no figure exemption, and Arial breaches it below
roughly 9.5pt. That is the floor adopted here.

All sixteen figures were rebuilt against it:

- `figbase.py` declares the type scale in real points and converts, so the code says
  what the page prints.
- `measure.py` measures actual Arial advances through the same SVG text path the
  figures use, and wraps labels to the width they really have. Model error against the
  rendered PDF is 0.0%.
- `checkfigs.py` renders every figure alone and reads back real glyph boxes, catching
  text clipped by the artboard, text past the edge, and boxes drawn on top of each
  other. All sixteen return zero problems.

Nothing was cut to make room. Where a label could not fit, the figure grew or the label
wrapped. Two figures changed shape rather than size: the evidence chain packs onto two
rows because five labels need about 8.5in at 9.5pt, and the local-market process runs
four boxes then three for the same reason.

| Figure | Was | Now |
|---|---|---|
| 1, vicious cycle | 3.00 x 2.26 in | 3.00 x 2.60 in |
| 2, care pathway | 7.20 x 1.48 | 7.20 x 1.51 |
| 3, valley of death | 7.20 x 2.18 | 7.20 x 2.94 |
| 4, product and county | 7.20 x 4.15 | 7.20 x 5.82 |
| 5, progression | 7.20 x 1.48 | 7.20 x 2.90 |
| 6, management capacity | 7.20 x 1.22 | 7.20 x 1.84 |
| 7, two markets | 7.20 x 2.48 | 7.20 x 3.19 |
| 8, IP protections | 7.20 x 2.96 | 7.20 x 4.34 |
| 10, financing transition | 7.20 x 2.06 | 7.20 x 2.81 |
| 10, growth flywheel | 3.36 x 2.29 | 3.68 x 2.68 |
| X, market process | 7.20 x 0.94 | 7.20 x 2.57 |
| X, organic traffic | 7.20 x 1.62 | 3.30 x 2.40 |
| 11, replication economics | 7.20 x 1.94 | 7.20 x 2.30 |
| evidence chain | 7.20 x 0.42 | 7.20 x 0.90 |
| 12, revenue by year | 7.20 x 2.24 | 7.20 x 2.53 |
| 13, stages and gates | 7.20 x 1.34 | 7.20 x 1.60 |

What now prints, measured from the PDF's own text layer:

| Size | What |
|---|---|
| 11pt | body text, section headings |
| 9.5 to 26pt | all figure internals |
| 9pt | table body, figure and table captions, explicitly permitted |
| 8pt | superscript reference markers only, 29 characters in the document |

The Word export matches: its text layer contains 8, 9 and 11pt and nothing else.
Superscripts there are set by explicit size and baseline offset rather than Word's
`vertAlign`, which would have shrunk them to 4.6pt.

Cost: 19 pages to 21.

### Author-directed text edits

These change the live document's words, so they are logged apart from the mechanical fixes and
the completeness check allows for them explicitly.

| # | Was | Now | Why |
|---|---|---|---|
| D1 | "…AND IMPACT - What does this CRP create?" | "…AND IMPACT - What does CRP create?" | so the section heading sets on one line |

Typographic decisions that are presentation only, applied uniformly: bold run-ins reproduced from
the source's own runs rather than inferred; captions set 9 pt with the label in teal; tables set
9 pt with the source's own header row (the four-advantages table has none and was rendered
headerless); small tables held together across page breaks; long tables repeat their header row.

## 5. Found, deliberately left alone

These are in the live document and were preserved as they stand. None is mechanical enough to fix
without a judgement call.

| # | Issue |
|---|---|
| A1 | Sections 1, 2 and 3 carry no number. The rest are numbered 4, 5, 7, **9**, **9**, 11. There is no section 6, 8 or 10, and **two sections are numbered 9** (Production and Marketing, Revenue Stream). |
| A2 | Figure numbering: 1–8, then **no Figure 9**, then **Figure 10 twice** (financing transition, growth flywheel), then two **Figure X** placeholders, then 11, 12, 13. One figure (the evidence chain) has no caption at all. |
| A3 | Table numbering: 1, 2, **no Table 3**, **Table 4 twice** (at a glance, market hurdles), **Table 5 twice** (SBIR history, fundraising plan), 6, 7, 8, and one **Table X**. |
| A4 | "Section 10 describes how these activities convert into revenue" (Production and Marketing) and "Section 10 models post-CRP economics" (§4) both point at the Revenue Stream, which is numbered 9. **Broken cross-reference.** |
| A5 | "Section 9" is used four times for the Revenue Stream and once for the Production and Marketing Plan. Both are numbered 9, so the reference is ambiguous either way. |
| A6 | "Table 5:" (SBIR history) uses a colon; every other caption uses a period. |
| A7 | Figure 3's caption has no terminal period. |
| A8 | Figure 10's caption (financing transition) sets its entire first sentence bold; every other caption bolds only the label. |
| A9 | The Intellectual Property heading contains a double space: "How will we protect  IP?". |
| A10 | The Production and Marketing heading is the only section heading not set bold in the source. |
| A11 | The four-advantages table punctuates items 1, 3 and 4 as "Label:" and item 2 as "Label." |
| A12 | Figure 2's caption sits immediately after "Five remaining risks must now be retired in sequence:", separating the lead-in from the five risks it introduces. |
| A13 | The five remaining risks are five separate paragraphs rather than a numbered list, though the prose calls them a sequence and the following paragraph says "the order matters". |

## 6. Needs human review

| # | Issue | Why it matters |
|---|---|---|
| **R1** | **The document ends mid-sentence.** The last words are "Together, these gates ensure that commercialization advances in response to measured technical, market, workforce, economic, and outcome" with no ending and no period. | This is the final sentence of the whole plan. I cannot finish it without inventing content. |
| **R2** | **There is no reference list anywhere in the document**, and no superscript formatting survived the paste. Citations 26–34 (§4) and 1–8 (Revenue Stream) both appear, so **two independent numbering schemes collide**. | Reviewers cannot resolve a single citation. Both bibliographies exist in the repository (`references-cp.yaml`, and the Revenue Stream list in `revenue-stream-src/build_s7.py`) and need to be merged into one sequence. |
| **R3** | `[refs]` appears twice and `[cite]` once in the Statement of Need, unresolved. | Same, and these are visible placeholders on page 1. |
| **R4** | **Qiping Fan is credentialed inconsistently**: "MD, MS" in the Company at-a-glance table and in the Company prose, "PhD" in the Project Management Plan. The PMP also calls Fan a co-investigator while Company lists Fan under senior advisors. | Personnel facts. Needs the correct answer, not a guess. |
| **R5** | **The document is 20 pages against a 12-page limit.** | Compression is a separate pass and is not part of a preservation rebase. |
| **R6** | Figure 5's house rendering carries a "SOURCE OF CAPITAL" band and a "TODAY" marker that are **not** in the live document's table. Kept because the figure was locked with them, flagged because the rule for this pass was that nothing carries forward on the strength of the older version alone. | Say the word and I will strip them. |
| **R7** | Both "Figure X" placeholders now have real artwork, but they are still numbered X, as is "Table X". | Depends on how A2/A3 are renumbered. |
| **R8** | §1 says CareNavigator "draws 15,500+ visitors per month"; Production and Marketing says "more than 500 per day", which is about 15,000 a month. | Small, but two numbers for one fact. |
| **R9** | The evidence chain figure (image3, between the institutional-revenue paragraphs) has no caption and no number. | Either caption it or leave it deliberately unnumbered. |

---

## 7. Not done, by instruction

No substantive rewrite, no compression, no reordering, no renumbering, no citation reconciliation,
no resolution of any item in section 6. Preservation first, QA second, editorial revision later.
