# Illinois Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 7.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 6 |
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
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **unknown**: 1 programs
- **financial**: 1 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$1304` → Source says `$2,901` ([source](https://hfs.illinois.gov/medicalproviders/pace.html))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive, all-inclusive health and long-term care services 24/7/365, including primary care at PACE center (with clinic, therapeutic recreation, restorative therapies, socialization, personal care, dining); home care; inpatient services up to acute or long-term care facilities if needed; all Medicare/Medicaid-covered services plus additional as required (e.g., any/all services in Illinois Public Aid Code Article V). No specific dollar amounts or hours stated; individualized and unlimited as needed.` ([source](https://hfs.illinois.gov/medicalproviders/pace.html))
- **source_url**: Ours says `MISSING` → Source says `https://hfs.illinois.gov/medicalproviders/pace.html`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **income_limit**: Ours says `$2000` → Source says `$15,060` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases (groceries at authorized retailers). Amount based on household size, net income, and deductions (e.g., example: 2-person elderly/disabled household with $1,200 gross might get $415/month after calculations). Maximum allotments vary (e.g., $546 for 2-person in contiguous states); actual amount is 30% of net income subtracted from max allotment.[1][5]` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.state.il.us/page.aspx?item=30357`

### Senior Health Insurance Program (SHIP)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, one-on-one confidential counseling sessions with certified counselors. No dollar limits specified. Services include: education and answers about Medicare (Parts A, B, C, D), Medicare Supplement (Medigap), long-term care insurance, Medicare Advantage Plans, private fee-for-service plans; assistance organizing and filing Medicare and Medicare Supplement claims; analysis and comparison of Medicare Supplement, Medicare Advantage, and Medicare Part D plans; screening for Extra Help for prescription coverage and Medicaid programs; assistance applying for Medicare Savings Program and Low Income Subsidy programs[2][7][8]. SHIP also provides publications including annual Medicare Supplement Premium Comparison Guide and long-term care insurance booklets[1].` ([source](https://ilaging.illinois.gov/ship.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/ship.html`

### Community Care Program Home Delivered Meals

- **min_age**: Ours says `65` → Source says `60` ([source](https://ilaging.illinois.gov/programs/ccp.html))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered nutritious meals (at least 1/3 of daily recommended dietary allowances); minimum 5 meals per week (Monday-Friday, some offer weekends/dinners); may include ethnically/culturally tailored options (e.g., Kosher, South Asian, Korean, Halal, Latino/Hispanic); delivered with safety check and conversation.` ([source](https://ilaging.illinois.gov/programs/ccp.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/programs/ccp.html`

### Community Care Program (CCP) - Illinois

- **min_age**: Ours says `65` → Source says `60` ([source](https://ilaging.illinois.gov/programs/ccp.html))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Comprehensive in-home and community-based services including: case management/care coordination, in-home services (meal planning/cooking, housekeeping, shopping, personal care like bathing/dressing, laundry, medication reminders, transportation to appointments), adult day services, emergency home response services, automated medication dispenser service, and senior companion program (in some counties). No cost to participant unless determined otherwise during assessment.` ([source](https://ilaging.illinois.gov/programs/ccp.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/programs/ccp.html`

### Illinois Long-Term Care Ombudsman Program (LTCOP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://ilga.gov/Documents/legislation/ilcs/documents/002001050K4.04.htm (20 ILCS 105/4.04) and Illinois Department on Aging))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Ombudsmen advocate on behalf of residents regarding matters affecting health, safety, welfare, or rights. Specific services include: educating residents and families on resident rights, addressing grievances and issues on behalf of residents, starting family councils, and providing information and assistance to facility staff` ([source](https://ilga.gov/Documents/legislation/ilcs/documents/002001050K4.04.htm (20 ILCS 105/4.04) and Illinois Department on Aging))
- **source_url**: Ours says `MISSING` → Source says `https://ilga.gov/Documents/legislation/ilcs/documents/002001050K4.04.htm (20 ILCS 105/4.04) and Illinois Department on Aging`

## New Programs (Not in Our Data)

- **Medical Assistance (Medicaid) for Seniors/Disabled** — service ([source](https://www.illinois.gov/hfs/MedicalClients/Pages/medicalprograms.aspx))
  - Shape notes: Complex multi-pathway structure: income-only (ACA), asset-tested (AABD), working premium (HBWD), waiver with NFLOC; limits updated annually (April for waivers); no uniform household table in sources but FPG-based scaling.
- **Home Services Program (HSP) Waiver** — service ([source](https://www.dhs.state.il.us/page.aspx?item=29738))
  - Shape notes: Multiple waivers under HSP umbrella (e.g., PWD under 60, Brain Injury any age, HIV/AIDS any age); eligibility via DON score tier; asset-based not income table; statewide but local DRS delivery with managed care split
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)** — unknown ([source](https://hfs.illinois.gov/info/brochures-and-forms/brochures/hfs3352.html))
  - Shape notes: This is actually three separate but related programs with a tiered structure: QMB (broadest benefits, lowest income limit at 100% FPL), SLMB (narrower benefits, higher income limit at 120% FPL), and QI-1 (narrowest benefits, highest income limit, limited availability). Families should apply for QMB first; if ineligible due to income, they cascade to SLMB; if still ineligible, they may qualify for QI-1. Income limits are tied to Federal Poverty Level and adjust annually in April. The same asset limits apply to QMB and SLMB. Processing timelines and regional office locations are not detailed in available search results.
- **Illinois Home Weatherization Assistance Program (IHWAP)** — service ([source](https://dceo.illinois.gov/communityservices/homeweatherization.html))
  - Shape notes: Statewide via county CAAs with priority tiers; income at 200% FPL (varies by year/household size); funding-limited waitlists; multi-family building-level rules.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://ilaging.illinois.gov/programs/employ.html))
  - Shape notes: Federally funded via DOL/Older Americans Act, locally administered by multiple sub-grantees/national contractors; eligibility fixed at 125% poverty (scales by household size); priority tiers (veterans first); slots limited by funding, leading to regional waitlists
- **Legal Assistance for Seniors** — service ([source](https://ilaging.illinois.gov/programs/legalassistance.html))
  - Shape notes: Decentralized statewide network via local AAAs/providers; eligibility/criteria vary by provider, program, funding source, and region; no uniform income/asset tables or fixed benefits

## Program Details

### Medical Assistance (Medicaid) for Seniors/Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For Aid to the Aged, Blind, and Disabled (AABD) Medicaid, the primary program for seniors 65+ or disabled: countable income at or below 100% of the Federal Poverty Guideline (FPG). Effective April 2025: $1,304/month for a single person; $1,763/month for a couple. Higher income may qualify via spenddown. For ACA Adults (ages 19-64 with disabilities, income-based only): up to 138% FPL ($1,396/month individual). For HBWD (working disabled 16-64): up to 350% FPL ($3,541/month individual). Limits increase annually; household size affects FPG calculation (e.g., scales for larger households).[3][2][5]
- Assets: Countable resources up to $17,500 for AABD (some sources note $2,000 traditional SSI-related limit, but Illinois uses higher threshold). Exempt: primary home, one vehicle, personal belongings, burial plots, ABLE accounts, most retirement accounts. For ACA Adults: no asset limits. For HBWD: up to $25,000.[3][2][8]
- Illinois resident.
- U.S. citizen or qualified non-citizen (e.g., lawfully present 5+ years).
- For seniors: age 65+; for disabled: meet SSA disability definition (except ACA Adults).
- Not receiving Medicare if applying as ACA Adult (19-64).
- For Persons who are Elderly Waiver (HCBS alternative to nursing home): 65+ or physically disabled 60-64, plus Nursing Facility Level of Care via Determination of Need (DON) assessment.[5]

**Benefits:** Full Medicaid health coverage including doctor visits, hospital care, prescription drugs, lab tests, preventive services, long-term care (nursing homes or HCBS via waivers like Persons who are Elderly Waiver for in-home personal care, adult day care, home modifications). No specific dollar amounts or hours; comprehensive services based on medical need. Waiver services require NFLOC.[3][5][4]
- Varies by: priority_tier

**How to apply:**
- Online: Illinois Application for Benefits Eligibility (ABE) at https://abe.illinois.gov/abe/ (recommended first step).[1]
- Phone: Illinois Department of Human Services (DHS) helpline at 1-800-843-6154 or local DHS office.
- Mail or in-person: Local DHS Family Community Resource Center (FCRC) offices statewide; find via https://www.dhs.state.il.us/page.aspx?item=117422.
- For waivers: Contact Community Care Unit (CCU) for DON assessment.

**Timeline:** Typically 45 days; 90 days if disability determination needed.
**Waitlist:** Possible for HCBS waivers like Persons who are Elderly due to enrollment caps; no waitlist for standard AABD Medicaid.[5]

**Watch out for:**
- Multiple pathways (AABD vs. ACA Adults vs. waivers); ACA has no asset test but excludes Medicare recipients and requires no disability determination.
- Income 'spenddown' allows qualification if over limit by meeting deductible via medical bills.
- Assets exempt (home, car) but estate recovery applies post-death for long-term care costs.
- Waivers require NFLOC and have waitlists; not automatic with age/disability.
- HBWD for working disabled requires premium payment.
- Immigrant seniors (65+) may qualify via Health Benefits for Immigrant Seniors.[3]

**Data shape:** Complex multi-pathway structure: income-only (ACA), asset-tested (AABD), working premium (HBWD), waiver with NFLOC; limits updated annually (April for waivers); no uniform household table in sources but FPG-based scaling.

**Source:** https://www.illinois.gov/hfs/MedicalClients/Pages/medicalprograms.aspx

---

### Home Services Program (HSP) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: Under 60 at time of application (exceptions for HIV/AIDS and brain injury waivers, any age)+
- Income: Must meet Medicaid financial eligibility criteria; no specific dollar amounts listed by household size in sources. Apply/cooperate with Medicaid process; not required to be current Medicaid recipient for interim services[1][3][6].
- Assets: For individuals 18 or older: less than $17,500 in non-exempt assets. For under 18: family assets less than $35,000. Exempt assets include primary home, one car, ABLE account, and others[2][3][4][5][6].
- U.S. citizen or legal resident and Illinois resident[1][2][3][4][5][6]
- Severe disability lasting at least 12 months or lifetime[2][3][5][6]
- At imminent risk of nursing facility placement[2][3][5]
- Determination of Need (DON) score of 29 or higher[2][3][5][6]
- Services cost equal to or less than institutional care (nursing home)[1][2][3][5][6]
- Physician certification that care can be safely provided at home[3]

**Benefits:** Personal assistance and home services to support independence at home, including options for daily living tasks; specialized services for HIV/AIDS and traumatic brain injury (TBI); Community Reintegration Program for transitioning from nursing homes. No specific dollar amounts or hours per week stated; services planned by case manager or counselor to match needs at cost-neutral to institutional care[5][9].
- Varies by: priority_tier

**How to apply:**
- Online referral at DHS website: https://www.dhs.state.il.us/page.aspx?item=29738[5][9]
- In-person at local DRS office[5]
- Phone or contact local DRS-HSP office (specific numbers via DHS site)[2]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary as managed by DRS-HSP (30%) or Health Choice Illinois managed care (70%)[2]

**Watch out for:**
- Age limit under 60 applies at application time (exceptions only for HIV/AIDS or brain injury)[2][3][5][6]
- Must achieve DON score of exactly 29+ via in-person assessment with counselor[2][3][5]
- Asset limits are strict on non-exempt assets; exemptions like home/car/ABLE must be verified[3][4]
- Medicaid cooperation required, but not current eligibility for interim services[3][6]
- Services only if cost-neutral to nursing home; not for needs exceeding institutional cost[1][2]
- Family caregivers allowed except spouse, parent of minor, or minor child of recipient[3]

**Data shape:** Multiple waivers under HSP umbrella (e.g., PWD under 60, Brain Injury any age, HIV/AIDS any age); eligibility via DON score tier; asset-based not income table; statewide but local DRS delivery with managed care split

**Source:** https://www.dhs.state.il.us/page.aspx?item=29738

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No specific income limits or financial criteria for PACE eligibility itself; however, most participants are dually eligible for Medicare and Medicaid, which have state-specific financial thresholds (e.g., for Illinois Medicaid long-term care in 2025: income under $2,901/month or 300% FBR, assets $2,000 or less excluding primary home). Private pay option available without Medicaid.
- Assets: No asset limits for PACE eligibility; Medicaid-related asset rules may apply indirectly for dual eligibles ($2,000 limit excluding primary home).
- Live in a PACE service area in Illinois (specific zip codes in 5 regions: West Chicago, South Chicago, Southern Cook County, Peoria, East St. Louis).
- Certified by Illinois Department of Aging’s Community Care Unit (CCU) as meeting nursing home level of care via Determination of Need (DON) score of 29 or higher on Community Health Assessment.
- Able to live safely in the community with PACE services support.
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice.

**Benefits:** Comprehensive, all-inclusive health and long-term care services 24/7/365, including primary care at PACE center (with clinic, therapeutic recreation, restorative therapies, socialization, personal care, dining); home care; inpatient services up to acute or long-term care facilities if needed; all Medicare/Medicaid-covered services plus additional as required (e.g., any/all services in Illinois Public Aid Code Article V). No specific dollar amounts or hours stated; individualized and unlimited as needed.
- Varies by: region

**How to apply:**
- Start with Illinois Department of Aging’s Community Care Unit (CCU) for initial assessment (contact via local CCU or statewide info).
- Phone: Use PACE provider-specific numbers or HFS helpline (not specified; search zip code on HFS site).
- Online: Search PACE programs by zip code at https://hfs.illinois.gov/medicalproviders/pace.html; detailed zip list available there.
- In-person: At PACE centers or CCUs in service areas.
- If DON score 29+ and other criteria met, PACE organization handles final enrollment via agreement.

**Timeline:** Not specified; initial DON assessment by CCU, then PACE final determination.
**Waitlist:** Possible due to limited enrollment and new program (launched 2024; only ~16 participants as of mid-2024 across 3 organizations).

**Watch out for:**
- Not statewide—must live in exact service zip codes; check eligibility first.
- New program in IL (launched 2024), very low enrollment so far, potential long waitlists.
- Electing PACE means no longer eligible for regular Medicare/Medicaid payments—full switch to PACE model.
- Must disenroll from Medicare Advantage, Part D, or hospice to join.
- Voluntary but frail elderly focus; average participant 76 with complex needs.
- Private pay possible but most are dual eligibles.

**Data shape:** Limited to 5 specific regions/zip codes with separate PACE organizations; no direct income/asset test for PACE but tied to nursing home level via DON score; very new in IL with minimal enrollment.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hfs.illinois.gov/medicalproviders/pace.html

---

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"description":"Income limits are based on Federal Poverty Level (FPL) and change annually in April. For 2026 in Illinois:","QMB":{"threshold":"100% FPL","individual_monthly":"$1,330","couple_monthly":"$1,803"},"SLMB":{"threshold":"120% FPL","individual_monthly":"$1,596","couple_monthly":"$2,164"},"QI_1":{"threshold":"Above QMB/SLMB limits","note":"Higher income limit than SLMB; exact 2026 amount not specified in search results"},"income_exclusions":"The program excludes certain income from the calculation: the first $20 of monthly income, the first $65 of wages, half of wages above $65, food stamps, settlement payments to eligible Native Americans, some federal judgment distributions, up to $2,000 per year of Native American trust income, student loans/grants from Department of Education or Bureau of Indian Affairs, and funds from the Claims Resolution Act of 2010"}
- Assets: {"QMB":{"individual":"$9,950","couple":"$14,910"},"SLMB":{"individual":"$9,950","couple":"$14,910"},"note":"Asset limits are the same for QMB and SLMB. Search results do not specify what counts toward assets or what is exempt."}
- Must be enrolled in Medicare Part A
- Must be a resident of Illinois
- Must meet non-financial Medicaid eligibility requirements (including having a Social Security number)
- Persons age 22-64 residing in DHS facilities that are not covered settings are not eligible for QMB
- For QI-1 specifically: cannot be eligible for Medicaid

**Benefits:** N/A
- Varies by: program_tier

**How to apply:**
- [object Object]
- [object Object]
- [object Object]

**Timeline:** Not specified in search results
**Waitlist:** QI-1 is awarded on a first-come, first-served basis with limited spots each year; no waitlist information provided for QMB or SLMB

**Watch out for:**
- Income limits change every April; families must reapply or verify eligibility annually
- QMB premiums are paid effective the month after the month of eligibility determination — there is a one-month lag
- SLMB Part B premiums may be backdated up to 3 additional months from the application month, but QMB does not have this backdating provision
- QI-1 requires annual reapplication and is awarded on a first-come, first-served basis with limited spots — it is not guaranteed
- If eligible for Medicaid, you cannot use QI-1 but may qualify for QMB or SLMB instead
- The program only applies to Original Medicare (Parts A and B); it does not affect Medicare Advantage (Part C) or Medigap plans
- Asset limits are relatively low ($9,950 for individuals, $14,910 for couples); families with modest savings may exceed limits
- Persons age 22-64 in certain DHS facilities are explicitly excluded from QMB eligibility
- A person recently enrolled in Part A is not considered a QMB until the first month they actually receive Part A coverage

**Data shape:** This is actually three separate but related programs with a tiered structure: QMB (broadest benefits, lowest income limit at 100% FPL), SLMB (narrower benefits, higher income limit at 120% FPL), and QI-1 (narrowest benefits, highest income limit, limited availability). Families should apply for QMB first; if ineligible due to income, they cascade to SLMB; if still ineligible, they may qualify for QI-1. Income limits are tied to Federal Poverty Level and adjust annually in April. The same asset limits apply to QMB and SLMB. Processing timelines and regional office locations are not detailed in available search results.

**Source:** https://hfs.illinois.gov/info/brochures-and-forms/brochures/hfs3352.html

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with elderly (60+) or disabled members in Illinois, the gross income limit is 200% of the Federal Poverty Level (FPL). Specific 2025 annual limits include $15,060 for one person or $20,440 for two people (monthly equivalents apply). Limits scale by household size; use the official calculator for exact figures as they adjust annually (e.g., Oct 1, 2025–Sept 30, 2026). Net income is calculated after deductions including 20% earned income, standard deduction ($205 for ≤3 people, $219 for ≥4), dependent care, excess medical costs over $35/month for elderly/disabled, and shelter costs.[1][3][4][5][6]
- Assets: Households with elderly (60+) or disabled members have higher resource limits, typically up to $4,500 (exact amount confirmed via state rules). Exempt assets include primary home, most retirement savings, and certain vehicles. Countable resources are cash, bank accounts, and non-exempt property.[1][4]
- Illinois resident
- U.S. citizen or qualified non-citizen
- Social Security number (or proof of application)
- Able-bodied adults must register for work (exceptions for elderly/disabled)
- Household includes those who buy/prepare food together
- For simplified redetermination (EDSRP): All adults in household must be elderly (60+) and/or disabled (no minor children unless adults qualify)

**Benefits:** Monthly EBT card benefits for food purchases (groceries at authorized retailers). Amount based on household size, net income, and deductions (e.g., example: 2-person elderly/disabled household with $1,200 gross might get $415/month after calculations). Maximum allotments vary (e.g., $546 for 2-person in contiguous states); actual amount is 30% of net income subtracted from max allotment.[1][5]
- Varies by: household_size

**How to apply:**
- Online: https://www.dhs.state.il.us/page.aspx?item=30357 or https://fscalc.dhs.illinois.gov/FSCalc/ (eligibility calculator)
- Phone: Local IDHS office (find via 1-800-843-6154 or regional numbers)
- Mail: Send to local IDHS Family Community Resource Center
- In-person: Local IDHS Family Community Resource Center (offices statewide)

**Timeline:** Typically 30 days; expedited within 7 days if very low income/no assets

**Watch out for:**
- Seniors often miss deducting medical expenses over $35/month, which can significantly increase benefits
- Social Security/pensions count as income, but many eligible seniors don't apply (only half participate)
- Household must include food-sharing members; living with family doesn't disqualify if income pooled
- New 2025 rules may affect work requirements for ages 55-64 without dependents (80 hours/month work/training)
- EDSRP simplifies recertification only if all adults elderly/disabled
- Assets exempt for seniors (home, retirement savings), unlike standard households

**Data shape:** Elderly/disabled households get higher income (200% FPL) and asset limits, excess medical/shelter deductions, and simplified redetermination; benefits scale precisely by household size and net income after unique deductions

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhs.state.il.us/page.aspx?item=30357

---

### Illinois Home Weatherization Assistance Program (IHWAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 200% of the federal poverty level (PY2026 guidelines). For households of 1-12: 1: $31,300; 2: $42,300; 3: $53,300 (add $11,000 per additional member over 12). Older guidelines (2020) showed 1: $25,520-$25,760; 2: $34,480-$34,840; 3: $43,440-$43,920; 4: $52,400-$53,000; 5: $61,360-$62,080; 6: $70,320-$71,160. Some funding at 150% FPL or 60% State Median Income ($2,307 per additional over 12). Automatic eligibility if received LIHEAP (last 12 months), SSI/Title IV/XVI cash assistance (last 12 months), or enrolled in USDA means-tested programs (e.g., Section 521 Rental Assistance).[2][3][5][9]
- Assets: No asset limits mentioned in sources.
- Household income determined by gross income of all members (90 days prior for some agencies).
- Home must be structurally sound.
- Not served by IHWAP in last 15 years.
- For multi-family: 66% of units (or 50% in some cases) occupied by income-eligible tenants; entire building applies.
- Single-family: owner-occupied up to 4 units, or renters with landlord consent.
- Proof of ownership or lease required.
- Priority for households with elderly (60+), disabled members, or children 5 and under.[1][2][4][5][7]

**Benefits:** Free weatherization services: air sealing, attic/wall insulation, HVAC repair/replacement, water heater repair/replacement, electric base load reduction (lighting/refrigerator replacement), ventilation/moisture control, other health/safety measures. Max $15,000-$20,000 per home for energy work; $3,500-$4,000 for health/safety.[2][5]
- Varies by: priority_tier

**How to apply:**
- Phone: 1-877-411-WARM (9276) or 1-800-571-2332 to find local agency.
- Online pre-application via DCEO (Illinois Department of Commerce and Economic Opportunity).
- Local Community Action Agencies (CAAs), partner intake sites, or in-person (e.g., CEDA, Will County, Tri-County).
- Mail or full application after pre-approval (upload/submit documents).[2][4][6]

**Timeline:** Pre-application review several months; full application after approval.
**Waitlist:** Prioritized service; non-priority households served if funding available, may not receive in application year.

**Watch out for:**
- Priority for elderly/disabled/young children; non-priority may wait or miss funding year.
- Home must be structurally sound and not weatherized in last 15 years.
- Multi-family requires 66% (or 50%) eligible tenants.
- Landlord consent/proof needed for renters.
- Income is combined household; automatic eligibility via LIHEAP/SSI/USDA missed by some.
- Processing can take months; pre-application first.[4][5][7]

**Data shape:** Statewide via county CAAs with priority tiers; income at 200% FPL (varies by year/household size); funding-limited waitlists; multi-family building-level rules.

**Source:** https://dceo.illinois.gov/communityservices/homeweatherization.html

---

### Senior Health Insurance Program (SHIP)


**Eligibility:**
- Income: Not specified in available sources. SHIP serves Medicare beneficiaries (typically age 65+) and those under 65 with disabilities. Some services target people with limited incomes, but specific income thresholds are not documented in search results.
- Assets: Not specified in available sources.
- Must be a Medicare beneficiary or caregiver of a Medicare beneficiary[1][2]
- Must be a current Medicare beneficiary or 'new' to Medicare[2]
- Services available by appointment only[2]

**Benefits:** Free, one-on-one confidential counseling sessions with certified counselors. No dollar limits specified. Services include: education and answers about Medicare (Parts A, B, C, D), Medicare Supplement (Medigap), long-term care insurance, Medicare Advantage Plans, private fee-for-service plans; assistance organizing and filing Medicare and Medicare Supplement claims; analysis and comparison of Medicare Supplement, Medicare Advantage, and Medicare Part D plans; screening for Extra Help for prescription coverage and Medicaid programs; assistance applying for Medicare Savings Program and Low Income Subsidy programs[2][7][8]. SHIP also provides publications including annual Medicare Supplement Premium Comparison Guide and long-term care insurance booklets[1].

**How to apply:**
- Phone: 1-800-252-8966 (toll-free)[1][3][5]
- TDD/Relay: Dial 711 or 1-888-206-1327[1][5]
- Email: Aging.SHIP@illinois.gov[1]
- In-person: Through Area Agency on Aging (AAA) network offices throughout Illinois[1]
- Website: https://ilaging.illinois.gov/ship.html[1][3]

**Timeline:** Not specified in available sources. Counseling sessions are by appointment only[2].
**Waitlist:** Not specified in available sources.

**Watch out for:**
- SHIP is NOT insurance — it's a counseling service. SHIP counselors do not sell or solicit any type of insurance and are not affiliated with any insurance company[2][8].
- Services are by appointment only; you cannot walk in[2].
- SHIP is free, but you must contact them to schedule a counseling session — there is no online self-service application or instant enrollment[3].
- While SHIP screens for Extra Help and Medicaid programs, it does not directly enroll you; counselors assist with the application process[2][7].
- The program has been operating since 1988 (SHIP) and 1978 (related SHAP program)[1], but specific income/asset limits are not published in publicly available materials — you must contact SHIP directly to determine eligibility for specific assistance programs.
- SHIP also offers Senior Medicare Patrol (SMP) services in some cases to help detect and report health care fraud, errors, and abuse[7], but this is not guaranteed at all locations.

**Data shape:** SHIP is a counseling and advocacy program, not a direct financial assistance program. There are no published income limits, asset limits, or benefit caps in the available sources. Eligibility is straightforward (Medicare beneficiary or caregiver), but the specific assistance available depends on individual circumstances and is determined during one-on-one counseling sessions. The program is delivered through a decentralized network of Area Agencies on Aging, so contact information and hours vary by location. No online application exists; all access is through phone, email, or in-person appointment.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/ship.html

---

### Community Care Program Home Delivered Meals


**Eligibility:**
- Age: 60+
- Income: Monthly income below federal poverty level for free services; above that, services cost based on need level, service costs, and CCP fee schedules (certain income excluded; exact dollar amounts not specified in sources, consult CCP representative). No full table by household size provided.
- Assets: Non-exempt assets of $17,500 or less. Exempt: home and furnishings, personal clothing and effects, cars (not recreational vehicles), prepaid burial plan, burial plots and markers.
- Illinois resident
- U.S. citizen or eligible non-citizen (e.g., lawful permanent resident)
- Assessed need for long-term care via Determination of Need (DON) assessment (minimum score of 29; higher score = more services)
- Apply for and enroll in Medicaid if eligible
- At risk for nursing facility placement

**Benefits:** Home-delivered nutritious meals (at least 1/3 of daily recommended dietary allowances); minimum 5 meals per week (Monday-Friday, some offer weekends/dinners); may include ethnically/culturally tailored options (e.g., Kosher, South Asian, Korean, Halal, Latino/Hispanic); delivered with safety check and conversation.
- Varies by: priority_tier

**How to apply:**
- Contact local Care Coordination Unit (CCU) for in-home DON assessment and referral (find via https://services.ageoptions.org/ or Area Agency on Aging map at https://ilaging.illinois.gov/programs/nutrition/nutrition.html)
- Phone examples by region: AgeOptions suburban Cook (via referral webpage), DuPage (800-942-9412), Grundy (815-941-3404), Kendall (800-339-3200), Will (815-723-9713)
- If in Managed Care Organization (MCO), contact MCO case manager for assessment and referral

**Timeline:** Not specified
**Waitlist:** Not specified; may vary by region and provider

**Watch out for:**
- Home Delivered Meals are one service within broader CCP; requires full DON assessment and Medicaid application/enrollment
- Not standalone—tied to assessed long-term care need (DON score ≥29)
- Costs if income > federal poverty level; assets strictly limited excluding only specified exempt items
- Must contact local CCU/AAA, not apply directly; regional providers differ
- Separate from pure Nutrition Program (which has no asset test)

**Data shape:** Tied to CCP's comprehensive assessment (DON score determines service level/quantity); delivered via local/regional AAAs and providers, not centralized; requires Medicaid enrollment process; varies by culturally specific options and minimum 5 meals/week with potential extras.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/programs/ccp.html

---

### Community Care Program (CCP) - Illinois


**Eligibility:**
- Age: 60+
- Income: Not specified in search results. Income eligibility is checked against multiple Illinois Medicaid programs and HCBS programs, which have varying thresholds. Contact local Area Agency on Aging or call (800) 252-8966 for specific income limits applicable to your household.
- Assets: {"threshold":"$17,500 for non-exempt assets","exempt_assets":["Primary residence (home)","One vehicle","Personal furnishings"],"note":"Only non-exempt assets count toward the $17,500 limit"}
- U.S. citizen or eligible non-citizen within specific categories
- Resident of Illinois
- Assessed need for long-term care (must be at risk for nursing facility placement as measured by Determination of Need (DON) assessment)
- For in-home care aide services: family member cannot have power of attorney over participant, and family member and participant cannot have joint bank accounts or other financial mingling

**Benefits:** Comprehensive in-home and community-based services including: case management/care coordination, in-home services (meal planning/cooking, housekeeping, shopping, personal care like bathing/dressing, laundry, medication reminders, transportation to appointments), adult day services, emergency home response services, automated medication dispenser service, and senior companion program (in some counties). No cost to participant unless determined otherwise during assessment.
- Varies by: Individual need and county (some counties offer Senior Companion Program, others may not). Services are individualized based on Determination of Need assessment and care plan.

**How to apply:**
- Phone: Illinois Department on Aging Senior HelpLine at (800) 252-8966 or (888) 206-1327 (TTY)
- In-person: Contact your local Area Agency on Aging or Caregiver Resource Center
- Online: Check eligibility through communitycareprogram.com (third-party eligibility checker that screens against multiple Illinois Medicaid and HCBS programs)
- Mail: Contact local Area Agency on Aging for mailing address

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results. Contact local Area Agency on Aging for current waitlist status.

**Watch out for:**
- Program is specifically for individuals at risk of nursing facility placement — you must have an assessed need for long-term care. Not all seniors age 60+ qualify; the DON assessment is critical.
- Asset limit of $17,500 is strict. While home, car, and personal furnishings are exempt, other assets count. This can disqualify middle-class seniors with savings or investments.
- If a family member wants to be hired as the paid home care aide, they cannot have power of attorney over the participant and cannot have joint bank accounts — this is a common disqualifier.
- Income eligibility is checked against multiple Medicaid programs with varying thresholds — there is no single income limit stated. You must contact your local Area Agency on Aging to determine if you qualify.
- Program is funded through Medicaid waiver (1915(c) waiver), so Medicaid eligibility may be required or affect services.
- No cost to participant is stated as the default, but the search results note 'unless determined by CCU during assessment process' — clarify any potential costs with your local provider.
- Processing time and waitlist status are not publicly specified — contact your local Area Agency on Aging directly, as this may vary significantly by region.

**Data shape:** This program is complex because it operates through multiple local Area Agencies on Aging with individualized assessments (DON). Benefits are not fixed dollar amounts or hours but are tailored to each person's care plan. Eligibility is checked against multiple overlapping Medicaid programs, making income limits variable. The program has been established since 1979 and is one of the largest home and community-based services programs in Illinois, but specific details like processing times, waitlists, and exact income thresholds require direct contact with local providers. Family caregiver eligibility for paid care varies by program tier and care needs level.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/programs/ccp.html

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level (exact dollar amounts set annually by U.S. Department of Health and Human Services; varies by household size—check current HHS poverty guidelines for table, e.g., for 2025: 1-person ~$19,563, 2-person ~$26,397). No specific table provided in sources.
- Assets: No asset limits mentioned.
- Unemployed and actively seeking employment
- Capable of performing community service tasks
- U.S. resident in service area with available funding
- Priority for veterans, qualified spouses of veterans, and those over age 65

**Benefits:** Part-time on-the-job training (typically 20 hours/week) at minimum wage (Illinois state minimum $8.25/hour or higher of federal/state/local); personalized employment counseling, skills training (resume writing, interviewing, computer skills), job search assistance; placements in community/non-profit agencies (schools, hospitals, senior centers, etc.) to gain skills for unsubsidized employment.
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging
- Call Illinois Department on Aging Senior HelpLine (specific number not listed; search 'Illinois Senior HelpLine')
- Contact local SCSEP sub-grantee or national contractor (7 state sub-grantees and 7 national contractors in IL, e.g., CWI Works, Goodwill, National Able)
- Access employment assistance via American Job Centers

**Timeline:** Not specified.
**Waitlist:** May exist due to limited funding/slots; varies by local availability.

**Watch out for:**
- Not permanent employment—temporary training bridge to unsubsidized jobs (limited duration)
- Must be unemployed and actively job-seeking; not for retirees wanting supplemental income without employment goals
- Priority enrollment for veterans/65+ may create waitlists for others
- Income limit strictly 125% poverty (recent 3 months + projected annual); varies by household size
- Requires community service commitment and development of Individual Employment Plan
- Wage is minimum (not living wage); part-time only

**Data shape:** Federally funded via DOL/Older Americans Act, locally administered by multiple sub-grantees/national contractors; eligibility fixed at 125% poverty (scales by household size); priority tiers (veterans first); slots limited by funding, leading to regional waitlists

**Source:** https://ilaging.illinois.gov/programs/employ.html

---

### Illinois Long-Term Care Ombudsman Program (LTCOP)


**Eligibility:**
- Age: 60+
- Income: Not specified in available sources — no income limits documented
- Assets: Not specified in available sources — no asset limits documented
- Must be a current resident, prospective resident, or former resident of a long-term care facility
- Alternatively, can be a friend/relative of a facility resident, facility staff/administrator with resident concerns, or individual/family considering placement
- No financial requirements to access services

**Benefits:** Ombudsmen advocate on behalf of residents regarding matters affecting health, safety, welfare, or rights. Specific services include: educating residents and families on resident rights, addressing grievances and issues on behalf of residents, starting family councils, and providing information and assistance to facility staff
- Varies by: not_applicable — services are universal to eligible individuals, though specific support may vary by regional program capacity

**How to apply:**
- Phone: 1-800-252-8966 (Senior HelpLine) or 1-888-206-1327 (TTY)
- Phone: Contact your Regional Ombudsman Program directly (varies by county)
- Text: Text your zip code to 898211 (example from DuPage County)
- Mail: Illinois Department on Aging, One Natural Resources Way, Suite 100, Springfield, IL 62702-1271
- Fax: 1-217-524-2049
- Email: Contact Illinois Department on Aging (specific email not provided in sources)
- In-person: Visit your Regional Ombudsman Program office (location varies by county)

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- This is NOT a financial assistance program — it is purely advocacy and complaint resolution. Families seeking financial help for long-term care costs should look elsewhere
- Age requirement is 60+ for residents, but friends, relatives, and facility staff can access services regardless of age
- The program is mandated by the Older Americans Act and Illinois Act on Aging, meaning it is a legal entitlement, not a discretionary service
- Ombudsmen must pass background checks under the Health Care Worker Background Check Act before visiting facilities
- Regional programs vary in capacity and responsiveness — contact your specific regional program for accurate information about wait times and service availability
- The program serves residents in long-term care facilities (nursing homes, assisted living, skilled nursing care facilities) — NOT independent seniors living at home, though the statute mentions advocacy for community-based settings
- No financial requirements means even Medicaid members and those with significant assets qualify equally
- The program can advocate on behalf of residents who cannot speak for themselves

**Data shape:** This program is fundamentally different from financial assistance programs: it provides advocacy and complaint resolution services rather than direct financial or medical benefits. Eligibility is based on residency in a long-term care facility and age (60+), with no income or asset testing. The program is organized regionally, so contact information and specific service details vary significantly by county. Processing times, waitlists, and application procedures are not standardized across regions and are not documented in available sources. The program is universal in scope (statewide) but delivered through regional designations, creating a federated structure.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilga.gov/Documents/legislation/ilcs/documents/002001050K4.04.htm (20 ILCS 105/4.04) and Illinois Department on Aging

---

### Legal Assistance for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by provider and program; typically at or below 125-200% of Federal Poverty Level (FPL). Specific dollar amounts not fixed statewide and assessed holistically per household, considering expenses like taxes, medical costs. Higher limits for seniors in some programs (e.g., Legal Aid Chicago up to 150% FPL, or more for homeowners/seniors). No universal table provided; case-by-case[1][3][4].
- Assets: Limited assets required; assessed for entire household. Specific limits vary by program/provider; no fixed statewide dollar amounts or exemptions detailed[1][3][4].
- Illinois resident (statewide, but some providers limit to specific counties like Chicago/Cook County[1])
- Legal issue must match provider's case types (e.g., civil issues like benefits, housing, consumer[1][7])
- No conflict of interest with provider[1]
- U.S. citizen, permanent resident, or specific immigration statuses for some funders[4]
- Limited resources availability[1][3]

**Benefits:** Civil legal assistance by attorneys or supervised staff, including representation, advice, and referrals on issues like benefits access, housing, consumer protection, guardianship, wills, powers of attorney. Prioritizes elderly/poor; may use pro bono/volunteers. No fixed dollar amounts or hours[1][5][7].
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) via https://ilaging.illinois.gov/programs/legalassistance.html map tool[7]
- Center for Disability & Elder Law (Chicago/Cook): https://www.cdelaw.org/how-to-qualify-request-help[1]
- Prairie State Legal Services (Northern IL except Cook): Online intake via https://pslegal.org/How-To-Get-Started or call local office (e.g., 815.965.2134)[3][8]
- Legal Aid Chicago: https://legalaidchicago.org/get-help/am-i-eligible-for-legal-aid/[4]
- Land of Lincoln (Southern IL): www.lollaf.org, 800.642.5570[8]
- Illinois Legal Aid Online tools: https://www.illinoislegalaid.org/legal-information/population/senior-60-years-or-older[6]

**Timeline:** Not specified; screening upon contact[3]
**Waitlist:** Limited resources may result in denials or referrals; no formal waitlist detailed[1][3]

**Watch out for:**
- Not a single program but network of funded providers with varying criteria/funding; may be turned away due to limited resources or case type mismatch[1][3][7]
- Must contact local provider/AAA; no central application[7]
- Higher incomes/assets may qualify under specific grants but assessed case-by-case[1][3]
- Elderly prioritized but disability can qualify under 60; immigration status matters for some[1][4]

**Data shape:** Decentralized statewide network via local AAAs/providers; eligibility/criteria vary by provider, program, funding source, and region; no uniform income/asset tables or fixed benefits

**Source:** https://ilaging.illinois.gov/programs/legalassistance.html

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medical Assistance (Medicaid) for Senior | benefit | state | deep |
| Home Services Program (HSP) Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Qualified Medicare Beneficiary (QMB), Sp | benefit | federal | medium |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Illinois Home Weatherization Assistance  | benefit | federal | deep |
| Senior Health Insurance Program (SHIP) | resource | federal | simple |
| Community Care Program Home Delivered Me | benefit | state | deep |
| Community Care Program (CCP) - Illinois | resource | state | simple |
| Senior Community Service Employment Prog | employment | federal | deep |
| Illinois Long-Term Care Ombudsman Progra | resource | federal | simple |
| Legal Assistance for Seniors | resource | state | simple |

**Types:** {"benefit":7,"resource":4,"employment":1}
**Scopes:** {"state":5,"local":1,"federal":6}
**Complexity:** {"deep":7,"medium":1,"simple":4}

## Content Drafts

Generated 12 page drafts. Review in admin dashboard or `data/pipeline/IL/drafts.json`.

- **Medical Assistance (Medicaid) for Seniors/Disabled** (benefit) — 6 content sections, 6 FAQs
- **Home Services Program (HSP) Waiver** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)** (benefit) — 5 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Illinois Home Weatherization Assistance Program (IHWAP)** (benefit) — 5 content sections, 6 FAQs
- **Senior Health Insurance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Community Care Program Home Delivered Meals** (benefit) — 5 content sections, 6 FAQs
- **Community Care Program (CCP) - Illinois** (resource) — 2 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Illinois Long-Term Care Ombudsman Program (LTCOP)** (resource) — 2 content sections, 6 FAQs
- **Legal Assistance for Seniors** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **region**: 1 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **not_applicable**: 1 programs
- **Individual need and county (some counties offer Senior Companion Program, others may not). Services are individualized based on Determination of Need assessment and care plan.**: 1 programs
- **not_applicable — services are universal to eligible individuals, though specific support may vary by regional program capacity**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medical Assistance (Medicaid) for Seniors/Disabled**: Complex multi-pathway structure: income-only (ACA), asset-tested (AABD), working premium (HBWD), waiver with NFLOC; limits updated annually (April for waivers); no uniform household table in sources but FPG-based scaling.
- **Home Services Program (HSP) Waiver**: Multiple waivers under HSP umbrella (e.g., PWD under 60, Brain Injury any age, HIV/AIDS any age); eligibility via DON score tier; asset-based not income table; statewide but local DRS delivery with managed care split
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to 5 specific regions/zip codes with separate PACE organizations; no direct income/asset test for PACE but tied to nursing home level via DON score; very new in IL with minimal enrollment.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)**: This is actually three separate but related programs with a tiered structure: QMB (broadest benefits, lowest income limit at 100% FPL), SLMB (narrower benefits, higher income limit at 120% FPL), and QI-1 (narrowest benefits, highest income limit, limited availability). Families should apply for QMB first; if ineligible due to income, they cascade to SLMB; if still ineligible, they may qualify for QI-1. Income limits are tied to Federal Poverty Level and adjust annually in April. The same asset limits apply to QMB and SLMB. Processing timelines and regional office locations are not detailed in available search results.
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly/disabled households get higher income (200% FPL) and asset limits, excess medical/shelter deductions, and simplified redetermination; benefits scale precisely by household size and net income after unique deductions
- **Illinois Home Weatherization Assistance Program (IHWAP)**: Statewide via county CAAs with priority tiers; income at 200% FPL (varies by year/household size); funding-limited waitlists; multi-family building-level rules.
- **Senior Health Insurance Program (SHIP)**: SHIP is a counseling and advocacy program, not a direct financial assistance program. There are no published income limits, asset limits, or benefit caps in the available sources. Eligibility is straightforward (Medicare beneficiary or caregiver), but the specific assistance available depends on individual circumstances and is determined during one-on-one counseling sessions. The program is delivered through a decentralized network of Area Agencies on Aging, so contact information and hours vary by location. No online application exists; all access is through phone, email, or in-person appointment.
- **Community Care Program Home Delivered Meals**: Tied to CCP's comprehensive assessment (DON score determines service level/quantity); delivered via local/regional AAAs and providers, not centralized; requires Medicaid enrollment process; varies by culturally specific options and minimum 5 meals/week with potential extras.
- **Community Care Program (CCP) - Illinois**: This program is complex because it operates through multiple local Area Agencies on Aging with individualized assessments (DON). Benefits are not fixed dollar amounts or hours but are tailored to each person's care plan. Eligibility is checked against multiple overlapping Medicaid programs, making income limits variable. The program has been established since 1979 and is one of the largest home and community-based services programs in Illinois, but specific details like processing times, waitlists, and exact income thresholds require direct contact with local providers. Family caregiver eligibility for paid care varies by program tier and care needs level.
- **Senior Community Service Employment Program (SCSEP)**: Federally funded via DOL/Older Americans Act, locally administered by multiple sub-grantees/national contractors; eligibility fixed at 125% poverty (scales by household size); priority tiers (veterans first); slots limited by funding, leading to regional waitlists
- **Illinois Long-Term Care Ombudsman Program (LTCOP)**: This program is fundamentally different from financial assistance programs: it provides advocacy and complaint resolution services rather than direct financial or medical benefits. Eligibility is based on residency in a long-term care facility and age (60+), with no income or asset testing. The program is organized regionally, so contact information and specific service details vary significantly by county. Processing times, waitlists, and application procedures are not standardized across regions and are not documented in available sources. The program is universal in scope (statewide) but delivered through regional designations, creating a federated structure.
- **Legal Assistance for Seniors**: Decentralized statewide network via local AAAs/providers; eligibility/criteria vary by provider, program, funding source, and region; no uniform income/asset tables or fixed benefits

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Illinois?
