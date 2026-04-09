# Connecticut Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.110 (22 calls, 1.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 20 |
| Programs deep-dived | 18 |
| New (not in our data) | 11 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 11 programs
- **financial**: 6 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### HUSKY C

- **income_limit**: Ours says `$1370` → Source says `$851` ([source](https://portal.ct.gov/dss/knowledge-base/articles/healthcare-coverage/husky-c))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Medicaid health care services including long-term services and supports (LTSS) such as home/community-based services, residential/skilled nursing facilities, Medicaid for Employees with Disabilities. Covers variety of health care services (specifics in benefit overview on ct.gov)[3][6][9].` ([source](https://portal.ct.gov/dss/knowledge-base/articles/healthcare-coverage/husky-c))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/knowledge-base/articles/healthcare-coverage/husky-c`

### Connecticut Home Care Program for Elders (CHCPE)

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Varies by category: State-funded typically covers adult day care and 10-20 hours/week[6]; Medicaid waiver may cover up to 70 hours/week or live-in care[6]. Services include medical and non-medical support to avoid institutionalization[7]` ([source](https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe/eligibility[5]))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe/eligibility[5]`

### Connecticut PACE Programs

- **income_limit**: Ours says `$1370` → Source says `$75` ([source](https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[4]; https://www.cga.ct.gov/2022/rpt/pdf/2022-R-0010.pdf (CT legislative report)[6]))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `All-inclusive medical, social, and long-term care services including primary care, hospital care, prescription drugs, physical therapy, occupational therapy, social services, adult day care, home care, transportation, personal care, meals, and interdisciplinary team coordination. No deductibles or copays for PACE-provided services once enrolled[1][2][4].` ([source](https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[4]; https://www.cga.ct.gov/2022/rpt/pdf/2022-R-0010.pdf (CT legislative report)[6]))
- **source_url**: Ours says `MISSING` → Source says `https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[4]; https://www.cga.ct.gov/2022/rpt/pdf/2022-R-0010.pdf (CT legislative report)[6]`

### Connecticut Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1400` → Source says `$2,807` ([source](https://portal.ct.gov/dss/health-and-home-care/medicare-savings-program/medicare-savings-program[3][9]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance/copayments for Medicare-covered services (acts like Medigap up to Medicaid rates); auto-qualifies for Extra Help (Part D low copays ~$few dollars/month)[1][3][4][6]. **SLMB**: Pays Medicare Part B premiums only[1][2][5]. **QI/ALMB**: Pays Medicare Part B premiums only (finite block-grant funding)[1][2][5]. Providers cannot bill QMB enrollees for Medicare cost-sharing[2].` ([source](https://portal.ct.gov/dss/health-and-home-care/medicare-savings-program/medicare-savings-program[3][9]))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/health-and-home-care/medicare-savings-program/medicare-savings-program[3][9]`

### Connecticut SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://portal.ct.gov/dss/snap/supplemental-nutrition-assistance-program---snap))
- **income_limit**: Ours says `$1980` → Source says `$2608,` ([source](https://portal.ct.gov/dss/snap/supplemental-nutrition-assistance-program---snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for groceries/farmers markets. Amount based on net income (roughly $100 more net income = $30 less benefits). Minimum/maximum allotments vary by household size; e.g., example 2-person elderly/disabled: $415/month after deductions.[1][6]` ([source](https://portal.ct.gov/dss/snap/supplemental-nutrition-assistance-program---snap))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/snap/supplemental-nutrition-assistance-program---snap`

### Connecticut Energy Assistance Program (CEAP)

- **income_limit**: Ours says `$2800` → Source says `$47,764` ([source](https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Basic benefit: $295-$595 standard, or $345-$645 if vulnerable household member (e.g., elderly, disabled, child under 6); Crisis benefit: $425 (up to 3 per year) for deliverable fuel households in crisis; Rental assistance (heat included in rent): $75-$125. Payments to utility/fuel vendor; additional fuel deliveries, payment plans, shut-off protection, heating repairs possible. Varies by household size, income, heating source, vulnerable status.` ([source](https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating`

### Connecticut Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite care, caregiver training, counseling, support groups, supplemental services (e.g., assistive devices, home modifications). Funded via National Family Caregiver Support Program (NFCSP) and Connecticut Statewide Respite Care Program (CSRCP). No fixed dollar amounts or hours specified; services tailored via assessment. Care recipient must have identified caregiver.[1][3][6][8]` ([source](https://www.myplacect.org/family-caregivers/national-family-caregiver-support-program/[1]))
- **source_url**: Ours says `MISSING` → Source says `https://www.myplacect.org/family-caregivers/national-family-caregiver-support-program/[1]`

## New Programs (Not in Our Data)

- **Connecticut Weatherization Assistance Program (WAP)** — service ([source](https://portal.ct.gov/DEEP/Energy/Weatherization/Weatherization-in-Connecticut))
  - Shape notes: Eligibility tied directly to CEAP (60% SMI, requires 211 lookup for tables); priority tiers for vulnerable groups like elderly; administered regionally by CAAs with max spend caps varying by single vs. multi-family.
- **Connecticut Meals on Wheels** — service ([source](https://portal.ct.gov/ads/programs-and-services/senior-nutrition-program[6]))
  - Shape notes: Decentralized by region with local providers; no uniform income/asset tests but priority-based; homebound/60+ core across all, varies by delivery zones and assessment processes
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (U.S. DOL); CT-specific: https://portal.ct.gov (via aging services PDF)[2][4]))
  - Shape notes: National program with CT administered by non-profit grantee A4TD (not state agency); income at 125% FPL (household-based, annual federal table); priority tiers heavily influence access; 20 hr/wk fixed training wage at min wage; subgrantee network may create local access points.
- **Connecticut Legal Assistance Program for Elders** — service ([source](https://portal.ct.gov/LTCOP/Your-Legal-Rights))
  - Shape notes: Decentralized network of regional providers funded via Older Americans Act; no statewide uniform eligibility table or central application; services tiered by legal issue and provider focus.
- **Congregate Housing Services Program (CHSP)** — service ([source](https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/more-independent-living-resources/congregate-housing-program[5]))
  - Shape notes: Restricted to residents of specific participating housing sites in Eastern/Western CT regions; eligibility hinges on housing residency + ADL needs; services vary by assessed need and site; HUD-funded with state partnership but no precise income/asset tables available.
- **Connecticut Private Pay Assisted Living Pilot Program** — financial ([source](https://portal.ct.gov/-/media/Departments-and-Agencies/DSS/Health-and-Home-Care/Community-Options/Private-Pay-Assisted-Living-Pilot.pdf))
  - Shape notes: Tied to CHCPE eligibility; service packages tiered by weekly personal care hours; limited to specific participating assisted living communities (fewer than 35); no statewide coverage.
- **Property Tax Credit for Elderly/Disabled** — financial ([source](https://portal.ct.gov/opm/igpp/grants/tax-relief-grants/homeowners–elderlydisabled-circuit-breaker-tax-relief-program[6]))
  - Shape notes: State base program with graduated income scale up to fixed max credit; extensive local variations in income/asset limits, residency, and supplemental credits administered by 169 town assessors
- **Renters’ Rebate for Elderly/Disabled** — financial ([source](https://portal.ct.gov/OPM/IGPP/Grants/Tax-Relief-Grants/Renters–Rebate-For-ElderlyDisabled-Renters-Tax-Relief-Program))
  - Shape notes: Statewide but locally administered; income thresholds updated annually per CGS 12-170e; rebate formula uses graduated scale with rent/utilities ratio
- **Connecticut Statewide Respite Care Program** — service ([source](https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/healthy-living-services/connecticut-statewide-respite-care or https://eregulations.ct.gov/eRegsPortal/Browse/getDocument?guid=%7B30A0E155-0200-C294-AF6B-15887B1A99E2%7D (Regulations of CT State Agencies Sec. 17b-349e-1 to 17b-349e-9)[1][7]))
  - Shape notes: Statewide but locally administered via AAAs/sponsor agencies by town; financial eligibility fixed per individual (no household size adjustment); benefits tiered by need/priority with funding caps; requires specific dementia diagnosis certification; self-directed hiring option unique.
- **CHOICES Program** — service ([source](https://portal.ct.gov/ADS-CHOICES or https://portal.ct.gov/ADS/programs-and-services/choices[5][10]))
  - Shape notes: Statewide SHIP via 5 AAAs; no income/asset test for counseling; links to tiered programs like MSP (income-only, no assets) and MED-CONNECT ($85k cap, applicant-only income)
- **Money Follows the Person (MFP) Program** — service ([source](https://portal.ct.gov/DSS/Health-And-Home-Care/Money-Follows-the-Person-Program/Money-Follows-the-Person-Program))
  - Shape notes: Requires prior 3-month institutionalization and Medicaid eligibility; benefits via individualized HCBS waiver packages (not fixed amounts); potential waitlists due to slot limits; statewide but transition-focused.

## Program Details

### HUSKY C


**Eligibility:**
- Age: 65+
- Income: Varies by program part and household size. General single person: $851/month. Seniors/disabled single: under $10,020 annually (~$835/month). Couple: under $13,536 annually (~$1,128/month), though one source lists $3,536 (likely monthly). LTSS single: $2,982/month. Limits updated annually in March and may vary by geographic area[3][4][5].
- Assets: Single: $1,600. Couple: $2,400. Countable assets include cash, stocks, bonds, investments, IRAs, promissory notes, credit union/savings/checking accounts, real estate not resided in. Exemptions not detailed in sources. LTSS single: $1,600. Five-year income/asset review for LTSS if no prior DSS benefits. Proposals to increase to $5,000 single/$7,500 couple as of 2026[3][4][5].
- Connecticut resident
- U.S. citizen or qualified non-citizen (5-year wait for some immigrants, except refugees/asylees)
- Blind or disabled (ages 18-64) or age 65+
- For some: paid worker (part-time/full-time) with disability
- Spend-down available if over limits via medical expenses

**Benefits:** Medicaid health care services including long-term services and supports (LTSS) such as home/community-based services, residential/skilled nursing facilities, Medicaid for Employees with Disabilities. Covers variety of health care services (specifics in benefit overview on ct.gov)[3][6][9].
- Varies by: priority_tier

**How to apply:**
- Online: Access Health CT (accesshealthct.com)
- Phone: 1-855-805-4325 (Access Health CT for A/B/D; DSS for C specifics)
- Department of Social Services (DSS)
- Apply even if over limits due to spend-down

**Timeline:** Not specified in sources

**Watch out for:**
- Asset test applies (unlike HUSKY A/B/D); low limits ($1,600 single) often disqualify
- Varies by HUSKY C part (e.g., LTSS has higher income limit but strict review)
- Geographic variations in limits; spend-down requires high medical expenses
- Entitlement program but low thresholds; apply anyway for assessment
- 5-year immigrant wait (exceptions apply)
- Annual updates to limits in March

**Data shape:** Eligibility varies by sub-part (general aged/blind/disabled vs LTSS), household size, geography; asset limits unique to HUSKY C; spend-down option; statewide but regional limit variations

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/knowledge-base/articles/healthcare-coverage/husky-c

---

### Connecticut Home Care Program for Elders (CHCPE)


**Eligibility:**
- Age: 65+
- Income: {"overview":"Income limits vary by program category (state-funded vs. Medicaid-funded)","state_funded_category_2":"No income limit; cost of care calculated on sliding fee scale[7]","medicaid_funded_category_3":"150% of Federal Poverty Level (FPL); in 2025 this equals $1,956.25/month[4]. For Medicaid waiver portion specifically, income typically limited to $2,742.00/month or less[1]","note":"If married, only the applicant's income counts; spouse's income does not count[2]"}
- Assets: {"overview":"Asset limits vary by income level and marital status[7]","medicaid_waiver_example":"Single person with assets under $1,600 may qualify[6]","exempt_assets":"Primary residence and essential personal items are exempt[1]","note":"Medicaid-funded CHCPE includes a 5-year lookback financial audit[6]"}
- Must be a Connecticut resident[1][2]
- Must be 'at risk of nursing home placement' OR meet nursing home level of care[2][4]
- At-risk status means requiring assistance with at least 1 Activity of Daily Living (ADL) for state-funded; 3+ ADLs for nursing facility level of care[4]
- ADLs include: bathing, dressing, eating, toileting, transferring (getting in/out of bed), taking medications[1][4]

**Benefits:** Varies by category: State-funded typically covers adult day care and 10-20 hours/week[6]; Medicaid waiver may cover up to 70 hours/week or live-in care[6]. Services include medical and non-medical support to avoid institutionalization[7]
- Varies by: priority_tier

**How to apply:**
- Online: Complete Request Form at https://www.ascendami.com/CTHomeCareForElders/default/[8]
- Phone: Contact local Area Agency on Aging or Connecticut Department of Social Services (DSS)[1]
- In-person: Visit local Area Agency on Aging or DSS office[1]
- Mail: Submit application materials to local DSS office (specific address varies by region)

**Timeline:** Health screen review completed within 48 hours of submission[8]; full application processing timeline not specified in available sources
**Waitlist:** Medicaid waiver programs for younger people typically have 2+ year waiting lists; specific waitlist status for CHCPE not detailed in search results

**Watch out for:**
- Income limits differ dramatically by category: state-funded has NO income limit, but Medicaid-funded is capped at ~$1,956/month (2025 figures)[4][7]
- For Medicaid waiver (Category 3), a 5-year lookback financial audit applies—same rules as nursing home Medicaid[6]
- If married, only applicant's income counts toward limit, but this can affect asset calculations[2]
- Even with low income, Medicaid waiver qualification is 'challenging' due to asset limits and lookback rules[6]
- Cost-sharing is mandatory: participants may be required to pay 9% cost share or applied income[3]
- Program is designed to keep people at home instead of nursing facilities—functional need (ADL assistance) is as important as financial eligibility[1][2]
- State-funded CHCPE (Category 2) has no income limit but uses sliding fee scale; higher-income seniors can still access services but pay more[7]
- Applicants must demonstrate physical need for hands-on assistance with ADLs—not just general frailty[3]

**Data shape:** CHCPE is structured as three distinct categories with different funding sources (respite, state-funded, Medicaid-funded), each with different income/asset limits and service levels. Income limits vary significantly by category. State-funded has no income cap but uses sliding fees; Medicaid-funded has strict income/asset limits plus 5-year lookback. Functional eligibility (ADL need) is required for all categories. Application is decentralized through local Area Agencies on Aging, so processing may vary by region. Cost-sharing is mandatory for some participants.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe/eligibility[5]

---

### Connecticut PACE Programs


**Eligibility:**
- Age: 55+
- Income: No income limits or financial criteria for PACE eligibility. Medicaid eligibility (if applicable for full coverage) has separate limits, e.g., for 2026 single nursing home applicants: income under nursing home care cost with $75 personal needs allowance; assets under $1,600[3].
- Assets: No asset limits for PACE eligibility. Medicaid-related asset rules may apply separately (e.g., under $1,600 for single nursing home applicants in 2026)[3]. What counts/exempts follows standard Medicaid rules, not specified for PACE.
- Live in the service area of a Connecticut PACE organization
- Certified by Connecticut as needing nursing home level of care (NHLOC)
- Able to live safely in the community with PACE services
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice
- Voluntary enrollment; average participant is 76 with multiple chronic conditions, ~90% dually eligible for Medicare/Medicaid[1][2][4]

**Benefits:** All-inclusive medical, social, and long-term care services including primary care, hospital care, prescription drugs, physical therapy, occupational therapy, social services, adult day care, home care, transportation, personal care, meals, and interdisciplinary team coordination. No deductibles or copays for PACE-provided services once enrolled[1][2][4].
- Varies by: region

**How to apply:**
- Contact local PACE organization (find via Medicare.gov PACE finder or state resources)
- Phone: Use Medicare.gov or state aging department for local numbers (specific CT numbers not in results)
- No specific CT online URL, phone, mail, or in-person listed; start by locating CT PACE provider

**Timeline:** Not specified in sources
**Waitlist:** Possible waitlists depending on local program capacity (not detailed for CT)

**Watch out for:**
- Not statewide—must live in a PACE service area; limited availability in CT
- Requires state certification for nursing home level of care, even if living at home
- Cannot be in Medicare Advantage, hospice, or certain other plans
- Private pay option via monthly premium if not Medicaid-eligible, but costs not specified
- Often pushed toward dual Medicare/Medicaid eligibility for full coverage and easier paperwork[5]
- Separate from ConnPACE (pharma program for 65+)[7]

**Data shape:** No financial eligibility for PACE itself (unlike Medicaid); restricted to specific regional PACE centers in CT with NHLOC certification required; benefits comprehensive but enrollment voluntary and community-based only

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[4]; https://www.cga.ct.gov/2022/rpt/pdf/2022-R-0010.pdf (CT legislative report)[6]

---

### Connecticut Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Effective March 1, 2026 (no asset test in CT):
- **QMB** (211% FPL): Single $2,807/month, Couple $3,806/month[1][3][5]
- **SLMB** (231% FPL): Single $3,073/month, Couple $4,166/month[5]
- **QI/ALMB** (246% FPL): Single $3,272/month, Couple $4,437/month[5]
Note: Income limits update annually around April 1; active TFA-eligible households may qualify up to 100% FPL for QMB[4]. Limits are for household size (single or couple); larger households scale accordingly based on FPL multiples[5].
- Assets: No asset limit in Connecticut for any MSP (QMB, SLMB, QI)[2][4][5]. No countable resources required.
- Must be enrolled in Medicare Part A and/or B[1][2][3].
- U.S. citizen or qualified immigrant[2].
- Reside in Connecticut[9].

**Benefits:** **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance/copayments for Medicare-covered services (acts like Medigap up to Medicaid rates); auto-qualifies for Extra Help (Part D low copays ~$few dollars/month)[1][3][4][6]. **SLMB**: Pays Medicare Part B premiums only[1][2][5]. **QI/ALMB**: Pays Medicare Part B premiums only (finite block-grant funding)[1][2][5]. Providers cannot bill QMB enrollees for Medicare cost-sharing[2].
- Varies by: priority_tier

**How to apply:**
- Online: CONNCare portal at https://conncare.ct.gov/ (or MyPlaceCT.org)[1][9]
- Phone: 1-877-584-7DSS (1-877-584-7377) for Dept. of Social Services[9]
- Mail: Download form H11 from portal.ct.gov/dss and mail to local DSS office[3][9]
- In-person: Local Department of Social Services (DSS) office (find via 211ct.org or portal.ct.gov/dss)[5][9]

**Timeline:** Usually starts month after application; SLMB/QI retroactive up to 3 months prior in some cases[10].
**Waitlist:** QI/ALMB only: Not entitlement; applications denied when funds exhausted (block grant limits)[1][2][5]. QMB/SLMB have no waitlist.

**Watch out for:**
- QI/ALMB funding exhausts annually—apply early in calendar year as denials occur when block grant runs out[1][2][5].
- Income limits change April 1 yearly; verify current via DSS[2].
- QMB protects from provider billing for Medicare cost-sharing, but non-covered services may still bill[2].
- Auto-enrolls in Extra Help (Part D) only for QMB, not SLMB/QI[4][6].
- No asset test in CT (unlike some states), but must prove income accurately[2][4].
- SLMB/QI benefits may be retroactive 3 months, but QMB starts post-application[10].

**Data shape:** Tiered by income (QMB lowest tier, broadest benefits; QI highest tier, Part B only, funding-capped); no asset test (CT-specific generosity); household size via FPL multiples (single/couple shown); statewide uniform.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/health-and-home-care/medicare-savings-program/medicare-savings-program[3][9]

---

### Connecticut SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For Oct. 1, 2025 through Sept. 30, 2026, most households must meet a gross income limit of 200% FPL and net income limit of 100% FPL. Households with a member 60+ or disabled are exempt from gross income test and only need to meet net income (100% FPL) if over gross limit. Gross income limits (monthly): 1: $2608, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, +$916 each additional. Net income limits (100% FPL, monthly): 1: $1255, 2: $1704, 3: $2152, 4: $2600, 5: $3049, +$449 each additional. Deductions (e.g., shelter, medical) reduce countable income. Social Security, pensions, VA benefits count as income.[1][3][4]
- Assets: No asset limit in Connecticut for standard eligibility. Home and vehicles exempt. If household has member 60+ or disabled and fails gross income test, may qualify under federal rules with $4500 asset limit (countable resources like bank accounts).[1]
- Connecticut resident.
- U.S. citizen or qualified non-citizen.
- Able-bodied adults (with exceptions) must register for work.
- Household includes those who buy/cook food together; spouses/children under 22 always included.
- Changes post-Nov 2025: ABAWD work requirements extend to age 64, exemptions narrowed (e.g., children under 14 only).[3][5]

**Benefits:** Monthly EBT card for groceries/farmers markets. Amount based on net income (roughly $100 more net income = $30 less benefits). Minimum/maximum allotments vary by household size; e.g., example 2-person elderly/disabled: $415/month after deductions.[1][6]
- Varies by: household_size

**How to apply:**
- Online: www.connect.ct.gov
- Phone: 2-1-1 or 877-423-4746 (DSS Connect-icut line)
- In-person: Local DSS offices (find via portal.ct.gov/dss)
- Mail: Download form from portal.ct.gov/dss/snap and mail to local office

**Timeline:** Typically 30 days; expedited for urgent cases within 7 days if qualify.

**Watch out for:**
- Elderly/disabled households get leniency on gross income but may face federal asset test ($4500) if over gross limit.[1]
- Household definition includes food-sharing members, not just legal family.[4]
- High shelter/medical deductions often key for seniors to qualify.[3]
- Post-2025 work rules stricter for ages 55-64 (ABAWD expansions).[5]
- Many eligible seniors miss out; check even with home/savings.[2]

**Data shape:** Benefits scale by household size and net income with deductions; expanded eligibility (200% gross FPL, no asset limit standard); special elderly/disabled rules skip gross income test; statewide uniform.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/snap/supplemental-nutrition-assistance-program---snap

---

### Connecticut Energy Assistance Program (CEAP)


**Eligibility:**
- Income: Annual household income at or below 60% of state median income: 1: $47,764; 2: $62,460; 3: $77,157; 4: $91,854; 5: $106,550; 6: $121,247; 7: $124,002; 8: $126,758. Categorical eligibility if household receives SNAP, SSI, TANF/TFA, State Supplement, or Refugee Cash Assistance.
- Assets: No liquid assets test for the 2025-2026 program year.
- Connecticut resident
- Social Security Number required for almost all household members (exceptions may apply)
- Proof of income if not categorically eligible: last 30 days or 4 consecutive weeks in last 3 months, or 12 months prior; self-employed need IRS Form 1040 and worksheet

**Benefits:** Basic benefit: $295-$595 standard, or $345-$645 if vulnerable household member (e.g., elderly, disabled, child under 6); Crisis benefit: $425 (up to 3 per year) for deliverable fuel households in crisis; Rental assistance (heat included in rent): $75-$125. Payments to utility/fuel vendor; additional fuel deliveries, payment plans, shut-off protection, heating repairs possible. Varies by household size, income, heating source, vulnerable status.
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online via portal.ct.gov/dss (application window open for 2025-2026)
- Phone: Regional providers e.g. New Opportunities (203) 756-8151 Waterbury, (203) 235-0278 Meriden, (860) 496-0622 Torrington, (860) 738-9138 Winsted; call 211 for local provider
- In-person/mail via regional community action agencies (contact 211ct.org for locations)

**Timeline:** Prioritized service for deliverable fuel crisis: fuel delivery authorization within 18 hours of eligibility determination; standard processing not specified but applications from Sep/Oct to May/June.
**Waitlist:** Benefits available until annual funds run out; no formal waitlist mentioned.

**Watch out for:**
- Must apply during season (gas/electric: Sep 1, 2025-May 29, 2026; deliverable fuels longer); funds limited and may run out
- Everyone needs electric bill; gas/deliverable fuel needs heating bill
- Vulnerable households (elderly, disabled, young children) get higher benefits—don't miss declaring this
- SSN required unless exception; Social Security income needs award letter as DSS can't verify directly
- Renters with heat included get smaller rental benefit only

**Data shape:** Benefits scale by household size, income, heating source (deliverable fuels get crisis extras), and vulnerable status; no asset test; regionally administered with local providers; seasonal with fund limits

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating

---

### Connecticut Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: 60% of State Median Income (SMI), using the same criteria as the Connecticut Energy Assistance Program (CEAP). Also eligible if at or below 200% Federal Poverty Level, receiving cash assistance under Titles IV and XVI of the Social Security Act, or qualified through HUD means-tested programs. For multi-family dwellings, at least two-thirds of tenants must be income-eligible. Priority to elderly (60+), persons with disabilities, families with children under 6, high-energy users, and households with high energy burden (6%+ of income on energy). Exact dollar amounts not specified in sources; refer to current CEAP guidelines for SMI table by household size.
- Assets: No asset limits mentioned.
- Home not weatherized by WAP, LIHEAP, HUD, or USDA in the last 15 years.
- Home not for sale/listed for sale within 6 months of work completion, not in foreclosure or loan mediation.
- Renters eligible; landlords may contribute 20% of material costs up to $500 per household.

**Benefits:** No-cost weatherization services including energy audits (up to 4 hours), heating system tune-ups/repairs, blower door guided air-sealing, attic/sidewall insulation, health/safety inspections, and repairs. Single-family max spend: $10,000 energy measures + $2,500 health/safety + $2,500 incidental repairs (total $15,000 without extra review). Multi-family max: $10,000 energy + $1,500 health/safety + $2,500 incidental.
- Varies by: priority_tier

**How to apply:**
- Joint application through Connecticut Energy Assistance Program (CEAP): Call 2-1-1 for local intake site and request Weatherization Card or Referral Form.
- Email directly: DEEP.Weatherization@ct.gov
- Through local Community Action Agencies (CAAs) or non-profits via 2-1-1.

**Timeline:** Not specified; energy audit up to 4 hours once approved.
**Waitlist:** Possible deferrals leading to programs like REPS; regional wait times vary but not detailed.

**Watch out for:**
- Uses CEAP eligibility (call 2-1-1 for current income tables; not explicitly listed here).
- Home must not have been weatherized in past 15 years or be in sale/foreclosure process.
- Landlords of renters may need to contribute up to $500.
- Priority groups get preference; high demand may cause deferrals to other programs like REPS.
- Does not cover energy bills (separate from heating assistance).

**Data shape:** Eligibility tied directly to CEAP (60% SMI, requires 211 lookup for tables); priority tiers for vulnerable groups like elderly; administered regionally by CAAs with max spend caps varying by single vs. multi-family.

**Source:** https://portal.ct.gov/DEEP/Energy/Weatherization/Weatherization-in-Connecticut

---

### Connecticut Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income or asset limits; priority given to those with greatest social and economic need when demand exceeds funding[6]. Some local providers may have maximums (e.g., New Opportunities[8]), but not universally applied.
- Assets: No asset limits or tests mentioned across sources; primary focus is on homebound status and need[6][7].
- Homebound and unable to prepare meals, shop, or attend congregate sites[1][2][3][4][6]
- Spouse of participant or certain disabled individuals under 60 may qualify[1][2][6][8]
- Assessment by program staff, agency on aging, or medical professional (e.g., doctor diet order)[1][3]
- Reside in specific provider service areas (not statewide uniform)[1][3][8]
- Lacks family/friend support or transportation[4]

**Benefits:** One hot lunch delivered daily (10am-1pm typical); optional cold dinners, double meals, special diets (e.g., low sodium, diabetic, renal); emergency shelf-stable/frozen meals[1][3][8]. Suggested donation $3/meal, no mandatory fee[7].
- Varies by: region

**How to apply:**
- Contact local provider or Area Agency on Aging by phone (e.g., CRT: (860) 560-5848[3])
- Referrals from doctors, hospitals, VNAs, social services[3]
- In-person interview/home visit for assessment[3]
- Federal Form 5 for some programs (e.g., Middletown)[7]

**Timeline:** Within 2 days after approval (e.g., CRT[3]); varies, some within a week[2]
**Waitlist:** Possible when demand exceeds funding, priority to greatest need[6]

**Watch out for:**
- Not a single statewide program—must contact local provider for your area; verify service zone first[2][5]
- Homebound assessed strictly (e.g., by staff or doctor); car ownership or family support may disqualify[2][4]
- No guaranteed service if funding-limited; waitlists common, priority not first-come[6]
- Suggested donation expected, though no income test[7]
- Younger disabled or spouses qualify only in some areas[1][6]

**Data shape:** Decentralized by region with local providers; no uniform income/asset tests but priority-based; homebound/60+ core across all, varies by delivery zones and assessment processes

**Source:** https://portal.ct.gov/ads/programs-and-services/senior-nutrition-program[6]

---

### Connecticut Caregiver Support Program


**Eligibility:**
- Income: No strict income limits specified across sources; priority given to low-income caregivers and those with greatest social/economic need. Some regional applications reference income tiers (e.g., 80% FPL: $3,644-$4,164; over 400%: $4,165+ or $4,531+), but not as hard cutoffs. Specific dementia respite may cap care recipient income at $46,897/year.[3][6][8]
- Assets: Generally no asset limits for core NFCSP; one regional form notes dementia care recipient limit of $124,679 liquid assets.[6]
- Caregiver: Age 18+ caring for person 60+ or any age with Alzheimer's/related disorder; OR grandparent/relative (not parent) age 55+ caring full-time for child <18 or adult 19-59 with disabilities.[1][3][8]
- Care recipient: Needs assistance with ≥2 ADLs (bathing, dressing, toileting, eating, etc.); OR cognitive/mental impairment needing supervision; OR Alzheimer's/related regardless of age; OR adult child 18-59 with disabilities; OR child <18 cared for by relative (not parent).[3][6][8]
- Priority: Greatest social/economic need, low-income, full-time care for severely disabled adults.[1][3][8]

**Benefits:** Respite care, caregiver training, counseling, support groups, supplemental services (e.g., assistive devices, home modifications). Funded via National Family Caregiver Support Program (NFCSP) and Connecticut Statewide Respite Care Program (CSRCP). No fixed dollar amounts or hours specified; services tailored via assessment. Care recipient must have identified caregiver.[1][3][6][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) via MyPlaceCT.org (https://www.myplacect.org/family-caregivers/national-family-caregiver-support-program/); regional applications like NFCSP/CSRCP forms from AAAs (e.g., North Central AAA, WCAAA, Touchpoints).[1][3][6][8]
- Phone: Varies by regional AAA (not centralized number listed).
- In-person/mail: Submit to local AAA/provider (e.g., WCAAA, Touchpoints at Chestnut).

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; priority-based allocation may imply waits for non-priority.[3][8]

**Watch out for:**
- Not a paid caregiver program (unlike AFL, PCA Waiver, CHCPE in sources); provides support services to caregivers, not stipends.[1][2][4][7]
- Must have identified caregiver; services only for eligible informal caregivers providing in-home/community care.[6][8]
- Priority-based: Low-income/greatest need first; others may be waitlisted/denied.[3][8]
- Regional AAAs handle intake—must contact local one, not centralized.[1][3]
- Dementia-specific caps (income/assets) in some forms may not apply broadly.[6]
- Excludes formal paid providers; for family/informal only.[3][8]

**Data shape:** Administered via 8 regional AAAs with minor eligibility/form variations; priority-tiered services (no fixed hours/dollars); no universal income/asset test but low-income priority; distinct from paid family caregiving Medicaid waivers (AFL, CHCPE).

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.myplacect.org/family-caregivers/national-family-caregiver-support-program/[1]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set by federal guidelines (e.g., for 2026, consult current HHS Poverty Guidelines; not specified in sources for CT). Applies to full household income.[1][2][4][7]
- Assets: No asset limits mentioned in sources.
- Unemployed
- U.S. citizen or authorized to work
- Priority: Veterans and qualified spouses first, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users.[1][2]

**Benefits:** Part-time paid on-the-job training (average 20 hours/week) at non-profits/public facilities (e.g., schools, hospitals, senior centers, day-cares). Paid highest of federal/state/local minimum wage (bi-weekly in some cases). Includes career assessment, Individual Employment Plan, supportive services, specialized skills training, job placement assistance to unsubsidized jobs. Career tracks: home health aide, food service, customer service, office administration, stock clerk, retail sales.[2][3][4]
- Varies by: priority_tier

**How to apply:**
- Phone: Associates for Training and Development (A4TD) at 203-461-2154 (Stamford, CT office serving CT)
- Website: www.a4td.org
- In-person: Associates for Training and Development, Stamford, CT 06831
- Possibly through local American Job Centers or subgrantees (contact A4TD for CT-specific partners)

**Timeline:** Not specified in sources.
**Waitlist:** Likely due to funding limits and priority enrollment; not explicitly detailed for CT.

**Watch out for:**
- Transitional program only—positions temporary, not permanent jobs; 'bridge' to unsubsidized employment.
- Strict priority tiers may delay non-priority applicants (e.g., non-veterans under 65).
- Must be unemployed at enrollment; income counted for full family/household.
- Funded 90% federal/10% match; limited slots (~7,000 nationally).
- No asset test, but full income verification required.[1][2][3]

**Data shape:** National program with CT administered by non-profit grantee A4TD (not state agency); income at 125% FPL (household-based, annual federal table); priority tiers heavily influence access; 20 hr/wk fixed training wage at min wage; subgrantee network may create local access points.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. DOL); CT-specific: https://portal.ct.gov (via aging services PDF)[2][4]

---

### Connecticut Legal Assistance Program for Elders

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Low-income status required, typically at or below 125-150% of federal poverty guidelines (exact dollar amounts not specified in sources; varies by program component, e.g., CVLC at less than 150% FPG). No full household size table provided.
- Assets: Limited income and assets required for some components (e.g., Hartford program); specific counts/exemptions not detailed.
- Low-income individuals
- Residents of specific regions for certain providers (e.g., south central CT for NHLA)
- Consumer legal problems for CLPE
- Veterans for CVLC

**Benefits:** Free legal advice, brief services, full representation, policy advocacy, community education, and referrals to low-cost attorneys; specific to elder law, consumer issues, Medicare appeals, veteran matters.
- Varies by: priority_tier

**How to apply:**
- Phone: Varies by provider (e.g., NHLA via AOASCC referral, CLPE hotline 800-296-1467, CVLC via collaboration sites, CT Lawyers Legal Aid to the Elderly 860-273-8164)
- In-person: Regional offices (e.g., New Haven Legal Assistance, Waterbury Connecticut Legal Services)
- Website: portal.ct.gov/LTCOP/Your-Legal-Rights for resources

**Timeline:** Not specified

**Watch out for:**
- Not a single centralized program but a network of funded providers; eligibility and services vary by region/provider (e.g., consumer-only for CLPE, veterans for CVLC); must contact specific local agency; no uniform income/asset tables published; some require Area Agency on Aging referral.

**Data shape:** Decentralized network of regional providers funded via Older Americans Act; no statewide uniform eligibility table or central application; services tiered by legal issue and provider focus.

**Source:** https://portal.ct.gov/LTCOP/Your-Legal-Rights

---

### Congregate Housing Services Program (CHSP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: Low-income requirements apply with income/asset restrictions, but specific dollar amounts and household size tables not detailed in available sources[1][2][5].
- Assets: Asset restrictions apply, but specific limits, what counts as assets, and exemptions not detailed in available sources[1][2].
- Must reside in a participating federally subsidized or state-financed senior housing site[2][3][4][5].
- Need assistance with at least three activities of daily living (ADLs) as defined in federal regulations, or temporary/periodic difficulties with one or more essential ADLs[1][2][3][4].
- Frail elderly (62+), disabled, or temporarily disabled persons[3][4][5].

**Benefits:** Supportive services including care planning/coordination/monitoring, congregate meals (at least one hot meal per day in group setting, 7 days/week), housekeeping, 24-hour security/emergency call systems, home health aides, foot care, companion services, transportation, personal emergency response systems (e.g., Lifeline), social/recreational activities; private apartments with kitchen/bath in some sites[1][2][3][5][6].
- Varies by: need|housing_site

**How to apply:**
- Contact regional Area Agency on Aging: Senior Resources (Eastern CT) at 860-887-3561; Western Connecticut Area Agency on Aging at 203-757-5449[5].
- Contact specific housing sites, e.g., Cheshire/Orange CT: 203-891-8265 or 800-842-9710; Hartford CT: 860-724-4212; Manchester CT: 860-643-2163; Danielson CT: 860-774-6067; Norwalk CT: 203-838-8471[1].
- Care plan developed by Resident Services Coordinator after assessment[2].

**Timeline:** Not specified in sources.

**Watch out for:**
- Must already live (or qualify to live) in a specific participating federally subsidized/state-financed senior housing site—not standalone services[2][3][4][5].
- Not for those needing full supervision, three meals/day, daily in-unit assistance, or extensive healthcare; aimed at basically self-sufficient individuals with moderate needs[6].
- Fees required from participants (at least 10% up to 20% of adjusted income); not fully free[3][4].
- No specific income/asset dollar limits or processing times detailed publicly—contact sites directly[1].
- Facilities not licensed for medication dispensing or nursing services[6].

**Data shape:** Restricted to residents of specific participating housing sites in Eastern/Western CT regions; eligibility hinges on housing residency + ADL needs; services vary by assessed need and site; HUD-funded with state partnership but no precise income/asset tables available.

**Source:** https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/more-independent-living-resources/congregate-housing-program[5]

---

### Connecticut Private Pay Assisted Living Pilot Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Must qualify financially for the Connecticut Home Care Program for Elders (CHCPE), which includes income assessment leading to mandatory 9% cost share or applied income payments. Specific dollar amounts not detailed in sources; refers to CHCPE criteria.[1][6]
- Assets: Unmarried: less than $36,270. Married: less than $48,380. Spousal assessment protection exemption may allow qualification above limits.[2][4]
- Must qualify functionally for CHCPE (at risk of nursing home placement, needing assistance with bathing, dressing, eating, medications, toileting).
- Must reside in a participating Managed Residential Community (MRC) served by a participating Assisted Living Service Agency (ALSA).[1][6]

**Benefits:** Funding for assisted living services (personal care, nursing care) up to approximately $2,360-$2,900 monthly, based on Service Package Levels determined by weekly hours of personal care needed. Does not cover room and board. Examples: Core services $4.41 daily (~$137 monthly); Occasional (1-3.75 hours/week) $24.02 daily (~$745 monthly). State pays assisted living home directly.[1][2][3][4]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-445-5394 or 860-424-4904[1]

**Timeline:** Not specified; after eligibility determination and slot offer, local Access Agency conducts needs assessment to develop plan of care.[1]
**Waitlist:** Subject to wait list; limited slots (e.g., participation limited to 125 seniors).[1][3]

**Watch out for:**
- Does not pay room and board—only services; residents must cover housing costs.[1]
- Mandatory 9% cost share or applied income payments.[1]
- Limited slots and participating communities; wait lists common.[1][3]
- Aid levels (e.g., ~$2,900 max) may not fully bridge costs, leading to eventual nursing home transfer if funds deplete.[3]
- Must already reside in approved facility; designed for those who spent down assets.[1]
- Different from Assisted Living Demonstration Project (covers housing, but only 4 sites).[3]

**Data shape:** Tied to CHCPE eligibility; service packages tiered by weekly personal care hours; limited to specific participating assisted living communities (fewer than 35); no statewide coverage.

**Source:** https://portal.ct.gov/-/media/Departments-and-Agencies/DSS/Health-and-Home-Care/Community-Options/Private-Pay-Assisted-Living-Pilot.pdf

---

### Property Tax Credit for Elderly/Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older (as of December 31 prior year), or 18+ and permanently/totally disabled (receiving comparable federal/state/local retirement benefits), or 50+ surviving spouse of qualified deceased homeowner (must have co-resided)+
- Income: Statewide limits updated annually by CT Office of Policy and Management; examples: 2024 - single $45,200, married $55,100[4]; 2025 New Hartford - single $43,800, married $53,400[3]. Graduated scale; exact current limits set by OPM and applied locally. Many towns add local programs with higher limits (e.g., East Hartford 2024 single $60,200/married $70,100[7]; Stamford $91,800 single/$108,000 married[8]).
- Assets: State program: None mentioned. Local programs vary (e.g., East Hartford: $100,000 excluding primary residence/tax-deferred retirement[7]; Stamford: $400,000 single/$600,000 married, excluding up to $1M equity in relief property[8]).
- Connecticut resident as of October 1 prior year, with 6+ months residency (some towns require 1 year or 15+ years like Haddam[5])
- Own property or hold life use; must be primary residence (183+ days in some areas like Stamford[8])
- Liable for property taxes on October 1
- No past due taxes in some local programs (e.g., Stamford[8])
- For disabled: Proof of permanent/total disability via Social Security or equivalent
- Local programs often require state program participation first (e.g., Haddam[5])

**Benefits:** Property tax credit up to $1,000 (single) or $1,250 (married); calculated by local assessor on graduated income scale and applied to tax bill. Local programs provide additional credits.
- Varies by: income|region

**How to apply:**
- In-person/mail at local town assessor's office (statewide requirement)
- Application period: February 1 - May 15 annually

**Timeline:** Calculated by local assessor; applied by tax collector to bill (no statewide timeline specified; varies locally)

**Watch out for:**
- Strict Feb 1-May 15 window; late applications denied
- Income includes AGI + nontaxable sources (e.g., certain Social Security)[4]
- Many miss local supplemental programs with higher limits—check town assessor after state
- Primary residence proof required; trusts need docs[8]
- Surviving spouse: Must have co-resided and deceased qualified[1]
- Local programs may cap total relief (e.g., 75% of tax[7]) or exclude if tax <7% income[7]
- Biennial in some areas like Stamford[8]

**Data shape:** State base program with graduated income scale up to fixed max credit; extensive local variations in income/asset limits, residency, and supplemental credits administered by 169 town assessors

**Source:** https://portal.ct.gov/opm/igpp/grants/tax-relief-grants/homeowners–elderlydisabled-circuit-breaker-tax-relief-program[6]

---

### Renters’ Rebate for Elderly/Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older (or spouse), or 50+ surviving spouse of qualified renter, or 18+ with Social Security Disability+
- Income: Graduated scale based on Connecticut General Statute Section 12-170e; recent examples include: single $43,800-$46,300, married $53,400-$56,500 (varies by year; includes all taxable and non-taxable income; 5% of income must not exceed 35% of total rent/utilities)
- Assets: No asset limits mentioned
- One-year Connecticut residency prior to application
- Renting apartment/room, cooperative housing, or mobile home
- Totally disabled must provide current proof (e.g., Social Security award letter, Benefit Verification Letter)
- Age/disability as of end of prior calendar year

**Benefits:** Rebate up to $700 single/$900 married; graduated based on income, prior year's rent/utilities (excl. phone); prorated if rented <1 year
- Varies by: household_size

**How to apply:**
- In-person or mail at local town assessor's office or human/social services department
- Some towns by appointment (e.g., Kent: call 860-927-1586)

**Timeline:** Not specified
**Waitlist:** Not an entitlement program (funds limited)

**Watch out for:**
- Strict April 1-September 30 filing window
- Not entitlement—funds may run out
- Income includes all sources (taxable/non-taxable)
- Must apply in current town, even if rented elsewhere prior year
- 5% income test vs. 35% rent/utilities often missed
- Proof of actual utility payments required, not just bills

**Data shape:** Statewide but locally administered; income thresholds updated annually per CGS 12-170e; rebate formula uses graduated scale with rent/utilities ratio

**Source:** https://portal.ct.gov/OPM/IGPP/Grants/Tax-Relief-Grants/Renters–Rebate-For-ElderlyDisabled-Renters-Tax-Relief-Program

---

### Connecticut Statewide Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Individual with dementia cannot exceed $58,772 annual income (2023 figure from Senior Resources); older figures include $46,897 (2019). No variation specified by household size. Caregiver must have primary responsibility and may be prioritized if experiencing physical/mental impairments[1][2][4].
- Assets: Liquid assets cannot exceed $156,253 for individual with dementia (2023); older figure $124,679 (2019). Liquid assets typically include countable cash, bank accounts, stocks; exemptions likely include primary home, one vehicle, personal belongings (inferred from standard DSS rules, not explicitly detailed for this program)[2][4].
- Diagnosis of irreversible, deteriorating dementia (e.g., Alzheimer’s, multi-infarct, Parkinson’s, Lewy Body, Huntington’s, Normal Pressure Hydrocephalus, Pick’s); requires physician certification via 'Physician Statement' form ruling out reversible causes like depression or drug interactions[1][2][4][5].
- Not receiving services from Connecticut Home Care Program for Elders[2].
- Resides in Connecticut; sponsor agency based on town of residence[1][9].
- Has identified caregiver; priority if caregiver impaired or individual combative/non-compliant[1].
- Cannot currently receive other respite care[1].

**Benefits:** Subsidizes respite services up to $7,500/year (contingent on funding and need level); services include adult day care, home health aide, personal care assistant, homemaker, companion, nursing care, personal emergency response system, short-term nursing home/assisted living (up to 30 days), cognitive fitness training; self-directed option to hire private caregiver via fiduciary; 20% co-pay required unless waived for hardship[2][3][5][6][7].
- Varies by: priority_tier

**How to apply:**
- Phone: Call 1-800-994-9422 to be directed to local Area Agency on Aging (AAA); regional examples: Senior Resources (Eastern CT) at 860-887-3561[2][7].
- In-person/mail: Submit complete application to local sponsor agency/AAA based on town of residence (e.g., Senior Resources, Touchpoints at Chestnut, WCAAA, NCAAA)[1][2][4][6][8].
- No statewide online application specified; contact local AAA for forms.

**Timeline:** Sponsor agency performs assessment and makes written eligibility determination (timeline not specified; case-by-case)[1].
**Waitlist:** Funding contingent on availability; priority to greatest need, implying possible waitlist[2][4][7].

**Watch out for:**
- Eligibility based solely on individual with dementia's finances, not caregiver's[2][5].
- Excludes those in CT Home Care Program for Elders[2].
- Funding capped and contingent; not guaranteed $7,500[2][7].
- 20% co-pay standard unless hardship waiver[2].
- Must rule out reversible dementia causes; generic 'dementia' insufficient without evaluation[1].
- Income/asset limits may update annually (figures vary across sources by year)[2][4].
- Providers cannot be spouse/conservator; relatives need approval[3].

**Data shape:** Statewide but locally administered via AAAs/sponsor agencies by town; financial eligibility fixed per individual (no household size adjustment); benefits tiered by need/priority with funding caps; requires specific dementia diagnosis certification; self-directed hiring option unique.

**Source:** https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/healthy-living-services/connecticut-statewide-respite-care or https://eregulations.ct.gov/eRegsPortal/Browse/getDocument?guid=%7B30A0E155-0200-C294-AF6B-15887B1A99E2%7D (Regulations of CT State Agencies Sec. 17b-349e-1 to 17b-349e-9)[1][7]

---

### CHOICES Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits for core CHOICES counseling services, available to all Medicare-eligible individuals regardless of income. For related assistance programs like Medicare Savings Program (MSP): based on gross income (no assets counted); specific 2025 limits not detailed in sources but MSP has higher guidelines than federal LIS and covers Part B premiums. Extra Help/LIS: Full benefits up to specified levels (e.g., Level 1 for MSP recipients); CT recommends MSP application first due to no asset test and higher income thresholds. MED-CONNECT: Up to $85,000/year for full Medicaid/HUSKY, applicant income only (spouse not counted for eligibility determination).[6]
- Assets: No asset limits for CHOICES counseling or MSP; assets not considered for MSP eligibility, only income.[4][6]
- Medicare-eligible: US citizens/permanent residents aged 65+ with 40 quarters (10 years) work history for premium-free Part A, or certain younger people (under 65) with SSA-approved disabilities receiving SSDI for 24 months.[4]
- Available to Medicare beneficiaries, families, and caregivers of all ages/income levels, with priority for low-income, disabled, rural, and non-English primary language speakers.[2]

**Benefits:** Free, unbiased one-on-one counseling on Medicare Parts A/B/C/D, Medicare Advantage, Medicare Supplement, Prescription Drug Coverage (Part D); enrollment assistance and plan comparisons; eligibility screening/application help for Medicaid, Medicare Savings Program (MSP, pays Part B premium and may cover Part A), Low-Income Subsidy/Extra Help; information/referral on aging issues, fraud detection; Benefits Check Up tool for confidential screening of benefits like tax relief, SSI.[2][3][6][7]

**How to apply:**
- Phone: 1-800-994-9422 to speak with a counselor in your area.[5][10]
- Website: https://portal.ct.gov/ADS-CHOICES or https://portal.ct.gov/ADS (Department of Aging and Disability Services).[5][10]
- In-person/email/other: Contact local Area Agency on Aging (AAA) counselor; 5 AAAs partner statewide (e.g., North Central AAA, WCAAA at 203-757-5449).[7][9]
- Benefits Check Up tool via appointment or website (confidential, no personal info needed).[3]

**Timeline:** Not specified; counseling available by appointment/phone/email.

**Watch out for:**
- Not a direct financial/long-term care benefits program but counseling/eligibility screening service; people confuse with Medicaid 'CHOICES' in other states. MSP/LIS applications handled separately via DSS, auto-qualifies LIS if approved for MSP (prefer MSP first: no assets, higher income). Targets Medicare navigation, not general elderly care. Volunteers must be certified, not insurance agents.[1][2][4][6]
- MED-CONNECT: Income up to $85k for full coverage but may require premium; only applicant income counts.[6]

**Data shape:** Statewide SHIP via 5 AAAs; no income/asset test for counseling; links to tiered programs like MSP (income-only, no assets) and MED-CONNECT ($85k cap, applicant-only income)

**Source:** https://portal.ct.gov/ADS-CHOICES or https://portal.ct.gov/ADS/programs-and-services/choices[5][10]

---

### Money Follows the Person (MFP) Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be eligible for Connecticut Medicaid long-term care services. General 2025 Medicaid thresholds (may vary): monthly income ≤ $2,901; countable assets ≤ $2,000 for singles. Exact limits follow CT Medicaid rules, which vary by category (e.g., aged/disabled); no specific MFP income table provided beyond Medicaid eligibility. See state-specific Medicaid criteria for household variations[2][1].
- Assets: Countable assets ≤ $2,000 per Medicaid long-term care rules (general 2025 figure). What counts: most savings, investments, second vehicles/properties. Exempt: primary home (under equity limits), one vehicle, personal belongings, burial funds (up to limits). Full details per CT Medicaid policy[2].
- Eligible for and recipient of Medicaid (at least 1 day prior to transition)[2][1].
- Residing in Medicaid-funded nursing home, hospital, or qualified institution for at least 3 months (some sources say 6 months; official CT sources specify 3 months)[3][7][1][9].
- Require institutional level of care but can live in community with supports[2].
- Express interest in transitioning to community living (e.g., own home, relative's home, apartment, small group home ≤4 unrelated residents, or qualifying assisted living with private access)[2][1].
- Eligible for one of Connecticut's community waivers/service packages[3][1].

**Benefits:** Transition services/support (assistance moving from institution to community); housing support; individualized care plans; emergency back-up services; community supports (via HCBS waivers, e.g., home care). No fixed dollar amounts or hours specified; services tailored via care plan[1][4][3].
- Varies by: priority_tier

**How to apply:**
- Online: Submit application at https://portal.ct.gov/DSS/Health-And-Home-Care/Money-Follows-the-Person-Program/Money-Follows-the-Person-Program ('Click Here to Apply')[6][5][4].
- Phone: Call 1-888-992-8637 (1-888-99CTMFP) for info/referral[3][4].
- Website for FAQs/resources: https://portal.ct.gov/DSS/Health-And-Home-Care/Money-Follows-the-Person-Program/Money-Follows-the-Person-Program[4][5].

**Timeline:** Not specified in sources.
**Waitlist:** Possible substantial waitlist due to limited HCBS waiver slots/funding (not entitlement program)[2].

**Watch out for:**
- Must already be Medicaid-eligible before transition (apply separately if needed)[2][7].
- Institutional stay minimum is 3 months per CT sources (conflicts with some general 60/90-day info)[3][7][2].
- Limited waiver slots may cause waitlists; not guaranteed[2].
- Services via community waivers; must qualify for specific package[1][3].
- Housing must meet criteria (e.g., lockable access in assisted living)[2].
- People miss that it's a demonstration program focused on transition, not ongoing institutional alternative without prior stay[5].

**Data shape:** Requires prior 3-month institutionalization and Medicaid eligibility; benefits via individualized HCBS waiver packages (not fixed amounts); potential waitlists due to slot limits; statewide but transition-focused.

**Source:** https://portal.ct.gov/DSS/Health-And-Home-Care/Money-Follows-the-Person-Program/Money-Follows-the-Person-Program

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| HUSKY C | benefit | state | deep |
| Connecticut Home Care Program for Elders | benefit | state | deep |
| Connecticut PACE Programs | benefit | local | deep |
| Connecticut Medicare Savings Programs (Q | benefit | federal | deep |
| Connecticut SNAP (Supplemental Nutrition | benefit | federal | deep |
| Connecticut Energy Assistance Program (C | benefit | state | deep |
| Connecticut Weatherization Assistance Pr | benefit | federal | deep |
| Connecticut Meals on Wheels | benefit | federal | deep |
| Connecticut Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Connecticut Legal Assistance Program for | resource | local | simple |
| Congregate Housing Services Program (CHS | benefit | local | deep |
| Connecticut Private Pay Assisted Living  | benefit | local | deep |
| Property Tax Credit for Elderly/Disabled | benefit | state | medium |
| Renters’ Rebate for Elderly/Disabled | benefit | state | medium |
| Connecticut Statewide Respite Care Progr | benefit | state | deep |
| CHOICES Program | resource | state | simple |
| Money Follows the Person (MFP) Program | benefit | state | deep |

**Types:** {"benefit":15,"employment":1,"resource":2}
**Scopes:** {"state":9,"local":4,"federal":5}
**Complexity:** {"deep":14,"simple":2,"medium":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/CT/drafts.json`.

- **HUSKY C** (benefit) — 4 content sections, 6 FAQs
- **Connecticut Home Care Program for Elders (CHCPE)** (benefit) — 5 content sections, 6 FAQs
- **Connecticut PACE Programs** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 10 programs
- **region**: 2 programs
- **household_size**: 2 programs
- **household_size|priority_tier|region**: 1 programs
- **need|housing_site**: 1 programs
- **income|region**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **HUSKY C**: Eligibility varies by sub-part (general aged/blind/disabled vs LTSS), household size, geography; asset limits unique to HUSKY C; spend-down option; statewide but regional limit variations
- **Connecticut Home Care Program for Elders (CHCPE)**: CHCPE is structured as three distinct categories with different funding sources (respite, state-funded, Medicaid-funded), each with different income/asset limits and service levels. Income limits vary significantly by category. State-funded has no income cap but uses sliding fees; Medicaid-funded has strict income/asset limits plus 5-year lookback. Functional eligibility (ADL need) is required for all categories. Application is decentralized through local Area Agencies on Aging, so processing may vary by region. Cost-sharing is mandatory for some participants.
- **Connecticut PACE Programs**: No financial eligibility for PACE itself (unlike Medicaid); restricted to specific regional PACE centers in CT with NHLOC certification required; benefits comprehensive but enrollment voluntary and community-based only
- **Connecticut Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income (QMB lowest tier, broadest benefits; QI highest tier, Part B only, funding-capped); no asset test (CT-specific generosity); household size via FPL multiples (single/couple shown); statewide uniform.
- **Connecticut SNAP (Supplemental Nutrition Assistance Program)**: Benefits scale by household size and net income with deductions; expanded eligibility (200% gross FPL, no asset limit standard); special elderly/disabled rules skip gross income test; statewide uniform.
- **Connecticut Energy Assistance Program (CEAP)**: Benefits scale by household size, income, heating source (deliverable fuels get crisis extras), and vulnerable status; no asset test; regionally administered with local providers; seasonal with fund limits
- **Connecticut Weatherization Assistance Program (WAP)**: Eligibility tied directly to CEAP (60% SMI, requires 211 lookup for tables); priority tiers for vulnerable groups like elderly; administered regionally by CAAs with max spend caps varying by single vs. multi-family.
- **Connecticut Meals on Wheels**: Decentralized by region with local providers; no uniform income/asset tests but priority-based; homebound/60+ core across all, varies by delivery zones and assessment processes
- **Connecticut Caregiver Support Program**: Administered via 8 regional AAAs with minor eligibility/form variations; priority-tiered services (no fixed hours/dollars); no universal income/asset test but low-income priority; distinct from paid family caregiving Medicaid waivers (AFL, CHCPE).
- **Senior Community Service Employment Program (SCSEP)**: National program with CT administered by non-profit grantee A4TD (not state agency); income at 125% FPL (household-based, annual federal table); priority tiers heavily influence access; 20 hr/wk fixed training wage at min wage; subgrantee network may create local access points.
- **Connecticut Legal Assistance Program for Elders**: Decentralized network of regional providers funded via Older Americans Act; no statewide uniform eligibility table or central application; services tiered by legal issue and provider focus.
- **Congregate Housing Services Program (CHSP)**: Restricted to residents of specific participating housing sites in Eastern/Western CT regions; eligibility hinges on housing residency + ADL needs; services vary by assessed need and site; HUD-funded with state partnership but no precise income/asset tables available.
- **Connecticut Private Pay Assisted Living Pilot Program**: Tied to CHCPE eligibility; service packages tiered by weekly personal care hours; limited to specific participating assisted living communities (fewer than 35); no statewide coverage.
- **Property Tax Credit for Elderly/Disabled**: State base program with graduated income scale up to fixed max credit; extensive local variations in income/asset limits, residency, and supplemental credits administered by 169 town assessors
- **Renters’ Rebate for Elderly/Disabled**: Statewide but locally administered; income thresholds updated annually per CGS 12-170e; rebate formula uses graduated scale with rent/utilities ratio
- **Connecticut Statewide Respite Care Program**: Statewide but locally administered via AAAs/sponsor agencies by town; financial eligibility fixed per individual (no household size adjustment); benefits tiered by need/priority with funding caps; requires specific dementia diagnosis certification; self-directed hiring option unique.
- **CHOICES Program**: Statewide SHIP via 5 AAAs; no income/asset test for counseling; links to tiered programs like MSP (income-only, no assets) and MED-CONNECT ($85k cap, applicant-only income)
- **Money Follows the Person (MFP) Program**: Requires prior 3-month institutionalization and Medicaid eligibility; benefits via individualized HCBS waiver packages (not fixed amounts); potential waitlists due to slot limits; statewide but transition-focused.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Connecticut?
