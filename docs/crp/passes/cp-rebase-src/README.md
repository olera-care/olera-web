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

`figs_live.py` holds Figures 5 and 6 re-cut to the live document's wording; `figs_extra.py` holds
the two figures the live document carries only as rasters. Every other figure comes from the
locked per-section modules, which this directory does not modify.

Findings and open items: `../cp-rebase-qa-log.md`.
