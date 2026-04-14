# Louisiana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.055 (11 calls, 6.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 9 |
| Programs deep-dived | 9 |
| New (not in our data) | 6 |
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

- **service**: 6 programs
- **financial**: 2 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1400` → Source says `$1,350` ([source](https://ldh.la.gov/medicaid/medicare-savings-program))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, and copayments for covered services. SLMB/QI: Pays Medicare Part B premiums only. QI automatically qualifies for Extra Help (low/no cost for prescriptions, e.g., no more than $12.65 per drug in 2026). No direct services; payments made to Medicare on behalf of beneficiary.[1][3][5][6][7]` ([source](https://ldh.la.gov/medicaid/medicare-savings-program))
- **source_url**: Ours says `MISSING` → Source says `https://ldh.la.gov/medicaid/medicare-savings-program`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `No minimum age requirement for the household, but special rules apply if household includes member 60 or older` ([source](dcfs.louisiana.gov/page/524 and ldh.la.gov))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly SNAP benefits calculated by household size and net income. Example: 2-person elderly/disabled household with $1,200 gross income receives $415/month in SNAP benefits[8]` ([source](dcfs.louisiana.gov/page/524 and ldh.la.gov))
- **source_url**: Ours says `MISSING` → Source says `dcfs.louisiana.gov/page/524 and ldh.la.gov`

### Adult Day Health Care Waiver

- **min_age**: Ours says `65` → Source says `22` ([source](https://ldh.la.gov/office-of-aging-and-adult-services/ADHC-waiver[2]))
- **income_limit**: Ours says `$2901` → Source says `$2,163` ([source](https://ldh.la.gov/office-of-aging-and-adult-services/ADHC-waiver[2]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult Day Health Care (ADHC) at centers (Monday-Friday, daytime hours): medical/health-related services, structured activities (cognitive exercises, arts/crafts, games, group discussions), socialization, nutritious meals/snacks. Additional: support coordination, transition intensive support coordination. Not 24-hour care; part-day attendance.[2]` ([source](https://ldh.la.gov/office-of-aging-and-adult-services/ADHC-waiver[2]))
- **source_url**: Ours says `MISSING` → Source says `https://ldh.la.gov/office-of-aging-and-adult-services/ADHC-waiver[2]`

## New Programs (Not in Our Data)

- **Louisiana Medicaid Long-Term Care Services** — service ([source](https://ldh.la.gov/office-of-aging-and-adult-services/LTPCS and https://ldh.la.gov/medicaid/long-term-care))
  - Shape notes: Louisiana's long-term care system includes multiple distinct programs (Nursing Home Medicaid, LT-PCS, HCBS Waivers) with overlapping but distinct eligibility criteria. The program structure varies significantly by whether the applicant seeks institutional or community-based care. Income and asset limits are fixed statewide for 2026 but may change annually. The LT-PCS program has unique requirements around caregiver direction and home equity that differ from standard Nursing Home Medicaid. Critical application details (phone numbers, specific forms, processing timelines, regional variations) are not available in public sources and require direct contact with Louisiana Department of Health.
- **Community Choices Waiver (CCW)** — service ([source](https://ldh.la.gov/page/community-choices-waiver))
  - Shape notes: Priority-tiered waitlist drives access; no 24/7 services; asset exemptions detailed with home equity cap; Medicaid LTC financials required (spend-down option); statewide uniform
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://ldh.la.gov/office-of-aging-and-adult-services/pace))
  - Shape notes: PACE in Louisiana is geographically restricted to four service areas with separate regional offices. Eligibility has no income test for program entry but Medicaid funding (covering most participants) has strict income/asset limits. Benefits are individualized based on assessment, not tiered. The program requires high functional need (nursing facility level of care) and ability to live safely in community—these are gatekeeping criteria. Processing timelines and waitlist information are not publicly documented in available sources.
- **Commodity Supplemental Food Program (CSFP) - Senior Box Program** — in_kind ([source](https://www.fns.usda.gov/csfp/commodity-supplemental-food-program (USDA Food and Nutrition Service); Louisiana-specific: https://www.feedinglouisiana.org/csfp))
  - Shape notes: Benefits are fixed (same box contents for all participants, not scaled by household size or priority tier). Income limits scale by household size with a formula for additional family members. Program is statewide but administered through five regional food banks with varying distribution sites. No processing time, waitlist information, or specific form numbers provided in available documentation. Eligibility is straightforward: age 60+, Louisiana residency, income at or below 150% of Federal Poverty Guidelines, and documentation of identity and residence.
- **State Personal Assistance Services (SPAS) Program** — service ([source](https://ldh.la.gov/office-of-aging-and-adult-services/SPAS[1]))
  - Shape notes: Self-directed model where participant manages providers; no public income/asset caps detailed (unlike Medicaid LT-PCS); services via subsidy, not fixed hours/dollars; statewide with central management by Arc of Louisiana
- **Caregiver Voucher Program** — service ([source](https://ldh.la.gov/office-of-aging-and-adult-services/community-choices-waiver-ccw))
  - Shape notes: Tied to CCW Medicaid waiver with priority tiers for slots; consumer-directed payment to family via SFC providers, no fixed voucher dollar/hour amount (plan-based); requires NFLOC assessment.

## Program Details

### Louisiana Medicaid Long-Term Care Services

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, blind, or disabled (age 21+ for some programs)+
- Income: {"description":"Louisiana is an income cap state for 2026. Single applicants must have countable monthly income equal to or less than 3 times the monthly SSI Federal benefit rate, which translates to approximately $2,982/month for 2026[6]. This is a hard income limit—applicants cannot exceed it at the time of application, though a Medically Needy program allows spending down excess income using incurred medical expenses in certain cases[1].","single_applicant_2026":"$2,982/month or less[6]","income_inclusions":"Wages, Social Security benefits, pensions, veteran's benefits, annuities[1]","income_exclusions":"Personal needs allowance of $40/month; veterans receiving a pension can retain an additional $90/month[1]"}
- Assets: {"individual_limit":"$2,000 in countable assets[4][6]","married_couple_same_facility":"$3,000[4]","married_individual_with_community_spouse":"$128,640[4]","exempt_assets":["Homestead (up to $688,000 in Louisiana)[7]","Primary vehicle[7]","Personal items (excluding investment-grade items like precious metals, jewelry, or art)[7]","Cash value life insurance (up to $10,000)[7]","Single Premium Immediate Annuities (must be Medicaid compliant)[7]","Funeral/burial plans[7]"],"look_back_period":"5-year look-back period; penalties apply for sale of assets below fair market value or gifting of resources[1]","home_equity_limit_LTPCS":"For the LT-PCS program specifically, home equity interest must not exceed $752,000 in 2026 if applicant lives in or intends to return home[2]"}
- Louisiana residency[1][4]
- U.S. citizenship or legal immigration status (non-citizens no longer subject to 5-year waiting period)[4]
- Social Security number or application for one[4]
- Nursing Facility Level of Care (NFLOC) requirement—must require assistance with Activities of Daily Living (transferring, mobility, eating, toileting, personal hygiene, bathing)[2][3]
- Minimum of 30 consecutive days of care required[1]
- For LT-PCS program: ability to direct care independently or through a responsible representative[3]
- For LT-PCS program: must meet one of three criteria: (1) reside in nursing home and able to relocate to community with care assistance, (2) anticipated to require nursing home admission within 120 days, or (3) have primary caregiver who is disabled or age 70+[3]

**Benefits:** Louisiana offers multiple long-term care programs: (1) Nursing Home Medicaid—covers institutional nursing facility care; (2) Long-Term Personal Care Services (LT-PCS)—provides community-based personal care services for eligible individuals who can remain in their home; (3) Home and Community-Based Services (HCBS) Waivers—various waiver programs with specific service packages[8]. Specific dollar amounts and hours per week are not detailed in available sources[1][2][3][4][5][8].
- Varies by: program_type_and_individual_assessment

**How to apply:**
- In-person at local Medicaid office (specific office locations not provided in sources)
- Phone contact through Louisiana Department of Health (specific phone number not provided in sources)
- Mail to Louisiana Department of Health (specific mailing address not provided in sources)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources; note that 'long-term care services may be more immediately available in a facility setting than other long-term care options'[8]

**Watch out for:**
- Louisiana is an income cap state—applicants cannot simply spend down excess income to qualify; they must fall below the income limit at application, though a Medically Needy program exists for certain cases[1]
- The 5-year look-back period means gifts or below-market-value asset sales within 5 years trigger penalties[1]
- For LT-PCS specifically, applicants must be able to direct their own care or have a representative do so—this is a significant functional requirement beyond just needing care[3]
- Home equity limit for LT-PCS ($752,000 in 2026) is separate from the general homestead exemption ($688,000)—clarify which applies to your situation[2][7]
- Minimum 30-day commitment required for nursing facility care[1]
- LT-PCS has a 120-day window for anticipated nursing home admission—timing matters for this eligibility pathway[3]
- Asset limits are strict ($2,000 for individuals)—even modest savings can disqualify applicants[6]
- Specific application procedures, phone numbers, forms, processing times, and regional office locations are not detailed in official sources—contact Louisiana Department of Health directly for current application information

**Data shape:** Louisiana's long-term care system includes multiple distinct programs (Nursing Home Medicaid, LT-PCS, HCBS Waivers) with overlapping but distinct eligibility criteria. The program structure varies significantly by whether the applicant seeks institutional or community-based care. Income and asset limits are fixed statewide for 2026 but may change annually. The LT-PCS program has unique requirements around caregiver direction and home equity that differ from standard Nursing Home Medicaid. Critical application details (phone numbers, specific forms, processing timelines, regional variations) are not available in public sources and require direct contact with Louisiana Department of Health.

**Source:** https://ldh.la.gov/office-of-aging-and-adult-services/LTPCS and https://ldh.la.gov/medicaid/long-term-care

---

### Community Choices Waiver (CCW)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Income must meet Louisiana Medicaid long-term care limits, typically $2,742/month for an individual and $5,484/month for a couple (both needing long-term care) as of recent data; older sources cite $2,199 individual/$4,398 couple. Limits subject to annual adjustment. Waiver spend-down option available if over limits. Varies by Medicaid rules, not detailed household size table beyond singles/couples. Must meet Medicaid financial eligibility overall[1][2][4][5].
- Assets: Single: $2,000 max resources. Couples (both LTC): $3,000. Couples (one spouse at home): up to $117,240. Exempt: primary home (equity ≤$752,000 in 2026 if intent to return, spouse/minor/disabled child lives there), one vehicle, household furnishings/appliances, personal effects. 60-month look-back rule applies; gifting/selling below market value causes penalty period[2][3].
- Louisiana resident
- Meet Nursing Facility Level of Care (NFLOC): inability to perform ADLs like transferring, mobility, eating, toileting; unstable conditions, cognitive issues (e.g., dementia may qualify but diagnosis alone insufficient)
- Meet Medicaid long-term care eligibility

**Benefits:** Specific services: Personal care, homemaker, adult day care, home/nursing services, home-delivered meals, caregiver respite/temporary support, housing stabilization/transition/crisis intervention. No 24/7 care; alternative arrangements required. No fixed dollar amounts or hours specified; individualized based on needs[1][3][4][5].
- Varies by: priority_tier

**How to apply:**
- Phone: Call Louisiana Options in Long-Term Care at 1-877-456-1146 to add name to Request for Services Registry
- No specific online URL, mail, or in-person detailed; phone is primary route to request slot

**Timeline:** Not specified; offers based on priority and first-come-first-served after registry request
**Waitlist:** Yes; prioritized by need: 1) APS/EPS abuse/neglect referrals at risk of institutionalization, 2) ALS diagnosis, 3) State Permanent Supportive Housing residents/linked, 4) Nursing facility residents >90 days with Medicaid, 5) Non-recipients of other HCBS waivers. Others first-come-first-served by request date. Expedited for some LT-PCS recipients[1][3][4][5].

**Watch out for:**
- No 24/7 care; must arrange separately[1][4]
- Priority waitlist means non-priority may wait long; apply immediately[1][4][5]
- 60-month look-back on assets; penalties for improper transfers[2]
- NFLOC required; dementia diagnosis alone insufficient[2]
- Income/asset limits strict but spend-down and exemptions available[2][4][5]

**Data shape:** Priority-tiered waitlist drives access; no 24/7 services; asset exemptions detailed with home equity cap; Medicaid LTC financials required (spend-down option); statewide uniform

**Source:** https://ldh.la.gov/page/community-choices-waiver

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for program eligibility. However, Medicaid coverage (which pays for PACE services for eligible participants) has income limits: under 300% of the Federal Benefit Rate ($2,901/month for 2025). Medicare eligibility requires U.S. citizenship or 5-year legal residency and age 65+, disability, ALS, or end-stage renal disease.[4][5]
- Assets: No asset limits for program eligibility. However, Medicaid-eligible participants must have assets valued at $2,000 or less (excluding primary home).[4]
- Must meet nursing facility level of care (NFLOC) as certified by the state, typically requiring extensive assistance with Activities of Daily Living: bathing, grooming, toileting, walking, transferring, and eating[4]
- Must be able to live safely in the community with PACE services at time of enrollment[2][5]
- Must live in a PACE provider service area[2]
- Cannot be enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, hospice services, or certain other programs[5]
- Financial criteria are not considered in determining eligibility; people do not need to be enrolled in Medicare or Medicaid to qualify[5]

**Benefits:** All physical, emotional, social, and medical supports needed to live at home. Services include: all Medicaid State Plan services, all Medicare services, and additional services needed for healthy community life. Specific services determined by individualized assessment by nurse, doctor, physical therapist, occupational therapist, social worker, and others. For Medicaid-eligible participants: no cost. For Medicare-only eligible participants: Medicare pays portion of monthly rate; participant pays remainder. For private pay: approximately $4,000–$5,000/month average (varies by program). No co-payments or deductibles.[2][4]
- Varies by: funding_source_and_individual_need

**How to apply:**
- Phone: Baton Rouge – 225-490-0604[3]
- Phone: Greater New Orleans – 504-945-1531[3]
- Phone: Alexandria – 337-470-4500[3]
- Phone: Lafayette – 318-206-1020[3]
- In-person: Contact local PACE office in your service area[3]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE is NOT statewide—it's only available in four specific regions. Families outside these areas cannot access the program regardless of eligibility.[3]
- You must meet NURSING FACILITY LEVEL OF CARE, not just be elderly or have health issues. This is a high bar requiring extensive assistance with daily living activities.[4][5]
- No income test for program eligibility, but Medicaid coverage (which pays for most participants' services) has strict income and asset limits. Private pay is $4,000–$5,000/month.[4]
- You cannot be enrolled in Medicare Advantage (Part C) or prescription drug plans to join PACE—you must have Original Medicare.[5]
- NFLOC eligibility is not confirmed until the iHC assessment is completed; initial assessments (LOCET) do not guarantee eligibility.[1]
- The program requires you to be able to live safely in the community—if your condition requires 24/7 skilled care or you cannot call for emergency assistance, you may be deemed ineligible.[1]
- Approximately 90% of PACE participants are dually eligible for Medicare and Medicaid; single-payer participants are less common.[5]
- Average PACE participant is 76 years old with multiple complex medical conditions—the program is designed for high-need seniors, not general elderly care.[5]

**Data shape:** PACE in Louisiana is geographically restricted to four service areas with separate regional offices. Eligibility has no income test for program entry but Medicaid funding (covering most participants) has strict income/asset limits. Benefits are individualized based on assessment, not tiered. The program requires high functional need (nursing facility level of care) and ability to live safely in community—these are gatekeeping criteria. Processing timelines and waitlist information are not publicly documented in available sources.

**Source:** https://ldh.la.gov/office-of-aging-and-adult-services/pace

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: For 2026 in Louisiana, income limits are based on federal standards (states may adjust slightly higher). QMB: Individual $1,350/month, Married couple $1,824/month. SLMB: Individual $1,616/month, Married couple $2,184/month. QI: Individual $1,816/month, Married couple $2,455/month. Limits apply to countable monthly income; household size beyond couple not specified in sources but typically follows SSI-related rules for larger households. Must reside in Louisiana, be U.S. citizen or qualified immigrant, have SSN, and have Medicare Part A (Part B not required for QI application).[1][3][6][7]
- Assets: No resource/asset limits for QMB, SLMB, or QI in Louisiana (resources disregarded). Only QDWI (not core focus) has limits: no more than twice SSI countable resources (e.g., cash/property convertible to cash; specifics like home/car often exempt per SSI rules).[1]
- Must have Medicare Part A.
- For SLMB/QI: Must have Part B.
- Not eligible if receiving full Medicaid (QI specifically excludes Medicaid recipients).
- QI: Annual reapplication required; first-come, first-served with priority to prior recipients.

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, and copayments for covered services. SLMB/QI: Pays Medicare Part B premiums only. QI automatically qualifies for Extra Help (low/no cost for prescriptions, e.g., no more than $12.65 per drug in 2026). No direct services; payments made to Medicare on behalf of beneficiary.[1][3][5][6][7]
- Varies by: priority_tier

**How to apply:**
- Online: Medicaid Self-Service Portal (https://ldh.la.gov/medicaid/medicare-savings-program).
- Download/print form from LDH site and mail.
- Phone: Contact local Medicaid office (specific numbers via LDH site; general Medicaid line not listed).
- In-person: Local Medicaid offices.

**Timeline:** Not specified in sources.
**Waitlist:** QI: First-come, first-served basis with funding caps; priority to previous year recipients. No waitlist mentioned for QMB/SLMB.

**Watch out for:**
- No asset test for QMB/SLMB/QI in Louisiana (common miss; many assume federal limits apply).
- QI requires annual reapplication and is first-come/first-served (may lose if not renewed or funding exhausted).
- Must have Part A; SLMB/QI need Part B. Not for Medicaid recipients.
- Income limits are 2026 federal figures; Louisiana may allow slightly higher—verify with LDH.
- QMB protects from provider balance billing (providers can't charge beneficiary for Medicare-covered services).
- Older sources list outdated limits (e.g., 2025 or prior); use 2026 numbers.

**Data shape:** No asset test for core programs (QMB/SLMB/QI); tiered by income brackets with QMB most generous benefits, QI highest income but Part B only and annual/funded-limited; Louisiana disregards resources per state policy.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ldh.la.gov/medicaid/medicare-savings-program

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: No minimum age requirement for the household, but special rules apply if household includes member 60 or older+
- Income: {"standard_households":"130% of Federal Poverty Level (FPL). For 2025-2026: 1 person $2,608/month, 2 people $3,526/month, 3 people $4,442/month, 4 people $5,358/month, 5 people $6,276/month, 6 people $7,192/month, 7 people $8,108/month, each additional person +$916/month[1]","bbce_households":"200% FPL (Broad-Based Categorically Eligible households)[6]","elderly_or_disabled_households":"No gross income limit; only must meet net income test of 100% FPL[6]. If household has member 60+ or disabled and exceeds gross income limit, can qualify under net income and asset tests instead[1]"}
- Assets: {"louisiana_standard":"No asset limit in Louisiana for most households[1]","federal_alternative":"If household has member 60+ or disabled and doesn't meet gross income test, can qualify under federal rules with $4,500 asset limit[1]","what_counts":"Countable resources like funds in bank accounts[1]","what_exempt":"Home and vehicles are not counted as resources[1]"}
- Must be a resident of Louisiana[6]
- Must be a U.S. citizen or lawfully present non-citizen[6]
- Must have a Social Security number or proof of application for one[6]
- Able-bodied adults aged 18-49 without dependents must work or participate in training for at least 20 hours per week, or limited to 3 months of benefits in 36-month period[7]
- Household must include all members who live together and buy/prepare food together[3]

**Benefits:** Monthly SNAP benefits calculated by household size and net income. Example: 2-person elderly/disabled household with $1,200 gross income receives $415/month in SNAP benefits[8]
- Varies by: household_size and income

**How to apply:**
- Online: Louisiana Department of Children and Family Services website (dcfs.louisiana.gov)[9]
- In-person: Contact your parish Council on Aging for assistance[4]
- Phone: Contact your parish office (specific numbers not provided in search results)
- Mail: Submit application to your parish DCFS office (specific addresses not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Louisiana has expanded eligibility beyond federal SNAP requirements—other websites may show stricter limits than actually apply[1]
- Households with elderly (60+) or disabled members have significantly easier qualification: they only need to meet net income test (100% FPL), not gross income test[6]
- For elderly/disabled households, there is NO asset limit in Louisiana, unlike federal rules which have $4,500 limit[1]
- Seniors must reapply every year—they do not automatically receive benefits from prior year[4]
- ESAP (Elderly Simplified Application Project) offers extended certification (36 months instead of annual) and waived recertification interviews, but only for households with elderly/disabled members with NO earned income[5]
- About half of eligible seniors don't receive SNAP despite qualifying, often due to application complexity[3]
- Social Security, veterans' benefits, and disability payments all count toward income limits[3]
- Able-bodied adults 18-49 without dependents face strict work requirements or lose benefits after 3 months[7]

**Data shape:** SNAP in Louisiana has a bifurcated eligibility structure: standard households face 130% FPL gross income limit, but households with elderly (60+) or disabled members face only 100% FPL net income limit with no gross income cap and no asset limit. This creates a significant advantage for elderly applicants. Louisiana also offers ESAP, a simplified application pathway for elderly/disabled with no earned income, featuring 36-month certification and waived recertification interviews. Benefits scale by household size and net income. Administration is parish-based through DCFS and Councils on Aging.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** dcfs.louisiana.gov/page/524 and ldh.la.gov

---

### Commodity Supplemental Food Program (CSFP) - Senior Box Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Louisiana uses 150% of Federal Poverty Guidelines as of February 2026[3]. Monthly income limits by household size: 1 person: $1,995; 2 people: $2,705; 3 people: $3,415; 4 people: $4,125; 5 people: $4,835. For each additional family member, add $710[3]. Note: Some states use 130% of Federal Poverty Guidelines[4], but Louisiana's current standard is 150%[3].
- Assets: Not specified in search results. Asset limits are not mentioned in Louisiana CSFP documentation.
- Must be a Louisiana resident[3]
- Must provide proof of identity with legal document (government-issued photo ID, driver's license, state ID card, or birth certificate)[1][3]
- Must provide proof of residence (driver's license or utility bill)[1]
- Must declare gross income[3]
- Must declare residency[3]

**Benefits:** Monthly box containing approximately 30-40 pounds of nutritious shelf-stable groceries[2][6]. Contents include: canned fruits and vegetables, canned meats (beef, pork, beef stew), pasta or rice, dry beans or peanut butter, fruit juices, dry cereals, cheese, powdered and canned milk, and plant-based proteins[1][6].
- Varies by: fixed

**How to apply:**
- Phone: 504-729-2842 (Second Harvest Food Bank - New Orleans)[1]
- Email: CSFP@no-hunger.org[1]
- In-person: At regional food banks and distribution sites throughout Louisiana[3]
- Online: Secure eligibility screening available (specific URL not provided in search results)[2]
- Mail: Applications accepted by regional food banks[3]

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Program is completely free — there is no cost to participate[1]
- Eligible seniors can authorize someone else to pick up their box on their behalf by contacting the program[1]
- Each eligible senior in a household receives their own individual food box[2]
- Distribution frequency: Participants receive one box per month, though some sites may use a bi-monthly model[1]
- Home delivery is available as an option at some locations (Los Angeles model suggests this may be available in Louisiana, but not explicitly confirmed)[2]
- Program is federally funded by USDA and administered by Louisiana Department of Health[1]
- More than 30,000 seniors receive boxes monthly across Louisiana[3]
- Income limits are based on household gross income, not net income[3]
- Residency requirements exist but no minimum period of residency is required[4]
- Women, infants, and children cannot apply for CSFP after February 7, 2014; they must use WIC or SNAP instead[4]

**Data shape:** Benefits are fixed (same box contents for all participants, not scaled by household size or priority tier). Income limits scale by household size with a formula for additional family members. Program is statewide but administered through five regional food banks with varying distribution sites. No processing time, waitlist information, or specific form numbers provided in available documentation. Eligibility is straightforward: age 60+, Louisiana residency, income at or below 150% of Federal Poverty Guidelines, and documentation of identity and residence.

**Source:** https://www.fns.usda.gov/csfp/commodity-supplemental-food-program (USDA Food and Nutrition Service); Louisiana-specific: https://www.feedinglouisiana.org/csfp

---

### State Personal Assistance Services (SPAS) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Must provide verification of income to show unique economic and social needs; no specific dollar amounts or tables provided in official sources[1][3][4]
- Assets: No asset limits specified in program sources[1][3][4]
- Have significant disabilities
- Needs goods and/or personal assistance services from this program to prevent or remove the individual from inappropriate placement in an institutional setting or to enhance or maintain the individual's employability
- Provides verification of the disability from the treating physician
- Is capable of, or has a legal/personal representative capable of, self-direction (hiring, firing, and supervising providers)
- Note: Some older sources mention age range 18-60 at inception, with continuation after 60 if eligible, but current official sources state 18 or older[1][4]

**Benefits:** Personal Care Assistance, Home Modifications, Vehicle Modifications, Utility and Rental Assistance, Medical Supplies and Equipment, Dental Services, Physical Therapy, Homemaker Services, Assistive Technology; subsidy provided for these services to enhance community living and employability; no specific dollar amounts or hours per week stated[1]

**How to apply:**
- Phone: Call the Arc of Louisiana at 225-383-1033 or 1-866-966-6260[4][5]
- Email: spas@thearcla.org[5]
- Download SPAS Application Packet from The Arc of Louisiana website[5]

**Timeline:** Evaluation by team determines eligibility; department follows recommendations or notifies within 20 days; annual re-evaluation required; no overall processing timeline specified[3]

**Watch out for:**
- Must be capable of self-direction or have a representative; participant responsible for hiring/firing/supervising providers even if choosing an agency[1][3]
- Not the same as LT-PCS Medicaid program, which has strict income/asset limits ($994/month single, $2,000 assets in 2026) and targets elderly/disabled 21+ or 65+ with different criteria[2]
- Requires physician verification and evaluation team assessment; income verification needed but not quantified publicly[1]
- Aimed at employability and avoiding institutionalization, not general elderly care[1][3]

**Data shape:** Self-directed model where participant manages providers; no public income/asset caps detailed (unlike Medicaid LT-PCS); services via subsidy, not fixed hours/dollars; statewide with central management by Arc of Louisiana

**Source:** https://ldh.la.gov/office-of-aging-and-adult-services/SPAS[1]

---

### Adult Day Health Care Waiver


**Eligibility:**
- Age: 22+
- Income: Must meet Louisiana Long-Term Care (LTC) Medicaid eligibility. Income limits are $2,163/month for an individual and $4,326/month for a couple (both receiving long-term care); older figures from 2014, confirm current via eligibility test as limits adjust annually. Spend-down option available: medical expenses (e.g., Medicare Part B premiums, uncovered care, anticipated ADHC costs) exceeding 'excess' income qualify; retain Personal Needs Allowance of $2,901/month (2025).[1][3]
- Assets: Must meet LTC Medicaid resource limits (exact current amounts not specified; e.g., older policy: married couples up to $117,240 if one spouse not receiving long-term care). Confirm current via official test.[1][3]
- Louisiana resident
- Nursing Facility Level of Care (NFLOC) determined by interRAI Home Care (iHC) assessment: needs in ADLs (transferring, mobility, eating, toileting), unstable medical conditions, rehab needs, cognitive issues (e.g., dementia).[1][2]
- At risk of nursing home placement[1]

**Benefits:** Adult Day Health Care (ADHC) at centers (Monday-Friday, daytime hours): medical/health-related services, structured activities (cognitive exercises, arts/crafts, games, group discussions), socialization, nutritious meals/snacks. Additional: support coordination, transition intensive support coordination. Not 24-hour care; part-day attendance.[2]
- Varies by: priority_tier

**How to apply:**
- Contact Louisiana Department of Health Office of Aging and Adult Services (OAAS); request via Adult Day Health Care Waiver Request for Services Registry (RFSR). No specific phone/URL/form listed; start at ldh.la.gov/office-of-aging-and-adult-services.[2]
- Use Medicaid Eligibility Test: medicaidplanningassistance.org (pre-screening).[1]

**Timeline:** Not specified
**Waitlist:** Yes, Request for Services Registry (RFSR). Priority: (1) Abuse/neglect referrals by APS/EPS needing nursing home to prevent further harm; (2) Hospital discharge within 30 days (1+ night stay); (3) Nursing home residents (Medicaid-only payer, >90 days approved); others first-come, first-served by request date.[2][3]

**Watch out for:**
- Not 24-hour care—only part-day at centers; assumes family provides rest-of-day support.[2]
- Strict priority waitlist; non-priority face long delays.[2][3]
- Must pre-verify income/assets or risk denial; use eligibility test first.[1]
- Disabled under 65 (22-64) qualify if at nursing home risk, but focus often elderly 65+.[1]
- Waiver approved through 06/30/2027; renewals possible.[5]

**Data shape:** Priority-tiered waitlist dominates access; tied to LTC Medicaid (income/asset tests with spend-down); NFLOC via specific interRAI tool; services center-based only, not home care.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ldh.la.gov/office-of-aging-and-adult-services/ADHC-waiver[2]

---

### Caregiver Voucher Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must meet Louisiana Long-Term Care (LTC) Medicaid eligibility, which generally follows Medicaid income limits (typically 300% of SSI for LTC, around $2,829/month for an individual in 2026; exact amounts vary and can be exceeded with spousal impoverishment protections or Miller Trust). No specific household size table provided in sources; persons over income/asset limits may still qualify. Consult LDH for current figures.[1][2]
- Assets: Standard Medicaid LTC asset limit applies (typically $2,000 for individual). Home equity limit of $752,000 in 2026 (home value minus mortgage). Exemptions: primary home if applicant lives there or intends to return, home with spouse/minor child/blind or disabled child living there; one vehicle, personal belongings, burial plots/funds.[2]
- Meet Nursing Facility Level of Care (NFLOC) via interRAI Home Care Assessment (needs help with ADLs like transferring, eating, toileting; unstable conditions, cognitive issues).[1][2]
- Louisiana resident.
- Priority groups: abuse/neglect referrals, ALS diagnosis, permanent supportive housing residents, nursing home residents (Medicaid-only), expedited needs (32+ hours LT-PCS), non-PACE/LT-PCS/HCBS recipients. Others first-come, first-served.[1]

**Benefits:** Home and Community-Based Services (HCBS) to avoid nursing home placement, including potential consumer-directed personal care where family/friends (18+, residing with recipient, able to provide care) can be paid caregivers via Supports for Caregivers (SFC) providers. Specific services: personal care, homemaker, respite; hours/dollars per approved care plan (no fixed amount stated).[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact Local Regional Coordinating Council (RCC) or Office of Aging and Adult Services (contact via ldh.la.gov or 1-866-783-5553).[1]
- Apply for Medicaid/LTC via Healthy Louisiana (bayouhealth.com or 1-888-342-6207).[2][4]
- Online: ldh.la.gov/office-of-aging-and-adult-services/community-choices-waiver-ccw.[1]
- Consumer-directed caregiver enrollment via SFC providers (e.g., Entyre Care, Careforth).[3][8]

**Timeline:** Not specified; involves assessment and care plan approval.[4]
**Waitlist:** Opportunities prioritized by groups; others first-come, first-served (potential wait).[1]

**Watch out for:**
- Not a standalone 'voucher' but consumer-directed personal care within CCW waiver; care recipient must qualify for LTC Medicaid and NFLOC first.[1][2]
- Family caregivers must reside with recipient and enroll via SFC provider; not all family eligible (e.g., spouse may have restrictions).[3]
- Priority slots fill first; general applicants wait first-come, first-served.[1]
- Dementia diagnosis alone doesn't qualify; must meet full NFLOC.[2]
- Home equity limit $752,000 (2026); asset transfers may trigger penalty period.[2]

**Data shape:** Tied to CCW Medicaid waiver with priority tiers for slots; consumer-directed payment to family via SFC providers, no fixed voucher dollar/hour amount (plan-based); requires NFLOC assessment.

**Source:** https://ldh.la.gov/office-of-aging-and-adult-services/community-choices-waiver-ccw

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Louisiana Medicaid Long-Term Care Servic | benefit | state | deep |
| Community Choices Waiver (CCW) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Commodity Supplemental Food Program (CSF | benefit | state | deep |
| State Personal Assistance Services (SPAS | benefit | state | medium |
| Adult Day Health Care Waiver | benefit | state | deep |
| Caregiver Voucher Program | benefit | state | deep |

**Types:** {"benefit":9}
**Scopes:** {"state":6,"local":1,"federal":2}
**Complexity:** {"deep":8,"medium":1}

## Content Drafts

Generated 9 page drafts. Review in admin dashboard or `data/pipeline/LA/drafts.json`.

- **Louisiana Medicaid Long-Term Care Services** (benefit) — 4 content sections, 6 FAQs
- **Community Choices Waiver (CCW)** (benefit) — 6 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 4 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 5 content sections, 6 FAQs
- **Commodity Supplemental Food Program (CSFP) - Senior Box Program** (benefit) — 5 content sections, 6 FAQs
- **State Personal Assistance Services (SPAS) Program** (benefit) — 3 content sections, 6 FAQs
- **Adult Day Health Care Waiver** (benefit) — 4 content sections, 6 FAQs
- **Caregiver Voucher Program** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_type_and_individual_assessment**: 1 programs
- **priority_tier**: 4 programs
- **funding_source_and_individual_need**: 1 programs
- **household_size and income**: 1 programs
- **fixed**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Louisiana Medicaid Long-Term Care Services**: Louisiana's long-term care system includes multiple distinct programs (Nursing Home Medicaid, LT-PCS, HCBS Waivers) with overlapping but distinct eligibility criteria. The program structure varies significantly by whether the applicant seeks institutional or community-based care. Income and asset limits are fixed statewide for 2026 but may change annually. The LT-PCS program has unique requirements around caregiver direction and home equity that differ from standard Nursing Home Medicaid. Critical application details (phone numbers, specific forms, processing timelines, regional variations) are not available in public sources and require direct contact with Louisiana Department of Health.
- **Community Choices Waiver (CCW)**: Priority-tiered waitlist drives access; no 24/7 services; asset exemptions detailed with home equity cap; Medicaid LTC financials required (spend-down option); statewide uniform
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE in Louisiana is geographically restricted to four service areas with separate regional offices. Eligibility has no income test for program entry but Medicaid funding (covering most participants) has strict income/asset limits. Benefits are individualized based on assessment, not tiered. The program requires high functional need (nursing facility level of care) and ability to live safely in community—these are gatekeeping criteria. Processing timelines and waitlist information are not publicly documented in available sources.
- **Medicare Savings Programs (QMB, SLMB, QI)**: No asset test for core programs (QMB/SLMB/QI); tiered by income brackets with QMB most generous benefits, QI highest income but Part B only and annual/funded-limited; Louisiana disregards resources per state policy.
- **Supplemental Nutrition Assistance Program (SNAP)**: SNAP in Louisiana has a bifurcated eligibility structure: standard households face 130% FPL gross income limit, but households with elderly (60+) or disabled members face only 100% FPL net income limit with no gross income cap and no asset limit. This creates a significant advantage for elderly applicants. Louisiana also offers ESAP, a simplified application pathway for elderly/disabled with no earned income, featuring 36-month certification and waived recertification interviews. Benefits scale by household size and net income. Administration is parish-based through DCFS and Councils on Aging.
- **Commodity Supplemental Food Program (CSFP) - Senior Box Program**: Benefits are fixed (same box contents for all participants, not scaled by household size or priority tier). Income limits scale by household size with a formula for additional family members. Program is statewide but administered through five regional food banks with varying distribution sites. No processing time, waitlist information, or specific form numbers provided in available documentation. Eligibility is straightforward: age 60+, Louisiana residency, income at or below 150% of Federal Poverty Guidelines, and documentation of identity and residence.
- **State Personal Assistance Services (SPAS) Program**: Self-directed model where participant manages providers; no public income/asset caps detailed (unlike Medicaid LT-PCS); services via subsidy, not fixed hours/dollars; statewide with central management by Arc of Louisiana
- **Adult Day Health Care Waiver**: Priority-tiered waitlist dominates access; tied to LTC Medicaid (income/asset tests with spend-down); NFLOC via specific interRAI tool; services center-based only, not home care.
- **Caregiver Voucher Program**: Tied to CCW Medicaid waiver with priority tiers for slots; consumer-directed payment to family via SFC providers, no fixed voucher dollar/hour amount (plan-based); requires NFLOC assessment.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Louisiana?
