# Indiana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 59s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 17 |
| New (not in our data) | 12 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 5 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **unknown**: 1 programs
- **in_kind**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Indiana PathWays for Aging

- **income_limit**: Ours says `$1200` → Source says `$730,000` ([source](https://www.in.gov/pathways/))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Managed long-term services and supports (LTSS) via managed care entities (MCEs: Anthem, Humana, UnitedHealthcare), including home/community-based services (HCBS) to age in place (e.g., transportation to doctor, meal preparation, home health visits, adult day center); nursing facility care; hospice; care coordination. Aims for 75% to receive home-based LTSS. Prior authorizations continue during transition.[5][6][8]` ([source](https://www.in.gov/pathways/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/pathways/`

### SNAP (Supplemental Nutrition Assistance Program)

- **income_limit**: Ours says `$1984` → Source says `$35` ([source](https://www.in.gov/fssa/dfr/snap-food-assistance/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for purchasing nutritious food (amount calculated as max allotment minus 30% of net income; e.g., example 2-person elderly household with $1,200 gross might get $415/month)[2][4][6].` ([source](https://www.in.gov/fssa/dfr/snap-food-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/fssa/dfr/snap-food-assistance/`

### Energy Assistance Program (EAP)

- **income_limit**: Ours says `$3092` → Source says `$8,059` ([source](http://eap.ihcda.in.gov))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time annual payment to help with heating/electric bills (does not cover full annual costs). Exact amounts vary by funding, household factors, fuel type; expected lower in 2025-2026. Crisis aid for disconnections/emergencies.` ([source](http://eap.ihcda.in.gov))
- **source_url**: Ours says `MISSING` → Source says `http://eap.ihcda.in.gov`

### Indiana Legal Services (Pro Bono for Seniors)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal assistance including advice, representation, document preparation; specific to seniors: Senior Law issues (e.g., housing, public benefits, family law, consumer law). No fee for lawyer if eligible; client may pay court filing fees/costs.` ([source](https://www.indianalegalservices.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.indianalegalservices.org`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free, confidential advocacy to resolve complaints including quality of care (e.g., call lights, medications, hygiene), rights violations (e.g., privacy, dignity, verbal abuse), transfers/discharges (e.g., improper discharge, Medicaid discrimination), abuse, restraints. Ombudsmen visit facilities, assist in problem resolution, promote resident rights under federal/state law. Resident-directed; no fixed hours or dollar amounts.[5][6]` ([source](https://www.in.gov/ombudsman/long-term-care-ombudsman/overview/[5]))
- **source_url**: Ours says `MISSING` → Source says `https://www.in.gov/ombudsman/long-term-care-ombudsman/overview/[5]`

## New Programs (Not in Our Data)

- **Hoosier Care Connect** — service ([source](https://www.in.gov/medicaid/members/member-programs/hoosier-care-connect/[5]))
  - Shape notes: Targeted at under-60 blind/disabled non-Medicare; SSI/MEDWorks gateway; individualized care coordination beyond standard Medicaid; MCE choice required; ABD income often individual-based with waivers/institutional exceptions
- **Program for All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.in.gov/fssa/ddars/bba/program-of-all-inclusive-care-for-the-elderly/[7]))
  - Shape notes: County/zip-restricted to limited PACE provider locations (e.g., 5+ providers but not statewide); no income/asset test for core eligibility but ties to Medicaid for free services; nursing home level assessment required; provider-specific enrollment.
- **Healthy Indiana Plan QMB, SLMB, QI** — financial ([source](https://www.in.gov/medicaid/providers/about-ihcp-programs/medicare-savings-programs/))
  - Shape notes: Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); QI waitlist/funding cap; asset-tested unlike some state expansions; auto-Extra Help for QI; elderly/disabled Medicare focus, distinct from HIP.
- **Weatherization Assistance Program** — service ([source](https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/[2]))
  - Shape notes: Decentralized via county LSPs with utility overlays; income at 200% FPL or benefit receipt; waitlisted with vulnerable priority; excludes structural repairs.
- **Meals on Wheels** — service ([source](https://www.in.gov/fssa/ompp/files/Home-Delivered-Meals.pdf))
  - Shape notes: Decentralized local providers with no uniform statewide eligibility/income/assets; zone-restricted; fees with targeted subsidies; physician referral often key
- **Older Americans Act Family Caregiver Support** — service ([source](https://www.in.gov/fssa/ddars/bba/older-americans-act-family-caregiver-support/[2]))
  - Shape notes: Administered via 15 local Area Agencies on Aging with no statewide income/asset tables published; services grant-funded and limited; distinct from Medicaid SFC which offers stipends
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.in.gov/dwd/job-seekers/scsep/[2]))
  - Shape notes: Operated via multiple regional grantees/subgrantees (not centralized); county-specific providers and contacts; priority tiers affect enrollment; income at 125% FPL verified retrospectively.
- **Indiana's Senior Property Tax Credit and Deduction Programs** — unknown ([source](https://www.allencounty.in.gov/262/Senior-Citizen-Property-Tax-Benefits (example county); https://ptaconsumers.aarpfoundation.org/taxpayer-states/indiana/ (AARP Property Tax Aide for Indiana)))
  - Shape notes: This program has undergone significant structural changes as of 2026 under Senate Enrolled Act 1. The Over 65 Deduction (which varied by assessed value) was replaced with a flat $150 Over 65 Credit available to all eligible seniors regardless of property value. Income limits are uniform statewide but adjusted annually by Social Security COLA. The program is administered at the county level through county auditors' offices. Eligibility now focuses on income and age rather than property assessed value. The Circuit Breaker Credit provides an alternative benefit (2% tax increase cap) for those who may benefit more from that structure.
- **Structured Family Caregiving** — financial ([source](https://www.in.gov/fssa/aging (Division of Aging); FAQ: https://www.in.gov/fssa/files/SFC-FAQ-Families-FINAL.pdf[1][7]))
  - Shape notes: Requires enrollment in A&D/TBI Waiver with ADL needs (2-3+); tiered daily payments via needs assessment; provider-administered statewide with local AAAs; caregiver training/background mandatory; cohabitation required
- **Community and Home Options to Institutional Care for the Elderly and Disabled (CHOICE)** — in_kind ([source](https://www.in.gov/fssa/da/ (Indiana Family and Social Services Administration, Division of Aging)))
  - Shape notes: This program has no income or asset limits, making it unique among means-tested programs. Eligibility is primarily functional (based on ADL impairments and risk of losing independence) rather than financial. The program is administered regionally by 92 local Area Agencies on Aging, which may create variation in processing times and service availability. Critically, CHOICE is a funding source for in-home services, not a direct service provider—it works in coordination with other programs and cannot be used if other funding is available. Specific benefit amounts, hours of service, and processing timelines are not publicly detailed in available sources.
- **SILVER Program (Seniors in Indiana Low-income and Vulnerable Energy Resource)** — financial ([source](https://www.nipsco.com/docs/librariesprovider11/bills-and-payments/silver-application.pdf (NIPSCO SILVER application PDF)[3]))
  - Shape notes: Utility-specific program restricted to NIPSCO gas customers; income-eligible without published limits table; seasonal with fund exhaustion risk; not statewide Medicaid or health program
- **Ramp Up Indiana** — in_kind ([source](https://www.in.gov/ihcda/program-partners/ramp-up-indiana))
  - Shape notes: Grants to non-profits/local govs for ramp installs only; income verified per household but program aggregates targeting (50% at ≤50% AMI, all ≤80% AMI); varies by local partner availability, not household size directly.

## Program Details

### Hoosier Care Connect

> **NEW** — not currently in our data

**Eligibility:**
- Age: 59 years and younger[1][2][5]+
- Income: For standard ABD coverage, $994/month for individuals not receiving institutional or waiver services. Higher limits apply for institutionalized or waiver-eligible disabled individuals (up to $2,982/month, individual only, may have patient/waiver liability). Working disabled via MEDWorks have slightly higher income with premiums. Specific household size table not detailed for HCC; ABD often individual-based[4][9]
- Assets: Resources checked if aged, blind, disabled, or Medicare-eligible (e.g., checking/savings accounts), but no specific dollar limits or exemptions detailed in sources for HCC[3]
- Blind or disabled[1][2][5]
- Not eligible for/enrolled in Medicare[1][2][5]
- Living in the community (not institutionalized, except specific cases)[1][5]
- Receiving Supplemental Security Income (SSI)[1][2][5]
- Enrolled through M.E.D. Works[1][2][5]
- Some foster care children, wards of state, adoption assistance, transitioning from foster care[1]
- Indiana resident

**Benefits:** All Indiana Medicaid-covered benefits under Package A (refer to Indiana Medicaid Covered Services page), plus individualized care coordination services based on health needs screening. Dedicated care manager. Services via Primary Medical Provider (PMP) network; must be medically necessary, some require prior approval, doctor's order, or have limits. Managed care entities (MCEs: Anthem, MHS, UnitedHealthcare) may offer enhanced benefits[2][5]
- Varies by: priority_tier

**How to apply:**
- Online: IndianaMedicaid.com or learn if qualify at MHS link[2][3]
- Phone, mail, fax, or in-person at local FSSA Division of Family Resources (DFR) office[2][3]
- Find local DFR office or enrollment centers by county: Find My Local DFR Office website[3]

**Timeline:** Not specified in sources

**Watch out for:**
- Not for those 60+ or on Medicare (focuses on younger blind/disabled)[1][2][5]
- Must select/assigned to MCE (Anthem, MHS, UnitedHealthcare) and stay through calendar year[2][5]
- Services require PMP referral, prior approval, medically necessary; some limits[2]
- Institutionalized/waiver cases have different income rules/liabilities; community-living focus[1][4]
- One source incorrectly states age 65+ (outlier, majority confirm 59 and under)[8]
- Having private insurance may affect eligibility[4]

**Data shape:** Targeted at under-60 blind/disabled non-Medicare; SSI/MEDWorks gateway; individualized care coordination beyond standard Medicaid; MCE choice required; ABD income often individual-based with waivers/institutional exceptions

**Source:** https://www.in.gov/medicaid/members/member-programs/hoosier-care-connect/[5]

---

### Indiana PathWays for Aging


**Eligibility:**
- Age: 60+
- Income: Follows standard Indiana Medicaid income limits for aged, blind, or disabled categories (specific dollar amounts not detailed in sources; same as traditional Medicaid). No unique PathWays-specific income or asset limits listed beyond Medicaid eligibility. For home-based services, home equity interest must not exceed $730,000 unless spouse or dependent child lives in home.[1]
- Assets: Standard Medicaid asset rules apply (not uniquely specified for PathWays). Home equity limit of $730,000 for those living at home or intending to return, unless exceptions apply (spouse or child under 18/disabled child in home).[1]
- Indiana resident
- Eligible for full Medicaid coverage in aged, blind, or disabled category (with or without Medicare)
- May require Nursing Facility Level of Care (NFLOC) for HCBS or nursing home services: help with ≥3 ADLs (bathing, dressing, mobility, eating, toileting) or medically unable to self-care; assessed by Area Agency on Aging (AAA) or from July 2025 by Maximus Health Services.[1]
- Exclusions: Under 60, Healthy Indiana Plan, Hoosier Healthwise, certain DDRS waivers (Family Support, CIH, TBI), Emergency Services Only, Breast/Cervical Cancer Program, intellectual/developmental disability residents in immediate care.[3][4]

**Benefits:** Managed long-term services and supports (LTSS) via managed care entities (MCEs: Anthem, Humana, UnitedHealthcare), including home/community-based services (HCBS) to age in place (e.g., transportation to doctor, meal preparation, home health visits, adult day center); nursing facility care; hospice; care coordination. Aims for 75% to receive home-based LTSS. Prior authorizations continue during transition.[5][6][8]
- Varies by: priority_tier

**How to apply:**
- Automatic enrollment for eligible current Medicaid members (letters sent with MCE selection instructions; e.g., ahead of 60th birthday or post-Medicaid application).[5][7]
- Select MCE (Anthem, Humana, UnitedHealthcare); can change within 90 days of start or by deadlines (e.g., until July 1, 2024 for early transition; open enrollment Oct-Dec 2024).[5][8]
- Official site: https://www.in.gov/pathways/[3][8]

**Timeline:** Automatic for eligible; plan changes effective Jan 2025 for open enrollment.[8]
**Waitlist:** Not mentioned; continuity of care for 90 days post-enrollment.[5]

**Watch out for:**
- Requires underlying Medicaid eligibility (aged/blind/disabled); not for under-60, Hoosier Healthwise, or certain waivers.[3]
- NFLOC needed for HCBS/nursing home (not automatic with dementia diagnosis).[1]
- Automatic enrollment but must select MCE; 90-day change window.[5][7]
- Home equity limit $730,000 for community living.[1]
- Providers must verify eligibility/MCE each service; prior auths carry over 90 days.[5]

**Data shape:** Managed care LTSS program wrapping Medicaid for 60+ ABD; automatic enrollment with MCE choice; NFLOC tier for services; transitioned from Aged/Disabled Waiver/HCC on 7/1/24.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/pathways/

---

### Program for All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits; financial criteria not considered for eligibility. Most participants are dually eligible for Medicare and Medicaid, but not required. For Medicaid eligibility (common for free services), income under 300% of Federal Benefit Rate ($2,901/month in 2025), assets $2,000 or less (excluding primary home), but Medicaid planning can qualify others.[3]
- Assets: No asset limits for PACE eligibility itself. For associated Medicaid, assets $2,000 or less (excluding primary home); Medicaid planning available.[3]
- Live in the service area of an Indiana PACE provider (e.g., Allen County for PACE of Northeast Indiana, specific zip codes for Saint Joseph PACE, Franciscan areas like Dyer, Michigan City, Lafayette, Indianapolis).[1][4][6][7]
- Certified by Indiana as needing nursing home level of care (assessed via Indiana Nursing Home Placement Assessment).[1][2][7]
- Able to live safely in the community with PACE services at time of enrollment.[1][2][7]
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice.[2]

**Benefits:** Comprehensive services including primary care, hospital care, prescription drugs, social services, restorative therapies, personal care, respite care, minor home modifications, adult day health care, transportation, meals (including home-delivered), socialization, medication management, and nursing home care if needed (PACE pays and coordinates). All care coordinated by interdisciplinary team at PACE center; services free for Medicare/Medicaid eligible, flat monthly fee for others.[2][4][7]
- Varies by: region

**How to apply:**
- Phone: Varies by provider, e.g., PACE of Northeast Indiana 260-469-4148, Ascension Living St. Vincent PACE 317-754-4565 or toll-free 833-949-3777, Reid Health PACE (contact via site).[1][7]
- Online eligibility survey (e.g., PACE of Northeast Indiana).[1]
- In-person home visit scheduled after initial contact.[1]
- Contact specific providers for Franciscan Health PACE locations (Dyer, Michigan City, Lafayette, Indianapolis) or Saint Joseph PACE.[4][6]

**Timeline:** Not specified; involves home visit, assessment, then state approval from Indiana Family and Social Services Administration.[1]
**Waitlist:** Not mentioned in sources; may vary by provider.

**Watch out for:**
- Not statewide—must live in specific provider service area (e.g., not all Indiana counties covered).[1][7]
- Requires state certification for nursing home level of care via assessment; not just any elderly person.[1][2]
- Cannot be in Medicare Advantage, hospice, or certain other plans.[2]
- Free only if Medicaid-eligible; private pay flat monthly fee otherwise—check Medicaid planning if needed.[3][4]
- Must be able to live safely in community at enrollment (not currently in nursing home unless PACE coordinates).[2][7]

**Data shape:** County/zip-restricted to limited PACE provider locations (e.g., 5+ providers but not statewide); no income/asset test for core eligibility but ties to Medicaid for free services; nursing home level assessment required; provider-specific enrollment.

**Source:** https://www.in.gov/fssa/ddars/bba/program-of-all-inclusive-care-for-the-elderly/[7]

---

### Healthy Indiana Plan QMB, SLMB, QI

> **NEW** — not currently in our data

**Eligibility:**
- Income: These are federal Medicare Savings Programs (MSPs) administered by Indiana Medicaid, not part of HIP which is for ages 19-64 without Medicare. Eligibility requires Medicare Part A eligibility (or enrollment) and Part B enrollment. All include $20 general income disregard. 2025/2026 limits (monthly, approximate; vary slightly by source/year, based on FPL):
- **QMB**: ≤100% FPL (~$1,325 individual, $1,783 couple)
- **SLMB**: 100-120% FPL (~$1,526 individual, $2,064 couple)
- **QI**: 120-135% FPL (~$1,715-$1,816 individual, $2,320-$2,455 couple)
Limits increase annually in April; Alaska/Hawaii higher. Full household table not specified—primarily individual/couple, scales with FPL for larger households but rare for Medicare elderly.
- Assets: Applies to all (2025/2026): $9,430-$9,660 individual, $14,130-$14,470 couple. Counts: cash, bank accounts, stocks, bonds. Exempt: primary home, one vehicle, burial plots, SNAP benefits, certain life insurance.
- Must be eligible for Medicare Part A (even if not enrolled) and enrolled in Part B.
- Reside in Indiana.
- Not eligible for full Medicaid (but may qualify for other MSPs).
- U.S. citizen or qualified immigrant.

**Benefits:** - **QMB**: Pays Medicare Part A premiums (if applicable), Part B premiums/deductible, coinsurance/copayments for A/B services.
- **SLMB**: Pays Medicare Part B premiums.
- **QI**: Pays Medicare Part B premiums; auto-qualifies for Extra Help (LIS): $0 premiums/deductibles, ≤$12.65 brand/$5.10 generic copays (2026), quarterly enrollment periods, no late penalty.
No dollar cap specified except QI funding limits.
- Varies by: priority_tier

**How to apply:**
- Online: Indiana Medicaid portal (in.gov/medicaid; specific MSP form via local FSSA office).
- Phone: Local Division of Family Resources (DFR) office or Indiana Medicaid at 1-800-403-0864.
- Mail/In-person: Local FSSA/DFR office (find via in.gov/fssa).
- Request application from state Medicaid agency.

**Timeline:** QMB: ≤45 days (effective 1st of next month). SLMB/QI: Up to 45 days, retroactive up to 3 months.
**Waitlist:** QI: Yes—first-come, first-served; limited federal funding, may run out annually; reapply each year.

**Watch out for:**
- Not part of HIP—HIP excludes Medicare-eligible; these are separate MSPs for Medicare beneficiaries.
- QI has limited funding—apply early in calendar year; first-come, first-served.
- Income/assets counted after $20 disregard; states can't be less generous but may add rules (IN follows federal).
- QMB doesn't cover services beyond Medicare coinsurance; providers can't bill QMB enrollees.
- Must reapply annually for QI; retroactivity only for SLMB/QI.
- Income limits update yearly—verify current FPL-based amounts.

**Data shape:** Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); QI waitlist/funding cap; asset-tested unlike some state expansions; auto-Extra Help for QI; elderly/disabled Medicare focus, distinct from HIP.

**Source:** https://www.in.gov/medicaid/providers/about-ihcp-programs/medicare-savings-programs/

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member age 60+ or disabled in Indiana (Oct 1, 2025 - Sept 30, 2026): No gross income limit. Must pass net income test (gross income minus deductions like medical expenses over $35/month for elderly/disabled, shelter costs, utilities). General gross income limits (130% FPL) for reference: 1 person $1,695/month, 2 $2,291, 3 $2,887, 4 $3,482, 5 $4,079, 6 $4,674, 7 $5,270, +$595 each additional. Seniors (60+) only need to meet net income test[1][2][3][6].
- Assets: Most households: $5,000. Households with elderly (60+) or disabled: $4,500. Counts: bank accounts, cash, real estate (non-home), personal property, vehicles. Exempt: primary home and lot, household goods, personal belongings, life insurance, most retirement/pension plans, SSI/TANF resources[1][2][6][7][8].
- Indiana residency
- Citizenship or qualified non-citizen status (e.g., 5+ years US residency, children under 18, disability benefits)
- Household includes those who buy/prepare food together (separate application possible if both 60+ with disability and income <165% poverty)
- Work registration (exempt for 60+)
- Cooperation with IMPACT job training (exempt for elderly)

**Benefits:** Monthly EBT card benefits for purchasing nutritious food (amount calculated as max allotment minus 30% of net income; e.g., example 2-person elderly household with $1,200 gross might get $415/month)[2][4][6].
- Varies by: household_size

**How to apply:**
- Online: https://www.in.gov/fssa/dfr/snap-food-assistance/ (via ACCESS Indiana portal)
- Phone: Local county office or statewide 1-800-403-0864
- Mail: To local Division of Family Resources office
- In-person: Local county FSSA Division of Family Resources office

**Timeline:** Determined upon application; must be processed promptly (federal rule: 30 days max, 7 days if expedited)

**Watch out for:**
- Seniors often miss high medical deductions (> $35/month out-of-pocket for elderly/disabled lowers net income significantly)
- Social Security, pensions, VA benefits count as income[1][2]
- Must include household members who buy/prepare food together unless special elderly/disabled separate application[1]
- Assets include non-primary real estate/vehicles, but home/lot exempt[6]
- No gross income test for elderly/disabled households in Indiana—many sites show standard limits which are stricter[2]
- EBT only for food, not cash/hot meals (some exceptions)

**Data shape:** Expanded eligibility in Indiana: no gross income test for households with elderly (60+) or disabled; net income test only for seniors; asset limit $4,500 for elderly vs $5,000 general; benefits scale by household size and deductions (medical/shelter key for seniors); statewide but county-administered

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/fssa/dfr/snap-food-assistance/

---

### Energy Assistance Program (EAP)


**Eligibility:**
- Income: Gross household income (last 3 months, all persons 18+) at or below 60% of State Median Income (SMI). Example limits from AES Indiana (likely recent): Household size 1: $8,059; 2: $10,539; 3: $13,018; 4: $15,498; 5: $17,978; 6: $20,458; 7: $20,923; 8: $21,388. Limits vary annually; check IHCDA for current table.[1][3][7]
- Assets: No asset limits mentioned in sources.
- Indiana resident
- U.S. citizen, U.S. national, or qualified non-citizen (ineligible members do not disqualify household)
- Income based on most recent 3 months gross (before tax) for all adults 18+

**Benefits:** One-time annual payment to help with heating/electric bills (does not cover full annual costs). Exact amounts vary by funding, household factors, fuel type; expected lower in 2025-2026. Crisis aid for disconnections/emergencies.
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: http://eap.ihcda.in.gov
- Contact local service provider (LSP) for in-person/phone/mail appointments, especially for crisis/disconnection: find via IHCDA site
- County intake sites via http://eap.ihcda.in.gov

**Timeline:** Not specified; LSPs determine eligibility.
**Waitlist:** Funds limited; apply early as applications may close when funds exhausted (e.g., Oct 1, 2025 - Apr 20, 2026 in Marion County).

**Watch out for:**
- Must reapply annually even if previously approved
- One-time benefit only; continue paying bills
- Crisis cases: contact utility/LSP first, not online
- Funds limited - apply early Oct-May
- Income is gross last 3 months for all adults
- No cooling assistance
- Ineligible household members ok if others qualify

**Data shape:** Administered statewide via county-specific LSPs; income over last 3 months at 60% SMI with household size table; annual one-time benefit varies by region/funding/household; no asset test or age requirement

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** http://eap.ihcda.in.gov

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Level (FPL), based on 2025 tax return or current guidelines effective February 23, 2026. Example for AES Indiana service area (likely 2026 figures): 1 person: $30,120; 2: $40,880; 3: $51,640; 4: $62,400; 5: $73,160; 6: $83,920; 7: $94,680; 8: $105,440; add $10,760 per additional member. Exact 200% FPL table varies annually; confirm with local provider. Automatic eligibility if receiving LIHEAP/EAP, TANF, or SSI.[1][2][3][4]
- Assets: No asset limits mentioned in program guidelines.[2]
- Must live in eligible home (single-family, site-built; safe to weatherize; no prior weatherization in past 3 years via some providers like NIPSCO).[1][2][4]
- NIPSCO customers: Active residential service.[1]
- Renters need landlord permission (e.g., Property Owner Authorization Form).[1]
- Home must have electric heat for some upgrades (AES Indiana).[3]

**Benefits:** Free weatherization services including in-home energy assessment (1-2 hours), air sealing, insulation, energy-efficient product installations (e.g., to improve comfort, performance, safety). Excludes roofing, siding, window/door replacement, furnace/AC repairs, hazard remediation (mold, asbestos).[1][2][3][4]
- Varies by: region

**How to apply:**
- Contact Local Service Provider (LSP) by phone, online form, or in-person (find via https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/).[2]
- NIPSCO area: Call TRC at 1-800-721-7385.[1]
- AES Indiana: Through their program (partner CLEAResult).[3]
- Brightpoint (NE Indiana): Call 1-800-589-3506 or (260) 423-3546 option 1; submit EAP application with weatherization referral 'Yes'.[4]
- Complete EAP/LIHEAP application for referral.[4]

**Timeline:** Varies; initial eligibility check, then waitlist.[2][4]
**Waitlist:** Yes, statewide via LSPs; priority for elderly, children, disabled; e.g., Brightpoint serves ~100 households/year.[2][4]

**Watch out for:**
- Funds limited, first-come-first-served; long waitlists with priority for vulnerable (elderly get priority but not exclusive).[1][2][4]
- Home must be safe/eligible (no major repairs like roof/windows); prior weatherization may disqualify (3-year rule for some).[1][2]
- Utility-specific (e.g., NIPSCO/AES customers prioritized; electric heat required for some upgrades).[1][3]
- Renters need landlord approval; not emergency/repair program.[1][2]
- Apply via LSP, not centrally; check county provider.[2]

**Data shape:** Decentralized via county LSPs with utility overlays; income at 200% FPL or benefit receipt; waitlisted with vulnerable priority; excludes structural repairs.

**Source:** https://www.in.gov/ihcda/homeowners-and-renters/weatherizationenergy-conservation/[2]

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Income: No statewide income limits; some local programs offer reduced rates based on assistance programs (e.g., SNAP, SSDI, Medicaid, SSI) or income thresholds like below $1,350/month in Muncie. Varies by provider; no universal table.
- Assets: No asset limits mentioned across sources.
- Physically or mentally unable to prepare meals (homebound or mobility challenges)
- Residency in provider's delivery zone or eligible zip codes
- Dietary prescription from physician often required
- Some programs: 60+ or disabled; others open to all ages including children/teens

**Benefits:** Home-delivered nutritious meals (e.g., medically tailored, diabetic, heart healthy, low-sodium <2,300mg/day, low sugar/saturated fat); minimum 2 weeks service; frequency based on need (daily or fewer days/week); small fee per meal with subsidies available
- Varies by: region

**How to apply:**
- Online form (e.g., mealsonwheelsindy.org/apply/, mealsonwheelshc.org form)
- Phone: Central IN (317) 252-5558, Hamilton County (317) 776-7159
- Mail: e.g., Meals on Wheels of Central Indiana, 708 E. Michigan St., Indianapolis, IN 46202 with check/money order
- Contact local Area Agency on Aging for assessment

**Timeline:** Typically 5-7 business days or less than a week; varies by program
**Waitlist:** Generally no waitlist, but temporary waitlists possible in Marion County/Central IN

**Watch out for:**
- Not a single statewide program—must find local provider and confirm zone eligibility
- Fees required upfront (non-refundable, e.g., 2 weeks minimum + app fee); subsidies not automatic
- Dietary prescription often needed from doctor
- Car ownership or ability to leave home/cook may disqualify
- Services vary widely by region—no uniform rules

**Data shape:** Decentralized local providers with no uniform statewide eligibility/income/assets; zone-restricted; fees with targeted subsidies; physician referral often key

**Source:** https://www.in.gov/fssa/ompp/files/Home-Delivered-Meals.pdf

---

### Older Americans Act Family Caregiver Support

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income or asset limits mentioned; services may be means-tested at local Area Agency on Aging (AAA) level, but exact dollar amounts or tables not detailed in sources[2][7]
- Assets: No asset limits specified; no details on what counts or exemptions[2]
- Caregivers providing care to individuals 60 years of age and older
- Older relatives (not parents) age 55 and older caring for a child under 18
- Older relatives (including parents) age 55 and older caring for an individual with a disability ages 18-59
- Adult family members or informal caregivers age 18 and older providing care to individuals of any age with Alzheimer’s disease and related disorders
- Services provided through local Area Agencies on Aging (AAAs)[2][5][7]

**Benefits:** Individual counseling, training, support groups; respite care; caregiver support services; may include adult day services, attendant care, case management, homemaker, information and assistance (services available on limited basis based on funding)[2][5]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) via INconnect Alliance (800-445-8106)[2][4][7]
- Visit https://www.in.gov/fssa/ddars/bba/older-americans-act-family-caregiver-support/ for AAA locations[2]
- In-person or phone through one of 15 AAAs serving 16 planning and service areas[2]

**Timeline:** Not specified
**Waitlist:** Funding is limited; waitlists possible due to grant-based nature[3][5]

**Watch out for:**
- Not a paid stipend program like Structured Family Caregiving (SFC) or Medicaid waivers; focuses on support services, not direct financial payments to caregivers[1][2][3]
- Often confused with Medicaid programs like SFC, which require living together, ADL needs, and have income limits[1][3][4]
- Funding limited by federal grants; availability depends on local AAA resources and may have waitlists[3][5]
- Must contact specific local AAA; not a centralized state application[2][4]

**Data shape:** Administered via 15 local Area Agencies on Aging with no statewide income/asset tables published; services grant-funded and limited; distinct from Medicaid SFC which offers stipends

**Source:** https://www.in.gov/fssa/ddars/bba/older-americans-act-family-caregiver-support/[2]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income less than 125% of the Federal Poverty Level (FPL) for the past 6-12 months. Exact dollar amounts vary annually by household size and are verified with proof such as Social Security, SSI, SSDI benefit statements. For example, in prior years for a family of 1, this was approximately $14,850[1][2][3][7]. Full table not specified in sources; contact provider for current FPL figures.
- Assets: No asset limits mentioned in sources.
- Unemployed
- Actively seeking employment
- Eligible to work in the US
- Resident of Indiana
- Provide proof of annual household income for last 6-12 months

**Benefits:** Paid part-time community service job training (average 20 hours per week) at the highest of federal, state, or local minimum wage. Includes job skills training, work experience at nonprofits/public agencies (e.g., schools, hospitals, senior centers), free health physical or reimbursement, career coaching, employment assistance via American Job Centers. Goal is transition to unsubsidized employment.
- Varies by: priority_tier

**How to apply:**
- Phone: For counties served by Indiana DWD (shaded yellow on map at in.gov/dwd), call 765-830-WORK (9675) to connect to Vantage Aging[2].
- Regional providers: e.g., Eastern Indiana Works (easternindianaworks.org/scsep)[1]; Catholic Charities Fort Wayne/South Bend (260-422-5625)[9]; Community and Family Services (260-726-9318)[9]; Northern Indiana Workforce Board (574-237-9675)[6][9]; Goodwill Indy (goodwillindy.org/employment-services, but not currently processing)[5].
- In-person: Via local workforce boards, American Job Centers, or listed providers.
- Online: Provider websites for info/eligibility (no central online form specified).

**Timeline:** Not specified in sources.
**Waitlist:** Possible; Goodwill Indy not processing applications currently[5]. Regional variations likely.

**Watch out for:**
- Not statewide uniform; must identify correct regional provider/county coverage first[2][9].
- Priority enrollment for veterans, disabled, rural residents, etc.—may affect access[1][3].
- Temporary training program aimed at unsubsidized job placement, not permanent employment[3][4].
- Some providers (e.g., Goodwill Indy) may pause applications[5].
- Income based on 125% FPL for past 6-12 months with proof required[2].

**Data shape:** Operated via multiple regional grantees/subgrantees (not centralized); county-specific providers and contacts; priority tiers affect enrollment; income at 125% FPL verified retrospectively.

**Source:** https://www.in.gov/dwd/job-seekers/scsep/[2]

---

### Indiana Legal Services (Pro Bono for Seniors)


**Eligibility:**
- Age: 60+
- Income: Generally 125% of Federal Poverty Guidelines (FPG), but senior projects (60+) have less restrictive guidelines dictated by specialized funding; up to 200% FPG possible depending on expenses. Exact dollar amounts vary annually with FPG updates (e.g., 2024 FPG referenced); no specific table provided in sources—check current FPG at indianalegalservices.org/eligibility-guidelines. Varies by household size per standard FPG tables.
- Assets: Countable assets under $10,000 (excludes primary residence, vehicle, and some other items). Less restrictive for senior projects.
- Low-income Hoosier resident facing civil (non-criminal) legal issues
- Unable to afford private attorney
- Not fee-generating cases unless no private attorneys available
- Citizens, legal immigrants, or certain victims of crime/trafficking

**Benefits:** Free civil legal assistance including advice, representation, document preparation; specific to seniors: Senior Law issues (e.g., housing, public benefits, family law, consumer law). No fee for lawyer if eligible; client may pay court filing fees/costs.
- Varies by: priority_tier

**How to apply:**
- Online: indianalegalservices.org/applyonline
- Phone: (844) 243-8570 (M-F, 10am-2pm); regional e.g., Columbus (812) 372-6918 or (866) 644-6407
- In-person: Regional offices e.g., Columbus: 1531 13th Street, Suite G, Columbus, IN 47201-1302

**Timeline:** Not specified

**Watch out for:**
- Senior projects (60+) have different/less restrictive eligibility than general ILS—must specify senior needs
- No criminal or divorce cases; may refer out
- Client pays court fees/costs even if lawyer free
- 200% FPG only if high expenses; assets exclude home/car but cap at $10k countable
- Recent immigration/funding changes may affect eligibility
- Some areas require referral from local aid org (e.g., Heartland Pro Bono)

**Data shape:** Senior projects less restrictive than general 125% FPG/$10k assets; county-specific for some 60+ services via regional offices/partners; eligibility varies by funding source/project

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.indianalegalservices.org

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; open to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Resident must be in a nursing facility or licensed assisted living facility in Indiana. Services also extend to in-home services per state statute, though funding limits implementation to facilities primarily.[4] Anyone can contact on behalf of a resident: residents, relatives, friends, facility staff, or community members.[5][6]

**Benefits:** Free, confidential advocacy to resolve complaints including quality of care (e.g., call lights, medications, hygiene), rights violations (e.g., privacy, dignity, verbal abuse), transfers/discharges (e.g., improper discharge, Medicaid discrimination), abuse, restraints. Ombudsmen visit facilities, assist in problem resolution, promote resident rights under federal/state law. Resident-directed; no fixed hours or dollar amounts.[5][6]

**How to apply:**
- Phone: 1-800-622-4484 (toll-free information/complaint line) or 317-232-7134 (State Ombudsman).[6]
- Email: Available via state office (specific address not listed; use phone for guidance).[6]
- Mail: Office of the Long Term Care Ombudsman, 402 West Washington Street, Room W451, Post Office Box 7083, MS 27, Indianapolis, Indiana 46207-7083.[6]
- In-person: Local ombudsman offices across the state (contact state line for nearest).[5]
- No formal application form for recipients; contact to file complaint or request assistance directly.[1][5]

**Timeline:** Not specified for complaint resolution; volunteer certification applications take 4-6 weeks (not applicable to recipients).[1]

**Watch out for:**
- Not a direct service provider (e.g., no healthcare, housing, financial aid); purely advocacy/complaint resolution.[5]
- Free and confidential, but resident-directed—ombudsman prioritizes resident's wishes.[5]
- Not for qualifying for facility admission or payment; for rights protection once in facility.[5][6]
- In-home services statutorily mandated but underfunded, so focus on facilities.[4]
- Anyone can contact, but access to records needs resident/legal consent.[2]
- Volunteer program often confused with recipient services—volunteers aid residents.[1]

**Data shape:** no income test; advocacy-only, not financial/service benefits; statewide via local offices; open to public contacts for facility residents; volunteer-focused requirements in sources often misapplied to recipients

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.in.gov/ombudsman/long-term-care-ombudsman/overview/[5]

---

### Indiana's Senior Property Tax Credit and Deduction Programs

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"over_65_credit":{"tax_year_2026":{"single":"$60,000 AGI","married_filing_jointly":"$70,000 AGI","shared_ownership":"$70,000 AGI"},"tax_year_2027":{"single":"$60,000 AGI","married_filing_jointly":"$70,000 AGI"},"note":"Income limits adjusted annually by Social Security COLA percentage increase[1]"},"circuit_breaker_credit":{"tax_year_2026":{"single":"$60,000 AGI","married_filing_jointly":"$70,000 AGI"},"tax_year_2027":{"single":"$61,860 AGI","married_filing_jointly":"$71,960 AGI"},"note":"Income limits adjusted annually[1]"}}
- Assets: No assessed value limitation for either credit as of 2026[1][6]
- Must own or be buying the home for at least one year before claiming the credit[6]
- If buying under contract, the contract must state you are responsible for property taxes and must be officially recorded with the county[6]
- Must have received the homestead deduction on the property in the prior year, or late spouse must have received it if married at time of spouse's death[6]
- Must qualify for the homestead deduction on the same property in the current year[6]
- Must reside in the home[1]
- Surviving spouse must be at least 60 years old and unmarried; deceased spouse must have been at least 65[1][5]

**Benefits:** N/A
- Varies by: Program type; all eligible seniors receive same benefit amount within each program

**How to apply:**
- Mail: Submit to county auditor's office[7]
- In-person: Visit county auditor's office[7]
- Phone: Contact county auditor's office to request application[7]
- Online: Download application form from county website or state website[7]

**Timeline:** Not specified in available sources

**Watch out for:**
- Program changed significantly in 2026: The Over 65 Deduction was replaced with a new Over 65 Credit of $150[6]. Seniors who were receiving the deduction may have been automatically switched to the credit, but some still needed to file an application by January 15, 2026[6]
- Income limits are based on AGI from two years prior to the tax year, not the current year[4]
- Must have received homestead deduction in prior year to qualify for Over 65 Credit; this is a new requirement as of 2026[6]
- Assessed value no longer matters for eligibility as of 2026, but you must still qualify for the homestead deduction on the property[6]
- Surviving spouses must be unmarried and at least 60 years old; remarriage disqualifies them[1][5]
- The $150 Over 65 Credit is fixed regardless of property value or tax bill size, meaning it provides the same benefit to all eligible seniors[6]
- If applying within 2 weeks of the January 15 deadline, all documentation must be submitted by January 15[1]
- Homestead deduction eligibility is a prerequisite; seniors must qualify for both programs to receive the Over 65 Credit[6]

**Data shape:** This program has undergone significant structural changes as of 2026 under Senate Enrolled Act 1. The Over 65 Deduction (which varied by assessed value) was replaced with a flat $150 Over 65 Credit available to all eligible seniors regardless of property value. Income limits are uniform statewide but adjusted annually by Social Security COLA. The program is administered at the county level through county auditors' offices. Eligibility now focuses on income and age rather than property assessed value. The Circuit Breaker Credit provides an alternative benefit (2% tax increase cap) for those who may benefit more from that structure.

**Source:** https://www.allencounty.in.gov/262/Senior-Citizen-Property-Tax-Benefits (example county); https://ptaconsumers.aarpfoundation.org/taxpayer-states/indiana/ (AARP Property Tax Aide for Indiana)

---

### Structured Family Caregiving

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Care recipient must qualify for Indiana Medicaid A&D (Aged & Disabled) Waiver or TBI Waiver, which includes limited income (generally $2,982/month in 2026 for applicant; non-applicant spouse income not counted, may receive spousal allowance). Exact limits vary by Medicaid rules and household; no specific SFC table provided[1][2][5].
- Assets: Care recipient must meet Medicaid A&D or TBI Waiver asset limits (generally $2,000 for applicant; married couples combine assets with Community Spouse Resource Allowance for non-applicant spouse). No unique SFC asset rules; standard Medicaid exemptions apply (e.g., home, car often exempt)[2][5].
- Care recipient: Indiana resident, eligible for A&D or TBI Medicaid Waiver, needs assistance with at least 2-3 ADLs (e.g., bathing, dressing, eating, toileting, transferring), requires daily support/supervision, prefers home-based care over institution[1][3][4][5].
- Caregiver: 18+ years old, live in same household as recipient, pass criminal background check (no abuse/neglect history), complete assessment/training, willing/able to provide daily care. Can be family (not always spouse), friend, or neighbor; not required to be RN. Some sources note caregiver must be related (not spouse)[1][2][3][4][5][6].

**Benefits:** Daily rate/per diem payment to caregiver based on needs assessment level (Level 1: 1-20 hours/week; Level 2: 21-40 hours/week; Level 3: 41+ hours/week until July 1, 2024; post-2024 needs-based). Up to ~$2,000/month possible via providers; includes ongoing training/support from case manager/RN. Can combine with State Plan Home Health if primary caregiver unavailable[1][7][8].
- Varies by: priority_tier

**How to apply:**
- Contact Indiana FSSA Division of Aging at 1-800-457-8283 or visit in.gov/fssa/aging[1].
- Contact local Area Agency on Aging (AAA)[4].
- Work with approved providers like FreedomCare, ResCare, Careforth, Paid.care (e.g., structuredfamilycaregivingindiana.com, join.careforth.com/in)[1][4][5][8].
- Care manager submits application after assessment (no direct public form; provider/case manager handles)[1].

**Timeline:** Not specified; provider-led enrollment moves quickly post-approval[1][8].
**Waitlist:** Not mentioned; depends on waiver availability[1].

**Watch out for:**
- Tied to A&D or TBI Medicaid Waiver eligibility (not standard Medicaid); must prefer home over nursing facility[1].
- Caregiver must live in same household; spouse may be excluded by some providers[2][4].
- Levels determined by care manager assessment; temporary rules until July 2024 for under-18[7].
- Cannot manipulate primary caregiver availability for additional Home Health pay[7].
- Provider must have 3+ years experience or accreditation[9].

**Data shape:** Requires enrollment in A&D/TBI Waiver with ADL needs (2-3+); tiered daily payments via needs assessment; provider-administered statewide with local AAAs; caregiver training/background mandatory; cohabitation required

**Source:** https://www.in.gov/fssa/aging (Division of Aging); FAQ: https://www.in.gov/fssa/files/SFC-FAQ-Families-FINAL.pdf[1][7]

---

### Community and Home Options to Institutional Care for the Elderly and Disabled (CHOICE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older, OR any age with a disability+
- Income: No income limits. The CHOICE program does not exclude recipients based on income.[7]
- Assets: Not specified in available sources. Certain medical expenses may not be counted in income or asset calculations.[7]
- Must have legal settlement in Indiana[6]
- Must be at risk of losing independence, as measured by impairments affecting Activities of Daily Living (ADLs)[7]
- For individuals with disabilities: must have a disability that creates long-term or lifelong limitations[6]
- ADL limitations include: dependence on others to bathe, dress, eat, or use the bathroom; limitations in expressing personal needs or understanding communication; limitations in learning and maintaining self-care, communication, social, or domestic skills; limitations in moving between environments; limitations in decision-making and judgment[6]

**Benefits:** In-home support services. Specific dollar amounts and hours per week are not detailed in available sources. Services support Activities of Daily Living (ADLs) such as bathing, eating, dressing, using the toilet, taking medication, and mobility/ambulation.[6][7]

**How to apply:**
- Phone: Contact your local Area Agency on Aging (AAA). Statewide number: 1-800-713-9023[7]
- In-person: Visit your local Area Agency on Aging office
- Mail: Request application by contacting local AAA

**Timeline:** Not specified in available sources
**Waitlist:** Waiting lists exist but specific timelines are not provided in available sources.[7]

**Watch out for:**
- CHOICE does not provide comprehensive healthcare coverage. It is not automatic enrollment in Medicaid or other health programs.[7]
- CHOICE funds cannot be used if other funding (Medicare, Medicaid, Medicaid Waivers, Hoosier Healthwise, Children's Special Health Care Services) is available to meet the individual's needs. Families should explore other programs first.[7]
- Eligibility is based on risk of losing independence due to ADL impairments—not simply having a disability or being elderly. The program requires functional assessment, not just a diagnosis.[6][7]
- The program has been funded statewide since July 1, 1992, but waiting lists exist in some regions. Availability may be limited by county capacity.[7]
- For divorced or separated parents: eligibility of children is determined by the parent with legal custody (this appears to be a note in the source but may not apply to elderly/disabled adults).[3]

**Data shape:** This program has no income or asset limits, making it unique among means-tested programs. Eligibility is primarily functional (based on ADL impairments and risk of losing independence) rather than financial. The program is administered regionally by 92 local Area Agencies on Aging, which may create variation in processing times and service availability. Critically, CHOICE is a funding source for in-home services, not a direct service provider—it works in coordination with other programs and cannot be used if other funding is available. Specific benefit amounts, hours of service, and processing timelines are not publicly detailed in available sources.

**Source:** https://www.in.gov/fssa/da/ (Indiana Family and Social Services Administration, Division of Aging)

---

### SILVER Program (Seniors in Indiana Low-income and Vulnerable Energy Resource)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income-eligible based on household income (total household income per year required on application); specific dollar amounts not detailed in sources but tied to low-income status for NIPSCO gas customers. Must report number of people in household[3][6].
- Assets: No asset limits specified[3][6].
- Indiana senior citizen 60 years of age or older
- Primary account holder on active residential gas account with NIPSCO
- Past due balance on NIPSCO gas residential utility account
- Low-income and vulnerable energy needs

**Benefits:** One-time benefit credited directly to NIPSCO gas residential utility account[3][6].

**How to apply:**
- Mail: Complete SILVER application form and return to mailing address indicated on form (NIPSCO-specific)[3]
- Online: Submit online SILVER application (via NIPSCO or partners like U Matter 2)[6]

**Timeline:** Benefit credited within 30 days of receipt of completed form; eligibility status notified by phone within 30 business days[3][6].
**Waitlist:** Funds available until May 31 annually or exhausted; no traditional waitlist mentioned[3].

**Watch out for:**
- Only for NIPSCO gas customers with past due balances; not general energy assistance
- Program ends annually on May 31 or when funds exhausted—apply early in season (starts October 1)[3][6]
- Must be primary account holder and complete form in entirety[3]
- One-time benefit only, not ongoing assistance
- Not related to Medicaid, Pathways for Aging, or health insurance Silver plans

**Data shape:** Utility-specific program restricted to NIPSCO gas customers; income-eligible without published limits table; seasonal with fund exhaustion risk; not statewide Medicaid or health program

**Source:** https://www.nipsco.com/docs/librariesprovider11/bills-and-payments/silver-application.pdf (NIPSCO SILVER application PDF)[3]

---

### Ramp Up Indiana

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households must have gross income at or below 80% of Area Median Income (AMI). At least 50% of households assisted per grant must be at or below 50% AMI. Limits vary by location and household size per IHCDA's Federal Program Income Limits. Categorical eligibility applies if receiving SSI, SSDI, TANF, SNAP, or certain other benefits, verified by third-party documentation. Otherwise, use Part 5 Income Verification Process.[1][3][4]
- Assets: No asset limits specified.[1][3]
- Must be a homeowner (fee simple title, 99-year leasehold, condo, co-op membership under state law, or life estate right to live rent-free). Excludes land contracts, lease-purchase, or rent-to-own.
- Home must be primary residence.
- Need for accessibility ramp (e.g., mobility impairment allowing aging in place).
- Assistance provided through approved non-profits or local governments, not directly to individuals.[1][3][4]

**Benefits:** Installation of one exterior accessibility ramp (front door, garage, or back door) to improve home access, increase safety, reduce fall risk, and support aging in place. No dollar amount or hours specified per home; small investments per unit with no liens or affordability periods required.[4]

**How to apply:**
- Families contact local non-profit partners (e.g., Habitat for Humanity, Area Agencies on Aging, MontCares, Thrive West Central) or local government for ramp installation grants. Program closed for new grantee applications as of 2023 flyer, but uses rolling prior funds.[4][5][7]
- IHCDA info: www.in.gov/ihcda/program-partners/ramp-up-indiana
- Phone: 317.232.7777[1][4]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; depends on available grantee funds and regional partners.

**Watch out for:**
- Not a direct-to-individual program; families must find/connect with approved non-profit grantees (one active grant per org).
- Program targets organizations, not households directly; may be closed for new grantee apps.
- Only one ramp per home; excludes interior mods or multiple ramps.
- Income targeting: 50% of grantee's households must be ≤50% AMI.
- Homeownership strictly defined; no rent-to-own qualifies.
- No liens, but small funding per home limits scope.[1][3][4]

**Data shape:** Grants to non-profits/local govs for ramp installs only; income verified per household but program aggregates targeting (50% at ≤50% AMI, all ≤80% AMI); varies by local partner availability, not household size directly.

**Source:** https://www.in.gov/ihcda/program-partners/ramp-up-indiana

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Hoosier Care Connect | benefit | state | deep |
| Indiana PathWays for Aging | benefit | state | deep |
| Program for All-Inclusive Care for the E | benefit | local | deep |
| Healthy Indiana Plan QMB, SLMB, QI | benefit | state | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Energy Assistance Program (EAP) | benefit | state | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Meals on Wheels | benefit | federal | medium |
| Older Americans Act Family Caregiver Sup | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Indiana Legal Services (Pro Bono for Sen | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Indiana's Senior Property Tax Credit and | benefit | state | deep |
| Structured Family Caregiving | benefit | state | deep |
| Community and Home Options to Institutio | benefit | state | medium |
| SILVER Program (Seniors in Indiana Low-i | benefit | local | deep |
| Ramp Up Indiana | benefit | state | deep |

**Types:** {"benefit":14,"employment":1,"resource":2}
**Scopes:** {"state":10,"local":2,"federal":5}
**Complexity:** {"deep":13,"medium":2,"simple":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/IN/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **region**: 3 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 4 programs
- **Program type; all eligible seniors receive same benefit amount within each program**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Hoosier Care Connect**: Targeted at under-60 blind/disabled non-Medicare; SSI/MEDWorks gateway; individualized care coordination beyond standard Medicaid; MCE choice required; ABD income often individual-based with waivers/institutional exceptions
- **Indiana PathWays for Aging**: Managed care LTSS program wrapping Medicaid for 60+ ABD; automatic enrollment with MCE choice; NFLOC tier for services; transitioned from Aged/Disabled Waiver/HCC on 7/1/24.
- **Program for All-Inclusive Care for the Elderly (PACE)**: County/zip-restricted to limited PACE provider locations (e.g., 5+ providers but not statewide); no income/asset test for core eligibility but ties to Medicaid for free services; nursing home level assessment required; provider-specific enrollment.
- **Healthy Indiana Plan QMB, SLMB, QI**: Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); QI waitlist/funding cap; asset-tested unlike some state expansions; auto-Extra Help for QI; elderly/disabled Medicare focus, distinct from HIP.
- **SNAP (Supplemental Nutrition Assistance Program)**: Expanded eligibility in Indiana: no gross income test for households with elderly (60+) or disabled; net income test only for seniors; asset limit $4,500 for elderly vs $5,000 general; benefits scale by household size and deductions (medical/shelter key for seniors); statewide but county-administered
- **Energy Assistance Program (EAP)**: Administered statewide via county-specific LSPs; income over last 3 months at 60% SMI with household size table; annual one-time benefit varies by region/funding/household; no asset test or age requirement
- **Weatherization Assistance Program**: Decentralized via county LSPs with utility overlays; income at 200% FPL or benefit receipt; waitlisted with vulnerable priority; excludes structural repairs.
- **Meals on Wheels**: Decentralized local providers with no uniform statewide eligibility/income/assets; zone-restricted; fees with targeted subsidies; physician referral often key
- **Older Americans Act Family Caregiver Support**: Administered via 15 local Area Agencies on Aging with no statewide income/asset tables published; services grant-funded and limited; distinct from Medicaid SFC which offers stipends
- **Senior Community Service Employment Program (SCSEP)**: Operated via multiple regional grantees/subgrantees (not centralized); county-specific providers and contacts; priority tiers affect enrollment; income at 125% FPL verified retrospectively.
- **Indiana Legal Services (Pro Bono for Seniors)**: Senior projects less restrictive than general 125% FPG/$10k assets; county-specific for some 60+ services via regional offices/partners; eligibility varies by funding source/project
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only, not financial/service benefits; statewide via local offices; open to public contacts for facility residents; volunteer-focused requirements in sources often misapplied to recipients
- **Indiana's Senior Property Tax Credit and Deduction Programs**: This program has undergone significant structural changes as of 2026 under Senate Enrolled Act 1. The Over 65 Deduction (which varied by assessed value) was replaced with a flat $150 Over 65 Credit available to all eligible seniors regardless of property value. Income limits are uniform statewide but adjusted annually by Social Security COLA. The program is administered at the county level through county auditors' offices. Eligibility now focuses on income and age rather than property assessed value. The Circuit Breaker Credit provides an alternative benefit (2% tax increase cap) for those who may benefit more from that structure.
- **Structured Family Caregiving**: Requires enrollment in A&D/TBI Waiver with ADL needs (2-3+); tiered daily payments via needs assessment; provider-administered statewide with local AAAs; caregiver training/background mandatory; cohabitation required
- **Community and Home Options to Institutional Care for the Elderly and Disabled (CHOICE)**: This program has no income or asset limits, making it unique among means-tested programs. Eligibility is primarily functional (based on ADL impairments and risk of losing independence) rather than financial. The program is administered regionally by 92 local Area Agencies on Aging, which may create variation in processing times and service availability. Critically, CHOICE is a funding source for in-home services, not a direct service provider—it works in coordination with other programs and cannot be used if other funding is available. Specific benefit amounts, hours of service, and processing timelines are not publicly detailed in available sources.
- **SILVER Program (Seniors in Indiana Low-income and Vulnerable Energy Resource)**: Utility-specific program restricted to NIPSCO gas customers; income-eligible without published limits table; seasonal with fund exhaustion risk; not statewide Medicaid or health program
- **Ramp Up Indiana**: Grants to non-profits/local govs for ramp installs only; income verified per household but program aggregates targeting (50% at ≤50% AMI, all ≤80% AMI); varies by local partner availability, not household size directly.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Indiana?
