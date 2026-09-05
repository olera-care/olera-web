# -*- coding: utf-8 -*-
import pymupdf, base64
d = pymupdf.open('rs.pdf')
pages = []
for i, p in enumerate(d):
    b64 = base64.b64encode(p.get_pixmap(dpi=150).tobytes('png')).decode()
    lab = "Bibliography (separate attachment)" if i == d.page_count-1 else f"Research Strategy, page {i+1} of {d.page_count-1}"
    pages.append(f'<figure class="pg"><img src="data:image/png;base64,{b64}" alt="{lab}" loading="lazy"><figcaption>{lab}</figcaption></figure>')

HEAD = """<title>The Three-Stage Research Strategy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..700&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
:root{--ground:#e9ece8;--panel:#f7f8f6;--ink:#141a16;--ink2:#415047;--muted:#69776e;
      --rule:#d3dad4;--pine:#14653f;--clay:#9c3b30;--gold:#8a6a1f;
      --pine-s:#e3efe8;--clay-s:#f8ece9;--gold-s:#f6efdd;--shadow:rgba(20,30,24,.16)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#0f1311;--panel:#171d19;--ink:#e6eae6;--ink2:#bdc7c0;--muted:#93a099;
  --rule:#2a332d;--pine:#6cc294;--clay:#e0917f;--gold:#d6b25f;
  --pine-s:#15241c;--clay-s:#2a1a17;--gold-s:#292314;--shadow:rgba(0,0,0,.5)}}
:root[data-theme="dark"]{--ground:#0f1311;--panel:#171d19;--ink:#e6eae6;--ink2:#bdc7c0;
  --muted:#93a099;--rule:#2a332d;--pine:#6cc294;--clay:#e0917f;--gold:#d6b25f;
  --pine-s:#15241c;--clay-s:#2a1a17;--gold-s:#292314;--shadow:rgba(0,0,0,.5)}
*{box-sizing:border-box}
body{background:var(--ground);color:var(--ink);margin:0;padding:0 18px 90px;
     font-family:"Newsreader",Georgia,serif;font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased}
.col{max-width:660px;margin:0 auto}
.wide{max-width:1000px;margin:0 auto}
p{margin:0 0 1em;text-wrap:pretty}
h1,h2,h3{text-wrap:balance;margin:0;font-weight:600;line-height:1.16}
header{padding:70px 0 30px;border-bottom:2px solid var(--ink);margin-bottom:34px}
.eyebrow{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:11px;letter-spacing:.16em;
         text-transform:uppercase;color:var(--muted);font-weight:600;margin-bottom:18px}
h1{font-size:clamp(34px,5.6vw,54px);letter-spacing:-.022em;line-height:1.04;margin-bottom:16px}
.sub{font-size:20px;color:var(--ink2);line-height:1.5}
.meta{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:12.5px;color:var(--muted);
      margin-top:22px;line-height:1.7}
h2{font-size:28px;letter-spacing:-.016em;margin:0 0 12px}
h3{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:12.5px;letter-spacing:.09em;
   text-transform:uppercase;color:var(--muted);font-weight:600;margin:26px 0 9px}
.part{margin:56px 0 0;padding-top:24px;border-top:1px solid var(--rule)}
.small{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:14px;line-height:1.6;color:var(--ink2)}
.card{background:var(--panel);border:1px solid var(--rule);border-radius:5px;padding:18px 20px;margin:22px 0}
.card.warn{border-left:3px solid var(--clay);background:var(--clay-s)}
.card.good{border-left:3px solid var(--pine);background:var(--pine-s)}
.card p:last-child{margin-bottom:0}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin:24px 0 6px}
.stat{background:var(--panel);border:1px solid var(--rule);border-radius:5px;padding:13px 15px}
.stat b{display:block;font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:25px;
        font-weight:600;color:var(--pine);line-height:1.1;font-variant-numeric:tabular-nums}
.stat span{display:block;font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:11.5px;
           color:var(--muted);margin-top:5px;line-height:1.35}
figure.pg{margin:0 0 26px;background:#fff;border-radius:3px;box-shadow:0 3px 18px var(--shadow);overflow:hidden}
figure.pg img{display:block;width:100%;height:auto}
figure.pg figcaption{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:11px;
  letter-spacing:.05em;text-transform:uppercase;color:#7b8880;background:#fbfbfa;
  border-top:1px solid #e6e9e5;padding:7px 12px}
.docwrap{margin:30px auto 0;max-width:920px}
table{border-collapse:collapse;width:100%;font-family:"IBM Plex Sans",system-ui,sans-serif;
      font-size:13.5px;line-height:1.45;margin:18px 0}
th{text-align:left;font-weight:600;border-bottom:1.5px solid var(--ink);padding:8px 12px 8px 0;vertical-align:bottom}
td{padding:9px 12px 9px 0;border-bottom:1px solid var(--rule);vertical-align:top;color:var(--ink2)}
td:first-child{color:var(--ink);font-weight:500}
.tbl{overflow-x:auto;max-width:1000px;margin:0 auto}
.tag{font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:10.5px;font-weight:600;
     letter-spacing:.06em;text-transform:uppercase;padding:2px 6px;border-radius:3px;white-space:nowrap}
.t-a{background:var(--gold-s);color:var(--gold)}
.t-s{background:var(--clay-s);color:var(--clay)}
ul{margin:0 0 1em;padding-left:1.15em}li{margin-bottom:.4em}li::marker{color:var(--muted)}
:focus-visible{outline:2px solid var(--pine);outline-offset:3px}
@media(max-width:700px){body{font-size:16.5px;padding:0 12px 60px}header{padding-top:44px}}
</style>"""

BODY_TOP = """
<header class="col">
  <div class="eyebrow">Re-based on the 2026-08-26 TJ session &nbsp;·&nbsp; Submission-format draft</div>
  <h1>The Three-Stage Research Strategy</h1>
  <p class="sub">Build, then validate free, then commercialize paid. The Approach rebuilt on the architecture you and TJ settled, typeset in house style and rendered as it would reach a reviewer.</p>
  <div class="meta">
    NIA SBIR Commercialization Readiness Pilot &nbsp;·&nbsp; $4,000,000 &nbsp;·&nbsp; June 1, 2027 to May 31, 2030<br>
    Letter portrait &nbsp;·&nbsp; Arial 11pt &nbsp;·&nbsp; 0.5in margins &nbsp;·&nbsp; justified &nbsp;·&nbsp; superscript citations<br>
    Built 2026-08-26
  </div>
</header>

<div class="col">
<div class="stats">
  <div class="stat"><b>12</b><span>pages of Research Strategy, against a 12-page ceiling</span></div>
  <div class="stat"><b>5</b><span>figures, sized by load</span></div>
  <div class="stat"><b>8</b><span>tables</span></div>
  <div class="stat"><b>8</b><span>markets: 2 free, then 6 paid</span></div>
</div>

<h3>What this is</h3>
<p class="small">A real submission draft. Structure and typography are measured from the Phase IIB application: bold run-in headings, per-aim task numbering, italic-underlined metrics heads, figures at 2.0 to 7.0 inches rather than uniformly full width, and the bibliography as a separate attachment outside the page limit. <b>Aim 1 is deliberately a gated skeleton</b>, four task titles and a gate, so TJ has a frame to fill without colliding with this pass.</p>

<div class="card warn">
<p class="small" style="margin-bottom:0"><b>Read the assumption register before you judge it.</b> This document assumes a handful of things that do not exist yet, chiefly provider letters with a price and a quantity. They are listed in full after the pages.</p>
</div>


<div class="docwrap">
"""

BODY_BOT = """
</div>

<div class="part col">
<h2>What changed, and why</h2>

<h3>The Approach is rebuilt, not patched</h3>
<p class="small">Aim 1 builds in Year 1. Aim 2 validates both products in two markets at no charge. Aim 3 charges for staffing in six new markets. TJ's objection was the one that mattered: an aim is not a company activity, and the old Aim 2 read as a process inventory. Each aim now opens with a question that can come back no. The old parallel structure also made Aim 3 depend on two aims succeeding at once; the sequence contains failure instead of propagating it.</p>

<h3>Eight markets, derived from the new sequence</h3>
<p class="small">Two in Aim 2, differing on campus-rich versus campus-poor, because whether new entrants can be recruited without a health-professions campus nearby is the riskiest assumption in the application and Aim 2 exists to find problems while they are free. Six in Aim 3, as three price arms crossed with two market types, in two waves. Price is assigned at matched-market level, not account level, because neighboring providers compare quotes. That is the old Google Doc's method and it is better than the one I used last time. Market entry is about six percent of the budget.</p>

<h3>What I harvested rather than rewrote</h3>
<p class="small">The Google Doc's Approach was methodologically stronger than mine, and the difference was not padding. Carried over intact and rehoused: the blinded expert panel with Cohen's kappa and held-out audit households; the family study's UXEIE framework, System Usability Scale, and 12-item trust scale; the implementation measures and the two-consecutive-batches saturation rule; Van Westendorp seeding; generalized estimating equations with market as the cluster; discrete-time survival with competing events and restricted mean survival time feeding lifetime value; and time-driven activity-based costing.</p>

<h3>The payer story left the aims entirely</h3>
<p class="small">No endpoints, no tasks, no milestones. It appears twice: one clause in Significance saying none of it is tested here, and the contingency paragraph closing Aim 3, which names the four adjacent lines including Managed Ads as an emerging product. Everything else is Commercialization Plan.</p>

<h3>Five surgical edits to Significance</h3>
<p class="small">TJ's aid-versus-services gap is closed, so execution now covers securing a service and not only filing a benefit. Staffing competitors get their own compact matrix, Table 3, since the navigation matrix could not carry both. The two-product sentence appears verbatim. The hurdles now point at the new aims. And the emerging-payer paragraph says plainly that nothing there is tested.</p>
</div>

<div class="part">
<div class="col"><h2>Assumption register</h2>
<p class="small">Everything the draft borrows against reality. Nothing here requires a completed study, a signed contract, a partnership that does not exist, or an outcome we have not observed.</p></div>
<div class="tbl">
<table>
<thead><tr><th style="width:30%">Assumption</th><th style="width:12%">Difficulty</th><th style="width:16%">Where it appears</th><th style="width:42%">If it does not land</th></tr></thead>
<tbody>
<tr><td>Two to four provider letters with a defined price and quantity <span class="tag t-a">Assumed</span></td><td>Moderate</td><td>Not cited in the RS; carries the Commercialization Plan and the Significance market-pull claim</td><td><b>The most damaging loss.</b> Significance falls back from demonstrated pull to understood need</td></tr>
<tr><td>Investor letter engaging the $4M test <span class="tag t-a">Assumed</span></td><td>Moderate</td><td>Commercialization Plan</td><td>The Valley of Death argument loses its cleanest proof</td></tr>
<tr><td>Phase IIB study section called commercial potential "extremely high" <span class="tag t-a">Assumed</span></td><td>Low</td><td>Page 10, Progress Report</td><td>We lose a sentence written by NIH's own reviewers. Needs the summary statement to quote exactly</td></tr>
<tr><td>$80,080 annual home care cost <span class="tag t-a">Assumed</span></td><td>Low</td><td>Page 1, reference 2</td><td>Reference 2 is flagged unverified in the bibliography on purpose. Source before submission</td></tr>
<tr><td>Billable rate and gross margin behind the ROI revenue arm <span class="tag t-a">Assumed</span></td><td>Low</td><td>Page 3 narrative</td><td>Table 1's cost-substitution arm uses only published inputs and stands alone</td></tr>
<tr><td>Consolidated pilot invoice record <span class="tag t-a">Assumed</span></td><td>Low, still outstanding</td><td>Page 11, Table 7 workforce row</td><td>The strongest row of the Progress Report becomes an assertion</td></tr>
<tr><td>Claimed-provider count above 700 <span class="tag t-a">Assumed</span></td><td>Low</td><td>Page 11, Table 7 supply row</td><td>We cite a figure dated 2026-08-05 in a September submission</td></tr>
<tr><td>Detailed budget, staffing, and PMP for ten markets <span class="tag t-a">Assumed</span></td><td>Moderate, pure execution</td><td>Referenced from the Approach; lives in the Commercialization Plan</td><td>The scope-versus-team attack lands unanswered</td></tr>
<tr><td>Marcia Ory and David Qu advisory letters <span class="tag t-a">Assumed</span></td><td>Low</td><td>Page 11, team paragraph</td><td>Investigator and Environment lose independent corroboration</td></tr>
<tr><td>University partner letter on student pipeline access <span class="tag t-a">Assumed</span></td><td>Low to moderate</td><td>Aim 2 feasibility</td><td>Aim 2 rests on our own assertion</td></tr>
<tr><td>GUIDE participant or payer letter of interest <span class="tag t-s">Stretch</span></td><td>High</td><td>Page 3, emerging customers</td><td>Payers stay a horizon rather than a named near-term customer. Everything else survives</td></tr>
</tbody>
</table>
</div>
</div>

<div class="part col">
<h2>Where the remaining risk sits</h2>
<div class="card good">
<p class="small" style="margin-bottom:.7em"><b>1. The document is at 12 of 12 pages.</b> There is no headroom, and TJ still has to expand Innovation and fill in Aim 1, which is currently 380 words. Roughly 400 words need to come out to make room. The places I would take them from, in order: the market-architecture prose, which Table 4 already carries; Aim 3 Task 3.3, which is dense; and the Progress Report's team paragraph.</p>
<p class="small" style="margin-bottom:.7em"><b>2. Front-loaded build risk.</b> A commercialization reviewer may ask why a CRP funds a year of engineering. Aim 1 is framed as completing commercially required capability with a hard month-12 gate, which is the best available answer, but the question will still be asked.</p>
<p class="small" style="margin-bottom:0"><b>3. The proportionality argument is still not made outright.</b> Eight markets and under $1M of run-rate revenue against $4M invites the scope question. The answer is that the markets are an instrument and the deliverable is a transferable model, and it belongs in the Approach's closing paragraph rather than being left for the reader to infer.</p>
</div>
<p class="small">Aim 1 belongs to TJ, along with Innovation. The Specific Aims page is a compression of this document and should be written after it. The Commercialization Plan is where the four emerging revenue lines get modeled.</p>
</div>
"""

open('artifact.html','w').write(HEAD + BODY_TOP + "\n".join(pages) + BODY_BOT)
import os; print('artifact bytes', round(os.path.getsize('artifact.html')/1e6,2),'MB')
