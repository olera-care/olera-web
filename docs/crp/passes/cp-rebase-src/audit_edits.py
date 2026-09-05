# -*- coding: utf-8 -*-
"""Prove the compression deleted rather than rewrote.

For every replaced item, split both the source and the replacement into sentences
and classify each replacement sentence as verbatim, a clean truncation of a source
sentence, or an edit. Edits are listed so they can be justified one by one.
"""
import json, re, difflib
import edits as E

TRUTH = json.load(open('docx_truth.json'))
SENT = re.compile(r'(?<=[.:;?])\s+(?=[A-Z(“"\d*])')

def norm(s):
    s = re.sub(r'\*\*', '', s)
    s = s.replace('’', "'").replace('—', ', ')
    return re.sub(r'\s+', ' ', s).strip()

def sents(s):
    return [x.strip() for x in SENT.split(norm(s)) if x.strip()]

def report():
    kept = dropped = edited = 0
    notes = []
    for i, new in sorted(E.REPLACE.items()):
        if TRUTH[i]['k'] != 'p':
            continue
        src = sents(TRUTH[i]['text'])
        out = sents(new)
        srcset = list(src)
        for o in out:
            if o in srcset:
                kept += 1; srcset.remove(o); continue
            hit = next((s for s in srcset if s.startswith(o.rstrip('.')) or o.startswith(s.rstrip('.'))), None)
            if hit:
                kept += 1; srcset.remove(hit)
                notes.append(('truncated', i, o[:70]))
                continue
            near = difflib.get_close_matches(o, srcset, n=1, cutoff=0.72)
            if near:
                srcset.remove(near[0]); edited += 1
                notes.append(('EDITED', i, o[:96], near[0][:96]))
            else:
                edited += 1
                notes.append(('NEW', i, o[:96], ''))
        dropped += len(srcset)
    return kept, dropped, edited, notes

if __name__ == '__main__':
    k, d, e, notes = report()
    print(f'replacement sentences kept verbatim or truncated: {k}')
    print(f'source sentences deleted: {d}')
    print(f'sentences edited or new: {e}')
    for n in notes:
        if n[0] == 'truncated':
            print(f'  trunc  #{n[1]}: {n[2]}')
    print()
    for n in notes:
        if n[0] != 'truncated':
            print(f'  {n[0]:6s} #{n[1]}')
            print(f'      now: {n[2]}')
            if n[3]: print(f'      was: {n[3]}')
