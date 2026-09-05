# -*- coding: utf-8 -*-
"""The figure set re-fitted so nothing prints below 9.5pt.

Same artwork, same content, same palette. What changes is that every size is
declared in real points via figbase and every label is measured and wrapped to
the space it actually has, so figures grow where they must rather than shrinking
their type. Batch one: the flow and box figures.
"""
from figs_son import (TEAL, GREEN, RED, GFILL, RFILL, GREY, RULE, INK,
                      _wrap, _t, _icon, I_PERSON_NEED, I_HOSPITAL, I_NOCARE, I_FACILITY)
import figbase as B


def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.4, rx=3, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>')


# ------------------------------------------------------------------ FIGURE 1
def fig1():
    """3.0 x 2.60in. Right-floated three-node cycle with a dotted exit below."""
    W, H = 300, 260
    LB = 11.0 * B.U                      # 11pt node labels
    b = []
    for d in ("M171.7 60.2 A 58 58 0 0 1 207.4 122.1",
              "M185.7 159.7 A 58 58 0 0 1 114.3 159.7",
              "M92.6 122.1 A 58 58 0 0 1 128.3 60.2"):
        b.append(f'<path d="{d}" fill="none" stroke="{TEAL}" stroke-width="1.5" '
                 f'marker-end="url(#sah)"/>')
    for x, y, label, icon, lx, ly, anc in [
            (150, 56, "Unmet Need", I_PERSON_NEED, 150, 22, "middle"),
            (200, 143, "Hospital", I_HOSPITAL, 228, 147, "start"),
            (100, 143, "No Care", I_NOCARE, 72, 147, "end")]:
        b.append(f'<circle cx="{x}" cy="{y}" r="21" fill="#ffffff" stroke="{TEAL}" '
                 f'stroke-width="1.4"/>')
        b.append(_icon(x - 12.6, y - 12.6, icon, scale=1.05, sw=1.45))
        b.append(_t(lx, ly, label, LB, TEAL, anchor=anc, weight="bold"))
    b.append(f'<line x1="200" y1="166" x2="200" y2="194" stroke="{RED}" stroke-width="1.3" '
             f'stroke-dasharray="3.4 2.8" marker-end="url(#sar)"/>')
    b.append(f'<circle cx="200" cy="216" r="19" fill="{RFILL}" stroke="{RED}" stroke-width="1.3"/>')
    b.append(_icon(200 - 11.4, 216 - 11.4, I_FACILITY, scale=0.95, color=RED, sw=1.45))
    lead = LB * 1.16
    b.append(_t(172, 216 - lead / 2 + 4, "Long-Term Care", LB, RED, anchor="end", weight="bold"))
    b.append(_t(172, 216 + lead / 2 + 4, "Facility", LB, RED, anchor="end", weight="bold"))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------- EVIDENCE CHAIN
def chain():
    """7.2in wide. The institutional value chain as a strip.

    At 9.5pt the five labels need about 8.5in of box, so the strip packs onto two
    rows rather than shrinking the type."""
    steps = ["Recognized unmet need", "CareNavigator execution", "Care established",
             "Longitudinal outcomes", "Institutional contract"]
    S, W, PAD, ARROW, BH = B.BODY, 720.0, 22, 22, 32
    widths = [B.w(t, S, "bold") + PAD for t in steps]

    rows, cur, acc = [], [], 0.0
    for t, wd in zip(steps, widths):
        add = wd + (ARROW if cur else 0)
        if cur and acc + add > W - 10:
            rows.append(cur); cur, acc = [], 0.0
            add = wd
        cur.append((t, wd)); acc += add
    rows.append(cur)

    b, y = [], 6
    for r, row in enumerate(rows):
        total = sum(wd for _, wd in row) + ARROW * (len(row) - 1)
        x = (W - total) / 2
        for i, (t, wd) in enumerate(row):
            b.append(_box(x, y, wd, BH, GFILL, TEAL, 1.1))
            b.append(_t(x + wd / 2, y + BH / 2 + S * 0.35, t, S, TEAL, weight="bold"))
            x += wd
            if i < len(row) - 1:
                b.append(f'<path d="M{x+7} {y+BH/2-4} l7 4 l-7 4 z" fill="{RULE}"/>')
                x += ARROW
        if r < len(rows) - 1:
            b.append(f'<path d="M{W/2-4} {y+BH+4} l8 0 l-4 7 z" fill="{RULE}"/>')
        y += BH + 14
    return _wrap(W / 100, (y - 14 + 6) / 100, "".join(b))


# ----------------------------------------------------------------- FIGURE 13
def fig13():
    """7.2in wide. Five stages and the four gates between them."""
    W = 720
    GAP, X0 = 20, 6
    BW = (W - 2 * X0 - 4 * GAP) / 5
    def bx(i): return X0 + i * (BW + GAP)
    def gapx(i): return bx(i) + BW + GAP / 2
    S, LB, EY = B.BODY, B.HEAD, B.BODY
    b = []
    b.append(_t((bx(0) + bx(2) + BW) / 2, 14, "CRP PERIOD", EY, GREY, weight="bold", ls=1.1))
    b.append(_t((bx(3) + bx(4) + BW) / 2, 14, "POST-CRP", EY, GREY, weight="bold", ls=1.1))

    stages = [("Year 1", "BUILD", GFILL), ("Year 2", "VALIDATE FREE", GFILL),
              ("Year 3", "MONETIZE", GFILL), ("Year 4", "EXPAND", "#ffffff"),
              ("Year 5", "SCALE", "#ffffff")]
    fitted = [B.fit(n, BW - 10, LB, "bold", ls=0.4) for _, n, _ in stages]
    nmax = max(len(l) for l, _ in fitted)
    BOXTOP = 26
    BOXH = 20 + nmax * LB * 1.18 + 8
    for i, (yr, name, fill) in enumerate(stages):
        b.append(_box(bx(i), BOXTOP, BW, BOXH, fill))
        b.append(_t(bx(i) + BW / 2, BOXTOP + 17, yr, S, GREY))
        lines, sz = fitted[i]
        for k, ln in enumerate(lines):
            b.append(_t(bx(i) + BW / 2, BOXTOP + 33 + k * sz * 1.18, ln, sz, TEAL,
                        weight="bold", ls=0.4))

    gy = BOXTOP + BOXH + 16
    gates = [("Readiness", "confirmed"), ("Configurations", "advance to paid"),
             ("Replication markets", "and financing close"), ("Expansion", "pace set")]
    maxlines = 0
    for i, (l1, l2) in enumerate(gates):
        x = gapx(i)
        cy = BOXTOP + BOXH / 2
        b.append(f'<path d="M{x} {cy-9} l9 9 l-9 9 l-9 -9 z" fill="#ffffff" '
                 f'stroke="{TEAL}" stroke-width="1.3"/>')
        b.append(_t(x, cy + S * 0.35, str(i + 1), S, TEAL, weight="bold"))
        room = BW + GAP - 6
        y = gy
        for txt, col, wt in ((l1, TEAL, "bold"), (l2, GREY, "normal")):
            lines, sz = B.fit(txt, room, S, wt)
            for k, ln in enumerate(lines):
                b.append(_t(x, y + k * sz * 1.15, ln, sz, col, weight=wt))
            y += len(lines) * sz * 1.15
        maxlines = max(maxlines, y)

    xc = gapx(2)
    H = maxlines + 24
    for y1, y2 in ((18, BOXTOP - 2), (BOXTOP + BOXH + 2, gy - S), (maxlines + 2, H - 14)):
        b.append(f'<line x1="{xc}" y1="{y1}" x2="{xc}" y2="{y2}" stroke="{GREY}" '
                 f'stroke-width="1.1" stroke-dasharray="4 3"/>')
    b.append(_t(xc, H - 4, "CRP RUNWAY ENDS", EY, GREY, weight="bold", ls=0.9))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------- FIGURE 10, the post-CRP growth flywheel
def fig10_flywheel():
    """3.68 x 2.68in. Right-floated. The virtuous counterpart to Figure 1.

    The ring shrinks and the artboard grows so the four labels sit at 9.5pt
    without touching the circles or the edges."""
    S = B.BODY
    W, H = 368, 268
    cx, cy, r, nr = 184, 138, 58, 20
    b = []
    import math
    for a0, a1 in ((-70, -20), (20, 70), (110, 160), (200, 250)):
        p0 = (cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0)))
        p1 = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
        b.append(f'<path d="M{p0[0]:.1f} {p0[1]:.1f} A {r} {r} 0 0 1 {p1[0]:.1f} {p1[1]:.1f}" '
                 f'fill="none" stroke="{TEAL}" stroke-width="1.5" marker-end="url(#sah)"/>')
    lead = S * 1.16
    nodes = [((cx, cy - r), ["More markets"], (cx, cy - r - nr - 16), "middle"),
             ((cx + r, cy), ["More revenue,", "more episodes"], (cx + r + nr + 6, cy), "start"),
             ((cx, cy + r), ["Institutional", "contracts"], (cx, cy + r + nr + 18), "middle"),
             ((cx - r, cy), ["Stronger", "evidence"], (cx - r - nr - 6, cy), "end")]
    for (x, y), lines, (lx, ly), anc in nodes:
        b.append(f'<circle cx="{x}" cy="{y}" r="{nr}" fill="{GFILL}" stroke="{TEAL}" '
                 f'stroke-width="1.4"/>')
        y0 = ly - (len(lines) - 1) * lead / 2 + S * 0.35
        for k, ln in enumerate(lines):
            b.append(_t(lx, y0 + k * lead, ln, S, TEAL, anchor=anc, weight="bold"))
    b.append(_t(cx, cy - 2, "PRIVATE", S, TEAL, weight="bold", ls=0.7))
    b.append(_t(cx, cy + lead - 2, "CAPITAL", S, TEAL, weight="bold", ls=0.7))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 5
def fig5():
    """7.2in wide. Five stages, and the source of capital each one earns.

    Wording is the live document's. Every label is wrapped to its column at
    9.5pt, and the boxes grow to whatever that needs."""
    S, LB = B.BODY, B.LABEL
    W, GX, RX = 720, 96, 88
    NC = 5
    CW = (W - GX) / NC
    def colx(i): return GX + CW * i
    def cx(i): return colx(i) + CW / 2
    inner = CW - 12

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
        (["SCALE"], "Post-CRP",
         ["Provider revenue", "Institutional contracts", "Private investment"],
         "#ffffff", "4 3"),
    ]
    heads = [[B.fit(n.replace('&amp;', '&'), inner, LB, "bold", ls=0.4) for n in names]
             for names, _, _, _, _ in stages]
    hmax = max(sum(len(l) for l, _ in h) for h in heads)
    bodies = [[B.fit(t, inner, S) for t in lines] for _, _, lines, _, _ in stages]
    bmax = max(sum(len(l) for l, _ in bset) for bset in bodies)

    TOP = 30
    HEADY = TOP + 14
    PERIODY = HEADY + hmax * LB * 1.15 + 4
    BODY0 = PERIODY + S * 1.5
    BOXH = BODY0 - TOP + bmax * S * 1.2 + 4
    b = []
    for i, (names, period, lines, fill, dash) in enumerate(stages):
        b.append(_box(colx(i) + 3, TOP, CW - 6, BOXH, fill, TEAL, 1.4, dash=dash))
        y = HEADY
        for wrapped, sz in heads[i]:
            for ln in wrapped:
                b.append(_t(cx(i), y, ln.replace('&', '&amp;'), sz, TEAL,
                            weight="bold", ls=0.4))
                y += sz * 1.15
        b.append(_t(cx(i), PERIODY, period, S, GREY, style="italic"))
        y = BODY0
        for wrapped, sz in bodies[i]:
            for ln in wrapped:
                b.append(_t(cx(i), y, ln, sz, INK)); y += sz * 1.2
        if i < NC - 1:
            x = colx(i + 1)
            b.append(f'<path d="M{x-6} {TOP+BOXH/2-4} l6 4 l-6 4" fill="none" '
                     f'stroke="{RULE}" stroke-width="1.4"/>')

    b.append(_t(RX, TOP + BOXH / 2, "STAGE", S, GREY, anchor="end", weight="bold", ls=0.9))

    CAPY = TOP + BOXH + 12
    capital = [["Founders and", "university programs"], ["NIA SBIR", "Phase I/II"],
               ["NIA SBIR", "Phase IIB"], ["NIA SBIR CRP"],
               ["Commercial revenue", "and private investment"]]
    capw = [[l for t in c for l in B.wrap(t, inner, S)] for c in capital]
    cmax = max(len(c) for c in capw)
    b.append(_t(RX, CAPY + 12, "SOURCE OF", S, GREY, anchor="end", weight="bold", ls=0.9))
    b.append(_t(RX, CAPY + 12 + S * 1.2, "CAPITAL", S, GREY, anchor="end",
                weight="bold", ls=0.9))
    for i, lines in enumerate(capw):
        b.append(f'<line x1="{colx(i)+3}" y1="{CAPY}" x2="{colx(i)+CW-3}" y2="{CAPY}" '
                 f'stroke="{TEAL}" stroke-width="1.1"/>')
        for k, ln in enumerate(lines):
            b.append(_t(cx(i), CAPY + 12 + k * S * 1.2, ln, S, INK))

    H = CAPY + 12 + cmax * S * 1.2 + 4
    x = colx(3)
    b.append(f'<line x1="{x}" y1="{TOP-8}" x2="{x}" y2="{H-2}" stroke="{GREY}" '
             f'stroke-width="1.1" stroke-dasharray="4 3"/>')
    b.append(_t(x - 5, TOP - 10, "TODAY", S, GREY, anchor="end", weight="bold", ls=0.9))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 6
def fig6():
    """7.2in wide. Capacity added behind validated demand, never ahead of it."""
    S, LB = B.BODY, B.LABEL
    W, GX, NC = 720, 8, 3
    CW = (W - 2 * GX) / NC
    def colx(i): return GX + CW * i
    def cx(i): return colx(i) + CW / 2
    heads = [("TODAY", "R&amp;D + early commercialization", GFILL,
              ["Founder-led multidisciplinary core",
               "Established engineering, operations, marketing &amp; research",
               "External senior specialists"]),
             ("DURING CRP", "Commercial validation", "#ffffff",
              ["Add dedicated capacity where validated demand creates bottlenecks",
               "Commercialization/customer success",
               "Operations &amp; data/compliance"]),
             ("POST-CRP", "Commercial scale", "#ffffff",
              ["Commercial revenue + private capital support mature functions",
               "Institutional accounts &amp; sales",
               "Customer success, operations, finance/compliance &amp; technical scale"])]
    bullet_w = CW - 34
    b, ymax = [], 0
    for i, (name, sub, fill, items) in enumerate(heads):
        b.append(f'<rect x="{colx(i)+3}" y="12" width="{CW-6}" height="{LB*2.6:.0f}" rx="3" '
                 f'fill="{fill}" stroke="none"/>')
        b.append(_t(cx(i), 12 + LB * 1.05, name, LB, TEAL, weight="bold", ls=1.0))
        b.append(_t(cx(i), 12 + LB * 2.25, sub.replace('&amp;', '&').replace('&', '&amp;'),
                    S, GREY, style="italic"))
        ruley = 12 + LB * 2.6 + 6
        b.append(f'<line x1="{colx(i)+3}" y1="{ruley}" x2="{colx(i)+CW-3}" y2="{ruley}" '
                 f'stroke="{TEAL}" stroke-width="1.1"/>')
        y = ruley + S * 1.4
        for it in items:
            lines = B.wrap(it.replace('&amp;', '&'), bullet_w, S)
            b.append(f'<circle cx="{colx(i)+12}" cy="{y-S*0.35}" r="2.4" fill="{TEAL}"/>')
            for k, ln in enumerate(lines):
                b.append(_t(colx(i) + 22, y + k * S * 1.2, ln.replace('&', '&amp;'),
                            S, INK, anchor="start"))
            y += len(lines) * S * 1.2 + 5
        ymax = max(ymax, y)
    for i in range(1, NC):
        b.append(f'<line x1="{colx(i)}" y1="14" x2="{colx(i)}" y2="{ymax-4}" '
                 f'stroke="{RULE}" stroke-width="0.6"/>')
    b.append(f'<line x1="{GX+3}" y1="6" x2="{colx(NC)-3}" y2="6" stroke="{RULE}" '
             f'stroke-width="1.2" marker-end="url(#sah)"/>')
    return _wrap(W / 100, (ymax + 2) / 100, "".join(b))


# ------------------------------------- FIGURE X, the local-market process
def market_process():
    """7.2in wide. Redraw of the live document's process strip.

    Seven boxes will not hold their labels on one row at 9.5pt, so the process
    runs four then three, with the flow returning at the row break."""
    S, LBL = B.BODY, B.LABEL
    W = 720.0
    steps = [("SELECT MARKET", "county-level opportunity signals"),
             ("BUILD LOCAL INFRASTRUCTURE", "providers + benefits + CareNavigator surfaces"),
             ("CONCENTRATE FAMILIES", "organic + community + digital channels"),
             ("ACTIVATE PROVIDERS", "listings → claims → self-service participation"),
             ("ADD WORKFORCE CAPACITY", "universities + applicants → Caregiver Staffing"),
             ("EXECUTE &amp; MEASURE", "care + staffing + cost + outcomes + revenue"),
             ("REPLICATE", "retain · refine · next market")]
    ROWS = [4, 3]
    GAP, ARROW = 10, 16
    b, y = [], 8
    idx = 0
    for r, n in enumerate(ROWS):
        CW = (W - 2 * GAP - (n - 1) * ARROW) / n
        inner = CW - 14
        group = steps[idx:idx + n]
        fitted = []
        for head, sub in group:
            hl, hs = B.fit(head.replace('&amp;', '&'), inner, LBL, "bold", ls=0.4)
            sl = B.wrap(sub, inner, S)
            fitted.append((hl, hs, sl))
        nh = max(len(h) for h, _, _ in fitted)
        ns = max(len(s2) for _, _, s2 in fitted)
        BH = 10 + nh * LBL * 1.15 + 6 + ns * S * 1.18 + 8
        x = GAP
        for k, ((hl, hs, sl), _) in enumerate(zip(fitted, group)):
            b.append(_box(x, y, CW, BH, GFILL, TEAL, 1.4, rx=4))
            yy = y + 10 + hs * 0.85
            for ln in hl:
                b.append(_t(x + CW / 2, yy, ln.replace('&', '&amp;'), hs, TEAL,
                            weight="bold", ls=0.4))
                yy += hs * 1.15
            yy = y + 10 + nh * LBL * 1.15 + 6 + S * 0.85
            for ln in sl:
                b.append(_t(x + CW / 2, yy, ln, S, INK)); yy += S * 1.18
            x += CW
            if k < n - 1:
                b.append(f'<path d="M{x+3} {y+BH/2-5} l9 5 l-9 5 z" fill="{RULE}"/>')
                x += ARROW
        idx += n
        if r < len(ROWS) - 1:
            b.append(f'<path d="M{W/2-5} {y+BH+3} l10 0 l-5 8 z" fill="{RULE}"/>')
            y += BH + 16
        else:
            y += BH + 10
    meas = ("CRP measures: acquisition cost · activation · workforce acquisition · "
            "care establishment · paid conversion · retention · market economics")
    ml = B.wrap(meas, W - 40, S, "bold")
    SBH = 8 + len(ml) * S * 1.2 + 6
    b.append(_box(0, y, W, SBH, "#ffffff", TEAL, 1.2, rx=4))
    for k, ln in enumerate(ml):
        b.append(_t(W / 2, y + 8 + S * 0.85 + k * S * 1.2, ln, S, TEAL, weight="bold"))
    return _wrap(W / 100, (y + SBH + 4) / 100, "".join(b))


# ------------------------------------------ FIGURE X, organic traffic growth
def organic():
    """3.3 x 2.4in. Right-floated. Redraw of the live document's traffic chart."""
    S = B.BODY
    W, H = 330, 240
    L, R, TOP, BOT = 46, 322, 74, 186
    VMAX = 560.0
    pts = [(2023.0, 50), (2023.4, 68), (2023.8, 92), (2024.2, 124), (2024.6, 165),
           (2025.0, 218), (2025.4, 292), (2025.7, 372), (2026.0, 500)]
    def px(yr): return L + (yr - 2023.0) / 3.0 * (R - L)
    def py(v):  return BOT - (v / VMAX) * (BOT - TOP)
    b = []
    b.append(_t(2, 16, "Organic visitors per day", B.LABEL, INK, anchor="start", weight="bold"))
    y = 16 + B.LABEL * 1.35
    for ln in B.wrap("zero paid acquisition · search infrastructure built from zero",
                     W - 6, S):
        b.append(_t(2, y, ln, S, GREY, anchor="start")); y += S * 1.18
    for g, lab in ((0, "0"), (250, "250"), (500, "500+")):
        yy = py(g)
        b.append(f'<line x1="{L}" y1="{yy:.1f}" x2="{R}" y2="{yy:.1f}" stroke="{RULE}" '
                 f'stroke-width="{1.0 if g == 0 else 0.5}"/>')
        b.append(_t(L - 6, yy + S * 0.35, lab, S, GREY, anchor="end"))
    b.append(f'<line x1="{L}" y1="{TOP-6}" x2="{L}" y2="{py(0):.1f}" stroke="{RULE}" '
             f'stroke-width="1.0"/>')
    for yr in (2023, 2024, 2025, 2026):
        x = min(px(yr), W - B.w("2026", S) / 2 - 2)
        b.append(_t(x, BOT + S * 1.5, str(yr), S, GREY))
    poly = " ".join(f"{px(x):.1f},{py(v):.1f}" for x, v in pts)
    b.append(f'<polygon points="{px(2023.0):.1f},{py(0):.1f} {poly} '
             f'{px(2026.0):.1f},{py(0):.1f}" fill="{GFILL}" stroke="none"/>')
    b.append(f'<polyline points="{poly}" fill="none" stroke="{TEAL}" stroke-width="1.8" '
             f'stroke-linejoin="round" stroke-linecap="round"/>')
    b.append(f'<circle cx="{px(2023.0):.1f}" cy="{py(50):.1f}" r="3.4" fill="{TEAL}"/>')
    b.append(_t(px(2023.0) + B.w("≈50/day (2023)", S, "bold") / 2 + 8, py(50) - 8,
                "≈50/day (2023)", S, INK, weight="bold"))
    b.append(f'<circle cx="{px(2026.0):.1f}" cy="{py(500):.1f}" r="3.4" fill="{TEAL}"/>')
    b.append(_t(px(2026.0) - B.w("500+/day (2026)", S, "bold") / 2 - 6, py(500) - 10,
                "500+/day (2026)", S, INK, weight="bold"))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 2
def fig2():
    """7.2in wide. Six-step spine with a phase boundary above."""
    S, LB = B.BODY, B.LABEL
    from figs_son import (I_ASSESS, I_IDENTIFY, I_FUND, I_STAFF, I_EXECUTE,
                          I_ESTABLISH, I_OUTCOMES)
    W = 720
    labels = ["Assess Needs", "Identify Care", "Fund Care",
              "Staff Care", "Execute Plan", "Establish Care"]
    icons = [I_ASSESS, I_IDENTIFY, I_FUND, I_STAFF, I_EXECUTE, I_ESTABLISH]
    tail = 86                                     # room for the outcomes stub
    step = (W - 30 - tail) / len(labels)
    xs = [22 + step * i + step / 2 for i in range(len(labels))]
    spine = 92
    b = []
    bands = [(14, xs[2] + step / 2 - 8, "PRIOR NIA R&amp;D", GREY),
             (xs[2] + step / 2 + 8, xs[5] + step / 2, "CRP R&amp;D AND VALIDATION", TEAL)]
    for x0, x1, txt, col in bands:
        b.append(f'<path d="M{x0} 30 v-8 H{x1} v8" fill="none" stroke="{col}" '
                 f'stroke-width="0.9"/>')
        b.append(_t((x0 + x1) / 2, 16, txt, S, col, weight="bold", ls=0.9))
    b.append(f'<line x1="14" y1="{spine}" x2="{xs[-1] + step/2 + 14}" y2="{spine}" '
             f'stroke="{RULE}" stroke-width="1.1"/>')
    for i, (x, lab, ic) in enumerate(zip(xs, labels, icons)):
        b.append(_icon(x - 14.4, 40, ic, scale=1.2, sw=1.5))
        b.append(f'<circle cx="{x}" cy="{spine}" r="4.6" fill="{TEAL}"/>')
        lines, sz = B.fit(lab, step - 6, LB, "bold")
        for k, ln in enumerate(lines):
            b.append(_t(x, spine + 20 + k * sz * 1.15, ln, sz, TEAL, weight="bold"))
        if i < len(xs) - 1:
            b.append(f'<line x1="{x + 12}" y1="{spine}" x2="{xs[i+1] - 14}" y2="{spine}" '
                     f'stroke="{TEAL}" stroke-width="1.3" marker-end="url(#sah)"/>')
    b.append(_t(xs[3], spine + 20 + LB * 1.15 + S * 1.1, "capacity when needed",
                S, GREY, style="italic"))
    ox = xs[-1] + step / 2
    b.append(f'<line x1="{ox+4}" y1="{spine}" x2="{ox+30}" y2="{spine}" stroke="{GREY}" '
             f'stroke-width="1.1" stroke-dasharray="3.4 2.8" marker-end="url(#sagr)"/>')
    b.append(_icon(ox + 38, 80, I_OUTCOMES, scale=0.82, color=GREY, sw=1.5))
    b.append(_t(ox + 48, spine + 22, "Outcomes", S, GREY, weight="bold"))
    b.append(_t(ox + 48, spine + 22 + S * 1.18, "tracked", S, GREY, weight="bold"))
    H = spine + 22 + S * 1.18 + S * 1.2 + 6
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 7
def fig7():
    """7.2in wide. Two markets from one pathway, on the same vertical logic.

    Shaded terminal = revenue available today; unshaded = gated by evidence."""
    S, NAME, EY = B.BODY, 12.0 * B.U, B.BODY
    W = 720
    LX0, LX1, RX0, RX1 = 8, 352, 368, 712
    cols = [
        (LX0, LX1, "BEACHHEAD", "Caregiver Staffing",
         [("4.68M home health and personal care aides", None),
          ("760,500 openings a year; 18% growth to 2035", "arrow"),
          ("75% median home-care caregiver turnover", "arrow"),
          ("Recurring provider need to recruit and staff cases", "arrow"),
          ("CRP proves repeatable acquisition, placement, willingness to pay, "
           "and unit economics", "arrow")],
         "NEAR-TERM PROVIDER REVENUE", GFILL),
        (RX0, RX1, "EMERGING", "Institutional market",
         [("35.2M Medicare Advantage beneficiaries", None),
          ("14.3M Medicare beneficiaries in accountable care", "plus"),
          ("Medicaid MLTSS and other risk-bearing populations", "plus"),
          ("Organizations exposed to downstream utilization", "arrow"),
          ("CRP generates care-establishment, longitudinal outcomes, "
           "and economic evidence", "arrow")],
         "INSTITUTIONAL CONTRACTING PATHWAY", "#ffffff"),
    ]
    # lay both columns on the same vertical rhythm, driven by the taller one
    plans = []
    for x0, x1, eyebrow, name, rows, terminal, tfill in cols:
        inner = x1 - x0 - 10
        plans.append([(B.wrap(t, inner, S), j) for t, j in rows])
    heights = []
    for plan in plans:
        h = 0
        for lines, j in plan:
            h += (22 if j else 0) + len(lines) * S * 1.2 + 6
        heights.append(h)
    b = []
    ymax = 0
    for (x0, x1, eyebrow, name, rows, terminal, tfill), plan in zip(cols, plans):
        cx = (x0 + x1) / 2
        b.append(_t(cx, 18, eyebrow, EY, GREY, weight="bold", ls=1.1))
        b.append(_t(cx, 18 + NAME * 1.25, name, NAME, TEAL, weight="bold"))
        ry = 18 + NAME * 1.25 + 10
        b.append(f'<line x1="{x0}" y1="{ry}" x2="{x1}" y2="{ry}" stroke="{TEAL}" '
                 f'stroke-width="1.1"/>')
        y = ry + 20
        for lines, j in plan:
            if j == "arrow":
                b.append(f'<path d="M{cx} {y-19} v9" stroke="{RULE}" stroke-width="1.2" '
                         f'marker-end="url(#sagr)"/>')
            elif j == "plus":
                b.append(_t(cx, y - 15, "+", B.LABEL, GREY, weight="bold"))
            for k, ln in enumerate(lines):
                b.append(_t(cx, y + k * S * 1.2, ln, S, INK))
            y += len(lines) * S * 1.2 + 24
        ymax = max(ymax, y)
    for (x0, x1, eyebrow, name, rows, terminal, tfill), plan in zip(cols, plans):
        cx = (x0 + x1) / 2
        b.append(f'<path d="M{cx} {ymax-20} v10" stroke="{RULE}" stroke-width="1.2" '
                 f'marker-end="url(#sagr)"/>')
        lines, sz = B.fit(terminal, x1 - x0 - 12, S, "bold", ls=0.8)
        th = 12 + len(lines) * sz * 1.15
        b.append(f'<rect x="{x0}" y="{ymax-2}" width="{x1-x0}" height="{th}" rx="3" '
                 f'fill="{tfill}" stroke="{TEAL}" stroke-width="1.3"/>')
        for k, ln in enumerate(lines):
            b.append(_t(cx, ymax + 10 + k * sz * 1.15, ln, sz, TEAL, weight="bold", ls=0.8))
    H = ymax + 12 + S * 1.15 + 8
    b.insert(0, f'<line x1="360" y1="14" x2="360" y2="{H-6}" stroke="{RULE}" '
                f'stroke-width="0.6"/>')
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 8
def fig8():
    """7.2in wide. Four static protections, then a barrier that grows."""
    S, T = B.BODY, B.LABEL
    W, GAPX = 720, 16
    CW = (W - 16 - GAPX) / 2
    cells = [
        ("TRADE SECRETS",
         "Workflow orchestration, execution logic, data normalization and "
         "quality-control methods, derived variables, operating processes"),
        ("COPYRIGHT",
         "Source code, interfaces, original content, documentation"),
        ("TRADEMARK",
         "Olera and product names, marks, and brand identity"),
        ("CONTRACTUAL AND TECHNICAL CONTROLS",
         "Confidentiality and IP assignment, controlled API and data use, "
         "role-based access, partner and contractor restrictions"),
    ]
    inner = CW - 20
    fitted = [(B.fit(t, inner, S, "bold", ls=0.9), B.wrap(d, inner, S)) for t, d in cells]
    rowh = []
    for r in (0, 2):
        n = max(len(fitted[r][0][0]) * 1 for _ in (0,))
        nt = max(len(fitted[r][0][0]), len(fitted[r + 1][0][0]))
        nd = max(len(fitted[r][1]), len(fitted[r + 1][1]))
        rowh.append(12 + nt * S * 1.15 + 8 + nd * S * 1.18 + 10)
    b, y = [], 20
    for r in (0, 2):
        h = rowh[r // 2]
        for c in (0, 1):
            x = 8 + c * (CW + GAPX)
            (tl, ts), dl = fitted[r + c]
            b.append(_box(x, y, CW, h))
            cx = x + CW / 2
            yy = y + 12 + ts * 0.85
            for ln in tl:
                b.append(_t(cx, yy, ln, ts, TEAL, weight="bold", ls=0.9)); yy += ts * 1.15
            yy = y + 12 + len(tl) * ts * 1.15 + 8 + S * 0.85
            for ln in dl:
                b.append(_t(cx, yy, ln, S, INK)); yy += S * 1.18
        y += h + 12

    y += 8
    lab = "CUMULATIVE TEMPORAL BARRIER"
    lw = B.w(lab, S, "bold", 1.2)
    b.append(f'<line x1="8" y1="{y}" x2="{360-lw/2-14}" y2="{y}" stroke="{RULE}" '
             f'stroke-width="0.9"/>')
    b.append(f'<line x1="{360+lw/2+14}" y1="{y}" x2="712" y2="{y}" stroke="{RULE}" '
             f'stroke-width="0.9"/>')
    b.append(_t(360, y + S * 0.35, lab, S, GREY, weight="bold", ls=1.2))
    y += 20

    rows = [(8, 408, GFILL, "Before the CRP",
             "Family distribution, national provider and benefits infrastructure, "
             "provider and workforce relationships"),
            (8, 704, "#ffffff", "Added during the CRP",
             "Execution history, county-level pathway performance, "
             "care-establishment and outcomes records")]
    LABW = max(B.w(l, S, "bold") for _, _, _, l, _ in rows) + 24
    for x, w, fill, label, desc in rows:
        dl = B.wrap(desc, w - LABW - 16, S)
        h = 10 + len(dl) * S * 1.18 + 8
        b.append(_box(x, y, w, h, fill))
        b.append(_t(x + 12, y + h / 2 + S * 0.35, label, S, TEAL, anchor="start", weight="bold"))
        yy = y + 10 + S * 0.85
        for ln in dl:
            b.append(_t(x + LABW, yy, ln, S, INK, anchor="start")); yy += S * 1.18
        y += h + 10

    y += 6
    note = "time, data, relationships, and operating experience required to replicate"
    nl = B.wrap(note, 330, S)
    b.append(f'<path d="M8 {y} h352" fill="none" stroke="{RULE}" stroke-width="1.2" '
             f'marker-end="url(#sagr)"/>')
    for k, ln in enumerate(nl):
        b.append(_t(374, y + S * 0.35 + k * S * 1.18, ln, S, GREY, anchor="start",
                    style="italic"))
    H = y + len(nl) * S * 1.18 + 8
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------ FIGURE 10, the financing transition band
def fig9():
    """7.2in wide. When each source of capital enters, and when each stops."""
    S, LB = B.BODY, B.LABEL
    W = 720
    rows_def = [
        ("Federal CRP capital", [(0, 3, GFILL, None, "Approximately $4M over three years")]),
        ("Caregiver Staffing revenue", [(0.5, 4, "#ffffff", None,
                                         "Begins during the award, grows with each market")]),
        ("Third-party private capital", [(1, 2.85, "#ffffff", "4 3", "Cultivate, then raise"),
                                         (2.85, 4, GFILL, None, "Capital in hand")]),
        ("Institutional revenue", [(3, 4, "#ffffff", "4 3", "After the evidence lands")]),
    ]
    RX = max(B.w(l, S, "bold") for l, _ in rows_def) + 14
    GX = RX + 8
    CW = (W - GX - 4) / 4.0
    def colx(t): return GX + CW * t
    END = colx(3)
    b = []
    for i, lab in enumerate(["Year 1", "Year 2", "Year 3", "Post-CRP"]):
        b.append(_t(colx(i) + CW / 2, 16, lab, LB, TEAL, weight="bold"))
    b.append(f'<line x1="{GX}" y1="24" x2="{colx(4)}" y2="24" stroke="{TEAL}" stroke-width="1.1"/>')

    nmax = 1
    for _, bars in rows_def:
        for x0, x1, _f, _d, text in bars:
            nmax = max(nmax, len(B.fit(text, colx(x1) - colx(x0) - 10, S)[0]))
    BARH = 12 + nmax * S * 1.25
    y = 34
    for label, bars in rows_def:
        for x0, x1, fill, dash, text in bars:
            b.append(_box(colx(x0), y, colx(x1) - colx(x0), BARH, fill, TEAL, 1.3, dash=dash))
        b.append(_t(RX, y + BARH / 2 + S * 0.35, label, S, TEAL, anchor="end", weight="bold"))
        for x0, x1, fill, dash, text in bars:
            room = colx(x1) - colx(x0) - 10
            lines, sz = B.fit(text, room, S)
            yy = y + BARH / 2 - (len(lines) - 1) * sz * 0.6 + sz * 0.35
            for ln in lines:
                b.append(_t((colx(x0) + colx(x1)) / 2, yy, ln, sz, INK)); yy += sz * 1.18
        y += BARH + 12
    for i in range(1, 4):
        b.append(f'<line x1="{colx(i)}" y1="26" x2="{colx(i)}" y2="{y-8}" stroke="{RULE}" '
                 f'stroke-width="0.6"/>')
    b.append(f'<line x1="{END}" y1="30" x2="{END}" y2="{y-2}" stroke="{GREY}" '
             f'stroke-width="1.2" stroke-dasharray="4 3"/>')
    b.append(_t(END - 6, y + S * 0.9, "CRP RUNWAY ENDS", S, GREY, anchor="end",
                weight="bold", ls=0.9))
    H = y + S * 1.5
    return _wrap(W / 100, H / 100, "".join(b))


# ----------------------------------------------------------------- FIGURE 11
def fig11():
    """7.2in wide. The unit is stated; only the replication series is charted."""
    from figs_s7 import _hbar, S_NEAR
    S, LB = B.BODY, B.LABEL
    W = 720
    SPLIT = 268
    b = []
    b.append(_t(8, 20, "THE UNIT, HELD CONSTANT", S, GREY, anchor="start",
                weight="bold", ls=1.0))
    b.append(_t(8, 20 + 26 * B.U, "$30,000", 26 * B.U, INK, anchor="start", weight="bold"))
    y = 20 + 26 * B.U + S * 1.5
    b.append(_t(8, y, "a year, from one county", S, INK, anchor="start")); y += S * 1.3
    b.append(_t(8, y, "10 successful hires a month at $250 each", S, GREY, anchor="start"))
    y += 12
    b.append(f'<line x1="8" y1="{y}" x2="{SPLIT-24}" y2="{y}" stroke="{RULE}" stroke-width="0.8"/>')
    y += S * 1.5
    b.append(_t(8, y, "Eight CRP markets", S, TEAL, anchor="start", weight="bold"))
    b.append(_t(SPLIT - 24, y, "$240,000 a year", S, INK, anchor="end"))
    y += S * 1.9
    b.append(_t(8, y, "Excluded from the forecast", S, GREY, anchor="start", style="italic"))
    y += S * 1.35
    for lab, val in (("at 20 hires a month", "$480,000"), ("at 30 hires a month", "$720,000")):
        b.append(_t(8, y, lab, S, GREY, anchor="start"))
        b.append(_t(SPLIT - 24, y, val, S, GREY, anchor="end"))
        y += S * 1.3
    left_bottom = y

    b.append(_t(SPLIT + 12, 20, "POST-CRP REPLICATION, SAME 10 HIRES A MONTH", S, GREY,
                anchor="start", weight="bold", ls=1.0))
    rows = [("100 counties", "12,000 hires", 3.0, "$3.0M"),
            ("250 counties", "30,000 hires", 7.5, "$7.5M"),
            ("500 counties", "60,000 hires", 15.0, "$15M")]
    LABW = max(B.w(l, S, "bold") for l, _, _, _ in rows)
    X0 = SPLIT + 12 + LABW + 16
    XMAX = W - 8 - B.w("$15M", S, "bold") - 12
    VMAX = 15.0
    ROWH = 2 * S * 1.25 + 16
    for i, (lab, hires, val, vlab) in enumerate(rows):
        yy = 36 + i * ROWH
        b.append(_t(SPLIT + 12, yy + S * 1.05, lab, S, TEAL, anchor="start", weight="bold"))
        b.append(_t(SPLIT + 12, yy + S * 2.3, hires, S, GREY, anchor="start"))
        w = (XMAX - X0) * val / VMAX
        bh = S * 1.5
        b.append(_hbar(X0, yy + S * 0.7, w, bh, S_NEAR))
        b.append(_t(X0 + w + 8, yy + S * 0.7 + bh / 2 + S * 0.35, vlab, S, INK,
                    anchor="start", weight="bold"))
    chart_bottom = 36 + len(rows) * ROWH
    b.append(f'<line x1="{X0}" y1="30" x2="{X0}" y2="{chart_bottom-4}" stroke="{RULE}" '
             f'stroke-width="0.8"/>')
    note = "annual Caregiver Staffing revenue, institutional revenue excluded"
    nl = B.wrap(note, W - X0 - 8, S)
    for k, ln in enumerate(nl):
        b.append(_t(X0, chart_bottom + 10 + k * S * 1.18, ln, S, GREY, anchor="start",
                    style="italic"))
    H = max(left_bottom, chart_bottom + 10 + len(nl) * S * 1.18) + 6
    b.insert(0, f'<line x1="{SPLIT}" y1="12" x2="{SPLIT}" y2="{H-8}" stroke="{RULE}" '
                f'stroke-width="0.6"/>')
    return _wrap(W / 100, H / 100, "".join(b))


# ----------------------------------------------------------------- FIGURE 12
def fig12():
    """7.2in wide. Five-year revenue, stacked, two series."""
    from figs_s7 import _bar, S_NEAR, S_LATER
    S, LB = B.BODY, B.LABEL
    W = 720
    years = [("CRP Y1", "Build", 0, 0), ("CRP Y2", "Validate free", 0, 0),
             ("CRP Y3", "Monetize", 120, 0), ("Post-CRP Y4", "Expand", 450, 150),
             ("Post-CRP Y5", "Scale", 750, 750)]
    NC = len(years)
    GX = max(B.w("$1.5M", S) for _ in (0,)) + 24
    CW = (W - GX - 6) / NC
    def cx(i): return GX + CW * i + CW / 2
    PLOT, VMAX = 148, 1500.0
    BASE = 34 + PLOT
    b = []
    for g, lab in [(0, "$0"), (500, "$0.5M"), (1000, "$1.0M"), (1500, "$1.5M")]:
        y = BASE - PLOT * g / VMAX
        b.append(f'<line x1="{GX-6}" y1="{y}" x2="{GX+CW*NC}" y2="{y}" stroke="{RULE}" '
                 f'stroke-width="{0.9 if g == 0 else 0.5}"/>')
        b.append(_t(GX - 12, y + S * 0.35, lab, S, GREY, anchor="end"))
    BW = min(58, CW - 26)
    for i, (yr, stage, staff, inst) in enumerate(years):
        x = cx(i) - BW / 2
        hs = PLOT * staff / VMAX
        hi = PLOT * inst / VMAX
        if staff:
            b.append(_bar(x, BASE - hs, BW, hs, S_NEAR, r=0 if inst else 4))
        if inst:
            b.append(_bar(x, BASE - hs - hi - 2, BW, hi, S_LATER))
        tot = staff + inst
        b.append(_t(cx(i), BASE - hs - hi - (12 if tot else 7),
                    "$0" if not tot else (f"${tot/1000:.2f}M" if tot >= 1000 else f"${tot}K"),
                    S, INK, weight="bold"))
        b.append(_t(cx(i), BASE + S * 1.5, yr, S, TEAL, weight="bold"))
        b.append(_t(cx(i), BASE + S * 2.8, stage, S, GREY, style="italic"))
    xend = GX + CW * 3
    b.append(f'<line x1="{xend}" y1="26" x2="{xend}" y2="{BASE + S*3.4}" stroke="{GREY}" '
             f'stroke-width="1.1" stroke-dasharray="4 3"/>')
    b.append(_t(xend - 6, 22, "CRP ENDS", S, GREY, anchor="end", weight="bold", ls=0.9))
    ly = BASE + S * 4.6
    x = GX
    for lab, col in (("Caregiver Staffing", S_NEAR), ("Institutional", S_LATER)):
        b.append(f'<rect x="{x}" y="{ly-S*0.75}" width="11" height="10" rx="2" fill="{col}"/>')
        b.append(_t(x + 16, ly, lab, S, INK, anchor="start"))
        x += 16 + B.w(lab, S) + 30
    return _wrap(W / 100, (ly + S * 0.8) / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 3
def fig3():
    """7.2in wide. The valley, with the right wall climbing from Year 3.

    Terrain and copy are laid out from the measured width of the two plateau
    blocks, so the red label always has clear air above the basin."""
    S, HEAD, RED_S = B.BODY, 12.0 * B.U, 13.0 * B.U
    W = 720
    b = []
    plate = [
        ("start", 8, "TODAY", "Demonstrated demand", TEAL,
         ["15,500+ monthly visitors", "CareNavigator usability validated",
          "Staffing willingness to pay shown"]),
        ("end", 712, "AT CRP COMPLETION", "Commercial sustainability", GREEN,
         ["Repeatable provider revenue", "Institutional evidence package",
          "Positioned for private investment"])]
    y = 16
    for anchor, x0, eyebrow, head, hcol, lines in plate:
        b.append(_t(x0, y, eyebrow, S, GREY, anchor=anchor, weight="bold", ls=1.0))
        b.append(_t(x0, y + HEAD * 1.25, head, HEAD, hcol, anchor=anchor, weight="bold"))
        yy = y + HEAD * 1.25 + S * 1.6
        for ln in lines:
            b.append(_t(x0, yy, ln, S, GREY, anchor=anchor)); yy += S * 1.25
    TOPLINE = y + HEAD * 1.25 + S * 1.6 + 3 * S * 1.25 + 8

    BASIN = TOPLINE + 64
    FLOOR = BASIN + 12
    CLIMB = 402
    ridge = (f"M8 {TOPLINE} H126 C 182 {TOPLINE}, 202 {BASIN}, 256 {BASIN+2} "
             f"C 306 {BASIN+3}, 360 {BASIN+3}, {CLIMB} {BASIN} "
             f"C 482 {BASIN-7}, 546 {BASIN-27}, 602 {BASIN-46} "
             f"C 650 {BASIN-61}, 682 {BASIN-70}, 712 {TOPLINE+2}")
    b.append(f'<path d="{ridge} V{FLOOR} H8 Z" fill="{GFILL}" stroke="none"/>')
    b.append(f'<path d="{ridge}" fill="none" stroke="{TEAL}" stroke-width="1.4"/>')

    b.append(_t(300, BASIN - 26, "VALLEY OF DEATH", RED_S, RED, weight="bold", ls=1.4))
    b.append(f'<line x1="{CLIMB}" y1="{BASIN-38}" x2="{CLIMB}" y2="{BASIN-1}" '
             f'stroke="{GREY}" stroke-width="1.1" stroke-dasharray="4 3"/>')
    b.append(_t(CLIMB + 8, BASIN - 40 - S * 1.25, "YEAR 3", S, GREY, anchor="start",
                weight="bold", ls=0.9))
    b.append(_t(CLIMB + 8, BASIN - 40, "paid testing begins", S, GREY, anchor="start",
                style="italic"))

    strip = FLOOR + S * 1.7
    b.append(_t(360, strip, "THE FIVE REMAINING RISKS, RETIRED IN SEQUENCE", S, GREY,
                weight="bold", ls=0.8))
    risks = ["Technical", "Validation", "Evidence", "Commercial", "Financing"]
    rw = [B.w(r, S, "bold") for r in risks]
    span = sum(rw) + 34 * (len(risks) - 1)
    x = (W - span) / 2
    ty = strip + S * 2.2
    centres = []
    for i, r in enumerate(risks):
        cxx = x + rw[i] / 2
        centres.append(cxx)
        x += rw[i] + 34
    b.append(f'<line x1="{centres[0]-22}" y1="{ty}" x2="{centres[-1]+30}" y2="{ty}" '
             f'stroke="{TEAL}" stroke-width="1.3" marker-end="url(#sah)"/>')
    for i, (r, cxx) in enumerate(zip(risks, centres)):
        b.append(f'<circle cx="{cxx}" cy="{ty}" r="{S*0.72:.1f}" fill="#ffffff" '
                 f'stroke="{TEAL}" stroke-width="1.3"/>')
        b.append(_t(cxx, ty + S * 0.35, str(i + 1), S, TEAL, weight="bold"))
        b.append(_t(cxx, ty + S * 1.9, r, S, TEAL, weight="bold"))
    H = ty + S * 1.9 + S * 0.35
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 4
def fig4():
    """7.2in wide. One grid, three altitudes: one family, the system, one county.

    Shaded = exists today, unshaded = built by the CRP, in both the family and
    system registers. The county register is grey throughout and labelled
    illustrative, because every number in it is hypothetical."""
    from figs_s2 import _box as _b2
    from figs_son import I_IDENTIFY, I_EXECUTE, I_STAFF, I_OUTCOMES
    S, LB = B.BODY, B.LABEL
    W, NC = 720, 7
    steps = ["Assess Needs", "Identify Care", "Fund Care", "Staff Care",
             "Execute Plan", "Establish Care", "Track Outcomes"]
    rails = [("One family", "what the app says"), ("The system", "what does the work"),
             ("One county", "ILLUSTRATIVE ONLY")]
    RAIL = max(max(B.w(a, LB, "bold"), B.w(c, S, "bold")) for a, c in rails) + 10
    GX = RAIL + 8
    CW = (W - GX - 4) / NC
    GR = GX + CW * NC
    def colx(i): return GX + CW * i
    def cx(i): return colx(i) + CW / 2
    inner = CW - 12
    b = []

    head = [B.wrap(s, inner, LB, "bold") for s in steps]
    nh = max(len(h) for h in head)
    for i, lines in enumerate(head):
        for k, ln in enumerate(lines):
            b.append(_t(cx(i), 14 + k * LB * 1.15, ln, LB, TEAL, weight="bold"))
    RULE1 = 13 + nh * LB * 1.15 + 1
    b.append(f'<line x1="{GX}" y1="{RULE1}" x2="{GR}" y2="{RULE1}" stroke="{TEAL}" '
             f'stroke-width="1.1"/>')

    def rail(y, name, sub, subbold=False):
        b.append(_t(RAIL, y, name, LB, TEAL, anchor="end", weight="bold"))
        b.append(_t(RAIL, y + LB * 1.2, sub, S, GREY, anchor="end",
                    weight="bold" if subbold else "normal"))

    # --- register 1, the family -------------------------------------------
    says = [(0, "Who are you caring for?", True),
            (1, "Here is what your mother needs", True),
            (2, "You may qualify for three programs", True),
            (4, "Your VA application was filed", False),
            (5, "Care starts Tuesday", False),
            (6, "How has the first month gone?", False)]
    wrapped = [(i, B.wrap(t, inner - 6, S), live) for i, t, live in says]
    nb = max(len(l) for _, l, _ in wrapped)
    BUBH = 5 + nb * S * 1.2
    BUBY = RULE1 + 6
    b.append(f'<line x1="{GX+4}" y1="{BUBY+BUBH/2}" x2="{GR-4}" y2="{BUBY+BUBH/2}" '
             f'stroke="{RULE}" stroke-width="1"/>')
    for i, lines, live in wrapped:
        b.append(f'<rect x="{colx(i)+4}" y="{BUBY}" width="{CW-8}" height="{BUBH}" rx="5" '
                 f'fill="{GFILL if live else "#ffffff"}" stroke="{TEAL}" stroke-width="1.3"/>')
        y0 = BUBY + (BUBH - (len(lines) - 1) * S * 1.2) / 2 + S * 0.35
        for k, ln in enumerate(lines):
            b.append(_t(cx(i), y0 + k * S * 1.2, ln, S, INK))
    rail(BUBY + BUBH / 2 - LB * 0.1, *rails[0])
    SEP1 = BUBY + BUBH + 6
    b.append(f'<line x1="0" y1="{SEP1}" x2="{GR}" y2="{SEP1}" stroke="{RULE}" stroke-width="0.9"/>')

    # --- register 2, the system -------------------------------------------
    bands = [(0, 3, GFILL, I_IDENTIFY, "Assessment and matching", "Phase I to IIB",
              "Screening and matching over the national resource database"),
             (2, 6, "#ffffff", I_EXECUTE, "AI execution layer", "CRP",
              "Applications, documents, follow-up, intake, and confirmation of care"),
             (3, 4, "#ffffff", I_STAFF, "Caregiver Staffing", "CRP",
              "New caregivers placed with licensed providers, only when capacity "
              "blocks an appropriate plan"),
             (0, 7, "#ffffff", I_OUTCOMES, "Longitudinal outcomes layer", "CRP",
              "Case status, failure points, care established, and subsequent outcomes")]
    y = SEP1 + 6
    plan = []
    for c0, c1, fill, icon, lead, tag, desc in bands:
        span = colx(c1) - colx(c0)
        narrow = span < 200                       # too tight to hold the copy inside
        room = (span - 44) if not narrow else (W - colx(c1) - 14)
        dl = B.wrap(desc, room, S)
        h = max(30, 10 + S * 1.15 + len(dl) * S * 1.18 + 8) if not narrow else 34
        plan.append((c0, c1, fill, icon, lead, tag, dl, h, narrow, room))
    for c0, c1, fill, icon, lead, tag, dl, h, narrow, room in plan:
        x0, x1 = colx(c0), colx(c1)
        b.append(_b2(x0, y, x1 - x0, h, fill, TEAL))
        if narrow:
            b.append(_icon(x0 + (x1 - x0 - 24) / 2, y + (h - 24) / 2, icon, 1.0, TEAL, 1.5))
            tx, ty = x1 + 10, y + S * 1.1
        else:
            b.append(_icon(x0 + 8, y + (h - 24) / 2, icon, 1.0, TEAL, 1.5))
            tx, ty = x0 + 38, y + 10 + S * 0.85
        b.append(_t(tx, ty, lead, S, TEAL, anchor="start", weight="bold"))
        b.append(_t(tx + B.w(lead, S, "bold") + 10, ty, tag, S, GREY, anchor="start"))
        for k, ln in enumerate(dl):
            b.append(_t(tx, ty + (k + 1) * S * 1.18, ln, S, INK, anchor="start",
                        style="italic" if narrow else "normal"))
        y += max(h, S * 1.15 + len(dl) * S * 1.18 + 7) + 4
    rail((SEP1 + y) / 2 - LB, *rails[1])
    SEP2 = y + 1
    b.append(f'<line x1="0" y1="{SEP2}" x2="{GR}" y2="{SEP2}" stroke="{RULE}" stroke-width="0.9"/>')

    # --- register 3, what accumulates -------------------------------------
    NUM = 12.5 * B.U
    ny = SEP2 + 10 + NUM * 0.8
    cascade = [(0, 1200, "families", "assessed"), (1, 780, "matched to", "home care"),
               (2, 510, "funding", "identified"), (4, 390, "applications", "completed"),
               (5, 281, "care", "established")]
    for i, n, l1, l2 in cascade:
        b.append(_t(cx(i), ny, f"{n:,}", NUM, INK, weight="bold"))
        bw = (CW - 30) * n / 1200.0
        b.append(f'<rect x="{cx(i) - bw/2:.1f}" y="{ny+7}" width="{bw:.1f}" height="5" '
                 f'rx="1" fill="{GREY}"/>')
        b.append(_t(cx(i), ny + 8 + S * 1.6, l1, S, GREY))
        b.append(_t(cx(i), ny + 8 + S * 2.8, l2, S, GREY))
    b.append(f'<path d="M{cx(3)} {SEP2+6} v12" stroke="{RULE}" stroke-width="1.2" '
             f'marker-end="url(#sagr)"/>')
    b.append(_t(cx(3), ny + 8 + S * 1.6, "102 blocked", S, GREY, style="italic"))
    b.append(_t(cx(3), ny + 8 + S * 2.8, "by capacity", S, GREY, style="italic"))
    outs = [("median time", "to care"), ("aid dollars", "secured"),
            ("downstream", "outcomes")]
    oy = SEP2 + 9 + S * 0.85
    for k, (a, c) in enumerate(outs):
        b.append(_t(cx(6), oy + k * S * 2.5, a, S, GREY))
        b.append(_t(cx(6), oy + k * S * 2.5 + S * 1.2, c, S, GREY))
    H = max(ny + 8 + S * 2.8, oy + (len(outs) - 1) * S * 2.5 + S * 1.2) + S * 0.5
    rail((SEP2 + H) / 2 - LB, *rails[2], subbold=True)
    for i in range(1, NC):
        b.insert(0, f'<line x1="{colx(i)}" y1="{RULE1+4}" x2="{colx(i)}" y2="{H-6}" '
                    f'stroke="{RULE}" stroke-width="0.6"/>')
    return _wrap(W / 100, H / 100, "".join(b))
