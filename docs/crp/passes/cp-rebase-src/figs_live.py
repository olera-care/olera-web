# -*- coding: utf-8 -*-
"""Figures 5 and 6 re-cut to the live document's exact wording.

The live Commercialization Plan carries Figures 5 and 6 as Word tables. The house
versions in ../section3-company-src were drawn from an earlier text and differ from
the live wording in small ways (connectives, one dropped word, one reordered
phrase). Because the live document is the baseline for this rebase, the strings
below are taken verbatim from the live tables. Layout and palette are unchanged
from the locked Section 3 figures, which are left untouched.
"""
from figs_son import TEAL, GFILL, GREY, RULE, INK, _wrap, _t
from figs_s3 import _box


def fig5():
    """7.2 x 1.48in. Five stages, and the source of capital each one earns."""
    W, H = 720, 148
    RX, GX, CW, NC = 76, 92, 124, 5
    def colx(i): return GX + CW * i
    def cx(i): return GX + CW * i + CW / 2
    b = []
    stages = [
        (["PROBLEM", "DISCOVERY"], "2019–2020",
         ["Sling Health", "Caregiver discovery", "Olera formation"], GFILL, None),
        (["BUILD &amp;", "VALIDATE"], "Phase I/II",
         ["CareNavigator", "Resource infrastructure", "Human-centered studies"], GFILL, None),
        (["DEPLOY &amp;", "LEARN"], "Phase IIB",
         ["National deployment", "Organic demand", "Provider/workforce discovery"], GFILL, None),
        (["COMPLETE &amp;", "COMMERCIALIZE"], "CRP",
         ["Execution + outcomes", "Staffing repeatability", "Institutional evidence"],
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
            size = 8.4 if len(ln) > 24 else 9.2
            b.append(_t(cx(i), 70 + k * 10.5, ln, size, INK))
        if i < NC - 1:
            x = colx(i + 1)
            b.append(f'<path d="M{x-6} 64 l6 4 l-6 4" fill="none" stroke="{RULE}" stroke-width="1.4"/>')
    b.append(_t(RX, 58, "STAGE", 9.0, GREY, anchor="end", weight="bold", ls=0.9))
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
    x = colx(3)
    b.append(f'<line x1="{x}" y1="12" x2="{x}" y2="142" stroke="{GREY}" stroke-width="1.1" '
             f'stroke-dasharray="4 3"/>')
    b.append(_t(x - 5, 10, "TODAY", 9.0, GREY, anchor="end", weight="bold", ls=0.9))
    return _wrap(W / 100, H / 100, "".join(b))


def fig6():
    """7.2 x 1.22in. Capacity added behind validated demand, never ahead of it."""
    W, H = 720, 122
    GX, CW, NC = 8, 234, 3
    def colx(i): return GX + CW * i
    def cx(i): return GX + CW * i + CW / 2
    b = []
    heads = [("TODAY", "R&amp;D + early commercialization", GFILL,
              [["Founder-led multidisciplinary core"],
               ["Established engineering, operations,", "marketing &amp; research"],
               ["External senior specialists"]]),
             ("DURING CRP", "Commercial validation", "#ffffff",
              [["Add dedicated capacity where validated", "demand creates bottlenecks"],
               ["Commercialization/customer success"],
               ["Operations &amp; data/compliance"]]),
             ("POST-CRP", "Commercial scale", "#ffffff",
              [["Commercial revenue + private capital", "support mature functions"],
               ["Institutional accounts &amp; sales"],
               ["Customer success, operations,", "finance/compliance &amp; technical scale"]])]
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
                b.append(_t(colx(i) + 20, y + k * 11, ln, 9.0, INK, anchor="start"))
            y += len(it) * 11 + 5
        if i < NC - 1:
            b.append(f'<line x1="{colx(i+1)}" y1="14" x2="{colx(i+1)}" y2="130" '
                     f'stroke="{RULE}" stroke-width="0.6"/>')
    b.append(f'<line x1="{GX+3}" y1="6" x2="{colx(NC)-3}" y2="6" stroke="{RULE}" '
             f'stroke-width="1.2" marker-end="url(#sah)"/>')
    return _wrap(W / 100, H / 100, "".join(b))
