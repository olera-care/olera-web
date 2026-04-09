# Pennsylvania Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 1.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 11 |
| New (not in our data) | 4 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 6 programs
- **financial**: 3 programs
- **financial reimbursement + services**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Community HealthChoices

- **min_age**: Ours says `65` → Source says `21` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc))
- **income_limit**: Ours says `$988` → Source says `$2,901` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Up to 32 services including attendant care, adult day services, home modifications, pest control, educational support, personal assistance, respite, and other LTSS to support community living at nursing facility level of care. Medicare benefits continue separately if dual eligible[1][3].` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/chc))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/medicaid/chc`

### Medicare Savings Program

- **income_limit**: Ours says `$1400` → Source says `$1,304,` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Full Medicare Part B premium (~$185/month in 2026), deductibles, coinsurance; no provider billing beneficiary. SLMB: Part B premium only. QI-1: Part B premium only. All categories cover Part B premium; QMB most comprehensive.[7][8]` ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility`

### SNAP

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **income_limit**: Ours says `$1980` → Source says `$2608` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases. Average for older adults: $106/month. Calculated as max allotment minus 30% net income (e.g., 2-person elderly: $546 max - 30% net). Varies by net income, deductions (medical >$35 for 60+, shelter, utilities). Min/max allotments by household size.[1][4][5]` ([source](https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults`

### LIHEAP

- **income_limit**: Ours says `$2500` → Source says `$23,940` ([source](https://www.pa.gov/agencies/dhs/resources/liheap))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time cash grant of $200 to $1,000 paid directly to utility company or fuel provider. Exact amount determined by household size, income, fuel type, and county-specific benefit tables. Crisis grants available for households in immediate danger of being without heat. Grants are non-repayable[2][4][8].` ([source](https://www.pa.gov/agencies/dhs/resources/liheap))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/dhs/resources/liheap`

### SHIP

- **benefit_value**: Ours says `Free counseling service` → Source says `Free one-on-one counseling, education, and assistance on Medicare (Parts A/B/C/D, Medigap), applying for low-income programs (Medicaid, MSP, Extra Help), appeals, rights/procedures, and preventing/detecting/reporting Medicare fraud via Senior Medicare Patrol (SMP). Outreach includes presentations, enrollment events, health fairs[7][10].` ([source](https://www.shiphelp.org/ (national); PA details via acl.gov/programs or state aging sites[7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.shiphelp.org/ (national); PA details via acl.gov/programs or state aging sites[7]`

### Pennsylvania Caregiver Support Program

- **min_age**: Ours says `60` → Source says `[object Object]` ([source](https://www.pa.gov/services/aging/apply-for-the-caregiver-support-program))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Specific dollar amounts per month not provided in search results; varies by household income and size` ([source](https://www.pa.gov/services/aging/apply-for-the-caregiver-support-program))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/services/aging/apply-for-the-caregiver-support-program`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigation and resolution of complaints; education on rights, procedures, and resources; empowerment through skill-building, resident/family councils, and PEER groups; routine unannounced facility visits; mediation; referrals to long-term care programs; assistance with informed decisions; advocacy for fair treatment, dignity, and quality care. Specific issues addressed: discharge/transfer, service disruption, quality of care/life, residents' finances (e.g., access to funds, Medicare/Medicaid, billing), professional care (medications, nursing, restraints), rights (admission/discharge policies), food/environment/activities.` ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/advocacy-education-protection))
- **source_url**: Ours says `MISSING` → Source says `https://www.pa.gov/agencies/aging/aging-programs-and-services/advocacy-education-protection`

## New Programs (Not in Our Data)

- **Medical Assistance** — service ([source](https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility))
  - Shape notes: Dual tracks (MAGI income-only vs Non-MAGI income+assets); elderly/LTC focused on Non-MAGI with NFLOC; county-administered with annual FPL-based limits varying by marital status and program subcategory
- **PACE/PACENET** — service ([source](https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program))
  - Shape notes: Two-tier structure (PACE lower income/no premium; PACENET higher income/with premium); no asset test; income exclusions specific and detailed; statewide with local application points; funded by PA Lottery.
- **Weatherization Assistance Program** — service ([source](https://dced.pa.gov/programs/weatherization-assistance-program-wap/))
  - Shape notes: Administered by county-specific providers with varying intake/wait times; income at exactly 200% FPL by household size; priority tiers influence service order; no statewide central application—must contact local agency
- **Legal Counsel for the Elderly** — service ([source](https://seniorlawcenter.org (primary provider); https://www.pacourts.us/Storage/media/pdfs/20251010/170640-pbaseniorguide2025.pdf (PBA Guide)))
  - Shape notes: Delivered via decentralized network of 47 county-based legal aid offices with priority intake; eligibility tied to poverty guidelines without fixed asset test for legal services (unlike Medicaid counseling); varies by county provider availability and caseload

## Program Details

### Medical Assistance

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For elderly (65+) under Non-MAGI categories: Single nursing home applicant under $2,982/month (2026); individual applicants $2,901/month (2025). Varies by category (MAGI vs Non-MAGI), marital status, and household size. MAGI adults 19-64: 133%-138% FPL. No full household table available; limits compared to Federal Poverty Guidelines (FPIG) with 5% disregard for some groups.[1][2][4][5]
- Assets: Non-MAGI elderly/disabled: $2,000 single, $3,000 couple. Long-term care: $2,400 (income >$2,901/month), $8,000 (income <$2,901/month). Counts: wages, interest, dividends, Social Security, pensions, spouse income. Exemptions not detailed; resources assessed in some cases only.[1][2][3][7]
- Pennsylvania residency (no minimum time, intent to stay)
- U.S. citizen, refugee, or qualified non-citizen (proof required)
- Social Security Number (assistance available if none)
- Identity verification (driver's license, state ID)
- For long-term care: Nursing Facility Level of Care (NFLOC) or functional need in ADLs
- Blind/disabled or receiving LTC/HCBS for Non-MAGI

**Benefits:** Comprehensive health care coverage including doctor visits, hospital care, prescriptions, long-term care (nursing home, HCBS waivers), home modifications if qualified. Specifics vary by category; no fixed dollar/hour amounts stated.[1][2][8]
- Varies by: priority_tier

**How to apply:**
- Online: COMPASS.state.pa.us
- Phone: 1-866-550-4355
- In-person or paper: Local County Assistance Offices (CAO)
- Mail: To local CAO

**Timeline:** Lengthy and challenging; no specific timeline given. Medical assessment and financial review follow submission.[2][7]
**Waitlist:** Not mentioned; may vary by long-term care services[2]

**Watch out for:**
- Separate MAGI (expansion, income-only) vs Non-MAGI (elderly/LTC with assets) rules; elderly typically Non-MAGI with stricter asset tests
- Long-term care requires NFLOC; application lengthy with documentation
- Income/assets change annually; 2025/2026 figures differ slightly across sources
- Spousal income counted; Medicaid planning needed if over limits
- Annual renewal required; immigrants need 5-year qualified status in some cases
- No SSI counting in MAGI but does in Non-MAGI

**Data shape:** Dual tracks (MAGI income-only vs Non-MAGI income+assets); elderly/LTC focused on Non-MAGI with NFLOC; county-administered with annual FPL-based limits varying by marital status and program subcategory

**Source:** https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility

---

### Community HealthChoices


**Eligibility:**
- Age: 21+
- Income: Monthly income limit is 300% of the Federal Benefit Rate (FBR), which adjusts annually. In 2025, up to $2,901 per applicant regardless of marital status; each spouse considered individually if both apply. Older data (2019) shows $2,313[2][6].
- Assets: Countable resources at or below $2,000 for an individual after a $6,000 standard disregard (2019 data; confirm current). Home equity limit of $730,000 (2025) if applicant lives in home or intends to return, or if non-applicant spouse/dependent resides there. Countable assets include bank accounts, property, retirement accounts; exemptions include primary home under equity limit, certain personal items[2][6][8].
- Pennsylvania resident
- Medicaid eligible (dually eligible for Medicare/Medicaid, or qualify for Medicaid LTSS needing nursing facility level of care via Functional Eligibility Determination (FED) assessing ADLs like bathing, dressing, eating)
- Not eligible if: intellectual/developmental disabilities receiving ODP services beyond supports coordination, resident in state-operated nursing facility (including veterans' homes), or certain OBRA/Act 150 participants without NFLOC or dual eligibility
- Exception: 55+ may opt for LIFE program in served areas instead[1][2][3][4][5][6][8]

**Benefits:** Up to 32 services including attendant care, adult day services, home modifications, pest control, educational support, personal assistance, respite, and other LTSS to support community living at nursing facility level of care. Medicare benefits continue separately if dual eligible[1][3].
- Varies by: priority_tier

**How to apply:**
- Phone: Pennsylvania Independent Enrollment Broker (PA IEB) at 1-877-550-4227
- Online: COMPASS website
- County Assistance Office (CAO) for financial eligibility (submit PA-600 form)
- In-person: Local Area Agency on Aging (AAA) for needs assessment; CAO for financial review

**Timeline:** Not specified in sources; involves sequential steps including assessment and review

**Watch out for:**
- Mandatory managed care program; must choose MCO post-approval
- Income/assets reviewed strictly by CAO; spousal rules treat each applicant individually
- Functional need requires NFLOC via FED tool—not just age/Medicaid
- Excludes IDD via ODP, state nursing homes; prior waiver enrollees auto-transitioned
- LIFE opt-in for 55+ may be preferable in served areas
- Home equity limit applies if intending return
- Medicare handled separately[1][2][4][5][6]

**Data shape:** Medicaid LTSS waiver with tiered services based on NFLOC; financial eligibility via CAO with individual applicant limits regardless of household; varies by MCO and local AAA; annual FBR adjustments

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/medicaid/chc

---

### PACE/PACENET

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: PACE: Single person $14,500 or less annually; married couple $17,700 or less annually. PACENET: Single person $14,500 to $33,500 annually; married couple $17,700 to $41,500 annually. Income based on previous calendar year. Applicants within $0.50 over limits may round down. Medicare Part B premiums excluded from income.[1][4][5]
- Assets: No asset limits or test. Assets not counted.[6]
- Pennsylvania resident for at least 90 consecutive days prior to application.[1][2][3]
- Not receiving prescription benefits under Medical Assistance (MA). Those with only Medicare Part B premium help via Medicare Savings Program may qualify.[1][4]
- Must report all previous year's income including gross Social Security/SSI (excluding Medicare premiums), pensions, wages, self-employment, alimony, annuities/IRAs, unemployment, interest/dividends/capital gains, net rental income, royalties, workers' comp, death benefits over $10,000, spouse's income if living together, cash gifts/inheritances over $300. Capital gains from home sale within 2 years must be declared even without tax filing. Exclusions: Medicare Part B, Property Tax/Rent Rebates, VA Aid & Attendance, SNAP/LIHEAP, first $10,000 death benefit, federal stimulus, etc.[6]

**Benefits:** Prescription drug coverage (generic and brand-name) with co-pays. PACE: $6 generic, $9 brand-name per Rx; no monthly premium. PACENET: $8 generic, $15 brand-name per Rx; monthly premium ~$35.63 (2020 rate). Works with Medicare Part D, retiree/employer plans, Medicare Advantage, VA benefits to reduce out-of-pocket costs. Excludes experimental/OTC drugs, FDA DESI-listed unless 'medically necessary'.[1][5][7]
- Varies by: program_tier

**How to apply:**
- Phone: 1-800-225-PACE (7223) or 1-800-783-7067 (PA MEDI helpline).[1][4]
- Online: www.aging.pa.gov or https://pacecares.magellanhealth.com/.[1][4][7]
- In-person/mail: Local pharmacy, senior center, Area Agency on Aging, district office.[1]

**Timeline:** Not specified in sources.

**Watch out for:**
- Income based strictly on prior calendar year; current year income irrelevant.[1][4]
- Cannot receive if on MA prescription benefits; Medicare Part B help only is okay.[1][4]
- Must declare all income sources including spouse's, capital gains from home sales (even no tax filing), cash gifts over $300.[6]
- Limits set by State Lottery Law; no automatic annual adjustment (manual increases by legislature).[5]
- Co-pays and premium may change; sources show 2020/2022 data, verify current.[5]
- Drugs on FDA DESI list excluded unless physician notes 'medically necessary'.[3]

**Data shape:** Two-tier structure (PACE lower income/no premium; PACENET higher income/with premium); no asset test; income exclusions specific and detailed; statewide with local application points; funded by PA Lottery.

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/pace-program

---

### Medicare Savings Program


**Eligibility:**
- Age: 65+
- Income: 2026 limits (monthly) by category and household size: QMB (<100% FPL): Single $1,304, Couple $1,759; SLMB (<120% FPL): Single $1,565, Couple $2,111; QI-1 (<135% FPL): Single $1,760, Couple $2,373. Individuals may qualify with higher income/resources due to state disregards.[7][8]
- Assets: Resource limits (all categories): Single $9,950, Couple $14,910. Assets include real estate, mutual funds, stocks, bonds, retirement accounts, savings/checking (exemptions not detailed in sources; state may disregard certain types).[2][7][8]
- Must have Medicare Part A (or qualify for Part B)
- Pennsylvania resident
- U.S. citizen or qualified non-citizen
- Meet identity, SSN, and residency verification

**Benefits:** QMB: Full Medicare Part B premium (~$185/month in 2026), deductibles, coinsurance; no provider billing beneficiary. SLMB: Part B premium only. QI-1: Part B premium only. All categories cover Part B premium; QMB most comprehensive.[7][8]
- Varies by: priority_tier

**How to apply:**
- Online: COMPASS website (pa.gov/COMPASS)
- Phone: 1-800-692-7462 (COMPASS)
- Mail/In-person: Local County Assistance Office

**Timeline:** Not specified in sources

**Watch out for:**
- Higher income/resources than table limits may still qualify due to DHS disregards[7][8]
- Must apply even if not yet enrolled in Part B[7][8]
- No resource exclusion for some categories like pregnant women/children, but MSP targets elderly[2]
- QMB providers cannot bill beneficiary for Medicare-covered services[7][8]
- Separate from PACE/PACENET prescription programs[6][9]

**Data shape:** Tiered by QMB/SLMB/QI-1 with escalating income limits; asset limits fixed by household size; state disregards allow flexibility beyond federal FPL

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/medicaid/medicaid-general-eligibility

---

### SNAP


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled, Pennsylvania uses expanded rules (Oct 1, 2025–Sept 30, 2026). Gross income limit at 200% federal poverty level: 1 person $2608/month, 2 $3526, 3 $4442, 4 $5358, 5 $6276, 6 $7192, 7 $8108, +$916 each additional. If over gross, qualify via net income and asset tests. Alternative 2025 senior limits cited: 1 person $15,060/year ($1255/month), 2 $20,440/year ($1703/month). Net income determines benefits after deductions (e.g., 30% of net from max allotment).[1][2][3]
- Assets: Applies if gross income >200% FPL; must meet net income + asset test. Exempt: home value, retirement savings, household goods, life insurance cash value (if not income-producing), income-producing property (varies by state). Most states waive asset test if income ≤ federal poverty line.[1][2]
- Household must live in PA
- U.S. citizen or qualified non-citizen (note: Nov 1, 2025 changes restrict many immigrants; green card/Cuba/Haiti may still qualify)
- SSN for all members
- Work rules exempt for 60+ (but new Sep 1, 2025 rules for some adults under 60)

**Benefits:** Monthly EBT card for food purchases. Average for older adults: $106/month. Calculated as max allotment minus 30% net income (e.g., 2-person elderly: $546 max - 30% net). Varies by net income, deductions (medical >$35 for 60+, shelter, utilities). Min/max allotments by household size.[1][4][5]
- Varies by: household_size

**How to apply:**
- Online: COMPASS website (pa.gov COMPASS tool)
- Phone: County Assistance Office (e.g., senior helpline 1-877-999-5964)
- In-person: County assistance office
- Mail: Use Simple SNAP application form

**Timeline:** Not specified in sources; apply to check.

**Watch out for:**
- Expanded PA rules looser than federal—check PA-specific limits
- Medical/shelter deductions key for seniors to maximize benefits
- New 2025/2026 changes: immigrant restrictions (Nov 1), work rules (Sep 1, exempt 60+), shelter/utility proof (Feb 9, 2026)
- Include all who buy/prepare food
- Assets exempt but test applies if high gross income

**Data shape:** benefits scale by household size; expanded gross limit (200% FPL) for 60+/disabled with net/asset fallback; high deductions for seniors (medical, shelter); county-administered with 2025-2026 federal changes

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/snap/snap-older-adults

---

### LIHEAP


**Eligibility:**
- Income: For the 2025-2026 heating season (effective through at least February 1, 2026), maximum annual gross income at or below 150% of Federal Poverty Guidelines: Household Size 1: $23,940; 2: $32,460; 3: $40,980; 4: $49,500; 5: $58,020; 6: $66,540; 7: $75,060; 8: $83,580; 9: $92,100; 10: $100,620. For each additional person, add $8,520. Income includes gross yearly earnings of all household members (related or unrelated, including roomers sharing expenses). Exclusions include certain educational assistance, home produce for consumption, Senior Citizen Rebate payments, and work/training incentives[1][2][4][7].
- Assets: No resource or asset limits apply[5].
- Must reside in Pennsylvania
- Renters and homeowners both eligible
- No requirement to be on other public assistance
- No requirement for unpaid heating bills
- Household includes all children, adults, relatives, and unrelated roomers sharing expenses at the residence[1][2][4][5]

**Benefits:** One-time cash grant of $200 to $1,000 paid directly to utility company or fuel provider. Exact amount determined by household size, income, fuel type, and county-specific benefit tables. Crisis grants available for households in immediate danger of being without heat. Grants are non-repayable[2][4][8].
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: COMPASS at https://www.compass.state.pa.us (Pennsylvania's online tool for health and human services)
- Paper: Download form from county assistance office or DHS site, mail or deliver to local county assistance office
- In-person: Local county assistance office (find via PA DHS site)
- Phone: Contact local county assistance office (numbers via PA DHS LIHEAP page or 1-866-550-4355 for general inquiries, but apply via above methods)[1][2][4]

**Timeline:** Allow 30 days for response with written notice of eligibility and benefit amount[1].
**Waitlist:** Not mentioned; applications accepted December 3, 2025 to May 8, 2026 for regular grants[2].

**Watch out for:**
- No age requirement—open to all qualifying households, not just elderly
- Income limits updated annually (check current year; 2025-2026 figures apply)
- Benefits vary significantly by county, fuel type (e.g., electric, gas, oil), income bracket, and household size—use official benefit table tool
- Application window limited (Dec 3, 2025–May 8, 2026); apply early
- No asset test, but all gross income sources count except specific exclusions
- Crisis grants for emergencies separate from regular heating grants[2][4][5][8]

**Data shape:** Income at 150% FPL with annual updates; no asset test; benefits scale by household size, income range, county, and fuel type via lookup tables; seasonal application window; statewide but county-administered

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/dhs/resources/liheap

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 200% of the Federal Poverty Income Level (effective January 13, 2026). Examples: 1 person: $31,920 annually; 4 people: $66,000 annually. Full table from Monroe County (subject to annual updates): 7 people: $100,080; 8 people: $111,440; each additional: $11,360. Varies by household size; check current guidelines via local provider.
- Assets: No asset limits mentioned in program guidelines.
- Pennsylvania resident
- Occupy home as primary residence
- Homeowners or renters (renters need landlord permission and rental agreement)
- Eligible housing: single-family homes, rowhomes, trailers (no multi-family buildings unless 66% of units eligible, or 50% for duplexes/four-unit)
- Priority for elderly, disabled, families with children, high energy users

**Benefits:** Free energy efficiency improvements including: blower door air sealing; attic/wall/basement/crawlspace insulation and ventilation; heating system modification/replacement; minor repairs/health & safety measures. Average expenditure per household: $7,669 based on home audit. No repayment or liens required.
- Varies by: priority_tier

**How to apply:**
- Contact local weatherization agency serving your county (find via https://dced.pa.gov/programs/weatherization-assistance-program-wap/ or https://dced.pa.gov/housing-and-development/weatherization/income-eligibility/)
- Phone examples: Monroe County 570-421-4300; Philadelphia (215) 448-2160
- Email example: Philadelphia phdc.intake@phdc.phila.gov
- In-person intake appointment with local provider
- Referral via LIHEAP HSEA-1 form through local CAO if applying for related assistance

**Timeline:** Not specified statewide; involves energy audit after intake
**Waitlist:** Active waitlists in some areas (e.g., Philadelphia); varies by region

**Watch out for:**
- Priority given to elderly/disabled/children/high energy users—may affect wait times
- Renters need landlord permission; multi-family buildings have unit occupancy rules
- No re-weatherization for 15 years unless damage from fire/flood/act of God
- Must reapply annually to confirm eligibility
- Only primary residences; housing type restrictions (no multi-family unless qualified)
- Local waitlists common; processing varies by county demand

**Data shape:** Administered by county-specific providers with varying intake/wait times; income at exactly 200% FPL by household size; priority tiers influence service order; no statewide central application—must contact local agency

**Source:** https://dced.pa.gov/programs/weatherization-assistance-program-wap/

---

### SHIP


**Eligibility:**
- Income: No strict income limits; prioritizes people with limited incomes, Medicare beneficiaries under 65 with disabilities, and dually eligible for Medicare/Medicaid. Exact thresholds vary; example for related Medicare Savings Programs: up to ~$1,800/month individual or ~$2,400/month couple[9].
- Assets: Not applicable; no asset test mentioned for core SHIP counseling services[7][10].
- Medicare beneficiary or family/caregiver
- Pennsylvania resident
- Focus on those needing help with Medicare options, appeals, fraud prevention, or cost-saving programs like MSP/Extra Help[7][10]

**Benefits:** Free one-on-one counseling, education, and assistance on Medicare (Parts A/B/C/D, Medigap), applying for low-income programs (Medicaid, MSP, Extra Help), appeals, rights/procedures, and preventing/detecting/reporting Medicare fraud via Senior Medicare Patrol (SMP). Outreach includes presentations, enrollment events, health fairs[7][10].

**How to apply:**
- Phone: Local SHIP site or 877-839-2675[7]
- Website: shiphelp.org to find/partner with local site[7]
- In-person: Over 2,200 local sites across PA via national network[7]

**Timeline:** Immediate counseling upon contact; no formal processing for services[7][10].

**Watch out for:**
- Not health insurance or direct financial aid—only free counseling/advocacy; confuses with CHIP (children's insurance)[1][2][7]
- Must contact local site for PA-specific help; national numbers route locally[7]
- Prioritizes limited-income/duals/disabled under 65—others still eligible but not prioritized[7]
- Assists with MSP/Extra Help apps but families must qualify separately[9]

**Data shape:** Counseling/advocacy service via local network, no income/asset test for core help, prioritizes Medicare-related needs for elderly/families; distinct from CHIP (child health insurance)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.shiphelp.org/ (national); PA details via acl.gov/programs or state aging sites[7]

---

### Pennsylvania Caregiver Support Program


**Eligibility:**
- Age: [object Object]+
- Income: {"financial_eligibility_requirement":"None — all income levels qualify","reimbursement_eligibility":"Care receiver household income up to 380% of Federal Poverty Level (FPL) receives financial reimbursement; income above 380% FPL receives non-financial services only (care management, education, training)","note":"Reimbursement percentage determined by sliding scale based on FPL and household size"}
- Assets: Not specified in search results for this program; however, if care receiver qualifies for Medicaid/Medical Assistance (separate program), 2026 limits are: $2,400 (single) or $4,800 (married couple both applying); excludes primary home (if equity ≤$752,000 and applicant/spouse/dependent lives there), one vehicle, household furnishings, personal effects
- Caregiver must be primary caregiver providing regular, hands-on care
- Care receiver must require assistance with at least one activity of daily living (ADL)
- In-home assessment required to verify needs and household income

**Benefits:** Specific dollar amounts per month not provided in search results; varies by household income and size
- Varies by: household_size, care_receiver_income

**How to apply:**
- Contact Area Agency on Aging (AAA) for your county — specific phone numbers and websites not provided in search results
- Online: https://www.pa.gov/services/aging/apply-for-the-caregiver-support-program (referenced but full URL details not provided)
- In-person: Area Agency on Aging office in your county

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- No financial eligibility requirement exists, BUT reimbursement amount depends entirely on care receiver income — those above 380% FPL get services only, no money
- Caregiver and care receiver do NOT need to be related in Category 1 (age 60+ or Alzheimer's), but MUST be related in Categories 2 & 3
- Caregiver and care receiver do NOT need to cohabitate in Category 1, but MUST cohabitate in Categories 2 & 3
- Family members cannot be hired and paid to provide care to their relative under this program
- Care receiver must have documented functional deficits or ADL assistance needs — simply being 60+ is not enough
- Reimbursement is determined by sliding scale, not a fixed amount — exact monthly payment varies by household
- Caregiver is responsible for paying for services/supplies upfront and tracking expenses for reimbursement — this is not a direct payment program
- In-home assessment is mandatory before authorization
- Those caring for someone with income above 380% FPL receive no financial assistance but can still access care management, education, and training

**Data shape:** This program has three distinct eligibility categories with different age, relationship, and cohabitation requirements. Benefits scale by care receiver household income using a sliding scale based on Federal Poverty Level (not fixed tiers). No income eligibility requirement exists, but reimbursement eligibility caps at 380% FPL. Administered regionally through Area Agencies on Aging, but eligibility criteria are statewide. Specific dollar amounts, processing times, and detailed service lists are not available in public search results — families must contact their local AAA for precise benefit amounts.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/services/aging/apply-for-the-caregiver-support-program

---

### Legal Counsel for the Elderly

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Pennsylvania legal services for the elderly, such as through SeniorLAW Center or Pennsylvania Bar Association referrals, typically target seniors age 60+ with low income, often aligned with federal poverty guidelines or Medicaid thresholds (e.g., $2,982/month gross for 2026 for community services eligibility; family of four up to $33,075 annually). Exact limits vary by provider and are determined during intake—no fixed statewide table specified.
- Assets: Not explicitly required for most free legal services programs; however, for related Medicaid eligibility counseling, countable assets ≤$2,400 (if income >$2,901/month) or ≤$8,000 (if income ≤$2,982/month in 2026, including $6,000 disregard). Countable assets include most non-excluded resources; exempt typically: primary home (if occupied), one vehicle, personal belongings, burial funds (up to limits).
- Pennsylvania residency
- Legal issue related to aging (e.g., long-term care planning, elder abuse, guardianship, powers of attorney, Medicaid applications)
- Financial need assessed via intake screening

**Benefits:** Free legal advice, representation, advocacy, and referrals for elderly-specific issues including long-term care planning, Medicaid eligibility, elder abuse/neglect/exploitation, powers of attorney, guardianship, nursing home rights, housing options, and kinship care (e.g., grandparents raising grandchildren). Provided by attorneys via phone, in-person, or court representation—no fixed dollar amounts or hours.
- Varies by: priority_tier

**How to apply:**
- Phone: 717-236-9486 or 800-322-7572 (Pennsylvania Legal Services intake for eligibility screening)
- Phone: 412-261-5555 (Allegheny County Bar Association Lawyer Referral Service)
- Online: Visit seniorlawcenter.org and use Service/Staff Locator by county; or pacourts.us for PBA Senior Guide resources
- In-person: Local County Bar Association Lawyer Referral Services or Area Agency on Aging offices (locator via paelderlaw.net or seniorlawcenter.org)

**Timeline:** Intake screening immediate via phone; full case acceptance varies (days to weeks based on priority)
**Waitlist:** Possible for high-demand areas; priority for urgent issues like abuse or eviction

**Watch out for:**
- Not automatic Medicaid approval—provides legal counsel only; complex asset rules require attorney guidance for spend-down or spousal protections
- 5-year look-back period for Medicaid applications: improper transfers delay eligibility
- Must complete intake screening to confirm low-income eligibility; not all cases accepted
- Regional providers handle cases—call local intake first, not direct attorney contact
- Separate from general senior services; focuses on legal advocacy, not direct care/funds

**Data shape:** Delivered via decentralized network of 47 county-based legal aid offices with priority intake; eligibility tied to poverty guidelines without fixed asset test for legal services (unlike Medicaid counseling); varies by county provider availability and caseload

**Source:** https://seniorlawcenter.org (primary provider); https://www.pacourts.us/Storage/media/pdfs/20251010/170640-pbaseniorguide2025.pdf (PBA Guide)

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Resides (or planning to reside) in a long-term care facility such as nursing homes, assisted living facilities, personal care homes, domiciliary care homes, adult day care centers, or receiving long-term care services in home/community settings.
- Complaint or concern related to quality of care, quality of life, rights, discharge/transfer, service disruption, finances, medications, environment, activities, or similar issues in long-term care.
- Services available to residents, potential residents, families, friends, staff, or community members on behalf of residents.

**Benefits:** Investigation and resolution of complaints; education on rights, procedures, and resources; empowerment through skill-building, resident/family councils, and PEER groups; routine unannounced facility visits; mediation; referrals to long-term care programs; assistance with informed decisions; advocacy for fair treatment, dignity, and quality care. Specific issues addressed: discharge/transfer, service disruption, quality of care/life, residents' finances (e.g., access to funds, Medicare/Medicaid, billing), professional care (medications, nursing, restraints), rights (admission/discharge policies), food/environment/activities.

**How to apply:**
- Phone: Contact local Area Agency on Aging (AAA) Ombudsman program (examples: SWPA AAA for Greene/Fayette/Washington Counties via https://www.swpa-aaa.org/community-services/ombudsman-program; Franklin County via https://www.franklincountypa.gov/departments/ombudsman-program/; CARIE at 215-545-5724 or 610-860-5050 for Philadelphia; Center in the Park at 215-844-1829 for NE/NW Philadelphia; Montgomery County via https://www.montgomerycountypa.gov/2832/Ombudsman).
- Statewide assistance: Pennsylvania Department of Aging via https://www.pa.gov/services/aging/request-assistance-from-a-long-term-care-ombudsman or https://www.pa.gov/agencies/aging/aging-programs-and-services/advocacy-education-protection.
- In-person: Local AAA offices or facilities (routine visits by ombudsmen).
- Email: ombudsman@carie.org (Philadelphia example).

**Timeline:** Immediate response to complaints; no formal processing time specified as services are responsive advocacy.

**Watch out for:**
- Not a direct care or financial aid program—provides advocacy only, not healthcare services or funding.
- Must be for long-term care settings (facilities or home-based LTC services); not for independent living without LTC involvement.
- Confidentiality: Ombudsmen require resident permission (or POA) before intervening with staff[3].
- Anyone can contact on behalf of resident (families, friends, staff, public), but priority to resident's wishes.
- Not eligibility for facility admission—helps with complaints/rights once in or seeking LTC.
- Local variation requires finding correct AAA for your county.

**Data shape:** no income test; free advocacy services only; county-based delivery via 52 AAAs with no financial eligibility; responsive to complaints rather than pre-qualifying application

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.pa.gov/agencies/aging/aging-programs-and-services/advocacy-education-protection

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medical Assistance | benefit | state | deep |
| Community HealthChoices | benefit | state | deep |
| PACE/PACENET | benefit | state | medium |
| Medicare Savings Program | benefit | federal | deep |
| SNAP | benefit | federal | deep |
| LIHEAP | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| SHIP | resource | federal | simple |
| Pennsylvania Caregiver Support Program | benefit | state | deep |
| Legal Counsel for the Elderly | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":8,"resource":3}
**Scopes:** {"state":5,"federal":6}
**Complexity:** {"deep":7,"medium":1,"simple":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/PA/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **household_size, care_receiver_income**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medical Assistance**: Dual tracks (MAGI income-only vs Non-MAGI income+assets); elderly/LTC focused on Non-MAGI with NFLOC; county-administered with annual FPL-based limits varying by marital status and program subcategory
- **Community HealthChoices**: Medicaid LTSS waiver with tiered services based on NFLOC; financial eligibility via CAO with individual applicant limits regardless of household; varies by MCO and local AAA; annual FBR adjustments
- **PACE/PACENET**: Two-tier structure (PACE lower income/no premium; PACENET higher income/with premium); no asset test; income exclusions specific and detailed; statewide with local application points; funded by PA Lottery.
- **Medicare Savings Program**: Tiered by QMB/SLMB/QI-1 with escalating income limits; asset limits fixed by household size; state disregards allow flexibility beyond federal FPL
- **SNAP**: benefits scale by household size; expanded gross limit (200% FPL) for 60+/disabled with net/asset fallback; high deductions for seniors (medical, shelter); county-administered with 2025-2026 federal changes
- **LIHEAP**: Income at 150% FPL with annual updates; no asset test; benefits scale by household size, income range, county, and fuel type via lookup tables; seasonal application window; statewide but county-administered
- **Weatherization Assistance Program**: Administered by county-specific providers with varying intake/wait times; income at exactly 200% FPL by household size; priority tiers influence service order; no statewide central application—must contact local agency
- **SHIP**: Counseling/advocacy service via local network, no income/asset test for core help, prioritizes Medicare-related needs for elderly/families; distinct from CHIP (child health insurance)
- **Pennsylvania Caregiver Support Program**: This program has three distinct eligibility categories with different age, relationship, and cohabitation requirements. Benefits scale by care receiver household income using a sliding scale based on Federal Poverty Level (not fixed tiers). No income eligibility requirement exists, but reimbursement eligibility caps at 380% FPL. Administered regionally through Area Agencies on Aging, but eligibility criteria are statewide. Specific dollar amounts, processing times, and detailed service lists are not available in public search results — families must contact their local AAA for precise benefit amounts.
- **Legal Counsel for the Elderly**: Delivered via decentralized network of 47 county-based legal aid offices with priority intake; eligibility tied to poverty guidelines without fixed asset test for legal services (unlike Medicaid counseling); varies by county provider availability and caseload
- **Long-Term Care Ombudsman Program**: no income test; free advocacy services only; county-based delivery via 52 AAAs with no financial eligibility; responsive to complaints rather than pre-qualifying application

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Pennsylvania?
