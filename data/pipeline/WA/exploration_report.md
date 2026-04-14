# Washington Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.115 (23 calls, 22.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 21 |
| Programs deep-dived | 21 |
| New (not in our data) | 14 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 9 programs
- **financial**: 5 programs
- **in_kind**: 4 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,463` ([source](https://www.washingtonlawhelp.org/medicare-savings-programs-help-paying-medicare-costs or https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/medicare-savings-programs))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premium (if applicable), Part B premium/deductible, coinsurance/copayments/deductibles for Medicare-covered A/B services. SLMB: Pays Part B premium. QI-1: Pays Part B premium. All auto-qualify for Extra Help (LIS) for Part D drugs (≤$12.65 copay per drug in 2026). QMB effective 1st of month after eligibility determination; SLMB/QI retroactive up to 3 months.[1][2][3][4][6]` ([source](https://www.washingtonlawhelp.org/medicare-savings-programs-help-paying-medicare-costs or https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/medicare-savings-programs))
- **source_url**: Ours says `MISSING` → Source says `https://www.washingtonlawhelp.org/medicare-savings-programs-help-paying-medicare-costs or https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/medicare-savings-programs`

### Basic Food Program (Washington State SNAP)

- **income_limit**: Ours says `$2212` → Source says `$2,608` ([source](https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Electronic Benefits Transfer (EBT) card with monthly food benefits. Maximum monthly benefit allotments as of the search results:[1]

| Household Size | Maximum Monthly Benefit |
|---|---|
| 1 person | $292 |
| 2 people | $536 |
| 3 people | $768 |
| 4 people | $975 |
| 5 people | $1,158 |

Actual benefits vary based on household income, living expenses (rent/mortgage, utilities, child care, child support), and other deductible expenses.[1]` ([source](https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program))
- **source_url**: Ours says `MISSING` → Source says `https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Grants to help pay heating, cooling, or electric bills; emergency services during energy crisis; may prevent shutoffs. Exact grant amounts not specified statewide—varies by provider, household income, fuel usage (e.g., past 12 months in some regions), and other factors.[1][2][6]` ([source](https://www.commerce.wa.gov/community-opportunities/liheap/[1]))
- **source_url**: Ours says `MISSING` → Source says `https://www.commerce.wa.gov/community-opportunities/liheap/[1]`

### Health Insurance Counseling and Advocacy Program (HICAP/SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, personalized, unbiased, confidential one-on-one counseling (in-person or phone); education on Medicare Parts A/B/C/D, Medigap, enrollment, appeals, reducing costs; help applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help); group presentations and outreach events; fraud prevention via Senior Medicare Patrol in many areas[1][2][3]` ([source](https://www.shiphelp.org/ships/washington/[5]))
- **source_url**: Ours says `MISSING` → Source says `https://www.shiphelp.org/ships/washington/[5]`

### Home Delivered Meals

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritionally balanced home-delivered meals (e.g., one meal per day or per delivery; weekly or semi-weekly delivery). Specifics: Sound Generations - one meal per day, suggested donation $6.50/meal; Mom's Meals - meals at $9.49 or less if purchased, free/reduced via programs; O3A - meals to homebound seniors.` ([source](https://app.leg.wa.gov/wac/default.aspx?cite=388-473-0020 (WAC 388-473-0020 for Medicaid); agingkingcounty.org or similar AAAs for OAA programs))
- **source_url**: Ours says `MISSING` → Source says `https://app.leg.wa.gov/wac/default.aspx?cite=388-473-0020 (WAC 388-473-0020 for Medicaid); agingkingcounty.org or similar AAAs for OAA programs`

### Family Caregiver Support Program

- **min_age**: Ours says `60` → Source says `Care recipient 18+; caregiver typically 18+[6]` ([source](https://www.adsa.dshs.wa.gov/caregiving))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Find local resources/services; caregiver support groups and counseling; training on caregiving topics or supplies/equipment; respite care; practical information and suggestions[6]` ([source](https://www.adsa.dshs.wa.gov/caregiving))
- **source_url**: Ours says `MISSING` → Source says `https://www.adsa.dshs.wa.gov/caregiving`

### Washington State Long-Term Care Ombudsman Program (LTCOP)

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free complaint investigation, resolution, and advocacy; information about resident rights; assistance with quality of care issues, restraint use, transfers/discharges, abuse, discrimination, and financial exploitation` ([source](waombudsman.org))
- **source_url**: Ours says `MISSING` → Source says `waombudsman.org`

## New Programs (Not in Our Data)

- **Apple Health** — service ([source](https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-care/apple-health-medicaid-apple-health-elderly-blind-disabled))
  - Shape notes: Income at 138% FPL with household size table; asset limits for elderly/disabled categories; varies by age/disability/Medicare status; statewide but MCO selection required.
- **Medicaid Personal Care (MPC) Program** — service ([source](https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/apple-health-medicaid-washington (HCA main site); WAC 182-513-1225 for rules))
  - Shape notes: No NFLOC required (unlike nursing/waiver programs); functional eligibility via CARE tool only; benefits in community settings only; scales by assessed need, not household size; administered statewide but local DSHS/provider variations.
- **Medicaid Alternative Care (MAC) Waiver** — service ([source](Washington Administrative Code § 182-513-1605 (https://www.law.cornell.edu/regulations/washington/WAC-182-513-1605); Washington State Department of Social and Health Services (DSHS) — specific URL not provided in sources.))
  - Shape notes: MAC is a home and community-based services (HCBS) waiver with strict eligibility criteria centered on age (55+), functional need (NFLOC), asset/income limits, and caregiver availability. The program is statewide but may have regional variations not detailed in available sources. Critically, the search results lack specific information on services provided, application procedures, processing times, required forms, and regional office locations — families will need to contact Washington DSHS directly for operational details. The program's defining feature is that it allows individuals who meet nursing home-level care needs to remain at home with an unpaid caregiver while receiving Medicaid-funded support, as an alternative to institutional placement.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/all-inclusive-care-elderly-washington-pace (state Medicaid site inferred; also https://www.dshs.wa.gov/altsa/home-and-community-services)))
  - Shape notes: Limited to specific PACE provider service areas (e.g., King County); no direct income/asset test for enrollment but tied to Medicaid/private pay; requires state DSHS certification for nursing facility level of care; not statewide
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.commerce.wa.gov/weatherization/))
  - Shape notes: Administered county-by-county through local agencies with no centralized application; eligibility uses max of three income metrics (200% FPL, 60% SMI, 80% AMI); priority tiers favor elderly and vulnerable households
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors[1]))
  - Shape notes: Administered by multiple regional grantees (e.g., AARP Foundation, WorkSource); priority-based enrollment; income at 125% FPL with no asset test specified; 20 hours/week training pay at min wage; no statewide uniform processing times or forms
- **Legal Aid for Seniors** — service ([source](https://nwjustice.org/clear-hotline))
  - Shape notes: Seniors 60+ often no income test statewide via NJP/CLEAR*Sr, but regional delivery via county partners; services priority on basic needs civil legal issues
- **Washington State Parks Senior Citizen Limited Income Pass** — in_kind ([source](https://benefitscheckup.org/program/discount_wa_state_park_disc_pass (information aggregator); Washington State Parks and Recreation Commission official website (specific URL not provided in search results)))
  - Shape notes: This program has a simple, fixed benefit structure with no tiering or household-size variation. The primary eligibility gates are age (62+), household income ($40,000 or less), Washington residency (3+ consecutive months), and property tax exemption status if applicable. A critical distinction exists between the free Senior Citizen Limited Income Pass (year-round, 50% discounts) and the paid Off-Season Senior Citizen Pass ($75, free camping in off-season months). The pass does not extend to state lands managed by other agencies, which is a common point of confusion.
- **Lifetime Disabled Veteran Pass** — in_kind ([source](https://wdfw.wa.gov/accessibility/eligibility-requirements-veterans-reduced-fees (referenced in results); primary application via parks.wa.gov))
  - Shape notes: No income or asset tests; fixed eligibility based on 30%+ VA service-connected rating and WA residency; statewide uniform access with acceptance at select county sites; documentation-heavy with recent VA letter requirement
- **Washington Charity Care Program** — financial ([source](Washington State Department of Health Charity Care information: https://www.doh.wa.gov/ (search 'Charity Care'); statewide hospital policy list available through DOH; individual hospital policies on hospital websites))
  - Shape notes: Washington Charity Care is a decentralized, hospital-specific program rather than a single centralized program. Benefits and eligibility scale by household size and federal poverty level, with variation by hospital classification and individual hospital policy. The program is mandatory for all licensed hospitals but lacks a single statewide application process, income table, or processing timeline. Eligibility is income-based with asset considerations, but specific asset limits are hospital-determined. No age requirement exists, making it potentially relevant for elderly patients of any age. The program is notable for covering both insured and uninsured patients and for not restricting eligibility based on citizenship.
- **Housing and Essential Needs (HEN) Referral Program** — service ([source](https://www.law.cornell.edu/regulations/washington/WAC-388-400-0070 (primary reg); washingtonconnection.org (apply)))
  - Shape notes: Referral-based only (DSHS gates eligibility, Commerce providers deliver); benefits case-by-case via county providers with funding caps/waitlists; tied to ABD/incapacity cash assistance rules; regional provider variations and no fixed benefit amounts.
- **Aged, Blind, or Disabled (ABD) Cash Assistance Program** — financial ([source](https://www.dshs.wa.gov/esa/community-services-offices or WAC 388-400-0060 (https://www.law.cornell.edu/regulations/washington/WAC-388-400-0060)))
  - Shape notes: Interim bridge to SSI with mandatory payback; benefits scale by household size (single/couple); uniform statewide rules via DSHS CSOs but local admin; no income table in sources—refer to WAC 388-478-0090.
- **WA Cares Fund** — financial ([source](https://wa-cares.esd.wa.gov/ (inferred primary ESD site based on context; confirm via ESD)))
  - Shape notes: No income/asset test; eligibility tied to payroll contributions and work hours via three vesting pathways; exemptions can block benefits; statewide for WA workers
- **Seattle Gold Card (Age-Friendly Discount Program)** — in_kind ([source](https://www.seattle.gov/agefriendly/about/discount-program))
  - Shape notes: No income or asset test; residency broadly defined across King County/WA; discounts vary by participating businesses only (no fixed dollar/hour value); multiple easy access points including libraries; pairs with FLASH for disabilities.

## Program Details

### Apple Health

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For Apple Health for the Aged, Blind, or Disabled (relevant for elderly): Monthly income limits are $967 for a single person and $1,450 for a 2-person household. For general adult expansion (19+), countable household income must be at or below 138% of the Federal Poverty Level (FPL). Example 138% FPL limits (King County table, subject to annual change): 1-person household: $1,835/month ($22,025/year); 2-person: $2,490/month ($29,863/year); 3-person: $3,142/month ($37,702/year); 4-person: $3,795/month ($45,540/year); 5-person: $4,449/month ($53,378/year); 6-person: $5,102/month ($61,217/year).[1][3]
- Assets: Resources (assets) are considered for Apple Health for the Aged, Blind, or Disabled and adults 65+ (except Apple Health for Workers with Disabilities). Specific asset limits and what counts/exempts not detailed in sources; eligibility determined by household income and resources. Contact DSHS for details.[1]
- Washington resident.
- U.S. citizen or meets Medicaid immigration requirements (some coverage available regardless of status for certain groups).
- For aged 65+: Some Medicare recipients eligible for help with premiums or long-term services.
- Not entitled to Medicare (for some adult categories).
- For Aged, Blind, or Disabled: Must meet disability criteria.

**Benefits:** Comprehensive health coverage including Essential Health Benefits: hospitalization, prescriptions, preventative and wellness services, chronic disease management, pediatric services (if applicable), maternity and newborn care. Medicare recipients may get free/low-cost coverage, Medicare premium help, or long-term services and supports. Managed Care Organizations (MCOs) provide coverage plus Value Added Benefits.[1][3]
- Varies by: priority_tier

**How to apply:**
- Online: Washington Healthplanfinder (wahealthplanfinder.org).
- Phone: 1-800-318-2596 (24 hours); For 65+ or Aged/Blind/Disabled: 1-877-501-2233 (DSHS).
- Through HealthCare.gov or state exchange.

**Timeline:** Not specified in sources; open year-round with renewal notices 60 days prior.[3]
**Waitlist:** For undocumented adults: Enrollment cap of 13,000 as of July 2024 due to state funding limits (federal funding unavailable).[2]

**Watch out for:**
- Income standards change annually every April; verify current limits.[1]
- Asset tests apply for elderly/disabled (not all categories); Medicare status affects eligibility.[1]
- Public charge rule does not apply; won't affect immigration status.[1]
- Undocumented adults face enrollment cap.[2]
- Some programs require DSHS screening after Healthplanfinder application.[4]
- Continuous eligibility for young children, but not specified for elderly.

**Data shape:** Income at 138% FPL with household size table; asset limits for elderly/disabled categories; varies by age/disability/Medicare status; statewide but MCO selection required.

**Source:** https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-care/apple-health-medicaid-apple-health-elderly-blind-disabled

---

### Medicaid Personal Care (MPC) Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be financially eligible for noninstitutional categorically needy (CN) or alternative benefits plan (ABP) Washington Apple Health (Medicaid). Specific dollar amounts vary by program and household; for example, single applicants often face limits around $943-$2,982/month depending on care level, but exact MPC thresholds align with non-institutional Medicaid (e.g., ~$771/month for some home care waivers, $1,157 for couples). No full household table specified for MPC; use WA Medicaid eligibility test for precise FPL-based limits (typically <138% FPL).[1][3][4][5][6]
- Assets: Typically $2,000 for single applicants (countable assets only). Home is exempt if applicant lives there, intends to return, spouse resides there, or dependent/disabled child lives there. Other exemptions may apply per WA Medicaid rules; consult state for full list.[1][2][3]
- Washington state resident
- US citizen or qualified immigrant
- Functionally eligible via CARE assessment: extensive assistance with 1 ADL (e.g., hygiene, dressing, toileting, transferring, mobility) OR minimal assistance/supervision with 3+ ADLs. Cognitive impairments (e.g., dementia-related) may qualify but diagnosis alone insufficient.
- Does NOT require Nursing Facility Level of Care (NFLOC); program unavailable to those needing NFLOC.
- Elderly (65+) or disabled

**Benefits:** Personal care assistance with Activities of Daily Living (ADLs) such as personal hygiene, dressing, toileting, transferring, mobility. Provided in home, contracted adult family home (AFH), or licensed assisted living (room/board paid by client up to standard). No fixed dollar amount or hours specified; authorized based on CARE assessment.
- Varies by: priority_tier

**How to apply:**
- Apply for Washington Apple Health (Medicaid) first: online at https://www.wahealthplanfinder.org, phone 1-855-923-4633, mail/paper form, or in-person at local DSHS Community Service Office (find via https://www.dshs.wa.gov/find-an-office)
- Functional assessment via CARE tool follows eligibility; contact local Area Agency on Aging or DSHS for scheduling

**Timeline:** Not specified in sources; standard Medicaid applications processed in 45 days (90 for disability).
**Waitlist:** Not mentioned for MPC; may vary by provider availability.

**Watch out for:**
- MPC is ONLY for those NOT needing NFLOC; higher-need individuals go to waivers like CFCO instead—common mix-up.[1][3]
- Home equity/ownership exemptions apply, but intent to return must be documented.
- Must first qualify for non-institutional Medicaid; income mostly pays room/board in facilities.
- Dementia diagnosis doesn't auto-qualify; needs CARE-assessed ADL deficits.
- Personal Needs Allowance retained (~$108/month in some cases), but most income offsets costs.

**Data shape:** No NFLOC required (unlike nursing/waiver programs); functional eligibility via CARE tool only; benefits in community settings only; scales by assessed need, not household size; administered statewide but local DSHS/provider variations.

**Source:** https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/apple-health-medicaid-washington (HCA main site); WAC 182-513-1225 for rules

---

### Medicaid Alternative Care (MAC) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Single applicant: $2,982/month[4]. For married couples, the applicant's income is counted toward this limit; the non-applicant spouse's income is not counted. Married recipients must contribute most of their income to the state, retaining only $108.74/month as a personal needs allowance plus enough for Medicare premiums and any spousal income allowance payments to financially needy non-enrolled spouses[4].
- Assets: Single applicant: $2,000 in countable assets[4]. Exempt (non-countable) assets include: primary home (if applicant lives in it, intends to return to it, spouse lives in it, or dependent relative lives in it)[3], household furnishings and appliances, personal effects, and one vehicle[2]. Critical: Assets cannot be given away or sold below fair market value within 60 months of application; violating this Look-Back Rule triggers a Penalty Period of Medicaid ineligibility[2].
- Must be assessed as meeting Nursing Facility Level of Care (NFLOC) under Washington's assessment criteria[1]
- Must choose MAC services instead of other long-term services and supports[1]
- Must meet Washington State residency requirements[1]
- Must live at home and not in a residential or institutional setting[1]
- Must have an eligible unpaid caregiver (age 18+; caregiver does not need to be a Washington resident)[1][3]
- Must meet citizenship and immigration status requirements[1]
- Must be eligible for a non-institutional Medicaid program (cannot have eligibility limited only to medically needy, Medicare savings programs, family planning, MCS, or alien emergency medical programs)[1]

**Benefits:** The search results do not specify the exact services, dollar amounts, or hours provided under MAC. The program is described as an alternative to nursing home placement that allows eligible individuals to receive long-term services and supports while remaining at home with an unpaid caregiver[3]. Related Washington waivers (COPES, Residential Support) provide services such as adult day health, skilled nursing, home delivered meals, environmental modifications, and transportation[5], but MAC-specific service details are not provided in available sources.
- Varies by: not_applicable (specific variation data not available in sources)

**How to apply:**
- T
- h
- e
-  
- s
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
- U
- R
- L
- s
- ,
-  
- o
- r
-  
- o
- f
- f
- i
- c
- e
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
-  
- f
- o
- r
-  
- M
- A
- C
- .
-  
- S
- o
- u
- r
- c
- e
- s
-  
- r
- e
- c
- o
- m
- m
- e
- n
- d
-  
- c
- o
- n
- t
- a
- c
- t
- i
- n
- g
-  
- W
- a
- s
- h
- i
- n
- g
- t
- o
- n
-  
- S
- t
- a
- t
- e
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
- S
- o
- c
- i
- a
- l
-  
- a
- n
- d
-  
- H
- e
- a
- l
- t
- h
-  
- S
- e
- r
- v
- i
- c
- e
- s
-  
- (
- D
- S
- H
- S
- )
-  
- o
- r
-  
- c
- o
- n
- s
- u
- l
- t
- i
- n
- g
-  
- t
- h
- e
-  
- A
- m
- e
- r
- i
- c
- a
- n
-  
- C
- o
- u
- n
- c
- i
- l
-  
- o
- n
-  
- A
- g
- i
- n
- g
- '
- s
-  
- M
- e
- d
- i
- c
- a
- i
- d
-  
- E
- l
- i
- g
- i
- b
- i
- l
- i
- t
- y
-  
- T
- e
- s
- t
-  
- p
- r
- i
- o
- r
-  
- t
- o
-  
- a
- p
- p
- l
- y
- i
- n
- g
- [
- 3
- ]
- ,
-  
- b
- u
- t
-  
- e
- x
- a
- c
- t
-  
- c
- o
- n
- t
- a
- c
- t
-  
- i
- n
- f
- o
- r
- m
- a
- t
- i
- o
- n
-  
- a
- n
- d
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
- r
- o
- u
- t
- e
- s
-  
- a
- r
- e
-  
- n
- o
- t
-  
- i
- n
- c
- l
- u
- d
- e
- d
- .

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- MAC requires an unpaid caregiver — this is not optional. Without an eligible caregiver, the applicant cannot qualify, even if all other criteria are met[1][3].
- The 60-month Look-Back Rule is critical: any assets given away or sold below fair market value within 60 months of application trigger a Penalty Period of Medicaid ineligibility[2]. Families often miss this and inadvertently disqualify themselves.
- Home ownership is exempt only under specific conditions: applicant lives in it, intends to return to it, spouse lives in it, or dependent relative lives in it[3]. If none of these apply, the home counts as an asset and may exceed the $2,000 limit.
- MAC is an alternative to other long-term services and supports (COPES Waiver, CFC Program)[3]. Applicants must choose MAC instead of these programs; they cannot receive MAC and another waiver simultaneously.
- Applicants must meet Nursing Facility Level of Care (NFLOC) — this is assessed using the Comprehensive Assessment Reporting Evaluation (CARE) tool and requires either daily nursing care OR substantial assistance with at least 2 ADLs (or some assistance with 3+ ADLs)[3]. A diagnosis alone (e.g., dementia) does not automatically qualify[2].
- Medicaid eligibility is a prerequisite; applicants cannot qualify for MAC if their eligibility is limited only to medically needy, Medicare savings programs, family planning, MCS, or alien emergency medical programs[1].
- The search results do not provide specific application procedures, processing times, or waitlist information — families will need to contact DSHS directly for these critical details.

**Data shape:** MAC is a home and community-based services (HCBS) waiver with strict eligibility criteria centered on age (55+), functional need (NFLOC), asset/income limits, and caregiver availability. The program is statewide but may have regional variations not detailed in available sources. Critically, the search results lack specific information on services provided, application procedures, processing times, required forms, and regional office locations — families will need to contact Washington DSHS directly for operational details. The program's defining feature is that it allows individuals who meet nursing home-level care needs to remain at home with an unpaid caregiver while receiving Medicaid-funded support, as an alternative to institutional placement.

**Source:** Washington Administrative Code § 182-513-1605 (https://www.law.cornell.edu/regulations/washington/WAC-182-513-1605); Washington State Department of Social and Health Services (DSHS) — specific URL not provided in sources.

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; financial eligibility aligns with Medicaid or private pay options. For Medicaid-funded PACE in Washington, follows CFC/COPES guidelines (income under 300% FBR, approximately $2,901/month for 2025, but private pay available at Medicaid rate if not Medicaid-eligible). No dollar amounts vary by household size specified for PACE directly[3][5].
- Assets: No asset limits for PACE enrollment itself. For Medicaid pathway, assets $2,000 or less (excluding primary home); Medicaid planning available to qualify[3].
- Live in the service area of a PACE organization (e.g., most of King County for Providence PACE)
- Certified by Washington state (DSHS) as needing nursing home level of care (e.g., assistance with 2+ ADLs like bathing, dressing, grooming, ambulation, transfers, medication management)
- Able to live safely in the community with PACE services at time of enrollment
- Medicaid eligible, Medicare eligible, or able to pay privately (equal to Medicaid rate)
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice

**Benefits:** Comprehensive medical and social services including all Medicare/Medicaid-covered care plus additional medically necessary services: doctor visits, lab tests, diagnostics, prescriptions/OTC meds, medical supplies/equipment, adult day health care, transportation, home care, personal care, therapies (PT/OT/ST), social services, meals, dentistry, optometry, podiatry, assistive devices. No co-pays/deductibles. Provided by interdisciplinary team to enable community living instead of nursing home[1][2][5][6].
- Varies by: region

**How to apply:**
- Contact local Home and Community Services (HCS) office for assessment (per WA Admin Code)[7]
- Call Providence PACE: 206-320-5325 or 1-844-901-0094 (TTY: 1-800-735-2900)[5]
- In-person or phone assessment by DSHS social worker for nursing home level of care certification

**Timeline:** Not specified in sources
**Waitlist:** Possible due to capped financing; varies by program and state[4]

**Watch out for:**
- Not statewide—must live in (or relocate to) a PACE service area like King County[5]
- Nursing home level of care certification required by DSHS social worker, not automatic[5][7]
- Becomes sole source of Medicare/Medicaid services; cannot be in Medicare Advantage, hospice, or certain other plans[1][2]
- Private pay option exists but equals full Medicaid rate if not Medicaid-eligible[5]
- Voluntary but waitlists possible due to funding caps[4]
- If on CFC/COPES, participation levels stay similar[5]

**Data shape:** Limited to specific PACE provider service areas (e.g., King County); no direct income/asset test for enrollment but tied to Medicaid/private pay; requires state DSHS certification for nursing facility level of care; not statewide

**Source:** https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/all-inclusive-care-elderly-washington-pace (state Medicaid site inferred; also https://www.dshs.wa.gov/altsa/home-and-community-services)

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be eligible for Medicare Part A (typically age 65+ or disabled). Washington-specific 2026 monthly countable income limits after deductions: QMB ≤ $1,463 single / $1,984 couple (110% FPL); SLMB ≤ $1,596 single / $2,167 couple (120% FPL); QI-1 ≤ $1,835 single / $2,489 couple (138% FPL). Limits update annually, often April 1, based on Federal Poverty Level (FPL). Household size beyond couples not detailed in sources; primarily individual or couple.[3][4]
- Assets: No asset/resource limits in Washington state as of January 1, 2023, for individuals or couples.[3]
- Eligible for Medicare Part A (even if not enrolled for QMB).
- Must have Part A and Part B for SLMB/QI.
- Cannot receive QI-1 or QDWI if eligible for another Medicaid program.
- U.S. citizen or qualified immigrant.
- Washington resident.

**Benefits:** QMB: Pays Medicare Part A premium (if applicable), Part B premium/deductible, coinsurance/copayments/deductibles for Medicare-covered A/B services. SLMB: Pays Part B premium. QI-1: Pays Part B premium. All auto-qualify for Extra Help (LIS) for Part D drugs (≤$12.65 copay per drug in 2026). QMB effective 1st of month after eligibility determination; SLMB/QI retroactive up to 3 months.[1][2][3][4][6]
- Varies by: program_tier

**How to apply:**
- Online: Washington Connection portal at https://www.washingtonconnection.org/home/ (state Medicaid agency).
- Phone: Washington Health Care Authority at 1-800-562-3022.
- Mail or in-person: Local Community Services Office (CSO) or Area Agency on Aging; find via https://www.dshs.wa.gov/esa/community-services-offices.
- Through King County-specific outreach: https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/medicare-savings-program.[3]

**Timeline:** QMB: Up to 45 days, effective 1st of following month. SLMB/QI: Similar, with up to 3 months retroactive.[1][2]
**Waitlist:** QI-1: First-come, first-served with priority to prior-year recipients; limited federal funding may create waitlist.[1][6]

**Watch out for:**
- Income is countable after deductions (e.g., $20 general disregard, $65 earned income, impairment-related); overestimating gross income leads to denials.[2][4]
- QI-1 has waitlist risk due to federal funding caps and annual reapplication.[1][6]
- QMB providers cannot bill beneficiary for Medicare-covered services (no cost-sharing), but people miss reporting QMB status to doctors.[1]
- Can overlap with other Medicaid but not vice versa for QI.[4]
- Limits higher than federal standards in WA (no assets, higher % FPL).[3][4]
- Apply to state Medicaid agency, not Medicare directly.[1][6]

**Data shape:** Tiered by program (QMB/SLMB/QI-1) with escalating income thresholds; WA eliminates asset test and uses higher FPL % than federal; benefits fixed by tier not household size beyond couple; QI waitlist/priority; retroactive for SLMB/QI.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.washingtonlawhelp.org/medicare-savings-programs-help-paying-medicare-costs or https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-help/medicare-savings-programs

---

### Basic Food Program (Washington State SNAP)


**Eligibility:**
- Income: Household income must be at or below 200% of the Federal Poverty Level (FPL). As of April 1, 2025, the monthly income limits are:[1][3][4]

| Household Size | Monthly Income Limit |
|---|---|
| 1 person | $2,608 |
| 2 people | $3,525 |
| 3 people | $4,442 |
| 4 people | $5,358 |
| 5 people | $6,275 |
| 6 people | $7,192 |
| 7 people | $8,108 |
| 8 people | $9,025 |
| Each additional person | add $917 |

For reference, 200% of FPL for a family of four in 2025 equals $64,300 annually.[2]
- Assets: Resources such as a house, car, or money in the bank DO NOT count against eligibility.[3]
- U.S. citizenship or lawful residency (must meet 5-year residency requirement for some non-citizens)[1]
- If non-citizen with U.S. citizen children, children may be eligible[1]
- Work requirement: Starting July 2025, individuals aged 18–64 must work at least 80 hours per month (approximately 20 hours per week) to qualify, with exceptions for those with children under age 14[3][5]
- Exceptions to work requirements include: parents with children under 14, participants in SNAP Employment & Training (BFET) programs, or those combining qualifying activities (paid employment, self-employment, volunteering, bartering, or training)[5]
- Must agree to participate in Food Assistance work and training program if applicable[1]
- Residency in Washington State required[1]

**Benefits:** Electronic Benefits Transfer (EBT) card with monthly food benefits. Maximum monthly benefit allotments as of the search results:[1]

| Household Size | Maximum Monthly Benefit |
|---|---|
| 1 person | $292 |
| 2 people | $536 |
| 3 people | $768 |
| 4 people | $975 |
| 5 people | $1,158 |

Actual benefits vary based on household income, living expenses (rent/mortgage, utilities, child care, child support), and other deductible expenses.[1]
- Varies by: household_size, income, and living expenses

**How to apply:**
- Online: www.washingtonconnection.org[2]
- Phone: Help Me Grow Washington Hotline at 1-800-322-2588[2]
- In-person: Local Community Services Office (interview required after application submission)[2]
- Mail: Complete application and mail with required documents (specific mailing instructions provided with application form)[1]

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Work requirement expansion (July 2025): Adults aged 18–64 must now work at least 80 hours per month to qualify, with limited exceptions. This is a significant change that affects many working-age adults.[3][5]
- Immigrant eligibility restrictions (December 2025): New federal work requirements under H.R. 1 remove eligibility for refugees, asylum seekers, and immigrants with humanitarian protections as of December 1, 2025.[5]
- Vulnerable groups now subject to work requirements: Veterans, young adults aging out of foster care, people experiencing homelessness, and parents with children over age 14 are no longer exempt from work requirements.[5]
- Income is gross income (before taxes/deductions), not net income.[2]
- Resources (house, car, savings) do NOT disqualify you, but income does.[3]
- Unemployment alone does not disqualify you; the program is available to unemployed individuals, though work requirements now apply to most adults.[3]
- Interview is required after application submission; this is a mandatory step.[2]
- For elderly loved ones: Age is not a barrier to eligibility, but work requirements may apply if they are aged 18–64 and not already exempt (e.g., if they have a child under 14).[3][5]
- Estimated impact: As many as 170,300 Washingtonians could lose food assistance due to expanded work rules and immigrant eligibility changes under H.R. 1.[5]

**Data shape:** Benefits scale by household size and income. Income limits are uniform statewide and tied to 200% of Federal Poverty Level, which is adjusted annually. Work requirements create a two-tier system: those exempt (primarily parents with children under 14) and those subject to 80-hour monthly work verification. The program is administered through local Community Services Offices but with statewide uniform eligibility and benefit standards. Critical policy changes in July 2025 (work requirements) and December 2025 (immigrant eligibility) significantly alter who qualifies.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: 150% of the federal poverty level (FPL), varying by household size. Exact dollar amounts and full table available in the Eligibility Guidelines PDF from the Washington Department of Commerce. Eligibility determined by local providers.[1]
- Assets: No asset limits mentioned in state guidelines.[1]
- Reside in Washington state.
- Household has not received a LIHEAP grant during the current program year (October-September).
- Heating costs (considered as a factor).
- Household size.
- Final eligibility determined by local LIHEAP provider, not guaranteed by online guidelines.[1]

**Benefits:** Grants to help pay heating, cooling, or electric bills; emergency services during energy crisis; may prevent shutoffs. Exact grant amounts not specified statewide—varies by provider, household income, fuel usage (e.g., past 12 months in some regions), and other factors.[1][2][6]
- Varies by: priority_tier|region|household_size

**How to apply:**
- Contact local LIHEAP provider via county map for agency-specific scheduling (phone, in-person, or other methods vary by agency): https://wapartnership.org/services/energy-assistance-and-weatherization/.[2]
- No central state phone or online application; Department of Commerce does not schedule appointments.[1]
- Example regional: OlyCAP online application forms with docs (for specific counties).[4]

**Timeline:** Varies by provider; applicants notified as soon as possible, but high demand and limited staff cause delays (e.g., 'be patient' noted by OlyCAP).[4]
**Waitlist:** High demand may imply waitlists or delays, varying by region; no statewide waitlist specified.[1][4]

**Watch out for:**
- No central application—must contact and follow local provider's exact process; state does not schedule.[1]
- One grant per household per program year (Oct-Sep); cannot reapply until next year.[1]
- Documentation varies by provider—call ahead to avoid rejection.[1]
- High demand leads to processing delays; prioritize if facing disconnect (arrange payment plan first).[4]
- Eligibility not guaranteed by guidelines; final determination local.[1]
- Seasonal (e.g., 2025-2026 starts Oct 7, 2025 in some areas).[4]

**Data shape:** Decentralized: local providers handle applications with varying processes/docs; income at 150% FPL (table in PDF); benefits vary by region, fuel usage, tier; no statewide asset test or central hotline.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.commerce.wa.gov/community-opportunities/liheap/[1]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Up to the greater of 200% of the federal poverty level (FPL), 60% of the state median income (SMI), or 80% of the area median income (AMI). Exact dollar amounts vary by household size, year, and metric; contact local agency for current table as specific figures not listed in state guidance[2].
- Assets: No asset limits mentioned in Washington-specific guidance[2].
- Households must be homeowners or renters (with landlord approval for renters)[2][3]
- Eligibility determined by local weatherization agency based on income thresholds[2]
- Priority often given to households with elderly members, young children, or disabilities, though not a strict requirement[3][6]

**Benefits:** Comprehensive energy audit by certified professional, followed by cost-effective weatherization upgrades to improve home energy efficiency, health, and safety (e.g., insulation, air sealing, heating system repairs). No fixed dollar amount or hours; services based on audit results and available funding[2].
- Varies by: priority_tier

**How to apply:**
- Contact local weatherization agency by county (phone/email listed at https://www.commerce.wa.gov/weatherization/ )[2]
- No statewide online form; apply through county-specific providers (e.g., OIC of Washington for Adams County: 509-452-7145, be.r@oicofwa.org)[2]

**Timeline:** Not specified; varies by local agency[2].
**Waitlist:** Likely due to funding limits, but not detailed; contact local agency[2].

**Watch out for:**
- Must contact county-specific local agency—no central statewide application[2]
- Renters need landlord approval, which can delay or block services[2][3]
- Exact income eligibility requires local verification across 200% FPL, 60% SMI, or 80% AMI—may qualify under one even if not others[2]
- Priority for elderly/seniors but not guaranteed; funding-limited with possible waitlists[2][3]
- Not available if home in foreclosure or planned sale (general WAP rule)[1]

**Data shape:** Administered county-by-county through local agencies with no centralized application; eligibility uses max of three income metrics (200% FPL, 60% SMI, 80% AMI); priority tiers favor elderly and vulnerable households

**Source:** https://www.commerce.wa.gov/weatherization/

---

### Health Insurance Counseling and Advocacy Program (HICAP/SHIP)


**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all[2]
- Assets: No asset limits or tests apply[1][2]
- Eligible for Medicare (age 65+ or under 65 with disabilities), soon-to-be eligible for Medicare, family members, or caregivers of Medicare beneficiaries[1][2][3]

**Benefits:** Free, personalized, unbiased, confidential one-on-one counseling (in-person or phone); education on Medicare Parts A/B/C/D, Medigap, enrollment, appeals, reducing costs; help applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help); group presentations and outreach events; fraud prevention via Senior Medicare Patrol in many areas[1][2][3]

**How to apply:**
- Phone: 1-800-562-6900 (statewide SHIBA), TTY: 1-360-586-0241[5]
- Website: Washington SHIBA website (via shiphelp.org/ships/washington/)[5]
- In-person or phone through local SHIBA counselors (statewide network)[1][2][5]

**Timeline:** Immediate counseling available upon contact; no formal application processing[1][3]

**Watch out for:**
- Not a healthcare or financial benefit provider—only free counseling/advocacy, no direct payments or services; counselors are unbiased and cannot sell insurance; contact 3 months before Medicare eligibility for best help; HICAP is California-specific name, Washington uses SHIBA (both under national SHIP)[1][3][4][5]

**Data shape:** no income/asset test; open to all Medicare-related; counseling-only service (not benefits/funds); statewide fixed access via central phone/website; volunteer/staff network varies locally but services uniform

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.shiphelp.org/ships/washington/[5]

---

### Home Delivered Meals


**Eligibility:**
- Age: 60+
- Income: Varies by program and region. For Older Americans Act-funded programs (e.g., Olympic Area Agency on Aging in Clallam, Grays Harbor, Jefferson, Pacific Counties): below 185% of Federal Poverty Level (specific dollar amounts not listed in sources; check current FPL guidelines). Sound Generations (King County) uses suggested donation model with no strict income limit stated. Medicaid additional requirement (WAC 388-473-0020) ties to existing Medicaid eligibility, which has income limits (not specified here). Mom's Meals eligibility often requires Medicaid or Medicare Advantage.
- Assets: No asset limits mentioned in sources.
- Homebound or physically/mentally impaired in ability to prepare meals (WAC 388-473-0020)
- Unable to shop or cook (Sound Generations, Mom's Meals)
- At risk of malnutrition (various providers)
- Resident of service area (e.g., specific counties)
- Meals not available from other sources like COPES, MPC, or informal support (WAC 388-473-0020)
- For some: 55+ if American Indian/Alaska Native (O3A)

**Benefits:** Nutritionally balanced home-delivered meals (e.g., one meal per day or per delivery; weekly or semi-weekly delivery). Specifics: Sound Generations - one meal per day, suggested donation $6.50/meal; Mom's Meals - meals at $9.49 or less if purchased, free/reduced via programs; O3A - meals to homebound seniors.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or provider: e.g., Coastal Community Action Programs at 360-533-5100 for O3A counties
- Online application for Sound Generations (King County): soundgenerations.org/meals-on-wheels application form
- Mail application to Sound Generations
- Contact case manager or health plan for Medicaid/Mom's Meals (requires referral with ID, address, meal details)
- For Medicaid additional requirement: Apply through DSHS caseworker (no specific phone/website in results)

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; likely varies by provider and region

**Watch out for:**
- Not a single statewide program—must identify local provider or Medicaid route; availability depends on region
- Medicaid version requires impairment proof and no other meal sources (e.g., excludes if COPES available)
- Often donation/suggested fee based even if 'free'; strict homebound criteria
- Mom's Meals needs referral—contact case manager first, not direct apply
- Waitlists or unavailability if home delivery more expensive than restaurant meals (WAC)

**Data shape:** Decentralized by region/provider; mixes OAA-funded (income-tested, 60+) with Medicaid additional requirement (functional impairment test, no fixed age); referral-based for private providers like Mom's Meals; no uniform income table or statewide processing

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://app.leg.wa.gov/wac/default.aspx?cite=388-473-0020 (WAC 388-473-0020 for Medicaid); agingkingcounty.org or similar AAAs for OAA programs

---

### Family Caregiver Support Program


**Eligibility:**
- Age: Care recipient 18+; caregiver typically 18+[6]+
- Income: Not specified in sources; certain eligibility requirements may apply, varying by community[6]
- Assets: Not applicable or not specified
- Supports unpaid caregivers of adults 18+ with challenges like stress[6]
- Services tailored via screening and assessment process[6]

**Benefits:** Find local resources/services; caregiver support groups and counseling; training on caregiving topics or supplies/equipment; respite care; practical information and suggestions[6]
- Varies by: region

**How to apply:**
- Call 1-800-422-3263[6]
- Visit www.adsa.dshs.wa.gov and click on 'Local Services'[6]
- Look in yellow pages for Area Agency on Aging under 'Senior Services'[6]
- Online resources at www.adsa.dshs.wa.gov/caregiving[6]

**Timeline:** Not specified

**Watch out for:**
- Certain eligibility requirements may apply (not detailed in sources)[6]
- Services vary by community, so check locally[6]
- Not a paid caregiving program; supports unpaid caregivers[6]
- Often confused with Medicaid Personal Care or VA programs which have income/asset limits and pay family caregivers[2][3]

**Data shape:** Services vary by community; no fixed income/asset limits specified; focused on support for unpaid caregivers via local Area Agencies on Aging; introduced screening/assessment in 2009[6]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.adsa.dshs.wa.gov/caregiving

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in current sources for Washington; families must verify current federal poverty guidelines via DOL or local provider[1]. No full table provided in sources.
- Assets: No asset limits mentioned in sources[1].
- Unemployed
- Priority given to: veterans and qualified spouses, individuals over 65, those with a disability, low literacy skills or limited English proficiency, rural residents, homeless or at risk of homelessness, low employment prospects, or those who failed to find employment after American Job Center services[1]

**Benefits:** Part-time community service work (average 20 hours per week) at non-profit/public facilities (e.g., schools, hospitals, day-care, senior centers); paid at highest of federal, state, or local minimum wage; on-the-job training in skills like computer/vocational; employment assistance and placement support to unsubsidized jobs[1][4].
- Varies by: priority_tier

**How to apply:**
- In-person or phone: AARP Foundation SCSEP, 3216 Wetmore #203, Everett WA 98201, (425) 366-4457 (Snohomish County)[7]
- In-person: WorkSource Whatcom, 101 Prospect Street, Bellingham, WA 98225; email findhelp@worksourcewa.com or visit https://www.worksourcewa.com (Whatcom County)[3]
- National: Contact local grantees via DOL SCSEP page (https://www.dol.gov/agencies/eta/seniors) or American Job Centers[1]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; may vary by local provider and funding availability[1]

**Watch out for:**
- Income limit is strictly 125% of federal poverty level; verify current amounts as they update yearly[1]
- Priority tiers mean non-priority applicants may face longer waits or limited slots[1]
- Program is temporary training bridge to unsubsidized work, not permanent employment or welfare[1][4]
- Funded via DOL grants to local non-profits/state agencies (e.g., AARP, WorkSource); availability depends on local funding[1][3][7]
- Must be unemployed; not for current workers[1]

**Data shape:** Administered by multiple regional grantees (e.g., AARP Foundation, WorkSource); priority-based enrollment; income at 125% FPL with no asset test specified; 20 hours/week training pay at min wage; no statewide uniform processing times or forms

**Source:** https://www.dol.gov/agencies/eta/seniors[1]

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: In most counties, seniors 60+ are eligible regardless of income. Low-income individuals 60+ qualify in areas like those served by Rural Resources. General NJP services require low-income screening, but seniors often exempt[1][3][7].
- Assets: Assets limits may apply for CLEAR*Sr, though specifics not detailed[3].
- Low-income status (waived for seniors 60+ in most counties)
- Civil legal problems affecting basic needs (e.g., income maintenance, health care, housing, protection against guardianship, consumer issues)
- Washington state resident

**Benefits:** Free legal advice, consultation, counseling, advocacy, representation, referrals; one-time consultation with attorney in some programs; assistance via phone, electronically; covers income maintenance, health care, housing, protective services, powers of attorney, health care directives, dementia directives[1][3][4][5].
- Varies by: region

**How to apply:**
- Phone: CLEAR*Sr at 1-888-387-7111 (seniors 60+ regardless of income)
- Phone: General CLEAR at 1-888-201-1014 (Mon-Fri 9:15am-12:15pm)
- Online: Apply via Northwest Justice Project at nwjustice.org
- In-person or referrals: Local NJP offices, partners like Rural Resources, ALTC, Columbia Legal Services
- Mail: Not specified, use online/phone intake

**Timeline:** Immediate advice if possible during call; in-depth interview to assess; high call volume may delay connection[3].
**Waitlist:** No waitlist mentioned; high call volume may require patience[3].

**Watch out for:**
- Income often not a barrier for 60+ but assets may apply; limited to civil/basic needs issues (no criminal/personal injury); high call volume requires patience; one-time consultation in some programs; select counties have unique partners/providers[1][3][7].

**Data shape:** Seniors 60+ often no income test statewide via NJP/CLEAR*Sr, but regional delivery via county partners; services priority on basic needs civil legal issues

**Source:** https://nwjustice.org/clear-hotline

---

### Washington State Long-Term Care Ombudsman Program (LTCOP)


**Eligibility:**
- Resident of a licensed long-term care facility in Washington State (nursing home, assisted living facility, adult family home, or enhanced services facility)
- No application required — service is automatically available to all qualifying residents

**Benefits:** Free complaint investigation, resolution, and advocacy; information about resident rights; assistance with quality of care issues, restraint use, transfers/discharges, abuse, discrimination, and financial exploitation
- Varies by: not_applicable — all residents receive the same level of service

**How to apply:**
- Phone: Contact Pierce County office at 253-798-3789 (or state office via waombudsman.org for regional contacts)
- Website: waombudsman.org (includes statewide map of regional program contacts)
- In-person: Visit local long-term care facility — ombudsmen regularly visit facilities
- Mail/Third-party: Family members, friends, facility staff, or concerned community members can contact on behalf of a resident

**Timeline:** Not specified in available sources — complaints are investigated and resolved on a case-by-case basis

**Watch out for:**
- This is NOT a financial assistance program — it provides advocacy and complaint resolution only
- Ombudsmen are resident-directed advocates and act only with resident consent (confidentiality is protected unless the resident authorizes disclosure)
- The program depends on volunteers and paid staff visiting facilities; response time may vary by region and staffing availability
- New regulations (effective January 1, 2026) require assisted living facilities, adult family homes, and enhanced services facilities to notify the State LTC Ombuds of transfers and discharges of Medicaid recipients
- Facilities are legally required to post ombudsman contact information, but families should verify this information is visible and current

**Data shape:** This is a universal advocacy service, not a means-tested benefit program. There are no income, asset, or age eligibility requirements. All residents of licensed long-term care facilities automatically qualify. The program is free and confidential. Families contact the program reactively when issues arise, rather than applying proactively for benefits.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** waombudsman.org

---

### Washington State Parks Senior Citizen Limited Income Pass

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: Household gross income of $40,000 or less per calendar year[1][3]. If applicants own property, they must meet the requirements for property tax exemption under Washington Revised Code 84.36.381[3].
- Assets: Not specified in available sources
- Must be a Washington state resident (defined as resident for at least the past three consecutive months; dual-state residency will not be considered)[3]

**Benefits:** 50% discount on nightly camping or moorage fees (one site per night)[1][2][3]; free watercraft launching[1][2][3]; free trailer dump services[1][2][3]; waives day access fees for Washington State Parks[3]; 50% discount on the Off-Season Senior Citizen Pass[2][3]; free day-use parking[1]
- Varies by: fixed

**How to apply:**
- Online application (specific URL not provided in search results)
- In-person at Washington State Parks offices (specific locations not provided in search results)

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- This pass does NOT replace a Discover Pass and will not be accepted on lands managed by Washington State Department of Fish and Wildlife or Department of Natural Resources[2]
- Passes are not valid with other discounts[3]
- If applicants own property, they must meet specific property tax exemption requirements under RCW 84.36.381—this is an additional eligibility gate beyond age and income[3]
- The pass is valid year-round, but the separate Off-Season Senior Citizen Pass ($75, or $37.50 with Limited Income Pass discount) provides free camping October 1–March 31 and weekdays in April—these are two different passes with different benefits[2][3]
- Income limit is household gross income, not net income[3]
- Dual-state residency disqualifies applicants[3]

**Data shape:** This program has a simple, fixed benefit structure with no tiering or household-size variation. The primary eligibility gates are age (62+), household income ($40,000 or less), Washington residency (3+ consecutive months), and property tax exemption status if applicable. A critical distinction exists between the free Senior Citizen Limited Income Pass (year-round, 50% discounts) and the paid Off-Season Senior Citizen Pass ($75, free camping in off-season months). The pass does not extend to state lands managed by other agencies, which is a common point of confusion.

**Source:** https://benefitscheckup.org/program/discount_wa_state_park_disc_pass (information aggregator); Washington State Parks and Recreation Commission official website (specific URL not provided in search results)

---

### Lifetime Disabled Veteran Pass

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits or asset limits apply. Eligibility is based solely on disability rating and residency, not financial means.
- Assets: No asset limits apply. No counts or exemptions specified as they are not part of eligibility.
- Washington State resident (proof required, such as valid WA driver's license, ID card, voter registration, or senior citizen property tax exemption; at least 3 consecutive months residency in some contexts)
- Service-connected disability rating of at least 30% from the VA (verified by VA award letter dated within the last 2 years or VA Benefit Summary Letter)
- Veteran of US Armed Forces (honorably discharged or equivalent)

**Benefits:** Lifetime pass providing free day-use access (vehicle parking and individual entry) to Washington State Parks year-round. Accepted at many county parks and recreation sites (e.g., Jefferson County Parks) for free or reduced fees. Does not cover camping, moorage, or expanded amenities unless specified by site.
- Varies by: fixed

**How to apply:**
- Phone: (360) 902-8844 or Washington Telecommunication Relay Service at (800) 833-6388 to request application
- Online: Submit completed Washington State Parks and Recreation Commission Lifetime Disabled Veteran Pass Application by email to passes@parks.wa.gov or fax to 360-586-6440
- Mail: Washington State Parks and Recreation Commission (address listed on application form)

**Timeline:** Passes ordered online or by mail delivered in 3-4 weeks after receipt of documentation (similar to federal process; state-specific not detailed)

**Watch out for:**
- Pass covers day-use fees only (e.g., parking, entry); does not include camping, boat launches, or special events
- Must show VA documentation dated within 2 years; older letters may be rejected
- Not the same as federal NPS Access Pass or Disabled Veteran Property Tax Exemption—specific to WA State Parks access
- Residency proof must be current; at least 3 months in some verifications
- No income/asset test, but strictly service-connected disability (not general disability)

**Data shape:** No income or asset tests; fixed eligibility based on 30%+ VA service-connected rating and WA residency; statewide uniform access with acceptance at select county sites; documentation-heavy with recent VA letter requirement

**Source:** https://wdfw.wa.gov/accessibility/eligibility-requirements-veterans-reduced-fees (referenced in results); primary application via parks.wa.gov

---

### Washington Charity Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income limits are based on federal poverty level and vary by hospital and patient group classification. Group 1 hospitals (the primary category) provide: (1) Free care to patients with income ≤300% of federal poverty level, adjusted for family size; (2) 75% discount for patients with income between 301-350% of federal poverty level, adjusted for family size. Some hospitals may offer assistance up to 400% of federal poverty level. Specific dollar amounts vary annually with federal poverty guidelines and by household size—consult your hospital's specific policy or the current Federal Poverty Guidelines from U.S. Health and Human Services for exact thresholds.[1][4][5]
- Assets: Asset limits are referenced in the law but specific thresholds are not detailed in available materials. The law mentions that discounts 'may be reduced by amounts reasonably related to' certain assets, but the exact asset limits and what counts as exempt are determined by individual hospital policies.[1] Contact your specific hospital's financial assistance department for asset limit details.
- Patient or guarantor must have exhausted any third-party coverage (insurance, Medicaid, etc.) before qualifying[1]
- Care must be 'medically necessary' or emergent[4]
- No citizenship requirement—all patients regardless of citizenship status can qualify if otherwise eligible[4]
- No deadline to apply; patients can apply while hospitalized or after discharge[4]

**Benefits:** Free or discounted hospital care. Group 1 hospitals provide: (1) 100% free care for patients at ≤300% of federal poverty level; (2) 75% discount on patient responsibility for those at 301-350% of federal poverty level. Coverage includes inpatient hospital stays and emergency room visits. Does NOT cover independent medical providers (e.g., radiologists, anesthesiologists not employed by hospital) or outpatient clinic visits.[4]
- Varies by: household_size and hospital classification

**How to apply:**
- In-person: Ask hospital staff during admission or at billing/financial assistance department
- Phone: Contact your hospital's financial assistance or billing department (number on hospital website or billing statement)[5]
- Mail: Submit completed application to hospital's financial assistance department
- Online: Many hospitals post applications on their websites[4][5]
- General inquiry: Washington State Department of Health at 360-236-4210 or charitycare@doh.wa.gov[5]

**Timeline:** Not specified in available materials. One hospital example (Washington Health System) grants assistance for 3-month periods after approval, but overall processing timeline is not documented.[2]
**Waitlist:** No waitlist information provided in available materials.

**Watch out for:**
- No single statewide income table—each hospital's policy may differ. You must check your specific hospital's policy for exact income limits.[1][4]
- Charity Care does NOT cover independent contractors (radiologists, anesthesiologists, etc.) even if they work in the hospital. These providers may bill separately.[4]
- Outpatient clinic visits are typically NOT covered; only inpatient and emergency room services qualify.[4]
- You must exhaust third-party coverage first. If you have any insurance, Medicaid, or other coverage, the hospital will bill those before Charity Care applies.[1]
- Even with insurance, you may qualify if deductibles or co-pays are high relative to income.[4]
- Collection activity is suspended during Charity Care review, but you should apply promptly to avoid debt collection.[2]
- Some hospitals use different program names ('Bridge Assistance,' 'Financial Assistance'), so ask specifically for 'Charity Care' or financial assistance programs.[4]
- The law states it's an 'unreasonable burden' to require patients to apply for state/federal programs if they're obviously ineligible or were denied in the prior 12 months—hospitals should not require this.[1]
- No deadline to apply, but applying early (during hospitalization or shortly after) is advisable to prevent collection action.[4]

**Data shape:** Washington Charity Care is a decentralized, hospital-specific program rather than a single centralized program. Benefits and eligibility scale by household size and federal poverty level, with variation by hospital classification and individual hospital policy. The program is mandatory for all licensed hospitals but lacks a single statewide application process, income table, or processing timeline. Eligibility is income-based with asset considerations, but specific asset limits are hospital-determined. No age requirement exists, making it potentially relevant for elderly patients of any age. The program is notable for covering both insured and uninsured patients and for not restricting eligibility based on citizenship.

**Source:** Washington State Department of Health Charity Care information: https://www.doh.wa.gov/ (search 'Charity Care'); statewide hospital policy list available through DOH; individual hospital policies on hospital websites

---

### Housing and Essential Needs (HEN) Referral Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Countable income at or below monthly limits in WAC 388-478-0090 (varies by assistance unit size; e.g., follows ABD cash assistance standards like 100% Federal Poverty Level adjusted for household). Specific tables in WAC 388-478-0090; low-income required per DSHS financial need rules in WAC 388-450 and resources in RCW 74.04.005/WAC 388-470[1][6].
- Assets: Subject to resource requirements in RCW 74.04.005 and WAC 388-470 (standard ABD limits apply; primary residence, one vehicle, household goods often exempt—exact counts/exemptions detailed in WAC 388-470)[1].
- Apply for cash assistance (WAC 388-406-0010) and complete DSHS interview[1].
- Incapacitated (unable to work at least 90 days due to physical/mental/SUD incapacity per WAC 388-447-0001; verified by DSHS health screening)[1][2][6].
- ABD cash assistance recipient (recent change allows eligibility in addition to ABD benefits)[1][4][6].
- Financial need, citizenship/immigration status (WAC 388-424-0015), SSN verification (WAC 388-476-0005), residency (WAC 388-468-0005), verification (WAC 388-490-0005)[1].
- Not in public correctional facility; not eligible if receiving TANF, SSI, or able to work with income over federal limits[1][2][6].
- Homeless or at risk of homelessness/housing instability (self-attestation possible)[2][3].
- Valid DSHS referral required[2][5].

**Benefits:** Essential needs items (e.g., hygiene bags), transportation assistance, potential rental/utility assistance, homeless prevention/rapid rehousing (as funding allows; no fixed dollar/hour amounts—case-by-case via local providers)[3][5][6][8].
- Varies by: priority_tier|region

**How to apply:**
- Online: washingtonconnection.org[2][6].
- Phone: 877-501-2233 (DSHS cash assistance/HEN referral)[4][6].
- In-person: Any DSHS Community Services Office[2][6].
- After DSHS referral: Contact county HEN provider (e.g., King County: 206-328-5755)[6][8].

**Timeline:** Not specified; DSHS referral issued after cash assistance application/interview/eligibility determination[2][6].
**Waitlist:** Rent interest lists used by providers (e.g., King County prioritizes from list as funding allows; currently no new rent/utility for some areas)[6][8].

**Watch out for:**
- Requires DSHS referral first—not direct apply to providers[2][5].
- 12-month limit on eligibility post-referral, even if incapacity persists[7].
- Excludes TANF/SSI recipients, those able to work, or in correctional facilities[1][6].
- Rent/utility not guaranteed—depends on local funding/priority lists; currently limited for new clients in some areas[6][8].
- Referrals expire if not acted on promptly[2].
- ABD recipients now eligible additionally, but must report changes[1][4].

**Data shape:** Referral-based only (DSHS gates eligibility, Commerce providers deliver); benefits case-by-case via county providers with funding caps/waitlists; tied to ABD/incapacity cash assistance rules; regional provider variations and no fixed benefit amounts.

**Source:** https://www.law.cornell.edu/regulations/washington/WAC-388-400-0070 (primary reg); washingtonconnection.org (apply)

---

### Aged, Blind, or Disabled (ABD) Cash Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Countable income must be at or below monthly limits in WAC 388-478-0090 (specific dollar amounts not detailed in sources; check official WAC for current table by household size). Sources note examples like below $339/month for some disability cases (older data).[1][5]
- Assets: Countable resources not more than $6,000 total (similar to SSI limits of $2,000 individual/$3,000 couple). Counts most cash, bank accounts, some property; exemptions not fully detailed but follow chapters 388-450, 388-470, 388-488 WAC.[2][3]
- Blind as defined by SSA, or likely disabled per WAC 388-449-0001-0100 (physical/mental disability preventing work for 12+ months, not primarily substance abuse; medical verification required).
- At least 18 years old (or under 18 if married couple member).
- In financial need per ABD rules.
- U.S. citizen or qualified alien per WAC 388-424-0015.
- Provide Social Security number per WAC 388-476-0005.
- Reside in Washington per WAC 388-468-0005.
- Sign interim assistance reimbursement authorization to repay ABD if SSI approved later.
- Not receiving SSI or TANF (TANF preferred if eligible as it pays more).

**Benefits:** State-funded monthly cash stipend: up to $450 (single) or $570 (couple); older data shows $417 single/$528 couple or averages $184.76 (2022). Includes automatic referral to Housing and Essential Needs (HEN) program; SSI application facilitator assigned.[1][2][3][4]
- Varies by: household_size

**How to apply:**
- Online: Washington Connection eligibility tool (washingtonconnection.org).
- Phone/mail/in-person: Contact local DSHS Community Service Office (CSO); specific numbers vary by region, e.g., CCS HEN line 206-328-5755 post-referral.
- Automatic HEN referral upon ABD approval via DSHS.

**Timeline:** Not specified in sources.

**Watch out for:**
- Interim program: Must repay ABD benefits from future SSI (average $4,545 payback).[3]
- Not eligible if receiving SSI or TANF (choose TANF if possible for higher benefit).[4]
- Disability requires medical verification and 'likely' determination; not for substance abuse primary cause.[1][4]
- Income/resources strictly counted; limits similar but not identical to SSI.[2]
- Under 18 only if married couple.[1]

**Data shape:** Interim bridge to SSI with mandatory payback; benefits scale by household size (single/couple); uniform statewide rules via DSHS CSOs but local admin; no income table in sources—refer to WAC 388-478-0090.

**Source:** https://www.dshs.wa.gov/esa/community-services-offices or WAC 388-400-0060 (https://www.law.cornell.edu/regulations/washington/WAC-388-400-0060)

---

### WA Cares Fund

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No income limits or asset limits apply. Eligibility is based on work history and contributions, not financial means.
- Assets: No asset limits. No assets count or are exempt as there is no means test.
- Reside in Washington state or have elected to keep coverage if relocated out-of-state[1][3]
- Worked at least 500 hours per year in Washington for qualifying periods[1][2][3]
- Meet one of three contribution pathways: (1) Lifetime access: 10 years total contributions without 5+ consecutive year break; (2) Early access: 3 of last 6 years at time of application; (3) Partial benefit for near-retirees (born before Jan 1, 1968): 10% of full benefit per qualifying year[1][3]
- Have qualifying long-term care needs (e.g., activities of daily living assistance)[2]
- Not holding a permanent exemption (e.g., veteran with 70%+ service-connected disability); conditional exemptions pause contributions but allow future eligibility[1][3][4]

**Benefits:** Up to full lifetime benefit amount for vested individuals (exact dollar cap not specified in sources; partial 10% per year for near-retirees); provides cash benefit for long-term services and supports, payable directly to individual or provider[1][2][3]
- Varies by: contribution_pathway

**How to apply:**
- Apply through WA Employment Security Department (ESD); specific phone, URL, mail, or in-person details not in sources—check official ESD WA Cares site
- For exemptions or rescission: Follow ESD instructions online[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Permanent exemptions (e.g., 70%+ veteran disability) make you ineligible for benefits unless rescinded[1][3][4]
- Must notify employer/ESD within 90 days if conditional exemption ends (e.g., move to WA, visa change)[3][4]
- 500 hours/year minimum (~10 hrs/week) required for each counting year; breaks over 5 years reset 10-year clock[1][2][3]
- Benefits start Jan 1, 2025; near-retirees get only partial unless meeting other pathways[3][4]
- No means test, but must have qualifying care needs—not automatic upon vesting[2]

**Data shape:** No income/asset test; eligibility tied to payroll contributions and work hours via three vesting pathways; exemptions can block benefits; statewide for WA workers

**Source:** https://wa-cares.esd.wa.gov/ (inferred primary ESD site based on context; confirm via ESD)

---

### Seattle Gold Card (Age-Friendly Discount Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or asset limits apply. Open to all qualifying by age or disability without financial tests.[1][3][5]
- Assets: No asset limits or tests. No information on what counts or exemptions, as none required.[1][5]
- Must be a resident of Seattle, King County, or Washington state.[1][3][5]
- No proof of residency explicitly required in sources, but residency stated as eligibility.[3]

**Benefits:** Discounts at over 110 participating Seattle-area businesses and nonprofits, including theaters, restaurants, Woodland Park Zoo, Seattle Aquarium, Seattle Art Museum, Museum of Flight, fitness/recreation, food/beverage/grocery, pet adoption/licensing (50% fee reduction at Seattle Animal Shelter), retail, services, arts, entertainment, tourism. Specific discount amounts vary by business; cardholders should confirm acceptance. Directory available online with mapping by zip code.[1][2][5][6]

**How to apply:**
- Online: seattle.gov/AgeFriendlyDiscounts or civiform.seattle.gov/programs/gold-card-hsd (10 minutes, 16 languages, card mailed if qualified).[1][2][5][7]
- In-person: Seattle Public Library branches, senior activity centers, community centers, City of Seattle customer service centers, Disability Empowerment Center service centers (Seattle, Redmond, Auburn).[1][4][8]
- Bulk for organizations: Email agefriendly@seattle.gov.[2]
- Phone: (206) 582-5011 (M-F 8am-3:30pm).[5]

**Timeline:** Online applicants receive card in mail within 1-2 weeks.[5]

**Watch out for:**
- Not limited to Seattle residents—open to all King County/WA residents 60+ and visitors with family, which surprises some.[1]
- Must confirm with each business if they accept the card, as participation voluntary and list updated regularly.[5][6]
- Separate FLASH Card for 18-59 with disabilities; not the same program.[1][2][5]
- Online application prompts for other Affordable Seattle programs, but Gold Card itself has no income test.[1]
- Physical cards available at libraries/centers without online application.[1][4][8]

**Data shape:** No income or asset test; residency broadly defined across King County/WA; discounts vary by participating businesses only (no fixed dollar/hour value); multiple easy access points including libraries; pairs with FLASH for disabilities.

**Source:** https://www.seattle.gov/agefriendly/about/discount-program

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Apple Health | resource | state | simple |
| Medicaid Personal Care (MPC) Program | benefit | state | deep |
| Medicaid Alternative Care (MAC) Waiver | benefit | local | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Basic Food Program (Washington State SNA | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Health Insurance Counseling and Advocacy | resource | federal | simple |
| Home Delivered Meals | benefit | local | deep |
| Family Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors | resource | state | simple |
| Washington State Long-Term Care Ombudsma | resource | federal | simple |
| Washington State Parks Senior Citizen Li | resource | state | simple |
| Lifetime Disabled Veteran Pass | resource | state | simple |
| Washington Charity Care Program | resource | state | simple |
| Housing and Essential Needs (HEN) Referr | benefit | state | deep |
| Aged, Blind, or Disabled (ABD) Cash Assi | benefit | state | deep |
| WA Cares Fund | benefit | state | medium |
| Seattle Gold Card (Age-Friendly Discount | benefit | local | medium |

**Types:** {"resource":7,"benefit":13,"employment":1}
**Scopes:** {"state":10,"local":4,"federal":7}
**Complexity:** {"simple":7,"deep":12,"medium":2}

## Content Drafts

Generated 21 page drafts. Review in admin dashboard or `data/pipeline/WA/drafts.json`.

- **Apple Health** (resource) — 2 content sections, 6 FAQs
- **Medicaid Personal Care (MPC) Program** (benefit) — 4 content sections, 6 FAQs
- **Medicaid Alternative Care (MAC) Waiver** (benefit) — 3 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 4 content sections, 6 FAQs
- **Basic Food Program (Washington State SNAP)** (benefit) — 5 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 3 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 3 content sections, 6 FAQs
- **Health Insurance Counseling and Advocacy Program (HICAP/SHIP)** (resource) — 1 content sections, 6 FAQs
- **Home Delivered Meals** (benefit) — 4 content sections, 6 FAQs
- **Family Caregiver Support Program** (benefit) — 1 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 2 content sections, 6 FAQs
- **Legal Aid for Seniors** (resource) — 2 content sections, 6 FAQs
- **Washington State Long-Term Care Ombudsman Program (LTCOP)** (resource) — 2 content sections, 6 FAQs
- **Washington State Parks Senior Citizen Limited Income Pass** (resource) — 2 content sections, 6 FAQs
- **Lifetime Disabled Veteran Pass** (resource) — 1 content sections, 6 FAQs
- **Washington Charity Care Program** (resource) — 2 content sections, 6 FAQs
- **Housing and Essential Needs (HEN) Referral Program** (benefit) — 4 content sections, 6 FAQs
- **Aged, Blind, or Disabled (ABD) Cash Assistance Program** (benefit) — 3 content sections, 6 FAQs
- **WA Cares Fund** (benefit) — 2 content sections, 6 FAQs
- **Seattle Gold Card (Age-Friendly Discount Program)** (benefit) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **not_applicable (specific variation data not available in sources)**: 1 programs
- **region**: 4 programs
- **program_tier**: 1 programs
- **household_size, income, and living expenses**: 1 programs
- **priority_tier|region|household_size**: 1 programs
- **not_applicable**: 2 programs
- **not_applicable — all residents receive the same level of service**: 1 programs
- **fixed**: 2 programs
- **household_size and hospital classification**: 1 programs
- **priority_tier|region**: 1 programs
- **household_size**: 1 programs
- **contribution_pathway**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Apple Health**: Income at 138% FPL with household size table; asset limits for elderly/disabled categories; varies by age/disability/Medicare status; statewide but MCO selection required.
- **Medicaid Personal Care (MPC) Program**: No NFLOC required (unlike nursing/waiver programs); functional eligibility via CARE tool only; benefits in community settings only; scales by assessed need, not household size; administered statewide but local DSHS/provider variations.
- **Medicaid Alternative Care (MAC) Waiver**: MAC is a home and community-based services (HCBS) waiver with strict eligibility criteria centered on age (55+), functional need (NFLOC), asset/income limits, and caregiver availability. The program is statewide but may have regional variations not detailed in available sources. Critically, the search results lack specific information on services provided, application procedures, processing times, required forms, and regional office locations — families will need to contact Washington DSHS directly for operational details. The program's defining feature is that it allows individuals who meet nursing home-level care needs to remain at home with an unpaid caregiver while receiving Medicaid-funded support, as an alternative to institutional placement.
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to specific PACE provider service areas (e.g., King County); no direct income/asset test for enrollment but tied to Medicaid/private pay; requires state DSHS certification for nursing facility level of care; not statewide
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI-1) with escalating income thresholds; WA eliminates asset test and uses higher FPL % than federal; benefits fixed by tier not household size beyond couple; QI waitlist/priority; retroactive for SLMB/QI.
- **Basic Food Program (Washington State SNAP)**: Benefits scale by household size and income. Income limits are uniform statewide and tied to 200% of Federal Poverty Level, which is adjusted annually. Work requirements create a two-tier system: those exempt (primarily parents with children under 14) and those subject to 80-hour monthly work verification. The program is administered through local Community Services Offices but with statewide uniform eligibility and benefit standards. Critical policy changes in July 2025 (work requirements) and December 2025 (immigrant eligibility) significantly alter who qualifies.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Decentralized: local providers handle applications with varying processes/docs; income at 150% FPL (table in PDF); benefits vary by region, fuel usage, tier; no statewide asset test or central hotline.
- **Weatherization Assistance Program (WAP)**: Administered county-by-county through local agencies with no centralized application; eligibility uses max of three income metrics (200% FPL, 60% SMI, 80% AMI); priority tiers favor elderly and vulnerable households
- **Health Insurance Counseling and Advocacy Program (HICAP/SHIP)**: no income/asset test; open to all Medicare-related; counseling-only service (not benefits/funds); statewide fixed access via central phone/website; volunteer/staff network varies locally but services uniform
- **Home Delivered Meals**: Decentralized by region/provider; mixes OAA-funded (income-tested, 60+) with Medicaid additional requirement (functional impairment test, no fixed age); referral-based for private providers like Mom's Meals; no uniform income table or statewide processing
- **Family Caregiver Support Program**: Services vary by community; no fixed income/asset limits specified; focused on support for unpaid caregivers via local Area Agencies on Aging; introduced screening/assessment in 2009[6]
- **Senior Community Service Employment Program (SCSEP)**: Administered by multiple regional grantees (e.g., AARP Foundation, WorkSource); priority-based enrollment; income at 125% FPL with no asset test specified; 20 hours/week training pay at min wage; no statewide uniform processing times or forms
- **Legal Aid for Seniors**: Seniors 60+ often no income test statewide via NJP/CLEAR*Sr, but regional delivery via county partners; services priority on basic needs civil legal issues
- **Washington State Long-Term Care Ombudsman Program (LTCOP)**: This is a universal advocacy service, not a means-tested benefit program. There are no income, asset, or age eligibility requirements. All residents of licensed long-term care facilities automatically qualify. The program is free and confidential. Families contact the program reactively when issues arise, rather than applying proactively for benefits.
- **Washington State Parks Senior Citizen Limited Income Pass**: This program has a simple, fixed benefit structure with no tiering or household-size variation. The primary eligibility gates are age (62+), household income ($40,000 or less), Washington residency (3+ consecutive months), and property tax exemption status if applicable. A critical distinction exists between the free Senior Citizen Limited Income Pass (year-round, 50% discounts) and the paid Off-Season Senior Citizen Pass ($75, free camping in off-season months). The pass does not extend to state lands managed by other agencies, which is a common point of confusion.
- **Lifetime Disabled Veteran Pass**: No income or asset tests; fixed eligibility based on 30%+ VA service-connected rating and WA residency; statewide uniform access with acceptance at select county sites; documentation-heavy with recent VA letter requirement
- **Washington Charity Care Program**: Washington Charity Care is a decentralized, hospital-specific program rather than a single centralized program. Benefits and eligibility scale by household size and federal poverty level, with variation by hospital classification and individual hospital policy. The program is mandatory for all licensed hospitals but lacks a single statewide application process, income table, or processing timeline. Eligibility is income-based with asset considerations, but specific asset limits are hospital-determined. No age requirement exists, making it potentially relevant for elderly patients of any age. The program is notable for covering both insured and uninsured patients and for not restricting eligibility based on citizenship.
- **Housing and Essential Needs (HEN) Referral Program**: Referral-based only (DSHS gates eligibility, Commerce providers deliver); benefits case-by-case via county providers with funding caps/waitlists; tied to ABD/incapacity cash assistance rules; regional provider variations and no fixed benefit amounts.
- **Aged, Blind, or Disabled (ABD) Cash Assistance Program**: Interim bridge to SSI with mandatory payback; benefits scale by household size (single/couple); uniform statewide rules via DSHS CSOs but local admin; no income table in sources—refer to WAC 388-478-0090.
- **WA Cares Fund**: No income/asset test; eligibility tied to payroll contributions and work hours via three vesting pathways; exemptions can block benefits; statewide for WA workers
- **Seattle Gold Card (Age-Friendly Discount Program)**: No income or asset test; residency broadly defined across King County/WA; discounts vary by participating businesses only (no fixed dollar/hour value); multiple easy access points including libraries; pairs with FLASH for disabilities.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Washington?
