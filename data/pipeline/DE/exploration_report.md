# Delaware Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.110 (22 calls, 1.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 20 |
| Programs deep-dived | 17 |
| New (not in our data) | 13 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |

## Program Types

- **service**: 6 programs
- **financial**: 6 programs
- **service|advocacy**: 1 programs
- **in_kind**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Delaware Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$994` → Source says `$1,350` ([source](https://www.medicare.gov/basics/costs/help/medicare-savings-programs))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, and copayments for Medicare-covered services and items. Also qualifies for Extra Help with prescription drugs (max $12.65 per drug in 2026)[5]. SLMB: Pays Medicare Part B premiums only; does not cover deductibles, coinsurance, or copayments (potential savings over $1,000/year)[1][4]. QI: Pays all or part of Medicare Part B premiums only; does not cover deductibles, coinsurance, or copayments[1][4]. All three programs also qualify beneficiaries for Extra Help with Medicare Part D prescription drug costs[2][5].` ([source](https://www.medicare.gov/basics/costs/help/medicare-savings-programs))
- **source_url**: Ours says `MISSING` → Source says `https://www.medicare.gov/basics/costs/help/medicare-savings-programs`

### Delaware LIHEAP

- **income_limit**: Ours says `$2820` → Source says `$3,278` ([source](https://www.dhss.delaware.gov/dhss/dss/liheap.html))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Regular heating: $100 min to $2,561 max; cooling: $1 min to $1,000 max; crisis: up to $10,000 max. Paid as one-time grant to utility or household. Average ~$553/year. Includes winter heating (Oct-Mar), year-round crisis aid, summer cooling flat benefit. Weatherization separate (insulation, repairs)[1][4][6].` ([source](https://www.dhss.delaware.gov/dhss/dss/liheap.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhss.delaware.gov/dhss/dss/liheap.html`

### Delaware Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care, caregiver training, counseling, support groups, supplemental services (e.g., assistive devices, home modifications). Not direct payment to caregivers; focuses on support to relieve family caregivers.` ([source](https://dhss.delaware.gov/dsaapd/faq_attendant2.html))
- **source_url**: Ours says `MISSING` → Source says `https://dhss.delaware.gov/dsaapd/faq_attendant2.html`

### Delaware Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigate and resolve complaints about care, rights violations, abuse/neglect (referred to specialists), mistreatment, or financial exploitation; inform residents/families of rights under federal/state law; provide information/referrals; conduct facility visits and annual assessments; advocate for quality of life improvements; supervised by paid staff and volunteers who visit 1-2 hours per month[2][4][5][6]` ([source](https://dhss.delaware.gov/dhss (primary state DHSS site)[2]))
- **source_url**: Ours says `MISSING` → Source says `https://dhss.delaware.gov/dhss (primary state DHSS site)[2]`

## New Programs (Not in Our Data)

- **Delaware Medicaid for the Elderly** — service ([source](https://www.dhss.delaware.gov/))
  - Shape notes: Delaware Medicaid for the elderly is split into two main programs: (1) Nursing Home Medicaid for institutional care and (2) Long-Term Care Community Services (LTCCS) for community-based care. Both have the same 2025 income limit ($2,417.50/month) but different asset limits and service delivery models. Regular ABD Medicaid is a separate program with lower income limits ($967/month) but covers basic healthcare. Income limits are indexed to 250% of SSI federal benefit rate and may change annually. Spousal asset and income treatment differs significantly depending on whether one or both spouses are applying. The program is statewide but LTCCS has geographic service area restrictions. Processing times are variable and not standardized.
- **Diamond State HCBS Waiver** — service ([source](https://dhss.delaware.gov/dmma (primary DHSS/DMMA site); https://www.medicaidlongtermcare.org/eligibility/delaware/[2]))
  - Shape notes: No separate elderly HCBS waiver; benefits via DSHP Plus LTCCS Program with NFLOC requirement and statewide Medicaid integration; limited slots historically led to waitlists; financials tied to ABD Medicaid with $2,000 single asset cap[6]
- **Delaware PACE** — service ([source](https://www.law.cornell.edu/regulations/delaware/16-Del-Admin-Code-SS-20000-20775 (Delaware Admin Code); https://www.dhss.delaware.gov/dmma/ (Delaware DMMA for providers)))
  - Shape notes: Limited to specific provider service areas (not statewide); no financial criteria for enrollment but Medicaid needed for free services; requires state-certified nursing facility level of care; private pay option with flat fee
- **Delaware Food First/SNAP** — financial ([source](https://www.dhss.delaware.gov/dss/foodstamps.html))
  - Shape notes: Expanded eligibility to 200% FPL gross income with no asset test for most; special net income path for elderly/disabled households; categorical eligibility for SSI/TANF/GA; benefits via EBT card scaling by household size, income, and deductions like medical costs.
- **Delaware Weatherization Assistance Program** — service ([source](https://dnrec.delaware.gov/climate-coastal-energy/sustainable-communities/weatherization/[1]))
  - Shape notes: Statewide fixed services via single contractor (ECA); income at 200% FPL with household size table; priority tiers by vulnerability (elderly/disabled/children); waitlist and annual reapplication due to funding limits.
- **Delaware Senior Medicare Patrol (SMP/SHIP)** — service|advocacy ([source](https://smp.dhss.delaware.gov/[6]))
  - Shape notes: no income/asset/age test beyond Medicare eligibility; service-based not financial; volunteer-driven outreach statewide via events/phone; often bundled with SHIP counseling[1][2][3][4]
- **Delaware Meals on Wheels** — in_kind ([source](https://mealsonwheelsde.org and regional provider websites))
  - Shape notes: Delaware Meals on Wheels operates as a decentralized network of regional providers rather than a single statewide program. Eligibility is uniform (age 60+, homebound, unable to cook/shop), but application processes, meal options, and service details vary significantly by county and provider. No income limits exist statewide, which is unusual and important for families to know. The program explicitly prioritizes reaching low-income seniors but does not restrict services based on income[3]. Non-elderly disabled adults have a narrow eligibility pathway requiring SSDI proof and co-residence with an eligible elderly person.
- **Delaware Senior Community Service Employment Program (SCSEP)** — employment ([source](https://laborfiles.delaware.gov/main/det/one-stop/FS-3_SenEmp.pdf (Delaware DOL flyer); https://www.nationalable.org/wp-content/uploads/2020/02/SCSEP_DelawareHandbook_013120.pdf (DE-specific handbook)))
  - Shape notes: Income at 125% FPL (varies by household size/year, no fixed table in sources); priority enrollment tiers; grantee/provider-based (National Able in DE, county offices); funding slots limit access
- **Delaware Prescription Assistance Program (DPAP)** — financial ([source](https://dhss.delaware.gov (DPAP application at https://dhss.delaware.gov/wp-content/uploads/sites/11/dss/pdf/dpapapplication.pdf); regulations at https://regulations.delaware.gov/AdminCode/title16/30000[4][6]))
  - Shape notes: Income test at 200% FPL or 40% drug costs; strict Medicare Part D mandate; no assets test; statewide but centralized in New Castle; fiscal year benefits cap per individual
- **Wilmington Senior Tax Assistance Program** — financial ([source](https://www.destatehousing.com/ (DSHA website for application and complete information)))
  - Shape notes: Emergency grant program restricted to Wilmington city homeowners 62+ at risk of foreclosure; high income threshold ($93,725) but requires proof of delinquency and imminent foreclosure.
- **SCAT – Senior Citizens Affordable Taxi** — service ([source](https://www.dartfirststate.com/Programs/ or https://www.dartfirststate.com/information/forms/index.shtml))
  - Shape notes: No income or asset tests; ticket-based discount system requiring photo ID and participating taxis; certification-focused eligibility; statewide but ID pickup limited to two offices
- **Over-60 Tuition Benefit** — financial ([source](https://delcode.delaware.gov/title14/c034/sc10/index.html (state law); https://www.continuingstudies.udel.edu/60-tuition-free-degree/ (UD); https://dtcc.smartcatalogiq.com/en/current/catalog/financial/senior-citizen-tuition-policy (DTCC)))
  - Shape notes: Statewide via 3 public institutions; no income/asset test; degree-seeking only; space-available enrollment; institution-specific processes and exclusions
- **Assistive Devices Program** — in_kind ([source](https://dhss.delaware.gov/dsaapd (DSAAPD primary); http://www.dati.org (DATI)))
  - Shape notes: Tied to DSAAPD for adults with physical disabilities; no fixed income/asset tables provided—'specified financial criteria'; device-specific assessed need required; statewide but location-based access

## Program Details

### Delaware Medicaid for the Elderly

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"description":"Delaware is an income cap state. For 2025, the income limit for Nursing Home Medicaid and Long-Term Care Community Services (LTCCS) is $2,417.50/month for a single applicant[5]. Income limits are calculated at 250% of the Supplemental Security Income (SSI) federal benefit rate[3]. For Regular Medicaid/Aged Blind and Disabled (ABD), the income limit is $967/month for a single applicant[6]. Excess income can be placed into a Qualified Income Trust (Miller Trust) to achieve eligibility[5].","single_applicant_nursing_home":"$2,417.50/month (2025)[5]","single_applicant_regular_abd":"$967/month[6]","married_one_spouse_applying_nursing_home":"Only the applicant spouse's income is considered; the non-applicant spouse may receive a Minimum Monthly Maintenance Needs Allowance (MMMNA) to avoid spousal impoverishment[6]","married_both_spouses_applying_regular_abd":"Both spouses' income is considered; no MMMNA available[6]","income_counted":"Wages, pensions, Social Security benefits, and IRAs[6]","income_not_counted":"Holocaust restitution payments, VA Aid & Attendance, and Housebound Allowances[6]"}
- Assets: {"single_applicant":"$2,000 in countable assets (2026)[1]","married_one_spouse_applying_nursing_home":"$3,000 for the applicant; $157,920 for the non-applicant spouse[6]","married_both_spouses_applying_regular_abd":"$3,000[6]","what_counts":"Cash, savings, investments, and property you own[6]","what_is_exempt":"Retirement accounts (IRAs and 401(k)s), personal items, one car, a primary home, and certain prepaid funeral trusts[6]. Also exempt: life insurance policies where the applicant or spouse is the owner, and contracts for prepaid burial[3]"}
- Must be a Delaware resident[3]
- Must be a U.S. citizen or lawful alien admitted for permanent residency[3]
- Must be willing to enter a nursing facility voluntarily or accept Long Term Care Community Services (LTCCS) program services voluntarily[3]
- For Nursing Home Medicaid: Must require a Nursing Facility Level of Care (NFLOC), meaning full-time care that can only be provided in a nursing home. Assessment includes ability to perform Activities of Daily Living (mobility, bathing, dressing, eating, toileting) and Instrumental Activities of Daily Living (cleaning, cooking, shopping, paying bills), plus any cognitive or behavioral issues[1]
- For Regular ABD Medicaid: Must be aged (65 or over), blind, or disabled. If requiring long-term care services, Delaware Medicaid will assess ability to perform Activities of Daily Living and Instrumental Activities of Daily Living[1]

**Benefits:** Nursing Home Medicaid covers full-time nursing facility care for as long as the senior qualifies for needing the care, even if this means multiple years of care until death[2]. Long-Term Care Community Services (LTCCS) provides comprehensive community-based care and services to people who meet nursing home level of care criteria[3]. Regular ABD Medicaid covers physician's visits, prescription medication, emergency room visits, and short-term hospital stays[1]. A nursing facility resident receiving Medicaid may keep $50.00 of his/her monthly income[3].
- Varies by: program_type

**How to apply:**
- Online: Use Delaware ASSIST (Application for Social Services and Internet Screening Tool) to determine eligibility[4]
- In-person or phone: Contact your local Long Term Care (LTC) unit[3]
- Mail: Submit application to local LTC unit (specific address available through Delaware DHSS)

**Timeline:** Applications sometimes take longer than expected[2]. Coverage can possibly begin from 3 months prior to the application's approval[2]. You should ask about the usual approval timeframe when you submit your initial application[2].
**Waitlist:** Not specified in available sources

**Watch out for:**
- Delaware is an income cap state — even if you have low assets, exceeding the income limit disqualifies you. However, excess income can be placed into a Qualified Income Trust (Miller Trust) to achieve eligibility[5]
- Asset limits are strict at $2,000 for single applicants; married couples have different limits depending on whether one or both spouses are applying[6]
- For married couples where one spouse applies for nursing home Medicaid, the non-applicant spouse can retain up to $157,920 in assets, but only the applicant spouse's income counts toward the limit[6]
- A nursing facility resident can only keep $50/month of their income; the rest goes toward care costs[3]
- The functional/medical requirement is strict: applicants must require a Nursing Facility Level of Care (NFLOC), meaning they need full-time care that can only be provided in a nursing home. This is not just about being elderly or having some health issues[1]
- LTCCS (community-based long-term care) has additional restrictions: applicants must be 55 or older and live within the specified PACE service area[3]
- Processing times are variable and can be longer than expected; families should ask about typical approval timeframes when applying[2]
- Coverage can be retroactive up to 3 months before approval, but this is not guaranteed[2]
- Regular ABD Medicaid and Nursing Home Medicaid have different income limits and spousal treatment; families must apply for the correct program[6]

**Data shape:** Delaware Medicaid for the elderly is split into two main programs: (1) Nursing Home Medicaid for institutional care and (2) Long-Term Care Community Services (LTCCS) for community-based care. Both have the same 2025 income limit ($2,417.50/month) but different asset limits and service delivery models. Regular ABD Medicaid is a separate program with lower income limits ($967/month) but covers basic healthcare. Income limits are indexed to 250% of SSI federal benefit rate and may change annually. Spousal asset and income treatment differs significantly depending on whether one or both spouses are applying. The program is statewide but LTCCS has geographic service area restrictions. Processing times are variable and not standardized.

**Source:** https://www.dhss.delaware.gov/

---

### Diamond State HCBS Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must meet Medicaid financial eligibility for Aged, Blind, and Disabled (ABD) or long-term care programs. For single applicants in 2026: income under $2,485/month (Nursing Home Medicaid) or at/below 250% of SSI ($564/month as of older data, likely adjusted). Couples and households follow Medicaid ABD rules with spousal impoverishment protections; exact table not specified in sources but asset limit of $2,000 applies to single applicants[2][6].
- Assets: Single applicant: $2,000 or less in countable assets. Countable assets include bank accounts, stocks, bonds; exempt typically primary home (if intent to return), one vehicle, personal belongings, burial plots. 60-month look-back period penalizes asset transfers[2].
- Delaware resident
- Medicaid eligible (via Diamond State Health Plan Plus for long-term care)
- Nursing Facility Level of Care (NFLOC): at risk of nursing home placement based on needs in Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (IADLs: cleaning, cooking, shopping, bills), plus cognitive/behavioral issues. Alzheimer's/dementia does not guarantee NFLOC[2][6]
- Prior HCBS waivers for elderly absorbed into Long-Term Care Community Services (LTCCS) Program under Diamond State Health Plan Plus; no separate elderly/disabled waiver slots[6]

**Benefits:** Home and community-based services (HCBS) to avoid institutionalization, including personal care, respite, assistive technology, day habilitation, supported employment, prevocational services (examples from related waivers; specific LTCCS under DSHP Plus covers long-term care community services like assisted living community services for those needing significant care). No fixed dollar amounts or hours specified; services in addition to standard Medicaid[1][3][4][6][8].
- Varies by: priority_tier

**How to apply:**
- Contact Division of Medicaid and Medical Assistance (DMMA) or local offices for eligibility screening (specific phone/website not in results; refer to dhss.delaware.gov/dmma)
- Apply for Medicaid via Diamond State Health Plan (DSHP) as prerequisite
- Lifespan Waiver (related): Medicaid application process[4]

**Timeline:** Not specified in sources
**Waitlist:** Prior HCBS waivers had limited slots and waitlists; current LTCCS absorbed prior waivers but may still have capacity limits[6]

**Watch out for:**
- No standalone 'Diamond State HCBS Waiver' for elderly; prior Elderly & Disabled Waiver absorbed into LTCCS Program under Diamond State Health Plan Plus (DSHP Plus)[6]
- Must first qualify for Medicaid; HCBS requires NFLOC, not just age/diagnosis[2][6]
- 60-month look-back penalizes asset transfers; no gifting assets[2]
- Excludes those with comprehensive insurance, Medicare, or military coverage[7]
- Program under development or restructured; verify current status as data references waivers now integrated[1][6]

**Data shape:** No separate elderly HCBS waiver; benefits via DSHP Plus LTCCS Program with NFLOC requirement and statewide Medicaid integration; limited slots historically led to waitlists; financials tied to ABD Medicaid with $2,000 single asset cap[6]

**Source:** https://dhss.delaware.gov/dmma (primary DHSS/DMMA site); https://www.medicaidlongtermcare.org/eligibility/delaware/[2]

---

### Delaware PACE

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment; Medicaid eligibility (for free services) requires income under 300% of the Federal Benefit Rate ($2,901/month in 2025) and assets $2,000 or less (excluding primary home) for long-term care, but private pay option exists for those exceeding limits[2][6][7]. Does not vary by household size for PACE itself.
- Assets: No asset limits for PACE enrollment; for Medicaid (free services), assets $2,000 or less excluding primary home[2].
- Meet Delaware's nursing home level of care criteria (assessed by state)[1][4].
- Reside in the PACE approved service area (specific to provider, e.g., Saint Francis LIFE zip codes)[1][6].
- Living in the community (not in nursing home)[1].
- Able to be maintained safely in the community with PACE assistance at enrollment[1][4].
- Not enrolled in Medicaid/Medicare managed care, Medicare Advantage, hospice, or certain other programs[1][3].
- Voluntarily agree to receive services exclusively through the PACE organization[1].
- Eligible for Medicaid, Medicare (if applicable), or able to pay privately[4].

**Benefits:** All-inclusive care for the elderly including primary care, hospital care, prescription drugs, social services, restorative therapies, personal care, respite care, home care, adult day health care, and all Medicare/Medicaid-covered services; comprehensive plan developed by interdisciplinary team; no participant cost contribution for care from PACE organization[1][3].

**How to apply:**
- Contact Saint Francis LIFE (Trinity Health PACE) or PACE Your LIFE providers directly for intake[4][6].
- Phone/email for PACE Your LIFE: info@paceyourlifemwv.com (specific Delaware numbers not listed; call Delaware DMMA or providers)[4][7].
- In-person/home visit and intake assessment[4].
- No specific statewide online URL or form listed; start with provider contact

**Timeline:** Not specified in sources; involves intake, assessments, and state NF LOC approval[4].
**Waitlist:** Not mentioned; may vary by provider capacity

**Watch out for:**
- Must live in specific provider service area, not statewide[1][6].
- Services exclusively through PACE; cannot use other Medicare/Medicaid providers[1][3].
- Private pay flat monthly fee if not Medicaid-eligible (amount not specified)[6][7].
- Disenrollment if moves out of area >30 days, non-compliant, or disruptive[1].
- Nursing home level of care required, but must be safe in community with PACE[1][5].
- No Medicare/Medicaid managed care enrollment allowed[1].

**Data shape:** Limited to specific provider service areas (not statewide); no financial criteria for enrollment but Medicaid needed for free services; requires state-certified nursing facility level of care; private pay option with flat fee

**Source:** https://www.law.cornell.edu/regulations/delaware/16-Del-Admin-Code-SS-20000-20775 (Delaware Admin Code); https://www.dhss.delaware.gov/dmma/ (Delaware DMMA for providers)

---

### Delaware Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Delaware offers three tiers with 2026 income limits (monthly gross): QMB: $1,350 individual / $1,824 married couple[5]; SLMB: $1,478 individual / $1,992 married couple[1]; QI: $1,660 individual / $2,239 married couple[1]. All three programs require Medicare Part A enrollment. QMB and SLMB enrollees must have both Part A and Part B; QI enrollees must also have both Part A and Part B[1][5].
- Assets: Delaware has NO asset limit for Medicare Savings Programs[1]. This is a significant advantage compared to other states. However, for reference, the federal QMB asset limits are $9,950 individual / $14,910 married couple (2026)[5], but Delaware does not enforce these.
- Must be entitled to Medicare Part A[1][5]
- Must be a Delaware resident[1]
- QI enrollees cannot receive any other Medicaid benefits (QMB and SLMB enrollees may receive full Medicaid or have a Medicaid spend-down)[1]
- Must meet income limits; income is calculated as monthly gross income[1]

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, and copayments for Medicare-covered services and items. Also qualifies for Extra Help with prescription drugs (max $12.65 per drug in 2026)[5]. SLMB: Pays Medicare Part B premiums only; does not cover deductibles, coinsurance, or copayments (potential savings over $1,000/year)[1][4]. QI: Pays all or part of Medicare Part B premiums only; does not cover deductibles, coinsurance, or copayments[1][4]. All three programs also qualify beneficiaries for Extra Help with Medicare Part D prescription drug costs[2][5].
- Varies by: priority_tier

**How to apply:**
- Phone: Delaware Medicaid Assistance Bureau (DMAB) at (302) 674-7364[2]
- Mail: Contact DMAB for mailing address (not provided in search results)
- In-person: Contact DMAB for office locations (not provided in search results)
- Online: Not explicitly mentioned in search results; contact DMAB for web-based options

**Timeline:** Not specified in search results
**Waitlist:** QI program has limited funding and operates on a first-come, first-served basis; applications are approved until money runs out. QI enrollees must re-apply every year, with priority given to those who received QI benefits the previous year[4][5]. QMB and SLMB do not appear to have waitlists based on available information.

**Watch out for:**
- Delaware has NO asset limits for MSPs, making it easier to qualify than many states — families should not assume asset limits apply[1]
- QI program has limited federal funding and operates first-come, first-served; applications may be denied once funding runs out in a given year[4][5]
- QI enrollees cannot receive any other Medicaid benefits, unlike QMB and SLMB enrollees[1]
- QI requires annual re-application; beneficiaries must reapply every year to maintain coverage[4][5]
- SLMB and QI only pay Part B premiums — they do NOT cover deductibles, coinsurance, or copayments, unlike QMB[1][4]
- All three programs require Medicare Part A enrollment; individuals without Part A are ineligible[1][5]
- QMB and SLMB enrollees may receive small Medicaid copayments even when covered by the program[4][5]
- Extra Help prescription drug benefit caps copayments at $12.65 per drug (2026), but this only applies if enrolled in a Medicare Part D plan[2][5]
- Income is calculated as monthly gross income; families should verify their exact monthly income against the limits before applying[1]

**Data shape:** Delaware's MSP structure is tiered by income level (QMB < SLMB < QI), with benefits decreasing as income increases. The key differentiator is Delaware's elimination of asset limits, which is not standard nationally. The QI program's first-come, first-served funding model creates uncertainty for late applicants. All three programs tie to Medicare Part A enrollment and offer automatic Extra Help for prescription drugs. Processing timelines, specific forms, required documents, and regional office locations are not detailed in available sources and require direct contact with DMAB.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.medicare.gov/basics/costs/help/medicare-savings-programs

---

### Delaware Food First/SNAP

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Delaware SNAP (Food Supplement Program) has expanded eligibility. Most households qualify if gross monthly income is at or below 200% of the Federal Poverty Level (FPL). For Oct 1, 2025 - Sept 30, 2026: 1 person $2608/month, 2 $3526, 3 $4442, 4 $5358, 5 $6276, 6 $7192, 7 $8108, each additional +$916. Households with elderly (60+) or disabled members may qualify via net income and asset tests if over gross limit. Separate 165% FPL gross limit may apply for elderly/disabled separate households. SSI, TANF, or GA recipients are categorically eligible without income test. All children 21 or under living with parents must be included.
- Assets: No resource/asset test for most households meeting 200% FPL gross income limit. Households with elderly (60+) or disabled may be exempt from asset test or qualify under special rules; standard SNAP exemptions apply (e.g., home, most retirement accounts exempt, countable assets like cash typically under $2,750 or $4,250 if elderly/disabled).
- U.S. citizen or eligible lawfully present non-citizen.
- Live in Delaware.
- Household includes people who live together, buy/prepare food together (includes spouse, children under 22 even if food separate; parents if under 22).
- Work registration for most adults (exemptions for elderly 60+, disabled).

**Benefits:** Monthly EBT card benefits (Delaware Food First card) for groceries. Maximum amounts vary by household size, income, and expenses (e.g., deducts medical costs over $35/month for elderly/disabled). Exact max benefits not fully tabled in sources but scale with net income (e.g., full benefit if $0 net income).
- Varies by: household_size

**How to apply:**
- Online: Delaware ASSIST portal (dhss.delaware.gov/mealsystems - implied state portal).
- Phone: Call Delaware 211 or local DHSS office (specific numbers via dhss.delaware.gov/dss/foodstamps.html).
- Mail/In-person: Local Division of Social Services offices statewide.
- Ask for expedited SNAP if low income/cash (<$150 income or <$100 cash for quick 7-day approval).

**Timeline:** 30 days standard; 7 days for expedited if qualify.

**Watch out for:**
- Expanded 200% FPL gross income limit (higher than standard 130%) - many miss this and think ineligible.
- Elderly/disabled households can skip gross income test, qualify on net income/assets; deduct high medical expenses.
- No asset test for most at 200% FPL, but applies if using elderly/disabled path.
- Must include all household members (kids under 22, spouse); SSI recipients auto-eligible.
- Non-citizens: only eligible lawfully present, not undocumented.
- Work rules may apply unless 60+ or disabled.

**Data shape:** Expanded eligibility to 200% FPL gross income with no asset test for most; special net income path for elderly/disabled households; categorical eligibility for SSI/TANF/GA; benefits via EBT card scaling by household size, income, and deductions like medical costs.

**Source:** https://www.dhss.delaware.gov/dss/foodstamps.html

---

### Delaware LIHEAP


**Eligibility:**
- Income: Gross monthly household income must be at or below 60% of Delaware State Median Income (SMI), after federal and local taxes. Recent 2025 guidelines: 1 person $3,278/month ($39,336/year), 2 people $4,287/month ($51,444/year), 3 people $5,296/month ($63,552/year), 4 people $6,304/month ($75,648/year), 5 people $7,313/month ($87,756/year), 6 people $8,322/month ($99,864/year). Older data (2021) used 200% FPL annually: 1 person $25,536, 2 $34,488, 3 $43,440, 4 $52,416[1][2][4].
- Assets: No asset limit applies[1].
- Household includes all at the address sharing utility bills (e.g., roommates count)[1]
- Eligible heating fuels: electricity, natural gas, oil, kerosene, propane, coal, wood[4]
- Homeowners and renters qualify[2][4]
- Priority for elderly (60+), disabled, families with young children[5]

**Benefits:** Regular heating: $100 min to $2,561 max; cooling: $1 min to $1,000 max; crisis: up to $10,000 max. Paid as one-time grant to utility or household. Average ~$553/year. Includes winter heating (Oct-Mar), year-round crisis aid, summer cooling flat benefit. Weatherization separate (insulation, repairs)[1][4][6].
- Varies by: household_size|priority_tier|fuel_type

**How to apply:**
- Online: dhss.delaware.gov/dhss/dss/liheap.html or Catholic Charities (specific link via site)[4]
- Phone: (302) 255-9875[4]
- Local agencies via Division of State Service Centers (DSSC)[4]
- In-person/mail through contracted local providers like Catholic Charities[4]

**Timeline:** Not specified in sources
**Waitlist:** Funds vary by demand and enrollment timing; no guaranteed availability[6]

**Watch out for:**
- Income is gross monthly before taxes for household sharing utilities (roommates count)[1]
- Supplemental only, not full heating costs[4]
- Priority groups (elderly 60+, disabled) get preference but no strict age cutoff[5]
- Older income data (e.g., 2021) outdated; verify current SMI/200% FPL[1][2]
- Crisis requires proof like shut-off notice or low fuel (≤10%)[4]
- Funds not guaranteed; apply early in season[6]

**Data shape:** Income at 60% SMI or 200% FPL (updates yearly); benefits scale by income/size/fuel/season; priority tiers for vulnerable; statewide but local agency delivery; no assets test

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhss.delaware.gov/dhss/dss/liheap.html

---

### Delaware Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income at or below 200% of the Federal Poverty Level, based on household size. Current guidelines: 1 person $30,120; 2 persons $40,880; 3 persons $51,640; 4 persons $62,400; 5 persons $73,160; 6 persons $83,920; 7 persons $94,680; 8 persons $105,440. For families with more than 8 persons, add $10,280 per additional person.[1][2]
- Assets: No asset limits mentioned in program guidelines.[1][2][5]
- Household income based on gross income of all members.
- Residential housing only: rowhomes, single family homes, trailers eligible; no multi-family homes.
- Homeowners and renters eligible; renters need landlord permission and copy of rental agreement.
- Someone age 18+ must be present during contractor visits.
- Proof of identity, income, ownership/rental status required.
- Prioritization for elderly, persons with disabilities, children in home, and highest need.[1][2][5][8]

**Benefits:** Free home energy audit followed by installation of weatherization measures including air-sealing, insulation, heating system repair or tune-up, lighting upgrades, and minor repairs (e.g., roof patching, window/door glass replacement or crack patching, masonry repair) to enable weatherization. Does not include major repairs like full roof replacement, window replacement, or routine heating maintenance.[1][2][7][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Energy Coordinating Agency at 302-504-6111 to set up appointment.[1][8]
- Online: Apply via form at Energy Coordinating Agency website (ecasavesenergy.org/services/delaware/weatherization/apply/).[4]
- General questions: 302-735-3480.[1]

**Timeline:** Not specified; once eligible, placed on waiting list. Must reapply every 12 months if not served to verify income.[1][6]
**Waitlist:** Yes, prioritizes by need, age/special needs of residents, children in home, and funding levels. Not all applicants served in one program year.[1][6][8]

**Watch out for:**
- Renters: Landlord must approve and sign off; utilities must be tenant-paid (not included in rent, or can't benefit landlord).[2][8]
- Waiting list prioritization means not all eligible are served annually due to funding; reapply yearly if not served within 12 months.[1][6]
- Home must pass pre-weatherization repairs if needed (e.g., via Pre-WAP for roof/window/masonry issues).[2]
- Requires homeowner time investment and 18+ presence on multiple visit days.[1][6]
- No categorical eligibility from other programs; full income verification required.[5]

**Data shape:** Statewide fixed services via single contractor (ECA); income at 200% FPL with household size table; priority tiers by vulnerability (elderly/disabled/children); waitlist and annual reapplication due to funding limits.

**Source:** https://dnrec.delaware.gov/climate-coastal-energy/sustainable-communities/weatherization/[1]

---

### Delaware Senior Medicare Patrol (SMP/SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, their families, and caregivers[1][3][4]
- Assets: No asset limits or tests apply[1][3]
- Must be a Medicare beneficiary (age 65+, younger with disabilities or ESRD), family member, or caregiver seeking help with Medicare fraud prevention, detection, reporting, errors, abuse, or health insurance counseling[1][3][4]

**Benefits:** Free one-on-one counseling on Medicare fraud, errors, abuse; community outreach and education presentations at events, health fairs, senior centers, libraries; dissemination of consumer education materials; advocacy to resolve billing disputes; referrals to state/federal agencies for suspected fraud investigations; SHIP services including free local health insurance counseling, outreach, and training on Medicare options[1][2][4][5][6][7]

**How to apply:**
- Phone: (302) 255-9642 (primary contact Barbara Jackson) or (800) 223-9074 (national volunteer line, also for services)[4]
- Website: https://smp.dhss.delaware.gov/[6]
- In-person: Events at libraries, health fairs, senior centers statewide (e.g., Frankford Public Library)[7][8]

**Timeline:** Immediate for counseling and education; no formal application processing as services are provided on-demand via phone, events, or contact[1][2][4]

**Watch out for:**
- Not a financial assistance or healthcare benefits program—focuses solely on education, counseling, and fraud reporting, not direct aid or enrollment in Medicare benefits[1][2][3]
- Often paired with SHIP but SMP specifically targets fraud prevention/detection[1][3]
- Volunteer-based with no cost to users, but funded by federal grants which may face cuts[7]
- Contact for services, not formal 'application' as it's not an entitlement program[4]

**Data shape:** no income/asset/age test beyond Medicare eligibility; service-based not financial; volunteer-driven outreach statewide via events/phone; often bundled with SHIP counseling[1][2][3][4]

**Source:** https://smp.dhss.delaware.gov/[6]

---

### Delaware Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits. Income is explicitly not a criterion for eligibility[3]. However, some regional providers may consider income for determining meal costs or donations[2].
- Must be homebound — confined to home due to lack of mobility, illness, or disability[1]
- Unable to shop or cook meals independently, or no household member available to prepare meals[2]
- Physical disability (if under 60) must be anticipated to last 12+ months and include at least one Activity of Daily Living (ADL) deficit impacting independent living[3]
- Non-elderly disabled adults may qualify if they are household members of an eligible elderly person and have proof of Social Security Disability Insurance coverage[3]

**Benefits:** At least one hot or appropriate meal per day, delivered at least five days per week[3]
- Varies by: region

**How to apply:**
- Phone: Contact your local regional provider (see geography section for numbers)
- Online: Visit provider websites (URLs listed in geography section)
- In-person: Visit local senior centers or meal program offices
- Mail: Contact information available through regional providers

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- No income limits exist, but some programs request donations or offer financial aid based on ability to pay[2] — don't assume you're ineligible due to income
- You must be homebound; if you can leave home independently, you may not qualify, though you can visit dining room locations instead[1]
- Non-elderly disabled adults can only qualify if they live with an eligible elderly person AND have proof of Social Security Disability Insurance coverage[3] — this is a strict requirement
- Physical disabilities for younger applicants must be expected to last 12+ months and include ADL deficits — temporary conditions don't qualify[3]
- Delaware has no statewide single application; you must contact your specific regional provider — there is no centralized intake[7]
- Meals are delivered at least five days per week, but specific delivery schedules vary by provider and participant needs[3][7]
- The program serves 4,360 homebound seniors in Delaware[6]; availability may be limited in less populated areas

**Data shape:** Delaware Meals on Wheels operates as a decentralized network of regional providers rather than a single statewide program. Eligibility is uniform (age 60+, homebound, unable to cook/shop), but application processes, meal options, and service details vary significantly by county and provider. No income limits exist statewide, which is unusual and important for families to know. The program explicitly prioritizes reaching low-income seniors but does not restrict services based on income[3]. Non-elderly disabled adults have a narrow eligibility pathway requiring SSDI proof and co-residence with an eligible elderly person.

**Source:** https://mealsonwheelsde.org and regional provider websites

---

### Delaware Family Caregiver Support Program


**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits detailed for this program in available sources; often tied to broader Medicaid eligibility which uses Federal Poverty Level (e.g., 100% FPL for general Medicaid, varying by household size and category like 133% for children 1-6 or 200% for pregnant women/infants). Exact tables not provided for this program.
- Assets: Not specified for this program; Medicaid-linked programs may have resource limits for long-term care.
- Care recipient is 60+ or has Alzheimer's (any age), or grandparent/relative caregiver 55+ caring for child or disabled adult child.
- Delaware resident.
- US citizen or legally residing noncitizen for full benefits.
- May require need for assistance with activities of daily living (ADLs).

**Benefits:** Respite care, caregiver training, counseling, support groups, supplemental services (e.g., assistive devices, home modifications). Not direct payment to caregivers; focuses on support to relieve family caregivers.
- Varies by: priority_tier

**How to apply:**
- Contact Delaware Aging and Disability Resource Center (ADRC) by phone or visit https://dhss.delaware.gov/dsaapd/faq_attendant2.html for Personal Attendant Services info.
- Contact local Area Agency on Aging.

**Timeline:** Not specified.

**Watch out for:**
- Not a paid caregiver program; confusable with Medicaid Personal Attendant Services or self-direction waivers that allow hiring family as paid attendants.
- Requires enrollment in specific programs for payment options.
- VA or insurance programs have separate rules.
- Background checks often required for paid roles.

**Data shape:** Administered via Area Agencies on Aging; links to Medicaid waivers for paid family caregiving options; no direct income test specified, but functional/age-based; not statewide uniform in delivery.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhss.delaware.gov/dsaapd/faq_attendant2.html

---

### Delaware Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and year; families must contact the local provider to confirm current thresholds based on recent income (last 6-12 months, including Social Security, disability benefits, etc.). No specific table provided in sources[1][2][3][4].
- Assets: No asset limits mentioned in program sources.
- Unemployed
- Reside in a National Able service area with available funding (Delaware covered)
- Eligible to work in the United States
- Willing to provide community service, attend required meetings and training
- Willing to develop a personalized Individual Employment Plan (IEP)
- Willing to use all available resources for job searches and economic self-sufficiency
- Have barriers to employment or low employment prospects
- Enrollment priority: veterans and qualified spouses, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, or failed American Job Center services[1][3][4][6][8]

**Benefits:** Part-time on-the-job training (average 20 hours/week) at community nonprofits/public agencies (e.g., child care, customer service, teachers' aide, computer technician, building maintenance, health care worker); paid the highest of federal, state, or local minimum wage; subsidized wages; yearly physical; informative workshops on job seeking skills; skills assessment and training toward unsubsidized employment (typically 6 months training before job placement)[1][2][3][4]
- Varies by: priority_tier

**How to apply:**
- In-person or contact: New Castle County - Rose Hill Community Center, Inc., 19 Lambson Lane, Suite 105A, New Castle, DE (from Delaware labor flyer)[3]
- Contact National Able for Delaware (primary grantee per handbook): application process involves signing SCSEP Participant Form and DOL eligibility documents; orientation follows eligibility determination[1]
- Online interest form example: https://www.tfaforms.com/4891021 (general SCSEP, confirms Delaware eligibility check)[5]
- Phone/website: Contact local SCSEP office via Delaware Department of Labor or National Able (specific DE phone not listed; use general SCSEP locator through DOL or provider)[2][3]

**Timeline:** Eligibility determination after application review; formal orientation upon approval; initial skills assessment upon entry. No specific timeline stated[1]
**Waitlist:** Possible waitlist if no immediate openings; enrollment if eligible and no waiting list[2]

**Watch out for:**
- Not entitled to benefits until formal eligibility approval and communication from staff; annual eligibility review required[1]
- Must be willing to commit to community service, IEP, and job search resources—failure may lead to exit[1]
- Priority tiers mean veterans/65+ get first access; funding-limited slots may create waitlists[2][4][6]
- Program is temporary training (avg. 6 months) bridge to unsubsidized work, not permanent employment[2][4]
- Residency tied to available funding areas[1]

**Data shape:** Income at 125% FPL (varies by household size/year, no fixed table in sources); priority enrollment tiers; grantee/provider-based (National Able in DE, county offices); funding slots limit access

**Source:** https://laborfiles.delaware.gov/main/det/one-stop/FS-3_SenEmp.pdf (Delaware DOL flyer); https://www.nationalable.org/wp-content/uploads/2020/02/SCSEP_DelawareHandbook_013120.pdf (DE-specific handbook)

---

### Delaware Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; open to all residents of long-term care facilities regardless of financial status[2][4][5]
- Assets: No asset limits or tests apply[2][4][5]
- Must be a resident of a licensed long-term care facility (nursing homes, assisted living residences, family care homes), or have a complaint/concern on behalf of such a resident[2][4][5][6]

**Benefits:** Investigate and resolve complaints about care, rights violations, abuse/neglect (referred to specialists), mistreatment, or financial exploitation; inform residents/families of rights under federal/state law; provide information/referrals; conduct facility visits and annual assessments; advocate for quality of life improvements; supervised by paid staff and volunteers who visit 1-2 hours per month[2][4][5][6]

**How to apply:**
- Phone: 800-223-9074[2]
- Website: www.dhss.delaware.gov/dhss[2]
- In-person or facility referral via regional offices (e.g., Kent/Sussex via Delaware ADRC)[6]

**Timeline:** Not specified; complaint investigations begin upon contact, with periodic site visits[4]

**Watch out for:**
- Not a direct service provider (no healthcare/financial aid); focuses on advocacy/complaints only[4][5]
- Abuse/neglect complaints referred to Division of Long Term Care Residents Protection, not handled directly[5]
- Volunteers cannot serve if family works/resides in assigned facility or conflict of interest exists[2]
- Families can contact on behalf of residents; no personal eligibility barriers[2][6]

**Data shape:** no income test; advocacy-only for LTC facility residents; volunteer-supported with statewide coverage but regional volunteer assignment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhss.delaware.gov/dhss (primary state DHSS site)[2]

---

### Delaware Prescription Assistance Program (DPAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Countable income at or below 200% of the Federal Poverty Level (FPL), which varies annually and by household size (couples counted as two individuals). Individuals over 200% FPL qualify if yearly prescription costs exceed 40% of countable income. No specific dollar table in sources; FPL published annually with standards issued within 10 business days.[1][2][4][5]
- Assets: No asset limits mentioned in sources.
- Delaware resident
- Age 65 or older, or under 65 and receiving Social Security Disability benefits (SSDI or SSI; former recipients switched to Survivors benefits may qualify)
- No prescription coverage other than Medicare Part D
- If eligible for Medicare Part A/B, must enroll in Medicare Part D and provide proof (enroll within 90 days if not yet enrolled)
- If potentially eligible for Low-Income Subsidy (LIS/Extra Help), must apply via Social Security
- Not eligible for full Medicaid benefits
- Not an inmate of a public institution
- U.S. citizen or lawful resident (proof if not citizen)

**Benefits:** Up to $2,500-$3,000 per individual per benefit year (sources vary; state fiscal year July 1-June 30) for prescription drugs and Medicare Part D premiums. Client pays co-pay of 25% of prescription cost or $5 minimum, whichever greater, collected by pharmacy.[1][2][3][4][5]
- Varies by: fixed

**How to apply:**
- Mail: Complete DPAP application form and send with documents to P.O. Box 950, New Castle, DE 19720-9914 or Lewis Building, DHSS Campus, 1901 N. DuPont Highway, New Castle, DE 19720
- Phone: Call 1-800-996-9969 for information and to request application
- Download form: Available at dhss.delaware.gov (specific PDF: dpapapplication.pdf)

**Timeline:** Timely determination required per regulations, but no specific days stated.[6]
**Waitlist:** Not mentioned in sources.

**Watch out for:**
- Must enroll in Medicare Part D if eligible (even within 90 days of starting benefits); no other prescription coverage allowed except Part D
- 25% co-pay ($5 min) required per prescription
- Not for those with full Medicaid or other insurance covering prescriptions
- Income over 200% FPL possible via 40% drug cost test, but proof needed
- Benefit year is state fiscal (July 1-June 30); annual renewal required
- Applications mail-only; call for info but no in-person apply mentioned
- Funding from tobacco settlement; limits per person ($2500-$3000)

**Data shape:** Income test at 200% FPL or 40% drug costs; strict Medicare Part D mandate; no assets test; statewide but centralized in New Castle; fiscal year benefits cap per individual

**Source:** https://dhss.delaware.gov (DPAP application at https://dhss.delaware.gov/wp-content/uploads/sites/11/dss/pdf/dpapapplication.pdf); regulations at https://regulations.delaware.gov/AdminCode/title16/30000[4][6]

---

### Wilmington Senior Tax Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: Household income may not exceed $93,725 per year. No variation specified by household size or single/couple.
- Assets: No asset limits mentioned.
- Property must be located within Wilmington city limits and be the applicant's primary residence.
- Applicant must be listed as the property owner on tax records.
- Facing imminent foreclosure due to delinquent property taxes, water bills, or sewer bills.

**Benefits:** Maximum grant of $3,000 to cover delinquent property taxes, water bills, or sewer bills.
- Varies by: fixed

**How to apply:**
- Phone: Contact DSHA at (302) 577-5001 to set up an appointment.

**Timeline:** Not specified in available sources.

**Watch out for:**
- Targets only those facing imminent foreclosure due to specific delinquent bills (property taxes, water, sewer); not general tax relief.
- Must be homeowner with paid-off mortgage in many cases, per program descriptions.
- Distinct from Wilmington's separate Senior Property Tax Exemption (age 65+, lower income limits like $15k single/$19k couple, $565 exemption).

**Data shape:** Emergency grant program restricted to Wilmington city homeowners 62+ at risk of foreclosure; high income threshold ($93,725) but requires proof of delinquency and imminent foreclosure.

**Source:** https://www.destatehousing.com/ (DSHA website for application and complete information)

---

### SCAT – Senior Citizens Affordable Taxi

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits mentioned in available sources.
- Assets: No asset limits mentioned in available sources.
- Physical or mental disability preventing operation of a motor vehicle (certification required)
- Certification to verify age and/or disability
- Exclusions: acute or chronic alcoholism, drug addiction, contagious diseases risking others

**Benefits:** 50% discount on taxi fares via purchase of SCAT tickets; present DART SCAT Photo ID to driver; rides for any purpose; must use participating taxi companies
- Varies by: fixed

**How to apply:**
- Download form from https://www.dartfirststate.com/information/forms/index.shtml
- Phone: 800.553.3278 (to request application)
- Mail to: Delaware Transit Corporation, 400 S. Madison St., Wilmington, DE 19801 or 900 Public Safety Boulevard, Dover, DE 19901
- In-person: DTC offices at 400 S. Madison St., Wilmington or 900 Public Safety Blvd., Dover (for photo ID after approval)

**Timeline:** Not specified in sources

**Watch out for:**
- Must purchase SCAT tickets separately after approval (fare paid with tickets, not cash)
- Present DART SCAT Photo ID at pickup (must visit DTC office for photo)
- Only participating taxi companies accepted; taxi dispatched by calling them directly
- DTC may verify certification; applicant pays for any photo ID trip to office
- Disability determination based solely on application criteria

**Data shape:** No income or asset tests; ticket-based discount system requiring photo ID and participating taxis; certification-focused eligibility; statewide but ID pickup limited to two offices

**Source:** https://www.dartfirststate.com/Programs/ or https://www.dartfirststate.com/information/forms/index.shtml

---

### Over-60 Tuition Benefit

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or asset limits apply. Eligibility is based solely on age and Delaware residency, with no household size variations, asset counts, or exemptions needed.
- Assets: No asset limits apply.
- Delaware resident
- Must apply and be admitted as a formal degree candidate (undergraduate or graduate at University of Delaware; credit courses at Delaware Technical Community College and Delaware State University)
- High school diploma or equivalent expected for new UD applicants (SATs not required)
- Space-available basis
- For DTCC: Excludes Workforce Development, Community Education, and competitive admissions programs; registration opens one week before term starts

**Benefits:** Waiver of tuition and mandatory fees (e.g., Student Center, Wellbeing, Comprehensive fees at UD). Covers credit or audit classes toward a degree. Students pay for books, supplies, course-related fees (labs, shops), and optional services like housing or dining.

**How to apply:**
- University of Delaware (new applicants): Online Over-60 Undergraduate Application at https://www.continuingstudies.udel.edu/60-tuition-free-degree/ (disabled after deadlines: Fall May 1, Spring Nov 1; late on space-available basis)
- University of Delaware (previously admitted): Contact ACCESS Center at access-advise@udel.edu for readmission application
- Delaware Technical Community College: Register during senior citizen period (1 week before 15-week fall/spring or 12-week summer sessions)
- Delaware State University: Apply through standard admissions as formal degree candidate (details via school contact per state law)
- In-person/mail: Official transcripts to UD Undergraduate Admissions Office; DTCC/DSU via respective college processes

**Timeline:** UD: 6-8 weeks after all materials received. DTCC/DSU: Space-available at registration opening.
**Waitlist:** No formal waitlist; enrollment strictly space-available after priority students.

**Watch out for:**
- Must be formal degree candidate, not non-degree or continuing ed (except DTCC credit courses)
- Space-available only—priority to paying students; register late (e.g., DTCC 1 week before term)
- Deadlines strict (UD May 1 fall, Nov 1 spring); late apps space-available only
- Pays books, supplies, lab/shop fees—not fully 'free'
- DTCC: No waiver if registered before senior period; excludes some programs
- No financial aid stacking beyond tuition/fees at some schools

**Data shape:** Statewide via 3 public institutions; no income/asset test; degree-seeking only; space-available enrollment; institution-specific processes and exclusions

**Source:** https://delcode.delaware.gov/title14/c034/sc10/index.html (state law); https://www.continuingstudies.udel.edu/60-tuition-free-degree/ (UD); https://dtcc.smartcatalogiq.com/en/current/catalog/financial/senior-citizen-tuition-policy (DTCC)

---

### Assistive Devices Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Specific income limits not detailed in sources; must meet financial criteria for DSAAPD services or Medicaid waivers. For related Medicaid long-term care (e.g., nursing home), single applicant under $2,485/month in 2026[1]. Varies by program and household; complex formulas apply[7].
- Assets: Must meet resource criteria for DSAAPD; for Medicaid long-term care, single applicant under $2,000[1]. Counts and exemptions not specified.
- Functionally-impaired adults with physical disabilities
- Assessed need for assistive device to promote independent action or communication[4]
- Specific social, financial, and physical criteria for ages 18-59; age 60+ broader[4]
- Medically necessary for Medicaid coverage[6]

**Benefits:** Assistive devices (e.g., kitchen utensils with large grips, shower seats, wheelchairs, specialized computers) that promote independence; related services may include evaluations, training, demonstrations, loans via DATI[4][5]. No fixed dollar amounts or hours specified.

**How to apply:**
- Phone: 800.223.9074 (DSAAPD)[4]
- Website: www.dhss.delaware.gov/dsaapd[4]
- Contact DSAAPD for locations; no formal application for DATI services—direct contact to ATRCs[5]
- Medicaid-related: online at Delaware DHSS, phone 1-866-843-7212, in-person DHSS office[2]

**Timeline:** Not specified

**Watch out for:**
- Must have assessed need; item must directly promote independence or communication[4]
- Complex, varying financial criteria by subcategory—not uniform[7]
- Ages 18-59 require stricter financial/medical criteria than 60+[4]
- No formal application for some services (DATI)—direct contact only[5]
- Medicaid coverage requires medical necessity[6]

**Data shape:** Tied to DSAAPD for adults with physical disabilities; no fixed income/asset tables provided—'specified financial criteria'; device-specific assessed need required; statewide but location-based access

**Source:** https://dhss.delaware.gov/dsaapd (DSAAPD primary); http://www.dati.org (DATI)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Delaware Medicaid for the Elderly | benefit | state | deep |
| Diamond State HCBS Waiver | benefit | state | deep |
| Delaware PACE | benefit | local | deep |
| Delaware Medicare Savings Programs (QMB, | benefit | federal | deep |
| Delaware Food First/SNAP | benefit | federal | medium |
| Delaware LIHEAP | benefit | federal | deep |
| Delaware Weatherization Assistance Progr | benefit | federal | deep |
| Delaware Senior Medicare Patrol (SMP/SHI | benefit | federal | medium |
| Delaware Meals on Wheels | benefit | federal | medium |
| Delaware Family Caregiver Support Progra | benefit | state | deep |
| Delaware Senior Community Service Employ | employment | federal | deep |
| Delaware Long-Term Care Ombudsman Progra | resource | federal | simple |
| Delaware Prescription Assistance Program | benefit | state | medium |
| Wilmington Senior Tax Assistance Program | benefit | local | medium |
| SCAT – Senior Citizens Affordable Taxi | benefit | state | medium |
| Over-60 Tuition Benefit | benefit | state | deep |
| Assistive Devices Program | benefit | state | deep |

**Types:** {"benefit":15,"employment":1,"resource":1}
**Scopes:** {"state":7,"local":2,"federal":8}
**Complexity:** {"deep":10,"medium":6,"simple":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/DE/drafts.json`.

- **Delaware Medicaid for the Elderly** (benefit) — 5 content sections, 6 FAQs
- **Diamond State HCBS Waiver** (benefit) — 5 content sections, 6 FAQs
- **Delaware PACE** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_type**: 1 programs
- **priority_tier**: 5 programs
- **not_applicable**: 5 programs
- **household_size**: 1 programs
- **household_size|priority_tier|fuel_type**: 1 programs
- **region**: 1 programs
- **fixed**: 3 programs

### Data Shape Notes

Unique structural observations from each program:

- **Delaware Medicaid for the Elderly**: Delaware Medicaid for the elderly is split into two main programs: (1) Nursing Home Medicaid for institutional care and (2) Long-Term Care Community Services (LTCCS) for community-based care. Both have the same 2025 income limit ($2,417.50/month) but different asset limits and service delivery models. Regular ABD Medicaid is a separate program with lower income limits ($967/month) but covers basic healthcare. Income limits are indexed to 250% of SSI federal benefit rate and may change annually. Spousal asset and income treatment differs significantly depending on whether one or both spouses are applying. The program is statewide but LTCCS has geographic service area restrictions. Processing times are variable and not standardized.
- **Diamond State HCBS Waiver**: No separate elderly HCBS waiver; benefits via DSHP Plus LTCCS Program with NFLOC requirement and statewide Medicaid integration; limited slots historically led to waitlists; financials tied to ABD Medicaid with $2,000 single asset cap[6]
- **Delaware PACE**: Limited to specific provider service areas (not statewide); no financial criteria for enrollment but Medicaid needed for free services; requires state-certified nursing facility level of care; private pay option with flat fee
- **Delaware Medicare Savings Programs (QMB, SLMB, QI)**: Delaware's MSP structure is tiered by income level (QMB < SLMB < QI), with benefits decreasing as income increases. The key differentiator is Delaware's elimination of asset limits, which is not standard nationally. The QI program's first-come, first-served funding model creates uncertainty for late applicants. All three programs tie to Medicare Part A enrollment and offer automatic Extra Help for prescription drugs. Processing timelines, specific forms, required documents, and regional office locations are not detailed in available sources and require direct contact with DMAB.
- **Delaware Food First/SNAP**: Expanded eligibility to 200% FPL gross income with no asset test for most; special net income path for elderly/disabled households; categorical eligibility for SSI/TANF/GA; benefits via EBT card scaling by household size, income, and deductions like medical costs.
- **Delaware LIHEAP**: Income at 60% SMI or 200% FPL (updates yearly); benefits scale by income/size/fuel/season; priority tiers for vulnerable; statewide but local agency delivery; no assets test
- **Delaware Weatherization Assistance Program**: Statewide fixed services via single contractor (ECA); income at 200% FPL with household size table; priority tiers by vulnerability (elderly/disabled/children); waitlist and annual reapplication due to funding limits.
- **Delaware Senior Medicare Patrol (SMP/SHIP)**: no income/asset/age test beyond Medicare eligibility; service-based not financial; volunteer-driven outreach statewide via events/phone; often bundled with SHIP counseling[1][2][3][4]
- **Delaware Meals on Wheels**: Delaware Meals on Wheels operates as a decentralized network of regional providers rather than a single statewide program. Eligibility is uniform (age 60+, homebound, unable to cook/shop), but application processes, meal options, and service details vary significantly by county and provider. No income limits exist statewide, which is unusual and important for families to know. The program explicitly prioritizes reaching low-income seniors but does not restrict services based on income[3]. Non-elderly disabled adults have a narrow eligibility pathway requiring SSDI proof and co-residence with an eligible elderly person.
- **Delaware Family Caregiver Support Program**: Administered via Area Agencies on Aging; links to Medicaid waivers for paid family caregiving options; no direct income test specified, but functional/age-based; not statewide uniform in delivery.
- **Delaware Senior Community Service Employment Program (SCSEP)**: Income at 125% FPL (varies by household size/year, no fixed table in sources); priority enrollment tiers; grantee/provider-based (National Able in DE, county offices); funding slots limit access
- **Delaware Long-Term Care Ombudsman Program**: no income test; advocacy-only for LTC facility residents; volunteer-supported with statewide coverage but regional volunteer assignment
- **Delaware Prescription Assistance Program (DPAP)**: Income test at 200% FPL or 40% drug costs; strict Medicare Part D mandate; no assets test; statewide but centralized in New Castle; fiscal year benefits cap per individual
- **Wilmington Senior Tax Assistance Program**: Emergency grant program restricted to Wilmington city homeowners 62+ at risk of foreclosure; high income threshold ($93,725) but requires proof of delinquency and imminent foreclosure.
- **SCAT – Senior Citizens Affordable Taxi**: No income or asset tests; ticket-based discount system requiring photo ID and participating taxis; certification-focused eligibility; statewide but ID pickup limited to two offices
- **Over-60 Tuition Benefit**: Statewide via 3 public institutions; no income/asset test; degree-seeking only; space-available enrollment; institution-specific processes and exclusions
- **Assistive Devices Program**: Tied to DSAAPD for adults with physical disabilities; no fixed income/asset tables provided—'specified financial criteria'; device-specific assessed need required; statewide but location-based access

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Delaware?
