# Idaho Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 1.9m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 14 |
| New (not in our data) | 5 |
| Data discrepancies | 9 |
| Fields our model can't capture | 9 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 6 | Has waitlist info — our model has no wait time field |
| `documents_required` | 9 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 8 programs
- **financial**: 2 programs
- **in_kind**: 1 programs
- **financial + in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Idaho Medicaid Aged and Disabled Waiver

- **min_age**: Ours says `65` → Source says `65+ or 18-64 if disabled; disabled persons can continue services upon turning 65[1][3]` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities[3]))
- **income_limit**: Ours says `$2921` → Source says `$2,000` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities[3]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health, day habilitation, homemaker, residential habilitation, respite, supported employment, attendant care, adult residential care, chore service, companion services, consultation, environmental accessibility adaptations, home delivered meals, non-medical transportation, personal emergency response system, skilled nursing, specialized medical equipment/supplies, transition services; specific services include ADL assistance, meals (incl. special diets), housekeeping, laundry, transportation, socialization, recreation, personal finance assistance, medication assistance[5][6]` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities[3]))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities[3]`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1603` → Source says `$1,350` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[5]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments for Medicare-covered services. **SLMB:** Pays Part B premiums only. **QI:** Pays Part B premiums only; auto-qualifies for Extra Help (low copays on prescriptions, e.g., ≤$12.65 per drug in 2026)[1][2][5][7].` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[5]))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[5]`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60 or older qualifies for special elderly rules; no minimum age for other household members` ([source](healthandwelfare.idaho.gov/services-programs/food-assistance/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Food assistance benefits; amount calculated as: Maximum allotment for household size minus 30% of net income. Example: 2-person household with $1,200 gross income and $1,070 net income receives $415/month ($546 maximum - $131 [30% of net income]). General rule: $100 more in net income = $30 less in benefits` ([source](healthandwelfare.idaho.gov/services-programs/food-assistance/))
- **source_url**: Ours says `MISSING` → Source says `healthandwelfare.idaho.gov/services-programs/food-assistance/`

### Idaho Energy Assistance (LIHEAP)

- **income_limit**: Ours says `$3090` → Source says `$71,010` ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `$400–$1,800 per year for seasonal heating assistance. Crisis LIHEAP provides emergency assistance for situations like broken furnaces or utility shutoff notices. Weatherization Assistance Program (related but separate) helps improve energy efficiency through home upgrades like insulation and heating system repairs.[1][2]` ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance`

### Senior Health Insurance Benefits Advisors (SHIBA)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free and unbiased Medicare counseling and information; assistance understanding Medicare benefits, comparing health insurance options, and protecting against overpayment on medical care and prescription drugs[1][3]` ([source](https://www.shiba.idaho.gov[2]))
- **source_url**: Ours says `MISSING` → Source says `https://www.shiba.idaho.gov[2]`

### Home-Delivered Meals (Title III-C-2)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered nutritionally compliant meals (hot, cold, frozen, or shelf-stable; at least 1/3 of Dietary Reference Intakes per meal, meeting Dietary Guidelines for Americans); daily delivery (some exceptions, e.g., weekends vary); wellness checks during delivery; at least 3 shelf-stable meals twice per year for emergencies; voluntary contribution requested but not required[3][4][5][6]` ([source](https://aging.idaho.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/`

### National Family Caregiver Support Program (NFCSP)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Information and assistance gaining access to services; individual counseling; support groups or caregiver training; respite care; supplemental services[3][8]` ([source](https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/`

### Idaho Legal Aid Services

- **income_limit**: Ours says `$1984` → Source says `$1,265` ([source](https://idaholegalaid.org))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal assistance including advice, counseling, representation by attorney or paralegal; stops elder abuse/financial fraud, prevents wrongful evictions, ensures access to Medicare/Medicaid/Social Security, drafts estate-planning tools, community clinics on scams[2][4][6]. No specific dollar amounts or hours stated.` ([source](https://idaholegalaid.org))
- **source_url**: Ours says `MISSING` → Source says `https://idaholegalaid.org`

### Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://aging.idaho.gov/ombudsman-program/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Complaint investigation, mediation, and resolution; resident rights advocacy; information and education about long-term care and benefits; facility visitation and monitoring` ([source](https://aging.idaho.gov/ombudsman-program/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/ombudsman-program/`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE or https://www.cms.gov/medicare/medicaid-coordination/about/pace; check Idaho Medicaid for local providers))
  - Shape notes: No income/asset test; restricted to specific service areas with limited providers; state-specific NFLOC certification required; enrollment caps create waitlists; all services through one interdisciplinary team
- **Weatherization Assistance Program** — service ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/apply-weatherization))
  - Shape notes: Delivered via regional Community Action Agencies with varying wait times and income tables; priority-tiered with audits determining exact measures; 15-year repeat ban; tied to LIHEAP funding waivers.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://aging.idaho.gov/stay-connected/stay-connected-senior-community-service-employment-program/))
  - Shape notes: Federally mandated but state-administered via ICOA and contractor Easterseals-Goodwill; slots limited by DOL grant (equitable distribution across 27 counties); priority-based access with regional AAA coordination for host sites and supports
- **Idaho Senior Property Tax Reduction Program** — financial ([source](https://tax.idaho.gov/taxes/property/homeowners/reduction/))
  - Shape notes: Fixed statewide income threshold (adjusted annually); annual reapplication; county-administered with state oversight; benefits scale by income and home value, not household size; care facility residents may qualify via county assessor.
- **LEARN Idaho Senior Education Programs** — service ([source](https://learnidaho.org/))
  - Shape notes: Decentralized network of free senior learning via universities, LEARN Idaho, and aging resources; varies heavily by region (in-person urban, online rural); no income/asset test, age 60+/65+ residency focus[5]

## Program Details

### Idaho Medicaid Aged and Disabled Waiver


**Eligibility:**
- Age: 65+ or 18-64 if disabled; disabled persons can continue services upon turning 65[1][3]+
- Income: Must qualify for Aid to the Aged, Blind, and Disabled (AABD) Medicaid; specific 2026 dollar amounts not detailed in sources but include income limits varying by marital status and household; asset limit for single applicant is $2,000 or less in countable assets[2]
- Assets: Countable assets limited to $2,000 for single applicants; exempt assets include primary home (if applicant lives there or intends to return, with 2026 home equity limit of $752,000), household furnishings, appliances, personal effects, and one vehicle; Look-Back Rule applies (no asset transfers under fair market value in prior 60 months, or face penalty period)[1][2]
- Idaho resident
- U.S. citizen or eligible non-citizen
- Nursing Facility Level of Care (NFLOC) via Uniform Assessment Instrument (UAI) evaluating ADLs (bathing, dressing, mobility, eating, toileting) and IADLs (meal prep, laundry, housecleaning); cognitive impairments considered[1][2]
- Disability diagnosis under Social Security Act for ages 18-64[3][4]

**Benefits:** Adult day health, day habilitation, homemaker, residential habilitation, respite, supported employment, attendant care, adult residential care, chore service, companion services, consultation, environmental accessibility adaptations, home delivered meals, non-medical transportation, personal emergency response system, skilled nursing, specialized medical equipment/supplies, transition services; specific services include ADL assistance, meals (incl. special diets), housekeeping, laundry, transportation, socialization, recreation, personal finance assistance, medication assistance[5][6]
- Varies by: priority_tier

**How to apply:**
- Online or phone via Idaho Department of Health and Welfare (specific URL: https://healthandwelfare.idaho.gov/services-programs/medicaid-health/apply-medicaid-elderly-or-disabled-adults; phone not specified in results, contact general Medicaid line)[4]
- Assessment for Level of Care follows financial eligibility determination[3][4]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may exist due to waiver nature but no details provided[null]

**Watch out for:**
- Must meet NFLOC; not just age/disability—requires functional limitations assessment[1][2]
- 60-month Look-Back Rule for asset transfers leads to ineligibility penalties[1]
- Home equity limit $752,000 in 2026; exemptions only if spouse/child conditions met[1]
- Separate from Personal Care Services Program or other waivers like Adult DD Waiver[1][5]
- Financial eligibility ties to AABD Medicaid, which has varying income rules by marital status[2]

**Data shape:** Requires NFLOC assessment; benefits are home/community-based services list with no fixed dollar/hour caps specified; eligibility layers financial (AABD) + functional (UAI); home equity capped at $752,000[1][2][5][6]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities[3]

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No financial or income limits; eligibility is not based on income or assets[1][2][4]
- Assets: No asset limits; no financial criteria considered[2][4]
- Reside in a PACE-specific service area in Idaho
- Certified by Idaho as needing nursing home level of care (Nursing Facility Level of Care or NFLOC)
- Able to live safely in the community with PACE services
- Not enrolled in Medicare Advantage, Medicare prepayment plan, certain Medicare drug plans, hospice, or conflicting Medicaid waivers[3][4][7]

**Benefits:** Comprehensive medical and social services including primary care, hospital and emergency care, prescription drugs, social services, restorative therapies, home care, day center care, transportation, personal care, and all Medicare/Medicaid-covered services coordinated by an interdisciplinary team; no deductibles or copays for dually eligible participants; private pay option with monthly premium for non-Medicaid[1][2][7]
- Varies by: region

**How to apply:**
- Contact local Idaho PACE provider directly for assessment (no statewide phone or URL specified in results; search for Idaho PACE organizations)
- In-person assessment by PACE staff to evaluate nursing home level need and develop care plan[3]

**Timeline:** Not specified; depends on local program
**Waitlist:** Possible due to limited spaces; varies by location[3][6]

**Watch out for:**
- Not available everywhere in Idaho—must live in a specific PACE service area; limited programs may mean no access[1][2]
- Once enrolled, PACE becomes sole provider for all Medicare/Medicaid services; cannot use other plans like Medicare Advantage, hospice, or certain waivers[3][4]
- Requires nursing home level care certification by Idaho, but must be safe in community with PACE support[7]
- Possible waitlists due to capped enrollment[6]
- Non-Medicaid participants pay monthly premium[1][2]

**Data shape:** No income/asset test; restricted to specific service areas with limited providers; state-specific NFLOC certification required; enrollment caps create waitlists; all services through one interdisciplinary team

**Source:** https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE or https://www.cms.gov/medicare/medicaid-coordination/about/pace; check Idaho Medicaid for local providers

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits vary by program and household size (single or married couple). For 2026 (most recent available): QMB - Single: $1,350; Couple: $1,824. SLMB - Single: up to ~$1,620 (120% FPL); Couple: ~$2,189. QI - Single: up to ~$1,823 (135% FPL); Couple: ~$2,462. Idaho follows federal standards with asset limits applied. Older Idaho-specific figures (likely 2023): QMB Single: $1,235/Couple: $1,663; SLMB Single: $1,478/Couple: $1,992; QI Single: $1,660/Couple: $2,239[2][5][7][8].
- Assets: Federal limits apply in Idaho: Single: $9,090-$9,950; Married couple: $13,630-$14,910. Counts liquid assets like bank accounts; exempts primary home, one car, household goods, life insurance, burial plots[2][7].
- Must be eligible for Medicare Part A (even if not enrolled)
- Must have Medicare Part B (for SLMB/QI)
- U.S. citizen or qualified immigrant
- Reside in Idaho

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments for Medicare-covered services. **SLMB:** Pays Part B premiums only. **QI:** Pays Part B premiums only; auto-qualifies for Extra Help (low copays on prescriptions, e.g., ≤$12.65 per drug in 2026)[1][2][5][7].
- Varies by: program_tier

**How to apply:**
- Online: healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[5]
- Phone: Contact Idaho Medicaid at 1-877-456-1233 or local office (call 2-1-1 for regional numbers)
- Mail/In-person: Local Idaho Department of Health and Welfare office (find via healthandwelfare.idaho.gov/locations)
- Request application from state Medicaid agency

**Timeline:** QMB: Up to 45 days (effective first of month after approval). SLMB/QI: Up to 45 days, retroactive up to 3 months[1].
**Waitlist:** QI has first-come, first-served with priority to prior-year recipients; limited federal funding may create waitlist[1][7].

**Watch out for:**
- Income/asset limits updated annually (January FPL, effective April); verify current year as 2026 figures may differ from listed[1][2][7]
- QI requires annual reapplication; first-come-first-served with waitlist risk due to capped funding[1][7]
- Must have/apply for Part B; QMB protects from provider balance billing (providers can't charge you)[1]
- States can't be less generous than federal but Idaho applies asset test (unlike some states)[1][2]
- Auto-enrollment in Extra Help for QI/SLMB but confirm[7]

**Data shape:** Tiered by program (QMB/SLMB/QI) with escalating income thresholds (100%/120%/135% FPL); household size limited to single/couple tables; asset test applied; QI funding capped statewide

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[5]

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60 or older qualifies for special elderly rules; no minimum age for other household members+
- Income: {"description":"Idaho has expanded eligibility beyond federal standards. For households with members 60+ or disabled, there is NO gross income limit. For other households, standard federal limits apply (Oct. 1, 2025 - Sept. 30, 2026):","standard_households":{"1_person":"$1,255/month","2_people":"$1,704/month","3_people":"$2,152/month","4_people":"$2,600/month","5_people":"$3,049/month","each_additional":"+$449/month"},"elderly_or_disabled_households":{"gross_income_limit":"No limit","net_income_limit":"Must meet net income test if gross income exceeds 130% of federal poverty level","note":"Net income = gross income minus allowable deductions"},"2025_senior_specific_limits":{"1_person":"$15,060/year","2_people":"$20,440/year"}}
- Assets: {"general_limit":"$5,000 for most households","exemptions":"Home ownership does not count against asset limit; retirement savings and Social Security benefits do not count as assets"}
- Must be a U.S. citizen or legal immigrant
- Must be an Idaho resident
- Household must buy and prepare food together
- Work requirements apply to able-bodied adults 16-59 (with exceptions for elderly and disabled households)
- Adults 55-64 without dependents must work or participate in SNAP job training 80 hours/month under new rules
- Able-bodied adults without dependents (ABAWD) ages 18-50 must work 80 hours/month or participate in work program to receive benefits beyond 3 months in 3 years

**Benefits:** Food assistance benefits; amount calculated as: Maximum allotment for household size minus 30% of net income. Example: 2-person household with $1,200 gross income and $1,070 net income receives $415/month ($546 maximum - $131 [30% of net income]). General rule: $100 more in net income = $30 less in benefits
- Varies by: household_size and net_income

**How to apply:**
- Online: Idaho Department of Health and Welfare website (healthandwelfare.idaho.gov)
- Phone: Contact Idaho DHW for application assistance
- Mail: Submit completed application to Idaho DHW
- In-person: Visit local Idaho DHW office
- Phone interview option available for seniors 60+ (can be done over phone)
- Authorized representative can apply on behalf of senior

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- 64% of Idaho seniors eligible for SNAP are not receiving it — significant underutilization[7]
- Idaho has expanded eligibility beyond federal standards; elderly/disabled households have NO gross income limit, making them eligible even with higher incomes than standard households[1]
- Net income (after deductions) is what determines benefits, not gross income — seniors can deduct medical expenses over $35/month and excess shelter costs[3]
- Households consisting entirely of elderly members are exempt from work requirements[3]
- Social Security, veterans benefits, and disability payments all count toward income limits[2]
- Seniors in federally subsidized elderly housing may still qualify for SNAP even if meals are provided there[3]
- New work requirements for adults 55-64 without dependents (80 hours/month) took effect under the One Big Beautiful Bill Act of 2025[6]
- ABAWD rules (18-50, able-bodied, no dependents) require 80 hours/month work or training to receive benefits beyond 3 months in 3 years[4]
- Households where all members are 60+ or disabled receive 24-month certification (longer than standard)[4]
- Idaho Hunger Relief Task Force offers direct enrollment support specifically for seniors — contact them rather than applying alone

**Data shape:** Idaho's SNAP program has a bifurcated eligibility structure: elderly/disabled households (60+ or disabled) have NO gross income limit and are exempt from work requirements, while standard households must meet strict income limits and work requirements. Benefits scale by household size and net income (not gross). The program is statewide with no regional variations in eligibility or benefits, but the Idaho Hunger Relief Task Force provides specialized enrollment support for seniors. Processing time and waitlist information are not publicly available in current sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** healthandwelfare.idaho.gov/services-programs/food-assistance/

---

### Idaho Energy Assistance (LIHEAP)


**Eligibility:**
- Income: 150% of Federal Poverty Level (FPL). For 2026: Household of 7: $71,010 annual / $5,918 monthly; Household of 8: $79,080 annual / $6,590 monthly. Income limits scale by household size based on HHS poverty guidelines. Gross monthly income (before taxes) is used for determination.[1][2]
- Assets: Not specified in available sources.
- U.S. citizen, permanent resident, or qualified non-citizen; at least one household member must be a U.S. citizen or lawful permanent resident[1][7]
- Live in Idaho[7]
- Families with children under age 6, elderly members, or disabled members can apply starting October; all other families can apply starting November[4]
- Roommates covered by the same utility bill are counted as part of the same LIHEAP household[2]

**Benefits:** $400–$1,800 per year for seasonal heating assistance. Crisis LIHEAP provides emergency assistance for situations like broken furnaces or utility shutoff notices. Weatherization Assistance Program (related but separate) helps improve energy efficiency through home upgrades like insulation and heating system repairs.[1][2]
- Varies by: household_size, fuel_type, heating_area, calculated_energy_burden, and location within Idaho[3][4]

**How to apply:**
- Online through U.S. Department of Health & Human Services (specific URL not provided in sources)[1]
- Contact your local Idaho Community Action Agency office (serves every county)[4]
- Mail or email completed application to local office (online portal currently unavailable as of September 2025)[5]

**Timeline:** 7–30 days[1]
**Waitlist:** No formal waitlist described, but funding is limited and available on first-come, first-serve basis. Applicants should apply as early as possible each season.[1][4]

**Watch out for:**
- Heating assistance is only available seasonally (typically November 1 – March 31 for regular heating assistance; October start for families with children under 6, elderly, or disabled members)[2][4][5]
- Cooling assistance from LIHEAP is NOT offered in Idaho[2]
- Crisis assistance is available only in emergencies (broken furnace, utility shutoff notice, running out of fuel) — not for routine heating costs[2]
- Funding is limited and some local agencies may stop accepting applications early if funds run out; apply as soon as the season opens[1][2]
- Roommates living at the same address and covered by the same utility bill are counted as household members for income limit purposes, even if they don't share most expenses[2]
- The online application portal was unavailable as of September 2025; applicants may need to mail or email applications[5]
- Benefit amount is not a fixed dollar amount but calculated based on multiple factors (income, household size, fuel type, heating area, energy burden, location) — families cannot predict exact benefit before application[3][4]
- Processing takes 7–30 days; families should plan ahead before heating season begins[1]

**Data shape:** LIHEAP in Idaho is a seasonal program with income-based eligibility (150% FPL) and benefits that vary significantly by household composition, location, and energy burden rather than fixed tiers. The program has three distinct components (seasonal heating, crisis assistance, and weatherization), but cooling assistance is not available. Eligibility begins at different times depending on household composition (October for vulnerable populations, November for others). Community Action Agencies administer the program across all Idaho counties, but specific regional contact information and office locations are not detailed in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 200% of federal poverty guidelines (DOE standard); one regional example (Eastern Idaho) shows: Family of 1: $31,300 annual/$2,608 monthly/$7,825 3-month; Family of 2: $42,300 annual/$3,525 monthly/$10,575 3-month. Exact limits vary by program funding and region—contact local agency for current table.[1][5]
- Assets: No asset limits mentioned in sources.
- Live in Idaho
- One household member must be US citizen or lawful permanent resident
- Proof of identity
- Proof of utility expense
- Proof of homeownership or written landlord permission for rentals
- Home not weatherized in past 15 years
- Home must pass energy audit showing cost savings; health/safety risks considered

**Benefits:** Energy efficiency upgrades including insulation, caulking, weather-stripping, air filtration/quality repairs, heating system checks, broken windows; certified crews install based on professional energy audit and federal guidelines for cost-effectiveness.
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (statewide providers)
- Examples: CAP4Action (cap4action.org), SEICAA (seicaa.org, Southeastern Idaho), EICAP (eicap.org, Eastern Idaho)

**Timeline:** Varies; energy audit after waitlist priority.
**Waitlist:** Yes, first-come first-served; up to 3 years in some areas (e.g., Eastern Idaho); prioritized by children/elderly/disabled, heating emergencies, high energy costs.[3][5]

**Watch out for:**
- Funding limited, year-round first-come first-served with long waitlists (up to 3 years)
- Homes weatherized in past 15 years ineligible
- Renters need landlord written permission
- Must prove work saves money via audit; not all repairs done
- Priority for elderly/disabled but no strict age requirement—competing with children/emergencies
- Income limits vary by program; re-verify if changed
- Separate from utility-specific programs (e.g., Idaho Falls Power rebates/loans)

**Data shape:** Delivered via regional Community Action Agencies with varying wait times and income tables; priority-tiered with audits determining exact measures; 15-year repeat ban; tied to LIHEAP funding waivers.

**Source:** https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/apply-weatherization

---

### Senior Health Insurance Benefits Advisors (SHIBA)


**Eligibility:**
- Income: Not specified in available sources
- Assets: Not specified in available sources
- Seniors and disabled citizens (specific age threshold not defined in search results)
- Residents of Idaho

**Benefits:** Free and unbiased Medicare counseling and information; assistance understanding Medicare benefits, comparing health insurance options, and protecting against overpayment on medical care and prescription drugs[1][3]

**How to apply:**
- Phone: 1-800-247-4422 (Toll Free)[2]
- Online form: Available at https://www.shiba.idaho.gov[2][4]
- Email: Shannon.Hohl@doi.idaho.gov[2]
- In-person: Idaho Department of Insurance, 700 West State St., 3rd Floor, Boise ID 83720[2][3]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- This is NOT an insurance sales program — SHIBA does not sell insurance, recommend policies, agents, or specific companies[3]
- This is a counseling and information service, not a financial assistance program — it helps people understand Medicare but does not provide direct financial benefits or subsidies
- Eligibility criteria (age, income, asset limits) are not clearly defined in publicly available sources — families must contact the program directly to confirm eligibility
- Processing time and waitlist status are not documented — response times may vary by county and counselor availability
- The program relies on trained volunteers in addition to staff, which may affect availability and response times by region

**Data shape:** SHIBA is a counseling and advocacy service rather than a financial assistance program. It provides free, unbiased information and one-on-one guidance to help seniors navigate Medicare options. Unlike many senior programs, there are no documented income or asset limits, and eligibility appears to be based primarily on age/disability status and Idaho residency. The program is delivered through a statewide network of certified counselors in every county, suggesting availability varies by location. Critical gaps: specific eligibility thresholds, processing timelines, required documentation, and regional wait times are not publicly specified and require direct contact with the program.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.shiba.idaho.gov[2]

---

### Home-Delivered Meals (Title III-C-2)


**Eligibility:**
- Age: 60+
- Income: No means test or specific income limits; priority given to those with greatest social/economic need, low-income at or below poverty, but not required[1][2][5][7]
- Assets: No asset limits or tests mentioned[1][5][7]
- 60 years or older and their spouses (regardless of spouse age)
- Disabled person under 60 living in the home of a person 60+
- Frail, homebound, disabled, isolated, or unable to prepare meals or participate in congregate meals due to frailty
- Lives in the service area of the local Area Agency on Aging (AAA)
- Additional at-risk factors may be prioritized at AAA discretion (e.g., severe disabilities, risk of institutionalization, rural areas)[1][2][3][5][6]

**Benefits:** Home-delivered nutritionally compliant meals (hot, cold, frozen, or shelf-stable; at least 1/3 of Dietary Reference Intakes per meal, meeting Dietary Guidelines for Americans); daily delivery (some exceptions, e.g., weekends vary); wellness checks during delivery; at least 3 shelf-stable meals twice per year for emergencies; voluntary contribution requested but not required[3][4][5][6]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or in-person; e.g., Southwest Idaho AAA for their region
- In-home or phone assessment by AAA, case coordinator, or nutrition provider to determine eligibility[1][3]
- No specific statewide online URL or form identified; apply through regional AAA

**Timeline:** Not specified in sources
**Waitlist:** Possible due to prioritization and funding; varies by AAA and demand[1]

**Watch out for:**
- No strict homebound requirement—frail or unable to prepare meals qualifies, even if not fully homebound[6]
- No means test, but priority to greatest need (low-income, minorities, 75+, living alone, rural); may face waitlists[2][4][6]
- Spouses and co-resident disabled under 60 eligible; caregivers 55+ may get priority under Title III-E tracking[1][2]
- Meals not guaranteed daily/weekends; varies by provider[6]
- Voluntary contributions encouraged but cannot be required[3][5]

**Data shape:** No income/asset test; eligibility via functional assessment by regional AAA; priority-based access with variations by local AAA service area and funding

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/

---

### National Family Caregiver Support Program (NFCSP)


**Eligibility:**
- Age: 60+
- Income: No income limits for core benefits; prioritizes caregivers of older individuals with greatest social need and greatest economic need, but services available without strict cutoffs[3][5]
- Assets: No asset limits mentioned[5]
- Family caregiver 18+ caring for person 60+ or with Alzheimer’s/dementia of any age[3]
- Parent or relative caregiver 55+ living with and primary caregiver for adult 18+ with disabilities[3]
- Older relative caregiver (not parent) 55+ living with and primary caregiver for child 18 or younger[3]
- Unpaid family member or close friend providing assistance to person 60+ or with disabilities[5]

**Benefits:** Information and assistance gaining access to services; individual counseling; support groups or caregiver training; respite care; supplemental services[3][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging via 211[5]
- Contact Idaho Commission on Aging or local AAA through aging.idaho.gov[5][8]

**Timeline:** Not specified in available data

**Watch out for:**
- Does not provide direct payments to family caregivers; focuses on support services like respite and training, not compensation[2][4]
- Prioritizes those with greatest social/economic need, but no strict income test—availability may depend on funding and local AAA capacity[3]
- Not a Medicaid payment program; for paid care, pursue separate Certified Family Home or agency employment options[2][4]
- Regional delivery differences may affect in-person vs. telehealth access[5]

**Data shape:** No income/asset tests; services via local AAAs with regional variations in delivery (e.g., mobile units in rural areas); prioritizes by need tier without fixed hours/dollars; no direct pay

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in Idaho-specific sources; families must check current federal poverty guidelines via USDOL or local provider for precise figures (e.g., for 2025, typically around $19,000 for 1 person, $25,000 for 2, scaling up).[2][4]
- Unemployed
- Priority given to veterans and qualified spouses, individuals over 65, those with a disability, low literacy skills or limited English proficiency, rural residents, homeless or at risk of homelessness, low employment prospects, or those who failed to find employment after American Job Center services[2]

**Benefits:** Paid community service work experience at non-profit and public facilities (e.g., schools, hospitals, senior centers); average 20 hours per week at the highest of federal, state, or local minimum wage; assignments last 6-12 months; job placement assistance including resume updates, interview practice, job search help, and skill training (e.g., computer, literacy, English); bridge to unsubsidized private employment[2][4][6]
- Varies by: priority_tier

**How to apply:**
- Contact Easterseals-Goodwill Northern Rocky Mountain (SCSEP provider in Idaho): visit https://www.esgw.org/scsep/ or https://www.easterseals.com/get-support/areas-of-support/senior-community-service-employment-program-scsep/[3][4]
- Idaho Commission on Aging (ICOA) oversees statewide: https://aging.idaho.gov/stay-connected/stay-connected-senior-community-service-employment-program/[7]
- Local Area Agency on Aging (AAA) in ICOA's six planning areas for referrals and outreach[1]

**Waitlist:** Likely due to limited slots funded by federal grants (e.g., subaward for Idaho slots); varies by region and demand[1][4]

**Watch out for:**
- Temporary/part-time (20 hours/week, 6-12 months max); not permanent employment or full-time wage replacement—it's a bridge to private unsubsidized jobs[2][4]
- Strict 125% poverty limit; income calculated for entire family household[2]
- Priority tiers mean non-priority applicants may face long waits or denial due to limited federal slots[2][1]
- Must be unemployed and actively seeking unsubsidized work; not for retirees wanting supplemental income without job search[4]
- Work at host agencies only (non-profits/government), not private employers during program[2]

**Data shape:** Federally mandated but state-administered via ICOA and contractor Easterseals-Goodwill; slots limited by DOL grant (equitable distribution across 27 counties); priority-based access with regional AAA coordination for host sites and supports

**Source:** https://aging.idaho.gov/stay-connected/stay-connected-senior-community-service-employment-program/

---

### Idaho Legal Aid Services


**Eligibility:**
- Age: 60+
- Income: Income must be below 125% of the 2024 Federal Poverty Guidelines (exact dollar amounts not specified in sources; older 2015 figures from guidebook: $1,265 for single person, $1,705 for couple). Limits vary by household size per federal guidelines[1][9].
- Assets: Resources or assets below $5,000 (2015 figure; what counts and exemptions not detailed)[1].
- Low-income status
- Idaho resident
- U.S. citizen
- Civil legal issues only (e.g., elder abuse, evictions, benefits access)
- Priority for income, health care, housing, abuse/neglect cases[4][6]

**Benefits:** Free civil legal assistance including advice, counseling, representation by attorney or paralegal; stops elder abuse/financial fraud, prevents wrongful evictions, ensures access to Medicare/Medicaid/Social Security, drafts estate-planning tools, community clinics on scams[2][4][6]. No specific dollar amounts or hours stated.
- Varies by: priority_tier

**How to apply:**
- Phone: Idaho Senior Legal Hotline 866-345-0106[4]
- Website: https://idaholegalaid.org (apply online via legal help section)[6]
- In-person: Local offices statewide[7][8]
- Contact local Area Agency on Aging offices[7]

**Timeline:** Not specified in sources

**Watch out for:**
- Outdated income/asset figures in guidebook (2015); current is 125% FPL 2024[1][9]
- Civil cases only; no criminal[3][6]
- Must meet exact eligibility screening; alternatives like pro bono if ineligible[3]
- Priority for urgent issues like abuse, housing[4]

**Data shape:** Income at 125% federal poverty guidelines (varies by household size); age 60+ priority for seniors; statewide with regional offices and partnerships; no fixed hours/dollars, service-based by priority

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://idaholegalaid.org

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Must be a resident of a long-term care facility (nursing home, assisted living, skilled nursing, or rehabilitation facility)
- Program also serves families, friends, concerned facility staff, and any person or group concerned about resident treatment

**Benefits:** Complaint investigation, mediation, and resolution; resident rights advocacy; information and education about long-term care and benefits; facility visitation and monitoring

**How to apply:**
- Phone: Contact local Area Agency on Aging during regular business hours (specific numbers vary by region)
- Phone: 1-208-736-2122 or 1-800-574-8656 (CSI Office on Aging Ombudsman Program example)
- In-person: Visit local Area Agency on Aging office
- Contact: State Ombudsman at Idaho Commission on Aging or Local Ombudsman at Area Agency on Aging

**Timeline:** Not specified in available documentation

**Watch out for:**
- This is an ADVOCACY program, not a direct service or financial assistance program — it investigates complaints and advocates for resident rights rather than providing healthcare or financial benefits
- Online reporting is ONLY available to financial institutions and state-mandated reporters; all other people must call the local Area Agency on Aging during regular business hours
- The program protects residents 60 years or older specifically, though it serves families and concerned parties of any age
- Program is authorized by federal Older Americans Act (Titles III and VII) and Idaho Code 67-5009, meaning scope and services are defined by federal and state law
- Ombudsmen have access rights to facilities and resident records to investigate complaints — this is a legal protection that enables their advocacy work
- Idaho's program includes home care advocacy in addition to facility-based advocacy (unlike some states), but this is limited to long-term care issues and services provided by Idaho Commission on Aging

**Data shape:** This is a statewide advocacy program with no income or asset limits and no application process in the traditional sense — families contact their local Area Agency on Aging to request ombudsman services. The program is structured regionally through AAAs rather than as a centralized service. Benefits are uniform (advocacy and complaint investigation) rather than tiered or scaled. No processing time or waitlist information is publicly documented, suggesting services are available upon request.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/ombudsman-program/

---

### Idaho Senior Property Tax Reduction Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For 2026 benefits (based on 2025 income after deducting unreimbursed medical expenses, business/farm losses, capital gains): $39,130 or less. Fixed limit; does not vary by household size. Some counties list slightly lower prior-year figures (e.g., $37,810), but state sets the threshold.[3][8]
- Assets: No asset limits mentioned in program requirements.[1][2][3]
- Idaho resident owning and living in a home or mobile home as primary residence before April 15, 2026 (must have current Homeowner's Exemption).
- Eligible category as of January 1, 2026: age 65+, blind, widow(er) of any age, fatherless/motherless child under 18, former POW/hostage, veteran with 10%+ service-connected disability or VA pension for non-service-connected disability, disabled (recognized by SSA, Railroad Retirement Board, Federal Civil Service, VA, or public employee retirement system).
- May qualify if living in care facility/nursing home in 2025 or 2026 (contact county assessor).[1][2][3]

**Benefits:** Reduction in property taxes on primary home/mobile home (exact amount based on income, home value, and tax liability; appears on December 2026 tax bill if approved). Does not reduce solid waste, irrigation, or other non-property tax fees. Home value must not exceed annual limit calculated in June.[3][5][8]
- Varies by: income|home_value

**How to apply:**
- Online: tax.idaho.gov/ptr or tax.idaho.gov/reduction[3][7][8]
- Mail or in-person: County assessor's office (locations vary by county, e.g., Ada County: 190 E Front Street, Suite 107, Boise; contact specific county assessor).[2][4][5]
- Phone/help: Contact your county assessor (no statewide number; e.g., Kootenai: kcassr@kcgov.us)[4]

**Timeline:** Benefit appears on December 2026 property tax bill if approved by April 15, 2026.[3]

**Watch out for:**
- Must reapply and requalify every year (no automatic renewal).[2][3][4]
- Income based on prior full year (2025 for 2026) after specific deductions only (medical unreimbursed, business/farm losses, capital gains).[1][3]
- Deadline is April 15, 2026; file even if income info incomplete.[3][8]
- Home value limit calculated annually in June; exceeds limit disqualifies.[5][7]
- Separate from 100% service-connected disabled veterans program (no income test, up to $1,500 reduction).[6]
- Does not cover non-property tax fees.[5]

**Data shape:** Fixed statewide income threshold (adjusted annually); annual reapplication; county-administered with state oversight; benefits scale by income and home value, not household size; care facility residents may qualify via county assessor.

**Source:** https://tax.idaho.gov/taxes/property/homeowners/reduction/

---

### LEARN Idaho Senior Education Programs

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to seniors 60+ for free education per state aging commission and university policies, with no financial tests mentioned[5][3]
- Assets: No asset limits or tests apply[5]
- Idaho resident for certain programs like Boise State senior audits (age 65+)[3][5]
- No formal application for most free access; space-available registration[3][5]

**Benefits:** Free auditing of university classes (Boise State: no charge for Idaho residents 65+, credit classes full price); TechEd classes on elder care and digital literacy; online handouts and in-person technology training; community educational programs on retirement, aging, caregiving[2][3][5]
- Varies by: region

**How to apply:**
- Online: learnidaho.org/teched for TechEd classes[5]
- University admission as nondegree student then register (Boise State)[3]
- In-person: local providers like LEARN Idaho meetings and classes[2][5]
- Phone/website: aging.idaho.gov for resources[5]

**Timeline:** Immediate for online/resources; space permits during open enrollment for university audits[3]
**Waitlist:** Space-available basis, potential wait for in-person classes[3][5]

**Watch out for:**
- Not a single formal 'program' with income/assets test—decentralized free education opportunities; audits are non-credit only for free (credit full price)[3][5]
- Membership for professionals, not seniors (for access to content)[2]
- Rural areas limited to online; in-person urban-focused[5]
- Space-available, not guaranteed enrollment[3]

**Data shape:** Decentralized network of free senior learning via universities, LEARN Idaho, and aging resources; varies heavily by region (in-person urban, online rural); no income/asset test, age 60+/65+ residency focus[5]

**Source:** https://learnidaho.org/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Idaho Medicaid Aged and Disabled Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | medium |
| Idaho Energy Assistance (LIHEAP) | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Senior Health Insurance Benefits Advisor | resource | state | simple |
| Home-Delivered Meals (Title III-C-2) | benefit | state | deep |
| National Family Caregiver Support Progra | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Idaho Legal Aid Services | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Idaho Senior Property Tax Reduction Prog | benefit | state | deep |
| LEARN Idaho Senior Education Programs | resource | state | simple |

**Types:** {"benefit":9,"resource":4,"employment":1}
**Scopes:** {"state":7,"local":1,"federal":6}
**Complexity:** {"deep":9,"medium":1,"simple":4}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/ID/drafts.json`.

- **Idaho Medicaid Aged and Disabled Waiver** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **region**: 2 programs
- **program_tier**: 1 programs
- **household_size and net_income**: 1 programs
- **household_size, fuel_type, heating_area, calculated_energy_burden, and location within Idaho[3][4]**: 1 programs
- **not_applicable**: 2 programs
- **income|home_value**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Idaho Medicaid Aged and Disabled Waiver**: Requires NFLOC assessment; benefits are home/community-based services list with no fixed dollar/hour caps specified; eligibility layers financial (AABD) + functional (UAI); home equity capped at $752,000[1][2][5][6]
- **Program of All-Inclusive Care for the Elderly (PACE)**: No income/asset test; restricted to specific service areas with limited providers; state-specific NFLOC certification required; enrollment caps create waitlists; all services through one interdisciplinary team
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with escalating income thresholds (100%/120%/135% FPL); household size limited to single/couple tables; asset test applied; QI funding capped statewide
- **Supplemental Nutrition Assistance Program (SNAP)**: Idaho's SNAP program has a bifurcated eligibility structure: elderly/disabled households (60+ or disabled) have NO gross income limit and are exempt from work requirements, while standard households must meet strict income limits and work requirements. Benefits scale by household size and net income (not gross). The program is statewide with no regional variations in eligibility or benefits, but the Idaho Hunger Relief Task Force provides specialized enrollment support for seniors. Processing time and waitlist information are not publicly available in current sources.
- **Idaho Energy Assistance (LIHEAP)**: LIHEAP in Idaho is a seasonal program with income-based eligibility (150% FPL) and benefits that vary significantly by household composition, location, and energy burden rather than fixed tiers. The program has three distinct components (seasonal heating, crisis assistance, and weatherization), but cooling assistance is not available. Eligibility begins at different times depending on household composition (October for vulnerable populations, November for others). Community Action Agencies administer the program across all Idaho counties, but specific regional contact information and office locations are not detailed in available sources.
- **Weatherization Assistance Program**: Delivered via regional Community Action Agencies with varying wait times and income tables; priority-tiered with audits determining exact measures; 15-year repeat ban; tied to LIHEAP funding waivers.
- **Senior Health Insurance Benefits Advisors (SHIBA)**: SHIBA is a counseling and advocacy service rather than a financial assistance program. It provides free, unbiased information and one-on-one guidance to help seniors navigate Medicare options. Unlike many senior programs, there are no documented income or asset limits, and eligibility appears to be based primarily on age/disability status and Idaho residency. The program is delivered through a statewide network of certified counselors in every county, suggesting availability varies by location. Critical gaps: specific eligibility thresholds, processing timelines, required documentation, and regional wait times are not publicly specified and require direct contact with the program.
- **Home-Delivered Meals (Title III-C-2)**: No income/asset test; eligibility via functional assessment by regional AAA; priority-based access with variations by local AAA service area and funding
- **National Family Caregiver Support Program (NFCSP)**: No income/asset tests; services via local AAAs with regional variations in delivery (e.g., mobile units in rural areas); prioritizes by need tier without fixed hours/dollars; no direct pay
- **Senior Community Service Employment Program (SCSEP)**: Federally mandated but state-administered via ICOA and contractor Easterseals-Goodwill; slots limited by DOL grant (equitable distribution across 27 counties); priority-based access with regional AAA coordination for host sites and supports
- **Idaho Legal Aid Services**: Income at 125% federal poverty guidelines (varies by household size); age 60+ priority for seniors; statewide with regional offices and partnerships; no fixed hours/dollars, service-based by priority
- **Long-Term Care Ombudsman Program**: This is a statewide advocacy program with no income or asset limits and no application process in the traditional sense — families contact their local Area Agency on Aging to request ombudsman services. The program is structured regionally through AAAs rather than as a centralized service. Benefits are uniform (advocacy and complaint investigation) rather than tiered or scaled. No processing time or waitlist information is publicly documented, suggesting services are available upon request.
- **Idaho Senior Property Tax Reduction Program**: Fixed statewide income threshold (adjusted annually); annual reapplication; county-administered with state oversight; benefits scale by income and home value, not household size; care facility residents may qualify via county assessor.
- **LEARN Idaho Senior Education Programs**: Decentralized network of free senior learning via universities, LEARN Idaho, and aging resources; varies heavily by region (in-person urban, online rural); no income/asset test, age 60+/65+ residency focus[5]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Idaho?
