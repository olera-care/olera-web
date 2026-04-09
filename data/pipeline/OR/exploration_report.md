# Oregon Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 1.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 15 |
| New (not in our data) | 14 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 9 programs
- **financial**: 2 programs
- **in_kind**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### National Family Caregiver Support Program (NFCSP)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Information and assistance; individual counseling, support groups, caregiver training; respite care; supplemental services on limited basis. Regional examples: annual respite grants $500-$1,000; case management; caregiver events[1][2][3][7][8]. No fixed hours or statewide dollar caps specified.` ([source](https://www.oregon.gov/odhs/aging-disability-services/pages/caregivers.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://www.oregon.gov/odhs/aging-disability-services/pages/caregivers.aspx`

## New Programs (Not in Our Data)

- **Oregon Health Plan (OHP)** — service ([source](https://www.oregon.gov/oha/hsd/ohp/pages/apply.aspx))
  - Shape notes: benefits scale by household size and tier (OHP Plus/Bridge/OSIPM); income uses FPL or FBR; long-term care for elderly via OSIPM with asset tests and spend-down; statewide but local ODHS/ADRC handling
- **APD Medicaid Long Term Services and Supports** — service ([source](https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/pages/waivers-kplan.aspx))
  - Shape notes: Waiver-based with priority tiers (SPL 1-13); waitlisted and area-dependent; NFLOC via CAPS assessment; separate from entitlement ABD Medicaid.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/pace-fact-sheet.pdf))
  - Shape notes: county-restricted to PACE service areas with multiple providers; no financial eligibility test; NFLOC via Oregon SPL 1-13; private pay option
- **Medicare Savings Programs (MSP) via OHP** — financial ([source](https://www.oregon.gov/odhs/aging-disability-services/pages/medicare-savings-programs.aspx))
  - Shape notes: MSP is a three-tier program with escalating income thresholds and different benefit levels. The program is statewide but has enrollment caps on the SMF tier. Income limits are tied to federal poverty levels and adjust annually. Unlike some states, Oregon eliminated resource limits for QMB programs. The program requires Medicare Part A enrollment and excludes those eligible for other Medicaid benefits (for SMF tier). Processing timelines and specific regional office locations are not detailed in available sources.
- **SNAP Food Benefits** — in_kind ([source](https://www.oregon.gov/odhs/food/pages/snap.aspx))
  - Shape notes: Benefits scale by household size and net income. Program has special rules for elderly (60+) and disabled members that provide alternative pathways to qualification and increased benefit amounts. Work requirements for able-bodied adults without dependents create regional variation in eligibility enforcement. Oregon's expanded eligibility goes beyond federal minimums. Medical cost deductions are unique feature for elderly/disabled households. Regional variation exists for benefit delivery method (EBT card vs. check vs. direct deposit) and cash benefit option in specific counties.
- **Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)** — financial ([source](https://www.oregon.gov/ohcs/energy-weatherization/pages/utility-bill-payment-assistance.aspx))
  - Shape notes: Income table scales by household size at 60% SMI; priority tiers for elderly/disabled; administered via ~20 county Community Action Agencies with slight policy variations; no statewide fixed grant amount
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.oregon.gov/ohcs/energy-weatherization/Pages/default.aspx))
  - Shape notes: Administered by county-specific subgrantees with varying contacts; priority tiers affect service timing; income fixed at 200% FPL with no asset test; services vary by audit results
- **Senior Health Insurance Benefits Assistance (SHIBA)** — service ([source](https://shiba.oregon.gov))
  - Shape notes: no income or asset test; volunteer-based counseling service scaled statewide via local sites with no fixed benefits value
- **Meals on Wheels (via Area Agencies on Aging)** — service ([source](https://www.oregon.gov/odhs/aging-disability-services/pages/meals-nutrition.aspx))
  - Shape notes: Decentralized via 20+ local Area Agencies on Aging; eligibility/assessments vary by region/provider; no uniform income table or statewide processing times; Medicaid path separate from OAA-funded
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/senior-employment.aspx))
  - Shape notes: SCSEP is a federally authorized program with state and non-profit administration. Oregon's program is administered by Easter Seals Oregon as the primary grantee. Income eligibility is pegged to federal poverty guidelines (updated annually), creating variable dollar thresholds. The program emphasizes transitional employment with priority enrollment tiers rather than universal access. Critical gaps in publicly available data: specific current income thresholds by household size, asset limits, processing timelines, required documentation, and regional service variations within Oregon.
- **Long-Term Care Ombudsman Program** — advocacy ([source](oltco.org[8] and Oregon Secretary of State (sos.oregon.gov)[2]))
  - Shape notes: This program has two distinct user groups: (1) residents/families/public seeking complaint resolution and advocacy (free service), and (2) community members volunteering as certified ombudsmen (16 hrs/month commitment). The search results contain no income limits, asset limits, or eligibility barriers for accessing services — the program is universally available to anyone with a concern about a long-term care resident. The volunteer role has specific qualifications but is not what families typically seek.
- **Senior Guardianship Assistance Program (Senior GAP)** — service ([source](https://www.oltco.org/programs/opg-about-us.html (Oregon Public Guardian, related state program); program-specific at https://impactnw.org/programs/seniors/guardianship-assistance-2/[1][7]))
  - Shape notes: County-restricted private fee-for-service via nonprofits like Impact NW; distinct from state OPG (capacity-limited for incapacitated adults) and child GAP (Title IV-E foster care subsidies); no income/asset tests, vulnerability-driven with court involvement.
- **Oregon Senior Tuition Waiver (OSU/UO Audit Program)** — in_kind ([source](https://www.oregonlegislature.gov/bills_laws/ors/ors352.html (ORS 352.303 for universities); https://www.oregonlegislature.gov/bills_laws/ors/ors341.html (ORS 341.518 for community colleges)))
  - Shape notes: Statewide but institution-administered; audit-only (no credit); no financial tests; space/instructor gatekept; age 65+ per statute (some colleges 60+)
- **Health Related Social Needs Benefits (HSRSN)** — service ([source](https://www.oregon.gov/oha/hsd/medicaid-policy/pages/hrsn.aspx[1]))
  - Shape notes: OHP/Medicaid-exclusive; eligibility ties specific life transitions to clinical risks per service; housing income at 30% local AMI; CCO-administered with regional processing variations; no age minimum but includes elderly (65+) as clinical factor.

## Program Details

### Oregon Health Plan (OHP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For elderly (65+), eligibility is primarily through OSIPM (Oregon Supplemental Income Program-Medical), part of OHP for long-term care. Income limits for Aged, Blind, and Disabled (ABD) category in 2025: $967/month for an individual, $1,450/month for a couple (based on Federal Benefit Rate). General OHP Plus for adults 19-64 is up to 133% FPL (~$1,507/month single, $3,076 family of 4; updated annually). OHP Bridge for adults 19-65: 139-200% FPL (e.g., single: up to ~$2,674/month). Limits vary by household size and program; full table example from CareOregon (approximate monthly, subject to annual FPL updates): Family of 1 - OHP Plus $1,800, Bridge $2,674; Family of 2 - higher accordingly. Elderly long-term care has specific thresholds; apply to confirm.[3][4][5]
- Assets: OSIPM for elderly long-term care has asset limits (not detailed in exact dollar amounts here, but typically Medicaid-standard ~$2,000 individual/$3,000 couple excluding home, one car, personal items, burial plots). Ways to qualify if over limits via spend-down or exemptions. What counts: cash, bank accounts, investments; exempt: primary home (if intent to return), one vehicle, household goods.[3]
- Oregon resident
- U.S. citizen or eligible immigration status (as of July 2023, some benefits regardless of status)
- For long-term care: need for nursing home (30+ days), assisted living, adult foster care, or home-based services; meet disability/blind criteria if applicable
- Not eligible if access to affordable insurance (for Bridge)
- Verification of income/resources required post-application[1][3][6]

**Benefits:** Comprehensive no-cost coverage: medical, dental, prescription drugs, behavioral health. For elderly/long-term care via OSIPM: nursing home care, assisted living, adult foster care, home health/non-medical support services to stay at home. Nursing home residents keep ~$77/month personal needs allowance ($90 with VA pension). Covers frail seniors' needs.[3][4][6]
- Varies by: priority_tier

**How to apply:**
- Online: ONE.Oregon.gov or Benefits.Oregon.gov
- Phone: 1-800-699-9075 (ONE Customer Service); for older adults/disabilities: 1-855-ORE-ADRC (855-673-2372)
- Mail: OHP Customer Service, P.O. Box (details on site)
- In-person: Local Oregon Department of Human Services (ODHS) office or Aging and Disability Resource Connection (ADRC)

**Timeline:** Not specified in sources; apply anytime, eligibility determined after submission.

**Watch out for:**
- Multiple OHP tiers (Plus, Bridge, OSIPM for elderly LTC) with different limits—elderly often need OSIPM, not standard Plus; ABD has stricter FBR-based limits vs. FPL; asset tests apply for LTC, not always for general OHP; income calculated current/next/annual depending on program; Medicare dual-eligibility affects drug coverage (OHP Limited Drug); spend-down options if over limits; FPL updates annually—2026 guide referenced but limits shown through 2025; apply even if over limits as exemptions/strategies exist[1][3][4][9]

**Data shape:** benefits scale by household size and tier (OHP Plus/Bridge/OSIPM); income uses FPL or FBR; long-term care for elderly via OSIPM with asset tests and spend-down; statewide but local ODHS/ADRC handling

**Source:** https://www.oregon.gov/oha/hsd/ohp/pages/apply.aspx

---

### APD Medicaid Long Term Services and Supports

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For single applicants in 2026: $2,982 per month. Limits vary by marital status and program (e.g., slightly different for K Plan and CEP under ABD Medicaid). Couples or households have adjusted limits based on Oregon Health Plan rules, but specific tables not detailed; consult OHP for full household breakdowns.[1][2]
- Assets: For single applicants in 2026: $2,000. Counts most assets; exemptions typically include primary home (if equity under certain limits), one vehicle, personal belongings, and burial funds (standard Medicaid exemptions apply). Spousal protections allow higher community spouse asset allowance.[1][2]
- Nursing Facility Level of Care (NFLOC) determined via Client Assessment and Planning System (CAPS) assessing ADLs/IADLs.
- For APD Waiver: Service Priority Level (SPL) 1-13; primarily for those 65+ or 18-64 physically disabled transitioning from nursing home to community.
- Aged, blind, or disabled for basic ABD Medicaid; functional assessment for long-term services.[1][2][3]

**Benefits:** Home and community-based services including Waiver Case Management, Community Transition Services (one-time setup for institutional transitions), Housing Support Services, personal care, homemaker services, home modifications, adult foster care, assisted living, and non-medical supports to avoid institutionalization. Specifics via K Plan (state plan option) or 1915(c) APD Waiver; no fixed dollar amounts or hours—personalized based on assessment.[3][6]
- Varies by: priority_tier

**How to apply:**
- Phone: Contact local Aging and Disability Resource Connection (ADRC) or APD office (numbers via oregon.gov/odhs).
- Online: Oregon Health Plan application at benefits.oregon.gov (ONE system).
- Paper/Mail: Form 7210 Application for Oregon Health Plan (OHP) Benefits.
- In-person: Local APD offices or ADRCs.[7][8]

**Timeline:** Not specified; functional assessment via interview (in-person or phone).[4]
**Waitlist:** Yes, due to limited funding; varies by eligibility category, service availability, and area. Highest need prioritized via SPL.[1][4][9]

**Watch out for:**
- Not an entitlement—waitlists common unlike basic ABD Medicaid coverage.
- Must be transitioning from nursing home for core APD Waiver; SPL 1-13 required.
- K Plan and CEP have slightly different financial limits than standard ABD.
- Functional NFLOC assessment via CAPS is mandatory; prepare for ADL/IADL interview.
- Income over limit? Spousal impoverishment rules or spend-down may apply, but consult planner.[1][2][3][4]

**Data shape:** Waiver-based with priority tiers (SPL 1-13); waitlisted and area-dependent; NFLOC via CAPS assessment; separate from entitlement ABD Medicaid.

**Source:** https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/pages/waivers-kplan.aspx

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits. Fully covered for Medicaid-eligible individuals. Non-Medicaid participants with Medicare pay a monthly premium (amount not specified in sources). Private pay option available for those ineligible for Medicare or Medicaid.
- Assets: No asset limits specified.
- Reside in the PACE program's approved service area
- Assessed at Nursing Facility Level of Care (Oregon Service Priority Level 1-13)
- Able to live safely in the community (own home, community-based care, or CBC facility) with PACE services without jeopardizing health/safety of self or others
- Medicaid eligible or willing to pay private fees
- Willing to receive all health and long-term care exclusively from PACE providers
- Not eligible if requiring enhanced care or long-term care at Oregon State Hospital, or Medicare skilled care with no community discharge expected within 30 days

**Benefits:** All Medicare and Medicaid services plus long-term care: primary medical care, prescription drugs, adult day services, occupational/physical therapy, social work, in-home services, community-based care (CBC) facility care, nursing home care (if enrolled), palliative care, medical equipment/supplies, dietary services. Delivered via interdisciplinary team at health/social centers or home/community settings. No deductibles or copays for PACE-provided services.
- Varies by: region

**How to apply:**
- Contact PACE organization intake specialists for screening and enrollment (specific providers handle intake)
- No central statewide phone or form specified; contact local PACE provider (e.g., Providence ElderPlace for Multnomah/Clackamas/Washington/Clatsop areas)

**Timeline:** Not specified in sources
**Waitlist:** Not specified in sources

**Watch out for:**
- Must use ONLY PACE providers for all care (no outside doctors/services)
- Limited to specific service areas; must live there or relocate
- Nursing home level assessment required (SPL 1-13 in Oregon); not for those needing state hospital care
- Non-Medicaid pay premium (cost varies/not specified)
- Enrollment can occur in home/CBC/nursing facility, but must be safe in community with PACE

**Data shape:** county-restricted to PACE service areas with multiple providers; no financial eligibility test; NFLOC via Oregon SPL 1-13; private pay option

**Source:** https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/pace-fact-sheet.pdf

---

### Medicare Savings Programs (MSP) via OHP

> **NEW** — not currently in our data

**Eligibility:**
- Income: MSP has three tiers with different income thresholds[6]: (1) QMB (Qualified Medicare Beneficiary): $1,330/month for individual, $1,804/month for couple (100% of federal poverty level); (2) SLMB/SMB (Specified Low-Income Medicare Beneficiary): $1,596/month for individual, $2,164/month for couple (120% of poverty level); (3) QI/SMF (Qualifying Individual): $1,796/month for individual, $2,435/month for couple (120-135% of poverty level). Income limits increase annually in March[6]. Note: ODHS starts with gross income and subtracts $20[8].
- Assets: As of January 1, 2016, there are no resource limits for QMB programs in Oregon[3][8]. However, for Oregon Health Plan (OHP) eligibility more broadly, Medicare members must have $2,000 or less in countable assets[2][10].
- Must be enrolled in Medicare Part A (hospital insurance)[1][6]
- Income and resources must be within eligibility limits[3]
- If eligible for any other Medicaid benefit offered by the State of Oregon, you are not eligible for the SMF benefit[6]
- Individuals in nursing facilities, intermediate care facilities for the mentally retarded (ICF/MR), or hospitals are not eligible for QMB-SMB if income is 120% or greater of FPL[1]

**Benefits:** QMB pays for Medicare Part A and B premiums, deductibles, and co-insurance[6]. SLMB/SMB pays for Part B premiums[6]. QI/SMF pays for Part B premiums[6].
- Varies by: priority_tier

**How to apply:**
- Contact your nearest Aging and Disability Office[3]
- Online application available through Oregon Health Plan system
- Phone application available
- In-person application at local offices

**Timeline:** Not specified in search results
**Waitlist:** SMF benefit has enrollment caps: 'We are only allowed to serve a certain number of people each year for the SMF benefit. Unfortunately, we must shut down enrollment if we reach our limit.'[6]

**Watch out for:**
- SMF (QI) benefit has annual enrollment caps and may close if limits are reached[6]
- If someone qualifies for ANY other Medicaid benefit from Oregon, they cannot use SMF[6]
- Income limits are recalculated annually in March[6]
- ODHS uses gross income minus $20 as the starting point for calculations[8]
- People often don't realize they may qualify even if they think their income is too high[8]
- No resource limits for QMB programs in Oregon as of 2016, but this differs from other states[3][8]
- Medicare is primary insurance; MSP is supplemental[3]

**Data shape:** MSP is a three-tier program with escalating income thresholds and different benefit levels. The program is statewide but has enrollment caps on the SMF tier. Income limits are tied to federal poverty levels and adjust annually. Unlike some states, Oregon eliminated resource limits for QMB programs. The program requires Medicare Part A enrollment and excludes those eligible for other Medicaid benefits (for SMF tier). Processing timelines and specific regional office locations are not detailed in available sources.

**Source:** https://www.oregon.gov/odhs/aging-disability-services/pages/medicare-savings-programs.aspx

---

### SNAP Food Benefits

> **NEW** — not currently in our data

**Eligibility:**
- Age: No minimum age requirement for household members, but special rules apply for households with members 60 or older+
- Income: {"description":"Gross income limit is 200% of federal poverty level (Oct. 1, 2025 through Sept. 30, 2026)[1]","gross_income_limits_by_household_size":{"1_person":"$2,608/month","2_people":"$3,526/month","3_people":"$4,442/month","4_people":"$5,358/month","5_people":"$6,276/month","6_people":"$7,192/month","7_people":"$8,108/month","each_additional_person":"+$916/month"},"special_rule_for_elderly_or_disabled":"If household has member 60+ or with disability and exceeds gross income limit, can qualify instead by meeting Net Income and Asset tests[1]","net_income_calculation":"SNAP benefits are based on net income; approximately $100 more in net income = $30 less in benefits[1]"}
- Assets: {"general_rule":"House, car, and money in bank usually do not count against eligibility[2]","specific_exemptions":"Search results do not provide detailed asset limit thresholds, but indicate assets are generally not a barrier to qualification"}
- Must live in Oregon[2]
- Must be U.S. citizen or eligible non-citizen[2]
- Eligible non-citizens must meet specific criteria: lived in U.S. for 5 years, under age 18, worked 40 qualifying work quarters, blind/disabled, or 65+ and legally present since Aug. 22, 1996[2]
- Able-bodied adults without dependents (ABAWDs, ages 18–64) must work, volunteer, or train for at least 80 hours/month to remain eligible for SNAP[3]

**Benefits:** Variable based on household net income; benefits are provided as food purchasing power on EBT card (or check/direct deposit in some cases)[1][2]
- Varies by: household_size and net_income

**How to apply:**
- Online: Through Oregon Department of Human Services (ODHS) website[9]
- Phone: Contact ODHS (specific phone number not provided in search results)[9]
- In-person: At local ODHS office[9]
- Mail: Application by mail option available (specific address not provided in search results)[9]

**Timeline:** Search results do not specify standard processing time. Expedited benefits available: if approved, can receive benefits within 7 days if applicant qualifies for expedited SNAP[4]
**Waitlist:** No waitlist mentioned in search results

**Watch out for:**
- Only about half of eligible seniors apply for SNAP despite qualifying; low participation rate among older adults[4]
- Able-bodied adults without dependents (ages 18–64) must now work/volunteer/train 80 hours/month or lose benefits after 3 months; this requirement is rolling out by region starting October 2025[3]
- Oregon has expanded eligibility beyond federal requirements, so other websites may show stricter limits than Oregon's actual rules[1]
- Medical cost deductions require proof; out-of-pocket medical expenses must be documented to qualify for increased benefits[2][6]
- Households with elderly or disabled members receive different treatment: they can qualify via Net Income/Asset tests even if over gross income limit, and have access to medical cost deductions[1][2]
- SNAP eligibility changes from H.R. 1 removed eligibility for certain refugee, asylee, and lawfully present immigrant groups; check ODHS page for current list[3]
- Existing SNAP participants were notified of benefit changes starting October 15, 2025[3]
- For older adults with mobility issues, a trusted person can purchase food on their behalf using their SNAP benefits via alternate payee form[2][6]
- SNAP can be used at community meal sites like Meals on Wheels, not just traditional grocery stores[7]

**Data shape:** Benefits scale by household size and net income. Program has special rules for elderly (60+) and disabled members that provide alternative pathways to qualification and increased benefit amounts. Work requirements for able-bodied adults without dependents create regional variation in eligibility enforcement. Oregon's expanded eligibility goes beyond federal minimums. Medical cost deductions are unique feature for elderly/disabled households. Regional variation exists for benefit delivery method (EBT card vs. check vs. direct deposit) and cash benefit option in specific counties.

**Source:** https://www.oregon.gov/odhs/food/pages/snap.aspx

---

### Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross income at or below 60% of Oregon State Median Income (SMI), based on household size. Effective October 1, 2025 (most recent available): 1: $38,385 annual/$3,198.75 monthly; 2: $50,196/$4,183; 3: $62,006/$5,167.17; 4: $73,817/$6,151.42; 5: $85,627/$7,135.58; 6: $97,438/$8,119.83; 7: $99,652/$8,304.33; 8: $101,867/$8,488.92; 9: $104,081/$8,673.42; 10: $106,296/$8,858; 11: $108,510/$9,042.50; 12: $110,725/$9,227.08; each additional: +$2,215 annual/+184.58 monthly. For single-person households, greater of 60% SMI or full-time Portland minimum wage. Gross income before deductions. Levels based on prior 30 days income[2][4][5].
- Assets: No asset limits mentioned in program guidelines[2][5].
- Oregon resident
- Documented energy costs (e.g., heating/cooling bills from any fuel source including wood, oil; must have utility bill)
- Homeowners and renters eligible (rental/utility agreements and landlord cooperation may affect benefits)
- Priority for seniors 60+ and/or documented disabled, especially homebound[2][3][5]

**Benefits:** One-time grant applied directly to energy provider for heating/cooling bills; may include repair/replacement of unsafe heating systems; energy education, case management, home weatherization services. Amount not fixed statewide—varies by need, funding, local design[2][5].
- Varies by: priority_tier|region

**How to apply:**
- Phone: Toll-free 1-800-453-5511 (option 2); email: energyassistance@oregon.gov[1][2]
- Contact local Community Action Agency by county (find via 800-453-5511 opt 2 or oregon.gov/ohcs)[1][2][5]
- In-person/phone/mail/home visits (especially for homebound); appointments prioritized for 60+/disabled[2][3][5]

**Timeline:** Not specified; funds limited, apply early[2][5][7]
**Waitlist:** Possible due to limited funds; priority for elderly/disabled may reduce wait[3]

**Watch out for:**
- Priority given to seniors 60+ and disabled—others may face longer waits or limited funds[3]
- Must have documented energy costs; rental/landlord issues can limit benefits[5]
- Income based on recent 30 days—recent income drop may qualify you[7]
- No fixed benefit amount; varies by local agency, funding availability[2][5]
- Homebound can request accommodations, but must contact local agency[2]
- Separate from LIHWA (water assistance); coordinate if eligible[1]

**Data shape:** Income table scales by household size at 60% SMI; priority tiers for elderly/disabled; administered via ~20 county Community Action Agencies with slight policy variations; no statewide fixed grant amount

**Source:** https://www.oregon.gov/ohcs/energy-weatherization/pages/utility-bill-payment-assistance.aspx

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household gross income at or below 200% of the federal poverty level. Income includes all household members before payroll deductions. Specific dollar amounts vary annually and by household size; contact local agency for current table as 2025-26 guidelines not detailed in sources. Priority given to seniors (60+), people with disabilities, households with children under 6, high energy users, and high energy burden households.
- Assets: No asset limits mentioned.
- Renters need landlord approval.
- Homeowners or renters in single-family homes, mobile homes, or multifamily (with approval).
- Must meet LIHEAP eligibility or similar for certification in some cases.

**Benefits:** Free weatherization services including: ceiling/wall/floor insulation, air sealing/infiltration reduction, furnace/heating system repair or replacement, heating duct improvements, energy-related minor home repairs, base-load measures, health/safety repairs, ventilation, LED bulbs, and energy conservation education. Services determined by energy audit for cost-effectiveness.
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency (CAA) or subgrantee by phone or in-person.
- Examples: Clackamas County (phone not specified in results), Marion/Polk (503-361-8740 press 0), Multnomah (503-282-6309), Washington (503-640-3497), Yamhill (503-472-0457). Portland homeowners: Community Energy Project (phone not specified). Lane County: Homes for Good. Mid-Willamette: MWVCAA.
- Mail or in-person: Varies by local agency, e.g., NeighborImpact application packet.
- No statewide online application; agency-specific forms like NeighborImpact Weatherization Application, Supplemental form, Declaration of Household Income.

**Timeline:** Not specified; agency contacts eligible households to schedule energy audit after application.
**Waitlist:** Households may be placed on a waiting service list after contacting local agency.

**Watch out for:**
- Priority populations (elderly 60+, disabled, young children) get preference; non-priority may face longer waits.
- Renters must get landlord permission.
- Services based on energy audit cost-effectiveness, not all measures guaranteed.
- Income at exactly 200% FPL qualifies; gross income before deductions.
- May certify eligibility via LIHEAP or other programs without re-verifying income.
- Waiting lists common due to funding limits.

**Data shape:** Administered by county-specific subgrantees with varying contacts; priority tiers affect service timing; income fixed at 200% FPL with no asset test; services vary by audit results

**Source:** https://www.oregon.gov/ohcs/energy-weatherization/Pages/default.aspx

---

### Senior Health Insurance Benefits Assistance (SHIBA)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Oregon residents with Medicare regardless of income.
- Assets: No asset limits; no asset test applies.
- Must be an Oregon resident with Medicare.
- Includes people age 65+ and individuals ages 18-64 with disabilities who have Medicare.

**Benefits:** Free, objective, unbiased counseling and education on Medicare benefits, options, billing issues, appeals, plan comparisons, rights, and identifying Medicare fraud, error, or abuse. Provided one-on-one by trained volunteer counselors via phone, in-person, online, or public events. No financial aid, healthcare services, or fixed hours/dollar amounts.

**How to apply:**
- Phone: 800-722-4134 (toll-free statewide hotline; enter zip code for local routing)
- Website: https://shiba.oregon.gov/get-help/pages/helpnearyou.aspx (find local counseling sites)
- Email: shiba.oregon@odhs.oregon.gov or online contact form at https://shiba.oregon.gov/get-help/pages/connect-with-us.aspx
- In-person: Local offices and events (search by zip code on site; examples include Clackamas: 503-655-8269, Multnomah: 503-988-3646)
- Public events: Medicare presentations at libraries and offices (check local calendars)

**Timeline:** Immediate counseling available by phone or appointment; no formal application processing.

**Watch out for:**
- Not a benefits-paying program—provides only free counseling, not financial assistance, healthcare, or enrollment on your behalf.
- Requires Medicare enrollment; helps with Medicare questions but does not cover non-Medicare insurance.
- Services rely on volunteer availability; during peak times like Open Enrollment (Oct 15-Dec 7), schedule appointments early.
- People with Medicaid/OHP changes post-COVID emergency may need to transition to Medicare and use SHIBA for guidance.
- Confidential but assessors review resources/needs during sessions.

**Data shape:** no income or asset test; volunteer-based counseling service scaled statewide via local sites with no fixed benefits value

**Source:** https://shiba.oregon.gov

---

### Meals on Wheels (via Area Agencies on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No fixed statewide income limits specified; low-income individuals may receive free or sliding-scale fee meals based on local program guidelines and proof of income. Varies by local Area Agency on Aging (AAA) and whether Medicaid-funded[1][2][3].
- Assets: No asset limits mentioned in sources.
- Homebound (leaving home is a major effort; unassisted outings rare, though medical/religious/essential activities allowed)[1][3]
- Limited ability to shop for or prepare meals safely[1]
- Lack family or other natural supports for meal preparation[1][3]
- For Medicaid HDM: Medicaid eligible, receiving long-term services in home, assessed via CA/PS[3][4]
- Spouse or disabled dependent child may qualify if it benefits the homebound individual[1][2]
- Reside in program delivery zone[2][5]

**Benefits:** Home-delivered nutritious meals (typically hot, sometimes frozen; meet daily nutritional standards approved by dietician; one meal per delivery serving recommended daily allowance). Number/frequency not specified statewide (e.g., authorized monthly quantity for Medicaid). May include fees on sliding scale or free for low-income[1][2][3][4]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) by phone for assessment[1][2]
- Online request form (e.g., Meals on Wheels People for Multnomah/Washington/Clark Counties)[5]
- In-person initial assessment by case manager[1]
- For Medicaid: Referral/authorization form 595 from Medicaid Case Manager to AAA[3]

**Timeline:** Not specified; requires initial in-person assessment, annual reassessment[1]
**Waitlist:** Not mentioned; approval times differ by location[2]

**Watch out for:**
- Must be assessed in-person; not automatic approval[1]
- Homebound definition strict: cannot easily leave home unassisted[1][3]
- Medicaid clients cannot receive under OAA unless cost-of-care[3]
- Fees may apply based on income (sliding scale); car ownership may affect[2]
- Annual reassessment required; may lose eligibility and need alternatives[1]
- Limited to delivery zones; verify local coverage first[2]

**Data shape:** Decentralized via 20+ local Area Agencies on Aging; eligibility/assessments vary by region/provider; no uniform income table or statewide processing times; Medicaid path separate from OAA-funded

**Source:** https://www.oregon.gov/odhs/aging-disability-services/pages/meals-nutrition.aspx

---

### National Family Caregiver Support Program (NFCSP)


**Eligibility:**
- Income: No income limits specified for NFCSP in Oregon; services target unpaid family caregivers without financial eligibility tests mentioned[1][2][3][7][8][9]. Note: Related programs like OPI-M have limits up to 400% FPL but are distinct[5].
- Assets: No asset limits specified for NFCSP; no counts or exemptions detailed[1][2][3][7][8][9].
- Family members, friends, or informal caregivers (18 years or older) providing care to: adults 60+ needing in-home care; individuals of any age with Alzheimer's or related disorders[1][2][3][7][9].
- Grandparents or relatives 55+ caring for children 18 or younger, or adult relatives 18-59 with disabilities who financially depend on an older adult[1][2][3][7].
- Caregivers must be unpaid/informal providers[1][8].

**Benefits:** Information and assistance; individual counseling, support groups, caregiver training; respite care; supplemental services on limited basis. Regional examples: annual respite grants $500-$1,000; case management; caregiver events[1][2][3][7][8]. No fixed hours or statewide dollar caps specified.
- Varies by: region

**How to apply:**
- Contact Aging and Disability Resource Connection (ADRC) Helpline: 1-855-ORE-ADRC (673-2372) or www.ADRCofOregon.org[9].
- Regional: Multnomah County ADRC at 503-988-3646 or adrc@multco.us[2].
- Local providers like Council on Aging for Central Oregon (easy signup, no SSN required for respite grants)[3].
- Options Counselors via ADRC for relief funds[2].

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may vary regionally[2][3].

**Watch out for:**
- No statewide income/asset tests, but confirm with local AAA as some benefits like respite grants may have unspoken priorities[1][3].
- Focuses on unpaid informal caregivers; not for paid professionals[1][8].
- Often confused with Medicaid programs (e.g., OPI-M with income caps) or paid caregiver options[5][6].
- Services funded limitedly under Older Americans Act; availability depends on local funding/waitlists[7][8].
- Regional providers handle delivery; must contact local ADRC/AAA, not centralized[2][3][9].

**Data shape:** Administered statewide but services vary by local AAA/provider; no income/asset tests; respite grants regionally capped (e.g., $500-$1,000); targets specific caregiver-care recipient pairs under OAA[1][2][3][7][8].

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.oregon.gov/odhs/aging-disability-services/pages/caregivers.aspx

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level. As of January 15, 2025, the HHS Poverty Guidelines are in effect, but specific dollar amounts by household size are not provided in available search results. Families should contact their local provider or the Department of Labor for current income thresholds.
- Assets: Not specified in available search results
- Must be unemployed
- Enrollment priority given to: veterans and qualified spouses, individuals over 65, people with disabilities, those with low literacy skills or limited English proficiency, rural residents, homeless or at-risk individuals, those with low employment prospects, and those who have exhausted American Job Center services

**Benefits:** Part-time transitional employment at minimum wage (highest of federal, state, or local minimum wage); participants work an average of 20 hours per week; job training and skill updates through placement at non-profit and public facilities; employment assistance through American Job Centers; income supplementation until permanent employment is secured
- Varies by: fixed

**How to apply:**
- Phone: 1-877-US2-JOBS (1-877-872-5627) — toll-free Department of Labor help line
- Phone: 503-228-5100 — Easter Seals Oregon (statewide coordinator)
- Phone: 541-687-7393 — Easter Seals Oregon Eugene office
- Email: kgerhards@or.easterseals.com — for referrals
- In-person: Easter Seals Oregon Eugene office at 2510 Oakmont Way, Eugene, OR 97401
- Online: CareerOneStop's Older Worker Program Finder (specific URL not provided in search results)

**Timeline:** Not specified in available search results
**Waitlist:** Not specified in available search results

**Watch out for:**
- Income limit is strict: 125% of federal poverty level, which is significantly below median income for most seniors. Families must verify current dollar thresholds with providers.
- This is a transitional program, not permanent support — the goal is to move participants into unsubsidized employment, not provide ongoing assistance.
- Participants must be actively unemployed; those with any current employment may not qualify.
- Priority enrollment favors specific populations (veterans, over 65, disabled, etc.); non-priority applicants may face longer waits or limited availability.
- Program provides part-time work (average 20 hours/week), not full-time employment, during the training phase.
- Specific income dollar amounts, asset limits, processing times, and required documents are not detailed in publicly available Oregon-specific materials; families must contact providers directly for complete information.

**Data shape:** SCSEP is a federally authorized program with state and non-profit administration. Oregon's program is administered by Easter Seals Oregon as the primary grantee. Income eligibility is pegged to federal poverty guidelines (updated annually), creating variable dollar thresholds. The program emphasizes transitional employment with priority enrollment tiers rather than universal access. Critical gaps in publicly available data: specific current income thresholds by household size, asset limits, processing timelines, required documentation, and regional service variations within Oregon.

**Source:** https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/senior-employment.aspx

---

### Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**

**Benefits:** N/A

**How to apply:**
- Phone: 800-522-2602 or 503-378-6533[8]
- Email: ltco.info@rights.oregon.gov[8]
- In-person: 830 D St. NE, Salem OR, 97301[8]
- Website: oltco.org[8]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned

**Watch out for:**
- This program does NOT help families determine if an elderly person qualifies for long-term care placement — it serves people already placed[8]
- This is NOT a financial assistance program — it's advocacy and complaint resolution[8]
- If you're looking for help choosing a facility, ombudsmen provide information and assistance[4], but this is post-placement guidance, not pre-placement eligibility determination
- Volunteers cannot have worked in a long-term care facility within the last two years[1]
- Volunteers cannot have financial interests in long-term care facilities[1]

**Data shape:** This program has two distinct user groups: (1) residents/families/public seeking complaint resolution and advocacy (free service), and (2) community members volunteering as certified ombudsmen (16 hrs/month commitment). The search results contain no income limits, asset limits, or eligibility barriers for accessing services — the program is universally available to anyone with a concern about a long-term care resident. The volunteer role has specific qualifications but is not what families typically seek.

**Source:** oltco.org[8] and Oregon Secretary of State (sos.oregon.gov)[2]

---

### Senior Guardianship Assistance Program (Senior GAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified in available sources; program is fee-for-service with referrals based on vulnerability rather than financial means testing[7][9].
- Assets: No asset limits specified; focuses on incapacity and lack of alternatives, not financial thresholds[1][7].
- Resident of Washington or Multnomah counties (primary service area)[7].
- Age 60+ or vulnerable adult with demonstrated need for protection (some programs extend to adults with disabilities)[7][9].
- Court-appointed guardianship or conservatorship required; staffed by nationally certified guardians[7].
- Referral from social service agency, bank, family, or self-referral for pre-planning roles like Power of Attorney[7].
- Evidence of vulnerability such as safety concerns, financial exploitation, or inability to manage affairs[7].

**Benefits:** Court-appointed guardianship and conservatorship services by nationally certified guardians; also acts as Power of Attorney, Personal Representative of the Estate, Trustee, or Health Care Representative for pre-planning[7].
- Varies by: region

**How to apply:**
- Phone: (503) 294-7445 for confidential intake and referrals (Impact NW Senior GAP)[7].
- Self-referral for pre-planning tools or referral from agency/family/bank[7].
- In-person discussion available after contact[7].

**Timeline:** Not specified in sources.

**Watch out for:**
- Not free: Fee-for-service model, not subsidized like child-focused GAP programs[7].
- Limited to specific counties (e.g., Washington/Multnomah); check local providers[7].
- Requires court appointment and proof no less restrictive alternatives or willing family exist; high need exceeds capacity statewide[1].
- Confused with child welfare Guardianship Assistance Program (GAP), which is for foster youth and ineligible here[2][3][4].
- Pre-planning roles (e.g., POA) allow self-referral, but full guardianship needs referral and court process[7].

**Data shape:** County-restricted private fee-for-service via nonprofits like Impact NW; distinct from state OPG (capacity-limited for incapacitated adults) and child GAP (Title IV-E foster care subsidies); no income/asset tests, vulnerability-driven with court involvement.

**Source:** https://www.oltco.org/programs/opg-about-us.html (Oregon Public Guardian, related state program); program-specific at https://impactnw.org/programs/seniors/guardianship-assistance-2/[1][7]

---

### Oregon Senior Tuition Waiver (OSU/UO Audit Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits or asset limits apply. No variations by household size.
- Assets: No asset limits. No assets counted or exempted as none required.
- Oregon resident
- Must audit classes (no credit or grade earned)
- Instructor permission required
- Space available after paying students register
- Not for limited entry programs (e.g., Nursing, Aquarium Science)
- Maximum 8 credits per term at some colleges

**Benefits:** 100% tuition waiver for audited credit classes. Does not cover student fees, course fees, lab fees, or materials. Up to 8 credits per term possible.

**How to apply:**
- Varies by institution: e.g., at Oregon Coast CC - online application, email instructor (cc Registrar@OregonCoast.edu), submit Senior Waiver form online; at UO - submit Auditor Registration Form and Staff Tuition Benefit form through Registrar's Office (specific URLs/forms per school)
- Contact specific college registrar for details (no central phone listed)

**Timeline:** Registration after first day of class if approved; instructor response time varies
**Waitlist:** No formal waitlist; space-available only after paying students

**Watch out for:**
- No credit earned - purely audit/no grade
- Fees still apply (mandatory, course, lab)
- Instructor must approve; seats only if available post-regular registration
- Cannot displace paying students or enter limited programs
- Some colleges cap at 8 credits/term
- Community colleges may allow 60+ locally, but state law 65+ for uniformity

**Data shape:** Statewide but institution-administered; audit-only (no credit); no financial tests; space/instructor gatekept; age 65+ per statute (some colleges 60+)

**Source:** https://www.oregonlegislature.gov/bills_laws/ors/ors352.html (ORS 352.303 for universities); https://www.oregonlegislature.gov/bills_laws/ors/ors341.html (ORS 341.518 for community colleges)

---

### Health Related Social Needs Benefits (HSRSN)

> **NEW** — not currently in our data

**Eligibility:**
- Income: For housing benefits (rent/utilities, storage, tenancy): Household income 30% or less of the area median income (AMI) where you live, plus lack resources/support to prevent homelessness. Varies by location; no full table provided in sources. Other services (e.g., nutrition) may have food security assessments but no fixed income limits specified.[1][3][4]
- Assets: No asset limits mentioned; focuses on lacking resources/support networks to prevent homelessness for housing services.[3][4]
- Must be enrolled in Oregon Health Plan (OHP)/Medicaid.[1][2][4][5][6]
- In at least one qualifying life transition: release from incarceration past 12 months; discharge from IMD past 12 months; current/past Oregon child welfare involvement; transitioning to dual Medicaid/Medicare (next 3 months or past 9 months); homeless/at risk of homelessness; youth 19-26 with special health care needs (starting 2025).[1][2][3][5][6]
- Plus clinical/health risk factors for specific services: complex physical/behavioral health condition, developmental/intellectual disability, difficulty with self-care/ADLs, abuse/neglect, 65+, under 6, pregnant/postpartum, high crisis service use, etc.[1][2][3][4][5]

**Benefits:** Housing: rent/utilities up to 6 months, storage fees, medically necessary home mods (e.g., ramps, grab bars), pest control/deep cleaning, hotel costs. Nutrition: medically tailored meals for low/very low food security (requires dietitian/PCP assessment). Weather: supports for extreme weather. Must not duplicate other state/local/federal benefits.[3][4][5][6]
- Varies by: service_type|clinical_risk|region

**How to apply:**
- Contact healthcare provider or local OHP community partner.[3]
- CCO-specific: PacificSource request form (via 211info); Health Share, AllCare, etc. via their sites.[4][5][8]
- Unite Us Assistance Request Form (referral).[6]
- OHP Open Card: care coordination.[7]
- Check OHP status: 1-800-273-0557 or local ODHS.[6]
- Apply for OHP if needed: https://www.oregon.gov/oha/HSD/OHP/Pages/apply.aspx[6]

**Timeline:** Varies by service/provider; high volume causes longer times (e.g., PacificSource processing in order received; Lane County pre-1/24/2026 requests ongoing as of early 2026).[4]
**Waitlist:** Not explicitly mentioned; processing delays noted due to volume.[4]

**Watch out for:**
- Not for emergencies (e.g., imminent eviction: contact local Community Action Agency instead).[1]
- Strict federal requirements; not all OHP members qualify—must match exact transition + clinical criteria.[1][2][3]
- Cannot duplicate other benefits; housing requires being currently housed with lease.[4][6]
- Varies significantly by CCO/provider; check your specific CCO.[4][5]
- Takes time to approve; high volume delays.[1][4]

**Data shape:** OHP/Medicaid-exclusive; eligibility ties specific life transitions to clinical risks per service; housing income at 30% local AMI; CCO-administered with regional processing variations; no age minimum but includes elderly (65+) as clinical factor.

**Source:** https://www.oregon.gov/oha/hsd/medicaid-policy/pages/hrsn.aspx[1]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Oregon Health Plan (OHP) | benefit | state | deep |
| APD Medicaid Long Term Services and Supp | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (MSP) via OHP | benefit | federal | deep |
| SNAP Food Benefits | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Senior Health Insurance Benefits Assista | resource | state | simple |
| Meals on Wheels (via Area Agencies on Ag | benefit | federal | medium |
| National Family Caregiver Support Progra | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Senior Guardianship Assistance Program ( | benefit | federal | medium |
| Oregon Senior Tuition Waiver (OSU/UO Aud | benefit | state | deep |
| Health Related Social Needs Benefits (HS | benefit | state | deep |

**Types:** {"benefit":12,"resource":2,"employment":1}
**Scopes:** {"state":6,"local":1,"federal":8}
**Complexity:** {"deep":10,"simple":2,"medium":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/OR/drafts.json`.

- **Oregon Health Plan (OHP)** (benefit) — 5 content sections, 6 FAQs
- **APD Medicaid Long Term Services and Supports** (benefit) — 6 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 4 programs
- **household_size and net_income**: 1 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 3 programs
- **fixed**: 1 programs
- **service_type|clinical_risk|region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Oregon Health Plan (OHP)**: benefits scale by household size and tier (OHP Plus/Bridge/OSIPM); income uses FPL or FBR; long-term care for elderly via OSIPM with asset tests and spend-down; statewide but local ODHS/ADRC handling
- **APD Medicaid Long Term Services and Supports**: Waiver-based with priority tiers (SPL 1-13); waitlisted and area-dependent; NFLOC via CAPS assessment; separate from entitlement ABD Medicaid.
- **Program of All-Inclusive Care for the Elderly (PACE)**: county-restricted to PACE service areas with multiple providers; no financial eligibility test; NFLOC via Oregon SPL 1-13; private pay option
- **Medicare Savings Programs (MSP) via OHP**: MSP is a three-tier program with escalating income thresholds and different benefit levels. The program is statewide but has enrollment caps on the SMF tier. Income limits are tied to federal poverty levels and adjust annually. Unlike some states, Oregon eliminated resource limits for QMB programs. The program requires Medicare Part A enrollment and excludes those eligible for other Medicaid benefits (for SMF tier). Processing timelines and specific regional office locations are not detailed in available sources.
- **SNAP Food Benefits**: Benefits scale by household size and net income. Program has special rules for elderly (60+) and disabled members that provide alternative pathways to qualification and increased benefit amounts. Work requirements for able-bodied adults without dependents create regional variation in eligibility enforcement. Oregon's expanded eligibility goes beyond federal minimums. Medical cost deductions are unique feature for elderly/disabled households. Regional variation exists for benefit delivery method (EBT card vs. check vs. direct deposit) and cash benefit option in specific counties.
- **Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)**: Income table scales by household size at 60% SMI; priority tiers for elderly/disabled; administered via ~20 county Community Action Agencies with slight policy variations; no statewide fixed grant amount
- **Weatherization Assistance Program (WAP)**: Administered by county-specific subgrantees with varying contacts; priority tiers affect service timing; income fixed at 200% FPL with no asset test; services vary by audit results
- **Senior Health Insurance Benefits Assistance (SHIBA)**: no income or asset test; volunteer-based counseling service scaled statewide via local sites with no fixed benefits value
- **Meals on Wheels (via Area Agencies on Aging)**: Decentralized via 20+ local Area Agencies on Aging; eligibility/assessments vary by region/provider; no uniform income table or statewide processing times; Medicaid path separate from OAA-funded
- **National Family Caregiver Support Program (NFCSP)**: Administered statewide but services vary by local AAA/provider; no income/asset tests; respite grants regionally capped (e.g., $500-$1,000); targets specific caregiver-care recipient pairs under OAA[1][2][3][7][8].
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a federally authorized program with state and non-profit administration. Oregon's program is administered by Easter Seals Oregon as the primary grantee. Income eligibility is pegged to federal poverty guidelines (updated annually), creating variable dollar thresholds. The program emphasizes transitional employment with priority enrollment tiers rather than universal access. Critical gaps in publicly available data: specific current income thresholds by household size, asset limits, processing timelines, required documentation, and regional service variations within Oregon.
- **Long-Term Care Ombudsman Program**: This program has two distinct user groups: (1) residents/families/public seeking complaint resolution and advocacy (free service), and (2) community members volunteering as certified ombudsmen (16 hrs/month commitment). The search results contain no income limits, asset limits, or eligibility barriers for accessing services — the program is universally available to anyone with a concern about a long-term care resident. The volunteer role has specific qualifications but is not what families typically seek.
- **Senior Guardianship Assistance Program (Senior GAP)**: County-restricted private fee-for-service via nonprofits like Impact NW; distinct from state OPG (capacity-limited for incapacitated adults) and child GAP (Title IV-E foster care subsidies); no income/asset tests, vulnerability-driven with court involvement.
- **Oregon Senior Tuition Waiver (OSU/UO Audit Program)**: Statewide but institution-administered; audit-only (no credit); no financial tests; space/instructor gatekept; age 65+ per statute (some colleges 60+)
- **Health Related Social Needs Benefits (HSRSN)**: OHP/Medicaid-exclusive; eligibility ties specific life transitions to clinical risks per service; housing income at 30% local AMI; CCO-administered with regional processing variations; no age minimum but includes elderly (65+) as clinical factor.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Oregon?
