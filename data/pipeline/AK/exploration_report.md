# Alaska Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 7.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 13 |
| New (not in our data) | 9 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 8 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Varies by program: QMB covers premiums, deductibles, coinsurance, and copayments for Parts A and B; SLMB and QI cover Part B premiums only ($202.90/month in 2026)` ([source](https://www.medicare.gov/basics/costs/help/medicare-savings-programs))
- **source_url**: Ours says `MISSING` → Source says `https://www.medicare.gov/basics/costs/help/medicare-savings-programs`

### Low Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$2,443` ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating assistance (fuel, firewood, electric bills) and crisis assistance for households with shut-off notices, less than 5 gallons of heating fuel, medical needs, or homes with seniors 60+ or children 5 and younger. Weatherization assistance also available[1]. Benefit amounts are determined by household income, household size, vendor type, housing type, and geographic location[2].` ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/`

### Alaska Legal Services Corporation (ALSC) Senior Legal Hotline

- **income_limit**: Ours says `$2500` → Source says `$24,938` ([source](https://www.alsc-law.org/elder-advocacy/))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Legal assistance and advice, court/administrative representation, referrals; community education/training via clinics/outreach. Specific senior areas: Income maintenance (Alaska Senior Assistance, Social Security, SSI, Adult Public Assistance, Food Stamps), housing (landlord/tenant, public housing, assisted living, nursing homes), health care (Medicaid, Medicare, Long-Term Care, PCA program). No specified dollar amounts or hours.[7]` ([source](https://www.alsc-law.org/elder-advocacy/))
- **source_url**: Ours says `MISSING` → Source says `https://www.alsc-law.org/elder-advocacy/`

### Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://akoltco.org))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Complaint investigation and resolution; resident rights education; facility monitoring and regular visits; support for family and resident councils; advocacy before government agencies; guidance on regulatory complaints; public policy recommendations; community outreach and training for providers and families.` ([source](https://akoltco.org))
- **source_url**: Ours says `MISSING` → Source says `https://akoltco.org`

## New Programs (Not in Our Data)

- **Medicaid for Seniors/Disabled** — service ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/apply-for-medicaid/))
  - Shape notes: Varies by LTC vs non-LTC, marital status, working status; APA auto-links to Medicaid; strict asset test + NFLOC for seniors/disabled LTC; annual changes (2026 limits apply).
- **Home and Community-Based Services Waiver** — service ([source](https://health.alaska.gov/en/services/hcbs-waivers/))
  - Shape notes: Multiple distinct waivers under HCBS umbrella (5 total), each with unique age/disability focus, services, and waitlist rules; requires NFLOC + Medicaid; services provider-dependent by location; no fixed benefit amounts
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-elderly (federal); Alaska DHSS Medicaid: https://healthymedicaid.ak.gov (state contact for LTSS)))
  - Shape notes: No operational programs in Alaska (unique barrier: zero centers/providers); eligibility non-financial but tied to unavailable service areas; Medicaid financials apply indirectly for full coverage; national model, state-administered with no AK-specific PACE data
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/[3]))
  - Shape notes: Elderly/disabled special rules: higher gross limit (200% FPL), asset $4,500, medical/shelter deductions; ESAP simplifies process for all-adult 60+/disabled households; benefits scale by household size/net income; statewide via DPA offices.
- **Weatherization Assistance Program** — service ([source](https://www.ahfc.us/efficiency/weatherization))
  - Shape notes: Delivered via regional sub-grantees with priority tiers; 15-year repeat restriction; DOE-funded with state supplement for higher incomes; no age minimum but elderly priority.
- **State Health Insurance Assistance Program (SHIP)** — service ([source](https://health.alaska.gov/en/senior-and-disabilities-services/medicare-office/))
  - Shape notes: no income/asset test; open to all Medicare-eligible plus families/caregivers; counseling-only service via statewide office with local delivery network; no waitlists or caps
- **Meals on Wheels (Senior Meals Program)** — service ([source](https://health.alaska.gov/ (Alaska DHSS for state regulations); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/[1][2]))
  - Shape notes: Decentralized by region with different providers (e.g., Salvation Army in Anchorage, senior centers elsewhere); no statewide income/asset tests; varies by home-delivered vs. congregate; doctor's note for home-delivery in some areas only
- **Alzheimer's Family Caregiver Support Program** — service ([source](https://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx))
  - Shape notes: Dual structure: CSRCP (diagnosis + financial test) and NFCSP (age-based, no min caregiver age); local grantees vary services; no service caps but supplemental limited; income/asset limits exist without published tables
- **Senior Community Service Employment Program (SCSEP) / Mature Alaskans Seeking Skills Training (MASST)** — employment ([source](https://labor.alaska.gov/masst/about-masst.htm))
  - Shape notes: SCSEP in Alaska (MASST) is a federally administered program with a fixed benefit structure (20 hours/week at minimum wage) and a hard 48-month lifetime cap. Eligibility is income-based (125% poverty level) with no asset limits specified. The program operates statewide through regional coordinators but specific regional variations in processing time, waitlists, or service availability are not documented in available sources. Application methods and processing timelines are not detailed in the search results and require direct contact with the administering agency.

## Program Details

### Medicaid for Seniors/Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For long-term care (Nursing Home or HCBS Waivers): Single applicant under $2,982/month (2026). For non-LTC Aged/Blind/Disabled (ABD) via Adult Public Assistance (APA): Approximately $1,845/month for single individual (2026). Limits vary by marital status and program; couples have higher thresholds (e.g., assets up to $3,000). APA-related Medicaid auto-qualifies if eligible. Working Disabled Buy-In allows higher income if working and disabled.[1][2][3][9]
- Assets: Long-term care: $2,000 for single, $3,000 for couple (2026). ABD/APA: Similar low resource limits ($2,000 individual). Counts: Cash, bank accounts, investments, second vehicles/homes. Exempt: Primary home (with equity limits/estate recovery), one vehicle, personal belongings, burial plots, life insurance (certain limits). Home excluded but subject to estate recovery post-death.[1][6]
- U.S. citizen or qualified non-citizen.
- Nursing Facility Level of Care (NFLOC) for long-term care Nursing Home/HCBS Waivers; functional ADL need for Regular Medicaid LTC.
- Disability meeting Social Security standards (for under 65 disabled) or age 65+.
- Not eligible for Medicare in some pathways (exceptions for parents/caretakers).
- APA benefits auto-qualify for Medicaid; SSI applicants must apply for SSI if income < SSI standard.

**Benefits:** Medical coverage including doctor visits, hospital care, prescription drugs, long-term services: Nursing home care, HCBS Waivers (home health, personal care, adult day care, home modifications), Medicare premiums/cost-sharing for dual eligibles. No specific dollar/hour limits stated; covers full scope for qualified enrollees.
- Varies by: priority_tier

**How to apply:**
- Online: my.alaska.gov or HealthCare.gov
- Phone: Toll-free (number via pre-screening tool at health.alaska.gov; call to schedule)
- Mail/Fax: To local Division of Public Assistance (DPA) office
- In-person: Local DPA office for appointment

**Timeline:** Lengthy and complicated process; no specific timeline stated (can take weeks to months)
**Waitlist:** Possible for HCBS Waivers due to limited slots; Nursing Home may have no waitlist but provider availability varies.

**Watch out for:**
- Multiple programs (Nursing Home, HCBS Waivers, Regular Medicaid, APA-related, Working Disabled Buy-In) with different income/asset/functional criteria; not one-size-fits-all.
- Asset limits very low ($2,000 single); Medicaid planning needed if over (e.g., spend-down, exemptions).
- Estate recovery on home after death.
- Must meet NFLOC for LTC; application complex/lengthy—use pre-screening tool first.
- Working disabled have separate Buy-In with higher income allowance but premiums possible.
- Over income/asset? Still pathways via planning or alternative eligibility.

**Data shape:** Varies by LTC vs non-LTC, marital status, working status; APA auto-links to Medicaid; strict asset test + NFLOC for seniors/disabled LTC; annual changes (2026 limits apply).

**Source:** https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/apply-for-medicaid/

---

### Home and Community-Based Services Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Income: Medicaid income and resource limits apply, determined by Division of Public Assistance (DPA) interview and application. Specific 2026 dollar amounts and household size tables not detailed in sources; varies by Medicaid category (e.g., aged, disabled). Use DPA for current thresholds.
- Assets: Medicaid resource limits apply via DPA. Primary residence exempt if applicant intends to return. Assets sold/given away under fair market value within 60 months trigger Look-Back Rule penalty period. Exact 2026 limits not specified; consult DPA.
- Alaska resident
- Medicaid eligible
- Nursing Facility Level of Care (NFLOC) via functional assessment (Consumer Assessment Tool for ALI; in-person or video; requires substantial medical care or extensive help with 3+ ADLs like eating, mobility, toileting, or combinations with behavior/cognition)
- Program-specific: ALI (65+ or physical disability 21-64); APDD (21+ developmental disabilities + NFLOC); CCMC (under 22 complex medical); IDD (developmental disabilities); ISW (developmental disabilities, cost cap agreement)

**Benefits:** Program-specific: ALI (adult day, care coordination, respite, adult host home, environmental mods, meals, residential supported living, specialized medical equipment, private duty nursing, transportation); APDD (adult day, care coordination, day habilitation, employment services, residential habilitation, respite, adult host home, environmental mods, intensive active treatment, meals, nursing, residential supported living, specialized equipment/nursing, transportation); ISW (care coordination, day habilitation, employment, residential habilitation, respite, adult host home, intensive treatment, transportation). Services planned by team, approved via support plan. No fixed dollar/hour amounts; individualized.
- Varies by: priority_tier

**How to apply:**
- Contact Division of Public Assistance (DPA) for Medicaid eligibility (no specific phone/URL listed; search health.alaska.gov)
- Care coordinator assists with NFLOC assessment via Division of Senior and Disabilities Services (SDS) Intake/Assessment Unit
- For IDD: Join waitlist first, then selected (50 annually) get care coordinators list
- No specific online URL, phone, mail, or in-person details; start with SDS/DPA

**Timeline:** State schedules NFLOC assessment within 30 days of care coordinator submitting completed application.
**Waitlist:** IDD (50 selected annually from waitlist); ISW (waitlist starts when participant limit reached)

**Watch out for:**
- Multiple waivers (ALI for elderly/physical disability; others for developmental disabilities/children); families must select correct one
- Must meet both Medicaid financial + NFLOC; applying over limits causes denial
- Waitlists for IDD/ISW; not immediate access
- Look-Back Rule: Asset transfers penalized
- Services depend on local providers; may vary in rural areas
- Disabled adults on ALI continue post-65 under aged category

**Data shape:** Multiple distinct waivers under HCBS umbrella (5 total), each with unique age/disability focus, services, and waitlist rules; requires NFLOC + Medicaid; services provider-dependent by location; no fixed benefit amounts

**Source:** https://health.alaska.gov/en/services/hcbs-waivers/

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits or financial criteria for PACE eligibility itself. However, for full coverage without premiums, dual eligibility for Medicare and Medicaid is common (~90% of participants); Alaska Medicaid long-term care requires income under $2,901/month (300% FBR in 2025) and assets ≤$2,000 (excluding primary home) for seniors needing nursing home level of care[2].
- Assets: No asset limits for PACE eligibility. Alaska Medicaid long-term care (for full coverage) limits countable assets to $2,000 (exempt: primary home, one vehicle, personal belongings, burial plots; countable: bank accounts, secondary properties, investments)[2].
- Live in the service area of an Alaska PACE organization (none currently operating statewide)
- Certified by Alaska as needing nursing home level of care (NFLOC: extensive help with ≥2-3 ADLs like bathing, dressing, eating, toileting, transferring, walking)
- Able to live safely in the community with PACE services support
- Not enrolled in Medicare Advantage, Medicare prescription drug plan, hospice, or certain other programs
- US citizen or 5-year legal resident for Medicare (if applicable)[1][2][5]

**Benefits:** Comprehensive all-inclusive care: primary/acute medical care, prescription drugs, hospitalization, social services, restorative therapies (PT/OT/speech), home care (personal care aides, homemaker, respite), adult day health center attendance (typically 3+ days/week with meals/transport), dental/vision/hearing, palliative care; no copays/deductibles for enrollees; covers all Medicare/Medicaid benefits plus extras to prevent nursing home placement[1][4][5].
- Varies by: region

**How to apply:**
- No active PACE programs in Alaska; contact Alaska Department of Health for updates (no specific PACE phone/website found; general Medicaid: 907-465-3300 or healthymedicaid.ak.gov)
- Process via state-designated PACE organization if one exists (national model: call local PACE center for assessment)

**Timeline:** Not specified for Alaska; national model varies by program (weeks to months for assessment/certification)
**Waitlist:** Possible due to capped financing/enrollment; varies by program availability (none in AK currently)

**Watch out for:**
- No active PACE programs operating in Alaska—families cannot enroll currently; confirm with state for new developments
- Must live in a PACE service area (zero in AK); NFLOC certification by Alaska required (state-specific ADL/function criteria)
- Private pay option exists via monthly premium if not Medicaid-eligible, but no providers available
- Disenrollment from Medicare Advantage/hospice required; PACE becomes sole Medicare/Medicaid source
- Not a financial aid program—focuses on services; Medicaid planning may be needed for coverage[1][2][4][6]

**Data shape:** No operational programs in Alaska (unique barrier: zero centers/providers); eligibility non-financial but tied to unavailable service areas; Medicaid financials apply indirectly for full coverage; national model, state-administered with no AK-specific PACE data

**Source:** https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-elderly (federal); Alaska DHSS Medicaid: https://healthymedicaid.ak.gov (state contact for LTSS)

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: {"note":"Alaska has higher limits than the 48 contiguous states. All programs include a $20/month general income disregard. Income limits are adjusted annually.","2026_alaska_limits":{"QMB":{"individual_monthly":"$1,663","couple_monthly":"$2,247","basis":"100% of Federal Poverty Guidelines"},"SLMB":{"individual_monthly":"100-120% FPL (approximately $1,663-$1,995)","couple_monthly":"100-120% FPL (approximately $2,247-$2,696)","basis":"Between 100-120% of Federal Poverty Level"},"QI":{"individual_monthly":"120-135% FPL (approximately $1,995-$2,245)","couple_monthly":"120-135% FPL (approximately $2,696-$3,032)","basis":"Between 120-135% of Federal Poverty Level"}},"reference_note":"2025 federal limits for Alaska were $1,663 individual/$2,247 couple for QMB[7]. 2026 limits not explicitly stated in search results but follow same percentage-of-FPL structure."}
- Assets: {"QMB_SLMB_QI":{"individual":"$9,950","couple":"$14,910","note":"Alaska uses federal limits; some states apply more liberal criteria[4]"},"what_counts":"Liquid assets, savings, investments, and other countable resources","what_does_not_count":["Primary home (house or mobile home)[1]","One vehicle[1]","Household items and personal effects[1]","Engagement and wedding rings[1]","Burial plots[1]","Burial expenses up to $1,500[1]","Life insurance with cash value below $1,500[1]","Some Native corporation stocks held by Alaska Native people[1]"],"income_exclusions":["First $20 of monthly income[1]","First $65 of wages earned per month[1]","Half of wages earned after the initial $65 is deducted[1]","Food stamps[1]","Settlement payments to eligible Native American landowners[1]","Funds received by Native Americans from the Claims Resolution Act of 2010 (Cobell v. Salazar)[1]"]}
- Must be enrolled in Medicare Part A[1]
- Must be a resident of Alaska[1]
- For SLMB and QI: Must have both Part A and Part B[6]
- For QI: Cannot receive QI benefits if you qualify for Medicaid[4]
- For QI: Limited funding; first-come, first-served basis[4]

**Benefits:** Varies by program: QMB covers premiums, deductibles, coinsurance, and copayments for Parts A and B; SLMB and QI cover Part B premiums only ($202.90/month in 2026)
- Varies by: program_tier

**How to apply:**
- In-person: Local medical assistance office (specific Alaska locations not provided in search results)[4]
- Phone: 1-877-486-2048 (CMS national line; can confirm QMB Program enrollment)[5]
- Mail: Contact your local medical assistance office for mailing address
- Online: Contact your state Medicaid office for online application options (specific URL not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** QI program only: Limited funding; first-come, first-served basis until annual appropriation runs out; priority given to individuals who received QI the previous year[4]

**Watch out for:**
- QI program has limited funding and operates on first-come, first-served basis — once annual appropriation runs out, even eligible individuals will not be accepted[4]
- QI applicants cannot receive benefits if they qualify for Medicaid[4]
- SLMB and QI only cover Part B premiums, not deductibles or coinsurance like QMB does[4][6]
- You must already be enrolled in Medicare Part A to apply; these programs do not help you enroll in Medicare[1]
- Income limits include a $20/month disregard, but this is already built into the stated limits[2]
- Unlike QI, SLMB beneficiaries do not have to reapply each year[3]
- Alaska's income limits are significantly higher than the 48 contiguous states due to higher cost of living — families should use Alaska-specific limits, not national limits[7]
- Some states (including Alaska) may apply more liberal income and resource criteria than federal minimums — contact Alaska state office to confirm[4]
- Automatic Extra Help for prescription drugs is included with QMB and SLMB, but this is often overlooked by applicants[4][6]

**Data shape:** This program consists of three separate tiers (QMB, SLMB, QI) with progressively higher income limits but decreasing benefits. QMB is the most comprehensive but has the lowest income threshold. SLMB and QI cover only Part B premiums but serve those with slightly higher incomes. Alaska has distinct income limits higher than the national standard. QI has a critical gotcha: limited annual funding with first-come, first-served enrollment. All three programs automatically qualify beneficiaries for Extra Help with prescription drug costs. Income and asset limits are adjusted annually and vary slightly by state.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.medicare.gov/basics/costs/help/medicare-savings-programs

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: For households with a member 60+ or disabled (relevant for elderly loved ones): Gross income limit at 200% FPL (Oct 1, 2025-Sep 30, 2026): 1 person $3,258/month; 2 $4,406; 3 $5,552; 4 $6,698; 5 $7,846; 6 $8,992; 7 $10,138; +$1,146 each additional. If over gross, qualify via net income test. Deductions include 20% earned income, standard $358 (1-5 people)/$374 (6+), medical >$35 for 60+/disabled, shelter/utility up to $1,189, dependent care[2][3].
- Assets: Most households: $3,000. Households with 60+ or disabled: $4,500. Exempt: primary home/lot, household goods, burial plots, life insurance cash value, retirement/pension accounts, income-producing property, 529 plans, vehicles (equity <$1,500 or exempt use)[3].
- Alaska resident[3][5].
- U.S. citizen or qualified immigrant[5].
- Household: those who live together, buy/prepare food together (parents + kids ≤21 one household; independent minors ok)[3].
- Work rules: Most 16-59 able-bodied register for work, accept jobs, not quit; ABAWDs 18-54 limited to 3 months/36 unless working/training/volunteering 20+ hrs/week (exemptions for elderly/disabled)[3].
- ESAP for households all adults 60+/disabled: 36-month certification, no interim report, no recert interview unless issues (Dec 1, 2024-Nov 30, 2029). Report changes: no longer all 60+/disabled, adult starts work, lottery/gambling ≥$4,500[1].

**Benefits:** Monthly EBT card for eligible food at stores/farmers markets. Amount based on net income (~$100 more net income = $30 less benefits); min/max by household size (exact varies; seniors/disabled get medical/shelter deductions boosting amount)[2][3][5].
- Varies by: household_size

**How to apply:**
- Online: MyAlaska (health.alaska.gov/dpa or implied MyAlaska portal)[3][5].
- Phone: Virtual Contact Center 800-478-7778[1][5].
- Mail: Download fillable PDF or request mailed app from Food Bank of Alaska or DPA[5].
- In-person: Local Division of Public Assistance office[1].
- Food Bank of Alaska assistance/outreach[5].

**Timeline:** Not specified in sources; ESAP simplifies recert to 36 months[1].

**Watch out for:**
- Elderly/disabled households over gross income can still qualify via net/asset tests[2].
- ESAP only if ALL adults 60+/disabled; report changes promptly[1].
- Alaska expanded beyond federal (higher gross limit); other sites may show stricter rules[2].
- Assets exempt widely but check vehicles/equity[3].
- Work rules exempt elderly but apply if younger household members[3].
- Max shelter deduction $1,189; utility allowances vary by paid utilities[2][3].

**Data shape:** Elderly/disabled special rules: higher gross limit (200% FPL), asset $4,500, medical/shelter deductions; ESAP simplifies process for all-adult 60+/disabled households; benefits scale by household size/net income; statewide via DPA offices.

**Source:** https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/[3]

---

### Low Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Household gross income must be at or below 150% of the Federal Poverty Level[1][4]. FY 2026 income guidelines by household size: 1 person = $2,443/month; 2 people = $3,303/month; 3 people = $4,162/month; 4 people = $5,023/month; 5 people = $5,883/month; 6 people = $6,742/month; each additional person = add $860/month[4]. Note: Some tribal providers (e.g., Aleutian Pribilof Islands Association) use 60% of State Median Income instead, which is more restrictive[6].
- Assets: Not specified in available documentation
- Must have at least $200 in out-of-pocket heating costs per year[4][5]
- Residency requirements vary by provider: some programs require residency in specific communities (e.g., Bethel for Native Council program[1]; Akutan, Atka, False Pass, King Cove, Nelson Lagoon, Nikolski, Sand Point, St. George, St. Paul, or Unalaska for Aleutian Pribilof Islands Association[6])
- Residents in subsidized housing (ASHA, AVCP, BNC housing) are not eligible in some programs[1]
- Some tribal programs require at least one household member to be Alaska Native or American Indian, documented by tribal card, tribal enrollment letter, or Certificate of Indian Blood (CIB)[6]
- Non-enrolled tribal citizens in some communities must apply directly through the State of Alaska[2]

**Benefits:** Heating assistance (fuel, firewood, electric bills) and crisis assistance for households with shut-off notices, less than 5 gallons of heating fuel, medical needs, or homes with seniors 60+ or children 5 and younger. Weatherization assistance also available[1]. Benefit amounts are determined by household income, household size, vendor type, housing type, and geographic location[2].
- Varies by: household_size, region, housing_type, vendor_type

**How to apply:**
- Online application (available through state website)[5]
- Phone: Contact local Public Assistance office or email liheap@alaska.gov[5]
- In-person: WIC offices, senior centers, or local Public Assistance offices[5]
- Mail: Applications can be submitted by mail to local Public Assistance offices
- Tribal providers: Direct application through specific tribal organizations (e.g., Sitka Tribe of Alaska, Aleutian Pribilof Islands Association, Native Council of Bethel)

**Timeline:** Complete applications processed within 45 days[2]. Sitka Tribe of Alaska provides Notice of Decision within 30 days of receipt[3].
**Waitlist:** Application windows vary by provider and priority status. THRHA accepts applications November 1st for disabled or 60+ clients, December 1st for general public through June 30, 2026[2]. State program now accepting applications through August[5].

**Watch out for:**
- Income limits vary significantly by provider: 150% of Federal Poverty Level (most programs) vs. 60% of State Median Income (Aleutian Pribilof Islands Association), making the latter substantially more restrictive[6]
- Residents in subsidized housing may be ineligible depending on the program[1]
- Non-enrolled tribal citizens may be required to apply through State of Alaska rather than tribal providers, potentially affecting processing time and benefit amounts[2]
- Social Security income is NOT counted by some tribal providers (e.g., Aleutian Pribilof Islands Association), which can significantly increase benefit eligibility for seniors[6]
- Program requires proof of at least $200 in annual out-of-pocket heating costs; households below this threshold are ineligible regardless of income[4][5]
- Application windows are time-limited and vary by provider and priority status (e.g., seniors and disabled individuals may have earlier application windows)[2]
- Benefit amounts are highly variable and depend on multiple factors (income, household size, housing type, vendor type, geographic location), so two similar households may receive different amounts[2][5]
- Categorical eligibility can streamline the application process by removing income verification requirements, but it does not guarantee eligibility[7]
- Seasonal and fishing income are counted differently: seasonal income is averaged over 12 months[6]

**Data shape:** LIHEAP is a complex, multi-provider program with significant regional variation. Benefits scale by household size and income, but also by housing type, vendor type, and geographic location. Income thresholds vary by provider (150% vs. 60% of poverty/median income). Application windows are time-limited and prioritize seniors and disabled individuals. Some tribal providers exclude Social Security income, creating different eligibility outcomes for the same household. Non-enrolled tribal citizens face different application routes. Processing times range from 30-45 days depending on provider. The program is currently fully operational as of April 2026 after federal government reopening.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households must have income at or below 100% of area median income (AMI), issued annually by AHFC. Federal DOE limits as of 4/10/2025 (statewide): 1 person $39,100; 2 $52,860; 3 $66,620; 4 $80,380; 5 $94,140; 6 $107,900; 7 $121,660; 8 $135,420. Limited state funding allows slightly higher limits.[1][7]
- Assets: No asset limits mentioned in program guidelines.[1][2][3]
- Home cannot have received weatherization services from any grantee in the last 15 years.[2][7]
- Priority to elderly (60+), disabled, households with children under 6, and those most in need.[1][6]
- Homeowners and renters eligible; no Native/non-Native restriction.[3][4][7]
- Cannot have received AHFC Home Energy Rebate after May 1, 2008, or Weatherization after April 14, 2008 if also seeking rebate.[3][5]

**Benefits:** Free weatherization services including caulking/weather stripping, advanced air sealing, furnace efficiency/health/safety modifications (e.g., burner replacement, venting fixes, ignition systems), programmable thermostats, insulation, furnace/hot water heater replacement, door/window repairs/replacement, ventilation/moisture control, smoke/CO detectors, fire extinguishers. Up to $4,000 per unit for 1-4 unit buildings ($3,000 for 5+ units).[1][2][3][7]
- Varies by: priority_tier

**How to apply:**
- Contact local weatherization service provider by region (e.g., RurAL CAP for Anchorage, Tlingit-Haida Regional Housing Authority for Juneau, Cook Inlet Housing Authority, Alaska CDC, Association of Alaska Housing Authorities providers).[2][3][4][5][7]
- AHFC website: https://www.ahfc.us/efficiency/weatherization for providers and income limits.[4]
- Mail/fax examples: THRHA (5446 Jenkins Drive, Juneau, AK 99801; Fax 907-780-3539); check provider-specific.[3]
- No statewide phone listed; contact regional providers directly.

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; priority-based selection may imply wait times.[5][6]

**Watch out for:**
- Home ineligible if weatherized in last 15 years by any grantee.
- Incompatible with AHFC Home Energy Rebate post-2008 dates.
- Must contact specific regional provider, not AHFC directly.
- Priority to elderly/disabled/young children; others may wait longer.
- Income limits annual and area-specific; verify current via provider.
- All adults must sign with SSN; missing docs delay processing.

**Data shape:** Delivered via regional sub-grantees with priority tiers; 15-year repeat restriction; DOE-funded with state supplement for higher incomes; no age minimum but elderly priority.

**Source:** https://www.ahfc.us/efficiency/weatherization

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to anyone eligible for Medicare (typically age 65+ or under 65 with certain disabilities), family members, and caregivers. Also supports those with limited incomes or dually eligible for Medicare/Medicaid, but no specific dollar thresholds apply for SHIP access itself[1][2][5]
- Assets: No asset limits or tests[1][2]
- Medicare eligibility (current or soon-to-be)
- Family members and caregivers of Medicare beneficiaries also qualify
- No residency restrictions beyond Alaska state program access[1][2][5]

**Benefits:** Free one-on-one counseling and assistance on Medicare coverage options (Parts A, B, C, D), Medigap, Medicare Savings Programs, Extra Help/Low-Income Subsidy, Medicaid applications, appeal rights, long-term care insurance, and fraud prevention via Senior Medicare Patrol (SMP). Includes in-person, phone, or virtual sessions; public education presentations; outreach at health fairs and events. No dollar amounts, fixed hours, or in-kind benefits—unlimited personalized help as needed[1][2][3][4][8][10]

**How to apply:**
- Phone: 1-800-478-6065 (in-state toll-free), TTY: 1-800-770-8973, Anchorage/direct: 907-269-3680
- Email: doh.mio.info@alaska.gov
- Website: https://health.alaska.gov/en/senior-and-disabilities-services/medicare-office/ or https://dhss.alaska.gov/pages/default.aspx (Alaska DHSS)
- In-person or local counseling: Schedule via phone; network of local sites via state partnerships
- National locator: shiphelp.org for Alaska-specific contacts[5][6][7][8]

**Timeline:** Immediate counseling available upon contact; no formal application processing as it's not enrollment-based[1][5]

**Watch out for:**
- Not a healthcare or financial aid program—provides counseling only, not direct payment or treatment
- Must be Medicare-related; won't help with non-Medicare insurance
- Services are free but rely on appointments; contact early (e.g., 3 months before Medicare starts)
- People miss that family/caregivers can access without being beneficiaries themselves
- Out-of-state callers use Anchorage number[1][2][5][8]

**Data shape:** no income/asset test; open to all Medicare-eligible plus families/caregivers; counseling-only service via statewide office with local delivery network; no waitlists or caps

**Source:** https://health.alaska.gov/en/senior-and-disabilities-services/medicare-office/

---

### Meals on Wheels (Senior Meals Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; income is not a factor in determining eligibility[3][4][8]
- Assets: No asset limits mentioned in available sources
- Physically limited in ability to independently carry out activities of daily living, such as mobility challenges making it hard to shop for food, prepare meals, or socialize[1][3]
- For home-delivered meals in some areas (e.g., North Slope), doctor's note stating homebound or disabled[8]
- Complete client profile or application[3][5][8]

**Benefits:** Home-delivered hot meals (daily, with frozen meals for weekends/holidays in some areas); congregate/group meal sites with hot nutritious lunch; each meal contains one-third of daily nutritional requirements; opportunities for socialization[3][4][8]
- Varies by: region

**How to apply:**
- Phone: Salvation Army Anchorage (907) 349-0613[3]
- Phone: Fairbanks Senior Center (907) 452-1735[5]
- Phone: North Slope Borough Senior Program (907) 852-0276[8]
- In-person: Complete client profile at meal site (e.g., Cook Inlet Housing, 9131 Centennial Circle, Anchorage)[3]
- Forms: MOW and Nutritional forms (Fairbanks, write-able PDFs)[5]
- Contact local provider for assessment and exact steps; referrals from doctor or social worker may be required[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Eligibility and requirements vary significantly by local provider and region (e.g., doctor's note required in North Slope but not mentioned elsewhere)[8]
- Meals may be free with suggested donations, but confirm with local provider as payment could be on sliding scale[1]
- Primarily for those 60+ with mobility/physical limitations; not automatic for all seniors[1][3]
- Contact State Unit on Aging if no local provider[1]
- Program administered by local non-profits and boroughs under state regs, not centralized state application[2]

**Data shape:** Decentralized by region with different providers (e.g., Salvation Army in Anchorage, senior centers elsewhere); no statewide income/asset tests; varies by home-delivered vs. congregate; doctor's note for home-delivery in some areas only

**Source:** https://health.alaska.gov/ (Alaska DHSS for state regulations); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/[1][2]

---

### Alzheimer's Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income and asset limits apply for CSRCP (specific dollar amounts and household size tables not detailed in sources; financial eligibility required for care recipient with Alzheimer's diagnosis)[1]
- Assets: Asset limits apply for CSRCP (details on what counts or exemptions not specified in sources)[1]
- Care recipient must have a formal diagnosis of Alzheimer's disease or a related dementia (required for CSRCP)[1]
- Caregiver must be providing unpaid care (CSRCP and NFCSP)[1]
- For NFCSP: Care recipient 60+ or with Alzheimer's (any age); or caregiver 60+ caring for adult child with disability; or grandparents/relatives 55+ raising grandchildren[1][2][3]

**Benefits:** Respite care (adult day and in-home options, no cap on services); information and assistance; individual counseling; support groups; caregiver training; limited supplemental services (e.g., transportation, home modifications); educational materials, referrals for Alzheimer's[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Fillable application form via Anchorage Older Americans Services Commission (AOASCC): https://www.aoascc.org/Customer-Content/www/CMS/files/Caregiver_Support_Services_Application-Fillable_Combined_2025_05_19.pdf[1]
- Access FCSP through Alaska Home & Community Based Senior Grants website (specific URL: http://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx)[2]
- Contact local grantees of Alaska Department of Health and Social Services, Division of Senior and Disabilities Services[3]

**Timeline:** Not specified in sources

**Watch out for:**
- Two related programs: CSRCP (Alzheimer's-specific with income/asset limits and diagnosis proof) vs. broader NFCSP (age 60+ focus, varying eligibility)[1][2]
- Spouses and legal guardians often ineligible as paid caregivers in related programs[2]
- Financial eligibility strictly required for CSRCP but details like exact income/asset thresholds and exemptions not publicly detailed in sources[1]
- Must distinguish from Medicaid programs like ALI Waiver (waitlist, different eligibility)[2][6]

**Data shape:** Dual structure: CSRCP (diagnosis + financial test) and NFCSP (age-based, no min caregiver age); local grantees vary services; no service caps but supplemental limited; income/asset limits exist without published tables

**Source:** https://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx

---

### Senior Community Service Employment Program (SCSEP) / Mature Alaskans Seeking Skills Training (MASST)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level established by Health & Human Services. Specific dollar amounts vary by household size and are updated annually by HHS; the search results do not provide the current 2026 table.
- Assets: Not specified in available sources
- Must be unemployed
- Must have poor employment prospects (priority consideration)
- Enrollment priority given to: veterans and qualified spouses, individuals over 65, those with disabilities, those with low literacy skills or limited English proficiency, rural residents, homeless or at-risk individuals, and those who have failed to find employment through American Job Center services

**Benefits:** Part-time paid community service positions averaging 20 hours per week at the highest of federal, state, or local minimum wage; on-the-job training in computer or vocational skills; job search assistance; professional job placement assistance into unsubsidized employment; access to employment assistance through American Job Centers[4][6]
- Varies by: fixed

**How to apply:**
- In-person at Alaska Job Center Network (AJCN) locations
- Contact the Alaska Department of Labor and Workforce Development, Division of Vocational Rehabilitation (specific phone number and online application portal not provided in search results)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- 48-month lifetime participation limit with no waivers or exceptions[3] — participants must transition to unsubsidized employment before this limit expires
- Program is part-time (average 20 hours/week), not full-time employment[4]
- Income limit is strict: 125% of federal poverty level, which is significantly below median household income[4]
- Enrollment priority system means not all eligible applicants may be served immediately; veterans, those over 65, and those with disabilities receive priority[4]
- This is a training and bridge program to unsubsidized employment, not permanent subsidized work[1]
- Participants must be actively seeking unsubsidized employment; the program is designed as a transition tool, not long-term income support

**Data shape:** SCSEP in Alaska (MASST) is a federally administered program with a fixed benefit structure (20 hours/week at minimum wage) and a hard 48-month lifetime cap. Eligibility is income-based (125% poverty level) with no asset limits specified. The program operates statewide through regional coordinators but specific regional variations in processing time, waitlists, or service availability are not documented in available sources. Application methods and processing timelines are not detailed in the search results and require direct contact with the administering agency.

**Source:** https://labor.alaska.gov/masst/about-masst.htm

---

### Alaska Legal Services Corporation (ALSC) Senior Legal Hotline


**Eligibility:**
- Age: 60+
- Income: For seniors over 60 via Elder Advocacy, assistance may be provided without regard to income, with priority to those in social or economic need. General ALSC income eligibility (125% Federal Poverty Guidelines for Alaska) applies if needed: Household Size 1: Yearly $24,938 / Monthly $2,078 / Weekly $480; 2: $33,813 / $2,818 / $650; 3: $42,688 / $3,557 / $821; 4: $51,563 / $4,297 / $992; 5: $60,438 / $5,037 / $1,162; 6: $69,313 / $5,776 / $1,333; 7: $78,188 / $6,516 / $1,504; 8: $87,063 / $7,255 / $1,674; Each additional: $8,875 / $740 / $171.[1][7]
- Assets: Assets are considered in eligibility screening (gross household assets asked during intake), but no specific dollar limits or exemptions detailed.[2]
- Alaska resident
- Civil legal issue in priority areas (e.g., income maintenance, housing, health care for seniors)
- No conflicts of interest
- Case must align with office priorities; not all cases accepted due to limited resources.[1][3][7]

**Benefits:** Legal assistance and advice, court/administrative representation, referrals; community education/training via clinics/outreach. Specific senior areas: Income maintenance (Alaska Senior Assistance, Social Security, SSI, Adult Public Assistance, Food Stamps), housing (landlord/tenant, public housing, assisted living, nursing homes), health care (Medicaid, Medicare, Long-Term Care, PCA program). No specified dollar amounts or hours.[7]
- Varies by: priority_tier

**How to apply:**
- Online: ALSC Online Eligibility Interview at https://www.alsc-law.org/intake/
- Phone: Statewide intake line 1-888-478-2572
- Mail/In-person: Paper applications (English, Samoan, Tagalog, Spanish, German, Russian) at nearest ALSC office (e.g., Anchorage, Bethel, Dillingham, Juneau).[2][3][5][6]

**Timeline:** Intake specialist contacts within two business days after online interview; phone/paper similar process.[2]
**Waitlist:** No guaranteed assistance due to limited resources; case staffing attempted if eligible, but not all accepted.[3]

**Watch out for:**
- Not a 'hotline' but Elder Advocacy program accessed via general ALSC intake; no income test guaranteed for seniors but priority-based and resources limited—not all cases accepted.
- No criminal cases, personal injury, accidents, or wrongful death.
- Must complete full application; conflicts or non-priority cases referred elsewhere.
- Seniors get priority but still subject to office priorities and availability.[1][3][6][7]

**Data shape:** Income often waived for seniors 60+ with priority to need; services via statewide intake but office-specific priorities; no fixed hours/dollars, case-by-case acceptance.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.alsc-law.org/elder-advocacy/

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Income: No income limits; program is available to all qualifying residents regardless of income.
- Assets: No asset limits; no financial tests apply.
- Residing in a long-term care facility such as an assisted living home or nursing home in Alaska
- Complaint or issue related to health, safety, welfare, or rights in the facility
- Available to residents aged 60 and older, or adults over 60 with at-home living condition issues under Alaska law

**Benefits:** Complaint investigation and resolution; resident rights education; facility monitoring and regular visits; support for family and resident councils; advocacy before government agencies; guidance on regulatory complaints; public policy recommendations; community outreach and training for providers and families.

**How to apply:**
- Phone: 907-334-4480 or toll-free 1-800-730-6393 (M-F 8:00 a.m. to 4:30 p.m.)
- Online complaint form: akoltco.org
- Address: 3745 Community Park Loop, Suite 200, Anchorage, AK 99508
- Fax: 907-334-4486

**Timeline:** Not specified in available data; complaint investigations handled promptly by certified ombudsmen.

**Watch out for:**
- Not a financial assistance or direct service program—provides advocacy only, not healthcare, housing, or payments
- Families cannot 'apply to qualify' for the program itself; contact to report a specific complaint or seek advice
- No local ombudsmen in some areas—services delivered via statewide staff and volunteers
- SLTCO and volunteers must be free of conflicts of interest (e.g., no recent employment or ownership in facilities)
- Program housed under Alaska Mental Health Trust Authority, not a typical state health department

**Data shape:** no income test; advocacy-only with no enrollment or qualification process—open to any resident or family with a complaint; relies on statewide volunteers rather than regional offices; targets seniors 60+ in facilities

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://akoltco.org

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid for Seniors/Disabled | benefit | state | deep |
| Home and Community-Based Services Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels (Senior Meals Program) | benefit | federal | medium |
| Alzheimer's Family Caregiver Support Pro | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Alaska Legal Services Corporation (ALSC) | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"resource":3,"employment":1}
**Scopes:** {"state":4,"local":1,"federal":8}
**Complexity:** {"deep":9,"simple":3,"medium":1}

## Content Drafts

Generated 13 page drafts. Review in admin dashboard or `data/pipeline/AK/drafts.json`.

- **Medicaid for Seniors/Disabled** (benefit) — 5 content sections, 6 FAQs
- **Home and Community-Based Services Waiver** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 5 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Low Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 6 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP)** (resource) — 1 content sections, 6 FAQs
- **Meals on Wheels (Senior Meals Program)** (benefit) — 3 content sections, 6 FAQs
- **Alzheimer's Family Caregiver Support Program** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP) / Mature Alaskans Seeking Skills Training (MASST)** (employment) — 2 content sections, 6 FAQs
- **Alaska Legal Services Corporation (ALSC) Senior Legal Hotline** (resource) — 3 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **region**: 2 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size, region, housing_type, vendor_type**: 1 programs
- **not_applicable**: 2 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid for Seniors/Disabled**: Varies by LTC vs non-LTC, marital status, working status; APA auto-links to Medicaid; strict asset test + NFLOC for seniors/disabled LTC; annual changes (2026 limits apply).
- **Home and Community-Based Services Waiver**: Multiple distinct waivers under HCBS umbrella (5 total), each with unique age/disability focus, services, and waitlist rules; requires NFLOC + Medicaid; services provider-dependent by location; no fixed benefit amounts
- **Program of All-Inclusive Care for the Elderly (PACE)**: No operational programs in Alaska (unique barrier: zero centers/providers); eligibility non-financial but tied to unavailable service areas; Medicaid financials apply indirectly for full coverage; national model, state-administered with no AK-specific PACE data
- **Medicare Savings Programs (QMB, SLMB, QI)**: This program consists of three separate tiers (QMB, SLMB, QI) with progressively higher income limits but decreasing benefits. QMB is the most comprehensive but has the lowest income threshold. SLMB and QI cover only Part B premiums but serve those with slightly higher incomes. Alaska has distinct income limits higher than the national standard. QI has a critical gotcha: limited annual funding with first-come, first-served enrollment. All three programs automatically qualify beneficiaries for Extra Help with prescription drug costs. Income and asset limits are adjusted annually and vary slightly by state.
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly/disabled special rules: higher gross limit (200% FPL), asset $4,500, medical/shelter deductions; ESAP simplifies process for all-adult 60+/disabled households; benefits scale by household size/net income; statewide via DPA offices.
- **Low Income Home Energy Assistance Program (LIHEAP)**: LIHEAP is a complex, multi-provider program with significant regional variation. Benefits scale by household size and income, but also by housing type, vendor type, and geographic location. Income thresholds vary by provider (150% vs. 60% of poverty/median income). Application windows are time-limited and prioritize seniors and disabled individuals. Some tribal providers exclude Social Security income, creating different eligibility outcomes for the same household. Non-enrolled tribal citizens face different application routes. Processing times range from 30-45 days depending on provider. The program is currently fully operational as of April 2026 after federal government reopening.
- **Weatherization Assistance Program**: Delivered via regional sub-grantees with priority tiers; 15-year repeat restriction; DOE-funded with state supplement for higher incomes; no age minimum but elderly priority.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; open to all Medicare-eligible plus families/caregivers; counseling-only service via statewide office with local delivery network; no waitlists or caps
- **Meals on Wheels (Senior Meals Program)**: Decentralized by region with different providers (e.g., Salvation Army in Anchorage, senior centers elsewhere); no statewide income/asset tests; varies by home-delivered vs. congregate; doctor's note for home-delivery in some areas only
- **Alzheimer's Family Caregiver Support Program**: Dual structure: CSRCP (diagnosis + financial test) and NFCSP (age-based, no min caregiver age); local grantees vary services; no service caps but supplemental limited; income/asset limits exist without published tables
- **Senior Community Service Employment Program (SCSEP) / Mature Alaskans Seeking Skills Training (MASST)**: SCSEP in Alaska (MASST) is a federally administered program with a fixed benefit structure (20 hours/week at minimum wage) and a hard 48-month lifetime cap. Eligibility is income-based (125% poverty level) with no asset limits specified. The program operates statewide through regional coordinators but specific regional variations in processing time, waitlists, or service availability are not documented in available sources. Application methods and processing timelines are not detailed in the search results and require direct contact with the administering agency.
- **Alaska Legal Services Corporation (ALSC) Senior Legal Hotline**: Income often waived for seniors 60+ with priority to need; services via statewide intake but office-specific priorities; no fixed hours/dollars, case-by-case acceptance.
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only with no enrollment or qualification process—open to any resident or family with a complaint; relies on statewide volunteers rather than regional offices; targets seniors 60+ in facilities

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Alaska?
