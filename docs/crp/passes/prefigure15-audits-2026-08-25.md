# Two audits before Figure 15: backward consistency and visual architecture

Status: audit record for Logan's 2026-08-25 approval gate. Decisions ratified in that
message (broadened Innovation 2 with the Caregiver Passport, Year 3 second-pool pilot,
12 markets as 4 anchors + 8 replication with 6 in two payer clusters, staffing-only
beachhead, two pricing hypotheses, determinations obtained not assumed) are treated as
settled. No figures drawn.

## Audit 1: backward consistency of Figures 1 to 14

Full text of all fourteen figures was extracted and read against the approved
decisions. Nine changes across five figures. Everything else holds.

### Must change (5)

| # | Figure | Current | Proposed | Reason |
|---|---|---|---|---|
| 1 | 7, beachhead economics | "~$500 per hire, or ~$100/month" / "~25 providers, ~$30K/year" | "~$275/month or ~$150 per hire, to be tested" / "~25 providers, ~$80K/year at the subscription price" | Approved decision 5 replaces a locked price with the two pilot-derived hypotheses. The $100 figure was mine, anchored to the wrong CP section. $275 x 25 x 12 gives about $80K. |
| 2 | 7, total row | "Illustrative total, one mid-sized county at maturity: ~$170K per year" | "Illustrative total, one mid-sized county at maturity, beyond the award: ~$220K per year" | Two problems. The total must follow the corrected beachhead. And a reviewer can currently read the emerging rows as award-period revenue, which contradicts staffing-only. "Beyond the award" closes that in three words. |
| 3 | 6, second customer block | "Insurance and healthcare organizations" | "Organizations that bear the cost" | Long-standing flag now forced by the approved customer map: Figure 7's emerging rows include self-insured employers, public aging agencies, and now LTC insurers, which are neither insurance nor healthcare organizations. The proposed label matches Figure 4's band and covers every row. |
| 4 | 11, Key Innovation 2 line | "Capacity created rather than moved: new workers enter eldercare through a pathway their careers already require." | "Capacity created rather than moved: new people enter eldercare, and a verified record makes them employable." | This is the sentence that defines the innovation. The current one defines it as the student mechanism, which is now the beachhead population rather than the innovation. The replacement names the infrastructure, which is what makes the innovation extensible and hard to copy. |
| 5 | 13, whole figure | Students box, licensed provider, workforce pool | Two surgical additions: a verified-record element between provider and workforce, and a dashed line under the students box reading "First population tested. Career changers and retirees follow the same pathway." | Figure 13 currently *is* the student staffing model. Adding the record makes the mechanism visible; the dashed note (house grammar for emerging) makes extensibility explicit without redesigning the figure or demoting students. |

### Minor alignment (4)

| # | Figure | Current | Proposed | Reason |
|---|---|---|---|---|
| 6 | 10, workforce column | "Student caregivers must be safe" | "New caregivers must be safe" | The hurdle and its response (licensed providers hire, train, insure, supervise) are population-agnostic and must stay true when the second pool arrives in Year 3. |
| 7 | 4, closing band | "...will pay for it." | "...have reason to pay for it." | Approved architecture tests provider willingness to pay and only *evidences* the rest. "Will pay" predicts what we are not testing; "have reason to pay" is the claim we can defend. |
| 8 | 6, emerging band tag | "AS OUTCOMES ARE PROVEN" | "AS OUTCOMES ARE DEMONSTRATED" | Figure 7's band already says "demonstrated." Two words for one concept across adjacent figures, and "proven" is a higher bar than anything the CRP will clear. |
| 9 | 5, workforce bullet 2 | "New cohorts arrive every season, so the pipeline refills" | Optional: "The pipeline refills as new people keep entering the field" | "Season" is the academic calendar, which is the student channel. Low priority: Figure 5 describes the beachhead, where seasonality is literally true. Recommend leaving unless Logan wants full population-neutrality in the front half. |

### Leave alone, with reasons

- **Multiple provider products: nothing to fix.** Figures 5, 6, and 7 already show one
  sold product. The figure set was ahead of the Research Strategy on this.
- **Market count: nothing to fix.** No figure states a number, so the 4 + 8 + 2-cluster
  structure introduces no conflict.
- **Innovation numbering: correct everywhere.** Figures 5, 9, 11, 12, 13, 14 all use
  navigation, workforce, database in that order.
- **Seasonality in Figure 3** ("New cohort," "next season"). Same reasoning as change 9:
  Figure 3 describes the beachhead mechanism, and changing it would ripple through a
  computed ring for no gain.
- **"Less long-term care placement" (Figures 2 and 4) and "Preventive Geriatric Care"
  (Figure 2).** These are thesis-level claims about the mechanism, not promises about
  CRP endpoints. **They do carry real misread risk**, and the honest fix is downstream
  rather than here: **Figure 15 must explicitly show that institutionalization and
  utilization are not CRP endpoints**, that the award measures establishment,
  intermediate outcomes, and linkage feasibility, and that the placement claim is
  supported by cited literature plus an actuarial model rather than measured. Recorded
  as a requirement on Figure 15, not a change to Figures 2 and 4. Figure 2 is a locked
  artifact and should not be reopened for this.
- **Clinical-trial and HSR language: clean.** Nothing in the set implies assignment or a
  clinical endpoint. Figure 9 already says "we measure care established, not clinical
  endpoints," and Figure 10 already attributes IRB validation correctly to Aim 1.
- **Figure 7's footnote to CP Section 9** stays valid, but note the dependency: that
  section is being reopened for market count and product count, so the pointer should
  be re-checked after the CP edit rather than before.

### Net effect

Five must-change edits touch Figures 6, 7, 11, and 13. Four minor edits touch Figures
4, 5, 6, and 10. Figures 1, 2, 3, 8, 9, 12, and 14 are untouched. The front half of the
narrative is unaffected; every edit sits in the commercial and innovation half, which is
where the Approach decisions actually bite.

## Audit 2: visual architecture for Figures 15 onward

### Devices already spent in Figures 1 to 14

Counter-cycle rings (1, 3), hub-and-spoke ecosystem (2), paired headers with a
consequence box (3), three equal boxes plus a conclusion band (4), product hero over
two capability boxes (5), spine with paired exchange arrows (6), table (7), coverage
bars over a staged path (8), two-panel established-versus-open rows (9), one band over
four color-coded columns (10), two-over-one with bidirectional arrows (11), parallel
tracks with drop-offs (12), linear flow with a counter-example band (13), strata (14).

Unspent and available: bipartite mapping, structural grid, pathway schematic with
measurement points, narrowing interval, staircase against a horizon line, branching
decision structure, swimlane timeline, stamped inventory, decision tree.

### Slide by slide

| # | Title | Intellectual job | Device | Why this device |
|---|---|---|---|---|
| 15 | So What Would Actually Prove It? | Turn the claims of Figures 1 to 14 into evidence requirements, so the aims are *derived* rather than announced. Must also state plainly which claims the CRP does not measure. | **Bipartite mapping**: claims on the left, three aim nodes on the right, connectors showing which aim answers which claim; unmeasured claims connect instead to a fourth node marked "supported by literature and modeling, not measured here" | The intellectual act is assignment, and a mapping diagram *is* assignment. A table would list claims without showing that the aims fall out of them. The fourth node is what keeps Figures 2 and 4's placement language honest. |
| 16 | Three Aims, One Chain of Evidence | Logical dependency and what each aim de-risks, with no calendar | **Dependency chain with graduation gates**: Aims 1 and 2 as parallel tracks feeding Aim 3 through diamond gates, the three real couplings drawn as labeled arrows | The structural feature of this design is that graduation is conditional and independent. A gate glyph carries that; boxes and arrows do not. Deliberately calendar-free so it does not duplicate slide 24. |
| 17 | Where the Work Happens, and What Counts as Evidence | The 12-market design and its composition, plus the HSR versus operational-evidence key | **Structural grid**: two 2x2 panels (campus-rich, campus-poor) crossing waiver generosity by provider density, 12 market tokens placed in cells, anchors marked, payer clusters ringed. A compact key at the base defines the two evidence colors | A map would say geography matters; the grid says structure matters, which is the actual argument. Combining the evidence key here is not crowding, it is economy: the two colors introduced at the base get reused on slides 18, 19, and 20, so the reader learns the code once. |
| 18 | Aim 1: Can Care Actually Get Established? | The three studies, where each acts, what each measures, and the numeric bar | **Pathway schematic with measurement points**: the care-establishment pathway the reader already knows from Figures 8 and 12, with each task positioned where it acts and thresholds hanging as chips | Placing studies on the thing they measure is more truthful than a five-beat table and reuses geography the reader has already learned. Chips keep the numbers readable without a table. |
| 19 | Aim 2: Can We Bring New People Into Care Work? | Same job, worker side, plus the second-pool branch | **Worker pathway schematic with a fork**: recruit, verify, place, retain at 90 days and 12 months, with a dashed Year 3 branch for the second pool | Same family of device as 18, so the three aim slides read as one method, but a different underlying pathway and a fork that 18 does not have. The fork is where extensibility becomes visible. |
| 20 | Aim 3: Will Providers Pay, and Do the Economics Hold? | Same job, account side | **Account lifecycle schematic**: two cohorts entering at different points, offer, conversion, retention, churn, with measurement points on the lifecycle | The unit of analysis in Aim 3 is an account over time, so the device should be a lifecycle. Two entry points show the cohort contrast without a table. |
| 21 | What Providers Will Pay, Measured by What They Do | The four-stage pricing chain, and why revealed beats stated | **Narrowing interval**: a price band that starts wide at stage 1 and narrows to a point by stage 4, each stage labeled with method and evidence class | The content *is* the narrowing of an uncertainty interval, so width should encode uncertainty. This is the one place in the Approach set where a quantity is genuinely being represented, which earns a quantitative device. |
| 22 | While We Sell Staffing, We Build the Payer Case | The six-item readiness ladder for emerging buyers, and where the award stops | **Staircase against a horizon line**: six rungs rising, with a horizontal "award ends" line crossing above rung five, so the sixth rung visibly sits beyond it | One line does the entire honesty argument. No caption can beat it, and no table can show that we deliberately stop short of proof. |
| 23 | Every Gate Has a Number, and a Move If We Miss | Thresholds and the pre-committed consequence of missing each | **Branching decision structure**: each gate has two exits, pass continues the spine, miss routes to a named pre-committed move | The failure exits are the content. A threshold table flattens them into a column; a branch makes them structural, which is what a reviewer is looking for. |
| 24 | Three Years, and When Each Answer Arrives | Sequencing, dependency, and when decisions fall | **Swimlane timeline**, 12 quarters, decision diamonds, market-opening ticks, study bands | The only slide where time is the variable, so the only slide that earns a timeline. |
| 25 | What Olera Owns on May 31, 2030 | The end-state inventory with provenance | **Stamped inventory**: assets as chips grouped by product, market model, and evidence, each stamped with the aim that produced it, with a right-hand rail naming the three things they enable (operate, sell, raise) | Provenance is the point: an unstamped list reads as aspiration. Chips avoid the three-column layout Figures 4 and 10 already used. |
| 26 | No FDA Pathway Stands in the Way | The regulatory determination and what does govern | **Decision tree**: three questions ending in no premarket authorization required, with a short list of what does apply | A determination is literally a decision path, and this is the smallest figure in the set. Foldable into 25 if page budget demands. |

### Composition rules carried forward

- Each slide has one intellectual job, stated above; anything on the canvas that does
  not serve it comes off.
- Slides 18, 19, and 20 share a device *family* (studies placed on the pathway they
  measure) but not a layout. That is deliberate: the reader should compare the three
  aims on the same logic without three identical pictures.
- The evidence key introduced at the base of slide 17 is the only new color code added
  to the set; palette, type scale, and icon set stay as Figures 1 to 14 established
  them.
- Numbers appear as chips at measurement points, never in paragraphs.
- Trim order if the set runs long: fold 26 into 25, then 21 into 20. Do not fold 22,
  which carries the emerging-customer distinction that nothing else states.

## Applied, 2026-08-25

All five must-change edits and three of the four minor alignments are applied and
rendered. Change 9 (Figure 5's "every season") is deliberately left, per the
recommendation in this file: Figure 5 describes the beachhead, where seasonality is
literally true, and Figure 13 now carries the extensibility statement instead.

One QA catch during application: the "verified record" label first sat on the arrow
between the provider and workforce boxes at y=241 and was overrun by the workforce
box's fill. It now stacks as two short lines above the badge, inside the gap, clear of
both boxes. Verified at 979px, the true print width; 14 pages, zero em dashes, every
Figure 7 cell still two lines or fewer.

## Ready to execute

Both audits hold. The consistency change set is nine edits across five figures, none
in the front half of the narrative. The visual architecture assigns a distinct device
to each of twelve slides, every one with a prose home, and no device repeats from
Figures 1 to 14. Recommend applying the nine edits first so the set is internally
consistent before Figure 15 is drawn on top of it.

## Figure 15 built, 2026-08-25

Device as planned: bipartite mapping, ten claims on the left with dotted leaders to
anchor dots, four nodes on the right. Three are the aims; the fourth is dashed and gray
and reads "NOT AN AWARD ENDPOINT: supported by cited literature and an actuarial model,
not measured here." Only one claim connects to it, "Established care means less
avoidable utilization and placement," which discharges the requirement this audit
placed on Figure 15 to keep the institutionalization language in Figures 2 and 4
honest without reopening a locked figure.

Two link styles carry meaning: solid means the aim settles the claim, dashed means the
aim supports it without settling it. Two claims are dashed, extensibility beyond
students (a Year 3 feasibility pilot, not a test) and institutional willingness to pay
(an evidence package, not proof). One claim, "Providers cannot serve the demand
navigation sends them," forks to both Aim 1 and Aim 2, which is accurate and is the
only crossing in the figure.

QA: the first render left 150 to 290 pixels of empty space between short claims and
their anchor dots, weakening the association; dotted leaders now close that gap.
Verified at 979px, 15 pages, zero em dashes.

## Figures 16 to 26 built, 2026-08-25

Twenty-six pages, zero em dashes, every new figure inspected at 979px. Devices as
planned in Audit 2, with no device repeated from Figures 1 to 14 and none repeated
within the Approach set except the deliberate pathway family at 18, 19, and 20.

**Two content corrections made while building, not cosmetic:**

1. **Figure 16 originally labeled the Aim 1 to Aim 2 coupling "consented family
   demand, for the referral pathway only."** The referral network is one of the three
   provider modules the staffing-only decision removed, so that label pointed at a
   product that no longer exists. It now reads "family demand in the same markets,
   which is what makes staffing bind," which is the coupling that actually survives.
2. **Figure 16's cost-to-serve dependency was drawn as a long path emerging from under
   Aim 2.** Cost to serve families is Aim 1's output, not Aim 2's. Rather than route a
   line around two boxes, the dependency is now stated inside Aim 3 where it is used:
   "tested against the cost of serving families, measured in Aim 1."

**QA catches fixed before delivery:** pin cards colliding with each other in Figure 20
(card width now derives from stage pitch); the IRB tag overrunning its threshold line
in the shared aim template; the award-end line cutting through the top rung in Figure
22; Gantt bars stacking one per row in Figure 24 (bars now pack greedily into rows,
and labels move outside the bar when the bar is too short); the third group of Figure
25 overflowing its closing band; and the governing-law list in Figure 26 overlapping
its band and using ragged label offsets.

**Note for the written Approach:** Figures 16 and 24 both map to "Overall design and
timetable" and may merge into a single Research Strategy figure. Figure 26 can fold
into Figure 25 if the page budget demands it.

---

## QA pass, Figures 1 to 26 (2026-08-25)

Method: automated structural checks, a six-word shingle scan for repeated
phrasing across all 26 figures, a vocabulary consistency scan, and visual
inspection of rendered pages at true print width (979 CSS px, 2x device scale).
The earlier habit of screenshotting at 1958 px was double print width and could
not catch HTML-table line wrapping; all inspection here is at 979.

### Structural checks (clean)

- 26 pages render; titles are sequential 1 to 26 and match the intended set.
- Zero em dashes.
- Internal cross-references resolve: "Figure 22" in Figure 20, "Figures 6 and 7"
  in Figure 9.
- Aim numbering consistent across Figures 15 to 25.

### Defects found and fixed

**1. Figures 15 and 16 shared an entire block verbatim.** Both carried the three
aim names plus the same three subtitles. Figure 15's subtitles were removed and
its remaining aim titles bumped to 12.5 px, so only the aim *names* recur, which
is required consistency rather than repetition.

**2. Figure 19's closing repeated Figure 15's claim word for word** ("we add
caregivers rather than move them"). Rewritten to "whether the people we place are
new to care work, whether they stay, and whether providers get value worth paying
for."

**3. "Provider value endpoint" was used as a threshold subject without ever being
defined** in the figure set, in Figure 19 (pinned over "Provider hires") and again
in Figure 23's month-24 gate. A reviewer reading Figure 19 met a 70% bar on an
undefined term. Research Strategy section on Aim 2 defines it for staffing as the
first verified paid shift, so both instances now name the thing itself:
Figure 19 reads "accounts reaching a first verified paid shift, 70% or higher";
Figure 23 reads "first verified paid shift in 70% of accounts."

### Repetition judged intentional and left alone

- Figures 18, 19, 20 share the template label "THE TASKS THAT PRODUCE THESE
  MEASUREMENTS." Same device, same label, is the point.
- Figure 23 restates thresholds from 18, 19, and 20. A gate figure has to be
  self-contained, and it adds what 18 to 20 do not carry: the pre-committed move
  if the number is missed.
- Figures 21 and 24 share the task name "randomized offer prices under real
  billing." It is the name of the experiment.
- Figures 1 and 3, and 2 and 4, reuse device deliberately to show the same
  structure changing.
- Figures 6 and 7 share a band label by design; 7 is the detail behind 6.
- Figure 16's two gates carry the same italic label. Parallel gates, parallel
  labels.

### Vocabulary scan (clean)

CareNavigator first appears in Figure 5 and never earlier. Key Innovation
numbering is consistent across Figures 5, 9, 11, 12, 13, 14. "Twelve markets" is
consistent in 17, 18, 19, 25. "Verified record" is consistent in 11, 13, 19, 24.

"Caregiver Passport" appears in no figure. Deliberate: it is a potential
mechanism, not a ratified coinage, and house style forbids introducing one inside
a figure.

---

## Front matter: title and contents (2026-08-25)

Three unnumbered pages added ahead of Figure 1. **The 26 figures keep their
numbers.** Numbering the front matter would have shifted every figure by three
and broken the in-figure cross-references (Figure 20 to 22, Figure 9 to 6 and 7)
along with every reference in the pass files. The deck is now 29 pages: title,
contents 1, contents 2, then Figures 1 to 26.

**Title page.** Typographic, one green accent bar, no motif. Left block carries
the NOFO line, CareNavigator, "Figures for the CRP Application," and the people;
right block carries project period, scope of the set, and status. The footer band
states what the deck is: each figure answers one question and raises the next.

**Contents 1, Research Strategy.** Two columns. Left: SIGNIFICANCE (1 to 10) and
INNOVATION (11 to 14). Right: APPROACH (15 to 26). Titles are the exact current
figure titles, not paraphrases.

Section assignment follows the Research Strategy as it actually reads, not a
generic NIH template. Its SIGNIFICANCE runs through "Competitive environment and
our advantage" and closes on "Hurdles to adoption," which puts Figures 8 and 10
in Significance; INNOVATION is the three key innovations, so 11 to 14; APPROACH
is everything from 15.

**Figure 9 has no counterpart in the written Significance.** "And Related
Academic Efforts" answers a reviewer question the prose does not currently
answer. It is grouped with Significance because it sits inside the 8-9-10 run and
supports the same argument, but the written section needs the beat added, or the
figure needs a home in Innovation. Flagged for Logan, not resolved here.

**Contents 2, CRP Progress Report and Commercialization Plan.** Both marked NOT
YET DEVELOPED at group level, with a dashed unchecked box on every row, using the
deck's existing grammar where dashed means open or emerging. CP sections are
listed in the Living Commercialization Plan's own numbering and wording, verbatim
and in caps as the source has them.

### Two findings from building the map

1. **The Commercialization Plan has no Section 10.** Headings run 1 to 9 and then
   11. Prose in Sections 3, 8, and 7 cross-references "Section 10" for the
   revenue model and economics, which is Section 9 (Revenue Streams) as numbered.
   Listed as written, per the CP provenance rule to flag rather than silently
   harmonize, with a footnote on the slide saying so.

2. **The Fundraising Plan is not a section.** PAR-27-098 requires four subsections
   in addition to SF424's six: Statement of Need, SBIR/STTR Commercialization
   History, Project Management Plan, and Fundraising Plan. The first three are
   headings in the CP. The fourth exists only as a paragraph inside Section 7
   (Finance Plan), so it does not appear in the contents. A reviewer looking for
   the required heading will not find one.

---

## Deck architecture: section dividers and renumbering (2026-08-25)

The deck is now structured on the formal application hierarchy. 45 pages: three
unnumbered front-matter pages (title, contents 1, contents 2) then 42 numbered
body slides, dividers included in the numbering.

```
        title
        Contents: Research Strategy
        Contents: Commercialization Plan
 1      RESEARCH STRATEGY                    major divider
 2        Significance                       subsection divider
 3-12       figures
13        Innovation
14-17       figures
18        Approach
19-30       figures
31        CRP Progress Report                not yet developed
32      COMMERCIALIZATION PLAN               major divider
33-42     sections 1 to 9 and 11             not yet developed
```

Section membership follows the NOFO's Research Plan subsections (II.1
Significance, II.2 Innovation, II.3 Approach, II.4 CRP Progress Report) and the
Living Commercialization Plan's own section list and order.

### Renumbering

Slide numbers are continuous across the body and dividers consume numbers, so
every figure moved. Old figure number to new slide number:

| old | new | old | new | old | new |
|---|---|---|---|---|---|
| 1 to 10 | +2 (3 to 12) | 11 to 14 | +3 (14 to 17) | 15 to 26 | +4 (19 to 30) |

Cross-references inside the figures were updated with the numbering and now say
"Slide", not "Figure", because a slide number in this deck no longer identifies a
figure: "Figures 6 and 7" became "Slides 8 and 9" (slide 11), "Figure 22" became
"Slide 26" (slide 24). Two HTML comments carrying old numbers were updated too.
Earlier pass files still use the old figure numbers; the table above decodes them
rather than rewriting the record.

### Divider design

**Major dividers (slides 1, 32)** are dark: a full-bleed `#1f4534` panel, the
section name at 40px in white, and the section's own subsections listed with
their divider slide numbers and status. They are the only dark pages in the deck,
so a section break is unmistakable when scrolling.

**Subsection dividers** are light and hold four things: the parent section as an
eyebrow, the slide number, the subsection name at 34px, and either its slide
range or "Not yet developed." A rail at the foot of the page shows every sibling
subsection with the current one filled, so position is readable without the
contents page. Undeveloped siblings are dashed, matching the deck's existing
grammar where dashed means open.

**Neither carries a black h1.** Every substantive figure does. That is the
fastest signal that a page is furniture rather than argument.
