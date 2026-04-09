# Utah Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 13 |
| New (not in our data) | 10 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 8 programs
- **unknown**: 1 programs
- **financial**: 2 programs
- **in_kind**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Utah Medicaid Program

- **income_limit**: Ours says `$1255` → Source says `$45` ([source](https://medicaid.utah.gov/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Long-term care services including nursing home care, HCBS Waivers (home/community-based like personal care, adult day care, home modifications), assisted living, non-medical home supports. Institutional: Covers nursing home costs after income contribution. No specific dollar amounts/hours stated; services based on assessed needs[1][2].` ([source](https://medicaid.utah.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.utah.gov/`

### Utah Aging Waiver

- **income_limit**: Ours says `$1255` → Source says `$1,305` ([source](https://medicaid.utah.gov/ (state Medicaid site; specific waiver pages via regional aging services like saltlakecounty.gov/aging-adult-services)))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Core: Case Management. Additional: Homemaking (cleaning, laundry, shopping, meal prep, errands, medical appts), Chore Services, Companion Services, Home Modifications (limited), plus standard Medicaid benefits. Other potential (from waiver approvals): Respite/Respite Care (up to >13 days in LTC), Specialized Medical Equipment/Supplies/Assistive Technology/Environmental Adaptations (no prescription needed for some), Personal Emergency Response Systems (PERS: install/test/remove/purchase/rental/repair/response), Supplemental Meals, Non-Medical Transportation. No fixed dollar amounts or hours specified; individualized via case manager plan.[3][5]` ([source](https://medicaid.utah.gov/ (state Medicaid site; specific waiver pages via regional aging services like saltlakecounty.gov/aging-adult-services)))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.utah.gov/ (state Medicaid site; specific waiver pages via regional aging services like saltlakecounty.gov/aging-adult-services)`

### New Choices Waiver Program

- **min_age**: Ours says `290` → Source says `65 or older, or 18-64 and disabled` ([source](https://medicaid.utah.gov/ltc-2/nc/))
- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://medicaid.utah.gov/ltc-2/nc/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Expanded package of home and community-based services (HCBS) to support transition to and living in community settings (own home or other integrated settings), based on assessed needs. Specific services not exhaustively listed but include supportive services beyond standard Medicaid to meet NFLOC in community (e.g., personal care, homemaker, respite; exact mix via care plan).[6]` ([source](https://medicaid.utah.gov/ltc-2/nc/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.utah.gov/ltc-2/nc/`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE))
  - Shape notes: Only available at limited centers/service areas per state; no income/asset test for core eligibility; requires state-certified nursing home level need; enrollment caps create waitlists; replaces all other Medicare/Medicaid long-term care options
- **Medicare Savings Programs (QMB, SLMB, QI)** — unknown ([source](https://medicaid.utah.gov/medicare-cost-sharing-programs/))
  - Shape notes: This program consists of three distinct tiers based on income level (QMB at 100% FPL, SLMB at 100-120% FPL, QI at 120-135% FPL), each with different benefits and eligibility rules. The key differentiator is that QI has no guaranteed funding and may close to new applicants mid-year. Utah follows federal asset and income limits with no state-specific variations mentioned. Benefits are financial (premium and cost-sharing payments) rather than service-based. The program is administered entirely through Utah's Medicaid agency, not through Medicare directly.
- **SNAP (Food Stamps)** — financial ([source](https://jobs.utah.gov/customereducation/services/foodstamps/requirements.html))
  - Shape notes: No gross income test for households with elderly 60+ or disabled; higher asset limit ($4,250); ESAP for simplified elderly process; benefits heavily deduction-driven (medical/shelter for seniors); statewide uniform.
- **LIHEAP (HEAT in Utah)** — financial ([source](https://jobs.utah.gov/housing/scso/seal/heat.html))
  - Shape notes: Income at 150% FPL with table by household size; priority tiers by age/disability/young children; regional local providers but uniform rules; no asset test; funds time-limited annually.
- **Weatherization Assistance Program** — service ([source](https://jobs.utah.gov/housing/scso/wap/how.html))
  - Shape notes: Administered via 7 county-specific agencies with unique contacts; priority tiers for elderly/disabled/kids under 6/high energy users; dual eligibility paths (200% FPL or HEAT); 15-year re-weatherization rule.
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://insurance.utah.gov/consumers/seniors/[3]))
  - Shape notes: no income/asset test; Medicare eligibility focus; statewide with local delivery in every county; counseling-only service, not direct financial aid
- **Meals on Wheels (Utah)** — in_kind ([source](No single statewide .gov URL. Program is administered by local Area Agencies on Aging and county-level providers. National resource: https://www.mealsonwheelsamerica.org/))
  - Shape notes: Meals on Wheels in Utah is a decentralized, county-based program with no single statewide eligibility standard or application process. Benefits are fixed (one meal per day, Monday–Friday) but vary slightly by region in cost and service frequency. Eligibility is uniform in core requirements (age 60+, homebound, mobility challenges) but differs by county in residency restrictions and vehicle ownership rules. Application methods and processing times vary by provider. Waitlists are documented in some regions but not others. Income is explicitly not a factor in eligibility, distinguishing this from means-tested programs. The program is administered through local Area Agencies on Aging and county senior centers, requiring families to identify and contact their specific regional provider.
- **Utah Caregiver Support Program (UCSP)** — service ([source](https://daas.utah.gov/seniors/ (Utah Department of Aging & Adult Services)[2]))
  - Shape notes: This program has no income or asset limits, making it broadly accessible, but eligibility for most valuable services (respite, supplemental) is gated by caregiver burden assessment rather than financial need. Benefits are service-based rather than cash payments. Program operates through county-level Local Area Agencies on Aging, creating potential regional variation in availability and wait times. Priority tiers exist but are based on care recipient condition and caregiver need, not first-come-first-served. No published fee schedule or service hour limits are available in official sources.
- **Legal Aid for Seniors** — service ([source](https://www.utahlegalservices.org/ (financial guidelines); https://www.saltlakecounty.gov/aging-adult-services/support/legal-services/ (Salt Lake)[2][7]))
  - Shape notes: County-contracted with regional providers and offices; income test with exceptions; no fixed statewide processing times or central application portal; tied to low-income guidelines varying by household size
- **Long-Term Care Ombudsman** — advocacy ([source](https://daas.utah.gov/long-term-care-ombudsman/[3]))
  - Shape notes: no income test; advocacy-only for long-term care facility residents; county-assigned local Ombudsmen with varying contacts

## Program Details

### Utah Medicaid Program


**Eligibility:**
- Age: 65+
- Income: Varies by program (2025-2026 figures): Institutional/Nursing Home Medicaid: No strict limit, but most income pays toward care with $45 personal needs allowance[1][2][4]. HCBS Waivers: $2,901/month (New Choices Waiver) or $1,255-$1,305/month (Aging Waiver)[1][4][6]. Regular Medicaid (ABD): $1,255/month single or $1,704-$1,763/month married couples[1][4][6]. No household size table provided; limits are typically per individual or couple.
- Assets: Countable assets under $2,000 for single applicants; $3,000-$4,000 for married couples both applying. Community spouse (non-applicant) keeps up to $157,920 or 50% of joint assets (min $31,584)[2][4]. Exempt: Primary home (equity ≤$730,000 if intent to return), one vehicle, personal belongings/household items, burial plots/irrevocable trusts ≤$7,000, life insurance ≤$1,500 face value[1][4].
- Utah resident and U.S. citizen/qualified immigrant[1]
- Blind, disabled, or aged 65+[1][5]
- Nursing Home Level of Care (NHLOC) for Institutional/Nursing Home and most HCBS Waivers; functional ADL needs for Regular ABD (NHLOC not always required)[2]
- Medical/functional assessment for level of care[1][2]

**Benefits:** Long-term care services including nursing home care, HCBS Waivers (home/community-based like personal care, adult day care, home modifications), assisted living, non-medical home supports. Institutional: Covers nursing home costs after income contribution. No specific dollar amounts/hours stated; services based on assessed needs[1][2].
- Varies by: priority_tier

**How to apply:**
- Online: https://medicaid.utah.gov/apply/[3]
- Phone: 1-866-435-7414 or 801-526-0950 (regional)[7]
- In-person: Local offices (e.g., Utah/Wasatch/Summit Counties: 801-526-9675)[7]
- Mail: Via myCase portal or local DHHS offices[3]

**Timeline:** Not specified in sources; monthly re-eligibility required[3]
**Waitlist:** Possible for Waivers due to enrollment caps (not detailed)[1]

**Watch out for:**
- Multiple programs (Institutional, HCBS Waivers, ABD) with different income/asset rules—must match specific needs[1][2]
- Home exempt but subject to Estate Recovery after death[4]
- No immediate ineligibility if over limits—spenddown or planning options exist[2]
- ABD may not cover LTSS without separate Waiver application/assessment[6]
- Income mostly pays toward care in Institutional (only $45 kept)[1][2]

**Data shape:** Multiple tiers (Institutional, HCBS Waivers like Aging/New Choices, ABD) with varying income caps and NHLOC requirements; spousal protections; no standard household size scaling beyond couples

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.utah.gov/

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits; financial criteria are not considered for eligibility. Medicaid eligibility, if applicable for funding, follows state long-term care rules (e.g., income under 300% FBR or ~$2,901/month in 2025 for most states, but not required for PACE enrollment itself)
- Assets: No asset limits for PACE eligibility; financial criteria not considered. Medicaid-related assets may apply for funding (e.g., $2,000 limit excluding primary home in many states)
- Live in the service area of a PACE organization
- Certified by the state as needing nursing home level of care
- Able to live safely in the community with PACE services at time of enrollment
- Not enrolled in Medicare Advantage, certain Medicaid waivers, hospice, or other conflicting programs

**Benefits:** Comprehensive medical and social services including primary care, nursing, therapies, caregivers, social workers, prescription drugs, hospitalization if needed, adult day health care, home care, transportation—all Medicare/Medicaid-covered services provided exclusively through the PACE organization; personalized care plan developed post-assessment; no specific dollar amounts or hours stated, tailored to individual needs
- Varies by: region

**How to apply:**
- Contact local PACE organization for in-person assessment (no specific Utah phone/website in results)
- Use Medicare’s Find a PACE Plan tool to locate programs near you
- Phone or in-person meeting with PACE staff for health/social needs assessment

**Timeline:** Not specified; depends on location and availability
**Waitlist:** Limited spaces available; waitlists common due to capped enrollment

**Watch out for:**
- Must live in a specific PACE service area—program not statewide
- Once enrolled, PACE organization solely provides/pays for all Medicare/Medicaid-covered care; cannot use other programs like Medicare Advantage, HCBS waivers, or hospice
- Nursing home level of care required but must be able to live safely in community at enrollment
- Limited spots and waitlists common; voluntary but disenrollment possible anytime
- Utah-specific details (providers, exact service areas) require local lookup—not nationwide uniform
- No financial eligibility test for PACE itself, but funding ties to Medicare/Medicaid

**Data shape:** Only available at limited centers/service areas per state; no income/asset test for core eligibility; requires state-certified nursing home level need; enrollment caps create waitlists; replaces all other Medicare/Medicaid long-term care options

**Source:** https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"description":"Income limits are based on Federal Poverty Level (FPL) and vary by program tier. Utah uses federal standards. For 2026, limits are:","QMB":{"individual_monthly":"$1,350","married_couple_monthly":"$1,824","threshold":"At or below 100% FPL"},"SLMB":{"individual_monthly":"$1,585","married_couple_monthly":"$2,135","threshold":"Above 100% FPL but not exceeding 120% FPL"},"QI":{"individual_monthly":"$1,781","married_couple_monthly":"$2,400","threshold":"Above 120% FPL but not exceeding 135% FPL"},"note":"Income limits are announced early each year and change effective April 1st. The $20 monthly income exclusion applies (first $20 of income is not counted).[1][4][6]"}
- Assets: {"description":"Utah uses federal asset limits for all three programs[4]","individual":"$9,950","married_couple":"$14,910","what_counts":"Liquid assets, savings, stocks, bonds, and other countable resources","what_is_exempt":"Primary home, one vehicle, household items, engagement and wedding rings, burial plots, burial expenses up to $1,500, life insurance with cash value below $1,500, some Native corporation stocks held by Alaska Native people[5]"}
- Must be eligible for Medicare Part A (even if not currently enrolled)[1]
- Must be a resident of Utah[5]
- For QI program specifically: Cannot be receiving Medicaid[3]
- For SLMB and QI: Must be receiving Part A Medicare coverage[3]

**Benefits:** N/A
- Varies by: program_tier

**How to apply:**
- Contact Utah Department of Health and Human Services (DHHS) Medicaid office
- Apply through your state Medicaid agency (specific contact information not provided in search results; contact Utah DHHS directly)

**Timeline:** [object Object]
**Waitlist:** [object Object]

**Watch out for:**
- QI program has NO guaranteed funding year-to-year. Even if eligible, you may not receive benefits if the state's annual allocation is exhausted. Check with Utah Medicaid before applying to see if QI is accepting new applicants for the current year.[3]
- QI applicants cannot be receiving any Medicaid benefits; if you qualify for both QMB and QI, you must choose QMB.[3]
- SLMB and QI do not issue Medicaid cards. QMB issues a card that either reads 'MEDICARE COST-SHARING ONLY' (if not receiving Medicaid) or looks like a regular Medicaid card.[3]
- Income limits change every April 1st based on the federal poverty level announced early each year. Verify current limits before applying.[1]
- Asset limits are strict and include most liquid assets. Primary home and one vehicle are exempt, but savings accounts, stocks, and bonds count toward the limit.[5]
- Processing can take up to 45 days for QMB, but SLMB and QI may be retroactive up to 3 months, which can result in back-payment of premiums if approved.[1]
- You must be eligible for Medicare Part A to qualify for any of these programs, even if you haven't enrolled yet.[1]

**Data shape:** This program consists of three distinct tiers based on income level (QMB at 100% FPL, SLMB at 100-120% FPL, QI at 120-135% FPL), each with different benefits and eligibility rules. The key differentiator is that QI has no guaranteed funding and may close to new applicants mid-year. Utah follows federal asset and income limits with no state-specific variations mentioned. Benefits are financial (premium and cost-sharing payments) rather than service-based. The program is administered entirely through Utah's Medicaid agency, not through Medicare directly.

**Source:** https://medicaid.utah.gov/medicare-cost-sharing-programs/

---

### SNAP (Food Stamps)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (relevant for elderly), there is **no gross income limit** in Utah. Net income must meet limits (calculated as gross minus deductions like medical expenses over $35 for elderly/disabled, shelter costs, utilities); exact net limits not specified in sources but recommended to use calculator. General 2025 examples: $15,060/month for 1 person, $20,440 for 2 (varies by household size and deductions).[1][2]
- Assets: Households with member 60+ or disabled: up to **$4,250** countable resources. General households: $2,750. Countable: bank accounts, stocks, bonds, real estate (excluding home), cash value of life insurance, income-producing property. Exempt: home, retirement savings, household goods, vehicle (in some cases).[4][5]
- U.S. citizen or qualified non-citizen (e.g., 5+ years residency, disability benefits, children under 18). Undocumented ineligible.[6][7]
- Reside in Utah.
- No work requirements for elderly 60+ or disabled.[3][5][7]
- Elderly Simplified Application Process (ESAP): easier recertification for 3 years with one interview.[3]

**Benefits:** Monthly EBT card for food purchases (amount based on net income, household size, deductions like medical/shelter for elderly; exact $ varies, e.g., scales with expenses).
- Varies by: household_size

**How to apply:**
- Online: mycase.utah.gov (Utah myCase portal)
- Phone: 1-866-526-3663 (Utah Workforce Services)
- In-person: local Workforce Services offices
- Mail: forms to local office

**Timeline:** Typically 30 days; expedited for urgent cases (7 days if very low income). ESAP for elderly: one interview, 3-year approval.[3]

**Watch out for:**
- No gross income limit for 60+/disabled, but **net income** after deductions (medical, shelter) must qualify—people miss high deductions boosting eligibility.[1][5]
- All household members who buy/prepare food counted, even if ineligible (prorates benefits).[2][6]
- Assets up to $4,250 for elderly (higher than general); excludes home/retirement.[4]
- ESAP simplifies for elderly/disabled: 3-year approval, less paperwork.[3]
- Social Security/pensions count as income; medical expenses deductible.[2]
- Work rules don't apply to 60+.[5][7]

**Data shape:** No gross income test for households with elderly 60+ or disabled; higher asset limit ($4,250); ESAP for simplified elderly process; benefits heavily deduction-driven (medical/shelter for seniors); statewide uniform.

**Source:** https://jobs.utah.gov/customereducation/services/foodstamps/requirements.html

---

### LIHEAP (HEAT in Utah)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income at or below 150% of the Federal Poverty Level. Specific limits: 1 person $1,956/month; 2 people $2,644/month; 3 people $3,331/month; 4 people $4,018/month; 5 people $4,707/month; 6 people $5,394/month. For example, family of four at $3,750 or less monthly may qualify.[1][2][4]
- Assets: No asset limit applies.[1]
- Household responsible for paying home energy costs (power, heat, gas bills).[2][3][4]
- At least one adult (18+ or emancipated).[2][4]
- At least one US citizen or qualified non-citizen.[2][3][4]
- Proof of income from month prior to application; medical expenses, child support, alimony may be deductible.[2][3][4]

**Benefits:** Payments toward power, gas, and heating bills. Heating/Cooling: $190 minimum to $850 maximum. Crisis: up to $2,000 maximum. Amounts based on income, household size, fuel type.[1]
- Varies by: household_size|priority_tier

**How to apply:**
- Phone or in-person: Contact local HEAT office (find via https://jobs.utah.gov/housing/scso/seal/heat.html or https://mydoorway.utah.gov/utility-assistance/).[2][4]
- Online eligibility check and local applications: https://mydoorway.utah.gov/utility-assistance/ or https://www.snapscreener.com/liheap/utah.[1][4]
- Regional providers like Mountainland Association of Governments for Summit/Wasatch counties: https://magutah.gov/heat/.[3]

**Timeline:** Year-round but funds exhaust by September 30 or earlier; priority processing not specified.[2]
**Waitlist:** Applications accepted until federal LIHEAP funds exhausted; no formal waitlist mentioned.[2]

**Watch out for:**
- Priority applications for elderly (60+), disabled, children under 6 start October 1; general public November 1; funds exhaust quickly.[1][2]
- Year-round but limited to federal funds; crisis only for emergencies like shutoff or broken furnace.[1][4]
- Household includes all at address sharing utility bill, unlike SNAP.[1]
- Must be responsible for utilities; proof from prior month required.[3][4]

**Data shape:** Income at 150% FPL with table by household size; priority tiers by age/disability/young children; regional local providers but uniform rules; no asset test; funds time-limited annually.

**Source:** https://jobs.utah.gov/housing/scso/seal/heat.html

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross annual household income at or below 200% of the Federal Poverty Level (FPL). Exact dollar amounts vary by household size and year; check current FPL guidelines via agency as 2026 figures not specified in sources. Alternatively, current HEAT program recipients qualify regardless. Income based on gross monthly without deductions. 20% reduction on earned income/wages if qualifying under HEAT (150% FPL).
- Assets: No asset limits mentioned.
- Household must include at least one adult who is a U.S. citizen or qualified non-citizen.
- Home must have never been weatherized or weatherized more than 15 years ago.
- Computerized energy audit must show clear need.
- For renters: Notarized Weatherization Rental Agreement required.
- Owners and renters both eligible if meeting income guidelines.
- Priority given to elderly, disabled, households with children under 6, and high energy cost households.

**Benefits:** Professionally trained crews perform computerized energy assessments, advanced diagnostics, cost-effective home improvements (e.g., insulation, sealing, safety inspections, indoor air quality checks). Year-round crisis help for furnaces, air conditioners, water heaters for eligible homeowners on HEAT. Specific measures determined by energy audit.
- Varies by: priority_tier

**How to apply:**
- Contact regional agency serving your county (7 agencies statewide): e.g., Bear River Association of Governments (Box Elder, Cache, Rich, Shoshone Indian Tribe) at (435) 752-7242, weatherization@brag.utah.gov, 95 W. 100 S. #116, Logan, UT 84321; Utah Community Action (Davis, Morgan, Weber, Salt Lake, Tooele, Goshute Indian Tribe) at (801) 214-3215, info@utahca.org, 1307 S 900 W, Salt Lake City, UT 84104; Five County AOG (Beaver, Iron, Washington, Garfield, Kane, Paiute Indian Tribe) at (435) 865-0195, Cedar City Office 2344 West Industry Way #2, Cedar City, UT 84721.
- Email or mail to regional agency (e.g., weatherization@mountainland.org or 478 South Geneva Road, Vineyard, UT 84059 for Mountainland area; fax/mail for UtahCA at (801) 214-3208).
- In-person drop-off at agency offices.
- Agency Service Area Map available at https://jobs.utah.gov/housing/scso/wap/how.html.

**Timeline:** Not specified; application reviewed for eligibility, then prioritized and placed on waiting list.
**Waitlist:** All approved applicants placed on a waiting list; prioritized by factors like elderly/disabled status, young children, high energy costs.

**Watch out for:**
- Must contact specific regional agency for your county; not centralized statewide application.
- Renters need notarized landlord agreement.
- Home ineligible if weatherized within last 15 years.
- Priority rating system used; elderly qualify for priority but no age minimum.
- HEAT recipients get automatic eligibility pathway.
- Applications prioritized then waitlisted; no guaranteed timeline.
- Same household member name required for HEAT and Weatherization if linking.
- Crisis services (furnace/AC/water heater) require being homeowner on HEAT.

**Data shape:** Administered via 7 county-specific agencies with unique contacts; priority tiers for elderly/disabled/kids under 6/high energy users; dual eligibility paths (200% FPL or HEAT); 15-year re-weatherization rule.

**Source:** https://jobs.utah.gov/housing/scso/wap/how.html

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to anyone eligible for Medicare, including those with limited incomes, Medicare beneficiaries under 65 with disabilities, dually eligible for Medicare and Medicaid, their families, and caregivers. Soon-to-be eligible individuals may also access services.[1][2][3]
- Assets: No asset limits or tests apply.[1]
- Must be eligible for Medicare (typically 65+ or under 65 with certain disabilities); family members and caregivers of Medicare-eligible individuals qualify.[1][3]

**Benefits:** Free one-on-one counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), enrollment, appeals, prescription drug costs, coordinating benefits, applying for low-income programs (Medicaid, Medicare Savings Programs, Extra Help), long-term care insurance; outreach presentations, education at health fairs; fraud prevention via Senior Medicare Patrol (SMP) in many areas. Delivered in-person, phone, or interactive sessions by trained/certified counselors.[2][3][4][6]

**How to apply:**
- Phone: 1-800-541-7735[7]
- Website: Utah-specific SHIP site via shiphelp.org (select Utah)[1][7]
- In-person: Available at local sites in every Utah county through partnerships with area agencies on aging and community partners[3]
- Ask counselor for situation-specific info when scheduling[1]

**Timeline:** No formal processing; services provided via appointment scheduling, typically immediate access by phone or in-person where available[1][6]

**Watch out for:**
- Not a healthcare or financial benefit provider—only free counseling/education; does not pay premiums or provide direct aid[1][4]
- Services are free but appointment-based; prepare documents in advance for efficiency[1]
- Contact 3 months before Medicare eligibility for best help[1]
- Trained volunteers/staff only give objective info, not sales advice[2][6]
- Families/caregivers can access on behalf of beneficiaries, often overlooked[1]

**Data shape:** no income/asset test; Medicare eligibility focus; statewide with local delivery in every county; counseling-only service, not direct financial aid

**Source:** https://insurance.utah.gov/consumers/seniors/[3]

---

### Meals on Wheels (Utah)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Income is not always a factor in eligibility[1].
- Must be homebound—unable to leave home without assistance[1][4][5]
- Must have mobility challenges that make it difficult to shop for food or prepare meals[2]
- Must reside within a program's delivery zone (geographic coverage varies by provider)[1]
- Must be a resident of the specific county served (e.g., Davis County, Cache County, Utah County)[4][5][6]
- Priority given to those who are isolated[5][7]
- Exceptions: Individuals under 60 with disabilities may be served in some cases; those under 60 in congregate settings may qualify; volunteers assisting with the program may receive meals regardless of age[3]

**Benefits:** One hot, nutritious midday meal per day, Monday–Friday (excluding holidays). Weekend meals available in some areas (delivered Thursday and Friday)[4][6]. Each meal includes protein, vegetables, fruit, grains, and milk; meets low-sodium, heart-healthy requirements; provides one-third of recommended daily intake for older adults[7]. Service also includes personal contact to ensure well-being of seniors[6].
- Varies by: region

**How to apply:**
- Phone: Contact local Area Agency on Aging or regional provider (see regional offices below)[1]
- In-person: Assessment must be completed with Meals on Wheels staff before meals begin[5][6]
- Online referral: Available through some providers (e.g., MAG-SUW)[7]
- Referral by others: Family members and caregivers can apply on behalf of eligible seniors[2]

**Timeline:** Varies by program. Some process applications within a week; others take longer if there is a waiting list[1]. Utah County has a waiting list as of January 2022[5].
**Waitlist:** Yes, in some areas. Utah County specifically noted to have a waiting list as of January 2022[5]. Waitlist status varies by region and provider.

**Watch out for:**
- No statewide program: Meals on Wheels in Utah is fragmented by county and provider. Eligibility, cost, service frequency, and wait times differ significantly by location. Families must contact their specific county provider[1][4][5][6].
- Homebound definition is strict: 'Unable to leave home without assistance' is the standard. Those who can leave home easily or have someone to cook for them may not qualify[1].
- Geographic coverage is limited: Seniors outside a delivery zone cannot access the program, even if they meet other criteria[1].
- Voluntary donations, not free: While the program is federally and state-supported, recipients are asked for voluntary contributions ($3.50–$6 per meal depending on region and age)[4][5]. Those under 60 typically pay more[5].
- Waiting lists exist: Utah County has a documented waiting list as of January 2022[5]. Other regions may also have waiting lists; check with your local provider[1].
- Vehicle ownership may affect eligibility: Some programs (e.g., Davis County) explicitly state 'Do Not drive a vehicle' as an eligibility requirement[4].
- Cancellation protocol: Seniors must call by 9:00 a.m. the day of cancellation if they won't be home[6].
- Door must be unlocked: Drivers need access to deliver meals; seniors must leave doors unlocked or arrange access[6].
- Assessment is mandatory: Eligibility is not self-determined; an in-person assessment with program staff is required before meals begin[5][6].
- Meal frequency varies: Seniors can receive meals daily, a couple times per week, or somewhere in between, depending on assessed need[5].

**Data shape:** Meals on Wheels in Utah is a decentralized, county-based program with no single statewide eligibility standard or application process. Benefits are fixed (one meal per day, Monday–Friday) but vary slightly by region in cost and service frequency. Eligibility is uniform in core requirements (age 60+, homebound, mobility challenges) but differs by county in residency restrictions and vehicle ownership rules. Application methods and processing times vary by provider. Waitlists are documented in some regions but not others. Income is explicitly not a factor in eligibility, distinguishing this from means-tested programs. The program is administered through local Area Agencies on Aging and county senior centers, requiring families to identify and contact their specific regional provider.

**Source:** No single statewide .gov URL. Program is administered by local Area Agencies on Aging and county-level providers. National resource: https://www.mealsonwheelsamerica.org/

---

### Utah Caregiver Support Program (UCSP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Caregiver must be 18 or older (or 55+ for specific relative caregiver roles); care recipient must be 60+ OR any age with Alzheimer's disease or related neurological disorder+
- Income: No income requirement or financial eligibility threshold[1][2][4]
- Caregiver must be an unpaid, informal provider of in-home and community care[1][2]
- For respite and supplemental services specifically: care recipient must be unable to perform 2+ activities of daily living (ADLs) without substantial assistance OR require substantial supervision due to cognitive impairment[5]
- Caregiver must demonstrate medium-to-high risk score on DAAS Approved Demographic Intake and Screening tool and complete DAAS-approved Assessment and Caregiver Burden score[3]
- Special eligibility for older relatives (55+) as primary caregivers of children under 18 or adults 18-59 with disabilities[1][2]

**Benefits:** Core services (information, counseling, support groups, caregiver education) available to all eligible caregivers at no cost. Respite care and supplemental services (emergency response systems, grab bars, incontinence supplies) available to those meeting additional criteria. Specific dollar amounts and hours not specified in available sources[1][2][5]
- Varies by: priority_tier and stress_index

**How to apply:**
- Contact your Local Area Agency on Aging (specific phone numbers vary by county; examples: Salt Lake County 801-468-2460, Davis County 801-451-3377, Weber/Morgan Counties 801-625-3866)[6]
- Visit https://daas.utah.gov/seniors/ for statewide information and local agency contact information[2]
- In-person intake required; application process includes completion of DAAS-approved Demographic Intake and Screening tool, Assessment, and Caregiver Burden score[3][5]

**Timeline:** Not specified in available sources
**Waitlist:** Yes — if insufficient funds exist to bring an individual onto the program, the Agency maintains a list of potential applicants served in turn using the DAAS-approved Demographic Intake and Risk Screening tool and Caregiver Burden score[3]

**Watch out for:**
- No income requirement sounds good, but eligibility for respite and supplemental services (the most valuable benefits) requires demonstrating medium-to-high caregiver stress/burden — not just having an eligible care recipient[3][5]
- Care recipient must have deficits in at least 2 ADLs or require substantial cognitive supervision — having a 60+ year old alone doesn't qualify[5][6]
- Caregiver burden score is mandatory and determines actual service eligibility; this is not a simple application[3]
- Waitlist exists when funding is insufficient — families should apply early and understand they may not receive services immediately[3]
- Program is designed to delay facility placement, not replace it — services are temporary/respite-focused, not permanent long-term care[1][2]
- Specific dollar amounts for services and hours per week are not published in program materials — families must contact their local agency for details[5][6]
- Different program exists for paid caregiver compensation (Permanent Caregiver Compensation through DSPD for people with disabilities) — families should verify which program applies to their situation[7]

**Data shape:** This program has no income or asset limits, making it broadly accessible, but eligibility for most valuable services (respite, supplemental) is gated by caregiver burden assessment rather than financial need. Benefits are service-based rather than cash payments. Program operates through county-level Local Area Agencies on Aging, creating potential regional variation in availability and wait times. Priority tiers exist but are based on care recipient condition and caregiver need, not first-come-first-served. No published fee schedule or service hour limits are available in official sources.

**Source:** https://daas.utah.gov/seniors/ (Utah Department of Aging & Adult Services)[2]

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Utah Legal Services (ULS) sets income eligibility at 125% of the Federal Poverty Guidelines (FPG) based on household gross annual income, with exceptions up to 200% FPG if documented hardships exist (e.g., medical expenses, taxes). Exact 2026 dollar amounts not specified in sources; refer to current DHHS FPG. Salt Lake County Senior Citizen Law Center follows low-income guidelines, typically below 200% FPG[2][7].
- Assets: ULS guidelines mention asset considerations but no specific dollar limits detailed. For context in related elder programs like Medicaid, single applicants face $2,000 countable assets; married $3,000-$4,000. Exempt assets often include primary home (up to $730,000 equity in 2025), one vehicle, household furnishings, personal effects[1][5].
- Legal issue must relate to health, housing, public benefits, entitlements, family, consumer, wills, estates, or elder law[7].
- Financial eligibility screening required; priority for low-income seniors[2][7].

**Benefits:** Free legal counseling, representation, advocacy, and assistance in health, housing, public benefits/entitlements, family, consumer issues, wills, and estates. Provided by Utah Legal Services' Senior Citizen Law Center (Salt Lake County contract) and volunteer attorneys via Senior Law Project. No specific dollar amounts or hours stated[7].
- Varies by: region

**How to apply:**
- Phone: Contact Utah Legal Services or local Area Agency on Aging via Division of Aging and Adult Services at (801) 538-3910[5].
- In-person: Salt Lake County Aging and Adult Services or Utah County providers (e.g., clinics in Provo)[7][8].
- Other: Fill intake forms for screening; weekly clinics or hotline for family law self-representation[4]. No central online URL or mail specified for seniors program.

**Timeline:** Not specified in sources.

**Watch out for:**
- Not statewide—must contact county-specific provider; income up to 200% FPG possible with exceptions but requires Executive Director approval and documentation[2].
- Focus on civil elder law issues only (no criminal); self-representation required for some clinics[4][7].
- Assets considered beyond income; look-back rules apply in related Medicaid planning[1].

**Data shape:** County-contracted with regional providers and offices; income test with exceptions; no fixed statewide processing times or central application portal; tied to low-income guidelines varying by household size

**Source:** https://www.utahlegalservices.org/ (financial guidelines); https://www.saltlakecounty.gov/aging-adult-services/support/legal-services/ (Salt Lake)[2][7]

---

### Long-Term Care Ombudsman

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; services provided without regard for income and resources[3]
- Assets: No asset limits; services provided without regard for income and resources[3]
- Resident of a long-term care facility (e.g., nursing home or assisted living), or attempting to enter one[3][4]
- Services available as requested by an individual or on behalf of an individual[3]

**Benefits:** Investigate complaints, resolve problems, advocate for residents' rights, provide education on resident rights and abuse prevention, offer community resources, support during care concerns; free and confidential; no specific dollar amounts or hours[3][4][5][6]

**How to apply:**
- Online complaint form at https://daas.utah.gov/resident-rights/[4][5]
- Phone: Contact local Ombudsman by county (examples: 435-459-2876 for San Juan County[4], 801-229-3809 for Summit/Wasatch counties[5], statewide via https://daas.utah.gov/long-term-care-ombudsman/[3])
- Email: ombudsman@magutah.gov for certain counties[5]
- In-person: Local offices via county Aging Agencies (e.g., Salt Lake County Aging & Adult Services[6])

**Timeline:** Not specified in sources

**Watch out for:**
- Not a financial or direct service program—purely advocacy and complaint resolution, not healthcare or funding[3][4]
- Must be in or entering a certified long-term care facility (nursing home/assisted living); not for home care[2][3]
- Confidentiality strictly protected unless life-threatening[3]
- Regional contacts vary—use county-specific Ombudsman, not a single statewide number[3][4][5]
- Volunteers must be certified; families cannot self-advocate as Ombudsman[1][3]

**Data shape:** no income test; advocacy-only for long-term care facility residents; county-assigned local Ombudsmen with varying contacts

**Source:** https://daas.utah.gov/long-term-care-ombudsman/[3]

---

### Utah Aging Waiver


**Eligibility:**
- Age: 65+
- Income: Single applicant: $1,305/month (effective 3/1/25–2/28/26); $1,330/month (effective March 2026–Feb 2027). Limits increase annually in March and are equivalent to 100% Federal Poverty Level (adjusted by state). Spousal income exempt even if living together; couples determined under Spousal Impoverishment rules. Almost all income counted.[1][2][3]
- Assets: Asset limit same as Medicaid: $2,000 for single applicant (countable assets ≤$2,000). Exempt: primary home, household furnishings/appliances, personal effects, one vehicle. Look-Back Rule applies (60 months): assets given away/sold below fair market value result in Penalty Period of ineligibility.[1][2]
- Utah resident.
- Nursing Facility Level of Care (NFLOC): Assessed via InterRAI MDS-HC tool by registered nurse. Requires 2 of: (1) significant physical assistance with ≥2 ADLs (toileting, bathing, dressing, transferring, mobility, eating); (2) poor orientation to time/place/person requiring NF care; (3) medical condition where needs cannot be safely met without waiver services. Dementia diagnosis alone insufficient.[1][2][3]

**Benefits:** Core: Case Management. Additional: Homemaking (cleaning, laundry, shopping, meal prep, errands, medical appts), Chore Services, Companion Services, Home Modifications (limited), plus standard Medicaid benefits. Other potential (from waiver approvals): Respite/Respite Care (up to >13 days in LTC), Specialized Medical Equipment/Supplies/Assistive Technology/Environmental Adaptations (no prescription needed for some), Personal Emergency Response Systems (PERS: install/test/remove/purchase/rental/repair/response), Supplemental Meals, Non-Medical Transportation. No fixed dollar amounts or hours specified; individualized via case manager plan.[3][5]
- Varies by: priority_tier

**How to apply:**
- Phone intake for assessment (regional Aging & Adult Services offices, e.g., Salt Lake County; San Juan County). No statewide phone listed.
- In-person: Local Aging Services offices (e.g., Salt Lake County Aging & Adult Services, San Juan County).
- Contact case manager throughout process; applications accepted anytime (waiver allows continuous enrollment, no tri-annual periods).[4][3][5]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; potential due to prioritization implied by tiered structure.

**Watch out for:**
- Income limits update March annually (not FPL Jan timing); check current.[1][2]
- NFLOC requires specific ADL/orientation criteria; dementia alone insufficient.[1]
- 60-month Look-Back Penalty for asset transfers.[1]
- Spousal rules allow exempt spouse income/assets under Impoverishment protections.[3]
- Estate recovery only for actual care costs, not full estate.[3]
- Services individualized, not guaranteed fixed hours/dollars; prioritized.[5]

**Data shape:** Income limits state-specific timing (March); NFLOC via MDS-HC tool with exact 2-of-3 criteria; regional offices handle intake/services; spousal impoverishment exemptions; no fixed benefit caps, tier/need-based.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.utah.gov/ (state Medicaid site; specific waiver pages via regional aging services like saltlakecounty.gov/aging-adult-services)

---

### New Choices Waiver Program


**Eligibility:**
- Age: 65 or older, or 18-64 and disabled+
- Income: Must meet Utah Medicaid financial eligibility for long-term care; up to $2,901 monthly for single applicants in 2025 (income assessed individually for couples). Deductions include personal needs allowance (100% federal poverty guideline for household of one), up to $125 gross earned income, shelter costs up to $300, and spousal/dependent allowances (spousal income allowance cannot exceed $3,948 total). Remaining income is cost-of-care contribution paid monthly to eligibility agency.[1][4]
- Assets: Countable assets under $2,000 for single applicants; married couples applying together under $3,000 (spouse may have up to $117,240). Standard Medicaid asset rules apply (e.g., primary home often exempt if intent to return, one vehicle exempt; countable assets include bank accounts, investments).[2][4]
- Utah resident and U.S. citizen or qualified alien.
- Require Nursing Facility Level of Care (NFLOC), assessed via InterRAI MDS-HC by registered nurse: need significant hands-on ADL assistance (toileting, bathing, dressing, transferring, mobility, eating), poor orientation requiring NF care, or needs unmet safely without waiver.
- Primary condition not attributable to mental illness.
- Not requiring 'Intensive Skilled' level of care.
- Not eligible for ICF/ID.
- Currently residing long-term in: Medicaid-funded nursing home (90+ days), Medicare-funded medical institution (30+ days, planned for Medicaid NF 60+ days without waiver), assisted living or Type N small health care facility (365+ days), or another Utah Medicaid HCBS waiver identified for impending NF care.[1][2][3][5][6]

**Benefits:** Expanded package of home and community-based services (HCBS) to support transition to and living in community settings (own home or other integrated settings), based on assessed needs. Specific services not exhaustively listed but include supportive services beyond standard Medicaid to meet NFLOC in community (e.g., personal care, homemaker, respite; exact mix via care plan).[6]
- Varies by: priority_tier

**How to apply:**
- Online: Submit via https://medicaid.utah.gov/ltc-2/nc/ (requires UtahID account for first-time applicants; fastest processing).[6]
- Phone: (800) 662-9651, option 6.[6]
- Email: ncwprogram@utah.gov (request paper application, but expect delays).[6]
- Paper/mail: Request via phone/email (delays noted).[6]

**Timeline:** Not specified; online fastest, paper delayed.[6]
**Waitlist:** Not mentioned in sources; may exist given targeted enrollment and facility residency requirement.[6]

**Watch out for:**
- Must already be in qualifying facility for minimum stay (90-365 days) or another HCBS waiver with impending NF need; not for community dwellers seeking to avoid facilities.[3][5][6]
- Requires prior Medicaid LTC approval; all standard Medicaid asset/income rules apply (strategies like spousal protection needed).[2]
- Services not automatic; separate waiver application after Medicaid approval, with NFLOC ongoing requirement.[5][6]
- Cost-of-care contribution from remaining income after deductions must be paid monthly.[1]
- Dementia diagnosis alone doesn't guarantee NFLOC.[3]

**Data shape:** Targeted transition from long-term institutional care only (strict facility residency minimums); Medicaid prerequisite with NFLOC via MDS-HC; deductions create complex net income calculation; no open community enrollment.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.utah.gov/ltc-2/nc/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Utah Medicaid Program | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | medium |
| SNAP (Food Stamps) | benefit | federal | deep |
| LIHEAP (HEAT in Utah) | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels (Utah) | benefit | federal | medium |
| Utah Caregiver Support Program (UCSP) | resource | state | simple |
| Legal Aid for Seniors | resource | local | simple |
| Long-Term Care Ombudsman | resource | federal | simple |
| Utah Aging Waiver | benefit | state | deep |
| New Choices Waiver Program | benefit | state | deep |

**Types:** {"benefit":9,"resource":4}
**Scopes:** {"state":4,"local":2,"federal":7}
**Complexity:** {"deep":7,"medium":2,"simple":4}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/UT/drafts.json`.

- **Utah Medicaid Program** (benefit) — 6 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 3 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **not_applicable**: 2 programs
- **priority_tier and stress_index**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Utah Medicaid Program**: Multiple tiers (Institutional, HCBS Waivers like Aging/New Choices, ABD) with varying income caps and NHLOC requirements; spousal protections; no standard household size scaling beyond couples
- **Program of All-Inclusive Care for the Elderly (PACE)**: Only available at limited centers/service areas per state; no income/asset test for core eligibility; requires state-certified nursing home level need; enrollment caps create waitlists; replaces all other Medicare/Medicaid long-term care options
- **Medicare Savings Programs (QMB, SLMB, QI)**: This program consists of three distinct tiers based on income level (QMB at 100% FPL, SLMB at 100-120% FPL, QI at 120-135% FPL), each with different benefits and eligibility rules. The key differentiator is that QI has no guaranteed funding and may close to new applicants mid-year. Utah follows federal asset and income limits with no state-specific variations mentioned. Benefits are financial (premium and cost-sharing payments) rather than service-based. The program is administered entirely through Utah's Medicaid agency, not through Medicare directly.
- **SNAP (Food Stamps)**: No gross income test for households with elderly 60+ or disabled; higher asset limit ($4,250); ESAP for simplified elderly process; benefits heavily deduction-driven (medical/shelter for seniors); statewide uniform.
- **LIHEAP (HEAT in Utah)**: Income at 150% FPL with table by household size; priority tiers by age/disability/young children; regional local providers but uniform rules; no asset test; funds time-limited annually.
- **Weatherization Assistance Program**: Administered via 7 county-specific agencies with unique contacts; priority tiers for elderly/disabled/kids under 6/high energy users; dual eligibility paths (200% FPL or HEAT); 15-year re-weatherization rule.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; Medicare eligibility focus; statewide with local delivery in every county; counseling-only service, not direct financial aid
- **Meals on Wheels (Utah)**: Meals on Wheels in Utah is a decentralized, county-based program with no single statewide eligibility standard or application process. Benefits are fixed (one meal per day, Monday–Friday) but vary slightly by region in cost and service frequency. Eligibility is uniform in core requirements (age 60+, homebound, mobility challenges) but differs by county in residency restrictions and vehicle ownership rules. Application methods and processing times vary by provider. Waitlists are documented in some regions but not others. Income is explicitly not a factor in eligibility, distinguishing this from means-tested programs. The program is administered through local Area Agencies on Aging and county senior centers, requiring families to identify and contact their specific regional provider.
- **Utah Caregiver Support Program (UCSP)**: This program has no income or asset limits, making it broadly accessible, but eligibility for most valuable services (respite, supplemental) is gated by caregiver burden assessment rather than financial need. Benefits are service-based rather than cash payments. Program operates through county-level Local Area Agencies on Aging, creating potential regional variation in availability and wait times. Priority tiers exist but are based on care recipient condition and caregiver need, not first-come-first-served. No published fee schedule or service hour limits are available in official sources.
- **Legal Aid for Seniors**: County-contracted with regional providers and offices; income test with exceptions; no fixed statewide processing times or central application portal; tied to low-income guidelines varying by household size
- **Long-Term Care Ombudsman**: no income test; advocacy-only for long-term care facility residents; county-assigned local Ombudsmen with varying contacts
- **Utah Aging Waiver**: Income limits state-specific timing (March); NFLOC via MDS-HC tool with exact 2-of-3 criteria; regional offices handle intake/services; spousal impoverishment exemptions; no fixed benefit caps, tier/need-based.
- **New Choices Waiver Program**: Targeted transition from long-term institutional care only (strict facility residency minimums); Medicaid prerequisite with NFLOC via MDS-HC; deductions create complex net income calculation; no open community enrollment.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Utah?
