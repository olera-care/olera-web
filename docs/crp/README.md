# CRP Application — Operating Map

Working home for Olera's NIH SBIR Commercialization Readiness Pilot (CRP) application.
Small, purposeful, legible: every file has a reason to exist. Detailed evidence lives in
`evidence-ledger.md`; figures and their meaning in `figures/MANIFEST.md`.

## 1. What this grant is

Three-year NIA CRP (~$4M) to take CareNavigator — a two-sided eldercare platform built
across SBIR Phases I–IIB (1R44AG074116) — to commercial sustainability: concentrate
family and provider participation in twelve local markets, add new caregiver capacity on
the provider side, and prove a provider-funded revenue model that keeps navigation free
for families.

## 2. Canonical files

| File | Role | Source (imported 2026-08-17) | Sync status |
|---|---|---|---|
| `specific-aims.md` | Canonical Aims — **rebuilt on SPINE.md, locked 2026-08-21** | SPINE.md + aims-spine-audit (supersedes Drive `18HLcTa0…`) | GitHub-active; Drive copy comment-only |
| `research-strategy.md` | Canonical RS | Drive "2. Research Plan" (`1dWDYwyS…`, mod 08-17 14:04) | GitHub-active — 72h revision target |
| `commercialization-plan.md` | Canonical CP | Drive "3. Commercialization Plan" (`1Vutumdd…`, mod 08-17 11:20) | GitHub-active |
| `Olera_Pre_CRP_RD_Commercialization_and_Execution_Plan.pdf` / `.docx` | **The pre-CRP plan**, one integrated memo in ten sections: the eldercare ecosystem and care-establishment pathway (Fig. 1), the five-year R&D and commercialization arc, provider commercialization, CareNavigator's honest current state and its CRP-entry line, institutional-buyer development, the private-capital thesis, the January scorecard organised by the eight risks it retires, and the eighteen-week plan to submission | Logan's two drafts of 2026-09-01, combined and rewritten 2026-09-02; build in `passes/pre-crp-memo-src/` | live; governs the September to January window |
| `solicitation-reviewer-reference.md` | Verbatim NOFO/review criteria | solicitation capture | stable |
| `evidence-ledger.md` | Claim → source → strength → verify? | maintained live | live |
| `meetings/2026-08-21-david-qu-and-team.md` | Durable context from the David Qu call + team session: the traction-strategy reframe, letters plan, commitments, watch list | transcript, 2026-08-21 | live; newest team decisions |
| `SPINE.md` | **The locked CRP strategic spine** and the test every claim, aim, and figure is checked against; architecture fixed 2026-08-20, language refinable | strategy session 2026-08-20 | locked; reopen only with Logan |
| `CANON.md` | **The conceptual canon**: the durable output of the 40-slide figure sequence. The causal chain the application follows, the settled decisions by domain (problem narrative, workforce, beachhead product, payer evidence, HSR boundary, Aim architecture, market design), working hypotheses, open questions, and the index of what it supersedes | figure sequence, 2026-08-24 to 08-25 | live; read before drafting any section |
| `strategic-context-2026-08-20.md` | Why the current strategy: business diagnosis → free-core + two-product framing, temporal frame, story spine, unresolved questions | strategy session 2026-08-20 | reference; its two-product framing and several unresolved items are superseded by `CANON.md` §6 |
| `figures/` + `MANIFEST.md` | Figure files, captions, placement, argument, status | RS: extracted from Drive docx; CP: SVGs from staging v0.24 | live |
| `tools/` | `render_pdf.py` (house-style HTML/PDF, the layout artifact), `export_docx.py` (house-style .docx for the Drive round-trip; shares the formatter with the renderer), `make_reference_docx.py` + `house-reference.docx` (Word style template: Letter, 0.5in margins, Arial 11pt justified, 9pt references) | this repo | stable |
| `reference/phase-iib/` | Phase IIB application (1R44AG074116) as historical source: prior framing, technical descriptions, accomplishments, figures | uploaded 2026-08-19 | reference only, never current truth |
| `reference/rppr/` | Phase IIB Year 1 and Year 2 progress reports: the authoritative record of what was actually built and tested (PEFT, RLHF, RAG, multi-agent integration, Aim 2 pilot) | Drive, extracted 2026-08-19 | reference; authoritative for technical history |
| `reference/publications/` | The research record: four peer-reviewed papers plus the unpublished CARE-NAV TAS study, with sample, methods, findings, and which CRP claim each can support | Drive, 2026-08-19 | reference; authoritative for study results |

**Sync rule:** each document has exactly one active surface at a time, recorded in its
provenance header. GitHub-active → Drive copy is comment-only. Export for review flips
it to Drive-active until comments are reconciled back with a dated snapshot. Export via
`tools/export_docx.py`; upload converted to a **native Google Doc** so comments can be
read back through the API.

## 3. Strategic thesis

Navigation attracts families → family demand attracts providers → providers get neutral,
free family connections → **Olera sells providers the one thing that binds them, caregiver
staffing**, because unfilled shifts cap the clients they can take. Navigation alone would
only route demand at a supply side that cannot absorb it, which is why workforce expansion
is part of the product and not a second business. The payer and institutional customers
above that layer are evidenced during the award, not sold (`CANON.md` §2.6). Engineering supports the research: each aim states
what exists / is partial / is completed under CRP; research questions target the
commercial uncertainties. Human-subjects work follows **Verify → Validate → Scale**.

## 4. Major unresolved weaknesses (score-movers)

1. **Commercial readiness evidence.** Preliminary work must show real movement toward
   commercialization with honest maturity labels. The CRP's product is Caregiver Staffing
   (real pilot experience, providers paid); Managed Ads/Boost is a live company activity
   and Conversion is not a product, and neither is a CRP deliverable. Metrics must be
   revenue or revenue-adjacent; every milestone answers "why are we closer to sustainable
   revenue?" The progress-report device in `CANON.md` §2.11 is the strongest form of this
   argument we have found.
2. **Human-subjects rigor.** Resolved in architecture (`CANON.md` §2.7): three bounded IRB
   studies, one per aim, everything else operational or commercial evidence, determinations
   obtained rather than assumed, and the project designed to stay outside the NIH
   clinical-trial definition. What remains is Qiping's protocol detail and the open
   determinations listed in `CANON.md` §5.
3. **Letters as real evidence.** Customers (~15 signed providers) and
   investors (AAN/Blake Petty, Ziegler, Equitage) speaking to actual value and CRP
   milestones. Interest is never framed as commitment.

## 5. Fixed terminology

CareNavigator · Care Navigation · New Caregiver Workforce · **one product the CRP sells and
prices: Caregiver Staffing** (Managed Ads/Boost and Conversion are company activities, not
CRP products; "Provider Growth Suite" is retired as an umbrella) · family/caregiver ·
provider · market = county, defined once at first use · care established · a first verified
paid shift · commercial readiness · sustainability. Full table with the retired terms:
`CANON.md` §3. Flag semantic drift on sight.

## 6. House style (canonical, ratified 2026-08-17)

Measured from the Drive RS and CP docx files; where memory and document disagree, the
documents win. Two rule sets: content rules govern all application prose wherever it is
written; rendering rules govern the docx/PDF surfaces.

### Content and prose rules

- Voice: clear, thoughtful, direct, concise, mature, professional, simple. Dense pages,
  readable paragraphs.
- **No em dashes, ever.** Use commas, colons, semicolons, parentheses, or separate
  sentences. En dashes only in numeric ranges ("Years 4–5").
- **No compressed contrastive constructions** (ratified 2026-08-19, Logan). Negative
  example, rejected from Key Innovation 2: *"National tools reach far more families
  and stop earlier."* It packs several ideas into a clever-sounding contrast, but it
  is vague and forces the reviewer to work out what we mean. Prefer a direct
  statement that names the actor, the action, and the consequence: "BenefitsCheckUp
  returns a list of programs a household may qualify for." If a sentence gets its
  force from a rhythm or a parallel rather than from what it says, rewrite it.
- Captions (figures and tables alike, ratified 2026-08-19): **one line maximum** —
  the shortest clear description of what the figure shows, in terminology that
  matches the surrounding prose and its in-text reference, so the reader never
  translates between text and figure. No explanatory, interpretive, or
  methodological detail unless absolutely necessary (that belongs in the prose or
  the figure itself); captions are not miniature paragraphs. Same font and size as
  body text. Only the label is bold ("**Figure 1.**"); the caption text after it is
  not.

### Document rendering rules

- Page: Letter portrait, 0.5in margins on all four sides.
- Type: Arial throughout. Body 11pt, justified. Table body text 9pt; figure and
  table captions at body size (11pt) per the caption rules above.
- Spacing: single line spacing; 0–2pt after body paragraphs; ~8pt before headings;
  never blank-paragraph spacing.
- Heading hierarchy (RS forms shown; the CP numbers its major sections):
  1. Major section: ALL CAPS bold, left-aligned, own line, body size ("APPROACH";
     CP: "9. REVENUE STREAMS").
  2. Named paragraph and aim: bold run-in ending in a period or colon ("Specific
     Aim 2:", "Overall design and timetable.", "Key Innovation 1:", "Aim N decision
     point and deliverable.").
  3. Task: bold run-in with colon ("Task 2.2: Title.").
  4. Subtask: italic run-in ("(Task 1.3A) Title:").
  5. Block and category headings: italic + underlined ("The CareNavigator Platform.",
     "Referral marketplaces:").
  6. Component and method run-ins: italic ("The matching agents (live).", "Design,
     participants, and recruitment.").
  7. Metrics lines: italic + underlined, left-aligned ("Metrics for Success for
     Validation (Task 1.2):"); each metric item below gets a bold label run-in
     ("Accuracy:").
- Figures: wrap vs. full width is decided per figure by legibility, never by which
  document it sits in. Narrow figures (about 3.0–3.5in) wrap square beside justified
  text; dense or wide figures run full text width (up to 7.5in) inline. Internal figure
  text must be legible in print. RS captions are separate 9pt paragraphs below the
  figure; CP figure captions are drawn inside the artwork; CP table captions are
  centered paragraphs.
- Comparison matrices (ratified 2026-08-19, measured from the Phase IIB
  competitive matrix and rebuilt as RS Table 2). These are read at a glance or
  not at all, so the design is a set of constraints, not preferences:
  1. **Marks, not sentences.** Cells carry ✓ or ✗ and nothing else. If a cell
     seems to need a qualifier, the row is wrong: split it into two rows whose
     answers are genuinely binary ("care needs known first" and "likely funding
     known first" replaced one "needs and funding" row that could only be
     answered "partial"). Never use a mark where the honest answer is "not
     applicable"; choose rows where every column has a real yes or no.
  2. **Rows are the attributes we win on**, phrased so our own column is ✓ down
     the whole list, three to five words each, in the same vocabulary as the
     surrounding prose. The last row carries the strongest claim.
  3. **Columns are categories, not companies**, with two or three example firms
     as a small italic second line in the header so the reader knows what the
     category means. Our own product is column one of the comparison.
  4. **Respect the incumbents.** Every competitor column should show at least one
     ✓; a matrix where only we check anything reads as marketing, not analysis.
     Distinct columns should end up with distinct patterns of marks, which is
     also a check that the categories are real.
  5. **Visual treatment**: horizontal rules only, no vertical lines or cell
     boxes; our column blocked in solid dark teal (#14453f) with white marks;
     other marks dark teal for ✓ and dark red (#9b1c1c) for ✗; row labels bold,
     left-aligned, in the same teal; headers bold and centered; marks set two
     points larger than the 9pt table body so they carry at a glance.
  6. **Page economy.** A matrix earns its space only by replacing more prose than
     it costs. Keep it under about two inches; a matrix and its caption stay on
     one page (the renderer enforces this), so check where the block lands before
     accepting it.
  Captions follow the caption rules above with no exceptions: one line, bold
  label only, body size. The renderer builds all of this from an ordinary
  markdown pipe table, where column one is the row label, column two is our
  product, and a header cell may read "Category // example, example".
- Known normalizations to apply on next touch: "Task 1.1" is missing its colon;
  "Family-side navigation:" lacks the italic+underline its three sibling categories
  have; two em dashes remain in the CP; two stray non-Arial runs remain in the RS.

### Citations (part of house style from 2026-08-19)

- **System**: stable citation keys in the markdown using pandoc-citeproc syntax,
  `[@key]` or `[@key1; @key2]`, placed immediately after the specific claim (and
  its punctuation) they support. Multiple references per claim are allowed and
  encouraged where warranted. Never hard-code reference numbers in prose.
- **Bibliography**: `references.yaml` is the live bibliography and single source
  of truth. Every entry records the full reference, doi/pmid/url, a `supports`
  note stating exactly what was verified, and the verification date. **No entry
  and no citation is added until the source has actually been checked against the
  specific claim** — prefer primary literature, federal data, and authoritative
  sources; never stretch a related source to fit.
- **Rendering**: `tools/render_pdf.py` resolves keys to numbered superscripts by
  first appearance (renumbering is automatic when citations are added or moved)
  and appends a numbered REFERENCES page (review-only; in the application,
  references go in the Bibliography & References Cited attachment and do not
  count against the 12-page limit). The renderer errors on unknown keys, reports
  bibliography entries no longer cited (orphan check in both directions), and
  counts `[@todo: description]` markers for claims whose source is still
  unverified.
- **Submission gate**: a document is not submission-ready until a final
  citation-integrity pass shows zero `[@todo:]` markers, zero legacy `\[cite\]`
  placeholders, zero unknown keys, and every cited entry re-verified against its
  claim. The pandoc-compatible syntax means the Google Docs export can carry real
  citations without manual reconstruction.

### Page discipline

- NIH page limits (confirmed 2026-08-19 against the NIH page-limits table for
  SBIR/STTR R44 activity codes): **Research Strategy 12 pages · Commercialization
  Plan 12 pages · Specific Aims 1 page**. NOFO instructions supersede the table;
  final confirmation against the governing NOFO is owed before submission (the NOFO
  number is not yet recorded in this workspace).
- Page budget is part of house style: every figure, table, and paragraph has an
  opportunity cost. Orientation blocks stay well under one page; the detailed aim
  protocols get the overwhelming majority of the Approach budget. Measure with
  `tools/print_check.py` (or `tools/render_pdf.py` + pymupdf) before any export.

## 7. Provisional claims (flag, never silently harmonize)

- **Market count: resolved to twelve** (2026-08-25), derived twice and with composition
  specified: 4 anchors + 8 replication markets, 6 of them in two payer clusters
  (`CANON.md` §2.9). CP §9 still says 18 and is stale. **Award-end payers/revenue/run-rate**
  remain provisional with three versions in circulation; reconcile RS → CP → Aims in one
  pass once TJ's Aims land.
- **AI agents**: agentic layer is in development in a separate codebase (integration
  ~3 months out, pre-award). Never described as existing today; current state =
  structured screening/matching + AI-drafted, expert-approved guidance.
- **MedJobs pilot outcomes** (900 applications; 100 accepted; 25 vs "about 100" placed)
  — resolve from Logan's consolidated pilot record (pending task, owner: Logan).
- Unsourced CP additions ("~3 families converted/month"; "+50K profiles annually").
- Full register: `evidence-ledger.md`.

## 8. September 1 go/no-go

No postponement decision now; two-week sprint. TJ's estimate ~35 impact score → target
**≤30 by Sept 1**, aspiring toward 10. On Sept 1: genuinely competitive → submit;
otherwise seriously consider postponing — sunk effort is not a reason to submit. Every
revision is judged by "does this materially reduce a likely reviewer concern," and every
section must be: clear for a tired reviewer · rigorous for a scientist · concrete for an
investor · true to what Olera has built · connected to commercial readiness.

## 8b. Who we are writing for (ratified 2026-08-19)

Four reviewer behaviors, served simultaneously: **top-down** (one continuous
argument across sections), **section-by-section** (each section stands alone while
a single criterion is scored), **scanning** (headings, first sentences, figures,
captions, and closings must carry the argument by themselves), and
**copy-and-paste** (supply quotable sentences stating why something is significant,
innovative, feasible, or commercially important). Deliberate repetition,
signposting, and cross-referencing are good grantmanship when they serve one of
these four readers. Full statement: `DRAFTING.md`.

## 9. The paragraph loop (ratified 2026-08-19 — the working method)

One paragraph at a time, in document order:
**Purpose → Requirements → Evidence → Argument → Prose → Continuity →
Verification.** Define the paragraph's one job; check what the solicitation, SF424,
and review criteria require there; substantiate claims (own code and materials
first, then primary sources); state the simplest truthful argument before grant
language; write plainly with the rigor underneath; mind what the paragraph receives
and hands off; verify against drift, gaps, and skeptical review before locking.
Full method, authority hierarchy, and grounded lessons: **`DRAFTING.md`**. This is
the default whenever Logan says "next paragraph."

## 10. Locked sections (do not reopen without cause)

**Superseded by the figure sequence (2026-08-25).** Locks below still record what was
ratified and when, but three of them now conflict with `CANON.md`, which is current.
Do not draft from the older version and do not harmonize in the other direction.

- **The Aim architecture** in `specific-aims.md` (Aim 2 = provider capacity plus two
  provider products; Aim 3 = revenue model) is superseded. Current: Aim 2 is the
  workforce aim, product and pricing consolidate into Aim 3, connection completion is
  measured inside Aim 1 (`CANON.md` §2.8, §6.2). The page itself is not rewritten;
  TJ owns the next Aims pass and this is the architecture it should start from.
- **The product count** in Significance and in Key Innovation 1's surrounding text
  assumes more than one CRP product (`CANON.md` §6.1).
- **The workforce framing** in Key Innovation 2 is students-as-strategy rather than
  workforce expansion with students as the first tested population (`CANON.md` §2.4).


**Key Innovation 1** is locked as of 2026-08-19, with Figure 3 wrapped top-right.

**The Specific Aims page is locked as of 2026-08-21**, rebuilt on `SPINE.md` and the
aims-spine-audit and render-verified at one house-style page. Logan sent it to TJ and
Qiping for directional review the same day; their feedback routes through Logan and is
the only path to reopening. Note the KI lock above predates the Innovation reorder
(strategic-context §5); the numbering reference is stale.

**Successor pending (2026-08-23):** a proposed replacement Aims page derived from the
ratified logos outline exists at `passes/aims-logos-draft-2026-08-22.html` and is out
for team review (David, Marcia, TJ, Shupeng). It has not replaced `specific-aims.md`;
adoption is Logan's call after feedback. Until then the 2026-08-21 lock stands and
conflicts between the two are flagged, not harmonized.

Significance is complete and locked as of 2026-08-19: **The unmet need** (+ Figure 1),
**The product and the business model** (+ Figure 2 + the accomplishments block +
synthesis), **The two-sided market**, **Competitive environment and our advantage**
(+ Table 2 + the workforce paragraph + the family-side signpost), and **Hurdles to
adoption**. Reopen only when downstream work reveals a real inconsistency, and flag
rather than silently edit.

Open obligations these sections created, all recorded in
`passes/removed-material-log.md`: Preliminary Work says the pilot "placed about 100"
against the locked "more than 20" (**required** correction); the 150-providers-per-month
figure needs verification against live data; Peach Creek's payment and the 20+
placements need to reach the consolidated pilot record; the state-by-state eligibility
line needs a home in Key Innovation 3.

## 11. Current priority

**Paused for team review (2026-08-25).** A 40-slide concept deck covering the whole
application (`passes/payer-horizon-visuals-2026-08-24.html`, rendered PDF alongside)
went to David, Marcia, TJ, and Qiping. Its conceptual output is `CANON.md`, its method
output is the dated section at the end of `DRAFTING.md`, and its visual output is the
sequence section at the end of `figures/README.md`. **When prose drafting resumes, read
`CANON.md` first**: sections 2 and 3 are the working foundation, section 4 is what team
feedback may move, and section 5 is the list of things not to state as settled. First
items on return, once feedback lands: TJ's Aims pass on the new architecture, the third
market axis (SES or waiver generosity), and the Commercialization Plan's missing
Section 10 and Fundraising Plan headings. The paragraph below is the pre-pause
priority, kept for history.


**Sprint to submit (2026-08-24).** The team is submitting this round (Sept 4;
Sept 1 internal check). Division of labor from the 08-24 meeting
(`meetings/2026-08-24-tj-qiping-narrative-rebase.md`): TJ owns the next Specific
Aims pass (A/B/C versions, ~24-48h, Slack signal) and customer letters; Qiping
owns human subjects and an Aim 3 simplification; Logan owns application
initiation, budget + justification, biosketches, Drive submission folders, and
the rest of the SF424 package. Claude's role while TJ drafts: no competing
narrative drafts; support Logan's assembly lane, prepare the truth-and-
consistency review for TJ's versions (evidence locks, AKS constraint-scoped
wording, hypothesis coverage), and produce the canonical product descriptions
Qiping asked for once ratified. Meeting-level decisions pending ratified text:
staffing-forward product story, trim Managed Ads emphasis (working name
"Boost"), interview-anchored real-billing pricing design in Aim 3. The logos
outline remains the ratified truth layer; the narrative core on top of it is
TJ's to propose. The paragraph below is the pre-pause priority, kept for
history; the 2026-08-23 pause note above it is superseded by this sprint.

**Paused for team review (2026-08-23).** Drafting is paused while David, Marcia, TJ,
and Shupeng review the intellectual spine (`passes/logos-outline-2026-08-22.md`,
ratified by Logan) and the new Specific Aims draft derived from it
(`passes/aims-logos-draft-2026-08-22.html`). When work resumes, re-base on those two
documents as the conceptual baseline, subject to the team's feedback; do not
automatically carry forward older formulations. First items on return: incorporate
feedback, ratify two-vs-three paid products (then reconcile CP and section 5 here),
re-derive the Approach from the logos (blocks Qiping), and settle 12 vs. 18 markets.
Retrospective and carried-forward principles: `DRAFTING.md`, entry dated 2026-08-23.
The paragraph below is the pre-pause priority, kept for history.

**72-hour goal (from 2026-08-17): Research Strategy Marcia-ready.** Pass order:
**Aim 2 (active)** → Aim 3 → Preliminary Work → Aim 1 → Significance/Innovation →
timetable + consistency sweep → export to Drive for Dr. Ory's review. Working method:
per-section brief from Claude, then line-by-line with Logan, one rewrite round.
Logan's edits are challengeable; preserve the strongest truthful argument, not the
draft. Truthfulness rule: never infer a feature, metric, or dataset exists because it
would strengthen the proposal — distinguish code-proves-exists / proven-used /
in-development / proposed, and ask when sources don't settle it.
