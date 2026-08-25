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

---

## Edits, 2026-08-25 (Logan)

**Slide 4**, virtuous-cycle panel removed. It previewed Slide 6's whole argument
inside the ecosystem map. Removing it also balanced the composition: the family now
sits centered with open space on both sides instead of one loaded corner.

**Slide 12**, Families and Providers columns swapped, so the order is Families,
Providers, Workforce, Every Market. Geometry unchanged, content exchanged.

**County and market, resolved deck-wide.** The two words were being used
interchangeably for the same thing, most sharply on Slide 9, whose total row said
"one mid-sized county" while its own footnote said "per-market economics," and on
Slide 19, whose claim line read "County economics work, and replicate across
markets."

The deck now uses **market** for the commercial unit and states the equivalence once,
at first use, in Slide 9's total row: "one mid-sized market (one county) at
maturity." That is the Commercialization Plan's own definition ("in this model, one
market is one county," Section 9). Slide 12's band moved from "one county" to "one
local market." Slide 19's line became "The economics work in one market, and repeat
in the next," which states replication without colliding with the term.

**County survives on Slide 17 deliberately.** "What programs actually decide, county
by county" and "a county-by-county record of unmet need" are the geographic and
public-health sense, not the commercial unit, and Slide 17 never says market. Same
word, genuinely different referent.

**Slide 19 carried a stale range** the renumbering sweep missed because it was not a
"Figure N" pattern: the left column header read "WHAT FIGURES 1 TO 14 CLAIM." Now
"WHAT SLIDES 3 TO 17 CLAIM."

**Three evidence lines removed** from Slides 15, 16, and 17 (the 31-caregiver
evaluation, the Texas A&M pilot, and the 15,500 monthly visitors). Logged with
candidate homes in `removed-material-log.md` items 24 to 26. Worth noting: the deck
no longer states anywhere the family volume the database learns from, which is the
mechanism behind Slide 17's "sharpens with use" claim.

### Slide 19 rebuilt (2026-08-25, Logan)

Ten claims down to seven, four rewordings, closing line out, title changed. Rebuilt
rather than patched so the fan of connectors stays clean.

Three of Logan's instructions were applied with a small correction each, all flagged
to him:

- "a licensed professional approve" → **"a licensed professional would approve."**
  The swap he wanted was sign to approve; without "would" the clause loses agreement.
- "19. So What Would Our Resarch Approach Actually Prove It?" → **"19. So What Would
  Our Research Approach Actually Prove?"** Typo fixed, and "Prove It" dropped because
  the inserted subject makes "would X prove it" ungrammatical.
- "County economic hold across mutiple market types" → **"The economics hold across
  multiple market types."** Keeps his meaning, including the replication-design point
  his wording adds, without reopening the county-versus-market decision made the same
  day. Note this is a better claim than what it replaced: it names the 2x2x2
  replication grid rather than just asserting repeatability.

**Type scale.** Claim text 9.4 to 11 and the two column headers 8.4 to 9, both sizes
already in the deck. The aim card labels and names were left at 7.8 and 12.5
deliberately: slide 20 shows the same three aim names at 12.5, and growing them here
only would be inter-slide drift on identical content. Row pitch 36 to 52.

**The legend went with the dashed connectors.** See removed-material-log item 31.

**Aim 2 now rests on one claim** in this figure, because the claim that fed both Aim 1
and Aim 2 was removed. Flagged, not resolved.

### Slide 20 edits (2026-08-25, Logan)

Aim 2 subtext, Aim 3 subtext and qualifier, the coupling-arrow label, both gate
labels, and the closing band. viewBox 440 to 350 since the band is gone.

Two corrections applied and flagged:

- "and fill vaccant jobs with licensed providers" → **"and fill vacant jobs at
  licensed providers."** Typo, and the preposition: new caregivers fill vacancies
  *at* providers; "with licensed providers" reads as providers being the filler.
- The gates now name real bars rather than a generic phrase, taken from slide 27's
  month-12 gate and split by owning aim. Each label sits in the quadrant its curve
  leaves open (Aim 1's above the diamond, Aim 2's below), because the longer text
  would have crossed the connector at the old position.

### Slide 21 edits (2026-08-25, Logan)

P1/P2 badges out, second-pool note out, evidence key out, closing band folded into
the title, legend re-centred, and the row stratifier changed.

- Title set in the deck's title case: "21. Where the Work Happens First, and Where
  It Replicates."
- With the badges gone the cells no longer needed the height that held them: cell
  height 84 to 56, dots re-centred, legend moved up under the grid and centred as a
  single row on x=490.
- **Row stratifier changed from waiver generosity to SES.** This is a change to the
  approved market design, not a relabel. The 2026-08-25 rebase chose waiver
  generosity because it drives what aid can actually be secured, which is Aim 1's
  dependent variable. SES is a different construct. Applied at Logan's direction and
  flagged to him; `approach-alignment-2026-08-25.md` and
  `approach-rebase-2026-08-25.md` still say waiver generosity and need reconciling.

Two consequences logged in `removed-material-log.md` items 36 and 38: the
payer-cluster market design is now invisible deck-wide, and the four IRB chips on
slides 22 and 23 have lost their key.

### Slide 22 edits (2026-08-25, Logan)

Task block moved below the Uncertainty-removed band, label changed to "AIM 1 TASKS,"
and all four task lines shortened. Band at y=346, tasks from y=410, viewBox 500 to
490.

One repair: the new "Reported throughout" line read "the volume of executed to test
whether," missing its noun. Written as "the volume of executed cases, to test
whether."

Two consequences to decide on:

- **Slides 23 and 24 now diverge from 22.** The three aim slides are the deck's one
  deliberately repeated device. They still label the block "THE TASKS THAT PRODUCE
  THESE MEASUREMENTS" and still place it above the band. One slide out of three
  reads as a mistake rather than a choice.
- **"Sharpens" and "learns" now both describe the database.** Slide 19's claim was
  changed to "The database learns with every completed case" earlier the same day;
  slide 22's reported-throughout line says "sharpens with use." Slide 17 uses
  neither. One verb should win.

### Slide 23 edits (2026-08-25, Logan)

Recruit pin removed, two pins rewritten, tasks moved below the band and rewritten,
second-pool line removed, band rewritten, free-pilot note added. Layout now matches
slide 22 exactly (band 346, tasks from 410, viewBox 490).

Choices made inside the instructions, all flagged:

- **"a certain number of shifts confirmed"** became "providers with repeat shift use
  at 60 days / 50% or higher." No CRP document sets a shift-count threshold, and
  inventing one would draw exactly the challenge a reviewer should not get to make.
  Repeat use at 60 days is already committed on slide 27's month-24 gate, it means
  more than one shift got confirmed, and it is operational, so the IRB tag came off
  the card and its fill changed to the operational style.
- **Satisfaction pin** reads "satisfaction with the work, from providers and from
  workers / reported with reconciled counts," keeping the reconciliation Logan asked
  to add satisfaction to rather than replace.
- **Label is "AIM 2 TASKS."** Logan pasted the old header as context but asked for
  slide 22's treatment, and slide 22 now says "AIM 1 TASKS."
- **Task 2.2 got "the"** before the list, matching slide 22's Task 1.2 construction.
- **The free-pilot note names the fee, not the shift.** "Staffing runs free for
  providers" would have collided with the "first verified paid shift" pin two inches
  above it, where "paid" means the worker was paid. The note reads "providers pay
  Olera nothing for staffing in Aim 2."

### Slide 24 rewritten, pricing-method slide removed, deck renumbered (2026-08-25)

**Slide 24.** Every measurement in plain language, the IRB interview pin removed,
tasks rewritten and moved below the band, and the band restated as the commercial
question. "Use the product" is now "Use the staffing product."

The pricing pin was the crux: it read "conversion by price arm, pre-registered rule /
the price we operate on," which said nothing a reviewer could act on and implied
arbitrary prices. It now reads "conversion at each offered price, starting from the
pilot prices / the price providers will pay," and Task 3.1 names the two pilot-derived
hypotheses out loud, about $275 a month or $150 a hire, which are the same figures on
slide 9's table. The prices now have a visible provenance.

Plain-language swaps: "cost to serve an account, from live billing records /
re-runnable" became "what it costs us to serve one paying account / from real billing
records"; "time from offer to first payment / payback under 12 months" became "time to
recover what it cost to win the account / under 12 months"; "provider revenue against
the cost to serve families / covers it, or is reported" became "profit margin per
market, after the cost of serving families / positive, and reported."

**Two knock-ons found in the vocabulary pass, both fixed.** Slide 22 still said
"re-runnable, and falling," now "recalculated, and falling." Slide 26's month-24
if-we-miss said pricing alternatives would "add value where the interviews locate the
gap," which pointed at the provider interview study Aim 3 no longer runs; it now reads
"Pricing alternatives, committed in advance, run in order: unbundle, re-tier, and
re-test." Slide 26 also said "at every price arm," now "at every price tested."

**Deck renumbered.** Removing the pricing-method slide drops the body from 42 to 41
slides and every slide after it moves up one: figures 26 to 30 became 25 to 29, the
CRP Progress Report divider 31 became 30, the Commercialization Plan major divider 32
became 31, and its ten section dividers 33 to 42 became 32 to 41. Both contents pages,
both major dividers, the Approach subsection divider's slide range, and the title
page's slide count were regenerated rather than patched. 44 pages total. No internal
cross-reference pointed at a moved slide.

### Slide 25 rewritten in plain language (2026-08-25, Logan)

Title, all six rungs, both explanatory layers, and the closing band. Structure and
geometry unchanged except for one fix noted below.

Jargon retired, and what replaced it:

| was | now |
|---|---|
| A measurable episode, with a verifiable establishment event | A measured case with verified care establishment |
| Attribution rules that match a payer's members to our episodes | A way to match a payer's members to the people we serve |
| Linkage to claims demonstrated at a pre-specified match rate | Our cases linked to a payer's own claims records |
| Intermediate outcomes with face validity | Outcomes that matter to a payer: aid secured, needs met, time to care |
| An actuarial value model with stated assumptions and sensitivity | A cost model for what that care is worth |
| Proof of effect on utilization and placement | Proof that it lowers hospital use and long-term care placement |

**"Institutional placement" became "long-term care placement."** That is the deck's
own term, on slides 3 and 6, and it names the thing rather than the category.

**Closing band, one line instead of three.** "We finish the award with the evidence a
payer needs to begin post-award studies of hospital use and long-term care placement."
The single word "post-award" replaces all three defensive sentences: it states the
boundary without apologising for it.

**One design fix the edit exposed.** With the subtexts gone, rung 6 sat directly on the
award line, so the line appeared to cut through both rung 5 and rung 6. Rung 6 lifted
14px, which leaves the line touching the top of the delivered stack and floating clear
below the undelivered rung. That is the correct reading: the line is the ceiling of
what the award produces.

### Gate slide removed, deck renumbered again (2026-08-25)

Body drops from 41 to 40 slides. Figures 27 to 30 became 26 to 29, the CRP Progress
Report divider 30 became 29, the Commercialization Plan major divider 31 became 30,
and its ten section dividers 32 to 41 became 31 to 40. Contents, dividers and the
title count regenerated. 43 pages.

**Three orphans on the Gantt, fixed.** The removals of the last two turns left labels
on slide 26 pointing at deleted material or using retired vocabulary:

- "stage 1" and "stage 2" referred to the four-stage pricing chain on the deleted
  pricing-method slide. Now "price range" and "structure," the decisions those stages
  make per the alignment doc. If those two pre-billing stages are being dropped from
  the plan as well, the bars should come out; that is a research-design call, not a
  labelling one.
- "episode cohort accrues" used the word slide 25 just retired. Now "measured cases
  accrue."
- "actuarial model, first read, investor package" is now "cost model," matching slide
  25's "A cost model for what that care is worth."

One deliberate exception: slide 19's not-an-award-endpoint box still says "an actuarial
model," which is Logan's own wording from this session. Slides 25 and 26 say "cost
model." Worth settling.

### Timeline and end state combined, deck renumbered (2026-08-25, Logan)

Slide 26 is now "Three-Year Timeline and End Result." The Gantt is untouched. Below
its milestone row: a rule under "AT AWARD END, MAY 31, 2030," three chips (A product
that works · A market model that repeats · Evidence for investors and payers), a short
arrow, and one band carrying the whole "which lets Olera" block: "Which lets Olera
**operate** without the award, **sell** at a price providers already paid, and **raise**
on numbers someone independent rebuilt." viewBox 470 to 536.

The three verbs are bolded inside a single line rather than given three cards. Two rows
of three boxes under an already dense Gantt would have been the crowding Logan asked to
avoid; one row of three plus one line reads as a conclusion instead of a second slide
compressed underneath.

Body drops to 39 slides, 42 pages. Approach is 19 to 27, CRP Progress Report divider
28, Commercialization Plan major 29, its sections 30 to 39.

### Consolidated cleanup pass (2026-08-25, Logan)

Every item applied. Four layout consequences the removals created, all fixed rather
than left as gaps:

- **Slide 12's red cards were sized for two lines of subtext.** With the subtext gone
  they held a title over 50px of air. Card height 82 to 40, arrows and green cards
  lifted 42px to close the gap, viewBox 470 to 300.
- **Contents, Research Strategy:** CRP Progress Report moved from y=366 to y=310, level
  with Innovation in the left column, so the four sections read as two balanced rows
  rather than three groups and an orphan.
- **Slide 4:** compass moved from y=338 to y=360, the true centre of the cycle ring,
  and "Care Navigation" moved from inside the ring to the foot of the box at y=500. The
  ring now holds one object instead of two stacked ones.
- **Slide 25's aim stamps** sit to the right of each rung's number circle, in the open
  space above each box, at 7pt letter-spaced in the eyebrow grey. Rung 6 has no stamp,
  which is itself the signpost that it falls outside the award. Mapping: rungs 1 and 4
  to Aim 1 (the measured case and the outcomes are Aim 1 measurements), rungs 2, 3 and
  5 to Aim 3 (payer agreements, claims linkage and the cost model are Task 3.4).

**Slide 26's band** now reads "Which lets Olera **operate** on revenue it measured,
**raise** on economics an investor can check, and **begin** payer validation with the
evidence in hand." Three verbs, two audiences, and "begin" keeps the payer claim
bounded to what the CRP actually establishes.

**Deck-wide QA after the removals.** 42 pages, zero em dashes, numbering sequential
(figures 3 to 12, 14 to 17, 19 to 27; dividers 1, 2, 13, 18, 28, 29, 30 to 39). No
orphaned reference to any removed text. Font sizes unchanged: nothing was resized to
fill space, and no replacement copy was written.

### Slide 29, the CRP Progress Report (2026-08-25)

**What the brief asks, read closely.** The operative verb in II.4 is *mitigate*, not
*describe*. It also names activities "beyond the scope of the Phase II project" and
asks that the work "enable third-party investment at any point in the development
timeline." So the section is a risk-retirement statement, not a chronology, and the
non-SBIR work (organic growth, the provider network, the staffing pilot) is invited
rather than tolerated.

**Argument.** Two NIH awards already bought the parts private capital will not fund:
the curated database, the validated product, the national demand, and the provider
network. What none of it bought is proof that concentrated local demand converts to
revenue. That is the only remaining class of risk, and it is the three aims.

**Device: an inventory weighted against a remainder, with no arrows.** Four solid
cards under ALREADY RETIRED occupy roughly two thirds of the canvas; one dashed red
card under NOT YET RETIRED occupies a quarter and stops short of the others' height.
The area ratio is the argument. This is the only slide in the deck with no flow: every
other figure moves, and a progress report is a statement of position. That stillness
is deliberate.

Rejected: a burn-down over a funding timeline (slides 25 and 26 are already a
staircase and a Gantt; a third temporal device in four slides), a four-into-one
convergence (slides 19 and 20), and a two-panel established/open grid (slide 11).

**Numbers, verified against `references.yaml` (all verified 2026-08-19):**

- Usability 4.57 of 5, n=30 (`fan2024`). The evidence ledger's "4.6/5, n=31" is stale;
  `fan2024` explicitly supersedes it. The ledger row should be corrected.
- Technology acceptance 5.83 of 7, n=65, after four weeks of independent use
  (`hoang2026`). This is **the platform, not the AI**. `hoang2026` notes that earlier
  Olera drafts quoted "about 5.6 of 7" and misattributed it to the AI agents.
- The multi-agent AI system, 5.73 of 7, n=31 (`careNavTAS2026`), **unpublished,
  manuscript in preparation**, and the slide says so. Logan's brief called this
  "system usability" in one bullet and "technology acceptance" in another; the source
  is a modified Technology Acceptance Survey.
- The AI is described as built and evaluated with "integration into the platform is
  underway." The evidence ledger marks "AI navigation agents run in production today"
  as **overstated**: the agentic layer is a separate codebase roughly three months
  from integration. This is the slide's most important accuracy guardrail, and it also
  satisfies the brief's "ongoing activities."

**Provider count: "over 700."** Logan asked for the database number. This session has
no Supabase credentials, so the count could not be pulled. The only measured value in
the repo is **711 claimed profiles on 2026-08-05**, from a prod bot-claim audit that
swept every claimed profile. The Research Strategy says 725+ and the Commercialization
Plan says about 750, both undated and neither reconcilable to a query. CLAUDE.md ranks
actual data above the application documents, so the slide states "over 700 ... growing
by about 150 a month," which is true under all three. **Pull the live count before
submission and date it.**

**Left out on purpose:** the Growth Suite as launched (ledger: overstated), Managed Ads
billing (contradicts the staffing-only beachhead), and the 2,400 leads a month and 15x
lead-day activity figures (pullable, not verified, and the slide is already
number-dense).

Deck is 43 pages, 40 body slides. Commercialization Plan dividers shifted by one:
major 30, sections 31 to 40.

### Slide 29 revised, and the reconciliation pass (2026-08-25, Logan)

Cover now carries Qiping Fan, PhD, Co-Investigator; the rule under the byline was
extended to sit beneath the widened line. Slide 29 gained a fifth card, every subtext
was cut to two plain lines, the remaining-risk question was broadened, and the closing
band and regulatory foot-line came out.

**The workforce card was a real gap.** Innovation 2 is a third of the deck's argument
and the Progress Report had no evidence for it. It now reads "Could we recruit
caregivers, and would anyone pay for them?" and carries the pilot: 900+ applicants,
20+ placed, four national franchise brands and one assisted-living community paid or
agreed to pay. That also absorbs the removed closing band, so nothing was lost with it.

**The remaining-risk question was too narrow.** "Will concentrated local demand convert
into recurring revenue?" named only Aim 3. It now reads **"Can one local market pay for
itself, and can we repeat it?"** which carries all three aims in one line: density and
establishment (Aim 1), capacity (Aim 2), economics and replication (Aim 3). It is also
the same question slide 12 calls the primary hurdle and the Commercialization Plan
calls the Valley of Death, so the three documents now name one thing.

### Reconciliation against the brief and the preceding 28 slides

Covered: development status of the technology, commercialization progress to date, past
**and ongoing** activities ("adding that AI to the live product is underway", "about 150
more claim one each month"), activities beyond the Phase II scope (named in the funder
tags), validation studies, and risk mitigation as the whole frame.

Every substantive claim the deck makes now has either a retired card or a named aim:
technical build to card 1, family acceptance to card 2, national demand to card 3,
provider supply to card 4, Innovation 2 and early willingness to pay to card 5, and
everything else to the remaining risk.

**Three gaps a reviewer could still find:**

1. **"Enable third-party investment" is not stated on this slide.** The brief asks the
   section to speak to investability. The deck answers it on slide 26 ("raise on
   economics an investor can check"), but the Progress Report itself never says an
   investor could enter now on retired risk. The written section must carry it.
2. **Regulatory compliance and IP are gone from the deck.** The brief names both as
   examples. FDA is on slide 27; trademark, copyright, trade secret, and the no-referral-fee
   position now appear in no figure. Removed at Logan's direction, logged, and the
   written section is their only home.
3. **Net-new-worker share is implied, not stated.** Slide 19 claims we add capacity
   rather than move it, and slide 23 measures it in Aim 2, but card 5 says "placed over
   20 into provider jobs" and leaves the word "student" to imply they were new to care
   work. One phrase would close it if Logan wants it explicit.

**One thing proposed in planning that did not get built:** the Phase I to IIB impact
scores of 20 and 25 (verified). They would fit in the funder tag with no extra line and
are strong credibility for an NIH reader, but both NIA cards share that tag, so adding
the scores means either repeating them or picking one card arbitrarily. Left out rather
than added unasked. Say the word.

### Reconciling TJ's Background framing into slides 3 to 5 (2026-08-25)

Three changes, four text elements, no geometry touched. TJ's framing is absorbed
without a resequence.

1. **Slide 3, the causal arrow is now labelled.** The red dashed arrow between the
   family panel and the cycle carried the figure's causality and said nothing. It now
   reads *"too expensive to afford, too confusing to find."* This is TJ's diagnosis in
   his own words, and it makes slide 3 state cause and consequence together instead of
   only consequence. It also silently sets up slide 4 as the confusion and slide 5 as a
   cause of the expense, which delivers Logan's proposed progression without moving a
   single slide.
2. **Slide 4 names what its two columns are for.** The figure already draws the dual
   failure: Public Aid and Insurance on the left are how care gets paid for, Healthcare
   and LTSS on the right are where care comes from. Nothing said so. Two column labels
   now do, which is the affordability half of TJ's diagnosis made visible with no new
   boxes.
3. **Slide 5 gains the measured shortage.** Under "9.7M unfilled roles by 2034,"
   which is a projection, the slide now carries *"63.3% declined cases they could not
   staff, 2023,"* which is a fact. Verified against `activatedInsights2024`
   (2026-08-19).

**Declined, and why.** Resequencing the opening so the cycle comes after the causes
(Logan's stated progression) would be a rebuild; the current order already delivers it
now that slide 3 names the cause, and leading with harm is the stronger opening for a
reviewer. Slide 6 untouched: it already carries the payer line, which is TJ's
cost-inversion conclusion. Slide 7 untouched for now. The $80,080 figure, the 43%
with no retirement account, the Medicare and Medicaid mechanics, and the universality
opener are all prose, not figures. The traction numbers stay on slide 29.

**Two things TJ's framing surfaces that are still unhoused:**

- **The delay mechanism.** "Families wait, and decline, until a hospitalization, when
  public programs finally step in at the most expensive possible moment and after the
  most harm." No figure says families *wait*, or that the public payer arrives late and
  pays more. Slide 3's unlabelled spur to "Long-term care facility" is the natural home
  for a short version of it, if Logan wants a fourth change.
- **The no-referral-fee consequence.** Slide 7's "no referral or eligibility gate" does
  not say what the rule buys: every provider listed, no steering, and federally
  reimbursed providers able to participate where pay-per-referral models must exclude
  them. That is a real competitive and regulatory advantage stated nowhere in the deck,
  and it lost its last home when the regulatory foot-line came off slide 29. One bullet
  rewrite would fix it.

**Ledger correction:** `evidence-ledger.md` still marks the $58B unclaimed-aid claim
"unsupported (citation missing)." `references.yaml` has `ncoa2025` verified 2026-08-19.
That row is stale.

### Both remaining changes applied (Logan: "do both of those too")

**1. Slide 3, the delay mechanism.** Under "Long-term care facility," in the same
italic red used for the causal label above it: *"families wait, and public programs
pay last and most."* Eleven words carry TJ's whole sentence about hospitalization as
the trigger and the public payer arriving last and paying most. The spur into the
facility box is no longer unlabelled, and the slide now reads as a sequence with a
cost inversion at its end rather than a ring of consequences.

**2. Slide 7, the no-referral-fee consequence.** The bullet "Open online to any
family, no referral or eligibility gate" became *"Open to any family, and no provider
pays to be listed, Medicaid and Medicare included."* The old wording named a rule; the
new one names what the rule buys. The clause about Medicaid and Medicare is the
competitive point: a pay-per-referral model cannot list federally reimbursed providers,
so the same sentence states the coverage advantage and its regulatory basis without
using the word "kickback" or citing a statute on a concept slide. Measured at 328.9px
at 8.6pt against a ~460px field; the two sibling bullets are 299.2 and 292.5, so the
bullet block stays visually even.

**Ledger corrected.** Two rows in `evidence-ledger.md` were stale and now resolve:
the $58B unclaimed-aid claim against `ncoa2025`, and the acceptance figures against
`fan2024`, `hoang2026`, and `careNavTAS2026`. The ledger's own note records that the
superseded "≈5.6/7" had been misattributed to the AI agents rather than the platform.

**State after this pass:** 43 pages, 0 em dashes, rendered and inspected at 979x741.
