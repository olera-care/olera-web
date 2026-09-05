# CRP Tools — one-time container setup

The Claude Code container is ephemeral; run this once per fresh session before using
the tools:

    pip install pypandoc-binary pymupdf

Chromium (for print checks) is pre-installed at /opt/pw-browsers/chromium.

Tools:

- `export_docx.py` — md → docx for the Drive round-trip.
- `print_check.py` — page-fill measurement against the NIH page limits.
- `render_pdf.py <out_dir>` — Research Strategy → house-style PDF preview (README
  section 6 is the style definition; this script reapplies the run-in formatting the
  markdown text export cannot carry).
