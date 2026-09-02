# -*- coding: utf-8 -*-
"""Rasterize Figure 1 at 300 dpi for the Word export."""
import re, subprocess, os, pymupdf
import figs_memo as FM

os.makedirs('png', exist_ok=True)
svg = FM.ecosystem()
m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
w_in, h_in = float(m.group(1)) / 100.0, float(m.group(2)) / 100.0
open('png/fig1.html', 'w').write(
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    f'@page{{size:{w_in}in {h_in}in;margin:0}}html,body{{margin:0;padding:0}}'
    f'svg{{width:{w_in}in;height:{h_in}in;display:block}}'
    '</style></head><body>' + svg + '</body></html>')
subprocess.run(['/opt/pw-browsers/chromium', '--headless', '--disable-gpu',
                '--no-sandbox', '--no-pdf-header-footer',
                '--print-to-pdf=png/fig1.pdf', 'png/fig1.html'], capture_output=True)
d = pymupdf.open('png/fig1.pdf')
assert d.page_count == 1, f'figure 1 spilled to {d.page_count} pages'
d[0].get_pixmap(dpi=300).save('png/fig1.png')
print(f'  fig1: {w_in:.2f} x {h_in:.2f} in')
