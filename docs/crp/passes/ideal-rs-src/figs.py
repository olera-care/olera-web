# -*- coding: utf-8 -*-
"""SVG figures for the CRP Research Strategy, sized in inches for portrait letter.
100 svg units = 1 inch. Type sized for 11pt-body print: labels 9pt=12.5u, small 7.5pt=10.4u."""

TEAL   = "#14453f"
GREEN  = "#1a7f4e"
GFILL  = "#e8f1ec"
RED    = "#9b1c1c"
RFILL  = "#fbeeec"
GREY   = "#5f6b64"
RULE   = "#b9c4bd"
INK    = "#111111"

def _defs():
    return f'''<defs>
<marker id="ah" markerWidth="8" markerHeight="6" refX="7.2" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="{TEAL}"/></marker>
<marker id="ag" markerWidth="8" markerHeight="6" refX="7.2" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="{GREEN}"/></marker>
<marker id="ar" markerWidth="8" markerHeight="6" refX="7.2" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 z" fill="{RED}"/></marker>
</defs>'''

def _wrap(w_in, h_in, body):
    return (f'<svg viewBox="0 0 {int(w_in*100)} {int(h_in*100)}" width="{w_in}in" height="{h_in}in" '
            f'xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">'
            f'{_defs()}{body}</svg>')

def _box(x,y,w,h,fill="#ffffff",stroke=RULE,sw=1.1,dash=None,rx=3):
    d=f' stroke-dasharray="{dash}"' if dash else ''
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>'

def _t(x,y,s,size=12.5,fill=INK,anchor="middle",weight="normal",style="normal",ls=0):
    return (f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
            f'font-weight="{weight}" font-style="{style}" letter-spacing="{ls}">{s}</text>')

# ---------------------------------------------------------------- FIGURE 1
def fig1():
    """6.7 x 4.55in. The eldercare ecosystem, the three gates, and the cycle."""
    W,H=670,398
    b=[]
    b.append(_t(140,13,"HOW CARE GETS PAID FOR",10.4,GREY,weight="bold",ls=1.1))
    b.append(_t(530,13,"WHERE CARE COMES FROM",10.4,GREY,weight="bold",ls=1.1))
    b.append(f'<line x1="18" y1="19" x2="262" y2="19" stroke="{RULE}" stroke-width="0.9"/>')
    b.append(f'<line x1="408" y1="19" x2="652" y2="19" stroke="{RULE}" stroke-width="0.9"/>')
    quads=[(18,26,"Public Aid Programs","SNAP, housing aid, SSI, VA pension, Medicaid waivers"),
           (18,98,"Insurance Coverage","Medicare, Medicare Advantage, Medicaid, commercial"),
           (408,26,"Healthcare Services","Home health, hospice, skilled nursing, rehabilitation"),
           (408,98,"Long-Term Services and Supports","Home care, assisted living, adult day")]
    for x,y,t1,t2 in quads:
        b.append(_box(x,y,244,50,"#ffffff"))
        b.append(_t(x+122,y+20,t1,12.5,TEAL,weight="bold"))
        b.append(_t(x+122,y+37,t2,9.6,GREY))
    b.append(_box(272,62,126,50,GFILL,GREEN,1.3))
    b.append(_t(335,80,"Older adult",12.5,TEAL,weight="bold"))
    b.append(_t(335,96,"and family",12.5,TEAL,weight="bold"))
    for x1,y1,x2,y2 in [(262,56,272,74),(262,124,272,106),(408,56,398,74),(408,124,398,106)]:
        b.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{RULE}" stroke-width="1.1"/>')
    b.append(_t(335,164,"Four systems, separate eligibility rules, and no single party accountable for whether care actually begins",10.2,GREY,style="italic"))
    gy=182
    b.append(_t(18,gy,"A RECOGNIZED NEED BECOMES ESTABLISHED CARE ONLY BY CLEARING ALL THREE GATES",10.4,GREY,anchor="start",weight="bold",ls=1.1))
    gates=[(18,"GATE 1","Find it","a fragmented ecosystem"),
           (185,"GATE 2","Afford it","$58B in aid unclaimed"),
           (352,"GATE 3","Staff it","63.3% declined cases")]
    for x,g,t,s2 in gates:
        b.append(_box(x,gy+10,155,58,"#ffffff",TEAL,1.2))
        b.append(_t(x+77,gy+27,g,9.6,GREEN,weight="bold",ls=1.0))
        b.append(_t(x+77,gy+44,t,13.5,TEAL,weight="bold"))
        b.append(_t(x+77,gy+59,s2,10.0,GREY))
    for x in (175,342):
        b.append(f'<line x1="{x}" y1="{gy+39}" x2="{x+8}" y2="{gy+39}" stroke="{TEAL}" stroke-width="1.2" marker-end="url(#ah)"/>')
    b.append(f'<line x1="509" y1="{gy+39}" x2="525" y2="{gy+39}" stroke="{GREEN}" stroke-width="1.5" marker-end="url(#ag)"/>')
    b.append(_box(529,gy+10,123,58,GFILL,GREEN,1.3))
    b.append(_t(590,gy+35,"Established",13.5,GREEN,weight="bold"))
    b.append(_t(590,gy+52,"care",13.5,GREEN,weight="bold"))
    cy=272
    for x in (95,262,429):
        b.append(f'<line x1="{x}" y1="{gy+70}" x2="{x}" y2="{cy+2}" stroke="{RED}" stroke-width="1.1" stroke-dasharray="4 3" marker-end="url(#ar)"/>')
    b.append(_box(18,cy+6,634,112,RFILL,RED,1.1,dash="5 4"))
    b.append(_t(335,cy+26,"FAILURE AT ANY GATE ENTERS THE SAME CYCLE",10.4,RED,weight="bold",ls=1.1))
    stops=[(92,"Need goes unmet"),(248,"Function declines"),(408,"Crisis, then hospital"),(568,"Discharge, no support")]
    for x,s2 in stops:
        b.append(_t(x,cy+56,s2,11.2,RED))
    for x1 in (160,318,478):
        b.append(f'<line x1="{x1}" y1="{cy+52}" x2="{x1+20}" y2="{cy+52}" stroke="{RED}" stroke-width="1.1" marker-end="url(#ar)"/>')
    b.append(f'<path d="M568,{cy+64} L568,{cy+78} L92,{cy+78} L92,{cy+64}" fill="none" stroke="{RED}" stroke-width="1.1" marker-end="url(#ar)"/>')
    b.append(_t(335,cy+92,"Caregiver breakdown, premature institutionalization, savings exhausted, public programs absorb the cost.",10.2,RED,style="italic"))
    b.append(_t(335,cy+107,"Each turn deepens the need that started it.",10.2,RED,style="italic"))
    return _wrap(W/100,H/100,"".join(b))

# ---------------------------------------------------------------- FIGURE 2
def fig2():
    """2.6 x 2.0in wrapped. Demand rising, supply falling."""
    W,H=260,200
    b=[]
    b.append(f'<line x1="30" y1="14" x2="30" y2="150" stroke="{RULE}" stroke-width="1"/>')
    b.append(f'<line x1="30" y1="150" x2="250" y2="150" stroke="{RULE}" stroke-width="1"/>')
    b.append(_t(32,166,"2010",9.4,GREY,anchor="start"))
    b.append(_t(140,166,"2030",9.4,GREY))
    b.append(_t(248,166,"2050",9.4,GREY,anchor="end"))
    b.append(f'<path d="M30,132 C90,124 150,86 250,34" fill="none" stroke="{GREEN}" stroke-width="2.2"/>')
    b.append(f'<circle cx="250" cy="34" r="3.4" fill="{GREEN}"/>')
    b.append(_t(246,24,"82M over 65",10.4,GREEN,anchor="end",weight="bold"))
    b.append(_t(34,126,"40M",9.4,GREEN,anchor="start"))
    b.append(f'<path d="M30,30 C80,50 110,86 140,100 C180,118 214,128 250,134" fill="none" stroke="{RED}" stroke-width="2.2" stroke-dasharray="6 3"/>')
    b.append(f'<circle cx="30" cy="30" r="3.4" fill="{RED}"/>')
    b.append(_t(62,18,"7 family caregivers",10.4,RED,anchor="start",weight="bold"))
    b.append(_t(62,31,"per adult 80+",10.0,RED,anchor="start"))
    b.append(f'<circle cx="140" cy="100" r="3.4" fill="{RED}"/>')
    b.append(_t(148,98,"4 by 2030",10.4,RED,anchor="start",weight="bold"))
    b.append(_t(130,186,"Paid workforce short 9.7M openings, 2024-2034",9.4,GREY))
    return _wrap(W/100,H/100,"".join(b))

# ---------------------------------------------------------------- FIGURE 3
def fig3():
    """3.0 x 2.45in wrapped. The workforce pathway."""
    W,H=300,245
    b=[]
    b.append(_box(8,8,270,42,RFILL,RED,1.0,dash="5 4"))
    b.append(_t(143,26,"Agencies, job boards, gig platforms",10.8,RED,weight="bold"))
    b.append(_t(143,41,"move workers between employers. The pool does not grow.",9.6,RED))
    b.append(_box(8,64,270,44,"#ffffff",TEAL,1.2))
    b.append(_t(143,82,"People not yet in eldercare",12.0,TEAL,weight="bold"))
    b.append(_t(143,99,"first tested: health-professions students",9.8,GREY))
    b.append(f'<line x1="143" y1="110" x2="143" y2="124" stroke="{TEAL}" stroke-width="1.2" marker-end="url(#ah)"/>')
    b.append(_box(8,128,270,44,GFILL,GREEN,1.2))
    b.append(_t(143,146,"Licensed provider hires and supervises",12.0,TEAL,weight="bold"))
    b.append(_t(143,163,"trains, insures, employs; work stays licensed",9.8,GREY))
    b.append(f'<line x1="143" y1="174" x2="143" y2="188" stroke="{GREEN}" stroke-width="1.2" marker-end="url(#ag)"/>')
    b.append(_box(8,192,270,44,"#ffffff",GREEN,1.4))
    b.append(_t(143,210,"The direct-care workforce grows",12.0,GREEN,weight="bold"))
    b.append(_t(143,227,"verified record travels to the next employer",9.8,GREY))
    b.append(f'<path d="M278,214 L290,214 L290,86 L278,86" fill="none" stroke="{GREEN}" stroke-width="1.1" stroke-dasharray="4 3" marker-end="url(#ag)"/>')
    return _wrap(W/100,H/100,"".join(b))

# ---------------------------------------------------------------- FIGURE 4
def fig4():
    """6.5 x 2.15in. Three aims, one chain of evidence."""
    W,H=650,215
    b=[]
    b.append(_t(8,12,"YEARS 1 TO 2, IN THE SAME MARKETS",9.8,GREY,anchor="start",weight="bold",ls=1.0))
    b.append(_t(642,12,"YEARS 2 TO 3",9.8,GREY,anchor="end",weight="bold",ls=1.0))
    b.append(_box(8,22,220,58,"#ffffff",TEAL,1.2))
    b.append(_t(20,40,"AIM 1",9.6,GREEN,anchor="start",weight="bold",ls=1.0))
    b.append(_t(20,58,"Establish care reliably",13.0,TEAL,anchor="start",weight="bold"))
    b.append(_t(20,73,"and prove it was established",10.0,GREY,anchor="start"))
    b.append(_box(8,120,220,58,"#ffffff",TEAL,1.2))
    b.append(_t(20,138,"AIM 2",9.6,GREEN,anchor="start",weight="bold",ls=1.0))
    b.append(_t(20,156,"Add new caregivers",13.0,TEAL,anchor="start",weight="bold"))
    b.append(_t(20,171,"and fill vacant jobs at licensed providers",10.0,GREY,anchor="start"))
    b.append(f'<path d="M230,51 L262,51 L262,99 L292,99" fill="none" stroke="{GREEN}" stroke-width="1.4" marker-end="url(#ag)"/>')
    b.append(f'<path d="M230,149 L262,149 L262,99" fill="none" stroke="{GREEN}" stroke-width="1.4"/>')
    b.append(_t(234,36,"gate: 85% agreement,",8.8,GREEN,anchor="start"))
    b.append(_t(234,45,"errors under 10%",8.8,GREEN,anchor="start"))
    b.append(_t(234,160,"gate: staffing path",8.8,GREEN,anchor="start"))
    b.append(_t(234,169,"completes end to end",8.8,GREEN,anchor="start"))
    b.append(_box(296,62,222,76,GFILL,GREEN,1.4))
    b.append(_t(308,80,"AIM 3",9.6,GREEN,anchor="start",weight="bold",ls=1.0))
    b.append(_t(308,99,"Do providers pay, and",13.0,TEAL,anchor="start",weight="bold"))
    b.append(_t(308,115,"do the economics hold?",13.0,TEAL,anchor="start",weight="bold"))
    b.append(_t(308,131,"tested against the cost of serving families",9.4,GREY,anchor="start"))
    b.append(f'<line x1="520" y1="99" x2="538" y2="99" stroke="{GREEN}" stroke-width="1.4" marker-end="url(#ag)"/>')
    b.append(_box(542,50,100,100,"#ffffff",TEAL,1.4))
    b.append(_t(592,70,"A product",10.6,TEAL,weight="bold"))
    b.append(_t(592,82,"that works",10.6,TEAL,weight="bold"))
    b.append(_t(592,100,"A model",10.6,TEAL,weight="bold"))
    b.append(_t(592,112,"that repeats",10.6,TEAL,weight="bold"))
    b.append(_t(592,130,"Evidence they",10.6,TEAL,weight="bold"))
    b.append(_t(592,142,"can check",10.6,TEAL,weight="bold"))
    b.append(_t(325,204,"Aim 1 without Aim 2 routes family demand at a supply side that cannot absorb it. Aim 3 is meaningless without both.",9.8,GREY,style="italic"))
    return _wrap(W/100,H/100,"".join(b))

# ---------------------------------------------------------------- FIGURE 5
def fig5():
    """7.0 x 2.55in. Three-year timetable."""
    W,H=700,255
    b=[]
    x0=258
    qw=(W-x0-8)/12.0
    for yi,yr in enumerate(["YEAR 1  Jun 2027","YEAR 2  Jun 2028","YEAR 3  Jun 2029"]):
        b.append(_t(x0+qw*(yi*4+2),12,yr,9.8,GREY,weight="bold",ls=0.8))
        b.append(f'<line x1="{x0+qw*yi*4}" y1="17" x2="{x0+qw*(yi*4+4)-3}" y2="17" stroke="{RULE}" stroke-width="0.9"/>')
    for q in range(12):
        b.append(_t(x0+qw*(q+0.5),32,f"Q{q%4+1}",9.0,GREY))
    rows=[("Aim 1","Task 1.1-1.2  Build and verify the loops",0,5),
          ("","Task 1.3  IRB usability and trust study",4,8),
          ("","Task 1.4  Cost to acquire and cost to serve",2,12),
          ("Aim 2","Task 2.1-2.2  Pipeline and placement pathway",0,6),
          ("","Task 2.3  IRB provider and worker study",5,9),
          ("","Task 2.4  Net-new share and retention",3,12),
          ("","Task 2.5  Second worker-pool pilot",8,12),
          ("Aim 3","Task 3.1  Randomized offer prices",5,10),
          ("","Task 3.2  Unit economics and retention",6,12),
          ("","Task 3.3-3.4  Interviews, independent rebuild",9,12),
          ("","Task 3.5  Payer evidence package",7,12),
          ("Markets","2 anchors, wave 1 (+4), wave 2 (+4)",0,12)]
    y=42
    for grp,name,s,e in rows:
        if grp: b.append(_t(8,y+11,grp,9.8,GREEN,anchor="start",weight="bold"))
        b.append(_t(58,y+11,name,9.6,INK,anchor="start"))
        b.append(f'<rect x="{x0}" y="{y+2}" width="{qw*12}" height="13" fill="#f4f6f4"/>')
        for q in range(1,12):
            b.append(f'<line x1="{x0+qw*q}" y1="{y+2}" x2="{x0+qw*q}" y2="{y+15}" stroke="#ffffff" stroke-width="0.8"/>')
        if grp=="Markets":
            for a,z,lb in [(0,4,"2"),(4,8,"+4"),(8,12,"+4")]:
                b.append(f'<rect x="{x0+qw*a+1}" y="{y+2}" width="{qw*(z-a)-2}" height="13" rx="2" fill="{GREEN}" opacity="0.82"/>')
                b.append(_t(x0+qw*(a+z)/2,y+12,lb,9.0,"#ffffff",weight="bold"))
        else:
            b.append(f'<rect x="{x0+qw*s}" y="{y+2}" width="{qw*(e-s)}" height="13" rx="2" fill="{TEAL}" opacity="0.82"/>')
        y+=16
    for m,q,txt in [(12,4,"Month 12"),(24,8,"Month 24"),(36,12,"Award end")]:
        xx=x0+qw*q
        b.append(f'<line x1="{xx}" y1="38" x2="{xx}" y2="{y+6}" stroke="{RED}" stroke-width="1.3"/>')
        b.append(_t(xx-2,y+18,txt,9.4,RED,anchor="end",weight="bold"))
    b.append(_t(8,y+18,"DECISION POINTS",9.4,RED,anchor="start",weight="bold",ls=1.0))
    b.append(_t(58,y+34,"Month 12: loops verified and pipeline running, or wave 1 is held.   Month 24: gates met and stop rule evaluated, or wave 2 is held and effort redirects to the payer package.",9.4,GREY,anchor="start",style="italic"))
    return _wrap(W/100,H/100,"".join(b))
