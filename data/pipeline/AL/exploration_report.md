# Alabama Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 16 |
| New (not in our data) | 14 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 7 programs
- **financial**: 4 programs
- **service|advocacy**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Alabama Medicaid Elderly and Disabled Waiver

- **income_limit**: Ours says `$2901` → Source says `$2,829` ([source](https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_waivers.aspx))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Person-centered services based on assessed needs: personal care, homemaker, respite care, adult day health, companion services, home-delivered frozen meals, case management. No fixed dollar amounts or hours; varies by individual plan of care developed by case manager[1][2][5][6].` ([source](https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_waivers.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_waivers.aspx`

### Elderly and Disabled (E&D) Medicaid Waiver

- **income_limit**: Ours says `$2901` → Source says `$2,829` ([source](https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_Waivers/6.1.2_Elderly_Disabled_Waiver.aspx))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Person-centered plan of care may include: personal care, homemaker services, companion services, respite care, adult day health, nutrition/frozen meals. No yearly cost cap or limit on services. Case management develops plan based on needs.[2][3][4]` ([source](https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_Waivers/6.1.2_Elderly_Disabled_Waiver.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_Waivers/6.1.2_Elderly_Disabled_Waiver.aspx`

## New Programs (Not in Our Data)

- **Alabama PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](medicaid.alabama.gov/content/5.0_Managed_Care/5.2_Other_MC_Programs/5.2.3_PACE.aspx))
  - Shape notes: Alabama PACE is severely geographically restricted (only 2 counties), has a fixed enrollment cap per program, requires state certification of nursing home-level care need, and has no income/asset limits for program enrollment (though Medicaid coverage has separate financial requirements). The program is not statewide and availability is the primary limiting factor for most Alabama families. Medicaid eligibility is separate from PACE eligibility but determines coverage type and cost structure.
- **Alabama Medicaid Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://medicaid.alabama.gov/content/3.0_Apply/3.2_Qualifying/3.2.6_Help_Paying_Medicare.aspx))
  - Shape notes: Tiered by QMB (full cost-sharing), SLMB (Part B only, higher income), QI-1 (Part B only, highest income, limited funds); income as %FPL with couple ranges; statewide but QI waitlist risk; no household >2 tables
- **Alabama Elderly Simplified Application Project (AESAP)** — financial ([source](https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/))
  - Shape notes: Streamlined SNAP demo for elderly-only households: 2-page app, 36-month certification, no interview (unless requested), self-declare most info, same income/asset tests as regular SNAP.
- **Alabama LIHEAP (Low-Income Home Energy Assistance Program)** — financial ([source](https://adeca.alabama.gov/liheap/[7]))
  - Shape notes: Administered via ~20 local CAAs with agency-specific income tables, opening dates, methods; income at 150% FPL but figures drift by fiscal year; priority tiers heavily influence access; funding exhausts quickly by region
- **Alabama Weatherization Assistance Program** — service ([source](https://adeca.alabama.gov/weatherization/))
  - Shape notes: Delivered via 10+ regional community action agencies with county-specific contacts, quotas, and waitlists; priority tiers heavily influence access; no central application portal.
- **Alabama SHIP (State Health Insurance Assistance Program)** — service|advocacy ([source](alabamaageline.gov/ship/[5]))
  - Shape notes: SHIP is a counseling and advocacy service rather than a direct financial assistance program. No income limits, asset limits, or specific eligibility criteria are publicly documented in available sources — eligibility appears to be based on Medicare beneficiary status. Benefits are uniform statewide (free counseling) but delivered through local regional providers (AAAs and ADRCs). The program helps beneficiaries identify and access other assistance programs (Medicare Savings Programs, prescription drug assistance, Medicaid) but does not directly provide financial aid itself. Critical distinction: This is different from the Small Rural Hospital Improvement Grant Program (also called SHIP) administered by Alabama Department of Public Health[1], which is a separate program for hospitals, not individuals.
- **Elderly Nutrition Program (Meals on Wheels)** — service ([source](https://alabamaageline.gov/elderly-nutrition-program/))
  - Shape notes: No income/asset test; eligibility focused on age/homebound status and local delivery zones; decentralized via county AAAs with statewide oversight; congregate vs. home-delivered tiers; volunteer-dependent with regional provider variations.
- **Alabama Lifespan Respite Program** — financial ([source](https://alabamarespite.org/apply-for-respite/2025-2026-respite-application-packet/))
  - Shape notes: This program's eligibility is notably broad—it serves care recipients 'of any age' with 'any' chronic illness or disability, not restricted to specific diagnoses. However, a separate Department of Mental Health respite reimbursement program exists specifically for care recipients with intellectual disabilities (IQ below 70) requiring 80 hours of care per week[1]. The Alabama Lifespan Respite program appears to be the broader, federally-funded option. Funding is explicitly limited and not guaranteed, making this a competitive program rather than an entitlement. No income or asset limits are specified in available documentation, which is unusual for a needs-based program and suggests either universal eligibility or discretionary allocation.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://alabamaageline.gov/scsep/))
  - Shape notes: County-restricted by 8+ regional providers across all 67 counties; wages/hours vary slightly by provider; no asset test; must confirm current 125% FPL table separately as not listed
- **Alabama Legal Services for Seniors** — service|advocacy ([source](https://alabamaageline.gov/legal-assistance/ and https://legalservicesalabama.org/elder-law/))
  - Shape notes: This program's structure is complex because it combines statewide Legal Services Alabama with regional Area Agencies on Aging that contract with LSA. Eligibility is income-based with a federal poverty guideline threshold (125% FPG) but also includes special non-income-based grants for seniors 60+. The program does not publish specific dollar amounts for income or asset limits, requiring families to contact directly. Benefits are service-based rather than financial, varying by legal issue type. Geographic coverage is statewide across 67 counties with 8 regional offices, but application and contact methods vary by region (some route through AAA/ADRC, others directly to LSA). Processing timelines and waitlist status are not publicly disclosed.
- **Alabama Long-Term Care Ombudsman Program** — advocacy ([source](https://alabamaageline.gov/ombudsman/))
  - Shape notes: no income/asset/age test; advocacy-only for long-term care facility residents statewide via ADSS and 13 area agencies on aging; open to anyone filing on behalf of resident
- **Alabama Cares Program** — service ([source](https://alabamaageline.gov/alabama-cares/[5]))
  - Shape notes: Caregiver-focused with priority tiers emphasizing economic/social need, rural areas, and specific vulnerabilities; administered regionally by Area Agencies on Aging with no fixed income/asset tests
- **Senior Aides Program** — service ([source](https://medicaid.alabama.gov (for E&D/Personal Choices); https://alabamaageline.gov (CARES)))
  - Shape notes: No direct match; data fragmented across Medicaid E&D Waivers (financial/medical tests), CARES (caregiver support, no income test), Personal Choices (self-direction add-on). Regional AAA delivery; waitlists common for waivers.
- **SenioRx Prescription Drug Assistance Program** — in_kind ([source](https://alabamaageline.gov/seniorx/[3]))
  - Shape notes: County-administered via 10+ Area Agencies on Aging; eligibility tiers (55+/chronic OR disabled any age OR Medicare gap); benefits dictated by pharma programs (3-month supplies); no fixed dollar cap, varies by drug/company

## Program Details

### Alabama Medicaid Elderly and Disabled Waiver


**Eligibility:**
- Income: Income cannot exceed 300% of the SSI Federal Benefit Rate (FBR), which is $2,829 per month for an individual in 2026 (exact amount may adjust annually with SSI FBR; applies regardless of household size as it's SSI-related). Must also qualify financially for full Medicaid[3][5].
- Assets: Resources cannot exceed $2,000 for an individual. Countable assets include most savings, investments, and secondary properties. Exempt: primary home (if applicant lives there, intends to return, or certain family live there; home equity limit $1,130,000 in 2026), one vehicle, household furnishings, personal effects, appliances. 60-month look-back rule applies; transfers below fair market value trigger penalty period[2][5].
- Alabama resident
- At risk of nursing facility placement (must meet nursing facility level of care, determined by physician)
- Financially eligible for Medicaid
- Willing to receive services in home/community

**Benefits:** Person-centered services based on assessed needs: personal care, homemaker, respite care, adult day health, companion services, home-delivered frozen meals, case management. No fixed dollar amounts or hours; varies by individual plan of care developed by case manager[1][2][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) or Aging and Disability Resource Center (ADRC); e.g., East Alabama Aging (regional example)
- Alabama Medicaid Agency website: https://medicaid.alabama.gov/
- Alabama Department of Senior Services: https://alabamaageline.gov/medicaid-waiver-programs/
- Phone: Varies by region; contact local AAA/ADRC or Medicaid at 1-800-362-1504 (general Medicaid line; confirm for E&D)
- In-person/mail via regional providers like Regional Planning Commission of Greater Birmingham or AAAs

**Timeline:** Not specified; enrollment limited with potential waiting period[7].
**Waitlist:** Yes, program capped at 15,000 slots annually; waitlist common when full[2][7].

**Watch out for:**
- Must already qualify for full Medicaid financially; waiver does not waive Medicaid income/asset rules[3][5].
- 60-month look-back on asset transfers leads to penalty periods[2].
- No age minimum, but targeted at elderly/disabled at nursing home risk—often confused with age 65+ programs[5].
- Enrollment capped at 15,000; long waitlists common[2].
- Home subject to estate recovery despite asset exemption[2].
- Services not guaranteed hours/dollars; fully needs-based with no fixed entitlements[1].

**Data shape:** Administered regionally via AAAs with statewide cap; SSI-related income test (300% FBR); no age minimum; benefits person-centered without fixed units; persistent waitlists due to slot limits.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_waivers.aspx

---

### Alabama PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No statewide income limits for PACE enrollment itself[4]. However, Medicaid eligibility (which covers most participants) typically requires income under 300% of the Federal Benefit Rate (~$2,901/month for 2025), though Medicaid offers multiple pathways to eligibility and planning can help[2]. Non-Medicaid participants pay a flat monthly premium[5].
- Assets: No asset limits specified for PACE enrollment. Medicaid eligibility (if pursuing Medicaid coverage) typically requires assets of $2,000 or less, excluding the primary home[2].
- Must be certified by the state as needing nursing home-level care (requiring extensive assistance with Activities of Daily Living: bathing, grooming, toileting, walking, transferring, eating)[1][2]
- Must reside in the PACE organization's service area[1][3]
- Must be able to live safely in the community at time of enrollment with PACE support[1][4]
- Must meet any additional program-specific eligibility conditions in the respective PACE program agreement[1]
- U.S. citizenship or legal residency requirement applies only if enrolling through Medicare[2]

**Benefits:** Comprehensive community-based care and services including medically necessary services[8]. PACE coordinates healthcare and long-term care coverage for individuals who would otherwise need nursing home care[4]. Once enrolled, participants never pay deductibles or co-pays for any care, medication, or service provided by the PACE interdisciplinary team[4].
- Varies by: Medicaid vs. non-Medicaid status (Medicaid participants receive fully covered services; non-Medicaid participants pay a flat monthly premium)[5]

**How to apply:**
- Contact Mercy LIFE of Alabama directly (specific phone number not provided in search results; website: trinityhealthpace.org/alabama/mercy-life-of-alabama)[5]
- Alabama Medicaid Agency (medicaid.alabama.gov)[8]
- In-person at PACE organization service locations

**Timeline:** Not specified in available sources
**Waitlist:** Program enrollment is capped at up to 185 enrollees per program[3], but specific waitlist information not provided

**Watch out for:**
- Geographic limitation is critical: PACE is only available in Mobile and Baldwin counties in Alabama[3]. Families outside these areas cannot access this program regardless of eligibility[6].
- Enrollment cap: Each PACE program serves up to 185 enrollees maximum[3], which may create waitlists or limit availability.
- Nursing home level of care certification is required and determined by the state, not self-assessed[1][2]. Families must go through state assessment process.
- Medicaid is not required but covers most participants[4]. Non-Medicaid participants must pay a flat monthly premium, making costs variable[5].
- Participants can leave the program at any time[3], but re-enrollment may be subject to availability.
- Annual recertification is required to maintain eligibility[1].
- The program is community-based; participants must be able to live safely in the community with support—those requiring 24-hour institutional care may not qualify[1][4].

**Data shape:** Alabama PACE is severely geographically restricted (only 2 counties), has a fixed enrollment cap per program, requires state certification of nursing home-level care need, and has no income/asset limits for program enrollment (though Medicaid coverage has separate financial requirements). The program is not statewide and availability is the primary limiting factor for most Alabama families. Medicaid eligibility is separate from PACE eligibility but determines coverage type and cost structure.

**Source:** medicaid.alabama.gov/content/5.0_Managed_Care/5.2_Other_MC_Programs/5.2.3_PACE.aspx

---

### Alabama Medicaid Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Alabama follows federal Medicare Savings Program guidelines with income limits at approximately 100% FPL for QMB ($1,275 single/$1,724 couple monthly), 120% FPL for SLMB ($1,506 single/$2,044 couple), and 135% FPL for QI-1 ($1,695 single/$2,300 couple), including a $20 general income disregard; exact limits adjust annually and couples have ranges like $1,824.01–$2,184 for certain tiers per state docs[1][2][5]. No full household size table beyond single/couple in sources; must have Medicare Part A (free for most age 65+).
- Assets: Resources limited to $9,430 individual/$14,130 couple (2024 figures; adjusts yearly); countable assets include bank accounts, stocks; exempt: home, one car, burial plots, life insurance up to $1,500 face value, personal belongings[4][7].
- Must be enrolled in Medicare (typically age 65+ or disabled)
- U.S. citizen or satisfactory immigration status
- Alabama resident
- Not eligible for QI if receiving other Medicaid

**Benefits:** **QMB:** Pays Medicare Part B premium ($206.50/month in recent doc), hospital deductible ($1,716), medical deductible ($288), 20% coinsurance; Part A premium if applicable. **SLMB/QI-1:** Part B premium only ($206.50/month). QMB provides Medicaid card; SLMB/QI do not. QMB auto-qualifies for Extra Help[1][2][8].
- Varies by: priority_tier

**How to apply:**
- Online: https://medicaid.alabama.gov/content/3.0_Apply/3.2_Qualifying/3.2.6_Help_Paying_Medicare.aspx
- Phone: Local Medicaid district offices (find via medicaid.alabama.gov contact page) or 1-800-362-1504
- Mail/In-person: Local Medicaid area offices; Form 210 'Medicare Savings Program Application'
- Download form: https://medicaid.alabama.gov/documents/3.0_Apply/3.2_Qualifying_Medicaid/3.2.6_Help_Paying_Medicare_Premiums/3.2.6_Form_210_Medicare_Savings_Program_3-23-26.pdf[2]

**Timeline:** QMB: Month after approval; SLMB/QI-1: Up to 3 months retroactive to application month if eligible[1][3][8].
**Waitlist:** QI-1 has limited funds; applications denied when exhausted[1][8].

**Watch out for:**
- QI-1 funding limited—first-come, first-served; denied if funds exhausted
- No Medicaid card for SLMB/QI-1; providers not barred from balance billing (though rare)
- Must use Medicaid-accepting providers for QMB protections
- Income/resources counted strictly; couples have higher but ranged limits
- Retroactive coverage for SLMB/QI only if requirements met in prior months
- Automatically get Extra Help with QMB but not always others
- Limits change yearly; verify current via official site (e.g., Part B premium updated to $206.50)[1][2][8]

**Data shape:** Tiered by QMB (full cost-sharing), SLMB (Part B only, higher income), QI-1 (Part B only, highest income, limited funds); income as %FPL with couple ranges; statewide but QI waitlist risk; no household >2 tables

**Source:** https://medicaid.alabama.gov/content/3.0_Apply/3.2_Qualifying/3.2.6_Help_Paying_Medicare.aspx

---

### Alabama Elderly Simplified Application Project (AESAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Same as standard Alabama Food Assistance Program (SNAP). Gross monthly income limits (effective Oct 1, 2022 - Sep 30, 2023): 1 person: $1,580/$1,215; 2: $2,137/$1,644; 3: $2,694/$2,072; 4: $3,250/$2,500; 5: $3,807/$2,928; 6: $4,363/$3,355; 7: $4,920/$3,783; 8: $5,476/$4,210. Each additional person: $557/$428. Net income limits follow similar scaling. Updated limits apply annually; check current via DHR.[6][1]
- Assets: Same as standard Food Assistance Program (SNAP) resource limits apply. Specific countable resources and exemptions (e.g., home, one vehicle, retirement accounts) follow federal SNAP rules; no unique AESAP exemptions listed.[1][2]
- All household members age 60+ on application date.
- No earned income (wages, self-employment) in month of application.
- U.S. citizen or qualified non-citizen (verification required if questionable).
- Meets standard SNAP residency, cooperation, and work requirements (waived for elderly).

**Benefits:** Monthly Food Assistance (SNAP) benefits via EBT debit card, calculated same as standard program (max allotment varies by household size/income, e.g., up to ~$291 single/$535 couple base, adjusted for deductions like medical expenses). No fixed dollar amount; benefits added to regular allotment.[1][5]
- Varies by: household_size

**How to apply:**
- Online: https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/ or standard Food Assistance portal
- Phone: 1-800-438-2958 (customer service), 1-833-822-2202 (automated hotline), 334-242-1700 ext 3 (AESAP hotline)
- Mail/Fax/Email: Use AESAP form, send to local county DHR Food Assistance office
- In-person: Local county DHR offices (no required face-to-face interview)

**Timeline:** Up to 30 days from application date.[6]

**Watch out for:**
- Age discrepancy in sources (some say 65, official is 60); use 60+.[1][2][8]
- No earned income means zero wages/self-employment; unearned (SSI, pensions) allowed.
- Benefits calculated as standard SNAP, so income/assets must still qualify—simplified process doesn't waive means test.
- 3-year certification requires annual Interim Contact Form submission.
- Fraud penalties severe (fines, imprisonment); self-declaration trusted unless questionable.
- Household must all be 60+ (or purchase/prepare separately); no children allowed.

**Data shape:** Streamlined SNAP demo for elderly-only households: 2-page app, 36-month certification, no interview (unless requested), self-declare most info, same income/asset tests as regular SNAP.

**Source:** https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/

---

### Alabama LIHEAP (Low-Income Home Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income must not exceed 150% of the federal poverty level. FY2026 limits (effective October 1, 2025) from ADECA: 1 person $4,019; 2 $5,429 (inferred +$1,410); 3 $6,838 (+$1,409); 4 $4,019 listed but likely $8,248 (+$1,410); 5 $4,706; 9 $7,456; 10 $8,144; 13 $10,206; 14 $10,894; 15 $11,581. Add ~$567-$1,410 per additional member. Regional examples: Northeast AL (1: $1,883; 2: $2,555; 3: $3,228; 4: $3,900; 5: $4,573; 6: $5,245; 7: $5,918; 8: $6,590); older FY2022 (1: $1,610; 2: $2,178; 3: $2,745; 4: $3,313; 5: $3,880; 6: $4,448; 7: $5,015; 8: $5,583; +$567 each). Proof required for prior month; zero income needs declaration form[1][3][4][6].
- Assets: No asset limits mentioned in sources[1][3][6][7].
- Reside in Alabama and be U.S. citizen or qualified non-resident (check local agency for non-qualified)[3][6][7].
- Provide proof of income for all household members (prior month); SSNs and photo ID for applicant[1][3][4].
- Priority for seniors (60+), disabled, children under 6/17, high energy burden, crises (disconnection/out-of-fuel), medical vulnerabilities[1][2][7].

**Benefits:** Direct payments to utility vendors for heating/cooling costs. Max: Heating $580, Cooling $520, Winter Crisis $1,100, Summer Crisis $990. Min: Heating $280, Cooling $320. Varies by income, size, fuel type; one regular heating + one cooling per year; crisis for emergencies. Applicant pays remaining balance[5][6].
- Varies by: household_size|priority_tier|region

**How to apply:**
- Phone scheduling, online portals (e.g., https://littliteal.azurewebsites.net for docs in West AL), or in-person appointments via local Community Action Agency (CAA)[1][2].
- Locate local CAA by county; no central state application[1][3][7][8].

**Timeline:** Award made at appointment if eligible; first-come, first-served[1][2][4].
**Waitlist:** No waitlist mentioned; funds limited, high winter demand, may close early[1][5].

**Watch out for:**
- Must apply through local CAA, not state office; no central application[1][3][7].
- Funds limited, first-come first-served; apply early (winter high demand, opens agency-by-agency)[1][5].
- Income based on prior month proof; varies slightly by agency/year[1][3][4][6].
- One heating + one cooling per year; only covers part of bill[2][6].
- Priority groups served first; elderly qualify for priority but no strict age cutoff[1][2].
- Crisis aid requires emergency verification (e.g., shutoff)[2][5].

**Data shape:** Administered via ~20 local CAAs with agency-specific income tables, opening dates, methods; income at 150% FPL but figures drift by fiscal year; priority tiers heavily influence access; funding exhausts quickly by region

**Source:** https://adeca.alabama.gov/liheap/[7]

---

### Alabama Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Annual household income at or below 200% of the federal poverty level. Exact dollar amounts vary by household size and are based on current HHS Poverty Income Guidelines (not specified in sources for 2026; check HHS.gov for latest table). Households automatically qualify if receiving Supplemental Security Income (SSI) or Aid to Families with Dependent Children (AFDC). Priority given to elderly, disabled, families with children, or high-energy users.
- Assets: No asset limits mentioned.
- Alabama resident.
- Single family site-built homes or mobile homes eligible.
- Renters eligible if landlord participates and agrees to pay a portion of costs and not raise rent for 1 year.
- Proof of ownership or rental agreement required.

**Benefits:** Free weatherization services including air sealing/infiltration reduction, attic insulation, dense-pack sidewall insulation, duct insulation, floor insulation, general energy saving measures (e.g., lightbulb replacement), heater repairs or replacement, HVAC repairs, health and safety checks. No specific dollar amounts or hours; services based on professional energy audit to reduce energy costs and improve efficiency.
- Varies by: priority_tier

**How to apply:**
- Contact local agency by county/region (see ADECA site for list; e.g., Central AL: call 1-866-780-4945 or (334)-262-4300, visit 430 South Court St., Montgomery, or download Application and Cover Letter from carpdc.com).
- Northeast AL (e.g., Blount, Jefferson counties): call (256) 999-1166 to schedule appointment.
- Northwest AL: call (256) 383-3832.
- Huntsville area: call (256) 851-9800.
- Mail completed application with documents to local agency.
- In-person at local community action agency or regional planning office.

**Timeline:** Not specified; applications placed on waiting list and ranked by priority points.
**Waitlist:** Yes, statewide waiting lists; ranked by priority (elderly, disabled, children, high energy use). Varies by funding and county quotas set by DOE/ADECA.

**Watch out for:**
- ADECA does not process applications; must contact specific county agency.
- Renters need landlord approval and contribution.
- Original Social Security cards required (no copies in some areas).
- Priority ranking determines order on waitlist; not first-come.
- Funding limited (e.g., $47M BIL funds through 2027, divided in rounds); quotas per county.
- Home must pass energy audit; not all measures guaranteed.

**Data shape:** Delivered via 10+ regional community action agencies with county-specific contacts, quotas, and waitlists; priority tiers heavily influence access; no central application portal.

**Source:** https://adeca.alabama.gov/weatherization/

---

### Alabama SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available sources. Search results do not provide specific income thresholds or household-based income tables.
- Assets: Not specified in available sources.
- Must be a Medicare beneficiary or their family member[3][5][7]
- Program serves seniors and their families, but exact age requirement not stated in sources

**Benefits:** Free, personalized, one-on-one counseling and information services. No dollar limits or hour restrictions mentioned.

**How to apply:**
- Phone: 1-800-AGE-LINE (1-800-243-5463)[2][5][7]
- Contact local Area Agency on Aging (AAA) and Aging & Disability Resource Center (ADRC)[5][7]
- In-person: Visit local ADRC and complete an assessment, which will be referred to SHIP Coordinator[7]
- Website: alabamaageline.gov/ship/[5]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- No cost for services — SHIP does not sell insurance and provides completely unbiased counseling[7]
- Counselors are not affiliated with any insurance companies[5]
- Best time to contact is during Medicare Open Enrollment (October 15 - December 7 annually)[7]
- Also contact SHIP when first becoming eligible for Medicare for detailed explanation of Part A, B, and D benefits[7]
- All counseling records are strictly confidential[5]
- You do not 'enroll' in SHIP — you contact your local ADRC and complete an assessment[7]
- This is a counseling and information service, NOT a financial assistance program for paying premiums directly (though counselors can help identify programs that do provide financial help)[5][7]

**Data shape:** SHIP is a counseling and advocacy service rather than a direct financial assistance program. No income limits, asset limits, or specific eligibility criteria are publicly documented in available sources — eligibility appears to be based on Medicare beneficiary status. Benefits are uniform statewide (free counseling) but delivered through local regional providers (AAAs and ADRCs). The program helps beneficiaries identify and access other assistance programs (Medicare Savings Programs, prescription drug assistance, Medicaid) but does not directly provide financial aid itself. Critical distinction: This is different from the Small Rural Hospital Improvement Grant Program (also called SHIP) administered by Alabama Department of Public Health[1], which is a separate program for hospitals, not individuals.

**Source:** alabamaageline.gov/ship/[5]

---

### Elderly Nutrition Program (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or requirements. Voluntary contributions accepted but not mandatory.[3][4]
- Assets: No asset limits or tests.
- Spouses of participants, regardless of age.
- Persons with a disability residing with an eligible participant.
- Persons with a disability under the age of 60 residing in a living community where the ENP is provided.
- For home-delivered meals (Meals on Wheels): Must be homebound and unable to cook or shop due to physical/medical limitations; must live within delivery area/zone of local provider.[1][3][5][6]

**Benefits:** Nutritious hot meals (minimum 1/3 of daily dietary reference intakes per meal, compliant with U.S. dietary guidelines) served at local senior centers (congregate setting with social activities) or home-delivered (including frozen meals or weekly boxes for homebound seniors). Meals include entrée, vegetable, fruit, bread, milk. No charge for meals; relies on donations/volunteers. In FY2023: 4,888,512 meals served statewide (1.6M congregate, 3.3M home-delivered/curbside).[3][4][5]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) for your county/region by phone or in-person; staff conducts assessment on age, health, mobility, meal prep ability, dietary needs.
- Alabama Aging Line: 1-800-AGE-LINE (1-800-243-5463) for referral to local AAA.
- Find local provider: https://alabamaageline.gov/elderly-nutrition-program/ or local senior centers (335 statewide, one per county).[3]
- Examples: SARCOA (Southern AL): www.sarcoa.org, Mon-Fri 8AM-4:30PM[6]; East AL Aging: 1-800-239-6741[7]; Huntsville/Madison Co.: Check coverage via senior center[5]. No specific online form or mail application detailed; initial contact leads to assessment.

**Timeline:** Not specified; involves initial assessment after contact, but varies by local provider.
**Waitlist:** Not mentioned; potential regional delivery limitations due to zones/volunteers.

**Watch out for:**
- Not all 60+ qualify for home delivery—must be homebound/unable to cook/shop and in delivery zone; mobile seniors use congregate centers.[1][3][6]
- No automatic 'Meals on Wheels'—it's the home-delivery arm of ENP; confirm local provider coverage.[2][5]
- Voluntary donations suggested (income-based in some areas, tax-deductible for non-family); program relies on community support/volunteers, may affect availability.[3][5][7]
- Spouses/disabled under 60 only if living with eligible 60+ or in ENP community.[3][4]
- Car ownership or caregiver availability may disqualify home delivery in some assessments.[1]

**Data shape:** No income/asset test; eligibility focused on age/homebound status and local delivery zones; decentralized via county AAAs with statewide oversight; congregate vs. home-delivered tiers; volunteer-dependent with regional provider variations.

**Source:** https://alabamaageline.gov/elderly-nutrition-program/

---

### Alabama Lifespan Respite Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available documentation
- Assets: Not specified in available documentation
- Care recipient must have a chronic illness or disability requiring around-the-clock care[5]
- Caregiver must be a full-time, unpaid family member[5]
- Both caregiver and care recipient must be Alabama residents[4][5]
- Caregiver cannot currently be receiving respite services through any other program[2][4]
- Only one caregiver per household is eligible to apply[2]
- Only one care recipient per household may be listed[2]
- Proof of diagnosis required (letter from doctor, social worker, case manager, IEP, or other credible documentation)[1][4]

**Benefits:** Reimbursement to caregiver for respite care services provided by caregiver-selected provider; specific dollar amounts not disclosed in available documentation[1][4]

**How to apply:**
- Email: al.respite@ucphuntsville.org[4]
- Phone: 256-859-8300[1][4]
- Online application available (specific URL not provided in search results)[5][6]
- Mail: Application packet available for download[4]

**Timeline:** Quick approval process determined by Alabama Respite staff[1]; reimbursement issued within 30 days of receiving completed/signed timesheet[5]
**Waitlist:** Program has limited funds; not all qualified applicants can be assisted based on available resources[5]

**Watch out for:**
- Program explicitly states: 'The completion of this application does not guarantee the awarding of financial assistance from Alabama Lifespan Respite' due to limited funding[5]
- Caregiver cannot be receiving respite services through ANY other program simultaneously[2][4]
- Respite provider must be at least 18 years old and cannot live in the same home as the care recipient[4][5]
- Caregiver is responsible for selecting, hiring, and training the respite provider—the program does not provide or vet providers[4][5]
- If applicant received respite reimbursement after July 1, 2025, they do not need to reapply; re-enrollment information is sent annually[5]
- No specific income or asset limits are disclosed, suggesting the program may be needs-based or discretionary in funding decisions
- Search results do not clarify whether there are different eligibility criteria for different care recipient diagnoses (e.g., intellectual disability vs. chronic illness)

**Data shape:** This program's eligibility is notably broad—it serves care recipients 'of any age' with 'any' chronic illness or disability, not restricted to specific diagnoses. However, a separate Department of Mental Health respite reimbursement program exists specifically for care recipients with intellectual disabilities (IQ below 70) requiring 80 hours of care per week[1]. The Alabama Lifespan Respite program appears to be the broader, federally-funded option. Funding is explicitly limited and not guaranteed, making this a competitive program rather than an entitlement. No income or asset limits are specified in available documentation, which is unusual for a needs-based program and suggests either universal eligibility or discretionary allocation.

**Source:** https://alabamarespite.org/apply-for-respite/2025-2026-respite-application-packet/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Income must be less than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set by federal guidelines (not specified in sources; check current HHS poverty guidelines). No resource/asset limit required[1][3][6].
- Assets: No asset or resource limits apply[1].
- Alabama resident[1][3]
- Unemployed[1][2][3][5][6]
- Reside in counties served by specific regional providers (see geography)[2][6][9]

**Benefits:** Paid part-time community service work training (average 20 hours/week or 19.75 hours/week) at the highest of federal, state, or local minimum wage (examples: $7.25/hour or $7.34/hour). Assignments at non-profits/government agencies like schools, libraries, senior centers. Goal: bridge to unsubsidized jobs[1][2][3][6][7].
- Varies by: region

**How to apply:**
- Call Alabama AGE-LINE at 1-800-243-5463[2]
- Contact regional providers by phone/email (see geography.offices_or_providers)[9]
- Visit https://alabamaageline.gov/scsep/[1]

**Timeline:** Not specified
**Waitlist:** Not specified; may vary by region due to limited slots

**Watch out for:**
- Must reside in specific counties served by each regional provider; not direct statewide application[2][9]
- Program is temporary training, not permanent job; requires active job search while enrolled[6]
- Unemployed status required at enrollment; income <125% FPL strictly enforced[1][3]
- Wage/hour details may vary by region/provider; confirm locally[6][7]
- No asset test, but proof of low income needed[1]

**Data shape:** County-restricted by 8+ regional providers across all 67 counties; wages/hours vary slightly by provider; no asset test; must confirm current 125% FPL table separately as not listed

**Source:** https://alabamaageline.gov/scsep/

---

### Alabama Legal Services for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: 125% of 2024 Federal Poverty Guidelines[10]. Specific dollar amounts not provided in search results, but Legal Services Alabama notes that income-based screening is required[1]. Special grants exist that are not income-based[1].
- Assets: Strict asset limits apply[4], but specific dollar amounts and exemptions are not detailed in available search results.
- Must be a qualifying Alabama resident[2]
- Individual who needs legal assistance must submit their own application[2]
- Submitting an application does not establish an attorney-client relationship[2]
- Not everyone who applies will receive assistance due to program limitations[2]

**Benefits:** Free legal, educational, and outreach services including: advice and counseling, legal representation, legal research, preparation of legal documents, negotiation, and community outreach[3]. Specific service areas include: accessing health and long-term care, advanced directives, consumer issues, debt collection, elder abuse/exploitation/fraud, guardianship issues, housing, income maintenance, Medicaid & Medicare, powers of attorney, Social Security, and wills[3].
- Varies by: legal_issue_type

**How to apply:**
- Phone: 1-800-AGE-LINE (1-800-243-5463)[2][3]
- Phone: 1-866-456-3959 (LSA Elder Helpline)[9]
- Phone: 1-866-785-1798 (Spanish language)[6]
- Email: info@EastAlabamaAging.org[2]
- Online: Apply through Legal Services Alabama website[1]
- In-person: Eight LSA offices located in Anniston, Birmingham, Dothan, Huntsville, Mobile, Montgomery, Selma, and Tuscaloosa[8]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Income limits exist but specific dollar amounts vary by household size — families must call to determine eligibility rather than self-screening[1][10]
- Asset limits are strict but specific thresholds are not publicly detailed in standard materials[4]
- Special income-exempt grants exist for seniors 60+ but are not widely advertised[1]
- Application does not guarantee service — program has limitations and cannot assist everyone who applies[2]
- No attorney-client relationship is established by submitting an application[2]
- Processing time and waitlist status are not publicly specified, creating uncertainty for families planning care
- Multiple phone numbers exist (1-800-AGE-LINE, 1-866-456-3959, 1-866-785-1798) which may cause confusion about which to call
- Spanish-language services available but only through specific phone line[6]
- Program is civil legal aid only — does not handle criminal matters[8]

**Data shape:** This program's structure is complex because it combines statewide Legal Services Alabama with regional Area Agencies on Aging that contract with LSA. Eligibility is income-based with a federal poverty guideline threshold (125% FPG) but also includes special non-income-based grants for seniors 60+. The program does not publish specific dollar amounts for income or asset limits, requiring families to contact directly. Benefits are service-based rather than financial, varying by legal issue type. Geographic coverage is statewide across 67 counties with 8 regional offices, but application and contact methods vary by region (some route through AAA/ADRC, others directly to LSA). Processing timelines and waitlist status are not publicly disclosed.

**Source:** https://alabamaageline.gov/legal-assistance/ and https://legalservicesalabama.org/elder-law/

---

### Alabama Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: None
- Assets: None
- Must be a resident of a long-term care facility such as nursing home, assisted living facility, specialty care facility, or boarding home (personal care home). Services also available to family, friends, or facility employees on behalf of residents.

**Benefits:** Investigate and resolve complaints about poor patient care, quality of care, facility structure issues; provide direct client advocacy; conduct quarterly/routine visitations to facilities to monitor conditions and talk to residents; mediate between residents, families, and staff; educate on residents' rights, facility selection, eligibility criteria, and other elderly services; protect rights to dignity, freedom from restraints, voice grievances, private communication, confidential records, fair treatment, advance notice of transfer/discharge; advocate for systemic changes at local/state/national levels.

**How to apply:**
- Phone: 334-242-5753 or 1-800-AGE-LINE (1-800-243-5463)
- In writing
- In person
- Email: info@EastAlabamaAging.org (for East Alabama region inquiries)

**Timeline:** Not specified

**Watch out for:**
- Not a direct service provider (e.g., no healthcare, financial aid, or personal care services)—purely advocacy and complaint resolution; no financial eligibility barriers, but must involve a long-term care facility resident; confidential but can be filed anonymously; ombudsmen are trained/certified advocates without facility conflicts; volunteers support but report to certified community ombudsmen

**Data shape:** no income/asset/age test; advocacy-only for long-term care facility residents statewide via ADSS and 13 area agencies on aging; open to anyone filing on behalf of resident

**Source:** https://alabamaageline.gov/ombudsman/

---

### Alabama Cares Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits or dollar amounts stated; priority given to caregivers in greatest social and/or economic need, particularly low-income individuals[1][3][5]
- Assets: No asset limits mentioned; no details on what counts or exemptions[1][3][5]
- Primary caregivers of frail older adults age 60+ or of any age with Alzheimer's/other dementia[1][3][5]
- Grandparents/relative caregivers age 55+ caring for children 18 and under, or any age with severe disability (must provide 20+ hours/week care; relative must have custody and child must live with them)[1][3][5]
- Older relative caregivers (not parents), including grandparents age 55+, caring for children 18 and under with/without disabilities[5]
- Older relative caregivers/parents, including grandparents age 55+, caring for adults 19-59 with disabilities[5]
- Caregiver must provide 20+ hours/week to care recipient[3]

**Benefits:** Information, assistance, counseling, respite care, supplemental services (e.g., personal care, adult day care, limited homemaker services), training, support groups, caregiver colleges, e-newsletters[4][7]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-AGE-LINE or 1-800-243-5463[3]
- Contact local Area Agency on Aging (e.g., Northwest Alabama Council of Local Governments, East Alabama Aging, Aging South Alabama)[1][3][7]
- Websites: Regional AAAs like www.nacolg.org/alabama-cares, www.EastAlabamaAging.org, agingsouthalabama.org/caregiver-programs/[1][3][7]

**Timeline:** Not specified in sources

**Watch out for:**
- Focuses on caregivers (not direct care recipients); services aim to prevent burnout via respite/support, not ongoing paid care[7]
- Must provide 20+ hours/week care for some categories; relative caregivers need custody[3]
- Priority tiers (e.g., low-income, rural, Alzheimer's, older caregivers) affect access, not guaranteed services[1][3]
- Not a Medicaid waiver or paid caregiver program; distinct from Elderly & Disabled Waiver or Personal Choices[2][4][8]

**Data shape:** Caregiver-focused with priority tiers emphasizing economic/social need, rural areas, and specific vulnerabilities; administered regionally by Area Agencies on Aging with no fixed income/asset tests

**Source:** https://alabamaageline.gov/alabama-cares/[5]

---

### Elderly and Disabled (E&D) Medicaid Waiver


**Eligibility:**
- Income: Must be financially eligible for Medicaid, typically income not exceeding 300% of the SSI Federal Benefit Rate (FBR), approximately $2,829 per month for an individual as of recent data. SSI recipients or SSI-related protected groups are automatically eligible. Limits apply to the applicant (not parents for children); exact amounts vary annually with FBR and living arrangements—no full household size table specified, but standard Medicaid rules apply for couples or households.[1][3]
- Assets: Countable resources not to exceed $2,000 for an individual. Exempt assets include primary home (if applicant lives there or intends to return, with 2026 home equity limit of $1,130,000; also exempt if non-applicant spouse, blind/disabled child of any age, or child under 21 lives there), one vehicle, household furnishings, appliances, and personal effects. 60-month Look-Back Rule applies—transferring assets below fair market value triggers penalty period.[1][3]
- Alabama resident.
- Require Nursing Facility Level of Care (NFLOC), determined by HCBS-1 assessment form—must meet at least 2 of 11 criteria (e.g., need assistance with ADLs putting at risk of nursing home placement).
- At risk of nursing home placement.
- Financially eligible for Medicaid (or meet waiver financial criteria).

**Benefits:** Person-centered plan of care may include: personal care, homemaker services, companion services, respite care, adult day health, nutrition/frozen meals. No yearly cost cap or limit on services. Case management develops plan based on needs.[2][3][4]
- Varies by: priority_tier

**How to apply:**
- Contact Alabama Department of Senior Services (ADSS) via local Area Agency on Aging (AAA)—face-to-face Independent Functional Assessment follows initial contact.
- Administered statewide by ADSS; specific phone/website via ADSS or Medicaid sites.
- Must have or apply for Medicaid first.

**Timeline:** Not specified; involves assessment and plan development after eligibility.
**Waitlist:** Yes, waiting list exists, especially for those not financially pre-qualified via Medicaid/SSI. Waiver enrollment limited.[3][7]

**Watch out for:**
- No age minimum—open to disabled under 65, including children (child's income/assets only, not parents').
- Must meet NFLOC via specific HCBS-1 (2/11 criteria); doctor input needed but formal assessment required.
- 60-month Look-Back Rule penalties for asset transfers.
- Waiting list if not Medicaid-eligible upfront.
- Respond promptly to annual Medicaid/AAA letters or lose eligibility.
- Services require person-centered plan; not automatic.

**Data shape:** No age requirement; NFLOC via unique HCBS-1 checklist (meet 2/11 criteria); no service cost cap; waitlist for non-Medicaid eligible; statewide but via regional AAAs.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_Waivers/6.1.2_Elderly_Disabled_Waiver.aspx

---

### Senior Aides Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific 'Senior Aides Program' found in Alabama search results. Closest matches are Elderly & Disabled (E&D) Waiver (income up to $2,982/month per applicant in 2026, regardless of marital status) or Alabama CARES (income not a barrier, prioritizes greatest needs).[1][3]
- Assets: For E&D Waiver: Standard Medicaid asset limits apply (exact $ amount not specified); exempt: primary home, household furnishings, appliances, personal effects, one vehicle. 60-month look-back rule for transfers.[1]
- No exact match for 'Senior Aides Program'. Possible confusion with E&D Waiver (age 65+ or disabled, nursing facility level of care via HCBS-1 assessment, meet 2/11 criteria like ADL needs), Personal Choices (self-direction under HCBS waivers), or Alabama CARES (caregivers of 60+, dementia patients, or relative caregivers 55+ for children/disabled adults).[1][3][7]

**Benefits:** No specific details for 'Senior Aides Program'. E&D Waiver: Home/community-based services to avoid nursing home. Personal Choices: Self-direct personal care, respite, etc. Alabama CARES: Information, support, training, personal care, adult day care, homemaker services (no fixed $ or hours specified).[1][3][5][7]
- Varies by: priority_tier

**How to apply:**
- For E&D/Personal Choices: Local Area Agency on Aging at 1-877-425-2243; Alabama CARES: 1-800-AGE-LINE (1-800-243-5463) or local AAA/ADRC; Medicaid general: medicaid.alabama.gov applications/forms.[3][4][7]

**Timeline:** Not specified in results
**Waitlist:** Not specified; waivers often have waitlists (inferred, not direct)

**Watch out for:**
- No program named 'Senior Aides Program' identified—may be misnomer for E&D Waiver aides, Personal Choices family payment, or state aides via AAAs. Dementia diagnosis alone insufficient for E&D. 60-month look-back penalties. Must meet NFLOC. Programs prioritize highest need.[1][3][7]

**Data shape:** No direct match; data fragmented across Medicaid E&D Waivers (financial/medical tests), CARES (caregiver support, no income test), Personal Choices (self-direction add-on). Regional AAA delivery; waitlists common for waivers.

**Source:** https://medicaid.alabama.gov (for E&D/Personal Choices); https://alabamaageline.gov (CARES)

---

### SenioRx Prescription Drug Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 200% of the federal poverty level (exact dollar amounts vary annually by household size; some pharmaceutical companies allow higher incomes). Applies to those 55+ with chronic conditions and no/inadequate coverage. No specific table provided in sources, but call local office for current FPL chart.[1][2][4][8]
- Assets: No asset limits mentioned.[1][2][3]
- Legal resident of Alabama and apply in county of residence
- At least one chronic medical condition requiring daily prescription medication (not short-term like antibiotics)
- No prescription drug coverage or inadequate coverage (includes Medicare Part D gap/donut hole, high co-pays, or formulary issues)
- OR any age with disability: Social Security deemed disabled, applied for SSDI and awaiting decision, doctor's declaration of disability, or in 24-month Medicare waiting period

**Benefits:** Free or low-cost brand-name prescription medications (typically 3-month supply with refills if eligible) from pharmaceutical company patient assistance programs; links to low-cost generic mail-order options.
- Varies by: medication_and_pharmaceutical_company_guidelines

**How to apply:**
- In-person: Make appointment at local county SenioRx office via your Area Agency on Aging (varies by region)
- Phone: Call local Area Agency on Aging office (examples: 1-800-838-5845 for NW Alabama[8]; varies by region)
- No statewide online or mail application specified; must apply in legal county of residence

**Timeline:** Not specified in sources.

**Watch out for:**
- Final eligibility determined by each pharmaceutical company's guidelines, not just SenioRx screening[8]
- Only for chronic conditions/daily meds; no short-term antibiotics or acute treatments[6]
- Must apply in your specific county of residence; no statewide central application[4]
- Income at 200% FPL is SenioRx guideline, but pharma programs may allow higher—still worth applying[4][8]
- Funded 100% by Alabama Legislature, not federal Older Americans Act[4]

**Data shape:** County-administered via 10+ Area Agencies on Aging; eligibility tiers (55+/chronic OR disabled any age OR Medicare gap); benefits dictated by pharma programs (3-month supplies); no fixed dollar cap, varies by drug/company

**Source:** https://alabamaageline.gov/seniorx/[3]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Alabama Medicaid Elderly and Disabled Wa | benefit | state | deep |
| Alabama PACE (Program of All-Inclusive C | benefit | local | medium |
| Alabama Medicaid Medicare Savings Progra | benefit | federal | deep |
| Alabama Elderly Simplified Application P | benefit | state | medium |
| Alabama LIHEAP (Low-Income Home Energy A | benefit | federal | deep |
| Alabama Weatherization Assistance Progra | benefit | federal | deep |
| Alabama SHIP (State Health Insurance Ass | navigator | federal | simple |
| Elderly Nutrition Program (Meals on Whee | benefit | federal | medium |
| Alabama Lifespan Respite Program | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Alabama Legal Services for Seniors | resource | state | simple |
| Alabama Long-Term Care Ombudsman Program | resource | federal | simple |
| Alabama Cares Program | benefit | state | deep |
| Elderly and Disabled (E&D) Medicaid Waiv | benefit | state | deep |
| Senior Aides Program | benefit | state | deep |
| SenioRx Prescription Drug Assistance Pro | resource | state | simple |

**Types:** {"benefit":11,"navigator":1,"employment":1,"resource":3}
**Scopes:** {"state":8,"local":1,"federal":7}
**Complexity:** {"deep":8,"medium":4,"simple":4}

## Content Drafts

Generated 16 page drafts. Review in admin dashboard or `data/pipeline/AL/drafts.json`.

- **Alabama Medicaid Elderly and Disabled Waiver** (benefit) — 5 content sections, 6 FAQs
- **Alabama PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 2 content sections, 6 FAQs
- **Alabama Medicaid Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Alabama Elderly Simplified Application Project (AESAP)** (benefit) — 2 content sections, 6 FAQs
- **Alabama LIHEAP (Low-Income Home Energy Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Alabama Weatherization Assistance Program** (benefit) — 4 content sections, 6 FAQs
- **Alabama SHIP (State Health Insurance Assistance Program)** (navigator) — 2 content sections, 6 FAQs
- **Elderly Nutrition Program (Meals on Wheels)** (benefit) — 3 content sections, 6 FAQs
- **Alabama Lifespan Respite Program** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Alabama Legal Services for Seniors** (resource) — 3 content sections, 6 FAQs
- **Alabama Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Alabama Cares Program** (benefit) — 1 content sections, 6 FAQs
- **Elderly and Disabled (E&D) Medicaid Waiver** (benefit) — 4 content sections, 6 FAQs
- **Senior Aides Program** (benefit) — 5 content sections, 6 FAQs
- **SenioRx Prescription Drug Assistance Program** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **Medicaid vs. non-Medicaid status (Medicaid participants receive fully covered services; non-Medicaid participants pay a flat monthly premium)[5]**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 3 programs
- **region**: 2 programs
- **legal_issue_type**: 1 programs
- **medication_and_pharmaceutical_company_guidelines**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Alabama Medicaid Elderly and Disabled Waiver**: Administered regionally via AAAs with statewide cap; SSI-related income test (300% FBR); no age minimum; benefits person-centered without fixed units; persistent waitlists due to slot limits.
- **Alabama PACE (Program of All-Inclusive Care for the Elderly)**: Alabama PACE is severely geographically restricted (only 2 counties), has a fixed enrollment cap per program, requires state certification of nursing home-level care need, and has no income/asset limits for program enrollment (though Medicaid coverage has separate financial requirements). The program is not statewide and availability is the primary limiting factor for most Alabama families. Medicaid eligibility is separate from PACE eligibility but determines coverage type and cost structure.
- **Alabama Medicaid Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by QMB (full cost-sharing), SLMB (Part B only, higher income), QI-1 (Part B only, highest income, limited funds); income as %FPL with couple ranges; statewide but QI waitlist risk; no household >2 tables
- **Alabama Elderly Simplified Application Project (AESAP)**: Streamlined SNAP demo for elderly-only households: 2-page app, 36-month certification, no interview (unless requested), self-declare most info, same income/asset tests as regular SNAP.
- **Alabama LIHEAP (Low-Income Home Energy Assistance Program)**: Administered via ~20 local CAAs with agency-specific income tables, opening dates, methods; income at 150% FPL but figures drift by fiscal year; priority tiers heavily influence access; funding exhausts quickly by region
- **Alabama Weatherization Assistance Program**: Delivered via 10+ regional community action agencies with county-specific contacts, quotas, and waitlists; priority tiers heavily influence access; no central application portal.
- **Alabama SHIP (State Health Insurance Assistance Program)**: SHIP is a counseling and advocacy service rather than a direct financial assistance program. No income limits, asset limits, or specific eligibility criteria are publicly documented in available sources — eligibility appears to be based on Medicare beneficiary status. Benefits are uniform statewide (free counseling) but delivered through local regional providers (AAAs and ADRCs). The program helps beneficiaries identify and access other assistance programs (Medicare Savings Programs, prescription drug assistance, Medicaid) but does not directly provide financial aid itself. Critical distinction: This is different from the Small Rural Hospital Improvement Grant Program (also called SHIP) administered by Alabama Department of Public Health[1], which is a separate program for hospitals, not individuals.
- **Elderly Nutrition Program (Meals on Wheels)**: No income/asset test; eligibility focused on age/homebound status and local delivery zones; decentralized via county AAAs with statewide oversight; congregate vs. home-delivered tiers; volunteer-dependent with regional provider variations.
- **Alabama Lifespan Respite Program**: This program's eligibility is notably broad—it serves care recipients 'of any age' with 'any' chronic illness or disability, not restricted to specific diagnoses. However, a separate Department of Mental Health respite reimbursement program exists specifically for care recipients with intellectual disabilities (IQ below 70) requiring 80 hours of care per week[1]. The Alabama Lifespan Respite program appears to be the broader, federally-funded option. Funding is explicitly limited and not guaranteed, making this a competitive program rather than an entitlement. No income or asset limits are specified in available documentation, which is unusual for a needs-based program and suggests either universal eligibility or discretionary allocation.
- **Senior Community Service Employment Program (SCSEP)**: County-restricted by 8+ regional providers across all 67 counties; wages/hours vary slightly by provider; no asset test; must confirm current 125% FPL table separately as not listed
- **Alabama Legal Services for Seniors**: This program's structure is complex because it combines statewide Legal Services Alabama with regional Area Agencies on Aging that contract with LSA. Eligibility is income-based with a federal poverty guideline threshold (125% FPG) but also includes special non-income-based grants for seniors 60+. The program does not publish specific dollar amounts for income or asset limits, requiring families to contact directly. Benefits are service-based rather than financial, varying by legal issue type. Geographic coverage is statewide across 67 counties with 8 regional offices, but application and contact methods vary by region (some route through AAA/ADRC, others directly to LSA). Processing timelines and waitlist status are not publicly disclosed.
- **Alabama Long-Term Care Ombudsman Program**: no income/asset/age test; advocacy-only for long-term care facility residents statewide via ADSS and 13 area agencies on aging; open to anyone filing on behalf of resident
- **Alabama Cares Program**: Caregiver-focused with priority tiers emphasizing economic/social need, rural areas, and specific vulnerabilities; administered regionally by Area Agencies on Aging with no fixed income/asset tests
- **Elderly and Disabled (E&D) Medicaid Waiver**: No age requirement; NFLOC via unique HCBS-1 checklist (meet 2/11 criteria); no service cost cap; waitlist for non-Medicaid eligible; statewide but via regional AAAs.
- **Senior Aides Program**: No direct match; data fragmented across Medicaid E&D Waivers (financial/medical tests), CARES (caregiver support, no income test), Personal Choices (self-direction add-on). Regional AAA delivery; waitlists common for waivers.
- **SenioRx Prescription Drug Assistance Program**: County-administered via 10+ Area Agencies on Aging; eligibility tiers (55+/chronic OR disabled any age OR Medicare gap); benefits dictated by pharma programs (3-month supplies); no fixed dollar cap, varies by drug/company

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Alabama?
