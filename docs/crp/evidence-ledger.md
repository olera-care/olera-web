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
| Franchisees of 4 national brands paid $275/month (and $200–300 placement fees) | pilot invoices/records | records-exist | RS Innovation 1 & Preliminary; CP §2 Table 2 | Yes — invoices into consolidated record |
| Students actually worked with families (hours documented) | pilot records; `medjobs_placements` schema exists but payments stubbed, no counts in repo | records-exist? | needed for Aim 2 foundation (Qiping) | Yes — critical |
| "~3 families converted to clients each month and growing" (Conversion evidence) | none located in repo | unsupported | CP §2 Table 2 | Yes — source or remove |
| Growth Suite tools "built and launched nationwide July 2026" | codebase: Boost/Managed Ads productized+billing (`lib/ad-boost/`, Stripe); Staffing free pilot, payments stubbed (`lib/medjobs/placements.ts`); Conversion = components, no product; no packaged "Growth Suite" | overstated | RS Preliminary/Aim 2 | Yes — restate with maturity labels |
| Managed Ads operating with real campaigns | `.claude/commands/ad-boost-setup.md` worked examples: Google campaigns 2026-07-05, Nextdoor pilot 2026-08-14; Stripe billing wired | verified (code+ops log) | CP §2 (Visibility evidence); RS Aim 2 | Light — confirm campaign count/spend |
| AI navigation agents "run in production today" (RAG, three agents) | codebase: deterministic benefits finder + `app/api/benefits/match`; AI-drafted expert-approved letters (`lib/family-comms/benefits-navigator.server.ts`); agentic layer in separate codebase, in development, integration ~3 months out | overstated | RS Innovation 2, Aim 1 "matching agents (live)" | Yes — restate per settled decision |
| Benefits content: 642 programs, 51 states; waiver library | `data/pipeline/*/drafts.ts`, `data/waiver-library.ts` | verified (code) | usable in RS Preliminary / CP | No (adoption metrics separately pullable) |
| Phase I–IIB impact scores 20 and 25 | award records | verified | RS Preliminary; CP §2 | No |
| MARS 4.6/5 (n=31); TAS ≈5.6/7; IIB evaluation n=200 | peer-reviewed studies 6–10 | verified (cite-complete?) | RS Preliminary | Check exact citations |
| $58B unclaimed aid annually | [cite] in Aims/RS | unsupported (citation missing) | Aims, RS Significance | Yes — pin source |
| Direct-care: 9.7M openings 2024–2034 | PHI 2025 (verified in CP bibliography) | verified | Aims, RS, CP §2 | No |
| Caregiver turnover ≈75% (CP) vs "approaches 80%" (RS) | Activated Insights 2024: 75.0% (verified) | verified (RS overstated) | CP §2 vs RS Significance | Fix RS to 75% |
| 63.3% of home-care providers turned down cases (2023) | CP ref 25 | unverified here | CP §2 | Yes — pin citation |
| ≈100K non-medical home care agencies; ≈165K organizations total | state-licensing estimates (canon since CP v0.2x) | verified-method (estimate) | CP §5 | Keep "estimates vary" framing |
| Award-end targets (300 payers / $0.5M / $0.7M run rate vs $0.87M model vs 430) | three inconsistent sources | provisional | CP §9 vs §11 vs RS Aim 3 | Locked only after Aim 3 redesign |
| 200+ I-Corps provider interviews | I-Corps program records | verified | RS, CP | No |
| Ziegler / Equitage diligence shaped endpoints; John Reinhart engagement | correspondence | records-exist | RS Preliminary; CP §1/§7 | Letters task (TJ) |
| ~15 providers signed up for Growth Suite (letter pool) | 2026-08-17 meeting | records-exist | letters workstream | Yes — list from DB |

## Market figures retired (2026-08-19)

- "$173.6B home-care industry," "$76B senior-living industry," "$2.4B long-term-care
  software market": removed from the RS market paragraph — unsourced analyst figures.
  Replaced by CMS NHE components, industry estimates, and the auditable denominators
  in market-denominator.md. Do not reintroduce; the CP inherits the same replacement
  during its pass.
