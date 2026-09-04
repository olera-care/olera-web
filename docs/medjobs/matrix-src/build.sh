#!/bin/sh
# Build the house-style PDF from MATRIX.house.md.
set -e
python3 dedash.py                       # MATRIX.md -> MATRIX.house.md
python3 md2html.py MATRIX.house.md matrix.html \
  "MedJobs 2.0 Master Implementation Matrix" \
  "Stage by stage: user journey, human SOP, system handoff &#183; 4 September 2026"
node html2pdf.mjs "$(python3 -c "import json,os;print(json.dumps([{
  'html': os.path.abspath('matrix.html'),
  'pdf':  os.path.abspath('matrix.pdf'),
  'footer':'MedJobs 2.0 Master Implementation Matrix'}]))")"
cp matrix.pdf ../MedJobs_2.0_Master_Implementation_Matrix.pdf
