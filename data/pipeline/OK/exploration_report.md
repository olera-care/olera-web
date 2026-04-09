# Oklahoma Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 12 |
| New (not in our data) | 7 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 5 programs
- **financial**: 4 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### ADvantage Waiver Program

- **min_age**: Ours says `65` → Source says `65 or older, or 19-64 with physical disability, developmental disability (without intellectual disability or cognitive impairment), or clinically documented progressive degenerative disease process` ([source](https://oklahoma.gov/okdhs/services/cap/advantage-services.html))
- **income_limit**: Ours says `$2901` → Source says `$2,199` ([source](https://oklahoma.gov/okdhs/services/cap/advantage-services.html))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services as alternative to nursing facility placement, including assistance to remain safely at home and active in community; specific services determined by individualized treatment plan via case manager (e.g., personal care, homemaker, therapies; requires at least monthly services to avoid institutionalization); promotes individual choice and self-direction` ([source](https://oklahoma.gov/okdhs/services/cap/advantage-services.html))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/cap/advantage-services.html`

### Medicare Savings Program

- **income_limit**: Ours says `$1305` → Source says `$1,215` ([source](https://oklahoma.gov/okdhs/services/health/help.html))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, Part A/B coinsurance/deductibles. SLMB: Part B premiums. QI: Part B premiums. QDWI: Part A premiums. Also provides Extra Help for drugs (QI: ≤$12.65 per drug in 2026). Monthly savings example: ~$185[1][3][5][6][7].` ([source](https://oklahoma.gov/okdhs/services/health/help.html))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/health/help.html`

### SNAP

- **min_age**: Ours says `65` → Source says `60` ([source](https://oklahoma.gov/okdhs/services/snap.html))
- **income_limit**: Ours says `$1980` → Source says `$1,696` ([source](https://oklahoma.gov/okdhs/services/snap.html))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases. Amount based on household size, net income (e.g., example 2-person elderly/disabled: $415 full month after deductions). Minimum $24 for some. Certification: 12 months general; 24 months for 60+ or disabled with no earned income[1][4][6].` ([source](https://oklahoma.gov/okdhs/services/snap.html))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/snap.html`

### LIHEAP

- **income_limit**: Ours says `$2490` → Source says `$240` ([source](https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment to utility: Regular Heating max $500/min $40; Cooling max $650/min $150; Crisis max $750. Varies by income, size, fuel, dwelling. Payments to primary heating/cooling source.[1]` ([source](https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html`

### Long-term care ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Receives and investigates complaints from residents, families, or friends; mediates resolutions with facility staff; explores problems and makes recommendations for corrective action with resident consent; provides information on facilities, resident rights, laws/regulations, advance directives, transfers/discharges; improves quality of life and care; no fixed dollar amounts or hours—services provided as needed per case.` ([source](https://oklahoma.gov/oag/about/divisions/ltco.html))
- **source_url**: Ours says `MISSING` → Source says `https://oklahoma.gov/oag/about/divisions/ltco.html`

## New Programs (Not in Our Data)

- **PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://oklahoma.gov/ohca/policies-and-rules/xpolicy/medical-assistance-for-adults-and-children-eligibility/programs-of-all-inclusive-care-for-the-elderly-pace-/eligibility-criteria.html (OHCA OAC 317:35-18-5)))
  - Shape notes: Limited to few regional providers/centers; financial test via SoonerCare ADvantage (income/asset limits by household); nursing level via UCAT; provider-exclusive services.
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.okcommerce.gov/weatherization/))
  - Shape notes: Decentralized via 77-county local providers with priority tiers; income at 200% FPL; no statewide application portal—agency-specific.
- **Home Delivered Meals (under Title III)** — service ([source](https://www.law.cornell.edu/regulations/oklahoma/OAC-340-105-10-83))
  - Shape notes: Administered via  local AAAs with priority tiers (e.g., poverty level); no income/asset test for eligibility but used for prioritization; varies by provider service area and local policies.
- **Respite Voucher Program** — financial ([source](https://oklahoma.gov/okdhs (primary OKDHS site; specific program pages via Sooner SUCCESS at https://soonersuccess.ouhsc.edu/Services-Programs/Respite/OKDHS-DDS-Respite-Voucher-Program).[5]))
  - Shape notes: Primarily for developmental disabilities caregivers, not general elderly care; multiple overlapping voucher programs with variant incomes ($45k-$90k), exclusions, and funders (DDSD, ACL AoA via Sooner SUCCESS); funding availability caps access; chronological processing.[1][2][3][5][7]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://oklahoma.gov/okdhs/services/aging/scommsep.html))
  - Shape notes: Regionally administered via sub-contractors in specific counties with limited slots; remaining counties use national grantees; income tied to federal poverty levels (125%) without fixed table here; priority-based access
- **Legal Aid for Seniors in Oklahoma** — service ([source](https://legalaidok.org/programs/senior-legal-help/))
  - Shape notes: Oklahoma offers a two-tier senior legal aid system: OK-SPLASH provides universal access (no income test) for seniors 60+ seeking legal information and brief advice, while Legal Aid Services of Oklahoma (LASO) provides full legal representation for low-income seniors meeting 125–200% of poverty guidelines. Income eligibility thresholds vary by household size but specific dollar amounts are not published in these sources—applicants must contact intake to learn their threshold. Asset limits are individualized. The program is statewide but coordinates through Area Agencies on Aging at the local level.
- **Senior Farmers' Market Nutrition Program (SFMNP)** — in_kind ([source](oksfmnp.org[4]; Oklahoma Human Services; individual tribal nation websites (Choctaw Nation, Chickasaw Nation)))
  - Shape notes: This program's structure is complex due to tribal administration: eligibility criteria and application processes vary depending on whether the applicant is applying through Choctaw Nation, Chickasaw Nation, or the general Oklahoma Human Services program. Age requirements differ for Native Americans (55) vs. non-Native Americans (60). Income limits are tied to federal poverty guidelines but specific dollar amounts are not provided in available documentation. The program operates seasonally (May–October or June–October) and has an annual application window (through September 30). Benefits are fixed at $50 per participant regardless of household size or income level.

## Program Details

### ADvantage Waiver Program


**Eligibility:**
- Age: 65 or older, or 19-64 with physical disability, developmental disability (without intellectual disability or cognitive impairment), or clinically documented progressive degenerative disease process+
- Income: Monthly countable income limit of $2,199 (subject to change; determined by Medicaid financial eligibility via Oklahoma Human Services Adult and Family Services; no household size table specified)
- Assets: Resource limit of $2,000 (standard Medicaid countable resources); home equity interest no greater than $730,000 in 2025 if living in home or intending to return (home exempt if spouse, minor child under 21, or permanently disabled/blind child lives there; subject to potential Medicaid Estate Recovery)
- Oklahoma resident and U.S. citizen or qualified legal resident
- Require Nursing Facility Level of Care (NFLOC), assessed via Uniform Comprehensive Assessment Tool (UCAT) III based on needs in Activities of Daily Living (ADLs) like bathing, dressing, mobility, toileting, and Instrumental ADLs (IADLs) like meal prep, shopping, housework
- Financially qualified for SoonerCare Medicaid
- Meet medical Level of Care criteria
- Available waiver slot (limited enrollment)
- Live in home or community (limited living arrangements; not for sole purpose of gaining Medicaid eligibility)

**Benefits:** Home and community-based services as alternative to nursing facility placement, including assistance to remain safely at home and active in community; specific services determined by individualized treatment plan via case manager (e.g., personal care, homemaker, therapies; requires at least monthly services to avoid institutionalization); promotes individual choice and self-direction
- Varies by: priority_tier

**How to apply:**
- Phone: Call Oklahoma Human Services contact line or local county OKDHS office to arrange assessment
- In-person: Local county OKDHS office
- Online: Oklahoma Human Services website (oklahoma.gov/okdhs)
- Assessment: Telephone interview by Adult and Family Services specialist for financial eligibility; comprehensive in-home or phone assessment by OKDHS nurse for medical eligibility; case manager develops plan if eligible

**Timeline:** Not specified; annual redetermination of financial and medical eligibility
**Waitlist:** Yes, statewide waitlist if all waiver slots filled (limited number authorized by CMS); name placed on waiting list until slot opens

**Watch out for:**
- Limited waiver slots lead to waitlist; not guaranteed even if eligible
- Must need NFLOC and at least monthly services to avoid institutionalization; dementia alone insufficient without NFLOC
- Developmentally disabled applicants 19-64 cannot have intellectual disability or cognitive impairment
- Home equity limit ($730,000 in 2025) and potential Estate Recovery on home
- Disabled participants can continue post-65, but slots are capped
- Annual redeterminations required
- Not for sole purpose of gaining Medicaid eligibility

**Data shape:** Limited statewide waiver slots create waitlist; eligibility combines Medicaid financial test with NFLOC assessment; services individualized by case manager based on targeted groups (frail elderly 65+, physically disabled 19-64, certain developmentally disabled 19-64); county OKDHS offices handle regional assessments

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/cap/advantage-services.html

---

### PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Follows SoonerCare ADvantage financial criteria per OAC 317:35-17-10 and 317:35-17-11 (specific 2026 dollar amounts and household size tables not detailed in sources; typically aligns with Medicaid long-term care limits around 300% FBR or $2,901/month for one person, but confirm current OKDHS figures). Must be eligible for SoonerCare State Plan or Title XIX if institutionalized.[1][2]
- Assets: Aligns with SoonerCare ADvantage Medicaid limits (typically $2,000 for individual, excluding primary home and certain exempt assets; exact countable/exempt details per OKDHS ADvantage rules).[1][2]
- Live in a PACE service area (limited to provider-specific regions, e.g., Oklahoma City, Shawnee, Seminole County for Valir PACE; check provider for exact ZIP codes).
- State-determined nursing facility level of care (via Uniform Comprehensive Assessment Tool - UCAT Part III).
- PACE interdisciplinary team (IDT) determines able to be safely served in community.
- Agree to use PACE provider as sole service provider (except emergencies).
- Meet medical eligibility via nurse designee review.
- Not enrolled in Medicare Advantage, hospice, or certain other programs.

**Benefits:** All-inclusive: primary/acute/long-term care, nursing home-level services, personal care, hot breakfast/lunch on center days, transportation, recreational activities, prescription drugs, all Medicare/Medicaid-covered services delivered solely through PACE provider. No copays/deductibles for eligibles; private pay option ~$4,000–$5,000/month if not dually eligible.[5][9]
- Varies by: region

**How to apply:**
- Contact PACE providers directly: Valir PACE (Oklahoma City/Shawnee/Seminole) via valir.com/pace or local centers; LIFE PACE via lifepace.org.
- Oklahoma Health Care Authority (OHCA)/OKDHS for assessment: Physical/medical assessment by PACE team, approved by OHCA nurse designee.
- No specific statewide phone/website/form listed; start with provider sites or OHCA (ohca.ok.gov) for SoonerCare/PACE referral.

**Timeline:** Not specified; involves UCAT assessment and IDT review (new determination required for program changes).[1][2]
**Waitlist:** Possible, varies by provider/service area (not detailed; regional demand likely affects).[4]

**Watch out for:**
- Not statewide—must live in specific provider service area; check ZIP code first.
- Sole provider lock-in: Cannot use other Medicare/Medicaid providers except emergencies; financial liability for unauthorized services.
- Financial eligibility mirrors SoonerCare ADvantage (income/asset tests apply, unlike some national PACE claims of no financial criteria).
- Nursing home level but community-safe: IDT denial if unsafe, with referral to alternatives.
- Private pay expensive ($4k+/month) if not Medicaid-eligible.
- New UCAT needed for program switches (e.g., ADvantage to PACE if >6 months old).

**Data shape:** Limited to few regional providers/centers; financial test via SoonerCare ADvantage (income/asset limits by household); nursing level via UCAT; provider-exclusive services.

**Source:** https://oklahoma.gov/ohca/policies-and-rules/xpolicy/medical-assistance-for-adults-and-children-eligibility/programs-of-all-inclusive-care-for-the-elderly-pace-/eligibility-criteria.html (OHCA OAC 317:35-18-5)

---

### Medicare Savings Program


**Eligibility:**
- Income: MSP in Oklahoma includes four tiers (QMB, SLMB, QI, QDWI) with state-specific monthly income limits that follow federal poverty levels but use Oklahoma standards. Limits vary by tier and household size (individual or married couple). Exact current limits (as of 2026) are detailed in OKDHS Appendix C-1: Schedule VI (QMB), Schedule VII (SLMB), Schedule VII.a (QI). Example older figures: QMB individual $1,215/month, couple $1,643; higher tiers up to ~$1,763 individual/$2,380 couple. Employment income excludes over half before taxes. Limits update annually in April[1][2][6][7].
- Assets: Resources limited by tier (e.g., ~$2,000 individual/$3,000 couple for some; up to $9,660 individual/$14,470 couple in examples). Counts: checking/savings, CDs, life insurance cash value, stocks, bonds, real estate. Exempt: home, furnishings, car, pre-paid funeral trusts up to $10,000. Worker reviews all resources. Spousal rules allow non-applicant spouse up to $148,620 if one applies[2][6][7].
- Must be eligible for Medicare Part A (even if not enrolled); Part B required for SLMB/QI.
- Oklahoma follows federal standards but may apply stricter rules; no asset limit in some states like CT, but OK has limits[1][3].

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, Part A/B coinsurance/deductibles. SLMB: Part B premiums. QI: Part B premiums. QDWI: Part A premiums. Also provides Extra Help for drugs (QI: ≤$12.65 per drug in 2026). Monthly savings example: ~$185[1][3][5][6][7].
- Varies by: priority_tier

**How to apply:**
- In-person or phone: Local OKDHS Human Services Center.
- Phone: Oklahoma Insurance Department Senior Health Insurance Counseling (800-763-2828 or 405-521-6628)[6][9].
- No specific online URL or mail listed; apply via OKDHS centers.

**Timeline:** Not specified; states approve QI first-come, first-served with renewal priority[3].
**Waitlist:** QI may have waitlist or cap due to federal funding; apply even if unsure[3][7].

**Watch out for:**
- State determines tier upon application; you may qualify for multiple/higher than expected[3][7].
- QI requires annual reapplication, first-come/first-served with prior-year priority; funding caps possible[3].
- Income calculation: Add back Part B premium from SS check; excludes >50% employment income[6].
- Assets strictly reviewed; exempt items like home/car must be verified[6].
- Limits update yearly (April); check Appendix C-1 for current[6].
- Not full Medicaid; compares to LTSS programs with different limits (e.g., $688K home equity cap)[2].

**Data shape:** Tiered by income (QMB lowest, QI highest up to 135% FPL); state-specific limits in OKDHS Appendix C-1 Schedules VI-VII.a; resource exemptions detailed; employment income deduction; spousal impoverishment protections.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/health/help.html

---

### SNAP


**Eligibility:**
- Age: 60+
- Income: For households without elderly (60+) or disabled members: Gross monthly income limit is 130% of FPL (Oct 1, 2025-Sep 30, 2026): 1: $1,696; 2: $2,292; 3: $2,888; 4: $3,483; 5: $4,079; 6: $4,675; 7: $5,271; 8: $5,867; +$596 per additional. Net income: 100% FPL. For households with elderly (60+) or disabled: Gross limit 165% FPL if elderly/disabled cannot purchase/prepare meals separately due to permanent disability; otherwise, standard 130% gross and 100% net FPL. Households with 60+ or disabled subject only to 100% net FPL in some cases[1][3][6].
- Assets: Countable resources limit: $2,750 general; $4,250 if household has member 60+ or disabled. Countable: cash, bank accounts. Exempt: home and land it sits on, most retirement/pension plans (withdrawals count as income)[1].
- U.S. citizen or qualified non-citizen
- Provide Social Security Numbers for all household members
- Meet work requirements if applicable (unemployed adults 18-53, but elderly 60+ exempt)
- Live in Oklahoma

**Benefits:** Monthly EBT card benefits for food purchases. Amount based on household size, net income (e.g., example 2-person elderly/disabled: $415 full month after deductions). Minimum $24 for some. Certification: 12 months general; 24 months for 60+ or disabled with no earned income[1][4][6].
- Varies by: household_size

**How to apply:**
- Online: www.OKDHSLIVE.ORG
- Phone: 1-877-760-0114 (toll-free)
- Mail/In-person: Form 08MP001E (Request for Benefits) to Local Human Services Center
- Eligibility screening: OKDHSLive! website

**Timeline:** Not specified; interview required after application[3].

**Watch out for:**
- Elderly/disabled households have special rules: higher gross (165% if cannot prepare meals), asset limit $4,250, longer certification (24 months no earned income), but still need net 100% FPL
- Work requirements exempt for 60+, but apply to younger able-bodied adults in household
- Home/land/pensions exempt from assets, but withdrawals count as income
- Must provide SSNs or denied
- Benefits calculated after deductions (e.g., 30% of net from max allotment)[1][4][6]

**Data shape:** Elderly/disabled special rules (higher gross/asset limits, exemptions from work reqs, longer certification); income tables scale by household size; statewide via local centers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/snap.html

---

### LIHEAP


**Eligibility:**
- Income: Maximum gross monthly income at 130% of federal poverty level (earned income deduction: subtract $240 per employed member). Table: 1: $1,696; 2: $2,292; 3: $2,888; 4: $3,483; 5: $4,079; 6: $4,675; 7: $5,271; 8: $5,867; add $596 per additional member.[6][2]
- Assets: Available resources considered, but no specific dollar limits or exemptions detailed in sources.[5]
- Household responsible for home energy payment (must live under same roof/utility meter; all must apply together; ineligible if non-resident pays bill directly).[2][5]
- US citizen or legal permanent resident.[2]
- Native Americans may apply via tribe or DHS, not both in same federal fiscal year.[3][4][5]

**Benefits:** One-time payment to utility: Regular Heating max $500/min $40; Cooling max $650/min $150; Crisis max $750. Varies by income, size, fuel, dwelling. Payments to primary heating/cooling source.[1]
- Varies by: household_size|priority_tier

**How to apply:**
- Online: www.okdhslive.org or OKDHSLive.org (during open periods; email completed app to live@okdhs.org with utility bill).[2][4][7]
- Phone: (405) 522-5050 (select energy options; year-round for life-threatening crisis).[2][5]
- Tribal for Native Americans (e.g., Choctaw Nation; cannot duplicate DHS).[3]

**Timeline:** Up to 60 calendar days for heating/cooling; crisis evaluated individually.[2]
**Waitlist:** Higher call volumes during enrollment; apply online for faster service; funding limited (subject to federal funds).[4][5]

**Watch out for:**
- Only one payment per household per program component per year.[2][4]
- Everyone under same utility meter counts as household and must apply together.[2]
- Seasonal: Heating ~Dec-Feb; Cooling summer; Crisis/emergency year-round only for life-threatening.[1][2]
- Tribal vs DHS: Cannot receive from both same year.[3][4][5]
- Pre-authorized if receiving other OKHS benefits (check notifications).[4]
- Funding not guaranteed; subject to federal availability.[5]

**Data shape:** Seasonal components (heating, cooling, crisis); household defined by utility meter; Native/tribal dual-path with no duplicate; income with earned deduction; benefits scaled by income/size/fuel

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/okdhs/services/liheap/utilityservicesliheapmain.html

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 200% of the Federal Poverty Guidelines (varies by household size; exact dollar amounts not specified in sources—check current HHS Poverty Guidelines). Note: Utility-specific programs like OG&E (<$60,000 annual) or PSO (≤$55,000–$65,000 annual, home <2,200 sq ft and ≥10 years old) have different thresholds.[1][2][3][6]
- Assets: No asset limits mentioned.[1][2]
- Low-income Oklahoma households (rent or own).
- Priority to elderly (60+), disabled, families with children (especially ≤5 years), high energy burdens, high residential energy users.[1][2][4]

**Benefits:** No-cost home energy efficiency improvements based on assessment/audit, including air sealing, insulation (e.g., attic), duct sealing, door/window repair/replacement, heating system repair/replacement, energy-saving light bulbs, health/safety fixes.[1][2][3][6]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (find via Oklahoma Department of Commerce at 405-949-1495 or regional map).[5]
- Utility-specific: OG&E at 405-272-9741 (OKC) or 1-800-272-9741; PSO via provider Titan ES (contact PSO).[3][6]
- In-person/mail via local agencies (e.g., NEOCAA, LIFT).[2][4]

**Timeline:** Not specified statewide; varies by local provider.[1]
**Waitlist:** Yes, common at local agencies (e.g., NEOCAA has waitlist; applications prioritized by receipt date).[4]

**Watch out for:**
- Must contact local agency (not centralized); long waitlists common.
- Priority-based selection, not guaranteed service.
- Utility programs have separate, stricter criteria (e.g., income caps, home size/age).
- Renters need landlord permission.[1][2][3][4][6]

**Data shape:** Decentralized via 77-county local providers with priority tiers; income at 200% FPL; no statewide application portal—agency-specific.

**Source:** https://www.okcommerce.gov/weatherization/

---

### Home Delivered Meals (under Title III)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits; income or resources are not considered for eligibility determination. Priority given to those below 2026 poverty guidelines ($1,330/month individual; $1,803/month couple).[4]
- Assets: No asset limits or tests mentioned.
- Homebound (unable to leave home without assistance) and no one available to assist with meal preparation.[1][4]
- Disabled persons under 60 residing with eligible 60+ participant.[1]
- Spouses of participants if in best interest per Area Agency on Aging (AAA) criteria.[1]
- Frail, disabled, isolated, or otherwise in greatest social/economic need per local policies.[6]

**Benefits:** Daily home-delivered meals (hot, cold, frozen, or shelf-stable) complying with Dietary Guidelines for Americans and 1/3 of Dietary Reference Intakes; wellness checks during delivery; voluntary contributions accepted but not required. Typically lunch Monday-Friday, but varies locally (may include other meals/times/weekends).[3][6][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) or provider (e.g., Meals on Wheels Oklahoma City via their site).[4]
- In-home or telephone assessment by AAA, case coordination unit, managed care organization, or nutrition provider.[3]
- Intake form completion (e.g., via SOCAG or similar providers).[9]

**Timeline:** Not specified in sources.
**Waitlist:** Priority-based; those below poverty guidelines prioritized, implying potential waitlists for others.[4]

**Watch out for:**
- Homebound strictly defined (needs assistance to leave; not eligible if can drive, use taxi, or household member can prepare meals).[1][4]
- No automatic entitlement; AAAs set additional criteria and priorities (e.g., economic need).[1][6]
- Separate from Medicaid ADvantage program (requires OAA Title III contract).[2][5]
- Voluntary contributions requested but cannot be required.[3]
- May be denied for health/safety risks to providers.[4]

**Data shape:** Administered via  local AAAs with priority tiers (e.g., poverty level); no income/asset test for eligibility but used for prioritization; varies by provider service area and local policies.

**Source:** https://www.law.cornell.edu/regulations/oklahoma/OAC-340-105-10-83

---

### Respite Voucher Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Caregiver's adjusted gross income less than $75,000 (DDS program). No income restrictions for some variants like OAA NFCSP; Lifespan Respite Grant up to $90,000 household income.[1][2][3]
- Assets: No asset limits specified in available sources.
- Care recipient has a developmental disability per Section 1408 of Title 10 of the Oklahoma Statutes.
- Care recipient does not receive services through a DDS Home and Community-Based Services Waiver.
- Care recipient receives less than 20 hours per week of state funded services (some exceptions apply).
- Caregiver must reside with and provide at least eight hours per day of care to the care recipient.
- Caregiver must live in Oklahoma.
- Caregiver does not receive the Family Support Assistance Payment on behalf of the care recipient.
- Caregiver must not receive respite services funded through another state or federal program.
- If care recipient is in DHS custody, must be living in a kinship home.[1][3][5]

**Benefits:** Vouchers to pay respite care providers for temporary care, allowing caregivers a break. Specific amounts not detailed for DDS program; Lifespan variant provides up to four $100 vouchers per quarter; post-adoption up to $75 for one child or $300 for two or more (once per year).[1][5][6][8]
- Varies by: program_variant

**How to apply:**
- Email completed application with attachments to DDS.RespiteVoucher@okdhs.org (DDS program).[5]
- Phone: OKC (800) 522-1064, Tulsa (800) 522-1075 (some variants).[3]
- Phone for Lifespan: 405-271-2710 or 1-877-441-0434; email respite@ouhsc.edu (indicate county).[7]
- Post-adoption: Email CWS.PostAdoption.Respite@okdhs.org or call 405-982-3098.[8]

**Timeline:** DDSD provides written determination within 30 days; applications processed in chronological order of receipt of completed applications.[5]
**Waitlist:** Subject to availability of funding; vouchers valid for 90 days from issuance, applications valid for state fiscal year (July 1-June 30).[5]

**Watch out for:**
- Strict exclusions: Cannot receive other state/federal respite, DDS waiver services, or >20 hours/week state-funded services.
- Caregiver must provide at least 8 hours/day care and reside with recipient.
- Funding-limited; applications chronological, incomplete returned.
- Multiple similar programs (e.g., Lifespan Respite Grant, post-adoption, OAA NFCSP) with different eligibility—income $75k vs $90k, age groups.
- Not for elderly without developmental disability; focus on developmental disabilities, not general aging.[1][2][3][5]

**Data shape:** Primarily for developmental disabilities caregivers, not general elderly care; multiple overlapping voucher programs with variant incomes ($45k-$90k), exclusions, and funders (DDSD, ACL AoA via Sooner SUCCESS); funding availability caps access; chronological processing.[1][2][3][5][7]

**Source:** https://oklahoma.gov/okdhs (primary OKDHS site; specific program pages via Sooner SUCCESS at https://soonersuccess.ouhsc.edu/Services-Programs/Respite/OKDHS-DDS-Respite-Voucher-Program).[5]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in current sources; families must verify current federal poverty guidelines at application[1][4][5].
- Assets: No asset limits mentioned in sources[1][4].
- Unemployed
- Poor employment prospects
- Proof of residency, age, and income required
- U.S. citizen or eligible resident (inferred from federal program)
- Priority to veterans and qualified spouses, individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, or prior American Job Center users[4][5]

**Benefits:** Subsidized part-time community service work-based job training at non-profit/public agencies (e.g., senior centers, schools, libraries, museums); average 20 hours/week; paid highest of federal ($7.25/hour), state, or local minimum wage; employment assistance to transition to unsubsidized jobs[3][4].
- Varies by: priority_tier

**How to apply:**
- Phone: Oklahoma DHS Aging Services at 405-521-2281[1]; Program Field Rep Larry Bartels at 405-522-5050 (select 1/2 for language, then 4, then 5)[2]; OEDA Coordinator Debbie Campbell at 580-823-7587 for specific counties[3]
- Email: Larry.Bartels@okdhs.org[2]
- In-person or mail via sub-contractors: ASCOG (south central counties: Beckham, Custer, Greer, Harmon, Jackson, Kiowa, Roger Mills, Washita); OEDA (northwest counties: Blaine, Cimarron, Dewey, Ellis, Garfield, Grant, Harper, Kay, Kingfisher, Major, Noble, Texas, Woods, Woodward); other counties via national grantees or DHS Aging Services[1][2][3]
- Website: Use statewide county map for local contacts at https://oklahoma.gov/okdhs/services/cap/scsep.html or https://oklahoma.gov/okdhs/services/aging/scommsep.html[1][2][5]

**Timeline:** Not specified in sources
**Waitlist:** Limited slots available in certain counties, implying potential waitlists or unavailability[3]

**Watch out for:**
- Not permanent employment—training bridge to unsubsidized jobs only[3][4]
- Limited slots by county; not available everywhere[2][3]
- Income at or below 125% poverty (check current levels as they update yearly)[4][5]
- Must be unemployed and seeking workforce entry; proof required upfront[1]
- Priority tiers may delay non-priority applicants[4]

**Data shape:** Regionally administered via sub-contractors in specific counties with limited slots; remaining counties use national grantees; income tied to federal poverty levels (125%) without fixed table here; priority-based access

**Source:** https://oklahoma.gov/okdhs/services/aging/scommsep.html

---

### Legal Aid for Seniors in Oklahoma

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: 125% of Federal Poverty Guidelines (primary threshold); up to 200% of Federal Poverty Guidelines with certain eligibility factors[1][4]. Specific dollar amounts vary by household size and are calculated using a mathematical formula based on household income and number of household members[1]. The 2024 Federal Poverty Guidelines are used as the baseline[8].
- Assets: Assets affect eligibility and are determined on a case-by-case basis by each legal services program[4]. No specific asset exemption table provided in available sources.
- Must be a resident of Oklahoma[6]
- Must have a civil (non-criminal) legal issue[6]
- No income test required for Older Americans Act Title III services (age 60+), though income may be assessed to determine eligibility for other programs[2]

**Benefits:** Free legal advice, counseling, and legal information. Services include: wills, powers of attorney, healthcare issues, Medicaid/Medicare, Social Security, SSI overpayments, nursing home problems, guardianships, food benefits/SNAP, garnishments, public/subsidized housing, veteran benefits, unfair sales and collection practices, transfer on death deeds, and other civil legal problems[3][5]
- Varies by: legal_issue_type

**How to apply:**
- Phone: 1-855-488-6814 (OK-SPLASH helpline)[5]; also 918-308-5295 (Tulsa office)[5]
- Online: OKLegalConnect.org[3][5]
- Email: oksplash@laok.org (for protection, include only name and phone number)[5]
- General LASO intake: 1-888-534-5243 or 918-428-4357 (Mon–Thurs, 9 a.m. to 4 p.m.)[1][6]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Two separate programs exist for seniors: OK-SPLASH (free legal advice/counseling for 60+, no income test) and general LASO services (civil legal representation, income-based eligibility)[1][3][5]. Families should clarify which program fits their needs.
- LASO does not accept medical malpractice, personal injury, or 'fee-generating' cases (cases a private attorney could take on contingency)[1].
- Income limits can extend to 200% of poverty guidelines with 'certain other eligibility factors,' but these factors are not detailed in available sources—families must ask during intake[1].
- Assets are evaluated case-by-case with no published exemption schedule, creating uncertainty about what will disqualify applicants[4].
- Phone intake is limited to Mon–Thurs, 9 a.m. to 4 p.m.[1][6].
- Processing time and waitlist status are not publicly disclosed, so families should ask directly when applying.
- OK-SPLASH provides legal information and advice but may refer complex cases to full legal representation through LASO, which has income restrictions[5].

**Data shape:** Oklahoma offers a two-tier senior legal aid system: OK-SPLASH provides universal access (no income test) for seniors 60+ seeking legal information and brief advice, while Legal Aid Services of Oklahoma (LASO) provides full legal representation for low-income seniors meeting 125–200% of poverty guidelines. Income eligibility thresholds vary by household size but specific dollar amounts are not published in these sources—applicants must contact intake to learn their threshold. Asset limits are individualized. The program is statewide but coordinates through Area Agencies on Aging at the local level.

**Source:** https://legalaidok.org/programs/senior-legal-help/

---

### Long-term care ombudsman


**Eligibility:**
- Income: No income limits; available to any resident or family regardless of financial status.
- Assets: No asset limits or tests apply.
- Must be a resident of a certified long-term care facility in Oklahoma (nursing facility, assisted living center, residential care home, or specialized facility licensed under Oklahoma Statutes Title 63), or a family member/friend acting on their behalf with resident consent for investigations.
- Complaints or assistance requests related to facility care, rights, or quality of life.

**Benefits:** Receives and investigates complaints from residents, families, or friends; mediates resolutions with facility staff; explores problems and makes recommendations for corrective action with resident consent; provides information on facilities, resident rights, laws/regulations, advance directives, transfers/discharges; improves quality of life and care; no fixed dollar amounts or hours—services provided as needed per case.

**How to apply:**
- Phone: Toll-free 1-800-211-2116 or local (405) 521-6734 (M-F 8am-5pm)
- Email: ombudsmanfax@ltco.ok.gov (for State Ombudsman Bill Whited)
- In-person: Contact local Area Agency on Aging Ombudsman supervisor via statewide phone line for regional offices

**Timeline:** Attempts to resolve complaints through communication; no formal processing timeline specified, but focuses on prompt mediation and investigation.

**Watch out for:**
- Requires resident consent (written/oral) for file access or investigations—cannot act without it unless court-ordered.
- Not a regulatory body or substitute for Oklahoma State Department of Health complaints (1-800-747-8419 for licensing violations).
- Staff/volunteers must be free of conflicts (e.g., not employed by facilities, Medicaid eligibility roles, or protective services).
- Families can contact pre-admission for facility info but services focus on current residents.
- Not financial aid or direct care—purely advocacy and mediation.

**Data shape:** no income/asset test; consent-driven advocacy only for long-term care facility residents; volunteer-supported via regional Area Agencies on Aging; distinct from health department enforcement or Medicaid programs.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oklahoma.gov/oag/about/divisions/ltco.html

---

### Senior Farmers' Market Nutrition Program (SFMNP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years old (or 55 for Native Americans)[2]+
- Income: Income must not exceed 185% of federal poverty income guidelines[1]. Specific dollar amounts vary by household size but are tied to federal poverty thresholds. Applicants must provide proof: most recent 30-day pay stubs, current tax returns, or current eligibility letter for SNAP or Indian commodities[1].
- Assets: Not specified in available program documentation
- Must reside in Oklahoma, specifically in participating counties[2]
- For tribal members: Must have valid Certificate of Degree of Indian Blood (CDIB) card and tribal membership verification[1][3]
- For non-Native Americans living in Native American households: Must reside with a senior citizen of a federally recognized tribe[3]
- For disabled persons: Must be at least 55 years old, living in elderly housing with congregate nutritional services, with proof of SSI[1]
- Valid ID required[1]

**Benefits:** $50 EBT debit card per eligible participant[4][6]. Card can be used to purchase locally grown produce, unprocessed honey, and fresh-cut herbs[7].
- Varies by: fixed

**How to apply:**
- Online: oksfmnp.org[4]
- Mail: Applications available for download or at Choctaw Nation Community Centers (starting Feb. 1 each year); can be mailed to program office[1]
- Email: Applications can be emailed[1]
- In-person: Chickasaw Nation has five nutrition centers located in Ada, Ardmore, and other locations[3]

**Timeline:** Not specified in available documentation
**Waitlist:** Not mentioned; however, applications are accepted through September 30 or until funding is depleted[1]

**Watch out for:**
- Application window is limited: Applications accepted only through September 30 each year, or until funding is depleted[1]
- Benefits are seasonal: EBT card benefits can only be used May through October (or June through October in some years)[1][3]
- Tribal vs. non-tribal eligibility differs: Native Americans can qualify at age 55, but non-Native Americans must be 60 unless living in a Native American household[1][2]
- Program administration is fragmented: Different tribal nations administer the program in their service areas; eligibility and application processes may vary slightly by region[1][3]
- Income verification required: Applicants must provide recent financial documentation; eligibility is not automatic based on age alone[1]
- Limited to specific foods: Card can only purchase locally grown produce, unprocessed honey, and fresh-cut herbs—not all food items[7]
- Funding is not guaranteed: Program states applications accepted 'until funding is depleted,' suggesting potential year-to-year availability issues[1]

**Data shape:** This program's structure is complex due to tribal administration: eligibility criteria and application processes vary depending on whether the applicant is applying through Choctaw Nation, Chickasaw Nation, or the general Oklahoma Human Services program. Age requirements differ for Native Americans (55) vs. non-Native Americans (60). Income limits are tied to federal poverty guidelines but specific dollar amounts are not provided in available documentation. The program operates seasonally (May–October or June–October) and has an annual application window (through September 30). Benefits are fixed at $50 per participant regardless of household size or income level.

**Source:** oksfmnp.org[4]; Oklahoma Human Services; individual tribal nation websites (Choctaw Nation, Chickasaw Nation)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| ADvantage Waiver Program | benefit | state | deep |
| PACE (Program of All-Inclusive Care for  | benefit | local | deep |
| Medicare Savings Program | benefit | federal | deep |
| SNAP | benefit | federal | deep |
| LIHEAP | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Home Delivered Meals (under Title III) | benefit | state | deep |
| Respite Voucher Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors in Oklahoma | resource | state | simple |
| Long-term care ombudsman | resource | federal | simple |
| Senior Farmers' Market Nutrition Program | benefit | local | deep |

**Types:** {"benefit":9,"employment":1,"resource":2}
**Scopes:** {"state":4,"local":2,"federal":6}
**Complexity:** {"deep":10,"simple":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/OK/drafts.json`.

- **ADvantage Waiver Program** (benefit) — 5 content sections, 6 FAQs
- **PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 5 content sections, 6 FAQs
- **Medicare Savings Program** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **region**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **program_variant**: 1 programs
- **legal_issue_type**: 1 programs
- **not_applicable**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **ADvantage Waiver Program**: Limited statewide waiver slots create waitlist; eligibility combines Medicaid financial test with NFLOC assessment; services individualized by case manager based on targeted groups (frail elderly 65+, physically disabled 19-64, certain developmentally disabled 19-64); county OKDHS offices handle regional assessments
- **PACE (Program of All-Inclusive Care for the Elderly)**: Limited to few regional providers/centers; financial test via SoonerCare ADvantage (income/asset limits by household); nursing level via UCAT; provider-exclusive services.
- **Medicare Savings Program**: Tiered by income (QMB lowest, QI highest up to 135% FPL); state-specific limits in OKDHS Appendix C-1 Schedules VI-VII.a; resource exemptions detailed; employment income deduction; spousal impoverishment protections.
- **SNAP**: Elderly/disabled special rules (higher gross/asset limits, exemptions from work reqs, longer certification); income tables scale by household size; statewide via local centers
- **LIHEAP**: Seasonal components (heating, cooling, crisis); household defined by utility meter; Native/tribal dual-path with no duplicate; income with earned deduction; benefits scaled by income/size/fuel
- **Weatherization Assistance Program (WAP)**: Decentralized via 77-county local providers with priority tiers; income at 200% FPL; no statewide application portal—agency-specific.
- **Home Delivered Meals (under Title III)**: Administered via  local AAAs with priority tiers (e.g., poverty level); no income/asset test for eligibility but used for prioritization; varies by provider service area and local policies.
- **Respite Voucher Program**: Primarily for developmental disabilities caregivers, not general elderly care; multiple overlapping voucher programs with variant incomes ($45k-$90k), exclusions, and funders (DDSD, ACL AoA via Sooner SUCCESS); funding availability caps access; chronological processing.[1][2][3][5][7]
- **Senior Community Service Employment Program (SCSEP)**: Regionally administered via sub-contractors in specific counties with limited slots; remaining counties use national grantees; income tied to federal poverty levels (125%) without fixed table here; priority-based access
- **Legal Aid for Seniors in Oklahoma**: Oklahoma offers a two-tier senior legal aid system: OK-SPLASH provides universal access (no income test) for seniors 60+ seeking legal information and brief advice, while Legal Aid Services of Oklahoma (LASO) provides full legal representation for low-income seniors meeting 125–200% of poverty guidelines. Income eligibility thresholds vary by household size but specific dollar amounts are not published in these sources—applicants must contact intake to learn their threshold. Asset limits are individualized. The program is statewide but coordinates through Area Agencies on Aging at the local level.
- **Long-term care ombudsman**: no income/asset test; consent-driven advocacy only for long-term care facility residents; volunteer-supported via regional Area Agencies on Aging; distinct from health department enforcement or Medicaid programs.
- **Senior Farmers' Market Nutrition Program (SFMNP)**: This program's structure is complex due to tribal administration: eligibility criteria and application processes vary depending on whether the applicant is applying through Choctaw Nation, Chickasaw Nation, or the general Oklahoma Human Services program. Age requirements differ for Native Americans (55) vs. non-Native Americans (60). Income limits are tied to federal poverty guidelines but specific dollar amounts are not provided in available documentation. The program operates seasonally (May–October or June–October) and has an annual application window (through September 30). Benefits are fixed at $50 per participant regardless of household size or income level.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Oklahoma?
