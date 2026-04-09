# Arizona Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 1.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 15 |
| New (not in our data) | 7 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 5 programs
- **financial**: 7 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Arizona Long Term Care System (ALTCS)

- **min_age**: Ours says `65` → Source says `65 or older, OR blind, OR disabled (as defined by Social Security Administration)[1][2][3]` ([source](https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html[7]))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Long-term care services including home care, assisted living, memory care, and skilled nursing facility care[4]` ([source](https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html[7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html[7]`

### Arizona Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1600` → Source says `$20` ([source](https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premium (if applicable, e.g., $278/month in 2024), Part B premium (~$174.70/month in 2025), deductibles, coinsurance, copays (Medicare pays first, then MSP covers remainder). Automatic Extra Help for Part D (caps drug copays at $12.65/genus in 2026)[5][7]. **SLMB:** Pays Part B premium only; Extra Help for Part D[4]. **QI:** Pays Part B premium only; Extra Help for Part D. Providers cannot bill QMB enrollees for covered Medicare services[7].` ([source](https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/))
- **source_url**: Ours says `MISSING` → Source says `https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/`

### Nutrition Assistance (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://des.az.gov/services/basic-needs/food/nutrition-assistance (inferred from context; use Arizona Self-Help at www.arizonaselfhelp.org for screening)))
- **income_limit**: Ours says `$2070` → Source says `$2,412` ([source](https://des.az.gov/services/basic-needs/food/nutrition-assistance (inferred from context; use Arizona Self-Help at www.arizonaselfhelp.org for screening)))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for groceries (including online at Amazon, Walmart, Aldi/Instacart). Up to $234/month for one-person household (2022 data); calculated as max allotment minus 30% of net income (e.g., $546 max for 2-person elderly household minus 30% net = $415 example). Exact amount varies by net income, deductions (medical, shelter)[1][4][5].` ([source](https://des.az.gov/services/basic-needs/food/nutrition-assistance (inferred from context; use Arizona Self-Help at www.arizonaselfhelp.org for screening)))
- **source_url**: Ours says `MISSING` → Source says `https://des.az.gov/services/basic-needs/food/nutrition-assistance (inferred from context; use Arizona Self-Help at www.arizonaselfhelp.org for screening)`

### Low Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2950` → Source says `$2,807` ([source](https://des.az.gov/liheap))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Standard benefit up to $640/year for heating or cooling; crisis benefit up to $500 for energy emergencies. Minimum $160 for heating/cooling.[1][2]` ([source](https://des.az.gov/liheap))
- **source_url**: Ours says `MISSING` → Source says `https://des.az.gov/liheap`

### Arizona State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one personalized health insurance counseling and assistance on Medicare benefits, coverage decisions, Medicare Advantage, Medigap, Part D, appeals, long-term care insurance, Medicaid eligibility, Medicare Savings Programs (MSP), Extra Help/Low Income Subsidy, fraud prevention via Senior Medicare Patrol (SMP), outreach presentations, and enrollment events; no fixed dollar amounts or hours, services provided via phone, in-person, or virtually as needed[1][2][3][4][5][6][7][8]` ([source](https://azship.org))
- **source_url**: Ours says `MISSING` → Source says `https://azship.org`

### Arizona Senior Legal Helpline

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free legal services for civil issues including wills/estate planning, powers of attorney/living wills, probate, bankruptcy, collection/consumer finances, Social Security/SSI benefits, veteran benefits. Referrals for cases outside expertise or not meeting low-income criteria[2][4].` ([source](https://asclp.org))
- **source_url**: Ours says `MISSING` → Source says `https://asclp.org`

### Arizona Long Term Care Ombudsman Program

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Free and confidential advocacy services including: investigation of complaints (abuse, neglect, exploitation, inappropriate eviction, food quality, medication issues); provision of information on resident rights, provider options, public resources, and regulations; mediation between residents/families and facility staff; regular visits by trained volunteers; education on residents' rights; information and referral services; attendance at resident council meetings[3][4][5]` ([source](https://des.az.gov/LTCOP))
- **source_url**: Ours says `MISSING` → Source says `https://des.az.gov/LTCOP`

### Senior Property Valuation Protection Program (Senior Freeze)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Freezes the Limited Property Value (LPV) — the taxable portion of your home's value used to calculate property taxes — for 3 years. Does NOT freeze the actual property tax bill, but protects against increases in property valuation that would increase tax liability. Applies to home, mobile home, and up to 10 acres of land.` ([source](https://azdor.gov/forms/property-tax-forms/senior-property-valuation-protection-option))
- **source_url**: Ours says `MISSING` → Source says `https://azdor.gov/forms/property-tax-forms/senior-property-valuation-protection-option`

## New Programs (Not in Our Data)

- **AHCCCS for Elders** — service ([source](https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html))
  - Shape notes: Requires nursing home level of care assessment beyond income/assets; benefits via regional contractors with waitlists for HCBS; estate recovery and share of cost create unique financial cliffs; dual-eligible with Medicare for many elders.
- **Arizona PACE Programs** — service ([source](azahcccs.gov/Members/GetCovered/ and National PACE Association npaonline.org))
  - Shape notes: Arizona PACE is a state-option program under Medicaid (not universally available). Eligibility has two layers: (1) PACE-specific requirements (age 55+, nursing home level of care certification, service area residency, community safety); (2) Medicaid requirements if seeking Medicaid funding (income/asset limits). The program is fully covered for Medicaid beneficiaries but requires private monthly premiums for non-Medicaid participants. Availability is geographically restricted to PACE organization service areas. No income or asset limits exist for PACE itself, but Medicaid-funded enrollment has strict financial thresholds. Processing timelines and specific PACE provider locations are not documented in available sources.
- **Home Delivered Meals (Meals on Wheels)** — in_kind ([source](Area Agency on Aging (602-264-4357); AHCCCS Medical Policy Manual Chapter 1200, Policy 1240-F for Medicaid-funded programs[4]))
  - Shape notes: Arizona's home-delivered meals system is fragmented across multiple providers (St. Mary's Food Bank, YWCA, Mom's Meals) and funding sources (Medicaid, Medicare Advantage, Area Agency on Aging). Eligibility and benefits vary significantly by provider and referral source. The Area Agency on Aging (602-264-4357) serves as the primary intake point for most programs. Income limits are the primary eligibility gate (185% FPL for food bank program), but disability/confinement status is also required. No asset limits specified in available documentation.
- **Arizona Caregiver Respite Program** — financial ([source](https://azcaregiver.org/services/respite))
  - Shape notes: Voucher-based financial aid for kinship caregivers 55+; priority by assessment tool; excludes public program recipients; quarterly reapplication required.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); https://www.pinal.gov/DocumentCenter/View/13857 (Arizona Department of Economic Security SCSEP Policy Manual)))
  - Shape notes: SCSEP in Arizona is administered by multiple providers (AARP Foundation and NICOA), each serving different geographic areas and populations. Income eligibility is pegged to federal poverty guidelines updated annually, requiring verification at time of application. The program has a fixed 48-month lifetime limit and provides fixed part-time hours (average 20/week) at minimum wage. Benefits do not vary by household size or priority tier — all participants receive the same training structure, though enrollment priority differs. Geographic service areas are restricted by county and provider.
- **Senior Citizen Property Tax Refund Credit** — financial ([source](https://azdor.gov (Arizona Department of Revenue)))
  - Shape notes: This program is income-based with strict thresholds and is claimed through the standard state income tax filing process. It is NOT a separate application process — it is integrated into Form 140/140A filing. The credit amount varies based on both income level and actual rent/property taxes paid, making it a sliding-scale benefit. Unlike the Senior Property Valuation Protection (Senior Freeze), this is a tax credit, not a property valuation freeze. Eligibility is statewide with no county variations.
- **Arizona Pension Income Deduction** — financial ([source](https://azdor.gov/forms/individual-income-tax-forms (Form 140 instructions); https://www.azleg.gov/ars/43/01022.htm))
  - Shape notes: Tax subtraction claimed annually on state income tax return; no separate program application, no age/income/asset tests, caps per person with post-2025 increases; distinguishes government pensions from private retirement income.

## Program Details

### AHCCCS for Elders

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For ALTCS (Arizona Long Term Care System, the AHCCCS program for elders), income limits are $2,982/month for a single applicant and approximately $5,964/month for a couple (2026 figures). Regular AHCCCS Medical for seniors 65+ or disabled: income under $1,255/month for an individual with no asset limit in some cases, but long-term care requires nursing home level. Limits based on Federal Poverty Level and vary by program type (e.g., $1,596-$1,796 individual for certain tiers). Confirm current FPL charts as they update annually.[4][5][6]
- Assets: Countable assets under $2,000 for an individual (e.g., nursing home or assisted living Medicaid). What counts: bank accounts, investments, second vehicles (non-primary). Exempt: primary home (if intent to return and equity under ~$713,000), one vehicle, personal belongings, burial plots, life insurance up to $1,500 face value, retirement accounts in payout. Spousal protections apply for married couples. Estate recovery after age 55 for services received.[2][4][5]
- Arizona resident
- U.S. citizen or qualified immigrant
- Social Security Number or application for one
- Nursing home level of care (NHLOC) or at risk of institutionalization, determined by AHCCCS
- Live in approved setting: own home, AHCCCS-certified nursing facility, or assisted living
- Not eligible for Medicare in some basic AHCCCS paths, but dual-eligible options exist for 65+

**Benefits:** Long-term care services including nursing facility care, home and community-based services (HCBS) such as personal care, adult day health, respite care, home-delivered meals, hospice, and assisted living. Covers medical services via AHCCCS Medical. May require share of cost (patient liability) based on income. No fixed dollar amounts or hours; services tailored to assessed needs.[2][5][9]
- Varies by: priority_tier

**How to apply:**
- Online: Health-e-Arizona Plus portal at www.healthearizonaplus.gov
- Phone: ALTCS toll-free at (888) 621-6880
- Mail: AHCCCS P.O. Box 25520, SSI MAO, MD 15022
- In-person: Local DES/Family Assistance Administration office

**Timeline:** Determined month-by-month; eligibility cannot start before AZ residency or release from incarceration. Full process includes financial review and NHLOC assessment; typically weeks to months.[7]
**Waitlist:** Possible for HCBS due to limited slots; nursing facility may have shorter waits. Varies by region and demand.[2]

**Watch out for:**
- Must prove nursing home level of care (NHLOC), not just age or low income—requires assessment.
- Share of cost (like a deductible) may apply based on excess income.
- Estate recovery for costs after age 55.
- Difficulty of Care income exclusion only if providing care to ALTCS member in your home.
- Assets must be countable under $2,000; spousal impoverishment rules complex for couples.
- Not automatic for 65+; Medicare dual-eligibility separate.
- Income limits change yearly with FPL; confirm current figures.

**Data shape:** Requires nursing home level of care assessment beyond income/assets; benefits via regional contractors with waitlists for HCBS; estate recovery and share of cost create unique financial cliffs; dual-eligible with Medicare for many elders.

**Source:** https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html

---

### Arizona Long Term Care System (ALTCS)


**Eligibility:**
- Age: 65 or older, OR blind, OR disabled (as defined by Social Security Administration)[1][2][3]+
- Income: {"description":"Monthly gross income cannot exceed three times the Supplemental Security Income (SSI) Federal Benefit Rate[5]","single_individual":"$2,901/month (2025)[3]","married_couple":"$5,802/month (2025)[3]","note":"Income limits are updated annually in January[4]"}
- Assets: {"countable_resources_single":"$2,000[2][3]","countable_resources_married":"$4,000[3]","maximum_resource_standard_2026":"$162,660.00[4]","countable_assets":"Cash in bank accounts, retirement funds, multiple properties, stocks/bonds/money markets, some life insurance policies[2]","exempt_assets":["Primary residence in Arizona (home equity limit: $752,000 in 2026)[1][4]","One vehicle[2][3]","Household furnishings, appliances, and personal effects[1]","Up to $2,000 in cash[2]","$1,500 designated for burial expenses[2]","Medicaid compliant annuity[4]","Special Needs Trusts for disabled persons under age 65[4]"],"look_back_rule":"Assets cannot be given away or sold for under fair market value within 60 months of application; violation results in penalty period of Medicaid ineligibility[1]"}
- Must be an Arizona resident[3][5]
- Must be a U.S. citizen or have proper immigration status[5]
- Must meet functional eligibility: need assistance with at least two activities of daily living (ADLs) such as bathing, dressing, eating, toileting, transferring, or continence[3]
- OR must have a medical condition requiring nursing facility level of care[3]
- Pre-Admission Screening (PAS) tool used to determine Nursing Facility Level of Care (NFLOC)[1]
- Cognitive deficits (including Alzheimer's disease or related dementia) are considered, but dementia diagnosis alone does not guarantee eligibility[1]

**Benefits:** Long-term care services including home care, assisted living, memory care, and skilled nursing facility care[4]
- Varies by: Individual medical need and care plan; not a fixed dollar amount but rather coverage of necessary services

**How to apply:**
- Phone: (888) 621-6880 to request forms and instructions[6]
- Direct application through ALTCS[2]
- Through a lawyer or Medicaid planning service[2]
- Authorized individuals (family member, caregiver, or estate planning lawyer) can assist on behalf of applicant[6]

**Timeline:** 60 to 90 days[2]
**Waitlist:** Not specified in search results

**Watch out for:**
- Application must be completed with no mistakes or applicant will be denied[2]
- 60-month look-back rule: assets given away or sold below fair market value within 60 months trigger penalty period of ineligibility[1]
- Dementia or Alzheimer's diagnosis alone does NOT guarantee eligibility; functional need must be demonstrated[1]
- Home equity limit is $752,000 (2026); homes exceeding this value may disqualify applicant[1][4]
- Income limits are strict and updated annually in January[4]
- Processing takes 60-90 days and must be completed accurately[2]
- ALTCS is state and federally funded and prioritizes those with greatest financial need[2]
- Applicant does not need to already reside in nursing facility to qualify[6]
- For married couples, community spouse resource limits are determined case-by-case[4]

**Data shape:** ALTCS is a Medicaid program with strict dual eligibility requirements (medical AND financial). Benefits are service-based rather than cash-based, with coverage determined by individual medical need. Income and asset limits are updated annually. The program includes a 60-month look-back period for asset transfers. Home equity is treated specially with a specific dollar limit rather than being fully exempt. Married couples have different asset limits ($4,000 vs. $2,000 for singles) and community spouse protections.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html[7]

---

### Arizona PACE Programs

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for PACE eligibility itself[1][3]. However, if enrolling through Medicaid (which covers ~90% of participants[1]), Arizona Medicaid nursing home applicants must have income under $2,982/month for single applicants in 2026[5]. Non-Medicaid participants can pay private monthly premiums[3].
- Assets: No asset limits for PACE eligibility itself[1][3]. However, Arizona Medicaid nursing home applicants must have assets under $2,000 for single applicants in 2026[5]. Note: Arizona's Regular Medicaid/Aged, Blind, and Disabled pathway has no asset limit[5].
- Must be certified by the state (AHCCCS) as meeting the need for nursing home level of care[1][2]
- Must be able to live safely in the community with PACE services at time of enrollment[1][2]
- Must live in the service area of a PACE organization[1][2]
- Cannot be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan[1]
- Cannot be enrolled in hospice services or certain other programs[1]

**Benefits:** Comprehensive medical and social services including managed care benefits through an interdisciplinary team (IDT) approach in an adult day health center[2][8]. Participants never pay deductibles or co-pays for any care, medication, or service provided by the PACE team[3]. For Medicaid beneficiaries, program is fully covered; non-Medicaid participants pay a monthly premium[3].
- Varies by: funding_source (Medicaid vs. private pay)

**How to apply:**
- Contact AHCCCS (Arizona Health Care Cost Containment System) at the Regional Behavioral Health Authority numbers: Central Arizona 800-564-5465; Northern Arizona 888-788-4408; Southern Arizona 866-495-6738[6]
- Visit AHCCCS website: azahcccs.gov/Members/GetCovered/[6]
- Contact local PACE organization directly (specific organizations not listed in search results)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE is NOT available statewide — you must verify a PACE organization operates in your service area before applying[1][4]
- Despite being designed to prevent nursing home placement, PACE requires applicants to be certified as needing nursing home level of care — this is a paradox families should understand[3]
- No financial criteria are considered for PACE eligibility itself, but if funding through Medicaid, strict income ($2,982/month) and asset ($2,000) limits apply[1][5]
- Participants cannot be in Medicare Advantage plans — this is a common enrollment conflict[1]
- Average PACE participant is 76 years old with multiple complex medical conditions; the program is designed for frail elderly with significant health and long-term care needs[1]
- PACE is voluntary enrollment, but once enrolled, participants must receive covered services through the PACE organization[2]
- The program cannot discriminate based on health status during enrollment, but staff must assess appropriateness for community-based care[2]

**Data shape:** Arizona PACE is a state-option program under Medicaid (not universally available). Eligibility has two layers: (1) PACE-specific requirements (age 55+, nursing home level of care certification, service area residency, community safety); (2) Medicaid requirements if seeking Medicaid funding (income/asset limits). The program is fully covered for Medicaid beneficiaries but requires private monthly premiums for non-Medicaid participants. Availability is geographically restricted to PACE organization service areas. No income or asset limits exist for PACE itself, but Medicaid-funded enrollment has strict financial thresholds. Processing timelines and specific PACE provider locations are not documented in available sources.

**Source:** azahcccs.gov/Members/GetCovered/ and National PACE Association npaonline.org

---

### Arizona Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits are based on Federal Poverty Guidelines (FPG) plus a $20 disregard, varying by program and household size. For 2026 (approximate based on recent data; confirm current FPG):
- **QMB** (≤100% FPG): Single: ~$1,330/month; Couple: ~$1,790/month[4][5].
- **SLMB** (>100%-≤120% FPG): Single: ~$1,596/month; Couple: ~$2,148/month[4].
- **QI** (>120%-≤135% FPG): Single: ~$1,796/month; Couple: ~$2,416/month[4]. Earlier sources show lower figures (e.g., QMB single $1,235[2]), but use most recent FPG-aligned limits. Full table by household size follows federal standards; contact AHCCCS for exact 2026 table.
- Assets: Arizona has **no asset limits** for QMB, SLMB, or QI (confirmed for QMB; applies statewide)[1]. Some general sources mention federal limits like $9,430 single/$14,130 couple, but not enforced in AZ[3]. Exempt: primary home, one car, personal belongings, burial plots. Countable: bank accounts, stocks (if limits applied).
- Must be enrolled in or eligible for Medicare Part A (all programs)
- Arizona resident
- U.S. citizen or qualified non-citizen
- Apply for other available pensions/disability/retirement benefits
- For QI: Must have both Part A and Part B; annual reapplication required; first-come, first-served with priority to prior recipients[7]

**Benefits:** **QMB:** Pays Medicare Part A premium (if applicable, e.g., $278/month in 2024), Part B premium (~$174.70/month in 2025), deductibles, coinsurance, copays (Medicare pays first, then MSP covers remainder). Automatic Extra Help for Part D (caps drug copays at $12.65/genus in 2026)[5][7]. **SLMB:** Pays Part B premium only; Extra Help for Part D[4]. **QI:** Pays Part B premium only; Extra Help for Part D. Providers cannot bill QMB enrollees for covered Medicare services[7].
- Varies by: priority_tier

**How to apply:**
- Online: Health-e-Arizona (https://www.healthearizonaplus.gov/)[4]
- Paper form: MSP application, mail/submit to local DES/Family Assistance Administration office[4]
- Phone: AHCCCS at 1-855-432-7587 or 1-800-MEDICARE (1-800-633-4227) for questions[5]
- In-person: Local DES/Family Assistance Administration offices (find via https://des.az.gov/services/basic-needs)

**Timeline:** Typically 45 days; no specific AZ timeline in sources, but federal Medicaid standard applies. QI may have delays due to first-come basis[7].
**Waitlist:** QI has first-come, first-served with annual funding limits and priority for prior recipients; possible waitlist if funds exhausted[7]. QMB/SLMB entitlement (no waitlist).

**Watch out for:**
- Arizona has **no asset test** unlike many states—big differentiator people miss[1].
- Must have Part A to qualify; QI requires annual reapplication and may run out of funds[7].
- QMB protects from provider billing for Medicare-covered services, but small Medicaid copays may apply[7].
- Income calculated with $20 disregard; 'countable income' excludes certain deductions.
- Automatic Extra Help for Part D, but must coordinate with Medicare Advantage if enrolled[4].
- Outdated income figures in sources; always verify current FPG-based limits with AHCCCS.
- Not full Medicaid—only Medicare cost-sharing help.

**Data shape:** Tiered by income brackets (QMB/SLMB/QI) tied to FPG percentages; no asset test in Arizona; QI is capped/entitlement-priority; benefits focus on premiums/cost-sharing with auto Extra Help; statewide via AHCCCS/DES.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/

---

### Nutrition Assistance (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (Oct 1, 2025 - Sept 30, 2026): Gross income limit at 185% FPL - 1 person: $2,412/month; 2: $3,261; 3: $4,108; 4: $4,956; 5: $5,805; 6: $6,652; 7: $7,499; +$847 each additional. If over gross limit, qualify via Net Income test (must be below 100% FPL after deductions, e.g., ~$1,305/month individual, $1,763 couple per older data) and Asset test. Annual equivalents like $19,584 for one-person noted in legislative context[1][3][6].
- Assets: No asset limit for most Arizona households. For elderly/disabled households failing Gross Income test, federal rules apply: $4,500 limit on countable resources (e.g., bank accounts). Exempt: home, vehicles, retirement savings, household goods, life insurance cash value (varies)[1][2][3][6].
- Household must live in Arizona
- U.S. citizen or qualified non-citizen
- No work requirements for households entirely elderly (60+) or disabled
- Net income test always applies for elderly/disabled
- Social Security, pensions, VA/disability count as income

**Benefits:** Monthly EBT card for groceries (including online at Amazon, Walmart, Aldi/Instacart). Up to $234/month for one-person household (2022 data); calculated as max allotment minus 30% of net income (e.g., $546 max for 2-person elderly household minus 30% net = $415 example). Exact amount varies by net income, deductions (medical, shelter)[1][4][5].
- Varies by: household_size

**How to apply:**
- Online: www.arizonaselfhelp.org or DES portal
- Phone: 1-855-777-8590 (Family Assistance Administration)
- Mail/paper: Submit to Arizona Department of Economic Security
- In-person: Local DES/FAA offices

**Timeline:** Not specified in sources; typically 30 days standard, expedited for urgent cases

**Watch out for:**
- Elderly/disabled over gross income (185% FPL) must pass stricter Net + Asset tests ($4,500 limit)
- Medical expenses >$35/month and shelter costs deductible to lower net income
- Entire household (food buyers/preparers) included even if not all elderly
- No impact on other benefits except FDPIR
- Vehicles/home exempt from assets
- Broadened AZ rules looser than federal—check current via screener
- 2025 federal changes (e.g., work rules) may apply per One Big Beautiful Bill Act[1][2][3][4][5]

**Data shape:** Elderly/disabled have special path: gross income optional (185% FPL table by household size), fallback to net income + $4,500 assets; benefits scale by household size and net income deductions; statewide with DES central admin

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://des.az.gov/services/basic-needs/food/nutrition-assistance (inferred from context; use Arizona Self-Help at www.arizonaselfhelp.org for screening)

---

### Low Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly income must be at or below: 1 person $2,807; 2 people $3,671; 3 people $4,535; 4 people $5,399; 5 people $6,262; 6 people $7,126. Priority given to households with elderly (60+), disabled, veterans, or children under 6.[2][3]
- Assets: No asset limit.[2]
- Proof of U.S. citizenship, permanent legal residence, or qualifying immigration status.
- Proof of permanent residence (lease, deed, property tax bill).
- No utility bill credit of $500 or more.
- Income verification for all household members 18+ for last 30 days.

**Benefits:** Standard benefit up to $640/year for heating or cooling; crisis benefit up to $500 for energy emergencies. Minimum $160 for heating/cooling.[1][2]
- Varies by: priority_tier

**How to apply:**
- Online: Apply via des.az.gov/liheap or local Community Action Program.
- Phone: (866) 494-1981 or (833) 453-2142.
- In-person: Schedule appointment with local Community Action Program.
- Mail/Fax: EAP-1002A form to PO Box 19130, Phoenix, AZ 85009-9998 or fax (602) 612-8282.

**Timeline:** Not specified; funding limited, apply early.
**Waitlist:** Funding may run out, some agencies stop accepting applications early.[2]

**Watch out for:**
- Priority for vulnerable members (elderly 60+, disabled, young children, veterans); not first-come.
- No benefit if utility credit >=$500.
- Funding limited; apply early as agencies may close applications.
- Household includes all at address sharing utility bill.
- Must verify income for last 30 days only.

**Data shape:** Priority tiers for vulnerable households; no asset test; benefits fixed max/min with crisis add-on; county-specific seasonal dates; local providers handle intake.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://des.az.gov/liheap

---

### Arizona State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, their families, and caregivers, with support prioritized for those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[2][3][6]
- Assets: No asset limits or tests apply[6]
- Must be a Medicare beneficiary, family member, or caregiver in Arizona[1][2][3][5][6]

**Benefits:** Free one-on-one personalized health insurance counseling and assistance on Medicare benefits, coverage decisions, Medicare Advantage, Medigap, Part D, appeals, long-term care insurance, Medicaid eligibility, Medicare Savings Programs (MSP), Extra Help/Low Income Subsidy, fraud prevention via Senior Medicare Patrol (SMP), outreach presentations, and enrollment events; no fixed dollar amounts or hours, services provided via phone, in-person, or virtually as needed[1][2][3][4][5][6][7][8]

**How to apply:**
- Phone: 1-800-432-4040[5][6]
- Website intake form: https://azship.org[6]
- Local in-person or phone appointments via regional providers (e.g., SEAGO in Bisbee for 4-county region[7], PCOA at 8467 E Broadway Blvd, Tucson, AZ 85710, (520) 790-7262[8])
- Mail or additional contacts via Arizona Department of Economic Security, Division of Aging and Adult Services, 1789 West Jefferson, Site Code MD6288, Phoenix, AZ 85007[1]

**Timeline:** Not specified; counselors return calls or schedule appointments promptly after contact[5][6][7]

**Watch out for:**
- Not a direct financial aid or healthcare provider program—offers counseling only, not payment for services; people may miss that it helps apply for other programs like MSP (up to $8,400/year savings for individuals) or Extra Help; services rely on local availability of counselors/volunteers, so response times may vary; assumes Medicare enrollment[2][3][4][6]
- Even if income is near limits for related programs, SHIP assists with applications worth pursuing[6]

**Data shape:** no income/asset test; counseling-only service via statewide local network; prioritizes low-income/disabled/dual-eligible but open to all Medicare beneficiaries; integrates SMP for fraud prevention[2][3][6]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://azship.org

---

### Home Delivered Meals (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+ for seniors; 18-59 for adults living with disabilities[6]+
- Income: 185% of Federal Poverty Level for St. Mary's Food Bank Home Delivery Program[2]. For Medicaid/Medicare Advantage programs, income limits vary by specific health plan[3][5]
- Assets: Not specified in available sources
- Confined to home due to physical/mental disability or prolonged illness, OR at increased risk due to COVID-19 or similar illness, OR lack reliable transportation (excluding public transit)[2]
- Must be 18 years or older to register[2]
- Must certify household income eligibility[2]
- Must be present to receive delivery[2]
- Valid photo ID required at time of delivery[2]

**Benefits:** One meal delivery per week (subject to change); delivery window 6:00 AM to 6:00 PM[2]. SNAP recipients automatically eligible for TEFAP food packages[2]. YWCA program in Glendale provides up to seven meals delivered weekly plus wellness check[6]
- Varies by: provider and program type

**How to apply:**
- Phone: Area Agency on Aging at 602-264-HELP (602-264-4357)[6]
- In-person or phone referral through: Maricopa County S.A.I.L. (Senior Adult Independent Living), ALTCCS (Arizona Long Term Care Health Systems), or Area Agency on Aging[6]
- Contact your Medicaid or Medicare Advantage health plan to inquire about meal benefits[3][5]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Eligibility is determined by Area Agency on Aging, not directly by the meal provider — families must contact AAA first[6]
- Income limits vary significantly: St. Mary's Food Bank uses 185% FPL[2], while Medicaid programs may have different thresholds[3]
- Must be physically present to receive delivery; meals cannot be left on doorsteps or porches[2][4]
- One meal per week is standard for St. Mary's Food Bank[2], but YWCA provides up to seven meals weekly[6] — availability depends on provider and referral source
- Medicaid/Medicare Advantage recipients should contact their health plan first, as benefits may be covered at no cost through their plan[3][5]
- SNAP recipients get automatic TEFAP eligibility with St. Mary's, but this is a separate benefit from regular home delivery[2]
- Program guidelines subject to change; current delivery frequency may differ from stated one-per-week standard[2]

**Data shape:** Arizona's home-delivered meals system is fragmented across multiple providers (St. Mary's Food Bank, YWCA, Mom's Meals) and funding sources (Medicaid, Medicare Advantage, Area Agency on Aging). Eligibility and benefits vary significantly by provider and referral source. The Area Agency on Aging (602-264-4357) serves as the primary intake point for most programs. Income limits are the primary eligibility gate (185% FPL for food bank program), but disability/confinement status is also required. No asset limits specified in available documentation.

**Source:** Area Agency on Aging (602-264-4357); AHCCCS Medical Policy Manual Chapter 1200, Policy 1240-F for Medicaid-funded programs[4]

---

### Arizona Caregiver Respite Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits specified; program targets kinship/family caregivers not eligible for other publicly funded respite.
- Assets: No asset limits mentioned.
- Caregiver must be 18+ and primary caregiver living in the home.
- Caregiver 55 years or older.
- Cannot already receive respite from publicly funded programs.
- Hired respite worker must be 18+, not live in same household, not legal guardian/power of attorney/fiscal responsibility for caregiver or recipient.
- Care recipient may have requirements related to age, condition, or ability to perform activities of daily living.
- Priorities: Kinship caregivers assessed via Caregiver Assessment Tool (CAT).

**Benefits:** Respite vouchers up to $300 per quarter (up to $1200 per year); caregiver sets hourly rate when hiring (amounts over $12/hour not reimbursed); caregiver coordinates, hires, and pays own providers or agency; reapply each quarter.
- Varies by: priority_tier

**How to apply:**
- Phone interview required with CRL volunteer (contact via Arizona Caregiver Coalition at 888-737-7494 or azcaregiver.org/services/respite)
- Online application at azcaregiver.org/services/respite

**Timeline:** Not specified
**Waitlist:** Not mentioned

**Watch out for:**
- Not case-managed; streamlined for short breaks only.
- Must reapply each quarter.
- Reimbursement capped; over $12/hour not covered.
- Excludes those already in publicly funded respite programs.
- Hired worker restrictions (no household members, no legal/fiscal roles).
- Primarily for kinship/grandparents raising grandchildren 55+.

**Data shape:** Voucher-based financial aid for kinship caregivers 55+; priority by assessment tool; excludes public program recipients; quarterly reapplication required.

**Source:** https://azcaregiver.org/services/respite

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family household income must not exceed 125% of the current U.S. Department of Health and Human Services federal poverty level[1]. The exact dollar amounts vary by household size and are updated annually (as of January 15, 2025)[2]. Specific 2026 amounts are not provided in available sources; applicants must contact the program to verify current thresholds for their household size.
- Assets: Not specified in available sources. Contact the program directly for asset limit information.
- Must be unemployed[2]
- Must be a resident of Arizona[1]
- Must have poor employment prospects[1]

**Benefits:** Paid part-time work-based training at an average of 20 hours per week[2]. Participants are paid the highest of federal, state, or local minimum wage[2]. Work experience, on-the-job training in computer or vocational skills, and professional job placement assistance to transition to unsubsidized employment[3]. Maximum lifetime participation: 48 months[1].
- Varies by: fixed

**How to apply:**
- Phone: 1-855-850-2525 (AARP Foundation SCSEP Work Resources Helpline, Monday–Friday, 9 a.m.–6 p.m. Eastern Time; Spanish-language support available)[5]
- Phone: 1-877-US2-JOBS (1-877-872-5627) — toll-free Department of Labor help line[2]
- In-person: AARP Foundation office at 4520 North Central Ave., Suite 575, Phoenix, AZ 85012[5]
- Online: CareerOneStop's Older Worker Program Finder (https://www.careeronestop.org)[2]

**Timeline:** Not specified in available sources. Contact the program for current processing timelines.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- Income limits are tied to federal poverty guidelines, which are updated annually (most recently January 15, 2025)[2]. Families must verify current thresholds with the program, as dollar amounts are not fixed.
- Maximum lifetime participation is 48 months total[1] — this is a hard cap, not renewable.
- Enrollment priority is given to veterans and qualified spouses first, then to individuals over 65, with disabilities, with low literacy or limited English proficiency, in rural areas, homeless or at risk of homelessness, with low employment prospects, or who have failed to find employment through American Job Centers[2]. Eligibility does not guarantee immediate placement.
- The program is designed as a bridge to unsubsidized employment[2], not permanent subsidized work. The goal is transition to regular employment.
- Participants work an average of 20 hours per week[2] — this is part-time, not full-time employment.
- Service areas vary by provider. Not all Arizona counties may be served by all providers; families should verify their county is covered before applying.
- Job-ready applicants may be referred to ARIZONA@WORK for additional employment services rather than SCSEP[1].

**Data shape:** SCSEP in Arizona is administered by multiple providers (AARP Foundation and NICOA), each serving different geographic areas and populations. Income eligibility is pegged to federal poverty guidelines updated annually, requiring verification at time of application. The program has a fixed 48-month lifetime limit and provides fixed part-time hours (average 20/week) at minimum wage. Benefits do not vary by household size or priority tier — all participants receive the same training structure, though enrollment priority differs. Geographic service areas are restricted by county and provider.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); https://www.pinal.gov/DocumentCenter/View/13857 (Arizona Department of Economic Security SCSEP Policy Manual)

---

### Arizona Senior Legal Helpline


**Eligibility:**
- Age: 60+
- Income: No strict income limits; priority given to those with greatest economic and social need per federal regulations. Low-income individuals prioritized, but not explicitly defined by dollar amounts[2][4].
- Assets: No asset limits mentioned.
- Must live in Maricopa County[2][4]
- Civil legal issues (excludes housing matters)[4]

**Benefits:** Free legal services for civil issues including wills/estate planning, powers of attorney/living wills, probate, bankruptcy, collection/consumer finances, Social Security/SSI benefits, veteran benefits. Referrals for cases outside expertise or not meeting low-income criteria[2][4].
- Varies by: priority_tier

**How to apply:**
- Phone: 602-252-6710 (Thursdays 10:00 a.m. to 1:00 p.m.)[2]
- Online: New Request for Service form at asclp.org[2]
- In-person: 2720 East Thomas Road, Phoenix, AZ 85016[4]

**Timeline:** Not specified.

**Watch out for:**
- Restricted to Maricopa County residents only—families outside this area need alternative programs[2][4]
- No income guidelines but priority for greatest need; may not serve all applicants[2]
- Excludes housing matters; referrals for non-qualifying cases[4]
- Intake limited to specific phone hours[2]

**Data shape:** County-restricted to Maricopa; no income/asset test but priority-based; phone intake only Thursdays; separate from statewide legal aid networks.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://asclp.org

---

### Arizona Long Term Care Ombudsman Program


**Eligibility:**
- Income: No income or asset limits; program is free and available to any resident of a qualifying long-term care facility regardless of financial status[3][5]
- Assets: No asset limits or tests apply[3][5]
- Must be a resident of a qualifying long-term care facility such as nursing homes, assisted living facilities, adult foster care homes, hospice centers, or adult day care[3][5]
- Consent required from the resident (or their representative) for ombudsman to investigate complaints or act on their behalf[3][5]

**Benefits:** Free and confidential advocacy services including: investigation of complaints (abuse, neglect, exploitation, inappropriate eviction, food quality, medication issues); provision of information on resident rights, provider options, public resources, and regulations; mediation between residents/families and facility staff; regular visits by trained volunteers; education on residents' rights; information and referral services; attendance at resident council meetings[3][4][5]

**How to apply:**
- Phone: State office (602) 542-6454[3][5][6]
- Email: ltcop@azdes.gov[3]
- Mail: Office of Arizona State Long-Term Care Ombudsman Program, 1789 W. Jefferson Street, Mail Drop 6288, Phoenix, Arizona 85007[3][5]
- In-person or regional: Contact local Area Agency on Aging (varies by region, e.g., Area Agency on Aging Region One (520) 432-2528 ext. 206 for Santa Cruz, Cochise, Graham, Greenlee Counties; Inter Tribal Council of Arizona (602) 258-4822 for 21 Tribal Nations; Navajo Nation (602) 542-6454 or (602) 542-6432)[5][6]
- Website: https://des.az.gov/LTCOP[3]

**Timeline:** Not specified; services provided upon contact and consent, with prompt investigation of complaints[4][5]

**Watch out for:**
- Not a financial or direct care program like ALTCS (which has strict income/asset limits and provides long-term care services); this is purely advocacy for resolving facility issues[1][2][3]
- Requires resident consent before acting on complaints; ombudsman prioritizes resident's direction[3][5]
- For abuse/neglect/exploitation, may refer to Adult Protective Services (877-767-2385) in addition to or instead of handling directly[4][6]
- Contact local Area Agency on Aging first for fastest regional response, not just state office[6]
- Free and confidential, but does not provide medical care, housing, or financial aid[3][5]

**Data shape:** no income test; advocacy-only for long-term care facility residents; regionally administered via Area Agencies on Aging with volunteer advocates; consent-driven; often confused with ALTCS long-term care benefits program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://des.az.gov/LTCOP

---

### Senior Citizen Property Tax Refund Credit

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"description":"Total household income must be below threshold; Social Security benefits, railroad retirement benefits, and veteran's disability pensions are EXCLUDED from income calculation[1][7]","single_household":"$3,751[1]","multiple_occupants":"$5,501[1]","note":"Income limits apply to total household income of all residents"}
- Must have resided in Arizona for the entire taxable year[1]
- Must have paid property taxes or rent for the entire year[1]
- Must occupy the property as primary residence[1]
- If filing jointly, spouse's income counts toward household total[1]

**Benefits:** Refundable tax credit; maximum credit is $502[1]
- Varies by: income_and_rent_or_property_taxes_paid

**How to apply:**
- Mail with state income tax return (Form 140 or 140A)[1]
- In-person filing at county tax office[1]

**Timeline:** Not specified in available sources

**Watch out for:**
- You CANNOT use Form 140EZ — must file Form 140 or 140A to claim this credit[1]
- Social Security benefits are excluded from income calculation, but ALL other income (wages, disability, pensions, etc.) counts[1][7]
- Both property taxes AND rent can qualify, but you must have paid for the entire year[1]
- The property must be your primary residence — vacation homes or investment properties do not qualify[1]
- Maximum credit is only $502 — this is a modest benefit, not a major tax break[1]
- If you're under 65, you must be receiving SSI specifically (not regular Social Security or other disability)[1]
- Income limits are strict: $3,751 for single, $5,501 for households with others — exceeding by even $1 disqualifies you[1]
- This is a refundable credit, meaning you can receive it even if you owe no income tax[1]

**Data shape:** This program is income-based with strict thresholds and is claimed through the standard state income tax filing process. It is NOT a separate application process — it is integrated into Form 140/140A filing. The credit amount varies based on both income level and actual rent/property taxes paid, making it a sliding-scale benefit. Unlike the Senior Property Valuation Protection (Senior Freeze), this is a tax credit, not a property valuation freeze. Eligibility is statewide with no county variations.

**Source:** https://azdor.gov (Arizona Department of Revenue)

---

### Senior Property Valuation Protection Program (Senior Freeze)


**Eligibility:**
- Age: 65+
- Income: {"description":"Average total annual income from all sources (taxable and non-taxable) for the previous three years must not exceed:","single_owner":"$47,712","two_or_more_owners":"$59,640","note":"All income sources are counted — nothing is excluded. This includes wages, salaries, tips, disability compensation, railroad retirement, unemployment benefits, Social Security, and any other income."}
- Property must be primary residence (not rental or investment property)
- Owner(s) must have resided at the primary residence for at least 2 years prior to application
- At least one owner must be 65 years or older (if multiple owners)

**Benefits:** Freezes the Limited Property Value (LPV) — the taxable portion of your home's value used to calculate property taxes — for 3 years. Does NOT freeze the actual property tax bill, but protects against increases in property valuation that would increase tax liability. Applies to home, mobile home, and up to 10 acres of land.
- Varies by: fixed

**How to apply:**
- In-person submission to County Assessor's Office (required — mail applications are NOT accepted)
- Contact your county assessor's office for specific office locations and hours

**Timeline:** Applications submitted by September 1st will be processed with notification of qualification status by December 1st of the application year. Freeze takes effect for the year of application and the following two years.

**Watch out for:**
- The freeze is NOT automatic — you must apply every 3 years to renew. The assessor will send a renewal notice 6 months before expiration, but it is your responsibility to reapply.
- Mail applications are NOT accepted in any county — you must submit in person to the assessor's office.
- Income limits are strict and include ALL income sources (Social Security, pensions, disability, rental income, etc.). Nothing is excluded.
- The freeze applies to Limited Property Value (LPV), not the actual property tax bill. Tax rates and levies can still increase.
- Loss of eligibility triggers recalculation of LPV under Rule B (Arizona Revised Statutes § 42-13302), which may result in a significant increase in your taxable value. This occurs if: ownership changes, the home is no longer your primary residence, you request certain property changes, the property is split/merged, property value changes by more than 15% (construction/destruction), or you don't renew.
- As of September 26, 2025 (Senate Bill SB1224), if you lose eligibility, your LPV is recalculated to a level similar to comparable non-protected properties — potentially a substantial jump.
- The program freezes valuation 'regardless if future property values increase or decrease' — you cannot benefit if values drop.
- Applications must be submitted in person; no exceptions for mail or online submission.

**Data shape:** This is a county-administered statewide program with uniform eligibility criteria and benefits but decentralized application processing. Income limits are the primary gating factor and are fixed (not tiered). The 3-year freeze cycle with mandatory renewal is critical — this is not a one-time application. The distinction between 'property valuation' (frozen) and 'property tax bill' (not frozen) is the most commonly misunderstood aspect. Regional variation is minimal in program structure but significant in administrative details (office locations, contact info, specific submission procedures).

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://azdor.gov/forms/property-tax-forms/senior-property-valuation-protection-option

---

### Arizona Pension Income Deduction

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits apply. Available to Arizona taxpayers receiving qualifying pension income, regardless of total income level.
- Assets: No asset limits or tests apply.
- Must file an Arizona individual income tax return (e.g., Form 140).
- Pension must be from qualifying sources: U.S. government service retirement/disability fund, U.S. foreign service retirement/disability system, Arizona state/local government pensions, or other federal retirement systems (excluding uniformed services pay, which has separate 100% subtraction).
- Taxpayer (or spouse, if filing jointly) must have received the pension income during the tax year.

**Benefits:** Subtraction from Arizona gross income of up to $2,500 per qualifying individual (amount received or $2,500, whichever is less). If both spouses qualify, each may claim up to $2,500 (total up to $5,000). For uniformed services retired/retainer pay, 100% subtraction (unlimited amount) starting tax year 2021. Note: Increases to $5,000 single/head of household and $10,000 married filing jointly after December 31, 2025 per ARS 43-1022.
- Varies by: filing_status

**How to apply:**
- Included directly on Arizona individual income tax return (e.g., Form 140 or Form 140PY).
- File electronically or by mail with Arizona Department of Revenue.
- Phone assistance: Arizona Department of Revenue at (602) 255-3381.
- In-person: Arizona Department of Revenue offices (e.g., Phoenix headquarters).

**Timeline:** Processed as part of annual income tax return; standard tax refund timeline (typically 4-6 weeks for e-file, longer for paper).

**Watch out for:**
- Limited to $2,500 per person (lesser of amount received or cap); excess pension income remains taxable at Arizona's 2.5% flat rate.
- Only specific government pensions qualify—not private pensions, IRAs, or 401(k)s.
- Must itemize or claim correctly on AZ tax forms; no separate application.
- Uniformed services have unlimited subtraction, often missed.
- If filing separately, subtraction can be split but total capped.
- Non-residents may still owe on AZ-source pensions; consult AZ DOR.
- Changes post-2025: doubles to $5k/$10k.

**Data shape:** Tax subtraction claimed annually on state income tax return; no separate program application, no age/income/asset tests, caps per person with post-2025 increases; distinguishes government pensions from private retirement income.

**Source:** https://azdor.gov/forms/individual-income-tax-forms (Form 140 instructions); https://www.azleg.gov/ars/43/01022.htm

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| AHCCCS for Elders | benefit | state | deep |
| Arizona Long Term Care System (ALTCS) | benefit | state | deep |
| Arizona PACE Programs | benefit | local | deep |
| Arizona Medicare Savings Programs (QMB,  | benefit | federal | deep |
| Nutrition Assistance (SNAP) | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Arizona State Health Insurance Assistanc | resource | federal | simple |
| Home Delivered Meals (Meals on Wheels) | benefit | federal | deep |
| Arizona Caregiver Respite Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Arizona Senior Legal Helpline | resource | local | simple |
| Arizona Long Term Care Ombudsman Program | resource | federal | simple |
| Senior Citizen Property Tax Refund Credi | benefit | state | medium |
| Senior Property Valuation Protection Pro | resource | state | simple |
| Arizona Pension Income Deduction | benefit | state | medium |

**Types:** {"benefit":10,"resource":4,"employment":1}
**Scopes:** {"state":6,"local":2,"federal":7}
**Complexity:** {"deep":9,"simple":4,"medium":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/AZ/drafts.json`.

- **AHCCCS for Elders** (benefit) — 5 content sections, 6 FAQs
- **Arizona Long Term Care System (ALTCS)** (benefit) — 5 content sections, 6 FAQs
- **Arizona PACE Programs** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **Individual medical need and care plan; not a fixed dollar amount but rather coverage of necessary services**: 1 programs
- **funding_source (Medicaid vs. private pay)**: 1 programs
- **household_size**: 1 programs
- **not_applicable**: 2 programs
- **provider and program type**: 1 programs
- **fixed**: 2 programs
- **income_and_rent_or_property_taxes_paid**: 1 programs
- **filing_status**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **AHCCCS for Elders**: Requires nursing home level of care assessment beyond income/assets; benefits via regional contractors with waitlists for HCBS; estate recovery and share of cost create unique financial cliffs; dual-eligible with Medicare for many elders.
- **Arizona Long Term Care System (ALTCS)**: ALTCS is a Medicaid program with strict dual eligibility requirements (medical AND financial). Benefits are service-based rather than cash-based, with coverage determined by individual medical need. Income and asset limits are updated annually. The program includes a 60-month look-back period for asset transfers. Home equity is treated specially with a specific dollar limit rather than being fully exempt. Married couples have different asset limits ($4,000 vs. $2,000 for singles) and community spouse protections.
- **Arizona PACE Programs**: Arizona PACE is a state-option program under Medicaid (not universally available). Eligibility has two layers: (1) PACE-specific requirements (age 55+, nursing home level of care certification, service area residency, community safety); (2) Medicaid requirements if seeking Medicaid funding (income/asset limits). The program is fully covered for Medicaid beneficiaries but requires private monthly premiums for non-Medicaid participants. Availability is geographically restricted to PACE organization service areas. No income or asset limits exist for PACE itself, but Medicaid-funded enrollment has strict financial thresholds. Processing timelines and specific PACE provider locations are not documented in available sources.
- **Arizona Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI) tied to FPG percentages; no asset test in Arizona; QI is capped/entitlement-priority; benefits focus on premiums/cost-sharing with auto Extra Help; statewide via AHCCCS/DES.
- **Nutrition Assistance (SNAP)**: Elderly/disabled have special path: gross income optional (185% FPL table by household size), fallback to net income + $4,500 assets; benefits scale by household size and net income deductions; statewide with DES central admin
- **Low Income Home Energy Assistance Program (LIHEAP)**: Priority tiers for vulnerable households; no asset test; benefits fixed max/min with crisis add-on; county-specific seasonal dates; local providers handle intake.
- **Arizona State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling-only service via statewide local network; prioritizes low-income/disabled/dual-eligible but open to all Medicare beneficiaries; integrates SMP for fraud prevention[2][3][6]
- **Home Delivered Meals (Meals on Wheels)**: Arizona's home-delivered meals system is fragmented across multiple providers (St. Mary's Food Bank, YWCA, Mom's Meals) and funding sources (Medicaid, Medicare Advantage, Area Agency on Aging). Eligibility and benefits vary significantly by provider and referral source. The Area Agency on Aging (602-264-4357) serves as the primary intake point for most programs. Income limits are the primary eligibility gate (185% FPL for food bank program), but disability/confinement status is also required. No asset limits specified in available documentation.
- **Arizona Caregiver Respite Program**: Voucher-based financial aid for kinship caregivers 55+; priority by assessment tool; excludes public program recipients; quarterly reapplication required.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP in Arizona is administered by multiple providers (AARP Foundation and NICOA), each serving different geographic areas and populations. Income eligibility is pegged to federal poverty guidelines updated annually, requiring verification at time of application. The program has a fixed 48-month lifetime limit and provides fixed part-time hours (average 20/week) at minimum wage. Benefits do not vary by household size or priority tier — all participants receive the same training structure, though enrollment priority differs. Geographic service areas are restricted by county and provider.
- **Arizona Senior Legal Helpline**: County-restricted to Maricopa; no income/asset test but priority-based; phone intake only Thursdays; separate from statewide legal aid networks.
- **Arizona Long Term Care Ombudsman Program**: no income test; advocacy-only for long-term care facility residents; regionally administered via Area Agencies on Aging with volunteer advocates; consent-driven; often confused with ALTCS long-term care benefits program
- **Senior Citizen Property Tax Refund Credit**: This program is income-based with strict thresholds and is claimed through the standard state income tax filing process. It is NOT a separate application process — it is integrated into Form 140/140A filing. The credit amount varies based on both income level and actual rent/property taxes paid, making it a sliding-scale benefit. Unlike the Senior Property Valuation Protection (Senior Freeze), this is a tax credit, not a property valuation freeze. Eligibility is statewide with no county variations.
- **Senior Property Valuation Protection Program (Senior Freeze)**: This is a county-administered statewide program with uniform eligibility criteria and benefits but decentralized application processing. Income limits are the primary gating factor and are fixed (not tiered). The 3-year freeze cycle with mandatory renewal is critical — this is not a one-time application. The distinction between 'property valuation' (frozen) and 'property tax bill' (not frozen) is the most commonly misunderstood aspect. Regional variation is minimal in program structure but significant in administrative details (office locations, contact info, specific submission procedures).
- **Arizona Pension Income Deduction**: Tax subtraction claimed annually on state income tax return; no separate program application, no age/income/asset tests, caps per person with post-2025 increases; distinguishes government pensions from private retirement income.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Arizona?
