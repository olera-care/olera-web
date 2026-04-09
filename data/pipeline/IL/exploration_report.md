# Illinois Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 1.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 15 |
| New (not in our data) | 8 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 6 programs
- **in_kind services**: 1 programs
- **financial**: 3 programs
- **advocacy**: 2 programs
- **in_kind**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Illinois PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$1304` → Source says `$2,901` ([source](https://hfs.illinois.gov/medicalproviders/pace.html))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive, all-inclusive care 24/7/365: primary care clinic at PACE center, therapeutic recreation, restorative therapies, socialization, personal care, dining, home care, inpatient (acute/long-term when needed), prescription drugs, transportation. Covers all Medicare/Medicaid services; sole source for enrollees. No specific dollar amounts or hours stated—customized per participant via interdisciplinary team.[1][3][7]` ([source](https://hfs.illinois.gov/medicalproviders/pace.html))
- **source_url**: Ours says `MISSING` → Source says `https://hfs.illinois.gov/medicalproviders/pace.html`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1304` → Source says `$20` ([source](https://hfs.illinois.gov/medicalclients/medicare_savings_programs/medicaresavingsprograms.html or https://www.dhs.state.il.us/page.aspx?item=14172[6]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A/B premiums, deductibles, coinsurance/copayments (e.g., 20% Part B, extended stays)[4][5]
SLMB/SLIB: Part B premiums only ($202.90/month in 2026)[3][4]
QI-1: Part B premiums only; auto-qualifies for Extra Help drug program[1][5]` ([source](https://hfs.illinois.gov/medicalclients/medicare_savings_programs/medicaresavingsprograms.html or https://www.dhs.state.il.us/page.aspx?item=14172[6]))
- **source_url**: Ours says `MISSING` → Source says `https://hfs.illinois.gov/medicalclients/medicare_savings_programs/medicaresavingsprograms.html or https://www.dhs.state.il.us/page.aspx?item=14172[6]`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **income_limit**: Ours says `$2000` → Source says `$15,060` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card (Link card in IL) for groceries; amount based on household size, net income (e.g., max allotment for 2-person elderly/disabled: $546/month, minus 30% net income). Exact amount calculated after deductions[1][6].` ([source](https://www.dhs.state.il.us/page.aspx?item=30357))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhs.state.il.us/page.aspx?item=30357`

### Senior Health Insurance Program (SHIP)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, unbiased, personalized health insurance counseling including: education on Medicare (Parts A-D), Medicare supplements, Medicare Part D, Medicare Advantage, long-term care insurance; assistance with enrollment in Part D and extra financial help for Part B/D premiums; help filing claims, analyzing policies, resolving billing issues and appeals; community education seminars.` ([source](https://ilaging.illinois.gov/ship.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/ship.html`

### Community Care Program (CCP) Home Delivered Meals

- **min_age**: Ours says `65` → Source says `60` ([source](https://ilaging.illinois.gov/programs/nutrition/nutrition.html))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered meals meeting at least one-third of daily recommended dietary allowances. Minimum of five meals per week in most areas; some programs offer additional meals for dinners and/or weekends.[5][6] Meals are volunteer-delivered, providing a safety check and face-to-face conversation.[5]` ([source](https://ilaging.illinois.gov/programs/nutrition/nutrition.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/programs/nutrition/nutrition.html`

### Illinois Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Support services including training and education on caregiving skills and self-care, support groups to share experiences. Provides resources for unpaid family caregivers of adults 60+ (including those with Alzheimer's), grandparents/relative caregivers of children ≤18 (including those with developmental disabilities). Related Community Care Program enables paid family caregiving (e.g., $20/hour via some agencies) with personalized care plans for in-home assistance with activities of daily living.` ([source](https://ilaging.illinois.gov/programs/caregiver/program.html))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov/programs/caregiver/program.html`

### Long-Term Care Ombudsman Program

- **min_age**: Ours says `65` → Source says `60` ([source](https://ilaging.illinois.gov (Illinois Department on Aging)))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints (e.g., neglect, abuse, rights violations); investigation of concerns; education on resident rights, long-term care options, and services; promotion of quality of life and care; facilitation of family councils; routine facility visits; assistance to facility staff; intervention in private homes/community settings for older persons/disabilities[1][2][4][5][7][8]` ([source](https://ilaging.illinois.gov (Illinois Department on Aging)))
- **source_url**: Ours says `MISSING` → Source says `https://ilaging.illinois.gov (Illinois Department on Aging)`

## New Programs (Not in Our Data)

- **Medical Assistance/Medicaid** — service ([source](https://hfs.illinois.gov/medicalclients/health/benefitshfs.html))
  - Shape notes: Varies by sub-program (AABD vs. Nursing Home), marital status, and care level; income/asset limits program-specific and annually adjusted; benefits tiered by functional assessment
- **Home Services Program (HSP) Waiver** — in_kind services ([source](https://www.dhs.state.il.us/page.aspx?item=29738))
  - Shape notes: HSP is age-restricted (under 60, with exceptions for HIV/AIDS and Brain Injury waivers), asset-tested, and Medicaid-linked. It is NOT an entitlement program—eligibility does not guarantee enrollment due to limited slots. The program has specialized tracks for HIV/AIDS and traumatic brain injury with different age rules. Case management is split between managed care (70%) and fee-for-service (30%), which affects service planning. Specific dollar amounts for services, processing timelines, and detailed application procedures are not available in provided search results.
- **Illinois Home Weatherization Assistance Program (IHWAP)** — service ([source](https://dceo.illinois.gov/communityservices/homeweatherization.html[3]))
  - Shape notes: Statewide via local agencies with priority tiers (elderly/disabled/children first); income at 200% FPL with categorical eligibility; multi-family tenant thresholds; annual federal poverty updates; varying waitlists by region.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://ilaging.illinois.gov/programs/employ.html))
  - Shape notes: Administered via multiple local sub-grantees/national contractors (14 total in IL) through Area Agencies on Aging; eligibility fixed federally but slots vary regionally by funding/service area; priority tiers affect access; no asset test, income scales by household poverty guidelines.
- **Illinois Legal Aid Online / Senior Legal Helpline** — service ([source](illinoislegalaid.org and ilaging.illinois.gov))
  - Shape notes: This program is highly fragmented by region and provider. There is no single 'Illinois Legal Aid Online' entity — rather, it's a portal connecting users to local legal aid organizations and Area Agencies on Aging. Income limits, service types, and processing times vary significantly by location. Seniors (60+) receive priority and may have different eligibility rules than younger populations. The program explicitly acknowledges insufficient capacity to serve all eligible applicants. Asset limits and specific benefit amounts are not publicly detailed in available sources.
- **Illinois Senior Citizens and Persons with Disabilities Property Tax Relief** — financial ([source](https://tax.illinois.gov/research/publications/pio-64.html))
  - Shape notes: Statewide loan-style deferral with phased income increases ($75k 2025, $77k 2026, $79k+ 2027); county-administered with annual reapplication; fixed $7,500 cap per household regardless of size; lien and interest create repayment obligation unlike pure exemptions.
- **Benefit Access Program (Seniors Ride Free & License Plate Discount)** — in_kind ([source](https://ilaging.illinois.gov/benefitsaccess.html[3]))
  - Shape notes: Income-tested with fixed household size tiers up to 3 persons; no asset test; statewide but local transit variations; one vehicle limit per household
- **Health Benefits for Immigrant Seniors (HBIS)** — service ([source](https://hfs.illinois.gov/medicalclients/healthbenefitsforimmigrants/healthbenefitsforimmigrantseniors.html))
  - Shape notes: Enrollment paused for new applicants; ongoing for pre-2023 enrollees with annual renewals. Income/asset limits fixed for single/couple, no full household table. Statewide with no regional variations noted.

## Program Details

### Medical Assistance/Medicaid

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For elderly (65+) applying for long-term care via AABD Medicaid or Nursing Home Medicaid: Single applicant - $1,304/month (AABD, Apr 2025-Mar 2026) or $1,330/month (Nursing Home, Apr 2026-Mar 2027). Couples: Approximately $1,703/month (2025). Income includes Social Security, pensions, wages, etc. Varies by program and marital status; spousal income may count if only one applies. 138% FPG for general income-based (~$1,255/month individual, 2025). Full table not provided; consult official test for household size.
- Assets: Single: $2,000-$17,500 countable assets depending on program (e.g., $17,500 Nursing Home 2026, $2,000 AABD). Couples: $3,000. Countable: bank accounts, stocks, secondary properties. Exempt: primary home (if spouse/child under 21/permanently disabled child lives there, or equity ≤$752,000 in 2026), one vehicle, personal belongings, prepaid burial, certain veterans' benefits.
- U.S. citizen or qualified immigrant
- Illinois resident
- Blind, disabled, or aged 65+
- Nursing Home Level of Care or functional assessment for long-term care (ADLs/IADLs: mobility, bathing, dressing, eating, toileting, shopping, cooking, housekeeping, medication management)
- Not qualifying for Medicare in some categories (exceptions for parents/caretakers)

**Benefits:** Long-term care services: nursing home care (full benefits immediately if eligible); home/community-based: in-home personal care, adult day care, meal delivery, home modifications, Personal Emergency Response Systems (PERS) - provided one at a time based on assessment. Also basic healthcare: physician visits, prescriptions, ER, short-term hospital.
- Varies by: priority_tier

**How to apply:**
- Online: Illinois Web Benefits (ABE) at hfs.illinois.gov
- Phone: Local Illinois Department of Human Services Family Community Resource Center (FCRC)
- Mail/In-person: Download application and send/visit FCRC office

**Timeline:** Not specified in sources
**Waitlist:** Benefits assessed one at a time for AABD (not immediate like Nursing Home); no general waitlist mentioned

**Watch out for:**
- Multiple programs (AABD, Nursing Home, HCBS Waivers) with varying income/asset limits and benefit delivery (e.g., AABD benefits one-at-a-time vs. immediate Nursing Home)
- Spousal rules: Community spouse protections but income may count if only one applies; no Community Spouse Maintenance Needs Allowance in some cases
- Home equity limit $752,000 if no qualifying resident
- Functional assessment required for long-term care; not automatic
- Asset spend-down planning needed; limits differ by program (e.g., $2,000 vs. $17,500)
- Medicare interaction: Some categories exclude Medicare qualifiers

**Data shape:** Varies by sub-program (AABD vs. Nursing Home), marital status, and care level; income/asset limits program-specific and annually adjusted; benefits tiered by functional assessment

**Source:** https://hfs.illinois.gov/medicalclients/health/benefitshfs.html

---

### Home Services Program (HSP) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: Under 60 at time of application. Exception: No age limit for HIV/AIDS Waiver or Brain Injury Waiver applicants[3][6]+
- Income: No specific income limit stated in search results. Applicants must have applied for Medicaid, be a Medicaid recipient, or be found eligible for Medicaid 'spend-down.' Note: You are not required to meet Medicaid eligibility criteria to receive interim services[3]
- Assets: If 18 or older: Cannot exceed $17,500 in non-exempt assets[3][5][6]. If under 18: Family cannot exceed $35,000 in assets[3][5][6]. Exempt assets include: primary residence, one vehicle, ABLE accounts, and others[5]
- U.S. citizen or lawful permanent resident[3][6]
- Resident of Illinois[3][6]
- Severe disability lasting at least 12 months or for life[3][6]
- Determination of Need (DON) score of at least 29[3][6]
- At risk of nursing home placement[6]
- Service needs cost the same or less than nursing home services[3][6]
- Physician certification that long-term care can be safely provided in home[3]

**Benefits:** Specific services include: assistance with Activities of Daily Living (ADL) and Instrumental Activities of Daily Living (IADL), personal assistant (PA) services, adult day care, and specialized services for HIV/AIDS and traumatic brain injury[9]. Exact hours or dollar caps not specified in search results
- Varies by: Individual service plan; specialized tracks for HIV/AIDS and Brain Injury populations[9]

**How to apply:**
- Contact Illinois Department of Rehabilitation Services (DRS) - specific phone number not provided in search results
- Online: https://www.dhs.state.il.us/page.aspx?item=29738 (HSP main page)
- Mail or in-person: Contact DRS directly (specific addresses not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not explicitly stated for HSP, but HCBS waivers generally are not entitlements—meeting eligibility does not guarantee enrollment; limited participant slots exist[4]

**Watch out for:**
- AGE BARRIER: HSP is NOT for elderly people. The program serves people under 60 with severe disabilities[9][10]. Families with elderly relatives should apply for the 'Persons who are Elderly Waiver' instead (age 65+, or 60-64 if physically disabled)[4]
- NOT AN ENTITLEMENT: Meeting eligibility requirements does NOT guarantee enrollment. Limited slots exist; waitlists form when full[4]
- DON SCORE REQUIREMENT: Eligibility hinges on scoring at least 29 on the Determination of Need assessment—this is a specific clinical threshold, not just 'needing help'[3][6]
- ASSET LIMITS ARE STRICT: $17,500 for adults 18+ is a hard cap. Home and one vehicle are exempt, but other assets count[5]
- MEDICAID REQUIREMENT: While interim services don't require Medicaid approval, ongoing HSP services require Medicaid application or eligibility determination[3]
- CASE MANAGEMENT SPLIT: 70% of customers use managed care (Health Choice Illinois); 30% use fee-for-service. This affects who develops your service plan[2]
- PHYSICIAN CERTIFICATION NEEDED: You need a doctor's letter stating care can be safely provided at home—this isn't automatic[3]
- FAMILY CAREGIVERS: Spouses, parents of minor children, and minor children of recipients cannot be paid caregivers; other family members can be[3]

**Data shape:** HSP is age-restricted (under 60, with exceptions for HIV/AIDS and Brain Injury waivers), asset-tested, and Medicaid-linked. It is NOT an entitlement program—eligibility does not guarantee enrollment due to limited slots. The program has specialized tracks for HIV/AIDS and traumatic brain injury with different age rules. Case management is split between managed care (70%) and fee-for-service (30%), which affects service planning. Specific dollar amounts for services, processing timelines, and detailed application procedures are not available in provided search results.

**Source:** https://www.dhs.state.il.us/page.aspx?item=29738

---

### Illinois PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; eligibility is not based on financial criteria. However, for full coverage at no cost (covering 90-99% of participants who are dual-eligible), Medicaid eligibility is typically required, which follows Illinois long-term care rules: income under 300% of Federal Benefit Rate ($2,901/month for 2025, single person; varies by household size—check current HFS Medicaid tables). Private pay or share of cost ($200-$900/month) possible if over limits.[2][6]
- Assets: No asset limits for PACE enrollment. For Medicaid (dual-eligibility), assets $2,000 or less for single (excluding primary home, one vehicle, burial plots). Medicaid planning available to qualify.[2][6]
- Live in the service area of an Illinois PACE organization (specific zip codes in 5 regions: West Chicago, South Chicago, Southern Cook County, Peoria, East St. Louis).
- Certified by Illinois as needing nursing home level of care (frail elderly, requiring extensive assistance with ADLs, but able to live safely in community with PACE support).
- Voluntary enrollment; not in Medicare Advantage, hospice, or certain other programs.

**Benefits:** Comprehensive, all-inclusive care 24/7/365: primary care clinic at PACE center, therapeutic recreation, restorative therapies, socialization, personal care, dining, home care, inpatient (acute/long-term when needed), prescription drugs, transportation. Covers all Medicare/Medicaid services; sole source for enrollees. No specific dollar amounts or hours stated—customized per participant via interdisciplinary team.[1][3][7]
- Varies by: region

**How to apply:**
- Search by zip code on HFS site or contact local PACE provider (e.g., OSF PACE).
- Phone: Contact Illinois Department of Healthcare and Family Services (HFS) at 1-877-582-9701 (general Medicaid) or specific providers like OSF PACE.
- In-person: At PACE centers in designated regions.
- Website: hfs.illinois.gov/medicalproviders/pace.html for zip code search and provider list.

**Timeline:** Not specified in sources.
**Waitlist:** Possible; varies by region/provider—not detailed.

**Watch out for:**
- Not statewide—must live in exact service area zip code; check first.
- Replaces all Medicare/Medicaid; cannot stay on regular plans or Medicare Advantage/hospice.
- Nursing home certification required but must be community-safe with PACE—no financial eligibility for entry, but Medicaid needed for free full coverage.
- Private pay expensive ($7,000+/month) if not dual-eligible.
- Voluntary; can disenroll anytime, but coordinated team manages all care.

**Data shape:** Limited to 5 specific regions with zip code restrictions; no direct income/asset test for PACE but Medicaid financials for no-cost access; provider-specific variations.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hfs.illinois.gov/medicalproviders/pace.html

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: 2026 Illinois limits (monthly, include $20 general income disregard):
QMB (100% FPL): Individual $1,330, Couple $1,803[4][8]
SLMB/SLIB (120% FPL): Individual $1,596, Couple $2,164[4]
QI-1 (120-135% FPL): Individual up to ~$1,715 (national ref, IL-specific from chart incomplete but follows pattern)[1][4]
Note: Limits for single/couple; not full household table specified. Must have Medicare Part A for QMB[6][7].
- Assets: 2026 limits: Individual $9,950, Couple $14,910[4]. Counts most financial resources; exempt: primary home, one vehicle, household items, engagement/wedding rings, burial plots/expenses up to $1,500, life insurance < $1,500 cash value[2].
- Must be enrolled in Medicare Part A (QMB requires current beneficiary status)[6][7]
- Meet nonfinancial Medicaid requirements (e.g., SSN, residency, citizenship)[6]
- Age 65+ or disabled/22-64 not in certain DHS facilities[6]

**Benefits:** QMB: Medicare Part A/B premiums, deductibles, coinsurance/copayments (e.g., 20% Part B, extended stays)[4][5]
SLMB/SLIB: Part B premiums only ($202.90/month in 2026)[3][4]
QI-1: Part B premiums only; auto-qualifies for Extra Help drug program[1][5]
- Varies by: priority_tier

**How to apply:**
- Online: Illinois Application for Benefits Eligibility (ABE) at hfs.illinois.gov/abe[8]
- Phone: ABE Customer Call Center 1-800-843-6154[8]
- In-person: Local DHS Family Community Resource Center[8]
- Mail/paper: Contact DHS for forms[8]

**Timeline:** QMB: Effective month after eligibility determination[4]; SLMB: Application month + up to 3 months backdated[4]; QI varies by funding
**Waitlist:** QI-1: First-come, first-served, limited funding, annual application required[3][5]

**Watch out for:**
- QI-1 limited funding, first-come first-served, annual reapplication[3][5]
- Must already have Medicare Part A; recent enrollees wait until coverage starts[6]
- Income disregards ($20 general, wage deductions) often missed[2][3]
- Assets exclude home/car but include most savings; state may vary slightly from federal[10]
- Persons 22-64 in certain DHS facilities ineligible[6]
- Outdated limits common; use 2026 IL chart[4]

**Data shape:** Tiered by income (QMB <100% FPL, SLMB 120%, QI-1 up to 135%); asset limits single/couple only; QI-1 funding-capped with waitlist risk; income includes specific disregards; statewide but local DHS offices

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hfs.illinois.gov/medicalclients/medicare_savings_programs/medicaresavingsprograms.html or https://www.dhs.state.il.us/page.aspx?item=14172[6]

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with members age 60+ or disabled, gross income limit is 200% of Federal Poverty Level (FPL). Specific 2025 limits for seniors: $15,060/month for 1 person, $20,440/month for 2 people. General Illinois limits (updated 10/1/2024) for elderly/disabled households: add $897 per person beyond 10. Most households must meet both gross (165% FPL) and net income tests; deductions include 20% earned income, standard deduction by household size, dependent care, medical expenses for 60+, uncapped housing, utilities, child support[1][2][4][7].
- Assets: Applies if gross income >200% FPL; limit typically $4,500. Exempt: primary home value, retirement savings, household goods, income-producing property (varies; some states waive for low-income). Countable: cash value of life insurance[2][4][5].
- Illinois resident
- U.S. citizen or qualified non-citizen
- Social Security number (or applied for)
- Able-bodied adults (with exceptions) must register for work
- Household includes those who buy/prepare food together

**Benefits:** Monthly EBT card (Link card in IL) for groceries; amount based on household size, net income (e.g., max allotment for 2-person elderly/disabled: $546/month, minus 30% net income). Exact amount calculated after deductions[1][6].
- Varies by: household_size

**How to apply:**
- Online: https://www.dhs.state.il.us/page.aspx?item=30357 or https://fscalc.dhs.illinois.gov/FSCalc/ (eligibility calculator)
- Phone: Local IDHS office (find via dhs.state.il.us) or 1-800-843-6154
- Mail: Local IDHS Family Community Resource Center
- In-person: Local IDHS offices

**Timeline:** Typically 30 days; expedited for urgent cases

**Watch out for:**
- Seniors 60+ get expanded rules: 200% FPL gross income, medical/housing deductions (uncapped housing), recertify every 24 months[1][3].
- All adults in household must be 60+ or disabled for simplified redetermination (EDSRP)[3].
- Social Security/pensions count as income; many eligible seniors don't apply[2].
- New 2025 federal rules may affect work requirements for 55-64 without dependents[4][6].
- Household definition: includes food-sharing members, even if not all 60+[2].

**Data shape:** Elderly/disabled households use special rules (200% FPL gross, medical deductions, simplified recert); benefits scale by household size and net income after deductions; statewide but local offices handle applications

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
- Income: At or below 200% of the federal poverty level. PY2026 guidelines not fully detailed in sources, but examples include: Household of 1: $25,760[1] or $25,520[2]; 2: $34,840[1] or $34,480[2]; 3: $43,920[1] or $43,440[2]; 4: $53,000[1] or $52,400[2]; 5: $62,080[1] or $61,360[2]; 6: $71,160[1] or $70,320[2]. Exact limits follow annual federal updates[3][5]. Categorical eligibility for LIHEAP recipients (past 12 months), SSI/Title IV/XVI cash assistance recipients, or households with utilities paying into SLIHEAP (for <7 members)[3][5].
- Assets: No asset limits mentioned in sources.
- Legal resident of Illinois; U.S. citizen or qualified alien for all household members[5].
- Home must be structurally sound[4].
- Owner-occupied up to 4 units or multi-family (66% units occupied by income-eligible tenants, or 50% in some cases)[1][2][4].
- Not served by IHWAP in last 15 years (re-weatherization possible in some cases)[4][5].
- Priority for households with elderly (60+), disabled members, or children 5 and under[4][6][9].

**Benefits:** Free weatherization including: air sealing, attic/wall insulation, HVAC repair/replacement, water heater repair/replacement, electric base load reduction (lighting/refrigerator replacement), ventilation/moisture control, other health/safety measures. Max $15,000-$20,000 per home for energy work; $3,500-$4,000 for health/safety[1][2][3].
- Varies by: priority_tier

**How to apply:**
- Phone: 1-877-411-WARM (9276) to find local agency[2].
- Online pre-application via DCEO (specific URL not listed; visit DCEO website)[4].
- Phone alternative: 1-800-571-2332[4].
- Contact local Community Action Agency by county[2].
- In-person/mail via local agencies (e.g., partner intake sites)[4].

**Timeline:** Not specified; prioritized by need/date, works off waiting lists[5][6].
**Waitlist:** Yes, common; prioritized for elderly (60+), disabled; some lists closed except specific counties (e.g., Monroe)[6]. Non-priority may wait or not receive in application year[4].

**Watch out for:**
- Priority tiers mean elderly/disabled/young children go first; others may face long waits or denial in application year[4][6][9].
- Multi-family requires 66% (or 50% in cases) income-eligible tenants[1][2].
- Home must be structurally sound; no windows typically[4].
- 15-year rule since last service (exceptions for re-weatherization)[4][5].
- All household members counted for income, must be citizens/qualified aliens[5].
- Income guidelines update annually (PY2026 specific table referenced but not fully provided)[3].

**Data shape:** Statewide via local agencies with priority tiers (elderly/disabled/children first); income at 200% FPL with categorical eligibility; multi-family tenant thresholds; annual federal poverty updates; varying waitlists by region.

**Source:** https://dceo.illinois.gov/communityservices/homeweatherization.html[3]

---

### Senior Health Insurance Program (SHIP)


**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries and their caregivers.
- Assets: No asset limits or tests apply.
- Must be a Medicare beneficiary (typically age 65+ or qualifying disabled under Medicare)
- Caregivers or family assisting Medicare-eligible individuals also qualify for counseling

**Benefits:** Free, unbiased, personalized health insurance counseling including: education on Medicare (Parts A-D), Medicare supplements, Medicare Part D, Medicare Advantage, long-term care insurance; assistance with enrollment in Part D and extra financial help for Part B/D premiums; help filing claims, analyzing policies, resolving billing issues and appeals; community education seminars.

**How to apply:**
- Phone: Toll-free 1-800-252-8966 (statewide, connects to local counselor)
- Email: aging.ship@illinois.gov
- Website: https://ilaging.illinois.gov/ship.html (find local sites and resources)
- Local in-person or phone via regional providers (e.g., Ford County: 217-379-9281; CEFS: 217-342-2193 ext 2135; Skokie: 847-933-8252)

**Timeline:** Immediate counseling available by phone; appointments for in-person vary by local site (e.g., year-round in Skokie)

**Watch out for:**
- Not an insurance provider or seller—counselors do not sell policies or represent insurers.
- Free service, no enrollment into SHIP itself; it's counseling access.
- Targeted at Medicare navigation, not direct medical care or financial aid.
- During Medicare Open Enrollment (Oct 15-Dec 7), prioritize plan comparisons.

**Data shape:** no income/asset test; counseling-only advocacy service via statewide network of local providers; eligibility purely Medicare-based

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/ship.html

---

### Community Care Program (CCP) Home Delivered Meals


**Eligibility:**
- Age: 60+
- Income: If monthly income (individual + spouse if applicable) is below the federal poverty level, services are free. If above poverty level, cost is determined by level of services needed and CCP fee schedules. Specific dollar amounts vary by household composition and are not provided in available sources; contact your local Area Agency on Aging for current thresholds.[4]
- Assets: {"threshold":"$17,500 in non-exempt assets","exempt_assets":["Primary residence and its furnishings[4]","Personal clothing and effects[4]","Vehicles (excluding recreational vehicles)[4]","Prepaid burial plan, burial plots, and markers[4]"],"note":"Home, car, and personal furnishings do not count toward the $17,500 limit[1][2]"}
- U.S. citizen, lawful permanent resident (green card holder), or eligible non-citizen within specific categories[1][4]
- Illinois resident[1][4]
- Assessed need for long-term care (must score minimum 29 on Determination of Need (DON) assessment to be at risk for nursing facility placement)[4]
- Must apply for Medicaid and enroll if eligible[1][4]

**Benefits:** Home-delivered meals meeting at least one-third of daily recommended dietary allowances. Minimum of five meals per week in most areas; some programs offer additional meals for dinners and/or weekends.[5][6] Meals are volunteer-delivered, providing a safety check and face-to-face conversation.[5]
- Varies by: region

**How to apply:**
- Contact your local Area Agency on Aging (AAA) using the map tool at ilaging.illinois.gov[6]
- If you are a member of a Managed Care Organization (MCO), contact your MCO case manager for assessment and referral[5]
- If not in an MCO, contact your local Care Coordination Unit via AgeOptions Referral Webpage (services.ageoptions.org) — select 'Community Care Program/In-home services/Home Delivered Meals'[5]
- Contact your case manager or health plan to verify eligibility if already a CCP participant[3]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Home-delivered meals are NOT a standalone program — they are part of the broader Community Care Program, which requires Medicaid enrollment and a DON assessment showing need for long-term care services.[1][2][4]
- Simply being 60+ and wanting meals does NOT qualify you. You must be assessed as at-risk for nursing facility placement (minimum DON score of 29).[4]
- Asset limits are strict ($17,500 non-exempt). While homes and cars are exempt, other savings, investments, and property count toward this limit.[4]
- Income thresholds are tied to federal poverty level, which varies by household size and changes annually. Families must contact their local AAA for current dollar amounts.[4]
- If income is above poverty level, you will be charged on a sliding fee scale based on services needed — it is not free.[4]
- Medicaid enrollment is mandatory; if you don't qualify for Medicaid, you don't qualify for CCP home-delivered meals.[1][4]
- Processing timelines are not published; contact your local AAA for expected wait times, which may vary by region and current demand.[4]
- Specialized meal options (Kosher, cultural cuisines) are only available in select areas, particularly suburban Cook County.[5]
- The program is a 1915(c) Medicaid waiver, meaning it is subject to Medicaid rules and funding availability.[2]

**Data shape:** This program's eligibility and benefits are highly individualized. The DON assessment score determines both qualification (minimum 29) and service level (higher scores = more services).[4] Income-based sliding scale fees mean no two households pay the same amount. Regional variation is significant, particularly in suburban Cook County where expanded options exist. Home-delivered meals are one component of a larger CCP that includes care coordination, adult day services, emergency response, and medication management — families cannot access meals alone without qualifying for the full program.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/programs/nutrition/nutrition.html

---

### Illinois Caregiver Support Program


**Eligibility:**
- Age: 60+
- Income: Monthly income must be below a certain amount (specific dollar thresholds not detailed in sources; assessed during application via Determination of Need (DON) scoring with minimum score of 29 required). Limits not specified by household size in available data.
- Assets: Non-exempt assets of $17,500 or less. Exempt assets include: person's home and furnishings, personal clothing and effects, cars (excluding recreational vehicles), prepaid burial plan, burial plots, and markers.
- Illinois resident
- U.S. citizen, lawful permanent resident, or eligible non-citizen
- Assessed need for long-term care services to avoid nursing home placement (via Determination of Need (DON) with minimum score of 29)
- Apply for and enroll in Medicaid if eligible
- Caregiver: adult family member or informal provider (unpaid) to older individual; for paid roles under related programs like Community Care Program, caregiver must be 18+, authorized to work in U.S., pass background check, have high school diploma/GED or equivalent experience

**Benefits:** Support services including training and education on caregiving skills and self-care, support groups to share experiences. Provides resources for unpaid family caregivers of adults 60+ (including those with Alzheimer's), grandparents/relative caregivers of children ≤18 (including those with developmental disabilities). Related Community Care Program enables paid family caregiving (e.g., $20/hour via some agencies) with personalized care plans for in-home assistance with activities of daily living.
- Varies by: priority_tier

**How to apply:**
- Phone: Toll-free Illinois Department on Aging Senior Helpline at (800) 252-8966 or (888) 206-1327 (TTY)
- Contact local agency funded by Illinois Department on Aging for assessment
- In-person/home visit by local agency for Determination of Need (DON) evaluation

**Timeline:** Not specified in sources

**Watch out for:**
- Program focuses on support (training, groups) for unpaid caregivers; paid family caregiving typically via related Community Care Program (CCP) or Medicaid waivers, not directly this program
- Must score minimum 29 on DON for CCP eligibility; higher scores yield more services
- Asset limit strictly $17,500 non-exempt; many miss exempt items like home/car
- Requires Medicaid application/enrollment if eligible; separate from Home Services Program (HSP) for 18-59
- Caregivers for paid roles need background check, training, agency enrollment

**Data shape:** Benefits emphasize non-financial support (training/support groups) with ties to CCP for paid in-home care; eligibility via functional DON score + financials; regional via local Aging Network agencies; no fixed income table or hours detailed

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov/programs/caregiver/program.html

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level (set by U.S. Department of Health and Human Services). Exact dollar amounts vary annually by household size; families must check current HHS poverty guidelines as specific 2026 figures not listed in sources. For example, applies to single person, couple, or larger households.[1][2][5]
- Assets: No asset limits mentioned in sources.
- Unemployed and actively seeking employment
- Capable of performing community service tasks
- Priority given to veterans and qualified spouses of veterans, then individuals over age 65
- Willing to participate in community service, attend training/meetings, develop Individual Employment Plan (IEP), and use job search resources[2][5][6]

**Benefits:** Part-time on-the-job training (typically 20 hours per week) at host agencies (not-for-profits like schools, hospitals, senior centers); paid highest of federal, state, or local minimum wage (Illinois state minimum noted as $8.25/hour in older data, check current); personalized employment counseling, skills training (resume writing, interviewing, computer skills), job search assistance to transition to unsubsidized employment.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging
- Call Illinois Department on Aging Senior HelpLine (specific number not listed in sources; search ilaging.illinois.gov for current contact)
- Contact local SCSEP sub-grantee or national contractor (7 state sub-grantees and 7 national contractors in Illinois, e.g., CWI Works, Goodwill, National Able)
- Access employment assistance through American Job Centers

**Timeline:** Not specified in sources.
**Waitlist:** May exist due to funding availability and residence in service area with slots; varies by local provider.

**Watch out for:**
- Not permanent employment—it's temporary training (bridge to unsubsidized jobs); participants must actively job search.
- Limited slots based on funding and local availability; priority to veterans/65+ may create waitlists.
- Income test strictly at 125% poverty (not higher); must be unemployed.
- Paid only minimum wage for part-time hours—not full income replacement.
- Requires community service commitment and IEP development.
- Multiple providers in IL—must contact local AAA for exact options, not centralized application.

**Data shape:** Administered via multiple local sub-grantees/national contractors (14 total in IL) through Area Agencies on Aging; eligibility fixed federally but slots vary regionally by funding/service area; priority tiers affect access; no asset test, income scales by household poverty guidelines.

**Source:** https://ilaging.illinois.gov/programs/employ.html

---

### Illinois Legal Aid Online / Senior Legal Helpline

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Up to 150% of federal poverty level for general eligibility. Higher income limits available for homeowners at risk of foreclosure, seniors, veterans, people living with HIV, survivors of domestic or sexual violence with legal issues relating to their victimization, and victims of human trafficking. Note: Federal poverty guidelines vary by household size (e.g., 2026 guidelines: individual ~$15,060, family of 4 ~$31,200); 150% would be approximately $22,590 for individual, $46,800 for family of 4. Exact current dollar amounts must be verified with local provider as guidelines update annually.[1][2]
- Assets: Limited assets required, but specific asset limits and exemptions are not detailed in available sources. Contact local legal aid provider for exact asset thresholds.[2]
- U.S. citizen, Lawful Permanent Resident, asylee, refugee, or person granted Withholding of Removal[2]
- Certain non-citizens including undocumented immigrants may qualify in some cases[1]
- Victims of human trafficking, domestic violence, sexual assault, or crimes covered under U visa laws may qualify regardless of immigration status[2]

**Benefits:** Civil legal assistance with wide variety of civil law issues including healthcare denials/reductions (Medicare, Medicaid, home care), housing, family law, and other matters. Specific dollar amounts or hours per week are not specified in available sources.[7][8]
- Varies by: issue_type_and_location

**How to apply:**
- Online: Illinois Legal Aid Online 'Get Legal Help' tool at illinoislegalaid.org/get-legal-help[4][9]
- Phone: Contact local Area Agencies on Aging (AAA) using map tool at ilaging.illinois.gov[7]
- Phone: Senior HelpLine (general complaints): (800) 252-8966 (toll-free)[5]
- Phone: Elder Abuse Hotline (for abuse/neglect): (866) 800-1409 (24-hour)[5]
- In-person: Cook County Legal Self-Help Center, Chicago-Kent Self-Help Resource Center, Daley Center, 50 West Washington Street, Room 602, Chicago, IL 60602[9]
- In-person: Resource Center for People without Lawyers, Daley Center, 50 West Washington Street, Concourse Level, CL29, Chicago, IL 60602[9]

**Timeline:** Online application takes 5-30 minutes to complete. After submission, applicants may receive a list of organizations to contact for callback scheduling or fast-tracked application. No specific processing timeline for approval/denial stated in available sources.[4]
**Waitlist:** Not specified in available sources. However, sources note 'there are not enough civil legal aid lawyers to serve everyone who meets these qualifications,' suggesting potential waitlists or service limitations.[1]

**Watch out for:**
- Income limits are NOT absolute — higher limits exist for specific populations (homeowners at risk of foreclosure, seniors, veterans, HIV+, DV/sexual violence survivors, human trafficking victims). Always ask about higher thresholds if you don't qualify at 150%.[2]
- Seniors (60+) may qualify for legal aid REGARDLESS OF INCOME in some cases, but this is not explicitly guaranteed statewide — verify with your local provider.[1]
- Not all legal issues are covered. Each provider has restrictions (e.g., Legal Aid Chicago excludes small claims). Confirm your specific legal issue is handled before applying.[2]
- Immigration status matters. Undocumented immigrants may qualify in some cases, but eligibility is narrower than for citizens/permanent residents. Verify before applying.[1][2]
- Service availability is NOT guaranteed. The program explicitly states there are insufficient lawyers to serve all eligible people.[1]
- Regional variation is significant. What's available in Cook County may differ from downstate Illinois. Must contact local AAA for your area.[7]
- Online 'Get Legal Help' tool may direct you to organizations that are NOT legal aid (including private bar referrals). Vetted legal aid partners are listed separately from general referrals.[4]
- For criminal cases, this is NOT the right program — public defenders are appointed by courts for criminal defense, not through legal aid organizations.[1]

**Data shape:** This program is highly fragmented by region and provider. There is no single 'Illinois Legal Aid Online' entity — rather, it's a portal connecting users to local legal aid organizations and Area Agencies on Aging. Income limits, service types, and processing times vary significantly by location. Seniors (60+) receive priority and may have different eligibility rules than younger populations. The program explicitly acknowledges insufficient capacity to serve all eligible applicants. Asset limits and specific benefit amounts are not publicly detailed in available sources.

**Source:** illinoislegalaid.org and ilaging.illinois.gov

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Age: 60+
- Income: No income limits; available regardless of financial status[1][4][5]
- Assets: No asset limits; no financial requirements[5]
- Current, prospective, or former resident (age 60+) of a long-term care facility (e.g., nursing homes, assisted living); friends/relatives of residents; facility staff/administrators with resident concerns; individuals/families considering placement; community at large[1][4]

**Benefits:** Advocacy to resolve complaints (e.g., neglect, abuse, rights violations); investigation of concerns; education on resident rights, long-term care options, and services; promotion of quality of life and care; facilitation of family councils; routine facility visits; assistance to facility staff; intervention in private homes/community settings for older persons/disabilities[1][2][4][5][7][8]

**How to apply:**
- Phone: Senior HelpLine 1-800-252-8966 (press 1), TTY 1-888-206-1327 or 711[6][8][9]
- Local/regional ombudsman programs (contact via Senior HelpLine for specifics)[6]
- Mail: Long-Term Care Ombudsman Program, Illinois Department on Aging, One Natural Resources Way, Suite 100, Springfield, IL 62702-1271[6][9]
- Email: To Illinois Department on Aging[9]
- Regional examples: DuPage County - Call 630-407-6500, 211, text zip code to 898211, or visit www.dupagecounty.gov/community[5]

**Timeline:** Immediate assistance for complaints/concerns; no formal processing time specified[1][4]

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy and complaint resolution[1][7][9]
- Primarily for long-term care facility residents (age 60+); expanded but focus remains facilities[2][4]
- Anyone can contact (no eligibility barriers), but services resolve issues, not provide direct care[1][4][5]
- Regional programs handle local delivery; must contact local ombudsman for facility-specific help[2][3][6]
- Volunteers undergo training/background checks, but residents/families just call for help[6]

**Data shape:** no income test; statewide with regional delivery; advocacy-only, open to residents/families/staff/community without financial or document barriers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ilaging.illinois.gov (Illinois Department on Aging)

---

### Illinois Senior Citizens and Persons with Disabilities Property Tax Relief

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Total annual household income of no more than $75,000 in 2025, $77,000 in 2026, and $79,000 in 2027 and thereafter. Income limits apply to the household and do not vary by size; older sources mention $65,000 or $75,000 but current state guidance confirms the phased increases.[7][2][3]
- Assets: Maximum deferral limited to $7,500 per year, including interest and lien fees, not exceeding 80% of the taxpayer’s equity interest in the property. No separate asset limits beyond property equity and insurance requirements.[3][1]
- Must be 65 years old by June 1 of the application year (born 1960 or prior per some sources).[7][2][1]
- Own the property, share joint ownership with spouse, or be sole beneficiary of an Illinois land trust.[7]
- Occupy the property as principal residence.[1]
- Owned and occupied the property for at least the last three years (Cook County specific).[2]
- No delinquent property taxes or special assessments.[7][2]
- Adequate fire or casualty insurance coverage in an amount not less than the deferred taxes.[7][2]
- Written approval from spouse (if filing jointly) or trustee (if in trust).[7][2]
- Surviving spouses of approved applicants qualify if at least 55 within six months of death (Cook County).[2]

**Benefits:** Deferral of up to $7,500 per tax year (covering all or part of property taxes and special assessments on principal residence). Acts as a loan from the State of Illinois at 6% simple annual interest, repaid upon property sale, transfer, death, or within 90 days/1 year if ceases to qualify. Lien filed on property.[1][2][3][5][7]
- Varies by: fixed

**How to apply:**
- In-person or mail to county collector/treasurer's office (applications available after January 1, due by March 1 annually; no extensions).[2][3][7]
- Contact county treasurer for forms and submission (e.g., Cook County Treasurer's Office; Will County Treasurer; Sangamon County Treasurer).[2][3][5]

**Timeline:** County collector approves or denies; no specific statewide timeline provided, apply early as annual deadline is strict March 1.[7][2]

**Watch out for:**
- Must reapply annually; not automatic renewal like some exemptions.[2][7]
- It's a loan with 6% interest and lien—repaid on sale/death, not forgiveness.[1][5][7]
- Strict March 1 deadline with no extensions; photocopies only.[2]
- Equity limit: cannot defer beyond 80% of property equity or $7,500/year.[3]
- Trust properties require trustee signature and extra docs; start early.[2]
- Persons with disabilities not directly covered under this deferral program—may qualify for separate exemptions (e.g., Cook County Persons with Disabilities exemption).[1]

**Data shape:** Statewide loan-style deferral with phased income increases ($75k 2025, $77k 2026, $79k+ 2027); county-administered with annual reapplication; fixed $7,500 cap per household regardless of size; lien and interest create repayment obligation unlike pure exemptions.

**Source:** https://tax.illinois.gov/research/publications/pio-64.html

---

### Benefit Access Program (Seniors Ride Free & License Plate Discount)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older before January 1 of the current year, or turning 65 this year (benefits available after turning 65), or 16 or older and disabled[3][5][7]+
- Income: $33,562 for 1-person household; $44,533 for 2-person household (self + spouse or 1 Qualified Additional Resident); $55,500 for 3-person household (self + spouse + 1 QAR or self + 2 QAR). Total gross income from last closed tax year. Include spouse's income if married and living together on Dec 31 of last year; exclude QAR income[3][7]
- Assets: No asset limits mentioned[1][2][3][7]
- Illinois resident at time of application[5]
- Valid Social Security number required (spouse and QAR also need SSN if applicable)[1][2][7]
- U.S. citizenship not required[7]

**Benefits:** License plate fee discount of $75 on one vehicle per household (specific plate types eligible; wait 10 business days post-approval to use). Ride Free Permit ID card for free rides on fixed-route CTA, Metra (RTA), and Pace buses/trains (local transit may have additional requirements)[1][3][4][5]
- Varies by: fixed

**How to apply:**
- Online: https://ilaging.illinois.gov/benefitsaccess.html[2][3][4]
- Assistance via local AgeGuide or agencies like Bacoa (e.g., 847-381-5030)[1][2]
- Phone for license plate questions: 1-800-252-8980[4]
- In-person: Local transit authority or Secretary of State office with printed certificate post-approval[3]

**Timeline:** Up to 8 weeks depending on documentation; check status after 48 hours; license plate discount active after 10 business days post-approval[3]

**Watch out for:**
- Only one license plate discount per household per year, for one vehicle titled to the applicant[1][4]
- Must wait 10 business days post-approval for license plate discount to activate[3][4][5]
- Benefits for those turning 65 available only after birthday[3][5]
- Local transit may require extra steps for free rides[3]
- Spouse must have SSN; include spouse income if living together Dec 31[1][7]
- No discount for multiple vehicles[4]

**Data shape:** Income-tested with fixed household size tiers up to 3 persons; no asset test; statewide but local transit variations; one vehicle limit per household

**Source:** https://ilaging.illinois.gov/benefitsaccess.html[3]

---

### Health Benefits for Immigrant Seniors (HBIS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Annual income at or below $13,590 for a single person or $18,310 for a couple (based on 2022 Federal Poverty Level at 100% or less; may qualify with spenddown if over). No full household size table provided in sources; applies to individual or couple.[1][7]
- Assets: Assets below $17,500. Exemptions include a home or one car. Resources over the limit may qualify via AABD resource spenddown.[1][7]
- Illinois resident
- Undocumented immigrant (including Temporary Protected Status)
- Not eligible for federally funded Medicaid or Medicare

**Benefits:** Medicaid-like coverage with $0 premiums. Covers primary care visits, FQHC care, vaccinations, prescription drugs, dental and vision services, hospital care, lab tests, rehabilitative services (physical/occupational therapy), mental health/substance use disorder services, transportation. Excludes long-term care (nursing facility, home/community-based services), funeral/burial expenses. Copays: $250 for non-emergency inpatient hospitalization; 10% of DHS rate for non-emergency hospital outpatient/ambulatory surgical centers. Most other services free.[1][2][5][7]
- Varies by: fixed

**How to apply:**
- Refer to hfs.illinois.gov for latest enrollment info (enrollment currently paused for new applicants as of November 6, 2023; existing enrollees can renew).[2][8]
- Phone: Check HFS site or managed care plans like 1-877-860-2837 (BCCHP).[6]
- Website: https://hfs.illinois.gov/medicalclients/healthbenefitsforimmigrants/healthbenefitsforimmigrantseniors.html[1]

**Timeline:** Not specified in sources.
**Waitlist:** Enrollment paused for new enrollees; no new applications accepted.[2][7][8][9]

**Watch out for:**
- New enrollments paused since November 6, 2023; only existing enrollees (pre-Nov 2023) can renew/continue benefits.[2][7][8][9]
- Annual redeterminations required starting 2024, like Medicaid.[3]
- Copays apply to some hospital services despite most being free.[1][7]
- Excludes long-term care services.[5][7]
- Income/assets based on older 2022 figures in some sources; verify current FPL via HFS.[1]

**Data shape:** Enrollment paused for new applicants; ongoing for pre-2023 enrollees with annual renewals. Income/asset limits fixed for single/couple, no full household table. Statewide with no regional variations noted.

**Source:** https://hfs.illinois.gov/medicalclients/healthbenefitsforimmigrants/healthbenefitsforimmigrantseniors.html

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medical Assistance/Medicaid | benefit | state | deep |
| Home Services Program (HSP) Waiver | benefit | state | medium |
| Illinois PACE (Program of All-Inclusive  | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Illinois Home Weatherization Assistance  | benefit | federal | deep |
| Senior Health Insurance Program (SHIP) | resource | federal | simple |
| Community Care Program (CCP) Home Delive | benefit | state | deep |
| Illinois Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Illinois Legal Aid Online / Senior Legal | navigator | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Illinois Senior Citizens and Persons wit | benefit | state | deep |
| Benefit Access Program (Seniors Ride Fre | resource | state | simple |
| Health Benefits for Immigrant Seniors (H | resource | state | simple |

**Types:** {"benefit":9,"resource":4,"employment":1,"navigator":1}
**Scopes:** {"state":8,"local":1,"federal":6}
**Complexity:** {"deep":9,"medium":1,"simple":5}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/IL/drafts.json`.

- **Medical Assistance/Medicaid** (benefit) — 5 content sections, 6 FAQs
- **Home Services Program (HSP) Waiver** (benefit) — 4 content sections, 6 FAQs
- **Illinois PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 6 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 5 programs
- **Individual service plan; specialized tracks for HIV/AIDS and Brain Injury populations[9]**: 1 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **not_applicable**: 2 programs
- **issue_type_and_location**: 1 programs
- **fixed**: 3 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medical Assistance/Medicaid**: Varies by sub-program (AABD vs. Nursing Home), marital status, and care level; income/asset limits program-specific and annually adjusted; benefits tiered by functional assessment
- **Home Services Program (HSP) Waiver**: HSP is age-restricted (under 60, with exceptions for HIV/AIDS and Brain Injury waivers), asset-tested, and Medicaid-linked. It is NOT an entitlement program—eligibility does not guarantee enrollment due to limited slots. The program has specialized tracks for HIV/AIDS and traumatic brain injury with different age rules. Case management is split between managed care (70%) and fee-for-service (30%), which affects service planning. Specific dollar amounts for services, processing timelines, and detailed application procedures are not available in provided search results.
- **Illinois PACE (Program of All-Inclusive Care for the Elderly)**: Limited to 5 specific regions with zip code restrictions; no direct income/asset test for PACE but Medicaid financials for no-cost access; provider-specific variations.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income (QMB <100% FPL, SLMB 120%, QI-1 up to 135%); asset limits single/couple only; QI-1 funding-capped with waitlist risk; income includes specific disregards; statewide but local DHS offices
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly/disabled households use special rules (200% FPL gross, medical deductions, simplified recert); benefits scale by household size and net income after deductions; statewide but local offices handle applications
- **Illinois Home Weatherization Assistance Program (IHWAP)**: Statewide via local agencies with priority tiers (elderly/disabled/children first); income at 200% FPL with categorical eligibility; multi-family tenant thresholds; annual federal poverty updates; varying waitlists by region.
- **Senior Health Insurance Program (SHIP)**: no income/asset test; counseling-only advocacy service via statewide network of local providers; eligibility purely Medicare-based
- **Community Care Program (CCP) Home Delivered Meals**: This program's eligibility and benefits are highly individualized. The DON assessment score determines both qualification (minimum 29) and service level (higher scores = more services).[4] Income-based sliding scale fees mean no two households pay the same amount. Regional variation is significant, particularly in suburban Cook County where expanded options exist. Home-delivered meals are one component of a larger CCP that includes care coordination, adult day services, emergency response, and medication management — families cannot access meals alone without qualifying for the full program.
- **Illinois Caregiver Support Program**: Benefits emphasize non-financial support (training/support groups) with ties to CCP for paid in-home care; eligibility via functional DON score + financials; regional via local Aging Network agencies; no fixed income table or hours detailed
- **Senior Community Service Employment Program (SCSEP)**: Administered via multiple local sub-grantees/national contractors (14 total in IL) through Area Agencies on Aging; eligibility fixed federally but slots vary regionally by funding/service area; priority tiers affect access; no asset test, income scales by household poverty guidelines.
- **Illinois Legal Aid Online / Senior Legal Helpline**: This program is highly fragmented by region and provider. There is no single 'Illinois Legal Aid Online' entity — rather, it's a portal connecting users to local legal aid organizations and Area Agencies on Aging. Income limits, service types, and processing times vary significantly by location. Seniors (60+) receive priority and may have different eligibility rules than younger populations. The program explicitly acknowledges insufficient capacity to serve all eligible applicants. Asset limits and specific benefit amounts are not publicly detailed in available sources.
- **Long-Term Care Ombudsman Program**: no income test; statewide with regional delivery; advocacy-only, open to residents/families/staff/community without financial or document barriers
- **Illinois Senior Citizens and Persons with Disabilities Property Tax Relief**: Statewide loan-style deferral with phased income increases ($75k 2025, $77k 2026, $79k+ 2027); county-administered with annual reapplication; fixed $7,500 cap per household regardless of size; lien and interest create repayment obligation unlike pure exemptions.
- **Benefit Access Program (Seniors Ride Free & License Plate Discount)**: Income-tested with fixed household size tiers up to 3 persons; no asset test; statewide but local transit variations; one vehicle limit per household
- **Health Benefits for Immigrant Seniors (HBIS)**: Enrollment paused for new applicants; ongoing for pre-2023 enrollees with annual renewals. Income/asset limits fixed for single/couple, no full household table. Statewide with no regional variations noted.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Illinois?
