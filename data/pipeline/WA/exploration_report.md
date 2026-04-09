# Washington Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 1.6m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 16 |
| New (not in our data) | 9 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 5 programs
- **service**: 6 programs
- **in_kind**: 1 programs
- **financial|in_kind|service**: 1 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Apple Health Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,463` ([source](https://www.washingtonconnection.org/home/ (Apple Health portal); https://www.hca.wa.gov/ (Health Care Authority)))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `- **QMB**: Pays Part A premium (if any), Part B premium, deductibles, coinsurance, copayments (except prescriptions), Part C copays[1][3][4]
- **SLMB**: Pays Part B premium only[1][3]
- **QI-1**: Pays Part B premium only (for non-Medicaid clients)[1][2][3]` ([source](https://www.washingtonconnection.org/home/ (Apple Health portal); https://www.hca.wa.gov/ (Health Care Authority)))
- **source_url**: Ours says `MISSING` → Source says `https://www.washingtonconnection.org/home/ (Apple Health portal); https://www.hca.wa.gov/ (Health Care Authority)`

### Tailored Supports for Older Adults (TSOA)

- **income_limit**: Ours says `$2901` → Source says `$3,868` ([source](https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615 (WAC 182-513-1615); https://www.dshs.wa.gov/office-locations[2][4]))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Tailored in-home supports for unpaid family caregivers and care recipients (age 55+), including: housekeeping and errands, support groups and counseling, specialized medical equipment/supplies, respite care, training opportunities, adult day health/care, caregiving information and community resources.[6][7]` ([source](https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615 (WAC 182-513-1615); https://www.dshs.wa.gov/office-locations[2][4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615 (WAC 182-513-1615); https://www.dshs.wa.gov/office-locations[2][4]`

### Basic Food Program

- **income_limit**: Ours says `$2212` → Source says `$2,510` ([source](https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program and https://www.washingtonconnection.org))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly electronic benefits (EBT card) to purchase food at participating grocery stores. Maximum monthly benefit allotments vary by household size:[1] 1 person: $292; 2 people: $536; 3 people: $768; 4 people: $975; 5 people: $1,158. Actual benefits vary based on household income and living expenses (rent/mortgage, utilities, child care, child support).[1]` ([source](https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program and https://www.washingtonconnection.org))
- **source_url**: Ours says `MISSING` → Source says `https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program and https://www.washingtonconnection.org`

### Washington Energy Assistance Program (WEAP)

- **income_limit**: Ours says `$3095` → Source says `$1,956` ([source](https://www.commerce.wa.gov/community-opportunities/liheap/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time grant for utility bills (heating max $1,250, min $250); crisis assistance up to $10,000 for emergencies like shutoffs or broken heaters; repair/replace unsafe heating/cooling units; energy efficiency improvements via Weatherization Program.[1][4]` ([source](https://www.commerce.wa.gov/community-opportunities/liheap/))
- **source_url**: Ours says `MISSING` → Source says `https://www.commerce.wa.gov/community-opportunities/liheap/`

### Health Insurance Counseling and Advocacy Program (HICAP/SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, one-on-one counseling, education, and assistance on Medicare (Parts A, B, C, D), Medigap supplements, prescription drug plans, Medicare Savings Programs, Extra Help/Low-Income Subsidy, appeals, billing issues, fraud prevention, and coordination with other insurance; group outreach, presentations, and enrollment events; no dollar amounts, hours, or fixed limits specified[3][4][6][7]` ([source](https://www.insurance.wa.gov/about-us/office-insurance-commissioner-shiba (primary Washington SHIBA page, based on program context[4])))
- **source_url**: Ours says `MISSING` → Source says `https://www.insurance.wa.gov/about-us/office-insurance-commissioner-shiba (primary Washington SHIBA page, based on program context[4])`

### Home Delivered Meals (via Aging & Disability Resources)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritionally balanced meals (hot, pre-packaged, or box meals) delivered to home; frequency varies: daily, weekly, semi-weekly, or twice monthly. Examples: 1 meal per day (Sound Generations), 2 meals/day for 14 days post-discharge (CHPW MA). Suggested donation $6.50/meal (Sound Generations) or free via Medicaid/referral.` ([source](https://www.o3a.org/programs/nutrition-transportation/senior-nutrition-programs/))
- **source_url**: Ours says `MISSING` → Source says `https://www.o3a.org/programs/nutrition-transportation/senior-nutrition-programs/`

### Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Paid caregiving via Medicaid Personal Care (MPC) or Community First Choice: Hours based on CARE assessment for ADLs (personal hygiene, dressing, toileting, transferring, mobility); family caregivers paid as Individual Providers through CDWA (rates not specified in sources). Training: 5 hours orientation/safety + 30 hours basic. VA: Stipends, respite, mental health, travel, health insurance.[1][2][3][4]` ([source](https://www.dshs.wa.gov (DSHS Apple Health LTSS; no single page for exact 'Family Caregiver Support Program'; closest is MPC via Washington Connection: https://www.washingtonconnection.org)))
- **source_url**: Ours says `MISSING` → Source says `https://www.dshs.wa.gov (DSHS Apple Health LTSS; no single page for exact 'Family Caregiver Support Program'; closest is MPC via Washington Connection: https://www.washingtonconnection.org)`

## New Programs (Not in Our Data)

- **Medicaid Personal Care (MPC)** — service ([source](Washington State Department of Social and Health Services (DSHS); Washington Administrative Code § 182-513-1225; Washington Health Plan Finder))
  - Shape notes: MPC is a state-plan benefit with no age requirement, making it unique among long-term care Medicaid programs. The program is defined by functional need (ADL assistance) rather than care setting or diagnosis. Eligibility is based on noninstitutional CN/ABP income standards that are not explicitly stated in available sources but change annually. The program explicitly excludes those needing NFLOC, creating a specific niche between community care and institutional care. Benefits are individualized based on CARE assessment rather than tiered or standardized.
- **New Freedom Waiver** — service ([source](https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83491 (CMS waiver approval); state details via ALTSA))
  - Shape notes: County-restricted to 7 areas; participant-directed budget model; no household income table (per applicant); functional need via CARE tool; non-entitlement with implied waitlist
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-care/pace-washington (WA HCA/DSHS); https://www.providence.org/services/pace-and-adult-day-programs/elderplace-in-wa))
  - Shape notes: Limited to specific provider service areas (e.g., 1 main in King County); no direct income/asset test for PACE but tied to Medicaid/CFC-COPES financials; nursing home cert by DSHS social worker; slots capped with waitlists
- **Housing and Essential Needs (HEN) Referral Program** — financial|in_kind|service ([source](https://www.law.cornell.edu/regulations/washington/WAC-388-400-0070 (primary reg); www.washingtonconnection.org (DSHS apply)))
  - Shape notes: referral-only (DSHS first, then county provider); varies heavily by county provider/funding; 12-month cap; no fixed $ benefits, case-by-case with waitlists
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: Grantee-administered with regional providers (e.g., AARP Foundation, NAPCA); priority enrollment tiers; no WA statewide centralized application; income at 125% FPL without asset test specified
- **Legal Aid for Seniors (via Protection & Advocacy)** — advocacy ([source](https://nwjustice.org (Northwest Justice Project, primary provider)[8]))
  - Shape notes: Decentralized statewide via NJP/CLEAR with regional contractors; no strict income/asset tables published; priority-based on need (eviction, abuse); age 60+ (55+ Tribal); clinic services ended in some regions post-2025[2][3]
- **Washington Charity Care** — financial ([source](https://www.washingtonlawhelp.org/en/guide-charity-care (consumer guide); hospital policies via WA DOH hospital list or direct hospital contact))
  - Shape notes: Hospital-by-hospital policies with state-mandated floors (300%/350% FPL tiers); no central app/form—must contact care hospital; income-based tiers, asset test only on partial-discount tier; presumptive eligibility at 200% FPL
- **Aged, Blind, or Disabled (ABD) Cash Assistance Program** — financial ([source](https://www.dshs.wa.gov/esa/community-services-offices or WAC 388-400-0060 (https://www.law.cornell.edu/regulations/washington/WAC-388-400-0060).[1]))
  - Shape notes: State-funded interim cash to SSI applicants; fixed amounts by household size (individual/couple); repayment required until 2025; bundled with HEN referral; no TANF/SSI overlap.
- **WA Cares Fund** — financial ([source](https://esd.wa.gov/ (inferred from ESD references; specific WA Cares page not directly linked in results)[1].))
  - Shape notes: No income/asset tests; eligibility tied to payroll contributions and work hours over specific periods; exemptions can block benefits; partial vesting for older workers; statewide payroll-funded LTC insurance.

## Program Details

### Apple Health Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be Medicare-eligible (typically age 65+ or disabled). 2026 limits (monthly countable income after deductions):
- **QMB** (≤110% FPL): Single $1,463; Couple $1,984[4]
- **SLMB** (>110% to ≤120% FPL): Single $1,596; Couple $2,167[4]
- **QI-1** (≤135% FPL): Single $1,820; Couple $2,453[3][4]
Limits update annually in April based on FPL[1][5]. Vary by household size (primarily single/couple shown; larger households scale accordingly).
- Assets: As of January 1, 2023, no resource (asset) limits for QMB, SLMB, QI in Washington (eliminated statewide)[3]. Older sources list ~$7,860-$8,400 individual/$12,600 couple, but current policy supersedes[1][2].
- Must be enrolled in Medicare (Part A and/or B)
- U.S. citizen or qualified non-citizen
- Washington resident
- Cannot receive QI-1 or QDWI if eligible for other Medicaid (auto-enrolled if on Medicaid)[2][4]
- Income counted after deductions (e.g., standard disregard)

**Benefits:** - **QMB**: Pays Part A premium (if any), Part B premium, deductibles, coinsurance, copayments (except prescriptions), Part C copays[1][3][4]
- **SLMB**: Pays Part B premium only[1][3]
- **QI-1**: Pays Part B premium only (for non-Medicaid clients)[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Online: https://www.washingtonconnection.org/home/[1]
- Phone: Health Care Authority 1-800-562-3022 ext. 16129 (request mailed application)[1]; King County CHAP 1-800-756-5437[3]
- Local Community Services Office (CSO) in-person or mail[1]
- Contact local CSO for application

**Timeline:** Coverage starts first day of month after eligibility determination (e.g., approved April 15 starts May 1). No retroactive coverage for QMB[1][4]
**Waitlist:** QI-1 may have waitlist or funding limits (federal program); apply early[1]

**Watch out for:**
- No retroactive coverage for QMB (unlike other Medicaid)[1]
- Auto-enrollment if on other Medicaid; no separate QI/SLMB app needed[2]
- QI-1 limited funding/waitlist; not for Medicaid recipients[1][4]
- Income after deductions (people miss allowable disregards like $20 standard)[4]
- Must apply even if on SS/Medicare if income <$1,463 single for QMB[1]
- Limits update April annually; check current FPL[5]

**Data shape:** Tiered by income brackets (QMB/SLMB/QI-1) with escalating benefits; no asset test since 2023; household size scales limits (single/couple primary); federal FPL-based with state deductions

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.washingtonconnection.org/home/ (Apple Health portal); https://www.hca.wa.gov/ (Health Care Authority)

---

### Tailored Supports for Older Adults (TSOA)


**Eligibility:**
- Age: 55+
- Income: In 2025, applicant income limit is $3,868 per month. This limit applies individually and does not include spousal income unless both spouses apply separately (each up to $3,868/month). No spousal maintenance needs allowance.[1][3][4]
- Assets: Countable resources: $77,052 if single, $145,353-$149,581 if married (slight source variation). Exempt: primary home (if applicant lives there, intends to return, spouse or dependent relative lives there), car, personal items.[1][3][4]
- Washington State resident.
- Nursing Facility Level of Care (NFLOC) determined via CARE assessment tool (requires daily nursing or assistance with ADLs like bathing, eating, mobility).
- Live at home (not in residential/institutional setting).
- Have an eligible unpaid caregiver (age 18+), or meet criteria without one.
- U.S. citizen, national, qualifying American Indian, or qualified alien (met/exempt from 5-year bar).
- Valid Social Security number.
- Not enrolled in full Washington Apple Health (Medicaid) programs (limited enrollment ok).[2]

**Benefits:** Tailored in-home supports for unpaid family caregivers and care recipients (age 55+), including: housekeeping and errands, support groups and counseling, specialized medical equipment/supplies, respite care, training opportunities, adult day health/care, caregiving information and community resources.[6][7]
- Varies by: priority_tier

**How to apply:**
- Online: https://www.washingtonconnection.org/home/[3][4]
- In-person: Local DSHS office (https://www.dshs.wa.gov/office-locations)[3][4]
- Phone/mail: Contact local DSHS (specific numbers via office locator); DSHS assists with application.[3][4]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not for Medicaid enrollees (except limited Apple Health); separate from MAC (for Medicaid-eligible opting out).[2][3]
- No spousal income allowance (unlike COPES Waiver).[1]
- Requires NFLOC via CARE tool post-financial eligibility; unpaid caregiver usually needed.[1][2]
- Home exempt only under specific conditions (intent to return, spouse/dependent living there).[1]
- Income/assets counted individually; married couples assessed separately if both apply.[1]

**Data shape:** High asset limits distinguish from standard Medicaid ($2,000 single/$3,000 couple); services tailored post-assessment by need/priority; requires unpaid caregiver or specific no-caregiver criteria; statewide but local DSHS processing.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.law.cornell.edu/regulations/washington/WAC-182-513-1615 (WAC 182-513-1615); https://www.dshs.wa.gov/office-locations[2][4]

---

### Medicaid Personal Care (MPC)

> **NEW** — not currently in our data

**Eligibility:**
- Income: MPC uses noninstitutional categorically needy (CN) or alternative benefits plan (ABP) income standards. Specific dollar amounts are not provided in available sources, but MPC is generally available to low-income individuals. Income standards are set annually and may change in April each year.[1][5]
- Assets: In 2026, asset limit is $2,000 for a single applicant; $3,000 for married couples regardless of whether one or both spouses are applicants.[1] Exempt (non-countable) assets include: primary home (if applicant lives in it, has intent to return, or spouse/disabled child/minor child under 21 lives in it), household furnishings and appliances, personal effects, and one vehicle.[1]
- Must be a Washington State resident[1]
- Must be U.S. citizen, national, permanent resident, or legal alien[3]
- Must meet functional eligibility criteria (see 'gotchas' section for details)[1]
- Must be financially eligible for noninstitutional CN or ABP Washington Apple Health (Medicaid) program[5]

**Benefits:** Personal care assistance with Activities of Daily Living (ADLs) including personal hygiene, dressing, toileting, transferring, and mobility. Specific hours per week or dollar amounts are not specified in available sources.[1]
- Varies by: Individual functional need assessment

**How to apply:**
- Online: Washington Health Plan Finder (healthplanfinder.wa.gov) - referenced as primary application route[7]
- Phone: Contact one of five Managed Care Organizations (MCOs) that administer Medicaid in Washington. Example: Coordinated Care at 1-877-644-4613 (Press 2 for Member Services, then press 1 for Enrollment)[6]
- In-person: Through local MCO offices or county health departments

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- CRITICAL FUNCTIONAL REQUIREMENT: Unlike many Medicaid long-term care programs, MPC does NOT require Nursing Facility Level of Care (NFLOC). However, applicants MUST meet specific functional criteria: either (1) extensive assistance with ONE ADL, OR (2) minimal assistance/supervision with at least THREE ADLs. A dementia diagnosis alone does not qualify; cognitive impairment must result in documented need for assistance.[1]
- MPC is explicitly NOT available to persons who require NFLOC—those individuals must use other programs like Nursing Home Medicaid or CFCO (Community First Choice Option).[1][2]
- Home ownership is generally protected (exempt asset), but only if applicant lives in it, has intent to return, or specific family members live in it. This protection is not automatic.[1]
- Income standards change annually in April; families should verify current limits each year.[3][4]
- MPC services can be provided in home, adult family home (AFH), or licensed assisted living facility—not all settings may be available in all regions.[5]
- Cognitive impairment requires documented functional need; memory loss or difficulty making plans alone do not automatically qualify.[1]
- Asset limits are strict ($2,000 single/$3,000 couple); exceeding these limits by even small amounts can affect eligibility.[1]

**Data shape:** MPC is a state-plan benefit with no age requirement, making it unique among long-term care Medicaid programs. The program is defined by functional need (ADL assistance) rather than care setting or diagnosis. Eligibility is based on noninstitutional CN/ABP income standards that are not explicitly stated in available sources but change annually. The program explicitly excludes those needing NFLOC, creating a specific niche between community care and institutional care. Benefits are individualized based on CARE assessment rather than tiered or standardized.

**Source:** Washington State Department of Social and Health Services (DSHS); Washington Administrative Code § 182-513-1225; Washington Health Plan Finder

---

### New Freedom Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ or 18-64 if disabled; those enrolled before 65 can continue after turning 65+
- Income: Monthly income up to 300% of Federal Benefit Rate (FBR), which adjusts annually. In 2025: $2,901 per applicant regardless of marital status. Each spouse assessed individually if both applying (up to $2,901 each). No household size table specified.
- Assets: Home equity limit of $1,097,000 (2025) if applicant lives in home or intends to return (equity = home value minus mortgage; applicant's share only). Exemptions: spouse, disabled/blind child, or child under 21 living in home. Other assets not detailed in sources.
- Washington resident in Ferry, King, Pend Oreille, Pierce, Spokane, Stevens, or Whitman Counties
- At risk of nursing home placement (Nursing Facility Level of Care via CARE tool)
- Require daily nursing care or assistance with ADLs (e.g., transferring, mobility, eating, toileting, bathing, medication management)
- Enrolled in Washington Medicaid (Apple Health)

**Benefits:** Participant-directed services including personal assistance, environmental/vehicle modifications, individual-directed goods/services/supports, training/educational supports, treatment/health maintenance. Allows self-managed budget for hiring aides, purchasing items/services for independent living based on assessed needs/preferences. Specific services from waiver: respite, behavioral health stabilization (psychiatric, crisis diversion beds, positive behavior support), assistive technology, community engagement, environmental adaptations, nurse delegation, occupational/physical/speech/hearing/language therapy, peer mentoring, person-centered plan facilitation, skilled nursing, specialized clothing/medical equipment/supplies, staff/family consultation, supported parenting, transportation, vehicle modifications, wellness education.
- Varies by: priority_tier

**How to apply:**
- Contact Aging and Long-Term Support Administration (ALTSA) by phone or application
- No specific phone, URL, mail, or in-person details in sources; apply via ALTSA for this waiver

**Timeline:** Not specified
**Waitlist:** Not an entitlement; meeting eligibility does not guarantee immediate benefits (implied waitlist or slots limited)

**Watch out for:**
- Not an entitlement: eligibility does not guarantee enrollment due to limited slots
- County-restricted (only 7 counties; check residency)
- Income assessed per applicant, not household (spouses separate)
- Home equity limit applies only if intending to return; specific exemptions required
- Must be at risk of nursing home (NFLOC via CARE tool)
- Participant-directed but requires developing individual budget/spending plan

**Data shape:** County-restricted to 7 areas; participant-directed budget model; no household income table (per applicant); functional need via CARE tool; non-entitlement with implied waitlist

**Source:** https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83491 (CMS waiver approval); state details via ALTSA

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; must be Medicaid eligible or willing to private pay at Medicaid rate. Medicaid long-term care in WA follows CFC/COPES guidelines (income up to 300% FBR ~$2,901/month single in 2025, assets $2,000 excluding primary home; planning strategies available to qualify).[3][5]
- Assets: No asset limits for PACE enrollment; Medicaid eligibility requires $2,000 countable assets (exempt: primary home, one vehicle, personal belongings, burial funds up to limits).[3][5]
- Live in service area of a WA PACE provider (e.g., most of King County for Providence Elderplace)
- Certified by WA DSHS as needing nursing home level of care (assistance with 2+ ADLs like bathing, dressing, mobility)
- Able to live safely in community with PACE support at enrollment
- Medicare eligible or dually eligible preferred (90% participants); cannot be in Medicare Advantage, hospice, or certain other programs
- Willing to relocate to service area if needed

**Benefits:** All medically necessary Medicare/Medicaid services plus extras: primary/acute/specialty care, hospital/inpatient, prescription/OTC meds, medical supplies/equipment, therapies, dental/vision/hearing, home care, adult day health (typically 20-40 hours/week), respite, transportation, meals (home-delivered + center), social services, no copays/deductibles; interdisciplinary team coordinates everything to avoid nursing home.
- Varies by: region

**How to apply:**
- Phone: Contact local DSHS Home & Community Services office or Providence PACE at 206-320-5325 or 1-844-901-0094 (TTY: 1-800-735-2900)[5][7]
- In-person: Local DSHS Home & Community Services office for assessment[7]
- Provider directly: e.g., Providence Elderplace (providence.org/services/pace-and-adult-day-programs/elderplace-in-wa)[5]

**Timeline:** Assessment by DSHS social worker; enrollment after certification (timeline not specified, varies)
**Waitlist:** Possible due to capped financing and slots; check with provider[4]

**Watch out for:**
- Not statewide—must live in limited service area (e.g., King County) or relocate
- Nursing home level certification required by DSHS, not automatic
- Becomes sole Medicare/Medicaid service source—disenroll prior plans (no MA, hospice)
- Waitlists common due to slots; private pay option if not Medicaid-eligible but must match Medicaid rate
- Voluntary but can leave anytime; if on CFC/COPES, participation levels stay similar
- 90% dually eligible—private pay expensive long-term

**Data shape:** Limited to specific provider service areas (e.g., 1 main in King County); no direct income/asset test for PACE but tied to Medicaid/CFC-COPES financials; nursing home cert by DSHS social worker; slots capped with waitlists

**Source:** https://www.hca.wa.gov/free-or-low-cost-health-care/i-need-medical-dental-or-vision-care/pace-washington (WA HCA/DSHS); https://www.providence.org/services/pace-and-adult-day-programs/elderplace-in-wa

---

### Basic Food Program


**Eligibility:**
- Income: Household income must be at or below 200% of the Federal Poverty Level (FPL). As of April 1, 2025, the maximum monthly gross income limits are:[1][3] Family of 1: $2,510–$2,608; Family of 2: $3,407–$3,525; Family of 3: $4,303–$4,442; Family of 4: $5,200–$5,358; Family of 5: $6,097–$6,275; Family of 6: $6,993–$7,192; Family of 7: $7,890–$8,108; Family of 8: $8,787–$9,025. For each additional household member, add approximately $897–$917. Income is calculated as gross monthly income (before taxes or deductions).[2][3]
- Assets: Not specified in search results.
- U.S. citizenship or lawful residency status (includes U.S. citizens and lawfully admitted residents who meet the 5-year residency requirement).[1]
- Non-citizens may be eligible under specific federal program rules; undocumented immigrants, tourists, and other non-immigrants are not eligible.[3]
- If applicant is a non-citizen but has U.S. citizen children, the children may be eligible.[1]
- Must reside in Washington State.[1]
- Agreement to participate in Food Assistance work and training program (if applicable).[1]
- No age requirement; program serves families, individuals, seniors, people with disabilities, and youth.[2]
- No home ownership or employment status requirement.[2]

**Benefits:** Monthly electronic benefits (EBT card) to purchase food at participating grocery stores. Maximum monthly benefit allotments vary by household size:[1] 1 person: $292; 2 people: $536; 3 people: $768; 4 people: $975; 5 people: $1,158. Actual benefits vary based on household income and living expenses (rent/mortgage, utilities, child care, child support).[1]
- Varies by: household_size

**How to apply:**
- Online: www.washingtonconnection.org[2]
- Phone: 1-800-322-2588 (Help Me Grow Washington Hotline)[2]
- In-person: Local Community Services Office[2]
- Mail: Application form available (PDF with mailing instructions)[1]

**Timeline:** Not specified in search results.
**Waitlist:** Not specified in search results.

**Watch out for:**
- Submitting an application does not guarantee eligibility.[1]
- Income is calculated as gross monthly income (before taxes/deductions), not net income—this is a common point of confusion.[2][3]
- An interview is required after application submission; this is a mandatory step, not optional.[2]
- Non-citizens have restricted eligibility; undocumented immigrants cannot qualify, but their U.S. citizen children may be eligible separately.[1][3]
- The program requires agreement to participate in work and training programs if applicable—this is a condition of eligibility.[1]
- Benefits are not fixed; they vary based on both household size AND income AND documented living expenses, meaning two households of the same size may receive different amounts.[1]
- The program is called 'Basic Food' in Washington but is the federal SNAP (Supplemental Nutrition Assistance Program).[3]
- School children are automatically enrolled in free school meal programs as a separate benefit.[3]

**Data shape:** Benefits scale by household size and income; income limits are set at 200% of Federal Poverty Level and updated annually (most recent data from April 1, 2025). Maximum benefit allotments are provided for households up to 5 people, with indication that larger households exist but specific amounts not detailed in search results. Program is statewide with no county-level restrictions mentioned. No waitlist or processing time data available in search results. Asset limits not specified. Application routes are multiple (online, phone, mail, in-person) but no indication of which is fastest or preferred.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://kingcounty.gov/en/dept/dph/health-safety/health-centers-programs-services/access-outreach-program/basic-food-program and https://www.washingtonconnection.org

---

### Housing and Essential Needs (HEN) Referral Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Countable income at or below monthly income limits in WAC 388-478-0090 (specific dollar amounts not listed in sources; determined by DSHS per chapter 388-450 WAC for assistance unit size). Low income required, assessed via financial need rules in chapter 388-450 WAC and resources in RCW 74.04.005 and chapter 388-470 WAC[1][2].
- Assets: Subject to resource requirements in RCW 74.04.005 and chapter 388-470 WAC (specific counts/exemptions not detailed in sources; DSHS determines)[1].
- Apply for cash assistance (WAC 388-406-0010) and complete DSHS interview[1]
- Incapacitated (unable to work, per WAC 388-447-0001 through 388-447-0100; at least 90 days due to physical/mental incapacity)[1][2][3]
- Financial need per income/resource rules[1]
- US citizenship or qualified alien status (WAC 388-424-0015)[1]
- Valid SSN (WAC 388-476-0005)[1]
- Washington residency (WAC 388-468-0005)[1]
- Verification of eligibility factors (WAC 388-490-0005)[1]
- Not in public correctional facility[1]
- Homeless or at risk of homelessness/housing instability (self-attestation possible)[2][3][4]
- Not receiving TANF or SSI (per some providers, though ABD cash recipients now eligible per recent law change)[2][4]
- Valid DSHS referral required; final eligibility for services by local HEN provider[1][2][3][5]

**Benefits:** Rental assistance, utility assistance (if homeless/at risk), essential needs items (e.g., hygiene bags, personal hygiene items), transportation assistance (e.g., bus passes); hygiene bags and rapid rehousing as long as DSHS eligible (up to 12 months time limit); specific $ amounts/hours not fixed, varies by provider/funding[3][4][5][6][8].
- Varies by: priority_tier|region

**How to apply:**
- Apply for cash assistance/referral via DSHS: online at www.washingtonconnection.org, nearest DSHS Community Services Office, request HEN evaluation[2]
- Phone: DSHS general line 1-877-501-2233 (for ABD/HEN questions)[4]; King County HEN Resource Line 206-328-5755 (Mon-Fri 9am-2:30pm)[8]
- After DSHS referral, contact local county HEN provider for intake (list by county available via DSHS)[2][4]
- No specific mail/in-person beyond DSHS offices/providers noted

**Timeline:** Not specified; referrals expire if not acted on, DSHS screening then provider intake[2]
**Waitlist:** Yes, e.g., long waitlist in King County for rent/utility assistance; not all qualifiers receive due to limited funds; interest lists used[6][8]

**Watch out for:**
- Two-step process: DSHS approves referral, but local provider determines final service eligibility/funding[1][3]
- 12-month time limit even if incapacity continues; DSHS may cut off after 1 year[6]
- Limited funds/not entitlement: waitlists common (e.g., King County), not all eligible get services[6][8]
- ABD recipients now eligible (recent law change), but cannot be in correctional facility[1][4]
- Referrals expire; must stay in contact and report changes[1][2]
- Incapacity must be temporary/permanent, verified by DSHS health screening[1][2]
- Prioritizes rent/utility from waitlists as funding allows; essentials/transport more available[8]

**Data shape:** referral-only (DSHS first, then county provider); varies heavily by county provider/funding; 12-month cap; no fixed $ benefits, case-by-case with waitlists

**Source:** https://www.law.cornell.edu/regulations/washington/WAC-388-400-0070 (primary reg); www.washingtonconnection.org (DSHS apply)

---

### Washington Energy Assistance Program (WEAP)


**Eligibility:**
- Income: Household gross monthly income at or below 150% of the federal poverty level (FPL). Specific limits: 1 person $1,956; 2 people $2,644; 3 people $3,331; 4 people $4,018; 5 people $4,707; 6 people $5,394. Limits may vary slightly by local provider; exact eligibility determined by local LIHEAP provider using current guidelines PDF.[1][4][5]
- Assets: No asset limits mentioned in program guidelines.[1]
- Reside in Washington state
- Household has not received a LIHEAP grant in the current program year (October-September)
- Heating costs (regardless of fuel type: electric, gas, propane, oil, coal, wood)
- Eligibility determined by local provider; no specific age requirement, but prioritizes vulnerable households including elderly

**Benefits:** One-time grant for utility bills (heating max $1,250, min $250); crisis assistance up to $10,000 for emergencies like shutoffs or broken heaters; repair/replace unsafe heating/cooling units; energy efficiency improvements via Weatherization Program.[1][4]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Contact local LIHEAP provider for appointment (find via https://www.commerce.wa.gov/community-opportunities/liheap/ or provider-specific sites)
- Phone varies by provider/region (e.g., Rural Resources for specific counties, Opportunity Council at local numbers)
- In-person appointment with local community action agency or partner
- No statewide online or mail application; must go through local provider

**Timeline:** Not specified; varies by local provider
**Waitlist:** Possible during high-demand periods, especially winter; funding limited per program year[2]

**Watch out for:**
- One grant per household per program year (Oct-Sep); cannot reapply until next year[1][9]
- Must contact local provider for exact eligibility/docs; state site is guide only[1]
- No direct statewide application; delays if wrong provider contacted[2]
- Renters with included utilities may have limited eligibility or need extra criteria[4]
- Funding limited; apply early in season (e.g., 2025-2026 season started)[2]

**Data shape:** Administered locally via county providers with uniform 150% FPL income test but varying docs/processing; one-time per year; includes crisis/weatherization components; no age/assets test

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.commerce.wa.gov/community-opportunities/liheap/

---

### Health Insurance Counseling and Advocacy Program (HICAP/SHIP)


**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[3][7]
- Assets: No asset limits or tests apply[3][7]
- Washington state resident
- Primarily serves Medicare beneficiaries (enrolled in Medicare Parts A and/or B), but assists with related health insurance issues; no citizenship requirement specified for counseling services[3][4]

**Benefits:** Free, one-on-one counseling, education, and assistance on Medicare (Parts A, B, C, D), Medigap supplements, prescription drug plans, Medicare Savings Programs, Extra Help/Low-Income Subsidy, appeals, billing issues, fraud prevention, and coordination with other insurance; group outreach, presentations, and enrollment events; no dollar amounts, hours, or fixed limits specified[3][4][6][7]

**How to apply:**
- Phone: 1-800-562-6900 (Statewide Health Insurance Benefits Advisors - SHIBA)
- TTY: 1-360-586-0241
- Website: https://www.insurance.wa.gov (Washington state Office of the Insurance Commissioner SHIBA page, inferred from context)
- In-person or local events through partnerships with area agencies on aging and community organizations (locations vary by region)

**Timeline:** Immediate phone counseling available; no formal application processing as services are provided directly upon contact[3][4]

**Watch out for:**
- Not an insurance plan or financial aid program—provides counseling only, does not pay premiums or provide healthcare; free and unbiased (no sales commissions), unlike agents; often confused with WSHIP (high-risk pool) or Apple Health (Medicaid); best for education/appeals, not personalized plan sales[1][3][7]
- Services rely on trained volunteers/staff, so availability may depend on call volume or local events[3][6]

**Data shape:** no income/asset test; counseling-only service, not benefits/entitlements; volunteer/staff delivered via statewide hotline and local partners; part of national SHIP network focused on Medicare navigation[3][4][7]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.insurance.wa.gov/about-us/office-insurance-commissioner-shiba (primary Washington SHIBA page, based on program context[4])

---

### Home Delivered Meals (via Aging & Disability Resources)


**Eligibility:**
- Age: 60+
- Income: Below 185% of the Federal Poverty Level (FPL) for most Area Agency on Aging programs; exact dollar amounts vary annually and by household size (e.g., for 2025, 185% FPL is approximately $28,140 for 1 person, $38,036 for 2; check current HHS guidelines). Some programs like Sound Generations have no strict income test but suggested donations. Medicaid/Medicare Advantage or post-discharge may have separate rules without income limits.
- Assets: No asset limits mentioned in sources.
- Washington State resident
- Homebound or limited mobility/unable to shop/cook for self
- 55+ if American Indian/Alaska Native in some programs
- Referral from case manager for Medicaid/Mom's Meals
- King County residency for Sound Generations

**Benefits:** Nutritionally balanced meals (hot, pre-packaged, or box meals) delivered to home; frequency varies: daily, weekly, semi-weekly, or twice monthly. Examples: 1 meal per day (Sound Generations), 2 meals/day for 14 days post-discharge (CHPW MA). Suggested donation $6.50/meal (Sound Generations) or free via Medicaid/referral.
- Varies by: priority_tier|region

**How to apply:**
- Phone: Regional providers e.g., 360-533-5100 (O3A/Coastal Community Action)
- Online: Sound Generations application (specific URL not listed; submit online or mail)
- Contact case manager/health plan for Medicaid/Mom's Meals
- In-person/mail via local Area Agency on Aging

**Timeline:** Not specified in sources.
**Waitlist:** Possible regional waitlists due to funding/provider capacity; not explicitly detailed.

**Watch out for:**
- Not fully statewide—must contact local Area Agency on Aging; often requires homebound status, not just age/income; Medicaid/free meals need case manager referral; suggested donations common even if 'free'; post-discharge benefits temporary (e.g., 14 days); providers handle background checks/insurance, delaying access.

**Data shape:** Administered regionally via Area Agencies on Aging with Older Americans Act funding; eligibility combines age, income (<185% FPL), homebound status; varies by county/provider; no uniform statewide application or asset test.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.o3a.org/programs/nutrition-transportation/senior-nutrition-programs/

---

### Family Caregiver Support Program


**Eligibility:**
- Income: No specific income limits for a dedicated 'Family Caregiver Support Program' in Washington state; related programs like Medicaid Personal Care (MPC) have limits: $994/month for single applicant, $1,491/month for married couples (2026 figures, equivalent to 100% Federal Benefit Rate). MPC targets seniors 65+.[2][3]
- Assets: MPC: $2,000 countable assets for singles (slightly higher for couples). Home exempt if applicant lives there, intends to return, spouse/disabled child/minor child lives there.[2][3]
- For MPC (primary avenue for paid family caregiving): Care recipient 65+ or Medicaid LTSS eligible, needs assistance with ADLs (extensive help with 1 ADL or minimal/supervision with 3+ ADLs via CARE assessment; no NFLOC required).[2][3]
- Caregiver: 18+, background check, not spouse (but other relatives like adult child, parent, sibling, extended family eligible). Must join Consumer Direct Care Network Washington (CDWA) as Individual Provider.[3][4]
- VA Program of Comprehensive Assistance for Family Caregivers (if Veteran): Caregiver 18+, family relation or lives full-time with Veteran; Veteran: 70%+ VA disability, honorable discharge, needs 6+ months in-person care, enrolled in VA health care.[1]

**Benefits:** Paid caregiving via Medicaid Personal Care (MPC) or Community First Choice: Hours based on CARE assessment for ADLs (personal hygiene, dressing, toileting, transferring, mobility); family caregivers paid as Individual Providers through CDWA (rates not specified in sources). Training: 5 hours orientation/safety + 30 hours basic. VA: Stipends, respite, mental health, travel, health insurance.[1][2][3][4]
- Varies by: priority_tier

**How to apply:**
- For MPC/paid family care: Apply for Apple Health (Medicaid) LTSS via Washington Connection portal or local DSHS Home & Community Services office; then caregiver applies to CDWA portal.[4]
- VA: Online at va.gov, phone 1-855-260-3274, or mail VA Form 10-10CG to 10-10CG Evidence Intake Center, PO Box 5154, Janesville, WI 53547-5154.[1]

**Timeline:** Not specified; VA and Medicaid processes vary (MPC via case manager after Medicaid approval).[1][3]
**Waitlist:** Not mentioned in sources; may depend on regional DSHS offices.[4]

**Watch out for:**
- Not a standalone program; routes through Medicaid MPC/LTSS or VA (Veterans only). Spouses ineligible as paid caregivers in MPC.[3][4]
- Must qualify for Medicaid LTSS first; no NFLOC needed for MPC but ADL help required via CARE tool.[2]
- Background check mandatory; training required (35+ hours).[4]
- MPC doesn't cover room/board in assisted living.[3]

**Data shape:** Tied to Medicaid LTSS/MPC (income/asset tested, ADL-based); statewide via CDWA for paid family caregivers (excludes spouses); separate VA track for Veterans; no fixed hours/dollars, assessment-driven.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dshs.wa.gov (DSHS Apple Health LTSS; no single page for exact 'Family Caregiver Support Program'; closest is MPC via Washington Connection: https://www.washingtonconnection.org)

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set by federal guidelines (e.g., for 2026, consult current HHS Poverty Guidelines; not specified in sources for WA-specific table).
- Unemployed
- U.S. citizen or authorized to work
- Priority to veterans/qualified spouses, individuals over 65, those with disabilities, low literacy/limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users

**Benefits:** Part-time community service work (average 20 hours/week) at non-profit/public agencies (e.g., schools, hospitals, senior centers, day-care); paid at highest of federal/state/local minimum wage; on-the-job training in skills like computer/vocational; job placement assistance to unsubsidized employment; supportive services (e.g., transportation, food/housing assistance via some grantees).
- Varies by: priority_tier

**How to apply:**
- Phone: Snohomish County area - (425) 366-4457 (AARP Foundation SCSEP, 3216 Wetmore #203, Everett WA 98201)
- In-person: NAPCA Seattle office at 1511 Third Avenue, Suite 914, Seattle, WA 98101
- Contact local grantees: AARP Foundation (Snohomish), NAPCA (Seattle), or other WA SCSEP providers via DOL locator
- Employment assistance via American Job Centers

**Waitlist:** Likely due to funding limits and enrollment caps; varies by grantee and region (not specified)

**Watch out for:**
- Grantee-specific (not centralized state agency); must contact local provider (e.g., AARP or NAPCA in WA)
- Priority tiers may delay non-priority applicants
- Temporary training (bridge to unsubsidized work); not guaranteed permanent job or ongoing wage subsidy
- Income test is strict at 125% FPL; excludes most assets but verify with grantee
- Funding via DOL grants to nonprofits/state agencies; slots limited by grant allocations

**Data shape:** Grantee-administered with regional providers (e.g., AARP Foundation, NAPCA); priority enrollment tiers; no WA statewide centralized application; income at 125% FPL without asset test specified

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### Legal Aid for Seniors (via Protection & Advocacy)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Targeted to low-income seniors; specific dollar amounts or household size tables not detailed in sources. Services funded by state/federal programs like Older Americans Act for those facing social/economic challenges[2][3].
- Assets: No asset limits mentioned in sources.
- Low-income status
- Washington resident
- Focus on issues like abuse, neglect, housing, benefits denial, healthcare, utilities[2][3]
- Tribal Elders may qualify at age 55+[3]

**Benefits:** Counseling, advocacy, and/or representation in financial assistance, health care, housing, protective services; legal assistance for housing, benefits denial, healthcare, abuse/neglect, utilities; no specific dollar amounts or hours stated[2][3].
- Varies by: priority_tier

**How to apply:**
- Phone: CLEAR (for low-income seniors) 1-888-387-7111 (call 9:15am-12:15pm)[2][3]
- Phone: NJP general 1-888-201-1012[3]
- Phone: Eviction hotline 1-855-657-8387[3]
- Phone: Foreclosure hotline 1-800-606-4819[3]
- Phone: Sound Generations Senior Rights Assistance 206-448-5720 or 1-888-435-3377 (for estate planning, POA, etc.)[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not a single centralized program; delivered via NJP/CLEAR and regional partners—call specific hotline for issue[2][3]
- O3A Senior Legal Advice Clinics (SLAC) ended June 30, 2025; shifted to NJP[3]
- Priority for low-income, those facing eviction/foreclosure/abuse; not general estate planning (use WA Law Help or State Bar)[3][5]
- Tribal Elders qualify at 55+, others 60+[3]
- Free services but may involve intake screening for eligibility[2]

**Data shape:** Decentralized statewide via NJP/CLEAR with regional contractors; no strict income/asset tables published; priority-based on need (eviction, abuse); age 60+ (55+ Tribal); clinic services ended in some regions post-2025[2][3]

**Source:** https://nwjustice.org (Northwest Justice Project, primary provider)[8]

---

### Washington Charity Care

> **NEW** — not currently in our data

**Eligibility:**
- Income: Statewide minimum: Free care (100% discount) for income ≤300% of Federal Poverty Level (FPL), adjusted for family/household size; 75-80% discount for 301-350% FPL (varies slightly by hospital). Some hospitals extend up to 400% FPL. Exact FPL dollar amounts vary annually and by household size (e.g., consult current HHS FPL guidelines; hospitals provide charts). No statewide dollar table in law—hospitals must screen presumptively at 200% FPL and fully assess up to their policy limits.[1][3][5]
- Assets: For 301-350% FPL tier only (Group 1 hospitals): Assets may reduce discount if 'unreasonable' burden; counts: equity in primary residence, retirement plans (except 401(k)), prepaid burial contracts/plots. Exempt: one motor vehicle (plus second if needed for work/medical), life insurance ≤$10,000 face value. ≤300% FPL: No asset test.[1][3]
- Medically necessary hospital services (inpatient, ER; may exclude non-hospital staff like independent radiologists/anesthesiologists)
- No citizenship requirement
- Must apply to hospital where care received
- Not required to apply for other programs if obviously/categorically ineligible or denied in prior 12 months

**Benefits:** 100% discount on patient-responsible portion of hospital charges for ≤300% FPL; 75-80% discount for 301-350% FPL (hospital-specific); covers deductibles/co-pays even if insured; limited to medically necessary acute/psychiatric hospital services.[1][3][5]
- Varies by: income_tier

**How to apply:**
- Contact specific hospital's financial assistance/charity care office (no central statewide phone/website)
- In-person: During hospital admission/discharge
- Phone/mail/online: Varies by hospital (e.g., Overlake: application process via financial services; Kaiser: 1-888-901-4636)
- No deadline to apply—retroactive possible

**Timeline:** Initial determination on verbal/written app; full review after docs (e.g., 60 days for additional docs at some hospitals); high medical cost patients re-evaluated monthly, valid retro to 12 months.[2][3]

**Watch out for:**
- Program is hospital-specific—not statewide single app; excludes non-hospital-employed providers (e.g., ER radiologists); must request app (hospitals notify but families should ask); assets only tested above 300% FPL; insured patients still qualify for deductibles/co-pays; no coverage for outpatient clinics or non-medically necessary care.[1][3][5]

**Data shape:** Hospital-by-hospital policies with state-mandated floors (300%/350% FPL tiers); no central app/form—must contact care hospital; income-based tiers, asset test only on partial-discount tier; presumptive eligibility at 200% FPL

**Source:** https://www.washingtonlawhelp.org/en/guide-charity-care (consumer guide); hospital policies via WA DOH hospital list or direct hospital contact

---

### Aged, Blind, or Disabled (ABD) Cash Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Specific dollar amounts not detailed in current sources; older reference mentions below $339/month for some disability cases. Must meet ABD cash income and resource limits per WAC 388-400-0060 and be in financial need. Varies by household: up to $450/month for individuals, $570/month for couples (these are benefit levels tied to eligibility). Not eligible if receiving TANF (higher benefit) or federal SSI.[1][2][3][5]
- Assets: Must meet state resource limits (specific amounts not provided in sources); similar to SSI with limits on cash, bank accounts, and property. Exact countable vs. exempt items follow WAC rules, not detailed here.[1][2]
- Blind as defined by SSA, or likely disabled per WAC 388-449-0001-0100 (physical/mental disability preventing work for 12+ months, not primarily substance abuse).
- At least 18 years old (or under 18 if married couple member).
- Washington resident.
- U.S. citizen or qualified immigrant.
- Provide Social Security number.
- Sign interim assistance reimbursement authorization (repay ABD if SSI approved; required until Oct 2025).[1][3][4]
- Not in public correctional facility; may qualify in some public institutions.
- Report changes in circumstances.
- Cooperate with SSI application process (facilitator assigned).[1][3]

**Benefits:** $450/month for individuals, $570/month for couples (state-funded cash stipend); automatic referral to Housing and Essential Needs (HEN) program for additional supports like housing assistance (especially if homeless/at risk).[1][2][3]
- Varies by: household_size

**How to apply:**
- Online: Washington Connection eligibility tool (washingtonconnection.org).
- Phone/mail/in-person: Contact local DSHS Community Service Office (CSO) or facilitator; for HEN referral post-approval, call CCS HEN Resource Line 206-328-5755.
- DSHS handles applications statewide.[3]

**Timeline:** Not specified; SSI bridge averages 7 months, ABD acts as interim.[4]

**Watch out for:**
- Must sign repayment agreement for ABD benefits if SSI approved (continues until Oct 2025).[4]
- Ineligible if receiving TANF (higher benefit) or SSI; apply for TANF first if possible.[3]
- ABD is interim/bridge to SSI; facilitator helps apply, but SSI process takes ~7 months.[2][3][4]
- Disability must not be primarily substance abuse-related; medical verification required.[1][3]
- No eligibility if in correctional facility.[1]

**Data shape:** State-funded interim cash to SSI applicants; fixed amounts by household size (individual/couple); repayment required until 2025; bundled with HEN referral; no TANF/SSI overlap.

**Source:** https://www.dshs.wa.gov/esa/community-services-offices or WAC 388-400-0060 (https://www.law.cornell.edu/regulations/washington/WAC-388-400-0060).[1]

---

### WA Cares Fund

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No income limits; program funded by mandatory payroll premiums ($0.58 per $100 of earnings) with exemptions available[1][4].
- Assets: No asset limits or tests mentioned; eligibility based on contributions and qualifying health needs[2].
- Reside in Washington state or have elected to keep coverage if relocated out-of-state[1].
- Worked at least 500 hours per year in Washington for qualifying periods[1][2][3].
- Contribution history: 10 years total (no more than 5 consecutive years break) for lifetime access; OR 3 of last 6 years for early access; OR for those born before Jan 1, 1968, partial benefits (10% per year worked)[1][3].
- Qualifying long-term care health needs (specific needs not detailed in sources)[2].
- Not holding a permanent exemption (e.g., veteran with 70%+ service-connected disability); conditional exemptions (e.g., out-of-state resident, military spouse, nonimmigrant visa) pause contributions but allow future eligibility if rescinded[1][3][4].

**Benefits:** Full benefit amount available upon vesting (exact dollar amount, hours, or service details not specified in sources; provides long-term care insurance benefits starting Jan 1, 2025)[1][3][4]; partial for near-retirees (10% of full per year worked if born before 1968)[3].
- Varies by: contribution_history

**How to apply:**
- Contact Employment Security Department (ESD) for benefits application (specific phone/website not in sources; exemptions via ESD webpage)[1].
- Exemptions: Apply through ESD (details at ESD’s Exemptions webpage)[1][3].

**Timeline:** Not specified in sources.

**Watch out for:**
- Permanent exemptions (e.g., 70%+ veteran disability) make you ineligible for benefits unless rescinded[1].
- Conditional exemptions pause contributions; must notify ESD/employer within 90 days if status changes[3].
- Must work 500 hours/year for contribution years to count[1][2][3].
- Breaks over 5 consecutive years reset 10-year vesting clock[2][3].
- Benefits start Jan 1, 2025; near-retirees (born pre-1968) get only partial benefits[3][4].
- Requires qualifying health needs, not automatic upon vesting[2].

**Data shape:** No income/asset tests; eligibility tied to payroll contributions and work hours over specific periods; exemptions can block benefits; partial vesting for older workers; statewide payroll-funded LTC insurance.

**Source:** https://esd.wa.gov/ (inferred from ESD references; specific WA Cares page not directly linked in results)[1].

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Apple Health Medicare Savings Programs ( | benefit | federal | deep |
| Tailored Supports for Older Adults (TSOA | benefit | state | deep |
| Medicaid Personal Care (MPC) | benefit | state | deep |
| New Freedom Waiver | benefit | local | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Basic Food Program | benefit | state | deep |
| Housing and Essential Needs (HEN) Referr | benefit | state | medium |
| Washington Energy Assistance Program (WE | benefit | state | deep |
| Health Insurance Counseling and Advocacy | resource | federal | simple |
| Home Delivered Meals (via Aging & Disabi | navigator | local | simple |
| Family Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors (via Protection &  | resource | state | simple |
| Washington Charity Care | benefit | state | deep |
| Aged, Blind, or Disabled (ABD) Cash Assi | benefit | state | deep |
| WA Cares Fund | benefit | state | medium |

**Types:** {"benefit":12,"resource":2,"navigator":1,"employment":1}
**Scopes:** {"federal":3,"state":10,"local":3}
**Complexity:** {"deep":11,"medium":2,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/WA/drafts.json`.

- **Apple Health Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Tailored Supports for Older Adults (TSOA)** (benefit) — 3 content sections, 6 FAQs
- **Medicaid Personal Care (MPC)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **Individual functional need assessment**: 1 programs
- **region**: 1 programs
- **household_size**: 2 programs
- **priority_tier|region**: 2 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable**: 1 programs
- **income_tier**: 1 programs
- **contribution_history**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Apple Health Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI-1) with escalating benefits; no asset test since 2023; household size scales limits (single/couple primary); federal FPL-based with state deductions
- **Tailored Supports for Older Adults (TSOA)**: High asset limits distinguish from standard Medicaid ($2,000 single/$3,000 couple); services tailored post-assessment by need/priority; requires unpaid caregiver or specific no-caregiver criteria; statewide but local DSHS processing.
- **Medicaid Personal Care (MPC)**: MPC is a state-plan benefit with no age requirement, making it unique among long-term care Medicaid programs. The program is defined by functional need (ADL assistance) rather than care setting or diagnosis. Eligibility is based on noninstitutional CN/ABP income standards that are not explicitly stated in available sources but change annually. The program explicitly excludes those needing NFLOC, creating a specific niche between community care and institutional care. Benefits are individualized based on CARE assessment rather than tiered or standardized.
- **New Freedom Waiver**: County-restricted to 7 areas; participant-directed budget model; no household income table (per applicant); functional need via CARE tool; non-entitlement with implied waitlist
- **Program of All-Inclusive Care for the Elderly (PACE)**: Limited to specific provider service areas (e.g., 1 main in King County); no direct income/asset test for PACE but tied to Medicaid/CFC-COPES financials; nursing home cert by DSHS social worker; slots capped with waitlists
- **Basic Food Program**: Benefits scale by household size and income; income limits are set at 200% of Federal Poverty Level and updated annually (most recent data from April 1, 2025). Maximum benefit allotments are provided for households up to 5 people, with indication that larger households exist but specific amounts not detailed in search results. Program is statewide with no county-level restrictions mentioned. No waitlist or processing time data available in search results. Asset limits not specified. Application routes are multiple (online, phone, mail, in-person) but no indication of which is fastest or preferred.
- **Housing and Essential Needs (HEN) Referral Program**: referral-only (DSHS first, then county provider); varies heavily by county provider/funding; 12-month cap; no fixed $ benefits, case-by-case with waitlists
- **Washington Energy Assistance Program (WEAP)**: Administered locally via county providers with uniform 150% FPL income test but varying docs/processing; one-time per year; includes crisis/weatherization components; no age/assets test
- **Health Insurance Counseling and Advocacy Program (HICAP/SHIP)**: no income/asset test; counseling-only service, not benefits/entitlements; volunteer/staff delivered via statewide hotline and local partners; part of national SHIP network focused on Medicare navigation[3][4][7]
- **Home Delivered Meals (via Aging & Disability Resources)**: Administered regionally via Area Agencies on Aging with Older Americans Act funding; eligibility combines age, income (<185% FPL), homebound status; varies by county/provider; no uniform statewide application or asset test.
- **Family Caregiver Support Program**: Tied to Medicaid LTSS/MPC (income/asset tested, ADL-based); statewide via CDWA for paid family caregivers (excludes spouses); separate VA track for Veterans; no fixed hours/dollars, assessment-driven.
- **Senior Community Service Employment Program (SCSEP)**: Grantee-administered with regional providers (e.g., AARP Foundation, NAPCA); priority enrollment tiers; no WA statewide centralized application; income at 125% FPL without asset test specified
- **Legal Aid for Seniors (via Protection & Advocacy)**: Decentralized statewide via NJP/CLEAR with regional contractors; no strict income/asset tables published; priority-based on need (eviction, abuse); age 60+ (55+ Tribal); clinic services ended in some regions post-2025[2][3]
- **Washington Charity Care**: Hospital-by-hospital policies with state-mandated floors (300%/350% FPL tiers); no central app/form—must contact care hospital; income-based tiers, asset test only on partial-discount tier; presumptive eligibility at 200% FPL
- **Aged, Blind, or Disabled (ABD) Cash Assistance Program**: State-funded interim cash to SSI applicants; fixed amounts by household size (individual/couple); repayment required until 2025; bundled with HEN referral; no TANF/SSI overlap.
- **WA Cares Fund**: No income/asset tests; eligibility tied to payroll contributions and work hours over specific periods; exemptions can block benefits; partial vesting for older workers; statewide payroll-funded LTC insurance.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Washington?
