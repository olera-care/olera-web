# -*- coding: utf-8 -*-
"""Measure real Arial advances, so figure labels can be fitted rather than guessed.

Renders a probe sheet once per (size, weight) and caches the result. Widths come
back in svg units, where 100 units is one inch.
"""
import re, subprocess, os, json, pymupdf

CACHE = 'chk/_advances.json'
_adv = json.load(open(CACHE)) if os.path.exists(CACHE) else {}


def _probe(size, weight):
    key = f'{size}|{weight}'
    if key in _adv:
        return _adv[key]
    chars = ('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
             '0123456789 .,:;/+&()%$-→·–≈')
    os.makedirs('chk', exist_ok=True)
    # measured through the same SVG <text> path the figures use, so the numbers
    # describe exactly what will be drawn
    def esc(c):
        return c.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    rows = ''.join(
        f'<text x="10" y="{20 + i * 20}" font-size="{size}" font-weight="{weight}" '
        f'text-anchor="start" xml:space="preserve">{esc(c) * 8}</text>'
        for i, c in enumerate(chars))
    open('chk/_probe.html', 'w').write(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
        '@page{size:8in 40in;margin:0}html,body{margin:0;padding:0}'
        'svg{display:block}</style></head><body>'
        f'<svg viewBox="0 0 800 {40 + len(chars) * 20}" width="8in" '
        f'height="{(40 + len(chars) * 20) / 100:.2f}in" '
        'xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">'
        + rows + '</svg></body></html>')
    subprocess.run(['/opt/pw-browsers/chromium', '--headless', '--disable-gpu', '--no-sandbox',
                    '--no-pdf-header-footer', '--print-to-pdf=chk/_probe.pdf',
                    'chk/_probe.html'], capture_output=True)
    d = pymupdf.open('chk/_probe.pdf')
    spans = []
    for pg in d:
        for b in pg.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    spans.append((s['bbox'][0], s['bbox'][2], s['text']))
    d.close()
    # each row is the character twice; the pair's width over two gives the advance
    table = {}
    for x0, x1, t in spans:
        if not t:
            continue
        table.setdefault(t[0], []).append((x1 - x0) / len(t))
    adv = {c: sum(v) / len(v) * (100 / 72.0) for c, v in table.items()}
    adv[' '] = adv.get(' ', size * 0.278 * 100 / 72.0)
    _adv[key] = adv
    json.dump(_adv, open(CACHE, 'w'))
    return adv


def width(text, size, weight='normal', ls=0.0):
    """Width of `text` in svg units at `size` pt."""
    a = _probe(size, 'bold' if weight == 'bold' else 'normal')
    fallback = size * 0.52 * 100 / 72.0
    w = sum(a.get(c, fallback) for c in text)
    return w + max(0, len(text) - 1) * ls


def wrap(text, max_units, size, weight='normal', ls=0.0):
    """Greedy wrap to lines no wider than `max_units`."""
    words, lines, cur = text.split(), [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if cur and width(trial, size, weight, ls) > max_units:
            lines.append(cur); cur = w
        else:
            cur = trial
    if cur:
        lines.append(cur)
    return lines
