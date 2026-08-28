# -*- coding: utf-8 -*-
"""Section 5 figure. Same grid and vocabulary as Sections 1 to 4."""
from figs_son import TEAL, GFILL, GREY, RULE, INK, _wrap, _t

def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.4, rx=3):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"/>')


def fig8():
    """7.2 x 2.72in. Four static protections, then a barrier that grows.

    The contrast is the argument: the formal rights are four fixed boxes, and
    the replication barrier is a bar that lengthens. Bar length encodes
    accumulation, so the reader sees compounding rather than being told it."""
    W, H = 720, 296
    b = []

    # --- the four formal protections, deliberately uniform and static -------
    cells = [
        (8, 22, "TRADE SECRETS",
         ["Workflow orchestration, execution logic, data normalization",
          "and quality-control methods, derived variables, operating processes"]),
        (364, 22, "COPYRIGHT",
         ["Source code, interfaces, original content, documentation"]),
        (8, 88, "TRADEMARK",
         ["Olera and product names, marks, and brand identity"]),
        (364, 88, "CONTRACTUAL AND TECHNICAL CONTROLS",
         ["Confidentiality and IP assignment, controlled API and data use,",
          "role-based access, partner and contractor restrictions"]),
    ]
    for x, y, title, lines in cells:
        b.append(_box(x, y, 348, 54))
        cx = x + 174
        b.append(_t(cx, y + 18, title, 10.0, TEAL, weight="bold", ls=0.9))
        y0 = y + 34 + (0 if len(lines) == 2 else 5)
        for k, ln in enumerate(lines):
            b.append(_t(cx, y0 + k * 11, ln, 9.2, INK))

    # --- the divider that separates static rights from a growing barrier ----
    b.append(f'<line x1="8" y1="163" x2="238" y2="163" stroke="{RULE}" stroke-width="0.9"/>')
    b.append(f'<line x1="482" y1="163" x2="712" y2="163" stroke="{RULE}" stroke-width="0.9"/>')
    b.append(_t(360, 167, "CUMULATIVE TEMPORAL BARRIER", 9.6, GREY, weight="bold", ls=1.2))

    # --- accumulation, drawn to length rather than asserted -----------------
    rows = [(186, 8, 408, GFILL, "Before the CRP",
             ["Family distribution, national provider and benefits",
              "infrastructure, provider and workforce relationships"]),
            (228, 8, 704, "#ffffff", "Added during the CRP",
             ["Execution history, county-level pathway performance,",
              "care-establishment and outcomes records"])]
    for y, x, w, fill, label, lines in rows:
        b.append(_box(x, y, w, 34, fill))
        b.append(_t(x + 12, y + 15, label, 9.6, TEAL, anchor="start", weight="bold"))
        for k, ln in enumerate(lines):
            b.append(_t(x + 150, y + 15 + k * 11, ln, 9.2, INK, anchor="start"))
    # the arrow is the claim: each addition lengthens what a rival must rebuild
    b.append(f'<path d="M8 278 h352" fill="none" stroke="{RULE}" stroke-width="1.2" '
             f'marker-end="url(#sagr)"/>')
    b.append(_t(374, 282, "time, data, relationships, and operating experience required to replicate",
                9.2, GREY, anchor="start", style="italic"))
    return _wrap(W / 100, H / 100, "".join(b))
