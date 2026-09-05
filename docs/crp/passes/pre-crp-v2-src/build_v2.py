# -*- coding: utf-8 -*-
"""Olera Pre-CRP R&D, Commercialization, and Execution Plan, in house style.

Reads text.json, extracted straight from orig.docx, so no sentence is retyped.
This is a formatting pass. The three em dashes house style forbids are the only
wording changes, and each one is listed in EDITS below.
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
ul.pts li { margin: 0 0 2.5pt 0; text-align: left; padding-left: 2pt;
            break-inside: avoid; page-break-inside: avoid; }
ul.pts li::marker { color: #14453f; }
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
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr.quiet td { color: #5f6b64; }

div.wk { margin: 0 0 4pt 0; break-inside: avoid; page-break-inside: avoid; }
p.wkh { margin: 0 0 1pt 0; text-align: left; font-size: 10pt; }
p.wkh b { color: #14453f; }
p.wkh span.d { color: #5f6b64; font-weight: normal; }
p.wkj { margin: 0 0 1pt 0; text-align: left; font-size: 10pt; font-style: italic;
        color: #14453f; }
ol.wkt { margin: 0 0 1.5pt 0; padding: 0 0 0 19pt; font-size: 10pt; }
ol.wkt li { margin: 0 0 0.5pt 0; text-align: left; }
ol.wkt li::marker { color: #5f6b64; }
p.wko { margin: 0; text-align: left; font-size: 9pt; color: #5f6b64; }
p.wko b { color: #14453f; }
span.tag { font-size: 8pt; font-weight: bold; letter-spacing: 0.6pt; color: #14453f; }
span.tag.q { color: #5f6b64; }
div.wk.quiet { color: #5f6b64; }
div.wk.quiet p.wkh b, div.wk.quiet p.wkj, div.wk.quiet p.wko b { color: #5f6b64; }
p.note { font-size: 9.5pt; color: #5f6b64; text-align: left; margin: 5pt 0 3pt 0; }
p.note b { color: #14453f; }
"""

# ---------------------------------------------------------------------------
# The only wording changes. House style permits no em dashes, so each of the
# three in the source is replaced with the punctuation that carries the same
# break. Nothing else in the author's text is altered.
EDITS = [
    ('is execution—whether Olera can',
     'is execution: whether Olera can'),
    ('care establishment—finding appropriate clients and maintaining enough '
     'workers to serve them—and Olera can address both without asking families '
     'to pay.',
     'care establishment: finding appropriate clients and maintaining enough workers '
     'to serve them. Olera can address both without asking families to pay.'),
    ('Future technologies—including more capable AI systems or new forms of care '
     'delivery—can plug',
     'Future technologies, including more capable AI systems or new forms of care '
     'delivery, can plug'),
]

# Captions. The source has none, and a table without a caption is not house style.
CAPTIONS = [
    ('The care-establishment pathway. Each step, what has to happen at it, and the '
     'Olera capability that acts there.', None),
    ('The R&amp;D and commercialization roadmap. What each stage does, and what it '
     'hands to the stage after it.', None),
    ('What institutional-buyer discovery has to resolve before submission, and the '
     'evidence that resolves each question.', None),
    ('The January readiness scorecard. Eight risks, each with the minimum that '
     'establishes credibility, the target, and the stretch.', None),
]
WIDTHS = [[14, 43, 43], [13, 51, 36], [33, 67], [19, 27, 27, 27]]
# Tables 2 and 4 are held whole. Split, they land one row apart in the two
# exports, and each reads as a single argument rather than a list.
KEEP = set()

# Weeks 13 and 17 are the two the author marks as holiday weeks; weeks 5 and 9
# are the two where he schedules a scorecard review and a go or re-cut decision.
HOLIDAY = {13, 17}
CHECKPOINT = {5, 9}


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def apply_edits(t):
    for a, b in EDITS:
        t = t.replace(a, b)
    return t


def table(grid, widths, num, caption, keep=False):
    head, rows = grid[0], grid[1:]
    th = ''.join(f'<th style="width:{w}%">{esc(c)}</th>' for c, w in zip(head, widths))
    body = ''
    for row in rows:
        body += ('<tr><td><b>' + esc(row[0]) + '</b></td>'
                 + ''.join(f'<td>{esc(c)}</td>' for c in row[1:]) + '</tr>')
    tc = 'dat keep' if keep else 'dat'
    return (f'<table class="{tc}"><thead><tr>{th}</tr></thead><tbody>{body}</tbody>'
            f'</table><p class="caption"><b>Table {num}.</b> {caption}</p>')


WEEKHEAD = re.compile(r'^Week (\d+) [·•] (.+)$')
LABEL = re.compile(r"^(Week's job|Tasks|Output):\s*(.*)$", re.S)

BLOCKS = json.load(open('text.json', encoding='utf-8'))
parts = []
tnum = 0
bullets = []
pending_lead = None
week = None            # (number, date span) while a week block is open
wk_job = wk_tasks = None


def flush_bullets():
    global bullets
    if bullets:
        parts.append('<ul class="pts">'
                     + ''.join(f'<li>{esc(b)}</li>' for b in bullets) + '</ul>')
        bullets = []


def close_week(output):
    """Emit one week as a block: header, the week's job, numbered tasks, output.

    The source runs the tasks together in one semicolon-separated sentence. A
    numbered list is the same content, and is what makes the section usable as a
    working plan rather than as prose. The 'Week's job' and 'Tasks' labels are
    dropped because position now carries them; 'Output' stays as a run-in."""
    global week, wk_job, wk_tasks
    n, span = week
    kind = 'quiet' if n in HOLIDAY else ('gate' if n in CHECKPOINT else '')
    tag = ''
    if n in HOLIDAY:
        tag = ' <span class="tag q">HOLIDAY</span>'
    elif n in CHECKPOINT:
        tag = ' <span class="tag">CHECKPOINT</span>'
    items = [t.strip() for t in re.split(r';\s*', wk_tasks.rstrip('.')) if t.strip()]
    lis = ''.join(f'<li>{esc(i[0].upper() + i[1:])}</li>' for i in items)
    parts.append(
        f'<div class="wk{" " + kind if kind else ""}">'
        f'<p class="wkh"><b>Week {n}</b> <span class="d">{esc(span)}</span>{tag}</p>'
        f'<p class="wkj">{esc(wk_job.rstrip("."))}</p>'
        f'<ol class="wkt">{lis}</ol>'
        f'<p class="wko"><b>Output.</b> {esc(output)}</p></div>')
    week = wk_job = wk_tasks = None


for b in BLOCKS:
    if b['kind'] == 'table':
        flush_bullets()
        cap = CAPTIONS[tnum][0]
        tnum += 1
        parts.append(table(b['grid'], WIDTHS[tnum - 1], tnum, cap,
                           keep=tnum in KEEP))
        continue

    style = b['style']
    txt = apply_edits(' '.join(b['text'].split()))

    if style == 'Title':
        # The source breaks the title across two lines mid-phrase.
        parts.append('<h1 class="doctitle">Olera Pre-CRP R&amp;D, '
                     'Commercialization, and Execution Plan</h1>')
    elif style == 'Subtitle':
        parts.append(f'<p class="lede">{esc(txt)}</p>')
    elif style == 'Heading 1':
        flush_bullets()
        parts.append(f'<h2 class="sechead">{esc(txt)}</h2>')
    elif style == 'Heading 2':
        flush_bullets()
        m = WEEKHEAD.match(txt)
        if m:
            week = (int(m.group(1)), m.group(2))
        else:
            # A subsection heading becomes the bold lead-in of the paragraph
            # under it rather than a second bold line stacked above one. The
            # colon in "Olera Pro: Client Growth" goes, because the sentence it
            # leads already has one.
            pending_lead = txt.replace('Olera Pro: ', 'Olera Pro ')
    elif week:
        m = LABEL.match(txt)
        if not m:
            raise AssertionError('unlabelled line inside a week: ' + txt[:60])
        which, val = m.group(1), m.group(2)
        if which == "Week's job":
            wk_job = val
        elif which == 'Tasks':
            wk_tasks = val
        else:
            close_week(val)
    elif txt.startswith('•'):
        bullets.append(txt.lstrip('• ').strip())
    elif txt.startswith('Working note.'):
        flush_bullets()
        parts.append('<p class="note"><b>Working note.</b> '
                     + esc(txt[len('Working note.'):].strip()) + '</p>')
    else:
        flush_bullets()
        if pending_lead:
            parts.append(f'<p class="sec"><b>{esc(pending_lead)}.</b> {esc(txt)}</p>')
            pending_lead = None
        else:
            parts.append(f'<p class="sec">{esc(txt)}</p>')

flush_bullets()
assert week is None, 'a week block was left open'
assert tnum == 4, tnum

BODY = '\n'.join(parts)
DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'plan_word.html' if WORD else 'plan.html'
open(out, 'w', encoding='utf-8').write(DOC)
words = sum(len(b['text'].split()) for b in BLOCKS if b['kind'] == 'p')
print('wrote', out, '|', words, 'words of source prose |', tnum, 'tables')
