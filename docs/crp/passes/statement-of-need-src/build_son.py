# -*- coding: utf-8 -*-
"""Statement of Need, Section 1 of the Commercialization Plan.
House style: letter, 0.5in margins, Arial 11pt, single-spaced, justified."""
import re, figs_son as F

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
div.figwrap { float: right; margin: 1pt 0 4pt 13pt; break-inside: avoid; page-break-inside: avoid; }
div.figwrap svg { display: block; }
div.figwrap p.caption { margin: 3pt 0 0 0; width: 3.0in; }
p.clearfix { clear: both; margin: 0; height: 0; }
ol.risks { margin: 4pt 0 4pt 0; padding-left: 20pt; }
ol.risks li { margin: 0 0 3pt 0; text-align: justify;
              break-inside: avoid; page-break-inside: avoid; }
ol.risks li::marker { font-weight: bold; color: #14453f; }
b.rk { color: #14453f; }
"""

def figblock(svg, num, cap):
    return (f'<div class="fig">{svg}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

def figwrap(svg, num, cap, width):
    return (f'<div class="figwrap" style="width:{width}in">{svg}'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p></div>')

FIG1 = figwrap(F.fig1(), 1,
    "Unmet eldercare needs can drive a vicious cycle of hospitalization, failed care "
    "establishment, and premature institutionalization.", 3.0)
FIG2 = figblock(F.fig2(), 2,
    "Care establishment requires a coordinated pathway from assessing need through "
    "identifying, funding, staffing, executing, and confirming care.")
FIG3 = figblock(F.fig3(), 3,
    "CRP bridges the remaining technical, validation, evidence, commercial, and financing "
    "risks between demonstrated demand and commercial sustainability.")

RISKS = [
 ("Technical risk.", "Can CareNavigator execute and track care establishment?",
  "Complete and verify the execution and outcomes layer needed to carry families from a care "
  "and funding plan through to established care and reliably capture what happens along the way."),
 ("Real-world validation risk.", "Does the complete pathway work in practice?",
  "Deploy the system with families and determine whether care is established, where cases fail, "
  "when workforce capacity becomes a constraint, and what it costs to deliver."),
 ("Evidence risk.", "Does establishing care produce outcomes and economic value institutional "
  "buyers care about?",
  "Follow cases longitudinally and generate credible evidence on care establishment and "
  "downstream outcomes."),
 ("Commercial risk.", "Can the value created support durable revenue?",
  "Determine whether Caregiver Staffing can generate repeatable provider revenue while building "
  "the evidence needed to unlock longer-term institutional contracts for CareNavigator."),
 ("Financing risk.", "Is Olera investable when CRP ends?",
  "Convert the technical, real-world, outcomes, and commercial evidence above into a company that "
  "can attract the private capital needed for continued scale."),
]
RISKLIST = ('<ol class="risks">' + "".join(
    f'<li><b class="rk">{a}</b> <i>{q}</i> {r}</li>' for a, q, r in RISKS) + '</ol>')

BODY = f"""
<h1 class="sechead">1. Statement of Need</h1>

{FIG1}
<p class="sec first-sec"><b>The product and its impact.</b> Older Americans and their families face a
problem the market has not solved. Unmet daily care needs compound into preventable geriatric
hospitalization, premature institutionalization, and rising public costs, and each makes the next
more likely (Figure 1). Olera developed CareNavigator through NIA Phase I&#8211;IIB as a
care-navigation platform that helps families identify the care they need, the aid that can help pay
for it, and the providers who can deliver it. Its impact potential comes from intervening in this
cycle while it is still reversible, before unmet needs force higher and costlier levels of care. The
need is growing as Americans live longer with more chronic illness while caregiving capacity falls
further behind demand.</p>

<p class="sec">The remaining opportunity is to carry navigation through the full pathway from
recognized need to established care (Figure 2). Prior work substantially developed the upstream
navigation needed to assess needs, identify care, and fund care. The CRP will develop and validate
the ability to staff and execute the care plan, together with the outcomes layer needed to confirm
that care was established and measure what follows from that pathway.</p>
<p class="clearfix"></p>

{FIG2}

<p class="sec"><b>Olera's Valley of Death (Figure 3).</b> CareNavigator is deployed nationally, draws
15,500+ visitors per month through organic search at near-zero acquisition cost, and has
demonstrated usability and technology acceptance in peer-reviewed studies.<sup>[refs]</sup>
Caregiver Staffing has also been tested in prior pilots, where providers hired workers sourced
through Olera and demonstrated willingness to pay for the service.<sup>[cite]</sup> Family demand,
CareNavigator usability, and basic provider demand for Caregiver Staffing are therefore
substantially de-risked.</p>

<p class="sec">What remains is to complete the pathway from identified need to established care,
determine when workforce capacity prevents that pathway from succeeding, measure what happens to
families when care is established, and convert the resulting value into sustainable commercial
models. Five remaining risks must now be retired in sequence:</p>

{RISKLIST}

<p>The order matters: the pathway cannot be measured until it can be executed and tracked; outcomes
cannot be observed until families move through that pathway; institutional value cannot be
established until those outcomes exist; and subsequent investment depends on retiring these
underlying technical and commercial risks.</p>

{FIG3}

<p class="sec">Therefore, Olera's Valley of Death is the gap between demonstrated demand and
commercial sustainability. Crossing it requires Olera to complete the care-establishment pathway,
establish a repeatable near-term revenue model through Caregiver Staffing, and generate the outcomes
evidence needed to unlock the larger institutional market for CareNavigator.</p>

<p class="sec"><b>Why government funding is the right instrument at this stage.</b> Crossing this gap
requires later-stage R&amp;D and evidence generation before CareNavigator's largest commercial
pathway can be demonstrated. Private investors must underwrite the risk of completing and deploying
the system before its institutional value has been established, while institutional buyers need
real-world evidence before they can confidently value and purchase the product. That evidence cannot
exist until the system is completed, deployed, and observed over time. Non-dilutive CRP funding can
break this cycle by financing the work needed to retire these risks.</p>

<p class="sec">The alternative is not simply to raise prices or sell the same product differently.
The most immediate ways to monetize CareNavigator would change whom the platform serves or how
families reach care. Charging families would create the greatest barrier for households already
struggling to afford eldercare. Charging providers for referrals would introduce steering incentives
and limit participation by some federally reimbursed providers. Caregiver Staffing can generate
nearer-term provider revenue without those tradeoffs, but staffing alone addresses only the
workforce barrier; it does not help families navigate, fund, and execute the rest of the
care-establishment pathway. The commercialization challenge is therefore to keep CareNavigator
broadly accessible while developing revenue from organizations that benefit economically when
families successfully establish care.</p>

<p class="sec">Our investor advisors agree that longitudinal outcomes demonstrating CareNavigator's
value to institutional buyers, together with a repeatable provider-revenue model, would materially
improve Olera's investability. If successful, the award ends not with a company dependent on
continued federal support, but with the evidence, operating model, and commercial proof needed to
attract private investment, and a nationally scalable, free-to-families CareNavigator capable of
helping more older Americans establish the care they need.</p>

<p class="sec"><b>How CRP funding advances Olera to full commercialization.</b> Three sequential aims
remove these remaining barriers. <b>Aim 1</b> develops and independently verifies the execution and
outcomes technology required to carry families from a care and funding plan through to established
care and reliably capture what happens along the way. <b>Aim 2</b> validates the complete system in
a smaller real-world deployment, measuring whether families identify, fund, and establish
appropriate care; where cases fail; what the system costs to operate; and whether Caregiver Staffing
can relieve workforce constraints when they prevent care establishment. <b>Aim 3</b> scales
deployment and builds the institutional-buyer evidence case, generating a larger longitudinal
dataset on care establishment and downstream outcomes while establishing the economic, data, and
operating infrastructure required for institutional partnerships. Caregiver Staffing is evaluated in
parallel as a repeatable provider-revenue pathway.</p>

<p class="sec">Together, these aims advance Olera from a nationally deployed platform with
demonstrated demand to a commercially ready company with a repeatable provider-revenue pathway, a
contracting-ready evidence package for institutional buyers, and the infrastructure to help more
older Americans establish the care they need.</p>
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
open("son.html", "w").write(DOC)
print("built son.html, %d bytes" % len(DOC))
