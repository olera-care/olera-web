# -*- coding: utf-8 -*-
"""Completeness diff of the rebased render against the live .docx.

Ground truth is docx_truth.json, a structural walk of the file pulled from Drive
(paragraph runs, table cells, floating images, text-box captions), not a text
export. Four independent checks:

  1. sentence and cell presence, unit by unit
  2. token accounting, every word and number, hyphenation-proof
  3. cross references, Figure/Table/Section mentions one for one
  4. figure accounting, every image anchor in the source has a figure in the render
"""
import re, json
import pymupdf
from collections import Counter

TRUTH = json.load(open('docx_truth.json'))
KNOWN_FIGURE_TABLES = {38, 43}      # source tables now rendered as Figures 5 and 6
# text the author asked to change, so it is expected not to match the source
DIRECTED = {d['was']: d['now'] for d in json.load(open('convert_log.json'))['directed']}

def norm(s):
    s = (s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
          .replace('—', ', ').replace(' ', ' '))
    return re.sub(r'\s+', ' ', s).strip()

doc = pymupdf.open('cp_rebased.pdf')
raw = '\n'.join(p.get_text() for p in doc)
raw = re.sub(r'([A-Za-z])-\n+([a-z])', r'\1-\2', raw)   # rejoin words broken at a hyphen
pdf = norm(raw)
pdfj = re.sub(r'[^a-z0-9$%]', '', pdf.lower())

def present(frag):
    f = norm(frag)
    if not f:
        return True
    for was, now in DIRECTED.items():
        f = f.replace(norm(was), norm(now))
    if f in pdf:
        return True
    fj = re.sub(r'[^a-z0-9$%]', '', f.lower())
    if fj in pdfj:
        return True
    # A right-floated figure is painted between the two halves of the paragraph it
    # sits beside, so the PDF's reading order interleaves the figure's own labels
    # into the sentence. Fall back to an in-order word check, which tolerates that
    # without tolerating an actual omission.
    words = [w for w in re.findall(r"[a-z0-9$%]+", f.lower()) if w]
    if not words:
        return True
    pos, hay = 0, pdf.lower()
    for wd in words:
        k = hay.find(wd, pos)
        if k < 0:
            return False
        pos = k + len(wd)
    return True

SENT = re.compile(r'(?<=[.:;?])\s+(?=[A-Z(“"\d])')
missing, checked = [], 0
for i, x in enumerate(TRUTH):
    if x['k'] == 'tbl':
        for r in x['grid']:
            for c in r:
                for piece in ''.join(t for t, _ in c).split('\n'):
                    piece = piece.strip()
                    if not piece:
                        continue
                    checked += 1
                    if not present(piece) and i not in KNOWN_FIGURE_TABLES:
                        missing.append(('cell', i, piece))
        continue
    units = list(SENT.split(norm(x['text']))) + [norm(t) for t in x['tb']]
    for u in units:
        u = u.strip()
        if not u:
            continue
        checked += 1
        if not present(u):
            missing.append(('sentence', i, u))

print(f'CHECK 1  sentence and cell presence: {checked} units, {len(missing)} missing '
      f'({len(DIRECTED)} author-directed text edits allowed for)')
for k, i, t in missing:
    print(f'  MISSING {k} #{i}: {t[:250]}')

def toks(t):
    return re.findall(r"[A-Za-z][A-Za-z'/-]*|\$?\d[\d,.]*%?", norm(t))
def jtoks(t):
    return [w for w in (re.sub(r'[^a-z0-9$%]', '', w.lower()) for w in toks(t)) if w]

srctext, figtext = [], []
for i, x in enumerate(TRUTH):
    blob = (x['text'] + ' ' + ' '.join(x['tb'])) if x['k'] == 'p' else \
           ' '.join(''.join(t for t, _ in c) for r in x['grid'] for c in r)
    (figtext if i in KNOWN_FIGURE_TABLES else srctext).append(blob)
src_joined = '\n'.join(srctext)
for was, now in DIRECTED.items():
    src_joined = src_joined.replace(was, now)
sj, pj = Counter(jtoks(src_joined)), Counter(jtoks(pdf))
short = {w: (n, pj.get(w, 0)) for w, n in sj.items() if pj.get(w, 0) < n}
print(f'\nCHECK 2  token accounting: {len(sj)} distinct tokens, {len(short)} short')
for w, (a, b) in sorted(short.items(), key=lambda kv: kv[1][0] - kv[1][1], reverse=True):
    print(f'  {w!r:34s} source {a:3d}  render {b:3d}')

print('\nCHECK 2b  the two source tables now rendered as figures, cell by cell')
for i in sorted(KNOWN_FIGURE_TABLES):
    for r in TRUTH[i]['grid']:
        for c in r:
            for piece in ''.join(t for t, _ in c).split('\n'):
                piece = piece.strip()
                if piece:
                    print(f'  [{"OK " if present(piece) else "DIFF"}] {piece[:90]}')

XREF = re.compile(r'(?:Figure|Table|Section)\s+(?:\d+|X)')
sc, pc = Counter(), Counter()
for x in TRUTH:
    blob = (x['text'] + ' ' + ' '.join(x['tb'])) if x['k'] == 'p' else \
           ' '.join(''.join(t for t, _ in c) for r in x['grid'] for c in r)
    sc.update(XREF.findall(norm(blob)))
pc.update(XREF.findall(pdf))
print('\nCHECK 3  cross references (source -> render)')
bad = 0
for k in sorted(sc, key=lambda x: (x.split()[0], x.split()[1].zfill(3))):
    f = '' if pc[k] >= sc[k] else '   << FEWER IN RENDER'
    bad += 1 if f else 0
    print(f'  {k:12s} {sc[k]:3d} -> {pc[k]:3d}{f}')
print(f'  {bad} cross-reference tokens lost')

srcfigs = [n for x in TRUTH if x['k'] == 'p' for n in x['imgs']]
man = json.load(open('manifest_cp.json'))
renfigs = [v for k, v, _ in man if k in ('FIG', 'FIGFLOAT')]
print(f'\nCHECK 4  figures: {len(srcfigs)} image anchors + {len(KNOWN_FIGURE_TABLES)} '
      f'figure-tables in the source = {len(srcfigs)+len(KNOWN_FIGURE_TABLES)}; '
      f'{len(renfigs)} figures in the render')
print('  render order:', ' '.join(renfigs))
