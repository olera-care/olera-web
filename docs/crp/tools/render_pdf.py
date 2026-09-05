#!/usr/bin/env python3
"""Render docs/crp/research-strategy.md to house-style HTML/PDF.

House style per docs/crp/README.md section 6 (ratified 2026-08-17), measured from
the Drive RS docx. The markdown is a text export that lost run formatting, so this
script reapplies it by the documented conventions.
"""
import base64, html, os, re, subprocess, sys

import yaml

CRP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # docs/crp
MD = os.path.join(CRP, 'research-strategy.md')
REFS = os.path.join(CRP, 'references.yaml')
FIGDIR = CRP
OUT_DIR = sys.argv[1] if len(sys.argv) > 1 else '/tmp'
OUT_HTML = os.path.join(OUT_DIR, 'rs_housestyle.html')
OUT_PDF = os.path.join(OUT_DIR, 'Olera_CRP_ResearchStrategy_HouseStyle.pdf')

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 2pt 0; text-align: justify; }
p.sec { font-weight: bold; text-align: left; margin: 8pt 0 2pt 0; }
p.first-sec { margin-top: 0; }
p.metrics-head { font-style: italic; text-decoration: underline; text-align: left;
                 margin: 4pt 0 2pt 0; }
p.standalone-iu { font-style: italic; text-decoration: underline; margin: 4pt 0 2pt 0;
                  text-align: left; }
p.caption { text-align: left; margin: 2pt 0 6pt 0; }
sup { line-height: 0; }
sup.todo { color: #b45309; font-weight: bold; }
div.refs { break-before: page; page-break-before: always; }
div.refs p { font-size: 9pt; text-align: left; margin: 0 0 3pt 0; }
div.refs p.refnote { color: #555; font-style: italic; margin-bottom: 8pt; }
div.fig { margin: 5pt 0 2pt 0; text-align: center; }
div.fig img, div.fig svg { max-width: 100%; height: auto; }
div.figblock { break-inside: avoid; page-break-inside: avoid; }
/* Wrapped figure: floats right, justified body text runs beside it. */
div.figwrap { float: right; width: 3.2in; margin: 1pt 0 4pt 11pt; break-inside: avoid;
              page-break-inside: avoid; }
div.figwrap svg, div.figwrap img { width: 100%; height: auto; display: block; }
div.figwrap p.caption { margin: 3pt 0 0 0; text-align: left; }
p.clearfix { clear: both; margin: 0; height: 0; }
ul.accomp { margin: 2pt 0 3pt 0; padding-left: 15pt; }
ul.accomp li { text-align: justify; margin: 0 0 2pt 0; padding-left: 2pt; }
/* Comparison matrix: horizontal rules only, own-product column blocked in, marks
   not sentences (house style section 6, ratified 2026-08-19 from the Phase IIB
   competitive matrix). */
table.matrix { width: 100%; border-collapse: separate; border-spacing: 0;
               font-size: 9pt; line-height: 1.15; margin: 6pt 0 3pt 0;
               -webkit-print-color-adjust: exact; print-color-adjust: exact; }
table.matrix th, table.matrix td { padding: 2.5pt 4pt; vertical-align: middle;
                                   text-align: center; }
table.matrix thead th { font-weight: bold; vertical-align: bottom; color: #14453f;
                        border-bottom: 1pt solid #14453f; padding-bottom: 3pt; }
table.matrix thead th.rowlab { border-bottom: 1pt solid #14453f; }
table.matrix span.eg { display: block; font-weight: normal; font-style: italic;
                       font-size: 7.5pt; line-height: 1.1; }
table.matrix tbody td { border-bottom: 0.5pt solid #14453f;
                        font-family: Arial, "DejaVu Sans", sans-serif; }
table.matrix tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.matrix td.rowlab, table.matrix th.rowlab { text-align: left; font-weight: bold;
                                                 color: #14453f; width: 26%; }
table.matrix .yes, table.matrix .no { font-size: 11pt; line-height: 1; }
table.matrix .yes { color: #14453f; font-weight: bold; }
table.matrix .no { color: #9b1c1c; font-weight: bold; }
table.matrix .own { background: #14453f; color: #fff; }
table.matrix .own .yes, table.matrix .own .no { color: #fff; }
table.matrix thead th.own { border-bottom: 1pt solid #14453f;
                            border-radius: 5pt 5pt 0 0; padding-top: 3pt; }
table.matrix tbody tr:last-child td.own { border-radius: 0 0 5pt 5pt; }
"""

def unescape_md(t):
    t = t.replace('\\[', '[').replace('\\]', ']').replace('\\&', '&')
    t = t.replace('\\<', '<').replace('\\>', '>')
    return t

def esc(t):
    return html.escape(unescape_md(t), quote=False)

def img_tag(relpath):
    path = os.path.join(FIGDIR, relpath)
    if relpath.endswith('.svg'):
        svg = open(path, encoding='utf-8').read()
        return svg  # inline the SVG so fonts/scale render natively
    b64 = base64.b64encode(open(path, 'rb').read()).decode()
    ext = relpath.rsplit('.', 1)[-1]
    return f'<img src="data:image/{ext};base64,{b64}">'

# ---- run-in convention tables (from README §6 / measured docx) ----
BOLD_LEADS_SENTENCE = [  # bold from start through the end of the first sentence
    'The unmet need.', 'The product and the business model.', 'The two-sided market.',
    'Competitive environment and our advantage.', 'Hurdles to adoption.',
    'National reach at no acquisition cost.', 'The family-facing CareNavigator MVP.',
    'A provider-paid workforce precedent.', 'The Provider Growth Suite.',
    'Investor-readiness groundwork.', 'What this record means for the CRP.',
    'Overall design and timetable (Figure A).', 'Regulatory plan.',
    'Problems and alternatives.',
]
ITALIC_LEADS_SENTENCE = [  # italic through the end of the first sentence
    'Matching (live).', 'Execution loop (in development).',
    'Follow-up loop (yet to be developed).', 'Staffing.', 'Clients.',
    'Design, participants, and recruitment.', 'Data collection procedures.',
    'Data management and analysis.',
]
IU_COLON_LEADS = [  # italic + underlined run-in leads
    'The CareNavigator Platform.',
]
STANDALONE_IU = ['The CareNavigator Platform.', 'The Provider Growth Suite.']

def first_sentence_split(t):
    """Split at the first '. ' (or trailing '.') that ends the lead sentence."""
    m = re.search(r'\.(\s|$)', t)
    if not m:
        return t, ''
    i = m.start() + 1
    return t[:i], t[i:]

def render_paragraph(t):
    # Section heading: ALL CAPS
    if re.fullmatch(r'[A-Z][A-Z .,&/-]+', t):
        return f'<p class="sec">{esc(t)}</p>', 'sec'
    # Metrics heading
    if t.startswith('Metrics for Success') and t.rstrip().endswith(':'):
        return f'<p class="metrics-head">{esc(t)}</p>', 'metrics'
    # Standalone italic+underlined block headings
    if t in STANDALONE_IU:
        return f'<p class="standalone-iu">{esc(t)}</p>', 'body'
    # Specific Aim N: bold title sentence, then underline "Rationale:" run-in
    if re.match(r'Specific Aim \d:', t):
        lead, rest = first_sentence_split(t)
        rest_html = esc(rest)
        rest_html = rest_html.replace(' Rationale:', ' <u>Rationale:</u>', 1)
        return f'<p><b>{esc(lead)}</b>{rest_html}</p>', 'body'
    # Task N.N bold title sentence
    if re.match(r'Task \d\.\d', t):
        lead, rest = first_sentence_split(t)
        return f'<p><b>{esc(lead)}</b>{esc(rest)}</p>', 'body'
    # (Task N.NX) italic through colon
    m = re.match(r'(\(Task \d\.\d[A-Z]\)[^:]*:)(.*)', t, re.S)
    if m:
        return f'<p><i>{esc(m.group(1))}</i>{esc(m.group(2))}</p>', 'body'
    # Aim N decision point
    m = re.match(r'(Aim \d decision point and deliverable\.)(.*)', t, re.S)
    if m:
        return f'<p><b>{esc(m.group(1))}</b>{esc(m.group(2))}</p>', 'body'
    # Key Innovation N: bold through title sentence
    if re.match(r'Key Innovation \d:', t):
        lead, rest = first_sentence_split(t)
        return f'<p><b>{esc(lead)}</b>{esc(rest)}</p>', 'body'
    # italic+underlined category run-ins
    for lead in IU_COLON_LEADS:
        if t.startswith(lead):
            return f'<p><i><u>{esc(lead)}</u></i>{esc(t[len(lead):])}</p>', 'body'
    # bold named-paragraph run-ins
    for lead in BOLD_LEADS_SENTENCE:
        if t.startswith(lead):
            return f'<p><b>{esc(lead)}</b>{esc(t[len(lead):])}</p>', 'body'
    # italic component run-ins
    for lead in ITALIC_LEADS_SENTENCE:
        if t.startswith(lead):
            return f'<p><i>{esc(lead)}</i>{esc(t[len(lead):])}</p>', 'body'
    return f'<p>{esc(t)}</p>', 'body'

def render_metric_item(t):
    m = re.match(r'([A-Z][^:]{0,45}:)(.*)', t, re.S)
    if m:
        return f'<p><b>{esc(m.group(1))}</b>{esc(m.group(2))}</p>'
    return f'<p>{esc(t)}</p>'

def split_row(r):
    return [c.strip() for c in r.strip().strip('|').split('|')]

def mark_cell(c):
    """✓/✗ become styled marks; anything else renders as short label text."""
    t = c.strip()
    if t in ('✓', '✔'):
        return '<span class="yes">&#10003;</span>'
    if t in ('✗', '✕', 'x', 'X'):
        return '<span class="no">&#10007;</span>'
    return esc(t)

def head_cell(c):
    """'Label // examples' renders the examples as a small italic second line."""
    if '//' in c:
        lab, eg = c.split('//', 1)
        return f'{esc(lab.strip())}<span class="eg">{esc(eg.strip())}</span>'
    return esc(c)

def render_table(rows):
    """Markdown pipe table -> house-style comparison matrix.

    Column 1 is the row-label column; column 2 is our own product and is blocked
    in so the comparison reads at a glance.
    """
    rows = [r for r in rows if not re.fullmatch(r'[|\s:-]+', r)]   # drop the --- rule
    if not rows:
        return ''
    head, body_rows = split_row(rows[0]), [split_row(r) for r in rows[1:]]
    th = ''.join(
        f'<th class="{"rowlab" if j == 0 else "own" if j == 1 else ""}">{head_cell(c)}</th>'
        for j, c in enumerate(head))
    trs = ''
    for r in body_rows:
        tds = ''.join(
            f'<td class="rowlab">{esc(c)}</td>' if j == 0 else
            f'<td class="own">{mark_cell(c)}</td>' if j == 1 else
            f'<td>{mark_cell(c)}</td>'
            for j, c in enumerate(r))
        trs += f'<tr>{tds}</tr>'
    return (f'<table class="matrix"><thead><tr>{th}</tr></thead>'
            f'<tbody>{trs}</tbody></table>')

def render_caption(t):
    # t like "Figure 1: caption text" or "Table 1: ..."
    m = re.match(r'((?:Figure|Table) [A-Z0-9]+[:.])\s*(.*)', t, re.S)
    if m:
        return f'<p class="caption"><b>{esc(m.group(1))}</b> {esc(m.group(2))}</p>'
    return f'<p class="caption">{esc(t)}</p>'

def build_body(src, img_fn=img_tag):
    """Markdown source -> list of house-style HTML blocks.

    Shared with tools/export_docx.py so the docx and the PDF apply the same run-in,
    caption, table, and bullet conventions. img_fn turns a figure path into markup:
    the PDF inlines SVG and base64-encodes PNGs; the docx writes files and links them.
    """
    src = re.sub(r'<!--.*?-->', '', src, flags=re.S)          # provenance comment
    src = re.sub(r'^# .*$', '', src, count=1, flags=re.M)      # working-snapshot H1

    body = []
    in_metrics = False
    first_sec = True
    lines = [l for l in src.split('\n')]
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1
        if not line or line in ('<div style="margin:6px 0 4px">', '</div>'):
            continue
        # image line
        m = re.match(r'!\[([^\]]*)\]\(([^)]+)\)', line)
        if m:
            cls = 'fig wrapme' if 'wrap' in m.group(1).lower() else 'fig'
            body.append(f'<div class="{cls}">{img_fn(m.group(2))}</div>')
            continue
        # raw Figure A caption span from the md
        if line.startswith('<span style='):
            inner = re.sub(r'</?span[^>]*>', '', line)
            inner = re.sub(r'<b>(Figure A:)\s*', r'<b>\1</b> ', inner, count=1)
            inner = inner.replace('</b>', '', 1) if inner.count('</b>') > 1 else inner
            # normalize: bold only "Figure A:", keep the bracketed note italic
            text = re.sub(r'<[^>]+>', '', line)
            mm = re.match(r'(Figure A:)\s*(.*)', text, re.S)
            note = ''
            main_txt = mm.group(2)
            nm = re.search(r'(\[Figure numbering[^\]]*\])', main_txt)
            if nm:
                note = f' <i>{esc(nm.group(1))}</i>'
                main_txt = main_txt.replace(nm.group(1), '').strip()
            body.append(f'<p class="caption"><b>Figure A:</b> {esc(main_txt)}{note}</p>')
            continue
        # markdown bullet list: consecutive lines starting with '- '
        if line.startswith('- '):
            items = [line[2:].strip()]
            while i < len(lines) and lines[i].strip().startswith('- '):
                items.append(lines[i].strip()[2:].strip())
                i += 1
            lis = ''.join(f'<li>{esc(it)}</li>' for it in items)
            body.append(f'<ul class="accomp">{lis}</ul>')
            in_metrics = False
            continue
        # markdown table: consecutive lines starting with '|'
        if line.startswith('|'):
            rows = [line]
            while i < len(lines) and lines[i].strip().startswith('|'):
                rows.append(lines[i].strip())
                i += 1
            body.append(render_table(rows))
            in_metrics = False
            continue
        # markdown caption line *Figure N: ...*
        m = re.match(r'\*((?:Figure|Table) .+)\*$', line)
        if m:
            body.append(render_caption(m.group(1)))
            in_metrics = False
            continue
        # metric items under a metrics heading
        if in_metrics and not line.startswith(('Task', 'Specific Aim', '(Task', 'Aim ')) \
           and not re.fullmatch(r'[A-Z][A-Z .,&/-]+', line):
            body.append(render_metric_item(line))
            continue
        html_p, kind = render_paragraph(line)
        if kind == 'sec' and first_sec:
            html_p = html_p.replace('class="sec"', 'class="sec first-sec"')
            first_sec = False
        in_metrics = (kind == 'metrics')
        body.append(html_p)
    return body


def resolve_citations(body, src, todo_markup='<sup class="todo">[cite]</sup>',
                      sup=lambda n: f'<sup>{n}</sup>'):
    """Replace [@key] markers with numbers in first-appearance order.

    Returns (body, cite_order, refs). Exits if a key is missing from
    references.yaml, so neither pipeline can ship an unresolvable citation.
    """
    refs = yaml.safe_load(open(REFS, encoding='utf-8'))
    cite_order, missing, todo_count = [], set(), 0
    cite_re = re.compile(r'\[@([^\]]+)\]')

    def cite_repl(m):
        nonlocal todo_count
        content = m.group(1).strip()
        if content.startswith('todo:'):
            todo_count += 1
            return '<sup class="todo">[cite]</sup>'
        nums = []
        for key in [k.strip().lstrip('@') for k in content.split(';')]:
            if key not in refs:
                missing.add(key)
                continue
            if key not in cite_order:
                cite_order.append(key)
            nums.append(str(cite_order.index(key) + 1))
        return '<sup>' + ','.join(nums) + '</sup>' if nums else ''

    body = [cite_re.sub(cite_repl, b) for b in body]

    if missing:
        sys.exit(f'ERROR: citation keys not in references.yaml: {sorted(missing)}')
    unused = [k for k in refs if k not in cite_order]
    legacy = len(re.findall(r'\\\[cite\\\]', src))
    print(f'citations: {len(cite_order)} sources cited, {todo_count} [@todo:] pending, '
          f'{legacy} legacy [cite] placeholders, {len(unused)} bibliography entries not yet cited')
    if unused:
        print('  not yet cited:', ', '.join(unused))
    return body, cite_order, refs


def reference_lines(cite_order, refs):
    """Numbered reference strings in citation order, shared by both pipelines."""
    out = []
    for i, k in enumerate(cite_order):
        line = f'{i + 1}. {refs[k]["ref"]}'
        if refs[k].get('doi'):
            line += f' doi:{refs[k]["doi"]}'
        if refs[k].get('pmid'):
            line += f' PMID:{refs[k]["pmid"]}'
        out.append(line)
    return out


REFNOTE = ('Rendered for review only. In the application, references are submitted in '
           'the Bibliography & References Cited attachment and do not count against the '
           '12-page Research Strategy limit.')


def main():
    src = open(MD, encoding='utf-8').read()
    body = build_body(src)
    body, cite_order, refs = resolve_citations(body, src)

    if cite_order:
        items = ''.join(f'<p>{html.escape(l)}</p>'
                        for l in reference_lines(cite_order, refs))
        body.append(
            '<div class="refs"><p class="sec">REFERENCES</p>'
            f'<p class="refnote">{html.escape(REFNOTE)}</p>' + items + '</div>')

    # keep each figure and its caption on the same page
    joined, i = [], 0
    while i < len(body):
        if (body[i].startswith('<div class="fig wrapme">')
                and i + 1 < len(body)
                and body[i + 1].startswith('<p class="caption">')):
            inner = body[i].replace('<div class="fig wrapme">', '', 1)[:-len('</div>')]
            joined.append(f'<div class="figwrap">{inner}{body[i+1]}</div>')
            i += 2
        elif (body[i].startswith(('<div class="fig">', '<table class="matrix">'))
                and i + 1 < len(body)
                and body[i + 1].startswith('<p class="caption">')):
            joined.append(f'<div class="figblock">{body[i]}{body[i+1]}</div>')
            i += 2
        else:
            joined.append(body[i])
            i += 1
    body = joined

    doc = ('<!doctype html><html><head><meta charset="utf-8">'
           f'<style>{CSS}</style></head><body>' + '\n'.join(body) + '</body></html>')
    open(OUT_HTML, 'w', encoding='utf-8').write(doc)
    print('wrote', OUT_HTML)

    # Remove the previous PDF first: if Chromium fails (or is killed early), an
    # existing file would otherwise be mistaken for a fresh render.
    if os.path.exists(OUT_PDF):
        os.remove(OUT_PDF)
    r = subprocess.run(['/opt/pw-browsers/chromium', '--headless', '--disable-gpu',
                        '--no-sandbox', '--no-pdf-header-footer',
                        f'--print-to-pdf={OUT_PDF}', f'file://{OUT_HTML}'],
                       capture_output=True, text=True, timeout=180)
    if not os.path.exists(OUT_PDF):
        print(r.stderr[-2000:]); sys.exit(1)
    print('wrote', OUT_PDF)

if __name__ == '__main__':
    main()
