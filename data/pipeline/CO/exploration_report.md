# Colorado Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 7.8m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 13 |
| New (not in our data) | 8 |
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

- **financial**: 5 programs
- **service**: 6 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Health First Colorado Buy-In (QMB, SLMB, QI)

- **income_limit**: Ours says `$994` → Source says `$1,255` ([source](https://hcpf.colorado.gov/medicaid-buy-program (related buy-in); for MSPs: https://www.healthfirstcolorado.com/ [1][2][4]))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `**QMB:** Pays Medicare Part B monthly premium, deductibles, copays, coinsurance (covers the 20% Medicare does not, providing full coverage). **SLMB & QI-1:** Pays Part B monthly premium only; responsible for deductibles, copays, coinsurance (supplemental plans may fill gaps).[1]` ([source](https://hcpf.colorado.gov/medicaid-buy-program (related buy-in); for MSPs: https://www.healthfirstcolorado.com/ [1][2][4]))
- **source_url**: Ours says `MISSING` → Source says `https://hcpf.colorado.gov/medicaid-buy-program (related buy-in); for MSPs: https://www.healthfirstcolorado.com/ [1][2][4]`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.colorado.gov/PEAK (primary application portal); https://cdhs.colorado.gov/snaps (Colorado Dept of Human Services)))
- **income_limit**: Ours says `$1980` → Source says `$2608` ([source](https://www.colorado.gov/PEAK (primary application portal); https://cdhs.colorado.gov/snaps (Colorado Dept of Human Services)))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases; amount based on net income (max allotment minus 30% net income, e.g., $546 max for 2-person elderly/disabled household yields $415 after calc). Minimum/maximum allotments apply; scales with household size, deductions for shelter, medical (elderly/disabled), utilities.[1][2][6]` ([source](https://www.colorado.gov/PEAK (primary application portal); https://cdhs.colorado.gov/snaps (Colorado Dept of Human Services)))
- **source_url**: Ours says `MISSING` → Source says `https://www.colorado.gov/PEAK (primary application portal); https://cdhs.colorado.gov/snaps (Colorado Dept of Human Services)`

### State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one personalized counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), enrollment, appeals, prescription drug costs, coordinating benefits, applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help), managing bills; public education, outreach presentations, enrollment events; unbiased advice (counselors not licensed to sell insurance); some programs offer study guides, legal referrals[1][2][3][4][6].` ([source](https://doi.colorado.gov/insurance-products/health-insurance/senior-health-care))
- **source_url**: Ours says `MISSING` → Source says `https://doi.colorado.gov/insurance-products/health-insurance/senior-health-care`

### Colorado Legal Services (Legal Aid for Seniors)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal services including attorney advice, assistance filing cases, full court representation; covers housing/evictions, public benefits (Social Security, Medicare, Medicaid, SSI), advance directives (living wills, powers of attorney), economic justice (debt, etc.), elder abuse/neglect prevention; social worker support in some areas (Denver, Colorado Springs)[1][2][3][4].` ([source](https://www.coloradolegalservices.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.coloradolegalservices.org`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy services including receiving and resolving complaints on quality of care, use of restraints, transfers/discharges, abuse, privacy/dignity issues, medications, hygiene, staff attitudes, and resident rights violations. Services are confidential, resident-directed, and free. Ombudsmen visit facilities regularly (e.g., nursing homes weekly, assisted living bi-monthly in some areas).` ([source](https://www.coombudsman.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.coombudsman.org`

## New Programs (Not in Our Data)

- **Home and Community-Based Services (HCBS) Waivers in Colorado** — service ([source](Colorado Department of Health Care Policy and Financing (HCPF); Health First Colorado (Colorado Medicaid) program))
  - Shape notes: Colorado's HCBS waivers are population-specific (elderly, developmental disabilities, traumatic brain injury, mental health, etc.). The EBD Waiver is the primary option for elderly individuals. Income limits are fixed statewide at 300% SSI. Asset limits vary by household composition (single vs. couple). Benefits are individualized based on functional need assessment rather than tiered or fixed amounts. Application involves both functional eligibility (LOC determination) and financial/disability verification by multiple state agencies[3][6].
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly and Colorado Department of Health Care Policy and Financing (HCPF)))
  - Shape notes: PACE eligibility and benefits are highly individualized based on medical and functional assessment rather than categorical tiers. The program is dual-eligible focused (Medicare + Medicaid), but single-eligible participants (Medicare-only) are also accepted. Financial eligibility is Medicaid-dependent and varies by household composition and state rules. Service areas are geographically restricted, requiring verification before application. The program structure is unique in that it becomes the sole source of benefits, creating a significant commitment for participants.
- **Weatherization Assistance Program (WAP)** — service ([source](https://socgov02.my.site.com/ceoweatherization/s/))
  - Shape notes: Administered regionally with income varying by county/AMI/SMI/FPL and utility; no fixed statewide table; local providers handle apps with potential waitlists; prioritizes vulnerable households implicitly via public assistance auto-qualify.
- **Community Access Services (CAS) and Respite Care** — service ([source](No primary .gov URL identified in results; start with county Department of Human Services or https://hcpf.colorado.gov (implied from context)[2][4]))
  - Shape notes: Tied to multiple HCBS waivers with county-level financial tests and functional assessments; provider/agency-specific (e.g., PASAs, CMAs); varies heavily by region and disability type—no fixed statewide income table or service hours in sources
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: Grantee-operated with regional service areas only (not full statewide); priority tiers heavily influence enrollment; income at exactly 125% federal poverty (varies by household size, annual update); no fixed asset test
- **Old Age Pension (OAP)** — financial ([source](https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=5243&fileName=9+CCR+2503-3 (Code of Colorado Regulations 9 CCR 2503-3)[1]))
  - Shape notes: County-administered with varying grant maximums; multiple tiers (A/B/C) by age/disability; requires proof of pursuing federal benefits; assets have detailed countable/exempt rules
- **Home Care Allowance (HCA)** — financial ([source](Colorado Department of Human Services; Colorado PEAK (https://www.colorado.gov/peak); County-specific human services offices))
  - Shape notes: HCA eligibility is uniquely structured around two independent scoring systems: (1) Capacity Score (threshold: 21+) and (2) Need for Paid Care Score (varies by tier: 1-23, 24-37, or 38-51). Both must be met. The program is county-administered but statewide, creating regional variation in application processes. Maximum benefit ($1,500/month) is fixed, not means-tested. The program explicitly excludes individuals receiving HCBS, making it a lower-intensity alternative to Medicaid waiver services. Income and asset limits are strict and do not scale by household size for the primary applicant, though married couples must apply individually.
- **Older Coloradans Cash Fund** — financial ([source](https://cdhs.colorado.gov/ (Office on Aging section; exact program page not in results)))
  - Shape notes: One-time grant program distinct from monthly cash like OAP; income at 200% FPL; administered statewide via counties

## Program Details

### Health First Colorado Buy-In (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: These are federal Medicare Savings Programs (MSPs) administered through Health First Colorado. Exact 2026 income limits not specified in sources; limits vary by tier (QMB, SLMB, QI) and are typically 100% FPL for QMB, 120% for SLMB, 135% for QI, adjusted annually for household size. Contact county office for current dollar amounts as they differ for single/couple (e.g., QMB often up to ~$1,255/month single, ~$1,695 couple, but verify).[1][3]
- Assets: There are three levels of MSP depending on income and asset limits. Specific 2026 asset limits (typically $9,660 individual/$14,490 couple, excluding home, car, etc.) not detailed; what counts includes bank accounts, stocks; exempts primary home, one vehicle, personal items. Confirm with local office.[1]
- Must be enrolled in Medicare Part A.
- Colorado resident.
- U.S. citizen or qualified immigrant.
- For elderly loved ones: age 65+ or disabled under 65 on Medicare.

**Benefits:** **QMB:** Pays Medicare Part B monthly premium, deductibles, copays, coinsurance (covers the 20% Medicare does not, providing full coverage). **SLMB & QI-1:** Pays Part B monthly premium only; responsible for deductibles, copays, coinsurance (supplemental plans may fill gaps).[1]
- Varies by: priority_tier

**How to apply:**
- Online: https://www.healthfirstcolorado.com/apply-now/ [4]
- Phone: Contact local county human services office (find via https://cdhs.colorado.gov/counties or 1-800-221-3943).
- Mail or in-person: Local county Department of Human Services office.[1][4]

**Timeline:** Not specified in sources; typically 45 days for Medicaid programs.
**Waitlist:** QI often has federal funding caps and waitlists; others generally no waitlist.[1]

**Watch out for:**
- Must already have Medicare enrollment; QMB provides fuller coverage than SLMB/QI (people miss that SLMB/QI leave you paying deductibles/copays).[1]
- Asset test applies (unlike standard Medicaid in some cases); QI has limited slots.[1][3]
- Not the disability 'Buy-In for Working Adults'—that's separate with premiums based on income.[2]
- Work requirements starting 2027 exempt buy-in/disability programs but confirm MSP status.[5][6]

**Data shape:** Tiered by QMB/SLMB/QI with differing income/asset limits and benefit levels; financial assistance tied to Medicare premiums/coinsurance; asset exclusions standard but tested; funding caps for QI.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hcpf.colorado.gov/medicaid-buy-program (related buy-in); for MSPs: https://www.healthfirstcolorado.com/ [1][2][4]

---

### Home and Community-Based Services (HCBS) Waivers in Colorado

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 years or older (or 18-64 if physically disabled or blind; or 18+ with HIV/AIDS diagnosis)+
- Income: Monthly income must not exceed $2,199 (300% of the Supplemental Security Income allowance)[3]. This applies to individual income, not household income[7].
- Assets: {"countable_resources":"Less than $2,000 for a single person or $3,000 for a couple[3]","exempt_assets":"Primary home (with home equity interest not exceeding $1,130,000 in 2026)[2], household furnishings and appliances, personal effects, and one vehicle[2]"}
- Must be at risk of nursing home placement[2]
- Must require a Nursing Facility Level of Care (NFLOC), defined as needing assistance with a minimum of 2 out of 6 Activities of Daily Living (ADLs)[2]
- Must be willing to receive services in home or community settings[3]
- Must be a Colorado resident[2]

**Benefits:** Services include: adult day health, homemaker services, personal care (bathing, dressing, grooming), respite care, home delivered meals, home modifications, in-home support services, life skills training, non-medical transportation, personal emergency response systems, and wellness education[5]. Specific hours or dollar caps per service are not detailed in available sources.
- Varies by: Individual need assessment; services are tailored to the person's functional requirements

**How to apply:**
- Contact your local Colorado Department of Health Care Policy and Financing (HCPF) office or a certified Health First Colorado provider[3]
- Work with a case manager who will assess your need for care[1]
- Developmental Pathways and similar organizations provide intake and enrollment assistance[6]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources; regional variations in wait times are possible but not documented

**Watch out for:**
- Income test uses individual income only, not household income—this can make elderly individuals with limited personal income eligible even if their household has higher income[7]
- The 60-month Look-Back Rule applies: assets given away or sold below fair market value within 60 months of applying for long-term care Medicaid result in a Penalty Period of ineligibility[2]
- Home equity interest is capped at $1,130,000 (as of 2026)—homes exceeding this value may disqualify applicants[2]
- Must meet NFLOC (nursing facility level of care) requirement—this is a medical/functional threshold, not just age-based; a case manager assessment is required[1][2]
- Waiver is the only way some people qualify for Health First Colorado; eligibility is not automatic[3]
- Services must be provided by certified Health First Colorado providers[3]
- Multiple HCBS waivers exist in Colorado (SLS, DD, EBD, etc.); families must apply for the correct waiver matching their loved one's condition[1][5]

**Data shape:** Colorado's HCBS waivers are population-specific (elderly, developmental disabilities, traumatic brain injury, mental health, etc.). The EBD Waiver is the primary option for elderly individuals. Income limits are fixed statewide at 300% SSI. Asset limits vary by household composition (single vs. couple). Benefits are individualized based on functional need assessment rather than tiered or fixed amounts. Application involves both functional eligibility (LOC determination) and financial/disability verification by multiple state agencies[3][6].

**Source:** Colorado Department of Health Care Policy and Financing (HCPF); Health First Colorado (Colorado Medicaid) program

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Medicaid income limit: under 300% of Federal Benefit Rate ($2,901/month as of 2025). Medicare has no income limit. Exact limits vary by state and household composition; Colorado-specific thresholds require verification with Colorado Department of Health Care Policy and Financing (HCPF).[3]
- Assets: Medicaid asset limit: $2,000 or less (excluding primary home). Medicare has no asset limit. Asset limits apply only to Medicaid-eligible participants; Medicare-only participants face no asset restrictions.[3]
- Must meet nursing home level of care requirement as determined by Colorado state assessment[1][2]
- Must be able to live safely in the community at time of enrollment[1][2]
- Must live in a PACE-covered service area in Colorado[1]
- Medicare eligibility (if applicable): U.S. citizen or legal resident for 5 years prior to application, AND age 65+ OR disabled OR diagnosed with ALS OR have end-stage renal disease[3]

**Benefits:** Comprehensive medical and social services including primary care, nursing, social work, therapy, and supportive services. Specific service hours and dollar amounts not detailed in available sources. Financing is capped, allowing providers to deliver all services participants need rather than limiting to reimbursable services only.[2]
- Varies by: Individual need (customized care plan); does not vary by tier or priority level

**How to apply:**
- In-person: Contact Colorado PACE directly at their Day Center (specific address and phone number not provided in search results)
- Phone: Contact Colorado PACE (specific number not provided in search results)
- Mail: Submit to Colorado Department of Health Care Policy and Financing (specific address not provided in search results)
- Online: Visit coloradopace.org (specific online application portal not confirmed in search results)

**Timeline:** State-level approval typically takes 7 to 14 days after comprehensive assessment submission.[1]
**Waitlist:** Not specified in available sources.

**Watch out for:**
- PACE becomes the sole source of Medicare and Medicaid benefits for participants—you cannot use other Medicare or Medicaid providers simultaneously.[2]
- Nursing home level of care requirement is state-determined and varies by state; Colorado's specific definition of what qualifies is not detailed in available sources and requires direct verification with HCPF.[1][3]
- Not meeting standard Medicaid financial criteria ($2,901/month income, $2,000 assets) does not automatically disqualify applicants; Medicaid offers multiple pathways to eligibility through planning strategies.[3]
- Service area coverage is limited—applicants must verify they live in a covered area before applying.[1]
- Participants can leave the program at any time for any reason, but re-enrollment may have different requirements.[2]
- Comprehensive assessment is multi-disciplinary and includes evaluation of safety to live in community; applicants must demonstrate ability to safely remain at home with PACE support.[1]
- Income and asset limits apply only to Medicaid-eligible participants; Medicare-only participants have no financial restrictions but must still meet age/disability and nursing home level of care criteria.[3]

**Data shape:** PACE eligibility and benefits are highly individualized based on medical and functional assessment rather than categorical tiers. The program is dual-eligible focused (Medicare + Medicaid), but single-eligible participants (Medicare-only) are also accepted. Financial eligibility is Medicaid-dependent and varies by household composition and state rules. Service areas are geographically restricted, requiring verification before application. The program structure is unique in that it becomes the sole source of benefits, creating a significant commitment for participants.

**Source:** https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly and Colorado Department of Health Care Policy and Financing (HCPF)

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For Oct. 1, 2025 through Sept. 30, 2026, most households must meet a gross income limit of 200% of the federal poverty level: 1 person $2608/month, 2 people $3526/month, 3 people $4442/month, 4 people $5358/month, 5 people $6276/month, 6 people $7192/month, 7 people $8108/month, each additional +$916/month. Households with a member 60+ or disabled who exceed gross income can qualify via net income test (100% FPL) and asset test if applicable. All households must meet net income limits; benefits calculated as max allotment minus 30% of net income.[1][2][4]
- Assets: No asset limit in Colorado for most households due to broad-based categorical eligibility. Households with a member 60+ or disabled exceeding gross income follow federal rules with $4,500 asset limit. Exempt: home, vehicles. Countable: bank accounts, cash value of life insurance, retirement savings (some states vary).[1][3]
- Colorado resident
- U.S. citizen or qualified non-citizen/lawful permanent resident
- Social Security number (or proof of application)
- For elderly/disabled (60+ or SSI/SSDI/ government disability): special rules allow skipping gross income test if net income and assets met; medical deduction if out-of-pocket >$35/month ($165+ deduction); most can do phone interview[1][2][4][5]
- Able-bodied adults without dependents (under 65) or parents with kids 14+ may need 80 hours/month work requirement (exemptions for homeless, veterans, foster care youth)[5]

**Benefits:** Monthly EBT card for food purchases; amount based on net income (max allotment minus 30% net income, e.g., $546 max for 2-person elderly/disabled household yields $415 after calc). Minimum/maximum allotments apply; scales with household size, deductions for shelter, medical (elderly/disabled), utilities.[1][2][6]
- Varies by: household_size

**How to apply:**
- Online: PEAK (Colorado's benefits portal)
- Phone: EBT Customer Service 1-888-328-2656; local dept of human services (check PEAK)
- Mail or in-person: Local county human services office

**Timeline:** Up to several weeks[2]

**Watch out for:**
- Elderly/disabled over gross limit can still qualify via net income/asset test—many miss this[1]
- No asset limit usually, but federal $4,500 applies if using elderly/disabled alternate path[1]
- Medical deduction only if >$35/month out-of-pocket—track expenses[2]
- Redetermination every 6-12 months + annual change report required to avoid lapse[2]
- Work requirements for under-65 ABAWDs/parents with kids 14+ (80 hrs/month), recently expanded[5]
- Include all who buy/prepare food together in household[3]

**Data shape:** Benefits scale by household size and net income; elderly/disabled have relaxed gross income test + medical/shelter deductions; no standard asset limit due to state BBCE expansion; county-administered with uniform rules

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.colorado.gov/PEAK (primary application portal); https://cdhs.colorado.gov/snaps (Colorado Dept of Human Services)

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Varies by household size, county, and utility provider. Automatic qualification if receiving SNAP, LEAP, TANF, SSI, OAP, AND, or COAP. Otherwise, based on 60% State Median Income (SMI) for 1-7 members, 80% Area Median Income (AMI) for certain utilities (e.g., Xcel, Black Hills, Atmos, Colorado Natural Gas), or 200% Federal Poverty Level (FPL) for 8+ members. Example table from NWCCOG (may vary by region): 1: $45,660-$67,200; 2: $61,920-$79,920; 3: $78,240-$92,640; 4: $94,560-$105,360; 5: $110,880-$118,080; 6: $127,200-$130,800; 7: $143,520-$143,520; 8: $108,300-$159,040; 9: $119,300-$168,640; 10: $130,300-$178,240. For >10, add $11,000 per person. Exact limits depend on county/provider; contact local agency.
- Assets: No asset limits mentioned.
- Home not weatherized in past 15 years (some sources say 15 1/4 years).
- Home not under construction or for sale.
- Renters need landlord release form.
- Proof of legal presence (affidavit if applicable).
- Valid ID required (e.g., CO driver's license, passport, tribal document).

**Benefits:** Energy efficiency upgrades for homes, including insulation, air sealing, duct repairs, water heater wraps, and other measures to reduce energy costs. Modified techniques for mobile homes. Services for site-built and mobile homes; funded by DOE, state, LEAP, and utility rebates.
- Varies by: region

**How to apply:**
- Online: https://socgov02.my.site.com/ceoweatherization/s/
- Phone: Varies by provider, e.g., Energy Resource Center (720) 236-1321
- Email: e.g., [email protected] (Pueblo)
- Mail/In-person: Varies, e.g., Energy Resource Center, 953 Decatur Street, Denver, CO 80204; Pueblo County offices; NWCCOG offices

**Timeline:** Not specified; varies by demand.
**Waitlist:** Possible; timelines vary by program demand, capacity, funding, and region. Contact local provider for current status.

**Watch out for:**
- Income limits vary by county, household size, and utility (not fixed statewide; check local provider).
- Automatic qualification via benefits still requires approval letter and ID.
- Home must not have been weatherized in last 15 years; prior service disqualifies.
- Renters need landlord permission; no services if denied.
- Waitlists common due to funding limits; priority may go to elderly, disabled, large families (implied but not explicit).
- Meeting income does not guarantee services; depends on funding/utility.

**Data shape:** Administered regionally with income varying by county/AMI/SMI/FPL and utility; no fixed statewide table; local providers handle apps with potential waitlists; prioritizes vulnerable households implicitly via public assistance auto-qualify.

**Source:** https://socgov02.my.site.com/ceoweatherization/s/

---

### State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income limits; available to anyone eligible for Medicare (typically age 65+ or under 65 with disabilities), family members, and caregivers. Supports people with limited incomes but not restricted by specific dollar amounts[1][2][4].
- Assets: No asset limits or tests apply[1][2].
- Must be eligible for Medicare or soon to be eligible
- Family members and caregivers of Medicare beneficiaries can access services
- No requirement to be enrolled yet; contact 3 months before Medicare starts recommended[1]

**Benefits:** Free one-on-one personalized counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), enrollment, appeals, prescription drug costs, coordinating benefits, applying for low-income programs (Medicaid, Medicare Savings Program, Extra Help), managing bills; public education, outreach presentations, enrollment events; unbiased advice (counselors not licensed to sell insurance); some programs offer study guides, legal referrals[1][2][3][4][6].

**How to apply:**
- Phone: Toll-free 1-888-696-7213 (8:30 am - 4:30 pm), Spanish: 303-894-5953[3][5]
- Website: https://doi.colorado.gov/insurance-products/health-insurance/senior-health-care[3][5]
- Email: Brandon.D.Davis@state.co.us[3]
- In-person: Through local partners like area agencies on aging (e.g., Denver Regional Council of Governments for Arapahoe, Douglas, Jefferson counties)[3][8]

**Timeline:** No formal application or processing; services provided immediately via phone or in-person counseling[1][4].

**Watch out for:**
- Not insurance agents; cannot sell plans or recommend specific products—only provide unbiased information[1]
- Intensive training (8-10 hours) ensures expertise, but services are counseling only, not direct financial aid or healthcare[1][2]
- Often confused with Medicare itself; it's free help navigating Medicare, not a health plan[4]
- Contact early (3 months before Medicare starts) to avoid enrollment penalties[1]
- May refer to Senior Medicare Patrol (SMP) for fraud issues, which some SHIPs provide alongside[2][8]

**Data shape:** no income or asset test; eligibility tied solely to Medicare status; statewide with local delivery partners; service-based (counseling hours unlimited, no caps); unbiased non-sales focus unique to SHIP vs. private advisors

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://doi.colorado.gov/insurance-products/health-insurance/senior-health-care

---

### Community Access Services (CAS) and Respite Care

> **NEW** — not currently in our data

**Eligibility:**
- Income: Financial eligibility determined by county Department of Human Services; income and resources (savings, assets) must be under unspecified limits that vary by county and household—contact local county Human Services for exact amounts and table. Family Support Services Program exempt from financial eligibility[2].
- Assets: Resources such as savings and items of value counted; specific limits and exemptions not detailed in sources—varies by county[2].
- Substantial disability prior to age 22 or neurological condition[5]
- Current assessments including psychological evaluation or adaptive behavior testing[5]
- Functional eligibility based on level of support needed for daily routines and specific diagnosis (e.g., developmental disability, brain injury, physical disability) depending on waiver[2][5]
- At risk of institutionalization for certain waivers[2]

**Benefits:** Specific services not detailed for CAS/Respite; related HCBS waivers provide supportive services like habilitation residential, home and community based supports, respite (implied in context), day programs, supported community connections, employment planning, residential for developmental disabilities. Hours/dollars not specified[1][2][5].
- Varies by: priority_tier

**How to apply:**
- Contact local Case Management Agency (CMA) Intake Resource Coordinator[5]
- Contact Community Connections Intake Case Manager for eligibility determination[2]
- County Department of Human Services for financial eligibility[2]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; rural areas may lack some services[2]

**Watch out for:**
- Not all services available in rural areas[2]
- Must meet both financial (county-determined) and functional eligibility; diagnosis-specific[2][5]
- Funding hierarchy applies before waiver services (e.g., natural supports first)[4]
- CAS/Respite often tied to specific HCBS waivers like Developmental Disabilities, Supported Living Services—not standalone[1]
- Family Support Services exempt from income test, but others are not[2]

**Data shape:** Tied to multiple HCBS waivers with county-level financial tests and functional assessments; provider/agency-specific (e.g., PASAs, CMAs); varies heavily by region and disability type—no fixed statewide income table or service hours in sources

**Source:** No primary .gov URL identified in results; start with county Department of Human Services or https://hcpf.colorado.gov (implied from context)[2][4]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; families must contact a local Colorado SCSEP provider to verify current thresholds, as specific 2026 figures are not listed in sources.
- Unemployed
- Resident in a Colorado area served by the program
- Legally able to work in the U.S. (complete I-9 form)
- Income must be reported accurately; willful misrepresentation disqualifies
- Enrollment priority: veterans and qualified spouses first, then those over 65, with disabilities, low literacy, limited English, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users

**Benefits:** Part-time on-the-job training (up to 20 hours/week) at community nonprofits/public sites (e.g., schools, hospitals, senior centers); paid the highest of federal, state, or local minimum wage via direct deposit; skills training (e.g., computer use) toward unsubsidized job; average 6 months training; must develop and comply with Individual Employment Plan (IEP); must register with State Workforce within 2 weeks.
- Varies by: priority_tier

**How to apply:**
- Online: https://www.ipdcscsep.org/scsep-application (covers Colorado areas)
- Contact SER National for Colorado (serves Colorado): https://ser-national.org/scsep-2/
- Phone/mail/in-person: Contact local provider (e.g., SER National or state grantee; specific numbers not in results—call Colorado Department of Labor or SER for nearest office)
- Find local office via national SCSEP resources or American Job Centers

**Timeline:** Not specified; application reviewed by Project Director based on eligibility, suitability, and criteria (not first-come, first-served).
**Waitlist:** Possible if no immediate spots; priority affects access.

**Watch out for:**
- Not first-come, first-served—Project Director decides based on suitability and priority
- Must reside in specifically served area (not statewide)
- Requires bank account for direct deposit and State Workforce registration
- Willful income misrepresentation disqualifies permanently
- Limited duration (avg. 6 months) as bridge to unsubsidized work; must commit to 20 hours/week and professional conduct
- No asset limits specified, but all income counted

**Data shape:** Grantee-operated with regional service areas only (not full statewide); priority tiers heavily influence enrollment; income at exactly 125% federal poverty (varies by household size, annual update); no fixed asset test

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### Colorado Legal Services (Legal Aid for Seniors)


**Eligibility:**
- Age: 60+
- Income: For seniors (60+), no income limits in certain programs like Senior Law Project (e.g., Larimer County); generally, low-income based on 125% of 2024 Federal Poverty Guidelines for others, but exact dollar amounts/tables not specified in sources—must contact for current FPG table by household size[1][2][8].
- Assets: No asset limits for seniors (60+) in senior-specific programs[2].
- Low-income priority or 60+ age waiver[1]
- Colorado resident[1]
- Civil legal issues only (not criminal, traffic, etc.)[1][2]
- Case-by-case for immigration categories if applicable[2]
- High social/economic need prioritized under Older Americans Act[4]

**Benefits:** Free civil legal services including attorney advice, assistance filing cases, full court representation; covers housing/evictions, public benefits (Social Security, Medicare, Medicaid, SSI), advance directives (living wills, powers of attorney), economic justice (debt, etc.), elder abuse/neglect prevention; social worker support in some areas (Denver, Colorado Springs)[1][2][3][4].
- Varies by: priority_tier

**How to apply:**
- Online pre-apply: https://www.coloradolegalservices.org/get-help/[6]
- Phone: Call central intake (number via website or local office)[1][6]
- In-person: 13 offices statewide—find via https://www.coloradolegalservices.org/get-help/[3][6]
- Mail/intake process required for all[1][6]

**Timeline:** Team contacts after application; intake required, but no specific timeline stated[1][6].
**Waitlist:** Limited resources mean unable to serve all (e.g., 323 elders turned away in 2021); some cases opened monthly (900+ in Aug)[1][4].

**Watch out for:**
- Not a hotline—intake screening required first[2]
- Can't take every case due to resources; turn away eligible applicants[1][4][5]
- Some offices limit case types[2]
- Seniors may bypass income test but still prioritized by need[1][2][4]
- Separate from state-funded elder program via Disability Law Colorado/AAAs[4]

**Data shape:** Seniors 60+ often no income/asset test but prioritized by need via AAAs/private providers; 13 CLS offices + regional variations; resource-limited with case prioritization

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.coloradolegalservices.org

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available regardless of financial status.
- Assets: No asset limits or tests; no financial eligibility requirements.
- Must be a resident of a skilled nursing home or licensed assisted living residence in Colorado (or a relative, friend, facility staff, or concerned individual on their behalf). No age requirement specified, though often relevant for elderly residents.

**Benefits:** Advocacy services including receiving and resolving complaints on quality of care, use of restraints, transfers/discharges, abuse, privacy/dignity issues, medications, hygiene, staff attitudes, and resident rights violations. Services are confidential, resident-directed, and free. Ombudsmen visit facilities regularly (e.g., nursing homes weekly, assisted living bi-monthly in some areas).

**How to apply:**
- Online: https://www.coombudsman.org (use 'Find an Ombudsman' to locate local office)
- Phone: State level 720-925-8609 (Jesse Bond for info); local examples - Boulder 303-441-1170, Pueblo 719-601-6282
- Email: jesse.bond@state.co.us (state coordinator); local examples - ecorson@bouldercounty.gov (Boulder), dmason@srda.org (Pueblo)
- In-person: Local long-term care facilities or regional offices (network across state)

**Timeline:** Immediate assistance for complaints; no formal processing time as it's not an enrollment-based benefit program.

**Watch out for:**
- Not a healthcare or financial aid program—purely advocacy for rights and complaint resolution, not direct care or funding.
- Services are resident-directed and confidential; family cannot override resident's wishes.
- Only covers licensed skilled nursing homes and assisted living—not home care, adult day care, or unlicensed facilities.
- Anyone can contact (residents, families, staff, public), but intervention requires resident direction.
- Volunteering requires separate 36-hour training and commitment, often confused with receiving services.

**Data shape:** no income/asset test; advocacy-only with statewide network of local offices; facility-residency required; free/confidential/resident-directed; regional providers handle delivery with visit frequency variations

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.coombudsman.org

---

### Old Age Pension (OAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income must be below the maximum monthly grant standard, which varies by county but is cited as $750 (Grand County)[3], $952 (statewide effective 1/1/2023)[2], or $1,032 (Boulder/Douglas Counties)[5][6]. All income sources (wages, Social Security, SSI, pensions, veteran's benefits, spouse's income) are countable and reduce the benefit dollar-for-dollar. Applicants must pursue and verify applications for other benefits like SSI, SSDI, or Social Security first[1][2].
- Assets: Countable resources limited to $2,000 for an individual or $3,000 for a married couple[2][3][5][6]. Countable assets include cash, checking/savings accounts, CDs, vehicles (beyond one), boats, motor homes, stocks/bonds, life insurance, burial contracts/policies, secondary property[3][6]. Exempt: primary residence, one automobile[6].
- Colorado resident[4]
- U.S. citizen or qualified legal resident (for health components, 5-year U.S. residency may apply for HCP)[5]
- Must apply for and provide proof of pursuing other benefits (e.g., SSI/SSA, SSDI)[1][2]
- For OAP-A: age 65+ by verification completion; OAP-B: age 60-64 with disability criteria (e.g., prior State Aid to Needy Disabled, medical records, no employment in last 5 years); OAP-C: similar but for specific health care[1]

**Benefits:** Monthly cash payments up to the grant standard (e.g., $952 max effective 1/1/2023 statewide, $750 in Grand County, $1,032 in some counties), reduced dollar-for-dollar by other income. Paid via direct deposit or EBT debit card. May include medical benefits: Medicaid (if eligible) or Old Age Pension Health Care Program (HCP) for those ineligible for Medicaid due to resources, disability rules, or <5 years U.S. residency[1][2][3][5][7].
- Varies by: household_size

**How to apply:**
- In-person or mail via local county human services department (e.g., Grand County, Boulder County, Douglas County at 303-688-4825, Jefferson County)[3][5][6][7]
- Phone: Contact local county office (varies by county; e.g., Douglas 303-688-4825)[6]
- No statewide online application specified; apply through county departments

**Timeline:** Interview scheduled after application receipt; eligibility determined post-verification (no fixed statewide timeline; redetermination every 12 months)[2][7]

**Watch out for:**
- Must pursue/verify other benefits first (SSI, Social Security, SSDI); failure discontinues OAP[1][2]
- Spouse income fully countable; benefits reduced dollar-for-dollar[3]
- Asset limits strict; many items countable (life insurance, secondary vehicles/property)[3][6]
- Separate tiers (OAP-A/B/C) with nuanced age/disability rules; OAP-B/C for 60-64 often requires disability proof[1]
- Health care via HCP only if Medicaid-ineligible (e.g., excess resources, short U.S. residency)[5]
- Annual redetermination; must reapply for new benefits like Social Security at 62 or Medicare at 65[2]

**Data shape:** County-administered with varying grant maximums; multiple tiers (A/B/C) by age/disability; requires proof of pursuing federal benefits; assets have detailed countable/exempt rules

**Source:** https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=5243&fileName=9+CCR+2503-3 (Code of Colorado Regulations 9 CCR 2503-3)[1]

---

### Home Care Allowance (HCA)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for most applicants; also available to disabled individuals under 65 who meet functional and financial requirements[4]+
- Income: Income ≤ 300% of the Federal Benefit Rate (approximately $3,200/month for individuals)[4]. Combined income including Social Security must be under approximately $19,000/year for individuals[4]
- Assets: $2,000 asset limit[4]
- HCA cannot be received while receiving Home and Community Based Services[2]
- HCA is designed to serve individuals with the lowest functional abilities and the greatest need for paid care[2]
- If legally or common-law married, each person must apply separately[2]

**Benefits:** Up to $1,500/month for personal care, respite, home modifications, and supplies[4]
- Varies by: priority_tier (Tier 1, 2, or 3 based on functional assessment scores[1])

**How to apply:**
- Online: Colorado PEAK (https://www.colorado.gov/peak)[2]
- Phone: Hunger Free Colorado hotline at 855-855-4626[2]
- Mail: Send completed application to 4400 Castleton Court, Castle Rock, CO 80109[2]
- Fax: 877-285-8988[2]
- Email: [email protected][2]
- In-person: Douglas County office, Monday-Friday 8:00am-5:00pm, or use secure drop box in front of office[2]

**Timeline:** Within 90 days from the date the office receives your completed application and all required documents[3]
**Waitlist:** Not specified in available sources

**Watch out for:**
- HCA and Home and Community Based Services (HCBS) are mutually exclusive — you cannot receive both simultaneously[2]. Clients must be evaluated for HCBS first before HCA can be considered[1]
- Skilled personal care is explicitly NOT covered by HCA[1] — only unskilled care services qualify
- Asset limit of $2,000 is strict; exceeding this disqualifies applicants[4]
- Income limits are based on 300% of Federal Benefit Rate, which can change annually — verify current dollar amounts with your county office
- Both financial AND functional requirements must be met; meeting only one does not qualify you[2]
- If married, each spouse must apply separately[2]
- Processing takes up to 90 days; plan accordingly[3]
- The program is designed for individuals with the lowest functional abilities and greatest need for paid care — moderate functional needs may not qualify[2]

**Data shape:** HCA eligibility is uniquely structured around two independent scoring systems: (1) Capacity Score (threshold: 21+) and (2) Need for Paid Care Score (varies by tier: 1-23, 24-37, or 38-51). Both must be met. The program is county-administered but statewide, creating regional variation in application processes. Maximum benefit ($1,500/month) is fixed, not means-tested. The program explicitly excludes individuals receiving HCBS, making it a lower-intensity alternative to Medicaid waiver services. Income and asset limits are strict and do not scale by household size for the primary applicant, though married couples must apply individually.

**Source:** Colorado Department of Human Services; Colorado PEAK (https://www.colorado.gov/peak); County-specific human services offices

---

### Older Coloradans Cash Fund

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income ≤ 200% of Federal Poverty Level (approximately $2,400/month or $19,000/year for a one-person household; varies by household size based on FPL tables)
- Assets: Not specified in available sources
- Colorado resident
- U.S. citizen or qualified non-citizen

**Benefits:** One-time grants up to $1,200/year for home repairs (ramps, grab bars), utility assistance, minor adaptive equipment (walkers, shower chairs), personal care, respite, home modifications, and supplies

**How to apply:**
- Contact Colorado’s Office on Aging (specific phone/website not detailed in sources; check cdhs.colorado.gov or local county human services)
- Likely through county Department of Human Services

**Timeline:** Not specified

**Watch out for:**
- One-time grants only (not ongoing); must be low-income including all sources like Social Security; often confused with OAP or Home Care Allowance which have different benefits and limits; pursue other benefits first

**Data shape:** One-time grant program distinct from monthly cash like OAP; income at 200% FPL; administered statewide via counties

**Source:** https://cdhs.colorado.gov/ (Office on Aging section; exact program page not in results)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Health First Colorado Buy-In (QMB, SLMB, | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Community Access Services (CAS) and Resp | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Colorado Legal Services (Legal Aid for S | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Old Age Pension (OAP) | benefit | state | medium |
| Home Care Allowance (HCA) | benefit | state | deep |
| Older Coloradans Cash Fund | benefit | state | medium |

**Types:** {"benefit":9,"resource":3,"employment":1}
**Scopes:** {"state":7,"local":1,"federal":5}
**Complexity:** {"deep":8,"simple":3,"medium":2}

## Content Drafts

Generated 13 page drafts. Review in admin dashboard or `data/pipeline/CO/drafts.json`.

- **Health First Colorado Buy-In (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Home and Community-Based Services (HCBS) Waivers in Colorado** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 5 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP)** (resource) — 1 content sections, 6 FAQs
- **Community Access Services (CAS) and Respite Care** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Colorado Legal Services (Legal Aid for Seniors)** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Old Age Pension (OAP)** (benefit) — 3 content sections, 6 FAQs
- **Home Care Allowance (HCA)** (benefit) — 5 content sections, 6 FAQs
- **Older Coloradans Cash Fund** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **Individual need assessment; services are tailored to the person's functional requirements**: 1 programs
- **Individual need (customized care plan); does not vary by tier or priority level**: 1 programs
- **household_size**: 2 programs
- **region**: 1 programs
- **not_applicable**: 3 programs
- **priority_tier (Tier 1, 2, or 3 based on functional assessment scores[1])**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Health First Colorado Buy-In (QMB, SLMB, QI)**: Tiered by QMB/SLMB/QI with differing income/asset limits and benefit levels; financial assistance tied to Medicare premiums/coinsurance; asset exclusions standard but tested; funding caps for QI.
- **Home and Community-Based Services (HCBS) Waivers in Colorado**: Colorado's HCBS waivers are population-specific (elderly, developmental disabilities, traumatic brain injury, mental health, etc.). The EBD Waiver is the primary option for elderly individuals. Income limits are fixed statewide at 300% SSI. Asset limits vary by household composition (single vs. couple). Benefits are individualized based on functional need assessment rather than tiered or fixed amounts. Application involves both functional eligibility (LOC determination) and financial/disability verification by multiple state agencies[3][6].
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE eligibility and benefits are highly individualized based on medical and functional assessment rather than categorical tiers. The program is dual-eligible focused (Medicare + Medicaid), but single-eligible participants (Medicare-only) are also accepted. Financial eligibility is Medicaid-dependent and varies by household composition and state rules. Service areas are geographically restricted, requiring verification before application. The program structure is unique in that it becomes the sole source of benefits, creating a significant commitment for participants.
- **Supplemental Nutrition Assistance Program (SNAP)**: Benefits scale by household size and net income; elderly/disabled have relaxed gross income test + medical/shelter deductions; no standard asset limit due to state BBCE expansion; county-administered with uniform rules
- **Weatherization Assistance Program (WAP)**: Administered regionally with income varying by county/AMI/SMI/FPL and utility; no fixed statewide table; local providers handle apps with potential waitlists; prioritizes vulnerable households implicitly via public assistance auto-qualify.
- **State Health Insurance Assistance Program (SHIP)**: no income or asset test; eligibility tied solely to Medicare status; statewide with local delivery partners; service-based (counseling hours unlimited, no caps); unbiased non-sales focus unique to SHIP vs. private advisors
- **Community Access Services (CAS) and Respite Care**: Tied to multiple HCBS waivers with county-level financial tests and functional assessments; provider/agency-specific (e.g., PASAs, CMAs); varies heavily by region and disability type—no fixed statewide income table or service hours in sources
- **Senior Community Service Employment Program (SCSEP)**: Grantee-operated with regional service areas only (not full statewide); priority tiers heavily influence enrollment; income at exactly 125% federal poverty (varies by household size, annual update); no fixed asset test
- **Colorado Legal Services (Legal Aid for Seniors)**: Seniors 60+ often no income/asset test but prioritized by need via AAAs/private providers; 13 CLS offices + regional variations; resource-limited with case prioritization
- **Long-Term Care Ombudsman Program**: no income/asset test; advocacy-only with statewide network of local offices; facility-residency required; free/confidential/resident-directed; regional providers handle delivery with visit frequency variations
- **Old Age Pension (OAP)**: County-administered with varying grant maximums; multiple tiers (A/B/C) by age/disability; requires proof of pursuing federal benefits; assets have detailed countable/exempt rules
- **Home Care Allowance (HCA)**: HCA eligibility is uniquely structured around two independent scoring systems: (1) Capacity Score (threshold: 21+) and (2) Need for Paid Care Score (varies by tier: 1-23, 24-37, or 38-51). Both must be met. The program is county-administered but statewide, creating regional variation in application processes. Maximum benefit ($1,500/month) is fixed, not means-tested. The program explicitly excludes individuals receiving HCBS, making it a lower-intensity alternative to Medicaid waiver services. Income and asset limits are strict and do not scale by household size for the primary applicant, though married couples must apply individually.
- **Older Coloradans Cash Fund**: One-time grant program distinct from monthly cash like OAP; income at 200% FPL; administered statewide via counties

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Colorado?
