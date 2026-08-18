#!/usr/bin/env python3
"""Render docs/crp/research-strategy.md to house-style HTML/PDF.

House style per docs/crp/README.md section 6 (ratified 2026-08-17), measured from
the Drive RS docx. The markdown is a text export that lost run formatting, so this
script reapplies it by the documented conventions.
"""
import base64, html, os, re, subprocess, sys

CRP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # docs/crp
MD = os.path.join(CRP, 'research-strategy.md')
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
p.caption { font-size: 9pt; text-align: left; margin: 2pt 0 6pt 0; }
div.fig { margin: 5pt 0 2pt 0; text-align: center; }
div.fig img, div.fig svg { max-width: 100%; height: auto; }
div.figblock { break-inside: avoid; page-break-inside: avoid; }
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
    'The unmet need.', 'The product and the business model.', 'The market.',
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
IU_COLON_LEADS = [  # italic + underlined through the colon
    'Family-side navigation:', 'Referral marketplaces:', 'Caregiver marketplaces:',
    'Existing alternatives for providers:',
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

def render_caption(t):
    # t like "Figure 1: caption text" or "Table 1: ..."
    m = re.match(r'((?:Figure|Table) [A-Z0-9]+:)\s*(.*)', t, re.S)
    if m:
        return f'<p class="caption"><b>{esc(m.group(1))}</b> {esc(m.group(2))}</p>'
    return f'<p class="caption">{esc(t)}</p>'

def main():
    src = open(MD, encoding='utf-8').read()
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
        m = re.match(r'!\[[^\]]*\]\(([^)]+)\)', line)
        if m:
            body.append(f'<div class="fig">{img_tag(m.group(1))}</div>')
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

    # keep each figure and its caption on the same page
    joined, i = [], 0
    while i < len(body):
        if (body[i].startswith('<div class="fig">') and i + 1 < len(body)
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

    r = subprocess.run(['/opt/pw-browsers/chromium', '--headless', '--disable-gpu',
                        '--no-sandbox', '--no-pdf-header-footer',
                        f'--print-to-pdf={OUT_PDF}', f'file://{OUT_HTML}'],
                       capture_output=True, text=True, timeout=120)
    if not os.path.exists(OUT_PDF):
        print(r.stderr[-2000:]); sys.exit(1)
    print('wrote', OUT_PDF)

if __name__ == '__main__':
    main()
