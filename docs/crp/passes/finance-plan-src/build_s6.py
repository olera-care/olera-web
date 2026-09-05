# -*- coding: utf-8 -*-
"""Finance Plan section of the Commercialization Plan, in the Research Strategy house style."""
import re, os, figs_s6 as F, tables_s6 as T

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
"""

WORD = os.environ.get("WORD_EXPORT") == "1"
FIGW = {9: 7.2, 10: 3.36}

def figblock(svg, num, cap):
    inner = (f'<img src="png/fig{num}.png" style="width:{FIGW[num]}in">' if WORD else svg)
    return (f'<div class="fig">{inner}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

def figwrap(svg, num, cap, width):
    if WORD:
        return (f'<div class="figfloat" style="width:{width}in">'
                f'<img src="png/fig{num}.png" style="width:{width}in">'
                f'<p class="caption"><b>Figure {num}.</b> {cap}</p></div>')
    return (f'<div class="figwrap" style="width:{width}in">{svg}'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p></div>')

FIG9 = figblock(F.fig9(), 9,
    "Financing transition. CRP evidence unlocks private capital before provider and institutional "
    "revenue mature.")
FIG10 = figwrap(F.fig10(), 10, "Post-CRP growth flywheel.", 3.36)

BODY = f"""
<h1 class="sechead">7. Finance Plan</h1>

<p class="sec first-sec"><b>Capital required.</b> Olera is requesting approximately $4 million in CRP
funding over three years to finance the later-stage R&amp;D, real-world validation, and
commercialization work required to cross the Valley of Death described in Section 1. CRP capital will
complete and validate the CareNavigator execution and outcomes infrastructure, establish Caregiver
Staffing as a repeatable provider-revenue pathway, generate the evidence needed for institutional
commercialization, and develop the operating playbooks required for subsequent expansion. The award
is designed to move Olera from pre-scale commercialization to an investable commercial inflection
point. It does not assume that revenue from the limited CRP markets immediately replaces the full
federal operating budget.</p>

<p class="sec"><b>From CRP capital to commercial sustainability.</b> Olera's financing strategy
combines capital sources that enter at different stages (Figure 9). During the CRP, federal capital
finances the R&amp;D and evidence generation that private investors are not yet positioned to
underwrite. Caregiver Staffing begins generating commercial revenue, demonstrating willingness to
pay, retention, unit economics, and market replicability while contributing operating cash. As these
results mature alongside CareNavigator's real-world evidence, Olera will pursue independent
third-party capital to finance post-CRP commercialization while provider and institutional revenue
grow.</p>

{FIG9}

<p class="sec"><b>Fundraising Plan.</b> Olera will begin financing its next stage before CRP funding
ends. The aims are deliberately sequenced so that sufficient technical, real-world, and early
commercial evidence should be available by approximately the end of Year 2 to begin structured
investor cultivation, while Year 3 strengthens the financing case and supports a formal raise. The
objective is to enter post-CRP commercialization with financing secured or actively closing rather
than encounter a new funding gap.</p>

{T.T5_FUNDRAISING}

<p class="sec"><b>Investor engagement and financing readiness.</b> Commercialization advisor David Qu
will advise Olera quarterly throughout the CRP, helping management define investment-readiness
milestones, pressure-test the financing strategy and materials, and prepare for institutional
fundraising. As milestones mature, he will support introductions and continued engagement with
relevant senior-care and healthcare investors in his network, including Ziegler, Equitage Ventures,
7Wire Ventures, and Alumni Ventures, among others. His Letter of Support describes this role and
commitment to helping Olera prepare for and pursue independent third-party financing as CRP
milestones are achieved.</p>

<p class="sec"><b>Post-CRP financing requirement.</b> Olera expects independent third-party capital
to finance post-CRP commercialization. The raise will be sized from the five-year operating and
revenue model to support expansion of Caregiver Staffing and CareNavigator, institutional
contracting, and sufficient operating runway as recurring revenue matures. Detailed revenue
assumptions and staffing requirements are presented in the Revenue Stream section.</p>

{FIG10}
<p class="sec"><b>Use of post-CRP capital.</b> Third-party capital will accelerate both
commercialization pathways. Expanding Caregiver Staffing into additional markets creates workforce
capacity and provider revenue; expanding CareNavigator creates more established-care episodes and a
larger longitudinal evidence base for institutional contracting. These pathways reinforce one
another: broader deployment generates more revenue and evidence, stronger evidence supports
institutional contracts, and the resulting revenue can be reinvested in additional markets. Private
capital is therefore the bridge from a CRP-validated model to commercial scale (Figure 10).</p>

<p class="sec"><b>Financing continuity.</b> Caregiver Staffing revenue provides commercial
validation, operating cash, and incremental runway during the transition, but Olera's planned
strategy is to secure independent third-party capital before the CRP ends. If financing takes longer
than expected, management can moderate expansion while commercial revenue extends runway.</p>
<p class="clearfix"></p>

<p class="sec"><i>The sections that follow describe how Olera will deploy this capital to produce,
market, and sell its products and how provider and institutional revenue scale over time.</i></p>
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
out = "s6_word.html" if WORD else "s6.html"
open(out, "w").write(DOC)
print("built %s, %d bytes" % (out, len(DOC)))
