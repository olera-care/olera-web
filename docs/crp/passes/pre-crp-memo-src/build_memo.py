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


# --- extra list styles used by the buyer questions and the investor thesis ----
CSS += """
ol.qs { margin: 3pt 0 4pt 0; padding: 0 0 0 19pt; font-size: 10pt; }
ol.qs li { margin: 0 0 2pt 0; text-align: left; }
ol.qs li::marker { color: #14453f; font-weight: bold; }
p.note { font-size: 9.5pt; color: #5f6b64; text-align: left; margin: 4pt 0 3pt 0; }
p.note b { color: #14453f; }
"""

FIG1 = figblock(
    FM.ecosystem(), 1,
    'The ecosystem an older adult sits inside, the pathway a recognized need has to '
    'travel before care is actually established, and where each Olera product acts on '
    'that pathway today. Every product improves a step of the same pathway. That is '
    'what makes them one company rather than three businesses.')

# ---------------------------------------------------------------- roadmap ----
ROADMAP = table(
    ['Period', 'What Olera builds', 'What Olera sells', 'What that period proves'],
    [['Phase I and IIB<br>through 2026',
      'Assessment, benefit and program discovery, provider discovery, and the platform '
      'foundation. Usability and acceptance evidence with caregivers.',
      'Nothing on the family side. Caregiver Staffing sold to providers with company '
      'resources.',
      'Families will use it and the technology works. <b>Known.</b>'],
     ['Pre-CRP<br>Sep 2026 to Jan 2027',
      'First generation of bounded execution capability, plus verification of the '
      'workflows that touch a real application or a real provider.',
      'Two provider products in one narrow beachhead, at real prices, to real agencies.',
      'Olera can sell, deliver, and retain. The product is mature enough to enter '
      'late-stage validation. <b>Target.</b>'],
     ['CRP<br>Years 1 to 3',
      'No new product category. Design and quality controls, independent verification, '
      'and the instrumentation a controlled study needs.',
      'Provider products continue on company revenue and are not CRP-funded.',
      'That a mature CareNavigator raises verified care establishment against a '
      'concurrent comparison. <b>Hypothesized.</b>'],
     ['Post-CRP<br>Years 4 to 5',
      'Integration work specific to the first institutional customers: eligibility '
      'feeds, referral handoffs, reporting.',
      'A paid institutional proof of concept with a risk-bearing organization, then '
      'contracts.',
      'That care establishment moves utilization or cost enough for an institution to '
      'buy it at scale. <b>Hypothesized.</b>'],
     ['Beyond<br>Year 5',
      'Whatever the pathway data says is the next binding constraint.',
      'Institutional contracts alongside the provider business.',
      'Nothing yet. This row is direction, not forecast. <b>Stretch.</b>']],
    [12, 27, 27, 34], 1,
    'The five-year arc. Read the last column first: each period exists to convert one '
    'kind of uncertainty into one kind of fact, and the labels say honestly which are '
    'already known and which are still hypotheses.',
    ['', 'gate', '', '', 'quiet'])

# ------------------------------------------------------------- scorecard ----
RISKS = table(
    ['Risk we are retiring', 'What would retire it', 'Minimum by 1 January', 'Stretch'],
    [['R1. Olera cannot sell anything',
      'Providers paying real money, more than once, for a product delivered by this '
      'team with this headcount.',
      'Multiple providers paying for successful hires and several paying for client '
      'growth, with delivery documented.',
      '25 agencies averaging about 3 paid hires a month at $250, roughly $18,750 a '
      'month.'],
     ['R2. Olera cannot deliver or retain',
      'Repeat purchasing, measured churn, and an acquisition and delivery cost we can '
      'state without hedging.',
      'At least one clear repeat purchase and a stated cost per acquired customer.',
      'Retention and margin stable enough to project a run rate.'],
     ['R3. CareNavigator is not actually built',
      'The first generation of execution capability completed and testable on company '
      'and Phase IIB resources, before CRP Day 1.',
      'Core execution product complete and testable, with the critical workflows '
      'verified.',
      'Preliminary care-establishment signal from real use, however small.'],
     ['R4. Nobody knows what a buyer would require',
      'Direct conversations with risk-bearing organizations that answer the fifteen '
      'questions in Section 6 the same way.',
      'Several substantive interviews with true target buyers, written up.',
      'Convergence across buyers on endpoint, comparison, and evidence threshold.'],
     ['R5. There is no market pull',
      'A buyer willing to say what it would take for them to participate in a paid '
      'proof of concept.',
      'One buyer engaged enough to review a draft proof-of-concept design.',
      'Written conditional interest from more than one buyer.'],
     ['R6. The CRP asks for the wrong thing',
      'An aim architecture built only from allowable late-stage activities, with '
      'development moved before Day 1.',
      'Revised aims drafted against the buyer requirements and the allowable-activity '
      'list.',
      'Reviewers would struggle to name a single development task inside the aims.'],
     ['R7. The team cannot carry both',
      'Eighteen weeks of selling and drafting running at once without either stopping.',
      'Weekly numbers unbroken from Week 1, and both documents drafted by Week 12.',
      'Week 16 closes with everything complete and the last two weeks unused.'],
     ['R8. There is no money after the CRP',
      'Investors who understand the milestones and stay engaged as they are hit.',
      'Investors briefed on the milestone sequence and still in the conversation.',
      'Support letters indicating financing interest conditional on CRP and '
      'commercial milestones.']],
    [23, 27, 27, 23], 2,
    'The January scorecard, organised by the risk each result retires rather than by '
    'the activity that produced it. A number that retires no risk does not belong in '
    'the application. Minimums are what the application needs to rest on observed '
    'traction; stretches are planning targets, not commitments.')

CRIT = table(
    ['Scored criterion', 'What the January evidence puts in front of the reviewer'],
    [['Significance',
      'Market pull evidenced by buyer interviews rather than asserted, plus a '
      'competitive read from agencies that actually bought something (R4, R5).'],
     ['Investigator(s)',
      'A team that commercialized a product during the drafting period, with revenue '
      'and retention to show for it (R1, R2, R7).'],
     ['Innovation',
      'A first-generation execution capability that exists and can be demonstrated, '
      'not described (R3).'],
     ['Approach',
      'Aims containing only allowable late-stage activities, with the development '
      'boundary visible on the timeline (R6).'],
     ['Environment',
      'A company sustaining itself on revenue while running the project, which is '
      'exactly what this criterion asks about a prior SBIR recipient (R1, R2).'],
     ['Commercialization Plan',
      'Five-year milestones anchored to observed unit economics rather than to a '
      'projection, and a revenue stream we have actually collected (R1, R2, R8).'],
     ['Fundraising Plan',
      'Named investors who have watched the milestones land, engaged against a '
      'defined post-CRP financing need (R8).']],
    [21, 79], 3,
    'Every January result is aimed at a scored criterion. The mapping is the test of '
    'whether a given week of work is worth doing: if a task cannot be traced to a row '
    'here, it is not pre-CRP work.', keep=True)

CONF = table(
    ['Event', 'When', 'Why we go', 'What we must leave with'],
    [['Nashville Healthcare Sessions',
      'Confirm.<br>Typically autumn',
      'Provider and operator density in the segment we are actually selling to.',
      'Named agency prospects and at least one buyer introduction.'],
     ['ARC Summit',
      'Confirm.<br>Typically autumn',
      'Aging and care-innovation buyers and the investors who follow them.',
      'Two buyer conversations booked for the following week.'],
     ['HLTH',
      'Confirm.<br>Typically early Nov',
      'The single highest concentration of risk-bearing buyers and investors in the '
      'four months.',
      'Feedback on proof-of-concept design and decision thresholds from at least three '
      'organizations.'],
     ['IHI Forum',
      'Confirm.<br>Typically early Dec',
      'Quality and population-health leaders who own the outcomes we would be '
      'contracting against.',
      'A read on which endpoint a quality leader finds credible.'],
     ['JP Morgan Healthcare',
      'Confirm.<br>Typically early Jan',
      'After submission. It is a constraint on the calendar, not an activity in the '
      'plan.',
      'Nothing. Do not let January travel planning consume December.']],
    [19, 13, 36, 32], 4,
    'Conferences are worked, not attended. Each row states the one thing that makes '
    'the trip worth its cost. <b>No date here is confirmed.</b> Confirm all five '
    'before approving the week plan, and move the affected weeks if they differ.',
    ['', '', 'gate', '', 'quiet'])
print('part 2 written')


# ------------------------------------------------------------------ weeks ----
# (week's job, [(task, risk tag)], milestone, kind)
WEEKS = [
    ("Decide the shape of the sprint",
     [("Working session with David and TJ: agree the minimums in Table 2 and whether "
       "both provider products run or one leads", "R1 R7"),
      ("Confirm the five conference dates in Table 4 and move any week they break", "R4"),
      ("Stand up the weekly numbers and write down today's baseline", "R1 R2")],
     "The plan is approved and the baseline exists.", "gate"),
    ("Package the two offers",
     [("Finalize Client Growth and Staffing pricing, terms, and what delivery includes",
       "R1"),
      ("Build the target list of non-medical home care agencies in the beachhead", "R1"),
      ("Write the sales workflow from first contact to signed", "R1 R2")],
     "Anyone on the team could run a first sales call unaided.", ""),
    ("Start selling and start listening",
     [("Begin concentrated outreach against the target list", "R1"),
      ("Finish the buyer interview guide from the fifteen questions in Section 6", "R4"),
      ("Book the first risk-bearing-organization conversations", "R4 R5")],
     "Outreach is live and the first buyer calls are on the calendar.", ""),
    ("Draw the CRP-entry line",
     [("Write down exactly what CareNavigator must complete before CRP Day 1, and what "
       "it will not do", "R3 R6"),
      ("First two buyer interviews", "R4"),
      ("Keep selling", "R1")],
     "The development-versus-validation boundary is written, not assumed.", ""),
    ("First close and Month 1 checkpoint",
     [("Close the first paying provider", "R1"),
      ("Two more buyer interviews", "R4"),
      ("Review against Table 2 and say which level we are tracking to", "R7")],
     "Revenue exists, or we know by 2 October that it will not.", "gate"),
    ("Make delivery repeatable",
     [("Simplify delivery to what the first customers actually needed", "R2"),
      ("Continue buyer interviews", "R4"),
      ("Begin verification planning for the workflows that touch a real application",
       "R3")],
     "The second customer costs less to serve than the first.", ""),
    ("Second cohort and first repeat",
     [("Convert a second cohort and look for the first repeat purchase", "R1 R2"),
      ("Continue buyer interviews", "R4"),
      ("Draft the revised aim architecture from what buyers are saying", "R6")],
     "One customer has bought twice.", ""),
    ("Requirements converge",
     [("Write up where buyers agree and where they do not", "R4"),
      ("First investor update, using observed traction only", "R8"),
      ("Continue the execution-capability build", "R3")],
     "We can state what a buyer would require, in their words.", ""),
    ("Month 2 checkpoint and conference prep",
     [("Review against Table 2; re-cut the plan if the minimums are out of reach", "R7"),
      ("Book conference meetings with buyers and investors", "R4 R5 R8"),
      ("Complete the critical execution capabilities", "R3")],
     "Either the January minimums are still live, or the plan changes today.", "gate"),
    ("Conference week",
     [("Buyer and investor meetings against the Table 4 objectives", "R4 R5 R8"),
      ("Get concrete feedback on proof-of-concept design and decision thresholds", "R5"),
      ("Keep the sales cadence running behind the travel", "R1")],
     "Three organizations have reacted to a specific proof-of-concept design.", ""),
    ("Convert the conference",
     [("Follow up every conversation within five days or it did not happen", "R5 R8"),
      ("Increase the paying-provider count", "R1"),
      ("Begin the buyer-informed Research Strategy draft", "R6")],
     "Every conference conversation has a next step with a date.", ""),
    ("Draft the application",
     [("Research Strategy draft on the new aim architecture", "R6"),
      ("Commercialization Plan draft against observed traction", "R1 R8"),
      ("Request support letters", "R5 R8")],
     "Both documents exist end to end, however rough.", ""),
    ("Short week, hold the line",
     [("Thanksgiving. Keep the sales cadence and chase letters", "R1 R8"),
      ("Start nothing new", "")],
     "Nothing slips.", "quiet"),
    ("Prove the economics",
     [("Show repeat purchasing and churn; compute acquisition cost, delivery cost, and "
       "margin", "R2"),
      ("Consolidate whatever preliminary CareNavigator evidence exists", "R3"),
      ("Full internal read of both drafts", "R6 R7")],
     "The unit economics are numbers, not estimates.", ""),
    ("Lock the evidence",
     [("Freeze the traction figures that go into the application", "R1 R2"),
      ("Identify post-CRP proof-of-concept candidate organizations", "R5"),
      ("Second draft of both documents", "R6")],
     "No number in the application will move again.", ""),
    ("Everything complete",
     [("All support letters in hand", "R8"),
      ("All sections complete and internally reviewed", "R6 R7"),
      ("Final scorecard: report actual traction against Table 2, transparently", "R1")],
     "The application is submittable. This is the real deadline.", "gate"),
    ("Buffer only",
     [("Holiday week. Buffer for anything that slipped", ""),
      ("Start nothing new", "")],
     "Nothing is required of this week.", "quiet"),
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
<p class="lede">Internal working memo &#183; 31 August 2026 to 1 January 2027 &#183;
supersedes the separate pre-CRP commercialization memo and week-by-week plan</p>

<h2 class="sechead">1. Purpose</h2>

<p><b>What this document is for.</b> Between now and 1 January we have to do two
things at once: run the company, and rebuild a grant application. This memo says
what we are doing, in what order, and what each piece of work is supposed to
prove. It is one document because the two jobs are one job. Every commercial
result we produce in the next eighteen weeks is also evidence a reviewer will
score, and every question a reviewer would ask is a question a customer or an
investor would ask first.</p>

<p class="sec"><b>Why we are rewriting rather than editing.</b> The August and
September drafting and the mock review exposed real weaknesses, not presentation
problems. The proposal asked the CRP to fund work that looked like development. It
leaned on a subscription revenue model the company had already moved away from. It
described a family product with more maturity than it has. And it treated provider
revenue as though it were evidence that institutions would pay for CareNavigator,
which it is not. This plan is built to retire those weaknesses with facts by
January, not to argue them away.</p>

<p class="sec"><b>What has changed in the framing.</b> Earlier versions of this
plan described four parallel tracks. That was accurate and it was also flat: it
did not say why the tracks belong in the same company. They do, and the reason is
the subject of Section 2. Olera is not a family navigation product with two side
businesses attached. It is a set of products that each improve a different step of
the same pathway, which is why they compound.</p>

<p class="sec"><b>How to read the rest.</b> Sections 2 and 3 set the model and the
five-year arc. Sections 4 through 7 are the four bodies of work, one per section.
Section 8 is the scorecard, organised around the eight risks we are retiring rather
than around activity. Section 9 is the week-by-week plan. Section 10 states the end
state we are underwriting. Throughout, four words are used precisely and are worth
watching for: <b>known</b> means we have observed it, <b>hypothesized</b> means we
believe it and have not shown it, <b>target</b> means we intend to hit it, and
<b>stretch</b> means it would be a very good outcome and we are not planning
around it.</p>

<h2 class="sechead">2. The ecosystem, the pathway, and where we sit on it</h2>

<p><b>Start with the older adult, not with the software.</b> An older adult and
the family around them sit inside an ecosystem they did not choose: aid programs
with eligibility rules, healthcare organizations that discharge them, payers who
bear the risk of what happens next, LTSS organizations, care providers, and a
caregiver workforce that is smaller than the demand for it. A recognized need does
not become established care by being recognized. It has to travel a pathway.
Someone has to assess the need, find services and money that fit, plan a course of
action, execute the administrative steps, staff and deliver the care, and then keep
learning as circumstances change. The pathway is long, it is mostly unsupported,
and it is where the failures happen.</p>

<p class="sec"><b>Every Olera product improves a step of that pathway.</b>
Caregiver Staffing puts workers into the staffing step, which is the step that
most often fails outright: an agency that cannot staff a case cannot establish
care no matter how well the family navigated. Client Growth acts on the two
steps where a provider and a family have to find each other and then convert that
contact into a started case. The provider records and relationships underlie the
whole pathway, because you cannot plan around capacity you cannot see. And
CareNavigator, dashed in Figure 1, is the end-to-end system the first generation
is being built toward. Nothing in that figure is a side business. They are
different places to stand on one problem.</p>

<p class="sec"><b>The provider products serve five purposes at once,</b> which is
why they are worth the four months even though they are not the CRP. They generate
revenue. They prove we can sell, deliver, and retain. They deepen the provider
relationships and record quality that CareNavigator depends on. They put us inside
the operational reality of the agencies whose capacity determines whether care gets
established. And they give us a second, independent source of field data about
where the pathway actually breaks. One activity, five returns.</p>

{FIG1}

<p class="sec"><b>The boundary that must not blur.</b> Provider revenue proves
that Olera can commercialize. It does not prove that a risk-bearing institution
will pay for CareNavigator. Those are different customers, different budgets,
different buying processes, and different evidence. We will say so plainly in the
application, because a reviewer who spots us conflating them will discount
everything else. CareNavigator has to earn its own commercialization case through
product maturity, defensible evidence, and direct buyer discovery. Section 6 is
that work.</p>

<h2 class="sechead">3. The five-year arc</h2>

<p><b>Where the CRP sits in a longer sequence.</b> The CRP is not the company's
plan. It is one stage of a longer R&amp;D and commercialization sequence, and the
application will be stronger for showing that we know which stage it is. The
sequence below is what we would run whether or not the grant is funded; the grant
changes the speed and the rigor of the middle of it, not the direction.</p>

{ROADMAP}

<p class="sec"><b>The consequence for the application.</b> Development belongs
before CRP Day 1 and validation belongs inside the CRP. That single line is what
the mock review kept circling, and it is the reason Section 5 exists as a separate
body of work with its own deadline. If a reviewer can point at an aim and call it
product development, the aim is in the wrong place.</p>

<h2 class="sechead">4. Near-term provider commercialization</h2>

<p><b>The beachhead is non-medical home care agencies.</b> Narrow on purpose.
Assisted living is in scope only where the same pitch and the same delivery
transfer without modification. Home health, skilled nursing, and the more heavily
regulated segments are out for these four months, not because they are
uninteresting but because a longer sales cycle would eat the whole window. The
point of a beachhead is to learn quickly, not to address the market.</p>

<p class="sec"><b>Olera Pro Staffing.</b> We recruit, screen, onboard, and match
pre-health student workers to agencies, and the agency pays per successful hire.
This is the more proven of the two. <b>Known:</b> more than 900 students have
applied, 25 have been placed, four agencies trialed the service and three of them
paid, at roughly $275 per placement, across multiple semesters. <b>Target:</b> ten
to fifteen recurring provider customers by January. <b>Stretch:</b> 25 agencies
averaging about three paid hires a month at $250, which is roughly $18,750 a month
and about $225,000 annualized. The $250 figure is deliberately set below what
agencies have actually paid.</p>

<p class="sec"><b>Olera Pro Client Growth.</b> We help agencies acquire and
convert prospective clients, using managed advertising, landing pages, lead
qualification and follow-up, review generation, and search visibility. Those are
delivery components, not five products. The commercial question is single: do
agencies pay us again because the program produced measurable client acquisition?
<b>Target:</b> ten to fifteen recurring customers with delivery we can measure.
This product is less proven than Staffing, and one of the Week 1 decisions is
whether to run both or let one lead.</p>

<p class="sec"><b>Both stay company-funded.</b> Neither provider product is a CRP
aim, and neither should appear in the aims. They appear in the Commercialization
Plan as evidence of commercial capability and in the Environment discussion as
evidence that the company can sustain itself, which is precisely what that
criterion asks of a prior SBIR recipient.</p>

<h2 class="sechead">5. CareNavigator: what exists and what completes before Day 1</h2>

<p><b>An honest statement of the current product.</b> CareNavigator today is
assessment, benefit and program discovery, and provider discovery, on a platform
with real usage and a database of more than 72,000 LTSS records. It has usability
and acceptance evidence behind it. What it does not yet have is a mature,
bounded execution capability: the part that carries a family from a plan to a
completed administrative step. The first generation of that capability is being
built now, during Phase IIB and with company resources, and it completes before
CRP Day 1. We should describe it that way in the application. Overstating it is
the fastest way to lose a reviewer who then reads the aims and finds development
hiding inside them.</p>

<p class="sec"><b>What the Phase IIB study does and does not give us.</b> The Aim 3
study enrolls 200 caregivers of people with Alzheimer's disease and related
dementias, at least half reporting a social need, and measures acceptance and
caregiver outcomes: a modified technology acceptance measure, medication
adherence, caregiving self-efficacy, and positive aspects of caregiving, with
cognitive status as a covariate. It runs through the second quarter of 2027.
Two consequences follow and both are load-bearing. It does not measure care
establishment, so it cannot be presented as preliminary effectiveness evidence for
the CRP endpoint. And it does not report before January, so nothing in the
application can depend on its results. Any care-establishment signal we have by
January will come from real use of the execution capability, and it will be small.
We should present it as what it is.</p>

<p class="sec"><b>The pre-CRP completion deadline is Week 4.</b> Not the build:
the written definition of what must be complete, what will be verified, and what
is explicitly out of scope. Everything in Section 6 depends on being able to
describe a specific product to a buyer, and everything in the aim architecture
depends on knowing where the line between development and validation falls.</p>

<h2 class="sechead">6. Institutional-buyer development</h2>

<p><b>Assume, until shown otherwise, that no institution wants this.</b> That is
the productive assumption. Risk-bearing organizations are approached constantly by
companies with a plausible story about reducing avoidable utilization, and most of
those conversations end in polite interest that never becomes a budget line. A
buyer who is enthusiastic in a first meeting has told us nothing. A buyer who
tells us the specific reason they would not buy has told us something we can act
on. We are not collecting encouragement. We are trying to find out what would have
to be true.</p>

<p class="sec"><b>The fifteen questions.</b> Every interview works toward answers
to these. An interview that produces warmth but not answers should be recorded as
a failed interview.</p>

<ol class="qs">
<li>Who inside your organization owns the problem of members who need long-term
services and cannot arrange them?</li>
<li>What does that person get measured on, and over what period?</li>
<li>What are you doing about it today, and what does that cost you?</li>
<li>Which population would you point this at first, and how many people is that?</li>
<li>Would you accept verified care establishment as an endpoint, or do you need a
utilization or cost outcome before anyone signs?</li>
<li>What comparison would you need? Would a concurrent comparison group satisfy
you, or do you require randomization?</li>
<li>What effect size would be large enough to matter to you, and what would be too
small to act on?</li>
<li>How long would you need to see it sustained?</li>
<li>What data would you have to give us, under what agreement, and who signs it?</li>
<li>What data would you need back, in what format, on what cadence?</li>
<li>Who else has to approve this, and what has caused similar proposals to die in
your organization?</li>
<li>How large would a paid proof of concept have to be for the result to be
credible internally?</li>
<li>What would you pay for the proof of concept itself, and out of whose budget?</li>
<li>If the proof of concept worked, what would the contract look like: per member,
per completed episode, shared savings, or something else?</li>
<li>What would make you say no even with a good result?</li>
</ol>

<p class="sec"><b>What good looks like by January.</b> <b>Minimum:</b> several
substantive interviews with true target buyers, written up, with the disagreements
recorded as carefully as the agreements. <b>Target:</b> convergence across buyers
on the endpoint, the comparison, and the evidence threshold, which is what lets us
design the CRP aims against a real requirement instead of our own guess.
<b>Stretch:</b> written conditional interest in a post-CRP proof of concept from
more than one organization. We should not plan on the stretch. Convergence alone
materially improves both the Research Strategy and the Commercialization Plan.</p>

<p class="sec"><b>A note on letters.</b> A generic letter of enthusiasm is worth
almost nothing to a reviewer and we should not spend December collecting them. A
letter that names an endpoint, a population, and a condition under which the
organization would participate is worth a great deal. Ask for the second kind or
do not ask.</p>

<h2 class="sechead">7. Private investors and the long-term thesis</h2>

<p><b>Investors sit above the operating work, not inside it.</b> They are not a
fifth workstream. They are the audience for what the other three produce, and
their confidence should be earned against milestones rather than solicited ahead
of them. The thesis has seven parts, and each one retires a different category of
doubt.</p>

<ol class="qs">
<li><b>The demographics are not in question.</b> The population needing long-term
services is growing, survival with chronic disease is longer, and the caregiver
workforce is not growing to match. This is the one premise nobody argues with.</li>
<li><b>The pathway, not the app, is the asset.</b> The durable position is being
present at the sequence through which a need becomes established care, because
that is where a great deal of downstream spending is initiated and directed.</li>
<li><b>Olera already holds unusual supply-side assets.</b> More than 72,000
records, over 700 claimed listings, and direct commercial relationships with
agencies. These are slow to build and hard to copy quickly.</li>
<li><b>The company can commercialize.</b> By January this is evidenced rather than
claimed: real agencies paying real prices for two products, with retention and
unit economics.</li>
<li><b>The technology has an institutional ceiling far above the provider
business.</b> Provider products are a real business. Institutional contracts for
care establishment are a much larger one, and the CRP is the mechanism for
producing the evidence they require.</li>
<li><b>Non-dilutive capital carries the expensive part.</b> The validation that
institutional buyers demand is exactly what the CRP funds, which means private
capital is asked to finance commercialization rather than research.</li>
<li><b>Each product makes the next one cheaper.</b> Staffing deepens the provider
network; the provider network improves navigation; navigation generates pathway
data; pathway data improves both. The compounding in Figure 1 is the reason to
own the whole pathway rather than one step of it.</li>
</ol>

<p class="sec"><b>The careful version of the ambition.</b> The long-term
opportunity is to become the infrastructure layer for the care-establishment
pathway, in roughly the way Zillow became infrastructure for a transaction it does
not itself perform. That is a direction we are building toward, not a position we
hold. We do not own the pathway today, the market size is not guaranteed, and the
comparison is an analogy rather than a forecast. Saying so is not modesty. An
investor who catches an unearned claim discounts the earned ones with it.</p>

<h2 class="sechead">8. The January readiness scorecard</h2>

<p><b>Organised by risk, not by activity.</b> The question is not how much we did.
It is which doubts a reviewer or an investor could still hold on 1 January that we
could have removed. Eight risks are worth retiring in this window. Each row below
names the risk, what would actually retire it, the minimum that lets the
application rest on observed traction, and the stretch.</p>

{RISKS}

<p class="sec"><b>These are planning figures, not commitments to NIH.</b> They
should be refined with David and TJ in Week 1 against real sales and delivery
capacity. The application will report what actually happened.</p>

{CRIT}

<p class="note"><b>How the mock-review weaknesses map onto this.</b> The
development-inside-the-aims criticism is R6. The stale revenue model is R1 and R2,
which replace a projection with collected revenue. The overstated family product
is R3, which is why Section 5 states the current product honestly and sets a Week 4
deadline for the CRP-entry line. The missing market pull is R4 and R5.</p>

<h2 class="sechead">9. Week by week</h2>

<p><b>How to read this section.</b> Eighteen weeks, this week to submission. Each
week has one job, a short numbered task list, and a milestone that either happened
or did not. Owners are deliberately absent: they are assigned in the Week 1
session, not by this memo. The bracketed tags trace each task to the risk in
Table 2 it retires. A task with no traceable risk should not be on the list.</p>

<p class="sec"><b>The date that matters is 18 December, not 1 January.</b> Week 16
is the internal deadline. January 1 is a federal holiday, and the two weeks before
it are the least reliable of the year. The plan therefore finishes the work before
the holidays and treats the last fortnight as buffer and submission mechanics. Four
weeks are checkpoints where the plan either holds or gets re-cut. Two are holidays
and carry no planned work, because a plan that needs Christmas to succeed has
already failed.</p>

{CONF}

<p class="sec"><b>The standing rhythm, all eighteen weeks.</b> Monday, thirty
minutes on the numbers: outreach, meetings, offers, conversions, active customers,
delivered outcomes, repeat purchasing, revenue, churn. Friday, numbers updated and
one line on what moved. End of each month, an honest read against Table 2 saying
which level we are tracking to. This is what makes the weeks below executable
rather than aspirational.</p>

{WEEKBLOCKS}

<h2 class="sechead">10. The January end state</h2>

<p><b>What we are underwriting.</b> On 1 January, Olera submits an application in
which the commercial claims are observations rather than projections, the aims
contain only late-stage validation because the development happened before Day 1,
the evidence requirements were written by the institutions that would eventually
buy, and the investors who would finance the post-CRP proof of concept have
watched the milestones land rather than reading about them. That is the whole
objective. Every week in Section 9 exists to move one of the eight risks in
Table 2 closer to retired.</p>

<p class="sec"><b>The Valley of Death, stated plainly.</b> Olera's remaining gap
is not whether families need navigation, and not whether the company can build a
provider audience. Both are settled. It is whether a mature CareNavigator can
reliably increase verified care establishment, with evidence strong enough that a
risk-bearing organization will fund a paid proof of concept and then buy. Before
submission we demonstrate commercial execution on our own resources and let real
buyers define the evidence CareNavigator must produce. The CRP is then directed
narrowly at the late-stage validation that produces it.</p>

<p class="sec"><b>What we owe each other by Friday of Week 1.</b> Agreement on the
Table 2 minimums against real capacity. A decision on whether both provider
products run or one leads. Confirmed conference dates. Named owners for each of
the eighteen weeks. And the first row of the weekly numbers, so that every later
claim in this plan has a baseline to be measured against.</p>
"""

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'memo_word.html' if WORD else 'memo.html'
open(out, 'w', encoding='utf-8').write(DOC)
print('wrote', out, '|', len(WEEKS), 'weeks')
