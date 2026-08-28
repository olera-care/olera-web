# -*- coding: utf-8 -*-
"""Rasterize every figure at 300 dpi for the Word export."""
import re, subprocess, pymupdf, os
import figs_son as S1, figs_s2 as S2, figs_s4 as S4, figs_s5 as S5
import figs_s6 as S6, figs_s7 as S7, figs_s8 as S8
import figs_live as LV, figs_extra as EX

FIGS = {'fig1': S1.fig1(), 'fig2': S1.fig2(), 'fig3': LV.fig3(),
        'fig4': S2.fig4_combined(), 'fig5': LV.fig5(), 'fig6': LV.fig6(),
        'fig7': S4.fig7(), 'fig8': S5.fig8(), 'fig9a': S6.fig9(),
        'fig10b': S6.fig10(), 'figxproc': EX.market_process(),
        'figxorg': EX.organic(), 'fig11': S7.fig11(), 'chain': S7.chain(),
        'fig12': S7.fig12(), 'fig13': S8.fig13()}

os.makedirs('png', exist_ok=True)
for name, svg in FIGS.items():
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w_in, h_in = float(m.group(1)) / 100.0, float(m.group(2)) / 100.0
    open(f'png/{name}.html', 'w').write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
        f'@page{{size:{w_in}in {h_in}in;margin:0}}html,body{{margin:0;padding:0}}'
        f'svg{{width:{w_in}in;height:{h_in}in;display:block}}'
        '</style></head><body>' + svg + '</body></html>')
    subprocess.run(['/opt/pw-browsers/chromium', '--headless', '--disable-gpu', '--no-sandbox',
                    '--no-pdf-header-footer', f'--print-to-pdf=png/{name}.pdf',
                    f'png/{name}.html'], capture_output=True)
    d = pymupdf.open(f'png/{name}.pdf')
    assert d.page_count == 1, f'{name} spilled to {d.page_count} pages'
    d[0].get_pixmap(dpi=300).save(f'png/{name}.png')
    print(f'  {name}: {w_in:.2f} x {h_in:.2f} in')
    d.close()
