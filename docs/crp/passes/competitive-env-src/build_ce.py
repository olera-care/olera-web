# -*- coding: utf-8 -*-
"""Competitive environment section, in the Research Strategy house style.

Source: competitive_environment_draft.docx (Logan, 2026-08-29). The prose is the
author's; this script supplies the house typography, the Table 2 matrix, and the
four-advantage block. The draft's working verification notes are not rendered;
they are kept in verification-notes.md.
"""
import os

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; }
p.sec { margin: 6pt 0 3pt 0; }
p.first-sec { margin-top: 0; }
p.leadin { break-after: avoid; page-break-after: avoid; }
p.caption { text-align: left; margin: 2pt 0 4pt 0; font-size: 9pt;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
h1.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 0 0 5pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt; }
sup { line-height: 0; font-size: 7.5pt; }

/* The comparison matrix. Label columns read left; every rating column is
   centered so the marks form vertical bands the eye can scan down a column
   without reading a single word. */
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 6pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0;
                     vertical-align: bottom; }
table.dat thead th.m { text-align: center; padding: 0 2pt 2.5pt 2pt; }
table.dat td { padding: 2.6pt 6pt 2.6pt 0; border-bottom: 0.4pt solid #b9c4bd;
               vertical-align: top; }
table.dat td.m { text-align: center; padding: 2.6pt 2pt; font-size: 9.5pt;
                 line-height: 1.05; letter-spacing: -0.2pt; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.dat tbody tr.us td { background: #eef3f1; }
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }

/* the four advantages, as a 2x2 block rather than a wall of run-in prose */
table.adv { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.18;
            margin: 5pt 0 5pt 0; }
table.adv td { padding: 4pt 9pt 5pt 0; vertical-align: top;
               border-top: 0.8pt solid #b9c4bd; width: 50%; }
table.adv td b { color: #14453f; }
table.adv tr { break-inside: avoid; page-break-inside: avoid; }
"""

# A three-step size progression rather than filled/half/hollow. The half-filled
# circle U+25D0 is outside Arial's core glyph set, so it falls back to another
# face and lands at a different visual weight beside the other two marks. A large
# dot, a small dot, and a ring are all core Arial, and read as full, some, none.
FULL, PART, NONE = '&#9679;', '&#8226;', '&#9675;'
BOTH = FULL + '&#8202;/&#8202;' + PART

# category, examples, [assess, find, fund, execute, establish, workforce, open access]
ROWS = [
    ("Public information and benefits", "Eldercare Locator; BenefitsCheckUp",
     [PART, FULL, FULL, PART, NONE, NONE, FULL], False),
    ("General-purpose AI", "ChatGPT; Claude; Gemini",
     [FULL, FULL, FULL, PART, NONE, NONE, FULL], False),
    ("Human navigation", "Discharge planners; case managers; private care managers",
     [FULL, FULL, FULL, FULL, BOTH, NONE, PART], False),
    ("Digital and hybrid navigation", "Wellthy; Homethrive; Cariloop",
     [FULL, FULL, FULL, FULL, BOTH, NONE, PART], False),
    ("Senior-care referral marketplaces", "A Place for Mom; Caring.com",
     [PART, FULL, NONE, PART, PART, NONE, PART], False),
    ("Workforce recruitment", "Indeed; myCNAjobs; staffing agencies; referrals",
     [NONE, NONE, NONE, NONE, NONE, FULL, NONE], False),
    ("Olera after the CRP", "CareNavigator with Caregiver Staffing",
     [FULL, FULL, FULL, FULL, FULL, FULL, FULL], True),
]

# The two right-hand headers are short forms; the caption carries their
# definitions, which keeps the five pathway columns wide enough that Word
# does not break their headers mid-word.
HEADS = ["Assess", "Find", "Fund", "Execute", "Establish",
         "New workforce", "Open access"]
WIDTHS = [16.5, 22.3, 7.0, 5.8, 5.8, 7.6, 8.6, 12.0, 14.4]

def table2():
    th = (f'<th style="width:{WIDTHS[0]}%">Competitive category</th>'
          f'<th style="width:{WIDTHS[1]}%">Representative examples</th>')
    th += ''.join(f'<th class="m" style="width:{w}%">{h}</th>'
                  for h, w in zip(HEADS, WIDTHS[2:]))
    body = ''
    for cat, ex, marks, us in ROWS:
        cls = ' class="us"' if us else ''
        cells = ''.join(f'<td class="m">{m}</td>' for m in marks)
        body += f'<tr{cls}><td><b>{cat}</b></td><td>{ex}</td>{cells}</tr>'
    return (f'<table class="dat keep"><thead><tr>{th}</tr></thead>'
            f'<tbody>{body}</tbody></table>')

ADV = [
    ("Digital scale.", "The pathway can be screened and navigated across populations through the "
     "open web and mobile applications, with further distribution through institutional partners."),
    ("Open pathway.", "Families can enter without payment or institutional sponsorship and providers "
     "can participate without paying for referrals, preserving broad, neutral participation while "
     "giving the instrumented pathway visibility across more families and providers."),
    ("Demand and capacity.", "CareNavigator can connect providers at no referral cost with families "
     "whose needs, funding options, and service fit have been characterized. Caregiver Staffing can "
     "mobilize new, deliberately targeted labor pools rather than only redistribute scarce workers, "
     "while remaining independently useful to providers regardless of where their demand originates. "
     "Pathway data can further identify where workforce shortages are blocking care."),
    ("Accountability and evidence.", "Olera follows the case to the meaningful endpoint of "
     "established care rather than ending wherever an individual service's function ends, creating "
     "evidence about whether the pathway worked, where it failed, and how long it took."),
]

def advblock():
    rows = ''
    for i in range(0, len(ADV), 2):
        cells = ''.join(f'<td><b>{h}</b> {t}</td>' for h, t in ADV[i:i + 2])
        rows += f'<tr>{cells}</tr>'
    return f'<table class="adv">{rows}</table>'

BODY = f"""
<p class="sec first-sec"><b>Competitive environment and our advantage.</b> The competitive
environment mirrors the fragmented care-establishment pathway described above. Existing human and
technology-enabled alternatives address individual steps or substantial portions of it, but generally
operate through separate services, handoffs, and business models (Table 2). That fragmentation
matters because responsibility can return to families between services, creating opportunities for
care to fall through before it is established and feed the same vicious cycle.</p>

{table2()}
<p class="caption"><b>Table 2.</b> Competitive alternatives across the care-establishment pathway.
{FULL} core capability &#183; {PART} partial or variable &#183; {NONE} not typical. New workforce means
adding people to direct care rather than moving them between employers; open access means family
access does not require institutional sponsorship and provider participation does not require payment
for referrals.</p>

<p class="sec">Olera is designed from first principles backward from the endpoint that matters:
established care before unmet need feeds the vicious cycle. The first step is to instrument the full
pathway so CareNavigator can measure where, why, and how quickly care establishment succeeds or
fails, and target interventions to the failure points and communities where they are needed most.
Four architectural advantages follow.</p>

{advblock()}

<p class="sec">Together, these advantages are designed to increase the effective capacity of the
eldercare system to turn recognized needs into established care. For families, that means more
pathways to funded services and established care; for providers, qualified demand and new workforce
capacity; and for risk-bearing institutions, an evidence-generating intervention against the costly
consequences of failed care establishment. The CRP tests whether these proposed advantages are real,
measurable, and commercially meaningful.</p>
"""

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""

out = 'ce_word.html' if os.environ.get('WORD_EXPORT') == '1' else 'ce.html'
open(out, 'w', encoding='utf-8').write(DOC)
print('wrote', out)
