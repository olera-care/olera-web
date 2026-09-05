# -*- coding: utf-8 -*-
"""Rasterize the timetable at 300 dpi for the Word export."""
import re, subprocess, json, os, pymupdf
import figs_ap as FA

os.makedirs('png', exist_ok=True)
svg = FA.timetable(json.load(open('text.json'))['tables'][3])
m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
w_in, h_in = float(m.group(1)) / 100.0, float(m.group(2)) / 100.0
open('png/timetable.html', 'w').write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    f'@page{{size:{w_in}in {h_in}in;margin:0}}html,body{{margin:0;padding:0}}'
    f'svg{{width:{w_in}in;height:{h_in}in;display:block}}'
    '</style></head><body>' + svg + '</body></html>')
subprocess.run(['/opt/pw-browsers/chromium', '--headless', '--disable-gpu', '--no-sandbox',
                '--no-pdf-header-footer', '--print-to-pdf=png/timetable.pdf',
                'png/timetable.html'], capture_output=True)
d = pymupdf.open('png/timetable.pdf')
assert d.page_count == 1, f'timetable spilled to {d.page_count} pages'
d[0].get_pixmap(dpi=300).save('png/timetable.png')
print(f'  timetable: {w_in:.2f} x {h_in:.2f} in')
