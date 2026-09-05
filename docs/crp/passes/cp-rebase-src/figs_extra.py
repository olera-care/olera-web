# -*- coding: utf-8 -*-
"""Two figures the live document carries as rasters, redrawn on the house grid.

image21.png is a matplotlib chart in a foreign palette; image12.png is already in
the house palette but is a raster. Both are redrawn here in SVG so the whole
document is one typeface and one line weight. Content is taken from the rasters
themselves and nothing is added to either.
"""
from figs_son import TEAL, GFILL, GREY, RULE, INK, _wrap, _t


def organic():
    """2.68 x 2.09in, the size and proportions the live document floats it at.

    Redraw of image21.png: same series, same two labelled endpoints, same
    subtitle. Narrow enough for text to wrap around it, which is how the source
    anchors it (wrapSquare, right of the column)."""
    W, H = 268, 209
    L, R, TOP, BOT = 34, 262, 62, 168
    VMAX = 560.0
    pts = [(2023.0, 50), (2023.4, 68), (2023.8, 92), (2024.2, 124), (2024.6, 165),
           (2025.0, 218), (2025.4, 292), (2025.7, 372), (2026.0, 500)]
    def px(yr): return L + (yr - 2023.0) / 3.0 * (R - L)
    def py(v):  return BOT - (v / VMAX) * (BOT - TOP)
    b = []
    b.append(_t(2, 14, "Organic visitors per day", 10.0, INK, anchor="start", weight="bold"))
    b.append(_t(2, 26, "zero paid acquisition", 8.4, GREY, anchor="start"))
    b.append(_t(2, 36, "search infrastructure built from zero", 8.4, GREY, anchor="start"))
    for g, lab in ((0, "0"), (250, "250"), (500, "500+")):
        y = py(g)
        b.append(f'<line x1="{L}" y1="{y:.1f}" x2="{R}" y2="{y:.1f}" stroke="{RULE}" '
                 f'stroke-width="{1.0 if g == 0 else 0.5}"/>')
        b.append(_t(L - 5, y + 3.0, lab, 8.0, GREY, anchor="end"))
    b.append(f'<line x1="{L}" y1="{TOP-4}" x2="{L}" y2="{py(0):.1f}" stroke="{RULE}" stroke-width="1.0"/>')
    for yr in (2023, 2024, 2025, 2026):
        b.append(_t(px(yr), BOT + 13, str(yr), 8.0, GREY))
    poly = " ".join(f"{px(x):.1f},{py(v):.1f}" for x, v in pts)
    b.append(f'<polygon points="{px(2023.0):.1f},{py(0):.1f} {poly} {px(2026.0):.1f},{py(0):.1f}" '
             f'fill="{GFILL}" stroke="none"/>')
    b.append(f'<polyline points="{poly}" fill="none" stroke="{TEAL}" stroke-width="1.7" '
             f'stroke-linejoin="round" stroke-linecap="round"/>')
    b.append(f'<circle cx="{px(2023.0):.1f}" cy="{py(50):.1f}" r="3.0" fill="{TEAL}"/>')
    b.append(_t(px(2023.0) + 44, py(50) - 8, "\u224850/day (2023)", 8.6, INK, weight="bold"))
    b.append(f'<circle cx="{px(2026.0):.1f}" cy="{py(500):.1f}" r="3.0" fill="{TEAL}"/>')
    b.append(_t(px(2026.0) - 44, py(500) - 9, "500+/day (2026)", 8.6, INK, weight="bold"))
    return _wrap(W / 100, H / 100, "".join(b))


def market_process():
    """7.2 x 0.94in. Redraw of image12.png, the repeatable local-market process."""
    W, H = 720, 94
    steps = [(["SELECT", "MARKET"], ["county-level", "opportunity signals"]),
             (["BUILD LOCAL", "INFRASTRUCTURE"], ["providers + benefits +", "CareNavigator surfaces"]),
             (["CONCENTRATE", "FAMILIES"], ["organic + community +", "digital channels"]),
             (["ACTIVATE", "PROVIDERS"], ["listings → claims →", "self-service participation"]),
             (["ADD WORKFORCE", "CAPACITY"], ["universities + applicants →", "Caregiver Staffing"]),
             (["EXECUTE &amp;", "MEASURE"], ["care + staffing + cost +", "outcomes + revenue"]),
             (["REPLICATE", ""], ["retain · refine ·", "next market"])]
    GAP, N = 7, 7
    CW = (W - GAP * (N - 1)) / N
    b = []
    for i, (name, sub) in enumerate(steps):
        x = i * (CW + GAP)
        b.append(f'<rect x="{x:.1f}" y="2" width="{CW:.1f}" height="52" rx="4" fill="{GFILL}" '
                 f'stroke="{TEAL}" stroke-width="1.4"/>')
        cx = x + CW / 2
        for k, ln in enumerate(name):
            if ln:
                b.append(_t(cx, 16 + k * 10, ln, 8.6, TEAL, weight="bold", ls=0.4))
        for k, ln in enumerate(sub):
            b.append(_t(cx, 38 + k * 9.5, ln, 7.6, INK))
        if i < N - 1:
            xa = x + CW
            b.append(f'<path d="M{xa+0.8} 24 l{GAP-1.6} 4 l-{GAP-1.6} 4 z" fill="{RULE}"/>')
    b.append(f'<rect x="0" y="60" width="{W}" height="30" rx="4" fill="#ffffff" '
             f'stroke="{TEAL}" stroke-width="1.2"/>')
    b.append(_t(W / 2, 79, "CRP measures: acquisition cost · activation · workforce acquisition · "
               "care establishment · paid conversion · retention · market economics",
               8.6, TEAL, weight="bold"))
    return _wrap(W / 100, H / 100, "".join(b))
