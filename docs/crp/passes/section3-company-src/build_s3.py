# -*- coding: utf-8 -*-
"""Section 3 of the Commercialization Plan, in the Research Strategy house style."""
import re, os, figs_s3 as F, tables_s3 as T

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; }
p.sec { margin: 6pt 0 3pt 0; }
p.first-sec { margin-top: 0; }
/* a lead-in line must never be stranded from the figure it introduces */
p.leadin { break-after: avoid; page-break-after: avoid; }
p.caption { text-align: left; margin: 2pt 0 4pt 0; font-size: 9pt;
            break-before: avoid; page-break-before: avoid; }
h1.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 0 0 5pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt; }
sup { line-height: 0; font-size: 7.5pt; }
div.fig { margin: 4pt 0 2pt 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 6pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0; vertical-align: bottom; }
table.dat td { padding: 1.9pt 6pt 1.9pt 0; border-bottom: 0.4pt solid #b9c4bd; vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
/* Table 1 is long enough to break, with its header repeating. Table 2 is
   three rows and must not strand one of them on the previous page. */
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }
"""

WORD = os.environ.get("WORD_EXPORT") == "1"
FIGW = {5: 7.2, 6: 7.2}

def figblock(svg, num, cap):
    inner = (f'<img src="png/fig{num}.png" style="width:{FIGW[num]}in">' if WORD else svg)
    return (f'<div class="fig">{inner}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

FIG5 = figblock(F.fig5(), 5,
    "Olera's progression from problem discovery through federal R&amp;D to commercial scale. "
    "Each stage produces what is required to reach the next source of capital.")
FIG6 = figblock(F.fig6(), 6,
    "Management capacity scales against validated commercial need rather than ahead of it.")

BODY = f"""
<h1 class="sechead">3. Company</h1>

<p class="sec first-sec"><b>Origins and objectives.</b> Olera, Inc. grew from a multidisciplinary
effort at Texas A&amp;M University to solve a problem families repeatedly described: eldercare was
difficult to navigate, difficult to afford, and difficult to convert from information into actual
support. In 2019, PI Tokunbo (TJ) Falohun helped launch the Texas A&amp;M chapter of Sling Health,
bringing engineering, medicine, and business trainees together around healthcare problems. There he
began working with Logan DuBose, MD, MBA, now Olera's Chief Research Officer and co-investigator.
Their initial work focused on dementia caregiving; continued discovery revealed a broader need across
eldercare and led to Olera's formation in 2020.</p>

<p class="sec">Olera's corporate objective is to make establishing eldercare navigable and broadly
accessible for American families while building the commercial infrastructure that can sustain that
access. <b>The commercialization strategy has evolved as evidence accumulated; the mission has
not.</b> Core CareNavigator access remains free to families, recommendations remain neutral, and
commercialization is concentrated where Olera creates incremental value for providers and
institutional buyers.</p>

{T.T3_GLANCE}

<p class="sec"><b>Core competencies and operating continuity.</b> Olera's capabilities now extend
beyond the founders and reflect several years of accumulated operating experience. The company
combines software and applied AI engineering, an expert-curated eldercare data infrastructure,
human-centered aging research, digital distribution, family and provider operations, and
commercialization research. Its national platform and resource infrastructure were built through
successive SBIR awards; five peer-reviewed studies established usability and technology acceptance;
more than 200 NIH/NSF I-Corps interviews informed product and customer discovery; and direct family
and provider operations continue to expose the team to the practical barriers between a
recommendation and established care.</p>

<p class="sec">Key research, operations, engineering, marketing, and scientific-advisory
relationships extend from approximately 1.5 years to more than six years. <b>That continuity
preserves institutional knowledge while allowing a small team to operate across research, product
development, commercialization, and national family and provider support.</b></p>

{FIG5}

<p class="sec">This progression is the company's commercialization history as well as its financing
logic. Early discovery defined the problem; Phase I/II built and evaluated the first-generation
platform and national resource infrastructure; Phase IIB supported national deployment and deeper
provider and workforce learning; and the CRP is designed to complete execution and outcomes
capabilities, establish repeatable Caregiver Staffing economics, and build the evidence required for
institutional commercialization. <b>Successful CRP completion therefore changes the appropriate
source of capital: subsequent scale is intended to be financed by commercial revenue and private
investment rather than continued dependence on federal R&amp;D support.</b></p>

<p class="sec"><b>Vision, sustainability, and management evolution.</b> Olera scales management
capacity using the same evidence-driven discipline it applies to product development: build, measure,
learn, and expand what works. Today, the founders retain overlapping responsibility for strategy,
product, engineering, research, finance, and administration, supported by established engineering,
operations, marketing, and research personnel. DuBose leads research and internal finance and federal
administration with professional accounting support from ADC; Falohun leads company, product, and
technical strategy. This structure has allowed Olera to remain capital-efficient while building and
operating a national platform.</p>

<p class="sec">The lean internal team is complemented by senior expertise accumulated over years
rather than assembled for a single application. Marcia Ory, PhD, has advised Olera for more than six
years and brings decades of aging, caregiving, implementation, dissemination, and sustainability
expertise, including 20 years at NIA. Qiping Fan, MD, MS, and Clemson University provide longstanding
capabilities in epidemiology, mixed-methods evaluation, health-services research, and independent
study execution. David Qu, MBA, brings approximately 30 years of healthcare-technology
commercialization and executive experience, including scaling and exiting digital-health companies,
together with relationships across healthcare and senior-care investment networks. ADC and
specialized legal and compliance counsel provide professional infrastructure in functions that do not
yet require full-time executive leadership.</p>

{FIG6}

<p class="sec">As CRP milestones demonstrate repeatable provider sales, operating demand, and
institutional engagement, Olera will internalize dedicated commercial, customer-success, operations,
data and compliance, and finance capabilities when their workload and strategic importance justify
full-time leadership. Post-CRP, commercial revenue and private capital are expected to support the
mature organization required for national scale. <b>The objective is not simply a larger R&amp;D
organization, but a commercially financed eldercare technology company capable of sustaining a
free-to-families CareNavigator while scaling provider and institutional revenue.</b></p>

<p class="sec"><i>The markets and customers that can support that transition, the advantages Olera
brings to them, the competitive landscape, and the strategy for gaining market acceptance are
described next.</i></p>
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
out = "s3_word.html" if WORD else "s3.html"
open(out, "w").write(DOC)
print("built %s, %d bytes" % (out, len(DOC)))
