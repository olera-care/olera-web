# Florida Benefits Exploration Report

> Generated 2026-05-05 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 14 |
| New (not in our data) | 9 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 3 programs
- **advocacy**: 1 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Statewide Medicaid Managed Care Long-Term Care Program (SMMC-LTC) HCBS Waivers

- **min_age**: Ours says `65` → Source says `65 years or older, OR 18 years or older if eligible for Medicaid by reason of disability, OR 18 years or older with cystic fibrosis diagnosis requiring hospital level of care[3]` ([source](https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program[9]))
- **income_limit**: Ours says `$2816` → Source says `$2,543` ([source](https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program[9]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Services include: adult day health care, case management, respite care, attendant care, and other home and community-based services[4]. Specific service array and hours/dollar amounts not detailed in search results` ([source](https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program[9]))
- **source_url**: Ours says `MISSING` → Source says `https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program[9]`

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)

- **source_url**: Ours says `MISSING` → Source says `https://www.myflfamilies.com (Florida Department of Children and Families); https://www.medicare.gov/basics/costs/help/medicare-savings-programs`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap/))
- **income_limit**: Ours says `$1980` → Source says `$15,060` ([source](https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for eligible foods (fruits, vegetables, meat, dairy, grains; no hot foods/alcohol). Maximum allotments (48 states, Oct 2025-Sep 2026): 1-person $298; 2 $546; 3 $785; 4 $994; 5 $1,183; 6 $1,421; 7 $1,571; 8 $1,789 (+$218 each additional). Actual = max allotment minus 30% of net income (e.g., 2-person elderly: $546 - 30% net = benefit).[3][4]` ([source](https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap/`

### LIHEAP (Low-Income Home Energy Assistance Program)

- **income_limit**: Ours says `$2800` → Source says `$2,679` ([source](https://floridaliheap.com))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment to utility company for heating/cooling bills. Regular: $400 min to $1,350 max (heating/cooling). Crisis: up to $2,000. Amount based on income, size, fuel type.[4]` ([source](https://floridaliheap.com))
- **source_url**: Ours says `MISSING` → Source says `https://floridaliheap.com`

### SHINE (Serving Health Insurance Needs of Elders)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, unbiased, confidential one-on-one counseling and information on Medicare eligibility/enrollment/coverage, health plan choices, appeal rights, Medigap policies, long-term care insurance, prescription assistance resources, benefits for qualified Medicare beneficiaries (e.g., Extra Help/LIS, Medicare Savings Program/MSP), Medicare fraud; educational presentations and community events[2][3][4][5]` ([source](https://www.floridashine.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.floridashine.org`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://ahca.myflorida.com/medicaid/medicaid-policy-quality-and-operations/medicaid-policy-and-quality/medicaid-policy/federal-authorities/federal-waivers/program-of-all-inclusive-care-for-the-elderly))
  - Shape notes: Limited to specific counties/service areas (not statewide); no direct income/asset test for PACE but tied to Medicare/Medicaid financial rules; provided by designated centers like Florida PACE; enrollment via provider-specific in-home process
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.floridajobs.org/business-growth-and-partnerships/business-development/weatherization-assistance-program (Florida Dept. of Commerce; also energy.gov for state map)[1][8]))
  - Shape notes: Administered via regional subgrantees with county-specific providers and slight variations in income tables/priority; priority tiers use point system; docs heavily emphasized; no fixed statewide application portal
- **Home Delivered Meals (Meals on Wheels)** — service ([source](https://elderaffairs.org/programs-and-services/food-assistance/))
  - Shape notes: Decentralized/local administration by 67 counties with varying providers, zones, and income rules; tied to Medicaid waivers/SMMC LTC; no uniform statewide income table or fixed benefits
- **Alzheimer's Disease Initiative (ADI) Respite Services** — service ([source](https://elderaffairs.org/programs-services/bureau-of-elder-rights/alzheimers-disease-initiative/))
  - Shape notes: Decentralized via 11 regional AAAs with local providers and funding-driven availability; no statewide income/asset tables; diagnosis-specific with sliding co-pays[1][3][6]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://elderaffairs.org/programs-and-services/senior-community-service-employment-program-scsep/[1]))
  - Shape notes: Multiple grantees/providers across Florida create regional variations in offices and host sites; priority tiers affect access; income tied to annual federal poverty guidelines table (household size-based, not fixed in sources).
- **Legal Aid for Seniors (Area Agency Legal Services)** — service ([source](https://elderaffairs.org/programs-and-services/legal-services/))
  - Shape notes: Decentralized by county/Area Agency with varying providers, income screens (125-200% FPL or need-based), no uniform asset test; Helpline central intake refers locally
- **Home Care for the Elderly (HCE) Program** — service ([source](https://elderaffairs.org/programs-services/home-care-for-the-elderly/ (inferred from DOEA handbook; primary doc at https://www.agingcarefl.org/uploads/1/3/6/5/136526411/2020-chapter-6-home-care-for-the-elderly-program.pdf)[2]))
  - Shape notes: Requires live-in caregiver and 701B nursing home risk assessment; financial eligibility via ICP limits or SSI/QMB/SLMB; priority-tiered allocation via local DOEA contractors
- **Community Care for the Elderly (CCE) Program** — service ([source](Florida Department of Elder Affairs (specific URL not provided in available sources)))
  - Shape notes: CCE eligibility is based on age (60+), functional impairment, and risk of institutionalization rather than strict income/asset limits. The program prioritizes individuals at highest risk. Critical limitation: Available sources do not provide specific dollar amounts for benefits, detailed service descriptions, application contact information, processing timelines, or regional provider details. Families should contact the Florida Department of Elder Affairs directly for current, complete information.
- **Elder Options** — service ([source](https://agingresources.org/ (Elder Options site); https://elderaffairs.org/resources/aging-and-disability-resource-centers-adrcs/ (DOEA ADRCs); https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program/))
  - Shape notes: Delivered via regional ADRCs (Elder Options is one of 11); eligibility ties to Medicaid + CARES NFLOC; benefits personalized post-screening, not fixed amounts; waitlists and providers vary by PSA/region

## Program Details

### Statewide Medicaid Managed Care Long-Term Care Program (SMMC-LTC) HCBS Waivers


**Eligibility:**
- Age: 65 years or older, OR 18 years or older if eligible for Medicaid by reason of disability, OR 18 years or older with cystic fibrosis diagnosis requiring hospital level of care[3]+
- Income: 2022 income limit for HCBS waiver programs is 300% of the SSI income limit, or $2,543 per month for an individual[5]. Applicants whose income exceeds this amount may still qualify by establishing an income trust[5]
- Assets: For a single applicant in 2026, the asset limit is $2,000 in countable assets[7]. Home equity interest is treated separately: applicants living in the home or with intent to return home must have home equity interest no greater than $752,000 as of 2026[1]. Home equity is calculated as current home value minus outstanding mortgage; equity interest is the portion owned by the applicant[1]
- Must require Nursing Facility Level of Care (NFLOC) — determined by ability to complete Activities of Daily Living (mobility, bathing, dressing, eating, toileting) and Instrumental Activities of Daily Living (cleaning, cooking, shopping, paying bills), plus any cognitive or behavioral issues[7]
- Must be Florida resident[4]
- Must be U.S. citizen or legal resident (qualified noncitizen)[4]
- Medical certification completed via AHCA Form 5000-3008 ('Medical Certification for Medicaid Long-Term Care Services and Patient Transfer Form')[1]
- Comprehensive Assessment and Review for Long-Term Care Services (CARES) Program determines NFLOC eligibility[1]
- 60-month Look-Back Period: state reviews financial history for 60 months prior to application date; asset transfers at less than fair market value result in application denial and penalty period of ineligibility[7]
- Cannot have given away assets to become eligible[7]

**Benefits:** Services include: adult day health care, case management, respite care, attendant care, and other home and community-based services[4]. Specific service array and hours/dollar amounts not detailed in search results
- Varies by: Individual need and managed care plan offerings; all managed care plans must offer at least minimum required services per AHCA coverage policy[2]

**How to apply:**
- Online: Not specified in search results
- Phone: Not specified in search results
- Mail: Not specified in search results
- In-person: Not specified in search results

**Timeline:** Not specified in search results
**Waitlist:** Yes — there is a wait-list for this program[2]. Eligible individuals who meet clinical and financial requirements can be placed on a waiting list, unlike nursing home placement which cannot have a wait list[5]. Those with greatest need may receive priority[4]

**Watch out for:**
- This program has a waitlist — unlike nursing home Medicaid, eligible applicants can be placed on a waiting list[5]. Families should apply early even if immediate services aren't needed
- The 60-month Look-Back Period is strictly enforced — any asset transfers at less than fair market value within 5 years prior to application will result in denial and penalty period[7]
- Home equity limit of $752,000 (2026) applies only if applicant lives in home or has intent to return home; this is separate from the $2,000 asset limit[1]
- NFLOC requirement is strict — applicants must need full-time nursing home-level care, not just assisted living or basic home care[7]
- Multiple former HCBS waivers (Alzheimer's Disease Waiver, Nursing Home Diversion Waiver, Assisted Living for the Elderly Waiver, Consumer Directed Care Plus Waiver) have been discontinued and consolidated into SMMC-LTC[8] — families seeking these specific programs should know they no longer exist as separate programs
- Income limits can be exceeded if applicant establishes an income trust[5] — this is an important workaround not widely known
- Medical eligibility determination is handled by Department of Elder Affairs (DOEA), not AHCA[9] — applicants may need to work with DOEA specifically for clinical assessment

**Data shape:** This program is a consolidated managed care model combining former separate HCBS waivers. It is statewide but has a waitlist (unlike institutional nursing home care). Eligibility has both strict financial limits ($2,000 assets, $2,543/month income) and functional requirements (NFLOC). Home equity is treated separately from liquid assets. The program uses a managed care delivery model, meaning services are provided through managed care plans rather than fee-for-service. Specific service arrays, dollar amounts, hours, and application procedures are not detailed in available search results and would require direct contact with AHCA or DOEA for complete information.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program[9]

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; however, Medicaid eligibility (often required for full coverage) typically requires income under 300% of the Federal Benefit Rate ($2,901/month in 2025 for long-term care Medicaid). No household size variations specified for PACE; Medicaid rules apply separately and offer planning pathways to qualify.
- Assets: No asset limits for PACE enrollment; Medicaid eligibility (if needed) limits countable assets to $2,000 (excluding primary home). Medicaid planning professionals can assist with exemptions and strategies.
- At risk of institutionalization / certified by Florida as needing nursing home level of care
- Live in a designated PACE service area in Florida
- Able to live safely in the community with PACE services
- Medicare and/or Medicaid eligible (most participants dually eligible; assistance available to enroll in Medicaid if needed)
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice

**Benefits:** Comprehensive all-inclusive services at no additional cost (covered by Medicare/Medicaid): primary care (physician/nursing), acute care, adult day health care, end-of-life care, home care, home-delivered/congregate meals, hospital care, lab tests/x-rays/diagnostics, medical specialty services, medical supplies/appliances, nursing facility care, nutritional counseling, personal care, prescription drugs, recreational therapy, restorative therapies, social services, therapy services, transportation. Provided in home, community, nursing facility, or PACE center.
- Varies by: region

**How to apply:**
- Phone: Call Florida PACE Centers Enrollment Specialists at 786.933.7223 or TTY 800.955.8771 for pre-screening and guidance
- In-person: In-home visits by enrollment team (3 visits: paperwork, nurse health exam, state CARES level of care assessment)
- Medicaid assistance: PACE helps with enrollment if not already qualified

**Timeline:** Typically 2-3 months due to Department of Children and Families (DCF) and Florida Department of Elder Affairs requirements
**Waitlist:** Not mentioned; may vary by provider capacity

**Watch out for:**
- Not statewide—must live in a specific PACE service area (currently limited, e.g., Miami-Dade)
- Requires nursing home level of care certification but ability to live safely in community at enrollment
- No Medicare Advantage or hospice allowed—must disenroll first
- Medicaid not automatic; PACE assists but separate financial eligibility/process applies (planning needed if over limits)
- Voluntary enrollment; average participant is 76 with complex needs—may not suit all
- Not offered through standard Medicaid health plans

**Data shape:** Limited to specific counties/service areas (not statewide); no direct income/asset test for PACE but tied to Medicare/Medicaid financial rules; provided by designated centers like Florida PACE; enrollment via provider-specific in-home process

**Source:** https://ahca.myflorida.com/medicaid/medicaid-policy-quality-and-operations/medicaid-policy-and-quality/medicaid-policy/federal-authorities/federal-waivers/program-of-all-inclusive-care-for-the-elderly

---

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: {"description":"Income limits are based on Federal Poverty Level (FPL) and change annually on April 1. Limits vary by program tier and household size. A $20 general exclusion applies to unearned income in each program.[6]","QMB":{"basis":"100% FPL","individual_monthly":"$1,350","couple_monthly":"$1,824","note":"2026 limits; QMB has the lowest income threshold of the three programs[7]"},"SLMB":{"basis":"120% FPL","description":"Higher income limit than QMB; for those with higher incomes who don't qualify for QMB[1]"},"QI":{"basis":"135% FPL","description":"Highest income limit of the three programs[9]"},"household_size_note":"Income limits scale with household size. Under Florida's rules, household size includes all related individuals (by blood or marriage) who rely on the applicant for at least half their financial support.[6] Example: A family of four has QMB income limit of $2,600/month, compared to $1,350 for an individual.[6]"}
- Assets: {"QMB":{"individual":"$9,950","couple":"$14,910"},"SLMB":{"individual":"Same as QMB ($9,950)","couple":"Same as QMB ($14,910)"},"QI":{"individual":"$9,660","couple":"$14,470"},"note":"Asset limits are resources (savings, investments, etc.). Some states have no asset limit for certain programs; Connecticut has no asset limit for QI, but Florida enforces the limits listed above.[2] States may have more generous standards than federal minimums.[2]"}
- Must be enrolled in Medicare Part A[10]
- Must be a Florida resident[10]
- Must be a U.S. citizen or qualified non-citizen[10]
- Must have both Part A and Part B to qualify for SLMB or QI[3]

**Benefits:** N/A
- Varies by: program_tier (QMB > SLMB > QI in terms of coverage breadth)

**How to apply:**
- Contact your state Medicaid agency (Florida Department of Children and Families)[2]
- Online: Visit the Florida Department of Children and Families website (myflfamilies.com) for MSP applications[9]
- Phone: Contact your local Florida Medicaid office (specific number varies by county; call 1-877-411-6810 for general Florida Medicaid inquiries)
- Mail: Submit application to your county's Department of Children and Families office
- In-person: Visit your local DCF office

**Timeline:** Not specified in search results; varies by application method and county workload
**Waitlist:** QI program operates on first-come, first-served basis until annual funding is exhausted; no waitlist mentioned for QMB or SLMB[2][5]

**Watch out for:**
- QI program has finite annual funding. Even if you meet all eligibility criteria, you may be denied if funds are exhausted. You must reapply each year on a first-come, first-served basis.[2][5]
- Household size definition changed in Florida. It now includes all related individuals (by blood or marriage) who rely on the applicant for at least half their financial support, not just the applicant and spouse. This can significantly raise income limits but also make more people count toward the household.[6]
- You must have BOTH Part A and Part B to qualify for SLMB or QI; QMB requires only Part A enrollment.[3]
- A $20 general exclusion applies to unearned income, meaning you can have up to $20 more in unearned income and still pass the income test.[6]
- Providers cannot bill QMB beneficiaries for deductibles or coinsurance, but you may still receive a bill for a small Medicaid copayment if one applies.[4][5]
- Income limits change every April 1 based on Federal Poverty Level adjustments.[2]
- QMB automatically qualifies you for Extra Help with Medicare Part D prescription drugs, but SLMB and QI do not automatically include this benefit.
- Asset limits are strict and include savings, investments, and other resources. Some states (like Connecticut) have eliminated asset limits for certain programs, but Florida has not.[2]

**Data shape:** This program's structure is tiered by income level (QMB < SLMB < QI), with benefits inversely proportional to income eligibility. QMB is most restrictive on income but most generous on benefits; QI is least restrictive on income but most limited on benefits and funding. Household size significantly affects income limits and is defined broadly in Florida to include all dependent relatives. QI's first-come, first-served funding model creates a unique annual enrollment dynamic where eligibility does not guarantee enrollment. Income limits reset annually on April 1.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.myflfamilies.com (Florida Department of Children and Families); https://www.medicare.gov/basics/costs/help/medicare-savings-programs

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: Seniors (60+) only need to meet the net income limit (≤100% Federal Poverty Level, after deductions). Gross income limit is ≤200% FPL for most households. For 2025: $15,060/year ($1,255/month) for 1 person; $20,440/year ($1,703/month) for 2 people. Net income calculated by subtracting standard deduction, medical expenses >$35/month, shelter costs, etc. Full table varies by household size and year; check current FPL via DCF.[2][5][6]
- Assets: Households with elderly (60+) or disabled: $4,500 limit (or $3,000 if disqualified member). Countable: bank accounts, cash value of life insurance, income-producing property. Exempt: primary home, household goods, retirement savings (most), one vehicle (often), personal property.[2][5][6]
- U.S. citizen or qualified non-citizen (lawfully present).
- Florida resident.
- Provide Social Security number or proof of application.
- Proof of identity.
- No work requirement for 60+ (exempt); ages 59-64 without dependents may need 80 hours/month work/training.
- Not ineligible due to drug trafficking conviction, fleeing felony, etc.
- Household includes those who buy/prepare food together.

**Benefits:** Monthly EBT card benefits for eligible foods (fruits, vegetables, meat, dairy, grains; no hot foods/alcohol). Maximum allotments (48 states, Oct 2025-Sep 2026): 1-person $298; 2 $546; 3 $785; 4 $994; 5 $1,183; 6 $1,421; 7 $1,571; 8 $1,789 (+$218 each additional). Actual = max allotment minus 30% of net income (e.g., 2-person elderly: $546 - 30% net = benefit).[3][4]
- Varies by: household_size

**How to apply:**
- Online: ACCESS Florida at https://www.myflfamilies.com/service-programs/access/ [1][7]
- Phone: Florida DCF ACCESS helpline 1-866-762-2237
- Mail: Download form from ACCESS site, mail to local DCF office
- In-person: Local DCF service centers (find via https://www.myflfamilies.com/service-centers/)

**Timeline:** Typically 30 days; expedited if very low income (<$150 gross, <$100 cash). Interview required.[1]

**Watch out for:**
- Seniors often miss high medical deductions (out-of-pocket >$35/month) that lower net income.
- Social Security/pensions count as income; report all household members who share food.
- Assets exempt for most seniors but check if disqualified member.
- Must report income >130% FPL or work hours <80 (if applicable) within 10 days.
- Only ~half of eligible seniors apply; benefits usable at farmers markets/online.
- No asset test waived unless income >200% FPL in some cases.

**Data shape:** Elderly households exempt from gross income test (net only); higher asset limit ($4,500); deductions heavily favor seniors (medical/shelter); benefits scale by household size and net income (max - 30% net); statewide uniform via DCF.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap/

---

### LIHEAP (Low-Income Home Energy Assistance Program)


**Eligibility:**
- Income: Gross household income at or below 60% State Median Income (SMI) for up to 8 members or 150% Federal Poverty Guidelines (FPG) for 9+ members. Monthly limits (past 30 days): 1 person $2,679; 2 $3,504; 3 $4,328; 4 $5,153; 5 $5,977; 6 $6,802. Automatic eligibility if receiving SNAP, TANF, or SSI.[2][4][6]
- Assets: No asset limit.[4]
- Reside in Florida and specific service county (e.g., Palm Beach, Hillsborough, Osceola, Indian River, Okeechobee).
- Responsible for paying home heating/cooling bills (utility bill in household member's name).
- At least one household member is U.S. citizen, permanent resident, or qualified alien (report all household incomes regardless of status).
- Priorities: households with child ≤5, senior ≥60, or disabled member.[6]

**Benefits:** One-time payment to utility company for heating/cooling bills. Regular: $400 min to $1,350 max (heating/cooling). Crisis: up to $2,000. Amount based on income, size, fuel type.[4]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://floridaliheap.com (check eligibility/apply; currently not accepting—contact local agency).[3][7]
- Local agencies by county (e.g., Economic Opportunities Council for Indian River/Okeechobee: https://eocofirc.net/liheap/; Palm Beach: https://discover.pbc.gov/communityservices/communityaction/pages/utility-assistance.aspx; Hillsborough: https://hcfl.gov/residents/human-services/financial-assistance/apply-for-energy-assistance).[1][3][6]
- Phone/mail/in-person via local providers (specific numbers/sites per county; e.g., Osceola Generations: https://osceolagenerations.org/low-income-home-energy-assistance-program/).[5]

**Timeline:** Not specified; varies by local agency and demand.
**Waitlist:** Possible during peak times; applications may pause when funds low.[7]

**Watch out for:**
- Not statewide—must use county-specific provider; applications often pause when funds deplete.
- Report ALL household incomes, even non-citizens/roommates on same bill.
- No automatic elderly age requirement, but seniors ≥60 prioritized in some areas.
- Crisis aid higher but requires emergency proof (e.g., shutoff).
- May need to pay current bill before benefit awards in some counties.
- Benefits to utility, not cash; one-time per season typically.[2][4][5][6]

**Data shape:** County-administered with local providers; income dual-tested (60% SMI/150% FPG); benefits tiered by regular/crisis, household factors; no assets test; funding-limited with pauses.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://floridaliheap.com

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Total gross household income must not exceed 200% of the Federal Poverty Guidelines. Exact limits vary by year, region, and agency; examples include: for one agency (older data): 1-person household $27,180/year, 2-person $36,620, 3-person $46,060, 4-person $55,500, 5-person $64,940, 6-person $74,380, 7-person $83,820, 8-person $93,260 (add $9,440 per additional person); another (2023): 1-person $29,160, 2-person $39,440, up to 8-person $101,120 (add $10,280 per additional). Households receiving SSI or TANF may qualify automatically. Always verify current limits with local agency as they update annually[1][2][3][4].
- Assets: No asset limits mentioned in sources[1][2][4].
- Florida resident, often restricted to specific counties served by local agencies (e.g., Hillsborough, Hernando, Pasco, Polk, Sumter, Citrus, Volusia for You Thrive Florida; Franklin, Gulf, Gadsden, Jefferson, Leon, Wakulla for Capital Area; Miami-Dade for that county's program)[1][4][6].
- Homeowner or renter (renters eligible, but landlord consent may be needed; services free to landlord)[2][4].
- Proof of income for all household members over last 12 months[1].
- Preference (not requirement) for elderly (60+), disabled, families with children under 12, high energy burden (high utility bills), LIHEAP participants[1][2][4][5].

**Benefits:** Free energy efficiency home improvements including attic insulation, low-flow showerheads, water heater jackets, energy-efficient light bulbs, weather-stripping, energy recovery ventilation (ERV) fans, repair/replacement of exterior doors, windows, refrigerators, water heaters, heating/cooling systems. Not a window replacement program. Maximum grant per household up to $2,600 in some cases, based on formula[1][3][6].
- Varies by: priority_tier|region

**How to apply:**
- Contact local WAP agency by county/region (e.g., You Thrive Florida for specific counties: youthrivefl.org/program/weatherization-assistance-program/; Central Florida Community Action: cfcaa.org/weatherization/, email info@cfcaa.org; Miami-Dade: miamidade.gov/global/service.page?Mduid_service=ser1541190292258414)[1][5][6].
- Statewide: Florida Department of Commerce (administers funds); find local providers via doe.state.fl.us or energy.gov map for state contacts[1][8].
- No universal online form; apply through local subgrantees (community action agencies, non-profits)[2][8].
- Phone/email/in-person via local agency (specific numbers not listed; use agency sites)[1][5].

**Timeline:** Not specified in sources; varies by local agency[2].
**Waitlist:** Likely due to funding limits and priority ranking (e.g., points for elderly/disabled/children/high burden); high demand implied[1][4].

**Watch out for:**
- Not available statewide uniformly—must find exact local provider for your county; not all FL counties listed in sources[1][4][6].
- Not a window replacement program despite common misconception[1].
- Income verification strict (12 months, specific docs only; no bank statements/self-taxes)[1].
- Priority-based (elderly/disabled get preference, but not guaranteed; waitlists common)[1][4].
- Renters need landlord approval; homeowners need ownership proof[1][4].
- Income limits change annually—verify current 200% FPG with agency[1][2][5].
- Scam alert: Staff never ask for personal info for 'payroll updates'[1].

**Data shape:** Administered via regional subgrantees with county-specific providers and slight variations in income tables/priority; priority tiers use point system; docs heavily emphasized; no fixed statewide application portal

**Source:** https://www.floridajobs.org/business-growth-and-partnerships/business-development/weatherization-assistance-program (Florida Dept. of Commerce; also energy.gov for state map)[1][8]

---

### SHINE (Serving Health Insurance Needs of Elders)


**Eligibility:**
- Income: No income or asset limits; open to all current and prospective Medicare beneficiaries, their families, and caregivers[2][3][5]
- Assets: No asset limits or exclusions specified; program has no financial eligibility requirements[2][3]
- Must be a Medicare beneficiary or prospective beneficiary in Florida
- Services available to beneficiaries, families, and caregivers[2][3][5]

**Benefits:** Free, unbiased, confidential one-on-one counseling and information on Medicare eligibility/enrollment/coverage, health plan choices, appeal rights, Medigap policies, long-term care insurance, prescription assistance resources, benefits for qualified Medicare beneficiaries (e.g., Extra Help/LIS, Medicare Savings Program/MSP), Medicare fraud; educational presentations and community events[2][3][4][5]

**How to apply:**
- Phone: Toll-free 1-800-963-5337 (Elder Helpline)[1][2]
- Website: www.floridashine.org (find counseling sites, virtual classes, volunteer application)[1][2]
- Local Area Agency on Aging sites (in-person counseling, events, webinars)[3][4]
- Email: chanslera@elderaffairs.org[1]

**Timeline:** No formal application processing; counseling provided upon contact, year-round via volunteers[4]

**Watch out for:**
- Not an insurance provider or seller; volunteers do not recommend or sell plans, only provide unbiased info[3][4]
- Does not directly pay premiums or provide healthcare; helps navigate/apply for Medicare Savings Programs, Extra Help, etc.[5][6]
- Services via volunteer network; availability depends on local AAA schedules/events[3][4]
- Families must contact SHINE or local AAA to connect with counselor; no central enrollment[2]

**Data shape:** no income test; volunteer-based counseling statewide via local Area Agencies on Aging; focuses on Medicare navigation rather than direct financial aid

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.floridashine.org

---

### Home Delivered Meals (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by program and region; some require household income at or below 130% of Federal Poverty Level (e.g., Feeding South Florida programs), but many Meals on Wheels and Medicaid programs do not impose strict income limits. No statewide dollar amounts or household size table specified; Medicaid programs follow federal poverty guidelines where applicable[5][7].
- Assets: No asset limits mentioned across sources.
- Homebound or difficulty shopping/preparing meals
- Disabled (under 60 in some cases)
- Reside in delivery/service zone
- Enrolled in Medicaid SMMC LTC or qualifying Medicare Advantage/Medicaid plan
- Assessed need via local agency (e.g., inability to cook, mobility issues)
- For Medicaid: meet level of care for nursing home as determined by CARES assessment[2][4][7]

**Benefits:** Nutritionally balanced home-delivered meals (hot, frozen, or special diet); quantity varies: e.g., 10 meals per authorization (general Medicaid), unlimited post-hospital discharge with prior auth, 1 disaster kit annually. Provided at little/no cost if eligible via Medicaid/Medicare Advantage; otherwise purchasable at ~$9.49/meal[1][3][4].
- Varies by: priority_tier|region

**How to apply:**
- Phone: Elder Helpline 1-800-96-ELDER (800-963-5337) to find local ADRC
- Contact local Area Agency on Aging or Aging and Disability Resource Center (ADRC) by county
- For Medicaid: contact SMMC LTC case manager or plan
- In-person: local ADRC offices
- Health plan contact for Medicare Advantage/Medicaid recipients

**Timeline:** Varies; some within 1 week, longer with waitlists[2].
**Waitlist:** Common in some local programs due to capacity; varies by region[2].

**Watch out for:**
- Not automatic; requires local assessment and homebound verification—car ownership or family cooks may disqualify[2]
- Many programs have waitlists; not all 60+ qualify without demonstrated need
- Medicaid-specific (SMMC LTC) vs. community Meals on Wheels differ; check health plan first if enrolled[1][7]
- Service zones strictly enforced—outside areas ineligible[2]
- Spouses/dependents sometimes covered, but verify locally

**Data shape:** Decentralized/local administration by 67 counties with varying providers, zones, and income rules; tied to Medicaid waivers/SMMC LTC; no uniform statewide income table or fixed benefits

**Source:** https://elderaffairs.org/programs-and-services/food-assistance/

---

### Alzheimer's Disease Initiative (ADI) Respite Services

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Sliding scale co-payment determined by income; no specific dollar amounts or household size table provided in sources[3]
- Assets: No asset limits mentioned
- Diagnosis of Alzheimer's disease or related dementia/memory disorders
- Functionally impaired and at risk of premature nursing home placement
- Available funding
- Provided through local Area Agency on Aging (AAA) assessment[1][3]

**Benefits:** In-home respite, adult day care (facility-based), emergency respite, extended respite (up to 30 days); case management, caregiver support/training, consumables/medical supplies, therapeutic activities[1][2][3][8]
- Varies by: region

**How to apply:**
- Phone: Elder Helpline at 1-800-96-ELDER (1-800-963-5337) to contact local Area Agency on Aging (AAA)
- In-person: Local AAA or Aging and Disability Resource Center (ADRC)
- Broward County example: Phone 954-357-6622, Email ElderlyandVeterans@broward.org[1][2][3]

**Timeline:** Not specified
**Waitlist:** Availability of funding affects access; potential waitlists implied but not detailed[3]

**Watch out for:**
- Must contact local AAA via Elder Helpline for exact eligibility—no centralized application
- Sliding scale co-pays based on income (not free for all)
- Services depend on funding availability and local AAA capacity
- Targeted at caregivers of those with memory disorders; age may vary locally (e.g., 18+ in some areas like Broward)[3][5]
- Not a generic elder program—requires Alzheimer's/dementia diagnosis[1][3]

**Data shape:** Decentralized via 11 regional AAAs with local providers and funding-driven availability; no statewide income/asset tables; diagnosis-specific with sliding co-pays[1][3][6]

**Source:** https://elderaffairs.org/programs-services/bureau-of-elder-rights/alzheimers-disease-initiative/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are based on HHS Poverty Guidelines (not specified in sources for current year; contact local provider for table).[1][2][3]
- Assets: No asset limits mentioned in sources.
- Unemployed
- Poor employment prospects
- Priority to: veterans and qualified spouses, individuals over 65, those with disabilities, low literacy or limited English proficiency, rural residents, homeless or at risk of homelessness, or those who failed to find employment after American Job Center services[2]

**Benefits:** Part-time community service work-based job training (average 20 hours per week) at nonprofits/public facilities (e.g., schools, hospitals, senior centers); paid the highest of federal, state, or local minimum wage; job placement assistance to unsubsidized employment; typically lasts about 6 months.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Contact Florida Department of Elder Affairs (DOEA) via elderaffairs.org/programs-and-services/senior-community-service-employment-program-scsep/[1]
- AARP Foundation SCSEP locator: my.aarpfoundation.org/locator/scsep/ (enter zip code for local office)[7]
- Orange County example: Call Orange County Workforce Solutions Center at 866-500-6587[4]
- National: Contact local SCSEP grantees (AARP Foundation, NCBA, NUL, DOEA) or American Job Centers[1][2][6]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; program may have transitions/delays due to federal funding[3]

**Watch out for:**
- Income test is strict at 125% federal poverty level—verify current guidelines as they update yearly.
- Priority enrollment tiers may delay non-priority applicants.
- Temporary bridge program (avg. 6 months) aimed at unsubsidized jobs, not long-term employment.
- Funded 90% federally with 10% state/local match; subject to funding changes/delays[1][3].
- Must have poor employment prospects; not for currently employed.

**Data shape:** Multiple grantees/providers across Florida create regional variations in offices and host sites; priority tiers affect access; income tied to annual federal poverty guidelines table (household size-based, not fixed in sources).

**Source:** https://elderaffairs.org/programs-and-services/senior-community-service-employment-program-scsep/[1]

---

### Legal Aid for Seniors (Area Agency Legal Services)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by provider and region; no strict statewide limits. Florida Senior Legal Helpline uses income guidelines (specific dollar amounts not listed; callers screened by phone). Some providers like Community Legal Services cap at 125% Federal Poverty Guidelines, Legal Aid Society of Palm Beach at 200%. Others like Coast to Coast Legal Aid (Broward) target greatest economic/social need without specific financial requirements[1][2][3][5].
- Assets: No asset test for Florida Senior Legal Helpline; asset guidelines may apply at some local providers like Community Legal Services[2][5].
- Florida resident age 60+ (or caregivers 18+ for frail seniors 60+, or grandparent caregivers 55+ with minors in some programs)
- U.S. citizen or permanent resident for Helpline
- Legal issue in provider's service county
- Civil matters only (not criminal)
- Greatest economic/social need prioritized at some providers
- Power of Attorney required if calling for another person[1][4][5][6]

**Benefits:** Free legal advice, brief services, representation, and referrals for civil issues including housing, health/public benefits, abuse/exploitation, consumer, advance directives, disaster response, family law, probate, Medicaid/Medicare, Social Security/SSI, elder abuse, relative caregiver[1][4][5][6].
- Varies by: priority_tier|region

**How to apply:**
- Phone: Florida Senior Legal Helpline 1-888-895-7873 (statewide screening and appointments)
- Phone (Broward example): 954-765-8955, 954-736-2450, 954-736-2496
- Online: Florida Application for Legal Assistance (via elderaffairs.org providers list)
- Online (Community Legal Services): Complete application at their site for Brevard etc. counties
- Referrals to local providers via Helpline[4][5][6]

**Timeline:** Telephone appointment scheduled after screening; most receive answers in initial call (no specific timeline stated)[4][5].
**Waitlist:** Not mentioned; prioritization by need may imply delays[1].

**Watch out for:**
- Not a single statewide program; must contact local Area Agency provider or Helpline for county-specific rules
- Targets greatest need even without strict income limits—may deny if not prioritized
- Brief advice common, not always full representation; referrals if needed
- Civil only, no criminal; own legal problem required unless POA
- Varying income thresholds by provider/county; domestic violence/elder cases sometimes exempt
- Caregivers must self-identify and verify[1][2][3][4][5]

**Data shape:** Decentralized by county/Area Agency with varying providers, income screens (125-200% FPL or need-based), no uniform asset test; Helpline central intake refers locally

**Source:** https://elderaffairs.org/programs-and-services/legal-services/

---

### Home Care for the Elderly (HCE) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Must have self-declared income and assets not exceeding Institutional Care Program (ICP) limits established by Medicaid and DCF. SSI, Qualified Medicare Beneficiary (QMB), or Special Low-Income Medicare Beneficiary (SLMB) recipients automatically meet financial eligibility. Specific 2026 ICP limits not detailed in sources; for reference, single Medicaid nursing home applicants have income under $2,982/month[2][3].
- Assets: Assets must not exceed ICP limits (specific dollar amounts align with Medicaid ICP; e.g., single applicant under $2,000 for nursing home context). Counts standard countable assets per Medicaid rules; exemptions not detailed for HCE but follow ICP (e.g., primary home often exempt)[2][3].
- Florida resident with intent to remain in state
- At risk of nursing home placement based on 701B assessment
- Living in the home with an adult caregiver (age 18+), willing and able to provide care or assist in arranging services, qualified per case manager assessment and Rules 58H-1.006/58H-1.007 F.A.C.
- Private home meeting dwelling requirements

**Benefits:** In-home services provided by approved caregiver to prevent nursing home placement, including assistance with social, physical, and emotional needs in a family-type living arrangement. Specific services, hours, or dollar amounts not detailed; support tailored via case management[2].
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Department of Elder Affairs contractor (specific phone/website not in results; statewide Elder Helpline: implied via DOEA programs)
- Case management assessment process through local provider

**Timeline:** Not specified in sources
**Waitlist:** Not specified; potential due to priority-based allocation

**Watch out for:**
- Requires approved live-in caregiver (family or chosen adult) meeting specific qualifications; not for those living alone
- Financial eligibility ties to strict ICP limits (not SSI alone unless specified)
- Must be at risk of nursing home placement per 701B; not general home care
- Caregiver must pass assessment and meet Rule 58H-1.006 F.A.C.; background implied
- Separate from Medicaid home health (which needs physician order and skilled needs)[1][4]

**Data shape:** Requires live-in caregiver and 701B nursing home risk assessment; financial eligibility via ICP limits or SSI/QMB/SLMB; priority-tiered allocation via local DOEA contractors

**Source:** https://elderaffairs.org/programs-services/home-care-for-the-elderly/ (inferred from DOEA handbook; primary doc at https://www.agingcarefl.org/uploads/1/3/6/5/136526411/2020-chapter-6-home-care-for-the-elderly-program.pdf)[2]

---

### Community Care for the Elderly (CCE) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Income limits may vary or may not apply to this program.
- Assets: Not specified in available sources.
- Functional impairment (specific definition not provided in available sources)[4][5]
- At risk of institutionalization without CCE services[4][5]
- Priority given to individuals most at risk of institutionalization[4]
- Annual comprehensive assessment required to maintain eligibility[4][5]
- Cannot be dually enrolled in CCE and a Medicaid capitated long-term care program[4][5]

**Benefits:** Specific services not detailed in available sources. Program provides community-based care to prevent institutionalization.
- Varies by: priority_tier

**How to apply:**
- In-person intake assessment (specific office locations not provided in available sources)
- Phone contact (specific phone number not provided in available sources)
- Mail (specific mailing address not provided in available sources)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Dual enrollment restriction: Applicants cannot receive both CCE and Medicaid capitated long-term care services simultaneously[4][5]
- Annual reassessment required: Eligibility must be verified annually through comprehensive assessment[4][5]
- Functional impairment definition unclear: Available sources do not specify what constitutes qualifying functional impairment
- Income and asset limits not disclosed: Unlike Medicaid Nursing Home programs (which have specific limits[2]), CCE income and asset thresholds are not detailed in available sources
- Referral pathway: If applicant does not meet CCE criteria at intake, they must be referred to other appropriate agencies[4][5]

**Data shape:** CCE eligibility is based on age (60+), functional impairment, and risk of institutionalization rather than strict income/asset limits. The program prioritizes individuals at highest risk. Critical limitation: Available sources do not provide specific dollar amounts for benefits, detailed service descriptions, application contact information, processing timelines, or regional provider details. Families should contact the Florida Department of Elder Affairs directly for current, complete information.

**Source:** Florida Department of Elder Affairs (specific URL not provided in available sources)

---

### Elder Options

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Elder Options serves adults aged 60+ and their caregivers; financial eligibility follows Florida Medicaid rules, which vary by program. For single nursing home applicants in 2026: income under $2,982/month. Limits change annually and depend on marital status; use Medicaid Eligibility Test for specifics. Some programs require means test or co-payment.
- Assets: Medicaid asset limit: $2,000 for single person, $3,000 for married couple (both applying). Exempt: primary home (up to $585,000 if spouse resides there or intent to return), certain property. Other assets count toward limit.
- Medicaid eligible (financially via DCF, medically via DOEA/CARES)
- Nursing Facility Level of Care (NFLOC) determination by CARES for most long-term care services
- Functional need in Activities of Daily Living (ADLs) for some home-based services
- Screening/assessment required

**Benefits:** Home and community-based services (HCBS) to avoid nursing homes, including in-home care, assisted living support, caregiver respite, homemaker services, adult day care, personal care assistance, and alternatives to institutionalization. Specifics determined post-assessment; no fixed dollar amounts or hours—tailored to needs.
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-96-ELDER (1-800-963-5337) or Elder Helpline 1-800-262-2243
- Contact local Aging and Disability Resource Center (ADRC)
- In-person: Local ADRC office

**Timeline:** Varies; GUIDE program Medicare approval ~30 days post-assessment; general CARES assessment by nurse, followed by review.
**Waitlist:** Possible for services due to funding; managed by ADRCs

**Watch out for:**
- Not direct Medicaid—screens/referrals to SMMC-LTC or other programs; must meet both financial (DCF) and medical (DOEA/CARES) eligibility
- Services not guaranteed—depends on NFLOC, funding availability, waitlists
- Some programs need co-pays or means test; private pay options if ineligible
- CARES assessment required for level of care; failing it disqualifies LTC
- Regional ADRC handles intake—must contact correct local office

**Data shape:** Delivered via regional ADRCs (Elder Options is one of 11); eligibility ties to Medicaid + CARES NFLOC; benefits personalized post-screening, not fixed amounts; waitlists and providers vary by PSA/region

**Source:** https://agingresources.org/ (Elder Options site); https://elderaffairs.org/resources/aging-and-disability-resource-centers-adrcs/ (DOEA ADRCs); https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Statewide Medicaid Managed Care Long-Ter | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicaid Medicare Savings Programs (QMB, | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| SHINE (Serving Health Insurance Needs of | resource | state | simple |
| Home Delivered Meals (Meals on Wheels) | benefit | federal | deep |
| Alzheimer's Disease Initiative (ADI) Res | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors (Area Agency Legal | navigator | local | simple |
| Home Care for the Elderly (HCE) Program | benefit | state | deep |
| Community Care for the Elderly (CCE) Pro | benefit | state | deep |
| Elder Options | benefit | local | deep |

**Types:** {"benefit":11,"resource":1,"employment":1,"navigator":1}
**Scopes:** {"state":5,"local":3,"federal":6}
**Complexity:** {"deep":12,"simple":2}

## Content Drafts

Generated 14 page drafts. Review in admin dashboard or `data/pipeline/FL/drafts.json`.

- **Statewide Medicaid Managed Care Long-Term Care Program (SMMC-LTC) HCBS Waivers** (benefit) — 5 content sections, 8 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 8 FAQs
- **Medicaid Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 2 content sections, 8 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 3 content sections, 7 FAQs
- **LIHEAP (Low-Income Home Energy Assistance Program)** (benefit) — 0 content sections, 8 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 3 content sections, 8 FAQs
- **SHINE (Serving Health Insurance Needs of Elders)** (resource) — 0 content sections, 4 FAQs
- **Home Delivered Meals (Meals on Wheels)** (benefit) — 0 content sections, 8 FAQs
- **Alzheimer's Disease Initiative (ADI) Respite Services** (benefit) — 2 content sections, 8 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 0 content sections, 8 FAQs
- **Legal Aid for Seniors (Area Agency Legal Services)** (navigator) — 0 content sections, 4 FAQs
- **Home Care for the Elderly (HCE) Program** (benefit) — 0 content sections, 8 FAQs
- **Community Care for the Elderly (CCE) Program** (benefit) — 1 content sections, 8 FAQs
- **Elder Options** (benefit) — 0 content sections, 8 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **Individual need and managed care plan offerings; all managed care plans must offer at least minimum required services per AHCA coverage policy[2]**: 1 programs
- **region**: 2 programs
- **program_tier (QMB > SLMB > QI in terms of coverage breadth)**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **priority_tier|region**: 3 programs
- **not_applicable**: 1 programs
- **priority_tier**: 4 programs

### Data Shape Notes

Unique structural observations from each program:

- **Statewide Medicaid Managed Care Long-Term Care Program (SMMC-LTC) HCBS Waivers**: This program is a consolidated managed care model combining former separate HCBS waivers. It is statewide but has a waitlist (unlike institutional nursing home care). Eligibility has both strict financial limits ($2,000 assets, $2,543/month income) and functional requirements (NFLOC). Home equity is treated separately from liquid assets. The program uses a managed care delivery model, meaning services are provided through managed care plans rather than fee-for-service. Specific service arrays, dollar amounts, hours, and application procedures are not detailed in available search results and would require direct contact with AHCA or DOEA for complete information.
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to specific counties/service areas (not statewide); no direct income/asset test for PACE but tied to Medicare/Medicaid financial rules; provided by designated centers like Florida PACE; enrollment via provider-specific in-home process
- **Medicaid Medicare Savings Programs (QMB, SLMB, QI)**: This program's structure is tiered by income level (QMB < SLMB < QI), with benefits inversely proportional to income eligibility. QMB is most restrictive on income but most generous on benefits; QI is least restrictive on income but most limited on benefits and funding. Household size significantly affects income limits and is defined broadly in Florida to include all dependent relatives. QI's first-come, first-served funding model creates a unique annual enrollment dynamic where eligibility does not guarantee enrollment. Income limits reset annually on April 1.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly households exempt from gross income test (net only); higher asset limit ($4,500); deductions heavily favor seniors (medical/shelter); benefits scale by household size and net income (max - 30% net); statewide uniform via DCF.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: County-administered with local providers; income dual-tested (60% SMI/150% FPG); benefits tiered by regular/crisis, household factors; no assets test; funding-limited with pauses.
- **Weatherization Assistance Program (WAP)**: Administered via regional subgrantees with county-specific providers and slight variations in income tables/priority; priority tiers use point system; docs heavily emphasized; no fixed statewide application portal
- **SHINE (Serving Health Insurance Needs of Elders)**: no income test; volunteer-based counseling statewide via local Area Agencies on Aging; focuses on Medicare navigation rather than direct financial aid
- **Home Delivered Meals (Meals on Wheels)**: Decentralized/local administration by 67 counties with varying providers, zones, and income rules; tied to Medicaid waivers/SMMC LTC; no uniform statewide income table or fixed benefits
- **Alzheimer's Disease Initiative (ADI) Respite Services**: Decentralized via 11 regional AAAs with local providers and funding-driven availability; no statewide income/asset tables; diagnosis-specific with sliding co-pays[1][3][6]
- **Senior Community Service Employment Program (SCSEP)**: Multiple grantees/providers across Florida create regional variations in offices and host sites; priority tiers affect access; income tied to annual federal poverty guidelines table (household size-based, not fixed in sources).
- **Legal Aid for Seniors (Area Agency Legal Services)**: Decentralized by county/Area Agency with varying providers, income screens (125-200% FPL or need-based), no uniform asset test; Helpline central intake refers locally
- **Home Care for the Elderly (HCE) Program**: Requires live-in caregiver and 701B nursing home risk assessment; financial eligibility via ICP limits or SSI/QMB/SLMB; priority-tiered allocation via local DOEA contractors
- **Community Care for the Elderly (CCE) Program**: CCE eligibility is based on age (60+), functional impairment, and risk of institutionalization rather than strict income/asset limits. The program prioritizes individuals at highest risk. Critical limitation: Available sources do not provide specific dollar amounts for benefits, detailed service descriptions, application contact information, processing timelines, or regional provider details. Families should contact the Florida Department of Elder Affairs directly for current, complete information.
- **Elder Options**: Delivered via regional ADRCs (Elder Options is one of 11); eligibility ties to Medicaid + CARES NFLOC; benefits personalized post-screening, not fixed amounts; waitlists and providers vary by PSA/region

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Florida?
