# Minnesota Benefits Exploration Report

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
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 9 programs
- **financial**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medical Assistance (Medicaid)

- **income_limit**: Ours says `$1305` → Source says `$1,305` ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp[7]; https://www.mnsure.org/[2][4]))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Comprehensive health coverage including doctor visits, hospital care, prescription drugs, long-term services (nursing home, home health, Elderly Waiver services like assisted living support, personal care assistance), dental/vision/mental health. For long-term care, covers full nursing home costs if eligible; no fixed dollar/hour limits specified but need-based.[1][5][7][9]` ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp[7]; https://www.mnsure.org/[2][4]))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp[7]; https://www.mnsure.org/[2][4]`

### Elderly Waiver (EW)

- **income_limit**: Ours says `$1305` → Source says `$3,000` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services including: adult day programs/companionship, personal care assistance, housekeeping/chore help, non-medical transportation, home-delivered meals, home modifications (e.g., ramps, grab bars), emergency response systems, respite for family caregivers, customized living in assisted living, skilled nursing, specialized equipment/supplies, supports for housing transitions, training for family caregivers. No fixed dollar amounts or hours; individualized per care plan and budget (must be less than nursing home cost). 2026 rate adjustment up to $141 daily minimum for 24-hour customized living in qualified assisted living.` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1305` → Source says `$1,325` ([source](https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm (MN DHS Eligibility Policy Manual); https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/help-with-medicare-costs.jsp[2][9]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `- **QMB**: Part A premiums (if applicable), Part B premiums, Part A/B deductibles, coinsurance, copayments[1][2][7]
- **SLMB**: Part B premiums only[1][2]
- **QI**: Part B premiums only; retroactive coverage possible; auto-qualifies for Extra Help (Part D low-income subsidy)[1][2]
Premium amounts ~$144-$170/month (varies yearly)[5]. QMB providers cannot bill beneficiary for Medicare-covered services.` ([source](https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm (MN DHS Eligibility Policy Manual); https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/help-with-medicare-costs.jsp[2][9]))
- **source_url**: Ours says `MISSING` → Source says `https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm (MN DHS Eligibility Policy Manual); https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/help-with-medicare-costs.jsp[2][9]`

### Senior Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one personalized counseling and assistance on Medicare options (Parts A, B, C, D), Medigap, Medicare Savings Programs, Extra Help/Low Income Subsidy, Medicaid issues, long-term care insurance, appeals, coverage decisions, and fraud prevention via Senior Medicare Patrol; also includes public education presentations, outreach at events, and information on rights/protections[1][3][4][5]` ([source](https://mn.gov/adresources/search/f7c7358c-7c36-5ce3-bfac-c412310ca4c5[6]))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/adresources/search/f7c7358c-7c36-5ce3-bfac-c412310ca4c5[6]`

### Senior Nutrition Program (Meals on Wheels)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Home-delivered hot, nutritious noon meals up to 5 days/week (Monday-Friday); low-sodium options standard, diabetic meals available; safety checks and social connection via volunteers; one-on-one support from specialists on nutrition and services; congregate dining sites offer social activities, health programs, volunteer opportunities, and info on other services like grocery delivery[1][7].` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/senior-nutrition.jsp[7]))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/senior-nutrition.jsp[7]`

## New Programs (Not in Our Data)

- **Minnesota Senior Health Options (MSHO)** — service ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp))
  - Shape notes: County-restricted with plan-specific networks/providers; no fixed income/asset dollar tables in sources (tied to varying MA limits); dual-eligible managed care model differentiates from standard Medicare/Medicaid
- **Minnesota SNAP (Supplemental Nutrition Assistance Program)** — financial ([source](https://dcyf.mn.gov/snap or https://mn.gov/dhs (Minnesota DHS)))
  - Shape notes: No gross income test for households with elderly/disabled; benefits scale by household size and net income (heavy deductions for medical/shelter); county-administered statewide.
- **Family Adult Assistance Program (FAA) / Alternative Care Grants** — service ([source](https://mn.gov/dhs (DHS site; specific FAA page not in results)))
  - Shape notes: Program data sparse in results; county-administered with no statewide income/asset tables provided; targets elderly avoiding institutional care, unlike child-focused MFIP/FSG
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp))
  - Shape notes: County-specific subgrantees with varying providers (e.g., MET Inc., MNVAC); priority enrollment tiers; no fixed asset test; benefits fixed at ~20 hrs/wk minimum wage regardless of household size
- **Legal Assistance for Seniors** — service ([source](https://mylegalaid.org/how-we-help/seniors/))
  - Shape notes: Seniors 60+ no income test (unique exemption), county-restricted providers, prioritization by economic/social need
- **Office of Ombudsman for Long-Term Care** — advocacy ([source](https://mn.gov/ooltc/))
  - Shape notes: no income or asset test; advocacy-only with statewide regional delivery; free to all LTC consumers without application barriers
- **UCare Minnesota Senior Care Plus (MSC+)** — service ([source](https://www.ucare.org/health-plans/medicaid/ages-65-plus/msc-plus or https://hcopub.dhs.state.mn.us/))
  - Shape notes: County-restricted to CBP managed care areas; ties to Medical Assistance eligibility without fixed income/asset numbers here (state MA rules apply); benefits include EW waiver services with functional needs for some; varies by MCO provider and EW eligibility tier
- **Minnesota Aging Pathways (formerly Senior LinkAge Line)** — service ([source](https://mn.gov/aging-pathways/))
  - Shape notes: no income test for core I&A/counseling; eligibility only for referred paid services; statewide free access via single phone line with local handoffs; mandatory gateway for facility transitions

## Program Details

### Medical Assistance (Medicaid)


**Eligibility:**
- Age: 65+
- Income: For elderly (65+) applying for long-term care Medicaid (e.g., Nursing Home Medicaid): Single applicant income under $1,305/month (2026). Married couple both applying: income limits apply similarly but specifics vary; one spouse applying has community spouse protections. General MA for adults 65+: up to 138% FPL (includes 5% disregard). Limits based on SSI-related standards or FPL, varying by household size and program (e.g., Elderly Waiver ties to MA long-term care limits). Full table not provided in sources; use Medicaid Eligibility Test for precision.[1][2][3][8]
- Assets: For long-term care: Single $3,000; couple $6,000 (or $3,000 per person in some cases). Exemptions typically include primary home (subject to equity limits and estate recovery), one car, personal belongings, burial plots. Some assets like retirement accounts may count; spousal impoverishment rules protect community spouse assets up to certain amounts. Not all elderly require asset test (e.g., SSI automatic eligibility).[1][6]
- Nursing Home Level of Care or equivalent need for long-term services (e.g., Elderly Waiver).[1][5]
- Blindness or disability certification for some pathways.[3][4]
- Residency in Minnesota.[2]
- U.S. citizenship or qualified immigrant status.[2]

**Benefits:** Comprehensive health coverage including doctor visits, hospital care, prescription drugs, long-term services (nursing home, home health, Elderly Waiver services like assisted living support, personal care assistance), dental/vision/mental health. For long-term care, covers full nursing home costs if eligible; no fixed dollar/hour limits specified but need-based.[1][5][7][9]
- Varies by: priority_tier

**How to apply:**
- Online: MNsure.org[2][4]
- Phone: 1-855-366-7873[2]
- In-person: County Human Services office[2]
- Mail: Via county offices (address varies by county)

**Timeline:** Not specified in sources; typically 45 days for non-disability, 90 days if disability determination needed.
**Waitlist:** Possible for waiver services like Elderly Waiver due to funding caps; no statewide waitlist info provided.[5]

**Watch out for:**
- Not all 65+ need asset test, but long-term care does; SSI recipients often auto-eligible.[3]
- Estate recovery on home after death.[6]
- Spousal impoverishment rules complex for married couples.[1]
- Waiver programs like Elderly Waiver have waitlists and separate need assessment.[5]
- Income over limit? Spenddown or MA-EPD options exist.[4][5]
- Must authorize Account Validation Service (AVS) for asset check.[7]

**Data shape:** Eligibility splits by general MA (income-focused, no/low asset test) vs. long-term care (strict asset/income + level of care); scales by marital status/household; county-administered with statewide standards; multiple pathways (SSI, waivers, EPD).

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp[7]; https://www.mnsure.org/[2][4]

---

### Elderly Waiver (EW)


**Eligibility:**
- Age: 65+
- Income: Must qualify for Medical Assistance (MA) for long-term care services. Income limit based on federal poverty guidelines (FPG) by family size; if over limit, eligible via spenddown or waiver obligation (monthly payment toward care costs). People with income ≤120% FPG and assets <$3,000 are not eligible for Alternative Care but can access it briefly; SIS (Special Income Standard) qualifies without spenddown. Exact 2026 FPG dollar amounts not specified in sources—check current MA LTC guidelines.
- Assets: Asset limit of $3,000 for most people. Specific details on what counts as assets or exemptions (e.g., home equity) follow standard MA LTC rules; sources do not list full exempt items.
- Eligible for MA payment of long-term care (LTC) services
- Assessed via Long-Term Care Consultation (LTCC) or MnCHOICES and determined to need nursing facility level of care (NF-I or NF-II)
- Need for supports beyond standard MA benefits per LTCC
- Cost of community-based services < estimated nursing home cost
- Choose community care over nursing facility
- Minnesota resident
- U.S. citizen or qualified immigrant (standard MA rules)

**Benefits:** Home and community-based services including: adult day programs/companionship, personal care assistance, housekeeping/chore help, non-medical transportation, home-delivered meals, home modifications (e.g., ramps, grab bars), emergency response systems, respite for family caregivers, customized living in assisted living, skilled nursing, specialized equipment/supplies, supports for housing transitions, training for family caregivers. No fixed dollar amounts or hours; individualized per care plan and budget (must be less than nursing home cost). 2026 rate adjustment up to $141 daily minimum for 24-hour customized living in qualified assisted living.
- Varies by: priority_tier

**How to apply:**
- Contact county or tribal agency for LTCC/MnCHOICES assessment (find contacts via Long-Term Care Consultation contacts on mn.gov/dhs)
- Apply for MA for LTC services via county human services office (face-to-face interview encouraged but not required; phone, mail, or in-person)
- Minnesota Aging Pathways helpline: 800-333-2433 for local connections

**Timeline:** Not specified; eligibility cannot begin before LTCC completed, care plan developed, and MA LTC eligibility determined
**Waitlist:** Not mentioned in sources

**Watch out for:**
- Must already qualify for MA LTC (not automatic for low-income seniors—financial assessment required)
- Services only if community cost < nursing home cost; otherwise ineligible
- Over-income applicants need monthly spenddown or waiver obligation (billed by provider)
- No eligibility start until full LTCC + MA determination
- Complex process—encourage face-to-face interview; refer to county early
- Not for those ≤120% FPG/<$3,000 assets (redirect to Alternative Care)

**Data shape:** Tied to MA LTC eligibility with spenddown/obligation; services individualized by LTCC care plan and cost cap vs. nursing home; county-administered with provider enrollment required; no fixed benefits—varies by assessed need and budget

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp

---

### Minnesota Senior Health Options (MSHO)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No specific dollar amounts or household size table stated for MSHO itself; eligibility requires qualifying for Medical Assistance (MA/Medicaid) without spenddown. MA income limits apply and vary by household size—check current MA thresholds via DHS as they are not detailed here. Dual eligibles must meet both Medicare and MA criteria.
- Assets: No specific asset limits stated for MSHO; follows MA/Medicaid asset rules, which include countable assets (e.g., bank accounts, investments) and exemptions (e.g., primary home under certain equity limits, one vehicle, personal belongings). Exact MA asset details not provided—verify with county human services.
- Eligible for Medical Assistance (MA/Medicaid), with or without Medicare (but must have Medicare Parts A and B if Medicare-eligible)
- United States citizen or lawfully present in the US
- Minnesota resident living in a county served by an MSHO health plan
- Voluntary enrollment; no functional eligibility criteria for base program, but required for some services (e.g., personal care assistance needs help with 1+ ADL like bathing, dressing)

**Benefits:** Combines Medicare Parts A/B and Medicaid services into one managed care plan via health plans (e.g., HealthPartners, Medica, UCare, BlueCross); includes physical exams, doctor visits, prescription drugs (low copays based on income/Extra Help), dental at in-network ($0 copays), emergencies, elderly waiver services, 180 days nursing facility services (if entering from community; not if already in facility at enrollment), care coordinator for goals/appointments, OTC allowance, wellness rewards (e.g., SilverSneakers, Virtuwell), transportation, in-home care.
- Varies by: region

**How to apply:**
- Apply for underlying Medical Assistance first: Online at MNsure.org, Application for Certain Populations (DHS form), contact county human services office, or phone DHS
- Once MA-eligible, voluntarily enroll in MSHO plan: Contact health plan (e.g., HealthPartners, Medica, UCare), during Medicare open enrollment or qualifying periods
- Phone: County human services offices (find via mn.gov/dhs) or health plan member services
- In-person: County offices

**Timeline:** Not specified in sources; MA application processing varies by county (typically 30-45 days for Medicaid)
**Waitlist:** No waitlist mentioned for MSHO enrollment (voluntary); waiver services may have limits based on funding

**Watch out for:**
- Must first qualify for MA/Medicaid—no direct MSHO app without it; denials common if over MA income/assets
- Requires Medicare Parts A and B (not just eligible—must be enrolled)
- County-specific availability—not statewide; check plan service area/map
- Nursing facility coverage limited to 180 days if entering post-enrollment; not covered if already in facility
- Enrollment voluntary; non-choosers go to MSC or MSC+ (similar but MSC+ lacks full Medicare integration)
- Some services need functional assessment (e.g., ADLs for personal care); no base functional need for program entry
- Copays on drugs based on income/Extra Help; $0 for most in-network medical/dental

**Data shape:** County-restricted with plan-specific networks/providers; no fixed income/asset dollar tables in sources (tied to varying MA limits); dual-eligible managed care model differentiates from standard Medicare/Medicaid

**Source:** https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Income limits are monthly and based on Federal Poverty Guidelines (FPG), specific to Minnesota with higher asset limits than federal standards. Limits from most recent consistent state sources (2024-2025 data, subject to annual adjustment):
- **QMB**: ≤100% FPG ($1,325 single / $1,783 married)[1][10]
- **SLMB**: >100% to ≤120% FPG ($1,585 single / $2,135 married)[1]
- **QI**: >120% to ≤135% FPG ($1,781 single / $2,400 married)[1]
Note: Federal 2026 limits are lower (QMB: $1,350 single / $1,824 couple) but states like MN often exceed them[7]. Income countable after standard disregards; limits change annually, typically July 1[5]. No household size table beyond single/couple in sources; assumes Medicare eligible individuals.
- Assets: MN-specific: $10,000 single / $18,000 married (higher than federal $9,430-$9,950 single / $14,130-$14,910 couple)[1][5]. Counts: Bank accounts, stocks, bonds. Exempt: Home, one car, personal belongings, burial plots, life insurance (up to certain value), retirement accounts in payout. Exact countable rules in MN DHS MSP Financial Eligibility subchapter[2].
- Enrolled or eligible for Medicare Part A (QMB/SLMB/QI; Part B required for premium help)[1][2][6]
- U.S. citizen or qualified immigrant
- Minnesota resident
- Not eligible for both QI and MinnesotaCare (Part B enrollment barrier)[2][4]

**Benefits:** - **QMB**: Part A premiums (if applicable), Part B premiums, Part A/B deductibles, coinsurance, copayments[1][2][7]
- **SLMB**: Part B premiums only[1][2]
- **QI**: Part B premiums only; retroactive coverage possible; auto-qualifies for Extra Help (Part D low-income subsidy)[1][2]
Premium amounts ~$144-$170/month (varies yearly)[5]. QMB providers cannot bill beneficiary for Medicare-covered services.
- Varies by: program_tier

**How to apply:**
- Mail or take to local county/tribal human services office[6]
- Online: Minnesota Health Care Programs Application (mhcp.dhs.state.mn.us, search MSP application)[6]
- Phone: Contact local county human services or MN DHS at 651-431-2670 or 800-657-3739 (general health care programs line)
- In-person: Local county/tribal office (find via mn.gov/dhs)

**Timeline:** Not specified in sources; typically 30-45 days for health programs, but varies by county[6]
**Waitlist:** QI has limited funding, first-come first-served; possible waitlist or denial if funds exhausted[5]

**Watch out for:**
- QI funding limited—apply early in fiscal year (first-come, first-served); may run out[1][5]
- Income disregards ($20 general + half earned income) can make you eligible if gross slightly over[1]
- QMB protects from provider billing, but non-Medicare providers can bill you[1][2]
- Cannot have both QI and MinnesotaCare[2][4]
- Assets higher in MN than federal, but still count most liquid resources[1]
- Must report changes in income/assets promptly to avoid overpayments
- Outdated limits in some sources—verify current via county/DHS as they adjust yearly[1][5][7]

**Data shape:** Tiered by income brackets (100%/120%/135% FPG) with MN exceeding federal asset limits; QI capped funding creates waitlist risk; county-administered with uniform benefits statewide

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm (MN DHS Eligibility Policy Manual); https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/help-with-medicare-costs.jsp[2][9]

---

### Minnesota SNAP (Supplemental Nutrition Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No gross income limit for households with a member 60+ or disabled. Net income limits (Oct 1, 2025 - Sept 30, 2026): 1: $1,305; 2: $1,763; 3: $2,221; 4: $2,680; 5: $3,138; 6: $3,596; 7: $4,055; 8: $4,513; +1: add $458. Deductions include standard $209, 20% earned income, medical >$35/mo for elderly/disabled, shelter costs (rent/mortgage, utilities, taxes, insurance).[2][7]
- Assets: Households with elderly (60+) or disabled: $4,500 limit. Without: $3,000. Exemptions not detailed in sources; countable assets typically include cash, bank accounts (home ownership often exempt for seniors).[5]
- Minnesota resident and U.S. citizen or qualified non-citizen.
- Household defined as those who live together, buy/prepare food together (seniors 60+ may qualify separately even if living with others).
- Social Security, pensions, VA/disability count as income.
- Work requirements may apply (e.g., 80 hours/mo for ages 55-64 without dependents under new rules), with exceptions for elderly/disabled.
- Automatic eligibility if household on SSI, MSA, or GA.

**Benefits:** Monthly EBT card for food purchases (amount based on net income, household size, deductions; e.g., max allotment for 2-person elderly/disabled ~$546 minus 30% net income. Exact amounts vary; ~$100 more net income = $30 less benefits).
- Varies by: household_size

**How to apply:**
- Online: MNsure or county portals (specific URL via dhs.state.mn.us or local offices).
- Phone: Contact local county SNAP office (find via mn.gov/dhs or 1-800-657-3739).
- Mail/In-person: Local county or Tribal office; use Combined Application Form (under 60) or Senior SNAP Application (60+).
- Download forms from benefitscheckup.org or county sites.

**Timeline:** Not specified in sources; contact local office for details.

**Watch out for:**
- Seniors 60+ often miss benefits (only ~47-50% eligible participate); can form separate household even living with family.
- No gross income test for elderly/disabled, but net income key—deduct medical/shelter costs.
- Assets higher limit ($4,500) for elderly/disabled, but IPV/felon disqualifies unit.
- New 2025 rules may add work reqs for 55-64.
- Include all who buy/prepare food, unless helper for disabled.

**Data shape:** No gross income test for households with elderly/disabled; benefits scale by household size and net income (heavy deductions for medical/shelter); county-administered statewide.

**Source:** https://dcyf.mn.gov/snap or https://mn.gov/dhs (Minnesota DHS)

---

### Senior Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, including those under age 65 with disabilities and dually eligible for Medicare and Medicaid[1][3][5]
- Assets: No asset limits or tests apply[3]
- Must be a Medicare beneficiary or family/caregiver of one[1][3][5]

**Benefits:** Free one-on-one personalized counseling and assistance on Medicare options (Parts A, B, C, D), Medigap, Medicare Savings Programs, Extra Help/Low Income Subsidy, Medicaid issues, long-term care insurance, appeals, coverage decisions, and fraud prevention via Senior Medicare Patrol; also includes public education presentations, outreach at events, and information on rights/protections[1][3][4][5]

**How to apply:**
- Phone: Toll-free (800) 333-2433[2][7][8]
- Website: www.mnaging.org or www.minnesotahelp.info[7][8]
- In-person or mail via local Area Agencies on Aging or Senior LinkAge Line sites statewide[1][2]

**Timeline:** Immediate counseling available via phone or in-person; no formal application processing[3][4]

**Watch out for:**
- Not a financial aid or direct payment program—only free counseling and education, no coverage or premiums paid; funding risks from federal budgets can impact availability; end of Medicare Cost plans in some years required plan changes[1][3][4]
- Must contact via Senior LinkAge Line for Minnesota-specific service, not generic national SHIP[1][2][7]

**Data shape:** no income test; counseling only, no direct benefits; delivered via statewide Senior LinkAge Line network of local Area Agencies on Aging with volunteer counselors[1][3][5]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/adresources/search/f7c7358c-7c36-5ce3-bfac-c412310ca4c5[6]

---

### Senior Nutrition Program (Meals on Wheels)


**Eligibility:**
- Age: 60+
- Income: No formal income limits; programs focus on need rather than strict financial thresholds. Participants may contribute via donations, but no one is turned away due to inability to pay[2][5][7].
- Assets: No asset limits mentioned across sources.
- Unable to prepare hot, nutritious meals regularly due to mobility or other challenges[1][3][7]
- Unable to drive to meal sites, restaurants, or grocery stores[1]
- Able to feed themselves or have someone available to assist[1]
- Reside in the service area of the local provider (may exclude rural areas outside city limits)[1]
- Spouse or caregiver may qualify if caregiving prevents meal preparation[1][7]
- Temporary needs (e.g., post-illness recovery) accepted if criteria met[1]
- Not living in a facility that provides meals[4]

**Benefits:** Home-delivered hot, nutritious noon meals up to 5 days/week (Monday-Friday); low-sodium options standard, diabetic meals available; safety checks and social connection via volunteers; one-on-one support from specialists on nutrition and services; congregate dining sites offer social activities, health programs, volunteer opportunities, and info on other services like grocery delivery[1][7].
- Varies by: region

**How to apply:**
- Contact local providers by phone, e.g., Three Rivers CAP: (507) 316-0610 or (800) 277-8418[1]; Meals on Wheels of Ramsey County via their site or member programs[9]
- Online enrollment process for some providers like Metro Meals on Wheels[2]
- Refer someone else if they qualify[3]
- In-person or through local Area Agencies on Aging, senior centers, or county offices (varies by region)

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; regional variation likely due to local capacity.

**Watch out for:**
- Not all areas offer gluten-free meals or menu customization[1]
- Delivery may be cancelled in severe weather[1]
- Rural or out-of-city-limit residents may need family/aides for delivery or face unavailability[1]
- Funded via Older Americans Act; donations requested monthly but optional[1][8]
- Separate from SNAP (though SNAP can pay for meals); no universal online statewide application—must contact local provider[2]
- Eligibility varies slightly by provider despite statewide program[1][3]

**Data shape:** Decentralized by region with local providers handling eligibility, delivery, and variations; no statewide income/asset tests; service area and rural access are key restrictions

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/senior-nutrition.jsp[7]

---

### Family Adult Assistance Program (FAA) / Alternative Care Grants

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income or asset limits found in search results for FAA/Alternative Care Grants; related programs like MFIP have asset limit of $10,000 (minus deductions) but target families with children, not elderly[1]. FSG (Family Support Grant) has income limit of $130,807 annual adjusted gross income as of Jan 1, 2025, for families of children with disabilities[7].
- Assets: Not specified for FAA; MFIP (unrelated) counts assets under $10,000 minus deductions[1].
- Search results lack direct details on FAA/Alternative Care Grants for elderly; eligibility likely requires Minnesota residency, functional impairment or nursing facility level of care need, and assessment by county or tribal agency. Related adult programs like Adult Day Care under CACFP target adults 60+ or functionally impaired but focus on meals[8].

**Benefits:** No specific benefits detailed; Alternative Care Grants typically fund home and community-based services (e.g., personal care assistance, homemaker, respite) to avoid nursing home placement, but exact services, hours, or dollar amounts not in results. FSG provides cash grants for family supports[7].

**How to apply:**
- County human services offices (contact local county; no central phone/URL in results)
- No specific online URL, phone, or mail details found

**Timeline:** Not specified
**Waitlist:** Not specified; regional variations likely

**Watch out for:**
- Search results do not contain direct, specific info on FAA/Alternative Care Grants; most hits are for MFIP (family cash/food aid) or FSG (disability grants for children)[1][7]. FAA is for elderly/disabled adults needing long-term care services—families must contact county offices directly as no centralized details here. Confused with MFIP which requires work participation[1][3].

**Data shape:** Program data sparse in results; county-administered with no statewide income/asset tables provided; targets elderly avoiding institutional care, unlike child-focused MFIP/FSG

**Source:** https://mn.gov/dhs (DHS site; specific FAA page not in results)

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. For a family of 1, this was approximately $14,850 (based on older data; current levels adjust annually with poverty guidelines, available via USDOL or grantees). Exact table varies by household size and year—contact local provider for current figures[4][6].
- Assets: No asset limits mentioned in sources[1][2][3][4][5][6][7].
- Unemployed
- Low employment prospects
- U.S. citizen or legally eligible to work
- Priority for veterans/qualified spouses, individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, or those who failed to find employment via American Job Centers[4]

**Benefits:** Part-time community service work-based job training (average 20 hours/week) at nonprofits, schools, hospitals, senior centers, day care; paid highest of federal, state, or local minimum wage; career coaching, supportive services, job placement assistance to transition to unsubsidized employment[1][2][3][4][5][6].
- Varies by: priority_tier

**How to apply:**
- Contact local grantee/provider: MET, Inc. at 832-599-0872 for most counties; Minnesota Valley Action Council at 507-345-6822 or senior@mnvac.org for Blue Earth, Brown, Faribault, Martin, Nicollet, Watonwan counties; visit Mankato office at 706 N Victory Dr., Mankato, MN[5][7]
- MN DEED SCSEP page for overview: https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp[1]
- SCSEP Application form via MNVAC: implied online/submit via email or in-person[5]

**Timeline:** Not specified in sources
**Waitlist:** Possible regional waitlists implied by priority system and limited slots; East Side Neighborhood Services notes program pauses/furloughs (e.g., July 1), no longer sponsoring in Hennepin[3]

**Watch out for:**
- Not statewide uniform—must identify county-specific provider; some counties may lack coverage or have changed sponsors (e.g., Hennepin no longer ESNS)[3][7]
- Temporary training only, goal is transition to unsubsidized job—not permanent employment[1][2][4]
- Priority tiers mean non-priority applicants may face long waits or denial despite eligibility[4]
- Income is family-based at 125% FPL (stricter than some programs); verify current poverty levels as they update yearly[4][6]
- Program funded by USDOL grants with potential funding pauses/furloughs[3]

**Data shape:** County-specific subgrantees with varying providers (e.g., MET Inc., MNVAC); priority enrollment tiers; no fixed asset test; benefits fixed at ~20 hrs/wk minimum wage regardless of household size

**Source:** https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp

---

### Legal Assistance for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits for seniors aged 60+; services available regardless of income, though income is considered for case prioritization. Low-income individuals (based on Federal Poverty Guidelines) also qualify without age requirement in some programs.
- Assets: No asset limits mentioned; financial eligibility focuses on income guidelines for non-seniors.
- Must reside in or have case venued in the service area counties (e.g., 20-26 central Minnesota counties for Mid-Minnesota Legal Aid, varying by provider)
- Civil cases only; excludes criminal, personal injury, or cases awarding damages
- Focus on seniors with greatest social/economic need for prioritization

**Benefits:** Civil legal services including: elder abuse protection, assisted living/nursing home discharges, public benefits (food support, cash assistance, Social Security, unemployment denials, Medical Assistance denials, home care reductions), debtor/creditor issues, debt collection, housing discrimination/evictions, domestic violence, Senior Wills Clinics (wills, powers of attorney, health care directives, transfer on death deeds). Provided via advice, consultation, representation, brief services, pro se assistance.
- Varies by: priority_tier

**How to apply:**
- Online intake/application at https://mylegalaid.org/get-legal-help or provider-specific sites
- Phone: (877) 696-6529 (main intake, Justice North/Mid-Minnesota), (800) 292-4150 (MN Disability Law Center), local offices e.g., (612) 332-4668 or (612) 334-5970 (Minneapolis)
- In-person: Local offices e.g., 111 N 5th St, Ste 100, Minneapolis, MN 55403 for appointments like Wills Clinics

**Timeline:** Not specified; intake determines eligibility promptly via phone/online.

**Watch out for:**
- Not statewide—must check county/service area; seniors 60+ exempt from income test but income affects priority; civil only, no criminal/personal injury; complete intake to confirm as best method; referrals if case outside area

**Data shape:** Seniors 60+ no income test (unique exemption), county-restricted providers, prioritization by economic/social need

**Source:** https://mylegalaid.org/how-we-help/seniors/

---

### Office of Ombudsman for Long-Term Care

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; services are free and available to all.
- Assets: No asset limits or tests; no assets count or are exempt as there is no financial eligibility.
- Must be an adult needing or receiving long-term care services in Minnesota.
- Includes residents of long-term care settings (e.g., nursing homes, assisted living), recipients of home care, and those seeking information about long-term care.
- Open to current and prospective residents, individuals, families, providers, and public agencies.

**Benefits:** Free services including complaint investigation, individual advocacy to resolve issues and protect rights, education on resident rights and long-term care information, empowerment through problem-solving and self-advocacy support, systemic advocacy for policy improvements. Regional ombudsmen and trained volunteers (e.g., 6 hours monthly visits in facilities) assist with health, safety, well-being, and rights preservation. No financial aid, specific hours, or dollar amounts provided.
- Varies by: region

**How to apply:**
- Phone: Toll-free 1-800-657-3591 or (651) 431-2555
- Mail: PO Box 64971, St. Paul, MN 55164-0971
- Website: https://mn.gov/ooltc/ (for information, resources, and contact)
- In-person: Contact regional ombudsman offices via phone for local access

**Timeline:** Not specified; complaint response is prompt but varies by case complexity.

**Watch out for:**
- Not a financial assistance or direct service program (e.g., no Medicaid application help or funding); purely advocacy and complaint resolution.
- Must be free of conflicts of interest for ombudsman involvement.
- Volunteers are screened and trained but work under regional oversight.
- Focuses on rights protection in long-term care settings, not general elder care or non-LTC issues.
- Anyone can contact, but services target those in or seeking LTC.

**Data shape:** no income or asset test; advocacy-only with statewide regional delivery; free to all LTC consumers without application barriers

**Source:** https://mn.gov/ooltc/

---

### UCare Minnesota Senior Care Plus (MSC+)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No specific dollar amounts or household size table provided in sources; eligibility requires qualifying for Minnesota Medical Assistance (Medicaid), which has income and asset limits based on state guidelines. Applicants should use the American Council on Aging Medicaid Eligibility Test or contact county human services for exact limits.
- Assets: No specific dollar amounts provided; follows Minnesota Medical Assistance asset rules (limits apply based on household status; details via county office). What counts and exemptions follow standard Medicaid rules, but not detailed here.
- Eligible for Medical Assistance (Medicaid)
- Minnesota resident living in UCare MSC+ service area or managed care counties (CBP counties for MSC+)
- May or may not have Medicare Part A and Part B
- For some waiver services (e.g., personal care assistance), must demonstrate functional need such as assistance with at least one Activity of Daily Living (ADL: mobility, transferring, eating, toileting, bathing, grooming, dressing) or qualifying behavior

**Benefits:** All Medical Assistance benefits including robust medical, mental health, pharmacy, dental (e.g., 2 preventive dental visits and fluoride varnishes per year), eye care; Elderly Waiver services if eligible (personal care assistance, home/community-based services like homemaker or assisted living, transportation); additional: disease management, no-cost office visits, 24/7 Nurse Line, dental connection, fall prevention kit, healthy food discounts via Healthy Benefits+ Visa card, rewards for preventive screenings, mobile dental clinic, food resources, quit smoking program, free rides to appointments (network providers), translation services, community care connector.
- Varies by: region

**How to apply:**
- Call or visit local county human services office
- Call Minnesota Health Care Programs at 1-800-657-3672 or TTY 1-800-627-3529 or 711
- Print and fill out application from Minnesota Department of Human Services (DHS) website (specific link not provided in sources)
- Contact UCare Customer Service: 612-676-3200 or 1-800-203-7225 (8am-5pm Mon-Fri) or TTY 612-676-6810 or 1-800-688-2534

**Timeline:** Not specified in sources

**Watch out for:**
- Not statewide—only in specific managed care counties (CBP, not PMAP); check county
- Requires underlying Medical Assistance (Medicaid) eligibility first—apply/confirm that separately via county
- Does not include Medicare coverage (works separately if eligible); no Medicare Parts A/B required but may have Part D option
- Some services (e.g., personal care) need separate functional assessment, no blanket functional eligibility for program enrollment
- Mandatory enrollment in MSC+ if eligible and not choosing MSHO in applicable counties
- Different MCOs (UCare, Blue Plus, etc.) have networks—ensure providers are in-network

**Data shape:** County-restricted to CBP managed care areas; ties to Medical Assistance eligibility without fixed income/asset numbers here (state MA rules apply); benefits include EW waiver services with functional needs for some; varies by MCO provider and EW eligibility tier

**Source:** https://www.ucare.org/health-plans/medicaid/ages-65-plus/msc-plus or https://hcopub.dhs.state.mn.us/

---

### Minnesota Aging Pathways (formerly Senior LinkAge Line)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits for Minnesota Aging Pathways itself; it is a free information, referral, and counseling service open to older adults, caregivers, and families. For referred long-term care services (e.g., home care or nursing facility), eligibility is determined separately by county social services or managed care organizations with varying income/asset rules, such as Medicaid limits (e.g., 2026 single nursing home applicant: income under $1,305/month, assets under $3,000).[1][4][5]
- Assets: No asset limits for the core service; asset rules apply only to specific publicly funded programs accessed via referral (e.g., Medicaid excludes primary home, one vehicle, personal belongings; countable assets include secondary properties, excess cash).[1]
- Minnesota resident
- Typically age 60+ or Medicare-eligible for counseling
- For resource coordination: in home or community setting, may need nursing home level of care assessment for transitions
- Preadmission screening (PAS) required for nursing facility admissions regardless of finances[2][5]

**Benefits:** Free information and assistance (I&A), Medicare counseling (SHINE-certified), resource coordination (person-centered plans to stay/return home, service connections, caregiver support), preadmission screening (PAS) for nursing facilities, long-term care options counseling (required for assisted living moves), referrals to Minnesota Aging and Disability Resources, financing options guidance. No fixed dollar amounts or hours; support is in-depth as needed with follow-up.[2][4][5][6]

**How to apply:**
- Phone: 800-333-2433 (Mon-Fri 8:00 a.m. to 4:30 p.m.; press option 1 for housing)
- Online referral: www.sllreferral.org (for providers, facilities, caregivers)
- Referrals from nursing facilities, hospitals, assisted living, clinics, home care, hospice, ombudsman[5][6]

**Timeline:** Phone assistance immediate; resource coordination involves discussion and plan development (typically prompt follow-up after referral); PAS review leads to in-person county assessment or call as needed[2][5]

**Watch out for:**
- Not a direct service provider—offers info/referrals only; actual eligibility/funding for home care etc. determined by counties/managed care, not Aging Pathways[4]
- Required for nursing facility admissions (PAS) and assisted living moves (options counseling)—providers must refer[2][5]
- Free but no guaranteed service hours or funding; for low-income, refers to separate eligibility processes[4][7]
- Name change from Senior LinkAge Line may confuse searches[6]

**Data shape:** no income test for core I&A/counseling; eligibility only for referred paid services; statewide free access via single phone line with local handoffs; mandatory gateway for facility transitions

**Source:** https://mn.gov/aging-pathways/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medical Assistance (Medicaid) | benefit | state | deep |
| Elderly Waiver (EW) | benefit | state | deep |
| Minnesota Senior Health Options (MSHO) | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Minnesota SNAP (Supplemental Nutrition A | benefit | federal | deep |
| Senior Health Insurance Assistance Progr | resource | federal | simple |
| Senior Nutrition Program (Meals on Wheel | benefit | federal | medium |
| Family Adult Assistance Program (FAA) /  | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Seniors | resource | local | simple |
| Office of Ombudsman for Long-Term Care | resource | federal | simple |
| UCare Minnesota Senior Care Plus (MSC+) | navigator | local | simple |
| Minnesota Aging Pathways (formerly Senio | resource | state | simple |

**Types:** {"benefit":7,"resource":4,"employment":1,"navigator":1}
**Scopes:** {"state":4,"local":3,"federal":6}
**Complexity:** {"deep":7,"simple":5,"medium":1}

## Content Drafts

Generated 13 page drafts. Review in admin dashboard or `data/pipeline/MN/drafts.json`.

- **Medical Assistance (Medicaid)** (benefit) — 5 content sections, 6 FAQs
- **Elderly Waiver (EW)** (benefit) — 4 content sections, 6 FAQs
- **Minnesota Senior Health Options (MSHO)** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Minnesota SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Senior Health Insurance Assistance Program (SHIP)** (resource) — 1 content sections, 6 FAQs
- **Senior Nutrition Program (Meals on Wheels)** (benefit) — 3 content sections, 6 FAQs
- **Family Adult Assistance Program (FAA) / Alternative Care Grants** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Legal Assistance for Seniors** (resource) — 2 content sections, 6 FAQs
- **Office of Ombudsman for Long-Term Care** (resource) — 1 content sections, 6 FAQs
- **UCare Minnesota Senior Care Plus (MSC+)** (navigator) — 1 content sections, 6 FAQs
- **Minnesota Aging Pathways (formerly Senior LinkAge Line)** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 4 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **not_applicable**: 3 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medical Assistance (Medicaid)**: Eligibility splits by general MA (income-focused, no/low asset test) vs. long-term care (strict asset/income + level of care); scales by marital status/household; county-administered with statewide standards; multiple pathways (SSI, waivers, EPD).
- **Elderly Waiver (EW)**: Tied to MA LTC eligibility with spenddown/obligation; services individualized by LTCC care plan and cost cap vs. nursing home; county-administered with provider enrollment required; no fixed benefits—varies by assessed need and budget
- **Minnesota Senior Health Options (MSHO)**: County-restricted with plan-specific networks/providers; no fixed income/asset dollar tables in sources (tied to varying MA limits); dual-eligible managed care model differentiates from standard Medicare/Medicaid
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (100%/120%/135% FPG) with MN exceeding federal asset limits; QI capped funding creates waitlist risk; county-administered with uniform benefits statewide
- **Minnesota SNAP (Supplemental Nutrition Assistance Program)**: No gross income test for households with elderly/disabled; benefits scale by household size and net income (heavy deductions for medical/shelter); county-administered statewide.
- **Senior Health Insurance Assistance Program (SHIP)**: no income test; counseling only, no direct benefits; delivered via statewide Senior LinkAge Line network of local Area Agencies on Aging with volunteer counselors[1][3][5]
- **Senior Nutrition Program (Meals on Wheels)**: Decentralized by region with local providers handling eligibility, delivery, and variations; no statewide income/asset tests; service area and rural access are key restrictions
- **Family Adult Assistance Program (FAA) / Alternative Care Grants**: Program data sparse in results; county-administered with no statewide income/asset tables provided; targets elderly avoiding institutional care, unlike child-focused MFIP/FSG
- **Senior Community Service Employment Program (SCSEP)**: County-specific subgrantees with varying providers (e.g., MET Inc., MNVAC); priority enrollment tiers; no fixed asset test; benefits fixed at ~20 hrs/wk minimum wage regardless of household size
- **Legal Assistance for Seniors**: Seniors 60+ no income test (unique exemption), county-restricted providers, prioritization by economic/social need
- **Office of Ombudsman for Long-Term Care**: no income or asset test; advocacy-only with statewide regional delivery; free to all LTC consumers without application barriers
- **UCare Minnesota Senior Care Plus (MSC+)**: County-restricted to CBP managed care areas; ties to Medical Assistance eligibility without fixed income/asset numbers here (state MA rules apply); benefits include EW waiver services with functional needs for some; varies by MCO provider and EW eligibility tier
- **Minnesota Aging Pathways (formerly Senior LinkAge Line)**: no income test for core I&A/counseling; eligibility only for referred paid services; statewide free access via single phone line with local handoffs; mandatory gateway for facility transitions

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Minnesota?
