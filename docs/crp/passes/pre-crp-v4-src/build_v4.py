# -*- coding: utf-8 -*-
"""Olera Pre-CRP R&D, Commercialization, and Execution Plan, iteration 4,
in house style.

Reads text.json, extracted straight from orig.docx, so no sentence is retyped.
This is a formatting pass. The only wording changes are the dashes house style
governs, all listed in EDITS below. Figure 1 is the author's own image, lifted
out of the source file into media/.
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
div.fig { margin: 4pt 0 2pt 0; text-align: center;
          break-inside: avoid; page-break-inside: avoid; }
div.fig img { display: inline-block; max-width: 100%; }
div.figblk { break-inside: avoid; page-break-inside: avoid; margin: 0; }
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
table.dat tbody tr.here td { background: #eef3f1; }
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }
span.tag { font-size: 8pt; font-weight: bold; letter-spacing: 0.6pt; color: #14453f; }
span.tag.q { color: #5f6b64; }
p.note { font-size: 9.5pt; color: #5f6b64; text-align: left; margin: 6pt 0 3pt 0; }
p.note b { color: #14453f; }
"""

# ---------------------------------------------------------------------------
# The only wording changes. House style permits no em dashes and allows en
# dashes only in numeric ranges, so a hyphen doing a dash's work is replaced by
# the punctuation that carries the same break, and a hyphen in a range becomes
# an en dash. Nothing else in the author's text is altered.
EDITS = [
    # spaced hyphens standing in for dashes
    ('Provider commercialization - retire', 'Provider commercialization: retire'),
    ('first-generation development - retire', 'first-generation development: retire'),
    ('Institutional-buyer discovery - retire', 'Institutional-buyer discovery: retire'),
    ('technologies - including automation, AI, and robotics - can be incorporated',
     'technologies, including automation, AI, and robotics, can be incorporated'),
    # ranges
    ('September 2026 - January 2027', 'September 2026\u2013January 2027'),
    ('2021-2024', '2021\u20132024'),
    ('2024-2026', '2024\u20132026'),
    ('2027-2030', '2027\u20132030'),
    ('$100-$150', '$100\u2013$150'),
]
# the eighteen date spans in the week table, all of the form "Aug 31-Sep 4"
DATERANGE = re.compile(r'\b([A-Z][a-z]{2} \d{1,2})-((?:[A-Z][a-z]{2} )?\d{1,2})\b')

CAPTIONS = [
    'The R&amp;D and commercialization program. What each stage does, what it '
    'produces, and what it hands to the stage after it.',
    'The two provider products. Pricing and targets are working hypotheses until '
    'the team locks them, as the paragraph below states.',
    'The pre-CRP CareNavigator plan, month by month, and the output each month '
    'has to produce.',
    'What institutional-buyer discovery has to resolve before the CRP, and the '
    'output that resolves each question.',
    'The January scorecard. What each risk would let the application say if the '
    'target is met.',
    'The eighteen weeks to submission. One job per week, with the tasks under it.',
]
WIDTHS = [[16, 30, 28, 26],
          [15, 28, 30, 27],
          [11, 55, 34],
          [14, 47, 39],
          [15, 19, 23, 18, 25],
          [7, 12, 21, 60]]
KEEP = set()

STATUS = re.compile(r'^(COMPLETE|WE ARE HERE)$')


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def fix(t):
    for a, b in EDITS:
        t = t.replace(a, b)
    return DATERANGE.sub('\\1\u2013\\2', t)


def stage_cell(c):
    """Table 1's first column already carries stage, timeframe and status on
    separate lines. Word's line breaks do not survive the extraction, so they
    are restored here, and the trailing status word becomes the same small
    marker the rest of the house uses."""
    bits = [fix(b.strip()) for b in c.split('\n') if b.strip()]
    tag = ''
    if bits and STATUS.match(bits[-1]):
        word = bits.pop()
        cls = 'tag q' if word == 'COMPLETE' else 'tag'
        tag = f'<br><span class="{cls}">{word}</span>'
    return '<br>'.join(esc(b) for b in bits) + tag


def table(grid, widths, num, caption, keep=False, cell0=None, hererow=None):
    head, rows = grid[0], grid[1:]
    th = ''.join(f'<th style="width:{w}%">{esc(fix(c))}</th>'
                 for c, w in zip(head, widths))
    body = ''
    for i, row in enumerate(rows):
        cls = ' class="here"' if hererow is not None and i == hererow else ''
        c0 = cell0(row[0]) if cell0 else esc(fix(row[0]))
        body += (f'<tr{cls}><td><b>{c0}</b></td>'
                 + ''.join(f'<td>{esc(fix(c))}</td>' for c in row[1:])
                 + '</tr>')
    tc = 'dat keep' if keep else 'dat'
    return (f'<table class="{tc}"><thead><tr>{th}</tr></thead><tbody>{body}</tbody>'
            f'</table><p class="caption"><b>Table {num}.</b> {caption}</p>')


BLOCKS = json.load(open('text.json', encoding='utf-8'))
parts = []
tnum = 0
pending_lead = None
first_normal = True

for b in BLOCKS:
    if b['kind'] == 'table':
        cap = CAPTIONS[tnum]
        tnum += 1
        parts.append(table(b['grid'], WIDTHS[tnum - 1], tnum, cap,
                           keep=tnum in KEEP,
                           cell0=stage_cell if tnum == 1 else None,
                           hererow=1 if tnum == 1 else None))
        continue

    style = b['style']
    txt = fix(' '.join(b['text'].split()))

    if style == 'Title':
        parts.append(f'<h1 class="doctitle">{esc(txt)}</h1>')
    elif style == 'Heading 1':
        parts.append(f'<h2 class="sechead">{esc(txt)}</h2>')
    elif style == 'Heading 2':
        # A subsection heading becomes the bold lead-in of the paragraph under
        # it rather than a second bold line stacked above one.
        pending_lead = txt
    elif first_normal:
        # the date line under the title
        parts.append(f'<p class="lede">{esc(txt)}</p>')
        first_normal = False
    elif txt.startswith('Figure 1.'):
        # The author's own figure, lifted out of orig.docx. Its caption is this
        # paragraph, moved under the image where a caption belongs.
        parts.append(
            '<div class="figblk"><div class="fig">'
            '<img src="media/image1.png" style="width:7.3in"></div>'
            f'<p class="caption"><b>Figure 1.</b> {esc(txt[len("Figure 1."):].strip())}'
            '</p></div>')
    elif txt.startswith('This is a living planning memo'):
        parts.append(f'<p class="note"><b>Working note.</b> {esc(txt)}</p>')
    else:
        if pending_lead:
            parts.append(f'<p class="sec"><b>{esc(pending_lead)}.</b> {esc(txt)}</p>')
            pending_lead = None
        else:
            parts.append(f'<p class="sec">{esc(txt)}</p>')

assert tnum == 6, tnum
assert pending_lead is None

BODY = '\n'.join(parts)
DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'plan_word.html' if WORD else 'plan.html'
open(out, 'w', encoding='utf-8').write(DOC)
words = sum(len(b['text'].split()) for b in BLOCKS if b['kind'] == 'p')
print('wrote', out, '|', words, 'words of source prose |', tnum, 'tables')
