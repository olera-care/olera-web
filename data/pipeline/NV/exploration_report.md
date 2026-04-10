# Nevada Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 9.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 18 |
| New (not in our data) | 8 |
| Data discrepancies | 10 |
| Fields our model can't capture | 10 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 10 | Our model has no asset limit fields |
| `regional_variations` | 10 | Program varies by region — our model doesn't capture this |
| `waitlist` | 7 | Has waitlist info — our model has no wait time field |
| `documents_required` | 10 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 5 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Nevada Medicaid

- **income_limit**: Ours says `$2901` → Source says `$2,982` ([source](https://www.dss.nv.gov/programs/medical/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Long-term care services including nursing home coverage, Home and Community-Based Services (HCBS) waivers for home health care, personal care services, adult day health care; assisted living waiver (room/board not covered). Covers care as long as eligible, potentially for life; may require income contribution toward costs.[1][2][3]` ([source](https://www.dss.nv.gov/programs/medical/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.nv.gov/programs/medical/`

### Home and Community-Based Services (HCBS) Waiver

- **income_limit**: Ours says `$2901` → Source says `$2,000` ([source](https://adsd.nv.gov/Programs/Seniors/PD_Waiver/Waiver_for_Person’s_with_Physical_Disabilities_(PD)/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Case management, homemaker (meal prep, light housekeeping, laundry, shopping), personal emergency response system (PERS), respite, assisted living, attendant care, chore services, environmental accessibility adaptations, home-delivered meals, specialized medical equipment/supplies. Services based on identified needs and available funding; no fixed dollar amounts or hours specified.[1][2][7]` ([source](https://adsd.nv.gov/Programs/Seniors/PD_Waiver/Waiver_for_Person’s_with_Physical_Disabilities_(PD)/))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov/Programs/Seniors/PD_Waiver/Waiver_for_Person’s_with_Physical_Disabilities_(PD)/`

### Nevada Program of All-Inclusive Care for the Elderly (PACE)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive medical and social services including primary care, nursing, physical therapy, speech therapy, prescription drugs, preventive care, social services, transportation to/from PACE center and appointments; all Medicare/Medicaid-covered services plus additional long-term care; no deductibles or copays for enrollees[4]` ([source](https://adsd.nv.gov/ (Nevada Aging and Disability Services Division) or https://dhhs.nv.gov/ (Nevada DHHS); program launch per Senate Bill 207 effective July 1, 2025[1][5]))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov/ (Nevada Aging and Disability Services Division) or https://dhhs.nv.gov/ (Nevada DHHS); program launch per Senate Bill 207 effective July 1, 2025[1][5]`

### Nevada Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,235` ([source](https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments for Medicare-covered services. Providers cannot bill beneficiary for covered services.[2][1] **SLMB:** Pays Part B premiums only.[1][8] **QI:** Pays Part B premiums only; also qualifies for Extra Help (low Part D costs, e.g., ≤$12.65 per drug in 2026).[2][1][8]` ([source](https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dss.nv.gov/programs/snap/))
- **income_limit**: Ours says `$1952` → Source says `$2608` ([source](https://www.dss.nv.gov/programs/snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Amount based on net income: max allotment minus 30% net income (e.g., 2-person elderly household example: $546 max - 30% of $437 net = $415/month). Minimum/maximum allotments vary by household size; $100 more net income = ~$30 less benefits. Deductions boost amount (e.g., medical >$35, shelter, homeless allowance $190).[1][5]` ([source](https://www.dss.nv.gov/programs/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.nv.gov/programs/snap/`

### Nevada Energy Assistance Program (EAP) / LIHEAP

- **income_limit**: Ours says `$2800` → Source says `$1,882` ([source](https://www.dss.nv.gov/programs/energy/apply-for-assistance/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating assistance: maximum benefit $3,136, minimum benefit $360[1]. Crisis assistance (emergency situations like broken furnace or utility shutoff notice): maximum benefit $3,136[1]. Cooling assistance is not offered in Nevada[1]. Benefits are calculated based on household income, household size, and type of fuel used for heating[1].` ([source](https://www.dss.nv.gov/programs/energy/apply-for-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.nv.gov/programs/energy/apply-for-assistance/`

### Nevada State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, one-on-one counseling and assistance; no dollar limits or hour restrictions documented` ([source](adsd.nv.gov/Programs/Seniors/Medicare_Assistance_Program_(MAP)/MAP_Prog/))
- **source_url**: Ours says `MISSING` → Source says `adsd.nv.gov/Programs/Seniors/Medicare_Assistance_Program_(MAP)/MAP_Prog/`

### Home Delivered Meals

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered nutritionally balanced meals complying with Dietary Guidelines for Americans and providing at least 33 1/3% of Recommended Dietary Allowances (RDA). Typically 7 meals per week: 1 hot meal + up to 6 frozen meals per delivery; 2 shelf-stable meals annually for emergencies. Additional 7 meals/week possible via Second Home Delivered Meal Program assessment.[3][6][7]` ([source](https://adsd.nv.gov (Nevada Aging and Disability Services); https://www.medicaid.nv.gov (waiver details)[1][3][6]))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov (Nevada Aging and Disability Services); https://www.medicaid.nv.gov (waiver details)[1][3][6]`

### Nevada Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://adsd.nv.gov/Programs/Seniors/LTCOmbudsman/LTCOmbudsProg/[2]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Certified advocates investigate and resolve complaints related to dignity, respect, admissions/discharges, quality of care, privacy, dietary issues, activities, environmental concerns; routine facility visits; education on rights and services; referral to agencies; no cost services; confidentiality maintained[1][3][5]` ([source](https://adsd.nv.gov/Programs/Seniors/LTCOmbudsman/LTCOmbudsProg/[2]))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov/Programs/Seniors/LTCOmbudsman/LTCOmbudsProg/[2]`

### Home and Community-Based Waiver for the Frail Elderly (HCBW-FE)

- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://adsd.nv.gov (Aging and Disability Services Division; application PDF linked)))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Case management, homemaker, social adult day care, adult companion, attendant care, personal emergency response system, chore, respite, augmented personal care (in residential settings), home delivered meals.[4][5][6]` ([source](https://adsd.nv.gov (Aging and Disability Services Division; application PDF linked)))
- **source_url**: Ours says `MISSING` → Source says `https://adsd.nv.gov (Aging and Disability Services Division; application PDF linked)`

## New Programs (Not in Our Data)

- **Weatherization Assistance Program** — service ([source](https://housing.nv.gov/programs/weatherization/))
  - Shape notes: Statewide via regional subgrantees with varying income thresholds (150-200% FPL), priority tiers, and document requirements; benefits audit-based, not fixed dollar amounts.
- **Senior Respite Care and Respite Care Vouchers** — financial ([source](https://seniorsinservicenevada.org/respite-voucher-program/[7]; https://adsd.nv.gov/[2][3]))
  - Shape notes: County-restricted to Northern Nevada; live-in caregiver mandate; voucher fixed at $1000/year via community grant, not Medicaid entitlement; separate from Medicaid waiver respite with NFLOC[1][2][5][7]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://adsd.nv.gov/About/Reports/SrCommSvcEmplyProg/Home/[1]))
  - Shape notes: Federally mandated but locally administered by grantees (AARP, NAPCA) with state monitoring via ADSD; priority tiers affect access; income at 125% FPL (updates yearly, no table in sources); county-residency restricted by provider
- **Nevada Advocates for Seniors** — service ([source](https://nvapros.com/our-services/))
  - Shape notes: Private care management service, not a public benefits program with income/asset tests or waitlists; data limited to service descriptions without eligibility details or application specifics
- **Nevada Senior Rx Program** — financial ([source](https://adsd.nv.gov/programs/seniors/seniorrx/srrxprog/))
  - Shape notes: Program was tied to Medicare Part D enrollment (implemented January 1, 2006), creating a wrap-around benefit structure. Income limits scaled by household size (singles vs. couples only). No asset test made it more accessible than comparable programs. Program was funded by Tobacco Settlement dollars, making it vulnerable to funding changes. As of May 1, 2006, enrollment was 8,533 members[3].
- **Nevada Personal Care Services Program (PCS)** — service ([source](https://adsd.nv.gov/programs/seniors/persasstsvcs/pas_prog/))
  - Shape notes: Tied to Medicaid enrollment with functional needs assessment (FASP); self-directed or agency-directed models; regional ADSD offices handle intake; no fixed service hours—assessor-determined; waivers like Physical Disability or Frail Elderly may apply
- **Community Options Program for the Elderly (COPE)** — service ([source](https://adsd.nv.gov/Programs/Seniors/COPE/COPE_Prog/[1]))
  - Shape notes: Statewide with regional offices; income/assets per NAC 427A (call for current); waitlist possible; non-Medicaid bridge to waivers like HCBS FE[1][2][5]
- **Taxi Assistance Program (TAP)** — in_kind ([source](https://adsd.nv.gov/programs/seniors/tap/tap_prog/))
  - Shape notes: This program is geographically restricted to Clark County and currently has a funding freeze for new applicants. Benefits are fixed (50% discount on taxi fares via coupon books) rather than scaled. Income eligibility is tied to Federal Poverty Guidelines at 125% threshold, which varies by household size but specific dollar amounts are not provided in available sources. The program operates Monday-Friday only, with no weekend service[6].

## Program Details

### Nevada Medicaid


**Eligibility:**
- Age: 65+
- Income: For Nursing Home Medicaid and long-term care programs in 2026: Single applicant - $2,982/month; Married (single applicant) - $2,523/month; Married (both applicants) - $5,046/month. Almost all income counts (e.g., Social Security, pensions, wages). Beneficiaries in nursing homes keep $163/month personal needs allowance plus Medicare premiums if dual eligible.[3][5]
- Assets: Single applicant - $2,000 countable assets; Married (single applicant) - $2,000 for applicant, $137,400 for non-applicant spouse; Married (both) - $4,000. Countable assets include most savings, investments; exempt typically include primary home (subject to estate recovery), one vehicle, personal belongings. Varies slightly by program (e.g., HCBS waivers).[3][5][7]
- Nevada resident
- U.S. citizen or qualified legal resident
- Nursing Facility Level of Care (NFLOC) for long-term care programs, assessed via Activities of Daily Living (ADLs) and Instrumental ADLs (IADLs)
- For HCBS waivers (e.g., Assisted Living Waiver): medical need confirmed by assessment

**Benefits:** Long-term care services including nursing home coverage, Home and Community-Based Services (HCBS) waivers for home health care, personal care services, adult day health care; assisted living waiver (room/board not covered). Covers care as long as eligible, potentially for life; may require income contribution toward costs.[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Online: https://accessnevada.dwss.nv.gov/ (via Nevada Division of Welfare and Supportive Services)
- Phone: (775) 684-3600 (Nevada Medicaid Services)
- In-person: Local DWSS offices or Aging and Disability Resource Centers
- Mail: Through DWSS

**Timeline:** Varies; can take longer than expected, coverage possibly retroactive 3 months prior to approval. Ask for usual timeframe upon submission.[4]
**Waitlist:** Possible for HCBS waivers due to limited slots; not specified for nursing home.[2]

**Watch out for:**
- Must contribute most income to care costs in nursing homes (only $163/month personal allowance).[3]
- Home equity exempt but subject to estate recovery after death.[7]
- HCBS waivers have waitlists and room/board not covered in assisted living.[2]
- Need NFLOC even for home-based care; assessment required.[3]
- Limits updated annually; 2026 figures apply (e.g., $2,982 single income).[3]

**Data shape:** Income/asset limits vary by marital status and program type (nursing home vs. HCBS waivers); requires functional NFLOC assessment; statewide but waiver slots limited leading to waitlists.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.nv.gov/programs/medical/

---

### Home and Community-Based Services (HCBS) Waiver


**Eligibility:**
- Age: 65+
- Income: At or below 150% of the Federal Poverty Level (FPL); exact dollar amounts vary by household size and year—call ADSD for current guidelines as specific 2026 figures not listed in sources. Financial eligibility follows Nevada Medicaid rules, which may require spend-down to $2,000 for the applicant.[1][3]
- Assets: Applicant assets limited to $2,000 (must spend down or transfer excess). Home equity exempt if applicant lives there or intends to return (up to $752,000 in 2026), or if spouse/dependent child under 21 or blind/disabled child lives there.[3][4]
- Nevada resident.
- Diagnosed with physical disability (for PD Waiver) or frail elderly condition.
- At risk of nursing home institutionalization (meets Nursing Facility Level of Care/NFLOC via Nevada Medicaid LOC assessment).
- Financially eligible for Nevada Medicaid.
- Require at least one monthly service under the waiver.[1][2][3][4][7]

**Benefits:** Case management, homemaker (meal prep, light housekeeping, laundry, shopping), personal emergency response system (PERS), respite, assisted living, attendant care, chore services, environmental accessibility adaptations, home-delivered meals, specialized medical equipment/supplies. Services based on identified needs and available funding; no fixed dollar amounts or hours specified.[1][2][7]
- Varies by: priority_tier

**How to apply:**
- Phone: Call Aging and Disability Services Division (ADSD) for intake (specific number not listed—contact local Regional Center).[1][4]
- In-person: ADSD Regional Centers or Office of Community Living (OCL).
- Complete OCL Intake Home and Community Based form.[4]

**Timeline:** Not specified in sources.
**Waitlist:** Limited slots available; waitlists common due to funding caps.[5]

**Watch out for:**
- Multiple HCBS waivers exist (e.g., PD for physical disabilities ages 0+, FE for frail elderly 65+); confirm correct waiver—PD covers elderly with physical disabilities, separate FE for frail elderly.[1][2][4][7]
- Services not entitlement—limited by funding/slots, leading to waitlists.[5]
- Must meet both financial (income/asset spend-down) AND functional (NFLOC) criteria; assessment required.[3][4]
- Home equity limit $752,000 (2026); exemptions narrow.[4]
- Call for current income guidelines as they change annually.[1]

**Data shape:** Multiple waivers under HCBS umbrella (PD, FE, ID, etc.) with overlapping but distinct eligibility/services; eligibility ties to specific diagnosis (physical disability vs. frail elderly) and NFLOC; slot-limited with regional centers; no fixed service hours/dollars—needs-based.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov/Programs/Seniors/PD_Waiver/Waiver_for_Person’s_with_Physical_Disabilities_(PD)/

---

### Nevada Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No financial requirements; fully covered for Medicaid-eligible individuals (dual-eligible with Medicare); non-Medicaid eligible pay a monthly premium[2][3]
- Assets: No asset limits or tests apply[2]
- Live in a PACE geographic service area in Nevada
- Certified by Nevada as needing nursing home level of care (Nursing Facility Level of Care or NFLOC)
- Able to live safely in the community with PACE services[1][2][3]

**Benefits:** Comprehensive medical and social services including primary care, nursing, physical therapy, speech therapy, prescription drugs, preventive care, social services, transportation to/from PACE center and appointments; all Medicare/Medicaid-covered services plus additional long-term care; no deductibles or copays for enrollees[4]

**Timeline:** Not specified in available sources

**Watch out for:**
- Program is brand new in Nevada (launched post-July 2025 via SB 207); no operational sites or enrollment open as of early 2025 data—check current status[5]
- Strictly limited to designated service areas; not statewide[1][2]
- Requires state-certified nursing home level of care despite community living goal[2][3]
- Becomes sole source of Medicare/Medicaid services; separate Part D plans cause disenrollment[3][4]
- Non-Medicaid pay premium (amount not specified for Nevada)[2]

**Data shape:** Newly authorized in Nevada (2025 launch); no operational providers or service areas detailed yet; follows federal PACE model with state-specific NFLOC certification and capitation rates; availability extremely limited geographically

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov/ (Nevada Aging and Disability Services Division) or https://dhhs.nv.gov/ (Nevada DHHS); program launch per Senate Bill 207 effective July 1, 2025[1][5]

---

### Nevada Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits are monthly and based on federal poverty levels (FPL), adjusted annually effective April 1. For 2026 (per Medicare.gov), exact amounts not specified in sources but typically: QMB ≤100% FPL (e.g., ~$1,235 single/$1,663 couple per older estimates[1]); SLMB 100-120% FPL (up to ~$1,478 single/$1,992 couple[1]); QI 120-135% FPL (up to ~$1,660 single/$2,239 couple[1]). Nevada follows federal standards; limits for single or married (household of 2); larger households scale accordingly but primarily cited for 1-2. Must be enrolled in Medicare Part A/B.[1][2][8]
- Assets: Federal limits apply statewide: $9,090 for single, $13,630 for married. Countable assets include bank accounts, stocks; exempt: home, one car, personal belongings, burial plots, life insurance up to $1,500 face value.[1][3]
- Nevada resident and U.S. citizen or qualified immigrant.
- Enrolled in Medicare Part A and B.
- For QMB: Age 65+, disabled, or ESRD.
- Not eligible for full Medicaid.

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments for Medicare-covered services. Providers cannot bill beneficiary for covered services.[2][1] **SLMB:** Pays Part B premiums only.[1][8] **QI:** Pays Part B premiums only; also qualifies for Extra Help (low Part D costs, e.g., ≤$12.65 per drug in 2026).[2][1][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Local Welfare District Office or DWSS (Division of Welfare and Supportive Services) at 775-684-0645 or 800-992-0900.
- In-person: Local DWSS Welfare District Office.
- Mail: To local DWSS office.
- Online: Via Access Nevada portal at dwsd.nv.gov (implied via DWSS).[4][8]
- Apply anytime for QMB/SLMB; QI may have funding limits.[8]

**Timeline:** QMB: Month following approval; SLMB/QI: Retroactive to application month + 3 prior months.[8]
**Waitlist:** QI: Possible if state federal allocation exhausted (100% federally funded).[8]

**Watch out for:**
- QI has limited federal funding and may end if allocation used; apply early in fiscal year.[8]
- Income limits change April 1 annually; use current FPL calculators.[5]
- QMB protects from provider billing on covered services, but small Medicaid copays may apply.[2]
- Automatic Extra Help with Part D for QMB/SLMB/QI, but confirm enrollment.[2]
- Assets include most liquid resources; exemptions often missed (e.g., home exempt).[1]
- Must apply through Nevada Medicaid/DWSS, not directly to Medicare.[4]

**Data shape:** Tiered by income brackets (QMB ≤100% FPL, SLMB 100-120%, QI 120-135%); benefits decrease by tier (QMB fullest coverage); statewide but local DWSS offices handle apps; annual FPL adjustments; QI funding-capped.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.nv.gov/programs/medical/general-medical-information/2-general-information-4mb/

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (Oct 1, 2025 - Sept 30, 2026): Gross income limit at 200% federal poverty level - 1 person: $2608/month, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, each additional +$916. Such households qualify by meeting Net Income test (e.g., 2025: ~$15,060/year or $1,255/month for 1; $20,440/year or $1,703/month for 2) if over gross limit, plus Asset test if applicable. Net income calculated after deductions like 20% earned income, shelter (rent/mortgage/utilities, max for some), medical >$35 for elderly/disabled.[1][2][3][5]
- Assets: Households with elderly (60+) or disabled: $3,500 countable resources (e.g., cash, bank accounts); $2,250 otherwise. Exempt: home value, retirement savings, life insurance cash value, household goods, income-producing property (some states waive if income low).[2][3][4]
- U.S. citizen or qualified alien (e.g., 5-year residency for some).
- Nevada resident.
- Work requirements exempt for 60+ (apply to able-bodied adults 18-64 without kids: 20 hours/week or 80/month, limited to 3 months/3 years if unmet; exceptions for high unemployment areas).[1][3][5][6]
- Household includes those who buy/prepare food together.

**Benefits:** Monthly EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Amount based on net income: max allotment minus 30% net income (e.g., 2-person elderly household example: $546 max - 30% of $437 net = $415/month). Minimum/maximum allotments vary by household size; $100 more net income = ~$30 less benefits. Deductions boost amount (e.g., medical >$35, shelter, homeless allowance $190).[1][5]
- Varies by: household_size

**How to apply:**
- Online: Access Nevada (https://accessnevada.dwss.nv.gov) (inferred from state DSS).
- Phone: Local Social Services Office (check dss.nv.gov for numbers).
- Mail/In-person: Local Social Services Offices statewide.

**Timeline:** Not specified in sources; typically 30 days standard, expedited <7 days if eligible.

**Watch out for:**
- Elderly/disabled skip gross income test, use net + assets; Nevada expanded beyond federal (200% FPL gross).[1]
- Medical expenses >$35/month deductible, boosting benefits—often missed.[1][2][4]
- Household = food buyers/preparers, even family; assets exempt home/savings but count cash.[2][3]
- SSI recipients may auto-qualify or get combo benefits.[3]
- Post-2025 changes: work rules to age 65, narrower exceptions.[4][5]

**Data shape:** Elderly/disabled special rules: gross income optional (net + assets instead); Nevada broadens federal limits to 200% FPL gross; heavy deductions for shelter/medical scale benefits by net income/household size; statewide but local offices handle.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.nv.gov/programs/snap/

---

### Nevada Energy Assistance Program (EAP) / LIHEAP


**Eligibility:**
- Income: Household gross monthly income must not exceed the following limits[1][5]: 1 person: $1,882.50–$1,956/month; 2 people: $2,555–$2,644/month; 3 people: $3,227.50–$3,331/month; 4 people: $3,900–$4,018/month; 5 people: $4,572.50–$4,707/month; 6 people: $5,245–$5,394/month; 7+ people: add $672.50 per additional person[5]. Note: Income limits vary slightly by program year; verify current limits with your local EAP office[1].
- Assets: No asset limit for LIHEAP in Nevada[1].
- Household members must meet citizenship or legal residency criteria[5]
- Household must live in Nevada[5]
- Household must be at least partly responsible for home heating or cooling costs by paying a utility company, fuel supplier, or landlord directly[5]
- If household expenses exceed household income, proof of how the household is meeting their needs must be provided[3]

**Benefits:** Heating assistance: maximum benefit $3,136, minimum benefit $360[1]. Crisis assistance (emergency situations like broken furnace or utility shutoff notice): maximum benefit $3,136[1]. Cooling assistance is not offered in Nevada[1]. Benefits are calculated based on household income, household size, and type of fuel used for heating[1].
- Varies by: household_size and fuel type

**How to apply:**
- Online application through dss.nv.gov[3]
- Paper application obtained from any EAP Office, Social Services Office, Customer Service Unit (CSU), or Intake Sites around the state[3]
- In-person at Intake Sites, which also provide assistance in completing and mailing applications[3]
- Mail completed application to local EAP Office[3]

**Timeline:** Not specified in available sources; contact your local LIHEAP office for processing timeline[1]
**Waitlist:** Not specified; however, funding is limited and some local agencies may stop accepting applications if funds run out[1]

**Watch out for:**
- Heating assistance is typically available only in fall and winter; cooling assistance is NOT offered in Nevada[1]
- Crisis assistance is available only in emergencies (broken furnace, utility shutoff notice), not for routine heating/cooling needs[1]
- Roommates covered by the same utility bill are counted as part of the same LIHEAP household for income calculation purposes, even if they don't share most expenses[1]
- Funding is limited and not guaranteed; apply as early as possible during your state's enrollment period[1][4]
- Income limits are based on gross monthly income (before taxes), not net income[1]
- The utility bill does not need to be in the applicant's name, but written authorization from the person whose name is on the bill is required[2][3]
- Every person living in the home must be listed on the application with name, date of birth, and Social Security Number[2]
- If household income exceeds limits but includes out-of-pocket medical expenses, you may still qualify—submit verification of those expenses[2]

**Data shape:** Benefits scale by household size and fuel type. Program availability varies by season (heating in fall/winter only; no cooling assistance). Income limits vary by program year and household size. Funding is not guaranteed and varies by local demand and timing of application. No age requirement specified, making this accessible for elderly individuals regardless of age. Asset limits do not apply, which is favorable for applicants with savings.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.nv.gov/programs/energy/apply-for-assistance/

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households must have income at or below 200% of the federal poverty level (FPL), as defined by the U.S. Office of Management and Budget. Some providers use 150% FPL (e.g., FEAC ≤150% FPL per NHD guidelines) or specify limits like $108,300 for a family of 8 in Washoe County (add $11,000 per additional person); exact table varies annually by FPL and is not fixed by household size in sources but follows federal guidelines.[1][4][6][7][8]
- Assets: No asset limits mentioned in sources.
- Priority to households with elderly, disabled members, young children, emergency situations, or Energy Assistance Program recipients.[1][4]
- Valid ID and Social Security cards for all household members (especially adults 18+).[2][3]
- Owner-occupied single-family homes, mobile homes, condos, or rentals with landlord approval.[3]
- Home must pass energy audit for cost-effectiveness.[1][4]

**Benefits:** Free energy efficiency upgrades including insulation (ceiling, floor, duct, wall), duct and shell infiltration sealing, windows, exterior/storm doors; possible HVAC repair/replacement, refrigerators, water heaters based on audit and DOE criteria. No direct cost to eligible homeowners/renters; rental owners may cover 50% of capital improvements.[1][4]
- Varies by: priority_tier

**How to apply:**
- Contact local subgrantee by region (e.g., HELP of Southern Nevada, Nevada Rural Housing, CSA Reno, RND Council).[2][3][4][6][8]
- Phone: Weatherization Supervisor (702) 486-4311 or regional (e.g., CSA 775-786-6023).[1][8]
- Email: weatherization@housing.nv.gov or regional (e.g., weatherization@csareno.org, gas@helpsonv.org).[1][3][8]
- Mail/in-person: Varies by provider (e.g., Carson City: 1830 E. College Parkway, Suite 200; CSA Reno: 1090 E. 8th St.).[1][2][8]
- Online: Regional forms (e.g., CSA Weatherization Application, income qualifier tool at helpsonv.org).[3][8]

**Timeline:** Applications reviewed in order received; eligible contacted for energy audit. No statewide timeline specified; varies by provider.[8]
**Waitlist:** Not explicitly mentioned; processing order-based suggests potential delays.[8]

**Watch out for:**
- Renters need landlord approval; owners of rentals may pay 50% of capital costs.[3][4]
- Must complete full application packet and be deemed eligible; incomplete docs delay.[1][2]
- Priority tiers mean not first-come; elderly/disabled prioritized but competition high.[1]
- Services only if home passes DOE cost-effectiveness audit.[1][4]
- Providers have specific service areas; wrong contact delays.[4]
- No liens on owner-occupied but verify rental terms.[6]

**Data shape:** Statewide via regional subgrantees with varying income thresholds (150-200% FPL), priority tiers, and document requirements; benefits audit-based, not fixed dollar amounts.

**Source:** https://housing.nv.gov/programs/weatherization/

---

### Nevada State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: Not specified in available sources
- Assets: Not specified in available sources
- Anyone needing assistance with Medicare coverage can seek this service — no formal eligibility restrictions documented
- Program serves Medicare beneficiaries, their families, friends, and caregivers

**Benefits:** Free, one-on-one counseling and assistance; no dollar limits or hour restrictions documented
- Varies by: not_applicable — services are standardized statewide

**How to apply:**
- Phone: 1-800-307-4444 (toll-free statewide)[6][7]
- Phone: 702-486-3478 (Las Vegas area)[3]
- Phone: 1-844-826-2085 (alternative number)[2]
- Email: NevadaMAP@adsd.nv.gov[6]
- Website: adsd.nv.gov[2]
- Website: nvaging.net[3]
- In-person: 4055 S Virginia St. Reno, NV 89502[2]
- In-person: Counseling available at Senior Centers throughout Nevada[3]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- SHIP is NOT a health insurance plan itself — it provides counseling and assistance to help people choose Medicare plans[1]
- Services are completely free and unbiased; counselors will not pressure you into a plan or sell you insurance products[1][2]
- Nevada SHIP is part of the broader Medicare Assistance Program (MAP), which also includes Senior Medicare Patrol (SMP) and Medicare Improvements for Patients and Providers Act (MIPPA)[6]
- Program was established in Nevada in July 1993 and is federally funded through Centers for Medicare and Medicaid Services (CMS), administered by Nevada Aging and Disability Services Division[3]
- No income or asset limits are documented in available sources — eligibility appears to be universal for Medicare beneficiaries and their families
- The program has no documented age requirement; it serves Medicare beneficiaries regardless of age

**Data shape:** This program is a counseling and advocacy service, not a financial assistance or insurance program. No income limits, asset limits, or formal eligibility criteria are documented in available sources. Benefits are standardized statewide with no tiered structure. The program operates through a distributed network of volunteers and community partners rather than centralized offices. Key limitation: search results do not contain specific information about processing times, application forms, required documents, or detailed eligibility criteria — families should contact the program directly at 1-800-307-4444 for these details.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** adsd.nv.gov/Programs/Seniors/Medicare_Assistance_Program_(MAP)/MAP_Prog/

---

### Home Delivered Meals


**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned in state program sources; eligibility primarily functional (homebound due to illness, disability, or geographic isolation, unable to attend congregate meals). Medicaid waiver versions may have financial criteria based on waiver enrollment, but exact dollar amounts or tables not detailed.[1][2][3][5][6][7]
- Assets: Not applicable or not specified in available sources.
- Homebound due to illness, disability, or geographic isolation
- Unable to attend a congregate meal site
- For Medicaid waivers: Enrollment in specific HCBS waivers like Frail Elderly (FE), Physical Disabilities, or IDD[1][2][3]
- Confirmed via in-home assessment for some programs (e.g., Washoe County)[5]
- Live within service delivery area for non-statewide providers[4]

**Benefits:** Home-delivered nutritionally balanced meals complying with Dietary Guidelines for Americans and providing at least 33 1/3% of Recommended Dietary Allowances (RDA). Typically 7 meals per week: 1 hot meal + up to 6 frozen meals per delivery; 2 shelf-stable meals annually for emergencies. Additional 7 meals/week possible via Second Home Delivered Meal Program assessment.[3][6][7]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or senior services (e.g., Washoe County Senior Services: 775-328-2575, www.washoecounty.gov/seniorsrv/nutrition/home_delivered_meals.php)[5][7]
- Catholic Charities Southern Nevada for Las Vegas area (contact for eligibility assessment)[4]
- For Medicaid waiver: Contact case manager or health plan; enroll via Nevada Medicaid Provider Enrollment Portal (providers), but recipients apply through waiver case management[1][2][3]
- Nevada 211 for referrals: nevada211.org[9]

**Timeline:** Not specified; eligibility confirmed during in-home visit for some programs[5]
**Waitlist:** Not mentioned in sources; regional variation likely

**Watch out for:**
- Not a single statewide program—must contact local provider (e.g., county AAA); often requires in-home assessment, not just phone application
- Medicaid version tied to specific waivers (Frail Elderly, Physical Disabilities)—not automatic for all seniors
- Homebound strictly defined (unable to attend congregate site); recertification required
- Private providers like Meals on Wheels may have delivery area limits
- No cost for eligible, but Medicaid waivers have separate financial eligibility[1][4][5][6]

**Data shape:** Decentralized by region/local AAA with statewide OAA and Medicaid waiver specs; no uniform income test or asset limits specified; functional/homebound criteria primary; varies by county/provider

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov (Nevada Aging and Disability Services); https://www.medicaid.nv.gov (waiver details)[1][3][6]

---

### Senior Respite Care and Respite Care Vouchers

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Priority to care receivers whose net income meets 300% of DHHS poverty guidelines, but services available to those exceeding low-income guidelines; no exact dollar amounts or household size table specified[2][7]. For related Medicaid waivers, income and asset limits apply with NFLOC requirement, but not directly for vouchers[1][5].
- Assets: Not specified for respite vouchers; for Medicaid Frail Elderly Waiver, assets subject to look-back rule, home equity limit $752,000 in 2026 if intent to return, exemptions for spouse or dependent child in home[1].
- Care receiver lives in community (not assisted living, care facility, or nursing home)[2].
- Care receiver has functional impairment needing supervision/hands-on assistance with most ADLs; safety/well-being risk if alone[2].
- Primary caregiver (family, friend, unpaid) resides in same residence as care receiver (live-in requirement)[2][6][7][9].
- Available in specific Northern Nevada counties: Carson City, Churchill, Douglas, Elko, Eureka, Humboldt, Lander, Lyon, Mineral, Nye, Pershing, Storey, Washoe, White Pine[2].
- Photo ID required[2].
- Dementia/Alzheimer’s managed separately via Alzheimer’s Association[2].

**Benefits:** $1000 voucher per year per qualifying individual to pay for alternate caregiver respite services[7]; related programs limit respite to 120 hours/year[5] or 336 hours/fiscal year[6].
- Varies by: region

**How to apply:**
- Phone: (775) 358-2768[2][8]
- In-person: Seniors in Service, 1380 Greg Street #231, Sparks, NV 89431[2][8]

**Timeline:** Not specified
**Waitlist:** Funds availability required; may impact access[6]

**Watch out for:**
- Live-in caregiver requirement; must reside in same home[2][9].
- Not for care receivers in facilities; community living only[2].
- Priority for low-income (300% poverty) but open to higher; funds limited[2][6].
- Regional restriction to specific Northern counties; not statewide[2].
- Legally responsible relatives/guardians cannot provide paid respite in waivers[5].
- Dementia cases referred elsewhere[2].

**Data shape:** County-restricted to Northern Nevada; live-in caregiver mandate; voucher fixed at $1000/year via community grant, not Medicaid entitlement; separate from Medicaid waiver respite with NFLOC[1][2][5][7]

**Source:** https://seniorsinservicenevada.org/respite-voucher-program/[7]; https://adsd.nv.gov/[2][3]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Annual household income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in current sources; families must contact local SCSEP office to verify based on latest federal poverty guidelines[2][3][6].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Reside in the county supported by the local provider (e.g., AARP in northern Nevada counties)[4]

**Benefits:** Part-time community service assignments (average 20 hours per week) at non-profits/public facilities (schools, hospitals, senior centers); paid at the highest of federal, state, or local minimum wage; on-the-job skills training; supportive services (e.g., transportation, food/housing assistance); job placement assistance to unsubsidized employment; typically lasts about 6 months[2][3][5][7].
- Varies by: priority_tier

**How to apply:**
- Phone: Northern Nevada AARP SCSEP at 775-323-2243 (Reno office, 8am-4pm Mon-Fri)[4]
- In-person: 1135 Terminal Way Suite 102, Reno, NV 89502[4]
- Online locator: my.aarpfoundation.org/locator/scsep/ to find local office[8]
- Contact state monitor: Aging and Disability Services Division (ADSD) via adsd.nv.gov[1][5]

**Timeline:** Not specified; if eligible and no waitlist, enrolled promptly[3].
**Waitlist:** Possible waitlist depending on local capacity; check with local office[3].

**Watch out for:**
- Priority enrollment: Veterans/qualified spouses first, then over 65, disabled, low literacy, limited English, rural residents, homeless/at-risk, low prospects, or prior American Job Center users[2]
- Temporary bridge program (avg 6 months) aimed at unsubsidized jobs, not long-term employment[2][3]
- Income test strictly at 125% FPL; must confirm exact limits with local office as they update yearly[2][3]
- Limited slots; waitlists common in high-demand areas[3]
- Must reside in provider's service county[4]

**Data shape:** Federally mandated but locally administered by grantees (AARP, NAPCA) with state monitoring via ADSD; priority tiers affect access; income at 125% FPL (updates yearly, no table in sources); county-residency restricted by provider

**Source:** https://adsd.nv.gov/About/Reports/SrCommSvcEmplyProg/Home/[1]

---

### Nevada Advocates for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits stated; services focus on helping individuals age in place, with no mention of financial thresholds in available data.
- Assets: No asset limits mentioned.
- Nevada resident
- Primarily seniors seeking to remain independent at home, though exact criteria not detailed

**Benefits:** Home safety assessments, coordinating home repairs and modifications, vetting and supervising in-home care providers; Registered Nurse Advocates perform announced and unannounced visits to ensure quality care and adherence to care plans.

**How to apply:**
- Website: https://nvapros.com/our-services/
- Phone or contact details not specified in sources; contact via website recommended

**Timeline:** Not specified

**Watch out for:**
- Not a government-funded entitlement program; appears to be a private service provider rather than free public benefits with strict eligibility—families may need to pay for services
- Distinct from free legal advocacy programs like Southern Nevada Senior Law Program or Nevada Legal Services Senior Law Project
- Focus is on care management and supervision, not direct provision of healthcare or financial aid

**Data shape:** Private care management service, not a public benefits program with income/asset tests or waitlists; data limited to service descriptions without eligibility details or application specifics

**Source:** https://nvapros.com/our-services/

---

### Nevada Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Income: No income limits; program is free and available to all qualifying residents regardless of financial status[1][2][3][5]
- Assets: No asset limits or financial tests apply[2][3]
- Must reside in a long-term care facility such as nursing home, assisted living, or residential care for the elderly[1][3][5][7]
- Consent required from resident or responsible party (or best interest if no party available)[1]

**Benefits:** Certified advocates investigate and resolve complaints related to dignity, respect, admissions/discharges, quality of care, privacy, dietary issues, activities, environmental concerns; routine facility visits; education on rights and services; referral to agencies; no cost services; confidentiality maintained[1][3][5]

**How to apply:**
- Helpline: 1-888-282-1155[2][5][8]
- Online complaint form via website[2]
- Las Vegas Regional Office: 702-486-3572, ltc.ombudsman@adsd.nv.gov[5][8]
- Carson City Administrative Office: 775-687-4210[2][5]
- Elko Regional Office: 775-738-1966[5]
- Website: adsd.nv.gov/Programs/Seniors/LTCOmbudsman/LTCOmbudsProg/[2]

**Timeline:** Not specified in sources

**Watch out for:**
- Not for home care or community-dwelling elders (separate Community Ombudsman Program exists for those 60+ in community)[6]
- Requires resident consent or responsible party approval; ombudsman acts independently of facilities but employed by state[1][5]
- Primarily for facility residents; general public can seek info but core service is facility-based advocacy[3]
- One source mentions financial eligibility but contradicts others stating no cost/no limits—likely error as federal program is free[2][3]

**Data shape:** no income test; facility-resident only; consent-driven; statewide with regional offices; free advocacy service under Older Americans Act

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov/Programs/Seniors/LTCOmbudsman/LTCOmbudsProg/[2]

---

### Nevada Senior Rx Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: {"note":"Income limits changed annually on July 1st based on Consumer Price Index","most_recent_known":{"singles":"$33,152 (as of July 1, 2022)","married_couples":"$44,193 (as of July 1, 2022)","historical_reference":"$23,175 singles / $30,168 couples (as of 2006)"},"includes":"Income from all sources for both applicant and spouse"}
- Assets: {"status":"No asset test associated with the program","note":"This was a key distinction from some other assistance programs"}
- Continuous Nevada residency for at least 12 consecutive months (one year) prior to application date
- Must be enrolled in Medicare Part D and use that program as first source of prescription help
- Must apply for and use Extra Help with Part D costs if eligible (Extra Help may cover more than Senior Rx)

**Benefits:** Prescription medication cost assistance; specific dollar amounts or coverage percentages not detailed in available documentation
- Varies by: Medicare Part D enrollment status and Extra Help eligibility

**How to apply:**
- Mail: Send completed application to address on the form (NOT to RxResource.org)
- Phone: 1-866-303-6323 (Option 2 for current income limits); 687-7555 if calling from Reno-Carson City-Gardnerville areas
- In-person: Nevada Department of Health and Human Services (DHHS) Director's Office, 4126 Technology Way, Suite 101, Carson City, NV 89706-2009

**Timeline:** 30-45 days from receipt of application (unless additional information needed)

**Watch out for:**
- PROGRAM ENDED: As of December 31, 2023, no new applications are being accepted. Families should contact Nevada Medicare Assistance Program (MAP) at 800-307-4444 for current alternatives[6]
- Medicare Part D is mandatory first source: Applicants must enroll in Medicare Part D and exhaust that benefit before Senior Rx assistance applies
- Extra Help takes priority: If eligible for Extra Help (federal program), applicants must apply for and use that first, as it often covers more than Senior Rx[4]
- Income limits change annually: Limits adjusted July 1st each year based on Consumer Price Index; families need current figures from program
- No asset test was a major advantage: Unlike many assistance programs, Senior Rx did not count savings or assets against eligibility
- Married couples file jointly: Only one application needed for both spouses
- One-year residency requirement is strict: Must be continuous; any break in Nevada residency resets the clock

**Data shape:** Program was tied to Medicare Part D enrollment (implemented January 1, 2006), creating a wrap-around benefit structure. Income limits scaled by household size (singles vs. couples only). No asset test made it more accessible than comparable programs. Program was funded by Tobacco Settlement dollars, making it vulnerable to funding changes. As of May 1, 2006, enrollment was 8,533 members[3].

**Source:** https://adsd.nv.gov/programs/seniors/seniorrx/srrxprog/

---

### Home and Community-Based Waiver for the Frail Elderly (HCBW-FE)


**Eligibility:**
- Age: 65+
- Income: 2025 limits (likely applicable into 2026): Individual: $2,901/month; Married (both applying): $5,802/month. If only one spouse applies, individual limit applies and community spouse income is disregarded.[3]
- Assets: 2025 limits (likely applicable into 2026): Individual: $2,000; Married (both applying): $3,000. If only one spouse applies, both spouses' assets are jointly considered and limited to individual threshold. Exempt assets include primary home (if applicant lives there or intends to return with equity ≤$752,000 in 2026; spouse, dependent child <21, or blind/disabled child lives there), household furnishings, one vehicle.[1][3]
- Nevada resident.
- Nursing Facility Level of Care (NFLOC): Minimum 3 functional deficits on Nevada Medicaid LOC assessment (self-admin meds/treatments, ADLs like bathing/dressing/transferring/eating/mobility/continence, IADLs like meals/homemaking, supervision needs); at risk of nursing home placement within 30 days without waiver services.
- Require at least one monthly HCBS-FE service.

**Benefits:** Case management, homemaker, social adult day care, adult companion, attendant care, personal emergency response system, chore, respite, augmented personal care (in residential settings), home delivered meals.[4][5][6]

**How to apply:**
- Complete Office of Community Living (OCL) Intake Home and Community Based application.[1][4]
- Contact Aging and Disability Services Division (ADSD) or Office of Community Living (specific phone/website not in results; initiate via ADSD).[1][4]

**Timeline:** Not specified in sources.
**Waitlist:** Likely exists due to waiver caps (not explicitly detailed; common for HCBS waivers).[2]

**Watch out for:**
- Home exempt for eligibility but subject to Medicaid estate recovery without planning.[1][2]
- Dementia diagnosis does not automatically qualify; must meet NFLOC score of 3+ deficits.[1][2]
- If married and only one applies, both assets counted jointly.[3]
- Must require institutional care within 30 days without services.[1][4]
- 2025 financial limits shown; confirm 2026 updates as they may adjust.[1][3]

**Data shape:** Financial limits provided for individuals/couples but no full household size table; NFLOC determined by scored functional deficits (min 3/13); statewide with priority to urgent cases; services require at least monthly use.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://adsd.nv.gov (Aging and Disability Services Division; application PDF linked)

---

### Nevada Personal Care Services Program (PCS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Must be financially eligible under Nevada Medicaid guidelines; call local ADSD office for current income guidelines as specific dollar amounts not listed in sources. Varies by Medicaid enrollment. Seniors 65+ follow Medicaid income rules with home equity limit of $730,000 in 2025.
- Assets: Medicaid asset rules apply, including home equity limit of $730,000 (2025) for seniors 65+ living at home or intending to return. Exemptions include: spouse living in home, dependent under 21 in home, blind or disabled child of any age in home.
- Nevada resident enrolled in Nevada Medicaid (or Nevada Check Up in some cases)
- Chronic condition, physical disability, or health condition substantially limiting ADLs
- Need assistance with at least two ADLs (e.g., bathing, dressing) or one ADL + one IADL (e.g., meal prep, light housekeeping); medically necessary per functional assessment
- No available spouse or parent (if minor) to provide care
- Live in home (not hospital, nursing facility, etc.)
- Self-direct care or appoint representative (for self-directed model)
- For some waivers: enrolled in Physical Disability Waiver or Frail Elderly Waiver

**Benefits:** In-home personal care services including assistance with ADLs (bathing, dressing, eating, mobility, toileting) and IADLs (light housekeeping, meal prep); case management; amount, type, frequency determined by Functional Assessment Service Plan (FASP) via state-approved assessor (e.g., physical/occupational therapist). No fixed hours or dollar amount specified; tailored to needs.
- Varies by: priority_tier

**How to apply:**
- Phone: Call local Aging and Disability Services Division (ADSD) regional office or 1-800-525-2395 (Personal Care Nevada, NPI# 1043939861) to request PCS assessment
- Online/Mail/In-person: Submit OCL Program Application to nearest ADSD office; list of regional offices available via ADSD
- Request evaluation after Medicaid enrollment via accessnevada.dwss.nv.gov for Medicaid application

**Timeline:** Intake case manager contacts after complete application; assessment scheduled; no specific timeline stated
**Waitlist:** Not mentioned in sources

**Watch out for:**
- Must already be enrolled in Nevada Medicaid; having Medicaid does not automatically enroll in PCS—separate assessment required
- Application incomplete without CBC-423 Medical Diagnosis form
- No spouse/parent available to provide care; home equity limit applies for seniors
- Must meet nursing home eligibility level in some descriptions to prevent institutionalization
- Self-direction capability required or appoint representative
- Documentation delays common if missing

**Data shape:** Tied to Medicaid enrollment with functional needs assessment (FASP); self-directed or agency-directed models; regional ADSD offices handle intake; no fixed service hours—assessor-determined; waivers like Physical Disability or Frail Elderly may apply

**Source:** https://adsd.nv.gov/programs/seniors/persasstsvcs/pas_prog/

---

### Community Options Program for the Elderly (COPE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Monthly income and asset guidelines established by NAC 427A; call ADSD for current figures (2025 OCL Monthly Income Limits available on site, varies by household size but exact table not specified in sources)[1][2]
- Assets: Subject to asset guidelines per NAC 427A (specific limits and exemptions not detailed; financial documentation required for verification)[2]
- At risk of institutionalization (meet Nursing Facility Level of Care if services not provided)[1][2][5]
- Reside in Nevada[2]
- U.S. Citizen or legally admitted permanent resident[2]
- Provide Social Security number[2]

**Benefits:** Case management; Personal Care (assistance with bathing/dressing/grooming, toileting); Homemaker; Adult Day Care; Adult Companion (non-medical supervision, socialization, meals not full regime); PERS; Chore (heavy housework); Respite Care (short-term for caregiver relief). No specific dollar amounts or hours per week stated; services to sustain independent community living[1][5][6]

**How to apply:**
- Phone: Contact local regional ADSD office (list on site) or central (775) 687-4210[1]
- In-person or mail: Submit to nearest ADSD office (e.g., Carson City: 1550 College Parkway, Carson City, NV 89706; Las Vegas: 2460 Professional Court, Suite 110; Henderson: 2831 St. Rose Parkway, Suite 200)[1][7]
- Download forms from https://adsd.nv.gov/Programs/Seniors/COPE/COPE_Prog/[1]

**Timeline:** Intake case manager contacts after receipt; assessment if no waitlist (exact timeline not specified)[1][2]
**Waitlist:** Possible waitlist; screening for appropriateness if waitlisted, full assessment if not[2]

**Watch out for:**
- Non-Medicaid program, similar to HCBS FE Waiver but for those not yet on Medicaid or on its waitlist[1][5]
- Financial eligibility requires calling for current guidelines (not fixed/publicly listed in detail)[1][2]
- Must meet Nursing Facility Level of Care (LOC screening at face-to-face interview)[2]
- Services only while residing at home in Nevada[2]
- Certain family members (excluding spouses/guardians) may be paid for care, but confirm caregiver rules[4]

**Data shape:** Statewide with regional offices; income/assets per NAC 427A (call for current); waitlist possible; non-Medicaid bridge to waivers like HCBS FE[1][2][5]

**Source:** https://adsd.nv.gov/Programs/Seniors/COPE/COPE_Prog/[1]

---

### Taxi Assistance Program (TAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Monthly income must be below 125% of Federal Poverty Guidelines[2]. Applicants must provide income from all sources for both applicant and/or spouse, if applicable[2].
- Be a Nevada resident[2]
- Provide a copy of Nevada Photo ID/Driver's License[2]
- Be at least 60 years of age OR have a permanent disability[2]
- If claiming permanent disability, provide a letter from physician or Social Security Award letter[2]
- Reside full-time in Clark County[1][3]

**Benefits:** Discounted taxicab fares through coupon booklets. Each coupon book consists of either 20 $1.00 coupons or 4 $5.00 coupons, providing $20.00 worth of taxicab fare for only $10.00[6]. Coupons are accepted by all taxicab companies in Clark County[1].
- Varies by: fixed

**How to apply:**
- Mail: Complete Taxi Assistance Program Registration Form and mail to Aging and Disability Services Division - Las Vegas Regional Office, 7150 Pollock Drive, Las Vegas, NV 89119[1]
- Phone: (702) 486-3581, Monday-Friday, 8:00 a.m. to 4:30 p.m., excluding holidays[1]
- In-person appointment: 1860 E Sahara Ave, Las Vegas, NV 89104[6]. Appointments are required; drop-ins cannot be assisted[1]

**Timeline:** Not specified in available sources
**Waitlist:** As of the search results, funding capacity is met and no additional funding is available to serve new applicants. Staff will review new applications and process them, but this indicates a waitlist or enrollment freeze[1].

**Watch out for:**
- Program is currently at funding capacity with no additional funding available for new applicants[1]. New applications are still being accepted and reviewed, but this signals a potential waitlist.
- Payment for coupon books is limited: cash (in-person only), personal checks, or money orders. Credit cards and debit cards are NOT accepted[1].
- Coupon books must be redeemed by the expiration date[2].
- Appointments are required for in-person purchases or application assistance; drop-ins cannot be served[1].
- Income limits are based on 125% of Federal Poverty Guidelines, which vary by household size. Applicants must provide income documentation for both applicant and spouse if applicable[2].
- Permanent disability requires physician letter or Social Security Award letter as proof—self-reporting is insufficient[2].
- Program serves Clark County only; residents of other Nevada counties are not eligible[1][3].

**Data shape:** This program is geographically restricted to Clark County and currently has a funding freeze for new applicants. Benefits are fixed (50% discount on taxi fares via coupon books) rather than scaled. Income eligibility is tied to Federal Poverty Guidelines at 125% threshold, which varies by household size but specific dollar amounts are not provided in available sources. The program operates Monday-Friday only, with no weekend service[6].

**Source:** https://adsd.nv.gov/programs/seniors/tap/tap_prog/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Nevada Medicaid | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| Nevada Program of All-Inclusive Care for | benefit | local | deep |
| Nevada Medicare Savings Programs (QMB, S | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Nevada Energy Assistance Program (EAP) / | navigator | federal | simple |
| Weatherization Assistance Program | benefit | federal | deep |
| Nevada State Health Insurance Assistance | resource | federal | simple |
| Home Delivered Meals | benefit | local | deep |
| Senior Respite Care and Respite Care Vou | benefit | local | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Nevada Advocates for Seniors | benefit | state | medium |
| Nevada Long-Term Care Ombudsman Program | resource | federal | simple |
| Nevada Senior Rx Program | benefit | state | deep |
| Home and Community-Based Waiver for the  | benefit | state | deep |
| Nevada Personal Care Services Program (P | benefit | state | deep |
| Community Options Program for the Elderl | benefit | state | deep |
| Taxi Assistance Program (TAP) | benefit | local | simple |

**Types:** {"benefit":14,"navigator":1,"resource":2,"employment":1}
**Scopes:** {"state":7,"local":4,"federal":7}
**Complexity:** {"deep":13,"simple":4,"medium":1}

## Content Drafts

Generated 13 page drafts. Review in admin dashboard or `data/pipeline/NV/drafts.json`.

- **Nevada Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 5 content sections, 6 FAQs
- **Nevada State Health Insurance Assistance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Home Delivered Meals** (benefit) — 4 content sections, 6 FAQs
- **Senior Respite Care and Respite Care Vouchers** (benefit) — 4 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Nevada Advocates for Seniors** (benefit) — 1 content sections, 5 FAQs
- **Nevada Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Nevada Senior Rx Program** (benefit) — 3 content sections, 5 FAQs
- **Home and Community-Based Waiver for the Frail Elderly (HCBW-FE)** (benefit) — 4 content sections, 6 FAQs
- **Nevada Personal Care Services Program (PCS)** (benefit) — 5 content sections, 6 FAQs
- **Community Options Program for the Elderly (COPE)** (benefit) — 4 content sections, 6 FAQs
- **Taxi Assistance Program (TAP)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **not_applicable**: 5 programs
- **household_size**: 1 programs
- **household_size and fuel type**: 1 programs
- **not_applicable — services are standardized statewide**: 1 programs
- **region**: 2 programs
- **Medicare Part D enrollment status and Extra Help eligibility**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Nevada Medicaid**: Income/asset limits vary by marital status and program type (nursing home vs. HCBS waivers); requires functional NFLOC assessment; statewide but waiver slots limited leading to waitlists.
- **Home and Community-Based Services (HCBS) Waiver**: Multiple waivers under HCBS umbrella (PD, FE, ID, etc.) with overlapping but distinct eligibility/services; eligibility ties to specific diagnosis (physical disability vs. frail elderly) and NFLOC; slot-limited with regional centers; no fixed service hours/dollars—needs-based.
- **Nevada Program of All-Inclusive Care for the Elderly (PACE)**: Newly authorized in Nevada (2025 launch); no operational providers or service areas detailed yet; follows federal PACE model with state-specific NFLOC certification and capitation rates; availability extremely limited geographically
- **Nevada Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB ≤100% FPL, SLMB 100-120%, QI 120-135%); benefits decrease by tier (QMB fullest coverage); statewide but local DWSS offices handle apps; annual FPL adjustments; QI funding-capped.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled special rules: gross income optional (net + assets instead); Nevada broadens federal limits to 200% FPL gross; heavy deductions for shelter/medical scale benefits by net income/household size; statewide but local offices handle.
- **Nevada Energy Assistance Program (EAP) / LIHEAP**: Benefits scale by household size and fuel type. Program availability varies by season (heating in fall/winter only; no cooling assistance). Income limits vary by program year and household size. Funding is not guaranteed and varies by local demand and timing of application. No age requirement specified, making this accessible for elderly individuals regardless of age. Asset limits do not apply, which is favorable for applicants with savings.
- **Weatherization Assistance Program**: Statewide via regional subgrantees with varying income thresholds (150-200% FPL), priority tiers, and document requirements; benefits audit-based, not fixed dollar amounts.
- **Nevada State Health Insurance Assistance Program (SHIP)**: This program is a counseling and advocacy service, not a financial assistance or insurance program. No income limits, asset limits, or formal eligibility criteria are documented in available sources. Benefits are standardized statewide with no tiered structure. The program operates through a distributed network of volunteers and community partners rather than centralized offices. Key limitation: search results do not contain specific information about processing times, application forms, required documents, or detailed eligibility criteria — families should contact the program directly at 1-800-307-4444 for these details.
- **Home Delivered Meals**: Decentralized by region/local AAA with statewide OAA and Medicaid waiver specs; no uniform income test or asset limits specified; functional/homebound criteria primary; varies by county/provider
- **Senior Respite Care and Respite Care Vouchers**: County-restricted to Northern Nevada; live-in caregiver mandate; voucher fixed at $1000/year via community grant, not Medicaid entitlement; separate from Medicaid waiver respite with NFLOC[1][2][5][7]
- **Senior Community Service Employment Program (SCSEP)**: Federally mandated but locally administered by grantees (AARP, NAPCA) with state monitoring via ADSD; priority tiers affect access; income at 125% FPL (updates yearly, no table in sources); county-residency restricted by provider
- **Nevada Advocates for Seniors**: Private care management service, not a public benefits program with income/asset tests or waitlists; data limited to service descriptions without eligibility details or application specifics
- **Nevada Long-Term Care Ombudsman Program**: no income test; facility-resident only; consent-driven; statewide with regional offices; free advocacy service under Older Americans Act
- **Nevada Senior Rx Program**: Program was tied to Medicare Part D enrollment (implemented January 1, 2006), creating a wrap-around benefit structure. Income limits scaled by household size (singles vs. couples only). No asset test made it more accessible than comparable programs. Program was funded by Tobacco Settlement dollars, making it vulnerable to funding changes. As of May 1, 2006, enrollment was 8,533 members[3].
- **Home and Community-Based Waiver for the Frail Elderly (HCBW-FE)**: Financial limits provided for individuals/couples but no full household size table; NFLOC determined by scored functional deficits (min 3/13); statewide with priority to urgent cases; services require at least monthly use.
- **Nevada Personal Care Services Program (PCS)**: Tied to Medicaid enrollment with functional needs assessment (FASP); self-directed or agency-directed models; regional ADSD offices handle intake; no fixed service hours—assessor-determined; waivers like Physical Disability or Frail Elderly may apply
- **Community Options Program for the Elderly (COPE)**: Statewide with regional offices; income/assets per NAC 427A (call for current); waitlist possible; non-Medicaid bridge to waivers like HCBS FE[1][2][5]
- **Taxi Assistance Program (TAP)**: This program is geographically restricted to Clark County and currently has a funding freeze for new applicants. Benefits are fixed (50% discount on taxi fares via coupon books) rather than scaled. Income eligibility is tied to Federal Poverty Guidelines at 125% threshold, which varies by household size but specific dollar amounts are not provided in available sources. The program operates Monday-Friday only, with no weekend service[6].

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Nevada?
