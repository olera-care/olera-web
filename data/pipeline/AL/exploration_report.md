# Alabama Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 14 |
| New (not in our data) | 13 |
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

- **service**: 7 programs
- **financial**: 3 programs
- **financial reimbursement**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Alabama Medicaid Elderly and Disabled Waiver

- **income_limit**: Ours says `$2901` → Source says `$2,829` ([source](https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_waivers.aspx))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Person-centered services based on individual plan of care, including personal care, homemaker services, respite care, adult day health, companion services, home-delivered frozen meals, and case management. No fixed dollar amounts or hours specified; varies by assessed needs to prevent institutionalization.` ([source](https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_waivers.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.alabama.gov/content/6.0_LTC_waivers/6.1_HCBS_waivers.aspx`

## New Programs (Not in Our Data)

- **Alabama PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://medicaid.alabama.gov/content/5.0_Managed_Care/5.2_Other_MC_Programs/5.2.3_PACE.aspx))
  - Shape notes: County-restricted (Mobile/Baldwin); provider-specific (Mercy LIFE); no strict income/asset test for enrollment but for Medicaid coverage; capped enrollment
- **Alabama Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://medicaid.alabama.gov/content/3.0_Apply/3.2_Qualifying/3.2.6_Help_Paying_Medicare.aspx))
  - Shape notes: Tiered by income (QMB lowest, then SLMB, QI highest); QI capped funding/annual reapply; uniform statewide but district processing; scales by household size via FPL; auto-LIS linkage.
- **Alabama Elderly Simplified Application Project (AESAP)** — financial ([source](https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/[9]))
  - Shape notes: Streamlined SNAP process only—no unique benefits or limits; 3-year certification differentiates it; income/resources match standard SNAP elderly rules; county-administered statewide
- **Alabama LIHEAP (Low-Income Home Energy Assistance Program)** — financial ([source](https://adeca.alabama.gov/liheap/))
  - Shape notes: Benefits scale by household size and vary by season (heating vs. cooling) and crisis status. Income limits scale by household size with a formula for households beyond 15 members. Application processes and opening dates vary significantly by county-level CAA, making this a decentralized program with no single statewide application portal. Priority tiers (seniors, disabled, medical vulnerabilities, energy crisis) receive earlier access to limited funds. Program operates on a fiscal year basis (October 1–September 30) with seasonal components (heating Oct–Apr, cooling May–Sep).
- **Alabama Weatherization Assistance Program** — service ([source](https://adeca.alabama.gov/weatherization/))
  - Shape notes: Delivered via 10+ regional community action agencies with county-specific contacts and processes; priority-tiered waitlist; no central application portal; income at 200% FPL with auto-eligibility for SSI/AFDC.
- **Alabama SHIP (State Health Insurance Assistance Program)** — service ([source](alabamaageline.gov/ship/[6] and Alabama Department of Senior Services (AL Department of Senior Services, ADDS 201 Monroe Street, RSA Tower, Suite 350 Montgomery AL 36130-1851)[5]))
  - Shape notes: SHIP is a counseling and assistance program, not a direct-benefit program. It helps Medicare beneficiaries navigate existing programs (Medicare, Medicaid, Medicare Savings Programs, Extra Help, Medigap, etc.) rather than providing its own financial or healthcare benefits. Eligibility criteria beyond 'Medicare beneficiary or family member' are not publicly specified in available sources. The program is administered regionally through Area Agencies on Aging, which may explain why specific income/asset limits are not centralized in state-level documentation. Income limits likely vary by the specific assistance programs SHIP helps people access (e.g., Medicare Savings Programs have federal income thresholds), not by SHIP itself.
- **Alabama Meals on Wheels (Elderly Nutrition Program)** — service ([source](https://alabamaageline.gov/elderly-nutrition-program/))
  - Shape notes: Decentralized by county via local AAAs; no statewide income test; home delivery not universal; congregate meals more widely available than delivery
- **Alabama Lifespan Respite Program** — financial reimbursement ([source](https://alabamarespite.org/apply-for-respite/2025-2026-respite-application-packet/))
  - Shape notes: This program is a reimbursement-based respite voucher program, not a direct service provider. The caregiver has full control over selecting and hiring respite providers and determining compensation rates (within program guidelines). No specific income or asset limits are disclosed, making it potentially more accessible than means-tested programs. The primary eligibility barrier is the mutual exclusivity requirement — applicants cannot receive respite from any other program. Funding is limited and not guaranteed even for eligible applicants. The program is statewide but administered through UCP Huntsville. Specific dollar amounts for reimbursement are not publicly available in the documentation reviewed.
- **Alabama Senior Community Service Employment Program (SCSEP)** — employment ([source](https://alabamaageline.gov/scsep/))
  - Shape notes: Administered by multiple regional providers with county-specific service areas; no asset limits or fixed dollar benefits—income eligibility scales by household size via annual federal poverty guidelines; lifetime enrollment cap of 48 months
- **Alabama Legal Services Corporation (Legal Aid for Seniors)** — service ([source](https://legalservicesalabama.org/elder-law/))
  - Shape notes: Elder grants waive income test (unique non-income-based access for 60+); statewide but with county-specific volunteer programs and referrals; priority for seniors among low-income
- **Alabama Long-Term Care Ombudsman Program** — advocacy ([source](https://alabamaageline.gov/ombudsman/))
  - Shape notes: no income/asset/age test; advocacy-only (no direct services or reimbursement); operates via statewide office + regional Area Agencies on Aging; complaint-driven rather than application for benefits
- **Alabama Cares** — service ([source](https://alabamaageline.gov/alabama-cares/))
  - Shape notes: No income/asset tests but priority-based on need; caregiver-focused (not direct to elderly); administered regionally via local AAAs with statewide guidelines; limited funds create de facto waitlist/prioritization.
- **Alabama Senior Farmers Market Nutrition Program (SFMNP)** — in_kind ([source](https://agi.alabama.gov/farmersmarket/))
  - Shape notes: Benefits are fixed at $50 per senior (do not vary by household size or priority tier). Income limits scale by household size. Program is statewide but administered through regional AAAs with varying local details. Critical timing factor: applications open January annually and close when funds exhaust. No asset limits documented in available sources.

## Program Details

### Alabama Medicaid Elderly and Disabled Waiver


**Eligibility:**
- Income: Income cannot exceed 300% of the SSI Federal Benefit Rate (FBR). As of available data, this is approximately $2,829 per month for an individual (exact amount varies annually with SSI FBR; for 2026, confirm current 300% SSI limit). No variation specified by household size in waiver-specific rules, but must qualify for full Medicaid. SSI recipients automatically qualify financially.
- Assets: Resources cannot exceed $2,000 for an individual. Exempt assets include primary home (if applicant lives there, intends to return, or certain family members reside there; home equity limit of $1,130,000 in 2026), one vehicle, household furnishings, personal effects, and appliances. Look-Back Rule applies: assets transferred for less than fair market value within 60 months result in penalty period.
- Alabama resident
- At risk of nursing facility placement (must meet nursing facility level of care, determined by physician)
- Financially eligible for Medicaid
- Disabled (as defined by Medicaid/SSI criteria) or elderly

**Benefits:** Person-centered services based on individual plan of care, including personal care, homemaker services, respite care, adult day health, companion services, home-delivered frozen meals, and case management. No fixed dollar amounts or hours specified; varies by assessed needs to prevent institutionalization.
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) or Aging and Disability Resource Center (ADRC); statewide via Alabama Department of Senior Services (ADSS)
- Phone: Varies by region (e.g., contact ADSS at regional AAAs; no single statewide number in results)
- Website: https://medicaid.alabama.gov (for E&D program info and links)
- In-person/mail: Local AAA offices (e.g., Area Agency on Aging of East Alabama, Regional Planning Commission of Greater Birmingham)

**Timeline:** Not specified; case manager develops plan post-eligibility
**Waitlist:** Enrollment capped at 15,000 beneficiaries annually; waitlist likely if slots full

**Watch out for:**
- Must already qualify for Medicaid or meet financial criteria; waiver does not provide Medicaid coverage itself
- Strict $2,000 asset limit with 60-month Look-Back Rule—gifting assets triggers penalties
- Nursing facility level of care required (not just 'disabled')
- Annual enrollment cap of 15,000 leads to waitlists
- Home subject to Estate Recovery post-death
- No age minimum, but targeted at elderly/disabled at institutional risk

**Data shape:** Administered regionally via AAAs with statewide cap; benefits person-centered by assessed needs, not fixed amounts; tied to Medicaid eligibility and NFLOC

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
- Income: No strict income limits for enrollment; Medicaid eligibility (for Medicaid-funded coverage) follows Alabama Medicaid long-term care rules: income under 300% of Federal Benefit Rate ($2,901/month in 2025). Private pay available for non-Medicaid eligible via monthly premium. Varies by Medicaid household rules, but no PACE-specific table provided.
- Assets: No strict asset limits for PACE enrollment; for Medicaid coverage, assets $2,000 or less (excluding primary home). Medicaid planning available to qualify.
- Nursing facility level of care (certified by Alabama Medicaid Agency per Rule 560-X-10-.10)
- Reside in PACE provider service area (e.g., Mobile and Baldwin counties for current program)
- Able to live safely in community with PACE services
- Meet any program-specific conditions in PACE agreement

**Benefits:** Comprehensive, all-inclusive community-based services including primary care, hospital/inpatient, nursing home if needed, medications, therapies, social services, transportation, personal care, adult day health care, home care, respite; covers all Medicare/Medicaid reimbursable plus additional based on need; no deductibles/copays for enrollees.
- Varies by: region

**How to apply:**
- Contact Mercy LIFE of Alabama (primary provider): phone 251-287-8427
- Alabama Medicaid Agency PACE page: https://medicaid.alabama.gov/content/5.0_Managed_Care/5.2_Other_MC_Programs/5.2.3_PACE.aspx
- In-person at PACE centers (e.g., Mobile/Baldwin counties)
- Medicaid eligibility assessment required

**Timeline:** Not specified in sources
**Waitlist:** Enrollment capped at up to 185 per program; potential waitlist due to capacity

**Watch out for:**
- Not statewide—only available in specific counties (e.g., Mobile/Baldwin); check service area zip codes
- Medicaid not required for enrollment but needed for free coverage; private pay monthly fee otherwise
- Enrollment capped (up to 185 per program)—waitlists possible
- Must be able to live safely in community with PACE support; not for those already unsafe without it
- Annual recertification required

**Data shape:** County-restricted (Mobile/Baldwin); provider-specific (Mercy LIFE); no strict income/asset test for enrollment but for Medicaid coverage; capped enrollment

**Source:** https://medicaid.alabama.gov/content/5.0_Managed_Care/5.2_Other_MC_Programs/5.2.3_PACE.aspx

---

### Alabama Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: 2026 federal limits apply statewide (Alabama follows federal MSP standards): QMB: Individual $1,350/month, Couple $1,824/month (100% FPL); SLMB: Individual up to approx. $1,620/month (120% FPL), Couple up to approx. $2,189/month; QI: Individual up to approx. $1,850/month (135% FPL), Couple up to approx. $2,500/month. Exact limits increase annually; check current via SSA or Medicaid. Varies by household size per federal poverty guidelines (e.g., adds ~$500/person beyond couple).[5][2]
- Assets: 2026: Individual $9,950; Couple $14,910 (exempt: home/land, 1 car, burial plots/funds up to $1,500/person, life insurance up to $1,500 face value, household goods; countable: bank accounts, stocks, bonds, second vehicles/properties).[5][3]
- Must be enrolled in Medicare Parts A and B (or eligible for Part A)
- U.S. citizen or qualified immigrant
- Alabama resident
- Not eligible for full Medicaid (QI cannot overlap with other Medicaid)
- QI requires prior-year recipients get priority; first-come, first-served with limited funding

**Benefits:** QMB: Pays Medicare Part A premium (if applicable), Part B premium (~$185/month in 2026), deductibles, coinsurance/copayments (providers cannot bill beneficiary for Medicare-covered services); auto-qualifies for Extra Help (Part D low-income subsidy, caps drug copays at $12.65/drug). SLMB: Pays Part B premium only. QI: Pays Part B premium only (no Medicaid card).[1][5][6]
- Varies by: priority_tier

**How to apply:**
- Online: medicaid.alabama.gov (MEDICAID application portal)
- Phone: 1-800-362-1504 (Alabama Medicaid)
- Mail/In-person: Local Medicaid District Offices (find via medicaid.alabama.gov/content/2.0_Contact/2.1_District_Offices.aspx)
- Download Form: Medicaid Application (Form MG-14-MA or online equivalent)

**Timeline:** QMB: Active month after approval; SLMB/QI: Active month of application, retroactive up to 3 months prior if eligible.[1][6]
**Waitlist:** QI only: Limited funding; first-come, first-served, priority to prior recipients; may close when funds exhausted.[6]

**Watch out for:**
- QI funding limited—apply early in year; no Medicaid card for SLMB/QI (QMB gets one); providers must accept Medicaid assignment for QMB (cannot bill you); auto-Extra Help but must confirm enrollment; income/asset limits exclude some deductions (e.g., $20 disregard); cannot overlap QI with other Medicaid; retroactive coverage for SLMB/QI but not QMB; limits update yearly—use 2026 figures above but verify.[1][5][6]
- QMB protections: Report bills for Medicare services (illegal to charge).

**Data shape:** Tiered by income (QMB lowest, then SLMB, QI highest); QI capped funding/annual reapply; uniform statewide but district processing; scales by household size via FPL; auto-LIS linkage.

**Source:** https://medicaid.alabama.gov/content/3.0_Apply/3.2_Qualifying/3.2.6_Help_Paying_Medicare.aspx

---

### Alabama Elderly Simplified Application Project (AESAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Same as standard Alabama Food Assistance (SNAP) program. Gross monthly income limits (effective Oct 1, 2022 - Sep 30, 2023): 1 person: $1,396/$1,073; 2: $1,888/$1,452; 3: $2,379/$1,831; 4: $2,871/$2,210; 5: $3,518/$2,706; 6: $4,029/$3,100; 7: $4,541/$3,493; 8: $5,052/$3,886; each additional: $512/$394. Limits updated annually; check current via DHR[1][6].
- Assets: Same resource limits as standard Food Assistance (SNAP) program; specific amounts not detailed in sources but follow federal SNAP elderly/disabled rules (e.g., $4,250 countable resources for households with elderly member as of recent years; verify current). Countable: cash, bank accounts. Exempt: home, one vehicle, household goods, life insurance, retirement accounts[1][2][4].
- All household members age 60+ on application date
- No earned income (wages, self-employment) in month of application
- U.S. citizen or qualified non-citizen (verification required if questionable)
- Meets standard Food Assistance residency, cooperation rules

**Benefits:** SNAP/Food Assistance benefits via EBT debit card for groceries; amount calculated same as standard program based on income, deductions (e.g., medical expenses); no fixed dollar amount or hours—varies by household circumstances[1][2][3][4].
- Varies by: household_size

**How to apply:**
- Online: https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/[9]
- Phone: AESAP Hotline 1-833-822-2202 (automated), 334-242-1700 ext 3, Customer Service 1-800-438-2958, EBT 1-800-997-8888[2][6]
- Mail/Fax/Email: Use AESAP application form; send to local DHR county office[5][7]
- In-person: Local DHR county Food Assistance office (no face-to-face interview required unless requested)[1][4]

**Timeline:** Up to 30 days from application date[6]

**Watch out for:**
- Age discrepancy in sources (some say 65, official is 60); use 60+[1][2][8]
- No earned income means zero wages/self-employment in application month—unearned (SSI, pension) allowed[1][2]
- 3-year certification with annual interim form required; must report changes[1][4]
- Benefits calculated as standard SNAP—not higher despite simplification[1][3]
- Fraud penalties severe: fines, imprisonment[6]
- Not for households with children or under-60 members[3][8]

**Data shape:** Streamlined SNAP process only—no unique benefits or limits; 3-year certification differentiates it; income/resources match standard SNAP elderly rules; county-administered statewide

**Source:** https://dhr.alabama.gov/food-assistance/alabama-elderly-simplified-application-project-aesap/[9]

---

### Alabama LIHEAP (Low-Income Home Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross monthly income must not exceed 150% of the federally established poverty level[7]. As of October 1, 2025, the maximum monthly gross income limits are: 1 person $2,347, 2 people $3,176, 3 people $4,006, 4 people $4,835, 5 people $5,665, 6 people $6,494, 7 people $7,324, 8 people $8,153, 9 people $8,983, 10 people $9,812, 11 people $10,641, 12 people $11,471, 13 people $12,300, 14 people $13,130, 15 people $13,959. Add $829 for each additional household member beyond 15[6].
- Assets: Not specified in available documentation
- Reside in Alabama and be a U.S. citizen or qualified non-resident (check with local agency for non-resident eligibility)[6]
- Provide proof of gross income for all current household members for the month prior to application[6]
- Furnish Social Security cards for all household members and photo ID for the person applying[3]
- Provide utility bill in the applicant's name[4]
- If living in government housing, provide a lease[4]
- Applicant must be the head of household, spouse of the head of household, or a second-party applicant with a signed statement from the head of household or spouse[2]

**Benefits:** Heating assistance: $280–$580 maximum benefit. Cooling assistance: $320–$520 maximum benefit. Winter crisis assistance: up to $1,100 maximum benefit. Summer crisis assistance: up to $990 maximum benefit[5]. Benefits are calculated based on household income, household size, and type of fuel used for heating or cooling[5].
- Varies by: household_size|priority_tier|fuel_type|season

**How to apply:**
- In-person appointments at local Community Action Agency (CAA) offices[1]
- Phone scheduling through local CAA[1]
- Online portals (varies by agency)[1]
- Online document submission portal: https://littliteal.azurewebsites.net (for Community Service Programs of West Alabama)[2]

**Timeline:** Not explicitly specified in available documentation. Appointments are scheduled on a first-come, first-served basis[2][4].
**Waitlist:** Funds are limited and typically distributed on a first-come, first-served basis[1]. Some agencies may stop accepting applications earlier if funds run out[5].

**Watch out for:**
- Priority households (seniors, individuals with medical vulnerabilities, households in immediate energy crisis) may receive assistance before the general public[1]
- No household may be assisted more than once for regular heating and once for cooling assistance with LIHEAP funds in a program year[2]
- Crisis assistance is only available to households meeting income guidelines AND meeting the definition of an energy-related crisis (e.g., broken furnace, utility shutoff notice)[2][5]
- Heating assistance is only available October 1–April 30; cooling assistance is only available May 1–September 30[5]
- Crisis assistance is available year-round but only for emergencies[5]
- Applicants are responsible for paying any remaining balance on their energy bill not covered by program funds[6]
- Roommates covered by the same utility bill are counted as part of the same LIHEAP household, even if they don't share most expenses[5]
- Funds are limited and distributed first-come, first-served; some agencies may stop accepting applications before the official program end date if funding runs out[1][5]
- Income limits are based on 150% of federal poverty level, which is lower than some other assistance programs (e.g., some LIHEAP programs serve households up to 60% of state median income, but Alabama uses federal poverty)[1][7]

**Data shape:** Benefits scale by household size and vary by season (heating vs. cooling) and crisis status. Income limits scale by household size with a formula for households beyond 15 members. Application processes and opening dates vary significantly by county-level CAA, making this a decentralized program with no single statewide application portal. Priority tiers (seniors, disabled, medical vulnerabilities, energy crisis) receive earlier access to limited funds. Program operates on a fiscal year basis (October 1–September 30) with seasonal components (heating Oct–Apr, cooling May–Sep).

**Source:** https://adeca.alabama.gov/liheap/

---

### Alabama Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the federal poverty guidelines. Exact amounts vary by household size and are updated annually by HHS; for example, one source notes adding $11,000 per additional person beyond base (specific base not listed, consult current HHS Poverty Guidelines). Households receiving Supplemental Security Income (SSI) or Aid to Families with Dependent Children (AFDC) are eligible regardless.
- Assets: No asset limits mentioned in available sources.
- Must own or rent the home (renters need landlord acknowledgment).
- Priority given to elderly, households with disabled members, families with children (under 18), and high-energy users.

**Benefits:** Home energy efficiency improvements including air sealing/infiltration reduction, attic insulation, dense-pack sidewall insulation, duct insulation, floor insulation, general energy saving measures, heater repairs or replacement, health and safety measures, and energy audits. No specific dollar amounts or hours; services are free to eligible participants and based on professional assessment.
- Varies by: priority_tier

**How to apply:**
- Contact local agency serving your county by phone or in-person appointment (ADECA does not process applications).
- Mail completed application and documents to specific regional offices (e.g., CARPDC Weatherization Program, 430 South Court St., Montgomery, AL 36104).
- Request application packet by providing mailing address and contact numbers to local agency.

**Timeline:** Not specified; applications placed on waiting list and ranked by priority points.
**Waitlist:** Yes, applications sorted and ranked on waiting list based on priority points required by grantor; number of homes weatherized per county determined by ADECA/DOE grants.

**Watch out for:**
- Must contact specific county-serving agency (ADECA does not accept applications).
- Priority ranking on waitlist means not all eligible applicants receive services immediately; limited by county grants.
- All household members' documents required; incomplete apps rejected.
- Renters need landlord approval; program alters homes.
- No statewide application—regional providers have unique processes/forms.
- Verify current 200% poverty guidelines as they change yearly.

**Data shape:** Delivered via 10+ regional community action agencies with county-specific contacts and processes; priority-tiered waitlist; no central application portal; income at 200% FPL with auto-eligibility for SSI/AFDC.

**Source:** https://adeca.alabama.gov/weatherization/

---

### Alabama SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available sources. Search results indicate SHIP assists 'beneficiaries with limited income' but do not provide specific dollar thresholds or household-size-based tables.
- Assets: Not specified in available sources.
- Must be a Medicare beneficiary, their family member, or caregiver[2][6]
- Program is specifically designed for seniors and people with disabilities eligible for Medicare[4]

**Benefits:** Free, personalized, one-on-one health insurance counseling and assistance. Specific services include: understanding Medicare benefits (Parts A, B, D); comparing and selecting Medicare Prescription Drug Plans; answering questions about Medigap and long-term care insurance; assistance with Medicare claims and appeals; guidance on programs to help pay Medicare costs; referrals to other helpful programs; information about Medicaid, Medicare Savings Programs (QMB, SLMB, QI), Extra Help/Low Income Subsidy, and prescription drug assistance programs[2][3][6][8]

**How to apply:**
- Phone: 1-800-AGE-LINE (1-800-243-5463)[4][6][8]
- Phone: 1-800-MEDICARE (1-800-633-4227)[2]
- Phone: 1-800-838-5845 (alternative SHIP contact)[2]
- In-person: Contact your local Area Agency on Aging (AAA) and Aging & Disability Resource Center (ADRC) to complete an assessment[8]
- Website: alabamaageline.gov/ship/[6]

**Timeline:** Not specified in available sources.
**Waitlist:** Not mentioned in available sources.

**Watch out for:**
- SHIP provides counseling and assistance, not direct financial benefits or insurance enrollment. It helps people understand options and apply for programs, but does not pay premiums or provide healthcare directly[6][8]
- Counselors are not affiliated with insurance companies and will not sell insurance[2][4][6]
- Best time to contact is during Annual Enrollment Period (October 15 – December 7 each year), though you should also contact when first becoming eligible for Medicare[8]
- You do not 'enroll' in SHIP itself; you contact your local ADRC and complete an assessment[8]
- All counseling records are strictly confidential[4][6]
- Income limits for qualifying for assistance programs (like Medicare Savings Programs or Extra Help) exist but are not detailed in the SHIP program description itself[2][3]

**Data shape:** SHIP is a counseling and assistance program, not a direct-benefit program. It helps Medicare beneficiaries navigate existing programs (Medicare, Medicaid, Medicare Savings Programs, Extra Help, Medigap, etc.) rather than providing its own financial or healthcare benefits. Eligibility criteria beyond 'Medicare beneficiary or family member' are not publicly specified in available sources. The program is administered regionally through Area Agencies on Aging, which may explain why specific income/asset limits are not centralized in state-level documentation. Income limits likely vary by the specific assistance programs SHIP helps people access (e.g., Medicare Savings Programs have federal income thresholds), not by SHIP itself.

**Source:** alabamaageline.gov/ship/[6] and Alabama Department of Senior Services (AL Department of Senior Services, ADDS 201 Monroe Street, RSA Tower, Suite 350 Montgomery AL 36130-1851)[5]

---

### Alabama Meals on Wheels (Elderly Nutrition Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or restrictions[2][6]
- Assets: No asset limits mentioned; not applicable[2][6]
- Homebound or unable to shop/prepare meals without assistance (for delivery)[1][2][6][8]
- Live in service area/county[1][2][6]
- Spouse of eligible participant (any age)[5][6][8]
- Person with disability residing with eligible participant[5][6][8]
- Person with disability under 60 in housing where ENP is provided[5][6]

**Benefits:** Nutritious hot or frozen meals providing at least 1/3 of daily dietary reference intakes per meal; delivered to homebound seniors or served at senior centers; no charge for meals, voluntary contributions accepted[6]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or visit senior center[1][6][8]
- Jefferson County example: Contact Meals on Wheels Jefferson County or United Way Area Agency on Aging[2][8]
- No statewide phone or online form specified; use Alabama Age Line for referrals (implied via alabamaageline.gov)[6]

**Timeline:** Not specified; simple enrollment form at senior center on initial visit[8]
**Waitlist:** Not mentioned; may vary by local provider[1]

**Watch out for:**
- Not all areas offer home delivery; must confirm with local AAA[6]
- Eligibility varies slightly by provider (e.g., Jefferson County specifies homebound in county)[2]
- Voluntary contributions expected but not required[6]
- Separate from food assistance programs like SNAP which have income/work rules[3]
- Spouses/disabled under 60 only if living with eligible senior[6]

**Data shape:** Decentralized by county via local AAAs; no statewide income test; home delivery not universal; congregate meals more widely available than delivery

**Source:** https://alabamaageline.gov/elderly-nutrition-program/

---

### Alabama Lifespan Respite Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available documentation. Program does not appear to have explicit income thresholds.
- Assets: Not specified in available documentation.
- Must be a full-time, unpaid family caregiver[4]
- Care recipient must have a chronic illness or disability requiring around-the-clock care[4]
- Care recipient must be any age[4]
- Both caregiver and care recipient must be Alabama residents[1][3]
- Cannot currently be receiving respite services through any other program[1][3]
- Only one caregiver per household is eligible to apply[1]
- Only one care recipient per household may be listed[1]
- Must submit proof of diagnosis for care recipient (required to process application)[1][3]
- Caregiver must select and train a respite provider who is at least 18 years old and does not live in the care recipient's home[1][3]

**Benefits:** Specific dollar amounts per hour or maximum annual benefit not disclosed in available documentation. Program provides reimbursement for respite care services selected and arranged by the caregiver.
- Varies by: Not specified — appears to be fixed reimbursement structure, but exact amounts not publicly detailed

**How to apply:**
- Online application through 2025-2026 Respite Application Packet[3][4]
- Email: al.respite@ucphuntsville.org[3]
- Phone: 256-859-8300[1][3]
- Phone: 256-859-4900 (Tracy Cieniewicz)[7]

**Timeline:** Not explicitly stated for initial applications. Reimbursement is issued within 30 days of timesheet submission and verification[4]. Note: Completion of application does not guarantee financial assistance; awards are based on available resources[4].
**Waitlist:** Not mentioned in documentation. However, program explicitly states 'while Alabama Lifespan Respite wishes we could help all qualified individuals who seek assistance, regrettably we only have limited funds to meet the needs of qualified caregivers'[4]

**Watch out for:**
- Cannot receive respite services from any other program simultaneously — this is an absolute disqualifier[1][3]
- Only one caregiver per household and one care recipient per household — multi-generational or complex family situations may not qualify[1]
- Caregiver is responsible for selecting, hiring, and training the respite provider — the program does not provide or vet providers[1][3]
- Respite provider must live outside the care recipient's home — cannot be a household member[1][3]
- Proof of diagnosis is mandatory and must be submitted with application — missing this will delay or prevent processing[1][3]
- Limited funding means not all qualified applicants receive assistance; awards are made based on available resources[4]
- If you applied and received reimbursement after July 1, 2025, you do not need to reapply — re-enrollment information is sent automatically[4]
- Completion of application does not guarantee funding[4]
- Respite provider training is available free but limited to 25 individuals per month and is for new applicants only[5]

**Data shape:** This program is a reimbursement-based respite voucher program, not a direct service provider. The caregiver has full control over selecting and hiring respite providers and determining compensation rates (within program guidelines). No specific income or asset limits are disclosed, making it potentially more accessible than means-tested programs. The primary eligibility barrier is the mutual exclusivity requirement — applicants cannot receive respite from any other program. Funding is limited and not guaranteed even for eligible applicants. The program is statewide but administered through UCP Huntsville. Specific dollar amounts for reimbursement are not publicly available in the documentation reviewed.

**Source:** https://alabamarespite.org/apply-for-respite/2025-2026-respite-application-packet/

---

### Alabama Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Annual household income must be equal to or less than 125% of the federal poverty level (FPL), as determined annually by the U.S. Department of Health and Human Services. Exact dollar amounts vary yearly and by household size; families must check current HHS Poverty Guidelines (no specific table provided in sources, but published by U.S. Department of Labor for SCSEP). Examples for context (not current): for 2023, 125% FPL was approximately $18,825 for 1 person, $25,425 for 2, $32,025 for 3, etc., scaling by household size.
- Assets: No resource/asset limit is required.
- Alabama resident
- Unemployed at time of application and enrollment
- Resident of counties served by the specific SCSEP provider (varies by region)
- Not previously enrolled in SCSEP for a cumulative total of 4 years/48 months (includes time with any provider)
- U.S. citizen or authorized to work (verified by I-9 form)
- Priority given to veterans, qualified spouses of veterans, and individuals over age 65

**Benefits:** Part-time community service work-based training averaging 20 hours per week, paid the highest of federal, state, or local minimum wage. Provides work experience in community settings (e.g., schools, hospitals, daycare, healthcare support, meals for elderly, childcare aides, data entry, grounds maintenance). Serves as bridge to unsubsidized employment; includes job readiness skills and employment assistance via American Job Centers.
- Varies by: priority_tier

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA) or Aging & Disability Resource Center (ADRC) at 1-800-AGE-LINE (1-800-243-5463)
- In-person: Local SCSEP providers (e.g., West Alabama Regional Commission for Bibb, Fayette, Greene, Hale, Lamar, Pickens, Tuscaloosa Counties; TARCOG for DeKalb, Jackson, Limestone, Madison, Marshall Counties; Easter Seals Central Alabama; SEARP&DC for their counties)
- Online: Start at https://alabamaageline.gov/scsep/ or provider sites like https://tarcog.us/serving-people/other-services/senior-employment-program/

**Timeline:** Not specified in sources
**Waitlist:** Not specified; may vary by region and provider due to limited slots

**Watch out for:**
- Not statewide uniform—must confirm county is served by a specific provider; living outside service area disqualifies
- Cumulative 48-month lifetime limit across all SCSEP providers nationwide
- Must remain unemployed and actively seek unsubsidized work; no unemployment insurance benefits upon exit
- Annual income recertification required by June 30
- Priority tiers (veterans first) may create waitlists for others
- No asset test, but income is strictly household-based at 125% FPL—excludes most other benefits from counting against eligibility

**Data shape:** Administered by multiple regional providers with county-specific service areas; no asset limits or fixed dollar benefits—income eligibility scales by household size via annual federal poverty guidelines; lifetime enrollment cap of 48 months

**Source:** https://alabamaageline.gov/scsep/

---

### Alabama Legal Services Corporation (Legal Aid for Seniors)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Elder grants are not income-based; general LSA services require household income at or below 125% of the 2024 Federal Poverty Guidelines (exact dollar amounts vary annually by household size and are set by U.S. Dept. of Health & Human Services; no specific table provided in sources—call for current figures)
- Assets: Personal assets may affect eligibility for some services, but no specific limits or exemptions detailed for elder program
- Low-income priority for general services (elder grants waive this)
- Civil legal issues only
- Alabama resident

**Benefits:** Free legal advice, counseling, representation, document preparation, negotiation, research, education, and outreach on issues including elder abuse, guardianship, housing, Medicaid/Medicare, powers of attorney, wills, Social Security, debt collection, consumer issues, income maintenance, advanced directives, health/long-term care access; non-fee-generating; no specific dollar amounts or hours stated
- Varies by: priority_tier

**How to apply:**
- Phone: 1-866-456-3959 (Elder Helpline, Mon-Fri 8:30am-4:30pm); 1-866-785-1798 (Español)
- Online: https://legalservicesalabama.org/apply-for-services/
- Local Area Agency on Aging (AAA)/ADRC: 1-800-AGE-LINE (1-800-243-5463)

**Timeline:** Not specified
**Waitlist:** Limited staff resources may result in case rejection or referral; no formal waitlist details

**Watch out for:**
- Elder grants are not income-based but still subject to limited resources—cases may be rejected or referred
- Not all civil cases accepted due to staff limits
- General LSA services have 125% FPG income cap (elder grants waive)
- Must specify elder legal issue during intake
- No criminal cases; focus on civil matters

**Data shape:** Elder grants waive income test (unique non-income-based access for 60+); statewide but with county-specific volunteer programs and referrals; priority for seniors among low-income

**Source:** https://legalservicesalabama.org/elder-law/

---

### Alabama Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: None
- Assets: None
- Must be a resident of a long-term care facility such as nursing home, assisted living facility, specialty care facility, or boarding home (personal care home). Services also available to family, friends, or facility employees on behalf of residents.

**Benefits:** Investigate and resolve complaints about poor patient care, quality of care, facility issues; provide direct client advocacy; conduct routine/quarterly visitations to facilities; mediate between residents/families and staff; protect residents' rights (e.g., dignity, freedom from restraints, grievance voicing, privacy); educate on rights, facility selection, eligibility criteria; identify additional resources; advocate for systemic changes.

**How to apply:**
- Phone: 334-242-5753
- In-person: Alabama Office of the State Long-Term Care Ombudsman Program
- Written: Mail complaints to the office
- Statewide helpline: 1-800-AGE-LINE (1-800-243-5463) for regional Area Agency on Aging support

**Timeline:** Not specified

**Watch out for:**
- Not a service providing direct care, financial aid, or placement—purely advocacy and complaint resolution; no financial eligibility barriers but limited to long-term care facility residents (not home-based care); confidential but may require facility access for investigation; volunteers essential but must be trained/certified; people miss that anyone (not just residents) can file complaints on behalf of others.

**Data shape:** no income/asset/age test; advocacy-only (no direct services or reimbursement); operates via statewide office + regional Area Agencies on Aging; complaint-driven rather than application for benefits

**Source:** https://alabamaageline.gov/ombudsman/

---

### Alabama Cares

> **NEW** — not currently in our data

**Eligibility:**
- Income: No strict income limits; services are not denied based on income. Priority given to those with greatest social and economic needs, particularly low-income and minority individuals.[1][2][5]
- Assets: No asset limits mentioned in program guidelines.[1][2][5]
- Primary unpaid family caregivers of frail older adults age 60+ who need help with at least 3 activities of daily living (e.g., bathing, dressing, walking, toileting, medications, cooking, chores), or any age with Alzheimer's/dementia.[1][2][3][5]
- Grandparents/relative caregivers age 55+ (not parents) caring for children 18 and under, or any age with severe disability; must live with child, have legal relationship/custody, and provide 20+ hours/week care.[1][2][3][5]
- Older relative caregivers/parents age 55+ caring for adults 19-59 with disabilities.[2][5]
- Priority: older caregivers (60+), rural areas, critical health needs, Alzheimer's, multiple care recipients, greatest social/economic need.[1][2][3][5]

**Benefits:** Support services including training, information/advice, personal care, adult day care, limited homemaker services; enhances family caregiving but does not replace it or provide direct payment to caregivers.[4][5]
- Varies by: priority_tier

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA) and Aging & Disability Resource Center (ADRC) at 1-800-AGE-LINE (1-800-243-5463).[3][5]
- Website: alabamaageline.gov/alabama-cares or local AAA sites (e.g., www.nacolg.org/alabama-cares, uwaaa.org/services/alabamacares).[1][2][5]
- In-person: Local AAA/ADRC offices.[5]

**Timeline:** Not specified in sources.
**Waitlist:** Limited funds available, implying potential waitlists or prioritization without guaranteed service.[2]

**Watch out for:**
- Not a paid caregiver program; provides support services only, no direct financial payment to caregivers.[4][5]
- Must be unpaid primary caregiver; services prioritize greatest need, so higher-income may be deprioritized.[2][5]
- For relative caregivers: requires legal custody/relationship, co-residency, 20+ hours/week care, limited funds.[2][3]
- Frail elderly must need 3+ ADLs; dementia qualifies regardless of age.[2]
- Does not replace family role; limited funds may mean not all eligible get services.[5]

**Data shape:** No income/asset tests but priority-based on need; caregiver-focused (not direct to elderly); administered regionally via local AAAs with statewide guidelines; limited funds create de facto waitlist/prioritization.

**Source:** https://alabamaageline.gov/alabama-cares/

---

### Alabama Senior Farmers Market Nutrition Program (SFMNP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older at the time of application[5]+
- Income: Household income must be 185% or lower of the Federal Poverty Guidelines[5]. For 2025-2026: Single household: $2,414/month; Two-person household: $3,262/month; Three-person household: $4,109/month; Four-person household: $5,805/month[5]. Full income tables available on FMA website[5].
- Assets: Not specified in available program documentation
- Must be a resident of Alabama[1]
- Must apply online (phone and mail applications not accepted)[1][4]

**Benefits:** $50 benefit card per eligible senior[1][4]
- Varies by: fixed

**How to apply:**
- Online only at https://agi.alabama.gov/farmersmarket/[1][4]
- Phone assistance available through Area Agency on Aging of West Alabama: 1-800-AGELINE[1]
- General program information: 1-877-774-9519[4]

**Timeline:** Not specified in available documentation; benefit cards are mailed to address provided on application for new recipients[1]
**Waitlist:** Program operates on first-come, first-served basis until available funds are committed[1][4]. Applications open in January each year and close when funds run out[5]

**Watch out for:**
- Online application only — phone and mail applications are NOT accepted[1][4]
- Must reapply every year; benefits do not automatically renew[1][4]
- Keep the benefit card from previous years — new benefits are loaded onto the same card each year after application is received[1]
- Program has limited funding and operates on first-come, first-served basis; seniors should apply as soon as applications open in January[1][4][5]
- Benefits can only be used at certified farmers markets and farm stands, NOT at grocery stores[1][4]
- Redemption period is limited: May 1 through November 27 (not year-round)[4]
- Benefit card is scanned like a debit/credit card at point of purchase[4]
- Alabama's program ranks fourth nationally[2], indicating high demand and potential for quick fund depletion

**Data shape:** Benefits are fixed at $50 per senior (do not vary by household size or priority tier). Income limits scale by household size. Program is statewide but administered through regional AAAs with varying local details. Critical timing factor: applications open January annually and close when funds exhaust. No asset limits documented in available sources.

**Source:** https://agi.alabama.gov/farmersmarket/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Alabama Medicaid Elderly and Disabled Wa | benefit | state | deep |
| Alabama PACE (Program of All-Inclusive C | benefit | local | deep |
| Alabama Medicare Savings Programs (QMB,  | benefit | federal | deep |
| Alabama Elderly Simplified Application P | benefit | state | medium |
| Alabama LIHEAP (Low-Income Home Energy A | benefit | federal | deep |
| Alabama Weatherization Assistance Progra | benefit | federal | deep |
| Alabama SHIP (State Health Insurance Ass | navigator | federal | simple |
| Alabama Meals on Wheels (Elderly Nutriti | benefit | federal | medium |
| Alabama Lifespan Respite Program | benefit | state | medium |
| Alabama Senior Community Service Employm | employment | federal | deep |
| Alabama Legal Services Corporation (Lega | resource | state | simple |
| Alabama Long-Term Care Ombudsman Program | resource | federal | simple |
| Alabama Cares | benefit | state | deep |
| Alabama Senior Farmers Market Nutrition  | benefit | state | deep |

**Types:** {"benefit":10,"navigator":1,"employment":1,"resource":2}
**Scopes:** {"state":6,"local":1,"federal":7}
**Complexity:** {"deep":8,"medium":3,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/AL/drafts.json`.

- **Alabama Medicaid Elderly and Disabled Waiver** (benefit) — 4 content sections, 6 FAQs
- **Alabama PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 6 content sections, 6 FAQs
- **Alabama Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 6 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **household_size|priority_tier|fuel_type|season**: 1 programs
- **not_applicable**: 2 programs
- **Not specified — appears to be fixed reimbursement structure, but exact amounts not publicly detailed**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Alabama Medicaid Elderly and Disabled Waiver**: Administered regionally via AAAs with statewide cap; benefits person-centered by assessed needs, not fixed amounts; tied to Medicaid eligibility and NFLOC
- **Alabama PACE (Program of All-Inclusive Care for the Elderly)**: County-restricted (Mobile/Baldwin); provider-specific (Mercy LIFE); no strict income/asset test for enrollment but for Medicaid coverage; capped enrollment
- **Alabama Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income (QMB lowest, then SLMB, QI highest); QI capped funding/annual reapply; uniform statewide but district processing; scales by household size via FPL; auto-LIS linkage.
- **Alabama Elderly Simplified Application Project (AESAP)**: Streamlined SNAP process only—no unique benefits or limits; 3-year certification differentiates it; income/resources match standard SNAP elderly rules; county-administered statewide
- **Alabama LIHEAP (Low-Income Home Energy Assistance Program)**: Benefits scale by household size and vary by season (heating vs. cooling) and crisis status. Income limits scale by household size with a formula for households beyond 15 members. Application processes and opening dates vary significantly by county-level CAA, making this a decentralized program with no single statewide application portal. Priority tiers (seniors, disabled, medical vulnerabilities, energy crisis) receive earlier access to limited funds. Program operates on a fiscal year basis (October 1–September 30) with seasonal components (heating Oct–Apr, cooling May–Sep).
- **Alabama Weatherization Assistance Program**: Delivered via 10+ regional community action agencies with county-specific contacts and processes; priority-tiered waitlist; no central application portal; income at 200% FPL with auto-eligibility for SSI/AFDC.
- **Alabama SHIP (State Health Insurance Assistance Program)**: SHIP is a counseling and assistance program, not a direct-benefit program. It helps Medicare beneficiaries navigate existing programs (Medicare, Medicaid, Medicare Savings Programs, Extra Help, Medigap, etc.) rather than providing its own financial or healthcare benefits. Eligibility criteria beyond 'Medicare beneficiary or family member' are not publicly specified in available sources. The program is administered regionally through Area Agencies on Aging, which may explain why specific income/asset limits are not centralized in state-level documentation. Income limits likely vary by the specific assistance programs SHIP helps people access (e.g., Medicare Savings Programs have federal income thresholds), not by SHIP itself.
- **Alabama Meals on Wheels (Elderly Nutrition Program)**: Decentralized by county via local AAAs; no statewide income test; home delivery not universal; congregate meals more widely available than delivery
- **Alabama Lifespan Respite Program**: This program is a reimbursement-based respite voucher program, not a direct service provider. The caregiver has full control over selecting and hiring respite providers and determining compensation rates (within program guidelines). No specific income or asset limits are disclosed, making it potentially more accessible than means-tested programs. The primary eligibility barrier is the mutual exclusivity requirement — applicants cannot receive respite from any other program. Funding is limited and not guaranteed even for eligible applicants. The program is statewide but administered through UCP Huntsville. Specific dollar amounts for reimbursement are not publicly available in the documentation reviewed.
- **Alabama Senior Community Service Employment Program (SCSEP)**: Administered by multiple regional providers with county-specific service areas; no asset limits or fixed dollar benefits—income eligibility scales by household size via annual federal poverty guidelines; lifetime enrollment cap of 48 months
- **Alabama Legal Services Corporation (Legal Aid for Seniors)**: Elder grants waive income test (unique non-income-based access for 60+); statewide but with county-specific volunteer programs and referrals; priority for seniors among low-income
- **Alabama Long-Term Care Ombudsman Program**: no income/asset/age test; advocacy-only (no direct services or reimbursement); operates via statewide office + regional Area Agencies on Aging; complaint-driven rather than application for benefits
- **Alabama Cares**: No income/asset tests but priority-based on need; caregiver-focused (not direct to elderly); administered regionally via local AAAs with statewide guidelines; limited funds create de facto waitlist/prioritization.
- **Alabama Senior Farmers Market Nutrition Program (SFMNP)**: Benefits are fixed at $50 per senior (do not vary by household size or priority tier). Income limits scale by household size. Program is statewide but administered through regional AAAs with varying local details. Critical timing factor: applications open January annually and close when funds exhaust. No asset limits documented in available sources.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Alabama?
