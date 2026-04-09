# Minnesota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 1.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 14 |
| New (not in our data) | 8 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **financial**: 2 programs
- **service**: 9 programs
- **financial (food assistance)**: 1 programs
- **advocacy**: 1 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medical Assistance (MA) - Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)

- **income_limit**: Ours says `$1305` → Source says `$1,585` ([source](https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copayments. SLMB: Pays Part B premium only. QI: Pays Part B premium only (priority-based funding). Also auto-qualifies for Extra Help (Part D LIS).[1][2][4][6]` ([source](https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm))
- **source_url**: Ours says `MISSING` → Source says `https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm`

### Elderly Waiver (EW)

- **income_limit**: Ours says `$1305` → Source says `$3,000` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services including: adult day programs/companionship, personal care assistance, housekeeping/chore help, non-medical transportation, home-delivered meals, home modifications (e.g., ramps, grab bars), emergency response systems, respite for family caregivers, customized living in assisted living, skilled nursing, specialized equipment/supplies, supports for housing transitions, training for family caregivers. No fixed dollar/hour limits specified; individualized via care plan within budget less than nursing home cost[3][5][7].` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `60` → Source says `60 or older qualifies for special elderly rules; no age requirement for other household members[2][4]` ([source](Minnesota Department of Human Services (dcyf.mn.gov/snap)[9]; USDA SNAP (fns.usda.gov/snap)[4]))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Varies by household net income and size. General formula: $100 more in net income = $30 less in benefits[1]. Example: 2-person elderly/disabled household with $1,200 gross income and standard deductions receives $415/month[4]` ([source](Minnesota Department of Human Services (dcyf.mn.gov/snap)[9]; USDA SNAP (fns.usda.gov/snap)[4]))
- **source_url**: Ours says `MISSING` → Source says `Minnesota Department of Human Services (dcyf.mn.gov/snap)[9]; USDA SNAP (fns.usda.gov/snap)[4]`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2829` → Source says `$37,439` ([source](https://mn.gov/commerce/energy/consumer-assistance/energy-assistance-program/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Regular (Primary Heat): $200 minimum to $1,400 maximum, paid directly to utility. Crisis (Winter): Up to $600; Summer: Not available. Amounts based on household size, income, fuel type, and energy usage. Related Weatherization Assistance Program provides home upgrades like insulation and heating repairs (separate application).[1][5]` ([source](https://mn.gov/commerce/energy/consumer-assistance/energy-assistance-program/))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/commerce/energy/consumer-assistance/energy-assistance-program/`

### Senior Health Insurance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, personalized one-on-one counseling on Medicare Parts A/B/D, Medicare Advantage, Medigap, long-term care insurance, Medicare Savings Programs, prescription drug assistance, Medicaid, appeals, denied claims, bill management, and plan comparisons; referrals, printed materials, public education; no sales of insurance products[2][4][6].` ([source](https://mn.gov/boardonaging/ (Senior LinkAge Line via Minnesota Board on Aging); CMS contact: https://www.cms.gov/contacts/minnesota-state-health-insurance-assistance-programsenior-linkage-line[3]))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/boardonaging/ (Senior LinkAge Line via Minnesota Board on Aging); CMS contact: https://www.cms.gov/contacts/minnesota-state-health-insurance-assistance-programsenior-linkage-line[3]`

### Home-Delivered Meals (via Elderly Waiver/MSHO)

- **min_age**: Ours says `60` → Source says `65` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered nutritionally balanced meals (typically 1+ per day if needs met; additional meals possible via Title III if age 60+). Part of EW HCBS package including personal care, homemaker, respite, etc. No fixed dollar amount or hours specified—authorized based on assessment.` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp`

## New Programs (Not in Our Data)

- **Minnesota Senior Health Options (MSHO)** — service ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp[7]))
  - Shape notes: Requires prior Medical Assistance (MA/Medicaid) eligibility with no MSHO-specific income/asset numbers; county-restricted by health plan service areas; managed by multiple MCOs with regional variations; integrates Medicare A/B and EW services.
- **Residential Energy Assistance Partnership (REAP) / Weatherization Assistance Program (WAP)** — service ([source](https://mn.gov/commerce/consumer/energy-utilities/apply-energy-assistance/index.jsp))
  - Shape notes: County-administered with local providers; income at 50% SMI; no assets/age test; bundled EAP (heating aid) + WAP (weatherization); funds deplete seasonally.
- **Respite Care (via Elderly Waiver)** — service ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
  - Shape notes: Respite care is a component service within the broader Elderly Waiver program, not a standalone benefit. Eligibility is determined at individual level through functional assessment (ADL/IADL capacity) and medical necessity (nursing facility level of care), not through income/asset tables alone. Program is county-administered with statewide eligibility criteria. Specific dollar amounts, hours, or frequency limits for respite care services are not detailed in available sources; these are determined individually through care planning process. Income limits for MA eligibility are not provided in available sources.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp))
  - Shape notes: Federally funded via grantees/subgrantees with regional providers in MN; income at 125% FPL (no table); priority tiers affect access; not uniform statewide administration
- **Legal Assistance for Seniors** — service ([source](https://mylegalaid.org/how-we-help/seniors/))
  - Shape notes: Decentralized across regional legal aid providers with county-specific coverage; no strict income/asset tests for seniors 60+ but priority-based; multiple intake points routed centrally
- **UCare Minnesota Senior Care Plus (MSC+)** — service ([source](https://hcopub.dhs.state.mn.us/hcpmstd/28_10_10_15.htm (Minnesota DHS) or https://www.ucare.org/health-plans/medicaid/ages-65-plus/msc-plus))
  - Shape notes: Tied to county-based managed care (CBP counties only); benefits include EW waiver services via MCO but require separate functional eligibility for some; multiple competing plans/providers by region; no standalone functional criteria for enrollment but for specific services
- **SecureBlue (Minnesota Senior Health Options)** — service ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp[8]))
  - Shape notes: SecureBlue/MSHO is a 'dual eligible' program combining Medicare and Medicaid benefits into one plan. Benefits are fixed (not tiered by income or household size), but supplemental benefits vary by qualifying chronic conditions and functional need. The program is statewide but availability depends on county-level health plan offerings. Key distinction: MSHO is voluntary enrollment for those already eligible for both Medicare and Medicaid; it is not a needs-based program with income-based benefit scaling. Eligibility is binary (qualify or don't qualify), not graduated.
- **Minnesota Aging Pathways (formerly Senior LinkAge Line)** — service ([source](https://mn.gov/aging-pathways/))
  - Shape notes: no income test for core I&A; eligibility for linked services via county determination; statewide phone hub with local referral triage; formerly Senior LinkAge Line, now rebranded

## Program Details

### Medical Assistance (MA) - Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)


**Eligibility:**
- Income: Income limits are based on Federal Poverty Guidelines (FPG), updated annually effective April 1. For 2026 (approximate figures from available data; check current FPG): QMB ≤100% FPG ($1,585/month single, $2,135/month couple); SLMB >100%-≤120% FPG ($1,781/month single, $2,400/month couple); QI >120%-≤135% FPG ($2,000+/month single, $2,700+/month couple, exact varies by year). Household size adjustments apply per FPG table (e.g., +$415/person beyond couple).[2][4][6]
- Assets: Asset limit is $10,000 for a single person and $20,000 for a couple (standard MSP federal limit; MN follows). Counts: bank accounts, stocks, bonds. Exempt: home, one car, household goods, life insurance, burial plots, $1,500 burial allowance, Native American assets.[2][6]
- Must be entitled to/enrolled in Medicare Part A (premium-free or not).
- U.S. citizen or qualified immigrant.
- Meet MN residency rules.
- QI/SLMB cannot overlap with MA (except retroactive) or MinnesotaCare; QMB can pair with MA.[2][3]

**Benefits:** QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copayments. SLMB: Pays Part B premium only. QI: Pays Part B premium only (priority-based funding). Also auto-qualifies for Extra Help (Part D LIS).[1][2][4][6]
- Varies by: priority_tier

**How to apply:**
- Mail or take to local county/tribal human services office.
- Phone: Contact local county office or MN DHS at 651-431-2670 (general) or 800-657-3739 (MNsure).
- Online: MNsure.org (start app) or county websites.
- In-person: Local county/tribal human services office.

**Timeline:** QMB: Up to 45 days, effective first of month after info received. SLMB/QI: Up to 3 months retroactive if eligible.[1][2]
**Waitlist:** QI may have waitlist/funding priority (QI-1 before QI-2) due to federal caps.[3]

**Watch out for:**
- QI has federal funding caps and priority tiers (QI-1 first); may waitlist.
- Cannot get QI/SLMB with MinnesotaCare or full MA (except retroactive overlap).
- Income countable after deductions; assets include most non-exempt property.
- Apply to state Medicaid agency (MN DHS/county), not Medicare directly.
- Limits change April 1 yearly; verify current FPG.[1][2][3]

**Data shape:** Tiered by income brackets (QMB 100% FPG, SLMB 120%, QI 135%); QI priority/waitlist; county-administered statewide; auto-triggers Extra Help.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm

---

### Elderly Waiver (EW)


**Eligibility:**
- Age: 65+
- Income: Must be eligible for Medical Assistance (MA) for long-term care services. Income limits follow MA guidelines based on federal poverty guidelines (FPG) and family size; exact 2026 dollar amounts not specified in sources but tied to 120% FPG threshold in some contexts. If income exceeds limits, eligible via monthly spenddown (excess income after deductions applied toward care costs). People ≤120% FPG and assets <$3,000 ineligible for Alternative Care but can access EW. Special Income Standard (SIS) allows EW without spenddown if met[2][6][7][8].
- Assets: Asset limit is $3,000 for most individuals (countable assets per MA rules; specifics like exempt primary home, vehicle, etc., follow standard MA LTC guidelines). Married couples assessed separately under spousal impoverishment rules[2][6].
- Eligible for MA payment of long-term care (LTC) services
- Assessed via Long-Term Care Consultation (LTCC) or MnCHOICES and determined to need nursing facility level of care (NF-I or NF-II)
- Live in Minnesota and choose community-based services over nursing facility
- Cost of EW services to MA must be less than estimated nursing home cost
- In need of services beyond standard MA benefits
- U.S. citizen or qualified immigrant, Minnesota resident, SSN required (standard MA rules)

**Benefits:** Home and community-based services including: adult day programs/companionship, personal care assistance, housekeeping/chore help, non-medical transportation, home-delivered meals, home modifications (e.g., ramps, grab bars), emergency response systems, respite for family caregivers, customized living in assisted living, skilled nursing, specialized equipment/supplies, supports for housing transitions, training for family caregivers. No fixed dollar/hour limits specified; individualized via care plan within budget less than nursing home cost[3][5][7].
- Varies by: priority_tier

**How to apply:**
- Contact county or tribal agency for LTCC/MnCHOICES assessment (find contacts at Long-Term Care Consultation contacts via mn.gov/dhs)
- Apply for MA for LTC services via county human services office (face-to-face interview encouraged but not required)
- Phone: Minnesota Aging Pathways at 800-333-2433 for local connections
- In-person or phone via local county/tribal office

**Timeline:** Not specified; eligibility cannot begin before LTCC completed, care plan developed, and MA LTC eligibility determined[2][7].
**Waitlist:** Not mentioned in sources; may vary by county/demand

**Watch out for:**
- Must qualify for MA LTC first; complex dual process (LTCC + MA app) often missed[2][6]
- Spenddown required if income over limits; monthly bills from provider[6][8]
- Services capped below nursing home cost; not unlimited[2][5]
- EW vs. Alternative Care (AC): Low-income/assets ineligible for AC but can use EW[2]
- No EW start until full assessment/MA approval; encourage interview[2]
- 2026 rate adjustments for certain assisted living but provider-specific[8]

**Data shape:** Tied to MA LTC eligibility with spenddown option; county-administered LTCC assessment required; cost cap vs. nursing home; no fixed benefit amounts, individualized plans

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp

---

### Minnesota Senior Health Options (MSHO)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No specific dollar amounts or household size table stated for MSHO itself; eligibility requires enrollment in Medical Assistance (Medicaid), which has its own income and asset limits that vary. MSHO enrollees must meet MA eligibility, including for those on the Elderly Waiver (EW) who have waiver obligations[1][2].
- Assets: Asset limits determined by Medical Assistance (Medicaid) eligibility, which MSHO requires; no MSHO-specific asset details, exempt, or countable items provided in sources. Applicants should check MA rules[2].
- Eligible for Medical Assistance (MA/Medicaid), with or without Medicare[1].
- If Medicare-eligible, must have both Part A and Part B[1][4][5][6].
- Minnesota resident living in a county where an MSHO health plan is offered[5][7].
- Eligible for Elderly Waiver (EW) services if applicable, including waiver obligations[1].
- No functional eligibility criteria for MSHO enrollment, but required for some services like personal care assistance (e.g., need help with 1+ ADL)[2].

**Benefits:** Combines Medicare Parts A/B and Medicaid (MA) services into one managed care plan; includes elderly waiver services, 180 days of nursing facility services (with exceptions for those already in facilities at enrollment), personal care assistance, in-home care, transportation, care coordination; covers everything Medicare/Medicaid does plus extras like broader home/community-based services[1][2][3][5]. No specific dollar amounts or hours per week stated.
- Varies by: region

**How to apply:**
- Phone: Contact health plans directly, e.g., Blue Cross MN at 1-866-477-1584 or (651) 662-1811, TTY 711[6]; general assistance via Minnesota DHS[5].
- Online: Through health plan sites like Medica (portal.medica.com), UCare (ucare.org), Blue Cross MN (bluecrossmn.com)[4][5][6]; check county-specific plans.
- Other: Voluntary enrollment; ensure MA and Medicare eligibility first. No specific mail or in-person details, but DHS oversees[7].

**Timeline:** Not specified in sources.

**Watch out for:**
- Voluntary program; non-enrollees age 65+ on MA go to MSC or MSC+ instead[1].
- Nursing facility services not covered by MCO if already residing there at enrollment; only 180 days if entering later[1].
- Must have Medicare A/B if eligible; EW enrollees pay waiver obligations[1].
- No functional criteria for enrollment but needed for some services; apply only if under MA limits to avoid denial[2].
- County-specific availability; check map[7].
- Prior to 2005, full monthly EW obligation payment required, limiting access[1].

**Data shape:** Requires prior Medical Assistance (MA/Medicaid) eligibility with no MSHO-specific income/asset numbers; county-restricted by health plan service areas; managed by multiple MCOs with regional variations; integrates Medicare A/B and EW services.

**Source:** https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp[7]

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60 or older qualifies for special elderly rules; no age requirement for other household members[2][4]+
- Income: {"standard_households":"Gross income must be at or below 130% of federal poverty guideline[6]","elderly_or_disabled_households":{"note":"No gross income limit if household includes member 60+ or with disability[1][6]","net_income_limits_table":{"1_person":"$1,305/month","2_people":"$1,763/month","3_people":"$2,221/month","4_people":"$2,680/month","5_people":"$3,138/month","6_people":"$3,596/month","7_people":"$4,055/month","8_people":"$4,513/month","each_additional_person":"Add $458/month"},"source":"Net income limits for elderly/disabled households in Minnesota[7]"},"special_case":"If household gross income exceeds 200% of federal poverty level, elderly/disabled households must meet net income test[1][2]","2025_senior_income_limits_federal":"$15,060 for one person; $20,440 for two people[2]"}
- Assets: {"general_rule":"Asset limits apply to most households[2]","what_counts":["The value of your house if you own it","Your retirement savings","The cash value of any life insurance policies","Income-producing property","Household goods"],"elderly_disabled_exception":"Some states do not have asset test unless income exceeds federal poverty line[2]","source":"Search results do not provide specific dollar amounts for Minnesota asset limits"}
- Must be a resident of Minnesota and a U.S. citizen[3]
- Household defined as people who live together and buy food and prepare meals together[3]
- Must meet certain work requirements, with some exceptions[3]
- Income counted includes Social Security, veterans' benefits, and disability payments[2]

**Benefits:** Varies by household net income and size. General formula: $100 more in net income = $30 less in benefits[1]. Example: 2-person elderly/disabled household with $1,200 gross income and standard deductions receives $415/month[4]
- Varies by: household_size and net_income

**How to apply:**
- Online: Minnesota offers online application through state system[3]
- In-person: Local county or Tribal Nation office[3]
- Mail: Send completed form to local county or Tribal Nation office[3]
- Phone: Contact local county office (specific numbers not provided in search results)

**Timeline:** Application completion takes 20-30 minutes[3]. Specific approval timeline not provided in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Minnesota has EXPANDED eligibility beyond federal SNAP requirements — other websites may show stricter limits than actually apply[1]
- Elderly/disabled households have NO gross income limit, only net income limits — this is a major advantage[1][6]
- If you're 60+ and live with others, you can qualify as a SEPARATE SNAP household even if you can't buy/prepare food together[10]
- About half of eligible seniors don't apply — many don't realize they qualify[2]
- Income includes Social Security, veterans' benefits, and disability payments — don't assume fixed income is exempt[2]
- Medical expenses over $35/month can be deducted for elderly/disabled households, reducing net income and increasing benefits[1][7]
- Utility allowances vary by which utilities you pay — this affects your net income calculation[1]
- If household includes someone 60+ or disabled, use the Senior SNAP Application form, not the standard form[3][5]
- Shelter costs (rent, mortgage, property tax, homeowners insurance) are deductible for elderly/disabled households[1]
- The One Big Beautiful Bill Act of 2025 changed SNAP work requirements and non-citizen eligibility — verify current rules[4]

**Data shape:** Minnesota SNAP is unique because: (1) Elderly/disabled households have NO gross income limit, only net income limits, making it easier to qualify than federal baseline; (2) Benefits scale by household size and net income using a specific formula; (3) Deductions for shelter, utilities, and medical expenses significantly reduce net income for elderly/disabled households; (4) Applicants 60+ use a different application form; (5) Applicants can form separate households from others they live with if 60+; (6) Program administered through county/tribal offices, not centralized; (7) Eligibility information is current through Sept. 30, 2026[1][4]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** Minnesota Department of Human Services (dcyf.mn.gov/snap)[9]; USDA SNAP (fns.usda.gov/snap)[4]

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: For the period 10/1/2025 to 9/30/2026, household gross income must be at or below 50% of the state's median income. Full table by household size:
| Household Size | Annual Income Limit | Monthly Income Limit |
|---------------|---------------------|----------------------|
| 1 | $37,439 | $3,119 |
| 2 | $48,959 | $4,079 |
| 3 | $60,479 | $5,039 |
| 4 | $71,999 | $5,999 |
| 5 | $83,518 | $6,959 |
| 6 | $95,038 | $7,919 |
| 7 | $97,198 | $8,099 |
| 8 | $99,358 | $8,279 |
| 9 | $101,518 | $8,459 |
| 10 | $103,678 | $8,639 |
| 11 | $105,838 | $8,819 |
| 12 | $107,998 | $8,999 |
| 13 | $110,158 | $9,179 |
| 14 | $112,318 | $9,359 |
Larger households: Contact Minnesota Department of Commerce for limits.[2][3][4]
- Assets: No asset limits mentioned in available sources.
- Must live in Minnesota.
- Household includes everyone at the address covered by the same utility bill.
- Income based on past one month or last year's federal tax forms for self-employment.

**Benefits:** Regular (Primary Heat): $200 minimum to $1,400 maximum, paid directly to utility. Crisis (Winter): Up to $600; Summer: Not available. Amounts based on household size, income, fuel type, and energy usage. Related Weatherization Assistance Program provides home upgrades like insulation and heating repairs (separate application).[1][5]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://energy-assistance.web.commerce.state.mn.us (excludes Safe at Home participants and 2025-2026 reapplicants).[4][6]
- Phone: 1-800-657-3710 or 651-296-2860 (TTY); local providers (e.g., Hennepin: 952-930-3541).[2][4]
- Mail or in-person: Submit to local Energy Assistance Program (EAP) agency/provider.
- Download application from local provider or state site and submit.

**Timeline:** Within one month of applying.[2]
**Waitlist:** Funding limited; agencies may stop accepting applications if funds run out before May 31.[1][2][5]

**Watch out for:**
- Funding runs out before May 31; apply early (starts September/October).[1][2][5]
- Household includes all at address on utility bill, unlike SNAP.[1]
- Online application unavailable for Safe at Home participants or reapplicants this season.[4]
- Crisis benefits require immediate emergency (e.g., shutoff, low fuel, or 60+ with past-due bill).[1][4]
- Program year: Oct 1-May 31; separate winter/summer crisis timelines.[1][2]

**Data shape:** Income at 50% state median income (SMI); benefits scale by household size, income, fuel type, usage, and crisis/regular tier; local agency administration with funding-limited availability.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/commerce/energy/consumer-assistance/energy-assistance-program/

---

### Residential Energy Assistance Partnership (REAP) / Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Based on 50% of State Median Income (SMI) for household sizes 1-18 and 110% of Federal Poverty Guidelines for 19-20. Example: Family of 4 up to $71,999 annually (2025-2026). Full table at mn.gov/commerce/energy/consumer-assistance/energy-assistance-program/guidelines.jsp. Monthly gross household income cannot exceed guidelines for the full calendar month prior to application signature[3][5][8].
- Assets: None[2].
- Renters and homeowners eligible[1][5].
- US citizen or legally present (eligible non-citizens provide immigration status proof)[3][4].
- SSN required for primary applicant; verifiable SSN or alternative for others[2][3].
- Resident of the county/tribe where applying[2].
- All household income must be reported, regardless of immigration status[3].

**Benefits:** EAP: Payment for home heating costs and furnace repairs. WAP: Free home energy upgrades (e.g., insulation, air sealing, health/safety measures) to save energy and improve home safety[1][7]. No specific dollar amounts or hours stated; one-time assistance per program year.
- Varies by: household_size

**How to apply:**
- Online: mn.gov/home or state.mn.us (Minnesota Energy Programs Application)[1][2][6].
- Phone: Local EAP provider or 1-800-657-3710 to find provider[1][3].
- Mail: To local EAP provider (find via 1-800-657-3710 or county list)[1].
- In-person: Local agency offices (e.g., CAP Agency in Dakota/Carver Counties: 651-322-3500 Rosemount, 952-496-2125 Chaska)[6].

**Timeline:** Agency contacts after eligibility determination; not specified[1].
**Waitlist:** Funds may run out (apply early); offseason applications (Jun-Sep) added to list for WAP/next year[2].

**Watch out for:**
- No age requirement; prioritizes crises (shut-off, no fuel, broken furnace) but open to all eligible[3].
- Deadline May 31, 2026 for 2025-2026; funds limited[1].
- REAP may refer to utility partnerships (e.g., Minnesota Power adds services); core is state EAP/WAP[1].
- Offseason apps for WAP waitlist only[2].
- Must apply to specific county provider; residency required[2].

**Data shape:** County-administered with local providers; income at 50% SMI; no assets/age test; bundled EAP (heating aid) + WAP (weatherization); funds deplete seasonally.

**Source:** https://mn.gov/commerce/consumer/energy-utilities/apply-energy-assistance/index.jsp

---

### Senior Health Insurance Program (SHIP)


**Eligibility:**
- Income: No income limits; available to all Medicare-eligible individuals (typically age 65+, or younger with certain disabilities), their family members, and caregivers[2][6].
- Assets: No asset limits[2][6].
- Must be Medicare-eligible or a family member/caregiver of a Medicare-eligible person[2][6]

**Benefits:** Free, personalized one-on-one counseling on Medicare Parts A/B/D, Medicare Advantage, Medigap, long-term care insurance, Medicare Savings Programs, prescription drug assistance, Medicaid, appeals, denied claims, bill management, and plan comparisons; referrals, printed materials, public education; no sales of insurance products[2][4][6].

**How to apply:**
- Phone: 1-800-333-2433[3][7]
- Website: Minnesota Senior LinkAge Line (via mn.gov or shiphelp.org for local contacts)[3][7]
- In-person: Local offices via Senior LinkAge Line referral (e.g., Minnesota Board on Aging, 540 Cedar Street, P.O. Box 64976, St. Paul, MN 55164-0976)[3]

**Timeline:** Immediate counseling appointment scheduling; no formal processing as it's counseling service[6].

**Watch out for:**
- Not a health insurance or financial aid program itself—provides free counseling only, not coverage or payments[2][4][6]
- Counselors are unbiased and do not sell insurance[2][4]
- Confused with Minnesota Senior Health Options (MSHO), a separate managed care program for MA/Medicare dual eligibles age 65+[1][8]
- Services for Medicare beneficiaries and families, not direct medical care[2]

**Data shape:** no income/asset test; counseling/advocacy only; statewide with local delivery network; often misidentified as insurance coverage program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/boardonaging/ (Senior LinkAge Line via Minnesota Board on Aging); CMS contact: https://www.cms.gov/contacts/minnesota-state-health-insurance-assistance-programsenior-linkage-line[3]

---

### Home-Delivered Meals (via Elderly Waiver/MSHO)


**Eligibility:**
- Age: 65+
- Income: Must qualify for Medical Assistance (MA) for long-term care services. Income limit based on federal poverty guidelines and varies by family size; if exceeded, may qualify via spenddown or waiver. Exact 2026 dollar amounts not specified in sources—check current MA LTC guidelines via county LTCC. No fixed table provided.
- Assets: Must meet Medical Assistance asset limits for long-term care services (total assets within MA LTC limits). Specific countable/exempt assets follow standard MN MA rules (e.g., primary home often exempt up to equity limit, one vehicle exempt, burial plots exempt). Exact limits not detailed—verify via county assessment.
- Minnesota resident.
- Nursing Facility Level of Care (NFLOC) determined via Long-Term Care Consultation (LTCC) assessment.
- At risk of nursing home placement; cost of home/community services less than nursing home.
- Unable to prepare own meals due to disability/functional needs (ADLs/IADLs like eating, mobility).
- Need for services beyond standard MA benefits.
- Choose community living over nursing home.

**Benefits:** Home-delivered nutritionally balanced meals (typically 1+ per day if needs met; additional meals possible via Title III if age 60+). Part of EW HCBS package including personal care, homemaker, respite, etc. No fixed dollar amount or hours specified—authorized based on assessment.
- Varies by: priority_tier

**How to apply:**
- Contact county or tribal Long-Term Care Consultation (LTCC) office for MnCHOICES assessment (find contacts: https://mn.gov/dhs/partners-and-providers/policies-procedures/long-term-care-consultation/contacts.jsp).
- Phone: Minnesota Aging Pathways at 800-333-2433 for local connections.
- Contact case manager or health plan (e.g., MSHO) if already enrolled.
- No specific online form or mail/in-person details beyond county LTCC.

**Timeline:** Not specified.
**Waitlist:** EW is not entitlement; statewide slots limited, waitlist if full (HCBS via EW capped). MSHO/MSC+ are entitlement but EW services within them may waitlist.

**Watch out for:**
- EW has waitlist due to slot limits; not guaranteed even if eligible.
- Must meet full MA LTC financials + NFLOC via LTCC—not automatic for 65+.
- Home-delivered meals require specific inability to prepare meals + cost-effectiveness.
- Ineligible if receiving meals from other funding (e.g., foster care).
- MSHO provides base coverage, but EW HCBS like meals need separate authorization/assessment.
- 60-month look-back for asset transfers applies to EW.

**Data shape:** Tied to EW slots (capped/waitlist); requires county LTCC/MnCHOICES assessment; financials follow MA LTC (income/asset limits + spenddown); varies by functional need tier and local providers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp

---

### Respite Care (via Elderly Waiver)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Must be eligible for Medical Assistance (MA) for long-term care services. Specific income thresholds are not provided in available sources; applicants should contact their county or use the American Council on Aging's free Medicaid Eligibility Test.
- Assets: Home equity interest cannot exceed $730,000 (as of 2025) if applicant lives in home or has intent to return. Exempt assets include: primary home, household furnishings and appliances, personal effects, and one vehicle. Assets should not be given away or sold below fair market value within 60 months prior to application (Medicaid Look-Back Rule violation results in penalty period).
- Must be assessed through Long-Term Care Consultation (LTCC) process and determined to need nursing facility level of care (NF-I or NF-II)
- Must choose to receive services in community instead of nursing facility
- Cost of Elderly Waiver services must be less than estimated nursing home cost
- Must be Minnesota resident
- Must be eligible for Medical Assistance (MA) payment of long-term care services
- Functional need: inability to independently complete Activities of Daily Living (ADLs) and Instrumental Activities of Daily Living (IADLs) including mobility, eating, toileting, bathing, dressing, preparing meals, medication management, laundry, and housecleaning
- Dementia diagnosis alone does not qualify; must meet nursing facility level of care requirement

**Benefits:** Respite care is one of multiple covered services. Full service array includes: adult day programs, companionship, personal care assistance, housekeeping and chore help, non-medical transportation, home-delivered meals, home modifications (ramps, grab bars), emergency response systems, respite for family caregivers, skilled nursing, specialized equipment and supplies, supports during housing transitions, and training/support for family caregivers. Specific hours or dollar amounts for respite care are not specified in available sources.
- Varies by: Individual care plan; cost cannot exceed estimated nursing home cost for that person

**How to apply:**
- Contact county or tribal nation where applicant lives to schedule MnCHOICES assessment (primary method)
- Phone: Minnesota Aging Pathways at 800-333-2433 to connect with local services and to find county/tribal contact information
- In-person: County or tribal nation office

**Timeline:** Not specified in available sources. Eligibility cannot begin before Long-Term Care Consultation (LTCC) is completed, care plan is developed, and MA eligibility for long-term care services is determined.
**Waitlist:** Not specified in available sources

**Watch out for:**
- Respite care is ONE service within the Elderly Waiver program, not a standalone program — applicant must qualify for entire Elderly Waiver to access respite care
- Nursing facility level of care determination is required and is not automatic; dementia diagnosis alone does not qualify
- 60-month Look-Back Rule: assets transferred below fair market value within 5 years trigger penalty period of Medicaid ineligibility
- Home equity limit ($730,000 as of 2025) applies only if applicant lives in home or has intent to return; different rules apply if spouse, minor child, or blind/disabled child lives in home
- Cost of all Elderly Waiver services combined must be less than nursing home cost — respite care budget is not separate
- Medical Assistance (MA) eligibility is prerequisite; not all seniors qualify for MA
- Long-Term Care Consultation (LTCC) assessment is mandatory and must be completed before eligibility can begin
- Application process described as 'especially complex' in official guidelines; face-to-face interview recommended

**Data shape:** Respite care is a component service within the broader Elderly Waiver program, not a standalone benefit. Eligibility is determined at individual level through functional assessment (ADL/IADL capacity) and medical necessity (nursing facility level of care), not through income/asset tables alone. Program is county-administered with statewide eligibility criteria. Specific dollar amounts, hours, or frequency limits for respite care services are not detailed in available sources; these are determined individually through care planning process. Income limits for MA eligibility are not provided in available sources.

**Source:** https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; for example, for a family of 1 it was approximately $14,850 (based on 2020 data—check current HHS poverty guidelines for 2026 figures). No specific Minnesota table provided in sources[1][4][5][7].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Low employment prospects
- U.S. citizen or legally eligible to work
- Priority: Veterans and qualified spouses first, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, or prior American Job Center users[4][5]

**Benefits:** Part-time community service work-based job training averaging 20 hours per week at nonprofit organizations, schools, hospitals, senior centers, day care, etc. Paid the highest of federal, state, or local minimum wage. Includes skills development, career coaching, supportive services, and assistance transitioning to unsubsidized employment[1][2][4][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact Minnesota Department of Employment and Economic Development (DEED): https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp[1]
- Regional providers: e.g., Minnesota Valley Action Council (MVAC) for Blue Earth, Brown, Faribault, Martin, Nicollet, Watonwan counties—email senior@mnvac.org, phone 507-345-6822, in-person 706 N Victory Dr., Mankato, MN, or SCSEP Application form[6]
- CWI Works operates in Minnesota via subgrantees: Check https://www.cwiworks.org/for-job-seekers/our-programs/scsep/scsep-near-you/scsep-in-minnesota/[8]
- MET, Inc.: https://www.metinc.org/senior-employment-program[2]
- American Job Centers for employment assistance[4][5]

**Timeline:** Not specified in sources.
**Waitlist:** Possible regional waitlists implied by provider-specific operations and past furloughs (e.g., East Side Neighborhood Services note)[3]; varies by provider.

**Watch out for:**
- Temporary training program, not permanent employment—goal is transition to unsubsidized jobs[1][4]
- Income limit strictly 125% FPL (updates yearly—verify current)[4][5]
- Priority enrollment for veterans/65+/disabilities means others may wait longer[4][5]
- Operated by multiple grantees, not centralized—must contact local provider[3][6][8]
- Past disruptions like furloughs possible[3]
- Hennepin County example specifies residency there for that provider[3]

**Data shape:** Federally funded via grantees/subgrantees with regional providers in MN; income at 125% FPL (no table); priority tiers affect access; not uniform statewide administration

**Source:** https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp

---

### Legal Assistance for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict means test or dollar amounts specified; prioritized for those with greatest social and economic need, but services available to seniors 60+ regardless of income level in some programs[1][3][4][8]
- Assets: No asset limits or exclusions mentioned
- Civil legal issues only (e.g., elder abuse, public benefits, housing); criminal or personal injury cases ineligible[1][4]
- Focus on low-income or greatest need, but no formal income test for seniors[3][4]

**Benefits:** Civil legal services including advice, brief services, full representation for elder abuse, assisted living/nursing home discharges, public benefits (food support, cash assistance, Social Security, Medical Assistance, home care reductions), debtor/creditor issues, housing, debt collection[1][3][4][6]
- Varies by: priority_tier

**How to apply:**
- Online application at mylegalaid.org[4][10]
- Statewide intake phone: 1-877-MY-MN-LAW (1-877-696-6529)[8]
- Mid-Minnesota Legal Aid: (877) 696-6529 or (800) 292-4150 for disability[4][5]
- Southern Minnesota Regional Legal Services: (888) 575-2954[5]
- LawHelpMN.org for screening and online application[8]
- In-person at regional offices (e.g., Mid-Minnesota Legal Aid Minneapolis: 111 North 5th Street, Suite 100, Minneapolis; St. Cloud: 110 6th Ave S, Ste 200)[4][5]

**Timeline:** Not specified

**Watch out for:**
- Not a single statewide program but coordinated regional legal aid societies; eligibility screening required even for seniors[8]
- Prioritized for greatest need, so not all seniors get full representation[1][3]
- Excludes criminal, personal injury cases[4]
- Services vary by region and provider availability[4][5]
- Call statewide line for routing to avoid wrong office[8]

**Data shape:** Decentralized across regional legal aid providers with county-specific coverage; no strict income/asset tests for seniors 60+ but priority-based; multiple intake points routed centrally

**Source:** https://mylegalaid.org/how-we-help/seniors/

---

### UCare Minnesota Senior Care Plus (MSC+)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No specific dollar amounts or household size table provided in sources; eligibility requires qualifying for Minnesota Medical Assistance (Medicaid), which has income and asset limits based on state Medicaid rules. Families must use Minnesota DHS Medicaid eligibility test or contact county office for exact current limits.
- Assets: No specific dollar amounts provided; follows Minnesota Medical Assistance asset rules (what counts and exemptions determined by state Medicaid guidelines). Contact county human services for details on countable assets and exemptions.
- Eligible for Medical Assistance (Medicaid)
- Minnesota resident living in UCare MSC+ service area or managed care counties (CBP counties for MSC+)
- May or may not have Medicare Part A and Part B
- For some waiver services (e.g., personal care assistance), must demonstrate functional need such as assistance with at least one Activity of Daily Living (ADL: mobility, transferring, eating, toileting, bathing, grooming, dressing) or qualifying behavior

**Benefits:** All Medical Assistance benefits including robust medical, mental health, pharmacy, dental; plus Elderly Waiver (EW) services if eligible (personal care assistance, home/community-based services like homemaker or assisted living, transportation); no-cost office visits, 24/7 Nurse Line, disease management, dental connection, fall prevention kit, healthy food discounts via Healthy Benefits+ Visa card, rewards for preventive screenings, mobile dental clinic, food resources, quit smoking program; free rides to appointments (network providers), translation services, community care connector (varies by plan/provider)
- Varies by: region

**How to apply:**
- Call or visit local county human services office
- Call Minnesota Health Care Programs at 1-800-657-3672 or TTY 1-800-627-3529 or 711
- Print and fill out application from Minnesota Department of Human Services (DHS) website (specific link not provided in sources; search DHS site for Medical Assistance application)
- Contact UCare Customer Service: 612-676-3200 or 1-800-203-7225 (8am-5pm M-F), TTY 612-676-6810 or 1-800-688-2534
- ucare.org/health-plans/medicaid/ages-65-plus/msc-plus

**Timeline:** Not specified in sources

**Watch out for:**
- Not statewide—must live in specific service area or CBP counties; PMAP counties get MSC instead
- Requires underlying Medical Assistance (Medicaid) eligibility first—apply/confirm that separately via county/DHS
- No Medicare coverage included (separate if eligible); MSC+ works with Medicare Part D if chosen
- Some services (e.g., personal care) require separate functional assessment, not automatic
- Mandatory enrollment in managed care if eligible and not choosing MSHO
- Different plans/providers offer varying extra benefits (compare UCare, Blue Plus, etc.)

**Data shape:** Tied to county-based managed care (CBP counties only); benefits include EW waiver services via MCO but require separate functional eligibility for some; multiple competing plans/providers by region; no standalone functional criteria for enrollment but for specific services

**Source:** https://hcopub.dhs.state.mn.us/hcpmstd/28_10_10_15.htm (Minnesota DHS) or https://www.ucare.org/health-plans/medicaid/ages-65-plus/msc-plus

---

### SecureBlue (Minnesota Senior Health Options)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Search results do not provide specific dollar amounts for income limits. MSHO eligibility requires Medical Assistance (Medicaid) eligibility, which has income thresholds, but these are not detailed in available sources. Families should contact their county Medicaid office or a Medicaid planning assistant for current income limits by household size.
- Assets: Search results do not specify asset limits for SecureBlue/MSHO. Asset limits are part of Medicaid eligibility but are not detailed in available sources.
- Must be a United States citizen or lawfully present in the United States[2]
- Must have Medicare Parts A and B[2][4]
- Must be eligible for Medical Assistance (Medicaid) without a medical spenddown[2]
- Must live in a Minnesota county where SecureBlue is offered (SecureBlue is available in all 87 Minnesota counties[4]; however, other MSHO plans may be limited to specific counties such as Anoka, Benton, Carver, Chisago, Dakota, Hennepin, Ramsey, Scott, Sherburne, Stearns, Washington, or Wright[2])
- If already enrolled in MSHO with a medical spenddown prior to July 1, 2005, or acquired a spenddown after enrollment, may remain enrolled[3]

**Benefits:** SecureBlue provides: $0 monthly premium, $0 Part D drugs, $0 deductibles and copays[4]; physical exams and doctor visits; prescription drug coverage; emergency coverage; vision benefits including progressive and transition lenses; dental benefits; hearing aids; over-the-counter (OTC) allowance; access to 97% of Minnesota doctors[4]; supplemental benefits including companionship/friendly visiting (60 hours per year in-home and telephonic support through LSS Care Companion)[1]; emergency care planning; readmission prevention with in-home support following hospital stays[1]; meals and food/nutrition education for members with qualifying chronic conditions (cancer, COPD, chronic heart failure, coronary artery disease, diabetes, end-stage renal disease, HIV/AIDS, peripheral vascular disease, rheumatoid arthritis, stroke)[1]; personal emergency response system (PERS) devices; medication dispensers with caregiver notifications[4]; SilverSneakers access; rewards for completing wellness activities[2]
- Varies by: Supplemental benefits vary by qualifying chronic conditions and functional need. Some benefits (e.g., meals/nutrition education) are limited to members with specific diagnoses[1]

**How to apply:**
- Contact county Medicaid office (specific phone numbers and websites not provided in search results)
- Contact SecureBlue/Blue Cross Blue Shield Minnesota directly (specific phone number not provided in search results)
- Online application through Minnesota Department of Human Services (specific URL not provided in search results)

**Timeline:** Search results do not specify processing time or timeline for SecureBlue/MSHO enrollment
**Waitlist:** Search results do not mention a waitlist for SecureBlue/MSHO

**Watch out for:**
- Medical spenddown disqualifies new applicants: People with medical spenddowns cannot enroll in MSHO unless they were already enrolled before July 1, 2005, or acquired the spenddown after enrollment[3]
- Nursing facility coverage is limited: If enrolled in MSHO while living in the community, the plan covers up to 180 days of nursing facility services. However, if already residing in a nursing facility on the enrollment date, nursing facility services are NOT covered[3]
- Supplemental benefits require eligibility verification: Supplemental benefits like meals/nutrition education are only available to members with specific chronic conditions, and eligibility is based on BCBS claims/records, member report, or care coordinator report[1]
- County availability matters: While SecureBlue is statewide, other MSHO plans may only be available in specific counties; families must verify their county has an MSHO plan option[8]
- Care coordinator assignment: All MSHO members are assigned a care coordinator who helps arrange services; this is a key feature but requires proactive engagement[8]
- Income and asset limits not specified in marketing materials: Families must verify Medicaid eligibility separately; the search results do not provide specific dollar thresholds

**Data shape:** SecureBlue/MSHO is a 'dual eligible' program combining Medicare and Medicaid benefits into one plan. Benefits are fixed (not tiered by income or household size), but supplemental benefits vary by qualifying chronic conditions and functional need. The program is statewide but availability depends on county-level health plan offerings. Key distinction: MSHO is voluntary enrollment for those already eligible for both Medicare and Medicaid; it is not a needs-based program with income-based benefit scaling. Eligibility is binary (qualify or don't qualify), not graduated.

**Source:** https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp[8]

---

### Minnesota Aging Pathways (formerly Senior LinkAge Line)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits for core information and referral services; available free to all older adults and caregivers. For connected long-term care services (e.g., resource coordination), eligibility is determined by county social service offices or managed care organizations based on income and asset guidelines, but exact dollar amounts not specified in program details.
- Assets: No asset limits for core services. For linked public long-term care programs, assets follow Medicaid rules where applicable (e.g., primary home exempt if equity ≤$730,000 in 2025, household items, personal effects, one vehicle exempt; look-back rule applies for transfers).
- Minnesota resident
- Older adults (60+), caregivers, or family members seeking support to remain/return home
- For resource coordination: at risk of nursing home placement or needing community services
- No functional need required for initial info/referral

**Benefits:** Free information and assistance (I&A) on aging services, Medicare counseling, resource coordination (person-centered plans to live at home, service connections, follow-up), preadmission screening (PAS) for nursing facility admissions, referrals to long-term care options, Minnesota Aging and Disability Resources exploration. No fixed dollar amounts or hours; services tailored via phone consultation and plans.

**How to apply:**
- Phone: 800-333-2433 (Mon-Fri 8:00 a.m. to 4:30 p.m.; press option 1 for housing)
- Online referral: www.sllreferral.org (for providers, facilities, individuals/caregivers)
- Referrals from nursing facilities, hospitals, assisted living, clinics, home care, hospice, ombudsman

**Timeline:** Phone assistance immediate; resource coordination involves discussion and plan development (timeline not specified); PAS review leads to in-person assessment or call as needed.

**Watch out for:**
- Not a direct service provider—connects to services but does not fund or deliver them (eligibility for actual benefits via counties/Medicaid)
- Required for certain transitions (e.g., PAS mandatory for nursing facility admissions, long-term care options counseling for assisted living)
- Free I&A open to all, but deeper resource coordination targeted to those 60+ at home or transitioning
- Medicare counseling limited to those eligible for Medicare benefits
- Referrals often initiated by providers/facilities, not always self-referral

**Data shape:** no income test for core I&A; eligibility for linked services via county determination; statewide phone hub with local referral triage; formerly Senior LinkAge Line, now rebranded

**Source:** https://mn.gov/aging-pathways/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medical Assistance (MA) - Qualified Medi | benefit | federal | deep |
| Elderly Waiver (EW) | benefit | state | deep |
| Minnesota Senior Health Options (MSHO) | benefit | local | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Residential Energy Assistance Partnershi | benefit | federal | deep |
| Senior Health Insurance Program (SHIP) | resource | federal | simple |
| Home-Delivered Meals (via Elderly Waiver | benefit | state | deep |
| Respite Care (via Elderly Waiver) | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Seniors | resource | local | simple |
| UCare Minnesota Senior Care Plus (MSC+) | resource | local | simple |
| SecureBlue (Minnesota Senior Health Opti | benefit | state | deep |
| Minnesota Aging Pathways (formerly Senio | resource | state | simple |

**Types:** {"benefit":9,"resource":4,"employment":1}
**Scopes:** {"federal":6,"state":5,"local":3}
**Complexity:** {"deep":10,"simple":4}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/MN/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **region**: 2 programs
- **household_size and net_income**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **household_size**: 1 programs
- **not_applicable**: 2 programs
- **Individual care plan; cost cannot exceed estimated nursing home cost for that person**: 1 programs
- **Supplemental benefits vary by qualifying chronic conditions and functional need. Some benefits (e.g., meals/nutrition education) are limited to members with specific diagnoses[1]**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medical Assistance (MA) - Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)**: Tiered by income brackets (QMB 100% FPG, SLMB 120%, QI 135%); QI priority/waitlist; county-administered statewide; auto-triggers Extra Help.
- **Elderly Waiver (EW)**: Tied to MA LTC eligibility with spenddown option; county-administered LTCC assessment required; cost cap vs. nursing home; no fixed benefit amounts, individualized plans
- **Minnesota Senior Health Options (MSHO)**: Requires prior Medical Assistance (MA/Medicaid) eligibility with no MSHO-specific income/asset numbers; county-restricted by health plan service areas; managed by multiple MCOs with regional variations; integrates Medicare A/B and EW services.
- **Supplemental Nutrition Assistance Program (SNAP)**: Minnesota SNAP is unique because: (1) Elderly/disabled households have NO gross income limit, only net income limits, making it easier to qualify than federal baseline; (2) Benefits scale by household size and net income using a specific formula; (3) Deductions for shelter, utilities, and medical expenses significantly reduce net income for elderly/disabled households; (4) Applicants 60+ use a different application form; (5) Applicants can form separate households from others they live with if 60+; (6) Program administered through county/tribal offices, not centralized; (7) Eligibility information is current through Sept. 30, 2026[1][4]
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income at 50% state median income (SMI); benefits scale by household size, income, fuel type, usage, and crisis/regular tier; local agency administration with funding-limited availability.
- **Residential Energy Assistance Partnership (REAP) / Weatherization Assistance Program (WAP)**: County-administered with local providers; income at 50% SMI; no assets/age test; bundled EAP (heating aid) + WAP (weatherization); funds deplete seasonally.
- **Senior Health Insurance Program (SHIP)**: no income/asset test; counseling/advocacy only; statewide with local delivery network; often misidentified as insurance coverage program
- **Home-Delivered Meals (via Elderly Waiver/MSHO)**: Tied to EW slots (capped/waitlist); requires county LTCC/MnCHOICES assessment; financials follow MA LTC (income/asset limits + spenddown); varies by functional need tier and local providers.
- **Respite Care (via Elderly Waiver)**: Respite care is a component service within the broader Elderly Waiver program, not a standalone benefit. Eligibility is determined at individual level through functional assessment (ADL/IADL capacity) and medical necessity (nursing facility level of care), not through income/asset tables alone. Program is county-administered with statewide eligibility criteria. Specific dollar amounts, hours, or frequency limits for respite care services are not detailed in available sources; these are determined individually through care planning process. Income limits for MA eligibility are not provided in available sources.
- **Senior Community Service Employment Program (SCSEP)**: Federally funded via grantees/subgrantees with regional providers in MN; income at 125% FPL (no table); priority tiers affect access; not uniform statewide administration
- **Legal Assistance for Seniors**: Decentralized across regional legal aid providers with county-specific coverage; no strict income/asset tests for seniors 60+ but priority-based; multiple intake points routed centrally
- **UCare Minnesota Senior Care Plus (MSC+)**: Tied to county-based managed care (CBP counties only); benefits include EW waiver services via MCO but require separate functional eligibility for some; multiple competing plans/providers by region; no standalone functional criteria for enrollment but for specific services
- **SecureBlue (Minnesota Senior Health Options)**: SecureBlue/MSHO is a 'dual eligible' program combining Medicare and Medicaid benefits into one plan. Benefits are fixed (not tiered by income or household size), but supplemental benefits vary by qualifying chronic conditions and functional need. The program is statewide but availability depends on county-level health plan offerings. Key distinction: MSHO is voluntary enrollment for those already eligible for both Medicare and Medicaid; it is not a needs-based program with income-based benefit scaling. Eligibility is binary (qualify or don't qualify), not graduated.
- **Minnesota Aging Pathways (formerly Senior LinkAge Line)**: no income test for core I&A; eligibility for linked services via county determination; statewide phone hub with local referral triage; formerly Senior LinkAge Line, now rebranded

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Minnesota?
