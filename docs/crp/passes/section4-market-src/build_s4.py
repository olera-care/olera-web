# -*- coding: utf-8 -*-
"""Section 4 of the Commercialization Plan, in the Research Strategy house style."""
import re, os, figs_s4 as F, tables_s4 as T

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
FIGW = {7: 7.2}

def figblock(svg, num, cap):
    inner = (f'<img src="png/fig{num}.png" style="width:{FIGW[num]}in">' if WORD else svg)
    return (f'<div class="fig">{inner}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

FIG7 = figblock(F.fig7(), 7,
    "Olera's provider beachhead addresses a recurring staffing expenditure today; the larger "
    "CareNavigator opportunity opens as CRP evidence establishes value for organizations bearing "
    "downstream healthcare risk.")

BODY = f"""
<h1 class="sechead">4. Market, Customer, and Competition</h1>

<p class="sec first-sec"><b>Market segments and potential customers.</b> Olera commercializes through
two buyer classes created by the same care-establishment pathway. The near-term beachhead is
care-delivery providers that lose revenue when caregiver vacancies prevent them from accepting or
staffing new cases. The emerging institutional market is healthcare organizations that bear financial
risk when unmet needs contribute to avoidable utilization, failed care transitions, or earlier
institutional care. Families remain users rather than customers: CareNavigator stays free to them.</p>

<p class="sec"><b>Caregiver Staffing addresses an unusually persistent provider problem.</b> The
United States employed approximately 4.35 million home health and personal care aides in 2024, with
roughly 766,000 openings projected each year from 2024&#8211;2034; home-care benchmarking separately
reported 75% median professional-caregiver turnover in 2024.<sup>26,27</sup> The problem directly
constrains growth: 63.3% of surveyed home-care providers reported turning down cases because of
staffing shortages in 2023.<sup>28</sup> Non-medical home care is therefore Olera's initial provider
beachhead, with expansion potential across home health, assisted living, hospice, skilled nursing,
and other organizations that employ direct-care workers.</p>

<p class="sec"><b>The institutional market is larger but evidence-gated.</b> Prospective customers
include Medicare Advantage plans, accountable care organizations (ACOs), health systems, Medicaid
managed-care and managed long-term-services-and-supports organizations, and other entities exposed to
the downstream cost of unmet need. In 2026, 35.2 million people are enrolled in Medicare Advantage
and 14.3 million Medicare beneficiaries receive care coordinated through accountable-care
arrangements.<sup>29,30</sup> CMS's active GUIDE Model further validates the purchasing logic:
Medicare is already testing and paying for dementia care navigation, community-resource connection,
and caregiver support with explicit goals of reducing hospitalization, delaying nursing-home
placement, and reducing Medicare and Medicaid expenditures.<sup>31</sup> Olera does not assume these
populations are immediately serviceable revenue; rather, they establish the scale of risk-bearing
organizations for which CRP-generated care-establishment and longitudinal outcomes evidence could
create a contracting pathway.</p>

{FIG7}

<p class="sec"><b>Market opportunity and path to meaningful scale.</b> The two markets should not be
reduced to a single speculative TAM. Caregiver Staffing enters an existing, recurring recruitment
market in which providers already spend to fill vacancies; the CRP determines Olera's repeatable
pricing, conversion, retention, and unit economics. CareNavigator enters a larger institutional
market only as evidence matures; the CRP determines whether established care and longitudinal
outcomes create sufficient economic value for institutional contracting. Because both markets contain
large numbers of providers or covered lives, Olera does not require dominant market share for
commercial sustainability. Section 10 models post-CRP economics using observed CRP conversion,
pricing, and operating data rather than assuming a final price in advance.</p>

<p class="sec"><b>Significant advantages and competitive position.</b> Sections 1 and 2 established
why existing navigation approaches fail to carry families reliably through the full
care-establishment pathway. The remaining relevant competitive question is not whether alternatives
exist, but why Olera can create differentiated value as those alternatives evolve. Four advantages
matter.</p>

{T.ADV}

<p class="sec"><b>Caregiver Staffing's initial workforce wedge is deliberately narrow.</b> Olera
initially targets health-profession applicants and students for whom paid caregiving can also provide
meaningful patient-care experience. The opportunity is nationally distributed and continuously
replenished: in the most recent cycles, U.S. MD programs reported 54,699 applicants and NursingCAS
reported 75,078 applicants across 282 participating nursing schools.<sup>32,33</sup> These figures do
not represent the full addressable workforce; they demonstrate the scale of only two readily measured
pipelines before PA, PT, OT, pharmacy, allied-health, other nursing pathways, and students preparing
to apply are considered. Olera's pilot experience also indicates interest from undergraduates outside
pre-health pathways. Over time, the same university infrastructure can reach other students seeking
flexible, meaningful paid work through career centers and related campus channels, and the
workforce-entry system is designed to extend to career changers and other new entrants to the field.</p>

<p class="sec"><b>This wedge is differentiated from conventional job boards.</b> Traditional
recruiting channels primarily compete for workers already searching for caregiver jobs. Recent
recruitment benchmarking found Indeed generated 68% of applications to participating home-care
agencies in Q1 2026, illustrating how concentrated conventional caregiver acquisition
remains.<sup>34</sup> Olera instead builds relationships with universities and applicant communities
to introduce caregiving as a paid entry pathway into healthcare, while the licensed provider remains
the employer responsible for interviewing, hiring, training, credentialing, supervision, and
employment standards. The wedge is attractive because the work can provide patient-care experience
and income, can fit evenings, weekends, summers, and gap years, and is geographically replicable
through colleges and universities nationwide.</p>

<p class="sec"><b>Current and emerging competition.</b> <i>For Caregiver Staffing,</i> Olera competes
across categories rather than against a single end-to-end incumbent. Provider staffing alternatives
include large job boards like Indeed, staffing agencies, caregiver-specific recruiting platforms, and
emerging student-caregiver models such as CareYaya. <i>For CareNavigator,</i> alternatives include
government and nonprofit resource directories, patient navigators, social workers and care managers,
eldercare referral platforms like A Place for Mom or Caring.com, and increasingly general-purpose AI
and search where families ask eldercare-related questions. Incumbents may add AI, execution, or
staffing capabilities over the next several years, and general-purpose AI systems will become more
capable at answering eldercare questions. Olera's response is to compete where domain-specific
infrastructure matters most: verified local provider and benefits data, execution of real
administrative workflows, workforce-capacity creation, confirmation of care establishment, and
longitudinal outcome records. Where general-purpose AI or search becomes the family's preferred
interface, Olera's strategy is interoperability that allows those interfaces to call CareNavigator's
data and execution capabilities rather than requiring Olera to own every point of discovery.</p>

<p class="sec"><b>Market and customer acceptance hurdles.</b> The CRP is structured to measure the
remaining commercial uncertainties rather than assume adoption.</p>

{T.T5_HURDLES}

<p class="sec"><b>Strategic alliances, partnerships, and route to market.</b> Olera enters the CRP
with relationships on both sides of its beachhead: university relationships that support workforce
recruitment and working relationships with local and franchise-affiliated eldercare providers that
can serve as early customers and implementation sites. Its existing national provider database and
organic family traffic provide additional distribution infrastructure, while academic and
commercialization advisors connect the company to senior-care operators, payers, investors, and
strategic partners. These relationships reduce the distance between local validation and larger
regional or enterprise opportunities. No FDA approval is required for the products proposed here, and
Olera does not depend on a licensing agreement to commercialize them.</p>

<p class="sec"><b>Marketing and sales strategy.</b> Provider sales begin where Olera can demonstrate
an immediate staffing constraint and measurable hiring value; institutional development begins with
organizations whose populations and economics align with the outcomes the CRP is designed to measure.
The CRP converts successful local deployments into evidence, case studies, and repeatable commercial
playbooks that can support larger provider and institutional relationships. The detailed acquisition
channels, sales process, production infrastructure, and post-CRP scaling plan are presented in the
Production and Marketing Plan (Section 9).</p>

<p class="sec">Taken together, Olera is entering two commercially substantial markets from a
differentiated position: a provider market with an immediate, recurring staffing problem that, if
solved, addresses a key step in the care-establishment pathway; and an institutional market in which
payment becomes possible as CareNavigator proves that earlier care establishment creates outcomes and
economic value. The remaining risks are measurable, the CRP is designed to address them, and Olera
already has distribution and partnership footholds from which to scale.</p>
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
out = "s4_word.html" if WORD else "s4.html"
open(out, "w").write(DOC)
print("built %s, %d bytes" % (out, len(DOC)))
