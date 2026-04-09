# Wyoming Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 2.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 14 |
| New (not in our data) | 0 |
| Data discrepancies | 14 |
| Fields our model can't capture | 14 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 13 | Our model has no asset limit fields |
| `regional_variations` | 13 | Program varies by region — our model doesn't capture this |
| `waitlist` | 10 | Has waitlist info — our model has no wait time field |
| `documents_required` | 14 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Wyoming Medicaid Long-Term Care

- **source_url**: Ours says `MISSING` → Source says `health.wyo.gov/healthcarefin/medicaid/ (referenced in search results but specific pages not detailed)`

### Community Choices Waiver (CCW)

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/healthcarefin/hcbs/[3]`

### PACE Wyoming

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/ (Wyoming Department of Health); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly`

### Medicare Savings Programs (QMB, SLMB, QI) in Wyoming

- **income_limit**: Ours says `$967` → Source says `$1,350` ([source](https://ecom.wyo.gov/m1100-medicare-savings-programs (Wyoming Department of Health); https://www.medicare.gov/basics/costs/help/medicare-savings-programs (federal Medicare.gov)))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Part A premiums (if you don't have premium-free Part A), Part B premiums, deductibles, coinsurance, and copayments for Medicare-covered services and items[5]

**SLMB:** Pays Part B premiums only (you must have both Part A and Part B to qualify)[5]

**QI:** Pays Medicare Part B premiums; also automatically qualifies you for Extra Help prescription drug program with copayments capped at $12.65 per drug in 2026[2][5]` ([source](https://ecom.wyo.gov/m1100-medicare-savings-programs (Wyoming Department of Health); https://www.medicare.gov/basics/costs/help/medicare-savings-programs (federal Medicare.gov)))
- **source_url**: Ours says `MISSING` → Source says `https://ecom.wyo.gov/m1100-medicare-savings-programs (Wyoming Department of Health); https://www.medicare.gov/basics/costs/help/medicare-savings-programs (federal Medicare.gov)`

### SNAP (Food Stamps)

- **source_url**: Ours says `MISSING` → Source says `https://dfs.wyo.gov/assistance-programs/food-assistance/supplemental-nutrition-assistance-program-snap`

### Wyoming Energy Assistance (LIHEAP)

- **income_limit**: Ours says `$3092` → Source says `$2,985` ([source](https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating assistance: one-time payment to utility/vendor, minimum $49, maximum $2,176 per season. Crisis assistance: up to $550 for emergencies like shutoff, broken heater, or empty fuel tank. Covers primary heating fuels (propane, pellets, wood, heating oil, coal, utilities). Not full coverage of energy costs.` ([source](https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/`

### Weatherization Assistance Program

- **source_url**: Ours says `MISSING` → Source says `https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/weatherization-assistance-program-wap-2/`

### Wyoming State Health Insurance Information Program (WSHIIP)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Free, one-on-one health insurance counseling and information services. Specific services include: Medicare Part A and B education, Medicare Prescription Drug Coverage (Part D) guidance, Medicare Supplement Insurance (Medigap) information, Medicare Advantage Plans (HMOs and PPOs) comparison, long-term care insurance counseling, Medicare Savings Programs (QMB, SLMB, QI) information, prescription drug assistance programs and drug discount cards, Medicaid and other insurance program information, free or reduced-fee health care program referrals. Counselors help beneficiaries understand benefits, identify and compare health insurance options, and protect against overpaying for medical care and prescription drugs.[4] Free Long Term Care Insurance Buyers Guide and Free Medicare Supplement Insurance Buyers Guide available.[6]` ([source](https://www.wyomingseniors.com/services/wyoming-state-health-insurance-information-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.wyomingseniors.com/services/wyoming-state-health-insurance-information-program`

### Meals on Wheels (via Title III-C)

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/`

### National Family Caregiver Support Program

- **min_age**: Ours says `60` → Source says `18` ([source](https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care (temporary breaks from caregiving responsibilities); information about available services; assistance gaining access to services; individual counseling; organization of support groups; caregiver training; supplemental services on a limited basis; care coordination and counseling (available statewide).` ([source](https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/`

### Senior Community Service Employment Program (SCSEP)

- **source_url**: Ours says `MISSING` → Source says `https://dws.wyo.gov/dws-division/workforce-center-program-operations/programs/senior-community-service-employment-program/[2]`

### Legal Assistance for Seniors (via Wyoming Legal Services)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal assistance including advice, representation in elder law, public benefits, housing, education, health care access, employment, domestic violence; may include simple wills, powers of attorney, advanced directives via related programs like Estate Planning Practicum.[6][8][9]` ([source](https://www.lawyoming.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.lawyoming.org`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints and problems including care quality, billing/charges, Medicare/Medicaid benefits, transfers/discharges, rights violations; investigates issues, recommends changes to improve quality of life, dignity, autonomy; provides information on facilities and regulations; handles elder abuse concerns; available in nursing homes, assisted living, board/care homes, home care, hospice, adult day care[1][2][3][4][6]` ([source](https://health.wyo.gov/admin/long-term-care-ombudsman-program/[3]))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/admin/long-term-care-ombudsman-program/[3]`

### Wyoming Home Services Program (WyHS)

- **min_age**: Ours says `60` → Source says `18` ([source](https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Specific in-home services including: Personal care (assistance with eating, dressing, bathing, toileting, transferring, walking); Homemaker services (meal prep, shopping, money management, phone use, light housework); Chore services (heavy housework, yard work, sidewalk maintenance); Respite care (temporary relief for caregivers); Home modifications (minor adaptations to facilitate home living). Tailored to individual service plan; no fixed dollar amounts or hours stated.[1][6][7]` ([source](https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/`

## Program Details

### Wyoming Medicaid Long-Term Care


**Eligibility:**
- Age: 65+
- Income: Single applicants: $2,982/month (2026)[1]. Married couples (both applying): specific limit not provided in search results, but asset limit is $3,000 for married couples if both require care[2]. Income includes all sources: Social Security, pensions, wages, disability benefits, veterans benefits, rental income, interest, dividends, and gifts[3]. Applicants exceeding income limits can establish a Qualified Income Trust (QIT/Miller Trust) to qualify[2].
- Assets: Countable assets must not exceed $2,000 for individuals or $3,000 for married couples if both require care[2]. Exempt assets include: one home (if equity under $602,000 and applicant intends to return or spouse/child under 21/disabled dependent resides there)[2]; one vehicle (if used for medical transport, employment, or primary vehicle of community spouse)[2]; household goods and personal effects[2]; irrevocable burial trusts (up to $1,800)[2].
- Wyoming residency[2]
- U.S. citizenship or lawful permanent resident status with at least 5 years in U.S.[2]
- Medical/functional need: Nursing Facility Level of Care (NFLOC) required for Nursing Home Medicaid and Medicaid Waivers; functional need with Activities of Daily Living (ADLs) required for Regular Medicaid but NFLOC not necessarily required[1]
- Medical assessment completed by county public health office using LT101 screening tool (measures ability to perform activities of daily living)[3]

**Benefits:** Wyoming Medicaid covers three categories of long-term care: (1) Nursing Home Medicaid—pays for nursing home care; (2) HCBS Waivers—pays for non-medical support services including in-home personal care, adult day care, meal delivery, home modifications, and Personal Emergency Response Systems (PERS) to help seniors remain in homes, adult foster care, or assisted living[1][5]; (3) Aged, Blind, and Disabled (ABD) Medicaid—provides basic healthcare (physician visits, prescription medication, emergency room, short-term hospital stays) plus long-term care benefits evaluated individually[5]. Specific dollar amounts and hours per week not provided in search results.
- Varies by: program_type_and_individual_assessment

**How to apply:**
- S
- e
- a
- r
- c
- h
-  
- r
- e
- s
- u
- l
- t
- s
-  
- d
- o
-  
- n
- o
- t
-  
- p
- r
- o
- v
- i
- d
- e
-  
- s
- p
- e
- c
- i
- f
- i
- c
-  
- U
- R
- L
- s
- ,
-  
- p
- h
- o
- n
- e
-  
- n
- u
- m
- b
- e
- r
- s
- ,
-  
- m
- a
- i
- l
-  
- a
- d
- d
- r
- e
- s
- s
- e
- s
- ,
-  
- o
- r
-  
- i
- n
- -
- p
- e
- r
- s
- o
- n
-  
- o
- f
- f
- i
- c
- e
-  
- l
- o
- c
- a
- t
- i
- o
- n
- s
- .
-  
- S
- o
- u
- r
- c
- e
-  
- [
- 7
- ]
-  
- r
- e
- f
- e
- r
- e
- n
- c
- e
- s
-  
- W
- y
- o
- m
- i
- n
- g
-  
- D
- e
- p
- a
- r
- t
- m
- e
- n
- t
-  
- o
- f
-  
- H
- e
- a
- l
- t
- h
-  
- (
- h
- e
- a
- l
- t
- h
- .
- w
- y
- o
- .
- g
- o
- v
- /
- h
- e
- a
- l
- t
- h
- c
- a
- r
- e
- f
- i
- n
- /
- m
- e
- d
- i
- c
- a
- i
- d
- /
- )
-  
- b
- u
- t
-  
- s
- p
- e
- c
- i
- f
- i
- c
-  
- a
- p
- p
- l
- i
- c
- a
- t
- i
- o
- n
-  
- m
- e
- t
- h
- o
- d
- s
-  
- n
- o
- t
-  
- d
- e
- t
- a
- i
- l
- e
- d
-  
- i
- n
-  
- r
- e
- s
- u
- l
- t
- s
- .

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Wyoming has NOT expanded Medicaid under the ACA[6]—adults under 65 without minor children are ineligible regardless of income. This program is exclusively for elderly (65+), blind, or disabled individuals[6].
- Income-cap state: Applicants exceeding the income limit ($2,982/month for singles in 2026) cannot simply reduce income—they must establish a Qualified Income Trust (QIT/Miller Trust) to qualify[2]. This is a specific planning tool many families miss.
- 60-month look-back period: Wyoming enforces a 60-month look-back rule to penalize asset transfers below market value[2]—families cannot simply gift assets to qualify.
- Medical need is mandatory: Financial eligibility alone is insufficient. Applicants must demonstrate medical/functional need through LT101 assessment[3]. Meeting income and asset limits does NOT guarantee approval.
- ABD Medicaid benefits are evaluated individually and provided one at a time, not all at once like Nursing Home Medicaid[5]—this affects what services are immediately available.
- Not meeting initial criteria does not mean ineligibility[1]—elderly residents over the limits may still qualify through other mechanisms (e.g., QIT, spend-down strategies).
- Search results lack critical application details: specific phone numbers, URLs, processing timelines, required documents, and regional office locations are not provided—families will need to contact Wyoming Department of Health directly.

**Data shape:** Wyoming Medicaid Long-Term Care is structured as three distinct programs (Nursing Home Medicaid, HCBS Waivers, ABD Medicaid) with different benefit delivery models. It is an income-cap state requiring Qualified Income Trusts for over-limit applicants. Medical need assessment is county-based. Benefits vary significantly by program type and individual evaluation. Critical application logistics (phone, URLs, forms, processing times, regional variations) are not detailed in available search results, requiring direct contact with Wyoming Department of Health for complete guidance.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** health.wyo.gov/healthcarefin/medicaid/ (referenced in search results but specific pages not detailed)

---

### Community Choices Waiver (CCW)


**Eligibility:**
- Age: 65+ or 19-64 with disability (verified by SSA criteria or Department); disabled individuals can continue services after turning 65[1][2][3]+
- Income: Must be eligible for Wyoming Medicaid, including income at or below 300% of Federal Benefit Rate (FBR) (~$2,901/month for individual as of recent data) or qualify for Special HCBS Waiver Group; exact limits follow Medicaid rules and vary by household size—use Medicaid eligibility test for specifics[1][2][5]
- Assets: Follows Wyoming Medicaid asset limits (limited countable assets); specifics not detailed in sources—primary residence, one vehicle often exempt; consult Medicaid rules[1][5]
- Wyoming resident and U.S. citizen/qualified immigration status[2]
- Nursing Facility Level of Care (NFLOC) determined by Public Health Nurse using LT-101 assessment tool (assesses ADLs/IADLs)[1][2][3]
- Medicaid-eligible (apply/renew if not enrolled)[1][2][3]

**Benefits:** Adult day services, case management, homemaker, home health aide, personal support services, respite, participant-directed or agency-directed care models; allows living at home or assisted living instead of nursing facility[1][4][5][6]
- Varies by: priority_tier (waitlist based on eligibility date); service models (participant-directed vs agency-directed)[1][5]

**How to apply:**
- Contact Benefits & Eligibility Specialist in your county[1][3]
- Online: Participant Portal or Medicaid application[3]
- Phone: WY Medicaid Customer Service Center at 855-294-2127[1]
- Paper: Submit CCW Program Application and Fact Sheet (CCW Form 01)[2][3]
- In-person: County Benefits & Eligibility Specialist office[1][3]

**Timeline:** Not specified; includes PHN scheduling for LT-101 assessment[3]
**Waitlist:** Yes, not an entitlement program (capped at ~3,669 slots); priority by eligibility determination date[1]

**Watch out for:**
- Must be Medicaid-eligible first; apply/renew Medicaid before or with CCW[1][2][3]
- Waiting list due to slot cap; not guaranteed access[1]
- Requires selecting county-specific case management agency[2][4]
- Level of care reassessed annually[2]
- Applying over income/asset limits leads to denial[1]

**Data shape:** Tied to Medicaid eligibility with NFLOC via LT-101 tool; county-specific case management providers; waitlisted with priority by eligibility date; two care models (participant/agency-directed)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/healthcarefin/hcbs/[3]

---

### PACE Wyoming


**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE nationally or in Wyoming; fully covered for Medicaid-eligible (dual-eligible Medicare/Medicaid) with no additional cost. Non-Medicaid eligible pay private monthly premium (estimated $7,000+ or share of cost $200-$900). Wyoming applies institutional Medicaid income rules and post-eligibility treatment[1][2][4][7].
- Assets: No specific asset limits stated for PACE; for free Medicaid coverage, countable assets (excluding house and one automobile) must meet Wyoming Medicaid institutional thresholds (exact amounts not specified in sources)[4][7].
- Require Nursing Facility Level of Care (NFLOC) as defined by Wyoming[1][2][8]
- Live in the service area of a PACE organization[1][2]
- Able to live safely in the community at enrollment with PACE support[1][2]
- Demonstrable benefit: PACE must enable safe community living[1]

**Benefits:** All-inclusive care: primary care, nursing, social work, therapies, medications, transportation, adult day health care, home care, hospital/inpatient, and all Medicare/Medicaid-covered services; no deductibles/co-pays for enrollees; provided by interdisciplinary team (e.g., MDs, NPs, nurses, CNAs, social workers)[1][2][6][9].

**How to apply:**
- Contact Wyoming Medicaid office or former provider (Cheyenne Regional Medical Center area)[3][5]
- National PACE Association interactive map for local programs (no Wyoming-specific URL in results)[3]

**Timeline:** Not specified in sources
**Waitlist:** Possible waitlists due to capped federal/state funding; varied by state/program[3]

**Watch out for:**
- Wyoming's only PACE program (WY PACE) closed in 2021 due to budget cuts; currently unavailable[5][6]
- Not statewide; strictly limited to specific service areas where a PACE provider operates[1][2]
- NFLOC certification required, varying by state definition[1]
- Non-Medicaid pay high private premiums; 99% enrollees are dual-eligible[4]
- Capped funding may cause waitlists[3]

**Data shape:** Program closed in Wyoming since 2021; previously single-site (Cheyenne); no income test but ties to Medicaid institutional rules; not statewide, provider-restricted

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/ (Wyoming Department of Health); https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly

---

### Medicare Savings Programs (QMB, SLMB, QI) in Wyoming


**Eligibility:**
- Income: Wyoming Medicare Savings Programs have three tiers with 2026 income limits[3][5]:

**Qualified Medicare Beneficiary (QMB):**
- Single: $1,350/month
- Married couple: $1,824/month
- Requirement: Income at or below 100% of Federal Poverty Level (FPL) plus $20 income disregard per household[3]

**Specified Low-Income Medicare Beneficiary (SLMB):**
- Single: $1,616/month
- Married couple: $2,184/month
- Requirement: Income between 100-120% FPL plus $20 income disregard[3]

**Qualifying Individual (QI):**
- Single: $1,816/month
- Married couple: $2,455/month
- Requirement: Income between 121-135% FPL plus $20 income disregard[3]

Note: Income limits are slightly higher in Alaska and Hawaii, and some states may count certain income types differently[5]. Wyoming-specific variations should be confirmed with the state Medicaid agency.
- Assets: Wyoming uses federal asset limits for QMB, SLMB, and QI programs[4]:
- Single: $9,090
- Married couple: $13,630

These limits apply to countable resources; certain assets may be excluded depending on state policy[1]. The search results do not specify which assets are exempt or how they are counted.
- Must be entitled to Medicare (enrolled in Part A and/or Part B)[1]
- Must meet income and resource limits specific to the program tier
- Must apply annually to maintain eligibility[5]

**Benefits:** **QMB:** Pays Part A premiums (if you don't have premium-free Part A), Part B premiums, deductibles, coinsurance, and copayments for Medicare-covered services and items[5]

**SLMB:** Pays Part B premiums only (you must have both Part A and Part B to qualify)[5]

**QI:** Pays Medicare Part B premiums; also automatically qualifies you for Extra Help prescription drug program with copayments capped at $12.65 per drug in 2026[2][5]
- Varies by: priority_tier

**How to apply:**
- Contact Wyoming Department of Health, Division of Healthcare Financing (state Medicaid agency) — specific phone number and online portal URL not provided in search results
- Contact your county Department of Social Services or Medicaid office
- Mail application to your state Medicaid agency
- In-person at local Medicaid office

**Timeline:** Not specified in search results
**Waitlist:** QI Program operates on a first-come, first-served basis with priority given to people who received QI benefits in the previous year[5]. No waitlist information provided for QMB or SLMB.

**Watch out for:**
- QI Program is only available for people who don't qualify for any other Medicaid coverage or benefits[5] — if you qualify for QMB or SLMB, you cannot use QI
- QI Program requires annual reapplication and operates on first-come, first-served basis; funding may be limited in some years[5]
- Income limits include a $20 disregard per household, which slightly raises the effective threshold[3]
- Asset limits are relatively low ($9,090 single/$13,630 married for QMB/SLMB/QI); exceeding these limits disqualifies applicants regardless of income[4]
- Some states don't count certain types of income or resources when determining eligibility; Wyoming's specific exclusions are not detailed in search results — confirm with state agency
- QMB provides the most comprehensive coverage (premiums, deductibles, coinsurance, copayments), while SLMB and QI only cover premiums — families should understand the tier differences
- Search results do not provide specific Wyoming contact phone numbers, online application portals, or processing timelines — families must contact the state Medicaid agency directly for application details

**Data shape:** Wyoming Medicare Savings Programs operate as a three-tier system (QMB, SLMB, QI) with escalating income limits and decreasing benefit levels. Benefits scale by program tier rather than household size. Income limits include a $20 household disregard. Asset limits are uniform across the first three tiers but differ for QDWI (a fourth program for disabled working individuals). The QI Program operates on first-come, first-served basis with priority carryover, creating potential waitlist dynamics. Search results lack specific Wyoming contact information, application forms, processing timelines, and documentation requirements — these details must be obtained directly from the state Medicaid agency.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ecom.wyo.gov/m1100-medicare-savings-programs (Wyoming Department of Health); https://www.medicare.gov/basics/costs/help/medicare-savings-programs (federal Medicare.gov)

---

### SNAP (Food Stamps)


**Eligibility:**
- Income: Households with a member age 60+ or disabled have no gross income limit but must meet net income limits (100% poverty): 1: $1305, 2: $1763, 3: $2221, 4: $2680, 5: $3138, 6: $3596, 7: $4055, 8: $4513 monthly. Other households must meet gross (130% poverty or 165% for elderly/disabled in some contexts): 1: $1696/$2152, 2: $2292/$2909, 3: $2888/$3665, 4: $3483/$4421, 5: $4079/$5177, 6: $4675/$5934, 7: $5271/$6690, 8: $5867/$7446 and net limits. Net income calculated after deductions: 20% earned income, standard ($177 for 1-3, $184 for 4, $215 for 5, $246 for 6+), medical (> $35 for elderly/disabled), dependent care, child support, shelter (uncapped for elderly/disabled, max $569 otherwise).[2][3][6]
- Assets: Countable resources: $4,500 if household includes member 60+ or disabled; $3,000 otherwise (some sources note $2,500/$3,750). Exempt: SSI recipients, POWER/Tribal TANF households, home, vehicles. Countable: bank accounts, etc.[1][2][3]
- Wyoming resident, apply in county of residence.
- U.S. citizen or qualified non-citizen.
- No work requirements if household is entirely elderly (60+) or disabled.
- Each application reviewed per federal rules; deductions impact net income.

**Benefits:** Monthly EBT card for food purchases; max allotments (Oct 2025-Sep 2026): 1: $298, 2: $546, 3: $785, 4: $994, 5: $1183, 6: $1421, 7: $1571, 8: $1789. Actual amount based on income, deductions, household size.
- Varies by: household_size

**How to apply:**
- Online: dfs.wyo.gov (Wyoming Department of Family Services)
- Phone: Local county DFS office (find via dfs.wyo.gov)
- Mail or in-person: County DFS office where you reside
- Apply in county of residence

**Timeline:** Not specified in sources; federal rules apply, typically 30 days.

**Watch out for:**
- Elderly/disabled households: no gross income limit but asset/net tests apply; uncapped shelter deduction.
- Resources exempt for SSI/POWER recipients but countable otherwise (e.g., bank accounts).
- Must apply in specific county; deductions like medical/shelter critical for qualification.
- No time limit on benefits if eligible; work exemptions for elderly/disabled households.

**Data shape:** Elderly/disabled special rules: no gross income limit, higher asset limit ($4500), uncapped shelter deduction; income/asset tests vary by household composition; county-administered statewide; benefits scale by household size and net income after deductions.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfs.wyo.gov/assistance-programs/food-assistance/supplemental-nutrition-assistance-program-snap

---

### Wyoming Energy Assistance (LIHEAP)


**Eligibility:**
- Income: Gross monthly household income at or below 60% of Wyoming state median income: 1 person $2,985; 2 people $3,904; 3 people $4,823; 4 people $5,741; 5 people $6,660; 6 people $7,579. Annual examples: 2-person household ≤$46,000; 4-person household ≤$68,902. SSI/SNAP recipients may qualify automatically. Elderly (60+), disabled, or households with children under 6 receive priority.
- Assets: No asset limits mentioned in program sources.
- Must be responsible for home energy costs (homeowners, renters, permanently parked RVs).
- Wyoming resident.
- Household includes all at address sharing utility bill.

**Benefits:** Heating assistance: one-time payment to utility/vendor, minimum $49, maximum $2,176 per season. Crisis assistance: up to $550 for emergencies like shutoff, broken heater, or empty fuel tank. Covers primary heating fuels (propane, pellets, wood, heating oil, coal, utilities). Not full coverage of energy costs.
- Varies by: household_size|income|fuel_type|priority_tier

**How to apply:**
- Online: lieapwyo.org
- Phone: 1-800-246-4221 (callback system holds place in line)
- Local: Community Action Agency, Area Agency on Aging, or state LIHEAP office (phone/mail/in-person for elderly/disabled)

**Timeline:** Payments start Oct. 1 for crisis cases; others after Oct. 1. No specific processing days stated.
**Waitlist:** Higher-than-normal applications reported; phone callback system manages demand.

**Watch out for:**
- Priority for elderly 60+ and crisis cases until Oct. 1; general applications Oct. 1-April 30 only.
- No cooling assistance.
- Household counts all at address on utility bill (differs from SNAP).
- High application volume; use callback phone feature.
- Covers heating fuels/utilities directly; not full bill payment.
- 2025-2026 season applications open until April 30, 2026.

**Data shape:** Income at 60% state median (higher than federal 150% FPL in WY); priority tiers for elderly/disabled/young children/crisis; statewide but local agency delivery; heating-season only (Oct-April); varies by fuel type and crisis status.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/

---

### Weatherization Assistance Program


**Eligibility:**
- Income: Up to 200% of the Federal Poverty Level (FPL). Automatic eligibility if approved for LIEAP, or participating in SNAP, SSI, TANF. Exact dollar amounts not specified in sources; refer to current FPL tables on official site as they adjust annually. Older sources mention 60% statewide median income (~$33,600 for family of 4 in 2005), but current is 200% FPL.[1][2][4]
- Assets: No asset limits mentioned.
- Wyoming resident.
- Home not expected to be sold or rented within 12 months.
- Home not previously weatherized by DOE-related program.
- Renters need written landlord permission via Rental Verification form or Landlord Agreement.[1][2]

**Benefits:** No-cost home energy efficiency improvements including insulation, sealing leaks around doors/windows, basic health/safety checks, potential HVAC repairs/replacements via licensed technicians. Can save 5-25% on heating bills. Up to $4,000 historically via contractors, but current specifics not detailed. Leverages state/federal grants and utility funding (e.g., 50% from PacifiCorp).[1][3][4][5]
- Varies by: priority_tier

**How to apply:**
- Online year-round: https://lieapwyo.org/weatherization.html or https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/weatherization-assistance-program-wap-2/[1][5]
- Phone: 1-800-246-4221 (to apply or check status)[1][5][6]
- Local community agencies (e.g., Johnson County: 307-686-2730)[5]
- Joint LIEAP/WAP application; mail/in-person via LIEAP processes[2]

**Timeline:** Varies; crisis applications (e.g., lost heat, low fuel) expedited. Once approved, weatherization agency contacts for energy audit.[1][6]
**Waitlist:** Services based on priority point system (elderly, disabled, children under 5 prioritized); approval does not guarantee services same year; historical waiting lists noted.[1][4]

**Watch out for:**
- Approval for LIEAP/WAP does not guarantee weatherization services due to priority system and funding limits.[1][2][4]
- Renters must secure landlord permission; restrictions apply.[1]
- Home must not be for sale/rent soon or previously DOE-weatherized.[2]
- Joint LIEAP application required; WAP considered automatically but prioritized.[1][7]
- Crisis aid available but varies by situation until ~April (e.g., 2025).[6]

**Data shape:** Tied to LIEAP eligibility (200% FPL); priority tiers for elderly/disabled/kids under 5; regional contractors handle delivery; no fixed dollar cap detailed recently, up to ~$4,000 historically; year-round apps but funding-constrained.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/weatherization-assistance-program-wap-2/

---

### Wyoming State Health Insurance Information Program (WSHIIP)


**Eligibility:**
- Income: No income limits. WSHIIP is a free counseling service available to all Wyoming residents, with particular focus on seniors and Medicare beneficiaries.[6]
- Wyoming resident[6]
- Typically seniors and others on Medicare, though the program serves a broader population[6]

**Benefits:** Free, one-on-one health insurance counseling and information services. Specific services include: Medicare Part A and B education, Medicare Prescription Drug Coverage (Part D) guidance, Medicare Supplement Insurance (Medigap) information, Medicare Advantage Plans (HMOs and PPOs) comparison, long-term care insurance counseling, Medicare Savings Programs (QMB, SLMB, QI) information, prescription drug assistance programs and drug discount cards, Medicaid and other insurance program information, free or reduced-fee health care program referrals. Counselors help beneficiaries understand benefits, identify and compare health insurance options, and protect against overpaying for medical care and prescription drugs.[4] Free Long Term Care Insurance Buyers Guide and Free Medicare Supplement Insurance Buyers Guide available.[6]

**How to apply:**
- Phone: 1-800-856-4398 (toll-free)[5][6]
- Local phone: (307) 856-6880[5]
- Email: tana.howard@wyo.gov or wshiipmgr@wyoming.com[5][6]
- In-person: Wyoming Dept of Insurance, 106 West Adams Ave, Riverton, WY 82501[5]
- Website: wyomingseniors.com[5][6]

**Timeline:** Not specified in available sources. Counseling is provided on-demand through volunteer network.[6]

**Watch out for:**
- WSHIIP is a counseling and information program, NOT an insurance enrollment program. It does not enroll you in plans or provide financial assistance — it educates you so you can make informed decisions.[4][6]
- This program is specifically designed for Medicare beneficiaries and seniors, though it serves others. Families seeking coverage for children should explore Kid Care CHIP or Medicaid instead.[1]
- Counselors are volunteers who must attend yearly in-services to stay current on Medicare issues — quality and depth of counseling may vary by volunteer.[6]
- The program provides guidance on Medicare Savings Programs (QMB, SLMB, QI) but does not determine eligibility or process applications for those programs.[4]
- If you receive a call claiming to be from Social Security asking for your Social Security number, hang up and call Social Security directly at 1-800-772-1213 to verify. WSHIIP counselors will not ask for this information unsolicited.[6]
- Hours of operation are 8:00 am - 5:00 pm (Wyoming time).[5]

**Data shape:** WSHIIP is a federally mandated, grant-funded counseling and advocacy program with no eligibility barriers (no income or asset tests). It is fundamentally different from insurance programs like CHIP or Medicaid — it provides information and guidance rather than direct coverage or financial benefits. The program's reach is distributed through a volunteer network rather than centralized offices, making it accessible across rural and urban Wyoming. The program is specifically designed to help beneficiaries navigate complex Medicare rules and avoid overpaying for coverage and prescriptions.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.wyomingseniors.com/services/wyoming-state-health-insurance-information-program

---

### Meals on Wheels (via Title III-C)


**Eligibility:**
- Age: 60+
- Income: No income limits; program is non-means tested.
- Assets: No asset limits; program is non-means tested.
- For home-delivered meals (Title III-C2): Age 60+ and homebound or geographically isolated; spouses of eligible participants; disabled persons under 60 residing with eligible participants.
- For congregate meals (Title III-C1): Age 60+ and spouse; disabled under 60 residing with 60+ adults or in housing primarily for 60+ adults; volunteers under 60; staff 60+.
- Annual reassessment required to confirm continued eligibility; those no longer homebound may be referred to congregate meals.

**Benefits:** At least one hot or appropriate meal 5+ days per week, providing 1/3 of current Dietary Reference Intakes and complying with Dietary Guidelines for Americans; menus approved by Registered Dietitian; up to 3 meals per day in some local programs; may include short- or long-term delivery; socialization opportunities via delivery.
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging or Meals on Wheels provider (varies by region, e.g., Natrona County Meals on Wheels for Casper; Meals on Wheels of Cheyenne).
- Phone examples: Division of Healthcare Financing Long Term Care Unit at 855-203-2936 (for waiver-related); local providers for assessment.
- In-person or phone assessment by social worker to determine eligibility and contribution.
- Separate process for Long Term Community Choice Waiver integration.

**Timeline:** Varies; some within a week, up to 45 days for waiver approval; initial assessment followed by quick start if approved.
**Waitlist:** Possible in some programs; no statewide data.

**Watch out for:**
- Non-means tested federally, but local providers may assess for suggested contributions (no one denied for inability to pay).
- Must contact local provider for zone eligibility; not all areas have identical coverage.
- Home-delivered not strictly limited to 'homebound' per OAA (no definition); includes geographically isolated.
- Annual reassessment; may shift to congregate if no longer homebound.
- Weather may cancel deliveries in Wyoming.
- Under 60 eligibility only if living with 60+ eligible or in specific settings.

**Data shape:** Administered statewide via local providers with regional variations in contributions, assessments, and delivery; no income/asset tests; eligibility prioritizes homebound/geographically isolated 60+ with narrow exceptions for under 60.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/

---

### National Family Caregiver Support Program


**Eligibility:**
- Age: 18+
- Income: No income limits specified in Wyoming NFCSP policies or guidelines.
- Assets: No asset limits specified; no mention of countable assets or exemptions.
- Caregivers must be adults 18 years or older providing care to individuals 60 years or older, or to individuals of any age with Alzheimer’s disease or related dementia.
- In Johnson, Laramie, and Sheridan counties only: Older relative caregivers (55 years or older) providing care to children 17 years or younger, adults 18-59 with disabilities, or parents (biological or adoptive, 55 years or older) caring for their adult child(ren) 18-59 with a disability.
- Care receivers for respite and supplemental services must meet frailty criteria: 2 ADLs or 2 IADLs.
- Non-citizens are eligible.
- Services cannot be provided to caregivers receiving payment for care through public programs or private arrangements.

**Benefits:** Respite care (temporary breaks from caregiving responsibilities); information about available services; assistance gaining access to services; individual counseling; organization of support groups; caregiver training; supplemental services on a limited basis; care coordination and counseling (available statewide).
- Varies by: region

**How to apply:**
- Phone: (307) 777-7531 or 1-800-510-0280 (for paid caregiver questions and general inquiries).
- Contact local Aging Division or provider organizations via Wyoming Department of Health Aging Division.
- Toll-free helpline through Wyoming Department of Health Aging Division or Wyoming 2-1-1 for resource location (specific number not listed; refer to health.wyo.gov/aging).
- No specific online application, mail, or in-person details provided; contact via phone or local providers.

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified; may vary by region or provider availability.

**Watch out for:**
- Program not available in 7 specific counties (Albany, Niobrara, Park, Platte, Sublette, Washakie, Weston).
- Grandparent/relative caregiver eligibility restricted to only 3 counties (Johnson, Laramie, Sheridan).
- No services if caregiver is paid for care via public programs or private arrangements.
- Respite/supplemental services require care receiver to be frail (2 ADLs or 2 IADLs); care coordination/counseling more broadly available.
- No mention of income/asset tests, but strict documentation and no backdating allowed.
- Paid caregivers (e.g., nurses/CNAs) require specific reference checks.

**Data shape:** County-restricted availability (excluded in 7 counties); relative caregiver benefits only in 3 specific counties; no income or asset tests; services vary by local grantee providers; frailty required for core respite/supplemental benefits.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/

---

### Senior Community Service Employment Program (SCSEP)


**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[3]. The search results do not provide specific dollar amounts by household size, as federal poverty guidelines change annually. Families should contact their local SCSEP office or visit the federal poverty guidelines website to determine their household's threshold.
- Assets: Not specified in available search results.
- Must be unemployed[2][3]
- Must be a resident of Wyoming[1]
- Must reside in one of the counties served by the program (see geography section)[2]

**Benefits:** Paid on-the-job training at approximately 20 hours per week[3][4]. Participants are paid the highest of federal, state, or local minimum wage[3]. Training assignments typically last 6 to 12 months[4]. Additional services include job search assistance, resume help, interview skills practice, and access to employment assistance through American Job Centers[3][4].
- Varies by: fixed

**How to apply:**
- Phone: (307) 251-1750 or (307) 475-6198 (Wyoming state office)[1]
- Phone: (307) 473-3968 (Casper office, 444 West Collins Drive, Casper, WY 82601)[2]
- Phone: (307) 267-4226 (The Center for Workforce Inclusion, Inc. — serves Fremont, Hot Springs, Natrona, and Washakie counties)[8]
- Email: [email protected][2]
- Email: DBetts@workforceinclusion.org (for Fremont, Hot Springs, Natrona, Washakie counties)[8]
- In-person: 444 West Collins Drive, Casper, WY 82601 (Monday–Friday, 8:00 AM–5:00 PM)[2]
- Online locator: AARP Foundation SCSEP locator at my.aarpfoundation.org/locator/scsep/[6]
- Text, email, or call (application methods vary by location)[2]

**Timeline:** Not specified in available search results.
**Waitlist:** Space is limited[1], but specific waitlist information is not provided in available search results.

**Watch out for:**
- **Limited geographic availability**: The program operates in only 5 of Wyoming's 23 counties. Families outside these counties cannot access SCSEP[2].
- **Income threshold is strict**: At 125% of federal poverty level, the income limit is quite restrictive. A family slightly above this threshold will not qualify, even if they believe they need assistance[3].
- **Unemployment requirement is absolute**: Participants must be currently unemployed; part-time or underemployed individuals may not qualify[3].
- **Priority enrollment exists**: While not explicitly detailed, enrollment priority is given to veterans, those over 65, individuals with disabilities, those with low literacy or limited English proficiency, rural residents, homeless or at-risk individuals, and those with poor employment prospects[3]. Families should ask about priority status when applying.
- **Space is limited**: The program explicitly states 'space is limited'[1], suggesting demand may exceed availability.
- **No statewide coverage**: Despite Wyoming having 23 counties, only 5 are served. Families in unserved counties have no access to this program[1][2].

**Data shape:** This program's data structure is defined by severe geographic restriction (5 of 23 Wyoming counties only), strict income-based eligibility (125% federal poverty level), and fixed benefit structure (approximately 20 hours/week at minimum wage for 6–12 months). The program is not universally available in Wyoming, and families must first determine if they live in a served county before proceeding with eligibility assessment. Processing timelines and specific required documents are not publicly detailed in available sources, requiring direct contact with local offices.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dws.wyo.gov/dws-division/workforce-center-program-operations/programs/senior-community-service-employment-program/[2]

---

### Legal Assistance for Seniors (via Wyoming Legal Services)


**Eligibility:**
- Age: 60+
- Income: Low-income requirements based on federal poverty guidelines; exact dollar amounts and household size table not specified in sources—must apply to confirm. Providers like Legal Aid of Wyoming assess income, assets, citizenship, and other factors via WYLawHelp screener.[6][8]
- Assets: Assets considered for eligibility in related elder law services (e.g., Medicaid planning), with limits like $2,000 for long-term care applicants (exceptions apply); specific counts/exemptions for Legal Aid not detailed—primary residence, vehicle may be exempt in similar programs.[5]
- Low-income status
- Wyoming resident
- Civil legal issue in priority areas like elder law, public benefits, housing, domestic violence
- Case acceptance guidelines per provider

**Benefits:** Free civil legal assistance including advice, representation in elder law, public benefits, housing, education, health care access, employment, domestic violence; may include simple wills, powers of attorney, advanced directives via related programs like Estate Planning Practicum.[6][8][9]
- Varies by: priority_tier

**How to apply:**
- Online via https://www.lawyoming.org (Legal Aid of Wyoming apply now)
- WYLawHelp.org for eligibility screening and provider contacts[6]
- Phone: Contact Legal Aid of Wyoming (number via site) or Wyoming State Bar Modest Means at (307) 766-6416 for related services[6]
- Download/print Modest Means Program Client Application and mail to Wyoming State Bar[6]
- In-person via local offices (e.g., Albany County resources)

**Timeline:** Not specified

**Watch out for:**
- Must apply directly with providers like Legal Aid of Wyoming to confirm eligibility—screeners like WYLawHelp provide estimates only[6]
- Not all cases accepted; priority on civil matters, no criminal or fee-generating cases[8]
- Modest Means is reduced fee ($100/hr max, $1,000 retainer), not free—only for those above free legal aid thresholds[6]
- Funds restricted by Legal Services Corporation rules, cannot assist certain immigration/fee cases[8]

**Data shape:** Eligibility via multiple providers (Legal Aid of Wyoming primary for free services, State Bar for modest means); no fixed income/asset tables published—case-by-case with federal poverty tie-in; priority-based case acceptance

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.lawyoming.org

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to anyone with concerns about long-term care services[1][2][3]
- Assets: No asset limits or tests apply[1][2][3]
- Must be a recipient of long-term care services (or family/friend on their behalf) in Wyoming facilities such as nursing homes, assisted living, boarding homes, adult day care, congregate housing, senior in-home care, or related home care; anyone with related questions or concerns can contact for guidance, including families seeking services, residents with billing/transfer issues, or providers needing resources[1][2][3][4][6]

**Benefits:** Advocacy to resolve complaints and problems including care quality, billing/charges, Medicare/Medicaid benefits, transfers/discharges, rights violations; investigates issues, recommends changes to improve quality of life, dignity, autonomy; provides information on facilities and regulations; handles elder abuse concerns; available in nursing homes, assisted living, board/care homes, home care, hospice, adult day care[1][2][3][4][6]

**How to apply:**
- Phone: State Ombudsman (307) 777-2885[2]; Regional - Riverton area (Big Horn, Washakie, Park, Hot Springs, Teton, Fremont, Sublette, Lincoln, Uinta): 307-856-6880 or toll-free 1-800-856-4398; Regional - Southeast (Crook, Weston, Niobrara, Goshen, Platte, Laramie, Albany, Carbon, Sweetwater): 307-634-1010 or toll-free 1-877-634-1005[3]
- Email: ember.lucas@wyo.gov (Riverton regional); nicholas.wiseman@wyo.gov (Southeast regional)[3]
- Mail/In-person: State - 2300 Capitol Ave, 4th floor, Cheyenne, WY 82002[2]; Riverton regional - 106 E. Adams Ave, Riverton, WY 82501[3]; Southeast regional - 3120 Old Faithful Road, Suite 200, Cheyenne, WY 82001[3]
- Website: https://health.wyo.gov/admin/long-term-care-ombudsman-program/[2][3]

**Timeline:** Not specified; program responds to complaints and inquiries as they arise[1][2][3]

**Watch out for:**
- Not a direct service/funding program but free advocacy to resolve issues; no financial aid or personal care services provided[1][2][3]
- Open to anyone (not just residents/families); includes providers, community groups seeking info/training[2][4]
- Volunteers also advocate after training; families can become volunteers[1][4]
- Covers home care/hospice in Wyoming per state law, unlike some states[6]
- Contact regional ombudsman for local issues, not just state office[3]

**Data shape:** no income/asset/age test; advocacy-only (not benefits/services); regionally coordinated via nonprofit contractor (WSCI); open to public inquiries; complaint-driven, no formal application

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/admin/long-term-care-ombudsman-program/[3]

---

### Wyoming Home Services Program (WyHS)


**Eligibility:**
- Age: 18+
- Income: No specific income or asset limits stated in program documents; financial eligibility not detailed as a barrier. General Medicaid long-term care references (not WyHS-specific) mention $2,982/month income and $2,000 assets for singles, but WyHS is state-funded and separate.[2]
- Assets: No asset limits or exemptions specified for WyHS; program focuses on functional needs rather than financial tests.[1][7]
- At risk of premature institutionalization, determined through ongoing evaluation.
- Needs in at least 2 areas on Activities of Daily Living (ADL) or Instrumental Activities of Daily Living (IADL) scales (e.g., eating, bathing, housework, shopping).
- Exceptions possible if services needed to prevent inappropriate institutional placement even without meeting the 2-area threshold.[1]

**Benefits:** Specific in-home services including: Personal care (assistance with eating, dressing, bathing, toileting, transferring, walking); Homemaker services (meal prep, shopping, money management, phone use, light housework); Chore services (heavy housework, yard work, sidewalk maintenance); Respite care (temporary relief for caregivers); Home modifications (minor adaptations to facilitate home living). Tailored to individual service plan; no fixed dollar amounts or hours stated.[1][6][7]
- Varies by: priority_tier

**How to apply:**
- Phone: Contact local county provider or Access Care Coordinator (e.g., Campbell County Senior Center In-Home Department).[5]
- In-person: Local senior centers or providers (one per county, e.g., Wyoming Senior Citizens Inc. for Albany/Fremont/Park Counties).[6]
- No statewide online or mail specified; apply via local Access Care Coordinator who conducts evaluation and creates service plan.

**Timeline:** Services begin after service plan finalized and scheduling; ongoing care coordination every 90 days. No fixed statewide timeline.[5]
**Waitlist:** Not mentioned; may vary by local provider capacity.

**Watch out for:**
- Not limited to seniors (starts at age 18, includes disabled adults); priority for those at risk of institutionalization.[1][8]
- No financial eligibility test mentioned—unlike Medicaid programs; people may overlook applying due to assuming income barriers.[1][2]
- Services exclude handling banking, medications, alcohol/tobacco purchases.[8]
- State-funded grant, not Medicaid; one provider per county means contacting local office is essential.[8]
- Tailored plans require ongoing evaluation every 90 days.[5]

**Data shape:** One provider per county with local administration; no income/asset tests, eligibility driven by functional needs and institutionalization risk; services customized per individual plan without fixed hours/dollars.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Wyoming Medicaid Long-Term Care | benefit | state | deep |
| Community Choices Waiver (CCW) | benefit | state | deep |
| PACE Wyoming | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP (Food Stamps) | benefit | federal | deep |
| Wyoming Energy Assistance (LIHEAP) | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Wyoming State Health Insurance Informati | resource | state | simple |
| Meals on Wheels (via Title III-C) | benefit | federal | deep |
| National Family Caregiver Support Progra | benefit | local | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Seniors (via Wyomin | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Wyoming Home Services Program (WyHS) | benefit | state | deep |

**Types:** {"benefit":10,"resource":3,"employment":1}
**Scopes:** {"state":5,"local":2,"federal":7}
**Complexity:** {"deep":10,"simple":3,"medium":1}

## Content Drafts

Generated 7 page drafts. Review in admin dashboard or `data/pipeline/WY/drafts.json`.

- **Wyoming Medicaid Long-Term Care** (benefit) — 4 content sections, 6 FAQs
- **Community Choices Waiver (CCW)** (benefit) — 3 content sections, 6 FAQs
- **PACE Wyoming** (benefit) — 2 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI) in Wyoming** (benefit) — 3 content sections, 6 FAQs
- **SNAP (Food Stamps)** (benefit) — 4 content sections, 6 FAQs
- **Wyoming Energy Assistance (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_type_and_individual_assessment**: 1 programs
- **priority_tier (waitlist based on eligibility date); service models (participant-directed vs agency-directed)[1][5]**: 1 programs
- **not_applicable**: 3 programs
- **priority_tier**: 5 programs
- **household_size**: 1 programs
- **household_size|income|fuel_type|priority_tier**: 1 programs
- **region**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Wyoming Medicaid Long-Term Care**: Wyoming Medicaid Long-Term Care is structured as three distinct programs (Nursing Home Medicaid, HCBS Waivers, ABD Medicaid) with different benefit delivery models. It is an income-cap state requiring Qualified Income Trusts for over-limit applicants. Medical need assessment is county-based. Benefits vary significantly by program type and individual evaluation. Critical application logistics (phone, URLs, forms, processing times, regional variations) are not detailed in available search results, requiring direct contact with Wyoming Department of Health for complete guidance.
- **Community Choices Waiver (CCW)**: Tied to Medicaid eligibility with NFLOC via LT-101 tool; county-specific case management providers; waitlisted with priority by eligibility date; two care models (participant/agency-directed)
- **PACE Wyoming**: Program closed in Wyoming since 2021; previously single-site (Cheyenne); no income test but ties to Medicaid institutional rules; not statewide, provider-restricted
- **Medicare Savings Programs (QMB, SLMB, QI) in Wyoming**: Wyoming Medicare Savings Programs operate as a three-tier system (QMB, SLMB, QI) with escalating income limits and decreasing benefit levels. Benefits scale by program tier rather than household size. Income limits include a $20 household disregard. Asset limits are uniform across the first three tiers but differ for QDWI (a fourth program for disabled working individuals). The QI Program operates on first-come, first-served basis with priority carryover, creating potential waitlist dynamics. Search results lack specific Wyoming contact information, application forms, processing timelines, and documentation requirements — these details must be obtained directly from the state Medicaid agency.
- **SNAP (Food Stamps)**: Elderly/disabled special rules: no gross income limit, higher asset limit ($4500), uncapped shelter deduction; income/asset tests vary by household composition; county-administered statewide; benefits scale by household size and net income after deductions.
- **Wyoming Energy Assistance (LIHEAP)**: Income at 60% state median (higher than federal 150% FPL in WY); priority tiers for elderly/disabled/young children/crisis; statewide but local agency delivery; heating-season only (Oct-April); varies by fuel type and crisis status.
- **Weatherization Assistance Program**: Tied to LIEAP eligibility (200% FPL); priority tiers for elderly/disabled/kids under 5; regional contractors handle delivery; no fixed dollar cap detailed recently, up to ~$4,000 historically; year-round apps but funding-constrained.
- **Wyoming State Health Insurance Information Program (WSHIIP)**: WSHIIP is a federally mandated, grant-funded counseling and advocacy program with no eligibility barriers (no income or asset tests). It is fundamentally different from insurance programs like CHIP or Medicaid — it provides information and guidance rather than direct coverage or financial benefits. The program's reach is distributed through a volunteer network rather than centralized offices, making it accessible across rural and urban Wyoming. The program is specifically designed to help beneficiaries navigate complex Medicare rules and avoid overpaying for coverage and prescriptions.
- **Meals on Wheels (via Title III-C)**: Administered statewide via local providers with regional variations in contributions, assessments, and delivery; no income/asset tests; eligibility prioritizes homebound/geographically isolated 60+ with narrow exceptions for under 60.
- **National Family Caregiver Support Program**: County-restricted availability (excluded in 7 counties); relative caregiver benefits only in 3 specific counties; no income or asset tests; services vary by local grantee providers; frailty required for core respite/supplemental benefits.
- **Senior Community Service Employment Program (SCSEP)**: This program's data structure is defined by severe geographic restriction (5 of 23 Wyoming counties only), strict income-based eligibility (125% federal poverty level), and fixed benefit structure (approximately 20 hours/week at minimum wage for 6–12 months). The program is not universally available in Wyoming, and families must first determine if they live in a served county before proceeding with eligibility assessment. Processing timelines and specific required documents are not publicly detailed in available sources, requiring direct contact with local offices.
- **Legal Assistance for Seniors (via Wyoming Legal Services)**: Eligibility via multiple providers (Legal Aid of Wyoming primary for free services, State Bar for modest means); no fixed income/asset tables published—case-by-case with federal poverty tie-in; priority-based case acceptance
- **Long-Term Care Ombudsman Program**: no income/asset/age test; advocacy-only (not benefits/services); regionally coordinated via nonprofit contractor (WSCI); open to public inquiries; complaint-driven, no formal application
- **Wyoming Home Services Program (WyHS)**: One provider per county with local administration; no income/asset tests, eligibility driven by functional needs and institutionalization risk; services customized per individual plan without fixed hours/dollars.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Wyoming?
