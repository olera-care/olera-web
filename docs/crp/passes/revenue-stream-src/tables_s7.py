# -*- coding: utf-8 -*-
T6_INPUTS = """
<table class="dat">
<colgroup><col style="width:25%"><col style="width:28%"><col style="width:25%"><col style="width:22%"></colgroup>
<thead><tr><th>Model input</th><th>Base projection</th><th>Range or benchmark</th><th>Basis</th></tr></thead>
<tbody>
<tr><td><b>Staffing equation</b></td><td>counties &times; hires/mo &times; paid months &times; $/hire</td><td></td><td>Derived arithmetic</td></tr>
<tr><td><b>Successful hires per county per month</b></td><td>10</td><td>Expected mature range 10 to 30</td><td>Conservative Olera and CRP hypothesis</td></tr>
<tr><td><b>Price per successful hire</b></td><td>$250</td><td>$150 to $350 sensitivity</td><td>Aim 3 pricing hypothesis</td></tr>
<tr><td><b>Home-care turnover</b></td><td></td><td>About 75%</td><td>Published benchmark<sup>1,3</sup></td></tr>
<tr><td><b>Recruiting and training burden</b></td><td></td><td>Up to about $2,700 per replacement</td><td>Published benchmark<sup>2</sup></td></tr>
<tr><td><b>Institutional equation</b></td><td>active contracts &times; annual contract value</td><td></td><td>Derived arithmetic</td></tr>
<tr><td><b>First institutional revenue</b></td><td>Post-CRP Year 4</td><td></td><td>Planning assumption</td></tr>
<tr><td><b>Institutional relationships</b></td><td>About 3 by Year 5</td><td></td><td>Planning assumption</td></tr>
<tr><td><b>Annual value per relationship</b></td><td>About $250K</td><td>Negotiated after evidence</td><td>Planning hypothesis, not a benchmark</td></tr>
<tr><td><b>Institutional payment precedent</b></td><td></td><td>CMS GUIDE; Medicare ACO market</td><td>Published buyer and economic precedent<sup>4-6</sup></td></tr>
</tbody></table>
<p class="caption"><b>Table 6.</b> The projection separates published benchmarks from Olera planning assumptions and CRP hypotheses.</p>
"""

T7_FIVEYEAR = """
<table class="dat keep">
<colgroup><col style="width:28%"><col style="width:14.4%"><col style="width:14.4%"><col style="width:14.4%"><col style="width:14.4%"><col style="width:14.4%"></colgroup>
<thead><tr><th></th><th class="n">CRP Y1</th><th class="n">CRP Y2</th><th class="n">CRP Y3</th><th class="n">Post-CRP Y4</th><th class="n">Post-CRP Y5</th></tr></thead>
<tbody>
<tr><td><b>Commercial stage</b></td><td class="n">Build</td><td class="n">Validate free</td><td class="n">Monetize</td><td class="n">Expand</td><td class="n">Scale</td></tr>
<tr><td><b>Staffing markets</b></td><td class="n">0</td><td class="n">~8 free</td><td class="n">~8 paid</td><td class="n">~15</td><td class="n">~25</td></tr>
<tr><td><b>Staffing revenue</b></td><td class="n">$0</td><td class="n">$0</td><td class="n">~$120K*</td><td class="n">~$450K</td><td class="n">~$750K</td></tr>
<tr><td><b>Institutional relationships</b></td><td class="n">0</td><td class="n">0</td><td class="n">0</td><td class="n">~1</td><td class="n">~3</td></tr>
<tr><td><b>Institutional revenue</b></td><td class="n">$0</td><td class="n">$0</td><td class="n">$0</td><td class="n">~$150K</td><td class="n">~$750K</td></tr>
<tr class="tot"><td><b>Total commercial revenue</b></td><td class="n">$0</td><td class="n">$0</td><td class="n">~$120K</td><td class="n">~$600K</td><td class="n">~$1.50M</td></tr>
</tbody></table>
<p class="caption"><b>Table 7.</b> Illustrative base case. *Year 3 assumes approximately six paid-month equivalents across the eight CRP markets; the resulting exit Staffing run rate is approximately $240K a year at the same conservative throughput.</p>
"""
