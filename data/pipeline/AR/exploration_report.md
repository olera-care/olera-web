# Arkansas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 7.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 6 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 5 programs
- **in_kind**: 1 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **unknown**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive services including: doctor visits, transportation, home care, primary/preventive/acute/long-term care, all Medicare and Medicaid-approved services, plus additional medically necessary services not typically covered by Medicare/Medicaid as determined by care team[4]. Average participant is 76 years old with multiple complex medical conditions[2].` ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/pace-program-of-all-inclusive-care-for-the-elderly/`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1043` → Source says `$1,235` ([source](https://humanservices.arkansas.gov))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums (~$202.90/month in 2026), annual deductible, coinsurance, copayments for Medicare-covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only. Automatic eligibility for Extra Help with Part D if qualified.[1][2][7]` ([source](https://humanservices.arkansas.gov))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://humanservices.arkansas.gov/services-worth-knowing/snap/))
- **income_limit**: Ours says `$1948` → Source says `$1,305` ([source](https://humanservices.arkansas.gov/services-worth-knowing/snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases. Maximum monthly benefits (Oct 1, 2025–Sept 30, 2026): 1 person $298; 2 $546; 3 $785; 4 varies by size/income (actual amount based on net income, deductions). Can be used at stores; Restaurant Meals Program for eligible elderly/disabled.[3][8]` ([source](https://humanservices.arkansas.gov/services-worth-knowing/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://humanservices.arkansas.gov/services-worth-knowing/snap/`

### LIHEAP (Low-Income Home Energy Assistance Program)

- **income_limit**: Ours says `$3106` → Source says `$2,251` ([source](https://www.adeq.state.ar.us/energy/assistance/liheap.aspx))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Regular: Fixed amount via approved model based on income, household size, energy source (electricity/gas/propane/wood/pellets); max heating $475, min $50; max cooling $287, min $50. Crisis: Up to $500 max (summer/winter) for shut-off, disconnection, depleted fuel, or life-threatening situations[2][1]. Payments direct to vendor. Only 1 regular and 1 crisis per household per season[1]. Benefit matrix from Arkansas Energy Office[8].` ([source](https://www.adeq.state.ar.us/energy/assistance/liheap.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.adeq.state.ar.us/energy/assistance/liheap.aspx`

### Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care and supplemental services (specifics like transportation, housework, meal preparation, medication reminders, medical appointments, managing finances, dressing, managing chronic conditions such as diabetes or dementia; no fixed dollar amounts or hours specified statewide)[2][3].` ([source](https://agingarkansas.org/services/family-caregiver-support/[2]))
- **source_url**: Ours says `MISSING` → Source says `https://agingarkansas.org/services/family-caregiver-support/[2]`

### Arkansas Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free advocacy and complaint resolution services[5]` ([source](Arkansas Department of Health and Human Services (specific URL not provided in search results)))
- **source_url**: Ours says `MISSING` → Source says `Arkansas Department of Health and Human Services (specific URL not provided in search results)`

## New Programs (Not in Our Data)

- **ARChoices in Homecare** — service ([source](https://humanservices.arkansas.gov/wp-content/uploads/ARChoices-Detailed-Overview.pdf or access.arkansas.gov[6]))
  - Shape notes: Tiered by ARIA functional assessment (Tier 2 only); Medicaid financial eligibility via county DHS; services budgeted individually post-assessment; statewide but county-initiated[2][3][4]
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.adeq.state.ar.us/energy/assistance/wap.aspx))
  - Shape notes: Income at 200% FPL with table for household sizes; priority tiers for elderly/disabled/children; delivered via 5-6 regional CAAs statewide; renters require landlord forms; no fixed dollar value per home—needs-based via audit.
- **Senior Medicare Patrol (SMP) / SHIP** — service ([source](https://insurance.arkansas.gov/consumer-assistance/senior-medicare-patrol-smp/))
  - Shape notes: no income or asset test; education and advocacy services only, available statewide to all Medicare beneficiaries without application
- **Meals on Wheels** — service ([source](https://aging.arkansas.gov/ (Arkansas Division of Aging, Adult, and Independent Services; oversees AAAs); state rules at codeofarrules.arkansas.gov[3][7]))
  - Shape notes: Locally administered by AAAs with no uniform statewide application/form/phone; eligibility emphasizes homebound status over income; varies significantly by region/provider with potential waitlists and exceptions for spouses/under-60 disabled
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/senior-community-service-employment-program/))
  - Shape notes: Income test at 125% federal poverty level (varies by household size annually); statewide but centralized intake in Little Rock; employment-focused with priority tiers; no asset limits specified
- **Legal Aid for Seniors in Arkansas (Multiple Programs)** — unknown
  - Shape notes: Arkansas legal aid for seniors is fragmented across multiple organizations with different service areas, eligibility criteria, and specializations. There is no unified intake process, no statewide income table, and no published processing timelines. Families must first identify their county, then contact the appropriate AAA for a referral, then contact the specific legal aid organization. The search results lack granular details (exact income tables by household size, asset limits, specific forms, processing times) needed for a comprehensive guide.

## Program Details

### ARChoices in Homecare

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21-64 with physical disability or 65 and older[1][2][6]+
- Income: Determined by DHS Division of County Operations as Medicaid financial eligibility; specific dollar amounts or household size table not detailed in sources. Home equity limit of $752,000 in 2026 (exempt if spouse or minor/disabled child in home)[2]
- Assets: Standard Medicaid resource limits apply (income and resources as non-functional criteria); specifics not quantified. Home equity capped at $752,000 unless exemptions apply[2][4][5]
- Arkansas resident[1][2]
- Nursing home level of care (intermediate for 21-64 or 65+)[1][2][4]
- Functional need: Unable to perform at least 1 ADL (eating, toileting, transferring/locomotion) without substantial assistance/dependence OR at least 2 ADLs without limited assistance OR Alzheimer's/dementia with cognitive impairment requiring substantial supervision[2][3][4]
- Tier 2 on ARIA assessment (needs match ARChoices or nursing facility services; Tiers 0/1 too low, Tier 3 too high)[2][4]
- Live in home or intent to return[2]

**Benefits:** Home and community-based services including assistance with ADLs (bathing, dressing, mobility, meals, chores); specific services via Person-Centered Service Plan and Individual Services Budget; self-direction option via Independent Choices[1][3][6]
- Varies by: priority_tier

**How to apply:**
- In-person or mail at DHS office in county of residence[3][5]
- Start with Department of County Operations (DCO) for financial eligibility[3]
- Phone: Access Arkansas at 855-372-1084[6]

**Timeline:** Eligibility begins on DCO approval date unless provisional plan of care[5]
**Waitlist:** Not mentioned; potential based on waiver capacity (implied but not explicit)[5]

**Watch out for:**
- Must meet exact Tier 2 on ARIA assessment; Tier 3 needs too high for program[2][4]
- Financial eligibility via Medicaid rules; spend-down or planning may be needed[7]
- Nursing home level of care required, determined by OLTC[2][3]
- Apply first at local DHS county office, not directly to waiver[3][5]
- Excludes those needing skilled care or with certain institutional stays without qualifiers[4][5]

**Data shape:** Tiered by ARIA functional assessment (Tier 2 only); Medicaid financial eligibility via county DHS; services budgeted individually post-assessment; statewide but county-initiated[2][3][4]

**Source:** https://humanservices.arkansas.gov/wp-content/uploads/ARChoices-Detailed-Overview.pdf or access.arkansas.gov[6]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No specific income ceiling for PACE enrollment itself[2]. However, if seeking Medicaid funding, most states use 300% of Federal Benefit Rate (~$2,901/month as of 2025)[3]. Arkansas allows Income Trusts for applicants exceeding Medicaid income limits; contact DHS caseworkers for details[4]. Spousal income division available for participants with spouses in community[4].
- Assets: For Medicaid-funded PACE: $2,000 or less in assets (excluding primary home)[3]. Private pay participants with higher assets may qualify if meeting medical criteria[5].
- Certified by Arkansas Department of Human Services as needing nursing facility level of care[4][5]
- Able to live safely in community setting with PACE support[2][4]
- U.S. citizen or qualified alien[1]
- Arkansas resident living in PACE program service delivery area[1][4]
- Social Security enumeration required[1]
- Cannot be enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, hospice, or certain other programs[2]
- Individuals under 65 must establish disability through SSI/SSA or Medical Review Team[1]

**Benefits:** Comprehensive services including: doctor visits, transportation, home care, primary/preventive/acute/long-term care, all Medicare and Medicaid-approved services, plus additional medically necessary services not typically covered by Medicare/Medicaid as determined by care team[4]. Average participant is 76 years old with multiple complex medical conditions[2].
- Varies by: Individual care plan determined by interdisciplinary team; no fixed tier system described in available sources

**How to apply:**
- In-person: PACE of the Ozarks (Northwest Arkansas) — 813 Founders Park Dr East, Ste 107, Springdale, AR 72762, Phone: (479) 463-6600[4]
- In-person: Total Life Healthcare – St. Bernards Healthcare (Northeast Arkansas) — 505 E. Matthews, Ste 101, Jonesboro, AR 4, Phone: (870) 207-7500[4]
- Phone contact to respective regional provider[4]
- State application through Arkansas Department of Human Services (specific online portal URL not provided in sources)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE is NOT statewide — availability is geographically limited to specific counties[4]. Verify service area before applying.
- Temporary medical conditions lasting 21 days or less do not disqualify; conditions expected to last longer than 21 days may terminate eligibility[1].
- No financial criteria considered for enrollment, BUT cannot enroll if already in Medicare Advantage, prepayment plans, prescription drug plans, or hospice[2].
- Private pay option exists for those not meeting Medicaid financial criteria but meeting medical criteria[5].
- Income Trust option available for those exceeding Medicaid limits — this is a planning tool many families miss[4].
- Approximately 90% of PACE participants are dually eligible for Medicare and Medicaid; enrollment does not require pre-existing Medicare/Medicaid enrollment[2].
- Baptist Health PACE serves only ~3% of eligible seniors in its six-county area, suggesting limited capacity[6].
- State determines nursing facility level of care certification — this is the critical gating factor, not income or assets alone[5].

**Data shape:** PACE in Arkansas is provider-limited (3 known providers), geographically restricted by county, and medically gated (nursing facility level of care certification is mandatory). No income ceiling for PACE itself, but Medicaid funding has income/asset limits with planning workarounds (Income Trusts, spousal division). Processing timelines, waitlists, and specific application forms are not publicly documented in available sources. Eligibility determination mirrors nursing facility services criteria, suggesting families should consult with state DHS caseworkers for individualized assessment.

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
- Income: Arkansas-specific monthly income limits (most recent available from sources, likely 2024-2025; verify current FPL adjustments as limits update annually in April): QMB: $1,235 single / $1,663 couple. SLMB: $1,478 single / $1,992 couple. QI: $1,660 single / $2,239 couple. Limits include $20 general income disregard and may allow higher working income. Must be eligible for Medicare Part A (even if not enrolled).[2]
- Assets: Federal limits apply in Arkansas: $9,090 single / $13,630 couple for QMB/SLMB/QI. Counts: bank accounts, stocks, bonds. Exempt: home, one car, burial plots, life insurance (up to $1,500 face value), personal belongings. Some sources note slight variations like $9,430 single / $14,130 couple or $7,860/$11,800 (older data).[2]
- Eligible for Medicare Part A (enrolled or eligible).
- Arkansas resident.
- U.S. citizen or qualified immigrant.
- Not receiving full Medicaid (QI specifically excludes those eligible for Medicaid).

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums (~$202.90/month in 2026), annual deductible, coinsurance, copayments for Medicare-covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only. Automatic eligibility for Extra Help with Part D if qualified.[1][2][7]
- Varies by: program_tier

**How to apply:**
- Online: Access via Arkansas DHS ACCESS portal (https://access.arkansas.gov).
- Phone: Call Arkansas DHS at 1-800-482-8988.
- Mail/In-person: Local DHS county office or mail form to Arkansas Department of Human Services.
- Form: DCO-0808 'Application for Medicare Savings for Qualified Medicare Beneficiary, Specified Low-Income Medicare Beneficiary, and Qualified Individual'.[10]

**Timeline:** QMB: Up to 45 days, effective first of month after all info received. SLMB/QI: Up to 45 days, retroactive up to 3 months prior.[1]
**Waitlist:** QI: First-come, first-served with priority to prior-year recipients; limited federal funding may create waitlist.

**Watch out for:**
- Income/asset limits update annually (January FPL announcement, effective April); always verify current figures with DHS.
- QI requires annual reapplication, first-come-first-served, and excludes Medicaid-eligible.
- Assets include countable items like second cars/stocks; exemptions often missed (e.g., primary home/car).
- Working disabled may qualify with higher income under certain rules.
- Automatic Extra Help for Rx drugs, but must confirm enrollment.
- Conflicting source data on exact limits/assets due to yearly changes; use DHS for 2026 specifics.

**Data shape:** Tiered by program (QMB/SLMB/QI) with escalating income limits; household size limited to single/couple (no full table for larger households); asset exemptions standard federal; QI has waitlist/priority; statewide but county-administered.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled: No gross income limit; must meet net income limit at or below 100% federal poverty level. Oct 1, 2025–Sept 30, 2026 net income limits (monthly): 1 person $1,305; 2 $1,763; 3 $2,221; 4 $2,680. All other households: Gross ≤130% FPL and net ≤100% FPL. Seniors qualify if 60+ even with Social Security, VA benefits, or disability payments counting as income.[1][2][3][4]
- Assets: Households with member 60+ or disabled: $4,500 (or $3,500 in some references); temporarily $5,500 for first 12 months (once every 5 years), then reverts. Regular households: $3,000. Exempt: Home, some income-producing/inaccessible properties, life insurance, burial spaces, household goods, some vehicles, retirement savings. Non-exempt: Cash, bank accounts, non-exempt property.[3][4]
- U.S. citizen or qualified legal non-citizen
- Arkansas resident
- Household defined as those living together who buy/prepare food together
- Work registration for ages 16-59 unless exempt (seniors 60+ exempt)
- Able-bodied adults 18-54 without dependents must work 20+ hours/week or participate in work program (seniors exempt)
- Not a boarder, ineligible student, disqualified person, or certain institution resident
- Categorically eligible if all receive SSI or household receives TEA (no income/resource test)

**Benefits:** Monthly EBT card benefits for food purchases. Maximum monthly benefits (Oct 1, 2025–Sept 30, 2026): 1 person $298; 2 $546; 3 $785; 4 varies by size/income (actual amount based on net income, deductions). Can be used at stores; Restaurant Meals Program for eligible elderly/disabled.[3][8]
- Varies by: household_size

**How to apply:**
- Online: Access Arkansas (https://access.arkansas.gov)
- Phone: Local DHS office or 1-800-482-8988
- Mail: Send to local DHS office
- In-person: Local DHS County Office

**Timeline:** Benefits issued back to application date if eligible; typical processing 30 days, expedited for urgent cases.

**Watch out for:**
- No broad-based categorical eligibility in AR (uses strict federal asset/income limits, unlike many states)[8]
- Net income calculation complex (deduct shelter, medical >$35/mo for 60+, utilities); use calculator[1]
- Assets temporarily higher only first 12 months/5 years[3]
- Seniors exempt from work rules/gross income test but still need net income ≤100% FPL[1][2]
- Household includes food-sharing members; Social Security counts as income[2]
- Able-bodied adults 18-54 limited to 3 months/36 without 20hr work (seniors exempt)[6][9]

**Data shape:** Elderly/disabled households exempt from gross income test and have higher asset limits; benefits/max income scale by household size; strict federal rules, no BBCE expansion; medical deductions key for seniors.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://humanservices.arkansas.gov/services-worth-knowing/snap/

---

### LIHEAP (Low-Income Home Energy Assistance Program)


**Eligibility:**
- Income: Eligibility is based on 60% of State Median Income (SMI) or 150% of Federal Poverty Guidelines, whichever is higher, varying by household size. Most recent charts (2025): Household of 1: $2,251/month (SMI)[9]; $1,936/month (regional example)[7]; $2,347/month (guide)[2]. Household of 2: $2,944/month (SMI)[9]; $2,531/month[7]; $3,069/month[2]. Household of 3: $3,636/month (SMI)[9]; $3,127/month[7]; $3,791/month[2]. Household of 4: $4,329/month (SMI)[9]; $3,723/month[7]; $4,514/month[2]. Add $672 per additional member[9]. Income is gross monthly countable income for the previous month.
- Assets: Meet countable resource standard, including cash, checking/savings accounts, CDs, cryptocurrency, stocks, bonds. Exact limits not specified in sources; contact local agency[1].
- U.S. citizen or legal resident non-citizen[1].
- Responsible for home energy bill (not paid by non-resident)[1].
- Household defined as all under one roof/one utility meter; all must apply together[1].
- If utilities in rent, provide lease showing energy burden (different for subsidized/unsubsidized)[9].

**Benefits:** Regular: Fixed amount via approved model based on income, household size, energy source (electricity/gas/propane/wood/pellets); max heating $475, min $50; max cooling $287, min $50. Crisis: Up to $500 max (summer/winter) for shut-off, disconnection, depleted fuel, or life-threatening situations[2][1]. Payments direct to vendor. Only 1 regular and 1 crisis per household per season[1]. Benefit matrix from Arkansas Energy Office[8].
- Varies by: household_size|priority_tier|region

**How to apply:**
- Contact Community-Based Organization (CBO) serving your county for instructions (in-person, phone, mail); find via ADEQ site[4][5].
- Download LIHEAP Application Form from local providers (e.g., crdcnea.tech, eoawc.org)[7][8].

**Timeline:** Varies; can take longer due to high volume[8]. No statewide standard specified.
**Waitlist:** Funding limited; applications may close early if funds exhausted. Program dates: Heating Jan-Mar, Cooling Jul-Aug, Crisis Jan-Apr/Jul-Sep (dates approximate, not deadlines)[2].

**Watch out for:**
- Household = all under one roof/one meter; roommates count even if not sharing expenses[1][2].
- Only 1 regular + 1 crisis benefit per season per household[1].
- Must be responsible for bill; not if paid by non-resident[1].
- Funds limited; apply early as programs close when exhausted[2].
- Seasonal: Not year-round; separate heating/cooling/crisis periods[2].
- Regional income charts differ; verify with your CBO[7][9].
- Crisis only for emergencies like shut-off/depletion[1].

**Data shape:** Administered by county CBOs with varying income charts and providers; benefits via state matrix scaling by income/size/fuel; seasonal with funding caps; dual regular/crisis tiers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.adeq.state.ar.us/energy/assistance/liheap.aspx

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households with incomes at or below 200% of the Federal Poverty Guidelines. Specific maximum gross annual income guidelines (likely for recent year): 1: $23,760; 2: $32,040; 3: $40,320; 4: $48,600; 5: $56,880; 6: $65,160; 7: $73,460; 8: $81,780. These scale with additional household members[1][2][3].
- Assets: No asset limits mentioned in available sources.
- Households with a member receiving SSI are categorically eligible[1][3].
- Priority given to elderly (over 60), disabled, children under 7, Native Americans due to limited funding[1][2][3].
- Must live in eligible housing (single-family homes, apartments, manufactured homes; renters need landlord Lessor Agreement and Tenant’s Rights form)[3][4][7].
- Proof of household income required[1][3].

**Benefits:** Free full-scale home energy conservation services including: on-site energy audits by DOE-trained auditors, attic and wall insulation, weather-stripping doors/windows, caulking/sealing cracks, storm window installation, furnace retrofitting/repairs, new energy-efficient heating equipment, health/safety upgrades, and minor repairs if needed. All at no cost to occupants[1][2][3][4][5].
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (CAA): Find via https://www.acaaa.org/[1][2].
- In-person/mail/online/forms via specific providers (e.g., BCD: Lessor Agreement and Tenant’s Rights form; CSCDC: Weatherization Application requiring 12 months utility bills)[3][8].
- Arkansas Energy Office oversees: https://www.adeq.state.ar.us/energy/assistance/wap.aspx[4].

**Timeline:** Not specified; after eligibility, local agency schedules energy inspection, then work by crews/contractors[1][4].
**Waitlist:** Possible due to limited funding; priority points awarded but not detailed[1].

**Watch out for:**
- Renters need landlord approval via Lessor Agreement[3].
- Priority for elderly/disabled/young children but SSI auto-eligible; others may face waitlists due to funding limits[1][3].
- Not immediate; involves audit and scheduling[1][4].
- Separate from utility-specific programs like Entergy Low-Income Solutions (requires LIHEAP or head 65+)[7].
- Must provide detailed income/utility proof[3][8].

**Data shape:** Income at 200% FPL with table for household sizes; priority tiers for elderly/disabled/children; delivered via 5-6 regional CAAs statewide; renters require landlord forms; no fixed dollar value per home—needs-based via audit.

**Source:** https://www.adeq.state.ar.us/energy/assistance/wap.aspx

---

### Senior Medicare Patrol (SMP) / SHIP

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, families, and caregivers
- Assets: No asset limits or tests
- Must be a Medicare beneficiary, family member, or caregiver in Arkansas

**Benefits:** Free one-on-one counseling, education, outreach presentations, and advocacy to prevent, detect, and report Medicare fraud, errors, and abuse; health insurance counseling via SHIP component; group education events and materials dissemination

**How to apply:**
- Phone: 1-866-726-2916 (Arkansas SMP)
- Phone: 1-800-224-6330 (Arkansas SHIP)
- Email: insurance.smp@arkansas.gov
- Contact: Kathleen Pursell at (501) 534-4070 or kathleen.pursell@arkansas.gov

**Timeline:** Immediate assistance available via phone or email; no formal application processing

**Watch out for:**
- Not a financial assistance or healthcare provision program—focuses solely on fraud prevention, education, and counseling; volunteers provide services, not paid staff; often paired with SHIP but SMP specifically targets fraud detection; no enrollment process, just contact for help

**Data shape:** no income or asset test; education and advocacy services only, available statewide to all Medicare beneficiaries without application

**Source:** https://insurance.arkansas.gov/consumer-assistance/senior-medicare-patrol-smp/

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No means test required under Older Americans Act funding (primary source); some programs may apply means test for SSBG-funded meals, but no specific dollar amounts or household size tables provided[3][7].
- Assets: No asset limits or tests mentioned; not applicable under primary funding[3][7].
- Homebound due to illness, incapacitation, disability, frailty, or isolation[1][2][3][5][7][8][9]
- Unable to prepare nutritious meals safely due to mobility, psychological/mental impairment, or lack of knowledge[3][5][7]
- No adequate caregiver, family, friends, or community resources to provide meals[1][3][7]
- Live within the local delivery/service area[1][2][3]
- Primary target: greatest economic/social needs, low-income, minority elderly, increased nutritional risk[7]
- Spouse of eligible 60+ participant may qualify if in best interest[7][8]
- Disabled persons under 60 residing with eligible participant may qualify with AAA approval[7]
- Some exceptions for under 60 if homebound/unable to shop due to mobility issues[4]

**Benefits:** Home-delivered nutritious meals (typically 1 hot meal per weekday delivery; menus approved by registered dietitian); may include supportive services like safety checks; no specific dollar value or hours stated[3][9]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) chapter via phone or in-person for assessment and application[3][5]
- No statewide online application or specific URL; use local AAA (e.g., Arkansas Association of Area Agencies on Aging for locations)[3]
- May require referral from doctor or social worker in some programs[5]
- Assessment includes health, mobility, dietary needs evaluation[2][3][5]

**Timeline:** Varies; some within a week, longer if waitlist[2]
**Waitlist:** Possible in some programs, especially high-demand areas; varies by local provider[2]

**Watch out for:**
- Not income-based (common misconception); focus on homebound/need, not poverty[3]
- Must be in specific delivery zone; no statewide uniformity—contact local AAA first[1][2][3]
- Mobile seniors may only qualify for congregate meals at centers, not home delivery[3][5]
- Spouses/dependents not automatically eligible; requires assessment[7]
- Some programs need doctor referral; processing/waitlists vary regionally[2][5]
- Car ownership or ability to leave home may disqualify[2]

**Data shape:** Locally administered by AAAs with no uniform statewide application/form/phone; eligibility emphasizes homebound status over income; varies significantly by region/provider with potential waitlists and exceptions for spouses/under-60 disabled

**Source:** https://aging.arkansas.gov/ (Arkansas Division of Aging, Adult, and Independent Services; oversees AAAs); state rules at codeofarrules.arkansas.gov[3][7]

---

### Family Caregiver Support Program


**Eligibility:**
- Age: 60+
- Income: No income restrictions or limits apply[2][3].
- Assets: No asset limits or tests apply[2].
- Care recipient must be 60+ years old (or any age if diagnosed with Alzheimer's or another type of dementia)[2][3].
- Care recipient must be frail and functionally impaired: unable to perform at least 2 activities of daily living (ADLs) without substantial assistance (verbal reminding, physical cueing, or supervision), or require substantial supervision due to cognitive/mental impairment posing serious health/safety risk to self or others[3].
- Caregiver must be an adult family member or other individual providing informal in-home/community care[3].
- Alternative: Grandparents or relatives 55+ who are primary caregivers for a child (blood, marriage, adoption) where parents are unable/unwilling, with legal relationship or informal raising[3].

**Benefits:** Respite care and supplemental services (specifics like transportation, housework, meal preparation, medication reminders, medical appointments, managing finances, dressing, managing chronic conditions such as diabetes or dementia; no fixed dollar amounts or hours specified statewide)[2][3].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) providers via agingarkansas.org/services/family-caregiver-support/[2].
- Regional examples: Alzheimer's Arkansas Programs and Services at 201 Markham Center Drive, Little Rock AR 72205 for specific counties (Pulaski, Saline, Monroe, Prairie, Lonoke, Faulkner)[5].
- Phone and in-person via local AAAs or Alzheimer's Arkansas (specific numbers not listed; use agingarkansas.org for contacts)[2][5].

**Timeline:** Not specified in sources.

**Watch out for:**
- No income/asset tests, but care recipient cannot receive duplicate services from Medicaid, Medicare, insurance, etc.[5].
- Dementia cases have no age minimum[2].
- Services are non-financial (respite/supplemental), not paid caregiving (separate from Medicaid programs like Arkansas Independent Choices)[7].
- Regional administration means contacting local AAA essential; not all areas may offer identical services[2][5].
- Functional impairment strictly defined (2+ ADLs or supervision need)[3].

**Data shape:** Administered via 9 regional Area Agencies on Aging; no statewide income/asset test; eligibility hinges on functional impairment and no duplicate funding; dementia bypasses age limit; local variations in providers and forms.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://agingarkansas.org/services/family-caregiver-support/[2]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 125% of the current Health and Human Services Poverty Guidelines. Exact dollar amounts vary annually and by household size; families must check current federal poverty guidelines (e.g., via HHS website) and calculate 125% threshold. No specific table provided in Arkansas sources, but applies statewide.
- Resident of the State of Arkansas
- Not currently employed at the time of application
- Low employment prospects (inherent to program design)

**Benefits:** Part-time paid work (average 20 hours per week) at non-profit or public service host agencies (e.g., schools, hospitals, senior centers); paid the higher of federal, state, or local minimum wage; on-the-job training; job search skills development; assistance from Employment and Training Coordinator to find permanent unsubsidized part-time or full-time employment.

**How to apply:**
- Phone: (501) 320-6586
- Email: [email protected]
- Mail: P.O. Box 1437, Slot S530, Little Rock, Arkansas 72203-1437
- In-person: Arkansas Department of Human Services, 700 Main Street, 5th Floor, Little Rock, Arkansas 72201

**Timeline:** Not specified; if eligible and no waiting list, enrollment follows application.
**Waitlist:** Possible waiting list if program capacity is full (common in SCSEP nationally).

**Watch out for:**
- Must be unemployed at time of application (not just low-income)
- Income limit is 125% of federal poverty guidelines (check current HHS table for exact $ amounts by household size)
- Priority enrollment for veterans/qualified spouses, those over 65, disabled, rural residents, homeless/at-risk, low literacy/limited English, poor employment prospects, or American Job Center users
- Temporary program bridging to unsubsidized employment; not permanent income source
- Potential waitlist due to funding/capacity limits
- Wage is minimum (higher of federal/state/local), so modest pay

**Data shape:** Income test at 125% federal poverty level (varies by household size annually); statewide but centralized intake in Little Rock; employment-focused with priority tiers; no asset limits specified

**Source:** https://humanservices.arkansas.gov/divisions-shared-services/aging-adult-behavioral-health-services/find-home-community-based-services-for-adults-seniors/senior-community-service-employment-program/

---

### Legal Aid for Seniors in Arkansas (Multiple Programs)

> **NEW** — not currently in our data

**Watch out for:**
- Arkansas does NOT have a single unified 'Area Agency Program' for legal aid — seniors must navigate multiple separate organizations[1][2][3]
- AVLE does NOT serve 8 counties in Central Arkansas; those counties must use Central Arkansas Legal Services instead[3]
- Center for Arkansas Legal Services (River Valley) is permanently closed as of 12/31/2025[10]
- Area Agencies on Aging are referral points, NOT direct legal service providers[2][6]
- Income limits are based on Federal Poverty Guidelines but exact dollar amounts are not provided in public materials — you must call to verify your household's eligibility[9]
- Processing times and waitlists are not publicly disclosed in search results
- Some services are FREE; others are 'low-cost' but the cost structure is not detailed in search results[2]
- Legal Aid of Arkansas focuses on civil matters only — criminal legal issues are not covered[5]

**Data shape:** Arkansas legal aid for seniors is fragmented across multiple organizations with different service areas, eligibility criteria, and specializations. There is no unified intake process, no statewide income table, and no published processing timelines. Families must first identify their county, then contact the appropriate AAA for a referral, then contact the specific legal aid organization. The search results lack granular details (exact income tables by household size, asset limits, specific forms, processing times) needed for a comprehensive guide.

---

### Arkansas Long-Term Care Ombudsman Program


**Eligibility:**

**Benefits:** Free advocacy and complaint resolution services[5]

**How to apply:**
- Call local ombudsman (number posted in facility)[5]
- Contact through Area Agency on Aging[1]

**Timeline:** Not specified in search results

**Watch out for:**
- This is NOT a program to help families access long-term care—it's a service FOR residents already in facilities[5][6]
- There is no application or eligibility determination process[5]
- Ombudsmen are advocates, not decision-makers; they investigate complaints and work toward resolution[1]
- If a facility denies access to an ombudsman, the State Ombudsman can seek court orders and request sanctions[3]

**Data shape:** This program is a free, universal advocacy service with no eligibility barriers. It exists to protect residents' rights within facilities, not to determine who can access long-term care.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** Arkansas Department of Health and Human Services (specific URL not provided in search results)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| ARChoices in Homecare | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Senior Medicare Patrol (SMP) / SHIP | benefit | federal | medium |
| Meals on Wheels | benefit | federal | deep |
| Family Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | medium |
| Legal Aid for Seniors in Arkansas (Multi | resource | state | simple |
| Arkansas Long-Term Care Ombudsman Progra | resource | federal | simple |

**Types:** {"benefit":9,"employment":1,"resource":2}
**Scopes:** {"state":3,"local":1,"federal":8}
**Complexity:** {"deep":8,"medium":2,"simple":2}

## Content Drafts

Generated 12 page drafts. Review in admin dashboard or `data/pipeline/AR/drafts.json`.

- **ARChoices in Homecare** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **LIHEAP (Low-Income Home Energy Assistance Program)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 4 content sections, 6 FAQs
- **Senior Medicare Patrol (SMP) / SHIP** (benefit) — 2 content sections, 6 FAQs
- **Meals on Wheels** (benefit) — 3 content sections, 6 FAQs
- **Family Caregiver Support Program** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Legal Aid for Seniors in Arkansas (Multiple Programs)** (resource) — 1 content sections, 6 FAQs
- **Arkansas Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 2 programs
- **Individual care plan determined by interdisciplinary team; no fixed tier system described in available sources**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 3 programs
- **region**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **ARChoices in Homecare**: Tiered by ARIA functional assessment (Tier 2 only); Medicaid financial eligibility via county DHS; services budgeted individually post-assessment; statewide but county-initiated[2][3][4]
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE in Arkansas is provider-limited (3 known providers), geographically restricted by county, and medically gated (nursing facility level of care certification is mandatory). No income ceiling for PACE itself, but Medicaid funding has income/asset limits with planning workarounds (Income Trusts, spousal division). Processing timelines, waitlists, and specific application forms are not publicly documented in available sources. Eligibility determination mirrors nursing facility services criteria, suggesting families should consult with state DHS caseworkers for individualized assessment.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with escalating income limits; household size limited to single/couple (no full table for larger households); asset exemptions standard federal; QI has waitlist/priority; statewide but county-administered.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled households exempt from gross income test and have higher asset limits; benefits/max income scale by household size; strict federal rules, no BBCE expansion; medical deductions key for seniors.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: Administered by county CBOs with varying income charts and providers; benefits via state matrix scaling by income/size/fuel; seasonal with funding caps; dual regular/crisis tiers
- **Weatherization Assistance Program (WAP)**: Income at 200% FPL with table for household sizes; priority tiers for elderly/disabled/children; delivered via 5-6 regional CAAs statewide; renters require landlord forms; no fixed dollar value per home—needs-based via audit.
- **Senior Medicare Patrol (SMP) / SHIP**: no income or asset test; education and advocacy services only, available statewide to all Medicare beneficiaries without application
- **Meals on Wheels**: Locally administered by AAAs with no uniform statewide application/form/phone; eligibility emphasizes homebound status over income; varies significantly by region/provider with potential waitlists and exceptions for spouses/under-60 disabled
- **Family Caregiver Support Program**: Administered via 9 regional Area Agencies on Aging; no statewide income/asset test; eligibility hinges on functional impairment and no duplicate funding; dementia bypasses age limit; local variations in providers and forms.
- **Senior Community Service Employment Program (SCSEP)**: Income test at 125% federal poverty level (varies by household size annually); statewide but centralized intake in Little Rock; employment-focused with priority tiers; no asset limits specified
- **Legal Aid for Seniors in Arkansas (Multiple Programs)**: Arkansas legal aid for seniors is fragmented across multiple organizations with different service areas, eligibility criteria, and specializations. There is no unified intake process, no statewide income table, and no published processing timelines. Families must first identify their county, then contact the appropriate AAA for a referral, then contact the specific legal aid organization. The search results lack granular details (exact income tables by household size, asset limits, specific forms, processing times) needed for a comprehensive guide.
- **Arkansas Long-Term Care Ombudsman Program**: This program is a free, universal advocacy service with no eligibility barriers. It exists to protect residents' rights within facilities, not to determine who can access long-term care.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Arkansas?
