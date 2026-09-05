# -*- coding: utf-8 -*-
"""INNOVATION (v5), house style, figures rebuilt and prose condensed.

The concepts, claims, and reading order are the author's. The prose is
condensed, mostly by removing enumerations the figures now carry and by joining
sentences that restated each other. No claim is added, dropped, or softened.
"""
import os, re
import figs_v5 as F

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
div.fig { margin: 5pt 0 2pt 0; text-align: center;
          break-inside: avoid; page-break-inside: avoid; }
div.fig img { display: inline-block; max-width: 100%; }
div.figblk { break-inside: avoid; page-break-inside: avoid; margin: 0; }
"""


def figblock(svg, num, cap):
    if WORD:
        w = float(re.search(r'width="([\d.]+)in"', svg).group(1))
        svg = f'<img src="png/fig{num}.png" style="width:{w}in">'
    return (f'<div class="figblk"><div class="fig">{svg}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p></div>')


FIG5 = figblock(F.fig5(), 5,
    "Fragmented eldercare inputs are normalized into one longitudinal Care Establishment Model.")
FIG6 = figblock(F.fig6(), 6,
    "General-purpose AI returns information. CareNavigator executes, observes, and writes back.")
FIG7 = figblock(F.fig7(), 7,
    "Instrumented cases show where capacity fails and direct new supply at that deficit.")
FIG8 = figblock(F.fig8(), 8,
    "One CareNavigator experience, different paths, one verified endpoint.")

BODY = f"""
<h1 class="sechead">Innovation</h1>

<p class="sec first-sec"><b>Key Innovation 1: making the care-establishment pathway computable.</b>
Phase IIB modeled the front end of eldercare planning: household needs and means, likely benefits and
aid, and appropriate services and providers. The CRP addresses the harder engineering problem that
follows. Eldercare unfolds through a finite but highly variable set of entities, documents,
communications, decisions, and delays that differ by household, program, provider, and geography, and
reliable automation first requires a computational representation of that system.</p>

<p class="sec">We propose a longitudinal Care Establishment Model organized around seven
eldercare-specific domains, each carrying substates developed in Aim 1 (Figure 5). The Phase IIB
eldercare LLM interprets each of these inputs and normalizes them into this common state; the reverse
process assembles a household's verified state into the program- or provider-specific information a
bounded workflow requires. Applications, documentation requests, provider denials, waiting lists, service starts, and
disruptions become timestamped events with geography and provenance rather than disappearing into
disconnected inboxes and phone calls.</p>

{FIG5}

<p class="sec">This is the load-bearing advance for the rest of the CRP. Software cannot reliably
automate a fragmented pathway unless it can observe what state a case is in, what changed, who owns
the next action, and what evidence defines completion. It also makes the pathway measurable:
directories describe what should exist and claims describe what was billed, while executed cases
reveal what actually happened between recognized need and established care, so Olera can observe
where, why, and how quickly care establishment fails at household and geographic levels.</p>

<p class="sec"><b>Key Innovation 2: AI agents that execute and learn from the care-establishment
pathway.</b> The prevailing paradigm is that digital tools inform, recommend, refer, or plan, and
families execute. CareNavigator already determines much of what should happen; the CRP adds
persistent agents that perform the administrative work required to make it happen, while the family
remains the decision-maker (Figure 6).</p>

{FIG6}

<p class="sec">Agents combine LLM reasoning with the structured state in Innovation 1, explicit
workflow logic, deterministic permission gates, persistent scheduling, and constrained tools: APIs,
permissioned browser automation where portals require direct interaction, document handling, email,
SMS, fax, scheduling, and eventually AI-assisted voice. A family could authorize the system to
prepare an LTSS application, contact multiple home-care agencies with the same verified case payload,
schedule transportation, or activate underused nonclinical insurance benefits. Actions
requiring attestation, legal authority, or consequential family choice remain human-controlled.</p>

<p class="sec">The engineering challenge is persistence across delay, incomplete information, and
heterogeneous external systems. Execution follows an event-driven loop: interpret, plan, permission,
act, observe, update, wait or return, and verify or escalate. Sending a form or leaving a voicemail
is an event, not an outcome. Cases continue until the endpoint is verified, declined by the family,
or cannot safely proceed, and unsupported workflows and ambiguity escalate to a human navigator.
CareNavigator does not diagnose, prescribe, place clinical orders, or make clinical decisions;
authorized health information is used only to extract and execute administrative tasks already
defined by the family, provider, or clinician.</p>

<p class="sec">The second novelty is that execution itself generates field knowledge. When the model
meets an unresolved operational question, the same tools retrieve current information, inspect a
portal, contact a representative, or escalate fieldwork to a person, and the LLM normalizes what
comes back with source, geography, time, and provenance. A provider may publicly
accept a payer yet report by phone that weekend capacity is unavailable until November. That fact
improves the current case and every subsequent case in the same market. More executed cases therefore
expose more knowledge gaps, produce more direct observations, and improve future routing, which
matters in eldercare because operational truth is local, rapidly changing, and largely absent from
the public web.</p>

<p class="sec"><b>Key Innovation 3: data-directed creation of new caregiver capacity.</b> Better
information and execution still cannot establish care when no person is available to deliver it.
Long-term care capacity ultimately depends on the caregiver workforce, and existing staffing channels
predominantly compete for workers already circulating in the same constrained labor market. Olera
instead uses the instrumented pathway to identify where workforce is actually preventing care, and
targets new supply at those deficits (Figure 7).</p>

<p class="sec">CareNavigator can combine funded family demand, provider denials and vacancies,
service type, geography, shift requirements, worker availability, placement outcomes, and external
workforce indicators into a local capacity view. The first targeted supply pathway is pre-health
students: distributed through universities, replenished each year, often seeking documented
patient-facing experience, and available for the evenings and weekends providers report are hardest
to fill. Our existing pilot generated more than 900 applicants, preliminary evidence that this is a
reachable pool rather than a hypothetical source of labor.</p>

{FIG7}

<p class="sec">Within the CRP, Olera recruits, screens, and vets candidates and refers them to
licensed providers, which retain responsibility for hiring, training, employment, and supervision. A longitudinal worker record accumulates verified hours, experience,
credentials, provider evaluations, reliability, and references. The architecture is labor-pool
agnostic even though students are the first test: the innovation is a repeatable mechanism for
identifying an underused workforce, activating it, standardizing the information employers need, and
measuring whether the resulting supply actually increases care capacity.</p>

<p class="sec">The same instrumentation has value beyond staffing. Household state aggregates into
county, state, and national visibility on unmet needs, funding failures, processing delays, provider
deserts, workforce shortages, and time to established care, creating an analytic layer for
researchers, risk-bearing institutions, and public agencies. Caregiver Staffing is the first
intervention because the workforce shortage is already large and a missing caregiver cannot be solved
by better software alone.</p>

<p class="sec"><b>The end product: the Olera CareNavigator.</b> The three innovations converge behind
the existing CareNavigator web and mobile experience, which Phase IIB developed through repeated
build-measure-learn cycles with family caregivers. The front end stays intentionally simple while
the computational and agentic infrastructure works behind it. A hospital discharge, a family that
cannot afford home care, and a provider without staff enter by different routes and run through the
same infrastructure to the same place (Figure 8). Across use cases the endpoint remains the one
established in Significance: aid or care actually established before unmet need feeds the vicious
cycle.</p>

{FIG8}
"""

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""

out = 'v5_word.html' if WORD else 'v5_house.html'
open(out, 'w', encoding='utf-8').write(DOC)
txt = re.sub(r'<[^>]+>', ' ', re.sub(r'<div class="figblk">.*?</p></div>', '', BODY, flags=re.S))
print('wrote', out, '|', len(txt.split()), 'words of body text')
