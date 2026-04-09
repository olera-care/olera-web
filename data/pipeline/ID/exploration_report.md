# Idaho Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 7.9m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 13 |
| New (not in our data) | 5 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Idaho Aged and Disabled Waiver

- **min_age**: Ours says `65` → Source says `65+ or 18-64 if disabled (disabled persons can continue services after turning 65)` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities))
- **income_limit**: Ours says `$2921` → Source says `$2,000` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health (4+ hours/day: medication assistance, ADL help, meals, housekeeping, laundry, transport, socialization, recreation, personal finances); homemaker; respite; supported employment; attendant care; adult residential care; chore service; companion; consultation; environmental accessibility adaptations; home delivered meals; non-medical transport; personal emergency response system; skilled nursing; specialized medical equipment/supplies; transition services (security deposits, etc. from institutions); personal assistance (grooming, bathing, eating, meds, supervision, household tasks). No fixed dollar/hour amounts specified; individualized service plan.` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities`

### Medicare Savings Programs (Qualified Medicare Beneficiary - QMB, Specified Low-Income Medicare Beneficiary - SLMB, Qualifying Individual - QI)

- **income_limit**: Ours says `$1603` → Source says `$1,275` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[2]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, all Part A/B deductibles/coinsurance/copayments (providers cannot bill QMB enrollees for covered services, including Medicare Advantage cost-sharing). Auto-qualifies for Extra Help (Part D low copays, e.g., ≤$12.65/drug in 2026)[1][2][5].

**SLMB:** Pays Medicare Part B premiums only. Auto-Extra Help[1][2][4][5].

**QI:** Pays Medicare Part B premiums only. Auto-Extra Help. No cost-sharing relief beyond premiums[1][4][5].` ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[2]))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[2]`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://healthandwelfare.idaho.gov/services-programs/food-assistance))
- **income_limit**: Ours says `$1984` → Source says `$35` ([source](https://healthandwelfare.idaho.gov/services-programs/food-assistance))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (amount based on net income: ~$100 more net income = $30 less benefits; max allotment e.g., $546 for 2-person elderly household before adjustments)[1][5]. Can buy Meals on Wheels[4]. Certified up to 24 months if all 60+/disabled[4].` ([source](https://healthandwelfare.idaho.gov/services-programs/food-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/food-assistance`

### Idaho Energy Assistance (LIHEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `$400–$1,800 per year ($200–$600 per season)[1]. Benefit amount is determined using factors including household income, geographic location within Idaho, household composition, and heating costs[4]. Crisis LIHEAP provides emergency assistance for situations such as broken furnaces or utility shutoff notices[2].` ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance`

### Senior Health Insurance Benefits Advisors (SHIBA)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one health insurance counseling, information on Medicare Parts A/B/D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, and other programs; printed materials and referrals; in-person, phone, or email sessions[1][2][4]` ([source](https://doi.idaho.gov/shiba/[2][4]))
- **source_url**: Ours says `MISSING` → Source says `https://doi.idaho.gov/shiba/[2][4]`

### Home-Delivered Meals (Title III-C-2)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered nutritionally balanced meals (hot, cold, frozen, or shelf-stable) meeting Dietary Guidelines for Americans and 1/3 of Dietary Reference Intakes; up to one meal per day typically (lunch Monday-Friday common, but varies); wellness checks during delivery; at least 3 shelf-stable meals twice per year for emergencies[3][4][6][9]` ([source](https://aging.idaho.gov/ (Idaho Commission on Aging)))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/ (Idaho Commission on Aging)`

### National Family Caregiver Support Program (NFCSP, Title III-E)

- **min_age**: Ours says `60` → Source says `Care recipient 60+ or with Alzheimer's/dementia (any age); caregiver 18+ for 60+ care recipient, or 55+ for relative caregivers of disabled adult 18+ or child 18-` ([source](https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Information and assistance; individual counseling, support groups, or caregiver training; respite care; supplemental services at caregiver direction` ([source](https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/`

### Long-Term Care Ombudsman Program (Title III-B & VII)

- **min_age**: Ours says `65` → Source says `60` ([source](https://aging.idaho.gov/ombudsman-program/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigate and resolve complaints about health, safety, welfare, and rights; advocate for residents; conduct routine facility visits (minimum quarterly); attend resident council meetings; provide information, education, referrals on long-term care and benefits; mediate issues like resident care, rehabilitation, restraints; participate in licensure surveys; maintain confidentiality.` ([source](https://aging.idaho.gov/ombudsman-program/))
- **source_url**: Ours says `MISSING` → Source says `https://aging.idaho.gov/ombudsman-program/`

## New Programs (Not in Our Data)

- **Idaho Medicaid Aged, Blind, and Disabled (ABD) Program** — service ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/about-aabd-cash-assistance))
  - Shape notes: Cash assistance amount scales by living arrangements, income, resources; pairs with Medicaid eligibility; requires SSI for cash but functional NFLOC assessment for long-term care services; home equity exemption tied to family living situation
- **Program of All-Inclusive Care for the Elderly (PACE) - Idaho PACE** — service ([source](https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); https://medicaid.idaho.gov (Idaho-specific expected)))
  - Shape notes: Availability restricted to specific service areas/providers in Idaho (not statewide); no direct income/asset test for PACE but tied to Medicaid for full coverage; NFLOC required; potential waitlists by region
- **Weatherization Assistance Program (WAP)** — in_kind ([source](https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-weatherization))
  - Shape notes: This program's structure is complex because it is administered through multiple Community Action Agencies with different income thresholds, wait times, and service areas. Income limits vary by household size and by administering agency. Benefits are individualized based on energy audits rather than fixed amounts. Priority tiers significantly affect wait times. The 15-year ineligibility rule for repeat services is a permanent barrier for previously-served homes. Regional variation is substantial — families should contact their specific local agency rather than assuming statewide uniformity.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: income at 125% FPL (varies by household size via annual HHS guidelines); priority tiers for entry; statewide via single provider (Easterseals-Goodwill) with potential regional slot limits; no fixed asset limits
- **Idaho Home Choice** — service ([source](https://healthandwelfare.idaho.gov/services-programs/medicaid-health/idaho-home-choice[1]))
  - Shape notes: Transition-only program requiring institutional stay and specific Medicaid waivers; no standalone eligibility or fixed benefits list; contact provided in-facility to eligible residents

## Program Details

### Idaho Medicaid Aged, Blind, and Disabled (ABD) Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For AABD Medicaid in 2026, the income limit is $1,047 per month for a single individual. For a married couple (both applying), it is also referenced but exact couple amount not specified in sources; limits may vary by household size and living arrangements. Additional resource guidelines apply, and most programs have resource limits alongside income[3][5][7].
- Assets: Specific asset limits not detailed in sources, but applicants must meet certain resource guidelines. For related Aged and Disabled Waiver, home equity interest cannot exceed $752,000 in 2026 if living in the home or intending to return. Exemptions include: spouse living in the home, child under 21 living in the home, or disabled/blind child of any age living in the home[1].
- Live in Idaho
- U.S. Citizen or eligible non-citizen
- Receiving SSI (disabled per Social Security standards) for AABD cash, which pairs with Medicaid[3]
- For long-term care ABD benefits: Nursing Facility Level of Care (NFLOC) assessed via Uniform Assessment Instrument (UAI), evaluating ADLs (bathing, dressing, mobility, eating, toileting), IADLs (meals, laundry, housecleaning), problematic behaviors, and cognitive impairments like dementia[1][2]
- Blind or disabled (ages 65+ or 18-64 for disabled, can continue post-65)[1][4]

**Benefits:** AABD provides Medicaid health coverage, including long-term care benefits for those meeting medical need (e.g., in-home assistance via related Personal Care Services Program). AABD cash assistance offers a small monthly payment for everyday living expenses, amount based on living arrangements, income, resources (max for independent living or group/residential care tied to cost). Eligible individuals may also receive AABD Medicaid[1][2][4].
- Varies by: household_size|living_arrangements|income|resources

**How to apply:**
- Online or contact via Idaho Department of Health and Welfare websites: https://healthandwelfare.idaho.gov/services-programs/financial-assistance/apply-aabd-cash and https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicaid-workers-disabilities[3][5]
- Phone: Contact Idaho DHW (specific numbers not listed; use site contact forms or general inquiries)[5]
- Research state-specific long-term care benefits first via state Medicaid office[2]

**Timeline:** Not specified in sources

**Watch out for:**
- AABD cash requires SSI receipt and pairs with Medicaid; not all ABD Medicaid needs SSI[3][4]
- Medical eligibility for long-term care requires NFLOC via UAI assessment; dementia diagnosis alone insufficient[1]
- Distinguish from Aged and Disabled (A&D) Waiver (for 65+ or 18-64 disabled at risk of institutionalization) and Personal Care Services (slightly different eligibility)[1]
- Income/resources vary by living arrangements; home equity limit $752,000 for waiver-related[1]
- Workers with disabilities have separate MWD program with higher income limits[6]

**Data shape:** Cash assistance amount scales by living arrangements, income, resources; pairs with Medicaid eligibility; requires SSI for cash but functional NFLOC assessment for long-term care services; home equity exemption tied to family living situation

**Source:** https://healthandwelfare.idaho.gov/services-programs/financial-assistance/about-aabd-cash-assistance

---

### Idaho Aged and Disabled Waiver


**Eligibility:**
- Age: 65+ or 18-64 if disabled (disabled persons can continue services after turning 65)+
- Income: Must meet Medicaid AABD income limits (specific 2026 dollar amounts not detailed in sources; single applicant asset limit $2,000 implies corresponding income cap, consult official Medicaid for exact figures)
- Assets: Countable assets ≤ $2,000 for single applicant. Exempt: primary home (equity ≤ $752,000 in 2026 if intent to return, or if spouse/child under 21/disabled child lives there), household furnishings/appliances, personal effects, one vehicle. 60-month look-back rule applies; transfers below fair market value cause penalty period.
- Idaho resident
- U.S. citizen or eligible non-citizen
- Nursing Facility Level of Care (NFLOC) via Uniform Assessment Instrument (UAI) evaluating ADLs (bathing, dressing, mobility, eating, toileting) and IADLs (meals, laundry, housecleaning); cognitive impairments considered
- Eligible for Medicaid under AABD (Aid to the Aged, Blind, and Disabled)

**Benefits:** Adult day health (4+ hours/day: medication assistance, ADL help, meals, housekeeping, laundry, transport, socialization, recreation, personal finances); homemaker; respite; supported employment; attendant care; adult residential care; chore service; companion; consultation; environmental accessibility adaptations; home delivered meals; non-medical transport; personal emergency response system; skilled nursing; specialized medical equipment/supplies; transition services (security deposits, etc. from institutions); personal assistance (grooming, bathing, eating, meds, supervision, household tasks). No fixed dollar/hour amounts specified; individualized service plan.
- Varies by: priority_tier

**How to apply:**
- Apply for Medicaid first via Idaho DHW (phone, online, in-person, mail; specific contacts via healthandwelfare.idaho.gov)
- Functional assessment via Department or contractor (in-person/telephone UAI interview)
- No specific form name/number listed; follows IDAPA 16.03.05 for AABD Medicaid

**Timeline:** Not specified in sources
**Waitlist:** Not detailed (common for HCBS waivers; check current status)

**Watch out for:**
- 60-month look-back penalty for asset transfers
- Must meet NFLOC; not just basic Medicaid eligibility
- Home equity limit $752,000 (2026); exemptions narrow
- Separate from Personal Care Services Program (different criteria)
- Applicant can choose nursing facility over waiver services
- Financials must align with AABD Medicaid first

**Data shape:** NFLOC tiered by functional need assessment; no fixed service hours/dollars (individualized); statewide but contractor-determined; asset exemptions home-focused

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/about-medicaid-elderly-or-adults-disabilities

---

### Program of All-Inclusive Care for the Elderly (PACE) - Idaho PACE

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE itself; fully covered at no cost for Medicaid-eligible participants (requires meeting Idaho Medicaid criteria, which may include income limits like $1,047/month for singles or $1,511/month for couples under related programs, but not directly confirmed for PACE). Non-Medicaid participants pay a monthly premium.
- Assets: No asset limits for PACE itself; Medicaid eligibility (common for participants) typically has limits around $2,000 for individuals in many states, but Idaho-specific PACE asset details not specified in sources.
- Live in the service area of an Idaho PACE organization
- Eligible for nursing home level of care (Nursing Facility Level of Care - NFLOC) as certified by Idaho
- Able to live safely in the community (home or assisted living) with PACE support

**Benefits:** Comprehensive medical and social services including primary care, hospital care, prescription drugs, social services, restorative therapies, personal care, respite care, hospice, transportation, and all Medicare/Medicaid-covered services; no deductibles or copays for enrollees; becomes sole source of services for dual-eligible participants.
- Varies by: region

**How to apply:**
- Contact local PACE organization or Idaho Medicaid office (specific phone/website not in results; use National PACE Association map or state Medicaid office)
- Phone: Call Idaho Medicaid (general line not specified; check medicaid.idaho.gov)
- In-person: At PACE center in service area

**Timeline:** Not specified in sources
**Waitlist:** Possible waitlists due to capped financing, varying by state/program capacity

**Watch out for:**
- Not available statewide in Idaho; must live in a PACE service area
- Requires NFLOC certification, which Idaho defines specifically
- Waitlists common due to funding caps
- Non-Medicaid pay privately (potentially $7,000+/month or share of cost $200-900)
- No financial eligibility for PACE, but Medicaid (for free coverage) has limits
- Limited to 55+ (not 65+ like some programs)

**Data shape:** Availability restricted to specific service areas/providers in Idaho (not statewide); no direct income/asset test for PACE but tied to Medicaid for full coverage; NFLOC required; potential waitlists by region

**Source:** https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); https://medicaid.idaho.gov (Idaho-specific expected)

---

### Medicare Savings Programs (Qualified Medicare Beneficiary - QMB, Specified Low-Income Medicare Beneficiary - SLMB, Qualifying Individual - QI)


**Eligibility:**
- Income: Must be entitled to Medicare Part A (or eligible for premium-free Part A). Federal standards apply, updated annually effective April 1, but Idaho follows these with limits varying by program and household size (individual or married couple). Idaho-specific limits from recent data (note: 2026 federal updates shown in some sources; confirm current via official site as they change yearly):

QMB:
- Individual: $1,275-$1,350 monthly[3][5][6][7]
- Married couple: $1,724-$1,824 monthly[3][5][6][7]

SLMB:
- Individual: $1,478-$1,616 monthly[4][6][7]
- Married couple: $1,992-$2,184 monthly[4][6][7]

QI:
- Individual: $1,660-$1,816 monthly[4][6][7]
- Married couple: $2,239-$2,455 monthly[4][6][7]

Married couples in Idaho may use Community Property Method, allowing one spouse to qualify as individual[7]. Limits based on Federal Poverty Level; Idaho does not appear more generous.
- Assets: Federal limits apply in Idaho: $9,090-$9,950 for individual; $13,630-$14,910 for married couple across QMB, SLMB, QI[4][5][6][7]. Counts: bank accounts, stocks, bonds. Exempt: home, one car, burial plots, life insurance (up to certain value), personal belongings. States may waive (e.g., some have no asset limit for QI), but Idaho uses federal[1][4].
- Must be enrolled in Medicare (Part A required; Part B for full benefits)
- U.S. citizen or qualified immigrant
- Reside in Idaho
- QI requires annual reapplication and is first-come, first-served with priority to prior recipients[1][5]

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, all Part A/B deductibles/coinsurance/copayments (providers cannot bill QMB enrollees for covered services, including Medicare Advantage cost-sharing). Auto-qualifies for Extra Help (Part D low copays, e.g., ≤$12.65/drug in 2026)[1][2][5].

**SLMB:** Pays Medicare Part B premiums only. Auto-Extra Help[1][2][4][5].

**QI:** Pays Medicare Part B premiums only. Auto-Extra Help. No cost-sharing relief beyond premiums[1][4][5].
- Varies by: priority_tier

**How to apply:**
- Online: healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[2]
- Phone: Contact Idaho Dept. of Health & Welfare Medicaid office (local numbers via site; central: 208-334-5500 or regional offices)
- Mail/In-person: Local Idaho Dept. of Health & Welfare offices (find via healthandwelfare.idaho.gov/locations)
- Through state Medicaid agency (requests for QMB/SLMB/QI apps directed there)[1][2]

**Timeline:** Not specified in sources; typically 45 days for Medicaid programs, but varies[1]
**Waitlist:** QI has limited federal funding; first-come, first-served with priority to previous year recipients; may have waitlist if funds exhausted[1][5]

**Watch out for:**
- Income/asset limits change annually April 1; older figures (e.g., $1,235[4]) outdated vs. 2026 $1,350[5][6]
- Providers cannot bill QMB for Medicare-covered services, but may charge small Medicaid copay[1][5]
- QI requires annual reapplication and may run out of funds (priority to renewals)[1][5]
- Married couples: Community Property Method may allow one spouse to qualify as single[7]
- Auto-enrolls in Extra Help (full subsidy), but confirm Part D enrollment
- Not all states waive assets; Idaho follows federal limits[1][4]

**Data shape:** Tiered by QMB/SLMB/QI with escalating income thresholds; household size limited to individual/couple (no full table); assets uniform across tiers; QI capped funding creates waitlist risk; Idaho aligns with federal but uses regional offices for access

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/medicare-savings-program[2]

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled: No gross income limit in Idaho. Net income must be below limits after deductions (e.g., medical expenses over $35/month for elderly/disabled, shelter costs, utilities). General net income limits (Oct 1, 2025-Sept 30, 2026) approximate: 1 person ~$1,255 max gross (varies by deductions); full table not specified but scales by household size (add ~$449 per additional person). Seniors qualify if net income fits after deductions like excess shelter/medical[1][2][3][6].
- Assets: Most households: under $5,000. Exemptions likely include home, retirement savings, vehicle (standard federal rules apply; specifics for elderly not detailed beyond general limit)[3][6].
- U.S. citizen or legal immigrant[4][6][8].
- Idaho resident[4][6][8].
- No work requirements if all household members 60+ or disabled; otherwise, 16-59 able-bodied must work 30+ hours/week or train (ABAWD 18-50: 80 hours/month limit without dependents)[4].
- Household includes those who buy/prepare food together[2].

**Benefits:** Monthly EBT card for food purchases (amount based on net income: ~$100 more net income = $30 less benefits; max allotment e.g., $546 for 2-person elderly household before adjustments)[1][5]. Can buy Meals on Wheels[4]. Certified up to 24 months if all 60+/disabled[4].
- Varies by: household_size

**How to apply:**
- Online: healthandwelfare.idaho.gov/services-programs/food-assistance/apply-snap[3][8].
- Phone: Regional DHW offices (e.g., general assistance 2-1-1 or 208-639-0030 via Idaho Hunger Relief)[3][7].
- Mail/In-person: Local DHW offices or submit via Idaho DHW website[3][8].
- Authorized rep can apply for elderly; phone interview allowed[4].

**Timeline:** Not specified; expedited for urgent cases implied but no exact timeline[1].

**Watch out for:**
- Idaho expanded eligibility: no gross income limit for 60+/disabled households—many miss this[1].
- Deduct medical >$35/month, shelter/utilities—key for seniors on fixed income[1][3].
- 64% of eligible Idaho seniors not enrolled[7].
- Social Security/pensions count as income[2].
- Can use for Meals on Wheels even in senior housing[3][4].

**Data shape:** Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); no gross income test for 60+/disabled; statewide but regional offices handle apps.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/food-assistance

---

### Idaho Energy Assistance (LIHEAP)


**Eligibility:**
- Income: Household gross monthly income must be at or below 150% of the Federal Poverty Level (FPL)[1][3]. For households of size 8 or more, the limit is 150% FPL[5]. Note: One source indicates that for household sizes 1-7, the limit may be 60% of State Median Income, while sizes 8+ use 150% FPL[5], though the primary Idaho guidance states 150% FPL uniformly[1][3]. Specific dollar amounts for 2026 are not provided in available sources; applicants should contact their local Community Action Agency for current income thresholds based on household size.
- Assets: Not specified in available sources.
- U.S. citizen, permanent resident, or qualified non-citizen; at least one household member must be a U.S. citizen or lawful permanent resident[1][7]
- Must live in Idaho[7]
- Must have a heating expense (proof of heating bill required)[7]
- Funds are limited and distributed on a first-come, first-serve basis[1][4]
- Families with children under age six, elderly members, or disabled members can apply starting in October; all other families can apply starting in November[4]

**Benefits:** $400–$1,800 per year ($200–$600 per season)[1]. Benefit amount is determined using factors including household income, geographic location within Idaho, household composition, and heating costs[4]. Crisis LIHEAP provides emergency assistance for situations such as broken furnaces or utility shutoff notices[2].
- Varies by: household_size, income, location_within_state, fuel_type, heating_area, energy_burden

**How to apply:**
- Online through the U.S. Department of Health & Human Services (specific URL not provided in sources; contact local Community Action Agency for portal access)[1]
- In-person or by mail/email through local Community Action Agency offices serving every Idaho county[4][5]
- Phone contact with local Community Action Partnership (CAP) agency[8]

**Timeline:** 7–30 days[1]
**Waitlist:** No formal waitlist described; however, funding is limited and distributed on a first-come, first-serve basis. Applications may be accepted only during specific seasons (heating assistance typically available fall/winter) and may close early if funds are exhausted[1][2][4].

**Watch out for:**
- Cooling assistance is NOT available in Idaho—only heating assistance[2]
- Funds are extremely limited and distributed first-come, first-serve; applications may close before the end of the season if funding runs out[1][2]
- Application deadlines vary by local agency and may close earlier than the official program dates if funds are exhausted[2]
- Families with children under six, elderly, or disabled members can apply starting in October, but all other families must wait until November—this creates a two-tier application window[4]
- Roommates living at the same address and covered by the same utility bill are counted as part of the same LIHEAP household, even if they don't share expenses[2]
- Heating assistance is seasonal (typically fall/winter); crisis assistance is available only for emergencies[2][4]
- The online application portal may be unavailable; email or mail submission to local offices may be required[5]
- Income limits are based on gross income (before taxes), not net income[2]
- Benefit amounts are calculated individually based on fuel type, heating area, and energy burden—there is no standard benefit amount[3]

**Data shape:** This program's structure is highly individualized: benefits scale by household size, income, geographic location within Idaho, fuel type, and energy burden. Application windows are tiered by household composition (elderly/disabled/children under six vs. others). Funding is limited and distributed first-come, first-serve, making application timing critical. The program operates seasonally for regular heating assistance but offers year-round crisis assistance. Community Action Agencies administer the program locally, creating potential variation in processing times and application methods by county.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-heating-assistance

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income limits vary by program administrator and funding source. Idaho Power's program (for electrically-heated homes) uses these monthly guidelines: 1 person: $2,146; 2 people: $2,903; 3 people: $3,660; 4 people: $4,416; 5 people: $5,173[2]. Other Community Action Agencies may use different thresholds based on federal poverty guidelines (typically 150% of Federal Poverty Guidelines for LIHEAP-funded weatherization)[7]. EICAP's program shows annual income limits ranging from $43,150 for a single person to $108,300 for 8 people, with $11,000 per additional household member[6].
- Assets: Not specified in available sources. Contact your local Community Action Agency for asset limit information.
- Live in Idaho[1]
- One household member must be a US Citizen or lawful permanent resident[1]
- Proof of identity required[1]
- Proof of utility expense required[1]
- Proof of homeownership OR written permission from landlord for rental units[1][3]
- Home must not have received weatherization services in the past 15 years[1]
- For Idaho Power program: home must be heated with electricity provided by Idaho Power[2]
- Weatherization services must show cost of work will save family money after completion[3]
- Home safety and health risks are considered in qualification[3]

**Benefits:** Energy conservation improvements including repairs to heat and air filtration systems, broken windows, insulation, caulking, weather-stripping, and indoor air quality issues[5]. Specific dollar amounts for materials and labor are not specified in available sources; benefits are determined individually based on energy audit results and available funding[6].
- Varies by: priority_tier

**How to apply:**
- Phone: Contact your local Community Action Agency (specific numbers vary by region)[1][2]
- In-person: Visit local Community Action Agency office
- Mail: Contact information available through local Community Action Agency

**Timeline:** Varies significantly by provider. EICAP reports waiting lists can be up to 3 years after qualification[6]. Funding is limited and available year-round on first-come, first-serve basis[3].
**Waitlist:** Yes. After qualifying for energy assistance, applicants are placed on a waiting list for weatherization services. Wait times depend on available funding and household priority level[4][6].

**Watch out for:**
- Homes that received weatherization services in the past 15 years are permanently ineligible for a second benefit[1]
- For rental properties, landlord written permission is required AND landlord must help pay a portion of the cost (Idaho Power program)[2]
- Income limits vary significantly by program administrator — a household may qualify under one agency but not another[2][6]
- Wait times can exceed 3 years in some regions; this is not a quick-turnaround program[6]
- Income must be re-verified annually; if not re-applied within the last year, income verification is required again[6]
- Program prioritizes families with children, elderly, disabled members, or emergency heating situations — other households may wait longer[3][4]
- Weatherization work must demonstrate cost-effectiveness (savings must exceed work cost) to qualify[3]
- Idaho Power program is limited to electrically-heated homes; other heating sources may not qualify[2]
- For renters: landlord permission is necessary but not sufficient — landlord must also contribute to costs in some programs[2]

**Data shape:** This program's structure is complex because it is administered through multiple Community Action Agencies with different income thresholds, wait times, and service areas. Income limits vary by household size and by administering agency. Benefits are individualized based on energy audits rather than fixed amounts. Priority tiers significantly affect wait times. The 15-year ineligibility rule for repeat services is a permanent barrier for previously-served homes. Regional variation is substantial — families should contact their specific local agency rather than assuming statewide uniformity.

**Source:** https://healthandwelfare.idaho.gov/services-programs/financial-assistance/home-heating-and-utility-assistance/about-weatherization

---

### Senior Health Insurance Benefits Advisors (SHIBA)


**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, seniors, and disabled citizens[1][3]
- Assets: No asset limits; no financial eligibility requirements[1][3]
- Must be a Medicare beneficiary, senior, or disabled citizen seeking health insurance counseling[1][3]

**Benefits:** Free one-on-one health insurance counseling, information on Medicare Parts A/B/D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, and other programs; printed materials and referrals; in-person, phone, or email sessions[1][2][4]

**How to apply:**
- Phone: 1-800-247-4422[2][4][5]
- Online form: https://doi.idaho.gov/shiba/[4]
- Email: Shannon.Hohl@doi.idaho.gov[2]
- In-person: Idaho Department of Insurance, 700 West State St., 3rd Floor, Boise ID 83720[2][3]

**Timeline:** Not specified; appointments available upon contact[1][4]

**Watch out for:**
- Not an insurance seller or recommender of specific policies/agents; provides unbiased information only[3]
- Free service, no cost to users[1]
- Part of national SHIP network, focused on Medicare counseling not direct financial aid or healthcare[2][5]

**Data shape:** no income or asset test; free counseling service available statewide with local counselors in every county; not a benefits payment program but advisory/advocacy service[1][3]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://doi.idaho.gov/shiba/[2][4]

---

### Home-Delivered Meals (Title III-C-2)


**Eligibility:**
- Age: 60+
- Income: No means test or specific income limits; priority given to those with greatest social/economic need, such as low-income at or below poverty level, but not required[1][2][5][7]
- Assets: No asset limits or tests mentioned
- 60 years or older, or spouses of any age, or disabled persons under 60 living with eligible 60+ person[1][3][5]
- Frail, homebound, isolated, disabled, or unable to prepare meals or participate in congregate meals due to frailty[1][3][6]
- Lives in the service area of the local Area Agency on Aging (AAA)[1][3]
- Additional at-risk priorities (e.g., health conditions, rural areas) may apply at AAA discretion[1][2]

**Benefits:** Home-delivered nutritionally balanced meals (hot, cold, frozen, or shelf-stable) meeting Dietary Guidelines for Americans and 1/3 of Dietary Reference Intakes; up to one meal per day typically (lunch Monday-Friday common, but varies); wellness checks during delivery; at least 3 shelf-stable meals twice per year for emergencies[3][4][6][9]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone or in-person; e.g., Southwest Idaho AAA for their region[1]
- In-home or phone assessment by AAA, care coordinator, or nutrition provider[3]
- No statewide centralized phone/website specified; use regional AAAs

**Timeline:** Not specified in sources
**Waitlist:** Possible due to prioritization and funding; varies by AAA and demand

**Watch out for:**
- No income test, but priority to greatest need (low-income, minorities, 75+, isolated) may create waitlists for others[2][4][6]
- Not limited to strictly homebound; frail/unable to cook qualifies[6]
- Spouses/disabled co-residents eligible regardless of age[1][5]
- Voluntary contributions encouraged but never required[3][5]
- Regional AAAs handle applications, not centralized state process
- Separate from Medicaid/Medicare meals; this is OAA-funded[8]

**Data shape:** Administered regionally by AAAs with priority tiers over strict cutoffs; no means test; service area-limited; varies by local provider capacity

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/ (Idaho Commission on Aging)

---

### National Family Caregiver Support Program (NFCSP, Title III-E)


**Eligibility:**
- Age: Care recipient 60+ or with Alzheimer's/dementia (any age); caregiver 18+ for 60+ care recipient, or 55+ for relative caregivers of disabled adult 18+ or child 18-+
- Income: No income restrictions for core benefits; prioritization for caregivers/recipients with greatest social and economic need (specific dollar amounts not specified in sources)
- Assets: No asset limits mentioned
- Family caregiver (unpaid) providing care to eligible relative
- Grandparent/other relative caregiver 55+ living with and primary caregiver for child 18- or disabled adult 18+
- Prioritization for older individuals with greatest social/economic need and those caring for individuals with severe disabilities

**Benefits:** Information and assistance; individual counseling, support groups, or caregiver training; respite care; supplemental services at caregiver direction
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging via 211
- Visit https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/
- Contact Idaho Commission on Aging

**Timeline:** Not specified
**Waitlist:** Not specified; may vary regionally

**Watch out for:**
- Does not provide direct payments to family caregivers (unlike Medicaid programs); focuses on support services only
- Idaho lacks state programs for direct family caregiver pay; NFCSP offers non-financial aid like respite and training
- Prioritization may limit access for non-priority caregivers
- Regional delivery differences (e.g., telehealth in north vs. mobile units in south) affect service style
- Not Medicaid-funded; separate from paid caregiver options like Certified Family Home Program

**Data shape:** No income/asset test; services via local AAAs with priority tiers; regionally varied delivery (in-person, telehealth, mobile); no direct pay, only support/respite

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/stay-at-home/national-family-caregiver-support-program/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level (HHS Poverty Guidelines, updated annually; as of January 15, 2025, contact local provider for current table by household size, e.g., for 2025: 1-person ~$19,000, 2-person ~$25,500—exact amounts vary yearly and by household size)
- Unemployed
- U.S. citizen or authorized to work
- Priority: veterans/qualified spouses, over 65, disability, low literacy/limited English, rural resident, homeless/at risk, low employment prospects, or prior American Job Center user

**Benefits:** Paid part-time community service work training (average 20 hours/week at highest of federal/state/local minimum wage, e.g., Idaho state minimum $7.25/hour); job placement assistance, resume help, interview skills, skill training (computer, literacy, English); assignments 6-12 months at nonprofits/public agencies leading to unsubsidized jobs
- Varies by: priority_tier

**How to apply:**
- Website: www.esgw.org/scsep
- Phone: (208) 454-8555 (Easterseals-Goodwill Idaho)
- National help: 1-877-872-5627 (1-877-US2-JOBS)
- In-person: Local Easterseals-Goodwill offices in Idaho
- CareerOneStop Older Worker Program Finder for local sites

**Waitlist:** Possible due to limited slots/funding; varies by demand and region

**Watch out for:**
- Limited slots/funding may cause waitlists—call ahead
- Temporary (6-12 months) bridge to unsubsidized work, not permanent job guarantee
- Must actively seek unsubsidized employment
- Income at 125% FPL (not 100%)—many miss this threshold
- Priority tiers affect entry speed
- No asset test, but full family income counted

**Data shape:** income at 125% FPL (varies by household size via annual HHS guidelines); priority tiers for entry; statewide via single provider (Easterseals-Goodwill) with potential regional slot limits; no fixed asset limits

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### Long-Term Care Ombudsman Program (Title III-B & VII)


**Eligibility:**
- Age: 60+
- Income: No income limits; available to all residents regardless of income.
- Assets: No asset limits; no financial eligibility requirements.
- Must be a resident of a long-term care facility (e.g., nursing home, assisted living, skilled nursing, or residential care facility) in Idaho.
- Services provided to residents 60 years or older, or complaints made by/on behalf of such residents.
- Program authorized under Older Americans Act Titles III and VII, and Idaho Code 67-5009.

**Benefits:** Investigate and resolve complaints about health, safety, welfare, and rights; advocate for residents; conduct routine facility visits (minimum quarterly); attend resident council meetings; provide information, education, referrals on long-term care and benefits; mediate issues like resident care, rehabilitation, restraints; participate in licensure surveys; maintain confidentiality.

**How to apply:**
- Phone: Contact State Ombudsman at Idaho Commission on Aging or local Area Agency on Aging (specific numbers vary by region, e.g., South Central Idaho: 208-736-2122 or 1-800-574-8656).
- In-person: Local Ombudsman at Area Agencies on Aging or facilities.
- Online: Limited to mandated reporters/financial institutions via designated system; others call during business hours.

**Timeline:** Immediate response for urgent issues; investigation timelines not specified but aimed at prompt resolution.

**Watch out for:**
- Not a direct service provider (e.g., no healthcare or financial aid); focuses on advocacy and complaint resolution only.
- Not for general eligibility determination—free service for any LTC resident with issues.
- Online reporting only for mandated reporters (e.g., physicians, nurses); families must call.
- Volunteers undergo background checks and training; families contact for resident advocacy, not to volunteer.
- Primarily facility-based; home care advocacy limited and not federally mandated.

**Data shape:** no income test; open to all LTC residents 60+; advocacy-only (no financial benefits); regionally administered via Area Agencies on Aging with volunteer support; complaint-driven, not application-based eligibility.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.idaho.gov/ombudsman-program/

---

### Idaho Home Choice

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits unique to Idaho Home Choice; eligibility requires Medicaid eligibility at time of discharge, which for long-term care (e.g., Aged and Disabled Waiver) follows general Idaho Medicaid LTC rules: single applicant income under $3,002/month (2026). Limits vary by program pathway, marital status, and household size—see official Medicaid income limits page for full details as they are not program-specific here.[1][2]
- Assets: Medicaid asset limit of $2,000 for single applicants (countable assets). Primary home exempt if spouse, child under 21, or blind/disabled child lives there; otherwise, home equity limit $752,000 (2026). Standard Medicaid rules apply, not unique to program.[2]
- Lived at least 45 consecutive days in a nursing facility or intermediate care facility for individuals with intellectual disabilities[1]
- Idaho resident[1]
- Medicaid eligible at time of discharge[1]
- Qualify for Aged and Disabled Waiver or Developmental Disability Waiver[1]
- Move to a 'qualified residence'[1]
- Nursing Facility Level of Care (NFLOC) required via Medicaid LTC eligibility[2]

**Benefits:** Home and Community-Based Services (HCBS) to support transition from institutional settings (nursing facilities or ICF/ID) to home/community. Specific services not listed but aimed at long-term care in settings of choice; no fixed dollar amounts or hours stated[1]
- Varies by: priority_tier

**How to apply:**
- Contact info provided directly to Medicaid participants in qualified institutional settings (nursing facilities/ICF/ID)[6]
- General Medicaid application routes apply (phone, online via idalink.idaho.gov, etc.)[5]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; program goals include assuring continued HCBS provision post-transition[1]

**Watch out for:**
- Not for community dwellers—requires prior 45+ consecutive days in nursing facility or ICF/ID; not a general HCBS entry point[1]
- Must be Medicaid-eligible *at discharge* and qualify for specific waivers (Aged/Disabled or DD)—pre-discharge planning critical[1]
- Program focuses on transition support and HCBS flexibility, not new admissions to facilities[1]
- No unique income/asset rules; tied to standard Medicaid LTC thresholds which change annually[2][5]

**Data shape:** Transition-only program requiring institutional stay and specific Medicaid waivers; no standalone eligibility or fixed benefits list; contact provided in-facility to eligible residents

**Source:** https://healthandwelfare.idaho.gov/services-programs/medicaid-health/idaho-home-choice[1]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Idaho Medicaid Aged, Blind, and Disabled | benefit | state | deep |
| Idaho Aged and Disabled Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (Qualified Med | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Idaho Energy Assistance (LIHEAP) | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Senior Health Insurance Benefits Advisor | resource | state | simple |
| Home-Delivered Meals (Title III-C-2) | benefit | state | deep |
| National Family Caregiver Support Progra | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-Term Care Ombudsman Program (Title  | resource | federal | simple |
| Idaho Home Choice | benefit | state | deep |

**Types:** {"benefit":10,"resource":2,"employment":1}
**Scopes:** {"state":6,"local":1,"federal":6}
**Complexity:** {"deep":11,"simple":2}

## Content Drafts

Generated 13 page drafts. Review in admin dashboard or `data/pipeline/ID/drafts.json`.

- **Idaho Medicaid Aged, Blind, and Disabled (ABD) Program** (benefit) — 4 content sections, 6 FAQs
- **Idaho Aged and Disabled Waiver** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE) - Idaho PACE** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (Qualified Medicare Beneficiary - QMB, Specified Low-Income Medicare Beneficiary - SLMB, Qualifying Individual - QI)** (benefit) — 6 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Idaho Energy Assistance (LIHEAP)** (benefit) — 3 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 5 content sections, 6 FAQs
- **Senior Health Insurance Benefits Advisors (SHIBA)** (resource) — 1 content sections, 5 FAQs
- **Home-Delivered Meals (Title III-C-2)** (benefit) — 4 content sections, 6 FAQs
- **National Family Caregiver Support Program (NFCSP, Title III-E)** (benefit) — 2 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program (Title III-B & VII)** (resource) — 2 content sections, 6 FAQs
- **Idaho Home Choice** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **household_size|living_arrangements|income|resources**: 1 programs
- **priority_tier**: 7 programs
- **region**: 1 programs
- **household_size**: 1 programs
- **household_size, income, location_within_state, fuel_type, heating_area, energy_burden**: 1 programs
- **not_applicable**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Idaho Medicaid Aged, Blind, and Disabled (ABD) Program**: Cash assistance amount scales by living arrangements, income, resources; pairs with Medicaid eligibility; requires SSI for cash but functional NFLOC assessment for long-term care services; home equity exemption tied to family living situation
- **Idaho Aged and Disabled Waiver**: NFLOC tiered by functional need assessment; no fixed service hours/dollars (individualized); statewide but contractor-determined; asset exemptions home-focused
- **Program of All-Inclusive Care for the Elderly (PACE) - Idaho PACE**: Availability restricted to specific service areas/providers in Idaho (not statewide); no direct income/asset test for PACE but tied to Medicaid for full coverage; NFLOC required; potential waitlists by region
- **Medicare Savings Programs (Qualified Medicare Beneficiary - QMB, Specified Low-Income Medicare Beneficiary - SLMB, Qualifying Individual - QI)**: Tiered by QMB/SLMB/QI with escalating income thresholds; household size limited to individual/couple (no full table); assets uniform across tiers; QI capped funding creates waitlist risk; Idaho aligns with federal but uses regional offices for access
- **Supplemental Nutrition Assistance Program (SNAP)**: Benefits scale by household size and net income after elderly-specific deductions (medical/shelter); no gross income test for 60+/disabled; statewide but regional offices handle apps.
- **Idaho Energy Assistance (LIHEAP)**: This program's structure is highly individualized: benefits scale by household size, income, geographic location within Idaho, fuel type, and energy burden. Application windows are tiered by household composition (elderly/disabled/children under six vs. others). Funding is limited and distributed first-come, first-serve, making application timing critical. The program operates seasonally for regular heating assistance but offers year-round crisis assistance. Community Action Agencies administer the program locally, creating potential variation in processing times and application methods by county.
- **Weatherization Assistance Program (WAP)**: This program's structure is complex because it is administered through multiple Community Action Agencies with different income thresholds, wait times, and service areas. Income limits vary by household size and by administering agency. Benefits are individualized based on energy audits rather than fixed amounts. Priority tiers significantly affect wait times. The 15-year ineligibility rule for repeat services is a permanent barrier for previously-served homes. Regional variation is substantial — families should contact their specific local agency rather than assuming statewide uniformity.
- **Senior Health Insurance Benefits Advisors (SHIBA)**: no income or asset test; free counseling service available statewide with local counselors in every county; not a benefits payment program but advisory/advocacy service[1][3]
- **Home-Delivered Meals (Title III-C-2)**: Administered regionally by AAAs with priority tiers over strict cutoffs; no means test; service area-limited; varies by local provider capacity
- **National Family Caregiver Support Program (NFCSP, Title III-E)**: No income/asset test; services via local AAAs with priority tiers; regionally varied delivery (in-person, telehealth, mobile); no direct pay, only support/respite
- **Senior Community Service Employment Program (SCSEP)**: income at 125% FPL (varies by household size via annual HHS guidelines); priority tiers for entry; statewide via single provider (Easterseals-Goodwill) with potential regional slot limits; no fixed asset limits
- **Long-Term Care Ombudsman Program (Title III-B & VII)**: no income test; open to all LTC residents 60+; advocacy-only (no financial benefits); regionally administered via Area Agencies on Aging with volunteer support; complaint-driven, not application-based eligibility.
- **Idaho Home Choice**: Transition-only program requiring institutional stay and specific Medicaid waivers; no standalone eligibility or fixed benefits list; contact provided in-facility to eligible residents

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Idaho?
