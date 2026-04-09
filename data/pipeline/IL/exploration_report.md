# Illinois Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 57s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 13 |
| New (not in our data) | 5 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 6 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Illinois Medicaid (AABD Medical for seniors/disabled)

- **income_limit**: Ours says `$1304` → Source says `$1,304` ([source](https://www.dhs.state.il.us/page.aspx?item=30370))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Comprehensive medical coverage including: doctor visits, hospital stays, prescription drugs, home health services, nursing home care, medical equipment (e.g., wheelchairs), mental health treatment, limited dental and vision for adults. May include long-term care like personal care assistance or adult day care if functional need met. Free or low-cost; pairs with AABD cash assistance for some.` ([source](https://www.dhs.state.il.us/page.aspx?item=30370))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.state.il.us/page.aspx?item=30370`

### PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$1304` → Source says `$2,901` ([source](https://hfs.illinois.gov/medicalproviders/pace.html))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `All-inclusive: primary care at PACE center, therapeutic recreation, restorative therapies, socialization, personal care, dining, home care, inpatient services (acute/long-term when needed), 24/7 care coordination; becomes sole source for Medicare/Medicaid services; no deductibles/copays for PACE-provided services (premium for Part D if no Medicaid)[1][3][5][7].` ([source](https://hfs.illinois.gov/medicalproviders/pace.html))
- **source_url**: Ours says `MISSING` → Source says `https://hfs.illinois.gov/medicalproviders/pace.html`

### Benefit Access Program (includes QMB, SLMB, QI Medicare Savings Programs)

- **income_limit**: Ours says `$1304` → Source says `$1,330` ([source](https://hfs.illinois.gov/ (Illinois HFS) or https://www.dhs.state.il.us/page.aspx?item=14172 (DHS QMB page); charts at https://ilaging.illinois.gov/content/dam/soi/en/web/aging/ship/documents/medicare-savings-program-chart.pdf[4]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB**: Pays Medicare Part A & B premiums, deductibles, coinsurance (including 20% Part B, extended hospital/SNF stays)[3][4][6][7]. **SLMB**: Pays Part B premiums only (backdated up to 3 months + application month)[4]. **QI-1**: Pays Part B premiums only (effective month after eligibility; annual renewal)[4][6][9]. QI auto-qualifies for Extra Help (low/no Rx costs, e.g., ≤$12.65/drug in 2026)[9]. Part B premium value: up to $164.90/month or $1,978.80/year[7].` ([source](https://hfs.illinois.gov/ (Illinois HFS) or https://www.dhs.state.il.us/page.aspx?item=14172 (DHS QMB page); charts at https://ilaging.illinois.gov/content/dam/soi/en/web/aging/ship/documents/medicare-savings-program-chart.pdf[4]))
- **source_url**: Ours says `MISSING` → Source says `https://hfs.illinois.gov/ (Illinois HFS) or https://www.dhs.state.il.us/page.aspx?item=14172 (DHS QMB page); charts at https://ilaging.illinois.gov/content/dam/soi/en/web/aging/ship/documents/medicare-savings-program-chart.pdf[4]`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **income_limit**: Ours says `$2000` → Source says `$15,060` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases (groceries at authorized retailers). Amount based on household size, net income, and deductions; e.g., maximum allotment for 2-person elderly/disabled household calculated as max allotment minus 30% of net income (example: $546 max - $131 = $415/month)[5]. Exact amount determined post-application.` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.state.il.us/page.aspx?item=30357`

### Senior Health Insurance Program (SHIP)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free counseling and education services. No direct financial payments to beneficiaries. Services include: one-on-one confidential counseling sessions[1], Medicare plan comparisons[3], claims assistance and filing organization[1], insurance policy analysis[1], screening for Medicare benefit programs and Extra Help eligibility[1], legal assistance or referrals for some programs[3], help managing medical bills[3], study guides for Medicare research[3]` ([source](https://ilaging.illinois.gov/ship.html[4]))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/ship.html[4]`

### Community Care Program (CCP) Home Delivered Meals

- **min_age**: Ours says `65` → Source says `60` ([source](https://ilaging.illinois.gov/programs/ccp.html))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered nutritious meals (at least 1/3 of daily recommended dietary allowances; minimum 5 meals per week in some areas; may include weekends/dinners; ethnically/culturally tailored options like Kosher, South Asian, Korean, Halal in select areas; dietitian-approved menus). Part of broader CCP in-home services including meal preparation assistance.` ([source](https://ilaging.illinois.gov/programs/ccp.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/programs/ccp.html`

### Illinois Caregiver Support Program (includes respite)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care (in-home, facility-based, group, overnight); information and assistance; counseling, support groups, caregiver training; supplemental services; specific examples include up to 180 hours in-home respite per program year (statewide except Cook County for certain programs), $500 emergency respite voucher[2][4][7][8].` ([source](https://ilaging.illinois.gov/programs/caregiver/program.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/programs/caregiver/program.html`

### Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://ilaging.illinois.gov/programs/ltcombudsman/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Complaint resolution (ranging from minor issues like cold food to serious matters including inadequate staffing, injuries, medication misuse, or abuse); regular presence visits to facilities; information and assistance; resident rights education; family council support; representation to policymakers` ([source](https://ilaging.illinois.gov/programs/ltcombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/programs/ltcombudsman/`

## New Programs (Not in Our Data)

- **Home Services Program (HSP) Waiver / Home and Community-Based Services Waiver for the Elderly** — service ([source](https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/IL (federal waiver factsheet); https://www.dhs.state.il.us/ (Illinois DHS)[4][5]))
  - Shape notes: Eligibility tied to NFLOC via DON tool; benefits fixed to narrow service list; income at 100% FPL for applicant only; statewide but local CCU assessments
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://dceo.illinois.gov/communityservices/utilitybillassistance/howtoapply.html and https://helpillinoisfamilies.com))
  - Shape notes: LIHEAP is a federally funded program administered by Illinois Department of Commerce & Economic Opportunity (DCEO) through local county agencies. Benefits are fixed as one-time payments (amount determined by agency based on household circumstances) rather than tiered. Income eligibility is uniform statewide at 60% of State Median Income but varies by household size. Application timing is priority-based with vulnerable populations getting early access. The program serves both homeowners and renters (with specific rent-to-income requirements for renters). Processing involves both online submission and local agency follow-up, creating potential for regional variation in wait times.
- **Illinois Home Weatherization Assistance Program** — service ([source](https://dceo.illinois.gov/communityservices/homeweatherization.html))
  - Shape notes: Administered via 100+ local CAAs with regional income tables and providers; priority-based waitlist; dual single/multi-family tracks; annual PY income updates tied to 200% FPL or 60% SMI; no fixed age req but elderly priority
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://ilaging.illinois.gov/programs/employ.html))
  - Shape notes: This program's structure is unique because it combines employment (paid work at minimum wage) with training and community service. Benefits are fixed (20 hours/week at minimum wage) rather than scaled by household size. Eligibility is income-based but uses a federal poverty threshold that changes annually, requiring families to verify current limits. The program is administered through a decentralized network of Area Agencies on Aging, meaning application processes and availability may vary by region. The search results lack specific dollar amounts for income limits, processing timelines, required documents, and detailed regional variations, requiring applicants to contact local agencies for complete information.
- **Illinois Legal Assistance for Seniors** — service ([source](https://ilaging.illinois.gov/programs/legalassistance.html))
  - Shape notes: Decentralized network of local AAAs and legal aid providers with varying income/asset thresholds (often expanded for seniors); no uniform statewide income table or fixed benefits; regional providers handle delivery

## Program Details

### Illinois Medicaid (AABD Medical for seniors/disabled)


**Eligibility:**
- Age: 65+
- Income: Countable income at or below 100% of the Federal Poverty Guidelines (FPG). For 2026: $1,304 per month for a single person; $1,763 per month for a couple. Income is counted differently for blind, disabled, or aged applicants. If higher, may qualify via spend-down program. SSI recipients automatically qualify. No full household size table available in sources; primarily for individuals or couples.[3][4][5]
- Assets: Countable resources under $17,500 for individuals. Exemptions include ABLE accounts and certain assets specified by the Department (e.g., primary home up to limits, one vehicle). What counts: cash, bank accounts, investments, non-exempt property. Spousal rules apply if one spouse applies.[3][4][5][6]
- Blind, disabled (meets Social Security adult disability definition), or 65+.
- Illinois resident.
- U.S. citizen or qualified non-citizen (e.g., lawful permanent resident meeting specific rules; some non-citizens eligible via programs like Health Benefits for Immigrant Seniors).
- SSI recipients or those qualifying for SSI/1619(b) automatically eligible; others must meet low income/resources.
- Functional need for services in some cases (e.g., ADLs for long-term care via Regular Medicaid/AABD).

**Benefits:** Comprehensive medical coverage including: doctor visits, hospital stays, prescription drugs, home health services, nursing home care, medical equipment (e.g., wheelchairs), mental health treatment, limited dental and vision for adults. May include long-term care like personal care assistance or adult day care if functional need met. Free or low-cost; pairs with AABD cash assistance for some.

**How to apply:**
- Online: Apply via Illinois Department of Human Services (IDHS) or HFS ABE portal (specific URL not in results; use dhs.state.il.us).
- Phone: Local IDHS office (find via dhs.state.il.us/page.aspx?item=30370).
- Mail/In-person: Local IDHS Family Community Resource Center.
- Note: Automatic if receiving SSI.

**Timeline:** Up to 45 days if aged or blind; up to 60 days if disabled.[8]
**Waitlist:** Entitlement program; no waitlist if eligible.[4]

**Watch out for:**
- Distinguish AABD Cash (income support) from AABD Medical (health coverage); many sources conflate but focus is Medical.
- Spend-down program for higher incomes often missed.[1][3]
- Non-citizens: Limited cash; use HBIS for seniors.[3][5]
- Estate recovery: HFS recovers costs from estate post-death.[8]
- Spousal income/assets counted differently; no Community Spouse Allowance for Regular AABD.[4]
- Automatic SSI link: Apply for SSI first if possible.
- 2026 limits current; FPG adjusts annually.

**Data shape:** Entitlement with SSI auto-qualify; strict $17,500 asset cap; income at 100% FPG with spend-down option; pairs with cash aid; functional needs for LTC services.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.state.il.us/page.aspx?item=30370

---

### Home Services Program (HSP) Waiver / Home and Community-Based Services Waiver for the Elderly

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 60-64 if physically disabled[1][4]+
- Income: Single applicant: up to $1,304 monthly (effective April 2025, equivalent to 100% FPL, updates annually in April). No table for household size specified; applies to applicant income[1]
- Assets: Not specified in available data; Medicaid financial eligibility criteria apply, including income/assets/home ownership considerations[1][2]
- Illinois resident and U.S. citizen or legal permanent resident[1][2]
- Require Nursing Facility Level of Care (NFLOC), determined by Determination of Need (DON) assessment evaluating Activities of Daily Living (ADLs) and Instrumental Activities of Daily Living (IADLs)[1][3]
- At risk of nursing home placement; services must cost equal to or less than institutional care[1][2]

**Benefits:** Adult day service, in-home service (homemaker for housecleaning, meal prep, etc.), automated medication dispenser, emergency home response system (personal emergency response), assistance with ADLs/IADLs like bathing, transportation, grocery shopping[1][3][4]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Care Unit (CCU) for DON assessment via Illinois Department on Aging or Department of Human Services[1][3]
- Phone: IDHS Help Line 1-800-843-6154 (TTY: 1-866-324-5553)[5]
- Aetna Better Health of Illinois (manages HCBS waivers): care coordinator may assist with DON[3]

**Timeline:** Not specified
**Waitlist:** Not specified in available data

**Watch out for:**
- Income limit updates annually in April (not January like standard FPL)[1]
- Must meet NFLOC via DON assessment, not just age/income[1][3]
- For 60-64: requires physical disability[1][4]
- Services limited to specific list; no broad healthcare[4]
- Managed by MCOs requiring legacy Medicaid ID for providers[8]

**Data shape:** Eligibility tied to NFLOC via DON tool; benefits fixed to narrow service list; income at 100% FPL for applicant only; statewide but local CCU assessments

**Source:** https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/IL (federal waiver factsheet); https://www.dhs.state.il.us/ (Illinois DHS)[4][5]

---

### PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; however, for full Medicaid coverage without premiums, must qualify for Medicaid (income under 300% of Federal Benefit Rate: $2,901/month for 2025; varies by state pathways). Dual Medicare/Medicaid eligibility common but not required[1][2][4].
- Assets: No asset limits for PACE enrollment; Medicaid qualification (if sought) limits assets to $2,000 (excluding primary home)[1].
- Live in the service area of an Illinois PACE organization (specific regions: West Chicago, South Chicago, Southern Cook County, Peoria, East St. Louis)[7][4].
- Certified by Illinois Department of Aging as needing nursing home level of care (DON score of 29+ via Community Health Assessment by Community Care Units)[4].
- Able to live safely in the community with PACE support[1][2][3][4].
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice[2][5].
- US citizen or legal resident for 5 years for Medicare (if applicable)[1].

**Benefits:** All-inclusive: primary care at PACE center, therapeutic recreation, restorative therapies, socialization, personal care, dining, home care, inpatient services (acute/long-term when needed), 24/7 care coordination; becomes sole source for Medicare/Medicaid services; no deductibles/copays for PACE-provided services (premium for Part D if no Medicaid)[1][3][5][7].
- Varies by: region

**How to apply:**
- Start with Illinois Department of Aging Community Care Unit (CCU) for initial assessment[4].
- Contact local PACE organization (search by zip code via HFS site)[7].
- Phone: Not specified in sources; use HFS or Aging Dept contacts for regions.
- Website: https://hfs.illinois.gov/medicalproviders/pace.html (zip code search, provider list)[7].

**Timeline:** Not specified; initial DON assessment by CCU, then PACE final determination[4].
**Waitlist:** Possible regional waitlists (not detailed; varies by PACE center capacity)

**Watch out for:**
- Not statewide—must live in one of 5 specific regions[7].
- Electing PACE makes it sole Medicare/Medicaid service source; disenroll anytime but lose regular benefits[3][6].
- Nursing home level of care required (DON 29+), but must still live safely in community[4].
- No Medicare Advantage/Part D/hospice while enrolled[2].
- Premiums for non-Medicaid enrollees (e.g., Part D drugs)[5].

**Data shape:** Limited to 5 regional PACE centers in Illinois; no direct income/asset test for enrollment (Medicaid pathways separate); DON assessment via state CCUs required; dual-eligible focused but open to private pay.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hfs.illinois.gov/medicalproviders/pace.html

---

### Benefit Access Program (includes QMB, SLMB, QI Medicare Savings Programs)


**Eligibility:**
- Income: These are Illinois-specific Medicare Savings Programs (MSPs) with tiered income limits based on 2026 Federal Poverty Level (FPL). Limits apply to countable monthly income and vary by program and household size (individual or couple). Full table for 2026 from official Illinois source[4]:
- **QMB (100% FPL)**: $1,330 individual, $1,803 couple
- **SLMB/SLIB (120% FPL)**: $1,596 individual, $2,164 couple
- **QI-1**: Income from SLMB levels up to approximately $1,715-$1,639 individual, $2,320-$2,218 couple (sources vary slightly; use IL chart[4][2][7])
Note: Limits change annually (every April); older sources show lower amounts (e.g., QMB $1,073 individual[3]). Must have Medicare Part A[3][5][7].
- Assets: 2026 limits: $9,950 individual, $14,910 couple for QMB, SLMB, QI-1[4][8][9]. What counts: Bank accounts, stocks, bonds (non-exempt resources). Exempt: Home, one car, personal belongings, burial plots, life insurance up to $1,500 face value, irrevocable burial trusts[2]. Illinois temporarily suspended asset test during public health emergency (pre-2026 status unclear)[2]; confirm current status.
- Must be enrolled in Medicare Part A (recent enrollees eligible from first month of Part A coverage)[5]
- Meet nonfinancial Medicaid requirements: Valid SSN, U.S. citizen/resident, Illinois resident[5]
- Age 65+ or under 65 if disabled and receiving Medicare (QDWI variant for working disabled under 65 who lost premium-free Part A)[1][6]
- Not residing in certain DHS facilities if age 22-64[5]
- QI-1 requires annual reapplication and is first-come, first-served with priority to prior recipients[6][9]

**Benefits:** **QMB**: Pays Medicare Part A & B premiums, deductibles, coinsurance (including 20% Part B, extended hospital/SNF stays)[3][4][6][7]. **SLMB**: Pays Part B premiums only (backdated up to 3 months + application month)[4]. **QI-1**: Pays Part B premiums only (effective month after eligibility; annual renewal)[4][6][9]. QI auto-qualifies for Extra Help (low/no Rx costs, e.g., ≤$12.65/drug in 2026)[9]. Part B premium value: up to $164.90/month or $1,978.80/year[7].
- Varies by: priority_tier

**How to apply:**
- Online: Illinois Application for Benefits Eligibility (ABE) at abe.illinois.gov[8]
- Phone: ABE Customer Call Center at 1-800-843-6154 or DHS local office[8]; Social Security at 1-800-772-1213 (TTY: 1-800-325-0778) to confirm Part A[7]
- Mail/In-person: Local DHS Family Community Resource Center (find via dhs.state.il.us); forms like HFS 3352 (QMB brochure/application info)[3]

**Timeline:** QMB: Effective month after eligibility determination[4]; SLMB: Application month + up to 3 months backdated[4]; QI-1: Varies by first-come priority[6]
**Waitlist:** QI-1 has limited funding; first-come, first-served with priority to prior year recipients—may have waitlist if funds exhausted[6][9]

**Watch out for:**
- Tiered programs: Too high income for QMB? Check SLMB/QI-1 (common miss)[6]
- QI-1 annual reapplication + funding limits (not automatic; may lose if late)[6][9]
- Asset test may apply post-emergency (IL suspended temporarily; verify)[2]
- Must have Part A first; recent enrollees wait until coverage starts[5]
- Income/assets countable (e.g., exclude home/car, but count savings); limits update yearly[4]
- No eligibility if 22-64 in certain DHS facilities[5]
- Conflicting older limits in sources—use 2026 IL chart[4] for accuracy

**Data shape:** Tiered by income brackets (QMB <100% FPL, SLMB 120% FPL, QI-1 higher); benefits narrow by tier (QMB fullest, QI-1 Part B only); statewide but local DHS offices; QI-1 first-come/annual; asset exemptions standard federal MSP

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hfs.illinois.gov/ (Illinois HFS) or https://www.dhs.state.il.us/page.aspx?item=14172 (DHS QMB page); charts at https://ilaging.illinois.gov/content/dam/soi/en/web/aging/ship/documents/medicare-savings-program-chart.pdf[4]

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with elderly (60+) or disabled members in Illinois, the gross income limit is 200% of the Federal Poverty Level (FPL). Specific 2025 annual limits include $15,060 for one person or $20,440 for two people (monthly equivalents apply). Limits scale by household size; use the official calculator for exact figures as they adjust annually (e.g., Oct 1, 2025–Sept 30, 2026 federal tables apply). Net income is calculated after deductions including 20% earned income, standard deduction ($205 for ≤3 people, $219 for ≥4), dependent care, excess medical costs over $35/month for elderly/disabled, shelter costs, and child support[1][3][4][5][6].
- Assets: Households with elderly (60+) or disabled members have a resource limit, typically up to $4,500 (federal standard; confirm via state calculator). Exempt assets include primary home, most retirement savings, and certain vehicles. Countable resources are cash, bank accounts, and non-exempt property[1][4].
- Illinois resident
- U.S. citizen or qualified non-citizen
- Social Security number (or proof of application)
- Able-bodied adults must register for work (exceptions for elderly/disabled)
- Household includes those who buy/prepare food together; all adults must be elderly/disabled for simplified redetermination (EDSRP)[2][3]

**Benefits:** Monthly EBT card benefits for food purchases (groceries at authorized retailers). Amount based on household size, net income, and deductions; e.g., maximum allotment for 2-person elderly/disabled household calculated as max allotment minus 30% of net income (example: $546 max - $131 = $415/month)[5]. Exact amount determined post-application.
- Varies by: household_size

**How to apply:**
- Online: https://www.dhs.state.il.us/page.aspx?item=30357 or https://fscalc.dhs.illinois.gov/FSCalc/ (eligibility calculator)
- Phone: Local IDHS office (find via dhs.state.il.us) or 1-800-843-6154 (general SNAP line)
- Mail: Send application to local IDHS Family Community Resource Center
- In-person: Local IDHS offices (locate via https://www.dhs.state.il.us/page.aspx?item=146792)

**Timeline:** Typically 30 days; expedited within 7 days if very low income/no assets

**Watch out for:**
- Social Security, pensions, and VA benefits count as income[1]
- Must include all who buy/prepare food together in household[3]
- Elderly/disabled get higher gross income limit (200% FPL vs. 165%) and medical/shelter deductions often missed[3][4]
- New 2025 federal rules may affect work requirements for ages 55-64 without dependents[3][5][9]
- Only half of eligible seniors enroll; simplified recertification for elderly/disabled via EDSRP[1][2]

**Data shape:** Benefits and eligibility scale by household size with special higher income/resource rules and deductions for elderly (60+) or disabled; statewide but local offices handle applications; income tests both gross (200% FPL for elderly/disabled) and net

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.state.il.us/page.aspx?item=30357

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household's combined gross income (before taxes) for the 30 days prior to application must be at or below 60% of the State Median Income[3][6]. Income limits vary by household size. For Illinois, examples include: 1 person: $3,332/month; 2 people: $4,357/month[2]. These figures are based on Federal Poverty Guidelines and the state reserves the right to adjust based on federal appropriations[4].
- Assets: Missouri applicants must have $3,000 or less in bank accounts, investments, or retirement accounts[1]. Illinois search results do not specify asset limits.
- Be an Illinois resident[1]
- Be a U.S. citizen or be legally admitted for permanent residence[1]
- Live in the household and be responsible for paying the utility bill[1]
- Must be over 18 and included on the application[1]
- For renters: heat and/or electric must be included in the rent, and rent must be greater than 30% of total household income[4][5]
- Bills must be in the name of the person applying[5]

**Benefits:** One-time lump sum payment provided directly to the customer's utility company[5]. LIHEAP funds do not need to be paid back[4]. Assistance covers heat, gas, propane, and electricity[2]. May also provide assistance with furnace repairs or replacement for homeowners who are income-eligible and current on mortgage and taxes[5].
- Varies by: household_size

**How to apply:**
- Online: Visit helpillinoisfamilies.com to fill out and submit a Request for Services form[3]
- Phone: Call 833.711.0374 for more information[4]
- In-person or mail: Contact your local county agency (use agency finder tool at Ameren.com or DCEO website)[1][3]

**Timeline:** After submitting your Request for Services form online, await an email or phone call from your local agency to review and confirm eligibility and determine benefit amount. If you haven't heard from your county agency after 3 weeks, contact them directly[3]. If you have a disconnect notice or are already disconnected from heat-related gas/electric, call your county agency directly[3].
**Waitlist:** Application season is staggered: Beginning October 1, 2025, older adults (age 60+), individuals with disabilities, families with children age 5 and under, and households disconnected or facing imminent disconnection can apply. Beginning November 1, 2025, all other income-eligible households can apply[3][4].

**Watch out for:**
- Income is calculated as gross income (before taxes) for the 30 days prior to application, not annual income[3][6]
- For renters, utilities must be included in the rent AND rent must exceed 30% of income to qualify—both conditions must be met[4][5]
- Application season is staggered: vulnerable populations (seniors 60+, disabled, families with young children, disconnected households) can apply starting October 1, but everyone else must wait until November 1[3][4]
- If facing imminent utility disconnection, call your county agency directly rather than waiting for online processing[3]
- CSBG and LIHEAP have different income eligibility limits—don't confuse them[2]
- Bills must be in the applicant's name; you cannot apply for someone else's utility bill[5]
- The program provides a one-time lump sum payment, not ongoing monthly assistance[5]
- Funds are provided directly to the utility company, not to the household[5]
- State can adjust income limits based on federal appropriations availability[4]

**Data shape:** LIHEAP is a federally funded program administered by Illinois Department of Commerce & Economic Opportunity (DCEO) through local county agencies. Benefits are fixed as one-time payments (amount determined by agency based on household circumstances) rather than tiered. Income eligibility is uniform statewide at 60% of State Median Income but varies by household size. Application timing is priority-based with vulnerable populations getting early access. The program serves both homeowners and renters (with specific rent-to-income requirements for renters). Processing involves both online submission and local agency follow-up, creating potential for regional variation in wait times.

**Source:** https://dceo.illinois.gov/communityservices/utilitybillassistance/howtoapply.html and https://helpillinoisfamilies.com

---

### Illinois Home Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household combined gross income at or below 200% of the federal poverty level (PY2026 guidelines). Priority for households with elderly (60+), disabled members, children 5 or under, high energy users, or LIHEAP recipients in last 12 months. Also eligible if household member received SSI, AABD, TANF, or Title IV/XVI cash assistance in prior 12 months. Examples (varies by source/region/PY): CUB table - 1: $25,520; 2: $34,480; 3: $43,440; 4: $52,400; 5: $61,360; 6: $70,320. CCI (Kane/DeKalb WAP): 1: $27,180; 2: $36,620; etc. DCEO: For each over 12 add $11,000 at 200%; 60% SMI add $2,307 per additional over 12. Check current via local agency as guidelines update annually.
- Assets: No asset limits mentioned across sources.
- Household must not have received IHWAP services in last 15 years (some agencies)
- Home must be structurally sound
- Single family: owner-occupied up to 4 units; Multi-family: 66% units occupied by income-eligible tenants (or 50% in some cases), entire building applies
- LIHEAP recipient in last 12 months qualifies without full income check (some regions)

**Benefits:** Free in-home energy efficiency and health/safety upgrades: air sealing, attic/wall insulation, HVAC repair/replacement, water heater repair/replacement, electric base load reduction (lighting/refrigerator replacement), ventilation/moisture control, other health/safety measures. Max $20,000 per home for energy work (updated from prior $15,000); max $4,000 for health/safety (updated from $3,500). Includes home inspection, licensed contractor work, final inspection, 1-year warranty.
- Varies by: priority_tier

**How to apply:**
- Phone: 1-877-411-WARM (1-877-411-9276) to find local agency
- Online pre-application: DCEO portal (via cedaorg.net or dceo.illinois.gov)
- Phone regional: e.g., 847-697-8800 (Kane/DeKalb), 1-800-571-2332 (CEDA)
- Email/form: e.g., Weatherization Interest Form (cci-hci.org for Kane/DeKalb)
- In-person/partner intake sites via local community action agencies

**Timeline:** Several months for review after pre-application submission
**Waitlist:** Yes; priority households (elderly 60+, disabled, children 5-, high energy, LIHEAP) served first; non-priority may wait or not receive in application year if funding limited

**Watch out for:**
- Not automatic; pre-app review takes months, priority tiers mean elderly households go first but still may wait
- Home must be structurally sound and not weatherized in last 15 years
- Multi-family requires 66% (or 50%) eligible tenants, entire building applies
- Income guidelines update yearly (PY2026 specific); verify with local CAA as tables differ slightly
- Owner consent needed for rentals; no windows typically eligible
- Funding limited; eligible non-priority households may be deferred to next year

**Data shape:** Administered via 100+ local CAAs with regional income tables and providers; priority-based waitlist; dual single/multi-family tracks; annual PY income updates tied to 200% FPL or 60% SMI; no fixed age req but elderly priority

**Source:** https://dceo.illinois.gov/communityservices/homeweatherization.html

---

### Senior Health Insurance Program (SHIP)


**Eligibility:**
- Income: Not specified in available sources. SHIP serves Medicare beneficiaries and their caregivers; some financial assistance programs within SHIP (like Extra Help for Part D) have income thresholds, but specific dollar amounts are not provided in search results.
- Assets: Not specified in available sources. Extra Help for Part D coverage mentions 'limited income and resources' but specific asset limits are not detailed.
- Must be a current Medicare beneficiary or 'new' to Medicare[1]
- Can also serve family members and caregivers of Medicare beneficiaries[3]
- Includes Medicare beneficiaries under 65 with disabilities[7]
- Includes individuals dually eligible for Medicare and Medicaid[7]

**Benefits:** Free counseling and education services. No direct financial payments to beneficiaries. Services include: one-on-one confidential counseling sessions[1], Medicare plan comparisons[3], claims assistance and filing organization[1], insurance policy analysis[1], screening for Medicare benefit programs and Extra Help eligibility[1], legal assistance or referrals for some programs[3], help managing medical bills[3], study guides for Medicare research[3]
- Varies by: not_applicable — SHIP provides counseling services, not tiered financial benefits

**How to apply:**
- Phone: Senior HelpLine 1-800-252-8966[2]
- Email: Aging.SHIP@illinois.gov[2]
- In-person: Through Area Agency on Aging (AAA) network offices throughout Illinois[2]
- Website: https://ilaging.illinois.gov/ship.html[2]
- In-person appointments: Services available 'by appointment only through the Senior Services offices'[1]

**Timeline:** Not specified in available sources. Program operates year-round[2]
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- SHIP is a counseling and assistance program, NOT an insurance plan itself — it does not provide direct healthcare coverage or financial payments[1][5]
- SHIP counselors are not affiliated with any insurance company and do not sell insurance[1][5] — they provide objective, unbiased guidance
- Services are available 'by appointment only'[1] — walk-ins may not be accommodated
- While SHIP can screen for Extra Help (Part D) and Medicaid programs, actually qualifying for these programs requires separate applications with specific income/asset thresholds that are not detailed in SHIP materials
- Search results do not provide specific income or asset limits for SHIP eligibility itself, only mention that some programs within SHIP's scope (like Extra Help) have 'limited income and resources' requirements[1]
- No information provided about processing times, waitlists, or how quickly counseling appointments can be scheduled

**Data shape:** SHIP is fundamentally different from direct-benefit programs — it is a free counseling and advocacy service, not a financial assistance program. Eligibility is based on Medicare status, not income or assets. The program's value lies in helping beneficiaries navigate complex Medicare options and identify other programs they may qualify for. Income and asset limits apply to programs SHIP helps people access (like Extra Help, Medicaid, Medicare Savings Program), not to SHIP itself. Services are delivered through a statewide network of Area Agency on Aging offices, but specific regional variations are not documented in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/ship.html[4]

---

### Community Care Program (CCP) Home Delivered Meals


**Eligibility:**
- Age: 60+
- Income: Monthly income below federal poverty level for free services; above that, services cost based on income level, service needs, costs, and CCP fee schedules (certain income excluded; exact dollar amounts not specified in sources, varies by household including spouse). No full table provided.
- Assets: Non-exempt assets of $17,500 or less. Exempt: home and furnishings, car (not recreational vehicles), personal clothing and effects, prepaid burial plan, burial plots and markers.
- Illinois resident
- U.S. citizen or eligible non-citizen (e.g., lawful permanent resident)
- Assessed need for long-term care via Determination of Need (DON) assessment (minimum score of 29; higher score allows more services; at risk for nursing facility placement)
- Apply for and enroll in Medicaid if eligible

**Benefits:** Home-delivered nutritious meals (at least 1/3 of daily recommended dietary allowances; minimum 5 meals per week in some areas; may include weekends/dinners; ethnically/culturally tailored options like Kosher, South Asian, Korean, Halal in select areas; dietitian-approved menus). Part of broader CCP in-home services including meal preparation assistance.
- Varies by: region

**How to apply:**
- Contact local Care Coordination Unit or Area Agency on Aging (AAA) for assessment and referral
- If in Managed Care Organization (MCO), contact MCO case manager for assessment and referral
- Use AgeOptions referral webpage (e.g., https://services.ageoptions.org/) for suburban Cook County: select 'Community Care Program/In-home services/Home Delivered Meals'
- Contact Illinois Department on Aging or local AAA via map tool at https://ilaging.illinois.gov/programs/nutrition/nutrition.html

**Timeline:** Not specified
**Waitlist:** Not specified; may vary regionally

**Watch out for:**
- Home-delivered meals are a component of CCP, requiring full CCP eligibility including DON assessment and Medicaid application—not standalone
- Income above poverty level means participant pays fees based on fee schedules, not free
- Must be at risk for nursing home placement (DON score ≥29); higher scores unlock more services
- Assets strictly limited to $17,500 non-exempt; common exemptions often missed
- Regional differences in meal types, schedules, and providers—contact local AAA essential
- Separate from pure Nutrition Program; CCP targets those needing long-term care alternatives

**Data shape:** Tied to full CCP eligibility with asset cap and DON scoring; benefits vary by region/provider for meal types/schedules; no fixed income table or statewide uniform processing; requires local AAA/CCU assessment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/programs/ccp.html

---

### Illinois Caregiver Support Program (includes respite)


**Eligibility:**
- Age: 60+
- Income: No specific dollar amounts or household size table provided in sources; eligibility assessed by local Area Agencies on Aging (AAAs) without detailed income thresholds listed[2][7][8].
- Assets: No asset limits or exemptions detailed in sources.
- Family caregiver (adult family member or partner) providing unpaid care to an adult 60+ or an adult/ child with Alzheimer's or related disorders living in the community[8].
- Care receiver must have brain dysfunction, dementia, or be 60+ in some implementations[7].
- For respite components, often excludes those receiving HCBS Waiver services[3][4][5].

**Benefits:** Respite care (in-home, facility-based, group, overnight); information and assistance; counseling, support groups, caregiver training; supplemental services; specific examples include up to 180 hours in-home respite per program year (statewide except Cook County for certain programs), $500 emergency respite voucher[2][4][7][8].
- Varies by: priority_tier|region

**How to apply:**
- Contact local Area Agency on Aging (AAA) or Care Coordination Unit[2][7][8].
- Illinois Respite Coalition phone: 866-455-7377 (ext. 103 for Spanish)[4][5].
- Central Illinois example: Call (309)674-2071 for evaluation[7].
- Contact IDHS providers directly for specific respite types[3][5].

**Timeline:** Respite care provided in 90-day increments after eligibility determination; no general timeline specified[7].
**Waitlist:** Possible; local AAAs may run out of funds, leading to waitlists or exhaustion of respite hours[2].

**Watch out for:**
- Primarily for unpaid family caregivers of 60+ adults or those with Alzheimer's/related disorders; not for developmental disabilities unless through separate IDHS respite programs[3][4][8].
- Excludes those on HCBS waivers; local funding shortages cause waitlists or unavailability[2][3].
- Respite often limited (e.g., 180 hours/year, $500 emergency max); one-time for emergency vouchers[2][4].
- Regional exclusions like no in-home in Cook County for some programs[4].

**Data shape:** Administered via 13 regional Area Agencies on Aging with funding/waitlist variations; layered with separate IDHS respite for I/DD (non-waiver); no fixed income/asset tables published; eligibility ties to caregiver status and care receiver's age/condition.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/programs/caregiver/program.html

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[1][2]. The search results do not provide specific dollar amounts by household size, as these figures are set annually by the U.S. Department of Health and Human Services and vary year to year. Applicants should contact their local Area Agency on Aging for current income thresholds for their household size.
- Assets: Not specified in available search results.
- Must be unemployed[2][5]
- Must be capable of performing the tasks involved in the proposed community service assignment[2]
- Must be willing to provide community service and attend required meetings and training[6]
- Must be willing to develop a personalized Individual Employment Plan (IEP)[6]
- Must be willing to use all available resources that assist in job searches and economic self-sufficiency[6]
- Must actively be looking for employment[1]
- Must reside in a service area with available funding[6]

**Benefits:** Part-time work at minimum wage (typically 20 hours per week)[1][2][5]. Participants are paid the highest of federal, state, or local minimum wage[5]. In Illinois, the minimum wage referenced was $8.25 per hour[1], though this may have changed. Additionally, participants receive on-the-job training, personalized employment-related counseling, job-related skills training, and assistance in finding permanent unsubsidized employment[2]. Training may include upgrading existing skills, development of new skills, exposure to educational opportunities, and counseling and assistance in finding and keeping a job[2].
- Varies by: fixed

**How to apply:**
- Contact your local Area Agency on Aging[1]
- Contact the Illinois Department on Aging Senior HelpLine[1]
- In-person at local Area Agencies on Aging (specific locations not provided in search results)

**Timeline:** Not specified in available search results.
**Waitlist:** Not specified in available search results.

**Watch out for:**
- Income limits are set at 125% of the federal poverty level, which changes annually—families must verify current thresholds with their local Area Agency on Aging rather than assuming a fixed dollar amount[1][2].
- The program is part-time (typically 20 hours per week), not full-time employment[1][2].
- Participants must be actively looking for employment and willing to engage in job search activities; this is not a permanent subsidized job but a bridge to unsubsidized employment[1][2].
- Funding availability varies by service area and may not be available everywhere in Illinois at all times[6].
- Veterans and qualified spouses of veterans receive first priority for enrollment, followed by individuals over age 65[5]. This means non-veteran applicants may face longer wait times or reduced availability.
- The program requires participants to develop and commit to an Individual Employment Plan (IEP) and attend required meetings and training—it is not a passive income program[6].
- Participants work in community service or not-for-profit agencies, not private sector employers, during the training phase[2].

**Data shape:** This program's structure is unique because it combines employment (paid work at minimum wage) with training and community service. Benefits are fixed (20 hours/week at minimum wage) rather than scaled by household size. Eligibility is income-based but uses a federal poverty threshold that changes annually, requiring families to verify current limits. The program is administered through a decentralized network of Area Agencies on Aging, meaning application processes and availability may vary by region. The search results lack specific dollar amounts for income limits, processing timelines, required documents, and detailed regional variations, requiring applicants to contact local agencies for complete information.

**Source:** https://ilaging.illinois.gov/programs/employ.html

---

### Illinois Legal Assistance for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by provider; Prairie State Legal Services: generally <125% FPL, up to 200% FPL with certain expenses; Legal Aid Chicago: ≤150% FPL, higher for seniors/homeowners/veterans; older source: ≤$15,000 individual/$20,000 couple annually[2][3][4]
- Assets: Limited assets required (specific limits not detailed uniformly; assessed by local providers)[1][2][3][4]
- Illinois resident
- U.S. citizen, lawful permanent resident, or specific non-citizen categories (e.g., asylee, refugee, certain visa holders)
- Civil legal issue relevant to seniors (e.g., healthcare denials, housing, benefits)
- Typically low-income priority, but seniors often qualify under expanded guidelines[1][3][4][6]

**Benefits:** Free or reduced-fee civil legal assistance, including representation, advice, and advocacy on issues like Medicare/Medicaid denials, home care, housing, advance directives, long-term care, benefits appeals; no fixed dollar amounts or hours specified[6][8]
- Varies by: region

**How to apply:**
- Phone: Senior Helpline (800) 252-8966 or (888) 206-1327 (TTY) to find local AAA[1][6]
- Contact local Area Agency on Aging (AAA) via https://ilaging.illinois.gov/ map tool[6]
- Prairie State Legal Services: Online intake via Illinois Legal Aid site or local office phone (e.g., 815.965.2134)[3]
- Legal Aid Chicago: Online eligibility tool for seniors in Suburban Cook County (Elder Risk Detector)[4]

**Timeline:** Local agency decision within 30 days for related assessments (e.g., DON); legal aid screening upon contact[1]
**Waitlist:** Limited resources may cause delays or denial due to capacity; no formal statewide waitlist specified[3][7]

**Watch out for:**
- Not a single centralized program—must contact local AAA or provider; limited capacity means not everyone qualifies despite meeting criteria
- Focus on civil matters only (no criminal); seniors may need DON-like assessment for service need
- Income/asset guidelines vary and can be higher for seniors but still assessed case-by-case
- Must report changes if enrolled in related services[1][3][7]

**Data shape:** Decentralized network of local AAAs and legal aid providers with varying income/asset thresholds (often expanded for seniors); no uniform statewide income table or fixed benefits; regional providers handle delivery

**Source:** https://ilaging.illinois.gov/programs/legalassistance.html

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Resident of a long-term care facility in Illinois (nursing home, assisted living, or similar facility)
- OR prospective resident considering placement
- OR former resident
- No financial requirements to access services

**Benefits:** Complaint resolution (ranging from minor issues like cold food to serious matters including inadequate staffing, injuries, medication misuse, or abuse); regular presence visits to facilities; information and assistance; resident rights education; family council support; representation to policymakers

**How to apply:**
- Phone: 211 (statewide)
- Phone: 630-407-6500 (DuPage County example)
- Text: Send your zip code to 898211
- Mail: Long-Term Care Ombudsman Program, Illinois Department on Aging, One Natural Resources Way, Suite 100, Springfield, IL 62702-1271
- Email: Contact through Illinois Department on Aging website
- In-person: Regional ombudsman offices (contact through 211 or regional office)

**Timeline:** Not specified in available sources

**Watch out for:**
- This is NOT a financial assistance program — it provides advocacy and complaint resolution, not direct payment or services
- Eligibility is based on facility residency, not income or assets — anyone 60+ in a long-term care facility qualifies
- Ombudsmen can visit facilities anytime; facilities cannot prevent resident meetings with ombudsmen unless the resident refuses
- Facilities are required to post ombudsman contact information and resident rights posters
- The program also serves prospective residents considering placement and family members of current residents, not just current residents
- Complex complaints are referred to Regional Ombudsmen for escalation
- Program serves both older persons AND persons with disabilities (not age-restricted for disability-based eligibility)
- Volunteers also serve as ombudsmen (must be 18+, fingerprinted, and trained) — this is separate from accessing services

**Data shape:** This is a statewide advocacy program with no income/asset testing, no application forms, and no waitlist. Eligibility is binary (age 60+ in a long-term care facility = eligible). Services are uniform statewide but delivered through regional programs. The program is mandated by federal law (Older Americans Act) and state law (Illinois Act on Aging). Key distinction: this program advocates FOR residents; it does not provide direct services, financial assistance, or healthcare. Access is immediate upon contact — no processing time or approval needed.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/programs/ltcombudsman/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Illinois Medicaid (AABD Medical for seni | benefit | state | deep |
| Home Services Program (HSP) Waiver / Hom | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Benefit Access Program (includes QMB, SL | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Illinois Home Weatherization Assistance  | benefit | federal | deep |
| Senior Health Insurance Program (SHIP) | navigator | federal | simple |
| Community Care Program (CCP) Home Delive | benefit | state | deep |
| Illinois Caregiver Support Program (incl | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Illinois Legal Assistance for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"navigator":1,"employment":1,"resource":2}
**Scopes:** {"state":5,"local":1,"federal":7}
**Complexity:** {"deep":10,"simple":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/IL/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 2 programs
- **priority_tier**: 3 programs
- **region**: 3 programs
- **household_size**: 2 programs
- **not_applicable — SHIP provides counseling services, not tiered financial benefits**: 1 programs
- **priority_tier|region**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Illinois Medicaid (AABD Medical for seniors/disabled)**: Entitlement with SSI auto-qualify; strict $17,500 asset cap; income at 100% FPG with spend-down option; pairs with cash aid; functional needs for LTC services.
- **Home Services Program (HSP) Waiver / Home and Community-Based Services Waiver for the Elderly**: Eligibility tied to NFLOC via DON tool; benefits fixed to narrow service list; income at 100% FPL for applicant only; statewide but local CCU assessments
- **PACE (Program of All-Inclusive Care for the Elderly)**: Limited to 5 regional PACE centers in Illinois; no direct income/asset test for enrollment (Medicaid pathways separate); DON assessment via state CCUs required; dual-eligible focused but open to private pay.
- **Benefit Access Program (includes QMB, SLMB, QI Medicare Savings Programs)**: Tiered by income brackets (QMB <100% FPL, SLMB 120% FPL, QI-1 higher); benefits narrow by tier (QMB fullest, QI-1 Part B only); statewide but local DHS offices; QI-1 first-come/annual; asset exemptions standard federal MSP
- **Supplemental Nutrition Assistance Program (SNAP)**: Benefits and eligibility scale by household size with special higher income/resource rules and deductions for elderly (60+) or disabled; statewide but local offices handle applications; income tests both gross (200% FPL for elderly/disabled) and net
- **Low-Income Home Energy Assistance Program (LIHEAP)**: LIHEAP is a federally funded program administered by Illinois Department of Commerce & Economic Opportunity (DCEO) through local county agencies. Benefits are fixed as one-time payments (amount determined by agency based on household circumstances) rather than tiered. Income eligibility is uniform statewide at 60% of State Median Income but varies by household size. Application timing is priority-based with vulnerable populations getting early access. The program serves both homeowners and renters (with specific rent-to-income requirements for renters). Processing involves both online submission and local agency follow-up, creating potential for regional variation in wait times.
- **Illinois Home Weatherization Assistance Program**: Administered via 100+ local CAAs with regional income tables and providers; priority-based waitlist; dual single/multi-family tracks; annual PY income updates tied to 200% FPL or 60% SMI; no fixed age req but elderly priority
- **Senior Health Insurance Program (SHIP)**: SHIP is fundamentally different from direct-benefit programs — it is a free counseling and advocacy service, not a financial assistance program. Eligibility is based on Medicare status, not income or assets. The program's value lies in helping beneficiaries navigate complex Medicare options and identify other programs they may qualify for. Income and asset limits apply to programs SHIP helps people access (like Extra Help, Medicaid, Medicare Savings Program), not to SHIP itself. Services are delivered through a statewide network of Area Agency on Aging offices, but specific regional variations are not documented in available sources.
- **Community Care Program (CCP) Home Delivered Meals**: Tied to full CCP eligibility with asset cap and DON scoring; benefits vary by region/provider for meal types/schedules; no fixed income table or statewide uniform processing; requires local AAA/CCU assessment
- **Illinois Caregiver Support Program (includes respite)**: Administered via 13 regional Area Agencies on Aging with funding/waitlist variations; layered with separate IDHS respite for I/DD (non-waiver); no fixed income/asset tables published; eligibility ties to caregiver status and care receiver's age/condition.
- **Senior Community Service Employment Program (SCSEP)**: This program's structure is unique because it combines employment (paid work at minimum wage) with training and community service. Benefits are fixed (20 hours/week at minimum wage) rather than scaled by household size. Eligibility is income-based but uses a federal poverty threshold that changes annually, requiring families to verify current limits. The program is administered through a decentralized network of Area Agencies on Aging, meaning application processes and availability may vary by region. The search results lack specific dollar amounts for income limits, processing timelines, required documents, and detailed regional variations, requiring applicants to contact local agencies for complete information.
- **Illinois Legal Assistance for Seniors**: Decentralized network of local AAAs and legal aid providers with varying income/asset thresholds (often expanded for seniors); no uniform statewide income table or fixed benefits; regional providers handle delivery
- **Long-Term Care Ombudsman Program**: This is a statewide advocacy program with no income/asset testing, no application forms, and no waitlist. Eligibility is binary (age 60+ in a long-term care facility = eligible). Services are uniform statewide but delivered through regional programs. The program is mandated by federal law (Older Americans Act) and state law (Illinois Act on Aging). Key distinction: this program advocates FOR residents; it does not provide direct services, financial assistance, or healthcare. Access is immediate upon contact — no processing time or approval needed.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Illinois?
