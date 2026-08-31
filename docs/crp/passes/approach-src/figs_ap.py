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

# (label, kind, spec). Quarters are 1-indexed and inclusive.
#   bar   (first, last)          a work period
#   bar   (first, last, tick)    a work period with a milestone at the end of `tick`
#   wave  q                      a set of markets opening at the start of q
#   gate  q                      a GO/NO-GO at the end of q
ROWS = [
    ("1.1 Care Establishment Model",            'bar',  (1, 2)),
    ("1.4 Staffing infrastructure",             'bar',  (1, 3)),
    ("1.2 Bounded agent execution",             'bar',  (2, 3)),
    ("1.3 Field learning",                      'bar',  (2, 3)),
    ("Integrated verification and remediation", 'bar',  (3, 3)),
    ("1.5 Recruitment and preparation",         'bar',  (3, 3)),
    ("1.5 Controlled stakeholder testing",      'bar',  (4, 4)),
    ("GO/NO-GO 1",                              'gate', 4),
    ("2.1 Wave 1 markets open, four markets",   'wave', 5),
    ("2.1 Wave 2 markets open, four markets",   'wave', 6),
    ("2.2 Enrollment and execution",            'bar',  (5, 7, 7)),
    ("2.4 Post-use evaluation",                 'bar',  (6, 8)),
    ("2.3 Day-90 ascertainment and analysis",   'bar',  (8, 8)),
    ("GO/NO-GO 2",                              'gate', 8),
    ("3.2 Paid Wave 1 opens, four new markets", 'wave', 9),
    ("3.2 Measure and refine the playbook",     'bar',  (9, 10)),
    ("3.2 Paid Wave 2 opens, four new markets", 'wave', 10),
    ("3.3 Commercial economics",                'bar',  (9, 12)),
    ("3.4 Institutional evidence package",      'bar',  (10, 12)),
    ("3.3 Independent financial validation",    'bar',  (12, 12)),
    ("FINAL GO/NO-GO",                          'gate', 12),
]


def _diamond(cx, cy, r, fill):
    return (f'<path d="M{cx} {cy-r} L{cx+r} {cy} L{cx} {cy+r} L{cx-r} {cy} z" '
            f'fill="{fill}"/>')


def _flag(x, cy, h, fill):
    """A right-pointing triangle on a stem: a wave opening at this quarter."""
    return (f'<rect x="{x}" y="{cy-h/2}" width="1.8" height="{h}" fill="{fill}"/>'
            f'<path d="M{x+1.8} {cy-h/2} L{x+9.4} {cy} L{x+1.8} {cy+h/2} z" fill="{fill}"/>')


def timetable(_grid=None):
    S = B.BODY
    W = 730
    LABW = 214
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

    for r, (label, kind, spec) in enumerate(ROWS):
        y = top + r * rh
        cy = y + rh / 2
        gate = kind == 'gate'
        if gate:
            b.append(f'<rect x="6" y="{y}" width="{W-12}" height="{rh}" fill="{BAND}"/>')
        elif r % 2 == 0:
            b.append(f'<rect x="6" y="{y}" width="{W-12}" height="{rh}" fill="{PALE}"/>')
        b.append(_t(12, y + rh - 4.2, label, S, GREEN if gate else INK, anchor="start",
                    weight="bold" if gate else "normal"))

        if kind == 'gate':
            b.append(_diamond(x0 + spec * cw, cy, 5.0, GREEN))
        elif kind == 'wave':
            b.append(_flag(x0 + (spec - 1) * cw + 4, cy, 9.0, TEAL))
        else:
            first, last = spec[0], spec[1]
            bx = x0 + (first - 1) * cw + 3
            bw = (last - first + 1) * cw - 6
            b.append(f'<rect x="{bx}" y="{y+3.2}" width="{bw}" height="{rh-6.4}" '
                     f'rx="2.8" fill="{TEAL}" opacity="0.88"/>')
            if len(spec) == 3:
                tx = x0 + spec[2] * cw
                # a white keyline so the milestone reads against the bar it sits on
                b.append(f'<rect x="{tx-2.1}" y="{y+1.2}" width="4.2" '
                         f'height="{rh-2.4}" rx="1.2" fill="#ffffff"/>')
                b.append(f'<rect x="{tx-1.4}" y="{y+1.9}" width="2.8" '
                         f'height="{rh-3.8}" rx="1" fill="{GREEN}"/>')

    gy = top + len(ROWS) * rh
    b.append(f'<line x1="6" y1="{gy+1}" x2="{W-6}" y2="{gy+1}" stroke="{RULE}" '
             f'stroke-width="0.8"/>')
    ly = gy + 14
    lx = 12
    b.append(f'<rect x="{lx}" y="{ly-5}" width="18" height="6" rx="2" fill="{TEAL}" '
             f'opacity="0.88"/>')
    b.append(_t(lx + 24, ly, "work period", S, GREY, anchor="start"))
    lx += 24 + B.w("work period", S) + 22
    b.append(_flag(lx, ly - 2.4, 9.0, TEAL))
    b.append(_t(lx + 16, ly, "four markets open", S, GREY, anchor="start"))
    lx += 16 + B.w("four markets open", S) + 22
    b.append(f'<rect x="{lx}" y="{ly-8}" width="3.2" height="11" rx="1" fill="{GREEN}"/>')
    b.append(_t(lx + 10, ly, "enrollment closes", S, GREY, anchor="start"))
    lx += 10 + B.w("enrollment closes", S) + 22
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
