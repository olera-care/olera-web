# -*- coding: utf-8 -*-
"""Replacement figures 4 and 5 for the re-based Approach."""
from figs import TEAL, GREEN, GFILL, RED, RFILL, GREY, RULE, INK, _wrap, _box, _t

def fig4():
    """6.6 x 1.26in. Three stages, two gates, nothing else.

    Gate labels sit below the boxes so they cannot collide with them, and
    every subtitle line is kept short enough to stay inside its box.
    """
    W,H=660,126
    BW, GAP = 186, 47
    b=[]
    stages=[(4,"AIM 1  \u00b7  YEAR 1","VERIFY",
             "Build the products and verify","the output against expert review",GFILL),
            (237,"AIM 2  \u00b7  YEARS 1-2","VALIDATE",
             "Two free markets. Does care get","established, and does staffing work?","#ffffff"),
            (470,"AIM 3  \u00b7  YEARS 2-3","COMMERCIALIZE",
             "Eight new paid markets. Do the","economics hold, and does it repeat?",GFILL)]
    for x,aim,t1,t2,t3,fill in stages:
        cx = x + BW/2
        b.append(_box(x,10,BW,84,fill,TEAL,1.3))
        b.append(_t(cx,29,aim,9.0,GREEN,weight="bold",ls=1.0))
        b.append(_t(cx,52,t1,14.0,TEAL,weight="bold",ls=0.5))
        b.append(_t(cx,71,t2,8.8,GREY))
        b.append(_t(cx,83,t3,8.8,GREY))
    for gx,lab in ((190,"GATE: EXPERT REVIEW"),(423,"GATE: OUTCOMES")):
        cx = gx + GAP/2
        b.append(f'<line x1="{gx+4}" y1="52" x2="{gx+GAP-4}" y2="52" stroke="{GREEN}" stroke-width="1.8" marker-end="url(#ag)"/>')
        b.append(_t(cx,112,lab,8.6,GREEN,weight="bold",ls=0.7))
    return _wrap(W/100,H/100,"".join(b))

def fig5():
    """7.0 x 2.44in. Three-year timetable."""
    W,H=700,204
    b=[]
    x0=306
    qw=(W-x0-8)/12.0
    for yi,yr in enumerate(["YEAR 1  Jun 2027","YEAR 2  Jun 2028","YEAR 3  Jun 2029"]):
        b.append(_t(x0+qw*(yi*4+2),12,yr,9.4,GREY,weight="bold",ls=0.6))
        b.append(f'<line x1="{x0+qw*yi*4}" y1="17" x2="{x0+qw*(yi*4+4)-3}" y2="17" stroke="{RULE}" stroke-width="0.9"/>')
    for q in range(12):
        b.append(_t(x0+qw*(q+0.5),32,f"Q{q%4+1}",9.0,GREY))
    rows=[("Aim 1","1.1  Execution and follow-up loops",0,4,TEAL),
          ("","1.2  Database, retrieval, and outcomes record",0,4,TEAL),
          ("","1.3  Workforce infrastructure and record",0,4,TEAL),
          ("","1.4  Verification against expert review",2,4,TEAL),
          ("Aim 2","2.1  Activate two markets, no charge",3,5,GREEN),
          ("","2.2  Recruit, place, retain caregivers",4,8,GREEN),
          ("","2.3  Care establishment, measured",4,8,GREEN),
          ("","2.4  Family, provider, and worker study (IRB)",4,8,GREEN),
          ("","2.5  Cost to acquire, cost to serve, value",5,8,GREEN),
          ("Aim 3","3.1  Open eight markets: wave 1",6,9,TEAL),
          ("","\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0wave 2",8,11,TEAL),
          ("","3.2  Price under real billing",7,11,TEAL),
          ("","3.3  Economics, and independent validation",7,12,TEAL),
          ("","3.4  Provider and worker study at scale (IRB)",8,12,TEAL),
          ("","3.5  Institutional-buyer evidence package",9,12,TEAL)]
    y=42
    for grp,name,s,e,col in rows:
        if grp: b.append(_t(8,y+10,grp,9.8,GREEN,anchor="start",weight="bold"))
        b.append(_t(52,y+10,name,9.2,INK,anchor="start"))
        b.append(f'<rect x="{x0}" y="{y+2}" width="{qw*12}" height="9.6" fill="#f4f6f4"/>')
        for q in range(1,12):
            b.append(f'<line x1="{x0+qw*q}" y1="{y+2}" x2="{x0+qw*q}" y2="{y+11.6}" stroke="#ffffff" stroke-width="0.8"/>')
        b.append(f'<rect x="{x0+qw*s}" y="{y+2}" width="{qw*(e-s)}" height="9.6" rx="2" fill="{col}" opacity="0.85"/>')
        y+=9.6
    for q,txt in [(4,"Month 12"),(7,"Month 21"),(10,"Month 30"),(12,"Award end")]:
        xx=x0+qw*q
        b.append(f'<line x1="{xx}" y1="38" x2="{xx}" y2="{y+5}" stroke="{RED}" stroke-width="1.3"/>')
        b.append(_t(xx-2,y+16,txt,9.0,RED,anchor="end",weight="bold"))
    b.append(_t(8,y+16,"DECISION POINTS",9.0,RED,anchor="start",weight="bold",ls=1.0))
    return _wrap(W/100,H/100,"".join(b))
