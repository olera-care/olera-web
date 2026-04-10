# Nebraska Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 8.9m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 17 |
| New (not in our data) | 11 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 5 programs
- **employment**: 1 programs
- **service|advocacy**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Program (QMB, SLMB, QI)

- **income_limit**: Ours says `$1304` → Source says `$1,350` ([source](https://dhhs.ne.gov/Pages/Medicaid-Customer-Contacts.aspx or https://accessnebraska.ne.gov))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copayments for covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only. Automatic qualification for Extra Help (Part D low-income subsidy). No additional medical services or state supplements beyond Medicare cost-sharing[1][2][6][7].` ([source](https://dhhs.ne.gov/Pages/Medicaid-Customer-Contacts.aspx or https://accessnebraska.ne.gov))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/Pages/Medicaid-Customer-Contacts.aspx or https://accessnebraska.ne.gov`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://dhhs.ne.gov/pages/snap.aspx))
- **income_limit**: Ours says `$1982` → Source says `$2,152` ([source](https://dhhs.ne.gov/pages/snap.aspx))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (groceries, not hot/prepared foods). Amount based on net income, household size, max allotment minus 30% net income (e.g., 2-person elderly/disabled example: $546 max - 30% of $1,200 net = $415/mo). Exact amounts vary; minimums/maximums apply. Certification: 12 months for 60+/disabled households.[1][4][5]` ([source](https://dhhs.ne.gov/pages/snap.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/pages/snap.aspx`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2794` → Source says `$23,475` ([source](https://dhhs.ne.gov/pages/energy-assistance.aspx[3]))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment to utility company for heating (Oct 1-Mar 31) or cooling costs, calculated after eligibility using formula disregarding 20% of gross countable earned income, based on income, assets, size, fuel type, housing. Exact max/min amounts (e.g., regular, crisis) not specified in sources. Crisis for emergencies like shutoff or broken heater. Related: Weatherization (separate eligibility).[2][5][6]` ([source](https://dhhs.ne.gov/pages/energy-assistance.aspx[3]))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/pages/energy-assistance.aspx[3]`

### Home-Delivered Meals (via Area Agencies on Aging)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritionally balanced meals (hot, cold, frozen, or shelf-stable) meeting 1/3 of daily recommended dietary needs for adults 60+ per USDA, approved by registered dietitian; delivered Monday-Friday by volunteers or drivers; some locations offer weekends for extreme needs; suggested voluntary contribution (not a bill or required fee)[1][2][4]` ([source](https://dhhs.ne.gov/Medicaid%20SUA/SUA-21-PI-02%20Home%20Delivered%20Meals.pdf))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/Medicaid%20SUA/SUA-21-PI-02%20Home%20Delivered%20Meals.pdf`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `FREE confidential services including: (1) Education on aging, long-term care, and residents' rights; (2) Information & Referral to empower individuals to resolve concerns independently; (3) Consultation with recommendations for protecting resident rights and improving care; (4) Individual Advocacy to facilitate resolution of complaints and protect rights; (5) Systems Advocacy to identify problematic trends and advocate for systemic changes` ([source](https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx`

### Aged and Disabled Waiver

- **min_age**: Ours says `65` → Source says `65 or older, or any age if physically disabled[1][2][3][4]` ([source](https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx[2]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult Day Health, Assisted Living, Assistive Technology, Chore, Companion, Extra Care for Children with Disabilities, Home Again, Home and Vehicle Modifications (full list in DHHS resources); also Personal Emergency Response System (PERS) for those living alone/with impaired caregiver, fall history, or emergency risk[2][4]` ([source](https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx[2]))
- **source_url**: Ours says `MISSING` → Source says `https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx[2]`

## New Programs (Not in Our Data)

- **Aged and Disabled (AD) HCBS Waiver** — service ([source](https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx))
  - Shape notes: This program combines age-based and disability-based eligibility into a single waiver. Benefits are service-based rather than cash-based, and availability depends on individual functional assessment using the interRAI Home Care tool. The program is statewide but administered through DHHS with regional Area Agencies on Aging providing local support. Key distinction: this is a Medicaid waiver program, meaning Medicaid enrollment is a prerequisite, not an outcome. The Nursing Facility Level of Care requirement is the primary clinical gate — without meeting this threshold, applicants do not qualify regardless of age or disability status.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://dhhs.ne.gov/Pages/Medicaid-Provider-All-Inclusive-Care-for-the-Elderly.aspx))
  - Shape notes: Only 1 provider in NE (Immanuel Pathways); county/zip-restricted service area; no financial eligibility test for program entry (Medicaid separate for coverage); NF LOC state-certified.
- **Weatherization Assistance Program** — service ([source](https://dee.nebraska.gov/sites/default/files/publications/22-044-Final_WX_Full_Policies_and_Procedures_Manual.pdf))
  - Shape notes: Administered by regional subgrantees with statewide uniform eligibility (200% FPL or auto-qualifiers) but varying application contacts, capacities, wait times; priority tiers favor elderly/disabled; no age minimum but elderly prioritized.[2][3][4]
- **Nebraska SHIP (State Health Insurance Assistance Program)** — service ([source](https://doi.nebraska.gov/consumer/nebraska-ship-smp))
  - Shape notes: no income or asset test; free counseling service for Medicare navigation via statewide counselor network and local AAA partners; no formal enrollment—contact to arrange session
- **Lifespan Respite Services** — financial ([source](https://dhhs.ne.gov/Pages/Respite.aspx))
  - Shape notes: Financial subsidy with asset/income test (verification as-needed); exceptional crisis funding separate; statewide via network coordinators; excludes those on other govt respite.
- **Nebraska Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.nationalable.org/wp-content/uploads/2020/02/SCSEP_NebraskaHandbook_013120.pdf))
  - Shape notes: Administered by National Able with subgrantees; restricted to specific service areas with funding; priority tiers heavily influence enrollment; income based on 125% FPL with detailed inclusions/exclusions.
- **Legal Services for Seniors (via AAAs)** — service|advocacy ([source](https://dhhs.ne.gov/pages/aging-legal-services.aspx))
  - Shape notes: This program's structure is highly decentralized and regionally variable. Eligibility criteria (especially income/asset limits) are not standardized statewide and must be determined by contacting the local Area Agency on Aging. Services are delivered through a partnership model: ElderAccessLine (statewide phone line) provides initial advice, while regional AAAs may contract with local attorneys for expanded services. The program is free but limited in scope (brief services, not full representation). No online application process is documented; all access is through phone or in-person contact with regional offices.
- **Nebraska Community Aging Services Act** — service ([source](https://dhhs.ne.gov/pages/aging.aspx))
  - Shape notes: The Nebraska Community Aging Services Act is a framework law that establishes the structure for aging services statewide but delegates eligibility determination and service delivery to regional Area Agencies on Aging. There are no published statewide income or asset limits. Eligibility is individualized and varies by region, service type, and local Area Agency on Aging priorities. This is fundamentally different from programs with fixed, published eligibility criteria. The program emphasizes community-based services to support independence rather than institutional care. Families must contact their local Area Agency on Aging for specific eligibility information and available services.
- **Aging & Disability Resource Center Act** — service ([source](https://nebraskalegislature.gov/laws/statutes.php?statute=68-1116))
  - Shape notes: No income/asset test for core ADRC info services; regional via area agencies on aging; facilitates access to tiered waivers (e.g., AD Waiver) with NFLOC and Medicaid reqs; open to caregivers/family
- **Aid to the Aged, Blind, and Disabled (AABD)** — financial ([source](https://dhhs.ne.gov/Pages/Aged-Blind-or-Disabled.aspx))
  - Shape notes: State cash/medical supplement for SSI-denied short-term disabled/blind or aged; maximum benefit varies by living arrangement, not household size; disability duration key differentiator from federal SSI.
- **Social Service for Aged and Disabled Adults (SSAD)** — service ([source](https://dhhs.ne.gov/Pages/Social-Services-Aged-and-Disabled-Adults.aspx))
  - Shape notes: State-funded non-Medicaid program for gaps in coverage; income and need-tested without detailed limits published; services tailored to requested needs rather than fixed tiers.

## Program Details

### Aged and Disabled (AD) HCBS Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, OR any age with a qualifying disability+
- Income: Must be eligible for Nebraska Medicaid based on income and resource guidelines. Specific dollar amounts not provided in search results; applicants must apply through Nebraska Medicaid first to determine income eligibility.
- Assets: Home equity interest cannot exceed $752,000 (as of 2026). Home equity is calculated as current home value minus outstanding mortgage. Exceptions to asset limits apply if: applicant has a spouse living in home, has a minor child (17 or younger) living in home, or has a permanently disabled or blind child (any age) living in home.
- Must be a U.S. citizen or qualified alien lawfully present in the United States
- Must be a Nebraska resident
- Must be enrolled in Nebraska Medicaid
- Must meet Nursing Facility Level of Care (NFLOC) requirements
- Must have a need for at least one waiver service to maintain community living

**Benefits:** Services include: assistance with personal cares, light housekeeping, meal preparation, transportation to medical appointments, essential errands, and Personal Emergency Response System (PERS) when eligible. Specific dollar amounts and hours per week not provided in search results.
- Varies by: Age and individual care needs; PERS eligibility varies by living situation and health status

**How to apply:**
- Online: Visit iServe Nebraska
- Phone: Call DHHS at 877-667-6266 (toll-free) or 402-471-8501
- Mail: Submit to DDD Eligibility, PO Box 98947, Lincoln, NE 68509-8947
- Email: DHHS.HCBSWaiverApp@nebraska.gov
- Fax: 402-328-6257
- Paper application available through AmanaCare or by requesting from DHHS

**Timeline:** Level of Care assessment scheduled within 14 days of application submission
**Waitlist:** Not specified in search results

**Watch out for:**
- Nursing Facility Level of Care is a clinical requirement, not just age or disability status. Applicants must demonstrate they need assistance with Activities of Daily Living (ADLs) such as toileting, continence, bathing, dressing, transferring, mobility, or eating. Specific functional criteria: limited functioning with at least 3 ADLs plus at least 1 risk factor/medical condition/cognitive limitation, OR limited functioning with at least 1 ADL plus at least 1 risk factor AND at least 1 cognitive limitation.
- Must first qualify for Nebraska Medicaid before applying for the AD Waiver — this is a two-step process, not one application.
- Home equity limit of $752,000 is specific to 2026 and may change annually.
- The waiver program is designed to allow people to live at home instead of in a nursing facility, but only if waiver services can safely meet their care needs in the community — safety assessment is required.
- Waiver approval dates show expiration of 07/31/2026, suggesting potential renewal or program changes may occur; families should verify current status.
- Income limits are tied to Nebraska Medicaid eligibility, which has specific thresholds not detailed in these search results — applicants must contact DHHS or use the American Council on Aging's Medicaid Eligibility Test for Nebraska to determine if they qualify.

**Data shape:** This program combines age-based and disability-based eligibility into a single waiver. Benefits are service-based rather than cash-based, and availability depends on individual functional assessment using the interRAI Home Care tool. The program is statewide but administered through DHHS with regional Area Agencies on Aging providing local support. Key distinction: this is a Medicaid waiver program, meaning Medicaid enrollment is a prerequisite, not an outcome. The Nursing Facility Level of Care requirement is the primary clinical gate — without meeting this threshold, applicants do not qualify regardless of age or disability status.

**Source:** https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits or financial criteria for eligibility. Medicaid eligibility (if seeking full coverage) follows state long-term care rules: income under $2,901/month (300% FBR for 2025) for singles; assets $2,000 or less (excluding primary home). Most participants are dually eligible for Medicare/Medicaid, but not required.
- Assets: No asset limits for PACE eligibility itself. For Medicaid coverage: assets $2,000 or less (excluding primary home). Private pay available without asset test.
- Certified by Nebraska as meeting nursing facility level of care (NF LOC) per 471 NAC 12.
- Able to live safely in the community at time of enrollment with PACE services.
- Live in the PACE service area (Douglas, Sarpy, and select zip codes in Cass, Dodge, Saunders, Washington Counties).
- Not enrolled in Medicare Advantage (Part C) or Medicare prepaid plan.

**Benefits:** All-inclusive: primary care, hospital/inpatient, ER, medications, transportation, adult day health care, home care, therapies (PT/OT/ST), social services, respite, palliative care, nursing home care if needed. No deductibles/co-pays for Medicare/Medicaid enrollees. Private pay or share-of-cost option.
- Varies by: region

**How to apply:**
- Phone: Contact Immanuel Pathways (specific number not in sources; call Nebraska DHHS at general Medicaid line or visit provider site).
- In-person: Immanuel Pathways centers in Omaha (Douglas/Sarpy Counties service area).
- Direct inquiry to PACE organization (Immanuel Pathways Eastern Nebraska).

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; potential regional wait times via provider.

**Watch out for:**
- Not statewide—only Eastern Nebraska; check zip code eligibility.
- Must not be in Medicare Advantage; disenroll first.
- NF LOC certification required (state-determined via 471 NAC 12).
- Private pay can cost $7,000+/month if not dually eligible.
- Voluntary; can disenroll anytime, but PACE becomes sole Medicare/Medicaid service source.

**Data shape:** Only 1 provider in NE (Immanuel Pathways); county/zip-restricted service area; no financial eligibility test for program entry (Medicaid separate for coverage); NF LOC state-certified.

**Source:** https://dhhs.ne.gov/Pages/Medicaid-Provider-All-Inclusive-Care-for-the-Elderly.aspx

---

### Medicare Savings Program (QMB, SLMB, QI)


**Eligibility:**
- Income: Income limits are based on Federal Poverty Level (FPL) and follow federal standards in Nebraska, updated annually (effective April 1). For 2026: QMB ≤100% FPL ($1,350 individual, $1,824 couple monthly); SLMB 100-120% FPL (approx. $1,350-$1,620 individual); QI 120-135% FPL (approx. $1,620-$1,823 individual). Exact limits vary by year and household size; Nebraska uses federal figures without expansion[1][7]. Full table by household size available via state Medicaid office as FPL multipliers apply.
- Assets: Resources limited; 2026 federal/Nebraska: QMB/SLMB/QI $9,950 individual/$14,910 couple (adjusted annually). Counts: bank accounts, stocks (per 477 NAC 23); exempts: home, one car, burial plots, life insurance up to $1,500 face value, personal items. MSP/QMB allows higher resources than standard Medicaid ($4,000/$6,000)[2][3][4][7].
- Eligible for Medicare Part A (even if not enrolled); must have Part B for SLMB/QI.
- Nebraska resident, U.S. citizen or qualified non-citizen.
- Annual review required for income/resources[2][3].

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copayments for covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only. Automatic qualification for Extra Help (Part D low-income subsidy). No additional medical services or state supplements beyond Medicare cost-sharing[1][2][6][7].
- Varies by: priority_tier

**How to apply:**
- Apply through Nebraska DHHS ACCESSNebraska system: https://accessnebraska.ne.gov.
- Phone: Nebraska DHHS Customer Service 1-800-383-4278.
- Mail or in-person: Local DHHS Service and Support Center (find via dhhs.ne.gov).
- No specific form number; use Medicaid application for MSP[1].

**Timeline:** Typically 45 days for Medicaid applications; no specific MSP timeline stated.
**Waitlist:** QI may have prioritization/funding limits (state-dependent); others generally no waitlist[1].

**Watch out for:**
- Nebraska follows strict federal asset limits (no elimination like CT); MSP/QMB has higher resource cap than regular Medicaid[2][3][4].
- Must have Part B enrolled for SLMB/QI; QMB covers more but income strictest.
- QI funding limited/prioritized; apply early in year.
- Income/resources counted per 477 NAC 22/23; $20 disregard may apply.
- Effective date: month of application for QMB[1].
- Annual redetermination required[2].

**Data shape:** Tiered by income brackets (QMB/SLMB/QI) with uniform federal limits in Nebraska; asset-exemptions standard but MSP/QMB uniquely allows excess resources over base Medicaid; statewide uniform, no county variations.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov/Pages/Medicaid-Customer-Contacts.aspx or https://accessnebraska.ne.gov

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (relevant for elderly loved ones): No gross income limit. Only if gross income exceeds 165% FPL must meet net income test (100% FPL). 165% FPL gross limits (Oct 2025-Sep 2026): 1: $2,152/mo ($25,823/yr); 2: $2,908/mo ($34,898/yr); 3: $3,664/mo ($43,973/yr); 4: $4,421/mo ($53,048/yr); +$756/mo ($9,075/yr) each additional. 100% FPL net limits: 1: $1,304/mo ($15,650/yr); 2: $1,763/mo ($21,150/yr); 3: $2,221/mo ($26,650/yr); 4: $2,679/mo ($32,150/yr); +$458/mo ($5,500/yr) each additional. Net income = gross minus deductions (e.g., standard 20% earned income, shelter, utilities up to $615 heating/cooling allowance, medical expenses >$35/mo for 60+ or disabled).[1][3][4]
- Assets: Households with elderly (60+) or disabled: $4,500 limit (Expanded Resource Program). Counts: cash, bank accounts, non-exempt property. Exempt: primary home, household goods, retirement savings, life insurance cash value (if not income-producing), one vehicle per adult, income-producing property (in some cases). All other households: $3,000; ERP households: $25,000.[1][7]
- Nebraska resident; U.S. citizen or qualified non-citizen (e.g., 5+ years residency, refugees, certain lawful permanent residents). Only applicants need citizenship proof.
- Household includes those who buy/prepare food together.
- Income includes Social Security, pensions, veterans/disability benefits.

**Benefits:** Monthly EBT card for food purchases (groceries, not hot/prepared foods). Amount based on net income, household size, max allotment minus 30% net income (e.g., 2-person elderly/disabled example: $546 max - 30% of $1,200 net = $415/mo). Exact amounts vary; minimums/maximums apply. Certification: 12 months for 60+/disabled households.[1][4][5]
- Varies by: household_size

**How to apply:**
- Online: https://accessnebraska.ne.gov
- Phone: 1-800-383-4278 (Nebraska DHHS Assistance Hotline)
- Mail: Send form to local DHHS office (find via dhhs.ne.gov)
- In-person: Local DHHS Service and Support Center (locations at dhhs.ne.gov/pages/Find_Local_Office.aspx)

**Timeline:** Determined within 30 days; expedited if very low income (7 days). Certification period 12 months for elderly/disabled.[4]

**Watch out for:**
- Elderly households skip gross income test unless over 165% FPL—many miss expanded eligibility.[1]
- High medical expenses ($35+/mo unreimbursed) or utilities deduct significantly from net income.[1][4]
- Assets include most countable resources but exempt home/savings—people overlook exemptions.[7]
- Household size includes food-sharers, even non-applicants.[2]
- Non-citizens need 5-year residency or specific status.[6]

**Data shape:** Elderly/disabled households exempt from gross income limit (unless >165% FPL), higher asset limit ($4,500), 12-month recertification, deductions for medical/utilities heavily favor seniors; benefits scale precisely by net income and household size with federal max allotments.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov/pages/snap.aspx

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross annual income at or below 150% of the federal poverty level (October 1, 2025 - September 30, 2026): Household of 1: $23,475; 2: $31,725; 3: $39,975; 4: $48,225; 5: $56,475; 6: $64,725; 7: $72,975; 8: $81,225. Add $8,250 for each additional member.[3][5]
- Assets: Resources/assets are considered in benefit calculation along with income, household size, fuel type, and housing type. Specific asset limits, countable items, or exemptions not detailed in sources.[6]
- Meet citizenship and residency requirements (U.S. citizen or qualified non-citizen, Nebraska resident).[1][3]
- Responsible for home energy utilities.[1][3]
- Not otherwise disqualified or ineligible.[1][3]
- For priority/crisis: Household with member age 60+, under 6, disabled, medical condition aggravated by heat/cold (verified by provider), or uses electricity-dependent medical device.[5]
- For cooling priority: Child under 6 on ADC, age 70+, severe heat-aggravated illness (verified), or no DHHS AC in past 4 years.[3][4]

**Benefits:** One-time payment to utility company for heating (Oct 1-Mar 31) or cooling costs, calculated after eligibility using formula disregarding 20% of gross countable earned income, based on income, assets, size, fuel type, housing. Exact max/min amounts (e.g., regular, crisis) not specified in sources. Crisis for emergencies like shutoff or broken heater. Related: Weatherization (separate eligibility).[2][5][6]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://iserve.nebraska.gov or accessnebraska.ne.gov.[4][6]
- Phone: 1-800-383-4278 for paper application.[6]
- In-person: DHHS offices (list at https://dhhs.ne.gov/Pages/Public-Assistance-Offices.aspx).[4]
- Mail: Paper application via phone request.[6]

**Timeline:** Eligibility determined within 30 days of valid application receipt; may extend if docs delayed.[5]
**Waitlist:** Funding limited; applications may close early if funds exhausted (no formal waitlist mentioned).[2]

**Watch out for:**
- Auto-eligible if receiving Economic Assistance (no app needed).[1]
- Everyone at address counts as household (even non-expense sharers).[2]
- Gross income used; 20% earned income disregard only post-eligibility for benefit calc.[5]
- Heating season Oct 1-Mar 31; cooling summer; crisis year-round emergencies; apply early as funds limited.[1][2]
- Different eligibility for weatherization/HCRRA.[3]
- Age 60+ (not just 70) for some priorities.[5]

**Data shape:** Income table fixed at 150% FPL with annual updates; benefits formula-based (20% earned income disregard post-eligibility, factors in assets/fuel/housing); priority tiers by vulnerability; statewide but local DHHS offices handle; funding can end applications early.

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
- Income: Household income at or below 200% of the federal poverty level. Example from Mid-Nebraska (likely recent): For 8-person household, $105,440; adds $10,760 per additional person. Exact amounts revised annually; SSI, TANF, or LIHEAP recipients automatically eligible regardless of income.[2][3][4][6]
- Assets: No asset limits mentioned in program policies.[2]
- Occupied by eligible family (owner or renter with landlord permission, including single-family, multi-family, mobile homes, frame homes)
- Dwelling must meet structure eligibility (e.g., weatherization needs)
- Automatic eligibility if household received SSI, TANF cash assistance (Title IV/XVI), or LIHEAP in current or prior 12 months.[2][1][3]

**Benefits:** Free energy-efficiency improvements including sidewall/attic insulation, caulking/weatherstripping, glass repair, furnace repair/replacement (home-owned only), indoor air quality checks, combustion safety, carbon monoxide testing, health/safety measures; certified inspection post-work.[1][3][5]
- Varies by: priority_tier

**How to apply:**
- Varies by region/provider (e.g., Douglas County: call 402-342-8232 or unitedwaymidlands.org/weatherization; United Way Midlands: 402-444-6666 opt 6, DCWAP@uwmidlands.org, mail to 1229 Millwork Ave Suite 402 Omaha NE 68102-4277; Northeast Nebraska: online Weatherization Application at nencap.org; Mid-Nebraska: contact communityactionmidne.com; statewide contact via dee.nebraska.gov or catenergy.ne.gov).[1][3][5]

**Timeline:** Not specified; re-verify income if work not started within 12 months.[2]
**Waitlist:** Regional waitlists exist (e.g., Northeast Nebraska 14-county area may have waits as they weatherize ~100 homes/year).[3]

**Watch out for:**
- Must meet both client income AND dwelling/structure eligibility; automatic eligibility limited to SSI/TANF/LIHEAP recipients in specific timeframes (current year or prior 12 months); renters need landlord permission; regional providers mean contacting wrong one delays process; priority to elderly (60+), disabled, young children—not guaranteed service; waitlists common in lower-capacity areas; income re-verified after 12 months if delayed.[1][2][3][4]

**Data shape:** Administered by regional subgrantees with statewide uniform eligibility (200% FPL or auto-qualifiers) but varying application contacts, capacities, wait times; priority tiers favor elderly/disabled; no age minimum but elderly prioritized.[2][3][4]

**Source:** https://dee.nebraska.gov/sites/default/files/publications/22-044-Final_WX_Full_Policies_and_Procedures_Manual.pdf

---

### Nebraska SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare-eligible individuals, families, and caregivers[1][2][6]
- Assets: No asset limits; services are free and not restricted by resources[1][2][4][6]
- Must be eligible for Medicare or a family member/caregiver of a Medicare beneficiary[1][2][3]

**Benefits:** Free, unbiased one-on-one counseling on Medicare eligibility/benefits, Medicare Supplement Insurance, Prescription Drug Plans, Medicare Advantage Plans, Extra Help for prescription costs, employer/retiree insurance; assistance applying for programs to help pay Medicare/drug costs for those with limited income/resources; Medicare fraud prevention/education via SMP; personalized problem-solving, outreach, and community speaking[1][2][4]

**How to apply:**
- Phone: 1-800-234-7119 (toll-free, statewide, hours 8:00 am - 4:30 pm)[1][2][3][7]
- Website: https://doi.nebraska.gov/consumer/nebraska-ship-smp or https://doi.nebraska.gov/ship-smp[2][3][4][7]
- Email: doi.ship@nebraska.gov[4]
- In-person: Through statewide network of certified counselors and local partners like Area Agencies on Aging (e.g., Northeast Nebraska AAA, Volunteers Assisting Seniors in Omaha, West Central Nebraska AAA in North Platte)[1][4]

**Timeline:** No formal application or processing; counseling arranged directly upon contact[1][2]

**Watch out for:**
- Counselors do not recommend specific policies, companies, or agents—only provide unbiased information[1][2]
- Not an insurance seller or endorser; focuses on education and fraud prevention[1][2][4]
- Separate from hospital FLEX SHIP grants (unrelated rural health funding)[5]
- Volunteers and paid staff provide services; anyone with Medicare questions (beneficiaries, relatives, providers) can call[1][2]

**Data shape:** no income or asset test; free counseling service for Medicare navigation via statewide counselor network and local AAA partners; no formal enrollment—contact to arrange session

**Source:** https://doi.nebraska.gov/consumer/nebraska-ship-smp

---

### Home-Delivered Meals (via Area Agencies on Aging)


**Eligibility:**
- Age: 60+
- Income: No specific income limits or dollar amounts stated; priority given to low-income older adults, including low-income minority older adults[1][2][4]
- Assets: No asset limits mentioned; no information on what counts or exemptions[1][2][4]
- Unable to attend a congregate meal (homebound by reason of illness, incapacitating disability, or otherwise isolated; definition set by each Area Agency on Aging)[1][2][4]
- Spouse of an eligible individual (60+ and unable to attend congregate meal), regardless of age, if it supports maintaining the person at home[1][2][4]
- Dependent individual with a disability living with an eligible individual (60+), regardless of age[1][2][4]
- Preferences: low-income, limited English proficiency, rural residents[1][2][4]

**Benefits:** Nutritionally balanced meals (hot, cold, frozen, or shelf-stable) meeting 1/3 of daily recommended dietary needs for adults 60+ per USDA, approved by registered dietitian; delivered Monday-Friday by volunteers or drivers; some locations offer weekends for extreme needs; suggested voluntary contribution (not a bill or required fee)[1][2][4]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (varies by region; no statewide phone listed)
- Initial eligibility determination in person or by telephone[4]
- Written assessment within 2 weeks of first meal[4]

**Timeline:** Written assessment within 2 weeks of first meal; reassessment annually or on status change[4]
**Waitlist:** Waiting lists established when providers cannot serve all eligible individuals[4]

**Watch out for:**
- No federal or state income/asset tests, but local Area Agencies set homebound criteria—must confirm with local agency[1]
- Suggested contributions are voluntary; statements cannot imply requirement[4]
- Priority to greatest need (economic/social, homebound, isolated); waitlists common when capacity limited[2][4]
- Separate from Medicaid waivers (e.g., Aged/Disabled, TBI) which have different processes via case managers[3][5]

**Data shape:** Administered by local Area Agencies on Aging with region-specific providers, homebound definitions, and potential weekend availability; no fixed income/asset limits or statewide application portal; priority-based with waitlists

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov/Medicaid%20SUA/SUA-21-PI-02%20Home%20Delivered%20Meals.pdf

---

### Lifespan Respite Services

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income eligible (financial criteria apply; family must meet financial need per state statute). Exact dollar amounts or household size table not specified in sources; verification may be requested by program staff.[2][3][6]
- Assets: Liquid resources/assets considered for eligibility, including cash on hand, checking/savings accounts, certificates of deposit, stocks, bonds, life insurance cash values, IRA/Keogh funds. Verification may be requested to demonstrate financial need; incomplete info delays determination. Exemptions not specified.[3][6]
- Care recipient has special needs (medical, mental, behavioral, or disability requiring full-time ongoing supervision/care; e.g., developmental disability, brain injury, mental illness, hearing/visual impairment, orthopedic, other health impairment).[1][2][3][6]
- Unpaid primary family caregiver (parent, spouse, family, or friend providing continuous full-time care in non-institutional home/community setting).[2][4][6]
- Not receiving respite services or subsidy from another government program.[1][2][6]
- U.S. citizen or qualified alien under federal Immigration and Nationality Act.[3]

**Benefits:** Up to $125 per month for planned respite services (in-home, community, or facility settings). Additional $2,000 per eligibility period for qualified Exceptional Circumstances (e.g., crisis respite; requires separate funding application and approval).[2][7]
- Varies by: exceptional_circumstances

**How to apply:**
- Phone: Call 1-866-737-7483 (1-866-RESPITE) for local Respite Network Coordinator assistance or to learn eligibility.[3][6][7]
- Email: dhhs.respite@nebraska.gov[3]
- Mail: Nebraska Department of Health and Human Services, CFS, Economic Assistance - Lifespan Respite Subsidy, PO Box 95026, Lincoln, NE 68509 (include application and documentation).[3]
- Social Services Worker: (402) 471-9188[6]

**Timeline:** Not specified; incomplete applications or failure to verify assets/income may delay eligibility determination.[3][6]
**Waitlist:** Priorities and waiting lists may be established based on care recipient's special needs.[3]

**Watch out for:**
- Not available if receiving respite from another government program.[1][2][6]
- Exceptional Circumstances funding ($2,000) requires separate application and approval.[2]
- Asset/income verification may be requested; incomplete info delays eligibility.[3][6]
- Must live in non-institutional setting with unpaid caregiver.[2][4]
- Priorities/waitlists based on needs; high risk of out-of-home placement noted on application.[3][6]

**Data shape:** Financial subsidy with asset/income test (verification as-needed); exceptional crisis funding separate; statewide via network coordinators; excludes those on other govt respite.

**Source:** https://dhhs.ne.gov/Pages/Respite.aspx

---

### Nebraska Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are based on current HHS poverty guidelines (e.g., for 2025-2026, check latest at aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines; no specific table in sources, but calculated using income inclusions/exclusions per TEGL 12-06). Income from last 6-12 months considered, including SSA, SSDI, SSI, disability benefits.
- Assets: No asset limits mentioned.
- Unemployed at time of application
- Reside in a service area with available funding (National Able areas in Nebraska)
- Willing to provide community service, attend meetings/training, develop Individual Employment Plan (IEP), use job search resources

**Benefits:** Part-time community service work (typically 20 hours/week at minimum wage) at non-profits for training in skills like childcare, customer service, teachers' aide, computer technician, building maintenance, healthcare; leads to unsubsidized employment; orientation within 10 days of enrollment; semi-annual reassessments.
- Varies by: priority_tier

**How to apply:**
- Contact National Able (primary Nebraska grantee): See handbook for local offices (e.g., Eastern Nebraska Office on Aging, Aging Partners as subgrantees)
- Experience Works (National SCSEP sponsor in Nebraska)
- Local SCSEP offices via nationalable.org or dol.nebraska.gov
- Online interest form example at tfaforms.com/4891021 (general SCSEP, verify for NE)

**Timeline:** Eligibility determination after application review; orientation within 10 days of enrollment if eligible.
**Waitlist:** Possible if no available funding in service area; enroll if eligible and no waiting list.

**Watch out for:**
- Not entitled to benefits until formal eligibility approval; annual re-verification required.
- Must be in funded service area; ineligible if funding unavailable.
- Priority given to veterans/qualifying spouses, age 65+, disabled, rural residents, limited English/low literacy, low employment prospects—may affect selection.
- Unemployment must be current at application; willing participation in community service/training mandatory.
- No guaranteed unsubsidized job; program focuses on training leading to employment.

**Data shape:** Administered by National Able with subgrantees; restricted to specific service areas with funding; priority tiers heavily influence enrollment; income based on 125% FPL with detailed inclusions/exclusions.

**Source:** https://www.nationalable.org/wp-content/uploads/2020/02/SCSEP_NebraskaHandbook_013120.pdf

---

### Legal Services for Seniors (via AAAs)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Search results indicate the program serves seniors with 'economic or social needs' but do not provide specific income thresholds. One local provider (Aging Partners in Lancaster County) mentions 'limited income and limited resources' as criteria but does not publish statewide income guidelines.
- Assets: Lancaster County (Aging Partners): Individual $12,000, Couple $24,000 (excluding principal residence). Statewide limits not documented in search results.
- Nebraska residency
- Economic or social need (criteria not precisely defined in available sources)

**Benefits:** Free legal advice, counseling, and brief services. Specific services include: collections, Medicaid/Medicare, consumer protection, homestead exemptions, simple wills, advanced directives, power of attorney, tenant issues, income security, health care, long-term care, abuse/neglect, individual rights, guardianship prevention, bankruptcy, foreclosures, and fraud. One law clinic per year on power of attorney/health care power of attorney in some service areas.
- Varies by: region

**How to apply:**
- Phone: ElderAccessLine 1-800-527-7249 (statewide) or 402-827-5656 (Omaha area)
- Phone: Individual Area Agency on Aging offices (eight regional AAAs across Nebraska)
- In-person: Nearest Area Agency on Aging office
- Website: legalaidofnebraska.org (for general information)

**Timeline:** Not specified in available sources. ElderAccessLine calls are answered by experienced attorneys or paralegals who assess your situation during the call.
**Waitlist:** Not documented in search results

**Watch out for:**
- Income and asset limits are NOT clearly published statewide. Only Lancaster County's limits are documented ($12,000 individual / $24,000 couple in assets). Families must contact their regional AAA to learn their specific eligibility thresholds.
- ElderAccessLine has limited hours: Monday–Thursday 9 a.m.–noon and 1–3 p.m., Friday 9 a.m.–noon (Central Time). Calls outside these windows cannot be answered.
- Services are 'brief services' — this is not unlimited legal representation. The program is designed for advice, counseling, and limited representation, not full litigation support.
- Power of attorney/health care power of attorney law clinics are held only once per year in each service area, so timing matters if you need in-person assistance with these documents.
- The program prioritizes seniors with 'economic or social needs,' but the exact definition and priority ranking are not publicly documented.
- Regional variation is significant: some areas (like Lancaster County) have contracted attorneys available for negotiation and representation; others may offer only phone-based advice through ElderAccessLine.
- This is a civil legal services program only — it does not handle criminal matters.

**Data shape:** This program's structure is highly decentralized and regionally variable. Eligibility criteria (especially income/asset limits) are not standardized statewide and must be determined by contacting the local Area Agency on Aging. Services are delivered through a partnership model: ElderAccessLine (statewide phone line) provides initial advice, while regional AAAs may contract with local attorneys for expanded services. The program is free but limited in scope (brief services, not full representation). No online application process is documented; all access is through phone or in-person contact with regional offices.

**Source:** https://dhhs.ne.gov/pages/aging-legal-services.aspx

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- No eligibility restrictions — anyone can contact the program
- Services available to residents of nursing homes, assisted living facilities, board and care homes, hospice centers, adult day care, and long-term rehabilitation centers
- Family members, friends, facility staff, and citizen groups can also access services on behalf of residents

**Benefits:** FREE confidential services including: (1) Education on aging, long-term care, and residents' rights; (2) Information & Referral to empower individuals to resolve concerns independently; (3) Consultation with recommendations for protecting resident rights and improving care; (4) Individual Advocacy to facilitate resolution of complaints and protect rights; (5) Systems Advocacy to identify problematic trends and advocate for systemic changes
- Varies by: not_applicable — services are universal and free

**How to apply:**
- Phone: (800) 942-7830
- Website: https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx
- Mail: PO Box 95026, Lincoln, NE 68509-5026
- Fax: (402) 802-5541

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- This is NOT a financial assistance program — it provides advocacy and complaint resolution services only, not direct payment or in-kind benefits
- Services are confidential unless the resident/family explicitly gives permission to share concerns
- The program investigates complaints but does not provide direct care or medical services
- Ombudsmen cannot investigate complaints involving providers they were previously employed by or associated with
- This program is mandated by federal law (Older Americans Act) but operates at the state level — services and responsiveness may vary by region
- The program addresses concerns about 'health, safety, welfare, or rights' — not all resident complaints may qualify

**Data shape:** This is a universal advocacy program with no income, asset, or age eligibility barriers. Unlike means-tested benefit programs, there are no financial thresholds, household size calculations, or asset exemptions. The program is free and confidential. Key limitation: search results do not provide specific processing timelines, application forms, required documents, or detailed regional office locations — families should contact the state office directly at (800) 942-7830 for intake procedures.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov/Pages/Aging-Ombudsman.aspx

---

### Aged and Disabled Waiver


**Eligibility:**
- Age: 65 or older, or any age if physically disabled[1][2][3][4]+
- Income: Must be eligible for Nebraska Medicaid; specific dollar amounts or household size tables not detailed in sources—standard Medicaid income rules apply (use Medicaid eligibility test for details)[1][2][4]
- Assets: Home equity interest no greater than $752,000 in 2026 if living in home or intent to return; exemptions if spouse or minor/permanently disabled child lives in home[1]
- Nebraska resident and U.S. citizen or qualified alien[4]
- Receive and maintain Nebraska Medicaid eligibility[2][3][4]
- Meet Nursing Facility Level of Care (NFLOC) via interRAI-HC assessment: limited functioning in at least 3 ADLs (e.g., toileting, bathing) plus 1 risk factor/medical condition/limited cognition, or 1 ADL plus risk factor and limited cognition[1]
- Need for waiver services[2]
- Cost of services cannot exceed Medicaid rates for Skilled Nursing Facility[3]
- Participate in safe, Person-Centered Plan[3]

**Benefits:** Adult Day Health, Assisted Living, Assistive Technology, Chore, Companion, Extra Care for Children with Disabilities, Home Again, Home and Vehicle Modifications (full list in DHHS resources); also Personal Emergency Response System (PERS) for those living alone/with impaired caregiver, fall history, or emergency risk[2][4]
- Varies by: individual needs via Person-Centered Plan; priority not specified[3]

**How to apply:**
- Online via iServe: iserve.nebraska.gov/apply/program-select (apply for Medicaid and AD Waiver simultaneously)[4][6]
- Email: dhhs.hcbswaiverapp@nebraska.gov[4]
- Phone: (877) 667-6266[4]
- Mail: Nebraska State Office Building, 301 Centennial Mall South, PO Box 98947, Lincoln, NE 68509-8947[4]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; potential due to NFLOC and service needs[null]

**Watch out for:**
- Must already qualify for or apply for Nebraska Medicaid simultaneously—waiver not standalone[2][4]
- Strict NFLOC via interRAI-HC; functional limitations in ADLs required[1]
- Home equity limit $752,000 (2026) unless exemptions apply[1]
- Services cost-capped at nursing facility rates[3]
- Distinguish from other waivers like TBI or DD waivers[5]

**Data shape:** Tied to Medicaid eligibility with NFLOC assessment; services individualized via Person-Centered Plan; statewide but regional coordinators/providers; no explicit income tables or waitlist details in sources

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhhs.ne.gov/Pages/Medicaid-Aged-and-Disabled-Waiver.aspx[2]

---

### Nebraska Community Aging Services Act

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income limits are not specified in available sources. Eligibility is determined on a case-by-case basis by individual Area Agencies on Aging, taking into account needs, resources, and community standards. The Social Services for Aged and Disabled Adult Program (SSAD), which provides services under this framework, bases eligibility on client income and need for the requested service, but specific dollar thresholds are not published.
- Assets: Asset limits are not specified in available sources for the Nebraska Community Aging Services Act itself. However, for Medicaid-funded long-term care services (which operate under a related framework), a single applicant must have assets under $4,000 as of 2026.
- Must be 60 years of age or older (primary eligibility)
- For individual services: assessment of individual's or family's circumstances and development of a service plan required
- For congregate activities: determination left to Area Agency on Aging based on community needs and resources
- Priority attention given to those in greatest need
- Eligibility determination varies by service type and Area Agency on Aging

**Benefits:** Services include congregate activities (group-based activities at senior service centers), community aging services to promote self-sufficiency, congregate or delivered meals, adult day care, transportation, homemaker services, and other community-based services. Specific dollar amounts or hours per week are not specified in available sources and vary by service and Area Agency on Aging.
- Varies by: service_type, region, individual_need_assessment

**How to apply:**
- Contact your local Area Agency on Aging (specific phone numbers and websites not provided in available sources)
- In-person at Area Agency on Aging office (locations vary by region)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- No published income or asset limits: Unlike Medicaid programs, the Nebraska Community Aging Services Act does not publish specific income thresholds. Eligibility is determined individually by your local Area Agency on Aging based on need and community resources. This means two people with identical incomes in different regions could have different eligibility outcomes.
- Eligibility determination is decentralized: The state law explicitly leaves eligibility determination to individual Area Agencies on Aging for congregate activities. There is no single statewide standard—what qualifies you in one county may not in another.
- This is NOT Medicaid: The Nebraska Community Aging Services Act funds community-based services to help people remain independent at home. It is separate from Medicaid nursing home coverage. If you need institutional long-term care, you may need to apply for Medicaid separately.
- Services are not guaranteed: Funding is limited and services are prioritized for those in greatest need. Even if you meet age requirements, service availability depends on Area Agency on Aging resources and priorities.
- Assessment required for individual services: You cannot simply apply and receive services. An assessment of your circumstances and a service plan must be developed, which takes time.
- No financial eligibility requirement for some services: Congregate and home-delivered meals and transportation have no financial eligibility requirement, but other services may have income-based considerations.
- Specific service availability varies: Not all services are available in all regions. Contact your local Area Agency on Aging to learn what is actually available in your area.

**Data shape:** The Nebraska Community Aging Services Act is a framework law that establishes the structure for aging services statewide but delegates eligibility determination and service delivery to regional Area Agencies on Aging. There are no published statewide income or asset limits. Eligibility is individualized and varies by region, service type, and local Area Agency on Aging priorities. This is fundamentally different from programs with fixed, published eligibility criteria. The program emphasizes community-based services to support independence rather than institutional care. Families must contact their local Area Agency on Aging for specific eligibility information and available services.

**Source:** https://dhhs.ne.gov/pages/aging.aspx

---

### Aging & Disability Resource Center Act

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits stated in the Act; eligibility is open to persons aged 60+ or with disabilities of any age, family members, caregivers, advocates, and providers. For linked programs like Medicaid AD Waiver, income must meet Medicaid requirements (not detailed here with dollar amounts), and functional need for Nursing Facility Level of Care is required.[1][2][3][5][6]
- Assets: No asset limits under the Act itself. For AD Waiver, home equity limit of $752,000 in 2026 (exempt if spouse or minor/permanently disabled child lives there); other exemptions may apply per Medicaid rules.[1]
- Nebraska resident
- For full long-term care access via ADRC, often requires Nursing Facility Level of Care (NFLOC) assessed via interRAI-HC tool: limited functioning in at least 3 ADLs (e.g., toileting, bathing) plus risk factor/medical condition/limited cognition, or 1 ADL limitation with risk and cognition issues
- Be eligible for Nebraska Medicaid for HCBS waivers accessed through ADRC
- SSN required for assistance programs
- Responsible for relative financial support per rules
- Blind/disabled determination by SSA for some aid categories[1][2][3]

**Benefits:** Comprehensive information on long-term care programs/options/financing/providers; options counseling; assistance accessing/applying for public benefits; single point of entry to publicly supported long-term care; identification of unmet needs with recommendations; person-centered transition support. Links to services like AD Waiver (in-home care, personal care, homemaker, respite) but does not directly provide funded services—facilitates access.[5][6][7]
- Varies by: region

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) by phone or in-person (regional numbers via area agencies on aging, e.g., Northeast Nebraska AAA at nenaaa.com)
- Online via dhhs.ne.gov for linked waivers
- Phone for assessment scheduling (DDD calls within 14 days of Medicaid eligibility check)
- In-person at community-based ADRC sites coordinated by area agencies on aging[3][6]

**Timeline:** For linked AD Waiver: Medicaid check immediate, Level of Care call within 14 days[3]
**Waitlist:** Not specified for ADRC core services; may apply to specific waivers accessed via ADRC[3]

**Watch out for:**
- Not a direct service/funding program—it's an information, counseling, and access hub; must qualify separately for Medicaid waivers (e.g., AD Waiver) for actual in-home services
- Age 60+ or any-age disability, but family/caregivers also eligible for info
- NFLOC required for waiver services, assessed via interRAI-HC—not automatic
- Regional delivery means contacting local ADRC, not centralized state office
- Home equity limit applies to AD Waiver ($752,000 in 2026), often missed[1][5]

**Data shape:** No income/asset test for core ADRC info services; regional via area agencies on aging; facilitates access to tiered waivers (e.g., AD Waiver) with NFLOC and Medicaid reqs; open to caregivers/family

**Source:** https://nebraskalegislature.gov/laws/statutes.php?statute=68-1116

---

### Aid to the Aged, Blind, and Disabled (AABD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Aged: 65 or older. Blind or Disabled: 64 or younger.[1]+
- Income: Must meet income requirements per state regulations (specific dollar amounts not detailed in sources; tied to federal benefit rates and living arrangements, with maximum payable based on no other income).[1][8]
- Assets: Must meet resource limits per state regulations (specific dollar amounts not detailed; SSI-related limits of $2,000 individual/$3,000 couple referenced in broader context).[1][3]
- Nebraska resident.
- Have a Social Security number.
- Responsible for relative financial support.
- Determined blind or disabled by Social Security Administration (SSA) or State Review Team (SRT) for state program if SSI denied for lack of duration.
- Blind: central visual acuity of 20/200 or less.
- Disabled: impairment expected to last 12+ months or result in death (adults); comparable severity for children under 18.
- Cooperate in obtaining third-party medical payments.
- For State Disability Program (SDP): Denied SSI by SSA because disability expected to last less than 12 months and ineligible for Medicaid otherwise.[1][7]

**Benefits:** Monetary payment and medical coverage. Maximum amount based on living arrangement and federal benefit rate (FBR) for individual with no other income; 2025 FBRs apply.[1][7][8]
- Varies by: living_arrangement

**How to apply:**
- Online: Nebraska Department of Health and Human Services website.
- Phone: 402-471-3121 or (800) 358-8802.
- In-person: Local DHHS offices (clients can reside in home, apartment, assisted living, etc.).[6][7]

**Timeline:** Not specified in sources.

**Watch out for:**
- Primarily for those denied federal SSI due to short-term disability (less than 12 months); not for long-term SSI-eligible.[1][5][7]
- Requires SSA or SRT disability determination; state accepts SSA blindness/disability ruling.[1][4]
- Separate from Aged and Disabled Medicaid Waiver (which has NFLOC and different financial criteria).[2]
- Income/resources verified against SSI standards but state-specific maximums apply.[1][8]
- Must be ineligible for Medicaid otherwise for SDP component.[7]

**Data shape:** State cash/medical supplement for SSI-denied short-term disabled/blind or aged; maximum benefit varies by living arrangement, not household size; disability duration key differentiator from federal SSI.

**Source:** https://dhhs.ne.gov/Pages/Aged-Blind-or-Disabled.aspx

---

### Social Service for Aged and Disabled Adults (SSAD)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Based on client's income; specific dollar amounts or household size tables not detailed in sources. Serves clients ineligible for other programs like Medicaid waivers.
- Assets: Not applicable or not specified.
- Aged, blind, or disabled.
- Need assistance to remain independent.
- Income-based eligibility and demonstrated need for the requested service.
- Typically for those ineligible for other assistance programs.

**Benefits:** Chore services (light housekeeping, essential shopping, food preparation, laundry, personal care); Adult Day Care (minimum 3 hours/day in supervised setting for manual, physical, intellectual, and social services); Homemaker services (in-home instructional services); Transportation (non-medical and medical to community resources). No specific dollar amounts or hours per week stated beyond adult day minimum.
- Varies by: need_for_requested_service

**How to apply:**
- Contact local DHHS offices (all ages).
- Phone or in-person via Nebraska DHHS local offices (specific numbers not listed; search dhhs.ne.gov for local contacts).
- Online via iServe Nebraska at iserve.nebraska.gov/apply/program-select (select relevant programs).

**Timeline:** Not specified for SSAD; related AD Waiver processes in 90 days or less.

**Watch out for:**
- Separate from Medicaid Aged and Disabled (AD) Waiver; SSAD is for those ineligible for Medicaid/other programs—do not confuse.
- Eligibility hinges on income AND specific service need; not automatic for aged/disabled.
- No fixed service hours/dollars; authorized based on individual assessment.
- May require proof of ineligibility for other programs.

**Data shape:** State-funded non-Medicaid program for gaps in coverage; income and need-tested without detailed limits published; services tailored to requested needs rather than fixed tiers.

**Source:** https://dhhs.ne.gov/Pages/Social-Services-Aged-and-Disabled-Adults.aspx

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Aged and Disabled (AD) HCBS Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Program (QMB, SLMB, QI) | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Nebraska SHIP (State Health Insurance As | resource | federal | simple |
| Home-Delivered Meals (via Area Agencies  | benefit | state | medium |
| Lifespan Respite Services | benefit | state | deep |
| Nebraska Senior Community Service Employ | employment | federal | deep |
| Legal Services for Seniors (via AAAs) | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Aged and Disabled Waiver | benefit | state | deep |
| Nebraska Community Aging Services Act | benefit | state | deep |
| Aging & Disability Resource Center Act | navigator | state | simple |
| Aid to the Aged, Blind, and Disabled (AA | benefit | state | medium |
| Social Service for Aged and Disabled Adu | benefit | state | deep |

**Types:** {"benefit":12,"resource":3,"employment":1,"navigator":1}
**Scopes:** {"state":9,"local":1,"federal":7}
**Complexity:** {"deep":11,"simple":4,"medium":2}

## Content Drafts

Generated 14 page drafts. Review in admin dashboard or `data/pipeline/NE/drafts.json`.

- **Aged and Disabled (AD) HCBS Waiver** (benefit) — 5 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 5 content sections, 6 FAQs
- **Medicare Savings Program (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 4 content sections, 6 FAQs
- **Nebraska SHIP (State Health Insurance Assistance Program)** (resource) — 2 content sections, 6 FAQs
- **Home-Delivered Meals (via Area Agencies on Aging)** (benefit) — 2 content sections, 6 FAQs
- **Lifespan Respite Services** (benefit) — 4 content sections, 6 FAQs
- **Nebraska Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Legal Services for Seniors (via AAAs)** (resource) — 3 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Aged and Disabled Waiver** (benefit) — 4 content sections, 6 FAQs
- **Aging & Disability Resource Center Act** (navigator) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **Age and individual care needs; PERS eligibility varies by living situation and health status**: 1 programs
- **region**: 4 programs
- **priority_tier**: 3 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 1 programs
- **exceptional_circumstances**: 1 programs
- **not_applicable — services are universal and free**: 1 programs
- **individual needs via Person-Centered Plan; priority not specified[3]**: 1 programs
- **service_type, region, individual_need_assessment**: 1 programs
- **living_arrangement**: 1 programs
- **need_for_requested_service**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Aged and Disabled (AD) HCBS Waiver**: This program combines age-based and disability-based eligibility into a single waiver. Benefits are service-based rather than cash-based, and availability depends on individual functional assessment using the interRAI Home Care tool. The program is statewide but administered through DHHS with regional Area Agencies on Aging providing local support. Key distinction: this is a Medicaid waiver program, meaning Medicaid enrollment is a prerequisite, not an outcome. The Nursing Facility Level of Care requirement is the primary clinical gate — without meeting this threshold, applicants do not qualify regardless of age or disability status.
- **Program of All-Inclusive Care for the Elderly (PACE)**: Only 1 provider in NE (Immanuel Pathways); county/zip-restricted service area; no financial eligibility test for program entry (Medicaid separate for coverage); NF LOC state-certified.
- **Medicare Savings Program (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI) with uniform federal limits in Nebraska; asset-exemptions standard but MSP/QMB uniquely allows excess resources over base Medicaid; statewide uniform, no county variations.
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly/disabled households exempt from gross income limit (unless >165% FPL), higher asset limit ($4,500), 12-month recertification, deductions for medical/utilities heavily favor seniors; benefits scale precisely by net income and household size with federal max allotments.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income table fixed at 150% FPL with annual updates; benefits formula-based (20% earned income disregard post-eligibility, factors in assets/fuel/housing); priority tiers by vulnerability; statewide but local DHHS offices handle; funding can end applications early.
- **Weatherization Assistance Program**: Administered by regional subgrantees with statewide uniform eligibility (200% FPL or auto-qualifiers) but varying application contacts, capacities, wait times; priority tiers favor elderly/disabled; no age minimum but elderly prioritized.[2][3][4]
- **Nebraska SHIP (State Health Insurance Assistance Program)**: no income or asset test; free counseling service for Medicare navigation via statewide counselor network and local AAA partners; no formal enrollment—contact to arrange session
- **Home-Delivered Meals (via Area Agencies on Aging)**: Administered by local Area Agencies on Aging with region-specific providers, homebound definitions, and potential weekend availability; no fixed income/asset limits or statewide application portal; priority-based with waitlists
- **Lifespan Respite Services**: Financial subsidy with asset/income test (verification as-needed); exceptional crisis funding separate; statewide via network coordinators; excludes those on other govt respite.
- **Nebraska Senior Community Service Employment Program (SCSEP)**: Administered by National Able with subgrantees; restricted to specific service areas with funding; priority tiers heavily influence enrollment; income based on 125% FPL with detailed inclusions/exclusions.
- **Legal Services for Seniors (via AAAs)**: This program's structure is highly decentralized and regionally variable. Eligibility criteria (especially income/asset limits) are not standardized statewide and must be determined by contacting the local Area Agency on Aging. Services are delivered through a partnership model: ElderAccessLine (statewide phone line) provides initial advice, while regional AAAs may contract with local attorneys for expanded services. The program is free but limited in scope (brief services, not full representation). No online application process is documented; all access is through phone or in-person contact with regional offices.
- **Long-Term Care Ombudsman Program**: This is a universal advocacy program with no income, asset, or age eligibility barriers. Unlike means-tested benefit programs, there are no financial thresholds, household size calculations, or asset exemptions. The program is free and confidential. Key limitation: search results do not provide specific processing timelines, application forms, required documents, or detailed regional office locations — families should contact the state office directly at (800) 942-7830 for intake procedures.
- **Aged and Disabled Waiver**: Tied to Medicaid eligibility with NFLOC assessment; services individualized via Person-Centered Plan; statewide but regional coordinators/providers; no explicit income tables or waitlist details in sources
- **Nebraska Community Aging Services Act**: The Nebraska Community Aging Services Act is a framework law that establishes the structure for aging services statewide but delegates eligibility determination and service delivery to regional Area Agencies on Aging. There are no published statewide income or asset limits. Eligibility is individualized and varies by region, service type, and local Area Agency on Aging priorities. This is fundamentally different from programs with fixed, published eligibility criteria. The program emphasizes community-based services to support independence rather than institutional care. Families must contact their local Area Agency on Aging for specific eligibility information and available services.
- **Aging & Disability Resource Center Act**: No income/asset test for core ADRC info services; regional via area agencies on aging; facilitates access to tiered waivers (e.g., AD Waiver) with NFLOC and Medicaid reqs; open to caregivers/family
- **Aid to the Aged, Blind, and Disabled (AABD)**: State cash/medical supplement for SSI-denied short-term disabled/blind or aged; maximum benefit varies by living arrangement, not household size; disability duration key differentiator from federal SSI.
- **Social Service for Aged and Disabled Adults (SSAD)**: State-funded non-Medicaid program for gaps in coverage; income and need-tested without detailed limits published; services tailored to requested needs rather than fixed tiers.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Nebraska?
