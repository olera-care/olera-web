# California Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 16 |
| New (not in our data) | 6 |
| Data discrepancies | 10 |
| Fields our model can't capture | 10 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 9 | Our model has no asset limit fields |
| `regional_variations` | 10 | Program varies by region — our model doesn't capture this |
| `waitlist` | 9 | Has waitlist info — our model has no wait time field |
| `documents_required` | 10 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 5 programs
- **service**: 8 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medi-Cal Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1762` → Source says `$1,305` ([source](https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable; auto-buy-in from 2025), Part B premiums, annual deductibles, coinsurance/copayments for Medicare-covered Parts A/B services. SLMB: Pays Medicare Part B premiums only. QI: Pays Medicare Part B premiums only (slightly higher income allowance than SLMB).[1][2][3][4][5]` ([source](https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx`

### Multipurpose Senior Services Program (MSSP) Waiver

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Individualized services via care plan including: care management (by nurses/social workers), adult day care, respite care, supplemental personal care, home delivered meals, personal emergency response systems, minor home repair/maintenance, in-home chore/protective supervision, transportation, counseling/therapeutic services, meal services, communication services, housing assistance. Total annual cost capped below skilled nursing facility cost. Provided by licensed agencies, not self-directed.` ([source](https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx`

### CalFresh

- **min_age**: Ours says `158` → Source says `60` ([source](https://www.cdss.ca.gov/calfresh))
- **income_limit**: Ours says `$1580` → Source says `$35` ([source](https://www.cdss.ca.gov/calfresh))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Electronic Benefits Transfer (EBT) card for purchasing food at authorized retailers, including prepared meals via statewide Restaurant Meals Program (since 2021) at participating restaurants/grocery stores. Amount based on household size, income, expenses; minimum ~$15/month for eligible senior/disabled households; scales with deductions (e.g., medical, housing).[2][5]` ([source](https://www.cdss.ca.gov/calfresh))
- **source_url**: Ours says `MISSING` → Source says `https://www.cdss.ca.gov/calfresh`

### LIHEAP

- **income_limit**: Ours says `$1928` → Source says `$3,331` ([source](https://www.csd.ca.gov/pages/liheapprogram.aspx))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Payments for electricity, propane, fuel oil, wood/pellets; emergency payments (with disconnection proof); emergency repair/replacement of water heater, heater, or AC/evaporative cooler. Amount based on income, household size, energy cost/need (up to 60% state median income); issued as warrant or direct to utility[1][3][4][6].` ([source](https://www.csd.ca.gov/pages/liheapprogram.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.csd.ca.gov/pages/liheapprogram.aspx`

### Weatherization Assistance Program (WAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Free installation of energy efficiency measures including insulation (ceiling/floor), repair/replacement of heating/AC, water heater, refrigerator, microwave, stove, doors, windows (glass only), free digital thermostats, weatherstripping, LED bulbs, shade screens, smoke/CO detectors. Whole-home assessment to reduce energy costs and improve health/safety.[1][2][4]` ([source](https://www.csd.ca.gov/Pages/Residential-Energy-Efficiency.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.csd.ca.gov/Pages/Residential-Energy-Efficiency.aspx`

### Senior Community Service Employment Program (SCSEP)

- **income_limit**: Ours says `$1580` → Source says `$19,563,` ([source](https://www.dol.gov/agencies/eta/seniors (federal); https://aging.ca.gov/Programs_and_Services/Senior_Employment_and_Training/ (CA)))
- **benefit_value**: Ours says `$3,000 – $8,000/year` → Source says `Part-time community service job training (average 20 hours/week, range 16-29 hours depending on funding); paid at highest of federal, state, or local minimum wage; job counseling, case management, job search/placement assistance, resume building, access to American Job Centers; placements at nonprofits/public agencies (schools, hospitals, senior centers, etc.) as bridge to unsubsidized jobs.[1][2][3][4]` ([source](https://www.dol.gov/agencies/eta/seniors (federal); https://aging.ca.gov/Programs_and_Services/Senior_Employment_and_Training/ (CA)))
- **source_url**: Ours says `MISSING` → Source says `https://www.dol.gov/agencies/eta/seniors (federal); https://aging.ca.gov/Programs_and_Services/Senior_Employment_and_Training/ (CA)`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free advocacy and complaint investigation services[4][8]` ([source](https://aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/`

### Property Tax Postponement Program

- **income_limit**: Ours says `$4599` → Source says `$55,181` ([source](https://www.sco.ca.gov/ardtax_prop_tax_postponement.html))
- **benefit_value**: Ours says `$500 – $2,500/year` → Source says `Postponement (deferral) of current-year secured property taxes on principal residence, secured by a lien on the property at 7% annual interest (older sources note 5%) [1][5]. Repayment due upon sale, transfer, refinance, death, move, or default on senior lien [6].` ([source](https://www.sco.ca.gov/ardtax_prop_tax_postponement.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.sco.ca.gov/ardtax_prop_tax_postponement.html`

### In-Home Supportive Services (IHSS)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `In-home personal assistance including bathing/grooming, dressing, meal preparation/feeding, housecleaning, laundry, shopping, transportation to medical appointments, protective supervision, paramedical services. Authorized hours per month based on county social worker needs assessment (up to 283 hours max, varies by functional need ranked 1-6).[1][4][7]` ([source](https://www.cdss.ca.gov/in-home-supportive-services))
- **source_url**: Ours says `MISSING` → Source says `https://www.cdss.ca.gov/in-home-supportive-services`

### Caregiver Resource Centers (CRC)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Specialized information and referral; family consultation and care planning; respite care (financial assistance for in-home support, adult day care, short-term/weekend care, transportation); short-term counseling (individual, family, group); support groups (online/in-person); professional training workshops; legal/financial consultation (Powers of Attorney, Advance Directives, estate planning, conservatorships); education workshops on cognitive disorders, dementia, long-term care, stress management. No fixed dollar amounts or hours specified; respite provides financial assistance but amounts not detailed[3][4]` ([source](https://www.aging.ca.gov/ (DHCS redirects here for CRC info as of July 2022)[3]))
- **source_url**: Ours says `MISSING` → Source says `https://www.aging.ca.gov/ (DHCS redirects here for CRC info as of July 2022)[3]`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.dhcs.ca.gov/provgovpart/Pages/PACE.aspx))
  - Shape notes: No income/asset test for core eligibility (financials only affect premium payment); restricted to ~28 counties with multiple providers/centers; NFLOC certification by DHCS team; dual-eligible typically free
- **Health Insurance Counseling & Advocacy Program (HICAP)** — service|advocacy ([source](https://www.aging.ca.gov/hicap/))
  - Shape notes: no income/asset test; statewide but county-administered with local providers and contacts; services fixed and free for all Medicare-eligible
- **Meals on Wheels (via AAAs)** — service ([source](https://aging.ca.gov/Providers_and_Partners/Home-Delivered_Nutrition/Program_Narrative_and_Fact_Sheets/))
  - Shape notes: Administered locally by 33 AAAs with consistent OAA eligibility (no income test, age 60+ homebound) but varying providers, contacts, and wait times by county; requires local lookup for application
- **Family Caregiver Support Program** — service ([source](https://www.aging.ca.gov/Providers_and_Partners/Area_Agencies_on_Aging/Family_Caregiver_Support/Program_Narrative_and_Fact_Sheets/[1]))
  - Shape notes: No income/asset test; administered via 33 local AAAs with regional service variations and funding limits; OAA Title III-E federal program (code 3900100) state-implemented[1]
- **Legal Services for Seniors (via AAAs)** — service ([source](https://aging.ca.gov/Providers_and_Partners/Legal_Services/Legal_Services_Overview/[2]))
  - Shape notes: Decentralized via local AAAs with no uniform income/asset test; services and access vary significantly by county/provider; targeted to economic/social needs despite open eligibility[2][3][6]
- **State Supplementary Payment (SSP)** — financial ([source](https://www.cdss.ca.gov/inforesources/cdss-programs/ssi-ssp/ssi-ssp-eligibility-summary))
  - Shape notes: Eligibility and benefits fully tied to federal SSI (automatic if SSI-qualified); scales by household size (individual/couple); statewide cash supplement with no separate state income/asset test

## Program Details

### Medi-Cal Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Income limits are based on Federal Poverty Level (FPL), updated annually (typically April 1), and apply to net countable income. Limits vary by program and household size (individual or couple). For 2025: QMB ≤100% FPL ($1,305 single; $1,763 couple); SLMB ≤120% FPL ($1,566 single; $2,116 couple); QI ≤135% FPL ($1,762 single; $2,381 couple). Older figures from sources include QMB $1,074 single/$1,452 couple; SLMB $1,288 single/$1,742 couple; QI $1,449 single/$1,960 couple. For 2026, check current FPL at official sources as limits adjust yearly. Household size beyond couples not detailed; typically individual or couple for these programs.[1][5][6][7]
- Assets: Resource limits: $130,000 for individuals; $195,000 for couples (some sources note states may eliminate asset test, e.g., no asset limit for QI in some cases like Connecticut, but California applies). What counts: countable resources per Medi-Cal rules (e.g., bank accounts, investments). Exempt: primary home, one vehicle, personal belongings, life insurance up to certain values, burial plots/funds. Exact exemptions follow standard Medi-Cal ABD (Aged, Blind, Disabled) rules.[1][7]
- Eligible for Medicare Part A (QMB/SLMB; state auto-enrolls if eligible post-approval starting 2025) and enrolled in Medicare Part B (required for all).
- California resident.
- U.S. citizen or qualified non-citizen eligible for full-scope Medi-Cal.
- Meet other Medi-Cal requirements (e.g., complete forms like MC 13, provide verifications, report changes within 10 days, annual redetermination). No retroactivity for QMB; SLMB/QI up to 3 months prior.[1][2][3][6]

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable; auto-buy-in from 2025), Part B premiums, annual deductibles, coinsurance/copayments for Medicare-covered Parts A/B services. SLMB: Pays Medicare Part B premiums only. QI: Pays Medicare Part B premiums only (slightly higher income allowance than SLMB).[1][2][3][4][5]
- Varies by: priority_tier

**How to apply:**
- Mail form to local county social services agency.
- Contact state Medi-Cal agency or local county office (requests for applications go to state Medicaid/Medi-Cal agency).
- In-person at county social services office.
- Phone: Call local county Medi-Cal office (county-specific numbers via dhcs.ca.gov). No central statewide phone listed; use county locator.
- Online: Not specified as primary; apply via county Medi-Cal portals or general Medi-Cal application.

**Timeline:** QMB: Up to 45 days (effective first of month after all info verified). SLMB/QI: May be retroactive up to 3 months prior.[1]
**Waitlist:** QI often has waitlist or funding caps federally (first-come, first-served; not guaranteed); QMB/SLMB no waitlist mentioned.[1]

**Watch out for:**
- Must be enrolled in Medicare Part B before QMB evaluation; Part A auto-enrollment only post-approval (from 2025).
- Income is net countable (deductions applied); limits change yearly April 1—verify current FPL.
- QI has federal funding caps/waitlists; apply early.
- No retroactive benefits for QMB (unlike SLMB/QI).
- Over income? May qualify for Medi-Cal share-of-cost.
- Report changes within 10 days or risk losing benefits.
- Asset test applies in CA (unlike some states); excludes key exempt items.
- Evaluate during Medi-Cal apps, redeterminations, or income changes.[1][2][3][6][7]

**Data shape:** Three tiered programs (QMB, SLMB, QI) with escalating income thresholds (100%/120%/135% FPL) and narrowing benefits (QMB fullest coverage; QI Part B only); couple vs. single limits; county-administered statewide; annual FPL updates; QI funding-limited.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhcs.ca.gov/individuals/Pages/Medicare-Savings-Programs-in-California.aspx

---

### Multipurpose Senior Services Program (MSSP) Waiver


**Eligibility:**
- Age: 60+
- Income: No specific dollar amounts or household size table stated; requires eligibility for Medi-Cal under a qualifying primary aid code (Medi-Cal with no share of cost in some regions). Income assessed via Medi-Cal rules, which vary by household size but not detailed here for MSSP specifically.
- Assets: No specific asset limits stated for MSSP; follows Medi-Cal asset rules where applicable (Medi-Cal with no share of cost often implies assets under limits, but exemptions like primary home typically apply per Medi-Cal).
- Must be Medi-Cal eligible
- Require Nursing Facility (NF) level of care but for the provision of waiver services
- Reside in a county with an MSSP site/provider
- Certified or certifiable for placement in a skilled nursing facility
- Functionally impaired or have medical condition making daily activities difficult (e.g., bathing, dressing, medications, meals)
- Only enrolled in one HCBS waiver at a time

**Benefits:** Individualized services via care plan including: care management (by nurses/social workers), adult day care, respite care, supplemental personal care, home delivered meals, personal emergency response systems, minor home repair/maintenance, in-home chore/protective supervision, transportation, counseling/therapeutic services, meal services, communication services, housing assistance. Total annual cost capped below skilled nursing facility cost. Provided by licensed agencies, not self-directed.
- Varies by: individualized_service_plan

**How to apply:**
- Contact local Area Agency on Aging (AAA) or call 1-800-510-2020
- Contact local DHCS county office
- Call California Department of Aging (CDA) providers, e.g., (800) 664-4664 or (626) 397-3110 for specific regions
- Contact local MSSP provider agencies (approx. 40 contracted by CDA)

**Timeline:** Not specified
**Waitlist:** Yes; not an entitlement program with limited slots (11,940 max per year for 2024-2029); waitlist forms when full

**Watch out for:**
- Not entitlement: limited slots lead to waitlists even if eligible
- No self-directed care: must use licensed agency providers, cannot hire family/friends
- Must reside in MSSP service county; expansion to statewide pending implementation
- Medi-Cal eligibility required (no share of cost in some cases); only one HCBS waiver at a time
- Services capped to cost less than nursing facility
- One conflicting source mentions age 65+ but official is 60+

**Data shape:** Capped enrollment slots (11,940/year); county-restricted to MSSP sites; individualized plans, not fixed amounts/hours; administered via 40+ local CDA providers; transitioning to managed care integration via CalAIM

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhcs.ca.gov/services/medi-cal/Pages/MSSPMedi-CalWaiver.aspx

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE eligibility; private pay possible if not Medicaid-eligible. Medicaid eligibility (for premium coverage) follows Medi-Cal income/asset rules, which vary and require PACE staff assessment[1][2][4][5].
- Assets: No asset limits for core PACE eligibility; Medicaid portion follows Medi-Cal asset rules if applicable (e.g., countable assets like bank accounts, non-exempt property; exempt: primary home, one car, personal items). PACE staff assist with determination[1][5].
- Live in a PACE service area (specific counties/zip codes served by a PACE provider)
- Certified by California DHCS as needing nursing home level of care (NFLOC) via interdisciplinary team assessment
- Able to live safely in the community (home) with PACE support at time of enrollment
- Not enrolled in Medicare Advantage, Medicare prescription drug plan, hospice, or certain other programs[1][2][3][4][5][6][7]

**Benefits:** Comprehensive all-inclusive services: primary care at PACE center, specialist referrals, all prescriptions (no restrictions), dental/vision/hearing (exams, eyewear, aids), physical/occupational therapy, mental health/counseling, adult day center (activities/socialization), nutritious meals (center and home-delivered), transportation (to center/appointments), in-home care (personal care, housekeeping), 24/7 emergency coordination. No premiums/copays/deductibles for dual Medicare/Medi-Cal eligible; private pay for premium portion if not Medicaid-eligible[3][4][6].
- Varies by: region

**How to apply:**
- Contact local PACE provider for assessment (e.g., West PACE in San Marcos: visit center)
- Phone: DHCS PACE Unit (916) 713-8444; All Seniors helpline (818) 581-4101
- Email: PACE@dhcs.ca.gov
- Mail: California DHCS, Integrated Systems of Care Division, PACE Unit, Mail Station 4502, PO Box 997413, Sacramento, CA 95899-7413
- In-person: At PACE centers (locations vary by provider/service area)

**Timeline:** Assessment scheduled shortly after inquiry; plan of care created post-assessment (no fixed statewide timeline specified)[2]
**Waitlist:** Possible; varies by PACE provider and region (not detailed statewide)[4]

**Watch out for:**
- Must live in exact service area of a PACE provider—not statewide
- Nursing home level of care certification required (not just general frailty)
- Able to live safely in community at enrollment (cannot need immediate nursing home placement)
- Private pay premium if not Medi-Cal eligible (staff help determine)
- Cannot be in Medicare Advantage/hospice; disenrollment from those required
- Voluntary; average participant 76yo with complex needs[1][2][4][5][7]

**Data shape:** No income/asset test for core eligibility (financials only affect premium payment); restricted to ~28 counties with multiple providers/centers; NFLOC certification by DHCS team; dual-eligible typically free

**Source:** https://www.dhcs.ca.gov/provgovpart/Pages/PACE.aspx

---

### CalFresh


**Eligibility:**
- Age: 60+
- Income: Most households must have gross monthly income at or below 200% of the federal poverty level (FPL). For elderly/disabled households (age 60+ or disabled), net income test applies instead of gross, with special deductions for medical expenses over $35 (standard up to $185, actual over $185) including Medicare premiums, medications, transportation. SSI/SSP recipients often exempt from gross income test. Examples for seniors: max ~$1,580/month (1 person), ~$2,137/month (2 people) at 130% FPL in some contexts, but full 200% FPL gross for most; exact FPL varies annually by household size (table not in results, check official for current FY).[1][2][6]
- Assets: No resource limit in most cases, especially for elderly/disabled households. If applicable (e.g., some non-elderly/disabled), countable resources under $3,250. Exempt: home, household goods, cars (any value), retirement accounts (IRAs, pensions), personal items, EITC, federal tax refunds, burial plots, Native American funds.[3][4]
- California resident
- Low/no income; household defined as those who buy/prepare meals together
- Special rules for elderly/disabled: no work registration (ages 60+ exempt), longer certification (up to 24 months), separate household option even if eating with others
- SSI/SSP recipients eligible (even new CA residents pre-SSP)
- Some legal immigrants, homeless, students qualify
- ABAWD limits (18-64 able-bodied no dependents) resume June 1, 2026: 3 months in 36 unless exempt; elderly 60+ exempt[1][5]

**Benefits:** Electronic Benefits Transfer (EBT) card for purchasing food at authorized retailers, including prepared meals via statewide Restaurant Meals Program (since 2021) at participating restaurants/grocery stores. Amount based on household size, income, expenses; minimum ~$15/month for eligible senior/disabled households; scales with deductions (e.g., medical, housing).[2][5]
- Varies by: household_size

**How to apply:**
- Online: county social services websites (e.g., Alameda, LA, Riverside vary)
- Phone: county-specific (e.g., call local social services agency)
- Mail/fax: request application be mailed or download from county site
- In-person: county social services offices

**Timeline:** Not specified in results; varies by county

**Watch out for:**
- Elderly/disabled get special rules (net income test, no asset limit, medical deductions) often missed; report out-of-pocket medical/housing costs to maximize benefits
- Can apply as separate household even if eating with others if elderly/disabled
- SSI/SSDI recipients eligible despite myths; no need to visit office (phone/online ok)
- ABAWD limits return June 1, 2026 (but elderly exempt)
- Own home/car/retirement savings? Still eligible
- Not just for families/children; singles 60+ qualify

**Data shape:** Elderly/disabled households have relaxed rules (no gross income test, no asset limit, medical deductions, longer recertification); benefits scale by household size with expense deductions; county-administered statewide program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.cdss.ca.gov/calfresh

---

### LIHEAP


**Eligibility:**
- Income: Gross monthly household income must be at or below the 2026 LIHEAP guidelines: 1: $3,331.66; 2: $4,356.83; 3: $5,382.00; 4: $6,407.16; 5: $7,432.25; 6: $8,457.41; 7: $8,649.66; 8: $8,841.83; 9: $9,034.08; 10: $9,226.25 (add $192.21 per additional person beyond 10). Automatic eligibility if household receives SNAP, SSI, TANF, or certain veterans' benefits. Priority for elderly (60+), disabled, medical conditions, children 0-5, high energy burdens, or disconnection notices[1][2][5][6].
- Assets: No asset limits mentioned in guidelines[1][5].
- California resident responsible for home heating/cooling bills
- Not eligible if living in board-and-care, nursing homes, convalescent homes, jail, or prison
- Proof of income for all household members; zero-income adults need Certification of Income and Expenses
- U.S. citizen or legal resident (proof required)
- Priority point system favors vulnerable households; funding limits may exclude some eligible applicants

**Benefits:** Payments for electricity, propane, fuel oil, wood/pellets; emergency payments (with disconnection proof); emergency repair/replacement of water heater, heater, or AC/evaporative cooler. Amount based on income, household size, energy cost/need (up to 60% state median income); issued as warrant or direct to utility[1][3][4][6].
- Varies by: household_size|priority_tier|region

**How to apply:**
- Contact local service provider: call for application mailing, pick up in office, or online if available via provider site
- PG&E customers: Dial 1-866-675-6623 for guidelines and agencies
- Benefits Enrollment Centers (BECs) for guidance
- No statewide online; must use local agency (find via csd.ca.gov)

**Timeline:** Several weeks; staff contacts applicant with outcome[1][4].
**Waitlist:** No formal waitlist mentioned; funding limited, so eligible may be denied if funds exhausted—apply early[3][6].

**Watch out for:**
- Limited funding: even eligible households may be denied to prioritize vulnerable (elderly, disabled, young kids, crises)—apply early when funds available[3][6]
- Must continue paying bills during processing; seek utility payment plans[1]
- Local agency required—no single statewide application[3][5]
- Priority system overrules pure income; high energy burden or disconnection boosts chances[1]
- Persons in institutional settings (nursing homes, jails) ineligible[4]

**Data shape:** Administered by local agencies with statewide income guidelines but priority tiers, funding caps, and regional providers; benefits scale by household size, energy need, and vulnerability

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.csd.ca.gov/pages/liheapprogram.aspx

---

### Weatherization Assistance Program (WAP)


**Eligibility:**
- Income: Household income must meet DOE WAP guidelines (typically 200% of federal poverty level or lower, varying by household size and income sources); exact dollar amounts available via county providers or CSD's DOE WAP Income Eligibility Guidelines page. Priority for elderly, disabled, households with young children, or greatest need. Contact local provider for precise table as it may vary by factors like energy use.[1][5]
- Assets: No asset limits mentioned in sources.
- Legal resident of California
- Named on energy bill (some regions)
- Homeowner or renter
- Household meets energy usage or priority criteria (e.g., vulnerable populations like elderly)

**Benefits:** Free installation of energy efficiency measures including insulation (ceiling/floor), repair/replacement of heating/AC, water heater, refrigerator, microwave, stove, doors, windows (glass only), free digital thermostats, weatherstripping, LED bulbs, shade screens, smoke/CO detectors. Whole-home assessment to reduce energy costs and improve health/safety.[1][2][4]
- Varies by: priority_tier

**How to apply:**
- Contact local service provider via CSD (https://www.csd.ca.gov/Pages/Residential-Energy-Efficiency.aspx)
- Call regional hotlines e.g., CSET Weatherization Hotline: 1-844-224-1316
- Call county agency for application (e.g., San Joaquin HSA)
- Download/print application from local agency website
- Pick up in-person at HSA/office
- Mail request for application

**Timeline:** Varies by region; emergency appointments for disconnect notices within 1-2 days in some areas (e.g., LA).[3]
**Waitlist:** Possible due to prioritization and funding; contact local provider for status.

**Watch out for:**
- Must contact local provider for exact eligibility/income (varies by income sources, not just table)
- Priority-based (elderly prioritized but not guaranteed)
- Services once per eligibility period (e.g., every 12 months in some related programs)
- Renter requires landlord approval (implied)
- Not emergency bill pay—focuses on weatherization
- Home must qualify via assessment (e.g., age 5+ years in similar ESA)

**Data shape:** Administered statewide via local providers with priority tiers for vulnerable (elderly); income at DOE guidelines with regional verification; no fixed statewide form/hotline—must find county provider

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.csd.ca.gov/Pages/Residential-Energy-Efficiency.aspx

---

### Health Insurance Counseling & Advocacy Program (HICAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; services are free for all Medicare beneficiaries and their families regardless of income.
- Assets: No asset limits; no financial eligibility requirements.
- Eligible for Medicare (includes those 65+ or younger with disability receiving Medicare)
- Soon-to-be eligible for Medicare
- Family members, friends, or representatives of Medicare beneficiaries

**Benefits:** Free, unbiased one-on-one counseling on Medicare benefits (Parts A, B, C, D), supplemental plans (Medigap), prescription drug plans, Medicare Advantage plans (HMOs, PPOs), Medicare Savings Programs, long-term care insurance, appeals, billing issues, claim denials, fraud/abuse; assistance with applications, forms, comparisons of plans, resolving complaints; community education and presentations.

**How to apply:**
- Statewide toll-free phone: 800-434-0222
- Local HICAP offices by county (e.g., Orange County: 714-560-0424; Riverside/San Bernardino/Inyo/Mono: 909-256-8369; Kern County: 661-868-1000 or 800-434-0222; Santa Clara: contact Sourcewise at 408-350-3245; Ventura: contact VCAAA)
- Online registration forms on local provider sites (e.g., coasc.org for specific counties, mysourcewise.com for Santa Clara)
- In-person at local Aging & Adult Services offices (e.g., Kern County: 5357 Truxtun Ave., Bakersfield)

**Timeline:** Contact to schedule appointment; no formal processing time specified, typically responsive via phone or online registration.

**Watch out for:**
- Not an insurance sales program—counselors do not sell, endorse, or recommend specific commercial products; volunteers cannot be licensed agents/brokers/financial planners
- Services are counseling/education only, not direct financial aid or healthcare provision
- Must contact local HICAP for your county, not all have online forms
- Part of national SHIP network; for out-of-state, use SHIP locator

**Data shape:** no income/asset test; statewide but county-administered with local providers and contacts; services fixed and free for all Medicare-eligible

**Source:** https://www.aging.ca.gov/hicap/

---

### Meals on Wheels (via AAAs)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income requirement[6][8]
- Assets: No asset limits or tests mentioned; eligibility not based on financial means[6][8]
- Homebound by reason of illness, disability, or otherwise isolated[6][8]
- Unable to prepare meals for self without assistance from family or caregivers[1][2]
- Must reside in the service area of the local AAA or provider[1][2]
- Spouses of eligible participants (regardless of age) may receive meals if beneficial to the participant[6][8]
- Individuals with disabilities residing with an older individual may receive meals if in the best interest of the older adult[6][8]

**Benefits:** Home-delivered nutritious meals providing at least one-third of Dietary Reference Intakes, following Dietary Guidelines for Americans; typically 5 meals per week, fresh or frozen; may include nutrition education[3][6][9]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or visit their website for region-specific intake[2]
- Examples: Contra Costa - Meals on Wheels West Contra Costa (510)-412-0166 or Meals on Wheels Diablo Region (925)-937-8607; visit services page for local program[1]
- In-person assessment or phone intake by local provider[2]

**Timeline:** Varies; some within a week, longer if waitlist[2]
**Waitlist:** Common in high-demand areas; processing and start times vary by local program[2]

**Watch out for:**
- Must contact specific local AAA/provider for your county - no central statewide application[1][2]
- Homebound means unable to prepare own meals and limited ability to leave home; having a car or family help may disqualify[1][2]
- High demand leads to waitlists in many areas[2]
- Separate from Medi-Cal paid programs like Mom's Meals; this is free OAA Title III-C2 via AAAs[5][6]
- Spouses/disabled co-residents eligible only if beneficial to primary 60+ participant[6][8]

**Data shape:** Administered locally by 33 AAAs with consistent OAA eligibility (no income test, age 60+ homebound) but varying providers, contacts, and wait times by county; requires local lookup for application

**Source:** https://aging.ca.gov/Providers_and_Partners/Home-Delivered_Nutrition/Program_Narrative_and_Fact_Sheets/

---

### Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: Caregivers: 18+; Care recipients: 60+ or any age with Alzheimer’s/related disorders; Older relative caregivers: 55+[1]+
- Income: No income requirements[1]
- Assets: No asset limits or requirements mentioned[1]
- Informal/unpaid caregivers providing care to specified groups
- Adult family members or other informal caregivers for individuals 60+ or with Alzheimer’s/related disorders
- Older relatives (55+) caring for children <18 or adults 18-59 with disabilities
- Verification of age, residency, relationship, and care recipient condition may be required regionally (e.g., LA County)[1][3]

**Benefits:** Caregiver assessments and support plans; Caregiver training; Respite care; Counseling; Support groups; Supplemental services; Information and assistance; Assistive devices; Home modifications; Registries of independent care workers; Limited assistance with supplies/services. No fixed dollar amounts or hours statewide; services based on needs and funding availability[1][3]
- Varies by: region

**How to apply:**
- Phone: Call 1-800-510-2020 to reach local provider (statewide multipurpose senior services line)[3]
- In-person or phone intake with local Area Agency on Aging (AAA) or contracted California Caregiver Resource Center (CCRC)[1][3]
- Contact local AAA for your county (administered locally)[1]

**Timeline:** Not specified statewide; intake and eligibility process with assigned provider[3]
**Waitlist:** Services based on available funding; potential limits regionally (e.g., consumable supplies limited per participant in LA County)[3]

**Watch out for:**
- Not a paid caregiver program—provides support services to unpaid informal caregivers, not stipends or wages[1]
- Administered locally by AAAs, so contact local office for exact services/availability; funding-limited[1][3]
- VA program [2] and Medicaid self-direction programs [4][5][7] are separate—not this OAA Title III-E FCSP[1]
- Older relative caregivers have specific criteria (non-parents for children)[1]
- Reassessments annual or as needed; no fixed service limits but funding-based[3]

**Data shape:** No income/asset test; administered via 33 local AAAs with regional service variations and funding limits; OAA Title III-E federal program (code 3900100) state-implemented[1]

**Source:** https://www.aging.ca.gov/Providers_and_Partners/Area_Agencies_on_Aging/Family_Caregiver_Support/Program_Narrative_and_Fact_Sheets/[1]

---

### Senior Community Service Employment Program (SCSEP)


**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set federally; check current HHS Poverty Guidelines for precise figures (e.g., for 2025, 125% for 1-person household is approximately $19,563, 2-person $26,439; confirm latest at aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines).[2][3][8]
- Assets: No asset limits mentioned in program guidelines.
- Unemployed at enrollment and throughout participation[1][2][3]
- U.S. resident (implied by federal program)
- Must reside in the service area of the local grantee/provider (varies by region)[1][2][5]
- Some providers require homeless/at risk of homelessness (e.g., Orange County)[1]

**Benefits:** Part-time community service job training (average 20 hours/week, range 16-29 hours depending on funding); paid at highest of federal, state, or local minimum wage; job counseling, case management, job search/placement assistance, resume building, access to American Job Centers; placements at nonprofits/public agencies (schools, hospitals, senior centers, etc.) as bridge to unsubsidized jobs.[1][2][3][4]
- Varies by: region

**How to apply:**
- Contact local provider by phone, email, or in-person (varies by region; see geography.offices_or_providers)
- Online: Provider-specific websites (e.g., send resume to scsep@felton.org for Felton[5])
- No centralized statewide form; applications handled by grantees

**Timeline:** Not specified; varies by provider and funding
**Waitlist:** Likely due to funding limits; priority groups served first (veterans, 65+, disabled, etc.)[2][3]

**Watch out for:**
- Not statewide uniform—must contact region-specific provider; eligibility tied to local grantee boundaries[1][2][5]
- Temporary training only (not permanent job); goal is transition to unsubsidized work[3][4]
- Funding-limited slots lead to waitlists; priority to veterans/65+/etc. may delay others[2][3]
- Must remain unemployed and meet income during participation—no side jobs[1][3]
- Some areas add requirements like homelessness (Orange County)[1]

**Data shape:** Grantee-based with regional providers/service areas; income at 125% FPL (federal table); hours/wages vary by funding/local min wage; priority tiers affect access

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dol.gov/agencies/eta/seniors (federal); https://aging.ca.gov/Programs_and_Services/Senior_Employment_and_Training/ (CA)

---

### Legal Services for Seniors (via AAAs)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; available regardless of income level[3].
- Assets: No asset limits mentioned in sources.
- California resident
- Services targeted to those with economic, social, or legal needs[6]
- Often prioritized for low-income or vulnerable seniors, though not strictly required[1][2]

**Benefits:** Legal advice, consultations, advocacy, and representation for issues including housing, consumer fraud, elder abuse, Social Security, SSI, Medicare, Medi-Cal, age discrimination, pensions, nursing homes, protective services, conservatorships, public benefits, debt collection, simple wills, guardianships, advanced healthcare directives[2][3][4][5][6]. Examples: free 30-minute attorney consultation[1]; in-home appointments for homebound[4].
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) by county via https://aging.ca.gov/Programs_and_Services/Find_Services_in_My_County/ [3]
- Examples: San Francisco/Marin - (415) 989-1616 or online at sfbar.org/lris/senior-legal-services/ [1]; San Mateo - (650) 558-0915 [4]; SF Legal Assistance to Elderly - (415) 538-3333 [5]
- In-person, phone, or online intake depending on local provider

**Timeline:** Not specified; initial intake often by phone with subsequent appointments scheduled as needed[5].
**Waitlist:** Not mentioned; may vary by local demand.

**Watch out for:**
- Not a single centralized program—must contact specific local AAA, leading to variations in services and access[2][3]
- No strict income test, but prioritized for greatest needs; high-demand areas may have informal wait times[6]
- Primarily civil legal matters; not criminal defense
- Some providers limited to specific counties (e.g., SF/Marin[1])

**Data shape:** Decentralized via local AAAs with no uniform income/asset test; services and access vary significantly by county/provider; targeted to economic/social needs despite open eligibility[2][3][6]

**Source:** https://aging.ca.gov/Providers_and_Partners/Legal_Services/Legal_Services_Overview/[2]

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Must be a resident of a long-term care facility (nursing home, assisted living, RCFE)[4]

**Benefits:** Free advocacy and complaint investigation services[4][8]
- Varies by: not_applicable — services are available to all residents

**How to apply:**
- Contact local ombudsman office (varies by county — 35 local programs statewide[6])
- Call statewide CRISISline: 1-800-231-4024[6]
- Facilities must post ombudsman contact information in a conspicuous location[6]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- This is NOT a program families apply to — it's a service residents access once they're in a facility[4]
- Nearly 80% of ombudsman representatives are unpaid volunteers[4]
- Ombudsmen are mandated by law to make regular unannounced visits to facilities[8]
- The program is free — there are no income or asset limits because it's not a needs-based benefit program
- If your elderly relative is NOT yet in a long-term care facility, this program does not apply to them
- The ombudsman follows the resident's expressed wishes, not the family's wishes[4]

**Data shape:** This program is fundamentally different from typical benefit programs — it's an advocacy service with universal eligibility for facility residents. There are no income tests, asset limits, or application processes. Access is through the facility or by calling the statewide number. The program structure is county-based with 35 local offices, but services are consistent statewide.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.ca.gov/Programs_and_Services/Long-Term_Care_Ombudsman/

---

### State Supplementary Payment (SSP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Income cannot exceed the maximum monthly SSI/SSP benefit after disregards by SSA. Maximum combined SSI/SSP: $1,233.94 individual ($994 federal SSI + $239.94 SSP); $2,098.83 couple ($1,491 federal SSI + $607.83 SSP). Exact countable income determined by SSA based on cash or in-kind support for food, clothing, shelter after exclusions[1][2][3][5].
- Assets: Resources limited to $2,000 for individual, $3,000 for couple. Counts most owned items; exemptions not detailed in sources but follow federal SSI rules (e.g., primary home, one vehicle often exempt)[1][3][4].
- Blind or disabled (per SSA definition: severe impairment lasting/preventing substantial gainful activity for 12+ months)[1][3]
- California resident[1][2]
- U.S. citizen or qualified non-citizen (e.g., lawful permanent resident with 40 work quarters, refugee/asylee in first 5 years, veteran/spouse/child)[2][3][4]
- Must qualify for and receive federal SSI; SSP eligibility tied to SSI[1][2][5][7]

**Benefits:** Cash payment supplementing federal SSI: maximum $239.94/month individual, $607.83/month couple (2026 rates). Combined maximum: $1,233.94 individual, $2,098.83 couple. Reduced if other income received[1][3][5][7].
- Varies by: household_size

**How to apply:**
- Apply for SSI/SSP through Social Security Administration (SSA): online at ssa.gov, phone 1-800-772-1213, in-person at local SSA office
- No separate SSP application; automatic if SSI-eligible[2][7]

**Timeline:** SSA verifies application; decision timeline not specified in sources, includes income/resources review and periodic re-verification[2]

**Watch out for:**
- SSP only for SSI recipients; must qualify for federal SSI first—no standalone SSP[1][2][5][7]
- Some states restrict SSP to specific living arrangements (e.g., facilities); California ties directly to SSI without noted living restrictions[1]
- Income includes in-kind benefits (food/shelter); SSA disregards some but verifies all[2]
- No annual COLA for SSP since 2009/2011 cuts; fixed below federal poverty level[5][7]
- Must apply for other benefits (e.g., CalFresh) if eligible[4]

**Data shape:** Eligibility and benefits fully tied to federal SSI (automatic if SSI-qualified); scales by household size (individual/couple); statewide cash supplement with no separate state income/asset test

**Source:** https://www.cdss.ca.gov/inforesources/cdss-programs/ssi-ssp/ssi-ssp-eligibility-summary

---

### Property Tax Postponement Program


**Eligibility:**
- Age: 62+
- Income: Total household income of $55,181 or less (2025 figures from official sources; includes income of all persons living in the home during the prior year, excluding minors under 18, full-time students, and renters. Varies annually and by source reporting: e.g., $51,762 [1], $53,574 [3], $55,181 [2][4]. Does not vary by household size. All other recorded owners except spouse, registered domestic partner, and direct-line relatives (parents, children, grandchildren, their spouses) must also meet age/blind/disabled requirement [2].
- Assets: At least 40% equity in the property required (total liens, mortgages, encumbrances cannot exceed 60% of fair market value; defaulted taxes count toward this) [1][2][3][4]. No separate asset limits mentioned.
- Blind or disabled (disability must last at least 12 continuous months) [1][2][4]
- Own and occupy the property as principal place of residence (manufactured homes built after June 15, 1976 eligible; floating homes, houseboats not eligible; mobile/modular homes eligible if affixed or un-affixed) [1][2][4][5]
- No reverse mortgage on the property [1][2][3][4]
- Only current-year property taxes eligible (delinquent/defaulted taxes not covered, except possibly for non-mobile homes per some counties) [1][2][7]

**Benefits:** Postponement (deferral) of current-year secured property taxes on principal residence, secured by a lien on the property at 7% annual interest (older sources note 5%) [1][5]. Repayment due upon sale, transfer, refinance, death, move, or default on senior lien [6].

**How to apply:**
- Online: ptp.sco.ca.gov or https://www.sco.ca.gov/ardtax_prop_tax_postponement.html [1][3][8]
- Phone: toll-free (800) 952-5661 [1][3][7]
- Email: postponement@sco.ca.gov [1][3][7]
- Mail: Submit downloaded application form to State Controller's Office [7]
- Download/print application from website [7]

**Timeline:** Not specified; funds limited, first-come first-served [3][7]
**Waitlist:** No waitlist mentioned; applications processed until funds exhausted

**Watch out for:**
- Must reapply every year to confirm eligibility [6]
- Only covers current-year taxes; prior delinquent taxes remain homeowner responsibility and affect equity calculation [1][2][7]
- Lien at 7% interest accrues and must be repaid on triggering events (sale, death, etc.) [5][6]
- All co-owners except spouse/partner/direct relatives must qualify [2]
- Funds limited, first-come first-served; apply early in Oct 1-Feb 10 window [3][7]
- Income includes all household adults except specified exclusions; equity strictly 40% minimum [1][2][4]

**Data shape:** Income limit adjusts annually (e.g., $55,181 for recent years, lower in older docs); fixed 40% equity rule; statewide but county pages show lagged income figures; annual reapplication required; first-come funds limit processing

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.sco.ca.gov/ardtax_prop_tax_postponement.html

---

### In-Home Supportive Services (IHSS)


**Eligibility:**
- Age: 65+
- Income: Medi-Cal financial eligibility required, equivalent to 138% of Federal Poverty Level (FPL), updated annually in April. Effective 4/1/25: single applicant $1,801/month; married couple $2,433/month. Varies by household size per Medi-Cal rules; SSI/SSP recipients automatically qualify, others may have share of cost.[2][4]
- Assets: Medi-Cal asset limits apply (not specified in detail here; typically $2,000 for individual, $3,000 for couple, with exemptions for primary home, one vehicle, personal belongings, etc.). No unique IHSS asset rules beyond Medi-Cal.[2]
- California resident.[1][3]
- Medi-Cal eligibility determination (active or pending).[1][3][4]
- Live in own home or abode of choice (not acute care hospital, long-term care facility, or licensed community care facility).[1][3]
- Blind, disabled, or age 65+ with functional impairments needing assistance for activities of daily living (ADLs) to avoid institutionalization.[2][4][6]
- Completed Health Care Certification (SOC 873) verifying medical need.[1]

**Benefits:** In-home personal assistance including bathing/grooming, dressing, meal preparation/feeding, housecleaning, laundry, shopping, transportation to medical appointments, protective supervision, paramedical services. Authorized hours per month based on county social worker needs assessment (up to 283 hours max, varies by functional need ranked 1-6).[1][4][7]
- Varies by: priority_tier

**How to apply:**
- Contact county IHSS office (varies by county; e.g., San Diego CALL CENTER: 800-339-4661).[4]
- County social worker home interview for assessment.[1]
- No statewide online/mail specified; apply via county social services.[5]

**Timeline:** Not specified; involves home interview, assessment, and Notice of Action sent after approval/denial.[1]
**Waitlist:** Not mentioned in sources; may vary by county demand.[null]

**Watch out for:**
- Requires Medi-Cal eligibility first; IHSS not standalone.[1][3]
- Must live in 'own home'—excludes nursing homes/assisted living.[1][3]
- Hours/services based on strict needs assessment; not automatic for diagnosis like dementia.[2]
- Non-SSI recipients may owe share of cost.[4]
- County variations in process/wait times; always contact local office.[4][5]
- Nursing home level of care not always required, but at risk of institutionalization is key.[2]

**Data shape:** Tied to Medi-Cal eligibility with county-administered assessments; benefits (hours/services) scale by individual functional need/priority tier, not household size; no statewide fixed hours, regional county offices handle all applications

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.cdss.ca.gov/in-home-supportive-services

---

### Caregiver Resource Centers (CRC)


**Eligibility:**
- Income: No specific income limits, asset limits, or financial tests mentioned; open to families and caregivers statewide without stated dollar thresholds[3][4][6]
- Assets: No asset limits or exclusions detailed; program focuses on support services rather than financial aid programs with asset tests[3][4]
- Caregivers of adults with chronic, debilitating conditions including dementia, Alzheimer’s, stroke, Parkinson’s, Huntington’s, multiple sclerosis, traumatic brain injury (TBI), or similar cognitive/disabling disorders[3][4][6]

**Benefits:** Specialized information and referral; family consultation and care planning; respite care (financial assistance for in-home support, adult day care, short-term/weekend care, transportation); short-term counseling (individual, family, group); support groups (online/in-person); professional training workshops; legal/financial consultation (Powers of Attorney, Advance Directives, estate planning, conservatorships); education workshops on cognitive disorders, dementia, long-term care, stress management. No fixed dollar amounts or hours specified; respite provides financial assistance but amounts not detailed[3][4]
- Varies by: region

**How to apply:**
- Contact local CRC by phone, website, or email (11 centers cover all counties; examples: Inland CRC (909) 514-1404 or (800) 675-6694, www.inlandcaregivers.org; statewide network at www.caregivercalifornia.org; LA CRC at losangelescrc.usc.edu[4][6][7][8]
- In-person or online support groups/consultations via local centers[3][4]

**Timeline:** Not specified; services like consultations and referrals available immediately upon contact[3]
**Waitlist:** No waitlist mentioned; serves thousands annually with direct access[3][4]

**Watch out for:**
- Not a paid caregiver program or direct compensation (compare to IHSS/Medi-Cal for wages); focuses on support/respite for unpaid family caregivers; no financial eligibility tests but targeted to specific conditions like dementia/stroke; must contact local center as no central application[1][3][4][5][6]
- Respite is financial assistance, not unlimited hours/dollars—assessed per case[3]
- Admin now under Dept. of Aging, not DHCS[3]

**Data shape:** Network of 11 regional nonprofit centers covering all counties; no income/asset tests; condition-specific for cognitive/chronic illnesses; services include targeted respite funding without fixed amounts; find local provider by county via central site

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.aging.ca.gov/ (DHCS redirects here for CRC info as of July 2022)[3]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medi-Cal Medicare Savings Programs (QMB, | benefit | federal | deep |
| Multipurpose Senior Services Program (MS | benefit | local | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| CalFresh | benefit | state | deep |
| LIHEAP | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Health Insurance Counseling & Advocacy P | resource | state | simple |
| Meals on Wheels (via AAAs) | benefit | federal | medium |
| Family Caregiver Support Program | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Services for Seniors (via AAAs) | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| State Supplementary Payment (SSP) | benefit | state | medium |
| Property Tax Postponement Program | benefit | state | deep |
| In-Home Supportive Services (IHSS) | benefit | state | deep |
| Caregiver Resource Centers (CRC) | benefit | state | medium |

**Types:** {"benefit":12,"resource":3,"employment":1}
**Scopes:** {"federal":6,"local":2,"state":8}
**Complexity:** {"deep":9,"simple":3,"medium":4}

## Content Drafts

Generated 16 page drafts. Review in admin dashboard or `data/pipeline/CA/drafts.json`.

- **Medi-Cal Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Multipurpose Senior Services Program (MSSP) Waiver** (benefit) — 3 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **CalFresh** (benefit) — 3 content sections, 6 FAQs
- **LIHEAP** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 3 content sections, 6 FAQs
- **Health Insurance Counseling & Advocacy Program (HICAP)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels (via AAAs)** (benefit) — 3 content sections, 6 FAQs
- **Family Caregiver Support Program** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Legal Services for Seniors (via AAAs)** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **State Supplementary Payment (SSP)** (benefit) — 3 content sections, 6 FAQs
- **Property Tax Postponement Program** (benefit) — 3 content sections, 6 FAQs
- **In-Home Supportive Services (IHSS)** (benefit) — 5 content sections, 6 FAQs
- **Caregiver Resource Centers (CRC)** (benefit) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **individualized_service_plan**: 1 programs
- **region**: 5 programs
- **household_size**: 2 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **not_applicable — services are available to all residents**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medi-Cal Medicare Savings Programs (QMB, SLMB, QI)**: Three tiered programs (QMB, SLMB, QI) with escalating income thresholds (100%/120%/135% FPL) and narrowing benefits (QMB fullest coverage; QI Part B only); couple vs. single limits; county-administered statewide; annual FPL updates; QI funding-limited.
- **Multipurpose Senior Services Program (MSSP) Waiver**: Capped enrollment slots (11,940/year); county-restricted to MSSP sites; individualized plans, not fixed amounts/hours; administered via 40+ local CDA providers; transitioning to managed care integration via CalAIM
- **Program of All-Inclusive Care for the Elderly (PACE)**: No income/asset test for core eligibility (financials only affect premium payment); restricted to ~28 counties with multiple providers/centers; NFLOC certification by DHCS team; dual-eligible typically free
- **CalFresh**: Elderly/disabled households have relaxed rules (no gross income test, no asset limit, medical deductions, longer recertification); benefits scale by household size with expense deductions; county-administered statewide program
- **LIHEAP**: Administered by local agencies with statewide income guidelines but priority tiers, funding caps, and regional providers; benefits scale by household size, energy need, and vulnerability
- **Weatherization Assistance Program (WAP)**: Administered statewide via local providers with priority tiers for vulnerable (elderly); income at DOE guidelines with regional verification; no fixed statewide form/hotline—must find county provider
- **Health Insurance Counseling & Advocacy Program (HICAP)**: no income/asset test; statewide but county-administered with local providers and contacts; services fixed and free for all Medicare-eligible
- **Meals on Wheels (via AAAs)**: Administered locally by 33 AAAs with consistent OAA eligibility (no income test, age 60+ homebound) but varying providers, contacts, and wait times by county; requires local lookup for application
- **Family Caregiver Support Program**: No income/asset test; administered via 33 local AAAs with regional service variations and funding limits; OAA Title III-E federal program (code 3900100) state-implemented[1]
- **Senior Community Service Employment Program (SCSEP)**: Grantee-based with regional providers/service areas; income at 125% FPL (federal table); hours/wages vary by funding/local min wage; priority tiers affect access
- **Legal Services for Seniors (via AAAs)**: Decentralized via local AAAs with no uniform income/asset test; services and access vary significantly by county/provider; targeted to economic/social needs despite open eligibility[2][3][6]
- **Long-Term Care Ombudsman Program**: This program is fundamentally different from typical benefit programs — it's an advocacy service with universal eligibility for facility residents. There are no income tests, asset limits, or application processes. Access is through the facility or by calling the statewide number. The program structure is county-based with 35 local offices, but services are consistent statewide.
- **State Supplementary Payment (SSP)**: Eligibility and benefits fully tied to federal SSI (automatic if SSI-qualified); scales by household size (individual/couple); statewide cash supplement with no separate state income/asset test
- **Property Tax Postponement Program**: Income limit adjusts annually (e.g., $55,181 for recent years, lower in older docs); fixed 40% equity rule; statewide but county pages show lagged income figures; annual reapplication required; first-come funds limit processing
- **In-Home Supportive Services (IHSS)**: Tied to Medi-Cal eligibility with county-administered assessments; benefits (hours/services) scale by individual functional need/priority tier, not household size; no statewide fixed hours, regional county offices handle all applications
- **Caregiver Resource Centers (CRC)**: Network of 11 regional nonprofit centers covering all counties; no income/asset tests; condition-specific for cognitive/chronic illnesses; services include targeted respite funding without fixed amounts; find local provider by county via central site

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in California?
