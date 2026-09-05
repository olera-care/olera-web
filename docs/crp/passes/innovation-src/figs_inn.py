# -*- coding: utf-8 -*-
"""Innovation figures. 100 svg units = 1 inch; type declared in points via figbase.

Redrawn in the house vector system from Logan's illustrated draft. Same content
and same reading order; the illustrations, photographs and device mockups are
replaced by the diagram they were carrying, which is what the argument needs and
what survives at any print size.
"""
from figs_son import (TEAL, GREEN, GFILL, RED, RFILL, GREY, RULE, INK,
                      _wrap, _t, _icon,
                      I_ASSESS, I_IDENTIFY, I_FUND, I_STAFF, I_EXECUTE,
                      I_ESTABLISH, I_OUTCOMES, I_PERSON_NEED, I_FACILITY, I_HOSPITAL)
import figbase as B

PALE = "#f4f7f6"
GREYF = "#f1f2f1"

# ------------------------------------------------------------------- icons
I_BROWSER = ['<rect x="2.6" y="4.2" width="18.8" height="15.6" rx="1.8"/>',
             '<path d="M2.6 9h18.8"/>', '<path d="M5.4 6.6h.02M7.8 6.6h.02"/>',
             '<circle cx="12" cy="14.4" r="3.4"/>', '<path d="M8.6 14.4h6.8"/>']
I_PHONE   = ['<path d="M7.4 3.4l2.6 4-2 2.2a13 13 0 006.4 6.4l2.2-2 4 2.6-1.4 3.2a2 2 0 01-2.2 1.1C10.6 19.7 4.3 13.4 3.1 6.9a2 2 0 011.1-2.2z"/>']
I_MAIL    = ['<rect x="2.6" y="5" width="18.8" height="14" rx="1.8"/>',
             '<path d="M3.4 6.4L12 12.8l8.6-6.4"/>']
I_FORM    = ['<path d="M5.6 2.6h8l5 5v13.8H5.6z"/>', '<path d="M13.6 2.6v5h5"/>',
             '<path d="M8.4 12h7.2M8.4 15.4h7.2M8.4 18.6h4.4"/>']
I_API     = ['<rect x="3" y="3" width="8" height="8" rx="1.4"/>',
             '<rect x="13" y="13" width="8" height="8" rx="1.4"/>',
             '<path d="M11 7h3.6a2.4 2.4 0 012.4 2.4V13"/>',
             '<path d="M7 11v3.6A2.4 2.4 0 009.4 17H13"/>']
I_STUDENT = ['<path d="M12 3.4L22 8l-10 4.6L2 8z"/>',
             '<path d="M6 10.2v5.4c0 1.9 2.7 3.4 6 3.4s6-1.5 6-3.4v-5.4"/>',
             '<path d="M22 8v5.6"/>']
I_VERIFY  = ['<path d="M12 2.8l7.6 3v6c0 4.6-3.1 8.4-7.6 9.4-4.5-1-7.6-4.8-7.6-9.4v-6z"/>',
             '<path d="M8.6 11.8l2.4 2.4 4.4-4.4"/>']
I_MAP     = ['<path d="M2.8 5.8l6-2.4 6.4 2.4 6-2.4v14.8l-6 2.4-6.4-2.4-6 2.4z"/>',
             '<path d="M8.8 3.4v14.8M15.2 5.8v14.8"/>']
I_AI      = ['<rect x="5" y="5" width="14" height="14" rx="2.4"/>',
             '<path d="M9.4 2.6v2.4M14.6 2.6v2.4M9.4 19v2.4M14.6 19v2.4"/>',
             '<path d="M2.6 9.4H5M2.6 14.6H5M19 9.4h2.4M19 14.6h2.4"/>',
             '<path d="M9.6 10.2h4.8M9.6 13.8h3"/>']
I_LIST    = ['<rect x="3.6" y="3.4" width="16.8" height="17.2" rx="1.8"/>',
             '<path d="M7.4 8.6h9.2M7.4 12h9.2M7.4 15.4h6"/>']


def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.3, rx=4, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>')


def _tick(x, y, color=GREEN, s=1.0):
    return (f'<path d="M{x} {y} l{2.6*s} {2.8*s} l{5.4*s} {-6.2*s}" fill="none" '
            f'stroke="{color}" stroke-width="{1.6*s}" stroke-linecap="round" '
            f'stroke-linejoin="round"/>')


def _pend(x, y, color=GREY, r=3.4):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{color}" '
            f'stroke-width="1.3"/><circle cx="{x}" cy="{y}" r="1.2" fill="{color}"/>')


def _arrow(x1, y1, x2, y2, color=TEAL, sw=1.4, marker="sah", dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" '
            f'stroke-width="{sw}" marker-end="url(#{marker})"{d}/>')


def _label(b, x, y, text, maxw, size, color, weight="bold", anchor="middle", lead=None):
    lines, sz = B.fit(text, maxw, size, weight)
    lead = lead or sz * 1.15
    for i, ln in enumerate(lines):
        b.append(_t(x, y + i * lead, ln, sz, color, anchor=anchor, weight=weight))
    return y + len(lines) * lead


# =================================================================== FIGURE 1
def fig1():
    """7.3in. Seven pathway events above, the case record they write to below."""
    W = 730
    S, LB = B.BODY, B.LABEL
    steps = [("Need\nidentified", I_PERSON_NEED), ("Assess needs\nand means", I_ASSESS),
             ("Find\nservices", I_IDENTIFY), ("Secure\nfunding", I_FUND),
             ("Execute\ntasks", I_EXECUTE), ("Capacity\nconfirmed", I_STAFF),
             ("Care\nestablished", I_ESTABLISH)]
    fields = ["Needs and goals", "Funding status", "Providers and capacity",
              "Tasks and communications", "Permissions and actors",
              "Evidence and documents", "Outcomes and timelines"]
    b = []
    step = (W - 24) / len(steps)
    xs = [12 + step * i + step / 2 for i in range(len(steps))]
    spine = 60
    b.append(f'<line x1="{xs[0]}" y1="{spine}" x2="{xs[-1]}" y2="{spine}" '
             f'stroke="{RULE}" stroke-width="1.1"/>')
    for i, (x, (lab, ic)) in enumerate(zip(xs, steps)):
        last = i == len(steps) - 1
        col = GREEN if last else TEAL
        b.append(_icon(x - 14.4, 12, ic, scale=1.2, color=col, sw=1.5))
        b.append(f'<circle cx="{x}" cy="{spine}" r="4.4" fill="{col}"/>')
        yy = spine + 18
        for ln in lab.split("\n"):
            b.append(_t(x, yy, ln, LB, col, weight="bold"))
            yy += LB * 1.14
        if not last:
            b.append(_arrow(x + 11, spine, xs[i + 1] - 13, spine, TEAL, 1.3))
    top = spine + 18 + LB * 1.14 * 2 + 4

    # every event writes down into the record
    ry = top + 20
    for x in xs:
        b.append(f'<line x1="{x}" y1="{top}" x2="{x}" y2="{ry - 3}" stroke="{RULE}" '
                 f'stroke-width="1" stroke-dasharray="2.6 2.4"/>')
    RH = 62
    b.append(_box(10, ry, W - 20, RH, GFILL, TEAL, 1.2))
    b.append(_t(20, ry + 16, "LONGITUDINAL CASE RECORD", S, TEAL, anchor="start",
                weight="bold", ls=0.8))
    fw = (W - 30) / len(fields)
    for i, f in enumerate(fields):
        cx = 15 + fw * i + fw / 2
        if i:
            b.append(f'<line x1="{15 + fw*i}" y1="{ry + 24}" x2="{15 + fw*i}" '
                     f'y2="{ry + RH - 6}" stroke="{RULE}" stroke-width="0.8"/>')
        _label(b, cx, ry + 38, f, fw - 10, S, INK, weight="normal")
    H = ry + RH + 6
    return _wrap(W / 100, H / 100, "".join(b))


# =================================================================== FIGURE 2
def fig2():
    """7.3in. Information above, execution below, from the same household."""
    W = 730
    S, LB, HD = B.BODY, B.LABEL, B.HEAD
    b = []

    # ---- row A: general-purpose AI stops at a list
    yA = 8
    HA = 116
    b.append(_box(8, yA, 150, HA, GREYF, RULE, 1.2))
    b.append(_icon(83 - 12, yA + 18, I_PERSON_NEED, scale=1.0, color=GREY, sw=1.5))
    _label(b, 83, yA + 62, "Same household seeks help", 134, S, GREY, weight="bold")
    b.append(_arrow(160, yA + HA / 2, 194, yA + HA / 2, GREY, 1.4, "sagr"))

    b.append(_box(198, yA, 224, HA, "#ffffff", RULE, 1.2))
    b.append(_icon(214, yA + 12, I_AI, scale=0.9, color=GREY, sw=1.5))
    b.append(_t(240, yA + 26, "General-purpose AI", LB, GREY, anchor="start", weight="bold"))
    ly = yA + 48
    for item in ["Medicaid waiver", "SNAP", "Local nonprofits", "Home care agencies"]:
        b.append(f'<circle cx="218" cy="{ly - 3.4}" r="1.8" fill="{RULE}"/>')
        b.append(_t(226, ly, item, S, GREY, anchor="start"))
        ly += S * 1.28
    b.append(_arrow(424, yA + HA / 2, 458, yA + HA / 2, GREY, 1.4, "sagr"))

    b.append(_box(462, yA, 118, HA, GREYF, RULE, 1.2))
    b.append(_icon(521 - 12, yA + 20, I_LIST, scale=1.0, color=GREY, sw=1.5))
    _label(b, 521, yA + 64, "Information only. The family does the rest.", 104, S, GREY,
           weight="bold")

    fy = yA + 26
    for line in ["Static list.", "No follow-through.", "No verification."]:
        b.append(_t(596, fy, line, S, GREY, anchor="start"))
        fy += S * 1.5

    # ---- row B: CareNavigator executes
    yB = yA + HA + 26
    HB = 168
    LWB, MWB, RWB = 136, 306, 206
    x1 = 8
    x2 = x1 + LWB + 30
    x3 = x2 + MWB + 30
    b.append(_box(x1, yB, LWB, HB, GFILL, TEAL, 1.3))
    b.append(_icon(x1 + LWB / 2 - 13.2, yB + 30, I_PERSON_NEED, scale=1.1, color=TEAL, sw=1.5))
    _label(b, x1 + LWB / 2, yB + 82, "Same household uses CareNavigator", LWB - 18, S, TEAL)
    b.append(_arrow(x1 + LWB + 2, yB + HB / 2, x2 - 4, yB + HB / 2, TEAL, 1.5))

    b.append(_box(x2, yB, MWB, HB, "#ffffff", TEAL, 1.4))
    b.append(_t(x2 + 12, yB + 20, "CareNavigator", LB, TEAL, anchor="start", weight="bold"))
    b.append(_t(x2 + 12, yB + 20 + S * 1.3, "eldercare model, case state, and agents",
                S, GREY, anchor="start"))
    # single-word tile labels: the icons carry the rest, and anything longer
    # overflows a fifth of the box at the 9.5pt floor
    tools = [(I_BROWSER, "Browser"), (I_PHONE, "Phone"), (I_MAIL, "Email"),
             (I_FORM, "Forms"), (I_API, "APIs")]
    tw = (MWB - 16) / len(tools)
    for i, (ic, lab) in enumerate(tools):
        cx = x2 + 8 + tw * i + tw / 2
        b.append(_box(cx - tw / 2 + 2.5, yB + 58, tw - 5, 54, GFILL, RULE, 1.0, rx=3))
        b.append(_icon(cx - 10.8, yB + 64, ic, scale=0.9, color=TEAL, sw=1.6))
        b.append(_t(cx, yB + 104, lab, S, TEAL, weight="bold"))
    b.append(_t(x2 + MWB / 2, yB + 132, "with permission, and where an API exists",
                S, GREY))
    b.append(_t(x2 + MWB / 2, yB + HB - 14, "plans, acts, and persists until verified",
                S, GREY, style="italic"))
    b.append(_arrow(x2 + MWB + 2, yB + HB / 2, x3 - 4, yB + HB / 2, TEAL, 1.5))

    b.append(_box(x3, yB, RWB, HB, "#ffffff", GREEN, 1.4))
    b.append(_t(x3 + 12, yB + 20, "Carried out, verified, recorded", S, GREEN,
                anchor="start", weight="bold"))
    dy = yB + 40
    for item in ["Application submitted", "Documents received", "Call completed",
                 "Provider scheduled", "Intake confirmed"]:
        b.append(_tick(x3 + 12, dy - 3.6, GREEN, 0.95))
        b.append(_t(x3 + 26, dy, item, S, INK, anchor="start"))
        dy += S * 1.34
    b.append(_box(x3 + 8, dy + 4, RWB - 16, 30, GFILL, GREEN, 1.3, rx=3))
    b.append(_icon(x3 + 22, dy + 8, I_ESTABLISH, scale=0.82, color=GREEN, sw=1.6))
    b.append(_t(x3 + 46, dy + 24, "Care established", LB, GREEN, anchor="start", weight="bold"))

    H = max(yB + HB, dy + 38) + 6
    return _wrap(W / 100, H / 100, "".join(b))


# =================================================================== FIGURE 3
def fig3():
    """7.3in. The same pool circulating, against new supply directed by evidence."""
    W = 730
    S, LB = B.BODY, B.LABEL
    b = []
    LW, RX = 296, 320
    y0 = 8

    # ---- left: redistribution
    b.append(_box(8, y0, LW, 226, GREYF, RULE, 1.2))
    b.append(_t(8 + LW / 2, y0 + 20, "TODAY: THE SAME POOL", S, GREY,
                weight="bold", ls=0.7))
    cx, cy, r = 8 + LW / 2, y0 + 122, 62
    for a0, a1 in ((-80, 40), (40, 160), (160, 280)):
        import math
        x1 = cx + r * math.cos(math.radians(a0)); y1 = cy + r * math.sin(math.radians(a0))
        x2 = cx + r * math.cos(math.radians(a1)); y2 = cy + r * math.sin(math.radians(a1))
        b.append(f'<path d="M{x1:.1f} {y1:.1f} A {r} {r} 0 0 1 {x2:.1f} {y2:.1f}" '
                 f'fill="none" stroke="{GREY}" stroke-width="1.4" marker-end="url(#sagr)"/>')
    import math
    for a in (-90, 30, 150):
        px = cx + r * math.cos(math.radians(a)); py = cy + r * math.sin(math.radians(a))
        b.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="17" fill="#ffffff" '
                 f'stroke="{GREY}" stroke-width="1.3"/>')
        b.append(_icon(px - 10.8, py - 10.8, I_FACILITY, scale=0.9, color=GREY, sw=1.5))
    b.append(_t(cx, cy + 4, "same", S, GREY, weight="bold"))
    b.append(_t(cx, cy + 4 + S * 1.15, "pool", S, GREY, weight="bold"))
    _label(b, 8 + LW / 2, y0 + 206, "Caregivers move among providers. The total pool "
           "does not grow.", LW - 24, S, GREY, weight="normal")

    # ---- left lower: capacity intelligence
    ci = y0 + 238
    CIH = 132
    b.append(_box(8, ci, LW, CIH, GFILL, TEAL, 1.3))
    b.append(_icon(20, ci + 8, I_MAP, scale=0.85, color=TEAL, sw=1.6))
    b.append(_t(44, ci + 22, "Olera capacity intelligence", LB, TEAL, anchor="start",
                weight="bold"))
    ly = ci + 44
    for item in ["Observed care-establishment failures",
                 "Provider capacity and hiring needs",
                 "Service type, geography, and shifts",
                 "Workforce availability and outcomes",
                 "External labor-market signals"]:
        b.append(f'<circle cx="24" cy="{ly - 3.4}" r="1.9" fill="{TEAL}"/>')
        b.append(_t(33, ly, item, S, INK, anchor="start"))
        ly += S * 1.3

    # ---- right: new supply
    RW = W - RX - 8
    b.append(_box(RX, y0, RW, 370, "#ffffff", GREEN, 1.4))
    b.append(f'<rect x="{RX}" y="{y0}" width="{RW}" height="26" rx="4" fill="{GREEN}"/>')
    b.append(_t(RX + RW / 2, y0 + 18, "CAREGIVER STAFFING: CREATING NEW SUPPLY", S,
                "#ffffff", weight="bold", ls=0.7))
    nodes = [(I_STUDENT, "Pre-health students and other new pools"),
             (I_VERIFY, "Train, screen, and verify"),
             (I_FACILITY, "Place with licensed providers"),
             (I_STAFF, "More caregivers in the field"),
             (I_ESTABLISH, "Care established")]
    ny = y0 + 48
    for i, (ic, lab) in enumerate(nodes):
        last = i == len(nodes) - 1
        col = GREEN
        bx = RX + 18
        bw = RW - 36
        b.append(_box(bx, ny, bw, 48, GFILL if last else "#ffffff", col, 1.3, rx=3))
        b.append(_icon(bx + 14, ny + 12, ic, scale=1.0, color=col, sw=1.6))
        _label(b, bx + 42 + (bw - 54) / 2, ny + 26, lab, bw - 60, LB, col,
               weight="bold")
        if not last:
            b.append(_arrow(bx + bw / 2, ny + 48, bx + bw / 2, ny + 60, GREEN, 1.5, "sag"))
        ny += 64

    # capacity intelligence directs the supply
    b.append(_arrow(8 + LW + 3, ci + CIH / 2, RX - 3, ci + CIH / 2, TEAL, 1.6))
    H = max(ci + CIH, y0 + 370) + 6
    return _wrap(W / 100, H / 100, "".join(b))


# =================================================================== FIGURE 4
def fig4():
    """7.3in. Three entry paths, one platform, one endpoint."""
    W = 730
    S, LB = B.BODY, B.LABEL
    b = []
    cases = [
        ("Hospital discharge", "Safe at home after discharge",
         [(1, "Home health arranged"), (1, "Medications picked up"),
          (0, "PCP appointment"), (0, "Transportation arranged"),
          (0, "ADL support being established")]),
        ("Cannot afford home care", "Care the family can pay for",
         [(1, "Needs and means assessed"), (1, "Aid programs identified"),
          (0, "Application in progress"), (0, "Provider confirmed"),
          (0, "Intake pending")]),
        ("Staffing shortage", "A provider with capacity",
         [(1, "Family qualified"), (1, "Provider interested"),
          (1, "Staffing unavailable"), (0, "Caregiver Staffing activated"),
          (0, "New caregiver placed")]),
    ]
    cw = (W - 16 - 2 * 14) / 3
    y0, CH = 8, 196
    for i, (title, goal, items) in enumerate(cases):
        x = 8 + i * (cw + 14)
        b.append(_box(x, y0, cw, CH, "#ffffff", TEAL, 1.3))
        b.append(f'<rect x="{x}" y="{y0}" width="{cw}" height="24" rx="4" fill="{GFILL}"/>')
        b.append(f'<path d="M{x} {y0+24} h{cw}" stroke="{TEAL}" stroke-width="1.1"/>')
        _label(b, x + cw / 2, y0 + 17, f"Case {i+1}. {title}", cw - 12, S, TEAL)
        b.append(_t(x + cw / 2, y0 + 42, "Goal: " + goal, S, GREY, style="italic"))
        ly = y0 + 72
        for done, item in items:
            if done:
                b.append(_tick(x + 11, ly - 3.6, GREEN, 0.92))
            else:
                b.append(_pend(x + 14, ly - 3.2, GREY, 3.2))
            b.append(_t(x + 24, ly, item, S, INK, anchor="start"))
            ly += S * 1.72
        b.append(_arrow(x + cw / 2, y0 + CH, x + cw / 2, y0 + CH + 16, TEAL, 1.5))

    py = y0 + CH + 20
    PH = 96
    b.append(_box(8, py, W - 16, PH, GFILL, TEAL, 1.4))
    b.append(_t(20, py + 18, "ONE CARENAVIGATOR CASE RECORD", S, TEAL, anchor="start",
                weight="bold", ls=0.8))
    duties = [(I_ASSESS, "Assess and plan"), (I_EXECUTE, "Execute and follow up"),
              (I_STAFF, "Add capacity when blocked"), (I_OUTCOMES, "Confirm and record")]
    dw = (W - 40) / len(duties)
    for i, (ic, lab) in enumerate(duties):
        cx = 20 + dw * i + dw / 2
        b.append(_icon(cx - 13.2, py + 30, ic, scale=1.1, color=TEAL, sw=1.6))
        _label(b, cx, py + 76, lab, dw - 16, S, TEAL)
    b.append(_arrow(W / 2, py + PH, W / 2, py + PH + 16, GREEN, 1.6, "sag"))

    oy = py + PH + 20
    OH = 38
    otext = "The same outcome: care established"
    ow = B.w(otext, LB, "bold") + 76
    ox = (W - ow) / 2
    b.append(_box(ox, oy, ow, OH, GFILL, GREEN, 1.5, rx=4))
    b.append(_icon(ox + 20, oy + 8, I_ESTABLISH, scale=0.92, color=GREEN, sw=1.7))
    b.append(_t(ox + 50, oy + 25, otext, LB, GREEN, anchor="start", weight="bold"))
    H = oy + OH + 6
    return _wrap(W / 100, H / 100, "".join(b))
