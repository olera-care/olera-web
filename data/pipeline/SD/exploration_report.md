# South Dakota Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.080 (16 calls, 1.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 14 |
| Programs deep-dived | 12 |
| New (not in our data) | 8 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 5 programs
- **financial**: 3 programs
- **in_kind**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid for the Aged, Blind and Disabled (ABD)

- **income_limit**: Ours says `$967` → Source says `$994` ([source](https://dss.sd.gov/medicaid/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Comprehensive Medicaid health coverage including doctor visits, hospital care, prescription drugs, long-term services (nursing home, home health, waivers for community-based care), help with ADLs. Nursing home: $100/month personal needs allowance. Specific services require NHLOC; no fixed dollar/hour amounts statewide—covers costs per approved plan.[3][4]` ([source](https://dss.sd.gov/medicaid/))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sd.gov/medicaid/`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$967` → Source says `$1,275` ([source](https://dss.sd.gov/medicaid/Eligibility/default.aspx))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copays. SLMB/QI: Pays Part B premiums only. Auto-qualifies for Extra Help (low/no Part D costs, e.g., ≤$12.65/drug in 2026). No fixed dollar/hour—covers full specified costs.[2][1][4][3]` ([source](https://dss.sd.gov/medicaid/Eligibility/default.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sd.gov/medicaid/Eligibility/default.aspx`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://dss.sd.gov/economicassistance/snap.aspx))
- **income_limit**: Ours says `$1981` → Source says `$1,696` ([source](https://dss.sd.gov/economicassistance/snap.aspx))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases (groceries, no hot foods/alcohol/tobacco). Amount based on household size, net income, deductions (e.g., example: 2-person elderly household with $1,200 gross might get ~$415/month). Max allotments vary by size/location; scales with need.[3][5]` ([source](https://dss.sd.gov/economicassistance/snap.aspx))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sd.gov/economicassistance/snap.aspx`

### Long-Term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy for residents' rights; complaint resolution; information and referral assistance; education on residents' rights; review of medical records; assistance with guardianship, medical/treatment issues, facility problems (e.g., staffing shortages); systemic issue identification and resolution.` ([source](https://dhs.sd.gov/ltss/ombudsman-program))
- **source_url**: Ours says `MISSING` → Source says `https://dhs.sd.gov/ltss/ombudsman-program`

## New Programs (Not in Our Data)

- **Home and Community-Based Options and Person Centered Excellence (HOPE) Waiver** — service ([source](https://dss.sd.gov/docs/medicaid/providers/billingmanuals/HCBS/Home_and_Community_Based_Options_and_Person-Centered_Excellence.pdf[3]))
  - Shape notes: Capped enrollment (1,834); person-centered services vary by assessment/need not fixed amounts; financials individual per applicant with spousal protections; NFLOC via HCA tool; statewide but provider-contracted[1][2][3]
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://dhs.sd.gov (South Dakota Department of Human Services; see LTSS provider portal for PACE feasibility updates)))
  - Shape notes: No operational programs in SD (feasibility stage only); eligibility not financially restricted but tied to non-existent service areas and state LOC certification; benefits comprehensive but provider-limited.
- **Low Income Energy Assistance Program (LIEAP)** — financial ([source](https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx))
  - Shape notes: Income tested at 200% FPL using 3 prior months' gross income; benefits scale by household size, heating type/cost, and location; central administration with direct payments to vendors; ties into categorical eligibility for SNAP and related programs like weatherization/ECIP.
- **Weatherization Assistance Program (WAP)** — in_kind ([source](https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx))
  - Shape notes: This program's structure is unique because: (1) benefits are entirely in-kind (no cash payments), determined by individual energy audit rather than fixed amounts; (2) administration is decentralized across four regional Community Action Agencies, creating geographic variation in processing and availability; (3) eligibility is categorical for LIEAP recipients (automatic income qualification); (4) there is a hard 15-year recency restriction preventing repeat participation; (5) renter participation requires landlord cost-sharing, creating a two-party eligibility requirement; (6) priority tiers (elderly, disabled, families with children) affect service sequencing but not eligibility determination.
- **Senior Health Information and Insurance Education (SHIINE)** — service ([source](https://dhs.sd.gov/en/ltss/shiine))
  - Shape notes: no income/asset test; volunteer-based statewide counseling network with required regional events and outreach; services are educational/advocacy-focused, not benefits-paying
- **Meals on Wheels** — service ([source](No single statewide .gov site; administered locally via Older Americans Act through providers like dakotaathome.sd.gov and regional non-profits.))
  - Shape notes: Decentralized by region with local providers; no uniform income test or statewide application; Older Americans Act-funded with priority for homebound 60+; referrals for younger via Dakota at Home
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://dlr.sd.gov/workforce_services/individuals/scsep/participants.aspx))
  - Shape notes: Regionally restricted to 3 areas (not statewide); priority tiers affect access; income at fixed 125% FPL (varies by household size via annual FPL tables); no asset test.
- **Commodity Supplemental Food Program (CSFP) / Senior Box Program** — in_kind ([source](https://doe.sd.gov/cans/csfp.aspx (South Dakota Department of Education); https://www.fns.usda.gov/csfp/commodity-supplemental-food-program (USDA Food and Nutrition Service)))
  - Shape notes: This program's data structure is defined by: (1) income limits that scale by household size with a base amount plus per-person increments; (2) geographic fragmentation—available in 49 states plus DC and 2 Indian reservations, but only in limited areas within participating states; (3) fixed monthly benefit (one food box per eligible participant per month) with no variation by tier or priority; (4) dual eligibility provision that bypasses income testing for SSI recipients; (5) state-level administration with local agency implementation, creating regional variation in contact information and distribution logistics but uniform eligibility criteria within South Dakota.

## Program Details

### Medicaid for the Aged, Blind and Disabled (ABD)


**Eligibility:**
- Age: 65+
- Income: Follows SSI methodologies; for Regular Medicaid/ABD: $994/month for an individual. Income cap state for nursing home care (under $2,982/month for single applicant in 2026). Limits increase slightly annually with SSI/FPL adjustments; for couples or larger households, varies (e.g., $1,491/month for some ABD categories). Full table not specified in sources—use SSI standards ($943 federal SSI max in 2024, state supplement applies).[1][3][4]
- Assets: $2,000 for an individual (countable resources). IRAs and retirement plans count as assets (not exempt). Exempt: primary home (up to $752,000 equity limit for LTC), one vehicle, personal belongings, burial plots. 60-month look-back for nursing home/waiver applicants (transfers penalized); does not apply to Regular Medicaid.[3][4]
- Aged (65+), blind, or disabled (SSI disability criteria).
- For LTC (nursing home/waivers): Nursing Home Level of Care (NHLOC) or functional need for ADLs required.
- Separate Medicaid application required, even for SSI recipients; state uses SSI income/resource methodologies.[1]
- Medical/functional assessment for long-term services.

**Benefits:** Comprehensive Medicaid health coverage including doctor visits, hospital care, prescription drugs, long-term services (nursing home, home health, waivers for community-based care), help with ADLs. Nursing home: $100/month personal needs allowance. Specific services require NHLOC; no fixed dollar/hour amounts statewide—covers costs per approved plan.[3][4]
- Varies by: priority_tier

**How to apply:**
- Online: South Dakota ACCESS portal (dss.sd.gov/apply/)
- Phone: 1-855-256-6742
- Mail/In-person: Local Department of Social Services office (find via dss.sd.gov/regionaloffices/)

**Timeline:** Not specified in sources; typically 45-90 days for ABD due to disability determination.
**Waitlist:** Entitlement program—no waitlist for Regular Medicaid/ABD; all eligible receive services.[3]

**Watch out for:**
- Separate Medicaid app required even if on SSI—state does not auto-enroll via 1634 agreement.[1]
- Income cap for nursing home ($2,982/month single); over-limit can qualify via Miller Trust.[3][4]
- 60-month look-back penalizes asset transfers for LTC (not Regular Medicaid).[3]
- IRAs count as assets—no protection.[4]
- Home equity limit $752,000 blocks LTC if exceeded.[4]

**Data shape:** Tied to SSI criteria but requires separate state app; entitlement (no waitlist); LTC has NHLOC/ADL tiers and look-back; income cap state with spousal protections (CSRA $32k-$163k).[1][3][4]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sd.gov/medicaid/

---

### Home and Community-Based Options and Person Centered Excellence (HOPE) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older, or 18-64 with qualifying disability from Social Security Administration; those 18-64 disabled can continue under aged category after 65[1][2][3][4]+
- Income: Up to 300% of Federal Benefit Rate (FBR); $2,901/month per applicant in 2025 regardless of marital status (each spouse individually if both applying); spousal income not deemed; Needs Allowance up to $3,160.50/month joint income to spouse. (Note: Earlier 2019 figure was $2,313; adjusts annually January)[1][2]
- Assets: Single/widowed: $2,000 countable assets (cash, checking/savings, accessible resources). Married: Applicant $2,000; non-applicant spouse up to $126,420. Home exempt if applicant lives there/intent to return (2025 equity ≤$730,000), spouse/minor child/disabled child in home[1][2]
- South Dakota resident
- Nursing Facility Level of Care (NFLOC) via Home Care Assessment (HCA) tool
- Not resident of hospital, nursing facility, or ICF/MR
- Receive at least one waiver service monthly
- Participate in needs assessment
- Reasonable indication of need for services based on standardized assessment[1][2][3][6]

**Benefits:** Home and community-based services including adult day services, in-home respite care, homemaker, nutrition/meals, safety/transportation, caregiver respite, community living home, assisted living; specific hours/dollars not fixed, person-centered based on assessment[4][5][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Call Dakota at Home (833) 663-9673[5]
- Dakota At Home Referral for HOPE Waiver/State Plan Services (assessment initiation)[3]

**Timeline:** Not specified in sources
**Waitlist:** Capped at 1,834 concurrent recipients (2019 data; likely ongoing cap implies waitlist)[1]

**Watch out for:**
- Strict cap (1,834 slots) creates waitlist; apply early[1]
- Must meet NFLOC via specific HCA tool; needs assessment required[2][3]
- Income/assets calculated individually even if married, but home equity limit $730,000 (2025) if intent to return[2]
- Cannot be in institutional setting; must use ≥1 service monthly[1][3]
- Annual FBR adjustments (e.g., $2,901 in 2025); check current year[2]
- Persons 18-64 disabled transition to aged category at 65[2]

**Data shape:** Capped enrollment (1,834); person-centered services vary by assessment/need not fixed amounts; financials individual per applicant with spousal protections; NFLOC via HCA tool; statewide but provider-contracted[1][2][3]

**Source:** https://dss.sd.gov/docs/medicaid/providers/billingmanuals/HCBS/Home_and_Community_Based_Options_and_Person-Centered_Excellence.pdf[3]

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits for PACE eligibility itself; however, full coverage without private pay requires Medicaid eligibility, which in South Dakota follows federal guidelines for long-term care (income under 300% of Federal Benefit Rate: $2,901/month for 2025; assets $2,000 or less excluding primary home). Limits do not vary by household size for PACE medical eligibility. Private pay option available if not Medicaid-eligible (average $4,000–$5,000/month).[2][5]
- Assets: No asset limits for PACE eligibility; Medicaid portion limits countable assets to $2,000 (exempt: primary home, one vehicle, personal belongings, burial funds up to certain limits).
- Live in the service area of a PACE organization (not yet available statewide in SD).
- Certified by South Dakota as needing nursing home level of care.
- Able to live safely in the community with PACE services.
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare Part D, or hospice.

**Benefits:** All-inclusive: primary medical care, adult day health center, in-home/outpatient therapy, transportation, meals/nutrition, prescription drugs, hospitalization, nursing home care if needed, personal care, social services; no copays/deductibles once enrolled; covers all Medicare/Medicaid-approved services without limits on scope/duration.
- Varies by: region

**How to apply:**
- No active programs in South Dakota; contact South Dakota Department of Human Services (DHS) for updates (general LTSS line not specified in sources).
- Process (when available): Intake consultation at PACE center/home, in-home assessment, nursing facility LOC determination, Medicaid eligibility check, care plan development.

**Timeline:** Varies by state/provider; not specified for SD.
**Waitlist:** Potential waitlists depending on provider capacity when programs launch.

**Watch out for:**
- PACE not yet available in South Dakota—no providers operational despite feasibility studies.
- Must live in specific service area (none currently).
- Nursing home LOC certification by state required—not automatic.
- Private pay expensive ($4,000+/month) if not dual-eligible.
- Cannot be in Medicare Advantage or hospice.
- Voluntary; can disenroll anytime, but providers have strict rules for involuntary disenrollment.

**Data shape:** No operational programs in SD (feasibility stage only); eligibility not financially restricted but tied to non-existent service areas and state LOC certification; benefits comprehensive but provider-limited.

**Source:** https://dhs.sd.gov (South Dakota Department of Human Services; see LTSS provider portal for PACE feasibility updates)

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be entitled to or receiving Medicare benefits (typically age 65+ or disabled). South Dakota follows federal guidelines with state-specific dollar amounts that vary yearly. For 2025/2026 (most recent cited): QMB - Individual: ≤$1,275-$1,350/mo, Couple: ≤$1,724-$1,824/mo (100% FPL); SLMB - Individual: ≤$1,526/mo (120% FPL), Couple: ≤$2,064/mo; QI - Individual: ≤$1,715-$1,781/mo (135% FPL), Couple: ≤$2,320-$2,400/mo. Limits include $20/mo disregard; exacts from SD DSS. No full household size table beyond individual/couple; contact DSS for >2.[2][1][4][6][3]
- Assets: Individual: $9,430-$9,950 (recent citations); Couple: $14,130-$14,910. Counts: checking/savings, CDs. Exempt: primary home, one car, burial plots, irrevocable burial trusts (up to certain value). Older SD source cites lower $4,000/$6,000—use current federal/SD figures.[1][4][6][3]
- Must have Medicare Part A (premium-free or otherwise)
- U.S. citizen or qualified immigrant
- Reside in South Dakota
- For QI: Annual reapplication; first-come first-served with priority to prior recipients

**Benefits:** QMB: Pays Medicare Part A/B premiums, deductibles, coinsurance, copays. SLMB/QI: Pays Part B premiums only. Auto-qualifies for Extra Help (low/no Part D costs, e.g., ≤$12.65/drug in 2026). No fixed dollar/hour—covers full specified costs.[2][1][4][3]
- Varies by: priority_tier

**How to apply:**
- Mail/PDF form: https://dss.sd.gov/formsandpubs/docs/MEDELGBLTY/270Medicaresavingsapplication.pdf[2]
- Phone: Toll-free 1-877-999-5612 (TTY/TDD 1-877-486-2048); ask for benefits specialist or local office[6][2]
- Online eligibility info: https://dss.sd.gov/medicaid/Eligibility/default.aspx[2]
- In-person/mail: Local DSS office or SHIINE volunteer assistance (free counseling/application help)[6]
- SHIINE volunteers for application support at senior centers

**Timeline:** Not specified in sources; typically 45 days for Medicaid-related (state variation possible)
**Waitlist:** QI has first-come, first-served with funding limits and priority for prior year recipients[4]

**Watch out for:**
- Income/asset limits change yearly (e.g., 2025: $1,781 indiv; verify current with DSS)[6]
- QI requires annual reapplication and has funding caps/waitlist risk[4]
- Must have Part A/B; QMB/SLMB/QI differ from QDWI (working disabled, Part A only—not covered here)[2][3]
- Exempt assets like burial trusts often missed[6]
- Auto-Extra Help eligibility overlooked[1][4]
- Older sources show conflicting asset limits ($4k vs $9k+); use latest[3]

**Data shape:** Tiered by program (QMB full coverage, SLMB/QI Part B only); income scales to ~135% FPL; statewide via DSS with SHIINE helpers; QI capped funding; individual/couple focus, no broad household table

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sd.gov/medicaid/Eligibility/default.aspx

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with at least one member age 60 or older (elderly/disabled households) in South Dakota, there is **no gross income limit**—only the **net income test** applies (100% of federal poverty level). Standard households (no elderly/disabled) must meet both gross (130% FPL) and net (100% FPL) limits. Oct. 1, 2025–Sept. 30, 2026 monthly limits:

|Household Size|Gross Income|Net Income|
|-|-|-|
|1|$1,696|$1,305|
|2|$2,292|$1,763|
|3|$2,888|$2,221|
|4|$3,483|$2,680|
|5|$4,079|$3,138|
|6|$4,675|$3,596|
|7|$5,271|$4,055|
|8|$5,867|$4,513|
|Each additional|+ $596|+ $459|

Net income = gross income minus deductions (e.g., standard $209, medical >$35 for elderly/disabled, shelter up to $744 cap or higher uncapped for elderly/disabled, utilities). Social Security, pensions, VA/disability count as income.[3][2][1]
- Assets: Countable resources ≤ **$3,000** ($4,500 if household has elderly 60+ or disabled member). Exempt: primary home, one vehicle, most retirement savings. Bank accounts, cash, non-primary property count.[3][7]
- South Dakota resident; U.S. citizen or certain legal non-citizens.
- All household members need SSN (or apply for one).
- Household = those who live together and buy/prepare food together (elderly/disabled may count separately if they buy/prepare alone).
- Able-bodied 16-59 must meet work requirements (exemptions for elderly 60+).

**Benefits:** Monthly EBT card benefits for food purchases (groceries, no hot foods/alcohol/tobacco). Amount based on household size, net income, deductions (e.g., example: 2-person elderly household with $1,200 gross might get ~$415/month). Max allotments vary by size/location; scales with need.[3][5]
- Varies by: household_size

**How to apply:**
- Online: https://dss.sd.gov/apply/ [implied from official DSS site]
- Phone: Contact local DSS office (statewide helpline not listed; find via dss.sd.gov)
- Mail/In-person: Local Department of Social Services (DSS) offices by county (full list at https://dss.sd.gov/offices/)
- Download form: SNAP application via https://dss.sd.gov/formsandpubs/

**Timeline:** Typically 30 days; expedited if very low income (<$150 gross, <$100 cash). No specific SD waitlist noted.[3]

**Watch out for:**
- Elderly households skip gross income test but must calculate net income accurately (deductions like uncapped shelter/medical for 60+ are key—many miss high deductions).
- Assets $3,000/$4,500 limit often overlooked (home/1 car exempt, but savings count).
- Household definition: Only those buying/preparing food together; elderly living with family may qualify separately.
- Only ~half of eligible seniors apply; benefits reduce if income rises.
- Work rules exempt 60+, but verify disability status for higher asset limit.

**Data shape:** Elderly/disabled households exempt from gross income & (in some sources) asset tests with higher limits; net income calculated with enhanced deductions (uncapped shelter/medical for 60+); benefits scale precisely by household size/net income; uniform statewide but local DSS offices handle apps.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sd.gov/economicassistance/snap.aspx

---

### Low Income Energy Assistance Program (LIEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross household income must be at or below 200% of the federal poverty level, based on the most recent three months of income for all household members. Specific annual limits include: 7 Person: $22,514; 8 Person: $23,014; 9 Person: $23,514; 10 Person: $24,431 (limits scale for smaller and larger households accordingly). Households where all members receive SNAP are automatically categorically income eligible.[1][5]
- Assets: No asset limits mentioned in program guidelines.[1][5]
- Proof of household income for the past 3 full months for all household members.
- Must have heating costs paid directly to an energy supplier or as part of rent.
- All household members age 18+ must sign the application.
- Applications where all household members receive SNAP are automatically categorically income eligible.

**Benefits:** One-time payment made directly to the energy supplier to assist with home heating costs. Exact amount varies based on household size, income, type and cost of heating, and location; no fixed dollar amounts specified beyond related programs (e.g., Cooling Assistance: $1025).[1][2][5]
- Varies by: household_size|income|heating_type|location

**How to apply:**
- Mail: South Dakota Department of Social Services, Office of Energy Assistance, 700 Governors Drive, Pierre, SD 57501
- Email: Scan and send to DSSHeat@state.sd.us
- Phone for help or status: 800-233-8503 (Hearing Impaired TTY: 800-325-0778); check status by pressing option 1
- Online submission mentioned for eligible households, but primary form is downloadable PDF

**Timeline:** Up to 60 days for eligibility determination.[3]

**Watch out for:**
- Must provide proof of income for exactly the past 3 full calendar months prior to application month; missing this delays or denies eligibility.[3][5]
- All adults 18+ in household must sign application.[5]
- Payments go directly to energy supplier, not to household; renters with heat included in rent may have additional criteria.[2][5]
- Related crisis assistance (ECIP) requires income eligibility plus crisis like shut-off Oct 1-Mar 31; not automatic.[3]
- SNAP households are categorically eligible, but still need to apply and provide bills.[1]

**Data shape:** Income tested at 200% FPL using 3 prior months' gross income; benefits scale by household size, heating type/cost, and location; central administration with direct payments to vendors; ties into categorical eligibility for SNAP and related programs like weatherization/ECIP.

**Source:** https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Families with annual household income at or below 200% of the federal poverty level are eligible[2][3]. Priority is given to elderly individuals, individuals with disabilities, and families with children under 19[2][3].
- Home must not have received weatherization services in the previous 15 years[4]
- For renters: landlord must provide written permission and contribute 1/3 of project costs[1][4]
- Home must meet Department of Energy (DOE) requirements for feasibility; the community action agency may cancel applications if rehabilitation is not considered feasible[4]

**Benefits:** No cost to homeowner. Average annual savings of $372 or more per household[5]. Services may include weather-stripping doors and windows, caulking and sealing cracks, insulating attics/walls/under floors, repairing/tuning/replacing heating systems, and incidental repairs to protect weatherization materials[2][3]. Specific measures determined by energy audit[3].
- Varies by: individual_home_needs

**How to apply:**
- Phone: 1-800-233-8503 (general energy assistance line)[4]
- Phone: Contact your county's Community Action Agency directly (varies by region)[2]
- Phone: WSDCA (Western South Dakota) - (605) 348-1460[5]
- Mail: South Dakota Department of Social Services (address varies by county provider)[1]
- Email: kpalmer@wsdca.org (WSDCA)[5] or info@growsd.org (GROW South Dakota)[4]
- In-person: Contact Community Action Agency serving your county[2]
- Online: dss.sd.gov/weatherization (printable application)[2]

**Timeline:** Not specified in available sources
**Waitlist:** Funds are limited; applicants may be placed on a waiting list[1]

**Watch out for:**
- 15-year rule: Homes that received weatherization services in the previous 15 years are ineligible[4]
- Renter liability: Renters can apply but landlord must provide written permission AND contribute 1/3 of project costs—this is a significant barrier for many renters[1][4]
- Income threshold differs by program: Weatherization eligibility is 200% of poverty level, but fuel assistance (LIEAP) is only 175%—a household may qualify for weatherization but not heating assistance[7]
- Categorical eligibility: Households already receiving LIEAP (fuel assistance) are automatically income-eligible for weatherization and only need to submit partial application[6]
- Feasibility determination: The community action agency has discretion to deny applications if they determine the home rehabilitation is not feasible[4]
- Waiting list: Due to limited funds, applicants may wait for services[1]
- Application timing: Income documentation required depends on application submission month—verify the correct 3-month window when applying[6]

**Data shape:** This program's structure is unique because: (1) benefits are entirely in-kind (no cash payments), determined by individual energy audit rather than fixed amounts; (2) administration is decentralized across four regional Community Action Agencies, creating geographic variation in processing and availability; (3) eligibility is categorical for LIEAP recipients (automatic income qualification); (4) there is a hard 15-year recency restriction preventing repeat participation; (5) renter participation requires landlord cost-sharing, creating a two-party eligibility requirement; (6) priority tiers (elderly, disabled, families with children) affect service sequencing but not eligibility determination.

**Source:** https://dss.sd.gov/economicassistance/energy_weatherization_assistance.aspx

---

### Senior Health Information and Insurance Education (SHIINE)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, those approaching Medicare, and their caregivers[2][4]
- Assets: No asset limits or tests apply[2][4]
- Must be a Medicare beneficiary in South Dakota, approaching Medicare eligibility, or a caregiver of someone on Medicare[2][4]

**Benefits:** Free personalized health insurance counseling and education on Medicare Parts A/B, Part D, Medicare Advantage, Medigap, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, and other programs; application assistance for low-income programs like LIS; fraud prevention via SMP; group education events, one-on-one enrollment help (especially during Part D open enrollment), printed materials, and referrals[1][2][3][5]

**How to apply:**
- Phone: Toll-free (800) 536-8197[3][6]
- Website: https://www.shiine.net[3]
- Email: caitlin.christensen@state.sd.us or region-specific like western_region@shiine.net[3][4]
- Call to schedule in-person or phone appointment; leave voicemail if needed[4]

**Timeline:** No formal processing; services provided via appointment scheduling, typically immediate upon contact[4]

**Watch out for:**
- Not a direct financial or healthcare service provider—offers education, counseling, and application help only, not payment for care or medical services; staff/volunteers cannot have active insurance licenses[1][5]
- Requires contacting to schedule; no walk-in specified, voicemail if no answer[4]
- Focuses on Medicare-related issues; for LTSS/Medicaid, provides info/referrals but separate processes apply with income/asset limits[6]

**Data shape:** no income/asset test; volunteer-based statewide counseling network with required regional events and outreach; services are educational/advocacy-focused, not benefits-paying

**Source:** https://dhs.sd.gov/en/ltss/shiine

---

### Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits specified for the core Meals on Wheels program in South Dakota; eligibility prioritizes need over earnings. Some programs serve low-income seniors first, and Medicaid/SSI recipients may qualify. Federal poverty guidelines may apply in certain cases, but no specific dollar amounts or household size tables provided for this program. Separate programs like South Dakota Medicaid have 2022 limits of $10,092 annual income/$2,000 assets for singles and $15,132/$3,000 for married couples, but these are not directly for Meals on Wheels.
- Assets: No asset limits mentioned for Meals on Wheels; not a primary requirement.
- Homebound and unable to cook or shop independently
- Spouse or dependent adult living with eligible senior (60+) may qualify
- Under 60: Contact Dakota at Home for possible eligibility if disabled

**Benefits:** One hot nutritious home-delivered meal per day, Monday-Friday (5 days/week); congregate dining available at sites. Suggested donation $5.25-$15/meal (no one denied for inability to pay); private pay options $9.49-$15/meal or $300/month.
- Varies by: region

**How to apply:**
- Call local providers (e.g., Active Generations: (605) 333-3305 or 1-833-663-9673 for Dakota at Home)
- Enroll online via Dakota at Home Referral Form or provider sites (e.g., Meals on Wheels Western South Dakota brochure request)
- Phone registration with providers like Meals on Wheels Sioux Falls or Active Generations

**Timeline:** Not specified
**Waitlist:** Limited meals available; priority for those in greatest need, but no one 60+ denied for inability to contribute[3]

**Watch out for:**
- Not statewide—must contact local provider for your area
- Limited meals; priority by need, potential waitlist despite 'no denial for inability to pay'[3]
- Under 60 requires Dakota at Home referral, not direct Meals on Wheels[2][7]
- Suggested donations/contributory basis, private pay for extras
- Homebound status key—not just age
- Varies by provider; some offer congregate dining vs. only delivery

**Data shape:** Decentralized by region with local providers; no uniform income test or statewide application; Older Americans Act-funded with priority for homebound 60+; referrals for younger via Dakota at Home

**Source:** No single statewide .gov site; administered locally via Older Americans Act through providers like dakotaathome.sd.gov and regional non-profits.

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Annual family income no more than 125% of the Federal Poverty Level (FPL). Exact dollar amounts vary annually by household size and are not specified in current sources; families must check current FPL guidelines via HHS or program contacts for precise figures (e.g., for 2026, consult official tables).[1][2][3]
- Assets: No asset limits mentioned in sources.
- Resident of South Dakota
- Unemployed
- Eligible to work in the United States

**Benefits:** Part-time community service work (average 20 hours per week) at non-profit/public organizations (e.g., schools, hospitals, senior centers, day care); paid the highest of federal, state, or local minimum wage; training and counseling to develop skills; free annual physical exams; assistance toward unsubsidized full- or part-time employment; social/physical activities supporting independence.[1][2][3][4]
- Varies by: priority_tier

**How to apply:**
- Electronic: SCSEP application form (Adobe PDF) via DLR website
- In-person: Any South Dakota Department of Labor and Regulation (DLR) local office
- Phone: Contact DLR workforce experts (specific numbers via coverage map on DLR site)
- Mail: Submit completed form to DLR offices (addresses via site)

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by region due to limited coverage areas.

**Watch out for:**
- Not available statewide—only in West River, East River, Central regions; check map first.
- Priority enrollment for veterans/qualified spouses, then those 65+, disabled, rural residents, homeless/at-risk, low literacy/English proficiency, low employment prospects, or prior American Job Center users.[3]
- Income test strictly at 125% FPL; participants must be unemployed at enrollment.
- Temporary training positions (not permanent jobs); goal is transition to unsubsidized work.
- No specific dollar amounts for wages beyond minimum wage tie; actual pay depends on local minimum.

**Data shape:** Regionally restricted to 3 areas (not statewide); priority tiers affect access; income at fixed 125% FPL (varies by household size via annual FPL tables); no asset test.

**Source:** https://dlr.sd.gov/workforce_services/individuals/scsep/participants.aspx

---

### Long-Term Care Ombudsman


**Eligibility:**
- Income: No income limits; available without regard to income.
- Assets: No asset limits; no financial eligibility requirements.
- Resident of a long-term care facility in South Dakota (nursing home, assisted living, or community living home), or family/friend advocating for such a resident or someone attempting to enter.
- Complaint or issue must impact the health, safety, welfare, or rights of a resident.

**Benefits:** Advocacy for residents' rights; complaint resolution; information and referral assistance; education on residents' rights; review of medical records; assistance with guardianship, medical/treatment issues, facility problems (e.g., staffing shortages); systemic issue identification and resolution.

**How to apply:**
- Phone: 605-773-3656 (to discuss or report issue)
- Email: LTCO@state.sd.us (include 'Volunteer' in subject if interested in volunteering, but for services contact for complaints)
- Website: https://dhs.sd.gov/ltss/ombudsman-program (for information)
- In-person: Local ombudsman offices via Division of Adult Services and Aging

**Timeline:** Not specified; complaint handling is responsive but no formal timeline given.

**Watch out for:**
- Not a Medicaid or financial assistance program—purely advocacy, not direct care (e.g., no helping with walking or wheelchairs); complaints must directly impact long-term care residents (not general issues); does not handle eligibility for placement or public benefits; family/relatives can access on behalf of resident but must focus on resident rights; not for licensing/certification disputes directly.

**Data shape:** no income test; open to any long-term care resident statewide without financial barriers; advocacy-only, not service provision or funding; complaint-driven access

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dhs.sd.gov/ltss/ombudsman-program

---

### Commodity Supplemental Food Program (CSFP) / Senior Box Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income at or below 150% of federal poverty guidelines. For reference (2026 guidelines): 1 person: $1,995/month; 2 people: $2,705/month; 3 people: $3,415/month; 4 people: $4,125/month; 5 people: $4,835/month; 6 people: $5,545/month; 7 people: $6,255/month; 8 people: $6,965/month; for each additional household member, add $710/month. Income limits are based on gross monthly income before taxes.[1][3]
- Assets: Not specified in available sources; contact local agency for clarification.
- Must be a South Dakota resident[3]
- U.S. citizenship is not required[1]
- Some states may require proof of nutritional risk (determined by physician or local agency staff), though this is uncommon[5]
- Some states may impose local residency requirements based on designated service areas[2]

**Benefits:** Monthly box of non-perishable USDA commodity foods at no cost. Typical contents include: cheese, juice, oats, ready-to-eat cereal, rice, pasta, peanut butter, dry beans, canned meat/poultry/fish, canned fruits and vegetables, and occasionally canned entrees (beef stew, chili).[3]
- Varies by: fixed

**How to apply:**
- Phone: Call Feeding South Dakota at 605-853-3656 to apply[3]
- Phone: Call local distribution center (e.g., Brookings Area United Way for Brookings County)[6]
- In-person: Visit local distribution center during distribution times (call for hours)[3]
- Website: Visit https://www.feedingsouthdakota.org/mobile for more information[3]
- Email: Contact [email protected][3]

**Timeline:** Not specified in available sources; contact local agency for timeline.
**Waitlist:** Not mentioned in available sources; contact local agency to inquire.

**Watch out for:**
- Program availability is limited by funding and geography. Even in South Dakota, CSFP is only available in limited geographic areas, not statewide.[7] Verify your county/region is served before applying.
- Income limits vary by state. South Dakota uses 150% of federal poverty guidelines, but other states may use 130%.[2][5] Do not assume limits from other states apply.
- CSFP is exclusively for seniors age 60+. Following a 2014 amendment, the program no longer serves women, infants, and children (except those certified before Feb. 6, 2014).[5]
- No conflict with other programs. You can receive CSFP while also receiving SNAP or other nutrition assistance programs.[5]
- Dual eligibility fast-track. If a senior receives SSI (Supplemental Security Income), they are automatically qualified for CSFP regardless of household income.[1]
- No penalty for checking eligibility. There is no risk or penalty to apply and check if you qualify.[1]
- Processing timeline not publicly stated. Contact your local agency directly for expected wait times, as this information is not standardized.
- Food box contents are pre-packaged and may vary month to month based on USDA commodity availability.

**Data shape:** This program's data structure is defined by: (1) income limits that scale by household size with a base amount plus per-person increments; (2) geographic fragmentation—available in 49 states plus DC and 2 Indian reservations, but only in limited areas within participating states; (3) fixed monthly benefit (one food box per eligible participant per month) with no variation by tier or priority; (4) dual eligibility provision that bypasses income testing for SSI recipients; (5) state-level administration with local agency implementation, creating regional variation in contact information and distribution logistics but uniform eligibility criteria within South Dakota.

**Source:** https://doe.sd.gov/cans/csfp.aspx (South Dakota Department of Education); https://www.fns.usda.gov/csfp/commodity-supplemental-food-program (USDA Food and Nutrition Service)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid for the Aged, Blind and Disable | benefit | state | deep |
| Home and Community-Based Options and Per | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low Income Energy Assistance Program (LI | benefit | state | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | medium |
| Senior Health Information and Insurance  | resource | state | simple |
| Meals on Wheels | benefit | federal | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-Term Care Ombudsman | resource | federal | simple |
| Commodity Supplemental Food Program (CSF | resource | local | simple |

**Types:** {"benefit":8,"resource":3,"employment":1}
**Scopes:** {"state":4,"local":2,"federal":6}
**Complexity:** {"deep":8,"medium":1,"simple":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/SD/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 2 programs
- **household_size**: 1 programs
- **household_size|income|heating_type|location**: 1 programs
- **individual_home_needs**: 1 programs
- **not_applicable**: 2 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid for the Aged, Blind and Disabled (ABD)**: Tied to SSI criteria but requires separate state app; entitlement (no waitlist); LTC has NHLOC/ADL tiers and look-back; income cap state with spousal protections (CSRA $32k-$163k).[1][3][4]
- **Home and Community-Based Options and Person Centered Excellence (HOPE) Waiver**: Capped enrollment (1,834); person-centered services vary by assessment/need not fixed amounts; financials individual per applicant with spousal protections; NFLOC via HCA tool; statewide but provider-contracted[1][2][3]
- **Program of All-Inclusive Care for the Elderly (PACE)**: No operational programs in SD (feasibility stage only); eligibility not financially restricted but tied to non-existent service areas and state LOC certification; benefits comprehensive but provider-limited.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB full coverage, SLMB/QI Part B only); income scales to ~135% FPL; statewide via DSS with SHIINE helpers; QI capped funding; individual/couple focus, no broad household table
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly/disabled households exempt from gross income & (in some sources) asset tests with higher limits; net income calculated with enhanced deductions (uncapped shelter/medical for 60+); benefits scale precisely by household size/net income; uniform statewide but local DSS offices handle apps.
- **Low Income Energy Assistance Program (LIEAP)**: Income tested at 200% FPL using 3 prior months' gross income; benefits scale by household size, heating type/cost, and location; central administration with direct payments to vendors; ties into categorical eligibility for SNAP and related programs like weatherization/ECIP.
- **Weatherization Assistance Program (WAP)**: This program's structure is unique because: (1) benefits are entirely in-kind (no cash payments), determined by individual energy audit rather than fixed amounts; (2) administration is decentralized across four regional Community Action Agencies, creating geographic variation in processing and availability; (3) eligibility is categorical for LIEAP recipients (automatic income qualification); (4) there is a hard 15-year recency restriction preventing repeat participation; (5) renter participation requires landlord cost-sharing, creating a two-party eligibility requirement; (6) priority tiers (elderly, disabled, families with children) affect service sequencing but not eligibility determination.
- **Senior Health Information and Insurance Education (SHIINE)**: no income/asset test; volunteer-based statewide counseling network with required regional events and outreach; services are educational/advocacy-focused, not benefits-paying
- **Meals on Wheels**: Decentralized by region with local providers; no uniform income test or statewide application; Older Americans Act-funded with priority for homebound 60+; referrals for younger via Dakota at Home
- **Senior Community Service Employment Program (SCSEP)**: Regionally restricted to 3 areas (not statewide); priority tiers affect access; income at fixed 125% FPL (varies by household size via annual FPL tables); no asset test.
- **Long-Term Care Ombudsman**: no income test; open to any long-term care resident statewide without financial barriers; advocacy-only, not service provision or funding; complaint-driven access
- **Commodity Supplemental Food Program (CSFP) / Senior Box Program**: This program's data structure is defined by: (1) income limits that scale by household size with a base amount plus per-person increments; (2) geographic fragmentation—available in 49 states plus DC and 2 Indian reservations, but only in limited areas within participating states; (3) fixed monthly benefit (one food box per eligible participant per month) with no variation by tier or priority; (4) dual eligibility provision that bypasses income testing for SSI recipients; (5) state-level administration with local agency implementation, creating regional variation in contact information and distribution logistics but uniform eligibility criteria within South Dakota.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in South Dakota?
