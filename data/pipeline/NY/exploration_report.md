# New York Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.010 (2 calls, 16s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | ? |
| Programs deep-dived | 14 |
| New (not in our data) | 8 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 6 programs
- **financial**: 7 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### New York State Home and Community-Based Services (HCBS) Waiver Programs

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Specific services include: day habilitation, live-in caregiver, prevocational services, residential habilitation, respite, supported employment, fiscal intermediary, support brokerage, assistive technology/adaptive devices, community habilitation, community transition services, environmental modifications (home accessibility), family education/training, individual directed goods/services, intensive behavioral services, pathway to employment, vehicle modifications. Provided to avoid institutionalization; no fixed dollar amounts or hours specified[2][5][6].` ([source](https://www.opwdd.ny.gov (Office for People With Developmental Disabilities); https://www.emedny.org/providermanuals/hcbswaiver/pdfs/hcbs_policy_section.pdf (HCBS Waiver Manual)[2]))
- **source_url**: Ours says `MISSING` → Source says `https://www.opwdd.ny.gov (Office for People With Developmental Disabilities); https://www.emedny.org/providermanuals/hcbswaiver/pdfs/hcbs_policy_section.pdf (HCBS Waiver Manual)[2]`

### Program of All-Inclusive Care for the Elderly (PACE)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive package including: all Medicare and Medicaid services (including Part D pharmacy, Medicaid community-based long-term services and supports, skilled nursing facility care), social determinants of health services, transportation, adult day care, dentistry, laboratory and x-ray services, meals, physical/occupational/recreational therapy, home health aides, eye care, foot care, hearing aids, wound care, palliative care, nutritional counseling, and any other services determined necessary to help participants live independently in their homes and communities (excluding housing and cosmetic services)[1][3][6]` ([source](https://www.cms.gov/medicare/medicaid-coordination/about/pace and https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly))
- **source_url**: Ours says `MISSING` → Source says `https://www.cms.gov/medicare/medicaid-coordination/about/pace and https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly`

### Medicare Savings Program (MSP)

- **income_limit**: Ours says `$1800` → Source says `$1,856` ([source](https://www.health.ny.gov/health_care/medicaid/program/longterm/msp.htm))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `- **QMB**: Pays Medicare Part A/B premiums, deductibles, copayments/coinsurance[1][4].
- **SLMB**: Pays Part B premiums[1][6].
- **QI-1**: Pays Part B premiums only; up to 3 months retroactive reimbursement if applied in same year[3][4].
- **QDWI**: Pays Part A premiums for working disabled[1].
No direct services; financial assistance for Medicare cost-sharing.` ([source](https://www.health.ny.gov/health_care/medicaid/program/longterm/msp.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.health.ny.gov/health_care/medicaid/program/longterm/msp.htm`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `60` → Source says `60 or older qualifies for expanded eligibility; no minimum age for other household members[1][5]` ([source](https://otda.ny.gov/programs/snap/ and https://aging.ny.gov/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly food assistance benefit. Average for households with older adult in NYC: $180/month. Minimum historically $16/month but actual benefits typically higher[2]` ([source](https://otda.ny.gov/programs/snap/ and https://aging.ny.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://otda.ny.gov/programs/snap/ and https://aging.ny.gov/`

### Home Energy Assistance Program (HEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One Regular HEAP benefit per program year (2025-2026 opened Dec 1, 2025) to pay heating costs. Amount based on income, household size, heating source, vulnerable member (under 6, 60+, disabled). Base benefit increased by $61 for Tier 1 income range if paying directly for heat. Emergency HEAP for shutoff notices (Jan 2-Apr 7, 2026). No fixed dollar amounts listed; varies case-by-case.[1][5]` ([source](https://otda.ny.gov/programs/heap/))
- **source_url**: Ours says `MISSING` → Source says `https://otda.ny.gov/programs/heap/`

### Elderly Pharmaceutical Insurance Coverage Program (EPIC)

- **income_limit**: Ours says `$1800` → Source says `$75,000` ([source](https://epic.ny.gov/ (inferred from context; sources reference NY State Dept of Health EPIC webpage, but exact URL not listed)))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Co-payment assistance for Medicare Part D covered prescription drugs after Part D deductible met; covers many Part D-excluded drugs (e.g., prescription vitamins, cough/cold preparations). Fee Plan: Annual fee $8-$300 based on prior year income. Deductible Plan: Sliding scale deductible $530-$2,430/year based on income before EPIC co-pays. Pays Part D premiums up to basic plan cost for incomes below $23,000 single / $29,000 married (higher incomes pay own premiums, but deductible reduced by basic plan cost).[1][3][5]` ([source](https://epic.ny.gov/ (inferred from context; sources reference NY State Dept of Health EPIC webpage, but exact URL not listed)))
- **source_url**: Ours says `MISSING` → Source says `https://epic.ny.gov/ (inferred from context; sources reference NY State Dept of Health EPIC webpage, but exact URL not listed)`

## New Programs (Not in Our Data)

- **Weatherization Referral and Packaging Program (WRAP)** — service ([source](https://hcr.ny.gov/weatherization-applicants))
  - Shape notes: Delivered via local HCR subgrantees with regional providers; priority-tiered access; income at 60% SMI with auto-eligibility via benefits; no age minimum but seniors prioritized; funding/waitlist varies heavily by region.
- **Meals on Wheels (via Expanded In-Home Services for the Elderly - EISEP)** — service ([source](https://aging.ny.gov/expanded-home-services-elderly-eisep))
  - Shape notes: County-administered via local AAAs with varying providers, contacts, and waitlists; no fixed income/asset caps but sliding fees; Meals on Wheels integrated as one service among broader in-home supports; eligibility excludes Medicaid recipients
- **New York Foundation for Senior Citizens Respite Care Program** — service ([source](https://www.nyfsc.org))
  - Shape notes: NYC-restricted, non-Medicaid focus, caregiver relief via temporary services; no income/asset tables or quantified benefits in sources
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://aging.ny.gov/senior-community-service-employment-program-scsep))
  - Shape notes: Federally authorized (Older Americans Act, DOL) but locally administered by multiple NY grantees with varying contacts/placements; income fixed at 125% FPL (varies by household size annually); priority-based enrollment; 20hr/wk training standard statewide
- **Senior Citizen Rent Increase Exemption (SCRIE)** — financial ([source](https://www.nyc.gov/site/finance/property/landlords-scrie.page))
  - Shape notes: NYC-focused with income fixed at $50,000 cap (may vary by household); housing-type restricted; landlord tax credit offsets costs; municipal opt-in outside NYC leads to regional income tables and forms.
- **Senior Citizen Homeowners' Exemption (SCHE)** — financial ([source](https://www.nyc.gov/site/finance/property/landlords-sche.page))
  - Shape notes: NYC-only fixed sliding scale by income (5-50%); statewide optional/localized with variable caps; renewal every 2 years; no assets test.
- **Enhanced STAR (School Tax Relief for Seniors)** — financial ([source](https://www.tax.ny.gov/pit/property/star/eligibility.htm))
  - Shape notes: Income limit fixed regardless of household size; automatic eligibility determination by NYS starting 2026 eliminates local assessor applications for upgrades; benefits vary by local tax rates and property value.
- **NYS Supportive Housing Program** — service ([source](https://omh.ny.gov/omhweb/adults/supportedhousing/supportedhousingguidelines.html[7]))
  - Shape notes: Eligibility driven by homelessness duration, SMI/disabling conditions, and priority tiers (NY/NY I/II/III, ESSHI); no income/asset tests; NYC-specific detailed criteria/forms; statewide via OMH LGUs/providers with regional referral variations; includes seniors 55+ but not elderly-focused without homelessness/SMI.

## Program Details

### New York State Home and Community-Based Services (HCBS) Waiver Programs


**Eligibility:**
- Income: Varies by specific waiver; follows Medicaid thresholds (exact dollar amounts not specified in sources; child waivers deem parent income, using child's income only). For programs like NHTD (related waiver for seniors 65+ and adults 18-64 with physical disabilities), standard long-term care Medicaid income/asset rules apply with potential waivers[1][3][4][5].
- Assets: Medicaid asset limits apply (not quantified here); home equity limit of $1,097,000 in 2025 if applicant lives in home or intends to return (exemptions: non-applicant spouse resides there, disabled/blind child of any age, or minor child under 21 lives there). Assets must not be transferred under fair market value (30-month look-back rule implementing ~2025, causing penalty periods)[4].
- Diagnosis of developmental disability (OPWDD HCBS Waiver)[1][2][6]
- Eligible for nursing home, ICF/IID, hospital, or Intermediate Care Facility (ICF/MR) level of care[1][2][3][4][5][6]
- Medicaid eligible[1][2][3]
- Choose HCBS over institutional care[1][2]
- For NHTD: physical disabilities (18-64) or seniors (65+), at risk of nursing home placement; can continue post-65 if enrolled earlier[4]
- Targeted populations vary: e.g., developmental disabilities (all ages), children 0-20 with physical/medical disabilities, autism, etc.[5][6]

**Benefits:** Specific services include: day habilitation, live-in caregiver, prevocational services, residential habilitation, respite, supported employment, fiscal intermediary, support brokerage, assistive technology/adaptive devices, community habilitation, community transition services, environmental modifications (home accessibility), family education/training, individual directed goods/services, intensive behavioral services, pathway to employment, vehicle modifications. Provided to avoid institutionalization; no fixed dollar amounts or hours specified[2][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact Developmental Disabilities Services Office (DDSO) serving your county: http://www.opwdd.ny.gov/document/hp_contacts.jsp[2]
- Contact local Medicaid office or developmental disabilities agency for intake/screening[3]
- Request enrollment via OPWDD for developmental disabilities services[2]

**Timeline:** Not specified
**Waitlist:** Common for high-demand services (e.g., autism supports, respite); approval may lead to waitlist notification[3]

**Watch out for:**
- Multiple distinct waivers under HCBS umbrella (e.g., OPWDD for developmental disabilities, NHTD for physical disabilities/seniors, children's waivers); not a single program—match to specific diagnosis/age[1][4][5][6]
- Must choose HCBS over institutional care; nursing/ICF level of care required despite community focus[1][2][3]
- Limited slots; waitlists common[3]
- 30-month look-back on asset transfers starting ~2025[4]
- Primarily for developmental disabilities (OPWDD HCBS), not general elderly unless physical disability via NHTD[1][4]

**Data shape:** Multiple waivers with varying targets (e.g., developmental disabilities all ages, children 0-20, seniors/physical disabilities 18+); county DDSO administration; ICF/nursing level of care; Medicaid financials with some income deeming waivers for kids; slot-limited with waitlists

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.opwdd.ny.gov (Office for People With Developmental Disabilities); https://www.emedny.org/providermanuals/hcbswaiver/pdfs/hcbs_policy_section.pdf (HCBS Waiver Manual)[2]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: Not specified in available sources. PACE is primarily for individuals dually eligible for Medicare and Medicaid; Medicaid eligibility rules apply but specific income thresholds are not detailed in search results.
- Assets: Not specified in available sources. Medicaid asset limits would apply for Medicaid eligibility, but specific thresholds are not provided.
- Must be certified as requiring nursing home level of care by New York State[5]
- Must require more than 120 days of community-based long-term care services[5]
- Must live in the service area of a PACE organization[4]
- Must be able to live safely in the community at the time of enrollment with PACE assistance[4][5]
- Most participants are dually eligible for both Medicare and Medicaid[2][3]

**Benefits:** Comprehensive package including: all Medicare and Medicaid services (including Part D pharmacy, Medicaid community-based long-term services and supports, skilled nursing facility care), social determinants of health services, transportation, adult day care, dentistry, laboratory and x-ray services, meals, physical/occupational/recreational therapy, home health aides, eye care, foot care, hearing aids, wound care, palliative care, nutritional counseling, and any other services determined necessary to help participants live independently in their homes and communities (excluding housing and cosmetic services)[1][3][6]
- Varies by: Individual care plan determined by interdisciplinary team; not fixed by tier or priority level

**How to apply:**
- Contact a PACE organization directly in your service area (specific URLs and phone numbers not provided in search results)
- In-person at PACE center locations
- Phone contact with PACE organization

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE becomes the sole source of Medicare and Medicaid benefits for participants[4] — you cannot use other Medicare or Medicaid plans simultaneously
- Enrollment is voluntary and monthly, but switching out requires leaving the program entirely[1]
- Participants must be able to live safely in the community; if safety cannot be maintained, nursing home placement may become necessary[4][5]
- Not all areas of New York have PACE providers; service area availability is a hard eligibility requirement[4]
- The program requires frequent interaction through interdisciplinary care planning[1] — this is not a passive benefit
- PACE is often called the 'Gold Standard' for integrated geriatric care[1], but availability is limited by provider presence in your region

**Data shape:** PACE eligibility and benefits are highly individualized based on care planning rather than tiered or formulaic. The program's defining feature is capitated financing (fixed monthly payment per member), which allows providers to deliver all necessary services rather than only reimbursable ones. Income and asset limits are not program-specific but follow Medicaid rules. Critical gap: specific New York State income/asset thresholds, processing timelines, application procedures, and complete provider directory are not available in search results and would require direct contact with New York State Medicaid or individual PACE organizations.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.cms.gov/medicare/medicaid-coordination/about/pace and https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly

---

### Medicare Savings Program (MSP)


**Eligibility:**
- Income: MSP has four tiers (QMB, SLMB, QI-1, QDWI) with varying income limits based on 2026 figures, after allowable deductions for certain health premiums (e.g., Medicare Supplement, Part D, dental, vision, long-term care; excludes Part B premium or IRMAA). No resource/asset limits in New York. Approximate monthly gross income limits (individuals/couples):
- QMB: ≤$1,856 / ≤$2,511[4][7]
- SLMB: Not fully specified, higher than QMB[1]
- QI-1: ≤$2,474-$2,494 / ≤$3,299[4][5][7]
- QDWI: Not detailed in sources[1]
Varies by household size; limits increase for larger households per Federal Poverty Level percentages[3]. Must be enrolled in Medicare (or soon to be) and have Part A for most tiers[1][3].
- Assets: No asset or resource limits in New York State[2][5].
- Must be enrolled in Medicare Part A (for QI-1, Part A and B required)[1][3][6].
- U.S. citizen or qualified immigrant.
- Reside in New York.
- Not eligible for full Medicaid in some cases (QI-1 cannot overlap with other Medicaid)[3].

**Benefits:** - **QMB**: Pays Medicare Part A/B premiums, deductibles, copayments/coinsurance[1][4].
- **SLMB**: Pays Part B premiums[1][6].
- **QI-1**: Pays Part B premiums only; up to 3 months retroactive reimbursement if applied in same year[3][4].
- **QDWI**: Pays Part A premiums for working disabled[1].
No direct services; financial assistance for Medicare cost-sharing.
- Varies by: priority_tier

**How to apply:**
- Phone: HRA Medicaid Helpline 888-692-6116 (NYC); local social services[2][3].
- Mail: HRA/Medical Assistance Program, Initial Eligibility Unit, 5th Fl., PO Box 24390, Brooklyn, NY 11202-9814 (for MSP + Medicaid); varies by county[3][4].
- In-person: Community Medicaid Offices (NYC); local Department of Social Services offices statewide[2][3].
- Short MSP-only application or longer MSP + Medicaid application[3].

**Timeline:** QI-1 effective month of application; annual (Jan-Dec); other timelines not specified[3].
**Waitlist:** QI is first-come, first-served and limited[1].

**Watch out for:**
- Income calculated after specific premium deductions only (not Part B or IRMAA)[4].
- QI-1 is first-come, first-served, annual, and cannot overlap with other Medicaid[1][3].
- No retroactive Part B reimbursement for QMB[4].
- Must have Medicare Part A; program pays premiums/cost-sharing but providers may still bill for services (QMB protections apply)[1].
- Increased applicants may cause delays[2].
- Limits updated annually; 2026 figures apply[4][7].

**Data shape:** Four tiers with tiered income limits and benefits; no asset test; deductions for select premiums; QI first-come first-served; statewide but local admin.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.health.ny.gov/health_care/medicaid/program/longterm/msp.htm

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60 or older qualifies for expanded eligibility; no minimum age for other household members[1][5]+
- Income: {"standard_gross_income_limits":"Varies by household size. For reference, 2025 limits: 1 person $15,060/month, 2 people $20,440/month (these are federal maximums; New York has expanded eligibility)[6]","expanded_limits_seniors_disabled":"If household has member 60+ or disabled: Gross income limit of $2,608/month for 1 person. If over this, can qualify via Net Income test instead[1]","net_income_limits_seniors_disabled":"100% of federal poverty level: 1 person $1,304/month, 2 people $1,763/month, 3 people $2,221/month, 4 people $2,679/month, 5 people $3,138/month, 6 people $3,596/month, 7 people $4,054/month, each additional person +$458/month[1]","categorical_eligibility":"Households with seniors/disabled persons with gross income under 200% of federal poverty limit do not need to meet resource limits or pass net income test[5]","note":"New York has expanded eligibility beyond federal requirements[1]"}
- Assets: {"standard_limit":"$4,500 for households with member 60+ or disabled[1]","categorical_exemption":"Households with seniors/disabled under 200% of federal poverty limit are exempt from asset limits[5]","what_counts":"Search results do not specify which assets count or are exempt"}
- Households without earned income, member over 60, disability, or dependent child must meet all three tests (Gross Income, Net Income, Asset)[1]
- For ESAP (Elderly Simplified Application Project): all adult members must be senior (60+) and/or disabled, AND have no earned income[3][4]
- Work requirements: If under 65 and not disabled, must work 20 hours/week or earn $217.50/week, or participate in work study/training. Seniors 65+ and disabled are exempt[8][9]
- Household composition: Application must include everyone who lives with applicant and buys/prepares food together[6]

**Benefits:** Monthly food assistance benefit. Average for households with older adult in NYC: $180/month. Minimum historically $16/month but actual benefits typically higher[2]
- Varies by: household_size and income level (SNAP budget calculated individually for each household)[9]

**How to apply:**
- Online: myBenefits or Access HRA[4]
- Paper application: LDSS-5166 (simplified form for ESAP-eligible households)[4]
- In-person: Local SNAP office (specific locations not provided in search results)
- Phone: Specific phone number not provided in search results

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Many seniors believe they only qualify for minimum $16/month and don't apply; actual average is $180/month in NYC[2]
- New York has expanded eligibility beyond federal requirements—other websites may show stricter limits than actually apply[1]
- Asset limits do NOT apply to households with seniors/disabled under 200% of poverty, but application may still ask about assets[1]
- ESAP requires NO earned income for ALL adult household members—even one adult with earned income disqualifies the household from ESAP[3][4]
- Seniors can establish separate household status if living with others, but only if housemates' income is under 165% of poverty limit[5]
- Work requirements apply to those under 65 unless disabled or in caregiver role—volunteer hours may count toward requirements[8]
- Only about half of eligible seniors actually receive SNAP benefits[6]
- Certification period under ESAP is 36 months with non-mandatory interim report and no interview at recertification—much longer than standard SNAP[3]
- Households can only be determined eligible for ONE of three programs (ESAP, NYSCAP, or standard SNAP)—not multiple[5]

**Data shape:** SNAP in New York has a complex, tiered eligibility structure with different rules for seniors/disabled vs. other households. Income limits vary significantly by household size and whether household includes seniors/disabled. New York's expanded categorical eligibility (200% poverty threshold) is more generous than federal baseline. ESAP provides simplified access for qualifying seniors/disabled with no earned income. Benefits are individually calculated per household based on income and deductions, not fixed amounts. The program has multiple application pathways (standard, ESAP, NYSCAP) with different requirements and benefits.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://otda.ny.gov/programs/snap/ and https://aging.ny.gov/

---

### Home Energy Assistance Program (HEAP)


**Eligibility:**
- Age: 60+
- Income: Gross monthly income at or below current guidelines (specific table not fully detailed in sources; check OTDA site for household size chart). Automatic eligibility if receiving SNAP, federally funded TA/PA, or Code A SSI Living Alone. Tier 1 (add-on benefits) at or below 130% federal poverty level or receiving TA/SNAP/Code A SSI.[1][5]
- Assets: No asset limits mentioned; program focuses on income and categorical eligibility.[1]
- Household member is US Citizen or Qualified Non-Citizen.
- Own and reside in home (for certain benefits like aging subcomponent).
- Pay for heating energy directly to fuel company or as part of rent.
- Primary heating source considered; presence of member under 6, 60+, or permanently disabled affects eligibility/benefit.
- Excludes: government subsidized housing with heat included, room/board, care facilities, dorms, no heating responsibility.[1][4]

**Benefits:** One Regular HEAP benefit per program year (2025-2026 opened Dec 1, 2025) to pay heating costs. Amount based on income, household size, heating source, vulnerable member (under 6, 60+, disabled). Base benefit increased by $61 for Tier 1 income range if paying directly for heat. Emergency HEAP for shutoff notices (Jan 2-Apr 7, 2026). No fixed dollar amounts listed; varies case-by-case.[1][5]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: New York State myBenefits at mybenefits.ny.gov.
- Phone: HEAP hotline 1-800-342-3009; local DSS (e.g., 607-428-5400 Cortland, 718-557-1399 NYC).
- Mail: Download/print form from OTDA site, mail to local DSS/HEAP Local District Contact.
- In-person: Local Department of Social Services (DSS) or HEAP Local District Contact; seniors 60+ via Office of the Aging in some counties (e.g., Herkimer).[3][4][6]

**Timeline:** Not specified; local DSS reviews after submission, may include interview.[2]
**Waitlist:** Not mentioned; one grant per household per heating season.[4]

**Watch out for:**
- One benefit per heating season only.
- Must pay for heat directly or in rent; no aid if heat included in subsidized housing/room/board.
- Seniors 60+ may apply via separate Office of the Aging in some areas, not general DSS.
- Income is gross monthly; automatic eligibility for SNAP/TA/SSI but still need to apply.
- Program year-specific (e.g., 2025-2026); Emergency has shutoff requirement and dates.
- Vulnerable member boosts benefit but all criteria must be met.[1][4]

**Data shape:** Benefits scale by household size, income tier, heating source, vulnerable member presence; county-specific processing (DSS vs. Aging offices); categorical eligibility bypasses income test for SNAP/TA/SSI recipients.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://otda.ny.gov/programs/heap/

---

### Weatherization Referral and Packaging Program (WRAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households with income at or below 60% of New York State Median Income (SMI). Example NYC figures (may vary by region/year): 1 person: $31,200; 2: $35,640; 3: $40,080; 4: $44,520; 5: $48,120; 6: $51,660; 7: $55,200; 8: $58,800 annually. Refer to current HEAP guidelines for exact table by household size[1][2][4][7].
- Assets: No asset limits mentioned in sources.
- Automatic eligibility if any household member receives HEAP, SSI, SNAP (Food Stamps), Public Assistance, or certain other benefits[1][2][4][6][7].
- Open to homeowners and renters (renters need landlord consent)[1][2][4].
- Priority for seniors (60+), families with children, people with disabilities, high energy burden households[1][2][4][6][7].
- Eligible homes: single-family, multi-family, manufactured homes, apartments[1][2].

**Benefits:** Free energy efficiency upgrades based on on-site energy audit, including: air sealing (weatherstripping, caulking), attic/wall insulation, heating system tune-up/replacement/repair, duct/pipe insulation, programmable thermostats, lighting upgrades, hot water tank/pipe insulation, Energy Star refrigerator replacement. Average energy savings >20%. No cost to eligible homeowners/renters (landlords contribute 25% for multi-family)[1][2][4][5][7].
- Varies by: priority_tier

**How to apply:**
- Contact local Weatherization Assistance Provider (administered by NYS HCR). Find providers via https://hcr.ny.gov/weatherization-applicants or https://otda.ny.gov/workingfamilies/wap.asp[1][2][7].
- Examples: Chautauqua County - Chautauqua Opportunities, Inc. at 716-661-9430[7]; NYC-specific via nyweatherizationprogram.com[4].
- In-person/mail to local provider; no statewide online form specified.
- Process: Submit application → Provider confirms eligibility when funding available → Energy audit → Work installed → Inspection[2].

**Timeline:** Varies by funding availability; provider contacts when funds allow. No fixed timeline stated[2].
**Waitlist:** Implicit waitlist due to funding limits; prioritized by need[1][2].

**Watch out for:**
- This is the Weatherization Assistance Program (WAP), not a distinct 'WRAP'; no separate WRAP program found in NY sources—likely refers to WAP[1][2].
- Renters need landlord approval; NYC renters may face barriers[3][4].
- Landlords of multi-family pay 25% match (waivers possible)[5].
- Priority-based, not guaranteed service; funding-limited waitlists common[2].
- Income limits tie to current HEAP guidelines—verify annually[2][7].
- Services determined by audit, not chosen by applicant[1][2].

**Data shape:** Delivered via local HCR subgrantees with regional providers; priority-tiered access; income at 60% SMI with auto-eligibility via benefits; no age minimum but seniors prioritized; funding/waitlist varies heavily by region.

**Source:** https://hcr.ny.gov/weatherization-applicants

---

### Meals on Wheels (via Expanded In-Home Services for the Elderly - EISEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits; program is open regardless of income with mandatory sliding-scale cost-sharing based on household income and service costs (ranging from no-cost to full-cost). Exact dollar amounts not specified in sources and determined by case manager after assessment[3][2][4][5][6].
- Assets: No asset limits mentioned; eligibility focuses on functional needs rather than assets.
- Functionally limited with unmet needs for daily activities (ADLs/IADLs)
- Unable to receive Medicaid, Medicare, or other insurance reimbursement for the same/similar services
- Able to live safely at home with services provided
- For NYC/Citymeals: Physically or mentally incapacitated and unable to prepare nutritious meals or have no one to do so[1]
- Residency in participating NY county/borough[2]

**Benefits:** Home-delivered meals (Meals on Wheels, typically Monday-Friday, e.g., 11am-1:30pm in some counties; suggested contribution $4/meal in Genesee but no refusal for inability to pay); case management; non-medical in-home services (housekeeping, personal care); non-institutional respite; ancillary services; emergency response systems (PERS); subsidized social adult day care; home repairs (varies by provider/county)[3][5][6][1].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) or NY Connects office by phone (e.g., Wyoming County: 585-786-8833[4]; Genesee County: 585-343-1611[5]; Nassau/EAC Network: 516-992-0081[3])
- Enter address on Citymeals tool for NYC Case Management Agency contact (https://www.citymeals.org/get-meals)[1]
- NY Statewide info: aging.ny.gov/expanded-home-services-elderly-eisep[7]

**Timeline:** Not specified; involves comprehensive assessment by case manager, then care plan development.
**Waitlist:** Varies by county; some counties have waitlists (e.g., confirmed in case examples)[2]

**Watch out for:**
- Not for Medicaid-eligible individuals; bridges gap for those ineligible for Medicaid home care[2][7]
- Mandatory sliding-scale cost-share (not free for all; based on income/service cost)[3][2]
- Meals only part of EISEP; requires full assessment for case management and other services[3][6]
- County-specific: Must contact local AAA; no centralized application[2][4]
- Even with homecare/Medicaid, eligible if meals don't meet dietary/religious needs[1]
- Services to delay nursing home entry, not long-term substitute[4][5]

**Data shape:** County-administered via local AAAs with varying providers, contacts, and waitlists; no fixed income/asset caps but sliding fees; Meals on Wheels integrated as one service among broader in-home supports; eligibility excludes Medicaid recipients

**Source:** https://aging.ny.gov/expanded-home-services-elderly-eisep

---

### New York Foundation for Senior Citizens Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits mentioned; program targets frail elderly who are not Medicaid eligible. Eligibility assessed via functional needs rather than strict income thresholds[5][6].
- Assets: No asset limits or details on what counts/exempts specified in available data[5][6].
- Care recipient must be frail elderly individual over age 60 residing in New York City
- Not eligible for Medicaid
- Caregivers (family or non-paid) providing care/supervision to frail elderly unable to meet daily needs without assistance due to mental/physical impairment[5][6]

**Benefits:** Temporary relief/respite care services for caregivers of frail elderly; specific formats (e.g., in-home, hours) not detailed, but provides break from caregiving duties[5][6].

**How to apply:**
- Contact New York Foundation for Senior Citizens via their website at https://www.nyfsc.org or main office (specific phone not listed in results; use NY Connects at 1-800-342-9871 for referral)[6]
- Complete application process through NYFSC (details on site)[6]

**Timeline:** Not specified

**Watch out for:**
- Limited to NYC residents only—not statewide
- Excludes Medicaid-eligible individuals
- Specific service details (hours, types, costs) sparse; contact provider directly
- Part of broader NY aging network but uniquely non-profit/non-sectarian focused on NYC seniors[6]

**Data shape:** NYC-restricted, non-Medicaid focus, caregiver relief via temporary services; no income/asset tables or quantified benefits in sources

**Source:** https://www.nyfsc.org

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in sources; families must check current federal poverty guidelines via HHS or program providers[1][2][5].
- Assets: No asset limits mentioned in sources[1][2][5].
- Unemployed
- Poor/low employment prospects
- Enrollment priority: veterans (or qualified spouses), 65+, disability, limited English/low literacy, rural resident, homeless/at risk, failed to find employment after American Job Center services[1][2][5]

**Benefits:** Subsidized part-time community service training (average 20 hours/week) at nonprofit/public facilities (e.g., schools, hospitals, senior centers); paid highest of federal/state/local minimum wage; supportive services (Individual Employment Plan, orientation, training, annual physicals, unsubsidized job assistance); access to American Job Centers. Bridge to unsubsidized employment[1][2][5].
- Varies by: priority_tier

**How to apply:**
- Statewide info: https://aging.ny.gov/senior-community-service-employment-program-scsep[1]
- NYC (CPC): Email pshen@cpc-nyc.org or contact Penny Shen[2]; NYC Aging Connect: 212-244-6469 (212-AGING-NYC) for employment services[7]
- Westchester: Urban League of Westchester at (914) 428-5850[4]
- Other regions: Contact local providers (e.g., Robert Couche Senior Center Queens: 718-978-8352; Goodwill Western NY: (716) 854-3494 x 3018; Pro Action Steuben/Yates: 607-776-2125)[8]
- In-person: Local grantees/One-Stop Centers; bring documents to complete application[6]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary by region/provider due to limited slots[1]

**Watch out for:**
- Must be unemployed and have poor employment prospects; not general senior employment[1]
- Income at or below 125% FPL (check current levels as they update yearly)[1][2]
- Priority tiers may cause waitlists in high-demand areas like NYC[1][2]
- Temporary training (not permanent job); bridge to unsubsidized work[1][5]
- Regional providers only; contact local grantee, not centralized application[8]
- Some areas restrict by county/residency (e.g., Brooklyn/Manhattan for CPC)[3]

**Data shape:** Federally authorized (Older Americans Act, DOL) but locally administered by multiple NY grantees with varying contacts/placements; income fixed at 125% FPL (varies by household size annually); priority-based enrollment; 20hr/wk training standard statewide

**Source:** https://aging.ny.gov/senior-community-service-employment-program-scsep

---

### Elderly Pharmaceutical Insurance Coverage Program (EPIC)


**Eligibility:**
- Age: 65+
- Income: Annual income up to $75,000 if single or $100,000 if married (based on prior year's income). Two tiers: Fee Plan (under $20,000 single / $26,000 married; conflicting older sources cite lower limits like $35,000 single / $50,000 married); Deductible Plan ($20,001-$75,000 single / $26,001-$100,000 married). No variation by household size beyond single/married; Medicaid spend-down eligible if not full Medicaid.[1][2][3][4][5][6]
- Assets: No asset limits or test; assets not counted toward eligibility.[4]
- New York State resident (permanent home in NY, listed on official documents).
- Not receiving full Medicaid benefits (NY Managed Long Term Care).
- Enrolled in or eligible for Medicare Part D plan (required to receive benefits; EPIC provides Special Enrollment Period).
- Cannot have non-Part D drug coverage (e.g., union/retiree subsidy without Part D, or Medicare Advantage HMO without Part D).

**Benefits:** Co-payment assistance for Medicare Part D covered prescription drugs after Part D deductible met; covers many Part D-excluded drugs (e.g., prescription vitamins, cough/cold preparations). Fee Plan: Annual fee $8-$300 based on prior year income. Deductible Plan: Sliding scale deductible $530-$2,430/year based on income before EPIC co-pays. Pays Part D premiums up to basic plan cost for incomes below $23,000 single / $29,000 married (higher incomes pay own premiums, but deductible reduced by basic plan cost).[1][3][5]
- Varies by: priority_tier

**How to apply:**
- Phone: (800) 332-3742 toll-free.[1]
- Mail or fax: Download application (DOH-5080 EPIC Application) and send to EPIC.[1][4][5]
- Online: Visit New York State EPIC program webpage to learn more and download application.[1]

**Timeline:** Not specified in sources.

**Watch out for:**
- Must enroll in Medicare Part D to receive any EPIC benefits; EPIC is wraparound (Part D pays first).[1][2][3][5]
- Not eligible if on full Medicaid or non-Part D drug coverage.[1][2][4]
- Income based on prior year; notify EPIC of address changes.[2]
- Conflicting income limits across sources (use most recent: $75k/$100k); check official for updates.[1][2][3][4]
- Fee Plan has annual fee; Deductible Plan requires meeting deductible first.[1]
- Seniors income-eligible for Extra Help must complete Request for Additional Information (RFAI).[2]

**Data shape:** Two-tier structure (Fee Plan low-income, Deductible Plan higher-income) with sliding deductibles/fees by income; wraps around Medicare Part D; no assets test; statewide with no regional variation.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://epic.ny.gov/ (inferred from context; sources reference NY State Dept of Health EPIC webpage, but exact URL not listed)

---

### Senior Citizen Rent Increase Exemption (SCRIE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: In New York City, annual household income must be $50,000 or less. Specific limits vary by household size and are not detailed in available sources; families should verify current thresholds via official NYC DOF channels. Outside NYC (e.g., certain Nassau and Westchester municipalities), limits differ by location and household—consult local HCR guidelines for tables.
- Assets: No asset limits mentioned in program rules.
- Must occupy a rent-regulated apartment (rent-stabilized, rent-controlled), certain Mitchell-Lama, limited dividend, redevelopment companies, Section 213 co-ops, or HDFC co-op apartments.
- Must pay at least one-third (1/3) of household income toward rent.
- Must be named on the lease or rent order.
- Primary residence in NYC (for NYC program).

**Benefits:** Freezes rent at current level and exempts tenant from future legal rent increases (e.g., guideline increases); landlord receives equivalent property tax abatement credit (TAC) to offset forgone increases.

**How to apply:**
- Online: Visit the Rent Freeze Program page on NYC.gov/Finance (linked from https://www.nyc.gov/site/finance/property/landlords-scrie.page).
- Mail/In-person: SCRIE Exemption Unit, NYC Department of Finance (DOF), 59 Maiden Lane, 19th Floor, New York, NY 10038.
- Phone: Contact NYC311 for guidance (specific SCRIE line not listed; use 311 for Rent Freeze Program assistance).
- Renewal: Renewal application mailed ~60 days before expiration.

**Timeline:** Not specified in sources; apply promptly as benefits do not start until approval.

**Watch out for:**
- Must apply to receive benefits—rent does not freeze automatically even if eligible.
- Landlord cannot refuse but must be notified post-approval; tenant pays frozen amount.
- Limited to specific housing types (rent-regulated or listed co-ops)—not market-rate or most private rentals.
- Requires recertification/renewal; income must remain under limit.
- Outside NYC, availability and rules vary—check local adoption.
- Succession upon death/move has strict 6-month deadline in some areas.

**Data shape:** NYC-focused with income fixed at $50,000 cap (may vary by household); housing-type restricted; landlord tax credit offsets costs; municipal opt-in outside NYC leads to regional income tables and forms.

**Source:** https://www.nyc.gov/site/finance/property/landlords-scrie.page

---

### Senior Citizen Homeowners' Exemption (SCHE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Combined annual income of all owners and spouses cannot exceed $58,399. Reduction tiers: $0-$50,000 (50%), $50,001-$50,999 (45%), $51,000-$51,999 (40%), $52,000-$52,999 (35%), $53,000-$53,899 (30%), $53,900-$54,799 (25%), $54,800-$55,699 (20%), $55,700-$56,599 (15%), $56,600-$57,499 (10%), $57,500-$58,399 (5%). Income includes Social Security, retirement benefits, interest, dividends, IRA earnings, capital gains, net rental income, salary, wages, net self-employment income. Calculated as AGI minus taxable IRA distributions; prior recipients (pre-July 1, 2024) may estimate total income minus IRA distributions and deduct unreimbursed medical expenses.[1][2][3]
- Assets: No asset limits.
- All owners must be 65+ unless spouses or siblings (then only one needs to be 65+).
- Own the property for at least 12 consecutive months prior to filing (unless had exemption on prior residence).
- Property must be primary residence (1-3 family homes, co-ops, condos); all owners occupy as primary except divorce/separation/abandonment or in-patient care at health facility.
- Property used exclusively residential (exemption prorated if partial non-residential use).

**Benefits:** Reduces assessed value of primary residence by 5%-50% based on income tiers, lowering property taxes. Applies to 1-3 family homes, co-ops, condos in NYC.[1][2][3]
- Varies by: income

**How to apply:**
- Online: https://a836-pts-efile.nyc.gov/SmartFile/Filing/FilingType/Info/NYC_SCHE (initial and renewal Sep 15-Mar 15).[2][8]
- Paper renewal: Notice from Dept of Finance; applications available soon after notice.[2]
- Contact NYC Dept of Finance for assistance (specific phone not listed; video tutorial at NYS Office for Aging/NYC DOF resources).[7]

**Timeline:** Not specified in sources.

**Watch out for:**
- Must renew every 2 years or lose benefit; notice sent but check mail/online.[2]
- All owners' incomes combined, including non-resident ex-spouse post-divorce excluded.[2][4]
- 12-month ownership strict unless prior exemption; residency must be primary.[1][2][4]
- Income from all sources; AGI minus IRA but details matter for prior recipients.[2]
- Not automatic; apply even if close to limits due to sliding scale.[1][3]
- Outside NYC, check local rules—income caps vary widely.[4]

**Data shape:** NYC-only fixed sliding scale by income (5-50%); statewide optional/localized with variable caps; renewal every 2 years; no assets test.

**Source:** https://www.nyc.gov/site/finance/property/landlords-sche.page

---

### Enhanced STAR (School Tax Relief for Seniors)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Combined income of owners and owners' spouses residing at the property must be $110,750 or less (based on 2024 income for 2026 benefit year). Income of non-resident owners is not included. Limit applies regardless of household size; no variation by household size or number of people. Older sources cite lower limits like $107,300 or $92,000, but current for 2026 is $110,750.[1][5][8]
- Assets: No asset limits; not applicable.[1]
- Only one resident owner (regardless of relationship to other owners) must be at least 65 years old as of December 31 of the benefit year. Surviving spouses may retain eligibility.
- Property must be owned by the eligible applicant(s).
- Property must be the primary residence of an eligible owner.
- Income based on prior year tax return (e.g., 2024 income for 2026 benefit).

**Benefits:** Increased property tax exemption or credit on school taxes compared to Basic STAR. Exact savings depend on local school tax rates and assessed property value; provides greater savings than Basic STAR (specific dollar amount varies by property and locality, e.g., scales with 2% yearly increase in some areas).[1][3][4]
- Varies by: region

**How to apply:**
- Online: www.tax.ny.gov/star
- Phone: (518) 457-2036
- For existing Basic STAR exemption holders becoming eligible (e.g., turning 65): NYS Department of Taxation and Finance automatically determines eligibility starting 2026 and contacts you; no assessor application needed.[3][5]
- Prior to 2026 or for upgrades: Apply to local assessor with forms (may vary by locality).

**Timeline:** NYS Tax Department handles eligibility; local assessors verify first year if applicable. No specific statewide timeline stated; check with local assessor for exact due dates (e.g., prior to March 1 for current year eligibility).[5][6]
**Waitlist:** No waitlist; benefit applies to eligible tax year upon approval.[1]

**Watch out for:**
- Must turn 65 by December 31 of the benefit year; apply before March 1 while still 64 to capture full year.
- Income includes only resident owners/spouses; non-resident owner income excluded.[1]
- Automatic upgrade from Basic STAR starts 2026—NYS contacts you, but verify eligibility.
- Existing STAR exemption holders as of 2015-16 may have different upgrade paths in some areas.[2]
- Income limits update annually (e.g., $110,750 for 2026 based on 2024 income); use most recent.[5][8]

**Data shape:** Income limit fixed regardless of household size; automatic eligibility determination by NYS starting 2026 eliminates local assessor applications for upgrades; benefits vary by local tax rates and property value.

**Source:** https://www.tax.ny.gov/pit/property/star/eligibility.htm

---

### NYS Supportive Housing Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits or tables by household size mentioned in program sources; eligibility focuses on homelessness status, disabling conditions, and priority populations rather than income thresholds[1][2][3][5].
- Assets: No asset limits, counting rules, or exemptions specified in sources[1][2][3][5].
- Must be homeless or at serious risk of homelessness, with a serious and persistent mental health condition (e.g., Major Depression, Bipolar disorder, Schizophrenia) for NY/NY I/II[1][5].
- For NY/NY III: Chronically homeless (homeless at least 1 year in past 2 years or 2 of past 4 years) plus mental health condition[1][5].
- Chronically homeless families or at risk, where head of household has serious mental health issue, substance abuse disorder, disabling medical condition, or HIV/AIDS[1].
- Single adults from NYS-operated psychiatric centers or transitional residences at risk of homelessness without supportive housing[1][5].
- Homeless single adults post-substance abuse treatment at risk of relapse/homelessness[1].
- Young adults 18-25 with serious mental health conditions from state facilities, at risk of homelessness[1].
- Single young adults 18-25 with high service utilization, homeless/at risk, including aging out of foster care[1].
- Pregnant young adults or heads of household 18-25 with high service utilization[1].
- Empire State Supportive Housing Initiative (ESSHI): Homeless individuals/families/young adults with unmet housing needs and one or more disabling conditions or life challenges[1][7].
- For NYC-specific: Homeless 14 of last 60 days with serious mental illness (SMI) or SMI + substance use disorder (SUD); chronic homelessness per HUD for some tiers; families meeting HUD homelessness definition[2][3].
- Youth/families: Multiple moves, limited education/employment, trauma, foster care history, domestic violence, etc., plus risk factors[2][3].
- Seniors 55+ identified as a population, but no elderly-specific criteria detailed beyond general supportive housing[8].

**Benefits:** Permanent affordable housing (scattered-site, single-site, or Supportive SRO) combined with ongoing supportive services to enable independent living; services include tenancy support, rehabilitative/tenancy support (RTS) via Medicaid-reimbursable model, mental health/substance use treatment coordination, case management; no specific dollar amounts or weekly hours stated, tailored to needs like sustaining sobriety, community integration[1][5][7].
- Varies by: priority_tier

**How to apply:**
- NYC-specific: NYC Supportive Housing Application (via NYC CoC providers or DHS/HRA referral process)[2][3].
- Referrals from shelters, hospitals, psychiatric centers, Health Homes for high utilizers[2][3][5][6].
- No statewide centralized phone/website/form specified; contact local OMH Local Government Units (LGUs), providers, or Coalition for the Homeless for guidance[1][7].

**Timeline:** Not specified in sources.
**Waitlist:** Priority for longest homeless/chronic cases; waitlists exist with priority consideration (e.g., 'P' designation for priority in NY/NY)[3][5].

**Watch out for:**
- Primarily targets those with serious mental illness (SMI), substance use, or disabilities who are homeless/at risk; not designed for general elderly without these criteria, even if low-income[1][5].
- No high-level/24-hour care; for independent living with supports only (not like nursing homes)[4].
- Elderly (e.g., 55+ or 60+) may qualify under seniors population but must meet homelessness/disability criteria; NORC programs separate and require current residency in NORC area[4][8].
- Chronic homelessness often required for priority tiers (NY/NY III); not for housed seniors[1][5].
- NYC has more documented processes/forms; statewide relies on local referrals[2][3][7].
- Not income-based like Section 8; disability/homelessness-driven[1].

**Data shape:** Eligibility driven by homelessness duration, SMI/disabling conditions, and priority tiers (NY/NY I/II/III, ESSHI); no income/asset tests; NYC-specific detailed criteria/forms; statewide via OMH LGUs/providers with regional referral variations; includes seniors 55+ but not elderly-focused without homelessness/SMI.

**Source:** https://omh.ny.gov/omhweb/adults/supportedhousing/supportedhousingguidelines.html[7]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| New York State Home and Community-Based  | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | state | deep |
| Medicare Savings Program (MSP) | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Home Energy Assistance Program (HEAP) | benefit | state | deep |
| Weatherization Referral and Packaging Pr | benefit | federal | deep |
| Meals on Wheels (via Expanded In-Home Se | benefit | federal | deep |
| New York Foundation for Senior Citizens  | benefit | local | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Elderly Pharmaceutical Insurance Coverag | benefit | state | deep |
| Senior Citizen Rent Increase Exemption ( | resource | local | simple |
| Senior Citizen Homeowners' Exemption (SC | benefit | local | deep |
| Enhanced STAR (School Tax Relief for Sen | benefit | state | deep |
| NYS Supportive Housing Program | benefit | state | deep |

**Types:** {"benefit":12,"employment":1,"resource":1}
**Scopes:** {"state":6,"federal":5,"local":3}
**Complexity:** {"deep":12,"medium":1,"simple":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/NY/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **Individual care plan determined by interdisciplinary team; not fixed by tier or priority level**: 1 programs
- **household_size and income level (SNAP budget calculated individually for each household)[9]**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **region**: 2 programs
- **not_applicable**: 2 programs
- **income**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **New York State Home and Community-Based Services (HCBS) Waiver Programs**: Multiple waivers with varying targets (e.g., developmental disabilities all ages, children 0-20, seniors/physical disabilities 18+); county DDSO administration; ICF/nursing level of care; Medicaid financials with some income deeming waivers for kids; slot-limited with waitlists
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE eligibility and benefits are highly individualized based on care planning rather than tiered or formulaic. The program's defining feature is capitated financing (fixed monthly payment per member), which allows providers to deliver all necessary services rather than only reimbursable ones. Income and asset limits are not program-specific but follow Medicaid rules. Critical gap: specific New York State income/asset thresholds, processing timelines, application procedures, and complete provider directory are not available in search results and would require direct contact with New York State Medicaid or individual PACE organizations.
- **Medicare Savings Program (MSP)**: Four tiers with tiered income limits and benefits; no asset test; deductions for select premiums; QI first-come first-served; statewide but local admin.
- **Supplemental Nutrition Assistance Program (SNAP)**: SNAP in New York has a complex, tiered eligibility structure with different rules for seniors/disabled vs. other households. Income limits vary significantly by household size and whether household includes seniors/disabled. New York's expanded categorical eligibility (200% poverty threshold) is more generous than federal baseline. ESAP provides simplified access for qualifying seniors/disabled with no earned income. Benefits are individually calculated per household based on income and deductions, not fixed amounts. The program has multiple application pathways (standard, ESAP, NYSCAP) with different requirements and benefits.
- **Home Energy Assistance Program (HEAP)**: Benefits scale by household size, income tier, heating source, vulnerable member presence; county-specific processing (DSS vs. Aging offices); categorical eligibility bypasses income test for SNAP/TA/SSI recipients.
- **Weatherization Referral and Packaging Program (WRAP)**: Delivered via local HCR subgrantees with regional providers; priority-tiered access; income at 60% SMI with auto-eligibility via benefits; no age minimum but seniors prioritized; funding/waitlist varies heavily by region.
- **Meals on Wheels (via Expanded In-Home Services for the Elderly - EISEP)**: County-administered via local AAAs with varying providers, contacts, and waitlists; no fixed income/asset caps but sliding fees; Meals on Wheels integrated as one service among broader in-home supports; eligibility excludes Medicaid recipients
- **New York Foundation for Senior Citizens Respite Care Program**: NYC-restricted, non-Medicaid focus, caregiver relief via temporary services; no income/asset tables or quantified benefits in sources
- **Senior Community Service Employment Program (SCSEP)**: Federally authorized (Older Americans Act, DOL) but locally administered by multiple NY grantees with varying contacts/placements; income fixed at 125% FPL (varies by household size annually); priority-based enrollment; 20hr/wk training standard statewide
- **Elderly Pharmaceutical Insurance Coverage Program (EPIC)**: Two-tier structure (Fee Plan low-income, Deductible Plan higher-income) with sliding deductibles/fees by income; wraps around Medicare Part D; no assets test; statewide with no regional variation.
- **Senior Citizen Rent Increase Exemption (SCRIE)**: NYC-focused with income fixed at $50,000 cap (may vary by household); housing-type restricted; landlord tax credit offsets costs; municipal opt-in outside NYC leads to regional income tables and forms.
- **Senior Citizen Homeowners' Exemption (SCHE)**: NYC-only fixed sliding scale by income (5-50%); statewide optional/localized with variable caps; renewal every 2 years; no assets test.
- **Enhanced STAR (School Tax Relief for Seniors)**: Income limit fixed regardless of household size; automatic eligibility determination by NYS starting 2026 eliminates local assessor applications for upgrades; benefits vary by local tax rates and property value.
- **NYS Supportive Housing Program**: Eligibility driven by homelessness duration, SMI/disabling conditions, and priority tiers (NY/NY I/II/III, ESSHI); no income/asset tests; NYC-specific detailed criteria/forms; statewide via OMH LGUs/providers with regional referral variations; includes seniors 55+ but not elderly-focused without homelessness/SMI.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New York?
