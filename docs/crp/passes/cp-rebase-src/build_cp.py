# -*- coding: utf-8 -*-
"""Assemble the rebased Commercialization Plan. Content comes only from live_cp.txt."""
import os, json, re
import figs95 as N
import convert_cp as C

WORD = os.environ.get("WORD_EXPORT") == "1"

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; orphans: 2; widows: 2; }
p.sec { margin: 5pt 0 2pt 0; }
p.caption { text-align: left; margin: 2pt 0 4pt 0; font-size: 9pt;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
h1.sechead { font-size: 11pt; font-weight: bold;
             letter-spacing: 0.3pt; margin: 8pt 0 4pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt;
             break-after: avoid; page-break-after: avoid; }
h1.sechead:first-child { margin-top: 0; }
/* superscript reference markers: as large as a superscript can be while
   still reading as one. The only text in the document under 9.5pt. */
sup { line-height: 0; font-size: 8pt; vertical-align: 0.42em; }
div.fig { margin: 5pt 0 2pt 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
div.fig svg, div.fig img { display: inline-block; max-width: 100%; }
/* the three figures the source anchors with wrapSquare, right of the column */
div.figwrap { float: right; margin: 2pt 0 5pt 13pt; break-inside: avoid;
              page-break-inside: avoid; }
div.figwrap svg, div.figwrap img { display: block; max-width: 100%; }
div.figwrap div.fig { margin: 0; }
div.figwrap p.caption { margin: 3pt 0 0 0; }
p.clearfix { clear: both; margin: 0; height: 0; line-height: 0; }
/* a figure and its caption are one indivisible block, as are short tables */
div.figblk { break-inside: avoid; page-break-inside: avoid; margin: 0; }
div.figblk table.dat { margin-bottom: 0; }
ol.risks { margin: 6pt 0 3pt 0; padding: 0 0 0 20pt; }
ol.risks li { margin: 0 0 3pt 0; text-align: justify; padding-left: 2pt;
              break-inside: avoid; page-break-inside: avoid; }
ol.risks li::marker { font-weight: bold; color: #14453f; }
ol.risks b.rk { color: #14453f; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 6pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0;
                     vertical-align: bottom; }
table.dat td { padding: 1.9pt 6pt 1.9pt 0; border-bottom: 0.4pt solid #b9c4bd;
               vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }
"""

FIGW = {}

def figblock(svg, png, key):
    """Width comes from the figure's own viewBox, so the Word export matches the
    PDF instead of stretching every figure to the text column."""
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg)
    w = float(m.group(1)) / 100.0
    FIGW[key] = w
    inner = f'<img src="png/{png}.png" style="width:{w}in">' if WORD else svg
    return f'<div class="fig">{inner}</div>'

# The six figures that survive Pass 1, renumbered in document order.
FIGMAP = {
    'FIG1':   figblock(N.fig1(), 'fig1', 'FIG1'),               # 1, vicious cycle, floated
    'FIG3':   figblock(N.fig3(), 'fig3', 'FIG3'),               # 2, valley of death
    'FIG4':   figblock(N.fig4(), 'fig4', 'FIG4'),               # 3, product and county
    'FIG10B': figblock(N.fig10_flywheel(), 'fig10b', 'FIG10B'), # 4, growth flywheel, floated
    'FIGXORG': figblock(N.organic(), 'figxorg', 'FIGXORG'),     # 5, organic traffic, floated
}

BODY, MANIFEST = C.build(FIGMAP, FIGW)

DOC = f"""<meta charset="utf-8"><title>Olera CRP Commercialization Plan, rebased</title>
<style>{CSS}</style>
{BODY}
"""

open('cp_rebased.html', 'w', encoding='utf-8').write(DOC)
json.dump(MANIFEST, open('manifest_cp.json', 'w'), indent=1)
json.dump(C.LOG, open('convert_log.json', 'w'), indent=1)

from collections import Counter
print('source body items:', len(C.TRUTH))
print(Counter(k for k, _, _ in MANIFEST))
print('em dash replacements:', len(C.LOG['emdash']))
print('paragraph splits at a second run-in:', C.LOG['para_splits'])
print('captions with a double space after the label:', len(C.LOG['caption_norm']))
