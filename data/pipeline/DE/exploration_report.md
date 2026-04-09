# Delaware Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.105 (21 calls, 1.1m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 19 |
| Programs deep-dived | 18 |
| New (not in our data) | 15 |
| Data discrepancies | 3 |
| Fields our model can't capture | 3 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 3 | Our model has no asset limit fields |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 3 | Has document checklist — our model doesn't store per-program documents |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |

## Program Types

- **service**: 7 programs
- **unknown**: 2 programs
- **financial**: 5 programs
- **in_kind**: 1 programs
- **employment**: 2 programs
- **advocacy|service**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Diamond State Health Plan Plus (DSHP Plus)

- **benefit_value**: Ours says `$1,000 – $5,000/year` → Source says `Comprehensive medical and long-term services including: medical benefits (doctor visits, lab services, x-rays, hospitalization), dental, behavioral health, nursing facility care, and Home and Community Based Services (HCBS)[1]. Specific HCBS services include: case management (all participants), day habilitation, home-delivered meals (up to two per day as of 2022 amendment)[7], minor home modifications (wheelchair ramps, handrails, grab bars), nutritional supports for HIV/AIDS, personal care/attendant care, personal emergency response systems, respite care (in-home and out-of-home), specialized medical equipment/supplies, support for participant-directed care, and transitional services from nursing homes to community[1]` ([source](https://dhss.delaware.gov/dhss/dmma/medicaid.html))
- **source_url**: Ours says `MISSING` → Source says `https://dhss.delaware.gov/dhss/dmma/medicaid.html`

### Delaware Medicare Savings Programs (QMB, SLMB, QI)

- **source_url**: Ours says `MISSING` → Source says `Delaware Department of Insurance (insurance.delaware.gov) and Medicare.gov`

### Delaware Energy Assistance Program (DEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Varies by household size, income, and heating source. Supplemental payment, not designed to cover all heating costs.` ([source](https://www.dhss.delaware.gov/dhss/dss/liheap.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhss.delaware.gov/dhss/dss/liheap.html`

## New Programs (Not in Our Data)

- **Delaware Medicaid for Elderly and Disabled** — service ([source](https://dhss.delaware.gov/dmma/))
  - Shape notes: Multiple subprograms (ABD basic vs LTC/NFLOC vs waivers/PACE); income/assets program-specific with spousal deeming; county phone variation; NFLOC tiers benefits
- **Delaware PACE Program** — service ([source](https://www.law.cornell.edu/regulations/delaware/16-Del-Admin-Code-SS-20000-20775))
  - Shape notes: Limited to specific provider service areas (not statewide); no direct income/asset test for enrollment but tied to Medicaid for free coverage; requires state NFLOC certification and community safety assessment.
- **Delaware Food First Program (SNAP)** — financial ([source](https://www.dhss.delaware.gov/dss/foodstamps.html))
  - Shape notes: Elderly/disabled households: no gross income test, no asset limits, enhanced deductions (medical/shelter); broad categorical eligibility at 200% FPL gross; benefits scale by household size/income; expedited for very low income/resources; 12-month certification for seniors.
- **Delaware Weatherization Assistance Program** — in_kind ([source](https://dnrec.delaware.gov/climate-coastal-energy/sustainable-communities/weatherization/))
  - Shape notes: Benefits are fixed in-kind services (not tiered by income), but priority for waitlist placement varies by household characteristics (age, disabilities, children, need level). Income limits scale by household size with a formula for households over 8 persons. Program is statewide with no regional variations in eligibility or services. The key structural feature is the waiting list — eligibility does not guarantee service in any given year.
- **Delaware Senior Medicare Patrol (SMP)** — service ([source](https://dhss.delaware.gov/dsaapd (Delaware DHSS DSAAPD administers); national https://smpresource.org[2][7][9]))
  - Shape notes: no income/asset/age test for beneficiaries; volunteer-based education/advocacy service only; no enrollment or waitlist—immediate access via contact; integrates with SHIP counseling[2][3][7]
- **Delaware Home Delivered Meals (Multiple Programs)** — unknown
  - Shape notes: Delaware does not have a single unified 'Home Delivered Meals' program. Instead, there are at least 5 separate programs with different eligibility criteria, age groups, benefits, and application processes. Families must: (1) determine which program(s) their loved one might qualify for based on age, income, Medicaid status, and specific circumstances; (2) contact the appropriate provider or health plan; (3) understand that Title III-C (Older Americans Act) is the primary program for seniors 60+, but Medicaid-enrolled individuals may have additional options through their health plan. The search results do not provide complete application procedures, processing times, or waitlist information for most programs.
- **CARE Delaware Caregiver Support Program** — service ([source](https://www.dhss.delaware.gov/dsaapd))
  - Shape notes: Eligibility requirements vary by program/service; no fixed income/asset tables—requires direct contact; statewide but assessment-driven; linked to DSAAPD for physically/mentally impaired adults 18+[3]
- **Delaware Senior Community Service Employment Program (SCSEP)** — employment ([source](https://laborfiles.delaware.gov/main/det/one-stop/FS-3_SenEmp.pdf (DE Labor SCSEP fact sheet); https://www.nationalable.org/wp-content/uploads/2020/02/SCSEP_DelawareHandbook_013120.pdf (DE handbook)[1][3]))
  - Shape notes: Operated by grantees like National Able; priority tiers for enrollment; funding-dependent slots; no fixed income table or asset test in sources, requires provider contact for current 125% FPL figures
- **Delaware Long Term Care Ombudsman Program** — advocacy|service ([source](https://dhss.delaware.gov/dsaapd (Division of Services for Aging and Adults with Physical Disabilities)[4]))
  - Shape notes: This is a statewide advocacy and complaint resolution program, not an eligibility-based benefit program. There are no income, asset, or age limits for residents to receive ombudsman services. Families access the program by contacting the state office directly by phone or website; there is no formal application. The program operates through trained volunteer ombudsmen assigned to specific facilities. Key distinction: this program advocates FOR residents' rights rather than providing direct services or financial assistance.
- **Delaware Prescription Assistance Program (DPAP)** — financial ([source](https://dhss.delaware.gov/dss/dpap.html (inferred from application PDF at dhss.delaware.gov/wp-content/uploads/sites/11/dss/pdf/dpapapplication.pdf); regulations at regulations.delaware.gov/AdminCode/title16/30000))
  - Shape notes: Income test at 200% FPL with alternative Rx cost threshold; no asset test; Medicare Part D mandatory bridge required; fixed annual cap per person with co-pay; statewide but centralized mail processing in New Castle
- **Nursing Home Transition Program** — service ([source](https://dhss.delaware.gov/dhss/dmma/index.shtml (DMMA/DSHP-Plus); program referenced in https://www.delawarefirsthealth.com/content/dam/centene/delaware/Policies/providernotification/DE.CP.MP.02_05.24.pdf))
  - Shape notes: Tied to DSHP-Plus Medicaid LTSS; 60-day institutional stay mandatory; $2,500 transition cap; no standalone income table but uses Medicaid LTC thresholds.
- **Wilmington Senior Tax Assistance Program** — financial ([source](https://www.wilmingtonde.gov/residents/senior-citizen-exemptions-and-programs))
  - Shape notes: This is a crisis-intervention program, not a routine tax relief program. It requires proof of imminent foreclosure and delinquent bills. The high income limit ($93,725) combined with the foreclosure requirement distinguishes it from Delaware's other senior tax exemption programs. The $3,000 maximum grant is a one-time assistance amount, not an ongoing annual benefit. Program availability may depend on funding; no information on current enrollment capacity or waitlists is available.
- **SCAT – Senior Citizens Affordable Taxi** — service ([source](http://www.dartfirststate.com/scat/))
  - Shape notes: No income or asset test; eligibility purely age 65+ or certified disability preventing driving; ticket-based discount system requiring in-person ID issuance at 2 statewide offices; exclusions for specific health risks
- **Delaware Foster Grandparent Program** — employment ([source](https://delaware211.org/iresource/state-office-of-volunteerism-foster-grandparent-program-sussex-county/))
  - Shape notes: Federal AmeriCorps Seniors program run statewide via DHSS/Division of State Service Centers; income eligibility only for stipend (volunteering open broader); county-level operations with Sussex example; no exact income tables or forms in sources
- **Over-60 Tuition Benefit** — financial ([source](https://delcode.delaware.gov/title14/c034/sc10/index.html (enabling law); https://www.continuingstudies.udel.edu/60-tuition-free-degree/ (UD); https://dtcc.smartcatalogiq.com/en/current/catalog/financial/senior-citizen-tuition-policy (DTCC)))
  - Shape notes: Statewide tuition waiver at public institutions for degree-seeking seniors; no income/asset test; institution-specific apps, exclusions, and space rules; authorized by DE law for UD, DSU, DTCC (DSU details not in results)

## Program Details

### Delaware Medicaid for Elderly and Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For Aged, Blind, and Disabled (ABD) Medicaid and Regular Medicaid long-term care in 2026: Single applicant under $994/month (income cap state at $2,485/month for nursing home, but lower for ABD). Nursing Home Medicaid single applicant: under $2,485/month. Limits vary by program; both spouses' income counted for single applicant in ABD (no spousal maintenance allowance). Contact local LTC unit for current limits as they differ by subcategory.[1][2][5]
- Assets: Single applicant: $2,000 in countable assets. Exempt: primary home (if spouse, child under 21/blind/disabled, sibling with 1-year equity, or adult child caregiver lives there), one vehicle, personal belongings, burial plots/funds. Countable: bank accounts, second vehicles, investments (non-exempt).[1][2][5]
- Delaware resident
- U.S. citizen or qualified/lawful alien
- Aged 65+, blind, or disabled (SSI-related automatic eligibility in DE)
- For long-term care/nursing home: Nursing Facility Level of Care (NFLOC) based on ADLs (bathing, dressing, eating, toileting, mobility) and IADLs (shopping, cooking, cleaning, meds); functional assessment required
- For basic ABD coverage: age/blind/disabled only (no NFLOC for physician visits, Rx, ER, short hospital)
- Voluntary entry into nursing facility or LTCCS program[1][2][3][5]

**Benefits:** Basic ABD: physician visits, prescription drugs, ER, short-term hospital. Long-term care: nursing home (full coverage, applicant keeps $50/month income), home/community-based services (case management, homemaker, adult/medical day care, respite, orthotics/prosthetics/hearing aids, emergency response). PACE (for 55+ in service area): comprehensive community care at NFLOC. Regular Medicaid LTC: ADL help without full NFLOC.[1][2][5][6]
- Varies by: priority_tier

**How to apply:**
- Online: Delaware ASSIST (dhss.delaware.gov/dmma/ or ASSIST tool)
- Phone: Division of Services for Aging and Adults with Physical Disabilities (DSAAPD) - New Castle County (302) 453-3820, Kent/Sussex Counties (302) 422-1386; Delaware Helpline
- In-person: Local Long Term Care (LTC) unit
- Mail: Contact LTC unit for forms[4][5][6]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; voluntary acceptance required, potential for services based on assessment[5]

**Watch out for:**
- Income cap state ($2,485/month for nursing home); ABD lower at $994/month
- Both spouses' income counted even if one applies (no MMNA for non-applicant spouse in ABD)
- NFLOC required for LTC/nursing, but not basic ABD coverage
- Home exemptions narrow (specific family must live there)
- SSI automatic in DE, but non-SSI ABD needs functional assessment for LTC
- Contact LTC unit for exact current limits (vary by program subcategory)[1][2][5][6]

**Data shape:** Multiple subprograms (ABD basic vs LTC/NFLOC vs waivers/PACE); income/assets program-specific with spousal deeming; county phone variation; NFLOC tiers benefits

**Source:** https://dhss.delaware.gov/dmma/

---

### Diamond State Health Plan Plus (DSHP Plus)


**Eligibility:**
- Income: Not specified in available sources. Contact DMMA Central Intake Unit at 866-940-8963 for current income thresholds.
- Assets: Not specified in available sources. Contact DMMA Central Intake Unit at 866-940-8963 for current asset limits and exemptions.
- Must be enrolled in Delaware Medicaid or Medicaid-expansion CHIP[4]
- Program targets elderly and adults with physical disabilities[6]
- Includes existing nursing facility residents, HCBS waiver participants, and AIDS waiver participants[6]
- Full benefit dual eligibles (Medicare + Medicaid) may be eligible for certain populations[4]
- Medicaid eligibility begins as of the date of application — no retroactive coverage[3]

**Benefits:** Comprehensive medical and long-term services including: medical benefits (doctor visits, lab services, x-rays, hospitalization), dental, behavioral health, nursing facility care, and Home and Community Based Services (HCBS)[1]. Specific HCBS services include: case management (all participants), day habilitation, home-delivered meals (up to two per day as of 2022 amendment)[7], minor home modifications (wheelchair ramps, handrails, grab bars), nutritional supports for HIV/AIDS, personal care/attendant care, personal emergency response systems, respite care (in-home and out-of-home), specialized medical equipment/supplies, support for participant-directed care, and transitional services from nursing homes to community[1]
- Varies by: Individual service plan — while all participants receive case management, an individualized assessment determines which other HCBS services each participant receives[1]

**How to apply:**
- Phone: DMMA Central Intake Unit at 866-940-8963 to request application packet[1]
- Phone: Medicaid Customer Relations at 866-843-7212[1]
- Mail: Request application packet from Division of Medicaid & Medical Assistance (DMMA) Central Intake Unit[1]
- Online: Visit DMMA website at https://dhss.delaware.gov/dhss/dmma/medicaid.html[4]

**Timeline:** Not specified in available sources. Contact DMMA Central Intake Unit at 866-940-8963 for current processing timelines.
**Waitlist:** Not specified in available sources. Contact DMMA Central Intake Unit at 866-940-8963 for current waitlist status.

**Watch out for:**
- DSHP-Plus is a mandatory managed long-term care program — it integrates nursing facility services and HCBS into managed care delivery, meaning beneficiaries must receive services through managed care organizations rather than fee-for-service[6]
- No retroactive Medicaid coverage — eligibility begins only from the date of application, not before[3]
- DSHP-Plus is an entitlement program, meaning meeting eligibility requirements guarantees immediate receipt of benefits[1], but specific HCBS services are individualized based on assessment, not automatic
- The program incorporates Money Follows the Person (MFP) for those transitioning from institutions to community[6]
- Full benefit dual eligibles (Medicare + Medicaid) have limited eligibility — only certain populations qualify[4]
- DSHP-Plus waiver expires December 31, 2028[2]; verify current status before applying
- Respite care and personal care services can be participant-directed (self-directed), but this requires additional support and training[1]

**Data shape:** DSHP-Plus is a managed long-term services and supports (MLTSS) program that consolidated multiple prior 1915(c) waivers into a single 1115 demonstration waiver[5]. Benefits are not fixed by income or household size but rather determined through individualized service planning. The program serves a specific population (elderly and adults with physical disabilities) rather than being universally available to all Medicaid beneficiaries. Critical eligibility and benefit details (income limits, asset limits, processing times, required documents) are not publicly specified in available sources and require direct contact with DMMA.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhss.delaware.gov/dhss/dmma/medicaid.html

---

### Delaware PACE Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment; however, for full coverage without a monthly premium, participants typically need Medicaid eligibility (income under 300% of Federal Benefit Rate: $2,901/month for 2025, assets $2,000 or less excluding primary home). Non-Medicaid eligible pay a flat monthly fee.[2][6][7]
- Assets: No asset limits for PACE enrollment itself; Medicaid pathway has $2,000 asset limit (exemptions include primary home, one vehicle, personal belongings, burial funds up to $1,500, life insurance up to $1,500 face value).[2]
- Meet Delaware's nursing home level of care criteria (assessed by state).
- Reside in a PACE approved service area (e.g., specific zip codes for providers like Saint Francis LIFE or PACE Your LIFE).
- Living in the community (not in a nursing home).
- Able to be maintained safely in the community with PACE assistance at time of enrollment.
- Not enrolled in Medicaid/Medicare managed care, Medicare Advantage, hospice, or certain other programs.
- Voluntarily agree to receive services exclusively through the PACE organization.
- U.S. citizen or legal resident for 5 years for Medicare eligibility (if applicable).[1][2][3][5][6]

**Benefits:** All-inclusive care including primary care, hospital/inpatient care, nursing home care when needed, prescription drugs, social services, restorative therapies, nutritional counseling, transportation to centers, personal care aides, homemaker services, home-delivered meals, physical/occupational/speech therapy, and adult day health care; no deductibles or copays for PACE-provided services; comprehensive interdisciplinary team care.[3][4]

**How to apply:**
- Contact providers directly: Saint Francis LIFE (Trinity Health PACE) or PACE Your LIFE.
- Phone/email for intake: PACE Your LIFE at info@paceyourlifemwv.com (specific phone not listed; call Delaware DMMA for referrals).
- In-person/home visit screening by PACE staff.
- State assessment for nursing home level of care via Delaware Division of Medicaid & Medical Assistance (DMMA).[5][6]

**Timeline:** Not specified; involves intake, home visit, medical records release, state NFLOC approval, and interdisciplinary team assessment (multi-step process over days to weeks).[5]
**Waitlist:** Not mentioned in sources; may vary by provider capacity.

**Watch out for:**
- Must live in specific service area zip codes; not statewide.
- Services exclusively through PACE—no outside providers without approval.
- Enrollment voluntary but requires agreement to full PACE model; disenrollment if move out of area >30 days, non-compliance, or disruptive behavior.
- Private pay monthly fee if not Medicaid-eligible (amount not specified).
- Cannot be in Medicare Advantage or managed care.[1][3][6]

**Data shape:** Limited to specific provider service areas (not statewide); no direct income/asset test for enrollment but tied to Medicaid for free coverage; requires state NFLOC certification and community safety assessment.

**Source:** https://www.law.cornell.edu/regulations/delaware/16-Del-Admin-Code-SS-20000-20775

---

### Delaware Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: {"description":"Income limits vary by program and household size. All figures are monthly gross income for 2026.","QMB":{"individual":"$1,350","married_couple":"$1,824"},"SLMB":{"individual":"$1,585","married_couple":"$2,135"},"QI_1":{"individual":"$1,781","married_couple":"$2,400"},"note":"QMB has the lowest income limits; SLMB and QI have progressively higher limits. You must be a Delaware resident and entitled to Medicare Part A to qualify for any program."}
- Assets: {"description":"Delaware has NO asset limit for QMB, SLMB, or QI programs.","exemptions":"Your home and one vehicle are not counted as assets in any calculation.","note":"This is a significant advantage compared to many other states—asset limits do not restrict eligibility."}
- Must be entitled to Medicare Part A
- Must be a Delaware resident
- Must have U.S. citizenship or qualified alien status
- Income must fall within the specific program's limits

**Benefits:** N/A
- Varies by: program_tier

**How to apply:**
- Phone: (302) 674-7364 — Delaware Medicaid Assistance Branch (DMAB)
- Mail: Contact DMAB at the phone number above for mailing address
- In-person: Contact DMAB for office location(s)
- Online: Check Delaware Department of Insurance website (insurance.delaware.gov) for potential online application options

**Timeline:** Not specified in available sources; contact DMAB directly for current processing times.
**Waitlist:** QI-1 program operates on a first-come, first-served basis with priority given to people who received QI benefits in the previous year. No waitlist information provided for QMB or SLMB.

**Watch out for:**
- QI-1 has annual funding limits and operates first-come, first-served — if you miss the application window or funding runs out, you must wait until the next year.
- QI-1 enrollees cannot receive ANY other Medicaid benefits, unlike QMB and SLMB enrollees who may qualify for additional Medicaid coverage.
- QI-1 requires annual re-application; QMB and SLMB may also require periodic re-certification — missing deadlines could result in loss of benefits.
- Income limits are strict and based on monthly gross income; even small income increases could disqualify you from a program.
- Delaware has NO asset limit for these programs, which is advantageous, but you must still meet income requirements.
- If you qualify for QMB, you are automatically enrolled in Extra Help for Part D; if you qualify for SLMB or QI-1, you are also automatically enrolled. Do not assume you need to apply separately.
- Medicare providers are not allowed to bill you for covered services if you're in QMB, but you may still receive a small Medicaid copayment bill if one applies.
- The programs cover premiums and cost-sharing but do NOT cover services Medicare itself doesn't cover.

**Data shape:** This program structure consists of three distinct tiers (QMB, SLMB, QI-1) with progressively higher income limits but fewer benefits as you move up the income scale. QMB is the most comprehensive but has the lowest income threshold; QI-1 is the most limited but has the highest income threshold. Delaware's lack of asset limits is a significant structural advantage. QI-1's first-come, first-served funding model and annual re-application requirement make it structurally different from QMB and SLMB. All three programs automatically enroll qualifying beneficiaries in Extra Help for Part D prescription drugs.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** Delaware Department of Insurance (insurance.delaware.gov) and Medicare.gov

---

### Delaware Food First Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Delaware's Food Supplement Program (SNAP) has a maximum gross monthly income limit of 200% FPL for most households (e.g., $2,430 for household of 1). For elderly/disabled households (all members 60+ or disabled), only the net income test at 100% FPL applies (e.g., $1,215 for household of 1); no gross income test. Seniors 60+ may qualify if gross income ≤130% FPL (~$1,580/month for one person) and net ≤100% FPL. Full table (2026, household size 1 example provided; scales by size): |Household Size|Max Gross 200% FPL|$2,430 (1)|; 130% FPL: $1,580 (1); Net 100% FPL: $1,215 (1). SSI recipients are categorically eligible without income test.[1][2][4][5][7]
- Assets: No asset limits for households where all members are 60+ or disabled, or most households meeting 200% FPL gross income under broad-based categorical eligibility (BBCE). Resources under $100 may qualify for expedited benefits.[1][2][5][7]
- U.S. citizen or eligible non-citizen (lawfully present). Undocumented non-citizens ineligible.[2][4][5][7]
- Delaware resident.[5][6]
- Household defined as those who live together, buy/prepare food together. All children ≤21 living with parents must apply together.[4][5][7]
- Work registration for most adults (exemptions for 60+, disabled).[6]

**Benefits:** Monthly benefits loaded on EBT card (used like debit at stores, farmers markets, some online). Max ~$291 (1-person household), ~$535 (2-person); most seniors receive less, based on income/deductions. Special for elderly: higher medical deduction (out-of-pocket >$35/month), generous shelter deduction.[1][5]
- Varies by: household_size

**How to apply:**
- Online: Delaware's online application portal (via dhss.delaware.gov).[1][5]
- Phone: State SNAP hotline (local Department of Social Services).[1]
- In-person: Local Department of Social Services office.[1]
- Mail: Submit application to local DSS.

**Timeline:** Expedited SNAP within 7 days if qualify (income <$150 + resources <$100, or income/resources < rent/utilities). Standard: certification period 12 months for 60+/disabled households.[3][5]

**Watch out for:**
- Elderly households skip gross income test (only net), but must still meet net 100% FPL; people miss special deductions (medical/shelter).[1][2]
- No asset test for elderly/disabled or BBCE households, but expedited requires low resources.[2][7]
- Certification 12 months for seniors vs. 6 months others; simplified reporting.[1][5]
- EBT works at farmers markets/online; not cash.[5]
- Children ≤21 with parents must apply together.[4][7]

**Data shape:** Elderly/disabled households: no gross income test, no asset limits, enhanced deductions (medical/shelter); broad categorical eligibility at 200% FPL gross; benefits scale by household size/income; expedited for very low income/resources; 12-month certification for seniors.

**Source:** https://www.dhss.delaware.gov/dss/foodstamps.html

---

### Delaware Energy Assistance Program (DEAP)


**Eligibility:**
- Income: 60% of Delaware State Median Income (SMI), after Federal and local taxes have been deducted. Specific dollar amounts vary annually and by household size; contact Catholic Charities for current year limits.
- Assets: No asset limit for LIHEAP in Delaware
- Must be income-eligible (60% of state median income)
- Utility bill in applicant's name or proof of responsibility for energy costs
- Proof of income for all household members over 18 (last 30 days)

**Benefits:** Varies by household size, income, and heating source. Supplemental payment, not designed to cover all heating costs.
- Varies by: household_size, income, heating_source, priority_tier

**How to apply:**
- Online: www.mybenefits.ny.gov (note: search results reference NY system; verify current Delaware online portal with Catholic Charities)
- Phone: (302) 255-9875
- In-person at Catholic Charities Diocese of Wilmington
- Mail: Contact Catholic Charities for mailing address

**Timeline:** Not specified in available sources; contact Catholic Charities for current timeline
**Waitlist:** Weatherization Assistance Program operates year-round with a waiting list. Regular DEAP processing timeline not specified.

**Watch out for:**
- DEAP is a SUPPLEMENTAL program—it does not cover all heating costs. Households must continue paying their own energy bills.
- Income limits are based on 60% of Delaware State Median Income AFTER taxes, not gross income. This is more restrictive than some other assistance programs.
- No asset limit exists, but income is the primary eligibility factor.
- Crisis assistance is available year-round and can be received IN ADDITION to seasonal benefits—many people don't know about this option.
- Weatherization assistance has a waiting list; apply early if interested.
- The program operates on available funding; benefits are not guaranteed and depend on fund availability.
- Elderly (60+) receive priority but are not exclusively eligible—the program serves all income-eligible households.
- Search results reference a NY HEAP program; ensure you're applying to Delaware's DEAP, not confusing it with other states' programs.

**Data shape:** Benefits scale by household size, income, and heating source. Program has three distinct components (winter heating, summer cooling, crisis) with different maximum benefits. Regional variation exists in service delivery through contracted agencies, but eligibility and benefits are statewide. No waiting list for regular DEAP, but weatherization component has waiting list. Priority given to vulnerable populations but not exclusive to them.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhss.delaware.gov/dhss/dss/liheap.html

---

### Delaware Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: {"basis":"200% of Federal Poverty Level (also described as 60% of median family income, annually established)[2][3]","household_size_table":{"1_person":"$30,120","2_persons":"$40,880","3_persons":"$51,640","4_persons":"$62,400","5_persons":"$73,160","6_persons":"$83,920","7_persons":"$94,680","8_persons":"$105,440","note":"For families with more than 8 persons, add $10,280 for each additional person[1]"},"verification_required":"Income must be verified annually; applicants not served within 12 months must reapply[1][6]"}
- Residential housing only: single-family homes, rowhomes, and trailers acceptable[2]
- Multi-family homes are NOT eligible[2]
- Homeowners and renters both eligible[2]
- Renters must have landlord permission and provide a copy of rental agreement[2]
- For renters, utilities must be in renter's name (if utilities included in rent, program cannot be used)[8]
- Someone age 18 or older must be present when contractors are in the home[1][6]

**Benefits:** Free energy efficiency improvements; average annual savings nationally is $283 per household[8]
- Varies by: household_need_and_priority

**How to apply:**
- Online: Apply using form at Energy Coordinating Agency website (ecasavesenergy.org)[4]
- Phone: Call Energy Coordinating Agency at 302-504-6111 to set up appointment[1]
- Phone: Call DNREC at 302-735-3480 for questions[1]
- In-person: Contact Energy Coordinating Agency to schedule appointment[1]

**Timeline:** Not explicitly stated in search results; applicants placed on waiting list after eligibility determination[1]
**Waitlist:** Yes. After deemed eligible, name placed on waiting list prioritized by: (1) household need, (2) age and special needs of residents, (3) annual funding levels. Not all applicants served in any one program year[1][6][8]

**Watch out for:**
- Multi-family homes are explicitly excluded — only single-family homes, rowhomes, and trailers qualify[2]
- For renters: utilities must be in renter's name; if utilities are included in rent, the program cannot be used because savings would benefit the landlord, not the renter[8]
- Landlord must sign off on work for renters[8]
- Program does NOT cover major repairs (full roof replacement, window replacement, regular heating system maintenance) — only minor repairs necessary to enable energy-saving measures[8]
- Waiting list exists and is not guaranteed to serve all applicants in a given year[1][6]
- If not served within 12 months, must reapply annually to verify income eligibility[1][6]
- Homeowner/renter must be present on multiple days during contractor visits; someone 18+ must be home each time[1][6]
- Income limits are based on Federal Poverty Level (200%) and are annually adjusted; the dollar amounts provided are current but may change year to year[1][3]
- Pre-WAP program exists for homes that don't yet qualify for full WAP — includes roof repair, window/door replacement, masonry repair to bring home into compliance[2]

**Data shape:** Benefits are fixed in-kind services (not tiered by income), but priority for waitlist placement varies by household characteristics (age, disabilities, children, need level). Income limits scale by household size with a formula for households over 8 persons. Program is statewide with no regional variations in eligibility or services. The key structural feature is the waiting list — eligibility does not guarantee service in any given year.

**Source:** https://dnrec.delaware.gov/climate-coastal-energy/sustainable-communities/weatherization/

---

### Delaware Senior Medicare Patrol (SMP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, families, and caregivers regardless of income[2][3]
- Assets: No asset limits or tests apply[2][3]
- Must be a Medicare beneficiary (age 65+, younger with disabilities or ESRD), family member, or caregiver; no other restrictions[2][3]

**Benefits:** Outreach, education, and counseling to prevent, detect, and report Medicare fraud, errors, and abuse; community awareness presentations, health fairs, one-on-one counseling, advocacy to resolve billing disputes, referrals to investigators; often includes SHIP health insurance counseling[2][7]

**How to apply:**
- Phone: Use national SMP Locator at 877-808-2468 to find Delaware contact[4]
- Online: SMP Locator at smpresource.org to locate Delaware SMP[2][4]
- In-person or local contact: Administered by Delaware DHSS Division of Services for Aging and Adults with Physical Disabilities (DSAAPD)[7][9]

**Timeline:** No formal application or processing time; services provided upon contact for education/counseling[2]

**Watch out for:**
- Not a financial assistance or healthcare benefits program—focuses solely on fraud prevention/education, not direct aid or eligibility for other benefits; often confused with SHIP (which it may co-provide); volunteers deliver services, not paid staff; report fraud promptly to avoid identity theft[2][7][9]

**Data shape:** no income/asset/age test for beneficiaries; volunteer-based education/advocacy service only; no enrollment or waitlist—immediate access via contact; integrates with SHIP counseling[2][3][7]

**Source:** https://dhss.delaware.gov/dsaapd (Delaware DHSS DSAAPD administers); national https://smpresource.org[2][7][9]

---

### Delaware Home Delivered Meals (Multiple Programs)

> **NEW** — not currently in our data

**Data shape:** Delaware does not have a single unified 'Home Delivered Meals' program. Instead, there are at least 5 separate programs with different eligibility criteria, age groups, benefits, and application processes. Families must: (1) determine which program(s) their loved one might qualify for based on age, income, Medicaid status, and specific circumstances; (2) contact the appropriate provider or health plan; (3) understand that Title III-C (Older Americans Act) is the primary program for seniors 60+, but Medicaid-enrolled individuals may have additional options through their health plan. The search results do not provide complete application procedures, processing times, or waitlist information for most programs.

---

### CARE Delaware Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Varies by specific service within the program; financial eligibility required for services like respite care, aligned with Delaware Medicaid thresholds (e.g., household income at or below 100% Federal Poverty Level for full Medicaid, higher for specific groups like children/pregnant women up to 200% FPL). No exact dollar table provided in sources; contact CARE Delaware for current amounts by household size[3][7].
- Assets: Financial resources must be under certain limits for long-term care programs (specific to Medicaid-linked services); details not quantified. Primary residence and certain assets may be exempt in Medicaid spend-down scenarios[5][7].
- Care recipient: Delaware residents aged 18+ with physical/mental impairments needing supervision/support in activities of daily living (ADLs) such as bathing, dressing, toileting, feeding, mobility[3].
- Caregiver: Adults 18+ providing care; special populations include adults 55+ caring for non-child adults 18+ with developmental disabilities, or grandparents/relatives 55+ caring for children 18 and under[1][3].
- Medical need: Assistance with at least 1-2 ADLs; functional impairment[3][5][6].

**Benefits:** Respite services (in-home or nursing home, regular or occasional); caregiver skills training; support groups; needs assessment and care planning; case management. No specific dollar amounts or hours per week stated; tailored via care plan[3].
- Varies by: priority_tier

**How to apply:**
- Phone: 800.223.9074 (DSAAPD or Joining Generations)[3]
- Website: www.dhss.delaware.gov/dsaapd[3]

**Timeline:** Not specified in sources

**Watch out for:**
- Eligibility varies by specific service (e.g., respite vs. training); not all caregivers qualify for all benefits—must contact for assessment[3].
- Financial/medical eligibility tied to Medicaid criteria; asset spend-down required but protectable (consult elder law expert)[5].
- Not a paid caregiver program; focuses on support/respite, unlike VA PCAFC or family pay programs[2][6].
- Special populations (e.g., grandparents 55+) have distinct rules[1].

**Data shape:** Eligibility requirements vary by program/service; no fixed income/asset tables—requires direct contact; statewide but assessment-driven; linked to DSAAPD for physically/mentally impaired adults 18+[3]

**Source:** https://www.dhss.delaware.gov/dsaapd

---

### Delaware Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and year; families must contact the local provider to confirm current thresholds based on recent income (last 6-12 months, including SSA, SSDI, SSI, etc.). No specific table provided in sources[1][2][3][4].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Reside in a National Able service area with available funding (Delaware covered)
- U.S. work authorized
- Willing to provide community service, attend meetings/training, develop Individual Employment Plan (IEP), use job search resources
- Have barriers to employment, low employment prospects, need job skills training
- Priority: veterans/qualified spouses, age 65+, disability, low literacy, limited English, rural resident, homeless/at risk, failed American Job Center services[1][2][3][4][6]

**Benefits:** Part-time on-the-job training (average 20 hours/week) at community sites (e.g., child care, customer service, teachers' aide, computer technician, maintenance, health care); paid highest of federal/state/local minimum wage; yearly physical; workshops on job seeking; skills assessment; bridge to unsubsidized employment (typically 6 months training)[1][2][3][4]
- Varies by: priority_tier

**How to apply:**
- Contact National Able (Delaware provider): See handbook for local contact or call general SCSEP line; application includes SCSEP Participant Form and DOL eligibility documents[1]
- First State Community Action Agency (Sussex region): delawareadrc.com/iresource/first-state-community-action-senior-community-service-employment-program-sussex/[8]
- Online form example: tfaforms.com/4891021 (general SCSEP, verify for DE)[5]
- Local SCSEP office or American Job Center[2][3]

**Timeline:** Eligibility determined after application review and staff approval; orientation follows; no specific timeline stated[1]
**Waitlist:** Possible if no spots available; depends on funding[1][2]

**Watch out for:**
- Not entitled to benefits until formal eligibility approval and orientation; annual re-eligibility review[1]
- Limited spots based on funding; possible waitlist[1][2]
- Must commit to community service, IEP, job search; not permanent job but training bridge[1][2]
- Income calculated for entire family/household, including all sources[1][5]

**Data shape:** Operated by grantees like National Able; priority tiers for enrollment; funding-dependent slots; no fixed income table or asset test in sources, requires provider contact for current 125% FPL figures

**Source:** https://laborfiles.delaware.gov/main/det/one-stop/FS-3_SenEmp.pdf (DE Labor SCSEP fact sheet); https://www.nationalable.org/wp-content/uploads/2020/02/SCSEP_DelawareHandbook_013120.pdf (DE handbook)[1][3]

---

### Delaware Long Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Not specified in available sources
- Assets: Not specified in available sources
- Resident of a long-term care facility (nursing home, assisted living residence, or other long-term care facility)[6]
- No specific citizenship or work authorization requirement for residents receiving services (work authorization only required for paid staff positions)[1]

**Benefits:** Volunteer ombudsman visits 1-2 hours per week or month to residents; advocacy for resident rights; complaint referral and resolution assistance; information about resident rights under federal and state law; assistance protecting resident rights[2][6]
- Varies by: fixed

**How to apply:**
- Phone: 1-800-223-9074[2][4]
- Website: www.dhss.delaware.gov/dhss[2]
- Mail/In-person: Long-Term Care Ombudsman Program, Main Administration Building, 1901 North [address incomplete in source][2]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- This is an ADVOCACY program, not a direct service or financial assistance program—it provides resident representation and complaint resolution, not healthcare or financial benefits[5][6]
- Residents do not apply; the program is available to all residents of participating long-term care facilities[6]
- Families contact the program on behalf of residents; there is no formal application process for residents or families[2]
- Volunteer ombudsmen visit 1-2 hours per week or month—this is not intensive case management or daily support[2]
- The program is funded federally through the Older Americans Act, not state-specific funding, which may affect program stability[4]
- Conflict of interest rules apply: volunteer ombudsmen cannot have immediate family employed at or residing in the assigned facility[2]

**Data shape:** This is a statewide advocacy and complaint resolution program, not an eligibility-based benefit program. There are no income, asset, or age limits for residents to receive ombudsman services. Families access the program by contacting the state office directly by phone or website; there is no formal application. The program operates through trained volunteer ombudsmen assigned to specific facilities. Key distinction: this program advocates FOR residents' rights rather than providing direct services or financial assistance.

**Source:** https://dhss.delaware.gov/dsaapd (Division of Services for Aging and Adults with Physical Disabilities)[4]

---

### Delaware Prescription Assistance Program (DPAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Income at or below 200% of the Federal Poverty Level (FPL), or prescription costs exceeding 40% of annual income. Couples counted as two individuals. Exact FPL dollar amounts published annually by HHS; program updates standard within 10 business days of FPL release. Individuals over 200% FPL qualify if drug costs >40% of countable income.[1][2][4][5]
- Assets: No asset limits mentioned in program requirements.[1][2][4][5]
- Delaware resident
- Age 65 or older, or under 65 and receiving Social Security Disability benefits (SSDI or SSI; former recipients switched to Survivors benefits may qualify)
- No prescription coverage other than Medicare Part D
- If eligible for Medicare Part A/B, must enroll in Medicare Part D and provide proof
- If potentially eligible for Low-Income Subsidy (LIS/Extra Help), must apply via Social Security
- Not eligible if receiving full Medicaid benefits or have other health insurance with prescription coverage (except Medicare Part D)
- U.S. citizen or lawful resident (proof required if not citizen)

**Benefits:** Up to $2,500-$3,000 per individual per benefit year (state fiscal year: July 1-June 30) toward prescription costs and Medicare Part D premiums. Co-pay: 25% of prescription cost or $5 minimum, whichever greater, paid at pharmacy.[1][2][3][4][5]
- Varies by: fixed

**How to apply:**
- Phone: 1-800-996-9969 to request application
- Mail: Download/print DPAP application form and mail to P.O. Box 950, New Castle, DE 19720-9914 (self-addressed envelope provided)
- Program address for reference: Lewis Building, DHSS Campus, 1901 N. DuPont Highway, New Castle, DE 19720

**Timeline:** Timely determination per regulations (§ 30000-30202), but no specific days stated; applications handled via mail only, no in-person.[3][5][6]
**Waitlist:** Not mentioned; funding from tobacco settlement may limit availability[2][3]

**Watch out for:**
- Must enroll in Medicare Part D within 90 days if eligible but not enrolled; proof required
- Apply for LIS/Extra Help if potentially eligible, even if denied
- Co-pay is 25% or $5 min per prescription, collected at pharmacy
- No eligibility if full Medicaid or other Rx coverage (except Part D)
- Benefit year is state fiscal (July 1-June 30); annual renewal required
- Over 200% FPL still possible if Rx costs >40% income, but prove it
- Mail-only applications; call for form
- Ineligible if inmate of public institution

**Data shape:** Income test at 200% FPL with alternative Rx cost threshold; no asset test; Medicare Part D mandatory bridge required; fixed annual cap per person with co-pay; statewide but centralized mail processing in New Castle

**Source:** https://dhss.delaware.gov/dss/dpap.html (inferred from application PDF at dhss.delaware.gov/wp-content/uploads/sites/11/dss/pdf/dpapapplication.pdf); regulations at regulations.delaware.gov/AdminCode/title16/30000

---

### Nursing Home Transition Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For Medicaid long-term care (DSHP-Plus), monthly income cannot exceed $2,901 (2025 general limit). Spousal minimum monthly income allowance is $2,177.55. Exact limits determined by Division of Medicaid and Medical Assistance (DMMA); varies by household size per state Medicaid rules.
- Assets: Countable assets cannot exceed $2,000 for individual. Spousal minimum asset allowance is $27,480 to $137,400 (half of countable assets). Home equity limit is $636,000. Must meet Medicaid financial criteria via DMMA.
- Eligible for and receiving Medicaid for at least one day prior to transition.
- Residing in a Medicaid-funded nursing home or institution (e.g., for mental diseases, intermediate care for intellectual disabilities) for at least 60 consecutive days.
- Require Institutional Level of Care but can live in community with Home and Community Based Services (HCBS).
- Express desire to transition to qualified community residence (own home, relative's home, apartment, or small group home with max 4 unrelated residents).

**Benefits:** Transition services for moving from nursing facility to community, including security deposit, telephone connection fee, groceries, furniture, linens, etc., up to $2,500 per transition. Part of DSHP-Plus LTSS HCBS, which may include nutritional supports, specialized medical equipment, minor home modifications, home-delivered meals.

**How to apply:**
- Contact Delaware First Health (DSHP-Plus MCO) case manager for prior authorization.
- Apply for DSHP-Plus Medicaid via DMMA.
- Phone: Delaware Aging and Disability Resource Center (ADRC) at (302) 633-7400 or Meals on Wheels reference (302) 656-3257 for related support.

**Timeline:** Not specified in sources.

**Watch out for:**
- Must already be Medicaid recipient and institutionalized 60+ days; not for those still at home.
- Services capped at $2,500 per transition; only 'what you need' covered.
- Requires prior authorization by MCO case manager and healthcare professional recommendation.
- Part of federal Money Follows the Person framework but state-administered via DSHP-Plus LTSS; confirm current limits as 2025 figures used.
- Institutional Level of Care required despite community transition.

**Data shape:** Tied to DSHP-Plus Medicaid LTSS; 60-day institutional stay mandatory; $2,500 transition cap; no standalone income table but uses Medicaid LTC thresholds.

**Source:** https://dhss.delaware.gov/dhss/dmma/index.shtml (DMMA/DSHP-Plus); program referenced in https://www.delawarefirsthealth.com/content/dam/centene/delaware/Policies/providernotification/DE.CP.MP.02_05.24.pdf

---

### Wilmington Senior Tax Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 62+
- Income: Household income may not exceed $93,725 per year
- Property must be located within Wilmington City Limits
- Property must be the primary residence of the applicant
- Applicant must be listed as the property owner on tax records
- Facing imminent foreclosure due to delinquent property taxes and/or water and sewer bills
- Must provide photo ID or other government-issued identification verifying age

**Benefits:** Maximum grant amount of $3,000 to cover delinquent property taxes and/or water and sewer bills
- Varies by: fixed

**How to apply:**
- Phone: (302) 577-5001 to set up an appointment with Delaware State Housing Authority (DSHA)

**Timeline:** Not specified in available sources

**Watch out for:**
- This program is specifically for homeowners facing imminent foreclosure — it is not a general tax relief program for all seniors
- The program targets seniors who have paid off their mortgages but cannot afford property taxes or water/sewer bills
- Maximum grant is $3,000, which may not cover all delinquent amounts
- Applicants aged 65 or older must also apply for the separate Property Tax Exemption program to be eligible
- The income limit of $93,725 is significantly higher than other Delaware senior tax programs (which typically cap at $19,000–$50,000), suggesting this program is designed for a broader income range facing specific hardship
- Program is administered jointly by City of Wilmington, Delaware State Housing Authority (DSHA), and United Way of Delaware (UWD)

**Data shape:** This is a crisis-intervention program, not a routine tax relief program. It requires proof of imminent foreclosure and delinquent bills. The high income limit ($93,725) combined with the foreclosure requirement distinguishes it from Delaware's other senior tax exemption programs. The $3,000 maximum grant is a one-time assistance amount, not an ongoing annual benefit. Program availability may depend on funding; no information on current enrollment capacity or waitlists is available.

**Source:** https://www.wilmingtonde.gov/residents/senior-citizen-exemptions-and-programs

---

### SCAT – Senior Citizens Affordable Taxi

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits or asset limits mentioned; eligibility based solely on age or disability criteria listed on the application[1][2][3]
- Assets: No asset limits; no information on what counts or exemptions as none apply[1]
- Physical or mental disability preventing operation of a motor vehicle (certified via application criteria)
- Certification required to verify age and/or disability
- Exclusions: acute/chronic alcoholism, drug addiction, contagious diseases risking others[1]

**Benefits:** 50% discount on taxi fares via purchase of SCAT tickets; present DART SCAT Photo ID to driver; rides for any purpose; use participating taxi companies; fare set by individual taxi company and paid with tickets[1][2][3][4][5]
- Varies by: fixed

**How to apply:**
- Downloadable application form at http://www.dartfirststate.com/scat/[1]
- In-person photo ID required post-approval at DTC offices: 400 S. Madison St, Wilmington or 900 Public Safety Boulevard, Dover, DE 19901[1]
- Purchase tickets after approval, then call participating taxi company[1]

**Timeline:** Not specified in sources

**Watch out for:**
- Must purchase SCAT tickets separately after approval; present Photo ID each ride or denied service[1]
- Certification solely based on application criteria; DTC may verify with certifiers[1]
- Fees for application completion not covered by DTC[1]
- Exclusions for certain conditions like addiction or contagious diseases[1]
- Applicant pays for trip to get Photo ID[1]
- Only participating taxi companies accepted[5]

**Data shape:** No income or asset test; eligibility purely age 65+ or certified disability preventing driving; ticket-based discount system requiring in-person ID issuance at 2 statewide offices; exclusions for specific health risks

**Source:** http://www.dartfirststate.com/scat/

---

### Delaware Foster Grandparent Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Must meet income eligibility for tax-free stipend (exact federal poverty guidelines not specified in sources; typically ≤125% of poverty level per federal rules, but Delaware-specific dollar amounts or household size table unavailable in results)
- Able to volunteer with at-risk children in community settings like schools, day cares, Head Start, and alternative education sites
- Pass criminal background check (including National Service Criminal History Check)
- Commit to service hours (not specified)

**Benefits:** Tax-free stipend (if income eligible); transportation reimbursements; meals while on duty; annual physical exams; accident and personal liability insurance; orientation and training; paid holidays; earned sick and vacation days; recognition events
- Varies by: income_eligibility

**How to apply:**
- Contact State Office of Volunteerism, Foster Grandparent Program, Sussex County (specific phone/location via delaware211.org; statewide through Delaware Health and Social Services and Division of State Service Centers)
- In-person at Division of State Service Centers
- Related state services via local Division of Social Services offices (locations on DHSS leaflets)


**Watch out for:**
- This is a volunteer program for seniors (55+) to mentor at-risk children, not foster care placement or financial aid for families raising grandchildren—often confused with Kinship Care or TANF
- Stipend is tax-free but income-tested only for stipend receipt (non-income-eligible can still volunteer without it)
- Seasonal adjustments by county (e.g., summer program reorganization)
- Requires background check and driver's license for some roles
- Distinct from PA Delaware County program

**Data shape:** Federal AmeriCorps Seniors program run statewide via DHSS/Division of State Service Centers; income eligibility only for stipend (volunteering open broader); county-level operations with Sussex example; no exact income tables or forms in sources

**Source:** https://delaware211.org/iresource/state-office-of-volunteerism-foster-grandparent-program-sussex-county/

---

### Over-60 Tuition Benefit

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; available to all qualifying Delaware residents regardless of income.
- Assets: No asset limits or tests.
- Delaware resident
- Must be admitted as a formal degree candidate (matriculated undergraduate or graduate student at University of Delaware, or eligible for credit courses at Delaware Technical Community College on space-available basis)
- High school diploma or equivalent for new UD applicants (SAT not required)
- For DTCC: Excludes Workforce Development, Community Education, and competitive admissions programs

**Benefits:** Waives tuition and mandatory fees (e.g., Student Center, Wellbeing, Comprehensive fees at UD); covers registration, late registration, and student services fees at DTCC. Student pays books, supplies, course-related fees (lab, shop), and optional costs like housing or dining.

**How to apply:**
- University of Delaware (new applicants): Online Over-60 Undergraduate Application at https://www.continuingstudies.udel.edu/60-tuition-free-degree/ (disabled after deadlines)
- UD previously admitted: Contact ACCESS Center at access-advise@udel.edu
- DTCC: Register during senior citizen period (1 week before 15-week fall/spring or 12-week summer sessions); registrations before period ineligible for waiver
- Deadlines: UD Fall May 1, Spring Nov 1 (space-available after); DTCC space-available basis

**Timeline:** UD: 6-8 weeks after all materials received; DTCC: Immediate at registration if space available
**Waitlist:** No formal waitlist; space-available basis only

**Watch out for:**
- Must be 60 at term start and formal degree candidate (not non-degree or audit at UD)
- Space-available only; apply early (UD processing 6-8 weeks; DTCC late registration period)
- Excludes certain DTCC programs (Workforce/Community Ed, competitive admissions); pays books/fees
- UD deadlines strict (May 1 fall, Nov 1 spring); late apps space-available
- Not for continuing ed or non-credit unless specified at DTCC

**Data shape:** Statewide tuition waiver at public institutions for degree-seeking seniors; no income/asset test; institution-specific apps, exclusions, and space rules; authorized by DE law for UD, DSU, DTCC (DSU details not in results)

**Source:** https://delcode.delaware.gov/title14/c034/sc10/index.html (enabling law); https://www.continuingstudies.udel.edu/60-tuition-free-degree/ (UD); https://dtcc.smartcatalogiq.com/en/current/catalog/financial/senior-citizen-tuition-policy (DTCC)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Delaware Medicaid for Elderly and Disabl | benefit | state | deep |
| Diamond State Health Plan Plus (DSHP Plu | benefit | state | medium |
| Delaware PACE Program | benefit | local | deep |
| Delaware Medicare Savings Programs (QMB, | benefit | federal | medium |
| Delaware Food First Program (SNAP) | benefit | federal | medium |
| Delaware Energy Assistance Program (DEAP | benefit | state | deep |
| Delaware Weatherization Assistance Progr | benefit | federal | medium |
| Delaware Senior Medicare Patrol (SMP) | benefit | federal | medium |
| Delaware Home Delivered Meals (Multiple  | benefit | state | simple |
| CARE Delaware Caregiver Support Program | benefit | state | deep |
| Delaware Senior Community Service Employ | employment | federal | deep |
| Delaware Long Term Care Ombudsman Progra | resource | federal | simple |
| Delaware Prescription Assistance Program | benefit | state | medium |
| Nursing Home Transition Program | benefit | state | deep |
| Wilmington Senior Tax Assistance Program | benefit | local | medium |
| SCAT – Senior Citizens Affordable Taxi | benefit | state | medium |
| Delaware Foster Grandparent Program | employment | state | medium |
| Over-60 Tuition Benefit | benefit | state | medium |

**Types:** {"benefit":15,"employment":2,"resource":1}
**Scopes:** {"state":10,"local":2,"federal":6}
**Complexity:** {"deep":6,"medium":10,"simple":2}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/DE/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **Individual service plan — while all participants receive case management, an individualized assessment determines which other HCBS services each participant receives[1]**: 1 programs
- **not_applicable**: 4 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size, income, heating_source, priority_tier**: 1 programs
- **household_need_and_priority**: 1 programs
- **fixed**: 4 programs
- **income_eligibility**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Delaware Medicaid for Elderly and Disabled**: Multiple subprograms (ABD basic vs LTC/NFLOC vs waivers/PACE); income/assets program-specific with spousal deeming; county phone variation; NFLOC tiers benefits
- **Diamond State Health Plan Plus (DSHP Plus)**: DSHP-Plus is a managed long-term services and supports (MLTSS) program that consolidated multiple prior 1915(c) waivers into a single 1115 demonstration waiver[5]. Benefits are not fixed by income or household size but rather determined through individualized service planning. The program serves a specific population (elderly and adults with physical disabilities) rather than being universally available to all Medicaid beneficiaries. Critical eligibility and benefit details (income limits, asset limits, processing times, required documents) are not publicly specified in available sources and require direct contact with DMMA.
- **Delaware PACE Program**: Limited to specific provider service areas (not statewide); no direct income/asset test for enrollment but tied to Medicaid for free coverage; requires state NFLOC certification and community safety assessment.
- **Delaware Medicare Savings Programs (QMB, SLMB, QI)**: This program structure consists of three distinct tiers (QMB, SLMB, QI-1) with progressively higher income limits but fewer benefits as you move up the income scale. QMB is the most comprehensive but has the lowest income threshold; QI-1 is the most limited but has the highest income threshold. Delaware's lack of asset limits is a significant structural advantage. QI-1's first-come, first-served funding model and annual re-application requirement make it structurally different from QMB and SLMB. All three programs automatically enroll qualifying beneficiaries in Extra Help for Part D prescription drugs.
- **Delaware Food First Program (SNAP)**: Elderly/disabled households: no gross income test, no asset limits, enhanced deductions (medical/shelter); broad categorical eligibility at 200% FPL gross; benefits scale by household size/income; expedited for very low income/resources; 12-month certification for seniors.
- **Delaware Energy Assistance Program (DEAP)**: Benefits scale by household size, income, and heating source. Program has three distinct components (winter heating, summer cooling, crisis) with different maximum benefits. Regional variation exists in service delivery through contracted agencies, but eligibility and benefits are statewide. No waiting list for regular DEAP, but weatherization component has waiting list. Priority given to vulnerable populations but not exclusive to them.
- **Delaware Weatherization Assistance Program**: Benefits are fixed in-kind services (not tiered by income), but priority for waitlist placement varies by household characteristics (age, disabilities, children, need level). Income limits scale by household size with a formula for households over 8 persons. Program is statewide with no regional variations in eligibility or services. The key structural feature is the waiting list — eligibility does not guarantee service in any given year.
- **Delaware Senior Medicare Patrol (SMP)**: no income/asset/age test for beneficiaries; volunteer-based education/advocacy service only; no enrollment or waitlist—immediate access via contact; integrates with SHIP counseling[2][3][7]
- **Delaware Home Delivered Meals (Multiple Programs)**: Delaware does not have a single unified 'Home Delivered Meals' program. Instead, there are at least 5 separate programs with different eligibility criteria, age groups, benefits, and application processes. Families must: (1) determine which program(s) their loved one might qualify for based on age, income, Medicaid status, and specific circumstances; (2) contact the appropriate provider or health plan; (3) understand that Title III-C (Older Americans Act) is the primary program for seniors 60+, but Medicaid-enrolled individuals may have additional options through their health plan. The search results do not provide complete application procedures, processing times, or waitlist information for most programs.
- **CARE Delaware Caregiver Support Program**: Eligibility requirements vary by program/service; no fixed income/asset tables—requires direct contact; statewide but assessment-driven; linked to DSAAPD for physically/mentally impaired adults 18+[3]
- **Delaware Senior Community Service Employment Program (SCSEP)**: Operated by grantees like National Able; priority tiers for enrollment; funding-dependent slots; no fixed income table or asset test in sources, requires provider contact for current 125% FPL figures
- **Delaware Long Term Care Ombudsman Program**: This is a statewide advocacy and complaint resolution program, not an eligibility-based benefit program. There are no income, asset, or age limits for residents to receive ombudsman services. Families access the program by contacting the state office directly by phone or website; there is no formal application. The program operates through trained volunteer ombudsmen assigned to specific facilities. Key distinction: this program advocates FOR residents' rights rather than providing direct services or financial assistance.
- **Delaware Prescription Assistance Program (DPAP)**: Income test at 200% FPL with alternative Rx cost threshold; no asset test; Medicare Part D mandatory bridge required; fixed annual cap per person with co-pay; statewide but centralized mail processing in New Castle
- **Nursing Home Transition Program**: Tied to DSHP-Plus Medicaid LTSS; 60-day institutional stay mandatory; $2,500 transition cap; no standalone income table but uses Medicaid LTC thresholds.
- **Wilmington Senior Tax Assistance Program**: This is a crisis-intervention program, not a routine tax relief program. It requires proof of imminent foreclosure and delinquent bills. The high income limit ($93,725) combined with the foreclosure requirement distinguishes it from Delaware's other senior tax exemption programs. The $3,000 maximum grant is a one-time assistance amount, not an ongoing annual benefit. Program availability may depend on funding; no information on current enrollment capacity or waitlists is available.
- **SCAT – Senior Citizens Affordable Taxi**: No income or asset test; eligibility purely age 65+ or certified disability preventing driving; ticket-based discount system requiring in-person ID issuance at 2 statewide offices; exclusions for specific health risks
- **Delaware Foster Grandparent Program**: Federal AmeriCorps Seniors program run statewide via DHSS/Division of State Service Centers; income eligibility only for stipend (volunteering open broader); county-level operations with Sussex example; no exact income tables or forms in sources
- **Over-60 Tuition Benefit**: Statewide tuition waiver at public institutions for degree-seeking seniors; no income/asset test; institution-specific apps, exclusions, and space rules; authorized by DE law for UD, DSU, DTCC (DSU details not in results)

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Delaware?
