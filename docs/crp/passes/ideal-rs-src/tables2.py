# -*- coding: utf-8 -*-
from tables import T1, T2 as T2_NAV, T7 as _T7_RISKS
# the risks table is the eighth in the re-based document
T8_RISKS = _T7_RISKS.replace('<b>Table 7.</b>', '<b>Table 8.</b>')

# Table 2 caption updated to name it as the navigation side
T2 = T2_NAV.replace('<b>Table 2.</b> Coverage of the path to care, by category of alternative.',
                    '<b>Table 2.</b> Coverage of the path to care: the alternatives families use.')

T3_STAFF = """
<table class="matrix">
<colgroup><col style="width:31%"><col style="width:17.25%"><col style="width:17.25%"><col style="width:17.25%"><col style="width:17.25%"></colgroup>
<thead><tr><th class="rowlab">What a provider needs from a hiring channel</th>
<th class="own">Olera Caregiver Staffing</th>
<th>Job boards<span class="eg">Indeed, MyCNAJobs</span></th>
<th>Staffing agencies<span class="eg">local and franchise</span></th>
<th>Gig platforms<span class="eg">shift marketplaces</span></th></tr></thead>
<tbody>
<tr><td class="rowlab">Delivers applicants at low cost</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td></tr>
<tr><td class="rowlab">Screens and verifies before the provider spends time</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td></tr>
<tr><td class="rowlab">Worker becomes the provider's own employee</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td></tr>
<tr><td class="rowlab">Adds workers who were not already in direct care</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td></tr>
</tbody></table>
<p class="caption"><b>Table 3.</b> Coverage of the hiring problem: the channels providers use today.</p>
"""

T4_MARKETS = """
<table class="dat">
<colgroup><col style="width:28%"><col style="width:47%"><col style="width:25%"></colgroup>
<thead><tr><th>Requirement</th><th>What it demands of the design</th><th>Markets implied</th></tr></thead>
<tbody>
<tr><td>Validate before spending</td><td>Real families, providers, and caregivers concentrated in one place, at no charge, so adoption is not confounded with price</td><td>2, run free in Aim 2</td></tr>
<tr><td>Separate the product from the market</td><td>One market cannot distinguish a product that works from a market that happens to work</td><td>2 rather than 1</td></tr>
<tr><td>Test the riskiest assumption while it is cheap</td><td>Whether new entrants can be recruited without a health-professions campus nearby</td><td>The 2 differ: campus-rich and campus-poor</td></tr>
<tr><td>Choose a price rather than guess one</td><td>Assignment at matched-market level because neighbors compare quotes; three price points to reveal shape, two markets per arm so an arm is not one market</td><td>6, paid, in Aim 3</td></tr>
<tr><td>Keep price unconfounded with market type</td><td>Within each arm, one campus-rich and one campus-poor market</td><td>3 arms crossed with 2 types</td></tr>
<tr><td>Show the playbook repeats</td><td>Two waves, the second run as written by staff who did not design it; wave one early enough to observe 12-month retention</td><td>Waves of 3 at months 21 and 30</td></tr>
<tr class="tot"><td>Derived design</td><td>Two free validation markets, then six paid markets in two waves</td><td>8 markets, about 6% of the budget</td></tr>
</tbody></table>
<p class="caption"><b>Table 4.</b> How the market design and its size are derived from what the aims require.</p>
"""

def metrics(num, aim, rows, note=None):
    r = "".join(f'<tr><td>{a}</td><td class="n">{b}</td><td>{c}</td></tr>' for a,b,c in rows)
    n = f'<p class="tnote">{note}</p>' if note else ''
    return f"""
<p class="metrics-head">Metrics for Success and Quantitative Criteria (Aim {aim}):</p>
<table class="dat">
<colgroup><col style="width:43%"><col style="width:19%"><col style="width:38%"></colgroup>
<thead><tr><th>Measure</th><th class="n">Criterion</th><th>Source of the measurement</th></tr></thead>
<tbody>{r}</tbody></table>
<p class="caption"><b>Table {num}.</b> Aim {aim} quantitative success criteria.</p>{n}"""

T5 = metrics(5, 1, [
 ("Agreement with the blinded expert panel","&#8805; 85%","Quarterly stratified audit, Task 1.4"),
 ("Material errors against the expert gold standard","&#8804; 10%","Same audit"),
 ("Inter-rater reliability among panelists","&#954; &#8805; 0.70","Established before adjudication"),
 ("Execution loops complete end to end, aid and services","Both paths","Internal release testing"),
 ("Scheduled follow-ups sent on their due date","&#8805; 95%","Platform telemetry"),
 ("Verified experience record populated for every placement","100%","Workforce system"),
], note="Gate: the first two criteria must be met at month 12 before Aim 2 activates.")

T6 = metrics(6, 2, [
 ("Households reaching established aid or care","Reported with 95% CI","Confirmed start date, Task 2.2"),
 ("Outcome ascertainment at the pre-specified window","&#8805; 80%","Task 2.2"),
 ("Usability, System Usability Scale","&#8805; 72","Task 2.3, IRB, n = 25"),
 ("Trust in automation","&#8805; 5 of 7","Task 2.3, IRB"),
 ("Placed workers with no prior direct-care employment","Reported","Ascertained at intake, Task 2.4"),
 ("Worker retention at 90 days","Reported by cohort","Employment and verified-record data"),
 ("Provider acceptability, appropriateness, feasibility","&#8805; 4.0 of 5","Task 2.5, IRB"),
 ("Cost to acquire and cost to serve","Measured, both sides","Task 2.6, time-driven activity-based costing"),
], note="Gate: care established and the staffing path completing end to end, at month 21, before wave one opens.")

T7 = metrics(7, 3, [
 ("Paid conversion within 60 days, by price arm","Estimated with 95% CI","Task 3.2, matched-market assignment"),
 ("Lifetime value against acquisition cost, 12 months","&#8805; 3 : 1","Task 3.3, restricted mean survival time"),
 ("Payback period on acquisition cost","&lt; 12 months","Task 3.3"),
 ("Per-market contribution margin after cost of serving families","Positive","Task 3.3"),
 ("Retention at 3, 6, and 12 months","Reported by wave","Discrete-time survival, competing events"),
 ("Cost per activation, wave two against wave one","Falling","Task 3.1"),
 ("Independent rebuild delivered, discrepancies reported","Delivered","Task 3.5"),
])
