# The Simplified Aims 2–3 Architecture (2026-08-18)

Supersedes `aim2-aim3-architecture.md` (Architecture C) and revises
`aim2-aim3-study-design.md` where they conflict. Verdict first: Logan's simplified
model is correct in its core move — let instrumented commercial use carry the value
question; reserve human-subjects research for what analytics cannot answer; make Aim 3
a real commercial test on new customers. It fails in exactly four places; each is
repaired with a small, named addition. The result below is the recommended
architecture.

## 1. Why C was over-built (honest accounting)

Architecture C assumed the ~80-account enrolled cohort was the *only* source of value
evidence. Everything complicated followed from that assumption: prospective
eligibility strata, per-product evaluability thresholds, a suite-level primary
endpoint to give the small cohort something it could support, and three readiness
states to manage products maturing at different rates inside a small sample. Logan's
reframing removes the assumption: the platform already instruments every activated
account (verified in the codebase), acquisition keeps adding accounts through the
award, and value events (hires, inquiries, admissions) are recorded operationally at a
scale no enrolled cohort can match. Once that is the primary evidence, the enrolled
study shrinks to its honest job — usability, perceived value, barriers,
willingness-to-use/pay, and *why* — and the states collapse into one advancement rule.

## 2. The four places the simple model fails, and the minimal repairs

1. **Self-selection.** Value rates among self-selected users overstate value for
   typical providers; a purely observational Aim 2 could discover this only in Aim 3,
   after paying customers churn. *Repair:* the never-user study is one cohort with two
   phases — structured evaluation first, then a 3–6-month instrumented field-use
   follow-up. Fresh providers' real-world value delivery is observed before anything
   is priced. (One cohort. No strata machinery.)
2. **Free-to-paid conversion disappears.** Grandfathering *everyone* free removes the
   measurement the CP's national self-serve channel depends on (claimed base × ~4% ×
   ARPU). *Repair:* grandfather the research participants only (never-user cohort +
   early adopters, ~40–60 accounts). The broader free commercial base — never research
   subjects — receives the paid upgrade offer in Aim 3 as ordinary commerce. Both
   commercial funnels get measured; the research cohort stays clean.
3. **Denominators.** "Staffing helps providers hire" is meaningless without knowing
   who *could* hire (hiring need + campus in market). *Repair:* pre-specified cohort
   definitions in the observational analysis plan — analysis definitions, not
   enrollment machinery. (Two of three already exist as product gates in code.)
4. **The transition still needs a rule.** *Repair:* one pre-registered advancement
   rule — "a product enters Aim 3 pricing when its verification is passed and its
   value evidence meets the pre-registered bar; products that miss are improved or
   dropped and may enter at the pre-registered second pricing round" — anchored to the
   mid-Year-2 calendar gate. Formal PRICE-READY / VALUE-PENDING / NOT-ADVANCING states
   are retired: they added vocabulary, not science.

## 3. The recommended architecture

```
Built components + existing real-world use (~725 claimed, growing; Managed Ads
billing live; staffing pilot; 2,400 leads/mo)
        │
        ▼
AIM 2 — Do the products work and create provider value?          (Years 1 → mid-2)
  A. VERIFY (no human subjects): each product's full path runs end-to-end,
     counts reconciled against outside records.                  [Task 2.1, kept]
  B. INSTRUMENTED REAL-WORLD USE (operational data, the primary value evidence):
     all activated accounts in the 12 counties (expected several hundred by
     mid-award), pre-specified value-event definitions and denominators —
     Staffing: hires w/ first verified paid shift, among providers with hiring
     need + campus pipeline · Visibility: attributable qualified inquiries, among
     providers with complete profiles · Conversion: admissions from tracked
     leads, among providers with live inquiry flow. Rates with CIs; time-to-first-
     value; repeat use. N here dwarfs any enrolled cohort.
  C. NEVER-USER PROVIDER STUDY (the human-subjects core): one cohort, ~30–40
     provider organizations new to the products, two phases — structured
     evaluation (usability, perceived value, barriers, willingness-to-use,
     stated willingness-to-pay/price sensitivity) then 3–6 months of instrumented
     field use; interviews include disengagers. ~20 students in usability +
     ~100 in the operational staffing pipeline with a consented survey subset.
        │
        ▼
ADVANCEMENT RULE (mid-Year 2, pre-registered):
  enough value evidence to commercially test?  yes → priced in Aim 3
  no → improve or stop; second pricing round is the catch-up door
        │
        ▼
AIM 3 — Will providers actually pay?                             (mid-2 → Year 3)
  Real prices, real paywalls, real billing. Two ordinary commercial funnels
  (neither is a research cohort):
    • NEW CUSTOMERS — providers who meet the priced offering at first contact,
      ~6 new counties + continuing acquisition in the 12. The clean test.
    • FREE-BASE UPGRADES — existing free commercial users (non-research) offered
      paid plans: measures the free-to-paid motion the CP model assumes.
  Research participants and early adopters: grandfathered free; their continued
  use remains operational evidence.
  Measured: which products they buy · single vs bundle · prices paid · conversion ·
  retention/churn · revenue per account · CAC · cost to serve · margin · county-level
  sustainability. Pricing arms across matched counties; pre-registered second round;
  consented survey/interview layer on top; CPA rebuilds the model from billing records.
        │
        ▼
COMMERCIAL READINESS: do they buy, stay, and produce sustainable economics —
  measured, by product, independently verified. Feeds the CP break-even story.
```

## 4. Answers to the ten questions

1. **Can instrumented use + a never-user study credibly establish value?** Yes — and
   with *better* precision than C: several hundred activated accounts give value-rate
   CIs of roughly ±5–6 points where C's 80-account cohort gave ±11. The never-user
   field phase covers the self-selection gap. What this cannot do is support causal
   efficacy claims — neither could C; both are honest estimation.
2. **What human-subjects research is actually necessary?** Exactly the list Logan
   wrote: usability, perceived value, adoption barriers, willingness-to-use,
   willingness-to-pay, and why providers behave as they do — plus student
   participation protections and Aim 3's survey/interview layer. Product-performance
   evidence is operational data. Qiping's formative usability design (roles, SUS,
   AIM/IAM/FIM, saturation rule) survives as the evaluation phase of the never-user
   study; the heavyweight 80-account prospective field protocol with GEE machinery is
   retired, replaced by the pre-specified observational analysis plan (which is real
   methods work: cohort definitions, attribution windows, bot filtering — rigor
   without trial cosplay).
3. **WTP in Aim 2 as preliminary, payment in Aim 3 as definitive?** Yes. Stated WTP
   and price sensitivity move into the never-user study (preliminary pricing
   evidence, seeds the Aim 3 price points); the Van Westendorp instrument already in
   Aim 3 can move up or run as a short refresh before arms open — a detail for
   Qiping. Actual payment is Aim 3's primary endpoint and outranks every survey.
4. **Grandfather early users?** Yes for research participants and early adopters
   (~40–60 accounts) — it removes the research-to-customer conversion problem
   entirely. But not for the whole free base (repair #2): the non-research free base
   gets the upgrade offer as commerce, or the CP's self-serve conversion input is
   never measured.
5. **Cleaner commercial test, less early-adopter bias?** Yes — the payment test's new-
   customer funnel contains no one who received months of free access as a research
   courtesy. This is structurally stronger than C's "conversion cohort," which mixed
   research goodwill into the conversion rate.
6. **Formal readiness states?** Retired. They were invented to manage C's complexity.
   One pre-registered advancement rule plus the existing second-round and
   problems-and-alternatives ladders express everything the three states did. If a
   product clearly works, we price it; if it clearly doesn't, we improve or stop it —
   and the proposal can say it in those words.
7. **Sample sizes.** Aim 2: all activated accounts (operational; expected several
   hundred), never-user cohort ~30–40 organizations, ~20 + ~100 students, ~20
   provider interviews. Aim 3: ≈200 paying-offer accounts across the two funnels,
   sized by expected churn events for the survival models and CI half-widths on
   conversion (Qiping's existing logic, unchanged); ~30 interviews. All floors set
   with the biostatistician.
8. **Geography.** Unchanged: acquisition, the never-user cohort, and the instrumented
   analysis concentrate in the 12 counties (where Aim 1 concentrates family demand);
   Aim 3 prices there and enters ~6 new counties paid-first. County = market,
   everywhere.
9. **What is lost by simplifying?** (a) The controlled prospective field cohort —
   partially recovered by the never-user field phase and by Aim 3 observing fresh
   customers; (b) the suite-level primary endpoint — no longer needed once the value
   evidence is base-wide; (c) methodological gravitas ("prospective mixed-methods
   implementation study") — traded deliberately for a lean, impeccable human-subjects
   section plus a rigorous observational plan, which is the *right* trade for a
   commercialization mechanism and for our historic human-subjects vulnerability;
   (d) nothing an investor would miss.
10. **Does it still produce the NIH/investor evidence?** Yes — more directly. The
    award-end package is: products verified and validated with real users; value
    demonstrated at operational scale; a priced offering that acquired new customers
    at measured CAC, converted at measured rates, retained at measured curves, at
    margins an independent CPA rebuilt. That is the commercial-readiness evidence
    chain, with the free-to-paid input the CP model needs preserved by repair #2.

## 5. What survives from the current RS (for Qiping's review)

Kept: Task 2.1 verification; the formative usability design (as never-user evaluation
phase); SUS/AIM/IAM/FIM; saturation rule; disengager sampling; student protections;
Task 2.3 acquisition machinery, wave gates, cost models; Aim 3's pricing experiments,
matched-county assignment, second round, survival-model retention, CPA rebuild,
interview design. Retired: the 80-account prospective field protocol as a *research
study* (its measurement lives on as platform instrumentation of all accounts); GEE as
primary analysis (may persist inside the observational plan); readiness states;
per-module graduation gates. Moved: stated-WTP/price-sensitivity collection into
Aim 2's never-user study.

## 6. Open decisions

- Value-evidence bars in the advancement rule (with biostatistician + baseline data).
- Where Van Westendorp finally sits (Aim 2 collection vs Aim 3 refresh vs both).
- Free-base upgrade funnel timing relative to the new-customer funnel.
- The reconciliation chain (counties → accounts → payers → revenue → sustainability)
  once this architecture is ratified — then RS, CP, and Aims numbers get set together.
