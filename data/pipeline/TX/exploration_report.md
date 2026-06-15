# Texas Benefits Exploration Report

> Generated 2026-04-07 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 3.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 10 |
| New (not in our data) | 5 |
| Data discrepancies | 4 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 6 programs
- **financial**: 3 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid for the Elderly and People with Disabilities (MEPD)

- **income_limit**: Ours says `$967` → Source says `$2,982` ([source](https://www.yourtexasbenefits.com (state portal implied); https://www.hhs.texas.gov (HHSC)))
- **benefit_value**: Ours says `$5,000 – $20,000+/year in 2026` → Source says `Basic healthcare: physician visits, prescription drugs, emergency room, short-term hospital stays. Long-term care (if assessed need): varies by ADL assessment, may include Day Activity and Health Services (DAHS) such as meals/snacks, professional supervision, medication management, personal care assistance (toileting/tasks). Often requires enrollment in STAR+PLUS managed care plan[1][6]. No specific dollar amounts or hours stated.` ([source](https://www.yourtexasbenefits.com (state portal implied); https://www.hhs.texas.gov (HHSC)))

### Medicare Savings Programs (QMB, SLMB, QI, QDWI)

- **income_limit**: Ours says `$1,796` → Source says `$1,275` ([source](https://www.yourtexasbenefits.com (Texas HHSC); https://www.medicare.gov/basics/costs/help/medicare-savings-programs))
- **benefit_value**: Ours says `$2,000 – $8,000/year in 2026` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copayments [3][4][5]. SLMB: Part B premium only (~$185/mo 2025) [2]. QI: Part B premium only [1][2]. QDWI: Part A premium only for working disabled [2][5]. No standard Medicaid card; providers bill state directly (QMB) or ID card issued [1]. Automatic LIS for Part D [6].` ([source](https://www.yourtexasbenefits.com (Texas HHSC); https://www.medicare.gov/basics/costs/help/medicare-savings-programs))

### Weatherization Assistance Program (WAP)

- **income_limit**: Ours says `$2,660` → Source says `$23,940` ([source](https://www.tdhca.texas.gov/weatherization-assistance-program))
- **benefit_value**: Ours says `$5,000 – $8,000 in free improvements` → Source says `Free installation of weatherization materials including energy audits, sealing air leaks, insulation, inefficient appliance repairs/replacements, minor home repairs for health/safety, and energy education. Prioritizes energy efficiency and safety; no direct cash[1][3][5][6].` ([source](https://www.tdhca.texas.gov/weatherization-assistance-program))

### Meals on Wheels (via Texas Area Agencies on Aging)

- **benefit_value**: Ours says `$1,500 – $3,600/year in 2026` → Source says `Home-delivered nutritionally balanced meals (hot, cold, frozen, etc.) providing at least 33% of daily dietary reference intakes; typically 5 lunches per week; short-term service up to 6 weeks available; voluntary contributions requested but not required[1][3][7].` ([source](https://www.mealsonwheelsamerica.org/find-meals-and-services/ (national locator; contact local Texas Area Agency on Aging via state aging resources)))

## New Programs (Not in Our Data)

- **Texas Simplified Application Project (TSAP) for SNAP** — financial ([source](https://www.hhs.texas.gov/services/food/snap-food-benefits/texas-simplified-application-project-tsap-snap-food-benefits[3]))
  - Shape notes: Simplified application and assistance targeted exclusively at elderly (60+) or disabled households; statewide with phone-based local assisters; follows core SNAP income rules (165% FPL) but streamlined process.[1][2][4]
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.tdhca.texas.gov/comprehensive-energy-assistance-program-ceap))
  - Shape notes: LIHEAP in Texas is a decentralized program administered through 254 county-level community action agencies with varying capacity and processing times. Benefits scale by household size (income limits) and assistance type (heating, cooling, crisis). The program prioritizes elderly, disabled, and families with young children but does not have separate benefit tiers for these groups. Availability varies by season (heating/cooling) and by agency capacity. No asset limit exists, making it more accessible than some similar programs. The program integrates multiple LIHEAP-funded services under the Comprehensive Energy Assistance Program (CEAP) umbrella.
- **Health Insurance Counseling and Advocacy Program (HICAP/SHIP)** — service ([source](https://hhs.texas.gov/services/health/medicare))
  - Shape notes: This program is a COUNSELING AND REFERRAL SERVICE, not a direct benefit program. The critical distinction: HICAP helps families understand Medicare options and apply for OTHER programs (Medicare Savings Programs, Low-Income Subsidy, Medicaid) that provide actual financial assistance. Income and asset limits, if they exist, likely apply to the programs HICAP helps you access, not to HICAP counseling itself. The search results do not provide specific eligibility thresholds, processing timelines, or regional service variations — these details should be obtained by calling 1-800-252-9240 directly.
- **Family Caregiver Support Program** — service ([source](https://www.hhs.texas.gov/services/aging/family-caregiver-support))
  - Shape notes: Administered regionally via 28 AAAs with no uniform statewide income/asset tables or fixed benefits; services scale by local funding and priority (e.g., caregivers of 60+); no direct pay to caregivers, distinguishing from Medicaid self-direction programs.
- **Legal Aid for Seniors (via Area Agencies on Aging/Legal Hotlines)** — service ([source](https://texaslawhelp.org/article/area-agencies-on-aging-a-place-to-get-help (primary overview); https://txregionalcouncil.org/regional-programs/health-and-human-services/area-agencies-on-aging/ (AAA list)))
  - Shape notes: Decentralized across 28 regional AAAs covering all counties; no uniform income/asset table; services and priorities vary by local AAA; priority-based rather than strict eligibility

## Program Details

### Medicaid for the Elderly and People with Disabilities (MEPD)

> Last verified: 2026-04-04

**Eligibility:**
- Age: 65+
- Income: Specific 2026 income limits for MEPD are not explicitly stated in sources; general Medicaid long-term care single applicant limit is under $2,982/month. Varies by marital status and program; SSI recipients automatically qualify. No full household size table provided for MEPD specifically[1][3].
- Assets: Single applicant: $2,000 in countable assets. Couples: $3,000. Countable assets include cash, savings, investments, property (excluding primary residence). Exempt: primary home, one vehicle, personal belongings, household items, certain burial funds, life insurance policies[1][2][5].
- Texas resident
- U.S. citizen, national, permanent resident, or legal alien
- Aged 65+ or disabled (SSI qualifies automatically)
- For basic coverage: aged 65+ or disabled. For long-term care services: assessment of Activities of Daily Living (ADLs) ability; Nursing Facility Level of Care (NFLOC) for some services[1][2][4]

**Benefits:** Basic healthcare: physician visits, prescription drugs, emergency room, short-term hospital stays. Long-term care (if assessed need): varies by ADL assessment, may include Day Activity and Health Services (DAHS) such as meals/snacks, professional supervision, medication management, personal care assistance (toileting/tasks). Often requires enrollment in STAR+PLUS managed care plan[1][6]. No specific dollar amounts or hours stated.
- Varies by: priority_tier

**How to apply:**
- Online: YourTexasBenefits.com (implied state portal)
- Phone: 2-1-1
- In-person: local Texas Health and Human Services offices
- Mail: not specified

**Timeline:** Not specified in sources
**Waitlist:** No waitlist for basic MEPD or DAHS (entitlement if eligible); waitlists possible for other long-term waivers[1][6]

**Watch out for:**
- MEPD provides basic Medicaid; long-term services require separate ADL/NFLOC assessment—not automatic[1]
- Must enroll in regional STAR+PLUS plan for benefits[6]
- Assets strictly limited; spousal protections and spend-down strategies exist but complex[3]
- Estate recovery after death for certain costs[7]
- Distinguish from Nursing Home Medicaid or HCBS waivers with stricter NFLOC[1][3]

**Data shape:** Entitlement for basic coverage if financially/age-disabled eligible; long-term benefits tiered by functional ADL assessment, not NFLOC for all; regional managed care plans (STAR+PLUS); asset exemptions common but countable limits rigid at $2,000 single

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.yourtexasbenefits.com (state portal implied); https://www.hhs.texas.gov (HHSC)

---

### Medicare Savings Programs (QMB, SLMB, QI, QDWI)

> Last verified: 2026-04-04

**Eligibility:**
- Income: Income limits vary by program and are based on Federal Poverty Level (FPL), updated annually (typically April 1). Texas follows federal standards with state-specific figures. For 2025/2026 estimates from sources: QMB (≤100% FPL): Individual $1,275/mo, Couple $1,724/mo [4]; SLMB (100-120% FPL): Individual $1,526/mo, Couple $2,064/mo [4]; QI (120-135% FPL): Individual $1,715/mo, Couple $2,320/mo [4]; QDWI: Individual $5,105/mo, Couple $6,899/mo [4]. Older data (2022): QMB/SLMB/QI resources ≤$8,400 individual/$12,600 couple; QDWI ≤$4,000/$6,000 [1]. Recent resources ~$9,430-$9,950 individual/$14,130 couple for QMB/SLMB/QI [2][4]. No full household size table beyond individual/couple in Texas sources; must be Medicare-eligible (65+ or disabled). Limits do not vary by larger household size.
- Assets: Applicable to QMB, SLMB, QI (≤$9,430-$9,950 individual, $14,130 couple recent est.); QDWI stricter (≤$4,000 individual, $6,000 couple) [1][2][4]. Counts: bank accounts, stocks, bonds. Exempt: home, one car, burial plots, life insurance (details via state Medicaid). Texas follows federal resource rules [1].
- Must be eligible for Medicare Part A (QMB/SLMB/QI) or working disabled under 65 who lost premium-free Part A (QDWI) [2][3][4]
- Texas resident
- U.S. citizen or qualified immigrant
- Not receiving full Medicaid (QI/QMB restrictions) [1]

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copayments [3][4][5]. SLMB: Part B premium only (~$185/mo 2025) [2]. QI: Part B premium only [1][2]. QDWI: Part A premium only for working disabled [2][5]. No standard Medicaid card; providers bill state directly (QMB) or ID card issued [1]. Automatic LIS for Part D [6].
- Varies by: priority_tier

**How to apply:**
- Online: yourtexasbenefits.com [8]
- Phone: 2-1-1 or 877-541-7905 (Texas Health and Human Services) [1][8]
- Mail/in-person: Local HHSC office (find via 211texas.org) [8]
- Request forms from state Medicaid agency [3]

**Timeline:** QMB: First day of month after certification [1]; QI: Month of application, up to 3 months prior (same year) [1]; others vary, typically 45 days
**Waitlist:** QI: First-come, first-served, limited funds (possible waitlist or denial if capped) [2][6]

**Watch out for:**
- QI limited funding/first-come; apply early in calendar year [1][2][6]
- No full Medicaid benefits; only Medicare cost-sharing [1][5]
- Income/resources counted strictly; exempt assets often missed (home/car) [1]
- Eligibility retroactive limits (QI same-year only) [1]
- Automatic Part D LIS but must confirm [6]
- Outdated limits in sources; verify current FPL-based via HHSC as of 2026 [3]

**Data shape:** Tiered by program (QMB lowest income, broadest benefits; QI highest income, premium-only, capped); individual/couple only (no larger household); federal standards with Texas HHSC admin; annual FPL updates April 1

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.yourtexasbenefits.com (Texas HHSC); https://www.medicare.gov/basics/costs/help/medicare-savings-programs

---

### Texas Simplified Application Project (TSAP) for SNAP

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Follows standard SNAP rules in Texas: gross income at or below 165% of the federal poverty level (FPL). Exact dollar amounts vary by household size and are updated annually; consult current HHS Texas SNAP charts as specific tables not detailed in sources. Applies to households where all members are age 60+ or disabled.[1][2][4]
- Assets: Not specified in sources; follows standard SNAP asset rules unless simplified for this group. No unique exemptions detailed.[1]
- All household members must be age 60 or older, or living with disabilities (households where all members are elderly or disabled).[1][2][4]

**Benefits:** SNAP food benefits loaded on an EBT card for purchasing food at grocery stores, qualifying online retailers, and farmers' markets. Award amount determined upon approval; specific dollar values vary by household income, size, and eligibility (no fixed amounts listed).[1]
- Varies by: household_size

**How to apply:**
- Phone: Call 844.583.1500 to reach a local assister anywhere in Texas.[2]
- Mail: Download and complete the 'Texas Simplified SNAP Application' (paper form for elderly/disabled households), gather documentation, mail via certified mail.[1]
- Online: Not explicitly detailed for TSAP; standard SNAP online application available via YourTexasBenefits.com (implied).[1]

**Timeline:** Application completion: 30-45 minutes. Follow-up questions/processing: up to 30 days. Interview and decision: within 6-9 weeks.[1]

**Watch out for:**
- Only for households where ALL members are age 60+ or disabled; mixed households may not qualify for simplified process.[1][4]
- Must confirm eligibility for simplified paper application before using it.[1]
- Processing can take up to 9 weeks; expect phone calls, letters for more info, and an interview.[1]
- Benefits are SNAP-specific (food only), not cash or other services.[1][3]

**Data shape:** Simplified application and assistance targeted exclusively at elderly (60+) or disabled households; statewide with phone-based local assisters; follows core SNAP income rules (165% FPL) but streamlined process.[1][2][4]

**Source:** https://www.hhs.texas.gov/services/food/snap-food-benefits/texas-simplified-application-project-tsap-snap-food-benefits[3]

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross monthly income must not exceed the following: 1 Person: $2,815/month | 2 People: $3,681/month | 3 People: $4,547/month | 4 People: $5,414/month | 5 People: $6,280/month | 6 People: $7,146/month. These limits are based on 150% of the federal poverty guidelines or 60% of state median income, whichever is higher. In counties designated as major disaster or emergency areas by HHS or the President, Texas uses the highest of 150% poverty guidelines or 60% state median income.[1][2]
- Assets: There is no asset limit for LIHEAP in Texas.[2]
- Households must include at least one member with a utility bill in their name or be responsible for utilities.[2]
- Roommates covered by the same utility bill are counted as part of the same LIHEAP household.[2]
- Elderly, persons with disabilities, and households with young children do not have a limit on eligibility based on household composition.[1]
- Categorical eligibility is provided for households receiving SNAP, TANF, SSI, or means-tested veterans programs.[1]

**Benefits:** Heating Assistance: up to $12,300 maximum benefit (minimum $1). Cooling Assistance: up to $12,300 maximum benefit (minimum $1). Crisis Assistance: up to $2,400 maximum benefit for emergencies such as broken furnace or utility shutoff notice.[2]
- Varies by: household_size, fuel_type, and assistance_category

**How to apply:**
- Phone: (877) 399-8939 or 211 to reach a community agency in your area[3]
- Online: Visit 211Texas website to locate your local agency[3]
- In-person: Contact your local participating community action agency (Texas has multiple agencies throughout the state covering all 254 counties)[3][5]
- Example: Travis County CEAP accepts applications at seven locations, 8 a.m. to 5 p.m. Monday through Friday. Phone: (512) 584-4120[3]

**Timeline:** Once your application is received, it is placed on a waiting list for that site. When your turn comes up, a case worker will call you to discuss your application and next steps.[3] Specific processing timelines vary by local agency and current funding availability.
**Waitlist:** Yes. Applications are placed on a waiting list at the local agency. Processing depends on funding availability and agency capacity. Some agencies have reached capacity and are not accepting new applications.[3][4]

**Watch out for:**
- Funding is not guaranteed year-round. Heating assistance is typically available fall/winter, cooling assistance in summer, and crisis assistance only during emergencies.[2]
- Roommates on the same utility bill are counted as household members for income calculation purposes, which may push a household over the income limit.[2]
- Some local agencies have reached capacity and are not accepting new applications, even though the program exists statewide.[4]
- Applications are placed on waiting lists; there is no guarantee of immediate processing or approval.[3]
- Bank statements are NOT accepted for income verification; you must provide official award letters or paycheck stubs.[4]
- Documentation is required for every household member, not just the applicant.[4]
- LIHEAP defines households differently than other benefit programs like SNAP; roommates on the same utility bill are included in LIHEAP households.[2]
- Elderly, disabled, and households with young children receive priority in eligibility but do not have separate income limits.[1]
- All LIHEAP assistance is subject to available federal funding.[3]

**Data shape:** LIHEAP in Texas is a decentralized program administered through 254 county-level community action agencies with varying capacity and processing times. Benefits scale by household size (income limits) and assistance type (heating, cooling, crisis). The program prioritizes elderly, disabled, and families with young children but does not have separate benefit tiers for these groups. Availability varies by season (heating/cooling) and by agency capacity. No asset limit exists, making it more accessible than some similar programs. The program integrates multiple LIHEAP-funded services under the Comprehensive Energy Assistance Program (CEAP) umbrella.

**Source:** https://www.tdhca.texas.gov/comprehensive-energy-assistance-program-ceap

---

### Weatherization Assistance Program (WAP)

> Last verified: 2026-04-04

**Eligibility:**
- Income: Varies by funding source: LIHEAP WAP at 150% Federal Poverty Level (FPL), DOE WAP at 200% FPL. For 2026 (effective Jan 27, 2025):|Persons in Family/Household|LIHEAP WAP (150% FPL)|DOE WAP (200% FPL)|
|--|--|--|
|1|$23,940|$31,920|
|2|$32,460|$43,280|
|3|$40,980|$54,640|
|4|$49,500|$66,000|
|5|$58,020|$77,360|
|6|$66,540|$88,720|
|7|$75,060|$100,080|
|8|$83,580|$111,440|
|More than 8|Add $8,250/person|Add $11,000/person|. Income based on all sources for household members 18+ over last 30 days, annualized[3][4].
- Assets: No asset limits mentioned across sources.
- Must reside in a service area covered by a subrecipient (county-specific)
- Proof of income for last 30 days for all 18+ household members
- Proof of identity and residency/citizenship for all household members
- Homeowner or renter with landlord permission
- Services typically once every 15 years[6]

**Benefits:** Free installation of weatherization materials including energy audits, sealing air leaks, insulation, inefficient appliance repairs/replacements, minor home repairs for health/safety, and energy education. Prioritizes energy efficiency and safety; no direct cash[1][3][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact local subrecipient agency (full list at TDHCA site)
- Online portals (e.g., Travis County Application Portal)
- Phone: Local subrecipient or 211 (United Way HELPLINE for Harris County)
- Downloadable forms (e.g., Dallas County WAP Application)
- In-person/mail to local offices (e.g., Dallas County Health and Human Services, 2377 N. Stemmons Freeway, Dallas, TX 75207)

**Timeline:** Not specified; involves pre-screening, full application, home audit, then work scheduling.
**Waitlist:** Likely due to funding limits; varies by subrecipient and demand.

**Watch out for:**
- County-specific: Not statewide direct apply; find your subrecipient first.
- Two tiers (LIHEAP 150% FPL vs DOE 200% FPL); check which applies.
- Proof of income for last 30 days from ALL adult household members required.
- Renter needs landlord agreement; services once every 15 years.
- Funding limited, potential waitlists; no assets test but strict income proof.
- Elderly priority often via vulnerable categories, but no strict age cutoff.

**Data shape:** County-administered via subrecipients covering all TX; dual income tiers (150%/200% FPL); 30-day income proof; free services post-audit; elderly qualify if low-income/household vulnerable.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tdhca.texas.gov/weatherization-assistance-program

---

### Health Insurance Counseling and Advocacy Program (HICAP/SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older, OR Medicare-eligible at any age+
- Income: NOT SPECIFIED IN AVAILABLE SOURCES — Search results indicate the program serves 'people with limited incomes' but provide no dollar thresholds, household size tables, or asset limits
- Assets: NOT SPECIFIED IN AVAILABLE SOURCES
- Medicare beneficiary OR age 60+
- Family members and caregivers of Medicare beneficiaries also qualify for counseling

**Benefits:** FREE one-on-one counseling and assistance; group presentations; educational materials; referrals to other agencies; NO DIRECT FINANCIAL ASSISTANCE PROVIDED by this program
- Varies by: not_applicable — appears to be standardized counseling services

**How to apply:**
- Phone: 1-800-252-9240 (Toll Free)
- Website: https://hhs.texas.gov/services/health/medicare
- In-person: Texas Department of Aging and Disability Services, 701 West 51st Street, MC: W275, Austin, TX 78751
- Fax: (512) 438-3538

**Timeline:** NOT SPECIFIED IN AVAILABLE SOURCES
**Waitlist:** NOT SPECIFIED IN AVAILABLE SOURCES

**Watch out for:**
- THIS IS COUNSELING ONLY — HICAP/SHIP does not provide direct financial assistance or pay for insurance premiums. It helps you understand options and apply for programs that might help pay costs[4]
- Counselors are trained to help with Medicare Savings Programs (QMB, SLMB, QI) and Low-Income Subsidy (LIS) — these are the actual programs that provide financial help, not HICAP itself[2][4]
- The program name varies: called 'HICAP' in Texas, but it is the state's SHIP program[3]
- Counselors are certified and trained but are not attorneys — legal advice is available through partnerships but may be separate from basic counseling[3]
- No income or asset limits are publicly stated in available materials, suggesting the program may serve anyone Medicare-eligible or 60+, but this should be verified directly

**Data shape:** This program is a COUNSELING AND REFERRAL SERVICE, not a direct benefit program. The critical distinction: HICAP helps families understand Medicare options and apply for OTHER programs (Medicare Savings Programs, Low-Income Subsidy, Medicaid) that provide actual financial assistance. Income and asset limits, if they exist, likely apply to the programs HICAP helps you access, not to HICAP counseling itself. The search results do not provide specific eligibility thresholds, processing timelines, or regional service variations — these details should be obtained by calling 1-800-252-9240 directly.

**Source:** https://hhs.texas.gov/services/health/medicare

---

### Meals on Wheels (via Texas Area Agencies on Aging)

> Last verified: 2026-04-04

**Eligibility:**
- Age: 60+
- Income: No statewide income limits; income is not a criteria for service across multiple Texas providers. Some programs may use sliding-scale fees or offer free meals to low-income individuals, but no one is denied based on inability to contribute voluntarily[1][2][4].
- Assets: No asset limits mentioned in any sources.
- Homebound or unable to prepare nutritious meals due to physical, mental, or financial hardships[1][2][4][6]
- Reside in the specific service area or counties of the local provider[1][6][8]
- Difficulty shopping, preparing meals, or socializing; may include spouses, caregivers, or disabled under 60 if funding available[2][3][6]
- In-home assessment required to confirm need[1][3][4]

**Benefits:** Home-delivered nutritionally balanced meals (hot, cold, frozen, etc.) providing at least 33% of daily dietary reference intakes; typically 5 lunches per week; short-term service up to 6 weeks available; voluntary contributions requested but not required[1][3][7].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or specific Meals on Wheels provider by phone (examples: 817-336-0912 for Tarrant County[4], 903-593-7385 for East Texas[3], 254-770-2346 for Central Texas wellness coordination[7])
- Online referral forms (e.g., Meals on Wheels of Tarrant County referral form[4]; Meals on Wheels East Texas website[3])
- Email or website request for services[3]
- Referrals from family, physicians, hospitals, or social workers[3][4]

**Timeline:** Caseworker appointment typically within 2 working days after referral; full assessment follows[4].
**Waitlist:** Not mentioned; varies by local provider demand and funding[2].

**Watch out for:**
- Must live in exact service counties of local provider; verify coverage first[1][2][6]
- Homebound status and in-home assessment required; not for those who can easily leave home or have cooking help[1][2][4]
- Voluntary contributions expected but never mandatory; some programs have paid options like Silver Spoons for ineligible family[3]
- Primarily via local Area Agencies on Aging, not a single statewide application[2][7]
- Car ownership or outside support may disqualify[2]

**Data shape:** Decentralized by region with independent local providers under Area Agencies on Aging; no uniform income/asset tests; county-restricted service areas; eligibility based on assessed need rather than strict financial cutoffs

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mealsonwheelsamerica.org/find-meals-and-services/ (national locator; contact local Texas Area Agency on Aging via state aging resources)

---

### Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits or tables identified for this program in Texas; related programs like Community Care for the Aged and Disabled (CCAD) limit income to no more than three times the Supplemental Security Income benefit or three times the Federal Poverty Level, with assets up to $5,000 for individuals or $6,000 for couples. Caregiver assistance programs exclude those with family income >300% of federal poverty guidelines.
- Assets: Not specified for this program; in CCAD, countable assets ≤$2,000-$5,000 (individual) or $6,000 (couple), exempting home, one vehicle, household goods, personal effects, wedding/engagement rings, and irrevocable prepaid funeral plan.
- Program targets caregivers of elderly (typically 60+) or disabled adults; exact requirements vary by local Area Agency on Aging (AAA); care recipient often must be at risk of nursing home placement and not receiving duplicate services.

**Benefits:** Specific services include respite care, caregiver training, counseling, support groups, and supplemental services (e.g., assistive devices, home modifications); no fixed dollar amounts or hours statewide; may include limited cash assistance in related programs.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) via Texas Health and Human Services at 1-800-252-9240 or hhs.texas.gov/services/aging; in-person at local AAA offices; phone-based screening; no specific online form or statewide URL identified for direct application.

**Timeline:** Not specified; varies regionally.
**Waitlist:** Possible waitlists due to funding limits, varying by region.

**Watch out for:**
- Not a paid caregiver program—focuses on support services like respite, not direct wages (unlike STAR+PLUS Medicaid waiver or VA PCAFC); eligibility assessed for care recipient's needs, not caregiver income primarily; funding-limited with regional waitlists; often confused with Medicaid consumer-directed programs where family can be paid.
- Must contact local AAA as no centralized application.
- Duplicate services from other programs disqualify.

**Data shape:** Administered regionally via 28 AAAs with no uniform statewide income/asset tables or fixed benefits; services scale by local funding and priority (e.g., caregivers of 60+); no direct pay to caregivers, distinguishing from Medicaid self-direction programs.

**Source:** https://www.hhs.texas.gov/services/aging/family-caregiver-support

---

### Legal Aid for Seniors (via Area Agencies on Aging/Legal Hotlines)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific statewide income limits stated; priority given to low-income seniors, but services generally available to all aged 60+ without strict dollar thresholds. Varies by AAA; some prioritize low-income or underrepresented groups[1][2][6].
- Assets: No asset limits mentioned in sources.
- Texas resident
- Live in the service area of a specific AAA (covers all 254 counties via 28 AAAs)
- Priority for low-income, rural residents, disabled, dementia patients, limited English speakers, or caregivers[1][2][8]

**Benefits:** Legal assistance including advice/counseling (phone or in-person), document preparation for entitlements/health care/rights/housing, representation/advocacy in appeals or court; benefits counseling for Medicare/Medicaid/Social Security; money management, representative payee, guardianship; ombudsman advocacy for nursing/assisted living facilities[1][4][5][6]. No specific dollar amounts or hours stated.
- Varies by: priority_tier|region

**How to apply:**
- Phone: Call local AAA (examples: Houston-Galveston (281) 633-0519[3], Concho Valley (325) 223-5704[3], Tarrant County (817) 258-8000[3], East Texas (903) 218-6500[3])
- In-person: Local AAA offices (e.g., North Central Texas AAA serves specific counties[8]; full list via Texas Association of Regional Councils[4])
- Website: Local AAA sites (e.g., aaact.org for Central Texas[7], easttexasaaa.org[5], nctcog.org/aging-services[8])

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by region.

**Watch out for:**
- Not a single centralized program—must identify and contact the specific regional AAA for your county[1][4]
- No strict income test, but low-income get priority; not full legal representation for all cases[2][6]
- Under-60 services limited to certain Medicare-eligible disabled via CMS funding[6]
- Focuses on elder-specific issues like benefits/ombudsman, not general legal aid[1][4]

**Data shape:** Decentralized across 28 regional AAAs covering all counties; no uniform income/asset table; services and priorities vary by local AAA; priority-based rather than strict eligibility

**Source:** https://texaslawhelp.org/article/area-agencies-on-aging-a-place-to-get-help (primary overview); https://txregionalcouncil.org/regional-programs/health-and-human-services/area-agencies-on-aging/ (AAA list)

---

### Long-Term Care Ombudsman Program

> Last verified: 2026-04-04

**Eligibility:**
- Income: No income limits; services are free and available to all residents regardless of financial status[7][9].
- Assets: No asset limits or tests; no financial eligibility requirements apply[7].
- Must be a resident of a nursing facility or assisted living facility in Texas[7][4][9]
- Services also extend to certain caregivers and family members of persons 60 years or older[2]
- No age requirement for residents, though focused on older adults[1][3][7]

**Benefits:** Advocacy for residents' rights, investigation and resolution of complaints about quality of care and life, protection from abuse/neglect, assistance with grievances, access to records, participation in hearings, ensuring rights like dignity, privacy, medical information, freedom from restraints, and non-discrimination[4][7][9]; provided by trained volunteer or paid ombudsmen independent of facilities[3][7]. No specific dollar amounts, hours, or fixed quantities.

**How to apply:**
- Phone: 800-252-2412 to speak with an LTC ombudsman in your area[7]
- Email: contact form via ltco.texas.gov[7]
- In-person or local: Find an LTC Ombudsman in your area via ltco.texas.gov[7]
- No formal application or forms required for receiving services; contact directly for assistance[7]

**Timeline:** Immediate response upon contact; no formal processing as it's complaint-driven advocacy[7][9].

**Watch out for:**
- Not a service provider or eligibility-determining program—purely advocacy for existing long-term care residents, not for admission or financial aid[2][5][7]
- Volunteers must pass criminal checks and conflict screenings; program independent of facilities, Medicaid eligibility, or protective services[1][2][3]
- Confidentiality applies to all complaints[5]
- Does not provide direct care, housing, or benefits—focuses on rights protection and complaint resolution[4][7]
- Separate ombudsman for developmental disability state living centers[7]

**Data shape:** no income test; advocacy-only for residents of nursing homes/assisted living facilities; delivered via statewide network of local independent programs with volunteers; complaint-driven, no formal eligibility/application process

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ltco.texas.gov[7]

---

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **household_size**: 1 programs
- **household_size, fuel_type, and assistance_category**: 1 programs
- **not_applicable — appears to be standardized counseling services**: 1 programs
- **region**: 2 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid for the Elderly and People with Disabilities (MEPD)**: Entitlement for basic coverage if financially/age-disabled eligible; long-term benefits tiered by functional ADL assessment, not NFLOC for all; regional managed care plans (STAR+PLUS); asset exemptions common but countable limits rigid at $2,000 single
- **Medicare Savings Programs (QMB, SLMB, QI, QDWI)**: Tiered by program (QMB lowest income, broadest benefits; QI highest income, premium-only, capped); individual/couple only (no larger household); federal standards with Texas HHSC admin; annual FPL updates April 1
- **Texas Simplified Application Project (TSAP) for SNAP**: Simplified application and assistance targeted exclusively at elderly (60+) or disabled households; statewide with phone-based local assisters; follows core SNAP income rules (165% FPL) but streamlined process.[1][2][4]
- **Low-Income Home Energy Assistance Program (LIHEAP)**: LIHEAP in Texas is a decentralized program administered through 254 county-level community action agencies with varying capacity and processing times. Benefits scale by household size (income limits) and assistance type (heating, cooling, crisis). The program prioritizes elderly, disabled, and families with young children but does not have separate benefit tiers for these groups. Availability varies by season (heating/cooling) and by agency capacity. No asset limit exists, making it more accessible than some similar programs. The program integrates multiple LIHEAP-funded services under the Comprehensive Energy Assistance Program (CEAP) umbrella.
- **Weatherization Assistance Program (WAP)**: County-administered via subrecipients covering all TX; dual income tiers (150%/200% FPL); 30-day income proof; free services post-audit; elderly qualify if low-income/household vulnerable.
- **Health Insurance Counseling and Advocacy Program (HICAP/SHIP)**: This program is a COUNSELING AND REFERRAL SERVICE, not a direct benefit program. The critical distinction: HICAP helps families understand Medicare options and apply for OTHER programs (Medicare Savings Programs, Low-Income Subsidy, Medicaid) that provide actual financial assistance. Income and asset limits, if they exist, likely apply to the programs HICAP helps you access, not to HICAP counseling itself. The search results do not provide specific eligibility thresholds, processing timelines, or regional service variations — these details should be obtained by calling 1-800-252-9240 directly.
- **Meals on Wheels (via Texas Area Agencies on Aging)**: Decentralized by region with independent local providers under Area Agencies on Aging; no uniform income/asset tests; county-restricted service areas; eligibility based on assessed need rather than strict financial cutoffs
- **Family Caregiver Support Program**: Administered regionally via 28 AAAs with no uniform statewide income/asset tables or fixed benefits; services scale by local funding and priority (e.g., caregivers of 60+); no direct pay to caregivers, distinguishing from Medicaid self-direction programs.
- **Legal Aid for Seniors (via Area Agencies on Aging/Legal Hotlines)**: Decentralized across 28 regional AAAs covering all counties; no uniform income/asset table; services and priorities vary by local AAA; priority-based rather than strict eligibility
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only for residents of nursing homes/assisted living facilities; delivered via statewide network of local independent programs with volunteers; complaint-driven, no formal eligibility/application process

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Texas?
