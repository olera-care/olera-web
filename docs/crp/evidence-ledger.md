# Claim / Evidence Ledger

Working tool for the RS/CP revision pass. One row per empirical claim that appears (or
should appear) in the application. Keep it lightweight: enough to prevent stale or
unsupported claims from recurring, no more. Evidence strength: **verified** (record in
hand) · **pullable** (instrumented; query needed) · **records-exist** (scattered ops
records; consolidation needed) · **unsupported** (no source located yet) ·
**overstated** (source contradicts current wording).

| Claim | Current source | Evidence strength | RS/CP location | Needs verification? |
|---|---|---|---|---|
| 15,500+ (or 15K+) monthly organic visitors | GA4 property 357593677 + GSC via weekly `growth_metric_snapshots` | pullable | RS Significance & Preliminary; CP §1; Aims | Yes — pull dated value; unify wording (visitors vs "users") |
| Organic growth "≈50/day 2023 → 500+/day today" | GA4 history | pullable | RS Preliminary | Yes |
| 725 (or ≈750) providers onboarded; +≈150/month | `business_profiles.account_id`, claims dashboard (`app/api/admin/provider-outreach/claims-dashboard`) | pullable | RS Significance/Preliminary/Aim 2; CP §2 Table 2 | Yes — pick one number, date it |
| 72,000+ providers indexed | production DB; NB `app/sitemap.ts` comment says "39K+ providers" | pullable (conflict) | RS Innovation 3; CP §5, §9 | Yes — count indexed vs published |
| "+≈50,000 profiles annually to list all providers by 2029" | none located | unsupported | CP §5 | Yes — source or soften |
| ≈2,400 family leads/month to providers (last quarter) | `provider_activity` events | pullable | RS Preliminary | Yes |
| 15× provider activity on lead days; ~20% of growth-tool views within 24h of a lead | analytics events | pullable | RS Preliminary, Approach | Yes |
| MedJobs pilot: 900 student applications | pilot records (scattered) | records-exist | RS Preliminary; CP §2 | Yes — Logan's consolidation task |
| MedJobs pilot: 100 accepted, 25 placed (CP) vs "placed about 100" (RS) | pilot records | records-exist (conflict) | CP §2 vs RS Preliminary | Yes — resolve from records |
| 4.68M home health and personal care aides (2025); 760,500 openings/yr 2025-2035; 18% growth to 2035 | BLS Occupational Outlook Handbook, updated 2026-08-27 (`references-cp.yaml: blsAides2026`) | pullable | CP S4 + Figure 7 | Yes -- supplied 2026-08-28, not independently re-checked. Supersedes 4.35M/766,000 |
| 75% median professional-caregiver turnover (2024) | Activated Insights benchmarking (`references.yaml: caregiverCAC2025`); HCAOA announcement supplied as CP ref 27 | verified (RS) | RS Significance; CP S4 + Figure 7 | No -- but consolidate to one source across both documents |
| 63.3% of providers turned down cases (2023) | Activated Insights 2024 benchmarking (`references.yaml: activatedInsights2024`); Home Health Care News supplied as CP ref 28 | verified (RS) | RS Significance; CP S4 | No -- but cite the primary report, not the trade article |
| 35.2M Medicare Advantage enrollees (2026) | KFF, Medicare Advantage in 2026 (`references-cp.yaml: kffMedicareAdvantage2026`) | pullable | CP S4 + Figure 7 | Yes -- supplied 2026-08-28, not independently re-checked |
| 14.3M beneficiaries in Medicare accountable-care initiatives (2026) | CMS 2026 ACO Participation Highlights, 2026-02-04 (`references-cp.yaml: cmsAco2026`) | pullable | CP S4 + Figure 7 | Yes -- supplied 2026-08-28, not independently re-checked |
| 54,699 U.S. medical-school applicants (2025) | AAMC, 2025-12-09 (`references-cp.yaml: aamcApplicants2025`) | pullable | CP S4 | Yes -- also embedded in the `nces2024` supports note; de-duplicate |
| 75,078 NursingCAS applicants across 282 schools (2024-25 cycle) | AACN/NursingCAS, 2026-02-09 (`references-cp.yaml: nursingcas2026`) | pullable | CP S4 | Yes -- supplied 2026-08-28, not independently re-checked |
| Indeed generated 68% of home-care agency applications (Q1 2026) | HCAOA, 2026-07-07 (`references-cp.yaml: hcaoaHiringQ12026`) | pullable | CP S4 | Yes -- supplied 2026-08-28; publication date resolves the recency concern |
| Medicaid managed-care and MLTSS enrollment | CMS enrollment reports (`references-cp.yaml: cmsMedicaidManagedCare`) | pullable | CP S4 (named, uncited) + Figure 7 | Yes -- attach the citation at the MLTSS mention or drop the entry |
| Franchisees of 4 national brands paid $275/month (and $200–300 placement fees) | pilot invoices/records | records-exist | RS Innovation 1 & Preliminary; CP §2 Table 2 | Yes — invoices into consolidated record |
| Students actually worked with families (hours documented) | pilot records; `medjobs_placements` schema exists but payments stubbed, no counts in repo | records-exist? | needed for Aim 2 foundation (Qiping) | Yes — critical |
| "~3 families converted to clients each month and growing" (Conversion evidence) | none located in repo | unsupported | CP §2 Table 2 | Yes — source or remove |
| Growth Suite tools "built and launched nationwide July 2026" | codebase: Boost/Managed Ads productized+billing (`lib/ad-boost/`, Stripe); Staffing free pilot, payments stubbed (`lib/medjobs/placements.ts`); Conversion = components, no product; no packaged "Growth Suite" | overstated | RS Preliminary/Aim 2 | Yes — restate with maturity labels |
| Managed Ads operating with real campaigns | `.claude/commands/ad-boost-setup.md` worked examples: Google campaigns 2026-07-05, Nextdoor pilot 2026-08-14; Stripe billing wired | verified (code+ops log) | CP §2 (Visibility evidence); RS Aim 2 | Light — confirm campaign count/spend |
| AI navigation agents "run in production today" (RAG, three agents) | codebase: deterministic benefits finder + `app/api/benefits/match`; AI-drafted expert-approved letters (`lib/family-comms/benefits-navigator.server.ts`); agentic layer in separate codebase, in development, integration ~3 months out | overstated | RS Innovation 2, Aim 1 "matching agents (live)" | Yes — restate per settled decision |
| Benefits content: 642 programs, 51 states; waiver library | `data/pipeline/*/drafts.ts`, `data/waiver-library.ts` | verified (code) | usable in RS Preliminary / CP | No (adoption metrics separately pullable) |
| Phase I–IIB impact scores 20 and 25 | award records | verified | RS Preliminary; CP §2 | No |
| MARS 4.57/5 (n=30); TAS 5.83/7 (n=65) after four weeks; CARE-NAV multi-agent TAS 5.73/7 (n=31, unpublished) | `fan2024`, `hoang2026`, `careNavTAS2026` | verified 2026-08-19 | RS Preliminary; deck slide 29 | No — resolved. The earlier "4.6/5 (n=31)", "≈5.6/7" and "n=200" figures are superseded by references.yaml, which also notes that ≈5.6/7 was misattributed to the AI agents rather than the platform. |
| $58B unclaimed aid annually | `ncoa2025` (NCOA 2025), references.yaml | verified 2026-08-19 | Aims, RS Significance; deck slide 4 context | No — resolved |
| Direct-care: 9.7M **job openings** 2024–2034 | `phi2025`, verified | verified | Aims, RS, CP §2; deck slides 5 and 16 | **Yes, wording.** The source is 9.7M total openings including transfers and labor-force exits. The figures say "9.7M unfilled roles by 2034," which the source does not support. Say "openings" everywhere. |
| Caregiver turnover ≈75% (CP) vs "approaches 80%" (RS) | Activated Insights 2024: 75.0% (verified) | verified (RS overstated) | CP §2 vs RS Significance | Fix RS to 75% |
| 63.3% of home-care providers turned down cases (2023) | Activated Insights 2024 Benchmarking Report (`activatedInsights2024`) | verified 2026-08-19 | RS Significance (unmet need), CP §2 | No — resolved; confirm page/table against the report PDF at the citation-integrity pass |
| ≈100K non-medical home care agencies; ≈165K organizations total | state-licensing estimates (canon since CP v0.2x) | verified-method (estimate) | CP §5 | Keep "estimates vary" framing |
| Award-end targets (300 payers / $0.5M / $0.7M run rate vs $0.87M model vs 430) | three inconsistent sources | provisional | CP §9 vs §11 vs RS Aim 3 | Locked only after Aim 3 redesign |
| 200+ I-Corps provider interviews | I-Corps program records | verified | RS, CP | No |
| Ziegler / Equitage diligence shaped endpoints; John Reinhart engagement | correspondence | records-exist | RS Preliminary; CP §1/§7 | Letters task (TJ) |
| ~15 providers signed up for Growth Suite (letter pool) | 2026-08-17 meeting | records-exist | letters workstream | Yes — list from DB |
| 263,800 health-professions undergraduate degrees a year | `nces2024`, verified 2026-08-19 | verified | RS Innovation 2; deck slide 16 | No. The verified quantity is the annual degree flow, not an enrollment count |
| Over 700 providers have claimed a listing; ~150 more each month | claims dashboard; SCRATCHPAD entry 2026-08-05 records 711 | pullable (stale) | RS Preliminary; deck slide 29 | Yes. Pull and date before submission. No service-role key in this environment |
| ~25 paying accounts in a mature market | planning assumption | hypothesis | CP §9; deck slide 9; the market-count derivation | Yes. This assumption drives the market count more than anything else in the derivation |
| ~$220K/year illustrative total for one mature mid-sized market | build from the slide 9 table | hypothesis (illustrative) | deck slide 9; CP §9 | Label illustrative wherever it appears; every payer line in it is beyond the award |
| Repeat shift use at 60 days ≥50%; accounts reaching a first verified paid shift ≥70% | derived from the month-24 gate, not measured | hypothesis | deck slides 23 and 26 | Yes. State as targets, never as expected values |
| Expert-panel agreement ≥85%, material errors ≤10%, follow-ups on time ≥95%, outcome ascertainment ≥80% | Aim 1 gate values | hypothesis (committed targets) | deck slides 20 and 22 | No. These are pre-committed thresholds, not claims about the world |
| LTV:CAC ≥3:1, payback <12 months, positive per-market margin | Aim 3 targets | hypothesis (committed targets) | deck slide 24 | No. Same |

## Market figures retired (2026-08-19)

- "$173.6B home-care industry," "$76B senior-living industry," "$2.4B long-term-care
  software market": removed from the RS market paragraph — unsourced analyst figures.
  Replaced by CMS NHE components, industry estimates, and the auditable denominators
  in market-denominator.md. Do not reintroduce; the CP inherits the same replacement
  during its pass.
