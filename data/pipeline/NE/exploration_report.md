# Nebraska Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 1.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 15 |
| New (not in our data) | 11 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |

## Program Types

- **in_kind services**: 1 programs
- **service**: 8 programs
- **financial**: 4 programs
- **employment + financial + service**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Program (QMB, SLMB, QI)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `[object Object]` ([source](https://public-dhhs.ne.gov/ (Nebraska Department of Health and Human Services)))
- **source_url**: Ours says `MISSING` → Source says `https://public-dhhs.ne.gov/ (Nebraska Department of Health and Human Services)`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2794` → Source says `$23,475` ([source](https://dhhs.ne.gov/pages/energy-assistance.aspx[3]))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment to utility company for heating (Oct 1-Mar 31) or cooling costs, computed using 20% disregard of gross countable earned income after eligibility, based on income, assets, size, fuel type, housing. Crisis assistance for emergencies (e.g., shutoff, broken heater). Exact max amounts vary; no fixed dollar listed. Weatherization separate with different eligibility.[2][5][6]` ([source](https://dhhs.ne.gov/pages/energy-assistance.aspx[3]))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/pages/energy-assistance.aspx[3]`

### Home-Delivered Meals (via AAAs)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Well-balanced home-delivered meals Monday-Friday by volunteers or drivers; each meal meets 1/3 of daily recommended dietary needs for adults 60+; weekend meals available at some locations for extreme needs; written assessment within 2 weeks of first meal, annual reassessment[1][4][8].` ([source](https://dhhs.ne.gov (State Unit on Aging guidelines); local AAAs like https://nenaaa.com[1][2][4].))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov (State Unit on Aging guidelines); local AAAs like https://nenaaa.com[1][2][4].`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `FREE confidential services including: (1) Education on aging, long-term care, and residents' rights; (2) Information & Referral to empower individuals to resolve concerns independently; (3) Consultation with recommendations for protecting resident rights and improving care; (4) Individual Advocacy to facilitate resolution of complaints and protect rights; (5) Systems Advocacy to identify problematic trends and advocate for systemic changes` ([source](https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx`

## New Programs (Not in Our Data)

- **Aged and Disabled (AD) HCBS Waiver** — in_kind services ([source](https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx))
  - Shape notes: This program's eligibility is driven by functional need (NFLOC) rather than income/asset thresholds alone. While income and asset limits exist, they are secondary to the requirement that applicants demonstrate significant ADL limitations. Benefits are individualized service plans, not fixed dollar amounts or hours. The waiver is statewide with no identified regional variations in eligibility or services. Processing involves a mandatory 14-day assessment window but no waitlist information is publicly available. The program serves both elderly (65+) and younger disabled individuals, making it broader than age-restricted programs.
- **PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://dhhs.ne.gov/Pages/Medicaid-Provider-All-Inclusive-Care-for-the-Elderly.aspx))
  - Shape notes: Only one provider in Eastern Nebraska counties; no income/asset test for core eligibility but needed for free coverage via Medicaid; requires NF LOC and community safety determination.
- **Weatherization Assistance Program** — service ([source](https://dee.nebraska.gov/aid/nebraska-weatherization-assistance-program))
  - Shape notes: Delivered via 8 regional non-profit providers with unique contacts; income at 200% FPL or auto-eligible via benefits programs; no age requirement but priority implied for elderly/vulnerable; customized services post-audit, not fixed amounts.
- **Nebraska SHIP (State Health Insurance Assistance Program)** — service ([source](https://doi.nebraska.gov/consumer/nebraska-ship-smp[3][4]))
  - Shape notes: no income/asset test; counseling-only service via volunteer network; focuses on Medicare navigation and fraud prevention (SMP); delivered statewide through local AAA partners
- **Lifespan Respite Services** — financial ([source](https://dhhs.ne.gov/Pages/Respite.aspx))
  - Shape notes: Financial subsidy with asset/income test but no published dollar thresholds; exceptional crisis funding as add-on; statewide with local coordinators/providers; excludes those eligible for other govt respite
- **Senior Community Service Employment Program (SCSEP)** — employment + financial + service ([source](https://dol.nebraska.gov/ReemploymentServices/Training/SCSEPProgram and https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: This program's key limitation is that specific dollar amounts for income thresholds, processing timelines, and detailed regional provider information are not available in public sources. Families must contact their local workforce center for current, specific information. The program is characterized by its dual focus on community service (providing no-cost labor to nonprofits/government agencies) and participant employment outcomes, which distinguishes it from other senior employment programs.
- **Legal Services for Seniors (via AAAs/OAA)** — service ([source](https://dhhs.ne.gov/pages/aging-legal-services.aspx))
  - Shape notes: Statewide via regional AAAs with no strict income/asset tests but priority tiers; phone-based intake with attorney callback; covers 93 counties through OAA-funded partnerships
- **Nebraska Community Aging Services Act** — service ([source](https://nebraskalegislature.gov/laws/display_html.php?begin_section=81-2201&end_section=81-2228))
  - Shape notes: Administered via local Area Agencies on Aging (AAAs) with flexible, assessment-based eligibility rather than strict financial cutoffs; services scaled to local needs, no central waitlist or fixed benefits; statewide framework with regional delivery variations
- **Aging and Disability Resource Center Act** — service ([source](https://dhhs.ne.gov/Pages/Aging-and-Disability-Resource-Center.aspx))
  - Shape notes: no income/asset test; info/referral only (not direct benefits); statewide via local collaboratives and 211; gateway to means-tested programs like AD Waiver.
- **Social Services for the Aged and Disabled (SSAD)** — service ([source](https://dhhs.ne.gov/Pages/Social-Services-Aged-and-Disabled-Adults.aspx))
  - Shape notes: SSAD is a means-tested, need-based safety-net program with income eligibility but no publicly specified income thresholds or asset limits. Benefits are service-based (not cash assistance) and limited to two service categories. The program explicitly targets individuals who fall outside other assistance programs, making it a residual rather than primary support option. Specific service hours, frequency, and dollar limits are not documented in available sources and likely require direct contact with DHHS for clarification.
- **Assistance to Aged, Blind or Disabled (AABD)** — financial ([source](https://dhhs.ne.gov/Pages/Aged-Blind-or-Disabled.aspx))
  - Shape notes: Tied to SSI denial for short-term disabilities; payment rates vary strictly by living arrangement/FBR rather than household size; statewide but separate aged/blind/disabled age tracks.

## Program Details

### Aged and Disabled (AD) HCBS Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, OR any age with a qualifying disability+
- Income: Must be eligible for Nebraska Medicaid based on income and resource guidelines. Specific dollar amounts not provided in available sources; applicants should contact DHHS at 877-667-6266 or visit iServe Nebraska for current income thresholds.
- Assets: Home equity interest cannot exceed $752,000 (as of 2026). Home equity is calculated as current home value minus outstanding mortgage. Applicant must own or have intent to return to the home. Exceptions to asset limits apply if applicant has: spouse living in home, minor child (17 or younger) living in home, or permanently disabled/blind child (any age) living in home.
- Be a U.S. citizen or qualified alien lawfully present in the United States
- Be a Nebraska resident
- Receive Nebraska Medicaid
- Meet Nursing Facility Level of Care (NFLOC) requirements
- Have a need for waiver services

**Benefits:** Specific dollar amounts and hours per week not provided in available sources. Contact DHHS for individualized service plan details.
- Varies by: Individual need and level of care assessment; not fixed by household size or tier

**How to apply:**
- Online: iServe Nebraska (website URL not provided in sources; contact DHHS for link)
- Phone: Call DHHS at 877-667-6266 to request paper application or ask questions
- Mail: Submit completed application to DDD Eligibility, PO Box 98947, Lincoln, NE 68509-8947
- Email: DHHS.HCBSWaiverApp@nebraska.gov
- Fax: 402-328-6257

**Timeline:** Level of Care assessment scheduled within 14 days of application submission
**Waitlist:** Not specified in available sources; contact DHHS for current waitlist status

**Watch out for:**
- NFLOC requirement is strict: applicants must demonstrate significant functional limitations across multiple ADLs. Simply being elderly or having one disability is insufficient.
- Home equity limit of $752,000 is substantial but can be a barrier in high-value real estate markets. The limit applies to the applicant's equity interest specifically, not total home value.
- Waiver expiration date is July 31, 2026 — verify current status with DHHS as renewal/reauthorization may be pending.
- Medicaid eligibility is a prerequisite; applicants must qualify for Nebraska Medicaid independently before waiver services can be accessed.
- The interRAI-HC assessment is mandatory and detailed; applicants should be prepared to discuss specific limitations in daily living activities, not just general health status.
- PERS (Personal Emergency Response System) has specific eligibility criteria within the waiver: applicant must live alone or with a caregiver who has health problems/works outside home, have a history of falls, or have a health condition that might result in emergency.
- Income and asset limits are tied to Medicaid eligibility, which varies; families should not assume they know the limits without checking current DHHS guidelines.

**Data shape:** This program's eligibility is driven by functional need (NFLOC) rather than income/asset thresholds alone. While income and asset limits exist, they are secondary to the requirement that applicants demonstrate significant ADL limitations. Benefits are individualized service plans, not fixed dollar amounts or hours. The waiver is statewide with no identified regional variations in eligibility or services. Processing involves a mandatory 14-day assessment window but no waitlist information is publicly available. The program serves both elderly (65+) and younger disabled individuals, making it broader than age-restricted programs.

**Source:** https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx

---

### PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits or financial criteria for eligibility. Medicaid eligibility (if seeking full coverage without premiums) follows Nebraska long-term care rules: income under 300% of Federal Benefit Rate ($2,901/month in 2025); varies by marital status but not detailed by household size here. Private pay available for non-Medicaid eligible.
- Assets: No asset limits for PACE eligibility. For Medicaid coverage, assets $2,000 or less (excluding primary home).
- Certified by Nebraska as meeting nursing facility level of care (NF LOC) per 471 NAC 12.
- Able to live safely in the community at time of enrollment with PACE services.
- Live in the PACE service area (Douglas, Sarpy, and select zip codes in Cass, Dodge, Saunders, Washington Counties).
- Not enrolled in Medicare Advantage (Part C) or Medicare prepaid plan at enrollment.

**Benefits:** All-inclusive: primary care, hospital/inpatient, emergency, medications, transportation, therapies (OT/PT/ST), social services, adult day health care, home care, personal care, durable medical equipment, hospice, and all Medicare/Medicaid-covered services. No deductibles or copays for enrollees. Specific hours/dollars not fixed; individualized via interdisciplinary team.
- Varies by: region

**How to apply:**
- Phone: Contact Immanuel Pathways (specific number not in sources; call Nebraska DHHS at general Medicaid line or visit provider site).
- In-person: Immanuel Pathways centers in Omaha (Eastern Nebraska).
- Direct inquiry to PACE organization (Immanuel Pathways); they verify eligibility.

**Timeline:** Not specified in sources.
**Waitlist:** Not detailed; may vary by provider capacity.

**Watch out for:**
- Only available in specific Eastern Nebraska counties; not statewide.
- Must not be in Medicare Advantage; disenroll first.
- NF LOC certification required—needs state assessment.
- Private pay can cost $7,000+/month if not dually eligible.
- Voluntary; can leave anytime, but PACE becomes sole Medicare/Medicaid service source.
- 90% of participants are dually eligible; non-eligible pay premiums.

**Data shape:** Only one provider in Eastern Nebraska counties; no income/asset test for core eligibility but needed for free coverage via Medicaid; requires NF LOC and community safety determination.

**Source:** https://dhhs.ne.gov/Pages/Medicaid-Provider-All-Inclusive-Care-for-the-Elderly.aspx

---

### Medicare Savings Program (QMB, SLMB, QI)


**Eligibility:**
- Income: {"description":"Nebraska uses federal poverty level (FPL) thresholds, adjusted annually. As of 2026, income limits are:","QMB":{"threshold":"100% FPL","individual_monthly":"$1,350","couple_monthly":"$1,824"},"SLMB":{"threshold":"120-135% FPL","individual_monthly":"$1,478 to $1,660","couple_monthly":"$1,992 to $2,239"},"QI":{"threshold":"120-135% FPL","individual_monthly":"$1,660","couple_monthly":"$2,239"},"note":"Income limits are announced early each year and become effective in April[2]. The limits shown reflect 2026 federal standards[7][1]."}
- Assets: {"description":"Nebraska uses federal asset limits for SLMB and QI programs[1]","QMB":{"individual":"$9,950","couple":"$14,910"},"SLMB":{"individual":"$9,090","couple":"$13,630"},"QI":{"individual":"$9,090","couple":"$13,630"},"what_counts":"Resources include bank accounts, stocks, bonds, and other liquid assets[1]","what_exempt":"Primary residence and one vehicle are typically exempt from resource limits, though the search results do not provide Nebraska-specific exemption details"}
- Must be eligible for Medicare Part A (even if not currently enrolled)[2]
- Must be a resident of Nebraska[6]
- Must be a United States citizen or qualified non-citizen[6]

**Benefits:** [object Object]
- Varies by: program_tier

**How to apply:**
- Contact ACCESSNebraska (state Medicaid agency) — the primary administrator of MSP in Nebraska[8]
- Apply through your state Medicaid agency[2]

**Timeline:** [object Object]

**Watch out for:**
- Income limits change annually in April[2] — families should verify current limits each year rather than relying on previous year figures
- QMB eligibility is effective the first day of the month *following* the month the agency receives all documentation, not the month of application[2]
- SLMB and QI have retroactive coverage up to three months, but QMB does not[2] — timing of application matters for QMB
- QI is specifically for individuals who do not qualify for QMB or SLMB[3] — it's a fallback program, not a primary option
- Some states (like Connecticut) have eliminated asset limits entirely, but Nebraska has not[5] — asset limits are a real barrier in Nebraska
- The QI program may have limited funding; some states prioritize applications based on previous year enrollment[5]
- Qualifying for QI automatically qualifies you for Extra Help prescription drug assistance[3] — this is a hidden benefit many families miss
- Medicare Part A must be available (even if not enrolled) to qualify for any of these programs[2]
- The search results reference an older Nebraska asset limit of $8,400 for single individuals from a 2022 document[8], but more recent federal standards show $9,090-$9,950 depending on program[1][7] — families should verify current limits with ACCESSNebraska

**Data shape:** This program consists of three distinct tiers (QMB, SLMB, QI) with different income thresholds and benefits. Income limits are tied to the federal poverty level and adjust annually in April. Benefits scale by program tier: QMB provides the most comprehensive coverage (premiums, deductibles, coinsurance, copayments), while SLMB and QI cover only Part B premiums. Asset limits apply but vary by program. The program is administered statewide through ACCESSNebraska (the state Medicaid agency) with no apparent regional variations. Processing times differ by program tier, with QMB having a 45-day maximum and SLMB/QI offering retroactive coverage.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://public-dhhs.ne.gov/ (Nebraska Department of Health and Human Services)

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross annual income at or below 150% of the federal poverty level (October 1, 2025 - September 30, 2026): Household of 1: $23,475; 2: $31,725; 3: $39,975; 4: $48,225; 5: $56,475; 6: $64,725; 7: $72,975; 8: $81,225. Add $8,250 for each additional member.[3][5]
- Assets: Resources/assets are considered in benefit calculation along with income, household size, fuel type, and housing type. Specific asset limits or exemptions not detailed; verification of income implies related asset review.[6]
- Meet LIHEAP citizenship and residency requirements (U.S. citizen or qualified non-citizen, Nebraska resident).
- Be responsible for home energy utilities.
- Not otherwise disqualified or ineligible.
- Priority for households with member age 60 or older, under age 6, receiving disability payment, medical condition aggravated by extreme heat/cold (verified by licensed medical provider), or using electricity-requiring medical device.[5]
- Cooling priority if child under 6 on ADC, age 70+, severe heat-aggravated illness (verified), or no DHHS AC in past 4 years.[3][4]

**Benefits:** One-time payment to utility company for heating (Oct 1-Mar 31) or cooling costs, computed using 20% disregard of gross countable earned income after eligibility, based on income, assets, size, fuel type, housing. Crisis assistance for emergencies (e.g., shutoff, broken heater). Exact max amounts vary; no fixed dollar listed. Weatherization separate with different eligibility.[2][5][6]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://iserve.nebraska.gov or accessnebraska.ne.gov.[4][6]
- Phone: 1-800-383-4278 for paper application.[6]
- In-person: DHHS offices (list at https://dhhs.ne.gov/Pages/Public-Assistance-Offices.aspx).[4]
- Mail: Request paper application via phone.

**Timeline:** Eligibility determined within 30 days of valid application receipt; may extend if documentation delayed.[5]
**Waitlist:** Funding limited; applications may close early if funds exhausted. No formal waitlist mentioned; apply early.[2]

**Watch out for:**
- Auto-eligibility if receiving Economic Assistance benefits (no separate application needed).[1]
- Everyone at address counts as household, even non-expense sharers/roommates on same utility bill.[2]
- Heating season Oct 1-Mar 31; cooling summer; crisis year-round emergencies only. Apply early as funds limited.[2]
- Different eligibility for weatherization/HCRRA.[3]
- Gross income used; 20% earned income disregard only post-eligibility for payment computation.[5]
- Age 60+ or 70+ priority for heating/cooling respectively; medical verification required for conditions.[3][4][5]

**Data shape:** Income table fixed at 150% FPL with annual updates; benefits computed via formula (20% earned income disregard post-eligibility) varying by income/assets/size/fuel/housing/priority; statewide but local DHHS offices handle applications with potential regional processing variations; separate crisis/weatherization components.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov/pages/energy-assistance.aspx[3]

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households must have income at or below 200% of the federal poverty level. Households receiving ADC (Aid to Dependent Children), SSI (Supplemental Security Income), TANF, or LIHEAP during the current program year are automatically eligible. 2025 Income Guidelines (effective January 1, 2025):
|Household Size|100% Poverty|$31,300 (1), $42,300 (2), $53,300 (3), $64,300 (4), $75,300 (5), $86,300 (6), $97,300 (7), $108,300 (8). For >8 persons, +$11,000 per additional at 200%.[1][2][4]
- Assets: No asset limits mentioned in program guidelines.[1][4]
- Must occupy an owner-occupied or eligible dwelling unit.[1][4]
- U.S. citizenship or qualified alien status with documentation (form WX15).[4]
- For some related assistance like HCRRA (heating/cooling), additional criteria like emergency heating needs or specific vulnerabilities (e.g., child under 6 on ADC, person 70+, severe heat-aggravated illness), but core WAP focuses on income.[3]

**Benefits:** Free energy-efficiency improvements including insulation, new windows, air sealing, health/safety measures (indoor air quality, combustion safety, carbon monoxide checks), performed after energy audit and inspection. No fixed dollar amount; customized per home based on audit.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Contact local service provider by region (8 non-profits statewide; see geography.offices_or_providers).[1]
- Douglas County: Call 402-342-8232 or unitedwaymidlands.org/weatherization; 402-444-6666 Option 6; mail to United Way of the Midlands, 1229 Millwork Ave., Suite 402, Omaha, NE 68102-4277; email DCWAP@uwmidlands.org.[2][5]
- Mid-Nebraska (27 counties): Call (308) 865-5675 or contact county coordinator.[3]
- General: dee.nebraska.gov/aid/nebraska-weatherization-assistance-program for provider map.[1]

**Timeline:** Not specified statewide; involves intake, initial inspection (back draft, CO, efficiency audit), waitlist, work order, installation, final inspection.[3]
**Waitlist:** Waiting lists exist, varying by provider/region.[3]

**Watch out for:**
- Must contact specific regional provider, not a central state office—applications go through local non-profits.[1]
- Automatic eligibility only for SSI/ADC/TANF/LIHEAP recipients; others need full income verification at 200% FPL.[1][2][4]
- Owner-occupied units prioritized; rental eligibility may require landlord approval (not detailed).[4]
- Income guidelines revised annually—use current year's table (2025 shown).[1]
- Waiting lists common; priority for vulnerable households.[3]

**Data shape:** Delivered via 8 regional non-profit providers with unique contacts; income at 200% FPL or auto-eligible via benefits programs; no age requirement but priority implied for elderly/vulnerable; customized services post-audit, not fixed amounts.

**Source:** https://dee.nebraska.gov/aid/nebraska-weatherization-assistance-program

---

### Nebraska SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare-eligible individuals, families, and caregivers[1][2][3][10]
- Assets: No asset limits; no financial criteria apply[10]
- Must be Medicare-eligible (typically age 65+ or under 65 with certain disabilities), or a family member/caregiver of someone Medicare-eligible[1][2][3]

**Benefits:** Free, unbiased, personalized counseling and education on Medicare eligibility/benefits (Parts A, B, C, D), Medicare Supplement Insurance (Medigap), prescription drug plans, Extra Help for costs, Medicare Advantage plans, employer/retiree insurance, Medicaid; assistance with problems/decision-making; fraud prevention/reporting via SMP; outreach/training; no policy/company recommendations[1][2][3][5]

**How to apply:**
- Phone: 1-800-234-7119 (toll-free, 8:00 am - 4:30 pm)[2][3][4][7]
- Website: https://doi.nebraska.gov/consumer/nebraska-ship-smp[3]
- Email: Jonathan.Burlison@nebraska.gov[4]
- In-person: Schedule appointment with local counselor via phone (statewide network through area agencies on aging and partners like Northeast Nebraska AAA, West Central Nebraska AAA, Volunteers Assisting Seniors)[1][2][5]

**Timeline:** No formal application or processing; immediate phone assistance or scheduled counseling appointment[2][3]

**Watch out for:**
- Not an insurance provider or financial aid program—only free counseling/education, no direct payments or enrollment on your behalf[2]
- Medigap generally unavailable under age 65 in Nebraska; one-time guarantee issue period for Medigap starts with Part B after 65[1]
- Must have Parts A/B to join Medicare Advantage (Part C); provider acceptance varies, changes may wait up to a year[1]
- Counselors do not recommend specific policies/companies/agents[2]
- Volunteers must help minimum 24 people/year, but clients face no such requirement[3]

**Data shape:** no income/asset test; counseling-only service via volunteer network; focuses on Medicare navigation and fraud prevention (SMP); delivered statewide through local AAA partners

**Source:** https://doi.nebraska.gov/consumer/nebraska-ship-smp[3][4]

---

### Home-Delivered Meals (via AAAs)


**Eligibility:**
- Age: 60+
- Income: No strict income limits statewide; preference given to low-income older adults (including low-income minority older adults), but not a hard cutoff with dollar amounts. No table or asset limits specified in state guidelines[1][2][4].
- Assets: No asset limits or definitions of countable/exempt assets mentioned in program guidelines[1][2][4].
- Primary: Frail, homebound by reason of illness or incapacitating disability, unable to attend a congregate meal[1][2][4].
- Spouse of eligible person (60+ and homebound), regardless of age, if it supports keeping the older person at home[1][2][4].
- Dependent individual with a disability living with an eligible 60+ person[1][2][4].
- Preferences (not requirements): Low-income, limited English proficiency, rural residents[1][2][4].
- Each Area Agency on Aging (AAA) defines 'unable to attend congregate meal'[2].

**Benefits:** Well-balanced home-delivered meals Monday-Friday by volunteers or drivers; each meal meets 1/3 of daily recommended dietary needs for adults 60+; weekend meals available at some locations for extreme needs; written assessment within 2 weeks of first meal, annual reassessment[1][4][8].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA): Initial eligibility determination in-person or by phone; no statewide phone listed, varies by AAA (e.g., Northeast Nebraska AAA via nenaaa.com; Blue Rivers AAA at 402-223-1376 or 888-989-9417)[1][4][6].
- No specific statewide online URL, form name/number, mail, or in-person office listed; apply via local AAA[1][4].

**Timeline:** Written assessment within 2 weeks of first meal; reassessment annually or on status change[4].
**Waitlist:** Waiting lists established when providers cannot serve all eligible individuals[4].

**Watch out for:**
- Not automatic—requires homebound/frail assessment by local AAA; preferences but no hard income test[1][2][4].
- Voluntary contributions suggested, but stated as non-mandatory[4].
- Separate from Medicaid waivers (e.g., Aged & Disabled Waiver requires Medicaid/NFLOC); this is OAA-funded[2][3][5][6].
- Prioritization for greatest need may cause waitlists[4].
- Spouse/dependent eligibility tied to primary 60+ eligible person[1][4].

**Data shape:** Administered by 6 regional AAAs with local variations in assessment, providers, and weekend availability; no statewide income/asset tests, priority-based access under OAA; eligibility heavily functional (homebound) vs. financial[1][2][4].

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov (State Unit on Aging guidelines); local AAAs like https://nenaaa.com[1][2][4].

---

### Lifespan Respite Services

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income eligible (financial criteria apply); exact dollar amounts or household size table not specified in sources. Program staff may verify income per state statute[2][3][7].
- Assets: Liquid resources including cash on hand, checking/savings accounts, CDs, stocks, bonds, life insurance cash values, IRA/Keogh funds must be reported. Verification may be required by program staff to demonstrate financial need; amounts listed per person[3][7]. Exemptions not specified.
- Care recipient has special needs (medical, mental, behavioral, or disability requiring full-time ongoing supervision/care, e.g., developmental disability, brain injury, mental illness, hearing/visual impairment, orthopedic, other health impairment)[1][2][3][7]
- Lives with unpaid primary family caregiver in non-institutional setting[2][4]
- Not receiving respite services or eligible for respite from another government program[1][2][7]
- U.S. citizen or qualified alien under federal Immigration and Nationality Act[3]
- Documentation to support special needs (e.g., medical reports, IEP, letter from therapist/healthcare provider)[3][7]

**Benefits:** Up to $125 per month for planned respite services per client (in-home, community, or facility settings). Additional $2,000 per eligibility period for qualified Exceptional Circumstances (e.g., crisis respite), requiring separate funding application and approval[2][6].
- Varies by: exceptional_circumstances

**How to apply:**
- Phone: Call 1-866-RESPITE (1-866-737-7483 or 1-866-737-7423) for local Respite Network Coordinator assistance or eligibility info[3][6][7]
- Email: dhhs.respite@nebraska.gov[3]
- Mail: Nebraska Department of Health and Human Services, CFS, Economic Assistance - Lifespan Respite Subsidy, PO Box 95026, Lincoln, NE 68509[3]
- Online application download available (no fully online submission specified)[6]

**Timeline:** Not specified; incomplete info may delay eligibility determination[3][7]
**Waitlist:** Priorities and waiting lists may be established based on care recipient's special needs[3]

**Watch out for:**
- Cannot receive if eligible for or receiving respite from another government program[1][2][7]
- Exceptional Circumstances funding ($2,000) requires separate application and approval[2]
- Asset/income verification may be requested, causing delays if incomplete[3][7]
- Not for institutionalized individuals[2][4]
- Must live with unpaid caregiver[2][4]

**Data shape:** Financial subsidy with asset/income test but no published dollar thresholds; exceptional crisis funding as add-on; statewide with local coordinators/providers; excludes those eligible for other govt respite

**Source:** https://dhhs.ne.gov/Pages/Respite.aspx

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level. Specific dollar amounts are not provided in available sources, but families should contact their local workforce center for current thresholds based on household size.
- Assets: Not specified in available sources
- Must be unemployed[3]
- Must reside in a National Able service area with available funding[2]
- Must be willing to provide community service and attend required meetings and training[2]
- Must be willing to develop a personalized Individual Employment Plan (IEP)[2]
- Must be willing to use all available resources that assist in job searches and economic self-sufficiency[2]

**Benefits:** Participants work an average of 20 hours per week and are paid the highest of federal, state, or local minimum wage[3]. Services include on-the-job training at host agencies, career coaching, skills training (resume writing, interviewing skills, basic computer skills, employment workshops), and access to employment assistance through American Job Centers[2][3]
- Varies by: fixed

**How to apply:**
- In-person at any Nebraska Department of Labor reemployment services site[1]
- Contact workforce experts at local American Job Centers[1]
- Online locator available through AARP Foundation at my.aarpfoundation.org/locator/scsep/ to find local programs[9]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Funding availability varies by service area — just meeting eligibility requirements doesn't guarantee enrollment if funding isn't available in your area[2]
- This is a training program designed as a bridge to unsubsidized employment, not permanent employment[3]
- Income limits are tied to 125% of federal poverty level, which changes annually — families must verify current thresholds[3]
- Participants must be willing to work in community service assignments at nonprofits or government agencies; job placement is not guaranteed in a specific field[1]
- The program is nationwide but administered through different grantees (state agencies and 19 national nonprofits), so specific services and availability may differ by provider[3]

**Data shape:** This program's key limitation is that specific dollar amounts for income thresholds, processing timelines, and detailed regional provider information are not available in public sources. Families must contact their local workforce center for current, specific information. The program is characterized by its dual focus on community service (providing no-cost labor to nonprofits/government agencies) and participant employment outcomes, which distinguishes it from other senior employment programs.

**Source:** https://dol.nebraska.gov/ReemploymentServices/Training/SCSEPProgram and https://www.dol.gov/agencies/eta/seniors

---

### Legal Services for Seniors (via AAAs/OAA)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits specified; free services available to all age 60+ and spouses, with preference given to low-income and frail seniors[1][2][3][5]
- Assets: No asset limits or details on countable/exempt assets mentioned in sources
- Nebraska resident
- Services provided through Area Agencies on Aging (AAAs) partnership with Legal Aid of Nebraska
- Spouses of age 60+ individuals may qualify[5]

**Benefits:** Free legal assistance, advice, and brief services including: Income security, Health care (Medicare/Medicaid), Long-term care, Abuse/neglect, Individual rights, Prevent guardianship, Bankruptcy/collections, Foreclosures, Fraud, Consumer protection, Homestead exemptions, Simple wills, Advanced directives, Power of attorney, Tenant issues, Grandparents rights, and other legal concerns. Delivered via phone consultations with attorneys/paralegals, informational articles, and occasional law clinics (e.g., one POA/health care POA clinic per year in some regions)[1][2][3][4][5]
- Varies by: priority_tier

**How to apply:**
- Phone: ElderAccessLine at 1-800-527-7249 (statewide) or 402-827-5656 (Omaha); Hours: M-Th 9am-noon & 1-3pm, Fri 9am-noon (Central Time in some regions)[1][2][3][4]
- Contact local Area Agency on Aging (AAA)[2][3]
- Visit Legal Aid of Nebraska website: http://www.legalaidofnebraska.org/[2]

**Timeline:** Not specified; phone consultations answered by attorney/paralegal during call or with callback[1][3][4]

**Watch out for:**
- Services are free but prioritize low-income/frail seniors, so higher-income may receive lower priority[5]
- Not full legal representation; focuses on advice, brief services, info, and clinics[1][3][4]
- Agency staff cannot provide legal/financial advice—must use ElderAccessLine or Legal Aid[4]
- Limited hours for phone line; occasional regional law clinics only[1][3]

**Data shape:** Statewide via regional AAAs with no strict income/asset tests but priority tiers; phone-based intake with attorney callback; covers 93 counties through OAA-funded partnerships

**Source:** https://dhhs.ne.gov/pages/aging-legal-services.aspx

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- No eligibility restrictions — anyone can contact the program
- Services available to residents of long-term care facilities (nursing homes, assisted living, board and care homes, hospice centers, adult day care, long-term rehabilitation centers)
- Also available to family members, friends, facility staff, and any individual or citizen group interested in resident welfare
- Available to individuals and families considering long-term care placement

**Benefits:** FREE confidential services including: (1) Education on aging, long-term care, and residents' rights; (2) Information & Referral to empower individuals to resolve concerns independently; (3) Consultation with recommendations for protecting resident rights and improving care; (4) Individual Advocacy to facilitate resolution of complaints and protect rights; (5) Systems Advocacy to identify problematic trends and advocate for systemic changes

**How to apply:**
- Phone: (800) 942-7830
- Website: https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx
- Mail: PO Box 95026, Lincoln, NE 68509-5026
- Fax: (402) 802-5541

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- This is NOT a financial assistance program — it provides advocacy and complaint resolution services, not direct payments or subsidies
- This is NOT a healthcare provider — ombudsmen do not deliver medical care; they advocate for residents' rights and resolve complaints about care
- Confidentiality is conditional — unless you explicitly give permission, the ombudsman keeps your concerns confidential, but you must actively grant permission for information sharing
- Program is mandated by federal law (Older Americans Act) but operates at state level — services may vary slightly by region within Nebraska
- Ombudsmen cannot investigate complaints involving providers they were previously employed by or associated with, which may affect case assignment
- The program addresses concerns about 'action, inaction, or decisions' — meaning both what facilities do and what they fail to do
- Services are free and available to anyone with a concern, not just residents — families can advocate on behalf of residents

**Data shape:** This program has no eligibility barriers, income/asset tests, or application process in the traditional sense. It is a universal advocacy service funded by federal mandate. The key distinction is that it serves residents of specific facility types (nursing homes, assisted living, etc.) and anyone advocating on their behalf. Unlike benefit programs, there is no 'approval' or 'denial' — contact initiates services. The program's structure includes statewide coordination with regional and local ombudsmen, suggesting geographic distribution, but specific regional service variations are not documented in available sources. Processing times, waitlists, and required documentation are not specified, indicating either no formal barriers or that this information is not publicly available.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx

---

### Nebraska Community Aging Services Act

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict statewide income limits specified; eligibility for congregate activities determined by local Area Agency on Aging (AAA) based on community needs and resources. For individual services, based on assessment of circumstances and service plan development. Some related programs like SSAD use client income assessment, but not fixed amounts under this Act[3][5].
- Assets: No asset limits mentioned in the Act; financial eligibility not rigidly defined, unlike Medicaid programs[3][9].
- Nebraska resident
- Need for services to promote, restore, or support self-sufficiency and independence
- For individual services: assessment of individual's or family's circumstances and development of a service plan
- For congregate activities: determination by AAA considering local needs and advisory council recommendations[3]

**Benefits:** Community aging services including: congregate activities (group-based via senior centers to serve older individuals); individual services to promote/restore/support self-sufficiency (e.g., home-delivered meals, transportation, care management); long-term care management via Care Management Units; nutrition services; senior volunteer program; long-term care ombudsman. No fixed dollar amounts or hours specified; minimum service levels set by Department[3][7][8][9].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) - no central phone/website listed; statewide coordination via Nebraska DHHS Division of Medicaid and Long-Term Care, State Unit on Aging
- In-person at senior centers or AAA offices
- Area plan submission by AAA to DHHS for service delivery[3][7]

**Timeline:** Not specified; Care Management Units must be operational within 60 days of rule adoption for planning[7].

**Watch out for:**
- Not a direct financial aid or Medicaid program - focuses on community services via local AAAs, not guaranteed funding or slots
- No fixed income/asset tests like Medicaid ($1,330/month income, $4,000 assets for nursing home); eligibility is needs-based and local[1][3][9]
- Must go through local AAA, not central state application; services prioritize self-sufficiency, not comprehensive long-term care
- Confused with Medicaid or SCSEP (which has 125% FPL limit)[1][2]
- Minimum standards tied to federal Older Americans Act[3]

**Data shape:** Administered via local Area Agencies on Aging (AAAs) with flexible, assessment-based eligibility rather than strict financial cutoffs; services scaled to local needs, no central waitlist or fixed benefits; statewide framework with regional delivery variations

**Source:** https://nebraskalegislature.gov/laws/display_html.php?begin_section=81-2201&end_section=81-2228

---

### Aging and Disability Resource Center Act

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits specified for ADRC services; eligibility is open to persons aged 60+, persons with disabilities of any age, family members, caregivers, advocates, and providers. Note: Related programs like the Aged and Disabled Waiver have financial criteria (e.g., home equity limit of $752,000 in 2026), but ADRC itself does not impose these.[1][2][5][6]
- Assets: No asset limits for ADRC; what counts/exempts not applicable. (Aged and Disabled Waiver exempts primary home if equity ≤ $752,000, spouse/minor/permanently disabled child living there.[1])
- Nebraska resident.
- For target populations: aged 60+ or disabled (any age).
- Family, caregivers, advocates, providers also eligible.
- Functional need (e.g., Nursing Facility Level of Care via interRAI-HC for waiver-related assessments, but not required for core ADRC info/referral).[1][5]

**Benefits:** Comprehensive information on long-term care programs/options/financing/providers; options counseling; assistance accessing/applying for public benefits; point of entry to publicly supported long-term care; identification of unmet needs; person-centered transition support; mobility management; home care provider registry. Also: benefits screenings (Medicare/Medicaid/SSI), care coordination referrals (in-home services, housekeeping, personal care, respite, equipment, adult protective services, mental health, legal issues).[2][4][5][7]

**How to apply:**
- Phone: Dial 211 (statewide ADRC helpline) or (402) 471-2307 (State Unit on Aging).[2][6]
- Regional: e.g., Northeast Nebraska ADRC via nenaaa.com or (844) 843-6364/(308) 535-8195 for Western.[5][7]
- In-person: Local ADRC offices (collaborative with aging/disability orgs).
- Online: dhhs.ne.gov/Pages/Aging-and-Disability-Resource-Center.aspx or regional sites like nenaaa.com, wcnaaa.org.[6][5][7]

**Timeline:** Immediate for information/referral; varies for benefits assistance or referrals (no specific timeline stated).

**Watch out for:**
- Not a direct service/funding program—provides info, counseling, referrals, and application help only; does not pay for services or provide direct care.[4][5]
- Often confused with Aged and Disabled Medicaid Waiver (which has strict financial/functional criteria); ADRC helps navigate to such programs.[1][2]
- No guaranteed enrollment in referred programs; staff assist but do not submit forms.[7]
- Targeted at 60+ or disabled; others may get info but not full priority.[3][6]

**Data shape:** no income/asset test; info/referral only (not direct benefits); statewide via local collaboratives and 211; gateway to means-tested programs like AD Waiver.

**Source:** https://dhhs.ne.gov/Pages/Aging-and-Disability-Resource-Center.aspx

---

### Social Services for the Aged and Disabled (SSAD)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income-based eligibility; specific dollar amounts not provided in available sources. Contact DHHS for current income thresholds by household composition.
- Assets: Not specified in available sources
- Must be aged, blind, or disabled
- Must demonstrate need for the requested service
- Must be ineligible or unable to receive assistance from other programs (SSAD serves as a safety-net program)
- Nebraska residency required (inferred from state program structure)

**Benefits:** Homemaker Services (in-home instructional-based services) and Transportation Services (non-medical and medical transportation to community resources). Specific hours per week, dollar caps, or service frequency limits not specified in available sources.
- Varies by: individual_need_assessment

**How to apply:**
- In-person at local DHHS office (locations and hours available on Nebraska Department of Health and Human Services website)
- Phone contact to DHHS (specific number not provided in available sources)

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- SSAD is explicitly a safety-net program for those ineligible for other assistance programs — if someone qualifies for Medicaid Aged and Disabled Waiver, Medicare, or other programs, they may not qualify for SSAD[7]
- Eligibility is based on BOTH income AND demonstrated need for service — having low income alone is insufficient[7]
- The program provides limited, specific services (homemaker and transportation only) — it is not comprehensive long-term care coverage[7]
- Income limits are not publicly detailed in standard resources — families must contact DHHS directly to determine eligibility
- No information available on processing timelines, which may vary by local office

**Data shape:** SSAD is a means-tested, need-based safety-net program with income eligibility but no publicly specified income thresholds or asset limits. Benefits are service-based (not cash assistance) and limited to two service categories. The program explicitly targets individuals who fall outside other assistance programs, making it a residual rather than primary support option. Specific service hours, frequency, and dollar limits are not documented in available sources and likely require direct contact with DHHS for clarification.

**Source:** https://dhhs.ne.gov/Pages/Social-Services-Aged-and-Disabled-Adults.aspx

---

### Assistance to Aged, Blind or Disabled (AABD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Aged: 65 or older. Blind or Disabled: 64 or younger.[2]+
- Income: Income must meet program requirements, with maximum payments based on Federal Benefit Rate (FBR) varying by living arrangement (e.g., 2025 FBR for single individual in own household or disabled child in parent's household: $967/month; single in household of another with one-third reduction: lower amount; shelter allowance up to $281 for single. Exact countable income limits tie to SSI denial and state standards, no full household size table specified).[7][2]
- Assets: Must meet resource limits as per program rules; specific dollar amounts not detailed in sources. Home equity limit of $752,000 applies in related waivers if intending to return home.[1][2]
- Nebraska resident.
- Determined blind (central visual acuity 20/200 or less) or disabled by Social Security Administration (SSA) or state (medically determinable impairment lasting <12 months for state SDP).[2][3][6]
- Denied SSI/Medicaid due to disability duration <12 months (for State Disability Program via AABD).[6]
- Meet functional needs if applicable (e.g., NFLOC in waivers, but core AABD ties to SSA/state determination).[1][2]
- Cooperate in obtaining third-party medical payments.
- Responsible for relative financial support.[2]

**Benefits:** Monetary cash payments (calculated from FBR minus income, e.g., up to $967/month for single in own household in 2025, plus shelter up to $281) and medical coverage. May cover essential items like guardian fees, home repairs, furniture, appliances in certain cases.[7][5][6]
- Varies by: living_arrangement

**How to apply:**
- Online: https://iserve.nebraska.gov/apply/program-select or Nebraska DHHS website.[4][5][8]
- Phone: 402-471-3121, 402-595-1258 (Omaha), 402-323-3900 (Lincoln), 800-383-4278 (toll-free).[4][5]
- Call for mail or in-person options.[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Primarily for those denied SSI because disability expected to last <12 months (State Disability Program track); not for long-term federal SSI qualifiers.[6]
- Blind/disabled applicants must be 64 or younger; aged category separate at 65+.[2]
- No full income/asset dollar tables publicly detailed—must apply to confirm exact countable amounts.[2][7]
- Payments reduced by other income/living arrangement; shelter capped at $281 single.[7]
- Distinguish from Aged/Disabled Waiver (home/community services, NFLOC required).[1]

**Data shape:** Tied to SSI denial for short-term disabilities; payment rates vary strictly by living arrangement/FBR rather than household size; statewide but separate aged/blind/disabled age tracks.

**Source:** https://dhhs.ne.gov/Pages/Aged-Blind-or-Disabled.aspx

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Aged and Disabled (AD) HCBS Waiver | benefit | state | medium |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medicare Savings Program (QMB, SLMB, QI) | benefit | federal | medium |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Nebraska SHIP (State Health Insurance As | resource | federal | simple |
| Home-Delivered Meals (via AAAs) | benefit | state | medium |
| Lifespan Respite Services | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Services for Seniors (via AAAs/OAA | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Nebraska Community Aging Services Act | benefit | state | deep |
| Aging and Disability Resource Center Act | navigator | state | simple |
| Social Services for the Aged and Disable | benefit | state | medium |
| Assistance to Aged, Blind or Disabled (A | benefit | state | deep |

**Types:** {"benefit":10,"resource":3,"employment":1,"navigator":1}
**Scopes:** {"state":8,"local":1,"federal":6}
**Complexity:** {"medium":4,"deep":7,"simple":4}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/NE/drafts.json`.

- **Aged and Disabled (AD) HCBS Waiver** (benefit) — 4 content sections, 6 FAQs
- **PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 6 content sections, 6 FAQs
- **Medicare Savings Program (QMB, SLMB, QI)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **Individual need and level of care assessment; not fixed by household size or tier**: 1 programs
- **region**: 3 programs
- **program_tier**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **priority_tier**: 2 programs
- **not_applicable**: 3 programs
- **exceptional_circumstances**: 1 programs
- **fixed**: 1 programs
- **individual_need_assessment**: 1 programs
- **living_arrangement**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Aged and Disabled (AD) HCBS Waiver**: This program's eligibility is driven by functional need (NFLOC) rather than income/asset thresholds alone. While income and asset limits exist, they are secondary to the requirement that applicants demonstrate significant ADL limitations. Benefits are individualized service plans, not fixed dollar amounts or hours. The waiver is statewide with no identified regional variations in eligibility or services. Processing involves a mandatory 14-day assessment window but no waitlist information is publicly available. The program serves both elderly (65+) and younger disabled individuals, making it broader than age-restricted programs.
- **PACE (Program of All-Inclusive Care for the Elderly)**: Only one provider in Eastern Nebraska counties; no income/asset test for core eligibility but needed for free coverage via Medicaid; requires NF LOC and community safety determination.
- **Medicare Savings Program (QMB, SLMB, QI)**: This program consists of three distinct tiers (QMB, SLMB, QI) with different income thresholds and benefits. Income limits are tied to the federal poverty level and adjust annually in April. Benefits scale by program tier: QMB provides the most comprehensive coverage (premiums, deductibles, coinsurance, copayments), while SLMB and QI cover only Part B premiums. Asset limits apply but vary by program. The program is administered statewide through ACCESSNebraska (the state Medicaid agency) with no apparent regional variations. Processing times differ by program tier, with QMB having a 45-day maximum and SLMB/QI offering retroactive coverage.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income table fixed at 150% FPL with annual updates; benefits computed via formula (20% earned income disregard post-eligibility) varying by income/assets/size/fuel/housing/priority; statewide but local DHHS offices handle applications with potential regional processing variations; separate crisis/weatherization components.
- **Weatherization Assistance Program**: Delivered via 8 regional non-profit providers with unique contacts; income at 200% FPL or auto-eligible via benefits programs; no age requirement but priority implied for elderly/vulnerable; customized services post-audit, not fixed amounts.
- **Nebraska SHIP (State Health Insurance Assistance Program)**: no income/asset test; counseling-only service via volunteer network; focuses on Medicare navigation and fraud prevention (SMP); delivered statewide through local AAA partners
- **Home-Delivered Meals (via AAAs)**: Administered by 6 regional AAAs with local variations in assessment, providers, and weekend availability; no statewide income/asset tests, priority-based access under OAA; eligibility heavily functional (homebound) vs. financial[1][2][4].
- **Lifespan Respite Services**: Financial subsidy with asset/income test but no published dollar thresholds; exceptional crisis funding as add-on; statewide with local coordinators/providers; excludes those eligible for other govt respite
- **Senior Community Service Employment Program (SCSEP)**: This program's key limitation is that specific dollar amounts for income thresholds, processing timelines, and detailed regional provider information are not available in public sources. Families must contact their local workforce center for current, specific information. The program is characterized by its dual focus on community service (providing no-cost labor to nonprofits/government agencies) and participant employment outcomes, which distinguishes it from other senior employment programs.
- **Legal Services for Seniors (via AAAs/OAA)**: Statewide via regional AAAs with no strict income/asset tests but priority tiers; phone-based intake with attorney callback; covers 93 counties through OAA-funded partnerships
- **Long-Term Care Ombudsman Program**: This program has no eligibility barriers, income/asset tests, or application process in the traditional sense. It is a universal advocacy service funded by federal mandate. The key distinction is that it serves residents of specific facility types (nursing homes, assisted living, etc.) and anyone advocating on their behalf. Unlike benefit programs, there is no 'approval' or 'denial' — contact initiates services. The program's structure includes statewide coordination with regional and local ombudsmen, suggesting geographic distribution, but specific regional service variations are not documented in available sources. Processing times, waitlists, and required documentation are not specified, indicating either no formal barriers or that this information is not publicly available.
- **Nebraska Community Aging Services Act**: Administered via local Area Agencies on Aging (AAAs) with flexible, assessment-based eligibility rather than strict financial cutoffs; services scaled to local needs, no central waitlist or fixed benefits; statewide framework with regional delivery variations
- **Aging and Disability Resource Center Act**: no income/asset test; info/referral only (not direct benefits); statewide via local collaboratives and 211; gateway to means-tested programs like AD Waiver.
- **Social Services for the Aged and Disabled (SSAD)**: SSAD is a means-tested, need-based safety-net program with income eligibility but no publicly specified income thresholds or asset limits. Benefits are service-based (not cash assistance) and limited to two service categories. The program explicitly targets individuals who fall outside other assistance programs, making it a residual rather than primary support option. Specific service hours, frequency, and dollar limits are not documented in available sources and likely require direct contact with DHHS for clarification.
- **Assistance to Aged, Blind or Disabled (AABD)**: Tied to SSI denial for short-term disabilities; payment rates vary strictly by living arrangement/FBR rather than household size; statewide but separate aged/blind/disabled age tracks.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Nebraska?
