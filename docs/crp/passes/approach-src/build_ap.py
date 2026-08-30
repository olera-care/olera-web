# -*- coding: utf-8 -*-
"""APPROACH section, in the Research Strategy house style.

Text and criteria are the author's, read straight out of orig.docx via text.json
so nothing is retyped. What this supplies is the house typography, the three
criteria tables, and the timetable drawn as a figure rather than a grid of
bullet characters.

Numbering is provisional. Figures continue the sequence from the Innovation v5
draft, which ends at Figure 8; tables restart at 1 because the Significance
table count is not settled. Change the two constants below when the merge fixes
the real numbering.
"""
import json, os, re
import figs_ap as FA

WORD = os.environ.get('WORD_EXPORT') == '1'
FIG_START = 9
TABLE_START = 1

T = json.load(open('text.json'))
P, TB = T['paras'], T['tables']

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; orphans: 2; widows: 2; }
p.sec { margin: 6pt 0 3pt 0; }
p.first-sec { margin-top: 0; }
p.aim { margin: 10pt 0 3pt 0; text-align: left; font-weight: bold; color: #14453f;
        break-after: avoid; page-break-after: avoid; }
p.caption { text-align: left; margin: 2pt 0 4pt 0; font-size: 9pt; line-height: 1.16;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
h1.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 0 0 5pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt; }

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
table.dat tbody tr.gate td { background: #eef3f1; }
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }

div.fig { margin: 3pt 0 2pt 0; text-align: center;
          break-inside: avoid; page-break-inside: avoid; }
div.fig img { display: inline-block; max-width: 100%; }
div.figblk { break-inside: avoid; page-break-inside: avoid; margin: 0; }
"""

WIDTHS = [30.0, 42.0, 28.0]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def crit_table(grid, num, caption):
    """A criteria table. The human-protection gate row is shaded, since it is the
    one row that stops the aim rather than describing it."""
    head = ''.join(f'<th style="width:{w}%">{esc(c)}</th>'
                   for c, w in zip(grid[0], WIDTHS))
    body = ''
    for row in grid[1:]:
        gate = row[0].strip().lower().startswith('human protection')
        cls = ' class="gate"' if gate else ''
        cells = f'<td><b>{esc(row[0])}</b></td>' + ''.join(
            f'<td>{esc(c)}</td>' for c in row[1:])
        body += f'<tr{cls}>{cells}</tr>'
    return (f'<table class="dat keep"><thead><tr>{head}</tr></thead>'
            f'<tbody>{body}</tbody></table>'
            f'<p class="caption"><b>Table {num}.</b> {caption}</p>')


def figblock(svg, num, cap):
    if WORD:
        w = float(re.search(r'width="([\d.]+)in"', svg).group(1))
        svg = f'<img src="png/timetable.png" style="width:{w}in">'
    return (f'<div class="figblk"><div class="fig">{svg}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p></div>')


def runin(text, cls='sec'):
    """The author's own lead-in, set bold as every other section sets it.

    Split on the first period followed by a space. A naive first-period split
    breaks on "Task 1.1"; this leaves both that and "GO/NO-GO 1." intact."""
    i = text.find('. ')
    if 5 < i < 130:
        return (f'<p class="{cls}"><b>{esc(text[:i + 1])}</b> '
                f'{esc(text[i + 2:])}</p>')
    return f'<p class="{cls}">{esc(text)}</p>'


def aim(text):
    """An aim opens with a standalone bold line, then its framing paragraph."""
    m = re.match(r'^(Specific Aim \d+: [^.]+\.)\s+(.*)$', text, re.S)
    return (f'<p class="aim">{esc(m.group(1))}</p>'
            f'<p class="sec first-sec">{esc(m.group(2))}</p>')


CAPS = ["Aim 1 success criteria, and the source of each measurement.",
        "Aim 2 success criteria, and the source of each measurement.",
        "Aim 3 success criteria, and the source of each measurement."]

parts = ['<h1 class="sechead">Approach</h1>']
parts.append(aim(P[1]))                                   # Aim 1
for p in P[2:7]:                                          # Tasks 1.1 to 1.5
    parts.append(runin(p))
parts.append(runin(P[7]))                                 # problems and gate 1
parts.append(crit_table(TB[0], TABLE_START, CAPS[0]))

parts.append(aim(P[8]))                                   # Aim 2
for p in P[9:13]:                                         # Tasks 2.1 to 2.4
    parts.append(runin(p))
parts.append(runin(P[13]))                                # analysis and gate 2
parts.append(crit_table(TB[1], TABLE_START + 1, CAPS[1]))

parts.append(aim(P[14]))                                  # Aim 3
for p in P[15:19]:                                        # Tasks 3.1 to 3.4
    parts.append(runin(p))
parts.append(runin(P[19]))                                # problems and final gate
parts.append(crit_table(TB[2], TABLE_START + 2, CAPS[2]))

parts.append(runin(P[20]))                                # Timetable
cap = re.sub(r'^Figure X\.\s*', '', P[21])
parts.append(figblock(FA.timetable(TB[3]), FIG_START, esc(cap)))

BODY = '\n\n'.join(parts)
DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""

out = 'ap_word.html' if WORD else 'ap_house.html'
open(out, 'w', encoding='utf-8').write(DOC)
print('wrote', out, '|', sum(len(p.split()) for p in P), 'words of source text')
