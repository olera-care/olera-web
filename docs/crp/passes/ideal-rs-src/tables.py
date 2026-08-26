# -*- coding: utf-8 -*-
T1 = """
<table class="dat">
<colgroup><col style="width:19%"><col style="width:15%"><col style="width:17%"><col style="width:15%"><col style="width:17%"><col style="width:17%"></colgroup>
<thead><tr><th>Agency size</th><th class="n">Hires per year at<br>75% turnover</th>
<th class="n">Current cost at the<br>$520 median</th><th class="n">Olera at $275/mo,<br>unlimited hiring</th>
<th class="n">Effective cost<br>per hire</th><th class="n">Annual saving</th></tr></thead>
<tbody>
<tr><td>15 caregivers</td><td class="n">11</td><td class="n">$5,850</td><td class="n">$3,300</td><td class="n">$293</td><td class="n">$2,550</td></tr>
<tr><td>30 caregivers</td><td class="n">23</td><td class="n">$11,700</td><td class="n">$3,300</td><td class="n">$147</td><td class="n">$8,400</td></tr>
<tr><td>50 caregivers</td><td class="n">38</td><td class="n">$19,500</td><td class="n">$3,300</td><td class="n">$88</td><td class="n">$16,200</td></tr>
<tr><td>100 caregivers</td><td class="n">75</td><td class="n">$39,000</td><td class="n">$3,300</td><td class="n">$44</td><td class="n">$35,700</td></tr>
</tbody></table>
<p class="caption"><b>Table 1.</b> What a provider pays today to hire a caregiver, and what Olera charges instead.</p>
"""

T2 = """
<table class="matrix">
<colgroup><col style="width:26%"><col style="width:14.8%"><col style="width:14.8%"><col style="width:14.8%"><col style="width:14.8%"><col style="width:14.8%"></colgroup>
<thead><tr><th class="rowlab">Stage of the path to care</th>
<th class="own">CareNavigator<span class="eg">navigation and new workforce</span></th>
<th>Public information<span class="eg">Eldercare Locator, BenefitsCheckUp</span></th>
<th>General AI assistants<span class="eg">ChatGPT, Claude, Gemini</span></th>
<th>Human navigators<span class="eg">social workers, discharge planners</span></th>
<th>Referral marketplaces<span class="eg">A Place for Mom, Caring.com</span></th></tr></thead>
<tbody>
<tr><td class="rowlab">Assesses needs</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td></tr>
<tr><td class="rowlab">Identifies aid and insurance</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td></tr>
<tr><td class="rowlab">Matches local providers</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td><td><span class="yes">&#10003;</span></td></tr>
<tr><td class="rowlab">Carries the case to established care</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td></tr>
<tr><td class="rowlab">Adds the caregivers to staff it</td><td class="own"><span class="yes">&#10003;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td><td><span class="no">&#10007;</span></td></tr>
</tbody></table>
<p class="caption"><b>Table 2.</b> Coverage of the path to care, by category of alternative.</p>
"""

T3 = """
<table class="dat">
<colgroup><col style="width:29%"><col style="width:46%"><col style="width:25%"></colgroup>
<thead><tr><th>Requirement</th><th>What it demands of the design</th><th>Markets implied</th></tr></thead>
<tbody>
<tr><td>Price is chosen, not guessed</td><td>About 180 accounts offered a price across three adaptive arms under a pre-registered decision rule</td><td>4 to 6 at realistic provider density</td></tr>
<tr><td>Unit economics measured, not modeled</td><td>Enough paying accounts to estimate acquisition cost, lifetime value, churn, and margin from live billing</td><td>4 to 6</td></tr>
<tr><td>The playbook replicates</td><td>Two-by-two design on workforce source and provider density, two markets per cell so within-cell variation is separable from market identity</td><td>8 replication markets</td></tr>
<tr><td>Depth, instrumentation, and the IRB studies</td><td>Markets with existing traffic and provider base, opened first and deeply instrumented</td><td>2 anchor markets</td></tr>
<tr><td>Payer evidence</td><td>Episode density inside a single payer footprint rather than spread across unrelated regions</td><td>Composition, not count: 6 of 10 in two clusters of 3</td></tr>
<tr><td>Operational feasibility and cost</td><td>Staged entry a distributed team can run, at about $30,000 per market to enter</td><td>2 in Year 1, 4 in Year 2, 4 in Year 3</td></tr>
<tr class="tot"><td>Derived design</td><td>Two anchor markets plus eight replication markets, staged two, four, and four</td><td>10 markets</td></tr>
</tbody></table>
<p class="caption"><b>Table 3.</b> How the market design and its size are derived from what the aims require.</p>
"""

def metrics(num, aim, rows, note=None):
    r = "".join(f'<tr><td>{a}</td><td class="n">{b}</td><td>{c}</td></tr>' for a,b,c in rows)
    n = f'<p class="tnote">{note}</p>' if note else ''
    return f"""
<p class="metrics-head">Metrics for Success and Quantitative Criteria (Aim {aim}):</p>
<table class="dat">
<colgroup><col style="width:44%"><col style="width:18%"><col style="width:38%"></colgroup>
<thead><tr><th>Measure</th><th class="n">Criterion</th><th>Source of the measurement</th></tr></thead>
<tbody>{r}</tbody></table>
<p class="caption"><b>Table {num}.</b> Aim {aim} quantitative success criteria.</p>{n}"""

T4 = metrics(4, 1, [
 ("Agreement with the blinded expert panel","&#8805; 85%","Quarterly stratified case adjudication"),
 ("Material errors against the expert gold standard","&#8804; 10%","Same adjudication"),
 ("Scheduled follow-ups sent on their due date","&#8805; 95%","Platform telemetry"),
 ("Usability, System Usability Scale","&#8805; 72","Task 1.3, IRB study, n = 25"),
 ("Trust in automation","&#8805; 5 of 7","Task 1.3, IRB study"),
 ("Outcome ascertainment at the pre-specified window","&#8805; 80%","Confirmed care start date"),
 ("Cost per established case","Falling","Live staff, compute, and support records"),
])

T5 = metrics(5, 2, [
 ("Placed workers with no prior direct-care employment","Reported","Ascertained at intake, before placement"),
 ("Accounts reaching a first verified paid shift","&#8805; 70%","Timestamped placement records"),
 ("Provider acceptability, appropriateness, feasibility","&#8805; 4.0 of 5","Task 2.3, IRB study"),
 ("Providers with repeat shift use at 60 days","&#8805; 50%","Placement records"),
 ("Worker retention at 90 days and at 12 months","Reported by cohort","Employment and verified-record data"),
 ("Second-pool feasibility: cost per hire and retention","Comparable","Task 2.5, two campus-poor markets, versus the student cohort"),
], note="Providers pay Olera nothing for staffing in Aim 2. Paid conversion is tested in Aim 3.")

T6 = metrics(6, 3, [
 ("Paid conversion within 60 days, by offered price","Estimated to &#177; 12 pts","Randomized offers under real billing"),
 ("Cost to serve one paying account","Measured","Billing, support, and payroll records"),
 ("Lifetime value against acquisition cost, 12 months","&#8805; 3 : 1","Independent rebuild, Task 3.4"),
 ("Payback period on acquisition cost","&lt; 12 months","Same"),
 ("Per-market contribution margin after cost of serving families","Positive","Same"),
 ("Executed data-use agreements with risk-bearing organizations","&#8805; 2","Task 3.5"),
 ("Claims linkage at the pre-specified match rate","Demonstrated","Task 3.5"),
])

T7 = """
<table class="dat">
<colgroup><col style="width:17%"><col style="width:19%"><col style="width:64%"></colgroup>
<thead><tr><th>Risk</th><th>Retired by</th><th>Evidence</th></tr></thead>
<tbody>
<tr><td><b>Technical</b><br>Could the data be assembled?</td><td>NIA Phase I to IIB</td><td>An expert-curated national database of more than 72,000 aid programs and providers across all fifty states, and a multi-agent eldercare AI now entering production integration.</td></tr>
<tr><td><b>User</b><br>Would families accept it?</td><td>NIA Phase I to IIB</td><td>Four peer-reviewed evaluations with family caregivers: usability 4.57 of 5; acceptance 5.83 of 7 after four weeks of use (n = 65); multi-agent version 5.73 of 7 (n = 31, in preparation).</td></tr>
<tr><td><b>Demand</b><br>Would families come, and at what cost?</td><td>Beyond Phase II scope; company funds</td><td>Organic traffic grew from roughly 50 visits a day in 2023 to more than 500 today, about 15,500 a month, from nearly every county in the country at near-zero acquisition cost.</td></tr>
<tr><td><b>Supply</b><br>Would providers participate?</td><td>I-Corps and company funds</td><td>More than 300 customer-discovery conversations with owners and operators through NIH and NSF I-Corps. More than 700 providers have since claimed a listing at no charge, roughly 150 more each month.</td></tr>
<tr><td><b>Workforce and willingness to pay</b><br>Could we recruit caregivers, and would anyone pay?</td><td>Beyond Phase II scope; company funds</td><td>A student caregiver pilot drew more than 900 applicants and placed more than 20 into provider jobs. Four providers trialed the staffing product and three paid, at roughly $50 to $275 per placement and $275 per month, across multiple semesters. Delivery was manual, which capped scale; Aim 1 removes the cap.</td></tr>
<tr class="rem"><td><b>The risk that remains</b><br>Can one local market pay for itself, and can we repeat it?</td><td>Not yet retired</td><td>Measurable only with real customers paying real prices over long enough to observe churn. This is the uncertainty the three aims remove.</td></tr>
</tbody></table>
<p class="caption"><b>Table 7.</b> Commercialization risks retired to date, the funding that retired each, and the risk that remains.</p>
"""
