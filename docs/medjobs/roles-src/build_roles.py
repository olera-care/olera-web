# -*- coding: utf-8 -*-
"""Build the three role Operations Manuals from their markdown sources.

They share the matrix's house style and its renderer, so the four documents
cannot drift apart typographically. What is added here is navigation: a button
bar of internal anchors at the top of each manual, and a return link at the end
of every section. Chromium's print-to-PDF turns both into real PDF GoTo links.

The role sources carry no em dashes, so they need no dedash pass.
"""
import os, re, subprocess, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
MATRIX = os.path.normpath(os.path.join(HERE, '..', 'matrix-src'))
sys.path.insert(0, MATRIX)
import md2html  # noqa: E402

# The nav bar reads as buttons rather than links, and the return link is quiet
# enough to sit under every section without becoming furniture.
md2html.CSS += """
p.navbar { margin:6pt 0 10pt; padding:7pt 8pt; text-align:left;
           border:0.8pt solid var(--rule); border-radius:3pt; background:var(--soft);
           line-height:1.9; break-inside:avoid; }
p.navbar a { display:inline-block; margin:0 4pt 0 0; padding:2.5pt 6pt;
             border:0.8pt solid var(--teal); border-radius:2.5pt;
             color:var(--teal); font-size:9pt; font-weight:700;
             text-decoration:none; }
p.navlabel { margin:0 0 2pt; font-size:8.5pt; font-weight:700; color:var(--muted);
             text-transform:uppercase; letter-spacing:0.4pt; }
p.totop { margin:2pt 0 12pt; text-align:right; font-size:8.5pt; }
p.totop a { color:var(--muted); text-decoration:none; }
/* A gap block: an open question in the master, carried rather than answered. */
div.gap { border-left:2.5pt solid var(--teal); background:var(--soft);
          margin:6pt 0 8pt; padding:5pt 8pt 5pt 9pt; font-size:10pt;
          break-inside:avoid; page-break-inside:avoid; }
div.gap p { margin:0; text-align:left; }
/* A stage's operating spine is a headerless two-column table: label, then the
   fact. Tagged by shape, because attr_list does not attach to a table. */
table.field th { display:none; }
table.field td:first-child { width:23%; font-weight:700; color:var(--teal); }
/* No forced break before a section: jumps address a named destination, which
   carries the heading's own coordinate, so a section does not need to start at
   the top of a page for the jump bar to land on it. break-after:avoid on the
   heading is what stops one stranding at a page foot. */
h2 { margin-top:16pt; }
.gap { border-left:2.5pt solid var(--teal); padding:5pt 0 5pt 9pt; margin:6pt 0 8pt;
       background:var(--soft); break-inside:avoid; }
.gap p { margin:0 0 3pt; }
"""

DOCS = [
    ('ADMIN', 'MedJobs Admin Team Operations',
     'Admin Team view of the MedJobs 2.0 operating system &#183; 4 September 2026'),
    ('SALES', 'MedJobs Sales Lead Operations',
     'Sales Lead view of the MedJobs 2.0 operating system &#183; 4 September 2026'),
    ('CRM', 'MedJobs Consumer Relations Manager Operations',
     'Consumer Relations Manager view of the MedJobs 2.0 operating system &#183; 4 September 2026'),
]

OUT = os.path.normpath(os.path.join(HERE, '..'))
NAMES = {'ADMIN': 'MedJobs_Admin_Team_Operations',
         'SALES': 'MedJobs_Sales_Lead_Operations',
         'CRM': 'MedJobs_Consumer_Relations_Manager_Operations'}

jobs = []
for key, title, sub in DOCS:
    src, html = f'{key}.md', f'{key.lower()}.html'
    assert '—' not in open(src, encoding='utf-8').read(), f'em dash in {src}'
    md2html.build(src, html, title, sub, notoc='1')
    doc = open(html, encoding='utf-8').read()
    doc = doc.replace('<div class="doc-title">', '<div class="doc-title" id="top">', 1)
    # A table whose header cells are all empty is a field table, not a data one.
    doc = re.sub(r'<table>(?=\s*<thead>\s*<tr>(?:\s*<th[^>]*></th>)+\s*</tr>)',
                 '<table class="field">', doc)
    open(html, 'w', encoding='utf-8').write(doc)
    jobs.append({'html': os.path.join(HERE, html),
                 'pdf': os.path.join(HERE, f'{key.lower()}.pdf'),
                 'footer': title})

subprocess.run(['node', os.path.join(MATRIX, 'html2pdf.mjs'), json.dumps(jobs)], check=True)
for key, *_ in DOCS:
    dst = os.path.join(OUT, NAMES[key] + '.pdf')
    subprocess.run(['cp', os.path.join(HERE, f'{key.lower()}.pdf'), dst], check=True)
    print('->', dst)
