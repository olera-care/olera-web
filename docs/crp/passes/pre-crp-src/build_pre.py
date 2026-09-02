# -*- coding: utf-8 -*-
"""Pre-CRP Commercialization and Execution Plan, in house style.

Text is the author's, read from text.json (extracted straight from orig.docx),
so no sentence is retyped. House typography, house tables, bold run-in lead-ins
for the subsections, and a caption on each table.
"""
import json, os, re

WORD = os.environ.get('WORD_EXPORT') == '1'
BLOCKS = json.load(open('text.json'))

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; orphans: 2; widows: 2; }
p.sec { margin: 5pt 0 3pt 0; }
p.lede { margin: 0 0 10pt 0; text-align: left; font-size: 10pt; color: #5f6b64; }
h1.doctitle { font-size: 15pt; font-weight: bold; margin: 0 0 2pt 0; color: #14453f;
              letter-spacing: 0.2pt; }
h2.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 11pt 0 4pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt;
             break-after: avoid; page-break-after: avoid; }
p.caption { text-align: left; margin: 2pt 0 4pt 0; font-size: 9pt; line-height: 1.16;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
ul.pts { margin: 4pt 0 3pt 0; padding: 0 0 0 17pt; }
ul.pts li { margin: 0 0 3pt 0; text-align: justify; padding-left: 2pt;
            break-inside: avoid; page-break-inside: avoid; }
ul.pts li::marker { color: #14453f; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 5pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0;
                     vertical-align: bottom; }
table.dat td { padding: 2.6pt 6pt 2.6pt 0; border-bottom: 0.4pt solid #b9c4bd;
               vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
"""

# widths and captions, in document order
TABLES = [
    ([16, 29, 28, 27],
     "The four tracks, what each must show by submission, and what each one proves."),
    ([14, 48, 38],
     "CareNavigator by stage, and what each stage licenses commercially."),
    ([18, 24, 25, 33],
     "January traction scoreboard: minimum, target, and stretch by dimension."),
    ([10, 30, 30, 30],
     "Backward plan from submission, by month and by track."),
]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def runin(text):
    """The author's own lead-in, bold, as every other Olera document sets it."""
    i = text.find('. ')
    if 5 < i < 130:
        return f'<p class="sec"><b>{esc(text[:i + 1])}</b> {esc(text[i + 2:])}</p>'
    return f'<p class="sec">{esc(text)}</p>'


def table(grid, widths, num, caption):
    head = ''.join(f'<th style="width:{w}%">{esc(c)}</th>'
                   for c, w in zip(grid[0], widths))
    body = ''
    for row in grid[1:]:
        body += ('<tr><td><b>' + esc(row[0]) + '</b></td>'
                 + ''.join(f'<td>{esc(c)}</td>' for c in row[1:]) + '</tr>')
    return (f'<table class="dat"><thead><tr>{head}</tr></thead><tbody>{body}</tbody></table>'
            f'<p class="caption"><b>Table {num}.</b> {esc(caption)}</p>')


parts = []
tnum = 0
bullets = []
pending_lead = None


def flush_bullets():
    global bullets
    if bullets:
        parts.append('<ul class="pts">'
                     + ''.join(f'<li>{esc(b)}</li>' for b in bullets)
                     + '</ul>')
        bullets = []


for b in BLOCKS:
    if b['kind'] == 'table':
        flush_bullets()
        widths, cap = TABLES[tnum]
        tnum += 1
        parts.append(table(b['grid'], widths, tnum, cap))
        continue

    style, txt = b['style'], b['text']

    if style == 'Title':
        # Retitled per Logan: this is the commercialization AND execution plan.
        parts.append('<h1 class="doctitle">Olera Pre-CRP Commercialization '
                     'and Execution Plan</h1>')
    elif style == 'Heading 1':
        flush_bullets()
        parts.append(f'<h2 class="sechead">{esc(txt)}</h2>')
    elif style == 'Heading 2':
        flush_bullets()
        # The source separates the label from the product name with an em dash,
        # which house style does not permit; a comma carries the same break. The
        # heading then becomes the bold lead-in of the paragraph under it rather
        # than a second bold line stacked above one.
        pending_lead = txt.replace(' — ', ', ').replace(', Olera Pro: ', ', Olera Pro ')
        continue
    elif txt.startswith('•'):
        bullets.append(txt.lstrip('• ').strip())
    elif txt.startswith('Working strategy'):
        parts.append(f'<p class="lede">{esc(txt)}</p>')
    else:
        flush_bullets()
        if pending_lead:
            parts.append(f'<p class="sec"><b>{esc(pending_lead)}.</b> {esc(txt)}</p>')
            pending_lead = None
        else:
            parts.append(runin(txt))

flush_bullets()

BODY = '\n\n'.join(parts)
DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'pre_word.html' if WORD else 'pre.html'
open(out, 'w', encoding='utf-8').write(DOC)
words = sum(len(b['text'].split()) for b in BLOCKS if b['kind'] == 'p')
print('wrote', out, '|', words, 'words of source prose |', tnum, 'tables')
