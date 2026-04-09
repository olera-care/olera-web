# South Carolina Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 54s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 15 |
| New (not in our data) | 8 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 7 programs
- **service**: 5 programs
- **advocacy**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Healthy Connections Medicaid

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Medical assistance program that helps pay for some or all medical bills. For seniors and disabled individuals: covers nursing facility care and other medical expenses. Specific dollar amounts or service limits are not provided in available sources.[2]` ([source](https://www.scdhhs.gov/members/getting-started))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/members/getting-started`

### Community Choices Waiver

- **min_age**: Ours says `65` → Source says `65+ or 18-64 with physical disability` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver))
- **income_limit**: Ours says `$2982` → Source says `$1,330` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health care, case management, personal care, respite (in-home, institutional, CRCF), attendant care, companion care (agency/individual), home accessibility adaptations/environmental modifications, home delivered meals, personal emergency response system (installation/monitoring), pest control, residential personal care II, specialized medical equipment/supplies, telemonitoring, adult day health care transportation/nursing[6]` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver`

### South Carolina PACE (Program of All-Inclusive Care for the Elderly)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive care including all Medicare and Medicaid services, plus additional services to maintain community living: primary care, hospital care, prescription drugs, social services, restorative therapies, personal care, respite care, nutritional counseling, transportation, homemaker services, and adult day health care at PACE centers. No specific dollar amounts or hours stated; care is all-inclusive and individualized[1][3][8].` ([source](https://www.scdhhs.gov/partners/managed-care/program-all-inclusive-care-elderly-pace[8]))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/partners/managed-care/program-all-inclusive-care-elderly-pace[8]`

### Medicare Savings Programs (QMB, SLMB, QI)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `[object Object]` ([source](https://www.scdhhs.gov/members/program-eligibility-and-income-limits))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/members/program-eligibility-and-income-limits`

### SNAP (Supplemental Nutrition Assistance Program)

- **income_limit**: Ours says `$1980` → Source says `$4500` ([source](https://dss.sc.gov/assistance-programs/snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (amount based on income, household size, deductions like medical expenses; average varies, e.g., scales with need after calculations). ESAP extends to 36 months vs. standard 12.[1][2][5]` ([source](https://dss.sc.gov/assistance-programs/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sc.gov/assistance-programs/snap/`

### LIHEAP (Low-Income Home Energy Assistance Program)

- **income_limit**: Ours says `$2800` → Source says `$2,332` ([source](https://oeo.sc.gov/managedsites/prd/oeo/liheap.html))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Regular LIHEAP: Heating assistance maximum $850, minimum $200; Cooling assistance maximum $775, minimum $200. Crisis LIHEAP: maximum $1,500 per service. Eligible households may receive up to 2 LIHEAP services during the calendar year, with payment up to $1,500 per service to offset household energy costs. Assistance covers electric, gas, propane, oil, coal, and wood heating sources.[2][4]` ([source](https://oeo.sc.gov/managedsites/prd/oeo/liheap.html))
- **source_url**: Ours says `MISSING` → Source says `https://oeo.sc.gov/managedsites/prd/oeo/liheap.html`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigation and resolution of complaints; advocacy for resident rights; assistance with appeals/grievances; education on resident rights and benefits; information/referrals for long-term care services; mediation with facilities; promotion of dignity, respect, and quality care. No financial aid, hours, or dollar amounts provided.` ([source](https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program))
- **source_url**: Ours says `MISSING` → Source says `https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program`

## New Programs (Not in Our Data)

- **Weatherization Assistance Program (WAP)** — service ([source](https://oeo.sc.gov/ (SC Office of Economic Opportunity, state administrator)))
  - Shape notes: Delivered via 8 regional community action agencies covering all counties; eligibility at 200% FPL with priority tiers; income tables by household size at local agencies; documentation varies slightly by provider.
- **I-Care (SHIP)** — advocacy ([source](https://aging.sc.gov/programs-initiatives/medicare-and-medicare-fraud))
  - Shape notes: no income test; counseling-only service for Medicare beneficiaries; delivered via statewide hotline and local AAAs; not an entitlement with waitlists or asset rules
- **SC Meals on Wheels** — service ([source](No single statewide .gov site; use Meals on Wheels America provider search (mealsonwheelsamerica.org/find-meals-and-services/) or SC Area Agencies on Aging via local search.[4]))
  - Shape notes: Decentralized local programs with no uniform state eligibility/income test; must identify provider by county/zip via local AAA or Meals on Wheels America search; benefits/delivery customized per provider.
- **SC Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (U.S. DOL); SC-specific: https://www.palmettogoodwill.org/service/senior-job-training/[2][3]))
  - Shape notes: Federally uniform (age 55+, unemployed, <=125% FPL) but locally administered by grantees like Palmetto Goodwill in SC; priority tiers affect access; no fixed dollar table in sources (use current FPL); waitlists and availability vary regionally; part-time paid training only, not direct aid.
- **SC Legal Help for Seniors** — service ([source](https://aging.sc.gov/programs-initiatives/legal-assistance-older-adults))
  - Shape notes: No income/asset test for denial; priority-based via OAA targeting; delivered statewide via 10 Area Agencies on Aging with attorney requirement; referrals to means-tested programs like SCLS
- **Homestead Exemption** — financial ([source](https://dor.sc.gov/property/exempt-property))
  - Shape notes: County-administered statewide program with no income/asset tests; one-time application; fixed $50k exemption; prorated for non-spousal co-ownership
- **Elderly Simplified Application Project (ESAP)** — financial ([source](https://dss.sc.gov/assistance-programs/snap/how-do-i-apply/help-for-the-elderly/))
  - Shape notes: Streamlined SNAP demo for elderly-only households with no earnings; no unique income/asset tables (uses standard SNAP); extended certification to 36 months; no interview/recertification required; statewide with dedicated senior unit
- **Eldercare Trust Fund** — financial ([source](https://aging.sc.gov/programs-initiatives/eldercare-trust-fund[4]))
  - Shape notes: Grants only to non-profits for innovative aging-in-place programs; no individual eligibility, income/asset tests, or direct applications—fund supplements existing services via community providers[3][4]

## Program Details

### Healthy Connections Medicaid


**Eligibility:**
- Income: {"description":"Income limits vary by household composition and are expressed as percentages of the Federal Poverty Level (FPL). A 5% income disregard applies.[1]","by_category":{"children":"Up to 213% of FPL[1]","pregnant_women":"Up to 199% of FPL (coverage continues 12 months postpartum)[1]","parents_caretakers_with_dependent_children":"Up to 100% of FPL[1]","working_parents_with_dependent_children":"Up to 89% of FPL[1]","jobless_parents_with_dependent_children":"Up to 50% of FPL[1]","nursing_home_applicants_single":"Under $2,982/month (2026)[5]"},"note":"Exact dollar amounts depend on household size and current FPL guidelines. The state has not expanded Medicaid under the ACA.[1]"}
- Assets: {"nursing_home_applicants_single":"Under $2,000[5]","general_medicaid":"Based on applicants' income and assets, but specific asset limits for non-nursing-home categories are not detailed in available sources"}
- Eligible categories include: children, parent and caretaker relatives, pregnant women, people over age 65, people with disabilities, children with developmental delays, and breast/cervical cancer patients[3]
- For nursing home care: must require Nursing Facility Level of Care (NFLOC)[5]
- For long-term care via regular Medicaid: functional need with Activities of Daily Living (ADLs) required, but NFLOC not necessarily required[5]

**Benefits:** Medical assistance program that helps pay for some or all medical bills. For seniors and disabled individuals: covers nursing facility care and other medical expenses. Specific dollar amounts or service limits are not provided in available sources.[2]
- Varies by: household_size and eligibility category

**How to apply:**
- Online: apply.scdhhs.gov[6] or through HealthCare.gov[1]
- Phone: 1-888-549-0820 (TTY: 888-842-3620)[4]
- Mail: Request paper application by phone[6]
- In-person: Local county office[6]
- Alternative phone for HealthCare.gov: 1-800-318-2596[1]

**Timeline:** Generally up to 45 days for eligibility determination, though times can increase for certain applicant categories[6]

**Watch out for:**
- South Carolina has NOT expanded Medicaid under the ACA, so eligibility is more restrictive than in expansion states[1]
- Only hospitals authorized by Healthy Connections can make Medicaid eligibility determinations—not individual doctors or non-authorized providers[6]
- If applying through HealthCare.gov and deemed Medicaid-eligible, Healthy Connections makes the final determination; conversely, if applying to Healthy Connections first and deemed eligible for Marketplace coverage, the Marketplace makes the final decision[6]
- For nursing home applicants: meeting income and asset limits does not guarantee eligibility—medical/functional need for long-term care is also required[5]
- Medicaid planning may be necessary for applicants with income or resources exceeding limits[5]
- Mandatory enrollment in a Medicaid Managed Care Plan applies; you have 90 days to switch plans for any reason, but after that period you cannot change until the next open enrollment or a qualifying event[4]
- Processing time can vary significantly by applicant category[6]

**Data shape:** Healthy Connections is South Carolina's Medicaid program with income limits that vary substantially by household composition and eligibility category (children, parents, pregnant women, elderly, disabled). The program is administered centrally by SCDHHS but applicants interact with local county offices. For elderly applicants seeking nursing home coverage, both income/asset limits AND medical/functional need requirements apply. The program operates as a managed care system with mandatory enrollment and limited plan-switching windows. Specific benefit amounts and service limits are not detailed in publicly available sources—applicants must contact the program directly for detailed benefit information.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/members/getting-started

---

### Community Choices Waiver


**Eligibility:**
- Age: 65+ or 18-64 with physical disability+
- Income: At or below 100% of the Federal Poverty Level (FPL), effective 03/01/2026: Family Size 1 - Monthly $1,330 / Annual $15,960; Family Size 2 - Monthly $1,804 / Annual $21,640. Must also have Healthy Connections (SC Medicaid) eligibility[1][3]
- Assets: Resources up to $9,950 (individual, eff. 01/01/2026) or $14,910 (family size 2). Home exempt if applicant lives there or intends to return with equity ≤$730,000 (2025), or spouse/child under 21/disabled child lives there[1][3]
- South Carolina resident
- U.S. citizen or qualified alien
- Nursing Facility Level of Care (NFLOC): e.g., 8+ hours skilled nursing/day, needs help with ADLs like mobility, eating, toileting, bathing, dressing[1][2][4]
- At risk of nursing home placement
- Live in home/community (not institution)

**Benefits:** Adult day health care, case management, personal care, respite (in-home, institutional, CRCF), attendant care, companion care (agency/individual), home accessibility adaptations/environmental modifications, home delivered meals, personal emergency response system (installation/monitoring), pest control, residential personal care II, specialized medical equipment/supplies, telemonitoring, adult day health care transportation/nursing[6]
- Varies by: priority_tier

**How to apply:**
- Online: SCDHHS website (scdhhs.gov)
- Phone: Contact local Community Long Term Care (CLTC) Office or SCDHHS
- Mail: SCDHHS-Central Mail, P.O. Box 100101, Columbia, SC 29202-3101 or fax to 8888201204@fax.scdhhs.gov
- In-person: Local county Health and Human Services office or CLTC office[3][5]

**Timeline:** Not specified in sources
**Waitlist:** Waiver slots required; reserved capacity categories and priority for certain situations (e.g., at risk of institutionalization)[2][7]

**Watch out for:**
- Must have Medicaid (Healthy Connections) first; waiver slot required and limited[2]
- NFLOC not automatic with dementia/physical disability—requires assessment[1]
- Must use services regularly to retain slot[2]
- Home equity limit $730,000 applies even if intending to return[1]
- Disabled enrollees (18-64) can continue post-65[1]

**Data shape:** Requires NFLOC assessment; benefits via managed care providers; priority tiers and reserved slots for at-risk individuals; income/assets tied to Medicaid FPL with specific tables

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver

---

### South Carolina PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No financial criteria or income limits; no dollar amounts apply. Approximately 90% of participants are dually eligible for Medicare and Medicaid, but enrollment does not require Medicaid or Medicare[1][8].
- Assets: No asset limits or financial criteria considered for PACE enrollment[1].
- Live in the service area of a South Carolina PACE organization[1][8].
- Certified by the state (SCDHHS) as meeting nursing home level of care[1][3][8].
- Able to live safely in the community with PACE services at time of enrollment[1][3].
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice[1].

**Benefits:** Comprehensive care including all Medicare and Medicaid services, plus additional services to maintain community living: primary care, hospital care, prescription drugs, social services, restorative therapies, personal care, respite care, nutritional counseling, transportation, homemaker services, and adult day health care at PACE centers. No specific dollar amounts or hours stated; care is all-inclusive and individualized[1][3][8].
- Varies by: region

**How to apply:**
- Contact SCDHHS or local PACE providers (specific phone/website not listed in sources; call SCDHHS Provider Service Center at (888) 289-0709 for guidance[8])
- Visit SCDHHS PACE page: https://www.scdhhs.gov/partners/managed-care/program-all-inclusive-care-elderly-pace[8]

**Timeline:** Not specified in sources
**Waitlist:** Not specified in sources; may vary by PACE organization service area

**Watch out for:**
- Must live in a specific PACE service area—not statewide[1][8].
- Requires state certification for nursing home level of care, even if not currently in a nursing home[1][3][8].
- Cannot be enrolled in Medicare Advantage, certain Medicare plans, or hospice[1].
- Voluntary enrollment; average participant is 76 with complex needs—may not suit all elderly[1].
- Sources lack specifics on SC providers, wait times, exact application steps—contact SCDHHS directly[8].

**Data shape:** Not statewide; restricted to PACE organization service areas with regional providers. No income/asset test unique to PACE (unlike underlying Medicaid). Nursing home level of care certification required. Limited SC-specific details available.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/partners/managed-care/program-all-inclusive-care-elderly-pace[8]

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: {"note":"Income limits are tiered by program and household size. 2026 limits shown below.","QMB":{"individual_monthly":"$1,350","married_couple_monthly":"$1,824","basis":"At or below 100% of Federal Poverty Level"},"SLMB":{"individual_monthly":"Between $1,350 and $1,620 (approximately)","married_couple_monthly":"Between $1,824 and $2,189 (approximately)","basis":"Between 100% and 120% of Federal Poverty Level"},"QI":{"individual_monthly":"Up to $1,781","married_couple_monthly":"Up to $2,400","basis":"Between 120% and 135% of Federal Poverty Level"}}
- Assets: {"individual":"$9,950","married_couple":"$14,910","note":"South Carolina uses federal asset limits. These are the same across all three programs (QMB, SLMB, QI).","what_counts":"Countable resources include bank accounts, stocks, bonds, and other liquid assets","what_is_exempt":"Your home, one vehicle, and certain other assets are typically excluded from resource calculations"}
- Must be enrolled in Medicare Part A and Part B
- Must be a U.S. citizen or qualified immigrant
- Must be a South Carolina resident
- Cannot be eligible for Medicaid (for QI program specifically)
- For QMB: Income calculation includes first $20 of monthly income, first $65 of wages, and half of wages above $65; food stamps and Native American settlement payments are excluded

**Benefits:** [object Object]
- Varies by: program_tier

**How to apply:**
- Phone: Contact your local South Carolina Department of Health and Human Services (SCDHHS) office
- Mail: Submit application to your local SCDHHS office
- In-person: Visit your local SCDHHS office
- Online: Through SCDHHS website (specific URL not provided in search results; contact SCDHHS directly)

**Timeline:** Not specified in available sources
**Waitlist:** QI program has limited funding and operates on a first-come, first-served basis; other programs do not appear to have waitlists

**Watch out for:**
- QI program has limited funding and operates first-come, first-served — you may not be able to enroll even if you meet income requirements
- SLMB allows reimbursement for Part B premiums paid during the previous calendar year, but QI does not — timing matters
- If you qualify for Medicaid, you cannot use the QI program, but you may qualify for QMB or SLMB instead
- Income limits change annually (typically released in January); the amounts provided are for 2026 and will differ in future years
- These programs only apply to Original Medicare (Parts A and B) — they do not affect Medicare Advantage (Part C) or Medigap plans
- QMB provides full Medicaid benefits in South Carolina, which is a significant additional benefit beyond just Medicare cost assistance
- Asset limits are relatively low ($9,950 for individuals); significant savings or investments may disqualify you
- The income calculation for QMB excludes the first $20 of income and first $65 of wages, plus half of wages above $65 — this can make a difference for working beneficiaries

**Data shape:** This program consists of three distinct tiers (QMB, SLMB, QI) with progressively higher income limits but narrower benefits. Income limits are the primary eligibility driver and change annually. Asset limits are uniform across all three programs. QI differs critically from the others by operating on a first-come, first-served basis with limited funding. South Carolina implements federal guidelines uniformly statewide with no regional variations. The program is administered through local SCDHHS offices, but specific office locations and contact information are not detailed in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/members/program-eligibility-and-income-limits

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with any member age 60+ or disabled (Oct 1, 2025–Sept 30, 2026): Gross income limit at 200% federal poverty level if assets >$4500; otherwise, standard gross at 130% FPL and net at 100% FPL. Gross limits (monthly): 1: $1695, 2: $2291, 3: $2887, 4: $3482, 5: $4079, 6: $4674, 7: $5270, +$595 each additional. If all adults 60+ or disabled and fail asset test, gross limit 200% FPL. Households with 60+ member exempt from gross income test if meeting $4500 asset limit and net income test.[1][2][4]
- Assets: Households with 60+ or disabled member: Exempt from asset test if gross income ≤200% FPL; otherwise $4500 limit applies (standard federal). Exempt assets typically include home, one vehicle, retirement savings; countable include cash, bank accounts. Application may still request asset info.[1]
- U.S. citizen or qualified non-citizen (SAVE verification required for non-citizens).
- Able-bodied adults 18-64 without dependents (ABAWD) limited to 3 months benefits in 36 unless working/volunteering/training 80 hours/month (changes effective post-2025 may expand to 64).
- ESAP for all household members 60+, no earned income: Simplified rules, 36-month certification, no renewal interview.
- Income includes Social Security, veterans/disability benefits.

**Benefits:** Monthly EBT card for food purchases (amount based on income, household size, deductions like medical expenses; average varies, e.g., scales with need after calculations). ESAP extends to 36 months vs. standard 12.[1][2][5]
- Varies by: household_size

**How to apply:**
- Online: https://www.benefits.sc.gov
- Phone: Local DSS office or statewide (find via dss.sc.gov)
- Mail: ESAP to South Carolina Department of Social Services, P.O. Box 100203, Columbia, SC 29202; standard apps to local offices
- In-person: Local DSS county offices (locations at dss.sc.gov)

**Timeline:** Typically 30 days; expedited if very low income (7 days). ESAP uses shorter form.[2][4]

**Watch out for:**
- Elderly households often miss ESAP (all 60+, no earned income) for easier process/36-month benefits.
- Assets may still be asked even if exempt; over $4500 triggers stricter gross income test.
- All household members (food buyers/preparers) counted, including non-elderly.
- Social Security/veterans/disability count as income.
- ABAWD rules expanding to age 64, work 80 hours/month required beyond 3 months.
- Medical deductions for elderly (out-of-pocket >$35/month) can lower net income significantly.

**Data shape:** Elderly/disabled exemptions from gross income/asset tests if under limits; ESAP simplifies for all-60+ households; benefits/income scale by household size with elderly-specific gross/net rules and medical deductions.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sc.gov/assistance-programs/snap/

---

### LIHEAP (Low-Income Home Energy Assistance Program)


**Eligibility:**
- Income: Household gross monthly income must be at or below 60% of South Carolina state median income (SMI). Income limits by household size: 1 person $2,332.83/month ($27,994/year); 2 people $3,050.58/month ($36,607/year); 3 people $3,768.42/month ($45,221/year); 4 people $4,486.25/month ($53,835/year); 5 people $5,204/month ($62,448/year); 6 people $5,921.83/month ($71,062/year); 7 people $6,056.42/month ($72,677/year); 8 people $6,191/month ($74,292/year). Some sources reference Federal Poverty Guidelines as an alternative threshold for certain priority determinations.[2][3]
- Assets: No asset limit for LIHEAP in South Carolina.[2]
- Be a resident of South Carolina (specific county served by local Community Action Agency)[1][5]
- Present a South Carolina-issued picture ID with current address for the applicant[1]
- Present legible Social Security cards for all household members[1]
- Present proof of total income for all household members within the past 30 days prior to application[1]
- Energy bill must be in a household member's name (for renters, must have access to itemized monthly bill if energy included in rent)[4]
- U.S. citizenship status verification required[4]

**Benefits:** Regular LIHEAP: Heating assistance maximum $850, minimum $200; Cooling assistance maximum $775, minimum $200. Crisis LIHEAP: maximum $1,500 per service. Eligible households may receive up to 2 LIHEAP services during the calendar year, with payment up to $1,500 per service to offset household energy costs. Assistance covers electric, gas, propane, oil, coal, and wood heating sources.[2][4]
- Varies by: priority_tier and season

**How to apply:**
- In-person at local Community Action Agency serving your county[4][5]
- Phone: Contact Governor's Office of Economic Opportunity at 803-734-0662 for general information and referral to your local agency[4]
- Mail: Contact your county's Community Action Agency (addresses vary by region)[7]

**Timeline:** Not specified in available sources; contact local Community Action Agency for specific timeline
**Waitlist:** Not specified in available sources

**Watch out for:**
- Incomplete applications will be voided and assistance will be denied — all required documents must be presented; failing to present even one required document results in denial.[1]
- You can apply only twice per calendar year and not within 30 days of receiving assistance.[1]
- Heating assistance is typically available only October through winter months; cooling assistance is typically available May-September. Crisis assistance is available only during emergencies (broken furnace, utility shutoff notice, etc.).[2]
- LIHEAP evaluates income differently than many other federally funded programs — applicants should not assume they are ineligible based on other program determinations; let LIHEAP determine eligibility.[1]
- Roommates covered by the same utility bill are counted as part of the same LIHEAP household, even if they don't share most expenses — this differs from how SNAP defines households.[2]
- Priority is given to vulnerable households (elderly, disabled, families with children age 5 or younger, and those with income at or below 60% of state median income), meaning non-priority households may face longer wait times or reduced assistance.[3]
- For renters, the energy bill must be in a household member's name; if energy is included in rent, you must have access to an itemized monthly bill.[4]
- No asset limit exists, but income is the primary eligibility determinant — high assets do not disqualify you if income is below the threshold.[2]

**Data shape:** LIHEAP in South Carolina is a county-administered program with statewide income limits but regional variation in providers and processing. Benefits are seasonal (heating Oct-winter, cooling May-Sept) with fixed maximum amounts ($850 heating, $775 cooling, $1,500 crisis) and a cap of 2 services per calendar year. Elderly individuals are explicitly prioritized but there is no age requirement for eligibility. The program serves both renters and homeowners regardless of fuel type. Income limits scale by household size and are based on 60% of state median income, not federal poverty guidelines (though some priority determinations reference federal poverty levels).

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oeo.sc.gov/managedsites/prd/oeo/liheap.html

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households at or below 200% of the federal poverty level. Specific monthly/annual dollar amounts vary by family size; check the income chart from your local community action agency (e.g., Carolina Community Actions provides a family size-based table where income must be less than listed amounts, adding specific increments per additional member). Automatic eligibility for SSI or Aid to Families with Dependent Children recipients. Proof of income required for all household members (past 30 days or 12 months depending on provider).
- Assets: No asset limits mentioned.
- South Carolina resident needing help with home energy costs.
- Preference given to elderly (60+), disabled households, and families with children under 18 (or 17 per some sources).
- Home not weatherized in the last 15 years.
- Annual income verification for all occupants.
- Proof of ownership or landlord permission for renters.

**Benefits:** Free home weatherization services to improve energy efficiency, health, and safety. Includes insulation, air infiltration sealing, addressing health/safety issues (e.g., carbon monoxide, combustion safety). No specific dollar amounts or hours; services based on professional assessment of the home.
- Varies by: priority_tier

**How to apply:**
- Contact local community action agency (8 agencies cover all 46 counties; find via oeo.sc.gov or energyfundsforall.org).
- In-person or phone through agencies like Carolina Community Actions, ABCCAA, Palmetto CAP.
- No statewide online application; agency-specific processes.

**Timeline:** Not specified; once eligible, home assessment performed before services.
**Waitlist:** Likely due to funding limits (e.g., plans to weatherize set number of homes); varies by agency and demand.

**Watch out for:**
- Must contact specific local community action agency based on county, not a central office.
- Homes weatherized in last 15 years ineligible for re-weatherization.
- Priority for elderly/disabled/children, but not guaranteed—first-come or need-based selection.
- Renters need landlord permission; name must be on utility bills.
- Bank statements not accepted as income proof.
- No automatic service upon eligibility; wait for assessment and funding availability.

**Data shape:** Delivered via 8 regional community action agencies covering all counties; eligibility at 200% FPL with priority tiers; income tables by household size at local agencies; documentation varies slightly by provider.

**Source:** https://oeo.sc.gov/ (SC Office of Economic Opportunity, state administrator)

---

### I-Care (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits. Available to all Medicare beneficiaries, their families, or caregivers. Must be eligible for Medicare (typically age 65+, disabled, or with ESRD).[2][3][4]
- Assets: No asset limits or tests apply.[4]
- Medicare beneficiary or family/caregiver of one.
- South Carolina resident.[2][3][5]

**Benefits:** Free one-on-one health insurance counseling; help enrolling in Medicare; comparing/changing Medicare Advantage and Part D plans; answering questions on Medigap protections; referrals to home care agencies or long-term care services; assistance with Medicare/Medicaid choices; review of Medicare Summary Notices or bills.[2][3][4][8][9]

**How to apply:**
- Phone: 1-800-868-9095
- Contact local Area Agency on Aging (find by zip code via SHIP or AAA resources)
- In-person or referrals through Lt. Governor’s Office on Aging, 1301 Gervais Street, Suite 350, Columbia SC 29201.[3][5][7][8]

**Timeline:** Immediate counseling available upon contact; no formal processing as it's not an entitlement program.[2][8]

**Watch out for:**
- Not a direct benefits or financial assistance program—provides counseling and referrals only, not services or payments.
- Not Medicaid; confusable with SC Medicaid programs for elderly/disabled which have strict income/asset limits (e.g., $1,330/month single at 100% FPL).[1][3]
- Plans change annually; counseling needed yearly for updates.
- Funded federally, independent of insurance companies.[2][4][8]
- Volunteers often provide counseling; expertise from referrals by SSA/CMS.[8]

**Data shape:** no income test; counseling-only service for Medicare beneficiaries; delivered via statewide hotline and local AAAs; not an entitlement with waitlists or asset rules

**Source:** https://aging.sc.gov/programs-initiatives/medicare-and-medicare-fraud

---

### SC Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; eligibility is not based on income. Some programs prioritize low-income seniors or follow federal poverty guidelines for reduced costs, but many explicitly state no income test applies.[2][3][6]
- Assets: No asset limits mentioned across sources.
- Primarily homebound due to age, infirmity, chronic disease, disability, or debilitating illness.[1][3][6]
- Unable or have tremendous difficulty shopping for food and cooking for themselves.[3][6]
- Reside in the specific program's delivery zone or service area.[1][6]
- May include spouses, partners, or dependents if they also qualify.[1][3]
- Some programs serve those under 60 if disabled and homebound.[2][3][8]

**Benefits:** Home-delivered nutritionally balanced meals (e.g., protein, two sides, fruit/dessert, bread; standard diabetic meal low-salt/low-fat providing 1/3 daily nutrition; special diets like chopped, puree, renal). Delivered 5 days/week (Mon-Fri, 10:30am-1pm typical), often weekly batch delivery. Includes volunteer welfare checks and social interaction.[3][6]
- Varies by: region

**How to apply:**
- Contact local provider or Area Agency on Aging by phone (examples: Summerville (843) 873-8224[3]; Berkeley/Trident AAA (843) 554-2275[9]; Upstate (1-888-516-4788)[8]; Horry County via mowhc.org[5]).
- Online apply buttons on local sites (e.g., mowsummerville.org[3]).
- In-person assessment or referral via local senior centers/AAA.
- Refer someone else on behalf of loved one.[4]

**Timeline:** Varies; some within a week, others longer if waitlist.[1]
**Waitlist:** Possible in some programs, leading to longer processing.[1]

**Watch out for:**
- Not a single statewide program—must contact specific local provider for your area; eligibility and delivery zones vary.[1][6]
- Homebound status strictly assessed; if mobile enough for group meals at senior centers, may be directed there instead.[1][9]
- No guaranteed free meals; some require donations, suggested contributions, or purchase if not qualifying for funding (e.g., $9.49/meal via Mom's Meals).[2][7]
- Car ownership or caregivers who can cook may disqualify.[1]
- Processing/waitlists vary regionally; verify delivery zone first.[1]

**Data shape:** Decentralized local programs with no uniform state eligibility/income test; must identify provider by county/zip via local AAA or Meals on Wheels America search; benefits/delivery customized per provider.

**Source:** No single statewide .gov site; use Meals on Wheels America provider search (mealsonwheelsamerica.org/find-meals-and-services/) or SC Area Agencies on Aging via local search.[4]

---

### SC Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set by federal guidelines (contact local provider for current table, as not specified in sources). For example, in South Carolina via Palmetto Goodwill[3].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Low employment prospects (implied need for job skills training)[4]
- U.S. citizen or eligible non-citizen (standard federal requirement, inferred)

**Benefits:** Part-time community service job training (average 20 hours per week) at non-profit/public sites like schools, hospitals, day-care, senior centers; paid highest of federal, state, or local minimum wage; on-the-job training (e.g., computer skills); resume-building experience; job placement assistance to unsubsidized employment[1][2][3][6]. Examples: child care, customer service, teachers’ aide, maintenance, health care[1].
- Varies by: priority_tier

**How to apply:**
- Contact local SCSEP provider: Palmetto Goodwill (South Carolina-specific grantee) - visit https://www.palmettogoodwill.org/service/senior-job-training/ or call local office (specific phone not listed; find via provider site)[3]
- National: Find local SCSEP office via https://www.ncoa.org/article/about-the-senior-community-service-employment-program-scsep/ or https://www.dol.gov/agencies/eta/seniors[1][2]
- In-person or phone via grantees like AARP Foundation SCSEP[6]

**Timeline:** Not specified; if eligible and no waitlist, enrolled promptly[1].
**Waitlist:** Possible waitlist depending on local availability; apply now to get on file as programs stabilize[1].

**Watch out for:**
- Priority enrollment: Veterans/qualified spouses first, then over 65, disabled, low literacy/English, rural, homeless/at-risk, low prospects, or prior AJC users[2].
- Temporary bridge program (not permanent job; aims for unsubsidized employment)[2][6].
- Income is family-based, not individual[1][2][3].
- Currently transitioning/stabilizing; waitlists common, apply early[1].
- Must be unemployed at enrollment[1][2][3].

**Data shape:** Federally uniform (age 55+, unemployed, <=125% FPL) but locally administered by grantees like Palmetto Goodwill in SC; priority tiers affect access; no fixed dollar table in sources (use current FPL); waitlists and availability vary regionally; part-time paid training only, not direct aid.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. DOL); SC-specific: https://www.palmettogoodwill.org/service/senior-job-training/[2][3]

---

### SC Legal Help for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not means-tested; no income or asset disclosure required for denial of services. Priority given to those with Greatest Economic Need (income at or below poverty line, generally 125%-200% of federal poverty guidelines in SC) or Greatest Social Need (non-economic factors like disabilities, language barriers, isolation). For referrals to SC Legal Services, household income typically at or below 125% of Federal Poverty Level, with some grant exceptions.[2][3]
- Assets: No asset limits or tests; assets not used to deny services. SC Legal Services considers assets (e.g., bank accounts, property) for their referrals, with some grant exceptions allowing higher limits.[2][3]
- South Carolina resident
- Greatest economic or social need prioritized (low-income minorities, limited English proficiency, rural residents)
- U.S. citizen or eligible non-citizen for related benefits
- Targeted to OAA-specified senior populations

**Benefits:** Free legal advice and representation by attorneys in 11 areas: income protection, health care, long-term care, nutrition, housing, utilities, protective services, guardianship/defense against guardianship, abuse, neglect, age discrimination.[4]
- Varies by: priority_tier

**How to apply:**
- Phone: statewide intake at 1-888-346-5592 (toll-free) or 803-744-9430 (Columbia); Monday-Thursday 9am-6pm
- Online: Submit application via SC Legal Services online form (sclegal.org/services/)
- Local: Contact Area Agency on Aging offices or SCLS local offices for non-English/Spanish
- Referrals: From Area Agencies on Aging to SC Legal Services or SC Bar Pro Bono

**Timeline:** Not specified in sources

**Watch out for:**
- Not means-tested, but prioritized by economic/social need—higher need gets served first
- No criminal cases; civil only
- Income/assets asked for referrals/resource matching, not denial
- Referrals to SC Legal Services if not qualifying under OAA (which has stricter 125% FPL)
- Must be provided by attorneys per state rules
- Resources inadequate for all seniors, so targeting applied

**Data shape:** No income/asset test for denial; priority-based via OAA targeting; delivered statewide via 10 Area Agencies on Aging with attorney requirement; referrals to means-tested programs like SCLS

**Source:** https://aging.sc.gov/programs-initiatives/legal-assistance-older-adults

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to all regardless of financial status.
- Assets: No asset limits or tests apply.
- Resident must be in a long-term care facility (nursing homes, assisted living, community residential care facilities, DDSN or DMH facilities) in South Carolina.
- Complaint must relate to quality of care, quality of life, rights violations, abuse/neglect, transfers/discharges, or benefits assistance.
- Available to residents, family members, friends, facility staff, or any concerned individual.

**Benefits:** Investigation and resolution of complaints; advocacy for resident rights; assistance with appeals/grievances; education on resident rights and benefits; information/referrals for long-term care services; mediation with facilities; promotion of dignity, respect, and quality care. No financial aid, hours, or dollar amounts provided.

**How to apply:**
- Phone: Statewide toll-free 1-800-868-9095 (SCDOA LTCOP hotline for abuse/neglect suspicions or complaints).
- Regional offices (e.g., Santee-Lynches: (803)774-1983 or sbrooks@slcog.org; Appalachian COG: (864) 242-9733 or ombudintake@scacog.org).
- Email or walk-in to regional offices.
- State office: (803) 734-9900.

**Timeline:** Not specified; ombudsmen investigate promptly, determine validity, mediate resolution, and follow up.

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy for resolving facility complaints; does not provide direct services like care or funding.
- Only for those already in long-term care facilities, not community-dwelling adults (separate reporting for community abuse).
- Complaints handled confidentially; identity not disclosed without permission, even if needed for resolution.
- Anyone can file, not just residents or family.
- No cost, but resolution depends on facility cooperation and complaint validity.

**Data shape:** no income/asset/age test; advocacy-only for LTC facility residents statewide via 10 regional offices; complaint-driven, not application for ongoing benefits

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program

---

### Homestead Exemption

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits apply.
- Assets: No asset limits apply.
- Must hold complete fee simple title, life estate, or be beneficiary of a trust holding title to primary legal residence[1][2][3][4][6][7]
- Must be legal resident of South Carolina for one calendar year as of December 31 preceding the tax year[1][2][3][4][6]
- Primary legal residence (domicile where resided for at least 12 months)[1][2][6]
- Totally and permanently disabled as declared by a state or federal agency, or legally blind as certified by a licensed ophthalmologist (alternatives to age 65)[1][2][3][4][6]

**Benefits:** $50,000 exemption from fair market value of primary legal residence for property tax calculation (full exemption if home valued at $50,000 or less)[1][2][3][4][6][7]

**How to apply:**
- In-person or mail to county auditor, assessor, or real property services office (varies by county, e.g., Greenville County Real Property Services[2], Charleston County Homestead Representative at (843) 958-4220[8])
- One-time application; once approved, continues automatically[1]

**Timeline:** Not specified; applies to subsequent tax years once approved[1][2]

**Watch out for:**
- Only applies to primary legal residence, not rentals/investments/mobile homes on leased land[1]
- If co-owned with non-spouse, exemption prorated by ownership interest[7]
- Must apply one-time even if moves to new qualifying residence[1][2]
- Confused with 4% legal residence special assessment (separate assessor application)[6][7]
- Spouse qualifies full exemption if on deed even if only one meets age/disability criteria[7]

**Data shape:** County-administered statewide program with no income/asset tests; one-time application; fixed $50k exemption; prorated for non-spousal co-ownership

**Source:** https://dor.sc.gov/property/exempt-property

---

### Elderly Simplified Application Project (ESAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Total monthly income must not exceed the SNAP income limit for the household size (exact dollar amounts follow standard SNAP limits and are not specified uniquely for ESAP in available data; refer to current SNAP charts at DSS for precise figures by household size)
- Assets: Not applicable (ESAP follows standard SNAP resource rules with no unique asset test specified; streamlined verification applies)
- All household members are 60 years or older
- No earned income (e.g., no salaries from work) in the household
- Household does not already receive SNAP benefits under South Carolina Combined Application Project (SCCAP)

**Benefits:** SNAP benefits (EBT card for food purchases); certification period extended up to 36 months; benefits issued from date of application filing if eligible
- Varies by: household_size

**How to apply:**
- Mail: Complete DSS ESAP Application (Form 16176 or DSS Form 16177 referenced) and send to ESAP, South Carolina Department of Social Services, PO Box 100203, Columbia, SC 29202
- Online assistance via partners like SC Thrive (scthrive.org/seniors)
- Simplified initial application with limited verification; annual one-page mail-in form (no recertification interview required)

**Timeline:** Notified in writing of decision; benefits from date filed if eligible (exact processing days not specified)

**Watch out for:**
- Excludes households already in SCCAP
- No earned income allowed (only unearned income like Social Security permitted)
- Must meet standard SNAP income limits (not waived)
- Not for households with children or child-only cases
- Simplifications like no interview apply, but still requires annual mail-in form
- Distinguish from SCCAP: ESAP is for elderly-only with no earnings

**Data shape:** Streamlined SNAP demo for elderly-only households with no earnings; no unique income/asset tables (uses standard SNAP); extended certification to 36 months; no interview/recertification required; statewide with dedicated senior unit

**Source:** https://dss.sc.gov/assistance-programs/snap/how-do-i-apply/help-for-the-elderly/

---

### Eldercare Trust Fund

> **NEW** — not currently in our data

**Eligibility:**
- Income: No direct eligibility for individuals; grants awarded only to non-profit organizations in South Carolina whose programs support older adults aging in place[3][4].
- Assets: No asset limits apply, as this is not a direct benefit program for individuals[3][4].
- Non-profit organizations must propose innovative programs that help older adults remain in homes and communities with maximum independence and dignity[3][4]
- Programs must supplement, not replace, existing state services[3]

**Benefits:** Grants to non-profits for innovative services such as: training for first responders and caregivers on dementia/Alzheimer's; transportation programs; home modification programs; in-home mobility training for hearing/vision impairments; rapid Meals on Wheels for hospital discharges (bypassing long waitlists)[4][6]. Since 1992, over $580,000 awarded to more than 43 non-profits statewide[4].

**How to apply:**
- Not currently accepting applications for grants[4]
- Donations via SC State Income Tax Form Line 28 with I-330 Form, or check mailed to: South Carolina Department on Aging, 1301 Gervais Street, Suite 350, Columbia SC 29201[4]

**Timeline:** Not applicable for individuals; grant application process details not currently available as applications are closed[4][5]

**Watch out for:**
- Does not provide awards or services directly to individuals or families—only grants to non-profits[4]
- Common mistake: assuming it's a direct aid program like Medicaid; it's a grant fund for innovative community programs[3][4]
- Not currently accepting grant applications[4]
- Families must contact funded non-profits for services, which may have their own eligibility/waitlists (e.g., Meals on Wheels can take weeks/months without this funding)[6]

**Data shape:** Grants only to non-profits for innovative aging-in-place programs; no individual eligibility, income/asset tests, or direct applications—fund supplements existing services via community providers[3][4]

**Source:** https://aging.sc.gov/programs-initiatives/eldercare-trust-fund[4]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Healthy Connections Medicaid | navigator | state | simple |
| Community Choices Waiver | benefit | state | deep |
| South Carolina PACE (Program of All-Incl | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | medium |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| I-Care (SHIP) | resource | federal | simple |
| SC Meals on Wheels | benefit | federal | medium |
| SC Senior Community Service Employment P | employment | federal | deep |
| SC Legal Help for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Homestead Exemption | benefit | state | medium |
| Elderly Simplified Application Project ( | benefit | state | deep |
| Eldercare Trust Fund | benefit | state | medium |

**Types:** {"navigator":1,"benefit":10,"resource":3,"employment":1}
**Scopes:** {"state":6,"local":1,"federal":8}
**Complexity:** {"simple":4,"deep":7,"medium":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/SC/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **household_size and eligibility category**: 1 programs
- **priority_tier**: 4 programs
- **region**: 2 programs
- **program_tier**: 1 programs
- **household_size**: 2 programs
- **priority_tier and season**: 1 programs
- **not_applicable**: 4 programs

### Data Shape Notes

Unique structural observations from each program:

- **Healthy Connections Medicaid**: Healthy Connections is South Carolina's Medicaid program with income limits that vary substantially by household composition and eligibility category (children, parents, pregnant women, elderly, disabled). The program is administered centrally by SCDHHS but applicants interact with local county offices. For elderly applicants seeking nursing home coverage, both income/asset limits AND medical/functional need requirements apply. The program operates as a managed care system with mandatory enrollment and limited plan-switching windows. Specific benefit amounts and service limits are not detailed in publicly available sources—applicants must contact the program directly for detailed benefit information.
- **Community Choices Waiver**: Requires NFLOC assessment; benefits via managed care providers; priority tiers and reserved slots for at-risk individuals; income/assets tied to Medicaid FPL with specific tables
- **South Carolina PACE (Program of All-Inclusive Care for the Elderly)**: Not statewide; restricted to PACE organization service areas with regional providers. No income/asset test unique to PACE (unlike underlying Medicaid). Nursing home level of care certification required. Limited SC-specific details available.
- **Medicare Savings Programs (QMB, SLMB, QI)**: This program consists of three distinct tiers (QMB, SLMB, QI) with progressively higher income limits but narrower benefits. Income limits are the primary eligibility driver and change annually. Asset limits are uniform across all three programs. QI differs critically from the others by operating on a first-come, first-served basis with limited funding. South Carolina implements federal guidelines uniformly statewide with no regional variations. The program is administered through local SCDHHS offices, but specific office locations and contact information are not detailed in available sources.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled exemptions from gross income/asset tests if under limits; ESAP simplifies for all-60+ households; benefits/income scale by household size with elderly-specific gross/net rules and medical deductions.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: LIHEAP in South Carolina is a county-administered program with statewide income limits but regional variation in providers and processing. Benefits are seasonal (heating Oct-winter, cooling May-Sept) with fixed maximum amounts ($850 heating, $775 cooling, $1,500 crisis) and a cap of 2 services per calendar year. Elderly individuals are explicitly prioritized but there is no age requirement for eligibility. The program serves both renters and homeowners regardless of fuel type. Income limits scale by household size and are based on 60% of state median income, not federal poverty guidelines (though some priority determinations reference federal poverty levels).
- **Weatherization Assistance Program (WAP)**: Delivered via 8 regional community action agencies covering all counties; eligibility at 200% FPL with priority tiers; income tables by household size at local agencies; documentation varies slightly by provider.
- **I-Care (SHIP)**: no income test; counseling-only service for Medicare beneficiaries; delivered via statewide hotline and local AAAs; not an entitlement with waitlists or asset rules
- **SC Meals on Wheels**: Decentralized local programs with no uniform state eligibility/income test; must identify provider by county/zip via local AAA or Meals on Wheels America search; benefits/delivery customized per provider.
- **SC Senior Community Service Employment Program (SCSEP)**: Federally uniform (age 55+, unemployed, <=125% FPL) but locally administered by grantees like Palmetto Goodwill in SC; priority tiers affect access; no fixed dollar table in sources (use current FPL); waitlists and availability vary regionally; part-time paid training only, not direct aid.
- **SC Legal Help for Seniors**: No income/asset test for denial; priority-based via OAA targeting; delivered statewide via 10 Area Agencies on Aging with attorney requirement; referrals to means-tested programs like SCLS
- **Long-Term Care Ombudsman Program**: no income/asset/age test; advocacy-only for LTC facility residents statewide via 10 regional offices; complaint-driven, not application for ongoing benefits
- **Homestead Exemption**: County-administered statewide program with no income/asset tests; one-time application; fixed $50k exemption; prorated for non-spousal co-ownership
- **Elderly Simplified Application Project (ESAP)**: Streamlined SNAP demo for elderly-only households with no earnings; no unique income/asset tables (uses standard SNAP); extended certification to 36 months; no interview/recertification required; statewide with dedicated senior unit
- **Eldercare Trust Fund**: Grants only to non-profits for innovative aging-in-place programs; no individual eligibility, income/asset tests, or direct applications—fund supplements existing services via community providers[3][4]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in South Carolina?
