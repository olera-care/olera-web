# Kansas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 1.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 10 |
| New (not in our data) | 5 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 6 programs
- **in_kind**: 2 programs
- **financial**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Food Assistance Program (SNAP)

- **income_limit**: Ours says `$1922` → Source says `$35` ([source](https://www.dcf.ks.gov/services/ees/pages/food/foodassistance.aspx))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (groceries, no hot foods/alcohol/tobacco). Amount based on net income, household size, deductions: e.g., max allotment for 2-person elderly household ~$546 minus 30% net income. Varies; use KS DCF calculator for exact[2][3].` ([source](https://www.dcf.ks.gov/services/ees/pages/food/foodassistance.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dcf.ks.gov/services/ees/pages/food/foodassistance.aspx`

### Low-Income Energy Assistance Program (LIEAP)

- **income_limit**: Ours says `$3091` → Source says `$1,956` ([source](https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Specific dollar amounts not disclosed in available documentation; benefit amounts determined by household income, number of persons at address, type of dwelling, type of heating fuel, and utility rates[6]` ([source](https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx`

### Senior Health Insurance Counseling for Kansas (SHICK)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, confidential, one-on-one counseling on Medicare (Parts A-D), Medicare Supplement (Medigap), Medicare Advantage, prescription drug coverage (Part D), Extra Help, long-term care insurance, claims/appeals, supplemental rate comparisons, employer group plans, Medicaid, employment/disability Medicare info; public education presentations; available Monday-Friday, typically 8:30am-3pm or 8am-5pm depending on location[1][2][3][4][5][7][8]` ([source](https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick))
- **source_url**: Ours says `MISSING` → Source says `https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick`

### Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Support services including respite care (e.g., K-RAD subsidizes up to $1,000/year per care recipient for respite, paid to providers); in-home respite by paid workers/volunteers; referrals to personal care, homemaker services, adult day care via KanCare Medicaid; education, resources, and support[3][8][9]. No fixed hours or statewide payment to caregivers specified; varies by Medicaid waiver.` ([source](https://www.kdads.ks.gov/services-programs/aging/caregivers))
- **source_url**: Ours says `MISSING` → Source says `https://www.kdads.ks.gov/services-programs/aging/caregivers`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Independent advocacy including identifying, investigating, and resolving complaints; providing information on long-term care services and resident rights; representing residents before agencies for administrative, legal, or other remedies; regular presence in facilities to observe care and ensure access; addressing issues like improper discharges, medication errors, abuse, staffing, food service, daily care, privacy, and dignity.` ([source](https://www.ombudsman.ks.gov))
- **source_url**: Ours says `MISSING` → Source says `https://www.ombudsman.ks.gov`

## New Programs (Not in Our Data)

- **KanCare Medicaid** — service ([source](https://www.kancare.ks.gov/))
  - Shape notes: Multiple tiers (ABD basic, Nursing Home, HCBS waivers) with NFLOC for LTC; strict $2,000 single asset cap; no full income table by household size in sources; waiver slots limited causing waitlists; spousal/community protections vary marital status
- **KanCare Frail Elderly Waiver (FE Waiver)** — service ([source](https://khap.kdhe.ks.gov/KEESM/Oct_2020_Output/keesm8210.htm (KDHE policy) or https://portal.kmap-state-ks.us/Documents/Provider/Provider%20Manuals/HCBS_FE_24281_24277.pdf (HCBS FE Provider Manual)))
  - Shape notes: No fixed income limit but patient liability of $2,982/month (2026); NFLOC via FAI assessment; statewide with waitlist due to slot limits; home equity exemption with $752,000 cap
- **KanCare PACE** — service ([source](https://portal.kmap-state-ks.us/Documents/Provider/Provider%20Manuals/Pace_08032017_17163.pdf))
  - Shape notes: Limited to specific counties with multiple providers; no income/asset test unique to PACE (unlike standard Medicaid); requires state NFLOC certification; benefits identical across providers but access varies by region.
- **Kansas Weatherization Assistance Program (K-WAP)** — in_kind ([source](https://content.dcf.ks.gov/ees/keesm/current/keesm13500.htm (Kansas Department of Children and Family Services)))
  - Shape notes: This program's structure is complex due to multiple funding sources (DOE, LIEAP, Evergy utility partnership) with different income thresholds. Benefits are entirely in-kind (no cash payments). Priority tier system means elderly/disabled households get expedited service when waitlists exist. Geographic variation is significant — program is statewide but administered through regional providers with different service areas. Automatic income qualification for SSI/TANF/LIEAP recipients is a major pathway that bypasses standard income verification. No asset test simplifies eligibility for elderly on fixed incomes.
- **Legal Services for Seniors** — service ([source](https://www.kansaslegalservices.org/page/57/programs-seniors))
  - Shape notes: No income/asset test; priority-based for at-risk seniors; delivered statewide via hotline and local projects with Area Agencies on Aging; pro bono volunteer-driven.

## Program Details

### KanCare Medicaid

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Varies by program and marital status. For Aged, Blind, and Disabled (ABD) Medicaid, single applicants must meet income limits (exact FPL percentages not specified in sources, but generally low-income thresholds apply). For Nursing Home Medicaid, nearly all income goes toward care costs; single applicants have income up to 300% of SSI Federal Benefit Rate (~$2,901/month in 2026). Parents/caretakers up to 38% FPL. No full household size table available; children up to 255% FPL. Spousal impoverishment rules protect community spouse income/asset allowances.
- Assets: For single applicants (ABD, Nursing Home, HCBS): $2,000 countable assets. Countable: cash, bank accounts, stocks, bonds, secondary vehicles/property. Exempt: primary home (if intent to return or equity under ~$713,000 federal cap), one vehicle, personal belongings, burial plots/funds (up to $1,500), life insurance (face value ≤$1,500). Home exempt for nursing home if spouse/child lives there. 5-year look-back for asset transfers with penalties.
- Kansas resident and U.S. citizen/qualified immigrant (some 5-year wait).
- Nursing Facility Level of Care (NFLOC) for long-term care: assessed via Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (IADLs: cleaning, cooking, shopping, meds).
- Blind or disabled (per SSA rules) or aged 65+.
- No other health insurance first (must use it before KanCare).

**Benefits:** Comprehensive healthcare including doctor visits, hospital, prescriptions, dental/vision. Long-term care: Nursing home coverage, Home and Community-Based Services (HCBS) waivers (personal care, adult day care, home modifications, respite), Community Residential Care Facilities. Medicare dual eligibles get Part D help, services Medicare doesn't cover. No fixed dollar/hour amounts specified; income >$62/month contributes to care costs.
- Varies by: priority_tier

**How to apply:**
- Online: https://www.kancare.ks.gov/apply-now
- Phone: 1-800-792-4884 (KDHE KanCare helpline)
- Mail: Kansas Department of Health and Environment, Division of Health Care Finance, PO Box 3599, Topeka, KS 66601
- In-person: Local KDHE or KDADS offices or via managed care organizations (Healthy Blue Kansas, etc.)

**Timeline:** 45-90 days typical; varies by program/complexity
**Waitlist:** Possible for HCBS waivers due to limited slots; nursing home coverage generally available if eligible

**Watch out for:**
- Kansas did not expand Medicaid; no coverage for low-income childless adults.
- 5-year look-back penalizes asset gifts/transfers for long-term care.
- NFLOC required for LTC; basic ABD Medicaid doesn't need it but LTC assessment does.
- Spousal rules complex: community spouse asset allowance ~$154,140 (2026), income disregard.
- Medically Needy/Spenddown: pay medical bills to 'spend down' excess income.
- Home equity limit applies if no intent to return.
- Must report other insurance first.

**Data shape:** Multiple tiers (ABD basic, Nursing Home, HCBS waivers) with NFLOC for LTC; strict $2,000 single asset cap; no full income table by household size in sources; waiver slots limited causing waitlists; spousal/community protections vary marital status

**Source:** https://www.kancare.ks.gov/

---

### KanCare Frail Elderly Waiver (FE Waiver)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No set income limit for the waiver, but beneficiaries keep $2,982 per month of their income (2026 amount). Income eligibility determined through underlying KanCare Medicaid categories such as SSI, 300% SSI, TANF, or Medically Needy.[1][2][6]
- Assets: Standard Kansas Medicaid asset limit applies (specific dollar amount not stated in sources; use KanCare Spend Down Calculator for estimates). Countable assets exclude primary home (if equity ≤ $752,000 in 2026, applicant lives there or intends to return, spouse/minor/disabled child resides there), household furnishings, appliances, personal effects, and one vehicle. 60-month Look-Back Rule penalizes asset transfers below fair market value.[1]
- Kansas resident
- Eligible for KanCare (Kansas Medicaid)
- Nursing Facility Level of Care (NFLOC) determined via Functional Assessment Instrument (FAI), evaluating Activities of Daily Living (ADLs: toileting, bathing, dressing, transferring, mobility, eating) and Instrumental ADLs (IADLs: cleaning, cooking, shopping, paying bills), plus cognitive/behavioral issues.[1][2][3]

**Benefits:** Home and Community-Based Services (HCBS) as alternative to nursing home care, including variety of services authorized via Plan of Care (POC) process to meet individual needs. Specific services not exhaustively listed but designed for frail elderly 65+ to avoid institutionalization; does not cover room/board or living expenses.[4][5]
- Varies by: individual_needs

**How to apply:**
- Contact Kansas Department for Aging and Disability Services (KDADS) or local waiver program manager for preliminary functional eligibility application (specific phone/website not in results; enroll via fiscal agent for providers).[3][4]
- Apply for underlying KanCare Medicaid first

**Timeline:** Not specified in sources
**Waitlist:** Waitlist (proposed recipient list) maintained when no openings exist; limited slots.[3]

**Watch out for:**
- Must first qualify for KanCare Medicaid; waiver denial if not financially eligible upfront.[2]
- 60-month Look-Back Rule on asset transfers leads to penalty periods.[1]
- Limited slots create waitlists; not guaranteed immediate access.[3]
- Services require prior authorization via POC; no coverage for room/board.[4][5]
- Home equity limit $752,000 (2026); intent to return must be documented.[1]

**Data shape:** No fixed income limit but patient liability of $2,982/month (2026); NFLOC via FAI assessment; statewide with waitlist due to slot limits; home equity exemption with $752,000 cap

**Source:** https://khap.kdhe.ks.gov/KEESM/Oct_2020_Output/keesm8210.htm (KDHE policy) or https://portal.kmap-state-ks.us/Documents/Provider/Provider%20Manuals/HCBS_FE_24281_24277.pdf (HCBS FE Provider Manual)

---

### KanCare PACE

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits or financial criteria for PACE enrollment; eligibility is not based on income or assets. Participants pay a premium if they do not qualify for Medicaid or Medicare (private pay option exists). Approximately 90% are dual eligible for Medicare and Medicaid. Informal guidance suggests if income is less than $3,000 per month, may qualify at no cost via Medicaid[2][7].
- Assets: No asset limits or financial criteria considered for PACE enrollment[2].
- Live in the service area of a PACE organization[2][3].
- Certified by Kansas Department for Aging and Disability Services (KDADS) as needing nursing home level of care under Kansas Medicaid plan[2][3][4].
- Able to live safely in the community (non-institutional setting) at time of enrollment without jeopardizing health or safety[2][3].
- Kansas resident[1].
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice[2].

**Benefits:** Comprehensive care coordination covering all Medicare and Medicaid services plus additional supports: multidisciplinary assessment and treatment planning; primary care (physician, nursing); social work; restorative therapies (physical, occupational, speech-language pathology); personal care and supportive services; nutritional counseling; recreational therapy; transportation; meals; medical specialty services; hospital visits; behavioral health; dental and vision care; pharmacy; medical supplies; day center care (meals, social activities, exercise, health checkups); home support; nursing facility care when required[3][5][8]. Provided as needed per individualized plan, no fixed dollar amounts or hours specified.
- Varies by: region

**How to apply:**
- Contact PACE providers directly (e.g., Midland Care PACE: 1-800-726-7450, TTY 1-866-735-2957)[8].
- Contact KDADS for level of care determination: 785-296-4986, 1-800-432-3535, or kdads.hcbs-ks@ks.gov[3].
- No specific online URL, form name, mail, or in-person details in sources; start with provider or KDADS for guidance.

**Timeline:** Not specified in sources.
**Waitlist:** Not specified in sources; may vary by provider and region.

**Watch out for:**
- Must live in specific PACE service area counties; not statewide[3][6].
- Requires KDADS certification for nursing facility level of care, even if not on Medicaid[3][4].
- Cannot be enrolled in Medicare Advantage, certain Medicare plans, or hospice[2].
- No financial eligibility test, but private pay premium if not dual eligible[2].
- Must be able to live safely in community at enrollment; not for those already in nursing homes[2][3].
- Documents from 2017; check providers for current details as program expansion may have occurred.

**Data shape:** Limited to specific counties with multiple providers; no income/asset test unique to PACE (unlike standard Medicaid); requires state NFLOC certification; benefits identical across providers but access varies by region.

**Source:** https://portal.kmap-state-ks.us/Documents/Provider/Provider%20Manuals/Pace_08032017_17163.pdf

---

### Food Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60 or older (elderly) or disabled in Kansas (Oct 1, 2025 - Sept 30, 2026): No gross income limit. Must meet net income limit (gross income minus deductions like medical expenses over $35/month for elderly/disabled, shelter costs, utilities). Gross income limits apply only if no elderly/disabled: 1 person $1695/month, 2 $2291, 3 $2887, 4 $3482, 5 $4079, 6 $4674, 7 $5270, +$595 each additional (130% FPL). Seniors (60+) only need to pass net income test[1][2][3].
- Assets: Kansas follows federal rules; most households have asset test, but households with elderly (60+) or disabled may be exempt depending on state policy (not explicitly waived in KS per sources). Countable assets include cash, bank accounts, stocks; exempt: home, retirement savings, life insurance cash value (if not income-producing), household goods, income-producing property (varies). Some states waive if income below FPL; check with DCF for KS specifics[1][2][4].
- U.S. citizen or qualified non-citizen
- Live in Kansas
- Household includes those who buy/prepare food together
- No work requirements for seniors 60+ or disabled (exempt from ABAWD rules)[2][4][5]
- Medical/shelter deductions for elderly/disabled[2][6]

**Benefits:** Monthly EBT card for food purchases (groceries, no hot foods/alcohol/tobacco). Amount based on net income, household size, deductions: e.g., max allotment for 2-person elderly household ~$546 minus 30% net income. Varies; use KS DCF calculator for exact[2][3].
- Varies by: household_size

**How to apply:**
- Online: https://www.kansasbenefits.gov/ (KS DCF portal)
- Phone: 1-888-369-4777 (KS DCF Food Assistance hotline)
- Mail: Local DCF office (find via dcf.ks.gov)
- In-person: Local DCF Economic and Employment Services office or home visit/telephone interview for elderly/disabled[6][7]

**Timeline:** Typically 30 days; expedited if very low income (7 days)[7]

**Watch out for:**
- Kansas does not use broad-based categorical eligibility (BBCE), so stricter income tests than some states[5]
- Many eligible seniors miss out; only ~half apply/enroll[1]
- Include all household members who buy/prepare food together, even non-eligible[1]
- Social Security/pensions count as income; medical costs over $35 deductible for net income[1][2][6]
- Assets may still apply unless exempt; recent 2025 law changes to work/non-citizen rules (check updates)[3][4]
- Authorized rep can apply for elderly/disabled[6]

**Data shape:** No gross income limit for households with elderly 60+ or disabled; net income only with big deductions for medical/shelter; benefits scale by household size and net income; statewide via DCF with local offices

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dcf.ks.gov/services/ees/pages/food/foodassistance.aspx

---

### Low-Income Energy Assistance Program (LIEAP)


**Eligibility:**
- Income: Combined gross monthly income (before deductions) of all household members must not exceed 150% of the federal poverty level. 2026 guidelines: 1 person: $1,956; 2 people: $2,644; 3 people: $3,331; 4 people: $4,019; 5 people: $4,706; 6 people: $5,394; 7 people: $6,081; 8 people: $6,769; add $688 for each additional person[4].
- Assets: Not specified in available documentation; eligibility based on income, household size, available resources, and responsibility for payment of home energy costs[4].
- Must be living in a Kansas county[1]
- Must be legally capable of acting on their own behalf; legally incapacitated persons ineligible unless assistance applied for by guardian or conservator[1]
- An adult household member must be personally responsible for paying heating costs at current residence, payable to landlord, utility company, or fuel supplier[2][3]
- Household must contain at least one U.S. Citizen or 'qualified alien'; applicants receiving Food Assistance, cash, or medical assistance categorically meet alienage requirement; all other immigrant applicants must provide INS proof of lawful permanent residency[1]
- No household may receive LIEAP from State of Kansas and from Kansas tribal LIHEAP program during same benefit year; tribal members referred to their tribe (United Tribes of Kansas and Southeast Nebraska, Kickapoo Tribe of Kansas)[1]
- No person or household may receive regular LIEAP benefit more than once in a program year[1]
- College students living in dorm rooms are ineligible; students must live at home full-time to be counted as household members[1]
- All persons normally residing in household must be included in application; income of all household members living together used to determine eligibility[1]

**Benefits:** Specific dollar amounts not disclosed in available documentation; benefit amounts determined by household income, number of persons at address, type of dwelling, type of heating fuel, and utility rates[6]
- Varies by: household_size, heating fuel type, dwelling type, utility rates, and household income[6]

**How to apply:**
- Online through DCF Self-Service Portal at www.dcf.ks.gov (click 'Apply for Services')[2][3]
- Paper application from local DCF Service Center[2]
- In-person at Evergy's Wichita Connect walk-in center (for Evergy customers)[3]
- In-person at Kansas LIEAP application events (full list on DCF website)[3]
- Through local helping agencies and utilities[5]

**Timeline:** Not specified in available documentation
**Waitlist:** Not mentioned in available documentation

**Watch out for:**
- Application period is limited: 2026 period was January 20 – March 31[4]; application deadline is typically last business day of March, but varies by year[5]
- LIEAP assistance is subject to available federal funding; not guaranteed[4]
- No household may receive LIEAP more than once per program year[1]
- Tribal members cannot receive both state LIEAP and tribal LIHEAP in same benefit year[1]
- College students living in dorms are completely ineligible; students visiting home during breaks cannot be counted as household members[1]
- All household members' income is counted, not just applicant's income; this differs from TANF and Food Assistance programs[5]
- Applicant must be personally responsible for heating costs — if heating included in subsidized rent, household may not meet vulnerability requirements[5]
- LIEAP eligibility differs from TANF and Food Assistance eligibility; household may qualify for one but not the other[5]
- Legally incapacitated persons cannot apply on their own behalf[1]
- Must provide signatures of all adults in residence[2]

**Data shape:** LIEAP is a federally funded program with annual application periods (typically January 20 – March 31). Benefits vary by household size, heating fuel type, dwelling type, and utility rates, but specific benefit amounts are not disclosed in public documentation. Eligibility is income-based (150% federal poverty level) with household size adjustments. The program counts all household members' income, which differs from other assistance programs. Tribal members are served separately through tribal LIHEAP programs. Processing time and waitlist information not publicly available. Application must include all household members and their income documentation[4][5][6].

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dcf.ks.gov/services/ees/Pages/EnergyAssistance.aspx

---

### Kansas Weatherization Assistance Program (K-WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"description":"Income limits vary by funding source. For Department of Energy funded weatherizations: 150% of federal poverty level OR 60% of state median income, whichever is greater. For LIEAP-funded weatherizations: same as LIEAP guidelines. Many providers use 200% of Federal Poverty Level as standard threshold.[1][4]","household_size_table_200_percent_fpl":{"1":"$25,760","2":"$34,840","3":"$43,920","4":"$53,000","5":"$62,080","6":"$71,160","7":"$80,240","8":"$89,320"},"automatic_qualification":"Households automatically qualify if any member receives: Supplemental Security Income (SSI), Temporary Assistance for Needy Families (TANF), or Low-Income Energy Assistance Program (LIEAP) utility assistance.[1][2][4]"}
- Assets: No resource test.[1]
- Must be homeowner or renter[2][4]
- If renter: must obtain written landlord permission; landlord must agree not to raise rent for at least 2 years after completion[6]
- Evergy account must be in active status (not disconnected) if applying through Evergy program[6]
- Utilities must be on in order to be eligible[3]

**Benefits:** All services and upgrades provided free of charge. Can reduce energy consumption by up to 35%.[4][6] Services may include: weatherization needs assessments/audit, caulking, insulation, storm windows, furnace/heating system modifications/repairs, furnace replacement, and cooling efficiency modifications/repairs/replacement.[1]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-752-4422 (Kansas Housing Information Line toll-free)[1]
- Phone: Contact local weatherization provider by county (varies by region)[4]
- Phone: 785-264-4814 (Kansas Housing Resources Corporation)[5]
- Online: Visit kshousingcorp.org/renters/weatherization-assistance/ or weatherization provider website[5]
- In-person: Contact local weatherization provider serving your county[4]
- Regional example - ECKAN (16-county region): 785-242-6413 or eckan.org/weatherization/[2]

**Timeline:** Applications received and work completed year-round; no specific processing timeline provided in sources.[4]
**Waitlist:** Waiting lists may develop; elderly, disabled, households with children, and emergency situations receive priority when waitlists exist.[1]

**Watch out for:**
- Income limits vary significantly by funding source (150% vs. 60% of median vs. 200% of poverty level) — the actual limit depends on which funding stream your application uses.[1][4]
- Automatic income qualification (SSI, TANF, LIEAP) bypasses income verification entirely — if elderly person receives any of these, they qualify regardless of other income.[1][2]
- For renters: landlord must agree in writing AND commit to not raising rent for 2 years post-completion — this can be a barrier if landlord refuses.[6]
- Utilities must be actively on — if service is disconnected, applicant is ineligible until reconnected.[3]
- For homeowners: landlords are required to partially pay for furnace replacements (with exemptions for low-income landlords, public housing, emergency shelters).[1]
- Program operates April to March annually, though applications accepted year-round.[1]
- Waiting lists develop during high-demand periods; elderly and disabled households get priority but may still wait.[1]
- Up to 15% of LIEAP block grant may be allocated to weatherization — this means funding is limited and varies by year.[1]
- Regional provider variation means eligibility details, processing times, and available services may differ by county — must contact local provider for specifics.[2][7]

**Data shape:** This program's structure is complex due to multiple funding sources (DOE, LIEAP, Evergy utility partnership) with different income thresholds. Benefits are entirely in-kind (no cash payments). Priority tier system means elderly/disabled households get expedited service when waitlists exist. Geographic variation is significant — program is statewide but administered through regional providers with different service areas. Automatic income qualification for SSI/TANF/LIEAP recipients is a major pathway that bypasses standard income verification. No asset test simplifies eligibility for elderly on fixed incomes.

**Source:** https://content.dcf.ks.gov/ees/keesm/current/keesm13500.htm (Kansas Department of Children and Family Services)

---

### Senior Health Insurance Counseling for Kansas (SHICK)


**Eligibility:**
- Income: No income limits; available to anyone with Medicare questions, including older Kansans, people with disabilities, and caregivers[1][2][4][6][8]
- Assets: No asset limits or tests apply[2][8]
- Open to individuals with Medicare, those preparing to enroll, people with disabilities, caregivers, and families; no affiliation requirement beyond having Medicare-related questions[1][2][4][6][7]

**Benefits:** Free, confidential, one-on-one counseling on Medicare (Parts A-D), Medicare Supplement (Medigap), Medicare Advantage, prescription drug coverage (Part D), Extra Help, long-term care insurance, claims/appeals, supplemental rate comparisons, employer group plans, Medicaid, employment/disability Medicare info; public education presentations; available Monday-Friday, typically 8:30am-3pm or 8am-5pm depending on location[1][2][3][4][5][7][8]

**How to apply:**
- Phone: 1-800-860-5260 (statewide toll-free)[2][3][8][9]
- Regional/local contacts (e.g., Sedgwick: 316-660-0126[1], Johnson County: 913-715-8856[5], North Central: 1-800-432-2703[6])
- Website: https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick[2][3]
- In-person: Through local Area Agencies on Aging or SHICK partners statewide (e.g., Wichita, Kansas City)[1][5][6][8]
- Email: christina.orton2@ks.gov[3]

**Timeline:** Counseling appointments scheduled by phone; no formal processing as it's direct service, but busy during Open Enrollment (mid-Oct to early Dec)[6]

**Watch out for:**
- Counselors are volunteers, not insurance agents, and unaffiliated with industry—cannot sell plans[1][2][8]
- Peak demand during Medicare Open Enrollment (Oct-Dec) may limit immediate appointments[6]
- Not a healthcare provider or financial aid program—only counseling and education[2][7]
- Must schedule appointments; no walk-ins specified[1][4][5]

**Data shape:** no income/asset test; volunteer-delivered statewide counseling service via local Area Agencies on Aging; part of federal SHIP network

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.kdads.ks.gov/services-programs/aging/medicare-programs/senior-health-insurance-counseling-for-kansas-shick

---

### Family Caregiver Support Program


**Eligibility:**
- Income: No specific income limits or tables identified for a statewide Family Caregiver Support Program in Kansas; eligibility typically tied to care recipient meeting nursing facility level of care under Medicaid waivers like Home and Community Based Services for the Frail Elderly (age 65+), with financial eligibility determined by KanCare Medicaid rules, which vary by program and are not detailed here[2][5][6].
- Assets: No specific asset limits detailed; Medicaid programs assess countable assets excluding primary home, one vehicle, and certain exemptions, but exact rules program-specific and not enumerated[6].
- Caregiver must be 18+ years old[2][3].
- Care recipient often requires nursing facility level of care (e.g., frail elderly 65+, physical disabilities 16-64, or I/DD)[2].
- Family member or informal caregiver providing regular care to individual with health problem, disability, or Alzheimer's/dementia[3][9].
- For certain programs like K-RAD, care recipient has probable Alzheimer's or dementia diagnosis[3].

**Benefits:** Support services including respite care (e.g., K-RAD subsidizes up to $1,000/year per care recipient for respite, paid to providers); in-home respite by paid workers/volunteers; referrals to personal care, homemaker services, adult day care via KanCare Medicaid; education, resources, and support[3][8][9]. No fixed hours or statewide payment to caregivers specified; varies by Medicaid waiver.
- Varies by: region

**How to apply:**
- Call Kansas Aging and Disability Resource Center at 855-200-ADRC (2372) for information, referrals, and local resources[8][9].
- Contact local Area Agency on Aging, e.g., East Central Kansas Area Agency on Aging at 785-242-7200 for K-RAD[3].
- Visit Kansas Department for Aging and Disability Services (KDADS) websites for referrals[8][9].
- KanCare Medicaid enrollment via state Medicaid office for waiver programs[5][6].

**Timeline:** Not specified; K-RAD funds awarded first-come, first-served with limited funding[3].
**Waitlist:** Possible due to limited funding (e.g., K-RAD no awards guaranteed); regional variation likely[3].

**Watch out for:**
- Not a single uniform program; support delivered via network of AAAs, Medicaid waivers (e.g., Frail Elderly), and targeted initiatives like K-RAD—must contact local AAA for specifics[3][8][9].
- No guaranteed statewide payment to family caregivers; relies on Medicaid eligibility and consumer-directed options which require care recipient qualification[5][6][7].
- Funding limited (e.g., K-RAD $1,000 cap, first-come basis); may involve background checks/trainings for paid roles[2][3].
- Often confused with VA programs; Kansas-specific is non-VA[1][9].

**Data shape:** Decentralized via 11 Area Agencies on Aging with county variations; no fixed income/asset tables or statewide caregiver payment; tied to Medicaid waivers requiring nursing facility level of care; respite-focused with caps like K-RAD.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.kdads.ks.gov/services-programs/aging/caregivers

---

### Legal Services for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; open to all seniors age 60+ regardless of income.[2][3]
- Assets: No asset limits mentioned.
- Kansas resident age 60 or older.
- Civil legal issues only, with priority for at-risk elderly in greatest social/economic need (e.g., cash/medical assistance, elder abuse).

**Benefits:** Legal counseling and referral at no cost; legal representation for certain court appearances, administrative negotiation, and drafting of legal documents; advice on civil legal issues; referrals to local Senior Citizens Law Project attorneys or private attorneys; public education on elders' rights.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Phone: Elder Law Hotline toll-free 1-888-353-5337 (8:30 a.m.-5:00 p.m. Mon-Fri) or (785) 336-6016 (Northeast Kansas); Kansas Legal Services 316-267-3975 or toll-free 800-723-6953 (8:00 a.m.-4:30 p.m. Mon-Fri).[1][3][8]
- Online: Kansas Legal Services online application at their Get Help page.[8]
- In-person: Staff attorney visits to communities or at-home visits can be arranged; local Kansas Legal Services offices statewide.[1][3]

**Timeline:** Attorney reviews information and contacts as soon as possible; no specific timeline stated.[1]
**Waitlist:** Not mentioned.

**Watch out for:**
- No income eligibility required for hotline, but full representation prioritizes at-risk/low-income seniors.[2][3]
- Not all cases accepted; may be referred to private pro bono attorneys if conflicts or barriers exist.[2]
- Civil issues only; focuses on elder abuse, benefits access, rights—not criminal matters.
- Volunteers handle hotline; expect varying attorney availability.[2]

**Data shape:** No income/asset test; priority-based for at-risk seniors; delivered statewide via hotline and local projects with Area Agencies on Aging; pro bono volunteer-driven.

**Source:** https://www.kansaslegalservices.org/page/57/programs-seniors

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of a long-term care facility in Kansas (nursing homes, assisted living facilities, board and care homes, home plus facilities, adult day care centers, residential healthcare facilities). Services can be requested by or on behalf of the resident with resident consent for investigations.

**Benefits:** Independent advocacy including identifying, investigating, and resolving complaints; providing information on long-term care services and resident rights; representing residents before agencies for administrative, legal, or other remedies; regular presence in facilities to observe care and ensure access; addressing issues like improper discharges, medication errors, abuse, staffing, food service, daily care, privacy, and dignity.

**How to apply:**
- Phone: Toll-free 1-877-662-8362 or local (785) 296-3017
- Email: LTCO@ks.gov
- Website: https://www.ombudsman.ks.gov (find regional ombudsman, submit complaint online, or contact for assistance)
- In-person: Contact regional ombudsman office via https://www.ombudsman.ks.gov/find-your-ombudsman

**Timeline:** Not specified; ombudsmen respond to complaints as needed, with regular facility visits.

**Watch out for:**
- Not a financial or direct service program—provides advocacy only, not healthcare, housing, or payments. Requires resident consent for actions. Distinct from KanCare Ombudsman (for Medicaid issues). Volunteers need training and screening, but residents do not apply to 'qualify'—anyone can contact for help. Not for community-dwelling elderly outside facilities.

**Data shape:** no income test; advocacy-only for facility residents; regional delivery model; open to all without eligibility barriers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ombudsman.ks.gov

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| KanCare Medicaid | benefit | state | deep |
| KanCare Frail Elderly Waiver (FE Waiver) | benefit | state | deep |
| KanCare PACE | benefit | local | deep |
| Food Assistance Program (SNAP) | benefit | federal | deep |
| Low-Income Energy Assistance Program (LI | benefit | state | deep |
| Kansas Weatherization Assistance Program | benefit | federal | deep |
| Senior Health Insurance Counseling for K | resource | state | simple |
| Family Caregiver Support Program | benefit | state | deep |
| Legal Services for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":7,"resource":3}
**Scopes:** {"state":6,"local":1,"federal":3}
**Complexity:** {"deep":7,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/KS/drafts.json`.

- **KanCare Medicaid** (benefit) — 5 content sections, 6 FAQs
- **KanCare Frail Elderly Waiver (FE Waiver)** (benefit) — 4 content sections, 6 FAQs
- **KanCare PACE** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **individual_needs**: 1 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **household_size, heating fuel type, dwelling type, utility rates, and household income[6]**: 1 programs
- **not_applicable**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **KanCare Medicaid**: Multiple tiers (ABD basic, Nursing Home, HCBS waivers) with NFLOC for LTC; strict $2,000 single asset cap; no full income table by household size in sources; waiver slots limited causing waitlists; spousal/community protections vary marital status
- **KanCare Frail Elderly Waiver (FE Waiver)**: No fixed income limit but patient liability of $2,982/month (2026); NFLOC via FAI assessment; statewide with waitlist due to slot limits; home equity exemption with $752,000 cap
- **KanCare PACE**: Limited to specific counties with multiple providers; no income/asset test unique to PACE (unlike standard Medicaid); requires state NFLOC certification; benefits identical across providers but access varies by region.
- **Food Assistance Program (SNAP)**: No gross income limit for households with elderly 60+ or disabled; net income only with big deductions for medical/shelter; benefits scale by household size and net income; statewide via DCF with local offices
- **Low-Income Energy Assistance Program (LIEAP)**: LIEAP is a federally funded program with annual application periods (typically January 20 – March 31). Benefits vary by household size, heating fuel type, dwelling type, and utility rates, but specific benefit amounts are not disclosed in public documentation. Eligibility is income-based (150% federal poverty level) with household size adjustments. The program counts all household members' income, which differs from other assistance programs. Tribal members are served separately through tribal LIHEAP programs. Processing time and waitlist information not publicly available. Application must include all household members and their income documentation[4][5][6].
- **Kansas Weatherization Assistance Program (K-WAP)**: This program's structure is complex due to multiple funding sources (DOE, LIEAP, Evergy utility partnership) with different income thresholds. Benefits are entirely in-kind (no cash payments). Priority tier system means elderly/disabled households get expedited service when waitlists exist. Geographic variation is significant — program is statewide but administered through regional providers with different service areas. Automatic income qualification for SSI/TANF/LIEAP recipients is a major pathway that bypasses standard income verification. No asset test simplifies eligibility for elderly on fixed incomes.
- **Senior Health Insurance Counseling for Kansas (SHICK)**: no income/asset test; volunteer-delivered statewide counseling service via local Area Agencies on Aging; part of federal SHIP network
- **Family Caregiver Support Program**: Decentralized via 11 Area Agencies on Aging with county variations; no fixed income/asset tables or statewide caregiver payment; tied to Medicaid waivers requiring nursing facility level of care; respite-focused with caps like K-RAD.
- **Legal Services for Seniors**: No income/asset test; priority-based for at-risk seniors; delivered statewide via hotline and local projects with Area Agencies on Aging; pro bono volunteer-driven.
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only for facility residents; regional delivery model; open to all without eligibility barriers

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Kansas?
