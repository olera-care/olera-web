# Arizona Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 6.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 10 |
| New (not in our data) | 3 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 5 programs
- **financial**: 2 programs
- **in_kind**: 2 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### AHCCCS (Arizona Long Term Care System - ALTCS)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Long-term care services including home care, assisted living, memory care, skilled nursing; in-home services to avoid nursing home; allows payment to family as caregiver via Medicaid. Provided in institution, home, or community-based settings.[1][2][3][6]` ([source](https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html`

### Arizona Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1600` → Source says `$1,330` ([source](https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premium (if applicable), Part B premium (~$185/month in 2026), deductibles, coinsurance, copays for Medicare-covered services. Automatic Extra Help for Part D (caps drug costs at $12.65/generic in 2026). Providers cannot bill beneficiary for covered services.[5][7]
**SLMB:** Pays Part B premium only. Automatic Extra Help for Part D.[4][6]
**QI (QI-1):** Pays Part B premium only. Automatic Extra Help for Part D. Annual reapplication required; first-come-first-served with renewal priority.[4][6][7]` ([source](https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/))
- **source_url**: Ours says `MISSING` → Source says `https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/`

### Nutrition Assistance (NA) / SNAP in Arizona

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly food assistance benefit amount varies by household net income and size. Minimum benefit is $24/month for households of 1-2 people (with exceptions in application month: $10-$24 range is paid; under $10 is not paid).[2]` ([source](Arizona Department of Economic Security (DES) — specific URL not provided in search results; arizonaselfhelp.org is the primary application/screening tool))
- **source_url**: Ours says `MISSING` → Source says `Arizona Department of Economic Security (DES) — specific URL not provided in search results; arizonaselfhelp.org is the primary application/screening tool`

### Low Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2950` → Source says `$2,807` ([source](https://des.az.gov/liheap))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Standard benefit up to $640 per year for heating or cooling (minimum $160). Crisis benefit up to $500 for energy emergencies.[1][2]` ([source](https://des.az.gov/liheap))
- **source_url**: Ours says `MISSING` → Source says `https://des.az.gov/liheap`

### Arizona State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one personalized health insurance counseling and assistance on Medicare benefits, coverage decisions, Medicare Advantage, Part D prescription drugs, Medigap, Medicare Savings Programs (MSP), Medicaid, low-income subsidies (Extra Help), long-term care insurance, appeals, fraud prevention via Senior Medicare Patrol (SMP), outreach presentations, and enrollment events; no fixed dollar amounts or hours, services provided via phone, in-person, or virtually as needed[1][2][3][4][5][6][7]` ([source](https://azship.org))
- **source_url**: Ours says `MISSING` → Source says `https://azship.org`

### Congregate and Home-Delivered Meals

- **min_age**: Ours says `65` → Source says `60` ([source](https://aging.az.gov/ (implied via Area Agency on Aging; specific provider sites like aaaa.org not directly listed)))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritious meals: Home-delivered (e.g., hot entrée in 3-compartment container + cold sack with salad/fruit/dessert; up to 7 meals/week; special diets for medical needs; wellness check on delivery). Congregate: Hot weekday lunches at senior centers for nutrition/socialization. 1 meal = 1 unit service/day max.` ([source](https://aging.az.gov/ (implied via Area Agency on Aging; specific provider sites like aaaa.org not directly listed)))
- **source_url**: Ours says `MISSING` → Source says `https://aging.az.gov/ (implied via Area Agency on Aging; specific provider sites like aaaa.org not directly listed)`

### Arizona Long Term Care Ombudsman Program

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Free and confidential advocacy services including: investigation of complaints (abuse, neglect, inappropriate eviction, quality/choice of food, poor medication distribution)[2]; information about resident rights, provider options, public resources, and facility regulations[2]; mediation between facility staff and patients[2]; liaison services for grievances[2]` ([source](https://des.az.gov/LTCOP))
- **source_url**: Ours says `MISSING` → Source says `https://des.az.gov/LTCOP`

## New Programs (Not in Our Data)

- **ALTCS Home and Community-Based Services (HCBS) Waiver** — service ([source](https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html))
  - Shape notes: Income limit fixed per individual ($2,982/month as of 2026) regardless of household size; assets $2,000 strict with key exemptions (home equity cap); benefits tiered by NFLOC/priority with managed care providers; statewide but provider-managed regionally.
- **Arizona PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://www.azahcccs.gov (AHCCCS/ALTCS administers; no direct PACE page in results)))
  - Shape notes: Limited to specific PACE center service areas (not statewide); tied to AHCCCS/ALTCS for certification and full coverage; no financial test for enrollment but ALTCS needed for free access; regional providers only.
- **Arizona Weatherization Assistance Program (WAP)** — in_kind ([source](Arizona Department of Housing; individual utility providers (SRP, TEP, UniSource); City of Phoenix))
  - Shape notes: This program's structure is highly fragmented: it operates through different regional agencies (utility-specific and county-specific), uses slightly different income thresholds by provider, and lacks a centralized application portal. Families must first identify their utility provider, then contact the appropriate regional administrator. Income limits scale by household size with a base threshold plus per-person additions. Benefits are in-kind (free retrofits) rather than cash assistance, with the scope of work determined by home assessment. Processing timelines and current waitlist status are not publicly documented in available sources.

## Program Details

### AHCCCS (Arizona Long Term Care System - ALTCS)


**Eligibility:**
- Age: 65+
- Income: Specific 2026 income limits not detailed in sources; applicants exceeding limits may qualify via Income Only Trust. Income earned for providing attendant care (Difficulty of Care) to an ALTCS member in the home is excluded from eligibility determination.[1][2][5][6]
- Assets: Single applicant: $2,000. Married couples (both applying): $4,000. For married with one applicant, both spouses' assets combined and limited; Community Spouse Resource Allowance: Minimum $32,532, Maximum $162,660 (case-by-case). Exempt assets: Primary home (equity ≤ $752,000 if intent to return or certain family live there), 1 vehicle, household goods, personal property, certain burial accounts/plans/plots, Medicaid-compliant annuities, Special Needs Trusts (under 65). Countable: Additional homes, savings, bonds.[1][2][4]
- Arizona resident
- U.S. citizen or qualified immigrant
- Social Security Number (or apply for one)
- Nursing Facility Level of Care (NFLOC) via Pre-Admission Screening (PAS), assessing ADLs (transferring, mobility, eating, toileting, bathing, grooming, dressing) and cognitive deficits (e.g., dementia); diagnosis alone insufficient
- Live in approved setting: own home, AHCCCS-certified nursing facility, or assisted living facility
- Blind or disabled also qualify (not age-restricted for them)

**Benefits:** Long-term care services including home care, assisted living, memory care, skilled nursing; in-home services to avoid nursing home; allows payment to family as caregiver via Medicaid. Provided in institution, home, or community-based settings.[1][2][3][6]
- Varies by: priority_tier

**How to apply:**
- Online: Health-e-Arizona Plus ALTCS portal
- Phone: (888) 621-6880 (toll-free)
- Form: DE-828 (Filing an Application for the Arizona Long Term Care System)

**Timeline:** Not specified; eligibility determined month-by-month; renewal every 12 months (auto if data matches).[5]

**Watch out for:**
- Both spouses' assets counted even if only one applies; community spouse allowance case-by-case
- Home equity limit $752,000 applies specifically
- Medical NFLOC required beyond age/disability; PAS assessment key
- Income Only Trust or Difficulty of Care exclusion needed if over income limits
- Transfer penalties based on regional private pay rates
- Medicaid-compliant annuities have strict rules—do not purchase without counsel
- Eligibility cannot start before AZ residency or post-incarceration release

**Data shape:** Asset limits low ($2,000 single) with spousal protections; NFLOC via PAS mandatory; Difficulty of Care income exclusion unique for family caregivers; regional penalty rate variations; trust/annuity options for income/assets

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html

---

### ALTCS Home and Community-Based Services (HCBS) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Single applicant or married applicant applying alone: up to $2,982 per month (as of January 1, 2026). Married couple applying together: combined income up to $2,982 per individual (limits adjusted periodically for inflation). Income from providing attendant or personal care (Difficulty of Care) to an ALTCS member in the home may be excluded.
- Assets: Countable assets must not exceed $2,000 for single applicants (or combined for married couples applying together); must not accumulate over $2,000 in any month to remain eligible. Exempt (non-countable): primary home (if applicant lives there, intends to return, equity ≤ $752,000 in 2026; or spouse/child under 21/blind or disabled child lives there), one vehicle, household furnishings/appliances, personal effects. Countable: additional homes, savings, bonds. 60-month Look-Back Rule applies; transfers below fair market value cause penalty period.
- U.S. citizen or qualified legal resident with valid SSN
- Arizona resident intending to remain
- Nursing Facility Level of Care (NFLOC) via Pre-Admission Screening (PAS), assessing ADLs (e.g., bathing, dressing, eating, mobility, toileting) and cognitive deficits (e.g., dementia)
- Live in approved setting: own home, licensed medical facility, or state waiver-approved
- Effort to secure other entitled government benefits
- Provide evidence supporting benefit claim

**Benefits:** Home and community-based services including personal care/attendant care (e.g., ADLs: bathing, dressing, cooking, grooming, toileting, transferring, mobility; managing money/medications/basic life skills); up to 40 hours/week home care if family caregiver (max 50 hours/week if non-family); transportation assistance; other supports to avoid nursing facility. Delivered via managed care model through approved plan providers. Family members (including spouses) can be paid caregivers if hired by provider.
- Varies by: priority_tier

**How to apply:**
- Phone: Call AHCCCS to start (specific number not listed; initiate via 1-855-432-7587 for general AHCCCS or local ALTCS office)
- Online: AHCCCS application at azahcccs.gov (includes ALTCS form DE-828)
- Mail/In-person: Submit DE-828 to local AHCCCS/ALTCS office

**Timeline:** Not specified; involves financial evaluation after application start, then medical screening/interview by assigned caseworker.
**Waitlist:** Not mentioned in sources; potential delays due to assessments.

**Watch out for:**
- Must meet both financial (income + assets) AND medical (NFLOC via PAS) criteria; failing one disqualifies.
- Assets combined for married couples; strict $2,000 limit with no accumulation allowed monthly.
- 60-month Look-Back penalizes improper transfers.
- Family caregivers must be hired by approved provider, not directly.
- Income limits per individual even if married; Difficulty of Care exclusion only for specific caregiver income.
- Dementia diagnosis alone insufficient; must prove NFLOC via ADLs/cognition.
- Must live in approved setting; not all residences qualify.

**Data shape:** Income limit fixed per individual ($2,982/month as of 2026) regardless of household size; assets $2,000 strict with key exemptions (home equity cap); benefits tiered by NFLOC/priority with managed care providers; statewide but provider-managed regionally.

**Source:** https://www.azahcccs.gov/Members/GetCovered/Categories/nursinghome.html

---

### Arizona PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for enrollment in Arizona PACE; financial criteria are not considered. However, to qualify as an 'eligible participant' and avoid private pay, must meet ALTCS (Arizona Long Term Care System) income eligibility or agree to pay private fees. ALTCS income limits follow federal SSI guidelines (specific 2026 dollar amounts not in sources; typically ~$943/month for individual, varies by household size). No full table available in sources.
- Assets: No asset limits for PACE enrollment itself. For ALTCS to cover costs (avoiding private pay), ALTCS asset limits apply (typically $2,000 for individual; excludes home, one vehicle, etc., but specifics not detailed in sources).
- Live in the service area of an Arizona PACE organization.
- Certified by AHCCCS (Arizona's Medicaid agency) as needing nursing home level of care.
- Able to live safely in the community (non-institutional setting) with PACE services at time of enrollment.
- Meet ALTCS service needs requirements.
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, hospice, or certain other programs.

**Benefits:** Comprehensive medical and social services via interdisciplinary team (IDT) at an adult day health center, including all Medicare/Medicaid-covered services plus additional long-term care (e.g., personal care, home modifications, transportation, therapies, medications, meals). Fully covered for dually eligible (Medicare/Medicaid); private pay option otherwise (costs ~$7,000+/month estimated nationally, no AZ-specific amounts). No deductibles or copays for covered services.
- Varies by: region

**How to apply:**
- Contact local PACE organization (specific providers vary by region; use NPA finder via npaonline.org).
- AHCCCS/ALTCS intake forwarded to PACE staff for assessment.
- No specific AZ phone/website/forms listed; start with AHCCCS ALTCS helpline (1-877-382-2363 implied via general process) or find local PACE.

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may vary by local PACE center.

**Watch out for:**
- Not statewide—must live in a PACE service area; limited locations in AZ.
- Requires AHCCCS nursing home level certification even if not Medicaid-eligible (private pay possible but expensive).
- Cannot be in Medicare Advantage, hospice, etc.—must disenroll first.
- 90%+ participants dually eligible; non-duals pay privately (~$7k+/mo).
- Voluntary but must agree to all services through PACE only.

**Data shape:** Limited to specific PACE center service areas (not statewide); tied to AHCCCS/ALTCS for certification and full coverage; no financial test for enrollment but ALTCS needed for free access; regional providers only.

**Source:** https://www.azahcccs.gov (AHCCCS/ALTCS administers; no direct PACE page in results)

---

### Arizona Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits are based on 100% FPL for QMB ($1,330/month single, $1,794/month couple), 120% FPL for SLMB ($1,596/month single, $2,152/month couple), 135% FPL for QI ($1,796/month single, $2,426/month couple). Limits include a $20 general income disregard and vary slightly by year; 2026 federal limits apply with state alignment. Full table (monthly countable income, approximate for 2026):
| Household | QMB (100% FPL) | SLMB (120% FPL) | QI (135% FPL) |
|----------|----------------|------------------|---------------|
| 1        | $1,330         | $1,596           | $1,796        |
| 2        | $1,794         | $2,152           | $2,426        |
Higher for larger households per FPL guidelines.[4][5][7]
- Assets: Arizona does not impose asset limits for these programs (no resource test since 2010s alignment with SSI expansions). Exemptions not applicable due to no test.[1][4]
- Must be enrolled in or eligible for Medicare Part A (age 65+ or disabled)
- Arizona resident
- U.S. citizen or qualified non-citizen
- Apply for other available pensions/disability/retirement benefits
- Must have Part B for SLMB/QI

**Benefits:** **QMB:** Pays Medicare Part A premium (if applicable), Part B premium (~$185/month in 2026), deductibles, coinsurance, copays for Medicare-covered services. Automatic Extra Help for Part D (caps drug costs at $12.65/generic in 2026). Providers cannot bill beneficiary for covered services.[5][7]
**SLMB:** Pays Part B premium only. Automatic Extra Help for Part D.[4][6]
**QI (QI-1):** Pays Part B premium only. Automatic Extra Help for Part D. Annual reapplication required; first-come-first-served with renewal priority.[4][6][7]
- Varies by: priority_tier

**How to apply:**
- Online: AHCCCS application at https://www.healthearizonaplus.gov/
- Phone: 1-855-432-7587 (AHCCCS helpline) or 1-800-MEDICARE (general questions)
- Mail: AHCCCS, P.O. Box 19021, Phoenix, AZ 85005
- In-person: Local AHCCCS/Desert Sky offices or Area Agencies on Aging (find via 1-877-767-2382)
- Download form: AHCCCS Medical Application (AHCCCS-8011 or similar from azahcccs.gov)

**Timeline:** 45-90 days typical; no specific Arizona timeline stated, but federal MSP standard is 45 days
**Waitlist:** QI has first-come-first-served with priority for prior recipients; potential waitlist if funds exhausted (federal cap).[7]

**Watch out for:**
- Arizona has no asset limit, but must apply for other benefits (e.g., SSI) first
- QMB provides full cost-sharing protection—providers can't bill you, but confirm with 'QMB' status
- QI requires annual renewal and has funding caps—apply early in year
- Automatic Extra Help with Part D, but must coordinate with plan
- Income calculated after $20 disregard; household size includes spouse
- Not full Medicaid—only Medicare cost-sharing help
- Outdated web limits (e.g., [2]) don't reflect current FPL

**Data shape:** Tiered by income brackets (QMB/SLMB/QI); no asset test in AZ; benefits fixed by federal MSP categories with state AHCCCS payment; QI first-come-first-served federally capped

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.azahcccs.gov/PlansProviders/FeeForServiceHealthPlans/MedicareSavingsPrograms/

---

### Nutrition Assistance (NA) / SNAP in Arizona


**Eligibility:**
- Income: {"description":"Arizona has two income tests. Most households must pass BOTH the Gross Income test AND the Net Income test. However, households with a member age 60+ or with a disability can qualify by passing ONLY the Net Income and Asset tests, even if they exceed the Gross Income limit.[1][4]","gross_income_limit":{"threshold":"185% of Federal Poverty Level (FPL)","note":"Does NOT apply to households with member 60+ or with disability[4]","monthly_limits":{"1_person":"$2,412","2_people":"$3,261","3_people":"$4,108","4_people":"$4,956","5_people":"$5,805","6_people":"$6,652","7_people":"$7,499","each_additional":"+$847"}},"net_income_limit":{"threshold":"100% of Federal Poverty Level (FPL)","note":"Applies to ALL households after deductions for income tax, shelter, and medical expenses[2][4]","monthly_limits":{"1_person":"$1,304","2_people":"$1,763","3_people":"$2,221","4_people":"$2,679","5_people":"$3,138","6_people":"$3,596","7_people":"$4,054","each_additional":"+$458"}},"special_case_elderly_disabled":"If household has member 60+ or with disability, they can qualify using ONLY the Net Income and Asset tests, bypassing the Gross Income test entirely.[4]"}
- Assets: {"general_households":"No specific asset limit mentioned in standard rules[1]","households_with_disability":"$4,500 resource limit. However, some people with disabilities have categorical eligibility and resources are not counted.[2]","migrant_seasonal_workers":"Cash and bank accounts must be $100 or less[1]","what_counts":"Resources include car, home, money in bank[2]"}
- Must be an Arizona resident[1]
- Must be a U.S. citizen or lawfully present non-citizen (includes qualified aliens: refugees, trafficking victims, Cuban/Haitian immigrants, Iraqi/Afghan immigrants with special status)[1][5]
- Must have a Social Security number or proof of application for one[1]
- Work requirement: Able-bodied adults must work or be in DES-approved training program for at least 80 hours per month[3]
- Work requirement exceptions: half-time student, unable to work due to disability, pregnant, receiving unemployment benefits, in drug/alcohol treatment, living in high unemployment area, or responsible for care of disabled person or child under 18[3]
- Cannot intentionally reduce work hours or leave job to qualify[5]

**Benefits:** Monthly food assistance benefit amount varies by household net income and size. Minimum benefit is $24/month for households of 1-2 people (with exceptions in application month: $10-$24 range is paid; under $10 is not paid).[2]
- Varies by: household_size and net_income

**How to apply:**
- Online: arizonaselfhelp.org (screening tool and application)[2][3]
- Phone: 1-855-777-8590 (Family Assistance Administration / FAA)[2]
- Phone: 1-855-432-7587 (Arizona SNAP hotline)[5]
- In-person: Local DES (Department of Economic Security) office[3]
- Mail: Not explicitly mentioned in search results

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Elderly and disabled households have a MAJOR advantage: they can bypass the Gross Income test entirely and qualify using only Net Income and Asset tests. This means an elderly person earning $3,000/month could still qualify if their net income (after deductions) is under $1,304.[4]
- The work requirement is strict (80 hours/month) but has many exceptions — families should check if their elderly loved one qualifies for an exemption before assuming they don't qualify.[3]
- Arizona has EXPANDED eligibility beyond federal SNAP requirements, so income limits are higher than in many other states.[4]
- Deductions matter significantly: shelter costs, medical expenses, and income tax are deducted from gross income to calculate net income. An elderly person with high medical expenses could qualify even with higher gross income.[2]
- Minimum benefit is $24/month for most households, but in the application month, benefits under $10 are not paid at all.[2]
- Non-citizens must have 'qualified alien' status — not all non-citizens qualify, but the program is broader than just citizens.[5]
- If someone is unemployed, they may still qualify, but they may be required to participate in employment/training programs (with exceptions).[5]
- Intentionally reducing work hours or leaving a job to qualify will disqualify the applicant.[5]

**Data shape:** This program's eligibility structure is bifurcated: elderly/disabled households follow different rules than general households, with significantly more favorable income thresholds. Benefits scale by household size and net income. Arizona has expanded beyond federal minimums. The work requirement has numerous categorical exemptions. Processing timelines and specific form numbers are not publicly detailed in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** Arizona Department of Economic Security (DES) — specific URL not provided in search results; arizonaselfhelp.org is the primary application/screening tool

---

### Low Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly income must be at or below: 1 person $2,807; 2 people $3,671; 3 people $4,535; 4 people $5,399; 5 people $6,262; 6 people $7,126. Adds approximately $864 per additional person.[2]
- Assets: No asset limit applies.[2]
- Proof of U.S. citizenship, permanent legal residence (LPR), or qualifying immigration status (e.g., refugee, TPS).[1]
- Priority for households with elderly (60+), disabled persons, veterans, or children under 6.[3]
- No benefit if utility bill credit exceeds $500.[3]

**Benefits:** Standard benefit up to $640 per year for heating or cooling (minimum $160). Crisis benefit up to $500 for energy emergencies.[1][2]
- Varies by: priority_tier

**How to apply:**
- Online: Apply via des.az.gov/liheap or local Community Action Program sites.[1][3]
- Phone: (866) 494-1981 or (833) 453-2142.[1][4]
- In-person: Schedule appointment with local Community Action Program.[1]
- Mail/Fax: Submit EAP-1002A form to PO Box 19130, Phoenix, AZ 85009-9998 or fax (602) 612-8282.[4]

**Timeline:** Not specified in sources; apply early as funding is limited.
**Waitlist:** Funding limited; agencies may stop accepting applications if funds run out.[2]

**Watch out for:**
- Priority-based on vulnerable members (elderly 60+, disabled, young children, veterans); not first-come.[3]
- No benefit if $500+ utility credit exists.[3]
- Funding exhausts quickly; apply early, especially in season starts.[2]
- Roommates sharing utility bill count as one household.[2]
- Tribal LIHEAP denial required if previously applied there.[4]

**Data shape:** Priority tiers for vulnerable households (elderly/disabled/children); seasonal heating/cooling windows vary by county groups; no asset test; fixed max benefits with crisis add-on.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://des.az.gov/liheap

---

### Arizona Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of federal poverty guidelines. Specific limits vary by household size:[1][2][3] Single person: $31,120[3]; 1 person: $30,120[4]; 2 people: $40,880[4]; 3 people: $51,640[4]; 4 people: $62,400[4]; 5 people: $73,160[4]; 6 people: $83,920[4]; 7 people: $94,680[4]; 8 people: $105,440[4]; for each additional person, add $10,760[4]. (Note: TEP and UniSource use slightly different thresholds with $11,000 per additional person[1][2], reflecting variations by utility provider.)
- Assets: Not specified in available sources
- Must be a homeowner or renter[5]
- Must be a customer of a participating utility (SRP, TEP, UniSource, or other Arizona providers)[1][2][4]
- Priority often given to elderly, disabled, and families with children[3]

**Benefits:** Free energy efficiency retrofits with no cost to eligible recipients. SRP provides up to $9,000 per eligible household on top of federal funding[4]. Specific improvements may include: caulking and weather-stripping, insulation (attic, wall, duct), water heater insulation, attic ventilation, sun screens, evaporative cooler service/replacement, low-flow showerheads, faucet aerators, air-conditioning duct sealing, space heating/cooling system repair or replacement, ENERGY STAR LED lightbulbs, window shading, and carbon monoxide detectors[1][2][4][5]
- Varies by: household_size and utility provider

**How to apply:**
- Phone: All Thrive 365 (Tucson and South Tucson): 520-485-4985[1]; Pima County Community and Workforce Development (outside Tucson, Sahuarita, Oro Valley, Marana): 520-724-2461[1]; SRP service area (Maricopa County outside Phoenix/Mesa): 480-808-0429[4]; City of Phoenix: rehab.nsd@phoenix.gov or 200 W. Washington Street 4th Floor, Phoenix, AZ 85003[5]
- Email: tucsonwap@allthrive365.org[1]; rehab.nsd@phoenix.gov[5]
- Online: era.azdes.gov (for LIHEAP component)[5]
- Phone (LIHEAP): 1-866-494-1981[5]
- In-person: City of Phoenix office at 200 W. Washington Street 4th Floor, Phoenix, AZ 85003[5]

**Timeline:** Not specified in available sources
**Waitlist:** Funding is limited[1]; no specific waitlist timeline provided

**Watch out for:**
- Income limits are 200% of federal poverty guidelines, not 100%—this is more generous than many assume but still quite restrictive[1][2][3]
- Program is administered through multiple different agencies depending on your utility provider and location—there is no single statewide application process[1][2][4][5]
- Funding is limited, and the search results do not specify current wait times or whether there is an active waitlist[1]
- Income thresholds vary slightly by utility provider (SRP vs. TEP/UniSource use different per-person add-ons), so a family at the borderline may qualify with one provider but not another[1][2][4]
- The program is complementary to federal WAP and LIHEAP programs—families may need to apply separately for different components[1][5]
- Priority is given to elderly, disabled, and families with children, but this does not guarantee approval for other households[3]
- Home must be assessed and inspected before improvements are approved; not all homes may qualify for all services[5]
- Program participants are surveyed about comfort and bill savings, but actual energy bill reductions are not guaranteed[1]

**Data shape:** This program's structure is highly fragmented: it operates through different regional agencies (utility-specific and county-specific), uses slightly different income thresholds by provider, and lacks a centralized application portal. Families must first identify their utility provider, then contact the appropriate regional administrator. Income limits scale by household size with a base threshold plus per-person additions. Benefits are in-kind (free retrofits) rather than cash assistance, with the scope of work determined by home assessment. Processing timelines and current waitlist status are not publicly documented in available sources.

**Source:** Arizona Department of Housing; individual utility providers (SRP, TEP, UniSource); City of Phoenix

---

### Arizona State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, their families, and caregivers, with support prioritized for those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[2][3][6]
- Assets: No asset limits or tests apply[2][6]
- Must be a Medicare beneficiary, family member, or caregiver seeking help with Medicare-related issues[1][2][3][5][6]

**Benefits:** Free one-on-one personalized health insurance counseling and assistance on Medicare benefits, coverage decisions, Medicare Advantage, Part D prescription drugs, Medigap, Medicare Savings Programs (MSP), Medicaid, low-income subsidies (Extra Help), long-term care insurance, appeals, fraud prevention via Senior Medicare Patrol (SMP), outreach presentations, and enrollment events; no fixed dollar amounts or hours, services provided via phone, in-person, or virtually as needed[1][2][3][4][5][6][7]

**How to apply:**
- Phone: 1-800-432-4040[5][6]
- Website intake form: https://azship.org[6]
- In-person or local appointments via regional providers (e.g., SEAGO in Bisbee for 4-county region[7], PCOA at 8467 E Broadway Blvd, Tucson, AZ 85710, (520) 790-7262[8])
- Mail or additional contacts via state office: Division of Aging and Adult Services, Arizona Department of Economic Security, 1789 West Jefferson, Site Code MD6288, Phoenix, AZ 85007[1]

**Timeline:** Counselors return calls or schedule appointments promptly after contact; no formal processing timeline specified[5][6][7]

**Watch out for:**
- Not a direct financial aid or healthcare provider—offers counseling only, not payment for services; people may miss that it helps apply for other programs like MSP (up to $8,400/year savings) or Extra Help; assumes Medicare enrollment—helps check eligibility; regional providers handle local plans, so contact statewide line first[2][4][6]
- Services are free but rely on volunteers/staff availability, potentially leading to call-back delays[2][7]

**Data shape:** no income/asset test; counseling service via statewide network of local providers; prioritizes low-income/disabled but open to all Medicare-related needs; integrates SMP for fraud prevention

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://azship.org

---

### Congregate and Home-Delivered Meals


**Eligibility:**
- Age: 60+
- Income: No fixed statewide income limits specified; eligibility prioritizes those with greatest social/economic need (e.g., limited incomes). For financial assistance via Area Agency on Aging (AAA), criteria vary and require screening—no specific dollar amounts or household tables provided. Medicaid/ALTCS may cover for eligible members without stated limits here.
- Assets: No asset limits or exemptions specified.
- 60+ years old or 18-59 with disabilities for many programs
- Homebound or unable to prepare meals independently (e.g., due to illness, disability, mobility issues)
- Priority for greatest need: low-income, minorities, rural residents
- Referral often required from AAA, S.A.I.L., or ALTCS case managers

**Benefits:** Nutritious meals: Home-delivered (e.g., hot entrée in 3-compartment container + cold sack with salad/fruit/dessert; up to 7 meals/week; special diets for medical needs; wellness check on delivery). Congregate: Hot weekday lunches at senior centers for nutrition/socialization. 1 meal = 1 unit service/day max.
- Varies by: region

**How to apply:**
- Phone: Area Agency on Aging Helpline at 602-264-4357 or 602-264-HELP (primary contact for eligibility)
- Phone: Local providers e.g., Fountain Hills Community Center 480-816-5229 (Mon-Thu 9am-4pm)
- In-person: Congregate sites e.g., YWCA Glendale (623) 931-7436
- Through case managers: If already AAA/S.A.I.L./ALTCS client

**Timeline:** Not specified
**Waitlist:** Scheduling varies by provider; not explicitly stated but implied for popular programs

**Watch out for:**
- Separate eligibility for financial assistance vs. self-pay (e.g., Fountain Hills self-pay: physical condition, post-hospital, caregiver, or 80+)
- Must contact AAA helpline first for screening—not direct provider apply
- Medicaid/ALTCS separate via health plan/case manager
- No same-day congregate + home meals; max 1/day
- Private pay option ~$9.49/meal if ineligible

**Data shape:** Administered regionally via Area Agencies on Aging with local providers; no uniform income table—priority-based; referrals often required; ties to Medicaid/ALTCS for covered members

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.az.gov/ (implied via Area Agency on Aging; specific provider sites like aaaa.org not directly listed)

---

### Arizona Long Term Care Ombudsman Program


**Eligibility:**
- Resident of a long-term care facility in Arizona (nursing homes, hospice centers, adult day care, assisted living facilities, or adult foster care homes)[2]
- No eligibility restrictions mentioned in available sources — this is an advocacy service, not a needs-based program[2][3]

**Benefits:** Free and confidential advocacy services including: investigation of complaints (abuse, neglect, inappropriate eviction, quality/choice of food, poor medication distribution)[2]; information about resident rights, provider options, public resources, and facility regulations[2]; mediation between facility staff and patients[2]; liaison services for grievances[2]

**How to apply:**
- Phone: Contact your local Area Agency on Aging (regional numbers vary)[4]
- Phone: State Long-Term Care Ombudsman Program: (602) 542-6454 extension 9[2]
- Phone: DES oversight office: (602) 542-6446[4]
- Mail: Office of Arizona State Long-Term Care Ombudsman Program, 1789 W. Jefferson Street, Mail Drop 6288, Phoenix, Arizona 85007[2]
- Email: ltcop@azdes.gov[2]
- Website: https://des.az.gov/LTCOP[2]
- In-person: Contact your local Area Agency on Aging office[4]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- This is an advocacy and complaint resolution service, NOT a direct care or financial assistance program — families cannot apply for the ombudsman to provide medical care or financial benefits[2]
- Ombudsmen must have resident consent before investigating complaints or referring cases to other agencies[3] — the resident (not just family) must authorize action
- Facilities are required to post ombudsman contact information, but many residents and families may not know to look for it[5]
- If dissatisfied with a regional ombudsman's response, escalate to the DES oversight office at (602) 542-6446, not the state program number[4]
- For abuse or neglect of vulnerable adults, you may also need to report separately to Adult Protective Services at (877) 767-2385[4]
- The program serves multiple facility types (nursing homes, assisted living, hospice, adult day care, adult foster care) but specific facility eligibility should be confirmed with your regional office[2]

**Data shape:** This is a universal advocacy program with no income, asset, or age eligibility requirements — any resident of a covered long-term care facility can access services. The program is structured regionally through Area Agencies on Aging, so contact methods and response times may vary by county. Unlike benefit programs, there is no application process with forms or documentation; families contact their regional office directly. The key limitation is that ombudsmen investigate and advocate on behalf of residents but do not provide direct services or financial assistance.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://des.az.gov/LTCOP

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| AHCCCS (Arizona Long Term Care System -  | benefit | state | deep |
| ALTCS Home and Community-Based Services  | benefit | state | deep |
| Arizona PACE (Program of All-Inclusive C | benefit | local | deep |
| Arizona Medicare Savings Programs (QMB,  | benefit | federal | deep |
| Nutrition Assistance (NA) / SNAP in Ariz | benefit | federal | medium |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Arizona Weatherization Assistance Progra | benefit | federal | deep |
| Arizona State Health Insurance Assistanc | resource | federal | simple |
| Congregate and Home-Delivered Meals | benefit | state | deep |
| Arizona Long Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":8,"resource":2}
**Scopes:** {"state":3,"local":1,"federal":6}
**Complexity:** {"deep":7,"medium":1,"simple":2}

## Content Drafts

Generated 10 page drafts. Review in admin dashboard or `data/pipeline/AZ/drafts.json`.

- **AHCCCS (Arizona Long Term Care System - ALTCS)** (benefit) — 3 content sections, 6 FAQs
- **ALTCS Home and Community-Based Services (HCBS) Waiver** (benefit) — 4 content sections, 6 FAQs
- **Arizona PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 3 content sections, 6 FAQs
- **Arizona Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Nutrition Assistance (NA) / SNAP in Arizona** (benefit) — 5 content sections, 6 FAQs
- **Low Income Home Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Arizona Weatherization Assistance Program (WAP)** (benefit) — 4 content sections, 6 FAQs
- **Arizona State Health Insurance Assistance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Congregate and Home-Delivered Meals** (benefit) — 4 content sections, 6 FAQs
- **Arizona Long Term Care Ombudsman Program** (resource) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 2 programs
- **household_size and net_income**: 1 programs
- **household_size and utility provider**: 1 programs
- **not_applicable**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **AHCCCS (Arizona Long Term Care System - ALTCS)**: Asset limits low ($2,000 single) with spousal protections; NFLOC via PAS mandatory; Difficulty of Care income exclusion unique for family caregivers; regional penalty rate variations; trust/annuity options for income/assets
- **ALTCS Home and Community-Based Services (HCBS) Waiver**: Income limit fixed per individual ($2,982/month as of 2026) regardless of household size; assets $2,000 strict with key exemptions (home equity cap); benefits tiered by NFLOC/priority with managed care providers; statewide but provider-managed regionally.
- **Arizona PACE (Program of All-Inclusive Care for the Elderly)**: Limited to specific PACE center service areas (not statewide); tied to AHCCCS/ALTCS for certification and full coverage; no financial test for enrollment but ALTCS needed for free access; regional providers only.
- **Arizona Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI); no asset test in AZ; benefits fixed by federal MSP categories with state AHCCCS payment; QI first-come-first-served federally capped
- **Nutrition Assistance (NA) / SNAP in Arizona**: This program's eligibility structure is bifurcated: elderly/disabled households follow different rules than general households, with significantly more favorable income thresholds. Benefits scale by household size and net income. Arizona has expanded beyond federal minimums. The work requirement has numerous categorical exemptions. Processing timelines and specific form numbers are not publicly detailed in available sources.
- **Low Income Home Energy Assistance Program (LIHEAP)**: Priority tiers for vulnerable households (elderly/disabled/children); seasonal heating/cooling windows vary by county groups; no asset test; fixed max benefits with crisis add-on.
- **Arizona Weatherization Assistance Program (WAP)**: This program's structure is highly fragmented: it operates through different regional agencies (utility-specific and county-specific), uses slightly different income thresholds by provider, and lacks a centralized application portal. Families must first identify their utility provider, then contact the appropriate regional administrator. Income limits scale by household size with a base threshold plus per-person additions. Benefits are in-kind (free retrofits) rather than cash assistance, with the scope of work determined by home assessment. Processing timelines and current waitlist status are not publicly documented in available sources.
- **Arizona State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling service via statewide network of local providers; prioritizes low-income/disabled but open to all Medicare-related needs; integrates SMP for fraud prevention
- **Congregate and Home-Delivered Meals**: Administered regionally via Area Agencies on Aging with local providers; no uniform income table—priority-based; referrals often required; ties to Medicaid/ALTCS for covered members
- **Arizona Long Term Care Ombudsman Program**: This is a universal advocacy program with no income, asset, or age eligibility requirements — any resident of a covered long-term care facility can access services. The program is structured regionally through Area Agencies on Aging, so contact methods and response times may vary by county. Unlike benefit programs, there is no application process with forms or documentation; families contact their regional office directly. The key limitation is that ombudsmen investigate and advocate on behalf of residents but do not provide direct services or financial assistance.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Arizona?
