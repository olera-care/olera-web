# -*- coding: utf-8 -*-
"""Project Management Plan figure. Same grid and vocabulary as Sections 1 to 9."""
from figs_son import TEAL, GFILL, GREY, RULE, INK, _wrap, _t

def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.4, rx=3):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"/>')


def fig13():
    """7.2 x 1.34in. Five stages and the four gates between them.

    The table carries what happens in each year; this carries what has to be
    decided between them, which is the part a management plan is scored on.
    The CRP boundary lands on gate 3, where financing is meant to close."""
    W, H = 720, 134
    BW, GAP, X0 = 118, 26, 12
    def bx(i): return X0 + i * (BW + GAP)
    def gapx(i): return bx(i) + BW + GAP / 2
    b = []

    b.append(_t((bx(0) + bx(2) + BW) / 2, 14, "CRP PERIOD", 9.2, GREY, weight="bold", ls=1.1))
    b.append(_t((bx(3) + bx(4) + BW) / 2, 14, "POST-CRP", 9.2, GREY, weight="bold", ls=1.1))

    stages = [("Year 1", "BUILD", GFILL), ("Year 2", "VALIDATE FREE", GFILL),
              ("Year 3", "MONETIZE", GFILL), ("Year 4", "EXPAND", "#ffffff"),
              ("Year 5", "SCALE", "#ffffff")]
    for i, (yr, name, fill) in enumerate(stages):
        b.append(_box(bx(i), 26, BW, 44, fill))
        b.append(_t(bx(i) + BW / 2, 42, yr, 9.2, GREY))
        b.append(_t(bx(i) + BW / 2, 58, name, 11.0, TEAL, weight="bold", ls=0.6))

    gates = [("Readiness", "confirmed"), ("Configurations", "advance to paid"),
             ("Replication markets", "and financing close"), ("Expansion", "pace set")]
    for i, (l1, l2) in enumerate(gates):
        x = gapx(i)
        b.append(f'<path d="M{x} 41 l7 7 l-7 7 l-7 -7 z" fill="#ffffff" stroke="{TEAL}" '
                 f'stroke-width="1.3"/>')
        b.append(_t(x, 52.5, str(i + 1), 8.6, TEAL, weight="bold"))
        b.append(_t(x, 90, l1, 9.2, TEAL, weight="bold"))
        b.append(_t(x, 101, l2, 9.2, GREY))

    xc = gapx(2)
    for y1, y2 in ((18, 38), (72, 82), (106, 116)):
        b.append(f'<line x1="{xc}" y1="{y1}" x2="{xc}" y2="{y2}" stroke="{GREY}" '
                 f'stroke-width="1.1" stroke-dasharray="4 3"/>')
    b.append(_t(xc, 126, "CRP RUNWAY ENDS", 9.0, GREY, weight="bold", ls=0.9))
    return _wrap(W / 100, H / 100, "".join(b))
