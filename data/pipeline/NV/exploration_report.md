# Nevada Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 12 |
| New (not in our data) | 5 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 4 programs
- **service**: 3 programs
- **in_kind**: 1 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,275` ([source](https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance/copayments for Medicare-covered services (providers cannot bill beneficiary); auto-qualifies for Extra Help (Part D low-income subsidy, ≤$12.65 copay/drug in 2026). **SLMB:** Pays Part B premium only. **QI:** Pays Part B premium only.[1][2][3][8]` ([source](https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/`

### Home and Community Based Services Waiver for the Frail Elderly (HCBS FE Waiver)

- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://adsd.nv.gov (Aging and Disability Services Division)))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Case management, homemaker services, personal emergency response systems, social adult day care, chore services, respite services, augmented personal care in residential settings, access to state plan personal care services. Requires at least one monthly service[5][8]. No specific dollar amounts or hours stated.` ([source](https://adsd.nv.gov (Aging and Disability Services Division)))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov (Aging and Disability Services Division)`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dss.nv.gov/programs/snap/))
- **income_limit**: Ours says `$1952` → Source says `$2608` ([source](https://www.dss.nv.gov/programs/snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Amount based on net income, household size (e.g., max allotment for 2-person elderly/disabled: ~$546/mo, minus 30% net income). Minimums/maximums apply; $100 more net income = ~$30 less benefits.[1][5]` ([source](https://www.dss.nv.gov/programs/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.nv.gov/programs/snap/`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$1,882` ([source](https://www.dss.nv.gov/programs/energy/eligibility-criteria/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating assistance: maximum benefit $3,136, minimum benefit $360. Crisis assistance: maximum benefit $3,136. Average assistance nationally is $622.[1][3] Nevada does not offer cooling assistance.[3]` ([source](https://www.dss.nv.gov/programs/energy/eligibility-criteria/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.nv.gov/programs/energy/eligibility-criteria/`

### Nevada State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, unbiased counseling and education on Medicare coverage options (Parts A, B, C, D), Medigap supplemental insurance, Medicare Advantage plans, Medicaid eligibility, Medicare Savings Programs, Extra Help/Low Income Subsidy, long-term care insurance, and fraud/abuse detection[2][4][5]` ([source](https://adsd.nv.gov/Programs/Seniors/Medicare_Assistance_Program_(MAP)/MAP_Prog/))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov/Programs/Seniors/Medicare_Assistance_Program_(MAP)/MAP_Prog/`

### Home Delivered Meals

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered nutritionally balanced meals complying with Dietary Guidelines for Americans and providing at least 33 1/3% of daily Recommended Dietary Allowances (RDA); typically 5-7 meals per week including one hot meal on delivery day plus frozen meals; up to 7 additional meals via Second Home Delivered Meal Program; 2 shelf-stable meals annually for emergencies[3][5][6][7]` ([source](https://adsd.nv.gov (Aging and Disability Services Division); https://www.medicaid.nv.gov))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov (Aging and Disability Services Division); https://www.medicaid.nv.gov`

### Nevada Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigation and resolution of complaints related to care, rights, dignity, respect, admissions/discharges, quality of care, privacy/confidentiality, dietary issues, activities, and environmental concerns; unannounced quarterly facility visits; education on resident rights, aging, and LTC services; person-centered advocacy; in-service training for facility staff; all services confidential and at no cost.` ([source](https://adsd.nv.gov/programs/seniors/ltcombudsman/ltcombudsprog/))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov/programs/seniors/ltcombudsman/ltcombudsprog/`

## New Programs (Not in Our Data)

- **Weatherization Assistance Program (WAP)** — in_kind ([source](https://housing.nv.gov/programs/weatherization/))
  - Shape notes: This program's benefits scale by household size and energy audit results rather than fixed dollar amounts. Income eligibility thresholds vary by provider (150% vs. 200% of federal poverty level). The program is statewide but delivered through regional nonprofit Subgrantees, creating geographic variation in application processes, contact information, and potentially processing times. No specific processing timeline is published, suggesting variable wait times. The program prioritizes certain household types (elderly, disabled, young children) but does not guarantee approval based on priority alone. All services are provided at no cost to eligible households, making this a fully subsidized program rather than a loan or partial-assistance model.
- **Respite Care Vouchers / Senior Respite Care** — financial ([source](https://adsd.nv.gov (Aging and Disability Services Division); https://seniorsinservicenevada.org/respite-voucher-program/))
  - Shape notes: Regionally restricted to Northern Nevada via specific provider (Seniors in Service); no income/asset test; live-in caregiver requirement; grant-funded with selection process.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://adsd.nv.gov/About/Reports/SrCommSvcEmplyProg/Home/ (Nevada ADSD SCSEP State Plan); https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor)))
  - Shape notes: SCSEP is a federally funded program (Title V of the Older Americans Act, administered by U.S. Department of Labor) with statewide presence in Nevada but limited documented office locations in search results. Benefits are individualized based on participant needs and assessments rather than fixed by tier. Income eligibility is strict (125% federal poverty level) but specific dollar thresholds are not provided and must be obtained from local offices. The program emphasizes employment outcomes and supportive services tailored to barriers, making it more flexible than a fixed-benefit program but requiring direct contact with local providers for precise details.
- **Nevada Advocates for Seniors** — advocacy ([source](https://adsd.nv.gov/Programs/Seniors/AdvocateElders/AdvocateforElders/[5]))
  - Shape notes: Decentralized network of legal aid and community advocacy providers; no uniform income/asset tests; regional focus in Southern Nevada with statewide options; prioritizes legal help over direct services
- **Community Options Program for the Elderly (COPE)** — service ([source](https://adsd.nv.gov/Programs/Seniors/COPE/COPE_Prog/))
  - Shape notes: COPE's data structure is highly individualized: eligibility determination requires a face-to-face LOC screening and financial assessment, and services are tailored to each recipient's needs rather than following a fixed tier or benefit schedule. Income and asset limits are not published in standard materials and must be obtained directly from ADSD. The program operates with a waitlist system. Regional offices handle applications, but specific regional variations in processing time or service availability are not documented in available materials.

## Program Details

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits are based on percentages of the Federal Poverty Level (FPL), updated annually effective April 1. Nevada uses federal standards. For 2026 (projected from recent data): QMB ≤100% FPL (~$1,275 single/$1,724 couple monthly); SLMB 100-120% FPL (~$1,235-$1,478 single/$1,663-$1,992 couple); QI 120-135% FPL (~$1,478-$1,660 single/$1,992-$2,239 couple). Exact 2026 FPL amounts vary; check current via DWSS. Limits apply to countable monthly income after deductions.[2][7][8]
- Assets: Federal limits apply statewide: $9,090 single, $13,630 married couple (some sources note $9,430/$14,130). Countable assets include bank accounts, stocks; exempt: home, one car, personal belongings, burial plots, life insurance up to $1,500 face value, irrevocable burial trusts.[1][2][5]
- Must be enrolled in Medicare Part A (or qualify if not: age 65+, disabled, ESRD).
- Nevada resident and U.S. citizen or qualified immigrant.
- Not eligible for full Medicaid.

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance/copayments for Medicare-covered services (providers cannot bill beneficiary); auto-qualifies for Extra Help (Part D low-income subsidy, ≤$12.65 copay/drug in 2026). **SLMB:** Pays Part B premium only. **QI:** Pays Part B premium only.[1][2][3][8]
- Varies by: priority_tier

**How to apply:**
- Online: AccessNevada portal at https://accessnevada.dwss.nv.gov
- Phone: Local Welfare District Office or DWSS hotline (775-684-7200 or 702-486-1646 Las Vegas area)
- Mail/In-person: Local DWSS Welfare District Office (e.g., Las Vegas: 1900 E Owens Ave; find locations at dss.nv.gov)
- Apply anytime; retroactive coverage possible (3 months prior for SLMB/QI).

**Timeline:** Eligibility begins month following decision (QMB) or month of application (SLMB/QI); typically 30-45 days, no specific Nevada timeline stated.
**Waitlist:** QI may end if federal funding exhausted (100% federally funded, state allocation limits); check availability.[8]

**Watch out for:**
- QI has funding caps and may close enrollment if allocation exhausted.
- Income/asset limits change April 1 annually; outdated figures common in sources.
- QMB protects from provider billing for Medicare-covered services, but small Medicaid copays may apply.
- Must already have Medicare; doesn't cover vision/dental/long-term care.
- Conflicting income figures across sources—verify current FPL with DWSS.
- No Medicaid card issued (premium-only for SLMB/QI).

**Data shape:** Tiered by income brackets (QMB/SLMB/QI) as % of FPL; federal asset limits fixed but occasionally discrepant in reporting; QI funding-limited; statewide uniform via DWSS local offices.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/

---

### Home and Community Based Services Waiver for the Frail Elderly (HCBS FE Waiver)


**Eligibility:**
- Age: 65+
- Income: Equivalent to 300% of the Federal Benefit Rate (FBR). For 2025: Individual $2,901/month; married couple (both applying) $5,802/month. When only one spouse applies, individual limit applies and spouse's income is disregarded. Limits scale by household size per SSI FBR[1][2][6].
- Assets: Individuals: $2,000 in countable resources. Home equity limit (2026): $752,000 if living in home or intent to return. Exemptions: Home if applicant, spouse, dependent child under 21, or blind/disabled child lives there[1][6].
- Nevada resident and U.S. citizen or lawful permanent resident[6].
- Nursing Facility Level of Care (NFLOC): Minimum 3 functional deficits (score of 3 out of 13) via Nevada Medicaid LOC assessment covering meds/treatments, ADLs (continence, bathing, dressing, grooming, transferring, mobility, eating, ambulation), IADLs (meals, homemaking), supervision. At risk of nursing home admission within 30 days without waiver[1][2][3][5].

**Benefits:** Case management, homemaker services, personal emergency response systems, social adult day care, chore services, respite services, augmented personal care in residential settings, access to state plan personal care services. Requires at least one monthly service[5][8]. No specific dollar amounts or hours stated.

**How to apply:**
- Initiate through Aging and Disability Services Division (ADSD); financial eligibility via Division of Welfare and Supportive Services (DWSS)[3][5].
- In-person or over-the-phone interview for functional assessment[2].
- Apply for Medicaid financial eligibility through DWSS[5].
- Program application: OCL Program Application (Rev 01-23) via ADSD[5].

**Timeline:** Several weeks to months for eligibility and assessments[3].
**Waitlist:** Waitlist exists when program is at capacity; approved applicants wait additional time[3][4].

**Watch out for:**
- Dementia diagnosis does not automatically qualify; must meet NFLOC with 3+ functional deficits[1][3].
- Must apply for and meet full Medicaid financial eligibility through DWSS[5][6].
- Home equity limit applies ($752,000 in 2026) unless exemptions met[1].
- Waiver services not a substitute for family/informal supports[4].
- Waitlist common due to limited slots[3][4].
- Spousal income rules: disregarded only if one applying[2].

**Data shape:** Strict NFLOC with numeric deficit scoring (min 3/13); statewide but waitlisted; income at 300% FBR with spousal disregards; asset cap $2,000 individual with home equity limit and exemptions

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov (Aging and Disability Services Division)

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled, Nevada uses expanded rules (Oct 1, 2025 - Sept 30, 2026). Gross income limit at 200% FPL: 1 person $2608/mo, 2 $3526, 3 $4442, 4 $5358, 5 $6276, 6 $7192, 7 $8108, +$916 each additional. If over gross, qualify via net income test (e.g., 2025: 1 person $15,060/yr or ~$1,255/mo, 2 $20,440/yr or ~$1,703/mo) and assets. Net income calculated after deductions like 20% earned income, shelter (capped for some), medical >$35/mo for elderly/disabled, utilities.[1][2][3]
- Assets: Households with elderly (60+) or disabled: $3,500 countable resources (higher than standard $2,250). Countable: cash, bank accounts. Exempt: home, household goods, 1 licensed vehicle (if used for work, medical transport, etc.), retirement savings, life insurance cash value (some states vary), income-producing property (varies).[2][3][4]
- U.S. citizen or qualified alien (e.g., 5-year residency for some).
- Nevada resident.
- Work requirements exempt for 60+ (apply to able-bodied adults 18-64 without kids: 20 hrs/wk or 80/mo, 3-mo limit in 3 yrs unless exempt).[3][6]
- Household includes those who buy/prepare food together.

**Benefits:** Monthly EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Amount based on net income, household size (e.g., max allotment for 2-person elderly/disabled: ~$546/mo, minus 30% net income). Minimums/maximums apply; $100 more net income = ~$30 less benefits.[1][5]
- Varies by: household_size

**How to apply:**
- Online: Access Nevada (https://accessnevada.dwss.nv.gov) - primary method.
- Phone: Local Social Services Office (find via dss.nv.gov) or statewide inquiry line.
- Mail/In-person: Local Social Services Offices (locations at dss.nv.gov/programs/snap/).

**Timeline:** Typically 30 days; expedited (7 days) if very low income/no assets.

**Watch out for:**
- Elderly households skip gross income test if meeting net/asset; Nevada expanded to 200% FPL gross.[1]
- Medical expenses >$35/mo deductible for 60+/disabled boost eligibility/benefits.[1][2]
- Own home/car often exempt; SSI recipients may auto-qualify.[2][3]
- Household must include food-sharing members; Social Security counts as income.[2]
- Work rules don't apply to 60+, but check county exemptions if others in household.[6]

**Data shape:** Elderly/disabled special rules: gross income optional (net+asset only if over 200% FPL), higher asset limit ($3,500), medical/shelter deductions scale benefits by household size/net income.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.nv.gov/programs/snap/

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Household gross monthly income must not exceed 150% of federal Poverty Guidelines. FY2025 limits by household size: 1 person $1,882.50, 2 people $2,555.00, 3 people $3,227.50, 4 people $3,900.00, 5 people $4,572.50, 6 people $5,245.00, 7 people $5,917.50, 8 people $6,590.00. Add $672.50 for each additional person.[7] Note: Some sources cite 150% of Federal Poverty Level or 60% of state median income, whichever is higher.[2]
- Assets: There is no asset limit for LIHEAP in Nevada.[3]
- Household members must meet citizenship criteria[4][7]
- Household must live in Nevada[4][7]
- Household must be at least partly responsible for home heating or cooling costs by paying a utility company, fuel supplier, or landlord directly[4][7]
- The applicant must be the person responsible for paying energy costs for the household (exceptions may be granted for hardship)[5]
- A household is defined as one or more persons, related or not, who are living together and sharing a primary heating or electric source[4]

**Benefits:** Heating assistance: maximum benefit $3,136, minimum benefit $360. Crisis assistance: maximum benefit $3,136. Average assistance nationally is $622.[1][3] Nevada does not offer cooling assistance.[3]
- Varies by: household_size and fuel type; benefits calculated based on household income, household size, and type of fuel used for heating[3]

**How to apply:**
- Online portal (available in some regions; check with local LIHEAP office)[1]
- In-person at local LIHEAP administration agency[1]
- Through Benefits Enrollment Centers (BECs) who can complete applications on behalf of clients[1]
- Contact your local LIHEAP office for application procedures and deadlines

**Timeline:** Standard processing: 60 days from receipt. Expedited processing: 30 days for households with elderly members, disabled members, or children under 6 years of age.[5] One source cites 3-week turnaround with 95% approval rate when all documents are included.[1]
**Waitlist:** No waitlist mentioned in available sources. However, funding is limited and some local agencies may stop accepting applications if funds run out.[3]

**Watch out for:**
- Heating assistance is typically available only in fall and winter; cooling assistance is NOT offered in Nevada.[3]
- Crisis assistance is available only in emergencies (broken furnace, utility shutoff notice), not for routine heating needs.[3]
- Roommates covered by the same utility bill are counted as part of the same LIHEAP household, which may affect eligibility.[3][4]
- Funding is limited and local agencies may stop accepting applications before the official deadline if funds run out; apply as early as possible.[3]
- Prior recipient households with elderly or disabled members receive priority and are mailed simplified re-determination applications 30 days before eligibility date, but must still apply.[5]
- The applicant must be the person responsible for paying energy costs; exceptions require documented hardship.[5]
- Income limits are based on gross monthly income (before taxes), not net income.[3][7]
- There is a separate Senior Energy Assistance Expo program for NV Energy customers age 62+ with different eligibility criteria; do not confuse with LIHEAP.[6]

**Data shape:** LIHEAP in Nevada is a statewide program with income-based eligibility that scales by household size. Benefits are financial and vary based on household income, size, and fuel type. The program prioritizes elderly and disabled households for expedited processing (30 days vs. 60 days). Heating assistance is seasonal (fall/winter only); cooling assistance is not available. Crisis assistance is available year-round but only for emergencies. No asset limit exists. Processing times and application methods may vary by local agency, and funding is limited, creating potential application cutoffs before official deadlines.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.nv.gov/programs/energy/eligibility-criteria/

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households earning at or below 200% of the federal poverty level, as defined by the U.S. Office of Management and Budget[4][7]. Some service providers use 150% as their threshold[6]. Priority is given to households with elderly, disabled, or young children, emergency situations, and Energy Assistance Program recipients[1].
- Assets: Not specified in available documentation
- Must be owner-occupied single-family homes, mobile homes, condos, or rentals with landlord/owner approval[3]
- Every adult household member (18+) must have a valid unexpired ID[3]
- Every household member must have a Social Security Card (benefit letters not acceptable)[3]
- Must provide current utility bills (gas and/or electric)[2][3]
- Renters with landlord approval are eligible; owners of rental properties may be responsible for 50% of capital improvement costs[4]

**Benefits:** All services provided at no direct cost to approved homeowners and renters[4]. HELP of Southern Nevada weatherizes over 300 units per year, resulting in thousands of dollars in savings per client[3].
- Varies by: household_size

**How to apply:**
- Phone: Contact your regional service provider (varies by location)
- Mail: Submit application packet to regional service provider
- In-person: Visit regional service provider office
- Online: Not available at this time for most providers[8]

**Timeline:** Not specified in available documentation. Applications are reviewed in the order received[8].
**Waitlist:** Likely exists given high demand (300+ units weatherized annually by single provider), but specific waitlist information not provided

**Watch out for:**
- Income limits vary by provider: most use 200% of federal poverty level, but some use 150%[4][6]. Verify with your specific regional provider.
- Renters need landlord/owner approval to participate[3]
- Owners of rental properties may be responsible for 50% of capital improvement costs, not 100% covered[4]
- Social Security Card copies are acceptable, but benefit letters from Social Security are NOT acceptable[3]
- All pages of utility bills must be submitted; partial bills may result in application rejection[3]
- No online applications available at most providers; must apply by phone, mail, or in-person[8]
- Applications reviewed in order received; no guaranteed timeline for processing[8]
- Priority given to households with elderly, disabled, or young children — but this doesn't guarantee approval, only prioritization[1]
- Energy conservation measures must meet DOE cost-effectiveness criteria; not all requested upgrades may be approved[1]
- Program operates under federal DOE regulations (10 CFR Part 440) and state regulations (NRS and NAC 702); requirements are strict[1]

**Data shape:** This program's benefits scale by household size and energy audit results rather than fixed dollar amounts. Income eligibility thresholds vary by provider (150% vs. 200% of federal poverty level). The program is statewide but delivered through regional nonprofit Subgrantees, creating geographic variation in application processes, contact information, and potentially processing times. No specific processing timeline is published, suggesting variable wait times. The program prioritizes certain household types (elderly, disabled, young children) but does not guarantee approval based on priority alone. All services are provided at no cost to eligible households, making this a fully subsidized program rather than a loan or partial-assistance model.

**Source:** https://housing.nv.gov/programs/weatherization/

---

### Nevada State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: Not specified in available sources. SHIP nationally serves people with limited incomes, but Nevada-specific income thresholds are not documented in search results.
- Assets: Not specified in available sources.
- Must be a Medicare beneficiary or family member/caregiver of a Medicare beneficiary[2]
- Nationally, SHIP prioritizes support for people with limited incomes, Medicare beneficiaries under age 65 with disabilities, and individuals dually eligible for Medicare and Medicaid[2]

**Benefits:** Free, unbiased counseling and education on Medicare coverage options (Parts A, B, C, D), Medigap supplemental insurance, Medicare Advantage plans, Medicaid eligibility, Medicare Savings Programs, Extra Help/Low Income Subsidy, long-term care insurance, and fraud/abuse detection[2][4][5]
- Varies by: not_applicable — all services are free regardless of beneficiary circumstances

**How to apply:**
- Phone: 1-800-307-4444 (toll-free statewide)[6][7]
- Phone: 702-486-3478 (Las Vegas local)[3]
- Website: nvaging.net[3]
- Email: NevadaMAP@adsd.nv.gov[6]
- In-person counseling available through local sites[2][6]
- Virtual/phone counseling available[6]

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- SHIP is a counseling and education program, not a direct financial assistance program. It helps beneficiaries understand and enroll in coverage options but does not directly pay medical bills[1][2].
- Nevada SHIP is part of the broader Medicare Assistance Program (MAP), which also includes Senior Medicare Patrol (SMP) and MIPPA programs[6]. Callers may be directed to these related services.
- SHIP services are free and unbiased, but the program itself does not determine eligibility for Medicaid, Medicare Savings Programs, or Extra Help — it assists with applications to those programs[2][5].
- No income or asset limits are documented in available sources for Nevada SHIP eligibility, suggesting the program may serve all Medicare beneficiaries regardless of financial status, but this should be confirmed by contacting the program directly.

**Data shape:** Nevada SHIP is a counseling and advocacy program with no documented income limits, asset limits, or application processing timelines in available sources. Eligibility appears to be based on Medicare beneficiary status rather than financial need. The program is statewide with no geographic restrictions. All services are provided free of charge. Specific application procedures, required documents, and processing times are not detailed in publicly available sources and should be obtained by contacting the program directly at 1-800-307-4444.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov/Programs/Seniors/Medicare_Assistance_Program_(MAP)/MAP_Prog/

---

### Home Delivered Meals


**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned in sources; eligibility primarily based on age, homebound status, and need rather than financial criteria for non-Medicaid programs. Medicaid waiver programs may have separate income/asset tests not detailed here.
- Assets: Not applicable or not specified in available sources.
- Homebound due to illness, disability, or geographic isolation preventing attendance at congregate meal sites[5][6][7]
- Unable to shop for or prepare meals independently[4][6]
- For Medicaid waivers: Enrollment in specific HCBS waivers such as Frail Elderly (FE), Physical Disabilities, or Intellectual/Developmental Disabilities (HCBS-IDD)[1][2]
- Must live within service delivery area of provider (e.g., greater Las Vegas for Catholic Charities)[4]

**Benefits:** Home-delivered nutritionally balanced meals complying with Dietary Guidelines for Americans and providing at least 33 1/3% of daily Recommended Dietary Allowances (RDA); typically 5-7 meals per week including one hot meal on delivery day plus frozen meals; up to 7 additional meals via Second Home Delivered Meal Program; 2 shelf-stable meals annually for emergencies[3][5][6][7]
- Varies by: region

**How to apply:**
- Contact local Aging and Disability Services Division (ADSD) or area agency on aging (e.g., Washoe County Seniors: 775-328-2575)[6]
- Contact Catholic Charities of Southern Nevada for Las Vegas area (specific phone not listed; contact organization directly)[4]
- For Medicaid waivers: Contact case manager or health plan; referral required[2][8]
- Nevada 211 for referrals[9]
- In-person or phone assessment/certification by program staff at home[5][7]

**Timeline:** Not specified; includes initial home visit for certification (length up to 12 months)[7]
**Waitlist:** Not mentioned in sources

**Watch out for:**
- Not a single statewide program—must identify local provider or Medicaid waiver eligibility; geographic isolation or specific service area limits access[4][6]
- Medicaid version requires prior enrollment in HCBS waiver (e.g., Frail Elderly) and case manager referral—families often miss this[1][2]
- Certification requires home visit to confirm need and appliances; service limited to 12 months max per certification[7]
- Non-Medicaid programs (e.g., OAA-funded) are free but priority to frailest; no income test but waitlists possible in high-demand areas
- Meals must be agency-prepared; no self-prep reimbursement[3]

**Data shape:** Multiple programs under 'Home Delivered Meals' umbrella (OAA-funded via ADSD/local agencies, Medicaid HCBS waivers); eligibility need-based not income-based for main senior programs; regionally administered with varying providers/meals per week; requires home assessment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov (Aging and Disability Services Division); https://www.medicaid.nv.gov

---

### Respite Care Vouchers / Senior Respite Care

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or requirements.
- Assets: No asset limits or requirements.
- Care receiver lives in the community (not in assisted living, care facility, or nursing home).
- Care receiver has a functional impairment necessitating supervision/care and assistance with multiple areas of daily living (ADLs) such as bathing, feeding, walking for safety and well-being at home.
- Care receiver has a family member, friend, or other unpaid primary caregiver.
- Caregiver must reside in the same residence as the care receiver.
- Dementia/Alzheimer’s cases must be referred to Alzheimer’s Association of Northern Nevada (775-786-8061); this program does not duplicate those services.
- Care receiver at risk when left alone.

**Benefits:** Up to $1,000 voucher annually to reimburse live-in primary caregiver or professional agency for paid respite care (alternate supervision so everyday caregiver can take time off).
- Varies by: fixed

**How to apply:**
- Download and print application form from Seniors in Service Nevada website or ADSD documents.
- In-person or mail to Seniors in Service main office: 1380 Greg Street (likely Reno area based on Northern Nevada service).
- Contact Seniors in Service Nevada for assistance.

**Timeline:** Not specified; those selected are notified by phone and mail.
**Waitlist:** Contingent upon funds availability; program funded by state grants with potential selection process.

**Watch out for:**
- Not for dementia/Alzheimer’s (refer to Alzheimer’s Association).
- Caregiver must live at same address as care receiver.
- Community living only (no facilities).
- Funds contingent on availability; selection-based notification.
- Separate from broader Lifespan Respite or emergency programs.
- No duplication of other funding sources.

**Data shape:** Regionally restricted to Northern Nevada via specific provider (Seniors in Service); no income/asset test; live-in caregiver requirement; grant-funded with selection process.

**Source:** https://adsd.nv.gov (Aging and Disability Services Division); https://seniorsinservicenevada.org/respite-voucher-program/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level. The search results do not provide specific dollar amounts by household size, so applicants should contact their local SCSEP office to determine their exact threshold based on household composition.
- Assets: Not specified in available search results.
- Must be unemployed
- Must reside in the county served by the local SCSEP office
- Enrollment priority is given to: veterans and qualified spouses, individuals over 65, people with disabilities, those with low literacy skills or limited English proficiency, rural residents, homeless or at-risk individuals, those with low employment prospects, and those who have exhausted American Job Center services

**Benefits:** Paid on-the-job training at an average of 20 hours per week, compensated at the highest of federal, state, or local minimum wage. Participants typically train for approximately six months before job placement assistance. Additional supportive services may include assistance with food insecurity, housing, medical care access, and transportation. Participants gain work experience for résumé building, on-the-job training in computer or vocational skills, and professional job placement assistance.
- Varies by: Individual needs for supportive services; assessments occur at least twice per 12-month period

**How to apply:**
- In-person at local SCSEP office: AARP Senior Community Service Employment Program, 1135 Terminal Way Suite 102, Reno, Nevada 89502
- Phone: 775-323-2243 (AARP SCSEP Reno office, hours 8am-4pm Monday-Friday)
- Online locator tool: my.aarpfoundation.org/locator/scsep/ (enter address or zip code to find local program)
- Website: aarp.org/aarp-foundation/our-work/income/scsep

**Timeline:** Not specified in search results. If eligible and no waiting list exists, enrollment occurs to train at a local nonprofit organization.
**Waitlist:** Waitlists may exist; enrollment depends on availability at the time of application.

**Watch out for:**
- Income limit is 125% of federal poverty level—this is a strict threshold. Families should verify exact dollar amounts with their local office, as thresholds vary by household size and are updated annually.
- Participants must be unemployed; those with any current employment may not qualify.
- County residency requirement: applicants must live in the county served by the office where they apply. This may limit options in rural Nevada.
- No asset limits are mentioned in search results, but this does not confirm assets are unlimited—clarify with local office.
- Waitlists may exist; enrollment is not guaranteed even if eligible.
- The program is designed as a bridge to unsubsidized employment, not permanent subsidized work. Training typically lasts six months.
- Supportive services (food, housing, transportation, medical) are provided 'as needed' based on individual assessment—not guaranteed to all participants.
- Search results do not specify whether the program operates in all Nevada counties or only select regions.

**Data shape:** SCSEP is a federally funded program (Title V of the Older Americans Act, administered by U.S. Department of Labor) with statewide presence in Nevada but limited documented office locations in search results. Benefits are individualized based on participant needs and assessments rather than fixed by tier. Income eligibility is strict (125% federal poverty level) but specific dollar thresholds are not provided and must be obtained from local offices. The program emphasizes employment outcomes and supportive services tailored to barriers, making it more flexible than a fixed-benefit program but requiring direct contact with local providers for precise details.

**Source:** https://adsd.nv.gov/About/Reports/SrCommSvcEmplyProg/Home/ (Nevada ADSD SCSEP State Plan); https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor)

---

### Nevada Advocates for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits; prioritizes low-income or fixed-income seniors. Related programs like Southern Nevada Senior Law Program (SLP) serve those on tight fixed incomes without formal poverty qualification[3][6][7]. Nevada Legal Services SLP is statewide for low-income frail/minority seniors[8].
- Assets: No asset limits specified; focuses on legal aid and advocacy rather than asset-tested benefits[3][8].
- Nevada resident (statewide or Southern Nevada for some providers: Clark, Nye, Lincoln, Esmeralda Counties)[3][8]
- Low-income or tight fixed income preferred[3][6][8]
- For volunteer advocates (e.g., SAFE): age 21+, training, background check[4]
- Functional need not required unlike Medicaid waivers[1]

**Benefits:** Free legal services including estate planning, elder abuse prevention, government benefits assistance, health care, housing; community resource awareness, education, one-time emergency aid; court advocacy (e.g., Guardianship Advocacy Project referrals); self-help packets and brochures[3][5][7][8]
- Varies by: region

**How to apply:**
- Southern Nevada Senior Law Program: phone 702-229-6596, website www.snslp.org, email (protected, requires JS)[3][7]
- Nevada Legal Services Senior Law Project: contact via nevadalegalservices.org/senior-law-project (statewide)[8]
- ADSD Community Advocates: through adsd.nv.gov for outreach and guidance[5]
- In-person: varies by provider (e.g., Clark County Senior Services offices)[9]

**Timeline:** Not specified

**Watch out for:**
- Not a Medicaid or financial aid program—focuses on free legal/advocacy services, not direct cash or healthcare[1][3][8]
- No income qualification for some (e.g., SNLP serves fixed-income beyond poverty lines)[6]
- Court referrals required for some cases like guardianship[7]
- Limited resources prioritize frail/low-income/minority seniors[8]
- Volunteer-based elements may involve training/background checks[4]

**Data shape:** Decentralized network of legal aid and community advocacy providers; no uniform income/asset tests; regional focus in Southern Nevada with statewide options; prioritizes legal help over direct services

**Source:** https://adsd.nv.gov/Programs/Seniors/AdvocateElders/AdvocateforElders/[5]

---

### Nevada Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to all eligible residents regardless of financial status.
- Assets: No asset limits or tests apply.
- Must be a resident of a long-term care (LTC) facility, including nursing homes, group residential facilities, homes for individual residential care, assisted living facilities, or residential care facilities for the elderly.
- Services require resident consent (or consent from responsible party if resident is unable; otherwise proceeds if in best interest).
- Anyone can file a complaint on behalf of a resident, including family, staff, or the public.

**Benefits:** Investigation and resolution of complaints related to care, rights, dignity, respect, admissions/discharges, quality of care, privacy/confidentiality, dietary issues, activities, and environmental concerns; unannounced quarterly facility visits; education on resident rights, aging, and LTC services; person-centered advocacy; in-service training for facility staff; all services confidential and at no cost.

**How to apply:**
- Phone: Helpline at 1-888-282-1155 (toll-free).
- Online: Complete the LTC Ombudsman Inquiry/Complaint Form (available via official website).
- Email: ltc.ombudsman@adsd.nv.gov.
- In-person or phone: Carson City Administrative Office (3416 Goni Road, D-132, Carson City, NV 89706; 775-687-4210).
- In-person or phone: Las Vegas Regional Office (contact 702-486-3572 or 888-282-1155).

**Timeline:** Not specified; ombudsmen conduct investigations promptly with resident consent.

**Watch out for:**
- Not a healthcare or financial benefits program—provides advocacy and complaint resolution only, not direct services like medical care or payments.
- Requires resident consent for action; ombudsmen cannot proceed without it unless no responsible party and in resident's best interest.
- Confidentiality is strict—names of complainants are not shared.
- Does not handle abuse/neglect for community elders 60+ or vulnerable adults 18-59 (refer to Adult Protective Services).
- Separate from Community Ombudsman Program for non-LTC elders.
- Primarily for facility residents; public or families can contact but focus is resident advocacy.

**Data shape:** no income/asset/age test; consent-driven advocacy only for LTC facility residents; free statewide service via regional offices; complaint-based, not ongoing benefits.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov/programs/seniors/ltcombudsman/ltcombudsprog/

---

### Community Options Program for the Elderly (COPE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Call ADSD regional office for current 2025 income guidelines. Income limits exist but specific dollar amounts are not published in available materials. Applicants must meet financial eligibility according to monthly income and asset guidelines established by Nevada Administrative Code (NAC) 427A.[1][2]
- Assets: Asset limits are established by NAC 427A but specific thresholds are not detailed in available materials. Contact ADSD for current limits.[2]
- Must be at risk of institutionalization (nursing home placement) if services are not provided — must meet Level of Care (LOC) for nursing home placement[1][2]
- Must be a U.S. Citizen or alien legally admitted for permanent residency[2]
- Must reside in the State of Nevada[1][2]
- Must provide Social Security number[2]
- Services only provided while residing at home[2]

**Benefits:** Non-medical services including: Case Management, Personal Care, Homemaker, Adult Day Care, Adult Companion, Personal Emergency Response System (PERS), Chore, and Respite services[6]. Specific hours per week or dollar amounts per service are not specified in available materials.
- Varies by: Individual assessment — services are tailored to each recipient's needs as determined by case manager[1]

**How to apply:**
- In-person: Submit OCL Program Application to nearest ADSD regional office[1]
- Phone: Call local ADSD regional office and provide information to intake team member[1]
- Mail: Submit completed and signed OCL Program Application to ADSD regional office[1]

**Timeline:** Not specified in available materials. After application is received, an ADSD intake case manager will contact the individual to determine eligibility and appropriate services.[1]
**Waitlist:** COPE operates with a waitlist. If an applicant is placed on the waitlist, a screening will be completed to determine appropriateness for the program. If not on waitlist, a full assessment will be conducted.[2] Specific waitlist length or typical wait times are not provided in available materials.

**Watch out for:**
- COPE is a non-Medicaid program, but applicants must still meet financial eligibility criteria — not everyone qualifies regardless of income[1][6]
- The program is designed for people at imminent risk of nursing home placement. Simply being elderly and needing help is not sufficient; applicants must meet a specific Level of Care (LOC) threshold for nursing facility placement[1][2]
- COPE is similar to the HCBS FE Waiver but operates separately. Some individuals use COPE while waiting for HCBS FE Waiver placement[1][6]
- Specific income and asset limits are not published online — families must call their regional ADSD office to learn current thresholds[1]
- Processing timelines are not specified. Families should expect contact from an intake case manager after application submission, but no guaranteed timeline is provided[1]
- Waitlist status is possible. If placed on a waitlist, only a screening (not full assessment) is completed initially[2]
- Services are provided only while the recipient resides at home. If the person moves to a facility, COPE services end[2]

**Data shape:** COPE's data structure is highly individualized: eligibility determination requires a face-to-face LOC screening and financial assessment, and services are tailored to each recipient's needs rather than following a fixed tier or benefit schedule. Income and asset limits are not published in standard materials and must be obtained directly from ADSD. The program operates with a waitlist system. Regional offices handle applications, but specific regional variations in processing time or service availability are not documented in available materials.

**Source:** https://adsd.nv.gov/Programs/Seniors/COPE/COPE_Prog/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid Medicare Savings Programs (QMB, | benefit | federal | deep |
| Home and Community Based Services Waiver | benefit | state | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Nevada State Health Insurance Assistance | resource | federal | simple |
| Home Delivered Meals | benefit | local | medium |
| Respite Care Vouchers / Senior Respite C | benefit | local | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Nevada Advocates for Seniors | resource | state | simple |
| Nevada Long-Term Care Ombudsman Program | resource | federal | simple |
| Community Options Program for the Elderl | benefit | state | deep |

**Types:** {"benefit":8,"resource":3,"employment":1}
**Scopes:** {"federal":7,"state":3,"local":2}
**Complexity:** {"deep":8,"simple":3,"medium":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/NV/drafts.json`.

- **Home and Community Based Services Waiver for the Frail Elderly (HCBS FE Waiver)** (benefit) — 5 content sections, 6 FAQs
- **Home Delivered Meals** (benefit) — 4 content sections, 6 FAQs
- **Respite Care Vouchers / Senior Respite Care** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 1 programs
- **not_applicable**: 2 programs
- **household_size**: 2 programs
- **household_size and fuel type; benefits calculated based on household income, household size, and type of fuel used for heating[3]**: 1 programs
- **not_applicable — all services are free regardless of beneficiary circumstances**: 1 programs
- **region**: 2 programs
- **fixed**: 1 programs
- **Individual needs for supportive services; assessments occur at least twice per 12-month period**: 1 programs
- **Individual assessment — services are tailored to each recipient's needs as determined by case manager[1]**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI) as % of FPL; federal asset limits fixed but occasionally discrepant in reporting; QI funding-limited; statewide uniform via DWSS local offices.
- **Home and Community Based Services Waiver for the Frail Elderly (HCBS FE Waiver)**: Strict NFLOC with numeric deficit scoring (min 3/13); statewide but waitlisted; income at 300% FBR with spousal disregards; asset cap $2,000 individual with home equity limit and exemptions
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled special rules: gross income optional (net+asset only if over 200% FPL), higher asset limit ($3,500), medical/shelter deductions scale benefits by household size/net income.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: LIHEAP in Nevada is a statewide program with income-based eligibility that scales by household size. Benefits are financial and vary based on household income, size, and fuel type. The program prioritizes elderly and disabled households for expedited processing (30 days vs. 60 days). Heating assistance is seasonal (fall/winter only); cooling assistance is not available. Crisis assistance is available year-round but only for emergencies. No asset limit exists. Processing times and application methods may vary by local agency, and funding is limited, creating potential application cutoffs before official deadlines.
- **Weatherization Assistance Program (WAP)**: This program's benefits scale by household size and energy audit results rather than fixed dollar amounts. Income eligibility thresholds vary by provider (150% vs. 200% of federal poverty level). The program is statewide but delivered through regional nonprofit Subgrantees, creating geographic variation in application processes, contact information, and potentially processing times. No specific processing timeline is published, suggesting variable wait times. The program prioritizes certain household types (elderly, disabled, young children) but does not guarantee approval based on priority alone. All services are provided at no cost to eligible households, making this a fully subsidized program rather than a loan or partial-assistance model.
- **Nevada State Health Insurance Assistance Program (SHIP)**: Nevada SHIP is a counseling and advocacy program with no documented income limits, asset limits, or application processing timelines in available sources. Eligibility appears to be based on Medicare beneficiary status rather than financial need. The program is statewide with no geographic restrictions. All services are provided free of charge. Specific application procedures, required documents, and processing times are not detailed in publicly available sources and should be obtained by contacting the program directly at 1-800-307-4444.
- **Home Delivered Meals**: Multiple programs under 'Home Delivered Meals' umbrella (OAA-funded via ADSD/local agencies, Medicaid HCBS waivers); eligibility need-based not income-based for main senior programs; regionally administered with varying providers/meals per week; requires home assessment
- **Respite Care Vouchers / Senior Respite Care**: Regionally restricted to Northern Nevada via specific provider (Seniors in Service); no income/asset test; live-in caregiver requirement; grant-funded with selection process.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a federally funded program (Title V of the Older Americans Act, administered by U.S. Department of Labor) with statewide presence in Nevada but limited documented office locations in search results. Benefits are individualized based on participant needs and assessments rather than fixed by tier. Income eligibility is strict (125% federal poverty level) but specific dollar thresholds are not provided and must be obtained from local offices. The program emphasizes employment outcomes and supportive services tailored to barriers, making it more flexible than a fixed-benefit program but requiring direct contact with local providers for precise details.
- **Nevada Advocates for Seniors**: Decentralized network of legal aid and community advocacy providers; no uniform income/asset tests; regional focus in Southern Nevada with statewide options; prioritizes legal help over direct services
- **Nevada Long-Term Care Ombudsman Program**: no income/asset/age test; consent-driven advocacy only for LTC facility residents; free statewide service via regional offices; complaint-based, not ongoing benefits.
- **Community Options Program for the Elderly (COPE)**: COPE's data structure is highly individualized: eligibility determination requires a face-to-face LOC screening and financial assessment, and services are tailored to each recipient's needs rather than following a fixed tier or benefit schedule. Income and asset limits are not published in standard materials and must be obtained directly from ADSD. The program operates with a waitlist system. Regional offices handle applications, but specific regional variations in processing time or service availability are not documented in available materials.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Nevada?
