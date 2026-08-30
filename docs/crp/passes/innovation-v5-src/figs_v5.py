# -*- coding: utf-8 -*-
"""Innovation v5 figures, house vector system. 100 svg units = 1 inch.

Rebuilt from the v5 draft's four raster figures. Same concepts, same reading
order; the type is measured and nothing sits below the 9.5pt floor.
"""
from figs_son import (TEAL, GREEN, GFILL, RED, RFILL, GREY, RULE, INK,
                      _wrap, _t, _icon,
                      I_PERSON_NEED, I_FACILITY, I_ASSESS, I_IDENTIFY, I_FUND,
                      I_STAFF, I_EXECUTE, I_ESTABLISH, I_OUTCOMES, I_HOSPITAL)
from figs_inn import (I_BROWSER, I_PHONE, I_MAIL, I_FORM, I_API, I_STUDENT,
                      I_VERIFY, I_MAP, I_AI, I_LIST, _box, _tick, _pend,
                      _arrow, _label)
import figbase as B

GREYF = "#f1f2f1"
PALE = "#f6f8f7"


def _dn(b, x, y, w, h, label):
    """One domain tile in the Care Establishment Model.

    Text only: at the 9.5pt floor an icon plus "Execution" does not fit a
    seventh of the panel, and the tile names carry the meaning on their own."""
    b.append(_box(x, y, w, h, "#ffffff", TEAL, 1.1, rx=3))
    b.append(_t(x + w / 2, y + h / 2 + B.BODY * 0.34, label, B.BODY, TEAL,
                weight="bold"))


# ---------------------------------------------------------------- card system
# Boxes are sized from their own measured content rather than from a guessed
# constant. Guessing is what pushed text outside its box in the draft.
PAD = 6


def _cardparts(title, body, w, tsize=None, bsize=None):
    tsize = tsize or B.LABEL
    bsize = bsize or B.BODY
    tl, ts = B.fit(title, w - 2 * PAD, tsize, "bold") if title else ([], tsize)
    bl, bs = B.fit(body, w - 2 * PAD, bsize, "normal") if body else ([], bsize)
    return tl, ts, bl, bs


def _cardh(title, body, w, icon=False, tsize=None, bsize=None):
    tl, ts, bl, bs = _cardparts(title, body, w, tsize, bsize)
    h = PAD + (22 if icon else 0) + len(tl) * ts * 1.15
    if bl:
        h += 3 + len(bl) * bs * 1.18
    return h + PAD


def _card(b, x, y, w, h, title, body, color=TEAL, fill="#ffffff", icon=None,
          sw=1.3, tsize=None, bsize=None):
    b.append(_box(x, y, w, h, fill, color, sw, rx=3))
    tl, ts, bl, bs = _cardparts(title, body, w, tsize, bsize)
    yy = y + PAD
    if icon:
        b.append(_icon(x + w / 2 - 12, yy, icon, scale=1.0, color=color, sw=1.7))
        yy += 22
    for ln in tl:
        yy += ts * 1.15
        b.append(_t(x + w / 2, yy, ln, ts, color, weight="bold"))
    if bl:
        yy += 3
        for ln in bl:
            yy += bs * 1.18
            b.append(_t(x + w / 2, yy, ln, bs, GREY))


def _row(b, xs, w, y, cards, color=TEAL, fill="#ffffff", arrow=True, marker="sah"):
    """Lay a row of cards at one common height, the tallest card's."""
    h = max(_cardh(t, d, w, icon=(ic is not None)) for t, d, ic in cards)
    for i, (t, d, ic) in enumerate(cards):
        f = fill(i) if callable(fill) else fill
        _card(b, xs[i], y, w, h, t, d, color=color, fill=f, icon=ic)
        if arrow and i < len(cards) - 1:
            b.append(_arrow(xs[i] + w + 2, y + h / 2, xs[i + 1] - 3, y + h / 2,
                            color, 1.5, marker))
    return h


# =================================================================== FIGURE 5
def fig5():
    """7.3in. Fragmented inputs, normalized by the eldercare LLM, into one model."""
    W = 730
    S, LB = B.BODY, B.LABEL
    b = []
    y0 = 6

    # ---- inputs
    IW = 166
    inputs = [("Family", I_PERSON_NEED), ("Providers", I_FACILITY),
              ("Documents", I_FORM), ("Aid and insurance", I_FUND),
              ("Calls and email", I_MAIL), ("Forms and portals", I_BROWSER)]
    IH = 26 + len(inputs) * 21 + 8
    b.append(_box(8, y0, IW, IH, GREYF, RULE, 1.2))
    b.append(_t(8 + IW / 2, y0 + 17, "FRAGMENTED INPUTS", S, GREY, weight="bold", ls=0.7))
    iy = y0 + 36
    for lab, ic in inputs:
        b.append(_icon(20, iy - 11, ic, scale=0.78, color=GREY, sw=1.7))
        b.append(_t(42, iy + 1, lab, S, INK, anchor="start"))
        iy += 21

    # ---- eldercare LLM
    MX, MW = 192, 140
    MH = IH
    b.append(_box(MX, y0, MW, MH, GFILL, TEAL, 1.4))
    b.append(_icon(MX + MW / 2 - 12, y0 + 12, I_AI, scale=1.0, color=TEAL, sw=1.7))
    yy = _label(b, MX + MW / 2, y0 + 50, "Phase IIB eldercare LLM", MW - 14, LB, TEAL)
    _label(b, MX + MW / 2, yy + 6, "interprets language, documents, and field "
           "observations, and normalizes them into one state", MW - 16, S, GREY,
           weight="normal")
    b.append(_arrow(8 + IW + 3, y0 + IH / 2, MX - 4, y0 + IH / 2, GREY, 1.5, "sagr"))
    b.append(_arrow(MX + MW + 3, y0 + IH / 2, MX + MW + 24, y0 + IH / 2, TEAL, 1.6))

    # ---- the model
    RX = MX + MW + 28
    RW = W - RX - 8
    b.append(_box(RX, y0, RW, MH, "#ffffff", TEAL, 1.5))
    b.append(f'<rect x="{RX}" y="{y0}" width="{RW}" height="24" rx="4" fill="{TEAL}"/>')
    b.append(_t(RX + RW / 2, y0 + 16.5, "CARE ESTABLISHMENT MODEL", S, "#ffffff",
                weight="bold", ls=0.7))
    doms = ["Needs", "Means", "Funding", "Service", "Execution", "Capacity", "Outcome"]
    tw = (RW - 24) / 4
    th = 24
    for i, lab in enumerate(doms):
        r, c = divmod(i, 4)
        off = 0 if r == 0 else tw / 2
        _dn(b, RX + 12 + off + c * tw, y0 + 32 + r * (th + 8), tw - 6, th, lab)
    fy = y0 + 32 + 2 * (th + 8) + 6
    b.append(f'<line x1="{RX+12}" y1="{fy}" x2="{RX+RW-12}" y2="{fy}" '
             f'stroke="{RULE}" stroke-width="0.9"/>')
    b.append(_t(RX + RW / 2, fy + 15, "each domain carries substates, timestamps,",
                S, GREY))
    b.append(_t(RX + RW / 2, fy + 15 + S * 1.28, "provenance, geography, and permissions",
                S, GREY))
    H = y0 + MH + 6
    return _wrap(W / 100, H / 100, "".join(b))


# =================================================================== FIGURE 6
def fig6():
    """7.3in. Information returned, against work carried to a verified outcome."""
    W = 730
    S, LB = B.BODY, B.LABEL
    b = []
    y0 = 6

    # ---- row A: a general-purpose answer stops at a list
    aw, gap = 196, 26
    xs = [8, 8 + aw + gap, 8 + 2 * (aw + gap)]
    cards = [("A household needs affordable care", None, None),
             ("General-purpose AI", "searches public information and holds no case state", None),
             ("Returns a list", "possible benefits and provider names; the family executes",
              None)]
    hA = _row(b, xs, aw, y0, cards, color=GREY, fill=lambda i: GREYF if i != 1 else "#ffffff",
              marker="sagr")
    note = xs[2] + aw + 14
    _label(b, (note + W - 6) / 2, y0 + hA / 2 - S * 0.6,
           "Nothing is carried out or verified.", W - note - 8, S, GREY)

    # ---- row B: execution, and the loop that learns from it
    yB = y0 + hA + 16
    inner = 14
    bw = (W - 16 - 2 * inner - 3 * 22) / 4
    bxs = [8 + inner + i * (bw + 22) for i in range(4)]
    blocks = [("Care Establishment Model", "current state and the next constraint", None),
              ("Bounded agent", "reason, permission, tool, schedule, retry", None),
              ("Constrained tools", "APIs, browser, documents, email, SMS, voice", None),
              ("External world", "provider, county office, insurer, family", None)]
    hB = max(_cardh(t, d, bw) for t, d, _ in blocks)
    head = 21
    loop = 22
    HB = head + hB + loop + 6
    b.append(f'<rect x="8" y="{yB}" width="{W-16}" height="{HB}" rx="5" fill="{PALE}" '
             f'stroke="{TEAL}" stroke-width="1.4"/>')
    b.append(_t(8 + inner, yB + 17, "CARENAVIGATOR EXECUTION AND FIELD LEARNING", S, TEAL,
                anchor="start", weight="bold", ls=0.7))
    by = yB + head
    _row(b, bxs, bw, by, blocks, color=TEAL, fill="#ffffff")
    ly = by + hB + 6
    b.append(f'<path d="M{bxs[3] + bw/2} {by+hB+2} v8 H{bxs[0] + bw/2} v-8" fill="none" '
             f'stroke="{GREEN}" stroke-width="1.5" marker-end="url(#sag)"/>')
    b.append(_t(W / 2, ly + 18, "knowledge gap, fieldwork, normalized observation, "
                "provenance-aware update", S, GREEN, weight="bold"))
    H = yB + HB + 6
    return _wrap(W / 100, H / 100, "".join(b))


# =================================================================== FIGURE 7
def fig7():
    """7.3in. Where the pathway fails, and the supply directed at that failure."""
    W = 730
    S, LB = B.BODY, B.LABEL
    b = []
    y0 = 6
    LW = 262
    GAPX = 40

    # ---- right panel first: its content sets the height of both
    RX = 8 + LW + GAPX
    RW = W - RX - 8
    inner = 12
    sw_ = (RW - 2 * inner - 3 * 12) / 4
    steps = [("Pre-health students", "900+ pilot applicants", I_STUDENT),
             ("Recruit, screen, vet", "availability and fit", I_VERIFY),
             ("Licensed provider", "hires, trains, supervises", I_FACILITY),
             ("New care capacity", "in the county that lacked it", I_ESTABLISH)]
    hS = max(_cardh(t, d, sw_, icon=True) for t, d, _ in steps)
    rec = ("Longitudinal worker record: hours, credentials, evaluations, "
           "reliability, and references")
    rl, rs = B.fit(rec, RW - 2 * inner - 2 * PAD, S, "normal")
    hR = PAD + len(rl) * rs * 1.2 + PAD
    head = 21
    HH = head + hS + 10 + hR + 21 + 6

    b.append(_box(RX, y0, RW, HH, "#ffffff", GREEN, 1.4))
    b.append(f'<rect x="{RX}" y="{y0}" width="{RW}" height="{head}" rx="4" fill="{GREEN}"/>')
    b.append(_t(RX + RW / 2, y0 + 16.5, "DATA-DIRECTED NEW SUPPLY", S, "#ffffff",
                weight="bold", ls=0.7))
    sxs = [RX + inner + i * (sw_ + 12) for i in range(4)]
    for i, (t, d, ic) in enumerate(steps):
        _card(b, sxs[i], y0 + head, sw_, hS, t, d, color=GREEN,
              fill=GFILL if i == 3 else "#ffffff", icon=ic)
        if i < 3:
            b.append(_arrow(sxs[i] + sw_ + 1, y0 + head + hS / 2,
                            sxs[i + 1] - 2, y0 + head + hS / 2, GREEN, 1.5, "sag"))
    ry = y0 + head + hS + 12
    b.append(_box(RX + inner, ry, RW - 2 * inner, hR, PALE, RULE, 1.0, rx=3))
    yy = ry + PAD
    for ln in rl:
        yy += rs * 1.2
        b.append(_t(RX + RW / 2, yy, ln, rs, TEAL))
    b.append(f'<path d="M{RX+RW-24} {ry+hR+2} v7 H{RX+24} v-7" fill="none" '
             f'stroke="{GREEN}" stroke-width="1.4" marker-end="url(#sag)"/>')
    b.append(_t(RX + RW / 2, ry + hR + 22, "placement outcomes feed back to targeting",
                S, GREEN, weight="bold"))

    # ---- left panel: what the instrumented cases show
    b.append(_box(8, y0, LW, HH, "#ffffff", TEAL, 1.4))
    b.append(f'<rect x="8" y="{y0}" width="{LW}" height="{head}" rx="4" fill="{TEAL}"/>')
    b.append(_t(8 + LW / 2, y0 + 16.5, "WHERE CASES STOP, BY COUNTY", S, "#ffffff",
                weight="bold", ls=0.6))
    b.append(_icon(24, y0 + 32, I_MAP, scale=0.85, color=TEAL, sw=1.7))
    b.append(_t(48, y0 + 46, "Every executed case writes here", S, INK, anchor="start"))
    b.append(_t(24, y0 + 70, "Observed bottlenecks (illustrative)", S, TEAL,
                anchor="start", weight="bold"))
    rows = [("Workforce", "41%"), ("Execution", "18%"),
            ("Funding", "12%"), ("Provider capacity", "9%")]
    ly = y0 + 88
    for i, (lab, val) in enumerate(rows):
        col = GREEN if i == 0 else INK
        wt = "bold" if i == 0 else "normal"
        b.append(_t(28, ly, lab, S, col, anchor="start", weight=wt))
        b.append(_t(8 + LW - 24, ly, val, S, col, anchor="end", weight=wt))
        b.append(f'<line x1="24" y1="{ly+5}" x2="{8+LW-24}" y2="{ly+5}" '
                 f'stroke="{RULE}" stroke-width="0.7"/>')
        ly += 18
    b.append(_t(8 + LW / 2, ly + 14, "household to county to state to national",
                S, GREY, style="italic"))
    ay = y0 + HH / 2
    b.append(_arrow(8 + LW + 4, ay, RX - 4, ay, GREEN, 1.7, "sag"))
    H = y0 + HH + 6
    return _wrap(W / 100, H / 100, "".join(b))


# =================================================================== FIGURE 8
def fig8():
    """7.3in. Three entry paths, one interface, one verified endpoint."""
    W = 730
    S, LB = B.BODY, B.LABEL
    b = []
    y0 = 6
    cases = [("Post-hospital transition",
              "follow-up, transportation, home health, and ADL support"),
             ("Aid and home care",
              "needs and means, then benefits, application, provider, and start"),
             ("Capacity shortage",
              "funded family, provider has no staff, Caregiver Staffing activates supply")]
    cw = (W - 16 - 2 * 16) / 3
    cxs = [8 + i * (cw + 16) for i in range(3)]
    CH = max(_cardh(t, d, cw) for t, d in cases)
    for i, (t, d) in enumerate(cases):
        _card(b, cxs[i], y0, cw, CH, t, d, color=TEAL, fill="#ffffff")
        b.append(_arrow(cxs[i] + cw / 2, y0 + CH, cxs[i] + cw / 2, y0 + CH + 14, TEAL, 1.5))

    iy = y0 + CH + 15
    layers = [("Care Establishment Model", I_EXECUTE), ("Agent execution", I_AI),
              ("Field learning", I_BROWSER), ("Capacity intelligence", I_STAFF)]
    lw = (W - 40) / len(layers)
    lh = max(_cardh(t, None, lw, icon=True, tsize=S) for t, _ in layers)
    head = 21
    IH = head + lh + 6
    b.append(f'<rect x="8" y="{iy}" width="{W-16}" height="{IH}" rx="5" fill="{PALE}" '
             f'stroke="{TEAL}" stroke-width="1.5"/>')
    b.append(_t(20, iy + 17, "ONE CARENAVIGATOR EXPERIENCE, WEB AND MOBILE", S, TEAL,
                anchor="start", weight="bold", ls=0.7))
    b.append(_t(W - 20, iy + 17, "family-tested through Phase IIB", S, GREY, anchor="end",
                style="italic"))
    for i, (lab, ic) in enumerate(layers):
        x = 20 + lw * i
        _card(b, x + 4, iy + head, lw - 8, lh, lab, None, color=TEAL, fill="#ffffff",
              icon=ic, sw=1.1, tsize=S)
    b.append(_arrow(W / 2, iy + IH, W / 2, iy + IH + 14, GREEN, 1.7, "sag"))

    oy = iy + IH + 15
    OH = 30
    txt = "Verified aid or care established"
    ow = B.w(txt, LB, "bold") + 72
    ox = (W - ow) / 2
    b.append(_box(ox, oy, ow, OH, GFILL, GREEN, 1.6, rx=4))
    b.append(_icon(ox + 18, oy + 6, I_ESTABLISH, scale=0.85, color=GREEN, sw=1.7))
    b.append(_t(ox + 44, oy + 21, txt, LB, GREEN, anchor="start", weight="bold"))
    H = oy + OH + 6
    return _wrap(W / 100, H / 100, "".join(b))
