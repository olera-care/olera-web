# Utah Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.070 (14 calls, 57s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 12 |
| Programs deep-dived | 11 |
| New (not in our data) | 10 |
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
- **unknown**: 1 programs
- **in_kind**: 1 programs
- **financial**: 1 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Utah Medicaid Aging Waiver

- **income_limit**: Ours says `$1255` → Source says `$1,305` ([source](https://medicaid.utah.gov/medicaid-long-term-care-and-waiver-programs/[6]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) to delay/prevent nursing home placement for those meeting NFLOC but living at home; core: case management (ongoing plan of care); additional: medical services not typically available community-wide (day treatment, lifeline/emergency response, in-home respite care); specific hours/dollars not fixed, tailored via case manager assessment[1][5][6].` ([source](https://medicaid.utah.gov/medicaid-long-term-care-and-waiver-programs/[6]))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.utah.gov/medicaid-long-term-care-and-waiver-programs/[6]`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE (national program information; not available in Utah)))
  - Shape notes: PACE is a national Medicare/Medicaid program with state-by-state availability. Utah does not currently participate. The program is highly targeted to frail elderly (average participant is 76 years old with multiple complex conditions[3]). No income or asset testing for eligibility, but financing constraints may create waitlists. Benefits structure depends on dual vs. single insurance eligibility. Geographic availability is the primary limiting factor for Utah residents.
- **Medicare Savings Programs (QMB, SLMB, QI)** — unknown ([source](https://medicaid.utah.gov/medicare-cost-sharing-programs/))
  - Shape notes: This program consists of three separate tiers (QMB, SLMB, QI) with progressively higher income limits but different benefit levels. QMB is the most comprehensive (covers premiums and cost-sharing), while SLMB and QI cover only Part B premiums. QI has a critical gotcha: it's not an entitlement program and funding can run out mid-year. Income limits are tied to the federal poverty level and update annually in April. All three programs share the same asset limits and exclusions. Processing timelines differ: QMB has a 45-day maximum, while SLMB and QI can be retroactive. Utah uses federal standards but may have more generous standards in specific areas.
- **SNAP (Supplemental Nutrition Assistance Program)** — in_kind ([source](https://jobs.utah.gov/customereducation/services/foodstamps/))
  - Shape notes: Elderly/disabled exemptions (no gross income test, higher asset limit $4500, ESAP); benefits scale by household size/income/deductions; statewide with local offices.
- **LIHEAP (Low-Income Home Energy Assistance Program) / HEAT Program in Utah** — financial ([source](jobs.utah.gov/housing/scso/seal/heat.html and mydoorway.utah.gov/utility-assistance/[2][4]))
  - Shape notes: Utah's LIHEAP operates under the state name 'HEAT Program' (Home Energy Assistance Target). Benefits scale by household size and fuel type. The program has a defined program year (October 1 – September 30) with tiered application windows based on household vulnerability (elderly, disabled, young children receive priority). No asset limit exists, making this relatively accessible to asset-rich but income-poor households. Regional administration varies, with some areas served through MAG and others through state offices.
- **Weatherization Assistance Program** — service ([source](https://jobs.utah.gov/housing/scso/wap/how.html))
  - Shape notes: Administered via 7-8 county-specific agencies with unique contacts; priority tiers for elderly/disabled/kids; HEAT crossover eligibility; energy audit gatekeeps services.
- **Utah State Health Insurance Assistance Program (SHIP)** — service ([source](https://daas.utah.gov/seniors/[7]))
  - Shape notes: no income/asset test; free counseling service statewide via local affiliates; focuses on education and application assistance rather than direct benefits
- **Meals on Wheels (Home-Delivered Meals)** — service ([source](https://rules.utah.gov/publicat/code/r510-104/S510-104.htm (Utah Administrative Code R510-104, Nutrition Programs for the Elderly)))
  - Shape notes: Decentralized by county/provider with local AAAs managing; no statewide income/asset tests; eligibility emphasizes homebound/mobility over finances; delivery zones create geographic patchwork.
- **Utah Caregiver Support Program (UCSP)** — service ([source](https://magutah.gov/cgsupport/))
  - Shape notes: No income/asset test; eligibility driven by caregiver burden score, care receiver ADL deficits, and priority tiers; regionally administered with waitlists; distinguishes core (universal) vs. respite/supplemental services.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor) and https://www.utah.gov/pmn/files/488561.pdf (Utah state program information)))
  - Shape notes: This program's structure is defined by: (1) a fixed age threshold (55+) with enrollment priority for those 65+; (2) a relative income limit (125% of poverty level) that varies annually and by household size, requiring individual verification; (3) fixed work hours (average 20/week) and wage structure (highest of federal/state/local minimum); (4) a maximum program duration (48 months); (5) geographic availability limited to all but five Utah counties; (6) funding volatility affecting regional availability; and (7) priority enrollment categories that may affect wait times. The program is employment-focused rather than needs-based, emphasizing job training and community service over direct financial assistance.
- **Legal Services for Seniors** — service ([source](https://www.utahlegalservices.org/))
  - Shape notes: County-contracted with regional providers; income at 125% FPL with exceptions; no fixed asset table or statewide uniformity; tied to ULS guidelines for seniors 60+.

## Program Details

### Utah Medicaid Aging Waiver


**Eligibility:**
- Age: 65+
- Income: Single applicant limit is $1,305/month (effective 3/1/25–2/28/26) or $1,330/month (effective March 2026–Feb 2027); limits updated annually in March and equivalent to 100% Federal Poverty Level (adjusted by state); almost all income counted (Social Security, pensions, IRA payments, wages, etc.); spousal income may be exempt even if living together; no specific table for household size provided, but varies by program formulas[1][3][4][5].
- Assets: $2,000 countable assets for single applicant (bank accounts, retirement accounts, stocks, bonds, CDs, cash); exempt: primary home (equity under $730,000 if applicant/spouse resides or intends to return), one vehicle, household furnishings/appliances, personal effects, burial plots/irrevocable trusts up to $7,000, life insurance ≤$1,500 face value; 60-month look-back rule applies with penalty period for transfers below fair market value[1][3][4].
- Utah resident and U.S. citizen or qualified immigrant[3][5].
- Nursing Facility Level of Care (NFLOC) via InterRAI MDS-HC assessment by registered nurse: requires 2 of 3 - (1) significant physical assistance with ≥2 ADLs (toileting, bathing, dressing, transferring, mobility, eating); (2) poor orientation to time/place/person requiring nursing facility care; (3) medical condition/needs unsafe without waiver services; dementia diagnosis alone insufficient[1][2].

**Benefits:** Home and Community-Based Services (HCBS) to delay/prevent nursing home placement for those meeting NFLOC but living at home; core: case management (ongoing plan of care); additional: medical services not typically available community-wide (day treatment, lifeline/emergency response, in-home respite care); specific hours/dollars not fixed, tailored via case manager assessment[1][5][6].
- Varies by: priority_tier

**How to apply:**
- Referral starts with local Area Agency on Aging (AAA) for case manager evaluation[6].
- Contact Utah Medicaid general: implied via medicaid.utah.gov (no specific phone/URL in results for Aging Waiver)[6].
- San Juan County example: local aging services office[5].

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; potential due to waiver slots, but no details.

**Watch out for:**
- Income/assets updated annually (March); check current limits as 2026 figure ($1,330) supersedes 2025 ($1,305)[1][4].
- 60-month look-back penalty for asset transfers[1].
- Must live at home (not in institution/assisted living like New Choices Waiver); NFLOC required but dementia alone insufficient[1][2].
- Distinguish from New Choices Waiver (for institutionalized or 18-64 disabled/65+ with institutional history)[2].
- Special deductions/exemptions vs. regular Medicaid (e.g., spousal income)[5].

**Data shape:** Tailored services via case management/NFLOC tiers rather than fixed dollars/hours; annual March income adjustments; home-based only (vs. institutional alternatives); AAA regional referral entry points.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.utah.gov/medicaid-long-term-care-and-waiver-programs/[6]

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No financial requirements or income limits for eligibility determination[2][3]. However, financing is capped by federal and state budgets, and specific income requirements may vary by program and state[4].
- Assets: No asset limits specified in eligibility criteria[3].
- Must reside in a PACE-specific service area[1][3]
- Must be certified by the state as needing nursing home level of care (NFLOC)[1][3]
- Must be able to live safely in the community with PACE services at time of enrollment[3][5]
- Cannot be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan[3]
- Cannot be enrolled in hospice services or certain other programs[3]

**Benefits:** Comprehensive medical and social services including coordinated care from an interdisciplinary team. Participants never pay deductibles or copayments for any care, medication, or service provided by the PACE team[2]. For dually eligible (Medicare and Medicaid) participants: no deductibles or copayments[1]. For Medicare-only participants: monthly premium required to cover long-term care portion and Part D drug benefits[1].
- Varies by: insurance_status

**How to apply:**
- N
- O
- T
-  
- A
- V
- A
- I
- L
- A
- B
- L
- E
-  
- I
- N
-  
- U
- T
- A
- H
- [
- 8
- ]


**Watch out for:**
- PACE is NOT currently available in Utah[8]. Families in Utah cannot enroll in this program.
- PACE programs are only available in some states that offer PACE under Medicaid[5].
- Once enrolled, the PACE organization becomes the only entity authorized to provide and pay for care[1].
- Enrollment is voluntary but changes how participants access all their benefits[1].
- Approximately 90% of PACE participants are dually eligible for Medicare and Medicaid[3]; those with only Medicare must pay monthly premiums[1].
- Financing is capped by federal and state budgets, so waiting lists and specific income requirements may apply depending on the program and state[4].
- States define 'nursing home level of care' differently, which affects eligibility determination[2].

**Data shape:** PACE is a national Medicare/Medicaid program with state-by-state availability. Utah does not currently participate. The program is highly targeted to frail elderly (average participant is 76 years old with multiple complex conditions[3]). No income or asset testing for eligibility, but financing constraints may create waitlists. Benefits structure depends on dual vs. single insurance eligibility. Geographic availability is the primary limiting factor for Utah residents.

**Source:** https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE (national program information; not available in Utah)

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"note":"Income limits are based on Federal Poverty Level (FPL) and are updated annually in April. The following are 2026 limits for Utah.","QMB":{"individual_monthly":"$1,350","married_couple_monthly":"$1,824","requirement":"At or below 100% FPL"},"SLMB":{"individual_monthly":"Up to $1,585","married_couple_monthly":"Up to $2,135","requirement":"Income exceeds 100% FPL but does not exceed 120% FPL"},"QI":{"individual_monthly":"Up to $1,781","married_couple_monthly":"Up to $2,400","requirement":"Income exceeds 120% FPL but does not exceed 135% FPL"},"income_exclusions":"The first $20 of monthly income, the first $65 of wages, half of wages above $65, food stamps, and certain Native American settlement payments are excluded from income calculations."}
- Assets: {"QMB_SLMB_QI_individual":"$9,950","QMB_SLMB_QI_married_couple":"$14,910","note":"Utah uses federal asset limits for all three programs.","assets_that_do_not_count":["Primary home","One vehicle","Household items","Engagement and wedding rings","Burial plots","Burial expenses up to $1,500","Life insurance with cash value below $1,500","Some Native corporation stocks held by Alaska Native people"]}
- Must be eligible for Medicare Part A (even if not currently enrolled)
- Must be a resident of Utah
- For SLMB and QI: Must be receiving Part A Medicare coverage
- For QI: Cannot be receiving Medicaid

**Benefits:** N/A
- Varies by: program_tier

**How to apply:**
- Contact Utah Department of Health and Human Services (DHHS) Medicaid office
- Apply through your state Medicaid agency

**Timeline:** [object Object]
**Waitlist:** [object Object]

**Watch out for:**
- QI is NOT an entitlement program — funding is limited and allocated annually. Once funds run out for the calendar year, new applicants cannot enroll, and eligibility is not guaranteed in future years.
- For QI specifically: You cannot be receiving Medicaid to qualify. If you're on Medicaid, you may only qualify for QMB or SLMB.
- Income limits change every April based on the federal poverty level announcement. Families should verify current limits annually.
- SLMB and QI do not issue Medicaid cards. QMB issues a card that either reads 'MEDICARE COST-SHARING ONLY' (if not receiving Medicaid) or looks like a regular Medicaid card.
- Processing can take up to 45 days for QMB, but SLMB and QI may be retroactive up to 3 months — meaning you could receive back payments if approved.
- The income exclusions ($20 of income, first $65 of wages, etc.) can make a difference in borderline cases; families should calculate carefully.
- Asset limits are relatively low ($9,950 for individuals, $14,910 for couples in 2026). Certain assets don't count (home, one vehicle, burial expenses), but savings and investments do count.

**Data shape:** This program consists of three separate tiers (QMB, SLMB, QI) with progressively higher income limits but different benefit levels. QMB is the most comprehensive (covers premiums and cost-sharing), while SLMB and QI cover only Part B premiums. QI has a critical gotcha: it's not an entitlement program and funding can run out mid-year. Income limits are tied to the federal poverty level and update annually in April. All three programs share the same asset limits and exclusions. Processing timelines differ: QMB has a 45-day maximum, while SLMB and QI can be retroactive. Utah uses federal standards but may have more generous standards in specific areas.

**Source:** https://medicaid.utah.gov/medicare-cost-sharing-programs/

---

### SNAP (Supplemental Nutrition Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (common for elderly), no gross income limit in Utah. Net income must be at or below 100% Federal Poverty Level (FPL). Examples: ~$1,580/month gross for one person (130% FPL reference, but not required); 2025 figures $15,060/year ($1,255/month) for one, $20,440/year ($1,703/month) for two. Deductions include 20% earned income, standard $209 (households 1-3), medical over $35/month for elderly/disabled, shelter/utilities.[1][2][3][5]
- Assets: Households with member 60+ or disabled: $4,500 countable resources (e.g., bank accounts). Exempt: home, vehicles, retirement savings, household goods, life insurance cash value (some states vary).[2][8]
- U.S. citizen or qualified non-citizen.
- Reside in Utah.
- Net income test after deductions.
- SSI recipients often categorically eligible.
- ESAP (Elderly Simplified Application Process) for easier application/recertification for elderly/disabled.[4]
- No work requirements for seniors 60+.[7]

**Benefits:** Monthly benefits loaded on EBT card for food purchases at authorized stores. Maximum: ~$291 for one-person household, ~$535 for two-person (2026; actual amount based on income/deductions, often less).[1]
- Varies by: household_size

**How to apply:**
- Online: Utah online application portal (jobs.utah.gov/myckb).
- Phone: State SNAP hotline (specific number via jobs.utah.gov or local office).
- In-person/mail: Local Department of Workforce Services office.
- Telephone interviews often available for elderly.[1][4]

**Timeline:** Not specified in sources; varies by office.

**Watch out for:**
- No gross income test for elderly/disabled households—many miss this and think they earn too much.[2]
- Higher deductions for medical/shelter key for seniors; track out-of-pocket medical >$35/month.[1][5]
- Assets up to $4,500 allowed for elderly (higher than $3,000 general); home/vehicles exempt.[2][8]
- ESAP simplifies recertification—elderly often qualify.[4]
- Include all who buy/prepare food in household.[3]
- Social Security/pensions count as income.[3]

**Data shape:** Elderly/disabled exemptions (no gross income test, higher asset limit $4500, ESAP); benefits scale by household size/income/deductions; statewide with local offices.

**Source:** https://jobs.utah.gov/customereducation/services/foodstamps/

---

### LIHEAP (Low-Income Home Energy Assistance Program) / HEAT Program in Utah

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross monthly income must be at or below 150% of the Federal Poverty Level[2][4]. For reference: a family of four making $3,750 or less monthly could qualify[4]. Specific income limits by household size from LIHEAP: 1 Person $1,956/month, 2 People $2,644/month, 3 People $3,331/month, 4 People $4,018/month, 5 People $4,707/month, 6 People $5,394/month[1]
- Assets: There is no asset limit for LIHEAP in Utah[1]
- Household must be responsible for paying home energy costs[2][3]
- Household must have at least one adult (18 years of age or older or emancipated)[2]
- Household must contain at least one U.S. citizen or qualified non-citizen[2]
- Applicant must be the person responsible for the utilities[3]

**Benefits:** Heating assistance: $190–$850 per benefit period; Cooling assistance: $190–$850 per benefit period; Crisis assistance (emergency situations like broken furnace or utility shutoff notice): up to $2,000[1]
- Varies by: household_size and fuel type

**How to apply:**
- In-person at local HEAT office[4]
- Phone: Contact your local HEAT office (specific numbers vary by region)[4]
- Online/mail: Apply through Utah Department of Workforce Services at mydoorway.utah.gov/utility-assistance/[4]

**Timeline:** Not specified in search results
**Waitlist:** Applications processed on rolling basis; program year runs October 1 – September 30 or when federal LIHEAP funds are exhausted, whichever comes first[2]

**Watch out for:**
- Application deadlines vary by household type: Priority applications (elderly 60+, disabled, children under 6) accepted October 1 – September 30; general public applications accepted November 1 – September 30[2]. Elderly applicants should apply early in the priority window
- LIHEAP household definition includes roommates covered by the same utility bill, even if expenses aren't shared—this differs from SNAP household definitions[1]
- Crisis assistance is only available for emergencies (broken furnace, utility shutoff notice), not routine assistance[1]
- Program funds are limited and distributed on first-come, first-served basis until exhausted each program year[2]
- Heating assistance typically available fall/winter; cooling assistance typically available summer; crisis assistance year-round[1]
- You must be responsible for paying utilities to qualify—renters whose landlord pays utilities may not qualify[3]
- Income limits are based on gross monthly income (before taxes), not net income[1]

**Data shape:** Utah's LIHEAP operates under the state name 'HEAT Program' (Home Energy Assistance Target). Benefits scale by household size and fuel type. The program has a defined program year (October 1 – September 30) with tiered application windows based on household vulnerability (elderly, disabled, young children receive priority). No asset limit exists, making this relatively accessible to asset-rich but income-poor households. Regional administration varies, with some areas served through MAG and others through state offices.

**Source:** jobs.utah.gov/housing/scso/seal/heat.html and mydoorway.utah.gov/utility-assistance/[2][4]

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross annual household income at or below 200% of the Federal Poverty Level (FPL). Exact dollar amounts vary by household size and year; check current FPL guidelines via HHS (not specified in sources for 2026). Alternative entry: current HEAT program recipient (requires 150% FPL for some crisis components). Income based on gross monthly without deductions.[1][2][3]
- Assets: No asset limits mentioned in sources.
- Household must include at least one adult who is a U.S. citizen or qualified non-citizen.[1]
- Home must have never been weatherized or weatherized more than 15 years ago; requires energy audit to confirm benefit.[2]
- For renters: notarized Weatherization Rental Agreement and landlord may pay portion of costs.[1][2]
- Proof of ownership or owner approval for renters/homeowners.[3]
- Priority to elderly, disabled, households with children under 6, and high energy users.[2][3]

**Benefits:** Professional weatherization services including computerized energy audits, advanced diagnostics, cost-effective home improvements (e.g., insulation, sealing, furnace/AC/water heater repairs), safety inspections, and indoor air quality checks. No direct cash; free for homeowners, partial landlord cost for renters. Year-round crisis help for furnaces, AC, water heaters if HEAT-qualified.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Contact county-specific agency by phone, mail, fax, email, or drop-off (7-8 regional agencies cover Utah).[1][2][3]
- Examples: BRAG (Box Elder, Cache, Rich: 95 W. 100 S. #116, Logan, UT 84321; (435) 752-7242); FCAOG (Beaver, Iron, Washington, Garfield, Kane: 2344 West Industry Way #2, Cedar City, UT 84721); MAG (weatherization@mountainland.org or 478 South Geneva Road, Vineyard, UT 84059); Utah Community Action (fax (801) 214-3208; mail to program address).[1][2][3]

**Timeline:** Not specified; application reviewed for eligibility, then prioritized and placed on waiting list.[1][2][3]
**Waitlist:** Yes, all approved applicants placed on waiting list based on priority (e.g., seniors, disabled, young children).[1][2][3]

**Watch out for:**
- Must contact specific county agency; not centralized statewide application.[1]
- Renters need landlord agreement and possible cost share; notarized form required.[1][2]
- Home must pass energy audit and not recently weatherized (within 15 years).[2]
- Priority-based waitlist means elderly qualify for precedence but still wait.[2][3]
- HEAT recipients get streamlined entry but must match names/citizenship.[3]
- U.S. citizen/qualified non-citizen adult required in household.[1]

**Data shape:** Administered via 7-8 county-specific agencies with unique contacts; priority tiers for elderly/disabled/kids; HEAT crossover eligibility; energy audit gatekeeps services.

**Source:** https://jobs.utah.gov/housing/scso/wap/how.html

---

### Utah State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[1][3][6]
- Assets: No asset limits or tests apply[1][3]
- Must be eligible for Medicare (or soon to be), or a family member/caregiver of a Medicare beneficiary[3][6]

**Benefits:** Free one-on-one counseling and assistance on Medicare options (Parts A, B, C, D), Medigap, Medicare Savings Programs, Extra Help/Low Income Subsidy, Medicaid applications, appeals, enrollment/disenrollment, long-term care insurance, and fraud prevention via Senior Medicare Patrol; also includes outreach presentations, education at health fairs, and community events[1][2][5][6][8]

**How to apply:**
- Phone: 1-800-541-7735[7][9]
- Website: https://daas.utah.gov/seniors/ or Utah-specific SHIP site via shiphelp.org[7][9]
- In-person: Available statewide through local affiliates like Mountainland Association of Governments (e.g., 586 East 800 North, Orem, UT 84097, 801-229-3819)[6][8]
- Face-to-face or telephone interactive sessions via local network[2][5]

**Timeline:** No formal application or processing time; services provided upon contact as counseling is immediate and free[2][3]

**Watch out for:**
- Not affiliated with insurance companies—provides unbiased advice only, does not sell plans or provide direct financial aid; no enrollment on-site for all plans (assists with process); contact 3 months before Medicare eligibility for best prep; separate from Medicare Savings Programs it helps apply for[3][4][5]

**Data shape:** no income/asset test; free counseling service statewide via local affiliates; focuses on education and application assistance rather than direct benefits

**Source:** https://daas.utah.gov/seniors/[7]

---

### Meals on Wheels (Home-Delivered Meals)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits or dollar amounts mentioned; some programs may request financial documents but income is not always a factor. Suggested contributions (e.g., $3.50 per meal in Davis County) help expand services but are voluntary.
- Assets: No asset limits mentioned.
- Homebound (unable to leave home without assistance)
- Unable to shop for food, prepare meals, or unable to do so without significant difficulty due to mobility challenges, disability, frailty, or risk
- Resident of the program's delivery zone or service area (varies by county/provider)
- Do not drive a vehicle (in some areas like Davis County)
- Priority given to isolated individuals

**Benefits:** Hot, nutritious midday (lunch) meals delivered 5 days per week (Monday-Friday, excluding holidays), providing one-third of recommended daily intake for older adults; includes protein, vegetables, fruit, grains, and milk; low-sodium, heart-healthy; meets special diet requirements; may include weekend meals (delivered Thursday/Friday in some areas); personal safety check-in during delivery.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA), senior center, or specific county provider (e.g., Davis County: daviscountyutah.gov/health/aging-and-adult-services/home-delivered-meals; Cache County: 435-755-1722; MAG Utah/Summit/Wasatch: 801-229-3802 or 435-654-4920)
- In-person assessment by program staff
- Phone referral (family can refer loved one)

**Timeline:** Varies; some process within a week, others longer if waitlist exists; assessment scheduled upon request, meals start soon after approval.
**Waitlist:** Possible in some programs, leading to longer processing.

**Watch out for:**
- Must live in specific delivery zone; verify coverage first or seek alternatives.
- Homebound status strictly assessed; car ownership or ability to leave home may disqualify.
- Client must be home for delivery (notify by 9 AM if absent); door often left unlocked for safety checks.
- Suggested contributions voluntary but support program expansion.
- No weekend/evening deliveries standard; medical/secondary meals have extra requirements.
- Family referrals allowed but eligibility verified directly with applicant.

**Data shape:** Decentralized by county/provider with local AAAs managing; no statewide income/asset tests; eligibility emphasizes homebound/mobility over finances; delivery zones create geographic patchwork.

**Source:** https://rules.utah.gov/publicat/code/r510-104/S510-104.htm (Utah Administrative Code R510-104, Nutrition Programs for the Elderly)

---

### Utah Caregiver Support Program (UCSP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits or financial eligibility requirements.[1][3][4]
- Assets: No asset limits mentioned in program rules or descriptions.[1][2][3]
- Family caregiver must be 18 years or older (adult family member or informal unpaid provider).[1][3]
- Care receiver: Older individual (60+ years) OR any age with Alzheimer's or related neurological disorder OR older relative (55+) caring for child <18 (not biological/adoptive parent) OR relative (55+, including parents) caring for adult 18-59 with disability, living with the child/adult.[1][3]
- Care receiver unable to perform 2+ Activities of Daily Living (ADLs) without substantial assistance OR requires substantial supervision due to cognitive impairment.[4][5]
- Caregiver must demonstrate medium-to-high risk score via DAAS-approved Demographic Intake and Screening tool, Assessment, and Caregiver Burden score.[2][4]
- Priority given to: (1) Caregivers who are older individuals with greatest social/economic need (low-income prioritized); (2) Caregivers providing care to persons with Alzheimer's/related disorders; (3) Caregivers 60+ caring for persons with mental retardation/developmental disabilities; (4) Grandparents/older relatives 55+ caring for child <18.[2]

**Benefits:** Respite (in-home, overnight, companion services), Case Management, Personal Care Aides, Adult Day Care, Information & Referral, Caregiver Support Groups, Training/Education, Counseling, Supplemental Services (e.g., Emergency Response System, grab bars, incontinence supplies), Homemaking, Home Health Aide. Core services (info, assistance, groups, training) available to all; respite/supplemental based on eligibility/stress index. No specific dollar amounts or hours stated; services funded under Older Americans Act, may provide set dollar amounts in some areas.[1][3][4][5][9]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Adult Services office (regional, e.g., Salt Lake County, Davis County, Weber/Morgan); phone examples: Salt Lake 801-468-2460, Davis 801-451-3377, Weber/Morgan 801-625-3866.[3][5]
- Website: https://magutah.gov/cgsupport/.[1]
- Intake and assessment required; no specific online form or statewide mail/in-person detailed beyond local offices.[1][2][3]

**Timeline:** Not specified in sources.
**Waitlist:** Yes, often has a waiting list due to insufficient funds; applicants maintained on list and served by risk/burden score order.[2][5]

**Watch out for:**
- No income test, but strict functional/cognitive needs for care receiver (2+ ADLs) and caregiver stress/burden score required—not automatic.[2][4][5]
- Priority tiers mean highest-need served first; others waitlisted.[2]
- Core services open to all caregivers; respite/supplemental only for those meeting criteria.[1][3][4]
- Not a paid caregiver program (unpaid family/informal caregivers supported via services, not wages).[1][6]
- Regional contacts needed—no single statewide application hotline/form.[5]

**Data shape:** No income/asset test; eligibility driven by caregiver burden score, care receiver ADL deficits, and priority tiers; regionally administered with waitlists; distinguishes core (universal) vs. respite/supplemental services.

**Source:** https://magutah.gov/cgsupport/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must be below 125% of the federal poverty level[2][6]. The search results do not provide specific dollar amounts or household-size tables. Families should contact their local SCSEP office to determine their exact threshold, as poverty guidelines vary by household size and are updated annually by the Department of Health and Human Services. Note: Social Security Disability Insurance (SSDI) is excluded from income calculations[4].
- Assets: Not specified in available search results.
- Must be unemployed[2][6]
- Must be legally eligible to work in the U.S.[1]
- Unable to find a job without assistance or after WIOA services[1]
- Maximum of 48 months in the program[1]
- Must be willing to provide community service and attend required meetings and training[3]
- Must be willing to develop a personalized Individual Employment Plan (IEP)[3]
- Must be willing to use all available resources for job searches and economic self-sufficiency[3]

**Benefits:** Paid on-the-job training at non-profit and government agencies. Participants work an average of 20 hours per week[5][6] and are paid the highest of federal, state, or local minimum wage[5][6]. Training assignments typically range from 6 to 12 months[8]. Participants also receive job search assistance, resume help, and interview skills practice[8]. In Utah specifically, SCSEP participants provided 223,406 hours of community service in the program year ending June 30, 2018[1].
- Varies by: fixed

**How to apply:**
- In-person: Contact your local SCSEP office (specific office locations and phone numbers not provided in search results)
- Phone: Call your local SCSEP office to inquire about application and enrollment
- Online: Check with local SCSEP providers for online application options (specific URLs not provided in search results)

**Timeline:** Not specified in available search results. One source notes that 'if you're eligible and there is no waiting list, you will be enrolled to train at a non-profit organization in your community'[2], suggesting enrollment can be immediate under certain conditions.
**Waitlist:** Waitlists may exist but are not guaranteed. Availability depends on local funding levels and participant slots[1][2]. As of 2025, some organizations experienced pauses or slowdowns in funding, while others received funding later and resumed services[2].

**Watch out for:**
- Income limits are tied to 125% of federal poverty level, which changes annually and varies by household size—families must verify current thresholds with their local office rather than assuming a fixed dollar amount[2][4][6]
- Program funding is in flux as of 2025, with some organizations experiencing pauses or slowdowns[2]. Applicants should confirm current availability in their area before assuming enrollment is possible.
- Maximum program duration is 48 months[1]—this is not an indefinite benefit
- Participants must be unemployed; those with any current employment may not qualify[2][6]
- The program prioritizes certain populations (veterans, age 65+, disabled, limited English proficiency, rural residents, homeless/at-risk)[1][4][6], which may affect enrollment timelines
- SCSEP is not available in all five counties in Utah[1], though the specific counties are not identified
- Positions must result in an increase in employment opportunities and cannot substitute for existing jobs or impair existing service contracts[3]
- Social Security Disability Insurance (SSDI) is excluded from income calculations, but other income sources count toward the 125% threshold[4]

**Data shape:** This program's structure is defined by: (1) a fixed age threshold (55+) with enrollment priority for those 65+; (2) a relative income limit (125% of poverty level) that varies annually and by household size, requiring individual verification; (3) fixed work hours (average 20/week) and wage structure (highest of federal/state/local minimum); (4) a maximum program duration (48 months); (5) geographic availability limited to all but five Utah counties; (6) funding volatility affecting regional availability; and (7) priority enrollment categories that may affect wait times. The program is employment-focused rather than needs-based, emphasizing job training and community service over direct financial assistance.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor) and https://www.utah.gov/pmn/files/488561.pdf (Utah state program information)

---

### Legal Services for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Gross annual household income at or below 125% of the Federal Poverty Guidelines (exact dollar amounts vary by household size and year; consult current FPL at aspe.hhs.gov/poverty-guidelines). Exceptions possible for incomes slightly above if deductions apply for child care, medical expenses, employment preparation, non-medical age/disability costs, taxes, or other factors affecting ability to afford legal help. Zero income claims accepted with verification of recent benefit termination or denial.
- Assets: Not specified in guidelines; financial eligibility focuses primarily on income, with case-by-case consideration of ability to afford services.
- Low-income determination under Utah Legal Services (ULS) guidelines for LSC-funded assistance.
- Legal issue must relate to senior needs such as health, housing, public benefits, entitlements, family, consumer issues, wills, or estates.
- Reside in served county (e.g., Salt Lake County for Senior Citizen Law Center).

**Benefits:** Legal counseling, representation, and advocacy in health, housing, public benefits/entitlements, family, consumer issues; volunteer attorney assistance for wills and estates via Senior Law Project.
- Varies by: region

**How to apply:**
- In-person at Senior Citizen Law Center (Salt Lake County, prefers new clients in person; open Tuesdays 5-8pm except holidays).
- Phone intake via Utah Legal Services regional offices (e.g., general contact through utahlegalservices.org).
- Contracted through Salt Lake County Aging and Adult Services for seniors 60+ in Salt Lake County.

**Timeline:** Not specified.

**Watch out for:**
- Income based on gross annual household income at 125% FPL, not net; exceptions require documentation.
- Not statewide—must confirm county provider.
- LSC-funded services limited to non-criminal civil matters; prefers in-person for some centers.
- Asset limits not primary but ability to pay considered case-by-case.
- Availability tied to funding and volunteer attorneys; clinics have limited hours.

**Data shape:** County-contracted with regional providers; income at 125% FPL with exceptions; no fixed asset table or statewide uniformity; tied to ULS guidelines for seniors 60+.

**Source:** https://www.utahlegalservices.org/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Utah Medicaid Aging Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | medium |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Utah State Health Insurance Assistance P | resource | federal | simple |
| Meals on Wheels (Home-Delivered Meals) | benefit | federal | medium |
| Utah Caregiver Support Program (UCSP) | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Services for Seniors | resource | local | simple |

**Types:** {"benefit":8,"resource":2,"employment":1}
**Scopes:** {"state":2,"local":2,"federal":7}
**Complexity:** {"deep":7,"medium":2,"simple":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/UT/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **insurance_status**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size and fuel type**: 1 programs
- **not_applicable**: 1 programs
- **region**: 2 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Utah Medicaid Aging Waiver**: Tailored services via case management/NFLOC tiers rather than fixed dollars/hours; annual March income adjustments; home-based only (vs. institutional alternatives); AAA regional referral entry points.
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE is a national Medicare/Medicaid program with state-by-state availability. Utah does not currently participate. The program is highly targeted to frail elderly (average participant is 76 years old with multiple complex conditions[3]). No income or asset testing for eligibility, but financing constraints may create waitlists. Benefits structure depends on dual vs. single insurance eligibility. Geographic availability is the primary limiting factor for Utah residents.
- **Medicare Savings Programs (QMB, SLMB, QI)**: This program consists of three separate tiers (QMB, SLMB, QI) with progressively higher income limits but different benefit levels. QMB is the most comprehensive (covers premiums and cost-sharing), while SLMB and QI cover only Part B premiums. QI has a critical gotcha: it's not an entitlement program and funding can run out mid-year. Income limits are tied to the federal poverty level and update annually in April. All three programs share the same asset limits and exclusions. Processing timelines differ: QMB has a 45-day maximum, while SLMB and QI can be retroactive. Utah uses federal standards but may have more generous standards in specific areas.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled exemptions (no gross income test, higher asset limit $4500, ESAP); benefits scale by household size/income/deductions; statewide with local offices.
- **LIHEAP (Low-Income Home Energy Assistance Program) / HEAT Program in Utah**: Utah's LIHEAP operates under the state name 'HEAT Program' (Home Energy Assistance Target). Benefits scale by household size and fuel type. The program has a defined program year (October 1 – September 30) with tiered application windows based on household vulnerability (elderly, disabled, young children receive priority). No asset limit exists, making this relatively accessible to asset-rich but income-poor households. Regional administration varies, with some areas served through MAG and others through state offices.
- **Weatherization Assistance Program**: Administered via 7-8 county-specific agencies with unique contacts; priority tiers for elderly/disabled/kids; HEAT crossover eligibility; energy audit gatekeeps services.
- **Utah State Health Insurance Assistance Program (SHIP)**: no income/asset test; free counseling service statewide via local affiliates; focuses on education and application assistance rather than direct benefits
- **Meals on Wheels (Home-Delivered Meals)**: Decentralized by county/provider with local AAAs managing; no statewide income/asset tests; eligibility emphasizes homebound/mobility over finances; delivery zones create geographic patchwork.
- **Utah Caregiver Support Program (UCSP)**: No income/asset test; eligibility driven by caregiver burden score, care receiver ADL deficits, and priority tiers; regionally administered with waitlists; distinguishes core (universal) vs. respite/supplemental services.
- **Senior Community Service Employment Program (SCSEP)**: This program's structure is defined by: (1) a fixed age threshold (55+) with enrollment priority for those 65+; (2) a relative income limit (125% of poverty level) that varies annually and by household size, requiring individual verification; (3) fixed work hours (average 20/week) and wage structure (highest of federal/state/local minimum); (4) a maximum program duration (48 months); (5) geographic availability limited to all but five Utah counties; (6) funding volatility affecting regional availability; and (7) priority enrollment categories that may affect wait times. The program is employment-focused rather than needs-based, emphasizing job training and community service over direct financial assistance.
- **Legal Services for Seniors**: County-contracted with regional providers; income at 125% FPL with exceptions; no fixed asset table or statewide uniformity; tied to ULS guidelines for seniors 60+.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Utah?
