# Kansas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 8.6m)

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
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 8 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **service|advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$967` → Source says `$2,901` ([source](https://khap.kdhe.ks.gov/KEESM/Feb_2018_Output/keesm8300.htm))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive package including: all Medicaid-covered services, multidisciplinary assessment and treatment planning, primary care (physician and nursing), social work services, restorative therapies (physical therapy, occupational therapy, speech-language pathology), personal care and supportive services, nutritional counseling, recreational therapy, transportation, meals, and medical specialty services[4]` ([source](https://khap.kdhe.ks.gov/KEESM/Feb_2018_Output/keesm8300.htm))
- **source_url**: Ours says `MISSING` → Source says `https://khap.kdhe.ks.gov/KEESM/Feb_2018_Output/keesm8300.htm`

### Food Assistance (SNAP)

- **income_limit**: Ours says `$1922` → Source says `$15,060` ([source](https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Maximum allotments (Oct 2025-Sept 2026, 48 states): 1-person $298; 2 $546; 3 $785; 4 $994; 5 $1,183; 6 $1,421; 7 $1,571; 8 $1,789 (+$218 each additional). Actual amount: max allotment minus 30% of net income.[4]` ([source](https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx`

### Low-Income Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$3091` → Source says `$1,956` ([source](https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment to help meet home energy costs (heating fuel); exact amount varies by household income, size, dwelling type, heating fuel type, and utility rates. Subject to available federal funding.[4][6]` ([source](https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx`

### Senior Health Insurance Counseling for Kansas (SHICK)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, confidential, one-on-one counseling on Medicare (Parts A-D), Medicare Supplement (Medigap), Medicare Advantage, prescription drug coverage (Part D), Extra Help, long-term care insurance, claims/appeals, supplemental rate comparisons, employer group plans, Medicaid, and other health insurance options; public education presentations; available Monday-Friday, typically 8:30 a.m.-3 p.m. or 8 a.m.-5 p.m. via phone or in-person[1][2][3][4][5][7][8]` ([source](https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick))
- **source_url**: Ours says `MISSING` → Source says `https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick`

### Caregiver Support Programs

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care, personal care, homemaker services, support services; K-RAD subsidizes up to $1,000/year per care recipient for respite (paid to provider).[5][6] Specifics vary by waiver (e.g., HCBS for frail elderly).[1]` ([source](https://www.kdads.ks.gov/services-programs/aging/caregivers))
- **source_url**: Ours says `MISSING` → Source says `https://www.kdads.ks.gov/services-programs/aging/caregivers`

### Kansas Legal Services (Legal Aid for Seniors)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Advice, document preparation, limited case representation, legal consultations on estate planning, advance directives, powers-of-attorney, living wills, consumer advocacy, public benefits access, elder abuse prevention; Elder Law Hotline provides free legal advice (no drafting pleadings or full representation); public education on elders' rights.` ([source](https://www.kansaslegalservices.org/page/57/programs-seniors))
- **source_url**: Ours says `MISSING` → Source says `https://www.kansaslegalservices.org/page/57/programs-seniors`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Identify, investigate, and resolve complaints; provide information on long-term care services and resident rights; advocate for improvements in quality of life and care; represent interests before agencies; ensure access to services; handle issues from daily care to food service while protecting privacy and confidentiality[1][3][4][7]` ([source](https://www.ombudsman.ks.gov[8]))
- **source_url**: Ours says `MISSING` → Source says `https://www.ombudsman.ks.gov[8]`

## New Programs (Not in Our Data)

- **KanCare Frail Elderly Waiver (FE Waiver)** — service ([source](https://khap.kdhe.ks.gov/KEESM/Oct_2020_Output/keesm8210.htm (KDADS policy); https://portal.kmap-state-ks.us/Documents/Provider/Provider%20Manuals/HCBS_FE_24281_24277.pdf (HCBS FE Provider Manual)[3][4]))
  - Shape notes: No fixed income limit but patient liability of $2,982/month (2026); NFLOC via FAI assessment; statewide with waitlist due to slot limits; ties to underlying Medicaid eligibility
- **Medicare Savings Programs (MSP) including QMB, SLMB, QI** — financial ([source](https://khap.kdhe.ks.gov (Kansas Department of Health and Environment/Kansas Health Assistance Programs); local DCF centers))
  - Shape notes: State-administered with federal FPL-based tiers (QMB 100%, SLMB 120%, QI 135%); income/assets for individual/couple only (no larger household table); annual updates and QI caps create variability; local DCF application required, no central online portal.
- **Weatherization Assistance Program** — service ([source](https://kshousingcorp.org/weatherization-assistance))
  - Shape notes: Statewide via KHRC with regional subgrantees; priority for SSI/TAF/LIEAP households; 15-year repeat restriction; income at 200% FPL or categorical eligibility; free services only after audit.
- **Kansas Senior Nutrition Program (Home-Delivered and Congregate Meals)** — service ([source](https://www.kdads.ks.gov/services-programs/aging/kansas-senior-nutrition-program[2]))
  - Shape notes: No income or asset limits statewide; priority on age 60+ and spouses; delivered via 15 local Area Agencies on Aging with potential regional capacity differences; requires local assessment for home-delivered.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.kansascommerce.gov/program/workforce-services/state-of-kansas-senior-employment-services/))
  - Shape notes: SCSEP in Kansas is administered through multiple state and national nonprofit providers rather than a single centralized system. Income eligibility is pegged to federal poverty guidelines (125% threshold) but specific dollar amounts are not published in these sources and must be obtained from local providers. The program prioritizes certain populations (veterans, seniors over 65, disabled individuals, rural residents) which may affect application processing. No information is available on processing times, waitlists, or required documentation. Families must contact their local provider directly for application specifics.
- **Senior Care Act Services** — service ([source](https://www.kdads.ks.gov/services-programs/aging/senior-care-act-sca))
  - Shape notes: Administered regionally via 11 AAAs with county-specific services and providers; sliding fee scale ties benefits to income/assets; functional assessment drives plan of care; self-direction option unique for family/friend caregivers
- **Senior Citizen Law Project (SCLP)** — service|advocacy ([source](https://www.kansaslegalservices.org/page/57/programs-seniors))
  - Shape notes: SCLP eligibility is based on 'greatest economic need' and 'greatest social need' rather than strict income cutoffs. The program is statewide but delivered through regional Area Agencies on Aging. The Elder Law Hotline (a related but distinct service) has no income test and serves as an entry point. Specific dollar amounts, household tables, asset limits, processing times, and detailed application procedures are not provided in the available search results and require direct contact with Kansas Legal Services or local Area Agencies on Aging.

## Program Details

### KanCare Frail Elderly Waiver (FE Waiver)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No set income limit for the waiver, but beneficiaries keep $2,982 per month of their income (2026 amount). Income eligibility determined through underlying KanCare Medicaid categories such as SSI, 300% SSI, TANF, or Medically Needy spend-down.[1][2][6]
- Assets: Standard Kansas Medicaid asset limit applies (exact dollar amount not specified in sources; use KanCare Spend Down Calculator for estimate). Countable assets exclude primary home (if equity ≤ $752,000 in 2026, applicant lives there or intends to return, spouse/minor/disabled child resides there), household furnishings, appliances, personal effects, and one vehicle. 60-month Look-Back Rule penalizes asset transfers below fair market value.[1]
- Kansas resident
- Eligible for KanCare (Kansas Medicaid)
- Nursing Facility Level of Care (NFLOC) determined via Functional Assessment Instrument (FAI), assessing Activities of Daily Living (ADLs: toileting, bathing, dressing, transferring, mobility, eating) and Instrumental ADLs (IADLs: cleaning, cooking, shopping, paying bills), plus cognitive/behavioral issues.[1][2][3]

**Benefits:** Home and Community-Based Services (HCBS) as alternative to nursing home care, including variety of services authorized via Plan of Care (POC) process to meet needs of frail elderly; specific services not exhaustively listed but designed for integration and maintenance in community. Does not cover room/board or living expenses.[4][5]
- Varies by: individual_needs

**How to apply:**
- Contact Kansas Department for Aging and Disability Services (KDADS) or local waiver program manager for preliminary functional eligibility application (specific phone/website not in results; check KDADS or KanCare sites)
- Enroll via fiscal agent for providers, but for members: apply for KanCare Medicaid first, then waiver assessment[4][5]

**Timeline:** Not specified in sources
**Waitlist:** Waitlist (proposed recipient list) maintained when no openings exist; limited slots[3]

**Watch out for:**
- Must first qualify for KanCare Medicaid; waiver denial if not financially eligible[2]
- 60-month Look-Back Rule on asset transfers leads to penalty periods[1]
- Limited slots create waitlists; not guaranteed immediate access[3]
- Services require prior authorization via POC; no coverage for room/board[4][5]
- Home equity limit $752,000 (2026); intent to return required for exemption[1]

**Data shape:** No fixed income limit but patient liability of $2,982/month (2026); NFLOC via FAI assessment; statewide with waitlist due to slot limits; ties to underlying Medicaid eligibility

**Source:** https://khap.kdhe.ks.gov/KEESM/Oct_2020_Output/keesm8210.htm (KDADS policy); https://portal.kmap-state-ks.us/Documents/Provider/Provider%20Manuals/HCBS_FE_24281_24277.pdf (HCBS FE Provider Manual)[3][4]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No income limits for PACE eligibility itself[3]. However, if seeking Medicaid-funded PACE (which covers ~99% of participants[5]), Medicaid income limits apply: under 300% of Federal Benefit Rate (~$2,901/month for single individuals in 2025)[2]. Kansas-specific Medicaid income thresholds should be verified with state.
- Assets: No asset limits for PACE eligibility itself[3]. For Medicaid-funded PACE: assets must be $2,000 or less, excluding primary home and one automobile[2][5].
- Must be certified by the state as needing nursing home level of care[3][7]
- Must be able to live safely in the community with PACE services at time of enrollment[3][7]
- Must reside in the service area of a PACE organization[3][7]
- Persons age 55-64 must be determined disabled by Social Security standards[1]
- Cannot be enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice services[3]
- For Medicare eligibility: must be U.S. citizen or legal resident for 5 years; must be 65+, disabled, have ALS, or end-stage renal disease[2]

**Benefits:** Comprehensive package including: all Medicaid-covered services, multidisciplinary assessment and treatment planning, primary care (physician and nursing), social work services, restorative therapies (physical therapy, occupational therapy, speech-language pathology), personal care and supportive services, nutritional counseling, recreational therapy, transportation, meals, and medical specialty services[4]
- Varies by: not_applicable — all participants receive the same comprehensive benefit package regardless of payment source[4]

**How to apply:**
- Referral through Kansas Department of Aging and Disability Services (KDADS) using form ES-3166[1]
- Contact PACE provider directly (see providers below)
- Coordinate with eligibility worker who will communicate with PACE entity[1]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE is NOT available statewide — you must live in one of three specific service areas to qualify[1][4]
- No income or asset limits for PACE itself, but ~99% of participants are dual-eligible (Medicare + Medicaid) because Medicaid covers most costs[5]. Private pay is possible but costs $7,000+/month or $200-900/month share of cost[5]
- You cannot be enrolled in Medicare Advantage, Medicare prepayment plans, or prescription drug plans to join PACE[3] — this is a common barrier for seniors already in MA plans
- Persons age 55-64 face an additional hurdle: must be determined disabled by Social Security standards, not just need nursing home level of care[1]
- Must be able to live safely in community at enrollment — PACE is not for those requiring immediate institutional care[3][7]
- Medicaid eligibility pathways are complex and state-specific; not meeting standard income/asset limits doesn't disqualify you — Medicaid Planning Professionals can help explore alternative pathways[2]
- Average PACE participant is 76 years old with multiple complex conditions[3] — program is designed for frail elderly with significant needs

**Data shape:** PACE in Kansas is geographically restricted to three provider service areas, making location the primary eligibility barrier. No income/asset test for PACE itself, but funding source (Medicare/Medicaid vs. private pay) dramatically affects cost. Dual-eligible status is nearly universal among participants. Age 55-64 cohort faces additional disability verification requirement. All participants receive identical comprehensive benefit package regardless of payment source.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://khap.kdhe.ks.gov/KEESM/Feb_2018_Output/keesm8300.htm

---

### Medicare Savings Programs (MSP) including QMB, SLMB, QI

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income limits vary by program tier and are based on monthly amounts including a $20 disregard per household. For 2026 (most recent available): QMB - Individual: $1,275; Couple: $1,724. SLMB - Individual: approx. $1,549 (based on 120% FPL trends from 2022 data of $1,379 and 2024 adjustments); Couple: approx. $2,080. QI - Individual: approx. $1,660; Couple: approx. $2,239 (up to 135% FPL). Older Kansas-specific data (2024): QMB Individual $1,255 / Couple $1,693; LMB (SLMB) Individual $1,149 / Couple $1,551. Limits updated annually; confirm with KDHE as they align with federal FPL but state-administered[1][2][3][5][7][8]. No full household size table beyond individual/couple in sources; assumes 1-2 person households typical for Medicare beneficiaries.
- Assets: Resource limits (assets): Individual: $9,430 (2024/2026 QMB); $8,400 (older 2022 data). Married couple: $14,130 (2024/2026); $12,600 (2022). What counts: Bank accounts, stocks, bonds (countable resources). Exempt: Primary home, one car, household goods, life insurance, burial plots, prepaid funeral (up to certain amounts), $1,500 burial allowance. Limits updated periodically; QI/SLMB similar to QMB[1][2][4][5].
- Must be enrolled in Medicare Part A (for QMB, SLMB, QI; QDWI exception for working disabled).
- Kansas resident.
- U.S. citizen or qualified immigrant.
- Not eligible for full Medicaid (MSP is for higher income).
- QI requires annual reapplication and is first-come, first-served with priority to prior recipients[2][3][4][6].

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments for Medicare-covered services/items; auto-qualifies for Extra Help (Part D low-income subsidy, caps drug copays at $12.65/drug in 2026). SLMB: Pays Part B premiums only (plus Part D via Extra Help). QI: Pays Part B premiums only (plus Part D Extra Help); no deductibles/coinsurance. Providers cannot bill QMB enrollees for Medicare-covered costs. Value: Saves ~$2,000+/year in premiums/cost-sharing[1][2][3][4][5][6][8].
- Varies by: priority_tier

**How to apply:**
- In-person or phone: Local Kansas Department for Children and Families (DCF) Service Center (find via kdhe.ks.gov or call 1-800-792-4884)[3][8].
- Phone: 1-800-792-4884 (Kansas Legal Services confirmation line for guidelines)[8].
- Mail: Submit 4-page MSP application to local DCF office.
- No specific online URL listed; apply through DCF centers (khap.kdhe.ks.gov for policy/docs)[3][6].

**Timeline:** Not specified in sources; typically state-processed, begins month of application for determined eligibility[2][6].
**Waitlist:** QI has first-come, first-served with waitlist possible if funding exhausted; priority to prior-year recipients[2].

**Watch out for:**
- Income/resource limits change annually (Feb/May FPL updates); always confirm current via 1-800-792-4884[5][6][8].
- QI requires annual reapplication and may have funding caps/waitlists[2].
- QMB protects from provider billing for Medicare-covered services, but small Medicaid copays possible[2].
- Auto-qualifies for Extra Help, but must report changes promptly.
- Not full Medicaid; doesn't cover long-term care.
- Outdated web data (e.g., 2022 limits); use state sources for 2026[1][4].
- Married couple limits apply if both on Medicare; household size mainly 1-2.

**Data shape:** State-administered with federal FPL-based tiers (QMB 100%, SLMB 120%, QI 135%); income/assets for individual/couple only (no larger household table); annual updates and QI caps create variability; local DCF application required, no central online portal.

**Source:** https://khap.kdhe.ks.gov (Kansas Department of Health and Environment/Kansas Health Assistance Programs); local DCF centers

---

### Food Assistance (SNAP)


**Eligibility:**
- Age: 60+
- Income: Households with a member 60+ or disabled are exempt from the gross income limit (130% FPL) and only need to meet the net income limit. For example, 2025 limits: $15,060 gross/month for 1 person, $20,440 for 2 (general reference; Kansas uses expanded rules for elderly). Net income is gross minus deductions like standard $209, medical over $35 for elderly/disabled, shelter (rent/utilities exceeding 50% income after other deductions, capped at $744 unless elderly/disabled). Social Security, pensions, VA/disability count as income.[1][2][3][4][6]
- Assets: Countable assets below $2,750, or $4,250 if a household member is elderly (60+) or disabled. Countable: cash, bank accounts, non-exempt property. Exempt: primary home, household goods, retirement savings, life insurance cash value (varies), income-producing property (details via DCF).[1][2]
- Kansas resident; apply in county of residence.
- U.S. citizen or qualified non-citizen with legal status documentation.
- Household includes those who buy/prepare food together.

**Benefits:** Monthly EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Maximum allotments (Oct 2025-Sept 2026, 48 states): 1-person $298; 2 $546; 3 $785; 4 $994; 5 $1,183; 6 $1,421; 7 $1,571; 8 $1,789 (+$218 each additional). Actual amount: max allotment minus 30% of net income.[4]
- Varies by: household_size

**How to apply:**
- Online: Kansas Benefits Portal at https://www.benefitsparkansas.org/ (implied via DCF sites).
- Phone: Contact local DCF office (find via https://www.dcf.ks.gov/services/ees/Pages/default.aspx).
- Mail/In-person: Local DCF Economic and Employment Services office by county.
- Authorized rep/home visit/telephone interview for elderly/disabled.

**Timeline:** Typically 30 days; expedited for urgent cases (7 days if very low income/liquid assets under $100).[3]

**Watch out for:**
- Elderly households skip gross income test but must meet net income and assets; deduct high medical/shelter costs.
- No broad-based categorical eligibility in Kansas (stricter than some states).
- Assets include countable resources; exemptions often missed (e.g., home exempt).
- Social Security/pensions count as income.
- Apply in correct county; authorized reps allowed for mobility issues.

**Data shape:** Elderly/disabled exempt from gross income test; higher asset limit; deductions for medical/shelter uncapped for them; county-based application; benefits scale by household size and net income.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dcf.ks.gov/services/ees/Pages/Food/FoodAssistance.aspx

---

### Low-Income Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Combined gross monthly income (before deductions) of all persons living at the address must not exceed 150% of the federal poverty level. 2026 guidelines: 1: $1,956; 2: $2,644; 3: $3,331; 4: $4,019; 5: $4,706; 6: $5,394; 7: $6,081; 8: $6,769; +1: add $688 per additional person.[4][2]
- Assets: Available resources are considered in eligibility, but no specific dollar limits or exemptions detailed in sources.[4]
- An adult living at the address must be personally responsible for paying heating costs, payable to landlord or fuel vendor.[2][4][5]
- Household must live in a Kansas county and be legally capable of acting on own behalf (or via guardian/conservator if incapacitated).[1]
- At least one U.S. citizen or qualified alien in household; proof required if not on other assistance.[1][5]
- Everyone residing at the same utility address must apply together; college students in dorms ineligible, must live at home full-time to count.[1]
- No duplicate benefits from state LIEAP and tribal LIHEAP in same year; tribal members referred to tribe.[1]
- No more than one regular benefit per program year.[1]

**Benefits:** One-time payment to help meet home energy costs (heating fuel); exact amount varies by household income, size, dwelling type, heating fuel type, and utility rates. Subject to available federal funding.[4][6]
- Varies by: household_size|priority_tier

**How to apply:**
- Online: DCF Self-Service Portal at www.dcf.ks.gov (click 'Apply for Services').[2][3]
- Paper: Request from local DCF Service Center, helping agencies, utilities, or prior recipients mailed info.[2][5]
- In-person: Local DCF Service Centers, Evergy Wichita Connect walk-in center, or Kansas LIEAP application events (list on DCF website).[3]
- Submit to designated DCF Regional LIEAP processing office.[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Everyone at the address (not just applicant) income counted, unlike TANF/FA which may exclude others.[5]
- Must be personally responsible for heating costs; ineligible if fully included in subsidized rent.[2][5]
- College students don't count unless living full-time at home (no dorms/apartments).[1]
- Separate LIEAP app required, not auto from other benefits; application period only (e.g., 2026: Jan 20-Mar 31).[4][5]
- No duplicates with tribal programs; one benefit per year.[1]
- Legally incapacitated ineligible without guardian.[1]

**Data shape:** Income based on full household at address (not just applicant family); varies by income/size/fuel/dwelling/utility rates; seasonal app period ends late March; regional DCF processing.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income must either include a member who received TAF, SSI, or LIEAP within the last 12 months, or not exceed 200% of Federal Poverty Guidelines (specific dollar amounts not listed in sources; refer to current KHRC State Plan). Exact table not provided in results, but typical levels are 200% FPL by household size[1][2][6].
- Assets: No asset limits mentioned.
- Household must occupy the home; all utilities (electric and gas) must be active[1][2].
- Home not designated for acquisition/clearance within 12 months[1][2].
- If previously weatherized, must be >15 years ago (unless disaster damage not covered by insurance); no repeat of prior measures[1][2].
- Homeowners or renters (renters need landlord permission)[1][3][6].
- No major health/safety issues (e.g., mold, asbestos, threat of violence) or structural problems that make weatherization ineffective or unsafe[2].

**Benefits:** Free weatherization services including certified energy audits and professional installation of upgrades (e.g., insulation, sealing, health/safety improvements); no specific dollar amounts or hours stated, all at no cost[1][3][4][6][8].
- Varies by: priority_tier

**How to apply:**
- Online: https://kshousingcorp.org/weatherization-assistance[1].
- Standardized application form: https://kshousingcorp.org/wp-content/uploads/2023/05/Standardized-Weatherization-Application.pdf[1].
- Regional providers: e.g., NCRPC (800) 432-0303 or download/mail/email form[3]; SEK-CAP (contact via https://sek-cap.com/services/weatherization/)[4]; SCKEDD (apply now link on site)[8]; Evergy area agencies[6].
- Phone/mail/in-person via local subgrantees (contact KHRC or local agency).

**Timeline:** Not specified in sources.

**Watch out for:**
- No services if home weatherized in past 15 years (unless disaster exception); no repeats of prior measures[1][2].
- Renters need landlord permission and agreement not to raise rent for 2 years[6].
- Active utilities required; home must be occupiable without major safety/structural issues[1][2].
- Eligibility prioritizes SSI/TAF/LIEAP recipients; income verification strictly required for past 12 months[1][2].
- Apply via local provider, not centrally; find agency by region[3][4][6][8].

**Data shape:** Statewide via KHRC with regional subgrantees; priority for SSI/TAF/LIEAP households; 15-year repeat restriction; income at 200% FPL or categorical eligibility; free services only after audit.

**Source:** https://kshousingcorp.org/weatherization-assistance

---

### Senior Health Insurance Counseling for Kansas (SHICK)


**Eligibility:**
- Income: No income limits; available to anyone with Medicare questions, including older Kansans, people with disabilities, and caregivers[1][2][4][6]
- Assets: No asset limits or tests apply[2][4]
- Open to all Kansans with questions about Medicare or related health insurance; no affiliation requirement beyond having Medicare-related inquiries[1][2][4][7]

**Benefits:** Free, confidential, one-on-one counseling on Medicare (Parts A-D), Medicare Supplement (Medigap), Medicare Advantage, prescription drug coverage (Part D), Extra Help, long-term care insurance, claims/appeals, supplemental rate comparisons, employer group plans, Medicaid, and other health insurance options; public education presentations; available Monday-Friday, typically 8:30 a.m.-3 p.m. or 8 a.m.-5 p.m. via phone or in-person[1][2][3][4][5][7][8]

**How to apply:**
- Phone: 1-800-860-5260 (statewide toll-free)[2][3][8][9]
- Regional/local contacts (e.g., Sedgwick: 316-660-0126[1], Johnson County: 913-715-8856[5], North Central: 1-800-432-2703[6])
- Website: https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick[2][3]
- In-person: Through local Area Agencies on Aging or SHICK counselors statewide[1][5][6][8]
- Mail/Fax: Kansas Department for Aging and Disability Services, 503 S. Kansas Ave, Topeka, KS 66603; Fax: 785-296-0256[3][8]

**Timeline:** Counseling appointments scheduled upon contact; no formal processing as it's direct service, though busy during Open Enrollment (mid-October to early December)[6]
**Waitlist:** No waitlist mentioned; appointments available via phone[1][2][4][5]

**Watch out for:**
- Not an insurance provider or sales program—counselors are independent volunteers not affiliated with insurers[1][2][4][8]
- Busy during Medicare Open Enrollment (mid-October to early December), so call early[6]
- Free service, not financial aid or direct healthcare—focuses on education and assistance[2][7]
- Available to anyone with Medicare questions, not just seniors[6]

**Data shape:** no income/asset test; counseling service via statewide volunteer network through Area Agencies on Aging; part of federal SHIP program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick

---

### Kansas Senior Nutrition Program (Home-Delivered and Congregate Meals)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified; open to all individuals 60+ and spouses. Local providers may have additional criteria—contact them directly.[2]
- Assets: No asset limits mentioned.[2]
- Spouses of individuals 60+ are eligible regardless of age.[2]
- Program volunteers are eligible for congregate meals.[2]
- For home-delivered: Typically requires homebound status or functional impairment, but contact local provider for exact assessment.[2]

**Benefits:** Nutritious meals in group/congregate settings or home-delivered to residence; nutrition education on food choices, physical activity, and health conditions.[2]

**How to apply:**
- Phone: Local Aging and Disability Resource Center at 855-200-ADRC (2372)[2]
- Phone: KDADS at 785-296-0373[2]
- Email: KDADSOAASCA@ks.gov[2]
- Mail: Kansas Department for Aging and Disability Services, Attention: Long Term Services & Supports, 503 S. Kansas Ave., Topeka, KS 66603-3404[2]
- In-person: Local Aging and Disability Resource Center or provider for registration and assessment[2]

**Timeline:** Not specified; varies by local provider.[2]
**Waitlist:** Possible depending on local capacity; contact provider.[2]

**Watch out for:**
- No statewide income test, but local providers determine full eligibility including homebound status for delivery—always confirm locally.[2]
- Spouses qualify regardless of age, unlike some programs requiring 60+ for all.[2]
- Funded under Older Americans Act; availability tied to federal/local funding and capacity.[2]
- Distinct from Kansas Senior Farmers Market Nutrition Program, which has strict 185% FPL income limits and provides produce coupons only.[1][3]

**Data shape:** No income or asset limits statewide; priority on age 60+ and spouses; delivered via 15 local Area Agencies on Aging with potential regional capacity differences; requires local assessment for home-delivered.

**Source:** https://www.kdads.ks.gov/services-programs/aging/kansas-senior-nutrition-program[2]

---

### Caregiver Support Programs


**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned in sources; eligibility often tied to Medicaid waivers requiring nursing facility level of care. General KanCare guidelines exist but not detailed for caregivers.[4]
- Assets: Not specified; no asset tests detailed for caregiver support programs.[1][2]
- Caregivers of individuals 60+ or grandparents 60+ caring for grandchildren under 18.[2]
- Family member or informal caregiver 18+ providing care, often for those meeting nursing facility level of care (e.g., frail elderly 65+, physical disabilities 16-64, I/DD 5+).[1]
- For K-RAD: Care for individual with probable Alzheimer's/dementia, limited access to other supports.[5]

**Benefits:** Respite care, personal care, homemaker services, support services; K-RAD subsidizes up to $1,000/year per care recipient for respite (paid to provider).[5][6] Specifics vary by waiver (e.g., HCBS for frail elderly).[1]
- Varies by: priority_tier|region

**How to apply:**
- Phone: Kansas Aging and Disability Resource Center at 1-855-200-2372 (ADRC).[7][8]
- Email for K-RAD: donalds@eckaaa.org with two required forms (not named).[5]
- Contact local Area Agency on Aging, e.g., Northeast Kansas (nekaaa.org), East Central (785-242-7200).[2][5]

**Timeline:** K-RAD: Processed in order received; funds first-come, first-served (fiscal year July-June).[5]
**Waitlist:** Funding limited, no awards guaranteed; potential wait if funds exhausted.[5]

**Watch out for:**
- Not a single program but network of waivers (e.g., Frail Elderly, I/DD) and local AAA services; requires nursing facility level of care determination.[1]
- Funding limited (e.g., K-RAD $1,000 cap, first-come).[5]
- Often requires enrollment in Medicaid/KanCare; spouses/family may qualify but need to live with care recipient and pass checks.[1]
- Varies county-to-county; contact local AAA essential.[6]

**Data shape:** Decentralized by Area Agencies on Aging and waivers; no uniform income/asset tables; ties to Medicaid level of care; regional providers and limited funding pools.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.kdads.ks.gov/services-programs/aging/caregivers

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[2][6]. The search results do not provide specific dollar amounts or household-size tables. Families should contact their local provider to determine their exact income threshold based on household composition.
- Assets: Not specified in available sources
- Must be unemployed[2][6]
- Must have poor employment prospects[2][6]
- Enrollment priority given to: veterans and qualified spouses, individuals over 65, those with disabilities, those with low literacy skills or limited English proficiency, rural residents, homeless or at-risk individuals, and those with low employment prospects or prior unsuccessful American Job Center usage[2]

**Benefits:** Paid work averaging 20 hours per week at the highest of federal, state, or local minimum wage[2]. On-the-job training in computer or vocational skills, work experience for résumé, professional job placement assistance, and supportive services including dental, vision, clothing, and transportation assistance[3][7]
- Varies by: fixed

**How to apply:**
- Phone: Wichita Workforce Center at (316) 771-6750[5]
- Phone: Jobs for Progress National (SER National)[5]
- In-person: Wichita Workforce Center, 2021 N. Amidon, #1100, Wichita, KS 67203[5]
- Online: AARP Foundation locator at https://my.aarpfoundation.org/locator/scsep/ to find local programs[8]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limit is strict: 125% of federal poverty level, not higher[2][6]. Families must verify exact dollar threshold for their household size before applying.
- Program is subsidized training, not permanent employment. It serves as a bridge to unsubsidized employment[2][7]. Participants should expect to transition to regular jobs after training.
- Only 20 hours per week on average[2][7]—this is part-time work, not full-time employment.
- Enrollment priority system means some applicants may wait longer than others depending on their circumstances (age, veteran status, disability, etc.)[2].
- Multiple providers operate SCSEP in Kansas (SER, AARP, others through WorkforceONE). The specific provider and services available may vary by location.
- Program requires participants to be unemployed and have poor employment prospects[2][6]—those with recent employment or strong job prospects may not qualify.
- Digital literacy training is now a component of some SCSEP programs, particularly through AARP Foundation[4], but availability varies by provider.

**Data shape:** SCSEP in Kansas is administered through multiple state and national nonprofit providers rather than a single centralized system. Income eligibility is pegged to federal poverty guidelines (125% threshold) but specific dollar amounts are not published in these sources and must be obtained from local providers. The program prioritizes certain populations (veterans, seniors over 65, disabled individuals, rural residents) which may affect application processing. No information is available on processing times, waitlists, or required documentation. Families must contact their local provider directly for application specifics.

**Source:** https://www.kansascommerce.gov/program/workforce-services/state-of-kansas-senior-employment-services/

---

### Kansas Legal Services (Legal Aid for Seniors)


**Eligibility:**
- Age: 60+
- Income: No specific income limits stated for core senior programs like the Senior Citizen Law Project (SCLP) or Elder Law Hotline; priority given to vulnerable elderly in greatest social and economic need. General KLS services target low and moderate income based on household size, but exact dollar amounts or tables not provided in sources.
- Assets: No asset limits specified for senior legal aid programs. (Note: Separate Medicare Extra Help asset limits mentioned—$14,610 single/$29,160 married—but not applicable to KLS senior legal services; excludes home, vehicles, personal possessions, life insurance, burial plots/contracts, back payments.)
- Kansas resident
- Civil legal issues only (no criminal cases)
- Priority for at-risk elderly needing cash/medical assistance, abuse prevention, estate planning

**Benefits:** Advice, document preparation, limited case representation, legal consultations on estate planning, advance directives, powers-of-attorney, living wills, consumer advocacy, public benefits access, elder abuse prevention; Elder Law Hotline provides free legal advice (no drafting pleadings or full representation); public education on elders' rights.
- Varies by: priority_tier

**How to apply:**
- Phone: Elder Law Hotline 1-888-353-5337 or 316-267-3975 (Mon-Fri 8am-4:30pm)
- Online: https://www.kansaslegalservices.org/online-application (Mon 8am-Thu 4:30pm)
- General KLS intake: 1-800-723-6953
- In-person: Johnson County sites only (Roeland Park Community Center 913-826-3160; Matt Ross Community Center 913-826-2830; Sunset Drive Office Building 913-715-8860) for local consultations

**Timeline:** Intake specialist contacts within 24 hours to 2-3 business days; further eligibility questions asked.
**Waitlist:** Services subject to availability of funding; no specific waitlist details.

**Watch out for:**
- Elder Hotline provides advice only—no document drafting or court representation; may need to seek private attorney afterward.
- Services subject to funding availability; priority to most vulnerable.
- No criminal cases; civil only.
- Intake asks detailed financial/opposing party info.
- Johnson County in-person limited to specific sites/appointments.

**Data shape:** No fixed income/asset tests for seniors (unlike general KLS); priority-based on vulnerability; hotline statewide with no eligibility barriers beyond age/residency; local in-person varies (e.g., 3 Johnson County centers); services limited scope (advice/document prep, not full representation).

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.kansaslegalservices.org/page/57/programs-seniors

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents and prospective residents of long-term care facilities regardless of financial status[1][4][5]
- Assets: No asset limits or tests apply[1][4]
- Must be a resident (or prospective resident) of a long-term care facility in Kansas, including nursing homes, assisted living facilities, board and care homes, home plus facilities, adult day care centers, or residential healthcare facilities[4][5][7]

**Benefits:** Identify, investigate, and resolve complaints; provide information on long-term care services and resident rights; advocate for improvements in quality of life and care; represent interests before agencies; ensure access to services; handle issues from daily care to food service while protecting privacy and confidentiality[1][3][4][7]

**How to apply:**
- Phone: Toll-free 1-877-662-8362 or local (785) 296-3017[1][6]
- Email: LTCO@ks.gov[1]
- Website: https://www.ombudsman.ks.gov to find regional ombudsman or submit concerns[1][6][8]
- In-person: Contact regional ombudsman offices via https://www.ombudsman.ks.gov/find-your-ombudsman[8]

**Timeline:** Not specified; services provided as needed without formal processing[1][3]

**Watch out for:**
- Not a financial aid or direct service program—provides advocacy only, not healthcare, housing, or payments[1][3][4]
- Distinct from KanCare Ombudsman, which handles Medicaid issues[4]
- Anyone can contact (residents, families, staff, community members)—no 'qualification' process[4][5]
- Volunteering requires training and checks, but receiving services does not[1]

**Data shape:** no income test; advocacy services only for long-term care facility residents; regional delivery model; open to all without application

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ombudsman.ks.gov[8]

---

### Senior Care Act Services

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Adjusted annually in July; exact dollar amounts not specified in available data but based on income and assets via sliding fee scale. No full table by household size provided.
- Assets: Evaluated alongside income for sliding fee scale; specific limits or exemptions not detailed. Services cost shared based on ability to pay, ranging from donation to 100% of cost.
- Kansas resident
- Meet SCA functional threshold score based on functional assessment (evaluates ADLs like toileting/bathing, IADLs like meal prep/shopping, and cognitive deficits)
- Functional limitations in self-care and independent living but able to reside in community with services

**Benefits:** In-home services including attendant care, respite care, homemaker, chore services, adult day care; plan of care developed post-assessment; self-direction allowed for attendant care or homemaker (can choose family/friend as caregiver); provided on sliding fee scale.
- Varies by: region

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA) at 855-200-2372 for services in your area
- In-person: Through one of 11 AAAs or local providers (e.g., Clay County via North Central Flint Hills AAA)

**Timeline:** Not specified

**Watch out for:**
- Services are not free—sliding fee scale based on income/assets (donation to 100% cost); not entitlement program
- Functional assessment required to qualify; dementia diagnosis alone insufficient
- Varies significantly by county/AAA—must contact local AAA for exact services available
- Early intervention focus, not long-term like Medicaid waivers; self-pay portion common
- Income guidelines change annually in July

**Data shape:** Administered regionally via 11 AAAs with county-specific services and providers; sliding fee scale ties benefits to income/assets; functional assessment drives plan of care; self-direction option unique for family/friend caregivers

**Source:** https://www.kdads.ks.gov/services-programs/aging/senior-care-act-sca

---

### Senior Citizen Law Project (SCLP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits. Program is designed to target seniors in 'greatest economic need' (generally interpreted as 125%-200% of federal poverty guidelines in some jurisdictions) and 'greatest social need,' but the search results do not provide specific dollar amounts or household-size tables for Kansas SCLP. The Elder Law Hotline component has no income eligibility requirement.[2][7]
- Assets: Not specified in available search results for SCLP. However, the program prioritizes low-income and at-risk seniors.[2]
- Kansas residency[4]
- Greatest economic need (income at or below poverty line, or 125%-200% of federal poverty guidelines)[1]
- Greatest social need (physical/mental disabilities, language barriers, cultural/social/geographical isolation)[1]

**Benefits:** Legal counseling and referral at no cost; legal representation for certain court appearances, administrative negotiations, and drafting of legal documents. Specific focus areas include: obtaining cash and medical assistance, stopping financial/physical/psychological abuse of elders, elder rights education.[2][4]
- Varies by: priority_tier

**How to apply:**
- Phone: Kansas Legal Services main number 316-[specific extension not provided in search results][9]
- Phone: Elder Law Hotline (no income eligibility required)[7]
- In-person: Staff attorneys available to visit communities; at-home visits can be arranged[4]
- Contact local Area Agency on Aging (e.g., Northeast Kansas Area Agency on Aging for that region)[4]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- No income eligibility requirement for the Elder Law Hotline component, but SCLP itself targets those in greatest economic and social need—clarify which service applies to your situation.[2][7]
- Search results do not provide specific dollar amounts for income thresholds, household-size tables, or asset limits—you must contact the program directly for precise eligibility determination.
- Processing time and waitlist information not available in search results; contact the program to understand current delays.
- Program is designed to help low-income, isolated, and/or institutionalized older persons, but even those not meeting strict criteria may receive consultation.[5]
- The program prioritizes cases involving elder abuse, healthcare access, and financial assistance—other legal matters may have lower priority or be referred elsewhere.

**Data shape:** SCLP eligibility is based on 'greatest economic need' and 'greatest social need' rather than strict income cutoffs. The program is statewide but delivered through regional Area Agencies on Aging. The Elder Law Hotline (a related but distinct service) has no income test and serves as an entry point. Specific dollar amounts, household tables, asset limits, processing times, and detailed application procedures are not provided in the available search results and require direct contact with Kansas Legal Services or local Area Agencies on Aging.

**Source:** https://www.kansaslegalservices.org/page/57/programs-seniors

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| KanCare Frail Elderly Waiver (FE Waiver) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (MSP) includin | benefit | federal | deep |
| Food Assistance (SNAP) | benefit | federal | deep |
| Low-Income Energy Assistance Program (LI | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Senior Health Insurance Counseling for K | resource | state | simple |
| Kansas Senior Nutrition Program (Home-De | benefit | state | deep |
| Caregiver Support Programs | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Kansas Legal Services (Legal Aid for Sen | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Senior Care Act Services | benefit | state | deep |
| Senior Citizen Law Project (SCLP) | resource | state | simple |

**Types:** {"benefit":9,"resource":4,"employment":1}
**Scopes:** {"state":7,"local":1,"federal":6}
**Complexity:** {"deep":10,"simple":4}

## Content Drafts

Generated 14 page drafts. Review in admin dashboard or `data/pipeline/KS/drafts.json`.

- **KanCare Frail Elderly Waiver (FE Waiver)** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Programs (MSP) including QMB, SLMB, QI** (benefit) — 5 content sections, 6 FAQs
- **Food Assistance (SNAP)** (benefit) — 3 content sections, 6 FAQs
- **Low-Income Energy Assistance Program (LIHEAP)** (benefit) — 3 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 2 content sections, 6 FAQs
- **Senior Health Insurance Counseling for Kansas (SHICK)** (resource) — 3 content sections, 6 FAQs
- **Kansas Senior Nutrition Program (Home-Delivered and Congregate Meals)** (benefit) — 3 content sections, 6 FAQs
- **Caregiver Support Programs** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 2 content sections, 6 FAQs
- **Kansas Legal Services (Legal Aid for Seniors)** (resource) — 3 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs
- **Senior Care Act Services** (benefit) — 2 content sections, 6 FAQs
- **Senior Citizen Law Project (SCLP)** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **individual_needs**: 1 programs
- **not_applicable — all participants receive the same comprehensive benefit package regardless of payment source[4]**: 1 programs
- **priority_tier**: 4 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **not_applicable**: 3 programs
- **priority_tier|region**: 1 programs
- **fixed**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **KanCare Frail Elderly Waiver (FE Waiver)**: No fixed income limit but patient liability of $2,982/month (2026); NFLOC via FAI assessment; statewide with waitlist due to slot limits; ties to underlying Medicaid eligibility
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE in Kansas is geographically restricted to three provider service areas, making location the primary eligibility barrier. No income/asset test for PACE itself, but funding source (Medicare/Medicaid vs. private pay) dramatically affects cost. Dual-eligible status is nearly universal among participants. Age 55-64 cohort faces additional disability verification requirement. All participants receive identical comprehensive benefit package regardless of payment source.
- **Medicare Savings Programs (MSP) including QMB, SLMB, QI**: State-administered with federal FPL-based tiers (QMB 100%, SLMB 120%, QI 135%); income/assets for individual/couple only (no larger household table); annual updates and QI caps create variability; local DCF application required, no central online portal.
- **Food Assistance (SNAP)**: Elderly/disabled exempt from gross income test; higher asset limit; deductions for medical/shelter uncapped for them; county-based application; benefits scale by household size and net income.
- **Low-Income Energy Assistance Program (LIHEAP)**: Income based on full household at address (not just applicant family); varies by income/size/fuel/dwelling/utility rates; seasonal app period ends late March; regional DCF processing.
- **Weatherization Assistance Program**: Statewide via KHRC with regional subgrantees; priority for SSI/TAF/LIEAP households; 15-year repeat restriction; income at 200% FPL or categorical eligibility; free services only after audit.
- **Senior Health Insurance Counseling for Kansas (SHICK)**: no income/asset test; counseling service via statewide volunteer network through Area Agencies on Aging; part of federal SHIP program
- **Kansas Senior Nutrition Program (Home-Delivered and Congregate Meals)**: No income or asset limits statewide; priority on age 60+ and spouses; delivered via 15 local Area Agencies on Aging with potential regional capacity differences; requires local assessment for home-delivered.
- **Caregiver Support Programs**: Decentralized by Area Agencies on Aging and waivers; no uniform income/asset tables; ties to Medicaid level of care; regional providers and limited funding pools.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP in Kansas is administered through multiple state and national nonprofit providers rather than a single centralized system. Income eligibility is pegged to federal poverty guidelines (125% threshold) but specific dollar amounts are not published in these sources and must be obtained from local providers. The program prioritizes certain populations (veterans, seniors over 65, disabled individuals, rural residents) which may affect application processing. No information is available on processing times, waitlists, or required documentation. Families must contact their local provider directly for application specifics.
- **Kansas Legal Services (Legal Aid for Seniors)**: No fixed income/asset tests for seniors (unlike general KLS); priority-based on vulnerability; hotline statewide with no eligibility barriers beyond age/residency; local in-person varies (e.g., 3 Johnson County centers); services limited scope (advice/document prep, not full representation).
- **Long-Term Care Ombudsman Program**: no income test; advocacy services only for long-term care facility residents; regional delivery model; open to all without application
- **Senior Care Act Services**: Administered regionally via 11 AAAs with county-specific services and providers; sliding fee scale ties benefits to income/assets; functional assessment drives plan of care; self-direction option unique for family/friend caregivers
- **Senior Citizen Law Project (SCLP)**: SCLP eligibility is based on 'greatest economic need' and 'greatest social need' rather than strict income cutoffs. The program is statewide but delivered through regional Area Agencies on Aging. The Elder Law Hotline (a related but distinct service) has no income test and serves as an entry point. Specific dollar amounts, household tables, asset limits, processing times, and detailed application procedures are not provided in the available search results and require direct contact with Kansas Legal Services or local Area Agencies on Aging.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Kansas?
