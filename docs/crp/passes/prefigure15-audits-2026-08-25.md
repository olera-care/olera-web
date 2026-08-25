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
