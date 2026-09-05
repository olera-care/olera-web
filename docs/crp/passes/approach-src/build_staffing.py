# -*- coding: utf-8 -*-
"""Staffing and workstream table, in the Research Strategy house style.

Wording is the author's, transcribed from the supplied table. Only the
typography is house: teal header rule, teal bold row labels, hairline row
rules, 9pt, and a caption.
"""
import os

WORD = os.environ.get('WORD_EXPORT') == '1'
TABLE_NUM = 4          # continues the Approach sequence; change if the merge moves it

HEAD = ["Workstream", "CRP Y1", "CRP Y2", "CRP Y3"]
ROWS = [
    ("Product and technical leadership", "Falohun", "Falohun", "Falohun"),
    ("Engineering", "Two full-time engineers and founder engineering",
     "Maintenance and refinement", "Commercial refinement"),
    ("Research integration", "DuBose", "DuBose", "DuBose"),
    ("Human subjects", "Clemson and Fan", "Clemson and Fan", "Analysis as needed"),
    ("Family and provider operations", "Two full-time existing staff",
     "Eight free markets", "Eight paid markets"),
    ("Market operations lead", "Training and playbook design",
     "Runs validation activation", "Executes new-market replication"),
    ("Commercialization", "Offer preparation",
     "Willingness to pay and investor cultivation", "Paid sales and financing"),
    ("Independent validation", "Technical and statistical, as specified",
     "Statistical", "CPA and economic"),
]
WIDTHS = [22.0, 27.0, 25.0, 26.0]
CAPTION = ("Who carries each workstream in each award year, and how the staffing "
           "shifts as the work moves from engineering to validation to paid markets.")

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p.caption { text-align: left; margin: 3pt 0 4pt 0; font-size: 9pt; line-height: 1.16;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 0 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0;
                     vertical-align: bottom; }
table.dat td { padding: 3pt 6pt 3pt 0; border-bottom: 0.4pt solid #b9c4bd;
               vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }
"""


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


head = ''.join(f'<th style="width:{w}%">{esc(h)}</th>' for h, w in zip(HEAD, WIDTHS))
body = ''.join('<tr>' + f'<td><b>{esc(r[0])}</b></td>'
               + ''.join(f'<td>{esc(c)}</td>' for c in r[1:]) + '</tr>' for r in ROWS)
BODY = (f'<table class="dat keep"><thead><tr>{head}</tr></thead>'
        f'<tbody>{body}</tbody></table>'
        f'<p class="caption"><b>Table {TABLE_NUM}.</b> {esc(CAPTION)}</p>')

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'staffing_word.html' if WORD else 'staffing.html'
open(out, 'w', encoding='utf-8').write(DOC)
print('wrote', out)
