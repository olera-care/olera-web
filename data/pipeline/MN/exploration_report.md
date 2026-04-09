# Minnesota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 10 |
| New (not in our data) | 5 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **in_kind**: 1 programs
- **service**: 4 programs
- **financial**: 2 programs
- **advocacy**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medical Assistance (MA) for Seniors

- **income_limit**: Ours says `$1305` → Source says `$1,305` ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Comprehensive health coverage including doctor visits, hospital care, prescription drugs, long-term services. Specific for seniors: Medicare Savings Programs if dually eligible; waiver services (e.g., Elderly Waiver: home care, adult day care, assisted living support) if qualified. No monthly premium; year-round enrollment[1][3][5].` ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp`

### Elderly Waiver (EW) and Alternative Care (AC) Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services (HCBS) including adult day care, chore/homemaker services, companion/educational support, home-delivered meals, home health aide, housekeeping, nonmedical transportation, personal care, personal emergency response, respite care, skilled nursing, specialized equipment/supplies, supports for housing transitions, training for family caregivers. EW fully funds for MA-eligible; AC is cost-sharing with client fee. Subject to case mix budget caps and state rate limits[3][4][6].` ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/elderly-waiver.jsp`

### Medicare Savings Programs (MSP) including QMB, SLMB, QI

- **income_limit**: Ours says `$1305` → Source says `$20` ([source](https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A/B premiums, Part A/B deductibles, coinsurance, copayments (for Medicare-covered services by Medicare providers). **SLMB:** Pays Part B premium ($202.90 in 2026). **QI:** Pays Part B premium ($202.90 in 2026); retroactive coverage possible; auto-qualifies for Extra Help (Part D low-income subsidy). QMB/SLMB/QI also auto-qualify for Extra Help.` ([source](https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm))
- **source_url**: Ours says `MISSING` → Source says `https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm`

### Senior Health Insurance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, personalized one-on-one counseling and education on Medicare (Parts A, B, C, D), Medigap, Medicare Advantage plans, Medicare Savings Programs, Extra Help/Low-Income Subsidy, Medicaid, long-term care insurance, prescription drug assistance, appeals of denied claims, managing medical bills, and protection from fraud/errors/abuse via Senior Medicare Patrol (SMP); also includes referrals, printed materials, public presentations, and enrollment assistance[2][3][5][6]. No direct financial aid, healthcare services, or fixed dollar amounts/hours provided.` ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/ (DHS page) or https://shiphelp.org (national SHIP locator); state contact via CMS: Minnesota SHIP/Senior LinkAge Line[4][7]))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/ (DHS page) or https://shiphelp.org (national SHIP locator); state contact via CMS: Minnesota SHIP/Senior LinkAge Line[4][7]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Complaint investigation, advocacy to resolve issues like abuse, neglect, exploitation, retaliation, malnourishment, medication mismanagement, and rights violations; education on resident rights; promotion of person-directed living; works with facilities, families, providers, and agencies to ensure health, safety, well-being, and rights; systemic improvements through policy changes; prevents escalations like hospitalizations[1][2][4]` ([source](https://mn.gov/ooltc/))
- **source_url**: Ours says `MISSING` → Source says `https://mn.gov/ooltc/`

## New Programs (Not in Our Data)

- **Minnesota Senior Health Options (MSHO)** — service ([source](https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp))
  - Shape notes: County-restricted to areas with offering health plans; dual Medicare-Medicaid managed care with long-term services via Elderly Waiver; no base functional criteria but service-specific needs; varies by provider/plan.
- **Minnesota SNAP (Supplemental Nutrition Assistance Program) / Food Support** — financial ([source](https://dcyf.mn.gov/snap or https://www.dhs.state.mn.us))
  - Shape notes: Expanded: no gross limit for elderly/disabled; net-based with big deductions (medical/shelter); scales by household size; county-administered
- **Senior Nutrition Program / Meals on Wheels** — service ([source](https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/senior-nutrition.jsp[2]))
  - Shape notes: This program's data structure is geographically fragmented—there is no single statewide application process or unified income table. Eligibility determination and service delivery are managed at the community/site level through the Senior LinkAge Line. Income limits and meal pricing are not standardized across Minnesota. The program is distinct from the Commodity Supplemental Food Program (CSFP), which is federally administered with more standardized eligibility criteria. Specific processing times, waitlists, and required documentation are not published in available sources and must be obtained directly from local providers.
- **Family Adult Caregiver Support Program** — service ([source](https://mn.gov/board-on-aging/connect-to-services/family-caregiving/))
  - Shape notes: Tied to national NFCSP framework but Minnesota-specific via Board on Aging; benefits via local AAAs with CFSS integration; no strict income table but Medicaid-linked; statewide with regional delivery
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp))
  - Shape notes: Grantee/sub-grantee model with regional providers; income tied to federal poverty levels (no fixed MN table in sources); priority enrollment creates wait variations; 20hr/wk minimum wage training only, not direct aid

## Program Details

### Medical Assistance (MA) for Seniors


**Eligibility:**
- Age: 65+
- Income: For seniors age 65+, eligibility is based on income up to 100% Federal Poverty Guidelines (FPG) for disability-based MA, which is $1,305 monthly for an individual and $1,763 for a family of two (effective as of available data; exact 2026 FPG amounts scale annually). General MA for adults covers household incomes up to 138% FPL (includes 5% disregard), varying by household size per MNsure guidelines table for July 2025-June 2026. Some seniors qualify automatically without income/asset test; others require meeting guidelines. Full table available via MNsure income guidelines[8][4].
- Assets: Asset test applies for some (not all) age 65+; limits and rules detailed in MN DHS policy. Exemptions typically include primary home, one car, household goods, etc. Specific dollar amounts and countable assets (e.g., savings, retirement accounts) require application review; no lien on house if eligible[5][2].
- Minnesota resident
- U.S. citizen or qualifying noncitizen
- Social Security number (or exception)
- Meet program rules; for some, Medicare Parts A & B enrollment
- For waivers like Elderly Waiver: nursing facility level of care, community living

**Benefits:** Comprehensive health coverage including doctor visits, hospital care, prescription drugs, long-term services. Specific for seniors: Medicare Savings Programs if dually eligible; waiver services (e.g., Elderly Waiver: home care, adult day care, assisted living support) if qualified. No monthly premium; year-round enrollment[1][3][5].
- Varies by: priority_tier

**How to apply:**
- Online: MNsure.org
- Phone: 1-855-366-7873
- In-person: County or tribal human services office
- Mail: Via county office

**Timeline:** Varies; apply to determine exact timeline
**Waitlist:** Possible for waiver services like Elderly Waiver due to funding caps

**Watch out for:**
- Not all age 65+ qualify automatically; income/asset tests apply to many[2]
- Dually eligible with Medicare? Check MSHO or MSC+ plans[3]
- Waivers (e.g., Elderly Waiver) require separate assessment and have waitlists[7]
- Married couples: Spousal impoverishment rules protect some assets
- Must apply to confirm eligibility; rules vary by basis (e.g., MA-EPD for working disabled)[6]

**Data shape:** Eligibility has multiple pathways (automatic vs. tested); waivers add nursing-level care requirement with county assessments; managed care plans vary by service area; income at 100% FPG for disability-based, up to 138% FPL general

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/seniors.jsp

---

### Elderly Waiver (EW) and Alternative Care (AC) Program


**Eligibility:**
- Age: 65+
- Income: EW requires eligibility for Medical Assistance (MA); specific dollar amounts not listed in sources but follow MA income rules with spousal protections. AC is for those over 65 with low income/assets who do not qualify for MA; income/assets must be inadequate to fund a nursing facility stay for more than 135 days; exact 2026 amounts not specified and change annually[1][5][7].
- Assets: Follows MA rules for EW: $2,000 individual limit (2025 figures); exempt assets include primary home (equity ≤$730,000 in 2025 if intent to return or spouse/minor/disabled child lives there), one vehicle, household furnishings, personal effects. 60-month look-back rule applies with penalty for transfers below fair market value. AC has asset test but specifics not detailed[1][5].
- Minnesota resident
- Nursing Facility Level of Care (NFLOC) determined by Long-Term Care Consultation/MnCHOICES assessment, based on ADLs/IADLs (e.g., mobility, eating, bathing, medication management)
- EW: Cost of services < nursing home cost; chooses community over nursing home
- AC: Income/assets inadequate for >135 days nursing home; monthly AC cost <75% average MA nursing home payment; pays assessed monthly fee; no other funding available; chooses community services[1][2][3][5][6]

**Benefits:** Home and community-based services (HCBS) including adult day care, chore/homemaker services, companion/educational support, home-delivered meals, home health aide, housekeeping, nonmedical transportation, personal care, personal emergency response, respite care, skilled nursing, specialized equipment/supplies, supports for housing transitions, training for family caregivers. EW fully funds for MA-eligible; AC is cost-sharing with client fee. Subject to case mix budget caps and state rate limits[3][4][6].
- Varies by: priority_tier

**How to apply:**
- Contact county or tribal Long-Term Care Consultation office for MnCHOICES assessment (find contacts at mn.gov/dhs/partners-and-providers/policies-procedures/long-term-care-consultation/contacts/)
- Phone: Minnesota Aging Pathways at 800-333-2433
- In-person or phone via local county/tribal agency[6]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary by county

**Watch out for:**
- EW requires full MA eligibility (stricter financials); AC for non-MA but requires paying monthly fee and no other funding
- Must choose community services over nursing home; service costs cannot exceed nursing home average (EW) or 75% (AC)
- 60-month look-back penalty for asset transfers
- AC excludes assisted living services
- Annual plan review; must maintain NFLOC and eligibility
- Dementia alone insufficient without NFLOC[1][3][5][7]

**Data shape:** Two distinct programs: EW (Medicaid waiver, MA-required) vs AC (state-funded, non-MA, cost-sharing); eligibility via county MnCHOICES; services capped by case mix budgets; county-administered with local variations

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
- Income: No specific dollar amounts or household size table provided in sources; eligibility requires enrollment in Medical Assistance (Medicaid), which has its own income and asset limits not detailed here. MSHO follows MA eligibility criteria.
- Assets: No specific asset limits or exemptions detailed in sources; follows Medical Assistance (Medicaid) asset rules, which are not specified.
- Must be eligible for and enrolled in Medical Assistance (MA/Medicaid), with or without Medicare.
- If Medicare-eligible, must have both Medicare Part A and Part B.
- Minnesota resident.
- Live in a county where an MSHO health plan is offered.
- Voluntary enrollment; no functional eligibility criteria for base program, but some services (e.g., personal care assistance) require demonstrated need in one Activity of Daily Living (ADL) or qualifying behavior.

**Benefits:** Combines Medicare (Parts A and B) and Medicaid (Medical Assistance) services into one managed care plan, including: doctors, hospital care, pharmacies, home care, nursing home care (180 days if entering from community; not covered if already in facility at enrollment), elderly waiver services, personal care assistance, in-home care, transportation, preventive care (e.g., $0 cost wellness visits, cancer screenings, shots), specialist care ($0 cost). Care coordinator assigned to help access services. Additional long-term services via 1915(c) Elderly Waiver.
- Varies by: region

**How to apply:**
- Phone: Call Minnesota Department of Human Services Health Care Consumer Support (HCCS) at 1-651-297-3862 or 1-800-657-3672 for choice counseling; or specific plans like Blue Cross SecureBlue at 1-866-477-1584 or (651) 662-1811, TTY 711.
- Enroll through health plans offering MSHO (e.g., Medica DUAL Solution, UCare, Blue Cross SecureBlue, South Country Health Alliance SeniorCare Complete).
- Ensure prior MA/Medicaid eligibility.

**Timeline:** Not specified in sources.

**Watch out for:**
- Nursing facility services not covered by MSHO if resident on enrollment effective date (MCO pays for 180 days only if entering from community).
- Must have both Medicare Part A and B if Medicare-eligible; voluntary, but non-enrollees age 65+ may be mandatorily enrolled in alternative like Minnesota Senior Care Plus (MSC+).
- Some services require prior authorization or functional need (e.g., ADLs for personal care).
- Enrollment depends on health plan contract renewal and service area.
- Prior MA eligibility required; apply for MA first if not enrolled.

**Data shape:** County-restricted to areas with offering health plans; dual Medicare-Medicaid managed care with long-term services via Elderly Waiver; no base functional criteria but service-specific needs; varies by provider/plan.

**Source:** https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/msho.jsp

---

### Medicare Savings Programs (MSP) including QMB, SLMB, QI


**Eligibility:**
- Income: Must be entitled to or eligible for Medicare Part A. Income limits are monthly, include $20 general disregard, and are based on 100% FPG for QMB, 100-120% FPG for SLMB, 120-135% FPG for QI (2026 figures): Individual - QMB: $1,350; SLMB: $1,526-$1,715; QI: $1,715. Married couple - QMB: $1,824; SLMB: $2,064-$2,320; QI: $2,320. Limits updated annually; check current FPG. Household size beyond couples not detailed in sources.
- Assets: Resources under $9,950 individual / $14,910 married couple (2026 federal limits; some older MN sources cite ~$10,000/$18,000 or $9,430/$14,130). Counts typical countable resources (cash, bank accounts, etc.); exempts home, one car, personal items, burial funds (details in MN DHS MSP Financial Eligibility subchapter).
- Eligible for or enrolled in Medicare Part A (required for all; Part B also for SLMB/QI).
- Meet MN-specific asset rules per DHS policy.
- U.S. citizen or qualified immigrant.
- Reside in Minnesota.
- QI limited funding, first-come first-served.

**Benefits:** **QMB:** Pays Medicare Part A/B premiums, Part A/B deductibles, coinsurance, copayments (for Medicare-covered services by Medicare providers). **SLMB:** Pays Part B premium ($202.90 in 2026). **QI:** Pays Part B premium ($202.90 in 2026); retroactive coverage possible; auto-qualifies for Extra Help (Part D low-income subsidy). QMB/SLMB/QI also auto-qualify for Extra Help.
- Varies by: priority_tier

**How to apply:**
- Mail or take 'Minnesota Health Care Programs Application for Certain Populations' to local county or tribal human services office.
- SSA Extra Help application may transmit data to initiate MSP application.
- Contact local human services office (find via mn.gov/dhs). No specific statewide phone/URL listed; use county offices.
- In-person at county/tribal offices.

**Timeline:** Not specified in sources; standard MN health programs processing applies (typically 30-45 days).
**Waitlist:** QI has limited funding and operates first-come, first-served; potential waitlist or denial if funds exhausted.

**Watch out for:**
- QI has limited federal funding; first-come, first-served—apply early in fiscal year.
- Cannot receive QI and MinnesotaCare simultaneously (Part B enrollment barrier).
- QMB does not pay providers directly for non-Medicare services; protects from billing for Medicare-covered items.
- Income/asset limits change annually (e.g., 7/1 updates); use current FPG-based figures.
- Must have Part A eligibility; working disabled have separate QWD but not covered here.
- Auto-Extra Help qualification often missed.
- Institutions for Mental Diseases (IMDs) may have restrictions unless exceptions met.

**Data shape:** Tiered by income brackets (QMB <100% FPG, SLMB 100-120%, QI 120-135%); QI funding-capped first-come; applied county-by-county but uniform state policy; auto-links to Extra Help; income includes $20 disregard.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hcopub.dhs.state.mn.us/epm/4_2_1_7.htm

---

### Minnesota SNAP (Supplemental Nutrition Assistance Program) / Food Support

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled: No gross income limit (expanded eligibility); must meet **net income limits** (Oct 1, 2025–Sept 30, 2026): 1: $1,305; 2: $1,763; 3: $2,221; 4: $2,680; 5: $3,138; 6: $3,596; 7: $4,055; 8: $4,513 (+$458 per additional). Net income = gross minus deductions (standard $209, 20% earned income, medical >$35/mo for elderly/disabled, shelter up to $744 cap if no elderly/disabled, utilities). If gross >200% FPL, additional tests apply. Automatic if all on SSI/GA/MSA[1][6].
- Assets: No asset test for most; applies only if household has elderly/disabled member AND gross income >200% FPL. Exempt: primary home, retirement savings, household goods, most vehicles. Counts: cash, bank accounts, non-primary property[1][2].
- MN resident.
- U.S. citizen or qualified non-citizen (MFAP alternative for some non-citizens 50+ who miss SNAP[7]).
- Household = those who buy/prepare food together; elderly can separate from others[8].

**Benefits:** Monthly EBT card for groceries (no cash). Amount based on net income, household size, expenses (e.g., ~$100 more net income = $30 less benefits). Max allotments vary (e.g., example: 2-person elderly/disabled = $546 max, minus 30% net income)[1][3].
- Varies by: household_size

**How to apply:**
- Online: mnbenefits.mn.gov
- Phone: 651-431-2670 or 1-800-657-3739
- Mail/in-person: Local county human services office (find via dhs.state.mn.us)
- Fax or drop-off at county offices

**Timeline:** Up to 30 days standard; expedited (7 days) if very low income/cash[9].

**Watch out for:**
- Elderly often miss high medical/shelter deductions that lower net income[1][6].
- Only ~47% eligible seniors enroll[8].
- Gross >200% FPL triggers asset test[1][2].
- Social Security/pensions count as income[2].
- Can form separate household if 60+[8].

**Data shape:** Expanded: no gross limit for elderly/disabled; net-based with big deductions (medical/shelter); scales by household size; county-administered

**Source:** https://dcyf.mn.gov/snap or https://www.dhs.state.mn.us

---

### Senior Health Insurance Program (SHIP)


**Eligibility:**
- Income: No income limits; available to all Medicare-eligible individuals (typically age 65+, or younger with disabilities), their family members, and caregivers, including those with limited incomes or dually eligible for Medicare and Medicaid[2][3][6].
- Assets: No asset limits or tests apply[2][3].
- Must be Medicare-eligible or a family member/caregiver of a Medicare beneficiary[2][6]
- Reside in Minnesota[4]

**Benefits:** Free, personalized one-on-one counseling and education on Medicare (Parts A, B, C, D), Medigap, Medicare Advantage plans, Medicare Savings Programs, Extra Help/Low-Income Subsidy, Medicaid, long-term care insurance, prescription drug assistance, appeals of denied claims, managing medical bills, and protection from fraud/errors/abuse via Senior Medicare Patrol (SMP); also includes referrals, printed materials, public presentations, and enrollment assistance[2][3][5][6]. No direct financial aid, healthcare services, or fixed dollar amounts/hours provided.

**How to apply:**
- Phone: Senior LinkAge Line at 800-333-2433 (statewide toll-free)[4][6]
- Website: mnship.org or shiphelp.org for local counselors and appointments[6][8]
- In-person or phone counseling appointments via local SHIP sites (over 2,200 nationally, coordinated through Minnesota Board on Aging)[3][4]

**Timeline:** Immediate counseling available by phone or appointment; no formal enrollment or processing as it's a free counseling service[6].

**Watch out for:**
- Not a health insurance or direct benefit program—provides only free counseling and advocacy, not coverage or payments[2][6]
- Counselors are unbiased and do not sell insurance; cannot provide legal advice but offer referrals[2][5]
- Often confused with Minnesota Senior Health Options (MSHO), which is a managed care insurance program for MA/Medicare dually eligible seniors age 65+[1][7]
- Services for Medicare beneficiaries under 65 with disabilities also available[3]

**Data shape:** no income test; counseling-only advocacy service delivered via statewide volunteer/staff network; distinct from insurance programs like MSHO

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/dhs/people-we-serve/seniors/health-care/health-care-programs/programs-and-services/ (DHS page) or https://shiphelp.org (national SHIP locator); state contact via CMS: Minnesota SHIP/Senior LinkAge Line[4][7]

---

### Senior Nutrition Program / Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income eligibility guidelines exist but specific dollar amounts are not provided in available sources[1][2]. Contact Senior LinkAge Line at 800-333-2433 for current income thresholds[2]
- Assets: Not specified in available sources
- Must prepare their own meals and not live in a facility that provides meals[3]
- Must live in Minnesota[3]

**Benefits:** Hot, prepared meals at congregate dining sites and/or home-delivered meals. Sites also offer social activities, volunteer opportunities, programs about health and nutrition, and information about other services like grocery shopping and delivery[2][5]
- Varies by: region

**How to apply:**
- Phone: Senior LinkAge Line at 800-333-2433 (TDD/TTY: 800-627-3529)[2]
- In-person: Visit a senior dining site in your area[2]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- The Senior Nutrition Program and Commodity Supplemental Food Program (CSFP) are two separate programs with different benefits and eligibility requirements—families should not assume eligibility for one means eligibility for the other[1][2][4]
- Only 47% of older adults in Minnesota who are eligible for SNAP benefits are getting them, suggesting significant underutilization of food support programs[7]
- Specific income limits are not publicly listed in standard sources; families must contact Senior LinkAge Line directly to determine eligibility[2]
- Home-delivered meals require that seniors prepare their own meals and not live in a facility providing meals—those in assisted living or nursing homes may not qualify[3]
- Meal costs vary by site, so families should ask about pricing when contacting their local dining site[5]
- Community eligibility expansion is being considered in Minnesota but is not yet universally implemented, meaning free meal access is not guaranteed at all sites[5]

**Data shape:** This program's data structure is geographically fragmented—there is no single statewide application process or unified income table. Eligibility determination and service delivery are managed at the community/site level through the Senior LinkAge Line. Income limits and meal pricing are not standardized across Minnesota. The program is distinct from the Commodity Supplemental Food Program (CSFP), which is federally administered with more standardized eligibility criteria. Specific processing times, waitlists, and required documentation are not published in available sources and must be obtained directly from local providers.

**Source:** https://mn.gov/dhs/people-we-serve/seniors/services/home-community/programs-and-services/senior-nutrition.jsp[2]

---

### Family Adult Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits detailed in available sources; eligibility tied to Minnesota's Medicaid programs like Elderly Waiver or Minnesota Senior Health Options, which generally require low income (e.g., seniors often limited to ~$2,982/month for HCBS waivers or $994-$1,330/month for regular Medicaid in 2026, but exact household size tables not specified for this program)[4]
- Assets: $2,000 asset limit typical for Medicaid-related senior programs in Minnesota (e.g., HCBS waivers); countable assets generally include bank accounts, investments; exemptions often include primary home, one vehicle, personal belongings (details vary by program assessment)[4]
- Caregiver must be adult family member or informal caregiver for individual 60+ or with Alzheimer's (any age)
- Care recipient must be enrolled in Medicaid, Elderly Waiver, or Minnesota Senior Health Options
- Caregiver at least 18 (exceptions for 16-17 with supervision)
- Pass criminal background check
- Complete state-required training and certification
- Care recipient must demonstrate need for care

**Benefits:** Support services including caregiver skills classes, individual consulting, self-directed grants, limited respite care, information/referral; transitioned to Community First Services and Supports (CFSS) as of Oct 1, 2024, providing flexible home care assistance (e.g., personal care) with greater consumer control; no fixed dollar amounts or hours specified, varies by assessed need
- Varies by: priority_tier

**How to apply:**
- Phone: Minnesota Aging Pathways at 800-333-2433 (Mon-Fri 8am-4:30pm)
- Through licensed provider agency for CFSS/PCA enrollment
- Online classes/counseling available when in-person not possible

**Timeline:** Funds often 1-3 business days post-approval for some payments, but full assessment/reassessment varies; transition to CFSS at next annual reassessment
**Waitlist:** Not specified; may exist based on regional demand

**Watch out for:**
- Program transitioned from PCA to CFSS as of Oct 1, 2024—existing recipients auto-transition at reassessment unless condition changes
- Must go through licensed agency and DHS enrollment; family can't be paid independently
- Not direct cash payment to caregivers but service support/grants; compare to Medicaid self-direction (CFSS) for payment option
- Living arrangement rules may apply in related programs
- Background checks and training mandatory—often overlooked

**Data shape:** Tied to national NFCSP framework but Minnesota-specific via Board on Aging; benefits via local AAAs with CFSS integration; no strict income table but Medicaid-linked; statewide with regional delivery

**Source:** https://mn.gov/board-on-aging/connect-to-services/family-caregiving/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; consult current federal poverty guidelines via USDOL or local provider for table (e.g., for 2023, 125% for 1-person household was ~$18,825, but verify latest as not specified in sources)[4][5]
- Unemployed
- Limited job prospects
- Minnesota resident (some providers specify county, e.g., Hennepin for certain grantees)
- Priority: Veterans and qualified spouses first, then over 65, disability, low literacy, limited English, rural resident, homeless/at risk, low employment prospects, or failed American Job Center services[4][5]

**Benefits:** Part-time community service work-based job training averaging 20 hours/week at nonprofit, school, government, hospital, senior center, or daycare sites; paid highest of federal, state, or local minimum wage; skills development for unsubsidized employment; access to American Job Centers[1][2][4][5][6]

**How to apply:**
- State central: https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp (MN DEED)[1]
- MET Inc.: https://www.metinc.org/senior-employment-program (metro area)[2]
- Minnesota Valley Action Council: senior@mnvac.org, 507-345-6822, in-person 706 N Victory Dr., Mankato, MN; online SCSEP Application form (Blue Earth, Brown, Faribault, Martin, Nicollet, Watonwan counties)[6]
- CWI Works (grantee): Check https://www.cwiworks.org/for-job-seekers/our-programs/scsep/scsep-near-you/scsep-in-minnesota/ for local sub-grantees[5][8]
- East Side Neighborhood Services (Hennepin County, prior operator; contact for current)[3]
- Phone/website via grantees or American Job Centers

**Waitlist:** Possible due to funding limits and priority enrollment; varies by region and provider (not specified quantitatively)[3]

**Watch out for:**
- Not permanent employment—temporary training bridge to unsubsidized jobs[1][4]
- Strict priority tiers may delay non-priority applicants[4][5]
- County-specific providers mean checking local grantee for eligibility/availability[3][6]
- Income at exactly 125% FPL cutoff; excludes employed individuals[1][4]
- Furloughs or sponsor changes possible (e.g., ESNS ended sponsorship)[3]
- No asset test mentioned, but prove low income rigorously

**Data shape:** Grantee/sub-grantee model with regional providers; income tied to federal poverty levels (no fixed MN table in sources); priority enrollment creates wait variations; 20hr/wk minimum wage training only, not direct aid

**Source:** https://mn.gov/deed/programs-services/dislocated-worker/scsep/index.jsp

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to all Minnesota adults needing or receiving long-term care, regardless of financial status[2][4]
- Assets: No asset limits or tests apply[2][4]
- Must be a Minnesota adult needing or receiving long-term care, primarily residents of long-term care communities such as nursing homes, assisted living facilities, board and care homes, or similar adult care homes[2][4][5]

**Benefits:** Complaint investigation, advocacy to resolve issues like abuse, neglect, exploitation, retaliation, malnourishment, medication mismanagement, and rights violations; education on resident rights; promotion of person-directed living; works with facilities, families, providers, and agencies to ensure health, safety, well-being, and rights; systemic improvements through policy changes; prevents escalations like hospitalizations[1][2][4]

**How to apply:**
- Phone: 1-800-657-3591[7]
- Website: https://mn.gov/ooltc/[4]
- Email: MBA.OOLTC@state.mn.us[7]
- Mail: Office of Ombudsman for Long-Term Care, P.O. Box 64971, St. Paul, MN 55164-0971[7]

**Timeline:** Not specified in available data

**Watch out for:**
- Not a direct service provider (e.g., no healthcare or financial aid); focuses on advocacy and complaint resolution, not facility placement or personal care[2][4]
- Primarily for residents in long-term care facilities; may assist those needing care but confirm applicability[5]
- Free services but relies on volunteers and regional coordinators, so response may depend on local staffing[3]
- Mandated by Older Americans Act but state-implemented; not a financial benefit program[1]

**Data shape:** no income test; advocacy-focused for long-term care residents; free statewide with regional offices; not a qualification-based benefit program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mn.gov/ooltc/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medical Assistance (MA) for Seniors | benefit | state | deep |
| Elderly Waiver (EW) and Alternative Care | benefit | state | deep |
| Minnesota Senior Health Options (MSHO) | benefit | local | deep |
| Medicare Savings Programs (MSP) includin | benefit | federal | deep |
| Minnesota SNAP (Supplemental Nutrition A | benefit | federal | deep |
| Senior Health Insurance Program (SHIP) | resource | federal | simple |
| Senior Nutrition Program / Meals on Whee | benefit | federal | medium |
| Family Adult Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | medium |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":7,"resource":2,"employment":1}
**Scopes:** {"state":3,"local":1,"federal":6}
**Complexity:** {"deep":6,"simple":2,"medium":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/MN/drafts.json`.

- **Medical Assistance (MA) for Seniors** (benefit) — 5 content sections, 6 FAQs
- **Elderly Waiver (EW) and Alternative Care (AC) Program** (benefit) — 5 content sections, 6 FAQs
- **Minnesota Senior Health Options (MSHO)** (benefit) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **not_applicable**: 3 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medical Assistance (MA) for Seniors**: Eligibility has multiple pathways (automatic vs. tested); waivers add nursing-level care requirement with county assessments; managed care plans vary by service area; income at 100% FPG for disability-based, up to 138% FPL general
- **Elderly Waiver (EW) and Alternative Care (AC) Program**: Two distinct programs: EW (Medicaid waiver, MA-required) vs AC (state-funded, non-MA, cost-sharing); eligibility via county MnCHOICES; services capped by case mix budgets; county-administered with local variations
- **Minnesota Senior Health Options (MSHO)**: County-restricted to areas with offering health plans; dual Medicare-Medicaid managed care with long-term services via Elderly Waiver; no base functional criteria but service-specific needs; varies by provider/plan.
- **Medicare Savings Programs (MSP) including QMB, SLMB, QI**: Tiered by income brackets (QMB <100% FPG, SLMB 100-120%, QI 120-135%); QI funding-capped first-come; applied county-by-county but uniform state policy; auto-links to Extra Help; income includes $20 disregard.
- **Minnesota SNAP (Supplemental Nutrition Assistance Program) / Food Support**: Expanded: no gross limit for elderly/disabled; net-based with big deductions (medical/shelter); scales by household size; county-administered
- **Senior Health Insurance Program (SHIP)**: no income test; counseling-only advocacy service delivered via statewide volunteer/staff network; distinct from insurance programs like MSHO
- **Senior Nutrition Program / Meals on Wheels**: This program's data structure is geographically fragmented—there is no single statewide application process or unified income table. Eligibility determination and service delivery are managed at the community/site level through the Senior LinkAge Line. Income limits and meal pricing are not standardized across Minnesota. The program is distinct from the Commodity Supplemental Food Program (CSFP), which is federally administered with more standardized eligibility criteria. Specific processing times, waitlists, and required documentation are not published in available sources and must be obtained directly from local providers.
- **Family Adult Caregiver Support Program**: Tied to national NFCSP framework but Minnesota-specific via Board on Aging; benefits via local AAAs with CFSS integration; no strict income table but Medicaid-linked; statewide with regional delivery
- **Senior Community Service Employment Program (SCSEP)**: Grantee/sub-grantee model with regional providers; income tied to federal poverty levels (no fixed MN table in sources); priority enrollment creates wait variations; 20hr/wk minimum wage training only, not direct aid
- **Long-Term Care Ombudsman Program**: no income test; advocacy-focused for long-term care residents; free statewide with regional offices; not a qualification-based benefit program

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Minnesota?
