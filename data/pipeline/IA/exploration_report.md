# Iowa Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 13 |
| New (not in our data) | 12 |
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

- **service**: 6 programs
- **financial**: 4 programs
- **advocacy**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Iowa HCBS Elderly Waiver

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Individualized services including: homemaker, adult day care, home delivered meals, senior companion, consumer-directed attendant care (CDAC—both skilled and unskilled), case management, respite care, home health aide, nursing, counseling, financial management, independent support broker, home and vehicle modification, personal emergency response system, nutritional counseling, interim medical monitoring and treatment, self-directed personal care, self-directed community supports and employment, and individual-directed goods and services[4][6]` ([source](https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs[8]))
- **source_url**: Ours says `MISSING` → Source says `https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs[8]`

## New Programs (Not in Our Data)

- **Iowa Medicaid Home & Community Based Services Elderly Waiver** — service ([source](https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs))
  - Shape notes: Individualized services based on assessed needs and interdisciplinary team decision; no fixed budgets/hours; requires nursing level of care determination; statewide with provider availability dependency.
- **Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://hhs.iowa.gov/medicaid/plans-programs/fee-service/medicare-savings-program))
  - Shape notes: Tiered by program (QMB/SLMB/QI) with escalating income thresholds to 135% FPL; primarily individual/couple household sizes; 2026 Iowa-specific limits from HHS; QI funding-limited with annual renewal and priority queue
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://hhs.iowa.gov/assistance-programs/food-assistance/snap[7]))
  - Shape notes: Benefits scale by household size and net income; special rules for 60+ (no asset test if all elderly/disabled, higher deductions); Iowa has broader gross income at 160% FPL; local DSS administration statewide[1][2][7].
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://iuc.iowa.gov/customer-assistance/how-do-i-apply-energy-assistance-liheap (Iowa Utilities Commission) or https://liheap-apply.hhs.iowa.gov (HHS portal).[5][7]))
  - Shape notes: Statewide but locally administered by community action agencies with regional offices; income table fixed by household size with +$11k increments; priority for elderly/disabled start date; benefits formula factors income/size/fuel/housing; no asset test.
- **Weatherization Assistance Program (WAP)** — service ([source](https://hhs.iowa.gov/assistance-programs/housing-rent-assistance/weatherization-assistance))
  - Shape notes: Eligibility prioritized via county LIHEAP applicant lists from prior year; services vary by local agency funding/region; no age requirement but priority for elderly
- **Senior Health Insurance Program (SHIIP)** — advocacy ([source](https://shiip.iowa.gov/))
  - Shape notes: no income test for counseling; statewide but locally sponsored with varying contact points; focuses on Medicare navigation rather than direct aid; assists with tiered low-income programs without owning their limits
- **Meals on Wheels (via Aging Services)** — service ([source](No single statewide .gov URL identified; contact local Area Agency on Aging via aging.iowa.gov or hhs.iowa.gov for HCBS-related meals[5].))
  - Shape notes: Decentralized by local providers/Area Agencies on Aging; no uniform statewide income table or asset test; eligibility tied to county service areas and homebound status
- **National Family Caregiver Support Program** — service ([source](https://elderaffairs.iowa.gov/programs-services/caregiver-support (inferred state hub; federal: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[4]))
  - Shape notes: Administered via 15 regional Area Agencies on Aging; no income/asset tests; discretionary services with priority for highest need; not financial aid or payment program
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://workforce.iowa.gov/jobs/worker-programs/scsep))
  - Shape notes: Income at 125% federal poverty (varies by household size); priority tiers affect access; regional via IowaWORKS/Area Agencies on Aging; no asset test; grant-subgrantee model leads to provider variations
- **Iowa Legal Aid for Seniors** — service ([source](https://www.iowalegalaid.org/))
  - Shape notes: No strict asset test or fixed dollar income caps listed (uses % FPL table by household size); special grants expand access for seniors beyond standard 125% FPL; priority-based rather than fixed benefits; statewide but local outreach/priorities vary; funded by LSC with elder-specific focus[1][5][8]
- **Long-Term Care Ombudsman Program** — advocacy ([source](https://hhs.iowa.gov/health-prevention/aging-services/ltcombudsman))
  - Shape notes: no income test; open to all long-term care residents statewide via local ombudsmen; advocacy-focused, not financial/service provision; volunteer ombudsman recruitment is separate process.
- **State Supplementary Assistance (SSA)** — financial ([source](https://hhs.iowa.gov/media/3987/download (SSA policy manual); https://hhs.iowa.gov/media/6413/download (SSA pamphlet)))
  - Shape notes: Tied to SSI eligibility except income; multiple special needs categories with state-administered subsets; county-based application offices; resource limits fixed regardless of household size beyond couple.

## Program Details

### Iowa Medicaid Home & Community Based Services Elderly Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For a single person in 2025: monthly income of $2,901 or less. If over $2,901, may still be eligible under certain conditions. Must meet Medicaid income requirements for nursing home level of care. No full household size table available in sources; couples follow nursing home Medicaid rules (specifics not detailed).
- Assets: For a single person: $2,000 or less. Exempt assets include primary home (regardless of value in most cases), one car, household goods, and certain burial/funeral funds or contracts. Other assets count toward limit.
- Iowa resident and U.S. citizen or qualified legal entrant.
- Medicaid eligible (may qualify via waiver even if previously ineligible).
- Need nursing facility or skilled level of care, determined by Iowa Medicaid Medical Services Unit.
- At risk of institutionalization; must choose HCBS as alternative to institutional care.
- Comprehensive service plan developed and reviewed annually.
- Approved provider must be available.
- Access all other eligible Medicaid services first.

**Benefits:** Individualized services based on needs assessed by member and interdisciplinary team (no fixed dollar amounts or hours specified). Includes: Adult Day Care, Assisted Living Services, Assistive Devices, Case Management, Chore Services, Consumer-Directed Attendant Care, Emergency Response System, Home and Vehicle Modifications, Home Delivered Meals, Home Health Aide, Homemaker Services, Mental Health Outreach, Nursing Care, Nutritional Counseling, Respite Care, Senior Companions, Transportation, Consumer Choice Option (monthly budget for self-directed purchases), Financial Management Services. Plus all standard Medicaid benefits (primary care, behavioral health, skilled nursing, dental, vision, emergency care).
- Varies by: priority_tier

**How to apply:**
- Online: Iowa HHS Benefits Portal (hhs.iowa.gov benefits portal).
- Phone: 1-855-889-7985.
- Mail: Paper Medicaid application.
- In-person: Local HHS offices or Social Security office for income verification if needed; assessment scheduled after application.

**Timeline:** Not specified; assessment scheduled after application contact, then reviewed by Iowa Medicaid Medical Services.
**Waitlist:** Not mentioned in sources; availability of approved providers required.

**Watch out for:**
- Must need nursing/skilled level of care (not just general elderly support).
- Services individualized but require approved provider availability.
- Must exhaust other Medicaid services first.
- Home exempt but other assets strictly limited; spousal rules apply for couples.
- Even if income over limit, possible eligibility with conditions (e.g., spenddown).
- Annual service plan review required.

**Data shape:** Individualized services based on assessed needs and interdisciplinary team decision; no fixed budgets/hours; requires nursing level of care determination; statewide with provider availability dependency.

**Source:** https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs

---

### Iowa HCBS Elderly Waiver


**Eligibility:**
- Age: 65+
- Income: {"description":"Income must be less than three times the federal SSI limit for the year[3]","2026_amount":"$35,788 per year[3]","note":"This is a single threshold; no household size variation documented in available sources"}
- Assets: {"countable_assets_limit":"$2,000 total[3]","countable_assets_include":"Cash and money in checking or savings accounts[3]","home_equity_exemption":{"limit_2026":"$752,000[2]","conditions":"Home is exempt if applicant lives in it or has intent to return, AND home equity interest does not exceed $752,000[2]"},"additional_exemptions":["Home is exempt if spouse lives in the home[2]","Home is exempt if minor child (under age 21) lives in the home[2]","Home is exempt if blind or disabled child (any age) lives in the home[2]"],"look_back_rule":"Assets should not be given away or sold for under fair market value within 60 months of long-term care Medicaid application; violating this results in a Penalty Period of Medicaid ineligibility[2]"}
- Must be eligible for Medicaid (Title XIX)[3][7]
- Must meet functional eligibility: require a Nursing Facility Level of Care (NFLOC)[2][3]
- Functional assessment uses interRAI – Home Care (HC) assessment tool, evaluating Activities of Daily Living (ADLs) such as continence, personal hygiene, bathing, dressing, mobility, eating, and cognitive functioning[2]
- Diagnosis of dementia alone does not guarantee NFLOC qualification[2]

**Benefits:** Individualized services including: homemaker, adult day care, home delivered meals, senior companion, consumer-directed attendant care (CDAC—both skilled and unskilled), case management, respite care, home health aide, nursing, counseling, financial management, independent support broker, home and vehicle modification, personal emergency response system, nutritional counseling, interim medical monitoring and treatment, self-directed personal care, self-directed community supports and employment, and individual-directed goods and services[4][6]
- Varies by: Individual need—services are specific to the individual[1][4]

**How to apply:**
- Contact Iowa Department of Health and Human Services (HHS) for application process[3][8]
- In-person: Work with Iowa HHS office (specific office locations not provided in available sources)
- Phone: Contact Iowa HHS (specific phone number not provided in available sources)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Medicaid eligibility is a prerequisite—many families assume their income is too high without checking the actual limits[7]
- The 60-month look-back rule on asset transfers can result in Medicaid ineligibility penalties; families should not gift or sell assets below fair market value before applying[2]
- Home equity exemption has a specific dollar limit ($752,000 in 2026); homes exceeding this may disqualify applicants[2]
- Dementia diagnosis alone does not guarantee qualification; functional assessment is required[2]
- Starting in 2026, Iowa is consolidating waivers: people already on the Elderly Waiver will stay on it, but new applicants may be directed to the 'Adults with Disabilities Waiver' if they don't meet Elderly Waiver criteria[3]
- Specific phone numbers, website URLs for direct application, and processing timelines are not publicly documented in available sources—families should contact Iowa HHS directly for current application procedures

**Data shape:** This program is age-restricted (65+) with fixed income and asset limits that do not vary by household size. Benefits are individualized by need rather than tiered. The program is statewide but administered through Iowa HHS with no documented regional variations. A major structural change is occurring in 2026 when Iowa consolidates six diagnosis-based waivers into two age-based waivers; existing Elderly Waiver recipients are grandfathered in. Critical gaps in available data: specific application phone numbers, online application URLs, processing timelines, waitlist status, and regional office locations are not documented in the search results provided.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hhs.iowa.gov/medicaid/services-care/home-and-community-based-services/waiver-programs[8]

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: QMB: ≤100% FPL. 2026 monthly limits: Individual $1,330; Married Couple $1,804. $20 higher if income other than Social Security. SLMB: 100-120% FPL. Monthly limits approx: Individual $1,585-$1,596; Couple $2,135-$2,156 (2025 data, $20 adjustment applies). QI: 120-135% FPL. Monthly limits approx: Individual $1,715-$1,781; Couple $2,320-$2,400. Limits based on federal poverty level; household size primarily individual/couple. Must be entitled to Medicare Part A (Part B required for SLMB/QI).[1][5][6]
- Assets: 2026 limits: Individual $9,950; Married Couple $14,910. Countable resources include cash, bank accounts, stocks (exceeding exemptions). Exempt: primary home, one vehicle, household items, engagement/wedding rings, burial plots/expenses up to $1,500, life insurance cash value <$1,500, food stamps, certain Native American payments, $20/$65 wage disregards + half remaining wages.[1][3][6]
- Entitled to Medicare Part A (all programs); Part B required for SLMB/QI.
- 65+, blind, or disabled.
- Iowa resident.
- U.S. citizen or qualified immigrant.

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/copayments for Medicare-covered A/B services. Additional Medicaid for dental, some Rx drugs. SLMB/QI: Pays Medicare Part B premiums only. QI auto-qualifies for Extra Help (Rx cap $12.65/drug in 2026). No Medigap coverage.[1][6]
- Varies by: program_tier

**How to apply:**
- Online: https://hhs.iowa.gov/medicaid/apply-medicaid
- Phone: Local Iowa HHS office or 1-800-338-8366 (SHIP assistance)
- Mail/In-person: Local Iowa Department of Health and Human Services (HHS) office
- Form: Medicaid application (no specific MSP form; use general Medicaid app)

**Timeline:** 45-90 days typical for Medicaid apps; no specific MSP timeline stated
**Waitlist:** QI has first-come, first-served with priority to prior recipients; potential waitlist if funding limited[1][6]

**Watch out for:**
- Income limits $20 higher if non-SS income; often missed.
- QI requires annual reapplication; first-come priority, potential funding caps.
- QMB provides 'limited Medicaid' + Medicare wrap; providers can't bill QMB members for Medicare-covered services.
- Assets include most non-exempt items; home/car exempt but value matters if sold.
- If over QMB limits, check SLMB/QI or Medically Needy spenddown.
- Outdated national limits don't apply; use Iowa-specific[1][3][5][6]

**Data shape:** Tiered by program (QMB/SLMB/QI) with escalating income thresholds to 135% FPL; primarily individual/couple household sizes; 2026 Iowa-specific limits from HHS; QI funding-limited with annual renewal and priority queue

**Source:** https://hhs.iowa.gov/medicaid/plans-programs/fee-service/medicare-savings-program

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled in Iowa (Oct 1, 2025 - Sept 30, 2026): Gross monthly income limit at 160% FPL - 1 person: $2086, 2: $2820, 3: $3553, 4: $4286, 5: $5020, 6: $5753, 7: $6486, each additional +$732. If over gross limit, qualify via net income (100% FPL after deductions) and asset tests. Seniors 60+ get higher medical deduction (over $35/month), shelter deduction, no gross income test if all elderly/disabled[1][2][6].
- Assets: No asset limits for households where all members are 60+ or disabled. Otherwise, standard asset test applies (details not specified in sources, but exemptions include home, retirement savings, most vehicles)[1][2][4].
- Iowa resident; U.S. citizen, non-citizen national, or eligible non-citizen[7].
- Seniors on SSI often categorically eligible[1].
- New work requirements (post-2025): Able-bodied 55-64 without dependents may need 80 hours/month work/volunteer/training; exemptions for disabled/elderly but expanded to some older adults[5][8].

**Benefits:** Monthly benefits loaded on EBT card for food purchases at authorized stores. Max for 1-person: ~$291; 2-person: ~$535 (most receive less, based on net income: ~$0.30 benefit reduction per $1 net income). Varies by household size, income, deductions[1].
- Varies by: household_size

**How to apply:**
- Online: Iowa state portal (specific URL via hhs.iowa.gov)[1][7].
- Phone: State SNAP hotline (local Department of Social Services)[1].
- In-person/mail: Local Department of Social Services office[1][7].
- Simplified options for elderly via Iowa Elderly Food Program[3].

**Timeline:** Not specified in sources; telephone interviews often available for elderly[1].

**Watch out for:**
- Iowa expanded eligibility to 160% FPL gross (higher than federal 130%), but seniors over gross can use net/asset tests[2].
- Medical expenses over $35/month deductible for 60+; shelter deduction generous[1][6].
- New 2025 work rules impact 55-64 even if previously exempt[5].
- Include all who buy/prepare food together in household[4].
- SSI recipients often auto-eligible[1].

**Data shape:** Benefits scale by household size and net income; special rules for 60+ (no asset test if all elderly/disabled, higher deductions); Iowa has broader gross income at 160% FPL; local DSS administration statewide[1][2][7].

**Source:** https://hhs.iowa.gov/assistance-programs/food-assistance/snap[7]

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Annual gross income at or below 200% of federal poverty guidelines (exact limits for 2025-2026): 1: $31,300; 2: $42,300; 3: $53,300; 4: $64,300; 5: $75,300; 6: $86,300; 7: $97,300; 8: $108,300. For households >8, add $11,000 per additional member. Applies to all household members 18+ (or 19+ per some providers). Income verified via past 30 days, 12 months, or prior calendar year (whichever easiest/beneficial). Gross income (not net unless specified).[1][2][4]
- Assets: No asset limits mentioned across sources.
- Iowa resident.
- Homeowners and renters qualify.
- Proof of Social Security numbers for all household members.
- Primary heating costs for winter season.

**Benefits:** One-time payment to heating utility or fuel vendor (exact amount varies by final federal budget, household income, size, fuel type, housing type; paid directly, limited exceptions for rent-included heating).[1][5]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online portal: https://liheap-apply.hhs.iowa.gov/s/benefit-assistance-eligibility (eligibility tool) or provider-specific online (e.g., midsioux.org).[5][4][7]
- Local community action agency (in-person, phone, mail; e.g., HACAP: hacap.org/energy; Mid-Sioux: midsioux.org).[5][4][6]
- Iowa HHS administers statewide via local agencies.

**Timeline:** Not specified; applicants with disconnect notice post-Nov 1 get 30-day protection while processing.[5][6]
**Waitlist:** First come, first served; funds limited by federal budget (no formal waitlist mentioned).[3][5]

**Watch out for:**
- Elderly (60+)/disabled apply Oct 1; others Nov 1 (2025-2026 season); miss window and risk funds exhaustion.[1][4][5]
- Payments direct to utility/vendor; continue paying bills to avoid post-moratorium debt/disconnect (moratorium Nov 1-Apr 1).[5][6]
- Gross income verification strict (30 days/12 months/calendar year); unique incomes (alimony, farm) need specific proof.[1][2]
- First come/first served; early apply critical as funds limited by Congress.
- Disconnect applicants get 30-day hold only after applying.[6]

**Data shape:** Statewide but locally administered by community action agencies with regional offices; income table fixed by household size with +$11k increments; priority for elderly/disabled start date; benefits formula factors income/size/fuel/housing; no asset test.

**Source:** https://iuc.iowa.gov/customer-assistance/how-do-i-apply-energy-assistance-liheap (Iowa Utilities Commission) or https://liheap-apply.hhs.iowa.gov (HHS portal).[5][7]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 200% of the Federal Poverty Guidelines. For April 1, 2025 - March 31, 2026: 1: $31,300; 2: $42,300; 3: $53,300; 4: $64,300; 5: $75,300; 6: $86,300; 7: $97,300; 8: $108,300. Add $11,000 per additional member beyond 8. Automatic eligibility if receiving SSI or FIP regardless of income[1][3].
- Assets: No asset limits mentioned in sources[1][3][4].
- Must qualify for or receive LIHEAP (Heating Assistance) within the last 12 months in some regions[3]
- Home must be primary residence
- Priority for elderly, disabled, families with children[6][7]

**Benefits:** Energy efficiency improvements including insulation, sealing air leaks (e.g., blower door-guided infiltration reduction), weather-stripping, caulking, health and safety fixes. Work takes about 5 days by qualified contractors or agency crews during normal business hours (8am-5pm Mon-Fri). No direct dollar amount per home; varies by funding and audit results[3][4][6].
- Varies by: priority_tier|region

**How to apply:**
- Contact local Community Action Agency (CAA) year-round by phone, in-person, mail, or online LIHEAP app (Nov-Apr online)[2][6]
- State customer service: 515-281-3861[6]
- Locate local CAA via hhs.iowa.gov or call 515-281-3861 if county not listed[6]

**Timeline:** Agency schedules appointment to take application; eligibility determination after; then placed on priority waiting list. Work scheduled later by contractor (about 5 days total)[4].
**Waitlist:** Statewide priority list based on prior LIHEAP applicants per county; ~80,000 eligible but only ~2,000 served yearly due to funding. Position on list determines wait; may never be reached[3][4].

**Watch out for:**
- Applying for WAP also applies you for LIHEAP; high demand leads to long waits or non-service despite eligibility due to priority list position[3][4]
- Must provide home access during work hours; renters may qualify but confirm with local agency[9]
- Eligibility often tied to recent LIHEAP approval, not standalone[3]
- Funding limits homes served (~2,000/year statewide)[4]

**Data shape:** Eligibility prioritized via county LIHEAP applicant lists from prior year; services vary by local agency funding/region; no age requirement but priority for elderly

**Source:** https://hhs.iowa.gov/assistance-programs/housing-rent-assistance/weatherization-assistance

---

### Senior Health Insurance Program (SHIIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No program-specific income or asset limits for core SHIIP counseling services, which are free and available to all Medicare beneficiaries. Counselors assist with applications for related low-income programs like Medicare Savings Programs and Extra Help, which have separate income/resource guidelines (specific dollar amounts and tables referenced in local sponsor materials, e.g., via https://www.mchalbia.com; families should contact counselors for current charts varying by household size)[5]
- Assets: No asset limits for SHIIP itself. For assisted programs like Extra Help or Medicare Savings Programs, resources are evaluated (details on what counts/exempts provided by counselors; e.g., some personal assets exempt)[5]
- Must be a Medicare beneficiary (age 65+ or under 65 with disabilities)
- Iowa resident
- Open to those dually eligible for Medicare/Medicaid or with limited incomes, but no strict barriers for general counseling[1][3]

**Benefits:** Free, objective, confidential one-on-one counseling, education, and assistance on Medicare options (Parts A/B, Advantage/C, Part D, Medigap); help enrolling/changing plans; applications for low-income aids (Medicaid, Medicare Savings, Extra Help); group presentations; fraud prevention via SMP; claim reviews; no direct financial aid or services provided[1][2][3][6]

**How to apply:**
- Phone: Statewide 1-800-351-4664 or local sponsor sites (e.g., 712-794-5801 for St. Anthony, 712-264-6198 for Spencer, 641-932-1703 for Albia, 855-410-6222 for Milestones)
- Website: https://shiip.iowa.gov/ for info and local sponsor finder
- Email: shiip@iid.iowa.gov
- In-person: Local SHIIP sponsor sites (hospitals, area agencies on aging; find via website or phone)
- No formal application form; request appointment for counseling[1][2][4][5][6]

**Timeline:** Immediate phone assistance available; in-person appointments scheduled upon request (typically quick, no formal processing)[1][2]

**Watch out for:**
- Not a direct benefits program—provides counseling/advocacy only, not payments or healthcare; does not sell plans or affiliate with insurers[1][6]
- Assists with low-income programs but eligibility for those is separate (people miss needing to provide income details)[5]
- Annual Medicare changes (e.g., Open Enrollment Oct 15-Dec 7); verify plan coverage by service location/zip[2][4][5]
- Under 65? Must have Medicare due to disability[1][3]
- Contact local sponsor for region-specific events/appointments, not just state line[1]

**Data shape:** no income test for counseling; statewide but locally sponsored with varying contact points; focuses on Medicare navigation rather than direct aid; assists with tiered low-income programs without owning their limits

**Source:** https://shiip.iowa.gov/

---

### Meals on Wheels (via Aging Services)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide fixed dollar amounts specified; varies by local program and provider. Low-income individuals may receive free or sliding-scale fee meals. Funding assistance available through partners like Polk County or state programs for eligible clients[3][4][8].
- Assets: No asset limits or details on what counts/exempt mentioned in sources.
- Homebound (difficulty leaving home due to illness/condition, or challenges shopping/preparing meals)[1][2][3][4]
- Resident of the local program's service area (e.g., Polk County, Johnson County)[1][3][4]
- Disabled individuals may qualify regardless of age in some areas[1][4]
- Spouses/dependents may be served in some programs[1][3]
- Military veterans of all ages in some Central Iowa programs[8]

**Benefits:** Hot, fresh, ready-to-eat meals delivered weekdays; may include frozen meals and breakfast bags. Short-term (e.g., post-hospital) or ongoing. Wellness check during delivery. Couples receive 2 meals per holiday in some programs. Costs: donation basis, $8.10-$9.50 per meal if private pay, reduced/waived based on income[3][4][7][8].
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or provider (e.g., Johnson County: (319) 338-0515; Horizons: online form at horizonsfamily.org/meals-on-wheels; WesleyLife: contact directly)[1][4][7][8]
- In-person: e.g., 2210 9th St., Coralville, IA 52241 (Mon-Fri 7:30am-3:30pm)[4]

**Timeline:** Varies; initial assessment follows contact, approval times differ by program[1].
**Waitlist:** Not specified; patience may be needed due to variations[1].

**Watch out for:**
- Must live in specific delivery zone; out-of-area ineligible[1]
- Homebound status strictly assessed; those who can easily leave home or have caregivers may not qualify[1][3]
- Fees apply if ineligible for subsidies (e.g., $8.10-$9.50/meal); not always free[4][8]
- Separate from Medicaid HCBS Elderly Waiver (65+, nursing facility level of care needed)[5][6]
- Local variations in age (e.g., veterans any age), spouses, holidays[3][8]

**Data shape:** Decentralized by local providers/Area Agencies on Aging; no uniform statewide income table or asset test; eligibility tied to county service areas and homebound status

**Source:** No single statewide .gov URL identified; contact local Area Agency on Aging via aging.iowa.gov or hhs.iowa.gov for HCBS-related meals[5].

---

### National Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits or tables mentioned in available sources; program focuses on caregivers of eligible care recipients without financial thresholds detailed for Iowa[4]
- Assets: No asset limits specified; no details on what counts or exemptions[4]
- Adult family members or informal caregivers providing care to individuals 60 years of age and older
- Adult family members providing care to individuals of any age with Alzheimer’s disease and related disorders
- Older relatives (age 55+) providing care to children under 18 or adults 18-59 with disabilities
- Care recipient must typically be Iowa resident; caregivers may include those under 18 if defined as adults by provider[4]

**Benefits:** Information about available services; assistance gaining access to services; individual counseling, support groups, caregiver training; respite care; limited supplemental services (e.g., equipment aid in some Iowa areas)[4][7]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA); Iowa toll-free Eldercare Locator: 1-866-468-2288[8]
- Regional providers like Aging Resources for assessment by phone or in-home[7]

**Timeline:** Not specified in sources
**Waitlist:** Not detailed; may vary regionally

**Watch out for:**
- Not a paid caregiver program—provides support services, not wages (confused with Medicaid paid family caregiving)[3][4][6]
- No strict income/asset tests, but local AAAs assess need and priority
- Services limited and may have waitlists or funding caps
- Must contact local AAA, not centralized state application[7][8]

**Data shape:** Administered via 15 regional Area Agencies on Aging; no income/asset tests; discretionary services with priority for highest need; not financial aid or payment program

**Source:** https://elderaffairs.iowa.gov/programs-services/caregiver-support (inferred state hub; federal: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[4]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact 2026 dollar amounts not specified in sources; for reference, 2020 example for family of 1 was $14,850 (adjust annually for inflation via HHS guidelines). Varies by household size per federal poverty guidelines[2][3][6].
- Assets: No asset limits mentioned in sources[1][2][3].
- Unemployed
- Iowa resident
- Limited employment prospects (e.g., lack of experience, outdated skills, long-term unemployment)
- Legally eligible to work

**Benefits:** Paid part-time community service work training (average 20 hours/week) at non-profit/public agencies (e.g., schools, hospitals, senior centers); wages at highest of federal ($7.25/hour), state, or local minimum wage; fringe benefits include annual physical exam, workers' compensation, sick leave, paid federal holidays (no unemployment insurance or retirement contributions); job placement assistance to unsubsidized employment[2][3][5].
- Varies by: region

**How to apply:**
- Visit local IowaWORKS office (in-person)
- Email Bethany Ellingson, SCSEP Program Coordinator, at Bethany.Ellingson@iwd.iowa.gov
- Contact via Iowa Workforce Development (IWD) websites: workforce.iowa.gov/jobs/worker-programs/scsep

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; potential due to grant-based funding and priority enrollment

**Watch out for:**
- Priority enrollment: Veterans/qualified spouses first, then over 65, disabled, low literacy/limited English, rural, homeless/at-risk, low prospects, or American Job Center users—may delay non-priority applicants[3][5]
- Temporary training program (not permanent job); goal is transition to unsubsidized employment[1][2]
- No retirement contributions or unemployment insurance[5]
- Limited to part-time (avg. 20 hrs/week); not full income replacement
- Grant-funded; availability may depend on sub-grantees (e.g., 2025-2026 competitive grant open)[4][5]

**Data shape:** Income at 125% federal poverty (varies by household size); priority tiers affect access; regional via IowaWORKS/Area Agencies on Aging; no asset test; grant-subgrantee model leads to provider variations

**Source:** https://workforce.iowa.gov/jobs/worker-programs/scsep

---

### Iowa Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Based on 125% of the Federal Poverty Guidelines (varies by household size and year; exact dollar amounts set annually by Iowa Legal Aid Board using LSC guidelines). Special grants allow higher limits for seniors or specific issues like elder law[5][8]. No means testing prohibition for denial based solely on income for those 60+[1].
- Assets: Not specified for Iowa Legal Aid for Seniors program. Related Medicaid programs for seniors mention $2,000 limit for single individuals (home, car, household goods, burial funds exempt), but this is not directly for legal aid[2][4].
- Iowa resident
- Low-income (per 125% FPL guidelines)
- Legal issue in priority areas like elder law, housing, public benefits, family/safety[1][5][6]

**Benefits:** Free legal assistance including advice, counseling, representation on elder law issues (e.g., 60+ Elder Law, Disability, Housing, Taxes, Veterans’ Issues, public benefits, preventing legal problems via education/outreach). Provided by Iowa Legal Aid staff and volunteer lawyers[1][5][6]. No specific dollar amounts or hours stated.
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-532-1275 (Mon-Fri 9am-4pm) or 1-800-532-1503[5][7]
- Online: https://www.iowalegalaid.org/ (apply anytime)[5][7]
- In-person: Offices open 8:30am-4:30pm (e.g., Iowa City: 1700 S. 1st Ave., Iowa City, IA 52240)[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not automatic eligibility even if 60+; must meet income guidelines (125% FPL) unless special grant applies[5][8]
- Means testing prohibited for denial solely on income for 60+, but financial screening occurs[1]
- Priority for vulnerable groups (e.g., at risk of institutionalization, limited English); general low-income Iowans may be screened out[1]
- Confused with Elderly Waiver (Medicaid HCBS, age 65+, strict $2,901/month income & $2,000 assets for 2025); this is legal aid, not care services[2][3]
- Emergencies handled when offices open; call hotline for screening[5]

**Data shape:** No strict asset test or fixed dollar income caps listed (uses % FPL table by household size); special grants expand access for seniors beyond standard 125% FPL; priority-based rather than fixed benefits; statewide but local outreach/priorities vary; funded by LSC with elder-specific focus[1][5][8]

**Source:** https://www.iowalegalaid.org/

---

### Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to any resident regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident or tenant of a long-term care facility in Iowa, including nursing facilities, assisted living programs, residential care facilities, or elder group homes.
- Also serves individuals enrolled in Iowa’s Home and Community-Based Services (HCBS) waiver programs (e.g., AIDS/HIV, Brain Injury, Children’s Mental Health, Elderly, Health and Disability, Intellectual Disability, Physical Disability).
- Exclusions for certain assisted living/residential care: acute stage of alcoholism/drug addiction/uncontrolled mental illness; under age 18; requires more than part-time/intermittent health-related care; unmanageable incontinence despite program; behavior placing others at risk.
- Family members, friends, or others can contact on behalf of residents.

**Benefits:** Investigates complaints about conditions or treatment; resolves issues related to resident rights, facility policies, regulations, involuntary discharge, facility closure, substitute decision makers (e.g., power of attorney, guardian), resident/family councils; educates on self-advocacy, rights, and choosing facilities/managed care; provides information and assistance without cost.

**How to apply:**
- Phone: Call statewide access line at 1-800-532-3213 (access code 878277# for prompts).
- Contact Local Long-Term Care Ombudsman (posted in facilities).
- Visit: https://hhs.iowa.gov/health-prevention/aging-services/ltcombudsman.
- Download brochures for more info: Long-Term Care Ombudsman Brochure or Resident Rights Brochure.

**Timeline:** Local Ombudsmen respond timely; investigation where not immediately possible.

**Watch out for:**
- Not a volunteer program for families to join (that's separate certification requiring training, background checks, no conflicts of interest); it's free advocacy for residents—call directly for help, no application barriers.
- Does not provide direct care/services, only advocacy and complaint resolution.
- Exclusions apply in some residential settings for high-need cases.
- Families can contact anytime, even pre-placement.

**Data shape:** no income test; open to all long-term care residents statewide via local ombudsmen; advocacy-focused, not financial/service provision; volunteer ombudsman recruitment is separate process.

**Source:** https://hhs.iowa.gov/health-prevention/aging-services/ltcombudsman

---

### State Supplementary Assistance (SSA)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Must receive SSI or meet all SSI eligibility criteria except for excess income (or substantial gainful activity for Supplement for Medicare and Medicaid Eligibles). No specific dollar amounts listed for SSA income limits beyond SSI standards; countable income must be too low to meet costs of special needs categories.
- Assets: Resources of $2,000 or below for a single person or $3,000 or below for a married couple. Exemptions include life insurance policies with combined face value of $1,500 per person (term insurance with no cash value not counted).
- Aged (65+), blind (central visual acuity of 20/200 or less in better eye), or disabled.
- Iowa resident.
- Applied for or receiving all other benefits eligible for.
- For special categories: physician certification (e.g., residential care requires no nursing care needed but residential care required).

**Benefits:** Cash supplements added to SSI for special needs: Special Blind Allowance (up to $22, reduced if income exceeds SSI); Residential Care (in licensed facility); Family-Life Home; Dependent Relative; In-Home Health-Related Care. Exact amounts vary by category and income; state funds.
- Varies by: priority_tier

**How to apply:**
- Social Security District Office serving your county (for SSI recipients or basic SSI payment cases).
- Local Iowa Department of Health and Human Services (HHS) offices (for state-administered like residential/in-home care).
- Online HHS benefits portal (https://hhs.iowa.gov/services/supplemental-nutrition-assistance-program-snap/apply-snap or general benefits portal per [9]).

**Timeline:** Not specified in sources.

**Watch out for:**
- Must meet SSI criteria except for income; verify all factors if income exceeds SSI limits.
- Different application locations based on income and category (SSA vs. state HHS).
- Special categories require physician certification; not for nursing home level care.
- Children: blind children eligible in own household or dependent relative; disabled children only with dependent relative.
- Supplementation reduced if income exceeds certain levels (e.g., blind allowance < $22).

**Data shape:** Tied to SSI eligibility except income; multiple special needs categories with state-administered subsets; county-based application offices; resource limits fixed regardless of household size beyond couple.

**Source:** https://hhs.iowa.gov/media/3987/download (SSA policy manual); https://hhs.iowa.gov/media/6413/download (SSA pamphlet)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Iowa Medicaid Home & Community Based Ser | benefit | state | deep |
| Iowa HCBS Elderly Waiver | benefit | state | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | medium |
| Senior Health Insurance Program (SHIIP) | resource | state | simple |
| Meals on Wheels (via Aging Services) | benefit | federal | medium |
| National Family Caregiver Support Progra | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Iowa Legal Aid for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| State Supplementary Assistance (SSA) | benefit | state | deep |

**Types:** {"benefit":9,"resource":3,"employment":1}
**Scopes:** {"state":6,"federal":7}
**Complexity:** {"deep":8,"medium":2,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/IA/drafts.json`.

- **Iowa Medicaid Home & Community Based Services Elderly Waiver** (benefit) — 5 content sections, 6 FAQs
- **Iowa HCBS Elderly Waiver** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **Individual need—services are specific to the individual[1][4]**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **region**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Iowa Medicaid Home & Community Based Services Elderly Waiver**: Individualized services based on assessed needs and interdisciplinary team decision; no fixed budgets/hours; requires nursing level of care determination; statewide with provider availability dependency.
- **Iowa HCBS Elderly Waiver**: This program is age-restricted (65+) with fixed income and asset limits that do not vary by household size. Benefits are individualized by need rather than tiered. The program is statewide but administered through Iowa HHS with no documented regional variations. A major structural change is occurring in 2026 when Iowa consolidates six diagnosis-based waivers into two age-based waivers; existing Elderly Waiver recipients are grandfathered in. Critical gaps in available data: specific application phone numbers, online application URLs, processing timelines, waitlist status, and regional office locations are not documented in the search results provided.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with escalating income thresholds to 135% FPL; primarily individual/couple household sizes; 2026 Iowa-specific limits from HHS; QI funding-limited with annual renewal and priority queue
- **Supplemental Nutrition Assistance Program (SNAP)**: Benefits scale by household size and net income; special rules for 60+ (no asset test if all elderly/disabled, higher deductions); Iowa has broader gross income at 160% FPL; local DSS administration statewide[1][2][7].
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Statewide but locally administered by community action agencies with regional offices; income table fixed by household size with +$11k increments; priority for elderly/disabled start date; benefits formula factors income/size/fuel/housing; no asset test.
- **Weatherization Assistance Program (WAP)**: Eligibility prioritized via county LIHEAP applicant lists from prior year; services vary by local agency funding/region; no age requirement but priority for elderly
- **Senior Health Insurance Program (SHIIP)**: no income test for counseling; statewide but locally sponsored with varying contact points; focuses on Medicare navigation rather than direct aid; assists with tiered low-income programs without owning their limits
- **Meals on Wheels (via Aging Services)**: Decentralized by local providers/Area Agencies on Aging; no uniform statewide income table or asset test; eligibility tied to county service areas and homebound status
- **National Family Caregiver Support Program**: Administered via 15 regional Area Agencies on Aging; no income/asset tests; discretionary services with priority for highest need; not financial aid or payment program
- **Senior Community Service Employment Program (SCSEP)**: Income at 125% federal poverty (varies by household size); priority tiers affect access; regional via IowaWORKS/Area Agencies on Aging; no asset test; grant-subgrantee model leads to provider variations
- **Iowa Legal Aid for Seniors**: No strict asset test or fixed dollar income caps listed (uses % FPL table by household size); special grants expand access for seniors beyond standard 125% FPL; priority-based rather than fixed benefits; statewide but local outreach/priorities vary; funded by LSC with elder-specific focus[1][5][8]
- **Long-Term Care Ombudsman Program**: no income test; open to all long-term care residents statewide via local ombudsmen; advocacy-focused, not financial/service provision; volunteer ombudsman recruitment is separate process.
- **State Supplementary Assistance (SSA)**: Tied to SSI eligibility except income; multiple special needs categories with state-administered subsets; county-based application offices; resource limits fixed regardless of household size beyond couple.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Iowa?
