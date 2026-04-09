# Arkansas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 42s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 14 |
| New (not in our data) | 8 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 4 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### ARKansas Medicaid

- **income_limit**: Ours says `$1043` → Source says `$2,982` ([source](https://humanservices.arkansas.gov (Arkansas Department of Human Services); apply at https://access.arkansas.gov[5][6]))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Long-term care services including nursing home care (unlimited duration if qualified), home/community-based services (HCBS) like in-home personal care, adult foster care, assisted living (full Medicaid benefits but room/board not covered in Level II; requires Intermediate Level of Care), non-medical supports for frail seniors at home. Covers healthcare not provided by Medicare (e.g., personal care, LTSS)[1][3][6][9].` ([source](https://humanservices.arkansas.gov (Arkansas Department of Human Services); apply at https://access.arkansas.gov[5][6]))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov (Arkansas Department of Human Services); apply at https://access.arkansas.gov[5][6]`

### Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `All Medicare/Medicaid-covered services (primary, preventive, acute, long-term care) plus additional medically necessary services approved by interdisciplinary team: doctor visits, prescription drugs, transportation, home care, personal care, day center services, hospitalization, therapy, dental, vision, memory care support. No deductibles/co-pays. Provided at PACE centers, home, inpatient facilities. Personalized care plan by healthcare team.[1][5]` ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1043` → Source says `$20` ([source](https://humanservices.arkansas.gov))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A premiums (if applicable), Part B premiums/deductible/coinsurance/copays. SLMB/QI: Part B premiums only ($202.90/month in 2026). ARSeniors: Full Medicaid benefits + QMB coverage.` ([source](https://humanservices.arkansas.gov))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://humanservices.arkansas.gov/services-worth-knowing/snap/))
- **income_limit**: Ours says `$1948` → Source says `$1695` ([source](https://humanservices.arkansas.gov/services-worth-knowing/snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases (amount based on household size, income, deductions; e.g., max allotment for 1-person elderly/disabled household calculated as max minus 30% net income). Restaurant Meals Program available for eligible elderly/disabled.[1][5][7]` ([source](https://humanservices.arkansas.gov/services-worth-knowing/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/services-worth-knowing/snap/`

### Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite grants, counseling, training, and access to assistance services including respite care; specific services and amounts vary by grant (e.g., home care, day care, or facility care, but not duplicating other funding sources).[1][3][5]` ([source](https://agingarkansas.org/services/family-caregiver-support/))
- **source_url**: Ours says `MISSING` → Source says `https://agingarkansas.org/services/family-caregiver-support/`

### Long-term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy services including investigating complaints, resolving issues related to resident rights, quality of life, Medicaid/Medicare, discharges/transfers, finances, restraints, guardianship/power of attorney, food quality, room temperature, social activities, care plans; education on rights; empowerment to speak for themselves; no specific dollar amounts or hours, provided as needed without reprisal[5][6]` ([source](https://agingarkansas.org/how-to-become-part-of-the-ombudsman-program-in-arkansas/))
- **source_url**: Ours says `MISSING` → Source says `https://agingarkansas.org/how-to-become-part-of-the-ombudsman-program-in-arkansas/`

## New Programs (Not in Our Data)

- **ARChoices in Homecare** — service ([source](https://humanservices.arkansas.gov/wp-content/uploads/ARChoices-Detailed-Overview.pdf or access.arkansas.gov[6]))
  - Shape notes: Tiered functional assessment (0-3) determines eligibility; Medicaid financial criteria without specified income table; county-based application with centralized assessment; no fixed hours/dollars, individualized budget
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.adeq.state.ar.us/energy/assistance/liheap.aspx))
  - Shape notes: Administered via county CBOs with local variations in charts/forms; benefits via state matrix scaled by income/size/fuel; seasonal with early fund exhaustion; household strictly by utility meter.
- **Weatherization Assistance Program** — service ([source](https://www.adeq.state.ar.us/energy/assistance/wap.aspx (Arkansas DEQ/AEO); state plan via AEO[2][4].))
  - Shape notes: Statewide via 5 regional CAA/nonprofit providers with priority tiers; income at 200% poverty or categorical (SSI/LIHEAP); no asset test; building eligibility required alongside client eligibility.
- **Senior Medicare Patrol (SMP)** — service ([source](https://insurance.arkansas.gov/consumer-assistance/senior-medicare-patrol-smp/[2]))
  - Shape notes: no income test; volunteer-based education and advocacy program; not a benefits entitlement; statewide with phone/email access; co-administered with SHIP in Arkansas[1][2][4]
- **Meals on Wheels (Arkansas)** — in_kind ([source](https://agingarkansas.org/ (Arkansas Association of Area Agencies on Aging)))
  - Shape notes: This program is locally administered with no statewide uniform eligibility criteria or benefit structure. Eligibility requirements, processing times, meal frequency, and available services vary by Area Agency on Aging. No income limits apply to federally-funded portions (Older Americans Act), but income limits may apply to SSBG-funded portions. Age exceptions for disabled individuals under 60 are discretionary by region. Families must contact their specific local Area Agency on Aging for precise eligibility, benefits, and application details. The program prioritizes homebound seniors with greatest need rather than using income as a primary screening tool.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/senior-community-service-employment-program/[1]))
  - Shape notes: State-administered via Arkansas DHS with national SCSEP standards; income scales by household size per federal poverty guidelines (no fixed table in sources); priority tiers affect access; statewide but centralized intake in Little Rock
- **Legal Aid of Arkansas (Senior Legal Services)** — service ([source](https://arlegalaid.org/what-we-do/eligibility-guidelines.html))
  - Shape notes: Income guidelines use tiered FPL percentages with waiver option; no age or strict asset caps; civil-only with senior-relevant priorities; statewide via single provider with helpline/online focus
- **Family Caregiver Grant Program** — financial ([source](https://www.alzark.org/family-assistance-program-grant/[4]))
  - Shape notes: Statewide $500 financial grant administered by Alzheimer's Arkansas; no income/asset test; diagnosis-driven with 6-month reapplication limit; requires post-grant survey compliance.

## Program Details

### ARKansas Medicaid


**Eligibility:**
- Age: 65+
- Income: For long-term care programs like Nursing Home Medicaid (single applicant in 2026): under $2,982/month. ARSeniors: at or below 80% FPL (assets under $9,430 individual/$14,130 couple). SSI-Related: under SSI limits (federal benefits rate). Limits vary by program, marital status, and household; spousal allowances and Miller Trusts available for excess income. General Medicaid for elderly/disabled has income/asset tests; expansion up to 138% FPL for non-elderly adults but not primary for seniors[1][5][7].
- Assets: Typically $2,000 for individual (Nursing Home, SSI-Related); $3,000 for eligible couple (SSI-Related). ARSeniors: $9,430 individual/$14,130 couple. Countable assets include cash, bank accounts, investments, second vehicles/homes (primary residence, one vehicle, personal belongings, burial plots exempt). 5-year look-back period for transfers/gifts may impose penalties[1][3][6][7].
- Nursing Facility Level of Care (NFLOC) for Nursing Home Medicaid and waivers; functional need for ADLs for regular Medicaid LTC[1]
- Arkansas residency proof[2]
- Medical/functional need for long-term care (e.g., nursing home, HCBS, assisted living)[1][2]
- For specific benefits like home modifications: inability to live safely independently[1]

**Benefits:** Long-term care services including nursing home care (unlimited duration if qualified), home/community-based services (HCBS) like in-home personal care, adult foster care, assisted living (full Medicaid benefits but room/board not covered in Level II; requires Intermediate Level of Care), non-medical supports for frail seniors at home. Covers healthcare not provided by Medicare (e.g., personal care, LTSS)[1][3][6][9].
- Varies by: priority_tier

**How to apply:**
- Online: Access Arkansas (https://access.arkansas.gov)
- Phone: 1-800-482-8988
- In-person: Local Department of Human Services (DHS) county office
- Mail: To local DHS office

**Timeline:** Coverage can begin 3 months prior to approval; applications may take longer than expected—ask for usual timeframe upon submission[3]
**Waitlist:** Not specified in sources; may vary by service demand[3]

**Watch out for:**
- Multiple programs with varying income/asset limits (e.g., $2,000 vs. ARSeniors $9,430)—must select correct one[1][7]
- 5-year look-back penalizes asset transfers/gifts[6]
- Medicare does not cover long-term care; Medicaid fills gap but requires NFLOC[1][6]
- Spousal impoverishment rules apply (resource division but limited income sharing)[9]
- Room/board not covered in some assisted living[9]
- Spend-down or Miller Trusts needed if over limits[2][4]

**Data shape:** Multiple tiers/programs (Nursing Home, HCBS waivers, ARSeniors, SSI-Related) with differing income/asset thresholds and care levels (NFLOC vs. Intermediate); annual changes, spousal rules, 5-year look-back unique to LTC Medicaid

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov (Arkansas Department of Human Services); apply at https://access.arkansas.gov[5][6]

---

### ARChoices in Homecare

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21-64 with physical disability or 65 and older[1][2][6]+
- Income: Determined by DHS Division of County Operations as Medicaid financial eligibility; specific dollar amounts or household size table not detailed in sources, follows standard Medicaid income criteria with strategies available to qualify if initially over limits[3][4][7]
- Assets: Medicaid resource limits apply; home equity interest no greater than $752,000 in 2026 (home value minus mortgage); home exempt if applicant lives there or has intent to return, or if spouse/minor child/permanently disabled child lives there[2]
- Arkansas resident[1]
- Require nursing home level of care (intermediate for 21-64, skilled may disqualify)[2][4]
- Functional need: unable to perform at least 1 ADL (eating, toileting, transferring/locomotion) without substantial assistance/dependence OR at least 2 ADLs without limited assistance OR primary/secondary diagnosis of Alzheimer's/related dementia with cognitive impairment requiring substantial supervision; assessed via ARIA tool assigning Tier 2 (eligible), Tiers 0/1 too low, Tier 3 too high; final determination by DHS Office of Long Term Care nurse[2][3][4]
- Physically disabled (21-64) or frail elderly (65+); diagnosis of severe mental illness/ID does not bar if other criteria met[1][4][5]

**Benefits:** Home and community-based services including assistance with everyday activities (bathing, dressing, mobility in home, meal prep, household chores); specific services to meet nursing home level of care needs; person-centered service plan and individual services budget established post-assessment; self-direction option via Independent Choices[1][2][6]
- Varies by: priority_tier

**How to apply:**
- In-person or mail at DHS office in county of residence[3][5]
- Start with Department of County Operations (DCO) for financial eligibility; phone Access Arkansas at 855-372-1084[6]
- Referral process: DCO to DAABHS, then ARIA assessment by Optum RN, Level of Care by OLTC, DAABHS RN home visit for service plan[3]

**Timeline:** Eligibility begins date DHS Division of County Operations approves unless provisional plan of care; no specific timeline stated[5]
**Waitlist:** Not mentioned in sources[null]

**Watch out for:**
- Must meet exact Tier 2 in ARIA assessment (Tier 0/1 too low needs, Tier 3 too high for waiver)[2]
- Financial eligibility via Medicaid rules; spend-down strategies needed if over limits[7]
- Nursing home level of care required; skilled care may disqualify[4]
- Apply first at local DHS county office, not directly to waiver[3][5]
- Home equity limit $752,000 in 2026; exemptions narrow[2]

**Data shape:** Tiered functional assessment (0-3) determines eligibility; Medicaid financial criteria without specified income table; county-based application with centralized assessment; no fixed hours/dollars, individualized budget

**Source:** https://humanservices.arkansas.gov/wp-content/uploads/ARChoices-Detailed-Overview.pdf or access.arkansas.gov[6]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No strict income limits for program eligibility; follows Medicaid long-term care rules for coverage without premium. Income under 300% of Federal Benefit Rate ($2,901/month in 2025) for Medicaid eligibility, but applicants over limit may qualify via Income Trust. Spousal impoverishment protections apply for community spouses.[4][5]
- Assets: For Medicaid coverage: $2,000 or less for applicant (excluding primary home). No asset test for private pay participants who meet medical criteria.[4][5][6]
- Certified by Arkansas Office of Long Term Care to need nursing facility level of care (one of four levels: Skilled-S, Intermediate I-A, II-B, III-C).
- Live in service area of a PACE provider in Arkansas.
- Able to live safely in community (home or assisted living) with PACE support.
- U.S. citizen or qualified alien.
- Arkansas resident.
- Social Security number required.
- Under 65 must prove disability via SSI/SSA or Medical Review Team.
- Not enrolled in Medicare Advantage, hospice, or certain other programs.

**Benefits:** All Medicare/Medicaid-covered services (primary, preventive, acute, long-term care) plus additional medically necessary services approved by interdisciplinary team: doctor visits, prescription drugs, transportation, home care, personal care, day center services, hospitalization, therapy, dental, vision, memory care support. No deductibles/co-pays. Provided at PACE centers, home, inpatient facilities. Personalized care plan by healthcare team.[1][5]
- Varies by: region

**How to apply:**
- Contact Arkansas Department of Human Services (DHS) county office or PACE provider (e.g., PACE of the Ozarks).
- Initial medical assessment via DHS Registered Nurse (RN), then financial eligibility at local DHS county office.
- Provider-specific: PACE of the Ozarks (Westfork/Winslow areas). No specific URL, phone, or form listed in sources; start with DHS.
- Private pay option if non-medical criteria not met but medical criteria are.

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may vary by provider/service area.

**Watch out for:**
- Not statewide—must live in limited service areas (e.g., only Ozarks region via one main provider).
- No Medicare/Medicaid enrollment required to join, but most are dual-eligible; private pay possible for non-Medicaid.
- Temporary medical conditions (<21 days) don't disqualify.
- Cannot be in Medicare Advantage, hospice, or certain other plans.
- Medicaid income over limit? Use Income Trust—ask DHS caseworker.
- Medical eligibility via state Office of Long Term Care, separate from financial.

**Data shape:** Limited to specific regions/providers (not statewide); no financial eligibility barrier but Medicaid rules for full coverage; private pay option; nursing home-level care certification required.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits vary by program and household size (2026 figures; include $20 general income disregard). QMB: Individual $1,235-$1,350/month, Married $1,663-$1,824/month (≤100% FPL). SLMB: Individual $1,478-$1,526/month, Married $1,992-$2,064/month (>100%-≤120% FPL). QI: Individual $1,660-$1,715/month, Married $2,239-$2,320/month (>120%-≤135% FPL). ARSeniors (full Medicaid): Lower thresholds, aged 65+.[3][4][5][6]
- Assets: Federal limits apply: $9,090-$9,950 single, $13,630-$14,910 married/couple. Counts: Bank accounts, stocks, bonds. Exempt: Home, one car, burial plots, life insurance (up to $1,500 face value), personal belongings.[3][5][6]
- Must be entitled/eligible for Medicare Part A (QMB/SLMB/QI; ARSeniors exempt but cannot opt out of Medicare if eligible)
- Aged, blind, or disabled (except ARSeniors: aged 65+ only)
- U.S. citizen or qualified alien
- Arkansas resident
- Not eligible for QI if in other Medicaid category simultaneously (must choose)

**Benefits:** QMB: Medicare Part A premiums (if applicable), Part B premiums/deductible/coinsurance/copays. SLMB/QI: Part B premiums only ($202.90/month in 2026). ARSeniors: Full Medicaid benefits + QMB coverage.
- Varies by: priority_tier

**How to apply:**
- Online: www.access.arkansas.gov
- Phone: 1-855-372-1084
- Mail or in-person: Local county DHS office

**Timeline:** QMB: Up to 45 days from complete info (effective first of next month). SLMB/QI: Up to 45 days, retroactive up to 3 months prior (QI not before Jan 1 of application year). ARSeniors: Retroactive 3 months.
**Waitlist:** QI limited funding, first-come first-served (federal cap).

**Watch out for:**
- QI has limited federal funding (first-come, first-served; may run out)
- Must choose QI over other Medicaid/spend-down (no simultaneous coverage)
- Income/resources counted strictly; $20 disregard applies but verify current FPL adjustments
- QMB no retroactive coverage; apply early
- Arkansas uses federal asset limits (some states eliminated); home/car exempt but list all
- Entitled to Medicare but not enrolled? May still qualify if eligible

**Data shape:** Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); ARSeniors as lowest tier with full Medicaid; QI funding-capped and non-retroactive before Jan 1; county DHS processing with statewide uniformity but local offices.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60 or older or disabled (Oct 1, 2025 - Sept 30, 2026): No gross income limit. Net income must be at or below 100% of federal poverty guidelines. Gross income limits (130% FPL) apply only to households without elderly/disabled: 1 person $1695/month, 2 $2291, 3 $2887, 4 $3482, 5 $4079, 6 $4674, 7 $5270, +$595 each additional. For seniors: e.g., $15,060/year ($1,255/month) for 1 person, $20,440/year ($1,703/month) for 2 people.[1][2][3][4]
- Assets: Households with member 60+ or disabled: $4,500 countable resources. All households: $3,000 (or $2,250 in some charts). Temporary 1-year increase to $5,500 available (once every 5 years). Countable: bank accounts, savings certificates, non-exempt vehicles (value over $4,650 per employed/student member). Exempt: home, one household vehicle, income-producing vehicles/property, life insurance, burial spaces, household goods.[1][3][4]
- U.S. citizenship or legal alien status
- Residency in Arkansas
- Social Security Number
- Net income calculation includes deductions for medical expenses (over $35/month for elderly/disabled), shelter, etc.
- Work requirement exempt for 60+ (applies to able-bodied adults 18-54 without dependents: 20 hours/week)
- Categorically eligible if all members receive SSI or household receives TEA (no income/resource test)

**Benefits:** Monthly EBT card benefits for food purchases (amount based on household size, income, deductions; e.g., max allotment for 1-person elderly/disabled household calculated as max minus 30% net income). Restaurant Meals Program available for eligible elderly/disabled.[1][5][7]
- Varies by: household_size

**How to apply:**
- Online: https://www.accessarkansas.org
- Phone: 1-800-482-8988
- In-person: Local DHS county offices
- Mail: Download form from humanservices.arkansas.gov and mail to local office

**Timeline:** Up to 30 days standard; expedited within 7 days if very low income/no assets.[1]

**Watch out for:**
- No gross income test for elderly/disabled households—many miss this and think they earn too much.[1]
- High medical expenses (> $35/month) deductible for 60+, boosting net income eligibility.[2][5]
- Assets include most savings but exempt home/primary vehicle; temporary $5,500 limit often overlooked.[3]
- Must include all who buy/prepare food together in household size.[2]
- Social Security/VA/disability counts as income.[2]
- EBT only for eligible food; Restaurant Meals Program for elderly/disabled in AR.[7]

**Data shape:** No gross income limit for households with elderly (60+) or disabled; higher asset limit ($4,500 vs $3,000); benefits/allotments scale by household size and net income deductions (medical key for seniors); statewide via DHS with county offices.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov/services-worth-knowing/snap/

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly income must meet Federal Income Guidelines at or below 60% of state median income (SMI), varying by household size. Most recent chart (2025): 1: $2,251; 2: $2,944; 3: $3,636; 4: $4,329; add $672 per additional member. Other sources list slightly varying figures like 1: $2,347; 2: $3,069; 3: $3,791; 4: $4,514; 5: $5,236; 6: $5,958 (2025) or regional 1: $1,936; 2: $2,531; 3: $3,127; 4: $3,723; 5: $4,318. Based on previous month's countable income.[1][2][6][7][8]
- Assets: Must meet countable resource standard, including cash, checking/savings accounts, CDs, cryptocurrency, stocks, bonds. Specific limits not detailed; exemptions not specified.[1]
- U.S. citizen or legal resident non-citizen.
- Responsible for home energy bill (not paid by non-resident).
- Household defined as all under one roof/one utility meter; all must apply together.
- Residential only; no businesses.
- If utilities in rent, provide lease showing energy burden (different for subsidized/unsubsidized housing).

**Benefits:** Regular: Fixed amount via approved model based on income, household size, energy source (electricity, gas, propane, wood, pellets); max heating $475, min $50; max cooling $287, min $50. Crisis: Up to $500 (summer/winter) for shut-off, disconnection, depleted fuel, or life-threatening situations. Payments direct to vendor. One regular and one crisis per household per season. Benefit matrix from Arkansas Energy Office.[1][2]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Contact Community-Based Organization (CBO) serving your county for instructions (in-person, phone, mail).
- Download LIHEAP Application Form from local CBO sites (e.g., cscdc.net, crdcnea.tech, eoawc.org).
- Example application via ADEQ.
- Call local agency; no statewide phone listed—find via ADEQ or local CBO.

**Timeline:** Varies; longer during high volume periods. No specific statewide timeline.[7]
**Waitlist:** Funding limited; applications may close early if funds exhausted. No formal waitlist mentioned.[2]

**Watch out for:**
- Household = all under one roof/one meter; roommates count even if not sharing expenses.
- Only 1 regular + 1 crisis per season per household; no duplicates.
- Must be responsible for bill—not eligible if paid by non-resident.
- Seasonal: Heating Jan-Mar, Cooling Jul-Aug, Crisis Jan-Apr/Jul-Sep; funds run out early.
- Income based on prior month; varying charts by source/CBO—verify locally.
- Elderly priority not explicitly stated; no age requirement but crisis for threats.

**Data shape:** Administered via county CBOs with local variations in charts/forms; benefits via state matrix scaled by income/size/fuel; seasonal with early fund exhaustion; household strictly by utility meter.

**Source:** https://www.adeq.state.ar.us/energy/assistance/liheap.aspx

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of federal poverty guidelines. Example guidelines (likely from prior year, check current via provider): 1: $23,760; 2: $32,040; 3: $40,320; 4: $48,600; 5: $56,880; 6: $65,160; 7: $73,460; 8: $81,780. Varies by household size and updated annually per OMB/DOE guidelines in WPN notices[1][2][3][4].
- Assets: No asset limits mentioned in sources[1][2][3][4].
- Categorical eligibility if household has SSI recipient[1][2][3].
- LIHEAP eligibility may qualify (up to 60% Arkansas median income)[2].
- Eligible housing: owner-occupied or rental (landlord agreement for renters); non-stationary trailers must have axles removed, residential utilities, street address mail (no PO Box)[2].
- Priority for elderly (60+), disabled (e.g., SSI/SSDI/Vet disability/Rehab Services), children under 7, Native Americans[1][2][3].
- Must meet building eligibility (energy inefficient home)[2][4].

**Benefits:** Free services: energy audit/inspection by DOE-trained auditor, weatherization measures (attic/wall insulation, weather-stripping doors/windows, caulking/sealing cracks, storm windows, furnace retrofitting), health/safety upgrades, energy-efficient heating equipment. No cost to household; done by crews/contractors[1][3][4][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (CAA) via https://www.acaaa.org/ to find provider by county[1].
- Provider examples: BCD (bcdinc.org), CSCDC (cscdc.net), CADC (cadc.com)[3][5][6].
- In-person/mail/online forms via local provider (e.g., CSCDC 2025 Application requires 12 months utility bills)[9].

**Timeline:** Not specified; after eligibility, local agency schedules energy inspection, then work order and completion. Operational year-round[1][4].
**Waitlist:** Due to limited funding, priority points used; re-certify eligibility every 12 months until served[1][2].

**Watch out for:**
- Must apply through specific local CAA by county, not statewide office[1].
- Renters need landlord Lessor Agreement[3].
- Trailers/campers: strict rules (no axles, residential utilities, street address)[2].
- Priority-based due to funding limits; SSI auto-eligible but others compete[1][2][3].
- Re-certify income every 12 months until served[2].
- Home must pass energy/health/safety inspection and building eligibility[1][2][4].
- Income guidelines update annually; example figures may be outdated—verify current[3].

**Data shape:** Statewide via 5 regional CAA/nonprofit providers with priority tiers; income at 200% poverty or categorical (SSI/LIHEAP); no asset test; building eligibility required alongside client eligibility.

**Source:** https://www.adeq.state.ar.us/energy/assistance/wap.aspx (Arkansas DEQ/AEO); state plan via AEO[2][4].

---

### Senior Medicare Patrol (SMP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, families, and caregivers[1][2][7]
- Assets: No asset limits; no financial tests apply[1][2]
- Must be a Medicare beneficiary, family member, or caregiver in Arkansas; no other restrictions[1][2][7]

**Benefits:** Outreach and education on Medicare fraud prevention; one-on-one counseling; advocacy to resolve billing disputes; referrals for suspected fraud, errors, or abuse; community presentations and materials; often co-located with SHIP health insurance counseling[1][2][4]

**How to apply:**
- Phone: 1-866-726-2916
- Email: [email protected]
- Website: https://insurance.arkansas.gov/consumer-assistance/senior-medicare-patrol-smp/
- Schedule free speaker or report issues via phone/email[2]

**Timeline:** Immediate assistance for counseling and referrals; no formal application processing[1][2][4]

**Watch out for:**
- Not a financial assistance or healthcare benefits program—focuses solely on fraud prevention, education, and advocacy; often confused with benefit-paying programs; volunteers handle services, so availability depends on local staffing; many sites also offer SHIP counseling, which is separate[1][2][4]
- No monetary benefits or direct payments; people miss that it's preventive education, not eligibility-based aid[1][7]

**Data shape:** no income test; volunteer-based education and advocacy program; not a benefits entitlement; statewide with phone/email access; co-administered with SHIP in Arkansas[1][2][4]

**Source:** https://insurance.arkansas.gov/consumer-assistance/senior-medicare-patrol-smp/[2]

---

### Meals on Wheels (Arkansas)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits for Older Americans Act Nutrition Program funding (approximately 39% of program funding). Income limits may apply only to meals funded through Social Services Block Grant (SSBG) sources, which vary by area agency on aging.[2][7]
- Assets: Not specified in available sources. Contact your local Area Agency on Aging for SSBG-funded program details if applicable.[7]
- Must be homebound or unable to leave home due to disability, illness, or frailty[1][8]
- Unable to prepare meals for themselves[1][2][8]
- No caregiver in the home to help with meal preparation[1]
- Must live within the meal delivery service area[1][3]
- Exceptions: Disabled individuals under 60 may qualify if homebound and unable to prepare meals; spouse of eligible 60+ participant may qualify; disabled dependents living with eligible participant may qualify[1][4][7]

**Benefits:** Home-delivered meals. Specific frequency (daily, weekly, number of meals per week) not detailed in search results. All menus approved by registered dietician.[8]
- Varies by: region

**How to apply:**
- Contact your local Area Agency on Aging (primary method)[3][5]
- Visit local senior center[2]
- In-person at Area Agency on Aging office[3]
- Phone contact with Area Agency on Aging[5]

**Timeline:** Varies by program. Some process applications within one week; others take longer if there is a waiting list.[3]
**Waitlist:** Waiting lists may exist depending on local program capacity.[3]

**Watch out for:**
- Income is NOT a barrier to eligibility for most Meals on Wheels funding (Older Americans Act Nutrition Program). This is a common misconception.[2]
- Eligibility varies significantly by region and local provider—requirements that apply in one county may not apply in another.[4][6]
- Disabled individuals under 60 CAN qualify if homebound and unable to prepare meals, but this exception varies by area.[4][7]
- If an applicant can attend a local senior center or food pantry, they may be directed to congregate meals instead of home delivery.[2]
- Some programs require a doctor or social worker referral letter—check with your local program first.[5]
- Spouses of eligible participants may qualify even if they don't meet age requirements, but this is determined on a case-by-case basis by the area agency on aging.[1][7]
- Waiting lists exist in some areas; processing time is not guaranteed to be quick.[3]
- You must live within the service delivery area—seniors outside service areas must seek alternative programs.[3]
- The program prioritizes those with greatest economic or social needs, which may increase nutritional risk.[7]

**Data shape:** This program is locally administered with no statewide uniform eligibility criteria or benefit structure. Eligibility requirements, processing times, meal frequency, and available services vary by Area Agency on Aging. No income limits apply to federally-funded portions (Older Americans Act), but income limits may apply to SSBG-funded portions. Age exceptions for disabled individuals under 60 are discretionary by region. Families must contact their specific local Area Agency on Aging for precise eligibility, benefits, and application details. The program prioritizes homebound seniors with greatest need rather than using income as a primary screening tool.

**Source:** https://agingarkansas.org/ (Arkansas Association of Area Agencies on Aging)

---

### Family Caregiver Support Program


**Eligibility:**
- Age: 60+
- Income: No income restrictions.[1]
- Assets: No asset limits mentioned; not applicable.[1]
- Care recipient must be at least 60 years old (no age limit if they have Alzheimer's or related dementia).[1]
- Caregiver must assist with activities such as transportation, housework, meal preparation, medication reminders, medical appointments, managing finances, dressing, or managing chronic conditions like diabetes or dementia.[1]
- Contact local Area Agency on Aging for grant-specific requirements, which may include diagnosis, age, or location.[3]

**Benefits:** Respite grants, counseling, training, and access to assistance services including respite care; specific services and amounts vary by grant (e.g., home care, day care, or facility care, but not duplicating other funding sources).[1][3][5]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (no specific statewide phone or URL listed; visit agingarkansas.org for details).[1][3]
- For specific grants like CareLink: Apply through Alzheimer's Arkansas Programs and Services, 201 Markham Center Drive, Little Rock AR 72205 (regional).[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not all grants are identical; each has unique requirements like specific diagnosis or county residency—always check with local Area Agency on Aging.[3][5]
- Services cannot duplicate other funding (e.g., Medicaid, Medicare, private insurance).[5]
- This is distinct from VA or Medicaid paid caregiver programs.[2][4]
- Primarily respite grants, not ongoing paid caregiving.[1]

**Data shape:** Decentralized by local Area Agencies on Aging and grants; no statewide income/asset test; services vary by grant and region (e.g., county-restricted like CareLink); no fixed hours/dollars listed.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://agingarkansas.org/services/family-caregiver-support/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 125% of the current Health and Human Services Poverty Guidelines (federal poverty level). Exact dollar amounts vary annually and by household size; families must check current HHS Poverty Guidelines for precise figures, as no specific table provided in Arkansas sources[1][4].
- Assets: No asset limits mentioned in program documentation[1][4].
- Resident of the State of Arkansas[1][4]
- Not currently employed at the time of application[1][4]
- Low employment prospects (inherent to program design)[1]
- National priority for veterans, qualified spouses, individuals over 65, those with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, or prior American Job Center users[2]

**Benefits:** Part-time paid work (average 20 hours/week) at the higher of federal, state, or local minimum wage; on-the-job training at non-profit or public agencies (e.g., schools, hospitals, senior centers); job search skills development; assistance from Employment and Training Coordinator to find permanent unsubsidized part-time/full-time jobs[1][2][3][4].
- Varies by: priority_tier

**How to apply:**
- Phone: (501) 320-6586[1]
- Email: [email protected][1]
- Mail: P.O. Box 1437, Slot S530, Little Rock, Arkansas 72203-1437[1]
- In-person: Arkansas Department of Human Services, 700 Main Street, 5th Floor, Little Rock, Arkansas 72201[1]
- Contact Division of Aging, Adult, and Behavioral Health Services (Gary Hinkle) for local intake[1]

**Timeline:** Not specified; enrollment if eligible and no waitlist[5].
**Waitlist:** Possible waitlist if demand exceeds slots; check with local office[5].

**Watch out for:**
- Must be unemployed at application; cannot be currently working[1][4]
- Income limit is 125% of federal poverty guidelines—check current annual figures as they adjust and scale by household size[1][2]
- Priority enrollment for veterans, over-65s, disabled, etc., may delay others[2]
- Program is temporary bridge to unsubsidized employment, not permanent job guarantee[1][2]
- No asset test, but strict unemployment and residency checks[1][4]

**Data shape:** State-administered via Arkansas DHS with national SCSEP standards; income scales by household size per federal poverty guidelines (no fixed table in sources); priority tiers affect access; statewide but centralized intake in Little Rock

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/senior-community-service-employment-program/[1]

---

### Legal Aid of Arkansas (Senior Legal Services)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Maximum income is 125% of Federal Poverty Guidelines (National Eligibility Level) for standard eligibility; up to 200% (Maximum Income Level) if specific factors allow waiver. Gross household income applies. Table (updated 01/18/2024, for each additional family member add $6,725 to 125% and $10,760 to 200%):
| Size of Family Unit | 125% FPL (National) | 200% FPL (Max with Waiver) |
|--------------------|---------------------|----------------------------|
| 1                  | $18,825             | $30,120                    |
| 2                  | $25,550             | $40,880                    |
| 3                  | $32,275             | $51,640                    |
| 4                  | $39,000             | $62,400                    |
- Assets: Assets are considered during screening (staff will ask about income and assets), but no specific dollar limits or exemptions detailed in guidelines.[1]
- Arkansas resident
- Civil legal matter only (no criminal cases like traffic tickets or fee-generating cases like personal injury)
- Priority areas for seniors include: public benefits (Medicare, Medicaid, SSI), guardianships, powers of attorney, end-of-life instructions, evictions, landlord-tenant disputes, debt relief, consumer issues, employment rights, disability rights, domestic abuse, orders of protection.[2][3]

**Benefits:** Free civil legal assistance including advice, representation, help with applications/appeals for benefits (e.g., Medicare, Medicaid, SSI), wills, powers of attorney, guardianships, evictions, debt collection defense, consumer scams, age discrimination, nursing home issues. No specific dollar amounts or hours stated; case-by-case based on priority and resources.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Online: Apply via link at https://arlegalaid.org/contact-us/apply-for-legal-aid.html (redirects to application portal)[9]
- Phone: Helpline 1-800-9 LAW AID (1-800-952-9243); Tuesday evenings 5:15-7:15 PM for extended hours[1][9]
- Note: No specific mail or in-person details listed; call helpline for guidance

**Timeline:** Staff try to take calls immediately; high volume may require callback. No specific processing timeline stated.[1]
**Waitlist:** Not mentioned; dependent on case volume and priority[1]

**Watch out for:**
- Criminal matters and fee-generating cases (e.g., personal injury) ineligible[2]
- Income is gross household; waivers to 200% FPL only for specific meritorious factors, not automatic[1]
- No age requirement—open to all qualifying low-income Arkansans, but seniors prioritized for relevant issues like benefits/guardianships[1][3]
- Figures updated periodically (last 01/18/2024); verify current FPL via helpline as they adjust annually[1][6]
- Groups/corporations rarely eligible unless all members qualify and lack private counsel means[2]

**Data shape:** Income guidelines use tiered FPL percentages with waiver option; no age or strict asset caps; civil-only with senior-relevant priorities; statewide via single provider with helpline/online focus

**Source:** https://arlegalaid.org/what-we-do/eligibility-guidelines.html

---

### Long-term Care Ombudsman


**Eligibility:**
- Income: No income limits; available to all residents of long-term care facilities regardless of financial status[5][6]
- Assets: No asset limits; no financial tests apply[5][6]
- Must be a resident of a long-term care facility in Arkansas (e.g., nursing home, assisted living); anyone can contact on behalf of a resident, including family, friends, staff, or anonymously[5][6]

**Benefits:** Advocacy services including investigating complaints, resolving issues related to resident rights, quality of life, Medicaid/Medicare, discharges/transfers, finances, restraints, guardianship/power of attorney, food quality, room temperature, social activities, care plans; education on rights; empowerment to speak for themselves; no specific dollar amounts or hours, provided as needed without reprisal[5][6]

**How to apply:**
- Phone: Contact local ombudsman (numbers posted in facilities; regional via Area Agency on Aging)[5]
- In-person: Local ombudsman at long-term care facilities
- Anyone can contact: friends, relatives, staff, anonymous callers[5][6]

**Timeline:** Immediate response to concerns; no formal processing timeline specified[5][6]

**Watch out for:**
- This is not a direct service or financial aid program but free advocacy for long-term care facility residents only—not for home care or non-residents; people often confuse it with becoming a volunteer ombudsman (which has training/age requirements) vs. receiving services (open to all facility residents); must contact local ombudsman posted in facilities, not a central application[1][5][6]
- Volunteers/representatives have strict conflict of interest rules (e.g., no relation to facility staff/residents)[1][2][8]

**Data shape:** no income/asset test; advocacy-only for long-term care facility residents statewide via regional Area Agencies on Aging; anyone can request on behalf of resident; not a qualification/application-based benefit program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://agingarkansas.org/how-to-become-part-of-the-ombudsman-program-in-arkansas/

---

### Family Caregiver Grant Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income restrictions.[1]
- Assets: No asset limits mentioned.[1]
- Care recipient must reside in Arkansas and live independently or with family (not in a full-time care facility).[4]
- Care recipient requires assistance of a caregiver for daily functions (must be stated in letter of diagnosis).[4]
- Official diagnosis of dementia (any age) or chronic illness (age 60+ ) on physician’s official letterhead or prescription pad.[1][4]
- If dementia, no age limit; otherwise, care recipient must be at least 60.[1]

**Benefits:** $500 grant, usable for in-home respite care, adult day care, legal counseling, home care supplies, minor home modifications, mental health counseling, utilities, lawn maintenance, home cleaning, and more. Can apply every 6 months from prior approval date, as long as funds available.[4]

**How to apply:**
- Online or download at alzark.org/grants/[4]
- Phone: 501-224-0021 ext. 210[4]
- Email: grants@alzark.org[4]

**Timeline:** Up to 10 business days.[4]
**Waitlist:** Funds available as long as not depleted; no formal waitlist mentioned.[4]

**Watch out for:**
- Must complete and return post-grant survey or lose eligibility for all future grants for both caregiver and care recipient.[4]
- Care recipient cannot be in full-time care facility or receiving like-services from Medicaid, Medicare, AR Choices, etc. (for some sub-grants).[3][4]
- Only twice per fiscal year (July 1-June 30), with 6-month wait between requests.[3][4]
- Not for paid caregiver wages; financial grant for specific respite/supports only.[4]

**Data shape:** Statewide $500 financial grant administered by Alzheimer's Arkansas; no income/asset test; diagnosis-driven with 6-month reapplication limit; requires post-grant survey compliance.

**Source:** https://www.alzark.org/family-assistance-program-grant/[4]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| ARKansas Medicaid | benefit | state | deep |
| ARChoices in Homecare | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Senior Medicare Patrol (SMP) | benefit | federal | medium |
| Meals on Wheels (Arkansas) | benefit | federal | medium |
| Family Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid of Arkansas (Senior Legal Serv | resource | state | simple |
| Long-term Care Ombudsman | resource | federal | simple |
| Family Caregiver Grant Program | benefit | state | medium |

**Types:** {"benefit":11,"employment":1,"resource":2}
**Scopes:** {"state":5,"local":1,"federal":8}
**Complexity:** {"deep":9,"medium":3,"simple":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/AR/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 3 programs

### Data Shape Notes

Unique structural observations from each program:

- **ARKansas Medicaid**: Multiple tiers/programs (Nursing Home, HCBS waivers, ARSeniors, SSI-Related) with differing income/asset thresholds and care levels (NFLOC vs. Intermediate); annual changes, spousal rules, 5-year look-back unique to LTC Medicaid
- **ARChoices in Homecare**: Tiered functional assessment (0-3) determines eligibility; Medicaid financial criteria without specified income table; county-based application with centralized assessment; no fixed hours/dollars, individualized budget
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to specific regions/providers (not statewide); no financial eligibility barrier but Medicaid rules for full coverage; private pay option; nursing home-level care certification required.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); ARSeniors as lowest tier with full Medicaid; QI funding-capped and non-retroactive before Jan 1; county DHS processing with statewide uniformity but local offices.
- **Supplemental Nutrition Assistance Program (SNAP)**: No gross income limit for households with elderly (60+) or disabled; higher asset limit ($4,500 vs $3,000); benefits/allotments scale by household size and net income deductions (medical key for seniors); statewide via DHS with county offices.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered via county CBOs with local variations in charts/forms; benefits via state matrix scaled by income/size/fuel; seasonal with early fund exhaustion; household strictly by utility meter.
- **Weatherization Assistance Program**: Statewide via 5 regional CAA/nonprofit providers with priority tiers; income at 200% poverty or categorical (SSI/LIHEAP); no asset test; building eligibility required alongside client eligibility.
- **Senior Medicare Patrol (SMP)**: no income test; volunteer-based education and advocacy program; not a benefits entitlement; statewide with phone/email access; co-administered with SHIP in Arkansas[1][2][4]
- **Meals on Wheels (Arkansas)**: This program is locally administered with no statewide uniform eligibility criteria or benefit structure. Eligibility requirements, processing times, meal frequency, and available services vary by Area Agency on Aging. No income limits apply to federally-funded portions (Older Americans Act), but income limits may apply to SSBG-funded portions. Age exceptions for disabled individuals under 60 are discretionary by region. Families must contact their specific local Area Agency on Aging for precise eligibility, benefits, and application details. The program prioritizes homebound seniors with greatest need rather than using income as a primary screening tool.
- **Family Caregiver Support Program**: Decentralized by local Area Agencies on Aging and grants; no statewide income/asset test; services vary by grant and region (e.g., county-restricted like CareLink); no fixed hours/dollars listed.
- **Senior Community Service Employment Program (SCSEP)**: State-administered via Arkansas DHS with national SCSEP standards; income scales by household size per federal poverty guidelines (no fixed table in sources); priority tiers affect access; statewide but centralized intake in Little Rock
- **Legal Aid of Arkansas (Senior Legal Services)**: Income guidelines use tiered FPL percentages with waiver option; no age or strict asset caps; civil-only with senior-relevant priorities; statewide via single provider with helpline/online focus
- **Long-term Care Ombudsman**: no income/asset test; advocacy-only for long-term care facility residents statewide via regional Area Agencies on Aging; anyone can request on behalf of resident; not a qualification/application-based benefit program
- **Family Caregiver Grant Program**: Statewide $500 financial grant administered by Alzheimer's Arkansas; no income/asset test; diagnosis-driven with 6-month reapplication limit; requires post-grant survey compliance.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Arkansas?
