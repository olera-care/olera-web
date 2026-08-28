# -*- coding: utf-8 -*-
"""Section 2 figures. Same grid and vocabulary as the Statement of Need:
100 units = 1 inch, one line weight, the same icon set."""
from figs_son import (TEAL, GREEN, GFILL, RED, RFILL, GREY, RULE, INK,
                      _wrap, _t, _icon, I_IDENTIFY, I_EXECUTE, I_STAFF, I_OUTCOMES)

def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.4, rx=3):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')


# ------------------------------------------------------------------ FIGURE 4
def fig4():
    """7.2 x 2.10in. Which layer of the platform acts on which pathway step.

    Deliberately not a box-and-arrow diagram. The pathway from Figure 2 becomes
    the horizontal axis, so the reader sees coverage rather than connectivity:
    what already exists, what the CRP builds, and that staffing is a targeted
    intervention at one step rather than a universal one."""
    W, H = 720, 210
    LX = 108                      # right edge of the band-label column
    GX, CW, NC = 118, 85, 7       # grid origin, column width, column count
    steps = ["Assess Needs", "Identify Care", "Fund Care", "Staff Care",
             "Execute Plan", "Establish Care", "Track Outcomes"]
    def cx(i): return GX + CW * i + CW / 2
    b = []

    # column headers and the grid they define
    for i, s in enumerate(steps):
        b.append(_t(cx(i), 13, s, 10.2, TEAL, weight="bold"))
    b.append(f'<line x1="{GX}" y1="20" x2="{GX + CW*NC}" y2="20" stroke="{TEAL}" stroke-width="1.1"/>')
    for i in range(1, NC):
        x = GX + CW * i
        b.append(f'<line x1="{x}" y1="22" x2="{x}" y2="204" stroke="{RULE}" stroke-width="0.6"/>')

    # bands, drawn over the grid so the column spans read as coverage
    bands = [
        (30, 38, 0, 3, GFILL, GREY, I_IDENTIFY,
         ["Assessment and", "matching"], "Phase I to IIB",
         ["Screening and matching over the", "national resource database"]),
        (78, 38, 2, 6, "#ffffff", TEAL, I_EXECUTE,
         ["AI execution", "layer"], "CRP",
         ["Applications, documents, follow-up,", "provider intake, confirmation of care"]),
        (126, 30, 3, 4, "#ffffff", TEAL, I_STAFF,
         ["Caregiver", "Staffing"], "CRP", None),
        (166, 38, 0, 7, "#ffffff", TEAL, I_OUTCOMES,
         ["Longitudinal", "outcomes layer"], "CRP",
         ["Case status, failure points, care established, and subsequent outcomes"]),
    ]
    for y, h, c0, c1, fill, stroke, icon, name, tag, lines in bands:
        x0, x1 = GX + CW * c0, GX + CW * c1
        b.append(_box(x0, y, x1 - x0, h, fill, stroke))
        b.append(_icon(x0 + 8, y + (h - 24) / 2, icon, scale=1.0, color=stroke, sw=1.5))
        for k, ln in enumerate(name):
            b.append(_t(LX, y + 15 + k * 11, ln, 10.4, TEAL, anchor="end", weight="bold"))
        b.append(_t(LX, y + 15 + len(name) * 11, tag, 8.8, GREY, anchor="end"))
        if lines:
            tx = x0 + 40
            y0 = y + (h - (len(lines) - 1) * 12) / 2 + 4
            for k, ln in enumerate(lines):
                b.append(_t(tx, y0 + k * 12, ln, 9.6, INK, anchor="start"))

    # the staffing band is one column wide, so its qualifier sits beside it
    b.append(_t(GX + CW * 4 + 12, 137, "New caregivers placed with licensed providers,",
                9.6, GREY, anchor="start", style="italic"))
    b.append(_t(GX + CW * 4 + 12, 149, "only when capacity blocks an appropriate plan",
                9.6, GREY, anchor="start", style="italic"))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 5
def fig5():
    """7.2 x 1.14in. What one county's record looks like once it exists.

    Drawn entirely in grey rather than the house teal, because every number is
    hypothetical. The palette itself is the disclaimer."""
    W, H = 720, 114
    stages = [(1200, "families", "assessed"), (780, "required", "home care"),
              (510, "viable funding", "identified"), (390, "funding workflows", "completed"),
              (340, "reached a", "provider"), (281, "established", "care")]
    CW, X0 = 96, 6
    b = []
    b.append(_t(X0, 12, "ILLUSTRATIVE ONLY &middot; ONE COUNTY, AFTER SCALE", 9.0, GREY,
                anchor="start", weight="bold", ls=0.9))
    for i, (n, l1, l2) in enumerate(stages):
        x = X0 + CW * i
        b.append(_t(x + CW / 2, 42, f"{n:,}", 15.0, INK, weight="bold"))
        b.append(f'<rect x="{x + 8}" y="50" width="{80 * n / 1200:.1f}" height="5" '
                 f'rx="1" fill="{GREY}"/>')
        b.append(_t(x + CW / 2, 70, l1, 9.4, GREY))
        b.append(_t(x + CW / 2, 81, l2, 9.4, GREY))
        if i < len(stages) - 1:
            xm = x + CW - 2
            b.append(f'<path d="M{xm-4} 33 l5 4.5 l-5 4.5" fill="none" stroke="{RULE}" stroke-width="1.4"/>')
    # the capacity branch is a loss between the last two stages, not a stage
    xm = X0 + CW * 5
    b.append(f'<path d="M{xm-6} 88 v8 h-40" fill="none" stroke="{RULE}" stroke-width="1"/>')
    b.append(_t(xm - 50, 99, "102 blocked by provider capacity", 9.2, GREY,
                anchor="end", style="italic"))
    # what the record carries beyond the counts
    b.append(f'<line x1="{X0 + CW*6 - 2}" y1="24" x2="{X0 + CW*6 - 2}" y2="88" '
             f'stroke="{RULE}" stroke-width="0.9" stroke-dasharray="3 2.6"/>')
    for k, s in enumerate(["median time to care", "aid dollars secured", "downstream outcomes"]):
        b.append(_t(X0 + CW * 6 + 10, 40 + k * 14, s, 9.4, GREY, anchor="start"))
    return _wrap(W / 100, H / 100, "".join(b))
