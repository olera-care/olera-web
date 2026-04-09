# Wisconsin Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 51s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 14 |
| New (not in our data) | 7 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 4 programs
- **employment**: 1 programs
- **advocacy**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Family Caregiver Support Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhs.wisconsin.gov/aging/caregiver.htm))
- **income_limit**: Ours says `$3500` → Source says `$48,000` ([source](https://www.dhs.wisconsin.gov/aging/caregiver.htm))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `NFCSP: Information/assistance, training for in-home care, adaptive equipment, minor home modifications, personal protective equipment[5]. AFCSP: Up to $4,000/year for respite care, incontinence supplies, home safety modifications, home-delivered meals, specialized clothing, activities/hobby supplies, legal/guardianship expenses, counseling, education classes, adult day care, emergency response systems, home chores, in-home respite, temporary facility respite[2][3][5][8]. Caregiver support groups and education available[3][5].` ([source](https://www.dhs.wisconsin.gov/aging/caregiver.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/aging/caregiver.htm`

### IRIS (Include, Respect, I Self-Direct)

- **min_age**: Ours says `65` → Source says `18` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **income_limit**: Ours says `$2901` → Source says `$3,525` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Self-directed Medicaid long-term care supports and services within an individualized budget based on assessed needs (via IRIS plan). Covers services like those helping with Activities of Daily Living (ADLs: e.g., bathing, eating, toileting) and Instrumental ADLs (IADLs: e.g., meal prep, money management). Specific list of covered services on DHS website; no fixed dollar amounts or hours stated—budget determined by functional screen and IRIS plan[1][4][6].` ([source](https://www.dhs.wisconsin.gov/iris/index.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/iris/index.htm`

### PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://www.dhs.wisconsin.gov/familycare/apply.htm))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive medical care, long-term care services, prescription drugs, primary care physician, social worker, nurse, and interdisciplinary team coordination. All Medicare/Medicaid services through PACE as sole source; covers physical, intellectual/developmental disabilities. No specific dollar amounts or hours stated.` ([source](https://www.dhs.wisconsin.gov/familycare/apply.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/familycare/apply.htm`

### FoodShare

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits (QUEST card) for food purchases at retailers. Amount based on household size, income, deductions (e.g., rent, utilities, medical for elderly/disabled). Maximum allotment varies by household size (table not fully provided; e.g., referenced in [5]). Certification: 12 months typical; 36 months for elderly 60+/disabled households with no earned income.[2][4]` ([source](https://www.dhs.wisconsin.gov/foodshare/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/foodshare/`

### Wisconsin Home Energy Assistance Program (WHEAP)

- **income_limit**: Ours says `$2620` → Source says `$14,835` ([source](https://energybenefit.wi.gov/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment during heating season (October 1 - May 15) covering a portion (not all) of heating costs (wood, propane, natural gas, electricity, fuel oil), non-heating electric costs, or emergency heating system repairs/replacement for furnaces/boilers (homeowners and some renters; 2-4 unit dwellings must be owner-occupied). Amount varies by income, household size, home size, and energy costs. Also connects to free weatherization services if eligible[1][4][5].` ([source](https://energybenefit.wi.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://energybenefit.wi.gov/`

### Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://boaltc.wi.gov/Pages/Ombudsman.aspx))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free advocacy services including investigating and resolving complaints, representing interests before agencies, seeking remedies, providing information on long-term care services, facilitating resident/family councils, and referrals; no fixed dollar amounts or hours[2][3][4][5]` ([source](https://boaltc.wi.gov/Pages/Ombudsman.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://boaltc.wi.gov/Pages/Ombudsman.aspx`

### SeniorCare

- **income_limit**: Ours says `$2825` → Source says `$25,536` ([source](https://www.dhs.wisconsin.gov/seniorcare/index.htm))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Prescription drug and vaccine coverage. After deductibles/spenddown (if applicable):
- $5 copay per generic prescription.
- $15 copay per brand-name prescription.
Program coordinates with other insurance including Medicare Part D. Pharmacies bill SeniorCare directly; show SeniorCare card at fill.[2][3][6]` ([source](https://www.dhs.wisconsin.gov/seniorcare/index.htm))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.wisconsin.gov/seniorcare/index.htm`

## New Programs (Not in Our Data)

- **Medical Assistance (QMB, SLMB, QI)** — financial ([source](https://www.dhs.wisconsin.gov/medicaid/qmb.htm (QMB); https://www.dhs.wisconsin.gov/medicaid/slmb.htm (SLMB); https://www.dhs.wisconsin.gov/medicaid/ (general)))
  - Shape notes: Tiered by income brackets (QMB/SLMB/QI); couple limits only (no larger households); asset exemptions WI-specific; QI funding-limited with potential waitlist.
- **Weatherization Assistance Program (WAP)** — service ([source](https://energyandhousing.wi.gov/Pages/AgencyResources/weatherization.aspx[5]))
  - Shape notes: Requires prior Energy Assistance approval; administered via local sub-agencies with regional providers and county-specific contacts; priority tiers drive service order; income tied to 60% SMI via WHEAP
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.dhs.wisconsin.gov/benefit-specialists/medicare-counseling.htm))
  - Shape notes: no income/asset test; open to all Medicare beneficiaries; services via statewide network of local sites with volunteer counselors; funded by federal grants
- **Elderly Nutrition Program** — service ([source](https://www.dhs.wisconsin.gov/aging/nutrition.htm))
  - Shape notes: No income/asset test statewide; voluntary contributions only; locally administered with county/tribal variations in delivery, donations, and prioritization; dual tracks (congregate vs. home-delivered) with distinct criteria
- **Wisconsin Senior Employment Program (WSEP)** — employment ([source](https://www.dhs.wisconsin.gov/publications/p00409-2024-2027.pdf (Wisconsin SCSEP State Plan 2024-2027)[5]))
  - Shape notes: Federally funded under Older Americans Act Title V, state-administered via grantees with local providers; priority-based enrollment; income test at 125% FPL; training hours/wage fixed but host sites vary regionally
- **Elder Law Legal Assistance** — service ([source](https://www.dhs.wisconsin.gov/aging/legal-assistance.htm))
  - Shape notes: Decentralized network of providers (e.g., Legal Action of WI as primary) rather than unified program; eligibility prioritizes low-income elders 60+ with specific legal needs; heavy tie-in to Medicaid asset planning (no fixed income table, spousal variations); regional offices with some county restrictions like Milwaukee Senior Law
- **Elder Benefit Specialist (EBS) Program** — advocacy ([source](https://www.dhs.wisconsin.gov/benefit-specialists/ebs.htm))
  - Shape notes: No financial eligibility test; advisory/advocacy service delivered via local county/tribal offices statewide; not a benefit payer but helper for other programs like Medicare/Medicaid/SSI

## Program Details

### Family Caregiver Support Program


**Eligibility:**
- Age: 60+
- Income: For Alzheimer's Family Caregiver Support Program (AFCSP): Combined gross annual income of person with dementia and spouse $48,000 or less (deduct dementia-related care costs). No income limits specified for general National Family Caregiver Support Program (NFCSP), but prioritizes greatest social and economic needs[2][3][5].
- Assets: No asset limits mentioned[1][2][3][5].
- Caregiver 18+ providing unpaid care to person 60+ needing assistance with daily living, or any age with Alzheimer's/related dementia[1][2][5].
- Grandparents/relatives 55+ primary caregivers for child under 19 or person 19-59 with long-term disability[1][2][5].
- For AFCSP: Written diagnosis of Alzheimer's/other dementia; person resides in home/community (not facility)[1][2][3][5].
- NFCSP prioritizes caregivers of those at risk of nursing home admission and greatest needs[2].

**Benefits:** NFCSP: Information/assistance, training for in-home care, adaptive equipment, minor home modifications, personal protective equipment[5]. AFCSP: Up to $4,000/year for respite care, incontinence supplies, home safety modifications, home-delivered meals, specialized clothing, activities/hobby supplies, legal/guardianship expenses, counseling, education classes, adult day care, emergency response systems, home chores, in-home respite, temporary facility respite[2][3][5][8]. Caregiver support groups and education available[3][5].
- Varies by: priority_tier

**How to apply:**
- Contact local County/Tribal Aging Office or Aging & Disability Resource Center (ADRC): ADRC map at https://www.dhs.wisconsin.gov/adrc/consumer/index.htm or call 866-843-9810[3][5].
- County-specific: e.g., Fond du Lac - Alyssa Posthuma at 920.929.3262[1].
- Statewide ADRC line: 844-947-2372[7].

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; services coordinated based on needs assessment, may supplement AFCSP with NFCSP if AFCSP $4,000 limit exceeded[2].

**Watch out for:**
- Two distinct programs: NFCSP (broader, no strict income limit) and AFCSP (dementia-specific, $48k income cap, $4k annual limit; can combine if needs exceed)[2][5].
- AFCSP requires home residence and diagnosis; not for facility residents[1][3].
- Prioritizes highest needs/risk of institutionalization; not all eligible get full services[2].
- Income for AFCSP is person with dementia + spouse combined, with deductions[1][3].
- Distinct from Medicaid Family Care program, which is for care recipients directly[4][6].

**Data shape:** Two tiered programs (NFCSP statewide broad support; AFCSP dementia-focused with $48k income cap and $4k limit); county/Tribal administered with local contacts; prioritizes economic/social needs and institutionalization risk; AFCSP allows deductions and combo with NFCSP.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/aging/caregiver.htm

---

### IRIS (Include, Respect, I Self-Direct)


**Eligibility:**
- Age: 18+
- Income: Must meet Medicaid financial eligibility criteria, which include income limits. For spousal impoverishment (2025 figures, effective 7/1/25–6/30/26): Minimum Community Spouse Monthly Income Allowance of $3,525/month; Maximum Community Spouse Monthly Income Allowance of $3,948/month. Specific household size tables not detailed in sources; full Medicaid income rules apply via income maintenance agency[1][2][4].
- Assets: Must meet Medicaid non-financial eligibility, including asset limits. Exemptions include: primary home if applicant lives there or intends to return (home equity ≤ $750,000 in 2025), home with spouse or minor/disabled child living there. Other standard Medicaid asset rules apply (e.g., countable assets like savings, non-exempt property)[1][2].
- Wisconsin resident
- U.S. citizen or qualifying immigrant
- Nursing Home (NH) or Intermediate Care Facility for Individuals with Intellectual/Developmental Disabilities (ICF-IID) level of care via Wisconsin Long-Term Care Functional Screen (LTC FS)
- Medicaid eligible (financial and non-financial criteria)
- Need for long-term care supports/services
- Reside in program-eligible setting (e.g., own home, apartment, adult family home, residential care apartment complex; not skilled nursing facility or certain community-based residential facilities)
- Cooperate with medical support, third-party liability, SSN requirements, verification, and health insurance access

**Benefits:** Self-directed Medicaid long-term care supports and services within an individualized budget based on assessed needs (via IRIS plan). Covers services like those helping with Activities of Daily Living (ADLs: e.g., bathing, eating, toileting) and Instrumental ADLs (IADLs: e.g., meal prep, money management). Specific list of covered services on DHS website; no fixed dollar amounts or hours stated—budget determined by functional screen and IRIS plan[1][4][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Tribal ADRS to start (find via dhs.wisconsin.gov/adrc/directory.htm)[4][6]
- Complete Long-Term Care Functional Screen with ADRC/ADRS
- Apply for Medicaid online (access.wisconsin.gov) or paper form to income maintenance agency[4]
- Select IRIS Consultant Agency (ICA) and Fiscal Employer Agent (FEA) with ADRC/ADRS help[4]

**Timeline:** Not specified in sources
**Waitlist:** Waitlists exist due to limited enrollment; varies by region and priority; ADRC can provide current status[1]

**Watch out for:**
- Must live in eligible community setting (e.g., own home/apartment); cannot enroll if in nursing home or certain residential facilities[1][3][7]
- Self-directed model requires participant (or representative) to manage budget, hire/fire providers, follow rules—high responsibility[4]
- Enrollment limited; long waitlists common, priority-based[1]
- Must select ICA and FEA; changes have paperwork and timing rules[4][7]
- Medicaid eligibility required first; if already Medicaid-eligible and meet functional criteria, faster path[4]
- Cost-sharing may apply based on income to maintain Medicaid[4]

**Data shape:** Self-directed budget model varies by functional need/level of care (via screen); statewide but regionally administered via 50+ ADRCs with varying providers/waitlists; no fixed service hours/dollars—instead individualized IRIS plan; Medicaid rules drive financial eligibility with spousal protections

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/iris/index.htm

---

### PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: Financial eligibility requires qualifying for Wisconsin Medicaid (income under 300% of Federal Benefit Rate: $2,901/month for 2025; varies by Medicaid rules, no specific PACE income cap beyond Medicaid). Private pay option available if not Medicaid-eligible. No asset limit specified for PACE itself, but Medicaid requires $2,000 or less (excluding primary home). No household size table provided in sources.
- Assets: Medicaid-linked: $2,000 or less for applicant (exempt: primary home, one car, personal belongings, burial funds up to limits). PACE allows private pay without asset test.
- Resident of service area: Kenosha, Milwaukee, Racine, Waukesha Counties (zip code-defined around PACE centers)
- Functionally eligible: Nursing home level of care per Wisconsin Adult Long-Term Care Functional Screen, but able to live safely in community with PACE support
- Eligible for nursing home care
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice

**Benefits:** Comprehensive medical care, long-term care services, prescription drugs, primary care physician, social worker, nurse, and interdisciplinary team coordination. All Medicare/Medicaid services through PACE as sole source; covers physical, intellectual/developmental disabilities. No specific dollar amounts or hours stated.
- Varies by: region

**How to apply:**
- Contact Aging & Disability Resource Center (ADRC) for Long-Term Care Functional Screen (in-person/phone)
- Apply for Medicaid online or paper form via income maintenance agency (ADRC assists)
- Community Care Inc. PACE: https://www.communitycareinc.org/services/pace
- Phone not specified; use local ADRC

**Timeline:** Not specified
**Waitlist:** Possible regional waitlists (not entitlement program)

**Watch out for:**
- Not statewide—only 4 counties, zip-restricted
- Must pass functional screen for nursing home level but live safely at home with PACE
- Private pay option exists but most (90%) are dual Medicare/Medicaid eligible
- Cannot be in Medicare Advantage or hospice
- Medicaid spend-down or planning may be needed if over limits
- PACE becomes sole Medicare/Medicaid service provider

**Data shape:** County-restricted to 4 areas; functional screen required; Medicaid financial eligibility or private pay; no fixed income/asset table beyond Medicaid rules; limited providers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/familycare/apply.htm

---

### Medical Assistance (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: These are federal Medicare Savings Programs (MSPs) administered by Wisconsin Medicaid. Eligibility requires Medicare Part A entitlement (or Part B-ID) and income after deductions at or below specified % of Federal Poverty Level (FPL), updated annually. Wisconsin-specific limits from official DHS sources (2024/2025 figures, subject to yearly change):
- **QMB** (≤100% FPL): Single ≤$1,330/month; Couple ≤$1,803/month[2].
- **SLMB** (100-120% FPL): Single $1,330-$1,596/month; Couple $1,803-$2,164/month[5].
- **QI (SLMB Plus in WI)** (120-135% FPL): Single $1,596-$1,781/month; Couple $2,164-$2,400/month[1].
Older sources show slight variations (e.g., QMB single $1,325[1]), but use DHS figures as authoritative. No variation by household size beyond couple; assumes single or married couple.
- Assets: Countable assets ≤$9,950 single / $14,910 couple (updated federal limits per WI DHS[2][5]; older sources cite $9,660/$14,470[1]). What counts: Bank accounts, stocks, bonds, second vehicles, non-primary home (state-specific rules apply). Exempt: Primary home/land, one vehicle, household goods, life insurance (up to $1,500 face value), burial plots/funds, $1,500 burial allowance, irrevocable burial trusts. Full exemptions detailed in WI DHS asset guide.
- Entitled to Medicare Part A (hospital) or Part B (even if not enrolled)[2][5].
- U.S. citizen or qualified immigrant.
- Wisconsin resident.
- Not receiving full Medicaid (QI requires no other Medicaid)[8].
- Automatic eligibility if on SSI or former SSI receiving Social Security[2].

**Benefits:** **QMB**: Pays Medicare Part A premiums (if owed), Part B premiums/deductible, Part A/B coinsurance/copays[1][2][3]. **SLMB**: Pays Part B premiums[1][5]. **QI (SLMB Plus)**: Pays Part B premiums (up to 3 months retroactive)[1][3][8]. Provides 'Extra Help' for Part D in some cases. No direct services; financial assistance to Medicare costs.
- Varies by: priority_tier

**How to apply:**
- Online: ACCESS portal at https://access.wisconsin.gov[2][5].
- Phone: Wisconsin Helpline for Seniors 1-800-445-5394 or local Aging & Disability Resource Center (ADRC)[1].
- Mail/In-Person: Local county/tribal Economic Support office or DHS (forms mailed upon request)[2][5].
- Request application from state Medicaid agency[3].

**Timeline:** QMB: First day of month after approval (≤45 days)[3][8]. SLMB/QI: Up to 3 months retroactive[3].
**Waitlist:** QI has federal funding caps; waitlist possible if funds exhausted (varies yearly; check current status via ADRC)[9].

**Watch out for:**
- QI called 'SLMB Plus' in WI; must not be on other Medicaid[8].
- Income after $20 disregard + standard deductions; over/under ranges disqualify[1][5].
- Assets include spouse's even if not applying[2].
- QMB providers can't bill beneficiary (even for non-Medicare services in some cases—'QMB protection').
- Limits update yearly (April); verify current FPL-based amounts.
- No coverage for long-term care or non-Medicare services.
- QI waitlists if federal funds depleted[9].

**Data shape:** Tiered by income brackets (QMB/SLMB/QI); couple limits only (no larger households); asset exemptions WI-specific; QI funding-limited with potential waitlist.

**Source:** https://www.dhs.wisconsin.gov/medicaid/qmb.htm (QMB); https://www.dhs.wisconsin.gov/medicaid/slmb.htm (SLMB); https://www.dhs.wisconsin.gov/medicaid/ (general)

---

### FoodShare


**Eligibility:**
- Income: Gross monthly income at or below 200% of the federal poverty level (FPL) for most households. Households with an elderly (60+), blind, or disabled member have no gross income limit but must meet net income ≤100% FPL if gross >200% FPL. Exact 200% FPL amounts vary by household size and year; check current FPL table at official source as 2026 figures not in results. Seniors/disabled can deduct monthly medical expenses.[2][3][4][5][8]
- Assets: No asset limit if household income ≤200% FPL. For elderly (60+), blind, or disabled households not meeting gross income test, asset limit is $4,500 (countable assets like cash, bank accounts, stocks, bonds, real estate that can be converted to cash). Specific exemptions not detailed.[3][4]
- Wisconsin resident[2][4]
- U.S. citizen or qualified non-citizen (legal permanent resident ≥5 years)[2][4]
- Social Security number or applied for one[4]
- Work requirements for able-bodied adults without dependents (ABAWDs): ages 18-64 (updated July 2025), must work/volunteer/train ≥80 hours/month unless exempt (e.g., disabled, pregnant, homeless, veterans, former foster youth, child <13-18 in home depending on rule). Elderly 60+ generally exempt.[1][4][6]
- Household-based (Food Unit/Share group); net income calculated after deductions for rent, utilities, medical (for seniors/disabled), dependent care[2][5][7]

**Benefits:** Monthly EBT card benefits (QUEST card) for food purchases at retailers. Amount based on household size, income, deductions (e.g., rent, utilities, medical for elderly/disabled). Maximum allotment varies by household size (table not fully provided; e.g., referenced in [5]). Certification: 12 months typical; 36 months for elderly 60+/disabled households with no earned income.[2][4]
- Varies by: household_size

**How to apply:**
- Online: https://www.dhs.wisconsin.gov/foodshare/eligibility.htm[1]
- Phone/mail/in-person via 12 county agencies (contact local FoodShare office; no central phone listed)
- Interview required (phone or in-person) after submission[2][7]

**Timeline:** Up to 30 days; expedited if low cash/income < expenses or migrant farm worker (within 7 days). Benefits retroactive to application date.[2][7]

**Watch out for:**
- Elderly households >200% FPL gross income can still qualify via net income/assets test—many miss this exception.[3][4][5]
- Work requirements expanded to 18-64 (2025 update); exemptions broader but ABAWDs must meet 80 hours/month or lose benefits.[1][6]
- Benefits calculated after deductions; seniors/disabled: include medical expenses to lower net income.[2][5]
- No asset test if ≤200% FPL, but applies under elderly exception if gross >200%.[4]
- Retroactive benefits from application date, even if processed later.[2]

**Data shape:** Income test at 200% FPL gross (with elderly/disabled net/assets exception); household-based with deductions; county-administered statewide; work rules for ABAWDs 18-64 with exemptions; 36-month certification for elderly/disabled no earned income

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/foodshare/

---

### Wisconsin Home Energy Assistance Program (WHEAP)


**Eligibility:**
- Income: Gross household income at or below 60% of Wisconsin's median income. Specific limits for 2025-2026 program year (October 1, 2025 – September 30, 2026) not fully detailed in sources; older example for smaller households: Household of 5: $14,835 monthly / $59,340 annually; 6: $16,881 monthly / $67,525 annually; 7: $17,265 monthly / $69,059 annually; 8: $17,649 monthly / $70,594 annually. Uses a previous three-month income test annualized for eligibility[1][3][4][6].
- Assets: No asset limits mentioned in sources.
- U.S. citizenship or lawful immigration status.
- Social Security Number (SSN) and date of birth for every household member.
- Proof of household's primary heating costs for last 12 months and electric bills.
- If renting: Landlord name, address, phone, or lease.
- Income verification for entire household for one month prior to application (wages, SS/SSI/SSDI, pensions, child support, TANF/W2, etc.)[2].

**Benefits:** One-time payment during heating season (October 1 - May 15) covering a portion (not all) of heating costs (wood, propane, natural gas, electricity, fuel oil), non-heating electric costs, or emergency heating system repairs/replacement for furnaces/boilers (homeowners and some renters; 2-4 unit dwellings must be owner-occupied). Amount varies by income, household size, home size, and energy costs. Also connects to free weatherization services if eligible[1][4][5].
- Varies by: household_size|income|energy_costs|home_size

**How to apply:**
- Online: https://energybenefit.wi.gov/
- Phone: State hotline 1-866-HEATWIS (1-866-432-8947); local agencies e.g., (833) 646-0823 (Partners for Community Development), (414) 270-4-MKE (UMOS for Kenosha/Marquette/Milwaukee Counties), 800-922-2393 (Waupaca County)
- Local WHEAP agency appointment (varies by region; e.g., mail to 1407 S. 13th Street, Sheboygan, WI 53081 for some areas)
- In-person: Local energy assistance offices or agencies

**Timeline:** Not specified; agencies may not directly obtain income/SSN data, so prepare documents to avoid delays[2][5].

**Watch out for:**
- One-time benefit per heating season only (Oct 1-May 15); does not cover full costs.
- Online applications not processed by local agencies—must go through local WHEAP agency[5].
- Emergency furnace assistance requires immediate call to local office; landlord must qualify for renters.
- Crisis assistance available year-round, but regular benefits seasonal.
- Must provide full household income, including gifts/loans[2].

**Data shape:** Income eligibility based on 60% state median with table by household size; one-time seasonal payments varying by multiple factors; administered statewide via local agencies with regional contacts.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://energybenefit.wi.gov/

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income at or below 60% of Wisconsin State Median Income (SMI), determined via approval for Wisconsin Home Energy Assistance Program (WHEAP). Exact dollar amounts vary by household size and year; must receive Energy Assistance first. Categorical eligibility if all household members receive W-2/TANF, FoodShare, or SSI for 3 prior months[1][2][3].
- Assets: No asset limits mentioned in sources[1][2][3][4].
- Must first apply for and be approved for Energy Assistance (WHEAP)[2][3][4][7]
- Priority to elderly, handicapped, children under 6, or high energy use homes[4]
- Home must meet building eligibility (e.g., for Public Benefits funding, served by participating electric utility)[1][5]

**Benefits:** Free weatherization services including air sealing, attic/wall/floor/ceiling insulation, blower door testing, furnace repair/replacement, refrigerator/freezer replacement, energy-efficient lighting, window/door repairs, water heater insulation/pipe insulation, health/safety repairs (smoke alarms, mold/moisture evaluation), minor roof/wall leak repairs. Average 30-50% energy reduction[2][3][4][6]. Rental owners may pay 15% if heat included in rent[2][3].
- Varies by: priority_tier

**How to apply:**
- First: Apply for Energy Assistance (WHEAP) online via Home Energy Plus application, phone (e.g., 800-506-5596 for Dane/Green, 608-363-9200 Rock, 262-427-8505 Walworth), or local agency[3][4]
- Then: Contact local weatherization provider (e.g., Project Home 608-246-3737 for Dane/Green, CAP Services, Community Action) or online application[3][4][7]
- In-person/mail via local county agencies, tribal governments, community organizations[1][5]

**Timeline:** Not specified; priority scheduling after energy audit[4]
**Waitlist:** Determined by state priority and funding; high-priority homes contacted first from WHEAP referral list[2][4]

**Watch out for:**
- Must be approved for Energy Assistance (WHEAP) FIRST before weatherization eligibility; not direct application[2][3][4][7]
- Rental landlords may pay 15% fee if heat included in rent[2][3]
- Priority-based (elderly, disabled, young children, high energy users); waitlists common due to funding limits[2][4]
- Building must qualify; not all homes eligible (e.g., utility restrictions for some funds)[1][5]

**Data shape:** Requires prior Energy Assistance approval; administered via local sub-agencies with regional providers and county-specific contacts; priority tiers drive service order; income tied to 60% SMI via WHEAP

**Source:** https://energyandhousing.wi.gov/Pages/AgencyResources/weatherization.aspx[5]

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to all, including those above federal poverty line (over half of 2025 clients had income above FPL)[2]
- Assets: No asset limits or tests
- Must be a Wisconsin Medicare beneficiary, family member, or caregiver[1][2][6]

**Benefits:** Free, unbiased one-on-one counseling on Medicare costs, eligibility, enrollment, plan options (e.g., Medicare Advantage, Part D, Medigap), programs to lower costs (e.g., Medicare Savings Program, Extra Help, Medicaid); assistance with appeals, bills, employer/long-term care insurance; outreach events and education; average call 35-50 minutes, 40% in-person[1][2][3]

**How to apply:**
- Phone: 1-800-242-1060 (Medigap Helpline) or 1-855-677-2783 (Medigap/Part D Hotline), TTY 711[1][7]
- In-person: Local Aging and Disability Resource Centers (ADRCs), county aging offices, Tribal offices, senior centers, clinics[2]
- Email: BOALTCMedigap@wisconsin.gov[1]

**Timeline:** Immediate counseling upon contact (calls 35-50 min, in-person appointments scheduled locally)[2]

**Watch out for:**
- Counselors do not sell plans or receive company payments—purely unbiased[1][2]
- Helps with complex issues like appeals and low-income programs, but families must provide their own Medicare details[3]
- Not a healthcare provider; only counseling/enrollment assistance[1]
- Plan options change annually and vary by county[2][5]

**Data shape:** no income/asset test; open to all Medicare beneficiaries; services via statewide network of local sites with volunteer counselors; funded by federal grants

**Source:** https://www.dhs.wisconsin.gov/benefit-specialists/medicare-counseling.htm

---

### Elderly Nutrition Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income limits or asset tests required for core eligibility; open to all age 60+ on voluntary contribution basis. Some counties or tribal programs may apply income restrictions (e.g., one source notes $2,413/month max for 1-person household, but not standard). Prioritization for low-income, rural residents, people of color, limited English proficiency, or those at risk of institutionalization.
- Assets: No asset limits or tests mentioned statewide; income/assets explicitly not considered in multiple counties.
- Age 60+ (55+ in some tribal nations)
- Spouse/partner of eligible person regardless of age
- For congregate meals: person with disability residing with eligible senior or in senior housing
- For home-delivered meals: homebound (unable to leave home normally), unable to prepare/obtain meals independently, no other adult available to assist; confirmed via home assessment in some areas
- Residency in service county for home delivery (not required for congregate statewide)

**Benefits:** Congregate meals at senior dining sites or home-delivered meals (Meals on Wheels); each meal provides 1/3 to 1/2 of daily recommended nutritional allowance for older adults, dietitian-approved, follows Dietary Guidelines for Americans; may include special diets; nutrition counseling in some counties; suggested donation $5-$6/meal (no one denied for inability to pay); home delivery typically weekdays, frozen meals for weekends in some areas.
- Varies by: region

**How to apply:**
- Contact local Aging & Disability Resource Center (ADRC) or county nutrition program
- Phone: Statewide ADRC line 1-844-941-2372 (1-844-WIS-ADRC); local examples: Walworth County (262)741-3333, ADRC Northwest WI 877-485-2372
- Website: FindMyADRC.org to locate local ADRC
- In-person: Local senior dining sites or ADRC offices
- Home visit/assessment required for home-delivered meals

**Timeline:** Not specified statewide; home-delivered requires initial home visit scheduling by coordinator.
**Waitlist:** Possible due to prioritization for greatest need (e.g., food insecurity, malnutrition risk); varies by demand.

**Watch out for:**
- No income/asset test, but prioritization may delay access for lower-need individuals
- Home-delivered requires homebound assessment—not just age
- Suggested donations expected but voluntary; some under-60 disabled pay full fee
- Congregate open without residency proof, but home delivery county-bound
- Rare income caps in specific programs—confirm locally
- Meals promote socialization; not full grocery replacement

**Data shape:** No income/asset test statewide; voluntary contributions only; locally administered with county/tribal variations in delivery, donations, and prioritization; dual tracks (congregate vs. home-delivered) with distinct criteria

**Source:** https://www.dhs.wisconsin.gov/aging/nutrition.htm

---

### Wisconsin Senior Employment Program (WSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in sources; contact local office to confirm current levels based on HHS poverty guidelines[1][2][3][4][5].
- Unemployed
- Legal resident of Wisconsin
- Poor employment prospects (implied by program focus)
- Priority given to veterans/qualified spouses, those over 65, individuals with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, or those who failed to find employment via American Job Centers[3][4]

**Benefits:** Part-time on-the-job training (average 20 hours/week) in community service roles at nonprofits/public facilities (e.g., child care, customer service, teachers' aide, computer technician, building maintenance, health care worker); paid the highest of federal, state, or local minimum wage; typically lasts about 6 months as bridge to unsubsidized employment; possible monthly transportation payments if eligible (requires valid driver's license and income guidelines)[1][2][3][4][5].
- Varies by: priority_tier

**How to apply:**
- Phone: (920) 229-5557 (WISE program contact)[2]
- Email: info@fvwdb.com[2]
- Contact local SCSEP office/provider (e.g., CWI Works for Wisconsin: https://www.cwiworks.org/for-job-seekers/our-programs/scsep/; SER National for parts of Wisconsin)[3][6][7]
- In-person at local SCSEP grantee or American Job Center

**Timeline:** If eligible and no waiting list, enrolled immediately[1]
**Waitlist:** Possible waiting list depending on local availability; enrollment if no waitlist[1]

**Watch out for:**
- Also known as WISE, SCSEP, or Title V; not all 'senior employment' programs are this one[2]
- Must be actively unemployed and seeking unsubsidized job after training (not permanent employment)[1][4]
- Priority tiers may delay enrollment for non-priority applicants[3][4]
- Income limit is 125% FPL (stricter than some programs); verify current amounts locally as they adjust yearly
- Limited to community service training roles, not direct job placement

**Data shape:** Federally funded under Older Americans Act Title V, state-administered via grantees with local providers; priority-based enrollment; income test at 125% FPL; training hours/wage fixed but host sites vary regionally

**Source:** https://www.dhs.wisconsin.gov/publications/p00409-2024-2027.pdf (Wisconsin SCSEP State Plan 2024-2027)[5]

---

### Elder Law Legal Assistance

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits stated for legal assistance programs; eligibility often tied to low-income status for free services. Related Medicaid programs (commonly planned for) have asset-focused limits rather than strict income caps, with spousal protections under Spousal Impoverishment Law allowing community spouse to retain portion of income[1][2].
- Assets: For associated Medicaid eligibility (frequent focus of elder law help): $2,000 for an individual; $3,000 for a married couple if both applying; approximately $50,000-$120,000 for community spouse. Exemptions and planning strategies (e.g., Spousal Impoverishment protections) apply to avoid destitution; primary home, certain vehicles, and personal items often exempt via attorney planning[1].
- Wisconsin resident
- Legal issues related to elder rights, public benefits (e.g., Medicaid, SSI), abuse/neglect, advance directives, guardianship, long-term care waivers (Family Care, IRIS, PACE), housing, or age discrimination[2][4]

**Benefits:** Free or low-cost legal advice, representation, or attorney services for: abuse/neglect, powers of attorney, living wills, health care proxies, Medicaid/Family Care eligibility and planning, long-term care waivers (Family Care, Partnership, IRIS, PACE), guardianship, estate planning, public benefits appeals (SSI, BadgerCare), debt collection, age discrimination, involuntary discharges/evictions. No fixed dollar amounts or hours specified; case-by-case assistance[2][4][5][6]
- Varies by: priority_tier

**How to apply:**
- Phone: Legal Action of Wisconsin at 855-947-2529
- Website: legalaction.org
- In-person: Offices in Green Bay, La Crosse, Madison, Milwaukee, Oshkosh, Racine (Milwaukee Senior Law specifically for Milwaukee County residents 60+ on public benefits/elder rights)
- Phone for age discrimination: Dept. of Workforce Development at 608-266-3131
- State Bar Lawyer Referral: 800-362-9082 or wisbar.org/forPublic/INeedaLawyer
- Modest Means Program: wisbar.org/forPublic/INeedaLawyer/pages/modest-means

**Timeline:** Not specified in sources

**Watch out for:**
- Not a single 'program' but network of free/low-cost legal services; often requires low-income qualification (varies by provider, e.g., Modest Means for moderate income). Focuses on planning for Medicaid's strict asset rules—DIY planning risks penalties or higher costs; must identify client clearly amid family involvement to avoid capacity/undue influence issues. Medicaid recovery of benefits post-death if no planning. Age discrimination at work handled separately[1][2][3]

**Data shape:** Decentralized network of providers (e.g., Legal Action of WI as primary) rather than unified program; eligibility prioritizes low-income elders 60+ with specific legal needs; heavy tie-in to Medicaid asset planning (no fixed income table, spousal variations); regional offices with some county restrictions like Milwaukee Senior Law

**Source:** https://www.dhs.wisconsin.gov/aging/legal-assistance.htm

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Income: No income limits; available regardless of financial status[2][3][5]
- Assets: No asset limits; no financial tests apply[2][3][5]
- Must be a resident or tenant of a licensed or certified long-term care setting (e.g., nursing home, community-based residential facility (CBRF), adult family home (AFH), residential care apartment complex (RCAC))[5]
- OR receiving home and community-based services through managed long-term care or self-directed programs (Family Care, Family Care Partnership, PACE, IRIS)[3][5]
- Concerns must relate to rights, quality of life/care, abuse/neglect, privacy, choice of care, restraints, appeals/grievances, discharge/transfer, guardians/POA, or denial of services[3][5]

**Benefits:** Free advocacy services including investigating and resolving complaints, representing interests before agencies, seeking remedies, providing information on long-term care services, facilitating resident/family councils, and referrals; no fixed dollar amounts or hours[2][3][4][5]

**How to apply:**
- Phone: 800-815-0015 (toll-free)[3]
- Fax: 608-246-7001[3]
- Mail: Board on Aging and Long Term Care, 1402 Pankratz St., Suite 111, Madison, WI 53704-4001[3]
- Online: https://longtermcare.wi.gov/ (provide county, facility name, Milwaukee zip code if applicable, contact info, brief concern description)[2][3]

**Timeline:** Not specified; ombudsmen respond to concerns with urgency based on description, assigned by region[2][7]

**Watch out for:**
- Not for those under 60 (refer to Disability Rights Wisconsin Family Care/IRIS Ombudsman)[1][3][7]
- Only advocates for long-term care consumers in specific settings/programs; cannot assist with hospitals, acute mental health, or independent living unrelated to managed care[5]
- Anyone can call, but ombudsman represents only the long-term care consumer (age 60+); interactions confidential[2]
- No authority over non-long-term care issues or unlicensed settings[5]

**Data shape:** no income test; advocacy only for specific long-term care residents/consumers age 60+ in licensed settings or managed programs; regionally assigned with Milwaukee zip code specificity

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://boaltc.wi.gov/Pages/Ombudsman.aspx

---

### SeniorCare


**Eligibility:**
- Age: 65+
- Income: Coverage levels based on annual income as % of Federal Poverty Level (FPL). For 2026 (current figures from source):
- **Level 1** (≤160% FPL): Individual ≤$25,536; Couple ≤$34,624. No deductible.
- **Level 2A** (160-200% FPL): Individual $25,537–$31,920; Couple $34,625–$43,280. $500 deductible.
- **Level 2B** (200-240% FPL): Individual $31,921–$38,304; Couple $43,281–$51,936. $850 deductible.
- **Level 3** (>240% FPL): Spenddown equal to income over 240% FPL. For married applicants living together, eligibility based on combined spousal income.[2][6]
- Assets: No asset limits apply.[3]
- Wisconsin resident.
- U.S. citizen or qualifying immigrant.
- Not enrolled in full-benefit Medicaid (e.g., BadgerCare Plus), but exceptions for Qualified Medicare Beneficiaries (QMB), SLMB, QI-1/QI-2, TB-Related Medicaid, or unmet Medicaid deductible.
- Provide Social Security number.
- $30 annual enrollment fee per person.

**Benefits:** Prescription drug and vaccine coverage. After deductibles/spenddown (if applicable):
- $5 copay per generic prescription.
- $15 copay per brand-name prescription.
Program coordinates with other insurance including Medicare Part D. Pharmacies bill SeniorCare directly; show SeniorCare card at fill.[2][3][6]
- Varies by: income_level

**How to apply:**
- Phone: Call SeniorCare Customer Service hotline at 800-657-2038 to request application.
- Online: Print application at https://www.dhs.wisconsin.gov/seniorcare.
- Mail: Send completed application to address on form.
- Apply starting month of 65th birthday or anytime after; coverage starts month after approval.

**Timeline:** 4-6 weeks[7]

**Watch out for:**
- Cannot enroll if on full-benefit Medicaid (check exceptions like QMB/SLMB).
- Married couples: Combined income counts if living together.
- Must renew annually and pay $30 fee each year.
- Coverage starts month AFTER approval, not immediately.
- Income limits determine deductibles/copays; higher income means higher out-of-pocket before benefits kick in.
- Older sources [5][7] show outdated FPL figures (e.g., ~$19k for Level 1 single); always check current at https://www.dhs.wisconsin.gov/seniorcare/fpl.htm[6].

**Data shape:** Tiered by income levels with specific FPL-based thresholds, deductibles, and copays; no asset test; spousal income aggregation for couples; annual renewal and fee required.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.wisconsin.gov/seniorcare/index.htm

---

### Elder Benefit Specialist (EBS) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; open to all eligible individuals regardless of income[1][2][8]
- Assets: No asset limits; open to all eligible individuals regardless of assets[1][2][8]
- Live in Wisconsin[1]
- Seeking assistance with public or private benefits, health insurance, consumer issues, or related problems[1][2]

**Benefits:** Trusted and confidential advice, counseling, assistance with applications and paperwork, screening for entitlement, advocacy for denials or problems (including appeals), information on programs like Medicare, Medicaid, Social Security, SSI, FoodShare, housing, debt collection, consumer fraud; supervised by elder law attorneys; free service (donations welcomed but not required)[1][2][5]

**How to apply:**
- Find local specialist via https://www.dhs.wisconsin.gov/benefit-specialists/ebs.htm (includes 'Find a benefit specialist near you' tool)[1]
- Contact county aging office, Aging and Disability Resource Center (ADRC), or human/social services department[2][4]
- Phone example: Bureau of Aging and Disability Resources at 608-266-2536 (for general info)[4]
- In-person at local county aging offices or ADRCs[2][4][5]

**Timeline:** Not specified; services provided upon contact as counseling and assistance, not a formal benefits approval process[1][2]

**Watch out for:**
- Not a direct benefits program—provides advice/help applying to other programs, not cash/services itself[1][2]
- Only the individual (or their activated Power of Attorney for Finance) can initiate contact to protect confidentiality/autonomy; family can't apply on their behalf without permission[6]
- Free but donations encouraged; service not refused if no donation[2][5]
- For ages 60+ only (use Disability Benefit Specialist for 18-59)[1][7]
- Tribal programs may have slight age variations (e.g., 55+)[3]

**Data shape:** No financial eligibility test; advisory/advocacy service delivered via local county/tribal offices statewide; not a benefit payer but helper for other programs like Medicare/Medicaid/SSI

**Source:** https://www.dhs.wisconsin.gov/benefit-specialists/ebs.htm

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Family Caregiver Support Program | benefit | state | deep |
| IRIS (Include, Respect, I Self-Direct) | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medical Assistance (QMB, SLMB, QI) | benefit | state | deep |
| FoodShare | benefit | state | deep |
| Wisconsin Home Energy Assistance Program | benefit | state | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Elderly Nutrition Program | benefit | state | deep |
| Wisconsin Senior Employment Program (WSE | employment | state | deep |
| Elder Law Legal Assistance | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| SeniorCare | benefit | state | medium |
| Elder Benefit Specialist (EBS) Program | resource | state | simple |

**Types:** {"benefit":9,"resource":4,"employment":1}
**Scopes:** {"state":10,"local":1,"federal":3}
**Complexity:** {"deep":9,"simple":4,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/WI/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **household_size|income|energy_costs|home_size**: 1 programs
- **not_applicable**: 3 programs
- **income_level**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Family Caregiver Support Program**: Two tiered programs (NFCSP statewide broad support; AFCSP dementia-focused with $48k income cap and $4k limit); county/Tribal administered with local contacts; prioritizes economic/social needs and institutionalization risk; AFCSP allows deductions and combo with NFCSP.
- **IRIS (Include, Respect, I Self-Direct)**: Self-directed budget model varies by functional need/level of care (via screen); statewide but regionally administered via 50+ ADRCs with varying providers/waitlists; no fixed service hours/dollars—instead individualized IRIS plan; Medicaid rules drive financial eligibility with spousal protections
- **PACE (Program of All-Inclusive Care for the Elderly)**: County-restricted to 4 areas; functional screen required; Medicaid financial eligibility or private pay; no fixed income/asset table beyond Medicaid rules; limited providers
- **Medical Assistance (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI); couple limits only (no larger households); asset exemptions WI-specific; QI funding-limited with potential waitlist.
- **FoodShare**: Income test at 200% FPL gross (with elderly/disabled net/assets exception); household-based with deductions; county-administered statewide; work rules for ABAWDs 18-64 with exemptions; 36-month certification for elderly/disabled no earned income
- **Wisconsin Home Energy Assistance Program (WHEAP)**: Income eligibility based on 60% state median with table by household size; one-time seasonal payments varying by multiple factors; administered statewide via local agencies with regional contacts.
- **Weatherization Assistance Program (WAP)**: Requires prior Energy Assistance approval; administered via local sub-agencies with regional providers and county-specific contacts; priority tiers drive service order; income tied to 60% SMI via WHEAP
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; open to all Medicare beneficiaries; services via statewide network of local sites with volunteer counselors; funded by federal grants
- **Elderly Nutrition Program**: No income/asset test statewide; voluntary contributions only; locally administered with county/tribal variations in delivery, donations, and prioritization; dual tracks (congregate vs. home-delivered) with distinct criteria
- **Wisconsin Senior Employment Program (WSEP)**: Federally funded under Older Americans Act Title V, state-administered via grantees with local providers; priority-based enrollment; income test at 125% FPL; training hours/wage fixed but host sites vary regionally
- **Elder Law Legal Assistance**: Decentralized network of providers (e.g., Legal Action of WI as primary) rather than unified program; eligibility prioritizes low-income elders 60+ with specific legal needs; heavy tie-in to Medicaid asset planning (no fixed income table, spousal variations); regional offices with some county restrictions like Milwaukee Senior Law
- **Long-Term Care Ombudsman Program**: no income test; advocacy only for specific long-term care residents/consumers age 60+ in licensed settings or managed programs; regionally assigned with Milwaukee zip code specificity
- **SeniorCare**: Tiered by income levels with specific FPL-based thresholds, deductibles, and copays; no asset test; spousal income aggregation for couples; annual renewal and fee required.
- **Elder Benefit Specialist (EBS) Program**: No financial eligibility test; advisory/advocacy service delivered via local county/tribal offices statewide; not a benefit payer but helper for other programs like Medicare/Medicaid/SSI

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Wisconsin?
