# South Dakota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 1.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 16 |
| New (not in our data) | 12 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 10 programs
- **financial**: 2 programs
- **in_kind**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### HOPE Waiver (Home & Community-Based Options and Person Centered Excellence)

- **min_age**: Ours says `65` → Source says `65 or older, OR 18-64 with a qualifying disability from Social Security Administration[1][2]` ([source](South Dakota Department of Social Services (dss.sd.gov); Medicaid.gov waiver listing: medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services for individuals who need nursing facility level of care[5]` ([source](South Dakota Department of Social Services (dss.sd.gov); Medicaid.gov waiver listing: medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]))
- **source_url**: Ours says `MISSING` → Source says `South Dakota Department of Social Services (dss.sd.gov); Medicaid.gov waiver listing: medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,350` ([source](https://dss.sd.gov/medicaid/Eligibility/default.aspx))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copays. SLMB/QI: Pays Part B premiums only. Automatic qualification for Extra Help (Part D low-income subsidy, e.g., ≤$12.65 copay per drug in 2026). No specific dollar amounts beyond premiums (Part B ~$185/month in 2026, state pays directly to Medicare).[2][4]` ([source](https://dss.sd.gov/medicaid/Eligibility/default.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sd.gov/medicaid/Eligibility/default.aspx`

### Respite Care/Caregiver Support (HOPE Waiver & Family Support 360)

- **min_age**: Ours says `65` → Source says `65 or older, or 18-64 with qualifying disability (SSA designation or needs requiring long-term supports/services)` ([source](https://dss.sd.gov (DSS Long Term Services and Supports); Medicaid.gov waiver page: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]))
- **income_limit**: Ours says `$2901` → Source says `$2,313` ([source](https://dss.sd.gov (DSS Long Term Services and Supports); Medicaid.gov waiver page: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and community-based services including respite and caregiver services, in-home services, nutrition/meals, safety/transportation, adult day services, community living home, assisted living; specific to respite/caregiver support as core services[5]` ([source](https://dss.sd.gov (DSS Long Term Services and Supports); Medicaid.gov waiver page: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sd.gov (DSS Long Term Services and Supports); Medicaid.gov waiver page: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]`

### Long-Term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Information and referral assistance; education on residents' rights; complaint investigation and resolution; conflict mediation; representation to ensure fair treatment, health, safety, welfare, and rights in long-term care facilities. No financial aid, hours, or dollar amounts provided[5][7][9].` ([source](https://dhs.sd.gov/ltss/ombudsman-program[7]))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.sd.gov/ltss/ombudsman-program[7]`

## New Programs (Not in Our Data)

- **South Dakota Medicaid for Seniors/Disabled** — service ([source](https://dss.sd.gov/economicassistance/medical_eligibility.aspx))
  - Shape notes: LTC eligibility has strict NHLOC and separate income/asset tables by marital status; SSI auto-qualifies but waivers/nursing require medical review; spousal protections via Community Spouse Resource Allowance.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://dhs.sd.gov (South Dakota DHS; no specific PACE page as program not active); national: https://www.cms.gov/medicare/medicaid-coordination/about/pace[2]))
  - Shape notes: Not available in South Dakota (feasibility stage only, no providers or service areas); nationally limited to specific PACE centers/service areas, no income/asset tests
- **SNAP/Food Assistance (Senior Box Program/CSFP)** — in_kind ([source](https://doe.sd.gov/cans/csfp.aspx))
  - Shape notes: State-administered via local agencies; income at 150% FPL; fixed monthly food box; no asset test; distribution sites vary by region.
- **Low Income Energy Assistance Program (LIEAP)** — financial ([source](https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx[5]))
  - Shape notes: Income at 200% FPL with 3-month lookback; no asset test; benefits as one-time payment varying by income/size/fuel; Weatherization county-specific via 4 providers; categorical eligibility via SNAP/active LIEAP for related programs.
- **Weatherization Assistance** — service ([source](https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx))
  - Shape notes: Administered regionally by 4 county-specific community action agencies; priority tiers (elderly/disabled/children); renters require landlord buy-in; ties to LIEAP for categorical eligibility; no asset test, income at 200% FPL.
- **Senior Health Information and Insurance Education (SHIINE)** — service ([source](https://dhs.sd.gov/en/ltss/shiine))
  - Shape notes: No income/asset/age tests—universal access for Medicare-related population; regionally coordinated volunteer network with required outreach to Native reservations; counseling-focused SHIP program, not benefits-paying
- **Meals on Wheels** — service ([source](https://dakotaathome.sd.gov/ (Dakota at Home portal for referrals and local programs)))
  - Shape notes: Decentralized by region with local non-profits; no uniform income/asset test, emphasis on homebound 60+; Older Americans Act funded with donations; under 60 routed to Dakota at Home
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://dlr.sd.gov/workforce_services/individuals/scsep/participants.aspx))
  - Shape notes: Limited to 3 regional areas (not statewide); income at 125% FPL scales by household size; priority tiers affect access; no fixed processing times or waitlist info available
- **Legal Aid for Seniors** — service ([source](https://www.dpls.org/eligibility (DPLS); https://sdlawhelp.org/about/ (unified intake)))
  - Shape notes: Multiple regional providers with varying income thresholds (seniors often exempt); unified online application at sdlawhelp.org; services tiered by case priority and resources, not fixed hours/dollars
- **Senior Companions of South Dakota** — service ([source](https://www.good-sam.com/senior-companions))
  - Shape notes: Two-sided program: free client services funded by stipended low-income volunteers (55+); no client income test, volunteer income scales by household size with medical deductions; regional phone lines and agency referrals.
- **60's Plus Dining** — service ([source](https://sixtiesplusdining.com/ and https://www.interlakescap.com/custom/60-s-plus-dining))
  - Shape notes: Regional to 10 counties only; no income/asset test; multiple meal delivery options (congregate, prepaid card, home-delivered, frozen); donation-suggested, unlimited meals.
- **Senior Box Program (CSFP)** — in_kind ([source](https://www.fns.usda.gov/csfp (USDA CSFP); local via dakotaathome.sd.gov))
  - Shape notes: County-restricted with local providers; income test at 130-150% FPL; no asset limits specified; distribution schedules and exact service areas vary by region.

## Program Details

### South Dakota Medicaid for Seniors/Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For 2026 Long-Term Care Medicaid (relevant for seniors/disabled): Single: $2,901/month; Married (both applying): $5,802/month; Married (one applying): $2,901/month for applicant (spousal impoverishment rules apply for community spouse). SSI recipients auto-qualify. General Medicaid for disabled: varies by category, e.g., up to 138% FPL (~$2,163/month for single in 2026 ACA context, but LTC has specific limits). Full table per household size not explicitly detailed; consult DSS for exact FPL-based adjustments.[1][6]
- Assets: Single: $2,000; Married (both applying): $4,000; Married (one applying): $2,000 for applicant ($148,620 Community Spouse Resource Allowance for non-applicant spouse in 2026). Counts: bank accounts, stocks, bonds, second vehicles, income-producing property. Exempt: primary home (up to $713,000 equity if intent to return), one vehicle, personal belongings, burial plots, life insurance (face value ≤$1,500), irrevocable burial trusts.[1][6]
- South Dakota resident
- U.S. citizen or qualified alien
- Valid Social Security Number
- Assign rights to medical support/payment
- Nursing Home Level of Care (NHLOC) for LTC/Nursing Home/Waivers (medical need for long-term care)
- Disabled as determined by SSA or DSS (for non-aged)
- Functional need for ADLs for some regular Medicaid LTC services

**Benefits:** Long-term care services including nursing home care, home health aide, personal attendant services, home modifications (if unable to live safely at home independently), hospital stays, doctor visits, prescriptions. Covers services Medicare does not, like certain home-based long-term supports. No fixed dollar amounts or hours specified; based on medical need and approved level of care.[1][4][7]
- Varies by: priority_tier

**How to apply:**
- Online: http://dss.sd.gov/applyonline
- Phone: 1-855-256-6742 (eligibility calculator line; general DSS contact)
- Mail: Any local DSS office
- In-person: Local DSS office

**Timeline:** 45 days for most applications; 90 days if disability determination required.[5]
**Waitlist:** Not mentioned in sources; may apply for specific waivers/services.[1]

**Watch out for:**
- SSI auto-eligibility, but LTC requires separate NHLOC determination.
- Over limits? Spend-down or qualify via spousal impoverishment/Medicaid planning (e.g., exemptions, trusts).[1]
- 30-day resource assessment for disability; must meet or have income below SSI rate ($914 in 2023, adjusted).[2]
- Must present Medicaid card for services or risk denial.[5]
- Work requirement possible for expansion adults under 65 (pending federal approval).[3]

**Data shape:** LTC eligibility has strict NHLOC and separate income/asset tables by marital status; SSI auto-qualifies but waivers/nursing require medical review; spousal protections via Community Spouse Resource Allowance.

**Source:** https://dss.sd.gov/economicassistance/medical_eligibility.aspx

---

### HOPE Waiver (Home & Community-Based Options and Person Centered Excellence)


**Eligibility:**
- Age: 65 or older, OR 18-64 with a qualifying disability from Social Security Administration[1][2]+
- Income: {"description":"Income limit is 300% of the Federal Benefit Rate (FBR), which adjusts annually in January[3]","2025_monthly_limit":"$2,901 per month for single applicants[3]","2019_reference":"Up to $2,313 per month (historical reference)[1]","married_applicants":"Each spouse evaluated individually; each allowed up to the monthly limit[1][3]","spousal_income_treatment":"For married couples where only one spouse applies, spousal income is not counted toward the applicant's limit[1]","needs_allowance":"Up to $3,160.50 per month of joint income can be allocated to the non-applicant spouse[1]"}
- Assets: {"single_or_widowed":"Up to $2,000 in countable assets (cash in checking/savings accounts and similar accessible resources)[1]","married_couples_both_applicants":"Each spouse must meet the $2,000 limit individually[1]","married_one_applicant":"Applicant must have $2,000 or less; non-applicant spouse may have up to $126,420 in countable assets[1]","home_equity_exemption":"Home is exempt if applicant lives in it or has intent to return; home equity interest cannot exceed $730,000 (2025 limit)[3]","additional_exemptions":"Home is also exempt if spouse, minor child (under 21), or disabled/blind child of any age lives in the home[3]"}
- Must be a South Dakota resident[6]
- Must meet nursing facility level of care (NFLOC) as determined by standardized assessment[2][4]
- Cannot currently reside in a hospital, nursing facility, or ICF/MR (Intermediate Care Facility for Mentally Retarded) setting[1]
- Must receive at least one waiver service at least once per month[1]
- Must participate in initial and ongoing assessments[8]
- Must have an individual support plan prepared[2]

**Benefits:** Home and community-based services for individuals who need nursing facility level of care[5]
- Varies by: Individual need and support plan; no specific dollar amounts or hour limits provided in search results

**How to apply:**
- Phone: Dakota at Home (833) 663-9673[5]
- Referral: Dakota at Home Referral for HOPE Waiver/State Plan Services[4]

**Timeline:** Not specified in available sources
**Waitlist:** Program capped at 1,834 concurrent recipients as of 2019[1]; current waitlist status not specified in search results

**Watch out for:**
- Program has a hard cap on concurrent recipients (1,834 as of 2019)[1] — families should verify current availability before investing time in application
- Applicant cannot currently live in a nursing facility, hospital, or ICF/MR setting to qualify[1] — this is a community-based program only
- Income and asset limits are strictly enforced; applying when over limits will result in automatic denial[3]
- Home equity limit of $730,000 (2025) applies even if home is exempt[3] — high-value homes may disqualify applicants
- Must receive at least one waiver service monthly to maintain eligibility[1] — passive enrollment without service use is not permitted
- Nursing facility level of care determination is required[2] — not all elderly or disabled individuals qualify; functional need must be demonstrated
- Income limits are 300% of Federal Benefit Rate, which adjusts annually[3] — families should verify current year limits before applying
- Waiver approval expires September 30, 2026[7] — renewal status should be verified as this date approaches
- Specific dollar amounts for services and processing timelines are not publicly detailed[4] — families must contact Dakota at Home for detailed benefit information

**Data shape:** This program's eligibility is highly individualized based on functional need (nursing facility level of care) rather than categorical eligibility. Income and asset limits are fixed statewide but adjusted annually. The program operates under a concurrent recipient cap, creating potential waitlist dynamics. Benefits are service-based and individualized through support plans rather than fixed dollar amounts. The program is administered statewide through LTSS but specific regional variations in processing time, provider availability, or service delivery are not documented in available sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** South Dakota Department of Social Services (dss.sd.gov); Medicaid.gov waiver listing: medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits; open to anyone 55+ regardless of income, though most participants are dually eligible for Medicare and Medicaid[1][2][4]
- Assets: No asset limits mentioned; eligibility not based on assets[1]
- Live in a PACE service area
- Certified by the state as needing nursing home level of care
- Able to live safely in the community with PACE support[1][3][4][8]

**Benefits:** Comprehensive medical and social services via interdisciplinary team (primary care doctor, nurse, therapists, social worker, dietician, etc.), including adult day care, meals, home care, transportation, lab/X-ray, dentistry, hospital/nursing home care when needed, nutritional counseling, preventive care, home modifications, equipment; all coordinated to allow community living instead of nursing home[1][3][5]

**Timeline:** Initial assessment within 30 days of enrollment; care plan semi-annually thereafter[7]

**Watch out for:**
- PACE is not currently available in South Dakota; only in states with approved providers (SD has feasibility studies but no operational programs)[7][8][10]
- Must live in a designated PACE service area near a center; no statewide coverage[1][3]
- Becomes sole source of Medicare/Medicaid services for dually eligible enrollees; voluntary and can disenroll anytime[4]
- 95% of participants live in community, but covers nursing home if needed[6]

**Data shape:** Not available in South Dakota (feasibility stage only, no providers or service areas); nationally limited to specific PACE centers/service areas, no income/asset tests

**Source:** https://dhs.sd.gov (South Dakota DHS; no specific PACE page as program not active); national: https://www.cms.gov/medicare/medicaid-coordination/about/pace[2]

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: South Dakota follows federal guidelines with state-specific limits that vary by program and year. For 2026 (current year), federal limits are: QMB - Individual: $1,350/month, Couple: $1,824/month; SLMB and QI have higher limits (e.g., individual ~$1,526-$1,715 based on prior year data, adjusted annually to ~120-135% FPL). 2025 SD-specific examples: QI individual <$1,781/month, couple <$2,400/month (includes $20 disregard). Limits based on countable income after disregards; full household table not specified beyond individual/couple—contact DSS for exact current table by size[2][4][6].
- Assets: Applies to all programs: Individual $9,430-$9,950 (varies by source/year), Couple $14,130-$14,910. Counts: checking/savings, CDs. Exempt: primary home, one car, burial plots, irrevocable burial trusts. Older SD source notes lower $4,000 individual/$6,000 couple—use current federal-aligned limits and verify with state[1][3][4][6].
- Must be entitled to/receiving Medicare Part A and/or B (both A&B for SLMB/QI).
- U.S. citizen or qualified immigrant.
- Reside in South Dakota.
- For QI: Annual reapplication required; first-come, first-served with priority to prior recipients.

**Benefits:** QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copays. SLMB/QI: Pays Part B premiums only. Automatic qualification for Extra Help (Part D low-income subsidy, e.g., ≤$12.65 copay per drug in 2026). No specific dollar amounts beyond premiums (Part B ~$185/month in 2026, state pays directly to Medicare).[2][4]
- Varies by: priority_tier

**How to apply:**
- Mail/PDF form: Download 'Application for Medicare Savings Programs' from https://dss.sd.gov/formsandpubs/docs/MEDELGBLTY/270Medicaresavingsapplication.pdf[2].
- Phone: Call DSS at 1-877-999-5612 (toll-free) or TTY/TDD 1-877-486-2048; ask for benefits specialist[6].
- In-person/mail: Local DSS office or SHIINE volunteer assistance (free counseling/application help)[6].
- Online info: https://dss.sd.gov/medicaid/Eligibility/default.aspx[2]. No fully online application specified.

**Timeline:** Not specified in sources; typically 45 days for Medicaid-related apps—verify with DSS.
**Waitlist:** QI has first-come, first-served with waitlist possible if funding exhausted (priority to prior year recipients)[4].

**Watch out for:**
- Income/resource limits change annually (e.g., 2025 vs 2026)—always verify current with DSS as sources conflict slightly[1][4][6].
- QI requires annual reapplication and has funding caps/waitlists[4].
- Countable income uses disregards ($20 general, others)—gross income may overestimate ineligibility[6].
- Automatic Extra Help enrollment often missed[1][4].
- Exempt assets like burial trusts overlooked[3][6].
- Must have Medicare entitlement; not for non-Medicare eligible.

**Data shape:** Tiered by program (QMB fullest benefits, SLMB/QI premiums only); income scales to FPL % (100%/120%/135%); assets individual/couple only (no full household table); QI funding-limited with priority tiers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sd.gov/medicaid/Eligibility/default.aspx

---

### SNAP/Food Assistance (Senior Box Program/CSFP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income at or below 150% of the federal poverty guidelines. Exact dollar amounts vary annually; contact local agency for current table as specific figures not listed in sources for South Dakota (federal guidelines published by HHS).[3][6][7]
- Assets: No asset limits mentioned.
- South Dakota resident.
- Must reside in a participating service area (local agencies may designate).

**Benefits:** Monthly box of non-perishable USDA foods at no cost, including cheese, juice, oats, ready-to-eat cereal, rice, pasta, peanut butter, dry beans, canned meat, poultry, or fish, canned fruits and vegetables, and often a canned entree such as beef stew or chili.
- Varies by: fixed

**How to apply:**
- Call local agency or Feeding South Dakota (example: 605-853-3656 for Miller site).
- Contact state or local distribution sites for in-person application.
- No specific online URL or mail address listed; apply via phone or in-person at local agencies.

**Timeline:** Not specified.
**Waitlist:** Not mentioned; may vary by local availability.

**Watch out for:**
- Separate from SNAP; can receive both simultaneously.
- No automatic dual eligibility mentioned for SSI (unlike some states).
- Availability depends on local agency stock and service areas; call ahead.
- All participants must be 60+; no women/infants/children since 2014.
- Income is gross monthly before taxes at 150% FPL specific to SD (higher than federal max of 130%).

**Data shape:** State-administered via local agencies; income at 150% FPL; fixed monthly food box; no asset test; distribution sites vary by region.

**Source:** https://doe.sd.gov/cans/csfp.aspx

---

### Low Income Energy Assistance Program (LIEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income must be at or below 200% of the federal poverty level, based on the most recent three months of income for all household members. Households where all members receive SNAP are automatically categorically eligible. Specific annual income limits for larger households (from DSS table): 7-person: $22,514; 8-person: $23,014; 9-person: $23,514; 10-person: $24,431. Limits scale by household size but exact table for 1-6 not detailed in sources; check official DSS for current full table.[5][2]
- Assets: No asset limit applies.[1]
- Household must be responsible for heating costs (paid directly to supplier or included in rent).
- Application must be signed by all household members age 18+.
- Funding availability affects eligibility.[3]

**Benefits:** One-time supplemental payment for home heating costs, paid directly to utility or energy supplier. Exact dollar amounts vary by household income, size, fuel type, and funding; not fixed per source. Related: Cooling Assistance $1025 for eligible LIEAP recipients; ECIP for crises; Weatherization for efficiency upgrades (no fixed $).[1][2][5]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: https://www.sd.gov/cs?id=sc_cat_item&sys_id=a254bd6edbf7f410b2fb93d4f3961974 (Low Income Energy Assistance Application).[6]
- Mail: South Dakota Department of Social Services, Office of Energy Assistance, 700 Governors Drive, Pierre, SD 57501.[5]
- Email: Scan and send to DSSHeat@state.sd.us.[5]

**Timeline:** Not specified in sources; apply early as funding is limited and may close when depleted.[1]
**Waitlist:** Possible for Weatherization due to limited funds; not specified for main LIEAP.[5]

**Watch out for:**
- Funding limited; apply early in fall/winter as applications may close when funds deplete (not year-round).[1]
- No cooling assistance from main LIEAP; separate Cooling program only for prior/recent LIEAP recipients paying own electric.[2]
- Crisis (ECIP) requires active LIEAP case plus emergency like shutoff.[2][5]
- Roommates sharing utility bill count as one household.[1]
- Weatherization needs landlord permission for renters + landlord contribution; priority to elderly/disabled/families.[5]

**Data shape:** Income at 200% FPL with 3-month lookback; no asset test; benefits as one-time payment varying by income/size/fuel; Weatherization county-specific via 4 providers; categorical eligibility via SNAP/active LIEAP for related programs.

**Source:** https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx[5]

---

### Weatherization Assistance

> **NEW** — not currently in our data

**Eligibility:**
- Income: Annual household income up to 200% of the federal poverty level. Households currently eligible for LIEAP (Low Income Energy Assistance Program) are categorically income eligible. Exact limits vary by household size and year; for reference, LIEAP-related table shows higher household sizes (e.g., 7-person: $22,514; 8-person: $23,014; 9-person: $23,514; 10-person: $24,431), but WAP uses 200% FPL directly[1][2][3].
- Assets: No asset limits mentioned in program guidelines[1][2].
- Priority given to elderly, individuals with disabilities, families with children under 19, and single-family dwellings[1][2][6].
- Home must not have received weatherization services in the previous 15 years[5].
- Renters eligible only with written landlord permission; landlord contributes 1/3 of costs (or full if income below 200% FPL in some cases)[2][5].
- Proof of ownership required for owner-occupied (deed or property tax notice)[4][5].
- Home must pass energy audit and be feasible for rehabilitation[3][5].

**Benefits:** Free home weatherization services including: weather-stripping doors/windows, caulking/sealing cracks, insulating attics/walls/under floors, repairing/tuning/replacing non-functional heating systems, incidental repairs to protect materials. May include air sealing, appliance repair/replacement, window/door/furnace replacement based on energy audit. Average annual savings ~$372 per household[1][2][3][4]. No direct dollar amount per home; one-time grant-like service.
- Varies by: priority_tier

**How to apply:**
- Contact Community Action Agency serving your county (county-specific; see map in dss.sd.gov/formsandpubs/docs/ENERGY/weatherizationbro.pdf or list on dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx)[1][2].
- Download printable application from dss.sd.gov/weatherization or dss.sd.gov/formsandpubs/docs/ENERGY/WeatherizationApplication.pdf[1][6].
- Examples: WSDCA (Western SD) - call 605-348-1460, email kpalmer@wsdca.org, or online form at wsdca.org/weatherization-assistance-application[4]; GROW SD (Sisseton area) - mail to 104 Ash Street East, Sisseton, SD 57262 or email info@growsd.org, phone 605-698-7654[5]; Inter-Lakes CAP (Madison area) - contact Carolyn Feige at 111 N Van Eps Ave, Madison SD 57042[7].

**Timeline:** Not specified; energy audit conducted post-eligibility[3].
**Waitlist:** Funds limited; may be placed on waiting list[2].

**Watch out for:**
- Must contact specific county Community Action Agency; not centralized DSS intake[1][2].
- Renters need landlord permission and contribution (1/3 cost typically)[2][5].
- Home ineligible if weatherized in last 15 years[5].
- LIEAP participants are auto-eligible (income-wise), speeding process[3][6].
- Waiting lists common due to limited funds[2].
- Application denied if incomplete or missing proof[6].

**Data shape:** Administered regionally by 4 county-specific community action agencies; priority tiers (elderly/disabled/children); renters require landlord buy-in; ties to LIEAP for categorical eligibility; no asset test, income at 200% FPL.

**Source:** https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx

---

### Senior Health Information and Insurance Education (SHIINE)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, those approaching Medicare, and their caregivers[3][4]
- Assets: No asset limits or tests apply[3][4]
- Must be a Medicare beneficiary in South Dakota, approaching Medicare eligibility, or a caregiver of someone on/approaching Medicare[3][4]

**Benefits:** Free, confidential, unbiased one-on-one counseling on Medicare Parts A/B, Part D prescription drugs, Medicare Advantage (HMOs/PPOs), Medigap, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, other insurance/free health programs; assistance with Low Income Subsidy (LIS) enrollment, plan comparison to avoid overpaying; fraud prevention via Senior Medicare Patrol (SMP); educational outreach events, printed materials, referrals[1][5]

**How to apply:**
- Phone: Toll-free (800) 536-8197 or 1-888-854-5321; hours 9:00am-4:30pm CT[2][7]
- Website: https://dhs.sd.gov/en/ltss/shiine or https://www.shiine.net[2][3]
- Email: caitlin.christensen@state.sd.us or region-specific like western_region@shiine.net[2][4]
- In-person or phone appointment scheduling via regional coordinators or trained volunteer counselors statewide[4][5][6]

**Timeline:** Immediate counseling appointment scheduling; no formal processing as it's not an entitlement program[4]

**Watch out for:**
- Not a healthcare or financial aid program—provides education/counseling only, no direct payments or medical services; volunteers cannot have active insurance licenses; not affiliated with insurance sellers[1][3][6]
- During Medicare Open Enrollment (e.g., Oct 15-Dec 7 for 2026 changes), expect higher demand for Part D/LIS help[1][6]
- Electronic data transmission must be encrypted for privacy[1]

**Data shape:** No income/asset/age tests—universal access for Medicare-related population; regionally coordinated volunteer network with required outreach to Native reservations; counseling-focused SHIP program, not benefits-paying

**Source:** https://dhs.sd.gov/en/ltss/shiine

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict statewide income limits; programs prioritize low-income seniors and follow federal poverty guidelines in some areas (e.g., commodity meals for households at or below 150% of federal poverty level). Medicaid/SSI recipients often qualify. Suggested donations requested but no one denied for inability to pay[1][3][6].
- Assets: Not applicable; no asset tests mentioned across programs[1][3].
- Homebound and unable to cook or shop independently[1][2][6][8][9]
- Spouse or dependent adult of 60+ participant may qualify regardless of age[2][3]
- Under 60 must contact Dakota at Home for separate eligibility assessment[2][8]

**Benefits:** One hot nutritious home-delivered meal per weekday (Monday-Friday); congregate dining also available at sites. Suggested donation $4.25-$5.25/meal (under 60 pay full ~$6.50); private pay option $15/meal in some areas. Funded by Older Americans Act[3][6][8][9].
- Varies by: region

**How to apply:**
- Call local provider (e.g., Active Generations: (605) 333-3305 or 1-833-663-9673; Dakota at Home for under 60[2][8]
- Enroll online via Dakota at Home Referral Form[2][8]
- Request brochure by mail from Meals on Wheels Western SD[3]
- Contact local senior center or Meals on Wheels provider directly[1]

**Timeline:** Not specified; immediate enrollment encouraged where available[2][3].
**Waitlist:** Limited meals available; priority for need but no explicit waitlists noted[3].

**Watch out for:**
- Not a single statewide program—must contact local provider; homebound status key, not just age[1][9]
- Suggested donations appreciated but no denial for non-payment; limited meals may prioritize lowest need[3]
- Under 60 requires separate Dakota at Home check, not standard Meals on Wheels[2][8]
- Varies by exact community; some areas have private pay only if slots full[3][5]

**Data shape:** Decentralized by region with local non-profits; no uniform income/asset test, emphasis on homebound 60+; Older Americans Act funded with donations; under 60 routed to Dakota at Home

**Source:** https://dakotaathome.sd.gov/ (Dakota at Home portal for referrals and local programs)

---

### Respite Care/Caregiver Support (HOPE Waiver & Family Support 360)


**Eligibility:**
- Age: 65 or older, or 18-64 with qualifying disability (SSA designation or needs requiring long-term supports/services)+
- Income: Applicant income up to 300% of Federal Benefit Rate (FBR): $2,313/month (2019)[1], $2,901/month (2025)[2], regardless of marital status; each spouse considered individually if both applying; spousal Needs Allowance up to $3,160.50/month joint income[1]; no household size table provided
- Assets: $2,000 countable assets for single/widowed applicants (cash, checking/savings, accessible resources); married: applicant $2,000, non-applicant spouse up to $126,420[1]; home equity ≤$730,000 if intent to return (2025), exempt if spouse/minor/disabled child in home[2]
- South Dakota resident
- Nursing Facility Level of Care (NFLOC) via Home Care Assessment (HCA) tool
- Not resident of hospital, nursing facility, or ICF/MR
- Receive at least one waiver service monthly
- Needs assessment and LTSS assessment by Case Management Specialist

**Benefits:** Home and community-based services including respite and caregiver services, in-home services, nutrition/meals, safety/transportation, adult day services, community living home, assisted living; specific to respite/caregiver support as core services[5]
- Varies by: priority_tier

**How to apply:**
- Phone: Dakota at Home (833) 663-9673[5]
- Dakota At Home Referral for HOPE Waiver/State Plan Services

**Timeline:** Not specified in sources
**Waitlist:** Capped at 1,834 concurrent recipients (2019 data); implies waitlist when full[1]

**Watch out for:**
- Strict cap on slots (1,834 in 2019) leads to waitlists[1]
- Must use at least one service monthly or risk losing eligibility[1]
- Income/asset limits updated annually (FBR-based); apply only if qualified to avoid denial[2]
- Home equity limit applies unless exemptions met[2]
- Family Support 360 not detailed in sources; may be separate or branded caregiver program layered on HOPE
- Provider must have DHS/LTSS contract and Medicaid enrollment[3]

**Data shape:** Waiver capped by slots, not household size; NFLOC via specific HCA tool; respite/caregiver core but part of broad HCBS; annual FBR income updates; provider enrollment service-specific

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sd.gov (DSS Long Term Services and Supports); Medicaid.gov waiver page: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/83171[7]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Annual family income not more than 125% of the Federal Poverty Level (FPL). Exact dollar amounts vary annually and by household size; for reference, North Dakota's 2023 figures (similar guidelines) were: 1: $19,563; 2: $24,643; 3: $33,313; 4: $40,188. Check current FPL via HHS for South Dakota[1][2][6].
- Assets: No asset limits mentioned in South Dakota-specific sources.
- Resident of South Dakota
- Unemployed
- Eligible to work in the United States

**Benefits:** Part-time community service work (average 20 hours/week) at minimum wage (highest of federal, state, or local); training and counseling; job placement assistance; free annual physical exams; support for independence and social activities[1][2][3].
- Varies by: priority_tier

**How to apply:**
- Electronic: SCSEP application form (Adobe PDF) via DLR website
- In-person or pickup: Any South Dakota Department of Labor and Regulation (DLR) local office
- Contact workforce experts at DLR local offices for assistance (no specific statewide phone listed; use local office contacts or general DLR inquiry)

**Timeline:** Not specified
**Waitlist:** Not specified; may vary by region due to limited coverage areas

**Watch out for:**
- Not statewide—limited to West River, East River, Central areas only; check map first
- Priority enrollment for veterans/qualified spouses, then those 65+, disabled, rural residents, homeless/at-risk, low literacy/English proficiency, low employment prospects, or prior American Job Center users[3]
- Income is family-based at 125% FPL (updates yearly; verify current levels)
- Must be unemployed and seeking workforce transition; not permanent employment
- No asset test, but strict unemployment and residency rules

**Data shape:** Limited to 3 regional areas (not statewide); income at 125% FPL scales by household size; priority tiers affect access; no fixed processing times or waitlist info available

**Source:** https://dlr.sd.gov/workforce_services/individuals/scsep/participants.aspx

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limit for seniors; individuals age 60+ are eligible regardless of income at Dakota Plains Legal Services (DPLS) and some East River Legal Services (ERLS) programs. For general low-income eligibility (if under 60), typically 125-200% of Federal Poverty Guidelines depending on provider and priority (e.g., ERLS: 125% standard, up to 200% in cases; Access to Justice: 200% for elderly). Exact FPG amounts vary annually by household size and are calculated at application; no fixed table provided in sources.
- Assets: Non-exempt assets may be considered at ERLS for some services (details unspecified); no asset limits mentioned for seniors specifically at DPLS or statewide senior programs.
- South Dakota resident in service area (varies by provider)
- Greatest economic and social need for DHS-funded vulnerable older adults program
- U.S. citizen or permanent legal resident (ERLS)
- Case must fit program priorities (e.g., elder abuse, long-term care, consumer issues)

**Benefits:** Civil legal assistance including advice only, brief services (investigation, paperwork preparation), or full representation as counsel of record. Focus for seniors: elder abuse, long-term care, guardianship/conservatorship. No financial payouts; limited by resources and case merits.
- Varies by: priority_tier

**How to apply:**
- Online: https://www.sdlawhelp.org/apply (serves DPLS, ERLS, Access to Justice)
- Phone: DPLS local offices (check Areas Served page), ERLS (605) 336-9230 or (800) 952-3015, Access to Justice 855-287-3510, Disaster Hotline (605) 444-3719
- Email: access.to.justice@sdbar.net
- In-person: Local offices (e.g., DPLS, ERLS in eastern SD counties)

**Timeline:** Not specified; intake screening first, then attorney referral if eligible.
**Waitlist:** Subject to staff/volunteer availability and program resources; no formal waitlist details.

**Watch out for:**
- Not all eligible cases accepted due to federal case priority rules and resource limits
- Seniors over 60 bypass income test at DPLS but still need qualifying case type
- Preparation of paperwork does not commit to court representation
- Must reside in provider's service counties; referrals given if outside area
- Apply even if unsure—eligibility determined during screening

**Data shape:** Multiple regional providers with varying income thresholds (seniors often exempt); unified online application at sdlawhelp.org; services tiered by case priority and resources, not fixed hours/dollars

**Source:** https://www.dpls.org/eligibility (DPLS); https://sdlawhelp.org/about/ (unified intake)

---

### Long-Term Care Ombudsman


**Eligibility:**
- Income: No income limits; open to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Residing in or advocating for someone in a nursing home, assisted living community, or community living home in South Dakota[4][5].

**Benefits:** Information and referral assistance; education on residents' rights; complaint investigation and resolution; conflict mediation; representation to ensure fair treatment, health, safety, welfare, and rights in long-term care facilities. No financial aid, hours, or dollar amounts provided[5][7][9].

**How to apply:**
- Phone: 605-773-3656 or 1-855-642-3055[6][8]
- Email: LTCO@state.sd.us (include 'Volunteer' in subject for volunteer roles, but services available directly)[8]
- No formal application process or specific forms required; contact for assistance[4].

**Timeline:** Immediate assistance upon contact; no formal processing.

**Watch out for:**
- Not a Medicaid or financial eligibility program—focuses solely on advocacy and rights protection, not services like healthcare or funding[2][5][7].
- Available to family advocates, not just residents[4].
- No application barriers, but services target long-term care facility residents only[4][5].
- Often confused with long-term care funding programs[2].

**Data shape:** no income test; no formal application or documents; advocacy-only for long-term care facility residents statewide; volunteer certification option separate from receiving services

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.sd.gov/ltss/ombudsman-program[7]

---

### Senior Companions of South Dakota

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21 or older (primarily older adults; no upper limit specified for clients)+
- Income: No income limits for clients receiving services. Income guidelines apply only to volunteers (age 55+): One person household: $30,120; Two person: $40,380; Three person: $49,720; Four person: $60,000; Add $5,140 per additional member. 50% of limits deductible for medical expenses.[2]
- Assets: No asset limits mentioned for clients or volunteers.
- Need-based: disabilities, lack of other assistance, living alone, recuperating from hospital/nursing home, terminally ill, Alzheimer's or related disorders, or caregiver respite needs.[1]
- Services provided in homes or apartments.[1]

**Benefits:** Free companionship and assistance including: regular visits/friendship, help with daily activities, light housekeeping, meal planning/preparation, playing games, reminiscing, transportation (for errands, medical appointments, grocery shopping), respite for caregivers.[1][3][7] Volunteers serve 10-40 hours/week (average 10-15), typically 2-4 clients per volunteer.[3][4]

**How to apply:**
- Phone: Sioux Falls (605) 361-1133 or toll-free (888) 239-1210; Rapid City (605) 721-8884.[1][2][3]
- Contact referring agencies (e.g., Active Generations Sioux Falls (605) 336-6748; Avera@Home Pierre (605) 280-8768; others listed).[1]
- In-person at regional offices or agencies.[1]

**Timeline:** Not specified.
**Waitlist:** Not mentioned; availability considered in eligibility.[1]

**Watch out for:**
- Program matches low-income volunteers (55+) with clients; families apply to receive services, not become volunteers. No fees for clients, but volunteer availability determines service. Not professional healthcare—focuses on companionship/light assistance. Transportation limited to specific purposes (errands, medical, groceries).[1][2][3][7]
- Eligibility for clients is needs-based, not income-tested—people miss that volunteers have strict income limits.[1][2]

**Data shape:** Two-sided program: free client services funded by stipended low-income volunteers (55+); no client income test, volunteer income scales by household size with medical deductions; regional phone lines and agency referrals.

**Source:** https://www.good-sam.com/senior-companions

---

### 60's Plus Dining

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits. Open to any resident aged 60 or older, spouses, and caregivers regardless of income.[1][2]
- Assets: No asset limits or tests.
- South Dakota resident.
- For home-delivered meals: homebound due to illness or frailty.[1][2][4]

**Benefits:** Nutritious meals via: Congregate meals (eaten at sites for socialization), Star Card (pre-paid card for meals at sites like breakfast/lunch/supper), Home Delivered (hot meals Monday-Friday for homebound), Frozen Meals (7-pack with 7 meals, bread, milk, juice). Suggested donation $5 per meal or $35 per frozen pack; no one turned away. No meal limits.[1][2][4]
- Varies by: service_type

**How to apply:**
- Phone: 605-256-6518 Ext 107 (Program Director Stacie Santema).[2]
- In-person: Sites in 10 counties or ICAP office at 111 N Van Eps Ave, Madison SD 57042.[1][2]
- Contact via https://sixtiesplusdining.com/contact/ for locations.[1]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not statewide—only 10 east-central counties; confuse with statewide programs like Senior Food Box (income-tested commodities).[1][2][3][5]
- Donation-based but no one denied; some assume income test required.[1][2]
- Spouses/caregivers eligible even if under 60.[1]
- Home delivery requires being homebound.[2][4]

**Data shape:** Regional to 10 counties only; no income/asset test; multiple meal delivery options (congregate, prepaid card, home-delivered, frozen); donation-suggested, unlimited meals.

**Source:** https://sixtiesplusdining.com/ and https://www.interlakescap.com/custom/60-s-plus-dining

---

### Senior Box Program (CSFP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income at or below 130-150% of federal poverty guidelines (FPL), varying by provider and year; states set limits at or below 130% FPL per USDA rules, but South Dakota providers cite 150% FPL. Exact dollar amounts published annually by HHS; e.g., for 2026, check current FPL tables as they adjust yearly—no household size table specified in sources, applies to household income.
- Must reside in a participating South Dakota county or service area served by local providers (e.g., Minnehaha/Lincoln Counties for Salvation Army Sioux Falls; statewide via Feeding South Dakota in some areas).

**Benefits:** Monthly box of USDA commodity foods (~40 lbs), including cereals, canned meat/fruits/vegetables, instant milk, peanut butter, instant potatoes, pasta, rice, oats, dry beans, juice, cheese; menus change monthly; provided at no cost for 6-12 months.
- Varies by: region

**How to apply:**
- Call local provider (e.g., Salvation Army Sioux Falls: 605-332-2331; Feeding South Dakota: 605-225-7410; Salvation Army Watertown: 605-886-4030)
- Apply in-person during distribution hours (e.g., 2nd Thursday 10am-3pm at Sioux Falls; 4th Friday 9am-12pm at Watertown)
- No statewide online or mail specified—contact local agency.

**Timeline:** Not specified—apply during office/distribution hours.
**Waitlist:** Possible due to local capacity; varies by provider and county—not explicitly detailed.

**Watch out for:**
- Not statewide—must check county/provider availability; cannot participate in both CSFP and WIC; income limits vary slightly by provider (130% vs 150% FPL); home delivery only for homebound; can combine with SNAP.
- Eligibility strictly 60+ (no children/women/infants post-2014).

**Data shape:** County-restricted with local providers; income test at 130-150% FPL; no asset limits specified; distribution schedules and exact service areas vary by region.

**Source:** https://www.fns.usda.gov/csfp (USDA CSFP); local via dakotaathome.sd.gov

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| South Dakota Medicaid for Seniors/Disabl | benefit | state | deep |
| HOPE Waiver (Home & Community-Based Opti | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP/Food Assistance (Senior Box Program | benefit | federal | deep |
| Low Income Energy Assistance Program (LI | benefit | state | deep |
| Weatherization Assistance | benefit | federal | deep |
| Senior Health Information and Insurance  | resource | state | simple |
| Meals on Wheels | benefit | federal | deep |
| Respite Care/Caregiver Support (HOPE Wai | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors | resource | local | simple |
| Long-Term Care Ombudsman | resource | federal | simple |
| Senior Companions of South Dakota | resource | state | simple |
| 60's Plus Dining | benefit | local | medium |
| Senior Box Program (CSFP) | resource | local | simple |

**Types:** {"benefit":10,"resource":5,"employment":1}
**Scopes:** {"state":6,"local":4,"federal":6}
**Complexity:** {"deep":10,"simple":5,"medium":1}

## Content Drafts

Generated 4 page drafts. Review in admin dashboard or `data/pipeline/SD/drafts.json`.

- **South Dakota Medicaid for Seniors/Disabled** (benefit) — 6 content sections, 6 FAQs
- **HOPE Waiver (Home & Community-Based Options and Person Centered Excellence)** (benefit) — 6 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 1 content sections, 5 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **Individual need and support plan; no specific dollar amounts or hour limits provided in search results**: 1 programs
- **not_applicable**: 4 programs
- **fixed**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **region**: 2 programs
- **service_type**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **South Dakota Medicaid for Seniors/Disabled**: LTC eligibility has strict NHLOC and separate income/asset tables by marital status; SSI auto-qualifies but waivers/nursing require medical review; spousal protections via Community Spouse Resource Allowance.
- **HOPE Waiver (Home & Community-Based Options and Person Centered Excellence)**: This program's eligibility is highly individualized based on functional need (nursing facility level of care) rather than categorical eligibility. Income and asset limits are fixed statewide but adjusted annually. The program operates under a concurrent recipient cap, creating potential waitlist dynamics. Benefits are service-based and individualized through support plans rather than fixed dollar amounts. The program is administered statewide through LTSS but specific regional variations in processing time, provider availability, or service delivery are not documented in available sources.
- **Program of All-Inclusive Care for the Elderly (PACE)**: Not available in South Dakota (feasibility stage only, no providers or service areas); nationally limited to specific PACE centers/service areas, no income/asset tests
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB fullest benefits, SLMB/QI premiums only); income scales to FPL % (100%/120%/135%); assets individual/couple only (no full household table); QI funding-limited with priority tiers.
- **SNAP/Food Assistance (Senior Box Program/CSFP)**: State-administered via local agencies; income at 150% FPL; fixed monthly food box; no asset test; distribution sites vary by region.
- **Low Income Energy Assistance Program (LIEAP)**: Income at 200% FPL with 3-month lookback; no asset test; benefits as one-time payment varying by income/size/fuel; Weatherization county-specific via 4 providers; categorical eligibility via SNAP/active LIEAP for related programs.
- **Weatherization Assistance**: Administered regionally by 4 county-specific community action agencies; priority tiers (elderly/disabled/children); renters require landlord buy-in; ties to LIEAP for categorical eligibility; no asset test, income at 200% FPL.
- **Senior Health Information and Insurance Education (SHIINE)**: No income/asset/age tests—universal access for Medicare-related population; regionally coordinated volunteer network with required outreach to Native reservations; counseling-focused SHIP program, not benefits-paying
- **Meals on Wheels**: Decentralized by region with local non-profits; no uniform income/asset test, emphasis on homebound 60+; Older Americans Act funded with donations; under 60 routed to Dakota at Home
- **Respite Care/Caregiver Support (HOPE Waiver & Family Support 360)**: Waiver capped by slots, not household size; NFLOC via specific HCA tool; respite/caregiver core but part of broad HCBS; annual FBR income updates; provider enrollment service-specific
- **Senior Community Service Employment Program (SCSEP)**: Limited to 3 regional areas (not statewide); income at 125% FPL scales by household size; priority tiers affect access; no fixed processing times or waitlist info available
- **Legal Aid for Seniors**: Multiple regional providers with varying income thresholds (seniors often exempt); unified online application at sdlawhelp.org; services tiered by case priority and resources, not fixed hours/dollars
- **Long-Term Care Ombudsman**: no income test; no formal application or documents; advocacy-only for long-term care facility residents statewide; volunteer certification option separate from receiving services
- **Senior Companions of South Dakota**: Two-sided program: free client services funded by stipended low-income volunteers (55+); no client income test, volunteer income scales by household size with medical deductions; regional phone lines and agency referrals.
- **60's Plus Dining**: Regional to 10 counties only; no income/asset test; multiple meal delivery options (congregate, prepaid card, home-delivered, frozen); donation-suggested, unlimited meals.
- **Senior Box Program (CSFP)**: County-restricted with local providers; income test at 130-150% FPL; no asset limits specified; distribution schedules and exact service areas vary by region.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in South Dakota?
