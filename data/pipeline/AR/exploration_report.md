# Arkansas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 58s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 16 |
| New (not in our data) | 10 |
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
- **financial (food assistance)**: 1 programs
- **advocacy**: 2 programs
- **employment**: 1 programs
- **advocacy|service**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Program of All-Inclusive Care for the Elderly (PACE)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `All Medicare and Medicaid-approved services including primary, preventive, acute, and long-term care; doctor visits, transportation, home care; additional medically necessary services not typically covered (e.g., ramps, medical equipment, air conditioners, food, utility funds); adult day care, dentistry, laboratory/x-ray, meals; provided at PACE centers, home, inpatient facilities via personalized interdisciplinary team plan.` ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1043` → Source says `$1,235` ([source](https://humanservices.arkansas.gov/divisions-shared-services/shared-services/office-of-medicaid-policy-and-program-management/ or https://access.arkansas.gov/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `- **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, Part A/B coinsurance/deductibles/copayments.
- **SLMB**: Pays Medicare Part B premiums only.
- **QI**: Pays Medicare Part B premiums only. Automatic qualification for Extra Help (LIS) for prescription drugs if enrolled in any MSP[5]. Part B premium ~$202.90 in 2026[4].` ([source](https://humanservices.arkansas.gov/divisions-shared-services/shared-services/office-of-medicaid-policy-and-program-management/ or https://access.arkansas.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/divisions-shared-services/shared-services/office-of-medicaid-policy-and-program-management/ or https://access.arkansas.gov/`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `No specific age requirement for the household, but special rules apply if any household member is 60 or older[1][5]` ([source](https://humanservices.arkansas.gov/ and https://www.fns.usda.gov/snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits vary by household size and income. Examples: 1 person = up to $298/month; 2 people = up to $546/month; 3 people = up to $785/month[3]` ([source](https://humanservices.arkansas.gov/ and https://www.fns.usda.gov/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/ and https://www.fns.usda.gov/snap/`

### Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite grants for services like respite care, counseling, training, access to assistance; specific services vary by local grant (e.g., home care, day care, facility care); no fixed dollar amounts or hours statewide, provided at no cost to families[1][3][5][8]` ([source](https://agingarkansas.org/services/family-caregiver-support/[1]))
- **source_url**: Ours says `MISSING` → Source says `https://agingarkansas.org/services/family-caregiver-support/[1]`

### Long-Term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy services including investigating and resolving complaints on resident rights, quality of life, Medicaid/Medicare issues, discharges/transfers, finances, food quality, room temperature, social activities, care plans, restraints, guardianship/power of attorney; education on rights; referrals and follow-through on solutions; reporting unresolved grievances to regional ombudsman[1][5]` ([source](https://aging.arkansas.gov/programs-services/long-term-care-ombudsman-program/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.arkansas.gov/programs-services/long-term-care-ombudsman-program/`

### Arkansas PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$2901` → Source says `$1,043` ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive coordinated care including primary/preventive/acute/long-term services at PACE centers, in home, inpatient facilities: doctor visits, transportation, home care, all Medicare/Medicaid-covered services approved by care team, plus additional medically necessary services not typically covered. Fully covered for dual Medicare/Medicaid eligible (no copays/out-of-pocket); premium required if not fully eligible. Personalized plan by interdisciplinary team.[2][3][5]` ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/`

## New Programs (Not in Our Data)

- **ARKansas Medicaid Long-Term Services and Supports (LTSS)** — service ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/long-term-services-and-supports-ltss-medicaid-assistance/))
  - Shape notes: Multiple programs under LTSS umbrella (ARChoices, ALF, Nursing Facilities, PACE, DDS) with shared income/asset limits but program-specific care levels and services; spousal protections vary by facility type; Income Trust pathway for excess income; statewide but PACE geographically restricted
- **ARChoices in Homecare** — service ([source](humanservices.arkansas.gov (Arkansas Department of Human Services)))
  - Shape notes: ARChoices is a Medicaid waiver program with multi-stage eligibility determination: categorical (age/disability) → financial (DCO) → functional (ARIA assessment with tier assignment 0-3) → level of care (OLTC nurse review). Tier 2 is the only qualifying functional tier. Home equity is the primary asset limit; income limits exist but are not specified in available sources. Program operates statewide through DHS but specific contact information, service details, processing timelines, and regional variations are not provided in search results. Families will need to contact DCO and DAABHS directly for complete application details.
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.adeq.state.ar.us/energy/assistance/liheap.aspx))
  - Shape notes: Administered via county CBOs with slight income chart variations; benefits via statewide matrix scaled by income/size/fuel; seasonal with early fund exhaustion; household=shared meter.
- **Weatherization Assistance Program** — service ([source](https://www.adeq.state.ar.us/energy/assistance/wap.aspx))
  - Shape notes: Statewide via 5 regional CAAs/nonprofits; priority tiers by elderly (60+), disabled, children; income at 200% FPG or SSI/LIHEAP; no fixed dollar value—comprehensive free services based on audit.
- **Senior Medicare Patrol (SMP)** — advocacy ([source](https://insurance.arkansas.gov/consumer-assistance/senior-medicare-patrol-smp/))
  - Shape notes: no income test; volunteer-based education and advocacy only; open to all Medicare beneficiaries/families without application barriers; often bundled with SHIP counseling
- **Meals on Wheels** — service ([source](https://aging.arkansas.gov/ (Arkansas Division of Aging, Adult, and Behavioral Health Services; oversees AAAs) or https://codeofarrules.arkansas.gov/ for state rules[7]. Local AAAs via https://agingarkansas.org/[3].))
  - Shape notes: Decentralized/local administration via Area Agencies on Aging; no uniform statewide income table or fixed benefits; eligibility emphasizes functional need over financial; service area-restricted with provider variations.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/senior-community-service-employment-program/))
  - Shape notes: Income eligibility fixed at 125% HHS Poverty Guidelines (varies by household size annually); statewide uniform administration via Arkansas DHS/DAABHS with central Little Rock contact; no asset test or regional provider variations specified.
- **Legal Aid for Seniors (via Area Agencies on Aging)** — advocacy|service ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/area-agencies-on-aging/))
  - Shape notes: This program is decentralized by design: Arkansas has multiple regional Area Agencies on Aging, each operating independently with local attorney networks. Legal aid is offered as one service among many (meals-on-wheels, transportation, case management, etc.). Eligibility, fees, processing times, and service scope are not standardized statewide and must be determined by contacting your specific regional AAA. The search results provide service descriptions and regional office locations but lack specific income thresholds, asset limits, application forms, processing timelines, and fee schedules.
- **Arkansas Property Tax Relief for Seniors** — financial ([source](https://law.justia.com/codes/arkansas/title-26/subtitle-3/chapter-26/subchapter-11/section-26-26-1124/ (Arkansas Code § 26-26-1124)))
  - Shape notes: Combines fixed $600 Homestead Tax Credit with assessed value freeze; county-administered with local contacts; no income/asset tests; eligibility tied to ownership and principal residence use
- **Family Caregiver Grant Program (Alzheimer’s Arkansas via CareLink)** — financial ([source](https://www.alzark.org/carelink-caregiver-support-grant/))
  - Shape notes: County-restricted to 6 Central Arkansas counties; no income/asset test; reimbursement model requires upfront payment; tied to CareLink AAA but administered by Alzheimer’s Arkansas; fiscal year capped with 6-month reapplication spacing

## Program Details

### ARKansas Medicaid Long-Term Services and Supports (LTSS)

> **NEW** — not currently in our data

**Eligibility:**
- Income: The income limit for all LTSS programs is three times the current SSI Standard Payment Amount (SPA) for an individual. For 2024, this is $2,829/month; for 2026 nursing home applicants, it is $2,982/month. Only the applicant's income is counted toward this limit. Income over the limit may qualify via an Income Trust (Miller Trust). For spousal cases, community spouses may retain all or part of the applicant's income in certain settings like nursing facilities, assisted living, or adult family homes. No Minimum Monthly Maintenance Needs Allowance for non-applicant spouses. SSI recipients are automatically eligible if meeting functional needs. Limits do not vary by household size beyond spousal rules; higher limits apply for children, pregnant women, and LTSS clients per FPL percentages up to 250%[3][4][5][1].
- Assets: Applicant resource limit is $2,000. Exempt assets include primary home and one vehicle. Cash and investments count. For married couples, spousal impoverishment rules allow the community spouse to retain all or a portion of combined assets (spousal resource division). Asset transfers within the 5-year look-back period may cause penalties[1][2][4].
- Arkansas residency
- Nursing Facility Level of Care (NFLOC) or Intermediate Level of Care as determined by the Office of Long Term Care for most programs (Skilled Care individuals not eligible for some like ARChoices)
- Aged, blind, or disabled (for nursing facilities)
- Functional need for long-term care services, varying by program (e.g., inability to live safely independently for home modifications)
- Annual redetermination and report changes within 10 days[3][4][5]

**Benefits:** Specific services vary by program: ARChoices in Homecare (personal care, respite, supported employment, adaptive equipment, environmental modifications, specialized medical supplies, personal emergency response systems); Assisted Living Facilities Level II; Developmental Disability Services; Nursing Facilities; PACE (Program of All-Inclusive Care for the Elderly, including all state plan services like hospital, therapies, prescriptions, durable medical equipment); Supportive Living, day treatment. Full range of Medicaid benefits plus waiver services. No fixed dollar amounts or hours specified; services based on assessed needs and program[3][4][5].
- Varies by: priority_tier

**How to apply:**
- Online: Access.Arkansas.gov
- Phone: 855-372-1084
- Mail or in-person: Any DHS County office
- LTSS Medicaid Application Packet available via Office of Long Term Care

**Timeline:** Not specified in sources
**Waitlist:** Not specified; PACE requires living in served area without health/safety risk[5]

**Watch out for:**
- Income over limit requires Income Trust; improper setup causes denial
- 5-year look-back on asset transfers leads to penalties
- Skilled Care individuals ineligible for some programs like ARChoices (Intermediate Level only)
- Only applicant's income counted, but spousal rules vary by setting (no spousal income division except specific cases)
- Must report changes within 10 days or risk interruption
- Pre-eligibility planning needed to avoid disqualification
- Annual redetermination required[1][2][4][5]

**Data shape:** Multiple programs under LTSS umbrella (ARChoices, ALF, Nursing Facilities, PACE, DDS) with shared income/asset limits but program-specific care levels and services; spousal protections vary by facility type; Income Trust pathway for excess income; statewide but PACE geographically restricted

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/long-term-services-and-supports-ltss-medicaid-assistance/

---

### ARChoices in Homecare

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21-64 with physical disability, OR 65++
- Income: Search results do not provide specific income dollar amounts or household-size tables. Financial eligibility is determined by the Department of County Operations (DCO) based on Medicaid standards, but exact thresholds are not detailed in available sources.[1][2]
- Assets: Home equity interest cannot exceed $752,000 (as of 2026). Home equity = current home value minus outstanding mortgage. Exceptions apply if: applicant has spouse in home, minor child under 21 in home, or permanently disabled/blind child of any age in home.[2]
- Must be Arkansas resident[1]
- Must require nursing home level of care (intermediate or skilled)[4][5]
- Must require minimum one service offered through AR Choices[1]
- Must meet functional requirements: inability to perform at least 1 of 3 ADLs (transferring/locomotion, eating, toileting) without extensive assistance/total dependence, OR inability to perform at least 2 of these 3 ADLs without limited assistance, OR primary/secondary diagnosis of Alzheimer's disease or related dementia with cognitive impairment requiring substantial supervision[2][3][4]
- Assessment tier must be 2 (tier 0-1 = ineligible; tier 3 = needs too great for program)[2]

**Benefits:** Search results do not specify which services are included, dollar amounts, or hours per week. Program description states it 'provides a variety of services to help Arkansans live independently in their own home or the home of a relative' and helps 'reduce premature nursing home placements,' but specific service list is not detailed in available sources.[1]
- Varies by: tier (tier 2 qualifies; tier 3 does not)

**How to apply:**
- In-person: Apply through Department of County Operations (DCO) — specific office locations and phone numbers not provided in search results[3]
- Mail/Phone: Contact DCO for application process — specific contact details not provided in search results

**Timeline:** Search results do not specify processing timeline. Eligibility begins 'the date the DHS Division of County Operations approves the application unless there is a provisional plan of care.'[5] Renewal occurs annually (within 365 days).[4]
**Waitlist:** Search results do not mention waitlist status or wait times.

**Watch out for:**
- Tier 3 assessment (needs too great) disqualifies applicants — this is not a 'higher priority' tier but rather ineligibility.[2]
- Home equity limit of $752,000 applies even if applicant has intent to return to home — this is a hard asset cap.[2]
- Program requires nursing home level of care determination, not just any disability — applicants must meet specific ADL thresholds.[1][4]
- Skilled level of care (as opposed to intermediate) may disqualify applicants per some sources, though this is not entirely clear from available documentation.[4]
- Alzheimer's/dementia diagnosis alone is insufficient — must also have cognitive impairment requiring substantial supervision.[3][4]
- Search results do not clarify whether income limits exist or what they are — families should contact DCO directly for current thresholds.
- Specific services covered are not detailed in available sources — families should request service list from DAABHS before applying.

**Data shape:** ARChoices is a Medicaid waiver program with multi-stage eligibility determination: categorical (age/disability) → financial (DCO) → functional (ARIA assessment with tier assignment 0-3) → level of care (OLTC nurse review). Tier 2 is the only qualifying functional tier. Home equity is the primary asset limit; income limits exist but are not specified in available sources. Program operates statewide through DHS but specific contact information, service details, processing timelines, and regional variations are not provided in search results. Families will need to contact DCO and DAABHS directly for complete application details.

**Source:** humanservices.arkansas.gov (Arkansas Department of Human Services)

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No specific income or asset limits mentioned; most participants are dually eligible for Medicare and Medicaid, but exact dollar amounts or household size tables not detailed in sources.
- Assets: No asset limits or exemptions specified in available data.
- Live in an area served by a PACE program in Arkansas
- Certified by the Office of Long Term Care as requiring nursing facility level of care
- Able to live safely in a community setting with PACE support

**Benefits:** All Medicare and Medicaid-approved services including primary, preventive, acute, and long-term care; doctor visits, transportation, home care; additional medically necessary services not typically covered (e.g., ramps, medical equipment, air conditioners, food, utility funds); adult day care, dentistry, laboratory/x-ray, meals; provided at PACE centers, home, inpatient facilities via personalized interdisciplinary team plan.

**How to apply:**
- Phone: Contact specific PACE centers (e.g., PACE of the Ozarks (479) 463-6600; Total Life Healthcare (870) 207-7500; Wellquest River Valley (479) 441-9491)
- In-person: Visit PACE centers (e.g., 813 Founders Park Dr East, Ste 107, Springdale, AR 72762; 505 E. Matthews, Ste 101, Jonesboro, AR 72401; 330 13th Street, Barling, AR 72923)

**Timeline:** Not specified in sources
**Waitlist:** Not detailed; regional capacity may limit availability (e.g., serves about 3% of eligible in some areas)

**Watch out for:**
- Not available statewide—must live in one of the limited service counties
- Requires nursing facility level of care certification, even if living independently with support
- No centralized application; contact specific regional PACE center directly
- Primarily for dually eligible Medicare/Medicaid individuals; financial details like premiums or cost-sharing not specified
- Capacity-limited; may not serve all eligible (e.g., only 3% in some areas)

**Data shape:** county-restricted to specific PACE centers; no income/asset test details; nursing facility level of care requirement; provider-specific contacts only

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
- Income: Arkansas-specific monthly income limits (from source [2], likely applicable around 2025-2026; confirm current FPL adjustments with DHS as limits update annually in April):
- **QMB**: $1,235 single / $1,663 married (≤100% FPL).
- **SLMB**: $1,235-$1,478 single / $1,663-$1,992 married (100-120% FPL).
- **QI**: $1,478-$1,660 single / $1,992-$2,239 married (120-135% FPL). Includes $20 general income disregard. Federal 2026 benchmarks: QMB $1,350 single/$1,824 couple[7].
- Assets: Federal limits apply in Arkansas: $9,090 single / $13,630 married for QMB/SLMB/QI[2]. What counts: Bank accounts, stocks, bonds. Exempt: Home, one car, burial plots, life insurance (up to certain value), personal belongings. Updated federal 2026: $9,950 single/$14,910 couple[4][7].
- Must be eligible for Medicare Part A (even if not enrolled)
- Arkansas resident
- U.S. citizen or qualified immigrant
- Not receiving full Medicaid (QI specifically excludes those eligible for Medicaid)

**Benefits:** - **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, Part A/B coinsurance/deductibles/copayments.
- **SLMB**: Pays Medicare Part B premiums only.
- **QI**: Pays Medicare Part B premiums only. Automatic qualification for Extra Help (LIS) for prescription drugs if enrolled in any MSP[5]. Part B premium ~$202.90 in 2026[4].
- Varies by: program_tier

**How to apply:**
- Online: Access via Arkansas DHS ACCESS portal (https://access.arkansas.gov/)
- Phone: Call Arkansas DHS at 1-800-482-8988 or local county office
- Mail/In-person: Submit DCO-0808 form to local DHS office (e.g., 2612 Spruce Street, Lewisville, AR 71845[5]; find offices at humanservices.arkansas.gov)
- Download form: https://humanservices.arkansas.gov/wp-content/uploads/Medicare_Savings_Application.pdf[9]

**Timeline:** QMB: Up to 45 days, effective first of month after approval[1]. SLMB/QI: May be retroactive up to 3 months prior[1].
**Waitlist:** QI: First-come, first-served with priority to prior-year recipients; limited federal funding may create waitlist[1][5].

**Watch out for:**
- Income/asset limits update annually (April); always verify current figures with DHS as search data varies ($1,235-$1,350 single QMB across sources)[2][7]
- QI requires annual reapplication, first-come-first-served, and excludes Medicaid-eligible[5]
- Must apply separately from regular Medicaid; automatic Extra Help but confirm enrollment
- Assets include most countable resources; exemptions often missed (e.g., home/car)
- Working disabled may qualify under higher limits via QDWI (separate program)[3][5]

**Data shape:** Tiered by program (QMB/SLMB/QI) with strict income bands scaling to FPL%; asset caps fixed by marital status; QI funding-capped with renewal priority; Arkansas mirrors federal limits without expansions like no-asset states (e.g., CT)[1][2]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/shared-services/office-of-medicaid-policy-and-program-management/ or https://access.arkansas.gov/

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: No specific age requirement for the household, but special rules apply if any household member is 60 or older[1][5]+
- Income: {"households_with_elderly_or_disabled_members":{"test_applied":"Net income only (no gross income limit)[1]","net_income_limit":"100% of federal poverty guidelines[4]","note":"For Oct. 1, 2025 through Sept. 30, 2026, federal poverty guidelines are $15,060 for one person and $20,440 for two people[2]"},"all_other_households":{"gross_income_limit":"130% of federal poverty guidelines","net_income_limit":"100% of federal poverty guidelines[4]"},"monthly_maximum_benefits_table":"Family size 1: $1,305 gross income, $298 max benefits; Family size 2: $1,763 gross income, $546 max benefits; Family size 3: $2,221 gross income, $785 max benefits; Family size 4: $2,680 gross income (table continues)[3]"}
- Assets: {"households_with_elderly_or_disabled_members":"$4,500 (or $5,500 for 12 months if enrolled in SNAP and needing temporary raise)[1][3]","all_other_households":"$3,000 (or $5,500 for 12 months if enrolled in SNAP and needing temporary raise)[1][3]","what_counts":"Countable resources include funds in bank accounts and vehicle values exceeding $4,650 per employed or student household member[1]","what_is_exempt":"Home (primary residence), one household vehicle, income-producing vehicles, life insurance, burial spaces, some non-home properties if income-producing or inaccessible[1][4]"}
- U.S. citizenship or legal alien status[4]
- State residency[4]
- Social Security Number[4]
- Work registration[4]
- Able-bodied adults ages 18-54 without dependents must work at least 20 hours per week or participate in a work program (seniors are exempt)[3][6]
- Household must purchase food and prepare meals together[4]

**Benefits:** Monthly benefits vary by household size and income. Examples: 1 person = up to $298/month; 2 people = up to $546/month; 3 people = up to $785/month[3]
- Varies by: household_size

**How to apply:**
- Online: Access Arkansas (specific URL not provided in search results, but referenced as application portal[7])
- In-person: Arkansas Department of Human Services (DHS) local offices[7]
- Phone: Contact through Arkansas DHS (specific phone number not provided in search results)
- Mail: Through Arkansas DHS (specific mailing address not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Arkansas does NOT use broad-based categorical eligibility (BBCE), meaning fewer residents qualify compared to states with expanded eligibility rules[8]
- Social Security, veterans' benefits, and disability payments ALL count toward income limits[2]
- Households with elderly or disabled members have NO gross income limit but must still meet the net income test (100% of federal poverty guidelines)[1]
- The temporary $5,500 asset limit raise is only available for 12 months in a 5-year period[3]
- Able-bodied adults ages 18-54 without dependents must work 20+ hours/week or face benefit termination after 3 months in a 36-month period; seniors are exempt from this requirement[6]
- You can own your home and still qualify if you meet income/asset tests[2]
- All household members who live together and buy/prepare food together must be included in the application[2]

**Data shape:** SNAP in Arkansas has a two-tier eligibility structure: households with elderly or disabled members face only net income testing (no gross income limit), while all other households must pass both gross and net income tests. Benefits scale by household size with specific monthly maximums. Asset limits are higher for elderly/disabled households. The program is administered uniformly statewide by Arkansas DHS but follows restrictive federal guidelines without state-level categorical eligibility expansions. Processing timelines, specific application URLs, phone numbers, and regional office locations are not detailed in available search results.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov/ and https://www.fns.usda.gov/snap/

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross monthly income must meet Federal Income Guidelines at or below 60% of state median income (SMI), based on previous month's countable income and household size. Limits vary by source and year; examples include: 2025 chart[8]: 1: $2,251; 2: $2,944; 3: $3,636; 4: $4,329 (add $672 per additional member). SNAP Screener 2025[2]: 1: $2,347; 2: $3,069; 3: $3,791; 4: $4,514; 5: $5,236; 6: $5,958. CRDCNEA[6]: 1: $1,936; 2: $2,531; 3: $3,127; 4: $3,723; 5: $4,318. Contact local agency for current table as it changes annually.
- Assets: Must meet countable resource standard, including cash, checking/savings accounts, CDs, cryptocurrency, stocks, bonds. Exemptions not specified; exact limits set by policy—verify with local provider.[1]
- U.S. citizen or legal resident non-citizen.
- Responsible for home energy bill (not eligible if paid by non-resident).
- Household defined as all under one roof/one utility meter; all must apply together.
- Residential only; no businesses.

**Benefits:** Regular: Fixed amount via federal model based on income, household size, energy source (electricity/gas/propane/wood/pellets); max heating $475, min $50; max cooling $287, min $50. Crisis: Up to $500 (summer/winter) for shut-off, disconnection, depleted fuel, or life-threatening situations. Payments direct to vendor. Special provisions for rent-included or subsidized housing.[1][2]
- Varies by: household_size|priority_tier|region

**How to apply:**
- In-person/mail/phone via local Community-Based Organization (CBO) serving your county (find via ADEQ site or local agency).
- Download forms from agency sites (e.g., LIHEAP Application from eoawc.org, crdcnea.tech).[3][7][6]
- SNAP recipients may use abbreviated application.[7]

**Timeline:** Varies; can take longer during high volume periods.[7]
**Waitlist:** Funding limited; applications may close early if funds depleted. No formal waitlist mentioned.[2]

**Watch out for:**
- Only 1 regular + 1 crisis benefit per household per season.
- Everyone on same utility meter must apply together (includes roommates).[1][2]
- Program dates limited (e.g., heating Jan-Mar, cooling Jul-Aug, crisis varies); funds run out early.[2]
- Must be responsible for bill—not if paid by non-resident.
- Income based on prior month; varying charts—use agency's current one.
- Elderly priority not explicit; vulnerable households may get crisis faster but verify locally.

**Data shape:** Administered via county CBOs with slight income chart variations; benefits via statewide matrix scaled by income/size/fuel; seasonal with early fund exhaustion; household=shared meter.

**Source:** https://www.adeq.state.ar.us/energy/assistance/liheap.aspx

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households with incomes at or below 200% of the Federal Poverty Guidelines. Example guidelines (likely from prior year, verify current at application): 1-person: $23,760; 2: $32,040; 3: $40,320; 4: $48,600; 5: $56,880; 6: $65,160; 7: $73,460; 8: $81,780. Add ~$8,220 per additional person. Also LIHEAP eligible (60% Arkansas median income) or SSI recipient (categorical eligibility). Priority for elderly (60+), disabled, children under 7, Native Americans.[1][2][3][4]
- Assets: No asset limits mentioned in sources.
- U.S. citizen or qualified alien (verified with documentation).
- Primary residence (for non-stationary campers/trailers: axles removed, residential electric/water service, street address mail).
- Renters need landlord agreement (12 months post-work).
- All households in multi-unit buildings must be income-eligible.
- Re-certify eligibility every 12 months until serviced.[2]

**Benefits:** Free full-scale home energy conservation: energy audit by DOE-trained auditor, repairs (attic/wall insulation, weather-stripping, caulking, sealing cracks, storm windows, furnace retrofitting), health/safety upgrades, new energy-efficient heating equipment. No cost to occupants; permanent improvements for comfort, safety, reduced bills. Year-round.[1][3][4][6]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (CAA) via https://www.acaaa.org/ to find provider by county.
- Examples: Better Community Development (BCD) at bcdinc.org; CSCDC at cscdc.net; CADC at cadc.com.
- In-person/mail/online forms from local provider (e.g., CSCDC Weatherization Application requires 12 months utility bills).[8]

**Timeline:** Not specified; after eligibility, local agency schedules energy inspection, then work by crews/contractors.
**Waitlist:** Due to limited funding, priority points create effective waitlist (elderly 60+, disabled, etc.).[1][2]

**Watch out for:**
- Priority system due to limited funding: elderly/disabled get points but must still meet income; non-priority may wait longer.
- Renters need landlord agreement (12-month tenant stability post-work).
- Must re-certify income every 12 months until serviced.
- All households in building eligible; trailers/campers have strict primary residence rules.
- Income guidelines change yearly—verify current 200% FPG at application.[1][2][3]

**Data shape:** Statewide via 5 regional CAAs/nonprofits; priority tiers by elderly (60+), disabled, children; income at 200% FPG or SSI/LIHEAP; no fixed dollar value—comprehensive free services based on audit.

**Source:** https://www.adeq.state.ar.us/energy/assistance/wap.aspx

---

### Senior Medicare Patrol (SMP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, families, and caregivers regardless of income[1][2][3]
- Assets: No asset limits or tests apply[1][2][3]
- Must be a Medicare beneficiary, family member, or caregiver with concerns about potential Medicare fraud, errors, or abuse[1][2][3]

**Benefits:** Outreach and education on Medicare fraud prevention; one-on-one counseling; assistance resolving billing disputes; referrals to state/federal agencies for suspected fraud investigations; free presentations and community events; volunteer-led support[1][2][3]

**How to apply:**
- Phone: 1-866-726-2916 (Arkansas SMP)[2]
- Email: [email protected][2]
- Contact local SMP via SMP Locator at smpresource.org (national tool to find Arkansas program)[1]

**Timeline:** Immediate assistance for counseling and referrals; no formal application processing as it's education/outreach-based[1][2][3]

**Watch out for:**
- Not a financial aid or healthcare service program—focuses solely on fraud prevention, education, and reporting, not direct medical or monetary benefits[1][3]
- Many programs co-locate with SHIP for insurance counseling, which may confuse it with benefit enrollment help[1][2]
- Requires active engagement like reviewing MSNs or reporting suspicions; passive eligibility doesn't provide ongoing services[5]
- Primarily volunteer-driven, so availability may depend on local team capacity[3][4]

**Data shape:** no income test; volunteer-based education and advocacy only; open to all Medicare beneficiaries/families without application barriers; often bundled with SHIP counseling

**Source:** https://insurance.arkansas.gov/consumer-assistance/senior-medicare-patrol-smp/

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No means test required under Older Americans Act funding (primary source); means test may apply only for SSBG-funded meals, but specific dollar amounts or household size tables not defined in state rules[7][3].
- Assets: No asset limits or tests specified; income/assets not primary eligibility factors[7][3].
- Homebound due to illness, incapacitation, disability, frailty, or isolation[7][1][3].
- Unable to shop for food, prepare nutritious meals safely, or lack knowledge to do so[7][5][6].
- No adequate caregiver, family, friends, or community resources to provide meals[1][3][7].
- Live within local delivery/service area[1][2][3].
- Priority for those with greatest economic/social needs, low-income, minorities, or increased nutritional risk[7].
- Spouse of eligible 60+ participant may qualify if in best interest[7][1][2].
- Disabled persons under 60 residing with eligible participant may qualify with AAA approval[7].
- Some local variations, e.g., mobility issues or temporary illness[4][5].

**Benefits:** Home-delivered nutritious meals (typically 1 hot meal per weekday delivery; menus approved by registered dietitian); may include accommodations for dietary restrictions like diabetes or allergies[3][9]. Spouses/dependents sometimes served. No fixed dollar amount or hours specified.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) chapter via phone or in-person for assessment and application[3][5].
- No statewide online application or specific form name/number listed; process starts with local AAA intake and needs assessment[2][3][5].
- Referral from doctor or social worker may be required by some programs[5].

**Timeline:** Varies; some within 1 week, others longer if waitlisted[2].
**Waitlist:** Possible depending on local program capacity; check with local AAA[2].

**Watch out for:**
- Not income-based primarily—common misconception; focuses on homebound/need, not poverty[3][5][7].
- Must be homebound and unable to prepare meals; mobile seniors directed to congregate meals at centers[3][5][8].
- Varies significantly by local AAA/provider—always contact specific local program, not national[1][3][5].
- Car ownership or ability to leave home may disqualify[2].
- Spouse/under-60 inclusion not automatic; requires approval[7].
- Potential waitlists in high-demand areas[2].
- Temporary needs (e.g., post-surgery) may qualify in some areas[5].

**Data shape:** Decentralized/local administration via Area Agencies on Aging; no uniform statewide income table or fixed benefits; eligibility emphasizes functional need over financial; service area-restricted with provider variations.

**Source:** https://aging.arkansas.gov/ (Arkansas Division of Aging, Adult, and Behavioral Health Services; oversees AAAs) or https://codeofarrules.arkansas.gov/ for state rules[7]. Local AAAs via https://agingarkansas.org/[3].

---

### Family Caregiver Support Program


**Eligibility:**
- Age: 60+
- Income: No income restrictions[1][3]
- Assets: No asset limits mentioned; not applicable[1]
- Care recipient must be at least 60 years old (no age limit if Alzheimer's or related dementia)[1][3]
- Caregiver must assist with activities like transportation, housework, meals, medication reminders, medical appointments, finances, dressing, or managing chronic conditions[1]
- Some local grants require specific diagnosis, chronic illness certification by physician, or residence in service area (e.g., Pulaski, Saline, Monroe, Prairie, Lonoke, Faulkner counties for CareLink)[5]
- Care recipient cannot receive duplicate services from other sources like Medicaid, Medicare, ARChoices, etc.[5]

**Benefits:** Respite grants for services like respite care, counseling, training, access to assistance; specific services vary by local grant (e.g., home care, day care, facility care); no fixed dollar amounts or hours statewide, provided at no cost to families[1][3][5][8]
- Varies by: priority_tier|region

**How to apply:**
- Contact local Area Agency on Aging for specific grants and application details[3]
- For CareLink example: Apply through Alzheimer’s Arkansas Programs and Services, 201 Markham Center Drive, Little Rock AR 72205 (4-step process including physician certification)[5]
- No statewide online URL, phone, or form specified; use agingarkansas.org for general info[1][3]

**Timeline:** Not specified in sources

**Watch out for:**
- Not all grants are identical; contact local Area Agency on Aging for exact requirements as they vary[3]
- No duplicate services allowed from other funding sources[5]
- VA program is separate and for veterans only[2]
- Confused with Medicaid paid caregiver programs like Arkansas Independent Choices, which have income/asset limits[7][10]

**Data shape:** Administered via local Area Agencies on Aging with varying grant-specific rules; no statewide income test or fixed benefits; some county-restricted

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://agingarkansas.org/services/family-caregiver-support/[1]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 125% of the current Health and Human Services Poverty Guidelines. Exact dollar amounts vary annually and by household size; families must check current HHS Poverty Guidelines (no specific table provided in sources, but applies statewide in Arkansas).[1][4]
- Assets: No asset limits mentioned in Arkansas-specific sources.
- Resident of the State of Arkansas
- Not currently employed at the time of application
- Low employment prospects (inherent to program design)

**Benefits:** Part-time paid work (average 20 hours per week) at non-profit or public service host agencies; paid the higher of federal, state, or local minimum wage; on-the-job training; job search skills development; assistance from Employment and Training Coordinator to find permanent unsubsidized part-time or full-time employment; establishes work history and develops marketable skills.[1][2][3][4]

**How to apply:**
- Phone: (501) 320-6586
- Email: [email protected]
- Mail: P.O. Box 1437, Slot S530, Little Rock, Arkansas 72203-1437
- In-person: Arkansas Department of Human Services, 700 Main Street, 5th Floor, Little Rock, Arkansas 72201

**Timeline:** Not specified; if eligible and no waiting list, enrolled promptly.[5]
**Waitlist:** Possible waiting list if program capacity is full (common in SCSEP nationally).[5]

**Watch out for:**
- Must be unemployed at time of application—cannot be currently working.[1][4]
- Income test is strict at 125% of poverty guidelines; includes full household income.[1][2]
- Priority enrollment for veterans/qualified spouses, those over 65, disabled, rural residents, homeless/at-risk, low literacy, limited English, low prospects, or prior American Job Center users—may affect non-priority applicants.[2]
- Temporary bridge program aimed at unsubsidized employment; not permanent income source.[1][2]
- Potential waitlists due to funding/capacity limits.[5]

**Data shape:** Income eligibility fixed at 125% HHS Poverty Guidelines (varies by household size annually); statewide uniform administration via Arkansas DHS/DAABHS with central Little Rock contact; no asset test or regional provider variations specified.

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/senior-community-service-employment-program/

---

### Legal Aid for Seniors (via Area Agencies on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Contact your local Area Agency on Aging for income eligibility thresholds.
- Assets: Not specified in available sources.
- Must reside in Arkansas
- Must be served by your regional Area Agency on Aging

**Benefits:** Free legal advice and assistance for qualifying seniors; more complex cases available at reduced fees (specific fee structure not disclosed in sources)
- Varies by: case_complexity

**How to apply:**
- Contact your local Area Agency on Aging directly (phone, in-person, or mail)
- Visit Arkansas Association of Area Agencies on Aging website to locate your regional AAA

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Legal aid availability is network-based: services depend on local attorney partnerships, which may vary by region
- No specific income or asset limits are publicly disclosed—eligibility determination requires direct contact with your local AAA
- Processing timelines and waitlist status are not documented in public materials
- The program distinguishes between simple legal advice (typically free) and complex cases (reduced fees apply, but fee amounts are not standardized)
- You must identify which regional AAA serves your county before applying—there is no single statewide application process
- Legal services are one component of AAA offerings; not all AAAs may emphasize legal advocacy equally

**Data shape:** This program is decentralized by design: Arkansas has multiple regional Area Agencies on Aging, each operating independently with local attorney networks. Legal aid is offered as one service among many (meals-on-wheels, transportation, case management, etc.). Eligibility, fees, processing times, and service scope are not standardized statewide and must be determined by contacting your specific regional AAA. The search results provide service descriptions and regional office locations but lack specific income thresholds, asset limits, application forms, processing timelines, and fee schedules.

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/area-agencies-on-aging/

---

### Long-Term Care Ombudsman


**Eligibility:**
- Income: No income limits; available to all long-term care facility residents regardless of financial status[5][6]
- Assets: No asset limits; no financial tests apply[5][6]
- Must be a resident of a long-term care facility (e.g., nursing home, assisted living) in Arkansas[1][5][6]
- No relation to facility residents or staff for volunteer advocates, but residents themselves have no such restriction[1][8]

**Benefits:** Advocacy services including investigating and resolving complaints on resident rights, quality of life, Medicaid/Medicare issues, discharges/transfers, finances, food quality, room temperature, social activities, care plans, restraints, guardianship/power of attorney; education on rights; referrals and follow-through on solutions; reporting unresolved grievances to regional ombudsman[1][5]

**How to apply:**
- Phone: Contact local ombudsman (number posted in facility) or regional Area Agency on Aging[5]
- In-person: Visit local long-term care facility ombudsman contact or Area Agency on Aging office[1][5]
- Anyone (family, friends, staff, residents, anonymous) can contact directly with concerns; no formal application for services[5][6]

**Timeline:** Immediate response encouraged; no specified formal processing time as it's complaint-driven[1][5]

**Watch out for:**
- Not a direct service provider or financial aid program—purely advocacy and complaint resolution; no healthcare or housing services[5][6]
- Volunteers must be 18+, no conflicts of interest, complete training—families cannot 'apply' to become ombudsman without certification[1][8]
- Anyone can contact, including anonymously; call for any concern, not just emergencies[5]
- Facilities must allow access; denial escalates to state level[2]

**Data shape:** no income test; complaint-driven advocacy for all LTC residents statewide via regional AAAs; volunteer-based with certification requirements; not a benefits program with limits or waitlists

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.arkansas.gov/programs-services/long-term-care-ombudsman-program/

---

### Arkansas Property Tax Relief for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits specified in program requirements[1][4][5]
- Assets: No asset limits specified; eligibility focuses on age, disability, ownership, and principal residence[1][4][5]
- Own the homestead and use it as principal place of residence[1][4][5]
- 65 years or older or disabled (as defined by Social Security Administration standards)[1][4][5]
- Only one homestead credit per person or couple per year; cannot claim on multiple properties[1][5][6]
- For homes purchased or constructed on/after Jan 1, 2001: assessed value frozen at purchase/construction value or later value, whichever lower[4]
- For those turning 65 or becoming disabled on/after Jan 1, 2001: frozen at value on 65th birthday or disability date[4]
- Ownership can include trusts or LLCs if used as principal residence by owner/beneficiary[6]

**Benefits:** Combines Homestead Tax Credit (up to $600 off property tax assessment) with assessed value freeze for age 65+ or disabled homeowners (value does not increase unless millage increase or home addition; based on lower of freeze date value or later value)[1][3][4][5][6][7]

**How to apply:**
- Contact local County Assessor's office (varies by county; e.g., Pulaski: (501) 340-6168; Washington: (479) 444-1512 or visit 280 N. College Ave, Suite 250, Fayetteville, AR 72701)[1][3][5][7]
- Digital or mailed applications accepted statewide[1]
- Fill out application (e.g., Washington County online form or send to Amendment 79 Administrator)[7]

**Timeline:** Not specified in sources

**Watch out for:**
- Deadline October 15th annually[1]
- Only one credit per person/couple statewide; no multiple properties[1][5][6]
- Freeze applies only to increases beyond millage changes or additions; value can still change under those conditions[1][4]
- Must own and occupy as principal residence; special rules for nursing home residents (may qualify if retain ownership/life estate) or deeded homes (need life estate)[5]
- Credit up to $600 but cannot reduce taxes below zero[6]
- Not exhaustive; consult local assessor for full options[1]

**Data shape:** Combines fixed $600 Homestead Tax Credit with assessed value freeze; county-administered with local contacts; no income/asset tests; eligibility tied to ownership and principal residence use

**Source:** https://law.justia.com/codes/arkansas/title-26/subtitle-3/chapter-26/subchapter-11/section-26-26-1124/ (Arkansas Code § 26-26-1124)

---

### Arkansas PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE eligibility itself; financial eligibility ties to Medicaid, where applicants over the limit may qualify via Income Trust or spousal impoverishment rules (spouses in community eligible for income/resource division). Medicaid income limit referenced in related programs is $1,043.33/month for individuals (effective 4/1/25–3/31/26), but PACE allows private pay if medical criteria met.[1][5][7]
- Assets: No specific asset limits stated for PACE; follows Medicaid rules with potential exemptions (e.g., primary home, one vehicle). Private pay option available without non-medical criteria if medical needs met.[4][5]
- Certified by Arkansas Department of Human Services / Office of Long Term Care to meet nursing home level of care (e.g., skilled S, intermediate I-A, II-B, III-C; assistance with ADLs like transferring, eating, toileting, or supervision due to cognitive impairment; cognition/CHESS testing).[1][3][4][5]
- Live in service area of an Arkansas PACE provider and able to live safely in community with PACE support (health/safety not jeopardized).[1][2][3][5][6]
- US citizen or qualified alien; Arkansas resident; Social Security number.[1]
- Under 65 must prove disability via SSI/SSA or Medical Review Team.[1]
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare Rx plan, or hospice.[2]

**Benefits:** Comprehensive coordinated care including primary/preventive/acute/long-term services at PACE centers, in home, inpatient facilities: doctor visits, transportation, home care, all Medicare/Medicaid-covered services approved by care team, plus additional medically necessary services not typically covered. Fully covered for dual Medicare/Medicaid eligible (no copays/out-of-pocket); premium required if not fully eligible. Personalized plan by interdisciplinary team.[2][3][5]
- Varies by: region

**How to apply:**
- Contact local PACE provider (e.g., Baptist Health PACE, PACE of the Ozarks) or Arkansas DHS for assessment.[3][4][5]
- Phone: Not specified in results; call DHS Aging & Adult Services or local provider.
- In-person: At PACE centers (e.g., Baptist Health, PACE Ozarks locations).
- Application/enrollment prior to full eligibility determination possible, but services not covered if ineligible.[1]

**Timeline:** Not specified.

**Watch out for:**
- Must live in a PACE service area—limited locations in Arkansas, not statewide.[1][5]
- Nursing home level of care required, assessed by state (not just any ADL help).[1][3][4][5]
- Private pay possible if medical eligible but not financially, but costs $7,000+/month or share of cost $200–900.[4][8]
- Cannot be in Medicare Advantage/hospice; disenroll first. Ineligible applicants pay for received services.[1][2]
- Temporary conditions (<21 days) don't disqualify, but longer do.[1]
- 90%+ participants dual-eligible; apply for Medicaid if needed.[2][8]

**Data shape:** Limited to specific PACE provider service areas (not statewide); no strict income/asset caps but Medicaid-linked with trusts/private pay; medical eligibility mirrors nursing facility criteria; provider-specific (e.g., 2+ centers identified).

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/

---

### Family Caregiver Grant Program (Alzheimer’s Arkansas via CareLink)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or asset limits apply.
- Assets: No asset limits apply; no information on countable assets or exemptions.
- Diagnosis of chronic illness (e.g., any form of dementia, Alzheimer’s, Parkinson’s) or dementia (under 60 allowed for dementia only per older docs, but primary req is 60+ with chronic illness/dementia)
- Must live in Pulaski, Saline, Monroe, Prairie, Lonoke, or Faulkner County
- Must live independently or with family (not in assisted living or full-time care facility)
- Official diagnosis on doctor’s letterhead or prescription pad stating chronic illness/dementia and that patient requires daily assistance from caregiver; signed by doctor; dated within 1 year of application

**Benefits:** $1,000 reimbursement grant for respite care only (hire external provider 18+ not living with patient or care company; cannot pay self for daily duties or CareLink providers); usable within 3 months of approval or by June 1 (whichever first); one grant open at a time; may reapply every 6 months (twice per fiscal year July 1-June 30) if funds available
- Varies by: fixed

**How to apply:**
- Download/print application from https://www.alzark.org/wp-content/uploads/2024/06/2024-2025-CareLink-Grant-Application-for-print.pdf (valid 7/1/2024-3/17/2025)
- Mail, email, or fax to Alzheimer’s Arkansas (details in application PDF; address: 201 Markham Center Drive, Little Rock AR 72205 per older docs)
- Website info: https://www.alzark.org/carelink-caregiver-support-grant/
- Contact Alzheimer’s Arkansas for questions (phone not listed in results; check site/application)

**Timeline:** Up to 10 business days
**Waitlist:** Subject to funding availability; no formal waitlist mentioned

**Watch out for:**
- Reimbursement only—pay upfront then submit logs/receipts; no pre-approval payments
- Respite care only (external provider break for caregiver); does not pay for daily caregiving duties or self-reimbursement for those
- Cannot use CareLink providers with grant funds
- Must wait 6 months between approvals; only one grant open at a time
- Application denied/returned if incomplete or missing valid diagnosis
- Funds expire in 3 months or by June 1 post-approval
- Fiscal year limits (July 1-June 30); use current dated form
- Funding-dependent; may not be available

**Data shape:** County-restricted to 6 Central Arkansas counties; no income/asset test; reimbursement model requires upfront payment; tied to CareLink AAA but administered by Alzheimer’s Arkansas; fiscal year capped with 6-month reapplication spacing

**Source:** https://www.alzark.org/carelink-caregiver-support-grant/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| ARKansas Medicaid Long-Term Services and | benefit | state | deep |
| ARChoices in Homecare | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Senior Medicare Patrol (SMP) | resource | federal | simple |
| Meals on Wheels | benefit | federal | deep |
| Family Caregiver Support Program | resource | state | simple |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors (via Area Agencies | resource | state | simple |
| Long-Term Care Ombudsman | resource | federal | simple |
| Arkansas Property Tax Relief for Seniors | resource | state | simple |
| Arkansas PACE (Program of All-Inclusive  | benefit | local | deep |
| Family Caregiver Grant Program (Alzheime | benefit | local | medium |

**Types:** {"benefit":10,"resource":5,"employment":1}
**Scopes:** {"state":5,"local":3,"federal":8}
**Complexity:** {"deep":10,"simple":5,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/AR/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **tier (tier 2 qualifies; tier 3 does not)**: 1 programs
- **not_applicable**: 5 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **region**: 2 programs
- **priority_tier|region**: 1 programs
- **case_complexity**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **ARKansas Medicaid Long-Term Services and Supports (LTSS)**: Multiple programs under LTSS umbrella (ARChoices, ALF, Nursing Facilities, PACE, DDS) with shared income/asset limits but program-specific care levels and services; spousal protections vary by facility type; Income Trust pathway for excess income; statewide but PACE geographically restricted
- **ARChoices in Homecare**: ARChoices is a Medicaid waiver program with multi-stage eligibility determination: categorical (age/disability) → financial (DCO) → functional (ARIA assessment with tier assignment 0-3) → level of care (OLTC nurse review). Tier 2 is the only qualifying functional tier. Home equity is the primary asset limit; income limits exist but are not specified in available sources. Program operates statewide through DHS but specific contact information, service details, processing timelines, and regional variations are not provided in search results. Families will need to contact DCO and DAABHS directly for complete application details.
- **Program of All-Inclusive Care for the Elderly (PACE)**: county-restricted to specific PACE centers; no income/asset test details; nursing facility level of care requirement; provider-specific contacts only
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with strict income bands scaling to FPL%; asset caps fixed by marital status; QI funding-capped with renewal priority; Arkansas mirrors federal limits without expansions like no-asset states (e.g., CT)[1][2]
- **SNAP (Supplemental Nutrition Assistance Program)**: SNAP in Arkansas has a two-tier eligibility structure: households with elderly or disabled members face only net income testing (no gross income limit), while all other households must pass both gross and net income tests. Benefits scale by household size with specific monthly maximums. Asset limits are higher for elderly/disabled households. The program is administered uniformly statewide by Arkansas DHS but follows restrictive federal guidelines without state-level categorical eligibility expansions. Processing timelines, specific application URLs, phone numbers, and regional office locations are not detailed in available search results.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered via county CBOs with slight income chart variations; benefits via statewide matrix scaled by income/size/fuel; seasonal with early fund exhaustion; household=shared meter.
- **Weatherization Assistance Program**: Statewide via 5 regional CAAs/nonprofits; priority tiers by elderly (60+), disabled, children; income at 200% FPG or SSI/LIHEAP; no fixed dollar value—comprehensive free services based on audit.
- **Senior Medicare Patrol (SMP)**: no income test; volunteer-based education and advocacy only; open to all Medicare beneficiaries/families without application barriers; often bundled with SHIP counseling
- **Meals on Wheels**: Decentralized/local administration via Area Agencies on Aging; no uniform statewide income table or fixed benefits; eligibility emphasizes functional need over financial; service area-restricted with provider variations.
- **Family Caregiver Support Program**: Administered via local Area Agencies on Aging with varying grant-specific rules; no statewide income test or fixed benefits; some county-restricted
- **Senior Community Service Employment Program (SCSEP)**: Income eligibility fixed at 125% HHS Poverty Guidelines (varies by household size annually); statewide uniform administration via Arkansas DHS/DAABHS with central Little Rock contact; no asset test or regional provider variations specified.
- **Legal Aid for Seniors (via Area Agencies on Aging)**: This program is decentralized by design: Arkansas has multiple regional Area Agencies on Aging, each operating independently with local attorney networks. Legal aid is offered as one service among many (meals-on-wheels, transportation, case management, etc.). Eligibility, fees, processing times, and service scope are not standardized statewide and must be determined by contacting your specific regional AAA. The search results provide service descriptions and regional office locations but lack specific income thresholds, asset limits, application forms, processing timelines, and fee schedules.
- **Long-Term Care Ombudsman**: no income test; complaint-driven advocacy for all LTC residents statewide via regional AAAs; volunteer-based with certification requirements; not a benefits program with limits or waitlists
- **Arkansas Property Tax Relief for Seniors**: Combines fixed $600 Homestead Tax Credit with assessed value freeze; county-administered with local contacts; no income/asset tests; eligibility tied to ownership and principal residence use
- **Arkansas PACE (Program of All-Inclusive Care for the Elderly)**: Limited to specific PACE provider service areas (not statewide); no strict income/asset caps but Medicaid-linked with trusts/private pay; medical eligibility mirrors nursing facility criteria; provider-specific (e.g., 2+ centers identified).
- **Family Caregiver Grant Program (Alzheimer’s Arkansas via CareLink)**: County-restricted to 6 Central Arkansas counties; no income/asset test; reimbursement model requires upfront payment; tied to CareLink AAA but administered by Alzheimer’s Arkansas; fiscal year capped with 6-month reapplication spacing

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Arkansas?
