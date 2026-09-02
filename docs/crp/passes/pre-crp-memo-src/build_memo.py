# -*- coding: utf-8 -*-
"""Olera Pre-CRP R&D, Commercialization, and Execution Plan.

One integrated memo replacing the separate pre-CRP plan and week-by-week plan.
Facts about Phase IIB Aim 3 come from reference/rppr/phase-iib-year2-rppr.md;
provider and staffing evidence from living/Research_Strategy_2026-08-31.
"""
import datetime as dt, os, re
import figs_memo as FM

WORD = os.environ.get('WORD_EXPORT') == '1'

CSS = """
@page { size: letter; margin: 0.5in; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.2;
       margin: 0; color: #000; }
p { margin: 0 0 3pt 0; text-align: justify; orphans: 2; widows: 2; }
p.sec { margin: 5pt 0 3pt 0; }
p.lede { margin: 0 0 9pt 0; text-align: left; font-size: 10pt; color: #5f6b64; }
h1.doctitle { font-size: 15pt; font-weight: bold; margin: 0 0 2pt 0; color: #14453f;
              letter-spacing: 0.2pt; }
h2.sechead { font-size: 11pt; font-weight: bold; text-transform: uppercase;
             letter-spacing: 0.4pt; margin: 11pt 0 4pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt;
             break-after: avoid; page-break-after: avoid; }
p.caption { text-align: left; margin: 2pt 0 5pt 0; font-size: 9pt; line-height: 1.16;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
ul.pts { margin: 3pt 0 4pt 0; padding: 0 0 0 17pt; }
ul.pts li { margin: 0 0 2.5pt 0; text-align: left; padding-left: 2pt;
            break-inside: avoid; page-break-inside: avoid; }
ul.pts li::marker { color: #14453f; }
div.fig { margin: 4pt 0 2pt 0; text-align: center;
          break-inside: avoid; page-break-inside: avoid; }
div.fig img { display: inline-block; max-width: 100%; }
div.figblk { break-inside: avoid; page-break-inside: avoid; margin: 0; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.16;
            margin: 5pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0;
                     vertical-align: bottom; }
table.dat td { padding: 2.8pt 6pt 2.8pt 0; border-bottom: 0.4pt solid #b9c4bd;
               vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.dat tbody tr.gate td { background: #eef3f1; }
table.dat tbody tr.quiet td { color: #5f6b64; }
table.dat.keep { break-inside: avoid; page-break-inside: avoid; }

div.wk { margin: 0 0 4pt 0; break-inside: avoid; page-break-inside: avoid; }
p.wkh { margin: 0 0 1pt 0; text-align: left; font-size: 10pt; }
p.wkh b { color: #14453f; }
p.wkh span.d { color: #5f6b64; font-weight: normal; }
p.wkj { margin: 0 0 1pt 0; text-align: left; font-size: 10pt; font-style: italic;
        color: #14453f; }
ol.wkt { margin: 0 0 1.5pt 0; padding: 0 0 0 19pt; font-size: 10pt; }
ol.wkt li { margin: 0 0 0.5pt 0; text-align: left; }
ol.wkt li::marker { color: #5f6b64; }
p.wko { margin: 0; text-align: left; font-size: 9pt; color: #5f6b64; }
p.wko b { color: #14453f; }
span.rk { color: #5f6b64; font-size: 8.5pt; }
span.tag { font-size: 8pt; font-weight: bold; letter-spacing: 0.6pt;
           color: #14453f; }
span.tag.q { color: #5f6b64; }
div.wk.quiet { color: #5f6b64; }
div.wk.quiet p.wkh b, div.wk.quiet p.wkj, div.wk.quiet p.wko b
    { color: #5f6b64; }
"""


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def figblock(svg, num, cap):
    if WORD:
        w = float(re.search(r'width="([\d.]+)in"', svg).group(1))
        svg = f'<img src="png/fig{num}.png" style="width:{w}in">'
    return (f'<div class="figblk"><div class="fig">{svg}</div>'
            f'<p class="caption"><b>Figure {num}.</b> {cap}</p></div>')


def table(head, rows, widths, num, caption, classes=None, keep=False):
    th = ''.join(f'<th style="width:{w}%">{esc(c)}</th>' for c, w in zip(head, widths))
    body = ''
    for i, row in enumerate(rows):
        cls = f' class="{classes[i]}"' if classes and classes[i] else ''
        body += (f'<tr{cls}><td><b>{row[0]}</b></td>'
                 + ''.join(f'<td>{c}</td>' for c in row[1:]) + '</tr>')
    tc = 'dat keep' if keep else 'dat'
    return (f'<table class="{tc}"><thead><tr>{th}</tr></thead><tbody>{body}</tbody></table>'
            f'<p class="caption"><b>Table {num}.</b> {caption}</p>')




CSS += """
ol.qs { margin: 3pt 0 4pt 0; padding: 0 0 0 19pt; font-size: 10pt; }
ol.qs li { margin: 0 0 2pt 0; text-align: left; }
ol.qs li::marker { color: #14453f; font-weight: bold; }
p.note { font-size: 9.5pt; color: #5f6b64; text-align: left; margin: 4pt 0 3pt 0; }
p.note b { color: #14453f; }
"""

FIG1 = figblock(
    FM.ecosystem(), 1,
    'The organizations around an older adult, the sequence a recognized need travels '
    'before care is established, and the step each Olera product acts on. Each product '
    'improves a different step of the same sequence.')

# ---------------------------------------------------------------- roadmap ----
ROADMAP = table(
    ['Period', 'What Olera builds', 'What Olera sells', 'What the period establishes'],
    [['Phase I and IIB<br>through 2026',
      'Assessment, benefit and program discovery, provider discovery, and the platform '
      'foundation. Usability and acceptance evidence with caregivers.',
      'No family-side revenue. Caregiver Staffing sold to providers using company '
      'resources.',
      'Families will use the product and the technology works. <b>Known.</b>'],
     ['Pre-CRP<br>Sep 2026 to Jan 2027',
      'First generation of bounded execution capability, and verification of the '
      'workflows that touch a live application or provider.',
      'Two provider products in one beachhead segment, at set prices, to agencies.',
      'Olera can sell, deliver, and retain, and the product is ready for late-stage '
      'validation. <b>Target.</b>'],
     ['CRP<br>Years 1 to 3',
      'No new product category. Design and quality controls, independent verification, '
      'and the instrumentation a controlled study requires.',
      'Provider products continue on company revenue rather than CRP funds.',
      'That a mature CareNavigator increases verified care establishment against a '
      'concurrent comparison. <b>Hypothesized.</b>'],
     ['Post-CRP<br>Years 4 to 5',
      'Integration work for the first institutional customers: eligibility feeds, '
      'referral handoffs, reporting.',
      'A paid institutional proof of concept, then contracts.',
      'That care establishment affects utilization or cost enough to support '
      'institutional purchase at scale. <b>Hypothesized.</b>'],
     ['Beyond<br>Year 5',
      'Determined by what the pathway data identifies as the next constraint.',
      'Institutional contracts alongside the provider business.',
      'Direction rather than forecast. <b>Stretch.</b>']],
    [12, 27, 27, 34], 1,
    'The five-year sequence. Each period converts one kind of uncertainty into one kind '
    'of fact. The final column labels which of those are established and which remain '
    'hypotheses.',
    ['', 'gate', '', '', 'quiet'])

# ------------------------------------------------------------- scorecard ----
RISKS = table(
    ['Risk', 'What would address it', 'Minimum by 1 January', 'Stretch'],
    [['R1. Olera cannot sell',
      'Agencies paying for a product delivered by the current team at current '
      'headcount, more than once.',
      'Multiple providers paying for successful hires and several paying for client '
      'growth, with delivery documented.',
      '25 agencies averaging about three paid hires a month at $250, roughly $18,750 '
      'a month.'],
     ['R2. Olera cannot deliver or retain',
      'Repeat purchasing, measured churn, and stated acquisition and delivery costs.',
      'At least one repeat purchase and a stated cost per acquired customer.',
      'Retention and margin stable enough to project a run rate.'],
     ['R3. CareNavigator is not built',
      'The first generation of execution capability complete and testable on company '
      'and Phase IIB resources before CRP Day 1.',
      'Core execution product complete and testable, with the critical workflows '
      'verified.',
      'A preliminary care-establishment signal from live use.'],
     ['R4. The buyer requirement is unknown',
      'Interviews with risk-bearing organizations that answer the fifteen questions '
      'in Section 6 consistently.',
      'Several substantive interviews with target buyers, written up.',
      'Convergence on endpoint, comparison, and evidence threshold.'],
     ['R5. There is no market pull',
      'A buyer stating the conditions under which it would join a paid proof of '
      'concept.',
      'One buyer engaged enough to review a draft proof-of-concept design.',
      'Written conditional interest from more than one buyer.'],
     ['R6. The CRP scope is wrong',
      'An aim architecture limited to allowable late-stage activities, with '
      'development completed before Day 1.',
      'Aims drafted against the buyer requirements and the allowable-activity '
      'list.',
      'No development task identifiable within the aims.'],
     ['R7. The team cannot carry both',
      'Eighteen weeks of selling and drafting run concurrently without either '
      'stopping.',
      'Weekly numbers unbroken from Week 1, and both documents drafted by Week 12.',
      'Week 16 closes complete, with the final two weeks unused.'],
     ['R8. Post-CRP funding is uncertain',
      'Investors who understand the milestones and remain engaged as they are met.',
      'Investors briefed on the milestone sequence and still engaged.',
      'Support letters indicating financing interest conditional on CRP and '
      'commercial milestones.']],
    [23, 27, 27, 23], 2,
    'The January scorecard, organized by the risk each result addresses rather than by '
    'the activity that produced it. Minimums are what allow the application to rest on '
    'observed results. Stretches are planning targets.')

CRIT = table(
    ['Scored criterion', 'What the January results provide'],
    [['Significance',
      'Market pull evidenced by buyer interviews rather than asserted, and a '
      'competitive read from agencies that have purchased (R4, R5).'],
     ['Investigator(s)',
      'A team that commercialized a product during the drafting period, with revenue '
      'and retention (R1, R2, R7).'],
     ['Innovation',
      'An execution capability that can be demonstrated rather than described (R3).'],
     ['Approach',
      'Aims limited to allowable late-stage activities, with the development boundary '
      'visible on the timeline (R6).'],
     ['Environment',
      'A company sustaining itself on revenue while running the project (R1, R2).'],
     ['Commercialization Plan',
      'Five-year milestones based on observed unit economics, and a revenue stream '
      'already collected (R1, R2, R8).'],
     ['Fundraising Plan',
      'Named investors who followed the milestones, engaged against a defined '
      'post-CRP financing need (R8).']],
    [21, 79], 3,
    'Each January result is directed at a scored criterion. A task that cannot be '
    'traced to a row here is not pre-CRP work.', keep=True)

CONF = table(
    ['Event', 'When', 'Why we attend', 'What the trip must produce'],
    [['Nashville Healthcare Sessions',
      'Confirm.<br>Typically autumn',
      'Provider and operator density in the target segment.',
      'Named agency prospects and at least one buyer introduction.'],
     ['ARC Summit',
      'Confirm.<br>Typically autumn',
      'Aging and care-innovation buyers, and the investors who follow them.',
      'Two buyer conversations booked for the following week.'],
     ['HLTH',
      'Confirm.<br>Typically early Nov',
      'The largest concentration of risk-bearing buyers and investors in the period.',
      'Feedback on proof-of-concept design and decision thresholds from at least three '
      'organizations.'],
     ['IHI Forum',
      'Confirm.<br>Typically early Dec',
      'Quality and population-health leaders who own the outcomes a contract would '
      'reference.',
      'A view on which endpoint a quality leader finds credible.'],
     ['JP Morgan Healthcare',
      'Confirm.<br>Typically early Jan',
      'Falls after submission. A calendar constraint rather than an activity in this '
      'plan.',
      'No objective. January travel planning should not consume December.']],
    [19, 13, 36, 32], 4,
    'Conference objectives. Each row states what would make the trip worthwhile. '
    '<b>No date here is confirmed.</b> Confirm all five before approving the week '
    'plan, and move the affected weeks if they differ.',
    ['', '', 'gate', '', 'quiet'])
print('part 2 written')


# ------------------------------------------------------------------ weeks ----
# (objective, [(task, risk tag)], milestone, kind)
WEEKS = [
    ("Set the plan and the baseline",
     [("Working session with David and TJ: agree the Table 2 minimums, and whether "
       "both provider products run or one leads", "R1 R7"),
      ("Confirm the five conference dates in Table 4 and move any affected week", "R4"),
      ("Set up the weekly numbers and record the current baseline", "R1 R2")],
     "Plan approved, owners named, baseline recorded.", "gate"),
    ("Package the offers",
     [("Finalize Client Growth and Staffing pricing, terms, and delivery scope", "R1"),
      ("Build the target list of non-medical home care agencies", "R1"),
      ("Write the sales workflow from first contact to signed agreement", "R1 R2")],
     "Offers, pricing, and sales workflow documented.", ""),
    ("Begin outreach and buyer discovery",
     [("Begin concentrated outreach to the target list", "R1"),
      ("Complete the buyer interview guide from the fifteen questions in Section 6",
       "R4"),
      ("Book the first conversations with risk-bearing organizations", "R4 R5")],
     "Outreach underway and the first buyer calls scheduled.", ""),
    ("Define the CRP-entry state",
     [("Write the definition of what CareNavigator must complete before CRP Day 1 "
       "and what is out of scope", "R3 R6"),
      ("First two buyer interviews", "R4"),
      ("Continue outreach", "R1")],
     "The development and validation boundary is documented.", ""),
    ("First close and Month 1 review",
     [("Close the first paying provider", "R1"),
      ("Two further buyer interviews", "R4"),
      ("Review against Table 2 and state which level the company is tracking to",
       "R7")],
     "First revenue recorded, or a documented account of why not.", "gate"),
    ("Make delivery repeatable",
     [("Simplify delivery based on what the first customers required", "R2"),
      ("Continue buyer interviews", "R4"),
      ("Begin verification planning for the workflows that touch a live application",
       "R3")],
     "Delivery cost for the second customer is lower than for the first.", ""),
    ("Second cohort and first repeat purchase",
     [("Convert a second cohort and pursue the first repeat purchase", "R1 R2"),
      ("Continue buyer interviews", "R4"),
      ("Draft the aim architecture from the buyer input to date", "R6")],
     "One customer has purchased twice.", ""),
    ("Consolidate the buyer requirements",
     [("Write up where buyers agree and where they differ", "R4"),
      ("First investor update, using observed results", "R8"),
      ("Continue the execution-capability build", "R3")],
     "A written statement of what a buyer would require.", ""),
    ("Month 2 review and conference preparation",
     [("Review against Table 2 and revise the plan if the minimums are out of reach",
       "R7"),
      ("Book conference meetings with buyers and investors", "R4 R5 R8"),
      ("Complete the critical execution capabilities", "R3")],
     "January minimums confirmed as reachable, or the plan revised.", "gate"),
    ("Conference week",
     [("Buyer and investor meetings against the Table 4 objectives", "R4 R5 R8"),
      ("Obtain feedback on proof-of-concept design and decision thresholds", "R5"),
      ("Maintain the sales cadence during travel", "R1")],
     "Three organizations have responded to a specific proof-of-concept design.", ""),
    ("Follow up",
     [("Follow up every conference conversation within five days", "R5 R8"),
      ("Increase the number of paying providers", "R1"),
      ("Begin the buyer-informed Research Strategy draft", "R6")],
     "Every conference conversation has a scheduled next step.", ""),
    ("Draft the application",
     [("Research Strategy draft on the aim architecture", "R6"),
      ("Commercialization Plan draft against observed results", "R1 R8"),
      ("Request support letters", "R5 R8")],
     "Both documents drafted end to end.", ""),
    ("Thanksgiving week",
     [("Maintain the sales cadence and follow up on letters", "R1 R8"),
      ("No new work started", "")],
     "No slippage.", "quiet"),
    ("Establish the unit economics",
     [("Document repeat purchasing and churn, and calculate acquisition cost, "
       "delivery cost, and margin", "R2"),
      ("Consolidate the available preliminary CareNavigator evidence", "R3"),
      ("Full internal read of both drafts", "R6 R7")],
     "Unit economics documented from actual results.", ""),
    ("Fix the evidence",
     [("Freeze the figures that go into the application", "R1 R2"),
      ("Identify candidate organizations for the post-CRP proof of concept", "R5"),
      ("Second draft of both documents", "R6")],
     "Application figures final.", ""),
    ("Complete",
     [("All support letters received", "R8"),
      ("All sections complete and internally reviewed", "R6 R7"),
      ("Final scorecard: report results against Table 2", "R1")],
     "Application ready to submit. This is the internal deadline.", "gate"),
    ("Holiday week",
     [("Buffer for anything outstanding", ""),
      ("No new work started", "")],
     "No work scheduled.", "quiet"),
    ("Submit",
     [("Final compliance check against the SF424 and NOFO requirements", "R6"),
      ("Assemble, proof, and submit", "R6")],
     "Submitted.", "gate"),
]

start = dt.date(2026, 8, 31)
wk_html = []
for i, (job, tasks, milestone, kind) in enumerate(WEEKS):
    mon = start + dt.timedelta(days=7 * i)
    fri = mon + dt.timedelta(days=4)
    # An en dash inside a same-month span is a numeric range, which house style
    # allows; a cross-month span spells the word out instead.
    if mon.month == fri.month:
        span = f'{mon.strftime("%B %-d")}–{fri.strftime("%-d")}'
    else:
        span = f'{mon.strftime("%B %-d")} to {fri.strftime("%B %-d")}'
    wtag = {'gate': ' <span class="tag">CHECKPOINT</span>',
            'quiet': ' <span class="tag q">HOLIDAY</span>'}.get(kind, '')
    lis = ''
    for t, rk in tasks:
        tag = f' <span class="rk">[{rk}]</span>' if rk else ''
        lis += f'<li>{esc(t)}{tag}</li>'
    wk_html.append(
        f'<div class="wk{" " + kind if kind else ""}">'
        f'<p class="wkh"><b>Week {i+1}</b> '
        f'<span class="d">{span}</span>{wtag}</p>'
        f'<p class="wkj">{esc(job)}</p>'
        f'<ol class="wkt">{lis}</ol>'
        f'<p class="wko"><b>Milestone.</b> {esc(milestone)}</p></div>')
WEEKBLOCKS = '\n'.join(wk_html)
print('part 3 written')


BODY = f"""
<h1 class="doctitle">Olera Pre-CRP R&amp;D, Commercialization, and Execution Plan</h1>
<p class="lede">Internal working plan &#183; 31 August 2026 to 1 January 2027</p>

<h2 class="sechead">1. Purpose</h2>

<p><b>What this document covers.</b> Olera has two jobs between now and 1 January:
run the company and prepare the CRP application. This plan sets out what gets
done, in what order, and what each piece of work is meant to establish. The two
jobs are treated together because the commercial results produced over the next
eighteen weeks are also the evidence the application will rest on.</p>

<p class="sec"><b>Four things the application must avoid.</b> It must not ask the
CRP to fund work that reads as product development. It must not rest on a revenue
model the company does not use. It must not describe the family product as more
mature than it is. And it must not present provider revenue as evidence that
institutions will pay for CareNavigator. Each of these is addressed by producing
evidence before submission rather than by wording.</p>

<p class="sec"><b>How to read this.</b> Sections 2 and 3 describe the model and
the five-year sequence. Sections 4 through 7 cover the four bodies of work.
Section 8 is the January scorecard, organized by the risk each result addresses.
Section 9 is the week-by-week plan. Section 10 states the intended end state. Four
terms are used consistently: <b>known</b> means observed, <b>hypothesized</b>
means believed but not shown, <b>target</b> means intended, and <b>stretch</b>
means a good outcome the plan does not depend on.</p>

<h2 class="sechead">2. The ecosystem, the pathway, and Olera's position on it</h2>

<p><b>From recognized need to established care.</b> An older adult and their
family sit within a set of organizations they do not choose: aid programs with
eligibility rules, healthcare organizations managing discharge, payers bearing
downstream risk, LTSS organizations, care providers, and a caregiver workforce
smaller than demand. A recognized need becomes established care only after a
sequence of steps: assessing the need, identifying services and funding, planning,
completing administrative steps, staffing and delivering care, and adjusting as
circumstances change. Most of that sequence is unsupported, and it is where
failures occur.</p>

{FIG1}

<p class="sec"><b>Each Olera product addresses a step in that sequence.</b>
Caregiver Staffing supplies workers at the staffing step; an agency that cannot
staff a case cannot establish care regardless of how well the earlier steps went.
Client Growth addresses the two steps where a provider and a family find each
other and convert that contact into a started case. Provider records and
relationships support the sequence throughout, since planning depends on visible
capacity. CareNavigator, shown dashed in Figure 1, is the end-to-end system the
first generation is being built toward.</p>

<p class="sec"><b>The provider products serve five purposes.</b> They generate
revenue. They demonstrate that Olera can sell, deliver, and retain customers. They
deepen the provider relationships and record quality CareNavigator depends on.
They give the company direct exposure to the operations of the agencies whose
capacity determines whether care is established. And they produce a second source
of field data on where the sequence fails.</p>

<p class="sec"><b>The evidentiary boundary.</b> Provider revenue demonstrates that
Olera can commercialize. It does not demonstrate that a risk-bearing institution
will pay for CareNavigator. The customers, budgets, buying processes, and evidence
requirements are different, and the application should say so directly.
CareNavigator has to establish its own commercialization case through product
maturity, evidence, and direct buyer discovery. Section 6 covers that work.</p>

<h2 class="sechead">3. The five-year sequence</h2>

<p><b>Where the CRP sits.</b> The CRP is one stage in a longer R&amp;D and
commercialization sequence. The sequence below is what Olera would pursue with or
without the award. The award affects the pace and rigor of the middle stages
rather than the direction.</p>

{ROADMAP}

<p class="sec"><b>Implication for the application.</b> Development belongs before
CRP Day 1 and validation belongs within the CRP. That distinction is why Section 5
is a separate body of work with its own deadline. If an aim can be read as product
development, it is in the wrong place.</p>

<h2 class="sechead">4. Near-term provider commercialization</h2>

<p><b>Beachhead.</b> Non-medical home care agencies. Assisted living is in scope
only where the same offer and delivery apply without modification. Home health,
skilled nursing, and the more heavily regulated segments are out of scope for this
period, because their sales cycles are longer than the available window.</p>

<p class="sec"><b>Olera Pro Staffing.</b> Olera recruits, screens, onboards, and
matches pre-health student workers to agencies, and agencies pay per successful
hire. <b>Known:</b> more than 900 students have applied and 25 have been placed;
four agencies trialed the service and three paid, at roughly $275 per placement,
across multiple semesters. <b>Target:</b> ten to fifteen recurring provider
customers by January. <b>Stretch:</b> 25 agencies averaging about three paid hires
a month at $250, roughly $18,750 a month and about $225,000 annualized. The $250
figure is below what agencies have paid to date.</p>

<p class="sec"><b>Olera Pro Client Growth.</b> Olera helps agencies acquire and
convert prospective clients through managed advertising, landing pages, lead
qualification and follow-up, review generation, and search visibility. These are
delivery components rather than separate products. The commercial test is whether
agencies purchase again because the program produced measurable client
acquisition. <b>Target:</b> ten to fifteen recurring customers with measurable
delivery. This product is less proven than Staffing, and whether both run or one
leads is a Week 1 decision.</p>

<p class="sec"><b>Both remain company-funded.</b> Neither provider product is a
CRP aim, and neither should appear in the aims. They appear in the
Commercialization Plan as evidence of commercial capability, and in the
Environment discussion as evidence that the company can sustain itself.</p>

<h2 class="sechead">5. CareNavigator: current state and pre-CRP completion</h2>

<p><b>Current state.</b> CareNavigator today provides assessment, benefit and
program discovery, and provider discovery, on a platform with real usage and a
database of more than 72,000 LTSS records, with usability and acceptance evidence
behind it. It does not yet include a mature, bounded execution capability that
carries a family from a plan to a completed administrative step. The first
generation of that capability is in development now, using Phase IIB and company
resources, and completes before CRP Day 1. The application should describe it in
those terms.</p>

<p class="sec"><b>What the Phase IIB study provides.</b> The Aim 3 study enrolls
200 caregivers of people with Alzheimer's disease and related dementias, at least
half reporting a social need, and measures acceptance and caregiver outcomes: a
modified technology acceptance measure, medication adherence, caregiving
self-efficacy, and positive aspects of caregiving, with cognitive status as a
covariate. It runs through the second quarter of 2027. Two consequences follow. It
does not measure care establishment, so it is not preliminary effectiveness
evidence for the CRP endpoint. And it does not report before January, so the
application cannot rely on its results. Any care-establishment signal available by
January will come from live use of the execution capability and will be limited in
size.</p>

<p class="sec"><b>The Week 4 deliverable.</b> A written definition of what must be
complete before CRP Day 1, what will be verified, and what is out of scope.
Section 6 depends on being able to describe a specific product to a buyer, and the
aim architecture depends on knowing where development ends and validation
begins.</p>

<h2 class="sechead">6. Institutional-buyer development</h2>

<p><b>Working assumption.</b> Assume no institution wants this until one shows
otherwise. Risk-bearing organizations are approached regularly with proposals to
reduce avoidable utilization, and most such conversations do not become budget
lines. Expressed interest in a first meeting carries little information. A
specific reason a buyer would not purchase is useful. The purpose of these
conversations is to establish what would have to be true.</p>

<p class="sec"><b>The fifteen questions.</b> Each interview should work toward
answers to the following. An interview that produces interest but no answers
should be recorded as incomplete.</p>

<ol class="qs">
<li>Who in your organization owns the problem of members who need long-term
services and cannot arrange them?</li>
<li>What is that person measured on, and over what period?</li>
<li>What do you do about it today, and what does that cost?</li>
<li>Which population would you address first, and how many people is that?</li>
<li>Would you accept verified care establishment as an endpoint, or do you need a
utilization or cost outcome?</li>
<li>What comparison would you require? Would a concurrent comparison group be
sufficient, or do you require randomization?</li>
<li>What effect size would be large enough to act on, and what would be too
small?</li>
<li>Over what period would you need it sustained?</li>
<li>What data would you provide, under what agreement, and who signs it?</li>
<li>What data would you need returned, in what format and on what schedule?</li>
<li>Who else approves this, and what has caused similar proposals to fail in your
organization?</li>
<li>How large would a paid proof of concept need to be for the result to be
credible internally?</li>
<li>What would you pay for the proof of concept, and from which budget?</li>
<li>If the proof of concept succeeded, what would the contract look like: per
member, per completed episode, shared savings, or another structure?</li>
<li>What would lead you to decline even with a good result?</li>
</ol>

<p class="sec"><b>The standard by January.</b> <b>Minimum:</b> several substantive
interviews with target buyers, written up, recording disagreements as well as
agreements. <b>Target:</b> convergence across buyers on endpoint, comparison, and
evidence threshold, which allows the CRP aims to be designed against a stated
requirement rather than an assumption. <b>Stretch:</b> written conditional
interest in a post-CRP proof of concept from more than one organization. The plan
does not depend on the stretch. Convergence alone improves both the Research
Strategy and the Commercialization Plan.</p>

<p class="sec"><b>Letters of support.</b> A general letter of endorsement carries
little weight with reviewers. A letter naming an endpoint, a population, and a
condition under which the organization would participate carries substantial
weight. December effort should go to the second kind.</p>

<h2 class="sechead">7. Private investors and the long-term thesis</h2>

<p><b>Position.</b> Investors are the audience for the results of the three
operating tracks rather than a fourth track. Support should be sought against
milestones as they are met. The thesis has seven parts, each addressing a
different category of doubt.</p>

<ol class="qs">
<li><b>Demographics.</b> The population needing long-term services is growing,
survival with chronic disease is longer, and the caregiver workforce is not
growing to match.</li>
<li><b>The pathway is the asset.</b> The durable position is presence at the
sequence through which a need becomes established care, which is where substantial
downstream spending is initiated and directed.</li>
<li><b>Existing supply-side assets.</b> More than 72,000 records, over 700 claimed
listings, and direct commercial relationships with agencies. These take time to
build.</li>
<li><b>Demonstrated commercial capability.</b> By January this is evidenced rather
than asserted: agencies paying for two products, with retention and unit
economics.</li>
<li><b>Institutional ceiling.</b> Provider products are a viable business.
Institutional contracts for care establishment are considerably larger, and the
CRP is the mechanism for producing the evidence they require.</li>
<li><b>Non-dilutive funding of validation.</b> The validation institutional buyers
require is what the CRP funds, so private capital is asked to finance
commercialization rather than research.</li>
<li><b>Compounding across products.</b> Staffing deepens the provider network; the
provider network improves navigation; navigation generates pathway data; pathway
data improves both.</li>
</ol>

<p class="sec"><b>The long-term position, stated carefully.</b> The opportunity is
to become the infrastructure layer for the care-establishment pathway, comparable
to the role Zillow occupies in a transaction it does not itself perform. This is a
direction rather than a current position. Olera does not own the pathway, the
market size is not established, and the comparison is an analogy rather than a
projection.</p>

<h2 class="sechead">8. January readiness scorecard</h2>

<p><b>Organized by risk.</b> The question is which doubts a reviewer or an
investor could still hold on 1 January that could have been removed before then.
Eight are addressed in this period. Each row states the risk, what would address
it, the minimum that allows the application to rest on observed results, and the
stretch.</p>

{RISKS}

<p class="sec"><b>Status of these figures.</b> They are planning targets rather
than commitments, and should be reviewed with David and TJ in Week 1 against
actual sales and delivery capacity. The application will report results as they
occur.</p>

{CRIT}

<p class="note"><b>Where each risk appears in review.</b> Development inside the
aims is R6. A revenue model resting on projection rather than collection is R1 and
R2. An overstated family product is R3, which is why Section 5 states the current
product plainly and sets a Week 4 deadline for the CRP-entry definition. Thin
evidence of market pull is R4 and R5.</p>

<h2 class="sechead">9. Week-by-week plan</h2>

<p><b>How to read it.</b> Eighteen weeks, from this week to submission. Each week
has one objective, a short numbered task list, and a milestone. Owners are not
assigned here; they are set in the Week 1 session. The bracketed tags link each
task to the risk in Table 2 it addresses.</p>

<p class="sec"><b>The operative deadline is 18 December.</b> Week 16 is the
internal deadline. 1 January is a federal holiday and the two weeks before it are
unreliable, so the plan completes the work before the holidays and reserves the
final fortnight for buffer and submission mechanics. Four weeks are checkpoints at
which the plan is confirmed or revised. Two are holiday weeks with no planned
work.</p>

{CONF}

<p class="sec"><b>Standing weekly routine.</b> Monday, thirty minutes on the
numbers: outreach, meetings, offers, conversions, active customers, delivered
outcomes, repeat purchasing, revenue, and churn. Friday, numbers updated and a
short note on what changed. End of each month, a review against Table 2 stating
which level the company is tracking to.</p>

{WEEKBLOCKS}

<h2 class="sechead">10. Intended end state</h2>

<p><b>The target for 1 January.</b> Olera submits an application in which the
commercial claims are observations rather than projections; the aims cover
late-stage validation only, with development completed before Day 1; the evidence
requirements reflect what prospective institutional buyers said they would need;
and the investors who would finance the post-CRP proof of concept have followed
the milestones as they were met. Each week in Section 9 is directed at one of the
eight risks in Table 2.</p>

<p class="sec"><b>The remaining gap.</b> Whether families need navigation, and
whether Olera can build a provider audience, are settled questions. The open
question is whether a mature CareNavigator can reliably increase verified care
establishment, with evidence sufficient for a risk-bearing organization to fund a
paid proof of concept and then purchase. Before submission, Olera demonstrates
commercial execution using its own resources and lets prospective buyers define
the evidence CareNavigator must produce. The CRP is then directed at the
validation that produces it.</p>

<p class="sec"><b>Required by Friday of Week 1.</b> Agreement on the Table 2
minimums against actual capacity. A decision on whether both provider products run
or one leads. Confirmed conference dates. Named owners for each of the eighteen
weeks. And the first set of weekly numbers, so that later results have a baseline
to be measured against.</p>
"""

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'memo_word.html' if WORD else 'memo.html'
open(out, 'w', encoding='utf-8').write(DOC)
print('wrote', out, '|', len(WEEKS), 'weeks')
