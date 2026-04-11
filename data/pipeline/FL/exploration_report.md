# Florida Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 1.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 16 |
| New (not in our data) | 11 |
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

- **service**: 7 programs
- **financial**: 5 programs
- **in_kind**: 1 programs
- **advocacy**: 2 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Statewide Medicaid Managed Care Long Term Care Program

- **min_age**: Ours says `65` → Source says `65 or older, or 18 and older if disabled` ([source](https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) and institutional care including: Adult Day Care, Home-Delivered Meals, Hospice Care, Medical Supplies and Equipment, Medication Administration & Management, Nursing Home Care, Intermittent/Skilled Nursing Services, Nutritional Assessment & Risk Reduction, Personal Care Services (non-medical assistance with hygiene, toileting, meals, housework), Personal Emergency Response System (PERS), Respite Care (in-home/out-of-home), Therapies (occupational, physical, respiratory, speech), Non-Emergency Transportation; services based on medical necessity to delay/prevent nursing home placement; delivered via single Managed Care Organization (MCO) plan; some non-medical benefits like personal care can be consumer-directed (hire own providers including family)` ([source](https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program))
- **source_url**: Ours says `MISSING` → Source says `https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program`

### Medicare Savings Programs (MSP)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Varies by program. QMB provides the most comprehensive coverage (all premiums and cost-sharing). SLMB and QI cover Part B premium only. Specific dollar amounts depend on current Medicare premiums and individual cost-sharing amounts.[1][2]` ([source](https://www.myflfamilies.com (Florida Department of Children & Families) and https://www.medicare.gov/basics/costs/help/medicare-savings-programs))
- **source_url**: Ours says `MISSING` → Source says `https://www.myflfamilies.com (Florida Department of Children & Families) and https://www.medicare.gov/basics/costs/help/medicare-savings-programs`

### SHINE (Serving Health Insurance Needs of Elders)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, unbiased, confidential one-on-one counseling on Medicare eligibility/enrollment/coverage, health plan choices, appeals, Medigap, long-term care insurance, prescription assistance, Extra Help/Low-Income Subsidy, Medicare Savings Programs, fraud prevention; educational presentations and community events.[3][5][6]` ([source](https://www.floridashine.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.floridashine.org`

### Home-Delivered Meals

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritious home-delivered meals (e.g., 5-10 meals per authorization for Medicaid; medically tailored options; post-discharge unlimited with prior auth; disaster relief 1x/year). Meals priced at $9.49 or less if not qualifying for free/low-cost.` ([source](https://elderaffairs.org/programs-and-services/food-assistance/))
- **source_url**: Ours says `MISSING` → Source says `https://elderaffairs.org/programs-and-services/food-assistance/`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free, confidential advocacy services including identifying, investigating, and resolving complaints on behalf of residents; visiting facilities to monitor conditions and support residents; providing information on nursing homes; assisting with issues like relocations, rights violations, and fair treatment; proactive problem prevention.` ([source](https://elderaffairs.org/programs-and-services/long-term-care-ombudsman-program/))
- **source_url**: Ours says `MISSING` → Source says `https://elderaffairs.org/programs-and-services/long-term-care-ombudsman-program/`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://ahca.myflorida.com/medicaid/medicaid-policy-quality-and-operations/medicaid-policy-and-quality/medicaid-policy/federal-authorities/federal-waivers/program-of-all-inclusive-care-for-the-elderly))
  - Shape notes: County-restricted (primarily Miami-Dade/Broward); no direct income/asset limits for PACE but tied to Medicaid financials; no waitlist but 1-3 month processing; provider-specific enrollment processes; customized interdisciplinary care plans rather than fixed hours/dollars
- **SNAP Food Assistance** — in_kind ([source](https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap and https://elderaffairs.org/programs-and-services/food-assistance/))
  - Shape notes: SNAP benefits scale by household size. Seniors 60+ have special eligibility rules that are more favorable than general SNAP rules (net income only, higher asset limits). The program is statewide but administered by county DCF offices with potential local variations. Benefits are provided via EBT card and calculated as a percentage of household income. The search results do not provide specific dollar amounts for income limits or maximum allotments for Florida; these must be obtained directly from Florida DCF or USDA FNS for the current benefit year (Oct. 1, 2025–Sept. 30, 2026).
- **Florida Emergency Home Energy Assistance Program (EHEAP)** — financial ([source](No single statewide .gov; local e.g., https://hcfl.gov/residents/seniors/senior-and-caregiver-services/emergency-home-energy-assistance-program[2]))
  - Shape notes: County-administered with varying income limits, providers, and document rules; requires energy crisis verification; elderly-focused subset of broader LIHEAP
- **Respite for Elders Living in Everyday Families (RELIEF)** — service ([source](No official .gov URL identified in search results for RELIEF.))
  - Shape notes: No data available; program not found in Florida-specific search results which focus on DCF economic self-sufficiency programs (TCA, SNAP) rather than elder respite services.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://elderaffairs.org/programs-and-services/senior-community-service-employment-program-scsep/))
  - Shape notes: Multiple regional grantees/providers; priority enrollment tiers; income at 125% poverty scales by household size; no fixed asset test; part-time hours/wage tied to local minimums
- **Home Care for the Elderly** — service ([source](https://www.agingcarefl.org/uploads/1/3/6/5/136526411/2020-chapter-6-home-care-for-the-elderly-program.pdf))
  - Shape notes: Tied to ICP Medicaid limits and requires dedicated live-in caregiver; functional eligibility via 701B nursing home risk assessment; statewide but locally administered.
- **Optional State Supplementation (OSS)** — financial ([source](https://www.flrules.org/gateway/RuleNo.asp?id=65A-2.032 (Fla. Admin. Code Ann. R. 65A-2.032); https://www.myflfamilies.com/service-programs/access/ (DCF ACCESS Florida)))
  - Shape notes: Facility-restricted to assisted living/adult family care/mental health residential; payment calculated as provider rate + personal needs allowance minus countable income; scales by facility type and couple status; state-funded supplement to SSI.
- **Homestead Exemption for Seniors** — financial ([source](https://floridarevenue.com/property/Documents/pt110.pdf))
  - Shape notes: Income limit fixed per household (not scaled by size), set annually by FL DOR; county-specific variations in thresholds, residency tiers, and tax applicability; requires base homestead exemption
- **Florida Discount Drug Card Program** — financial ([source](https://www.floridashine.org/getattachment/Resources/ResourceLinks/BPrescripAsstOptions.pdf.aspx (SHINE program reference)[5]))
  - Shape notes: no income test; completely open eligibility; instant no-form access; nationwide pharmacy network but Florida-focused
- **Alzheimer's Disease Initiative (ADI)** — service ([source](https://elderaffairs.org/programs-services/alzheimers-disease-initiative/ (inferred from DOEA context; primary docs via agingcarefl.org or elderaffairs.org)[1]))
  - Shape notes: Administered regionally via 11 AAAs and 17 Memory Disorder Clinics in 13 areas; needs-based services authorized after assessment; no fixed income/asset tests statewide, diagnosis-driven with funding constraints
- **RELIEF Program (Respite for Elders Living in Everyday Families)** — service ([source](https://elderaffairs.org/programs-and-services/respite-for-elders-living-in-everyday-families-relief/[5]))
  - Shape notes: Volunteer-based with local administration through 11 AAAs/ADRCs; no published income/asset tables or fixed hours guarantee; free service focused on evenings/weekends expansion[5][6]

## Program Details

### Statewide Medicaid Managed Care Long Term Care Program


**Eligibility:**
- Age: 65 or older, or 18 and older if disabled+
- Income: Determined by Department of Children and Families (DCF) for Medicaid eligibility; specific dollar amounts and household size variations follow standard Florida Medicaid thresholds (e.g., for Aged/Disabled: 88% of Federal Poverty Level for individual, higher for households; consult DCF for current table as not specified in sources)
- Assets: Standard Medicaid asset limits apply (typically $2,000 for individual; primary home, one vehicle, personal belongings, and certain prepaid funeral expenses often exempt; full details via DCF financial eligibility determination)
- Must be eligible for Medicaid financially via DCF
- Must require Nursing Facility Level of Care (NFLOC) as determined by Comprehensive Assessment and Review for Long-Term Care Services (CARES) unit at Department of Elder Affairs (DOEA)
- Meet one or more established clinical criteria via CARES assessment using AHCA Form 5000-3008

**Benefits:** Home and Community-Based Services (HCBS) and institutional care including: Adult Day Care, Home-Delivered Meals, Hospice Care, Medical Supplies and Equipment, Medication Administration & Management, Nursing Home Care, Intermittent/Skilled Nursing Services, Nutritional Assessment & Risk Reduction, Personal Care Services (non-medical assistance with hygiene, toileting, meals, housework), Personal Emergency Response System (PERS), Respite Care (in-home/out-of-home), Therapies (occupational, physical, respiratory, speech), Non-Emergency Transportation; services based on medical necessity to delay/prevent nursing home placement; delivered via single Managed Care Organization (MCO) plan; some non-medical benefits like personal care can be consumer-directed (hire own providers including family)
- Varies by: individual_needs|medical_necessity

**How to apply:**
- Screening via Aging and Disability Resource Center (ADRC); find ADRCs on Florida DOEA website or call Elder Helpline 1-800-96-ELDER (1-800-963-5337)
- Financial eligibility via Department of Children and Families (DCF)
- Medical eligibility via DOEA CARES unit
- Enrollment in LTC plan via AHCA and enrollment broker after eligibility

**Timeline:** Not specified; involves multi-step process with screening, assessment, and enrollment
**Waitlist:** Possible wait list release step prior to CARES assessment

**Watch out for:**
- Multi-agency process: DCF (financial), DOEA/CARES (medical/NFLOC), AHCA (enrollment in MCO plan); delays if any step fails
- Services based on assessed need, not all available immediately (unlike some programs like Nursing Home Medicaid)
- No coverage for room and board in community settings like assisted living
- Must choose LTC MCO plan; integrates with other SMMC components (MMA, Dental) but LTC-specific
- Consumer-directed options allow hiring family but require approval
- Fair Hearing available if disagree with screening/eligibility
- Different from MEDS-AD (benefits one at a time) or ICP/PACE

**Data shape:** Managed care model via MCO plans; eligibility splits financial (DCF) and medical (DOEA CARES NFLOC); services vary by individual plan of care and medical necessity; statewide but regional MCOs and ADRCs

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ahca.myflorida.com/medicaid/statewide-medicaid-managed-care/long-term-care-program

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; however, Medicaid eligibility (often required) generally follows Florida long-term care rules: income under 300% of Federal Benefit Rate ($2,901/month in 2025 for most seniors). Medicaid planning can help qualify if over limits. Varies by household size per standard Medicaid rules, but no PACE-specific table provided[3][4].
- Assets: No asset limits for PACE enrollment determination. Medicaid eligibility typically limits countable assets to $2,000 (excluding primary home, one car, personal belongings, burial funds). Medicaid planning professionals can assist with exemptions and strategies[3][4].
- At risk of institutionalization / certified by state as needing nursing home level of care (e.g., assistance with 3+ activities of daily living like bathing, dressing)[1][2][3][4][6]
- Live in a designated PACE service area in Florida[1][2][6]
- Able to live safely in the community with PACE services support[1][2][3][6]
- Medicaid and/or Medicare eligible (dually eligible common; assistance available to enroll in Medicaid if needed)[1][2][4][5]
- Not enrolled in Medicare Advantage, Medicare prepayment plan, prescription drug plan, or hospice[2]

**Benefits:** Comprehensive all-inclusive services at no additional cost to enrollees (covers all Medicare/Medicaid benefits plus extras): acute care, adult day health care, end-of-life care, home care, home-delivered/congregate meals, hospital care, lab tests/x-rays/diagnostics, medical specialty services, medical supplies/appliances, nursing facility care, nutritional counseling, personal care, prescription drugs, primary care (physician/nursing), recreational therapy, restorative therapies, social services, therapy services, transportation. Provided in home, community, nursing facility, or PACE center[1]. No specific dollar amounts or hours per week stated; customized care plan developed by interdisciplinary team[5].
- Varies by: region

**How to apply:**
- Phone: Call enrollment specialists (e.g., Florida PACE Centers: 786.933.7223 or TTY 800.955.8771; Miami Jewish Health: 305.988.1364)[4][5]
- In-person/in-home: Pre-screening, in-home visits for paperwork, nurse exam, state CARES assessment[4][5]
- No specific online URL or mail mentioned; starts with phone pre-screening leading to in-home process[5]

**Timeline:** Typically 1-3 months due to coordination with Department of Children and Families (DCF) and Florida Department of Elder Affairs for Medicaid and assessments[4][5]
**Waitlist:** No waitlist in Florida PACE programs[4]

**Watch out for:**
- Not statewide—must live in specific service areas like Miami-Dade/Broward; check provider service area first[1][4]
- Medicaid eligibility often key but not automatic; over-income/assets may need planning/attorney help, though PACE has no direct financial test[2][3][4]
- Cannot be in Medicare Advantage, certain other plans, or hospice[2]
- Requires nursing home level of care certification via physician form and state assessment, but must be community-capable with PACE help[1][3][4]
- Enrollment voluntary but locks into PACE as sole provider for covered services—no opting out for other Medicare/Medicaid options while enrolled[2]

**Data shape:** County-restricted (primarily Miami-Dade/Broward); no direct income/asset limits for PACE but tied to Medicaid financials; no waitlist but 1-3 month processing; provider-specific enrollment processes; customized interdisciplinary care plans rather than fixed hours/dollars

**Source:** https://ahca.myflorida.com/medicaid/medicaid-policy-quality-and-operations/medicaid-policy-and-quality/medicaid-policy/federal-authorities/federal-waivers/program-of-all-inclusive-care-for-the-elderly

---

### Medicare Savings Programs (MSP)


**Eligibility:**
- Income: {"description":"Income limits are based on the Federal Poverty Level (FPL) and vary by program type and household size. Limits are effective as of April 2026. A $20 general exclusion applies to unearned income in each program.","2026_federal_baseline":{"QMB":{"individual":"$1,350/month","couple":"$1,824/month","basis":"100% FPL + $20"},"SLMB":{"individual":"$1,616/month","couple":"$2,184/month","basis":"120% FPL + $20"},"QI":{"individual":"$1,816/month","couple":"$2,455/month","basis":"135% FPL + $20"}},"florida_specific_note":"Florida recently changed how household size is calculated for MSP eligibility, now counting all household members rather than just the applicant and spouse. This significantly increases income limits for larger families. For example, a family of four has an income limit of $2,680 for QMB (compared to $1,704 under the old rule).[4] Income limits increase annually based on federal poverty level adjustments.[3]","important_caveat":"Certain types of income are not counted toward the limit, including some earned income and work expenses. You may still qualify even if your income appears to exceed the limit—applicants should apply regardless.[2][6]"}
- Assets: {"description":"Total resources (assets) must not exceed specified limits. The value of your home and personal belongings are NOT counted.[1]","2026_limits":{"individual":"$9,950","couple":"$14,910"},"what_counts":"Money in bank accounts, retirement accounts (IRAs), and other liquid assets.[1]","what_does_not_count":"Your home, personal belongings, and household goods.[1]"}
- Must be enrolled in Medicare Part A or expect to enroll soon.[2]
- Must be a Florida resident.
- For QDWI program specifically: must have a disability, be working, and have lost Social Security disability benefits and premium-free Part A due to returning to work.[1]

**Benefits:** Varies by program. QMB provides the most comprehensive coverage (all premiums and cost-sharing). SLMB and QI cover Part B premium only. Specific dollar amounts depend on current Medicare premiums and individual cost-sharing amounts.[1][2]
- Varies by: program_tier

**How to apply:**
- Contact Florida Department of Children & Families (DCF) — the state agency administering MSPs
- Apply through your local county social services office (in-person)
- Phone application available through DCF
- Mail application to your county office

**Timeline:** Not specified in available sources. Contact DCF directly for current processing times.
**Waitlist:** QI program operates on a first-come, first-served basis and may have limited funding.[2] Other programs do not appear to have waitlists based on available information.

**Watch out for:**
- Income limits appear higher than they are: Many types of income don't count toward the limit. Even if your income seems to exceed the limit, you should apply—you may still qualify.[2][6]
- Household size calculation changed: Florida recently expanded how household size is counted, which can significantly increase your income limit. If you were previously denied, you may now qualify.[4]
- Asset limits are strict but home doesn't count: You can own a home of any value and still qualify, but liquid assets are tightly limited ($9,950 individual/$14,910 couple as of 2026).[3]
- QI program has limited funding: The Qualifying Individual program operates on a first-come, first-served basis and may run out of funding.[2]
- Annual reapplication required: You must reapply each year to maintain benefits, particularly for the QI program.[5]
- Income limits change annually: The limits are adjusted each January based on federal poverty level updates. What qualifies one year may not the next.[3][5]
- Different programs have different coverage: QMB is the most comprehensive (covers premiums and cost-sharing), while SLMB and QI only cover the Part B premium. Choose the program that best fits your situation.[1][2]

**Data shape:** This program's structure is complex because: (1) There are four distinct programs with different income/asset limits and benefits; (2) Income limits scale by household size and are recalculated annually; (3) Florida recently changed household size calculation rules, making the program more generous; (4) Certain income types are excluded from the calculation, requiring individual assessment; (5) The QI program has first-come, first-served funding limitations; (6) Benefits are purely financial (premium and cost-sharing assistance), not direct services. Families must understand which of the four programs they qualify for, as each has different coverage levels.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.myflfamilies.com (Florida Department of Children & Families) and https://www.medicare.gov/basics/costs/help/medicare-savings-programs

---

### SNAP Food Assistance

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: {"description":"Seniors (60+) only need to meet the NET income limit, not the gross income limit—a significant advantage over other applicants[2]. The net income limit is equal to or less than the Federal Poverty Line (FPL), which varies by household size and state[2]. Most other households must meet a gross income limit of 200% of FPL[6].","note":"The search results do not provide the specific dollar amounts for Florida's FPL-based net income limits for Oct. 1, 2025–Sept. 30, 2026. These amounts vary by household size and must be obtained from the Florida Department of Children and Families (DCF) or USDA FNS website."}
- Assets: {"seniors_60_plus":"$4,500 in countable resources[2][6]","what_counts":"Bank accounts and some vehicles[2]","what_does_not_count":"Homes, Social Security income, and most retirement or pension plans are not considered countable resources[2]"}
- Must be a U.S. citizen or certain lawfully present non-citizen[3][8]
- Must apply in the state in which you currently live[3][8]
- Must provide proof of identity[6]
- Household composition: Your SNAP application must include everyone who lives with you and buys and prepares food with you[1]

**Benefits:** Monthly benefits provided on an EBT (Electronic Benefit Transfer) card, calculated as: maximum allotment for household size minus 30% of net income[2][7]. Example: A 2-person household with elderly members might receive $415/month ($546 maximum allotment minus $131, which is 30% of net income)[3]
- Varies by: household_size

**How to apply:**
- Online: ACCESS Florida website (https://www.myflorida.com/accessflorida/)[7]
- In-person: Florida Department of Children and Families (DCF) office in your county[9]
- Phone: Contact your local DCF office (specific numbers vary by county)[9]
- Mail: Submit application to your local DCF office (address varies by county)

**Timeline:** Standard processing time not specified in search results. However, expedited SNAP benefits are available: if approved, you can receive benefits within seven days if you meet expedited eligibility criteria[1]
**Waitlist:** No waitlist information provided in search results

**Watch out for:**
- Only about half of eligible seniors apply: Approximately 4.8 million seniors receive SNAP, but that's only about half of all eligible seniors[1]. Many seniors don't realize they qualify.
- Seniors have a major advantage: Unlike other applicants, seniors 60+ only need to meet the NET income limit, not the gross income limit[2]. This makes it easier for seniors to qualify than younger adults.
- Higher asset limits for seniors: Seniors can have $4,500 in countable resources; other households with a disqualified member can only have $3,000[6].
- 30% income rule: You are expected to spend 30% of your own income on food; your benefit is calculated by subtracting this from the maximum allotment[2].
- Household composition matters: Everyone who lives with you and buys/prepares food with you must be included in the application[1].
- Medical costs can help: Medical costs are factored into eligibility calculations for seniors, which can lower the net income threshold[1].
- Recent legislative changes: The One Big Beautiful Bill Act of 2025 changed certain SNAP eligibility factors, including work requirements and non-citizen eligibility[3]. Families should verify current rules with DCF.
- Non-citizen restrictions: Undocumented non-citizens are not eligible; only U.S. citizens and certain lawfully present non-citizens qualify[3][8].

**Data shape:** SNAP benefits scale by household size. Seniors 60+ have special eligibility rules that are more favorable than general SNAP rules (net income only, higher asset limits). The program is statewide but administered by county DCF offices with potential local variations. Benefits are provided via EBT card and calculated as a percentage of household income. The search results do not provide specific dollar amounts for income limits or maximum allotments for Florida; these must be obtained directly from Florida DCF or USDA FNS for the current benefit year (Oct. 1, 2025–Sept. 30, 2026).

**Source:** https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap and https://elderaffairs.org/programs-and-services/food-assistance/

---

### Florida Emergency Home Energy Assistance Program (EHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by region and source: 150% Federal Poverty Level (common, e.g., Hillsborough, Jacksonville[2][3]), 60% Florida State Median Income or 150% FPL (LIHEAP-related[1]), 100% Max Income Value (St. Johns[4]), or specific annual limits like for 2023: 1-person $27,735; 2 $36,269; 3 $44,803; 4 $53,337; 5 $61,870[8]. Automatic qualification if receiving SNAP/TANF/SSI[1][6]. Gross household income.
- At least one household member age 60+
- Experiencing verifiable home energy crisis (e.g., disconnection notice, past due bill)
- U.S. citizen, permanent resident, or qualified alien[1][2]
- Florida resident (often county-specific)
- Responsible for paying home heating/cooling bills
- Recent energy bill required
- Not in group living facility, subsidized housing, or dorm[4]

**Benefits:** Payment directly to energy vendor/landlord for past due heating/cooling bills (electricity, natural gas, propane, wood/coal, refillable fuels[6]). Up to $400 per season in some areas (one summer cooling April-Sep, one winter heating Oct-Mar[7]). Multiple bills possible[6].
- Varies by: region

**How to apply:**
- In-person at local offices/Community Resource Centers (e.g., Hillsborough[2], Jacksonville call 630-2489[3], St. Johns offices[4], Palm Beach multiple locations[7], Senior Resource Alliance for Central FL[6])
- Phone for appointments (e.g., 630-CITY/630-2489 Jacksonville[3], 561-355-4746 Palm Beach[7])
- No statewide online/mail specified; complete application with staff[2][4]

**Timeline:** Not specified in sources
**Waitlist:** Prioritizes vulnerable (60+, disabled, school-age); appointments required[2]

**Watch out for:**
- Not statewide—must contact county-specific provider; no central application
- Crisis required (disconnection/past due proof); not preventive
- Original documents often needed (no copies for SS cards/ID[3][4])
- Income proof for all adults, even non-workers; bank statements separate[3][4]
- Excludes group homes/subsidized/dorms[4]; residency at time of bill[7]
- Seasonal limits in some areas (one per summer/winter[7])

**Data shape:** County-administered with varying income limits, providers, and document rules; requires energy crisis verification; elderly-focused subset of broader LIHEAP

**Source:** No single statewide .gov; local e.g., https://hcfl.gov/residents/seniors/senior-and-caregiver-services/emergency-home-energy-assistance-program[2]

---

### SHINE (Serving Health Insurance Needs of Elders)


**Eligibility:**
- Income: No income or asset limits for SHINE counseling itself; open to all Florida Medicare beneficiaries, families, and caregivers. SHINE assists with programs like Extra Help (monthly income below $1,995 single; resources below $18,090) and Medicare Savings Programs (limits vary, apply even if slightly higher).[8]
- Assets: No asset limits for SHINE; for assisted programs like Extra Help, resources below $18,090 (exclusions not detailed in sources).[8]
- Florida resident
- Typically Medicare beneficiary, family, or caregiver
- No formal eligibility for free counseling services[9]

**Benefits:** Free, unbiased, confidential one-on-one counseling on Medicare eligibility/enrollment/coverage, health plan choices, appeals, Medigap, long-term care insurance, prescription assistance, Extra Help/Low-Income Subsidy, Medicare Savings Programs, fraud prevention; educational presentations and community events.[3][5][6]

**How to apply:**
- Phone: Toll-free Elder Helpline 1-800-963-5337 (8am-5pm)[1][3][8]
- Website: www.floridashine.org (find counseling sites, online volunteer app, virtual classes)[3]
- Online orientation/training: http://training.floridashine.org/STL_Modules/Orientation/story.html[3]
- In-person: Local Area Agency on Aging SHINE sites/events (locate via www.floridashine.org 'Counseling Sites')[6][8]
- Email: chanslera@elderaffairs.org[1]

**Timeline:** No formal processing; counseling available year-round via phone/sites/events, virtual classes starting April 6, 2026[3]

**Watch out for:**
- Not a direct benefit payer/provider—pure counseling/advocacy to navigate Medicare/options; volunteers not insurance agents, do not sell/recommend plans[3][5][6]
- Many eligible for subsidies (e.g., 35,000+ in one region) unaware/unenrolled—requires consultation/application[7]
- Assists with but does not determine eligibility for MSP/Extra Help—screens and applies[8]
- Services free but demand high (e.g., 9,500 users/year in SWFL)[6]

**Data shape:** no income test for counseling; volunteer-delivered via local Area Agencies on Aging; assists with tiered Medicare aid programs (e.g., Extra Help with specific income/resource caps); statewide but regionally variable sites/volunteers

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.floridashine.org

---

### Home-Delivered Meals


**Eligibility:**
- Age: 60+
- Income: No statewide income limits specified; eligibility often prioritizes low-income but programs may serve above limits with contributions. Medicaid enrollment may impose federal poverty level limits (not detailed here). Varies by local provider or plan.
- Assets: No asset limits mentioned across sources.
- Homebound or difficulty shopping/preparing meals
- Disabled (any age in some programs)
- Residency in delivery zone/county
- Medicaid or SMMC LTC enrollment for certain benefits
- Medicare Advantage plan with meal benefit
- Post-hospital discharge or specific conditions (e.g., temporary caregiver unavailability)
- Working refrigerator, microwave/oven, ability to access door

**Benefits:** Nutritious home-delivered meals (e.g., 5-10 meals per authorization for Medicaid; medically tailored options; post-discharge unlimited with prior auth; disaster relief 1x/year). Meals priced at $9.49 or less if not qualifying for free/low-cost.
- Varies by: priority_tier

**How to apply:**
- Phone: Elder Helpline 1-800-96-ELDER (800-963-5337) for local ADRC
- Contact local Area Agency on Aging or SMMC LTC case manager
- Contact Medicaid/Medicare Advantage health plan
- Local program assessment (in-person or phone)

**Timeline:** Varies; some within a week, longer with waitlists.
**Waitlist:** Common in local programs; varies by region and demand.

**Watch out for:**
- Not automatic; requires assessment and often waitlist
- Car ownership or ability to leave home may disqualify
- Must have functional kitchen appliances and door access
- Separate from SNAP/TEFAP; contact health plan for Medicaid benefits
- Local delivery zones exclude some addresses
- Spouses/dependents sometimes eligible but verify locally

**Data shape:** Decentralized by county/provider; tied to Medicaid SMMC LTC or local AAAs; no uniform income test; priority for homebound 60+ or disabled; varies heavily by region and health plan authorization.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://elderaffairs.org/programs-and-services/food-assistance/

---

### Respite for Elders Living in Everyday Families (RELIEF)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific information found in search results for RELIEF program eligibility, including income limits by household size.
- Assets: No specific information found; general public assistance programs mention assets but not for this program.
- No matching program details in provided search results; results cover debt relief, TCA, SNAP, Medicaid, and disaster aid instead.

**Benefits:** No specific benefits described for RELIEF; search results do not reference this program.

**Timeline:** No information available

**Watch out for:**
- Search results do not contain any information on 'Respite for Elders Living in Everyday Families (RELIEF)' program; it may not exist under this exact name or be covered in available sources. Families should verify via Florida Department of Elder Affairs (DOEA) or Aging and Disability Resource Centers (ADRCs). Common similar programs like Alzheimer's Disease Initiative (ADI) Respite Services have separate eligibility.

**Data shape:** No data available; program not found in Florida-specific search results which focus on DCF economic self-sufficiency programs (TCA, SNAP) rather than elder respite services.

**Source:** No official .gov URL identified in search results for RELIEF.

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level (HHS Poverty Guidelines, updated annually; contact local provider for current table by household size as exact dollar amounts not specified in sources; e.g., for 2025 guidelines effective Jan 15, 2025)
- Unemployed
- Poor employment prospects
- Priority to veterans/qualified spouses, individuals over 65, with disabilities, low literacy/limited English proficiency, rural residents, homeless/at risk, or failed American Job Center services

**Benefits:** Part-time community service work-based job training (average 20 hours/week); paid highest of federal, state, or local minimum wage; job skills training; placement assistance to unsubsidized employment; typically 6 months training
- Varies by: priority_tier

**How to apply:**
- Online: https://onlineapplication.scsep.org/OnlineApplication/
- Phone: AARP Foundation Work Resources Helpline 1-855-850-2525 (Mon-Fri 9am-6pm ET; Spanish available); DOL toll-free 1-877-872-5627 (1-877-US2-JOBS)
- Locator: https://my.aarpfoundation.org/locator/scsep/ (enter zip code)
- In-person: Local providers (e.g., AARP Foundation offices like 3300 SW Archer Road Suite 210, Gainesville for certain counties)

**Waitlist:** Possible due to funding limits and transitions; varies by region/provider

**Watch out for:**
- Must be unemployed and have poor employment prospects (not just low-income)
- Priority tiers may limit access for non-priority applicants
- Temporary bridge program (avg 6 months) aimed at unsubsidized jobs, not long-term employment
- Funding transitions/delays may affect availability
- Income based on family size at 125% poverty (check current HHS guidelines)
- No asset limits specified, but prove income/unemployment

**Data shape:** Multiple regional grantees/providers; priority enrollment tiers; income at 125% poverty scales by household size; no fixed asset test; part-time hours/wage tied to local minimums

**Source:** https://elderaffairs.org/programs-and-services/senior-community-service-employment-program-scsep/

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; open to anyone regardless of financial status.
- Assets: No asset limits; no financial requirements apply.
- Resident (or representative of resident) of a long-term care facility in Florida, including nursing homes, assisted living facilities, adult family-care homes, and continuing care retirement communities. Also available to relatives, friends, concerned facility staff, or any person/group concerned about residents' treatment.

**Benefits:** Free, confidential advocacy services including identifying, investigating, and resolving complaints on behalf of residents; visiting facilities to monitor conditions and support residents; providing information on nursing homes; assisting with issues like relocations, rights violations, and fair treatment; proactive problem prevention.

**How to apply:**
- Phone: toll-free 1-888-831-0404 (primary contact for residents, families, or concerns); Local: (850) 414-2323; Email: LTCOPInformer@elderaffairs.org; Mail: Long-Term Care Ombudsman Program, 4040 Esplanade Way, Suite 380, Tallahassee, FL 32399-7000

**Timeline:** Immediate response to complaints; no formal processing timeline specified as services are provided on-demand by volunteers and staff.

**Watch out for:**
- Not a Medicaid or financial assistance program—purely advocacy for facility residents, not direct care or funding; requires no affiliation with facilities for ombudsman volunteers to maintain impartiality; services are complaint-driven, not automatic enrollment; distinct from Long-Term Care (LTC) Medicaid services which have strict age, Medicaid, and nursing home level-of-care requirements.

**Data shape:** no income test; open to any concerned party for facility residents; volunteer-based advocacy network across 14 districts; complaint-resolution focused, not service provision or financial aid.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://elderaffairs.org/programs-and-services/long-term-care-ombudsman-program/

---

### Home Care for the Elderly

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Must have self-declared income and assets not exceeding Institutional Care Program (ICP) limits established by Medicaid and DCF. SSI, QMB, or SLMB recipients automatically meet financial criteria. Specific 2026 ICP limits: single applicant income under $2,982/month (varies by program pathway; no full household table provided in sources).[1][2][4]
- Assets: Assets must not exceed ICP limits (e.g., $2,000 for single nursing home Medicaid applicants in 2026). Counts toward countable assets per Medicaid rules; exemptions not detailed in sources but typically include primary home, one vehicle, personal belongings per standard Medicaid.[1][4]
- Florida resident with intent to remain in state.
- At risk of nursing home placement based on 701B assessment.
- Adult caregiver (18+ years old) living in private home, providing full-time family-type living arrangement, willing to accept responsibility for social, physical, and emotional needs.

**Benefits:** Home-based services to prevent nursing home placement, including personal care, homemaker services, and support via adult caregiver in private home. Specific hours/dollar amounts or service lists not detailed; focuses on enabling aging in place with caregiver support.[1][2]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) or Department of Elder Affairs (DOEA) office (specific phone/website not in results; statewide network via elderaffairs.org implied).
- No specific online URL, phone number, mail, or in-person details provided in sources.

**Timeline:** Not specified in sources.

**Watch out for:**
- Requires live-in adult caregiver (18+) committed full-time; not for those without family-type arrangement.
- Financial eligibility tied to ICP/SSI/QMB/SLMB; self-declared but verified against Medicaid limits.
- Must be at risk of nursing home placement via specific 701B assessment, not just general home care need.
- Not standard Medicaid home health; caregiver-focused to avoid institutionalization.

**Data shape:** Tied to ICP Medicaid limits and requires dedicated live-in caregiver; functional eligibility via 701B nursing home risk assessment; statewide but locally administered.

**Source:** https://www.agingcarefl.org/uploads/1/3/6/5/136526411/2020-chapter-6-home-care-for-the-elderly-program.pdf

---

### Optional State Supplementation (OSS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Income must be within standards in Fla. Admin. Code Ann. R. 65A-2.036(3). Specific limits include not exceeding $752.40 gross monthly countable income (2010 data); recent mentions suggest $828.40 for an individual in assisted living or $1,656.80 for a married couple. Exact current limits require checking with Department of Children and Families as they align with SSI standards but are state-set.
- Assets: Assets within SSA Title XVI SSI standards: $2,000 for an individual, $3,000 for a couple. Counts standard SSI countable assets; exemptions follow federal SSI rules (e.g., primary home if occupied, one vehicle, household goods).
- Age 65 or older, or 18+ and blind/disabled per SSA Title XVI (20 C.F.R. §§416 et seq.).
- Florida resident with intent to remain.
- U.S. citizen or qualified noncitizen (8 U.S.C. §1641(b)).
- Apply for and pursue all other potential benefits (per 20 C.F.R. §416.210 and 42 C.F.R. §435.608).
- Live in licensed Assisted Living Facility (per §429.02(5), F.S.), Adult Family Care Home (§429.65(2), F.S.), or Mental Health Residential Treatment Facility (§394.67(23), F.S.), meeting needs via medical/social evaluations (Ch. 59A-36, 59A-37, or 65E-4, F.A.C.).
- Need assistance with activities of daily living due to physical/mental conditions.

**Benefits:** Monthly cash payment: Gross countable income subtracted from standard provider rate + personal needs allowance (e.g., up to $78.40 difference as state optional payment; includes $54 personal needs allowance in some cases). Payment levels vary by facility type (e.g., Medicaid facility: $35 individual/$70 couple provider rate, $5/$10 personal needs). Supplements SSI or grandfathered eligibility to pay facility costs.
- Varies by: living_arrangement|facility_type

**How to apply:**
- In-person or mail: Local offices of Florida Department of Children and Families (DCF).
- Phone: Contact local DCF office (e.g., North Broward Regional Service Center via navigateresources.net listing).
- State-administered; SSI application may coordinate in some cases.

**Timeline:** Not specified in sources.

**Watch out for:**
- Strictly for residents of specific licensed facilities only—not independent living or home.
- Must meet facility 'needs-based' criteria via objective medical/social evaluations.
- Income/assets tied to SSI standards but state supplements only if in qualifying arrangement and income below state limit (may differ from federal SSI).
- Recipients must pursue all other benefits; losing SSI due to Title II increases may retain OSS if in specific arrangement and under income limit.
- Payments go toward facility provider rate + personal needs; third-party supplements allowed but paid to facility, not recipient.
- Grandfathered eligibility possible for those meeting SSI criteria except income.

**Data shape:** Facility-restricted to assisted living/adult family care/mental health residential; payment calculated as provider rate + personal needs allowance minus countable income; scales by facility type and couple status; state-funded supplement to SSI.

**Source:** https://www.flrules.org/gateway/RuleNo.asp?id=65A-2.032 (Fla. Admin. Code Ann. R. 65A-2.032); https://www.myflfamilies.com/service-programs/access/ (DCF ACCESS Florida)

---

### Homestead Exemption for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Adjusted gross household income from prior year for all household members cannot exceed the annual limit set by Florida Department of Revenue, adjusted by cost-of-living index. For 2026: $38,686 statewide in most counties (e.g., Duval, Nassau, Lake); $31,100 in Gulf County. No variation by household size. Income includes Social Security, pensions, VA benefits, wages, interest; computed as IRS Form 1040 adjusted gross income, or total income minus Social Security if no tax return filed.[5][6][8][3]
- Assets: No asset limits; eligibility based on income, age, and homestead only.[1][2]
- Must qualify for and receive standard Florida Homestead Exemption (permanent Florida resident, own and reside in property as of January 1).[1][2][5]
- At least one homeowner 65 or older as of January 1.[1][2][5]
- Some counties require 25 years continuous residency (e.g., Monroe, Hillsborough, Duval for additional tier).[1][4][5]

**Benefits:** Additional homestead exemption up to $50,000 off assessed value for non-school taxes (applies after standard $50,000 homestead exemption).[2][6][9]
- Varies by: region

**How to apply:**
- Contact local County Property Appraiser office (varies by county; e.g., online portals or in-person at appraiser offices)
- Mail or in-person: Submit to county property appraiser

**Timeline:** Renewal automatic annually if no changes; new applications processed by March 1 deadline (income by June 1 if needed).[2]

**Watch out for:**
- Must already have standard homestead exemption; apply for both if new.[1][2][7]
- Income is household total for prior year, includes all residents (not just owners).[1][5][8]
- Annual renewal required or audit possible; mail instructions sent in January.[2]
- Deadlines: March 1 for application, June 1 for income if delayed.[2]
- Varies by county/municipality; not all areas offer full $50k or long-term tier.[4][7]
- Only reduces non-school taxes in some counties.[5][6]

**Data shape:** Income limit fixed per household (not scaled by size), set annually by FL DOR; county-specific variations in thresholds, residency tiers, and tax applicability; requires base homestead exemption

**Source:** https://floridarevenue.com/property/Documents/pt110.pdf

---

### Florida Discount Drug Card Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits or requirements. Open to all Florida residents regardless of income.[2][3][5]
- Assets: No asset limits or requirements.
- Florida resident. No prescription drug coverage required, but can supplement existing coverage, Medicare Part D gaps, or non-covered drugs.[2][3][5]

**Benefits:** Discounts on prescriptions (average 30%, up to 75% on some drugs), diabetic supplies (test strips, syringes, glucose monitors), eyeglasses, hearing aids, nutritional supplements. Accepted at over 60,000 pharmacies nationwide, including all major chains. Brand and generic eligible; open formulary.[3][4][5][6]

**How to apply:**
- Online: www.FloridaRxCard.com (print free card instantly, search pricing, locate pharmacies)[3]
- Health centers, hospitals, clinics, card distribution sites[3]
- Phone: 866-341-8894 (help desk for mail order) or 1-877-321-2652 (program info)[7][8]
- No formal application; instant printable pre-activated card[2][3][6]

**Timeline:** Instant; pre-activated cards usable immediately[2][3][6]

**Watch out for:**
- One-time $1.50 activation fee may apply at first use for permanent card (not all sources confirm)[1][4][5]
- Discount amount varies by drug, pharmacy, brand/generic, supply quantity[4][8]
- Not insurance; cannot be used with insurance on same prescription at some pharmacies[2]
- Older sources (2007) mention outdated income limits and eligibility for under-60; current program has none[1]
- Class II narcotics no longer available via mail order[8]

**Data shape:** no income test; completely open eligibility; instant no-form access; nationwide pharmacy network but Florida-focused

**Source:** https://www.floridashine.org/getattachment/Resources/ResourceLinks/BPrescripAsstOptions.pdf.aspx (SHINE program reference)[5]

---

### Alzheimer's Disease Initiative (ADI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No specific statewide income limits or tables mentioned; some local programs (e.g., Broward County) use sliding scale co-payments based on income, but exact dollar amounts not provided[1][4]
- Assets: No asset limits or exemptions specified in available information[1][2]
- Diagnosis of Alzheimer’s disease or a related memory disorder (ADRD), or suspected diagnosis
- Documented diagnosis for certain services (e.g., from medical director of state-funded Memory Disorder Clinic, licensed neurologist, psychiatrist, or geriatric internist; requires medical records with exams, analyses, psychiatric assessments, hematological/biochemical studies, and CT/MRI brain scan)
- Functionally impaired and at risk of premature nursing home placement (local variation, e.g., Broward for age 60+)
- Availability of funding (noted as eligibility factor in some areas)

**Benefits:** Respite services (in-home, adult day care, emergency, extended up to 30 days); case management; counseling; consumable medical supplies; caregiver training; supportive services based on comprehensive assessment and unmet needs; stimulation and relief for caregivers; services through Memory Disorder Clinics (testing, education, referral, research, caregiver support); Brain Bank services
- Varies by: priority_tier

**How to apply:**
- Phone: Elder Helpline at 1-800-96-Elder (1-800-963-5337) to contact local Area Agency on Aging (AAA)[3]
- Local AAA or provider contacts (e.g., Broward: 954-745-9779 or 954-357-6622; Email: ElderlyandVeterans@broward.org)[4][7]
- Through 11 Area Agencies on Aging (AAAs) statewide[3]

**Timeline:** Not specified
**Waitlist:** Availability of funding affects access; no specific waitlist details[4]

**Watch out for:**
- No statewide income/asset limits specified, but local sliding scale co-pays and funding availability determine access—contact local AAA for details[4]
- Strict diagnosis documentation required, especially for specialized services like adult day care or Brain Bank[1][2]
- Services authorized post-comprehensive case management assessment, not automatic upon eligibility[6]
- Regional delivery means eligibility/services vary by AAA/provider—must contact local office[3]
- Created in 1985 as respite-focused but expanded; includes non-respite like clinics and training[5]

**Data shape:** Administered regionally via 11 AAAs and 17 Memory Disorder Clinics in 13 areas; needs-based services authorized after assessment; no fixed income/asset tests statewide, diagnosis-driven with funding constraints

**Source:** https://elderaffairs.org/programs-services/alzheimers-disease-initiative/ (inferred from DOEA context; primary docs via agingcarefl.org or elderaffairs.org)[1]

---

### RELIEF Program (Respite for Elders Living in Everyday Families)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits, asset limits, or dollar amounts detailed in available sources; targeted at families caring for frail, homebound elders, including those with Alzheimer’s and related disorders[5]
- Assets: Not specified; no information on what counts or exemptions[5]
- Caregiver must be family member or loved one providing constant care to a frail, homebound elderly individual[5]
- Elder must be homebound[5]

**Benefits:** In-home respite care provided by screened volunteers for up to 4 hours at a time, including evenings and weekends; free to caregivers; companionship and relief to prevent caregiver illness[5]

**How to apply:**
- Phone: Elder Helpline at 1-800-963-5337[5]
- In-person or contact: Local Aging and Disability Resource Center (ADRC) in your county[5]

**Timeline:** Not specified

**Watch out for:**
- Program relies on volunteers, so availability depends on local volunteer corps and matching process[5]
- Expansion of basic public respite programs, not a replacement; may not cover all needs[5]
- No detailed eligibility financial thresholds provided, suggesting needs-based assessment via local ADRC rather than strict cutoffs[5]
- Volunteers provide companionship up to 4 hours, not medical or skilled nursing care[5]

**Data shape:** Volunteer-based with local administration through 11 AAAs/ADRCs; no published income/asset tables or fixed hours guarantee; free service focused on evenings/weekends expansion[5][6]

**Source:** https://elderaffairs.org/programs-and-services/respite-for-elders-living-in-everyday-families-relief/[5]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Statewide Medicaid Managed Care Long Ter | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (MSP) | benefit | federal | deep |
| SNAP Food Assistance | benefit | federal | deep |
| Florida Emergency Home Energy Assistance | benefit | local | medium |
| SHINE (Serving Health Insurance Needs of | resource | state | simple |
| Home-Delivered Meals | benefit | state | deep |
| Respite for Elders Living in Everyday Fa | benefit | local | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Home Care for the Elderly | benefit | state | deep |
| Optional State Supplementation (OSS) | benefit | state | deep |
| Homestead Exemption for Seniors | benefit | state | deep |
| Florida Discount Drug Card Program | benefit | state | medium |
| Alzheimer's Disease Initiative (ADI) | benefit | state | deep |
| RELIEF Program (Respite for Elders Livin | benefit | state | medium |

**Types:** {"benefit":13,"resource":2,"employment":1}
**Scopes:** {"state":9,"local":3,"federal":4}
**Complexity:** {"deep":10,"medium":4,"simple":2}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/FL/drafts.json`.

- **Statewide Medicaid Managed Care Long Term Care Program** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 6 content sections, 6 FAQs
- **Medicare Savings Programs (MSP)** (benefit) — 6 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **individual_needs|medical_necessity**: 1 programs
- **region**: 3 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **not_applicable**: 5 programs
- **priority_tier**: 4 programs
- **living_arrangement|facility_type**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Statewide Medicaid Managed Care Long Term Care Program**: Managed care model via MCO plans; eligibility splits financial (DCF) and medical (DOEA CARES NFLOC); services vary by individual plan of care and medical necessity; statewide but regional MCOs and ADRCs
- **Program of All-Inclusive Care for the Elderly (PACE)**: County-restricted (primarily Miami-Dade/Broward); no direct income/asset limits for PACE but tied to Medicaid financials; no waitlist but 1-3 month processing; provider-specific enrollment processes; customized interdisciplinary care plans rather than fixed hours/dollars
- **Medicare Savings Programs (MSP)**: This program's structure is complex because: (1) There are four distinct programs with different income/asset limits and benefits; (2) Income limits scale by household size and are recalculated annually; (3) Florida recently changed household size calculation rules, making the program more generous; (4) Certain income types are excluded from the calculation, requiring individual assessment; (5) The QI program has first-come, first-served funding limitations; (6) Benefits are purely financial (premium and cost-sharing assistance), not direct services. Families must understand which of the four programs they qualify for, as each has different coverage levels.
- **SNAP Food Assistance**: SNAP benefits scale by household size. Seniors 60+ have special eligibility rules that are more favorable than general SNAP rules (net income only, higher asset limits). The program is statewide but administered by county DCF offices with potential local variations. Benefits are provided via EBT card and calculated as a percentage of household income. The search results do not provide specific dollar amounts for income limits or maximum allotments for Florida; these must be obtained directly from Florida DCF or USDA FNS for the current benefit year (Oct. 1, 2025–Sept. 30, 2026).
- **Florida Emergency Home Energy Assistance Program (EHEAP)**: County-administered with varying income limits, providers, and document rules; requires energy crisis verification; elderly-focused subset of broader LIHEAP
- **SHINE (Serving Health Insurance Needs of Elders)**: no income test for counseling; volunteer-delivered via local Area Agencies on Aging; assists with tiered Medicare aid programs (e.g., Extra Help with specific income/resource caps); statewide but regionally variable sites/volunteers
- **Home-Delivered Meals**: Decentralized by county/provider; tied to Medicaid SMMC LTC or local AAAs; no uniform income test; priority for homebound 60+ or disabled; varies heavily by region and health plan authorization.
- **Respite for Elders Living in Everyday Families (RELIEF)**: No data available; program not found in Florida-specific search results which focus on DCF economic self-sufficiency programs (TCA, SNAP) rather than elder respite services.
- **Senior Community Service Employment Program (SCSEP)**: Multiple regional grantees/providers; priority enrollment tiers; income at 125% poverty scales by household size; no fixed asset test; part-time hours/wage tied to local minimums
- **Long-Term Care Ombudsman Program**: no income test; open to any concerned party for facility residents; volunteer-based advocacy network across 14 districts; complaint-resolution focused, not service provision or financial aid.
- **Home Care for the Elderly**: Tied to ICP Medicaid limits and requires dedicated live-in caregiver; functional eligibility via 701B nursing home risk assessment; statewide but locally administered.
- **Optional State Supplementation (OSS)**: Facility-restricted to assisted living/adult family care/mental health residential; payment calculated as provider rate + personal needs allowance minus countable income; scales by facility type and couple status; state-funded supplement to SSI.
- **Homestead Exemption for Seniors**: Income limit fixed per household (not scaled by size), set annually by FL DOR; county-specific variations in thresholds, residency tiers, and tax applicability; requires base homestead exemption
- **Florida Discount Drug Card Program**: no income test; completely open eligibility; instant no-form access; nationwide pharmacy network but Florida-focused
- **Alzheimer's Disease Initiative (ADI)**: Administered regionally via 11 AAAs and 17 Memory Disorder Clinics in 13 areas; needs-based services authorized after assessment; no fixed income/asset tests statewide, diagnosis-driven with funding constraints
- **RELIEF Program (Respite for Elders Living in Everyday Families)**: Volunteer-based with local administration through 11 AAAs/ADRCs; no published income/asset tables or fixed hours guarantee; free service focused on evenings/weekends expansion[5][6]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Florida?
