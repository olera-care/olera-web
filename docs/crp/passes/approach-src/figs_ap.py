# -*- coding: utf-8 -*-
"""Approach timetable, house vector system. 100 svg units = 1 inch.

Drawn around the actual operating waves rather than bars that cover whole
years: work periods as bars, market waves as flags on the quarter they open,
milestones as ticks on the quarter they fall at the end of, and the three
GO/NO-GO gates as diamonds at the close of their quarter.
"""
from figs_son import TEAL, GREEN, GFILL, GREY, RULE, INK, _wrap, _t
import figbase as B

PALE = "#f4f7f6"
BAND = "#eaf2ee"

# (label, kind, spec, note). Quarters are 1-indexed and inclusive.
#   bar   (first, last)   a work period
#   open  q               markets opening at the start of q
#   gate  q               a GO/NO-GO at the end of q
# `note` is optional grey text set after the bar, in the row's unused quarters.
#
# Timing follows the Research Strategy of 2026-08-31: Aim 2 runs nine months in
# eight markets (Q5 to Q7) with ascertainment and analysis in Q8; Aim 3 runs
# another nine months in eight new markets (Q9 to Q11) opened in two paid waves,
# with the post-CRP evidence work beginning at the nine-month mark.
ROWS = [
    ("1.1 Care Establishment Pathway Model",   'bar',  (1, 2),  None),
    ("1.4 Caregiver Staffing infrastructure",  'bar',  (1, 3),  None),
    ("1.2 Eldercare AI administration agents", 'bar',  (2, 3),  None),
    ("1.3 Field learning and closed-loop data",'bar',  (2, 3),  None),
    ("Integrated verification in staging",     'bar',  (3, 3),  None),
    ("1.5 Participant recruitment and setup",  'bar',  (3, 3),  None),
    ("1.5 Usability and acceptance testing",   'bar',  (4, 4),  None),
    ("GO/NO-GO 1",                             'gate', 4,       None),
    ("2.1 CareNavigator family episodes",      'bar',  (5, 7),  "about 440 family episodes"),
    ("2.2 Caregiver Staffing free pilots",     'bar',  (5, 7),  "15 agencies, 150 placements"),
    ("2.3 Post-use mixed-methods evaluation",  'bar',  (7, 8),  None),
    ("Outcome ascertainment and analysis",     'bar',  (8, 8),  None),
    ("GO/NO-GO 2",                             'gate', 8,       None),
    ("3.1 Paid replication, eight new markets",'bar',  (9, 11), None),
    ("3.2 Post-CRP evidence package",          'bar',  (12, 12), None),
    ("FINAL GO/NO-GO",                         'gate', 12,      None),
]
OPENS = {8: (5,), 13: (9, 10)}     # row index -> quarters at which markets open


def _diamond(cx, cy, r, fill):
    return (f'<path d="M{cx} {cy-r} L{cx+r} {cy} L{cx} {cy+r} L{cx-r} {cy} z" '
            f'fill="{fill}"/>')


def _flag(x, cy, h, fill="#ffffff", stroke=TEAL):
    """A right-pointing flag: markets opening at this quarter.

    Drawn white with a keyline, because every flag sits on top of a bar and a
    solid one in the palette disappears into it."""
    return (f'<g fill="{fill}" stroke="{stroke}" stroke-width="0.9" '
            f'stroke-linejoin="round">'
            f'<rect x="{x}" y="{cy-h/2}" width="2.2" height="{h}"/>'
            f'<path d="M{x+2.2} {cy-h/2} L{x+9.8} {cy} L{x+2.2} {cy+h/2} z"/></g>')


def timetable(_grid=None):
    S = B.BODY
    W = 730
    LABW = 250
    NQ = 12
    cw = (W - LABW - 12) / NQ
    x0 = 6 + LABW
    rh = 13.0
    yearh, headh = 14, 14
    top = 6 + yearh + headh + 3
    b = []

    for i, yr in enumerate(("YEAR 1", "YEAR 2", "YEAR 3")):
        bx = x0 + i * 4 * cw
        b.append(f'<rect x="{bx+1}" y="6" width="{4*cw-2}" height="{yearh}" rx="2.5" '
                 f'fill="{TEAL}"/>')
        b.append(_t(bx + 2 * cw, 6 + yearh - 4, yr, S, "#ffffff", weight="bold", ls=0.7))
    for q in range(NQ):
        b.append(_t(x0 + q * cw + cw / 2, 6 + yearh + headh - 4, f"Q{q+1}", S, GREY,
                    weight="bold"))

    for r, (label, kind, spec, note) in enumerate(ROWS):
        y = top + r * rh
        cy = y + rh / 2
        gate = kind == 'gate'
        if gate:
            b.append(f'<rect x="6" y="{y}" width="{W-12}" height="{rh}" fill="{BAND}"/>')
        elif r % 2 == 0:
            b.append(f'<rect x="6" y="{y}" width="{W-12}" height="{rh}" fill="{PALE}"/>')
        b.append(_t(12, y + rh - 4.2, label, S, GREEN if gate else INK, anchor="start",
                    weight="bold" if gate else "normal"))

        if gate:
            b.append(_diamond(x0 + spec * cw, cy, 5.0, GREEN))
            continue

        first, last = spec
        bx = x0 + (first - 1) * cw + 3
        bw = (last - first + 1) * cw - 6
        b.append(f'<rect x="{bx}" y="{y+3.2}" width="{bw}" height="{rh-6.4}" '
                 f'rx="2.8" fill="{TEAL}" opacity="0.88"/>')
        for q in OPENS.get(r, ()):
            b.append(_flag(x0 + (q - 1) * cw + 5, cy, 9.4))
        if note:
            b.append(_t(bx + bw + 9, y + rh - 4.2, note, S, GREY, anchor="start"))

    gy = top + len(ROWS) * rh
    b.append(f'<line x1="6" y1="{gy+1}" x2="{W-6}" y2="{gy+1}" stroke="{RULE}" '
             f'stroke-width="0.8"/>')
    ly = gy + 14
    lx = 12
    b.append(f'<rect x="{lx}" y="{ly-5}" width="18" height="6" rx="2" fill="{TEAL}" '
             f'opacity="0.88"/>')
    b.append(_t(lx + 24, ly, "work period", S, GREY, anchor="start"))
    lx += 24 + B.w("work period", S) + 26
    b.append(f'<rect x="{lx-3}" y="{ly-9}" width="19" height="13" rx="2.8" '
             f'fill="{TEAL}" opacity="0.88"/>')
    b.append(_flag(lx + 1.5, ly - 2.6, 9.4))
    b.append(_t(lx + 22, ly, "markets open", S, GREY, anchor="start"))
    lx += 22 + B.w("markets open", S) + 26
    b.append(_diamond(lx + 5, ly - 2.4, 5.0, GREEN))
    b.append(_t(lx + 14, ly, "GO/NO-GO gate", S, GREY, anchor="start"))

    H = ly + 10
    for q in range(NQ + 1):
        x = x0 + q * cw
        b.append(f'<line x1="{x}" y1="{6+yearh+headh}" x2="{x}" y2="{gy}" '
                 f'stroke="{RULE}" stroke-width="0.6" opacity="0.85"/>')
    b.append(f'<line x1="6" y1="{top-2}" x2="{W-6}" y2="{top-2}" stroke="{TEAL}" '
             f'stroke-width="1"/>')
    return _wrap(W / 100, H / 100, "".join(b))
