# Ohio Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 1.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 17 |
| New (not in our data) | 9 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 4 programs
- **advocacy**: 2 programs
- **employment**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### PASSPORT

- **income_limit**: Ours says `$1491` → Source says `$2,901` ([source](https://aging.ohio.gov/passport))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `In-home long-term services and supports including: personal care assistance, home delivered meals, skilled nursing visits, transportation to medical appointments, homemaking/housework, case management, respite care, emergency response services, adult health center services, structured family caregiving support. Package developed by case manager from local providers; also includes Medicaid card for medications/health care. No fixed dollar amounts or hours specified; tailored to needs.[3][5][7][8]` ([source](https://aging.ohio.gov/passport))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ohio.gov/passport`

### Ohio Medicaid

- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Long-term care services including nursing home care, assisted living facility care, home and community-based services (HCBS), and non-medical services in home or adult day care settings. Also covers basic healthcare (physician visits, prescription medication, emergency room visits, short-term hospital stays) for ABD Medicaid recipients[1][3][8]` ([source](medicaid.ohio.gov[6] and aging.ohio.gov/medicaid[9]))
- **source_url**: Ours says `MISSING` → Source says `medicaid.ohio.gov[6] and aging.ohio.gov/medicaid[9]`

### PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$2500` → Source says `$2,901` ([source](https://aging.ohio.gov/PACE and Ohio Administrative Code Rule 173-50-02))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `All-inclusive care model covering everything the person needs — specific services not itemized in search results, but described as comprehensive home and community-based care for nursing home-eligible individuals[8]` ([source](https://aging.ohio.gov/PACE and Ohio Administrative Code Rule 173-50-02))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ohio.gov/PACE and Ohio Administrative Code Rule 173-50-02`

### Ohio SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://benefits.ohio.gov/SNAP))
- **income_limit**: Ours says `$1984` → Source says `$15,060` ([source](https://benefits.ohio.gov/SNAP))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for groceries (no cash). Minimum $23/month; full benefit calculated as max allotment minus 30% of net income (e.g., 2-person elderly household with $1,200 gross may get ~$415/month after deductions). Max allotments: ~$291 (1-person), $546 (2-person) in contiguous states[1][3][7]. Seniors often qualify for higher due to medical/shelter deductions.` ([source](https://benefits.ohio.gov/SNAP))
- **source_url**: Ours says `MISSING` → Source says `https://benefits.ohio.gov/SNAP`

### Ohio Senior Health Insurance Information Program (OSHIIP/SHIP)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Free, objective, personalized one-on-one health insurance counseling; education on Medicare, Medicare Part D, Medicare Advantage, Medicare supplement insurance, long-term care insurance, and other health insurance matters; enrollment assistance, appeals, complaints, explanation of benefits; hotline support, speaker's bureau, trained volunteers.[1][2][3][4][6]` ([source](https://insurance.ohio.gov/consumers/medicare/01-oshiip))
- **source_url**: Ours says `MISSING` → Source says `https://insurance.ohio.gov/consumers/medicare/01-oshiip`

### Meals on Wheels (Home-Delivered Meals)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritious home-delivered meals (typically 1 per day, up to 14 per week for noon/evening in some waiver programs); may include companionship and safety checks. Therapeutic meals (e.g., diabetic) available in select areas with prescription. Self-pay or funder-supported options exist[1][4][6][9].` ([source](https://aging.ohio.gov (Ohio Department of Aging; program follows ODA rules per local providers[1])))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ohio.gov (Ohio Department of Aging; program follows ODA rules per local providers[1])`

### National Family Caregiver Support Program (NFCSP)

- **min_age**: Ours says `60` → Source says `55` ([source](https://aging.ohio.gov/care-and-living/caregiver-support[8]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Five core services: 1) Information about available services; 2) Assistance gaining access to services; 3) Individual counseling, support groups, caregiver training; 4) Respite care; 5) Supplemental services on limited basis (e.g., short-term services once per calendar year in some areas)[1][2][7]. No fixed dollar amounts or hours specified statewide; short-term respite and services vary locally.` ([source](https://aging.ohio.gov/care-and-living/caregiver-support[8]))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ohio.gov/care-and-living/caregiver-support[8]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints about quality of care and life; investigation of issues like abuse, neglect, poor hygiene, food quality, billing, admission/transfer/discharge problems, civil rights violations; assistance with care planning, Medicare/Medicaid questions, linking to services, provider selection resources, and ensuring person-centered care; provided confidentially by trained staff and volunteers.` ([source](https://aging.ohio.gov/ombudsman))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ohio.gov/ombudsman`

## New Programs (Not in Our Data)

- **Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://insurance.ohio.gov/consumers/medicare/msp and https://medicaid.ohio.gov (Ohio Dept of Medicaid)))
  - Shape notes: Tiered by program (QMB/SLMB/QI) with escalating income thresholds; single/couple focus (FPL-scaled for households); statewide uniform but county-administered; QI capped funding/priority re-enrollment; no age min (Medicare-tied, typically 65+).
- **Home Energy Assistance Program (HEAP)** — financial ([source](https://development.ohio.gov/individual/energy-assistance/1-home-energy-assistance-program))
  - Shape notes: Income caps at 175% FPL (household size table required via official tool); benefits highly variable by income, fuel, region, PIPP; local agency delivery statewide; annual re-verification; 30/90/12-month income proof flexibility
- **Home Weatherization Assistance Program (HWAP)** — service ([source](https://development.ohio.gov/individual/energy-assistance/6-home-weatherization-assistance-program[2]))
  - Shape notes: Income at 200% FPG with table scaling by household size and +$11k per extra member; priority tiers drive service order; county-based local providers with unique contacts/forms; automatic eligibility from specific aid programs.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://aging.ohio.gov/care-and-living/staying-active/staying-active-catalog/senior-community-services-employment-program and https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: SCSEP is a statewide program available in all 88 Ohio counties but administered by multiple regional providers, so the application process and local contact information vary by provider and county. Income eligibility is based on a percentage of federal poverty level (125%), which scales by household size but specific dollar amounts are not provided in search results. Benefits are fixed (20 hours/week at minimum wage) rather than tiered. The program emphasizes priority enrollment for specific populations rather than different benefit levels. Federal funding delays noted in 2026 may affect program availability.
- **Legal Assistance Developer Program (LADP)** — service ([source](https://aging.ohio.gov (ODA); Rule 173-3-06.10 Ohio Admin Code[1][3]))
  - Shape notes: State Legal Assistance Developer (LAD) coordinates statewide OAA Title III-B legal services via AAAs; non-means-tested for 60+ but priority-tiered; regional AAA delivery with no fixed dollar/hour limits
- **Golden Buckeye Program** — in_kind ([source](https://aging.ohio.gov/about-us/learn-about-golden-buckeye/))
  - Shape notes: This program has no income or asset limits, making it universally accessible to eligible age/disability groups. The primary eligibility divide is age-based (60+) versus disability-based (18-59). Application method differs by category: age 60+ can use online form or in-person; disability applicants must apply in-person. Benefits are merchant-dependent rather than program-tiered. Recent policy change (end of automatic enrollment) is critical for families to understand.
- **Healthy Aging Grants** — service ([source](https://aging.ohio.gov/care-and-living/healthy-aging))
  - Shape notes: County-administered with local variations in providers, application processes, and service focus; no direct state application for individuals; income test at 300% FPL or 65% AMI; funds to counties then sub-granted to providers
- **Senior Citizen Tax Credit** — financial ([source](https://tax.ohio.gov/individual/file-now/ohio-tax-credits-and-their-required-documentation))
  - Shape notes: State income tax credit claimed annually via tax return; strict requirement for qualifying retirement income types; fixed $100,000 income threshold regardless of household size; no asset test.
- **Franklin County Senior Services Levy Programs (Senior Options)** — service ([source](https://www.franklincountyohio.gov/Resident-Services/Seniors/Senior-Options-Programs))
  - Shape notes: county-restricted to Franklin County OH; no income/asset tests, no poverty spend-down; one-stop shop entry with partner network delivery; levy-funded continuous since 1993

## Program Details

### PASSPORT


**Eligibility:**
- Age: 60+
- Income: Monthly income limit equivalent to 300% of the Federal Benefit Rate (FBR), which adjusts annually. In 2025: up to $2,901 per applicant regardless of marital status (each spouse assessed individually if both applying). In 2024: typically no more than $2,829 for one person (or $2,250 gross income or less, or qualify via Qualified Income Trust). Must be financially eligible for Medicaid institutional care.[2][4][6]
- Assets: Countable assets: $2,000 for a single individual; up to $32,828 for married couples (2024). Excludes primary home (if applicant lives there or intends to return with home equity ≤$730,000 in 2025; spouse or dependent child lives there), one car, and certain other exempt items. Other countable resources include savings, cash, bank accounts.[2][4][5][6]
- Ohio resident
- Require Nursing Facility Level of Care (NFLOC), determined via Adult Comprehensive Assessment Tool (ACAT); needs assistance with ≥2 Activities of Daily Living (ADLs: bathing, grooming, toileting, dressing, eating, mobility) or Instrumental ADLs
- Able to remain safely at home with services and physician consent
- Medicaid eligible (or become eligible)
- At risk of nursing home placement; needs exceed other community resources

**Benefits:** In-home long-term services and supports including: personal care assistance, home delivered meals, skilled nursing visits, transportation to medical appointments, homemaking/housework, case management, respite care, emergency response services, adult health center services, structured family caregiving support. Package developed by case manager from local providers; also includes Medicaid card for medications/health care. No fixed dollar amounts or hours specified; tailored to needs.[3][5][7][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) for assessment (find via Ohio Department of Aging)
- Phone pre-admission screening via Ohio Department of Aging
- Complete PASSPORT application submitted to Ohio Department of Aging or local AAA

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary regionally

**Watch out for:**
- Must be 60+ (some sources note 65+ or 60-64 for disabled, but consensus is 60+); not for under 60
- Income/assets based on Medicaid institutional rules; spousal protections apply but each assessed individually
- Physician approval required for home safety; needs must exceed other community services
- Countable assets strictly $2,000 individual (exemptions narrow)
- Tailored services, not fixed amounts; potential regional provider differences
- Medicaid eligibility mandatory (may need to spend down or use trust)

**Data shape:** Administered statewide via local Area Agencies on Aging with regional providers/case managers; eligibility ties to Medicaid institutional care levels (income/assets); benefits are customized service packages based on NFLOC assessment, no fixed dollar/hour caps; annual FBR adjustments affect limits

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ohio.gov/passport

---

### Ohio Medicaid


**Eligibility:**
- Age: 65+
- Income: {"description":"Income limits vary by program type and marital status. For 2026, the most common program (Nursing Home Medicaid for single applicants) has a monthly income limit of $2,982[4][7]. For married couples where both spouses are applying, limits differ. For married couples where only one spouse is applying, the non-applicant spouse's income is not counted toward the applicant's limit, but the applicant must contribute most of their income to the state, keeping only $75/month as a personal needs allowance plus Medicare premiums and any spousal support allowance[3].","single_nursing_home_2026":"$2,982/month[4][7]","note":"Income limits are updated annually and vary by program (Nursing Home Medicaid, HCBS Waivers, ABD Medicaid)[3][4]"}
- Assets: {"single_nursing_home_2026":"$2,000[4]","description":"Countable assets must fall below specific thresholds. The search results do not provide a comprehensive list of what counts as exempt vs. countable assets, but indicate that certain assets are exempt from the calculation[2].","note":"Asset limits vary by program type and marital status[3]"}
- Must be a United States citizen or meet Medicaid non-citizen requirements[6]
- Must be an Ohio resident[2][6]
- Must have or obtain a Social Security number[6]
- Must meet functional/medical requirements: require Nursing Home Level of Care (NFLOC), defined as needing full-time care normally associated with a nursing home[3]
- Nursing Home Level of Care requires either intermediate care (assistance with 2 Activities of Daily Living, or 1 ADL plus medication administration; skilled nursing/rehabilitation services; or 24-hour support due to cognitive impairment) OR skilled care (skilled nursing 7 days/week, skilled rehabilitation 5 days/week, or unstable medical condition)[1]

**Benefits:** Long-term care services including nursing home care, assisted living facility care, home and community-based services (HCBS), and non-medical services in home or adult day care settings. Also covers basic healthcare (physician visits, prescription medication, emergency room visits, short-term hospital stays) for ABD Medicaid recipients[1][3][8]
- Varies by: program_type

**How to apply:**
- In-person: Local county Job and Family Services office[6]
- Phone: Contact local county Job and Family Services office (specific numbers not provided in search results)
- Mail: Contact local county Job and Family Services office for mailing procedures (specific addresses not provided in search results)
- Online: Ohio Department of Medicaid website (specific URL not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Ohio Medicaid for nursing homes is an entitlement program, meaning all who meet eligibility requirements receive coverage—but you must actually meet all requirements (financial, functional, and citizenship)[1]
- Married couples have complex rules: if both apply, both must meet income/asset limits; if only one applies, the non-applicant spouse's income doesn't count toward the applicant's limit, but the applicant must give most of their income to the state[3]
- Functional requirements are strict: applicants must demonstrate they need Nursing Home Level of Care through state assessment and healthcare provider reports, not just self-report[3]
- Asset limits are very low ($2,000 for single applicants in 2026)—many seniors may need to spend down assets before qualifying[4]
- Income limits are also low ($2,982/month for single applicants in 2026)—some seniors over these limits may still qualify through alternative pathways, but this requires additional planning[4]
- The search results note that eligibility requirements change annually and vary significantly by program type (Nursing Home Medicaid vs. HCBS Waivers vs. ABD Medicaid), so families must verify which program applies to their situation[3][4]
- Even if unsure about qualification, applicants should apply—the state encourages applications even when eligibility is uncertain[6]

**Data shape:** Ohio Medicaid is actually a suite of programs with different eligibility criteria, benefits, and functional requirements. The most common for seniors seeking long-term care is Nursing Home Medicaid, but HCBS Waivers and ABD Medicaid serve different populations. Income and asset limits are updated annually (effective January 1 for most limits)[4][7]. Eligibility varies significantly by marital status and whether spouses are both applying. Functional requirements (Nursing Home Level of Care) are determined through state assessment, not just income/assets. The program is statewide but administered through county-level offices, which may create regional processing variations not detailed in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** medicaid.ohio.gov[6] and aging.ohio.gov/medicaid[9]

---

### PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No income test for program eligibility. However, if seeking Medicaid assistance to pay for PACE, must qualify under institutional financial eligibility standards. For most states in 2025, this means income under 300% of Federal Benefit Rate ($2,901/month) and assets of $2,000 or less (excluding primary home). Ohio-specific Medicaid thresholds should be verified at Ohio Benefits portal.[1][3][4]
- Assets: No asset test for PACE program eligibility itself. If using Medicaid to pay: $2,000 or less in countable assets (primary home is exempt).[3]
- Reside within a PACE organization's service area[1]
- Certified by the state as meeting nursing home level of care (intermediate or skilled level of care)[1][2][3]
- Able to live safely in the community with PACE support at time of enrollment[2][5][6]
- Reside in a non-institutional setting (house, apartment) at enrollment[1]
- Cannot be simultaneously enrolled in: Medicaid managed-care programs (other than PACE), Medicaid waiver programs (PASSPORT, assisted living, Ohio home care, mycare Ohio), Medicare Advantage (Part C) plans, Medicare prepayment plans, Medicare prescription drug plans, hospice services, or nursing facilities covered by Medicaid[1][2]
- Must be willing to receive all care from PACE program providers[4]

**Benefits:** All-inclusive care model covering everything the person needs — specific services not itemized in search results, but described as comprehensive home and community-based care for nursing home-eligible individuals[8]
- Varies by: not_applicable — program is all-inclusive; specific service mix determined by individual care plan

**How to apply:**
- Contact PACE organization directly in your service area
- Visit Ohio Benefits portal to determine Medicaid eligibility (if applicable)
- In-person at PACE site locations
- Phone contact with local PACE provider

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- PACE is NOT available everywhere in Ohio — you must live in a PACE organization's service area. This is the most common disqualifier.[2][5]
- You cannot be in ANY other Medicaid managed-care program, Medicaid waiver program, or Medicare Advantage plan while in PACE. If currently enrolled in these, you must disenroll.[1]
- PACE becomes your SOLE source of services for Medicare and Medicaid benefits — you cannot use other providers for covered services.[5]
- No income test exists for PACE eligibility itself, but if you need Medicaid to pay for PACE, you must meet Medicaid's institutional financial eligibility standards, which are strict ($2,000 asset limit).[3][4]
- You must be certified by your state as needing nursing home-level care — this is not self-assessed and requires professional evaluation.[2][6]
- You can pay privately for PACE without Medicaid, but this is uncommon and expensive.[4]
- Enrollment is voluntary and you can leave at any time, but PACE must be your primary care source while enrolled.[5]
- Average PACE participant is 76 years old with multiple complex conditions — the program is designed for high-need elderly, not moderately healthy seniors.[2]

**Data shape:** PACE is a geographically restricted program with no income test for eligibility but strict Medicaid financial limits if seeking payment assistance. The program is all-inclusive (not itemized by service type), and enrollment requires disenrollment from competing programs. Availability varies significantly by Ohio region based on PACE organization service areas. The primary barrier to eligibility is geographic availability, not financial or medical criteria.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ohio.gov/PACE and Ohio Administrative Code Rule 173-50-02

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Ohio follows federal standards with income limits updated annually (effective April) based on Federal Poverty Level (FPL). For 2025/2026 (most recent available): QMB ≤100% FPL (~$1,325/month single, $1,783/month couple); SLMB 100-120% FPL (~$1,526-$1,783/month single, $2,064-$2,400/month couple); QI 120-135% FPL (~$1,715-$1,781/month single, $2,320-$2,400/month couple). Limits apply to countable monthly income after standard disregards ($20 general + $65 earned + half remaining earned income). No full household size table beyond single/couple in sources; higher for larger households per FPL multipliers. Must be eligible for Medicare Part A (even if not enrolled).[1][2][3][5][6][7][10]
- Assets: Resource limits: $9,430 single / $14,130 couple (2025 figures; some sources cite $9,660/$14,470). Countable resources include bank accounts, stocks (beyond exemptions). Exempt: primary home, one vehicle, household items, wedding/engagement rings, burial plots, up to $1,500 burial expenses, life insurance < $1,500 cash value, Native American settlement payments/food stamps. Ohio may align with federal or have no asset limit for QI (varies by state).[1][2][3][5]
- Entitled to or eligible for Medicare Part A and enrolled in Part B.
- U.S. citizen or qualified immigrant.
- Ohio resident.
- Have or obtain Social Security number.
- Not eligible for full Medicaid (QI specifically excludes Medicaid-eligible).

**Benefits:** **QMB:** Pays Medicare Part A premium (if applicable), Part B premium ($185/month 2025), annual deductible, coinsurance/copayments/deductibles for Medicare-covered services (acts like Medigap; no out-of-pocket for participating providers). **SLMB:** Pays Part B premium + retroactive up to 3 months. **QI:** Pays Part B premium only (limited funding, priority re-enrollment). No estate recovery.[5][7]
- Varies by: program_tier

**How to apply:**
- Contact Ohio Department of Medicaid (ODM) or local County Job and Family Services (JFS) office.
- Phone: Ohio Medicaid at 1-800-324-8680 or local JFS (find via proseniors.org or ODM site).
- Online: Ohio Benefits portal (benefits.ohio.gov) or JFS county sites.
- Mail/In-person: Local County JFS office (search 'Ohio [county] JFS').
- Request application from state Medicaid agency.

**Timeline:** QMB: Effective 1st of month after eligibility determination (up to 45 days). SLMB/QI: Month of application if eligible; retroactive up to 3 months prior (must meet criteria each month).[1][5]
**Waitlist:** QI has limited funding: first-come first-served with priority for prior-year enrollees; possible waitlist.[4][6]

**Watch out for:**
- Income disregards often missed (e.g., $20 + $65 + half wages can qualify higher gross income).
- QI funding limited—reapply annually, priority for renewals but possible denial if funds exhausted.
- No retro for QMB (unlike SLMB/QI); apply early.
- Providers can't bill QMB enrollees for Medicare-covered services (but some miss this).
- Asset exemptions key—home/car not counted.
- Ohio-specific: Not subject to estate recovery; check county JFS for exact forms/limits.
- Limits update yearly (April for income); use 2025 figures as proxy for 2026.

**Data shape:** Tiered by program (QMB/SLMB/QI) with escalating income thresholds; single/couple focus (FPL-scaled for households); statewide uniform but county-administered; QI capped funding/priority re-enrollment; no age min (Medicare-tied, typically 65+).

**Source:** https://insurance.ohio.gov/consumers/medicare/msp and https://medicaid.ohio.gov (Ohio Dept of Medicaid)

---

### Ohio SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For seniors (60+), only the **net income test** applies. Gross monthly income limits (130% FPL, effective Oct 1, 2025–Sept 30, 2026) are approximately $15,060/year ($1,255/month) for 1 person or $20,440/year ($1,703/month) for 2 people. Net income is calculated by subtracting standard deductions (20% of gross), shelter costs (rent/mortgage/utilities exceeding $712 for elderly/disabled), and excess medical expenses over $35/month for seniors. Full table varies by household size; use Ohio JFS pre-screener for exacts[1][3][6].
- Assets: Households with elderly (60+) or disabled members have a $3,250 countable asset limit (higher than $2,750 standard). Countable: cash, bank accounts, stocks. Exempt: primary home, one vehicle, household goods, retirement accounts, life insurance, personal property[7][8].
- U.S. citizen or qualified non-citizen (2025 changes restrict some migrants)[3][2]
- Reside in Ohio
- Work requirements apply ages 55-64 (20 hours/week work/volunteer/training) unless exempt (65+ fully exempt from ABAWD rules, but 55-64 may need proof if no other exemption like disability/caregiving)[2][5]
- Household includes those who buy/prepare food together[1]

**Benefits:** Monthly EBT card for groceries (no cash). Minimum $23/month; full benefit calculated as max allotment minus 30% of net income (e.g., 2-person elderly household with $1,200 gross may get ~$415/month after deductions). Max allotments: ~$291 (1-person), $546 (2-person) in contiguous states[1][3][7]. Seniors often qualify for higher due to medical/shelter deductions.
- Varies by: household_size

**How to apply:**
- Online: benefits.ohio.gov/apply or Ohio Benefits portal[8]
- Phone: 866-663-3225 (Ohio JFS helpline)
- Mail/In-person: Local county Job & Family Services (JFS) office (find via benefits.ohio.gov/counties)
- Download form: JFS 07273 (Application for SNAP)

**Timeline:** Up to 30 days standard; expedited (7 days) if income < $150/month and assets < $100, or homeless[1]

**Watch out for:**
- Seniors 60+ skip gross income test—only net counts, but Social Security/pensions fully included[1][6]
- Ages 55-64 face new 2025 work rules (20 hrs/week) unless exempt; 65+ exempt[2][5]
- Low participation: ~50% eligible seniors don't apply[1][4]
- Medical expenses >$35/month (e.g., Medicare premiums, prescriptions) deduct significantly[6][7]
- Own home/car? Still eligible—exempt assets[1][7]
- Household must include food-sharers, even non-relatives[1]

**Data shape:** Seniors 60+ use simplified net income test only (no gross); higher $3,250 asset limit; benefits scale by household size with big deductions for shelter/medical; new 2025 work rules hit 55-64 hard; statewide but county-administered

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://benefits.ohio.gov/SNAP

---

### Home Energy Assistance Program (HEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross household income at or below 175% of Federal Poverty Guidelines (for households of 8 or fewer). For households >9, at or below 60% State Median Income (SMI). Income reported for past 30 days (12 months preferred), excluding wages/salary of dependent minors under 18. For July 2025-May 2026: Example for family of 4 up to $52,500 (older data); for 9 members $96,944 annual/$7,968 monthly; 10: $99,007/$8,137.56; 11: $101,069/$8,307.04; 12: $103,132/$8,476.60. Use official calculator for full table by household size[1][2][3][5].
- Assets: No asset limits mentioned; eligibility based on income only[1][2][3].
- Proof of U.S. citizenship or legal residency for all household members
- Both homeowners and renters eligible
- Priority factors (not requirements): household with child ≤5, member ≥60, disabled member, PIPP enrollment, main heating source, location[2]

**Benefits:** One-time payment applied directly to utility bill or bulk fuel bill. Average ~$316 per household. Exact amount varies; post-pandemic levels lower for 2025[3][5][6].
- Varies by: household_size|priority_tier|region|fuel_source|PIPP_enrollment

**How to apply:**
- Online: Ohio Department Services Agency website (Energy Assistance Application)[1][3][4][5]
- Phone: (800) 282-0880; Hearing impaired: 711[4]. Local providers e.g. Cuyahoga: (216) 480-HEAP (4327)[7]
- Mail: Energy Assistance Programs, P.O. Box 1240, Columbus, Ohio 43216[4]
- In-person/phone: Local Energy Assistance Provider (find via development.ohio.gov)[3][4]

**Timeline:** Allow 90 days for regular HEAP applications[3]

**Watch out for:**
- Must apply for HEAP before other programs like AEP Neighbor to Neighbor[1]
- Income excludes only dependent minors' wages under 18; report all other gross income[2][3]
- Benefits lower post-pandemic (2025); varies significantly by factors like PIPP (75% reduction if enrolled)[3][6]
- 90-day processing; ensure complete/signed app with all docs[3]
- Priority for elderly/disabled/young children but not required for eligibility[2]

**Data shape:** Income caps at 175% FPL (household size table required via official tool); benefits highly variable by income, fuel, region, PIPP; local agency delivery statewide; annual re-verification; 30/90/12-month income proof flexibility

**Source:** https://development.ohio.gov/individual/energy-assistance/1-home-energy-assistance-program

---

### Home Weatherization Assistance Program (HWAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the federal poverty guidelines (2025 guidelines): 1: $31,300; 2: $42,300; 3: $53,300; 4: $64,300; 5: $75,300; 6: $86,300; 7: $97,300; 8: $108,300. For households over 8, add $11,000 per additional member.[2][3]
- Assets: No asset limits mentioned.[1][2]
- Automatic eligibility if received assistance in the last 12 months from SSI, TANF, or HEAP (excluding Emergency HEAP).[1][2][3]
- Priority to those over age 60, with disabilities, children in the home, or high energy usage/burden.[1][2][3]

**Benefits:** Free services including home energy inspection, attic/wall/floor insulation, air sealing/leakage reduction, duct sealing, heating system repairs/replacements, venting exhaust equipment, health/safety inspections, emergency repairs, and energy-efficient appliances. Services determined by inspection.[1][2][5][6][7]
- Varies by: priority_tier

**How to apply:**
- Contact local Energy Assistance Provider/Community Action Agency by county.[2][3]
- Call 1-800-282-0880.[3]
- Call 1-800-848-1300.[4][6]
- HEAP applicants: indicate interest online at www.energyhelp.ohio.gov.[3]
- Regional examples: IMPACT (Franklin County) interest form at https://www.impactca.org/hwap-intake-form or call 614-252-2799; NOCAC at 419-784-5393 or kfeeney@nocac.org; MORPC (Franklin) at 1-614-621-1171.[5][6][7]

**Timeline:** Not specified.
**Waitlist:** Eligible applicants served in order received per priority ranking.[6]

**Watch out for:**
- Must submit application even if automatically income-eligible via SSI/TANF/HEAP.[2]
- Priority-based service order, not first-come for all.[1][6]
- Renters eligible but require landlord/property manager contact info.[5]
- Services free for single-family homes; multi-family may need additional arrangements.[5]
- Homeowners and renters/mobile homes both eligible, but inspection determines exact services.[1][5]

**Data shape:** Income at 200% FPG with table scaling by household size and +$11k per extra member; priority tiers drive service order; county-based local providers with unique contacts/forms; automatic eligibility from specific aid programs.

**Source:** https://development.ohio.gov/individual/energy-assistance/6-home-weatherization-assistance-program[2]

---

### Ohio Senior Health Insurance Information Program (OSHIIP/SHIP)


**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries and their family members.[1][2][4][7]
- Assets: No asset limits or tests apply.[1][4]
- Must be a Medicare beneficiary or family member of one.[2][4][7]

**Benefits:** Free, objective, personalized one-on-one health insurance counseling; education on Medicare, Medicare Part D, Medicare Advantage, Medicare supplement insurance, long-term care insurance, and other health insurance matters; enrollment assistance, appeals, complaints, explanation of benefits; hotline support, speaker's bureau, trained volunteers.[1][2][3][4][6]

**How to apply:**
- Phone: Toll-free hotline 800-686-1578 (7:30am-5pm); Local TDD: 614-644-3745[1][4][5][9]
- Email: oshiipmail@insurance.ohio.gov or christina.reeg@insurance.ohio.gov[1][5][7]
- Website: https://insurance.ohio.gov/consumers/medicare/01-oshiip[1][4][5]
- In-person: Local OSHIIP coordinators by county/region or Ohio Department of Insurance, 50 West Town Street, 3rd Floor, Suite 300, Columbus OH 43215; contact hotline for local options[1][2][3][7][9]
- No specific application form required; counseling provided upon contact[4][7]

**Timeline:** Immediate counseling via phone or in-person; no formal processing as it's not an entitlement program[1][4]

**Watch out for:**
- Not a financial assistance or healthcare service program—only provides free counseling and education, no direct payments or medical care[2][4][6]
- People often confuse it with Medicare benefits or payment programs; it's purely informational/advocacy[4]
- Local availability varies; always start with statewide hotline if local contact unavailable[9]
- No enrollment into Medicare itself—assists with understanding/enrollment processes[3][4]

**Data shape:** no income/asset test; counseling-based SHIP program with regional volunteer coordinators; open access without application barriers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://insurance.ohio.gov/consumers/medicare/01-oshiip

---

### Meals on Wheels (Home-Delivered Meals)


**Eligibility:**
- Age: 60+
- Income: No statewide income limits specified; some providers like Franklin County use a sliding fee scale based on monthly income with possible co-pays. No specific dollar amounts or household size tables provided across sources[7].
- Assets: No asset limits or exemptions mentioned in any sources.
- Unable to prepare own meals due to physical, cognitive, or emotional difficulties[1][4].
- Homebound or unable to participate in congregate meals[1][2][3].
- Lacks other meal support in home or community[1].
- Must reside in the service area of the local provider[2][6].
- Spouse of eligible person (regardless of age) if living in the home[1].
- Under 60 if disabled and residing in a senior facility receiving the program[1].
- Some areas require food insecurity identification[6].

**Benefits:** Nutritious home-delivered meals (typically 1 per day, up to 14 per week for noon/evening in some waiver programs); may include companionship and safety checks. Therapeutic meals (e.g., diabetic) available in select areas with prescription. Self-pay or funder-supported options exist[1][4][6][9].
- Varies by: region

**How to apply:**
- Contact local provider or Area Agency on Aging by phone for home assessment appointment[1][3][4][6][7].
- Online enrollment in some areas, e.g., Franklin County at unlinked form or LifeCare Alliance at www.lifecarealliance.org/referral[4][7].
- Email referrals, e.g., hdm@lifecarealliance.org or referrals@vantageaging.org[4][6].
- Phone examples: Fayette County (call Director of Nutrition), LifeCare Alliance 614-278-3152 (opt 2), Franklin County Senior Options (614) 525-6200, VANTAGE 330-832-7220[1][4][6][7].
- In-person home assessment required by many providers[1].

**Timeline:** Not specified; requires home assessment appointment, no timelines given.
**Waitlist:** Not mentioned in sources.

**Watch out for:**
- Not centralized—must contact specific local provider/Area Agency on Aging for your county; eligibility/processes vary widely[1][3][6].
- Often requires in-home assessment, not just phone application[1].
- May involve co-pays, self-pay, or funding checks despite no strict income limits[4][6][7].
- Spouses/under-60 eligibility is narrow (e.g., living with eligible senior or in senior facility)[1].
- Availability tied to local capacity; check service area[2].

**Data shape:** Decentralized by county/provider with no uniform statewide income/assets test or application; local AAAs handle via ODA guidelines, leading to variations in funding, assessments, and therapeutic options.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ohio.gov (Ohio Department of Aging; program follows ODA rules per local providers[1])

---

### National Family Caregiver Support Program (NFCSP)


**Eligibility:**
- Age: 55+
- Income: No specific income limits mentioned in Ohio NFCSP sources; services are generally available without financial thresholds, though some local providers may prioritize based on need[1][2][7].
- Assets: No asset limits specified for NFCSP; contrasts with programs like PASSPORT which has $2,000 resource limit (home and car exempt)[3].
- Caregiver must be unpaid family member or informal caregiver
- Caring for individual aged 60+
- Caring for individual of any age with Alzheimer’s or related disorders
- Older relative (55+) caring for child under 18 (not parent)
- Relative (55+, including parents) caring for adult 18-59 with disability
- Reside in the service area of the local Area Agency on Aging (AAA)
- Demonstrated need for in-home care assistance (varies by local AAA)[1][2][7]

**Benefits:** Five core services: 1) Information about available services; 2) Assistance gaining access to services; 3) Individual counseling, support groups, caregiver training; 4) Respite care; 5) Supplemental services on limited basis (e.g., short-term services once per calendar year in some areas)[1][2][7]. No fixed dollar amounts or hours specified statewide; short-term respite and services vary locally.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or in-person
- Examples: Franklin County Office on Aging (Franklin-specific, no direct phone listed); WRAAA (Western Reserve Area Agency on Aging): 216.586.3441 or 800.626.7277[1][7]
- Ohio Department of Aging directs to local AAA: aging.ohio.gov[8]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; services described as short-term and accessible once per year in some areas[1]

**Watch out for:**
- Not a cash payment or paid caregiver program; provides support services only, not compensation[2][6]
- Must contact local AAA, not state directly; no centralized application[8]
- Short-term services limited (e.g., once per calendar year in Franklin County)[1]
- Excludes paid caregivers and spouses/legal guardians in some contexts[6]
- Often confused with Medicaid programs like PASSPORT (which pays family caregivers but has strict income/asset limits)[3][6]

**Data shape:** Administered via 12 local AAAs with service area residency required; no statewide income/asset test; benefits are non-financial services varying by local provider capacity and demonstrated need

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ohio.gov/care-and-living/caregiver-support[8]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level[3][5]. The search results do not provide specific dollar amounts by household size, so applicants must contact their local SCSEP provider to determine their exact threshold based on current federal poverty guidelines.
- Assets: Not specified in available search results.
- Must be unemployed[3][5]
- Must be an Ohio resident (program available in all 88 Ohio counties)[2]
- Priority given to: veterans and spouses of veterans, individuals over 65, minorities, those with disabilities, those with low literacy skills or limited English proficiency, those in rural areas, those experiencing homelessness or at risk of homelessness, those with low employment prospects, or those who have exhausted American Job Center services[3]

**Benefits:** Paid community service training at an average of 20 hours per week[3][5]. Participants earn the highest of federal, state, or local minimum wage[3][5]. Most participants receive training for approximately six months before job placement assistance[5]. Program provides no-cost services including paid training assignments, job search assistance, referral to needed services, and professional job placement support[4][8].
- Varies by: fixed

**How to apply:**
- In-person at local SCSEP provider offices
- Phone contact with local SCSEP provider
- Visit Ohio Department of Aging website to identify the SCSEP provider serving your county[2]

**Timeline:** Not specified in search results.
**Waitlist:** Not specified in search results. Note: The program is experiencing a period of transition due to changes and delays in federal funding[5].

**Watch out for:**
- Income limit is strict: 125% of federal poverty level, which is significantly below median income for most households[3][5]. Families must verify current dollar thresholds with their provider.
- Program requires unemployment status — participants cannot be currently employed[3][5].
- This is a work-based training program, not a direct cash assistance program. Participants earn minimum wage for 20 hours per week, not a lump sum or ongoing stipend.
- The program is experiencing federal funding delays and transitions as of the search results[5], which may affect availability or processing times.
- Training is typically part-time (20 hours/week average), not full-time employment[3][5].
- Placement is to 'unsubsidized' employment, meaning the program helps transition participants to regular jobs, not permanent SCSEP positions[1][3].
- Priority enrollment is given to specific populations (veterans, over 65, minorities, etc.)[3], which may affect wait times for non-priority applicants.
- No specific information provided about asset limits, which may be a factor in eligibility determination.

**Data shape:** SCSEP is a statewide program available in all 88 Ohio counties but administered by multiple regional providers, so the application process and local contact information vary by provider and county. Income eligibility is based on a percentage of federal poverty level (125%), which scales by household size but specific dollar amounts are not provided in search results. Benefits are fixed (20 hours/week at minimum wage) rather than tiered. The program emphasizes priority enrollment for specific populations rather than different benefit levels. Federal funding delays noted in 2026 may affect program availability.

**Source:** https://aging.ohio.gov/care-and-living/staying-active/staying-active-catalog/senior-community-services-employment-program and https://www.dol.gov/agencies/eta/seniors

---

### Legal Assistance Developer Program (LADP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not means-tested; no income or asset limits or disclosure required for persons 60+ to receive legal services[1][2][3]
- Assets: No asset limits; financial circumstances may only be asked during provision of legal advice or to identify other resources[1][3]
- Greatest economic need (income at or below poverty line, often 125%-200% FPL) and greatest social need (e.g., disabilities, isolation, language barriers) are targeting priorities due to limited resources, but do not deny services[2]
- Priorities under 42 U.S.C. 3027(a)(11)(E) and 45 C.F.R. 1321.93(e)(2), focusing on income security, health/insurance, elder abuse, housing, etc.[1][3]

**Benefits:** Legal advice, counseling, or representation by Ohio-licensed attorneys on economic/social needs (e.g., income security, health care financing, elder abuse prevention, housing, consumer fraud); excludes wills, employment, criminal defense, picketing[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) for legal services; statewide coordination via Ohio Department of Aging (ODA)'s Legal Assistance Developer[1][3]
- Ohio Legal Help hub: 1-866-LAW-OHIO (1-866-529-6446)[7]
- Regional providers e.g., Legal Aid of Western Ohio (32 counties)[9]
- Ohio Legal Help online directory for local organizations[7]

**Timeline:** Not specified in sources
**Waitlist:** Resources limited, targeting priorities may create effective waitlists[2]

**Watch out for:**
- Not means-tested but prioritizes greatest economic/social need—low-income/isolation get first access[2]
- Financial questions only for advice/resources, not eligibility screening[1][3]
- Excludes wills, criminal defense, employment, activism[3]
- Must be Ohio-licensed attorney; coordinate with private bar pro bono[1][3]
- Limited OAA funds target specific issues like elder rights, not all legal needs[2][5]

**Data shape:** State Legal Assistance Developer (LAD) coordinates statewide OAA Title III-B legal services via AAAs; non-means-tested for 60+ but priority-tiered; regional AAA delivery with no fixed dollar/hour limits

**Source:** https://aging.ohio.gov (ODA); Rule 173-3-06.10 Ohio Admin Code[1][3]

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident or recipient of long-term care services in Ohio, including nursing homes, assisted living, adult group homes, home care, or programs like MyCare Ohio.

**Benefits:** Advocacy to resolve complaints about quality of care and life; investigation of issues like abuse, neglect, poor hygiene, food quality, billing, admission/transfer/discharge problems, civil rights violations; assistance with care planning, Medicare/Medicaid questions, linking to services, provider selection resources, and ensuring person-centered care; provided confidentially by trained staff and volunteers.

**How to apply:**
- Phone: 1-800-282-1206 (statewide hotline)
- Local regional office via https://aging.ohio.gov/ombudsman (find your local ombudsman)
- In-person or contact through 12 regional offices serving all 88 counties

**Timeline:** Immediate response for complaints; investigations begin promptly upon contact with consent.

**Watch out for:**
- Not a financial aid or direct service program—purely advocacy and complaint resolution; requires resident consent for investigations (or specific conditions if incapacitated); anyone can contact on behalf of resident but ombudsman prioritizes resident's wishes; not for emergencies (call 911); often confused with programs like PASSPORT which have eligibility tests.

**Data shape:** no income/asset/age test—universal access for long-term care recipients; regionally delivered statewide via 12 offices and 250+ staff/volunteers; complaint-driven, not application-based enrollment.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ohio.gov/ombudsman

---

### Golden Buckeye Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 or older (primary category); also 18-59 with disability+
- Must be an Ohio resident[1][4]
- For ages 18-59: must have a disability as defined by Social Security[7]
- Disability must be permanent and total[3]

**Benefits:** Discounts, waived fees, free products, and other savings at participating businesses. Cardholders have saved an estimated $2 billion collectively since 1976. Program is honored at approximately 20,000 businesses statewide[6][8]
- Varies by: not_applicable — benefits depend on individual merchant participation, not program tier

**How to apply:**
- In-person at sign-up sites (most public libraries and senior centers)[2][4]
- Online form for age 60+ at Ohio Department of Aging website (for replacement cards or if recently turned 60)[4]
- No phone or mail application available[6]

**Timeline:** Not specified in available sources

**Watch out for:**
- Automatic enrollment at age 60 has ended: As of the current guidance, cards are no longer automatically mailed to all Ohioans when they turn 60[4]. Residents must now apply in-person or use the online form.
- Disability applicants must apply in-person: Unlike age 60+ applicants who can use an online form, people ages 18-59 with disabilities must apply at a sign-up site[4].
- Strict disability documentation requirements: Only specific documents are accepted (Medicare card, SSI/SSDI paperwork, or official disability certification). Letters from physicians are explicitly not accepted[4].
- Medicare vs. Medicaid distinction: Applicants must provide a Medicare card, not Medicaid[4].
- Card is non-transferrable: Only the person whose name is on the card can use it[7].
- No online or phone application: Despite online form availability for age 60+, in-person verification is required for disability applicants and those without current ID[6].
- This is a discount program, not a service program: Golden Buckeye provides merchant discounts and savings, not direct services like healthcare, transportation, or meal delivery. Families expecting direct services may be disappointed.

**Data shape:** This program has no income or asset limits, making it universally accessible to eligible age/disability groups. The primary eligibility divide is age-based (60+) versus disability-based (18-59). Application method differs by category: age 60+ can use online form or in-person; disability applicants must apply in-person. Benefits are merchant-dependent rather than program-tiered. Recent policy change (end of automatic enrollment) is critical for families to understand.

**Source:** https://aging.ohio.gov/about-us/learn-about-golden-buckeye/

---

### Healthy Aging Grants

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Low-or-moderate income, at or below 300% of the Federal Poverty Guidelines (varies by county; example for Portage County: 1-person household ≤$3,645/month or $43,740/year; 2-person ≤$4,930/month or $59,160/year; 3-person ≤$6,215/month or $74,580/year; 4-person ≤$7,500/month or $90,000/year) or ≤65% of area median income for the county and household size[2][3][4].
- Ohio resident age 60+, priority to those disproportionately impacted by COVID-19 (e.g., unemployed, food/housing insecure, underserved communities)
- Reside in the applying county
- Demonstrate need (e.g., delinquent bills, food/housing/transportation insecurity)

**Benefits:** Home/community-based services addressing social determinants of health: food assistance (≥20% of funds), housing quality/affordability, transportation, nutrition, physical activity, health insurance enrollment, access to care; specific examples include bill payment, food/household supplies, home modifications, transportation to appointments[2][3][4].
- Varies by: region

**How to apply:**
- Contact local county Job and Family Services or Area Agency on Aging (e.g., Portage County JFS); in-person/mail with documents; no statewide direct application—counties administer and select providers[2][3]

**Timeline:** First-come, first-served; funds available until depleted (e.g., through June 30 in Portage County or project end 9/30/2024)[2][5]
**Waitlist:** None mentioned; limited by available funds per county

**Watch out for:**
- Not a direct-to-individual grant—families apply through county offices/providers, not state; funds one-time (10/1/2023–9/30/2024), deplete quickly (first-come-first-served); providers must be pre-approved nonprofits; no statewide uniform process/form—check county-specific details; priority to COVID-impacted, not all seniors qualify equally[1][2][3][5]

**Data shape:** County-administered with local variations in providers, application processes, and service focus; no direct state application for individuals; income test at 300% FPL or 65% AMI; funds to counties then sub-granted to providers

**Source:** https://aging.ohio.gov/care-and-living/healthy-aging

---

### Senior Citizen Tax Credit

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Modified adjusted gross income less exemptions is less than $100,000 for the tax year. Does not vary by household size; applies to the taxpayer's income after exemptions.[1]
- Assets: No asset limits.
- Received income from a qualified pension, profit-sharing, or retirement plan during the tax year.
- Income received was due to retirement.
- Retirement income is included in Ohio adjusted gross income.
- Retirement income deductible on Ohio Schedule of Adjustments (e.g., Social Security benefits, military retirement) does not qualify.
- Have not claimed the Ohio lump sum retirement credit before (for lump sum variant).[1]

**Benefits:** Non-refundable tax credit on qualifying retirement income; maximum amount up to $200 (varies based on income type and amount). Additional smaller credit may apply for those 65+.[5]
- Varies by: fixed

**How to apply:**
- File your Ohio state income tax return (Ohio IT 1040) for the current tax year.
- Phone: Contact Ohio Department of Taxation at 1-800-282-1780 for form guidance.[5]

**Timeline:** Processed with state income tax return; no specific timeline stated.

**Watch out for:**
- Only applies to retirement income included in Ohio AGI; excludes Social Security, military retirement, or other deductible retirement income.[1]
- Must not have previously claimed the lump sum retirement credit.[1]
- Non-refundable; only offsets tax liability, does not provide cash if no tax owed.
- Requires Box 2b 'Total Distribution' checked on 1099R for lump sum claims.[1][8]
- Frequently confused with Homestead Exemption (property tax reduction, separate income limits around $38,600-$41,000 depending on year).[2][3][4]

**Data shape:** State income tax credit claimed annually via tax return; strict requirement for qualifying retirement income types; fixed $100,000 income threshold regardless of household size; no asset test.

**Source:** https://tax.ohio.gov/individual/file-now/ohio-tax-credits-and-their-required-documentation

---

### Franklin County Senior Services Levy Programs (Senior Options)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned; program emphasizes no spend-down to poverty required. Services targeted at those needing help to maintain independence, often functionally impaired or with limited abilities.
- Assets: No asset limits specified; explicitly stated that participants are not required to spend down to poverty.
- Reside in Franklin County, Ohio

**Benefits:** Specific services include: Adult Day Care (health services, personal care, meals, activities, transportation, social work, therapies); Caregiver Relief (Respite Care) by trained individuals for 24-hour supervision needs; Case Management (ongoing assessments for service adequacy); Emergency Response Systems (home safety monitoring via electronic devices); Information & Referrals (resource info on community services); Medical Transportation (to facilities, including wheelchair); Personal Care (hygiene, grooming, mobility); Home Delivered Meals; Homemaker Services; Minor Home Repair. Also supports Home and Community Care, Customer Services Management, Safe Housing, Community Support, Outreach, Specialized Services.

**How to apply:**
- Online enrollment via https://www.franklincountyohio.gov/Resident-Services/Seniors/Senior-Options-Programs
- Phone: (614) 525-6200 weekdays 9AM-4:30PM ET (extended Thursdays to 7PM in some docs)

**Timeline:** Not specified

**Watch out for:**
- Funded solely by Franklin County Senior Services Levy (renewals e.g., 2023-2027); services via large provider network, not direct county provision; single-entry point but assessments often by COAAA; no new levy could shut down programs; targeted at independence maintenance, not all seniors automatically qualify without needs assessment; typical recipient female over 75 living alone

**Data shape:** county-restricted to Franklin County OH; no income/asset tests, no poverty spend-down; one-stop shop entry with partner network delivery; levy-funded continuous since 1993

**Source:** https://www.franklincountyohio.gov/Resident-Services/Seniors/Senior-Options-Programs

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| PASSPORT | benefit | state | deep |
| Ohio Medicaid | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Ohio SNAP (Supplemental Nutrition Assist | benefit | federal | deep |
| Home Energy Assistance Program (HEAP) | benefit | state | deep |
| Home Weatherization Assistance Program ( | benefit | federal | deep |
| Ohio Senior Health Insurance Information | resource | federal | simple |
| Meals on Wheels (Home-Delivered Meals) | benefit | federal | deep |
| National Family Caregiver Support Progra | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance Developer Program (LADP | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Golden Buckeye Program | resource | state | simple |
| Healthy Aging Grants | benefit | state | medium |
| Senior Citizen Tax Credit | benefit | state | medium |
| Franklin County Senior Services Levy Pro | benefit | local | medium |

**Types:** {"benefit":12,"resource":4,"employment":1}
**Scopes:** {"state":8,"local":2,"federal":7}
**Complexity:** {"deep":9,"simple":4,"medium":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/OH/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **program_type**: 1 programs
- **not_applicable — program is all-inclusive; specific service mix determined by individual care plan**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region|fuel_source|PIPP_enrollment**: 1 programs
- **not_applicable**: 3 programs
- **region**: 3 programs
- **fixed**: 2 programs
- **not_applicable — benefits depend on individual merchant participation, not program tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **PASSPORT**: Administered statewide via local Area Agencies on Aging with regional providers/case managers; eligibility ties to Medicaid institutional care levels (income/assets); benefits are customized service packages based on NFLOC assessment, no fixed dollar/hour caps; annual FBR adjustments affect limits
- **Ohio Medicaid**: Ohio Medicaid is actually a suite of programs with different eligibility criteria, benefits, and functional requirements. The most common for seniors seeking long-term care is Nursing Home Medicaid, but HCBS Waivers and ABD Medicaid serve different populations. Income and asset limits are updated annually (effective January 1 for most limits)[4][7]. Eligibility varies significantly by marital status and whether spouses are both applying. Functional requirements (Nursing Home Level of Care) are determined through state assessment, not just income/assets. The program is statewide but administered through county-level offices, which may create regional processing variations not detailed in available sources.
- **PACE (Program of All-Inclusive Care for the Elderly)**: PACE is a geographically restricted program with no income test for eligibility but strict Medicaid financial limits if seeking payment assistance. The program is all-inclusive (not itemized by service type), and enrollment requires disenrollment from competing programs. Availability varies significantly by Ohio region based on PACE organization service areas. The primary barrier to eligibility is geographic availability, not financial or medical criteria.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with escalating income thresholds; single/couple focus (FPL-scaled for households); statewide uniform but county-administered; QI capped funding/priority re-enrollment; no age min (Medicare-tied, typically 65+).
- **Ohio SNAP (Supplemental Nutrition Assistance Program)**: Seniors 60+ use simplified net income test only (no gross); higher $3,250 asset limit; benefits scale by household size with big deductions for shelter/medical; new 2025 work rules hit 55-64 hard; statewide but county-administered
- **Home Energy Assistance Program (HEAP)**: Income caps at 175% FPL (household size table required via official tool); benefits highly variable by income, fuel, region, PIPP; local agency delivery statewide; annual re-verification; 30/90/12-month income proof flexibility
- **Home Weatherization Assistance Program (HWAP)**: Income at 200% FPG with table scaling by household size and +$11k per extra member; priority tiers drive service order; county-based local providers with unique contacts/forms; automatic eligibility from specific aid programs.
- **Ohio Senior Health Insurance Information Program (OSHIIP/SHIP)**: no income/asset test; counseling-based SHIP program with regional volunteer coordinators; open access without application barriers
- **Meals on Wheels (Home-Delivered Meals)**: Decentralized by county/provider with no uniform statewide income/assets test or application; local AAAs handle via ODA guidelines, leading to variations in funding, assessments, and therapeutic options.
- **National Family Caregiver Support Program (NFCSP)**: Administered via 12 local AAAs with service area residency required; no statewide income/asset test; benefits are non-financial services varying by local provider capacity and demonstrated need
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a statewide program available in all 88 Ohio counties but administered by multiple regional providers, so the application process and local contact information vary by provider and county. Income eligibility is based on a percentage of federal poverty level (125%), which scales by household size but specific dollar amounts are not provided in search results. Benefits are fixed (20 hours/week at minimum wage) rather than tiered. The program emphasizes priority enrollment for specific populations rather than different benefit levels. Federal funding delays noted in 2026 may affect program availability.
- **Legal Assistance Developer Program (LADP)**: State Legal Assistance Developer (LAD) coordinates statewide OAA Title III-B legal services via AAAs; non-means-tested for 60+ but priority-tiered; regional AAA delivery with no fixed dollar/hour limits
- **Long-Term Care Ombudsman Program**: no income/asset/age test—universal access for long-term care recipients; regionally delivered statewide via 12 offices and 250+ staff/volunteers; complaint-driven, not application-based enrollment.
- **Golden Buckeye Program**: This program has no income or asset limits, making it universally accessible to eligible age/disability groups. The primary eligibility divide is age-based (60+) versus disability-based (18-59). Application method differs by category: age 60+ can use online form or in-person; disability applicants must apply in-person. Benefits are merchant-dependent rather than program-tiered. Recent policy change (end of automatic enrollment) is critical for families to understand.
- **Healthy Aging Grants**: County-administered with local variations in providers, application processes, and service focus; no direct state application for individuals; income test at 300% FPL or 65% AMI; funds to counties then sub-granted to providers
- **Senior Citizen Tax Credit**: State income tax credit claimed annually via tax return; strict requirement for qualifying retirement income types; fixed $100,000 income threshold regardless of household size; no asset test.
- **Franklin County Senior Services Levy Programs (Senior Options)**: county-restricted to Franklin County OH; no income/asset tests, no poverty spend-down; one-stop shop entry with partner network delivery; levy-funded continuous since 1993

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Ohio?
