# Vermont Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 14 |
| New (not in our data) | 11 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 8 programs
- **unknown**: 1 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid for the Aged, Blind and Disabled (ABD)

- **income_limit**: Ours says `$1333` → Source says `$1,375` ([source](https://gmcboard.vermont.gov/ (Green Mountain Care; referenced via [3])))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Healthcare coverage and long-term care services/supports including nursing home care, home and community-based services (via Choices for Care), assistance with ADLs/IADLs. Specifics determined by functional assessment; no fixed dollar amounts or hours stated.[2][4]` ([source](https://gmcboard.vermont.gov/ (Green Mountain Care; referenced via [3])))
- **source_url**: Ours says `MISSING` → Source says `https://gmcboard.vermont.gov/ (Green Mountain Care; referenced via [3])`

### Fuel Assistance Program

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Yearly one-time payment to certified fuel suppliers or utilities to cover heating costs (fuels include oil, propane, kerosene, wood, pellets, electricity, natural gas, or rent including heat); exact amount varies by household income, size, fuel type/cost, and season—not specified as fixed dollar figure; up to 17% may apply to fuel balance with permission; funds usable only Nov 1-Apr 30 for fuel delivery, not repairs/services[2][3].` ([source](https://dcf.vermont.gov/benefits/fuel (inferred primary DCF site from context; sources reference DCF Energy Assistance Office)))
- **source_url**: Ours says `MISSING` → Source says `https://dcf.vermont.gov/benefits/fuel (inferred primary DCF site from context; sources reference DCF Energy Assistance Office)`

### Vermont Long-Term Care Ombudsman Project

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigation of complaints, resident advocacy, facility monitoring, education about resident rights, assistance with care decisions, help navigating Choices for Care` ([source](https://www.vtlawhelp.org/long-term-care-help and https://www.vtlegalaid.org/legal-projects/long-term-care-ombudsman))
- **source_url**: Ours says `MISSING` → Source says `https://www.vtlawhelp.org/long-term-care-help and https://www.vtlegalaid.org/legal-projects/long-term-care-ombudsman`

## New Programs (Not in Our Data)

- **Choices for Care (CFC) Waiver** — service ([source](Vermont Department of Aging and Independent Living (DAIL) and Department for Children and Families (DCF); specific URLs not provided in available sources))
  - Shape notes: CFC is a tiered program with three need-based groups (highest, high, moderate) with different service guarantees. Only the highest need group has entitlement; others depend on state resource availability. Income limits are tied to SSI levels (300%), which change annually but specific 2026 amounts are not available in sources. Asset limits vary by household composition and living situation ($2,000 standard, $10,000 for certain single homeowners). The program requires both financial and clinical eligibility determination through separate state agencies (DCF and DAIL). Specific service types, hours, and dollar amounts are not detailed in available sources.
- **PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); Vermont-specific via https://www.medicaidplanningassistance.org/medicaid-eligibility-vermont/ or state AHS site.))
  - Shape notes: No income/asset test for enrollment but required for free Medicaid-funded coverage; service-area restricted with limited centers; nursing home level of care certification by state; not statewide.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI)** — unknown ([source](https://vtlawhelp.org/medicare-savings-buy-programs (Vermont-specific guide); https://www.cms.gov/medicare/medicaid-coordination/about/qualified-medicare-beneficiary-program (federal CMS program information)))
  - Shape notes: This program consists of three tiered programs (QMB, SLMB, QI-1) based on income level. Benefits scale by program tier: QMB provides comprehensive coverage (premiums + cost-sharing), while SLMB and QI-1 cover Part B premiums only. Income limits are based on Federal Poverty Level and change annually. Vermont-specific application procedures, processing times, and office locations are not detailed in available search results; families must contact Vermont Department of Human Services for complete application information. Asset limits follow federal guidelines unless Vermont has waived them (not specified in search results).
- **3SquaresVT** — financial ([source](https://mybenefits.vermont.gov/))
  - Shape notes: Elderly/disabled special rules: no gross income test, conditional asset test, cash option for 65+ households, medical deductions boost benefits, simplified application
- **Weatherization Assistance Program** — service ([source](https://outside.vermont.gov/dept/DCF/Shared%20Documents/Benefits/Weatherization-Income-Guidelines.pdf))
  - Shape notes: Income limits county-specific table; free services via 5 regional agencies; WRAP financing utility-specific with repayment on bill, no credit check, moderate-income focus.
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.vermont4a.org/))
  - Shape notes: no income or asset test; counseling-only service delivered via statewide network with local affiliates; open to all Medicare beneficiaries and families
- **Meals on Wheels** — service ([source](https://www.agewellvt.org/services/food-meal-delivery/meals-on-wheels/))
  - Shape notes: Decentralized by local providers/regions with varying coverage, donation amounts, and contact points; no income/asset test; separate VCIL track for under 60 disabled with meal quantity tiers.
- **Caregiver Respite Support** — financial ([source](https://www.vermontfamilynetwork.org/wp-content/uploads/2022/11/Vermont-Respite-Support-Program-Flyer.pdf))
  - Shape notes: Targeted at families with children/youth (up to 19) with special needs or disabilities; no financial eligibility tests; voucher-based reimbursement model with flexible caregiver-determined hours/rates; excludes current recipients of other respite programs
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor)))
  - Shape notes: National program with state/regional administration. Income limits are tied to federal poverty guidelines (125% threshold) and updated annually. Benefits are fixed at minimum wage for 20 hours/week. Vermont-specific implementation details (providers, offices, processing times, regional variations) are not available in current search results and require direct contact with Vermont's SCSEP administrator.
- **Vermont Legal Aid Elder Law Project** — service ([source](https://www.vtlegalaid.org[6]))
  - Shape notes: No income/asset test for seniors 60+; priority-based case acceptance; statewide with regional offices but unified intake; distinct from income-tested general legal aid[1][2]
- **Vermont Senior Companion Program** — service ([source](No single primary .gov URL; program administered via https://vermontmaturity.com (state-affiliated) and 4 Area Agencies on Aging websites.))
  - Shape notes: Volunteer companion program (AmeriCorps Seniors), not direct aid to elderly; eligibility/income for volunteers only; statewide via 4 regional agencies; income at 200% poverty level (varies yearly, examples by household size provided); no client-side eligibility detailed.

## Program Details

### Choices for Care (CFC) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for seniors; 18+ for adults with physical disabilities[1]+
- Income: Up to 300% of Supplemental Security Income (SSI) payment level[3][5]. Individuals can spend-down to this limit to qualify[3]. In 2008, this was $1,911/month for a single individual[3], but current 2026 limits are not specified in available sources. Spouse's income is not counted toward applicant's limit[6]. Spouse can retain up to $2,644 (standard) or $3,948 (maximum) of applicant's income[6].
- Assets: Resource standard of $2,000 for most individuals[3]. However, for high and highest need medically needy individuals who are single, own, and reside in their own homes selecting home and community-based services, the resource standard is $10,000[5]. Exempt assets include: primary home (if applicant lives in it or has intent to return and home equity does not exceed $730,000 in 2025[1]), household furnishings and appliances, personal effects, and one vehicle[1]. Assets cannot be given away or sold below fair market value within 60 months prior to application; violation triggers Medicaid's Look-Back Rule and results in a Penalty Period of ineligibility[1].
- Must be a Vermont resident[1][2]
- Must meet clinical/functional eligibility criteria requiring Nursing Facility Level of Care (NFLOC)[1]
- Must require significant assistance with Activities of Daily Living (transferring, eating, toileting, bed mobility) or skilled nursing (wound care, tube feedings, dialysis)[1]
- Cognitive deficits and behaviors common in dementia are considered, but dementia diagnosis alone does not guarantee eligibility[1]
- In-person assessment by registered nurse required to determine NFLOC[1]

**Benefits:** Home and community-based services for eligible individuals; specific service types and hours not detailed in available sources. Program serves three need groups: 'highest need' (entitled to both nursing home and community services), 'high need' (nursing home and community services as state resources permit), and 'moderate need' (limited services for those not yet meeting nursing home functional requirements, as state resources permit)[3]
- Varies by: priority_tier

**How to apply:**
- Contact Department for Children and Families (DCF) for financial eligibility determination[3]
- Contact Department of Aging and Independent Living (DAIL) for functional eligibility assessment[3]
- Contact Economic Services Division (ESD) within Department of Vermont Health Access for financial need determination[4]

**Timeline:** Not specified in available sources
**Waitlist:** Only individuals in the 'highest need' group are guaranteed access; 'high need' and 'moderate need' groups receive services as state resources permit[3]. Admission teams use professional judgment, prioritizing individuals with most pressing unmet needs for ADL/IADL assistance and behavioral symptoms[2]

**Watch out for:**
- Only 'highest need' group has guaranteed access; other groups receive services only as state resources permit[3]
- Dementia diagnosis alone does not qualify someone; functional assessment is required[1]
- 60-month Look-Back Rule: any assets given away or sold below fair market value within 5 years before application triggers Medicaid ineligibility penalty[1]
- Home equity limit of $730,000 (2025) applies only if applicant lives in home or has intent to return[1]
- Spouse's income is not counted, but applicant's income must support spouse up to $2,644-$3,948/month[6]
- Program is subject to state resource caps and global spending limits; not all eligible applicants may be served immediately[3]
- In-person nursing assessment required; clinical eligibility is not automatic based on diagnosis[1]

**Data shape:** CFC is a tiered program with three need-based groups (highest, high, moderate) with different service guarantees. Only the highest need group has entitlement; others depend on state resource availability. Income limits are tied to SSI levels (300%), which change annually but specific 2026 amounts are not available in sources. Asset limits vary by household composition and living situation ($2,000 standard, $10,000 for certain single homeowners). The program requires both financial and clinical eligibility determination through separate state agencies (DCF and DAIL). Specific service types, hours, and dollar amounts are not detailed in available sources.

**Source:** Vermont Department of Aging and Independent Living (DAIL) and Department for Children and Families (DCF); specific URLs not provided in available sources

---

### Medicaid for the Aged, Blind and Disabled (ABD)


**Eligibility:**
- Age: 65+
- Income: In 2026, monthly income limit is $1,375 for individuals living outside Chittenden County and varies inside Chittenden County (e.g., $1,441 in 2025, adjusted annually). Limits apply to countable income of the financial responsibility group and are compared to maximums based on Medicaid group size. For singles, under $2,982/month for nursing home applicants. No full household size table available in sources; eligibility uses SSI-related criteria with financial group and Medicaid group definitions.[1][2][4][5][7]
- Assets: Countable assets must be $2,000 or less for a single applicant. Resources are evaluated per financial responsibility group (M230-M239). Exemptions not detailed in sources, but standard Medicaid rules apply (e.g., primary home often exempt). Higher limits like $3,000 for certain ADL help categories outside Chittenden County.[2][4][5]
- Blind or disabled (as defined in M211); disability determination required unless continuous eligibility since 1973.[1]
- Meet nonfinancial Medicaid participation requirements (M100-M199).[1]
- For long-term care: Assessment of Activities of Daily Living (ADLs) and Instrumental ADLs (IADLs); Nursing Home Level of Care (NHLOC) for institutional/waiver programs.[2][4]
- Vermont resident.[2]

**Benefits:** Healthcare coverage and long-term care services/supports including nursing home care, home and community-based services (via Choices for Care), assistance with ADLs/IADLs. Specifics determined by functional assessment; no fixed dollar amounts or hours stated.[2][4]
- Varies by: priority_tier

**How to apply:**
- Online via Vermont Health Connect / Green Mountain Care (apply for Green Mountain Care).[3]
- Download form 205ALLMED from state webpage.[2]
- Phone, mail, or in-person not specified with exact numbers/addresses in sources; contact Green Mountain Care for details.

**Timeline:** Not specified in sources.

**Watch out for:**
- Not the same as general Green Mountain Care or Regular Medicaid; specific to aged/blind/disabled with SSI-related financial tests.[1][2]
- Chittenden County has different income limits—many miss this regional variation.[4][5][7]
- Functional assessment required for long-term care benefits, not just financial eligibility.[2][4]
- Must apply specifically for MABD or via Choices for Care for long-term services; denial if not financially eligible.[2]
- Blind/disabled children under 18 (or 22 if students) may qualify separately.[1]

**Data shape:** Income/asset limits vary by Chittenden County; SSI-related financial group vs. Medicaid group; functional ADL/IADL assessment for benefits; tied to long-term care programs like Choices for Care.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://gmcboard.vermont.gov/ (Green Mountain Care; referenced via [3])

---

### PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits or financial criteria for PACE enrollment. Approximately 90% of participants are dually eligible for Medicare and Medicaid, but enrollment is possible without Medicare or Medicaid. For free participation (no premiums), dual eligibility typically requires meeting Vermont Medicaid long-term care criteria: for a single applicant in 2026, income under $2,982/month and assets under $2,000 (excluding primary home and one vehicle). Limits vary by marital status and household; consult Vermont Medicaid for full table.[1][2][5][7]
- Assets: No asset limits for PACE enrollment itself. For Medicaid-funded (free) participation, Vermont long-term care Medicaid excludes primary home and one vehicle; countable assets under $2,000 for singles. Spousal protections apply; full exemptions detailed in state Medicaid rules.[1][5]
- Live in the service area of a Vermont PACE organization.
- Certified by Vermont as needing nursing home level of care.
- Able to live safely in the community with PACE services.
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice.

**Benefits:** All-inclusive care including primary care, hospital and emergency care, prescription drugs, social services, restorative therapies, home care, day center care (medical and social), transportation to PACE center, personal care, homemaker services, meals (home-delivered and center-based), and all Medicare/Medicaid-covered services. PACE becomes sole source for dually eligible enrollees. No specific dollar amounts or hours stated; comprehensive and individualized based on needs.[1][2]
- Varies by: region

**How to apply:**
- Contact local Vermont PACE provider (no statewide phone listed; use Medicare’s Find a PACE Plan tool or National PACE Association locator).
- In-person at PACE center.
- Phone or visit specific provider website (Vermont-specific providers not detailed in results).

**Timeline:** Not specified in sources.
**Waitlist:** Possible waitlists due to capped federal/state funding; varies by program and state.[6]

**Watch out for:**
- Availability limited to specific service areas near PACE centers; not statewide in Vermont.
- Must live safely in community at enrollment; not for those already in nursing homes.
- Cannot be in Medicare Advantage, hospice, or certain other plans.
- Waitlists common due to funding caps.
- Private pay option exists ($7,000+/month) if not Medicaid-eligible, but most use Medicare/Medicaid.
- Note: Search results mix healthcare PACE with unrelated Vermont energy financing PACE [4]; focus on healthcare program.

**Data shape:** No income/asset test for enrollment but required for free Medicaid-funded coverage; service-area restricted with limited centers; nursing home level of care certification by state; not statewide.

**Source:** https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); Vermont-specific via https://www.medicaidplanningassistance.org/medicaid-eligibility-vermont/ or state AHS site.

---

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"note":"Vermont uses 2025 limits; 2026 limits not yet published in search results","QMB":{"individual_monthly":"$1,305","couple_monthly":"$1,763","basis":"100% of Federal Poverty Level (FPL)"},"SLMB":{"individual_monthly":"$1,565","couple_monthly":"$2,115","basis":"120% of FPL"},"QI":{"individual_monthly":"Up to $1,781","couple_monthly":"Up to $2,400","basis":"130% of FPL"},"income_calculation_rules":"If earned income: subtract $65, then divide by 2. If unearned income (Social Security, unemployment): subtract $20. First $20 of any monthly income is disregarded. SNAP benefits are not counted."}
- Assets: {"note":"Vermont-specific limits not provided in search results; federal guidelines apply unless Vermont has waived them","federal_standard":{"individual":"$9,660 (2025)","couple":"$14,130 (2025)"},"what_counts":"Checking/savings accounts, stocks, bonds, retirement accounts","what_is_exempt":"Primary residence, one vehicle, burial plots, up to $1,500 in burial expenses"}
- Must be enrolled in Medicare Part A (Hospital Insurance) at minimum
- Must be a Vermont resident
- When you apply, Vermont will determine which program (QMB, SLMB, or QI-1) you qualify for based on income level

**Benefits:** N/A
- Varies by: program_tier (QMB provides most comprehensive coverage; SLMB and QI-1 cover Part B premiums only)

**How to apply:**
- Contact Vermont Department of Human Services (specific phone number and online portal URL not provided in search results)
- Mail application to Vermont state Medicaid office (specific address not provided in search results)
- In-person at local Vermont Department of Human Services office (specific locations not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Income limits change annually (new limits released each January); 2026 limits not yet published as of April 2026
- Even if your income appears to exceed the limit, you should apply — certain income and assets may not be counted toward limits, and you may still qualify for one of the three programs
- QMB, SLMB, and QI-1 are tiered programs: if you don't qualify for QMB, Vermont will check if you qualify for SLMB; if not, then QI-1. You cannot choose which program to apply for; eligibility determines placement
- SLMB and QI-1 cover Part B premiums only — they do NOT cover deductibles, coinsurance, or copayments. Only QMB covers those costs
- Federal law prohibits providers from billing QMB enrollees for cost-sharing, but a 2015 CMS study found that wrongful billing and confusion around billing rules continues; families should be prepared to advocate if billed incorrectly
- Qualifying for QI automatically qualifies you for Extra Help prescription drug program — mention this benefit when applying
- Income calculation rules are complex: earned income is treated differently from unearned income (Social Security, unemployment). Verify calculations with Vermont Department of Human Services
- Search results do not provide Vermont-specific phone numbers, website URLs, or office locations; families must contact Vermont Department of Human Services directly for application details

**Data shape:** This program consists of three tiered programs (QMB, SLMB, QI-1) based on income level. Benefits scale by program tier: QMB provides comprehensive coverage (premiums + cost-sharing), while SLMB and QI-1 cover Part B premiums only. Income limits are based on Federal Poverty Level and change annually. Vermont-specific application procedures, processing times, and office locations are not detailed in available search results; families must contact Vermont Department of Human Services for complete application information. Asset limits follow federal guidelines unless Vermont has waived them (not specified in search results).

**Source:** https://vtlawhelp.org/medicare-savings-buy-programs (Vermont-specific guide); https://www.cms.gov/medicare/medicaid-coordination/about/qualified-medicare-beneficiary-program (federal CMS program information)

---

### 3SquaresVT

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Households with anyone age 60+ or disabled do not need to meet the gross income limit (185% FPL). Net income must be at or below 185% FPL based on household size (specific dollar table not in sources; refer to official guidelines). If gross income exceeds 185% FPL, resource test applies. Categorical eligibility if receiving SSI, Reach Up (TANF), or EITC.
- Assets: No asset limits if income ≤185% FPL or for most households. If income >185% FPL for elderly/disabled households: $4,500 limit (sources vary: $4,500[1], $4,250[6], $3,500[3]). Counts: savings, checking, investments. Exempt: primary home, primary vehicle, retirement/educational savings accounts (e.g., 401k, IRA).
- U.S. citizen or qualified non-citizen (5-year residency or work history/ humanitarian status)
- Work requirements may apply (exempt for 60+, disabled, caregivers; Time-Limited Benefit Requirement for 18-64 unless exempt[2])
- Vermont resident

**Benefits:** Monthly benefits loaded on EBT card for food purchases. Average $180/month for older Vermonter living alone[4]. Higher if medical expenses (OTC meds, premiums, supplies, dentures, prescriptions, home health aid)[1]. Cash deposit to bank account or cash on EBT if all household 65+[1].
- Varies by: household_size

**How to apply:**
- Online: myBenefits portal (https://mybenefits.vermont.gov/)[4]
- Phone: Helpline 1-800-642-5119[4]
- Mail/print simplified form for 60+ or disabled without earned income, return to district office[4]
- In-person: District offices or Age Well assistance

**Timeline:** Not specified in sources

**Watch out for:**
- Asset test only triggers if income >185% FPL for elderly/disabled (missed by many)[1][6]
- Cash benefits only if all household 65+[1]
- Work requirements expanded in 2025 to age 64 (exemptions available via 210A form)[2]
- Medical expenses can increase benefits[1]
- Certification up to 3 years for 65+/disabled[1]
- No resource limit for most, even with savings/home/car[1][5]

**Data shape:** Elderly/disabled special rules: no gross income test, conditional asset test, cash option for 65+ households, medical deductions boost benefits, simplified application

**Source:** https://mybenefits.vermont.gov/

---

### Fuel Assistance Program


**Eligibility:**
- Income: Gross household income at or below 185% of the federal poverty level (FPL) based on household size for standard Seasonal Fuel Assistance; 200% of FPL for Crisis Fuel Assistance. Exact dollar amounts vary annually with FPL updates and are not specified in sources for current year—families must check with DCF for table by household size[1][2][3].
- Assets: No asset limits mentioned in sources.
- Household must be responsible for heating costs (direct fuel, utilities, or included in rent)[3]
- For Crisis Fuel: Household almost or completely out of fuel[1]
- Primary residence in Vermont

**Benefits:** Yearly one-time payment to certified fuel suppliers or utilities to cover heating costs (fuels include oil, propane, kerosene, wood, pellets, electricity, natural gas, or rent including heat); exact amount varies by household income, size, fuel type/cost, and season—not specified as fixed dollar figure; up to 17% may apply to fuel balance with permission; funds usable only Nov 1-Apr 30 for fuel delivery, not repairs/services[2][3].
- Varies by: household_size

**How to apply:**
- Phone: Vermont Benefits Call Center at 1-800-479-6151[2]
- Online: MyBenefits portal (main fuel assistance page, longer form for food+fuel) or short Fuel Assistance application[1][3][5]
- In-person: Local Community Action Agency (call first, required for Crisis) or DCF district office[1]
- Mail: Economic Services Division, Application & Document Processing Center, 280 State Drive, Waterbury, VT 05671-1500[1]

**Timeline:** Not specified in sources.

**Watch out for:**
- Apply before end of November for largest benefit[3]
- Fuel suppliers must be Vermont-certified to receive funds[2]
- Crisis requires in-person at Community Action (phone if elderly/disabled)[1]
- 15-cent discount rules apply to deliveries; no funds for repairs/services/special charges[2]
- Separate from utility discounts (e.g., VGS 20% off gas at 185% FPL)—can stack[1][4]
- Tank inspection required for first fills, even in winter[2]

**Data shape:** Income at 185% FPL (200% for Crisis); one-time seasonal payment scaled by household size, fuel costs, and timing; local agency delivery with certified vendors only; no asset test

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dcf.vermont.gov/benefits/fuel (inferred primary DCF site from context; sources reference DCF Energy Assistance Office)

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Varies by county and household size (1-8 persons) based on prior 12 months gross income, effective July 1, 2025–June 30, 2026. Addison County: 1=$65,030, 2=$74,320, 3=$83,610, 4=$92,900, 5=$100,332, 6=$107,764, 7=$115,196, 8=$122,628. Chittenden/Franklin/Grand Isle: 1=$72,695, 2=$83,080, 3=$93,465, 4=$103,850, 5=$112,158, 6=$120,466, 7=$128,774, 8=$137,082. Rest of State: 1=$62,580, 2=$71,520, 3=$80,460, 4=$89,400, 5=$96,552, 6=$103,704, 7=$110,856, 8=$118,008. WRAP targets moderate-income <120% area median income with 12 months on-time utility payments.[2][4]
- Assets: No asset limits mentioned; WRAP underwriting based on utility payment history, not credit score or assets.[1][5]
- Household must be low- to moderate-income.
- For WRAP: Electric/gas account with participating utility (e.g., Green Mountain Power, Vermont Gas, Burlington Electric, Vermont Electric Coop), 12 months on-time payments, upgrades must yield ≥10% net energy savings.[1][5]

**Benefits:** Free home insulation and air sealing via community action agencies (BROC, Capstone, CVOEO, NETO, SEVCA). WRAP finances up to 75% of costs (capped $20,000/project, avg $7,000 financed) for insulation/air sealing, heat pumps, electric water heaters, advanced wood heating; repaid via utility bill tariff (e.g., 2% interest up to 15 years, or 60 months for VGS); avg $60/month savings vs $52 payment; combines with rebates/incentives up to $1,500 VHFA + $6,000 WRAP.[1][3][4]
- Varies by: priority_tier|region

**How to apply:**
- Contact community action agencies for free weatherization (BROC, Capstone, CVOEO, NETO, SEVCA). For WRAP: Schedule home energy evaluation via Efficiency Vermont, Vermont Gas Systems, or Burlington Electric Department; Vermont Gas: vgsvt.com/weatherization-repayment-assistance-program; Efficiency Vermont: efficiencyvermont.com.[3][4][5]

**Timeline:** Not specified.

**Watch out for:**
- Two main tracks: Free service via community agencies (strict low-income) vs WRAP financing (moderate-income, utility-tied repayment stays with meter even if renter moves/sells). WRAP requires ≥10% savings projection and good utility history, not credit. Not all utilities participate. Renters eligible but benefits meter-tied.[1][3][4][5]

**Data shape:** Income limits county-specific table; free services via 5 regional agencies; WRAP financing utility-specific with repayment on bill, no credit check, moderate-income focus.

**Source:** https://outside.vermont.gov/dept/DCF/Shared%20Documents/Benefits/Weatherization-Income-Guidelines.pdf

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries regardless of income[4][5]
- Assets: No asset limits; no asset test applies[4]
- Must be a Medicare beneficiary (includes individuals 65+, younger adults with disabilities, those with End-Stage Renal Disease (ESRD))[5]
- Caregivers and families of Medicare beneficiaries are also eligible[4]

**Benefits:** Free, personalized one-on-one health insurance counseling and education on Medicare benefits, coverage decisions, Medicare Advantage plans, Part D prescription drugs, Medigap, Medicaid eligibility, long-term care insurance, appeals/denials, and other health insurance issues; also includes group education presentations and outreach[1][4][6]

**How to apply:**
- Phone: Toll-free 1-800-642-5119 (in-state), (802) 225-6210 (out-of-state), Local (802) 865-0360[1][2][3]
- Website: http://www.vermont4a.org/[1]
- Email: Donna@vermont4a.org or info@nekcouncil.org (for NEK region)[1][3]
- In-person: Through local providers like Vermont Association of Area Agencies on Aging (476 Main Street, Suite #3, Winooski VT 05404) or NEK Council on Aging[1][3]

**Timeline:** Immediate counseling available via phone or appointment; no formal application processing[1][4]

**Watch out for:**
- Not a healthcare or financial benefit program—provides only free counseling, not direct payments or medical services[4][6]
- People often confuse it with Medicare Savings Programs; SHIP helps apply for those but is not one itself[6]
- Services are free with no income test, but targeted outreach prioritizes underserved populations[4]
- Relies on trained staff/volunteers; availability may depend on local affiliate capacity[4]

**Data shape:** no income or asset test; counseling-only service delivered via statewide network with local affiliates; open to all Medicare beneficiaries and families

**Source:** https://www.vermont4a.org/

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or asset limits; program is available regardless of income[2][3].
- Assets: No asset limits; no assets counted or exempted as none apply[2][3].
- Unable to obtain or prepare meals on a temporary or permanent basis due to physical, mental, or cognitive condition that requires assistance to leave home[2][3][7].
- Spouse of eligible participant, regardless of age[1][2][3].
- Under 60 with disability residing with or in care of eligible senior, or in senior housing with congregate meals, or referred by Vermont Center for Independent Living (VCIL)[1][2][3][5].
- Volunteers performing essential duties[1].

**Benefits:** Nutritious hot meals delivered Monday-Friday (protein, vegetables, milk, juice, bread, fruit); frozen meals for weekends/holidays; meets 1/3 Daily Recommended Intake (DRI) per Older Americans Act; suggested donation $5-$6 per meal, no one turned away for inability to pay[2][3].
- Varies by: region

**How to apply:**
- Contact local provider: Age Well (Addison, Franklin, Grand Isle, Chittenden counties) via https://www.agewellvt.org/services/food-meal-delivery/meals-on-wheels/[2].
- Bugbee Senior Center (Hartford, North Hartland, Norwich, Thetford) via https://www.bugbeecenter.org/services/meals-on-wheels/[3].
- VCIL for under 60 with disabilities: 802-224-1825 or melissa@vcil.org or https://www.vcil.org/services/meals-on-wheels/[5].
- Phone or in-person at local senior centers; assessment may be required[4].

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by provider demand.

**Watch out for:**
- Not statewide single program; must contact specific regional provider[2][3].
- Suggested donation expected but voluntary; encourage private contribution[1][2][3].
- For under 60, separate VCIL program with tiers (emergency up to 60 meals, short-term 90/year, long-term 5/week)[5].
- Requires inability to prepare/obtain meals due to condition; not just age[2][3].
- Volunteers needed daily; program relies on them[2].

**Data shape:** Decentralized by local providers/regions with varying coverage, donation amounts, and contact points; no income/asset test; separate VCIL track for under 60 disabled with meal quantity tiers.

**Source:** https://www.agewellvt.org/services/food-meal-delivery/meals-on-wheels/

---

### Caregiver Respite Support

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits specified in program details.
- Assets: No asset limits specified; no information on what counts or is exempt.
- Vermont resident
- Parent/caregiver with a child up to age 19 with chronic physical, medical, mental, or developmental condition
- Experiencing special needs destabilizing the family (e.g., homelessness, economic hardships, DCF Family Services involvement)
- Suspected diagnosis while waiting for evaluation
- Require health and related services beyond typical for children/youth
- Parent/caregiver with a disability who has a child up to age 19 living at home
- Relative caregiver with child(ren) up to age 19 living with them
- Parent/caregiver of adopted child(ren)
- Must not currently receive other respite funding (e.g., Agency Directed Respite, Family Managed Respite, Flexible Family Funding, VFN’s Family Support Funding)

**Benefits:** Reimbursement for respite care via vouchers submitted with provider signature; rate of pay and number of hours determined by the caregiver; W9 required for reimbursements over $600; reimbursement within two weeks of voucher receipt. Respite providers must be at least 20 years old, not a parent or direct caregiver, and relatives are allowed if not residing in the home.

**How to apply:**
- Phone application followed by submission of respite plan (contact Vermont Family Network)
- Submit voucher with respite provider signature for reimbursement

**Timeline:** Reimbursement within two weeks of receiving voucher; initial approval timeline not specified.

**Watch out for:**
- Exclusively for caregivers of children/youth up to age 19, not elderly adults
- Ineligible if already receiving any other respite funding sources
- Respite providers cannot be parents, direct caregivers, or live-in relatives
- Program administered by Vermont Family Network, distinct from Medicaid Choices for Care or other state programs for seniors

**Data shape:** Targeted at families with children/youth (up to 19) with special needs or disabilities; no financial eligibility tests; voucher-based reimbursement model with flexible caregiver-determined hours/rates; excludes current recipients of other respite programs

**Source:** https://www.vermontfamilynetwork.org/wp-content/uploads/2022/11/Vermont-Respite-Support-Program-Flyer.pdf

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level[2][3][4]. The specific dollar amounts vary by household size and are updated annually; as of January 15, 2025, new HHS Poverty Guidelines are in effect[2]. Contact a local SCSEP office to determine your household's specific threshold.
- Assets: Not specified in available program documentation
- Must be unemployed[2][3][4]
- Enrollment priority given to: veterans and qualified spouses, individuals over 65, those with disabilities, low literacy skills, limited English proficiency, rural residents, homeless or at-risk individuals, those with low employment prospects, or those who have exhausted American Job Center services[2]

**Benefits:** Part-time paid training at minimum wage (highest of federal, state, or local rate), paid bi-weekly[1][2][3]. Average 20 hours per week[1][2][3]. Training typically lasts about 6 months before placement into permanent employment[3].
- Varies by: fixed

**How to apply:**
- Phone: 1-877-US2-JOBS (1-877-872-5627) — toll-free help line[2]
- Online: Use CareerOneStop's Older Worker Program Finder[2]
- In-person: Contact local SCSEP office (specific Vermont locations not provided in search results)
- American Job Centers also provide access to employment assistance[2]

**Timeline:** Not specified in available documentation
**Waitlist:** Not specified in available documentation

**Watch out for:**
- This is a training program, not permanent employment[1][4]. Positions are temporary and transitional[1].
- SCSEP participants are NOT eligible for unemployment benefits or retirement benefits based on training wages earned[4]. Participants should contact their state Unemployment office to understand how SCSEP wages may affect existing Unemployment Insurance benefits[4].
- No benefits typically associated with employment are provided: no bonuses, pension benefits, annual leave, accumulated sick leave, or retirement contributions[4].
- The program is experiencing 'a period of transition due to changes and delays in federal funding,' though it remains available in many communities[3].
- There is no cost to host organizations, but participants work at non-profits or public agencies, not private employers[1].

**Data shape:** National program with state/regional administration. Income limits are tied to federal poverty guidelines (125% threshold) and updated annually. Benefits are fixed at minimum wage for 20 hours/week. Vermont-specific implementation details (providers, offices, processing times, regional variations) are not available in current search results and require direct contact with Vermont's SCSEP administrator.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor)

---

### Vermont Legal Aid Elder Law Project

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income restrictions; eligibility not restricted by income level, though general Vermont Legal Aid programs (which may overlap) use 200% of federal poverty level (e.g., $48,600 for family of 4 as of 2019 data)[1][2]
- Assets: No asset limits mentioned; not applicable based on available information[1][2]
- Vermont resident
- Civil legal problems relevant to seniors (priority on housing, financial exploitation, Social Security, Medicaid, guardianship)
- Case priority given to those at risk[1][2]

**Benefits:** Full range of civil legal services including direct representation, legal advice, Medicare appeals; priority areas: housing, financial exploitation, Social Security, Medicaid, guardianship[1][2]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-889-2047[1][2][3][4]
- Online: VTLawHelp.org Legal Help Tool (select Seniors category for elder law specialist), Legal Help Request Form[3][4][7]
- In-person: Six regional offices across Vermont (contact central intake for locations)[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Not restricted by income/assets unlike general VLA (200% FPL) or other projects; focuses on civil matters only (no criminal, traffic); priority on specific senior issues—may not take all cases; separate from Medicare Advocacy Project but includes Medicare appeals[1][2][4]
- Must specify elder law/seniors in intake for specialist routing[7]
- Overlaps with Disability Law Project if disability-related[1]

**Data shape:** No income/asset test for seniors 60+; priority-based case acceptance; statewide with regional offices but unified intake; distinct from income-tested general legal aid[1][2]

**Source:** https://www.vtlegalaid.org[6]

---

### Vermont Long-Term Care Ombudsman Project


**Eligibility:**
- Must be receiving long-term care services to access ombudsman assistance
- No financial eligibility test — service is free to all Vermonters

**Benefits:** Investigation of complaints, resident advocacy, facility monitoring, education about resident rights, assistance with care decisions, help navigating Choices for Care
- Varies by: not_applicable — service is uniform statewide

**How to apply:**
- Phone: 1-800-889-2047, ext. 3 (toll-free)
- Local: (802) 863-5620
- Online form at https://www.vtlawhelp.org/long-term-care-help
- Fax: (802) 863-7152

**Timeline:** Best effort to respond within three business days

**Watch out for:**
- This is NOT an eligibility program — families cannot 'apply' for their elderly relative to receive benefits. Instead, they contact the ombudsman when problems arise with existing long-term care.
- The ombudsman advocates FOR residents; it does not provide direct care, medical services, or financial assistance.
- The service is free, but only available to people already in long-term care facilities or Choices for Care community programs.
- Volunteer recruitment is currently limited to Washington and Bennington counties, but the ombudsman service itself covers all of Vermont.
- Response time is 'best effort' within three business days — not guaranteed.
- The ombudsman works under supervision of paid staff and has specific authority limited to long-term care advocacy.

**Data shape:** This program is fundamentally different from typical benefits programs — it is a complaint resolution and advocacy service with no eligibility barriers (other than already receiving long-term care). There are no income limits, asset limits, or age requirements because the service is not means-tested. The 'application' is actually a complaint intake process. Families should contact this service when they have concerns about a loved one's care, not to determine if their relative 'qualifies' for the program itself.

**Our model can't capture:**
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.vtlawhelp.org/long-term-care-help and https://www.vtlegalaid.org/legal-projects/long-term-care-ombudsman

---

### Vermont Senior Companion Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Based on 200% of federal poverty guidelines. Examples: $31,300 or less for a single person, $42,300 or less for a couple (202? guidelines from [1]); $27,180 (1), $36,620 (2), $46,060 (3), $55,500 (4) for 2022 [2]; $30,120 (single), $40,880 (couple), $51,640 (family of 3), $62,400 (family of 4) from another source [4]. Exact current amounts vary by year; contact agency for 2026 guidelines.
- Assets: No asset limits mentioned in sources.
- Able to serve at least 10 hours per week (up to 40 hours)
- Resident of Vermont

**Benefits:** Non-financial companionship and assistance services to elderly clients, provided by eligible Senior Companions (age 55+ low-income volunteers). Services include: friendly visits, listening, errands, rides, help with shopping or paying bills, promoting independence at home, respite for family caregivers. Companions receive: $4.00/hour non-taxable stipend (does not affect benefits like 3SquaresVT or subsidized housing), $0.70/mile mileage reimbursement, flexible schedule (10-40 hours/week), monthly gatherings, ongoing training (4 hours/month average), support.
- Varies by: fixed

**How to apply:**
- Contact Vermont’s Area Agencies on Aging: Age Well (www.agewellvt.org), Northeast Kingdom Council on Aging (www.nekcouncil.org), Senior Solutions (www.seniorsolutionsvt.org), Southwestern Vermont Council on Aging (www.svcoa.org)
- Call Helpline: 1-800-642-5119

**Timeline:** Not specified in sources.

**Watch out for:**
- This is a **volunteer program** for low-income seniors (55+) to provide companionship services to other elderly; families do not 'apply' to receive services directly—instead, request companions through agencies. Not a direct benefit for the elderly loved one.
- Income eligibility for companions only; clients (elderly receiving help) have no stated eligibility requirements in sources.
- Income guidelines outdated in sources (2022 or earlier); verify current federal poverty levels x200% with agency.
- Stipend is non-taxable and does not affect recipient's benefits, but for companions only.
- No info on processing times, waitlists, or client application process.

**Data shape:** Volunteer companion program (AmeriCorps Seniors), not direct aid to elderly; eligibility/income for volunteers only; statewide via 4 regional agencies; income at 200% poverty level (varies yearly, examples by household size provided); no client-side eligibility detailed.

**Source:** No single primary .gov URL; program administered via https://vermontmaturity.com (state-affiliated) and 4 Area Agencies on Aging websites.

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Choices for Care (CFC) Waiver | benefit | state | deep |
| Medicaid for the Aged, Blind and Disable | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Qualified Medicare Beneficiary (QMB), Sp | benefit | federal | deep |
| 3SquaresVT | benefit | state | medium |
| Fuel Assistance Program | benefit | state | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels | benefit | federal | medium |
| Caregiver Respite Support | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Vermont Legal Aid Elder Law Project | resource | state | simple |
| Vermont Long-Term Care Ombudsman Project | resource | federal | simple |
| Vermont Senior Companion Program | benefit | state | medium |

**Types:** {"benefit":10,"resource":3,"employment":1}
**Scopes:** {"state":7,"local":1,"federal":6}
**Complexity:** {"deep":7,"medium":4,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/VT/drafts.json`.

- **Choices for Care (CFC) Waiver** (benefit) — 5 content sections, 6 FAQs
- **Medicaid for the Aged, Blind and Disabled (ABD)** (benefit) — 3 content sections, 6 FAQs
- **PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **region**: 2 programs
- **program_tier (QMB provides most comprehensive coverage; SLMB and QI-1 cover Part B premiums only)**: 1 programs
- **household_size**: 2 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **fixed**: 2 programs
- **not_applicable — service is uniform statewide**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Choices for Care (CFC) Waiver**: CFC is a tiered program with three need-based groups (highest, high, moderate) with different service guarantees. Only the highest need group has entitlement; others depend on state resource availability. Income limits are tied to SSI levels (300%), which change annually but specific 2026 amounts are not available in sources. Asset limits vary by household composition and living situation ($2,000 standard, $10,000 for certain single homeowners). The program requires both financial and clinical eligibility determination through separate state agencies (DCF and DAIL). Specific service types, hours, and dollar amounts are not detailed in available sources.
- **Medicaid for the Aged, Blind and Disabled (ABD)**: Income/asset limits vary by Chittenden County; SSI-related financial group vs. Medicaid group; functional ADL/IADL assessment for benefits; tied to long-term care programs like Choices for Care.
- **PACE (Program of All-Inclusive Care for the Elderly)**: No income/asset test for enrollment but required for free Medicaid-funded coverage; service-area restricted with limited centers; nursing home level of care certification by state; not statewide.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI)**: This program consists of three tiered programs (QMB, SLMB, QI-1) based on income level. Benefits scale by program tier: QMB provides comprehensive coverage (premiums + cost-sharing), while SLMB and QI-1 cover Part B premiums only. Income limits are based on Federal Poverty Level and change annually. Vermont-specific application procedures, processing times, and office locations are not detailed in available search results; families must contact Vermont Department of Human Services for complete application information. Asset limits follow federal guidelines unless Vermont has waived them (not specified in search results).
- **3SquaresVT**: Elderly/disabled special rules: no gross income test, conditional asset test, cash option for 65+ households, medical deductions boost benefits, simplified application
- **Fuel Assistance Program**: Income at 185% FPL (200% for Crisis); one-time seasonal payment scaled by household size, fuel costs, and timing; local agency delivery with certified vendors only; no asset test
- **Weatherization Assistance Program**: Income limits county-specific table; free services via 5 regional agencies; WRAP financing utility-specific with repayment on bill, no credit check, moderate-income focus.
- **State Health Insurance Assistance Program (SHIP)**: no income or asset test; counseling-only service delivered via statewide network with local affiliates; open to all Medicare beneficiaries and families
- **Meals on Wheels**: Decentralized by local providers/regions with varying coverage, donation amounts, and contact points; no income/asset test; separate VCIL track for under 60 disabled with meal quantity tiers.
- **Caregiver Respite Support**: Targeted at families with children/youth (up to 19) with special needs or disabilities; no financial eligibility tests; voucher-based reimbursement model with flexible caregiver-determined hours/rates; excludes current recipients of other respite programs
- **Senior Community Service Employment Program (SCSEP)**: National program with state/regional administration. Income limits are tied to federal poverty guidelines (125% threshold) and updated annually. Benefits are fixed at minimum wage for 20 hours/week. Vermont-specific implementation details (providers, offices, processing times, regional variations) are not available in current search results and require direct contact with Vermont's SCSEP administrator.
- **Vermont Legal Aid Elder Law Project**: No income/asset test for seniors 60+; priority-based case acceptance; statewide with regional offices but unified intake; distinct from income-tested general legal aid[1][2]
- **Vermont Long-Term Care Ombudsman Project**: This program is fundamentally different from typical benefits programs — it is a complaint resolution and advocacy service with no eligibility barriers (other than already receiving long-term care). There are no income limits, asset limits, or age requirements because the service is not means-tested. The 'application' is actually a complaint intake process. Families should contact this service when they have concerns about a loved one's care, not to determine if their relative 'qualifies' for the program itself.
- **Vermont Senior Companion Program**: Volunteer companion program (AmeriCorps Seniors), not direct aid to elderly; eligibility/income for volunteers only; statewide via 4 regional agencies; income at 200% poverty level (varies yearly, examples by household size provided); no client-side eligibility detailed.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Vermont?
