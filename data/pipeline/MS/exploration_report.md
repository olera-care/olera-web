# Mississippi Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 51s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 4 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **unknown**: 1 programs
- **service**: 8 programs
- **financial**: 2 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)

- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ms.gov/medicaid-coverage/who-qualifies-for-coverage/medicare-cost-sharing/`

### Mississippi Elderly and Disabled (E&D) Waiver

- **min_age**: Ours says `65` → Source says `21 or older (65+ for elderly; 21-64 for physically disabled; those enrolled before 65 can continue after)[1][2]` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health care, home-delivered meals, personal care services, institutional respite, in-home respite, expanded/extended home health (skilled nursing, nurse aide, physical therapy, speech therapy after state plan exhausted), community transition services, medication management, environmental safety services, case management[2][5][7]` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]`

### Mississippi SNAP (Supplemental Nutrition Assistance Program)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits provided on an Electronic Benefits Transfer (EBT) card to help low-income households buy food[5]. Specific benefit amounts vary by household size and income but are not detailed in available search results.` ([source](https://www.mdhs.ms.gov/help/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.mdhs.ms.gov/help/snap/`

### Mississippi LIHEAP (Low-Income Home Energy Assistance Program)

- **income_limit**: Ours says `$2783` → Source says `$2,228` ([source](https://www.mdhs.ms.gov/community/liheap/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Payments for home energy bills (power, gas), energy crisis, purchase/repair/replacement of AC/heaters. Heating/cooling max $1,500, min $1; crisis max $1,500. Amounts based on income, household size, fuel type.[1][2][4]` ([source](https://www.mdhs.ms.gov/community/liheap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.mdhs.ms.gov/community/liheap/`

### Mississippi SHIP (State Health Insurance Assistance Program)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one counseling on Medicare Parts A/B/C/D, Medigap, Medicare Savings Programs, Extra Help/LIS, Medicaid, long-term care options, SenioRxMS, appeals, claims, bill organization, fraud prevention via SMP; outreach events, presentations, printed materials, referrals[1][2][3][6]` ([source](https://www.mdhs.ms.gov/adults-seniors/services-for-seniors/state-health-insurance-assistance-program/))
- **source_url**: Ours says `MISSING` → Source says `https://www.mdhs.ms.gov/adults-seniors/services-for-seniors/state-health-insurance-assistance-program/`

### Mississippi Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Five core services: 1) Information about available services; 2) Assistance gaining access to services; 3) Individual counseling, support groups, caregiver training; 4) Respite care (one unit = one hour); 5) Supplemental services on limited basis to complement care. No fixed dollar amounts or weekly hours specified beyond respite unit definition[5][6][7].` ([source](https://www.mdhs.ms.gov/aging/caregivers/[6]))
- **source_url**: Ours says `MISSING` → Source says `https://www.mdhs.ms.gov/aging/caregivers/[6]`

### Mississippi Legal Services (Senior Legal Helpline)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free civil legal assistance including phone advice, document review, letter writing, advocacy, and representation in areas like elder care, housing, family, consumer, income maintenance. No attorney fees charged. Limited to phone advice in some cases with possible referrals.[1][3][4][5][8]` ([source](https://mscenterforlegalservices.org and https://www.mslegalservices.org))
- **source_url**: Ours says `MISSING` → Source says `https://mscenterforlegalservices.org and https://www.mslegalservices.org`

### Mississippi Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Assists with complaints (abuse, neglect, improper discharge, food quality, medication issues); conducts facility visits and assessments; provides information on rights; helps select facilities; systems advocacy for groups; resolves problems to improve quality of life. In 2023: 973 individuals assisted, 151,094 visits, 2,352 complaints fully resolved.` ([source](https://www.mdhs.ms.gov/aging/ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://www.mdhs.ms.gov/aging/ombudsman/`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE) - Not available in MS** — service ([source](https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[5]))
  - Shape notes: Not available in Mississippi; no providers, no service areas, no applications possible; eligibility hinges on geographic availability which MS lacks
- **Mississippi Weatherization Assistance Program (WAP)** — service ([source](https://www.mdhs.ms.gov/wap/))
  - Shape notes: Administered statewide via local CAAs with county-based providers; priority tiers for vulnerable groups like elderly; income at 200% FPG with full household verification; pre-app online, full app in-person.
- **Mississippi Meals on Wheels (via Aging and Disability Resource Centers)** — service ([source](https://www.mdhs.ms.gov/aging/services/))
  - Shape notes: Administered statewide via local Area Agencies on Aging/ADRCs with no income/asset test; priority-based access with regional provider and meal format variations (frozen minimum vs. hot in some counties)
- **Mississippi Access to Care (MAC) Network** — service ([source](https://www.mississippiaccesstocare.org))
  - Shape notes: Tied to Medicaid E&D Waiver; eligibility via Medicaid ABD + NFLOC; services fixed list, no dollar/hour caps specified; statewide but provider-delivered with potential regional wait/provider variations

## Program Details

### Medicaid Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: {"note":"Income limits are based on Federal Poverty Guidelines and change annually. The following are 2024 limits from Mississippi Medicaid; 2026 limits may differ slightly.","QMB":{"individual_monthly":"$1,305","couple_monthly":"$1,754","basis":"100% of Federal Poverty Level"},"SLMB":{"individual_monthly":"Above QMB up to $1,585","couple_monthly":"Above QMB up to $2,135","basis":"120% of Federal Poverty Level"},"QI":{"individual_monthly":"Above SLMB up to $1,781","couple_monthly":"Above SLMB up to $2,400","basis":"135% of Federal Poverty Level"}}
- Assets: {"QMB":"No resource test — assets do not matter[6]","SLMB":"Not specified in search results","QI":"Individual: $9,660; Married couple: $14,470[3]"}
- Must be eligible for Medicare Part A (Hospital Insurance)[5]
- Must be enrolled in both Part A and Part B for QI[7]
- If eligible for Medicaid, you cannot use QI program but may qualify for QMB or SLMB[7]

**Benefits:** N/A
- Varies by: program_tier (QMB > SLMB > QI in terms of coverage breadth)

**How to apply:**
- Contact Mississippi Division of Medicaid directly (specific phone number and online portal URL not provided in search results)
- In-person at local Medicaid office (specific locations not provided in search results)
- Mail application to Mississippi Division of Medicaid (specific mailing address not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** QI program has limited federal funding and operates on first-come, first-served basis until money runs out; you must reapply annually[3][10]

**Watch out for:**
- QI program has limited federal funding and operates on first-come, first-served basis — you must reapply every year, and if funds run out, the program could be affected[5][10]
- If you are already eligible for Medicaid, you cannot use the QI program but may qualify for QMB or SLMB instead[7]
- QMB has no retroactive coverage — eligibility begins the month after approval, not before[6]
- SLMB and QI do not cover deductibles, coinsurance, or copayments — only Part B premiums[3]
- Income limits change annually based on Federal Poverty Guidelines; families should verify current limits each year[7]
- SLMB and QI do not provide a Medicaid card, while QMB does[5]
- QI program only applies to Original Medicare (Parts A and B), not Medicare Advantage (Part C) or Medigap plans[7]

**Data shape:** This program consists of three distinct tiers (QMB, SLMB, QI) with progressively higher income limits but fewer benefits. QMB is the most comprehensive but has the lowest income threshold. QI has the highest income limit but only covers Part B premiums and has limited federal funding. Income limits are tied to Federal Poverty Guidelines and change annually. Asset limits apply only to QI and not to QMB. Eligibility start dates vary by program (retroactive for SLMB/QI, not for QMB). The search results do not provide specific application procedures, form numbers, phone numbers, processing times, or regional office locations for Mississippi.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ms.gov/medicaid-coverage/who-qualifies-for-coverage/medicare-cost-sharing/

---

### Mississippi Elderly and Disabled (E&D) Waiver


**Eligibility:**
- Age: 21 or older (65+ for elderly; 21-64 for physically disabled; those enrolled before 65 can continue after)[1][2]+
- Income: Qualify as SSI beneficiary or up to 300% of SSI federal benefit rate (exact 2026 dollar amount not specified in sources; if exceeds 300% SSI, pay excess via income trust to Division of Medicaid). No household size table provided; applies to applicant[2][3][4]
- Assets: Follows Medicaid rules (specifics not detailed); home equity limit of $752,000 in 2026 if applicant lives in home or intends to return (exempt if spouse or minor/permanently disabled child lives there)[1]
- Mississippi resident
- Medicaid eligible
- Nursing Facility Level of Care (NFLOC) via in-person LTSS assessment by RN and social worker (ADLs, IADLs, cognitive deficits scored numerically)[1][2][3][4]
- Physician certification of NFLOC, re-certified every 12 months[3][4]

**Benefits:** Adult day health care, home-delivered meals, personal care services, institutional respite, in-home respite, expanded/extended home health (skilled nursing, nurse aide, physical therapy, speech therapy after state plan exhausted), community transition services, medication management, environmental safety services, case management[2][5][7]

**How to apply:**
- Contact Office of Long Term Care or Planning and Development Districts for case management (RN and social worker screen and assess); no specific phone/URL/form listed in sources[2]
- Administered by Mississippi Division of Medicaid, Office of Long Term Care[2]

**Timeline:** Not specified
**Waitlist:** Not mentioned (may exist due to waiver caps, but no data provided)

**Watch out for:**
- Income over 300% SSI requires monthly payment of excess via income trust (not a spend-down)[2][3][4]
- Must meet strict NFLOC via scored in-person assessment; dementia diagnosis alone insufficient[1]
- Home equity limit $752,000 (2026) applies unless exemptions met[1]
- Distinguish from Independent Living Waiver (ILW, ages 16-64 severe impairments) or Assisted Living Waiver[5][6]
- Services only after Medicaid state plan benefits exhausted (e.g., extended home health)[7]

**Data shape:** Tied to SSI levels (no fixed dollar table or household variations specified); NFLOC physician-certified and reassessed annually; statewide but case-managed regionally by districts; income trust for excess over 300% SSI

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]

---

### Program of All-Inclusive Care for the Elderly (PACE) - Not available in MS

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits; no financial criteria considered for eligibility[1][4][5]
- Assets: No asset limits; financial status does not affect eligibility[1][4]
- Live in the service area of a PACE organization (none in Mississippi)
- Certified by the state as needing nursing home level of care
- Able to live safely in the community with PACE services
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice[1][5]

**Benefits:** Comprehensive services including adult day care, transportation, primary medical care, in-home/outpatient therapy, meals/nutrition, prescription drugs, and all Medicare/Medicaid-covered services without copays/deductibles for enrollees[2][4]

**Waitlist:** Waitlists common where available, but irrelevant in MS[3]

**Watch out for:**
- PACE is unavailable in Mississippi, so families cannot enroll regardless of meeting other criteria[4]
- Must live in a PACE service area, which excludes all of MS[1][3][5]
- Even if eligible elsewhere, cannot be in Medicare Advantage or hospice[1]
- Non-Medicaid enrollees may pay premiums for long-term care and Part D drugs[3][7]

**Data shape:** Not available in Mississippi; no providers, no service areas, no applications possible; eligibility hinges on geographic availability which MS lacks

**Source:** https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[5]

---

### Mississippi SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Income: {"general_households":"Maximum net monthly income (100% Federal Poverty Level): 1 person: $1,255 | 2 people: $1,704 | 3 people: $2,152 | 4 people: $2,600 | 5 people: $3,049 | Each additional person: +$449[3]","households_with_member_60_or_older_or_disabled":"No gross income limit in Mississippi[4]. Only the net income test applies (gross income minus allowable deductions)[2][4]","seniors_60_and_older":"For 2025: $15,060 for one person or $20,440 for two people (federal SNAP standard for seniors)[2]"}
- Assets: {"general_households":"$3,000 in countable resources[3]","households_with_member_60_or_older_or_disabled":"$4,500 in countable resources[3]","what_counts":"Bank accounts, cash, real estate, personal property, and vehicles[3]","what_is_exempt":"Your house and at least one vehicle per household are not counted toward the limit[3]"}
- Work for low wages, be unemployed, work part-time, or receive TANF, SSI, or other assistance payments[5]
- Be a resident of Mississippi[6]
- Household members must be included in the application if they live with you and buy and prepare food with you[2]

**Benefits:** Monthly benefits provided on an Electronic Benefits Transfer (EBT) card to help low-income households buy food[5]. Specific benefit amounts vary by household size and income but are not detailed in available search results.
- Varies by: household_size

**How to apply:**
- In-person at Mississippi Department of Human Services (MDHS) offices[5]
- Phone: Not specified in search results
- Online: Not specified in search results
- Mail: Not specified in search results

**Timeline:** Not specified in search results

**Watch out for:**
- Elderly Simplified Application Project (ESAP) has strict requirements: ALL household members must be 60 or older, AND no one can have earned income. If even one household member is under 60 or has earned income, the household does not qualify for ESAP and must use the standard application[1][3]
- If a household qualifies for ESAP, they are MANDATORY for ESAP and ineligible for regular SNAP[1]
- Seniors (60+) only need to meet the net income test, not the gross income test, which can be advantageous[2][4]
- Social Security, veterans' benefits, and disability payments all count toward total income[2]
- About half of eligible seniors do not receive SNAP benefits, suggesting significant underutilization[2]
- Mississippi Combined Application Project (MSCAP) is a separate streamlined process for individuals receiving SSI benefits[5]
- The search results do not provide specific phone numbers, online application URLs, processing times, required documents, or regional office locations — families will need to contact MDHS directly for these details

**Data shape:** Mississippi SNAP has a bifurcated eligibility structure: households with members 60+ or disabled face no gross income limit and only the net income test, while other households must pass both gross and net income tests. The program offers a simplified application pathway (ESAP) exclusively for elderly households with no earned income, which streamlines enrollment but has strict eligibility gates. Benefits are provided via EBT card and scale by household size, but specific benefit amounts are not detailed in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mdhs.ms.gov/help/snap/

---

### Mississippi LIHEAP (Low-Income Home Energy Assistance Program)


**Eligibility:**
- Income: Household gross monthly income at or below 60% of state median income: 1 person $2,228/month; 2 people $2,914/month; 3 people $3,599/month; 4 people $4,285/month; 5 people $4,970/month; 6 people $5,656/month (2025 figures). Annual example around $27,906 for qualifying household.[1][2][4]
- Assets: No asset limits mentioned in program rules.[3]
- U.S. citizen or legal permanent resident.
- Resident of Mississippi in the county where applying; must have energy bill obligation to utility or landlord.
- Homeless households may apply if seeking services.
- Priority for vulnerable households: elderly (60+), disabled, or children 5 or younger.[1][3]

**Benefits:** Payments for home energy bills (power, gas), energy crisis, purchase/repair/replacement of AC/heaters. Heating/cooling max $1,500, min $1; crisis max $1,500. Amounts based on income, household size, fuel type.[1][2][4]
- Varies by: household_size|priority_tier

**How to apply:**
- Online: https://www.mdhs.ms.gov/community/liheap/ (select 'Community Services').[1]
- Phone: Contact local Community Action Agency (CAA) by county; statewide LIHEAP hotline 1-866-674-6327.[1][5]
- In-person/mail: Local CAA offices in each of 82 counties.[1][3]

**Timeline:** Not specified; appointment notice sent after application with instructions.[1]
**Waitlist:** Funding limited; apply early as funds may run out. Vulnerable households prioritized.[1][2][3]

**Watch out for:**
- Funding limited and not year-round: heating Oct-Apr, cooling May-Sep, crisis year-round; apply early.[2]
- Must apply in own county; priority to elderly/disabled/young children but all qualifying get considered.[1][3]
- No automatic eligibility specified; verify via local CAA as roommates count as household.[2]
- Weatherization separate (200% FPL, DOE rules).[3]

**Data shape:** County-administered via CAAs with priority tiers for vulnerable; seasonal components; benefits scaled by income/household size/fuel; limited funds drive early application urgency.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mdhs.ms.gov/community/liheap/

---

### Mississippi Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 200% of the current Federal Poverty Guidelines. Exact dollar amounts vary annually and by household size; refer to the current FPG table on the MDHS website as no specific yearly figures are listed in sources. For example, priorities include seniors (60+), but no strict age cutoff for eligibility.[1][2]
- Assets: No asset limits mentioned in program rules.[1][2]
- Mississippi resident.
- Household must complete full application process for eligibility determination, including verification of income, residence, and household members.
- Dwelling must meet eligibility (e.g., primary residence; proof of ownership or rental status required; energy audit confirms suitability). Renters may qualify—contact local CAA for details.
- Priority populations (not requirements): seniors 60+, people with disabilities, households with children 5 and under, high residential energy users, households with high energy burden.[1][2]

**Benefits:** Free weatherization services to make homes more energy efficient, including installation of cost-effective measures based on energy audit (e.g., addressing insulation, air sealing, heating/cooling systems, health/safety issues). Improves comfort, air quality, and reduces energy costs. Energy efficiency education provided.[1][5]
- Varies by: priority_tier

**How to apply:**
- Online pre-application via Common Web Portal on Access MS (information forwarded to local Community Action Agency (CAA)).[1]
- In-person: CAA staff contact to schedule appointment for full application.[1]
- Phone: Contact local CAA (e.g., Southwest Mississippi Opportunity, Inc. at (601) 684-1777 or toll-free (877) 891-1271 for specific counties).[5]
- Regional CAA offices handle intake—search for local CAA via MDHS.[1]

**Timeline:** Not specified; CAA contacts to schedule after pre-application submission.[1]
**Waitlist:** Funds availability varies (e.g., announced as 'currently available' in some areas); may depend on federal funding like ARRA.[5]

**Watch out for:**
- Must submit pre-application online first via Access MS; full app is in-person only—no direct mail/online completion.[1]
- Renters may qualify but need local CAA confirmation; not automatic.[1]
- Priority for elderly/disabled/young children/high energy burden, but all ≤200% FPG eligible if funds allow.[1]
- Dwelling eligibility requires pre-audit and proof of ownership/residency.[2]
- Income verified at time of application using current FPG; non-applicants (e.g., certain citizenship statuses) must still disclose income.[2]
- Availability tied to federal funds; may have regional shortages.[5]

**Data shape:** Administered statewide via local CAAs with county-based providers; priority tiers for vulnerable groups like elderly; income at 200% FPG with full household verification; pre-app online, full app in-person.

**Source:** https://www.mdhs.ms.gov/wap/

---

### Mississippi SHIP (State Health Insurance Assistance Program)


**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, their families, caregivers, and representatives of disabled persons[1][2][3]
- Assets: No asset limits or tests apply[1][2]
- Must be a Medicare beneficiary, disabled person, or inquiry on their behalf; no other restrictions[1][2][3]

**Benefits:** Free one-on-one counseling on Medicare Parts A/B/C/D, Medigap, Medicare Savings Programs, Extra Help/LIS, Medicaid, long-term care options, SenioRxMS, appeals, claims, bill organization, fraud prevention via SMP; outreach events, presentations, printed materials, referrals[1][2][3][6]

**How to apply:**
- Phone: 1-844-822-4622 or 601-709-0624 (M-F 8am-5pm)[3][8]
- Website: https://www.mdhs.ms.gov/adults-seniors/services-for-seniors/state-health-insurance-assistance-program/[3]
- In-person and phone-based counseling available statewide[3]

**Timeline:** Immediate assistance via phone or in-person; no formal application processing[3]

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling and education, no direct payments or services; distinguish from Small Rural Hospital Improvement (SHIP) grant which is unrelated[5]; services are unbiased and objective, not sales-oriented; counselors must be CMS-trained annually[1][2][3]

**Data shape:** no income/asset/age test; purely counseling service with statewide phone/in-person access; funded by federal grants to MDHS, volunteer/staff network

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mdhs.ms.gov/adults-seniors/services-for-seniors/state-health-insurance-assistance-program/

---

### Mississippi Meals on Wheels (via Aging and Disability Resource Centers)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or means testing; program is not income-based[2].
- Assets: No asset limits or means testing[2].
- Homebound or unable to shop for food, prepare meals, or socialize due to mobility challenges[1][5][6]
- Potentially at risk for early institutionalization[6]
- Priority to those on no congregate meals waiting list; spouses of eligible adults may qualify regardless of age[2][5]
- Nutrition risk assessment via Consumer Information Form (CIF)[2]

**Benefits:** Minimum five frozen meals per week, each providing at least 33 1/3% of dietary reference intakes (DRIs); may include hot noon meals 5 days/week in some areas[2][4][6]. Meals meet Older Americans Act nutrition standards[2]. Suggested donation or sliding scale possible, but voluntary contributions only[1][2].
- Varies by: region

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Area Agency on Aging via MDHS search tool at https://www.mdhs.ms.gov/aging/services/[6]
- Phone examples: 662-844-1441 ext. 1056 for Lee County (Mississippi Methodist Senior Services)[4]
- Application and needs assessment required; possible doctor/social worker referral[1]

**Timeline:** Not specified in sources
**Waitlist:** Priority access if no one on home-delivered waiting list; waitlists exist and may limit availability[2]

**Watch out for:**
- Not means-tested, but priority to homebound 60+ with no congregate options; meals may be frozen (min 5/week) not always hot/fresh[2][6]
- Availability limited by waitlists and local providers; contact ADRC first, not national Meals on Wheels[1][2][6]
- Spouses under 60 may qualify if linked to eligible adult, but under-60 generally only with disabilities[5]
- Voluntary contributions expected but not required; private options like Mom's Meals ($9.49/meal) if ineligible[3]

**Data shape:** Administered statewide via local Area Agencies on Aging/ADRCs with no income/asset test; priority-based access with regional provider and meal format variations (frozen minimum vs. hot in some counties)

**Source:** https://www.mdhs.ms.gov/aging/services/

---

### Mississippi Family Caregiver Support Program


**Eligibility:**
- Income: Priority given to low-income older individuals with greatest social and economic need; no specific dollar amounts or household size table provided in sources[5][6].
- Assets: No asset limits specified[6].
- Caregivers: Adults age 18+ caring for eligible care recipients; special populations include adults 55+ caring for non-child adults 18+ with developmental disabilities, or grandparents/relatives 60+ caring for children 18 or younger[3][5][6].
- Care recipients: Older adults (typically 60+) or people with disabilities; also children under 18 for relative caregivers 60+[6].
- Priority to older individuals with greatest social/economic need, low-income, and those caring for persons with mental retardation/related developmental disabilities[5].

**Benefits:** Five core services: 1) Information about available services; 2) Assistance gaining access to services; 3) Individual counseling, support groups, caregiver training; 4) Respite care (one unit = one hour); 5) Supplemental services on limited basis to complement care. No fixed dollar amounts or weekly hours specified beyond respite unit definition[5][6][7].
- Varies by: priority_tier

**How to apply:**
- Phone: Contact Mississippi Access to Care (MAC) Center at 844-822-4622[6].
- Partnerships: Through community-based Area Agencies on Aging (AAA) and local providers[6].

**Timeline:** Not specified in sources.

**Watch out for:**
- Not a paid caregiving program (no direct payments to family caregivers); focuses on support services like respite and counseling[6].
- Often confused with Medicaid EDWP (pays family caregivers) or VA PCAFC (veteran-specific)[1][4].
- Priority-based access may limit availability for non-priority caregivers[5].
- Separate from Mississippi Dementia Care Program, which provides ~27 hours/month respite for ADRD caregivers[6].

**Data shape:** Services delivered via local AAAs/providers with priority tiers for low-income/greatest need; no strict income/asset tests or fixed benefits; not payment-based

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mdhs.ms.gov/aging/caregivers/[6]

---

### Mississippi Legal Services (Senior Legal Helpline)


**Eligibility:**
- Age: 60+
- Income: Household gross income at or below 125% of federal poverty guidelines. Exact dollar amounts vary annually by household size (based on HHS federal poverty guidelines); exceptions possible for seniors. Total receipts include wages, salaries before deductions, and regular public assistance payments (e.g., Social Security, SSI, TANF) from all resident household members contributing to support.[1][2][3][5]
- Assets: No asset limits mentioned in available sources.
- Reside in service area (central/southern Mississippi for MCLSC or northern for NMRLS)
- Not prisoners
- Civil legal issues only (e.g., consumer, housing, family, elder care)

**Benefits:** Free civil legal assistance including phone advice, document review, letter writing, advocacy, and representation in areas like elder care, housing, family, consumer, income maintenance. No attorney fees charged. Limited to phone advice in some cases with possible referrals.[1][3][4][5][8]
- Varies by: region

**How to apply:**
- Phone: MCLSC (central/southern MS) 1-800-519-2915 or 1-800-498-1804; NMRLS (north MS) 1-800-898-8731
- Website: mscenterforlegalservices.org (apply online), mslegalservices.org (intake guide)
- In-person: e.g., Jackson Office at 414 South State Street, Third Floor, Jackson, MS 39205

**Timeline:** Not specified in sources.

**Watch out for:**
- Not fully statewide—must use correct regional hotline/provider based on zip code/county (north vs. central/southern MS)
- Income is gross household total from all contributing members; seniors may get exceptions but still screened
- Excludes prisoners and criminal cases; only civil matters
- Online intake for north MS temporarily closed—use phone
- Hotline numbers changed January 2026; older numbers (e.g., 888-660-0008) may be outdated

**Data shape:** Regionally divided with separate providers/hotlines; income at 125% FPL with senior exceptions; no asset test or exact dollar tables in sources (varies yearly by household size)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mscenterforlegalservices.org and https://www.mslegalservices.org

---

### Mississippi Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available regardless of ability to pay.
- Assets: No asset limits; no financial requirements.
- Resides in or is a potential resident of a long-term care facility subject to regulation or licensure by the Mississippi State Department of Health (e.g., nursing homes, assisted living facilities, personal care homes, adult day care, long-term rehab centers, hospice centers).
- Complainants (e.g., family members) can contact on behalf of residents without residency requirement.

**Benefits:** Assists with complaints (abuse, neglect, improper discharge, food quality, medication issues); conducts facility visits and assessments; provides information on rights; helps select facilities; systems advocacy for groups; resolves problems to improve quality of life. In 2023: 973 individuals assisted, 151,094 visits, 2,352 complaints fully resolved.

**How to apply:**
- Phone: 1-888-844-0041 (toll-free) or 601-359-4927 (State Ombudsman Lisa M. Smith)
- Website: https://www.mdhs.ms.gov/aging/ombudsman/
- Mail: MDHS, 200 South Lamar St., Jackson, MS 39201

**Timeline:** Timely responses to requests and complaints required, but no specific timeline stated.

**Watch out for:**
- Not a direct service provider (e.g., no personal care, meals, or financial aid); purely advocacy and complaint resolution.
- No Medicaid or financial eligibility test—open to all, but only for regulated long-term care facilities.
- Family/complainants drive access; residents don't apply independently.
- Volunteers must be certified; public contacts staff or designated ombudsmen.
- Not for community/home-based care—facility-focused only.

**Data shape:** No income/asset/age tests; advocacy-only (non-financial); delivered via 19 local ombudsmen through AAAs covering all counties; complaint-driven access.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mdhs.ms.gov/aging/ombudsman/

---

### Mississippi Access to Care (MAC) Network

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must be Medicaid eligible under Aged, Blind, or Disabled (ABD) category; specific dollar amounts not listed in sources but tied to Mississippi Medicaid ABD income limits (typically around 100% FPL for individuals, varying by household; e.g., ~$1,255/month for single in 2026 per general Medicaid ABD rules, consult medicaid.ms.gov for exact FPL table). No separate MAC-specific income table provided.
- Assets: Medicaid ABD rules apply: $2,000 individual resource limit (exempt: primary home if equity ≤$752,000 in 2026 or spouse/minor/disabled child lives there, one vehicle, personal belongings, burial plots).
- Mississippi resident
- Medicaid eligible
- Require Nursing Facility Level of Care (NFLOC) assessed in-person via ADLs/IADLs/cognitive deficits by licensed social worker/nurse
- Medically stable
- Live in home or have intent to return

**Benefits:** Case Management, Adult Day Services, Expanded Home Health Services, Home Delivered Meals, Personal Care Services, Institutional Respite and/or In-Home Respite, Transition Assistance

**How to apply:**
- Website: https://www.mississippiaccesstocare.org (primary entry point for info/programs)
- Phone: Not specified in results; contact Mississippi Division of Medicaid at general line or local Area Agency on Aging (search medicaid.ms.gov)
- Mail/In-person: Apply via Mississippi Medicaid at medicaid.ms.gov or local offices; Pre-Admission Screening via eLTSS system

**Timeline:** Not specified
**Waitlist:** Likely due to waiver slots (common for HCBS); not detailed

**Watch out for:**
- Must first qualify for Medicaid ABD (people miss the strict NFLOC assessment—not just age/disability)
- Home equity limit $752,000 excludes many with home ownership
- Waiver has limited slots leading to waitlists
- Must accept all other benefits (e.g., VA/SSI) or lose eligibility
- Dementia diagnosis alone does not guarantee NFLOC

**Data shape:** Tied to Medicaid E&D Waiver; eligibility via Medicaid ABD + NFLOC; services fixed list, no dollar/hour caps specified; statewide but provider-delivered with potential regional wait/provider variations

**Source:** https://www.mississippiaccesstocare.org

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid Medicare Savings Programs (QMB, | benefit | federal | medium |
| Mississippi Elderly and Disabled (E&D) W | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | medium |
| Mississippi SNAP (Supplemental Nutrition | benefit | federal | medium |
| Mississippi LIHEAP (Low-Income Home Ener | benefit | federal | deep |
| Mississippi Weatherization Assistance Pr | benefit | federal | deep |
| Mississippi SHIP (State Health Insurance | resource | federal | simple |
| Mississippi Meals on Wheels (via Aging a | navigator | federal | simple |
| Mississippi Family Caregiver Support Pro | benefit | state | deep |
| Mississippi Legal Services (Senior Legal | resource | local | simple |
| Mississippi Long-Term Care Ombudsman Pro | resource | federal | simple |
| Mississippi Access to Care (MAC) Network | benefit | state | deep |

**Types:** {"benefit":8,"resource":3,"navigator":1}
**Scopes:** {"federal":7,"state":3,"local":2}
**Complexity:** {"medium":3,"deep":5,"simple":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/MS/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_tier (QMB > SLMB > QI in terms of coverage breadth)**: 1 programs
- **not_applicable**: 5 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **priority_tier**: 2 programs
- **region**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid Medicare Savings Programs (QMB, SLMB, QI)**: This program consists of three distinct tiers (QMB, SLMB, QI) with progressively higher income limits but fewer benefits. QMB is the most comprehensive but has the lowest income threshold. QI has the highest income limit but only covers Part B premiums and has limited federal funding. Income limits are tied to Federal Poverty Guidelines and change annually. Asset limits apply only to QI and not to QMB. Eligibility start dates vary by program (retroactive for SLMB/QI, not for QMB). The search results do not provide specific application procedures, form numbers, phone numbers, processing times, or regional office locations for Mississippi.
- **Mississippi Elderly and Disabled (E&D) Waiver**: Tied to SSI levels (no fixed dollar table or household variations specified); NFLOC physician-certified and reassessed annually; statewide but case-managed regionally by districts; income trust for excess over 300% SSI
- **Program of All-Inclusive Care for the Elderly (PACE) - Not available in MS**: Not available in Mississippi; no providers, no service areas, no applications possible; eligibility hinges on geographic availability which MS lacks
- **Mississippi SNAP (Supplemental Nutrition Assistance Program)**: Mississippi SNAP has a bifurcated eligibility structure: households with members 60+ or disabled face no gross income limit and only the net income test, while other households must pass both gross and net income tests. The program offers a simplified application pathway (ESAP) exclusively for elderly households with no earned income, which streamlines enrollment but has strict eligibility gates. Benefits are provided via EBT card and scale by household size, but specific benefit amounts are not detailed in available sources.
- **Mississippi LIHEAP (Low-Income Home Energy Assistance Program)**: County-administered via CAAs with priority tiers for vulnerable; seasonal components; benefits scaled by income/household size/fuel; limited funds drive early application urgency.
- **Mississippi Weatherization Assistance Program (WAP)**: Administered statewide via local CAAs with county-based providers; priority tiers for vulnerable groups like elderly; income at 200% FPG with full household verification; pre-app online, full app in-person.
- **Mississippi SHIP (State Health Insurance Assistance Program)**: no income/asset/age test; purely counseling service with statewide phone/in-person access; funded by federal grants to MDHS, volunteer/staff network
- **Mississippi Meals on Wheels (via Aging and Disability Resource Centers)**: Administered statewide via local Area Agencies on Aging/ADRCs with no income/asset test; priority-based access with regional provider and meal format variations (frozen minimum vs. hot in some counties)
- **Mississippi Family Caregiver Support Program**: Services delivered via local AAAs/providers with priority tiers for low-income/greatest need; no strict income/asset tests or fixed benefits; not payment-based
- **Mississippi Legal Services (Senior Legal Helpline)**: Regionally divided with separate providers/hotlines; income at 125% FPL with senior exceptions; no asset test or exact dollar tables in sources (varies yearly by household size)
- **Mississippi Long-Term Care Ombudsman Program**: No income/asset/age tests; advocacy-only (non-financial); delivered via 19 local ombudsmen through AAAs covering all counties; complaint-driven access.
- **Mississippi Access to Care (MAC) Network**: Tied to Medicaid E&D Waiver; eligibility via Medicaid ABD + NFLOC; services fixed list, no dollar/hour caps specified; statewide but provider-delivered with potential regional wait/provider variations

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Mississippi?
