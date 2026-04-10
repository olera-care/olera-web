# New Jersey Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.050 (10 calls, 4.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 8 |
| Programs deep-dived | 8 |
| New (not in our data) | 6 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **financial**: 5 programs
- **service**: 3 programs

## Data Discrepancies

Our data differs from what official sources say:

### Senior Freeze (Property Tax Reimbursement)

- **income_limit**: Ours says `$157000` → Source says `$99,735` ([source](https://www.nj.gov/treasury/taxation/ptr/))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Reimbursement for property tax or mobile home park site fee increases on principal residence above the base year amount (first year of eligibility). Does not freeze taxes but reimburses the difference if current year taxes exceed base year, provided eligibility met.[1][2]` ([source](https://www.nj.gov/treasury/taxation/ptr/))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/treasury/taxation/ptr/`

### Pharmaceutical Assistance to the Aged & Disabled (PAAD)

- **min_age**: Ours says `65` → Source says `65 or older, or 18-64 with Social Security Title II Disability benefits` ([source](https://www.nj.gov/humanservices/doas/home/ (NJ Department of Human Services, Division of Aging Services)))
- **income_limit**: Ours says `$31500` → Source says `$54,943` ([source](https://www.nj.gov/humanservices/doas/home/ (NJ Department of Human Services, Division of Aging Services)))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `$5 copay per generic drug; $7 copay per brand-name drug (PAAD covers remainder including costs above copay; may be less for generics if Medicare Part D charges lower). Covers FDA-approved legend drugs, insulin, insulin supplies, syringes/needles for MS injectables. Does not cover diabetic testing supplies or most Medicare Part D excluded drugs (except benzodiazepines/barbiturates). Pays Part D premiums for qualifying low-premium plans.` ([source](https://www.nj.gov/humanservices/doas/home/ (NJ Department of Human Services, Division of Aging Services)))
- **source_url**: Ours says `MISSING` → Source says `https://www.nj.gov/humanservices/doas/home/ (NJ Department of Human Services, Division of Aging Services)`

## New Programs (Not in Our Data)

- **Stay NJ** — financial ([source](https://www.nj.gov/treasury/taxation/staynj/index.shtml))
  - Shape notes: Reimbursement scales by actual property tax amount (50% up to cap); combined with other relief programs via single PAS-1 form; statewide but homeownership and full-year residency strictly enforced
- **Jersey Assistance for Community Caregiving (JACC)** — service ([source](https://www.state.nj.us/humanservices/doas/services/jacc/[5]))
  - Shape notes: Statewide but county-administered with local providers/AAAs; financial eligibility tied to FPL (updates annually, sources outdated); services personalized via POC with monthly cap; self-direction via PEPs unique; income not scaled by household size in data
- **Lifeline Credit** — financial ([source](https://www.nj.gov/humanservices/doas/services/l-p/lifeline-utility/))
  - Shape notes: Eligibility tied directly to PAAD/SSI/MAA programs with fixed income thresholds for single/married only (no larger household scaling); one benefit per household; automatic for SSI.
- **New Jersey Statewide Respite Care Program** — service ([source](https://www.nj.gov/humanservices/doas/services/q-z/srcp/))
  - Shape notes: This program's eligibility and benefits scale by household size (single vs. married) with different income and asset limits. Income limits are updated annually (2026 figures provided). The program is administered statewide but through county-level sponsor agencies, creating potential regional variation in implementation. The sliding scale co-pay (0-25%) means actual out-of-pocket costs vary by income. The program prioritizes families at risk of institutionalization, suggesting a tiered priority system, though specific priority tiers are not detailed in available sources.
- **Alzheimer’s Adult Day Services Program** — service ([source](https://www.nj.gov/humanservices/doas/documents/Adult%20Day%20Services%20Program%20Brochure%20(Web-English).pdf[4]))
  - Shape notes: State-funded subsidies to participating dementia-specialized adult day centers; income-tested with copay; no fixed age requirement; statewide but provider-based; limited public detail on exact financial thresholds
- **Senior Citizen E-ZPass Discount** — financial ([source](https://seniordiscount.njta.gov and https://www.ezpassnj.com/en/about/plans.shtml))
  - Shape notes: No income/asset test; tag-specific and driver-present requirements; separate DRPA bridge program; annual renewal tied to vehicle registration.

## Program Details

### Stay NJ

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Annual income below $500,000 (based on 2025 income for 2026 applications; does not vary by household size)
- Assets: No asset limits mentioned
- Must own and live in a New Jersey home as principal residence for the full 12 months of the prior year (e.g., all of 2025)
- Must be a homeowner paying property taxes (mobile homeowners not eligible)
- P.I.L.O.T. (payments in lieu of tax) payments qualify
- Must be 65 or older in the application year (Social Security disability does not qualify for Stay NJ specifically, though it may for combined programs)

**Benefits:** 50% reimbursement of property taxes billed on primary residence (land and improvements), up to a maximum benefit of $6,500 (based on max $13,000 in property taxes)
- Varies by: property_tax_amount

**How to apply:**
- Online: propertytaxreliefapp.nj.gov (requires ID.me identity verification with driver's license, state ID, passport card, or passport)
- Mail: Print PAS-1 form and send to New Jersey Division of Taxation
- Combined PAS-1 application covers Stay NJ, ANCHOR, and Senior Freeze

**Timeline:** Not specified in sources

**Watch out for:**
- Mobile homeowners are explicitly not eligible
- Must have owned and lived in home for full 12 months of prior year
- Social Security disability does not qualify (unlike some combined programs)
- High income threshold ($500,000) but still requires principal residence proof
- Deadline is October 31 of the application year (e.g., 2025 for 2025 taxes); online required for direct deposit
- Eligibility checked via single PAS-1; state determines which benefits (Stay NJ, ANCHOR, Senior Freeze) you get

**Data shape:** Reimbursement scales by actual property tax amount (50% up to cap); combined with other relief programs via single PAS-1 form; statewide but homeownership and full-year residency strictly enforced

**Source:** https://www.nj.gov/treasury/taxation/staynj/index.shtml

---

### Senior Freeze (Property Tax Reimbursement)


**Eligibility:**
- Age: 65+
- Income: Total annual income (combined if married or in civil union and living in the same home) must be $99,735 or less for relevant years (e.g., 2019: $91,505 or less; 2020: $92,969 or less). Exact limits based on residency, income, and age as of both prior and current years (e.g., 2024 and 2025). No variation specified by household size beyond spouse/civil union partner.[1][2][4]
- Assets: No asset limits mentioned.[1][2]
- 65 or older (or spouse/civil union partner 65+) as of December 31 of the base year and application year, OR actually receiving federal Social Security disability benefits (not on behalf of someone else) as of December 31.
- Lived in New Jersey continuously for 10 years prior to the base year (e.g., since December 31, 2009 for 2020).
- Owned and lived in principal residence (home or mobile home park site) since base year (e.g., December 31, 2016 for 2020) through application year.
- Property taxes paid by June 1 of relevant years for homeowners; site fees paid by December 31 for mobile home owners.
- Must meet all requirements every year from base year through application year.
- Exception possible if moved within NJ and received reimbursement for prior residence in last full year lived there.

**Benefits:** Reimbursement for property tax or mobile home park site fee increases on principal residence above the base year amount (first year of eligibility). Does not freeze taxes but reimburses the difference if current year taxes exceed base year, provided eligibility met.[1][2]

**How to apply:**
- Online via combined PAS-1 application at https://www.nj.gov/treasury/taxation/ptr/ (covers Senior Freeze, ANCHOR, Stay NJ).
- Phone: 1-800-882-6597 (infoline to check status, order application, ask questions); Automated: 1-800-323-4400.
- Mail: Print forms and instructions from https://www.nj.gov/treasury/taxation/ptr/.
- Email NJ Taxation for general information.
- In-person: NJ Division of Taxation office locations (see site).
- NJ Relay 711 for deaf/hard of hearing.

**Timeline:** Not specified in sources.

**Watch out for:**
- Must meet eligibility EVERY year from base year to application year; prior recipients keep base year unless municipal reassessment.
- Not a tax freeze—only reimburses increases above base year.
- Combined application with ANCHOR/Stay NJ; state determines specific benefits via letter.
- Filing deadlines strict (e.g., 2025 apps by Nov 2, 2026; 2024 by Oct 31, 2025).
- Previous app process changed: no need to calculate reimbursement yourself.
- Mobile home owners: site fees, not property taxes.
- Income combined for spouses/civil union partners living together.

**Data shape:** Reimbursement based on increases from fixed base year; requires continuous eligibility across multiple years; part of combined PAS-1 app with ANCHOR/Stay NJ; income thresholds updated annually without household size tiers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/treasury/taxation/ptr/

---

### Jersey Assistance for Community Caregiving (JACC)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Countable monthly income no more than 365% of the Federal Poverty Level (e.g., $3,296 in 2010; current amount varies annually with FPL updates, not specified in recent sources). Does not vary by household size in available data[1][3].
- Assets: Countable resources at or below $40,000 for an individual or $60,000 for a couple. Specifics on what counts or is exempt not detailed in sources[1][3].
- New Jersey resident
- Resides in a community home owned/rented by self or unlicensed home of relative/friend (not in licensed facility)
- Determined clinically eligible for nursing facility level of care
- Financially ineligible for Medicaid or Medicaid waiver services (e.g., NJ FamilyCare, MLTSS)
- No alternate means available to secure needed services/supports
- United States citizen or Qualified Alien
- Not participating in other state-funded programs[1][2][3][5]

**Benefits:** Care management for all participants, plus personalized Plan of Care (POC) services based on clinical assessment, such as in-home and community-based supports (specific services like personal care, homemaking not exhaustively listed). Monthly cap around $1,090-$1,156 per participant (plus care management), subject to funding. Participant-employed providers (PEPs) option allows hiring family/friends. Sliding-scale co-pay based on countable income[1][3][4].
- Varies by: priority_tier

**How to apply:**
- Toll-free phone via NJ EASE / County Aging and Disability Resource Connection: 1-877-222-3737[3][4][5]
- County-specific contacts (e.g., Hunterdon: 908-788-1361[2]; Warren: 908-475-6591 for vendors[3])
- Local Area Agency on Aging (AAA) or ADRC offices[4][5]

**Timeline:** Not specified in sources
**Waitlist:** Subject to funding availability; potential waitlists implied but not detailed[4]

**Watch out for:**
- Not a Medicaid program; serves those ineligible for Medicaid waivers like MLTSS[2][4][5]
- Requires nursing facility level of care determination via clinical assessment[1][2][3]
- Sliding-scale co-pay required based on income, billed by provider[1][3]
- Services capped monthly (e.g., ~$1,100) and subject to funding[3][4]
- Income/resource limits outdated in sources (e.g., 2010 FPL); verify current FPL-based amounts[1]
- Participant must have no other means of support; not for those in licensed facilities[1][5]

**Data shape:** Statewide but county-administered with local providers/AAAs; financial eligibility tied to FPL (updates annually, sources outdated); services personalized via POC with monthly cap; self-direction via PEPs unique; income not scaled by household size in data

**Source:** https://www.state.nj.us/humanservices/doas/services/jacc/[5]

---

### Pharmaceutical Assistance to the Aged & Disabled (PAAD)


**Eligibility:**
- Age: 65 or older, or 18-64 with Social Security Title II Disability benefits+
- Income: For 2026: $54,943 or less if single; $62,390 or less if married (couple). Earlier years had lower limits (e.g., 2025: $53,446 single/$60,690 married; varies annually by federal guidelines). No variation by additional household sizes specified.
- Assets: No asset limits; assets are not considered for eligibility.
- New Jersey resident
- Not eligible for Medicaid
- If Medicare-eligible, must enroll in Medicare Part D Prescription Drug Plan (PDP) or Medicare Advantage plan with Part D coverage; PAAD pays premiums for certain plans at/near regional benchmark
- U.S. citizenship or lawful permanent residency not required

**Benefits:** $5 copay per generic drug; $7 copay per brand-name drug (PAAD covers remainder including costs above copay; may be less for generics if Medicare Part D charges lower). Covers FDA-approved legend drugs, insulin, insulin supplies, syringes/needles for MS injectables. Does not cover diabetic testing supplies or most Medicare Part D excluded drugs (except benzodiazepines/barbiturates). Pays Part D premiums for qualifying low-premium plans.

**How to apply:**
- Online: NJSaves website (njsaves.org or via NJ.gov humanservices; click 'Start New Application')
- Mail: NJ Department of Human Services, PAAD/Lifeline/Senior Gold, PO Box 715, Trenton, NJ 08625-0715 (or PO Box 637 for some forms)
- Phone assistance: 866-657-2835 (NJ Division of Aging Services) or 1-800-792-9745 (for Part D plan info); also online contact form
- In-person: Not specified; phone/online/mail primary

**Timeline:** Not specified in sources

**Watch out for:**
- Must enroll in Medicare Part D (or MA-PD) if Medicare-eligible, even if prohibited for specific reasons (must note on application); PAAD won't cover non-formulary drugs without Part D exception
- Not eligible if on Medicaid; income limits updated annually (use current year figures, e.g., 2026)
- PAAD pays Part D premiums only for specific low-premium plans at/near regional benchmark; self-enrolling in higher-premium plans may disqualify premium assistance
- Copays apply even with Medicare; no coverage for diabetic test strips or most excluded drugs
- Often confused with Senior Gold (higher income eligibility, different copays)

**Data shape:** No asset test; income only for single/couple (no larger household table); mandatory Medicare Part D enrollment with premium payment limited to benchmark plans; statewide uniform copays

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nj.gov/humanservices/doas/home/ (NJ Department of Human Services, Division of Aging Services)

---

### Lifeline Credit

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For 2026, annual gross income must be less than $54,943 if single (or widowed/divorced) or less than $62,390 if married. These limits apply to the individual applicant (not household income) and are tied to PAAD eligibility requirements. No variation by additional household size beyond single/married; only one person per household eligible.[3][6][7]
- Assets: No asset limits or tests mentioned in program requirements.[1][3]
- New Jersey resident.
- Enrolled in or eligible for Pharmaceutical Assistance to the Aged and Disabled (PAAD); or recipient of Medical Assistance to the Aged (MAA), Medical Assistance Only (MAO), or New Jersey Care; or receiving Supplemental Security Income (SSI) or Social Security Disability benefits (ages 18-64) and meeting PAAD income/residency.
- Residential electric or gas customer (natural gas only; excludes wood, propane, coal, or oil).
- Only one applicant per household; application must be in applicant's or spouse's name if married.
- U.S. citizenship not required.
- SSI recipients do not apply separately; benefit is included in SSI check.

**Benefits:** Annual bill credit of up to $225 for eligible residential electric and/or natural gas customers. Credit appears directly on utility bill for electric/gas customers.[2][4][5][6]
- Varies by: fixed

**How to apply:**
- Online: NJSave application at official NJ Department of Human Services site (includes Lifeline questions when applying for PAAD).
- Mail: Applications automatically sent every August to MAA/MAO/New Jersey Care beneficiaries.
- Phone: Contact utility provider (e.g., PSE&G, NJNG) or NJ Department of Human Services Division of Aging Services for guidance.
- In-person: Not specified as primary; use NJSave or mail primarily.

**Timeline:** Not specified in sources.

**Watch out for:**
- Only for natural gas and electric; excludes oil, propane, wood, or coal heat.
- Only one per household; SSI recipients get it automatically in their check—do not apply.
- Income is individual gross (not household aggregate beyond married couple).
- Must be electric/gas customer; benefit is annual credit, not monthly.
- Eligibility checked as of July 1 or within next 6 months.[1]

**Data shape:** Eligibility tied directly to PAAD/SSI/MAA programs with fixed income thresholds for single/married only (no larger household scaling); one benefit per household; automatic for SSI.

**Source:** https://www.nj.gov/humanservices/doas/services/l-p/lifeline-utility/

---

### New Jersey Statewide Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Single person (unmarried or widowed): Maximum $2,982 monthly income in 2026 (gross, before deductions); Married person: Maximum $5,964 combined monthly income in 2026 (gross, before deductions). Only the care recipient's income is considered for eligibility, not the caregiver's income.[2]
- Assets: Single person: Maximum $40,000 in liquid assets; Married person: Maximum $60,000 in combined liquid assets. Liquid assets are defined as assets that can be converted to cash within 20 working days.[1][2]
- Care recipient must reside in New Jersey[1]
- Care recipient must reside in the community, not in a facility (assisted living, nursing home, or residential care facility)[3]
- Care recipient must have a chronic physical or mental disability requiring supervision or assistance with basic daily needs from an uncompensated caregiver[1]
- Care recipient must receive daily, basic care and/or daily supervision by an uncompensated caregiver (spouse, family, friend, etc.) who is age 18 or older[2]
- Functional impairments must be certified by the care recipient's licensed medical provider[2]
- Care recipient cannot currently participate in MLTSS, JACC, Alzheimer's Adult Day Services Program, or Congregate Housing Services Program (though a participant can switch from JACC or the Alzheimer's program onto Statewide Respite)[2]

**Benefits:** Services include: Companion (adult sitter or basic supervision, hourly, in-home); Homemaker/Home Health Aide (in-home hourly or overnight service including personal care and housekeeping); Private Duty Nursing (in-home hourly R.N. or L.P.N. service); Adult Family Care (short-term placement in trained, approved individual or family home); In-patient Care (short-term placement in licensed medical facility); Social or Medical Adult Day Health Care (out-of-home structured program). There is a Caregiver Directed Option allowing reimbursement for services or items that make caregiving easier.[1][3]
- Varies by: sliding scale based on income; sliding scale ranges from 0% to 25% of the cost of services, based on the care recipient's (and spouse's) income[2]

**How to apply:**
- Phone: Aging and Disability Resource Connection (ADRC) toll-free at 1-877-222-3737[2][3]
- Website: www.state.nj.us/humanservices/doas/services/srcp[3]
- County-level sponsor agency (each county administers the program locally)[1]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Only the care recipient's income counts toward eligibility—the caregiver's income is irrelevant, even if they live in the same household[1]
- Care recipient must be receiving care from an uncompensated (unpaid) caregiver; if the caregiver is paid, the person may not qualify[3]
- Functional impairment must be certified by a licensed medical provider; self-reported disability is insufficient[2]
- Care recipient cannot be in a facility; this program is for community-dwelling individuals only[3]
- Participants cannot simultaneously receive MLTSS, JACC, Alzheimer's Adult Day Services, or Congregate Housing Services (though switching from JACC or Alzheimer's program is possible)[2]
- There is a co-pay based on income (sliding scale 0-25%); this is not a fully free program[2][3]
- Priority is given to families where the impaired member is at risk of long-term care institutionalization due to caregiver inability to continue[1]
- Once enrolled, there is a benefit for emergency or planned respite one time a year[4]

**Data shape:** This program's eligibility and benefits scale by household size (single vs. married) with different income and asset limits. Income limits are updated annually (2026 figures provided). The program is administered statewide but through county-level sponsor agencies, creating potential regional variation in implementation. The sliding scale co-pay (0-25%) means actual out-of-pocket costs vary by income. The program prioritizes families at risk of institutionalization, suggesting a tiered priority system, though specific priority tiers are not detailed in available sources.

**Source:** https://www.nj.gov/humanservices/doas/services/q-z/srcp/

---

### Alzheimer’s Adult Day Services Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income-based subsidies with copay required; specific dollar amounts not detailed in sources (e.g., no exact figures or household size table provided). Must have documented evidence of eligibility according to income guidelines.[1][4]
- Assets: Asset guidelines apply with documented evidence required; specifics on what counts or exemptions not detailed.[1]
- New Jersey resident
- Diagnosis of permanent, progressive dementia (e.g., Alzheimer’s, Pick’s disease, dementia due to Parkinson’s, Huntington’s, multi-infarct/vascular dementia, Creutzfeldt-Jakob, Fronto-Temporal, Lewy body, dementia due to normal pressure hydrocephalus, or Wernicke-Korsakoff syndrome)
- Any stage of disease as long as family/friends provide daily assistance
- Functional impairments requiring care of another person (not explicitly required but implied for program fit)
- Not currently participating in Medicaid (NJ FamilyCare, MLTSS), JACC, or Congregate Housing Services Program[1][4]

**Benefits:** Subsidized attendance at participating adult day services centers specialized for dementia: high staff-to-client ratio, activities designed for cognitive loss, caregiver supports; covers social or medical model centers; copay based on income; any stage of dementia supported.[3][4]
- Varies by: income

**How to apply:**
- Find a participating center: https://www.nj.gov/humanservices/[4]
- Contact local office or center directly (specific phone/website via center finder)
- Through Division of Aging Services (DoAS) as single point of access[1]

**Timeline:** Not specified

**Watch out for:**
- Subsidies come with income-based copay, not fully free[4]
- Cannot participate if already in Medicaid programs, JACC, or Congregate Housing Services[1]
- Must use participating centers with dementia specialization; not all adult day centers qualify[2][4]
- Exact income/asset limits and household variations not publicly detailed in brochures—contact DoAS or centers for current figures[1]
- Implemented in 1987 specifically for family caregiver relief via subsidies[4]

**Data shape:** State-funded subsidies to participating dementia-specialized adult day centers; income-tested with copay; no fixed age requirement; statewide but provider-based; limited public detail on exact financial thresholds

**Source:** https://www.nj.gov/humanservices/doas/documents/Adult%20Day%20Services%20Program%20Brochure%20(Web-English).pdf[4]

---

### Senior Citizen E-ZPass Discount

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits or asset limits apply. Eligibility is not based on income, assets, or household size.
- Assets: No asset limits. No requirements for what counts or exemptions.
- Must have an active New Jersey E-ZPass account.
- Must have a valid driver's license issued by any state.
- Must have a passenger vehicle registered in your name or your spouse's name in any state (leasing requires proof of lessee status).
- Must be the driver in the vehicle at the time of toll transaction.
- Vehicle registration can be in NJ, PA, or DE for DRPA bridges.
- Only one E-ZPass tag/transponder per senior (must start with 009 or 022).
- Business/commercial accounts ineligible.
- Renewal required annually, aligned with vehicle registration renewal date.

**Benefits:** 10% discount on off-peak tolls on New Jersey Turnpike and Garden State Parkway (weekdays off-peak and weekends); off-peak only, passenger vehicles. Separate DRPA Senior Discount for Benjamin Franklin, Walt Whitman, Betsy Ross, and Commodore Barry bridges (credit of $18 for 18+ trips in a calendar month).
- Varies by: fixed

**How to apply:**
- Online: https://seniordiscount.njta.gov (NJTA Turnpike/GSP); www.ezpassnj.com for new NJ E-ZPass account.
- Phone: 1-888-288-6865 (new NJ E-ZPass account); 732-750-5300 (enroll in NJTA Senior Plan); 856-968-2000 press 5 or 215-218-3750 press 5 (DRPA Senior Plan).
- Mail: P.O. Box 5042, Woodbridge, NJ 07095.
- In-person: E-ZPass Customer Service Centers (locations at www.ezpassnj.com).

**Timeline:** Not specified in sources.

**Watch out for:**
- Must be the eligible senior driving the vehicle (not just passenger).
- Tag-specific: Only one tag per senior; misuse by others revokes privileges.
- Off-peak only (no peak hours, no commercial vehicles).
- Annual renewal required, timed to vehicle registration date (may be less than 12 months).
- Must have NJ E-ZPass account (statements from Newark, NJ); out-of-state residents can open one.
- DRPA is separate program with its own rules and $18 monthly credit threshold.

**Data shape:** No income/asset test; tag-specific and driver-present requirements; separate DRPA bridge program; annual renewal tied to vehicle registration.

**Source:** https://seniordiscount.njta.gov and https://www.ezpassnj.com/en/about/plans.shtml

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Stay NJ | benefit | state | medium |
| Senior Freeze (Property Tax Reimbursemen | resource | state | simple |
| Jersey Assistance for Community Caregivi | benefit | state | deep |
| Pharmaceutical Assistance to the Aged &  | benefit | state | deep |
| Lifeline Credit | benefit | state | deep |
| New Jersey Statewide Respite Care Progra | benefit | state | deep |
| Alzheimer’s Adult Day Services Program | benefit | state | deep |
| Senior Citizen E-ZPass Discount | benefit | state | deep |

**Types:** {"benefit":7,"resource":1}
**Scopes:** {"state":8}
**Complexity:** {"medium":1,"simple":1,"deep":6}

## Content Drafts

Generated 8 page drafts. Review in admin dashboard or `data/pipeline/NJ/drafts.json`.

- **Stay NJ** (benefit) — 2 content sections, 6 FAQs
- **Senior Freeze (Property Tax Reimbursement)** (resource) — 2 content sections, 6 FAQs
- **Jersey Assistance for Community Caregiving (JACC)** (benefit) — 4 content sections, 6 FAQs
- **Pharmaceutical Assistance to the Aged & Disabled (PAAD)** (benefit) — 3 content sections, 6 FAQs
- **Lifeline Credit** (benefit) — 3 content sections, 6 FAQs
- **New Jersey Statewide Respite Care Program** (benefit) — 3 content sections, 6 FAQs
- **Alzheimer's Adult Day Services Program** (benefit) — 2 content sections, 6 FAQs
- **Senior Citizen E-ZPass Discount** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **property_tax_amount**: 1 programs
- **not_applicable**: 2 programs
- **priority_tier**: 1 programs
- **fixed**: 2 programs
- **sliding scale based on income; sliding scale ranges from 0% to 25% of the cost of services, based on the care recipient's (and spouse's) income[2]**: 1 programs
- **income**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Stay NJ**: Reimbursement scales by actual property tax amount (50% up to cap); combined with other relief programs via single PAS-1 form; statewide but homeownership and full-year residency strictly enforced
- **Senior Freeze (Property Tax Reimbursement)**: Reimbursement based on increases from fixed base year; requires continuous eligibility across multiple years; part of combined PAS-1 app with ANCHOR/Stay NJ; income thresholds updated annually without household size tiers.
- **Jersey Assistance for Community Caregiving (JACC)**: Statewide but county-administered with local providers/AAAs; financial eligibility tied to FPL (updates annually, sources outdated); services personalized via POC with monthly cap; self-direction via PEPs unique; income not scaled by household size in data
- **Pharmaceutical Assistance to the Aged & Disabled (PAAD)**: No asset test; income only for single/couple (no larger household table); mandatory Medicare Part D enrollment with premium payment limited to benchmark plans; statewide uniform copays
- **Lifeline Credit**: Eligibility tied directly to PAAD/SSI/MAA programs with fixed income thresholds for single/married only (no larger household scaling); one benefit per household; automatic for SSI.
- **New Jersey Statewide Respite Care Program**: This program's eligibility and benefits scale by household size (single vs. married) with different income and asset limits. Income limits are updated annually (2026 figures provided). The program is administered statewide but through county-level sponsor agencies, creating potential regional variation in implementation. The sliding scale co-pay (0-25%) means actual out-of-pocket costs vary by income. The program prioritizes families at risk of institutionalization, suggesting a tiered priority system, though specific priority tiers are not detailed in available sources.
- **Alzheimer’s Adult Day Services Program**: State-funded subsidies to participating dementia-specialized adult day centers; income-tested with copay; no fixed age requirement; statewide but provider-based; limited public detail on exact financial thresholds
- **Senior Citizen E-ZPass Discount**: No income/asset test; tag-specific and driver-present requirements; separate DRPA bridge program; annual renewal tied to vehicle registration.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Jersey?
