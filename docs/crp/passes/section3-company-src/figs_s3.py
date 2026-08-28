# -*- coding: utf-8 -*-
"""Section 3 figures. Same grid and vocabulary as Sections 1 and 2:
100 units = 1 inch, one line weight, shaded = already true."""
from figs_son import TEAL, GFILL, GREY, RULE, INK, _wrap, _t

def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.4, rx=3, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>')


# ------------------------------------------------------------------ FIGURE 5
def fig5():
    """7.2 x 1.72in. Five stages, and the source of capital each one earns.

    The caption's claim is that each stage produces what is required to reach
    the next source of capital, so the capital band is drawn rather than left
    to the prose. The dashed marker fixes where the company actually is."""
    W, H = 720, 148
    RX, GX, CW, NC = 76, 92, 124, 5
    def colx(i): return GX + CW * i
    def cx(i): return GX + CW * i + CW / 2
    b = []

    stages = [
        (["PROBLEM", "DISCOVERY"], "2019 to 2020",
         ["Sling Health", "Caregiver discovery", "Olera formation"], GFILL, None),
        (["BUILD &amp;", "VALIDATE"], "Phase I/II",
         ["CareNavigator", "Resource infrastructure", "Human-centered studies"], GFILL, None),
        (["DEPLOY &amp;", "LEARN"], "Phase IIB",
         ["National deployment", "Organic demand", "Provider and workforce"], GFILL, None),
        (["COMPLETE &amp;", "COMMERCIALIZE"], "CRP",
         ["Execution and outcomes", "Staffing repeatability", "Institutional evidence"],
         "#ffffff", None),
        (["SCALE", ""], "Post-CRP",
         ["Provider revenue", "Institutional contracts", "Private investment"],
         "#ffffff", "4 3"),
    ]
    for i, (name, period, lines, fill, dash) in enumerate(stages):
        b.append(_box(colx(i) + 3, 18, CW - 6, 82, fill, TEAL, 1.4, dash=dash))
        for k, ln in enumerate(name):
            if ln:
                b.append(_t(cx(i), 32 + k * 11, ln, 9.8, TEAL, weight="bold", ls=0.6))
        b.append(_t(cx(i), 55, period, 9.0, GREY, style="italic"))
        for k, ln in enumerate(lines):
            b.append(_t(cx(i), 70 + k * 10.5, ln, 9.2, INK))
        if i < NC - 1:
            x = colx(i + 1)
            b.append(f'<path d="M{x-6} 64 l6 4 l-6 4" fill="none" stroke="{RULE}" stroke-width="1.4"/>')

    b.append(_t(RX, 58, "STAGE", 9.0, GREY, anchor="end", weight="bold", ls=0.9))

    # source of capital, the argument the stages exist to make
    b.append(_t(RX, 120, "SOURCE OF", 9.0, GREY, anchor="end", weight="bold", ls=0.9))
    b.append(_t(RX, 131, "CAPITAL", 9.0, GREY, anchor="end", weight="bold", ls=0.9))
    capital = [["Founders and", "university programs"], ["NIA SBIR", "Phase I/II"],
               ["NIA SBIR", "Phase IIB"], ["NIA SBIR CRP", ""],
               ["Commercial revenue", "and private investment"]]
    for i, lines in enumerate(capital):
        b.append(f'<line x1="{colx(i)+3}" y1="110" x2="{colx(i)+CW-3}" y2="110" '
                 f'stroke="{TEAL}" stroke-width="1.1"/>')
        for k, ln in enumerate(lines):
            if ln:
                b.append(_t(cx(i), 123 + k * 11, ln, 9.2, INK))

    # where the company actually is
    x = colx(3)
    b.append(f'<line x1="{x}" y1="12" x2="{x}" y2="142" stroke="{GREY}" stroke-width="1.1" '
             f'stroke-dasharray="4 3"/>')
    b.append(_t(x - 5, 10, "TODAY", 9.0, GREY, anchor="end", weight="bold", ls=0.9))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 6
def fig6():
    """7.2 x 1.42in. Capacity added behind validated demand, never ahead of it."""
    W, H = 720, 122
    GX, CW, NC = 8, 234, 3
    def colx(i): return GX + CW * i
    def cx(i): return GX + CW * i + CW / 2
    b = []
    heads = [("TODAY", "R&amp;D and early commercialization", GFILL,
              [["Founder-led multidisciplinary core"],
               ["Established engineering, operations,", "marketing, and research"],
               ["External senior specialists"]]),
             ("DURING CRP", "Commercial validation", "#ffffff",
              [["Dedicated capacity added where", "validated demand creates bottlenecks"],
               ["Commercialization and customer success"],
               ["Operations and data/compliance"]]),
             ("POST-CRP", "Commercial scale", "#ffffff",
              [["Commercial revenue and private capital", "support mature functions"],
               ["Institutional accounts and sales"],
               ["Customer success, operations,", "finance/compliance, technical scale"]])]
    for i, (name, sub, fill, items) in enumerate(heads):
        b.append(f'<rect x="{colx(i)+3}" y="12" width="{CW-6}" height="28" rx="3" '
                 f'fill="{fill}" stroke="none"/>')
        b.append(_t(cx(i), 24, name, 10.0, TEAL, weight="bold", ls=1.0))
        b.append(_t(cx(i), 36, sub, 9.2, GREY, style="italic"))
        b.append(f'<line x1="{colx(i)+3}" y1="44" x2="{colx(i)+CW-3}" y2="44" '
                 f'stroke="{TEAL}" stroke-width="1.1"/>')
        y = 57
        for it in items:
            b.append(f'<circle cx="{colx(i)+11}" cy="{y-3.4}" r="2.2" fill="{TEAL}"/>')
            for k, ln in enumerate(it):
                b.append(_t(colx(i) + 20, y + k * 11, ln, 9.2, INK, anchor="start"))
            y += len(it) * 11 + 5
        if i < NC - 1:
            b.append(f'<line x1="{colx(i+1)}" y1="14" x2="{colx(i+1)}" y2="130" '
                     f'stroke="{RULE}" stroke-width="0.6"/>')
    b.append(f'<line x1="{GX+3}" y1="6" x2="{colx(NC)-3}" y2="6" stroke="{RULE}" '
             f'stroke-width="1.2" marker-end="url(#sah)"/>')
    return _wrap(W / 100, H / 100, "".join(b))
