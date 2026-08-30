# -*- coding: utf-8 -*-
"""INNOVATION (Phase IIB draft), reformatted into the Research Strategy house style.

Text and figures are the author's. Nothing here rewrites a sentence or redraws a
figure. What this does is set the type, float the figures so text wraps around
them, size each image so its own internal labels are legible in print, and give
every figure a single caption.
"""
import json, os, re

WORD = os.environ.get('WORD_EXPORT') == '1'
T = json.load(open('text.json'))

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; orphans: 2; widows: 2; }
p.sec { margin: 6pt 0 3pt 0; }
p.first-sec { margin-top: 0; }
p.caption { text-align: left; margin: 3pt 0 4pt 0; font-size: 9pt; line-height: 1.16;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
h1.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 0 0 5pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt; }

div.fig { margin: 5pt 0 2pt 0; text-align: center;
          break-inside: avoid; page-break-inside: avoid; }
div.fig img { display: inline-block; max-width: 100%; }
div.figblk { break-inside: avoid; page-break-inside: avoid; margin: 0; }
/* right-floated figures: text wraps the way the source document intended and
   the Word export reproduces with a framed table */
div.figwrap { float: right; margin: 2pt 0 6pt 14pt;
              break-inside: avoid; page-break-inside: avoid; }
div.figwrap img { display: block; max-width: 100%; }
div.figwrap div.fig { margin: 0; }
div.figwrap p.caption { margin: 4pt 0 0 0; }
p.clearfix { clear: both; margin: 0; height: 0; line-height: 0; }
"""

# Widths chosen from each image's own pixel dimensions so its smallest internal
# label prints legibly. The two wide-aspect figures run the full column; the two
# near-square ones float right, which is how the source document laid them out.
WIDTH = {'fig3': 3.10, 'fig4': 7.30, 'fig5': 3.35, 'fig6': 7.30}
FLOAT = {'fig3', 'fig5'}


def figure(name, caption):
    w = WIDTH[name]
    # Height comes from the file's own aspect ratio. Stating it here could only
    # disagree with the image, and the Word converter reads the width alone.
    img = f'<img src="png/{name}.png" style="width:{w}in">'
    cap = re.sub(r'^(Figure \d+\.)', r'<b>\1</b>', caption)
    blk = f'<div class="fig">{img}</div><p class="caption">{cap}</p>'
    if name in FLOAT:
        return f'<div class="figwrap" style="width:{w}in">{blk}</div>'
    return f'<div class="figblk">{blk}</div>'


def runin(text):
    """The author's own bold lead-in, set the way every other section sets it."""
    m = re.match(r'^([^.]+\.)\s+(.*)$', text, re.S)
    if m and len(m.group(1)) < 110:
        return f'<b>{m.group(1)}</b> {m.group(2)}'
    return text


P = T['paras']
B = T['tbl']
C = T['caps']

BODY = f"""
<h1 class="sechead">Innovation</h1>

<p class="sec first-sec">{runin(P[1])}</p>

{figure('fig3', C[0])}
<p class="sec">{B[0][0]}</p>
<p class="sec">{B[0][1]}</p>
<p class="clearfix"></p>

<p class="sec">{runin(P[2])}</p>

<p class="sec">{P[3]}</p>

<p class="sec">{B[1][0]}</p>
<p class="sec">{B[1][1]}</p>

{figure('fig4', C[1])}

<p class="sec">{runin(P[4])}</p>

<p class="sec">{P[5]}</p>

{figure('fig5', C[2])}
<p class="sec">{B[2][0]}</p>
<p class="sec">{B[2][1]}</p>
<p class="sec">{runin(P[6])}</p>
<p class="clearfix"></p>

{figure('fig6', P[7])}
"""

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""

out = 'inn2_word.html' if WORD else 'inn2.html'
open(out, 'w', encoding='utf-8').write(DOC)
words = sum(len(x.split()) for x in P[1:7]) + sum(len(x.split()) for b in B for x in b)
print('wrote', out, '|', words, 'words of body text')
