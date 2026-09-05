# Commercialization Plan rebase, build chain

The live Google Drive Commercialization Plan is the sole baseline. Run in order:

```bash
export PYTHONPATH=../statement-of-need-src:../section2-value-src:../section3-company-src:\
../section4-market-src:../section5-ip-src:../finance-plan-src:../revenue-stream-src:../pmp-src

python3 inspect_truth.py     # live_cp.docx -> docx_truth.json (asserts nothing is dropped)
python3 raster_figs.py       # 300 dpi PNGs of every figure, for the Word export
python3 build_cp.py          # docx_truth.json -> cp_rebased.html + manifest + convert_log
/opt/pw-browsers/chromium --headless --disable-gpu --no-sandbox \
  --no-pdf-header-footer --print-to-pdf=cp_rebased.pdf cp_rebased.html
python3 diff_cp.py           # four completeness checks against docx_truth.json
python3 raster_cp.py         # page images, for looking at the result

WORD_EXPORT=1 python3 -c "import build_cp; open('cp_word.html','w').write(build_cp.BODY)"
python3 mkdocx_cp.py
soffice --headless --convert-to pdf Olera_CRP_CommercializationPlan_rebased.docx
```

`live_cp.docx` is the exact file pulled from Drive (fileId `1VutumddG9xH-UO3UBklUKsLvMnw0drwn`,
modified 2026-08-28T16:22:24Z). Re-pull it and re-run the chain to rebase against a newer version.

`figs95.py` holds the whole figure set, re-fitted so nothing prints below 9.5pt. It rests on:

- `figbase.py`, the type scale declared in real points. An SVG font-size is in user units and
  the house grid puts 100 units to the inch, so a unit is 0.72pt; declaring points and
  converting is what stops a figure labelled "9.2" from printing at 6.6pt.
- `measure.py`, real Arial advances measured through the same SVG text path the figures use,
  with a greedy wrap built on them. Model error against the rendered PDF is 0.0%.
- `checkfigs.py`, which renders each figure alone and reads back glyph boxes to catch text
  clipped by the artboard, text past the edge, and boxes drawn on top of each other. Run it
  after touching any figure; it should return zero problems.

`figs_live.py` and `figs_extra.py` are kept for the record of the earlier re-cut of Figures 5,
6 and 3 to the live document's wording. The locked per-section figure modules are unchanged.

Findings and open items: `../cp-rebase-qa-log.md`.
