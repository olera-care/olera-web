# Connecticut Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.065 (13 calls, 6.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 11 |
| Programs deep-dived | 10 |
| New (not in our data) | 7 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 5 programs
- **in_kind**: 1 programs
- **financial**: 1 programs
- **financial subsidy for services**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Connecticut Home Care Program for Elders (CHCPE) - Medicare Savings

- **income_limit**: Ours says `$1400` → Source says `$1,956` ([source](https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Home care services to avoid nursing home placement: assistance with ADLs (bathing, dressing, eating, medications, toileting, transferring). May cover up to 70 hours/week in Medicaid waiver category. State-funded clients pay 3% of service costs. MSP component: QMB pays Part B premium + deductibles/co-insurance; SLMB/ALMB pay Part B premium only (ALMB funding-limited, excludes Medicaid recipients).` ([source](https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://portal.ct.gov/dss/snap))
- **income_limit**: Ours says `$1980` → Source says `$2608` ([source](https://portal.ct.gov/dss/snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Max monthly allotments (examples): 1: $298, 2: $546, 3: $785, 4: $994, 5: $1183, 6: $1421, 7: $1571, 8: $1789, each add'l +$218. Actual amount = max allotment minus 30% of net income (e.g., 2-person elderly: $546 max - 30% net).[1][4][5]` ([source](https://portal.ct.gov/dss/snap))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/snap`

### Connecticut Energy Assistance Program (CEAP)

- **income_limit**: Ours says `$2800` → Source says `$47,764` ([source](https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Basic benefit: $295-$595 standard or $345-$645 if vulnerable household member (e.g., elderly, disabled, child under 6); Crisis benefit: $425 per occurrence (up to 3x) for deliverable fuel households in crisis; Rental assistance (heat in rent): $75-$125. Payments to utility/fuel vendor; extra fuel deliveries, payment plans, shut-off protection, equipment repair/replacement possible. Varies by household size, income, heating source, vulnerable status.[1][3]` ([source](https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating))
- **source_url**: Ours says `MISSING` → Source says `https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating`

## New Programs (Not in Our Data)

- **HUSKY Health (Medicaid for seniors/disabled)** — service ([source](https://portal.ct.gov/HUSKY/How-to-Qualify))
  - Shape notes: Tiered by subcategory (standard ABD, LTSS, MED-Connect) with varying income/asset limits; asset test required; LTSS needs care level assessment; statewide but subcategory-specific referrals
- **Program of All-Inclusive Care for the Elderly (CT PACE)** — service ([source](https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly and https://www.npaonline.org/eligibility-requirements))
  - Shape notes: This program has NO income or asset limits, making it unusual among means-tested programs. Eligibility is primarily medical/functional (nursing facility level of care) and geographic (service area availability). The program structure differs significantly based on insurance status: dual-eligible participants (Medicare + Medicaid) receive fully capitated care with no out-of-pocket costs, while non-Medicaid participants pay monthly premiums but also have no deductibles/copays. Connecticut-specific details (organization names, contact information, processing times, regional variations) are not available in provided sources and require direct contact with local PACE organizations or the Connecticut Department of Social Services.
- **Weatherization Assistance Program** — service ([source](https://portal.ct.gov/DEEP/Energy/Weatherization/Weatherization-in-Connecticut))
  - Shape notes: Joint application with Energy Assistance Program via 2-1-1; priority-based with elderly focus; local CAA administration; strict home history rules (no recent weatherization, no sale/foreclosure); max spend caps by dwelling type.
- **CHOICES (CT SHIP)** — service ([source](https://portal.ct.gov/ads/programs-and-services/choices[5]))
  - Shape notes: No income/asset tests; volunteer/staff-delivered counseling via 5 regional AAAs; partners with Center for Medicare Advocacy; open to all Medicare-eligible CT residents and caregivers
- **Connecticut Statewide Respite Care Program** — financial subsidy for services ([source](https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/healthy-living-services/connecticut-statewide-respite-care[6]))
  - Shape notes: This program's data structure is characterized by: (1) fixed annual subsidy cap ($7,500) rather than hourly/service-based limits; (2) administration through regional Area Agencies on Aging creating potential for regional variation not documented in state regulations; (3) conflicting income limits in available sources suggesting possible updates or regional differences; (4) contingency on available funding making benefits non-guaranteed; (5) flexibility in service types and delivery method (agency vs. self-directed) but fixed financial ceiling; (6) integration with broader caregiver support ecosystem (Alzheimer's Association, multiple state agencies) rather than standalone program.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); Connecticut Department of Aging and Disabilities co-funds the program))
  - Shape notes: SCSEP is a federally funded program with state/local co-funding (90% federal, 10% nonfederal match). In Connecticut, it is administered by a single primary provider (A4TD) rather than multiple regional offices. Benefits are fixed (20 hours/week at minimum wage) rather than scaled by household size. Eligibility is based on a strict income threshold tied to federal poverty guidelines, which vary by household size but are not itemized in the available search results. The program prioritizes certain populations (veterans, 65+, disabled, rural, homeless/at-risk) but does not appear to have separate tiers of benefits based on priority status — all participants receive the same 20 hours/week training structure.
- **Long Term Care Ombudsman Program** — advocacy ([source](https://portal.ct.gov/LTCOP))
  - Shape notes: no income test; advocacy-only with no financial eligibility, asset review, waitlists, or tiered benefits; open to residents/families pre- and post-placement in specific facility types; volunteer-driven with regional staff support.

## Program Details

### HUSKY Health (Medicaid for seniors/disabled)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Varies by subcategory. Standard HUSKY C: Single - $851/month, Couple - $1,153/month (excludes unearned income disregard). Long-Term Services & Supports (LTSS): Single - $2,982/month; married couple based on CSPA. MED-Connect (working disabled): Up to $85,000/year. Note: 2026 updates may adjust to ~$1,413/month single for regular ABD per some sources, effective 3/1/26.[1][2][5]
- Assets: Standard HUSKY C: Single - $1,600, Couple - $2,400. LTSS: Single - $1,600, Couple - based on CSPA. MED-Connect: Single - $20,000, Couple - $30,000. Countable assets include cash, stocks, bonds, investments, IRAs, bank accounts, non-primary real estate. Exemptions not fully detailed but typically include primary home (under equity limits), one vehicle, personal belongings.[1][2][3][5]
- Connecticut resident
- Blind, disabled, or 65+
- For LTSS: Nursing home level of care or help with ADLs required
- For MED-Connect: Employed with disability
- U.S. citizen or qualified non-citizen

**Benefits:** Comprehensive Medicaid health coverage including doctor visits, hospital care, prescription drugs, dental, vision, mental health; long-term services & supports (LTSS) for home/community-based services, nursing homes, assisted living, adult foster care; non-medical supports to remain at home. Specifics: covers variety of health care services per benefit overview.[2][4][5]
- Varies by: priority_tier

**How to apply:**
- Online: portal.ct.gov/HUSKY or www.accesshealthct.com
- Phone: Connecticut Health Care Referrals at 1-877-284-4911 (inquiries/enrollment)
- Mail or in-person: Department of Social Services (DSS) offices; apply via Access Health CT or DSS
- MED-Connect/LTSS: Specific referral links at portal.ct.gov/HUSKY/How-to-Qualify or www.ct.gov/med

**Timeline:** Not specified in sources
**Waitlist:** Entitlement program (no waitlist if eligible)

**Watch out for:**
- Multiple subprograms (standard HUSKY C, LTSS, MED-Connect) with different income/asset limits—must identify correct category
- Asset test applies (unlike HUSKY A/D)
- LTSS requires level of care determination and potential 5-year lookback
- Working disabled may owe premium under MED-Connect
- Income limits updated annually (e.g., March); 2026 changes pending
- CSPA protections for community spouse in married LTSS cases

**Data shape:** Tiered by subcategory (standard ABD, LTSS, MED-Connect) with varying income/asset limits; asset test required; LTSS needs care level assessment; statewide but subcategory-specific referrals

**Source:** https://portal.ct.gov/HUSKY/How-to-Qualify

---

### Connecticut Home Care Program for Elders (CHCPE) - Medicare Savings


**Eligibility:**
- Age: 65+
- Income: CHCPE has Medicaid-funded and state-funded categories. Medicaid-funded: income limit equivalent to 150% FPL ($1,956.25/month in 2025 for single; varies by year). State-funded: no income limit. Medicare Savings Program (MSP, often referenced alongside): effective March 1, 2026 - QMB: $2,807 single / $3,806 couple; SLMB: $3,073 single / $4,166 couple; ALMB: $3,272 single / $4,437 couple (income only, no household size beyond couple specified). Not all earned income counts.
- Assets: Medicaid-funded CHCPE: applicable asset limits exist (specific amounts not detailed; excess assets can be spent down on any goods/services for self/spouse, no medical spend-down required). State-funded: limits such as $35,766 single / $47,688 married in some regions. MSP: NO asset limit or estate recoupment. What counts/exempts not fully detailed; primary home often considered in Medicaid contexts.
- Connecticut resident
- At risk of nursing home placement or hospitalization (assistance with at least 1 ADL for state-funded; 3+ ADLs or NFLOC for higher levels)
- For MSP: Enrolled/eligible for Medicare Part A, US citizen/legal resident

**Benefits:** Home care services to avoid nursing home placement: assistance with ADLs (bathing, dressing, eating, medications, toileting, transferring). May cover up to 70 hours/week in Medicaid waiver category. State-funded clients pay 3% of service costs. MSP component: QMB pays Part B premium + deductibles/co-insurance; SLMB/ALMB pay Part B premium only (ALMB funding-limited, excludes Medicaid recipients).
- Varies by: priority_tier

**How to apply:**
- Phone: Contact local Area Agency on Aging or DSS (specific numbers via portal.ct.gov/dss)
- Form: Connecticut Home Care Program for Elders Home Care Request Form (available at maximusclinicalservices.com/content/dam/maximusclinicalservices/svcs/ct/ct-pasrr/public/resources/guides-and-forms/CT-Home-Care-Form.pdf)
- In-person/mail: Local providers like WCAAA (wcaaa.org) or DSS offices
- Website: portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders

**Timeline:** Not specified; services may start quickly for state-funded, but Medicaid waiver involves lookback (up to 5 years).
**Waitlist:** Possible for Medicaid waiver (2+ years mentioned in some contexts); varies.

**Watch out for:**
- CHCPE is distinct from MSP but often bundled; MSP has no assets test, CHCPE does for Medicaid-funded.
- State-funded has no income limit but 3% client cost-share; Medicaid requires spend-down.
- Functional need: must prove risk of nursing home (1-3+ ADLs).
- Gifts/transfer penalties possible (shorter lookback for state-funded).
- ALMB funding-limited and excludes Medicaid recipients.
- Not all earned income counts for MSP.

**Data shape:** Multi-tiered (Medicaid-funded vs state-funded); benefits scale by functional need/priority tier and funding source; no uniform income limit; regional provider variations; MSP integrated for premium savings with no asset test.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/health-and-home-care/connecticut-home-care-program-for-elders/connecticut-home-care-program-for-elders-chcpe

---

### Program of All-Inclusive Care for the Elderly (CT PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No financial requirements or income limits. However, Medicaid beneficiaries receive full coverage. Non-Medicaid beneficiaries pay a monthly premium (amount not specified in available sources).[1][2]
- Assets: No asset limits mentioned in eligibility criteria. However, if enrolled in Community Medicaid, Connecticut may include PACE costs in estate recovery, creating a potential lien or claim against the estate if the participant owns a home.[6]
- Must be certified by the state as meeting nursing facility level of care (medical/functional need assessment required).[1][3]
- Must be able to live safely in the community with PACE services at time of enrollment.[1][3]
- Must live in the service area of a PACE organization.[1][3]
- Cannot be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan.[1]
- Cannot be enrolled in hospice services or certain other programs.[1]
- Medicare or Medicaid enrollment is NOT required to join, but approximately 90% of participants are dually eligible (enrolled in both).[1][2]

**Benefits:** Comprehensive, coordinated medical and social services including: primary care, specialist care, hospital care, prescription medications, therapy services, social services, and long-term care services. PACE becomes the sole source of services for Medicare/Medicaid eligible enrollees. Once enrolled, participants never pay deductibles or co-pays for any care, medication, or service provided by the PACE interdisciplinary team.[2][3][4]
- Varies by: Insurance status (Medicaid vs. non-Medicaid vs. dual-eligible). Services are provided 24 hours a day, every day of the year.[4]

**How to apply:**
- Contact your local PACE program directly (specific Connecticut PACE organizations and contact information not provided in search results).[1]
- Use online eligibility test at medicaidlongtermcare.org to determine if you or a loved one qualifies.[2]

**Timeline:** Interdisciplinary team completes needs assessment within 30 days of enrollment; comprehensive care plan developed thereafter. Specific overall application processing timeline not provided in search results.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- No income or asset limits exist, BUT if you enroll in Community Medicaid to pay for PACE services, Connecticut may place a lien or claim against your estate (including your home) for costs paid.[6]
- Medicare Advantage (Part C) plan enrollment disqualifies you—you cannot be in both PACE and a Medicare Advantage plan simultaneously.[1]
- PACE becomes the SOLE source of services for dual-eligible (Medicare + Medicaid) participants—you cannot use other providers for covered services.[3]
- You can leave PACE at any time for any reason, but re-enrollment may not be guaranteed.[3]
- The program is NOT available everywhere in Connecticut—service area availability is critical and varies by PACE organization location.[1][3]
- Non-Medicaid participants pay a monthly premium (exact amount varies and not specified in sources), but once enrolled, there are no deductibles or copays for PACE-provided services.[2]
- Medicaid enrollment is optional but strongly encouraged by states because it simplifies administration and may provide better coverage for participants.[6]
- If a spouse needs PACE services but the other spouse does not, only the qualifying spouse enrolls—the program does not cover both spouses automatically.[6]

**Data shape:** This program has NO income or asset limits, making it unusual among means-tested programs. Eligibility is primarily medical/functional (nursing facility level of care) and geographic (service area availability). The program structure differs significantly based on insurance status: dual-eligible participants (Medicare + Medicaid) receive fully capitated care with no out-of-pocket costs, while non-Medicaid participants pay monthly premiums but also have no deductibles/copays. Connecticut-specific details (organization names, contact information, processing times, regional variations) are not available in provided sources and require direct contact with local PACE organizations or the Connecticut Department of Social Services.

**Source:** https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly and https://www.npaonline.org/eligibility-requirements

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (relevant for elderly): Gross income limit at 200% FPL (Oct 1, 2025 - Sept 30, 2026): 1: $2608/mo, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, each add'l +$916. If over gross, qualify via net income (100% FPL): 1: $1255/mo, 2: $1704, 3: $2152, 4: $2600, 5: $3049, each add'l +$449. All households must meet net income; deductions (e.g., shelter, medical) reduce countable income. Max shelter deduction applies for some.[1][3][4]
- Assets: No asset limit in Connecticut for standard eligibility (home, vehicles exempt). If gross income >200% FPL and has 60+/disabled member, federal rules apply: $4500 asset limit (countable: bank accounts; exempt: home, vehicles, retirement savings).[1]
- Connecticut resident.
- U.S. citizen or qualified non-citizen.
- Able-bodied adults (with exceptions) must register for work.
- Household includes those who buy/cook food together (spouse/children under 22 always included).

**Benefits:** EBT card for food purchases (groceries, not hot food/alcohol/tobacco). Max monthly allotments (examples): 1: $298, 2: $546, 3: $785, 4: $994, 5: $1183, 6: $1421, 7: $1571, 8: $1789, each add'l +$218. Actual amount = max allotment minus 30% of net income (e.g., 2-person elderly: $546 max - 30% net).[1][4][5]
- Varies by: household_size

**How to apply:**
- Online: portal.ct.gov/Apply (CT DSS portal).
- Phone: 2-1-1 or 877-423-4746 (CT SNAP hotline).
- Mail: Download form from portal.ct.gov/dss/snap, mail to local DSS office.
- In-person: Local Department of Social Services (DSS) offices statewide.

**Timeline:** Typically 30 days; expedited (7 days) if very low income/no assets.

**Watch out for:**
- Elderly/disabled: Can skip gross income test if meet net/asset; many miss ESAP simplified app.
- CT expanded to 200% FPL gross (broader than federal).
- Household definition: Includes food-sharing roommates, not just family.
- Deductions key: High medical/shelter costs lower net income.
- No asset limit usually, but federal $4500 if over gross.
- Under-enrollment common: ~half eligible seniors don't apply.[2][7]

**Data shape:** Elderly/disabled special rules (skip gross test, ESAP); benefits scale by household size/net income; no standard asset limit; statewide uniform.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/snap

---

### Connecticut Energy Assistance Program (CEAP)


**Eligibility:**
- Income: Annual household income at or below 60% of state median income: 1: $47,764; 2: $62,460; 3: $77,157; 4: $91,854; 5: $106,550; 6: $121,247; 7: $124,002; 8: $126,758. Categorical eligibility if household receives SNAP, SSI, TANF/TFA, State Supplement, or Refugee Cash Assistance.[1][2][3]
- Assets: No liquid assets test for the 2025-2026 program year.[3]
- Connecticut resident.
- Social Security Number required for each household member (exceptions may apply).
- Proof of income if not categorically eligible: last 30 days or 4 consecutive weeks in last 3 months; self-employed need IRS Form 1040 and worksheet; Social Security needs award letter.[1][2]

**Benefits:** Basic benefit: $295-$595 standard or $345-$645 if vulnerable household member (e.g., elderly, disabled, child under 6); Crisis benefit: $425 per occurrence (up to 3x) for deliverable fuel households in crisis; Rental assistance (heat in rent): $75-$125. Payments to utility/fuel vendor; extra fuel deliveries, payment plans, shut-off protection, equipment repair/replacement possible. Varies by household size, income, heating source, vulnerable status.[1][3]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online via portal.ct.gov (application window open for 2025-2026).[2]
- Phone: Regional providers e.g., New Opportunities: (203) 756-8151 Waterbury, (203) 235-0278 Meriden, (860) 496-0622 Torrington, (860) 738-9138 Winsted.[4]
- In-person or mail via regional community action agencies (contact local provider).[4]
- Contactless applications available.[7]

**Timeline:** Prioritized service for deliverable fuel crisis: fuel delivery authorization within 18 hours of eligibility determination.[3]
**Waitlist:** Benefits available until annual funds run out; no explicit waitlist mentioned.[4]

**Watch out for:**
- Must apply during season (gas/electric: Sep 1, 2025-May 29, 2026); funds limited, apply early.[3][4]
- Everyone needs electric bill; gas households need heating bill.[4]
- Social Security proof required (DSS can't verify directly).[2]
- Vulnerable households (elderly, disabled, young children) get higher benefits—don't miss declaring.[3]
- Crisis benefits only for deliverable fuels (oil, propane) after basic benefit exhausted.[3]

**Data shape:** Benefits scale by household size, income, vulnerable status, and heating source; no asset test; regional administration with prioritized crisis processing; categorical eligibility for certain DSS benefits.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://portal.ct.gov/dss/economic-security/winter-heating-assistance/energy-assistance---winter-heating

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: 60% of State Median Income (SMI). Exact amounts (from related HES-IE program using same criteria): 1-person: under $39,027; 2: under $51,036; 3: under $63,044; 4: under $75,052; 5: under $87,061; 6: under $99,069; 7: under $101,320; 8: under $103,572. Amounts may vary annually with SMI updates.[1][3]
- Assets: No asset limits mentioned in sources.
- Priority for elderly (60+), persons with disabilities, families with children, high-energy users, high energy burden (6%+ of income on energy).[1][5]
- Home not weatherized by WAP, LIHEAP, HUD, or USDA in last 15 years.[1]
- Home not for sale/listed for sale within 6 months of work completion, not in foreclosure or loan mediation.[1][5]
- Multi-family: at least 2/3 tenants income-eligible.[1]
- Landlords of rentals may contribute 20% of material costs, up to $500 per unit.[5]

**Benefits:** Free energy audit, weatherization measures including air sealing, insulation (attic/sidewall), heating system tune-ups/repairs, blower door guided air-sealing, water-saving measures, health/safety inspections. Single-family max: $10k energy measures, $2.5k health/safety, $2.5k incidental repairs (total $15k without review). Multi-family max: $10k energy, $1.5k health/safety, $2.5k incidental.[1][5][6]
- Varies by: priority_tier

**How to apply:**
- Joint with Connecticut Energy Assistance Program: Call 2-1-1 for intake site, request Weatherization Card/Referral Form.[1]
- Email directly: DEEP.Weatherization@ct.gov.[1][2]
- Through statewide Community Action Agencies (CAA) or local non-profits.[1]

**Timeline:** Not specified in sources.
**Waitlist:** Possible deferral to other programs like REPS if deferred from WAP.[8]

**Watch out for:**
- Uses same eligibility as Energy Assistance Program; apply there first for joint process.[1]
- Home must not have been weatherized in past 15 years or be in sale/foreclosure process.[1][5]
- Priority groups get preference; non-priority may face longer waits.[1]
- Not to be confused with utility-funded HES-IE (same income but separate, no-cost audit).[3]
- Landlord contribution possible for rentals.[5]
- Annual renewal required.[2]

**Data shape:** Joint application with Energy Assistance Program via 2-1-1; priority-based with elderly focus; local CAA administration; strict home history rules (no recent weatherization, no sale/foreclosure); max spend caps by dwelling type.

**Source:** https://portal.ct.gov/DEEP/Energy/Weatherization/Weatherization-in-Connecticut

---

### CHOICES (CT SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; free and unbiased services available to all Medicare-eligible individuals, families, and caregivers of all ages and income levels[2][5][6].
- Assets: No asset limits or tests apply[6].
- Medicare-eligible: US citizens or permanent residents aged 65+; certain younger people with disabilities approved by Social Security Administration (e.g., collecting SSDI for 24 months); or those who worked 40 quarters eligible for Social Security/Railroad Retirement[3][5][9]
- Connecticut residents[1][2][5]
- Includes caregivers, providers, and those becoming eligible for Medicare; no prior Medicare experience required[1][9]

**Benefits:** Free, unbiased one-on-one benefits counseling on Medicare Parts A/B (Original), C (Advantage), Supplement, D (Prescription Drugs); enrollment assistance and plan comparisons for Part C/D; eligibility screening and application assistance for cost-assistance programs (Medicaid, Medicare Savings Program, Low-Income Subsidy/Extra Help); outreach, information/referral, claims dispute guidance; long-term care info[2][5][7][9]

**How to apply:**
- Phone: Call 800.994.9422 or local SHIP/CHOICES counselor[5][7]
- In-person: Accessible locations throughout the state via 5 Area Agencies on Aging (AAAs) or community organizations[2][5][7]
- Contact local AAA or Center for Medicare Advocacy partners for counseling sessions[2][8]

**Timeline:** No formal application processing; counseling provided upon contact, though training/certification for counselors may influence availability[6]

**Watch out for:**
- Not a direct service/financial benefit program—provides counseling and assistance only, not healthcare or payments[2][5]
- Counselors are trained volunteers/staff, not insurance agents; no financial gain from recommendations[2][6]
- Confused with Medicare itself or other CT programs; it's SHIP for navigation help[1][4]
- Open Enrollment (Oct 15-Dec 7) critical period—contact for timely help[8]
- Employer group health plans or HSAs may affect Medicare enrollment timing[3]

**Data shape:** No income/asset tests; volunteer/staff-delivered counseling via 5 regional AAAs; partners with Center for Medicare Advocacy; open to all Medicare-eligible CT residents and caregivers

**Source:** https://portal.ct.gov/ads/programs-and-services/choices[5]

---

### Connecticut Statewide Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"description":"The person with dementia cannot exceed $58,772.00 annual income[2]. One source cites $48,266.00 annually[4], suggesting possible regional or temporal variation.","note":"No household size adjustments mentioned in available regulations"}
- Assets: {"liquid_assets_maximum":"$156,253.00[2]","what_counts":"Liquid assets (specific definition of what qualifies not detailed in regulations)","exemptions":"Not specified in available documentation"}
- Diagnosis of irreversible and deteriorating dementia (Alzheimer's disease or related conditions)[1][2]
- Physician certification required via completed 'Physician Statement' form[2]
- Eligible dementias include: Alzheimer's Disease, Multi-infarct dementia, Parkinson's Disease, Lewy Body Dementia, Huntington's Disease, Normal Pressure Hydrocephalus, or Pick's Disease[2]
- Must have an identified caregiver[4]
- Cannot currently be receiving services from the Connecticut Homecare Program for Elders[2]
- Both care recipient and caregiver must reside in Connecticut[8]
- Caregiver must be experiencing physical or mental impairments or have primary responsibility for care (considered on case-by-case basis)[1]

**Benefits:** Up to $7,500 per year in respite care subsidies[2][5][6]
- Varies by: Available funding and applicant's level of need as determined by Care Manager[2][5]

**How to apply:**
- Phone: 1-800-994-9422 (to be directed to nearest Area Agency on Aging)[6]
- Phone: 860-887-3561 (Senior Resources – Eastern CT)[2][6]
- In-person or mail through local Area Agency on Aging (specific addresses not provided in regulations)
- Contact Department of Social Services for specific application procedures[3]

**Timeline:** Not specified in available regulations[3]
**Waitlist:** Not mentioned in available documentation

**Watch out for:**
- Income limit discrepancy: Two different income thresholds appear in regulations ($58,772[2] vs. $48,266[4]) — verify current limit when applying[2][4]
- Cannot receive simultaneously with Connecticut Homecare Program for Elders — applicants must choose one program[2]
- Funding is contingent on available funding — not guaranteed even if eligible[2][5]
- 20% co-payment required unless specifically waived — families should budget for this cost[2]
- Physician must complete specific 'Physician Statement' form — generic medical records may not suffice[2]
- Care recipient cannot be spouse or conservator of provider — limits family hiring options[3]
- Processing timeline not specified — families should call ahead to understand wait expectations[3]
- Self-directed option available (hire private caregiver through fiduciary) but requires additional setup[2]
- Program provides subsidy, not full coverage — families responsible for remaining costs after subsidy and co-payment[2]

**Data shape:** This program's data structure is characterized by: (1) fixed annual subsidy cap ($7,500) rather than hourly/service-based limits; (2) administration through regional Area Agencies on Aging creating potential for regional variation not documented in state regulations; (3) conflicting income limits in available sources suggesting possible updates or regional differences; (4) contingency on available funding making benefits non-guaranteed; (5) flexibility in service types and delivery method (agency vs. self-directed) but fixed financial ceiling; (6) integration with broader caregiver support ecosystem (Alzheimer's Association, multiple state agencies) rather than standalone program.

**Source:** https://portal.ct.gov/ads/knowledge-base/articles/independent-living-services/healthy-living-services/connecticut-statewide-respite-care[6]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level. The search results do not provide specific dollar amounts by household size for Connecticut, as federal poverty guidelines vary annually and by household composition. Families should contact the Connecticut provider directly or consult current federal poverty guidelines to determine their exact threshold.
- Assets: Not specified in available search results.
- Must be unemployed
- Enrollment priority given to: (1) veterans and qualified spouses of veterans, (2) individuals over age 65, (3) individuals with disabilities, (4) individuals with low literacy skills or limited English proficiency, (5) individuals residing in rural areas, (6) individuals who are homeless or at risk of homelessness, (7) individuals with low employment prospects, (8) individuals who have failed to find employment after using American Job Center services

**Benefits:** Paid on-the-job training at an average of 20 hours per week at the highest of federal, state, or local minimum wage. Participants gain work experience in community service activities at nonprofits and public facilities (schools, hospitals, day-care centers, senior centers). Services may include career assessment, Individual Employment Plan development, supportive services, specialized skill training, and professional job placement assistance. Career tracks include: home health aide, food service, customer service, office administration, stock clerk, and retail sales.
- Varies by: fixed

**How to apply:**
- Phone: 203-461-2154 (Associates for Training and Development, Stamford, CT — the Connecticut SCSEP provider)
- In-person: Associates for Training and Development, Stamford, CT 06831
- Website: www.a4td.org
- American Job Center network (job seekers also have access to employment assistance through this network)

**Timeline:** Not specified in available search results.
**Waitlist:** Not specified in available search results.

**Watch out for:**
- Income limit is strict: 125% of federal poverty level is relatively low. A family should verify their exact threshold before applying, as it varies by household size and is updated annually.
- This is a temporary, part-time training program (average 20 hours/week), not permanent employment. It is designed as a 'bridge to unsubsidized employment,' meaning participants are expected to transition to regular jobs after training.
- Priority enrollment is given to veterans and those over 65 first — if the applicant is under 65 and not a veteran, they may face longer wait times or lower priority.
- The program serves a community service objective, meaning placements are at nonprofits and public agencies, not private employers. This limits the types of work experience available.
- Participants must be actively unemployed to qualify — those with part-time or any current employment may not be eligible.
- The search results do not provide information on processing times, waitlists, or specific application forms, which are critical details for planning. Families should contact A4TD directly for these specifics.

**Data shape:** SCSEP is a federally funded program with state/local co-funding (90% federal, 10% nonfederal match). In Connecticut, it is administered by a single primary provider (A4TD) rather than multiple regional offices. Benefits are fixed (20 hours/week at minimum wage) rather than scaled by household size. Eligibility is based on a strict income threshold tied to federal poverty guidelines, which vary by household size but are not itemized in the available search results. The program prioritizes certain populations (veterans, 65+, disabled, rural, homeless/at-risk) but does not appear to have separate tiers of benefits based on priority status — all participants receive the same 20 hours/week training structure.

**Source:** https://www.dol.gov/agencies/eta/seniors (U.S. Department of Labor); Connecticut Department of Aging and Disabilities co-funds the program

---

### Long Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to all regardless of financial status.
- Assets: No asset limits or tests; no assets count or are exempt as there is no financial eligibility.
- Residency in a Connecticut skilled nursing facility, residential care home, assisted living/managed residential services facility, or board and care home.
- Open to residents, their family members or friends, facility staff with resident concerns, individuals considering placement, or citizen groups interested in resident welfare.

**Benefits:** Advocacy services including resolving complaints confidentially (with permission to share), providing information on facilities and quality care, promoting resident rights, facilitating communication between residents/families and staff, supporting family/resident councils, and visiting facilities to address issues like diet changes, timely assistance, or activities.

**How to apply:**
- Phone: 860-424-5200 or 1-866-388-1888.
- Email: LTCOP@CT.GOV.
- In-person or mail: 55 Farmington Avenue, Hartford, CT 06105-3730.
- Website: https://portal.ct.gov/LTCOP (for information and contacts).

**Timeline:** Immediate assistance available upon contact; no formal processing as it's an advocacy hotline/service.

**Watch out for:**
- Services are free advocacy, not financial aid, healthcare, or housing placement—focuses on rights protection and complaint resolution in long-term care facilities.
- Confidentiality maintained unless permission given to act on complaints.
- Not for general elderly care outside licensed long-term care facilities.
- Volunteering has restrictions (e.g., cannot if employed by or owning a facility, or if immediate family resides there).
- Families considering placement can get info, but must be for covered facility types.

**Data shape:** no income test; advocacy-only with no financial eligibility, asset review, waitlists, or tiered benefits; open to residents/families pre- and post-placement in specific facility types; volunteer-driven with regional staff support.

**Source:** https://portal.ct.gov/LTCOP

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| HUSKY Health (Medicaid for seniors/disab | benefit | state | deep |
| Connecticut Home Care Program for Elders | benefit | federal | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Connecticut Energy Assistance Program (C | benefit | state | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| CHOICES (CT SHIP) | resource | federal | simple |
| Connecticut Statewide Respite Care Progr | benefit | state | deep |
| Senior Community Service Employment Prog | navigator | federal | simple |
| Long Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":7,"resource":2,"navigator":1}
**Scopes:** {"state":3,"federal":6,"local":1}
**Complexity:** {"deep":7,"simple":3}

## Content Drafts

Generated 10 page drafts. Review in admin dashboard or `data/pipeline/CT/drafts.json`.

- **HUSKY Health (Medicaid for seniors/disabled)** (benefit) — 5 content sections, 6 FAQs
- **Connecticut Home Care Program for Elders (CHCPE) - Medicare Savings** (benefit) — 6 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (CT PACE)** (benefit) — 2 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Connecticut Energy Assistance Program (CEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 4 content sections, 6 FAQs
- **CHOICES (CT SHIP)** (resource) — 2 content sections, 6 FAQs
- **Connecticut Statewide Respite Care Program** (benefit) — 5 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (navigator) — 2 content sections, 6 FAQs
- **Long Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **Insurance status (Medicaid vs. non-Medicaid vs. dual-eligible). Services are provided 24 hours a day, every day of the year.[4]**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **Available funding and applicant's level of need as determined by Care Manager[2][5]**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **HUSKY Health (Medicaid for seniors/disabled)**: Tiered by subcategory (standard ABD, LTSS, MED-Connect) with varying income/asset limits; asset test required; LTSS needs care level assessment; statewide but subcategory-specific referrals
- **Connecticut Home Care Program for Elders (CHCPE) - Medicare Savings**: Multi-tiered (Medicaid-funded vs state-funded); benefits scale by functional need/priority tier and funding source; no uniform income limit; regional provider variations; MSP integrated for premium savings with no asset test.
- **Program of All-Inclusive Care for the Elderly (CT PACE)**: This program has NO income or asset limits, making it unusual among means-tested programs. Eligibility is primarily medical/functional (nursing facility level of care) and geographic (service area availability). The program structure differs significantly based on insurance status: dual-eligible participants (Medicare + Medicaid) receive fully capitated care with no out-of-pocket costs, while non-Medicaid participants pay monthly premiums but also have no deductibles/copays. Connecticut-specific details (organization names, contact information, processing times, regional variations) are not available in provided sources and require direct contact with local PACE organizations or the Connecticut Department of Social Services.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled special rules (skip gross test, ESAP); benefits scale by household size/net income; no standard asset limit; statewide uniform.
- **Connecticut Energy Assistance Program (CEAP)**: Benefits scale by household size, income, vulnerable status, and heating source; no asset test; regional administration with prioritized crisis processing; categorical eligibility for certain DSS benefits.
- **Weatherization Assistance Program**: Joint application with Energy Assistance Program via 2-1-1; priority-based with elderly focus; local CAA administration; strict home history rules (no recent weatherization, no sale/foreclosure); max spend caps by dwelling type.
- **CHOICES (CT SHIP)**: No income/asset tests; volunteer/staff-delivered counseling via 5 regional AAAs; partners with Center for Medicare Advocacy; open to all Medicare-eligible CT residents and caregivers
- **Connecticut Statewide Respite Care Program**: This program's data structure is characterized by: (1) fixed annual subsidy cap ($7,500) rather than hourly/service-based limits; (2) administration through regional Area Agencies on Aging creating potential for regional variation not documented in state regulations; (3) conflicting income limits in available sources suggesting possible updates or regional differences; (4) contingency on available funding making benefits non-guaranteed; (5) flexibility in service types and delivery method (agency vs. self-directed) but fixed financial ceiling; (6) integration with broader caregiver support ecosystem (Alzheimer's Association, multiple state agencies) rather than standalone program.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a federally funded program with state/local co-funding (90% federal, 10% nonfederal match). In Connecticut, it is administered by a single primary provider (A4TD) rather than multiple regional offices. Benefits are fixed (20 hours/week at minimum wage) rather than scaled by household size. Eligibility is based on a strict income threshold tied to federal poverty guidelines, which vary by household size but are not itemized in the available search results. The program prioritizes certain populations (veterans, 65+, disabled, rural, homeless/at-risk) but does not appear to have separate tiers of benefits based on priority status — all participants receive the same 20 hours/week training structure.
- **Long Term Care Ombudsman Program**: no income test; advocacy-only with no financial eligibility, asset review, waitlists, or tiered benefits; open to residents/families pre- and post-placement in specific facility types; volunteer-driven with regional staff support.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Connecticut?
