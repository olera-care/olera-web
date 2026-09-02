# -*- coding: utf-8 -*-
"""Figure 2: the eighteen weeks as a Gantt. 100 svg units = 1 inch.

Rows are workstreams rather than weeks, because the point of the chart is what
runs at the same time as what. Bars carry the week span; diamonds mark the
reviews and the two deadlines; the two holiday weeks are shaded columns.
"""
from figs_son import TEAL, GREEN, GFILL, GREY, RULE, INK, _wrap, _t
import figbase as B

STEEL = "#3d6b62"
AMBER = "#b8860b"
HOLIDAY = "#f2f2f0"
NWEEK = 18

# label, first week, last week, colour
BARS = [
    ("Provider sales and delivery",              2, 16, GREEN),
    ("CareNavigator first generation",           1, 10, TEAL),
    ("Phase IIB family study, n=200",            7, 15, TEAL),
    ("Institutional-buyer discovery",            3, 11, STEEL),
    ("Letter of intent pursuit",                 8, 15, AMBER),
    ("Independent financing, $4M test",          6, 15, AMBER),
    ("Application drafting",                    11, 16, GREY),
    ("Buffer and submission",                   17, 18, GREY),
]
# week -> (label, is a hard deadline)
GATES = {1: ("Baseline", False), 5: ("Month 1", False), 9: ("Month 2", False),
         16: ("Complete", True), 18: ("Submit", True)}
FLAGS = {3: "Nashville", 12: "HLTH"}
HOLIDAYS = (13, 17)
MONTHS = [("September", 1, 5), ("October", 6, 9), ("November", 10, 13),
          ("December", 14, 17), ("Jan", 18, 18)]


def gantt():
    W = 730
    S, LB = B.BODY, B.LABEL
    LEFT = 222                      # label gutter
    right = W - 10
    cw = (right - LEFT) / NWEEK     # one week column
    b = []

    def x(week, edge=0.0):
        return LEFT + (week - 1 + edge) * cw

    y = 6
    # ---------- month band
    for name, a, z in MONTHS:
        x0, x1 = x(a), x(z, 1)
        b.append(f'<rect x="{x0}" y="{y}" width="{x1-x0-1.5}" height="15" rx="2.5" '
                 f'fill="{GFILL}" stroke="{RULE}" stroke-width="0.9"/>')
        lns, sz = B.fit(name, x1 - x0 - 9, S, "bold")
        b.append(_t((x0 + x1 - 1.5) / 2, y + 10.6, lns[0], sz, TEAL, weight="bold"))
    b.append(_t(LEFT - 8, y + 10.6, "2026", S, GREY, anchor="end", weight="bold"))
    y += 17

    # ---------- week numbers
    for wk in range(1, NWEEK + 1):
        b.append(_t(x(wk, 0.5), y + 9, str(wk), S, GREY))
    b.append(_t(LEFT - 8, y + 9, "Week", S, GREY, anchor="end"))
    y += 13

    top = y
    rowh = 25
    body_h = rowh * len(BARS)

    # ---------- holiday columns, behind everything
    for wk in HOLIDAYS:
        b.append(f'<rect x="{x(wk)}" y="{top}" width="{cw}" height="{body_h}" '
                 f'fill="{HOLIDAY}"/>')
    # ---------- week gridlines
    for wk in range(1, NWEEK + 2):
        b.append(f'<line x1="{x(wk)}" y1="{top}" x2="{x(wk)}" y2="{top + body_h}" '
                 f'stroke="{RULE}" stroke-width="0.5"/>')

    # ---------- bars
    for i, (label, a, z, col) in enumerate(BARS):
        ry = top + i * rowh
        b.append(f'<line x1="{LEFT-4}" y1="{ry}" x2="{right}" y2="{ry}" '
                 f'stroke="{RULE}" stroke-width="0.5"/>')
        lns, sz = B.fit(label, LEFT - 14, S, "normal")
        assert len(lns) == 1, f'row label wraps and would be clipped: {label}'
        b.append(_t(LEFT - 8, ry + rowh / 2 + sz * 0.34, lns[0], sz, INK,
                    anchor="end"))
        bx, bw = x(a) + 1.5, cw * (z - a + 1) - 3
        b.append(f'<rect x="{bx}" y="{ry + 5}" width="{bw}" height="{rowh - 10}" '
                 f'rx="2.5" fill="{col}" fill-opacity="0.18" stroke="{col}" '
                 f'stroke-width="1.2"/>')
    b.append(f'<line x1="{LEFT-4}" y1="{top + body_h}" x2="{right}" '
             f'y2="{top + body_h}" stroke="{RULE}" stroke-width="0.5"/>')
    y = top + body_h + 4

    # ---------- gates and flags on their own strip under the grid
    for wk, (name, hard) in GATES.items():
        cx = x(wk, 0.5)
        b.append(f'<line x1="{cx}" y1="{top}" x2="{cx}" y2="{y + 2}" '
                 f'stroke="{TEAL}" stroke-width="{1.4 if hard else 0.9}" '
                 f'stroke-dasharray="{"" if hard else "3 2.5"}"/>')
        b.append(f'<path d="M{cx} {y+2} l4.6 4.6 l-4.6 4.6 l-4.6 -4.6 z" '
                 f'fill="{TEAL if hard else "#ffffff"}" stroke="{TEAL}" '
                 f'stroke-width="1.2"/>')
        b.append(_t(cx, y + 20, name, S, TEAL, weight="bold" if hard else "normal"))
    for wk, name in FLAGS.items():
        cx = x(wk, 0.5)
        b.append(f'<circle cx="{cx}" cy="{y+6.6}" r="3.6" fill="#ffffff" '
                 f'stroke="{GREEN}" stroke-width="1.4"/>')
        # a second label line: week 10 sits next to the week 9 gate, and the two
        # labels are each wider than a week column
        b.append(_t(cx, y + 32, name, S, GREEN))
    y += 38

    # ---------- legend, wrapped to the artboard rather than trusting one line
    legend = ("Shaded weeks are holidays. Circles are conferences, open diamonds "
              "reviews, solid diamonds the two deadlines.")
    lns, sz = B.fit(legend, W - 24, S)
    for i, ln in enumerate(lns):
        b.append(_t(6, y + 8 + i * sz * 1.15, ln, sz, GREY, anchor="start",
                    style="italic"))
    H = y + 8 + len(lns) * sz * 1.15
    return _wrap(W / 100, H / 100, "".join(b))
