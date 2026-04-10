# Oregon Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 4.5m)

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

- **service**: 7 programs
- **financial**: 3 programs
- **in_kind**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Family Caregiver Assistance Program (FCAP) / Family Caregiver Support Program (FCSP)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Services and supports totaling no more than $500 per month, including: in-home support services or personal care services; adult day services (non-residential community-based programs).[1] FCSP offers broader supports like respite, counseling, training (varies by local program).[6][7]` ([source](https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/family-caregiver-program.aspx[6]; https://www.oregon.gov/oha/HPA/HP-MAC/MACmeetings/3.2%20Family%20Caregiver%20Assistance%20Program%20fact%20sheet%20-%202022.pdf[1]))
- **source_url**: Ours says `MISSING` → Source says `https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/family-caregiver-program.aspx[6]; https://www.oregon.gov/oha/HPA/HP-MAC/MACmeetings/3.2%20Family%20Caregiver%20Assistance%20Program%20fact%20sheet%20-%202022.pdf[1]`

## New Programs (Not in Our Data)

- **OPI-M (Medicaid-funded)** — service ([source](https://www.oregon.gov/odhs/providers-partners/seniors-disabilities (primary DHS page; see OPI-M PDFs)))
  - Shape notes: Eligibility via tiered Service Priority Levels 1-18 based on ADL needs; higher income/asset thresholds than other Oregon Medicaid LTC; 24-month continuous eligibility lock-in; disability determination only for under-60; assessment-driven services via local ECM/ADRC.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/pace-fact-sheet.pdf))
  - Shape notes: No income/asset test for enrollment; restricted to few PACE provider service areas in Oregon (e.g., Portland region); NFLOC via SPL 1-13; private pay option; exclusive provider lock-in.
- **Medicare Savings Programs (MSP)** — financial ([source](https://www.oregon.gov/odhs/aging-disability-services/pages/medicare-savings-programs.aspx))
  - Shape notes: Oregon MSP is structured as a four-tier income-based program with no asset limits. The key distinction is that QMB covers comprehensive cost-sharing while SLMB and QI cover only Part B premiums. QMB-DW is a separate track for a specific disabled worker population. The QI/SMF program has enrollment caps that can close mid-year, making it time-sensitive. Income calculations use gross income with specific deductions, meaning stated limits may not be hard cutoffs. All income limits update annually in March.
- **SNAP Food Benefits (Oregon)** — in_kind ([source](https://www.oregon.gov/odhs/food/pages/snap.aspx))
  - Shape notes: Benefits scale by household size and net income using a formula rather than fixed tiers. Special rules for households with elderly (60+) or disabled members create multiple eligibility pathways. Oregon's expanded eligibility means income limits are higher than federal baseline. Regional variation exists only for payment method options (direct deposit/check/EBT vs. cash) and is limited to specific counties. Work requirements recently expanded statewide, affecting able-bodied adults 18-64 without disabilities or dependent children.
- **Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)** — financial ([source](https://www.oregon.gov/ohcs/energy-weatherization/pages/utility-bill-payment-assistance.aspx))
  - Shape notes: Administered via ~20 local Community Action Agencies with minor regional policy variations; income at exactly 60% SMI; benefits capped by type (regular/crisis) and scale by household size/income/fuel; priority tiers for elderly/disabled/crisis
- **Low Income Weatherization Assistance Program (WAP)** — in_kind ([source](Oregon Housing and Community Services (OHCS) - Energy Services Programs. State plan based on 10 CFR Part 440 and 2 CFR Part 200[2]))
  - Shape notes: This program's benefits are not a fixed dollar amount but rather in-kind services determined through an energy audit. The specific services provided vary by household based on cost-effectiveness calculations. Income limits are set annually by USDOE and vary by household size (not provided in search results). The program operates through a network of local administrators rather than a single state office, creating regional variation in application processes and wait times. Priority tiers affect service timeline but not eligibility. No asset limits are specified in available documentation.
- **Senior Health Insurance Benefits Assistance (SHIBA)** — service ([source](https://shiba.oregon.gov))
  - Shape notes: no income or asset test; volunteer-based statewide counseling network with local access points; services are free and open to all Medicare holders in Oregon
- **Meals on Wheels** — service ([source](https://www.oregon.gov/odhs/aging-disability-services/pages/meals-nutrition.aspx[7]; Medicaid standards: https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/medicaid-home-delivered-meals-standards-and-responsibilities.pdf[3]))
  - Shape notes: Decentralized by local AAA/providers and Medicaid pathways; no uniform income table or asset test; eligibility hinges on homebound status and local assessment rather than strict financials; under-60 access via case management only
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/senior-employment.aspx))
  - Shape notes: SCSEP is a transitional employment program with strict income-based eligibility (125% federal poverty level) and priority enrollment tiers. Benefits are fixed (minimum wage, ~20 hours/week) rather than scaled. The program operates statewide in Oregon through Easter Seals as the primary administrator, with multiple host agencies providing actual job placements. Critical data gaps: specific processing times, waitlist status, required documentation, and current dollar amounts for income limits (which depend on federal poverty guidelines updated January 2025). Families must contact local providers for region-specific details.
- **Legal Aid Services of Oregon (LASO)** — service ([source](https://lasoregon.org))
  - Shape notes: Seniors (60+) frequently exempt from standard income limits; regional offices with unique senior projects; no fixed dollar tables or asset tests specified; priority areas under Older Americans Act influence services
- **Long-term Care Ombudsman** — advocacy ([source](https://secure.sos.state.or.us/oard/displayDivisionRules.action?selectedDivision=91))
  - Shape notes: no income or asset test; eligibility tied strictly to residing in licensed long-term care facilities; statewide but delivered via local volunteer designees; advocacy-only with no quantified benefits like dollars or hours
- **Elderly Rental Assistance Program (ERA)** — financial ([source](https://secure.sos.state.or.us/oard/displayDivisionRules.action?selectedDivision=3636 (OAR 813-053); Oregon Housing and Community Services Department (OHCS)))
  - Shape notes: ERA is a decentralized program administered through local homeless prevention agencies rather than a single state office. Benefits and processing vary by local provider. The program has no citizenship or residency requirements, which is unusual among housing assistance programs. Income limits are tied to Area Median Income (AMI), which varies by county, so families must determine their local AMI threshold. The program is specifically designed for prevention of homelessness among elderly households, not general rental assistance.
- **Oregon Senior Free Tuition Audit Program** — in_kind ([source](https://www.oregonlegislature.gov/bills_laws/ors/ors341.html (ORS 341.518 for community colleges); https://www.oregonlegislature.gov/bills_laws/ors/ors352.html (ORS 352.303 for public universities)))
  - Shape notes: Statewide statutory framework (ORS 341.518/352.303), but implemented differently by each college/university with varying age cutoffs (62-65), processes, and minor discounts; no income/asset test; institution-specific exclusions and max credits.
- **Health Related Social Needs Benefits (HSRN)** — service ([source](https://www.oregon.gov/oha/hsd/medicaid-policy/pages/hrsn.aspx))
  - Shape notes: OHP Medicaid-restricted; eligibility ties to life transitions + clinical risks per service; income/AMI only for housing sub-benefits; CCO-administered with regional providers/wait variations; no age cap but specific age risks (65+, <6); scales by service type and local AMI.

## Program Details

### OPI-M (Medicaid-funded)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18 or older (60+ or 18-59 with physical disability meeting Social Security standards)+
- Income: Up to 400% of Federal Poverty Level (FPL), which adjusts annually in January. In 2025: $5,217/month for individual. For couples: $5,637/month (2022 figure; only applicant's income counted, spouse's disregarded). No spousal income allowance.[1][3]
- Assets: Up to equivalent of six months of Medicaid nursing facility costs (exact dollar amount not specified in sources; higher than standard Medicaid long-term care programs). Specific counts/exemptions follow OSIPM non-standard living arrangements rules in OAR chapter 461.[2][1][5]
- Oregon resident.
- Assessed at Service Priority Levels 1-18 (functional impairment in ADLs: transferring, mobility, eating, toileting, bathing, dressing; no Nursing Facility Level of Care required).[1][3][5]
- For ages 18-59: Disability meeting OAR 461-125-0370 (Social Security standards); excludes intellectual/developmental disabilities, or mental/emotional/substance use disorders unless specific criteria met.[5][4]
- Live in own home or with loved one (not assisted living, residential care, or adult foster homes).[6]
- Not receiving other Medicaid LTSS like SPPC, APD Waiver, 1915(i/j/k) state plan services, Healthier Oregon, or duplicative OPI/OAA services.[1][5]
- Continuous 24-month coverage even if income/assets change.[1]

**Benefits:** In-home and community-based long-term services and supports including adult day care, assistive technology, emergency response systems, home modifications, and supports for family caregivers. Specific hours/dollar amounts not detailed; scaled to assessed needs.[2][7][8]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Disability Resource Connection (ADRC) or ECM for assessment (no specific phone/website listed; start via Oregon DHS seniors-disabilities services). Process involves CA/PS assessment, SPL determination, MED disability check if applicable, then OPI-M application sent upon approval.[7]
- No specific online URL, phone, mail, or in-person details in sources; administered by Oregon Department of Human Services (DHS).[4][7]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned (entitlement-like with continuous coverage, but assessment-based).

**Watch out for:**
- Cannot receive simultaneously with other Medicaid LTSS (e.g., SPPC, APD Waiver); must choose OPI-M.[1][5]
- Excludes under-60 with intellectual/developmental disabilities or certain mental health/substance issues unless exceptions met.[5]
- Only own-home settings; no assisted living.[6]
- Income/assets higher than standard Medicaid LTC but still capped; 24-month lock-in helps but verify annually.[1]
- Requires SPL 1-18 assessment first; not automatic.[3][5]
- For couples, only applicant income counts but no spousal allowance.[1]

**Data shape:** Eligibility via tiered Service Priority Levels 1-18 based on ADL needs; higher income/asset thresholds than other Oregon Medicaid LTC; 24-month continuous eligibility lock-in; disability determination only for under-60; assessment-driven services via local ECM/ADRC.

**Source:** https://www.oregon.gov/odhs/providers-partners/seniors-disabilities (primary DHS page; see OPI-M PDFs)

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits or financial requirements for PACE enrollment. Medicaid eligibility covers costs fully; non-Medicaid participants pay private monthly premiums. For context, Oregon long-term care Medicaid (not required for PACE) has income under $2,901/month (300% FBR) and assets $2,000 or less (excluding primary home).[1][4][7]
- Assets: No asset limits for PACE enrollment. Medicaid-related asset rules apply only if seeking Medicaid coverage ($2,000 limit, excluding primary home).[1][4][7]
- Reside in a PACE program's approved service area in Oregon upon enrollment.
- Assessed as needing Nursing Facility Level of Care (NFLOC), equivalent to Oregon Service Priority Level (SPL) 1-13 under OAR chapter 411, division 15.
- Able to live safely in a community setting (home, assisted living, or CBC facility) with PACE services without jeopardizing health/safety of self or others.
- Medicaid eligible or willing to pay private fees.
- Willing to receive all health and long-term care exclusively from PACE providers.
- Not eligible if: active enhanced care or long-term care at Oregon State Hospital; physician-documented Medicare skilled care condition unlikely to discharge to community within 30 days.

**Benefits:** All-inclusive Medicare and Medicaid-covered services plus long-term care: primary medical care, prescriptions, adult day services at health/social centers, in-home services, occupational/physical therapy, social work, dietician support, medical equipment/supplies, CBC facility care, nursing home care (if enrolled), palliative care. No deductibles/co-pays for PACE-provided services. Person-centered plan of care by interdisciplinary team (doctors, nurses, therapists, aides, etc.). Services at PACE centers or home/community.
- Varies by: region

**How to apply:**
- Contact PACE organization intake specialists for screening (e.g., Providence ElderPlace: service areas Multnomah, Clackamas, Washington, Clatsop, Tillamook counties).
- Phone/website via Oregon Department of Human Services (DHS) Aging and Disability Resource Connection (ADRC) at 1-855-673-2372 or local AAA.
- In-person at PACE health/social centers.

**Timeline:** Not specified in sources.
**Waitlist:** Possible; varies by PACE provider and region (no statewide data).

**Watch out for:**
- Must live in specific PACE service area; relocation to area may be required.
- Exclusive care from PACE providers only—no outside services allowed.
- NFLOC assessment (SPL 1-13) required despite community living goal.
- Private pay premiums for non-Medicaid (amounts not specified, vary by provider).
- Enrollment denial only for inability to live safely in community (appealable); other issues like hospital stays may delay.
- Not statewide—check local availability first.

**Data shape:** No income/asset test for enrollment; restricted to few PACE provider service areas in Oregon (e.g., Portland region); NFLOC via SPL 1-13; private pay option; exclusive provider lock-in.

**Source:** https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/pace-fact-sheet.pdf

---

### Medicare Savings Programs (MSP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"description":"Oregon MSP has four tiers with different income limits. Income limits are updated annually in March. All figures below are current as of 2025-2026.","tiers":[{"program":"Qualified Medicare Beneficiary (QMB)","single_monthly":"$1,330","couple_monthly":"$1,804","percentage_fpl":"100% of Federal Poverty Level","note":"Most comprehensive coverage"},{"program":"Specified Low-Income Medicare Beneficiary (SLMB/SMB in Oregon)","single_monthly":"$1,596","couple_monthly":"$2,164","percentage_fpl":"120% of Federal Poverty Level","note":"Part B premiums only"},{"program":"Qualifying Individual (QI/SMF in Oregon)","single_monthly":"$1,796","couple_monthly":"$2,435","percentage_fpl":"120-135% of Federal Poverty Level","note":"Part B premiums only; enrollment capped by federal funding"},{"program":"Qualified Medicare Beneficiary-Disabled Worker (QMB-DW)","single_monthly":"$2,660","couple_monthly":"$3,607","percentage_fpl":"200% of Federal Poverty Level","note":"For disabled workers under 65 who lost Social Security disability benefits due to substantial gainful employment but retain Part A eligibility"}],"important_notes":["Oregon uses gross income as the starting point, then subtracts $20 from income. Additional deductions apply if there is earned income.","Families may still qualify even if income appears to exceed limits due to these deductions.","Income limits increase each year in March."]}
- Assets: {"description":"No asset limits for Medicare Savings Programs in Oregon.","note":"This is a significant advantage compared to some other states and programs."}
- Must be enrolled in or eligible for Medicare Part A (hospital insurance benefits)
- If eligible for any other Medicaid benefit offered by the State of Oregon, you are NOT eligible for the SMF (QI) program
- Must be a resident of Oregon

**Benefits:** Varies by program tier; QMB provides most comprehensive coverage including all premiums and cost-sharing; SLMB and QI cover Part B premiums only
- Varies by: priority_tier

**How to apply:**
- [object Object]
- [object Object]
- [object Object]

**Timeline:** Not specified in available sources
**Waitlist:** [object Object]

**Watch out for:**
- QI/SMF program has annual enrollment caps and may close to new applicants if funding limit is reached — apply early if interested in this tier
- If someone qualifies for ANY other Medicaid benefit in Oregon, they are ineligible for the SMF (QI) program — this is a common disqualifier
- Income limits are updated annually in March; families should reapply or verify eligibility each year
- Oregon's income calculation starts with gross income and subtracts $20, plus additional deductions for earned income — families may qualify even if they think their income is too high
- No asset limits in Oregon means savings and resources don't affect eligibility, unlike some other states
- QMB-DW is specifically for disabled workers under 65 who lost Social Security disability benefits due to work but retained Part A eligibility — this is a narrow but important category
- The program helps with cost-sharing but does NOT cover Medicare Part D (prescription drugs) — separate assistance may be available through other programs
- Processing time is not publicly specified; families should contact their local office for timeline expectations

**Data shape:** Oregon MSP is structured as a four-tier income-based program with no asset limits. The key distinction is that QMB covers comprehensive cost-sharing while SLMB and QI cover only Part B premiums. QMB-DW is a separate track for a specific disabled worker population. The QI/SMF program has enrollment caps that can close mid-year, making it time-sensitive. Income calculations use gross income with specific deductions, meaning stated limits may not be hard cutoffs. All income limits update annually in March.

**Source:** https://www.oregon.gov/odhs/aging-disability-services/pages/medicare-savings-programs.aspx

---

### SNAP Food Benefits (Oregon)

> **NEW** — not currently in our data

**Eligibility:**
- Age: No minimum age requirement for household members, but special rules apply for households with members 60 or older+
- Income: {"description":"Gross income limit is 200% of federal poverty level (Oct. 1, 2025 - Sept. 30, 2026)[1]. Households with members 60+ or with disabilities can qualify under Net Income and Asset tests if they exceed gross income limits[1].","gross_income_limits_by_household_size":{"1_person":"$2,608/month","2_people":"$3,526/month","3_people":"$4,442/month","4_people":"$5,358/month","5_people":"$6,276/month","6_people":"$7,192/month","7_people":"$8,108/month","each_additional_person":"+$916/month"},"note":"Oregon has expanded eligibility beyond standard federal requirements[1]"}
- Assets: {"general_rule":"Your house, car, or money in the bank usually don't count against eligibility[2]","specific_exemptions":"Retirement accounts do not qualify[10]"}
- Must live in Oregon[2]
- Able-bodied adults without children may need to meet work requirements to receive benefits for more than three months (ABAWD status)[2][7][9]
- Work rules apply to adults ages 18-64 without disability or without children under 14[9]
- Household definition: people you live with and buy food with, including spouse and children under 22[1]

**Benefits:** Benefit amounts based on household's net income. General formula: $100 more in net income = $30 less in benefits[1]. Minimum and maximum benefit amounts apply but specific amounts not detailed in search results[1]
- Varies by: household_size and net_income

**How to apply:**
- Online: Through state SNAP agency (specific URL not provided in search results)
- Phone: Contact Oregon Department of Human Services (specific number not provided in search results)
- In-person: Local SNAP office (specific locations not provided in search results)
- Mail: Application can be submitted by mail (specific address not provided in search results)

**Timeline:** If approved for expedited benefits, can receive within 7 days[3]. Standard processing time not specified in search results
**Waitlist:** No waitlist mentioned in search results

**Watch out for:**
- Only about half of eligible seniors participate in SNAP despite qualifying[3] — many don't realize they're eligible
- Households with members 60+ have different eligibility pathways: can fail gross income test but still qualify via Net Income and Asset tests[1]
- Medical cost deductions require proof — families must gather documentation of out-of-pocket medical expenses to maximize benefits for seniors[2][5]
- Work requirements now apply statewide; about 37,000 Oregonians were immediately affected by recent policy change[7]
- Household definition matters: if elderly parent lives with adult child, they may be counted as one household even if they buy food separately[1]
- Alternate payee form allows trusted person to purchase food on behalf of senior, but form must be completed and submitted[2][5]
- Oregon has expanded eligibility beyond federal standards, so eligibility may differ from other states[1]
- Expedited benefits (7-day approval) available but must be specifically requested at application[3]
- SNAP can be used at Meals on Wheels and other community meal sites, not just traditional grocery stores[6]

**Data shape:** Benefits scale by household size and net income using a formula rather than fixed tiers. Special rules for households with elderly (60+) or disabled members create multiple eligibility pathways. Oregon's expanded eligibility means income limits are higher than federal baseline. Regional variation exists only for payment method options (direct deposit/check/EBT vs. cash) and is limited to specific counties. Work requirements recently expanded statewide, affecting able-bodied adults 18-64 without disabilities or dependent children.

**Source:** https://www.oregon.gov/odhs/food/pages/snap.aspx

---

### Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: At or below 60% of Oregon State Median Income (SMI), based on gross household income (before taxes) for all members living at the address, even if not sharing expenses. Valid Oct 1, 2025 - Sept 30, 2026 (most recent available): |Household Size|Annual Gross|Monthly Gross|
|-|-|-|
|1|$38,385|$3,198|
|2|$50,196|$4,183|
|3|$62,006|$5,167|
|4|$73,817|$6,151|
|5|$85,627|$7,135|
|6|$97,438|$8,120|
|7|$99,652|$8,304|
|8|$101,867|$8,489|
|9|$104,081|$8,673|
|10|$106,296|$8,858|
|Each additional|$2,215|$185| For single-person households, the greater of 60% SMI or full-time Portland minimum wage.[1][4][6]
- Assets: No asset limit.[1]
- Oregon resident with documented energy costs (utility bill required; account holder must live in home).
- Household includes all at address covered by same utility bill.
- Homeowners and renters eligible; rental agreements/landlord cooperation may affect benefits.
- Valid SSN verification strongly encouraged/required for some funding.
- Proof of gross income for prior 2 months (or last 30 days in some regions).[3][4][5][7][8]

**Benefits:** One-time grant paid directly to utility provider for heating/cooling bills (Regular LIHEAP: $250-$750 heating, $250-$750 cooling; Crisis LIHEAP: up to $750 for emergencies like shutoffs/broken heaters). May include heating system repair/replacement, energy education, case management, weatherization (separate program for insulation/repairs). Amounts based on income, size, fuel type.[1][3][7]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Contact local Community Action Agency (administers statewide): Toll Free 1-800-453-5511 option 2; email energyassistance@oregon.gov.
- Phone, mail, in-person, or home visits (for homebound).
- Some regions prioritize phone appointments for seniors 60+ or disabled; e.g., Community in Action schedules by phone.[3][5]
- Find local provider/application: oregon.gov/ohcs/energy-weatherization (implied via state sites).[3]

**Timeline:** Incomplete apps pending 15 days before denial; complete apps processed (varies by region/provider).[4]
**Waitlist:** Funds limited; priority to seniors 60+, disabled, crises; others may face wait or denial when funds exhausted.[5]

**Watch out for:**
- Household = all at address on utility bill (even roommates), not just shared expenses.
- Priority for elderly 60+, disabled, crises; general applicants may miss out on limited funds.
- Gross income only (pre-tax/deductions); recent income changes may qualify based on last 30 days.
- Landlord cooperation needed for renters.
- No asset test, but SSN often required for full funding.
- Weatherization separate; apply via same providers.[1][3][5][7]

**Data shape:** Administered via ~20 local Community Action Agencies with minor regional policy variations; income at exactly 60% SMI; benefits capped by type (regular/crisis) and scale by household size/income/fuel; priority tiers for elderly/disabled/crisis

**Source:** https://www.oregon.gov/ohcs/energy-weatherization/pages/utility-bill-payment-assistance.aspx

---

### Low Income Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income must be at or below 200% of federal poverty level[1][4]. Income is calculated as gross household income (all income before payroll deductions) for all household members[1]. Specific dollar amounts vary by household size and are set annually by the U.S. Department of Energy[5]. The search results do not provide the complete 2026 income table, but reference materials indicate these limits are published by USDOE[5].
- Assets: Not specified in available search results
- Applicants can be renters or homeowners[4]
- Can live in mobile homes or site-built homes[4]
- Households receiving Supplemental Security Income (SSI) are also eligible[6]

**Benefits:** Free weatherization and energy conservation services including: ceiling, wall, and floor insulation; energy-related minor home repairs; air infiltration reduction; furnace repair and replacement; heating duct improvements; and energy conservation education[1][5]
- Varies by: priority_tier

**How to apply:**
- Contact your local Community Action Agency (CAA) by phone[5]
- County-specific phone numbers: Clackamas County, Marion/Polk County, Multnomah County, Washington County, Yamhill County[5]
- For Lane County: Contact Homes for Good[7]
- For Mid-Willamette Valley area: Contact Mid-Willamette Valley Community Action[8]
- Portland residents may also contact Community Energy Project for additional no-cost energy efficiency upgrades[5]

**Timeline:** Not specified in search results. Households are placed on a weatherization waiting service list after initial contact[1]
**Waitlist:** Yes, households may be placed on a weatherization waiting service list after making initial contact with their local service agency[1]. Specific wait times not provided in search results

**Watch out for:**
- Income is calculated as GROSS income before any deductions — this is a common misunderstanding[1]
- Renters can apply, but must check with their landlord before weatherization work begins[5]
- If you earn above 200% of poverty level, you may qualify for the separate 'Savings Within Reach' program from Energy Trust of Oregon instead[5]
- The program operates on a waiting list basis — there is no guarantee of immediate service[1]
- An energy audit is required to determine which specific services will be provided; not all services are provided to every household[7]
- For newly legalized aliens, there may be temporary disqualification from receiving weatherization benefits[2]
- Dispute resolution process exists if application is denied — applicants may be entitled to review under Oregon Administrative Rules[3]
- The program prioritizes certain populations (seniors, people with disabilities, families with young children); non-priority households may face longer wait times

**Data shape:** This program's benefits are not a fixed dollar amount but rather in-kind services determined through an energy audit. The specific services provided vary by household based on cost-effectiveness calculations. Income limits are set annually by USDOE and vary by household size (not provided in search results). The program operates through a network of local administrators rather than a single state office, creating regional variation in application processes and wait times. Priority tiers affect service timeline but not eligibility. No asset limits are specified in available documentation.

**Source:** Oregon Housing and Community Services (OHCS) - Energy Services Programs. State plan based on 10 CFR Part 440 and 2 CFR Part 200[2]

---

### Senior Health Insurance Benefits Assistance (SHIBA)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries regardless of income.
- Assets: No asset limits; no asset test applies.
- Must have Medicare
- Oregon residents
- Available to people over 65 and people with disabilities ages 18-64

**Benefits:** Free, objective, unbiased counseling and education on Medicare benefits, options, billing issues, appeals, plan comparisons, rights, and identifying Medicare fraud/error/abuse. Provided by trained volunteer counselors via phone, in-person, online, public events, and one-on-one sessions.

**How to apply:**
- Phone: 800-722-4134 (toll-free statewide hotline; enter zip code for local routing)
- Website: https://shiba.oregon.gov/get-help/pages/helpnearyou.aspx (find local counseling sites)
- Email: shiba.oregon@odhs.oregon.gov or online contact form at https://shiba.oregon.gov/get-help/pages/connect-with-us.aspx
- In-person: Local offices and events (search by zip code on site; examples: Clackamas 503-655-8269, Multnomah 503-988-3646)
- Public events and presentations (check local calendars)

**Timeline:** Immediate counseling available by phone or appointment; no formal processing as it's direct service.

**Watch out for:**
- Not a financial benefits or healthcare provider program—only free counseling/education on Medicare; does not pay bills or provide direct care.
- Relies on volunteers, so availability may depend on local counselors and scheduling, especially during peak times like Open Enrollment (Oct 15-Dec 7).
- People confuse it with paid insurance or direct aid; it's advocacy and information only.
- Must have Medicare to receive services; not for pre-Medicare planning.
- Post-COVID, some losing Medicaid/OHP may need to transition to Medicare—SHIBA helps with this.

**Data shape:** no income or asset test; volunteer-based statewide counseling network with local access points; services are free and open to all Medicare holders in Oregon

**Source:** https://shiba.oregon.gov

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income limits specified; some local programs (e.g., Marion Polk) may consider income based on availability. Medicaid pathways require Oregon Health Plan enrollment without specific dollar thresholds listed[2][3].
- Assets: No asset limits mentioned in sources.
- Homebound (leaving home is a major effort; unassisted outings rare, though medical/religious/essential activities allowed)[1][3]
- Limited ability to shop for or prepare meals safely[1]
- Lack family or other natural supports for meal preparation[1][3]
- For Central Oregon: 60+ or spouse/disabled dependent child if benefiting homebound individual; unable to attend community dining due to health[1]
- Medicaid: Assessed via CA/PS for assistance need; authorized by case manager[2][3]
- May qualify under 60 if authorized by case manager for Medicaid Long-Term Care or State Plan (e.g., Lane County)[6]
- OAA, PACE, or specific conditions like developmental disability, high-risk pregnancy, food insecurity for Medicaid HRSN[2]

**Benefits:** Home-delivered meals (e.g., hot main dish, vegetables, salad, roll, fruit in Marion Polk[5]; meets recommended daily allowance per individual[3]); periodic safety/wellness checks by volunteers; annual reassessment[1]. No specific dollar amounts or fixed hours; typically daily or as authorized (e.g., max monthly quantity via Medicaid referral[3]).
- Varies by: priority_tier|region

**How to apply:**
- Contact local provider (e.g., Central Oregon Council on Aging assessment[1]; Marion Polk: call 503-364-2856[5]; Northwest Senior Services: 1-800-469-8772 or 1-503-304-3400[5])
- Medicaid: Case manager completes referral/authorization form 595 or equivalent to AAA nutrition program[3]; HRSN request form via Oregon Health Authority CCO[2]
- General: Application and needs assessment; possible doctor/social worker referral[4]

**Timeline:** Initial in-person assessment by case manager; reassessment annually[1]. No statewide timeline specified.
**Waitlist:** Not mentioned; availability may depend on local capacity (e.g., income/disability basis in Marion Polk)[5]

**Watch out for:**
- Not a single statewide program; must contact local provider or case manager—eligibility/assessments vary[1][4][5]
- Requires in-person initial assessment and annual reassessment; may lose eligibility if condition improves[1]
- Homebound definition strict (rare unassisted outings)[1][3]
- Medicaid authorization needed for funded meals; private pay or OAA if not qualifying[3]
- Spouse/child eligibility only if benefiting primary homebound individual[1]
- Availability limited to specific cities/counties (e.g., not outside Salem/Keizer without separate contact)[5]

**Data shape:** Decentralized by local AAA/providers and Medicaid pathways; no uniform income table or asset test; eligibility hinges on homebound status and local assessment rather than strict financials; under-60 access via case management only

**Source:** https://www.oregon.gov/odhs/aging-disability-services/pages/meals-nutrition.aspx[7]; Medicaid standards: https://www.oregon.gov/odhs/providers-partners/seniors-disabilities/Documents/medicaid-home-delivered-meals-standards-and-responsibilities.pdf[3]

---

### Family Caregiver Assistance Program (FCAP) / Family Caregiver Support Program (FCSP)


**Eligibility:**
- Age: 18+
- Income: No greater than 400% of the Federal Poverty Level: $4,163 per month for an individual, $5,637 per month for a couple. (Note: Figures from 2022; current FPL may differ. No full household size table provided.)[1]
- Assets: No greater than the average cost of six months in a nursing facility. Specific dollar amount not stated; primary residence and typical exempt assets (e.g., one vehicle) likely apply per Medicaid rules, but details not specified.[1]
- Currently living in their own home (not provider-controlled facility, foster, or care home);[1]
- Meets Oregon’s Service Priority Level 1 through 18;[1]
- Exempt from estate recovery;[1]
- Does not utilize other Medicaid services and supports;[1]
- For FCSP: Caregiver 18+ caring for person 60+ or with Alzheimer’s/dementia (any age); or parent/relative 55+ caring for disabled adult 18+ or child 18- (Multnomah-specific example).[3][7]

**Benefits:** Services and supports totaling no more than $500 per month, including: in-home support services or personal care services; adult day services (non-residential community-based programs).[1] FCSP offers broader supports like respite, counseling, training (varies by local program).[6][7]
- Varies by: priority_tier

**How to apply:**
- Contact Aging and Disability Resource Connection (ADRC): 1-855-ORE-ADRC (673-2372) or www.ADRCofOregon.org for options counseling and eligibility screening;[7]
- Oregon Department of Human Services (DHS) local office (for Medicaid-related);[4]
- Online via Oregon DHS website (for Medicaid eligibility);[4]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; funding-limited under Older Americans Act for FCSP.[6]

**Watch out for:**
- Two distinct programs: FCAP (Medicaid-funded, strict income/asset limits, $500/mo cap) vs. FCSP (OAA-funded, supports for caregivers, less financial testing);[1][6]
- Cannot use other Medicaid services; lives in own home only (no foster/assisted living);[1][2]
- Proposed 1115 waiver status (2022 info) may affect rollout/availability;[1]
- Income/assets based on 2022 FPL; verify current limits;[1]
- Priority levels 1-18 required for FCAP.[1]

**Data shape:** Distinguishes FCAP (Medicaid, financial limits, fixed $500/mo) from FCSP (support services, caregiver-focused, local delivery); income at 400% FPL (high threshold); asset tied to nursing facility cost; priority-tiered access; statewide but locally administered.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/family-caregiver-program.aspx[6]; https://www.oregon.gov/oha/HPA/HP-MAC/MACmeetings/3.2%20Family%20Caregiver%20Assistance%20Program%20fact%20sheet%20-%202022.pdf[1]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level[3][4]. The federal poverty guidelines were updated as of January 15, 2025[4], but specific dollar amounts by household size are not provided in available sources. Families should contact their local provider or use the federal poverty guidelines calculator to determine their exact threshold.
- Assets: Not specified in available sources
- Must be unemployed[3][4]
- Enrollment priority given to: veterans and qualified spouses, individuals over 65, those with disabilities, those with low literacy skills or limited English proficiency, rural residents, homeless or at-risk individuals, those with low employment prospects, and those who have exhausted American Job Center services[4]

**Benefits:** Part-time transitional employment paying the highest of federal, state, or local minimum wage. Participants work an average of 20 hours per week[4]. Program provides job training, skill updates, mentorship, and placement assistance into unsubsidized permanent employment[1][2][3]
- Varies by: fixed

**How to apply:**
- Phone: 503-228-5100 (Oregon Easter Seals)[1]
- Phone: 541-687-7393 (Eugene/Lane County location)[2]
- Phone: 1-877-US2-JOBS (1-877-872-5627) - national toll-free helpline[4]
- Email: kgerhards@or.easterseals.com (referral inquiries)[1]
- In-person: 2510 Oakmont Way, Eugene, OR 97401[2]
- Online: CareerOneStop's Older Worker Program Finder (to locate local programs)[4]
- Referral form available through Oregon Easter Seals[1]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limit is strict: 125% of federal poverty level, which is significantly below median income for most seniors[3][4]. Families must verify current poverty guidelines (updated January 15, 2025) to determine eligibility[4]
- Program is transitional employment, not permanent placement — the goal is to bridge to unsubsidized jobs, not provide ongoing employment[3][4]
- Participants must be actively unemployed; those with any current employment may not qualify[3][4]
- Part-time work (average 20 hours/week) means income is supplemental, not full-time replacement[4]
- Priority enrollment system means low-income seniors without additional risk factors (disability, age 65+, veteran status, etc.) may face longer wait times[4]
- Program is federally funded and authorized by the Older Americans Act, so funding and availability may fluctuate with federal appropriations[3][4]

**Data shape:** SCSEP is a transitional employment program with strict income-based eligibility (125% federal poverty level) and priority enrollment tiers. Benefits are fixed (minimum wage, ~20 hours/week) rather than scaled. The program operates statewide in Oregon through Easter Seals as the primary administrator, with multiple host agencies providing actual job placements. Critical data gaps: specific processing times, waitlist status, required documentation, and current dollar amounts for income limits (which depend on federal poverty guidelines updated January 2025). Families must contact local providers for region-specific details.

**Source:** https://www.oregon.gov/odhs/providers-partners/community-services-supports/pages/senior-employment.aspx

---

### Legal Aid Services of Oregon (LASO)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For general LASO services, income up to 125% of federal poverty guidelines (varies by household size; exact dollar amounts not specified in sources—call for current table). For seniors (60+), services in many regional offices and projects are provided regardless of income or not subject to standard financial criteria.[1][2][3][6][10]
- Assets: No asset limits mentioned for senior services.[1][2]
- Low-income priority for full representation, but seniors often exempt from financial eligibility[1][2][3]
- U.S. citizen or legal resident (Multnomah County exception for domestic violence victims)[6]
- Residency in served county/region for senior projects[1][2][6]

**Benefits:** Free 30-minute consultations with volunteer attorneys on civil issues (wills, powers of attorney, housing, consumer/debt, abuse protection, public benefits, family law, conservatorships/guardianships, nursing homes); brief services, advice, or full representation for low-income seniors in priority areas.[1][2][3][6]
- Varies by: priority_tier|region

**How to apply:**
- Phone (regional examples: Portland senior centers (503) 224-2640 or (503) 244-5204[1]; Albany (541) 926-8678[2]; Central Oregon (541) 385-6944 or 1-800-678-6944[3]; statewide intake varies)
- In-person at senior centers (e.g., Multnomah County locations like Friendly House, Neighborhood House[1]; Central Oregon Regional Office, 42 NW Greeley Ave, Bend[3]; Albany office, 433 Fourth Ave SW, Albany[2])
- No general online application specified; contact regional offices

**Timeline:** Intake hours Monday-Thursday 10am-12pm and 1-4pm; consultations scheduled via phone/in-person[1][3]

**Watch out for:**
- Seniors often get income-blind initial consultations, but full representation prioritizes low-income (≤125% FPL)[1][2][10]
- Services vary significantly by region/office—must contact local office[1][2][3]
- Not criminal law; civil only (housing, benefits, abuse, etc.)[1][2][7]
- Volunteer lawyers may charge for work beyond free consultation if retained[1][3]
- U.S. citizen/legal resident required in some areas[6]

**Data shape:** Seniors (60+) frequently exempt from standard income limits; regional offices with unique senior projects; no fixed dollar tables or asset tests specified; priority areas under Older Americans Act influence services

**Source:** https://lasoregon.org

---

### Long-term Care Ombudsman

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to all residents regardless of financial status.
- Assets: No asset limits or tests; no assets count or are exempt as there is no financial eligibility.
- Must be a resident of a licensed long-term care facility in Oregon (e.g., nursing homes, assisted living facilities, adult foster homes, board and care homes, hospice centers, adult day care).
- Seniors or people with disabilities in such facilities.
- No age minimum for residents; program serves targeted population of seniors and people with disabilities.

**Benefits:** Complaint investigation and resolution; advocacy for residents' rights; information on residents' rights, abuse prevention, care planning, and navigating long-term care; regular facility visits and observation of care conditions; protection of individual rights, promotion of dignity, and improvement of care quality in facilities. No financial aid, hours per week, or dollar amounts provided.

**How to apply:**
- Phone: Contact local ombudsman via statewide program (specific numbers available through Oregon Law Help or local Area Agency on Aging; no central number in results).
- In-person: Visit long-term care facility for on-site ombudsman representatives or local offices.
- Online: Referrals via https://oregonlawhelp.org/referrals/oregon-long-term-care-ombudsman or state resources.
- Family or resident can file complaints directly with ombudsman representatives at facilities or through the program.

**Timeline:** Not specified; complaint investigations handled promptly by ombudsman representatives.

**Watch out for:**
- This is not a direct service or financial aid program for families or individuals outside facilities—it's advocacy only for current long-term care facility residents.
- Requires resident consent for complaint investigations; family complaints need resident direction.
- Not for people at risk of institutionalization but living independently—only facility residents.
- Program relies on volunteers (16 hours/month commitment) and state staff; availability depends on local designee presence.
- People often confuse it with paid care services or Medicaid—it's free advocacy, not healthcare or housing placement.
- Volunteers must be 21+, pass background checks, and complete 48-hour training; not instant access.

**Data shape:** no income or asset test; eligibility tied strictly to residing in licensed long-term care facilities; statewide but delivered via local volunteer designees; advocacy-only with no quantified benefits like dollars or hours

**Source:** https://secure.sos.state.or.us/oard/displayDivisionRules.action?selectedDivision=91

---

### Elderly Rental Assistance Program (ERA)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 58+
- Income: Very low income: 50% of Area Median Income (AMI) or less[4]. Specific dollar amounts vary by household size and county; consult local program administrators for exact thresholds in your area[4]
- Assets: Not specified in available program documentation
- Oregon residency is not required; duration of residency and immigrant status are not considered in eligibility[3][4]
- Citizenship is not required[4]
- Must be assessed to determine eligibility; assessment costs are eligible expenses even if applicant is ultimately deemed ineligible[4]

**Benefits:** Rental housing cost assistance; specific dollar amounts per household not detailed in available sources[3]
- Varies by: household_size

**How to apply:**
- Contact local program administrators through Oregon Housing and Community Services Department (OHCS)
- Phone: Specific ERA program phone number not provided in search results; contact OHCS for referral to local provider
- In-person: Through local homeless prevention programs and Coordinated Entry System (CoC) partners[1]

**Timeline:** Not specified in available documentation
**Waitlist:** Not specified in available documentation

**Watch out for:**
- Age threshold is 58, not 65—many seniors assume 65 is the cutoff[3][4]
- Program specifically targets unstably housed or homeless elderly; stable housing does not qualify[3]
- Income limit is 50% AMI, which is significantly lower than many other assistance programs (e.g., some programs go up to 80% AMI)[4]
- No citizenship or residency duration requirement, but applicants may encounter local agencies with stricter policies—clarify with your local provider[4]
- Assessment is required for all applicants; even if deemed ineligible, the assessment cost is a covered expense[4]
- Specific dollar amounts and benefit caps are not publicly detailed in regulatory documents; families must contact local providers for exact benefit amounts
- Program manual (SHF Manual) contains specific eligibility documentation requirements but is not directly linked in public sources—request from local provider[3]

**Data shape:** ERA is a decentralized program administered through local homeless prevention agencies rather than a single state office. Benefits and processing vary by local provider. The program has no citizenship or residency requirements, which is unusual among housing assistance programs. Income limits are tied to Area Median Income (AMI), which varies by county, so families must determine their local AMI threshold. The program is specifically designed for prevention of homelessness among elderly households, not general rental assistance.

**Source:** https://secure.sos.state.or.us/oard/displayDivisionRules.action?selectedDivision=3636 (OAR 813-053); Oregon Housing and Community Services Department (OHCS)

---

### Oregon Senior Free Tuition Audit Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits apply. This program has no financial eligibility requirements.
- Assets: No asset limits apply. No financial tests are required.
- Must be an Oregon resident.
- Space must be available in the course after tuition-paying students have registered.
- Instructor or department approval required.
- Limited to auditing (no grade or credit earned).
- Maximum of 8 credits per term.
- Lower-division collegiate courses only (varies by institution; excludes limited entry programs like nursing or aquarium science).

**Benefits:** 100% tuition waiver for auditing credit classes (up to 8 credits per term). Other fees (course fees, technology fees, etc.) must be paid. No credit or grade earned.
- Varies by: institution

**How to apply:**
- Varies by college: Contact the specific community college or public university (e.g., Oregon Coast Community College: email instructor and Registrar@OregonCoast.edu; Portland Community College: submit online Senior audit discount request form after admission; Clatsop CC: present proof of age).
- General steps: 1) Apply/admit to the college if new student. 2) Find class in schedule. 3) Get instructor permission. 4) Submit senior waiver/audit request form. 5) Register after first day if space available.

**Timeline:** Varies by institution; registration occurs after first day of class if approved (e.g., first week of term confirmation at OCCC).
**Waitlist:** No formal waitlist; space-available only after paying students register.

**Watch out for:**
- No credit or grade earned—purely audit for personal enrichment.
- Space not guaranteed; only after paying students.
- Fees still apply (not just tuition).
- Instructor approval required; email in advance.
- Excludes limited-entry programs (e.g., nursing, aquarium science).
- Some colleges start benefits at 62 with partial discounts, not full waiver until 65.
- Must register after first day of class per state rules.

**Data shape:** Statewide statutory framework (ORS 341.518/352.303), but implemented differently by each college/university with varying age cutoffs (62-65), processes, and minor discounts; no income/asset test; institution-specific exclusions and max credits.

**Source:** https://www.oregonlegislature.gov/bills_laws/ors/ors341.html (ORS 341.518 for community colleges); https://www.oregonlegislature.gov/bills_laws/ors/ors352.html (ORS 352.303 for public universities)

---

### Health Related Social Needs Benefits (HSRN)

> **NEW** — not currently in our data

**Eligibility:**
- Income: For housing benefits (rent/utilities, storage, tenancy): Household income 30% or less of Area Median Income (AMI) where you live, plus lack resources/support to prevent homelessness. Varies by location (e.g., county-specific AMI tables not detailed in sources; check local Fair Market Rent data). No general income limit stated for all HRSN; OHP Medicaid eligibility applies broadly.[1][3][4]
- Assets: No specific asset limits mentioned; for housing, must 'lack resources or support networks to prevent homelessness'.[1][3][4]
- Must be enrolled in Oregon Health Plan (OHP) Medicaid.[1][2][3][4][5][6]
- In at least one qualifying life transition: release from incarceration past 12 months; discharge from Institution for Mental Disease (IMD) past 12 months; current/past Oregon child welfare involvement; transitioning to dual Medicaid/Medicare eligibility (next 3 months or past 9 months); homeless or at risk of homelessness; youth 19-26 with special health care needs (starting 2025).[1][2][3][5][6]
- Plus clinical risk factors for specific services: complex physical/behavioral health condition, developmental/intellectual disability, difficulty with self-care/ADLs, experiencing abuse/neglect, age 65+, under 6, pregnant/postpartum, high crisis service use, etc.[1][2][3][4][5]
- Cannot receive same/similar benefit from other state/local/federal programs.[6]

**Benefits:** Housing: rent/utilities up to 6 months, storage fees, medically necessary home modifications (e.g., wheelchair ramps, grab bars), remediation (pest control, deep cleaning), hotel costs if needed to stay housed. Nutrition: medically tailored meals for low/very low food security (assessed by dietitian/PCP). Climate: support for extreme weather events. Must improve health condition; specific to social needs like food, housing, climate.[3][4][5][6]
- Varies by: service_type|clinical_risk|region

**How to apply:**
- Contact healthcare provider or local OHP community partner.[3]
- CCO-specific: PacificSource request form (via 211info follow-up); Health Share, AllCare, Advanced Health, IHN-CCO via their sites/providers.[2][4][5][6]
- Unite Us Assistance Request Form (referral).[6]
- OHP Open Card: care coordination.[7]
- Check OHP status: 1-800-273-0557 or local ODHS.[6]
- No central statewide form; varies by CCO/provider.

**Timeline:** Varies by service/provider; high volume causes longer times (e.g., Lane County PacificSource backlog as of Jan 2026); reviewed in order received.[4]
**Waitlist:** Possible due to volume/provider capacity; times vary.[1][4]

**Watch out for:**
- Not for all OHP members—strict federal life transition + clinical risk requirements; not for emergencies (use CAA instead).[1][3]
- Housing requires current housing/lease + ≤30% AMI + lack of resources—not for unhoused without path to housing.[3][4]
- Varies by CCO; don't resubmit across CCOs (e.g., Lane County).[4]
- Must not duplicate other program benefits.[6]
- Processing delays common; work with provider first.[1][3][4]
- OHP enrollment prerequisite—apply separately if needed.[6]

**Data shape:** OHP Medicaid-restricted; eligibility ties to life transitions + clinical risks per service; income/AMI only for housing sub-benefits; CCO-administered with regional providers/wait variations; no age cap but specific age risks (65+, <6); scales by service type and local AMI.

**Source:** https://www.oregon.gov/oha/hsd/medicaid-policy/pages/hrsn.aspx

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| OPI-M (Medicaid-funded) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (MSP) | benefit | federal | deep |
| SNAP Food Benefits (Oregon) | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Low Income Weatherization Assistance Pro | benefit | federal | deep |
| Senior Health Insurance Benefits Assista | resource | state | simple |
| Meals on Wheels | benefit | federal | medium |
| Family Caregiver Assistance Program (FCA | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid Services of Oregon (LASO) | resource | state | simple |
| Long-term Care Ombudsman | resource | federal | simple |
| Elderly Rental Assistance Program (ERA) | benefit | state | deep |
| Oregon Senior Free Tuition Audit Program | benefit | state | medium |
| Health Related Social Needs Benefits (HS | benefit | state | deep |

**Types:** {"benefit":11,"resource":3,"employment":1}
**Scopes:** {"state":7,"local":1,"federal":7}
**Complexity:** {"deep":10,"simple":3,"medium":2}

## Content Drafts

Generated 2 page drafts. Review in admin dashboard or `data/pipeline/OR/drafts.json`.

- **Oregon Senior Free Tuition Audit Program** (benefit) — 3 content sections, 6 FAQs
- **Health Related Social Needs Benefits (HSRN)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 1 programs
- **household_size and net_income**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 2 programs
- **priority_tier|region**: 2 programs
- **fixed**: 1 programs
- **household_size**: 1 programs
- **institution**: 1 programs
- **service_type|clinical_risk|region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **OPI-M (Medicaid-funded)**: Eligibility via tiered Service Priority Levels 1-18 based on ADL needs; higher income/asset thresholds than other Oregon Medicaid LTC; 24-month continuous eligibility lock-in; disability determination only for under-60; assessment-driven services via local ECM/ADRC.
- **Program of All-Inclusive Care for the Elderly (PACE)**: No income/asset test for enrollment; restricted to few PACE provider service areas in Oregon (e.g., Portland region); NFLOC via SPL 1-13; private pay option; exclusive provider lock-in.
- **Medicare Savings Programs (MSP)**: Oregon MSP is structured as a four-tier income-based program with no asset limits. The key distinction is that QMB covers comprehensive cost-sharing while SLMB and QI cover only Part B premiums. QMB-DW is a separate track for a specific disabled worker population. The QI/SMF program has enrollment caps that can close mid-year, making it time-sensitive. Income calculations use gross income with specific deductions, meaning stated limits may not be hard cutoffs. All income limits update annually in March.
- **SNAP Food Benefits (Oregon)**: Benefits scale by household size and net income using a formula rather than fixed tiers. Special rules for households with elderly (60+) or disabled members create multiple eligibility pathways. Oregon's expanded eligibility means income limits are higher than federal baseline. Regional variation exists only for payment method options (direct deposit/check/EBT vs. cash) and is limited to specific counties. Work requirements recently expanded statewide, affecting able-bodied adults 18-64 without disabilities or dependent children.
- **Low Income Home Energy Assistance Program (LIHEAP) / Oregon Energy Assistance Program (OEAP)**: Administered via ~20 local Community Action Agencies with minor regional policy variations; income at exactly 60% SMI; benefits capped by type (regular/crisis) and scale by household size/income/fuel; priority tiers for elderly/disabled/crisis
- **Low Income Weatherization Assistance Program (WAP)**: This program's benefits are not a fixed dollar amount but rather in-kind services determined through an energy audit. The specific services provided vary by household based on cost-effectiveness calculations. Income limits are set annually by USDOE and vary by household size (not provided in search results). The program operates through a network of local administrators rather than a single state office, creating regional variation in application processes and wait times. Priority tiers affect service timeline but not eligibility. No asset limits are specified in available documentation.
- **Senior Health Insurance Benefits Assistance (SHIBA)**: no income or asset test; volunteer-based statewide counseling network with local access points; services are free and open to all Medicare holders in Oregon
- **Meals on Wheels**: Decentralized by local AAA/providers and Medicaid pathways; no uniform income table or asset test; eligibility hinges on homebound status and local assessment rather than strict financials; under-60 access via case management only
- **Family Caregiver Assistance Program (FCAP) / Family Caregiver Support Program (FCSP)**: Distinguishes FCAP (Medicaid, financial limits, fixed $500/mo) from FCSP (support services, caregiver-focused, local delivery); income at 400% FPL (high threshold); asset tied to nursing facility cost; priority-tiered access; statewide but locally administered.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a transitional employment program with strict income-based eligibility (125% federal poverty level) and priority enrollment tiers. Benefits are fixed (minimum wage, ~20 hours/week) rather than scaled. The program operates statewide in Oregon through Easter Seals as the primary administrator, with multiple host agencies providing actual job placements. Critical data gaps: specific processing times, waitlist status, required documentation, and current dollar amounts for income limits (which depend on federal poverty guidelines updated January 2025). Families must contact local providers for region-specific details.
- **Legal Aid Services of Oregon (LASO)**: Seniors (60+) frequently exempt from standard income limits; regional offices with unique senior projects; no fixed dollar tables or asset tests specified; priority areas under Older Americans Act influence services
- **Long-term Care Ombudsman**: no income or asset test; eligibility tied strictly to residing in licensed long-term care facilities; statewide but delivered via local volunteer designees; advocacy-only with no quantified benefits like dollars or hours
- **Elderly Rental Assistance Program (ERA)**: ERA is a decentralized program administered through local homeless prevention agencies rather than a single state office. Benefits and processing vary by local provider. The program has no citizenship or residency requirements, which is unusual among housing assistance programs. Income limits are tied to Area Median Income (AMI), which varies by county, so families must determine their local AMI threshold. The program is specifically designed for prevention of homelessness among elderly households, not general rental assistance.
- **Oregon Senior Free Tuition Audit Program**: Statewide statutory framework (ORS 341.518/352.303), but implemented differently by each college/university with varying age cutoffs (62-65), processes, and minor discounts; no income/asset test; institution-specific exclusions and max credits.
- **Health Related Social Needs Benefits (HSRN)**: OHP Medicaid-restricted; eligibility ties to life transitions + clinical risks per service; income/AMI only for housing sub-benefits; CCO-administered with regional providers/wait variations; no age cap but specific age risks (65+, <6); scales by service type and local AMI.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Oregon?
