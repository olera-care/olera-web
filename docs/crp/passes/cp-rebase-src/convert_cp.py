# -*- coding: utf-8 -*-
"""Mechanical rebase of the live Commercialization Plan into house style.

Source of truth is the live .docx pulled from Google Drive, walked structurally
(docx_truth.json) rather than through a text export, so bold runs, table shape,
image anchors and text-box captions are read from the file itself. Every body item
becomes exactly one output block, in source order. Nothing is reordered, merged,
summarised, rewritten or reconciled.

The only transformations:
  1. bold runs preserved verbatim from the source
  2. w:tbl -> <table class="dat">, with the source's own header row
  3. text-box captions emitted as caption paragraphs at their anchor
  4. rasters replaced by the house SVG that carries the same content
  5. em dash -> comma, the one standing house text rule, every instance logged
  6. a paragraph whose author started a second bold run-in label mid-paragraph is
     split at that label, matching how Word displays it
"""
import re, json, html

TRUTH = json.load(open('docx_truth.json'))
LOG = {'emdash': [], 'para_splits': [], 'caption_norm': [], 'dedup_caption': [],
       'superscript': [], 'typos': [], 'directed': [], 'notes': []}

def dedash(s, where):
    if '—' in s:
        for m in re.finditer(r'.{0,45}—.{0,45}', s):
            LOG['emdash'].append({'where': where, 'before': m.group(0),
                                  'after': m.group(0).replace('—', ', ')})
        s = s.replace('—', ', ')
    return s

# Unambiguous single-character typos in the live document, fixed mechanically.
TYPO_FIX = [('.2. New workforce supply', '2. New workforce supply',
             'stray leading period before list item 2 in the four-advantages table'),
            ('rel-evant', 'relevant',
             'stray hyphen inside a word, a soft-hyphen artifact')]

# Table 8's period cells lost the line break between the year label and the stage
# name when the section was pasted in, giving 'Year 2 (CRP)Validate free'.
GLUED = re.compile(r'(\((?:post-)?CRP\))(?=[A-Z])')

# Edits Logan asked for directly. Not rebase corrections: these change the live
# document's text, so they are logged separately from the mechanical fixes.
DIRECTED = [('VALUE OF THE CRP PROJECT, EXPECTED OUTCOMES, AND IMPACT - What does this CRP create?',
             'VALUE OF THE CRP PROJECT, EXPECTED OUTCOMES, AND IMPACT - What does CRP create?',
             'shortened so the section heading sets on one line')]

def fix_directed(c, where):
    for bad, good, note in DIRECTED:
        if bad in c:
            LOG['directed'].append({'where': where, 'was': bad, 'now': good, 'note': note})
            c = c.replace(bad, good)
    return c


def fix_typos(c, where):
    if GLUED.search(c):
        LOG['typos'].append({'where': where, 'was': c[:40], 'now': GLUED.sub(r'\1\\n', c)[:42],
                             'note': 'missing line break between the year label and the stage name'})
        c = GLUED.sub(r'\1\n', c)
    for bad, good, note in TYPO_FIX:
        if bad in c:
            LOG['typos'].append({'where': where, 'was': bad, 'now': good, 'note': note})
            c = c.replace(bad, good)
    return c


def clean(s, where=''):
    s = (s.replace('’', "'").replace('‘', "'")
          .replace('“', '"').replace('”', '"'))
    return fix_directed(fix_typos(dedash(s, where), where), where)

CITE = re.compile(r'(?<=[a-zA-Z0-9%)])\.\s?(\d{1,2}(?:[,\u2013-]\s?\d{1,2})*)(?=\s+[A-Z(]|\s*\$|<|$)')
# in Table 6 the reference numbers are glued straight onto the preceding word
CITE_GLUED = re.compile(r'(?<=[a-z])(\d{1,2}(?:[,\u2013-]\d{1,2})*)(?![\w<])')

def supercite(h, where):
    """Reference markers lost their superscript when the text was pasted into the
    live document, so they read as sentence text ('in 2024.26,27 The problem').
    Restore the formatting. Purely presentational: the digits are untouched."""
    def rep(m):
        LOG['superscript'].append({'where': where, 'marker': m.group(1)})
        return '.<sup>' + m.group(1) + '</sup>'
    return CITE.sub(rep, h)


def supercite_glued(h, where):
    def rep(m):
        LOG['superscript'].append({'where': where, 'marker': m.group(1), 'glued': True})
        return '<sup>' + m.group(1) + '</sup>'
    return CITE_GLUED.sub(rep, h)


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

HEADIDX = set()
for i, x in enumerate(TRUTH):
    if x['k'] != 'p':
        continue
    t = x['text'].strip()
    if len(t.split()) <= 22 and re.match(r'^(\d+\.\s*)?[A-Z][A-Z0-9 ,&/]{5,}', t):
        HEADIDX.add(i)
assert len(HEADIDX) == 9, f'expected 9 section headings, found {sorted(HEADIDX)}'

# raster -> house figure key, read from the source's own image anchors
IMGMAP = {'image11.png': 'FIG1', 'image20.png': 'FIG2', 'image18.png': 'FIG3',
          'image16.png': 'FIG4', 'image6.png': 'FIG7',  'image7.png': 'FIG8',
          'image4.png': 'FIG9A', 'image13.png': 'FIG10B', 'image12.png': 'FIGXPROC',
          'image21.png': 'FIGXORG', 'image1.png': 'FIG11', 'image3.png': 'CHAIN',
          'image2.png': 'FIG12', 'image5.png': 'FIG13'}
# Word floats these two above their anchoring paragraph
BEFORE_ANCHOR = {'image18.png'}
# The source anchors exactly these three with wrapSquare, right of the column,
# so text runs beside them. Everything else is wrapTopAndBottom or inline.
FLOAT_RIGHT = {'image11.png', 'image13.png', 'image21.png'}
# source tables that hold figure content, replaced by the house figure
TABLE_FIGS = {38: 'FIG5', 43: 'FIG6'}
# the one source table whose first row is content, not a header
NO_HEADER = {57}
# The five remaining risks. The prose introduces them as a sequence, the next
# paragraph says the order matters, and Figure 3 numbers them 1 to 5, so they
# are set as a numbered list rather than five running paragraphs. Text unchanged.
RISKS = [4, 5, 6, 7, 8]

CAPLEAD = re.compile(r'^((?:Figure|Table)\s+(?:\d+|X)\s*[.:])\s*')


def strip_inline_caption(x, where):
    """The live document carries each floating caption twice: once inside the
    figure's text box and once as a leading or trailing run of the anchoring
    paragraph. Rendering both duplicates it. Drop the inline copy, keep the
    text-box copy, and record which end it was on so the caption can be placed
    on the same side of the paragraph the author put it."""
    def key(t):
        return re.sub(r'\s+', ' ', t).strip().rstrip('.').lower()
    tbkeys = {key(t) for t in x['tb']}
    if not tbkeys or not x['runs']:
        return x['runs'], None
    runs, side = list(x['runs']), None
    if key(runs[0][0]) in tbkeys:
        runs = runs[1:]; side = 'before'
        LOG['dedup_caption'].append({'where': where, 'side': 'leading',
                                     'text': x['runs'][0][0][:70]})
    elif key(runs[-1][0]) in tbkeys:
        runs = runs[:-1]; side = 'after'
        LOG['dedup_caption'].append({'where': where, 'side': 'trailing',
                                     'text': x['runs'][-1][0][:70]})
    return runs, side

def runs_html(runs, fallback, where):
    if not runs:
        return esc(clean(fallback, where))
    out = []
    for txt, bold in runs:
        t = esc(clean(txt, where))
        out.append(f'<b>{t}</b>' if bold else t)
    return ''.join(out)

def split_runins(runs):
    """Word shows a second bold run-in label as a new paragraph. Split there.

    A split point is a bold run that ends in a period and follows text that
    already ended a sentence. A short bold emphasis such as 'Aim 1' does not
    end in a period and is left inline.
    """
    groups, cur = [], []
    for k, (txt, bold) in enumerate(runs):
        if (k > 0 and bold and txt.rstrip().endswith('.')
                and len(txt.split()) <= 8
                and cur and cur[-1][0].rstrip().endswith(('.', ':', '?'))):
            groups.append(cur); cur = []
        cur.append([txt, bold])
    if cur:
        groups.append(cur)
    return groups

def cell_html(runs, where):
    """Reproduce the cell's own bold runs. No guessing about which part is a label."""
    txt = ''.join(r[0] for r in runs).strip()
    if not txt:
        return ''
    fixed = clean(txt, where)
    if fixed != clean(''.join(r[0] for r in runs), where).strip():
        pass
    out, seen = [], 0
    for t, bold in runs:
        t = clean(t, where)
        e = esc(t).replace('\n', '<br>')
        out.append(f'<b>{e}</b>' if bold else e)
    h = ''.join(out).strip()
    h = re.sub(r'^(<br>)+|(<br>)+$', '', h)
    return supercite_glued(h, where)


def mk_table(grid, no_header):
    ncol = max(len(r) for r in grid)
    grid = [r + [[]] * (ncol - len(r)) for r in grid]
    w = 'width:%.4f%%' % (100.0 / ncol)
    cls = 'dat keep' if len(grid) <= 5 else 'dat'
    out = [f'<table class="{cls}">',
           '<colgroup>' + ''.join(f'<col style="{w}">' for _ in range(ncol)) + '</colgroup>']
    body = grid
    if not no_header:
        head, body = grid[0], grid[1:]
        out.append('<thead><tr>' + ''.join(
            f'<th>{cell_html(c, "table head")}</th>' for c in head) + '</tr></thead>')
    out.append('<tbody>')
    for r in body:
        cells = []
        for c in r:
            cells.append(f'<td>{cell_html(c, "table cell")}</td>')
        out.append('<tr>' + ''.join(cells) + '</tr>')
    out.append('</tbody></table>')
    return '\n'.join(out), ncol, len(body)


def build(figmap, figwidth):
    parts, manifest = [], []
    used = set()

    def clearfix():
        if parts and 'figwrap' in ''.join(parts[-6:]) and not parts[-1].startswith(
                '<p class="clearfix"'):
            parts.append('<p class="clearfix"></p>')

    def emit_fig(name, where):
        clearfix()
        key = IMGMAP[name]
        used.add(key)
        parts.append(figmap[key])
        manifest.append(('FIG', key, where))

    def float_caption(text, where):
        t = re.sub(r'\s+', ' ', text).strip()
        m = CAPLEAD.match(t)
        if not m:
            return f'<p class="caption">{esc(clean(t, where))}</p>'
        manifest.append(('cap', t[:70], where))
        return (f'<p class="caption"><b>{esc(m.group(1))}</b> '
                f'{esc(clean(t[m.end():], where))}</p>')

    def emit_caption(text, where):
        t = re.sub(r'\s+', ' ', text).strip()
        m = CAPLEAD.match(t)
        if not m:
            parts.append(f'<p class="caption">{esc(clean(t, where))}</p>')
        else:
            if t[len(m.group(1)):len(m.group(1)) + 2] == '  ':
                LOG['caption_norm'].append(t[:60])
            rest = t[m.end():]
            parts.append(f'<p class="caption"><b>{esc(m.group(1))}</b> '
                         f'{esc(clean(rest, where))}</p>')
        manifest.append(('cap', t[:70], where))

    pending_risks = []

    def flush_risks():
        if not pending_risks:
            return
        lis = []
        for rs, w in pending_risks:
            lead, bold = rs[0]
            body = ''.join(t for t, _ in rs[1:])
            lis.append(f'<li><b class="rk">{esc(clean(lead.strip(), w))}</b> '
                       f'{esc(clean(body.strip(), w))}</li>')
            manifest.append(('risk', lead.strip(), w))
        parts.append('<ol class="risks">' + ''.join(lis) + '</ol>')
        pending_risks.clear()

    for i, x in enumerate(TRUTH):
        where = f'#{i}'
        if i not in RISKS:
            flush_risks()
        if x['k'] == 'tbl':
            clearfix()
            if i in TABLE_FIGS:
                key = TABLE_FIGS[i]
                used.add(key)
                parts.append(figmap[key])
                manifest.append(('FIG', key, where))
                continue
            h, nc, nr = mk_table(x['grid'], i in NO_HEADER)
            parts.append(h)
            manifest.append(('table', f'{nr}x{nc}', where))
            continue

        if i in RISKS:
            pending_risks.append((x['runs'], where))
            continue

        runs, side = strip_inline_caption(x, where)
        floats = [n for n in x['imgs'] if n in FLOAT_RIGHT]
        rest = [n for n in x['imgs'] if n not in FLOAT_RIGHT]
        pre = [n for n in rest if n in BEFORE_ANCHOR or side == 'before']
        post = [n for n in rest if n not in pre]

        # a float belongs before the text it wraps, unless the anchoring
        # paragraph is itself a caption, in which case it would come between a
        # table and its caption
        text_is_caption = bool(x['text'].strip()) and CAPLEAD.match(x['text'].strip())
        # the float owns the last caption on the item; the rest stay in place
        tb = list(x['tb'])
        float_caps = [tb.pop() for _ in floats] if floats else []

        def emit_floats():
            for n in floats:
                key = IMGMAP[n]
                used.add(key)
                cap = float_caption(float_caps.pop(0), where) if float_caps else ''
                w = figwidth[key]
                parts.append(f'<div class="figwrap" style="width:{w}in">'
                             f'{figmap[key]}{cap}</div>')
                manifest.append(('FIGFLOAT', key, where))

        if floats and not text_is_caption:
            emit_floats()
        for n in pre:
            emit_fig(n, where)
        for cap in (tb if pre and not post else []):
            emit_caption(cap, where)

        text = ''.join(r[0] for r in runs).strip() if x['runs'] else x['text'].strip()
        if text:
            if i in HEADIDX:
                clearfix()
                parts.append(f'<h1 class="sechead">{esc(clean(text, where))}</h1>')
                manifest.append(('head', text, where))
            elif CAPLEAD.match(text):
                emit_caption(text, where)
            else:
                for g in split_runins(runs) if runs else [None]:
                    body = runs_html(g, text, where)
                    body = body.strip()
                    if not body:
                        continue
                    body = supercite(body, where)
                    parts.append(f'<p class="sec">{body}</p>')
                    manifest.append(('para', re.sub("<[^>]+>", "", body)[:60], where))
                if runs and len(split_runins(runs)) > 1:
                    LOG['para_splits'].append(where)

        for n in post:
            emit_fig(n, where)
        if post or not pre:
            for cap in tb:
                emit_caption(cap, where)
        if floats and text_is_caption:
            emit_floats()

    flush_risks()
    missing = set(figmap) - used
    assert not missing, f'figures never placed: {missing}'
    return '\n\n'.join(bind_captions(parts)), manifest


def bind_captions(parts):
    """Bind every figure and every short table to the caption that follows it.

    A caption is useless on the page after its figure, and Chromium honours
    break-inside on a wrapper far more reliably than break-before on a sibling.
    Long tables are left alone: they are meant to break, and their header row
    repeats."""
    out, i = [], 0
    while i < len(parts):
        b = parts[i]
        nxt = parts[i + 1] if i + 1 < len(parts) else ''
        is_cap = nxt.startswith('<p class="caption"')
        if b.startswith('<div class="fig">') and is_cap:
            out.append(f'<div class="figblk">{b}{nxt}</div>'); i += 2; continue
        if b.startswith('<table class="dat keep">') and is_cap:
            out.append(f'<div class="figblk">{b}{nxt}</div>'); i += 2; continue
        out.append(b); i += 1
    return out
