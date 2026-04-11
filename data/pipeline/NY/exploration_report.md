# New York Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.105 (21 calls, 11.2m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 19 |
| Programs deep-dived | 17 |
| New (not in our data) | 10 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 8 programs
- **financial**: 6 programs
- **in_kind**: 2 programs
- **employment + in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### New York State Home and Community-Based Services (HCBS) Waiver Programs

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Day Habilitation, Live-in Caregiver, Prevocational Services, Residential Habilitation, Respite, Supported Employment (SEMP), Fiscal Intermediary (FI), Support Brokerage, Assistive Technology – Adaptive Devices, Community Habilitation, Community Transition Services, Environmental Modifications (Home Accessibility), Family Education and Training, Individual Directed Goods and Services, Intensive Behavioral Services, Pathway to Employment, Vehicle Modifications, Home-Enabling Supports (HES)[3][4][6]. No specific dollar amounts or hours per week stated.` ([source](https://opwdd.ny.gov/providers/home-and-community-based-services-waiver[6]))
- **source_url**: Ours says `MISSING` → Source says `https://opwdd.ny.gov/providers/home-and-community-based-services-waiver[6]`

### Program of All-Inclusive Care for the Elderly (PACE)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive medical and social services including primary care by geriatricians, nursing, social work, physical/occupational/recreational therapy, dietitian services, home health aides, transportation, prescriptions delivered to door, eye/foot/dental care, hearing aids, wound/palliative care, nutritional counseling, meals at day centers, social/recreational activities; all Medicare and Medicaid benefits become provided solely through PACE; 24/7 care coordination; services at PACE centers and in-home[1][2][3][4][5][7][8]` ([source](https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal); https://www.nymedicaidchoice.com/pace (NY-specific guidance); contact local providers for applications[1][8]))
- **source_url**: Ours says `MISSING` → Source says `https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal); https://www.nymedicaidchoice.com/pace (NY-specific guidance); contact local providers for applications[1][8]`

### Medicare Savings Program (MSP) - QMB, SLMB, QI

- **income_limit**: Ours says `$1800` → Source says `$1,350` ([source](https://www.ny.gov/services/apply-medicare-savings-programs or local DSS; NYC: https://www.nyc.gov/site/hra/help/medicare-savings-program.page))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A premium (if applicable), Part B premium/deductible/coinsurance/copays. SLMB: Part B premium only. QI: Part B premium only (QI-1 annual). No cap on services; full coverage of specified costs. Auto-qualifies QI for Extra Help (drug costs ≤$12.65/drug in 2026).[1][4][5]` ([source](https://www.ny.gov/services/apply-medicare-savings-programs or local DSS; NYC: https://www.nyc.gov/site/hra/help/medicare-savings-program.page))
- **source_url**: Ours says `MISSING` → Source says `https://www.ny.gov/services/apply-medicare-savings-programs or local DSS; NYC: https://www.nyc.gov/site/hra/help/medicare-savings-program.page`

### Supplemental Nutrition Assistance Program (SNAP) / ESAP / NYSCAP

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases; amount based on net income, household size (exact via SNAP budget calculation). ESAP/NYSCAP: Simplified process, 36-month certification, no recert interview, less verification.[2][5][7]` ([source](https://otda.ny.gov/programs/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://otda.ny.gov/programs/snap/`

### Home Energy Assistance Program (HEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Base benefit amounts vary significantly by living situation and heating source: $21 for government-subsidized housing or group homes with heat included; $45-$50 for households with heating costs included in rent; $900+ for households with oil, kerosene, or propane as primary heat paying directly to vendor; $635+ for households with wood, wood pellets, coal, corn, or other deliverable fuel paying directly to vendor[3]. Additional add-ons of $61 available for Tier 1 income households paying directly for heat[8]. One Regular HEAP benefit per program year[4].` ([source](https://www.ny.gov/services/apply-heating-assistance-heap and https://otda.ny.gov/programs/heap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.ny.gov/services/apply-heating-assistance-heap and https://otda.ny.gov/programs/heap/`

### State Health Insurance Assistance Program (SHIP) / Health Insurance Information, Counseling and Assistance Program (HIICAP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, confidential, unbiased one-on-one counseling and assistance on Medicare benefits/options/paperwork, Medicare Advantage, Medigap, Part D prescription plans, costs/deductibles, low-income programs (e.g., EPIC, Medicare Savings Programs, Extra Help), health insurance problem resolution, claims filing, and referrals. Provided by nearly 500 trained counselors statewide; no fixed hours, dollar amounts, or limits specified.[1][4][6]` ([source](https://aging.ny.gov/health-insurance-information-counseling-and-assistance-programs))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ny.gov/health-insurance-information-counseling-and-assistance-programs`

### Respite Care Program (NYFSC) / Caregiver Resource Centers

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Trained and Certified Home Attendants provide: personal care and hygiene, light housekeeping, shopping and cooking, laundry, escorting and companionship.[3] Basic service starts at $7.15 per hour plus carfare (as of 2007 data).[6] Emergency/Extended Hours service is provided at no charge for qualifying caregivers.[6]` ([source](https://www.nyfsc.org/support-services/respite-care-program/))
- **source_url**: Ours says `MISSING` → Source says `https://www.nyfsc.org/support-services/respite-care-program/`

## New Programs (Not in Our Data)

- **Community Medicaid** — service ([source](https://www.health.ny.gov/health_care/medicaid/))
  - Shape notes: Eligibility has three tiers (Community Medicaid, Community Medicaid with LTC, Nursing Home Medicaid); income/assets tied to SSI-Related (aged/blind/disabled) with annual FPL adjustments; functional need based on ADL count (3+ since 2021); county-administered with regional MLTC providers.
- **Weatherization Referral and Packaging Program (WRAP)** — service ([source](https://otda.ny.gov/workingfamilies/wap.asp))
  - Shape notes: Referral and packaging tied to local HEAP/WAP delivery; priority-based with automatic eligibility via benefits receipt; local subgrantees handle delivery with regional providers; no fixed dollar benefits per household, services determined by energy audit.
- **Meals on Wheels (via Expanded In-Home Services for the Elderly Program - EISEP)** — service ([source](https://aging.ny.gov/expanded-home-services-elderly-eisep))
  - Shape notes: Statewide but locally administered with county-specific providers, case managers, and variations in service delivery/meals details; no fixed income/asset caps but mandatory sliding-scale cost-sharing; meals tied to functional impairment assessment.
- **Senior Community Service Employment Program (SCSEP)** — employment + in_kind ([source](https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); https://aging.ny.gov/senior-community-service-employment-program-scsep (New York State Office for the Aging)))
  - Shape notes: SCSEP is a federally funded program administered by the U.S. Department of Labor under the Older Americans Act, but delivered through state agencies and approximately 50 local nonprofit partner organizations across New York. Benefits are fixed (20 hours/week at minimum wage) but vary by region due to different state and local minimum wage rates. Eligibility is uniform statewide (age 55+, unemployed, income ≤125% poverty level) but enrollment priority tiers may affect access during funding constraints. The program is currently experiencing federal funding delays, which may affect availability and processing times by region. Application methods and contact information vary significantly by county and local provider.
- **Legal Services for Seniors** — service ([source](https://aging.ny.gov/legal-services-initiative))
  - Shape notes: Decentralized by county/region with local providers; no uniform income/asset tests (many none); priority for vulnerable seniors; varies significantly by location
- **Senior Citizen Homeowners' Exemption (SCHE)** — financial ([source](https://www.nyc.gov/site/finance/property/landlords-sche.page))
  - Shape notes: This program's benefits scale by income in 10 distinct tiers, with the maximum 50% reduction available only for incomes up to $50,000 and a gradual phase-out to 5% for incomes up to $58,399. The program is NYC-specific and administered uniformly across all five boroughs by the NYC Department of Finance. Application is limited to a 6-month window annually (September 15–March 15). Income calculation includes all household income sources and requires careful documentation. The 12-month ownership requirement and primary residence requirement are strict eligibility gates.
- **Senior Citizen Rent Increase Exemption (SCRIE)** — financial ([source](https://www.nyc.gov/site/finance/property/landlords-scrie.page))
  - Shape notes: NYC-focused with fixed $50,000 income cap (no household size adjustment); rent burden test (1/3 income); limited to rent-regulated units; renewal mandatory; available in select non-NYC counties via local option.
- **Enhanced STAR Program** — financial ([source](https://www.tax.ny.gov/pit/property/star/eligibility.htm))
  - Shape notes: Enhanced STAR is a property tax exemption program (not a service-based program). The key structural change in 2026 is the shift from local assessor-based applications to automatic state-level eligibility determination for those already receiving Basic STAR. Income limits are adjusted annually. The program requires income verification but does not share tax returns with assessor offices. Eligibility is binary (you either qualify or don't) rather than tiered, though the dollar value of tax savings varies by property tax rates in each school district.
- **Expanded In-home Services for the Elderly Program (EISEP)** — service ([source](https://aging.ny.gov/expanded-home-services-elderly-eisep))
  - Shape notes: Managed regionally by local Area Agencies on Aging with varying providers; no strict income/asset tests but sliding scale cost-share; wait times and availability county-dependent; core case management for all, tiered additional services by need
- **Golden Park Program** — in_kind ([source](https://parks.ny.gov/))
  - Shape notes: No application or financial tests; ID-based instant access with fixed weekday schedule and listed site exclusions

## Program Details

### Community Medicaid

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For 2026, countable income limit is approximately $1,800 per month for a single applicant (138% of Federal Poverty Level, with $20 disregard making it practically $1,697-$1,800); for a couple, approximately $2,268-$2,288 per month. Limits apply to aged, blind, or disabled (SSI-Related) category and vary slightly by year and source[1][4][5].
- Assets: For a single applicant in 2026, countable assets must be $33,038 or less (2025 figure: $32,396). Countable assets include bank accounts, retirement accounts, stocks, bonds, CDs, cash, and items easily converted to cash. Exempt assets include primary residence, one car, personal property, and certain prepaid funeral expenses[1][2][4].
- New York resident and legal U.S. resident (citizenship not required but intent to remain indefinitely if non-citizen)[2].
- Nursing Facility Level of Care (NFLOC): Need full-time care equivalent to nursing home, assessed via Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (cleaning, cooking, shopping, etc.), plus cognitive/behavioral issues[1].
- As of July 2021, need assistance with at least 3 ADLs (or more than 1 if Alzheimer's/dementia); personal care tasks like medication administration may count[3].
- For Managed Long Term Care (MLTC): NFLOC and long-term care need >120 days[1].
- For Community First Choice Option (CFCO): NFLOC and help with 3 of 5 ADLs[1].

**Benefits:** Home and community-based long-term care services including home health aide, personal care, nursing, therapies, adult day care, respite care, light housekeeping, meal preparation, medication management, and routine skincare. Delivered via Managed Long Term Care (MLTC) plans or Community First Choice Option (CFCO); no fixed dollar amounts or hours specified, services based on assessed need[1][3][5].
- Varies by: priority_tier

**How to apply:**
- Online: New York State of Health website (nyhealth.gov or nystateofhealth.ny.gov)[6].
- Phone: 855-355-5777 (TTY 1-800-662-1220) for eligibility screening; local social services or managed care plans for specifics[6].
- In-person: Local Department of Social Services office by county.
- Mail: To local social services office.

**Timeline:** Not specified in sources; typically weeks to months depending on completeness.
**Waitlist:** Possible for certain services or managed care plans, but not detailed[1].

**Watch out for:**
- Income over limit disqualifies unless using strategies like Pooled Income Trust[7].
- 60-month look-back period penalizes improper asset transfers[2].
- Must meet both financial and functional (NFLOC/ADL) criteria; Medicare does not cover long-term care[2].
- Spousal protections apply if married, allowing community spouse resource allowance.
- Three levels: standard Community Medicaid, with Long-Term Care, or Nursing Home—confirm category[5].

**Data shape:** Eligibility has three tiers (Community Medicaid, Community Medicaid with LTC, Nursing Home Medicaid); income/assets tied to SSI-Related (aged/blind/disabled) with annual FPL adjustments; functional need based on ADL count (3+ since 2021); county-administered with regional MLTC providers.

**Source:** https://www.health.ny.gov/health_care/medicaid/

---

### New York State Home and Community-Based Services (HCBS) Waiver Programs


**Eligibility:**
- Income: Must meet Medicaid financial eligibility requirements; child's income only (parent income waived for children's waivers). No specific dollar amounts or household size table provided in sources[1][2][3][5].
- Assets: Medicaid asset thresholds apply (not detailed in sources); specific counts/exemptions not specified[2][5].
- Diagnosis of developmental disability, intellectual disability, or autism[1][3][4][6].
- Eligible for Intermediate Care Facility for Individuals with Intellectual Disabilities (ICF/IID) level of care[1][3][4].
- Eligible for Medicaid[1][5].
- Choose HCBS waiver services over institutional care[1].
- Reside in New York State[1].

**Benefits:** Day Habilitation, Live-in Caregiver, Prevocational Services, Residential Habilitation, Respite, Supported Employment (SEMP), Fiscal Intermediary (FI), Support Brokerage, Assistive Technology – Adaptive Devices, Community Habilitation, Community Transition Services, Environmental Modifications (Home Accessibility), Family Education and Training, Individual Directed Goods and Services, Intensive Behavioral Services, Pathway to Employment, Vehicle Modifications, Home-Enabling Supports (HES)[3][4][6]. No specific dollar amounts or hours per week stated.
- Varies by: priority_tier

**How to apply:**
- Contact the Developmental Disabilities Services Office (DDSO) that serves the county of residence[1].
- Visit OPWDD website for DDSO contacts: http://www.opwdd.ny.gov/document/hp_contacts.jsp[1].
- Contact local Medicaid office or developmental disabilities agency for intake[2].

**Timeline:** Not specified in sources.
**Waitlist:** Some waiver programs have long waiting lists, especially for high-demand services[2].

**Watch out for:**
- Targets developmental disabilities, intellectual disabilities, autism—not general elderly care unless they have qualifying diagnosis[1][3][4][6].
- Must meet ICF/IID level of care, not just nursing home level[1][3].
- Long waitlists common[2].
- Must choose waiver over institutional care[1].
- Some waivers transitioned or incorporated into Managed Long-Term Services and Supports (MLTSS)[7].
- Administered by OPWDD; separate from general elderly HCBS waivers[6].

**Data shape:** Multiple waivers under OPWDD HCBS (e.g., Comprehensive Waiver); targets developmental disabilities across all ages (0+); county-based DDSO access; no fixed income/asset tables in sources; benefits fixed by service menu, not scaled by household; waitlists and regional provider variations.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://opwdd.ny.gov/providers/home-and-community-based-services-waiver[6]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No specific income limits or dollar amounts mentioned; most participants are dually eligible for Medicare and Medicaid, but private pay options exist for those who qualify otherwise[1][2][4].
- Assets: No asset limits, tests, or exemptions specified in sources[1][2][3].
- Live in the service area of a PACE organization[3][4][5]
- Eligible for nursing home level of care, certified by New York State[2][5]
- Require more than 120 days of community-based long-term care services[4][5]
- Able to live safely in the community at the time of enrollment (with PACE assistance)[3][4][5]

**Benefits:** Comprehensive medical and social services including primary care by geriatricians, nursing, social work, physical/occupational/recreational therapy, dietitian services, home health aides, transportation, prescriptions delivered to door, eye/foot/dental care, hearing aids, wound/palliative care, nutritional counseling, meals at day centers, social/recreational activities; all Medicare and Medicaid benefits become provided solely through PACE; 24/7 care coordination; services at PACE centers and in-home[1][2][3][4][5][7][8]
- Varies by: region

**How to apply:**
- Contact specific PACE providers directly (e.g., ElderONE for Rochester area, ArchCare Senior Life for Bronx/Westchester); no statewide central phone or URL listed[4][5]
- NY Medicaid Choice for general guidance: implied via nymedicaidchoice.com/pace but contact providers for enrollment[8]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; regional variations likely exist but not detailed

**Watch out for:**
- Not statewide—must live in a PACE service area; check specific provider coverage first[2][4][5]
- Becomes sole source of all Medicare/Medicaid benefits; cannot use other plans[3]
- Nursing home-level care certification required by NYS, plus >120 days community LTSS need[2][4][5]
- Private pay possible but most are dual eligibles; disenroll anytime[1][3][4]
- No central application—must contact local PACE organization[4][5][8]

**Data shape:** county-restricted to PACE provider service areas (limited centers/providers, e.g., ElderONE at 3 counties, ArchCare at Bronx/Westchester); no income/asset tests specified; dual eligibility common but not required; benefits comprehensive and capitated via interdisciplinary teams at local centers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal); https://www.nymedicaidchoice.com/pace (NY-specific guidance); contact local providers for applications[1][8]

---

### Medicare Savings Program (MSP) - QMB, SLMB, QI


**Eligibility:**
- Income: New York uses more generous standards than federal minimums. For QMB: up to 138% FPL (e.g., individual ~$1,350/month, couple ~$1,824/month in 2026). SLMB: 138%-120%? FPL (federal ~$1,526 individual, $2,064 couple). QI-1: greater than 138% but less than 186% FPL (federal ~$1,715 individual, $2,320 couple); exact NY amounts align with federal resource-adjusted nets. Limits updated annually in April; full household tables not specified but scale by FPL for size (e.g., add ~$600/person beyond couple). Net income after deductions.[4][5]
- Assets: Applies: ~$9,950 individual, $14,910 couple (2026 federal/NY-aligned). Counts: bank accounts, stocks. Exempts: home, car, burial plots, life insurance (up to limits), personal items. NY may exclude more; check state.[1][3][5]
- Must be eligible for Medicare Part A (QMB even if not enrolled); Part A & B required for SLMB/QI.
- NY resident.
- U.S. citizen or qualified immigrant.
- Not eligible for other Medicaid if QI-1.

**Benefits:** QMB: Medicare Part A premium (if applicable), Part B premium/deductible/coinsurance/copays. SLMB: Part B premium only. QI: Part B premium only (QI-1 annual). No cap on services; full coverage of specified costs. Auto-qualifies QI for Extra Help (drug costs ≤$12.65/drug in 2026).[1][4][5]
- Varies by: priority_tier

**How to apply:**
- Phone: HRA Medicaid Helpline 888-692-6116 (NYC); local DSS (e.g., Wyoming County 585-786-8900).[4][6]
- In-person: Community Medicaid Office or local DSS/Office for the Aging.
- Mail: Request form via phone, submit to local office.
- Online: NY State of Health (healthcare.ny.gov) or local DSS portals (not specified for MSP-only).

**Timeline:** QMB: ≤45 days, effective 1st of following month. SLMB/QI: retroactive up to 3 months; QI effective month of application.[1][4]
**Waitlist:** QI-1: first-come first-served, annual (Jan-Dec), priority to prior recipients; may fill.[4][5]

**Watch out for:**
- NY expands to 138% FPL for QMB (vs federal 100%); use net income after deductions.[4]
- QI-1 annual reapply, fills fast, no dual Medicaid eligibility.[4][5]
- Assets exempt home/car but count stocks; states can't be less generous.[1]
- Effective dates vary: QMB next month, QI immediate/retro.[1][4]
- Apply MSP-only (short form) if above Medicaid thresholds.

**Data shape:** NY generous FPL (QMB to 138%, QI to 186%); tiered by income brackets; asset test applies; local DSS administration with uniform rules but regional contacts; QI waitlist/priority.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ny.gov/services/apply-medicare-savings-programs or local DSS; NYC: https://www.nyc.gov/site/hra/help/medicare-savings-program.page

---

### Supplemental Nutrition Assistance Program (SNAP) / ESAP / NYSCAP


**Eligibility:**
- Age: 60+
- Income: For ESAP/NYSCAP (Oct 1, 2025 - Sept 30, 2026): Households with all adults (18+) as seniors (60+) or disabled, no earned income. Gross income up to 200% FPL if applicable, or net income at 100% FPL: 1 person $1304/mo, 2 $1763, 3 $2221, 4 $2679, 5 $3138, 6 $3596, 7 $4054, +$458 each additional. Expanded gross for seniors/disabled: 1 person $2608/mo. NYSCAP specific: SSI recipients living alone (seniors/disabled). General SNAP has broader limits (e.g., 130%-200% FPL gross by household type).[1][2][6]
- Assets: Households with elderly/disabled member: $4500 max. Without: $3000 max. Exemptions not detailed but standard SNAP rules apply (e.g., home, car often exempt).[6]
- All adult (18+) household members must be 60+ or disabled (SSI/SSD/VA 100%/disability Medicaid) for ESAP; no earned income.
- NYSCAP: Must receive SSI and live alone (includes 18-21 SSI 'A/A' coded even with parents if separate SNAP household).
- Not eligible for NYSCAP excludes from ESAP.
- Children/disabled children allowed in ESAP.
- Report changes in composition/income; transition to regular SNAP if ineligible.

**Benefits:** Monthly EBT card for food purchases; amount based on net income, household size (exact via SNAP budget calculation). ESAP/NYSCAP: Simplified process, 36-month certification, no recert interview, less verification.[2][5][7]
- Varies by: household_size

**How to apply:**
- Online: myBenefits.ny.gov
- Phone: Local DSS (find via otda.ny.gov/programs/snap/) or 1-800-342-3009
- Mail/Paper: LDSS-5166 (ESAP form) or standard SNAP form to local DSS
- In-person: Local Department of Social Services (DSS) office

**Timeline:** Standard SNAP: 30 days (expedited <7 days if very low income); ESAP simplified but no specific timeline variation noted.[4][7]

**Watch out for:**
- ESAP requires NO earned income and ALL adults 60+/disabled; earned income or new adult disqualifies (transition to regular SNAP).
- NYSCAP auto-enrolls SSI solo seniors/disabled; dual-eligible with ESAP must use NYSCAP.
- 18-21 SSI 'A/A' can be separate household from parents.
- Must report household changes promptly.
- Income limits expanded in NY beyond federal; always apply to confirm.
- Assets apply unless exempt.

**Data shape:** Elderly/disabled-specific SNAP streams (NYSCAP auto for SSI solo; ESAP simplified for all-adult elderly/disabled households no earned income); benefits scale by household size/net income; statewide but local DSS processing.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://otda.ny.gov/programs/snap/

---

### Home Energy Assistance Program (HEAP)


**Eligibility:**
- Income: Household gross monthly income must be at or below 130% of federal poverty level for household size[8]. Alternatively, eligibility is automatic if at least one household member receives SNAP, Temporary Assistance (TA/Public Assistance), or Code A Supplemental Security Income (SSI) Living Alone[4]. For households with a member age 60 or older or under age 6, available resources must be less than $3,750; otherwise less than $2,500[3]. Specific dollar amounts vary by household size but are posted in income guideline tables on the OTDA website[4].
- Assets: Available resources: less than $2,500 for most households; less than $3,750 if any household member is age 60 or older or under age 6[3]. Exempt resources include certain items, though the search results do not specify which resources are exempt[2].
- U.S. Citizen or Qualified Non-Citizen status; valid Social Security number required for each household member[3][4]
- Heating and/or electric bill must be in applicant's name[3]
- Must reside in the dwelling for which assistance is requested[2]
- Primary heating source must be documented[1]
- Household must have heating responsibilities (tenants in government-subsidized housing with heat included in rent do not qualify)[7]

**Benefits:** Base benefit amounts vary significantly by living situation and heating source: $21 for government-subsidized housing or group homes with heat included; $45-$50 for households with heating costs included in rent; $900+ for households with oil, kerosene, or propane as primary heat paying directly to vendor; $635+ for households with wood, wood pellets, coal, corn, or other deliverable fuel paying directly to vendor[3]. Additional add-ons of $61 available for Tier 1 income households paying directly for heat[8]. One Regular HEAP benefit per program year[4].
- Varies by: household_size, primary_heating_source, presence_of_vulnerable_household_member

**How to apply:**
- In-person: Visit local Department of Social Services (DSS) office or HEAP Local District Contact[6]
- Phone: Call 718-557-1399 for HEAP assistance[9]
- Phone: Call 311 to ask for help with HEAP[9]
- Online: Visit OTDA website at ny.gov/services/apply-heating-assistance-heap[3]
- Mail: Contact local DSS office for mailing procedures[6]

**Timeline:** Not specified in search results
**Waitlist:** Emergency HEAP opens January 2, 2026 and closes April 7, 2026[6]. Regular HEAP opened December 1, 2025[4]. No general waitlist information provided.

**Watch out for:**
- Tenants in government-subsidized housing where heat is included in rent do NOT qualify[7]
- Individuals paying room and board in private residences do not qualify[7]
- Residents of care facilities and dormitories do not qualify[7]
- Bank statements cannot be used as proof of monthly income; only pay stubs, tax returns, or pension statements[7]
- For Emergency HEAP, a utility shutoff notice is required AND the program has a limited window (January 2 - April 7, 2026)[6]
- Heating and/or electric bill MUST be in the applicant's name; this is a hard requirement[3]
- One Regular HEAP benefit per program year only[4]
- For elderly applicants (age 60+) seeking heating equipment repair/replacement (HERR program), they must have owned AND resided in the dwelling for 12 months preceding application[2]
- Income limits are based on 130% of federal poverty level, which varies by household size; families must check the specific table for their size[8]
- Vulnerable household members (under age 6, age 60+, or permanently disabled) trigger higher asset limits ($3,750 vs. $2,500) but do not automatically qualify the household[3]

**Data shape:** HEAP benefits scale significantly by primary heating source and living situation, ranging from $21 to $900+. The program has two distinct benefit types: Regular HEAP (available year-round, opened December 1, 2025) and Emergency HEAP (limited window: January 2 - April 7, 2026, requires shutoff notice). Income eligibility is automatic for SNAP/TA/SSI recipients regardless of income level, but other households must meet 130% federal poverty level threshold. Asset limits vary based on presence of vulnerable household members. The program is statewide but administered through local DSS offices, creating potential regional variation in processing and availability. Heating equipment repair/replacement (HERR) is a separate benefit with stricter age and residency requirements.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ny.gov/services/apply-heating-assistance-heap and https://otda.ny.gov/programs/heap/

---

### Weatherization Referral and Packaging Program (WRAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households with incomes at or below 60% of New York State median income (SMI), aligned with HEAP income guidelines. Automatic eligibility if a household member receives SSI, Public Assistance, SNAP, or HEAP benefits. Specific dollar amounts vary annually by household size and are not listed in sources; families must check current HEAP guidelines via OTDA or local providers[1][5][8].
- Assets: No asset limits mentioned in sources.
- Low-income homeowners and renters (renters in some regions like Nassau County via WRAP); priority for seniors, families with children, and persons with disabilities[1][5][8]

**Benefits:** Weatherization services including air sealing (weather stripping, caulking), attic and wall insulation, heating system improvements or replacement, lighting efficiency upgrades, hot water tank and pipe insulation, refrigerator replacements with Energy Star units. WRAP specifically includes energy audits to address social, health, or safety issues such as insulation, caulking windows/doors, window repair, door replacement, heating system repair, pipe/water heater wrapping. Average energy savings exceed 20%. Up to $6,500 per unit maximum in some contexts, with typical construction $3,000-$4,000[1][3][5][8].
- Varies by: priority_tier

**How to apply:**
- Contact local provider (e.g., for Nassau County via EAC Network as part of HEAP/WRAP; Chautauqua County: Chautauqua Opportunities, Inc. at 716-661-9430[5][8]
- List of statewide providers via https://otda.ny.gov/workingfamilies/wap.asp[1]
- HCR site for more info: https://hcr.ny.gov/weatherization[6]

**Timeline:** Not specified; involves application submission, eligibility confirmation when funding available, energy audit, work installation, and final inspection[1].
**Waitlist:** Funding-dependent; local provider contacts when funds available[1].

**Watch out for:**
- WRAP is a referral/packaging component often bundled with HEAP, not standalone; priority groups (seniors, children, disabled) get preference but no guaranteed age cutoff; renters eligible statewide but NYC excludes individual renters (homeowners/building owners only); must contact local provider as no central application; buildings weatherized after 1994 ineligible for repeat; owner may need 25% match for multi-family (waivers possible)[1][2][3][8]
- Income tied to HEAP guidelines, which change yearly—verify current levels.

**Data shape:** Referral and packaging tied to local HEAP/WAP delivery; priority-based with automatic eligibility via benefits receipt; local subgrantees handle delivery with regional providers; no fixed dollar benefits per household, services determined by energy audit.

**Source:** https://otda.ny.gov/workingfamilies/wap.asp

---

### State Health Insurance Assistance Program (SHIP) / Health Insurance Information, Counseling and Assistance Program (HIICAP)


**Eligibility:**
- Income: No income limits, asset limits, or financial requirements. Open to all Medicare beneficiaries and New York residents who will soon become Medicare eligible (typically age 65 or qualifying under 65 via SSDI for 24 months or ALS).[1][2]
- Assets: No asset limits or tests apply. No specification of countable or exempt assets.
- Must be a Medicare beneficiary or soon-to-be eligible New York resident (includes U.S. citizens or legal permanent residents for at least five years if not SSDI-eligible).[1][2]

**Benefits:** Free, confidential, unbiased one-on-one counseling and assistance on Medicare benefits/options/paperwork, Medicare Advantage, Medigap, Part D prescription plans, costs/deductibles, low-income programs (e.g., EPIC, Medicare Savings Programs, Extra Help), health insurance problem resolution, claims filing, and referrals. Provided by nearly 500 trained counselors statewide; no fixed hours, dollar amounts, or limits specified.[1][4][6]

**How to apply:**
- Phone: Toll-free hotline 1-800-701-0501 (routed to local county HIICAP office); In-person: Schedule appointment via local Area Agency on Aging (AAA) office; Website: https://aging.ny.gov/health-insurance-information-counseling-and-assistance-programs (for info and local contacts); NYC-specific: 212-AGING-NYC (212-244-6469).[1][2][3]

**Timeline:** Immediate phone routing and counseling scheduling; no formal application processing time as it's not an enrollment program.

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling/info, no direct payments or coverage; people confuse it with income-based aid like EPIC (which has limits: e.g., $35k single/$50k couple for some discounts); must be/will be Medicare-eligible (not general health insurance help); services via local AAA, not centralized.[1][4][7]

**Data shape:** no income/asset test; counseling-only service via statewide AAA network; open to pre-Medicare eligible NY residents; county-routed access.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ny.gov/health-insurance-information-counseling-and-assistance-programs

---

### Meals on Wheels (via Expanded In-Home Services for the Elderly Program - EISEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits; open regardless of income with sliding scale cost-sharing starting at 150% of poverty level, increasing proportionately with income and services received[2][3][4].
- Assets: No asset limits mentioned in program guidelines[2][3][4].
- Need assistance with at least one activity of daily living (ADL) or two instrumental activities of daily living (IADLs)[2][3].
- Able to be maintained safely at home with services[2][3][5][6].
- Not eligible for the same services under Medicaid[2][3][5][6][7].
- Physically or mentally incapacitated and unable to prepare nutritious meals or have no one to do so (for meals component)[1].

**Benefits:** Case management for all; additional services may include home-delivered meals (Meals on Wheels, typically 5 days/week), non-medical in-home services (personal care, housekeeping), noninstitutional respite, ancillary services (e.g., emergency response systems, home repairs), subsidized personal care/housekeeping aide[2][4][5][6][7]. Suggested contribution for meals ~$4/meal in some areas, no refusal for inability to pay[6].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or NY Connects at 1-800-342-9871[2].
- County-specific: e.g., Wyoming County Office for the Aging at 585-786-8833[5]; Genesee County at 585-343-1611[6]; enter address on citymeals.org/get-meals for NYC case management agency[1].

**Timeline:** Not specified; comprehensive assessment by case manager upon contact[4].
**Waitlist:** Not mentioned; services based on need and availability through local agencies[2][4].

**Watch out for:**
- Meals on Wheels is one component within EISEP, not standalone; requires full EISEP eligibility assessment via case management[2][4][6].
- Cost-sharing (fees) based on income despite 'regardless of income' eligibility; starts at 150% poverty level[3][4].
- Excludes those eligible for Medicaid for same services; even homecare/Medicaid recipients may qualify if meals don't meet dietary needs[1][2].
- Services supplement informal care, not replace it; consumer-directed option has extra requirements (e.g., ability to manage workers)[3].
- Regional: Must contact local agency; NYC uses address-based case agencies[1], rural counties have specific offices[5][6].

**Data shape:** Statewide but locally administered with county-specific providers, case managers, and variations in service delivery/meals details; no fixed income/asset caps but mandatory sliding-scale cost-sharing; meals tied to functional impairment assessment.

**Source:** https://aging.ny.gov/expanded-home-services-elderly-eisep

---

### Respite Care Program (NYFSC) / Caregiver Resource Centers


**Eligibility:**
- Age: 60+
- Income: No specific income limits stated in available sources. However, preference is given to care recipients with annual incomes of $40,000 or less for emergency/extended hours services.[3][6]
- Care recipient must be over age 60[3][10]
- Care recipient must reside in New York City (all five boroughs)[3][10]
- Care recipient must NOT be Medicaid eligible[3][7][10]
- Care recipient must have a family member or other unpaid caregiver providing daily care and/or supervision[1]
- Care recipient must be frail and/or have disabilities requiring assistance with daily needs or regular supervision[1]
- Caregiver must be age 18 or older[2]

**Benefits:** Trained and Certified Home Attendants provide: personal care and hygiene, light housekeeping, shopping and cooking, laundry, escorting and companionship.[3] Basic service starts at $7.15 per hour plus carfare (as of 2007 data).[6] Emergency/Extended Hours service is provided at no charge for qualifying caregivers.[6]
- Varies by: priority_tier

**How to apply:**
- In-person: 11 Park Place, 14th Floor, New York, NY 10007-2801[3]
- Phone: (212) 962-7559[3]
- Email: nyfscinc@aol.com[3]
- Mail: 11 Park Place, 14th Floor, New York, NY 10007-2801[3]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Medicaid eligibility is a disqualifier — this program explicitly serves those NOT eligible for Medicaid.[3][7][10] If the care recipient qualifies for Medicaid, they should explore state respite programs instead (NY Office for the Aging programs).[1]
- This is a NYC-only program — it does not serve the rest of New York State. Families outside NYC should contact the NY Office for the Aging or their local Area Agency on Aging.[1]
- Income preference ($40,000 or less) applies only to emergency/extended hours services, not the basic respite care program.[6]
- Care recipients pay home health aides directly for basic services (starting at $7.15/hour as of 2007 data — current rates not specified).[3][6]
- The program is specifically for caregivers of frail elderly over 60 — younger adults with disabilities are not eligible through NYFSC, though they may qualify through NY state programs (NFCSP, EISEP).[1]
- Processing time and waitlist information are not publicly available — families should contact directly to understand current timelines.

**Data shape:** This program has a two-tier benefit structure: basic respite care (fee-based, starting at $7.15/hour) and emergency/extended hours care (free, with income preference for recipients earning $40,000 or less annually). The program is geographically limited to NYC and explicitly excludes Medicaid-eligible individuals, making it a niche program for non-Medicaid seniors in the five boroughs. No income or asset limits are stated for basic eligibility, only a preference for lower-income recipients in the emergency tier. Processing timelines and current waitlist status are not documented in public sources.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nyfsc.org/support-services/respite-care-program/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level. The search results do not provide specific dollar amounts by household size, as federal poverty guidelines are updated annually. Families should verify current limits with their local SCSEP office or the U.S. Department of Health and Human Services poverty guidelines.[1][4]
- Assets: Not specified in available search results.
- Must be unemployed[1][4]
- U.S. citizenship or work authorization status not explicitly stated in search results but implied by federal program requirements

**Benefits:** Participants work an average of 20 hours per week and are paid the highest of federal, state, or local minimum wage.[1][2][4] As of April 2026, this means minimum wage in New York State (currently $15.00/hour statewide for most workers, though higher in some localities). At 20 hours/week, this translates to approximately $300-$400+ per week depending on local rates. Additional services include: Individual Employment Plan development, orientation, community service placement, training specific to the assignment, supportive services, annual physicals, assistance securing unsubsidized employment, and access to American Job Centers.[1]
- Varies by: region (minimum wage varies by locality in New York)

**How to apply:**
- In-person at local SCSEP offices (hours vary by location; example: Crispus Attucks York office open Monday-Friday 8:30 AM–5:00 PM)[6]
- Phone: For NYC residents, call Aging Connect at 212-244-6469 (212-AGING-NYC) and ask for employment services[9]
- Contact local American Job Centers for referral and assistance[1]
- Regional provider organizations (approximately 50 local partner organizations operate SCSEP across New York and other states)[4]

**Timeline:** Not specified in search results. Families should contact their local SCSEP office for current processing timelines.
**Waitlist:** Not mentioned in search results. The program notes it is 'experiencing a period of transition due to changes and delays in federal funding,' but specific waitlist information is not provided.[7]

**Watch out for:**
- Income limit is strict: 125% of federal poverty level. For 2026, this is approximately $1,548/month for a single person (varies by household size). Any income above this threshold disqualifies applicants, including Social Security, pensions, and part-time work.[1][4]
- Program is experiencing federal funding delays and transitions as of the search date. Availability and funding levels may vary by region and change over time.[7]
- This is part-time work (20 hours/week average), not full-time employment. It is designed as a 'bridge to unsubsidized employment,' meaning it is temporary training, not permanent employment.[1][2]
- Participants must be unemployed. Having any current employment, even part-time, may disqualify applicants.[1][4]
- The program prioritizes certain groups (veterans, age 65+, disabled individuals). If an applicant does not fall into a priority category, they may experience longer wait times or lower enrollment likelihood during periods of limited funding.[1][2]
- Training is in community service roles (schools, hospitals, nonprofits, senior centers), not necessarily in the field the participant wants to work in long-term. The goal is skills-building and employment readiness, not direct job placement in a specific career.[1][5]
- Supportive services (annual physicals, counseling, resume help) are available but not guaranteed to all participants; availability depends on local provider capacity.[1]
- No mention of asset limits in search results. Families should clarify with their local office whether savings, home equity, or other assets affect eligibility.

**Data shape:** SCSEP is a federally funded program administered by the U.S. Department of Labor under the Older Americans Act, but delivered through state agencies and approximately 50 local nonprofit partner organizations across New York. Benefits are fixed (20 hours/week at minimum wage) but vary by region due to different state and local minimum wage rates. Eligibility is uniform statewide (age 55+, unemployed, income ≤125% poverty level) but enrollment priority tiers may affect access during funding constraints. The program is currently experiencing federal funding delays, which may affect availability and processing times by region. Application methods and contact information vary significantly by county and local provider.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); https://aging.ny.gov/senior-community-service-employment-program-scsep (New York State Office for the Aging)

---

### Legal Services for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict statewide income limits; many programs (especially Title III-B funded) do not condition services on income or resources. Some providers require low-income status (e.g., ~125% of Federal Poverty Guidelines) unless referred by local Office for Aging. Encouraged for low-income, subsistence income, or threatened loss of income, but exact dollar amounts vary by provider and are not universally applied.[1][2][3][4][5]
- Assets: Generally no asset limits; financial eligibility often not required, particularly for Title III-B programs. Low resources considered for some providers.[2][3][5]
- NY resident (specific counties/boroughs depending on provider)
- Low-income or inability to afford private legal help (priority, not always required)
- Nursing home/assisted living resident, chronic health issues, homelessness risk, limited English, guardianship, abuse/neglect/exploitation victim, physical isolation[1][3]

**Benefits:** Free or low-cost civil legal advice, counseling, representation, and referrals on issues including: Social Security/SSI, Food Stamps, pensions, HEAP, tenant issues, home repair fraud, Medicare/Medicaid, nursing home/adult home issues, abuse/financial exploitation, ADA, grandparents’ rights, consumer issues, wills/estate planning, health care proxies, powers of attorney, housing, public benefits applications/appeals, evictions, patients’ rights. Provided in client's language; pro bono attorneys for some.[1][2][4][5][7]
- Varies by: region

**How to apply:**
- Contact local Office for the Aging or provider: e.g., Aging Connect at 212-AGING-NYC (212-244-6469) for NYC[4]
- Legal Aid Society of Mid-NY (Central NY counties)[2]
- Dutchess County Office for the Aging: 845-486-2555 or 866-486-2555[5]
- Legal Services of the Hudson Valley: 845-471-0058[5]
- VOLS Senior Law Project (NYC)[7]
- Use NYC Aging’s Find Services locator for legal services[4]
- Local providers vary by county (e.g., lasnny.org for Albany[1])

**Timeline:** Not specified in sources

**Watch out for:**
- Not a single statewide program—must contact local Office for Aging or provider for your county; some require low-income unless referred; voluntary contributions may be suggested (e.g., $10 consultation) but do not affect eligibility; focuses on civil matters only, not criminal; Title III-B funded services cannot deny based on income[1][3][4]

**Data shape:** Decentralized by county/region with local providers; no uniform income/asset tests (many none); priority for vulnerable seniors; varies significantly by location

**Source:** https://aging.ny.gov/legal-services-initiative

---

### Senior Citizen Homeowners' Exemption (SCHE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"description":"Total combined annual income of all property owners and spouses cannot exceed $58,399.[1][2]","income_sources_included":"Social Security, retirement benefits, interest, dividends, IRA earnings, capital gains, net rental income, salary or wages, net income from self-employment, W2s, and 1099s.[1][2]","income_calculation_note":"If you file personal income tax returns, use adjusted gross income (AGI) minus the taxable amount of any IRA distributions or distributions from individual retirement annuities. You may also deduct certain unreimbursed medical expenses.[2]","exemption_tiers":{"$0–$50,000":"50% reduction in assessed value","$50,001–$50,999":"45% reduction","$51,000–$51,999":"40% reduction","$52,000–$52,999":"35% reduction","$53,000–$53,899":"30% reduction","$53,900–$54,799":"25% reduction","$54,800–$55,699":"20% reduction","$55,700–$56,599":"15% reduction","$56,600–$57,499":"10% reduction","$57,500–$58,399":"5% reduction"}}
- Property ownership: Must own the property for at least 12 consecutive months prior to filing for the exemption, unless you received the exemption on a previously-owned residence.[1][2][3]
- Residency: All owners must occupy the property as their primary residence, except in cases of divorce, legal separation, or abandonment. Owners receiving in-patient care at a residential health care facility may be eligible.[2]
- Property type: Applies to one-, two-, or three-family homes, condominiums, or cooperative apartments.[1][2][3]
- Exclusive residential use: If a portion of the property is used for non-residential purposes, the exemption applies only to the residential portion.[3]

**Benefits:** Reduction of assessed property value by 5% to 50%, depending on income level. Maximum 50% reduction available for incomes between $0–$50,000; reduction phases out to 5% for incomes between $57,500–$58,399.[1][3]
- Varies by: income

**How to apply:**
- Online: Submit SCHE online initial application at the NYC Department of Finance website (available September 15 to March 15 annually).[2]
- Phone: Call 311 for general assistance or visit www.nyc.gov/contactdof.[2]
- Mail: Paper applications will be available (specific mailing address not provided in search results).[2]
- In-person: Contact NYC Department of Finance through www.nyc.gov/contactdof.[2]

**Timeline:** Not specified in search results.

**Watch out for:**
- Application window is limited: Online applications are only available September 15 to March 15 each year.[2]
- Income includes all sources: Many seniors forget to count Social Security, retirement benefits, interest, dividends, and capital gains—all of which count toward the $58,399 limit.[1][2]
- Spouse income counts: If married, your spouse's income must be included in the total combined income calculation, even if they don't own the property, unless legally separated or abandoned.[2][4]
- 12-month ownership requirement: You must have owned the property for at least 12 consecutive months before applying, unless you previously received SCHE on another residence.[2][3]
- Primary residence only: The property must be your primary residence; investment properties or vacation homes do not qualify.[2][3]
- NYC vs. rest of New York: The SCHE is specific to NYC. If you live elsewhere in New York State, you may qualify for a different Senior Citizens Exemption with different income limits set by your local municipality.[4][5]
- Income calculation complexity: If you received SCHE benefits prior to July 1, 2024, you have an alternative income calculation method; if you received benefits after that date, you must use the AGI method.[2]
- Partial property exemption: If part of your property is used for non-residential purposes (e.g., a home office used for business), the exemption applies only to the residential portion.[3]

**Data shape:** This program's benefits scale by income in 10 distinct tiers, with the maximum 50% reduction available only for incomes up to $50,000 and a gradual phase-out to 5% for incomes up to $58,399. The program is NYC-specific and administered uniformly across all five boroughs by the NYC Department of Finance. Application is limited to a 6-month window annually (September 15–March 15). Income calculation includes all household income sources and requires careful documentation. The 12-month ownership requirement and primary residence requirement are strict eligibility gates.

**Source:** https://www.nyc.gov/site/finance/property/landlords-sche.page

---

### Senior Citizen Rent Increase Exemption (SCRIE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: Annual household income must be $50,000 or less. No variation by household size specified; applies to total household income.[5][7]
- Assets: No asset limits mentioned in program requirements.[1][2][3][5]
- Must reside in a rent-regulated apartment (rent-stabilized, rent-controlled), hotel unit, Mitchell-Lama, limited dividend companies, redevelopment companies, Section 213 cooperatives, or HDFC cooperative apartments.[3][5]
- Must pay at least one-third (1/3) of household income toward rent.[3][5]
- Must be named on the lease or rent order.[3]

**Benefits:** Freezes rent at the current level and exempts tenant from future legal rent increases (e.g., rent-guided increases). Landlord receives equivalent tax abatement credit (TAC) to cover exempted amount.[1][5]

**How to apply:**
- Online: NYC Tenant Access Portal (NYC TAP) at the Rent Freeze Program page (specific URL: nyc.gov/site/finance/property/landlords-scrie.page, linking to full details).[1][7]
- Phone: Call 311 or 212-NEW-YORK (212-639-9675); TTY: 212-639-9675; HPD-supervised: 212-863-8494.[7][8]
- Mail: Request application by calling 311 or 212-639-9675.[7]
- In-person: Assistance via NYC Public Engagement Unit at 929-252-7242; HPD developments via HPD.[8]

**Timeline:** Not specified in sources.

**Watch out for:**
- Benefits not automatic; must renew with every new lease or ~60 days before expiration, or risk losing freeze.[1][5]
- One-time income spike above $50,000 disqualifies but allows reapplication in following calendar year if income drops back below limit.[7]
- Pandemic unemployment counted as income; stimulus checks not counted.[7]
- Only applies to specific rent-regulated housing types; not all apartments qualify.[3][5]
- Landlord receives TAC, but discrepancies require separate adjustment form.[1]

**Data shape:** NYC-focused with fixed $50,000 income cap (no household size adjustment); rent burden test (1/3 income); limited to rent-regulated units; renewal mandatory; available in select non-NYC counties via local option.

**Source:** https://www.nyc.gov/site/finance/property/landlords-scrie.page

---

### Enhanced STAR Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: At least one resident owner must be 65 years old as of December 31 of the benefit year. If owners are spouses or siblings, only one resident owner needs to meet the age requirement.[1][3]+
- Income: Combined income of all owners (residents and non-residents) and any owner's spouse who resides at the property cannot exceed $110,750 for the 2026 benefit year (based on 2024 income).[1][5][7] Note: Income limits are adjusted annually and have increased from $107,300 in 2023 to $110,750 in 2026.[5][6]
- Assets: No asset limits specified in available sources.
- Property must be owner-occupied primary residence[1][2]
- Applicant must own the property[1]
- Must enroll in the Income Verification Program (does not apply to new homeowners or first-time STAR applicants; only required once)[5]
- Starting in 2026, automatic eligibility upgrade: if you currently receive Basic STAR and become eligible for Enhanced STAR, New York State will automatically notify your assessor—no separate application needed[5]

**Benefits:** Property tax exemption on school taxes. Enhanced STAR provides greater savings than Basic STAR. Tax savings increase by 2% yearly.[4]
- Varies by: fixed (all eligible seniors receive the same exemption level, though the dollar value depends on local property tax rates)

**How to apply:**
- Online: www.tax.ny.gov/star[3]
- Phone: (518) 457-2036[3]
- In-person/Mail: Through your local assessor's office (for those not automatically upgraded starting in 2026)[5]

**Timeline:** Not specified in available sources. Starting in 2026, automatic upgrades eliminate the need for separate applications for those already receiving Basic STAR.[5]
**Waitlist:** No waitlist mentioned in available sources.

**Watch out for:**
- Age qualification timing: You can apply for Enhanced STAR in the year you turn 65, even if you turn 65 on December 31, as long as you apply before the March 1 deadline.[5]
- Income Verification Program enrollment: If you're applying or reapplying for Enhanced STAR (not new homeowners or first-time STAR applicants), you must enroll in the Income Verification Program. You only enroll once; after that, NYS verifies your income eligibility annually with no further deadlines to miss.[5]
- Automatic upgrade starting 2026: If you currently receive Basic STAR and become eligible for Enhanced STAR, you no longer need to apply to your assessor. New York State will automatically notify your assessor and upgrade you.[5]
- Income limits apply to combined household income: The $110,750 limit includes all owners (residents and non-residents) plus any owner's spouse who resides at the property. Non-resident owners' income is included in the calculation.[1]
- Surviving spouse eligibility: Surviving spouses may be eligible to retain the Enhanced STAR benefit, but specific conditions are not detailed in available sources.[1]
- Missing the deadline: If you miss the March 1 deadline, you may still be eligible if you can demonstrate good cause, but this requires additional action.[5]

**Data shape:** Enhanced STAR is a property tax exemption program (not a service-based program). The key structural change in 2026 is the shift from local assessor-based applications to automatic state-level eligibility determination for those already receiving Basic STAR. Income limits are adjusted annually. The program requires income verification but does not share tax returns with assessor offices. Eligibility is binary (you either qualify or don't) rather than tiered, though the dollar value of tax savings varies by property tax rates in each school district.

**Source:** https://www.tax.ny.gov/pit/property/star/eligibility.htm

---

### Expanded In-home Services for the Elderly Program (EISEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits; eligibility regardless of income. Participants required to cost-share on a sliding scale based on income and service costs, ranging from no-cost to full-cost.
- Assets: No asset limits mentioned.
- Not eligible for Medicaid
- Need assistance with personal care or household chores due to illness or disability (frail individuals facing challenges with activities of daily living)
- Supplements informal care already in place

**Benefits:** Core services for all: case management (assessment, coordination, monitoring). Additional services may include: in-home assistance (Personal Care I: housekeeping, cooking, shopping; Personal Care II: bathing, dressing, grooming), noninstitutional respite for caregivers, ancillary services (e.g., home-delivered meals, emergency response systems, home repairs, subsidized social adult day care). No fixed dollar amounts or hours specified; services coordinated based on assessed needs.
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging or NY Connects at 1-800-342-9871
- County-specific: e.g., Jefferson County - print application or apply over phone; Nassau County - (516) 992-0081 or alicia.mercurio@eac-network.org; Monroe County - through providers like Catholic Charities, Urban League of Rochester, Lifespan, Jewish Family Service

**Timeline:** Not specified statewide; depends on home care aide availability in area
**Waitlist:** Wait times vary by region based on local provider and aide availability

**Watch out for:**
- Not available if eligible for Medicaid - explicitly excludes those on Medicaid
- Requires cost-sharing via sliding scale (not free for all, even if low-income)
- Services supplement existing informal care, not replace it
- Wait times depend on local home care aide availability - can be significant in some areas
- Must contact local agency; no centralized statewide application
- All clients get case management first; additional services based on assessment

**Data shape:** Managed regionally by local Area Agencies on Aging with varying providers; no strict income/asset tests but sliding scale cost-share; wait times and availability county-dependent; core case management for all, tiered additional services by need

**Source:** https://aging.ny.gov/expanded-home-services-elderly-eisep

---

### Golden Park Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: No income limits
- Assets: No asset limits
- New York State resident
- Possess a current valid New York State Driver's License or Non-Driver Identification Card

**Benefits:** Free vehicle access to most state parks, boat launch sites, and arboretums Monday-Friday excluding holidays; fee reductions at state historic sites and state-operated golf courses

**How to apply:**
- No application required; present ID at park entrance (for pay stations, contact the facility directly)

**Timeline:** Immediate

**Watch out for:**
- Only weekdays Monday-Friday, excluding holidays
- Not all parks and sites participate—verify specific location
- For automated pay stations without attendants, call ahead to confirm entry process
- Does not cover national parks (separate America the Beautiful Senior Pass required)
- Regular fees apply at excluded sites

**Data shape:** No application or financial tests; ID-based instant access with fixed weekday schedule and listed site exclusions

**Source:** https://parks.ny.gov/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Community Medicaid | benefit | state | deep |
| New York State Home and Community-Based  | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Program (MSP) - QMB, SL | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Home Energy Assistance Program (HEAP) | benefit | state | deep |
| Weatherization Referral and Packaging Pr | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels (via Expanded In-Home Se | benefit | federal | deep |
| Respite Care Program (NYFSC) / Caregiver | benefit | local | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Services for Seniors | resource | local | simple |
| Senior Citizen Homeowners' Exemption (SC | benefit | local | deep |
| Senior Citizen Rent Increase Exemption ( | resource | local | simple |
| Enhanced STAR Program | benefit | state | medium |
| Expanded In-home Services for the Elderl | benefit | state | deep |
| Golden Park Program | resource | state | simple |

**Types:** {"benefit":12,"resource":4,"employment":1}
**Scopes:** {"state":6,"local":5,"federal":6}
**Complexity:** {"deep":11,"simple":4,"medium":2}

## Content Drafts

Generated 14 page drafts. Review in admin dashboard or `data/pipeline/NY/drafts.json`.

- **Community Medicaid** (benefit) — 6 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Program (MSP) - QMB, SLMB, QI** (benefit) — 5 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP) / ESAP / NYSCAP** (benefit) — 4 content sections, 6 FAQs
- **Home Energy Assistance Program (HEAP)** (benefit) — 6 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP) / Health Insurance Information, Counseling and Assistance Program (HIICAP)** (resource) — 1 content sections, 6 FAQs
- **Meals on Wheels (via Expanded In-Home Services for the Elderly Program - EISEP)** (benefit) — 4 content sections, 6 FAQs
- **Respite Care Program (NYFSC) / Caregiver Resource Centers** (benefit) — 5 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Senior Citizen Homeowners' Exemption (SCHE)** (benefit) — 3 content sections, 6 FAQs
- **Senior Citizen Rent Increase Exemption (SCRIE)** (resource) — 2 content sections, 6 FAQs
- **Enhanced STAR Program** (benefit) — 3 content sections, 6 FAQs
- **Expanded In-home Services for the Elderly Program (EISEP)** (benefit) — 5 content sections, 6 FAQs
- **Golden Park Program** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **region**: 3 programs
- **household_size**: 1 programs
- **household_size, primary_heating_source, presence_of_vulnerable_household_member**: 1 programs
- **not_applicable**: 3 programs
- **region (minimum wage varies by locality in New York)**: 1 programs
- **income**: 1 programs
- **fixed (all eligible seniors receive the same exemption level, though the dollar value depends on local property tax rates)**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Community Medicaid**: Eligibility has three tiers (Community Medicaid, Community Medicaid with LTC, Nursing Home Medicaid); income/assets tied to SSI-Related (aged/blind/disabled) with annual FPL adjustments; functional need based on ADL count (3+ since 2021); county-administered with regional MLTC providers.
- **New York State Home and Community-Based Services (HCBS) Waiver Programs**: Multiple waivers under OPWDD HCBS (e.g., Comprehensive Waiver); targets developmental disabilities across all ages (0+); county-based DDSO access; no fixed income/asset tables in sources; benefits fixed by service menu, not scaled by household; waitlists and regional provider variations.
- **Program of All-Inclusive Care for the Elderly (PACE)**: county-restricted to PACE provider service areas (limited centers/providers, e.g., ElderONE at 3 counties, ArchCare at Bronx/Westchester); no income/asset tests specified; dual eligibility common but not required; benefits comprehensive and capitated via interdisciplinary teams at local centers
- **Medicare Savings Program (MSP) - QMB, SLMB, QI**: NY generous FPL (QMB to 138%, QI to 186%); tiered by income brackets; asset test applies; local DSS administration with uniform rules but regional contacts; QI waitlist/priority.
- **Supplemental Nutrition Assistance Program (SNAP) / ESAP / NYSCAP**: Elderly/disabled-specific SNAP streams (NYSCAP auto for SSI solo; ESAP simplified for all-adult elderly/disabled households no earned income); benefits scale by household size/net income; statewide but local DSS processing.
- **Home Energy Assistance Program (HEAP)**: HEAP benefits scale significantly by primary heating source and living situation, ranging from $21 to $900+. The program has two distinct benefit types: Regular HEAP (available year-round, opened December 1, 2025) and Emergency HEAP (limited window: January 2 - April 7, 2026, requires shutoff notice). Income eligibility is automatic for SNAP/TA/SSI recipients regardless of income level, but other households must meet 130% federal poverty level threshold. Asset limits vary based on presence of vulnerable household members. The program is statewide but administered through local DSS offices, creating potential regional variation in processing and availability. Heating equipment repair/replacement (HERR) is a separate benefit with stricter age and residency requirements.
- **Weatherization Referral and Packaging Program (WRAP)**: Referral and packaging tied to local HEAP/WAP delivery; priority-based with automatic eligibility via benefits receipt; local subgrantees handle delivery with regional providers; no fixed dollar benefits per household, services determined by energy audit.
- **State Health Insurance Assistance Program (SHIP) / Health Insurance Information, Counseling and Assistance Program (HIICAP)**: no income/asset test; counseling-only service via statewide AAA network; open to pre-Medicare eligible NY residents; county-routed access.
- **Meals on Wheels (via Expanded In-Home Services for the Elderly Program - EISEP)**: Statewide but locally administered with county-specific providers, case managers, and variations in service delivery/meals details; no fixed income/asset caps but mandatory sliding-scale cost-sharing; meals tied to functional impairment assessment.
- **Respite Care Program (NYFSC) / Caregiver Resource Centers**: This program has a two-tier benefit structure: basic respite care (fee-based, starting at $7.15/hour) and emergency/extended hours care (free, with income preference for recipients earning $40,000 or less annually). The program is geographically limited to NYC and explicitly excludes Medicaid-eligible individuals, making it a niche program for non-Medicaid seniors in the five boroughs. No income or asset limits are stated for basic eligibility, only a preference for lower-income recipients in the emergency tier. Processing timelines and current waitlist status are not documented in public sources.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a federally funded program administered by the U.S. Department of Labor under the Older Americans Act, but delivered through state agencies and approximately 50 local nonprofit partner organizations across New York. Benefits are fixed (20 hours/week at minimum wage) but vary by region due to different state and local minimum wage rates. Eligibility is uniform statewide (age 55+, unemployed, income ≤125% poverty level) but enrollment priority tiers may affect access during funding constraints. The program is currently experiencing federal funding delays, which may affect availability and processing times by region. Application methods and contact information vary significantly by county and local provider.
- **Legal Services for Seniors**: Decentralized by county/region with local providers; no uniform income/asset tests (many none); priority for vulnerable seniors; varies significantly by location
- **Senior Citizen Homeowners' Exemption (SCHE)**: This program's benefits scale by income in 10 distinct tiers, with the maximum 50% reduction available only for incomes up to $50,000 and a gradual phase-out to 5% for incomes up to $58,399. The program is NYC-specific and administered uniformly across all five boroughs by the NYC Department of Finance. Application is limited to a 6-month window annually (September 15–March 15). Income calculation includes all household income sources and requires careful documentation. The 12-month ownership requirement and primary residence requirement are strict eligibility gates.
- **Senior Citizen Rent Increase Exemption (SCRIE)**: NYC-focused with fixed $50,000 income cap (no household size adjustment); rent burden test (1/3 income); limited to rent-regulated units; renewal mandatory; available in select non-NYC counties via local option.
- **Enhanced STAR Program**: Enhanced STAR is a property tax exemption program (not a service-based program). The key structural change in 2026 is the shift from local assessor-based applications to automatic state-level eligibility determination for those already receiving Basic STAR. Income limits are adjusted annually. The program requires income verification but does not share tax returns with assessor offices. Eligibility is binary (you either qualify or don't) rather than tiered, though the dollar value of tax savings varies by property tax rates in each school district.
- **Expanded In-home Services for the Elderly Program (EISEP)**: Managed regionally by local Area Agencies on Aging with varying providers; no strict income/asset tests but sliding scale cost-share; wait times and availability county-dependent; core case management for all, tiered additional services by need
- **Golden Park Program**: No application or financial tests; ID-based instant access with fixed weekday schedule and listed site exclusions

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New York?
