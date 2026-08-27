# -*- coding: utf-8 -*-
import re, figs, figs2, tables, tables2, body1, body2

REFS = {
 "ncoa2025": "National Council on Aging. Benefits access and unclaimed assistance for older adults. 2025.",
 "genworth": "Genworth Cost of Care Survey, most recent edition. <b>[CONFIRM EDITION AND YEAR]</b>",
 "activatedInsights2024": "Activated Insights (formerly Home Care Pulse). 2024 Home Care Benchmarking Report, reporting 2023 operating data.",
 "freedmanSpillman2014": "Freedman VA, Spillman BC. Disability and care needs among older Americans. Milbank Q. 2014.",
 "unmetNeedsSR2024": "Systematic review of unmet activity-of-daily-living needs and downstream utilization, hospitalization, nursing home placement, and mortality. 2024.",
 "hass2017": "Hass Z, et al. Unmet need for help with activities of daily living and subsequent emergency department admission. 2017.",
 "depalma2013": "DePalma G, et al. Hospital readmission among older adults who return home with unmet need for activities of daily living. Gerontologist. 2013.",
 "censusProj2023": "U.S. Census Bureau. 2023 National Population Projections.",
 "aarpCareGap2013": "Redfoot D, Feinberg L, Houser A. The aging of the baby boom and the growing care gap. AARP Public Policy Institute. 2013.",
 "phi2025": "PHI. Direct Care Workers in the United States: Key Facts. September 2025.",
 "mudrazija2025": "Mudrazija S, Aranda MP. Current and future replacement and opportunity costs of family caregiving for older Americans with and without dementia. Innov Aging. 2025;9(6):igaf049.",
 "szanton2018": "Szanton SL, et al. Medicaid cost savings of a preventive home visit program for disabled older adults. J Am Geriatr Soc. 2018.",
 "szanton2021": "Szanton SL, et al. Effect of a biobehavioral environmental approach on disability among low-income older adults: a randomized clinical trial. 2021.",
 "kffLtss2022": "KFF analysis of CMS National Health Expenditure and Medicaid long-term services and supports data, 2022. Of $415 billion in national LTSS spending, Medicaid paid 61 percent.",
 "nhe2023": "Centers for Medicare and Medicaid Services. National Health Expenditure Accounts, 2023.",
 "cdcNpals2020": "National Center for Health Statistics. National Post-acute and Long-term Care Study, 2020.",
 "homeCareMarketEst": "Industry estimates of United States non-medical home care revenue; analyst range $101 to $162 billion.",
 "capTurnover2012": "Boushey H, Glynn SJ. There are significant business costs to replacing employees. Center for American Progress. 2012. Replacement cost for hourly workers estimated at 16 percent of annual pay.",
 "caregiverCAC2025": "Activated Insights. 2025 Home Care Benchmarking Report: median caregiver acquisition cost $520 through word of mouth; median professional caregiver turnover 75 percent.",
 "cmsGuide2024": "Centers for Medicare and Medicaid Services. Guiding an Improved Dementia Experience (GUIDE) Model. Launched July 1, 2024.",
 "blsSocialWork2025": "U.S. Bureau of Labor Statistics. Occupational Outlook Handbook: social workers. Healthcare social workers projected to grow 6 percent, 2024 to 2034.",
 "navPlatforms2026": "Published company materials for employer- and health-plan-sponsored caregiver navigation platforms, including Wellthy, Grayce, Cariloop, Homethrive, and ianacare. Accessed 2026.",
 "wapoAPFM2024": "Reporting on placement-fee incentives in senior living referral marketplaces. 2024.",
 "nces2024": "National Center for Education Statistics. Undergraduate degree fields: health professions and related programs conferred 263,800 degrees, 2021-22.",
 "paeaStudent2025": "Physician Assistant Education Association. By the Numbers: Student Report, 2024-25; documented direct patient-care hour requirements.",
 "yee2025": "Yee A, Yaffe MJ, Schuster T, Lambert S, Abbasgholizadeh-Rahimi S. Family caregivers' acceptance of artificial intelligence-enabled technologies for providing care to older adults. BMC Geriatr. 2025;26:150.",
 "fan2023": "Fan Q, et al. Olera platform development and caregiver needs assessment. 2023.",
 "fan2024": "Fan Q, et al. Usability evaluation of the Olera caregiving platform: Mobile Application Rating Scale 4.57 of 5 (n = 30). JMIR. 2024.",
 "dubose2024": "DuBose L, et al. Digital caregiving assistance for older adults and their families. 2024.",
 "hoang2026": "Hoang MN, Kim L, Fisher L, DuBose L, Ory MG, Lee S, Falohun T, Fan Q. Exploring informal caregivers' perception of the Olera digital caregiving assistance platform for dementia care: mixed methods evaluation study. JMIR Form Res. 2026;10:e92967.",
 "careNavTAS2026": "CARE-NAV multi-agent technology acceptance study, adapted Technology Acceptance Survey 5.73 of 7 (n = 31). Manuscript in preparation.",
 "ncoaBCU": "National Council on Aging. BenefitsCheckUp.",
 "eldercareLocator": "Administration for Community Living. Eldercare Locator.",
}

CITED = []          # reference keys, in order of first appearance in the document

def resolve(t):
    """Replace <sup>@key,@key</sup> with superscript numbers.

    Numbers are assigned by order of first appearance, so inserting, moving, or
    deleting a citation renumbers the whole document and the bibliography
    together. An unknown key raises rather than silently printing itself.
    """
    def sub(m):
        nums = []
        for key in m.group(1).split(","):
            key = key.strip().lstrip("@")
            assert key in REFS, f"UNKNOWN CITATION KEY: {key}"
            if key not in CITED:
                CITED.append(key)
            nums.append(str(CITED.index(key) + 1))
        return "<sup>" + ",".join(nums) + "</sup>"
    t = re.sub(r"<sup>(@[A-Za-z0-9_]+(?:\s*,\s*@[A-Za-z0-9_]+)*)</sup>", sub, t)
    assert "<sup>@" not in t, "MALFORMED CITATION LEFT IN DOCUMENT"
    return t

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; }
p.sec { margin: 6pt 0 3pt 0; }
p.first-sec { margin-top: 0; }
p.aimhead { font-weight: bold; text-align: left; margin: 9pt 0 3pt 0; font-size: 11pt;
            color: #14453f; border-bottom: 0.8pt solid #14453f; padding-bottom: 1.5pt; }
p.metrics-head { font-style: italic; text-decoration: underline; text-align: left;
                 margin: 5pt 0 2pt 0; }
p.caption { text-align: left; margin: 2pt 0 5pt 0; font-size: 9pt;
            break-before: avoid; page-break-before: avoid; }
p.tnote { text-align: left; margin: -2pt 0 5pt 0; font-size: 9pt; font-style: italic;
          color: #333; break-before: avoid; page-break-before: avoid; }
h1.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 9pt 0 3pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt; }
h1.sechead.first { margin-top: 0; }
sup { line-height: 0; font-size: 7.5pt; }
div.fig { margin: 5pt 0 2pt 0; text-align: center; break-inside: avoid; page-break-inside: avoid; }
div.figblock { break-inside: avoid; page-break-inside: avoid; }
div.figwrap { float: right; margin: 2pt 0 5pt 11pt; break-inside: avoid; page-break-inside: avoid; }
div.figwrap svg { display: block; }
div.figwrap p.caption { margin: 3pt 0 0 0; }
p.clearfix { clear: both; margin: 0; height: 0; }
/* Comparison matrices and figures stay whole; long data tables may break, with
   the header repeating, rather than stranding a third of a page. */
table.matrix { break-inside: avoid; page-break-inside: avoid; }
table.dat thead { display: table-header-group; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child { break-after: avoid; page-break-after: avoid; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 5pt 0 2pt 0; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 5pt 2.5pt 0; vertical-align: bottom; }
table.dat td { padding: 2.6pt 5pt 2.6pt 0; border-bottom: 0.4pt solid #b9c4bd; vertical-align: top; }
table.dat td.n, table.dat th.n { text-align: right; padding-right: 8pt; font-variant-numeric: tabular-nums; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.dat tr.tot td { border-top: 1pt solid #14453f; font-weight: bold; background: #eef3f0; }
table.dat tr.rem td { background: #fbeeec; }
table.matrix { width: 100%; border-collapse: separate; border-spacing: 0;
               font-size: 9pt; line-height: 1.15; margin: 6pt 0 2pt 0;
               -webkit-print-color-adjust: exact; print-color-adjust: exact; }
table.matrix th, table.matrix td { padding: 2.5pt 4pt; vertical-align: middle; text-align: center; }
table.matrix thead th { font-weight: bold; vertical-align: bottom; color: #14453f;
                        border-bottom: 1pt solid #14453f; padding-bottom: 3pt; }
table.matrix thead th.rowlab { border-bottom: 1pt solid #14453f; }
table.matrix span.eg { display: block; font-weight: normal; font-style: italic;
                       font-size: 7.5pt; line-height: 1.1; }
table.matrix tbody td { border-bottom: 0.5pt solid #14453f; }
table.matrix tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.matrix td.rowlab, table.matrix th.rowlab { text-align: left; font-weight: bold;
                                                 color: #14453f; }
table.matrix .yes, table.matrix .no { font-size: 11pt; line-height: 1; }
table.matrix .yes { color: #14453f; font-weight: bold; }
table.matrix .no { color: #9b1c1c; font-weight: bold; }
table.matrix .own { background: #14453f; color: #fff; }
table.matrix .own .yes, table.matrix .own .no { color: #fff; }
table.matrix td.rowlab.own, table.matrix td.rowlab.own b { color: #fff; }
table.matrix thead th.own { border-bottom: 1pt solid #14453f; border-radius: 5pt 5pt 0 0; padding-top: 3pt; }
table.matrix tbody tr:last-child td.own { border-radius: 0 0 5pt 5pt; }
div.refs { break-before: page; page-break-before: always; }
div.refs p { font-size: 9pt; text-align: left; margin: 0 0 3pt 0; text-indent: -14pt; padding-left: 14pt; }
"""

import os
WORD = os.environ.get("WORD_EXPORT") == "1"
FIGPNG = {1:6.7, 3:6.7, 5:6.6, 6:7.0}
def figblock(svg, num, cap):
    if WORD:
        w = FIGPNG[num]
        return (f'<div class="fig"><img src="png/fig{num}.png" style="width:{w}in"></div>'
                f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')
    return (f'<div class="fig">{svg}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p>')

def figwrap(svg, num, cap, width):
    if WORD:
        return ('<table align="right" class="figfloat" cellspacing="0" cellpadding="0" '
                f'style="width:{width}in"><tr><td>'
                f'<img src="png/fig{num}.png" style="width:{width}in">'
                f'<p class="caption"><b>Figure {num}.</b> {cap}</p></td></tr></table>')
    return (f'<div class="figwrap" style="width:{width}in">{svg}'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p></div>')

def splice(text, anchor, addition, label):
    """Insert `addition` right after `anchor`.

    Anchors are matched with whitespace-insensitive comparison, so a line
    rewrap in the prose files cannot silently detach a figure or table. A
    missing or ambiguous anchor raises rather than no-opping.
    """
    pat = re.compile(r'\s+'.join(re.escape(w) for w in anchor.split()))
    hits = list(pat.finditer(text))
    assert hits, f'SPLICE ANCHOR MISSING: {label}'
    assert len(hits) == 1, f'SPLICE ANCHOR AMBIGUOUS ({len(hits)} matches): {label}'
    i = hits[0].end()
    return text[:i] + addition + text[i:]

sig = body1.SIGNIFICANCE
sig = splice(sig, 'they could not staff.<sup>@activatedInsights2024</sup></p>',
   figblock(figs.fig1(), 1,
     'The three gates a family must clear, and the cycle that follows failure at any one of them.'),
   'fig1')
_a2 = '<p class="sec"><b>Where the money already goes.</b>'
assert sig.count(_a2) == 1, 'FIG2 ANCHOR MISSING'
sig = sig.replace(_a2,
   figwrap(figs.fig2(), 2, 'Demand rising while both sources of supply contract.', 2.6) + _a2)
# No clearfix after Figure 2: the following prose wraps around it.
sig = splice(sig, 'which is how the cycle in Figure 1 is interrupted.</p>',
   figblock(figs.fig_product(), 3,
     'What CareNavigator produces for one household, and what the system then executes and confirms.'),
   'fig3 product')
sig = splice(sig, 'what providers pay to acquire caregivers today.</p>',
   tables2.T1, 'T1 ROI')
sig = splice(sig, 'families can still fall through before care is established.</p>',
   tables2.T2, 'T2 competitive')

inn = body1.INNOVATION
inn = splice(inn, '<p class="sec first-sec">',
   figwrap(figs.fig3(), 4,
     'Existing channels move workers between employers. This pathway adds them, and the verified record follows the worker.', 3.0),
   'fig4 workforce')
inn = inn.replace('<p class="sec"><b>Key Innovation 2:',
   '<p class="clearfix"></p><p class="sec"><b>Key Innovation 2:')

app = body2.APPROACH_OPEN
app = splice(app, 'answers that question in three stages</b> (Figure 5).</p>',
   figblock(figs2.fig4(), 5,
     'What each stage establishes, and what the next one therefore does not repeat.'), 'fig5 chain')

app += body2.AIM1 + tables2.T4
app += body2.AIM2 + tables2.T5
app += body2.AIM3 + tables2.T6
app += body2.APPROACH_CLOSE
app = splice(app, 'any channel that misses its cost ceiling is closed rather than carried.</p>',
   tables2.T3_CHANNELS, 'T3 channels')
app = splice(app, 'holds the next stage until its gate is met.</p>',
   figblock(figs2.fig5(), 6,
     'Three-year timetable, showing the sequencing among the aims, staged market entry, and the four decision points.'),
   'fig6 gantt')

prog = body2.PROGRESS
prog = splice(prog, "using I-Corps support and company capital.", tables2.T7_RISKS, 'T7 risks')

sig, inn, app, prog = resolve(sig), resolve(inn), resolve(app), resolve(prog)
uncited = [k for k in REFS if k not in CITED]
if uncited:
    print('NOTE: references defined but never cited, omitted from bibliography:', uncited)

refs = '<div class="refs"><h1 class="sechead first">Bibliography and References Cited</h1>'
for i, k in enumerate(CITED):
    refs += f'<p>{i+1}. {REFS[k]}</p>'
refs += '</div>'

doc = ('<!DOCTYPE html>\n<html><head><meta charset="utf-8">'
  '<title>Olera CRP Research Strategy</title>'
  f'<style>{CSS}</style></head><body>'
  '<h1 class="sechead first">Significance</h1>' + sig +
  '<h1 class="sechead">Innovation</h1>' + inn +
  '<h1 class="sechead">Approach</h1>' + app +
  '<h1 class="sechead">CRP Progress Report</h1>' + prog + refs + '</body></html>')
open('rs_word.html' if WORD else 'rs.html','w').write(doc)
txt = re.sub(r'<style>.*?</style>','',doc,flags=re.S)
print('words in body:', len(re.sub(r'<[^>]+>',' ',txt).split()))
