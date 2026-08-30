# -*- coding: utf-8 -*-
"""Approach timetable, house vector system. 100 svg units = 1 inch.

The draft carries the schedule as a 17 x 13 grid of bullet characters. Same
data, drawn as continuous bars so a reader sees a task's span rather than
counting dots, with the three gates marked on the quarter they fall in.
"""
from figs_son import TEAL, GREEN, GFILL, GREY, RULE, INK, _wrap, _t
import figbase as B

PALE = "#f4f7f6"
BAND = "#eef3f1"


def timetable(grid):
    """grid: the draft's rows, first row the quarter header."""
    S = B.BODY
    W = 730
    LABW = 196
    quarters = 12
    cw = (W - LABW - 12) / quarters
    x0 = 6 + LABW

    rows = grid[1:]
    rh = 13.0
    yearh, headh = 14, 14
    top = 6 + yearh + headh + 4
    b = []

    # year bands
    for i, yr in enumerate(("YEAR 1", "YEAR 2", "YEAR 3")):
        bx = x0 + i * 4 * cw
        b.append(f'<rect x="{bx+1}" y="6" width="{4*cw-2}" height="{yearh}" rx="2.5" '
                 f'fill="{TEAL}"/>')
        b.append(_t(bx + 2 * cw, 6 + yearh - 4.2, yr, S, "#ffffff", weight="bold", ls=0.7))
    for q in range(quarters):
        b.append(_t(x0 + q * cw + cw / 2, 6 + yearh + headh - 4, f"Q{q+1}", S, GREY,
                    weight="bold"))

    for r, row in enumerate(rows):
        y = top + r * rh
        label = row[0]
        marks = [bool(c.strip()) for c in row[1:quarters + 1]]
        gate = label.upper().startswith(("GO/NO-GO", "FINAL"))
        col = GREEN if gate else TEAL
        if gate:
            b.append(f'<rect x="6" y="{y}" width="{W-12}" height="{rh}" fill="{BAND}"/>')
        elif r % 2 == 0:
            b.append(f'<rect x="6" y="{y}" width="{W-12}" height="{rh}" fill="{PALE}"/>')
        b.append(_t(12, y + rh - 4.4, label, S, col, anchor="start",
                    weight="bold" if gate else "normal"))
        if gate:
            for q, on in enumerate(marks):
                if on:
                    cx, cy = x0 + q * cw + cw / 2, y + rh / 2
                    b.append(f'<path d="M{cx} {cy-5.2} L{cx+5.2} {cy} L{cx} {cy+5.2} '
                             f'L{cx-5.2} {cy} z" fill="{GREEN}"/>')
        else:
            run = None
            for q in range(quarters + 1):
                on = marks[q] if q < quarters else False
                if on and run is None:
                    run = q
                elif not on and run is not None:
                    bx = x0 + run * cw + 3
                    bw = (q - run) * cw - 6
                    b.append(f'<rect x="{bx}" y="{y+3.2}" width="{bw}" '
                             f'height="{rh-6.4}" rx="3" fill="{TEAL}" opacity="0.86"/>')
                    run = None

    H = top + len(rows) * rh + 6
    # column rules, drawn last so they sit over the banding but under nothing
    for q in range(quarters + 1):
        x = x0 + q * cw
        b.append(f'<line x1="{x}" y1="{6+yearh+headh}" x2="{x}" y2="{H-6}" '
                 f'stroke="{RULE}" stroke-width="0.6" opacity="0.8"/>')
    b.append(f'<line x1="6" y1="{top-2}" x2="{W-6}" y2="{top-2}" stroke="{TEAL}" '
             f'stroke-width="1"/>')
    return _wrap(W / 100, H / 100, "".join(b))
