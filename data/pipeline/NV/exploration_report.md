# Nevada Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.035 (7 calls, 1.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 5 |
| Programs deep-dived | 5 |
| New (not in our data) | 4 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **financial**: 2 programs
- **service**: 2 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Home and Community-Based Waiver for the Frail Elderly (HCBW-FE)

- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://dwss.nv.gov/ (DWSS) or https://adsd.nv.gov/ (ADSD); waiver details at https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/NV[4][6]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Case management, homemaker, respite, adult companion, adult day care, augmented personal care, chore, home delivered meals, personal emergency response system. Must require at least one monthly service. No fixed dollar amounts or hours specified; services promote community living to avoid nursing home[5][6].` ([source](https://dwss.nv.gov/ (DWSS) or https://adsd.nv.gov/ (ADSD); waiver details at https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/NV[4][6]))
- **source_url**: Ours says `MISSING` → Source says `https://dwss.nv.gov/ (DWSS) or https://adsd.nv.gov/ (ADSD); waiver details at https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/NV[4][6]`

## New Programs (Not in Our Data)

- **Nevada's Senior Rx Program** — financial ([source](https://adsd.nv.gov/programs/seniors/seniorrx/srrxprog/ (now shows program closure notice)[6]))
  - Shape notes: Program operated as wrap-around coverage for Medicare Part D beneficiaries while also serving non-Medicare-eligible seniors. Income and asset limits adjusted annually. Program was administered at state level through DHHS with regional phone support. Now defunct; families should contact Nevada Medicare Assistance Program for current prescription assistance options.
- **Community Options Program for the Elderly (COPE)** — service ([source](https://adsd.nv.gov/Programs/Seniors/COPE/COPE_Prog/))
  - Shape notes: Statewide with regional offices; financial eligibility via changing guidelines (no fixed table in sources); waitlist common as non-Medicaid alternative to HCBS FE Waiver; NFLOC required with imminent risk focus.
- **Social Security Domiciliary Rate** — financial ([source](https://secure.ssa.gov/apps10/poms.nsf/lnx/0501415300SF))
  - Shape notes: Tied to SSI with Nevada Optional State Supplementation (OSS C) for specific licensed domiciliary care facilities; no standalone income table, scales with SSI living arrangement; statewide but facility-licensing required.
- **Taxi Assistance Program (TAP)** — in_kind ([source](https://adsd.nv.gov/programs/seniors/tap/tap_prog/[1]))
  - Shape notes: Clark County-restricted; tiered categories (1-5) for eligibility/benefits; income test at 125% FPG with proof from all sources including spouse; currently closed to new funded enrollments

## Program Details

### Nevada's Senior Rx Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: As of July 2022: $33,152 annually for singles; $44,193 for married couples. Income limits adjusted annually on July 1st based on Consumer Price Index. (Note: Earlier 2006 limits were $23,175 singles, $30,168 couples)[2][3]
- Assets: As of December 2022: $15,510 for singles; $30,950 for married couples. No asset test was associated with the program in earlier years[2][3]
- Continuous Nevada residency for at least 12 months prior to application date[1][2]
- Applicants eligible for Medicare Part D were required to enroll in Medicare Prescription Drug Plan first and exhaust Extra Help benefits before using Senior Rx[3]

**Benefits:** Prescription medication cost assistance; specific dollar amounts or coverage limits not detailed in available documentation
- Varies by: Medicare Part D eligibility status (wrap-around coverage for Medicare-eligible vs. direct assistance for non-Medicare-eligible)

**How to apply:**
- Mail: Nevada Senior Rx, 4126 Technology Way, Suite 101, Carson City, NV 89706-2009[1]
- Phone: 1-(866) 303-6323 or 687-7555 (for Reno-Carson City-Gardnerville areas)[1]
- Online application download available through program website (specific URL not provided in sources)

**Timeline:** Not specified in available documentation
**Waitlist:** Not mentioned in available documentation

**Watch out for:**
- Program is no longer active as of December 31, 2023[6]
- Medicare-eligible applicants were required to use Medicare Part D and Extra Help first; Senior Rx was secondary coverage only[3]
- Income limits changed annually on July 1st, making historical comparisons difficult[2]
- Eligibility was redetermined annually with required notification letters[4]
- As of May 2006, only 7.6% of Senior Rx members were non-Medicare-eligible, indicating the program primarily served Medicare beneficiaries[2]

**Data shape:** Program operated as wrap-around coverage for Medicare Part D beneficiaries while also serving non-Medicare-eligible seniors. Income and asset limits adjusted annually. Program was administered at state level through DHHS with regional phone support. Now defunct; families should contact Nevada Medicare Assistance Program for current prescription assistance options.

**Source:** https://adsd.nv.gov/programs/seniors/seniorrx/srrxprog/ (now shows program closure notice)[6]

---

### Home and Community-Based Waiver for the Frail Elderly (HCBW-FE)


**Eligibility:**
- Age: 65+
- Income: 2025 limits: Individual applicant: $2,901/month. Married spouses (both applying): $5,802/month. When only one spouse applies, individual income limit applies and spouse’s income is disregarded[3].
- Assets: 2025 limits: Individual: $2,000. Married spouses (both applying): $3,000. If only one spouse applies, both spouses' assets are considered jointly owned and limited to individual threshold. Exempt assets include primary home (if applicant lives there or intends to return with equity ≤$752,000 in 2026; spouse, dependent child under 21, or blind/disabled child living there), household furnishings, and one vehicle[1][2][3].
- Nevada resident
- Require Nursing Facility Level of Care (NFLOC): Minimum score of 3 functional deficits on Nevada Medicaid LOC assessment (covers self-admin meds/treatments, ADLs like bathing/dressing/continence/transferring/mobility/eating, IADLs like meals/homemaking, supervision needs). At risk of nursing home placement within 30 days without waiver services[1][2][4]
- Living in home, loved one's home, group residential facility, or assisted living (varies by sub-category)[3][4]
- Medical costs for home care less than institutionalization (determined by ADSD)[4]
- Meet institutional Medicaid financial/non-financial criteria except institutional residence[4]

**Benefits:** Case management, homemaker, respite, adult companion, adult day care, augmented personal care, chore, home delivered meals, personal emergency response system. Must require at least one monthly service. No fixed dollar amounts or hours specified; services promote community living to avoid nursing home[5][6].

**How to apply:**
- Contact Office of Community Living (OCL) for Intake Home and Community Based application[1]
- In-person or over-the-phone interview for functional NFLOC assessment[3]
- Determined in combination with agency administering waiver (ADSD/DHCFP)[4]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may exist due to waiver caps (common for HCBS)[null]

**Watch out for:**
- Home exempt for eligibility but subject to Medicaid estate recovery without planning[2]
- Dementia diagnosis does not automatically qualify; must meet NFLOC score of 3+ deficits[1][2]
- Spousal assets jointly counted even if only one applies[3]
- Must show home care costs less than nursing home[4]
- 2026 home equity limit $752,000; confirm current figure as limits adjust[1][2]

**Data shape:** Financial limits provided for 2025 (income by marital status, assets joint for couples); NFLOC via scored functional assessment (min 3 deficits); services fixed list, statewide but agency-coordinated; sub-categories for living settings (home/group/assisted living)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dwss.nv.gov/ (DWSS) or https://adsd.nv.gov/ (ADSD); waiver details at https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/NV[4][6]

---

### Community Options Program for the Elderly (COPE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Financially eligible according to monthly income and asset guidelines established by NAC 427A; call ADSD for current income guidelines (2025 OCL Monthly Income Limits available on site). Exact dollar amounts and household size variations not specified in sources—must contact regional office.[1][2]
- Assets: Subject to asset guidelines per NAC 427A; specific limits, what counts, and exemptions not detailed—verification required by ADSD including financial documentation.[2]
- At risk of institutionalization (nursing home placement) if services not provided; meet Nursing Facility Level of Care (NFLOC), often within 30 days without services.[1][3][6]
- Reside in Nevada at home (services only while residing at home).[2]
- U.S. Citizen or alien legally admitted for permanent residency.[2]
- Provide Social Security number.[2]

**Benefits:** Case Management, Homemaker, Social Adult Day Care, Adult Companion, Attendant Care (Personal Care), Personal Emergency Response System (PERS), Chore, Respite. May allow certain family members (excluding spouses and legal guardians) to be paid for personal care services. Similar to HCBS FE Waiver but non-Medicaid.[1][3][5][6]
- Varies by: priority_tier

**How to apply:**
- Phone: Call local regional ADSD office to provide information over phone to intake team member.
- In-person or mail: Fill out OCL Program Application and submit to nearest ADSD office. List of regional offices on adsd.nv.gov.
- Online: Download forms from adsd.nv.gov (no fully online submission specified).

**Timeline:** Intake case manager contacts after completed/signed application received; screening/assessment follows to determine eligibility and services. No specific timeline stated.[1]
**Waitlist:** Possible waitlist; screening completed if placed on waitlist, full assessment if not. Used as bridge while waiting for HCBS FE Waiver.[2][6]

**Watch out for:**
- Non-Medicaid program serving as bridge for HCBS FE Waiver waitlist—may transition if Medicaid-eligible.[1][6]
- Must meet strict NFLOC (risk of nursing home within 30 days); not for general aging support.[3]
- Income/asset limits change (e.g., 2025 limits referenced)—always call for current figures.[1]
- Services only while residing at home in Nevada; family paid caregivers excluded if spouses/guardians.[5]
- Priority given (varies by tier, not detailed).[3]

**Data shape:** Statewide with regional offices; financial eligibility via changing guidelines (no fixed table in sources); waitlist common as non-Medicaid alternative to HCBS FE Waiver; NFLOC required with imminent risk focus.

**Source:** https://adsd.nv.gov/Programs/Seniors/COPE/COPE_Prog/

---

### Social Security Domiciliary Rate

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Must receive SSI with income below the Domiciliary Rate level (specific dollar amount not detailed in sources; SSI maximum in 2026 is $994 individual/$1,491 couple, but Domiciliary Rate supplements if SSI is lower). General SSI limits: countable income under federal benefit rate, assets under $2,000 individual/$3,000 couple. Varies by living arrangement (e.g., OSS C for domiciliary care facilities).[2][3][5][6]
- Assets: SSI standard: $2,000 individual, $3,000 couple. Exempt: home (if valued under $595,000), usually one car, burial plot, certain other resources.[1][3]
- Nevada resident receiving SSI.
- Living in a licensed Residential Facility for Groups (RFG) or Assisted Living Facility (ALF) providing personal care services.
- At risk of nursing home placement without services.
- Aged, blind, or disabled per SSI rules.

**Benefits:** Increase in SSI payment to the 'Domiciliary Rate' (Nevada Optional State Supplementation OSS C level for residents in licensed private non-medical domiciliary care facilities; exact 2026 dollar amount not specified, administered by SSA as supplement to federal SSI).[2][6]
- Varies by: living_arrangement

**How to apply:**
- In-person at local Social Security office: Bring RFG/ALF admission document, facility business license, federal EIN number.[2]
- Phone: Senior Focus Team at 702-672-5611 for questions/application guidance; SSA at 800-772-1213 to schedule SSI appointment.[1][2]
- Email: Senior Focus Team (details via phone).[2]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not a standalone program—requires existing SSI eligibility and move to licensed RFG/ALF.[2][6]
- Facility must be state-licensed private non-medical providing personal care to unrelated adults; public institutions serving >16 may not qualify.[6]
- Income/assets assessed under strict SSI rules; home equity cap at $595,000.[1]
- Must apply for other benefits; SSA administers but state rules apply.[3][6]
- People miss that it's an SSI supplement increase, not separate aid.

**Data shape:** Tied to SSI with Nevada Optional State Supplementation (OSS C) for specific licensed domiciliary care facilities; no standalone income table, scales with SSI living arrangement; statewide but facility-licensing required.

**Source:** https://secure.ssa.gov/apps10/poms.nsf/lnx/0501415300SF

---

### Taxi Assistance Program (TAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Monthly income below 125% of the Federal Poverty Guidelines (effective July 1, 2025) for applicant and/or spouse. Exact dollar amounts vary by household size and are based on current FPG; proof required from all sources. Older documents mention 300% FPG, but latest is 125%[1][2]. No full table provided in sources.
- Assets: No asset limits mentioned[1][2][3].
- Nevada resident (specifically Clark County resident)[1][2]
- OR permanent disability (any age): Provide physician letter or Social Security Award letter[1][2][3]
- Proof of income from all sources for applicant and/or spouse[1][2]

**Benefits:** Discounted taxicab coupon booklets accepted by all taxicab companies in Clark County. Example: Books with 20 $1 coupons or 4 $5 coupons ($20 value) purchased for $10. Tier categories exist (1-5) but specifics not detailed; coupons must be redeemed by expiration date[2][5][6].
- Varies by: priority_tier

**How to apply:**
- Mail: Complete Taxi Assistance Program Registration Form to Aging and Disability Services Division - Las Vegas Regional Office, 7150 Pollock Drive, Las Vegas, NV 89119[1]
- In-person by appointment only: 7150 Pollock Drive, Las Vegas, NV 89119 or 3320 W. Sahara Ave., Suite 100, Las Vegas, NV 89102. Cash, personal checks, or money orders only (no credit/debit cards)[1][3]
- Phone for info/appointment assistance: (702) 486-3581, Monday-Friday 8:00 a.m.-4:30 p.m. (excl. holidays)[1]

**Timeline:** Not specified; applications reviewed and notices issued[1].
**Waitlist:** Funding capacity met as of latest update; new applicants processed but no additional funding available, receive notice of decision[1].

**Watch out for:**
- Currently at funding capacity; new applicants approved but no coupons issued until funding available[1]
- Clark County residents only—not statewide[1][4]
- Appointments required for in-person; no drop-ins. Cash/check/money order only[1]
- Income at 125% FPG (recent) vs. older 300% references—use latest[1][2][3]
- Must prove permanent disability with specific docs if under 60[2]
- Coupons expire and rides may need advance scheduling[5][6]

**Data shape:** Clark County-restricted; tiered categories (1-5) for eligibility/benefits; income test at 125% FPG with proof from all sources including spouse; currently closed to new funded enrollments

**Source:** https://adsd.nv.gov/programs/seniors/tap/tap_prog/[1]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Nevada's Senior Rx Program | benefit | state | medium |
| Home and Community-Based Waiver for the  | benefit | state | deep |
| Community Options Program for the Elderl | benefit | state | deep |
| Social Security Domiciliary Rate | benefit | state | deep |
| Taxi Assistance Program (TAP) | benefit | local | deep |

**Types:** {"benefit":5}
**Scopes:** {"state":4,"local":1}
**Complexity:** {"medium":1,"deep":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/NV/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **Medicare Part D eligibility status (wrap-around coverage for Medicare-eligible vs. direct assistance for non-Medicare-eligible)**: 1 programs
- **not_applicable**: 1 programs
- **priority_tier**: 2 programs
- **living_arrangement**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Nevada's Senior Rx Program**: Program operated as wrap-around coverage for Medicare Part D beneficiaries while also serving non-Medicare-eligible seniors. Income and asset limits adjusted annually. Program was administered at state level through DHHS with regional phone support. Now defunct; families should contact Nevada Medicare Assistance Program for current prescription assistance options.
- **Home and Community-Based Waiver for the Frail Elderly (HCBW-FE)**: Financial limits provided for 2025 (income by marital status, assets joint for couples); NFLOC via scored functional assessment (min 3 deficits); services fixed list, statewide but agency-coordinated; sub-categories for living settings (home/group/assisted living)
- **Community Options Program for the Elderly (COPE)**: Statewide with regional offices; financial eligibility via changing guidelines (no fixed table in sources); waitlist common as non-Medicaid alternative to HCBS FE Waiver; NFLOC required with imminent risk focus.
- **Social Security Domiciliary Rate**: Tied to SSI with Nevada Optional State Supplementation (OSS C) for specific licensed domiciliary care facilities; no standalone income table, scales with SSI living arrangement; statewide but facility-licensing required.
- **Taxi Assistance Program (TAP)**: Clark County-restricted; tiered categories (1-5) for eligibility/benefits; income test at 125% FPG with proof from all sources including spouse; currently closed to new funded enrollments

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Nevada?
