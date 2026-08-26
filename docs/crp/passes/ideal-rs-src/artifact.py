# -*- coding: utf-8 -*-
import pymupdf, base64
d = pymupdf.open('rs.pdf')
pages = []
for i, p in enumerate(d):
    b64 = base64.b64encode(p.get_pixmap(dpi=150).tobytes('png')).decode()
    lab = "Bibliography (separate attachment)" if i == d.page_count-1 else f"Research Strategy, page {i+1} of {d.page_count-1}"
    pages.append(f'<figure class="pg"><img src="data:image/png;base64,{b64}" alt="{lab}" loading="lazy"><figcaption>{lab}</figcaption></figure>')

HEAD = """<title>The Ten-Market Research Strategy</title>
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
  <div class="eyebrow">Ideal-version exercise &nbsp;·&nbsp; Submission-format draft</div>
  <h1>The Ten-Market Research Strategy</h1>
  <p class="sub">The strongest Research Strategy Olera could realistically submit on September 4, typeset in house style and rendered as it would reach a reviewer.</p>
  <div class="meta">
    NIA SBIR Commercialization Readiness Pilot &nbsp;·&nbsp; $4,000,000 &nbsp;·&nbsp; June 1, 2027 to May 31, 2030<br>
    Letter portrait &nbsp;·&nbsp; Arial 11pt &nbsp;·&nbsp; 0.5in margins &nbsp;·&nbsp; justified &nbsp;·&nbsp; superscript citations<br>
    Built 2026-08-26
  </div>
</header>

<div class="col">
<div class="stats">
  <div class="stat"><b>11</b><span>pages of Research Strategy, against a 12-page ceiling</span></div>
  <div class="stat"><b>5</b><span>figures, sized by load</span></div>
  <div class="stat"><b>7</b><span>tables</span></div>
  <div class="stat"><b>29</b><span>numbered references</span></div>
</div>

<h3>What this is</h3>
<p class="small">A real submission draft, not a mock-up. Structure and typography are measured from the Phase IIB application: bold run-in headings, per-aim task numbering, italic-underlined metrics heads, figures at 2.6 to 6.7 inches rather than uniformly full width, and the bibliography as a separate attachment outside the page limit. Every claim is either verified in our records today or drawn from the small set of assumptions listed at the end.</p>

<div class="card warn">
<p class="small" style="margin-bottom:0"><b>Read the assumption register before you judge it.</b> This document assumes a handful of things that do not exist yet, chiefly provider letters with a price and a quantity. They are listed in full after the pages. A typeset document is more persuasive than the same argument in a plan, and some of what you feel reading this will be the typesetting.</p>
</div>
</div>

<div class="docwrap">
"""

BODY_BOT = """
</div>

<div class="part col">
<h2>What changed while building it</h2>

<h3>The market count fell out at ten</h3>
<p class="small">The derivation is Table 3 on page 6. Two corrections drove it. The old requirement of 300 <i>paying</i> accounts confused offers with conversions; a price experiment randomizes accounts offered a price, so at 35 percent conversion the requirement was roughly threefold too high. And the old eight-cell heterogeneity grid gave one market per cell, which cannot separate a market effect from noise. Two axes with two markets per cell is a stronger design at a lower count. Ten is two anchors plus eight replication markets, staged two, four, four, with six sitting in two payer clusters.</p>

<h3>Market entry is under eight percent of the budget</h3>
<p class="small">At about $30,000 per market, ten markets cost roughly $300,000. That reframes the case for $4 million: the money is the build, the studies, and the team, not the map. The Approach says so explicitly, because the alternative is a reviewer doing that arithmetic and concluding we padded the market count to justify the ask.</p>

<h3>Three things went in that were not in the plan</h3>
<ul class="small">
<li><b>A stated stop rule</b> at the end of Aim 3. If, at month 24, fewer than 40 percent of placed workers remain in direct care at 90 days and paid conversion is below 20 percent at every price, we report the model disconfirmed, halt expansion, and publish it.</li>
<li><b>Retention named as the thesis-killer</b> in Aim 2, with two pre-specified responses rather than reassurance.</li>
<li><b>A team and execution paragraph</b> in the Progress Report. Investigator and Environment are our two weakest criteria and the Research Strategy said nothing about either.</li>
</ul>

<h3>Where the award ends, stated on the page</h3>
<p class="small">The Approach names the six things a risk-bearing payer requires, delivers five, and refuses the sixth in the document's own words: we will not claim this award proves reduced hospitalization, because the design does not establish it. The refusal is what makes the other five credible.</p>
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
<h2>What I would fix next</h2>
<div class="card good">
<p class="small" style="margin-bottom:.7em"><b>1. The harshest critic's objection still has no rebuttal on the page.</b> A reviewer will say that ten counties and under $1 million of run-rate revenue is not "sustained, powerful influence on the relevant market offering." The counter is that the markets are an instrument and the deliverable is a transferable model plus the payer package. The Approach's closing paragraph gestures at it. It should say it outright.</p>
<p class="small" style="margin-bottom:.7em"><b>2. Innovation runs light at about 1.3 pages.</b> There is roughly a page of unspent budget. The best use is a fourth paragraph on why the three innovations compound rather than merely coexist, which is currently implied and never argued.</p>
<p class="small" style="margin-bottom:0"><b>3. Reference 2 is deliberately marked unverified</b> in the bibliography so the draft cannot be mistaken for finished. Three of TJ's opening statistics need sourcing into <code>references.yaml</code> before any of this is real.</p>
</div>
<p class="small">The Specific Aims page and the Commercialization Plan are unbuilt. The Aims page is a compression of this document and should be written after it, not before.</p>
</div>
"""

open('artifact.html','w').write(HEAD + BODY_TOP + "\n".join(pages) + BODY_BOT)
import os; print('artifact bytes', round(os.path.getsize('artifact.html')/1e6,2),'MB')
