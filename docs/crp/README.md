# CRP Application — Operating Map

Working home for Olera's NIH SBIR Commercialization Readiness Pilot (CRP) application.
Small, purposeful, legible: every file has a reason to exist. Detailed evidence lives in
`evidence-ledger.md`; figures and their meaning in `figures/MANIFEST.md`.

## 1. What this grant is

Three-year NIA CRP (~$4M) to take CareNavigator — a two-sided eldercare platform built
across SBIR Phases I–IIB (1R44AG074116) — to commercial sustainability: concentrate
family and provider participation in local markets, validate the Provider Growth Suite,
and prove a provider-funded revenue model that keeps navigation free for families.

## 2. Canonical files

| File | Role | Source (imported 2026-08-17) | Sync status |
|---|---|---|---|
| `specific-aims.md` | Canonical Aims | Drive "1. Specific Aims" (`18HLcTa0…`, mod 08-14) | GitHub-active |
| `research-strategy.md` | Canonical RS | Drive "2. Research Plan" (`1dWDYwyS…`, mod 08-17 14:04) | GitHub-active — 72h revision target |
| `commercialization-plan.md` | Canonical CP | Drive "3. Commercialization Plan" (`1Vutumdd…`, mod 08-17 11:20) | GitHub-active |
| `solicitation-reviewer-reference.md` | Verbatim NOFO/review criteria | solicitation capture | stable |
| `evidence-ledger.md` | Claim → source → strength → verify? | maintained live | live |
| `figures/` + `MANIFEST.md` | Figure files, captions, placement, argument, status | RS: extracted from Drive docx; CP: SVGs from staging v0.24 | live |
| `tools/` | md→docx export (Drive round-trip), print/page check | this repo | stable |

**Sync rule:** each document has exactly one active surface at a time, recorded in its
provenance header. GitHub-active → Drive copy is comment-only. Export for review flips
it to Drive-active until comments are reconciled back with a dated snapshot. Export via
`tools/export_docx.py`; upload converted to a **native Google Doc** so comments can be
read back through the API.

## 3. Strategic thesis

Benefits and navigation attract families → family demand attracts providers → providers
get neutral, free family connections → Olera sells providers tools for their three big
problems: **Staffing, Visibility/Boost, Conversion**. The pieces reinforce one another
(one system, not three companies). Engineering supports the research: each aim states
what exists / is partial / is completed under CRP; research questions target the
commercial uncertainties. Human-subjects work follows **Verify → Validate → Scale**.

## 4. Major unresolved weaknesses (score-movers)

1. **Commercial readiness evidence** — preliminary work must show real movement toward
   commercialization with honest maturity labels (Staffing: real pilot experience ·
   Visibility/Managed Ads: emerging, operating · Conversion: least mature, not yet a
   product). Metrics must be revenue or revenue-adjacent; every milestone answers "why
   are we closer to sustainable revenue?"
2. **Human-subjects rigor** — Aim 1: one focused ADRD-caregiver study (defend the
   population choice; no dropout-only recruiting). Aim 2: intervention definition still
   unresolved. Aim 3: least developed; must pass the investor common-sense test.
3. **Letters as real evidence** — customers (~15 signed Growth Suite providers) and
   investors (AAN/Blake Petty, Ziegler, Equitage) speaking to actual value and CRP
   milestones. Interest is never framed as commitment.

## 5. Fixed terminology

CareNavigator · Provider Growth Suite · **exactly three products: Staffing,
Visibility/Boost, Conversion** (profiles sit under Visibility; no fourth product) ·
family/caregiver · provider · market = county · commercial readiness · sustainability.
Flag semantic drift on sight.

## 6. Provisional claims (flag, never silently harmonize)

- **End-state numbers** (market count 12 vs 18; award-end payers/revenue/run-rate —
  three versions in circulation) — locked only after the Aim 3 redesign, then
  reconciled RS → CP → Aims in one pass.
- **AI agents**: agentic layer is in development in a separate codebase (integration
  ~3 months out, pre-award). Never described as existing today; current state =
  structured screening/matching + AI-drafted, expert-approved guidance.
- **MedJobs pilot outcomes** (900 applications; 100 accepted; 25 vs "about 100" placed)
  — resolve from Logan's consolidated pilot record (pending task, owner: Logan).
- Unsourced CP additions ("~3 families converted/month"; "+50K profiles annually").
- Full register: `evidence-ledger.md`.

## 7. September 1 go/no-go

No postponement decision now; two-week sprint. TJ's estimate ~35 impact score → target
**≤30 by Sept 1**, aspiring toward 10. On Sept 1: genuinely competitive → submit;
otherwise seriously consider postponing — sunk effort is not a reason to submit. Every
revision is judged by "does this materially reduce a likely reviewer concern," and every
section must be: clear for a tired reviewer · rigorous for a scientist · concrete for an
investor · true to what Olera has built · connected to commercial readiness.

## 8. Current priority

**72-hour goal (from 2026-08-17): Research Strategy Marcia-ready.** Pass order:
**Aim 2 (active)** → Aim 3 → Preliminary Work → Aim 1 → Significance/Innovation →
timetable + consistency sweep → export to Drive for Dr. Ory's review. Working method:
per-section brief from Claude, then line-by-line with Logan, one rewrite round.
Logan's edits are challengeable; preserve the strongest truthful argument, not the
draft. Truthfulness rule: never infer a feature, metric, or dataset exists because it
would strengthen the proposal — distinguish code-proves-exists / proven-used /
in-development / proposed, and ask when sources don't settle it.
