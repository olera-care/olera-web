# -*- coding: utf-8 -*-
"""Project Management Plan section of the Commercialization Plan, in the Research Strategy house style."""
import re, os, figs_s8 as F, tables_s8 as T

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
div.figwrap { float: right; margin: 1pt 0 4pt 13pt; break-inside: avoid; page-break-inside: avoid; }
div.figwrap svg { display: block; }
div.figwrap p.caption { margin: 3pt 0 0 0; }
p.clearfix { clear: both; margin: 0; height: 0; }
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
table.adv { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.18;
            margin: 5pt 0 5pt 0; }
table.adv td { padding: 4pt 9pt 5pt 0; vertical-align: top; border-top: 0.8pt solid #b9c4bd; }
table.adv td b { color: #14453f; }
table.adv tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tr.tot td { border-top: 1pt solid #14453f; font-weight: bold; background: #eef3f0; }
p.refs { text-align: left; font-size: 9pt; margin: 0 0 2pt 0; text-indent: -13pt; padding-left: 13pt; }
p.modnote { text-align: left; font-size: 9pt; font-style: italic; color: #333; margin: 5pt 0 0 0; }
div.chain { margin: 4pt 0 6pt 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
"""

WORD = os.environ.get("WORD_EXPORT") == "1"
FIGW = {13: 7.2}

def figblock(svg, num, cap):
    inner = (f'<img src="png/fig{num}.png" style="width:{FIGW[num]}in">' if WORD else svg)
    return (f'<div class="fig">{inner}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

FIG13 = figblock(F.fig13(), 13,
    "Five commercialization stages and the four decisions between them. Gate 3 is where the CRP "
    "runway ends and post-CRP financing is targeted to close.")

BODY = f"""
<h1 class="sechead">11. Project Management Plan</h1>

<p class="sec first-sec"><b>Team and governance.</b> The PI, TJ Falohun, has led the project as PD/PI
since Phase I and retains final go/no-go authority at major decision points. Co-investigator Logan
DuBose, MD, MBA, the company's Chief Research Officer and a practicing primary-care clinician,
oversees clinical relevance, research operations, commercialization coordination, and the milestone
calendar. Clemson University leads the academic human-subjects effort with co-investigator Qiping
Fan, PhD, supported by biostatistical expertise for study design and analysis. Olera's execution team
includes internal engineering and product leadership, growth and marketing support, experienced
call-center personnel, and research staff. Independent statistical review and external CPA validation
of the commercial unit-economics model provide additional checks on the research and
commercialization conclusions.</p>

<p class="sec"><b>How research and commercialization stay synchronized.</b> Day-to-day execution is
managed through named workstream owners, maintained task boards, regular operating meetings, and
milestone dashboards tied to the Research Strategy and Commercialization Plan. Leadership reviews
operating progress continuously and commercialization evidence at defined stage gates, including
transitions from engineering to free real-world validation, from validation to paid
commercialization, and from CRP-supported experimentation to post-CRP expansion. A milestone that
misses its predefined threshold triggers the corresponding alternative strategy rather than automatic
continuation. Progress is reported to the NIH Program Officer through required reporting, while the
PI retains final authority over major go/no-go decisions.</p>

<p class="sec"><b>Commercialization timeline and gates.</b> The first three years deliberately
progress from build, to validate free, to monetize. Post-CRP commercialization then shifts to expand
and scale, using the evidence, operating playbooks, commercial revenue, and third-party capital
developed during the award. The detailed experimental timeline and thresholds are provided in the
Research Strategy; the management timeline below shows how those activities produce successive
commercialization decisions.</p>

{FIG13}

{T.T8_TIMELINE}

<p class="sec">Together, these gates ensure that commercialization advances in response to measured
technical, market, workforce, economic, and outcomes evidence rather than a predetermined expansion
schedule.</p>
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
assert "’" not in DOC, "CURLY APOSTROPHE IN DOCUMENT"
assert_no_nested_blocks(DOC)
out = "s8_word.html" if WORD else "s8.html"
open(out, "w").write(DOC)
print("built %s, %d bytes" % (out, len(DOC)))
