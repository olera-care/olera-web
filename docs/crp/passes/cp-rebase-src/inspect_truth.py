# -*- coding: utf-8 -*-
"""Structural walk of the live .docx into docx_truth.json, the rebase's ground truth.

Captures paragraph runs with bold state, table cells (including cells whose content
sits inside a content control), floating image anchors and text-box captions, in
document order. Line breaks inside a run or paragraph are preserved as newlines
because Word tables use them for stacked cell labels.
"""
import docx, json, re
from docx.oxml.ns import qn
from docx.table import Table

d = docx.Document('live_cp.docx'); rels = d.part.rels
W, R, BR, TXB = qn('w:t'), qn('w:r'), qn('w:br'), qn('w:txbxContent')

def in_txbx(el):
    p = el.getparent()
    while p is not None:
        if p.tag == TXB: return True
        p = p.getparent()
    return False

def run_text(r):
    out = []
    for n in r.iter():
        if n.tag == W: out.append(n.text or '')
        elif n.tag == BR: out.append('\n')
    return ''.join(out)

def runs_of(p_el):
    out = []
    for r in p_el.iter(R):
        if in_txbx(r): continue
        txt = run_text(r)
        if not txt.strip('\n') and '\n' not in txt: continue
        rpr = r.find(qn('w:rPr'))
        bold = False
        if rpr is not None:
            b = rpr.find(qn('w:b'))
            bold = b is not None and b.get(qn('w:val')) not in ('0', 'false')
        out.append([txt, bold])
    return out

def para_text(p_el):
    out = []
    for n in p_el.iter():
        if in_txbx(n): continue
        if n.tag == W: out.append(n.text or '')
        elif n.tag == BR: out.append('\n')
    return ''.join(out)

def cell_runs(tc):
    """Runs of every paragraph in the cell, in order, with a newline run between
    paragraphs, so bold survives into the rebase instead of being guessed."""
    out = []
    def rec(el):
        for c in el.iterchildren():
            t = c.tag.split('}')[1]
            if t == 'sdt':
                for sc in c.iterchildren():
                    if sc.tag.split('}')[1] == 'sdtContent': rec(sc)
            elif t == 'p':
                rs = runs_of(c)
                if any(r[0].strip() for r in rs):
                    if out: out.append(['\n', False])
                    out.extend(rs)
            elif t == 'tbl':
                for tr in c.findall(qn('w:tr')):
                    for tc2 in tr.findall(qn('w:tc')): rec(tc2)
    rec(tc)
    return out

def imgs_of(el):
    out = []
    for blip in el.iter(qn('a:blip')):
        rid = blip.get(qn('r:embed'))
        if rid and rid in rels:
            n = rels[rid].target_ref.split('/')[-1]
            if n != 'image9.png': out.append(n)
    return out

items = []
def walk(el):
    for c in el.iterchildren():
        t = c.tag.split('}')[1]
        if t == 'sdt':
            for sc in c.iterchildren():
                if sc.tag.split('}')[1] == 'sdtContent': walk(sc)
        elif t == 'p':
            im = imgs_of(c)
            tb = []
            for tx in c.iter(TXB):
                s = ' '.join(x.text for x in tx.iter(W) if x.text).strip()
                if s: tb.append(s)
            txt = para_text(c)
            if not txt.strip() and not im and not tb: continue
            items.append({'k': 'p', 'runs': runs_of(c), 'text': txt, 'imgs': im, 'tb': tb})
        elif t == 'tbl':
            tt = Table(c, d); grid = []
            for row in tt.rows:
                seen = set(); rr = []
                for cell in row.cells:
                    if cell._tc in seen: continue
                    seen.add(cell._tc); rr.append(cell_runs(cell._tc))
                grid.append(rr)
            items.append({'k': 'tbl', 'grid': grid})
walk(d.element.body)
json.dump(items, open('docx_truth.json', 'w'), indent=1)

allt = ''.join(x.text or '' for x in d.element.body.iter(W))
cap = ''.join((i['text'] + ' '.join(i['tb'])) if i['k'] == 'p'
              else ' '.join(''.join(x[0] for x in c) for r in i['grid'] for c in r)
              for i in items)
j = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
ja, jc = j(allt), j(cap)
miss = [(i, ja[i:i+60]) for i in range(0, len(ja), 60) if ja[i:i+60] not in jc]
print(f'items {len(items)} | all w:t chars {len(ja)} | captured {len(jc)} | '
      f'unmatched 60-char windows {len(miss)} (boundary artifacts only)')
for i, s in miss: print('   ', i, s)
