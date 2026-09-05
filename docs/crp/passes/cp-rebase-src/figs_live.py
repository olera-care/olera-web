# -*- coding: utf-8 -*-
"""Figures 5 and 6 re-cut to the live document's exact wording.

The live Commercialization Plan carries Figures 5 and 6 as Word tables. The house
versions in ../section3-company-src were drawn from an earlier text and differ from
the live wording in small ways (connectives, one dropped word, one reordered
phrase). Because the live document is the baseline for this rebase, the strings
below are taken verbatim from the live tables. Layout and palette are unchanged
from the locked Section 3 figures, which are left untouched.
"""
from figs_son import TEAL, GREEN, RED, GFILL, GREY, RULE, INK, _wrap, _t
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


# ------------------------------------------------------------------ FIGURE 3
def fig3():
    """7.2 x 2.18in. Re-cut so the red label clears the terrain and the right
    wall climbs instead of sitting flat.

    The climb is shaped like the revenue model the plan actually states: Year 1
    is an engineering year and Year 2 deploys Staffing free, so the basin runs
    flat through both; paid testing begins in Year 3, so the wall lifts there and
    steepens toward the end of the award."""
    T = _t
    W, H = 720, 218
    LX0, RX1 = 8, 712
    VX0, VX1 = 176, 544
    CLIMB = 402                      # where Year 3 lifts the wall
    b = []

    ridge = (f"M{LX0} 74 H126 C 182 74, 202 150, 256 152 "
             f"C 306 153, 360 153, {CLIMB} 150 "
             f"C 482 143, 546 123, 602 104 C 650 89, 682 80, {RX1} 76")
    b.append(f'<path d="{ridge} V164 H{LX0} Z" fill="{GFILL}" stroke="none"/>')
    b.append(f'<path d="{ridge}" fill="none" stroke="{TEAL}" stroke-width="1.4"/>')

    for x0, anchor, eyebrow, head, hcol, lines in [
        (LX0, "start", "TODAY", "Demonstrated demand", TEAL,
         ["15,500+ monthly visitors", "CareNavigator usability validated",
          "Staffing willingness to pay shown"]),
        (RX1, "end", "AT CRP COMPLETION", "Commercial sustainability", GREEN,
         ["Repeatable provider revenue", "Institutional evidence package",
          "Positioned for private investment"])]:
        b.append(T(x0, 13, eyebrow, 9.4, GREY, anchor=anchor, weight="bold", ls=1.0))
        b.append(T(x0, 31, head, 12.0, hcol, anchor=anchor, weight="bold"))
        for i, ln in enumerate(lines):
            b.append(T(x0, 46 + i * 12.2, ln, 9.6, GREY, anchor=anchor))

    # the basin is flat through Years 1 and 2, which is where the label belongs
    b.append(T(300, 126, "VALLEY OF DEATH", 12.5, RED, weight="bold", ls=1.4))

    # where the wall starts to climb
    b.append(f'<line x1="{CLIMB}" y1="102" x2="{CLIMB}" y2="151" stroke="{GREY}" '
             f'stroke-width="1.1" stroke-dasharray="4 3"/>')
    b.append(T(CLIMB + 7, 92, "YEAR 3", 9.4, GREY, anchor="start", weight="bold", ls=0.9))
    b.append(T(CLIMB + 7, 103, "paid testing begins", 9.2, GREY, anchor="start",
               style="italic"))

    seg = (VX1 - VX0) / 5.0
    ty = 190
    b.append(f'<line x1="{VX0}" y1="{ty}" x2="{VX1 + 12}" y2="{ty}" stroke="{TEAL}" '
             f'stroke-width="1.3" marker-end="url(#sah)"/>')
    for i, rk in enumerate(["Technical", "Validation", "Evidence", "Commercial", "Financing"]):
        x = VX0 + seg * i + seg / 2
        b.append(f'<circle cx="{x}" cy="{ty}" r="7.6" fill="#ffffff" stroke="{TEAL}" '
                 f'stroke-width="1.3"/>')
        b.append(T(x, ty + 3.6, str(i + 1), 9.8, TEAL, weight="bold"))
        b.append(T(x, ty + 21, rk, 10.4, TEAL, weight="bold"))
    b.append(T(360, 174, "THE FIVE REMAINING RISKS, RETIRED IN SEQUENCE", 9.4, GREY,
               weight="bold", ls=0.8))
    return _wrap(W / 100, H / 100, "".join(b))
