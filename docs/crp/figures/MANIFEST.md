# Figure Manifest

One row per figure: what it is, where it lives, where it appears, what argument it
carries, and its status. Update this file whenever a figure is added, revised, or
re-placed. Status values: **current** · **needs-revision** (with reason) · **orphaned**
(no longer referenced by canonical text).

## Research Strategy (`figures/research-strategy/`)

Source: extracted 2026-08-17 from the Drive "2. Research Plan" docx (`1dWDYwyS…`,
modified 2026-08-17 14:04). PNG is the working format; original authoring surface was
Google Docs/design tool (source files not in repo — revisions will be re-authored as
SVG here).

| # | File | Caption (verbatim from RS) | Location | Argument it carries | Status |
|---|---|---|---|---|---|
| Fig 1 | `fig-1.png` | The aid that could pay for care sits unused, and the workforce to deliver it falls short. | Significance, after "The unmet need" | The two-constraint paradox at the center of the unmet-need argument: money unclaimed, workers missing | **current** — reconciled 2026-08-19: "~80% annual turnover" line removed (prose no longer claims it; verified value was 75.0%), height trimmed; both remaining stats verified ($58B → ncoa2025; 9.7M → phi2025 in references.yaml); TJ's design otherwise untouched |
| Fig 2 | `fig-2.png` | One loop, two sides. Consented family demand is the reason a provider signs in. Whether it is also what keeps them paying is the hypothesis Aim 3 tests. | End of Innovation | The flywheel: benefits directory → aid secured → family shares profile → providers arrive → Growth Suite revenue; answers "three companies at once" | current |
| Fig 3 | `fig-3.png` | Demand arrives on its own. Organic search alone brings more than 15,000 families a month at near-zero acquisition cost, in nearly every county in the country. | Preliminary Work | Measured organic traction (May 12,312 / June 13,913 / July 2026 15,530; 3,142 counties; 72,000+ records; 725 providers; 2,400 leads/mo) — the acquisition-cost advantage | current — numbers should be refreshed near submission |
| Fig 4 | `fig-4.png` | What the CareNavigator does for one family. Seven questions match one Houston household to twenty programs worth an estimated $955 a month. The platform prepares each application and the family submits it. | Preliminary Work | Concrete worked example of the family-side value | current |
| Fig 5 | `fig-5.png` | The economic hypothesis the award tests. Provider revenue reaches break-even by the end of the award, and private capital accelerates a model already shown to work. Trajectories are illustrative. | End of Aim 3 | Award-end break-even + two post-award paths; carries "~300 paying accounts · ~$720K ARR · <12-month payback · 3:1 LTV:CAC" | **needs-revision**: end-state numbers are provisional pending Aim 3 redesign and RS↔CP reconciliation |
| Fig A | `fig-approach-overview.svg` | Overview of the specific aims and tasks. | Opener of the Approach section, after the Rationale paragraph | The entire Approach in one view, reading left to right: broad national traction → aims 1 and 2 pipelines building local market depth → Aim 3 priced products, profit, investor readiness → post-award sustainability and accelerated market capture. Task tags 1.1–3.3 link stages to the detailed sections. Deliberately word-light (Logan 2026-08-19); the Rationale paragraph carries the prose. No market counts. | **current** — adopted 2026-08-19 (Logan); lettering finalized in the consistency sweep |
| Table 1 | `table-1.png` | Timetable and go/no-go gates. Aims 1 and 2 run in parallel, and each offering graduates into Aim 3 on its own gate. | removed from the Approach 2026-08-19 (opening reconciliation) | Carried the year-by-year timetable and gate summary | **orphaned** — artwork retained. Its unique content (the tentative timetable the SF424 instructions require) must reappear during the line-by-line pass, e.g. year spans on aim headings or a compact timetable; its gate conditions already live verbatim in the aims' Metrics blocks. Also predates the three-product taxonomy ("All four modules") |

## Commercialization Plan (`figures/commercialization-plan/`)

Source: extracted 2026-08-17 from the staging HTML (v0.24.0). SVG is the editable
source of truth for these; render to PNG only when embedding/exporting requires it.
Numbering matches the canonical Drive CP's figure references.

| # | File | Caption (staging v0.24 wording; Drive CP wording may be shorter) | Location (Drive CP) | Argument it carries | Status |
|---|---|---|---|---|---|
| Fig 1 | `fig-01.svg` | The vicious cycle CareNavigator interrupts. | §1 | The public-health cycle the product breaks | current |
| Fig 2 | `fig-02.svg` | Organic national demand, up 35-fold past the Phase IIB projection. | not explicitly referenced in Drive CP §1–2 | Organic growth curve 2023→2026 | **orphaned?** — confirm whether Drive CP still uses it |
| Fig 3 | `fig-03.svg` | The Valley of Death: three commercialization requirements between national deployment and full commercialization. | §1 | Why CRP funding, framed as the three requirements | current |
| Fig 4 | `fig-04.svg` | Mission-critical constraints; monetization is tested around them. | §1 | Free-to-families / neutrality constraints as mission alignment | current |
| Fig 5 | `fig-05.svg` | The CareNavigator platform and what its database connects families to. | §2 | Platform architecture: three sides + database | current |
| Fig 6 | `fig-06.svg` | Without navigation the cascade runs; CareNavigator establishes support before needs go unmet and re-engages as needs evolve. | §2 | The five-step sequence (screen→match→apply→intake→follow-up) | current |
| Fig 7 | `fig-07.svg` | Expected outcomes at conclusion of CRP. | §2 | What award completion produces | current |
| Fig 8 | `fig-08.svg` | CareNav's durable advantages. | §5 | Moat framing | current |
| Fig 9 | `fig-09.svg` | The acquisition and conversion system the CRP funds. | §5, §8 | Market-entry machine by aim | current |
| Fig 10 | `fig-10.svg` | Revenue and operating costs, 2027–2037 ("Two paths to post-CRP growth"). | §7, §9 | Award-end sustainability + Scenario A/B | **needs-revision**: plotted from the 18-market staging model; CP §5/§11 and RS use 12-market/~300-payer numbers — freeze until Aim 3 reconciliation |
