# Alaska Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 2.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 11 |
| New (not in our data) | 8 |
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
- **financial**: 5 programs
- **in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1500` → Source says `$1,683` ([source](https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments for Medicare-covered services/items. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only. All qualify for Extra Help with Medicare drug costs (e.g., no more than $12.65 per drug in 2026).[5][7]` ([source](https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/))
- **source_url**: Ours says `MISSING` → Source says `https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/`

### SNAP (Supplemental Nutrition Assistance Program)

- **income_limit**: Ours says `$2000` → Source says `$3,258` ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases. Amount based on net income (~$100 more net income = $30 less benefits); minimum/maximum vary by household size. Exact amounts not fixed but scale with income/household after deductions.[1][3]` ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/`

### Alaska Energy Assistance (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$2,443` ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment mailed directly to heating vendor/utility. Amount varies by household income, size, heat type, dwelling type, geographic location, and vendor; no fixed dollar amounts specified.` ([source](https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/`

## New Programs (Not in Our Data)

- **Adults with Physical & Developmental Disabilities Waiver (APDD)** — service ([source](https://health.alaska.gov/en/services/hcbs-waivers/))
  - Shape notes: Requires dual eligibility (Medicaid + NFLOC via specialized IDD assessment); services vary by age, location, and provider; not elderly-focused without developmental disability
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); https://www.npaonline.org (national finder); check Alaska Medicaid: health.alaska.gov for state page.))
  - Shape notes: No income/asset test for eligibility; strictly limited to few PACE centers/service areas (none confirmed in Alaska sources); requires NFLOC + community safety; dual-eligible get full coverage, others pay premium; not statewide.
- **Weatherization Assistance Program** — service ([source](https://www.ahfc.us/efficiency/weatherization))
  - Shape notes: Administered statewide by regional providers via AHFC/DOE funding; priority tiers heavily influence access; 15-year re-weatherization limit; income at 100% AMI with table by household size.
- **Meals on Wheels (Alaska Senior Nutrition Programs)** — service ([source](https://health.alaska.gov/ (Alaska DHSS for senior nutrition oversight); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/[2][3]))
  - Shape notes: Decentralized by region with local providers/senior centers; no statewide income/asset test; eligibility emphasizes homebound/mobility need over finances; varies by urban (Anchorage/Fairbanks) vs. rural/borough (North Slope/Southeast)
- **Alzheimer's Family Caregiver Support Program** — service ([source](https://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx))
  - Shape notes: Dual structure: CSRCP (diagnosis-specific with financial tests) and NFCSP/FCSP (broader, no income test); locally administered by grantees in communities; no service caps on respite but priority-based allocation.
- **Senior Benefits Program** — financial ([source](https://dhss.alaska.gov/dpa/))
  - Shape notes: Three-tiered monthly cash payments scaled by gross income brackets (tied to AK Federal Poverty Guidelines, household size); no asset test; funding-dependent amounts; statewide via DPA with annual adjustments.
- **Adult Public Assistance (APA)** — financial ([source](https://health.alaska.gov/en/services/adult-public-assistance-apa/[1]))
  - Shape notes: Income/payment standards vary by household size, living situation (e.g., shelter help), and SSI countable rules; statewide but regional DPA offices; requires pursuing other benefits first; asset exemptions follow SSI with Alaska Native property nuance
- **Senior Access Program** — in_kind ([source](https://www.ahfc.us/pros/homelessness/assistance-grants/senior-access-program-sap))
  - Shape notes: Delivered via regional nonprofit intermediaries funded by AHFC; grant amounts vary by home tenure (own/rent/ALF) and region; income at 100% AMI by area/household size with auto-qualifiers; funding rounds via NOFA

## Program Details

### Adults with Physical & Developmental Disabilities Waiver (APDD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must meet Alaska Medicaid income and resource limits set by the Division of Public Assistance (DPA). Specific dollar amounts not detailed in APDD sources; refers to standard Medicaid thresholds (note: ALI waiver uses 300% FBR or $2,901/month per applicant in 2025, but APDD follows general Medicaid rules)[1][2]
- Assets: Must meet Alaska Medicaid resource limits determined by DPA; specific counts/exemptions (e.g., home equity) follow standard Medicaid rules, not uniquely specified for APDD[1]
- Alaska resident
- Diagnosed developmental disability (e.g., intellectual disability, autism, or developmental disability)
- Assessed by SDS Intellectual and Developmental Disabilities (IDD) Unit
- Meet Nursing Facility Level of Care (NFLOC) requirements

**Benefits:** Home and community-based services (HCBS) including care coordination (required for all), medical/supportive services, residential supported living, assisted living, group home options; specific services vary by individual needs, age, and location; allows alternatives to nursing facility or group home institutional care[1][5][6]
- Varies by: priority_tier|region

**How to apply:**
- Contact a care coordinator via local Aging and Disability Resource Center (ADRC) or SDS Intake (e.g., Southeast Alaska: Juneau 907-523-4428, Ketchikan, Haines)[5][6]
- In-person or phone intake/screening; care coordinator arranges home assessment
- Apply for Medicaid eligibility through Division of Public Assistance (DPA) interview/application
- No specific online URL or form number listed; starts with care coordinator contact

**Timeline:** Not specified; involves assessment scheduling and letter notification
**Waitlist:** Likely exists due to waiver caps (common for HCBS), but not detailed

**Watch out for:**
- Must qualify for both Medicaid financial eligibility AND NFLOC via specific SDS IDD assessment—not just disability[1][6]
- Not for elderly without developmental disability (use ALI instead); APDD requires developmental disability + nursing needs[1][4]
- Services vary by region/provider availability; contact local care coordinator first[5][6]
- Institutional level of care required—many with mild needs won't qualify[1]
- Spousal income treated individually in related waivers, but confirm for APDD via DPA[2]

**Data shape:** Requires dual eligibility (Medicaid + NFLOC via specialized IDD assessment); services vary by age, location, and provider; not elderly-focused without developmental disability

**Source:** https://health.alaska.gov/en/services/hcbs-waivers/

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No financial criteria or income limits for PACE eligibility; no asset limits apply. Medicaid eligibility (separate from PACE) may involve income under $2,901/month (300% FBR in 2025) and assets $2,000 or less (excluding primary home), but PACE itself has none.[1][2][4]
- Assets: No asset limits for PACE; what counts/exempt is irrelevant as finances are not considered.[1][4]
- Live in the service area of a PACE organization (critical for Alaska—programs may not exist statewide)
- Certified by Alaska as needing nursing home level of care (NFLOC), typically requiring extensive assistance with ADLs like bathing, grooming, toileting, walking, transferring, eating.[1][2][4][5]
- Able to live safely in the community (home or assisted living) with PACE services at enrollment time.[1][4][5]
- Not enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice.[1]

**Benefits:** Comprehensive, all-inclusive care via interdisciplinary team at PACE center: primary/acute/specialty medical care, prescription drugs, hospitalization, therapies (PT/OT/ST), social services, adult day health (typically 20-40 hours/week), home care, respite, transportation, meals (home-delivered + center), personal care aides, assistive devices, dental/vision/hearing, hospice if needed. No deductibles/copays for enrollees; covers all Medicare/Medicaid services + extras. Fully covered for Medicaid-eligible; private pay premium for others (amount varies by program).[1][4][5]
- Varies by: region

**How to apply:**
- Contact local PACE provider directly (no statewide Alaska PACE confirmed; use national finder: Medicare.gov 'Find a PACE Plan' tool or NPAonline.org 'find your local PACE program')[1][6]
- Phone: Call 1-800-MEDICARE (1-800-633-4227) for nearest option[6]
- In-person: At PACE center if available in service area

**Timeline:** Not specified in sources; varies by program—typically weeks to months for assessment/certification.
**Waitlist:** Possible due to capped financing/enrollment limits by state/provider; common in limited areas.[7]

**Watch out for:**
- PACE unavailable in most of Alaska (not statewide; confirm local service area first—key barrier).[1][6]
- Must live near PACE center (daily attendance expected; not remote).[4]
- NFLOC certification by Alaska required (not automatic; involves assessment).[2][4]
- Becomes sole Medicare/Medicaid provider—disenroll other plans; voluntary exit anytime.[1][5]
- Private pay premium if not Medicaid-eligible (can be thousands/month; inquire locally).
- Waitlists common due to enrollment caps.[7]

**Data shape:** No income/asset test for eligibility; strictly limited to few PACE centers/service areas (none confirmed in Alaska sources); requires NFLOC + community safety; dual-eligible get full coverage, others pay premium; not statewide.

**Source:** https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); https://www.npaonline.org (national finder); check Alaska Medicaid: health.alaska.gov for state page.

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be entitled to Medicare Part A. Federal limits apply but are higher in Alaska. For 2026 (relevant as of April 2026): QMB - Individual: $1,683/month, Couple: $2,275/month (includes $20 general income disregard); SLMB - Individual: up to ~$1,585-$2,015/month (100-120% FPL, Alaska-adjusted), Couple: up to ~$2,135-$2,720/month; QI - Individual: up to ~$1,715-$2,140/month (120-135% FPL, Alaska-adjusted), Couple: higher accordingly. Exact Alaska-specific limits not detailed in sources; contact state for current FPL-adjusted figures as Alaska has higher poverty levels (e.g., $19,550 annual FPL individual). Limits adjusted annually; states like Alaska may disregard more to effectively raise thresholds.[1][4][7]
- Assets: 2026 limits: Individual $9,950, Couple $14,910 (higher than 2025's $9,660/$14,470). Counts: Bank accounts, stocks (except some Alaska Native corporation stocks), bonds. Exempt: Primary home, one vehicle, household items, engagement/wedding rings, burial plots/expenses up to $1,500, life insurance < $1,500 cash value, certain Native American funds/settlements (e.g., Cobell payments, food stamps).[1][4][7]
- Must be enrolled in Medicare Part A (and Part B for SLMB/QI).
- Alaska resident.
- U.S. citizen or qualified immigrant.
- QI: Cannot qualify for Medicaid or other MSPs; limited funding with priority to prior recipients.

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copayments for Medicare-covered services/items. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only. All qualify for Extra Help with Medicare drug costs (e.g., no more than $12.65 per drug in 2026).[5][7]
- Varies by: program_tier

**How to apply:**
- Contact Alaska Department of Health Public Assistance office (statewide medical assistance office).
- Phone: Local Public Assistance Field Office (find via dhss.alaska.gov/Health/Pages/default.aspx or call 1-800-478-7778 for referrals; specific MSP line not listed).
- In-person: Local Public Assistance Field Offices across Alaska.
- Mail or online: Through Alaska DHSS eligibility system (health.alaska.gov for forms/info).

**Timeline:** Not specified in sources; typically state Medicaid processing (contact state for details).
**Waitlist:** QI: Yes, first-come first-served until federal funding exhausted; priority to previous QI recipients.[5]

**Watch out for:**
- Alaska has higher income limits than 48 states but exact current figures require state confirmation (federal base + Alaska FPL adjustment).[1][4][7]
- QI has limited funding and waitlist; apply early in federal fiscal year.[5]
- Must have Part A (and B for SLMB/QI); automatic Extra Help but confirm enrollment.
- States can disregard more income/resources; Alaska may have liberalized rules but verify.
- Income includes disregards ($20 general, $65 + half wages); assets exempt key items like home/car.
- Cannot receive QI if eligible for Medicaid/QMB/SLMB.

**Data shape:** Income/asset limits higher in Alaska due to FPL; tiered by QMB (lowest income, most benefits), SLMB, QI (highest income, Part B only, capped funding); no age requirement (Medicare-tied, typically 65+); household size affects via FPL scaling.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.alaska.gov/en/services/extra-help-on-medicare-drug-costs/

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (Oct 1, 2025 - Sept 30, 2026): Gross income limit at 200% FPL - 1 person: $3,258/month; 2: $4,406; 3: $5,552; 4: $6,698; 5: $7,846; 6: $8,992; 7: $10,138; +$1,146 each additional. If over gross, qualify via net income (100% FPL) and asset tests. Deductions include 20% earned income, standard $358 (1-5 people)/$374 (6+), dependent care, medical >$35 for elderly/disabled, shelter up to $1,189.[1][3]
- Assets: Most households: $3,000. Households with 60+ or disabled: $4,500. Exempt: home/lot, household goods, burial plots, life insurance cash value, retirement/pension accounts, income-producing property, 529 plans, vehicles (exempt use or equity <$1,500).[3]
- Alaska resident.
- U.S. citizen, national, or qualified non-citizen.
- All household members need SSN or proof of application.
- Household: people who buy/prepare food together (parents/kids ≤21 count as one).
- Able-bodied 16-59: register for work, accept jobs, E&T if offered; ABAWDs 18-54 limited to 3 months/36 unless working/E&T 20+ hrs/week (exemptions for elderly/disabled).
- Elderly Simplified Application Project (ESAP) for all-adult households 60+/disabled: easier rules, report changes like new work or lottery >$4,500.[2]

**Benefits:** Monthly EBT card for food purchases. Amount based on net income (~$100 more net income = $30 less benefits); minimum/maximum vary by household size. Exact amounts not fixed but scale with income/household after deductions.[1][3]
- Varies by: household_size

**How to apply:**
- Online: Division of Public Assistance webpage (health.alaska.gov/dpa).
- Phone: Virtual Contact Center 800-478-7778.
- In-person: Local Division of Public Assistance office.
- Mail: Via DPA forms to local office.

**Timeline:** Not specified; ESAP certification 36 months (vs 24 standard), no recert interview unless issues.[2]

**Watch out for:**
- Elderly/disabled households skip gross income test if meet net/asset; Alaska expanded to 200% FPL gross (stricter elsewhere).[1]
- ESAP (Dec 2024-Nov 2029): 36-month cert, no interim report/interview, but report key changes.[2]
- Work rules exempt elderly/disabled but apply to others in household.
- Assets exempt more for seniors (home, savings, etc.).
- Deductions key: medical/shelter can lower net income significantly.[3]

**Data shape:** Elderly/disabled special rules: higher gross limit (200% FPL), asset $4,500, medical/shelter deductions; ESAP simplifies recert; benefits scale by household size/net income.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/snap-nutrition-assistance/

---

### Alaska Energy Assistance (LIHEAP)


**Eligibility:**
- Income: Gross monthly income at or below 150% of federal poverty guidelines (FY 2026): 1 person = $2,443; 2 = $3,303; 3 = $4,162; 4 = $5,023; 5 = $5,883; 6 = $6,742; each additional = +$860. Household includes everyone at the address sharing utility bills. Must have at least $200 in annual out-of-pocket heating costs.
- Assets: No asset limits mentioned in program guidelines.
- Household must pay for own heating costs (not fully included in rent).
- Available to all qualifying households; priority often for elderly (60+), disabled, or emergencies.

**Benefits:** One-time payment mailed directly to heating vendor/utility. Amount varies by household income, size, heat type, dwelling type, geographic location, and vendor; no fixed dollar amounts specified.
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: State application portal (via health.alaska.gov or local DPA office).
- Phone/Email: liheap@alaska.gov or contact local Public Assistance office.
- Mail/In-person: Local Division of Public Assistance (DPA) office, WIC offices, senior centers; tribal agencies (e.g., Sitka Tribe, THRHA) for enrolled members in certain areas.
- Regional/tribal variations apply directly through state if not tribal citizen.

**Timeline:** Within 45 days for complete applications; Notice of Decision within 30 days (tribal example); emergency crisis cases prioritized.
**Waitlist:** Funding limited; applications may close early if funds exhausted (e.g., THRHA: Nov 1 for 60+/disabled, Dec 1 general through June 30, 2026).

**Watch out for:**
- Household includes all at address sharing utilities (even non-expense sharers like roommates).
- Must verify ALL income (including zero income claims); incomplete apps delayed.
- Funding limited—apply early; season Oct-Aug but closes if funds out.
- No cooling assistance in Alaska.
- Tribal vs. state application routing critical—non-enrolled go to state.
- Eligibility not just income: requires $200+ heating costs paid by household.

**Data shape:** Administered statewide via DPA with tribal sub-grantees; benefits/payment scale by income/size/region/heat type; priority tiers for elderly/disabled/emergencies; seasonal with early funding exhaustion.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.alaska.gov/en/services/division-of-public-assistance-dpa-services/heating-assistance/

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income must be below 100% of area median income (AMI). Federal funding limits as of 4/10/2025 (statewide): 1 person $39,100; 2 $52,860; 3 $66,620; 4 $80,380; 5 $94,140; 6 $107,900; 7 $121,660; 8 $135,420. Limited state funding has slightly higher limits.[3][1]
- Assets: No asset limits mentioned in program guidelines.[1][2][3]
- Home must be primary year-round residence; not eligible if to be destroyed, abandoned, or converted within 12 months.[1]
- Home cannot have received weatherization services in the last 15 years (some pre-2008 exceptions possible).[3][4][5]
- Priority to elderly (55+), disabled, households with children under 6, lowest income, Native American households.[1][2][6]
- Homeowners and renters eligible.[2][3][4]
- Cannot have received AHFC Home Energy Rebate after May 1, 2008, or Weatherization after April 14, 2008.[2]

**Benefits:** Free home weatherization services including caulking/weatherstripping, advanced air sealing, furnace efficiency/health/safety modifications (e.g., burner replacement, venting fixes, ignition systems), programmable thermostats, insulation, furnace/hot water heater replacement, door/window repairs/replacement, ventilation/moisture control, smoke/CO detectors, fire extinguishers. Up to $4,000 per unit for 1-4 unit buildings ($3,000 for 5+ units).[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Contact local weatherization service provider by region (e.g., THRHA: fax (907) 780-3539, mail 5446 Jenkins Drive, Juneau, AK 99801; RurAL CAP for Anchorage; Cook Inlet Housing Authority; Alaska CDC).[2][3][4][5][6]
- Association of Alaska Housing Authorities for provider list.[4]
- If in state-designated regional housing authority home, contact housing authority directly.[4]

**Timeline:** Not specified in sources.
**Waitlist:** Priority-based selection; first-come first-served except for priority groups (elderly 55+, disabled, children under 6, lowest income).[6]

**Watch out for:**
- Home ineligible if weatherized in last 15 years (pre-2008 may qualify but lower priority).[3][4][5]
- Incompatible with AHFC Home Energy Rebate post-2008.[2]
- Must be year-round primary residence.[1]
- Priority groups (elderly 55+, disabled, young children) get preference over others.[1][6]
- Limited state funding with higher incomes; federal is stricter.[3]

**Data shape:** Administered statewide by regional providers via AHFC/DOE funding; priority tiers heavily influence access; 15-year re-weatherization limit; income at 100% AMI with table by household size.

**Source:** https://www.ahfc.us/efficiency/weatherization

---

### Meals on Wheels (Alaska Senior Nutrition Programs)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or tests; income is not a factor in eligibility across programs[4][8].
- Assets: No asset limits mentioned or applicable.
- Homebound or physically limited in ability to carry out activities of daily living, or have mobility challenges making shopping, meal preparation, or socialization difficult[1][2][4][8]
- Reside in a program delivery zone or service area[1]
- For home-delivered meals, often requires doctor's note stating homebound or disabled (self or spouse)[8]
- For congregate meals, complete a client profile at the meal site[4]

**Benefits:** Home-delivered hot meals (typically 5 days/week, with frozen meals for weekends/holidays); congregate hot nutritious lunches at senior centers (Monday-Friday); each meal provides ~1/3 of daily nutritional requirements; special dietary meals with prescription; socialization opportunities at congregate sites[3][4][8]
- Varies by: region

**How to apply:**
- Contact local provider or Area Agency on Aging by phone (e.g., Salvation Army Anchorage: (907) 349-0613[4]; Fairbanks Senior Center: (907) 452-1735[5]; North Slope: via Senior Program application[8])
- Complete specific forms: MOW and Nutritional forms (Fairbanks)[5]; client profile at meal site (congregate)[4]; SESS application for Southeast Alaska[9]
- In-person at senior centers or meal sites (e.g., Anchorage: 9131 Centennial Circle[4]; Wasilla: 1301 S Century Cir[7]; 12 SESS centers in Southeast[9])
- Initial assessment of needs, health, mobility, dietary restrictions[1]

**Timeline:** Varies; some within a week, longer with waitlists[1]
**Waitlist:** Possible depending on local program demand[1]

**Watch out for:**
- Not statewide—must confirm local provider and delivery zone first[1]
- Home-delivered often requires proof of homebound status via doctor's note, unlike congregate meals[8]
- Fees may apply as suggested donation, sliding scale, or free based on location/income ability (not eligibility barrier)[2]
- Car ownership or ability to leave home easily may disqualify from home delivery[1]
- Separate applications for congregate vs. home-delivered; spouses/dependents sometimes eligible[1]

**Data shape:** Decentralized by region with local providers/senior centers; no statewide income/asset test; eligibility emphasizes homebound/mobility need over finances; varies by urban (Anchorage/Fairbanks) vs. rural/borough (North Slope/Southeast)

**Source:** https://health.alaska.gov/ (Alaska DHSS for senior nutrition oversight); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/[2][3]

---

### Alzheimer's Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income and asset limits apply for CSRCP (specific dollar amounts not provided in sources; requires meeting financial eligibility requirements). No income limits specified for NFCSP/FCSP.
- Assets: Asset limits apply for CSRCP (specific amounts and what counts/exempts not detailed in sources).
- For CSRCP: Care recipient must have a formal diagnosis of Alzheimer's disease or a related dementia.
- For NFCSP/FCSP: Caregiver must be providing unpaid care to an individual 60 years or older OR to an individual with Alzheimer’s disease or a related disorder (regardless of age).
- OR caregiver is 60 years or older providing unpaid care to an adult child with a disability.
- OR grandparents or older relatives (age 55+) raising grandchildren or caring for children under 18.
- No minimum age for caregivers in general FCSP; care recipients typically 60+ for standard services.

**Benefits:** CSRCP: Specific services for Alzheimer's/dementia caregivers (details not fully specified). NFCSP/FCSP: Information and assistance, individual counseling, support groups, caregiver training, respite care (adult day and in-home, no cap on services), limited supplemental services (e.g., transportation, home modifications), case management, legal/financial consultation, education. ADRD Education and Support: Educational materials, referrals, support groups.
- Varies by: priority_tier

**How to apply:**
- Download and complete Caregiver Support Services Application (fill-able PDF from aoascc.org): https://www.aoascc.org/Customer-Content/www/CMS/files/Caregiver_Support_Services_Application-Fillable_Combined_2025_05_19.pdf
- Contact local providers such as Alaska Office of Aging and Senior Care Centers (AOASCC) or Division of Senior and Disabilities Services grantees.
- Access FCSP through Home & Community Based Senior Grants website (http://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx)
- Alzheimer’s Resource Agency in four locations for ADRD support.

**Timeline:** Not specified
**Waitlist:** Not applicable for this program (waitlist noted for separate ALI Medicaid Waiver)

**Watch out for:**
- Two main tracks: CSRCP (requires formal Alzheimer's/dementia diagnosis and financial eligibility with income/asset limits) vs. broader NFCSP/FCSP (no diagnosis or income test required for standard caregivers of 60+).
- Spouses and legal guardians often ineligible as paid caregivers in related programs (e.g., ALI), but this program focuses on unpaid caregiver support.
- Proof of diagnosis mandatory for CSRCP; families miss distinguishing between CSRCP and NFCSP.
- Services no cap on respite, but limited supplemental services.
- Grandparent/relative caregivers have specific age thresholds (55+ or 60+ depending on subcategory).

**Data shape:** Dual structure: CSRCP (diagnosis-specific with financial tests) and NFCSP/FCSP (broader, no income test); locally administered by grantees in communities; no service caps on respite but priority-based allocation.

**Source:** https://dhss.alaska.gov/dsds/Pages/hcb/hcb.aspx

---

### Senior Benefits Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Gross annual income limits based on Alaska Federal Poverty Guidelines, adjusted annually in April. For household size 1 (effective 4/1/2024): $250/mo payment up to $25,540 ($2,129/mo); $175/mo up to approx. $35k (inferred tier); $125/mo up to $44,695 ($3,725/mo). Couples (household size 2, pre-2023 example): up to $40,058 annually. Full table varies yearly; highest eligibility ~$44,695 individual as of 7/1/2024 update. Excludes Alaska Permanent Fund Dividend[1][3][4][5].
- Assets: No asset limits; assets such as savings, property not considered[1][4].
- Alaska resident with intent to remain
- U.S. citizen, legal alien, or qualified Native American (born in Canada/Mexico with treaty rights)
- Not in long-term care facility, psychiatric facility, Alaska Pioneers’ Home, or Alaska Veterans’ Home for >90 days
- Spouse must also be 65+ if applying jointly

**Benefits:** Monthly cash payments in three tiers: $250, $175, or $125, based on gross annual income brackets and state funding availability. Amounts can be reduced if funding insufficient (e.g., highest tier was $76 pre-2016, increased to $125 by 7/1/2024)[4][5][6].
- Varies by: household_size

**How to apply:**
- Mail or in-person to Division of Public Assistance (DPA) offices statewide
- Phone: Contact local DPA office (specific numbers via dhss.alaska.gov/dpa/)
- Download form from dhss.alaska.gov/dpa/[3]

**Timeline:** DPA must act within 30 days, but delays reported up to 5 months[1][3].
**Waitlist:** No waitlist mentioned; payments depend on funding and applications[4][5].

**Watch out for:**
- Income limits and payment amounts change annually (April for limits, funding-based anytime); check current via DPA[1][4][5].
- Gross income before deductions/taxes; many miss including all sources like Native corp payments[3].
- Ineligible after 90 days in care facilities; must report changes (address, income, institutionalization)[1][3].
- Higher income threshold than most benefits, assets ignored—property owners often qualify[1].
- Processing delays beyond 30 days common[1].
- Spouse must be 65+ for joint application[3].

**Data shape:** Three-tiered monthly cash payments scaled by gross income brackets (tied to AK Federal Poverty Guidelines, household size); no asset test; funding-dependent amounts; statewide via DPA with annual adjustments.

**Source:** https://dhss.alaska.gov/dpa/

---

### Adult Public Assistance (APA)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18 or older with blindness (corrected vision 20/200 or less, or visual field 20 degrees or less) or disability (physical/mental condition preventing regular work for pay, lasting or expected to last 12 months, not caused by drug/alcohol use)[1]+
- Income: Countable monthly income must be at or below APA limits (exact current limits and payment standards available at health.alaska.gov APA income limits page). Examples: $1,795 for single living independently (not getting help with both food/shelter); $2,658 for couple where both are 65+ or disabled. Varies by household composition, shelter help, and living situation; SSI countable income rules apply (excludes SNAP, PFD; less than half earned income counted)[1][4][5]
- Assets: Countable resources ≤ $2,000 individual or $3,000 couple (money/property convertible to cash owned by applicant/spouse). Exemptions per SSI rules (full list at SSI Spotlight on Resources); real property owned by Alaska Native/American Indian excluded for APA-related Medicaid but counted for APA cash[1][5]
- U.S. citizen or qualified immigrant[1]
- Alaska resident[1]
- Apply for all other benefits (SSI, pensions, VA, unemployment, workers' comp, etc.)[1]
- Social Security Number or proof applied for[2]

**Benefits:** Monthly cash assistance for basic needs to live independently; amount based on countable income below APA payment standards (e.g., up to $1,329 need standard for single in some cases, varies by situation)[1][5]
- Varies by: household_size

**How to apply:**
- Online: Alaska Connect Portal[2]
- Phone: Virtual Contact Center 800-478-7778 (TDD/Alaska Relay: 7-1-1)[2]
- Mail/fax/email/in-person/drop box/secure messaging: to Division of Public Assistance (DPA) office; use Senior Benefits Application or DPA Application for Services/DPA Medicaid Application for Adults/Children with Long Term Care Needs[2][4]
- In-person: Any DPA office[4]

**Timeline:** Not specified in sources

**Watch out for:**
- Must apply for all other benefits first (SSI, VA, etc.), even if denied[1]
- Disability must meet specific criteria (not drug/alcohol caused, 12+ months)[1]
- Income/resources calculated via SSI rules; some exclusions (SNAP, PFD) but Alaska Native property counted for cash (not Medicaid)[1][4][5]
- Age 65+ with income < SSI standard must apply for SSI[8]
- Initial denials common; prepare to appeal[3]

**Data shape:** Income/payment standards vary by household size, living situation (e.g., shelter help), and SSI countable rules; statewide but regional DPA offices; requires pursuing other benefits first; asset exemptions follow SSI with Alaska Native property nuance

**Source:** https://health.alaska.gov/en/services/adult-public-assistance-apa/[1]

---

### Senior Access Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household gross annual income must not exceed 100% of area median income (AMI) adjusted for household size. Limits published annually by AHFC by census area, typically updated February-April. Automatic qualification if household receives Alaska Senior Benefits, APA/IA, ATAP/TANF, or federally-funded Low-Income Home Energy Assistance. Exact dollar amounts vary by region and household size; see current AHFC income limits for specific areas.
- Alaska resident
- Documented need for accessibility modifications by medical professional, caseworker, or caregiver
- Prove home ownership or lease agreement from landlord
- Property must be principal residence (single-family homes, condos, manufactured homes, up to fourplexes; not government-owned/public housing)

**Benefits:** Grants for home accessibility modifications to support independent living. Amounts vary: up to $15,000 (owner-occupied), $10,000 (rental tenants), $7,000 (small state-licensed assisted living, 5 beds or less); some sources note up to $25,000 owners, $20,000 tenants/ALF. Modifications cannot exceed $14,000 per ALF (limit 2 grants per facility). Funded via AHFC partnering with local nonprofits.
- Varies by: region|tenure_type|provider

**How to apply:**
- Contact intermediary agency/nonprofit serving your community (e.g., Alaska CDC for Anchorage, Mat-Su, Kenai Peninsula, Copper River Basin, Kodiak, Fairbanks, Tok)
- Alaska CDC application: Contact Lori Tice or Alaska CDC directly
- Intent to Apply Form via AHFC Notice of Funding Availability
- Submit application packet with proofs

**Timeline:** About 30 days
**Waitlist:** Funding availability-based; subject to Notice of Funding Availability (e.g., February 2026 NOFA)

**Watch out for:**
- Not statewide direct access—must go through local intermediary agency serving your area
- Income limits are area median income (AMI), not fixed poverty levels; vary by household size and region—check current AHFC tables
- Requires documented medical/professional need for modifications
- Funding is grant-based with periodic Notices of Funding Availability; may have limited availability
- Not cash or ongoing benefits—specific to one-time accessibility mods; property must be principal residence, no public housing
- Waivers for income over limits possible with AHFC approval if justifiable need

**Data shape:** Delivered via regional nonprofit intermediaries funded by AHFC; grant amounts vary by home tenure (own/rent/ALF) and region; income at 100% AMI by area/household size with auto-qualifiers; funding rounds via NOFA

**Source:** https://www.ahfc.us/pros/homelessness/assistance-grants/senior-access-program-sap

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Adults with Physical & Developmental Dis | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Alaska Energy Assistance (LIHEAP) | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| Meals on Wheels (Alaska Senior Nutrition | benefit | federal | medium |
| Alzheimer's Family Caregiver Support Pro | benefit | state | deep |
| Senior Benefits Program | benefit | state | deep |
| Adult Public Assistance (APA) | benefit | state | deep |
| Senior Access Program | benefit | local | medium |

**Types:** {"benefit":11}
**Scopes:** {"state":4,"local":2,"federal":5}
**Complexity:** {"deep":9,"medium":2}

## Content Drafts

Generated 6 page drafts. Review in admin dashboard or `data/pipeline/AK/drafts.json`.

- **Adults with Physical & Developmental Disabilities Waiver (APDD)** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Alaska Energy Assistance (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 6 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier|region**: 1 programs
- **region**: 2 programs
- **program_tier**: 1 programs
- **household_size**: 3 programs
- **household_size|priority_tier|region**: 1 programs
- **priority_tier**: 2 programs
- **region|tenure_type|provider**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Adults with Physical & Developmental Disabilities Waiver (APDD)**: Requires dual eligibility (Medicaid + NFLOC via specialized IDD assessment); services vary by age, location, and provider; not elderly-focused without developmental disability
- **Program of All-Inclusive Care for the Elderly (PACE)**: No income/asset test for eligibility; strictly limited to few PACE centers/service areas (none confirmed in Alaska sources); requires NFLOC + community safety; dual-eligible get full coverage, others pay premium; not statewide.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Income/asset limits higher in Alaska due to FPL; tiered by QMB (lowest income, most benefits), SLMB, QI (highest income, Part B only, capped funding); no age requirement (Medicare-tied, typically 65+); household size affects via FPL scaling.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled special rules: higher gross limit (200% FPL), asset $4,500, medical/shelter deductions; ESAP simplifies recert; benefits scale by household size/net income.
- **Alaska Energy Assistance (LIHEAP)**: Administered statewide via DPA with tribal sub-grantees; benefits/payment scale by income/size/region/heat type; priority tiers for elderly/disabled/emergencies; seasonal with early funding exhaustion.
- **Weatherization Assistance Program**: Administered statewide by regional providers via AHFC/DOE funding; priority tiers heavily influence access; 15-year re-weatherization limit; income at 100% AMI with table by household size.
- **Meals on Wheels (Alaska Senior Nutrition Programs)**: Decentralized by region with local providers/senior centers; no statewide income/asset test; eligibility emphasizes homebound/mobility need over finances; varies by urban (Anchorage/Fairbanks) vs. rural/borough (North Slope/Southeast)
- **Alzheimer's Family Caregiver Support Program**: Dual structure: CSRCP (diagnosis-specific with financial tests) and NFCSP/FCSP (broader, no income test); locally administered by grantees in communities; no service caps on respite but priority-based allocation.
- **Senior Benefits Program**: Three-tiered monthly cash payments scaled by gross income brackets (tied to AK Federal Poverty Guidelines, household size); no asset test; funding-dependent amounts; statewide via DPA with annual adjustments.
- **Adult Public Assistance (APA)**: Income/payment standards vary by household size, living situation (e.g., shelter help), and SSI countable rules; statewide but regional DPA offices; requires pursuing other benefits first; asset exemptions follow SSI with Alaska Native property nuance
- **Senior Access Program**: Delivered via regional nonprofit intermediaries funded by AHFC; grant amounts vary by home tenure (own/rent/ALF) and region; income at 100% AMI by area/household size with auto-qualifiers; funding rounds via NOFA

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Alaska?
