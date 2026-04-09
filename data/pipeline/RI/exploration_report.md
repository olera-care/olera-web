# Rhode Island Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 49s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 17 |
| New (not in our data) | 9 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 5 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **unknown**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Rhode Island Medicaid

- **income_limit**: Ours says `$1304` → Source says `$2,982` ([source](https://eohhs.ri.gov/consumer/health-care or https://staycovered.ri.gov/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Comprehensive medical coverage: physician visits, prescription drugs, emergency room, short-term hospital stays. Long-term services/supports (LTSS): nursing home care, assisted living, shared living/adult foster care, home-based non-medical services (personal care, homemaker). Dual eligibles (Medicare+Medicaid) via Neighborhood INTEGRITY managed care (NHPRI): coordinates all benefits, covers LTSS in home/facility at no extra cost. Office of Healthy Aging (OHA): limited home/community services like personal care/homemaker for 65+ or dementia under 65.` ([source](https://eohhs.ri.gov/consumer/health-care or https://staycovered.ri.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://eohhs.ri.gov/consumer/health-care or https://staycovered.ri.gov/`

### PACE-RI (Program of All-Inclusive Care for the Elderly)

- **min_age**: Ours says `65` → Source says `55` ([source](https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply))
- **income_limit**: Ours says `$2901` → Source says `$4,000` ([source](https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive all-inclusive health care including: primary and acute care (physician and hospital services), day activities, rehabilitation, pharmacy, in-home care, meals, social and behavioral supports, transportation to/from service centers and outside medical appointments, and emergency transportation. If needed, PACE can arrange and pay for LTSS in participant's home[2].` ([source](https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply`

### Supplemental Nutrition Assistance Program (SNAP)

- **income_limit**: Ours says `$1980` → Source says `$2,608` ([source](https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits loaded on EBT card for food purchases at authorized retailers. Maximum: ~$291 for 1-person household, ~$535 for 2-person (2026; actual amount based on income/deductions, often less than max).[1]` ([source](https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$3,521` ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time grant paid directly to utility or fuel company for heating costs. Minimum $75, maximum $1285 (FFY2025; 2026 similar). Crisis grants for emergencies like shutoffs or broken heaters. Amounts based on income, household size, fuel type, minimum delivery.[2][5][7]` ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program`

### RI SHIP (State Health Insurance Assistance Program)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free one-on-one counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), enrollment in prescription drug plans and health plans, applications for low-income programs (Medicaid, Medicare Savings Programs, Extra Help/LIS), resolving Medicare problems, education on rights/protections, and outreach presentations; provided by trained, independent counselors and volunteers[1][3][5]` ([source](https://oha.ri.gov (Office of Healthy Aging, RI SHIP sponsor)))
- **source_url**: Ours says `MISSING` → Source says `https://oha.ri.gov (Office of Healthy Aging, RI SHIP sponsor)`

### Meals on Wheels

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.rimeals.org))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered meals meeting one-third of daily dietary needs, including medically therapeutic and culturally responsive options; wellness checks, health education, social interaction, delivery of seasonal essentials; Capital City Café Program (congregate meals)` ([source](https://www.rimeals.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.rimeals.org`

### Rhode Island Legal Services (RILS) Elder Law Unit

- **min_age**: Ours says `65` → Source says `60` ([source](https://rils.org))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free legal advice, assistance, and representation for low-income elders 60+ on issues including physical/mental abuse, abandonment, neglect, financial exploitation, government benefits appeals, landlord-tenant disputes, subsidized housing, consumer issues, family law[2][5][7][8]` ([source](https://rils.org))
- **source_url**: Ours says `MISSING` → Source says `https://rils.org`

## New Programs (Not in Our Data)

- **Home and Community-Based Services (HCBS) Waiver** — service ([source](https://eohhs.ri.gov/Consumer/ConsumerInformation/Healthcare/LongTermServicesandSupports/HomeandCommunityBasedServices.aspx[8]))
  - Shape notes: Consolidated into statewide 1115 Comprehensive Demonstration waiver via MLTSS; limited slots with waitlists; requires NFLOC; no detailed income/asset tables by household size or exact service limits/hours; co-pays apply to some services.
- **Medicare Premium Payment Program (MPP) / QMB** — financial ([source](https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx))
  - Shape notes: Two tiers (QMB expanded to ~126% FPL, QI to ~142% FPL) with fixed income/asset by household size (individual/couple); QI waitlist; auto-QMB for prior SLMB; higher assets than full Medicaid but apply together.
- **Residential Weatherization Assistance Program** — service ([source](https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/weatherization-assistance-program-wap))
  - Shape notes: Eligibility tied directly to LIHEAP qualification (60% median income, no assets); priority for elderly/disabled households; administered statewide via regional CAP agencies with varying contact points and minor service emphases.
- **Alzheimer's Respite Voucher Program** — financial ([source](https://oha.ri.gov/resources/caregiver-supportsrespite[6]))
  - Shape notes: Administered via CareBreaks Respite Program under Lifespan Respite Care Program; limited public details on exact income/asset limits or voucher values; state-funded with potential dementia-specific restrictions.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (federal); https://dlt.ri.gov/individuals/jobseeker-resources-2025 (RI DLT)))
  - Shape notes: Grantee-administered with local variations; no RI-specific income table, processing times, or exact offices in results; priority-based enrollment; use national locator for state-specific contacts
- **Rhode Island Pharmaceutical Assistance Program for the Elderly (RIPAE)** — financial ([source](https://oha.ri.gov/resources/health-insurance-health-care-cost-assistance/drug-cost-assistance))
  - Shape notes: Tiered by income levels with specific co-pay percentages; no asset test; restricted to Part D deductible/non-covered approved drugs; separate tier for 55-64 disabled
- **At HOME Cost Share Program** — financial ([source](https://oha.ri.gov/resources/home-care/home-cost-share[2]))
  - Shape notes: Tiered participant cost-share by income brackets (no asset test); services via individualized plan; non-Medicaid alternative with state subsidy
- **Ocean State Senior Dining Program** — service ([source](https://oha.ri.gov/resources/food-and-nutrition))
  - Shape notes: Statewide but highly decentralized with ~70 local Community Table sites and varying providers; no means test, emphasis on suggested donations and social dining; reservation-driven rather than entitlement-based.
- **RIPTA Senior Reduced Fare Bus Pass** — service ([source](https://www.ripta.com/reducedfare))
  - Shape notes: Two-tiered by income: free all-day for low-income only; reduced off-peak for all seniors/disabled regardless of income; no asset test or household size income table; mobile outreach statewide.

## Program Details

### Rhode Island Medicaid


**Eligibility:**
- Age: 65+
- Income: For Nursing Home Medicaid (Institutional/Long-Term Care) in 2026: $2,982/month for a single applicant; $5,964/month ($2,982/month per spouse) for couples. Almost all income counts (IRA, pensions, Social Security, wages, etc.), but nursing home residents keep $75/month personal needs allowance plus Medicare premiums if dual eligible. For Elders and Adults with Disabilities (EAD): SSI recipients auto-eligible; others follow Medically Needy Income Limits (MNIL) of $1,200/month individual, $1,242/month couple (effective 1/1/26). LTSS allows higher income with co-share payment.
- Assets: For Nursing Home Medicaid: $4,000 for single applicant ($8,000 for couples, $4,000 per spouse); non-applicant spouse up to $162,660. For EAD: $4,000 countable assets for single. Countable: most financial assets. Exempt: primary home (if intent to return), one car, personal belongings, burial plots/funds (limits apply).
- Rhode Island resident
- U.S. citizen or qualified immigrant (e.g., refugees, 5-year wait for some lawful permanent residents post-8/22/96)
- Nursing Facility Level of Care (NFLOC) for long-term care programs: assessed via Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (shopping, cooking, cleaning); administered by RI Department of Human Services
- For basic EAD healthcare: aged 65+ or disabled (no NFLOC needed)
- SSI recipients automatically eligible

**Benefits:** Comprehensive medical coverage: physician visits, prescription drugs, emergency room, short-term hospital stays. Long-term services/supports (LTSS): nursing home care, assisted living, shared living/adult foster care, home-based non-medical services (personal care, homemaker). Dual eligibles (Medicare+Medicaid) via Neighborhood INTEGRITY managed care (NHPRI): coordinates all benefits, covers LTSS in home/facility at no extra cost. Office of Healthy Aging (OHA): limited home/community services like personal care/homemaker for 65+ or dementia under 65.
- Varies by: priority_tier

**How to apply:**
- Online: HealthSource RI (healthsourceri.com) streamlined application determines Medicaid/other coverage
- Phone: Not specified in results; use HealthSource RI or EOHHS general lines
- Mail/In-person: Via Executive Office of Health and Human Services (EOHHS); longer forms for long-term care
- Streamlined system via HealthSource RI points to LTSS if needed

**Timeline:** Not specified in results

**Watch out for:**
- Nursing home residents must contribute most income to care costs (keep only $75/month personal needs + Medicare premiums)
- Higher LTSS income allowed but requires co-share payment
- NFLOC required for long-term care (not just age/disability)
- Assets strictly limited; planning needed to avoid penalties (e.g., divestment divisor $335/day)
- Different Medicaid types (e.g., EAD vs. Institutional vs. LTSS waivers); check Benefits Decision Notice (BDN)
- SSI auto-eligibility, but others need full financial/functional tests
- Immigrant rules: 5-year wait for some post-1996 entrants

**Data shape:** Multiple tiers (Nursing Home Medicaid, EAD, LTSS waivers) with varying income/asset limits and NFLOC requirements; 2026 figures updated annually; dual eligible coordination via single managed care plan; functional assessment key for LTC

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://eohhs.ri.gov/consumer/health-care or https://staycovered.ri.gov/

---

### Home and Community-Based Services (HCBS) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be Medicaid eligible with low income, typically below 133% of the federal poverty level (exact FPL dollar amounts not specified in sources; for nursing home level care context, single applicant under $2,982/month in 2026). No full household size table provided; SSI-related eligibility automatically approves for Regular Medicaid including LTSS if functional criteria met[1][4][6].
- Assets: For nursing home level care context (required for HCBS), single applicant assets under $4,000. What counts and exemptions not detailed; SSI pathway may apply differently[4].
- Must be eligible for Medicaid[1][3][4].
- Nursing Facility Level of Care (NFLOC) required, based on medical need for institutional care, inability to perform Activities of Daily Living (ADLs), or long-term disability expected to last at least 6 months or life-threatening[1][2][4].
- Reside in Rhode Island[1].
- Able to benefit from waiver services[1].
- For some benefits like respite, additional criteria such as inability to be left unsupervised[4].

**Benefits:** Wide range of home and community-based services including personal care, home health, respite care (e.g., T1005 up to 15 mins), homemaker services, companion care (S5136 per diem), habilitation services, adult day care, assisted living (24-hour personal care, medication management, activities, transportation), assessment services (T1028). Provided as lower-cost alternative to nursing facilities; may include hospital-based personal care for participants. Co-pays may apply (hourly for personal care/homemaker, daily for adult day care)[1][3][8]. No specific dollar amounts or hours per week stated; services individualized.
- Varies by: priority_tier

**How to apply:**
- Contact Rhode Island Department of Health (RIDOH) or Executive Office of Health and Human Services (EOHHS) for information and application[1][8].
- No specific phone number, online URL, mail address, or in-person offices listed in sources; start with state Medicaid agency via Medicaid.gov state search tool[2].

**Timeline:** Not specified in sources.
**Waitlist:** Limited participant slots; waiting lists may exist as not an entitlement[4].

**Watch out for:**
- Not an entitlement; limited slots and waitlists unlike nursing home Medicaid[4].
- Must meet NFLOC, not just general functional needs[2][4].
- All traditional 1915(c) HCBS waivers consolidated into 1115 demonstration and MLTSS; no separate 1915(c) programs[5][6].
- Income mostly paid as patient liability except personal needs allowance ($75/month), Medicare premiums[4].
- Co-pays for some services (e.g., hourly personal care, daily adult day)[3].
- Rhode Island uses 1115 waiver only for HCBS, no 1915(c)[6].

**Data shape:** Consolidated into statewide 1115 Comprehensive Demonstration waiver via MLTSS; limited slots with waitlists; requires NFLOC; no detailed income/asset tables by household size or exact service limits/hours; co-pays apply to some services.

**Source:** https://eohhs.ri.gov/Consumer/ConsumerInformation/Healthcare/LongTermServicesandSupports/HomeandCommunityBasedServices.aspx[8]

---

### PACE-RI (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No specific income limits stated in available sources. PACE-RI is available to those eligible for Medicaid LTSS and/or Medicare. Medicaid LTSS has financial limits: countable resources may not exceed $4,000 for an individual[1]. Income assessment is conducted but specific thresholds are not detailed in search results.
- Assets: Countable resources may not exceed $4,000 for an individual[1]. Search results do not specify which assets are exempt or how spousal assets are treated.
- Must reside in Rhode Island[1]
- Must be determined to need a clinical level of care by the state[4]
- Must be able to live safely in the community at time of enrollment[2][4]
- Must live in a PACE service area[2]

**Benefits:** Comprehensive all-inclusive health care including: primary and acute care (physician and hospital services), day activities, rehabilitation, pharmacy, in-home care, meals, social and behavioral supports, transportation to/from service centers and outside medical appointments, and emergency transportation. If needed, PACE can arrange and pay for LTSS in participant's home[2].
- Varies by: not_applicable — all eligible participants receive the full array of coordinated services

**How to apply:**
- Phone: 401-490-6566 (PACE enrollment specialist)[2]
- Phone: (401) 574-8474 (RI Department of Human Services for general LTSS information)[1]
- In-person: At one of three PACE Health Care Centers (Providence, Woonsocket, Westerly)[2]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE is NOT statewide — you must live within one of three service areas (Providence, Woonsocket, Westerly) to qualify[2]
- You must be able to live safely in the community at enrollment — this is a clinical determination, not automatic[2][4]
- Asset limit of $4,000 is strict for Medicaid LTSS eligibility; search results do not clarify exemptions for home, vehicle, or other assets[1]
- Greater than 90% of PACE-RI participants are dually eligible for Medicare and Medicaid, suggesting this program serves a lower-income population[3]
- PACE requires ongoing assessment including social work evaluation, nutrition assessment, and case management — it is not a passive benefit[3]
- Search results do not specify processing timelines, waitlist status, or whether enrollment is continuous or seasonal

**Data shape:** PACE-RI is a geographically limited program (3 centers only) with all-inclusive service delivery model. Eligibility is tied to Medicaid LTSS or Medicare qualification plus clinical level of care determination. Unlike many programs, PACE does not have tiered benefits — all participants receive the full array of services. The program emphasizes community-based care with stable case management relationships. Critical gap: specific income thresholds, asset exemptions, processing times, and current waitlist status are not available in search results.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/long-term-services-and-supports/eligibility-how-apply

---

### Medicare Premium Payment Program (MPP) / QMB

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For QMB (as of February 1, 2026): Individual monthly income limit $1,683; Married couple $2,275. For QI: Individual $2,255; Married couple $3,050. These reflect Rhode Island's expanded limits above federal standards (100% FPL for QMB, up to 135% for QI). Income includes $20 general disregard; SNAP benefits excluded. Former SLMB (100-120% FPL) now auto-enrolls into QMB.[1][2]
- Assets: Individual: $9,950; Married couple: $14,910. Counts: savings, checking, real estate, retirement accounts. Exempt: primary home (if equity under certain limits), one vehicle, household goods, life insurance (up to $1,500 face value), burial funds (pre-paid up to $1,500). Note: Full Medicaid (more comprehensive) has stricter $4,000 individual/$6,000 couple asset limit; apply for both if possible.[1][2][3][5]
- Must be enrolled in or qualify for Medicare Part A.
- Age 65+ or adult with disability.
- U.S. citizen or qualified immigrant (e.g., refugees, asylees, LPRs with 5-year status or pre-1996/1997 RI residency rules).[3]
- Reside in Rhode Island.

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, copayments, and coinsurance. Also auto-qualifies for Extra Help (LIS) ~$5,700/year value for Part D drugs. QI: Pays Medicare Part B premiums only.[1][2][4][6]
- Varies by: priority_tier

**How to apply:**
- Visit local DHS Office (in-person).
- Call local DHS Office.
- Online via RI DHS eligibility system (not specified; start at eohhs.ri.gov).
- Mail to local DHS Office.

**Timeline:** Not specified in sources; contact local DHS for details.
**Waitlist:** QI has limited funds; first-come, first-served basis only.[1][2]

**Watch out for:**
- RI expanded QMB to include former SLMB eligibles (auto-enrolled as of Feb 2026); don't apply separately for SLMB.[2]
- QI funds limited—apply early; first-come, first-served.[1][2]
- QMB assets higher ($9,950/$14,910) than full Medicaid ($4,000/$6,000); apply for Medicaid first for broader coverage including Rx drugs.[2][3][5]
- Must have Medicare Part A; providers can't bill QMB enrollees for copays (but some may not know).[4]
- Outdated federal limits in some sources; use RI-specific 2026 figures ($1,683 etc.).[2][6]

**Data shape:** Two tiers (QMB expanded to ~126% FPL, QI to ~142% FPL) with fixed income/asset by household size (individual/couple); QI waitlist; auto-QMB for prior SLMB; higher assets than full Medicaid but apply together.

**Source:** https://eohhs.ri.gov/Consumer/ProgramsServices/MedicarePremiumPaymentProgram.aspx

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with at least one member age 60+ or disabled: Gross monthly income limit of 200% FPL (e.g., $2,608 for 1 person; exact amounts scale by household size per federal FPL charts for Oct 2025-Sept 2026). Must also meet net income test of 100% FPL. No gross income test if all members are 60+ or disabled. Households without elderly/disabled: 185% FPL gross. SSI recipients are categorically eligible. Higher medical ($35+ threshold) and shelter deductions apply for seniors.[1][2][5][6]
- Assets: No asset limit in Rhode Island for most households, including those with elderly/disabled members. If gross income exceeds 200% FPL but meets net/asset federal rules, federal asset limit of $4,500 may apply (though RI waives for most). Exempt: primary home, most retirement savings, vehicles. Application may still request asset info.[2][6]
- Rhode Island resident and U.S. citizen or qualified non-citizen with SSN.
- Household defined by those who buy/prepare food together.
- For ESAP (Elderly & Disabled Simplified Application Project): All members 60+ or disabled, no earned income from work; longer certification periods.[4]
- Able-bodied adults without dependents may face work requirements.

**Benefits:** Monthly benefits loaded on EBT card for food purchases at authorized retailers. Maximum: ~$291 for 1-person household, ~$535 for 2-person (2026; actual amount based on income/deductions, often less than max).[1]
- Varies by: household_size

**How to apply:**
- Online: Rhode Island DHS portal (dhs.ri.gov/applications).
- Phone: State SNAP hotline (specific number via dhs.ri.gov or 1-855-MY-RI-DHS).
- Mail/In-person: Local Department of Human Services (DHS) offices statewide.
- Telephone interviews often available for elderly.

**Timeline:** Typically 30 days; expedited for urgent cases (7 days if very low income). ESAP simplifies process.[1][4]

**Watch out for:**
- Seniors often miss higher deductions for medical/shelter costs over $35/month, which can increase benefits.[1]
- Household includes all who buy/prepare food together, even non-eligible family.[3]
- No gross income test for pure elderly/disabled households, but net test applies.[2][5]
- ESAP eligibility requires no earned income and all elderly/disabled.[4]
- Assets usually not counted, but report if asked; own home/savings often exempt.[6]
- Social Security/pensions count as income.[3]

**Data shape:** Benefits scale by household size and net income after elderly-specific deductions (medical >$35, shelter); no asset test for most RI households with seniors; ESAP for simplified process; expanded 200% FPL gross for elderly/disabled.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly household income at or below 60% of Rhode Island State Median Income (SMI). FFY2026 limits (from Westbay CAP example, applicable statewide): Household of 1: $3,521/month ($42,252/year); 2: $4,604/month ($55,252/year); 3: $5,687/month ($68,253/year). Full table available in official FFY2026 Eligibility Chart PDF. Counts gross income including wages, self-employment (60%), unemployment, Social Security, alimony, etc.[2][5][7]
- Assets: No asset or resource limits; resources are not counted.[4]
- U.S. citizen or lawfully present immigrant (mixed-status households eligible based on eligible members),[4]
- Responsible for heating costs (renters or homeowners),[3]
- No requirement for unpaid bill or public assistance.[3]

**Benefits:** One-time grant paid directly to utility or fuel company for heating costs. Minimum $75, maximum $1285 (FFY2025; 2026 similar). Crisis grants for emergencies like shutoffs or broken heaters. Amounts based on income, household size, fuel type, minimum delivery.[2][5][7]
- Varies by: household_size|priority_tier

**How to apply:**
- Online: https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program (state portal) or local CAP agency portals,[3][6][8]
- Phone: Local CAP agencies e.g. CAPP (401)-273-2000, EBCAP 401-437-1000 ext. 6606,[6][8]
- In-person or dropbox: Local Community Action Program (CAP) agencies,[3][6]
- Mail: To local CAP agency; renewal forms mailed in September.[3][7]

**Timeline:** 3-5 business days for initial review; staff contacts for more info.[6]
**Waitlist:** Funding limited; applications may close early if funds exhausted. Priority for shutoff/termination notices.[1][6]

**Watch out for:**
- No cooling assistance in RI,[1]
- Crisis only for true emergencies (e.g., shutoff, broken furnace),[1]
- Must apply early; funds run out (season Oct-May, renewals Sept),[1][3]
- New applicants prefer in-person; online requires email verification within 30 min,[3][6]
- Gross income used (no deductions except self-employment 60%), roommates count as household if sharing utilities,[1][2]
- Weatherization separate, requires LIHEAP eligibility first.[5]

**Data shape:** Income at 60% SMI (table by household size, FFY yearly updates); no assets; CAP agencies handle apps statewide with local contacts; priority tiers for crisis; grants scale by income/size/fuel.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/low-income-home-energy-assistance-program

---

### Residential Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must qualify for LIHEAP, which requires household income at or below 60% of Rhode Island's Median Income. Exact dollar amounts not specified in sources; refer to current LIHEAP guidelines via local CAP agency as they vary by household size. Also eligible if on RI Energy low-income rate A-60.[1][2][3][4][6][8]
- Assets: No asset or resource limits; resources are not counted for LIHEAP eligibility, which determines WAP qualification.[8]
- Must first apply for and qualify for LIHEAP (heating assistance).[1][3][4][6]
- Homeowners eligible; renters eligible with landlord approval.[1][3][4]
- Home must not have been weatherized recently (e.g., energy audit within last 10 years may disqualify); certain conditions like mold may defer services.[3][4]
- Rhode Island resident.[2]

**Benefits:** Whole-house energy efficiency services including insulation (attic, wall, floor), weatherstripping, air sealing, reducing drafts, proper ventilation, installing smoke and carbon monoxide detectors, heating system checks (boiler/furnace testing), appliance replacements, boiler repair/replacement, comprehensive electrical energy audit, energy-efficient light bulbs. Health and safety measures prioritized. No specific dollar amounts or hours stated; services are free to eligible households.[1][2][3][5][6][9]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Program (CAP) agency for intake; applications accepted year-round.[1][3]
- Phone examples: BVCAP (serving Pawtucket, Central Falls, Cumberland, Lincoln) at (401) 723-4520.[5]
- In-person at CAP agency intake locations; accommodations for older adults, disabled, non-English speakers, literacy issues.[1][3]
- First apply for LIHEAP at local CAP, then schedule Home Energy Assessment.[1][3]

**Timeline:** Not specified; involves scheduling Home Energy Assessment after LIHEAP approval, then upgrades based on assessment results.[3]

**Watch out for:**
- Must qualify for LIHEAP first—WAP is not standalone.[1][3][6]
- Renters need landlord approval.[1][3][4]
- Recently weatherized homes (e.g., audit in last 10 years) or issues like mold disqualify or defer.[3][4]
- Owner-occupied only for some related programs like Heating System Replacement; confirm for WAP.[9]
- Services prioritize households with elderly, disabled, children, but no strict age cutoff.[3]

**Data shape:** Eligibility tied directly to LIHEAP qualification (60% median income, no assets); priority for elderly/disabled households; administered statewide via regional CAP agencies with varying contact points and minor service emphases.

**Source:** https://dhs.ri.gov/programs-and-services/energy-assistance-programs-heating/weatherization-assistance-program-wap

---

### RI SHIP (State Health Insurance Assistance Program)


**Eligibility:**
- Income: No income or asset limits; open to all Medicare-eligible individuals, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, and dually eligible for Medicare and Medicaid[1][3]
- Assets: No asset limits or tests apply[1]
- Must be Medicare-eligible or a family member/caregiver of a Medicare beneficiary[3][5]

**Benefits:** Free one-on-one counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), enrollment in prescription drug plans and health plans, applications for low-income programs (Medicaid, Medicare Savings Programs, Extra Help/LIS), resolving Medicare problems, education on rights/protections, and outreach presentations; provided by trained, independent counselors and volunteers[1][3][5]

**How to apply:**
- Phone: 1-888-884-8721 (main), TTY: 401-462-0740, Providence: 2-1-1 or 401-462-4444 (POINT), Northern RI: 401-349-5760 x2635[5][8]
- In-person or remote assistance via local RI SHIP locations (e.g., Office of Healthy Aging, 25 Howard Ave, Building 57, Cranston RI 02920)[4][5]
- Website for info and remote assistance: oha.ri.gov (Office of Healthy Aging site implied via PDFs)[3][5]

**Timeline:** Not specified in available data

**Watch out for:**
- Counselors/volunteers are independent and not affiliated with insurance/pharma—ensures unbiased advice, but they only assist with applications upon request, do not sell plans[3]
- Services require signing Client Confidentiality Agreement/Release form[3]
- Regional phone lines exist (e.g., Northern RI, Providence)—using the wrong one may delay local help[5]
- No income/asset test, but helps apply for programs that do have them (e.g., Extra Help, MSP)[1]

**Data shape:** no income/asset test; counseling-only service (not financial aid); regionally varied contact points but uniform statewide benefits; volunteer/staff delivered via state Office of Healthy Aging

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oha.ri.gov (Office of Healthy Aging, RI SHIP sponsor)

---

### Meals on Wheels


**Eligibility:**
- Age: 60+
- Income: No income limits specified in available sources.
- Assets: No asset limits specified in available sources.
- Homebound (unable to safely leave the home on their own)
- Not participating in an adult daycare or dining program on scheduled meal delivery days
- For Capital City Café Program: 60+ or under 60 with disability or receiving general public assistance

**Benefits:** Home-delivered meals meeting one-third of daily dietary needs, including medically therapeutic and culturally responsive options; wellness checks, health education, social interaction, delivery of seasonal essentials; Capital City Café Program (congregate meals)
- Varies by: program_type

**How to apply:**
- Online or downloadable referral form at www.rimeals.org
- Mail to: Meals on Wheels of RI, Inc., 70 Bath St., Providence, RI 02908
- Phone: (401) 351-6700 (contact Shana DeFelice, Programs & Mission Impact Director)
- Email: sdefelice@rimeals.org

**Timeline:** Eligibility confirmed by home-delivered team after receiving form; no specific timeline stated

**Watch out for:**
- Must not be in adult daycare/dining on delivery days
- Homebound defined strictly as unable to safely leave home independently
- Separate programs (Home-Delivered vs. Capital City Café) with slightly different eligibility
- Car ownership or ability to leave home may affect eligibility in some cases
- Verify residence in delivery zone before applying

**Data shape:** Multiple program types (home-delivered and congregate café) with distinct forms and minor eligibility differences; statewide but delivery zone-restricted; no income/asset tests mentioned

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.rimeals.org

---

### Alzheimer's Respite Voucher Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Specific income limits for this program not detailed in available sources; related RI programs mention approximate monthly income under $1,300 for a single person or Medicaid thresholds like under $1,255 or $2,829 in 2024, but not confirmed for this program.[1]
- Assets: Not specified for this program; related Medicaid programs limit countable assets to under $4,000, with home often exempt if under certain conditions.[1][3]
- Rhode Island resident.
- Primary caregiver for individual with Alzheimer's or related dementia.
- Program administered through CareBreaks Respite Program by Office for Healthy Aging via Catholic Social Services; eligibility criteria vary and may be more restrictive than federal Lifespan Respite programs.[4][6]

**Benefits:** Respite vouchers (stipend, grant, or reimbursement) to pay for respite care services, allowing caregivers to select and hire providers; specific dollar amounts or hours not detailed in sources.[4]

**How to apply:**
- Phone: Call 401-421-7833 ext. 212 for information or to apply.[4]
- Download application from program resources (specific link via ARCH Respite site).[4]
- Contact Office for Healthy Aging or Catholic Social Services (Roman Catholic Diocese of Providence).[4][6]

**Timeline:** Not specified in sources.

**Watch out for:**
- May have more restrictive eligibility than federal Lifespan Respite programs (e.g., Alzheimer's/dementia focus like CT program).[4]
- Not tied to Medicaid/Medicare status for caregivers, but confirm exact criteria as sources lack full details.[2][4]
- Separate from broader Medicaid LTSS or RIte@Home; diagnosis alone does not guarantee eligibility.[3]

**Data shape:** Administered via CareBreaks Respite Program under Lifespan Respite Care Program; limited public details on exact income/asset limits or voucher values; state-funded with potential dementia-specific restrictions.

**Source:** https://oha.ri.gov/resources/caregiver-supportsrespite[6]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are updated with federal poverty guidelines (e.g., for 2025, check current HHS poverty guidelines; not specified in RI-specific sources). No RI-specific table provided in results.
- Unemployed
- U.S. citizen or eligible non-citizen
- Priority for veterans/qualified spouses, individuals over 65, those with disabilities, low literacy/limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users

**Benefits:** Part-time community service work-based job training (average 20 hours/week) at nonprofits/public agencies (e.g., schools, hospitals, senior centers); paid highest of federal/state/local minimum wage; supportive services (e.g., food, housing, medical, transportation assistance via some providers); job placement assistance to unsubsidized employment; typically 6 months training.
- Varies by: priority_tier

**How to apply:**
- Use AARP Foundation locator at https://my.aarpfoundation.org/locator/scsep/ to find local RI SCSEP office by zip code
- Contact RI Department of Labor & Training (DLT) via https://dlt.ri.gov/individuals/jobseeker-resources-2025 (specific phone not listed; call DLT general line or local office)
- In-person or phone at local SCSEP grantee office (e.g., potential providers like AARP Foundation, NAPCA, Goodwill, or state agencies; find via locator)
- No specific online form, mail, or RI phone listed

**Timeline:** Not specified; enrollment if eligible and no waitlist
**Waitlist:** Possible waitlist depending on local availability and funding

**Watch out for:**
- Funding fluctuations may cause delays/closures (program in transition per sources)
- Must be unemployed to enroll; training is temporary bridge to unsubsidized work
- Priority tiers affect enrollment speed
- No guaranteed permanent job; average 6 months training
- Local grantees vary; use locator as no single RI phone/office listed
- Income is 125% FPL (stricter than some programs like SSI at 100%)

**Data shape:** Grantee-administered with local variations; no RI-specific income table, processing times, or exact offices in results; priority-based enrollment; use national locator for state-specific contacts

**Source:** https://www.dol.gov/agencies/eta/seniors (federal); https://dlt.ri.gov/individuals/jobseeker-resources-2025 (RI DLT)

---

### Rhode Island Legal Services (RILS) Elder Law Unit


**Eligibility:**
- Age: 60+
- Income: Low-income threshold for persons 60+; exact dollar amounts or household size table not specified in available sources. Follows federal poverty guidelines for legal aid eligibility, typically 125-200% FPL.
- Assets: Not specified in sources.
- Low-income status
- Rhode Island resident
- Legal issues related to elder protection such as abuse, neglect, financial exploitation, or public benefits

**Benefits:** Free legal advice, assistance, and representation for low-income elders 60+ on issues including physical/mental abuse, abandonment, neglect, financial exploitation, government benefits appeals, landlord-tenant disputes, subsidized housing, consumer issues, family law[2][5][7][8]

**How to apply:**
- Phone: Providence (401) 274-2652 or toll-free (800) 662-5034; Newport (401) 846-2264 or toll-free (800) 637-4529
- In-person: Providence office at 56 Pine Street, Fourth Floor, Providence, RI 02903; Newport office at 50 Washington Square, Newport, RI 02840
- Website: https://www.helprilaw.org or https://rils.org for intake information

**Timeline:** Not specified in sources.

**Watch out for:**
- Focuses on protection from abuse/exploitation and public benefits, not general elder law like estate planning or Medicaid planning; must demonstrate low-income and specific legal need; separate from RI Bar Association's free 30-min consultation which is open to all 60+ regardless of income[2][3][5][8]

**Data shape:** Eligibility tied to low-income and age 60+ with emphasis on elder protection cases; dual offices for intake but statewide reach; no precise income/asset figures published in sources

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://rils.org

---

### Rhode Island State Long-Term Care Ombudsman Program (RISLTCOP)


**Eligibility:**
- Resident of or receiving services from: nursing homes, assisted living facilities, licensed home care, hospice services, Bristol Veterans Home, Eleanor Slater Hospital Regan Building (Cranston), or Zambarano Hospital (Pascoag)
- OR family member/representative of such a resident
- OR any individual, organization, or government agency with reason to believe a facility has violated regulations or harmed residents

---

### Rhode Island Pharmaceutical Assistance Program for the Elderly (RIPAE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 55-64 if receiving Social Security Disability Insurance (SSDI)+
- Income: Four levels based on annual income (2023 guidelines, adjusted 5.9% effective 1/1/2023):
- **Level 1 (65+)**: Single $0-$35,867; Couple $0-$44,838
- **Level 2 (65+)**: Single $35,868-$45,028; Couple $44,839-$56,304
- **Level 3 (65+)**: Single $45,029-$78,947; Couple $56,305-$90,056
- **Level 4 (55-64 disabled)**: Single/Couple $0-$78,947/$90,056[1][3]
- Assets: No resource or asset test; no limits apply[1]
- Enrolled in a Medicare Part D plan
- Not eligible for or enrolled in Social Security Extra Help Program or Medicaid
- Rhode Island resident
- Proof of age, residency, and income required[1][2][3]

**Benefits:** Subsidizes RIPAE-approved medications during Medicare Part D deductible period or if drug not covered by Part D (after discounts, coupons, insurance): Level 1: State pays 60%, member 40%; Level 2: State 30%, member 70%; Levels 3-4: State 15%, member 85%. Level 1: State pays full cost after $1,500 yearly out-of-pocket. Access to RIPAE discount price for other prescribed meds. Level 1: Free RI state beach access; all levels: 1-time Special Enrollment Period per year[1][2][3]
- Varies by: income_level

**How to apply:**
- Download RIPAE application from OHA website and mail with documents
- Phone: Office of Healthy Aging (OHA) at (401) 462-3000 or (401) 462-0560; The Point at (401) 462-4444
- In-person: Senior centers statewide or OHA
- Appeal denial: Call OHA at (401) 462-3000[1][4]

**Timeline:** Not specified in sources

**Watch out for:**
- Only covers during Part D deductible or non-covered drugs; must be RIPAE-approved/formulary meds
- Experimental drugs excluded; must be dispensed within 1 year of prescription
- Income levels determine co-pay percentage; no assets test but strict Part D/Extra Help exclusion
- 2023 income limits shown; verify current as adjustments occur (e.g., 5.9% in 2023)
- Ages 55-64 only if SSDI; must prove disability[1][2][3]

**Data shape:** Tiered by income levels with specific co-pay percentages; no asset test; restricted to Part D deductible/non-covered approved drugs; separate tier for 55-64 disabled

**Source:** https://oha.ri.gov/resources/health-insurance-health-care-cost-assistance/drug-cost-assistance

---

### At HOME Cost Share Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ or 19-64 with diagnosis of Alzheimer’s or related dementia+
- Income: Capped at 250% Federal Poverty Level (FPL). Tiered cost-sharing based on income (2024 figures): Tier 1: $18,825 (single), $25,550 (couple); Tier 2: $30,120 (single), $40,880 (couple). Exact 2026 FPL amounts adjust annually; contact ADRC for current table[2][4].
- Assets: No asset limit[2][4][5].
- Rhode Island resident
- Does not qualify for Medicaid
- Needs assessment showing need for assistance with personal care, health care, housekeeping, meal preparation, or adult day services
- Functional need based on individualized assessment

**Benefits:** State subsidizes in-home services (housekeeping, personal care, meal preparation) and/or community adult day services (personal care, nursing support, meals, recreational/social activities). Participant pays tiered cost-share: Tier 1 - $4.50/hour home care, $7.00/day adult day; Tier 2 - higher rates per factsheet (e.g., older data shows $7.50/hour, $15/day). Services per individualized care plan; no fixed hours/dollar cap specified[2][4][5].
- Varies by: income_tier

**How to apply:**
- Phone: ADRC (Rhode Island Aging and Disability Resource Center) at 401-462-4444[2][5]
- Contact OHA via ADRC for assessment and care plan

**Timeline:** Not specified in sources

**Watch out for:**
- Separate from Medicaid RIte @ Home (which has asset limits, NFLOC requirement, higher income cap at 300% FBR ~$2,901/month)[1]
- Must confirm Medicaid ineligibility first; applying over income leads to denial[1]
- Cost-share is participant-paid portion; state subsidizes rest but no full coverage
- Income tiers determine exact hourly/daily rates participant pays; FPL adjusts yearly
- Requires needs assessment; not for those needing only homemaker services without personal care[6]
- 2022 expansion to 250% FPL and younger dementia patients[3]

**Data shape:** Tiered participant cost-share by income brackets (no asset test); services via individualized plan; non-Medicaid alternative with state subsidy

**Source:** https://oha.ri.gov/resources/home-care/home-cost-share[2]

---

### Ocean State Senior Dining Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; program is open to all eligible seniors regardless of income. Suggested contribution of $3-$5 per meal, but no one is denied service due to inability to pay.
- Assets: No asset limits or tests mentioned.
- Spouses of any age may accompany eligible seniors.
- Annual registration required.
- Reservations typically required 48 hours in advance at congregate sites.

**Benefits:** Nutritious meals at community dining sites (congregate meals), local restaurants, or home-delivered options through partner programs. Suggested donation $3 at state meal sites or $5 at some providers; full price for non-eligible guests. Social interaction at sites; some locations offer takeout or transportation.
- Varies by: region

**How to apply:**
- Phone: Call local providers or state line (e.g., 1-800-662-5711 ext. 6899 for AEOA; 855-330-9131 for transportation; general inquiries via https://oha.ri.gov/resources/food-and-nutrition or https://www.rimeals.org/programs/senior-restaurant-program/).
- In-person: At nearly 70 Community Table locations statewide; call ahead to reserve.
- Online: Locator via http://dem.ri.gov/relishrhody/ or contact The Point for sites.
- No specific mail application detailed; short registration forms available at sites like https://www.aeoa.org/programs/senior-services/senior-dining/.

**Timeline:** Immediate upon registration at sites; annual renewal required.
**Waitlist:** Reservations required 48 hours in advance at congregate sites; no statewide waitlist mentioned.

**Watch out for:**
- Not free—suggested donation requested ($3-$5/meal), though no one turned away; must register annually and reserve 48 hours ahead for congregate sites.
- Spouses and guests welcome but may pay full price if under 60 or unregistered.
- Restaurant options may not be contracted (payment direct to restaurant).
- Separate from SNAP or Meals on Wheels home delivery—focuses on congregate/restaurant dining.
- Local variations in hours, menus, and takeout availability.

**Data shape:** Statewide but highly decentralized with ~70 local Community Table sites and varying providers; no means test, emphasis on suggested donations and social dining; reservation-driven rather than entitlement-based.

**Source:** https://oha.ri.gov/resources/food-and-nutrition

---

### RIPTA Senior Reduced Fare Bus Pass

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For the free 'All Day Pass' (no fare), must be low-income at or below 200% of federal poverty guidelines (requires proof like IRS Tax Account Transcript for most recent year, SSI Award Letter, Medicaid Eligibility Letter, or RI DHS Supplemental Income Verification Notice). No specific dollar amounts or household size table provided in sources; must be RI resident. Seniors 65+ not low-income qualify for reduced fare 'Limited Day Pass' (half-fare off-peak) without income test[1][2][3][4].
- Proof of identification: Driver's license, U.S. Passport, State ID Card, or Veterans Administration ID Card.
- Proof of age for seniors: Driver's License, Passport, Medicare Card, or Green Card/Citizenship Papers.
- RI residency proof required if using Passport or VA ID.
- $10 fee for photo ID card (mentioned in some contexts)[6].

**Benefits:** **Two tiers:** 1) **Free 'All Day Pass'** for low-income seniors 65+: unlimited rides any time (except special/overcrowded routes as determined by RIPTA), valid 2 years, photo ID card. 2) **Reduced 'Limited Day Pass' (half-fare off-peak)** for all seniors 65+ regardless of income: non-peak hours (off-peak defined as outside 7am-9am and 3pm-6pm weekdays), pay full fare peak times; Medicare Card alternative[1][2][4][5][7].
- Varies by: income_status

**How to apply:**
- In-person: Photo ID Office, Kennedy Plaza, Providence, RI - Mon, Tue, Wed, Fri 8am-4pm (closed 12pm-1pm); also mobile events at communities statewide (check RIPTA.com/calendar).
- Online: Reduced Fare Bus Pass Program application for first-time and renewals at ripta.com/reducedfare.
- Mail: Attention: Photo ID Office, RIPTA, 705 Elmwood Avenue, Providence, RI 02907.
- Phone: IRS for transcript at 800-908-9946 (for income proof)[3][4][5].

**Timeline:** Not specified in sources.

**Watch out for:**
- Two separate programs: Free All Day requires low-income proof (200% poverty) + senior/disability; non-low-income seniors get only half-fare off-peak (not free). Use correct form[3][4].
- Peak hours (7am-9am, 3pm-6pm weekdays) require full fare even with Limited Pass; no reduction on special/overcrowded routes[1][4].
- Photo must closely match ID or rejected; bring $10 cash for in-person[4][6].
- Medicare Card allows off-peak half-fare without applying for ID[4][5].
- VA letter needs 40%+ disability rating for disability qualification[1][2].

**Data shape:** Two-tiered by income: free all-day for low-income only; reduced off-peak for all seniors/disabled regardless of income; no asset test or household size income table; mobile outreach statewide.

**Source:** https://www.ripta.com/reducedfare

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Rhode Island Medicaid | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| PACE-RI (Program of All-Inclusive Care f | benefit | local | deep |
| Medicare Premium Payment Program (MPP) / | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Residential Weatherization Assistance Pr | benefit | federal | deep |
| RI SHIP (State Health Insurance Assistan | resource | federal | simple |
| Meals on Wheels | benefit | federal | medium |
| Alzheimer's Respite Voucher Program | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Rhode Island Legal Services (RILS) Elder | resource | state | simple |
| Rhode Island State Long-Term Care Ombuds | resource | federal | simple |
| Rhode Island Pharmaceutical Assistance P | resource | state | simple |
| At HOME Cost Share Program | benefit | state | deep |
| Ocean State Senior Dining Program | benefit | state | medium |
| RIPTA Senior Reduced Fare Bus Pass | resource | state | simple |

**Types:** {"benefit":11,"resource":5,"employment":1}
**Scopes:** {"state":8,"local":1,"federal":8}
**Complexity:** {"deep":9,"simple":5,"medium":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/RI/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **not_applicable — all eligible participants receive the full array of coordinated services**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **not_applicable**: 3 programs
- **program_type**: 1 programs
- **income_level**: 1 programs
- **income_tier**: 1 programs
- **region**: 1 programs
- **income_status**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Rhode Island Medicaid**: Multiple tiers (Nursing Home Medicaid, EAD, LTSS waivers) with varying income/asset limits and NFLOC requirements; 2026 figures updated annually; dual eligible coordination via single managed care plan; functional assessment key for LTC
- **Home and Community-Based Services (HCBS) Waiver**: Consolidated into statewide 1115 Comprehensive Demonstration waiver via MLTSS; limited slots with waitlists; requires NFLOC; no detailed income/asset tables by household size or exact service limits/hours; co-pays apply to some services.
- **PACE-RI (Program of All-Inclusive Care for the Elderly)**: PACE-RI is a geographically limited program (3 centers only) with all-inclusive service delivery model. Eligibility is tied to Medicaid LTSS or Medicare qualification plus clinical level of care determination. Unlike many programs, PACE does not have tiered benefits — all participants receive the full array of services. The program emphasizes community-based care with stable case management relationships. Critical gap: specific income thresholds, asset exemptions, processing times, and current waitlist status are not available in search results.
- **Medicare Premium Payment Program (MPP) / QMB**: Two tiers (QMB expanded to ~126% FPL, QI to ~142% FPL) with fixed income/asset by household size (individual/couple); QI waitlist; auto-QMB for prior SLMB; higher assets than full Medicaid but apply together.
- **Supplemental Nutrition Assistance Program (SNAP)**: Benefits scale by household size and net income after elderly-specific deductions (medical >$35, shelter); no asset test for most RI households with seniors; ESAP for simplified process; expanded 200% FPL gross for elderly/disabled.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income at 60% SMI (table by household size, FFY yearly updates); no assets; CAP agencies handle apps statewide with local contacts; priority tiers for crisis; grants scale by income/size/fuel.
- **Residential Weatherization Assistance Program**: Eligibility tied directly to LIHEAP qualification (60% median income, no assets); priority for elderly/disabled households; administered statewide via regional CAP agencies with varying contact points and minor service emphases.
- **RI SHIP (State Health Insurance Assistance Program)**: no income/asset test; counseling-only service (not financial aid); regionally varied contact points but uniform statewide benefits; volunteer/staff delivered via state Office of Healthy Aging
- **Meals on Wheels**: Multiple program types (home-delivered and congregate café) with distinct forms and minor eligibility differences; statewide but delivery zone-restricted; no income/asset tests mentioned
- **Alzheimer's Respite Voucher Program**: Administered via CareBreaks Respite Program under Lifespan Respite Care Program; limited public details on exact income/asset limits or voucher values; state-funded with potential dementia-specific restrictions.
- **Senior Community Service Employment Program (SCSEP)**: Grantee-administered with local variations; no RI-specific income table, processing times, or exact offices in results; priority-based enrollment; use national locator for state-specific contacts
- **Rhode Island Legal Services (RILS) Elder Law Unit**: Eligibility tied to low-income and age 60+ with emphasis on elder protection cases; dual offices for intake but statewide reach; no precise income/asset figures published in sources
- **Rhode Island Pharmaceutical Assistance Program for the Elderly (RIPAE)**: Tiered by income levels with specific co-pay percentages; no asset test; restricted to Part D deductible/non-covered approved drugs; separate tier for 55-64 disabled
- **At HOME Cost Share Program**: Tiered participant cost-share by income brackets (no asset test); services via individualized plan; non-Medicaid alternative with state subsidy
- **Ocean State Senior Dining Program**: Statewide but highly decentralized with ~70 local Community Table sites and varying providers; no means test, emphasis on suggested donations and social dining; reservation-driven rather than entitlement-based.
- **RIPTA Senior Reduced Fare Bus Pass**: Two-tiered by income: free all-day for low-income only; reduced off-peak for all seniors/disabled regardless of income; no asset test or household size income table; mobile outreach statewide.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Rhode Island?
