# Strategic Context: the 2026-08-20 Business Diagnosis and What It Means for the CRP

**What this is.** An internal strategy and memory document, not grant prose. It records
how a business diagnosis run on 2026-08-20 (in the strategy session, working from live
platform data, Search Console exports, the codebase, and market research) reshaped our
understanding of Olera's commercialization problem, and how that understanding now frames
the CRP Research Strategy. Future sessions should read this to understand *why* the
current strategic decisions were made, not merely what the Research Strategy says.

**How to use it.** The evidence tiers and unresolved questions here are inputs to
drafting, not settled grant claims. Nothing in this document overrides the evidence
ledger, the house style, or a ratified decision in `README.md`. Where this document and
live data disagree, pull the data.

**Status of the Research Strategy at time of writing.** Logan's externally drafted RS
(docx, imported to the strategy session 2026-08-20) has restructured Significance and
Innovation; the Approach is character-identical to the workspace `research-strategy.md`
except for two punctuation characters. The two versions are NOT yet reconciled. Do not
merge or edit `research-strategy.md` until Logan says the strategic discussion has
landed. A divergence log lives in the strategy session's running notes; the ratified
decisions so far are recorded in section 5 below.

---

## 1. How the thinking evolved

The day started with a valuation question: what could Olera sell for today? Working
through that honestly forced a diagnosis of the business that turned out to matter far
more than the valuation. The sequence:

1. **Valuation exercise.** As-is value is low (roughly $25K to $120K) because every
   buyer's method starts from profit, and profit is zero. The gap to a meaningful exit
   ($300K to $700K+) is not a negotiation problem; it is the absence of a validated,
   repeatable economic transaction.
2. **Traffic diagnosis.** Classified the Search Console exports: roughly 90 percent of
   organic clicks are navigational lookups of a specific named facility; about 2 percent
   are care-purchase intent ("assisted living near me" sits at position 26 to 58).
   Editorial pages are the most efficient asset (5.4 clicks/page/week at position 8.5
   versus 1.8 for provider pages). The 15,500 monthly visitors are real, but "15,500
   families seeking care" is not a supportable reading.
3. **Funnel diagnosis.** Demand arrives and nothing happens to it: 1,228 of 1,229
   inquiries sit pending; roughly 93 percent of family questions are never answered;
   providers ARE notified (email and SMS paths verified in code) and do not respond.
   Four of the ten funnel stages, including both stages that define success (two-way
   conversation, care established), are not instrumented at all.
4. **Marketplace diagnosis.** 1,133 lifetime inquiries spread across 845 providers in
   662 cities is about 1.34 inquiries per provider ever, roughly 0.5 per city per month.
   No liquidity can form at that density. 74,000 provider records are records, not
   supply; by any honest definition of active supply (consented to receive families,
   verified channel, current capacity answer, responds within 48h) the count today is
   near zero. Benefits and the marketplace barely interact (2 of 321 benefits-intake
   families ever inquired).
5. **Regulatory discovery.** Per-referral or per-placement compensation in
   Medicare/Medicaid-funded segments (home health, SNF, hospice) implicates the federal
   Anti-Kickback Statute and state patient-brokering analogues. Zocdoc needed two OIG
   advisory opinions to run per-booking pricing. This materially constrains which
   revenue models Olera can run in three of its six provider segments.
6. **Comparables.** Thumbtack built a request-and-quote board at scale and abandoned it
   (browsing/quoting was too much work for pros and bid-gating capped supply; instant
   push more than doubled 3+ quote rates). Angi/HomeAdvisor broadcast leads and earned a
   $7.2M FTC settlement. A Place for Mom monetizes placements via human advisors and is
   documented (Washington Post 2024, Senate Aging letter) steering families. Psychology
   Today sells providers distribution against category intent the provider cannot win
   alone. Zocdoc solved cold start city by city, door to door, free to providers.
   Sixteen of seventeen major marketplaces launched constrained to one city or category.
7. **Needs Board pressure test.** A family-posted needs board fixes the honesty problem
   but inherits the liquidity problem, and eldercare is a speed market (75 percent of
   families choose the first responder; the response window is minutes, not days). The
   valuable half of the idea is the structured, qualified, consented family need,
   distributed by push to a small number of matched providers with a human fallback.
   The board itself is a scaling artifact to be earned by volume, not a starting
   architecture.
8. **Return to the CRP.** The grant is, in a real sense, the treatment plan for the
   diagnosed condition: the CRP funds exactly the instrumentation and construction of
   the funnel stages that are currently blind, plus the local concentration the
   marketplace lacks, plus the revenue validation the company has never run.

## 2. The temporal frame (ratified with Logan, 2026-08-20)

The CRP does not fund what Olera needs to do immediately. Roughly one more year of
Phase IIB runs first (through ~May 2027). The RS must consistently distinguish four
states:

- **Exists today:** matching, screening, guidance, database, national organic reach,
  the provider tools at their honest maturity labels (per evidence ledger).
- **Remaining Phase IIB year completes (already committed in the Year 2 RPPR):** the
  Q2 2026 engineering cycle (next-gen multi-agent system + UI), the n=200 diverse-cohort
  evaluation, EMCR expansion beyond 100,000 entities, publications, and (per the
  provisional-claims register) production integration of the agentic layer pre-award.
- **CRP develops and tests (2027 to 2030):** execution loop, follow-up loop, closed-loop
  outcomes, local market concentration, the referral handoff, pricing under real
  billing, unit economics, the investor evidence package.
- **Mature product:** the Figure 2 vision; described as intent, never as current state.

Two standing rules follow. The CRP must not propose work IIB Year 3 is already funded to
do (overlap risk; reviewers at the same institute hold the RPPRs; Task 1.2's n=25 ADRD
usability study is the closest to that line and must be explicitly differentiated as
evaluating the execution/follow-up capability no IIB participant ever used). And
Preliminary Work should state what the remaining IIB year will complete by award start,
so the CRP visibly begins where IIB ends.

## 3. The business-model position (current, honest)

**Leading hypothesis: a free core marketplace with optional provider-side commercial
products.** Families and providers find and connect with each other at no charge; Olera
does not sell family leads or take referral fees; provider organizations (home care,
assisted/senior living, memory care, skilled nursing, home health, hospice) are the
intended paying customers, buying optional products that address problems adjacent to
the connection.

Why free connections (reasoning, sanity-checked):

- **Regulatory:** dissolves the AKS/patient-brokering exposure across all six segments
  at once, including the three Medicare/Medicaid-funded ones.
- **Competitive:** the referral-fee incumbents' steering incentives are documented in
  the federal record; "unsteered navigation" is a defensible, scoreable advantage only
  if connections stay free.
- **Liquidity:** no per-connection toll lowers friction on both sides.
- **Mission-model alignment:** the CP's mission-critical constraints already commit to
  free family access.

What this deliberately forecloses (recorded so the choice stays visible): the placement
fee, the one proven large transaction in eldercare ($3,500 to $12,000 per move-in, the
APFM/Caring model). It requires a human advisory operation and carries the steering
incentive; the principle is revisable post-award in private-pay segments without
contradicting the CRP. In the grant, state free connections as the design under test,
not an eternal vow; Aim 3's pre-committed failure case covers the alternative.

**The two leading commercial hypotheses** (evidence-tiered):

| Product | Evidence tier | What is demonstrated | What the CRP must test |
|---|---|---|---|
| Staff Recruitment | Demonstrated willingness to pay | Franchisees of four national brands plus Peach Creek paid or agreed to pay ($275/mo, pending record consolidation); 900+ applicants; 20+ placements | Scalable delivery economics beyond one campus and manual ops |
| Managed Ads | Preliminary evidence, operating product | Real campaigns since July 2026, billing wired; ~13 providers named $50 to $150/mo budgets in writing; zero collected recurring revenue | Price, conversion, retention under real billing |

Both charge into documented, recurring provider budget lines (the audit-proofed ≥$5B/yr
marketing-and-recruiting denominator in `market-denominator.md`). Category-level
willingness to pay is established by the industry's existing spend; product-level
willingness to pay is the CRP's question. The narrowing from four candidate tools to two
is convergence, not retreat: the two that survived are the two that produced paid or
operating evidence. (Terminology note: the two-product framing supersedes README §5's
"exactly three products" and needs a ratified README update with TJ; "premium offerings"
overstates maturity and "commercialization hypotheses" as a noun understates the built
products. Recommended pattern: concrete product nouns, hypothesis language attached to
the revenue model.)

**The free core is itself instrumented as a hypothesis.** Aim 3's cross-side liquidity
analysis (provider value, retention, and margin modeled against lagged qualified family
demand) is the experiment that tests whether the free marketplace is the paid products'
acquisition channel and retention driver. Significance should state the architecture as
the hypothesis that this analysis exists to resolve.

## 4. Why the uncertainty is fundable (the writer's-block resolution)

The solicitation's Statement of Need must answer why government funding is critically
needed and why third-party investment would not otherwise fund the work. A validated
business model would make the honest answer "it wouldn't be needed." The CRP's
eligibility logic therefore presupposes unresolved commercialization uncertainty; the
Significance criterion is explicitly maturity-calibrated ("to the extent appropriate for
the maturity of this project"); the CP criterion scores whether plans are *reasonable*
and projections *realistic*, not certain.

The distinction that matters:

- **Fundable uncertainties (Olera has these):** price, packaging, conversion, retention,
  unit economics, cross-side coupling, whether the execution loop moves aid-established
  rates. Specific, testable, resolvable in three years.
- **Strategy-incoherence uncertainties (Olera does not have these):** who the customer
  is, what the products are, which problems they solve. Segments are named, products are
  built, pain is documented in 200+ interviews, paid evidence exists on one of two lines.

The discipline formula for every commercial claim: what we know, what we do not, how the
award resolves it, what happens either way. The draft RS's Approach already works this
way (pre-registered pricing experiments, decision rules, pre-committed failure
reporting); the writer's block traced to Significance asserting what the Approach
correctly treats as a question. Fix the mode of Significance, not its confidence.

## 5. Decisions ratified in the 2026-08-20 strategy discussion

1. **Two-product framing stands** (Managed Ads, Staff Recruitment). Approach
   inconsistencies (four modules) are known and deliberately deferred until the
   top-down pass reaches the Approach.
2. **Market sizing returns** at the head of a retitled family-side competitive section
   ("Competitive Environment and Marketplace: Family Side" or similar), with a one-line
   signpost separating family-side sizing from the provider-side landscape. Placeholders
   for now (section 7); rigorous sizing deferred.
3. **Innovation order stands** (AI navigation, database, workforce). README §10's
   Key Innovation 1 lock now points at a different innovation; README is stale on this
   and on the three-product terminology.
4. **The referral handoff / care-connection problem earns both discussion and an
   experiment** when the pass reaches the Approach.
5. **The CRP is built from the reality of the business,** not backward from what sounds
   fundable: the aims should test the uncertainties that actually decide whether Olera
   becomes a sustainable company.

## 6. Unresolved questions (do not silently resolve)

- **Pilot record conflicts:** "placed about 100" (RS Preliminary) vs the locked
  "more than 20" (Significance/accomplishments); 100 accepted vs 50 accepted appears in
  different drafts. Owner: Logan's consolidated pilot record.
- **$275/month vs the free-pilot agreement:** the current canonical staffing pilot
  agreement says the pilot is free; the RS cites paid franchisees. Both can be true
  (different pilots, different times) but the one-sentence reconciliation must exist
  before review.
- **The 2,400 leads/month figure:** needs a definition before a verification. It is an
  order of magnitude above `connections` inquiries (~340/mo), so "lead" means something
  broader; whatever it means, the current fate of those leads (largely unanswered) must
  not be discoverable as a surprise. Decide what is claimed and instrument it.
- **Traffic composition wording:** "15,500 visitors" is verified; "15,500 families
  seeking care" is not supportable (≈90 percent navigational clicks). Preliminary Work
  wording must survive an SEO-literate reviewer or a diligence pass.
- **Provider responsiveness baseline:** not currently measured. Instrumenting response
  rate and time-to-response is cheap pre-award operations work that converts the CRP's
  weakest assumed claim into a measured baseline. Strongly recommended during the
  remaining IIB year; not CRP-fundable work.
- **12 vs 18 markets, award-end numbers:** still provisional per README §7; locked only
  after the Aim 3 redesign.
- **Whether "Growth Suite" survives as a name** under the two-product framing.
- **Handoff experiment design:** agreed in principle; shape and placement (inside Aim 2
  referral module vs its own task) undecided until the Approach pass.

## 7. Market-sizing placeholders (preserved; do not refine yet)

Intent: one or two sentences at the head of each competitive/market section; sizing must
not consume disproportionate space. Rigorous pass deferred.

**Family side** (head of the retitled family-side competitive section):

> More than 9 million eligible older adults leave an estimated $58 billion in benefits
> unclaimed each year, and tens of millions of family caregivers coordinate care without
> professional help. [PLACEHOLDER: $58B / 9M verified (`ncoa2025`); caregiver count to
> be verified against AARP Caregiving in the US 2025 (`aarpCaregiving2025`) before use.]

Assumptions and notes: sized in families/unclaimed aid rather than dollars spent, because
the family-side product is navigation and the unclaimed-aid figure motivates it. The
retired-figures rule in `market-denominator.md` still applies: no analyst TAM figures.

**Provider side** (head of the provider-side competitive section):

> Roughly 165,000 U.S. eldercare providers spend an estimated $5 billion or more each
> year on marketing and staff recruiting, the two problems the provider products
> address. [PLACEHOLDER wording; figures already audit-proofed end to end in
> `market-denominator.md` (`oleraProviderCount`, `oleraAcqSpendEst`), so this sentence
> may survive as-is.]

Assumptions and notes: the ≥$5B floor is deliberately conservative (exclusions listed in
`market-denominator.md`; mid-range read $6 to 8B). The two-product framing maps exactly
onto the two spend components (client acquisition ≈$3.9B, caregiver recruiting ≈$1.1B),
which is the coherence argument worth keeping when the section is drafted.

## 8. The story spine

The one-paragraph conceptual test for the Research Strategy. Every paragraph,
experiment, milestone, and claim in the RS should advance this sequence; anything that
does not should justify its presence.

> America's eldercare system fails twice: $58 billion in aid goes unclaimed because
> navigation is too complex, and the providers who could deliver care cannot find
> clients or staff. Across SBIR Phases I to IIB, Olera built the foundation to attack
> both failures: a national expert-curated database of programs and providers, an
> eldercare-specific AI navigation system validated for acceptance with family
> caregivers, national organic family reach, an onboarded provider base, and one
> provider product with demonstrated willingness to pay. What remains unproven is the
> transaction: navigation today ends at information rather than established care,
> demand and supply are spread too thin nationally for either side to reliably find the
> other locally, and no revenue model has been validated under real billing. The
> remaining Phase IIB year completes the navigation product itself: production
> integration of the AI-agent system, evaluated at scale (n=200), over a database
> exceeding 100,000 records. The CRP then funds what no private investor will yet fund:
> building the execution and follow-up loops that carry families from eligibility to
> established care, concentrating families, providers, and a student caregiver
> workforce in twelve local markets until connections reliably complete, and testing
> whether two provider products (Managed Ads and Staff Recruitment), sold against
> providers' two largest documented spending lines while the core marketplace stays
> free for families and providers alike, generate the recurring revenue, retention, and
> unit economics that make each market self-funding. The award succeeds when an
> independently verified model shows provider revenue covering the cost of serving each
> market's families: the evidence that makes Olera investable, scalable, and
> permanently free for the families it serves.

---

*Created 2026-08-20 in the CRP strategy session, from the business diagnosis run the
same day. Companions: `evidence-ledger.md` (claim status), `market-denominator.md`
(sizing arithmetic), `passes/marketplace-liquidity.md` (operational liquidity layer),
`solicitation-reviewer-reference.md` (what reviewers score).*
