# Virginia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 1.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
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
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 9 programs
- **financial**: 4 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Virginia PACE (Program of All-Inclusive Care for the Elderly)

- **income_limit**: Ours says `$1781` → Source says `$2,901` ([source](https://www.dmas.virginia.gov/for-members/benefits-and-services/other-programs-and-guidelines/pace/))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `All Medicare and Medicaid benefits plus additional services: prescription medications, dentistry, adult day care, occupational/physical therapy, hospital care, primary care, respite care, nursing facility care if needed (covers costs, but only ~7% of enrollees reside there long-term), and any other medically necessary services determined by interdisciplinary team to support health, preferences, and goals. Comprehensive coordinated care via team of professionals; becomes sole source of Medicare/Medicaid services for enrollees.` ([source](https://www.dmas.virginia.gov/for-members/benefits-and-services/other-programs-and-guidelines/pace/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dmas.virginia.gov/for-members/benefits-and-services/other-programs-and-guidelines/pace/`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1781` → Source says `$1,350` ([source](https://www.dss.virginia.gov/benefit_programs/msp.html or https://www.dmas.virginia.gov/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copays[1][3][5][6]. SLMB: Part B premiums only[1][3]. QI: Part B premiums only[1][3]. Automatic qualification for Extra Help LIS drug program[2][3]. Providers cannot bill QMB enrollees for cost-sharing.` ([source](https://www.dss.virginia.gov/benefit_programs/msp.html or https://www.dmas.virginia.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.virginia.gov/benefit_programs/msp.html or https://www.dmas.virginia.gov/`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dss.virginia.gov/benefit/snap.cgi))
- **income_limit**: Ours says `$1980` → Source says `$1,696` ([source](https://www.dss.virginia.gov/benefit/snap.cgi))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases. Maximum allotments (Oct 2025-Sep 2026): $298 (1-person), $546 (2), $785 (3), $994 (4), $1,183 (5), $1,421 (6), $1,571 (7), $1,789 (8), +$218 each additional. Actual amount: max allotment minus 30% net income (elderly/disabled deduct medical/shelter). E.g., 2-person elderly: $546 max - 30% net.[4][5]` ([source](https://www.dss.virginia.gov/benefit/snap.cgi))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.virginia.gov/benefit/snap.cgi`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2355` → Source says `$1,956` ([source](https://www.dss.virginia.gov/benefit/ea/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Regular heating: $198-$703 one-time payment to utility. Cooling: $50-$700. Crisis (winter): up to $4,200; summer crisis not available. Payments go directly to utility company.` ([source](https://www.dss.virginia.gov/benefit/ea/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.virginia.gov/benefit/ea/`

### State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one counseling and assistance on Medicare options, Medigap, Medicare Advantage, Part D, costs, appeals, fraud prevention/reporting; help applying for Medicare Savings Programs, Extra Help/LIS, Medicaid; group presentations, outreach, education[1][2][4][5][6]` ([source](www.vda.virginia.gov))
- **source_url**: Ours says `MISSING` → Source says `www.vda.virginia.gov`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigate and resolve complaints about care and rights; provide information on rights and benefits; advocate with facilities, families, and agencies; assist in problem-solving, facility selection, and accessing resources like Medicare; confidential support; no fixed dollar amounts or hours` ([source](https://dars.virginia.gov/aging/ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://dars.virginia.gov/aging/ombudsman/`

### Commonwealth Coordinated Care Plus (CCC+) Waiver

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) to avoid nursing facility or hospital placement. Specific services include: Respite (480 hours per state fiscal year, July 1-June 30); Environmental Modifications (up to $5,000 per individual per calendar year); Assistive Technology (up to $5,000 per individual per calendar year); Private Duty Nursing (up to 112 hours per week); Transition Services (up to $5,000 per individual per lifetime). Other supports for older adults, physical disabilities, chronic illness. Waiver reimbursement rates on DMAS site.[2][3]` ([source](https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/`

## New Programs (Not in Our Data)

- **Medicaid for Seniors/Disabled** — service ([source](https://coverva.dmas.virginia.gov/learn/coverage-for-adults/medicaid-for-persons-who-are-aged-blind-or-disabled-abd/))
  - Shape notes: Multiple tiers (full/limited coverage, spenddown, Medicare Savings, waivers like CBC/Medicaid Works) with varying income/resource limits; resource test required (unlike MAGI Medicaid); statewide but local DSS processing; 2026 income guidelines effective Jan 13.
- **Weatherization Assistance Program (WAP)** — in_kind ([source](dhcd.virginia.gov/wx (Virginia Department of Housing and Community Development Weatherization Assistance Program)[8]))
  - Shape notes: Virginia WAP uses a dual-threshold income test (higher of 60% SMI or 200% poverty level), which is more complex than single-threshold programs. Benefits are standardized in-kind services, not cash assistance. The program operates through a decentralized network of local providers rather than centralized offices, requiring applicants to identify and contact their regional provider. Priority is given based on household composition (elderly, disabled, children) and energy burden, not on first-come-first-served basis. No specific dollar cap on services per household is mentioned in available documentation.
- **Home Delivered Meals** — service ([source](https://dars.virginia.gov/aging/home-community/nutrition-meals/))
  - Shape notes: Decentralized by region with local providers; no fixed income table or statewide uniformity; eligibility emphasizes functional needs over finances; varies by Area Agency on Aging service area
- **Virginia Lifespan Respite Voucher Program** — financial ([source](https://dars.virginia.gov/aging/caregiver-support/lifespan-respite-voucher/))
  - Shape notes: Statewide voucher reimbursement with fixed annual cap per household; no income/asset test; limited by funding availability rather than waitlist; includes Kinship Caregiver Expansion for childcare
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://dars.virginia.gov/aging/senior-employment-program/))
  - Shape notes: Federally-funded with state grantees (e.g., DARS, Goodwill); priority tiers for enrollment; regional providers with specific service areas; income at 125% FPL (updates annually, household-size scaled); no asset test; part-time hours/wage fixed by min wage laws
- **Legal Aid for Seniors** — service ([source](https://www.valegalaid.org/ (VaLegalAid.org); https://selfhelp.vacourts.gov/node/33/statewide-senior-legal-helpline))
  - Shape notes: Delivered via 9 regional legal aid societies with varying income thresholds (125-200% FPL), senior priority exceptions; no uniform asset table or fixed benefits; statewide helpline for triage but services local
- **Virginia Adult Services Program** — service ([source](https://www.dss.virginia.gov/adults.cgi))
  - Shape notes: Administered locally by county/city DSS with statewide oversight; no fixed income/asset limits or age minimum; services focused on in-home independence with screenings/referrals rather than direct funding; varies by local availability and priority
- **No Wrong Door System** — service ([source](https://www.nowrongdoor.virginia.gov[4]))
  - Shape notes: No income/asset test for access; eligibility determined for downstream LTSS programs; statewide but locally implemented via 25 AAAs; virtual tools enable self-service without fixed tiers[2][4][6]
- **SeniorNavigator** — service ([source](https://www.seniornavigator.org (inferred from context; primary access via VirginiaNavigator.org per sources[1][3])))
  - Shape notes: Navigation platform linking to localized services rather than a single benefits program; no universal eligibility/income test; varies heavily by region and selected service[1][3]

## Program Details

### Medicaid for Seniors/Disabled

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Varies by program category and coverage type. For Non-institutional Medicaid: Single individual $1,084/month (full coverage) or $1,816/month (limited coverage). Community Based Care (CBC): $2,982/month, with qualification possible above this based on care hours needed. Nursing Home/HCBS: $2,901/month (300% FBR). Medically Needy Spenddown available if income exceeds limits, requiring medical bills to meet spenddown amount based on household size and income. Medicare Savings Programs have tiered limits including FPL plus $20 disregard (2026 guidelines). Medicaid Works for working disabled (16-64): higher income allowed. Limits include standard $20 unearned income disregard; exact figures vary by household size but typically ~100-138% FPL. No full table by household size in sources, but resources considered alongside.[1][4][5][6]
- Assets: Generally $2,000 for individual (full coverage, CBC, most ABD programs); $7,800 for limited coverage non-institutional; $3,000 for couples in some cases. Exempt: home where you live, one motor vehicle, personal belongings. Counts: other items of value/savings. Resource limits apply to most ABD categories.[1][2][8]
- Disabled (SSA/SSI benefits or Medicaid Disability Unit determination) or blind.
- U.S. citizen, Permanent Resident Alien (pre-8/22/1996 or 40 quarters work/5 years residency post), Refugee, or Asylee. Emergency Medicaid exempts citizenship.
- Virginia resident.
- Not eligible for/institutionalized in some paths; working status for Medicaid Works.

**Benefits:** Full Medicaid health coverage including doctor visits, hospital care, prescriptions, long-term services/supports (nursing facility, HCBS waivers like Community Based Care), Medicare premium assistance (via Medicare Savings Programs covering premiums, deductibles, co-pays in tiers). Specific ABD programs offer five categories (details not fully listed). Community Based Care provides care hours based on need/income. Medically Needy covers after spenddown. No fixed dollar amounts or weekly hours universally specified; scales by need.[1][2][4][5]
- Varies by: priority_tier

**How to apply:**
- Online: Cover Virginia Application at coverva.dmas.virginia.gov
- Phone: Local Department of Social Services (DSS) offices; statewide Cover Virginia helpline implied via site.
- Mail/In-person: Local DSS offices (e.g., Arlington DHS Public Assistance); use Cover Virginia Application.
- Appendix D form for ABD.

**Timeline:** 45-90 days typically.[9]
**Waitlist:** Possible for HCBS waivers like Community Based Care due to limited slots; not specified for all ABD.

**Watch out for:**
- Income/resources both required for most ABD; spenddown needed if over limits.
- Exempt assets limited (home, one car); estate recovery after death for long-term care.
- Multiple ABD categories/tiers with different limits; not automatic SSI linkage in VA.
- HCBS waivers may have waitlists; working disabled need Medicaid Works (under 65).
- Documentation intensive; 45-90 day process.
- Medicare Savings Programs only cover premiums/cost-sharing, not full Medicaid.

**Data shape:** Multiple tiers (full/limited coverage, spenddown, Medicare Savings, waivers like CBC/Medicaid Works) with varying income/resource limits; resource test required (unlike MAGI Medicaid); statewide but local DSS processing; 2026 income guidelines effective Jan 13.

**Source:** https://coverva.dmas.virginia.gov/learn/coverage-for-adults/medicaid-for-persons-who-are-aged-blind-or-disabled-abd/

---

### Virginia PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: Income equal to or less than 300% of the current Supplemental Security Income (SSI) payment standard for one person (approximately $2,901/month in 2025; exact amount varies annually and determined by DMAS under the State Plan). Does not explicitly vary by household size in PACE criteria, but follows Medicaid long-term care rules which may adjust for households.
- Assets: Resources equal to or less than the current resource allowance in the State Plan (typically $2,000 for an individual under Virginia Medicaid long-term care rules, excluding primary home, one vehicle, burial plots, and certain other exempt items). DMAS determines under State Plan provisions; countable assets include bank accounts, investments, second vehicles (with exceptions).
- Certified as requiring nursing facility level of care (NFLOC) via LTSS screening using Uniform Assessment Instrument (UAI) and determined at imminent risk of placement.
- Able to safely reside in the community (PACE service area) with program support.
- Reside in a PACE plan catchment/service area.
- Medically appropriate and necessary (without PACE, at imminent risk of NF placement).
- Meet other criteria in PACE plan contract.
- Participate in Medicaid or Medicare (dual eligible common; Medicare requires US citizen/legal resident 5+ years, age 65+ or disabled/ALS/ESRD).
- Voluntarily enroll and agree to terms.

**Benefits:** All Medicare and Medicaid benefits plus additional services: prescription medications, dentistry, adult day care, occupational/physical therapy, hospital care, primary care, respite care, nursing facility care if needed (covers costs, but only ~7% of enrollees reside there long-term), and any other medically necessary services determined by interdisciplinary team to support health, preferences, and goals. Comprehensive coordinated care via team of professionals; becomes sole source of Medicare/Medicaid services for enrollees.
- Varies by: region

**How to apply:**
- Contact local PACE provider (addresses, phone numbers, websites via DMAS Virginia PACE Locations document).
- Request LTSS screening for NFLOC determination.
- Phone/general inquiry: Use specific PACE site contacts from DMAS resources (no statewide number listed).
- In-person: PACE centers/service areas.

**Timeline:** Not specified in sources.
**Waitlist:** Possible regional waitlists (varies by PACE site; not detailed statewide).

**Watch out for:**
- Not statewide—must live in specific PACE service area; check local availability first.
- Requires NFLOC certification via formal LTSS screening (not automatic).
- Becomes sole provider of all Medicare/Medicaid services—cannot use other providers for covered services.
- Financial eligibility tied to Medicaid LTSS rules (300% SSI income, ~$2,000 assets); spend-down or planning may be needed if over limits.
- Voluntary enrollment with agreement to terms; can disenroll anytime but may affect prior coverage.
- Only ~7% use nursing facilities despite coverage—focus is community living.
- Note: Virginia C-PACE (Commercial Property Assessed Clean Energy) is unrelated (different program for energy financing).

**Data shape:** Limited to specific regional PACE centers/providers (not statewide); eligibility combines federal PACE standards with Virginia Medicaid financial caps (300% SSI income, State Plan resource limits); NFLOC via UAI screening required; dual Medicare/Medicaid focus with private pay possible if financially eligible.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dmas.virginia.gov/for-members/benefits-and-services/other-programs-and-guidelines/pace/

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be entitled to Medicare Part A (typically age 65+ or disabled). Virginia follows federal limits adjusted annually; 2026 federal limits (relevant as of April 2026): QMB up to $1,350/month single or $1,824/month couple; SLMB higher than QMB up to approx. 120% FPL (~$1,620 single/$2,190 couple, state-specific); QI higher than SLMB up to approx. 135% FPL (~$1,823 single/$2,460 couple, state-specific). Older sources show Virginia variations (e.g., 2024: QMB $1,325 single/$1,783 couple[1]; 2022: QMB $1,133 single/$1,526 couple[3]). Contact local DSS for exact current VA figures as they use FPL and may disregard certain income.
- Assets: Federal limits apply in VA: $9,660 single/$14,470 couple for QMB/SLMB/QI (per [1], close to 2026 federal $9,950/$14,910[5]). Countable: checking/savings, stocks, bonds. Exempt: home, one car, burial plot, up to $3,500 burial expenses (QMB/SLMB/QI)[3].
- Entitled to Medicare Part A (QMB may allow conditional enrollment pending approval[7])
- Must have Medicare Part B to qualify for SLMB/QI
- U.S. citizen or qualified immigrant
- Reside in Virginia

**Benefits:** QMB: Medicare Part A premiums (if applicable), Part B premiums, deductibles, coinsurance, copays[1][3][5][6]. SLMB: Part B premiums only[1][3]. QI: Part B premiums only[1][3]. Automatic qualification for Extra Help LIS drug program[2][3]. Providers cannot bill QMB enrollees for cost-sharing.
- Varies by: program_tier

**How to apply:**
- In-person or mail: Local Virginia Department of Social Services (DSS) office (find via dss.virginia.gov/localagency)
- Phone: Local DSS office or statewide Medicaid inquiry line (855-635-4370 or check dss.virginia.gov)
- No specific online portal listed; apply through local DSS
- Download forms from dss.virginia.gov/benefit_programs/msp.html

**Timeline:** Not specified in sources; typically 45 days for Medicaid programs, varies by local DSS
**Waitlist:** QI may have funding limits and waitlists federally (1st priority QMB, 2nd SLMB, 3rd QI)[4]; check with local DSS

**Watch out for:**
- Income/asset limits change yearly with FPL (January); sources conflict due to dates—verify current with DSS[1][2][3][5]
- QI has lower funding priority, potential waitlist or cap[4]
- Must apply locally, not statewide online; no central portal
- QMB protects from provider billing, but enrollee must show QMB status (Medicaid card)
- Automatic Extra Help, but report changes promptly to avoid overpayments
- Working disabled under 65 may qualify for QDWI separately (different limits)[2]

**Data shape:** Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); limits for single/couple only (no larger households); state follows federal but may expand slightly; annual FPL adjustments; local DSS administration with potential waitlist for QI

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.virginia.gov/benefit_programs/msp.html or https://www.dmas.virginia.gov/

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: Virginia SNAP uses gross income limits: Non-BBCE households at 130% FPL (e.g., $1,696/month for 1, $2,292 for 2); BBCE households at 165% FPL (e.g., $2,152/month for 1, $2,909 for 2). Seniors (60+) with high shelter/medical expenses may qualify if net income <100% FPL ($1,305/month for 1, $1,763 for 2), deducting medical costs >$35/month. Full table (monthly, Oct 2025-Sep 2026):
|Household Size|Non-BBCE Net (100% FPL)|Non-BBCE Gross (130% FPL)|BBCE Gross (165% FPL)|
|-|-|-|-|
|1|$1,305|$1,696|$2,152|
|2|$1,763|$2,292|$2,909|
|3|$2,221|$2,888|$3,665|
|4|$2,680|$3,483|$4,421|
|5|$3,138|$4,079|$5,177|
|6|$3,596|$4,675|$5,934|
|7|$4,055|$5,271|$6,690|
|8|$4,513|$5,867|$7,446|
|Each additional|$459|$596|$757|[5][3]
- Assets: Countable resources ≤$2,750 general; ≤$4,250 if ≥1 member 60+ or disabled. Counts: cash, bank accounts. Exempt: home/land, most retirement/pension plans (withdrawals count as income), BBCE households have no asset limit. Exempt also: house value, retirement savings, life insurance cash value (some states), household goods.[1][2]
- Virginia resident; U.S. citizen or certain lawfully present non-citizens (U.S.-born family may qualify even if applicant cannot).
- Household: people living together who buy/prepare food together.
- Able-bodied adults without dependents must meet work requirements (exceptions apply).
- Categorical eligibility if receiving TANF, SSI, or BBCE via TANF-funded service.
- ESAP for all members 60+ no earnings: simplified app, 36-month certification (report changes: household comp, earned income, lottery/gambling >$4,250).[1][3][5]

**Benefits:** Monthly EBT card for food purchases. Maximum allotments (Oct 2025-Sep 2026): $298 (1-person), $546 (2), $785 (3), $994 (4), $1,183 (5), $1,421 (6), $1,571 (7), $1,789 (8), +$218 each additional. Actual amount: max allotment minus 30% net income (elderly/disabled deduct medical/shelter). E.g., 2-person elderly: $546 max - 30% net.[4][5]
- Varies by: household_size

**How to apply:**
- Online: CommonHelp at https://www.dss.virginia.gov/benefit/snap.cgi or easyaccess.virginia.gov.
- Download/print Simplified SNAP Application (ESAP, English/Spanish).
- Phone: Local DSS office (find via dss.virginia.gov/localagency).
- Mail/in-person: Local Department of Social Services (DSS) office.

**Timeline:** Typically 30 days; expedited for urgent cases (not specified for seniors). ESAP: no recertification interview.[1][3]

**Watch out for:**
- Seniors often miss medical expense deductions (>35/month increases benefits).[3][8]
- Only ~half eligible seniors apply/enroll.[2]
- ESAP 3-year certification requires reporting specific changes.[3]
- Income includes Social Security/veterans/disability; BBCE waives assets but needs TANF service.[1][5]
- Work requirements exempt seniors/disabled, but able-bodied rules apply otherwise.[1]

**Data shape:** Elderly Simplified Application Project (ESAP) for 60+ households: simplified form, 36-month certification, medical/shelter deductions key for seniors; BBCE waives assets; income tiers by BBCE status and household size.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.virginia.gov/benefit/snap.cgi

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly household income must not exceed 150% of the federal poverty level. Limits for 2025: 1 person $1,956/month; 2 people $2,644/month; 3 people $3,331/month; 4 people $4,018/month; 5 people $4,707/month; 6 people $5,394/month. Adds ~$687 per additional person. Automatic eligibility if household receives SNAP, SSI, TANF, or certain veterans' benefits.
- Assets: No asset limit applies.
- Household must have a heating or cooling expense.
- For crisis/cooling: Must face heating emergency (e.g., lack of heat, imminent utility cut-off, inoperable heating equipment) or have at least one vulnerable member (elderly 60+, disabled individual, or child under age 6).
- Households with members 60+ receive priority/preference.
- U.S. citizens, qualified aliens, and legal residents eligible.

**Benefits:** Regular heating: $198-$703 one-time payment to utility. Cooling: $50-$700. Crisis (winter): up to $4,200; summer crisis not available. Payments go directly to utility company.
- Varies by: priority_tier

**How to apply:**
- Online: commonhelp.virginia.gov (screen and apply)
- Phone: 855-635-4370 (Mon-Fri 7am-6pm)
- In-person/mail/fax: Local department of social services (find at dss.virginia.gov/localagency)

**Timeline:** Notification in late December for some components; varies by type and local agency.
**Waitlist:** Possible during high-demand periods; crisis applications prioritized but may close (e.g., regular crisis Nov 1-Mar 15, fuel crisis Jan 2-Mar 15).

**Watch out for:**
- Must reapply annually even if previously approved.
- Household includes all at address sharing utility (e.g., roommates count).
- Crisis programs have seasonal windows and may close early.
- Eligibility doesn't guarantee benefits; funding limited.
- Utility provider must participate.
- Public/subsidized housing eligibility depends on how energy costs are paid.

**Data shape:** Benefits vary by component (regular, crisis, cooling) and priority (e.g., elderly/disabled); income at exactly 150% FPL; local DSS administration leads to regional processing variations; no asset test.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.virginia.gov/benefit/ea/

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households must have income at or below the **higher of** 60% of State Median Income (SMI) **or** 200% of Federal Poverty Level. For a family of four in Virginia, this equals $80,403 or less in annual household income[4]. Income limits vary by household size and are updated annually effective July 1[7]. Income is calculated as combined cash receipts of all household members over age 18 before taxes during the applicable tax year[1]. Excluded income includes child support, tax refunds, and college scholarships[1].
- Assets: Not specified in available sources. Asset limits are not mentioned in Virginia WAP documentation.
- Must be a Virginia resident[4]
- Homeowners, renters, and mobile-home owners are all eligible[3]
- Priority given to households with elderly residents (age 60+), individuals with disabilities, and children[4][3]

**Benefits:** Installation of cost-effective energy-saving measures at no cost to the household. Specific measures include: sealing air leaks with insulation, caulking, or weather-stripping; installing ventilation fans; repairing drafty duct systems; repairing and replacing inefficient or unsafe heating and cooling systems; installing energy-efficient lighting; checking for health and safety risks including carbon monoxide testing and installing CO2 and fire alarms[8]. Some providers also offer floor insulation, water heater tank wrap, heat pump water heater, and refrigerator replacement[6].
- Varies by: priority_tier

**How to apply:**
- Contact your local weatherization provider directly (provider varies by location)[8]
- Find your local provider using the DHCD provider locator at dhcd.virginia.gov/wx[8]
- In-person application through local provider office

**Timeline:** Not specified in available sources. Applicants are placed on a waitlist after meeting eligibility requirements[1].
**Waitlist:** Yes. Households that complete an application and meet eligibility requirements are added to a waitlist. Waitlist prioritization is based on energy burden, energy use, and presence of elderly residents (60+), disabled individuals, or children[1].

**Watch out for:**
- WAP does **not** pay utility bills — it only provides in-kind weatherization services[8]
- Income eligibility uses the **higher of** 60% SMI or 200% poverty level, not the lower — this is more generous than some states[2][7]
- Income limits are updated annually effective July 1, so families should verify current limits each year[7]
- Applicants must be placed on a waitlist after approval; there is no guarantee of immediate service[1]
- The homeowner or authorized representative must be present during the energy assessment; appointments will be rescheduled if no one is home[6]
- Weatherization providers need access to every room (excluding closets), the exterior, attic, and basement[6]
- Some utility companies (like Appalachian Power Company and Dominion Energy) offer separate income-qualifying programs with different income thresholds (120% SMI for Dominion's age-qualifying program) — families should check if they qualify for utility-specific programs in addition to WAP[5][6]

**Data shape:** Virginia WAP uses a dual-threshold income test (higher of 60% SMI or 200% poverty level), which is more complex than single-threshold programs. Benefits are standardized in-kind services, not cash assistance. The program operates through a decentralized network of local providers rather than centralized offices, requiring applicants to identify and contact their regional provider. Priority is given based on household composition (elderly, disabled, children) and energy burden, not on first-come-first-served basis. No specific dollar cap on services per household is mentioned in available documentation.

**Source:** dhcd.virginia.gov/wx (Virginia Department of Housing and Community Development Weatherization Assistance Program)[8]

---

### State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all Medicare beneficiaries[1][2][5]
- Assets: No asset limits or tests[2]
- Must be a Medicare beneficiary, family member, or caregiver[1][2][4][5]

**Benefits:** Free one-on-one counseling and assistance on Medicare options, Medigap, Medicare Advantage, Part D, costs, appeals, fraud prevention/reporting; help applying for Medicare Savings Programs, Extra Help/LIS, Medicaid; group presentations, outreach, education[1][2][4][5][6]

**How to apply:**
- Phone: 1-800-552-3402[7][8]
- Website: www.vda.virginia.gov[8]
- In-person or local: Through Virginia Insurance Counseling and Assistance Program (VICAP) network, e.g., Fairfax County at 703-324-5851[3][10]
- Email: aging@vda.virginia.gov[8]

**Timeline:** Immediate counseling available by phone or in-person; no formal processing[1][2]

**Watch out for:**
- Not a healthcare or financial aid program itself—provides counseling only, not direct payments or services; in Virginia called VICAP (Virginia Insurance Counseling and Assistance Program)[3][7][8]
- Services are free but rely on trained volunteers/staff—availability may depend on local site capacity[2][5]
- Helps apply for other programs like Extra Help but does not guarantee approval[2][6]

**Data shape:** no income/asset test; counseling service only via statewide network of local providers; prioritizes low-income and disabled but open to all Medicare beneficiaries

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** www.vda.virginia.gov

---

### Home Delivered Meals

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits statewide; some providers like FeedMore note 'limited income' as a factor but do not specify dollar amounts. Span Center assesses income for eligibility without fixed thresholds. Needs-based assessment used by some (e.g., District Three).
- Assets: No asset limits mentioned across sources.
- Homebound (unable to leave home without difficulty/assistance or 'essentially homebound')
- Unable to safely prepare or obtain at least one nutritious meal per day
- No other reliable means of obtaining daily meals
- Reside in service area of local provider (varies by region)
- Qualifying score on needs-based assessment (some areas)
- Priority to those in greatest need

**Benefits:** Nutritious hot meals delivered to home (meets at least 1/3 of Recommended Dietary Allowance or Dietary Reference Intakes); dietary options available; safety check and social contact during delivery; typically 1 meal per day, 5 days/week; nutrition counseling may be offered; free (voluntary donations encouraged).
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or provider (e.g., FeedMore screening form at https://feedmore.org/meals-on-wheels-eligibility/, District Three, Span Center, SSS EVA)
- Phone or in-person via regional providers (specific numbers not listed; use provider sites)
- Needs assessment by provider
- For Medicaid/Medicare Advantage: contact case manager or health plan

**Timeline:** Not specified
**Waitlist:** Priority given to greatest need implies possible waitlist; not explicitly detailed

**Watch out for:**
- Not a single statewide program—must contact local provider for service area and exact rules
- No uniform income/asset tests, but needs assessment can exclude some
- Spouses/disabled children may qualify regardless of age, often missed
- Free but donations expected; private/confidential
- Medicaid/Medicare users may have separate access via health plans (e.g., Mom's Meals)
- Waitlists likely due to priority system
- Not available everywhere in Virginia—check specific counties/cities

**Data shape:** Decentralized by region with local providers; no fixed income table or statewide uniformity; eligibility emphasizes functional needs over finances; varies by Area Agency on Aging service area

**Source:** https://dars.virginia.gov/aging/home-community/nutrition-meals/

---

### Virginia Lifespan Respite Voucher Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits specified; eligibility based on residency, caregiver status, and documented disability/medical condition of care recipient.
- Assets: No asset limits or exclusions mentioned.
- Live in the Commonwealth of Virginia
- Primary caregiver of loved one with documented disability or medical condition (verification less than 2 years old required)
- Reside at least part-time with loved one
- For Kinship Expansion: grandparent or relative raising a minor child with custody

**Benefits:** Up to $595 per household per year in reimbursement vouchers for respite care costs (through June 30, 2026, or until funds run out); cannot be used for rent, food, cleaning, or medical supplies. For Kinship Expansion: reimbursement for childcare or camps.
- Varies by: fixed

**How to apply:**
- Mail: Virginia Lifespan Respite Voucher Program, ATTN: Kristie Chamberlain, Virginia Department for Aging and Rehabilitative Services (DARS), 8004 Franklin Farms Drive, Henrico, VA 23229
- Fax or email scan: Contact Kristie Chamberlain at 804.662.7154 (phone) or Kristie.Chamberlain@dars.virginia.gov
- Phone for questions: Toll Free 866.552.5019 or 804.662.7154

**Timeline:** Not specified
**Waitlist:** Not all applicants approved due to limited funding

**Watch out for:**
- Limited funding means not all applicants approved
- Funds expire June 30, 2026, or when depleted
- Reimbursement only; cannot cover rent, food, cleaning, or medical supplies
- Must reside part-time with care recipient
- Verification document must be less than 2 years old

**Data shape:** Statewide voucher reimbursement with fixed annual cap per household; no income/asset test; limited by funding availability rather than waitlist; includes Kinship Caregiver Expansion for childcare

**Source:** https://dars.virginia.gov/aging/caregiver-support/lifespan-respite-voucher/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually by the U.S. Department of Health and Human Services; contact local provider for current table (e.g., for 2025, a single person limit is approximately $19,563 annually, but confirm with provider as no Virginia-specific table provided).[3][4]
- Assets: No asset limits mentioned in sources.
- Unemployed
- U.S. citizen or authorized to work in the U.S.
- Virginia resident
- Desire to re-enter the workforce

**Benefits:** Part-time paid job training (average 20 hours per week) at community sites like schools, libraries, health centers, nonprofits; paid the highest of federal, state, or local minimum wage; job placement assistance; support services like job search help, training, assistive technology if needed; typically lasts about 6 months as bridge to unsubsidized employment.
- Varies by: priority_tier

**How to apply:**
- Contact local Department of Rehabilitative Services (DARS) office: https://dars.virginia.gov/aging/senior-employment-program/[2]
- Contact local Area Agency on Aging[2]
- Charlottesville area (Virginia Career Works/Goodwill): Call (434) 529-6791 or visit https://www.goodwillvalleys.com/[1]
- Tri-Northern Virginia (Goodwill): Email susan@goodwilltnva.org or call 276-525-2204[6]
- Call for information (general process per providers)

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; funding transitions may cause delays[4]

**Watch out for:**
- Priority given to veterans, qualified spouses, those over 65, with disabilities, low literacy, limited English, rural residents, homeless/at risk, low employment prospects, or American Job Center users—may affect entry if not in priority group[3]
- Program is temporary training (about 6 months), not permanent job or guaranteed placement[2][4]
- SCSEP earnings generally do not affect SNAP/EBT/SSI/SSDI, but confirm with Social Security[6]
- Funding by DOL grants to state agencies/nonprofits like DARS, Goodwill; availability tied to local grantee capacity[3][6]
- Must be unemployed and seeking workforce re-entry; not for current workers

**Data shape:** Federally-funded with state grantees (e.g., DARS, Goodwill); priority tiers for enrollment; regional providers with specific service areas; income at 125% FPL (updates annually, household-size scaled); no asset test; part-time hours/wage fixed by min wage laws

**Source:** https://dars.virginia.gov/aging/senior-employment-program/

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by regional legal aid society; typically up to 125-200% of federal poverty level. Central Virginia: up to 187.5% in certain situations, standard 125% with deductions for work-related expenses, childcare, child support. Southwest Virginia: up to 200% gross family income depending on circumstances. Exact dollar amounts not specified in sources; contact local office for current federal poverty table. Seniors (60+) may receive legal advice without regard to finances in some programs.
- Assets: Low resources required (e.g., Central Virginia); specific dollar limits not detailed. What counts: generally countable assets like bank accounts; exemptions not specified but follow standard legal aid low-resource guidelines.
- U.S. citizenship or eligible immigration status
- Live in or have legal problem in service area of specific legal aid society
- Civil legal issue in covered areas (e.g., elder law, public benefits, housing, abuse)
- Not for domestic violence, prisoners, or community groups in some programs

**Benefits:** Free civil legal advice and representation in elder law areas including power of attorney, long-term care, public benefits (Medicaid, SSI), guardianship alternatives, age discrimination, financial exploitation, abuse/neglect, housing, consumer issues. No specific dollar amounts or hours; full representation or advice as case allows.
- Varies by: priority_tier

**How to apply:**
- Phone: Statewide Senior Legal Helpline (844) 802-5910 (toll-free for Virginians 60+)
- Phone: Regional examples - Central Virginia Legal Aid Society: Local 804-648-1012, Toll-free 800-868-1012 or 866-534-5243
- Website: valegalaid.org to locate local program
- In-person: Local legal aid offices (e.g., Central Virginia); bring documents to appointment
- Phone: Virginia Legal Services referral 800-552-7977

**Timeline:** Not specified
**Waitlist:** Not specified; limited lawyers may cause delays

**Watch out for:**
- Not a single statewide program—must identify and contact correct regional legal aid society
- Seniors get priority/advice without strict finances, but full representation limited by resources/caseload
- Income guidelines use % of federal poverty (contact for current $ amounts/table)
- Excludes certain cases (e.g., criminal, domestic violence in some offices)
- Limited lawyers (fewer than 240 statewide) lead to unserved eligible cases
- Deductions considered (e.g., medical, childcare) but verify with intake

**Data shape:** Delivered via 9 regional legal aid societies with varying income thresholds (125-200% FPL), senior priority exceptions; no uniform asset table or fixed benefits; statewide helpline for triage but services local

**Source:** https://www.valegalaid.org/ (VaLegalAid.org); https://selfhelp.vacourts.gov/node/33/statewide-senior-legal-helpline

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents regardless of financial status
- Assets: No asset limits; no financial tests apply
- Must be a resident of a long-term care facility such as nursing home or assisted living, or receiving home and community-based care
- Concerns related to rights, care, or services in these settings

**Benefits:** Investigate and resolve complaints about care and rights; provide information on rights and benefits; advocate with facilities, families, and agencies; assist in problem-solving, facility selection, and accessing resources like Medicare; confidential support; no fixed dollar amounts or hours

**How to apply:**
- Phone: State office at 1-804-565-1600
- Phone: Find local Ombudsman via https://dars.virginia.gov/aging/ombudsman/find-your-local-ombudsman/
- Phone examples: Northern Virginia (Fairfax) via local program, Prince William 703-792-7662, Span Center (Richmond area) 804-343-3000
- In-person: Local regional offices (e.g., Bay Aging, Appalachian Agency for Senior Citizens)
- No formal application form; contact to report concerns or seek assistance

**Timeline:** Immediate response to complaints; investigation timelines not specified

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy and complaint resolution, no direct services or payments
- Must already be in a qualifying long-term care setting; not for pre-admission qualification
- Services are free and confidential but rely on volunteers and local offices, so response may vary by region
- Contact local Ombudsman, not just state office, for fastest service

**Data shape:** no income test; advocacy only, not benefits or services; regionally administered with local contacts required; open to all facility residents without eligibility barriers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dars.virginia.gov/aging/ombudsman/

---

### Commonwealth Coordinated Care Plus (CCC+) Waiver


**Eligibility:**
- Income: Must meet Virginia Medicaid financial eligibility for long-term services and supports (LTC). Specific dollar amounts not listed in sources; varies by marital status. When only one spouse applies, the non-applicant's income is not counted, and spousal income allowance may apply from applicant to non-applicant spouse.[1]
- Assets: Must meet Virginia Medicaid asset limits for LTC (specific amounts not detailed in sources). Income and resources requirements apply generally.[1][4]
- Virginia resident.
- Aged 65+ or any age with physical disability, or chronically ill/severely impaired with loss of vital body function requiring substantial ongoing skilled nursing care.[1][2]
- Nursing Facility Level of Care (NFLOC) determined by Virginia Uniform Assessment Instrument (UAI), based on ADLs, living situation, physical health, behavioral issues (e.g., dementia-related); or Hospital Level of Care requiring medical device (e.g., ventilator) and significant nursing to prevent death/disability.[1]
- At imminent risk of nursing facility placement without waiver services.[3]
- Medicaid eligible.[2][4]

**Benefits:** Home and Community-Based Services (HCBS) to avoid nursing facility or hospital placement. Specific services include: Respite (480 hours per state fiscal year, July 1-June 30); Environmental Modifications (up to $5,000 per individual per calendar year); Assistive Technology (up to $5,000 per individual per calendar year); Private Duty Nursing (up to 112 hours per week); Transition Services (up to $5,000 per individual per lifetime). Other supports for older adults, physical disabilities, chronic illness. Waiver reimbursement rates on DMAS site.[2][3]
- Varies by: priority_tier

**How to apply:**
- Request LTSS Screening through local Department of Social Services (DSS).[2][4]
- Screening by Community Based Screening Team (social worker and health dept. nurse), or hospital discharge planner if hospitalized.[2]
- Medicaid application: Online at CommonHelp.virginia.gov; Phone: Cover Virginia Call Center 1-833-522-5582 (TDD: 1-888-221-1590); Local DSS for paper application and Appendix D for long-term services.[2]
- Regional contacts e.g., Fairfax: Under 18 call 703-222-0880; 18+ call 703-324-7948.[5]

**Timeline:** Not specified in sources.
**Waitlist:** No waiting list currently.[4]

**Watch out for:**
- Must meet strict NFLOC via UAI; dementia diagnosis alone insufficient.[1]
- Apply only if financially eligible to avoid denial.[1]
- Medicaid eligibility required first.[2]
- Services limited compared to DD waivers; can use CCC+ while waiting for DD.[4][5]
- Imminent risk of NF placement required.[3]

**Data shape:** No waitlist unlike some waivers; eligibility ties to NFLOC via UAI tool; services have hard caps (e.g., 480 respite hours/year, 112 nursing hours/week); screenings local but statewide; no specific income/asset dollar tables in sources, refers to general Medicaid LTC rules.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/

---

### Virginia Adult Services Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific statewide income or asset limits stated; eligibility determined by local departments based on need to remain in least restrictive setting. Financial assessment may be required, with proof of income via pay stubs or agency contacts[3].
- Assets: No asset limits specified in sources; local verification of financial need applies[3].
- Adults requiring support to stay at home and avoid nursing home placement[2][4]
- Dependent in at least one major IADL (e.g., meal preparation, housekeeping, laundry, money management) for companion services[4]
- Functional independence in least restrictive setting[4]
- Anyone may apply regardless of residency duration or citizenship[3]

**Benefits:** Screenings for assisted living, nursing home placement, home-based care, adult day care, and other waiver services; referrals for transportation, nutrition, homemaker, mental health; companion services up to 15 hours/week for IADL support (e.g., meal prep, housekeeping, laundry, money management)[2][4]
- Varies by: priority_tier

**How to apply:**
- In-person or mail via local Department of Social Services (e.g., King George County application form[3], Lee County DSS[4])
- Phone: state hotline (number not specified in results; contact local DSS)
- Assistance available to complete application on request day[3]

**Timeline:** Eligibility decision within 45 days; services begin within 45 days if eligible[3]
**Waitlist:** Optional services depend on local department availability; no statewide waitlist details[3]

**Watch out for:**
- Not Medicaid-funded; no case management included, only referrals[4]
- Must provide accurate info or face prosecution; changes must be reported in 10 days[3]
- Optional services only if local department offers them[3]
- Provider standards strict (age 16-18+, background checks) but apply to services received[1]
- Anyone can apply but eligibility based on need, not automatic[3]

**Data shape:** Administered locally by county/city DSS with statewide oversight; no fixed income/asset limits or age minimum; services focused on in-home independence with screenings/referrals rather than direct funding; varies by local availability and priority

**Source:** https://www.dss.virginia.gov/adults.cgi

---

### No Wrong Door System

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits or asset limits defined for the No Wrong Door System itself; it serves as an access point to various LTSS programs with their own eligibility criteria, such as Medicaid or veterans' programs[2][4][6].
- Assets: No asset limits or exemptions specified for No Wrong Door; eligibility assessed for connected public programs on a case-by-case basis[1][3].
- Open to all Virginians, especially older adults, individuals with disabilities, veterans, caregivers, and families seeking long-term services and supports (LTSS)[2][4]
- No formal age, income, or asset requirements for initial access or counseling; functional needs assessment guides referrals[1][2][6]

**Benefits:** Person-centered counseling, information and referral to over 27,000 programs/services, streamlined eligibility assistance for public LTSS programs (e.g., Medicaid application help, nursing facility pre-admission screening), secure provider connections via tools like No Wrong Door Direct Connect, health screeners, Communication/Referral/Information/Assistance (CRIA); connects 60,000+ individuals annually to resources[2][4][6]. No fixed dollar amounts or hours; services tailored to needs.
- Varies by: priority_tier

**How to apply:**
- Online: https://easyaccess.virginia.gov/ (consumer portal), https://www.nowrongdoor.virginia.gov[4][6]
- Phone: Toll-free number available via portal (specific number not listed; call local AAA or DARS for connection)[2][6]
- In-person: Through 25 statewide Area Agencies on Aging (AAAs)[2]
- Other: 24/7 live chat, self-directed referrals via No Wrong Door tools[6]

**Timeline:** Not specified; focuses on immediate information, referral, and counseling rather than fixed processing[1][2].

**Watch out for:**
- Not a direct benefits program—it's an access/navigation system; families must still qualify for referred LTSS programs (e.g., Medicaid income/asset tests apply there, not to NWD)[1][3][6]
- People miss that it connects to public/private services without 'wrong door'—start anywhere in network for person-centered options counseling[2][4]
- Veterans or specific groups may access via VDC tools, but requires follow-up eligibility[8]
- No guaranteed services; depends on availability in connected programs[5]

**Data shape:** No income/asset test for access; eligibility determined for downstream LTSS programs; statewide but locally implemented via 25 AAAs; virtual tools enable self-service without fixed tiers[2][4][6]

**Source:** https://www.nowrongdoor.virginia.gov[4]

---

### SeniorNavigator

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits; eligibility determined by individual services found via the platform, which provide their own criteria[1][3].
- Assets: No asset limits for the platform itself; varies by searched services[1].
- Virginia resident (statewide with local focus)
- Primarily targets older adults, people with disabilities, veterans, families, and caregivers; no universal requirements as it is a navigation tool[1][3]

**Benefits:** Online resource directory of over 27,000 programs covering health, housing, transportation, employment, financial planning, technology, and more; detailed info on eligibility, intake processes, costs; fact sheets, articles, books, videos; 'Ask an Expert' for personalized advice; searchable by topic and locality (city/county)[1][3].
- Varies by: region

**How to apply:**
- Online: virginianavigator.org (main site) or specialized portals for seniors, disabilities, veterans, caregivers (exact URLs not specified in sources); search by topic and locality[1][3]
- Phone or contact: Not specified directly; services listed provide their own intake[1]
- In-person: Local resources via Henrico partnership example[3]

**Timeline:** Immediate online access; no formal processing as it's a self-service directory[1].

**Watch out for:**
- Not a direct service provider—it's a navigation and referral tool; users must follow up on listed programs' separate eligibility/application[1]
- Details like costs/eligibility are service-specific, not platform-wide[1]
- Requires selecting locality for relevant results; may overwhelm with 27,000+ options without narrowing search[1]

**Data shape:** Navigation platform linking to localized services rather than a single benefits program; no universal eligibility/income test; varies heavily by region and selected service[1][3]

**Source:** https://www.seniornavigator.org (inferred from context; primary access via VirginiaNavigator.org per sources[1][3])

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid for Seniors/Disabled | benefit | state | deep |
| Virginia PACE (Program of All-Inclusive  | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Home Delivered Meals | benefit | local | deep |
| Virginia Lifespan Respite Voucher Progra | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors | resource | local | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Commonwealth Coordinated Care Plus (CCC+ | benefit | state | deep |
| Virginia Adult Services Program | benefit | state | deep |
| No Wrong Door System | benefit | state | deep |
| SeniorNavigator | benefit | state | medium |

**Types:** {"benefit":12,"resource":3,"employment":1}
**Scopes:** {"state":6,"local":3,"federal":7}
**Complexity:** {"deep":11,"simple":3,"medium":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/VA/drafts.json`.

- **Medicaid for Seniors/Disabled** (benefit) — 5 content sections, 6 FAQs
- **Virginia PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 8 programs
- **region**: 3 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **not_applicable**: 2 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid for Seniors/Disabled**: Multiple tiers (full/limited coverage, spenddown, Medicare Savings, waivers like CBC/Medicaid Works) with varying income/resource limits; resource test required (unlike MAGI Medicaid); statewide but local DSS processing; 2026 income guidelines effective Jan 13.
- **Virginia PACE (Program of All-Inclusive Care for the Elderly)**: Limited to specific regional PACE centers/providers (not statewide); eligibility combines federal PACE standards with Virginia Medicaid financial caps (300% SSI income, State Plan resource limits); NFLOC via UAI screening required; dual Medicare/Medicaid focus with private pay possible if financially eligible.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); limits for single/couple only (no larger households); state follows federal but may expand slightly; annual FPL adjustments; local DSS administration with potential waitlist for QI
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly Simplified Application Project (ESAP) for 60+ households: simplified form, 36-month certification, medical/shelter deductions key for seniors; BBCE waives assets; income tiers by BBCE status and household size.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Benefits vary by component (regular, crisis, cooling) and priority (e.g., elderly/disabled); income at exactly 150% FPL; local DSS administration leads to regional processing variations; no asset test.
- **Weatherization Assistance Program (WAP)**: Virginia WAP uses a dual-threshold income test (higher of 60% SMI or 200% poverty level), which is more complex than single-threshold programs. Benefits are standardized in-kind services, not cash assistance. The program operates through a decentralized network of local providers rather than centralized offices, requiring applicants to identify and contact their regional provider. Priority is given based on household composition (elderly, disabled, children) and energy burden, not on first-come-first-served basis. No specific dollar cap on services per household is mentioned in available documentation.
- **State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling service only via statewide network of local providers; prioritizes low-income and disabled but open to all Medicare beneficiaries
- **Home Delivered Meals**: Decentralized by region with local providers; no fixed income table or statewide uniformity; eligibility emphasizes functional needs over finances; varies by Area Agency on Aging service area
- **Virginia Lifespan Respite Voucher Program**: Statewide voucher reimbursement with fixed annual cap per household; no income/asset test; limited by funding availability rather than waitlist; includes Kinship Caregiver Expansion for childcare
- **Senior Community Service Employment Program (SCSEP)**: Federally-funded with state grantees (e.g., DARS, Goodwill); priority tiers for enrollment; regional providers with specific service areas; income at 125% FPL (updates annually, household-size scaled); no asset test; part-time hours/wage fixed by min wage laws
- **Legal Aid for Seniors**: Delivered via 9 regional legal aid societies with varying income thresholds (125-200% FPL), senior priority exceptions; no uniform asset table or fixed benefits; statewide helpline for triage but services local
- **Long-Term Care Ombudsman Program**: no income test; advocacy only, not benefits or services; regionally administered with local contacts required; open to all facility residents without eligibility barriers
- **Commonwealth Coordinated Care Plus (CCC+) Waiver**: No waitlist unlike some waivers; eligibility ties to NFLOC via UAI tool; services have hard caps (e.g., 480 respite hours/year, 112 nursing hours/week); screenings local but statewide; no specific income/asset dollar tables in sources, refers to general Medicaid LTC rules.
- **Virginia Adult Services Program**: Administered locally by county/city DSS with statewide oversight; no fixed income/asset limits or age minimum; services focused on in-home independence with screenings/referrals rather than direct funding; varies by local availability and priority
- **No Wrong Door System**: No income/asset test for access; eligibility determined for downstream LTSS programs; statewide but locally implemented via 25 AAAs; virtual tools enable self-service without fixed tiers[2][4][6]
- **SeniorNavigator**: Navigation platform linking to localized services rather than a single benefits program; no universal eligibility/income test; varies heavily by region and selected service[1][3]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Virginia?
