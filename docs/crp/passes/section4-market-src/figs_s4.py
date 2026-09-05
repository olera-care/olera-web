# -*- coding: utf-8 -*-
"""Section 4 figure. Same grid and vocabulary as Sections 1 to 3."""
from figs_son import TEAL, GFILL, GREY, RULE, INK, _wrap, _t

def fig7():
    """7.2 x 2.34in. Two markets from one pathway, on the same vertical logic.

    Shaded terminal = revenue available today; unshaded = gated by evidence,
    the convention used since Figure 4."""
    W, H = 720, 248
    LX0, LX1, RX0, RX1 = 8, 352, 368, 712
    b = []
    b.append(f'<line x1="360" y1="14" x2="360" y2="{H-6}" stroke="{RULE}" stroke-width="0.6"/>')

    cols = [
        (LX0, LX1, "BEACHHEAD", "Caregiver Staffing",
         [("4.68M home health and personal care aides", None),
          ("760,500 openings a year; 18% growth to 2035", "arrow"),
          ("75% median home-care caregiver turnover", "arrow"),
          ("Recurring provider need to recruit and staff cases", "arrow"),
          ("CRP proves repeatable acquisition, placement,", "arrow"),
          ("willingness to pay, and unit economics", "cont")],
         "NEAR-TERM PROVIDER REVENUE", GFILL),
        (RX0, RX1, "EMERGING", "Institutional market",
         [("35.2M Medicare Advantage beneficiaries", None),
          ("14.3M Medicare beneficiaries in accountable care", "plus"),
          ("Medicaid MLTSS and other risk-bearing populations", "plus"),
          ("Organizations exposed to downstream utilization", "arrow"),
          ("CRP generates care-establishment, longitudinal", "arrow"),
          ("outcomes, and economic evidence", "cont")],
         "INSTITUTIONAL CONTRACTING PATHWAY", "#ffffff"),
    ]
    for x0, x1, eyebrow, name, rows, terminal, tfill in cols:
        cx = (x0 + x1) / 2
        b.append(_t(cx, 18, eyebrow, 9.2, GREY, weight="bold", ls=1.1))
        b.append(_t(cx, 33, name, 12.2, TEAL, weight="bold"))
        b.append(f'<line x1="{x0}" y1="41" x2="{x1}" y2="41" stroke="{TEAL}" stroke-width="1.1"/>')
        y = 58
        for text, joiner in rows:
            if joiner == "arrow":
                b.append(f'<path d="M{cx} {y-20} v9" stroke="{RULE}" stroke-width="1.2" '
                         f'marker-end="url(#sagr)"/>')
            elif joiner == "plus":
                b.append(_t(cx, y - 11, "+", 11.0, GREY, weight="bold"))
            elif joiner == "cont":
                y -= 8
            b.append(_t(cx, y, text, 9.6, INK))
            y += 26 if joiner != "cont" else 34
        b.append(f'<path d="M{cx} {y-26} v10" stroke="{RULE}" stroke-width="1.2" '
                 f'marker-end="url(#sagr)"/>')
        b.append(f'<rect x="{x0}" y="{y-8}" width="{x1-x0}" height="24" rx="3" fill="{tfill}" '
                 f'stroke="{TEAL}" stroke-width="1.3"/>')
        b.append(_t(cx, y + 8, terminal, 9.8, TEAL, weight="bold", ls=0.8))
    return _wrap(W / 100, H / 100, "".join(b))
