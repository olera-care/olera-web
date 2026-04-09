# New Hampshire Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.040 (8 calls, 30s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 6 |
| Programs deep-dived | 5 |
| New (not in our data) | 5 |
| Data discrepancies | 0 |
| Fields our model can't capture | 0 |

## Program Types

- **service**: 3 programs
- **financial**: 2 programs

## New Programs (Not in Our Data)

- **NH Medication Bridge Program** — service ([source](No single active .gov URL; program facilitated statewide via health centers. Historical info at https://healthynh.org/initiatives/access-to-care/medication-bridge/ (noted as no longer managed centrally as of 2021).[6]))
  - Shape notes: Decentralized service via local health centers, not a uniform state program; eligibility and income tied to individual pharma companies; no fixed age/income table, varies by med and provider.
- **New Hampshire Partnership for Prescription** — financial ([source](https://nhrxcard.com/about))
  - Shape notes: no income test, no age requirement, no application or enrollment, instant access via free discount card, pharmacy-specific pricing
- **NH Medicaid Waiver Programs (Multiple Programs)** — service ([source](https://www.dhhs.nh.gov/programs-services))
  - Shape notes: New Hampshire's 'Medicaid Waiver' is not a single program but a portfolio of four distinct 1915(c) waivers (CFI, DD, ABD, IHS) with different age ranges, functional requirements, service arrays, and spot limitations. Eligibility criteria, income limits, and benefits vary significantly by waiver type. The search results do not provide complete information on processing times, specific application forms, required documents, or detailed regional variations in wait times. Families must first determine which waiver program applies to their situation before applying.
- **REAP (Respite, Education, and Assistance Program)** — financial ([source](https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-guaranteed-loans))
  - Shape notes: Federal program focused on rural ag producers/small businesses for energy projects; rural area restriction, no personal income/age test, grant/loan hybrid with matching funds required
- **Easterseals NH In-Home Care & Health Services** — service ([source](No primary .gov URL; program operated by Easterseals NH nonprofit (https://eastersealsnh.org/programs/senior-services/in-home-care-health-services/)[4].))
  - Shape notes: Private pay/insurance-based with regional staff-limited availability; no strict income/age/assets test; personalized plans vary by need and location

## Program Details

### NH Medication Bridge Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income generally must be less than 200% of the federal poverty level, though limits vary by pharmaceutical company. No specific dollar amounts or household size table provided in sources; monthly household income guidelines differ per company.[1][3]
- Assets: No asset limits mentioned.
- U.S. resident or citizen.[1][2]
- Not eligible for other prescription coverage for the specific medication, including Medicaid, VA, private insurance, HMO, etc.[1][2][3]
- Long-term medications only (not short-term).[1][3]
- Often requires a provider from the participating health center (e.g., Monadnock Community Hospital or White Mountain Community Health Center).[2][4]

**Benefits:** Assistance accessing free or reduced-cost prescriptions from pharmaceutical company patient assistance programs. Some implementations charge $6 per 90-day supply upon eligibility approval.[4]
- Varies by: priority_tier

**How to apply:**
- Phone: (603) 225-0900[1][3]
- Contact financial services at local health centers (e.g., Monadnock Community Hospital, White Mountain Community Health Center).[2][4]
- Mail or in-person: Submit application and proof of income to participating health centers.[4]
- No statewide online application; varies by provider.

**Timeline:** 4-6 weeks for first medication shipment.[4]

**Watch out for:**
- Not a direct state program—it's assistance navigating pharma company programs; eligibility varies per drug/manufacturer.[1][3][6]
- Program no longer centrally managed by Foundation for Healthy Communities since 2021; must contact local health center financial services.[6]
- Excludes those with any other coverage for the specific med, even if low-income.[1][2]
- Only long-term meds; requires participating provider at some centers.[1][2][3]
- Proof of income needed yearly; financial info not shared with medical chart but used only for applications.[4]

**Data shape:** Decentralized service via local health centers, not a uniform state program; eligibility and income tied to individual pharma companies; no fixed age/income table, varies by med and provider.

**Source:** No single active .gov URL; program facilitated statewide via health centers. Historical info at https://healthynh.org/initiatives/access-to-care/medication-bridge/ (noted as no longer managed centrally as of 2021).[6]

---

### New Hampshire Partnership for Prescription

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all New Hampshire residents regardless of income or household size[1][2].
- Assets: No asset limits or tests apply[1][2].
- New Hampshire resident only[1][2]
- No enrollment or application required[1][2]
- No pre-existing condition exclusions[2]

**Benefits:** Discount card providing up to 80% off brand and generic FDA-approved prescription medications at participating pharmacies; savings vary by pharmacy and medication[2].

**How to apply:**
- No application needed; obtain free discount card instantly online at https://nhrxcard.com or by phone at (800) 931-5042[1][2]
- Print or download card and present at over 68,000 pharmacies including major chains[2]

**Timeline:** Immediate; card is pre-activated with no waiting period[2].

**Watch out for:**
- Not insurance; use for non-covered prescriptions or when cheaper than copay—check with pharmacist[2]
- Savings vary by pharmacy and medication; not guaranteed 80% off[2]
- Can be used alongside insurance for better savings on specific drugs[2]
- No coverage for over-the-counter drugs[2]

**Data shape:** no income test, no age requirement, no application or enrollment, instant access via free discount card, pharmacy-specific pricing

**Source:** https://nhrxcard.com/about

---

### NH Medicaid Waiver Programs (Multiple Programs)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Varies by program: 65+ or 18-64 (CFI); 0-21 (DD, IHS); 0-18 (ABD)+
- Income: For nursing home Medicaid applicants: under $2,982/month for single applicants[1]. For Granite Advantage (adult waiver program): adults age 19-64 with incomes at or below 138% of Federal Poverty Level[2]. Income-based eligibility varies by specific waiver program.
- Assets: For nursing home Medicaid: under $2,500 for single applicants[1]. Asset treatment varies by specific waiver program.
- Require Nursing Facility Level of Care (NFLOC) for most waivers[1]
- Functional need for long-term care services with Activities of Daily Living (ADLs) support[1]
- For DD and IHS waivers: ICF/IID level of care requirement[5]
- For children's waivers: disability (medical, developmental, intellectual, or psychiatric) that would otherwise require institutional care[6]
- Work/community engagement requirement: 100 hours per month for Granite Advantage enrollees ages 19-64 (with exemptions for illness, disability, hospitalization, caregiving, or participation in drug court)[2]

**Benefits:** CFI Waiver: adult day services, home health aide, homemaker, personal care, respite, supported employment, financial management, adult family care, in-home services, community transition, environmental accessibility, home-delivered meals, non-medical transportation, personal emergency response, skilled nursing, specialized medical equipment, supportive housing[5]. DD Waiver and IHS Waiver: residential habilitation, service coordination, assistive technology, community integration, environmental/vehicle modifications, individual goods/services, non-medical transportation, personal emergency response, respite, wellness coaching[5][6]
- Varies by: program (four distinct waiver programs with different service arrays)

**How to apply:**
- Online: HealthCare.gov[4]
- Phone: 1-800-852-3345, extension 9700[4]
- Paper application: through New Hampshire Department of Health and Human Services[4]
- In-person: through area agencies (regional locations vary)[3]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources; note that DD Waiver has 5,303 spots with expiration 8/31/2026[6]

**Watch out for:**
- New Hampshire has FOUR separate waiver programs (CFI, DD, ABD, IHS), not one unified program—eligibility and services differ significantly by program[3][5]
- Spousal income treatment: if only one spouse applies, the non-applicant spouse's income is disregarded, but they may receive a Minimum Monthly Maintenance Needs Allowance (MMMNA) of $2,644/month (eff. 7/1/25-6/30/26) if their income falls below this threshold[1]
- Work requirement applies to Granite Advantage enrollees ages 19-64 (100 hours/month community engagement required), with specific exemptions for disability, illness, hospitalization, caregiving, and drug court participation[2]
- Retroactive eligibility waived: unlike traditional Medicaid, New Hampshire's waiver program does not provide three months of retroactive coverage[2]
- Functional/medical need is mandatory—income and assets alone do not qualify applicants[1]
- DD Waiver has limited spots (5,303) and expires 8/31/2026; IHS Waiver expires 12/31/2025—renewal status should be verified[6]

**Data shape:** New Hampshire's 'Medicaid Waiver' is not a single program but a portfolio of four distinct 1915(c) waivers (CFI, DD, ABD, IHS) with different age ranges, functional requirements, service arrays, and spot limitations. Eligibility criteria, income limits, and benefits vary significantly by waiver type. The search results do not provide complete information on processing times, specific application forms, required documents, or detailed regional variations in wait times. Families must first determine which waiver program applies to their situation before applying.

**Source:** https://www.dhhs.nh.gov/programs-services

---

### REAP (Respite, Education, and Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits specified in available sources; eligibility based on business/agricultural operations rather than personal income.
- Assets: No asset limits; applicants must have no outstanding delinquent federal taxes, debt, judgment, or debarment.
- Agricultural producers directly engaged in production of agricultural products with at least 50% of gross income from agricultural operations[1][2].
- Small businesses (fewer than 50 employees, less than $1 million annual receipts, meeting SBA size standards per 13 CFR 121) located in eligible rural areas (population under 50,000)[1][2][3].
- For-profit entities only (sole proprietorship, partnership, corporation, cooperative, electric utility serving rural consumers, or Tribal business entities)[2][3].
- Must provide matching funds for grant-only applications[2].
- U.S. citizens or permanent residents for individual borrowers; loan funds must remain in U.S.[2].

**Benefits:** Grants up to 50% of project costs (max $1 million) for renewable energy systems (e.g., solar, wind, biomass, geothermal, hydropower) or energy efficiency improvements (e.g., HVAC, insulation, lighting); loan guarantees up to 80%[1][2].
- Varies by: project_type

**How to apply:**
- Online via REAP website (specific URL not listed in results; visit USDA RD site)[1][2]
- Work with local lender for loan guarantees[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Not for nonprofits or standalone EV charging stations (unless part of renewable system for self-use)[3].
- One renewable energy and one energy efficiency application per fiscal year[3].
- Must show energy use reduction for efficiency projects; projects must meet standards for 50% grant (e.g., zero GHG emissions, Energy Community location, Tribal entity)[2][3].
- This is USDA Rural Energy for America Program (REAP), not a respite/elderly care program—query may refer to different 'REAP'[1][2]

**Data shape:** Federal program focused on rural ag producers/small businesses for energy projects; rural area restriction, no personal income/age test, grant/loan hybrid with matching funds required

**Source:** https://www.rd.usda.gov/programs-services/energy-programs/rural-energy-america-program-renewable-energy-systems-energy-efficiency-improvement-guaranteed-loans

---

### Easterseals NH In-Home Care & Health Services

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits stated; accepts Medicaid, long-term care insurance, private pay, and Veterans’ vouchers[4].
- Assets: No asset limits mentioned in available information[4].
- Services for older adults or those needing in-home support; subject to staff availability in served areas[4]

**Benefits:** Nursing services (medication management, routine health and wellness checks); Homemaker services (light housekeeping, running errands, laundry, preparing meals); Personal care services (assistance with bathing and daily personal routines)[4]. No fixed dollar amounts or hours specified; personalized care plans created[4].
- Varies by: region

**How to apply:**
- Phone: 603-845-9318 for free consultation[4]
- Online inquiry via Easterseals NH website (https://eastersealsnh.org/programs/senior-services/in-home-care-health-services/)[4]

**Timeline:** Home visit arranged after contact; personalized care plan developed thereafter. No specific timeline provided[4].
**Waitlist:** Services subject to staff availability; no formal waitlist details[4].

**Watch out for:**
- Not a free government program with strict eligibility—requires payment via private pay, insurance, Medicaid, or Veterans’ vouchers[4].
- Limited to specific regions with staff availability restrictions, not fully statewide[4].
- Personalized services, so no guaranteed hours or fixed benefits; depends on assessment[4].
- Primarily private/non-medical model, unlike waiver programs with nursing home level eligibility[1][4].

**Data shape:** Private pay/insurance-based with regional staff-limited availability; no strict income/age/assets test; personalized plans vary by need and location

**Source:** No primary .gov URL; program operated by Easterseals NH nonprofit (https://eastersealsnh.org/programs/senior-services/in-home-care-health-services/)[4].

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| NH Medication Bridge Program | resource | state | simple |
| New Hampshire Partnership for Prescripti | benefit | federal | medium |
| NH Medicaid Waiver Programs (Multiple Pr | benefit | state | deep |
| REAP (Respite, Education, and Assistance | benefit | local | medium |
| Easterseals NH In-Home Care & Health Ser | benefit | local | medium |

**Types:** {"resource":1,"benefit":4}
**Scopes:** {"state":2,"federal":1,"local":2}
**Complexity:** {"simple":1,"medium":3,"deep":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/NH/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 1 programs
- **not_applicable**: 1 programs
- **program (four distinct waiver programs with different service arrays)**: 1 programs
- **project_type**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **NH Medication Bridge Program**: Decentralized service via local health centers, not a uniform state program; eligibility and income tied to individual pharma companies; no fixed age/income table, varies by med and provider.
- **New Hampshire Partnership for Prescription**: no income test, no age requirement, no application or enrollment, instant access via free discount card, pharmacy-specific pricing
- **NH Medicaid Waiver Programs (Multiple Programs)**: New Hampshire's 'Medicaid Waiver' is not a single program but a portfolio of four distinct 1915(c) waivers (CFI, DD, ABD, IHS) with different age ranges, functional requirements, service arrays, and spot limitations. Eligibility criteria, income limits, and benefits vary significantly by waiver type. The search results do not provide complete information on processing times, specific application forms, required documents, or detailed regional variations in wait times. Families must first determine which waiver program applies to their situation before applying.
- **REAP (Respite, Education, and Assistance Program)**: Federal program focused on rural ag producers/small businesses for energy projects; rural area restriction, no personal income/age test, grant/loan hybrid with matching funds required
- **Easterseals NH In-Home Care & Health Services**: Private pay/insurance-based with regional staff-limited availability; no strict income/age/assets test; personalized plans vary by need and location

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Hampshire?
