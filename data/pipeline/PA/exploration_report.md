# Pennsylvania Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 5.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 9 |
| New (not in our data) | 2 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 2 | Benefits/eligibility vary by household size — we store a single number |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 6 programs
- **financial**: 2 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Community HealthChoices (CHC)

- **min_age**: Ours says `65` → Source says `21` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc))
- **income_limit**: Ours says `$988` → Source says `$2,901` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Up to 32 services including long-term services and supports (LTSS) such as home health, personal care, attendant care, adult day services, pest eradication, educational support, nursing facility care if needed. Delivered via managed care organization (MCO). No fixed dollar amounts or hours; individualized based on needs assessment.[4]` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/medicaid/chc`

### PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$2901` → Source says `$14,500` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Low-cost prescription drugs. PACE: $0 monthly premium; co-pays $6 generic, $9 brand-name per Rx. (PACENET, related: $37.45 monthly premium; $8 generic, $15 brand-name.) Funded by PA Lottery.[6][8]` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **income_limit**: Ours says `$1980` → Source says `$2608,` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `EBT card for food purchases at stores/supermarkets. Average for older adults: $106/month (varies by income, expenses, size). Computed: max allotment minus 30% net income (e.g., 2-person elderly: $546 max - 30% net).[1][4][5]` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults`

### SHIP (State Health Insurance Assistance Program)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free one-on-one counseling, education, and assistance on Medicare options including Original Medicare (Parts A & B), Medicare Advantage (Part C), Medicare Prescription Drug Coverage (Part D), and Medicare Supplement (Medigap); help applying for low-income programs like Medicaid, Medicare Savings Programs, and Extra Help/Low Income Subsidy; outreach via presentations, enrollment events, health fairs; Senior Medicare Patrol (SMP) services to prevent, detect, and report Medicare fraud, errors, and abuse[6][8]. No dollar amounts, hours, or direct financial aid provided.` ([source](https://www.shiphelp.org/ships/pennsylvania/ (PA SHIP via shiphelp.org); national: https://acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[6][7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.shiphelp.org/ships/pennsylvania/ (PA SHIP via shiphelp.org); national: https://acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[6][7]`

### Home-Delivered Meals (Meals on Wheels)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/meals-and-food-assistance))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritious home-delivered meals providing 1/3 of daily nutritional requirements per meal, certified by dietitian and PA Department of Aging; menus accommodate diabetes/heart disease; typically 5 days/week with suggestion for 5-day shelf-stable supply; no cost-sharing in many counties (e.g., York)[1][2][5][7][9]` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/meals-and-food-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/meals-and-food-assistance`

### Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Reimbursement for respite care, supplemental services, consumable supplies, and other care-related expenses. Also includes non-financial services like care management, caregiver education, and training. Reimbursement percentage determined by sliding scale based on care receiver's household income and size relative to FPL (up to 380%). Caregiver pays upfront and submits for reimbursement.` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/caregiver-support-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/caregiver-support-program`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigation and resolution of complaints; education on resident rights, procedures, and community resources; empowerment through building advocacy, communication, and negotiation skills; development of resident/family councils and PEER groups; routine unannounced facility visits; mediation; referrals to long-term care programs; assistance with informed decisions on providers. Specific issues addressed: discharge/eviction, response to assistance requests, personal property loss/theft, dietary concerns, facility policies, medications, staffing, access to personal funds/Medicare/Medicaid, quality of life (food, environment, activities), professional care (nursing, rehab, restraints), and dignity policies.` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/advocacy-education-protection[6]))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/advocacy-education-protection[6]`

## New Programs (Not in Our Data)

- **Healthy Horizons (QMB, SLMB, QI)** — financial ([source](https://www.pa.gov/agencies/dhs/resources/aging-physical-disabilities/medicaid-older-people-and-people-with-disabilities))
  - Shape notes: Tiered by income brackets (QMB 100%, SLMB 120%, QI-1 135%, QI-2 175% FPL) with dual resource limits (SSI vs. 2x SSI); spouse deeming required; scales precisely by household size per FPL tables updated annually
- **Older Pennsylvanians Legal Assistance Program (OPLAP)** — service ([source](https://www.pa.gov/services/aging/apply-for-the-older-pennsylvanians-legal-assistance-program))
  - Shape notes: Decentralized statewide network via local legal aid programs with varying guidelines pegged to 125% FPL; no fixed income/asset tables; priority-based with regional providers and high unmet need

## Program Details

### Community HealthChoices (CHC)


**Eligibility:**
- Age: 21+
- Income: Monthly income limit is 300% of the Federal Benefit Rate (FBR), which adjusts annually. In 2025, up to $2,901 per applicant regardless of marital status; each spouse considered individually if both apply. Must meet overall Medicaid financial eligibility determined by County Assistance Office (CAO).[2][3]
- Assets: Medicaid asset limits apply, reviewed by CAO. Home equity limit of $730,000 in 2025 if applicant lives in home or intends to return, or if non-applicant spouse/dependent resides there. Counts: bank accounts, property, retirement accounts. Exemptions: primary home under equity limit, certain personal items (details via CAO review).[2][8]
- Pennsylvania resident
- Enrolled in Medicaid
- Dual eligible (Medicare and Medicaid) OR qualify for Medicaid long-term services and supports (LTSS) due to nursing facility level of care (NFLOC) via Functional Eligibility Determination (FED) assessing Activities of Daily Living (ADLs) like bathing, dressing, eating
- Not ineligible: intellectual/developmental disabilities via DHS Office of Developmental Programs (beyond supports coordination), state-operated nursing facility resident (including veterans' homes), certain OBRA/Act 150 participants without NFLOC or dual eligibility

**Benefits:** Up to 32 services including long-term services and supports (LTSS) such as home health, personal care, attendant care, adult day services, pest eradication, educational support, nursing facility care if needed. Delivered via managed care organization (MCO). No fixed dollar amounts or hours; individualized based on needs assessment.[4]
- Varies by: priority_tier

**How to apply:**
- Phone: Pennsylvania Independent Enrollment Broker (PA IEB) at 1-877-550-4227[1]
- Online: COMPASS website[1]
- Submit PA-600 form to County Assistance Office (CAO) for financial eligibility[4]
- In-person: Local Area Agency on Aging (AAA) for needs assessment; CAO for financial review

**Timeline:** Screening within 90 days for new dual eligibles; comprehensive needs assessment as needed or requested. No specific overall timeline stated.[3]

**Watch out for:**
- Mandatory managed care program; replaces prior waivers like Aging/Attendant Care
- Must choose an MCO after approval; Medicare benefits remain separate
- LIFE program alternative for ages 55+ in served areas (opt-out from CHC)
- Income/assets reviewed strictly by CAO; over-limit may still qualify via spend-down if functional eligibility met
- Not for intellectual/developmental disabilities or state nursing homes
- Functional need (NFLOC via FED) required even if dual eligible

**Data shape:** Managed care via MCOs with tiered services based on NFLOC assessment; financial eligibility tied to Medicaid with annual FBR adjustments; regional MCO/AAA administration; excludes specific disability programs

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/medicaid/chc

---

### PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 65+
- Income: Based on previous calendar year's gross income. PACE: Single person ≤ $14,500; Married couple ≤ $17,700. Note: Search results describe Pennsylvania's Pharmaceutical Assistance Contract for the Elderly (PACE/PACENET), a prescription drug program, not the national PACE long-term care program. No asset limits apply; assets are not counted. Income includes gross Social Security (excluding Medicare premiums), pensions, wages, etc. Excludes: Property Tax/Rent Rebates, VA Aid and Attendance, SNAP, LIHEAP, first $10,000 death benefits, federal stimulus.[1][3][4][6][7]
- Assets: No asset limits; assets are not counted.[7]
- Pennsylvania resident for at least 90 consecutive days prior to application.[1][3][4]
- Not eligible for or enrolled in Medicaid prescription benefits (Department of Human Services' Medical Assistance pharmaceutical benefits).[1][3][4]
- For national PACE long-term care (distinct program): 55+, live in service area, certified for nursing home level of care, able to live safely in community with PACE services; no income/asset test federally, but PA may differ. No PA-specific PACE long-term care details in results.[2]

**Benefits:** Low-cost prescription drugs. PACE: $0 monthly premium; co-pays $6 generic, $9 brand-name per Rx. (PACENET, related: $37.45 monthly premium; $8 generic, $15 brand-name.) Funded by PA Lottery.[6][8]
- Varies by: fixed

**How to apply:**
- Phone: PACE hotline 1-800-225-7223; PA MEDI helpline 1-800-783-7067.[5]
- Website: https://pacecares.magellanhealth.com/.[5]
- PA MEDI (local assistance for application).[5]

**Timeline:** Not specified in results.

**Watch out for:**
- This is Pennsylvania's PACE prescription drug program (Pharmaceutical Assistance Contract for the Elderly), NOT the national PACE (Program of All-Inclusive Care for the Elderly) long-term care/medical services program. Families seeking comprehensive elderly care (adult day health, transportation, nursing) need to search for PA PACE providers separately (e.g., via National PACE Association).[2]
- Income based on prior calendar year; capital gains from home sale count if within 2 years.[7]
- Excludes Medicare Part B premiums from income count; full Medicaid disqualifies, but Medicare Savings Program help with Part B may still qualify.[5]
- No automatic annual income adjustments.[6]

**Data shape:** PA PACE is a statewide prescription-only program with fixed income thresholds by marital status (single/couple only, no larger households); no assets test; distinct from national PACE long-term care model which has no federal income test and requires nursing-home level certification.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program[8]

---

### Healthy Horizons (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Income limits are based on 2025 Federal Poverty Level (FPL) plus a $20 deductible for some categories, varying by household size and program tier. Full table:

**QMB (Healthy Horizons Categorically Needy or Medicare Cost-Sharing, up to 100% FPL + $20):**
| Household Size | Monthly Income Limit |
|---------------|----------------------|
| 1             | $1,350               |
| 2             | $1,824               |

**SLMB (101-120% FPL):**
Up to 120% FPL (e.g., approximately $1,565 for individual, $2,116 for couple, exact FPL base $1,330 individual/$1,804 couple + adjustments).

**QI-1 (120-135% FPL):** Up to 135% FPL.

**QI-2 (135-175% FPL):** Up to 175% FPL.

Income calculated as net calendar year income for family, including spouse; higher limits provide Medicare cost-sharing only[3][4][1][8][9].
- Assets: Resources limited by tier:
- **Categorically Needy QMB:** SSI standard ($2,000 individual, $3,000 couple)[3].
- **SLMB, QI, Cost-Sharing QMB:** Up to twice SSI standard ($9,950 individual, $14,910 couple; scales by household size)[3][4].
What counts: Bank accounts, stocks (most countable resources). Exempt: Primary home, one car, personal belongings, burial plots, life insurance up to $1,500 face value, SSI-exempt items per PA rules[1][4].
- Must be entitled to Medicare Part A (even if not enrolled)
- Elderly (65+) or disabled
- PA resident
- U.S. citizen or qualified immigrant
- Family size includes applicant and spouse (non-applicant spouse income/resources considered)

**Benefits:** **QMB (Categorically Needy):** Full Medicaid + Medicare Part A/B premiums, deductibles, coinsurance/copayments paid by state.
**QMB Cost-Sharing:** Medicare Part A/B premiums, deductibles, coinsurance only (no full Medicaid).
**SLMB:** Medicare Part B premium only.
**QI-1/QI-2:** Medicare Part B premium only (QI cannot have full Medicaid)[3][5][6].
- Varies by: priority_tier

**How to apply:**
- Phone: Local County Assistance Office (CAO) - find via 1-866-550-4355 or pa.gov DHS locator
- Online: COMPASS website (www.compass.state.pa.us)
- Mail/In-Person: Local CAO office (search 'PA County Assistance Office' by county)
- Provider-submitted for retroactive claims

**Timeline:** Up to 45 days; effective first of month after all info received (QMB); SLMB/QI retroactive up to 3 months[5][2].
**Waitlist:** No waitlist mentioned; funding may limit QI in some periods but not specified for PA[5].

**Watch out for:**
- Must include spouse's income/resources even if not applying - often missed[1]
- QI-1 cannot receive full Medicaid simultaneously[6]
- No retroactive for cost-sharing only (QMB premiums/deductibles)[1]
- CAO must screen all categories (Healthy Horizons, then SLMB/QI if over limit)[6]
- Assets double for cost-sharing but countable items strict (e.g., second car counts)
- Income is calendar year net, with specific deductions[1]

**Data shape:** Tiered by income brackets (QMB 100%, SLMB 120%, QI-1 135%, QI-2 175% FPL) with dual resource limits (SSI vs. 2x SSI); spouse deeming required; scales precisely by household size per FPL tables updated annually

**Source:** https://www.pa.gov/agencies/dhs/resources/aging-physical-disabilities/medicaid-older-people-and-people-with-disabilities

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: Pennsylvania uses three tests: Gross Income (200% FPL for households with elderly/disabled member), Net Income, and Asset tests. Households with a member 60+ or disabled can qualify via Net/Asset if over gross. Oct 1, 2025–Sept 30, 2026 Gross Income Limits (monthly): 1: $2608, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, +$916 each additional. For ESAP (simplified): all 60+ or SSI/SSDI, no work earnings, fixed income, reasonable rent/mortgage.[1][2][3][7]
- Assets: No asset limit for most PA households, including those under expanded categorical eligibility (income ≤200% FPL). For households with 60+/disabled member over gross income: federal $4,500 limit applies (exempt: home, one vehicle + income-producing vehicles, value over $4,650 on other vehicles counts).[1]
- U.S. citizen or qualified non-citizen.
- Household includes those who buy/prepare food together.
- For seniors: medical expenses, housing costs deducted to maximize benefits.
- ESAP specific: all household 60+ or SSI/SSDI, no earnings, fixed income, reasonable/sub/fixed rent.[7][8]

**Benefits:** EBT card for food purchases at stores/supermarkets. Average for older adults: $106/month (varies by income, expenses, size). Computed: max allotment minus 30% net income (e.g., 2-person elderly: $546 max - 30% net).[1][4][5]
- Varies by: household_size

**How to apply:**
- Online: COMPASS website (www.compass.state.pa.us).
- Phone: County Assistance Office (CAO) or helplines like 1-877-999-5964 (Central PA Food Bank).
- In-person: Local County Assistance Office.
- Mail: Simple SNAP application for all 60+/disabled households.
- Use 'Do I Qualify?' tool on COMPASS.

**Timeline:** Not specified in sources; expedited for urgent need possible.

**Watch out for:**
- Seniors over gross income (200% FPL) can still qualify via net/asset tests.[1]
- No asset limit unless over gross and using federal rules ($4,500).[1]
- Include all who buy/prepare food, even non-relatives.[2][8]
- Housing/medical expenses boost benefits.[4]
- New 2026 rule: prove shelter/utility costs at apply/renew/move.[10]
- ESAP for simplified process if all 60+/SSI/SSDI, no work.[7]

**Data shape:** Expanded eligibility in PA (no asset limit under 200% FPL, special senior paths); benefits scale by household size, income deductions; ESAP tier for elderly/disabled; county-administered.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults

---

### SHIP (State Health Insurance Assistance Program)


**Eligibility:**
- Income: No specific income or asset limits; open to all Medicare beneficiaries, with priority support for people with limited incomes, Medicare beneficiaries under age 65 with disabilities, and individuals dually eligible for Medicare and Medicaid[6].
- Assets: No asset limits or tests apply[6].
- Medicare beneficiary (or family/caregiver of one)
- Pennsylvania resident[7]

**Benefits:** Free one-on-one counseling, education, and assistance on Medicare options including Original Medicare (Parts A & B), Medicare Advantage (Part C), Medicare Prescription Drug Coverage (Part D), and Medicare Supplement (Medigap); help applying for low-income programs like Medicaid, Medicare Savings Programs, and Extra Help/Low Income Subsidy; outreach via presentations, enrollment events, health fairs; Senior Medicare Patrol (SMP) services to prevent, detect, and report Medicare fraud, errors, and abuse[6][8]. No dollar amounts, hours, or direct financial aid provided.

**How to apply:**
- Phone: 1-800-783-7067[7]
- Website: Pennsylvania Medicare Education and Decision Insight (PA MEDI) program site (linked via shiphelp.org)[7]

**Timeline:** No formal application or processing time; services provided upon contact via phone or local counselors[6][7].

**Watch out for:**
- Not health insurance or direct financial aid—only free counseling and education; does not provide healthcare services itself[6][8]
- Priority for low-income, disabled under 65, or dual eligibles, but open to all Medicare beneficiaries[6]
- Often confused with children's CHIP program in PA; SHIP is strictly for Medicare help[1][4][7]
- Requires contacting local counselors for personalized help; no online self-service application[7]

**Data shape:** no income/asset test; counseling-only service via statewide phone/website with local delivery network; priority tiers by need but universal access for Medicare beneficiaries

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.shiphelp.org/ships/pennsylvania/ (PA SHIP via shiphelp.org); national: https://acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[6][7]

---

### Home-Delivered Meals (Meals on Wheels)


**Eligibility:**
- Age: 60+
- Income: No statewide income limits specified; some counties like Armstrong require financial inability to purchase consumable goods, but most examples (York, Blair, Montgomery) do not mention dollar amounts or tables. Income guidelines apply to related programs like Senior Food Box or Farmers Market, but not consistently for home-delivered meals[1][2][5][7][8].
- Assets: No asset limits mentioned in any sources.
- Pennsylvania resident in a non-institutional home setting[1][2][8]
- Physical, mental, or emotional disability preventing leaving home regularly and/or preparing nutritious meals (York, Blair, Armstrong)[1][2][5]
- Living alone or with someone who also qualifies[1]
- Unable to access/prepare food or shop safely without informal supports (Montgomery, statewide In-Home Meals)[7][8]
- In-home assessment by care manager required to confirm eligibility (all counties)[1][2][5]

**Benefits:** Nutritious home-delivered meals providing 1/3 of daily nutritional requirements per meal, certified by dietitian and PA Department of Aging; menus accommodate diabetes/heart disease; typically 5 days/week with suggestion for 5-day shelf-stable supply; no cost-sharing in many counties (e.g., York)[1][2][5][7][9]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or email for assessment; examples: York County 717-771-9610 or aging@yorkcountypa.gov[1]; Blair County 814-946-1235[2]; statewide In-Home Meals via family interview[7]
- No statewide online form; county-specific intake
- Philadelphia via PCA (implied local contact)[9]

**Timeline:** Not specified; requires in-home assessment prior to service start[1][2][5]
**Waitlist:** Not mentioned in sources

**Watch out for:**
- Not automatic; requires local AAA in-home assessment—cannot self-qualify[1][2][5]
- Not free everywhere or for everyone; some counties note financial need, others do not; separate from Medicaid waivers (Aging/CHC) which have stricter financial/SNF-level care requirements[3][4][6]
- Excludes those with family/informal supports for meals/shopping[7][8]
- Often confused with congregate center meals, SNAP, or food boxes—home delivery targets homebound only[7]
- No statewide phone/website; must find local AAA, leading to confusion[1][2][7]

**Data shape:** Decentralized by 52 county Area Agencies on Aging with no uniform statewide eligibility/income table; assessment-based rather than application-driven; overlaps with waivers but core program is non-Medicaid OAA-funded for 60+ homebound

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/meals-and-food-assistance

---

### Caregiver Support Program


**Eligibility:**
- Income: No financial eligibility requirement to qualify. Reimbursement amount uses a sliding scale based on care receiver's total gross household income up to 380% of the Federal Poverty Level (FPL). Above 380% FPL, no financial reimbursement but other services available.
- Assets: No asset limits or tests apply.
- Both caregiver and care receiver must reside in Pennsylvania.
- Caregiver must be an adult primarily responsible for providing regular care.
- Must meet one of three categories: (1) Caregiver 18+ for care receiver 60+ with functional deficits or any age with Alzheimer's/related disorder (no relation or co-residence required); (2) Caregiver 55+ (not biological parent), related by blood/marriage/adoption, with legal guardianship or informally raising child(ren) under 18 (must co-reside); (3) Caregiver 55+, related by blood/marriage/adoption (can be biological parent), for care receiver 18-59 with disability (must co-reside).

**Benefits:** Reimbursement for respite care, supplemental services, consumable supplies, and other care-related expenses. Also includes non-financial services like care management, caregiver education, and training. Reimbursement percentage determined by sliding scale based on care receiver's household income and size relative to FPL (up to 380%). Caregiver pays upfront and submits for reimbursement.
- Varies by: household_size

**How to apply:**
- Contact local Area Agency on Aging (AAA): Find via https://www.pa.gov/services/aging/apply-for-the-caregiver-support-program
- Phone: Local AAA (statewide directory at https://www.pa.gov/agencies/aging/aging-programs-and-services/caregiver-support-program)
- In-person or phone assessment required for authorization

**Timeline:** Requires in-home assessment; no statewide timeline specified.
**Waitlist:** May vary by region; not detailed statewide.

**Watch out for:**
- No direct payment to caregivers; must pay upfront and seek reimbursement with receipts.
- Family members cannot be hired/paid to provide care to relatives.
- Above 380% FPL: No financial reimbursement, only non-financial services.
- In-home assessment required for authorization.
- Not the same as Medicaid/OPTIONS programs (which have strict income/asset limits and pay caregivers directly).

**Data shape:** No income/asset test for eligibility; benefits scale by care receiver household income/size via FPL sliding scale up to 380%; administered county-by-county via 52 AAAs with local assessments.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/caregiver-support-program

---

### Older Pennsylvanians Legal Assistance Program (OPLAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No fixed statewide dollar amounts specified; eligibility based on governmental guidelines and local program priorities, generally pegged at 125% of the federal poverty level with focus on those with greatest economic and/or social needs. Varies by local legal aid program[1][2].
- Assets: Not specified in program details; may apply via local legal aid guidelines but no statewide asset test mentioned[2].
- Pennsylvania resident
- Specific focus on older adults with greatest economic and/or social needs
- Legal matter must relate to program areas like abuse, age discrimination, guardianship defense, healthcare, housing, long-term care, Medicaid, Medicare, nutrition, Social Security/SSI, or utilities[1]

**Benefits:** Free legal services including information, advice, representation, and referrals for matters relating to abuse, age discrimination, guardianship defense, healthcare, housing, long-term care, Medicaid, Medicare, nutrition, Social Security/SSI, and utilities. Clients pay actual costs like court filing fees[1].
- Varies by: priority_tier

**How to apply:**
- Phone: Pennsylvania SeniorLAW Helpline at 1-877-PA SR LAW (1-877-727-7529)
- Website: www.seniorlawcenter.org or PALawHelp.org for self-guided resources and local program locator
- Contact local Area Agency on Aging (AAA), PA Legal Aid Network (PLAN) programs, or county-specific providers like Northwest Legal Services
- In-person: Local senior centers or legal aid offices via AAA referral[1][4][6]

**Timeline:** Not specified
**Waitlist:** High demand may result in turnaways due to resource limits; at least 80% of legal needs of the poor go unmet nationally[2].

**Watch out for:**
- Not for divorce, property settlements, or family disputes[6]
- Free services but clients pay court costs/filing fees[1]
- High demand leads to frequent turnaways despite qualification[2]
- Priority on greatest economic/social needs; not all eligible get served[1]
- Local program variations in guidelines and capacity[2]

**Data shape:** Decentralized statewide network via local legal aid programs with varying guidelines pegged to 125% FPL; no fixed income/asset tables; priority-based with regional providers and high unmet need

**Source:** https://www.pa.gov/services/aging/apply-for-the-older-pennsylvanians-legal-assistance-program

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Resident (or potential resident) of a long-term care facility in Pennsylvania such as nursing homes, assisted living facilities, personal care homes, domiciliary care homes, adult day care centers, or receiving long-term care services in their home.
- Complaint or concern related to quality of care, quality of life, rights, discharge/transfer, service disruption, finances, medications, staffing, dietary issues, or facility policies.
- Services also extend to friends, families, facility staff, or community members advocating on behalf of residents.

**Benefits:** Investigation and resolution of complaints; education on resident rights, procedures, and community resources; empowerment through building advocacy, communication, and negotiation skills; development of resident/family councils and PEER groups; routine unannounced facility visits; mediation; referrals to long-term care programs; assistance with informed decisions on providers. Specific issues addressed: discharge/eviction, response to assistance requests, personal property loss/theft, dietary concerns, facility policies, medications, staffing, access to personal funds/Medicare/Medicaid, quality of life (food, environment, activities), professional care (nursing, rehab, restraints), and dignity policies.

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA) Ombudsman program or state office (specific numbers vary by county, e.g., Franklin County 717-299-7979[3], Montgomery County 610-278-1320[8], PCA Helpline for Philadelphia[4], Elder Abuse Hotline 1-800-734-2020[8])
- Email: Varies by county (e.g., Ombudsman@montgomerycountypa.gov[8])
- Mail: Pennsylvania State Long-term Care Ombudsman, 555 Walnut Street, 5th Floor, Harrisburg, PA 17101[9]
- In-person: Local AAA offices or facility visits by Ombudsmen
- State contact: Via pa.gov services page for statewide referral[7]

**Timeline:** Not specified; Ombudsmen respond to complaints promptly through investigation and mediation, but no fixed timeline provided.

**Watch out for:**
- Not a direct service provider or financial aid program—focuses solely on advocacy and complaint resolution, not delivering care or benefits.
- Requires resident permission to intervene with facility staff; otherwise, provides education only[3].
- Contact local AAA for your county, not just state office, as services are regionally delivered.
- Open to families/friends but prioritizes resident's voice and consent.
- Free and confidential, but not for general elder abuse (use hotline 1-800-734-2020 for that)[8].

**Data shape:** no income test; advocacy-only (not financial/service benefits); delivered via 52 local AAAs with county-specific contacts; available to residents, families, staff, and community members

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/advocacy-education-protection[6]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Community HealthChoices (CHC) | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | state | deep |
| Healthy Horizons (QMB, SLMB, QI) | benefit | state | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| SHIP (State Health Insurance Assistance  | resource | federal | simple |
| Home-Delivered Meals (Meals on Wheels) | benefit | federal | deep |
| Caregiver Support Program | benefit | state | deep |
| Older Pennsylvanians Legal Assistance Pr | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":6,"resource":3}
**Scopes:** {"state":5,"federal":4}
**Complexity:** {"deep":6,"simple":3}

## Content Drafts

Generated 8 page drafts. Review in admin dashboard or `data/pipeline/PA/drafts.json`.

- **PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 3 content sections, 6 FAQs
- **Healthy Horizons (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **SHIP (State Health Insurance Assistance Program)** (resource) — 1 content sections, 6 FAQs
- **Home-Delivered Meals (Meals on Wheels)** (benefit) — 3 content sections, 6 FAQs
- **Caregiver Support Program** (benefit) — 3 content sections, 6 FAQs
- **Older Pennsylvanians Legal Assistance Program (OPLAP)** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **fixed**: 1 programs
- **household_size**: 2 programs
- **not_applicable**: 2 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Community HealthChoices (CHC)**: Managed care via MCOs with tiered services based on NFLOC assessment; financial eligibility tied to Medicaid with annual FBR adjustments; regional MCO/AAA administration; excludes specific disability programs
- **PACE (Program of All-Inclusive Care for the Elderly)**: PA PACE is a statewide prescription-only program with fixed income thresholds by marital status (single/couple only, no larger households); no assets test; distinct from national PACE long-term care model which has no federal income test and requires nursing-home level certification.
- **Healthy Horizons (QMB, SLMB, QI)**: Tiered by income brackets (QMB 100%, SLMB 120%, QI-1 135%, QI-2 175% FPL) with dual resource limits (SSI vs. 2x SSI); spouse deeming required; scales precisely by household size per FPL tables updated annually
- **SNAP (Supplemental Nutrition Assistance Program)**: Expanded eligibility in PA (no asset limit under 200% FPL, special senior paths); benefits scale by household size, income deductions; ESAP tier for elderly/disabled; county-administered.
- **SHIP (State Health Insurance Assistance Program)**: no income/asset test; counseling-only service via statewide phone/website with local delivery network; priority tiers by need but universal access for Medicare beneficiaries
- **Home-Delivered Meals (Meals on Wheels)**: Decentralized by 52 county Area Agencies on Aging with no uniform statewide eligibility/income table; assessment-based rather than application-driven; overlaps with waivers but core program is non-Medicaid OAA-funded for 60+ homebound
- **Caregiver Support Program**: No income/asset test for eligibility; benefits scale by care receiver household income/size via FPL sliding scale up to 380%; administered county-by-county via 52 AAAs with local assessments.
- **Older Pennsylvanians Legal Assistance Program (OPLAP)**: Decentralized statewide network via local legal aid programs with varying guidelines pegged to 125% FPL; no fixed income/asset tables; priority-based with regional providers and high unmet need
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only (not financial/service benefits); delivered via 52 local AAAs with county-specific contacts; available to residents, families, staff, and community members

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Pennsylvania?
