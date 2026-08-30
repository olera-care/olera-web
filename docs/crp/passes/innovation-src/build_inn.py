# -*- coding: utf-8 -*-
"""INNOVATION section, in the Research Strategy house style.

Source: Logan's Innovation draft, 2026-08-30 (supplied as a screenshot; the
figures themselves are not yet in hand). Prose is the author's. The four figure
slots carry the aspect ratios read off the draft and are filled from png/ when
the source images arrive: dropping a file at the named path is the only change
needed.
"""
import os

WORD = os.environ.get('WORD_EXPORT') == '1'

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; orphans: 2; widows: 2; }
p.sec { margin: 6pt 0 3pt 0; }
p.first-sec { margin-top: 0; }
p.caption { text-align: left; margin: 2pt 0 4pt 0; font-size: 9pt;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
h1.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 0 0 5pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt; }
sup { line-height: 0; font-size: 7.5pt; }

div.fig { margin: 5pt 0 2pt 0; text-align: center;
          break-inside: avoid; page-break-inside: avoid; }
div.fig img { display: inline-block; max-width: 100%; }
div.figwrap { float: right; margin: 2pt 0 5pt 13pt;
              break-inside: avoid; page-break-inside: avoid; }
div.figwrap img { display: block; max-width: 100%; }
div.figwrap div.fig { margin: 0; }
div.figwrap p.caption { margin: 3pt 0 0 0; }
p.clearfix { clear: both; margin: 0; height: 0; line-height: 0; }
div.figblk { break-inside: avoid; page-break-inside: avoid; margin: 0; }

/* Slot standing in for a figure whose source image is not yet in hand. Sized to
   the real figure's proportions so the text flow is the final flow. */
div.slot { border: 0.8pt dashed #8ba69d; background: #f4f7f6; color: #14453f;
           display: flex; flex-direction: column; align-items: center;
           justify-content: center; font-size: 9pt; text-align: center; }
div.slot b { font-size: 10pt; }
div.slot span { color: #5b6f68; font-size: 8.5pt; margin-top: 2pt; }
"""

# figure key -> (width in, height in, source png, floated, caption)
FIGS = {
    'FIG1': (3.35, 2.15, 'png/fig1.png', True,
             "Real-world events become a longitudinal, computable pathway."),
    'REC':  (7.30, 0.78, 'png/case-record.png', False, None),
    'FIG2': (7.30, 3.55, 'png/fig2.png', False,
             "From information to execution. CareNavigator agents use real-world channels and "
             "tools to carry administrative work forward, persist across time, and verify outcomes."),
    'FIG3': (4.30, 3.85, 'png/fig3.png', True,
             "From redistributing the same workforce to creating new capacity that establishes care."),
    'CAP':  (3.05, 1.15, 'png/capacity.png', False, None),
    'FIG4': (7.30, 3.85, 'png/fig4.png', False,
             "One platform, different paths, the same outcome: care established."),
}
NUM = {'FIG1': 1, 'FIG2': 2, 'FIG3': 3, 'FIG4': 4}

def block(key):
    w, h, src, float_, cap = FIGS[key]
    if os.path.exists(src):
        inner = f'<img src="{src}" style="width:{w}in">'
    else:
        label = f'Figure {NUM[key]}' if key in NUM else \
                {'REC': 'Longitudinal case record', 'CAP': 'Olera capacity intelligence'}[key]
        inner = (f'<div class="slot" style="width:{w}in;height:{h}in">'
                 f'<b>{label}</b><span>source image pending &#183; {w} &#215; {h} in</span></div>')
    fig = f'<div class="fig">{inner}</div>'
    if cap:
        fig += f'<p class="caption"><b>Figure {NUM[key]}.</b> {cap}</p>'
    if float_:
        return f'<div class="figwrap" style="width:{w}in">{fig}</div>'
    return f'<div class="figblk">{fig}</div>'

BODY = f"""
<h1 class="sechead">Innovation</h1>

{block('FIG1')}
<p class="sec first-sec"><b>Key Innovation 1: making the care-establishment pathway computable.</b>
Existing systems capture resources, eligibility, referrals, or utilization in isolation, leaving the
pathway from recognized need to established care poorly observed and difficult to compute. Olera has
already modeled the early pathway states through Phase I&#8211;IIB: needs and means, available
benefits and aid, and relevant providers. The CRP extends this foundation by turning real-world
events along the full care-establishment pathway into persistent, longitudinal state so the entire
journey can be computed, tracked, and learned from (Figure 1).</p>

<p class="sec">As the family moves through the eldercare ecosystem, CareNavigator records events,
tasks, responses, and outcomes, updating the case state at each step. This longitudinal record is the
essential foundation enabling the downstream innovations below: AI execution that can act on the
right next step, and capacity intelligence that detects when workforce shortages are blocking
care.</p>
<p class="clearfix"></p>

{block('REC')}

<p class="sec"><b>Key Innovation 2: AI agents that execute the care-establishment pathway.</b>
Families still perform much of the administrative work required to make care actually begin.
CareNavigator advances from planning what should happen to executing what must happen. Using the
longitudinal case state, our agents plan the next action, use appropriate tools, interact across
real-world channels, and persist until outcomes are verified (Figure 2).</p>

{block('FIG2')}

{block('FIG3')}
<p class="sec"><b>Key Innovation 3: creating caregiver capacity where the pathway fails.</b>
Execution reveals capacity failures when no provider can staff the needed care. Conventional channels
recycle the same limited caregiver pool. Caregiver Staffing creates new workforce supply and directs
it to the places where families are being blocked (Figure 3).</p>

<p class="sec">We launch with pre-health students, a well-aligned and large population seeking
patient-care experience. In our pilot, this approach already attracted more than 900 applicants. We
recruit through universities, pre-health organizations, career centers, and digital outreach. The
same infrastructure will expand to other new labor pools, such as students in health-related fields,
career changers, and trained workers not currently in direct care.</p>

{block('CAP')}
<p class="clearfix"></p>

<p class="sec"><b>The final end product: the CareNavigator experience.</b> To families, these
innovations appear as one system. Through the web and mobile experience, families see what is needed,
what CareNavigator is doing, what is pending, what requires their approval, and whether care has been
established. The same platform handles very different real-world cases across the eldercare ecosystem
(Figure 4).</p>

{block('FIG4')}
"""

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""

out = 'inn_word.html' if WORD else 'inn.html'
open(out, 'w', encoding='utf-8').write(DOC)
missing = [k for k in FIGS if not os.path.exists(FIGS[k][2])]
print('wrote', out)
print('figure sources still pending:', ', '.join(FIGS[k][2] for k in missing) or 'none')
