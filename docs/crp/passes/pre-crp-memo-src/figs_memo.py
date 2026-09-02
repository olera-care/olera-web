# -*- coding: utf-8 -*-
"""Orientation figure: the eldercare ecosystem, the care-establishment pathway,
and where Olera's products sit on it. 100 svg units = 1 inch."""
from figs_son import TEAL, GREEN, GFILL, GREY, RULE, INK, _wrap, _t
import figbase as B

PALE = "#f4f7f6"
GREYF = "#f1f2f1"
STEEL = "#3d6b62"

STEPS = ["Assess", "Find and fund", "Plan", "Execute",
         "Staff and deliver", "Care established", "Learn and measure"]

# label, first step, last step, fill, and whether it is Olera today
BARS = [
    ("CareNavigator, end to end over time", 0, 6, TEAL, "future"),
    ("Execution agents", 2, 3, STEEL, "build"),
    ("Caregiver Staffing", 4, 4, GREEN, "today"),
    ("Provider records, relationships, and field learning", 0, 6, GREY, "today"),
]
# the client product sits on two separate steps, so it gets its own row
CLIENT = (["Client acquisition", "Conversion to care"], [(1, 1), (5, 5)], GREEN)

ACTORS = ["Aid programs", "Healthcare organizations", "Risk-bearing payers",
          "Older adult and family", "Care providers", "LTSS organizations",
          "Caregiver workforce"]


def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.2, rx=3):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"/>')


def _lines(b, x, y, text, maxw, size, color, weight="bold", lead=None):
    ls, sz = B.fit(text, maxw, size, weight)
    lead = lead or sz * 1.14
    for i, ln in enumerate(ls):
        b.append(_t(x, y + i * lead, ln, sz, color, weight=weight))
    return y + len(ls) * lead


def ecosystem():
    W = 730
    S, LB = B.BODY, B.LABEL
    b = []
    y = 6

    # ---------- band 1: the ecosystem the family sits inside
    EH = 62
    b.append(f'<rect x="6" y="{y}" width="{W-12}" height="{EH}" rx="5" fill="{PALE}" '
             f'stroke="{RULE}" stroke-width="1.1"/>')
    b.append(_t(16, y + 14, "ELDERCARE ECOSYSTEM", S, GREY, anchor="start",
                weight="bold", ls=0.7))
    n = len(ACTORS)
    cw = (W - 32) / n
    for i, a in enumerate(ACTORS):
        cx = 16 + cw * i + cw / 2
        mid = i == n // 2
        bh = 30
        b.append(_box(cx - cw / 2 + 3, y + 20, cw - 6, bh,
                      TEAL if mid else "#ffffff", TEAL if mid else RULE,
                      1.3 if mid else 1.0))
        _lines(b, cx, y + 33, a, cw - 14, S, "#ffffff" if mid else INK,
               weight="bold" if mid else "normal")
    y += EH + 8

    # ---------- band 2: the pathway
    b.append(_t(16, y + 11, "CARE-ESTABLISHMENT PATHWAY", S, TEAL, anchor="start",
                weight="bold", ls=0.7))
    y += 18
    sw_ = (W - 32) / len(STEPS)
    # size the row from the tallest label rather than a guess, so two-line steps
    # do not print past the bottom of their box
    wrapped = [B.fit(s, sw_ - 12, S, "bold") for s in STEPS]
    maxln = max(len(w[0]) for w in wrapped)
    PH = 12 + maxln * S * 1.14
    for i, s in enumerate(STEPS):
        x = 16 + sw_ * i
        last = i == len(STEPS) - 1
        b.append(_box(x + 2, y, sw_ - 4, PH, GFILL if not last else "#e6f0ea",
                      TEAL, 1.3))
        lns, sz = wrapped[i]
        top = y + (PH - len(lns) * sz * 1.14) / 2 + sz * 0.86
        for k, ln in enumerate(lns):
            b.append(_t(x + sw_ / 2, top + k * sz * 1.14, ln, sz, TEAL, weight="bold"))
        if not last:
            ax = x + sw_ - 2
            b.append(f'<path d="M{ax-1} {y+PH/2-3.6} l5.2 3.6 l-5.2 3.6 z" fill="{TEAL}"/>')
    path_y = y
    y += PH + 10

    # ---------- band 3: what Olera runs on which steps
    b.append(_t(16, y + 8, "OLERA PRODUCTS AND CAPABILITIES", S, GREY, anchor="start",
                weight="bold", ls=0.7))
    y += 14
    RH = 21
    for label, a, z, col, when in BARS:
        x0 = 16 + sw_ * a + 2
        wid = sw_ * (z - a + 1) - 4
        dash = ' stroke-dasharray="4 3"' if when == "future" else ''
        b.append(f'<rect x="{x0}" y="{y}" width="{wid}" height="{RH-4}" rx="3" '
                 f'fill="{col}" opacity="{0.16 if when=="future" else 0.14}" '
                 f'stroke="{col}" stroke-width="1.1"{dash}/>')
        b.append(_t(x0 + 8, y + RH / 2 + S * 0.28, label, S, col, anchor="start",
                    weight="bold"))
        y += RH
    labels, spans, col = CLIENT
    for k, (a, z) in enumerate(spans):
        x0 = 16 + sw_ * a + 2
        wid = sw_ * (z - a + 1) - 4
        b.append(f'<rect x="{x0}" y="{y}" width="{wid}" height="{RH-4}" rx="3" '
                 f'fill="{col}" opacity="0.14" stroke="{col}" stroke-width="1.1"/>')
        b.append(_t(x0 + wid / 2, y + RH / 2 + S * 0.28, labels[k], S, col,
                    weight="bold"))
    y += RH + 4

    # the loop that makes the pathway compound
    b.append(f'<path d="M{16 + sw_*6.5} {y+4} v9 H{16 + sw_*0.5} v-9" fill="none" '
             f'stroke="{GREEN}" stroke-width="1.4" marker-end="url(#sag)"/>')
    b.append(_t(W / 2, y + 25, "each completed case informs the next: programs, capacity, "
                "barriers, and outcomes", S, GREEN, weight="bold"))
    H = y + 43
    b.append(_t(16, H, "Dashed: the end-to-end system being built toward. "
                "Solid: running or in build today.", S, GREY, anchor="start",
                style="italic"))
    H += 6
    return _wrap(W / 100, (H + 6) / 100, "".join(b))
