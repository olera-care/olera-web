# -*- coding: utf-8 -*-
"""Statement of Need figures. 100 svg units = 1 inch, matching the Research
Strategy convention. Type: 9pt label = 12.5u, 7.5pt small = 10.4u."""

TEAL  = "#14453f"
GREEN = "#1a7f4e"
GFILL = "#e8f1ec"
RED   = "#9b1c1c"
RFILL = "#fbeeec"
GREY  = "#5f6b64"
RULE  = "#b9c4bd"
INK   = "#111111"

def _defs():
    return f'''<defs>
<marker id="sah" markerWidth="7.5" markerHeight="5.6" refX="6.9" refY="2.8" orient="auto"><path d="M0,0 L7.5,2.8 L0,5.6 z" fill="{TEAL}"/></marker>
<marker id="sag" markerWidth="7.5" markerHeight="5.6" refX="6.9" refY="2.8" orient="auto"><path d="M0,0 L7.5,2.8 L0,5.6 z" fill="{GREEN}"/></marker>
<marker id="sar" markerWidth="7.5" markerHeight="5.6" refX="6.9" refY="2.8" orient="auto"><path d="M0,0 L7.5,2.8 L0,5.6 z" fill="{RED}"/></marker>
<marker id="sagr" markerWidth="7" markerHeight="5.2" refX="6.4" refY="2.6" orient="auto"><path d="M0,0 L7,2.6 L0,5.2 z" fill="{GREY}"/></marker>
</defs>'''

def _wrap(w_in, h_in, body):
    return (f'<svg viewBox="0 0 {int(w_in*100)} {int(h_in*100)}" width="{w_in}in" height="{h_in}in" '
            f'xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">'
            f'{_defs()}{body}</svg>')

def _t(x, y, s, size=12.5, fill=INK, anchor="middle", weight="normal", style="normal", ls=0):
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
            f'font-weight="{weight}" font-style="{style}" letter-spacing="{ls}">{s}</text>')

# Icons are drawn on a 24x24 local grid, stroked not filled, so every figure
# shares one line weight and one corner treatment.
def _icon(x, y, paths, scale=1.0, color=TEAL, sw=1.5):
    inner = "".join(paths)
    return (f'<g transform="translate({x},{y}) scale({scale})" fill="none" stroke="{color}" '
            f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{inner}</g>')

I_PERSON_NEED = ['<circle cx="9.4" cy="6.8" r="3.3"/>',
                 '<path d="M3.4 19.6c0-3.4 2.6-5.8 6-5.8 1.2 0 2.2.2 3.1.7"/>',
                 '<path d="M17.2 12.2l4.6 8h-9.2z"/>',
                 '<path d="M17.2 15.2v2.3M17.2 18.8v.2"/>']
I_HOSPITAL    = ['<path d="M3.5 21V8.5L12 3l8.5 5.5V21z"/>',
                 '<path d="M12 10.5v6M9 13.5h6"/>']
I_NOCARE      = ['<path d="M3.5 21V10.2L12 4l8.5 6.2V21z"/>',
                 '<path d="M8.6 15.4l6.8 4.2M15.4 15.4l-6.8 4.2"/>']
I_FACILITY    = ['<path d="M3.5 21V6.5h8V21M11.5 21V11h9v10"/>',
                 '<path d="M6 10h3M6 14h3M6 18h3M15 14.5h2M15 18h2"/>',
                 '<path d="M1.8 21h20.4"/>']
I_ASSESS      = ['<circle cx="10" cy="6.6" r="3.2"/>',
                 '<path d="M4.4 15.6c0-3.1 2.5-5.4 5.6-5.4 1.3 0 2.4.4 3.4 1"/>',
                 '<circle cx="16.4" cy="15.4" r="4"/>',
                 '<path d="M19.4 18.4L22 21"/>']
I_IDENTIFY    = ['<path d="M3 20.5V9l6-4.5L15 9v11.5"/>',
                 '<path d="M15 12.5h6v8h-6"/>',
                 '<path d="M6.6 12.5h4.8M6.6 16.5h4.8M17.4 16.5h1.6"/>']
I_FUND        = ['<path d="M5 3h9l5 5v13H5z"/>',
                 '<path d="M14 3v5h5"/>',
                 '<path d="M12 11v8M9.8 12.6h3.6a1.7 1.7 0 010 3.4h-2.8a1.7 1.7 0 000 3.4h3.6"/>']
I_STAFF       = ['<circle cx="8.6" cy="7.4" r="3.2"/>',
                 '<path d="M2.8 20c0-3.3 2.5-5.6 5.8-5.6s5.8 2.3 5.8 5.6"/>',
                 '<circle cx="17.4" cy="8.6" r="2.6"/>',
                 '<path d="M15 14.9c2.9-.8 6 1.1 6 5.1"/>']
I_EXECUTE     = ['<path d="M6 4.6h12a1.6 1.6 0 011.6 1.6v14.2A1.6 1.6 0 0118 22H6a1.6 1.6 0 01-1.6-1.6V6.2A1.6 1.6 0 016 4.6z"/>',
                 '<path d="M9 4.6V3.2h6v1.4"/>',
                 '<path d="M8 10.5l1.8 1.8L13 9M8 16.5l1.8 1.8L13 15"/>',
                 '<path d="M15.4 11.4h2.2M15.4 17.4h2.2"/>']
I_ESTABLISH   = ['<path d="M3.5 21V10.2L12 4l8.5 6.2V21z"/>',
                 '<path d="M12 18.4l-3.3-3.1a2.2 2.2 0 013.3-2.9 2.2 2.2 0 013.3 2.9z"/>']
I_OUTCOMES    = ['<path d="M3.5 20.5h17"/>',
                 '<path d="M6.5 16.5v-3.6M11 16.5V9M15.5 16.5v-5.6M20 16.5V5.4"/>']


# ------------------------------------------------------------------ FIGURE 1
def fig1():
    """3.0 x 2.36in. Right-floated. Three-node cycle with a dotted exit below."""
    W, H = 300, 226
    cx, cy, r = 150, 100, 58
    b = []
    # cycle arcs, clockwise: unmet need -> hospital -> no care -> unmet need
    for d in ("M171.7 46.2 A 58 58 0 0 1 207.4 108.1",
              "M185.7 145.7 A 58 58 0 0 1 114.3 145.7",
              "M92.6 108.1 A 58 58 0 0 1 128.3 46.2"):
        b.append(f'<path d="{d}" fill="none" stroke="{TEAL}" stroke-width="1.5" marker-end="url(#sah)"/>')
    nodes = [(150, 42, "Unmet Need", I_PERSON_NEED, 150, 14, "middle"),
             (200, 129, "Hospital", I_HOSPITAL, 226, 133, "start"),
             (100, 129, "No Care", I_NOCARE, 74, 133, "end")]
    for x, y, label, icon, lx, ly, anc in nodes:
        b.append(f'<circle cx="{x}" cy="{y}" r="21" fill="#ffffff" stroke="{TEAL}" stroke-width="1.4"/>')
        b.append(_icon(x - 12.6, y - 12.6, icon, scale=1.05, sw=1.45))
        b.append(_t(lx, ly, label, 11.8, TEAL, anchor=anc, weight="bold"))
    # dotted exit: cases that cannot return home with adequate support
    b.append(f'<line x1="200" y1="152" x2="200" y2="180" stroke="{RED}" stroke-width="1.3" '
             f'stroke-dasharray="3.4 2.8" marker-end="url(#sar)"/>')
    b.append(f'<circle cx="200" cy="202" r="19" fill="{RFILL}" stroke="{RED}" stroke-width="1.3"/>')
    b.append(_icon(200 - 11.4, 202 - 11.4, I_FACILITY, scale=0.95, color=RED, sw=1.45))
    b.append(_t(172, 198, "Long-Term Care", 11.0, RED, anchor="end", weight="bold"))
    b.append(_t(172, 210, "Facility", 11.0, RED, anchor="end", weight="bold"))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 2
def fig2():
    """7.2 x 1.62in. Full width. Six-step spine with a phase boundary above."""
    W, H = 720, 148
    xs = [42, 158, 274, 390, 506, 622]
    labels = ["Assess Needs", "Identify Care", "Fund Care",
              "Staff Care", "Execute Plan", "Establish Care"]
    icons = [I_ASSESS, I_IDENTIFY, I_FUND, I_STAFF, I_EXECUTE, I_ESTABLISH]
    spine = 88
    b = []
    # phase bands, understated: a hairline rule with a small caps label
    bands = [(14, 332, "PRIOR NIA R&amp;D", GREY), (348, 666, "CRP R&amp;D AND VALIDATION", TEAL)]
    for x0, x1, txt, col in bands:
        b.append(f'<path d="M{x0} 26 v-7 H{x1} v7" fill="none" stroke="{col}" stroke-width="0.9"/>')
        b.append(_t((x0 + x1) / 2, 13, txt, 9.6, col, weight="bold", ls=0.9))
    # spine
    b.append(f'<line x1="14" y1="{spine}" x2="{xs[-1] + 26}" y2="{spine}" stroke="{RULE}" stroke-width="1.1"/>')
    for i, (x, lab, ic) in enumerate(zip(xs, labels, icons)):
        b.append(_icon(x - 14.4, 36, ic, scale=1.2, sw=1.5))
        b.append(f'<circle cx="{x}" cy="{spine}" r="4.6" fill="{TEAL}"/>')
        b.append(_t(x, spine + 20, lab, 11.6, TEAL, weight="bold"))
        if i < len(xs) - 1:
            b.append(f'<line x1="{x + 12}" y1="{spine}" x2="{xs[i+1] - 14}" y2="{spine}" '
                     f'stroke="{TEAL}" stroke-width="1.3" marker-end="url(#sah)"/>')
    # capacity gate note under Staff Care
    b.append(_t(xs[3], spine + 33, "capacity when needed", 9.4, GREY, style="italic"))
    # outcomes continuation, deliberately lighter than the pathway itself
    b.append(f'<line x1="{xs[-1] + 14}" y1="{spine}" x2="{xs[-1] + 46}" y2="{spine}" '
             f'stroke="{GREY}" stroke-width="1.1" stroke-dasharray="3.4 2.8" marker-end="url(#sagr)"/>')
    b.append(_icon(xs[-1] + 52, 76, I_OUTCOMES, scale=0.82, color=GREY, sw=1.5))
    b.append(_t(xs[-1] + 62, spine + 34, "Outcomes", 9.8, GREY, weight="bold"))
    b.append(_t(xs[-1] + 62, spine + 45, "tracked", 9.8, GREY, weight="bold"))
    return _wrap(W / 100, H / 100, "".join(b))


# ------------------------------------------------------------------ FIGURE 3
def fig3():
    """7.2 x 2.18in. Full width. Plateau, valley, five sequenced risks, plateau."""
    W, H = 720, 218
    b = []
    LX0, RX1 = 8, 712
    VX0, VX1 = 176, 544

    # terrain: two plateaus with a dip between, drawn under the plateau copy
    ridge = (f"M{LX0} 88 H158 C 222 88, 244 144, 306 146 "
             f"C 368 148, 396 82, 454 82 H{RX1}")
    b.append(f'<path d="{ridge} V158 H{LX0} Z" fill="{GFILL}" stroke="none"/>')
    b.append(f'<path d="{ridge}" fill="none" stroke="{TEAL}" stroke-width="1.4"/>')

    for x0, anchor, eyebrow, head, hcol, lines in [
        (LX0, "start", "TODAY", "Demonstrated demand", TEAL,
         ["15,500+ monthly visitors", "CareNavigator usability validated",
          "Staffing willingness to pay shown"]),
        (RX1, "end", "AT CRP COMPLETION", "Commercial sustainability", GREEN,
         ["Repeatable provider revenue", "Institutional evidence package",
          "Positioned for private investment"])]:
        b.append(_t(x0, 13, eyebrow, 9.4, GREY, anchor=anchor, weight="bold", ls=1.0))
        b.append(_t(x0, 31, head, 12.0, hcol, anchor=anchor, weight="bold"))
        for i, ln in enumerate(lines):
            b.append(_t(x0, 46 + i * 12.2, ln, 9.6, GREY, anchor=anchor))

    b.append(_t(360, 120, "VALLEY OF DEATH", 13.0, RED, weight="bold", ls=1.6))

    # five sequenced risks, left to right beneath the valley floor
    seg = (VX1 - VX0) / 5.0
    ty = 190
    b.append(f'<line x1="{VX0}" y1="{ty}" x2="{VX1 + 12}" y2="{ty}" stroke="{TEAL}" '
             f'stroke-width="1.3" marker-end="url(#sah)"/>')
    for i, rk in enumerate(["Technical", "Validation", "Evidence", "Commercial", "Financing"]):
        x = VX0 + seg * i + seg / 2
        b.append(f'<circle cx="{x}" cy="{ty}" r="7.6" fill="#ffffff" stroke="{TEAL}" stroke-width="1.3"/>')
        b.append(_t(x, ty + 3.6, str(i + 1), 9.8, TEAL, weight="bold"))
        b.append(_t(x, ty + 21, rk, 10.4, TEAL, weight="bold"))
    b.append(_t(360, 172, "THE FIVE REMAINING RISKS, RETIRED IN SEQUENCE", 9.4, GREY,
                weight="bold", ls=0.8))
    return _wrap(W / 100, H / 100, "".join(b))
