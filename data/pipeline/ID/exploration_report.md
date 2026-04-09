# Idaho Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 12 |
| New (not in our data) | 5 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 6 programs
- **in_kind**: 1 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Idaho Aged and Disabled Waiver

- **min_age**: Ours says `65` → Source says `65 or older, OR 18-64 with a disability diagnosis under the Social Security Act` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Comprehensive home and community-based services including: adult day health, day habilitation, homemaker services, residential habilitation, respite care, supported employment, attendant care, adult residential care, chore services, companion services, consultation, environmental accessibility adaptations, home-delivered meals, non-medical transportation, personal emergency response system, skilled nursing, specialized medical equipment and supplies, and transition services[7]` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1603` → Source says `$1,350` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A premiums (if applicable), Part B premiums/deductible, Part A/B coinsurance/copays/deductibles. SLMB: Part B premiums only. QI: Part B premiums only (auto-qualifies for Extra Help low-income subsidy for drugs, $12.65 max copay/drug in 2026)[1][2][6][7].` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://healthandwelfare.idaho.gov/services-programs/food-assistance[7]))
- **income_limit**: Ours says `$1984` → Source says `$35` ([source](https://healthandwelfare.idaho.gov/services-programs/food-assistance[7]))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases. Amount based on household size, net income, and deductions (e.g., max allotment for 2-person elderly household minus 30% of net income). Minimum/maximum allotments apply; e.g., example 2-person: $415/month.[1][4]` ([source](https://healthandwelfare.idaho.gov/services-programs/food-assistance[7]))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/food-assistance[7]`

### Idaho Energy Assistance (LIHEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `$400–$1,800 per year ($200–$600 per season)[1]. Benefit amount is determined individually based on household income, location within Idaho, household composition, and what the household pays for services[4]. Crisis LIHEAP provides emergency assistance for situations like broken furnaces or utility shutoff notices[2].` ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance`

### Senior Health Insurance Benefit Advisors (SHIBA) Program

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one health insurance counseling, information and printed materials, referrals to agencies; covers Medicare Parts A/B/D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, and other programs; helps understand benefits, compare options, avoid overpaying[1][2][3]` ([source](https://doi.idaho.gov/shiba/[2][4]))
- **source_url**: Ours says `MISSING` → Source says `https://doi.idaho.gov/shiba/[2][4]`

### Family Caregiver Support Program (FCSP)

- **income_limit**: Ours says `$3090` → Source says `$1,047` ([source](https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Information, assistance, respite care, caregiver training, counseling, and support groups; no direct cash payments to family caregivers in Idaho. Specific hours/dollars not fixed statewide; varies by local AAA funding and needs assessment.[3][9]` ([source](https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/`

### Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://aging.idaho.gov/ombudsman-program/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigates complaints about health, safety, welfare, and rights; provides advocacy on resident care issues (e.g., rehabilitation, restraints, maintenance of function); offers information, education, referrals on long-term care and benefits; conducts routine facility visits, attends resident council meetings; participates in licensure surveys; resolves issues in nursing homes, assisted living, skilled nursing, and rehabilitation facilities.` ([source](https://aging.idaho.gov/ombudsman-program/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/ombudsman-program/`

## New Programs (Not in Our Data)

- **Idaho Medicaid for the Aged, Blind, and Disabled (ABD)** — service ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities))
  - Shape notes: Eligibility tied to ABD status with asset cap at $2,000 (single); benefits scale by assessed functional needs/ADLs rather than fixed amounts or household size; separate from expansion Medicaid (138% FPL, no assets) or waivers requiring NFLOC.
- **Program of All-Inclusive Care for the Elderly (PACE) - Limited Availability in Idaho** — service ([source](https://www.npaonline.org/find-a-pace-program (confirms no Idaho programs); https://www.cms.gov/medicare/medicaid-coordination/about/pace[1][2]))
  - Shape notes: no programs available in Idaho; national PACE is provider-specific and geographically restricted; search results polluted with unrelated commercial C-PACE financing programs active in cities like Boise, Coeur d'Alene, Rexburg.[1][3][4][5]
- **Weatherization Assistance Program (WAP)** — service ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-weatherization))
  - Shape notes: Administered regionally by local Community Action Agencies with varying income tables, waitlists up to 3 years, and priority tiers; no statewide uniform income table or central application; eligibility ties to LIHEAP-like poverty guidelines
- **Meals on Wheels (via Area Agencies on Aging)** — service ([source](https://aging.idaho.gov/stay-at-home/home-delivered-meals/[8]))
  - Shape notes: Administered via 7 regional Area Agencies on Aging with case-by-case eligibility and provider variations; no fixed income/asset tests; tied to Older Americans Act standards
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](U.S. Department of Labor: https://www.dol.gov/agencies/eta/seniors[3]))
  - Shape notes: The search results provide national program structure but lack Idaho-specific implementation details. Critical gaps include: (1) exact poverty-level dollar amounts for Idaho households; (2) specific local office locations, phone numbers, and websites for Idaho; (3) current processing times and waitlist status in Idaho; (4) county-by-county availability within Idaho; (5) specific training positions available in Idaho; (6) application forms and required documentation. The program is currently experiencing funding fluctuations (as of 2025), which may affect availability and enrollment timelines. Families should contact Easterseals-Goodwill Northern Rocky Mountain directly for current Idaho-specific information.

## Program Details

### Idaho Medicaid for the Aged, Blind, and Disabled (ABD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Specific dollar amounts for AABD Medicaid income limits are not detailed in available sources for 2026; financial eligibility requires meeting an income limit that varies by marital status and program specifics. For context, single nursing home applicants (related criteria) must have income under $3,002/month. ABD focuses on countable income assessment with no fixed table provided here; consult official sources for household size adjustments.[1][2]
- Assets: For a single applicant in 2026, countable assets must be $2,000 or less. Countable assets include most financial resources; exempt assets generally include primary home (if applicant lives there or intends to return, with home equity ≤$752,000), household furnishings, appliances, personal effects, and one vehicle. Assets given away or sold below fair market value within 60 months trigger a Look-Back Rule penalty period.[1][3]
- U.S. citizen or eligible non-citizen living in Idaho.
- Aged (65+), blind, or disabled (per Social Security Act criteria).
- For basic coverage: functional need limited to age/blind/disabled status.
- For long-term care services: assessment of Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (shopping, cooking, cleaning, medications); cognitive impairments like dementia considered. Nursing Facility Level of Care (NFLOC) may apply for certain supports.[1][5]

**Benefits:** Basic healthcare coverage including physician visits, prescription medications, emergency room visits, and short-term hospital stays. For long-term care needs, covers services/supports based on ADL/IADL assessment (e.g., home/community-based services); specific services like nursing home or HCBS waivers require NFLOC but no fixed dollar amounts or hours stated.[1][2]
- Varies by: functional_need

**How to apply:**
- Online: https://healthandwelfare.idaho.gov/services-programs/medicaid-health/apply-medicaid (via Idaho Department of Health and Welfare).[4]
- Phone: 1-877-456-1233 for assistance.[4]
- Mail or in-person: Contact local office via phone or website for addresses.[4]

**Timeline:** Not specified in sources.

**Watch out for:**
- Financial eligibility varies by marital status and specific program (e.g., nursing home vs. HCBS); ABD provides basic coverage but long-term services require separate functional/NFLOC assessment.[1]
- 60-month Look-Back Rule penalizes asset transfers; home equity limit $752,000 applies.[3]
- Not all ABD applicants automatically get long-term care—needs-based assessment determines services.[1][2]
- Must meet both financial and functional criteria; income limits not explicitly tabled for ABD by household size in sources.[1]

**Data shape:** Eligibility tied to ABD status with asset cap at $2,000 (single); benefits scale by assessed functional needs/ADLs rather than fixed amounts or household size; separate from expansion Medicaid (138% FPL, no assets) or waivers requiring NFLOC.

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities

---

### Idaho Aged and Disabled Waiver


**Eligibility:**
- Age: 65 or older, OR 18-64 with a disability diagnosis under the Social Security Act+
- Income: Not explicitly stated in search results. Search results indicate income limits exist but do not provide specific dollar amounts or household-based tables. Contact Idaho Department of Health and Welfare for current income thresholds.
- Assets: {"countable_asset_limit_single":"$2,000 (2026)","countable_asset_limit_couple":"Not specified in search results","exempt_assets":["Primary home (if applicant lives in it or has intent to return, with home equity interest not exceeding $752,000 in 2026)","Household furnishings and appliances","Personal effects","One vehicle"],"critical_rule":"Assets cannot be given away or sold for less than fair market value within 60 months of long-term care Medicaid application. Violating the Look-Back Rule results in a Penalty Period of Medicaid ineligibility."}
- Must live in Idaho
- Must be a U.S. citizen or eligible non-citizen
- Must require Nursing Facility Level of Care (NFLOC) — assessed through in-person or telephone interview using the Uniform Assessment Instrument (UAI)
- Functional need determined by limitations in Activities of Daily Living (ADL: bathing, dressing, mobility, eating, toileting) and Instrumental Activities of Daily Living (IADL: preparing meals, laundry, housecleaning)
- Cognitive impairments such as Alzheimer's disease and other dementias are considered in the assessment
- Must be eligible for Medicaid under IDAPA 16.03.05 (Aid to the Aged, Blind, and Disabled)

**Benefits:** Comprehensive home and community-based services including: adult day health, day habilitation, homemaker services, residential habilitation, respite care, supported employment, attendant care, adult residential care, chore services, companion services, consultation, environmental accessibility adaptations, home-delivered meals, non-medical transportation, personal emergency response system, skilled nursing, specialized medical equipment and supplies, and transition services[7]
- Varies by: Individual need (based on NFLOC assessment and service plan negotiation)

**How to apply:**
- Contact Idaho Department of Health and Welfare (specific URL and phone number not provided in search results)
- The American Council on Aging offers a Medicaid Eligibility Test for Idaho seniors at their website (specific URL not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- The 60-month Look-Back Rule is critical: any assets given away or sold below fair market value within 60 months of application will trigger a Penalty Period of Medicaid ineligibility. This is a common mistake that can delay or deny eligibility[1]
- Home equity limit of $752,000 (2026) applies only if applicant lives in the home or has intent to return; this limit may change annually[1]
- Functional need assessment is mandatory and requires demonstrating inability to independently perform ADLs and IADLs. This is not automatic based on age or diagnosis alone[1][2]
- Idaho also offers a separate Personal Care Services Program with slightly different eligibility requirements — families should verify which program best fits their needs[1]
- Income limits exist but are not detailed in publicly available search results — applicants must contact the state directly for current thresholds
- Asset limits are strict ($2,000 for single applicants in 2026) and only specific assets are exempt; careful planning is needed
- Cognitive impairments like Alzheimer's are considered in the assessment, but the applicant must still meet the NFLOC standard[2]

**Data shape:** This program's eligibility is highly individualized, based on functional need assessment rather than automatic qualification by age or diagnosis. Benefits are service-based rather than cash-based, with the specific mix of services determined through an individual service plan. The program operates statewide with no apparent regional variations in eligibility or benefits, but processing timelines and waitlist status are not documented in available sources. Income limits are referenced but not publicly specified in search results, requiring direct contact with the state. The 60-month Look-Back Rule for asset transfers is a critical planning consideration that differs from some other Medicaid programs.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities

---

### Program of All-Inclusive Care for the Elderly (PACE) - Limited Availability in Idaho

> **NEW** — not currently in our data

**Eligibility:**
- Income: No PACE programs operate in Idaho, so no income limits apply. Nationally, PACE targets dually eligible Medicare/Medicaid individuals with no specific dollar amounts listed for Idaho.[2][8]
- Assets: No asset limits apply in Idaho due to lack of programs. National PACE does not specify asset tests in available data.[2]
- No PACE programs available in Idaho, so no eligibility requirements apply.[1]
- Nationally: Age 55+, nursing facility eligible level of care, able to live safely in community with PACE services, reside in PACE service area.[2][8]

**Benefits:** No benefits available in Idaho. Nationally: Comprehensive medical and social services including primary care, hospitalization, prescription drugs, social services, therapeutic activities, minor home modifications, home care, durable medical equipment for frail elderly living in community.[2]
- Varies by: region

**How to apply:**
- No application methods in Idaho due to no programs.[1]
- Nationally: Contact local PACE organization via NPA finder tool.[1]

**Timeline:** Not applicable in Idaho
**Waitlist:** Not applicable in Idaho

**Watch out for:**
- PACE does not exist in Idaho—search confirms zero programs despite national availability in 33 states.[1]
- Do not confuse with Idaho's C-PACE (Commercial Property Assessed Clean Energy financing for buildings).[3][4][5][6][7][9][10]
- Families must explore alternatives like Idaho Medicaid Home and Community-Based Services (HCBS) waivers.
- Limited to community-living frail elderly nationally; requires nursing home level of care certification.[2][8]

**Data shape:** no programs available in Idaho; national PACE is provider-specific and geographically restricted; search results polluted with unrelated commercial C-PACE financing programs active in cities like Boise, Coeur d'Alene, Rexburg.[1][3][4][5]

**Source:** https://www.npaonline.org/find-a-pace-program (confirms no Idaho programs); https://www.cms.gov/medicare/medicaid-coordination/about/pace[1][2]

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be entitled to Medicare Part A (even if not enrolled). Income limits for Idaho (2024 figures from state-specific source; federal 2026 standards are higher at QMB individual $1,350/month, but use current state-verified): QMB: $1,235 single/$1,663 couple; SLMB: $1,478 single/$1,992 couple; QI: $1,660 single/$2,239 couple. Limits based on % FPL (100% QMB, 120% SLMB, 135% QI) and updated annually in April. No variation by larger household sizes shown; typically individual or couple[2][6][7].
- Assets: Federal limits apply in Idaho: $9,090 single/$13,630 couple across QMB/SLMB/QI. Counts: bank accounts, stocks, bonds. Exempt: home, one car, burial plots, life insurance (up to $1,500 face value), personal belongings[2][5].
- Entitled to Medicare Part A (premium-free or not)
- Idaho resident
- U.S. citizen or qualified immigrant

**Benefits:** QMB: Medicare Part A premiums (if applicable), Part B premiums/deductible, Part A/B coinsurance/copays/deductibles. SLMB: Part B premiums only. QI: Part B premiums only (auto-qualifies for Extra Help low-income subsidy for drugs, $12.65 max copay/drug in 2026)[1][2][6][7].
- Varies by: program_tier

**How to apply:**
- Phone: Contact Idaho DHW at regional offices or SHIBA 1-800-247-4422
- Website: healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program (request application)
- Mail/In-person: Local DHW Medicaid offices (find via healthandwelfare.idaho.gov/locations)

**Timeline:** QMB: Up to 45 days, effective first of month after complete info. SLMB/QI: Up to 3 months retroactive[1].
**Waitlist:** QI has first-come-first-served with priority to prior recipients; potential waitlist if funding limited[7].

**Watch out for:**
- Income/asset limits updated yearly (April); verify current FPL-based amounts as search shows variance (e.g., 2024 vs 2026 federal)
- QI requires annual reapplication, first-come-first-served, possible funding caps
- Must have Part A entitlement; QMB protects from provider billing for copays (no balance billing)
- States can be more generous (Idaho uses federal asset limits)

**Data shape:** Tiered by program (QMB/SLMB/QI) with escalating income thresholds; couple limits ~1.35x single; assets fixed federal minimums; QI funding-limited

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled: No gross income limit in Idaho. Net income must be below limits after deductions (e.g., medical expenses over $35/month for elderly/disabled, shelter costs, utilities). General gross income limits (Oct 1, 2025–Sept 30, 2026): 1 person $1,255/month; 2 $1,704; 3 $2,152; 4 $2,600; 5 $3,049; +$449 per additional. For 2025 seniors: ~$15,060/year (1 person), $20,440 (2 people). Benefits based on net income ($100 more net = ~$30 less benefits).[1][2][5]
- Assets: Generally under $5,000 for most households. Exemptions not fully detailed; primary home, retirement savings, and certain vehicles often do not count toward limit. Households with elderly/disabled may have expanded rules.[3][5]
- U.S. citizen or legal immigrant
- Idaho resident
- No work requirements if household is entirely elderly (60+)
- Meet net income test after deductions (e.g., excess shelter, medical >$35/month for 60+, utilities)

**Benefits:** Monthly EBT card for food purchases. Amount based on household size, net income, and deductions (e.g., max allotment for 2-person elderly household minus 30% of net income). Minimum/maximum allotments apply; e.g., example 2-person: $415/month.[1][4]
- Varies by: household_size

**How to apply:**
- Online: healthandwelfare.idaho.gov/services-programs/food-assistance/apply-snap[7]
- Phone: Regional offices or 2-1-1 (general assistance); Idaho Hunger Relief Task Force at 208-639-0030 for seniors[3][6]
- Mail/email/fax/in-person: Submit to local Idaho DHW office; applications available on DHW website[3][5][7]

**Timeline:** Standard processing not specified; expedited benefits within 7 days if meet criteria (e.g., very low income).[8]

**Watch out for:**
- No gross income limit for households with 60+ or disabled, but net income test applies after deductions—many miss deducting medical/shelter costs[1][3]
- Assets under $5,000 generally, but home/retirement often exempt[5]
- 64% of eligible Idaho seniors not enrolled—apply even if in subsidized housing or receiving meals[3][6]
- Social Security/pensions count as income[2]
- Household includes those who buy/prepare food together[2]

**Data shape:** Expanded eligibility for elderly/disabled (no gross income limit, key deductions for medical/shelter); benefits scale by household size and net income; statewide but local offices handle applications

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/food-assistance[7]

---

### Idaho Energy Assistance (LIHEAP)


**Eligibility:**
- Income: Household gross monthly income must be at or below 150% of the Federal Poverty Level (FPL)[1][3]. For most household sizes, this is 150% FPL; however, some Community Action Agencies use 60% of State Median Income for household sizes 1-7, with 150% FPL applying to household sizes 8 and above[5]. Exact dollar amounts vary annually based on HHS poverty guidelines and are updated each year. Families with children under age six, elderly members, or disabled members can apply starting in October; all other families can apply starting in November[4].
- U.S. citizen, permanent resident, or qualified non-citizen; at least one household member must be a U.S. citizen or lawful permanent resident[1][8]
- Must be an Idaho resident[8]
- Must have a heating expense (proof of heating bill required)[8]
- Funds are limited and distributed on a first-come, first-serve basis[4]

**Benefits:** $400–$1,800 per year ($200–$600 per season)[1]. Benefit amount is determined individually based on household income, location within Idaho, household composition, and what the household pays for services[4]. Crisis LIHEAP provides emergency assistance for situations like broken furnaces or utility shutoff notices[2].
- Varies by: household_size|region|fuel_type

**How to apply:**
- Online through the U.S. Department of Health & Human Services[1]
- Contact your local Idaho Community Action Agency (serves every county in Idaho)[4]
- Mail completed application to your local office[5]
- Email completed application to your local office[5]

**Timeline:** 7–30 days[1]
**Waitlist:** No formal waitlist described, but funding is limited and distributed first-come, first-serve; applications should be submitted as early as possible each season[1][4]

**Watch out for:**
- Cooling assistance from LIHEAP is NOT offered in Idaho; only heating assistance is available[2]
- Heating assistance is typically available only in fall and winter (November 1 – March 31)[2][5], not year-round
- Crisis assistance is available only in emergencies (broken furnace, utility shutoff notice, running out of fuel), not for regular heating costs[2]
- Roommates living at the same address and covered by the same utility bill are counted as part of the same LIHEAP household, even if they don't share most expenses[2]
- Families with children under age six, elderly, or disabled members can apply starting in October; all other families must wait until November[4]
- Funds are limited and some local agencies may stop accepting applications early if funds run out before the season ends[2]
- The Weatherization Assistance Program is a separate but related program that helps improve energy efficiency through home upgrades; it is not the same as regular LIHEAP[2]
- Online portal for applications may be unavailable at some Community Action Agencies; email or mail may be required[5]

**Data shape:** This program's benefits scale by household income, location, household composition, and fuel type. Income eligibility thresholds may vary slightly by Community Action Agency (150% FPL vs. 60% State Median Income for certain household sizes). Availability is seasonal (fall/winter only) and funding is first-come, first-serve, making application timing critical. The program includes three distinct assistance types: regular seasonal heating, crisis assistance, and weatherization upgrades. Elderly and disabled households have earlier application windows (October vs. November).

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income must meet state-specific guidelines at or below approximately 150% of federal poverty level, varying by household size and region. Examples: EICAP region - Family of 1: $31,300 annual/$2,608 monthly; Family of 2: $42,300 annual/$3,525 monthly. Idaho Power program (electric-heated homes): Monthly - 1: $2,146; 2: $2,903; 3: $3,660; 4: $4,416; 5: $5,173. Exact limits verified with local Community Action Agency as they vary by program funding[1][3][6].
- Assets: No asset limits mentioned in sources[1][3].
- Live in Idaho
- One household member must be a US Citizen or lawful permanent resident
- Proof of identity
- Proof of utility expense
- Proof of homeownership or written permission from landlord for rentals
- Home not weatherized in past 15 years
- Priority for households with children, elderly, disabled members, or heating emergencies[1][3]

**Benefits:** Energy efficiency upgrades including insulation, caulking, weather-stripping, air filtration repairs, broken windows, heating system checks, health/safety repairs, and material improvements based on professional energy audit. Services aim to lower utility costs, improve comfort, health, safety, and air quality. No fixed dollar amount; prioritized by cost-effectiveness and funding[3][5].
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (CAA) or Partnership (CAP) by phone or in-person; no statewide online application listed
- Idaho Dept. of Health & Welfare directs to local CAA: https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/apply-weatherization[1]
- Examples: SEICAA (Southeastern Idaho), EICAP; call local agency for region-specific contacts[5][6]

**Timeline:** Varies; energy audit after waitlist priority[5][6]
**Waitlist:** Yes, first-come first-served; up to 3 years in some areas (e.g., EICAP); prioritized by heating emergencies, high energy use, elderly/disabled members; dependent on funding[3][4][6]

**Watch out for:**
- Must contact local CAA, not apply statewide online/phone directly
- Renters need landlord's written permission and landlord may share costs in some programs
- Homes weatherized in past 15 years ineligible
- Long waitlists (up to 3 years); priority for elderly/disabled but funding limited year-round
- Income limits vary by agency/program; verify locally as not uniform
- Services based on energy audit cost-effectiveness, not all requested repairs done[1][3][6]

**Data shape:** Administered regionally by local Community Action Agencies with varying income tables, waitlists up to 3 years, and priority tiers; no statewide uniform income table or central application; eligibility ties to LIHEAP-like poverty guidelines

**Source:** https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-weatherization

---

### Senior Health Insurance Benefit Advisors (SHIBA) Program


**Eligibility:**
- Income: No income limits; open to all Idaho residents needing Medicare counseling[1][2][3]
- Assets: No asset limits; no financial tests apply[1][3]
- Idaho resident
- Typically seniors or disabled individuals with Medicare questions, but no strict requirements stated[1][2][3]

**Benefits:** Free one-on-one health insurance counseling, information and printed materials, referrals to agencies; covers Medicare Parts A/B/D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, and other programs; helps understand benefits, compare options, avoid overpaying[1][2][3]

**How to apply:**
- Phone: 1-800-247-4422[2][4][5]
- Online form: https://doi.idaho.gov/shiba/[4]
- Email: Shannon.Hohl@doi.idaho.gov[2]
- In-person or phone appointments available statewide via counselors in every county[3][4]

**Timeline:** Not specified; appointments scheduled upon contact[1][4]

**Watch out for:**
- Not an insurance seller or policy recommender—provides unbiased info only[3]
- Free service, but users may confuse it with paid advising or direct benefits enrollment[1][3]
- Relies on volunteer counselors, so availability may depend on local scheduling[3]
- Focused solely on Medicare/health insurance navigation, not direct healthcare or financial aid[1]

**Data shape:** no income or asset test; counseling service only via statewide volunteer network in every county; not a benefit-paying program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://doi.idaho.gov/shiba/[2][4]

---

### Meals on Wheels (via Area Agencies on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No means test or income limits; low-income individuals may receive partial or full scholarships on a case-by-case basis[1][5]
- Assets: No asset limits or tests mentioned[5]
- Homebound or unable to prepare meals due to physical/mental health conditions, mobility limitations, chronic illness, or cognitive impairment[1][2][8]
- Typically live alone without regular meal preparation support[1]
- Spouse of eligible participant (60+), regardless of age[1][3][5]
- Person under 60 with disability living with or in housing facility of eligible 60+ person[1][3][5]
- Person under 60 providing volunteer services during mealtimes[1][3][5]
- Determined case-by-case; assessment of needs may be required[1][2][6]

**Benefits:** Home-delivered nutritionally balanced meals: warm plate (entrée + 2 sides) + cold plate (salad, fruit, dessert); minimum 1/3 of Required Dietary Allowance; delivered 11:30 AM–2:30 PM weekdays; no customization for allergies/dietary restrictions (may contain animal products, gluten, lactose, tree nuts, shellfish)[1][5]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone for referral and assessment, e.g., Nampa area: 208-332-1745[6]; Senior Connection (example provider): 208-727-7198 or molly@seniorconnectionidaho.org[1]
- Complete provider-specific registration form, e.g., Meals-On-Wheels Registration Form from Senior Connection[1]
- Referrals accepted from anyone (family, doctor, social worker)[2][6]

**Timeline:** Not specified; assessment performed after referral, then service begins[6]
**Waitlist:** Not mentioned in sources

**Watch out for:**
- No means test, but scholarships for low-income are case-by-case, not guaranteed[1][5]
- No dietary customization; meals may not suit allergies/restrictions[1]
- Must be homebound/frail/unable to prepare meals; not for general food assistance[6][8]
- Younger spouses/disabled household members eligible only if tied to 60+ participant[3][5]
- Refer through local AAA/provider; no central statewide application[6]
- Voluntary contributions encouraged, but no mandatory fees[5][9]

**Data shape:** Administered via 7 regional Area Agencies on Aging with case-by-case eligibility and provider variations; no fixed income/asset tests; tied to Older Americans Act standards

**Source:** https://aging.idaho.gov/stay-at-home/home-delivered-meals/[8]

---

### Family Caregiver Support Program (FCSP)


**Eligibility:**
- Age: 60+
- Income: No strict income limits specified for FCSP itself; caregivers support care recipients aged 60+ or with Alzheimer's (any age). Related Medicaid PCS (often required for services): single $1,047/month, couple $1,511/month.[1]
- Assets: No asset limits specified for FCSP. For related Medicaid PCS: home exempt if applicant, spouse, minor child, or blind/disabled child lives there; other assets counted under Medicaid rules.[1]
- Caregiver must be adult family member or informal caregiver for individual 60+ or with Alzheimer's/related disorders.
- Care recipient must demonstrate functional need (e.g., assistance with ADLs/IADLs like bathing, dressing, meal prep).
- Services often tied to Medicaid eligibility for care recipient in Idaho implementations.[3][9]

**Benefits:** Information, assistance, respite care, caregiver training, counseling, and support groups; no direct cash payments to family caregivers in Idaho. Specific hours/dollars not fixed statewide; varies by local AAA funding and needs assessment.[3][9]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) via Idaho Commission on Aging: aging.idaho.gov or 208-334-3833.
- No specific online form or central phone listed; regional AAAs handle intake (e.g., in-person, phone).[9]

**Timeline:** Not specified in sources.
**Waitlist:** Possible due to funding limits; varies regionally.

**Watch out for:**
- Idaho does not pay family caregivers directly via FCSP; must use Medicaid-approved agencies or Certified Family Homes for payment (care recipient needs Medicaid).[2][4]
- Often confused with Medicaid PCS, which funds services but not direct family pay.[1][5]
- No statewide fixed hours/dollars; limited by federal OAA funding and local resources.[3][9]
- Functional need required, not just age or diagnosis.[1]

**Data shape:** Federally funded via OAA, locally administered by AAAs with no direct payments; services vary regionally and often require Medicaid linkage for paid in-home care; no income/asset test for core FCSP but applies to tied programs.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level[1][2][3]. The search results do not provide specific dollar amounts or household-size tables. Contact your local SCSEP office to determine if your household qualifies, as poverty thresholds vary by household composition[1].
- Assets: Not specified in available search results.
- Must be unemployed[1][2][3]
- Enrollment priority given to: veterans and qualified spouses of veterans, then individuals over 65, individuals with disabilities, those with low literacy skills or limited English proficiency, those in rural areas, homeless or at-risk individuals, those with low employment prospects, and those who have exhausted American Job Center services[3]

**Benefits:** Paid on-the-job training at approximately 20 hours per week[2][3]. Participants are paid the highest of federal, state, or local minimum wage[2][3]. Training assignments typically last 6 to 12 months[6]. Additional support includes resume updating, interview skills practice, and job search assistance[6].
- Varies by: fixed

**How to apply:**
- In-person at local SCSEP office[1]
- Contact information for Idaho-specific offices not provided in search results

**Timeline:** Not specified in available search results. One source notes that 'if you're eligible and there is no waiting list, you will be enrolled to train at a non-profit organization in your community'[1], suggesting enrollment can be immediate but does not specify typical processing timelines.
**Waitlist:** Waiting lists may exist but are not detailed in available search results[1].

**Watch out for:**
- Funding is currently in flux. Some organizations experienced pauses or slowdowns in 2025, while others received funding later and resumed services[1]. Availability may be limited depending on current funding cycles.
- This is a competitive program with enrollment priorities. Veterans and those over 65 receive priority, followed by individuals with disabilities, limited English proficiency, and other vulnerable populations[3].
- The program requires participants to be unemployed. Those with any current employment may not qualify[1][2][3].
- Income limits are strict at 125% of federal poverty level. For 2026, this would be approximately $1,548/month for a single person or $3,200/month for a family of four, but exact thresholds should be verified with local offices[1].
- Participants work part-time (approximately 20 hours/week), not full-time, and assignments are temporary (6-12 months)[6].
- The program is designed as a 'bridge to employment'—it is not permanent employment but rather training to help participants find unsubsidized jobs[3].

**Data shape:** The search results provide national program structure but lack Idaho-specific implementation details. Critical gaps include: (1) exact poverty-level dollar amounts for Idaho households; (2) specific local office locations, phone numbers, and websites for Idaho; (3) current processing times and waitlist status in Idaho; (4) county-by-county availability within Idaho; (5) specific training positions available in Idaho; (6) application forms and required documentation. The program is currently experiencing funding fluctuations (as of 2025), which may affect availability and enrollment timelines. Families should contact Easterseals-Goodwill Northern Rocky Mountain directly for current Idaho-specific information.

**Source:** U.S. Department of Labor: https://www.dol.gov/agencies/eta/seniors[3]

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Income: No income limits; program is free and open to all eligible residents regardless of financial status.
- Assets: No asset limits or tests; no financial qualifications required.
- Resident of a long-term care facility (e.g., skilled nursing, rehabilitation, assisted living, residential care facilities) in Idaho.
- Complaints made by or on behalf of residents aged 60 or older.
- Also available to families, friends, concerned staff, or any person/group worried about resident treatment.
- Online reporting limited to mandated reporters (e.g., physicians, nurses, law enforcement) or financial institutions; others must call local Area Agency on Aging.

**Benefits:** Investigates complaints about health, safety, welfare, and rights; provides advocacy on resident care issues (e.g., rehabilitation, restraints, maintenance of function); offers information, education, referrals on long-term care and benefits; conducts routine facility visits, attends resident council meetings; participates in licensure surveys; resolves issues in nursing homes, assisted living, skilled nursing, and rehabilitation facilities.

**How to apply:**
- Phone: Contact State Ombudsman at Idaho Commission on Aging or local Area Agency on Aging (specific regional numbers, e.g., Area Agency on Aging of North Idaho or CSI Office on Aging at 208-736-2122 or 1-800-574-8656).
- Online: Limited to mandated reporters via designated online report form.
- In-person: Local Ombudsman at Area Agencies on Aging.
- Note: No specific application form; report complaints directly by phone or online for eligible reporters.

**Timeline:** Not specified; immediate access to residents permitted, investigations handled promptly during business hours.

**Watch out for:**
- Not a direct service provider (e.g., no healthcare, financial aid, or personal care); focuses solely on advocacy and complaint resolution.
- Online reporting only for mandated reporters; families must call local office.
- Limited to facility residents aged 60+; does not typically cover home care except in limited cases.
- Volunteers/ombudsmen undergo background checks, but reporters do not.
- Anyone can report, but access to residents requires facility permission and resident consent.

**Data shape:** no income test; advocacy-only for facility residents via regional Area Agencies on Aging; complaint-driven, not application-based enrollment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/ombudsman-program/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Idaho Medicaid for the Aged, Blind, and  | benefit | state | deep |
| Idaho Aged and Disabled Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Idaho Energy Assistance (LIHEAP) | benefit | federal | medium |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Senior Health Insurance Benefit Advisors | resource | state | simple |
| Meals on Wheels (via Area Agencies on Ag | benefit | federal | deep |
| Family Caregiver Support Program (FCSP) | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"resource":2,"employment":1}
**Scopes:** {"state":4,"local":1,"federal":7}
**Complexity:** {"deep":9,"medium":1,"simple":2}

## Content Drafts

Generated 6 page drafts. Review in admin dashboard or `data/pipeline/ID/drafts.json`.

- **Idaho Medicaid for the Aged, Blind, and Disabled (ABD)** (benefit) — 3 content sections, 6 FAQs
- **Idaho Aged and Disabled Waiver** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE) - Limited Availability in Idaho** (benefit) — 2 content sections, 5 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 6 content sections, 6 FAQs
- **Idaho Energy Assistance (LIHEAP)** (benefit) — 3 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **functional_need**: 1 programs
- **Individual need (based on NFLOC assessment and service plan negotiation)**: 1 programs
- **region**: 3 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|region|fuel_type**: 1 programs
- **priority_tier**: 1 programs
- **not_applicable**: 2 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Idaho Medicaid for the Aged, Blind, and Disabled (ABD)**: Eligibility tied to ABD status with asset cap at $2,000 (single); benefits scale by assessed functional needs/ADLs rather than fixed amounts or household size; separate from expansion Medicaid (138% FPL, no assets) or waivers requiring NFLOC.
- **Idaho Aged and Disabled Waiver**: This program's eligibility is highly individualized, based on functional need assessment rather than automatic qualification by age or diagnosis. Benefits are service-based rather than cash-based, with the specific mix of services determined through an individual service plan. The program operates statewide with no apparent regional variations in eligibility or benefits, but processing timelines and waitlist status are not documented in available sources. Income limits are referenced but not publicly specified in search results, requiring direct contact with the state. The 60-month Look-Back Rule for asset transfers is a critical planning consideration that differs from some other Medicaid programs.
- **Program of All-Inclusive Care for the Elderly (PACE) - Limited Availability in Idaho**: no programs available in Idaho; national PACE is provider-specific and geographically restricted; search results polluted with unrelated commercial C-PACE financing programs active in cities like Boise, Coeur d'Alene, Rexburg.[1][3][4][5]
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with escalating income thresholds; couple limits ~1.35x single; assets fixed federal minimums; QI funding-limited
- **Supplemental Nutrition Assistance Program (SNAP)**: Expanded eligibility for elderly/disabled (no gross income limit, key deductions for medical/shelter); benefits scale by household size and net income; statewide but local offices handle applications
- **Idaho Energy Assistance (LIHEAP)**: This program's benefits scale by household income, location, household composition, and fuel type. Income eligibility thresholds may vary slightly by Community Action Agency (150% FPL vs. 60% State Median Income for certain household sizes). Availability is seasonal (fall/winter only) and funding is first-come, first-serve, making application timing critical. The program includes three distinct assistance types: regular seasonal heating, crisis assistance, and weatherization upgrades. Elderly and disabled households have earlier application windows (October vs. November).
- **Weatherization Assistance Program (WAP)**: Administered regionally by local Community Action Agencies with varying income tables, waitlists up to 3 years, and priority tiers; no statewide uniform income table or central application; eligibility ties to LIHEAP-like poverty guidelines
- **Senior Health Insurance Benefit Advisors (SHIBA) Program**: no income or asset test; counseling service only via statewide volunteer network in every county; not a benefit-paying program
- **Meals on Wheels (via Area Agencies on Aging)**: Administered via 7 regional Area Agencies on Aging with case-by-case eligibility and provider variations; no fixed income/asset tests; tied to Older Americans Act standards
- **Family Caregiver Support Program (FCSP)**: Federally funded via OAA, locally administered by AAAs with no direct payments; services vary regionally and often require Medicaid linkage for paid in-home care; no income/asset test for core FCSP but applies to tied programs.
- **Senior Community Service Employment Program (SCSEP)**: The search results provide national program structure but lack Idaho-specific implementation details. Critical gaps include: (1) exact poverty-level dollar amounts for Idaho households; (2) specific local office locations, phone numbers, and websites for Idaho; (3) current processing times and waitlist status in Idaho; (4) county-by-county availability within Idaho; (5) specific training positions available in Idaho; (6) application forms and required documentation. The program is currently experiencing funding fluctuations (as of 2025), which may affect availability and enrollment timelines. Families should contact Easterseals-Goodwill Northern Rocky Mountain directly for current Idaho-specific information.
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only for facility residents via regional Area Agencies on Aging; complaint-driven, not application-based enrollment

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Idaho?
