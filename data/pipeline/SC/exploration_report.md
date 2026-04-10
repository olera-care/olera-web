# South Carolina Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.095 (19 calls, 9.2m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 17 |
| Programs deep-dived | 14 |
| New (not in our data) | 8 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 5 programs
- **financial**: 4 programs
- **advocacy**: 3 programs
- **in_kind**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Community Choices Waiver

- **min_age**: Ours says `65` → Source says `65+ or 18-64 with physical disability` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health care, case management, personal care, respite (institutional, CRCF, in-home), adult day health care transportation/nursing, attendant care, companion care (agency/individual), home accessibility adaptations/environmental modifications, home delivered meals, personal emergency response system (installation/monitoring), pest control, residential personal care II, specialized medical equipment/supplies, telemonitoring.[6]` ([source](https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]`

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1305` → Source says `$20` ([source](https://www.scdhhs.gov/members/program-eligibility-and-income-limits))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premium (if applicable), Part B premium ($202.90/month in 2026), annual deductible, coinsurance/copayments for Medicare-covered Part A/B services. **SLMB:** Pays Part B premium only. **QI:** Pays Part B premium only (limited funding). QMB enrollees protected from provider billing; automatic in some cases.[2][3][8]` ([source](https://www.scdhhs.gov/members/program-eligibility-and-income-limits))
- **source_url**: Ours says `MISSING` → Source says `https://www.scdhhs.gov/members/program-eligibility-and-income-limits`

### SNAP (Food Assistance)

- **income_limit**: Ours says `$1980` → Source says `$1695` ([source](https://dss.sc.gov/assistance-programs/snap/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases. Amount based on net income, household size, and deductions (e.g., example 2-person elderly household: $415/mo after calculation). Exact amount calculated post-application; max allotment varies (e.g., $546 for 2-person in example).[1][6]` ([source](https://dss.sc.gov/assistance-programs/snap/))
- **source_url**: Ours says `MISSING` → Source says `https://dss.sc.gov/assistance-programs/snap/`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$2,666` ([source](https://oeo.sc.gov/managedsites/prd/oeo/liheap.html[7]))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payments to utility companies for heating/cooling: max heating $850, cooling $775, crisis $1,500; mins $200 each. Up to 2 services per calendar year, up to $1,500 per service. Additional benefits for elderly/disabled. Also crisis assistance, weatherization/energy repairs[1][2][6].` ([source](https://oeo.sc.gov/managedsites/prd/oeo/liheap.html[7]))
- **source_url**: Ours says `MISSING` → Source says `https://oeo.sc.gov/managedsites/prd/oeo/liheap.html[7]`

### Congregate Meals / Home Delivered Meals

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Congregate: Hot/frozen nutritious meals (1/3 RDA, diets like regular, diabetic, mechanical soft, pureed, no salt) served in group settings with socialization, activities (fitness, education, outings). Home-delivered: 1- meals/day, fresh/frozen tailored to conditions (diabetic, cardiac, renal); year-round for homebound.` ([source](https://aging.sc.gov/ (SCDOA); https://www.scdhhs.gov/ (Medicaid HDM)))
- **source_url**: Ours says `MISSING` → Source says `https://aging.sc.gov/ (SCDOA); https://www.scdhhs.gov/ (Medicaid HDM)`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigation and resolution of complaints; advocacy for residents' rights; assistance with appeals/grievances; education on resident rights and benefits; mediation with facilities; information/referrals on long-term care; promotion of dignity, respect, and quality of care/life. No financial aid, hours, or dollar amounts provided.` ([source](https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program))
- **source_url**: Ours says `MISSING` → Source says `https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program`

## New Programs (Not in Our Data)

- **Weatherization Assistance Program** — service ([source](https://oeo.sc.gov/ (SC Office of Economic Opportunity administers; see State Plan for agencies)))
  - Shape notes: Administered via 8 regional community action agencies covering all counties; eligibility at 200% FPL with priority tiers; documentation highly specific to agency guidelines.
- **SHIP / I-Care** — advocacy ([source](https://www.shiphelp.org/ships/south-carolina/[7]))
  - Shape notes: Counseling-only program with no financial eligibility tests; delivered via statewide network of local counselors and agencies
- **Legal Assistance for Seniors** — service ([source](https://aging.sc.gov/programs-initiatives/legal-assistance-older-adults))
  - Shape notes: Delivered statewide via decentralized local Area Agencies on Aging with varying providers per county/region; no fixed income/asset tables published; priority-based rather than strict cutoffs; funding and case volume tracked annually but not individualized
- **Homestead Exemption (State Property Tax Assistance)** — financial ([source](https://dor.sc.gov/property/exempt-property[6]; South Carolina Code § 12-37-250[1]))
  - Shape notes: This program has no income or asset limits, making it accessible to all qualifying elderly, disabled, or legally blind homeowners regardless of financial status. Benefits are fixed at $50,000 exemption (not tiered). Administration is decentralized by county, creating minor regional variations in application procedures and required documentation. The program is often confused with a separate 4% legal residence assessment program. Eligibility hinges on three specific criteria (age/disability/blindness status, ownership type, and residency duration), all of which must be met simultaneously.
- **Elderly Simplified Application Project (ESAP)** — in_kind ([source](https://dss.sc.gov/assistance-programs/snap/how-do-i-apply/help-for-the-elderly/))
  - Shape notes: ESAP is a simplified SNAP pathway specifically for elderly households with no earned income. The program's key differentiator is its streamlined process: no recertification interviews, flexible verification, and extended 36-month certification periods. Income limits exist but are not specified in available sources—families should contact their local DSS office for current thresholds. The program requires all household members to be 60+ with zero earned income, making it more restrictive than standard SNAP but easier to navigate administratively. South Carolina's dedicated caseworker unit and 93% approval rate indicate strong implementation, but specific regional office locations and processing timelines are not detailed in available sources.
- **Senior Farmers Market Nutrition Program (SFMNP)** — in_kind ([source](https://dss.sc.gov/assistance-programs/food-and-nutrition-programs/senior-farmers-market/))
  - Shape notes: This program's structure is defined by its seasonal nature (May–October annually), first-come-first-served benefit issuance, mandatory annual reapplication, and county-based distribution. Income eligibility is tied to federal poverty guidelines (185% threshold) rather than fixed dollar amounts, requiring annual verification. The program serves 46 counties statewide but operates through decentralized county-level distribution points, creating potential variation in local implementation and wait times. Benefit amounts appear standardized at $50 per participant, though one source suggests regional variation ($25 in some areas). The in-person-only application requirement is a significant structural constraint.
- **Vantage Point** — service ([source](https://www.caresouth-carolina.com/seniors))
  - Shape notes: Region-restricted AAA with priority tiers via assessment tool; services limited by funding/openings; partners with Councils on Aging; no fixed income/asset tables, need-based scoring.
- **Senior Medicare Patrol** — advocacy ([source](https://aging.sc.gov/programs-initiatives/medicare-and-medicare-fraud[1]))
  - Shape notes: no income/asset/age test; volunteer-led advocacy and education network via local aging agencies; not a qualifying aid program but open-access fraud prevention service[1][2][5]

## Program Details

### Community Choices Waiver


**Eligibility:**
- Age: 65+ or 18-64 with physical disability+
- Income: Must be financially eligible for South Carolina Medicaid (Healthy Connections); specific dollar amounts not detailed in sources but follows standard Medicaid long-term care rules. Use American Council on Aging Medicaid Eligibility Test for precise assessment.[1]
- Assets: Standard Medicaid countable asset limits apply (e.g., use Spend Down Calculator for estimates). Home is exempt if: applicant lives there or intends to return with equity ≤$730,000 (2025), spouse lives there, child under 21 lives there, or disabled/blind child of any age lives there.[1]
- South Carolina resident
- U.S. citizen or qualified alien
- Nursing Facility Level of Care (NFLOC): requires assistance with ADLs like mobility, eating, toileting, bathing, dressing, transitioning; or 8+ hours skilled nursing/day; dementia may qualify if NFLOC met.[1][2][4]
- At risk of nursing home placement
- Live in home/community (not institution)
- Cost of waiver services ≤ nursing facility cost[2][4]

**Benefits:** Adult day health care, case management, personal care, respite (institutional, CRCF, in-home), adult day health care transportation/nursing, attendant care, companion care (agency/individual), home accessibility adaptations/environmental modifications, home delivered meals, personal emergency response system (installation/monitoring), pest control, residential personal care II, specialized medical equipment/supplies, telemonitoring.[6]
- Varies by: priority_tier

**How to apply:**
- Through SCDHHS or local Health and Human Services Community Long Term Care (CLTC) Office[5]
- Phone or in-person at local CLTC office (specific numbers via SCDHHS directory)
- Online via SCDHHS website: https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]

**Timeline:** Not specified in sources
**Waitlist:** Waiver slots required; may involve waitlist as slots are limited[2]

**Watch out for:**
- Must already have or qualify for Medicaid; waiver does not provide it[2]
- NFLOC certification required—not automatic with age or dementia diagnosis[1]
- Waiver slots are limited; must use services regularly to retain slot[2]
- Home equity limit $730,000 (2025); exceeds may disqualify unless exceptions[1]
- Cost of services capped below nursing facility cost[2]
- Disabled enrollees (18-64) can continue benefits after 65[1][4]

**Data shape:** Eligibility ties to Medicaid financial rules + NFLOC; services prevent nursing home placement; slot-based with potential waitlist; local CLTC offices handle intake regionally

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/resources/waivers/community-choices-cc-waiver[4]

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits are based on Federal Poverty Level (FPL) with a $20 general income disregard applied monthly. For 2026 (effective April 1): QMB ≤100% FPL ($1,350 individual, $1,824 couple); SLMB 100-120% FPL (individual ~$1,350-$1,620, couple ~$1,824-$2,189); QI 120-135% FPL (individual ~$1,620-$1,823, couple ~$2,189-$2,461). South Carolina uses federal standards but confirms QMB income at $1,305 single/$1,763 married (prior year); limits updated annually April 1 and apply statewide regardless of household size beyond couple. Exact amounts require checking SCDHHS for current FPL tables.[5][8][9]
- Assets: Federal limits apply in South Carolina: $9,660 individual / $14,470 married couple for QMB, SLMB, QI (some sources cite $9,950/$14,910 for 2026). Countable assets include bank accounts, stocks, bonds; exempt: primary home/land, one car, burial plots, life insurance (up to $1,500 face value), household goods, Native American settlements. States cannot be less generous.[1][3][5]
- Must be eligible for Medicare Part A (even if not enrolled)
- South Carolina resident
- U.S. citizen or qualified immigrant
- Not eligible for full Medicaid (QMB provides Medicaid-like benefits in SC)

**Benefits:** **QMB:** Pays Medicare Part A premium (if applicable), Part B premium ($202.90/month in 2026), annual deductible, coinsurance/copayments for Medicare-covered Part A/B services. **SLMB:** Pays Part B premium only. **QI:** Pays Part B premium only (limited funding). QMB enrollees protected from provider billing; automatic in some cases.[2][3][8]
- Varies by: priority_tier

**How to apply:**
- Phone: South Carolina Department of Health and Human Services (SCDHHS) at 1-888-549-0820
- Online: SCDHHS ACCESS portal at https://access.scdhhs.gov/
- Mail/In-person: Local SCDHHS county offices (find via scdhhs.gov/locations)
- Apply through state Medicaid agency

**Timeline:** Effective first day of month of application for QMB; SLMB/QI retroactive to prior months if approved. Typically 45 days, but varies.[1]
**Waitlist:** QI has limited federal funding; first-come, first-served with possible waitlist or denial if funds exhausted.[2][3]

**Watch out for:**
- QI funding limited—apply early in calendar year (first-come, first-served; may run out)
- Income disregard ($20 general + earned income deductions) often missed; net income after disregards determines eligibility
- QMB in SC provides full Medicaid, unlike some states; no copays for covered services but providers can't bill you
- Assets include spouse's even if not applying; annual FPL updates April 1—recheck eligibility
- Automatic enrollment possible if on SSI/Medicaid, but must confirm
- Not full Medicaid—QMB/SLMB/QI are Medicare premium/cost-sharing help only (except QMB in SC)

**Data shape:** Tiered by income brackets (QMB/SLMB/QI) with fixed federal asset caps; income scales only by individual/couple (no larger households); QI capped by annual federal funding allocation per state; SC aligns exactly with federal MSP rules including asset tests

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.scdhhs.gov/members/program-eligibility-and-income-limits

---

### SNAP (Food Assistance)


**Eligibility:**
- Age: 60+
- Income: For households with elderly (60+) or disabled members (Oct 1, 2025 - Sept 30, 2026): Standard gross income limit at 130% FPL - 1: $1695/mo, 2: $2291, 3: $2887, 4: $3482, 5: $4079, 6: $4674, 7: $5270, +$595 each additional. Expanded for households where ALL adults are 60+ or disabled: 1: $2608/mo, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, +$916 each additional (165% FPL). Net income limit at 100% FPL for elderly/disabled households. Households with elderly/disabled only need gross income test if assets >$4500; otherwise, may qualify under federal rules with $4500 asset limit and no gross income limit.[2][3]
- Assets: Generally no asset limit in SC (expanded eligibility), but if assets >$4500 and household has elderly/disabled, must meet gross income test. Federal fallback: $4500 limit applies if not meeting expanded rules. Counts: bank accounts, etc. Exempt: primary home, most vehicles, retirement accounts (standard SNAP exemptions apply).[2][4]
- For ESAP (Elderly Simplified Application Project, specific to elderly): All household members 60+, no earned income, not already receiving SNAP via SCCAP.[1][5]
- U.S. citizen or qualified non-citizen.
- Live in SC.
- Deductions allowed: medical (> $35 for elderly/disabled), shelter, utilities, etc.[3]

**Benefits:** Monthly EBT card for food purchases. Amount based on net income, household size, and deductions (e.g., example 2-person elderly household: $415/mo after calculation). Exact amount calculated post-application; max allotment varies (e.g., $546 for 2-person in example).[1][6]
- Varies by: household_size

**How to apply:**
- Mail DSS ESAP Application to: ESAP, South Carolina Department of Social Services, PO Box 100203, Columbia, SC 29202 (form access via dss.sc.gov).[1]
- Phone: 1-888-898-0055 for ESAP/SCCAP info.[3]
- General SNAP: Online via SC EST (dss.sc.gov), local DSS offices in-person, or mail.[1][3]

**Timeline:** Benefits from date application filed if eligible; notified in writing of decision (no specific timeline stated).[1]

**Watch out for:**
- ESAP requires NO earned income for household and not on SCCAP; otherwise standard SNAP rules apply.[1][5]
- Even with no asset limit, application may ask for assets.[2]
- Social Security, pensions count as income.[3][4]
- ESAP simplifies: no interview, 36-month certification, data matches reduce verification.[5]
- New 2025 federal work requirement changes may affect (though elderly exempt).[6][9]

**Data shape:** Elderly-specific ESAP streamlines process (no earned income, simplified app/recert); expanded SC income limits beyond federal; benefits calculated via net income formula with elderly deductions; scales by household size.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dss.sc.gov/assistance-programs/snap/

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly household income must be at or below approximately 60% of South Carolina Median Income (SMI), varying by household size. From one source: 1 person $2,666/month; 2 $3,486; 3 $4,306; 4 $5,127; 5 $5,947; 6 $6,767. Another source table: 1 $2,332.83 monthly/$27,994 annual; 2 $3,050.58/$36,607; 3 $3,768.42/$45,221; 4 $4,486.25/$53,835; 5 $5,204/$62,448; 6 $5,921.83/$71,062; 7 $6,056.42/$72,677; 8 $6,191/$74,292; 9 $6,325.58/$75,907; 10 $6,460.17/$77,522[1][2][3].
- Assets: No asset limits mentioned in available sources[1][2][3].
- Household must include at least one member responsible for the energy bill (homeowners or renters; renters need itemized bill if included in rent)[6].
- U.S. citizenship or eligible status required[6].
- Priority for vulnerable households: elderly (60+), disabled (proof required), young children (5 and under), high energy users with lowest incomes, veterans, persons not previously served[1][3].

**Benefits:** One-time payments to utility companies for heating/cooling: max heating $850, cooling $775, crisis $1,500; mins $200 each. Up to 2 services per calendar year, up to $1,500 per service. Additional benefits for elderly/disabled. Also crisis assistance, weatherization/energy repairs[1][2][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency by county (map via oeo.sc.gov or call 803-734-0662)[6][7].
- Toll-free: 866-674-6327[8].
- Cayce office: 803-794-6778[8].
- Online pre-screen: liheap.acf.hhs.gov/eligibility-tool[8].

**Timeline:** Not specified in sources; varies by agency and funds availability[7].
**Waitlist:** Funds limited, services until exhausted; priority processing for vulnerable[1][3].

**Watch out for:**
- Must apply through county-specific Community Action Agency, not statewide directly[6][7].
- Energy bill must be in a household member's name; renters need itemized if in rent[6].
- Funds exhaust quickly; priority to vulnerable (elderly 60+, disabled, young kids); not year-round (heating fall/winter, cooling summer, crisis anytime)[1][2].
- Up to 2 services/year max; income based on gross monthly, includes all at address[2][6].
- Disabled requires proof[1].

**Data shape:** County-administered via Community Action Agencies with priority tiers for vulnerable (elderly/disabled get extras); income ~60% SMI table by household size; benefits capped by type/season with crisis higher; funds limited per region.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://oeo.sc.gov/managedsites/prd/oeo/liheap.html[7]

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households at or below 200% of the federal poverty level. Exact dollar amounts vary by household size and are checked against a chart provided by local agencies (e.g., Carolina Community Actions provides a family size-based monthly/annual table; add specific amount per additional member). Automatic eligibility for SSI or Aid to Families with Dependent Children recipients.[1][2][3]
- Assets: No asset limits mentioned.[1][2][3]
- South Carolina resident needing help with home energy costs.
- Preference for elderly (60+), disabled households, or those with children under 18 (or 17 per some sources).
- Home not weatherized in last 15 years.
- Proof of income for all household members.
- Renters eligible with landlord permission; homeowners need proof of ownership.[1][2][3]

**Benefits:** Free home weatherization to improve energy efficiency, health, and safety. Includes insulation, air infiltration measures, addressing health/safety issues (e.g., carbon monoxide, combustion safety). No specific dollar amount or hours; measures based on professional assessment.[3][7]
- Varies by: priority_tier

**How to apply:**
- Contact local community action agency (8 agencies cover all 46 counties; find via oeo.sc.gov or energyfundsforall.org).[1][4]
- In-person or mail documents to agency (e.g., Carolina Community Actions, Palmetto CAP).[2][7]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may vary by region or funding.

**Watch out for:**
- Must use local community action agency—program not centralized; find your agency's service area.
- Income proof strictly for 30 days/current year specific documents only (no bank statements).
- ID must match home address; all household members' docs required.
- Homes weatherized in last 15 years ineligible.
- Priority to elderly/disabled/children households—others may wait longer.
- Renters need landlord permission.[1][2][3]

**Data shape:** Administered via 8 regional community action agencies covering all counties; eligibility at 200% FPL with priority tiers; documentation highly specific to agency guidelines.

**Source:** https://oeo.sc.gov/ (SC Office of Economic Opportunity administers; see State Plan for agencies)

---

### SHIP / I-Care

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits; open to all Medicare-eligible individuals. Medicare eligibility requires age 65 or older, or under 65 with certain disabilities.[4][2]
- Assets: No asset limits or tests apply.[4]
- Must be eligible for Medicare (age 65+, or under 65 with disabilities)
- South Carolina resident
- Available to beneficiaries, families, or caregivers[2][4]

**Benefits:** Free personalized health insurance counseling on Medicare and Medicaid options, including plan comparisons, enrollment assistance, prescription assistance review, bill problem resolution, and referrals. Services include help with Medicare health/drug plans, supplements, Medigap, and understanding coverage changes.[2][4]

**How to apply:**
- Phone: 1-800-868-9095[7]
- In-person or contact local providers like Lt. Governor’s Office on Aging at 1301 Gervais Street, Suite 350, Columbia SC 29201[6]
- Local SHIP counselors via area agencies (e.g., Appalachian Area Agency on Aging, CareSouth Carolina locations)[2][5]

**Timeline:** Immediate counseling upon contact; no formal processing as it's not an entitlement program[2][4]

**Watch out for:**
- Not a direct service or financial benefit program—provides counseling and referrals only, not healthcare or payments[4]
- Does not cover non-medical personal care like bathing/dressing[4]
- Plans change annually; counseling recommended during Open Enrollment (Oct 15-Dec 7)[4]
- Funded federally, independent of insurance companies[2]

**Data shape:** Counseling-only program with no financial eligibility tests; delivered via statewide network of local counselors and agencies

**Source:** https://www.shiphelp.org/ships/south-carolina/[7]

---

### Congregate Meals / Home Delivered Meals


**Eligibility:**
- Age: 60+
- Income: No income limits for core Older Americans Act (OAA) funded programs; income not considered. Medicaid programs (e.g., Community Choices, HCBS waivers) require Medicaid eligibility, which has income limits varying by program and household size (specific dollar amounts not detailed in sources; verify via SCDHHS). Suggested contribution based on ability to pay for some funding sources.
- Assets: No asset limits specified.
- For home-delivered meals: 60+, homebound/ill/incapacitated, unable to leave home unassisted except for medical appointments, unable to purchase/prepare food due to disability, no one in home able to prepare meals daily.
- Spouses of any age qualify if living with eligible 60+ person.
- For Medicaid HDM: Enrolled in Medicaid HCBS waiver or Community Long Term Care (CLTC); verified by provider monthly.
- Congregate meals: 60+, ability to attend group settings (optional socialization).

**Benefits:** Congregate: Hot/frozen nutritious meals (1/3 RDA, diets like regular, diabetic, mechanical soft, pureed, no salt) served in group settings with socialization, activities (fitness, education, outings). Home-delivered: 1- meals/day, fresh/frozen tailored to conditions (diabetic, cardiac, renal); year-round for homebound.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA) or provider: e.g., Appalachian COG (864.242.9733, 1.800.434.4036); Cherokee County Senior Centers (864-489-3868); Oconee SENIOR Solutions (864-885-1000).
- For Medicaid/Community Choices: Contact local Community Long-Term Care office or care manager.
- Must be approved; referrals for Medicaid via SCDHHS.

**Timeline:** Providers must accept/decline referrals within 2 working days (Medicaid); approval process varies by local AAA.
**Waitlist:** Not specified; regional variations likely due to demand.

**Watch out for:**
- Two tracks: OAA (no income test, age 60+, local AAA) vs. Medicaid (stricter eligibility, homebound required).
- Suggested donations cover partial costs; not fully free.
- Home-delivered strictly for incapacitated/homebound; congregate requires ability to attend.
- Must reconfirm eligibility monthly (Medicaid); service ends if institutionalized or moves.
- Regional: Contact local AAA/provider, not centralized application.
- Non-Medicaid: Purchase options exist if ineligible (e.g., Mom's Meals $9.49/meal).

**Data shape:** Blended OAA Title III/VI (no income test, age 60+) and Medicaid HCBS/CLTC (Medicaid eligible only); decentralized via 6 regional AAAs with unique providers/contacts; home-delivered county-limited by provider capacity.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.sc.gov/ (SCDOA); https://www.scdhhs.gov/ (Medicaid HDM)

---

### Legal Assistance for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific dollar amounts or household size table provided; prioritizes individuals of greatest economic need, with particular attention to low-income minority older individuals, those with limited English proficiency, and rural residents.[1]
- Assets: No asset limits specified in available information.
- Greatest economic or social need
- Non-criminal legal matters only
- Provided by an attorney for legal advice and representation[1]

**Benefits:** Legal advice and representation by attorneys in 11 priority areas: Income Protection, Health Care, Long Term Care, Nutrition, Housing, Utilities, Protective Services, Guardianship/Defense Against Guardianship, Abuse, Neglect, Age Discrimination. Funded at approximately $330,000 annually statewide, handling around 1,160 cases per year.[1]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging via GetCareSC.com using ZIP code to find services[2]
- SC Bar Pro Bono Program at (803) 799-6653 for volunteer attorney participation and referrals[1]
- South Carolina Legal Services intake: call 1-888-346-5592 or apply online at sclegal.org[7]
- Regional providers such as Santee-Lynches Regional Council of Governments for referrals[4]

**Timeline:** For SC Legal Services, hear from local office within 5-7 business days after application[7]; no statewide processing time specified.
**Waitlist:** Not mentioned; may vary by local provider.

**Watch out for:**
- Not direct application to state agency; must go through local Area Agencies on Aging or partners like SC Legal Services[1][2]
- Prioritizes 'greatest economic or social need'—not automatic for all 60+; competition for limited funds[1]
- Services are free but capacity-limited (e.g., 1,160 cases/year statewide)[1]
- Varies significantly by county/provider; check GetCareSC.com for local availability[2]
- SC Legal Services has separate income-based eligibility[5][7]

**Data shape:** Delivered statewide via decentralized local Area Agencies on Aging with varying providers per county/region; no fixed income/asset tables published; priority-based rather than strict cutoffs; funding and case volume tracked annually but not individualized

**Source:** https://aging.sc.gov/programs-initiatives/legal-assistance-older-adults

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to anyone regardless of financial status.
- Assets: No asset limits; no financial eligibility requirements.
- Resident must be in a long-term care facility (nursing homes, assisted living, community residential care facilities, DDSN or DMH facilities) in South Carolina.
- Complaint must relate to quality of care, quality of life, residents' rights, abuse/neglect/exploitation, improper transfers/discharges, or benefits assistance.
- Available to residents, family, friends, facility staff, or any concerned community member filing on behalf of a resident.

**Benefits:** Investigation and resolution of complaints; advocacy for residents' rights; assistance with appeals/grievances; education on resident rights and benefits; mediation with facilities; information/referrals on long-term care; promotion of dignity, respect, and quality of care/life. No financial aid, hours, or dollar amounts provided.

**How to apply:**
- Phone: Statewide toll-free 1-800-868-9095 (for abuse/neglect or general complaints)[1]
- Phone/Email: Regional offices (e.g., Santee-Lynches: 803-774-1983 or sbrooks@slcog.org[2][4]; Appalachian: 864-242-9733 or ombudintake@scacog.org[3])
- In-person/Walk-in: Regional offices
- Email or outreach events via regional providers

**Timeline:** Not specified; ombudsmen investigate promptly and follow up to ensure resolution.

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy for complaints in facilities; does not provide direct services like care or payments.
- Only for long-term care facility residents, not community-dwelling adults (separate reporting for community abuse).
- Complaints handled confidentially, but identity may need disclosure for resolution (resident chooses).
- Anyone can file, but focus is protecting facility residents.

**Data shape:** no income/asset/age test; advocacy-only for LTC facility residents; delivered via 10 regional offices with local contacts; free statewide service under Older Americans Act.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.sc.gov/programs-initiatives/long-term-care-ombudsman-program

---

### Homestead Exemption (State Property Tax Assistance)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits specified in program requirements[1][2][4]
- Assets: No asset limits specified; however, the exemption applies only to primary legal residence with fair market value consideration[1][4]
- Must hold complete fee simple title, life estate, or be beneficiary of trust holding title to primary legal residence[2][4]
- Must be legal resident of South Carolina for one calendar year as of December 31 preceding tax year of exemption[2][4]
- Property must be primary legal residence where applicant resides for majority of year[1]
- Alternatively: Declared totally and permanently disabled by state or federal agency with authority to make declaration[2][4]
- Alternatively: Legally blind as certified by licensed ophthalmologist[2][4]
- Eligible properties: single-family homes, condominiums, mobile/manufactured homes on owned land[1]

**Benefits:** $50,000 exemption from fair market value of primary residence when calculating county property taxes[1][2][4]; if primary residence valued at $50,000 or less, exempt from all property taxes[7]
- Varies by: fixed

**How to apply:**
- In-person at county auditor's office or county real property services office[2]
- Mail to county auditor's office (specific address varies by county)
- Phone contact to county auditor's office (varies by county; example: Oconee County requires documentation by mail or in-person after initial contact)

**Timeline:** Not specified in search results; one-time application continues automatically once approved[1]
**Waitlist:** No waitlist mentioned in search results[1][2][4]

**Watch out for:**
- Program is often confused with 'Application for Special Assessment as Legal Residence 4%' administered by Tax Assessor's Office—these are separate programs[7]
- One-year South Carolina residency requirement must be met as of December 31 preceding tax year; moving to South Carolina mid-year does not qualify until following year[2][4]
- If deed is in applicant's name and non-spouse's name, exemption is prorated based on ownership percentage shown on deed; full $50,000 exemption only applies if deed is in applicant's name alone or jointly with spouse[7]
- Exemption applies only to primary legal residence; secondary properties, rentals, and investment homes do not qualify[1]
- Proposed expansion (as of 2025) would offer $75,000 exemption with 5-year residency or $150,000 with 10-year residency, but current law remains $50,000 with 1-year residency[5]
- Disability qualification requires certification from state or federal agency with authority to make declaration; self-certification does not qualify; applicants without existing disability classification may apply to state Vocational Rehabilitation agency[2]
- Application is one-time but counties may have varying documentation requirements for renewal or verification[1]

**Data shape:** This program has no income or asset limits, making it accessible to all qualifying elderly, disabled, or legally blind homeowners regardless of financial status. Benefits are fixed at $50,000 exemption (not tiered). Administration is decentralized by county, creating minor regional variations in application procedures and required documentation. The program is often confused with a separate 4% legal residence assessment program. Eligibility hinges on three specific criteria (age/disability/blindness status, ownership type, and residency duration), all of which must be met simultaneously.

**Source:** https://dor.sc.gov/property/exempt-property[6]; South Carolina Code § 12-37-250[1]

---

### Elderly Simplified Application Project (ESAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. Income limits exist but specific dollar amounts by household size are not provided in the search results.[4]
- Assets: Not specified in available sources.
- All household members must be age 60 or older[1][4]
- Household members must have no earned income (no salaries from work)[1][4]
- Household must not already receive SNAP benefits under South Carolina Combined Application Project (SCCAP)[1][4]
- Household members must purchase and prepare food together[4]

**Benefits:** SNAP (Supplemental Nutrition Assistance Program) food assistance benefits. Specific benefit amounts are not detailed in available sources but are determined by SNAP eligibility and household circumstances.[1][3]
- Varies by: household_size

**How to apply:**
- Mail: Complete DSS ESAP Application (Form 16176) and mail to ESAP, South Carolina Department of Social Services, PO Box 100203, Columbia, SC 29202[1]
- In-person: Initial interview required at DSS office (specific office locations not provided in available sources)

**Timeline:** Not specified in available sources. Applicants are notified in writing of the decision on their case.[1]
**Waitlist:** Not mentioned in available sources.

**Watch out for:**
- All household members must be 60+; if any household member is under 60, the household does not qualify for ESAP[1][4]
- Cannot have any earned income; even part-time work disqualifies the household[1][4]
- Cannot already be receiving SNAP under SCCAP; households must choose one program[1][4]
- Recertification interview is waived, but an initial interview is required[4]
- Certification period extends to 36 months with no periodic reporting required after initial approval, reducing administrative burden[3][4]
- South Carolina has achieved a 93% application approval rate since 2015, suggesting very few eligible seniors are denied for procedural reasons[2]
- The program is specifically designed to address barriers elderly people face (transportation, mobility, disability) that prevent SNAP participation[2]

**Data shape:** ESAP is a simplified SNAP pathway specifically for elderly households with no earned income. The program's key differentiator is its streamlined process: no recertification interviews, flexible verification, and extended 36-month certification periods. Income limits exist but are not specified in available sources—families should contact their local DSS office for current thresholds. The program requires all household members to be 60+ with zero earned income, making it more restrictive than standard SNAP but easier to navigate administratively. South Carolina's dedicated caseworker unit and 93% approval rate indicate strong implementation, but specific regional office locations and processing timelines are not detailed in available sources.

**Source:** https://dss.sc.gov/assistance-programs/snap/how-do-i-apply/help-for-the-elderly/

---

### Senior Farmers Market Nutrition Program (SFMNP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household gross income cannot exceed 185% of federal poverty income guidelines. Specific dollar amounts vary by household size and year. One source cites $27,861 for individuals and $37,814 for couples, but this appears to be from a specific distribution year and may not reflect current federal poverty thresholds.[1][3]
- Assets: Not specified in available sources.
- Must be a resident of South Carolina[2]
- Must reside in one of the 46 counties served by the program[1]
- Must have valid proof of identity (South Carolina Driver's License or State-Issued Identification Card)[2]
- Must apply in-person at an approved distribution location in their county of residence[2]
- Must reapply annually[2]

**Benefits:** Five vouchers worth $10 each, totaling $50 per participant per year, redeemable for fresh fruits, vegetables, honey, and herbs at authorized farmers' markets, roadside stands, and community-supported agriculture programs[2][3]
- Varies by: fixed

**How to apply:**
- In-person only at approved distribution locations in your county of residence[2]
- Contact: Willie Nixon, Program Coordinator, Department of Social Services, 803-898-1760, willie.j.nixon@dss.sc.gov[5]

**Timeline:** Not specified in available sources. Benefits are issued on a first-come, first-served basis.[2]
**Waitlist:** Eligibility determination can result in application approval, referral to waiting list, or denial. Specific waitlist timelines not provided.[2]

**Watch out for:**
- The program is seasonal and runs May 1 through October 15 each year.[6] The 2025 season has concluded; the next season begins Summer 2026.[2]
- Benefits are issued on a first-come, first-served basis, meaning availability is not guaranteed even if eligible.[2]
- Seniors must apply every year; benefits do not carry over.[2]
- Applications must be completed in-person at approved locations in the applicant's county of residence—no online, phone, or mail applications are accepted (though one source mentions online applications as an option, this appears to be location-specific and not universally available).[2][4]
- Income limits are based on 185% of federal poverty guidelines, which change annually. Families should verify current thresholds with their county office rather than relying on historical dollar amounts.[3]
- Vouchers can only be used at authorized farmers' markets and vendors—not all farmers' markets participate.[2]
- The program is administered by the Department of Social Services (for seniors) in partnership with the Department of Agriculture (for farmers), creating a two-agency structure that may affect application processing.[5]

**Data shape:** This program's structure is defined by its seasonal nature (May–October annually), first-come-first-served benefit issuance, mandatory annual reapplication, and county-based distribution. Income eligibility is tied to federal poverty guidelines (185% threshold) rather than fixed dollar amounts, requiring annual verification. The program serves 46 counties statewide but operates through decentralized county-level distribution points, creating potential variation in local implementation and wait times. Benefit amounts appear standardized at $50 per participant, though one source suggests regional variation ($25 in some areas). The in-person-only application requirement is a significant structural constraint.

**Source:** https://dss.sc.gov/assistance-programs/food-and-nutrition-programs/senior-farmers-market/

---

### Vantage Point

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits stated in available sources; services prioritize highest need via assessment scoring, often targeting low-income seniors. Financial eligibility assessed case-by-case for programs like vouchers ($25 value for Senior Farmers Market Nutrition Program, first-come first-served).
- Assets: No asset limits specified.
- Resident of Pee Dee region (Chesterfield, Darlington, Dillon, Florence, Marion, Marlboro counties)
- Assessed need via Question Pro tool for priority tier
- Reassessed annually

**Benefits:** Information and referral; advocacy for entitlements; insurance counseling (Medicare, Medicaid, long-term care via I-CARE); caregiver support; respite care; meals (home-delivered/non-perishable via partners); Senior Farmers Market Nutrition vouchers ($25 coupons June-Oct); mobility/housing assistance; supplemental services on limited basis; helps maintain independence at home.
- Varies by: priority_tier

**How to apply:**
- Phone: (843) 857-0111 (Hartsville office), 843-383-8632 or toll-free 866-505-3331 (I-CARE)
- In-person: 640 South Fourth Street, PO Box 999, Hartsville, SC 29551
- Contact local Council on Aging for meals/services

**Timeline:** Not specified; referrals made as service openings available.
**Waitlist:** Yes, maintained by Assessment Coordinator when demand exceeds funding; priority by electronic tier score.

**Watch out for:**
- Not statewide—limited to 6 Pee Dee counties; heavy waitlists due to funding limits and staff shortages; priority-based (highest score first), not first-come; separate veteran program exists but unrelated to elderly family services; voucher programs exhaust supply quickly.

**Data shape:** Region-restricted AAA with priority tiers via assessment tool; services limited by funding/openings; partners with Councils on Aging; no fixed income/asset tables, need-based scoring.

**Source:** https://www.caresouth-carolina.com/seniors

---

### Senior Medicare Patrol

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, families, and caregivers[1][2]
- Assets: No asset limits; not applicable[1][2]
- Must be a Medicare beneficiary, family member, or caregiver suspecting or needing help with Medicare fraud, errors, or abuse[1][2][5]

**Benefits:** Outreach and education via presentations, community events, and one-on-one support; counseling to review Medicare Summary Notices (MSNs) for errors; investigation of complaints and referrals to state/federal agencies (e.g., HHS OIG, CMS); volunteer assistance to prevent, detect, and report fraud, errors, abuse[1][2][6][7]

**How to apply:**
- Phone: South Carolina Department on Aging at 1-800-868-9095[1]
- Contact local Area Agency on Aging[1]
- Phone: Medicare/Medicaid Fraud Hotline at 1-800-447-8477[4]
- Local SMP via agencies like AOASCC or 1-800-994-9422[6]

**Timeline:** No formal application or processing time; immediate counseling and referral assistance available upon contact[1][2]

**Watch out for:**
- Not a benefits or financial aid program—provides fraud prevention/education only, no direct payments or healthcare services; no 'qualification' or enrollment process like aid programs; often confused with SHIP counseling, which some grantees also offer[1][2][4]
- Requires active reporting or suspicion of fraud; volunteers handle education/outreach, not law enforcement investigations[1][3]

**Data shape:** no income/asset/age test; volunteer-led advocacy and education network via local aging agencies; not a qualifying aid program but open-access fraud prevention service[1][2][5]

**Source:** https://aging.sc.gov/programs-initiatives/medicare-and-medicare-fraud[1]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Community Choices Waiver | benefit | state | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| SNAP (Food Assistance) | benefit | federal | medium |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| SHIP / I-Care | resource | federal | simple |
| Congregate Meals / Home Delivered Meals | benefit | state | deep |
| Legal Assistance for Seniors | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Homestead Exemption (State Property Tax  | benefit | state | medium |
| Elderly Simplified Application Project ( | benefit | state | deep |
| Senior Farmers Market Nutrition Program  | benefit | state | deep |
| Vantage Point | resource | local | simple |
| Senior Medicare Patrol | resource | federal | simple |

**Types:** {"benefit":9,"resource":5}
**Scopes:** {"state":6,"federal":7,"local":1}
**Complexity:** {"deep":7,"medium":2,"simple":5}

## Content Drafts

Generated 14 page drafts. Review in admin dashboard or `data/pipeline/SC/drafts.json`.

- **Community Choices Waiver** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Food Assistance)** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 5 content sections, 6 FAQs
- **SHIP / I-Care** (resource) — 2 content sections, 6 FAQs
- **Congregate Meals / Home Delivered Meals** (benefit) — 4 content sections, 6 FAQs
- **Legal Assistance for Seniors** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Homestead Exemption (State Property Tax Assistance)** (benefit) — 3 content sections, 6 FAQs
- **Elderly Simplified Application Project (ESAP)** (benefit) — 2 content sections, 6 FAQs
- **Senior Farmers Market Nutrition Program (SFMNP)** (benefit) — 3 content sections, 6 FAQs
- **Vantage Point** (resource) — 3 content sections, 6 FAQs
- **Senior Medicare Patrol** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **household_size**: 2 programs
- **not_applicable**: 3 programs
- **region**: 1 programs
- **fixed**: 2 programs

### Data Shape Notes

Unique structural observations from each program:

- **Community Choices Waiver**: Eligibility ties to Medicaid financial rules + NFLOC; services prevent nursing home placement; slot-based with potential waitlist; local CLTC offices handle intake regionally
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB/SLMB/QI) with fixed federal asset caps; income scales only by individual/couple (no larger households); QI capped by annual federal funding allocation per state; SC aligns exactly with federal MSP rules including asset tests
- **SNAP (Food Assistance)**: Elderly-specific ESAP streamlines process (no earned income, simplified app/recert); expanded SC income limits beyond federal; benefits calculated via net income formula with elderly deductions; scales by household size.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: County-administered via Community Action Agencies with priority tiers for vulnerable (elderly/disabled get extras); income ~60% SMI table by household size; benefits capped by type/season with crisis higher; funds limited per region.
- **Weatherization Assistance Program**: Administered via 8 regional community action agencies covering all counties; eligibility at 200% FPL with priority tiers; documentation highly specific to agency guidelines.
- **SHIP / I-Care**: Counseling-only program with no financial eligibility tests; delivered via statewide network of local counselors and agencies
- **Congregate Meals / Home Delivered Meals**: Blended OAA Title III/VI (no income test, age 60+) and Medicaid HCBS/CLTC (Medicaid eligible only); decentralized via 6 regional AAAs with unique providers/contacts; home-delivered county-limited by provider capacity.
- **Legal Assistance for Seniors**: Delivered statewide via decentralized local Area Agencies on Aging with varying providers per county/region; no fixed income/asset tables published; priority-based rather than strict cutoffs; funding and case volume tracked annually but not individualized
- **Long-Term Care Ombudsman Program**: no income/asset/age test; advocacy-only for LTC facility residents; delivered via 10 regional offices with local contacts; free statewide service under Older Americans Act.
- **Homestead Exemption (State Property Tax Assistance)**: This program has no income or asset limits, making it accessible to all qualifying elderly, disabled, or legally blind homeowners regardless of financial status. Benefits are fixed at $50,000 exemption (not tiered). Administration is decentralized by county, creating minor regional variations in application procedures and required documentation. The program is often confused with a separate 4% legal residence assessment program. Eligibility hinges on three specific criteria (age/disability/blindness status, ownership type, and residency duration), all of which must be met simultaneously.
- **Elderly Simplified Application Project (ESAP)**: ESAP is a simplified SNAP pathway specifically for elderly households with no earned income. The program's key differentiator is its streamlined process: no recertification interviews, flexible verification, and extended 36-month certification periods. Income limits exist but are not specified in available sources—families should contact their local DSS office for current thresholds. The program requires all household members to be 60+ with zero earned income, making it more restrictive than standard SNAP but easier to navigate administratively. South Carolina's dedicated caseworker unit and 93% approval rate indicate strong implementation, but specific regional office locations and processing timelines are not detailed in available sources.
- **Senior Farmers Market Nutrition Program (SFMNP)**: This program's structure is defined by its seasonal nature (May–October annually), first-come-first-served benefit issuance, mandatory annual reapplication, and county-based distribution. Income eligibility is tied to federal poverty guidelines (185% threshold) rather than fixed dollar amounts, requiring annual verification. The program serves 46 counties statewide but operates through decentralized county-level distribution points, creating potential variation in local implementation and wait times. Benefit amounts appear standardized at $50 per participant, though one source suggests regional variation ($25 in some areas). The in-person-only application requirement is a significant structural constraint.
- **Vantage Point**: Region-restricted AAA with priority tiers via assessment tool; services limited by funding/openings; partners with Councils on Aging; no fixed income/asset tables, need-based scoring.
- **Senior Medicare Patrol**: no income/asset/age test; volunteer-led advocacy and education network via local aging agencies; not a qualifying aid program but open-access fraud prevention service[1][2][5]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in South Carolina?
