# Massachusetts Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 1.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 15 |
| New (not in our data) | 10 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **financial**: 4 programs
- **service**: 10 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Frail Elder Waiver (FEW)

- **min_age**: Ours says `60` → Source says `60-64 with a disability, or 65+` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants))
- **income_limit**: Ours says `$2901` → Source says `$2,199` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) including home care, supports for basic to intensive needs (specifics like respite, adult day, homemaker, personal care, Alzheimer's coaching by qualified providers e.g., RN, LCSW, OT; no fixed dollar/hour amounts specified, tailored to NFLOC needs)[1][7][8]` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants`

### Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$1305` → Source says `$2,829` ([source](https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive medical, social, recreational, and wellness services including: adult day care, dentistry & vision, emergency services, home care, hospital care, laboratory/x-ray, meals, medical specialty services, nursing home care (if needed), nutritional counseling, occupational therapy, physical therapy, prescription drugs, primary care (doctor & nursing), recreational therapy, social services, social work counseling, transportation. Provided via interdisciplinary team and individualized care plan. All Medicare/Medicaid-covered services plus additional supports; no specific dollar amounts or hours per week stated, but capped financing allows all needed services[1][5][6].` ([source](https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace`

### SNAP (Food Stamps)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Average monthly SNAP benefit for a Massachusetts senior is $147. Benefits are calculated based on household net income and household size. Maximum allotment varies by household size (e.g., $546 for a 2-person elderly/disabled household before income deduction).` ([source](https://www.mass.gov/lists/snap-application-for-seniors))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/lists/snap-application-for-seniors`

### Family Caregiver Support Program (includes Respite)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care (temporary relief for caregivers), counseling, training, support groups, and supplemental services; specific respite details (e.g., hours, dollar amounts) not quantified in sources and vary by local provider.[1][8]` ([source](https://www.mass.gov/info-details/family-caregiver-support-program[8]))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/info-details/family-caregiver-support-program[8]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free advocacy services including complaint investigation and resolution, mediation between residents and facilities, information about resident rights, assistance selecting facilities, and advocacy for systemic long-term care improvements. In Federal Fiscal Year 2023, the program resolved 3,426 complaints across categories including abuse/neglect/exploitation, care quality, autonomy/rights, financial/property issues, admission/discharge, and facility policies.` ([source](https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program`

## New Programs (Not in Our Data)

- **MassHealth Medicare Savings Program (MSP) / Buy-In** — financial ([source](https://www.mass.gov/info-details/get-help-paying-medicare-costs))
  - Shape notes: This program has undergone significant recent expansions: income limits increased from 135% FPL (2019) to 165% FPL (2020) to 225% FPL (2023), and asset limits were completely eliminated as of March 1, 2024[1][2][3]. The program operates as three distinct tiers (QMB, SLMB, QI) with different benefit levels, but all three are administered together as 'Medicare Savings Programs' by MassHealth[3][5]. Notably, MSP-only has no asset test, but combined MSP+MassHealth applications do have asset limits[3]. The program is statewide with no regional variations in eligibility or benefits.
- **Residential Conservation Service (Weatherization)** — service ([source](https://www.mass.gov/info-details/fuel-assistance-eligibility (for Fuel Assistance entry; WAP via local agencies); https://www.energy.gov/cmei/scep/wap/weatherization-assistance-program (federal DOE overview)))
  - Shape notes: Administered regionally by community action agencies with Fuel Assistance as gateway; income at 60% SMI; priority tiers; landlord rules for renters; no centralized application.
- **SHINE (Serving the Health Insurance Needs of Everyone)** — service ([source](https://www.mass.gov/info-details/serving-the-health-insurance-needs-of-everyone-shine-program))
  - Shape notes: SHINE is a statewide information and counseling program with no direct financial benefits or service hours. It operates through a decentralized network of regional providers (senior centers, Councils on Aging, elder service agencies, community organizations) rather than a single application process or centralized eligibility determination. Eligibility is broad (Massachusetts residents with Medicare or approaching Medicare eligibility) with no published income or asset limits for SHINE itself, though counselors help screen for and access other programs that do have limits. The program's value is in expert guidance and navigation assistance rather than direct benefits. Regional variations exist in which organizations provide SHINE services and how to contact them, but the core service offering is consistent statewide.
- **Meals on Wheels** — service ([source](https://www.mass.gov/info-details/elder-affairs-nutrition-programs (state Elder Affairs oversees; local via Mass Meals on Wheels)[5][8]))
  - Shape notes: Decentralized by local providers with regional service zones; no statewide income/asset tests; eligibility emphasizes homebound status over finances; spouses/dependents included regardless of age
- **Massachusetts Senior Legal Helpline** — service ([source](https://www.mass.gov/doc/senior-legal-help-line/download))
  - Shape notes: no income test for core helpline access; free info/referrals to all qualifying seniors regardless of finances; attorney services via referral with potential means test; statewide but run by single Boston-based provider
- **Prescription Advantage** — financial ([source](https://www.prescriptionadvantagema.org/ and https://www.mass.gov/info-details/prescription-advantage))
  - Shape notes: Tiered by income categories (S0-S5) with precise yearly/monthly limits scaling for single/married; mandatory applications for federal programs (Extra Help/MSP) as gatekeepers; no general asset test but tied to those programs
- **Home Care Program (HCP)** — service ([source](https://www.mass.gov/info-details/home-care-program and https://www.mass.gov/how-to/how-to-apply-for-home-care-assistance-program-hcap))
  - Shape notes: Benefits scale by priority tier based on number of ADLs/IADLs requiring assistance. Income limits are fixed statewide. The program is means-tested but MassHealth members bypass the income test. Processing time is standardized at 3-4 months but waitlist status varies by funding availability. No asset limits are specified in available documentation. Regional variations in wait times are possible but not detailed.
- **Enhanced Community Options Program (ECOP)** — service ([source](https://www.mass.gov (general state programs; specific ECOP page not in results)))
  - Shape notes: Administered via regional ASAPs with statewide cap and waitlist; eligibility bridges to MassHealth Frail Elder Waiver during asset spend-down; recent policy changes include enrollment ceiling and spend thresholds.
- **Home Modification Loan Program** — financial ([source](https://cedac.org (administers HMLP; see HMLP section for providers)))
  - Shape notes: Administered regionally by 6 providers with AMI-based income varying by area; asset caps differ by provider; requires contractor bid for eligibility; loan not grant
- **Commonwealth Coordinated Care (CCC)** — service ([source](https://www.mass.gov/masshealth (no direct CCC page in results; check for program details)))
  - Shape notes: Program not directly documented; data sparse—likely managed care variant like SCO/One Care with regional plans, MassHealth prerequisite, no fixed income table in results, geography-limited.

## Program Details

### MassHealth Medicare Savings Program (MSP) / Buy-In

> **NEW** — not currently in our data

**Eligibility:**
- Income: As of March 1, 2024: $2,824 per month for a single individual and $3,833 per month for a married couple (225% of Federal Poverty Level)[2]. Income limits are evaluated on a countable income basis and change annually on March 1[4]. Types of countable income include: Social Security, pensions, federal veterans' benefits, annuities or trusts, dividends and/or interest, income from a job, rental income, and income from other sources[1].
- Assets: As of March 1, 2024, there is NO asset limit for MSP-only eligibility[2][3]. Primary home ownership is generally not counted as an asset[1]. However, if applying for both MSP and full MassHealth coverage simultaneously, asset limits of $2,000 for single applicants and $3,000 for married couples apply for certain MassHealth benefits[3][4].
- Must be a Massachusetts resident[1]
- Must be enrolled in Medicare[2][3]
- Do NOT have to be on MassHealth to qualify for MSP-only[2]

**Benefits:** Up to $3,000 per year in savings[2]. Program pays for: Medicare Part B premiums (all MSP types); Medicare Part A premiums (QMB only); all Medicare Part A and Part B cost-sharing including deductibles, coinsurance, and copays (QMB only); prescription drug costs through Medicare Part D Extra Help with low copays (all MSP types); Health Safety Net (HSN) coverage at acute care hospitals and Community Health Centers (QMB and SLMB/QI)[4]. Automatic enrollment in Medicare Part D Extra Help for drug coverage[3][5].
- Varies by: priority_tier

**How to apply:**
- Online: Visit MassHealth website (mass.gov)[2]
- Phone: Call MassHealth Customer Service Center[1][2]
- Mail: Submit Medicare Savings Programs application form[6]
- In-person: Contact MassHealth Customer Service[1]

**Timeline:** Decision notice received within 30 days of application[6]. Coverage begins on the first day of the calendar month after MassHealth determines eligibility[1].

**Watch out for:**
- MAJOR CHANGE (March 1, 2024): Asset limits were completely eliminated for MSP-only applicants[2][3]. If someone was previously denied due to assets (home or savings), they should reapply immediately[1].
- You do NOT need to be on MassHealth to qualify for MSP-only benefits[2]. Many people mistakenly believe MassHealth enrollment is required.
- Three different MSP tiers exist (QMB, SLMB, QI) with different benefit levels[4][5]. QMB provides the most comprehensive coverage including Part A premiums and all cost-sharing; SLMB/QI only cover Part B premiums[4].
- If you qualify for both MSP and full MassHealth, asset limits of $2,000 (single) or $3,000 (married) DO apply for certain MassHealth benefits, even though MSP-only has no asset limit[3][4].
- MSP enrollment allows Medicare beneficiaries to sign up for Medicare Part B at any time of year without late enrollment penalties[3][5].
- If previously denied before January 1, 2020 (when limits were expanded from 135% to 165% FPL), applicants should reapply as limits have since increased to 225% FPL[1].
- Income limits change annually on March 1[4]. Families should verify current limits each year.
- Automatic enrollment in Medicare Part D Extra Help with low copays is included[3][5], but some pharmacy copays may still apply depending on tier[5].

**Data shape:** This program has undergone significant recent expansions: income limits increased from 135% FPL (2019) to 165% FPL (2020) to 225% FPL (2023), and asset limits were completely eliminated as of March 1, 2024[1][2][3]. The program operates as three distinct tiers (QMB, SLMB, QI) with different benefit levels, but all three are administered together as 'Medicare Savings Programs' by MassHealth[3][5]. Notably, MSP-only has no asset test, but combined MSP+MassHealth applications do have asset limits[3]. The program is statewide with no regional variations in eligibility or benefits.

**Source:** https://www.mass.gov/info-details/get-help-paying-medicare-costs

---

### Frail Elder Waiver (FEW)


**Eligibility:**
- Age: 60-64 with a disability, or 65++
- Income: Must qualify for MassHealth Standard under 300% of Federal Poverty Level (FPL) or SSI-related limits; specific figures include under $2,199/month (reported in some sources) or up to $2,901/month with medically needy spend-down on medical bills; special rules for waiver applicants including spousal protections; exact current amounts determined by MassHealth and updated annually[1][2][4][5][6]
- Assets: Individual: $2,000 max; Spousal allowance: $154,140; certain exemptions apply under MassHealth rules (e.g., primary home may be protected, life insurance policies reviewed); spend-down available for excess via medically needy program[2][4][5]
- Nursing Facility Level of Care (NFLOC) determined by Comprehensive Data Set (CDS) assessment of ADLs (e.g., mobility, toileting, cognition) via ASAP RN in-home assessment[1][2][3][4][6]
- Live in community setting (own home, family home, congregate housing; not assisted living, group homes, rest homes, or institutions except brief respite)[1]
- Safely served in community with FEW services; receive at least one FEW service per month to remain eligible[1][4]
- Enrolled in MassHealth; not in another HCBS waiver, One Care, or PACE[1][5]
- Eligible for state home care services through ASAP[3][4]

**Benefits:** Home and Community-Based Services (HCBS) including home care, supports for basic to intensive needs (specifics like respite, adult day, homemaker, personal care, Alzheimer's coaching by qualified providers e.g., RN, LCSW, OT; no fixed dollar/hour amounts specified, tailored to NFLOC needs)[1][7][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging Services Access Point (ASAP) for clinical eligibility assessment[1]
- Complete and mail application to local ASAP[1]
- Referral to ASAP (e.g., ESWA, AgeSpan) for home care assessment; then Senior Affordable Care Act (SACA) MassHealth Application with Long Term Care Supplement (A)[4]
- In-person or phone via local ASAP (e.g., Aging Services of North Central Massachusetts)[6]

**Timeline:** Often 3 months or more[2]
**Waitlist:** Not specified in sources; may vary by region/ASAP[2]

**Watch out for:**
- Must receive at least one FEW service monthly or lose eligibility[1][4]
- Cannot live in assisted living, group homes, or rest homes (congregate housing OK)[1]
- Financial eligibility ties to MassHealth Standard (300% FPL/SSI); over limits may qualify via spend-down but requires proof[2][4][5][6]
- No dual enrollment in other waivers/One Care/PACE[1]
- Spousal impoverishment protections exist but assets/income still scrutinized[4][6]
- Clinical NFLOC determined by ASAP RN assessment, not self-reported[2][3][4]

**Data shape:** Tied to MassHealth financial eligibility (300% SSI/FPL with $2k asset cap, spousal allowances); regional ASAP delivery with clinical screening by RN; must use services monthly; spend-down for medically needy

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No strict statewide income limits specified; however, for extremely low-income clients (often dual-eligible for Medicare and MassHealth), income typically below 300% of the Federal SSI rate (approximately $2,829/month for an individual in 2024, subject to annual adjustment) with assets under $2,000. MassHealth may cover premiums if income/asset guidelines are met. You do not need to be on MassHealth to enroll[1][3][8].
- Assets: For low-income applicants, assets under $2,000 commonly referenced; exact countable assets and exemptions not detailed in sources (e.g., primary home often exempt in similar programs, but confirm with provider). MassHealth asset rules may apply if seeking premium coverage[8].
- Live in the service area of a PACE organization/provider
- Eligible for nursing home level of care (clinically determined by Massachusetts)
- Able to live safely in the community at time of enrollment with PACE services
- Most participants are dually eligible for Medicare and Medicaid, but not required[1][6][10]

**Benefits:** Comprehensive medical, social, recreational, and wellness services including: adult day care, dentistry & vision, emergency services, home care, hospital care, laboratory/x-ray, meals, medical specialty services, nursing home care (if needed), nutritional counseling, occupational therapy, physical therapy, prescription drugs, primary care (doctor & nursing), recreational therapy, social services, social work counseling, transportation. Provided via interdisciplinary team and individualized care plan. All Medicare/Medicaid-covered services plus additional supports; no specific dollar amounts or hours per week stated, but capped financing allows all needed services[1][5][6].
- Varies by: region

**How to apply:**
- Contact local PACE provider/enrollment specialist directly (e.g., masspace.net for Massachusetts PACE sites, serenitypace.org, neighborhealth.com/en/care-and-services/adult-care/pace/ for specific centers)
- Phone/website via Mass.gov PACE pages or providers (no central statewide phone listed; use provider-specific contacts)
- In-person at PACE centers (e.g., Greater Boston area for Neighborhood PACE)
- PACE enrollment specialists assist with process[1][4][8][10]

**Timeline:** Not specified in sources
**Waitlist:** Possible regional waitlists implied but not detailed; varies by provider/location[8]

**Watch out for:**
- Not statewide—must live in a PACE provider's service area; check local availability first
- Nursing home level of care required (high needs population), but must be safe in community with services
- Becomes sole source of Medicare/Medicaid benefits—cannot use other plans simultaneously
- No MassHealth enrollment required, but it covers premiums for eligible; private pay possible but confirm costs
- Regional providers differ; waitlists and services may vary—contact specific center
- Extremely low-income focus for no-cost access; higher income may pay premiums[3][6][8]

**Data shape:** Limited to specific PACE provider service areas in Massachusetts (not statewide); multiple regional providers with varying locations; no fixed income/asset table but low thresholds for full coverage; high-need nursing home eligible only; no central application—provider-specific

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace

---

### SNAP (Food Stamps)


**Eligibility:**
- Age: 60+
- Income: {"description":"Massachusetts has expanded eligibility beyond federal standards. For households with at least one member age 60+ or with a disability, different rules apply.","standard_households":"200% of Federal Poverty Level (FPL)","elderly_disabled_households":"100% of FPL (net income only)","monthly_gross_income_limits_200pct_fpl":{"1_person":"$2,608","2_people":"$3,526","3_people":"$4,442","4_people":"$5,358","5_people":"$6,276","6_people":"$7,192","7_people":"$8,108","each_additional_person":"+$916"},"note":"Seniors (60+) or disabled household members can qualify under net income test (100% FPL) even if gross income exceeds the 200% limit, provided they also meet asset limits."}
- Assets: {"description":"Asset limits apply but are more lenient for elderly/disabled households. Specific dollar thresholds not detailed in search results, but home ownership and retirement savings do not disqualify applicants.","exempt_assets":["Primary residence (home ownership does not disqualify)","Retirement savings"],"note":"Households with members 60+ or disabled may qualify under net income/asset tests even if gross income exceeds limits."}
- Must be a Massachusetts resident
- Must be a U.S. citizen or lawfully present non-citizen
- Must have a Social Security number (or proof of application)
- Able-bodied adults must register for work and accept suitable employment (with certain exceptions)
- Household composition: For EDSAP (simplified program for seniors), all adult household members must be 60+ with no earned income; children under 18 may be included

**Benefits:** Average monthly SNAP benefit for a Massachusetts senior is $147. Benefits are calculated based on household net income and household size. Maximum allotment varies by household size (e.g., $546 for a 2-person elderly/disabled household before income deduction).
- Varies by: household_size and net_income

**How to apply:**
- Online: Visit Mass.gov (specific URL for online portal not provided in search results)
- In-person: Local Department of Transitional Assistance (DTA) office or local Council on Aging/senior center
- Mail: Send completed application to local DTA office
- Phone: Contact local DTA office (specific statewide number not provided in search results)

**Timeline:** Standard processing: 30 days. Expedited processing available: within 7 days if gross income + bank savings is less than monthly housing expenses, OR monthly gross income is less than $150 and bank savings are $100 or less, OR applicant is a migrant worker with $100 or less in savings.

**Watch out for:**
- Recent federal legislation (One Big Beautiful Bill Act of 2025) has introduced stricter eligibility requirements affecting adults aged 60–65 in Massachusetts. Approximately 99,000 residents in this age group now face more demanding work documentation or risk losing benefits.
- An additional 45,000 seniors may see reduced SNAP monthly amounts or lose utility assistance due to increased paperwork requirements.
- Immigrants and refugees in the older population could lose eligibility altogether under new rules.
- Paperwork and digital barriers complicate recertification, especially for those with mobility or health challenges.
- Average benefit ($147/month) is modest; even minor disruptions can force vulnerable seniors to choose between groceries, medications, and utilities.
- EDSAP (simplified program) requires that ALL adult household members be 60+ with NO earned income — if one adult has earned income, the household does not qualify for EDSAP.
- Utility allowances are available but must be claimed separately: Heating/Cooling ($914), Electricity ($556), Gas/Fuel ($556), Water ($556), Sewage ($556), Trash ($556), Phone ($64).
- Households receiving over $20 in heating assistance from LIHEAP AND having a member 60+ or disabled can claim additional utility allowances.
- Only about half of eligible seniors apply for SNAP (approximately 4.8 million of 9+ million eligible seniors nationally).
- Social Security, veterans' benefits, and disability payments all count toward income limits — they do not reduce your countable income.

**Data shape:** SNAP in Massachusetts is uniquely structured around age and disability status. Seniors (60+) and disabled individuals have access to simplified eligibility pathways (net income test only, no gross income test) and a streamlined application process (EDSAP) with a 36-month certification period and no recertification interview required. Benefits scale by household size and net income. The program has recently undergone significant federal changes (2025) that tighten work requirements and non-citizen eligibility, disproportionately affecting seniors aged 60–65. Utility allowances are substantial and must be claimed separately. Massachusetts has expanded eligibility beyond federal minimums, making it more accessible than many other states.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/lists/snap-application-for-seniors

---

### Residential Conservation Service (Weatherization)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Eligibility requires gross household income at or below 60% of the Massachusetts State Median Income (SMI), determined by federal LIHEAP guidelines and household size. Exact dollar amounts vary annually; families must check current SMI table via local agency or Mass.gov Fuel Assistance eligibility tool as no specific 2026 figures provided in sources. Tied to Home Energy Assistance (Fuel Assistance/LIHEAP) eligibility.
- Assets: No asset limits mentioned across sources.
- Must be eligible for Home Energy Assistance (Fuel Assistance/LIHEAP).
- Homeowners or renters (with landlord permission for renters).
- Household not previously weatherized through WAP.
- For multi-unit buildings (1-4 units or mobile homes): tenant must receive utility discount or fuel assistance and pay own heating bills; >50% units eligible for whole building; landlord must agree not to raise rent or evict for 1 year (except good cause) and be current on taxes/utilities.
- Priority given to elderly, disabled, households with children under 6, high-energy users.

**Benefits:** Free weatherization services including insulation (attic, wall), air sealing, weatherstripping, heating/cooling system tune-ups/repairs/replacements, appliance management (AMP), reduced air infiltration, compact fluorescent bulbs, health/safety fixes (e.g., carbon monoxide), 6 mil poly ground cover, roof vents, sheathing access, whole house fan covers. Value $4,500-$7,500 in upgrades depending on availability; estimated 25-35% reduction in heating bills.
- Varies by: priority_tier

**How to apply:**
- Apply first for Home Energy Assistance (Fuel Assistance); it doubles as Weatherization application.
- Contact local agency by region (e.g., SSCAC: (508) 747-7575 x6240 or (508) 746-6707; CommTeamwork: energyprograms@commteam.org; varies by provider).
- No centralized statewide online form; use local community action agency outreach sites or central offices.

**Timeline:** Not specified; if eligible for Fuel Assistance and high priority, agency contacts you.
**Waitlist:** Limited funding implies prioritization and potential waitlists, varying by region and demand.

**Watch out for:**
- Not a direct application—must first qualify for and apply via Fuel Assistance; low-priority households may not be contacted.
- Renters need landlord cooperation (permission, no-rent-hike agreement, taxes current) or ineligible.
- Previously weatherized homes ineligible.
- Condominiums >4 units ineligible.
- Regional—must use correct local agency; no single statewide phone/website.
- Priority-based due to limited funds; elderly get preference but not guaranteed.

**Data shape:** Administered regionally by community action agencies with Fuel Assistance as gateway; income at 60% SMI; priority tiers; landlord rules for renters; no centralized application.

**Source:** https://www.mass.gov/info-details/fuel-assistance-eligibility (for Fuel Assistance entry; WAP via local agencies); https://www.energy.gov/cmei/scep/wap/weatherization-assistance-program (federal DOE overview)

---

### SHINE (Serving the Health Insurance Needs of Everyone)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available sources. Eligibility depends on 'income, citizenship or immigration status, age, and special circumstances.' SHINE counselors can screen for eligibility in cost-saving programs like MassHealth, Medicare Savings Programs, and Extra Help/LIS Program, which do have income limits, but those limits are not detailed in the search results.
- Assets: Not specified in available sources.
- Must be a Massachusetts resident[1]
- Must have Medicare or be about to become eligible for Medicare[1]
- Caregivers of Medicare beneficiaries are also eligible[3][6]

**Benefits:** Free health insurance information, counseling, and assistance. Specific services include: explanation of Medicare Parts A, B, and D; Medicare Advantage (Part C); Medigap insurance; prescription drug coverage; MassHealth; Prescription Advantage; Medicare Savings Programs (QMB, SLMB, QI); Extra Help/LIS Program; screening for eligibility and help accessing applications for cost-saving programs; help comparing costs and benefits of plans; assistance with enrollment; and personalized guidance on health insurance options[2][3][4][6]

**How to apply:**
- Phone: Call 1-800-AGE-INFO (1-800-243-4636) to reach your local regional SHINE Program Director or MassOptions[3][9]
- Phone: Call your local senior center or regional office (example: Mystic Valley Elder Services at 781-388-4845 for their service area)[7]
- Phone: Call your local Mattapoisett SHINE Counselor at 508-758-4110 (example for one municipality)[1]
- In-person: Visit senior centers or Regional Aging Services Access Points[9]
- Virtual/Remote: SHINE counselors are available to meet by phone, email, mail, and/or virtual consultation[4]
- Email: SHINE@ethocare.org (for Boston area through Ethos)[3]

**Timeline:** SHINE counselors will return calls within two business days[7]. No other processing timelines specified.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- SHINE is a counseling and information program, NOT a benefits program itself. It helps people understand and apply for Medicare, MassHealth, and other programs—it does not directly provide financial assistance or healthcare services[3][6]
- The program name is sometimes listed as 'Serving the Health Insurance Needs of Everyone' (not 'Elders' as in the user's query), though it serves elders and individuals with disabilities[3]
- Eligibility for cost-saving programs that SHINE counselors help access (like MassHealth, Medicare Savings Programs, Extra Help) have their own separate income and asset limits that are not detailed in SHINE program materials—families must ask counselors about these specific programs[1][4]
- SHINE is partially federally funded (by Centers for Medicare & Medicaid Services and Administration for Community Living) but administered at the state level, which may affect availability or service models by region[2][3]
- All SHINE counseling is free and confidential[6], but families must initiate contact—the program does not proactively reach out
- Medicare Open Enrollment (October 15 to December 7) is identified as a 'crucial time' to use SHINE services, suggesting this is peak demand season[3]
- Medicare Advantage Open Enrollment runs January 1 through March 31 annually, another key period for SHINE counseling[2]

**Data shape:** SHINE is a statewide information and counseling program with no direct financial benefits or service hours. It operates through a decentralized network of regional providers (senior centers, Councils on Aging, elder service agencies, community organizations) rather than a single application process or centralized eligibility determination. Eligibility is broad (Massachusetts residents with Medicare or approaching Medicare eligibility) with no published income or asset limits for SHINE itself, though counselors help screen for and access other programs that do have limits. The program's value is in expert guidance and navigation assistance rather than direct benefits. Regional variations exist in which organizations provide SHINE services and how to contact them, but the core service offering is consistent statewide.

**Source:** https://www.mass.gov/info-details/serving-the-health-insurance-needs-of-everyone-shine-program

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits specified in state regulations; approximately 65% of recipients have incomes below federal poverty level, but eligibility is needs-based rather than income-tested[6].
- Assets: No asset limits mentioned; not a factor in eligibility[2].
- Chronically or temporarily homebound due to illness, disability, or inability to safely leave home regularly[1][2][7]
- Physically or emotionally unable to shop for or prepare at least one nutritious meal per day[1]
- Inadequate family or formal support for meal preparation[1]
- Lack of transportation to grocery stores or senior dining sites[1]
- Reside in the service area of a local provider (varies by region)[2][7]
- Spouses or dependents with disabilities may qualify regardless of age[5][8]

**Benefits:** Nutritionally balanced hot lunch delivering at least 1/3 of daily recommended dietary allowances, including special diets for conditions like diabetes or heart disease; daily safety check-in and social contact by delivery driver; delivered weekdays (e.g., 10:30 a.m.-2:00 p.m. in Boston); over 30,000 meals daily statewide[1][6][7][8]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or Meals on Wheels provider for your region (use https://www.mealsonwheelsamerica.org/find-meals-and-services/ or https://www.massmealsonwheels.org to find agency)[3][8]
- Phone varies by provider (e.g., Greater Springfield Senior Services for western MA; Meals on Wheels Boston for Boston)
- In-person assessment by provider staff
- Referral by family, healthcare provider, or self-referral[3]

**Timeline:** Varies; some within a week, longer if waitlisted[2]
**Waitlist:** Common in high-demand areas; varies by local program[2]

**Watch out for:**
- Must live in specific provider's delivery zone; not available statewide without local service[2]
- Homebound status strictly enforced (e.g., drivers cannot leave meals at door if not home in Boston)[7]
- Car ownership or ability to leave home may disqualify[2]
- Weekdays only; no weekends/holidays typically
- Waitlists common; contact early[2]
- Not income-based like SNAP; focuses on functional needs[6]

**Data shape:** Decentralized by local providers with regional service zones; no statewide income/asset tests; eligibility emphasizes homebound status over finances; spouses/dependents included regardless of age

**Source:** https://www.mass.gov/info-details/elder-affairs-nutrition-programs (state Elder Affairs oversees; local via Mass Meals on Wheels)[5][8]

---

### Family Caregiver Support Program (includes Respite)


**Eligibility:**
- Income: No income or asset limits specified; program is free for eligible caregivers.[1][8]
- Assets: No asset limits or countable/exempt asset rules mentioned.[1][8]
- Caregiver: Adult family member or non-paid caregiver, age 18+ (or grandparent/relative age 55+ for children under 18 or adults 18-59 with disability).[1][8]
- Care recipient: Age 60+ or any age with Alzheimer's/related dementia; or for grandparents/relatives: child under 18 or adult 18-59 with disability.[1][8]

**Benefits:** Respite care (temporary relief for caregivers), counseling, training, support groups, and supplemental services; specific respite details (e.g., hours, dollar amounts) not quantified in sources and vary by local provider.[1][8]
- Varies by: region

**How to apply:**
- Contact local Aging Service Access Points (ASAPs) via phone: (800) 243-4636 or search at https://contactus.800ageinfo.com/FindAgency.aspx[5]
- In-person or phone through regional ASAP offices[5]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by region or enrollment caps in related waivers (e.g., 120-20,000 slots in waivers).[5]

**Watch out for:**
- Not exclusively for elderly (includes dementia any age, relatives caring for children/disabled adults); respite often via waivers with caps.[1][5][8]
- Free but may have regional availability limits; not paid caregiver compensation (family unpaid).[1][8]
- Confused with MassHealth PCA/AFC (those require MassHealth enrollment, co-residency, ADL needs, may pay family).[2][3][4]
- Legal guardians often ineligible for respite in waivers.[5]

**Data shape:** No income/asset test; caregiver-focused with tiered recipient categories; regional ASAP delivery with waiver enrollment caps; respite embedded in broader supports, not standalone quantified hours/dollars.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/info-details/family-caregiver-support-program[8]

---

### Massachusetts Senior Legal Helpline

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified for the helpline itself; eligibility for free attorney representation through referrals may depend on income guidelines of partnered civil legal services programs (e.g., below 125% of federal poverty level in some cases, but not required for helpline services)
- Assets: No asset limits mentioned
- Massachusetts resident
- Civil legal issues only (e.g., excludes criminal matters, medical malpractice, workers’ compensation, personal injury unless specified)

**Benefits:** Free legal information, advice, and referrals on civil law topics including Social Security/SSI, veterans benefits, MassHealth, Medicare, consumer issues, public benefits, unemployment, foreclosures, guardianship, power of attorney, wills/advance directives, bankruptcy, evictions, landlord/tenant, utilities, family law, nursing home issues; possible referral to free attorney (most callers ineligible), reduced-fee attorneys on sliding scale, private bar referrals, or written materials via text/email/mail

**How to apply:**
- Phone: 800-342-5297 (Mon-Fri 9AM-12PM)
- Download brochure for more info: https://www.mass.gov/doc/senior-legal-help-line/download

**Timeline:** Immediate phone consultation during hours; referrals or attorney eligibility determined during call

**Watch out for:**
- Most callers not eligible for free attorney—primarily information/referral service; limited hours (Mon-Fri 9AM-12PM); civil law only, no criminal cases; separate from Attorney General's Elder Hotline (888-243-5337) which focuses on consumer/abuse issues; one outdated source lists different phone (1-866-778-0939)—use 800-342-5297

**Data shape:** no income test for core helpline access; free info/referrals to all qualifying seniors regardless of finances; attorney services via referral with potential means test; statewide but run by single Boston-based provider

**Source:** https://www.mass.gov/doc/senior-legal-help-line/download

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits specified in available documentation
- Assets: No asset limits specified in available documentation
- Resident must live in a nursing home, rest home, or assisted living facility in Massachusetts
- Program serves residents across all 683 nursing homes, rest homes, and assisted living residences in the state

**Benefits:** Free advocacy services including complaint investigation and resolution, mediation between residents and facilities, information about resident rights, assistance selecting facilities, and advocacy for systemic long-term care improvements. In Federal Fiscal Year 2023, the program resolved 3,426 complaints across categories including abuse/neglect/exploitation, care quality, autonomy/rights, financial/property issues, admission/discharge, and facility policies.

**How to apply:**
- Phone: (617) 222-7495 — Main Ombudsman Line
- Website: https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program
- In-person: 1 Ashburton, Room 517, Boston, MA
- Regional contact: Each Massachusetts city and town is aligned with a regional social services agency that hosts an area LTC ombudsman (e.g., Bay Path Elder Services for Natick residents)

**Timeline:** Not specified in available documentation
**Waitlist:** Not specified in available documentation

**Watch out for:**
- This is NOT a regulatory agency — ombudsmen advocate for residents but do not regulate facilities. However, they are trained on CMS regulations and can educate residents on compliance issues.
- Anyone can file a complaint on behalf of a resident, not just the resident themselves or their family.
- The program is federally mandated and has existed since the early 1970s, but it relies on a mix of 41 paid staff and 199 certified volunteer ombudsmen — response capacity may vary by region.
- Confidentiality is maintained except when abuse/neglect is severe enough to require reporting to police or similar authorities.
- To locate your specific regional ombudsman, you must identify which social services agency serves your city/town — the main line can direct you.
- Ombudsmen visit facilities regularly but are not on-site full-time; residents should contact the ombudsman directly rather than expecting immediate facility-based presence.

**Data shape:** This program is eligibility-free and universally available to all residents of qualifying facilities statewide. There are no income, asset, or age requirements. The program structure is geographically distributed across 17 regional host sites, each serving specific cities and towns through affiliated social services agencies. Benefits are fixed (free advocacy services) rather than scaled. The program is primarily volunteer-driven (199 certified volunteers vs. 41 paid staff), which may create regional variation in service capacity and response times, though this is not explicitly documented in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program

---

### Prescription Advantage

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older (or under 65 if disabled and meeting specific criteria)+
- Income: Varies by membership category (S0-S5) and Medicare eligibility. Effective January 1, 2026, for Medicare-eligible: Single yearly/monthly: S0 (0-$21,128/0-$1,761), S1 ($21,129-$26,409/$1,762-$2,200), S2 ($26,410-$31,689/$2,201-$2,641), S3 ($31,690-$37,000/$2,642-$3,083), S4 ($37,001-$46,950/$3,084-$3,912), S5 ($46,951-$78,250/$3,913-$6,521). Married: S0 (0-$28,553/0-$2,379), up to S5 ($63,451-$105,750/$5,289-$8,813). Under 65 disabled: ≤188% FPL (~$22,334 single/$30,118 married). Must apply for Extra Help if income ≤$22,590 single/$30,660 married; MSP if ≤$35,213 single/$47,588 married. Overall cap <500% FPL for Medicare-eligible (~$59,400 single/$80,100 married). Not MassHealth/CommonHealth members.[1][3][4][5][6]
- Assets: No asset limits for general eligibility. For required Extra Help application: ≤$17,220 single/$34,360 married (excludes home, life insurance, burial plots, personal possessions). MSP application required but assets N/A.[3][5][6]
- Massachusetts resident with primary residence in state
- Medicare-eligible must enroll in Medicare Part D, Medicare Advantage with drug coverage, or creditable coverage
- Under 65: work ≤40 hours/month, income ≤188% FPL, meet MassHealth CommonHealth disability guidelines
- Not enrolled in MassHealth or CommonHealth (MSP enrollees ineligible)
- Apply for Extra Help (proof required) and MSP if income qualifies, or ineligible
- HIV program separate (physician referral required)

**Benefits:** Secondary prescription drug coverage paying co-pays, deductibles, coinsurance after primary Medicare Part D/creditable plan. Provides out-of-pocket spending limit (varies by income category); covers co-pays after limit reached for plan year. No premium; possible yearly enrollment fee per Rate Schedule. Special Enrollment Period for Medicare plans. Primary coverage for non-Medicare eligible.[3][5][8]
- Varies by: priority_tier

**How to apply:**
- Online: www.prescriptionadvantagema.org (apply online)
- Phone: 1-800-243-4636 (Customer Service, TTY 711)
- Mail: Submit completed application form
- Download form: Prescription Advantage application (separate for each household member); Rate Schedule Guide
- In-person: Not specified, contact via phone for assistance

**Timeline:** Not specified in sources
**Waitlist:** Possible cost containment measures if funding limited; no standard waitlist mentioned[2]

**Watch out for:**
- Must apply for Extra Help and MSP if income qualifies (proof required) or denied PA benefits
- MSP enrollees ineligible for PA
- Medicare-eligible must have primary Part D/creditable coverage
- Separate application per household member
- Funding may impose cost containment (e.g., enrollment pauses)
- Income based on gross annual household; categories determine co-pay help
- Non-Medicare get primary coverage but still income-tiered

**Data shape:** Tiered by income categories (S0-S5) with precise yearly/monthly limits scaling for single/married; mandatory applications for federal programs (Extra Help/MSP) as gatekeepers; no general asset test but tied to those programs

**Source:** https://www.prescriptionadvantagema.org/ and https://www.mass.gov/info-details/prescription-advantage

---

### Home Care Program (HCP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older; individuals under 60 may qualify if they have early-onset Alzheimer's disease or related dementia[1][2]+
- Income: Annual gross income must be less than $34,812/year (approximately $2,901/month) as of 2025[6]. MassHealth members are automatically financially eligible regardless of income[1]
- Assets: Not specified in available search results
- Must be a Massachusetts resident[1][2]
- Must live at home within Massachusetts, not in an institutional setting or certified assisted living facility[1][2]
- Must have functional needs requiring assistance with Activities of Daily Living (ADLs) or Instrumental Activities of Daily Living (IADLs) such as bathing, dressing, meal preparation, or medication management[1][2]
- Priority is based on number of ADLs/IADLs requiring assistance; those needing only IADL help may be classified as lower priority or may not qualify[6]

**Benefits:** Services may include: care management, care coordination, advocacy, education, homemaker services, personal care assistance, Adult Day Health programs, home-delivered meals, transportation, money management, skilled nursing care (wound care, injections, medication management), physical/occupational/speech therapy, and chronic illness management[4][6]
- Varies by: priority_tier (based on number of ADLs/IADLs requiring assistance); specific hours and service plans determined through in-home assessment[1][5]

**How to apply:**
- Phone: Call MassAbility Connect at 617-204-3665[5]
- Contact local Aging Services Access Point (ASAP)[1]
- Consult with healthcare provider or social worker who can refer[1]

**Timeline:** Up to 3-4 months to process application, determine eligibility, and arrange for services[5]
**Waitlist:** Depending on funding, HCAP may have a waitlist for eligible consumers or may establish open enrollment periods during which new referrals will be accepted[5]

**Watch out for:**
- Financial eligibility is the most common barrier to qualification; many families discover they exceed the income limit of $34,812/year[1]
- The program prioritizes those with multiple ADL needs; individuals needing only IADL assistance (like meal prep or money management) may be classified as lower priority or may not qualify at all[6]
- Applicants must be living at home—those in assisted living facilities or institutional settings are ineligible, even if they meet other criteria[1][2]
- Processing takes 3-4 months; there may be waitlists depending on funding availability[5]
- MassHealth enrollment automatically satisfies financial eligibility, but non-MassHealth applicants face strict income limits[1]
- A comprehensive functional needs assessment is required; eligibility is based on demonstrated inability to perform daily tasks, not just age[1]

**Data shape:** Benefits scale by priority tier based on number of ADLs/IADLs requiring assistance. Income limits are fixed statewide. The program is means-tested but MassHealth members bypass the income test. Processing time is standardized at 3-4 months but waitlist status varies by funding availability. No asset limits are specified in available documentation. Regional variations in wait times are possible but not detailed.

**Source:** https://www.mass.gov/info-details/home-care-program and https://www.mass.gov/how-to/how-to-apply-for-home-care-assistance-program-hcap

---

### Enhanced Community Options Program (ECOP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: At or below ASAP income guidelines (specific dollar amounts not detailed in sources; aligns with Frail Elder Waiver standards for low-income older adults). No full table by household size provided[2][3].
- Assets: Less restrictive than nursing home eligibility to facilitate enrollment; designed for those in process of spending down assets for MassHealth Frail Elder Waiver. Exact limits and exemptions not specified, but clarified allowable by CMS SMD #21-004[3].
- Clinically qualifies for MassHealth-funded nursing home care (same as Frail Elder Waiver)[3][4]
- Resides in geographical area served by local Aging Services Access Point (ASAP)[2]
- Typically ineligible for MassHealth Standard (middle-income program for those not yet qualifying for MassHealth)[4][6]
- Meets State Home Care eligibility criteria[2]

**Benefits:** Higher level of in-home supportive services including personal care (e.g., bathing), homemaking, chore, laundry, home health aide, companion, adult day care, home delivered meals, grocery shopping, transportation, personal emergency response systems. Maximum of 7.5 hours per week of assistance. Providers receive set state funding rate per client, adjusted annually[3][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Aging Services Access Point (ASAP) for assessment (e.g., Springwell as designated ASAP in its region)[6]
- In-home comprehensive assessment by ASAP care manager with nurse consultation[6]

**Timeline:** Not specified in sources.
**Waitlist:** Statewide enrollment cap at 7,322 slots (down from 9,000 as of June prior to 2026); new enrollees waitlisted once cap reached, leading to months-long delays[3]. Increased minimum spend threshold for new enrollees as of Feb 1 prior to 2026[4].

**Watch out for:**
- Enrollment cap causes waitlists; new enrollees face delays and potential nursing home risk[3]
- Recent tightening: higher minimum spend threshold on services for new enrollees; those needing less directed to basic home care[4]
- Not for MassHealth Standard, Basic, or HMO recipients; targets pre-Medicaid 'spend-down' phase[2][4]
- Max 7.5 hours/week cap, regardless of need[3][5]
- Existing enrollees protected from caps/changes[3][4]

**Data shape:** Administered via regional ASAPs with statewide cap and waitlist; eligibility bridges to MassHealth Frail Elder Waiver during asset spend-down; recent policy changes include enrollment ceiling and spend thresholds.

**Source:** https://www.mass.gov (general state programs; specific ECOP page not in results)

---

### Home Modification Loan Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross household income up to 200% of Area Median Income (AMI), updated annually based on HUD guidelines. Example limits (likely recent): 1-person: $207,800; 2: $237,600; 3: $267,200; 4: $296,800; 5: $320,600; 6: $344,400; 7: $368,200; 8: $391,800. Varies by region due to AMI differences.[1][2][6]
- Assets: Countable assets limited to $75,000-$175,000 depending on provider/region (e.g., $75,000 in some areas like Metro Housing Boston, up to $175,000 for primary heads of household in others). Countable: cash savings, checking/savings/money market/brokerage accounts. Exemptions not specified; bank statements required for verification.[2][3]
- Homeowner (or small landlord with <10 units for tenant mods).
- Household includes older adult (typically 60+) or person with disability.
- Modifications must address functional limitations/disability (e.g., ramps, bathroom adaptations), certified by professional; not for general repairs (roof, windows, septic, heating).
- Up to date on MA state income and property taxes.
- Landlords with 10+ units ineligible unless proving hardship via litigation.[1][2][3][4][5]

**Benefits:** 0% interest, deferred-payment loans ($1,000-$50,000) for homeowners; 3% interest amortizing loans for eligible small landlords (<10 units). Covers accessibility mods like ramps, lifts, bathroom/kitchen adaptations, handrails, doorway widening, accessory dwelling units. No monthly payments, no credit checks.[1][4][5][6][7]
- Varies by: region

**How to apply:**
- Contact regional provider agency (6 agencies statewide) for assistance; applications via provider.
- No central online form; submit to provider (e.g., Metro Housing Boston application PDF).
- Phone/website examples: Valley CDC (valleycdc.org), NHS Mass (nhsmass.org), Way Finders (wayfinders.org), SMOC (smoc.org).
- Contractor submits Bid Form and Scope of Work after selection.[2][3][5]

**Timeline:** Not specified; applications reviewed by regional providers after complete submission including contractor bid.[4][5]

**Watch out for:**
- Modifications must directly relate to disability/functional limitation (not general repairs like roof/heating).
- Contractor bid form required before eligibility determination; choose qualified MA-licensed contractor with insurance.
- Income/assets verified at closing (must be current 60 days).
- Landlords: <10 units only; 10+ ineligible without litigation proof.
- Not a grant—loan secured by promissory note/mortgage lien, repaid upon sale/refinance/death.
- Regional providers handle apps; must go through correct one.[1][2][3][4][5]

**Data shape:** Administered regionally by 6 providers with AMI-based income varying by area; asset caps differ by provider; requires contractor bid for eligibility; loan not grant

**Source:** https://cedac.org (administers HMLP; see HMLP section for providers)

---

### Commonwealth Coordinated Care (CCC)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits identified for CCC in search results. Eligibility typically ties to MassHealth Standard, which has income thresholds varying by category (e.g., for seniors 65+, often 100% FPL or higher with deductions; exact 2026 figures not in results—check MassHealth.gov for current table). Full table not available here.
- Assets: No specific asset limits identified for CCC. For related MassHealth senior programs like SCO, home equity limit is $1,097,000 (2025 figure for community residents intending to return home).[2]
- Massachusetts residency required.[1]
- Likely requires MassHealth Standard or CommonHealth enrollment (common for coordinated care programs).[3][4][5][6]
- Functional need for long-term care or daily assistance may apply, similar to related programs (e.g., NFLOC for SCO).[2]
- No clear age requirement specified for CCC; related programs vary (SCO 65+, One Care 21-64).[5][6]

**Benefits:** No specific services detailed for CCC in results. Likely coordinated care including home health, personal care, or long-term services based on MassHealth ties (e.g., skilled nursing, therapy, ADL assistance in similar programs).[4]
- Varies by: region

**How to apply:**
- No specific methods for CCC found; apply via MassHealth general channels: mass.gov/masshealth, call MassHealth at 1-800-841-2900 (general line, confirm for CCC).
- For related SCO/One Care, contact plans like Commonwealth Care Alliance.[5][6]

**Timeline:** Not specified in results.
**Waitlist:** Not specified; regional waitlists possible for long-term services.

**Watch out for:**
- CCC not explicitly detailed in results—may be outdated name, internal term, or confusion with SCO/One Care; verify current name/status.
- Ties to MassHealth Standard required; Medicare changes for SCO in 2026 (must have Parts A/B).[5][7]
- Exclusions for certain living situations (e.g., hospital inpatients, specific facilities).[2][7]
- Functional/cognitive assessments required beyond age/income.[2]

**Data shape:** Program not directly documented; data sparse—likely managed care variant like SCO/One Care with regional plans, MassHealth prerequisite, no fixed income table in results, geography-limited.

**Source:** https://www.mass.gov/masshealth (no direct CCC page in results; check for program details)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| MassHealth Medicare Savings Program (MSP | benefit | federal | deep |
| Frail Elder Waiver (FEW) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| SNAP (Food Stamps) | benefit | federal | medium |
| Residential Conservation Service (Weathe | benefit | federal | deep |
| SHINE (Serving the Health Insurance Need | navigator | state | simple |
| Meals on Wheels | benefit | federal | deep |
| Family Caregiver Support Program (includ | benefit | state | medium |
| Massachusetts Senior Legal Helpline | navigator | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Prescription Advantage | benefit | state | medium |
| Home Care Program (HCP) | benefit | state | deep |
| Enhanced Community Options Program (ECOP | benefit | state | deep |
| Home Modification Loan Program | benefit | state | deep |
| Commonwealth Coordinated Care (CCC) | benefit | local | deep |

**Types:** {"benefit":12,"navigator":2,"resource":1}
**Scopes:** {"federal":5,"state":8,"local":2}
**Complexity:** {"deep":9,"medium":3,"simple":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/MA/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **region**: 5 programs
- **household_size and net_income**: 1 programs
- **not_applicable**: 3 programs
- **priority_tier (based on number of ADLs/IADLs requiring assistance); specific hours and service plans determined through in-home assessment[1][5]**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MassHealth Medicare Savings Program (MSP) / Buy-In**: This program has undergone significant recent expansions: income limits increased from 135% FPL (2019) to 165% FPL (2020) to 225% FPL (2023), and asset limits were completely eliminated as of March 1, 2024[1][2][3]. The program operates as three distinct tiers (QMB, SLMB, QI) with different benefit levels, but all three are administered together as 'Medicare Savings Programs' by MassHealth[3][5]. Notably, MSP-only has no asset test, but combined MSP+MassHealth applications do have asset limits[3]. The program is statewide with no regional variations in eligibility or benefits.
- **Frail Elder Waiver (FEW)**: Tied to MassHealth financial eligibility (300% SSI/FPL with $2k asset cap, spousal allowances); regional ASAP delivery with clinical screening by RN; must use services monthly; spend-down for medically needy
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to specific PACE provider service areas in Massachusetts (not statewide); multiple regional providers with varying locations; no fixed income/asset table but low thresholds for full coverage; high-need nursing home eligible only; no central application—provider-specific
- **SNAP (Food Stamps)**: SNAP in Massachusetts is uniquely structured around age and disability status. Seniors (60+) and disabled individuals have access to simplified eligibility pathways (net income test only, no gross income test) and a streamlined application process (EDSAP) with a 36-month certification period and no recertification interview required. Benefits scale by household size and net income. The program has recently undergone significant federal changes (2025) that tighten work requirements and non-citizen eligibility, disproportionately affecting seniors aged 60–65. Utility allowances are substantial and must be claimed separately. Massachusetts has expanded eligibility beyond federal minimums, making it more accessible than many other states.
- **Residential Conservation Service (Weatherization)**: Administered regionally by community action agencies with Fuel Assistance as gateway; income at 60% SMI; priority tiers; landlord rules for renters; no centralized application.
- **SHINE (Serving the Health Insurance Needs of Everyone)**: SHINE is a statewide information and counseling program with no direct financial benefits or service hours. It operates through a decentralized network of regional providers (senior centers, Councils on Aging, elder service agencies, community organizations) rather than a single application process or centralized eligibility determination. Eligibility is broad (Massachusetts residents with Medicare or approaching Medicare eligibility) with no published income or asset limits for SHINE itself, though counselors help screen for and access other programs that do have limits. The program's value is in expert guidance and navigation assistance rather than direct benefits. Regional variations exist in which organizations provide SHINE services and how to contact them, but the core service offering is consistent statewide.
- **Meals on Wheels**: Decentralized by local providers with regional service zones; no statewide income/asset tests; eligibility emphasizes homebound status over finances; spouses/dependents included regardless of age
- **Family Caregiver Support Program (includes Respite)**: No income/asset test; caregiver-focused with tiered recipient categories; regional ASAP delivery with waiver enrollment caps; respite embedded in broader supports, not standalone quantified hours/dollars.
- **Massachusetts Senior Legal Helpline**: no income test for core helpline access; free info/referrals to all qualifying seniors regardless of finances; attorney services via referral with potential means test; statewide but run by single Boston-based provider
- **Long-Term Care Ombudsman Program**: This program is eligibility-free and universally available to all residents of qualifying facilities statewide. There are no income, asset, or age requirements. The program structure is geographically distributed across 17 regional host sites, each serving specific cities and towns through affiliated social services agencies. Benefits are fixed (free advocacy services) rather than scaled. The program is primarily volunteer-driven (199 certified volunteers vs. 41 paid staff), which may create regional variation in service capacity and response times, though this is not explicitly documented in available sources.
- **Prescription Advantage**: Tiered by income categories (S0-S5) with precise yearly/monthly limits scaling for single/married; mandatory applications for federal programs (Extra Help/MSP) as gatekeepers; no general asset test but tied to those programs
- **Home Care Program (HCP)**: Benefits scale by priority tier based on number of ADLs/IADLs requiring assistance. Income limits are fixed statewide. The program is means-tested but MassHealth members bypass the income test. Processing time is standardized at 3-4 months but waitlist status varies by funding availability. No asset limits are specified in available documentation. Regional variations in wait times are possible but not detailed.
- **Enhanced Community Options Program (ECOP)**: Administered via regional ASAPs with statewide cap and waitlist; eligibility bridges to MassHealth Frail Elder Waiver during asset spend-down; recent policy changes include enrollment ceiling and spend thresholds.
- **Home Modification Loan Program**: Administered regionally by 6 providers with AMI-based income varying by area; asset caps differ by provider; requires contractor bid for eligibility; loan not grant
- **Commonwealth Coordinated Care (CCC)**: Program not directly documented; data sparse—likely managed care variant like SCO/One Care with regional plans, MassHealth prerequisite, no fixed income table in results, geography-limited.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Massachusetts?
