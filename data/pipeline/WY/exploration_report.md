# Wyoming Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 1.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 15 |
| New (not in our data) | 0 |
| Data discrepancies | 15 |
| Fields our model can't capture | 15 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 14 | Our model has no asset limit fields |
| `regional_variations` | 15 | Program varies by region — our model doesn't capture this |
| `documents_required` | 15 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 9 | Has waitlist info — our model has no wait time field |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **in_kind**: 2 programs
- **advocacy**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Wyoming Medicaid

- **income_limit**: Ours says `$967` → Source says `$2,982` ([source](https://health.wyo.gov/healthcarefin/medicaid/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Long-term care services via three programs: 1) Nursing Home Medicaid (nursing home care); 2) HCBS Waivers (e.g., Assisted Living Waiver, Home Care Waiver for home-based care, adult foster care, assisted living); 3) Aged, Blind, Disabled (ABD) Medicaid (in-home personal care, adult day care, meal delivery, home modifications, PERS - assigned one at a time based on need). Nursing Home makes all benefits available immediately; ABD evaluates needs individually[1][3][5].` ([source](https://health.wyo.gov/healthcarefin/medicaid/))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/healthcarefin/medicaid/`

### Community Choices Waiver (CCW)

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/aging/homecare/community-choices-waiver-ccw/`

### PACE (Program of All-Inclusive Care for the Elderly)

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/ (Wyoming Department of Health; see PACE study PDF) or https://www.npaonline.org/ (National PACE Association)`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,330,` ([source](https://health.wyo.gov/healthcarefin/medicaid/programs-and-eligibility/medicare-savings-program/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copayments for covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only (also auto-qualifies for Extra Help low-income subsidy for Rx drugs). No direct cash; state Medicaid pays providers/Medicare on behalf.[1][2][4][5][6]` ([source](https://health.wyo.gov/healthcarefin/medicaid/programs-and-eligibility/medicare-savings-program/))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/healthcarefin/medicaid/programs-and-eligibility/medicare-savings-program/`

### SNAP (Food Stamps)

- **source_url**: Ours says `MISSING` → Source says `https://dfs.wyo.gov/assistance-programs/food-assistance/supplemental-nutrition-assistance-program-snap`

### Wyoming Energy Assistance (LIHEAP)

- **income_limit**: Ours says `$3092` → Source says `$2,985` ([source](https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating assistance: $49 minimum to $2,176 maximum per season (typical $200-$1,000), paid directly to utility/fuel vendors (natural gas, oil, propane, electricity, wood, pellets, coal). Crisis assistance: up to $550 for emergencies (utility shutoff, empty fuel tanks, broken equipment). No cooling assistance. Weatherization services available separately for efficiency upgrades.` ([source](https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/`

### Weatherization Assistance Program (WAP)

- **source_url**: Ours says `MISSING` → Source says `https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/weatherization-assistance-program-wap-2/`

### Wyoming State Health Insurance Information Program (WSHIIP/SHIP)

- **source_url**: Ours says `MISSING` → Source says `https://www.wyomingseniors.com/services/wyoming-state-health-insurance-information-program[4]`

### Meals on Wheels (via Title III-B Support Services)

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov (Wyoming Department of Health, Aging Division, Community Living Section)`

### National Family Caregiver Support Program

- **min_age**: Ours says `60` → Source says `18` ([source](https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/[1]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite support (temporary breaks from caregiving, using Senior Companion volunteers or trained respite workers); support groups; specific needed services; information about available services; individual counseling; light housekeeping for clean/safe environment; prompting for activities of daily living[1][2][5]` ([source](https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/[1]))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/[1]`

### Senior Community Service Employment Program (SCSEP)

- **source_url**: Ours says `MISSING` → Source says `https://dws.wyo.gov/dws-division/workforce-center-program-operations/programs/senior-community-service-employment-program/`

### Legal Assistance for Seniors (via Wyoming Senior Services Board)

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/aging/wssb/`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints and problems including care quality, billing/charges, Medicare/Medicaid benefits, transfers/discharges, rights violations; investigation of issues; recommendations for facility improvements; assistance finding services; training/resources for providers. No financial aid, hours, or dollar amounts provided—purely representational support[1][2][3][4]` ([source](https://health.wyo.gov/admin/long-term-care-ombudsman-program/[3]))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/admin/long-term-care-ombudsman-program/[3]`

### Wyoming Home Services Program

- **min_age**: Ours says `60` → Source says `18` ([source](https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Specific in-home services including: Personal care (assistance with eating, dressing, bathing, toileting, transferring, walking); Homemaker services (meal prep, shopping, money management, phone use, light housework); Chore services (heavy housework, yard work, sidewalk maintenance); Respite care (temporary relief for caregivers); Home modification (minor adaptations to facilitate home living). Tailored to individual service plan; no fixed dollar amounts or hours per week specified.[1][6][7]` ([source](https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/))
- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/`

### Wyoming Senior Companion Program

- **source_url**: Ours says `MISSING` → Source says `https://health.wyo.gov/ (Wyoming Dept. of Health references program); https://www.volunteerwyoming.org/agency/detail/?agency_id=12577 (Wyoming Senior Citizens, Inc.)`

## Program Details

### Wyoming Medicaid


**Eligibility:**
- Age: 65+
- Income: For long-term care programs in 2026 (Nursing Home Medicaid): Single applicant: under $2,982/month. Earlier 2025/2024 figures: $3,021/month or $2,829/month for singles; married couples (both applying): $5,658/month combined. Excess income can qualify via Qualified Income Trust (Miller Trust). All income sources counted (Social Security, pensions, etc.). Varies slightly by source year and program[1][2][4].
- Assets: Countable assets: $2,000 for single applicants; $3,000 for married couples if both need care. Exempt: One home (equity under $602,000 if intent to return or spouse/child under 21/disabled dependent lives there), one vehicle (for medical/employment), household goods/personal effects, irrevocable burial trusts up to $1,800. 60-month look-back period for asset transfers[1][2][5].
- Wyoming resident and U.S. citizen or qualified immigrant (5+ years residency)
- Nursing Facility Level of Care (NFLOC) for Nursing Home Medicaid and waivers; functional need in ADLs for regular Medicaid long-term services
- Medical assessment via LT101 screening by county public health nurse (higher score indicates greater need)
- Blind or disabled if under 65

**Benefits:** Long-term care services via three programs: 1) Nursing Home Medicaid (nursing home care); 2) HCBS Waivers (e.g., Assisted Living Waiver, Home Care Waiver for home-based care, adult foster care, assisted living); 3) Aged, Blind, Disabled (ABD) Medicaid (in-home personal care, adult day care, meal delivery, home modifications, PERS - assigned one at a time based on need). Nursing Home makes all benefits available immediately; ABD evaluates needs individually[1][3][5].
- Varies by: priority_tier

**How to apply:**
- Online: health.wyo.gov (Wyoming Medicaid portal)
- Phone: Local county Department of Health office or state helpline (specific numbers via county public health)
- Mail/In-person: County public health nursing office for LT101 assessment and application

**Timeline:** Not specified in sources; straightforward process but involves medical assessment scheduling[4][7].

**Watch out for:**
- Income-cap state: Must use Qualified Income Trust for excess income over limit[2]
- 60-month look-back penalizes improper asset transfers[2]
- ABD Medicaid benefits assigned one-by-one based on assessed need, not all at once like Nursing Home[5]
- Wyoming not ACA-expanded: Limited coverage for non-elderly adults without children[6]
- All income sources counted, including gifts/support[3]
- Medical need proven via county-specific LT101 screening[3]

**Data shape:** Income/asset limits vary slightly by year/source (2024-2026) and program (Nursing Home vs. waivers vs. ABD); eligibility requires both financial criteria and county-assessed NFLOC/LT101; benefits tiered by care level with QIT option for income overages; county-level assessments introduce regional process variations

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/healthcarefin/medicaid/

---

### Community Choices Waiver (CCW)


**Eligibility:**
- Age: 65 years or older, or 19-64 years old with a disability (verified by SSA or Department using SSA criteria)+
- Income: Must be eligible for Wyoming Medicaid or qualify under Special HCBS Waiver Group: gross monthly income at or below 300% of Federal Benefit Rate (FBR), approximately $2,313 (as of available data; may vary annually). Individuals above this may qualify via Income Trust. Exact limits change annually; check WY Dept of Health. No full household size table specified—based on individual income.
- Assets: Limited countable resources required for Special HCBS Waiver Group (specific dollar amounts not detailed in sources; typically aligns with Medicaid standards). What counts: generally non-exempt assets like bank accounts. Exempt: primary home (under certain equity limits), one vehicle, personal belongings, burial funds (standard Medicaid exemptions apply).
- Wyoming resident
- U.S. citizenship/qualified immigration status
- Nursing Facility Level of Care (NFLOC) determined by public health nurse using LT-101 assessment tool (need for nursing home level care in community)
- Medicaid-eligible or qualify via Special HCBS Waiver Group

**Benefits:** Home and Community-Based Services (HCBS) including adult day services, case management, homemaker, home health aide, personal support services, respite care. Delivered via Participant-Directed Care or Agency-Directed Care models. No fixed dollar amounts or hours specified; services scaled to meet NFLOC needs in home or assisted living.
- Varies by: priority_tier

**How to apply:**
- Contact Benefits & Eligibility Specialist in your county
- Phone: WY Medicaid Customer Service Center at 855-294-2127
- Online: Application for Health Coverage & Help Paying Costs
- Submit CCW Program Application (CCW Form 01)
- In-person: County Benefits & Eligibility office; select case management agency from county provider list

**Timeline:** Not specified; functional assessment and level of care determination required prior to enrollment, reassessed annually
**Waitlist:** Not an entitlement program; capped at ~3,669 participants. Waitlist possible; priority by eligibility determination date

**Watch out for:**
- Not an entitlement—waitlist common due to enrollment cap (~3,669); apply early
- Must first qualify for Medicaid or Special HCBS Waiver Group; income over ~$2,313 requires Income Trust
- NFLOC assessment via LT-101 tool mandatory; denial if not met
- Must choose case management agency from county list during application
- Limits change annually—verify current income/asset thresholds with WY DOH
- Disabled participants (19-64) can continue as 'aged' after 65

**Data shape:** Requires Medicaid eligibility first; Special HCBS Waiver Group for higher incomes via Income Trust; county-specific case management providers; waitlisted with priority by eligibility date; NFLOC via LT-101 assessment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/aging/homecare/community-choices-waiver-ccw/

---

### PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No income limits for PACE enrollment itself. However, for full coverage without premiums (typical for 90% of participants), dual eligibility for Medicare and Medicaid is required. Wyoming Medicaid for nursing home level of care (relevant for PACE NFLOC certification) has 2026 limits of $2,982/month income and $2,000 assets for a single applicant; limits vary by household size but PACE has no direct financial criteria.[1][4][5]
- Assets: No asset limits for PACE enrollment. For Medicaid (to avoid premiums), Wyoming counts assets under $2,000 for single nursing home applicants (house and one car typically exempt); PACE does not consider financial criteria directly.[1][4]
- Live in the service area of a PACE organization (currently none operating statewide in Wyoming as of 2021 closure).
- Certified by Wyoming as needing nursing home level of care (NFLOC).
- Able to live safely in the community with PACE services.
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice.

**Benefits:** Comprehensive, capitated coverage including primary care, hospital and emergency care, prescription drugs, social services, restorative therapies, personal care, respite care, transportation, meals (including home-delivered), adult day health care, home health, and all Medicare/Medicaid-covered services; no deductibles or copays for enrollees. Exact hours/services individualized via interdisciplinary team; funded by fixed monthly capitation from Medicare/Medicaid (private pay for non-Medicaid portion if applicable).[1][3][5][7]
- Varies by: region

**How to apply:**
- Contact local PACE provider (none currently operating in Wyoming).
- Wyoming state Medicaid office or Medicare at 1-800-633-4227.
- National PACE Association to find programs (no Wyoming listings post-2021).

**Timeline:** Not specified; varies by program if available.
**Waitlist:** Common for available programs; previously existed in Wyoming.[2]

**Watch out for:**
- No active PACE programs in Wyoming since 2021 closure; families cannot currently enroll.
- Must live in tiny service area (previously just Cheyenne); not statewide.
- NFLOC certification required via Wyoming Medicaid process, which has strict income/asset rules for free coverage.
- Private pay for non-Medicaid portion can exceed $7,000/month if not dual-eligible.
- Cannot be in Medicare Advantage or hospice; disenrollment from those needed.
- Waitlists common even where available.

**Data shape:** No active programs in Wyoming (closed 2021); eligibility tied to non-existent service areas; free only for Medicaid dual-eligibles with NFLOC; previously single-provider in Cheyenne only.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/ (Wyoming Department of Health; see PACE study PDF) or https://www.npaonline.org/ (National PACE Association)

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Monthly income limits effective April 1 (based on Federal Poverty Level, updated annually). Wyoming-specific for 2026 (from WY Dept of Health): QMB (100% FPL): 1-person $1,330, 2-person $1,804; SLMB (120% FPL): 1-person $1,596, 2-person $2,164; QI (135% FPL): 1-person $1,796, 2-person $2,435. Federal 2026 standards (with $20 disregard): QMB 1-person $1,350/2-person $1,824; SLMB 1-person $1,616/2-person $2,184. Must be entitled to Medicare Part A. Household size applies (e.g., family size in table).[1][4][5][6]
- Assets: Countable resources ≤ 3x SSI limit (WY regulation): ~$9,950 individual / $14,910 couple (2026 federal/WY-aligned figures). Counts typical SSI resources (bank accounts, stocks); exempts primary home, one vehicle, personal belongings, life insurance, burial funds up to limits (state follows federal SSI exclusions).[3][4][5][6]
- Entitled to Medicare Part A (even if not enrolled)
- Wyoming resident
- U.S. citizen or qualified immigrant
- Not eligible for full Medicaid (income above Medicaid thresholds)

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copayments for covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only (also auto-qualifies for Extra Help low-income subsidy for Rx drugs). No direct cash; state Medicaid pays providers/Medicare on behalf.[1][2][4][5][6]
- Varies by: program_tier

**How to apply:**
- Online: Wyoming Medicaid portal at health.wyo.gov/healthcarefin/medicaid/apply/
- Phone: Wyoming Medicaid Helpline 1-855-294-7810 or local county DHS office
- Mail: Submit to local Department of Family Services (DFS) office (find via health.wyo.gov)
- In-person: Local county DFS office (statewide locations listed on health.wyo.gov/healthcarefin/medicaid)

**Timeline:** QMB: Up to 45 days (effective first of month after complete info). SLMB/QI: Up to 45 days, retroactive up to 3 months prior.[2]
**Waitlist:** QI has first-come-first-served with priority to prior-year recipients; potential waitlist if funds exhausted (federal funding cap).[2][6]

**Watch out for:**
- Income limits update April 1 annually; use WY-specific table, not generic federal[1]
- QI is first-come-first-served with funding caps—apply early in fiscal year; must reapply yearly[2][6]
- QMB status means providers can't charge copays (federal protection, but inform providers)[2]
- Assets follow SSI rules—many forget to exclude home/car/burial plots[4][6]
- Must have Part A entitlement; doesn't cover Part D premiums directly (QI gets Extra Help)[2][5]
- Not full Medicaid—only Medicare cost-sharing help[4]

**Data shape:** Tiered by program (QMB/SLMB/QI) with income brackets as % FPL; household size scaling; asset test at 3x SSI; QI funding-limited/priority-based; statewide but county-processed.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/healthcarefin/medicaid/programs-and-eligibility/medicare-savings-program/

---

### SNAP (Food Stamps)


**Eligibility:**
- Income: Households with an elderly (60+) or disabled member have no gross income limit in Wyoming; only net income limits apply (e.g., for FY2026 Oct 1, 2025–Sept 30, 2026, net income must be below 100% FPL, such as ~$1,255/month for 1 person or ~$1,704 for 2; exact table at dfs.wyo.gov varies by household size). All households must pass net income test after deductions (20% earned income, standard $177–$246 by size, medical >$35 for elderly/disabled, shelter unlimited for elderly/disabled up to $569 otherwise, dependent care, child support). Gross income limit 130% FPL for non-elderly/disabled (~$1,632/1 person); 165% for some. Social Security, pensions count as income.[2][3][4][7]
- Assets: Countable resources (bank accounts, cash): $4,500 if household has member 60+ or disabled; $3,000 otherwise (some sources note $3,750 or $2,500—use official $4,500/$3,000). Exempt: home, vehicles, SSI recipients or POWER/Tribal TANF households fully exempt. Residency: Wyoming resident, apply in own county. U.S. citizen or qualified non-citizen.[1][2][3]
- Must live in Wyoming and apply in county of residence
- Work requirements exempt for 60+, disabled, or unfit (verified by disability benefits, medical pro, etc.)
- Household includes those who buy/prepare food together

**Benefits:** Monthly EBT card for food purchases at authorized retailers; amount based on net income, household size, deductions (e.g., max allotment for 2-person elderly/disabled: ~$546, minus 30% net income). Exact varies; use calculator for estimate.
- Varies by: household_size

**How to apply:**
- Online: dfs.wyo.gov/assistance-programs/food-assistance (My Wyoming portal)
- Phone: Local county DFS office (find at dfs.wyo.gov/field-offices)
- Mail/In-person: County Department of Family Services office where you reside
- Apply in county of residence

**Timeline:** Typically 30 days; expedited if very low income (<$150 earned/$100 cash, assets <$100) within 7 days.

**Watch out for:**
- Elderly/disabled: no gross income limit but still net test + assets; shelter deduction unlimited (key for high medical/housing costs)
- Assets exempt for SSI/POWER recipients—often missed
- Household must include food-sharing members, even non-applicants
- Medical deductions >$35/month critical for seniors
- County-specific application required, not statewide office
- Social Security/pensions count as income
- No gross limit doesn't mean automatic qualify—net calc complex

**Data shape:** Elderly/disabled exemptions (no gross income limit, higher $4,500 assets, unlimited shelter deduction); county-administered with uniform state rules; benefits scale by household size/net income after senior-friendly deductions

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfs.wyo.gov/assistance-programs/food-assistance/supplemental-nutrition-assistance-program-snap

---

### Wyoming Energy Assistance (LIHEAP)


**Eligibility:**
- Income: Gross monthly household income at or below 60% of Wyoming state median income (equivalent to 150% Federal Poverty Level, whichever higher). Specific limits: 1 person $2,985/month; 2 people $3,904/month; 3 people $4,823/month; 4 people $5,741/month; 5 people $6,660/month; 6 people $7,579/month. Annual examples: 2-person household ≤$46,000; 4-person household ≤$68,902. SSI/SNAP recipients may qualify automatically. Priority for elderly (60+), disabled, or children under 6.
- Assets: No asset limits mentioned in program requirements.
- Responsible for home energy costs (homeowners, renters, permanently parked RVs).
- U.S. citizen or eligible immigration status.
- Household includes all at address sharing utility bill.

**Benefits:** Heating assistance: $49 minimum to $2,176 maximum per season (typical $200-$1,000), paid directly to utility/fuel vendors (natural gas, oil, propane, electricity, wood, pellets, coal). Crisis assistance: up to $550 for emergencies (utility shutoff, empty fuel tanks, broken equipment). No cooling assistance. Weatherization services available separately for efficiency upgrades.
- Varies by: household_size|income|fuel_type|priority_tier

**How to apply:**
- Online: lieapwyo.org
- Phone: 1-800-246-4221 (callback system holds place in line)
- Local: Community Action Agency, Area Agency on Aging, or state LIEAP office (phone/mail/in-person for elderly/disabled)

**Timeline:** Payments start Oct. 1 for crisis/disconnection cases; unregulated fuels after Oct. 1. Varies by application volume.
**Waitlist:** Higher-than-normal applications reported; phone callback system manages demand.

**Watch out for:**
- Priority application window until Oct. 1 for elderly 60+, disabled, young children; general applications Oct. 1-April 30 only.
- Heating season focus (Oct-April 2026); no routine cooling assistance.
- Crisis requires immediate emergency proof (shutoff notice, empty tank).
- High application volume causes delays; use callback phone feature.
- Roommates on same utility bill count as one household.
- Federal funds cap at 60% state median income.

**Data shape:** Income based on 60% Wyoming state median (varies by household size, listed monthly); priority tiers for elderly/disabled/young kids with early application window; crisis separate from regular heating; statewide but local agency processing; season-limited (2025-2026: now open until April 30, 2026)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/

---

### Weatherization Assistance Program (WAP)


**Eligibility:**
- Income: Up to 200% of the Federal Poverty Level (FPL)[1]. However, federal law restricts federal funds to households earning 60% or less of statewide median income (approximately $33,600 for a family of four as of 2005)[4]. Wyoming offers a state supplement for those earning up to 185% of FPL[4]. Automatic income eligibility: Participants in SNAP, SSI, or TANF automatically meet income requirements[1].
- Assets: Not specified in available sources
- Wyoming resident[1]
- Legal owner of residence OR renter with written landlord permission[1]
- Must live in residence during program year, heating and water season[2]
- Residence must not be expected to be offered for sale or rent within 12 months[2]
- Residence cannot have already received weatherization assistance from a Department of Energy program[2]
- Renters must complete and submit rental agreement with application[1]

**Benefits:** Home energy improvements provided at no cost, including insulation, sealing leaks around doors and windows, basic health and safety checks, and heating system repairs/replacements[1][6]. Can save 5-25% on home heating bills[1]. Up to $4,000 available per household for weatherization improvements[4].
- Varies by: priority_tier

**How to apply:**
- Online: Applications accepted year-round at lieapwyo.org[1][6]
- Phone: 1-800-246-4221[1][5][6]
- Regional agency contact: Johnson County example: 307-686-2730[5]

**Timeline:** Application processing begins October 1st annually. LIEAP deadline is February 28th. WAP consideration available year-round[2]. Crisis applications (lost heat, insufficient fuel, impending disconnection) are expedited with response times varying by situation[6].
**Waitlist:** Approval for LIEAP/WAP does not guarantee weatherization services will be received that year; services based on priority point system[1][2]. Waiting list exists for weatherization benefits[4].

**Watch out for:**
- Approval does NOT guarantee services: Priority given to elderly, disabled, and homes with children under five[1]. Approval is based on a priority point system, not first-come-first-served[1].
- Renters face additional barriers: Must obtain written landlord permission and submit rental agreement; landlord restrictions apply[1].
- Income limits are complex: Federal funds capped at 60% of statewide median income, but state supplement extends to 185% FPL[4]. Automatic eligibility through SNAP/SSI/TANF bypasses income verification[1].
- 12-month restriction: Home cannot be listed for sale or rent within 12 months of receiving services[2].
- No double-dipping: Residence cannot have received prior DOE weatherization assistance[2].
- Crisis assistance deadline: As of 2025, crisis and prevention assistance available until April 15, 2025, with possible extension for severe weather[6].
- Comprehensive energy audit required: Once approved, a weatherization agency will contact applicant to schedule audit before work begins[1].

**Data shape:** WAP is administered jointly with LIEAP (Low-Income Energy Assistance Program) through a single application. Benefits are service-based (in-kind home improvements) rather than cash assistance. Priority allocation system means approval does not equal service delivery. Program operates on federal and state funding with 50% company leverage in some cases[3]. Eligibility is income-based with automatic qualification for certain benefit program participants. Renters and homeowners eligible but renters face additional documentation requirements.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfs.wyo.gov/assistance-programs/home-utilities-energy-assistance/weatherization-assistance-program-wap-2/

---

### Wyoming State Health Insurance Information Program (WSHIIP/SHIP)


**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all Medicare beneficiaries, families, and caregivers[1][2]
- Assets: No asset limits or tests apply[2][5]
- Must be a Medicare beneficiary, family member, or caregiver; no other restrictions specified[1][2][4]

**Benefits:** Free one-on-one health insurance counseling, information and printed materials, referrals to agencies; covers Medicare Parts A/B/D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, fraud prevention; unbiased, confidential assistance to understand benefits, compare options, resolve issues[1][4][6]

**How to apply:**
- Phone: 1-800-856-4398 (toll-free) or (307) 856-6880[4][7][8]
- Website: www.wyomingseniors.com[4][7]
- In-person: Contact via phone for local volunteer counselors in almost every county[4]
- Mail/In-person address: Wyoming Dept of Insurance, 106 West Adams Ave, Riverton WY 82501[3]

**Timeline:** No formal processing; services provided via appointment scheduling upon contact[1][4]

**Watch out for:**
- Not a financial aid or healthcare payment program—only free counseling and education, no direct benefits or payments; people may confuse it with Medicare Savings Programs it helps apply for; services rely on volunteers, so availability depends on local counselors; must be Medicare-related[1][2][6]

**Data shape:** no income/asset test; volunteer-driven network covering nearly all counties; counseling-only, not benefits-paying; prioritizes limited-income and under-65 disabled but open to all Medicare households[2][4]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.wyomingseniors.com/services/wyoming-state-health-insurance-information-program[4]

---

### Meals on Wheels (via Title III-B Support Services)


**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Title III-B emphasizes serving 'economically and socially vulnerable older adults' but does not establish explicit income thresholds.[2] Individual programs may have their own contribution-based assessments rather than income cutoffs.
- Assets: Not specified in available sources.
- Must be homebound or geographically isolated[4]
- Spouse of eligible participant (60+) may qualify if receipt of meals is in their best interest[4]
- Disabled persons under age 60 who reside with eligible participants may qualify[4]
- Participation in Medicaid Waiver program may establish eligibility[3]
- Must reside within a designated delivery zone/service area[1]

**Benefits:** Home-delivered meals meeting nutritional standards (33.33% to 100% of Dietary Reference Intakes depending on meal count)[4]. Suggested contribution is $4.25 per meal in some areas, but no eligible senior will be denied meals due to inability to contribute.[3][5]
- Varies by: region

**How to apply:**
- Phone: Contact local Area Agency on Aging[1]
- Phone (Natrona County/Casper): 307-635-5542[5]
- Phone (Cheyenne): 307-635-5542[5]
- Mail: Complete Client Application and mail to local provider[5]
- In-person: Visit local Meals on Wheels office[5]
- Alternative route: Apply through Long Term Community Choice Waiver at 855-203-2936 or 855-203-2823[5]

**Timeline:** Varies by program. Some process within one week; others have longer timelines if a waiting list exists.[1] Waiver applications typically approved or denied within 45 days.[5]
**Waitlist:** Possible in some areas; not universally documented.[1]

**Watch out for:**
- No explicit income limits published: While Title III-B targets economically vulnerable seniors, there are no stated income thresholds. Programs use contribution-based assessments instead, meaning eligibility is not automatically denied based on income.[2][3]
- Homebound status is mandatory and reassessed: You must be homebound or geographically isolated to qualify. If you are no longer homebound, you may be referred to congregate meals instead. Eligibility is evaluated at least annually.[4]
- Delivery zone is a hard boundary: Living outside a service area disqualifies you entirely. Verify your address is in a delivery zone before applying.[1]
- Spouses and disabled dependents have conditional eligibility: A spouse or disabled person under 60 can qualify only if living with an eligible senior and if receipt of meals is in their best interest—not automatic.[4]
- Medicaid Waiver is a separate application path: You can apply through the Long Term Community Choice Waiver (855-203-2936) as an alternative route, but this is a different process than direct Meals on Wheels application.[5]
- No income-based denial: Despite economic vulnerability language, no eligible senior will be denied meals due to inability to contribute.[3]
- Temporary incapacity waives assessment: If temporarily incapacitated at home, the assessment requirement may be waived, but receipt of meals for more than 30 days requires reassessment of homebound status.[4]

**Data shape:** Title III-B is a decentralized program administered through 23 county-based service areas in Wyoming, each with its own provider and potentially different eligibility interpretation. The program emphasizes contribution-based rather than income-based eligibility, meaning families should expect individualized financial assessments rather than published income cutoffs. Homebound status is the critical gating factor and is subject to annual review. Benefits are in-kind (meals) rather than cash, and the program explicitly guarantees no denial based on inability to pay. Regional variation is significant; contact the local Area Agency on Aging for your county for definitive eligibility and application details.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov (Wyoming Department of Health, Aging Division, Community Living Section)

---

### National Family Caregiver Support Program


**Eligibility:**
- Age: 18+
- Income: No income limits specified in Wyoming program guidelines[1][3]
- Assets: No asset limits specified; no information on what counts or exemptions[1][3]
- Caregiver must be providing care to individuals age 60 and older[1][3]
- Caregiver providing care to individuals of any age with Alzheimer’s disease or related dementia[1][3][4]
- In Johnson, Laramie, and Sheridan counties: Older relative caregivers age 55+ caring for grandchildren or related children 17 and younger, or adults 18-59 with a disability; also parents age 55+ of adults 18-59 with a disability[1]
- Care recipient must generally be frail, unable to perform at least 2 ADLs or 2 IADLs, or require substantial supervision due to cognitive/mental impairment (for respite/supplemental services)[2][3]
- Non-citizens eligible regardless of status[3]

**Benefits:** Respite support (temporary breaks from caregiving, using Senior Companion volunteers or trained respite workers); support groups; specific needed services; information about available services; individual counseling; light housekeeping for clean/safe environment; prompting for activities of daily living[1][2][5]
- Varies by: region

**How to apply:**
- Contact Wyoming Department of Health Aging Division (specific phone not listed; use Wyoming 2-1-1 or toll-free helpline for local resources)[7]
- Visit https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/ for information and county availability[1]
- Contact local providers such as Wyoming Senior Citizens, Inc. for served counties (Natrona, Laramie, Carbon, Goshen, Big Horn, Fremont, Converse, Hot Springs, Washakie)[2]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified; potential regional variations implied but not detailed

**Watch out for:**
- Not available statewide—check county eligibility first (excluded in 7 counties)[1]
- No mention of payment to family caregivers; focuses on respite/services, not direct financial compensation[1][2]
- Relative caregiver options limited to specific counties (Johnson, Laramie, Sheridan)[1]
- Care recipient must meet frailty criteria for certain services like respite[3]
- No income/asset tests, but priority may go to those with greatest social/economic need[2][4]

**Data shape:** County-restricted availability (missing 7 counties); no income/asset tests; benefits are non-financial services via local providers; relative caregiver support varies by county; delivered through Older Americans Act funding with local grantees[1][2][3]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/aging/communityliving/older-americans-act-programs/nfcp/[1]

---

### Senior Community Service Employment Program (SCSEP)


**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually by the U.S. Department of Health and Human Services; families must contact the local office for the current year's table as specific figures are not listed in sources.
- Unemployed
- Resident of Wyoming (statewide or specific counties depending on provider)
- U.S. citizen or authorized to work
- Poor employment prospects (program goal)

**Benefits:** Paid part-time community service work training (average 20 hours per week) at the highest of federal, state, or local minimum wage; job placement assistance, resume help, interview skills, and support to transition to unsubsidized employment; training typically lasts 6-12 months.
- Varies by: priority_tier

**How to apply:**
- Phone: (307) 251-1750, (307) 475-6198 (statewide), (307) 473-3968 (Casper/Natrona area)
- In-person: 444 West Collins Drive, Casper, WY 82601 (for Natrona and surrounding counties)
- Email: dws.wyo.gov contact
- Text or call via Wyoming 211
- Website: https://dws.wyo.gov/dws-division/workforce-center-program-operations/programs/senior-community-service-employment-program/

**Waitlist:** Space is limited; waiting lists likely due to limited slots

**Watch out for:**
- Not available statewide uniformly—must confirm county coverage and provider; limited slots lead to waitlists; priority given to veterans/qualified spouses, then over 65, disabled, rural residents, homeless/at-risk, low literacy, limited English, low prospects, or American Job Center users; income is family-based at 125% FPL (stricter than some programs); goal is bridge to unsubsidized work, not long-term employment; must be unemployed and actively seeking transition.

**Data shape:** County-specific providers with limited slots; priority enrollment tiers; income at 125% FPL family basis; not fully statewide uniform operations despite 23-county coverage claim.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dws.wyo.gov/dws-division/workforce-center-program-operations/programs/senior-community-service-employment-program/

---

### Legal Assistance for Seniors (via Wyoming Senior Services Board)


**Eligibility:**
- Age: 60+
- Income: Must qualify based on low-income criteria of Legal Aid of Wyoming; specific dollar amounts or household size tables not detailed in sources. Providers may consider additional factors like assets, citizenship, or military status.
- Assets: Not specified; eligibility screening by Legal Aid of Wyoming may include assets as an additional factor.
- Low-income status as determined by Legal Aid of Wyoming screening
- Civil legal matters only
- Seniors 60 years or older

**Benefits:** Free civil legal services (e.g., wills/estates, bankruptcy) or referral to provider-developed legal network for affordable legal services; funded via state matching for maintenance of effort.

**How to apply:**
- Online application and screening at Legal Aid of Wyoming (lawyoming.org)
- Phone hotline screening via Legal Aid of Wyoming
- Schedule appointment with hotline attorney online 24/7

**Timeline:** Not specified

**Watch out for:**
- Civil legal services only (no criminal matters)
- Must pass Legal Aid of Wyoming's income screening; those slightly above may qualify for Modest Means Program instead
- Funds support free services or affordable referrals, not guaranteed full representation
- Apply directly with Legal Aid, as WSSB provides funding rather than direct services

**Data shape:** WSSB contracts with Legal Aid of Wyoming to fund services; eligibility driven by Legal Aid's low-income criteria rather than fixed state table; no asset details or processing times published

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/aging/wssb/

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all recipients of long-term care services regardless of financial status[1][2][3]
- Assets: No asset limits; no financial tests apply[1][2][3]
- Must be a recipient of long-term care services in covered settings (nursing homes, assisted living, boarding homes, adult day care, congregate housing, senior in-home care, home care, hospice); or family member, resident, or anyone with concerns about such services. No age requirement for recipients, but volunteers must be 18+[1][2][3][4][6]

**Benefits:** Advocacy to resolve complaints and problems including care quality, billing/charges, Medicare/Medicaid benefits, transfers/discharges, rights violations; investigation of issues; recommendations for facility improvements; assistance finding services; training/resources for providers. No financial aid, hours, or dollar amounts provided—purely representational support[1][2][3][4]

**How to apply:**
- Phone: State Ombudsman (307) 777-2885[2]; Regional - Riverton area (Big Horn, Washakie, Park, Hot Springs, Teton, Fremont, Sublette, Lincoln, Uinta): 307-856-6880 or 1-800-856-4398; Cheyenne area (Crook, Weston, Niobrara, Goshen, Platte, Laramie, Albany, Carbon, Sweetwater): 307-634-1010 or 1-877-634-1005[3]
- Email: ember.lucas@wyo.gov (Riverton region); nicholas.wiseman@wyo.gov (Cheyenne region)[3]
- Mail/In-person: State - 2300 Capitol Ave, 4th floor, Cheyenne, WY 82002[2]; Riverton Regional - 106 E. Adams Ave, Riverton, WY 82501[3]; Cheyenne Regional - 3120 Old Faithful Road, Suite 200, Cheyenne, WY 82001[3]
- Website: https://health.wyo.gov/admin/long-term-care-ombudsman-program/[2][3]

**Timeline:** Immediate response to complaints/concerns; no formal processing as it's not an enrollment-based benefit program[1][2][3][4]

**Watch out for:**
- Not a benefits/enrollment program—no financial aid, healthcare services, or eligibility tests; purely for advocacy/complaint resolution[1][2][3]
- Anyone can contact (residents, families, providers, public)—no 'qualification' to receive help[2]
- Volunteers have separate certification (age 18+, training, background check)—confused with recipient eligibility[1]
- Covers specific settings (nursing homes, assisted living, etc.); confirm if home care qualifies under Wyoming's scope[2][6]
- State-mandated under Older Americans Act; report directly to regional ombudsman for fastest local response[1][3]

**Data shape:** no income test; advocacy-only (no services/funds); regional contacts via nonprofit contractor; open to public/family without enrollment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/admin/long-term-care-ombudsman-program/[3]

---

### Wyoming Home Services Program


**Eligibility:**
- Age: 18+
- Income: No specific income or asset limits mentioned in program documents; financial eligibility not detailed as a barrier. Appears needs-based without dollar thresholds, unlike Medicaid programs.[1][7][8]
- Assets: No asset limits specified; no mention of countable assets or exemptions.[1][7][8]
- At risk of premature institutionalization, determined through ongoing evaluation.
- Needs in at least 2 areas on Activities of Daily Living (ADL) or Instrumental Activities of Daily Living (IADL) scales (e.g., eating, bathing, housework, shopping).
- Exceptions possible if services needed to prevent inappropriate institutional placement even without meeting the 2-area threshold.[1]

**Benefits:** Specific in-home services including: Personal care (assistance with eating, dressing, bathing, toileting, transferring, walking); Homemaker services (meal prep, shopping, money management, phone use, light housework); Chore services (heavy housework, yard work, sidewalk maintenance); Respite care (temporary relief for caregivers); Home modification (minor adaptations to facilitate home living). Tailored to individual service plan; no fixed dollar amounts or hours per week specified.[1][6][7]
- Varies by: priority_tier

**How to apply:**
- Contact local provider: One provider per county (e.g., Campbell County Senior Center In-Home Department; Wyoming Senior Citizens Inc. for Albany/Fremont/Park Counties). Call local senior center or aging office.[5][6]
- No statewide online application, phone number, or mail address specified; apply via county-specific Access Care Coordinator (ACC).[1][5]

**Timeline:** Services begin after Service Plan finalized and scheduling; ACC meets every 90 days for ongoing coordination. No exact processing timeline given.[5]
**Waitlist:** Not mentioned; may vary by county provider capacity.[1]

**Watch out for:**
- Not Medicaid-funded; state grant program with no income/asset tests like Medicaid waivers (e.g., differs from nursing home Medicaid's $2,982/month income limit).[1][2][8]
- Priority to those at risk of institutionalization; not automatic for all 18+ with needs.[1][8]
- Services exclude handling banking, medications, alcohol/tobacco purchases.[8]
- One provider per county—must contact local office, not statewide application.[8]
- Minimum 18 years old, not just seniors (includes disabled adults).[1][7]

**Data shape:** County-administered via single provider per county; needs-based without financial limits; services customized per individual plan with priority for institutionalization risk.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/aging/communityliving/community-living-section-programs/wyhs/

---

### Wyoming Senior Companion Program


**Eligibility:**
- Age: 55+
- Income: Low-income requirement at or below 200% of federal poverty level (specific dollar amounts not listed in sources; past Wyoming reference to under $42,500 annually, but confirm current levels as they vary by household size and year). Income counted from all sources over past 12 months, including wages, public assistance, pensions, dividends; excludes asset withdrawals, certain medical expenses.[1][2][6]
- Assets: No asset limits mentioned.
- Must be healthy and able to volunteer
- Background check including National Service Criminal History Check (NSCHC)
- For volunteers: available to serve 15-40 hours/week, 5-40 hours possible[3][9]

**Benefits:** Companionship, assistance with daily tasks (shopping, paying bills), friendship, support for frail elderly, disabled adults, terminally ill, or caregivers; volunteers serve 2-4 clients, 15-40 hours/week; volunteer benefits: modest tax-free stipend, transportation reimbursement, meals during service, annual physical, accident/liability insurance, training.[3][6][7]
- Varies by: fixed

**How to apply:**
- Contact Wyoming Senior Citizens, Inc. (statewide provider; specific phone/website not in results, check volunteerwyoming.org or health.wyo.gov for current contacts)
- In-person or mail via regional offices like Wyoming State SCP Riverton[3]
- Volunteer application and income verification form (similar to Senior Companion Application)[1]

**Timeline:** Not specified

**Watch out for:**
- This is a volunteer program for low-income seniors (55+) to help others, not direct aid to elderly clients—families apply to receive volunteer matches, not personal stipends
- Income eligibility strict for volunteers (200% FPL); clients are frail/homebound but no client income/age test specified
- Stipend tax-free but modest; requires background checks and training commitment
- Not paid caregiving—volunteers provide non-medical support only[1][2][3][6]

**Data shape:** Volunteer stipend program matching low-income seniors (55+) as companions to frail elderly/disabled; statewide via Wyoming Senior Citizens Inc.; income-tested for volunteers only (200% FPL, medical deductions); no client eligibility barriers beyond need; ~90 volunteers statewide

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.wyo.gov/ (Wyoming Dept. of Health references program); https://www.volunteerwyoming.org/agency/detail/?agency_id=12577 (Wyoming Senior Citizens, Inc.)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Wyoming Medicaid | benefit | state | deep |
| Community Choices Waiver (CCW) | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP (Food Stamps) | benefit | federal | deep |
| Wyoming Energy Assistance (LIHEAP) | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Wyoming State Health Insurance Informati | resource | federal | simple |
| Meals on Wheels (via Title III-B Support | benefit | federal | medium |
| National Family Caregiver Support Progra | benefit | local | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Seniors (via Wyomin | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Wyoming Home Services Program | benefit | state | deep |
| Wyoming Senior Companion Program | resource | state | simple |

**Types:** {"benefit":10,"resource":4,"employment":1}
**Scopes:** {"state":5,"local":2,"federal":8}
**Complexity:** {"deep":9,"simple":4,"medium":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/WY/drafts.json`.

- **SNAP (Food Stamps)** (benefit) — 4 content sections, 6 FAQs
- **Wyoming Energy Assistance (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 6 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **region**: 3 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|income|fuel_type|priority_tier**: 1 programs
- **not_applicable**: 3 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Wyoming Medicaid**: Income/asset limits vary slightly by year/source (2024-2026) and program (Nursing Home vs. waivers vs. ABD); eligibility requires both financial criteria and county-assessed NFLOC/LT101; benefits tiered by care level with QIT option for income overages; county-level assessments introduce regional process variations
- **Community Choices Waiver (CCW)**: Requires Medicaid eligibility first; Special HCBS Waiver Group for higher incomes via Income Trust; county-specific case management providers; waitlisted with priority by eligibility date; NFLOC via LT-101 assessment
- **PACE (Program of All-Inclusive Care for the Elderly)**: No active programs in Wyoming (closed 2021); eligibility tied to non-existent service areas; free only for Medicaid dual-eligibles with NFLOC; previously single-provider in Cheyenne only.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with income brackets as % FPL; household size scaling; asset test at 3x SSI; QI funding-limited/priority-based; statewide but county-processed.
- **SNAP (Food Stamps)**: Elderly/disabled exemptions (no gross income limit, higher $4,500 assets, unlimited shelter deduction); county-administered with uniform state rules; benefits scale by household size/net income after senior-friendly deductions
- **Wyoming Energy Assistance (LIHEAP)**: Income based on 60% Wyoming state median (varies by household size, listed monthly); priority tiers for elderly/disabled/young kids with early application window; crisis separate from regular heating; statewide but local agency processing; season-limited (2025-2026: now open until April 30, 2026)
- **Weatherization Assistance Program (WAP)**: WAP is administered jointly with LIEAP (Low-Income Energy Assistance Program) through a single application. Benefits are service-based (in-kind home improvements) rather than cash assistance. Priority allocation system means approval does not equal service delivery. Program operates on federal and state funding with 50% company leverage in some cases[3]. Eligibility is income-based with automatic qualification for certain benefit program participants. Renters and homeowners eligible but renters face additional documentation requirements.
- **Wyoming State Health Insurance Information Program (WSHIIP/SHIP)**: no income/asset test; volunteer-driven network covering nearly all counties; counseling-only, not benefits-paying; prioritizes limited-income and under-65 disabled but open to all Medicare households[2][4]
- **Meals on Wheels (via Title III-B Support Services)**: Title III-B is a decentralized program administered through 23 county-based service areas in Wyoming, each with its own provider and potentially different eligibility interpretation. The program emphasizes contribution-based rather than income-based eligibility, meaning families should expect individualized financial assessments rather than published income cutoffs. Homebound status is the critical gating factor and is subject to annual review. Benefits are in-kind (meals) rather than cash, and the program explicitly guarantees no denial based on inability to pay. Regional variation is significant; contact the local Area Agency on Aging for your county for definitive eligibility and application details.
- **National Family Caregiver Support Program**: County-restricted availability (missing 7 counties); no income/asset tests; benefits are non-financial services via local providers; relative caregiver support varies by county; delivered through Older Americans Act funding with local grantees[1][2][3]
- **Senior Community Service Employment Program (SCSEP)**: County-specific providers with limited slots; priority enrollment tiers; income at 125% FPL family basis; not fully statewide uniform operations despite 23-county coverage claim.
- **Legal Assistance for Seniors (via Wyoming Senior Services Board)**: WSSB contracts with Legal Aid of Wyoming to fund services; eligibility driven by Legal Aid's low-income criteria rather than fixed state table; no asset details or processing times published
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only (no services/funds); regional contacts via nonprofit contractor; open to public/family without enrollment
- **Wyoming Home Services Program**: County-administered via single provider per county; needs-based without financial limits; services customized per individual plan with priority for institutionalization risk.
- **Wyoming Senior Companion Program**: Volunteer stipend program matching low-income seniors (55+) as companions to frail elderly/disabled; statewide via Wyoming Senior Citizens Inc.; income-tested for volunteers only (200% FPL, medical deductions); no client eligibility barriers beyond need; ~90 volunteers statewide

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Wyoming?
