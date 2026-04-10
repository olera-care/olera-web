# Delaware Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 7.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 8 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 3 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 5 programs
- **financial**: 3 programs
- **in_kind**: 1 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Diamond State Health Plan (DSHP and DSHP-Plus)

- **income_limit**: Ours says `$2485` → Source says `$2,485` ([source](https://dhss.delaware.gov/dmma/medicaid.html))
- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Comprehensive Medicaid managed care: doctor visits, hospital care (inpatient/outpatient), labs, prescription drugs, transportation, mental health/substance use treatment (outpatient/inpatient), home health, hospice, ambulance, allergy/HIV/hearing exams, hearing aids (1 per ear every 2 years for 21+), GED testing voucher (18+), healthy weight program, rewards gift cards. For DSHP-Plus/LTCCS: long-term Home and Community Based Services (HCBS) for those meeting NFLOC[3][7][9].` ([source](https://dhss.delaware.gov/dmma/medicaid.html))
- **source_url**: Ours says `MISSING` → Source says `https://dhss.delaware.gov/dmma/medicaid.html`

### Food Stamp Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://dhss.delaware.gov/dss/))
- **income_limit**: Ours says `$2081` → Source says `$2608,` ([source](https://dhss.delaware.gov/dss/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits loaded on EBT card for groceries at authorized stores. Maximum ~$291 for 1-person household, ~$535 for 2-person. Actual amount based on net income, household size, deductions (e.g., higher medical >$35/month, shelter for elderly). Minimums and maximums apply; ~$100 more net income = $30 less benefits.[1][2]` ([source](https://dhss.delaware.gov/dss/))
- **source_url**: Ours says `MISSING` → Source says `https://dhss.delaware.gov/dss/`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2820` → Source says `$3,278` ([source](https://www.dhss.delaware.gov/dhss/dss/liheap.html))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating: $100 minimum to $2,561 maximum; Cooling: $1 minimum to $1,000 maximum; Crisis: up to $10,000. Average grant ~$553/year. Paid as supplemental grant to household or vendor for energy bills, crisis (e.g., shut-off), weatherization/repairs[1][4][5].` ([source](https://www.dhss.delaware.gov/dhss/dss/liheap.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhss.delaware.gov/dhss/dss/liheap.html`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy services including investigating and resolving complaints made by or on behalf of residents (except abuse/neglect/mistreatment/financial exploitation which are referred elsewhere); informing residents of rights under federal and state law; assisting in protecting rights; providing information about the program; periodic site visits and annual facility assessments to ensure care standards[2][4][5][6]` ([source](https://dhss.delaware.gov/dsaapd (Division of Services for Aging and Adults with Physical Disabilities)))
- **source_url**: Ours says `MISSING` → Source says `https://dhss.delaware.gov/dsaapd (Division of Services for Aging and Adults with Physical Disabilities)`

## New Programs (Not in Our Data)

- **Division of Services for Aging and Adults with Physical Disabilities (DSAAPD) Waivers** — service ([source](www.dhss.delaware.gov/dsaapd))
  - Shape notes: Multiple DSAAPD-administered waivers (Elderly & Disabled, Assisted Living); eligibility tied to Medicaid with functional impairment; statewide but location-specific providers; no exact current income tables in sources
- **Program of All-Inclusive Care for the Elderly (PACE) - Delaware PACE** — service ([source](https://www.law.cornell.edu/regulations/delaware/16-Del-Admin-Code-SS-20000-20775 (Delaware Administrative Code); https://www.medicaid.gov/medicaid/spa/downloads/DE-21-0007.pdf (Delaware State Plan Amendment)))
  - Shape notes: Delaware PACE is geographically restricted to specific service areas served by individual PACE organizations (PACE Your LIFE, Saint Francis LIFE, and potentially others). There are no income or asset limits for PACE eligibility itself, but Medicaid coverage (which funds most participants) has income and asset limits. Benefits are comprehensive and all-inclusive with no variation by tier or household size. The program requires exclusive enrollment and cannot be combined with Medicare Advantage or other managed care plans. Processing timelines and waitlist status are not publicly specified and vary by provider.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB)** — financial ([source](https://regulations.delaware.gov/board/division-of-medicaid-and-medical-assistance))
  - Shape notes: No asset test (full resource exclusion unique to Delaware implementation); income strictly federal poverty-based with spouse deeming; benefits strictly Medicare premium/cost-sharing (no services); two tiers (QMB ≤100% FPL, SLMB 100-120% FPL).
- **Weatherization Assistance Program (WAP)** — in_kind ([source](https://dnrec.delaware.gov/climate-coastal-energy/sustainable-communities/weatherization/))
  - Shape notes: Benefits scale by household size through income eligibility thresholds rather than varying service levels. Waiting list prioritization is need-based rather than first-come-first-served. Program is statewide but administered through multiple local agencies, which may affect processing times and accessibility. Key distinction: this is a federal DOE program with strict income limits (200% poverty level), not a needs-based program. Elderly family members do not receive priority based on age alone, but age is one factor in waiting list prioritization. Services are determined by home energy audit results, not by household tier or priority level.
- **Delaware Senior Medicare Patrol (SMP/SHIP)** — service|advocacy ([source](https://dhss.delaware.gov/dsaapd (Delaware SMP/SHIP); https://smpresource.org/smp-locator/ (national locator for Delaware contact)[5][9]))
  - Shape notes: no income/asset test; open to all Medicare beneficiaries/families; service-based (counseling/education) not financial; volunteer-driven with statewide coverage via single state grantee
- **Home Delivered Meals (Meals on Wheels)** — service ([source](https://dhss.delaware.gov/wp-content/uploads/sites/2/dsaapd/pdf/home_delivered_meals2.pdf))
  - Shape notes: Administered statewide via Title III-C but delivered by regional providers with local contacts; no income/asset tests, focuses on homebound status; varies by local delivery zone and provider.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://laborfiles.delaware.gov/main/det/faqs-scsep/SCSEP_FAQs.pdf))
  - Shape notes: County-administered with distinct providers per Delaware county (3 total); income at 125% poverty (no asset test or table); priority tiers affect access; funding-constrained slots
- **Legal Aid for Seniors** — service ([source](https://dhss.delaware.gov/wp-content/uploads/sites/2/dsaapd/pdf/SS_legal_svs_for_elderly.pdf))
  - Shape notes: State mandates statewide coverage for 60+ with priority tiers but delegates eligibility/assets to providers; county-specific offices/phone lines; no fixed income/asset tables or processing times published

## Program Details

### Diamond State Health Plan (DSHP and DSHP-Plus)


**Eligibility:**
- Age: 65+
- Income: For DSHP-Plus (long-term care services for elderly): $2,485 per month for the applicant in 2026. Income of non-applicant spouse is not counted. No variation by household size specified; fixed applicant limit. For standard DSHP (managed care for low-income adults): at or below 100% Federal Poverty Level (FPL), approximately $1,255/month for single adult in 2026 (inferred from FPL). Excludes those receiving long-term care services[1][2][4][8].
- Assets: For DSHP-Plus/ABD Medicaid long-term care: $2,000 countable assets for single applicant. Home is exempt if applicant lives there or intends to return with equity ≤ $752,000 (2026), or if spouse/minor child/disabled child lives there. Other countable assets include bank accounts; car may be exempt per general Medicaid rules. No asset test for standard DSHP non-LTC[1][2][3].
- Delaware resident.
- For DSHP-Plus: Nursing Facility Level of Care (NFLOC) - at risk, requiring assistance with ≥1 ADL (bathing, dressing, mobility, toileting, eating, transferring). Assessed via Pre-Admission Screening (PAS).
- Physically disabled or specific diagnosis (e.g., AIDS) also qualify.
- Not entitled/eligible for Medicare, no comprehensive insurance, no military health coverage, not in long-term care for standard DSHP.
- Enrollment in Managed Care Organization (MCO) required for benefits[1][2][3][4].

**Benefits:** Comprehensive Medicaid managed care: doctor visits, hospital care (inpatient/outpatient), labs, prescription drugs, transportation, mental health/substance use treatment (outpatient/inpatient), home health, hospice, ambulance, allergy/HIV/hearing exams, hearing aids (1 per ear every 2 years for 21+), GED testing voucher (18+), healthy weight program, rewards gift cards. For DSHP-Plus/LTCCS: long-term Home and Community Based Services (HCBS) for those meeting NFLOC[3][7][9].
- Varies by: age

**How to apply:**
- Online: Delaware Medicaid application via dhss.delaware.gov/dmma/medicaid.html
- Phone: 1-800-372-2022
- In-person: Local Division of Medicaid & Medical Assistance offices
- Mail: Submit forms to DMMA

**Timeline:** Not specified in sources

**Watch out for:**
- DSHP is managed care; must enroll in MCO to receive benefits - no services until enrolled[4].
- DSHP-Plus requires NFLOC screening; dementia diagnosis alone insufficient[1].
- Excludes Medicare-eligible, those in nursing homes/LTC, or with other comprehensive insurance[1][4].
- For LTC, most income goes to state (keep $75/month personal needs allowance)[2].
- Home equity limit $752,000 (2026); exceeds may disqualify[1].

**Data shape:** Two tiers: standard DSHP (low-income adults <100% FPL, no asset test) vs. DSHP-Plus (elderly LTC with NFLOC, $2,485/month income cap, $2,000 assets, home equity rules); mandatory MCO enrollment; benefits age-tiered

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhss.delaware.gov/dmma/medicaid.html

---

### Division of Services for Aging and Adults with Physical Disabilities (DSAAPD) Waivers

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 and older, or 18-59 with specified financial and medical requirements+
- Income: Specific dollar amounts not detailed in sources; must meet Medicaid financial eligibility criteria, which vary by program and are determined by Division of Medicaid and Medical Assistance (DMMA). Low-income requirement implied for those 55+ in some contexts[4].
- Assets: Not specifically detailed for DSAAPD waivers; related programs reference $2,000 resource limit (e.g., bank accounts, CDs, property other than residence, whole life insurance, 401K), with option for irrevocable trust if exceeded[1][3].
- Delaware resident living in own home or apartment
- Functionally impaired with physical disabilities meeting social, financial, and physical criteria (e.g., need for nursing home level of care or intermediate level of care)
- Eligible for Medicaid
- For ages 18+: need assistance with activities like dressing, bathing, mobility, toileting, feeding, health maintenance[4]

**Benefits:** Personal care (dressing, bathing, grooming, mobility, toileting, feeding, health maintenance); attendant services; case management; respite care; assistive devices (shower chair, ramp, stair glide); possible assisted living cost coverage in licensed facilities; nutritional support in some contexts[4][5]

**How to apply:**
- Phone: 800.223.9074 (DSAAPD or Joining Generations)
- Website: www.dhss.delaware.gov/dsaapd
- In-person: Contact for available locations
- Statewide referral process through Delaware Aging & Disability Resource Center (ADRC) for Elderly & Disabled Waiver, Assisted Living Waiver[4][6]

**Timeline:** Not specified in sources

**Watch out for:**
- Must be Medicaid-eligible first; waiver is an alternative to nursing home care but requires nursing home level of care[4][7]
- Eligibility varies by specific waiver (e.g., Elderly & Disabled, Assisted Living, Acquired Brain Injury)[5]
- Ages 18-59 have stricter financial/medical criteria than 60+[4]
- Assisted living coverage requires licensed facility that offers covered services[5]
- Resources over limits may require irrevocable trust[1]

**Data shape:** Multiple DSAAPD-administered waivers (Elderly & Disabled, Assisted Living); eligibility tied to Medicaid with functional impairment; statewide but location-specific providers; no exact current income tables in sources

**Source:** www.dhss.delaware.gov/dsaapd

---

### Program of All-Inclusive Care for the Elderly (PACE) - Delaware PACE

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No financial criteria are considered in determining PACE eligibility[3]. However, for Medicaid coverage (which covers most participants), income must be under 300% of the Federal Benefit Rate ($2,901/month as of 2025)[2]. Note: Medicaid offers multiple pathways to eligibility beyond standard income limits[2].
- Assets: No asset limits for PACE eligibility itself[3][4]. However, for Medicaid coverage, assets must be valued at $2,000 or less (excluding the primary home)[2].
- Must be certified by the state as meeting the need for nursing home level of care (requiring extensive assistance with Activities of Daily Living: bathing, grooming, toileting, walking, transferring, eating)[2][3]
- Must be able to live safely in the community with PACE services at the time of enrollment[1][3][4]
- Must reside in an approved PACE service area[1][3]
- Must be living in the community (not in a nursing home or institutional setting)[1]
- Must voluntarily agree to enroll in PACE and receive services exclusively through the PACE organization and their subcontractors[1]
- Cannot be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan[3]
- Cannot be enrolled in hospice services or certain other programs[3]
- U.S. citizen or legal resident for 5 years prior to application (if seeking Medicare coverage)[2]

**Benefits:** Comprehensive all-inclusive care covering: primary and specialist physician services, nursing care, therapy services (physical, occupational, speech), medications, medical equipment and supplies, transportation, social services, nutritional counseling, and other medically necessary services. Once enrolled, participants never pay deductibles or co-pays for any care, medication, or service provided by the PACE interdisciplinary team[4].
- Varies by: not_applicable — benefits are comprehensive and all-inclusive for all enrolled participants

**How to apply:**
- In-person: Contact a PACE organization directly in your service area for an intake visit[5]
- Phone: Contact the specific PACE provider serving your area (see Regional Variations below)
- Mail: Submit completed intake forms to the PACE organization serving your area

**Timeline:** Not specified in available sources. The intake process includes initial screening, home visit by PACE staff, verification of enrollment criteria by the Enrollment Assessment Team, and state determination of nursing facility level of care eligibility[5]. Recommend contacting your local provider for specific timeline.
**Waitlist:** Not specified in available sources. Contact your local PACE provider for current waitlist status.

**Watch out for:**
- No income or asset test for PACE eligibility itself, but most participants are dually eligible for Medicare and Medicaid (approximately 90%)[3]. If you don't qualify for Medicaid, you'll pay a flat monthly premium as a private-pay participant[6][7].
- You must be living in the community at enrollment — if already in a nursing home, you may not qualify[1].
- PACE is all-or-nothing: you must receive services exclusively through the PACE organization and cannot use other providers[1]. You cannot be enrolled in Medicare Advantage, Medicare prepayment plans, or prescription drug plans simultaneously[3].
- Enrollment is voluntary, but once enrolled, you're committed to the program's care model and cannot easily switch to other coverage types[1].
- Service area availability is limited — not all of Delaware is covered. Verify your zip code is in a PACE service area before applying[3][6].
- The state must certify you as needing nursing home level of care — this is not self-determined and requires formal assessment[3][5].
- If you move out of the PACE service area or are out of the area for more than 30 consecutive days (without prior arrangement), you may be disenrolled[1].
- Disruptive, threatening, or non-compliant behavior that jeopardizes safety can result in disenrollment[1].

**Data shape:** Delaware PACE is geographically restricted to specific service areas served by individual PACE organizations (PACE Your LIFE, Saint Francis LIFE, and potentially others). There are no income or asset limits for PACE eligibility itself, but Medicaid coverage (which funds most participants) has income and asset limits. Benefits are comprehensive and all-inclusive with no variation by tier or household size. The program requires exclusive enrollment and cannot be combined with Medicare Advantage or other managed care plans. Processing timelines and waitlist status are not publicly specified and vary by provider.

**Source:** https://www.law.cornell.edu/regulations/delaware/16-Del-Admin-Code-SS-20000-20775 (Delaware Administrative Code); https://www.medicaid.gov/medicaid/spa/downloads/DE-21-0007.pdf (Delaware State Plan Amendment)

---

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB)

> **NEW** — not currently in our data

**Eligibility:**
- Income: QMB: Countable income ≤100% Federal Poverty Level (FPL). Delaware 2025 limits: $1,325/month individual, $1,783/month couple. Revised poverty levels effective April 1 for those with Title II income (Social Security), February 1 otherwise. SLMB: Meets all QMB requirements except income >QMB limit but ≤120% FPL. Delaware 2025 limits: $1,585/month individual, $2,135/month couple. Limits apply to applicant and spouse; deeming rules for ineligible spouse: if their gross income ≤ half the individual limit, none is deemed. No variation specified by larger household sizes.
- Assets: Delaware excludes **all resources** of applicant and spouse for QMB and SLMB (no asset test). Note: Federal guidelines in some sources mention limits like $9,660 individual/$14,470 couple, but Delaware regulations supersede with full exclusion.[1][2]
- Entitled to Medicare Part A (enrolled or eligible).
- Delaware resident.
- Not eligible for full Medicaid (QMB/SLMB provide only Medicare cost-sharing help).
- U.S. citizen or qualified non-citizen.

**Benefits:** QMB: Medicaid pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, and copayments for Medicare-covered services. No additional Medicaid services provided. SLMB: Medicaid pays Medicare Part B premium only. No deductibles, coinsurance, or other services.
- Varies by: program_type

**How to apply:**
- Phone: Contact Delaware Division of Medicaid & Medical Assistance (DMMA) at 1-800-852-9089.
- Online: Delaware ASSIST website (assistedliving.delaware.gov or dhss.delaware.gov/dmma).
- Mail/In-person: Local Social Services offices or DMMA central office (1901 N. Dupont Highway, New Castle, DE 19720).

**Timeline:** Not specified in sources; typically 45 days for Medicaid programs, but eligibility not retroactive.

**Watch out for:**
- No asset test in Delaware (people miss this—unlike many states).
- QMB/SLMB recipients get **no Medicaid services** beyond Medicare cost-sharing; cannot dual-eligible for full Medicaid.
- Eligibility not retroactive—must apply before coverage starts.
- Providers cannot bill QMBs for Medicare-covered services (federal protection).
- Income disregards (e.g., $20 unearned, $65+$half earned) may apply federally, but Delaware follows federal poverty line directly.
- SLMB only covers Part B premium—not deductibles/copays like QMB.

**Data shape:** No asset test (full resource exclusion unique to Delaware implementation); income strictly federal poverty-based with spouse deeming; benefits strictly Medicare premium/cost-sharing (no services); two tiers (QMB ≤100% FPL, SLMB 100-120% FPL).

**Source:** https://regulations.delaware.gov/board/division-of-medicaid-and-medical-assistance

---

### Food Stamp Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: Delaware SNAP has expanded eligibility. Maximum gross monthly income is 200% FPL for most households: 1 person $2608, 2 $3526, 3 $4442, 4 $5358, 5 $6276, 6 $7192, 7 $8108, each additional +$916. For elderly/disabled households (all members 60+ or disabled), no gross income test; qualify on net income ≤100% FPL or gross ≤165% FPL in some cases. Seniors 60+ may qualify if gross ≤130% FPL (~$1580 for one) or net ≤100% FPL. SSI recipients are categorically eligible.[1][2][3]
- Assets: No asset limits for households where all members are 60+ or disabled. Standard asset test may apply otherwise, but Delaware has expanded eligibility exempting many elderly/disabled households.[1][2]
- Delaware resident.
- U.S. citizen or eligible lawful alien.
- Household defined as those who live together, buy, and prepare food together. Children 21 or younger living with parents must apply together.
- Interview required.

**Benefits:** Monthly benefits loaded on EBT card for groceries at authorized stores. Maximum ~$291 for 1-person household, ~$535 for 2-person. Actual amount based on net income, household size, deductions (e.g., higher medical >$35/month, shelter for elderly). Minimums and maximums apply; ~$100 more net income = $30 less benefits.[1][2]
- Varies by: household_size

**How to apply:**
- Online: Delaware DSS online application portal (dhss.delaware.gov or mybenefits.delaware.gov).
- Phone: State SNAP hotline or local DSS (specific numbers via dhss.delaware.gov/dss).
- In-person: Local Department of Social Services (DSS) office.
- Mail: Submit application to local DSS.

**Timeline:** Eligibility decision within 30 days; expedited benefits within 7 days if meet certain conditions (e.g., very low income). Certification period typically 12 months for households with 60+ or disabled members.[5][7]

**Watch out for:**
- Elderly households skip gross income test but must meet net income/asset; higher deductions for medical/shelter often key to qualification.
- All who live/buy/prepare food together count as household—don't miss including others.
- SSI recipients categorically eligible—no separate application needed in most cases.
- Work requirements may apply to ages 55-64 without dependents under new 2025 rules.
- Benefits reduce ~$0.30 per $1 net income increase.
- Telephone interviews often available for elderly, no in-person required.

**Data shape:** Expanded Delaware eligibility (200% FPL gross vs federal 130%); no asset test for all-elderly/disabled households; special higher deductions for seniors; benefits scale by household size and net income with elderly-specific rules.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhss.delaware.gov/dss/

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly household income must be at or below 200% of federal poverty guidelines (recent data: 1 person $3,278/month or $39,336/year; 2 people $4,287/month or $51,444/year; 3 people $5,296/month or $63,552/year; 4 people $6,304/month or $75,648/year; 5 people $7,313/month or $87,756/year; 6 people $8,322/month or $99,864/year). Older data confirms annual thresholds like 1 person $25,536, 2 people $34,488[1][2]. Defined as 60% of Delaware State Median Income after taxes[4].
- Assets: No asset limits mentioned in Delaware state program sources.
- Household includes all at address sharing utility bill[1]
- Eligible heating fuels: electricity, natural gas, oil, kerosene, propane, coal, wood[4]
- Homeowners and renters qualify[2][4]
- Priority for elderly (60+), disabled, families with young children (5 and under), high energy burdens[3]

**Benefits:** Heating: $100 minimum to $2,561 maximum; Cooling: $1 minimum to $1,000 maximum; Crisis: up to $10,000. Average grant ~$553/year. Paid as supplemental grant to household or vendor for energy bills, crisis (e.g., shut-off), weatherization/repairs[1][4][5].
- Varies by: household_size|priority_tier|fuel_type

**How to apply:**
- Online: Catholic Charities Diocese of Wilmington LIHEAP portal (via dhss.delaware.gov/dhss/dss/liheap.html)[4]
- Phone: (302) 255-9875[4]
- In-person/mail: Local agencies via Division of State Service Centers (DSSC), e.g., Catholic Charities[4][7]

**Timeline:** Not specified; funding limited, applications may close early if funds exhausted[1]
**Waitlist:** Possible pending status if documents incomplete; first-come-first-served until funds gone[3]

**Watch out for:**
- Funding limited; applications stop when funds run out, even before season end (heating Oct-Mar, cooling May-Aug, crisis year-round)[1][4]
- Household counts all sharing utility bill, unlike SNAP[1]
- Supplemental only, not full heating costs[4]
- Must apply during open periods; crisis needs proof like shut-off notice[1][4]
- Older data (e.g., 2021) may differ; verify current via official site[2]

**Data shape:** Benefits vary by income, size, fuel, crisis status; priority tiers for elderly/disabled/young kids; seasonal components with early fund exhaustion; statewide but local agency delivery

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhss.delaware.gov/dhss/dss/liheap.html

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"description":"Household income must not exceed 200% of the Federal Poverty Level, which is annually established at 60% of the median family income[2][3]","income_table":{"1_person":"$30,120","2_persons":"$40,880","3_persons":"$51,640","4_persons":"$62,400","5_persons":"$73,160","6_persons":"$83,920","7_persons":"$94,680","8_persons":"$105,440","additional_person":"Add $10,280 for each additional person beyond 8[1]"},"note":"Income guidelines are updated annually; verify current limits before applying[3]"}
- Residential housing only: single-family homes, rowhomes, and trailers are acceptable; no multi-family homes[2]
- Homeowners and renters both eligible; renters must have landlord permission and a copy of the rental agreement[2]
- Proof of identity required[6]
- Proof of ownership (for homeowners)[6]

**Benefits:** Free weatherization services including air-sealing, insulation, heating system repair and maintenance (one check covered), lighting upgrades, window and door replacement, roof repair, masonry repair, attic/wall/floor insulation and ventilation, duct sealing, water heater and pipe insulation, and other minor repairs[5][8]
- Varies by: household_need

**How to apply:**
- Online: Apply using the Energy Coordinating Agency (ECA) online form at ecasavesenergy.org[4]
- Phone: Call Energy Coordinating Agency at 302-504-6111 to set up an appointment[1]
- Phone: Call DNREC at 302-735-3480 for questions[1]
- Email: weatherization@deop.org (Delaware Opportunities Inc.) to request a callback[3]
- In-person: Contact local administering agencies (ECA or Delaware Opportunities Inc. depending on region)

**Timeline:** Not specified in program documentation; applicants placed on waiting list after eligibility determination[1]
**Waitlist:** Yes — after deemed eligible, household placed on waiting list prioritized by need, age and special needs of residents, and annual funding levels. Not all applicants served in any one program year. If not served within 12 months, must reapply annually to verify income eligibility[1][7]

**Watch out for:**
- Waiting list is not guaranteed service — funding is limited and not all applicants are served each year[1][7]
- If you don't receive services within 12 months of application, you must reapply every year to maintain eligibility; your application does not carry over[1][7]
- Renters need landlord permission in writing and a copy of the rental agreement — this can be a barrier if landlord is uncooperative[2]
- Multi-family homes (apartments, condos) are NOT eligible, even if you own one unit[2]
- Homeowner participation requires significant time commitment on multiple days, and someone age 18+ must be present each time contractors are in the home[1][7]
- Income limits are based on 200% of Federal Poverty Level (60% of median family income), which is stricter than some other assistance programs[2][3]
- Pre-WAP program exists for homes that don't initially qualify — these homes can receive roof repair, window/door replacement, and masonry work to become eligible for full WAP services[2]
- No permits required for weatherization work[5]
- Program does not consider applicants categorically eligible based on participation in other assistance programs — income must be verified independently[6]

**Data shape:** Benefits scale by household size through income eligibility thresholds rather than varying service levels. Waiting list prioritization is need-based rather than first-come-first-served. Program is statewide but administered through multiple local agencies, which may affect processing times and accessibility. Key distinction: this is a federal DOE program with strict income limits (200% poverty level), not a needs-based program. Elderly family members do not receive priority based on age alone, but age is one factor in waiting list prioritization. Services are determined by home energy audit results, not by household tier or priority level.

**Source:** https://dnrec.delaware.gov/climate-coastal-energy/sustainable-communities/weatherization/

---

### Delaware Senior Medicare Patrol (SMP/SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, families, and caregivers[1][2][4]
- Assets: No asset limits; no financial tests apply[1][2][4]
- Must be a Medicare beneficiary, family member, or caregiver in Delaware seeking help with Medicare fraud prevention/detection, health insurance counseling, or related issues[1][2][4][9]

**Benefits:** Free one-on-one counseling on Medicare options, enrollment, billing disputes, claims resolution; education on preventing/detecting/reporting Medicare fraud, errors, abuse; community presentations, health fairs; referrals to partners like CMS, OIG, state agencies; My Health Care Tracker tool for statements[1][2][3][9]

**How to apply:**
- Phone: Contact Delaware SMP/SHIP via national SMP locator or toll-free 877-808-2468 (connects to state program, Mon-Fri 9am-5:30pm ET)[5]
- Online: SMP Locator at smpresource.org to find Delaware contact; Delaware DHSS site dhss.delaware.gov/dsaapd for local details[5][9]
- In-person: Local sites via SMP locator (over 500 national sites, Delaware-specific through DHSS)[2][5]
- Contact form: smpresource.org contact for state connection[5]

**Timeline:** Immediate phone counseling; individualized assistance upon contact (timely response within 2 business days via contact form)[5]

**Watch out for:**
- Not a financial assistance or healthcare provider program—focuses on education, fraud prevention, counseling (not direct medical care or cash benefits); often co-located with SHIP but distinct SMP anti-fraud mission; volunteers handle much outreach, so availability may depend on local staffing; must actively report suspected fraud[1][2][4][9]
- Automatic connection via national lines but confirm Delaware-specific counselor[5]

**Data shape:** no income/asset test; open to all Medicare beneficiaries/families; service-based (counseling/education) not financial; volunteer-driven with statewide coverage via single state grantee

**Source:** https://dhss.delaware.gov/dsaapd (Delaware SMP/SHIP); https://smpresource.org/smp-locator/ (national locator for Delaware contact)[5][9]

---

### Home Delivered Meals (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits. Income shall not be criteria for eligibility.[1]
- Assets: No asset limits mentioned.
- Homebound by reason of physical disability (defined as a disability anticipated to last 12 months or longer with at least one Activity of Daily Living (ADL) deficit impacting independent living, such as bathing or walking).[1]
- Residing in the State of Delaware.[1]
- For non-elderly disabled household members: Must be a member of an eligible elderly person's household and provide proof of Social Security Disability Insurance coverage.[1]
- Must live in a delivery zone served by local providers.[2][7]

**Benefits:** Nutritionally balanced home-delivered meals, available at least 5 days per week according to participant needs. No time limit on service length.[1]
- Varies by: region

**How to apply:**
- Contact local Meals on Wheels program or Area Agency on Aging by phone for your region:[7]
- New Castle County (most areas): City Fare Meals On Wheels / St. Anthony’s Center - 302-421-3734 or 302-293-0008; www.cityfare.org/meals/eligibility
- Kent County: Modern Maturity Center - 302-734-1200 ext. 119; www.modern-maturity.org/nutrition
- Initial assessment includes questions on age, health, mobility, meal preparation ability, dietary restrictions, emergency contacts, and medical conditions.[2]

**Timeline:** Varies; some programs process within a week, others longer if waitlist exists.[2]
**Waitlist:** Possible waitlists in some programs; check locally.[2]

**Watch out for:**
- Not all of Delaware is explicitly listed; confirm local provider for Sussex County or other areas via Area Agency on Aging.[7]
- Homebound status strictly required; those who can easily leave home or have cooking help may not qualify.[2]
- Car ownership or ability to shop may affect eligibility in some local programs.[2]
- Separate Medicaid LTSS program exists for up to 2 meals/day with prior authorization, but not the core Title III-C program.[3]
- Meals not delivered to assisted living, nursing facilities, adult day care, or senior centers.[3]

**Data shape:** Administered statewide via Title III-C but delivered by regional providers with local contacts; no income/asset tests, focuses on homebound status; varies by local delivery zone and provider.

**Source:** https://dhss.delaware.gov/wp-content/uploads/sites/2/dsaapd/pdf/home_delivered_meals2.pdf

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level (after allowable exclusions). Exact dollar amounts vary annually by household size based on U.S. Department of Health and Human Services guidelines; no specific table provided in sources for current year.
- Unemployed
- Reside in Delaware (New Castle, Kent, or Sussex County)
- U.S. work authorized
- Willing to provide community service, attend meetings/training, develop Individual Employment Plan (IEP), and use job search resources
- Have barriers to employment (e.g., low employment prospects)

**Benefits:** Subsidized part-time community service work experience (average 20 hours/week) at non-profits/public agencies (e.g., schools, hospitals, senior centers); paid highest of federal/state/local minimum wage (Delaware: $9.25/hour as of source date); training (on-the-job, workshops on resume/interview/computer skills, job search); supportive services (counseling, referrals); yearly physical; goal of transition to unsubsidized employment.
- Varies by: priority_tier

**How to apply:**
- New Castle County: National Able Network, 300 East Lea Blvd, Wilmington, DE 19802, (302) 252-3211
- Contact county SCSEP Program Manager via Delaware 211
- Kent/Sussex Counties: Contact county offices (specifics via Delaware 211 or county operators; Sussex administered by First State Community Action Agency)
- In-person at county offices or Rose Hill Community Center, Inc. (New Castle)

**Timeline:** Not specified; involves assessment, IEP development, then host site placement if selected.
**Waitlist:** Possible due to available funding; varies by county.

**Watch out for:**
- County-specific providers and contacts required—no single statewide office
- Funding-limited slots create waitlists; availability varies by county
- Income test is strict (≤125% poverty after exclusions); must be fully unemployed
- Priority for veterans, 65+, disabled, rural/homeless/low-literacy—others may wait longer
- Wage fixed at min. $9.25/hr (older data); part-time only as bridge to unsubsidized work
- Requires commitment to community service, training, and active job search

**Data shape:** County-administered with distinct providers per Delaware county (3 total); income at 125% poverty (no asset test or table); priority tiers affect access; funding-constrained slots

**Source:** https://laborfiles.delaware.gov/main/det/faqs-scsep/SCSEP_FAQs.pdf

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No fixed statewide dollar amounts specified in the state program; services available to all Delaware residents 60+ with priority to those with greatest social/economic need. Providers like Community Legal Aid Society (CLASI) and Legal Services Corporation of Delaware generally require income below 125% of Federal Poverty Guidelines (varies by program, household size, assets, and exceptions for seniors); exact FPL table not detailed—contact provider for current amounts.[1][2][3]
- Assets: Assets considered on a case-by-case basis by providers; no statewide fixed limits specified. What counts and exemptions determined individually, potentially excluding primary home or certain personal items.[2][4]
- Delaware resident
- Priority to those with greatest social/economic need (e.g., low-income, rural residents)
- Legal matters limited to elder-related issues like public benefits (SS/SSI/SSDI, Medicaid/Medicare, veterans), housing/eviction, financial abuse/exploitation, nursing home discharges, powers of attorney, advance directives[1][3]

**Benefits:** Free civil legal services including representation, advice, powers of attorney/advance directives, fraud/financial abuse cases, nursing home issues, housing/eviction defense, public benefits access (Medicare, Social Security, etc.). Providers conduct quarterly legal education programs. No specific dollar amounts or hours stated.[1][3]
- Varies by: priority_tier

**How to apply:**
- Phone: Community Legal Aid Society (CLASI) - New Castle: 302-575-0660, Kent: 302-674-8500, Sussex: 302-856-0038; Legal Services Corp of DE - New Castle: 302-575-0408, Kent: 302-734-8820[6]
- Online screening/referral: Legal Help Link (delegalhelplink.org) to match to provider[6]
- In-person: Local offices or courthouses for limited assistance programs[6]

**Timeline:** Not specified
**Waitlist:** Not specified; priority-based allocation[1]

**Watch out for:**
- Not automatic eligibility at 60—providers apply their own income/asset guidelines (e.g., ~125% FPL) despite state 'all 60+' language; exceptions possible but call to confirm[1][2]
- Limited to specific elder-related civil matters (e.g., no criminal cases); priority to high-need cases may limit access[1][3]
- Assets reviewed case-by-case, can disqualify even if income qualifies[4]
- Funded by Older Americans Act Title III-B; subject to LSC restrictions[1]

**Data shape:** State mandates statewide coverage for 60+ with priority tiers but delegates eligibility/assets to providers; county-specific offices/phone lines; no fixed income/asset tables or processing times published

**Source:** https://dhss.delaware.gov/wp-content/uploads/sites/2/dsaapd/pdf/SS_legal_svs_for_elderly.pdf

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; program is available to all residents of long-term care facilities regardless of financial status[2][4][6]
- Assets: No asset limits or tests apply[2][4][6]
- Must be a resident of a long-term care facility such as nursing home, assisted living residence, or related facility in Delaware[2][5][6]

**Benefits:** Advocacy services including investigating and resolving complaints made by or on behalf of residents (except abuse/neglect/mistreatment/financial exploitation which are referred elsewhere); informing residents of rights under federal and state law; assisting in protecting rights; providing information about the program; periodic site visits and annual facility assessments to ensure care standards[2][4][5][6]

**How to apply:**
- Phone: 800-223-9074 or 1-800-223-9074[2][4]
- Website: www.dhss.delaware.gov/dhss or www.dhss.delaware.gov/dsaapd[2][4]

**Timeline:** Not specified; complaint investigation occurs upon contact, with site visits as needed[5][6]

**Watch out for:**
- Not a direct service provider like healthcare or financial aid—focuses solely on advocacy and rights protection, not personal care or funding[5][6]
- Abuse, neglect, mistreatment, or financial exploitation complaints are referred to Division of Long Term Care Residents Protection, not handled directly[6]
- Families cannot qualify independently; services are for facility residents only[2][5]
- Volunteers have strict conflict of interest rules (e.g., no family in facility)[2]

**Data shape:** no income test; advocacy-only for long-term care residents statewide; complaint-driven access with no formal application or waitlist

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhss.delaware.gov/dsaapd (Division of Services for Aging and Adults with Physical Disabilities)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Diamond State Health Plan (DSHP and DSHP | benefit | state | deep |
| Division of Services for Aging and Adult | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Qualified Medicare Beneficiary (QMB), Sp | benefit | federal | deep |
| Food Stamp Program (SNAP) | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | medium |
| Delaware Senior Medicare Patrol (SMP/SHI | benefit | federal | medium |
| Home Delivered Meals (Meals on Wheels) | benefit | federal | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"employment":1,"resource":2}
**Scopes:** {"state":3,"local":1,"federal":8}
**Complexity:** {"deep":7,"medium":3,"simple":2}

## Content Drafts

Generated 12 page drafts. Review in admin dashboard or `data/pipeline/DE/drafts.json`.

- **Diamond State Health Plan (DSHP and DSHP-Plus)** (benefit) — 4 content sections, 6 FAQs
- **Division of Services for Aging and Adults with Physical Disabilities (DSAAPD) Waivers** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE) - Delaware PACE** (benefit) — 5 content sections, 6 FAQs
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB)** (benefit) — 4 content sections, 6 FAQs
- **Food Stamp Program (SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 5 content sections, 6 FAQs
- **Delaware Senior Medicare Patrol (SMP/SHIP)** (benefit) — 2 content sections, 6 FAQs
- **Home Delivered Meals (Meals on Wheels)** (benefit) — 4 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Legal Aid for Seniors** (resource) — 3 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **age**: 1 programs
- **not_applicable**: 3 programs
- **not_applicable — benefits are comprehensive and all-inclusive for all enrolled participants**: 1 programs
- **program_type**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|fuel_type**: 1 programs
- **household_need**: 1 programs
- **region**: 1 programs
- **priority_tier**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Diamond State Health Plan (DSHP and DSHP-Plus)**: Two tiers: standard DSHP (low-income adults <100% FPL, no asset test) vs. DSHP-Plus (elderly LTC with NFLOC, $2,485/month income cap, $2,000 assets, home equity rules); mandatory MCO enrollment; benefits age-tiered
- **Division of Services for Aging and Adults with Physical Disabilities (DSAAPD) Waivers**: Multiple DSAAPD-administered waivers (Elderly & Disabled, Assisted Living); eligibility tied to Medicaid with functional impairment; statewide but location-specific providers; no exact current income tables in sources
- **Program of All-Inclusive Care for the Elderly (PACE) - Delaware PACE**: Delaware PACE is geographically restricted to specific service areas served by individual PACE organizations (PACE Your LIFE, Saint Francis LIFE, and potentially others). There are no income or asset limits for PACE eligibility itself, but Medicaid coverage (which funds most participants) has income and asset limits. Benefits are comprehensive and all-inclusive with no variation by tier or household size. The program requires exclusive enrollment and cannot be combined with Medicare Advantage or other managed care plans. Processing timelines and waitlist status are not publicly specified and vary by provider.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB)**: No asset test (full resource exclusion unique to Delaware implementation); income strictly federal poverty-based with spouse deeming; benefits strictly Medicare premium/cost-sharing (no services); two tiers (QMB ≤100% FPL, SLMB 100-120% FPL).
- **Food Stamp Program (SNAP)**: Expanded Delaware eligibility (200% FPL gross vs federal 130%); no asset test for all-elderly/disabled households; special higher deductions for seniors; benefits scale by household size and net income with elderly-specific rules.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Benefits vary by income, size, fuel, crisis status; priority tiers for elderly/disabled/young kids; seasonal components with early fund exhaustion; statewide but local agency delivery
- **Weatherization Assistance Program (WAP)**: Benefits scale by household size through income eligibility thresholds rather than varying service levels. Waiting list prioritization is need-based rather than first-come-first-served. Program is statewide but administered through multiple local agencies, which may affect processing times and accessibility. Key distinction: this is a federal DOE program with strict income limits (200% poverty level), not a needs-based program. Elderly family members do not receive priority based on age alone, but age is one factor in waiting list prioritization. Services are determined by home energy audit results, not by household tier or priority level.
- **Delaware Senior Medicare Patrol (SMP/SHIP)**: no income/asset test; open to all Medicare beneficiaries/families; service-based (counseling/education) not financial; volunteer-driven with statewide coverage via single state grantee
- **Home Delivered Meals (Meals on Wheels)**: Administered statewide via Title III-C but delivered by regional providers with local contacts; no income/asset tests, focuses on homebound status; varies by local delivery zone and provider.
- **Senior Community Service Employment Program (SCSEP)**: County-administered with distinct providers per Delaware county (3 total); income at 125% poverty (no asset test or table); priority tiers affect access; funding-constrained slots
- **Legal Aid for Seniors**: State mandates statewide coverage for 60+ with priority tiers but delegates eligibility/assets to providers; county-specific offices/phone lines; no fixed income/asset tables or processing times published
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only for long-term care residents statewide; complaint-driven access with no formal application or waitlist

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Delaware?
