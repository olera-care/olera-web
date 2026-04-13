# California Benefits Exploration Report

> Generated 2026-04-13 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 17 |
| New (not in our data) | 6 |
| Data discrepancies | 11 |
| Fields our model can't capture | 11 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 10 | Our model has no asset limit fields |
| `regional_variations` | 10 | Program varies by region — our model doesn't capture this |
| `waitlist` | 8 | Has waitlist info — our model has no wait time field |
| `documents_required` | 11 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 5 programs
- **service**: 9 programs
- **employment**: 1 programs
- **service|advocacy**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medi-Cal Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1762` → Source says `$1,305` ([source](https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable, auto via buy-in), Part B premiums, deductibles, coinsurance, copays for A/B services (providers cannot bill QMB for these); acts like Medigap. SLMB/QI: Pays Part B premiums only (QI funds finite block-grant, may exhaust). No retro for QMB; up to 3 months retro for SLMB/QI Part B[1][2][3][5].` ([source](https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx`

### Multipurpose Senior Services Program Waiver (MSSP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx))
- **income_limit**: Ours says `$1801` → Source says `$2,000` ([source](https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Case management by nurses/social workers; in-home personal care assistance; home-delivered meals; personal emergency response systems; adult day care; respite care; chore services; housing assistance; protective supervision; transportation; meal services; social services; communication services. No fixed dollar amounts or hours specified; services purchased as needed to avoid NF placement, within cost limits less than NF care.[1][3][6][7]` ([source](https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx`

### CalFresh

- **min_age**: Ours says `158` → Source says `60` ([source](https://www.cdss.ca.gov/calfresh))
- **income_limit**: Ours says `$1580` → Source says `$2,610` ([source](https://www.cdss.ca.gov/calfresh))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `EBT card for food purchases at authorized retailers. Maximum monthly amounts vary by household size/income/expenses (e.g., Alameda: 1 person $298; 2 $546; 3 $785; 4 $994; 5 $1,183; 6 $1,421; 7 $1,571; 8 $1,789; +$218 each additional). Seniors/disabled often get minimum $15/month; can buy prepared meals statewide via Restaurant Meals Program.[1][3][4]` ([source](https://www.cdss.ca.gov/calfresh))
- **source_url**: Ours says `MISSING` → Source says `https://www.cdss.ca.gov/calfresh`

### Weatherization Assistance Program (WAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Installation of weatherization and energy efficiency measures (e.g., insulation, air sealing, heater/water heater repair or replacement, duct sealing). Average yearly savings over $400 per household. Services every 5 years. Makes homes warmer in winter, cooler in summer, reduces energy costs.[1][2]` ([source](https://www.csd.ca.gov/Pages/Residential-Energy-Efficiency.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.csd.ca.gov/Pages/Residential-Energy-Efficiency.aspx`

### Multipurpose Senior Services Program (MSSP) Caregiver Support

- **min_age**: Ours says `65` → Source says `60 years or older (some sources cite 65+; varies by provider)[2][6][9]` ([source](https://aging.ca.gov/Programs_and_Services/Multipurpose_Senior_Services_Program/[5]))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Comprehensive care coordination and supportive services at no cost to eligible participants[2][3]. Specific services include: monthly contact with registered nurse or social worker[2]; home visits at least every three months[2][9]; care management and individualized care plans[5]; adult day care[5]; in-home personal care assistance and chore services[1][3]; home-delivered meals[1][3]; respite care for family caregivers[1][3]; transportation to medical appointments[3][6]; minor home repairs and safety modifications[3][5]; counseling and therapeutic services[5]; personal emergency response systems[1][3]; assistance with health insurance navigation[2]; client advocacy[2]; social services including friendly visits and assistance with money management[3]; translation and interpretation services[3]. No specific dollar amounts or hourly limits are provided in sources.` ([source](https://aging.ca.gov/Programs_and_Services/Multipurpose_Senior_Services_Program/[5]))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ca.gov/Programs_and_Services/Multipurpose_Senior_Services_Program/[5]`

### Senior Community Service Employment Program (SCSEP)

- **benefit_value**: Ours says `$3,000 – $8,000/year` → Source says `Paid work experience at an average of 20 hours per week (Orange County variation: 16-29 hours per week depending on funding)[1][2][4]. Participants are paid the highest of federal, state, or local minimum wage[1][2]. On-the-job training in computer or vocational skills[10]. Professional job placement assistance to find full-time or part-time employment[10]. Access to employment assistance through American Job Centers[2][5]. Work experience that can be added to a résumé[10].` ([source](https://aging.ca.gov/Programs_and_Services/Senior_Employment_and_Training/ and https://www.dol.gov/agencies/eta/seniors))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ca.gov/Programs_and_Services/Senior_Employment_and_Training/ and https://www.dol.gov/agencies/eta/seniors`

### California Senior Legal Services (via Legal Services Inc. / Area Agencies)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free legal services covering: housing, consumer fraud, elder abuse, Social Security, Supplemental Security Income (SSI), Medicare, Medi-Cal, age discrimination, pensions, nursing homes, protective services, conservatorships, landlord-tenant/eviction defense, tenant rights, reasonable accommodations for disabilities, patient rights in nursing homes, debt and consumer rights, Chapter 7 bankruptcy assistance, health insurance counseling and advocacy, Medicare counseling, caregiver legal support, estate planning, wills and trusts, financial elder abuse cases. Staff attorneys and trained Medicare counselors travel to approximately 40 convenient locations throughout the community on a regular schedule.[2][4][6]` ([source](https://aging.ca.gov/Programs_and_Services/Legal_Services/ and local Area Agencies on Aging websites))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ca.gov/Programs_and_Services/Legal_Services/ and local Area Agencies on Aging websites`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free advocacy, investigation, and complaint resolution services. No direct financial payments or hourly services. Ombudsman representatives investigate complaints, mediate conflicts, provide education, and advocate for residents' expressed wishes regarding care quality, safety, rights, and dignity.` ([source](https://aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/`

### Property Tax Postponement Program

- **income_limit**: Ours says `$4599` → Source says `$55,181` ([source](https://www.sco.ca.gov/ardtax_prop_tax_postponement.html))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Postponement (deferral) of current-year property taxes on principal residence. Taxes accrue 7% annual interest. Repaid via lien on property, due upon sale, transfer, death, or non-occupancy. Does not cover delinquent/defaulted taxes.[1][4]` ([source](https://www.sco.ca.gov/ardtax_prop_tax_postponement.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.sco.ca.gov/ardtax_prop_tax_postponement.html`

### In-Home Supportive Services (IHSS)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `In-home services including housecleaning, meal preparation, laundry, grocery shopping, personal care (bathing, grooming, bowel/bladder care, paramedical services), accompaniment to medical appointments, protective supervision for mentally impaired. Up to 283 hours/month maximum (varies by assessed need via functional index ranking 1-6 during home assessment). No fixed dollar amount; county authorizes hours based on biopsychosocial assessment.` ([source](https://www.cdss.ca.gov/in-home-supportive-services))
- **source_url**: Ours says `MISSING` → Source says `https://www.cdss.ca.gov/in-home-supportive-services`

### Caregiver Resource Centers (CRC)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Core services include: Specialized information and referral for caregiver stress, diagnoses, and resources; family consultation and care planning; respite care (financial assistance for in-home support, adult day care, short-term/weekend care, transportation); short-term counseling (individual, family, group); support groups (online/in-person); professional training workshops; legal/financial consultation (Powers of Attorney, Advance Directives, estate planning, conservatorships); education workshops on cognitive disorders, dementia, long-term care, stress management. Serves over 14,000 families annually; no specific dollar amounts or hours per week stated[4][5].` ([source](https://www.dhcs.ca.gov/services/MH/Pages/AdultsCaregiverResourceCenters.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhcs.ca.gov/services/MH/Pages/AdultsCaregiverResourceCenters.aspx`

## New Programs (Not in Our Data)

- **Community Based Adult Services (CBAS)** — service ([source](https://aging.ca.gov/Providers_and_Partners/Community-Based_Adult_Services/))
  - Shape notes: CBAS is a Medi-Cal Managed Care benefit with highly fragmented administration: eligibility and benefits vary by managed care plan, making it difficult to provide universal specifics. The program is geographically restricted to 28 counties with 310 centers. Income limits follow Medi-Cal standards (not program-specific), and asset limits were recently reinstated. Functional eligibility is determined through a standardized tool (CEDT) rather than categorical criteria alone. The program serves adults 18+ (not just seniors), though it is commonly used by older adults. Specific benefit amounts, service hours, and application procedures are plan-dependent and not centrally documented in public materials.
- **LIHEAP (Low-Income Home Energy Assistance Program)** — financial ([source](https://www.csd.ca.gov/pages/liheapprogram.aspx))
  - Shape notes: LIHEAP benefits are allocated based on a priority tier system rather than fixed dollar amounts. Income limits scale by household size with a formula for households exceeding 10 persons. The program operates through multiple regional service providers, which may have different processing times and local requirements. Federal funding ($212 million for FFY 2026) is limited, creating a gap between eligible households and those who receive benefits. Automatic eligibility exists for certain government benefit program enrollees.
- **Health Insurance Counseling and Advocacy Program (HICAP)** — service ([source](https://www.aging.ca.gov/Providers_and_Partners/Health_Insurance_Counseling_and_Advocacy_Program/Program_Narrative_and_Fact_Sheets/))
  - Shape notes: HICAP is a consumer-oriented counseling and advocacy program, not a direct financial benefit program. It serves as a gateway to understanding Medicare options and accessing cost-saving programs. The program is geographically fragmented across California with different area agencies serving different counties. Critical information gaps in available sources include specific income/asset limits, processing times, application forms, required documents, and detailed regional service variations. The program's primary value is in education and navigation support rather than direct financial assistance.
- **Meals on Wheels (via Older Americans Act / CA Dept. of Aging)** — service ([source](https://aging.ca.gov/Providers_and_Partners/Home-Delivered_Nutrition/Program_Narrative_and_Fact_Sheets/))
  - Shape notes: No income or asset test statewide; eligibility driven by homebound/need status and local AAA variations; benefits via local providers with priority for low-income/rural/minority; delivered through 33 AAAs with geographic service zones
- **State Supplementary Payment (SSP)** — financial ([source](https://www.cdss.ca.gov/inforesources/cdss-programs/ssi-ssp/ssi-ssp-eligibility-summary))
  - Shape notes: SSP automatically supplements federal SSI with fixed state add-on amounts for individual/couple; eligibility tied to federal SSI income/resource tests with California-specific grant levels; no separate state income/asset limits or household size table beyond couple.
- **Community-Based Adult Services (CBAS)** — service ([source](https://aging.ca.gov/Programs_and_Services/Community-Based-Adult-Services/))
  - Shape notes: CBAS is a geographically restricted program (28 of 58 California counties only). Eligibility is determined through Medi-Cal qualification (income limits vary by household composition and are not program-specific) plus medical/functional criteria assessed via standardized tool (CEDT). Asset limits recently changed (January 1, 2026). The program is primarily administered through Medi-Cal Managed Care Plans, creating decentralized eligibility determination. Specific service hours, frequency, and benefit amounts are not standardized in available documentation and may vary by individual plan approval.

## Program Details

### Medi-Cal Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Income limits are monthly and based on Federal Poverty Level (FPL), updated annually (e.g., 2025 limits from Sourcewise: QMB $1,305 single/$1,763 couple (100% FPL); SLMB $1,566 single/$2,116 couple (120% FPL); QI $1,762 single/$2,381 couple (135% FPL). Earlier 2025 reference: under $21,597 annual single/$29,187 couple, approx. aligning with QMB. Limits change April 1 yearly; countable income used. Household size primarily individual/couple; larger households may adjust via FPL scaling but typically listed as single/couple for Medicare programs[1][3][7].
- Assets: Resources limited to $9,090 individual/$13,630 couple federally, but California has higher limits per some sources ($130,000 individual/$195,000 couple); states can be more generous. What counts: bank accounts, stocks (not specified in detail). Exempt: primary home, one car, personal belongings, burial plots (standard Medi-Cal rules apply)[2][7].
- Eligible for Medicare Part A and Part B (must enroll in Part B; Part A auto-enrolled if approved for QMB via CA Part A Buy-In starting 2025)[1][6]
- California resident[4][5]
- U.S. citizen or qualified non-citizen entitled to full-scope Medi-Cal[6]
- Meet other Medi-Cal requirements (e.g., complete forms, verify info, report changes within 10 days, annual redetermination)[6]

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable, auto via buy-in), Part B premiums, deductibles, coinsurance, copays for A/B services (providers cannot bill QMB for these); acts like Medigap. SLMB/QI: Pays Part B premiums only (QI funds finite block-grant, may exhaust). No retro for QMB; up to 3 months retro for SLMB/QI Part B[1][2][3][5].
- Varies by: priority_tier

**How to apply:**
- Mail form to local county social services agency[5]
- Contact county Medi-Cal office (varies by county; no statewide phone listed)
- Through full Medi-Cal application (may qualify additionally)[5]
- In-person at county social services[6]

**Timeline:** Not specified in sources; effective first day of month for QMB[2]; retro up to 3 months for SLMB/QI[5]
**Waitlist:** QI may have waitlist or denial if block-grant funds exhausted[2]

**Watch out for:**
- Must be enrolled in Medicare Part B upfront (cannot evaluate without)[6]
- Providers cannot bill QMB for Medicare cost-sharing, but choose those accepting Medi-Cal to avoid issues[3]
- QI/SLMB only Part B premium (no deductibles/copays covered)[3]
- CA became Part A Buy-In state Jan 2025: auto-enrolls QMB in Part A[1]
- Estate recovery for certain services if over 55[5]
- Income/resources countable; meet all Medi-Cal non-financial rules[6][7]
- Apply even if on Medi-Cal, as MSP pays premiums Medi-Cal may not[3]

**Data shape:** Tiered by program (QMB/SLMB/QI) with escalating income limits (100%/120%/135% FPL); primarily single/couple tables; asset limits state-varying/higher than federal; county-administered statewide; finite QI funding

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx

---

### Multipurpose Senior Services Program Waiver (MSSP)


**Eligibility:**
- Age: 60+
- Income: No specific dollar amounts or household size table; must be currently eligible for Medi-Cal under a qualifying primary aid code. Medi-Cal eligibility follows standard rules (e.g., income generally up to 138% FPL, with asset limits of $2,000 for individual/$3,000 couple starting 1/1/26 per some sources, but consult Medi-Cal for exacts as MSSP does not impose separate limits).[1][6]
- Assets: Tied to Medi-Cal eligibility; no separate MSSP asset limits specified. Standard Medi-Cal countable assets exclude primary home, one vehicle, personal belongings, etc. Asset test tightening to $2,000 individual/$3,000 couple effective 1/1/26.[3]
- Medi-Cal eligible
- Require Nursing Facility Level of Care (NFLOC), assessed via MSSP Level of Care Certification Form by registered nurse based on ADLs/IADLs
- Reside in a county with an MSSP site/provider
- Appropriate for care management (not receiving duplicative Medi-Cal ECM or TCM services)
- Total annual MSSP costs must be less than nursing facility costs
- Not enrolled in another HCBS waiver
- At risk of institutionalization but can remain safely at home with services

**Benefits:** Case management by nurses/social workers; in-home personal care assistance; home-delivered meals; personal emergency response systems; adult day care; respite care; chore services; housing assistance; protective supervision; transportation; meal services; social services; communication services. No fixed dollar amounts or hours specified; services purchased as needed to avoid NF placement, within cost limits less than NF care.[1][3][6][7]
- Varies by: region

**How to apply:**
- Contact local MSSP site/provider in your county (no statewide phone; find via CDA or DHCS sites)
- In-person assessment by MSSP nurse for NFLOC certification
- No specific online application or form number listed; starts with eligibility screening and nurse evaluation

**Timeline:** Not specified in sources
**Waitlist:** Waiver slots capped at 11,940 per year (2024-2029); not an entitlement, limited slots may cause waitlists or denials despite eligibility.[3][4]

**Watch out for:**
- Not available statewide—must live in MSSP site county; check local availability first
- Limited slots (11,940/year); eligibility doesn't guarantee enrollment due to caps
- Must meet NFLOC via nurse assessment—not automatic for age 60+
- Cannot receive duplicative services like ECM/TCM; only one HCBS waiver
- Tied to Medi-Cal; asset limits tightening 1/1/26 may affect new applicants
- Costs must be < NF care; high-need cases may not qualify if too expensive
- Age lowered to 60 in 2024 renewal, but some older sources say 65—use current 60

**Data shape:** County-restricted to MSSP provider sites only (not statewide); no separate income/asset limits (uses Medi-Cal); benefits via care management, not fixed hours/dollars; strict NFLOC + cost containment + slot caps

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx

---

### Community Based Adult Services (CBAS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Must be eligible for Medi-Cal under a qualifying primary Medi-Cal aid code. Specific income thresholds are not detailed in available sources but are determined by Medi-Cal eligibility standards, which vary by household composition and are set by the state.[1][2]
- Assets: As of January 1, 2026, asset limits are $130,000 for an individual and $195,000 for a couple.[2] Prior to this date, there was no asset limit. The search results do not specify what types of assets count toward this limit or what exemptions may apply.
- Must reside in a county with a CBAS center or live within one hour's drive of a CBAS center in a nearby county.[2]
- Must meet one of the following medical/functional criteria:[3][4] (1) Nursing Facility Level of Care A (NF-A) or above; (2) Chronic acquired or traumatic brain injury and/or chronic mental illness; (3) Alzheimer's disease or other dementia (stage 5, 6, or 7); (4) Mild cognitive impairment, including moderate Alzheimer's (stage 4 dementia); (5) Developmental disability; or (6) Physician/nurse practitioner request for CBAS services.[3]
- Functional eligibility is determined using the CBAS Eligibility Determination Tool (CEDT), which assesses ability to complete Activities of Daily Living (ADLs) and Instrumental Activities of Daily Living (IADLs) such as bathing, mobility, dressing, medication management, meal preparation, and money management.[2]
- For individuals with dementia, cognitive impairments (memory, decision-making, judgment) are considered, but a dementia diagnosis alone does not guarantee eligibility.[2]
- Must be enrolled in a Medi-Cal Managed Care Plan, or if exempt from managed care, must be eligible through the state's fee-for-service program.[1][9]

**Benefits:** Daytime health program providing supervision, assistance, and services to help participants maintain independence and avoid institutionalization. Members can be approved for services up to 7 days per week.[4][6] Specific services, hourly allocations, and daily rates are not detailed in the available search results.
- Varies by: Potentially by region and managed care plan, but specific variations are not documented in available sources.

**How to apply:**
- Through your Medi-Cal Managed Care Plan (primary route for most beneficiaries).[9]
- Through the Los Angeles Medi-Cal Field Office or its designee (for Medi-Cal beneficiaries ineligible to enroll in managed care).[9]
- Specific phone numbers, websites, and mail addresses are not provided in the search results.

**Timeline:** Not specified in available sources. Initial eligibility determination is performed through a face-to-face review by a registered nurse with level of care determination experience.[5][6]
**Waitlist:** Not documented in available sources.

**Watch out for:**
- CBAS is primarily a Medi-Cal Managed Care benefit—you must be enrolled in a Medi-Cal Managed Care Plan to access it (with limited exceptions for those exempt from managed care).[1][9]
- Geographic availability is limited: the program only operates in 28 of California's 58 counties, and you must live within one hour's drive of a center.[2]
- Asset limits were reinstated effective January 1, 2026 ($130,000 individual / $195,000 couple) after a period with no asset limit—families should verify current limits with their plan.[2]
- A dementia diagnosis alone does not qualify someone; functional impairment must be demonstrated using the CEDT tool.[2]
- Eligibility determination requires a face-to-face review by a registered nurse—this is not a paper-based application process.[5][6]
- The program is administered by three state agencies (DHCS, CDPH, and CDA), which may create complexity in the application process depending on your managed care plan.[1]
- Non-Medi-Cal participants can access Adult Day Health Care (ADHC) services at licensed centers by paying out-of-pocket, but this is a separate program from CBAS.[1]
- Specific dollar amounts for benefits, hourly allocations, and daily rates are not disclosed in publicly available materials—families must contact their managed care plan directly for this information.

**Data shape:** CBAS is a Medi-Cal Managed Care benefit with highly fragmented administration: eligibility and benefits vary by managed care plan, making it difficult to provide universal specifics. The program is geographically restricted to 28 counties with 310 centers. Income limits follow Medi-Cal standards (not program-specific), and asset limits were recently reinstated. Functional eligibility is determined through a standardized tool (CEDT) rather than categorical criteria alone. The program serves adults 18+ (not just seniors), though it is commonly used by older adults. Specific benefit amounts, service hours, and application procedures are plan-dependent and not centrally documented in public materials.

**Source:** https://aging.ca.gov/Providers_and_Partners/Community-Based_Adult_Services/

---

### CalFresh


**Eligibility:**
- Age: 60+
- Income: For most households, gross monthly income must be at or below 200% of the Federal Poverty Level (FPL). Example for Alameda County (recent data): 1 person $2,610; 2 $3,526; 3 $4,442; 4 $5,360; 5 $6,276; 6 $7,192; 7 $8,110; 8 $9,026; each additional +$918. For elderly/disabled households (60+ or disabled), eligibility uses net monthly income (after deductions); gross limit may not apply. Seniors qualify at 130% FPL in some contexts (e.g., CSFP example: 1 person $1,580; 2 $2,137). Deduct out-of-pocket medical (> $35, up to $185 standard, actual over $185) and housing costs. SSI/SSP recipients often eligible.[2][3][4][5][1]
- Assets: Elderly/disabled households exempt from asset test if net income qualifies; otherwise, countable resources < $3,250. Exempt: home, household goods, car (any value), retirement accounts (IRAs, pensions), EITC, burial plots, federal tax refunds, Native American funds, personal items. Additional exceptions for self-employed or domestic violence victims.[2]
- California resident.
- U.S. citizen or qualified non-citizen (immigrants 55+ eligible via CFAP regardless of status in some expansions).
- Household defined as those who buy/prepare food together; elderly/disabled can form separate household even if sharing meals, if others' income ≤165% FPL.
- No work registration for elderly/disabled.
- Provide SSN or apply for all members.
- Report expenses for deductions.

**Benefits:** EBT card for food purchases at authorized retailers. Maximum monthly amounts vary by household size/income/expenses (e.g., Alameda: 1 person $298; 2 $546; 3 $785; 4 $994; 5 $1,183; 6 $1,421; 7 $1,571; 8 $1,789; +$218 each additional). Seniors/disabled often get minimum $15/month; can buy prepared meals statewide via Restaurant Meals Program.[1][3][4]
- Varies by: household_size

**How to apply:**
- Online: https://www.getcalfresh.org (statewide).
- Phone: 1-877-847-3663 (county-specific lines vary, e.g., contact local social services).
- Mail or in-person: Local county social services office (e.g., Alameda, LA, Ventura, Riverside counties have offices).

**Timeline:** Typically 30 days; expedited for urgent cases within 3 days if qualify.

**Watch out for:**
- Elderly/disabled get special rules (net income test, no asset limit often, medical/shelter deductions) missed by families applying as full household.
- Can separate elderly member into own household for easier qualification even if sharing food.
- Report all medical/housing costs to maximize benefits; minimum $15 but often more.
- SSI recipients auto-eligible but must apply separately.
- No work requirements for 60+.
- Restaurant Meals Program statewide for prepared food.
- Immigrants 55+ may qualify via CFAP expansions.

**Data shape:** Special rules for elderly/disabled: net income test, no/low asset limits, high deductions for medical/housing; benefits scale by household size with minimums; county-administered statewide.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.cdss.ca.gov/calfresh

---

### LIHEAP (Low-Income Home Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: {"description":"2026 monthly gross household income limits (California)[1][6]","table":{"1_person":"$3,331.66","2_person":"$4,356.83","3_person":"$5,382.00","4_person":"$6,407.16","5_person":"$7,432.25","6_person":"$8,457.41","7_person":"$8,649.66","8_person":"$8,841.83","9_person":"$9,034.08","10_person":"$9,226.25","additional":"For households with more than 10 persons, add $192.21 for each additional person[6]"},"note":"Income eligibility is based on total monthly gross household income[2]"}
- Household must meet income requirements[1]
- Applicant must have a Social Security number[1]
- Must demonstrate financial need[3]
- Eligibility may vary based on sources of income and other factors[6]

**Benefits:** Direct bill payment assistance for home energy costs (heating and cooling)[7]
- Varies by: priority_tier

**How to apply:**
- Online: California Online Application Portal (caliheapapply.com)[5]
- Phone: 1-866-674-6327 (toll-free)[4] or 1-866-675-6623 for LIHEAP income guidelines and participating agencies[8]
- In-person or mail: Contact your local service provider (see geography section)[1]

**Timeline:** Several weeks[2]. During processing, applicants must continue paying their bills[2].
**Waitlist:** Not explicitly mentioned in search results, but federal funding is limited and some eligible households may not receive benefits due to prioritization of vulnerable populations[7]

**Watch out for:**
- Funding is limited: Even if you meet income requirements, you may not receive benefits if your household is not prioritized as having the greatest need[7]
- You must continue paying bills during processing: The program does not guarantee payment during the several-week review period[2]
- Income documents must be recent: All supporting documents must be dated within 30 days of application receipt; older documents will delay processing[2]
- Application completeness is critical: IMACA (and likely other providers) cannot process applications until all supporting documents are submitted[2]
- Applicant name doesn't need to be on the bill: Anyone 18+ in the household can apply, even if they're not the account holder[1]
- Renters can apply: Whether you pay bills directly or through rent, you may qualify[3]
- Public/subsidized housing eligibility varies: Your ability to receive LIHEAP depends on where you live and how you pay energy costs[3]
- Energy provider payment plans available: While waiting for LIHEAP processing, ask your energy provider about lower rates and payment plans[2]

**Data shape:** LIHEAP benefits are allocated based on a priority tier system rather than fixed dollar amounts. Income limits scale by household size with a formula for households exceeding 10 persons. The program operates through multiple regional service providers, which may have different processing times and local requirements. Federal funding ($212 million for FFY 2026) is limited, creating a gap between eligible households and those who receive benefits. Automatic eligibility exists for certain government benefit program enrollees.

**Source:** https://www.csd.ca.gov/pages/liheapprogram.aspx

---

### Weatherization Assistance Program (WAP)


**Eligibility:**
- Income: Based on federal poverty guidelines (exact dollar amounts not specified in sources; vary by household size and must meet low-income thresholds). Income sources and other factors affect eligibility. Priority for elderly (60+), disabled, households with children under 6, and vulnerable populations.[1][2][3]
- Assets: No asset limits mentioned in sources.
- Household must qualify under Department of Energy guidelines including income, household size, energy use, and other factors.[1]
- Provide proof of monthly income for entire household.[2]
- Live in service area (e.g., specific counties like Alameda for some providers).[2]
- Own residence or have landlord approval for renters.[2]
- Home at least 5 years old in some related programs.[7]

**Benefits:** Installation of weatherization and energy efficiency measures (e.g., insulation, air sealing, heater/water heater repair or replacement, duct sealing). Average yearly savings over $400 per household. Services every 5 years. Makes homes warmer in winter, cooler in summer, reduces energy costs.[1][2]
- Varies by: priority_tier

**How to apply:**
- Call local provider (e.g., CSET Weatherization Hotline: 1-844-224-1316).[5]
- Contact Spectrum Community Services for Alameda County.[2]
- Visit agency website or call for appointment (e.g., 211 LA for LA area).[3]
- Call state administrator via CSD for local providers.[1][6]

**Timeline:** Not specified; emergency appointments for disconnect notices within 1-2 days in some areas.[3]
**Waitlist:** Prioritization based on need, income, vulnerable populations; potential waitlists due to funding and demand.[1]

**Watch out for:**
- Not all services guaranteed; partial list only.[2]
- Priorities for elderly (60+), disabled, young children—may affect wait times.[1][2][3]
- Separate from LIWP (multifamily/farmworker focus) and ESA (PG&E-specific).[1][4][7]
- Requires landlord permission for renters; homeowner or renter both eligible but site-specific.[1][2][8]
- Services once every 5 years, not annual.[2]
- Funding from DOE, state; availability depends on local provider capacity.[1][5]

**Data shape:** Administered statewide via local providers with regional variations in offices, wait times, and exact services; priority-based access for vulnerable households like elderly; income at poverty guidelines without published table; no fixed age requirement but elderly prioritized.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.csd.ca.gov/Pages/Residential-Energy-Efficiency.aspx

---

### Health Insurance Counseling and Advocacy Program (HICAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 years or older, OR younger than 65 with a disability and eligible for Medicare+
- Income: Not specified in available sources. Search results indicate income and asset limits exist for certain cost-saving programs administered through HICAP (Medicare Savings Programs, QMB, SLMB, QI), but specific dollar amounts are not provided.
- Assets: Not specified in available sources. Mentioned as a requirement for qualifying for certain cost-saving programs, but specific thresholds and exemptions are not detailed.
- Must be eligible for Medicare Part A
- U.S. citizens or lawfully admitted immigrants must have continuously lived in the U.S. for five years
- Noncitizens should contact HICAP before their fifth year of permanent residency

**Benefits:** Free one-on-one health insurance counseling and education; printed materials; referrals to other agencies. Counselors answer questions about Medicare Parts A, B, and D; Medicare Supplement Insurance (Medigap); Medicare Advantage Plans; long-term care insurance; Medicare Savings Programs; prescription drug assistance; and Medicaid.

**How to apply:**
- Phone: (800) 434-0222 (toll-free)
- Website: https://www.aging.ca.gov/hicap/
- Email: denise.crandall@aging.ca.gov
- In-person at California Department of Aging, 1300 National Drive, Suite 200, Sacramento, CA 95834-1992

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- This is a counseling and education program, not a financial assistance program — it helps people understand their options and navigate Medicare, but does not directly pay medical bills or premiums
- Geographic service area is limited; not all California counties are served by the funded program described in search results
- Income and asset limits exist for certain cost-saving programs (Medicare Savings Programs, QMB, SLMB, QI) that HICAP counselors can help access, but specific thresholds are not provided in these search results
- Noncitizens have a five-year continuous residency requirement; those approaching this milestone should contact HICAP proactively
- Program hours are 8:00 AM – 4:00 PM; availability may be limited outside these times

**Data shape:** HICAP is a consumer-oriented counseling and advocacy program, not a direct financial benefit program. It serves as a gateway to understanding Medicare options and accessing cost-saving programs. The program is geographically fragmented across California with different area agencies serving different counties. Critical information gaps in available sources include specific income/asset limits, processing times, application forms, required documents, and detailed regional service variations. The program's primary value is in education and navigation support rather than direct financial assistance.

**Source:** https://www.aging.ca.gov/Providers_and_Partners/Health_Insurance_Counseling_and_Advocacy_Program/Program_Narrative_and_Fact_Sheets/

---

### Meals on Wheels (via Older Americans Act / CA Dept. of Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income requirement
- Assets: No asset limits or tests mentioned
- Homebound by reason of illness, disability, or otherwise isolated; limited ability to leave home unassisted, shop for, or prepare nutritious meals; or social/economic need for home-delivered or to-go meals
- Spouses of eligible participants (regardless of age) may receive meals if beneficial to the participant
- Individuals with a disability residing at home with an older individual may receive a meal if in the best interest of the older adult
- Must reside in the service delivery area of a local provider (varies by location)
- Area Agencies on Aging (AAAs) may have additional local eligibility criteria

**Benefits:** Nutritious home-delivered meals or to-go meals (each providing at least one-third of Dietary Reference Intakes if one meal per day, or two-thirds if two meals per day, following Dietary Guidelines for Americans); nutrition education; nutrition risk screening; nutrition counseling (in some areas); informal safety check via delivery contact to reduce isolation and link to other services
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or in-person for assessment (find local AAA via https://aging.ca.gov/Programs_and_Services/Meal_Programs/ or local search)
- No statewide online application or specific form identified; process involves initial assessment of health, mobility, financial status, dietary needs, emergency contacts, and medical conditions
- Phone: Use local AAA contact (no single statewide number; locate via CA Dept. of Aging site)
- In-person or phone assessment required; mail not specified as primary

**Timeline:** Varies by local program; approval times differ, patience required
**Waitlist:** Possible due to local capacity and demand variations; not statewide

**Watch out for:**
- No statewide income limit, but some local programs use income for sliding-scale fees or priority (low-income prioritized)
- Must be in specific delivery zone; verify local coverage first
- Homebound/isolated status key—those who can easily leave home or have cooking help may not qualify
- AAAs may add local criteria; spouses/disabled co-residents not automatic
- Voluntary contributions requested but no one denied; car ownership or non-homebound status may disqualify in some areas
- Program code 3890200 for reference in inquiries

**Data shape:** No income or asset test statewide; eligibility driven by homebound/need status and local AAA variations; benefits via local providers with priority for low-income/rural/minority; delivered through 33 AAAs with geographic service zones

**Source:** https://aging.ca.gov/Providers_and_Partners/Home-Delivered_Nutrition/Program_Narrative_and_Fact_Sheets/

---

### Multipurpose Senior Services Program (MSSP) Caregiver Support


**Eligibility:**
- Age: 60 years or older (some sources cite 65+; varies by provider)[2][6][9]+
- Income: Must be eligible for Medi-Cal with an approved aid code and no share of cost[2][9]. Specific dollar amounts for income thresholds are NOT provided in available sources; these are determined by Medi-Cal eligibility rules, which vary by household size and composition. Contact your local MSSP provider or Medi-Cal office for exact income limits applicable to your household.
- Assets: Not specified in available sources. Asset limits would follow Medi-Cal rules; contact your local provider for specifics.
- Require assistance with at least two activities of daily living (ADLs) including bathing, dressing, mobility, eating, toileting, or medication management[2][9]
- Have a need for care management services[2]
- Be certified or certifiable for placement in a skilled or intermediate nursing facility (nursing home level of care)[1][3][4]
- Live within the MSSP service area of your provider[2]
- Be willing to participate in care management phone calls and in-person visits[2]
- Total annual combined cost of care management and services must be lower than cost of skilled nursing facility care[5]

**Benefits:** Comprehensive care coordination and supportive services at no cost to eligible participants[2][3]. Specific services include: monthly contact with registered nurse or social worker[2]; home visits at least every three months[2][9]; care management and individualized care plans[5]; adult day care[5]; in-home personal care assistance and chore services[1][3]; home-delivered meals[1][3]; respite care for family caregivers[1][3]; transportation to medical appointments[3][6]; minor home repairs and safety modifications[3][5]; counseling and therapeutic services[5]; personal emergency response systems[1][3]; assistance with health insurance navigation[2]; client advocacy[2]; social services including friendly visits and assistance with money management[3]; translation and interpretation services[3]. No specific dollar amounts or hourly limits are provided in sources.
- Varies by: region (different providers offer services in different counties; some services may be more readily available in certain areas)

**How to apply:**
- Phone: Contact your local MSSP provider directly. Example: Huntington Hospital MSSP: (800) 664-4664 or (626) 397-3110 option 1[9]
- Phone: California Department of Aging (statewide): 1-800-677-1116 (for general information and referral to local providers)[5]
- In-person: Visit your local MSSP provider office (varies by county)
- Mail: Contact your local provider for mailing address
- Online: Contact your local provider for website-specific application portals (not centralized)

**Timeline:** Not specified in available sources. Contact your local MSSP provider for estimated processing timeline.
**Waitlist:** Not mentioned in available sources. Contact your local provider to determine if waitlists exist in your service area.

**Watch out for:**
- Age requirement varies by source (60+ vs. 65+) and may differ by provider — verify with your local provider[2][6][9]
- Medi-Cal eligibility is a hard requirement; you cannot qualify for MSSP without Medi-Cal, and it must have no share of cost[2][9]
- You must be certified as needing nursing home level of care — this is not automatic and requires assessment by MSSP staff[8]
- MSSP is designed to keep costs lower than nursing facility care; if your care needs are too complex or expensive, you may not qualify[5]
- MSSP can work alongside In-Home Supportive Services (IHSS) and other programs without duplication, but coordination is required[3][5]
- Participants can change their mind and withdraw without impacting other services[3]
- Services are free, but availability and specific service offerings vary significantly by provider and region — what's available in one county may not be in another
- No centralized online application portal exists; you must contact your local provider directly
- Processing timelines and waitlist status are not publicly documented — contact your provider for current wait times
- The program includes both nursing home diversion (preventing placement) and transition services (helping people return home from facilities)[1]

**Data shape:** MSSP is a decentralized, provider-based program administered statewide by the California Department of Aging but operated by 37 different organizations across counties. This creates significant regional variation in application processes, wait times, and service availability. Eligibility is primarily determined by Medi-Cal status (not MSSP-specific income/asset limits), functional need (ADL assistance), and nursing home certification. Benefits are service-based (not cash) and comprehensive but not quantified in dollar amounts or hours. The program is designed as a cost-containment mechanism — total care costs must stay below nursing facility costs. No centralized application system, forms database, or processing timeline exists; all information must be obtained from local providers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ca.gov/Programs_and_Services/Multipurpose_Senior_Services_Program/[5]

---

### Senior Community Service Employment Program (SCSEP)


**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[1][2]. The search results do not provide specific dollar amounts by household size, as federal poverty guidelines are updated annually and vary by household composition. Families should verify current limits with their local provider or at federalpovertyguide.org.
- Assets: Not specified in available sources
- Must be unemployed at time of enrollment and throughout participation[1][4]
- Must be a resident of the county/region served by the local SCSEP provider[3][4]
- Enrollment priority (in order) given to: veterans and qualified spouses[1][2], individuals over 65[1][2], disabled individuals[1][2], those with limited English proficiency or low literacy skills[1][2], rural residents[1][2], homeless or at-risk individuals[1][2], those with low employment prospects[1][2], and formerly incarcerated individuals[1][2]

**Benefits:** Paid work experience at an average of 20 hours per week (Orange County variation: 16-29 hours per week depending on funding)[1][2][4]. Participants are paid the highest of federal, state, or local minimum wage[1][2]. On-the-job training in computer or vocational skills[10]. Professional job placement assistance to find full-time or part-time employment[10]. Access to employment assistance through American Job Centers[2][5]. Work experience that can be added to a résumé[10].
- Varies by: region (hours per week vary; Orange County specifically offers 16-29 hours depending on funding availability[4])

**How to apply:**
- In-person at local provider offices (varies by county)
- Phone contact with local provider
- Email (varies by provider; example: Felton Institute in San Francisco area: [email protected][6])
- Mail (varies by provider)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limit is strict: 125% of federal poverty level, which is significantly lower than many other assistance programs. A family must verify current dollar thresholds annually, as federal poverty guidelines change yearly[1][2].
- Unemployment requirement is continuous: participants must remain unemployed throughout their participation in the program, which may create a cliff effect when transitioning to unsubsidized employment[1][4].
- Hours vary by region and funding: Orange County explicitly states 16-29 hours per week 'depending on funding availability,' suggesting that hours may fluctuate or be reduced if funding decreases[4].
- Residency requirement is strict: participants must live in the specific county or region served by their local provider. Moving outside the service area may disqualify them[3][4].
- Priority enrollment system means wait times may vary significantly: veterans and those over 65 get priority, so younger seniors (55-64) without veteran status may face longer waits[1][2].
- Program is temporary and part-time: this is explicitly a bridge to unsubsidized employment, not a permanent job program. It is designed as a training pathway, not ongoing employment[1][2].
- No asset limits are specified in available sources, but this does not mean there are none—families should ask their local provider directly about asset testing.
- The program provides over 40 million community service hours annually to agencies, but individual participant hours are capped at approximately 20 per week, meaning the program serves many people with limited individual hours[2].

**Data shape:** This program's structure is highly decentralized: while eligibility criteria are uniform statewide (age 55+, unemployed, income ≤125% poverty level), implementation varies significantly by county and provider. Hours per week, specific services, application processes, and wait times differ by region. The program is administered by the California Department of Aging but delivered through 19 national non-profit organizations and state agencies, each with their own local offices and contact information. Families must identify their local provider first before applying. The program is federally authorized under the Older Americans Act and funded by the U.S. Department of Labor, which explains the uniform eligibility framework but allows for regional flexibility in service delivery.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ca.gov/Programs_and_Services/Senior_Employment_and_Training/ and https://www.dol.gov/agencies/eta/seniors

---

### California Senior Legal Services (via Legal Services Inc. / Area Agencies)


**Eligibility:**
- Age: 60+
- Income: Varies by service type and grant restrictions. General legal services: 125% or 200% of Federal Poverty Level depending on grant. Health-related matters and seniors in Fresno, Madera, Kings, Merced, or Tulare County: income-based eligibility may not apply. At 125% FPL (effective January 16, 2025): Family of 1: $19,563/year ($1,630/month); Family of 2: $26,438/year ($2,203/month); Family of 3: $33,313/year ($2,776/month); Family of 4: $40,188/year ($3,349/month); Family of 5: $47,063/year ($3,922/month). For each additional household member, add $6,875 annually. At 200% FPL: Family of 1: $31,300/year ($2,608/month); Family of 2: $42,300/year ($3,525/month); Family of 3: $53,300/year ($4,442/month); Family of 4: $64,300/year ($5,358/month); Family of 5: $75,300/year ($6,275/month). For each additional household member, add $10,000 annually.[1][5]
- Assets: Not specified in available sources. Medi-Cal asset limits may apply for certain services, but specific thresholds for Legal Services are not detailed.[3]
- Age 60 or older[2]
- Persons 60+ may qualify regardless of income for certain services[2]
- Priority consideration given to homebound/limited mobility, residing in long-term care, without transportation access, living alone with no support, experiencing chronic health problems, abused, homeless/at-risk, deaf/hearing impaired, immigrants, LGBT, limited English proficiency, people with disabilities, people with dementia, grandparents caring for grandchildren, formerly incarcerated[5]

**Benefits:** Free legal services covering: housing, consumer fraud, elder abuse, Social Security, Supplemental Security Income (SSI), Medicare, Medi-Cal, age discrimination, pensions, nursing homes, protective services, conservatorships, landlord-tenant/eviction defense, tenant rights, reasonable accommodations for disabilities, patient rights in nursing homes, debt and consumer rights, Chapter 7 bankruptcy assistance, health insurance counseling and advocacy, Medicare counseling, caregiver legal support, estate planning, wills and trusts, financial elder abuse cases. Staff attorneys and trained Medicare counselors travel to approximately 40 convenient locations throughout the community on a regular schedule.[2][4][6]
- Varies by: service_type|priority_tier|region

**How to apply:**
- Phone: Contact your local Area Agency on Aging or Legal Services Provider (LSP) — specific numbers vary by county/region[1][4]
- In-person: Visit one of approximately 40 accessible community locations where staff attorneys travel on a regular schedule[4]
- Mail: Contact your local Area Agency on Aging for mailing address[5]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limits vary significantly by grant restrictions — some services use 125% FPL, others 200% FPL. Always verify which threshold applies to your specific legal issue.[1][5]
- Age 60+ is the primary requirement, but income limits may not apply for health-related matters or in specific counties (Fresno, Madera, Kings, Merced, Tulare).[1][2]
- This is NOT a single program with one application process — it's a network of Area Agencies on Aging and Legal Services Providers. You must contact your local provider, which varies by county.[5]
- Services are delivered at approximately 40 community locations on a regular schedule, not at centralized offices. You may need to travel to a scheduled location rather than calling an office.[4]
- No specific information available on processing times, waitlists, or application forms — these likely vary by region and provider.[1][5]
- Asset limits are not clearly specified for Legal Services, though Medi-Cal asset rules may apply to certain services. Clarify with your local provider.[3]
- Priority is given to vulnerable populations (homebound, abused, homeless, etc.), which may affect service availability for those not in priority categories.[5]
- This program is distinct from Medi-Cal (which covers healthcare) and Social Security benefits — it provides legal representation and advocacy, not direct financial assistance.[2][3]

**Data shape:** This program is highly decentralized across California's 33 Planning and Service Areas, with no single application process or centralized office. Income eligibility thresholds vary by grant type (125% vs. 200% FPL) and by county. Age 60+ is the primary eligibility criterion, but income limits may not apply for certain service types or regions. Services are delivered through traveling staff to approximately 40 community locations rather than fixed offices. Specific processing times, waitlists, forms, and regional variations are not publicly detailed in available sources and must be obtained from local Area Agencies on Aging or Legal Services Providers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ca.gov/Programs_and_Services/Legal_Services/ and local Area Agencies on Aging websites

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Resident of a long-term care facility in California (nursing homes, residential care facilities for the elderly, adult residential facilities, intermediate care facilities)
- No income or asset requirements — this is an advocacy program, not a financial assistance program

**Benefits:** Free advocacy, investigation, and complaint resolution services. No direct financial payments or hourly services. Ombudsman representatives investigate complaints, mediate conflicts, provide education, and advocate for residents' expressed wishes regarding care quality, safety, rights, and dignity.

**How to apply:**
- Phone: Statewide CRISISline 1-800-231-4024 (available 24/7)
- Phone: State office (916) 419-7510 (8am-5pm)
- Website: https://aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/ — includes county-by-county local office finder
- In-person: Contact local county ombudsman office (phone number posted in all long-term care facilities)
- Complaints can be made by residents, family members, friends, or facility staff on behalf of residents

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- This is NOT a financial assistance program — it provides advocacy and complaint investigation only, not money or direct services
- Nearly 80% of ombudsman representatives are volunteers, not professional staff, though all receive extensive training (minimum 36 hours plus supervised internship)
- The program is resident-centered and follows the resident's expressed wishes, not the family's wishes — ombudsman regularly navigate conflicts between residents and their families
- Ombudsman cannot work in long-term care facilities themselves (representatives must not have worked in a facility in the past year to qualify)
- This is a federally-mandated program established in 1978 (Nursing Home Ombudsman Program) and expanded in 1981 to include assisted living — it exists in all 50 states
- The program investigates abuse and neglect but is primarily an advocacy and mediation service, not a law enforcement agency
- All long-term care facilities are required to post the local ombudsman phone number and the statewide CRISISline number in visible locations

**Data shape:** This is a universal advocacy program with no eligibility barriers — any resident of a California long-term care facility automatically qualifies. There are no income limits, asset limits, or age requirements. The program structure is geographically distributed across 35 local programs but coordinated statewide. Benefits are fixed (advocacy services) rather than scaled. The key distinction is that this is an advocacy and complaint resolution service, not a financial or direct service benefit program. Families should understand they are accessing a resident advocate, not applying for financial aid or care services.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/

---

### State Supplementary Payment (SSP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Income must be limited such that countable monthly income (after disregards like first $20 of any income, first $65 of earned income plus half the rest, SNAP, tax refunds, etc.) does not exceed the maximum SSI/SSP benefit: $1,206.94 for an individual ($967 federal + $239.94 SSP) or $2,057.83 for a couple ($1,450 federal + $607.83 SSP). Exact limits vary by living arrangement, other income, and SSA calculations; no fixed table by household size beyond individual/couple as SSP supplements SSI federally determined eligibility.[1][3][4][5][7]
- Assets: Resources (assets) must be under $2,000 for an individual or $3,000 for an eligible couple. Countable assets include cash, bank accounts, stocks, etc.; exempt assets typically include one home, one vehicle, household goods, life insurance up to certain values, and burial funds.[1][2][3][6]
- Must qualify for federal SSI: disabled, blind, or age 65+; unable to work due to disability (if under 65); U.S. citizen or qualified non-citizen (e.g., permanent resident with 40 work quarters, refugee/asylee in first 5 years, veteran/spouse/child); live in U.S.; apply for other benefits.[1][2][3][4]
- SSP eligibility follows SSI automatically in California; no separate state test.[3][5][7]

**Benefits:** Cash payment supplementing federal SSI: maximum $239.94/month for individual ($1,206.94 total SSI/SSP); $607.83/month for couple ($2,057.83 total). Reduced dollar-for-dollar by other countable income; varies by living arrangement.[1][3][5][7]
- Varies by: household_size

**How to apply:**
- Phone: Call Social Security Administration at 1-800-772-1213 (TTY 1-800-325-0778).[2]
- Online: Apply via SSA website at ssa.gov/ssi.
- In-person: Local SSA office (find via ssa.gov/locator).

**Timeline:** SSA determines; initial decision varies, with periodic re-verification. No specific timeline stated.[4]

**Watch out for:**
- SSP is automatic with SSI eligibility but reduced by other income; not a separate application.[3][5][7]
- No annual COLA for SSP since 2009/2011 cuts, so benefits lag inflation.[5][7]
- Must apply for all other benefits (e.g., SNAP); in-kind food/shelter can count as income.[2][4][6]
- Non-citizens need specific qualifications; disability must meet strict SSA definition (lasting 1+ year, prevents substantial work).[1][4]
- Living arrangements affect payment levels (e.g., shared housing reduces amount).[1][3]

**Data shape:** SSP automatically supplements federal SSI with fixed state add-on amounts for individual/couple; eligibility tied to federal SSI income/resource tests with California-specific grant levels; no separate state income/asset limits or household size table beyond couple.

**Source:** https://www.cdss.ca.gov/inforesources/cdss-programs/ssi-ssp/ssi-ssp-eligibility-summary

---

### Property Tax Postponement Program


**Eligibility:**
- Age: 62+
- Income: Total household income of $55,181 or less for the prior calendar year (e.g., 2024 income for 2025-2026). Includes income of all persons living in the home except minors, full-time students, and renters. Does not vary by household size. (Note: Older sources cite $45,000 or $35,500, but official/current is $55,181.)[1][2][5]
- Assets: No explicit asset limits. Must have at least 40% equity in the property (total liens, mortgages, encumbrances ≤60% of fair market value). Delinquent/defaulted taxes count toward encumbrances but cannot be postponed. Exempt properties: floating homes, houseboats. Eligible: manufactured homes built after June 15, 1976; mobile/modular homes.[1][2][4][5]
- Be at least 62 years old by December 31 of the tax year (e.g., Dec 31, 2025), or blind, or disabled (disability must last ≥12 continuous months). All recorded owners except spouse, registered domestic partner, and direct-line relatives (parents, children, grandchildren, their spouses) must meet age/blind/disabled requirement.
- Own and occupy the property as principal place of residence on Dec 31 of prior year and continuously.
- No reverse mortgage on the property.[1][2][5]

**Benefits:** Postponement (deferral) of current-year property taxes on principal residence. Taxes accrue 7% annual interest. Repaid via lien on property, due upon sale, transfer, death, or non-occupancy. Does not cover delinquent/defaulted taxes.[1][4]

**How to apply:**
- Online: https://www.sco.ca.gov/ardtax_prop_tax_postponement.html[7]
- Mail: California State Controller's Office (specific address on form/website)[1][4]
- Phone: Not specified in sources; contact State Controller's Office via website.
- In-person: Not specified; administerd statewide by State Controller's Office.

**Timeline:** Not specified in sources.
**Waitlist:** Funds are limited; applications accepted during annual filing period (e.g., Oct 1-Feb 10 prior years; check current year on site). First-come, first-served implied.[6]

**Watch out for:**
- Must reapply every year to confirm eligibility.[6]
- Lien placed on property; repay with 7% interest upon sale/transfer/death/non-occupancy.[1][4]
- All non-exempt co-owners must qualify (age/blind/disabled).[2][5]
- Income based on prior full calendar year; excludes only minors/students/renters.[2][5]
- No coverage for delinquent taxes; they reduce equity.[2]
- Program was suspended 2009-2016; limits income/equity strictly.[4]

**Data shape:** Fixed income threshold (no household size variation); statewide uniform admin by State Controller; annual reapplication required; equity test unique (40% minimum); conflicting older income figures in non-official sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.sco.ca.gov/ardtax_prop_tax_postponement.html

---

### In-Home Supportive Services (IHSS)


**Eligibility:**
- Income: No direct IHSS income limits; tied to Medi-Cal eligibility. Effective 4/1/25, Medi-Cal income limit is $1,801/month for a single applicant and $2,433/month for a married couple (138% of Federal Poverty Level, adjusted annually). SSI/SSP recipients automatically qualify financially; others may have a share of cost. Limits vary by household size per Medi-Cal rules.
- Assets: Medi-Cal asset limits apply: personal property may not exceed $2,000 for an individual or $3,000 for a couple. Specific exemptions not detailed in sources, but standard Medi-Cal asset rules apply (e.g., primary home often exempt).
- California resident
- Medi-Cal eligible (full-scope or pending application)
- Live in own home or abode of choice (excludes hospitals, nursing homes, licensed care facilities)
- Blind, aged 65+, disabled (adults or children), or have functional impairments needing assistance with daily activities
- At risk of out-of-home placement without services
- Completed Health Care Certification (SOC 873) from licensed health care professional
- U.S. citizen or qualified immigrant

**Benefits:** In-home services including housecleaning, meal preparation, laundry, grocery shopping, personal care (bathing, grooming, bowel/bladder care, paramedical services), accompaniment to medical appointments, protective supervision for mentally impaired. Up to 283 hours/month maximum (varies by assessed need via functional index ranking 1-6 during home assessment). No fixed dollar amount; county authorizes hours based on biopsychosocial assessment.
- Varies by: priority_tier

**How to apply:**
- Contact your county IHSS office (varies by county; e.g., statewide info at https://www.cdss.ca.gov/in-home-supportive-services)
- In-person or home visit by county social worker for assessment
- Phone: Varies by county (e.g., general inquiries via county social services)
- Online: County-specific (e.g., Los Angeles County website for application)
- Mail: Submit forms to county IHSS office

**Timeline:** Not specified; involves home interview, assessment, and notification of approval/denial (reason given if denied).

**Watch out for:**
- Must have Medi-Cal eligibility first (not automatic; apply separately if needed)
- Live in 'own home' excludes licensed facilities/nursing homes
- Services based on county-assessed hours, not unlimited (max 283/month)
- Non-SSI/SSP recipients may owe share of cost
- Requires physician-certified SOC 873 form before authorization
- Children qualify only if needs exceed typical for age
- Asset limits strict ($2,000 individual/$3,000 couple); plan transfers carefully

**Data shape:** Tied to Medi-Cal (income/assets vary by household size/FPL); county-administered with regional offices/providers; benefits scale by assessed functional need tier (1-6); no standalone income test—Medi-Cal governs

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.cdss.ca.gov/in-home-supportive-services

---

### Caregiver Resource Centers (CRC)


**Eligibility:**
- Income: No income or asset limits specified; services are available to unpaid family caregivers of adults with chronic debilitating conditions including dementia, Alzheimer’s, stroke, Parkinson’s, Huntington’s, multiple sclerosis, traumatic brain injury, or other cognitive disorders[4][5][6].
- Assets: No asset limits or exclusions mentioned; program focuses on need rather than financial means testing[4][5].
- Unpaid family caregivers serving individuals with specified chronic health conditions
- California resident with access to a local CRC (statewide coverage via 11 centers)
- No formal age requirement for care recipient, but targeted at adults with debilitating conditions[4][5][6]

**Benefits:** Core services include: Specialized information and referral for caregiver stress, diagnoses, and resources; family consultation and care planning; respite care (financial assistance for in-home support, adult day care, short-term/weekend care, transportation); short-term counseling (individual, family, group); support groups (online/in-person); professional training workshops; legal/financial consultation (Powers of Attorney, Advance Directives, estate planning, conservatorships); education workshops on cognitive disorders, dementia, long-term care, stress management. Serves over 14,000 families annually; no specific dollar amounts or hours per week stated[4][5].
- Varies by: region

**How to apply:**
- Contact local CRC by phone (e.g., Inland CRC: (909) 514-1404 or (800) 675-6694); visit caregivercalifornia.org for center locator and contacts; email specific centers (e.g., info@inlandcaregivers.org); in-person at 11 nonprofit centers covering all counties; CareNav™ online tool for customized resource matching[4][5][6][8]

**Timeline:** Not specified

**Watch out for:**
- Not a paid caregiver program—focuses on support services for unpaid family caregivers, not direct payment (compare to IHSS/Medicaid for compensation)[1][3][9]; no means-testing but targeted to specific conditions (not general elderly care); contact local CRC as services/providers differ regionally; not a Medicaid enrollment program but can refer to one[4][5][8][9]

**Data shape:** Statewide network of 11 regional nonprofit centers with no income/asset test; services customized by condition and local provider; differs from paid programs like IHSS by emphasizing counseling, respite, and planning over wages

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhcs.ca.gov/services/MH/Pages/AdultsCaregiverResourceCenters.aspx

---

### Community-Based Adult Services (CBAS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Must be currently eligible for Medi-Cal under a qualifying primary Medi-Cal aid code. No specific income dollar amounts are published in program materials; eligibility is determined through Medi-Cal qualification, which varies by household composition and is administered separately.[1][2]
- Assets: As of January 1, 2026, asset limits are: $130,000 for an individual and $195,000 for a couple. Assets were previously unlimited (effective 1/1/24 through 12/31/25).[2]
- Must reside in a county with a CBAS center or live within one hour's drive of a CBAS center in a nearby county.[2]
- Must meet one of the following medical/functional criteria:[3][4]
-   - Nursing Facility Level of Care A (NF-A) or above; OR
-   - Diagnosed organic, acquired, or traumatic brain injury and/or chronic mental illness; OR
-   - Alzheimer's disease or other dementia (stage 5, 6, or 7); OR
-   - Mild cognitive impairment, including moderate Alzheimer's (stage 4 dementia); OR
-   - Developmental disability; OR
-   - Physician, nurse practitioner, or other licensed healthcare provider has requested CBAS services
- Must demonstrate functional need through Activities of Daily Living (ADLs) and Instrumental Activities of Daily Living (IADLs) assessment using the CBAS Eligibility Determination Tool (CEDT).[2]
- A dementia diagnosis alone does not guarantee eligibility; functional impairment must be demonstrated.[2]

**Benefits:** Community-based adult day services provided at certified CBAS centers. The search results do not specify exact hours per week, frequency of services, or specific service components beyond that CBAS is 'an alternative to institutional care for Medi-Cal beneficiaries who can live at home with the aid of appropriate health, rehabilitative' services.[9] Members can be approved for services up to 7 days per week.[5]
- Varies by: frequency and intensity may vary by individual need and plan approval, but specific tier structure is not detailed in available materials

**How to apply:**
- Through your Medi-Cal Managed Care Plan (primary route for most beneficiaries)[8]
- For Medi-Cal beneficiaries exempt from managed care: through the Los Angeles Medi-Cal Field Office or its designee[8]
- Specific phone numbers, URLs, and mail addresses are not provided in the search results

**Timeline:** Not specified in search results. Initial eligibility determination requires a face-to-face review by a registered nurse with level of care determination experience.[4][5]
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Geographic limitation: CBAS is NOT available statewide. Your loved one must live in one of 28 counties with a certified center or within one hour's drive. If you're outside these areas, you cannot access CBAS.[1][2]
- Asset limits changed January 1, 2026: If your family was previously eligible under the 'no asset limit' rule (2024-2025), you may now be ineligible if assets exceed $130,000 (individual) or $195,000 (couple).[2]
- Dementia diagnosis is not automatic eligibility: Having Alzheimer's or dementia does not guarantee CBAS eligibility. Functional impairment must be demonstrated through the CEDT assessment. A diagnosis alone is insufficient.[2]
- Managed Care Plan controls eligibility: For most beneficiaries, your Medi-Cal Managed Care Plan makes the eligibility determination, not a state office. Different plans may have different approval processes.[8]
- Face-to-face assessment required: Eligibility determination requires an in-person review by a registered nurse; this cannot be done remotely.[4][5]
- CBAS is a Medi-Cal benefit only: You must be eligible for Medi-Cal to access CBAS. Non-Medi-Cal beneficiaries cannot use this program, though Adult Day Health Care (ADHC) remains available as a non-Medi-Cal option for out-of-pocket payers.[1]
- Specific service hours/frequency not detailed: Search results do not specify how many hours per week or days per week your loved one will receive services, only that approval can be up to 7 days/week.[5]

**Data shape:** CBAS is a geographically restricted program (28 of 58 California counties only). Eligibility is determined through Medi-Cal qualification (income limits vary by household composition and are not program-specific) plus medical/functional criteria assessed via standardized tool (CEDT). Asset limits recently changed (January 1, 2026). The program is primarily administered through Medi-Cal Managed Care Plans, creating decentralized eligibility determination. Specific service hours, frequency, and benefit amounts are not standardized in available documentation and may vary by individual plan approval.

**Source:** https://aging.ca.gov/Programs_and_Services/Community-Based-Adult-Services/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medi-Cal Medicare Savings Programs (QMB, | benefit | federal | deep |
| Multipurpose Senior Services Program Wai | benefit | local | deep |
| Community Based Adult Services (CBAS) | benefit | state | deep |
| CalFresh | benefit | state | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Health Insurance Counseling and Advocacy | resource | local | simple |
| Meals on Wheels (via Older Americans Act | benefit | federal | medium |
| Multipurpose Senior Services Program (MS | resource | state | simple |
| Senior Community Service Employment Prog | employment | federal | deep |
| California Senior Legal Services (via Le | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| State Supplementary Payment (SSP) | benefit | state | medium |
| Property Tax Postponement Program | benefit | state | medium |
| In-Home Supportive Services (IHSS) | benefit | state | deep |
| Caregiver Resource Centers (CRC) | benefit | state | medium |
| Community-Based Adult Services (CBAS) | benefit | state | deep |

**Types:** {"benefit":12,"resource":4,"employment":1}
**Scopes:** {"federal":6,"local":2,"state":9}
**Complexity:** {"deep":9,"simple":4,"medium":4}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/CA/drafts.json`.

- **Multipurpose Senior Services Program (MSSP) Caregiver Support** (resource) — 0 content sections, 4 FAQs
- **State Supplementary Payment (SSP)** (benefit) — 0 content sections, 6 FAQs
- **Caregiver Resource Centers (CRC)** (benefit) — 0 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 3 programs
- **Potentially by region and managed care plan, but specific variations are not documented in available sources.**: 1 programs
- **household_size**: 2 programs
- **not_applicable**: 3 programs
- **region (different providers offer services in different counties; some services may be more readily available in certain areas)**: 1 programs
- **region (hours per week vary; Orange County specifically offers 16-29 hours depending on funding availability[4])**: 1 programs
- **service_type|priority_tier|region**: 1 programs
- **frequency and intensity may vary by individual need and plan approval, but specific tier structure is not detailed in available materials**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medi-Cal Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with escalating income limits (100%/120%/135% FPL); primarily single/couple tables; asset limits state-varying/higher than federal; county-administered statewide; finite QI funding
- **Multipurpose Senior Services Program Waiver (MSSP)**: County-restricted to MSSP provider sites only (not statewide); no separate income/asset limits (uses Medi-Cal); benefits via care management, not fixed hours/dollars; strict NFLOC + cost containment + slot caps
- **Community Based Adult Services (CBAS)**: CBAS is a Medi-Cal Managed Care benefit with highly fragmented administration: eligibility and benefits vary by managed care plan, making it difficult to provide universal specifics. The program is geographically restricted to 28 counties with 310 centers. Income limits follow Medi-Cal standards (not program-specific), and asset limits were recently reinstated. Functional eligibility is determined through a standardized tool (CEDT) rather than categorical criteria alone. The program serves adults 18+ (not just seniors), though it is commonly used by older adults. Specific benefit amounts, service hours, and application procedures are plan-dependent and not centrally documented in public materials.
- **CalFresh**: Special rules for elderly/disabled: net income test, no/low asset limits, high deductions for medical/housing; benefits scale by household size with minimums; county-administered statewide.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: LIHEAP benefits are allocated based on a priority tier system rather than fixed dollar amounts. Income limits scale by household size with a formula for households exceeding 10 persons. The program operates through multiple regional service providers, which may have different processing times and local requirements. Federal funding ($212 million for FFY 2026) is limited, creating a gap between eligible households and those who receive benefits. Automatic eligibility exists for certain government benefit program enrollees.
- **Weatherization Assistance Program (WAP)**: Administered statewide via local providers with regional variations in offices, wait times, and exact services; priority-based access for vulnerable households like elderly; income at poverty guidelines without published table; no fixed age requirement but elderly prioritized.
- **Health Insurance Counseling and Advocacy Program (HICAP)**: HICAP is a consumer-oriented counseling and advocacy program, not a direct financial benefit program. It serves as a gateway to understanding Medicare options and accessing cost-saving programs. The program is geographically fragmented across California with different area agencies serving different counties. Critical information gaps in available sources include specific income/asset limits, processing times, application forms, required documents, and detailed regional service variations. The program's primary value is in education and navigation support rather than direct financial assistance.
- **Meals on Wheels (via Older Americans Act / CA Dept. of Aging)**: No income or asset test statewide; eligibility driven by homebound/need status and local AAA variations; benefits via local providers with priority for low-income/rural/minority; delivered through 33 AAAs with geographic service zones
- **Multipurpose Senior Services Program (MSSP) Caregiver Support**: MSSP is a decentralized, provider-based program administered statewide by the California Department of Aging but operated by 37 different organizations across counties. This creates significant regional variation in application processes, wait times, and service availability. Eligibility is primarily determined by Medi-Cal status (not MSSP-specific income/asset limits), functional need (ADL assistance), and nursing home certification. Benefits are service-based (not cash) and comprehensive but not quantified in dollar amounts or hours. The program is designed as a cost-containment mechanism — total care costs must stay below nursing facility costs. No centralized application system, forms database, or processing timeline exists; all information must be obtained from local providers.
- **Senior Community Service Employment Program (SCSEP)**: This program's structure is highly decentralized: while eligibility criteria are uniform statewide (age 55+, unemployed, income ≤125% poverty level), implementation varies significantly by county and provider. Hours per week, specific services, application processes, and wait times differ by region. The program is administered by the California Department of Aging but delivered through 19 national non-profit organizations and state agencies, each with their own local offices and contact information. Families must identify their local provider first before applying. The program is federally authorized under the Older Americans Act and funded by the U.S. Department of Labor, which explains the uniform eligibility framework but allows for regional flexibility in service delivery.
- **California Senior Legal Services (via Legal Services Inc. / Area Agencies)**: This program is highly decentralized across California's 33 Planning and Service Areas, with no single application process or centralized office. Income eligibility thresholds vary by grant type (125% vs. 200% FPL) and by county. Age 60+ is the primary eligibility criterion, but income limits may not apply for certain service types or regions. Services are delivered through traveling staff to approximately 40 community locations rather than fixed offices. Specific processing times, waitlists, forms, and regional variations are not publicly detailed in available sources and must be obtained from local Area Agencies on Aging or Legal Services Providers.
- **Long-Term Care Ombudsman Program**: This is a universal advocacy program with no eligibility barriers — any resident of a California long-term care facility automatically qualifies. There are no income limits, asset limits, or age requirements. The program structure is geographically distributed across 35 local programs but coordinated statewide. Benefits are fixed (advocacy services) rather than scaled. The key distinction is that this is an advocacy and complaint resolution service, not a financial or direct service benefit program. Families should understand they are accessing a resident advocate, not applying for financial aid or care services.
- **State Supplementary Payment (SSP)**: SSP automatically supplements federal SSI with fixed state add-on amounts for individual/couple; eligibility tied to federal SSI income/resource tests with California-specific grant levels; no separate state income/asset limits or household size table beyond couple.
- **Property Tax Postponement Program**: Fixed income threshold (no household size variation); statewide uniform admin by State Controller; annual reapplication required; equity test unique (40% minimum); conflicting older income figures in non-official sources.
- **In-Home Supportive Services (IHSS)**: Tied to Medi-Cal (income/assets vary by household size/FPL); county-administered with regional offices/providers; benefits scale by assessed functional need tier (1-6); no standalone income test—Medi-Cal governs
- **Caregiver Resource Centers (CRC)**: Statewide network of 11 regional nonprofit centers with no income/asset test; services customized by condition and local provider; differs from paid programs like IHSS by emphasizing counseling, respite, and planning over wages
- **Community-Based Adult Services (CBAS)**: CBAS is a geographically restricted program (28 of 58 California counties only). Eligibility is determined through Medi-Cal qualification (income limits vary by household composition and are not program-specific) plus medical/functional criteria assessed via standardized tool (CEDT). Asset limits recently changed (January 1, 2026). The program is primarily administered through Medi-Cal Managed Care Plans, creating decentralized eligibility determination. Specific service hours, frequency, and benefit amounts are not standardized in available documentation and may vary by individual plan approval.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in California?
