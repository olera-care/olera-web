# -*- coding: utf-8 -*-
"""Week-by-week execution plan to the CRP submission, in house style.

Derived entirely from the Pre-CRP Commercialization and Execution Plan: the four
tracks, the January scoreboard, and the month-by-month backward plan, resolved to
weeks. Nothing here adds a commitment the memo does not already make.
"""
import datetime as dt
import os

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
             letter-spacing: 0.4pt; margin: 10pt 0 4pt 0; text-align: left;
             border-bottom: 1.2pt solid #000; padding-bottom: 2pt;
             break-after: avoid; page-break-after: avoid; }
p.caption { text-align: left; margin: 2pt 0 4pt 0; font-size: 9pt; line-height: 1.16;
            break-before: avoid; page-break-before: avoid; }
p.caption b { color: #14453f; }
ul.pts { margin: 3pt 0 3pt 0; padding: 0 0 0 17pt; }
ul.pts li { margin: 0 0 2.5pt 0; text-align: left; padding-left: 2pt;
            break-inside: avoid; page-break-inside: avoid; }
ul.pts li::marker { color: #14453f; }
table.dat { width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.18;
            margin: 5pt 0 2pt 0; }
table.dat thead { display: table-header-group; }
table.dat thead th { text-align: left; font-weight: bold; color: #14453f;
                     border-bottom: 1pt solid #14453f; padding: 0 6pt 2.5pt 0;
                     vertical-align: bottom; }
table.dat td { padding: 3pt 6pt 3pt 0; border-bottom: 0.4pt solid #b9c4bd;
               vertical-align: top; }
table.dat td b { color: #14453f; }
table.dat tr { break-inside: avoid; page-break-inside: avoid; }
table.dat tbody tr:last-child td { border-bottom: 1pt solid #14453f; }
table.dat tbody tr.gate td { background: #eef3f1; }
table.dat tbody tr.quiet td { color: #5f6b64; }
td .dt { color: #5f6b64; font-size: 8.5pt; }
"""

# (week job, [tasks], owner, kind)  -- one entry per week, in order
WEEKS = [
    ("Decide and set the baseline",
     ["Decision session with David and TJ: lock minimum, target, and stretch goals",
      "Choose the beachhead, and whether both provider products run or one leads",
      "Stand up the weekly dashboard and record today's baseline numbers"],
     "Logan, TJ, David", "gate"),
    ("Package the offer",
     ["Finalize Client Growth and Staffing offers, pricing, and terms",
      "Build the target list of non-medical home care agencies",
      "Write the sales workflow, first contact through signed"],
     "TJ", ""),
    ("Start selling, start buyer discovery",
     ["Begin concentrated outreach to the target list",
      "Finish the institutional-buyer hypothesis and interview guide",
      "Book the first Medicare Advantage and ACO conversations"],
     "TJ, Logan", ""),
    ("Write the pre-CRP product plan",
     ["Define what CareNavigator must complete before CRP Day 1, on Phase IIB and company resources",
      "First buyer interviews",
      "Keep selling"],
     "TJ, Logan", ""),
    ("First close",
     ["Close the first paying provider",
      "Two more buyer interviews",
      "Month 1 review against the scoreboard"],
     "TJ, Logan", "gate"),
    ("Make delivery repeatable",
     ["Simplify delivery based on what the first customers actually needed",
      "Continue buyer interviews",
      "Begin verification and validation planning for the critical workflows"],
     "TJ", ""),
    ("Repeat purchase",
     ["Convert a second cohort of providers and look for the first repeat purchase",
      "Continue buyer interviews",
      "Draft the revised CRP aim architecture from what buyers are saying"],
     "TJ, Logan", ""),
    ("Evidence requirements converge",
     ["Write up the convergent buyer evidence requirements",
      "First investor update, using observed traction",
      "Continue the execution-capability build"],
     "Logan, David", ""),
    ("Month 2 review and conference prep",
     ["Month 2 review against the scoreboard",
      "Book HLTH meetings with buyers and investors",
      "Complete the critical execution capabilities"],
     "TJ, Logan, David", "gate"),
    ("HLTH",
     ["Institutional-buyer and investor meetings",
      "Get concrete feedback on proof-of-concept design and decision thresholds",
      "Confirm the exact conference dates and move this row if they differ"],
     "Logan, TJ, David", ""),
    ("Convert the conference into commitments",
     ["Follow up every HLTH conversation within five days",
      "Increase the paying-provider count",
      "Begin the buyer-informed Research Strategy draft"],
     "All", ""),
    ("Draft the application",
     ["Research Strategy draft on the new architecture",
      "Commercialization Plan draft",
      "Request support letters"],
     "Logan", ""),
    ("Short week: hold the line",
     ["Thanksgiving. Keep the sales cadence and chase letters",
      "Start nothing new"],
     "TJ", "quiet"),
    ("Prove retention",
     ["Show repeat purchasing and retention; compute acquisition cost, delivery cost, and margin",
      "Consolidate the preliminary CareNavigator evidence",
      "Full internal read of both drafts"],
     "TJ, Logan", ""),
    ("Lock the evidence",
     ["Freeze the traction numbers that go into the application",
      "Identify post-CRP proof-of-concept candidate organizations",
      "Second draft of both documents"],
     "Logan", ""),
    ("Everything complete",
     ["All support letters in hand",
      "All sections complete and internally reviewed",
      "Final scoreboard: report actual traction transparently"],
     "Logan, TJ, David", "gate"),
    ("Buffer only",
     ["Holiday week. Buffer for anything that slipped",
      "Start nothing new"],
     "Logan", "quiet"),
    ("Submit",
     ["Final compliance check against the SF424 and NOFO requirements",
      "Assemble, proof, and submit"],
     "Logan, TJ", "gate"),
]

start = dt.date(2026, 8, 31)
rows = ''
for i, (job, tasks, owner, kind) in enumerate(WEEKS):
    mon = start + dt.timedelta(days=7 * i)
    fri = mon + dt.timedelta(days=4)
    # Same-month weeks compress to one line in the narrow date column; the en
    # dash is a numeric range, which house style allows.
    if mon.month == fri.month:
        span = f'{mon.strftime("%b %-d")}\u2013{fri.strftime("%-d")}'
    else:
        span = f'{mon.strftime("%b %-d")} to {fri.strftime("%b %-d")}'
    cls = f' class="{kind}"' if kind else ''
    body = '<br>'.join(tasks)
    rows += (f'<tr{cls}><td><b>Week {i+1}</b><br><span class="dt">{span}</span></td>'
             f'<td><b>{job}</b></td><td>{body}</td><td>{owner}</td></tr>')

TABLE = (
    '<table class="dat"><thead><tr>'
    '<th style="width:12%">Week</th><th style="width:22%">The week\'s job</th>'
    '<th style="width:51%">Tasks</th><th style="width:15%">Owner</th>'
    '</tr></thead><tbody>' + rows + '</tbody></table>'
    '<p class="caption"><b>Table 1.</b> Eighteen weeks to submission. Shaded rows are '
    'checkpoints where the plan either holds or is re-cut; the two greyed rows are '
    'holiday weeks with no new work planned into them.</p>')

BODY = f"""
<h1 class="doctitle">Week-by-Week Plan to CRP Submission</h1>
<p class="lede">Attachment to the Olera Pre-CRP Commercialization and Execution Plan
&#183; 31 August 2026 to 1 January 2027</p>

<p class="sec"><b>How to read this.</b> One row per week, from this week to
submission. Every task traces to the memo's four tracks and its month-by-month
backward plan; nothing here adds a commitment the memo does not already make. Four
weeks are checkpoints, shaded below: at each one the plan either holds or is re-cut
against the January scoreboard. Two weeks are holidays and carry no planned work,
because a plan that needs Christmas to succeed has already failed.</p>

<p class="sec"><b>The one date that matters is not 1 January.</b> It is Week 16,
18 December, when everything must be complete. January 1 is a federal holiday and
the two weeks before it are the least reliable of the year. The plan therefore
finishes the work before the holidays and treats the last fortnight as buffer and
submission mechanics only.</p>

{TABLE}

<h2 class="sechead">The standing weekly rhythm</h2>

<p class="sec">The same three things happen every week, unchanged, all eighteen
weeks. This is what makes the table above executable rather than aspirational.</p>

<ul class="pts">
<li><b>Monday, thirty minutes.</b> Commercialization stand-up against the
dashboard: outreach, meetings, offers, conversions, active customers, delivered
outcomes, repeat purchasing, revenue, and churn.</li>
<li><b>Friday.</b> Numbers updated, and one line on what moved and what did not.</li>
<li><b>End of each month.</b> Review against the January scoreboard's minimum,
target, and stretch levels, and say plainly which one the company is tracking to.</li>
</ul>

<h2 class="sechead">What must be true by January</h2>

<p class="sec">These are the memo's minimum levels, not its targets. If the
company clears these, the application rests on observed traction rather than
projection. If it will not clear them, that is worth knowing in October, which is
what the Week 5 and Week 9 checkpoints are for.</p>

<ul class="pts">
<li>Multiple providers paying for successful hires, and several Client Growth
customers paying and receiving measurable value.</li>
<li>A repeatable provider claim and activation motion.</li>
<li>Several substantive interviews with true target institutional buyers.</li>
<li>The core CareNavigator execution product completed and testable.</li>
<li>Investors who understand the milestones and remain engaged.</li>
</ul>

<h2 class="sechead">Three things to confirm before approving</h2>

<ul class="pts">
<li><b>Owners are proposed, not agreed.</b> The named owner is the person
accountable for the week landing, not the only person working on it.</li>
<li><b>HLTH dates are unconfirmed.</b> Week 10 assumes the conference falls in
early November per the memo. Confirm and move the row if it does not.</li>
<li><b>Both provider products are scheduled in parallel.</b> The memo leaves open
whether Client Growth and Staffing both run or one leads. If one leads, Weeks 2
through 7 get materially easier and the January minimums get more likely.</li>
</ul>
"""

DOC = f"""<!doctype html><html><head><meta charset="utf-8">
<style>{CSS}</style></head><body>{BODY}</body></html>"""
out = 'plan_word.html' if WORD else 'plan.html'
open(out, 'w', encoding='utf-8').write(DOC)
print('wrote', out, '|', len(WEEKS), 'weeks')
