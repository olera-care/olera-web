# -*- coding: utf-8 -*-
"""Revenue Stream figures.

Series fills are NOT the house ink teal. #14453f fails the categorical
lightness band (L 0.356) and reads near-black as a large fill. The two steps
below were snapped to passing separation: normal-vision dE 27.6, protan 26.4,
deutan/tritan comparable. They still fail the chroma floor, because the Olera
palette is deliberately low-chroma; the required relief is present in both
figures as direct labels plus a legend, and Table 7 restates the same data.
Text stays in house ink, never in a series colour.
"""
from figs_son import TEAL, GREY, RULE, INK, GFILL, _wrap, _t

S_NEAR = "#2b7a6d"   # Caregiver Staffing, the nearer-term series
S_LATER = "#9ec9be"  # Institutional, the later series

def _bar(x, y, w, h, fill, r=4):
    """Rounded data-end anchored to the baseline: only the far end is rounded."""
    if h <= 0: return ''
    r = min(r, h / 2, w / 2)
    return (f'<path d="M{x} {y+h} v{-(h-r)} q0,{-r} {r},{-r} h{w-2*r} q{r},0 {r},{r} '
            f'v{h-r} z" fill="{fill}"/>')

def _hbar(x, y, w, h, fill, r=4):
    if w <= 0: return ''
    r = min(r, w / 2, h / 2)
    return (f'<path d="M{x} {y} h{w-r} q{r},0 {r},{r} v{h-2*r} q0,{r} {-r},{r} h{-(w-r)} z" '
            f'fill="{fill}"/>')


# ----------------------------------------------------------------- FIGURE 11
def fig11():
    """7.2 x 1.94in. The unit is stated; only the replication series is charted.

    The CRP case ($240K) and the post-CRP scale points ($3M to $15M) differ by
    more than an order of magnitude, so charting both on one axis would render
    the CRP bar invisible and charting them on two would be a dual scale. The
    small numbers are stated, the large ones are drawn."""
    W, H = 720, 194
    b = []
    b.append(f'<line x1="252" y1="14" x2="252" y2="182" stroke="{RULE}" stroke-width="0.6"/>')

    # --- the unit, held constant --------------------------------------------
    b.append(_t(8, 20, "THE UNIT, HELD CONSTANT", 9.2, GREY, anchor="start", weight="bold", ls=1.0))
    b.append(_t(8, 52, "$30,000", 26.0, INK, anchor="start", weight="bold"))
    b.append(_t(8, 68, "a year, from one county", 9.8, INK, anchor="start"))
    b.append(_t(8, 84, "10 successful hires a month at $250 each", 9.2, GREY, anchor="start"))
    b.append(f'<line x1="8" y1="96" x2="232" y2="96" stroke="{RULE}" stroke-width="0.8"/>')
    b.append(_t(8, 112, "Eight CRP markets", 9.6, TEAL, anchor="start", weight="bold"))
    b.append(_t(232, 112, "$240,000 a year", 9.6, INK, anchor="end"))
    b.append(_t(8, 132, "Excluded from the forecast", 9.2, GREY, anchor="start", style="italic"))
    for k, (lab, val) in enumerate([("at 20 hires a month", "$480,000"),
                                    ("at 30 hires a month", "$720,000")]):
        b.append(_t(8, 148 + k * 13, lab, 9.2, GREY, anchor="start"))
        b.append(_t(232, 148 + k * 13, val, 9.2, GREY, anchor="end"))

    # --- replication, one series, one scale ---------------------------------
    b.append(_t(272, 20, "POST-CRP REPLICATION, SAME 10 HIRES A MONTH", 9.2, GREY,
                anchor="start", weight="bold", ls=1.0))
    X0, XMAX, VMAX = 372, 636, 15.0
    rows = [("100 counties", "12,000 hires", 3.0, "$3.0M"),
            ("250 counties", "30,000 hires", 7.5, "$7.5M"),
            ("500 counties", "60,000 hires", 15.0, "$15M")]
    for i, (lab, hires, val, vlab) in enumerate(rows):
        y = 44 + i * 44
        b.append(_t(272, y + 11, lab, 10.0, TEAL, anchor="start", weight="bold"))
        b.append(_t(272, y + 23, hires, 9.0, GREY, anchor="start"))
        w = (XMAX - X0) * val / VMAX
        b.append(_hbar(X0, y, w, 17, S_NEAR))
        b.append(_t(X0 + w + 8, y + 13, vlab, 10.0, INK, anchor="start", weight="bold"))
    b.append(f'<line x1="{X0}" y1="36" x2="{X0}" y2="172" stroke="{RULE}" stroke-width="0.8"/>')
    b.append(_t(X0, 186, "annual Caregiver Staffing revenue, institutional revenue excluded",
                9.0, GREY, anchor="start", style="italic"))
    return _wrap(W / 100, H / 100, "".join(b))


# ----------------------------------------------------------------- FIGURE 12
def fig12():
    """7.2 x 2.24in. Five-year revenue, stacked, two series."""
    W, H = 720, 224
    GX, CW, NC = 96, 118, 5
    BASE, PLOT, VMAX = 168, 118, 1500.0
    def cx(i): return GX + CW * i + CW / 2
    b = []
    years = [("CRP Y1", "Build", 0, 0), ("CRP Y2", "Validate free", 0, 0),
             ("CRP Y3", "Monetize", 120, 0), ("Post-CRP Y4", "Expand", 450, 150),
             ("Post-CRP Y5", "Scale", 750, 750)]

    for g, lab in [(0, "$0"), (500, "$0.5M"), (1000, "$1.0M"), (1500, "$1.5M")]:
        y = BASE - PLOT * g / VMAX
        b.append(f'<line x1="{GX-6}" y1="{y}" x2="{GX+CW*NC}" y2="{y}" stroke="{RULE}" '
                 f'stroke-width="{0.9 if g == 0 else 0.5}"/>')
        b.append(_t(GX - 12, y + 3.4, lab, 9.0, GREY, anchor="end"))

    for i, (yr, stage, staff, inst) in enumerate(years):
        x = cx(i) - 26
        hs = PLOT * staff / VMAX
        hi = PLOT * inst / VMAX
        if staff:
            b.append(_bar(x, BASE - hs, 52, hs, S_NEAR, r=0 if inst else 4))
        if inst:
            # 2-unit surface gap between stacked segments
            b.append(_bar(x, BASE - hs - hi - 2, 52, hi, S_LATER))
        tot = staff + inst
        b.append(_t(cx(i), BASE - hs - hi - (10 if tot else 6),
                    "$0" if not tot else (f"${tot/1000:.2f}M" if tot >= 1000 else f"${tot}K"),
                    10.2, INK, weight="bold"))
        b.append(_t(cx(i), BASE + 16, yr, 9.8, TEAL, weight="bold"))
        b.append(_t(cx(i), BASE + 28, stage, 9.2, GREY, style="italic"))

    xend = GX + CW * 3
    b.append(f'<line x1="{xend}" y1="26" x2="{xend}" y2="{BASE+34}" stroke="{GREY}" '
             f'stroke-width="1.1" stroke-dasharray="4 3"/>')
    b.append(_t(xend - 6, 22, "CRP ENDS", 9.0, GREY, anchor="end", weight="bold", ls=0.9))

    for k, (lab, col) in enumerate([("Caregiver Staffing", S_NEAR), ("Institutional", S_LATER)]):
        x = GX + k * 168
        b.append(f'<rect x="{x}" y="{H-16}" width="11" height="9" rx="2" fill="{col}"/>')
        b.append(_t(x + 16, H - 8, lab, 9.4, INK, anchor="start"))
    return _wrap(W / 100, H / 100, "".join(b))


# -------------------------------------------- inline chain, uncaptioned strip
def chain():
    """7.2 x 0.42in. The institutional value chain, as a strip rather than a
    bare arrow sentence."""
    W, H = 720, 42
    steps = ["Recognized unmet need", "CareNavigator execution", "Care established",
             "Longitudinal outcomes", "Institutional contract"]
    b = []
    x = 4
    for i, s in enumerate(steps):
        w = len(s) * 5.1 + 22
        b.append(f'<rect x="{x}" y="8" width="{w}" height="26" rx="3" fill="{GFILL}" '
                 f'stroke="{TEAL}" stroke-width="1.1"/>')
        b.append(_t(x + w / 2, 25, s, 9.6, TEAL, weight="bold"))
        x += w
        if i < len(steps) - 1:
            b.append(f'<path d="M{x+4} 21 l7 4 l-7 4 z" fill="{RULE}" transform="translate(0,-4)"/>')
            x += 18
    return _wrap(W / 100, H / 100, "".join(b))
