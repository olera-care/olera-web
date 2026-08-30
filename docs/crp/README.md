# NIH SBIR/STTR CRP application — local mirror

Working copies of the two narrative documents for Olera's NIH Commercialization Readiness Pilot
application (PAR-27-098, NIA), kept in the repo so the text is greppable, diffable, and reviewable
in a pull request.

| File | Mirrors | Drive file ID | Source modified |
|---|---|---|---|
| `research-plan-8.30.26.md` | *2. Research Plan [Most Updated 8.30.26].docx* | `1RQiB4T29YluP6nVI0NtjM4HbC-0OYjfo` | 2026-08-30 18:42 UTC |
| `commercialization-plan-8.30.26.md` | *3. Commercialization Plan* | `1VutumddG9xH-UO3UBklUKsLvMnw0drwn` | 2026-08-30 10:10 UTC |
| `figures/rs-figure-{1..9}.png` | Research Plan Figures 1–9 | — | extracted from the same export |
| `figures/cp-figure-{1..6}.png` | Commercialization Plan Figures 1–6 | — | extracted from the same export |

Both live in the Drive **living-documents folder** (`1lF3kOZQYZQTRCIA5t9CKxauTTY2OT_PD`).

## These are mirrors, not masters

**The Google Drive documents are the source of truth.** Never make a content change here and expect it
to reach the application. Edit the Drive document, then re-run the transcription so this copy catches up.

## Method

The Drive `.docx` files are ~1 MB each; the Drive MCP returns file content base64-encoded into the
model context, which is prohibitively large. These transcriptions were therefore made from the PDF
exports of the same two files, which the document owner confirmed were generated from them.

1. Text extracted with `pdfminer.six`.
2. Every page rendered to PNG with `pypdfium2` and read visually.
3. **All tables rebuilt from the page renders**, because the PDF text layer flattens table cells into
   reading order that does not match the grid.
4. **Text-box and figure-wrap flow artifacts corrected from the page renders** — the PDF text layer
   reorders text that flows around a floating figure.
5. Figures extracted as embedded images at native resolution (`pypdf`), not cropped from page renders.
   Research Plan figures carry their captions inside the image; Commercialization Plan figures do not.
6. Verified by two mechanical passes against the extracted PDF text: a vocabulary diff (no word present
   in the source is missing from the mirror) and a sentence-coverage check (every prose sentence of
   12+ words appears verbatim). The only differences that survive are the reconstructed tables, the
   corrected flow artifacts, and reference superscripts, which are marked up as `<sup>` here.

## Defects preserved deliberately

These are transcription-faithful, not transcription errors. **Fix them in Drive, not here.** Full
analysis in the rebase report; the short list:

**Research Plan**
- Tables are numbered **1, 2, 1, 2, 3, 6** — Significance and the Aim criteria both start at 1, and
  there is no Table 4 or 5. The CRP Progress Report's cross-reference to "Tables 4 and 5" therefore
  resolves to nothing.
- **No bibliography section**, although Significance carries superscripts 1–10.
- "9.7 million direct-care job **vaccancies**" — misspelled, and the cited source counts *openings*.
- "The primary operational cohort will **target of** approximately 400 index family episodes."
- "the longitudinal state architecture introduced **in Innovation** around seven domains" — missing the
  innovation number.
- "the endpoint that matters**–**established care" — en dash used as an unspaced em dash.
- "the care establishment pathway" unhyphenated twice, against twelve hyphenated instances.
- "the **paid caregivers** workforce".
- Figure 7 is the only caption in either document with no terminal period.

**Commercialization Plan**
- Section 4 ends with a paragraph that **opens with a stray period** and has lost its bold lead-in.
- Section 7 ends "…processes Olera already uses.**Marketing and sales strategy**" — an orphaned bold
  heading with no preceding space and no content after it.
- Qiping Fan is **MD, MS** in Section 3 (twice) and **DrPH, MS** in Section 9.
- Section 8 cites reference **8** (KFF, Medicare Advantage) for the unmet-need/utilization claim that
  Section 1 supports with reference **1** (AHRQ).

## Known cross-document conflicts

Live as of this transcription, unresolved:

- **Pathway labels diverge.** Research Plan Figure 2 uses the canonical `Find Care` and `Established
  care`; Commercialization Plan Figure 2, Figure 4 and Table 1 use `Identify Care` and `Establish
  Care`. The Commercialization Plan also says "Outcomes tracked" in Figure 2 and "Track Outcomes" in
  Figure 4 and Table 1.
- **Market count.** Research Plan Tasks 2.1 and 3.2 decline to fix the number of markets; the
  Commercialization Plan fixes it at approximately eight and derives its revenue model, Table 8 and
  Table 9 from that; the CRP Progress Report says "two real markets".
- **Vicious cycle.** The Commercialization Plan's first paragraph describes a four-item flat chain;
  its own Figure 1, printed alongside, draws a three-state loop with a dashed branch.
- **Student pilot.** Research Plan: "more than 900 applicants … placed more than 20."
  Commercialization Plan: "approximately 900 … accepted 100 candidates, and placed 25."
- **Decision points.** The Research Plan calls them GO/NO-GO; the Commercialization Plan calls them gates.

## Canonical model of record

Locked, and what the reconciliation work is measured against:

```
Pathway  Assess Needs → Find Care → Fund Care → Staff Care → Execute Plan ⟹ Established Care → Track Outcomes
Cycle    Unmet need → Hospital → No care → Unmet need
         with Long-term care facility as a dashed branch off Hospital (an exit, not a loop state)
```

Rules: subset, never rename · the lexicon governs stage names, not the English language · captions
carry scientific caveats · figures replace prose rather than repeating it · anchors appear once ·
"gate" is reserved for aim decision points.

## Refreshing this mirror

When the Drive documents change: export both to PDF, re-run steps 1–6 above, and update the
`Source modified` timestamps in the table at the top. Diff the result against the committed version —
the diff is the drift.
