# -*- coding: utf-8 -*-
"""Revenue Stream section of the Commercialization Plan, in the Research Strategy house style."""
import re, os, figs_s7 as F, tables_s7 as T

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
FIGW = {11: 7.2, 12: 7.2, 13: 7.2}

def figblock(svg, num, cap):
    inner = (f'<img src="png/fig{num}.png" style="width:{FIGW[num]}in">' if WORD else svg)
    return (f'<div class="fig">{inner}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

CHAIN = (f'<div class="chain"><img src="png/chain.png" style="width:7.2in"></div>' if WORD
         else f'<div class="chain">{F.chain()}</div>')

FIG11 = figblock(F.fig11(), 11,
    "Replication economics at the deliberately conservative 10-hire projection. Mature-market "
    "throughput above 10 hires a month and all institutional CareNavigator revenue are excluded.")
FIG12 = figblock(F.fig12(), 12,
    "Revenue is intentionally back-loaded: Year 1 builds the system, Year 2 validates Staffing "
    "free, Year 3 introduces real billing, and post-CRP expansion adds both Staffing markets and "
    "institutional contracts.")

REFS = [
 "Home Care Association of America. Activated Insights Benchmarking Report Now Available. 2025. Reports median professional-caregiver turnover of approximately 75% in 2024.",
 "Activated Insights. Caregiver Retention Software for Home-Based Care. Reports recruiting and training costs of up to approximately $2,700 per replacement caregiver.",
 "Activated Insights. 2025 Benchmarking Report for Home-Based Care. Home-care workforce recruitment and retention benchmarking.",
 "Centers for Medicare &amp; Medicaid Services. GUIDE Model Frequently Asked Questions. Describes per-patient-per-month dementia care-management payments for coordination and caregiver education and support.",
 "Centers for Medicare &amp; Medicaid Services. Guiding an Improved Dementia Experience (GUIDE) Model. Describes care coordination, caregiver support, and alternative payment methodology.",
 "Centers for Medicare &amp; Medicaid Services. 2026 Medicare Accountable Care Organization Initiatives Participation Highlights. Reports 511 Medicare Shared Savings Program ACOs serving 12.6 million Traditional Medicare beneficiaries in 2026.",
 "U.S. Bureau of Labor Statistics. Home Health and Personal Care Aides. Occupational Outlook Handbook, 2025 to 2035 employment projections. Approximately 760,500 projected openings annually.",
 "Agency for Healthcare Research and Quality. Evidence Map on Home- and Community-Based Services and Person-Centered Care for Older Adults. Technical Brief No. 49. Summarizes a 13-state Medicaid HCBS study reporting emergency department use of 52% versus 34% and hospital or rehabilitation stays of 36% versus 24% among participants with versus without unmet HCBS needs.",
]
REFLIST = "".join(f'<p class="refs">{i+1}. {r}</p>' for i, r in enumerate(REFS))

BODY = f"""
<h1 class="sechead">9. Revenue Stream</h1>

<p class="sec first-sec"><b>Two revenue engines, sequenced by evidence.</b> Olera's revenue model has
two independent but reinforcing engines. CareNavigator remains free to families and basic
family-provider connections remain free to providers. The near-term engine is Caregiver Staffing:
providers pay when Olera helps them successfully hire workers, whether the staffing need arises from
turnover, existing clients, externally generated referrals, growth, or a capacity constraint
identified through CareNavigator. The emerging engine is institutional CareNavigator contracting with
organizations responsible for populations of older adults, including Medicare Advantage plans,
accountable care organizations, Medicaid organizations, and health systems. Staffing monetizes
successful workforce recruitment; institutional contracts monetize the navigation, execution, and
outcomes infrastructure as CRP evidence establishes its value.</p>

<p class="sec"><b>Caregiver Staffing: revenue follows successful hires.</b> The Staffing model is
intentionally simple: successful hires, times realized revenue per successful hire, times active
county markets. CRP Year 1 is an engineering year and generates no Staffing revenue. In Year 2, Olera
deploys Staffing free to providers so the project can establish applicant acquisition, provider
hiring, placement, retention, and market-to-market reproducibility before price is introduced. Paid
testing begins in Year 3. The working base-case price is $250 per successful hire, with $150 and $350
as sensitivity bounds. This is an Aim 3 pricing hypothesis, not an asserted market price. It is
economically plausible relative to the burden providers already bear: home-care benchmarking reports
approximately 75% professional-caregiver turnover, while industry estimates place recruiting and
training cost at up to approximately $2,700 per replacement.<sup>1-3</sup></p>

{T.T6_INPUTS}

<p class="sec">For the financial projection, Olera holds every paid market at only 10 successful hires
per month. At $250 per hire, that equals $30,000 annualized Staffing revenue per county. Olera expects
mature markets may support approximately 10 to 30 successful hires per month, but the model does not
require that maturation. Across eight CRP markets, the conservative case produces a $240,000
annualized Staffing run rate; the same markets would produce $480,000 at 20 hires per month and
$720,000 at 30. Within-market maturation is therefore upside that the CRP measures rather than
revenue the forecast presumes.</p>

{FIG11}

<p class="sec">The five-year model is an early commercialization case, not the scale ceiling. At the
same conservative assumptions, 100 active counties produce approximately 12,000 successful hires and
$3.0 million in annual Staffing revenue; 250 counties, 30,000 hires and $7.5 million; and 500
counties, 60,000 hires and $15 million. At 500 counties, 60,000 successful provider hires are
equivalent in scale to approximately 8% of the roughly 760,500 annual U.S. home health and personal
care aide openings projected by BLS.<sup>7</sup> Successful hires are not assumed to equal unique new
workforce entrants: the CRP will separately measure unique workers recruited, prior workforce status,
repeat placements, retention, and resulting provider capacity. Health-profession applicants are the
initial recruitment wedge; the workforce-entry infrastructure is designed to expand to broader labor
populations as the model scales.</p>

<p class="sec"><b>Institutional CareNavigator: contracts follow outcomes evidence.</b> The
institutional engine is modeled separately and more conservatively. Olera assumes no institutional
revenue during the CRP. Years 1 to 3 instead test the intermediate outcome on which the institutional
value proposition depends: whether recognized needs progress through navigation, funding, execution,
and ultimately established care; why pathways fail when they do not; and what happens longitudinally
after care is or is not established. This matters economically because unmet home- and
community-based service needs have been associated with substantially greater acute-care utilization:
an AHRQ evidence map summarizes a 13-state Medicaid HCBS study in which participants reporting unmet
needs had greater emergency department use (52% versus 34%) and hospital or rehabilitation stays (36%
versus 24%).<sup>8</sup> The CRP does not assume that CareNavigator prevents these downstream events;
it generates the care-establishment and longitudinal evidence needed to determine whether that value
proposition is real.</p>

{CHAIN}

<p class="sec">There is already precedent for organizations responsible for health outcomes to pay for
care-management and coordination infrastructure: CMS's GUIDE Model uses per-patient-per-month dementia
care-management payments for coordination and caregiver support, and in 2026 the Medicare Shared
Savings Program includes 511 ACOs serving 12.6 million Traditional Medicare
beneficiaries.<sup>4-6</sup> These sources establish the buyer class and purchasing logic; they do not
establish Olera's future price. Accordingly, the five-year model treats institutional revenue as
evidence-gated contracts rather than multiplying an unvalidated PMPM across a hypothetical health
plan. The base case assumes the first paid relationship in post-CRP Year 4 and approximately three
active relationships in Year 5. A working $250,000 annual value per mature relationship is used only
as a planning hypothesis and will be replaced by negotiated pricing.</p>

{T.T7_FIVEYEAR}

{FIG12}

<p class="sec"><b>How the projection should be read.</b> These projections are not top-down estimates
of market share. They are bottom-up scenarios derived from the number of successful caregiver hires
Olera can produce in each county and the number of evidence-gated institutional contracts the company
can secure. The base case deliberately holds Staffing throughput at 10 hires per month per county even
as markets mature, so it excludes the expected 10 to 30 hire mature range. Institutional revenue
begins only after CRP evidence exists. The principal assumptions, which are Staffing throughput,
price, repeat purchasing, contribution margin, and institutional contracting value, are therefore the
same variables the CRP and subsequent buyer negotiations are designed to replace with measured
commercial data.</p>

<p class="sec">Commercial hiring, workforce expansion, and family care establishment are tracked as
related but distinct outcomes. Staffing revenue is earned on successful provider hires; workforce
impact is measured through unique entrants, retention, and provider capacity; and CareNavigator-linked
family impact is measured by whether cases encountering a documented workforce barrier subsequently
establish care. Downstream utilization remains a longitudinal hypothesis until supported by
evidence.</p>

<p class="sec"><b>Staffing and capital as revenue grows.</b> During the CRP, engineering, research,
and market-validation personnel remain central. As paid Staffing expands, Olera adds centralized
market operations, worker acquisition, provider success, and sales capacity rather than recreating a
full team in every county. As institutional contracts emerge, business development, implementation,
analytics, and account-management capacity grow in parallel. Engineering grows more slowly because the
platform, portals, and workflows are designed for self-service and automation. Under the illustrative
base case, commercial revenue reaches approximately $120,000 in CRP Year 3, $600,000 in post-CRP Year
4, and $1.5 million in Year 5. This revenue meaningfully reduces the post-CRP financing requirement,
but is not assumed to eliminate it immediately. The Finance Plan therefore sizes post-CRP capital
against the remaining operating gap and the additional capital required to replicate validated
Staffing markets and develop institutional contracts, rather than assuming that revenue from the
limited CRP markets immediately replaces federal support.</p>

<p class="sec"><b>References supporting quantitative benchmarks.</b></p>
{REFLIST}

<p class="modnote"><b>Modeling note.</b> Olera-specific throughput, pricing, market counts, timing,
and institutional contract values are planning assumptions or CRP hypotheses and are not represented
as published benchmarks. Successful hires are commercial events; unique workforce entrants, net
capacity added, and care establishment are measured separately.</p>
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
out = "s7_word.html" if WORD else "s7.html"
open(out, "w").write(DOC)
print("built %s, %d bytes" % (out, len(DOC)))
