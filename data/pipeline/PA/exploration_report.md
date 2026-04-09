# Pennsylvania Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 1.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 16 |
| New (not in our data) | 5 |
| Data discrepancies | 11 |
| Fields our model can't capture | 11 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 10 | Our model has no asset limit fields |
| `regional_variations` | 9 | Program varies by region — our model doesn't capture this |
| `documents_required` | 11 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 6 | Has waitlist info — our model has no wait time field |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 6 programs
- **service|advocacy**: 1 programs
- **in_kind**: 1 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Community HealthChoices

- **min_age**: Ours says `65` → Source says `21` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc[6]))
- **income_limit**: Ours says `$988` → Source says `$2,901` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc[6]))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Up to 32 services including long-term services and supports (LTSS) at nursing facility level of care, such as home-based care, attendant care, pest eradication, educational support; Medicare benefits continue separately via Medicare. Specific hours/dollars not fixed; determined post-needs assessment by Managed Care Organization (MCO).[4]` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc[6]))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/medicaid/chc[6]`

### PACE (Pharmaceutical Assistance Contract for the Elderly)

- **income_limit**: Ours says `$3350` → Source says `$14,500` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Pays for prescription drugs with co-payments: Generic $6 per Rx, Brand-name $9 per Rx. No monthly premium or fee.[6]` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]`

### Medicare Savings Programs

- **income_limit**: Ours says `$1400` → Source says `$1,304` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Pays Medicare Part B premium for all categories. QMB also covers Medicare Part A premiums (if applicable), deductibles, coinsurance; may include full Medical Assistance benefits (e.g., transportation). SLMB/QI-1: Part B premium only[5][6][7].` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **income_limit**: Ours says `$1980` → Source says `$2608,` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases at stores/supermarkets. Average for older adults: $106/month. Exact amount based on net income calculation (e.g., for 2-person elderly/disabled: max allotment $546 minus 30% net income).[3][5]` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults`

### LIHEAP

- **income_limit**: Ours says `$2500` → Source says `$23,940` ([source](https://www.pa.gov/agencies/dhs/resources/liheap))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time cash grant of $200-$1,000 paid directly to utility/fuel provider. Varies by household size, income, fuel type, and county (use DHS Benefit Amount Table tool for exacts). Crisis grants for households in immediate danger of no heat.` ([source](https://www.pa.gov/agencies/dhs/resources/liheap))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/liheap`

### Pennsylvania SHIP (State Health Insurance Assistance Program)

- **min_age**: Ours says `65` → Source says `65 or older (primary focus); also serves Medicare beneficiaries under 65 with disabilities[4][5]` ([source](shiphelp.org (national resource center); PA MEDI contact: 1-800-783-7067[8]))
- **benefit_value**: Ours says `Free counseling service` → Source says `Free, personalized one-on-one counseling and education; assistance with Medicare enrollment (Parts A, B, C, D); help applying for Medicaid, Medicare Savings Program, Extra Help/Low Income Subsidy; assistance with prescription drug coverage; fraud detection and reporting support[4][5][6]` ([source](shiphelp.org (national resource center); PA MEDI contact: 1-800-783-7067[8]))
- **source_url**: Ours says `MISSING` → Source says `shiphelp.org (national resource center); PA MEDI contact: 1-800-783-7067[8]`

### Home-Delivered Meals (Pennsylvania)

- **min_age**: Ours says `65` → Source says `60 years or older (some programs accept 65+)[1][2][6]`
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritionally balanced meals delivered to home. Each meal provides one-third of daily nutritional requirements as determined by US Department of Health and Human Services[2]. Meals certified by Licensed Dietitian and Pennsylvania Department of Aging[2]`

### Pennsylvania Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Reimbursement for respite care, supplemental services, consumable supplies, and other care-related expenses. Also includes care management, caregiver education, and training. Exact reimbursement percentage via sliding scale (income/household size up to 380% FPL); caregiver pays upfront and submits for reimbursement. No hiring family members for pay.` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/caregiver-support-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/caregiver-support-program`

### Legal Counsel for the Elderly / Pennsylvania Legal Aid Network

- **min_age**: Ours says `65` → Source says `60` ([source](https://palegalaid.net/ and https://www.pa.gov/services/aging/apply-for-the-older-pennsylvanians-legal-assistance-program))
- **income_limit**: Ours says `$2000` → Source says `$1,533` ([source](https://palegalaid.net/ and https://www.pa.gov/services/aging/apply-for-the-older-pennsylvanians-legal-assistance-program))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Civil legal assistance including abuse, age discrimination, guardianship defense, healthcare, housing, long-term care, Medicaid, Medicare, nutrition, Social Security/SSI, utilities. Provided by independent regional/specialized programs; no specific dollar amounts or hours stated.[2][7]` ([source](https://palegalaid.net/ and https://www.pa.gov/services/aging/apply-for-the-older-pennsylvanians-legal-assistance-program))
- **source_url**: Ours says `MISSING` → Source says `https://palegalaid.net/ and https://www.pa.gov/services/aging/apply-for-the-older-pennsylvanians-legal-assistance-program`

### Property Tax/Rent Rebate Program

- **min_age**: Ours says `65` → Source says `65 or older; widows/widowers 50 or older; people with disabilities 18 or older[2]` ([source](https://www.pa.gov/agencies/revenue/ptrr))
- **income_limit**: Ours says `$16000` → Source says `$48,110` ([source](https://www.pa.gov/agencies/revenue/ptrr))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Standard rebate ranges from $380 to $1,000 depending on income[1]. Supplemental rebates (called 'kickers') of up to $500 available for those with income $31,010 or less who live in Philadelphia, Pittsburgh, or Scranton and pay more than 15% of income in property taxes[1]. Maximum total rebate can reach $1,500 for qualifying households[1]. Specific supplemental amounts: $0–$8,550 income = $500 supplement; $8,551–$16,040 = $385 supplement; $16,041–$19,240 = $230 supplement; $19,241–$32,070 = $190 supplement[2]` ([source](https://www.pa.gov/agencies/revenue/ptrr))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/revenue/ptrr`

### PACENET (Pharmaceutical Assistance Contract for the Elderly Needs Enhancement Tier)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Reduced co-payments on prescription medications: $8 per generic prescription, $15 per brand-name prescription. Monthly premium: $37.45 (as of 2021)` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program`

## New Programs (Not in Our Data)

- **Medical Assistance** — service ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility))
  - Shape notes: Dual MAGI/Non-MAGI tracks; elderly focus on Non-MAGI with fixed asset caps ($2,000/$3,000), variable income by program (e.g., nursing home $2,982/month single); county-administered with potential waitlists for LTC/HCBS
- **Weatherization Assistance Program (WAP)** — service ([source](https://dced.pa.gov/programs/weatherization-assistance-program-wap/))
  - Shape notes: County-administered with local providers and variations in intake/waitlists/services; income at 200% FPL with local tables; priority tiers for vulnerable groups including elderly; renters require landlord approval.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.pa.gov/services/aging/apply-for-the-senior-community-service-employment-program))
  - Shape notes: County-restricted with multiple local providers; income at 125% FPL (contact for table); no asset test; benefits fixed at ~20 hours/week min wage but placements vary by region; priority tiers affect entry.
- **Pennsylvania Options Program** — service ([source](https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/pa-community-care/documents/Aging-Options_Final.pdf[6]))
  - Shape notes: County-administered with local residency requirement, sliding-fee co-pays based on finances, no fixed statewide income/asset caps, services capped variably by county (e.g., $765/month in Chester)
- **APPRISE Insurance Counseling Program (now PA MEDI)** — service ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/pa-medi-medicare-counseling[8]))
  - Shape notes: no income/asset test for counseling; statewide via 52 local Area Agencies on Aging with volunteer support; rebranded to PA MEDI but legacy APPRISE name persists regionally

## Program Details

### Medical Assistance

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For elderly (65+), categorized as Non-MAGI: Income limits vary by program type. Nursing Home Medicaid (2026): Single applicant under $2,982/month. Adults 18+ with disability: 100% Federal Poverty Limit (FPL). MAGI groups (not primary for elderly): Adults 19-64 up to 133%-138% FPL. Limits adjust annually by household size using Federal Poverty Guidelines (FPIG); no full table in sources, but determined by income/household size comparison.[1][2][3][4][6][7]
- Assets: Non-MAGI (65+, blind/disabled): $2,000 single, $3,000 couple. Countable assets include cash, bank accounts, investments, second vehicles/homes (non-primary). Exempt: primary home (if intent to return/equity under limit), one vehicle, personal belongings, burial plots/funds, life insurance (face value under $1,500), SSI/TANF/SNAP benefits. Spousal protections apply (community spouse resource allowance).[3][4][5]
- Pennsylvania residency (no duration minimum, intent to stay)
- U.S. citizenship, refugee, or qualified non-citizen status (documentation required)
- Social Security Number (or application assistance provided)
- Identity verification (e.g., driver's license)
- For long-term care: Nursing Facility Level of Care (NFLOC) or functional need in ADLs
- Blind/disabled status if applicable

**Benefits:** Comprehensive health coverage including doctor visits, hospital care, prescription drugs, lab tests, preventive services. For elderly/long-term care: nursing home, home/community-based services (HCBS), personal care, home modifications. No fixed dollar/hour amounts specified; covers costs meeting medical need.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Online: COMPASS.state.pa.us
- Phone: 1-866-550-4355
- In-person or paper: Local County Assistance Office (CAO)
- Mail: to local CAO

**Timeline:** Lengthy process; no specific timeline stated, varies by case complexity/documentation
**Waitlist:** Possible for long-term care/HCBS due to funding; not detailed

**Watch out for:**
- Multiple categories (MAGI vs Non-MAGI); elderly typically Non-MAGI with stricter asset tests—many miss asset planning
- Income includes spouse's if cohabiting, Social Security, pensions (excludes SSI/TANF/SNAP)
- Long-term care requires NFLOC; application lengthy/challenging—consider Medicaid planning if over limits
- Annual renewal required; non-citizens limited to emergencies unless qualified
- No specific household size income table provided—use FPIG calculator or apply to confirm

**Data shape:** Dual MAGI/Non-MAGI tracks; elderly focus on Non-MAGI with fixed asset caps ($2,000/$3,000), variable income by program (e.g., nursing home $2,982/month single); county-administered with potential waitlists for LTC/HCBS

**Source:** https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility

---

### Community HealthChoices


**Eligibility:**
- Age: 21+
- Income: In 2025, monthly income limit is $2,901 per applicant regardless of marital status or household size; each spouse applying is evaluated individually up to this amount. Equivalent to 300% of the Federal Benefit Rate (FBR), which adjusts annually in January.[2]
- Assets: Medicaid financial eligibility applies; specific asset limits not detailed in sources but include review of income, resources, bank accounts, property, retirement accounts, and insurance. Home equity limit of $730,000 in 2025 if applicant lives in home or intends to return, or if non-applicant spouse/dependent resides there. Home ownership exemptions apply under these conditions.[2]
- Pennsylvania resident
- Enrolled in Medicaid
- Dual eligible (Medicare and Medicaid) or qualify for Medicaid long-term services and supports (LTSS) due to nursing facility level of care (NFLOC) via Functional Eligibility Determination (FED) assessing Activities of Daily Living (ADLs) like bathing, dressing, eating
- Not ineligible: intellectual/developmental disabilities receiving Office of Developmental Programs services beyond supports coordination; residents of state-operated nursing facilities including veterans' homes; certain OBRA/Act 150 participants not NFLOC or dual eligible
- Option for 55+ to choose LIFE program instead if eligible and in service area[1][2][3][5][6][7]

**Benefits:** Up to 32 services including long-term services and supports (LTSS) at nursing facility level of care, such as home-based care, attendant care, pest eradication, educational support; Medicare benefits continue separately via Medicare. Specific hours/dollars not fixed; determined post-needs assessment by Managed Care Organization (MCO).[4]
- Varies by: priority_tier

**How to apply:**
- Phone: Pennsylvania Independent Enrollment Broker (PA IEB) at 1-877-550-4227[1]
- Online: COMPASS website[1]
- Submit PA-600 form to County Assistance Office (CAO) for financial eligibility[2][4]
- In-person needs assessment by local Area Agency on Aging (AAA)[1][4]

**Timeline:** Screening within 90 days for new dual eligibles; comprehensive needs assessment if NFCE, requested, or unmet needs identified[3]

**Watch out for:**
- Mandatory managed care for eligible; automatic enrollment for some prior waiver participants
- Excludes intellectual/developmental disabilities beyond basic supports and state nursing facility residents
- Must choose MCO after approval; Medicare benefits remain separate
- Functional Eligibility Determination (FED) required for NFLOC, not just financial
- 55+ may prefer LIFE if available in area, as alternative to CHC
- Income/assets evaluated individually even for couples[1][2][3][5][6]

**Data shape:** Managed care program via MCOs with NFLOC tiering for LTSS; financial eligibility mirrors Medicaid with individual applicant evaluation regardless of household size; regional AAAs/CAOs handle assessments

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/medicaid/chc[6]

---

### PACE (Pharmaceutical Assistance Contract for the Elderly)


**Eligibility:**
- Age: 65+
- Income: PACE: Single person ≤ $14,500; Married couple ≤ $17,700 (based on previous calendar year gross income). Note: PACENET (companion program) for higher incomes: Single $14,501–$33,500; Married $17,701–$41,500.[1][3][4][6]
- Assets: No asset limits or test; assets are not counted.[7]
- Pennsylvania resident for at least 90 consecutive days prior to application.[1][3][4]
- Not eligible for or enrolled in Medicaid pharmaceutical benefits (Department of Human Services' Medical Assistance prescription benefit).[1][3][4][6]
- Income includes: Gross Social Security/SSI (excluding Medicare premiums), pensions, wages, self-employment, alimony, annuities/IRAs, unemployment, interest/dividends, net rental, etc. Excludes: Medicare Part B premiums, Property Tax/Rent Rebates, VA Aid and Attendance, SNAP, LIHEAP, federal stimulus, etc.[5][7]

**Benefits:** Pays for prescription drugs with co-payments: Generic $6 per Rx, Brand-name $9 per Rx. No monthly premium or fee.[6]
- Varies by: program_tier (PACE vs PACENET; PACENET has higher copays: Generic $8, Brand $15; monthly premium ~$37.45)[6]

**How to apply:**
- Phone: 1-800-225-7223 (PACE hotline).[5]
- Website: https://pacecares.magellanhealth.com/.[5]
- PA MEDI helpline: 1-800-783-7067 for local assistance and application help.[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Eligibility based strictly on previous calendar year's income (e.g., 2025 income for 2026 applications).[3][4][5]
- Excludes those with any Medicaid prescription coverage, even if partial; Medicare Savings Program (Part B premium help only) may still qualify.[5]
- Income calculation specifics matter: Includes spouse's income if living together, gifts/inheritances over $300, but excludes many rebates/aid payments.[7]
- No automatic annual income limit adjustments; fixed by statute unless legislature acts.[6]
- Not the national PACE (Program of All-Inclusive Care for the Elderly) which is a different service for 55+ needing nursing home level care.[2]

**Data shape:** Two-tier structure (PACE low-income no premium; PACENET higher-income with premium/copays); no assets test; income fixed by household type (single/married couple only, no larger household table); statewide with no regional variations; funded by PA Lottery.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]

---

### Medicare Savings Programs


**Eligibility:**
- Age: 65+
- Income: MSPs in Pennsylvania have three categories with 2026 monthly income limits (varies by household size and category; limits based on Federal Poverty Level - FPL):
- **Qualified Medicare Beneficiary (QMB)**: <100% FPL ($1,304 single; higher for larger households)
- **Specified Low-Income Medicare Beneficiary (SLMB)**: <120% FPL
- **Qualifying Individual (QI-1)**: <135% FPL
Exact amounts increase annually; individuals may qualify with higher income/resources due to state disregards. Older data shows examples like $1,016 single/$1,524 couple for some categories, but use 2026 FPL-based limits from official guides[5][6]. Full table by household size available via DHS.
- Assets: Resource limits apply: typically $2,000 for single/$3,000 for married couple (higher than many MA programs). Counts wages, Social Security, pensions, interest, spouse's income if living together. Exemptions not fully detailed, but no resource test for some MAGI groups; state may disregard certain amounts. Apply even if over limits[1][5][6][7].
- Must be enrolled (or eligible to enroll) in Medicare Part B
- Pennsylvania resident (no minimum duration specified in MSP rules, though some related programs require 90 days)
- U.S. citizen, refugee, or certain lawfully admitted non-citizen (proof required)
- Age 65+ or disabled/blind

**Benefits:** Pays Medicare Part B premium for all categories. QMB also covers Medicare Part A premiums (if applicable), deductibles, coinsurance; may include full Medical Assistance benefits (e.g., transportation). SLMB/QI-1: Part B premium only[5][6][7].
- Varies by: priority_tier

**How to apply:**
- Online: COMPASS website (compass.state.pa.us)
- Phone: COMPASS at 1-800-692-7462 or Customer Service Center at 1-877-395-8930
- Mail/In-person: Local County Assistance Office (CAO)
- Form PA 600 M (Application for Payment of Medicare Premiums)

**Timeline:** Not specified in sources; typically standard Medicaid processing (45-90 days, varies)
**Waitlist:** QI-1 may have federal waitlist/priority (first-come, first-served with funding limits); others generally no waitlist[2]

**Watch out for:**
- Three tiers (QMB, SLMB, QI-1) with different income limits/benefits; check specific category
- May qualify even if income/resources exceed listed limits due to DHS disregards/deductions[5][6]
- Must have/apply for Medicare Part B; program pays premium but doesn't enroll you
- QI-1 has limited funding and potential waitlist
- Spouse's income counted if living together; spousal impoverishment rules may apply for LTSS-related
- Not all income counted the same (e.g., some VA benefits excluded for MAGI)

**Data shape:** Tiered by income level (QMB <100% FPL, SLMB <120%, QI-1 <135%); benefits scale by tier; asset limits higher than standard Medicaid; statewide but local CAO processing; FPL-based with annual updates and state-specific disregards allowing higher qualification

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (Oct 1, 2025 - Sept 30, 2026): Gross monthly income limit at 200% federal poverty level - 1: $2608, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, +$916 each additional. Households with elderly/disabled exceeding gross may qualify via net income and asset tests. Pennsylvania expanded categorical eligibility for households ≤200% FPL with no resource limit if including elderly/disabled.[1][2][4]
- Assets: No asset limit in Pennsylvania for expanded categorical eligibility households (including those with elderly/disabled ≤200% FPL). Countable resources like bank accounts excluded for primary home, one vehicle, income-producing vehicles; other vehicles count value over $4650. Federal rules for elderly/disabled over gross limit: $4500 asset limit.[1]
- U.S. citizen or qualified non-citizen.
- Social Security Number for all household members.
- Resident of Pennsylvania county where applying.
- Household (people who purchase/prepare food together) meets income tests; work reporting for able-bodied adults without dependents.
- For Simple SNAP/ESAP: All members 60+ or disabled/SSI/SSDI, no work earnings, fixed income, reasonable rent/mortgage.[2][6]

**Benefits:** Monthly EBT card benefits for food purchases at stores/supermarkets. Average for older adults: $106/month. Exact amount based on net income calculation (e.g., for 2-person elderly/disabled: max allotment $546 minus 30% net income).[3][5]
- Varies by: household_size

**How to apply:**
- Online: COMPASS website (pa.gov COMPASS tool).
- Phone: Local County Assistance Office (CAO) or helplines like 1-877-999-5964.
- Mail/In-person: County assistance office; Simple SNAP application for elderly/disabled households.
- Screening: snapscreener.com/guides/pennsylvania or local food bank assistance.

**Timeline:** Not specified in sources; contact local CAO for details.

**Watch out for:**
- Elderly/disabled households over gross income (200% FPL) can still qualify via net income/asset tests, unlike standard rules.[1]
- Pennsylvania has no asset limit for expanded categorical eligibility (≤200% FPL), broader than federal.[1][4]
- Simple SNAP/ESAP for all-elderly/disabled with no work: easier application.[2][6]
- Housing/medical expenses deducted to boost benefits for seniors.[1][3]
- Not just related family: anyone purchasing/preparing food together counts as household.[2]
- Federal changes (One Big Beautiful Bill Act 2025) may affect work/non-citizen rules.[5]

**Data shape:** Pennsylvania-expanded SNAP: no asset limit at ≤200% FPL for elderly/disabled households; special net test path if over gross; benefits scale by household size with senior deductions for shelter/medical.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults

---

### LIHEAP


**Eligibility:**
- Income: Gross annual household income at or below 150% of Federal Poverty Guidelines. For 2026-2027 (effective February 1, 2026): 1: $23,940; 2: $32,460; 3: $40,980; 4: $49,500; 5: $58,020; 6: $66,540; 7: $75,060; 8: $83,580; 9: $92,100; 10: $100,620. Add $8,520 per additional person. Includes all household members' income (related/unrelated roomers sharing expenses). Excludes: educational grants/loans (unless for basic living), home produce for consumption, Senior Citizen Rebate, work/training incentives.
- Assets: No asset or resource limits.
- Household includes all living together sharing expenses (children, relatives, unrelated roomers).
- Renters and homeowners eligible.
- No requirement for public assistance, unpaid bills, or SSN (but affidavit needed for household members 1+ without SSN).

**Benefits:** One-time cash grant of $200-$1,000 paid directly to utility/fuel provider. Varies by household size, income, fuel type, and county (use DHS Benefit Amount Table tool for exacts). Crisis grants for households in immediate danger of no heat.
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: COMPASS at https://www.pa.gov/services/dhs/apply-for-the-low-income-home-energy-assistance-program-liheap
- In-person: Local County Assistance Office (locations via county list)
- Phone/mail: Contact local County Assistance Office

**Timeline:** Not specified in sources.

**Watch out for:**
- Seasonal: Applications Dec 3, 2025-May 8, 2026 only.
- No repayment, but one-time grant per season.
- Income excludes specific items like educational aid—verify exclusions.
- Crisis grants separate for shut-off risk.
- Benefits county/fuel-specific—check table.
- Older data (e.g., 2019-2022 limits) outdated; use current 2026 figures.

**Data shape:** Income at fixed 150% FPL table by household size; no assets; benefits scale by household size, income range, county, fuel type via lookup table; seasonal with crisis tier; county-administered

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/liheap

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households must have income at or below 200% of the federal poverty level. Effective January 13, 2026: Examples include $31,920 for a single person and $66,000 for a family of four. Erie County provides a table up to 8 persons ($111,440) plus $11,360 per additional person (subject to change); York County lists $30,120 (1 person) to $105,440 (8 persons). Full current table available via local provider or https://dced.pa.gov/housing-and-development/weatherization/income-eligibility/. SSI or cash assistance recipients under Title IV/XVI in prior 12 months may qualify regardless.
- Assets: No asset limits mentioned across sources.
- Pennsylvania resident.
- Priority for elderly, disabled, families with children, high energy users.
- Homeowners or renters (renters need landlord permission and rental agreement; for multi-unit buildings, at least 66% units eligible in Erie, no multi-family in Philadelphia).
- Single-family homes, rowhomes, trailers eligible (no multi-family in some regions).
- Home not previously served within 15 years (Philadelphia) or ineligible for re-service.

**Benefits:** Free weatherization services based on energy audit, including: blower door air sealing; attic/wall/basement/crawlspace insulation and ventilation; heating system repair/replacement/modification; hot water pipe/duct wrapping; caulking/weather-stripping windows/doors; minor repairs/health-safety measures; furnace/hot water tank safety checks; refrigerator/heater replacement (Philadelphia); programmable thermostats; dryer duct replacement; CFL bulbs; in-home energy education. No dollar amount or hours specified; services once every 15 years in some areas.
- Varies by: region

**How to apply:**
- Contact local weatherization agency by county via https://dced.pa.gov/programs/weatherization-assistance-program-wap/ (find your county provider).
- Statewide helpline: 1-866-466-3972.
- Philadelphia: Email phdc.intake@phdc.phila.gov or call (215) 448-2160.
- Erie: Erie County Housing Authority (specific contact via their site).
- York: York County Planning Commission.
- In-person/mail via local provider.

**Timeline:** Not specified statewide; varies by region.
**Waitlist:** Active waitlist in Philadelphia; added to inquiry list after contact.

**Watch out for:**
- Must contact county-specific provider, not apply statewide.
- Renters need landlord permission; multi-unit buildings have unit eligibility rules.
- Active waitlists in some areas like Philadelphia.
- Homes previously weatherized may be ineligible (e.g., every 15 years in Philadelphia).
- Priority for elderly/disabled/families with children, but no strict age requirement.
- Income is gross, includes all household members; SSI auto-qualifies.
- No lien on home, but rent/eviction protections required for renters in some regions.

**Data shape:** County-administered with local providers and variations in intake/waitlists/services; income at 200% FPL with local tables; priority tiers for vulnerable groups including elderly; renters require landlord approval.

**Source:** https://dced.pa.gov/programs/weatherization-assistance-program-wap/

---

### Pennsylvania SHIP (State Health Insurance Assistance Program)


**Eligibility:**
- Age: 65 or older (primary focus); also serves Medicare beneficiaries under 65 with disabilities[4][5]+
- Income: No specific income limits stated in search results. SHIP serves 'people with limited incomes' but exact thresholds are not provided[4][5]
- Assets: Not specified in available search results
- Must be a Medicare beneficiary or eligible for Medicare[4][5][6]
- U.S. citizen or lawfully present[4]
- Pennsylvania resident[8]

**Benefits:** Free, personalized one-on-one counseling and education; assistance with Medicare enrollment (Parts A, B, C, D); help applying for Medicaid, Medicare Savings Program, Extra Help/Low Income Subsidy; assistance with prescription drug coverage; fraud detection and reporting support[4][5][6]
- Varies by: not_applicable — services are standardized across the program

**How to apply:**
- Phone: 1-800-783-7067 (PA MEDI — Pennsylvania Medicare Education and Decision Insight)[8]
- Website: Pennsylvania SHIP website (specific URL not provided in search results, but accessible via shiphelp.org)[8]
- In-person: Through local area agencies on aging and community-based partners (2,200+ local sites nationwide)[4][5]
- National hotline: 877-839-2675[4]

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- SHIP is primarily a Medicare counseling and enrollment assistance program, NOT a direct financial assistance or insurance program itself[4][5][6] — it helps people navigate and enroll in Medicare, Medicaid, and related programs
- SHIP serves Medicare beneficiaries and their families, not all elderly Pennsylvanians — eligibility requires Medicare enrollment or eligibility[4][5]
- The search results conflate CHIP (Children's Health Insurance Program) with SHIP (State Health Insurance Assistance Program) — these are completely different programs; CHIP covers children, SHIP covers Medicare beneficiaries[1][2][3]
- No specific income limits are documented in search results, making it unclear whether all 'limited income' seniors qualify or if there are thresholds
- Processing timelines, waitlists, and specific documentation requirements are not detailed in available search results

**Data shape:** SHIP is a counseling and advocacy service program, not a direct benefits program. It provides free assistance to help Medicare beneficiaries understand and enroll in existing programs (Medicare, Medicaid, prescription drug assistance). The program is delivered through a network of 2,200+ local agencies nationwide, with trained counselors and volunteers. Pennsylvania's SHIP is branded as 'PA MEDI' (Pennsylvania Medicare Education and Decision Insight). Unlike means-tested benefit programs, SHIP's eligibility criteria focus on Medicare status rather than strict income thresholds, though it targets people with 'limited incomes.' No specific dollar amounts, asset limits, or processing timelines are provided in the search results.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** shiphelp.org (national resource center); PA MEDI contact: 1-800-783-7067[8]

---

### Home-Delivered Meals (Pennsylvania)


**Eligibility:**
- Age: 60 years or older (some programs accept 65+)[1][2][6]+
- Income: Varies by program and funding source. Search results do not provide specific dollar amounts or household tables. Income eligibility is mentioned for some programs but not quantified.[6]
- Assets: Not specified in search results
- Must be a resident in a non-institutional setting (home, not nursing facility)[1]
- Must have a physical, mental, or emotional disability that prevents leaving residence regularly and/or preparing nutritious meals[1][2]
- Must be unable to access and/or prepare food for themselves[2]
- Living alone or with someone who also meets eligibility criteria (York County)[1]
- No family or informal supports available to provide meals and grocery shopping (Montgomery County)[7]
- Must be assessed by a Care Manager to determine eligibility[1][2]

**Benefits:** Nutritionally balanced meals delivered to home. Each meal provides one-third of daily nutritional requirements as determined by US Department of Health and Human Services[2]. Meals certified by Licensed Dietitian and Pennsylvania Department of Aging[2]
- Varies by: provider and funding source

**How to apply:**
- Phone: York County Area Agency on Aging: 717-771-9610[1]
- Email: aging@yorkcountypa.gov[1]
- Phone: Blair Senior Services Intake Office: 946-1235[2]
- Phone: Meals America: 215-399-5676[5]
- Contact case manager if enrolled in Pennsylvania Community HealthChoices[3]
- Contact local Area Agency on Aging (varies by county)[6]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- No single statewide program: You must contact your specific county or provider. Calling the state Department of Aging is a necessary first step.[6]
- Eligibility is highly individualized: Care managers conduct in-home assessments; meeting age and disability criteria does not guarantee approval.[1][2]
- Family/informal support disqualifies you in some counties: Montgomery County explicitly excludes those with family or other informal supports available[7]
- Multiple funding sources mean different rules: Medicaid waiver programs (Community HealthChoices, Independence, OBRA, Aging Waivers) have different eligibility than Area Agency on Aging programs[4]
- Income limits exist but are not publicly detailed: Search results mention income eligibility for some programs but provide no specific thresholds[6]
- Private pay options exist: If you don't qualify for government assistance, some providers (Mom's Meals, Meals America) offer meals at $9.49 or less per meal[3][5]
- Congregate vs. home-delivered are different: Over 500 Senior Community Centers offer congregate meals (eat on-site); home-delivered is a separate, more limited program[6]
- Processing time and waitlists are not disclosed: Search results do not specify how long approval takes or whether waitlists exist

**Data shape:** Pennsylvania's home-delivered meals landscape is fragmented across county-based Area Agencies on Aging, Medicaid waiver programs (CHC, OLTL, ODP), and private providers. There is no unified eligibility standard, application process, or benefit level. Families must identify their county and contact the appropriate local provider. Income limits, asset limits, processing times, and waitlist information are not publicly available in standard formats.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

---

### Pennsylvania Caregiver Support Program


**Eligibility:**
- Income: No financial eligibility requirement to participate. Reimbursement amount uses a sliding scale based on care receiver's total gross household income and household size, up to 380% of the Federal Poverty Level (FPL). Above 380% FPL, no financial reimbursement but other services available.
- Assets: No asset limits or tests mentioned.
- Both caregiver and care receiver must be Pennsylvania residents.
- Caregiver must be an adult primarily responsible for providing regular care.
- Must meet one of three categories:
- Category 1: Caregiver 18+; care receiver 60+ with functional deficits OR any age with Alzheimer's/related disorder; no relation or co-residency required; care receiver needs assistance with at least one ADL.
- Category 2 (Grandparent/Older Relative): Caregiver 55+, not biological parent, related by blood/marriage/adoption, legal guardianship or informal raising; care receiver child under 18; must co-reside.
- Category 3 (Older Relative Adult Disability): Caregiver 55+, related by blood/marriage/adoption (can be biological parent); care receiver 18-59 with disability; must co-reside.

**Benefits:** Reimbursement for respite care, supplemental services, consumable supplies, and other care-related expenses. Also includes care management, caregiver education, and training. Exact reimbursement percentage via sliding scale (income/household size up to 380% FPL); caregiver pays upfront and submits for reimbursement. No hiring family members for pay.
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA): Find via pa.gov or call 1-866-286-3636.
- Online: https://www.pa.gov/services/aging/apply-for-the-caregiver-support-program
- Phone: Regional AAAs (e.g., Cumberland County 717-240-6110 or 1-888-697-0371 X6110; Philadelphia PCA Cares).
- In-person: Local AAA offices.
- Requires in-home assessment.

**Timeline:** Not specified; requires in-home assessment post-contact.
**Waitlist:** Possible regional waitlists (varies by area, not detailed statewide).

**Watch out for:**
- No direct payment to caregivers; must pay upfront and seek reimbursement with receipts.
- Cannot hire/pay family members for care.
- Above 380% FPL: No financial aid, only non-financial services.
- Must live together for Categories 2/3.
- In-home assessment required for authorization.
- Reimbursement only for approved services/supplies determined during assessment.

**Data shape:** Three distinct caregiver categories with varying age/residency/relation rules; statewide via 52 AAAs with local administration; sliding-scale reimbursement (not fixed amounts) by care receiver household income/FPL up to 380%; no upfront financial eligibility but benefit tiered by income.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/caregiver-support-program

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in sources; contact local provider for current table (e.g., for 2025-2026, check HHS poverty guidelines).
- Unemployed
- Live in Pennsylvania (often limited to specific counties served by local providers)
- Authorized to work in the United States

**Benefits:** On-the-job training at community-based nonprofit and public sites (e.g., senior centers, schools, hospitals, daycare); average 20 hours per week (or 20 hours/week or 40 hours every two weeks); paid stipend at the highest of federal, state, or local minimum wage; serves as bridge to unsubsidized employment; typically lasts about 6 months.
- Varies by: region

**How to apply:**
- Contact local providers (e.g., Philadelphia: (215) 686-8450 or participant interest form at phila.gov/programs/senior-community-service-employment-program-scsep/; Westmoreland: 724-925-4084; statewide info: pa.gov/services/aging/apply-for-the-senior-community-service-employment-program)
- In-person at local offices (e.g., Crispus Attucks in York County)
- Online interest form for some regions (Philadelphia)

**Waitlist:** Possible due to funding limits; varies by region and demand (not specified)

**Watch out for:**
- Not statewide—must contact county-specific provider; eligibility often county-restricted (e.g., can't apply in Philly if living elsewhere); income is 125% FPL (stricter than some programs); priority to veterans, over 65, disabled, rural, homeless—at-risk; temporary (max ~6-12 months, not permanent job); no asset limits mentioned but prove all income sources; funding fluctuations may cause waitlists.

**Data shape:** County-restricted with multiple local providers; income at 125% FPL (contact for table); no asset test; benefits fixed at ~20 hours/week min wage but placements vary by region; priority tiers affect entry.

**Source:** https://www.pa.gov/services/aging/apply-for-the-senior-community-service-employment-program

---

### Legal Counsel for the Elderly / Pennsylvania Legal Aid Network


**Eligibility:**
- Age: 60+
- Income: Generally 125% of the Federal Poverty Guidelines (FPG), varying by household size and local program; exact 2026 figures not specified in sources but pegged to governmental guidelines (e.g., examples from related programs: individual ~$1,533-$1,916/month gross). Contact local program for current table as it increases with household size.[1][2][4]
- Assets: Varies by local program; some have asset guidelines (e.g., $5,500-$9,000 for certain benefits programs, but specific to legal aid not detailed). Personal assets may affect qualification.[4][5]
- Pennsylvania resident
- Low-income with greatest economic/social needs prioritized
- Based on local program priorities and governmental guidelines

**Benefits:** Civil legal assistance including abuse, age discrimination, guardianship defense, healthcare, housing, long-term care, Medicaid, Medicare, nutrition, Social Security/SSI, utilities. Provided by independent regional/specialized programs; no specific dollar amounts or hours stated.[2][7]
- Varies by: priority_tier|region

**How to apply:**
- Online application at palegalaid.net (processed by county program)
- Phone: 1-800-322-7572 for referrals
- Direct to local program via palegalaid.net/find-legal-help (county filter)
- PALawHELP.org for info and referrals

**Timeline:** Not specified
**Waitlist:** High demand; nationally ~50% turned away due to resources, 80% of poor's legal needs unmet[1]

**Watch out for:**
- Income at 125% FPG general but local variations/priorities apply; exceptions possible for seniors/domestic violence but not guaranteed[1][4][5]
- High demand leads to turnaways; not all qualifiers served[1]
- Asset tests may apply beyond income; contact local program essential as no centralized exact limits[4][5]
- Focus on elderly 60+ with greatest needs, not automatic for all seniors[2]

**Data shape:** Network of independent regional/specialized programs with varying local guidelines/priorities; income pegged to 125% FPG but exact tables/assets/currents require local contact; elderly prioritized via Older Pennsylvanians Legal Assistance Program integration

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://palegalaid.net/ and https://www.pa.gov/services/aging/apply-for-the-older-pennsylvanians-legal-assistance-program

---

### Property Tax/Rent Rebate Program


**Eligibility:**
- Age: 65 or older; widows/widowers 50 or older; people with disabilities 18 or older[2]+
- Income: Household income must be $48,110 or less annually[2]. When calculating income, exclude 50% of Social Security benefits[1]. Income brackets determine rebate amounts: $0–$8,550 = $1,000 max; $8,551–$16,040 = $770 max; $16,041–$19,240 = $460 max; $19,241–$48,110 = $380 max[2]
- Assets: No asset limits mentioned in available sources
- Must have owned and occupied a home or rented and occupied a residence in Pennsylvania during the year for which rebate is claimed[6]
- Homeowners must have paid property taxes prior to applying[6]
- Renters must verify their landlords were required to pay property taxes or made payments in lieu of property taxes on rental properties[6]
- Spouses, personal representatives, or estates may file on behalf of a deceased claimant who lived at least one day in the claim year and met all other eligibility requirements[1]

**Benefits:** Standard rebate ranges from $380 to $1,000 depending on income[1]. Supplemental rebates (called 'kickers') of up to $500 available for those with income $31,010 or less who live in Philadelphia, Pittsburgh, or Scranton and pay more than 15% of income in property taxes[1]. Maximum total rebate can reach $1,500 for qualifying households[1]. Specific supplemental amounts: $0–$8,550 income = $500 supplement; $8,551–$16,040 = $385 supplement; $16,041–$19,240 = $230 supplement; $19,241–$32,070 = $190 supplement[2]
- Varies by: income_level and geographic_location

**How to apply:**
- Online: pa.gov/ptrr[4]
- Mail: Applications must be postmarked by June 30[6]
- In-person: Contact district offices for assistance (specific office locations vary by representative)[5]

**Timeline:** Not specified in available sources. However, the Department of Revenue processed more than 520,000 rebates from prior-year applications[4]
**Waitlist:** No waitlist mentioned in available sources

**Watch out for:**
- Social Security income is only 50% counted toward the income limit—many seniors don't realize this can significantly lower their countable income[1][5]
- Supplemental rebates ('kickers') are not automatic for all low-income applicants; they require living in specific high-tax-burden areas (Philadelphia, Pittsburgh, Scranton, or other designated areas) AND paying more than 15% of income in property taxes[1]
- The program expanded significantly in 2023 (Act 7 of 2023/House Bill 1100), increasing income limits and maximum rebates—families who were previously ineligible should reapply[2][3]
- Income limits increase annually with inflation as of the 2023 expansion[4]
- Renters must verify their landlord paid property taxes; not all rental situations qualify[6]
- Applications must be postmarked by June 30 for the prior year's rebate[6]
- The program is supported by Pennsylvania Lottery and gaming funds, not general tax revenue[2]
- Deceased claimants' estates can still file if the person lived at least one day in the claim year[1]

**Data shape:** Benefits scale strictly by income bracket with no household-size variations mentioned. Supplemental rebates add a geographic layer (high-tax-burden cities) and a tax-burden threshold (>15% of income). The program underwent major expansion in 2023, increasing income caps and maximum rebates; families should verify current year limits. Income calculation includes specific exclusions (50% Social Security, 100% veterans' disability payments for some) that significantly affect eligibility. Application deadline is fixed (June 30 postmark) for prior-year rebates.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/revenue/ptrr

---

### PACENET (Pharmaceutical Assistance Contract for the Elderly Needs Enhancement Tier)


**Eligibility:**
- Age: 65+
- Income: {"program":"PACENET is the higher-income tier of Pennsylvania's pharmaceutical assistance programs","single_person":"$14,501 to $33,500 annual income","married_couple":"$17,701 to $41,500 combined annual income","note":"Income limits were increased by $6,000 effective February 21, 2022, under Act 94 of 2021. Income is based on previous calendar year's gross income. Medicare Part B premiums are not counted as income."}
- Must be a Pennsylvania resident for at least 90 consecutive days prior to application date
- Cannot be enrolled in the Department of Human Services' Medicaid prescription benefit (though those receiving only Medicare Part B premium assistance through the Medicare Savings Program can qualify)
- Must work with existing prescription drug coverage (Medicare Part D, retiree/union coverage, employer plans, Medicare Advantage HMO/PPO, or Veterans' Benefits VA)

**Benefits:** Reduced co-payments on prescription medications: $8 per generic prescription, $15 per brand-name prescription. Monthly premium: $37.45 (as of 2021)
- Varies by: drug_type

**How to apply:**
- Online or phone through the PACE Application Center (specific URL and phone number not provided in search results, but contact information available at https://www.aging.pa.gov/aging-services/prescriptions/Pages/default.aspx)
- In-person assistance through the PACE Application Center, which completes and submits applications for eligible persons
- Mail (specific address not provided in search results)

**Timeline:** Not specified in available sources

**Watch out for:**
- PACENET is NOT standalone insurance—it only works as a wrap-around with existing prescription drug coverage. Applicants must already have Medicare Part D or another qualifying plan.
- Income eligibility is determined by PREVIOUS calendar year's income. Someone applying in 2026 will be evaluated on 2025 income.
- People who applied in the past and were denied may now qualify under the increased income limits (as of February 2022). The Department of Aging automatically reviews previously denied applications.
- Full Medicaid recipients do NOT qualify, but those receiving only Medicare Part B premium assistance through the Medicare Savings Program CAN qualify.
- There is no automatic annual adjustment to income limits. Increases require legislative action (last increase was Act 94 of 2021).
- Co-payments are still required ($8 generic, $15 brand-name)—this is not free medication.
- The program is funded by the Pennsylvania Lottery.

**Data shape:** PACENET is the higher-income tier of a two-tier system (PACE is the lower tier for incomes ≤$14,500 single/$17,700 married). The key distinction is that PACENET serves those with moderate incomes who don't qualify for PACE but still need assistance. Income limits increased significantly in 2022, expanding eligibility by approximately 100,000 seniors. The program functions as a cost-sharing mechanism layered on top of existing prescription drug plans rather than as primary coverage.

**Our model can't capture:**
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program

---

### Pennsylvania Options Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits or financial eligibility requirement statewide; however, counties require verification of income and assets to determine sliding-fee scale co-pays or cost-sharing[1][4][5][6][7][8]
- Assets: Assets verified for cost-sharing purposes in counties like Chester, Lancaster, Montgomery, and Butler; specific limits or exemptions not detailed in sources[1][4][5][7]
- Reside in the specific county (e.g., Montgomery, Chester, Lancaster, Butler)
- U.S. citizen or lawful permanent resident
- Pennsylvania resident
- Significant unmet needs impacting daily functioning or frailty in physical/mental health
- Require assistance with activities of daily living to remain independent at home
- Lack adequate informal support from family or others
- Live in a non-institutional setting

**Benefits:** Home and community-based services including adult day care, care management, home support (light housekeeping, grocery shopping, errands, transportation), Meals on Wheels (if qualify), personal care services, personal emergency response systems; up to $765 per month in Chester County; provided on sliding-fee scale with possible co-pays[4][5][6][7]
- Varies by: region

**How to apply:**
- Phone referral: e.g., Butler County at 724-282-3008 option 3[7]
- Referral to local Area Agency on Aging or county Office of Aging for assessment (in-person home visit)
- No statewide online or mail specified; county-specific processes

**Timeline:** Not specified in sources

**Watch out for:**
- Not statewide uniform—must confirm with specific county Area Agency on Aging; residency strictly county-based
- No strict financial eligibility but co-pays based on income/assets often required
- Must be referred and assessed; services only if needs match program (not for those eligible for Medicaid waivers without pursuing them in some counties)
- Aimed at delaying institutional care; not full long-term care replacement
- Possible link to Medicaid waiver referrals (e.g., Lancaster requires waiver application or 100% private pay otherwise)

**Data shape:** County-administered with local residency requirement, sliding-fee co-pays based on finances, no fixed statewide income/asset caps, services capped variably by county (e.g., $765/month in Chester)

**Source:** https://www.pa.gov/content/dam/copapwp-pagov/en/dhs/documents/pa-community-care/documents/Aging-Options_Final.pdf[6]

---

### APPRISE Insurance Counseling Program (now PA MEDI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries[1][4][6]
- Assets: No asset limits; no financial eligibility requirements[1][4][6]
- Must be a Medicare beneficiary (typically age 65+ or under 65 with certain disabilities)[6][7]

**Benefits:** Free one-on-one confidential counseling on Medicare Parts A/B/D, Medicare Advantage, Medigap, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance (PACE/PACENET), Medicaid, appeals, claims, plan comparisons, referrals, printed materials, group presentations, and eligibility screening for other programs[1][2][3][4][5][6][7][9]

**How to apply:**
- Phone: Statewide 1-800-783-7067[5]
- Local Area Agency on Aging contacts (e.g., Franklin County: 717-263-2153[2]; Greene/Fayette/Washington: 1-888-300-2704[4]; Wesley Family Services: 412-661-1438[6])
- In-person or phone/email via local providers[6][10]
- Contact Pennsylvania Department of Aging for local office[8]

**Timeline:** Appointments available upon contact; no formal processing as it's counseling, not benefits enrollment[1][2]

**Watch out for:**
- Program rebranded to PA MEDI effective July 1, 2021 – same services, new name; still referred to as APPRISE in some areas[4][6][9]
- Not a direct benefits provider – offers counseling and assistance only, underutilized despite high value (e.g., $494k saved in one county[2])
- Services free/confidential but requires contacting local agency; no online self-scheduling statewide[1]
- Helps with but does not guarantee enrollment in savings programs which have strict income/asset limits (e.g., QMB: $1,325/mo single[5])

**Data shape:** no income/asset test for counseling; statewide via 52 local Area Agencies on Aging with volunteer support; rebranded to PA MEDI but legacy APPRISE name persists regionally

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/pa-medi-medicare-counseling[8]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medical Assistance | benefit | state | deep |
| Community HealthChoices | benefit | state | deep |
| PACE (Pharmaceutical Assistance Contract | benefit | state | medium |
| Medicare Savings Programs | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Pennsylvania SHIP (State Health Insuranc | resource | federal | simple |
| Home-Delivered Meals (Pennsylvania) | benefit | state | deep |
| Pennsylvania Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | medium |
| Legal Counsel for the Elderly / Pennsylv | resource | state | simple |
| Property Tax/Rent Rebate Program | benefit | state | deep |
| PACENET (Pharmaceutical Assistance Contr | benefit | state | medium |
| Pennsylvania Options Program | benefit | state | medium |
| APPRISE Insurance Counseling Program (no | resource | state | simple |

**Types:** {"benefit":12,"resource":3,"employment":1}
**Scopes:** {"state":10,"federal":6}
**Complexity:** {"deep":9,"medium":4,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/PA/drafts.json`.

- **Medical Assistance** (benefit) — 5 content sections, 6 FAQs
- **Community HealthChoices** (benefit) — 3 content sections, 6 FAQs
- **PACE (Pharmaceutical Assistance Contract for the Elderly)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **program_tier (PACE vs PACENET; PACENET has higher copays: Generic $8, Brand $15; monthly premium ~$37.45)[6]**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **region**: 3 programs
- **not_applicable — services are standardized across the program**: 1 programs
- **provider and funding source**: 1 programs
- **priority_tier|region**: 1 programs
- **income_level and geographic_location**: 1 programs
- **drug_type**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medical Assistance**: Dual MAGI/Non-MAGI tracks; elderly focus on Non-MAGI with fixed asset caps ($2,000/$3,000), variable income by program (e.g., nursing home $2,982/month single); county-administered with potential waitlists for LTC/HCBS
- **Community HealthChoices**: Managed care program via MCOs with NFLOC tiering for LTSS; financial eligibility mirrors Medicaid with individual applicant evaluation regardless of household size; regional AAAs/CAOs handle assessments
- **PACE (Pharmaceutical Assistance Contract for the Elderly)**: Two-tier structure (PACE low-income no premium; PACENET higher-income with premium/copays); no assets test; income fixed by household type (single/married couple only, no larger household table); statewide with no regional variations; funded by PA Lottery.
- **Medicare Savings Programs**: Tiered by income level (QMB <100% FPL, SLMB <120%, QI-1 <135%); benefits scale by tier; asset limits higher than standard Medicaid; statewide but local CAO processing; FPL-based with annual updates and state-specific disregards allowing higher qualification
- **SNAP (Supplemental Nutrition Assistance Program)**: Pennsylvania-expanded SNAP: no asset limit at ≤200% FPL for elderly/disabled households; special net test path if over gross; benefits scale by household size with senior deductions for shelter/medical.
- **LIHEAP**: Income at fixed 150% FPL table by household size; no assets; benefits scale by household size, income range, county, fuel type via lookup table; seasonal with crisis tier; county-administered
- **Weatherization Assistance Program (WAP)**: County-administered with local providers and variations in intake/waitlists/services; income at 200% FPL with local tables; priority tiers for vulnerable groups including elderly; renters require landlord approval.
- **Pennsylvania SHIP (State Health Insurance Assistance Program)**: SHIP is a counseling and advocacy service program, not a direct benefits program. It provides free assistance to help Medicare beneficiaries understand and enroll in existing programs (Medicare, Medicaid, prescription drug assistance). The program is delivered through a network of 2,200+ local agencies nationwide, with trained counselors and volunteers. Pennsylvania's SHIP is branded as 'PA MEDI' (Pennsylvania Medicare Education and Decision Insight). Unlike means-tested benefit programs, SHIP's eligibility criteria focus on Medicare status rather than strict income thresholds, though it targets people with 'limited incomes.' No specific dollar amounts, asset limits, or processing timelines are provided in the search results.
- **Home-Delivered Meals (Pennsylvania)**: Pennsylvania's home-delivered meals landscape is fragmented across county-based Area Agencies on Aging, Medicaid waiver programs (CHC, OLTL, ODP), and private providers. There is no unified eligibility standard, application process, or benefit level. Families must identify their county and contact the appropriate local provider. Income limits, asset limits, processing times, and waitlist information are not publicly available in standard formats.
- **Pennsylvania Caregiver Support Program**: Three distinct caregiver categories with varying age/residency/relation rules; statewide via 52 AAAs with local administration; sliding-scale reimbursement (not fixed amounts) by care receiver household income/FPL up to 380%; no upfront financial eligibility but benefit tiered by income.
- **Senior Community Service Employment Program (SCSEP)**: County-restricted with multiple local providers; income at 125% FPL (contact for table); no asset test; benefits fixed at ~20 hours/week min wage but placements vary by region; priority tiers affect entry.
- **Legal Counsel for the Elderly / Pennsylvania Legal Aid Network**: Network of independent regional/specialized programs with varying local guidelines/priorities; income pegged to 125% FPG but exact tables/assets/currents require local contact; elderly prioritized via Older Pennsylvanians Legal Assistance Program integration
- **Property Tax/Rent Rebate Program**: Benefits scale strictly by income bracket with no household-size variations mentioned. Supplemental rebates add a geographic layer (high-tax-burden cities) and a tax-burden threshold (>15% of income). The program underwent major expansion in 2023, increasing income caps and maximum rebates; families should verify current year limits. Income calculation includes specific exclusions (50% Social Security, 100% veterans' disability payments for some) that significantly affect eligibility. Application deadline is fixed (June 30 postmark) for prior-year rebates.
- **PACENET (Pharmaceutical Assistance Contract for the Elderly Needs Enhancement Tier)**: PACENET is the higher-income tier of a two-tier system (PACE is the lower tier for incomes ≤$14,500 single/$17,700 married). The key distinction is that PACENET serves those with moderate incomes who don't qualify for PACE but still need assistance. Income limits increased significantly in 2022, expanding eligibility by approximately 100,000 seniors. The program functions as a cost-sharing mechanism layered on top of existing prescription drug plans rather than as primary coverage.
- **Pennsylvania Options Program**: County-administered with local residency requirement, sliding-fee co-pays based on finances, no fixed statewide income/asset caps, services capped variably by county (e.g., $765/month in Chester)
- **APPRISE Insurance Counseling Program (now PA MEDI)**: no income/asset test for counseling; statewide via 52 local Area Agencies on Aging with volunteer support; rebranded to PA MEDI but legacy APPRISE name persists regionally

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Pennsylvania?
