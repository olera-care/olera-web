# Massachusetts Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 9.9m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 16 |
| New (not in our data) | 12 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 4 programs
- **service**: 10 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Frail Elder Waiver (FEW)

- **min_age**: Ours says `60` → Source says `60-64 with a disability, or 65+` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants))
- **income_limit**: Ours says `$2901` → Source says `$2,199` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) including home care, supports for basic to intensive needs (specifics like nursing, personal care, respite, Alzheimer's coaching by qualified providers e.g., RN, LCSW, OT; must receive at least one waiver service/month)[1][7][8]` ([source](https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants`

### Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$1305` → Source says `$2,829` ([source](https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive medical/social services including: adult day care, dentistry/vision, emergency services, home care, hospital care, lab/x-ray, meals, medical specialties, nursing home care (if needed), nutritional counseling, occupational/physical/recreational therapy, prescription drugs, primary care (doctors/nurses), social services/work counseling, transportation. All Medicare/Medicaid-covered services, no copays for covered items; individualized plan by Interdisciplinary Team[1][5][8]. No specific dollar amounts or hours stated.` ([source](https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace`

### SNAP (Food Stamps)

- **income_limit**: Ours says `$2174` → Source says `$2608` ([source](https://www.mass.gov/lists/snap-application-for-seniors))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for groceries; average for MA seniors $147/month. Maximum allotment based on net income (e.g., 2-person elderly/disabled: up to $546/month minus 30% net income). Varies by household net income, size, expenses (medical, shelter, utilities deduct higher for seniors).[1][2][7]` ([source](https://www.mass.gov/lists/snap-application-for-seniors))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/lists/snap-application-for-seniors`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigate and resolve complaints related to health, safety, welfare, rights; mediate conflicts; regular facility visits; advocate for systemic changes; educate on rights; assist with facility selection; support resident/family councils; handle issues like abuse, care, discharge, autonomy, dietary, environment[1][3][4][5][7]` ([source](https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program`

## New Programs (Not in Our Data)

- **MassHealth Medicare Savings Program** — financial ([source](https://www.mass.gov/info-details/get-help-paying-medicare-costs))
  - Shape notes: Tiered by QMB/SLMB/QI with different premium/cost coverage; no asset test for core MSP (unique since 3/1/2024); income scales to household size via FPL; statewide uniform; combines with MassHealth for fuller benefits
- **Residential Conservation Service (Weatherization)** — service ([source](https://www.mass.gov/info-details/weatherization-assistance-program-wap))
  - Shape notes: Eligibility tied directly to LIHEAP/60% SMI (no fixed dollar table in sources, varies yearly by household size); priority tiers drive service order; regional agencies with town-specific access; no age minimum but elderly prioritized; building-wide rules for multi-family.
- **SHINE (Serving Health Insurance Needs of Everyone)** — service ([source](https://www.mass.gov/info-details/serving-the-health-insurance-needs-of-everyone-shine-program[9]))
  - Shape notes: no income/asset test for counseling; regionally administered with local providers and variable demand; volunteer/staff counselors assist with multiple Medicare-related applications but do not provide direct services or funding
- **Meals on Wheels** — service ([source](https://www.massmealsonwheels.org (state network); local AAAs; state regs at https://www.mass.gov/doc/651-cmr-4-the-state-funded-nutrition-program-for-elderly-persons/download[5][7]))
  - Shape notes: Decentralized by local AAAs/providers with no uniform statewide income test or application; eligibility emphasizes homebound need over finances; serves 70,000+ daily via network[3][7]
- **Alzheimer’s Respite Care Program** — service ([source](https://www.mass.gov/info-details/family-caregiver-support-program-eligibility))
  - Shape notes: Program embedded in broader Family Caregiver Support and Home Care Programs via local ASAPs; no strict income/asset tests detailed, priority on diagnosis and home residence; regional ASAP administration creates provider variations.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors[4]))
  - Shape notes: Administered by multiple regional grantees covering counties; priority tiers determine access; income at 125% FPL (family size-adjusted, annual update); 20 hours/week minimum wage training positions.
- **Massachusetts Senior Legal Helpline** — service ([source](https://www.mass.gov/doc/senior-legal-help-line/download))
  - Shape notes: no income test for helpline access; free info/referral open to all 60+ MA seniors; attorney services via referral with separate eligibility; phone-only primary access with short daily hours
- **Prescription Advantage** — financial ([source](https://www.prescriptionadvantagema.org and https://www.mass.gov/info-details/prescription-advantage))
  - Shape notes: Prescription Advantage is a tiered income-based program with five categories (S0-S5) for Medicare-eligible members, each with different income thresholds that vary by household size (single vs. married). The program has mandatory prerequisites — applicants must first apply for other federal/state programs (Extra Help, MSP) if they qualify by income. Benefits are not fixed dollar amounts but rather financial assistance that scales with income category. The program is statewide with centralized administration but no regional variations in eligibility or benefits. A critical structural feature is that it functions as secondary coverage for Medicare-eligible members (filling gaps in Medicare Part D) but as primary coverage for non-Medicare-eligible residents.
- **Home Modification Loan Program** — financial ([source](https://www.mass.gov/home-modification-loan-program-hmlp))
  - Shape notes: Loans capped by property type ($50k standard, $30k mobile); regional providers handle apps/eligibility with AMI-based income varying by location; professional need documentation required; excludes repairs, focuses on disability-specific mods
- **Home Care Program (HCP)** — service ([source](https://www.mass.gov/info-details/home-care-program))
  - Shape notes: Tied heavily to MassHealth; eligibility dual need-based (functional assessment) and financial (income/MassHealth); services hours/tasks set by in-home assessment and case manager; statewide but local ASAP delivery with potential funding-driven waitlists.
- **Enhanced Community Options Program (ECOP)** — service ([source](https://www.mass.gov (specific ECOP page not directly linked; see Mass.gov doc on state programs[8])))
  - Shape notes: Administered via regional ASAPS with statewide cap and waitlist; eligibility mirrors Frail Elder Waiver clinically but less restrictive assets/income for spend-down phase; recent 2026 caps and tightened thresholds; max fixed 7.5 hours/week
- **Senior Care Options (SCO)** — service ([source](https://www.mass.gov/senior-care-options))
  - Shape notes: SCO is a regional program with significant geographic variation—five different providers serve different county combinations, and substantial portions of Massachusetts have no coverage. Eligibility is binary (you either qualify or don't) rather than tiered, but benefits may vary slightly by provider. The program uniquely integrates two separate government programs (Medicare and Medicaid/MassHealth) into one coordinated plan. Asset limits are strict but vary for married couples. Functional need assessment is required only for long-term care access via specific waivers, not for all applicants. Processing timelines and specific forms are not detailed in public sources.

## Program Details

### MassHealth Medicare Savings Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be a Medicare beneficiary (typically age 65+ or disabled/ESRD under 65). Income at or below 225% Federal Poverty Level (FPL), updated annually on March 1. Current limits (as of latest 2025/2026 data): Single individual ≤ $2,993/month; Married couple ≤ $4,058/month. Higher incomes may qualify for full MassHealth if assets meet limits. Under age 65 on MassHealth Standard may qualify without asset test.[1][2][3][5]
- Assets: No asset limit for MSP-only eligibility (effective March 1, 2024; home, savings, etc., not counted). For combined MSP + certain MassHealth benefits: $2,000 single / $3,000 married couple countable assets apply.[2][3][4][5]
- Massachusetts resident
- Entitled to Medicare Part A (or eligible for Part A if not enrolled)
- Meet MassHealth immigration criteria
- Must not exceed countable income limits

**Benefits:** Pays Medicare premiums, deductibles, coinsurance, copays depending on tier:
- **QMB**: Part A/B premiums, all Part A/B deductibles/coinsurance/copays; Health Safety Net (HSN) at hospitals/CHCs; Medicare Part D Extra Help.
- **SLMB/QI**: Part B premium; HSN; Part D Extra Help.
Saves up to $3,000/year in premiums/costs. Show Medicare + MassHealth cards for QMB.[2][4]
- Varies by: priority_tier

**How to apply:**
- Online: MassHealth portal at mass.gov (use Medicare Savings Programs Application)
- Phone: MassHealth Customer Service Center at 1-800-841-2900
- Mail: MassHealth Enrollment Center (address on application form)
- Download/print PDF application from mass.gov and mail

**Timeline:** Notice of decision within 30 days

**Watch out for:**
- No asset test for MSP-only, but applies for MSP + full MassHealth ($2,000/$3,000 limits)
- Income limits update yearly on March 1; check current FPL chart
- Must be on Medicare; program auto-enrolls you in Part D Extra Help
- QMB: Providers can't charge you copays (show both cards); SLMB/QI don't cover deductibles/copays
- Under 65 on MassHealth Standard: Income test applies, no assets checked
- Applying also screens for SNAP; opt out if unwanted
- Higher income (>225% FPL) may still get MassHealth if assets low

**Data shape:** Tiered by QMB/SLMB/QI with different premium/cost coverage; no asset test for core MSP (unique since 3/1/2024); income scales to household size via FPL; statewide uniform; combines with MassHealth for fuller benefits

**Source:** https://www.mass.gov/info-details/get-help-paying-medicare-costs

---

### Frail Elder Waiver (FEW)


**Eligibility:**
- Age: 60-64 with a disability, or 65++
- Income: Must qualify for MassHealth Standard under 300% of Federal Poverty Level (FPL) or Federal SSI; approximately under $2,199/month for individual (varies annually); special rules like spend-down for medically needy over $2,901/month via medical bills; spousal income waived; no full household table specified but individual-focused with spousal protections[1][2][4][5][6]
- Assets: Individual: $2,000 max; spousal allowance: $154,140; certain exemptions apply under MassHealth rules (e.g., primary home potentially exempt, specifics via MassHealth); special financial rules for waivers[1][4][5][6]
- Nursing Facility Level of Care (NFLOC) via Comprehensive Data Set (CDS) assessment of ADLs (mobility, toileting, hygiene, cognition) by ASAP RN[1][2][3][4][5][6]
- Need FEW services and receive at least one per month to remain eligible[1][4]
- Live in community setting (own home, family home, congregate housing; not assisted living, group homes, rest homes, or institutions except brief respite)[1]
- Safely served in community[1]
- Enrolled in MassHealth; not in another HCBS waiver, One Care, or PACE[1][5]
- Eligible for state home care services via ASAP[3][4]

**Benefits:** Home and Community-Based Services (HCBS) including home care, supports for basic to intensive needs (specifics like nursing, personal care, respite, Alzheimer's coaching by qualified providers e.g., RN, LCSW, OT; must receive at least one waiver service/month)[1][7][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging Services Access Point (ASAP) for clinical assessment[1]
- Complete and mail application to local ASAP[1]
- Referral to ASAP (e.g., ESWA, AgeSpan) for home care eligibility assessment[3][4]
- Submit Senior Affordable Care Act (SACA) MassHealth Application + Long Term Care Supplement (A) with verifications to MassHealth[4]

**Timeline:** Often 3 months or more[2]
**Waitlist:** Not specified in sources; may vary by region/ASAP[2]

**Watch out for:**
- Must receive at least one FEW service per month or lose eligibility[1][4]
- Cannot live in assisted living, group homes, rest homes (congregate housing ok)[1]
- No participation in other waivers/One Care/PACE[1]
- Financial eligibility tied to MassHealth Standard (300% FPL/$2k assets) with special waiver rules/spend-down, but over-limits require spend-down on medical costs[2][4][5][6]
- Age 60-64 requires disability determination[1][2][4]
- Spousal protections (income/assets waived) often missed[4][6]

**Data shape:** Tied to MassHealth financial eligibility (300% FPL individual focus with spousal impoverishment protections); regional ASAP administration with RN clinical screening; service tiers from basic to intensive; must use at least one service monthly

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/info-details/frail-elder-waiver-information-for-applicants-and-participants

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No strict statewide income limits specified; often suitable for extremely low-income (below 300% Federal SSI rate, approximately $2,829/month for individual in 2024) with assets under $2,000. MassHealth may cover premium if income/asset guidelines met; some pay monthly share-of-cost premium based on income. Varies by provider and MassHealth eligibility—no table provided[3][6][8].
- Assets: Typically under $2,000 for low-income applicants; MassHealth asset rules may apply if seeking premium coverage (e.g., exempt primary home, car, personal items; countable: bank accounts, investments). Exact limits not uniformly stated[3][6].
- Nursing home level of care (clinically eligible)
- Ability to live safely in community with PACE services
- Reside in service area of a PACE provider
- 55 years or older[1][4][6][8]

**Benefits:** Comprehensive medical/social services including: adult day care, dentistry/vision, emergency services, home care, hospital care, lab/x-ray, meals, medical specialties, nursing home care (if needed), nutritional counseling, occupational/physical/recreational therapy, prescription drugs, primary care (doctors/nurses), social services/work counseling, transportation. All Medicare/Medicaid-covered services, no copays for covered items; individualized plan by Interdisciplinary Team[1][5][8]. No specific dollar amounts or hours stated.
- Varies by: region

**How to apply:**
- Contact local PACE provider directly (e.g., use MassPace zip code directory at masspace.net; call enrollment specialists)
- Phone examples: Summit ElderCare 1-877-837-9009; general inquiries via Mass.gov PACE page
- In-person at PACE centers
- No statewide online form; provider-assisted process[4][6][9]

**Timeline:** Not specified in sources
**Waitlist:** Possible; varies by provider/region—not detailed statewide

**Watch out for:**
- Not statewide—check zip code for availability; limited to specific provider areas[4]
- Requires nursing home-level need but ability to live safely in community with services[8]
- Not automatic MassHealth requirement, but they may pay premium; some pay share-of-cost[3][8]
- All services must be authorized by PACE team (except emergencies)[9]
- Often for dual-eligible (Medicare/Medicaid) frail elderly; private pay possible but premium-based[2][6]

**Data shape:** Provider-specific service areas only (not statewide), no fixed income/asset tables (tied to MassHealth/SSI), multiple regional PACE organizations with varying availability/waitlists, clinical nursing-home eligibility required despite community focus

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/program-of-all-inclusive-care-for-the-elderly-pace

---

### SNAP (Food Stamps)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled, gross income limit is 200% FPL (Oct 1, 2025–Sept 30, 2026): 1 person $2608/month, 2 $3526, 3 $4442, 4 $5358, 5 $6276, 6 $7192, 7 $8108, +$916 each additional. Such households may qualify via net income (100% FPL) and asset tests if gross exceeded. Alternative 2025 limits cited: 1 person $15,060/year ($1255/month), 2 $20,440/year ($1703/month). Social Security, pensions, disability count as income.[1][4][6]
- Assets: Asset test applies, especially for elderly/disabled households exceeding gross income; exemptions not detailed but primary home, retirement savings often excluded for seniors. Exact limits not specified; households with 60+ or disabled may be exempt from asset test in some cases.[1][7]
- Massachusetts resident, U.S. citizen or qualified non-citizen.
- Social Security number or proof of application.
- For Elderly/Disabled Simplified Application Project (EDSAP): all adults 60+, no earned income (wages/self-employment); children under 18 allowed; shorter form, 36-month certification, no recertification interview.[6]
- Able-bodied adults generally register for work, but exemptions for 60+.
- Legal immigrants 60+ may skip 5-year wait.[8]

**Benefits:** Monthly EBT card for groceries; average for MA seniors $147/month. Maximum allotment based on net income (e.g., 2-person elderly/disabled: up to $546/month minus 30% net income). Varies by household net income, size, expenses (medical, shelter, utilities deduct higher for seniors).[1][2][7]
- Varies by: household_size

**How to apply:**
- Online: Mass.gov DTA portal (specific senior form at mass.gov/lists/snap-application-for-seniors or mass.gov/doc/snap-application-for-seniors-snap-app-seniors/download).[3][9]
- Download/print/mail SNAP Application for Seniors (form for 60+ individuals/couples).[3][9]
- Phone: Call local DTA office or 211/1-877-382-2363 (general DTA line).
- In-person: Local DTA office or senior center/council on aging for assistance.[5]
- Via senior center or council on aging outreach.[5]

**Timeline:** Standard 30 days; expedited within 7 days if gross income + assets < monthly housing costs, or gross < $150/month + assets ≤ $100, or migrant worker with ≤ $100 assets.[3]

**Watch out for:**
- Seniors 60+ have easier rules (skip gross income if meet net/asset; higher medical/shelter deductions), but recent 2025 federal changes (One Big Beautiful Bill Act) add work docs for 60-65, reduce benefits/utility aid for ~144,000, end eligibility for some immigrants/refugees.[2][7]
- Must include all who buy/prepare food together; own home/savings often OK.[4]
- Report changes (expenses) anytime for more benefits; digital/paperwork barriers for mobility-limited seniors.[2][3]
- EDSAP only if no earned income.[6]
- Average benefit low ($147); disruptions force food/meds tradeoffs.[2]

**Data shape:** Easier eligibility for 60+ households (gross income optional, net/asset focus, EDSAP simplification); benefits scale by household size/net income with senior-specific deductions (medical/utilities); statewide but local DTA/senior center access.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/lists/snap-application-for-seniors

---

### Residential Conservation Service (Weatherization)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Eligibility is based on households qualifying for LIHEAP/HEAP or categorical eligibility (member receiving TAFDC or SSI). Gross annual income must not exceed 60% of the Estimated State Median Income (SMI) or up to 200% of Federal Poverty Level (FPL) via LIHEAP criteria. Exact dollar amounts vary annually by household size and are not fixed in sources; refer to current LIHEAP income eligibility chart on Mass.gov for precise table (e.g., aligns with LIHEAP which uses 60% SMI). Priority given to households with elderly members, disabled, children 6 and under, high energy costs, or Native Americans.[2][4][1]
- Assets: No asset limits mentioned in sources.[1][2]
- Households must not have been previously weatherized through this program.
- Homeowners must provide proof of ownership; tenants need signed landlord permission.
- Landlord must agree not to raise rent for 1 year post-weatherization and not evict except for good cause; must be current on property taxes, excise taxes, water/sewer bills.
- For multi-unit buildings (1-4 units or mobile homes), tenant must receive utility discount or fuel assistance and pay own heating bills. Entire building eligible if >50% units qualify.
- U.S. citizenship or qualified alien status required.
- Condominiums with >4 units ineligible.

**Benefits:** Free weatherization services including air sealing, attic/sidewall/floor insulation, pipe/duct insulation, weather-stripping, heating system evaluation/tune-ups/repairs, health/safety testing of combustion appliances, limited energy-related repairs. Average value $4,725 per household (ranges $200-$7,500 depending on audit, funding, area). May coordinate with utility programs. No client cost or contribution required. Estimated 25-35% reduction in heating bills.[2][3][4][5]
- Varies by: priority_tier|region

**How to apply:**
- Online: Apply starting October 1 through April 30 each program year via local energy assistance agency portal or Mass.gov (specific LIHEAP application used).[2]
- In-person or mail: Contact local energy assistance agency serving your city/town (agency listing by town on Mass.gov). Applications mailed to prior recipients after first year.[2]
- Phone: Call local agency (no statewide number; find via town listing on Mass.gov).[2]

**Timeline:** Not specified; after eligibility, local agency schedules energy inspection, then work by contractors with quality inspection.[2][4]
**Waitlist:** Due to limited funding, priority service creates effective waitlist; households apply annually.[2][4]

**Watch out for:**
- Must apply annually even if previously approved; applications only Oct 1-Apr 30.
- Tenants in 1-4 unit buildings or mobile homes only if paying own heat and receiving fuel assistance/utility discount; >4 unit condos ineligible.
- Landlord caps (taxes/utilities current, no rent hike/eviction) strictly enforced or no permit.
- Priority tiers (elderly, disabled, young children) affect wait times, not eligibility.
- No prior weatherization under WAP; may coordinate but not duplicate utility programs like MassSave.
- Entire building weatherized only if >50% eligible units.

**Data shape:** Eligibility tied directly to LIHEAP/60% SMI (no fixed dollar table in sources, varies yearly by household size); priority tiers drive service order; regional agencies with town-specific access; no age minimum but elderly prioritized; building-wide rules for multi-family.

**Source:** https://www.mass.gov/info-details/weatherization-assistance-program-wap

---

### SHINE (Serving Health Insurance Needs of Everyone)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Massachusetts residents eligible for Medicare (typically age 65+) or approaching eligibility, their caregivers, and those with limited resources seeking related programs[1][2][3][9]
- Assets: No asset limits; no financial tests required for SHINE counseling itself[4][5]
- Massachusetts resident[1][2][9]
- Eligible for Medicare or approaching Medicare eligibility, or caregiver[2][3][5][9]
- U.S. citizenship or immigration status may apply for screened programs like MassHealth, but not for SHINE counseling[1]

**Benefits:** Free, unbiased health insurance information, counseling, and assistance including: Medicare Parts A/B/C/D, Medigap, Medicare Advantage, prescription drug plans, MassHealth, Medicare Savings Programs (QMB/SLMB/QI), Extra Help/LIS, Prescription Advantage; screening for eligibility and help with applications for cost-saving programs; enrollment process guidance[2][3][4][7][9]

**How to apply:**
- Phone: Call MassOptions at 1-800-243-4636 to find a local SHINE counselor[6][9]
- In-person: At senior centers, Councils on Aging, or Regional Aging Services Access Points[9]
- Phone/email/virtual/mail via local providers (e.g., Mattapoisett: 508-758-4110; regional sites vary)[1][4]
- SHINE staff directory via MassOptions[9]

**Timeline:** Immediate counseling appointment scheduling; no formal processing as it's direct assistance[2][4]
**Waitlist:** High demand periods like Medicare Open Enrollment may have wait times (e.g., Cape Cod recorded 3,600+ appointments in 2025 season)[2]

**Watch out for:**
- Not a direct benefits program—provides counseling only, not financial aid itself[3][5]
- High demand during Medicare Open Enrollment (Oct-Dec) and Advantage Open Enrollment (Jan-Mar) may cause appointment delays[2]
- Contact local sites for availability as statewide phone routes to regional counselors[1][6][9]
- Some sites list as 'Health Information Needs of Elders' but full name is 'Health Insurance Needs of Everyone'—same program[7]

**Data shape:** no income/asset test for counseling; regionally administered with local providers and variable demand; volunteer/staff counselors assist with multiple Medicare-related applications but do not provide direct services or funding

**Source:** https://www.mass.gov/info-details/serving-the-health-insurance-needs-of-everyone-shine-program[9]

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income limits; some local providers apply means-testing for reduced-price or free meals, but most serve any income level based on need[3][7].
- Assets: No asset limits mentioned across sources.
- Chronically or temporarily homebound and unable to shop, prepare, or obtain at least one nutritious meal per day[1][2][6]
- Physically or emotionally unable to prepare meals, with inadequate family/formal support[1]
- Lack of transportation to stores or senior dining sites[1]
- Spouses and dependents with disabilities may qualify regardless of age[5][7]

**Benefits:** Nutritionally balanced hot lunch delivered weekdays (meets 1/3 of daily requirements, low sodium/fat/sugar); special diets for diabetes/heart disease; daily safety check-in and social contact by driver; serves over 30,000 meals daily statewide[1][7][8]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) or provider via https://www.mealsonwheelsamerica.org/find-meals-and-services/[2]
- Statewide helpline: 1-800-985-6000[3]
- Local examples: Greater Springfield Senior Services (https://www.gsssi.org/meals-on-wheels)[1]; Meals on Wheels Boston (https://www.mealsonwheelsboston.org/)[6]; South Shore Elder Services (https://sselder.org/mealsonwheels/)[8]; Mass Meals on Wheels agency finder (https://www.massmealsonwheels.org)[7]

**Timeline:** Not specified; contact local provider for assessment[2]
**Waitlist:** Varies by region and provider; some areas have demand exceeding capacity[2]

**Watch out for:**
- Not a single centralized program—must contact specific local provider for service area, exact eligibility, and availability[2][7]
- Homebound status strictly required; drivers cannot leave meals unattended[1][6]
- Fees may apply based on local means-testing (free for most, low-cost otherwise)[3][8]
- Primarily weekday lunch only; no weekends/holidays typically[6]
- Separate from Medicaid/Mom's Meals (which requires enrollment in those plans)[4]

**Data shape:** Decentralized by local AAAs/providers with no uniform statewide income test or application; eligibility emphasizes homebound need over finances; serves 70,000+ daily via network[3][7]

**Source:** https://www.massmealsonwheels.org (state network); local AAAs; state regs at https://www.mass.gov/doc/651-cmr-4-the-state-funded-nutrition-program-for-elderly-persons/download[5][7]

---

### Alzheimer’s Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits mentioned in sources; eligibility primarily based on age, diagnosis, and caregiver status rather than income. Over-income programs exist for respite (e.g., AgeSpan fact sheet), but no dollar amounts or household tables provided.[4]
- Assets: Not applicable or not specified for this program. Related MassHealth programs exempt primary home (equity ≤ $1,097,000 in 2025 if intent to return), but not directly tied to Alzheimer's respite.[3]
- Caregiver must be adult family member or non-paid caregiver, age 18+.
- Individual cared for: age 60+ or any age with Alzheimer's disease or related dementia.
- Must live at home in Massachusetts (not institutional or certified assisted living).
- Determined by need, residence, and ability to perform daily tasks.[1][5]

**Benefits:** Respite care services including Alzheimer's/dementia coaching, home health aide, homemaker, personal care, respite, chore, companion, complex care training and oversight. Specific hours or dollar amounts not detailed; related programs offer e.g., $2,500 annual respite benefit via Medicare GUIDE.[2][6]

**How to apply:**
- Contact local Aging Service Access Points (ASAPs) by calling (800) 243-4636 or search at https://contactus.800ageinfo.com/FindAgency.aspx.[2]
- Request clinical eligibility assessment via ASAP.[2]
- Phone: (800) AGE-INFO ((800) 243-4636).[2]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned for this program (contrast with Medicaid waivers that have enrollment limits).[2]

**Watch out for:**
- Not a standalone 'Alzheimer’s Respite Care Program' – likely refers to respite within Family Caregiver Support Program or Home Care Program; families may confuse with Medicare GUIDE ($2,500 respite, requires Medicare A/B, no Advantage).[1][6]
- Eligibility focuses on caregiver supporting person 60+ or any age with dementia; grandparents/relatives have separate criteria.[1]
- Dementia diagnosis alone does not guarantee functional eligibility in related assessments.[3]
- No automatic entitlement or waitlist info; apply via local ASAPs which vary regionally.[2]

**Data shape:** Program embedded in broader Family Caregiver Support and Home Care Programs via local ASAPs; no strict income/asset tests detailed, priority on diagnosis and home residence; regional ASAP administration creates provider variations.

**Source:** https://www.mass.gov/info-details/family-caregiver-support-program-eligibility

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in sources; families must check current federal poverty guidelines via provider or DOL. Applies statewide in MA.[1][2][3][4][5][7]
- Assets: No asset limits mentioned in sources.
- Unemployed[1][2][3][4][5][7]
- U.S. citizen or authorized to work[4] (inferred from federal program)
- Enrollment priority: Veterans and qualified spouses first, then individuals over 65, with disability, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users[1][2][4][5]

**Benefits:** Part-time community service work (up to 20 hours/week) at minimum wage at nonprofits/public agencies (e.g., schools, hospitals, senior centers); on-the-job training; job placement assistance; leads to unsubsidized employment. Duration limited to 48 months.[4][5][6][7][8]
- Varies by: priority_tier

**How to apply:**
- Contact regional providers: e.g., Springfield Dept of Elder Affairs (Hampden/Hampshire Counties) via springfield-ma.gov/hhs/scsepelderaffairs[1]; CFC Inc Fall River office (Bristol, Plymouth, Hampden Counties)[2]; CCWORC (Worcester/Franklin Counties) at 508-860-2241[5]
- No statewide centralized online form; apply via local grantee (state agencies or nonprofits like AARP Foundation SCSEP)[4][8]
- American Job Centers for assistance[1][4]

**Timeline:** Not specified in sources.
**Waitlist:** Possible based on 'Most in Need' criteria and priority; eligible considered by characteristics[2]

**Watch out for:**
- Not regular employment; work-training only, excluded from MA Paid Family Medical Leave[6]
- Priority-based enrollment may cause delays for non-priority applicants[1][2][4]
- Must be actively unemployed and seeking unsubsidized job; limited to 48 months[7]
- Income is family-based at 125% FPL; check current guidelines as they update yearly
- Regional providers only—no single statewide application[1][2][5]

**Data shape:** Administered by multiple regional grantees covering counties; priority tiers determine access; income at 125% FPL (family size-adjusted, annual update); 20 hours/week minimum wage training positions.

**Source:** https://www.dol.gov/agencies/eta/seniors[4]

---

### Massachusetts Senior Legal Helpline

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits for the helpline itself; eligibility for free attorney representation (via referral) depends on separate Massachusetts civil legal services programs, often requiring low income (e.g., below 125% of federal poverty level in some programs).[1][2][3]
- Assets: No asset limits mentioned for the helpline; asset tests may apply to referred free attorney services on a program-by-program basis.
- Massachusetts resident
- Civil legal issues only (e.g., Social Security/SSI, MassHealth, housing, guardianship, etc.).[1][2]

**Benefits:** Free legal information, advice, and referrals; assistance completing applications for free attorneys from civil legal services programs (most callers not eligible for free attorney); referrals to reduced-fee or private attorneys; materials via text, email, or mail. Covers civil law areas: Social Security/SSI, veterans benefits, MassHealth, Medicare, consumer issues, public benefits, unemployment, foreclosures, guardianship, power of attorney, bankruptcy, evictions, landlord/tenant, utilities, family law, nursing home issues.[1][2]

**How to apply:**
- Phone: 800-342-5297 (Mon-Fri 9am-12pm, English/Spanish)
- Download brochure/form: https://www.mass.gov/doc/senior-legal-help-line/download.[1][2]

**Timeline:** Immediate phone consultation during hours; attorney eligibility/application handled during call if applicable.

**Watch out for:**
- Most callers not eligible for free attorney—primarily info/referral service; excludes criminal, medical malpractice, workers’ comp, personal injury (contingency basis only); limited hours (9am-12pm); not full representation unless referred and qualified elsewhere; separate from AG Elder Hotline (888-243-5337).[1][2][5]

**Data shape:** no income test for helpline access; free info/referral open to all 60+ MA seniors; attorney services via referral with separate eligibility; phone-only primary access with short daily hours

**Source:** https://www.mass.gov/doc/senior-legal-help-line/download

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; support is free for all eligible residents[2][3][6]
- Assets: No asset limits; support is free for all eligible residents[2][3][6]
- Must reside in a nursing home, rest home, or assisted living facility in Massachusetts[1][2][3][6][8]

**Benefits:** Investigate and resolve complaints related to health, safety, welfare, rights; mediate conflicts; regular facility visits; advocate for systemic changes; educate on rights; assist with facility selection; support resident/family councils; handle issues like abuse, care, discharge, autonomy, dietary, environment[1][3][4][5][7]

**How to apply:**
- Phone: 617-222-7495 (statewide main line to connect to local ombudsman)[2][3][6]
- Website: https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program (for regional contacts)[2][4]
- Local/regional offices: Contact via city/town-aligned agency or host sites (e.g., AgeSpan, Springwell, LifePath, Old Colony Planning)[1][7][8][9]
- In-person: At facilities during regular ombudsman visits or local offices[1][8]

**Timeline:** No formal application or processing; complaints investigated promptly by certified ombudsmen[3][4]

**Watch out for:**
- Not a regulatory agency; cannot enforce rules but advocates and educates on regulations[5]
- Must already reside in qualifying facility—not for community/home care or pre-admission[1][2][3]
- Complaints can be anonymous/confidential, but identity may be disclosed in abuse cases[4][7]
- Families/loved ones can contact on behalf of resident, but services target facility residents[3][6]
- Not healthcare or financial aid; purely advocacy for rights and issue resolution[5]

**Data shape:** no income/asset test; residency in certified long-term care facility required; regionally delivered via 17 host sites and local volunteers; free immediate advocacy access without application

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mass.gov/orgs/massachusetts-long-term-care-ombudsman-program

---

### Prescription Advantage

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older (primary category); under 65 with disabilities also eligible[3]+
- Income: {"description":"Income limits vary by category and household composition. As of January 1, 2026:[6]","medicare_eligible_categories":{"S0":{"single_yearly":"$0 - $21,128","single_monthly":"$0 - $1,761","married_yearly":"$0 - $28,553","married_monthly":"$0 - $2,379"},"S1":{"single_yearly":"$21,129 - $31,692","single_monthly":"$1,762 - $2,641","married_yearly":"$28,554 - $42,924","married_monthly":"$2,380 - $3,577"},"S2":{"single_yearly":"$31,693 - $39,616","single_monthly":"$2,642 - $3,301","married_yearly":"$42,925 - $53,550","married_monthly":"$3,578 - $4,463"},"S3":{"single_yearly":"$39,617 - $46,950","single_monthly":"$3,302 - $3,913","married_yearly":"$53,551 - $63,450","married_monthly":"$4,464 - $5,288"},"S5":{"single_yearly":"$46,951 - $78,250","single_monthly":"$3,914 - $6,521","married_yearly":"$63,451 - $105,750","married_monthly":"$5,289 - $8,813"}},"under_65_disabled":"Gross annual household income at or below 188% of the Federal Poverty Level[3]","note":"For Medicare-eligible applicants, income must be less than 500% of the Federal Poverty Level to qualify[3]"}
- Assets: {"general":"No asset limit for most applicants[5]","exceptions":"Applicants who may qualify for Medicare Extra Help (Low Income Subsidy) must have assets no more than: Single $17,220; Married $34,360. Assets do not include home, life insurance policies, burial plots, or personal possessions[4]","msp_exception":"Applicants who may qualify for MassHealth Buy-In Program (Medicare Savings Program) must have resources no more than: Single $18,180; Married $27,260[7]"}
- Must be a Massachusetts resident with primary residence in Massachusetts[2]
- Must be eligible for Medicare (with exceptions for those 65+ not eligible for Medicare)[3]
- Cannot currently receive prescription drug benefits through MassHealth (CommonHealth) or MassHealth[1]
- Under age 65: must work no more than 40 hours per month and meet MassHealth's CommonHealth disability guidelines[3]
- Must not be receiving MassHealth Buy-In Program (Medicare Savings Program) assistance — if eligible, must apply for it first[4][6]
- Must apply for Medicare Extra Help if income qualifies[4]

**Benefits:** Prescription drug insurance plan that provides financial assistance with premiums, deductibles, and co-payments. Members pay based on gross annual household income; lower-income members receive greater assistance[1]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-243-4636 (TTY 711)[1][6]
- Mail: Prescription Advantage, P.O. Box 15153, Worcester, MA 01615-0153[1]
- Online: www.prescriptionadvantagema.org[6]
- Website: www.mass.gov/info-details/prescription-advantage[9]

**Timeline:** Benefits begin on the first day of the month following complete processing of application[1]. Specific processing timeline not provided in search results.
**Waitlist:** No waitlist mentioned in search results. Open enrollment periods exist; if applicant does not join during open enrollment, must wait for next open enrollment period[1]

**Watch out for:**
- **Mandatory application requirement for other programs**: If income qualifies for Medicare Extra Help (LIS) or Medicare Savings Program (MSP/MassHealth Buy-In), applicants MUST apply for these programs first or they will not be eligible for Prescription Advantage assistance[4][6]
- **Cannot have MassHealth coverage**: Individuals receiving prescription drug benefits through MassHealth (CommonHealth) cannot join Prescription Advantage[1]
- **Open enrollment periods**: If applicant misses open enrollment, must wait for next enrollment period (exceptions exist for those 66+ who recently moved to MA, lost coverage, or became ineligible for Medicaid)[1]
- **Income-based premiums and cost-sharing**: Members pay premiums, deductibles, and co-payments based on income — this is not free coverage[1]
- **Medicare requirement for most**: Most applicants must be eligible for Medicare; only limited primary coverage available for those not eligible for Medicare[3]
- **Must maintain Medicare Part D or equivalent**: Medicare-eligible members must be enrolled in a primary Medicare Part D plan, Medicare Advantage plan with drug coverage, or creditable coverage to receive Prescription Advantage assistance[4]
- **Asset limits for some categories**: While no asset limit exists for most applicants, those qualifying for Extra Help or MSP face asset restrictions[4][7]

**Data shape:** Prescription Advantage is a tiered income-based program with five categories (S0-S5) for Medicare-eligible members, each with different income thresholds that vary by household size (single vs. married). The program has mandatory prerequisites — applicants must first apply for other federal/state programs (Extra Help, MSP) if they qualify by income. Benefits are not fixed dollar amounts but rather financial assistance that scales with income category. The program is statewide with centralized administration but no regional variations in eligibility or benefits. A critical structural feature is that it functions as secondary coverage for Medicare-eligible members (filling gaps in Medicare Part D) but as primary coverage for non-Medicare-eligible residents.

**Source:** https://www.prescriptionadvantagema.org and https://www.mass.gov/info-details/prescription-advantage

---

### Home Modification Loan Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 or older for seniors; no minimum age if person with disability[1][2][4]+
- Income: Gross household income up to 200% of Area Median Income (AMI), updated annually based on HUD data; varies by household size and region (no specific dollar table in sources, contact regional provider for current figures)[3][6]
- Assets: $75,000 maximum in countable assets (excludes primary home, one vehicle, household furnishings, IRA/401k retirement accounts; countable includes cash, bank accounts, stocks, bonds, secondary properties)[3][6]
- Massachusetts resident and homeowner (or small landlord with <10 units for tenant modifications)[1][2][4]
- Household member must be frail elder (60+), person with disability, or both; modifications must address functional limitations documented by a professional (e.g., doctor, OT) with client history[1][2][4][6]
- Must be current on MA state income taxes and property taxes[4][6]
- Homeowner or landlord; for landlords, tenant household income/assets determine eligibility, 3% interest amortizing loan[3][4][6]

**Benefits:** 0% interest deferred loans up to $50,000 for homeowners/property owners; up to $30,000 for manufactured/mobile homes; no monthly payments, repayment due on sale/refinance/transfer of property; funds specific accessibility mods (ramps/lifts, bathroom/kitchen adaptations, handrails, doorway widening, flooring, fencing, lighting, sensory spaces, accessory dwelling units); excludes general repairs (roof, windows, heating, septic)[1][2][5][6][8]
- Varies by: household_size|region

**How to apply:**
- Contact regional provider agency (six agencies statewide process applications)[4][5]
- Mail: Community Economic Development Assistance Corp., Attn: Susan Gillam, 18 Tremont Street, Suite 500, Boston, MA 02108[2]
- In-person or phone via local provider (e.g., Valley CDC for Hampshire/Hampden: valleycdc.org; Metro Housing Boston; Way Finders; SMOC)[1][3][7]

**Timeline:** Not specified; applications reviewed by regional providers after complete submission[3][4][6]
**Waitlist:** Not mentioned in sources[null]

**Watch out for:**
- Not a general home repair program—only accessibility mods tied to documented disability/functional need; no roof/windows/heating/septic[2][3][6]
- Landlords get 3% interest loan (not 0%), based on tenant income/assets[3][4][6]
- Strict $75k asset limit excludes some retirement savings but counts cash/stocks[3][6]
- Must use licensed/insured MA contractor; no loan without bid form[6]
- Income is gross (pre-tax/deductions), up to 200% AMI—check regional limits as they vary[3][6]
- No credit check but requires tax/property tax compliance[4][6][7]

**Data shape:** Loans capped by property type ($50k standard, $30k mobile); regional providers handle apps/eligibility with AMI-based income varying by location; professional need documentation required; excludes repairs, focuses on disability-specific mods

**Source:** https://www.mass.gov/home-modification-loan-program-hmlp

---

### Home Care Program (HCP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Annual gross income less than $35,784 ($2,982/month) in 2026 for individuals. For non-MassHealth members, prior 2024 limit was $33,948/year ($2,829/month). Co-payments range $10-$141/month for individuals with incomes $16,292-$36,598; $14-$199 for two-person households $21,940-$51,785. MassHealth members are financially eligible without additional income test.[2][6]
- Assets: No specific asset limits mentioned; financial eligibility tied to MassHealth enrollment or income guidelines. Assets not detailed in sources.[1][2][6]
- Massachusetts resident living at home (not in institutional setting or certified assisted living).
- Need-based: Assessed need for assistance with activities of daily living (ADLs) like bathing, dressing, meal preparation, medication management via comprehensive functional assessment.
- Under 60 only if diagnosed with early-onset Alzheimer’s or related dementia.
- MassHealth enrollment preferred or required for full financial eligibility.

**Benefits:** In-home services based on assessed need, including home care assistance (hours of specific tasks determined post-assessment). Cost-sharing via co-payments based on income. Services help age in place; exact services like personal care, homemaking, respite not exhaustively listed but tied to functional needs.[2][4][6]
- Varies by: priority_tier

**How to apply:**
- Phone: Call MassAbility Home Care Program at 617-204-3853 or MassAbility Connect at 617-204-3665.
- Online: Start an online referral for Home Care Assistance Program (HCAP) via Mass.gov.
- In-person/home assessment: Arranged by case manager post-referral.

**Timeline:** Up to 3-4 months to process application, determine eligibility, and arrange services.[4]
**Waitlist:** May have waitlist depending on funding or open enrollment periods for new referrals.[4]

**Watch out for:**
- Financial eligibility often the biggest barrier; many exceed income limits despite functional need.[1]
- Must be MassHealth member for easiest access; non-members face stricter income caps.[1][6]
- Services cost-shared based on income, not fully free.[6]
- Waitlists or enrollment periods limit access based on funding.[4]
- Requires living at home, excludes assisted living/institutional settings.[2]
- Processing can take 3-4 months.[4]

**Data shape:** Tied heavily to MassHealth; eligibility dual need-based (functional assessment) and financial (income/MassHealth); services hours/tasks set by in-home assessment and case manager; statewide but local ASAP delivery with potential funding-driven waitlists.

**Source:** https://www.mass.gov/info-details/home-care-program

---

### Enhanced Community Options Program (ECOP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: At or below ASAP income guidelines for individual or couple (specific dollar amounts not detailed in sources; aligns with MassHealth/Frail Elder Waiver standards for low-income elders). Less restrictive than full nursing home eligibility to facilitate enrollment[2][3][4].
- Assets: Less restrictive resource requirements than MassHealth-funded nursing home care or Frail Elder Waiver, designed for those in process of asset spend-down; exact limits not specified but clarified allowable by CMS SMD #21-004[3]. What counts and exemptions not detailed.
- Clinically qualifies for MassHealth-funded nursing home level of care (same as Frail Elder Waiver)
- Resides in geographical area served by local Aging Services Access Point (ASAP)
- Typically ineligible for MassHealth Standard (middle-income program for those not yet qualifying for MassHealth waivers)
- Frail elder needing services to avoid/postpone nursing home placement[2][3][4][6]

**Benefits:** Higher level of in-home supportive services including personal care (e.g., bathing), homemaking, chore, laundry, home health aide, companion, adult day care, home delivered meals, grocery shopping, transportation, personal emergency response systems; maximum 7.5 hours per week of assistance; providers receive set state funding rate per client, adjusted annually[3][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Aging Services Access Point (ASAP) as single point of entry (e.g., Springwell for their region: springwell.com/service/subsidized-home-care/)[6]
- In-home comprehensive assessment by ASAP care manager with nurse consultation[6]

**Timeline:** Not specified in sources.
**Waitlist:** Statewide enrollment cap at 7,322 slots (down from 9,000 as of June prior to 2026); new enrollees waitlisted once cap reached, leading to months-long delays and risk of health decline/nursing home placement[3].

**Watch out for:**
- Enrollment cap causes waitlists for new applicants; no impact on current enrollees[3][4]
- Recent tightening of eligibility (e.g., higher minimum spend threshold for new enrollees as of Feb 2026 or earlier)[4]
- Not for MassHealth Standard, Basic, or HMO recipients; bridges to waivers like Frail Elder while assets are spent down[2][3]
- Max 7.5 hours/week limits intensity; directs lower-need to basic home care[3][4][5]
- State-funded, cheaper than MassHealth alternatives but capped due to costs[4]

**Data shape:** Administered via regional ASAPS with statewide cap and waitlist; eligibility mirrors Frail Elder Waiver clinically but less restrictive assets/income for spend-down phase; recent 2026 caps and tightened thresholds; max fixed 7.5 hours/week

**Source:** https://www.mass.gov (specific ECOP page not directly linked; see Mass.gov doc on state programs[8])

---

### Senior Care Options (SCO)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No specific income limits stated in available sources. Eligibility is based on MassHealth Standard qualification, which is the Medicaid program for persons 65+. Contact MassHealth at (800) 841-2900 for income thresholds by household composition.
- Assets: Maximum $2,000 in countable assets (excluding primary residence, one vehicle, and personal belongings). For married couples, assets are divided equally; the at-home spouse may retain up to $109,560 in assets and $2,739 in monthly income.[3]
- Must be eligible for MassHealth Standard[1][2]
- Must have Medicare Parts A and B (enrollment in Medicare is required)[1][4]
- Must qualify for Medicare Part D (prescription drug coverage)[1]
- Cannot have end-stage renal disease[2][5]
- Cannot be an inpatient at a chronic or rehabilitation hospital[1]
- Cannot reside in an intermediate care facility for people with intellectual disabilities[1]
- Must live at home or in a long-term-care facility[1]
- Cannot be subject to a six-month deductible period under MassHealth regulations[1]
- Must live in a geographic area served by an SCO plan[1]
- Must not have other comprehensive health insurance[4]
- For long-term care access via Frail Elder Waiver: must demonstrate functional need (assistance required with minimum one Activity of Daily Living: transferring, dressing, bathing, mobility, eating, or toileting)[2]

**Benefits:** Integrated coverage combining MassHealth and Medicare benefits: medical care, mental health services, prescription medications, specialized geriatric support services, care coordination, transportation to medical appointments, and vision exams. Members have no or low monthly premiums, no copays, and little to no out-of-pocket costs for most covered services. One health plan card and unified care team instead of separate MassHealth, Medicare, Medicare Part D, and Medicare Supplement cards.[7][6]
- Varies by: region (different SCO providers offer different service areas and may include different supplemental benefits)

**How to apply:**
- Mail: Send enrollment form to MassHealth[5]
- Phone: Contact local Aging Service Access Points (ASAPs)[5]
- Phone: Contact the SCO directly (five SCOs operate in Massachusetts)[5]
- In-person: Visit local ASAP office[5]

**Timeline:** Not specified in available sources. Contact SCO or ASAP for current processing timeline.
**Waitlist:** Not mentioned in available sources.

**Watch out for:**
- Geographic coverage is NOT statewide. Verify your county/town is served before applying. Dukes, Nantucket, parts of Hampshire County, and the islands have no SCO coverage.[2][5]
- Medicare enrollment is required, not optional. While MassHealth Standard enrollment is required, you must also have Medicare Parts A and B to qualify.[2]
- Functional need assessment required for long-term care access. A dementia diagnosis alone does not automatically qualify someone; a functional needs assessment must demonstrate need for assistance with Activities of Daily Living.[2]
- Medicaid Look-Back Period applies for some applicants. If entering via the Frail Elder Waiver, Medicaid reviews the 60 months prior to application for asset transfers or sales below fair market value, which can trigger a penalty period of ineligibility.[2]
- Asset limits are strict at $2,000 (excluding home, car, personal items). Married couples have different rules with the at-home spouse allowed significantly more assets.[3]
- No other comprehensive health insurance allowed. Enrollment in SCO is exclusive; you cannot maintain other comprehensive coverage.[4]
- Enrollment is voluntary but disenrollment is always possible. Members can leave the program at any time.[4]
- Multiple application routes exist but no single online portal mentioned. You must contact MassHealth, an ASAP, or the SCO directly; no centralized online application system is described in available sources.[5]

**Data shape:** SCO is a regional program with significant geographic variation—five different providers serve different county combinations, and substantial portions of Massachusetts have no coverage. Eligibility is binary (you either qualify or don't) rather than tiered, but benefits may vary slightly by provider. The program uniquely integrates two separate government programs (Medicare and Medicaid/MassHealth) into one coordinated plan. Asset limits are strict but vary for married couples. Functional need assessment is required only for long-term care access via specific waivers, not for all applicants. Processing timelines and specific forms are not detailed in public sources.

**Source:** https://www.mass.gov/senior-care-options

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| MassHealth Medicare Savings Program | benefit | federal | deep |
| Frail Elder Waiver (FEW) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| SNAP (Food Stamps) | benefit | federal | deep |
| Residential Conservation Service (Weathe | benefit | federal | deep |
| SHINE (Serving Health Insurance Needs of | resource | state | simple |
| Meals on Wheels | benefit | federal | deep |
| Alzheimer’s Respite Care Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Massachusetts Senior Legal Helpline | navigator | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Prescription Advantage | benefit | state | deep |
| Home Modification Loan Program | benefit | state | deep |
| Home Care Program (HCP) | benefit | state | deep |
| Enhanced Community Options Program (ECOP | benefit | state | deep |
| Senior Care Options (SCO) | benefit | local | deep |

**Types:** {"benefit":12,"resource":2,"employment":1,"navigator":1}
**Scopes:** {"federal":6,"state":8,"local":2}
**Complexity:** {"deep":13,"simple":3}

## Content Drafts

Generated 15 page drafts. Review in admin dashboard or `data/pipeline/MA/drafts.json`.

- **MassHealth Medicare Savings Program** (benefit) — 4 content sections, 6 FAQs
- **Frail Elder Waiver (FEW)** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 5 content sections, 6 FAQs
- **Residential Conservation Service (Weatherization)** (benefit) — 3 content sections, 6 FAQs
- **SHINE (Serving Health Insurance Needs of Everyone)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels** (benefit) — 4 content sections, 6 FAQs
- **Alzheimer's Respite Care Program** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Massachusetts Senior Legal Helpline** (navigator) — 1 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Prescription Advantage** (benefit) — 5 content sections, 6 FAQs
- **Home Modification Loan Program** (benefit) — 5 content sections, 6 FAQs
- **Home Care Program (HCP)** (benefit) — 4 content sections, 6 FAQs
- **Enhanced Community Options Program (ECOP)** (benefit) — 4 content sections, 6 FAQs
- **Senior Care Options (SCO)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 4 programs
- **household_size|region**: 1 programs
- **region (different SCO providers offer different service areas and may include different supplemental benefits)**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MassHealth Medicare Savings Program**: Tiered by QMB/SLMB/QI with different premium/cost coverage; no asset test for core MSP (unique since 3/1/2024); income scales to household size via FPL; statewide uniform; combines with MassHealth for fuller benefits
- **Frail Elder Waiver (FEW)**: Tied to MassHealth financial eligibility (300% FPL individual focus with spousal impoverishment protections); regional ASAP administration with RN clinical screening; service tiers from basic to intensive; must use at least one service monthly
- **Program of All-Inclusive Care for the Elderly (PACE)**: Provider-specific service areas only (not statewide), no fixed income/asset tables (tied to MassHealth/SSI), multiple regional PACE organizations with varying availability/waitlists, clinical nursing-home eligibility required despite community focus
- **SNAP (Food Stamps)**: Easier eligibility for 60+ households (gross income optional, net/asset focus, EDSAP simplification); benefits scale by household size/net income with senior-specific deductions (medical/utilities); statewide but local DTA/senior center access.
- **Residential Conservation Service (Weatherization)**: Eligibility tied directly to LIHEAP/60% SMI (no fixed dollar table in sources, varies yearly by household size); priority tiers drive service order; regional agencies with town-specific access; no age minimum but elderly prioritized; building-wide rules for multi-family.
- **SHINE (Serving Health Insurance Needs of Everyone)**: no income/asset test for counseling; regionally administered with local providers and variable demand; volunteer/staff counselors assist with multiple Medicare-related applications but do not provide direct services or funding
- **Meals on Wheels**: Decentralized by local AAAs/providers with no uniform statewide income test or application; eligibility emphasizes homebound need over finances; serves 70,000+ daily via network[3][7]
- **Alzheimer’s Respite Care Program**: Program embedded in broader Family Caregiver Support and Home Care Programs via local ASAPs; no strict income/asset tests detailed, priority on diagnosis and home residence; regional ASAP administration creates provider variations.
- **Senior Community Service Employment Program (SCSEP)**: Administered by multiple regional grantees covering counties; priority tiers determine access; income at 125% FPL (family size-adjusted, annual update); 20 hours/week minimum wage training positions.
- **Massachusetts Senior Legal Helpline**: no income test for helpline access; free info/referral open to all 60+ MA seniors; attorney services via referral with separate eligibility; phone-only primary access with short daily hours
- **Long-Term Care Ombudsman Program**: no income/asset test; residency in certified long-term care facility required; regionally delivered via 17 host sites and local volunteers; free immediate advocacy access without application
- **Prescription Advantage**: Prescription Advantage is a tiered income-based program with five categories (S0-S5) for Medicare-eligible members, each with different income thresholds that vary by household size (single vs. married). The program has mandatory prerequisites — applicants must first apply for other federal/state programs (Extra Help, MSP) if they qualify by income. Benefits are not fixed dollar amounts but rather financial assistance that scales with income category. The program is statewide with centralized administration but no regional variations in eligibility or benefits. A critical structural feature is that it functions as secondary coverage for Medicare-eligible members (filling gaps in Medicare Part D) but as primary coverage for non-Medicare-eligible residents.
- **Home Modification Loan Program**: Loans capped by property type ($50k standard, $30k mobile); regional providers handle apps/eligibility with AMI-based income varying by location; professional need documentation required; excludes repairs, focuses on disability-specific mods
- **Home Care Program (HCP)**: Tied heavily to MassHealth; eligibility dual need-based (functional assessment) and financial (income/MassHealth); services hours/tasks set by in-home assessment and case manager; statewide but local ASAP delivery with potential funding-driven waitlists.
- **Enhanced Community Options Program (ECOP)**: Administered via regional ASAPS with statewide cap and waitlist; eligibility mirrors Frail Elder Waiver clinically but less restrictive assets/income for spend-down phase; recent 2026 caps and tightened thresholds; max fixed 7.5 hours/week
- **Senior Care Options (SCO)**: SCO is a regional program with significant geographic variation—five different providers serve different county combinations, and substantial portions of Massachusetts have no coverage. Eligibility is binary (you either qualify or don't) rather than tiered, but benefits may vary slightly by provider. The program uniquely integrates two separate government programs (Medicare and Medicaid/MassHealth) into one coordinated plan. Asset limits are strict but vary for married couples. Functional need assessment is required only for long-term care access via specific waivers, not for all applicants. Processing timelines and specific forms are not detailed in public sources.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Massachusetts?
