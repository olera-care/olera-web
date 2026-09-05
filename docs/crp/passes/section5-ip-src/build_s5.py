# -*- coding: utf-8 -*-
"""Section 5 of the Commercialization Plan, in the Research Strategy house style."""
import re, os, figs_s5 as F

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
table.adv { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.18;
            margin: 5pt 0 5pt 0; }
table.adv td { padding: 4pt 9pt 5pt 0; vertical-align: top; border-top: 0.8pt solid #b9c4bd; }
table.adv td b { color: #14453f; }
table.adv tr { break-inside: avoid; page-break-inside: avoid; }
"""

WORD = os.environ.get("WORD_EXPORT") == "1"
FIGW = {8: 7.2}

def figblock(svg, num, cap):
    inner = (f'<img src="png/fig{num}.png" style="width:{FIGW[num]}in">' if WORD else svg)
    return (f'<div class="fig">{inner}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

FIG8 = figblock(F.fig8(), 8,
    "Formal protections secure specific Olera assets, while cumulative distribution, data, "
    "relationships, and operating evidence create a growing temporal barrier to replication.")

BODY = f"""
<h1 class="sechead">5. Intellectual Property Protection</h1>

<p class="sec first-sec"><b>Protection strategy.</b> Olera will protect each component of its
commercial advantage with the form of intellectual-property protection best suited to that asset,
while continuing to build cumulative data, distribution, workflow, and relationship advantages that
create practical barriers to replication. The principal proprietary assets generated and extended
through the CRP include CareNavigator's non-public workflow orchestration and execution logic; the
structure, normalization, quality-control methods, and derived variables that organize Olera's
provider and financial-aid data; the longitudinal care-establishment and outcomes architecture and
resulting proprietary datasets; and the methods that connect local workforce capacity to care
execution. Olera will maintain appropriate non-public methods, configurations, derived data, and
operating processes as trade secrets through role-based technical access, confidentiality
obligations, and employee, contractor, and partner agreements governing confidentiality,
intellectual-property ownership, and permitted data use. Original source code, interfaces,
documentation, and content are protected by copyright, while Olera and product branding will be
protected through trademark rights and registration where commercially appropriate. For CRP-generated
inventions with sufficient novelty and commercial value, Olera will evaluate patent protection with
IP counsel before public disclosure; where disclosure would weaken the asset's defensive value,
trade-secret protection may provide the stronger strategy.</p>

{FIG8}

<p class="sec"><b>Temporal barriers to replication.</b> Individual interface features can be
reproduced; the integrated commercial asset is substantially harder to recreate. A new entrant would
need to rebuild Olera's family distribution, national provider and benefits infrastructure, execution
workflows, provider and workforce relationships, and the longitudinal evidence showing where care is
established, where it fails, and what follows. These barriers compound during the CRP: every
deployment both advances commercialization and adds execution history, local-market intelligence,
care-establishment records, and longitudinal outcomes that a new entrant cannot obtain
retrospectively. Olera will selectively expose capabilities through controlled interfaces where
interoperability expands distribution while retaining the proprietary data, workflow logic, and
outcome infrastructure behind those interfaces. The result is a layered protection strategy in which
formal IP rights protect discrete assets and accumulated data, distribution, relationships, and
operating experience increase the time and capital required to reproduce the system.</p>

<p class="sec"><b>Working legal basis for drafting.</b> USPTO guidance distinguishes patents,
trademarks, copyrights, and trade secrets; identifies software code as copyrightable subject matter;
and notes that trade-secret protection depends on reasonable measures to preserve secrecy, including
access controls and confidentiality agreements. Patent eligibility and filing strategy for any
CRP-generated invention should be evaluated with qualified IP counsel before public disclosure.</p>
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
out = "s5_word.html" if WORD else "s5.html"
open(out, "w").write(DOC)
print("built %s, %d bytes" % (out, len(DOC)))
