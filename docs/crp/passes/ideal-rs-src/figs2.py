# -*- coding: utf-8 -*-
"""Replacement figures 4 and 5 for the re-based Approach."""
from figs import TEAL, GREEN, GFILL, RED, RFILL, GREY, RULE, INK, _wrap, _box, _t

def fig4():
    """6.6 x 2.65in. Engineer, pilot free, pilot paid."""
    W,H=660,265
    b=[]
    stages=[(8,"AIM 1","YEAR 1","Engineer","the technology both","products require",GFILL),
            (240,"AIM 2","YEARS 1-2","Small pilot, free","two markets: families,","caregivers, providers","#ffffff"),
            (472,"AIM 3","YEARS 2-3","Commercialize","eight new markets,","paid customers",GFILL)]
    for x,aim,yr,t1,t2,t3,fill in stages:
        b.append(_t(x+90,15,yr,9.4,GREY,weight="bold",ls=1.0))
        b.append(_box(x,22,180,80,fill,TEAL,1.3))
        b.append(_t(x+90,41,aim,9.8,GREEN,weight="bold",ls=1.1))
        b.append(_t(x+90,60,t1,13.5,TEAL,weight="bold"))
        b.append(_t(x+90,77,t2,10.2,GREY))
        b.append(_t(x+90,91,t3,10.2,GREY))
    for x in (190,422):
        b.append(f'<line x1="{x}" y1="62" x2="{x+44}" y2="62" stroke="{GREEN}" stroke-width="1.8" marker-end="url(#ag)"/>')
        b.append(_t(x+22,50,"GATE",8.4,GREEN,weight="bold",ls=0.8))
    b.append(f'<line x1="8" y1="116" x2="652" y2="116" stroke="{RULE}" stroke-width="0.9"/>')
    b.append(_t(8,132,"GATE 1, month 12:",9.6,GREEN,anchor="start",weight="bold"))
    b.append(_t(112,132,"output verified against blinded expert review.",9.6,INK,anchor="start"))
    b.append(_t(340,132,"GATE 2, month 21:",9.6,GREEN,anchor="start",weight="bold"))
    b.append(_t(444,132,"care established and the staffing path completes.",9.6,INK,anchor="start"))
    b.append(_box(8,150,644,52,"#ffffff",RULE,1.0))
    b.append(_t(20,168,"WHAT AIM 2 HANDS TO AIM 3",9.4,GREEN,anchor="start",weight="bold",ls=1.0))
    items=[(24,"baseline conversion"),(160,"cost to serve"),(268,"fill rate and time to hire"),(432,"90-day retention"),(548,"the playbook")]
    for x,s in items:
        b.append(_t(x,189,s,10.0,INK,anchor="start"))
    for x in (152,260,424,540):
        b.append(f'<line x1="{x}" y1="179" x2="{x}" y2="193" stroke="{RULE}" stroke-width="0.9"/>')
    b.append(_t(330,222,"Every number Aim 3 prices against is produced in Aim 2, at no commercial risk, before any market opens for revenue.",10.2,GREY,style="italic"))
    b.append(_t(330,240,"Aim 3 is Aim 2 run larger, in markets we did not design in, with money changing hands.",10.2,GREY,style="italic"))
    return _wrap(W/100,H/100,"".join(b))

def fig5():
    """7.0 x 2.44in. Three-year timetable."""
    W,H=700,222
    b=[]
    x0=306
    qw=(W-x0-8)/12.0
    for yi,yr in enumerate(["YEAR 1  Jun 2027","YEAR 2  Jun 2028","YEAR 3  Jun 2029"]):
        b.append(_t(x0+qw*(yi*4+2),12,yr,9.4,GREY,weight="bold",ls=0.6))
        b.append(f'<line x1="{x0+qw*yi*4}" y1="17" x2="{x0+qw*(yi*4+4)-3}" y2="17" stroke="{RULE}" stroke-width="0.9"/>')
    for q in range(12):
        b.append(_t(x0+qw*(q+0.5),32,f"Q{q%4+1}",9.0,GREY))
    rows=[("Aim 1","1.1  Execution and follow-up loops",0,4,TEAL),
          ("","1.2  Database and domain model",0,4,TEAL),
          ("","1.3  Workforce infrastructure and record",0,4,TEAL),
          ("","1.4  Verification against expert review",2,4,TEAL),
          ("","1.5  Market selection and preparation",3,4,TEAL),
          ("Aim 2","2.1  Activate two markets, no charge",3,5,GREEN),
          ("","2.2  Care establishment, measured",4,8,GREEN),
          ("","2.3  Family study (IRB)",4,7,GREEN),
          ("","2.4  Recruit, place, retain caregivers",4,8,GREEN),
          ("","2.5  Provider study (IRB)",5,8,GREEN),
          ("","2.6  Cost to acquire, cost to serve",5,8,GREEN),
          ("Aim 3","3.1  Open eight markets: wave 1",6,9,TEAL),
          ("","\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0wave 2",8,11,TEAL),
          ("","3.2  Price under real billing",7,11,TEAL),
          ("","3.3  Unit economics and retention",7,12,TEAL),
          ("","3.4  Provider and worker study at scale (IRB)",8,12,TEAL),
          ("","3.5  Independent rebuild, investor package",10,12,TEAL)]
    y=42
    for grp,name,s,e,col in rows:
        if grp: b.append(_t(8,y+10,grp,9.8,GREEN,anchor="start",weight="bold"))
        b.append(_t(52,y+10,name,9.2,INK,anchor="start"))
        b.append(f'<rect x="{x0}" y="{y+2}" width="{qw*12}" height="9.6" fill="#f4f6f4"/>')
        for q in range(1,12):
            b.append(f'<line x1="{x0+qw*q}" y1="{y+2}" x2="{x0+qw*q}" y2="{y+11.6}" stroke="#ffffff" stroke-width="0.8"/>')
        b.append(f'<rect x="{x0+qw*s}" y="{y+2}" width="{qw*(e-s)}" height="9.6" rx="2" fill="{col}" opacity="0.85"/>')
        y+=10.2
    for q,txt in [(4,"Month 12"),(7,"Month 21"),(10,"Month 30"),(12,"Award end")]:
        xx=x0+qw*q
        b.append(f'<line x1="{xx}" y1="38" x2="{xx}" y2="{y+5}" stroke="{RED}" stroke-width="1.3"/>')
        b.append(_t(xx-2,y+16,txt,9.0,RED,anchor="end",weight="bold"))
    b.append(_t(8,y+16,"DECISION POINTS",9.0,RED,anchor="start",weight="bold",ls=1.0))
    b.append(_t(52,y+32,"Month 12: Aim 1 gate, or Aim 2 activation is held.   Month 21: Aim 2 gate, or wave 1 is held.   Month 30: interim price analysis and the stop rule, or wave 2 is held.",9.0,GREY,anchor="start",style="italic"))
    return _wrap(W/100,H/100,"".join(b))
