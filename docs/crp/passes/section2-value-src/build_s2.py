# -*- coding: utf-8 -*-
"""Section 2 of the Commercialization Plan, in the Research Strategy house style."""
import re, os, figs_s2 as F, tables_s2 as T

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; }
p.sec { margin: 8pt 0 3pt 0; }
p.first-sec { margin-top: 0; }
p.caption { text-align: left; margin: 2pt 0 6pt 0; font-size: 9pt;
            break-before: avoid; page-break-before: avoid; }
h1.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 0 0 5pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt; }
sup { line-height: 0; font-size: 7.5pt; }
div.fig { margin: 6pt 0 2pt 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 6pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0; vertical-align: bottom; }
table.dat td { padding: 2.8pt 6pt 2.8pt 0; border-bottom: 0.4pt solid #b9c4bd; vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
/* Table 1 is long enough to break, with its header repeating. Table 2 is
   three rows and must not strand one of them on the previous page. */
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }
"""

WORD = os.environ.get("WORD_EXPORT") == "1"
FIGW = {4: 7.2}

def figblock(svg, num, cap):
    inner = (f'<img src="png/fig{num}.png" style="width:{FIGW[num]}in">' if WORD else svg)
    return (f'<div class="fig">{inner}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

FIG4 = figblock(F.fig4_combined(), 4,
    "What a family sees, what the system does, and what accumulates across a county. "
    "Shaded elements exist today; the county register is illustrative only.")

BODY = f"""
<h1 class="sechead">2. Value of the CRP Project, Expected Outcomes, and Impact</h1>

<p class="sec first-sec"><b>The product to be commercialized.</b> CareNavigator is Olera's
family-facing eldercare navigation platform. It combines a national, expert-curated resource database
with AI-supported execution workflows and longitudinal outcomes tracking to help families move from
recognized need to established care. Families use CareNavigator at no cost. The platform assesses
needs, identifies appropriate care and financial aid, helps execute the administrative and follow-up
work required to obtain them, confirms whether care was established, and records where the pathway
succeeds or fails (Figure 4).</p>

<p class="sec">Caregiver Staffing is a complementary provider-facing product and capacity mechanism.
When an otherwise appropriate care plan cannot be delivered because a provider lacks workers, Olera
recruits new caregivers into the workforce and connects them with licensed providers, which retain
responsibility for interviewing, hiring, training, credentialing, supervision, and care delivery.
This architecture allows Olera to commercialize provider-facing staffing while preserving broad, free
access to CareNavigator and building the evidence needed for future institutional contracting.</p>

{FIG4}

<p class="sec"><b>Foundation from prior SBIR R&amp;D.</b> Olera's NIA Phase I and Phase IIB awards
(Impact Scores 20 and 25) established the foundation for this commercialization effort: a nationally
deployed first-generation CareNavigator; an expert-curated database containing more than 72,000
eldercare provider and aid-program records; peer-reviewed evidence of usability and technology
acceptance; and extensive customer discovery defining the needs of families and providers. More than
200 NIH/NSF I-Corps customer-discovery interviews also identified caregiver availability as a
recurrent constraint. In an early staffing pilot, Olera received approximately 900 student
applications, accepted 100 candidates, and placed 25 with local providers, with participating
students and providers returning in a subsequent semester. These results support the CRP's next step:
integrate, execute, measure, and commercialize the complete pathway.</p>

<p class="sec"><b>Weaknesses in current approaches.</b> Families do not lack individual resources;
they lack a system accountable for carrying them across the full pathway to established care.
Existing approaches are useful but fragmented. Table 1 organizes the gap around the same
care-establishment pathway used throughout this application.</p>

{T.T1_PATHWAY}

<p class="sec"><b>Commercial applications and innovation.</b> The commercial opportunity is not
another directory, referral marketplace, or staffing channel in isolation. It is an integrated
infrastructure that carries a family across the care-establishment pathway and creates evidence about
what happened at every step. The Research Strategy describes the underlying technical innovations in
detail; commercially, three features matter most. First, CareNavigator links assessment, resource
identification, funding, execution, staffing when needed, and confirmation of care rather than
optimizing a single handoff. Second, AI-supported execution moves the product from recommending what
a family should do toward completing and tracking the work required to establish care. Third, every
executed case can produce a structured longitudinal record of the family's needs, resources pursued,
administrative barriers, local capacity, care establishment, and subsequent outcomes.</p>

<p class="sec">At scale, this longitudinal record could become a distinctive commercial and scientific
asset: a county-level empirical map of where eldercare pathways succeed, where they fail, and what
resolves those failures. The resulting analytics could inform payers and accountable care
organizations seeking to reduce avoidable utilization; health systems seeking reliable transitions
from referral to care; providers planning service and workforce capacity; public agencies allocating
aging resources; researchers studying access and implementation; and communities identifying local
gaps. The CRP tests and builds the infrastructure required to create this asset; it does not assume
its value in advance (Figure 4, lower register).</p>


<p class="sec"><b>Expected outcomes.</b> Successful completion of the CRP will leave Olera with:
(1) a verified CareNavigator capable of executing and tracking the pathway from care plan to
established care; (2) real-world evidence on care establishment, failure points, operating cost, and
longitudinal outcomes; (3) a repeatable Caregiver Staffing model that can both generate provider
revenue and relieve workforce constraints to enable care establishment; (4) geographically resolved
longitudinal data describing how families move through the eldercare system; and (5) an
institutional-buyer evidence package and operating model positioned for subsequent contracting and
private investment.</p>

<p class="sec"><b>Commercial and non-commercial impact.</b> Olera's commercial and public-health
objectives reinforce one another: growth means more families can receive support before unmet needs
progress to higher-cost crises, while each completed case improves the evidence available to make the
system more effective. The CRP therefore has societal, educational, scientific, and public-health
value beyond company revenue.</p>

{T.T2_IMPACT}

<p class="sec"><b>Integration with Olera's business plan.</b> These CRP outputs integrate directly
with Olera's commercialization strategy. Caregiver Staffing provides a nearer-term provider-revenue
pathway while serving as a capacity mechanism to enable care establishment where staff is short.
CareNavigator's execution and outcomes infrastructure builds the evidence required for larger
institutional contracts with organizations that benefit when members establish appropriate care
earlier. Together, these pathways are designed to sustain a free-to-families CareNavigator while
creating the commercial proof needed for subsequent private investment. Olera's history,
capabilities, financing, management, and post-CRP growth strategy are described in the Company
section that follows.</p>
"""

def assert_no_nested_blocks(doc):
    for m in re.finditer(r'<p[^>]*>(.*?)</p>', doc, re.S):
        bad = re.search(r'<(table|div|h1|ol)\b', m.group(1))
        if bad:
            ctx = m.group(1)[max(0, bad.start()-90):bad.start()+40].replace('\n', ' ')
            raise AssertionError("NESTED BLOCK: <%s> inside <p>.\n  ...%s..." % (bad.group(1), ctx))

DOC = ("<!DOCTYPE html><html><head><meta charset='utf-8'><style>" + CSS +
       "</style></head><body>" + BODY + "</body></html>")
assert "—" not in DOC, "EM DASH IN DOCUMENT"
assert_no_nested_blocks(DOC)
out = "s2_word.html" if WORD else "s2.html"
open(out, "w").write(DOC)
print("built %s, %d bytes" % (out, len(DOC)))
