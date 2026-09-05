# -*- coding: utf-8 -*-
"""Finance Plan figures. Same grid and vocabulary as Sections 1 to 5."""
from figs_son import TEAL, GFILL, GREY, RULE, INK, _wrap, _t, _icon

def _box(x, y, w, h, fill="#ffffff", stroke=TEAL, sw=1.4, rx=3, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" '
            f'stroke="{stroke}" stroke-width="{sw}"{d}/>')


# ------------------------------------------------------------------ FIGURE 9
def fig9():
    """7.2 x 2.06in. When each source of capital enters, and when each stops.

    A band chart rather than a flow diagram, because the claim is about timing:
    federal capital ends, staffing revenue starts during the award, and private
    capital has to arrive before the runway does."""
    W, H = 720, 206
    RX, GX, CW = 128, 136, 143
    def colx(i): return GX + CW * i
    END = colx(3)                      # CRP ends at the close of Year 3
    b = []

    for i, lab in enumerate(["Year 1", "Year 2", "Year 3", "Post-CRP"]):
        b.append(_t(colx(i) + CW / 2, 16, lab, 10.0, TEAL, weight="bold"))
    b.append(f'<line x1="{GX}" y1="24" x2="{colx(4)}" y2="24" stroke="{TEAL}" stroke-width="1.1"/>')
    for i in range(1, 4):
        b.append(f'<line x1="{colx(i)}" y1="26" x2="{colx(i)}" y2="182" stroke="{RULE}" stroke-width="0.6"/>')

    rows = [
        ("Federal CRP capital", 38, [(GX, END, GFILL, None, "Approximately $4M over three years")]),
        ("Caregiver Staffing revenue", 74,
         [(colx(0) + 70, colx(4), "#ffffff", None, "Begins during the award, grows with each market")]),
        ("Third-party private capital", 110,
         [(colx(1), colx(3) - 24, "#ffffff", "4 3", "Cultivate, then raise"),
          (colx(3) - 24, colx(4), GFILL, None, "Capital in hand")]),
        ("Institutional revenue", 146,
         [(END, colx(4), "#ffffff", "4 3", "After the evidence lands")]),
    ]
    for label, y, bars in rows:
        b.append(_t(RX, y + 16, label, 9.8, TEAL, anchor="end", weight="bold"))
        for x0, x1, fill, dash, text in bars:
            b.append(_box(x0, y, x1 - x0, 24, fill, TEAL, 1.3, dash=dash))
            b.append(_t((x0 + x1) / 2, y + 15.5, text, 9.0, INK))

    b.append(f'<line x1="{END}" y1="30" x2="{END}" y2="186" stroke="{GREY}" stroke-width="1.2" '
             f'stroke-dasharray="4 3"/>')
    b.append(_t(END - 5, 196, "CRP RUNWAY ENDS", 9.0, GREY, anchor="end", weight="bold", ls=0.9))
    return _wrap(W / 100, H / 100, "".join(b))


# ----------------------------------------------------------------- FIGURE 10
def fig10():
    """3.36 x 2.3in. Right-floated. The virtuous counterpart to Figure 1.

    Same circle-and-arc construction as the vicious cycle, so the two read as a
    matched pair. Ring radius kept small enough that the east and west labels
    clear the viewBox."""
    W, H = 336, 230
    cx, cy, r, nr = 160, 118, 54, 20
    b = []
    for d in ("M178.2 68.0 A 54 54 0 0 1 210.0 99.8",
              "M210.0 136.2 A 54 54 0 0 1 178.2 168.0",
              "M141.8 168.0 A 54 54 0 0 1 110.0 136.2",
              "M110.0 99.8 A 54 54 0 0 1 141.8 68.0"):
        b.append(f'<path d="{d}" fill="none" stroke="{TEAL}" stroke-width="1.5" marker-end="url(#sah)"/>')
    nodes = [(160, 64, ["More markets"], 160, 32, "middle"),
             (214, 118, ["More revenue,", "more episodes"], 240, 114, "start"),
             (160, 172, ["Institutional", "contracts"], 160, 206, "middle"),
             (106, 118, ["Stronger", "evidence"], 80, 114, "end")]
    for x, y, lines, lx, ly, anc in nodes:
        b.append(f'<circle cx="{x}" cy="{y}" r="{nr}" fill="{GFILL}" stroke="{TEAL}" stroke-width="1.4"/>')
        for k, ln in enumerate(lines):
            b.append(_t(lx, ly + k * 11, ln, 9.8, TEAL, anchor=anc, weight="bold"))
    b.append(_t(cx, 114, "PRIVATE", 8.6, TEAL, weight="bold", ls=0.7))
    b.append(_t(cx, 124, "CAPITAL", 8.6, TEAL, weight="bold", ls=0.7))
    return _wrap(W / 100, H / 100, "".join(b))
