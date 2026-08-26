# -*- coding: utf-8 -*-
from tables import T1, T7 as _RISKS

T7_RISKS = _RISKS  # already captioned Table 7

# --------------------------------------------------------------- TABLE 2
# One table for both sides of the business, mapped to the path a family
# travels. Navigation and staffing alternatives appear together because the
# argument is that no single alternative covers the whole path.
T2 = """
<table class="matrix">
<colgroup><col style="width:30%"><col style="width:14%"><col style="width:14%"><col style="width:14%"><col style="width:14%"><col style="width:14%"></colgroup>
<thead><tr><th class="rowlab">Category of alternative</th>
<th>Find it</th><th>Afford it</th><th>Staff it</th><th>Establish care</th><th>Open to any family</th></tr></thead>
<tbody>
<tr><td class="rowlab own"><b>Olera</b><span class="eg">CareNavigator and Caregiver Staffing</span></td><td class="own"><span class="yes">&#10003;</span></td><td class="own"><span class="yes">&#10003;</span></td><td class="own"><span class="yes">&#10003;</span></td><td class="own"><span class="yes">&#10003;</span></td><td class="own"><span class="yes">&#10003;</span></td></tr>
<tr><td class="rowlab">Public information services<span class="eg">Eldercare Locator, BenefitsCheckUp</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td></tr>
<tr><td class="rowlab">General AI assistants<span class="eg">ChatGPT, Claude, Gemini</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td></tr>
<tr><td class="rowlab">Human navigators<span class="eg">social workers, case managers, discharge planners, private care managers</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td></tr>
<tr><td class="rowlab">Employer and health-plan navigation platforms<span class="eg">Wellthy, Grayce, Cariloop, Homethrive, ianacare</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td></tr>
<tr><td class="rowlab">Referral marketplaces<span class="eg">A Place for Mom, Caring.com</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td></tr>
<tr><td class="rowlab">Staffing agencies, job boards, gig platforms<span class="eg">local and franchise agencies, Indeed, shift marketplaces</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td></tr>
</tbody></table>
<p class="caption"><b>Table 2.</b> Coverage of the path to care, by category of alternative.</p>
<p class="tnote">The staffing channels in the last row supply workers already in direct care. None of them enlarges the workforce.</p>
"""

# --------------------------------------------------------------- TABLE 3
T3_CHANNELS = """
<table class="dat">
<colgroup><col style="width:11%"><col style="width:44%"><col style="width:45%"></colgroup>
<thead><tr><th>Side</th><th>Channels already producing for us</th><th>Channels added in Aim 2</th></tr></thead>
<tbody>
<tr><td><b>Families</b></td><td>Organic search and published guidance: about 15,500 visits a month, from nearly every county, at near-zero acquisition cost</td><td>Area agencies on aging, faith and community organizations, hospital discharge teams and clinical referral</td></tr>
<tr><td><b>Providers</b></td><td>Claimed listings on the free tools, more than 700 to date and about 150 more each month; direct outreach, more than 300 I-Corps discovery conversations</td><td>Provider associations and franchise networks</td></tr>
<tr><td><b>Caregivers</b></td><td>Campus advisors and pre-health student organizations: the student pilot drew more than 900 applicants and placed more than 20</td><td>Community colleges and workforce development boards, the primary non-student pool; career changers; referrals from placed workers</td></tr>
</tbody></table>
<p class="caption"><b>Table 3.</b> Acquisition channels activated in each pilot market, and what each has produced to date.</p>
<p class="tnote">Every channel runs under a budget, an attribution window, and a cost ceiling set in advance; channels that miss the ceiling are closed rather than carried.</p>
"""


def metrics(num, aim, rows, note=None):
    r = "".join(f'<tr><td>{a}</td><td class="n">{b}</td><td>{c}</td></tr>' for a, b, c in rows)
    n = f'<p class="tnote">{note}</p>' if note else ''
    return f"""
<p class="metrics-head">Metrics for Success and Quantitative Criteria (Aim {aim}):</p>
<table class="dat">
<colgroup><col style="width:43%"><col style="width:19%"><col style="width:38%"></colgroup>
<thead><tr><th>Measure</th><th class="n">Criterion</th><th>Source of the measurement</th></tr></thead>
<tbody>{r}</tbody></table>
<p class="caption"><b>Table {num}.</b> Aim {aim} quantitative success criteria.</p>{n}"""


T4 = metrics(4, 1, [
 ("Agreement with the blinded expert panel", "&#8805; 85%", "120 audited cases before the gate, Task 1.4"),
 ("Material errors against the expert gold standard", "&#8804; 10%", "Same audit"),
  ("Inter-rater reliability among panelists", "&#954; &#8805; 0.70", "Established before adjudication"),
 ("Execution loops complete end to end, aid and services", "Both paths", "Internal release testing"),
 
], note="Gate: the first two criteria must be met at month 12 before Aim 2 activates.")

T5 = metrics(5, 2, [
 ("Households reaching established aid or care", "Estimated, &#177;5 pts", "n = 400, confirmed start date, Task 2.3"),
  ("Task completion, with drop-off per step, two cycles running", "&#8805; 90% / &#8804; 10%", "Task 2.3 funnel instrumentation"),
 ("Usability, System Usability Scale", "&#8805; 72", "Task 2.4, IRB, n = 25 families"),
 ("Trust in automation", "&#8805; 5 of 7", "Task 2.4, IRB"),
 ("Placed workers with no prior direct-care employment", "Reported", "Ascertained at intake, Task 2.2"),
 ("Placed workers still in direct care at 90 days", "&#8805; 50%", "Employment and verified-record data"),
 ("Provider acceptability, appropriateness, feasibility", "&#8805; 4.0 of 5", "Task 2.4, IRB"),
 ("Cost to acquire and cost to serve", "Measured, both sides", "Task 2.5, activity-based costing"),
], note="Gate at month 21, before wave one opens: the execution loops complete for both aid and services, and worker retention meets its bar.")

T6 = metrics(6, 3, [
 ("Paid conversion within 60 days, by price arm", "&#177;10 pts per arm", "Task 3.2, ~320 offers, randomization inference"),
 ("Lifetime value against acquisition cost, 12 months", "&#8805; 3 : 1", "Task 3.3, restricted mean survival time"),
 ("Payback period on acquisition cost", "&lt; 12 months", "Task 3.3"),
 ("Per-market profitability after the cost of serving families", "Positive", "Task 3.3"),
  ("Retention at 3, 6, 9, and 12 months", "Reported by wave", "Discrete-time survival, competing events"),
 ("Independent validation delivered", "Delivered", "Task 3.3, ADC"),
 ("Institutional-buyer evidence package assembled", "Delivered", "Task 3.5"),
])
