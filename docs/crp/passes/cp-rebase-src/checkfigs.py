# -*- coding: utf-8 -*-
"""Render each figure on its own page and measure real glyph boxes.

Estimating Arial advances is guesswork; the PDF knows. Anything that runs off
the artboard, or whose baseline row collides with a neighbouring row, is a real
problem to fix rather than a modelling artefact.
"""
import re, subprocess, os, sys, pymupdf

def render(name, svg, outdir='chk'):
    os.makedirs(outdir, exist_ok=True)
    w, h = (float(v) for v in re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg).groups())
    w_in, h_in = w / 100.0, h / 100.0
    p = f'{outdir}/{name}'
    open(p + '.html', 'w').write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
        f'@page{{size:{w_in}in {h_in}in;margin:0}}html,body{{margin:0;padding:0}}'
        f'svg{{width:{w_in}in;height:{h_in}in;display:block}}</style></head><body>'
        + svg + '</body></html>')
    subprocess.run(['/opt/pw-browsers/chromium', '--headless', '--disable-gpu', '--no-sandbox',
                    '--no-pdf-header-footer', f'--print-to-pdf={p}.pdf', p + '.html'],
                   capture_output=True)
    return p + '.pdf', w_in * 72, h_in * 72

LABEL = re.compile(r'<text[^>]*>([^<]*)</text>')

def check(name, svg):
    """The outermost SVG clips, so text that overruns the artboard does not draw
    at all. Compare what the artwork asks for against what the page renders, then
    look for boxes that sit on top of each other."""
    pdf, W, H = render(name, svg)
    d = pymupdf.open(pdf)
    page = d[0]
    words = page.get_text('words')
    rendered = re.sub(r'\s+', ' ', page.get_text()).replace(' ', '')
    bad = []

    import html as _h
    for m in LABEL.finditer(svg):
        want = _h.unescape(m.group(1)).strip()
        if not want:
            continue
        if want.replace(' ', '') not in rendered:
            bad.append(f'clipped or missing: {want[:60]!r}')

    for x0, y0, x1, y1, w, *_ in words:
        if x0 < -0.5 or x1 > W + 0.5 or y0 < -0.5 or y1 > H + 0.5:
            bad.append(f'past the artboard ({W:.0f}x{H:.0f}pt): '
                       f'[{x0:.0f},{x1:.0f}]x[{y0:.0f},{y1:.0f}] {w!r}')

    # two words drawn on top of each other, allowing a little kerning slack
    boxes = [(x0, y0, x1, y1, w) for x0, y0, x1, y1, w, *_ in words]
    for i, a in enumerate(boxes):
        for c in boxes[i + 1:]:
            ox = min(a[2], c[2]) - max(a[0], c[0])
            oy = min(a[3], c[3]) - max(a[1], c[1])
            if ox > 1.0 and oy > 0.35 * min(a[3] - a[1], c[3] - c[1]):
                bad.append(f'overlap {a[4]!r} / {c[4]!r} at '
                           f'({max(a[0], c[0]):.0f},{max(a[1], c[1]):.0f})')
    d.close()
    return bad

if __name__ == '__main__':
    sys.path[:0] = os.environ.get('PYTHONPATH', '').split(':')
    import figs_son as S1, figs_s2 as S2, figs_s4 as S4, figs_s5 as S5
    import figs_s6 as S6, figs_s7 as S7, figs_s8 as S8, figs_live as LV, figs_extra as EX
    from typefloor import floor_type
    FIGS = {'fig1': S1.fig1(), 'fig2': S1.fig2(), 'fig3': LV.fig3(),
            'fig4': S2.fig4_combined(), 'fig5': LV.fig5(), 'fig6': LV.fig6(),
            'fig7': S4.fig7(), 'fig8': S5.fig8(), 'fig10fin': S6.fig9(),
            'fig10fly': S6.fig10(), 'figxproc': EX.market_process(),
            'figxorg': EX.organic(), 'fig11': S7.fig11(), 'chain': S7.chain(),
            'fig12': S7.fig12(), 'fig13': S8.fig13()}
    floored = '--raw' not in sys.argv
    total = 0
    for n, svg in FIGS.items():
        bad = check(n, floor_type(svg) if floored else svg)
        total += len(bad)
        print(f'{n:10s} {len(bad):2d}')
        for b in bad[:8]:
            print('      ', b)
    print('total', total)
