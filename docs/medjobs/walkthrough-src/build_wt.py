# -*- coding: utf-8 -*-
"""MedJobs Operating System walkthrough summary, in house style.

Reads text.json, extracted straight from orig.docx, so no sentence is retyped.
This is a formatting pass; the only wording changes are listed in EDITS.
"""
import json, os, re

WORD = os.environ.get('WORD_EXPORT') == '1'

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; orphans: 2; widows: 2; }
p.sec { margin: 5pt 0 3pt 0; }
p.lede { margin: 0 0 9pt 0; text-align: left; font-size: 10pt; color: #5f6b64; }
h1.doctitle { font-size: 15pt; font-weight: bold; margin: 0 0 2pt 0; color: #14453f;
              letter-spacing: 0.2pt; }
h2.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 11pt 0 4pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt;
             break-after: avoid; page-break-after: avoid; }
p.caption { text-align: left; margin: 2pt 0 5pt 0; font-size: 9pt; line-height: 1.16;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
ul.pts { margin: 3pt 0 4pt 0; padding: 0 0 0 17pt; }
ul.pts li { margin: 0 0 3pt 0; text-align: left; padding-left: 2pt;
            break-inside: avoid; page-break-inside: avoid; }
ul.pts li::marker { color: #14453f; }
ul.pts li b { color: #14453f; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 5pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0;
                     vertical-align: bottom; }
table.dat td { padding: 2.8pt 6pt 2.8pt 0; border-bottom: 0.4pt solid #b9c4bd;
               vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
p.note { font-size: 9.5pt; color: #5f6b64; text-align: left; margin: 0 0 4pt 0;
         border-left: 2.4pt solid #b9c4bd; padding-left: 8pt; }
p.note b { color: #14453f; }
p.bottom { margin: 8pt 0 0 0; }
p.bottom b { color: #14453f; }
"""

# The only wording changes. Straight apostrophes match every other Olera
# document, and house style spells out an ampersand outside a proper name.
EDITS = [('’', "'"), ('Summary & Reader Guide', 'Summary and Reader Guide')]

CAPTION = ('The seven milestones the portal is meant to instrument. The commercial '
           'event is stage 7, and it depends on stage 6.')
WIDTHS = [6, 22, 72]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def fix(t):
    for a, b in EDITS:
        t = t.replace(a, b)
    return t


def runin(text, cls='sec'):
    """The author already writes a short label and then the sentence. Bolding it
    is what house style does with that; a naive first-period split would break on
    an abbreviation, so the label has to be short and followed by a capital."""
    i = text.find('. ')
    if 4 < i < 42 and text[i + 2:i + 3].isupper():
        return f'<p class="{cls}"><b>{esc(text[:i + 1])}</b> {esc(text[i + 2:])}</p>'
    return f'<p class="{cls}">{esc(text)}</p>'


def table(grid, widths, num, caption):
    head, rows = grid[0], grid[1:]
    th = ''.join(f'<th style="width:{w}%">{esc(c)}</th>' for c, w in zip(head, widths))
    body = ''
    for row in rows:
        body += ('<tr><td><b>' + esc(fix(row[0])) + '</b></td>'
                 + ''.join(f'<td>{esc(fix(c))}</td>' for c in row[1:]) + '</tr>')
    return (f'<table class="dat"><thead><tr>{th}</tr></thead><tbody>{body}</tbody>'
            f'</table><p class="caption"><b>Table {num}.</b> {caption}</p>')


BLOCKS = json.load(open('text.json', encoding='utf-8'))
parts = []
tnum = 0
bullets = []
lede = []


def flush_bullets():
    global bullets
    if bullets:
        out = ''
        for b in bullets:
            # every bullet in Section 6 is "Label: what to build"
            i = b.find(': ')
            out += (f'<li><b>{esc(b[:i])}.</b> {esc(b[i + 2:])}</li>' if 4 < i < 40
                    else f'<li>{esc(b)}</li>')
        parts.append(f'<ul class="pts">{out}</ul>')
        bullets = []


for b in BLOCKS:
    if b['kind'] == 'table':
        flush_bullets()
        if len(b['grid']) == 1 and len(b['grid'][0]) == 1:
            # a one-cell table is the source's callout box; house style makes it a
            # note with a rule down the left rather than a bordered table
            t = fix(' '.join(b['grid'][0][0].split()))
            i = t.find('. ')
            parts.append(f'<p class="note"><b>{esc(t[:i + 1])}</b> {esc(t[i + 2:])}</p>')
            continue
        tnum += 1
        parts.append(table(b['grid'], WIDTHS, tnum, CAPTION))
        continue

    style = b['style']
    txt = fix(' '.join(b['text'].split()))

    if style == 'Title':
        parts.append(f'<h1 class="doctitle">{esc(txt)}</h1>')
    elif style == 'Heading 1':
        flush_bullets()
        parts.append(f'<h2 class="sechead">{esc(txt)}</h2>')
    elif style.startswith('List'):
        bullets.append(txt)
    elif not parts or parts[-1].startswith('<h1'):
        # the two lines under the title become one lede
        lede.append(txt.replace(' | ', ' · '))
        if len(lede) == 2:
            parts.append(f'<p class="lede">{esc(" · ".join(lede))}</p>')
    elif txt.startswith('Bottom line:'):
        flush_bullets()
        parts.append('<p class="bottom"><b>Bottom line.</b> '
                     + esc(txt[len('Bottom line:'):].strip()) + '</p>')
    else:
        flush_bullets()
        parts.append(runin(txt))

flush_bullets()
assert tnum == 1, tnum

BODY = '\n'.join(parts)
DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'wt_word.html' if WORD else 'wt.html'
open(out, 'w', encoding='utf-8').write(DOC)
print('wrote', out, '|',
      sum(len(b['text'].split()) for b in BLOCKS if b['kind'] == 'p'), 'words')
