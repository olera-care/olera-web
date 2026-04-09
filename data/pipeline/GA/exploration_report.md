# Georgia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 41s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 5 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 2 programs
- **employment**: 1 programs
- **advocacy**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Georgia Medicaid

- **income_limit**: Ours says `$994` → Source says `$2,982` ([source](https://medicaid.georgia.gov/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Nursing home care; home/community-based services (personal care, respite, adult day health); assisted living/personal care homes; physician visits, prescriptions, hospital stays, long-term supports via waivers (e.g., ICWP, Community Care Services Program, Money Follows the Person). Covers full nursing home costs after income contribution; no fixed dollar/hour limits specified, tailored to NFLOC needs[1][2][9].` ([source](https://medicaid.georgia.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.georgia.gov/`

### Senior SNAP (Senior Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `All household members must be 60 years or older before February 2, 2026; 66 years or older effective February 2, 2026. They must purchase and prepare meals together[1][3]` ([source](https://dfcs.georgia.gov/services/snap/senior-snap))
- **income_limit**: Ours says `$1982` → Source says `$1695` ([source](https://dfcs.georgia.gov/services/snap/senior-snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `SNAP benefits via EBT card for groceries; amount based on household net income (generally $100 more net income = $30 less benefits), minimum/maximum per federal SNAP scale` ([source](https://dfcs.georgia.gov/services/snap/senior-snap))
- **source_url**: Ours says `MISSING` → Source says `https://dfcs.georgia.gov/services/snap/senior-snap`

### Georgia LIHEAP (Low Income Home Energy Assistance Program)

- **income_limit**: Ours says `$3090` → Source says `$2,879` ([source](https://dfcs.georgia.gov/regular-home-energy-assistance/energy-assistance-eligibility-requirements))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating: minimum $350-$400, maximum $400 (seniors 60+ get maximum $400); Cooling: up to $500; Crisis: Winter up to $810, Summer up to $500. Payments made directly to utility vendor. One heating and one cooling benefit per program year. Amounts based on income, household size, fuel type, and funding.[3][7]` ([source](https://dfcs.georgia.gov/regular-home-energy-assistance/energy-assistance-eligibility-requirements))
- **source_url**: Ours says `MISSING` → Source says `https://dfcs.georgia.gov/regular-home-energy-assistance/energy-assistance-eligibility-requirements`

### Georgia Meals on Wheels (Home-Delivered Meals via HCBS/CCSP)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered meals (typically 5 days/week, Monday-Friday) providing at least 1/3 of Reference Daily Intakes per meal, following Dietary Guidelines for Americans. May include medically modified meals. Paired with social check-in, nutrition education. No charge, but voluntary contributions accepted. Spouses/caregivers may receive meals.` ([source](https://aging.georgia.gov/federal-and-state-programs-addressing-senior-hunger))
- **source_url**: Ours says `MISSING` → Source says `https://aging.georgia.gov/federal-and-state-programs-addressing-senior-hunger`

### Georgia Caregiver Support (Respite and Caregiving Programs)

- **min_age**: Ours says `60` → Source says `55` ([source](https://aging.georgia.gov/tools-resources/caregiving))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care (in-home, out-of-home, daytime/overnight, emergency); personal support services; adult day health; home-delivered meals; skilled nursing/therapy in home; structured family caregiving (tax-exempt pay to caregivers at daily rate); NFCSP vouchers for respite/supplies; up to 5 hours/month at $6/hour first child, $2/hour siblings for medically fragile adoptive children.` ([source](https://aging.georgia.gov/tools-resources/caregiving))
- **source_url**: Ours says `MISSING` → Source says `https://aging.georgia.gov/tools-resources/caregiving`

### Georgia Legal Assistance for Seniors (Elder Rights & Advocacy)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal assistance including legal information, community education, brief advice, and direct case representation in priority areas such as accessing health care/long-term care, debt collection, housing, consumer issues/fraud, Medicare/Medicaid appeals, Social Security claims/hearings, elder abuse/neglect/exploitation, defense of guardianship, advance directives, end-of-life issues. Also includes Georgia Senior Legal Hotline for advice, brief service, referrals.[1][2][5]` ([source](https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program))
- **source_url**: Ours says `MISSING` → Source says `https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program`

### Georgia Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Informal investigation and resolution of complaints on behalf of residents; routine facility visits to monitor conditions and talk to residents; education on long-term care issues and resident rights; advocacy for systemic changes; provision of resources and information on laws/policies governing facilities; promotion of resident/family/community involvement[5][6][7][8]` ([source](https://www.georgiaombudsman.org[7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.georgiaombudsman.org[7]`

## New Programs (Not in Our Data)

- **Community Care Services Program (CCSP) and SOURCE Waiver** — service ([source](https://aging.georgia.gov/ (Division of Aging Services); https://georgia.gov/apply-elderly-and-disabled-waiver-program[8][9]))
  - Shape notes: Tied to Medicaid NFLOC; financials follow LTC Medicaid (income capped at 300% FBR, strict assets); spousal rules complex; statewide via regional AAAs with priority-based allocation; CCSP for physical impairment (incl. dementia), SOURCE adds chronic condition focus
- **Georgia PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://dch.georgia.gov/programs/program-all-inclusive-care-elderly-pace-updates))
  - Shape notes: Not statewide—limited to provider service areas with ongoing expansion via state RFP; no direct income/asset test for core PACE but tied to Medicaid for free coverage; NFLOC certification Georgia-specific.
- **Georgia SHIP (State Health Insurance Assistance Program)** — service ([source](https://aging.georgia.gov/georgia-ship))
  - Shape notes: no income/asset test; volunteer-based counseling only, not direct benefits; delivered via statewide network of local partners with standardized free services
- **Georgia Weatherization Assistance Program** — service ([source](https://gefa.georgia.gov/how-do-i-apply-weatherization))
  - Shape notes: Administered regionally by ~22 local community action agencies via GEFA; eligibility fixed at 200% FPL or SSI with priority tiers; services customized per home audit, not fixed dollar value.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://aging.georgia.gov/programs-and-services/senior-community-service-employment-program-scsep (notes state no longer offers; contact providers)))
  - Shape notes: State administration ended 7/1/2025; now provider-specific by region/county with multiple grantees; benefits fixed at ~20 hrs/wk minimum wage; priority enrollment tiers; no asset test or fixed dollar benefits

## Program Details

### Georgia Medicaid


**Eligibility:**
- Age: 65+
- Income: For long-term care (Nursing Home Medicaid or waivers) in 2025-2026: Single applicant under $2,982/month; couple $5,802/month. ABD Medicaid (basic coverage): under $967/month for single seniors (medically needy). Almost all income counts (SSI, pensions, wages, etc.), but nursing home residents keep $70/month personal needs allowance plus Medicare premiums if dual eligible[1][2][5].
- Assets: Single: $2,000; couple: $3,000. Counts most assets; exempt: primary home (with equity limits), one car, personal belongings, burial plots. Strategies exist to qualify if over limits (e.g., spousal protections, spend-down)[1][6][7].
- Georgia resident and U.S. citizen/qualified alien[3]
- Nursing Facility Level of Care (NFLOC) for nursing home/waivers: assessed via ADLs/IADLs and cognitive ability[1][2]
- Aged 65+, blind, or disabled for ABD Medicaid[3][4]
- Functional need for ADLs for regular long-term services[2]

**Benefits:** Nursing home care; home/community-based services (personal care, respite, adult day health); assisted living/personal care homes; physician visits, prescriptions, hospital stays, long-term supports via waivers (e.g., ICWP, Community Care Services Program, Money Follows the Person). Covers full nursing home costs after income contribution; no fixed dollar/hour limits specified, tailored to NFLOC needs[1][2][9].
- Varies by: priority_tier

**How to apply:**
- Online: Georgia Gateway at https://gateway.ga.gov/[8]
- Phone: Call Department of Human Services at 1-877-423-4746 (general Medicaid line; confirm for elderly LTC)
- In-person: Local DFCS offices (find via medicaid.georgia.gov)
- Mail: Paper applications via Georgia Gateway or local DFCS

**Timeline:** Coverage may begin 3 months retroactive; applications vary, often longer than expected—ask upon submission[6]
**Waitlist:** Possible for waiver slots (e.g., ICWP); nursing home Medicaid generally no waitlist if eligible[9]

**Watch out for:**
- Most income must be paid to state for nursing home care—only $70/month personal allowance[2]
- Estate recovery after death for long-term care costs from assets[9]
- NFLOC required for LTC—not just age/low income[1]
- SSI auto-qualifies for ABD; otherwise strict income test[4]
- Higher income limits for institutional vs. basic ABD ($2,982 vs. $967 single)[5]
- Waivers have slots/waitlists unlike nursing home[9]

**Data shape:** Multiple programs/tiers (Nursing Home Medicaid, ABD, waivers like ICWP); income/asset limits higher for LTC; NFLOC assessment drives benefits; spousal impoverishment protections; estate recovery applies

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.georgia.gov/

---

### Community Care Services Program (CCSP) and SOURCE Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Countable income up to $2,982 per month (300% of Federal Benefit Rate) for individuals; no specific household size table provided, but for married couples applying together under related programs like ICWP, limit is $2,349/month per spouse. Must qualify for Georgia Medicaid under long-term care rules. SSI recipients are eligible.[2][4][6]
- Assets: No more than $2,000 for individuals or $3,000 for married couples in countable assets. If spouse not in program, combined countable assets ≤ $121,220. Exempt: primary home (equity ≤ $752,000 in 2026 if intent to return, spouse/dependent relative living there), household furnishings, appliances, personal effects, one vehicle. Look-Back Rule applies (60 months).[1][2][6]
- Georgia resident and Medicaid eligible (or potentially eligible after admission)
- Nursing home level of care (NFLOC) via DON-R assessment; functional impairment in ADLs/IADLs due to physical condition (includes Alzheimer's/dementia)
- Physician approval of care plan and intermediate LOC
- Unmet need for care; choose community over institutional services
- Participate in only one waiver at a time; health/safety met by CCSP
- For under 65: physically disabled; benefits continue after turning 65 if enrolled early
- SOURCE-specific: documented chronic health conditions likely to worsen without intervention[1][2][3][5][7][8][9]

**Benefits:** In-home/community services including: personal support (care/hygiene, meal prep, light housekeeping, shopping, in-home respite), adult day care, home-delivered meals, out-of-home respite (overnight in approved facility), other social/health/support services. Combination with other community services possible; capped at average annual cost of Medicaid nursing facility care. No fixed dollar amounts or hours specified.[3][6][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) for assessment (toll-free statewide line via aging.georgia.gov)
- Apply for Medicaid at county Department of Family and Children Services (DFCS)
- Online via Georgia.gov: https://georgia.gov/apply-elderly-and-disabled-waiver-program[9]
- In-person at AAA or DFCS offices

**Timeline:** Not specified in sources
**Waitlist:** Possible, prioritized for those most in need[8]

**Watch out for:**
- Must meet full Medicaid long-term care rules, not just SSI; spousal assets counted if not institutionalized ($121,220 combined limit)
- 60-month Look-Back Rule: asset transfers penalized
- Nursing home LOC required but services only if community-based chosen; no dual waiver participation
- SOURCE emphasizes chronic conditions worsening without intervention vs. CCSP's broader physical impairment
- Formerly CCSP, now under Elderly and Disabled Waiver; physician approval mandatory
- Services capped at nursing facility cost average; prioritized waitlists[1][2][6][8]

**Data shape:** Tied to Medicaid NFLOC; financials follow LTC Medicaid (income capped at 300% FBR, strict assets); spousal rules complex; statewide via regional AAAs with priority-based allocation; CCSP for physical impairment (incl. dementia), SOURCE adds chronic condition focus

**Source:** https://aging.georgia.gov/ (Division of Aging Services); https://georgia.gov/apply-elderly-and-disabled-waiver-program[8][9]

---

### Georgia PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No financial criteria or income limits for PACE enrollment itself; however, for full Medicaid coverage of premiums (covering ~90% of participants who are dual-eligible), Georgia Medicaid long-term care requires income under 300% of the Federal Benefit Rate ($2,901/month in 2025) and assets $2,000 or less (excluding primary home). Private pay possible via monthly premium if not Medicaid-eligible.[2]
- Assets: No asset limits for PACE enrollment. For Medicaid eligibility: $2,000 limit (exemptions typically include primary home, one vehicle, personal belongings, burial funds; countable assets: bank accounts, secondary properties, investments).[2]
- Live in the service area of a Georgia PACE provider (program not yet fully operational statewide; limited to specific regions where providers are established).
- Certified by Georgia as needing nursing home level of care (NFLOC), generally requiring extensive assistance with 2+ activities of daily living (ADLs) like bathing, dressing, eating.
- Able to live safely in the community (non-institutional setting like home or assisted living) with PACE services.
- Not enrolled in Medicare Advantage, Medicare prepayment plan, prescription drug plan, or hospice.
- US citizen or legal resident (for Medicare); voluntary enrollment.[1][2][5]

**Benefits:** Comprehensive, all-inclusive medical and social services at no additional cost (no deductibles/co-pays) once enrolled: primary/acute/specialty care, prescription drugs, hospital/inpatient care, physical/occupational/recreational therapy, home health aides, personal care, adult day health center (typically 20-40 hours/week), meals (including home-delivered), transportation to center/appointments, social work, dementia care, assistive devices. Provided by interdisciplinary team at PACE center.[1][3][6]
- Varies by: region

**How to apply:**
- Contact local PACE provider directly (once operational; find via Georgia Department of Community Health).
- Phone: Georgia Department of Community Health Medicaid info line (not specified; use general DCH contact or await provider launch). No specific Georgia PACE phone listed yet.
- Website: https://dch.georgia.gov/programs/program-all-inclusive-care-elderly-pace-updates (for updates/RFP; provider-specific sites post-launch).
- In-person: At PACE center in service area.

**Timeline:** Not specified in sources; varies by provider/state typical 30-90 days for assessment/certification.
**Waitlist:** Possible due to capped financing and provider capacity; common in PACE programs.[4]

**Watch out for:**
- Program not fully rolled out in Georgia (RFP ongoing as of 2025); availability limited to specific counties/service areas—verify local provider first.[8]
- No income test for PACE, but non-Medicaid pay premium (amount varies by provider/income); assume private pay costly (~$3,000-$6,000/month typical nationally).
- Must reside in PACE service area and be community-capable at enrollment; cannot be in nursing home/hospice.
- Disenrollment if move out of area or no longer need NFLOC.
- Medicaid planning needed if over limits for full coverage.[2][4]

**Data shape:** Not statewide—limited to provider service areas with ongoing expansion via state RFP; no direct income/asset test for core PACE but tied to Medicaid for free coverage; NFLOC certification Georgia-specific.

**Source:** https://dch.georgia.gov/programs/program-all-inclusive-care-elderly-pace-updates

---

### Georgia SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[3][2][8]
- Assets: No asset limits or tests apply[2][8]
- Must be a Medicare beneficiary or their family/caregiver
- Georgia resident (implied for state program access)
- Services focus on Medicare-related issues[2][8]

**Benefits:** Free, unbiased one-on-one counseling and assistance on Medicare (Parts A, B, C, D), Medigap, Medicaid, prescription drug programs, long-term care insurance, claims/billing resolution, appeals, fraud reporting via SMP, enrollment in plans and financial assistance programs (e.g., Medicare Savings Programs like QMB/SLMB/QI, Extra Help), information/referrals, public education presentations, and outreach events; no fixed dollar amounts or hours, provided via phone, face-to-face, or community sessions[2][3][5][6][8][10]

**How to apply:**
- Phone: 1-866-552-4464 (Option 4 for counseling)[7][8]
- Website: https://aging.georgia.gov/georgia-ship (for info, webforms, requests)[7][8][10]
- Email: Regional examples like lplatter@accaging.org for local providers[5]
- In-person: Local sessions via area agencies on aging or community partners; request via phone[2][5]

**Timeline:** No formal application or processing time; counseling provided upon contact as locally accessible services[2]

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling/info, does not pay bills or provide insurance; not affiliated with insurers, does not sell plans; volunteer-based so availability depends on local counselors; people miss that it helps with applications for income-based programs like Extra Help (which have limits, e.g., SLMB up to $1,478/month single) but SHIP itself has no limits[4][8][10]
- Must request services; no automatic enrollment[8]

**Data shape:** no income/asset test; volunteer-based counseling only, not direct benefits; delivered via statewide network of local partners with standardized free services

**Source:** https://aging.georgia.gov/georgia-ship

---

### Senior SNAP (Senior Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: All household members must be 60 years or older before February 2, 2026; 66 years or older effective February 2, 2026. They must purchase and prepare meals together[1][3]+
- Income: Household must meet standard SNAP gross income limits (130% of federal poverty level, Oct 1, 2025 - Sept 30, 2026): 1 person $1695/month, 2 people $2291, 3 $2887, 4 $3482, 5 $4079, 6 $4674, 7 $5270, each additional +$595. Households with members 60+ or disabled may be exempt from net income and asset tests if under 200% FPL and assets ≤$4500[1][2]
- Assets: Standard SNAP asset test applies only if gross income exceeds limits or assets >$4500; exemptions include home, retirement savings, household goods. No asset test if all adults 60+ or disabled and under 200% FPL[2][3]
- No earned income (including countable/excluded earned income)
- Fixed income only: Social Security (RSDI), SSI, federal/state retirement, VA benefits, Railroad Retirement, disability income
- Not working
- Georgia resident; U.S. citizen or qualified non-citizen (5+ years residency, disability benefits, or child under 18)

**Benefits:** SNAP benefits via EBT card for groceries; amount based on household net income (generally $100 more net income = $30 less benefits), minimum/maximum per federal SNAP scale
- Varies by: household_size

**How to apply:**
- Phone: Call (404) 370-6236 to request mailed application[4]
- Email: seniorsnap@dhr.state.ga.us for application[4]
- Mail: Return completed application to Georgia DFCS (address provided with form)
- No in-person office or face-to-face interview required; online via Georgia Gateway for standard SNAP if ineligible for Senior SNAP[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Age requirement increases to 66 on February 2, 2026—check current status[3]
- Must have ZERO earned income and only fixed unearned income sources[1][3]
- All household members must meet age/no-work criteria and share food prep[1][3]
- Income verified via computer matches (SDX, BENDEX); minimal docs needed unless questionable[3]
- Simplified process skips interview/office visit, but still subject to standard SNAP income caps[2][4]
- Not separate from SNAP—provides SNAP benefits via easier application for qualifying seniors[1][4]

**Data shape:** Simplified SNAP application for seniors 60+/66+ with no earned income and fixed unearned income only; all household members must qualify; minimal verification via data matches; age threshold changes Feb 2026

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfcs.georgia.gov/services/snap/senior-snap

---

### Georgia LIHEAP (Low Income Home Energy Assistance Program)


**Eligibility:**
- Income: Gross household income at or below 60% of Georgia's State Median Income (SMI), varying by household size. Monthly limits: 1 person $2,879; 2 people $3,764; 3 people $4,650; 4 people $5,536; 5 people $6,422; 6 people $7,308.[2][3]
- Assets: No asset limit.[3]
- Responsibility for paying energy costs for the home’s primary heating (and sometimes cooling) source.[1][2][6]
- U.S. citizen or lawfully admitted immigrant.[1][2][6]
- Household energy supplier must be a registered LIHEAP vendor with Georgia Department of Human Services.[1]

**Benefits:** Heating: minimum $350-$400, maximum $400 (seniors 60+ get maximum $400); Cooling: up to $500; Crisis: Winter up to $810, Summer up to $500. Payments made directly to utility vendor. One heating and one cooling benefit per program year. Amounts based on income, household size, fuel type, and funding.[3][7]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Phone: Call local Community Action Agency (varies by county; e.g., publicized numbers for specific counties).[2][5]
- Online: Schedule appointments via local provider sites (e.g., click links on county-specific pages).[2]
- In-person: At local Community Action Agencies or accessible locations statewide; home visits for homebound.[5][7]

**Timeline:** First-come, first-served until funds exhausted; crisis/life-threatening cases prioritized with standard of promptness.[3][6][7]
**Waitlist:** Yes, call to schedule appointment or join waiting list if funds low.[5]

**Watch out for:**
- Energy supplier must be registered LIHEAP vendor, or ineligible.[1]
- Funds first-come, first-served and exhaust quickly; prioritize early application, especially for elderly (Nov start).[6]
- Must reside in county of application agency.[2]
- Everyone on utility bill counts as household, unlike some programs.[3]
- Only one heating and one cooling benefit per year.[7]

**Data shape:** Administered regionally by county agencies with priority for seniors 60+/homebound; benefits tiered by vulnerability and funding; income at 60% SMI with no asset test; direct vendor payments only.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfcs.georgia.gov/regular-home-energy-assistance/energy-assistance-eligibility-requirements

---

### Georgia Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Level (FPL). Alternative qualification: receipt of Supplemental Security Income (SSI). Exact dollar amounts vary annually by FPL and household size; consult current FPL guidelines via local agency as specific table not detailed in sources. Priority given to elderly, households with disabilities, and families with children.[1][2][3][7]
- Assets: No asset limits mentioned in sources.
- Eligible home types: single-family, manufactured homes, appropriate multi-family units. Campers and non-stationary trailers ineligible.[1][3]
- Homeowners and renters eligible; renters require landlord agreement.[1]

**Benefits:** No-cost home energy efficiency improvements based on energy audit results, including: air and duct sealing, wall/floor/attic insulation, HVAC system improvements, energy-efficient lighting, hot water tank/pipe insulation, water conservation devices. Does not cover pre-existing structural issues like roofing, walls, flooring holes, underpinning, or ceiling replacement.[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact local community action agency by county (see gefa.georgia.gov for county-specific contacts).[4]
- Examples: CSRA EOA at (706) 945-1616 or www.csraeoa.org for application download (East Georgia counties); Action Pact via Savannahga.gov/4277 for Savannah/Chatham; Middle Georgia Community Action Agency (mgcaa.org) for Middle GA.[1][3][8]
- Phone, website download, in-person via local agency; mail possible through agency.

**Timeline:** Not specified; energy audit conducted if qualified, followed by measures installation. Varies by local agency.
**Waitlist:** Due to high demand, there may be a waiting list.[4]

**Watch out for:**
- Renters need landlord permission.[1]
- Excludes structural repairs (e.g., roofs, walls, large flooring holes).[3]
- Priority for elderly/disabled/children, but no strict age cutoff—open to all qualifying low-income.[1][2]
- High demand leads to waitlists; not first-come-first-served.[4]
- Must use county-specific local agency, not statewide application.[4]

**Data shape:** Administered regionally by ~22 local community action agencies via GEFA; eligibility fixed at 200% FPL or SSI with priority tiers; services customized per home audit, not fixed dollar value.

**Source:** https://gefa.georgia.gov/how-do-i-apply-weatherization

---

### Georgia Meals on Wheels (Home-Delivered Meals via HCBS/CCSP)


**Eligibility:**
- Age: 60+
- Income: No statewide income limits specified; low-income given priority. Some local programs (e.g., Meals on Wheels Atlanta) require low-income status. Costs may be adjusted or waived based on ability to pay, with no fixed dollar amounts or household size tables provided.
- Assets: No asset limits mentioned in available sources.
- Homebound or semi-homebound (temporarily or permanently) due to physical/mental disabilities or challenges preparing meals.
- Resident of a specific county, city, or delivery zone served by local provider (e.g., Cobb County, Fulton County cities like Alpharetta, Johns Creek, Milton, Mountain Park, Roswell, Sandy Springs, or Atlanta zip codes).
- Priority for greatest social/economic need, moderate/high nutrition risk (NSI), high functional impairment (DON-R for home-delivered), or food insecurity.
- Able to accept meals at delivery time.
- May include spouses (regardless of age), household members with disabilities, or caregivers if it supports the eligible older adult.

**Benefits:** Home-delivered meals (typically 5 days/week, Monday-Friday) providing at least 1/3 of Reference Daily Intakes per meal, following Dietary Guidelines for Americans. May include medically modified meals. Paired with social check-in, nutrition education. No charge, but voluntary contributions accepted. Spouses/caregivers may receive meals.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) or provider by phone (e.g., Cobb County: (770) 528-5364).
- Georgia Aging and Disability Resource Connection (ADRC) for statewide referral.
- Local providers (e.g., Senior Services North Fulton, Meals on Wheels Atlanta).

**Timeline:** Varies; some within a week, longer if waitlist.
**Waitlist:** AAAs manage waitlists; common due to high demand, with procedures for referrals and openings.

**Watch out for:**
- Not statewide—must confirm local provider coverage; outside service areas need alternatives.
- Homebound status key; car ownership or ability to shop/cook may disqualify.
- No mention of HCBS/CCSP integration in sources; primarily Older Americans Act/NSIP-funded, not Medicaid waiver-specific.
- Priority-based access leads to waitlists; not guaranteed immediate service.
- Income affects cost/donation, not always eligibility—sliding scale common.

**Data shape:** County-restricted with 12 AAAs coordinating local providers; priority tiers via assessments (NSI, DON-R); no fixed income/asset tables; varies heavily by region without central HCBS/CCSP linkage in data.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.georgia.gov/federal-and-state-programs-addressing-senior-hunger

---

### Georgia Caregiver Support (Respite and Caregiving Programs)


**Eligibility:**
- Age: 55+
- Income: Varies by program; NFCSP Grants have income limits that may apply but no specific dollar amounts or household size table provided in sources. CCSP and SOURCE require Medicaid eligibility, which has federal income thresholds (typically 138% of FPL, adjusted by household size, but exact current table not specified). Structured Family Caregiving requires Medicaid-eligible care recipient needing minimum 5 hours daily personal care.
- Assets: Not specified in sources; Medicaid waivers like CCSP follow standard Medicaid asset rules (e.g., $2,000 individual limit for aged/disabled, with exemptions for home, one vehicle, personal belongings; exact details require Medicaid application).
- Care recipient: 60+ for many AAA services or 18+ with physical/developmental disabilities at risk of nursing home placement (e.g., CCSP, SOURCE, EDWP).
- Caregiver: 18+, family or informal caregiver (not always spouse/legal guardian for Structured Family Caregiving).
- Special populations: Adults 55+ caring for non-child adults 18+ with developmental disabilities; grandparents/relatives 55+ caring for children 18 and under.
- Medicaid eligibility for care recipient in waiver programs (COMP, NOW, EDWP, CCSP, SOURCE).
- Minimum 5 hours daily personal care need for Structured Family Caregiving.

**Benefits:** Respite care (in-home, out-of-home, daytime/overnight, emergency); personal support services; adult day health; home-delivered meals; skilled nursing/therapy in home; structured family caregiving (tax-exempt pay to caregivers at daily rate); NFCSP vouchers for respite/supplies; up to 5 hours/month at $6/hour first child, $2/hour siblings for medically fragile adoptive children.
- Varies by: priority_tier

**How to apply:**
- Phone: Georgia Center for Resources and Support for Adoptive & Foster Families at 1-866-272-7368 (medically fragile adoptive children).
- Contact local Area Agency on Aging (AAA) via aging.georgia.gov (statewide caregiver support).
- Medicaid waivers (CCSP, SOURCE): Apply through Georgia Department of Community Health at dch.georgia.gov/programs/hcbs/community-based-services.
- Structured Family Caregiving: In-home assessment required.
- NFCSP Grants and general respite: Through AAAs or Empowerline (Atlanta region).

**Timeline:** CCSP: 4-6 months wait; SOURCE: 2-3 months.
**Waitlist:** Yes, common for CCSP (4-6 months) and SOURCE (2-3 months); varies by waiver and region.

**Watch out for:**
- Not a single program—umbrella for Medicaid waivers (CCSP, SOURCE, COMP, NOW, EDWP), NFCSP grants via AAAs, Structured Family Caregiving, and adoptive child respite; eligibility ties to specific waiver.
- Family members rarely paid as caregivers under CCSP consumer direction.
- Long waitlists (2-6 months) for popular waivers; prioritize by need/stress index in some regions.
- Medicaid eligibility mandatory for most substantive benefits; no universal free respite.
- Adoptive respite limited to DFCS-placed medically fragile children under 18.

**Data shape:** Multiple overlapping programs (Medicaid HCBS waivers + AAA/NFCSP grants) with priority tiers, regional AAA administration, and Medicaid gateway; benefits scale by waiver/need level, county caps on enrollment.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.georgia.gov/tools-resources/caregiving

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set by U.S. Department of Health and Human Services guidelines (not specified in sources for 2026; check current HHS poverty guidelines).
- Unemployed and seeking to re-enter the workforce
- Poor employment prospects
- Priority to veterans/qualified spouses, individuals over 65, those with disabilities, low literacy/limited English proficiency, rural residents, homeless/at risk, or failed American Job Center services

**Benefits:** Part-time community service training positions averaging 20 hours per week at the highest of federal, state, or local minimum wage (e.g., $7.25/hour noted in one source); job training, educational opportunities, job placement assistance, annual physical exams, social service referrals; up to 1300 hours annual service; goal of transition to unsubsidized full-time employment.
- Varies by: priority_tier

**How to apply:**
- Contact current providers: Legacy Link (specific contact not in results) and AARP Foundation SCSEP (contact via aarp.org/aarp-foundation/our-work/income/scsep/)
- Regional examples: Northwest Georgia - Keith Adams (706) 549-4850 or kadams@accaging.org; specific counties (Catoosa etc.) - Rachel Hunton at rhunton@accaging.org
- Georgia Department of Labor/WorkSource Georgia for job search assistance (websites: dol.georgia.gov, worksourcegeorgia.com)
- American Job Centers for employment assistance


**Watch out for:**
- Georgia DHS ended state-administered SCSEP as of July 1, 2025; must contact private/non-profit providers like Legacy Link/AARP
- Not a permanent job but paid training (20 hrs/wk) with rotations to build skills
- Income test at 125% FPL strict; priority tiers affect enrollment
- Availability limited to specific counties per provider; high demand may imply waitlists though not specified

**Data shape:** State administration ended 7/1/2025; now provider-specific by region/county with multiple grantees; benefits fixed at ~20 hrs/wk minimum wage; priority enrollment tiers; no asset test or fixed dollar benefits

**Source:** https://aging.georgia.gov/programs-and-services/senior-community-service-employment-program-scsep (notes state no longer offers; contact providers)

---

### Georgia Legal Assistance for Seniors (Elder Rights & Advocacy)


**Eligibility:**
- Age: 60+
- Income: No income limits or means-testing; federal law prohibits income/asset tests. Program prioritizes those in greatest social and/or economic need, including low-income, LEP, rural, and minority seniors.[1][2][5]
- Assets: No asset limits or means-testing; federal law prohibits asset tests.[2][5]
- Resident of Georgia
- Legal problem must be civil (not criminal)
- Legal problem must be one ELAP handles (e.g., public benefits like SNAP/Medicaid denials, income/Social Security issues, health care access, long-term care, debt collection, housing, consumer issues/fraud, Medicare/Medicaid appeals, elder abuse/neglect/exploitation, defense of guardianship, advance directives, end-of-life issues)
- Circumstances put life or well-being at risk or in danger[1][2]

**Benefits:** Free civil legal assistance including legal information, community education, brief advice, and direct case representation in priority areas such as accessing health care/long-term care, debt collection, housing, consumer issues/fraud, Medicare/Medicaid appeals, Social Security claims/hearings, elder abuse/neglect/exploitation, defense of guardianship, advance directives, end-of-life issues. Also includes Georgia Senior Legal Hotline for advice, brief service, referrals.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Contact local ELAP law firm serving your county via phone (county-specific numbers listed on https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program)[1]
- Georgia Senior Legal Hotline: (404) 389-9992 (statewide, Mon-Thu 9am-2pm)[5][6][8]
- Area Agency on Aging (e.g., Coastal Regional: 1-888-220-8399)[4]
- Aging and Disability Resource Connection: 866-552-4464 or https://aging.georgia.gov/adrc[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Must be civil non-criminal matter in ELAP priority areas; not all civil issues qualify[1][2]
- Prioritizes highest need; not guaranteed representation for all[2][5]
- Contact county-specific provider, not central office; metro Atlanta counties use different orgs like Atlanta Legal Aid[1][3][6]
- No means test, but voluntary contributions encouraged without discouraging use[2]
- If multiple needs beyond legal, contact ADRC first[1]

**Data shape:** No income/asset tests (federally prohibited); county-specific local providers via 12 Area Agencies on Aging; prioritizes greatest social/economic need; two main programs (ELAP network + statewide Senior Legal Hotline)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program

---

### Georgia Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents of qualifying long-term care facilities regardless of financial status[5][7][8]
- Assets: No asset limits or financial tests apply[5][7][8]
- Must be a resident of a long-term care facility including nursing homes, personal care homes, assisted living facilities, community living arrangements (CLAs), or intermediate care facilities for persons with intellectual and developmental disabilities (ICF/IDDs)[5][7][8]

**Benefits:** Informal investigation and resolution of complaints on behalf of residents; routine facility visits to monitor conditions and talk to residents; education on long-term care issues and resident rights; advocacy for systemic changes; provision of resources and information on laws/policies governing facilities; promotion of resident/family/community involvement[5][6][7][8]

**How to apply:**
- Phone: 1-866-552-4464 (select option 5)[8]
- Website: https://www.georgiaombudsman.org[7][8]

**Timeline:** No formal application or processing time; services provided upon contact for complaint resolution or assistance[5][7][8]

**Watch out for:**
- This is not a program that provides direct care, financial aid, or placement services—it's purely advocacy and complaint resolution for existing facility residents[5][7][8]
- Requires direct permission from resident or representative to intervene[5][7]
- Not for community-dwelling elderly; only for those in specified long-term care facilities[7][8]
- Certification and training details apply to ombudsman volunteers/staff, not residents seeking help[1][2][3]

**Data shape:** no income test; advocacy-only for residents of long-term care facilities; no formal eligibility application—contact-based; delivered via statewide network of AAAs/non-profits

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.georgiaombudsman.org[7]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Georgia Medicaid | benefit | state | deep |
| Community Care Services Program (CCSP) a | benefit | state | deep |
| Georgia PACE (Program of All-Inclusive C | benefit | local | deep |
| Georgia SHIP (State Health Insurance Ass | resource | federal | simple |
| Senior SNAP (Senior Supplemental Nutriti | benefit | federal | medium |
| Georgia LIHEAP (Low Income Home Energy A | benefit | federal | deep |
| Georgia Weatherization Assistance Progra | benefit | federal | deep |
| Georgia Meals on Wheels (Home-Delivered  | benefit | federal | deep |
| Georgia Caregiver Support (Respite and C | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Georgia Legal Assistance for Seniors (El | resource | state | simple |
| Georgia Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":8,"resource":3,"employment":1}
**Scopes:** {"state":4,"local":1,"federal":7}
**Complexity:** {"deep":8,"simple":3,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/GA/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **region**: 2 programs
- **not_applicable**: 2 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Georgia Medicaid**: Multiple programs/tiers (Nursing Home Medicaid, ABD, waivers like ICWP); income/asset limits higher for LTC; NFLOC assessment drives benefits; spousal impoverishment protections; estate recovery applies
- **Community Care Services Program (CCSP) and SOURCE Waiver**: Tied to Medicaid NFLOC; financials follow LTC Medicaid (income capped at 300% FBR, strict assets); spousal rules complex; statewide via regional AAAs with priority-based allocation; CCSP for physical impairment (incl. dementia), SOURCE adds chronic condition focus
- **Georgia PACE (Program of All-Inclusive Care for the Elderly)**: Not statewide—limited to provider service areas with ongoing expansion via state RFP; no direct income/asset test for core PACE but tied to Medicaid for free coverage; NFLOC certification Georgia-specific.
- **Georgia SHIP (State Health Insurance Assistance Program)**: no income/asset test; volunteer-based counseling only, not direct benefits; delivered via statewide network of local partners with standardized free services
- **Senior SNAP (Senior Supplemental Nutrition Assistance Program)**: Simplified SNAP application for seniors 60+/66+ with no earned income and fixed unearned income only; all household members must qualify; minimal verification via data matches; age threshold changes Feb 2026
- **Georgia LIHEAP (Low Income Home Energy Assistance Program)**: Administered regionally by county agencies with priority for seniors 60+/homebound; benefits tiered by vulnerability and funding; income at 60% SMI with no asset test; direct vendor payments only.
- **Georgia Weatherization Assistance Program**: Administered regionally by ~22 local community action agencies via GEFA; eligibility fixed at 200% FPL or SSI with priority tiers; services customized per home audit, not fixed dollar value.
- **Georgia Meals on Wheels (Home-Delivered Meals via HCBS/CCSP)**: County-restricted with 12 AAAs coordinating local providers; priority tiers via assessments (NSI, DON-R); no fixed income/asset tables; varies heavily by region without central HCBS/CCSP linkage in data.
- **Georgia Caregiver Support (Respite and Caregiving Programs)**: Multiple overlapping programs (Medicaid HCBS waivers + AAA/NFCSP grants) with priority tiers, regional AAA administration, and Medicaid gateway; benefits scale by waiver/need level, county caps on enrollment.
- **Senior Community Service Employment Program (SCSEP)**: State administration ended 7/1/2025; now provider-specific by region/county with multiple grantees; benefits fixed at ~20 hrs/wk minimum wage; priority enrollment tiers; no asset test or fixed dollar benefits
- **Georgia Legal Assistance for Seniors (Elder Rights & Advocacy)**: No income/asset tests (federally prohibited); county-specific local providers via 12 Area Agencies on Aging; prioritizes greatest social/economic need; two main programs (ELAP network + statewide Senior Legal Hotline)
- **Georgia Long-Term Care Ombudsman Program**: no income test; advocacy-only for residents of long-term care facilities; no formal eligibility application—contact-based; delivered via statewide network of AAAs/non-profits

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Georgia?
