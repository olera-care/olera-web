# Tennessee Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 5.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 12 |
| New (not in our data) | 4 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 7 | Program varies by region — our model doesn't capture this |

## Program Types

- **financial**: 3 programs
- **service|advocacy**: 2 programs
- **service**: 4 programs
- **employment**: 1 programs
- **advocacy**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### TennCare Medicare Savings Programs (QMB, SLMB, QI)

- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/tenncare/members-applicants/eligibility/categories.html and https://www.tn.gov/content/dam/tn/tenncare/documents/QualifiedMedicareBeneficiary.pdf`

### Tennessee SNAP

- **income_limit**: Ours says `$1984` → Source says `$209` ([source](https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html[10]))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (amount based on net income, household size, deductions; e.g., example 2-person elderly household: $415/month after 30% net income subtraction from max allotment of $546). Excludes sugary foods in TN[2]. Max allotments vary (e.g., Table 1 federal for Oct 2025-26 not fully detailed here)[7].` ([source](https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html[10]))
- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html[10]`

### Tennessee LIHEAP

- **income_limit**: Ours says `$3092` → Source says `$17,505` ([source](https://thda.org/help-for-homeowners/low-income-home-energy-assistance-program-liheap/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time payment to utility company for heating/cooling: Regular $174-$750 (varies by energy burden); max heating/cooling $1,000, min $600; crisis max $1,000; older summer cooling max $325, heating/emergency $250. Available once per year from up to two of three programs (regular, crisis, summer).[1][4][5]` ([source](https://thda.org/help-for-homeowners/low-income-home-energy-assistance-program-liheap/))
- **source_url**: Ours says `MISSING` → Source says `https://thda.org/help-for-homeowners/low-income-home-energy-assistance-program-liheap/`

### Tennessee State Health Insurance Assistance Program (TN SHIP)

- **min_age**: Ours says `65` → Source says `65 or older, OR any age if on Medicare due to disability[6]` ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html[4]))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, unbiased one-on-one counseling and education; no direct financial payments from this program, though counselors help beneficiaries apply for programs that DO pay (Medicare Savings Plans, Extra Help/Low Income Subsidy, Medicaid)[2][4]` ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html[4]`

### National Family Caregiver Support Program (NFCSP)

- **min_age**: Ours says `60` → Source says `Caregiver must be 55+ (with exceptions); Care Recipient varies by category` ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/caregiving.html))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Up to 6 hours per week in-home respite care; other services availability varies by service area` ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/caregiving.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/disability-and-aging/disability-aging-programs/caregiving.html`

### Tennessee Senior Law Alliance (TSLA) / Tennessee Senior Legal Helpline

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free legal services including: referrals, brief legal advice, full legal representation, estate planning, document drafting (wills, advance directives, powers of attorney), assistance with wrongfully reduced/denied benefits and healthcare access, housing issues, abuse and exploitation cases, consumer problems[1][3][7]` ([source](https://www.tals.org/page/453/free-senior-legal-helpline and https://las.org/tennessee-senior-law-alliance/))
- **source_url**: Ours says `MISSING` → Source says `https://www.tals.org/page/453/free-senior-legal-helpline and https://las.org/tennessee-senior-law-alliance/`

### Tennessee Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to identify, investigate, and resolve complaints; provide information on rights, admission processes, long-term services; ensure access to care quality improvements; represent interests before agencies; educate on resident rights including courtesy, private visits, no wrongful transfer/discharge, freedom from abuse[1][3][4][5][6][7]` ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/long-term-care-ombudsman.html[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/disability-and-aging/disability-aging-programs/long-term-care-ombudsman.html[4]`

### Tennessee State Health Insurance Assistance Program (TN SHIP) and Senior Medicare Patrol (SMP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one counseling on Medicare enrollment, Part D/Advantage comparisons, eligibility, coverage, rights, appeals; assistance with Medicare Savings Programs/Extra Help applications; fraud prevention/education/reporting via SMP; group presentations, health fairs[2][3][4][5][6]` ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html))
- **source_url**: Ours says `MISSING` → Source says `https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html`

## New Programs (Not in Our Data)

- **Tennessee Meals on Wheels** — service ([source](https://www.tn.gov/disability-and-aging/disability-aging-programs/aging-nutrition-program.html[6]))
  - Shape notes: Decentralized by 95 counties via local AAADs with regional providers; no income/asset test statewide; assessment-based eligibility varies slightly by region (e.g., younger disabled in some areas)[1][2][6]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.tn.gov/workforce/jobs-and-education/services-by-group/services-by-group-redirect/senior-work-experience-program.html))
  - Shape notes: Regionally administered by multiple local workforce/human resource agencies with county-specific coverage and contacts; priority tiers affect access; income test at 125% FPL without published dollar table in sources (requires provider verification); part-time hours/wage fixed federally but local minimum wage applies.
- **OPTIONS for Community Living** — service ([source](https://www.ftaaad.org/options-subpage (FTAAAD, Tennessee Commission on Aging and Disability-funded)[2]))
  - Shape notes: Regional AAAD administration with county-specific providers; no income/asset test but cost-share over FPG; waitlist prioritization by need; distinct from Medicaid CHOICES program.
- **Senior Advocate Program** — advocacy ([source](No single primary .gov URL identified; related info at tn.gov/disability-and-aging[7]; ETHRA program page: www.ethra.org/programs/21/legal-assistance-for-the-elderly[3]))
  - Shape notes: Local/grassroots model via senior centers and AAADs, not statewide uniform; only 3 dedicated in TN with regional providers; no fixed income/asset tests, focuses on service gaps and capacity limits

## Program Details

### TennCare Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: {"description":"Income limits are based on Federal Poverty Level (FPL) and vary by program and household composition. 2026 limits are:","QMB":{"individual_monthly":"$1,350","couple_monthly":"$1,824","fpl_threshold":"100% of FPL"},"SLMB":{"individual_monthly":"Not specified in search results","couple_monthly":"Not specified in search results","fpl_threshold":"120% of FPL"},"QI_1":{"individual_monthly":"$1,715","couple_monthly":"$2,064","fpl_threshold":"120-135% of FPL"},"note":"Income limits increase annually in January. Applicants should verify current year limits with TennCare."}
- Assets: {"description":"Resource limits for 2026:","QMB":{"individual":"$9,950","couple":"$14,910"},"SLMB":{"individual":"Not specified in search results","couple":"Not specified in search results"},"QI_1":{"individual":"$9,430","couple":"$14,130"},"what_counts":"Money in bank accounts, stocks, and bonds","what_does_not_count":"Primary residence, one car, burial plot, up to $1,500 in burial expenses, furniture, household items, and personal items"}
- Must be entitled to Medicare Part A (with limited exceptions for QI-1 for individuals under 65 who lost Part A entitlement due to returning to work)
- Must have both Part A and Part B to qualify for SLMB or QI programs
- Cannot be enrolled in TennCare Medicaid or TennCare Standard to qualify for QI-1
- If eligible for Medicaid, cannot receive QI benefits but may qualify for another MSP
- QI-1 recipients must reapply every year; applications granted on first-come, first-served basis with priority given to prior-year recipients

**Benefits:** N/A
- Varies by: program_tier

**How to apply:**
- Phone: Contact TennCare directly (specific number not provided in search results; SHIP provides free assistance at 1-877-801-0044)
- Mail: Submit application to Bureau of TennCare (specific mailing address not provided in search results)
- In-person: Contact local TennCare office (specific office locations not provided in search results)
- Online: Through TennCare website (specific URL not provided in search results)

**Timeline:** Eligibility start date is the first day of the month after application approval (specific processing timeline in days/weeks not provided in search results)
**Waitlist:** QI-1 program operates on first-come, first-served basis until funds run out; priority given to prior-year recipients. No waitlist information provided for QMB or SLMB.

**Watch out for:**
- QI-1 is NOT available to CHOICES recipients[5]
- QI-1 operates on first-come, first-served basis with limited funding; applications may be denied once funds are exhausted for the year[3][4]
- QI-1 requires annual reapplication; benefits are not automatic renewal[4]
- If eligible for Medicaid, you cannot use QI but may qualify for QMB or SLMB instead[7]
- Cannot be enrolled in TennCare Medicaid or TennCare Standard to qualify for QI-1[1]
- QMB eligibility automatically establishes Medicare Part B effective the month after approval, even if the individual previously refused Part B coverage[2]
- TennCare will automatically establish Part A or B coverage with Social Security Administration—applicants do not need to contact SSA separately[2]
- Income and asset limits change annually (new limits released each January); families must verify current-year thresholds[7]
- These programs provide cost-sharing assistance only and do not provide full Medicaid benefits[1]
- QI-1 for individuals under 65 who lost Medicare Part A due to returning to work is a distinct category with different rules than standard QI-1[1]

**Data shape:** This program consists of three distinct tiers (QMB, SLMB, QI-1) with progressively higher income thresholds but decreasing benefit comprehensiveness. QMB is mandatory for states; SLMB and QI-1 are optional but Tennessee offers them. QI-1 has unique constraints: first-come, first-served funding model, annual reapplication requirement, and exclusion for CHOICES recipients and those already on TennCare Medicaid. Income and asset limits are indexed to Federal Poverty Level and change annually. Specific application procedures, processing timelines, required forms, and regional office locations are not detailed in available search results and require direct contact with TennCare.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/tenncare/members-applicants/eligibility/categories.html and https://www.tn.gov/content/dam/tn/tenncare/documents/QualifiedMedicareBeneficiary.pdf

---

### Tennessee SNAP


**Eligibility:**
- Income: For households with any member 60 or older or disabled: no gross income limit, but must meet net income test (net income calculated as gross minus deductions like 20% earned income deduction, standard deduction ($209 for 1-3 people), shelter/utility up to $744, medical over $35 for elderly/disabled). General households: gross income ≤130% FPL (e.g., Oct 2025-2026: ~$15,060/year or $1,255/month for 1 person; $20,440/year or $1,703/month for 2 people; exact table varies by size—use official calculator). Seniors 60+ exempt from gross income test[1][3][6][7].
- Assets: Households with member 60+ or disabled are exempt from asset test. General households subject to asset test (limits not specified in sources; most retirement accounts like 401Ks exempt, home and one car typically exempt)[1][8].
- Tennessee resident[6].
- U.S. citizen or qualified non-citizen.
- Seniors 60+ and disabled exempt from work requirements (ABAWD rules apply to able-bodied adults 18-under 65 without dependents/children under 14; must work/volunteer/train 80 hours/month or limited to 3 months benefits in 3 years)[2][4][5][6][9].
- Household defined as those who buy/prepare food together; parents/children ≤21 considered one[6].

**Benefits:** Monthly EBT card for food purchases (amount based on net income, household size, deductions; e.g., example 2-person elderly household: $415/month after 30% net income subtraction from max allotment of $546). Excludes sugary foods in TN[2]. Max allotments vary (e.g., Table 1 federal for Oct 2025-26 not fully detailed here)[7].
- Varies by: household_size

**How to apply:**
- Online: tn.gov/humanservices (via DHS portal)[6][10].
- Phone: Contact local TDHS office (TDHS helpline not specified; use 1-866-311-4287 or local via directory)[10].
- Mail/In-person: Local TDHS county offices (find via tn.gov/humanservices).[10].

**Timeline:** Not specified in sources; typically 30 days standard, expedited for urgent cases.

**Watch out for:**
- Seniors 60+ have no gross income limit but must pass net income test—many miss deductions like medical >$35, shelter up to $744, boosting eligibility[1][6][7].
- All income counts (SS, VA, pensions); household includes food-sharers[3][6].
- Recent 2025 ABAWD changes extend work rules to under 65 (exempts 65+ and caregivers)[2][5][9].
- No asset test for elderly/disabled, but verify exemptions (home/car ok)[8].
- Utility allowances inflation-adjusted; check current[1].

**Data shape:** Elderly/disabled households exempt from gross income and asset tests, net only; benefits calculated via 30% net income rule from max allotment; scales by household size; statewide with local offices.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/humanservices/for-families/supplemental-nutrition-assistance-program-snap.html[10]

---

### Tennessee LIHEAP


**Eligibility:**
- Income: Income eligibility varies by source and year: at or below 150% of U.S. Poverty Guidelines (e.g., older data: 1-person $17,505/year; 2 $23,595; 3 $29,685; 4 $35,775; 5 $41,865; 6 $47,955) or 60% of State Median Income (check current chart at local agency). Recent monthly gross income limits: 1-person $2,671; 2 $3,492; 3 $4,314; 4 $5,136; 5 $5,958; 6 $6,780. Automatic eligibility if receiving SNAP, SSI, TANF, or certain Veterans benefits.[1][2][4][5]
- Assets: No asset limit applies.[1]
- Must meet both income eligibility and priority points (targets elderly, disabled, households with children under 6); live in service area of local agency; anyone can apply but prioritized based on need (e.g., shut-off, emergency).[2][3]

**Benefits:** One-time payment to utility company for heating/cooling: Regular $174-$750 (varies by energy burden); max heating/cooling $1,000, min $600; crisis max $1,000; older summer cooling max $325, heating/emergency $250. Available once per year from up to two of three programs (regular, crisis, summer).[1][4][5]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online via SmartSimple starting November 1, 2025 at 8:00am CST (thda.org link); contact local agency for phone/in-person/mail (e.g., ETHRA crisis: Anderson 865-691-2551, Campbell 423-562-2948, etc.); find local agency at THDA LIHEAP contacts PDF.[3][4]

**Timeline:** Not specified; placed on waitlist until funds available.
**Waitlist:** Yes, eligible applicants waitlisted until federal funds released (e.g., 2026 funding pending); crisis prioritized.[3]

**Watch out for:**
- Funding not guaranteed (e.g., federal delays cause waitlists/no awards); must meet both income AND priority points; benefits one-time only; older vs. current income limits conflict (verify with local agency); crisis prioritized over regular; applies Nov-May typically.[1][2][3][4]

**Data shape:** Administered statewide via 19 regional agencies with varying providers, waitlists, and benefit calculations by energy burden/household; priority points system beyond income; federal funding delays common; income at 60% SMI or 150% FPG per source.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://thda.org/help-for-homeowners/low-income-home-energy-assistance-program-liheap/

---

### Tennessee State Health Insurance Assistance Program (TN SHIP)


**Eligibility:**
- Age: 65 or older, OR any age if on Medicare due to disability[6]+
- Income: Not specified in available sources. The program serves 'people with limited incomes'[2] but specific dollar thresholds are not provided in search results.
- Assets: Not specified in available sources.
- Must be Medicare-eligible[6]
- Anyone with questions about healthcare benefits can reach out, but primary focus is Medicare-eligible individuals[6]

**Benefits:** Free, unbiased one-on-one counseling and education; no direct financial payments from this program, though counselors help beneficiaries apply for programs that DO pay (Medicare Savings Plans, Extra Help/Low Income Subsidy, Medicaid)[2][4]
- Varies by: not_applicable — counseling is free regardless of income or household size, though eligibility for programs SHIP helps with (like Medicare Savings Plans) may vary

**How to apply:**
- Phone: 1-877-801-0044 (toll-free statewide)[3][4][8]
- Phone: 1-800-848-0299 (TTY)[8]
- Email: dda.ship@tn.gov[4]
- Online form: Available on state website[4]
- In-person: Through nine regional SHIP offices across Tennessee[3]
- Text: (931) 345-3635 (Upper Cumberland region)[7]
- Local phone numbers vary by region (e.g., Shelby County: 901-222-4111)[3]

**Timeline:** Not specified in available sources. Described as 'local, in-depth' counseling but no timeline provided.
**Waitlist:** Not mentioned in available sources.

**Watch out for:**
- This is NOT a financial assistance program — it provides counseling only. Families expecting direct payment for premiums should know SHIP helps you APPLY for programs that pay (Medicare Savings Plans, Extra Help), but SHIP itself doesn't pay[2][4]
- SHIP does not sell insurance or endorse any insurance company — it is unbiased, which is valuable but means it won't recommend a specific plan[9]
- If someone is on an ACA Marketplace plan when they become Medicare-eligible, they MUST disenroll from the Marketplace plan or face penalties — SHIP can help with this transition[4]
- Medicare Open Enrollment Period ends December 7th annually — timing matters for plan changes[4]
- Translation services are available in multiple languages at some regional offices[7]
- The program also offers Senior Medicare Patrol (SMP) services to help detect and report Medicare fraud — this is a separate but related service[2][9]
- Volunteer opportunities exist if families want to help others while learning the program[4][6]
- No income or asset limits are specified in public materials — eligibility appears to be based solely on Medicare status and age/disability, not means-testing

**Data shape:** TN SHIP is a counseling and advocacy program, not a financial assistance program. It operates through nine regional offices with local phone numbers but a unified statewide toll-free line. The program's primary value is helping beneficiaries navigate complex Medicare options and apply for separate income-based programs (Medicare Savings Plans, Extra Help). No income limits, asset limits, or processing times are publicly specified. Eligibility is straightforward: Medicare-eligible individuals age 65+ or any age if on Medicare due to disability. The program is federally funded but administered by the Tennessee Commission on Aging and Disability.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html[4]

---

### Tennessee Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or asset limits apply statewide; income is not a factor in determining meal eligibility[5][6].
- Assets: No asset limits; no information on what counts or exemptions as none are required[6].
- Homebound due to illness, incapacitation, disability, or inability to prepare nutritious meals[2][4][6][8]
- Assessed by local Area Agency on Aging and Disability (AAAD) via intake assessment[1][6]
- For congregate meals: available to anyone 60+ and spouses (under 60 ok), at senior centers or sites[2][6]
- Some regions allow 18-59 with mental/physical challenge[1]
- Disabled under 60 only if in senior high-rise for congregate[2]

**Benefits:** Home-delivered nutritionally balanced noon meal (1/3 RDA daily nutrition), Monday-Friday; friendly visit and safety check by volunteers; congregate meals at 150+ sites with socialization and nutrition education[1][6][7][8]
- Varies by: region

**How to apply:**
- Phone: Statewide toll-free 1-866-836-6678 or 1-800-836-6678 to contact local AAAD[6][7]
- Regional phones: e.g., Northeast TN 423-928-3258[1], Knox County 865-524-2786[8], Nashville local AAAD[2]
- Online: tnpathfinder.org screening tool[7]; mealsonwheelsamerica.org provider search[3]
- In-person: Local senior centers or AAAD offices (e.g., Clinchfield Senior Center 423-743-4521)[1]

**Timeline:** Varies; Knox County MAMS starts in 2-3 business days, others via assessment (no statewide time specified)[8]
**Waitlist:** Not mentioned in sources; contact local provider for availability[3]

**Watch out for:**
- Not a single centralized 'Tennessee Meals on Wheels'—decentralized by local AAAD/provider; must contact local office for exact rules[1][2][6]
- Requires AAAD assessment for home delivery; not automatic[1][6]
- Meals often by suggested donation (free for most but confirm locally); paid options like Knox MAMS exist[3][6][8]
- Congregate vs. home-delivered have different criteria[2][6]
- Spouses under 60 ok for congregate but home delivery typically 60+[2][6]

**Data shape:** Decentralized by 95 counties via local AAADs with regional providers; no income/asset test statewide; assessment-based eligibility varies slightly by region (e.g., younger disabled in some areas)[1][2][6]

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/aging-nutrition-program.html[6]

---

### National Family Caregiver Support Program (NFCSP)


**Eligibility:**
- Age: Caregiver must be 55+ (with exceptions); Care Recipient varies by category+
- Income: If care recipient income is at or above 185% of Federal Poverty Guidelines, contributions will be encouraged based on actual cost of services. No specific dollar amounts provided in search results.
- Caregiver must be family member or informal caregiver (not paid professional)
- Care recipient must reside in the community
- As of 2024 OAA final rule, service providers have discretion to define 'adults' to include people under 18 in certain circumstances

**Benefits:** Up to 6 hours per week in-home respite care; other services availability varies by service area
- Varies by: region

**How to apply:**
- Phone: Call Area Agency on Aging and Disability (AAAD) Intake Line at 1-866-836-6678
- In-person: Contact local Area Agency on Aging and Disability

**Timeline:** Not specified in search results; timeline begins after phone intake assessment
**Waitlist:** Slots may not be available; preference given to persons with greatest economic and social needs as defined by Older Americans Act

**Watch out for:**
- This is the NATIONAL program, not a Tennessee-specific program — it's administered through Tennessee's Area Agencies on Aging and Disability but follows federal Older Americans Act guidelines
- Availability of services varies significantly by region — respite care is guaranteed up to 6 hours/week, but other services (counseling, training, daycare) depend on local resources
- Income-based sliding scale: If care recipient income exceeds 185% of Federal Poverty Guidelines, families will be asked to contribute; no income exemption for low-income families
- Waitlist exists: Even if eligible, services may not be available immediately; preference goes to those with greatest economic and social needs
- Caregiver must be family member or informal caregiver — paid professional caregivers do not qualify
- For child caregiving: Grandparents/relatives (not parents) age 55+ can access services for minor children; parents caring for children do not qualify under this program
- For adult disability caregiving: Only relatives age 55+ caring for adults 18-59 with disabilities qualify; younger caregivers do not qualify
- The care recipient's functional status is what matters: Must have ADL limitations or cognitive impairment requiring supervision; diagnosis alone is insufficient
- This program provides support services, not direct financial payments to caregivers — it's not a paid caregiver employment program

**Data shape:** NFCSP is a service-based program, not a cash assistance program. Eligibility is determined by care recipient's functional limitations and age/condition, not caregiver income. Services are means-tested for contributions only if care recipient income exceeds 185% FPG. Regional variation is significant — service availability depends on local AAAD resources and priorities. No specific processing timeline provided; waitlist depends on local slot availability and priority scoring. This is distinct from other Tennessee programs like CHOICES Waiver (Medicaid) or Family Support Program, which have different eligibility and funding structures.

**Our model can't capture:**
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/caregiving.html

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at no more than 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; families must contact local providers to verify current thresholds based on HHS Poverty Guidelines (e.g., for 2025, 125% for 1-person household is approximately $19,563; for 2-person $26,397—confirm with provider as not specified in sources).[1][2][4]
- Assets: No asset limits mentioned in program sources.
- Legal resident of Tennessee
- Unemployed
- Must live in a county served by a local provider

**Benefits:** Part-time community service work experience (e.g., teacher's aides, nurse's aides, library clerks, day care assistance, maintenance) averaging 20 hours per week at minimum wage (federal/state/local highest rate, e.g., $7.25/hour in some areas); includes assessments, skill upgrading, job counseling, job placement assistance; typically lasts about 6 months before transition to unsubsidized employment.[1][2][4][6]
- Varies by: priority_tier

**How to apply:**
- Phone or email regional coordinators (e.g., Jeremiah Muhammad at jmuhammad@greatermemworkforce.com for Shelby/Fayette/Tipton/Lauderdale; Britney Bartholomew at 731-587-4213 ext. 234 or britney.bartholomew@nwthra.org for NW TN; Renae Hawkins at 865-691-2551 ext. 4347 or rhawkins@ethra.org for East TN; statewide info Jeff.Hughes@tn.gov or (731) 989-5111/(800) 372-6013).[1][2][6]
- In-person: Schedule appointment at local offices (e.g., 1350 Concourse Ave., Memphis; 124 Weldon Drive, Martin; 9111 Crosspark Drive, Knoxville)
- No specific online application or mail mentioned; start by contacting coordinators

**Timeline:** Not specified; involves assessment and placement upon eligibility determination.
**Waitlist:** Possible waitlist in some areas; contact local provider to check availability or be placed on list.[6]

**Watch out for:**
- Not available statewide—must confirm county coverage with local provider; many areas have limited openings.
- Priority enrollment for veterans/qualified spouses, those 65+, low literacy, homelessness risk, low employment prospects, or prior incarceration—others may face waitlists.[2]
- Temporary (typically 6 months) part-time subsidized work aimed at unsubsidized job placement, not long-term employment or full benefits.
- Income limit is strict at 125% FPL for total family income; no asset test but full verification required.
- Must be unemployed at enrollment; focuses on skill-building in community service roles, not guaranteed preferred job type.

**Data shape:** Regionally administered by multiple local workforce/human resource agencies with county-specific coverage and contacts; priority tiers affect access; income test at 125% FPL without published dollar table in sources (requires provider verification); part-time hours/wage fixed federally but local minimum wage applies.

**Source:** https://www.tn.gov/workforce/jobs-and-education/services-by-group/services-by-group-redirect/senior-work-experience-program.html

---

### Tennessee Senior Law Alliance (TSLA) / Tennessee Senior Legal Helpline


**Eligibility:**
- Age: 60+
- Income: Not specified in available sources — described as available 'regardless of your income or assets'[7]
- Assets: Not specified in available sources — described as available 'regardless of your income or assets'[7]
- Must be a resident of Tennessee[1]
- For in-person appointments with Legal Assistance for the Elderly (East Tennessee), must personally contact the program office and request legal help before appointments will be set[3]

**Benefits:** Free legal services including: referrals, brief legal advice, full legal representation, estate planning, document drafting (wills, advance directives, powers of attorney), assistance with wrongfully reduced/denied benefits and healthcare access, housing issues, abuse and exploitation cases, consumer problems[1][3][7]
- Varies by: not_applicable — all services provided at no cost to qualifying seniors[3]

**How to apply:**
- Phone: 1-844-HELP4TN (1-844-435-7486) — statewide toll-free helpline[1][7][9]
- Phone: 1-800-238-1443 — Legal Aid Society of Middle TN and The Cumberlands (for Middle Tennessee)[2]
- Phone: (865) 691-2551 ext 4212 — Legal Assistance for the Elderly Program (East Tennessee)[3]
- In-person: Contact local legal aid provider or senior center[2][3]
- Website: www.TALS.org (Tennessee Alliance for Legal Services)[1]
- Website: www.WTLS.org (West Tennessee Legal Services)[1]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- No income or asset test is applied — eligibility is based solely on age (60+) and residency, making this unusually accessible[7]
- The program is delivered through multiple providers with different contact numbers by region — calling the statewide helpline (844-HELP4TN) is the simplest entry point[1][7]
- For East Tennessee's Legal Assistance for the Elderly Program, seniors must personally contact the office to request help before in-person appointments are scheduled[3]
- Program funding comes from a court settlement providing $5.5 million over three years — long-term sustainability beyond this period is not addressed in available sources
- Specific processing times, waitlists, and required documentation are not disclosed in available sources — families should ask when they call

**Data shape:** This is a coordinated statewide network (TSLA) rather than a single program with uniform rules. It operates through four regional legal aid providers, each with separate contact information. The statewide helpline (844-HELP4TN) serves as the primary entry point. No income or asset limits are applied, making this unusual among legal aid programs. Services are entirely free with no cost to clients, though donations are accepted. The program is funded by a specific court settlement, which creates potential sustainability questions.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tals.org/page/453/free-senior-legal-helpline and https://las.org/tennessee-senior-law-alliance/

---

### Tennessee Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits or financial restrictions apply[3][4][6]
- Assets: No asset limits apply
- Must be a resident of a certified long-term care facility (nursing homes, assisted living facilities, homes for the aged, adult care homes), or family/friend acting on behalf of such a resident[1][3][4][5][6][7]

**Benefits:** Advocacy to identify, investigate, and resolve complaints; provide information on rights, admission processes, long-term services; ensure access to care quality improvements; represent interests before agencies; educate on resident rights including courtesy, private visits, no wrongful transfer/discharge, freedom from abuse[1][3][4][5][6][7]

**How to apply:**
- Statewide toll-free phone: 877-236-0013 (routes to district ombudsman)[4]
- Find district ombudsman via https://www.tn.gov/disability-and-aging/disability-aging-programs/long-term-care-ombudsman/district-long-term-care-ombudsman.html[4][8]
- Email for volunteer info: teresa.teeple@tn.gov (not primary for complaints)[4]
- Regional examples: East TN (ETHRA) phone (865) 691-2551 Ext. 4223 or tkahler@ethra.org[1]; First TN (FTAAAD) phone 423-979-2599[3]

**Timeline:** Not specified in available data

**Watch out for:**
- Not a direct service provider (e.g., no healthcare or financial aid)—purely advocacy and complaint resolution[1][4][5][7]
- Must contact specific district ombudsman for your county, not statewide directly (use toll-free or district finder)[1][3][4][8]
- Families can contact on behalf of residents, but services are facility-resident focused[3][4][7]
- Volunteers extend reach but core staff are limited (17.5 FTE across state)[5]

**Data shape:** no income/asset test; district-based with county-specific offices; advocacy-only, not benefits/services program

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/long-term-care-ombudsman.html[4]

---

### OPTIONS for Community Living

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limit; if income exceeds Federal Poverty Guidelines, a cost share is required. (Note: This program is not Medicaid-funded like CHOICES; income affects cost-sharing only.)[4]
- Assets: No asset limits mentioned.[4]
- Tennessee resident aged 60+ requiring assistance with at least 3 Activities of Daily Living (ADLs) or Instrumental Activities of Daily Living (IADLs), such as mobility, toiletry, hygiene, dressing, light housekeeping, cooking, shopping, bathing, walking without assistance.[2][4][8]
- Assistance certified by a medical professional.[2]
- For ages 18-60, must be disabled as determined by Social Security (though program targets elderly).[2]

**Benefits:** Light housekeeping, assistance with bathing, home delivered meals, case management.[4]
- Varies by: physical_need|income_for_cost_share

**How to apply:**
- Phone: Call FTAAAD Information and Assistance line at 1-866-836-6678 for screening and application.[2][4]
- In-person or mail: Contact local Area Agency on Aging and Disability (AAAD); have intake form ready.[4]

**Timeline:** Intake screening by phone; if eligible and slot available, case manager conducts in-home assessment to set up services. Exact timeline not specified.[4]
**Waitlist:** Waiting lists have existed in past years; prioritization based on income and physical need. May qualify but wait for slot.[2]

**Watch out for:**
- Not Medicaid/TennCare CHOICES (which has strict income/asset limits, NFLOC requirement); OPTIONS is state-funded via AAADs with no income cap but cost-share over poverty level.[2][4]
- Waitlists common; prioritized by need/income, so eligible applicants may wait despite qualifying.[2]
- Must contact specific AAAD for region; not uniform statewide access.[4]
- Needs at least 3 ADLs/IADLs; recent health decline/hospitalization may qualify for re-screening.[2]

**Data shape:** Regional AAAD administration with county-specific providers; no income/asset test but cost-share over FPG; waitlist prioritization by need; distinct from Medicaid CHOICES program.

**Source:** https://www.ftaaad.org/options-subpage (FTAAAD, Tennessee Commission on Aging and Disability-funded)[2]

---

### Senior Advocate Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific statewide income limits identified; local programs like McMinn Senior Activity Center target economically disadvantaged older adults who do not qualify for other assistance due to financial reasons or age restrictions[5]. Legal assistance programs for elderly (60+) have general requirements that may be waived, with priority for urgent cases[3].
- Assets: No specific asset limits identified in search results for this program[5].
- Must be 60 years or older[3][5]
- Personally contact program office for legal help (may be waived in emergencies)[3]
- Priority for cases risking harm or death if not addressed promptly; other cases on first-come, first-served basis as capacity allows[3]
- Economically disadvantaged and falling into gaps of other programs (e.g., food insecurity, safety, home repairs)[5]

**Benefits:** Dedicated staff helps navigate red tape, access resources for food insecurity, safety, and home repairs; fills up to 25% of financial needs not covered by other programs; legal assistance and referrals for those 60+; partnerships with housing authority, VA, AARP, SHIP, Social Security[3][5]
- Varies by: region

**How to apply:**
- Phone for East Tennessee Legal Assistance: (865) 691-2551 ext 4212 (Baily Bowers) or ext 4216 (Aaron Bradley)[3]
- Email: bbowers@ethra.org or abradley@ethra.org[3]
- Mail donations or inquiries to ETHRA Attn: Baily Bowers, 9111 Cross Park Drive Ste. D-100, Knoxville, TN 37923[3]
- Contact local senior centers like McMinn Senior Activity Center in Athens, TN for grassroots advocacy (no specific phone/URL in results)[5]

**Timeline:** Priority cases given immediate attention; others first-come, first-served as capacity allows; no specific statewide timeline[3]
**Waitlist:** Yes, when caseload reaches maximum; option to join waiting list or get referrals[3]

**Watch out for:**
- Not a formal statewide program with uniform rules; highly local and capacity-limited, leading to waitlists[3][5]
- Only 3 dedicated programs in TN, may not be available everywhere[5]
- Targets gaps in other services—won't duplicate existing aid; applicants often don't qualify elsewhere first[5]
- Legal programs require personal contact before harm occurs; donations expected but not mandatory[3]
- Confused with general senior legal aid or TennCare CHOICES (which has strict income/asset limits)[2]

**Data shape:** Local/grassroots model via senior centers and AAADs, not statewide uniform; only 3 dedicated in TN with regional providers; no fixed income/asset tests, focuses on service gaps and capacity limits

**Source:** No single primary .gov URL identified; related info at tn.gov/disability-and-aging[7]; ETHRA program page: www.ethra.org/programs/21/legal-assistance-for-the-elderly[3]

---

### Tennessee State Health Insurance Assistance Program (TN SHIP) and Senior Medicare Patrol (SMP)


**Eligibility:**
- Age: 65+
- Income: No income limits; open to anyone with Medicare questions, focused on Medicare-eligible individuals 65+ or under 65 due to disability[2][3][6]
- Assets: No asset limits mentioned; assistance available for low-income programs like Extra Help without SHIP eligibility barriers[3][5]
- Medicare beneficiary or family/caregiver
- Tennessee resident
- No promotion of specific insurance; unbiased service[2][4][6]

**Benefits:** Free one-on-one counseling on Medicare enrollment, Part D/Advantage comparisons, eligibility, coverage, rights, appeals; assistance with Medicare Savings Programs/Extra Help applications; fraud prevention/education/reporting via SMP; group presentations, health fairs[2][3][4][5][6]

**How to apply:**
- Phone: 1-877-801-0044 (SHIP statewide toll-free, routes to local); 1-866-836-7677 (SMP statewide)[4][5][6][7]
- Email: dda.ship@tn.gov (SHIP); ship@ucdd.org (some regions)[5][6]
- Website: www.tnmedicarehelp.com (general); tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html (contact form)[5][6][7]
- Local offices via 9 Area Agencies on Aging and Disability (AAAD), e.g., Shelby County: 901-222-4111 or 877-801-0044; Upper Cumberland: 931-432-4150[4][5]

**Timeline:** Immediate phone counseling; plan comparisons may take days (e.g., during Open Enrollment)[6]

**Watch out for:**
- Not a healthcare provider—only counseling/education, no direct financial aid or medical services[2][6]
- Must disenroll from ACA Marketplace upon Medicare eligibility to avoid penalties[6]
- During Open Enrollment (Oct 15-Dec 7), high demand may delay plan comparisons—call Medicare 1-800-MEDICARE for immediate needs[6]
- SMP focuses on fraud prevention/reporting, separate but complementary to SHIP[1][4][7]
- Volunteers provide much service; training available but not required to receive help[3][6]

**Data shape:** No income/asset test for core counseling; delivered via 9 regional AAADs with local access points; pairs SHIP counseling with SMP fraud focus; open to all Medicare-related questions

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tn.gov/disability-and-aging/disability-aging-programs/tn-ship.html

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| TennCare Medicare Savings Programs (QMB, | benefit | federal | medium |
| Tennessee SNAP | benefit | federal | deep |
| Tennessee LIHEAP | benefit | federal | medium |
| Tennessee State Health Insurance Assista | navigator | federal | simple |
| Tennessee Meals on Wheels | benefit | federal | deep |
| National Family Caregiver Support Progra | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Tennessee Senior Law Alliance (TSLA) / T | resource | state | simple |
| Tennessee Long-Term Care Ombudsman Progr | resource | federal | simple |
| OPTIONS for Community Living | benefit | local | medium |
| Senior Advocate Program | resource | local | simple |
| Tennessee State Health Insurance Assista | benefit | federal | medium |

**Types:** {"benefit":7,"navigator":1,"employment":1,"resource":3}
**Scopes:** {"federal":8,"state":2,"local":2}
**Complexity:** {"medium":5,"deep":3,"simple":4}

## Content Drafts

Generated 6 page drafts. Review in admin dashboard or `data/pipeline/TN/drafts.json`.

- **Tennessee Meals on Wheels** (benefit) — 2 content sections, 6 FAQs
- **National Family Caregiver Support Program (NFCSP)** (benefit) — 2 content sections, 6 FAQs
- **Tennessee Senior Law Alliance (TSLA) / Tennessee Senior Legal Helpline** (resource) — 2 content sections, 6 FAQs
- **Tennessee Long-Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs
- **Senior Advocate Program** (resource) — 3 content sections, 6 FAQs
- **Tennessee State Health Insurance Assistance Program (TN SHIP) and Senior Medicare Patrol (SMP)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable — counseling is free regardless of income or household size, though eligibility for programs SHIP helps with (like Medicare Savings Plans) may vary**: 1 programs
- **region**: 3 programs
- **priority_tier**: 1 programs
- **not_applicable — all services provided at no cost to qualifying seniors[3]**: 1 programs
- **not_applicable**: 2 programs
- **physical_need|income_for_cost_share**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **TennCare Medicare Savings Programs (QMB, SLMB, QI)**: This program consists of three distinct tiers (QMB, SLMB, QI-1) with progressively higher income thresholds but decreasing benefit comprehensiveness. QMB is mandatory for states; SLMB and QI-1 are optional but Tennessee offers them. QI-1 has unique constraints: first-come, first-served funding model, annual reapplication requirement, and exclusion for CHOICES recipients and those already on TennCare Medicaid. Income and asset limits are indexed to Federal Poverty Level and change annually. Specific application procedures, processing timelines, required forms, and regional office locations are not detailed in available search results and require direct contact with TennCare.
- **Tennessee SNAP**: Elderly/disabled households exempt from gross income and asset tests, net only; benefits calculated via 30% net income rule from max allotment; scales by household size; statewide with local offices.
- **Tennessee LIHEAP**: Administered statewide via 19 regional agencies with varying providers, waitlists, and benefit calculations by energy burden/household; priority points system beyond income; federal funding delays common; income at 60% SMI or 150% FPG per source.
- **Tennessee State Health Insurance Assistance Program (TN SHIP)**: TN SHIP is a counseling and advocacy program, not a financial assistance program. It operates through nine regional offices with local phone numbers but a unified statewide toll-free line. The program's primary value is helping beneficiaries navigate complex Medicare options and apply for separate income-based programs (Medicare Savings Plans, Extra Help). No income limits, asset limits, or processing times are publicly specified. Eligibility is straightforward: Medicare-eligible individuals age 65+ or any age if on Medicare due to disability. The program is federally funded but administered by the Tennessee Commission on Aging and Disability.
- **Tennessee Meals on Wheels**: Decentralized by 95 counties via local AAADs with regional providers; no income/asset test statewide; assessment-based eligibility varies slightly by region (e.g., younger disabled in some areas)[1][2][6]
- **National Family Caregiver Support Program (NFCSP)**: NFCSP is a service-based program, not a cash assistance program. Eligibility is determined by care recipient's functional limitations and age/condition, not caregiver income. Services are means-tested for contributions only if care recipient income exceeds 185% FPG. Regional variation is significant — service availability depends on local AAAD resources and priorities. No specific processing timeline provided; waitlist depends on local slot availability and priority scoring. This is distinct from other Tennessee programs like CHOICES Waiver (Medicaid) or Family Support Program, which have different eligibility and funding structures.
- **Senior Community Service Employment Program (SCSEP)**: Regionally administered by multiple local workforce/human resource agencies with county-specific coverage and contacts; priority tiers affect access; income test at 125% FPL without published dollar table in sources (requires provider verification); part-time hours/wage fixed federally but local minimum wage applies.
- **Tennessee Senior Law Alliance (TSLA) / Tennessee Senior Legal Helpline**: This is a coordinated statewide network (TSLA) rather than a single program with uniform rules. It operates through four regional legal aid providers, each with separate contact information. The statewide helpline (844-HELP4TN) serves as the primary entry point. No income or asset limits are applied, making this unusual among legal aid programs. Services are entirely free with no cost to clients, though donations are accepted. The program is funded by a specific court settlement, which creates potential sustainability questions.
- **Tennessee Long-Term Care Ombudsman Program**: no income/asset test; district-based with county-specific offices; advocacy-only, not benefits/services program
- **OPTIONS for Community Living**: Regional AAAD administration with county-specific providers; no income/asset test but cost-share over FPG; waitlist prioritization by need; distinct from Medicaid CHOICES program.
- **Senior Advocate Program**: Local/grassroots model via senior centers and AAADs, not statewide uniform; only 3 dedicated in TN with regional providers; no fixed income/asset tests, focuses on service gaps and capacity limits
- **Tennessee State Health Insurance Assistance Program (TN SHIP) and Senior Medicare Patrol (SMP)**: No income/asset test for core counseling; delivered via 9 regional AAADs with local access points; pairs SHIP counseling with SMP fraud focus; open to all Medicare-related questions

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Tennessee?
