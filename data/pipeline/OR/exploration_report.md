# Oregon Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 1.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 11 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 5 programs
- **in_kind**: 1 programs
- **financial**: 3 programs
- **service|advocacy|support**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Family Caregiver Support Program (FCSP)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Specific services not detailed in search results. Program described as helping caregivers 'support their loved ones and themselves' and taking 'burdens off unpaid caregivers,' but actual service offerings (respite care, counseling, support groups, training, etc.) are not enumerated in provided documentation.` ([source](https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/family-caregiver-program.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/family-caregiver-program.aspx`

## New Programs (Not in Our Data)

- **Oregon Health Plan (OHP)** — service ([source](https://www.oregon.gov/oha/hsd/ohp/pages/apply.aspx))
  - Shape notes: Dual structure: MAGI for most (no assets, FPL-based scaling by household size) vs. ABD/OSIPM for elderly/disabled (FBR income, $2,000 assets, level-of-care test); benefits via regional CCOs; long-term care focus for seniors with specific exemptions
- **OPI-M (Medicaid-funded)** — service ([source](https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/opi-m-application.pdf (application); OAR 411-014-0020 (rules)))
  - Shape notes: Income/assets higher than standard Medicaid LTSS; continuous 24-month eligibility; caregiver supports included; priority levels 1-18 determine services; local APD administration with statewide rules
- **Program of All-Inclusive Care for the Elderly (PACE)** — in_kind ([source](https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/pace-fact-sheet.pdf and https://secure.sos.state.or.us/oard/viewSingleRule.action?ruleVrsnRsn=89486))
  - Shape notes: PACE is a fixed-benefit, all-inclusive program with no tiered benefits or sliding scales. Eligibility is binary (meets all requirements or does not). The program's key structural feature is that it combines insurance (coverage) with direct service provision, making it both a payer and a provider. No income or asset limits exist for PACE enrollment itself, but Medicaid-funded participants must meet Medicaid's income and asset limits. Geographic availability is highly restricted to specific service areas, and rural access is limited. Critical gaps in provided search results: specific application contact information, processing timelines, required documentation, current wait times, and detailed regional provider information are not available.
- **Medicare Savings Programs (MSP)** — financial ([source](https://www.oregon.gov/odhs/aging-disability-services/pages/medicare-savings-programs.aspx))
  - Shape notes: Tiered by income (QMB <100% FPL, SLMB 100-120%, QI/SMF 120-135% FPL) with no asset test; benefits scale by tier (QMB fullest, others Part B only); QI/SMF slot-limited; statewide uniform rules but local admin; annual FPL adjustments.
- **SNAP Food Benefits** — financial ([source](https://www.oregon.gov/odhs/food/pages/snap.aspx))
  - Shape notes: Elderly 60+ exempt gross income test, medical/shelter deductions boost benefits; varies by household size and elderly/disabled status; regional cash/direct deposit for specific counties
- **Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)** — financial ([source](https://www.oregon.gov/ohcs/energy-weatherization/))
  - Shape notes: This program's data structure is complex due to regional administration through local Community Action Agencies. Income limits scale by household size with specific dollar thresholds. Benefits are fixed maximum amounts ($750 for regular heating/cooling, $750 for crisis) but calculated based on household characteristics. No statewide online application portal exists; families must contact their local agency. Waitlist availability and processing times vary significantly by region and funding year. The program includes multiple components (regular LIHEAP, crisis LIHEAP, weatherization) with potentially different eligibility or application processes. Household composition for LIHEAP purposes differs from other benefit programs, creating potential confusion for families applying to multiple programs.
- **Weatherization Assistance Program** — service ([source](https://www.oregon.gov/ohcs/energy-weatherization/Pages/default.aspx))
  - Shape notes: Administered statewide by OHCS via local subgrantees/CAAs with county-specific contacts; priority-based with waitlists; income fixed at 200% FPL, benefits via energy audit.
- **Senior Health Insurance Benefits Assistance (SHIBA)** — service ([source](https://shiba.oregon.gov))
  - Shape notes: no income or asset test; volunteer-delivered statewide counseling network with local access points; services fixed and free for all Medicare enrollees
- **Meals on Wheels** — service ([source](https://www.oregon.gov/odhs/aging-disability-services/pages/meals-nutrition.aspx[7]; Medicaid standards: https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/medicaid-home-delivered-meals-standards-and-responsibilities.pdf[3]))
  - Shape notes: Decentralized by local providers/regions with no uniform income/asset tests; Medicaid HDM ties to case management assessments; mixes OAA (need-based) and Medicaid (authorized service) streams
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/senior-employment.aspx))
  - Shape notes: Federally standardized (DOL/OAA) but locally grantee-run (Easter Seals Oregon); income at 125% FPL (annual federal update); priority enrollment tiers; no asset limits or household-size dollar tables in state sources—requires cross-referencing HHS poverty guidelines.
- **Long-term Care Ombudsman Program** — advocacy ([source](https://www.oltco.org/programs/ltco-about-us.html))
  - Shape notes: no income test; advocacy-only for facility residents; relies on volunteer network; free and statewide with no waitlist or financial eligibility

## Program Details

### Oregon Health Plan (OHP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For elderly (65+) applying for long-term care via OSIPM (Oregon Supplemental Income Program-Medical): Single applicant income under $2,982/month in 2026. Couples: $1,450/month based on Federal Benefit Rate (FBR) for ABD category in 2025, subject to updates. General OHP Plus for adults 19-64: up to 138% FPL (~$1,800/month for household of 1; $2,674 for OHP Bridge up to 200% FPL). Limits vary by household size, program (OHP Plus, Bridge), and category (MAGI vs. ABD). Full table example from CareOregon for adults: Household 1 - OHP Plus $1,800/mo, Bridge $2,674/mo[6][4][3]. Nursing home applicants must meet Nursing Home Level of Care.
- Assets: For elderly long-term care (OSIPM): $2,000 for single applicants. Counts: most financial assets. Exempt: primary home (if intent to return), one vehicle, personal belongings, burial plots, life insurance up to $1,500 face value. Spousal protections apply for couples[4].
- Oregon resident
- U.S. citizen or qualified immigrant (as of July 2023, any immigration status may qualify for full benefits)
- For long-term care: Nursing Home Level of Care or equivalent need for services like assisted living, adult foster care, or home-based care
- Blind, disabled, or aged 65+
- Not eligible if receiving Medicare without specific dual coverage rules

**Benefits:** Comprehensive no-cost coverage: medical, dental, prescription drugs, behavioral health, long-term care services (nursing home, assisted living, adult foster care, home-based non-medical support for frail seniors). Nursing home residents keep ~$77/month personal needs allowance ($90 with VA pension). Varies by coordinated care organization (CCO)[5][7][4].
- Varies by: priority_tier

**How to apply:**
- Online: ONE.Oregon.gov or Benefits.Oregon.gov
- Phone: 1-800-699-9075 (ONE Customer Service); for older adults/disabilities: 1-855-ORE-ADRC (855-673-2372)
- Mail: OHP Customer Service, P.O. Box (specific address via phone)
- In-person: Local Oregon Department of Human Services (ODHS) office or Aging and Disability Resource Connection (ADRC)

**Timeline:** Not specified in sources; apply anytime year-round

**Watch out for:**
- Separate rules for elderly/long-term care (OSIPM/ABD) vs. general OHP Plus (MAGI-based); asset limits apply strictly to long-term care, not general OHP; must prove 'Nursing Home Level of Care' for facility/home services; OHP Bridge (up to 200% FPL) starts July 2024 for adults; dual Medicare-Medicaid has limited drug coverage; income calculated as current/next/annual depending on program[3][4][10]; spend-down or spousal protections needed if over limits

**Data shape:** Dual structure: MAGI for most (no assets, FPL-based scaling by household size) vs. ABD/OSIPM for elderly/disabled (FBR income, $2,000 assets, level-of-care test); benefits via regional CCOs; long-term care focus for seniors with specific exemptions

**Source:** https://www.oregon.gov/oha/hsd/ohp/pages/apply.aspx

---

### OPI-M (Medicaid-funded)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18 or older (60+ or 18-59 with physical disability; exclusions for under 60 with intellectual/developmental disability, or mental/emotional/substance use disorder unless specific criteria met)+
- Income: Up to 400% of Federal Poverty Level (FPL), adjusted annually. 2025: $5,217/month for individual. For couples: $5,637/month (2022 figure; only applicant's income counted, spouse's disregarded). Varies by year and household (spousal rules differ from other Medicaid programs—no spousal allowance).
- Assets: Up to equivalent of six months of Medicaid nursing facility costs (exact amount not specified in sources; higher than other Medicaid LTSS programs). Lives in own home or with loved one (not assisted living, residential care, or adult foster homes).
- Oregon resident
- Functional need: Assistance with Activities of Daily Living (ADLs: transferring, mobility, eating, toileting, bathing, dressing) and meet Service Priority Levels 1-18
- Not receiving other Medicaid LTSS (e.g., SPPC, APD Waiver, 1915(i/j/k) state plan, Healthier Oregon) or duplicative OPI/OAA services simultaneously (can choose OPI-M instead)
- For 18-59: Meet OSIPM disability criteria (OAR 461-125-0370)
- Continuous 24-month coverage even if income/assets change

**Benefits:** In-home support/personal care services (to maintain/strengthen/restore functioning at home); community services like emergency response systems, meal delivery, home safety modifications; supports for family caregivers (flexible definition: unpaid caregivers providing 10+ hours/week in-person care for 3+ months, including non-relatives, hospice cases, new diagnoses). No fee; no Medicaid Estate Recovery.
- Varies by: priority_tier

**How to apply:**
- In-person: Local Aging and People with Disabilities (APD) office (find via https://www.oregon.gov/odhs/pages/office-finder.aspx)
- Mail or in-person delivery: Download OPI-M application from https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/opi-m-application.pdf and submit to APD office
- Phone: Call local APD office for eligibility/application questions
- Referral process: Via ECM at local APD for financial/service eligibility; full Medicaid determination via ONE system recommended first

**Timeline:** Not specified; requires in-home assessment scheduled with Case Manager

**Watch out for:**
- Cannot receive simultaneously with other Medicaid LTSS (must choose OPI-M)
- Excludes under 60 with IDD, or mental/substance disorders unless exceptions met
- No Nursing Facility Level of Care required (unique: ADL/service priority only)
- Spouse income disregarded but no spousal allowance (unlike other programs)
- 24-month continuous eligibility despite changes (advantage over others)
- No estate recovery (beneficiary-friendly)
- Caregiver supports flexible but requires 10+ hours/week in-person
- 2022 income figures outdated; confirm current 400% FPL via APD

**Data shape:** Income/assets higher than standard Medicaid LTSS; continuous 24-month eligibility; caregiver supports included; priority levels 1-18 determine services; local APD administration with statewide rules

**Source:** https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/opi-m-application.pdf (application); OAR 411-014-0020 (rules)

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for PACE enrollment itself[1]. However, if applying through Medicaid, Oregon's long-term care Medicaid eligibility (as of 2025) requires income under 300% of the Federal Benefit Rate ($2,901/month) and assets of $2,000 or less (excluding primary home)[7]. Medicare eligibility requires applicants to be U.S. citizens or legal residents for 5 years prior to application[7].
- Assets: No asset limits for PACE enrollment itself[1]. Asset limits apply only if seeking Medicaid coverage: $2,000 or less (excluding primary home)[7].
- Must be certified by the state as needing Nursing Facility Level of Care (NFLOC), defined as the kind of care and supervision normally associated with a nursing home[1]. Oregon assesses this at Service Priority Level 1-13[2][3].
- Must be able to reside safely in the community with PACE support at time of enrollment[1][4][6]. This is the only cause for denial[6].
- Must live in a PACE program service area[1][4][8].
- Must be willing to receive all health and long-term care services exclusively from the PACE program and its contracted or referred providers[4].
- Must be Medicaid-eligible OR willing to pay private fees[4]. Medicaid enrollment is not required[1].

**Benefits:** All-inclusive coverage with no deductibles or co-pays for any care, medication, or service provided by the PACE interdisciplinary team[1]. Services include: adult day services, in-home services, nursing home care, palliative care, medical equipment and supplies, medical care and prescription coverage, medical clinic services at Health & Social Centers, long-term care services, and CBC facility care[3]. Care coordination occurs through an interdisciplinary team including medical doctors, registered nurses, licensed therapists, licensed social workers, therapeutic aides, dieticians, and other health care professionals[2].
- Varies by: fixed

**How to apply:**
- S
- e
- a
- r
- c
- h
-  
- r
- e
- s
- u
- l
- t
- s
-  
- d
- o
-  
- n
- o
- t
-  
- p
- r
- o
- v
- i
- d
- e
-  
- s
- p
- e
- c
- i
- f
- i
- c
-  
- p
- h
- o
- n
- e
-  
- n
- u
- m
- b
- e
- r
- s
- ,
-  
- w
- e
- b
- s
- i
- t
- e
-  
- U
- R
- L
- s
- ,
-  
- m
- a
- i
- l
-  
- a
- d
- d
- r
- e
- s
- s
- e
- s
- ,
-  
- o
- r
-  
- i
- n
- -
- p
- e
- r
- s
- o
- n
-  
- o
- f
- f
- i
- c
- e
-  
- l
- o
- c
- a
- t
- i
- o
- n
- s
-  
- f
- o
- r
-  
- O
- r
- e
- g
- o
- n
-  
- P
- A
- C
- E
-  
- a
- p
- p
- l
- i
- c
- a
- t
- i
- o
- n
- [
- 1
- ]
- [
- 2
- ]
- [
- 3
- ]
- [
- 4
- ]
- [
- 5
- ]
- [
- 6
- ]
- .
-  
- R
- e
- s
- u
- l
- t
- s
-  
- i
- n
- d
- i
- c
- a
- t
- e
-  
- t
- h
- a
- t
-  
- i
- n
- d
- i
- v
- i
- d
- u
- a
- l
- s
-  
- m
- u
- s
- t
-  
- b
- e
-  
- a
- s
- s
- e
- s
- s
- e
- d
-  
- b
- y
-  
- '
- t
- h
- e
-  
- l
- o
- c
- a
- l
-  
- D
- e
- p
- a
- r
- t
- m
- e
- n
- t
- /
- A
- A
- A
-  
- a
- g
- e
- n
- c
- y
- '
-  
- (
- A
- r
- e
- a
-  
- A
- g
- e
- n
- c
- y
-  
- o
- n
-  
- A
- g
- i
- n
- g
- )
- [
- 4
- ]
- ,
-  
- b
- u
- t
-  
- s
- p
- e
- c
- i
- f
- i
- c
-  
- c
- o
- n
- t
- a
- c
- t
-  
- i
- n
- f
- o
- r
- m
- a
- t
- i
- o
- n
-  
- i
- s
-  
- n
- o
- t
-  
- i
- n
- c
- l
- u
- d
- e
- d
-  
- i
- n
-  
- p
- r
- o
- v
- i
- d
- e
- d
-  
- s
- o
- u
- r
- c
- e
- s
- .

**Timeline:** Not specified in search results.
**Waitlist:** Not specified in search results.

**Watch out for:**
- PACE requires exclusive use of PACE providers: participants must receive all health and long-term care services exclusively from the PACE program and its contracted or referred providers[4]. This is a binding commitment.
- Nursing Facility Level of Care (NFLOC) is a state certification, not a medical diagnosis. States define and measure NFLOC differently[1]. Oregon uses Service Priority Level 1-13 assessment[2][3].
- Ability to live safely in the community is the only stated cause for denial, but this determination is subjective and can be appealed[6].
- PACE is not tied to state Medicaid waiver programs[7]. In states with waitlists for HCBS Medicaid Waivers, PACE may provide an alternative, but this is not guaranteed.
- Private pay option exists but specific monthly premium amounts are not provided in search results[1].
- Search results indicate PACE was operating in 31 states serving over 49,000 participants as of one document's publication[3], but current national and Oregon-specific enrollment numbers are not provided.
- Medicare eligibility requires 5-year residency as a U.S. citizen or legal resident[7], which is separate from PACE eligibility but relevant for dual-eligible participants.

**Data shape:** PACE is a fixed-benefit, all-inclusive program with no tiered benefits or sliding scales. Eligibility is binary (meets all requirements or does not). The program's key structural feature is that it combines insurance (coverage) with direct service provision, making it both a payer and a provider. No income or asset limits exist for PACE enrollment itself, but Medicaid-funded participants must meet Medicaid's income and asset limits. Geographic availability is highly restricted to specific service areas, and rural access is limited. Critical gaps in provided search results: specific application contact information, processing timelines, required documentation, current wait times, and detailed regional provider information are not available.

**Source:** https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/pace-fact-sheet.pdf and https://secure.sos.state.or.us/oard/viewSingleRule.action?ruleVrsnRsn=89486

---

### Medicare Savings Programs (MSP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Oregon MSP has four tiers with monthly gross income limits (effective around March 2026, including $20 general disregard and additional disregards for earned income; limits adjust annually with Federal Poverty Level announced in February). From official Oregon DHS [3][9]:
- **QMB**: $1,330 individual / $1,804 couple (100% FPL). Helps with Part A/B premiums, deductibles, coinsurance.
- **SLMB (SMB in Oregon)**: $1,596 individual / $2,164 couple (120% FPL). Part B premiums.
- **QI (SMF in Oregon)**: $1,796 individual / $2,435 couple (135% FPL). Part B premiums; limited slots, enrollment may close.
Other sources show slight variations (e.g., [2] $1,235/$1,663 QMB, [9] $1,616/$2,184 SLMB), use official DHS for applications as limits update yearly. Household size beyond couple not detailed; typically individual or couple. Must be eligible for (not necessarily enrolled in) Medicare Part A [3][5]. Not eligible for SMF if receiving other Oregon Medicaid [1][3].
- Assets: No asset limits for MSP (QMB, SLMB/SMB, QI/SMF) in Oregon [2][3][5]. (Note: Separate programs like Extra Help/LIS have assets ≤$18,090 single/$36,100 couple [9].)
- Eligible for Medicare Part A (hospital insurance) [1][3][5][6].
- Not eligible for SMF/QI if receiving other Oregon Medicaid benefits [1][3].
- For QMB-SMB/SMF variants, additional restrictions (e.g., nursing facility residents ineligible if income ≥120% FPL) [1].
- Oregon uses gross income minus $20 disregard (more for earned income) [5].

**Benefits:** **QMB**: Pays Medicare Part A premiums (if owed), Part B premiums, Part A/B deductibles, coinsurance [2][3]. **SLMB/SMB**: Pays Part B premiums [2][3]. **QI/SMF**: Pays Part B premiums [2][3]. State pays directly to Medicare; providers cannot bill beneficiary for covered costs (QMB protects from balance billing) [6].
- Varies by: priority_tier

**How to apply:**
- Online: Oregon DHS ONE system (implied via state Medicaid; specific URL not in results, use oregon.gov/odhs) [3].
- Phone: Contact local Aging & Disability Resource Connection (ADRC) or Oregon DHS (800-282-8096 or local offices; SHIBA hotline implied via [9]) [3].
- Mail/In-person: Local DHS or ADRC offices; form DHS 9017 (Medicare Savings Programs brochure/application guide) [5].
- Multiple routes via state Medicaid program [1].

**Timeline:** Not specified in sources; renew annually or as required [1]. Retroactive coverage up to 90 days for some [9].
**Waitlist:** QI/SMF has limited federal slots; Oregon shuts enrollment if limit reached [3].

**Watch out for:**
- QI/SMF enrollment can close due to federal slot limits; apply early [3].
- Income limits update yearly (March); check current FPL-based figures [3][9]. Don't assume prior year limits.
- Must be Part A *eligible* even if not enrolled [3][6]; state pays to enroll if needed.
- Not eligible for SMF if on other Medicaid [1][3]. QMB provides strongest protection (no balance billing).
- Oregon names: SLMB= SMB, QI=SMF [2][3]. Income calculation starts gross minus $20 [5].
- Conflicting income figures across sources due to annual updates; always verify with DHS [2][3][9].

**Data shape:** Tiered by income (QMB <100% FPL, SLMB 100-120%, QI/SMF 120-135% FPL) with no asset test; benefits scale by tier (QMB fullest, others Part B only); QI/SMF slot-limited; statewide uniform rules but local admin; annual FPL adjustments.

**Source:** https://www.oregon.gov/odhs/aging-disability-services/pages/medicare-savings-programs.aspx

---

### SNAP Food Benefits

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For Oct. 1, 2025 through Sept. 30, 2026, households with a member 60+ or disabled are exempt from the gross income test (200% FPL: 1 person $2608/month, 2 $3526, 3 $4442, 4 $5358, 5 $6276, 6 $7192, 7 $8108, +$916 each additional) and qualify if meeting net income and asset tests. All households must live in Oregon, be U.S. citizens or eligible non-citizens. Able-bodied adults without dependents (ABAWD) face work requirements beyond 3 months.
- Assets: Most households exempt from asset test, including elderly/disabled (house, car, bank money usually don't count). Retirement accounts may disqualify if counted as resources.
- U.S. citizen or eligible non-citizen (e.g., 5 years U.S. residency, under 18, 40 work quarters, blind/disabled, 65+ on Aug 22 1996)
- Household includes those living/buying/preparing food together (spouse, children under 22)
- Out-of-pocket medical costs for 60+ or disabled can offset income (proof required)
- ABAWD work requirements for ages 18-64 without disability/children under 14

**Benefits:** Monthly EBT card for food purchases (amount based on net income; ~$100 more net income = $30 less benefits; minimum/maximum allotments apply; medical/shelter costs increase for elderly). Seniors 65+ in Clackamas/Columbia/Multnomah/Washington counties: direct deposit/check option. Alternate payee for shopping. Usable at meals sites like Meals on Wheels.
- Varies by: household_size

**How to apply:**
- Online: https://www.oregon.gov/odhs/food/pages/snap.aspx or ONE.Oregon.gov
- Phone: Contact local ODHS office (statewide via 211 or ODHS)
- Mail: Send to local ODHS office
- In-person: Local ODHS or community partner offices

**Timeline:** Standard 30 days; expedited within 7 days if income <$150 and cash <$100, or income+cash < rent/utilities.

**Watch out for:**
- Elderly/disabled skip gross income test but need net/asset; medical costs deduct but require proof; household includes family even if separate food prep; ABAWD work rules now statewide affecting 37k; low senior participation; retirement accounts may count as assets; non-citizens strictly limited

**Data shape:** Elderly 60+ exempt gross income test, medical/shelter deductions boost benefits; varies by household size and elderly/disabled status; regional cash/direct deposit for specific counties

**Source:** https://www.oregon.gov/odhs/food/pages/snap.aspx

---

### Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households must be at or below 60% of Oregon State Median Income (SMI)[4]. Income limits are based on gross household income (before taxes) and vary by household size. Current limits (effective October 1, 2025 through September 30, 2026)[5]: 1 person: $38,385 annual / $3,198.75 monthly; 2 people: $50,196 annual / $4,183 monthly; 3 people: $62,006 annual / $5,167.17 monthly; 4 people: $73,817 annual / $6,151.42 monthly; 5 people: $85,627 annual / $7,135.58 monthly; 6 people: $97,438 annual / $8,119.83 monthly. For households larger than 6, add $2,215 annually ($184.58 monthly) per additional member[6]. Note: For single-person households, income eligibility is the greater of 60% SMI or full-time wages at Portland minimum wage[6].
- Assets: There is no asset limit for LIHEAP in Oregon[1].
- Must be an Oregon resident[2]
- Utility bill for current residence (account holder must live in home)[5]
- All household members must have Social Security numbers (required for LIHEAP; strongly encouraged for OEAP)[3]
- Household income eligibility is based on total gross income of all members living in the home at time of application[5]

**Benefits:** LIHEAP provides assistance in three forms[1]: (1) Regular LIHEAP: one-time payment directly to utility company for heating or cooling costs, with maximum benefit of $750 for heating or $750 for cooling, and minimum benefit of $250 for heating or $250 for cooling[1]; (2) Crisis LIHEAP: helps households facing immediate energy emergency (broken heater in winter, utility shutoff notice, running out of fuel), with maximum benefit of $750[1]; (3) Weatherization Assistance Program: separate but related program providing home energy efficiency improvements including insulation and heating system repairs[1]. Program also includes bill payment assistance, energy education, case management, and home weatherization services[4]. LIHEAP can help with electric, natural gas, firewood, propane, pellets, or heating oil[7].
- Varies by: household_size (benefits calculated based on household income, household size, and type of fuel used for heating or cooling[1])

**How to apply:**
- In-person at local Community Action Agencies (geographically accessible locations across the state)[4]
- Phone contact through local Community Action Agency (specific numbers vary by region; Lane County example: waitlist opens January 5, 2026 at 9am[7])
- Mail (through local Community Action Agency)
- Online (through some local agencies; specific URLs vary by region)

**Timeline:** Incomplete applications will be placed in pending status for 15 days prior to denial; only complete applications will be accepted for processing[5]. Specific processing timelines for complete applications not provided in search results.
**Waitlist:** Program is first come, first served[7]. Waitlist anticipated to open January 5, 2026 at 9am in Lane County; waitlist can fill up very fast[7]. Waitlist timing and availability varies by region and funding availability.

**Watch out for:**
- Roommates covered by the same utility bill are counted as part of the same LIHEAP household, even if they don't share most expenses[1]. This means household composition for LIHEAP differs from other benefit programs like SNAP[1].
- Program is first come, first served with limited funds[7]. Waitlists can fill up very fast, sometimes within minutes of opening[7].
- Both heating and electricity bills are required, and account information for both must be updated in the system[3].
- Incomplete applications are placed in pending status for only 15 days before denial[5]. Families must submit complete applications to avoid automatic denial.
- Social Security numbers are required for LIHEAP (not just strongly encouraged)[3]. Applicants without SSA-issued Social Security numbers may face barriers; OPUS system can issue unique client identification number in some cases[3].
- Benefits are typically one-time payments, not ongoing monthly assistance[7]. For ongoing monthly help, some utility companies offer separate Income-Qualified Bill Discount programs[8].
- Income eligibility is based on gross income (before deductions) received 2 months prior to application date[5].
- Weatherization Assistance Program is separate from regular LIHEAP but related; eligibility and application process may differ.
- Regional variations in processing times, waitlist availability, and additional programs mean families should contact their local Community Action Agency directly for specific timelines and services.

**Data shape:** This program's data structure is complex due to regional administration through local Community Action Agencies. Income limits scale by household size with specific dollar thresholds. Benefits are fixed maximum amounts ($750 for regular heating/cooling, $750 for crisis) but calculated based on household characteristics. No statewide online application portal exists; families must contact their local agency. Waitlist availability and processing times vary significantly by region and funding year. The program includes multiple components (regular LIHEAP, crisis LIHEAP, weatherization) with potentially different eligibility or application processes. Household composition for LIHEAP purposes differs from other benefit programs, creating potential confusion for families applying to multiple programs.

**Source:** https://www.oregon.gov/ohcs/energy-weatherization/

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross income at or below 200% of the federal poverty level, based on all household members' income before payroll deductions. Specific dollar amounts vary annually with federal poverty guidelines (e.g., consult current USDOE guidelines via OHCS); no exact table in sources but consistently applied statewide.[2][3][4][5][9]
- Assets: No asset limits mentioned in sources.
- Eligible households must live in single-family homes, mobile homes, or apartments (renters need landlord approval).[4][5]
- Priority given to seniors (60+), people with disabilities, households with children under 6, high energy users, and high energy burden households.[2]

**Benefits:** Free weatherization services including ceiling/wall/floor insulation, air infiltration reduction/sealing, furnace/heating system repair or replacement, heating duct improvements, energy-related minor home repairs, base-load measures, health/safety repairs, and energy conservation education. Services determined by professional energy audit for cost-effectiveness; no fixed dollar amount or hours.[2][5][7][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (CAA) or subgrantee by county (e.g., Clackamas: phone not specified in results; Marion/Polk: 503-581-5412 press 0; Multnomah: 503-282-6309; Washington: 503-675-4288 ext. 111; Yamhill: 503-472-0457).[5]
- Oregon Housing and Community Services (OHCS) Energy Services: (503) 986-2000.[2]
- In-person/mail/online via local providers (e.g., NeighborImpact application packet).[3]
- State administrator via OHCS for general inquiries.[6]

**Timeline:** Not specified; agency contacts eligible households after application to schedule energy audit.
**Waitlist:** Households may be placed on a waiting service list after contacting local agency.[2]

**Watch out for:**
- Renters must obtain landlord permission (often missed).[4][5]
- Priority tiers mean elderly may qualify faster but still face waitlists.[2]
- Must meet exact 200% FPL gross income; no asset test but all household income counts.[2][3][9]
- Services limited to cost-effective measures per audit, not all repairs.[5][7]
- Temporary disqualification for certain newly legalized aliens.[1]
- Apply via local agency, not directly to state/DOE.[6]

**Data shape:** Administered statewide by OHCS via local subgrantees/CAAs with county-specific contacts; priority-based with waitlists; income fixed at 200% FPL, benefits via energy audit.

**Source:** https://www.oregon.gov/ohcs/energy-weatherization/Pages/default.aspx

---

### Senior Health Insurance Benefits Assistance (SHIBA)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries regardless of income[1][2][3][4][5]
- Assets: No asset limits; no asset test applies[1][2][3][4][5]
- Must have Medicare
- Open to residents over age 65 and people with disabilities ages 18-64[1][5]

**Benefits:** Free, objective, unbiased counseling and education on Medicare benefits, options, billing issues, appeals, plan comparisons, rights, fraud identification, and referrals; provided one-on-one by trained volunteer counselors via phone, in-person, online, or public events[1][2][3][4][5][6]

**How to apply:**
- Phone: 800-722-4134 (toll-free statewide hotline, enter zip code for local routing)[3][4][7][8][9]
- Website: https://shiba.oregon.gov/get-help/pages/helpnearyou.aspx (find local counseling sites)[3][4][9]
- Email: shiba.oregon@odhs.oregon.gov or online contact form[4][8]
- In-person: Local offices, libraries, events, or sponsor sites (search by zip code on site)[1][2][6][9]
- Local examples: Clackamas 503-655-8269, Multnomah (503) 988-3646[1][2]

**Timeline:** No formal application processing; counseling appointments scheduled directly, typically available year-round with increased events during Medicare Annual Enrollment Period (Oct 15-Dec 7)[2][6][9]

**Watch out for:**
- Not a financial benefits or healthcare provider program—only free counseling/education, no direct payments or medical services[1][2][4][5]
- Relies on volunteer counselors, so availability may vary by local demand/events[2][9]
- During Medicare Annual Enrollment (Oct 15-Dec 7), schedule early for events[2][6][9]
- People turning 65 or with disabilities (18-64) must confirm Medicare enrollment first[1][5]
- Not part of Medicaid/OHP; separate from ADRC long-term care services[4][5]

**Data shape:** no income or asset test; volunteer-delivered statewide counseling network with local access points; services fixed and free for all Medicare enrollees

**Source:** https://shiba.oregon.gov

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits or tables mentioned for standard Meals on Wheels programs in Oregon; eligibility focuses on need rather than income. Medicaid-funded HDM may tie to broader Medicaid eligibility, but no dollar amounts or household tables provided.[1][2][3]
- Assets: No asset limits mentioned; not applicable based on available data.[1][3]
- Homebound due to injury, illness, or disability (leaving home is a major effort; unassisted outings rare, though medical/religious/essential activities allowed)[1][3]
- Limited ability to shop for or prepare meals safely[1]
- Lack family or other support for meal preparation[1][3]
- Spouse or disabled dependent child may qualify if it benefits the homebound individual[1]
- Cannot attend community dining due to physical/mental health[1]
- For Medicaid HDM: Assessed via CA/PS, authorized by Medicaid Case Manager, no natural supports available[3]
- Under 60 possible if authorized by Medicaid Case Manager as part of Long-Term Care or State Plan[3][6]
- OAA recipients, PACE participants, or HRSN-eligible (e.g., food insecurity, disabilities, high-risk conditions) via Medicaid[2]

**Benefits:** Home-delivered nutritionally balanced meals meeting recommended daily allowances; typically weekday deliveries (e.g., 1 meal per delivery day); may include periodic assessments and referrals to alternatives; Medicaid HDM specifies quantity authorized monthly by case manager[1][3]
- Varies by: priority_tier|region

**How to apply:**
- Contact local provider (e.g., Council on Aging Central Oregon for assessment; no central phone listed, search local via Meals on Wheels America tool)[1][4]
- For Medicaid/OHP: Complete HRSN request form via your Coordinated Care Organization (CCO) on Oregon Health Authority website; contact case manager/service coordinator[2][3]
- Medicaid referral/authorization: Form 595 or agreed format sent by Case Manager to AAA nutrition program[3]
- Local example: Marion/Polk call 503-364-2856 or online application (volunteer-focused but indicates contact point)[5]

**Timeline:** Initial in-person assessment by case manager required; annual reassessment; no specific timelines stated[1][3]
**Waitlist:** Not mentioned; may vary by local provider[1]

**Watch out for:**
- Not a single statewide program—must contact local provider; eligibility requires in-person assessment, not just age/income[1][4]
- Homebound definition is strict (rare unassisted outings); spouses/dependents only if benefiting primary eligible[1][3]
- Medicaid version needs case manager authorization first; OAA prioritizes need over income but may transition to paid if ineligible[1][3]
- Annual reassessment; if no longer qualify, referred elsewhere (e.g., community dining)[1]
- Under 60 only via Medicaid authorization, not standard[6]

**Data shape:** Decentralized by local providers/regions with no uniform income/asset tests; Medicaid HDM ties to case management assessments; mixes OAA (need-based) and Medicaid (authorized service) streams

**Source:** https://www.oregon.gov/odhs/aging-disability-services/pages/meals-nutrition.aspx[7]; Medicaid standards: https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/medicaid-home-delivered-meals-standards-and-responsibilities.pdf[3]

---

### Family Caregiver Support Program (FCSP)


**Eligibility:**
- Age: Caregiver must be 18+; care recipient requirements vary by situation+
- Income: Not specified in available documentation. Search results do not contain income thresholds for FCSP. Note: This differs from Oregon's Medicaid-based Spousal Pay Program, which has financial eligibility criteria.
- Assets: Not specified in available documentation
- Caregiver must be unpaid (informal provider)
- Caregiver relationship: family member, extended family, or someone living full-time with care recipient
- No state-mandated qualifications for independent caregivers, though agencies may verify background and references

**Benefits:** Specific services not detailed in search results. Program described as helping caregivers 'support their loved ones and themselves' and taking 'burdens off unpaid caregivers,' but actual service offerings (respite care, counseling, support groups, training, etc.) are not enumerated in provided documentation.
- Varies by: Not specified in available documentation

**How to apply:**
- Contact Aging and Disability Resource Center (ADRC) of Oregon: 1-855-ORE-ADRC (1-855-673-2372)
- Visit www.ADRCofOregon.org
- Local county ADRC offices (Multnomah County and Clackamas County offices referenced in search results)

**Timeline:** Not specified in available documentation
**Waitlist:** Not specified in available documentation

**Watch out for:**
- FCSP is NOT the same as Oregon's Medicaid-based Spousal Pay Program or Medicaid Personal Care Program (PCP). Families seeking paid caregiver compensation should investigate Medicaid programs separately, which have strict medical and financial eligibility criteria.
- FCSP is funded under the federal Older Americans Act (OAA) Title III Part E, which provides 'limited funding.' This may affect service availability or waitlists, though specific limitations are not documented.
- Search results do not specify whether FCSP provides direct financial compensation to family caregivers or only supportive services (counseling, training, respite care coordination, etc.). This is a critical distinction for families seeking paid caregiver arrangements.
- For Veterans and service members with service-connected injuries, a separate VA Family Caregiver Program exists with different eligibility criteria (see search result [1]). Families should verify which program applies.
- No state-mandated qualifications exist for independent caregivers in Oregon, but agencies may impose their own standards (e.g., background checks, reference verification, CNA certification).

**Data shape:** The Family Caregiver Support Program documentation in search results is limited. While eligibility for care recipients is clearly defined by age and condition, critical details are absent: specific services provided, benefit amounts or hours, application procedures, processing timelines, required documentation, and regional variations. The program appears to be primarily a support/advocacy program rather than a direct payment program, but this distinction is not explicitly confirmed. Families should contact their local ADRC directly for comprehensive program details. Additionally, Oregon offers multiple caregiver-related programs (FCSP, Medicaid PCP, Spousal Pay, VA Family Caregiver Program), and the search results do not clarify how these programs interact or which is most appropriate for different situations.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/family-caregiver-program.aspx

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are updated in HHS Poverty Guidelines (effective January 15, 2025 per latest federal update); families must check current guidelines as specific table not in Oregon sources—e.g., for 2025, typically around $19,000 for 1 person, $25,500 for 2, scaling up (verify via dol.gov or oregon.gov).
- Unemployed
- Low-income (≤125% FPL)
- U.S. citizen or eligible resident
- Enrollment priority: veterans/qualified spouses first, then over 65, disability, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or failed American Job Center services

**Benefits:** Part-time community service internships (average 20 hours/week) at non-profits/public agencies (e.g., schools, hospitals, senior centers); paid highest of federal/state/local minimum wage to supplement income; personalized training, supportive mentors, skills updates; bridge to unsubsidized permanent employment; over 40 million community service hours provided nationally.
- Varies by: priority_tier

**How to apply:**
- Phone: Easter Seals Oregon at 503-228-5100 (statewide) or 541-687-7393 (Eugene); Email: kgerhards@or.easterseals.com; In-person: Eugene office at 2510 Oakmont Way, Eugene, OR 97401; Website: oregon.easterseals.com/get-support/areas-of-support/employment-job-training/senior-community-service-employment-program (referral form); National: CareerOneStop Older Worker Program Finder or 1-877-872-5627

**Waitlist:** Likely due to funding limits and priority tiers, but no specific Oregon timelines provided

**Watch out for:**
- Must be unemployed and actively seeking unsubsidized work—transitional only, not permanent; strict 125% FPL income cap (use current HHS guidelines); priority tiers mean non-priority applicants may face long waits or denial; no asset test but income proof rigorous; part-time wage supplements income but not full-time job replacement; verify state min wage for pay rate.

**Data shape:** Federally standardized (DOL/OAA) but locally grantee-run (Easter Seals Oregon); income at 125% FPL (annual federal update); priority enrollment tiers; no asset limits or household-size dollar tables in state sources—requires cross-referencing HHS poverty guidelines.

**Source:** https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/senior-employment.aspx

---

### Long-term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; services are free and available to all residents regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of a licensed long-term care facility in Oregon, including nursing homes, residential care facilities, assisted living facilities, continuing care facilities, or adult foster homes.
- Services also available to families, facility staff, and the general public on behalf of residents.
- Targeted to older adults and people with physical disabilities in these facilities.

**Benefits:** Free advocacy services including identifying, investigating, and resolving complaints related to resident care, medications, billing, lost property, meal quality, evictions, guardianships, dignity, respect, and care plans; information and assistance in choosing appropriate living residences; protection of health, safety, welfare, and rights.

**How to apply:**
- Phone: 800-522-2602 or 503-378-6533
- Email: ltco.info@rights.oregon.gov
- In-person: 830 D St. NE, Salem OR 97301

**Timeline:** Immediate response to complaints; no formal application processing time as services are provided on-demand.

**Watch out for:**
- This is not a program that provides direct care, housing, or financial aid—it's purely advocacy and complaint resolution for those already in facilities.
- Not for community-dwelling individuals; only serves residents of licensed long-term care facilities.
- Volunteers (not families) provide most direct services; families contact to report issues.
- Confidentiality is legally required, which may limit information sharing.

**Data shape:** no income test; advocacy-only for facility residents; relies on volunteer network; free and statewide with no waitlist or financial eligibility

**Source:** https://www.oltco.org/programs/ltco-about-us.html

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Oregon Health Plan (OHP) | benefit | state | deep |
| OPI-M (Medicaid-funded) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (MSP) | benefit | federal | deep |
| SNAP Food Benefits | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Senior Health Insurance Benefits Assista | resource | state | simple |
| Meals on Wheels | benefit | federal | deep |
| Family Caregiver Support Program (FCSP) | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"resource":2,"employment":1}
**Scopes:** {"state":4,"local":1,"federal":7}
**Complexity:** {"deep":9,"simple":2,"medium":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/OR/drafts.json`.

- **Oregon Health Plan (OHP)** (benefit) — 5 content sections, 6 FAQs
- **OPI-M (Medicaid-funded)** (benefit) — 3 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **fixed**: 1 programs
- **household_size**: 1 programs
- **household_size (benefits calculated based on household income, household size, and type of fuel used for heating or cooling[1])**: 1 programs
- **not_applicable**: 2 programs
- **priority_tier|region**: 1 programs
- **Not specified in available documentation**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Oregon Health Plan (OHP)**: Dual structure: MAGI for most (no assets, FPL-based scaling by household size) vs. ABD/OSIPM for elderly/disabled (FBR income, $2,000 assets, level-of-care test); benefits via regional CCOs; long-term care focus for seniors with specific exemptions
- **OPI-M (Medicaid-funded)**: Income/assets higher than standard Medicaid LTSS; continuous 24-month eligibility; caregiver supports included; priority levels 1-18 determine services; local APD administration with statewide rules
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE is a fixed-benefit, all-inclusive program with no tiered benefits or sliding scales. Eligibility is binary (meets all requirements or does not). The program's key structural feature is that it combines insurance (coverage) with direct service provision, making it both a payer and a provider. No income or asset limits exist for PACE enrollment itself, but Medicaid-funded participants must meet Medicaid's income and asset limits. Geographic availability is highly restricted to specific service areas, and rural access is limited. Critical gaps in provided search results: specific application contact information, processing timelines, required documentation, current wait times, and detailed regional provider information are not available.
- **Medicare Savings Programs (MSP)**: Tiered by income (QMB <100% FPL, SLMB 100-120%, QI/SMF 120-135% FPL) with no asset test; benefits scale by tier (QMB fullest, others Part B only); QI/SMF slot-limited; statewide uniform rules but local admin; annual FPL adjustments.
- **SNAP Food Benefits**: Elderly 60+ exempt gross income test, medical/shelter deductions boost benefits; varies by household size and elderly/disabled status; regional cash/direct deposit for specific counties
- **Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)**: This program's data structure is complex due to regional administration through local Community Action Agencies. Income limits scale by household size with specific dollar thresholds. Benefits are fixed maximum amounts ($750 for regular heating/cooling, $750 for crisis) but calculated based on household characteristics. No statewide online application portal exists; families must contact their local agency. Waitlist availability and processing times vary significantly by region and funding year. The program includes multiple components (regular LIHEAP, crisis LIHEAP, weatherization) with potentially different eligibility or application processes. Household composition for LIHEAP purposes differs from other benefit programs, creating potential confusion for families applying to multiple programs.
- **Weatherization Assistance Program**: Administered statewide by OHCS via local subgrantees/CAAs with county-specific contacts; priority-based with waitlists; income fixed at 200% FPL, benefits via energy audit.
- **Senior Health Insurance Benefits Assistance (SHIBA)**: no income or asset test; volunteer-delivered statewide counseling network with local access points; services fixed and free for all Medicare enrollees
- **Meals on Wheels**: Decentralized by local providers/regions with no uniform income/asset tests; Medicaid HDM ties to case management assessments; mixes OAA (need-based) and Medicaid (authorized service) streams
- **Family Caregiver Support Program (FCSP)**: The Family Caregiver Support Program documentation in search results is limited. While eligibility for care recipients is clearly defined by age and condition, critical details are absent: specific services provided, benefit amounts or hours, application procedures, processing timelines, required documentation, and regional variations. The program appears to be primarily a support/advocacy program rather than a direct payment program, but this distinction is not explicitly confirmed. Families should contact their local ADRC directly for comprehensive program details. Additionally, Oregon offers multiple caregiver-related programs (FCSP, Medicaid PCP, Spousal Pay, VA Family Caregiver Program), and the search results do not clarify how these programs interact or which is most appropriate for different situations.
- **Senior Community Service Employment Program (SCSEP)**: Federally standardized (DOL/OAA) but locally grantee-run (Easter Seals Oregon); income at 125% FPL (annual federal update); priority enrollment tiers; no asset limits or household-size dollar tables in state sources—requires cross-referencing HHS poverty guidelines.
- **Long-term Care Ombudsman Program**: no income test; advocacy-only for facility residents; relies on volunteer network; free and statewide with no waitlist or financial eligibility

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Oregon?
