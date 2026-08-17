# Aim 2 Pass — Brief (2026-08-17)

Pass artifact for the line-by-line revision of Specific Aim 2 (Growth Suite validation).
Delete or archive when the pass closes. Companion: `../evidence-ledger.md`,
`../figures/MANIFEST.md` (Table 1 needs-revision), README §4–6.

## A. What Aim 2 currently is

A four-module validation: Staffing, Referral network, Review generation, Managed Ads,
grouped as "Staffing" + three "Clients" tools. Verify (2.1: end-to-end test case per
module) → Validate (2.2A formative usability, 30 providers + 20 students; 2.2B
prospective field test, ~80 provider accounts, ~100 students, GEE analysis, CFIR
qualitative across non-activators/one-time/retained users) → Scale (2.3: channelized
provider/student acquisition in the twelve markets with cost models and wave gates).
Modules graduate independently into Aim 3.

## B. Decisions to make before editing prose

1. **Taxonomy migration (settled direction, open details).** Three products are canon:
   Staffing · Visibility/Boost · Conversion. Proposed mapping of the current four
   modules: Managed Ads + provider profiles + **Review generation → Visibility**;
   **Referral network → out of the paid Suite entirely** — the CP states qualified
   family leads are free (anti-steering positioning), so the referral network is the
   platform's free base layer, instrumented but not priced; **Conversion = the third
   product**, assembled under the CRP from built components (inbox, follow-up nudges,
   intake workflow). Open question for Logan/Qiping: does the free-lead layer stay a
   measured *context variable* in Aim 2 (cross-side liquidity) rather than an
   intervention module?
2. **Unified intervention vs. independent graduation.** Meeting direction: present the
   Suite as one intervention, instrument module use, analyze module-specific behavior
   secondarily. Current text: four independent modules with independent graduation.
   Proposed resolution: ONE intervention (the Suite) with three named products; one
   shared implementation frame (usability, adoption, workload); product-specific value
   endpoints; per-product graduation gates retained (operationally honest). Confirm.
3. **Conversion honesty posture.** Codebase: Conversion does not exist as a product;
   its components do. Aim 2 must say so: engineering-status preamble (exists / partial /
   completed under CRP / verified before validation) and no "launched July 2026"
   language for Conversion.
4. **Value-endpoint set per product (revenue-adjacency test).** Proposed: Staffing →
   qualified applicants, hires, first verified paid shift, 30/90-day retention;
   Visibility → qualified inquiries attributable to the product (ads + profile +
   reviews); Conversion → scheduled assessments and admissions/service starts from
   leads of any source. Each endpoint must pass: "if achieved, a reviewer sees why
   providers would pay."
5. **Sample-size arithmetic must be redone.** "At least five users per module within
   each role group" implies 4 modules × 3 roles × 5 = 60, but N=30 providers. Under
   three products: 3 × 3 × 5 = 45 — still ≠ 30. Either roles map to specific products
   (state it) or the N changes. Field test "≥20 exposed per module" gets easier with
   three products; restate. NASA-TLX currently scoped to "staffing and referral" —
   referral is leaving the Suite; re-scope.

## C. Claims inventory (Aim 2 + its rationale)

| Claim in current text | Status | Action |
|---|---|---|
| "Growth Suite consists of four tools" + "[SETTLE: three or four]" (Preliminary) | superseded by decision | migrate to three products |
| "built and launched each nationwide in July 2026" | overstated (ledger) | replace with per-product maturity: Boost/Managed Ads operating with billing; Staffing free pilot (payments stubbed); Conversion components only |
| "725 providers have onboarded" | pullable; Fig 3 artwork says 725; CP says ≈750 | verify once, unify |
| "Three of the four solve that problem without drawing on Olera's family volume" | logic changes under 3-product taxonomy | rewrite (Staffing and Visibility do; Conversion works on any lead source) |
| Staffing "has paid evidence" ($275/mo, placements) | records-exist; 25 vs ~100 placed conflict | cite Logan's consolidated pilot record when built |
| "twelve study markets" | consistent with Aims; CP §9 says 18 (provisional) | leave 12; do not propagate 18 |
| Task 2.1 "4 of 4 modules", Table 1 image "All four modules pass in test" | count changes | update text + rebuild Table 1 artwork |
| "module runs where a health-professions pipeline has been established" | consistent with market-selection criteria | keep; define "established" |

## D. Reviewer-concern map

1. *What exactly is the intervention?* (the meeting's central question) — currently
   scattered across Rationale + module paragraphs; needs one compact definition block
   answering: modules, what each does, who uses which, what participants actually do,
   what data are generated, how activities lead to endpoints, what success is, why
   success = commercial progress.
2. *Is this engineering dressed as research?* — engineering-status preamble separates
   build work from the research questions (adoption, value delivery, workload,
   barriers) that CRP resolves.
3. *Biased sampling* — already addressed (non-activators, disengagers included); keep
   prominent.
4. *Endpoints academically measurable but commercially meaningless?* — apply the
   interpretation test to every metric bar (≥70% value endpoint, ≥50% repeat use,
   cost ceilings, automated-share-rising) and state the commercial reading inline.
5. *Human-subjects boundaries* — employment/research separation language exists and is
   good; keep. IRB scope statement for provider/student studies should mirror Aim 1's.

## E. Proposed restructured skeleton (for discussion, not yet drafted)

1. **Rationale** — three provider problems → three products; evidence-to-date one line
   each with honest maturity; 725/≈750 base (verified number); why Staffing leads.
2. **The intervention** (new block) — the Provider Growth Suite as one intervention,
   three products; per product: what it does, who at the provider uses it, what the
   provider/student is asked to do, what data it generates, its value endpoint. Free
   referral layer described as platform context, not a priced product. Engineering
   status preamble (exists / partial / completed under CRP / verification first).
3. **Task 2.1 Verify** — unchanged in spirit; counts and module list updated.
4. **Task 2.2 Validate** — same two-stage design; unified-intervention framing;
   corrected sampling arithmetic; endpoints per §B.4; NASA-TLX re-scoped.
5. **Task 2.3 Scale** — largely sound; ensure every cost/value bar carries its
   commercial interpretation sentence.
6. **Decision point** — per-product graduation into Aim 3, stated against the three
   products; deliverable list updated.
