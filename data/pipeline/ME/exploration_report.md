# Maine Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.065 (13 calls, 1.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 11 |
| Programs deep-dived | 11 |
| New (not in our data) | 7 |
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

- **service**: 5 programs
- **financial**: 2 programs
- **in_kind**: 2 programs
- **employment**: 1 programs
- **advocacy|counseling|referral**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### MaineCare Elderly and Adults with Disabilities Waiver

- **min_age**: Ours says `65` → Source says `65+ or 18+ with physical disabilities` ([source](https://www.maine.gov/dhhs/oms/mainecare-options/older-adults-and-adults-with-disabilities[4]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Care coordination, personal care, respite, financial management services, skills training, assistive technology, attendant care services, environmental modifications, home delivered meals, home health services, living well for better health (chronic disease self-management), matter of balance (falls prevention), non-medical transportation, personal emergency response system, non-traditional communication consultation/assessments, occupational/physical/speech therapy (maintenance), shared living (adult foster care), specialized medical equipment and supplies[2]` ([source](https://www.maine.gov/dhhs/oms/mainecare-options/older-adults-and-adults-with-disabilities[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/oms/mainecare-options/older-adults-and-adults-with-disabilities[4]`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `No minimum age requirement for the household; however, seniors 60+ qualify for special income rules (see other_requirements)` ([source](https://www.maine.gov/dhhs/ofi/programs-services/food-supplement))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly SNAP benefit amounts by household size (Oct. 1, 2025 - Sept. 30, 2026): 1 person: $298 | 2 people: $546 | 3 people: $785 | 4 people: $994 | 5 people: $1,183 | 6 people: $1,421 | 7 people: $1,571 | 8 people: $1,789 | Each additional member: +$218. Actual benefit amount depends on household income, composition, and certain expenses (medical bills over $35 for elderly/disabled households)[4][5]` ([source](https://www.maine.gov/dhhs/ofi/programs-services/food-supplement))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/ofi/programs-services/food-supplement`

### State Health Insurance Assistance Program (SHIP) - Maine Senior Health Insurance Assistance Program

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, confidential counseling services including: information on Medicare, Medicare Advantage, MaineCare, Medigap, and supplemental programs; preventive health benefits; Medicare Part D options; help with medical bills, claims, and notices. Counselors do not sell insurance or recommend policies.` ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance`

### Legal Services for Maine Elders (LSE)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free legal advice, information, and in some cases representation on: health care, health insurance, Medicare (including Part D), MaineCare (Medicaid), Social Security/public benefits, pension/retirement benefits, powers of attorney, consumer matters (creditor/debt/bankruptcy), physical/financial abuse, guardianship defense, housing (eviction/foreclosure), elder abuse/protection orders, discharges, health care advance directives. Medicare Part D Unit for prescription drug issues[2][3][7].` ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/legal-assistance and https://mainelse.org[2][7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/legal-assistance and https://mainelse.org[2][7]`

## New Programs (Not in Our Data)

- **Home and Community-Based Services (HCBS) Waivers (e.g., MaineCare In-Home Services)** — service ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/home-care))
  - Shape notes: Requires NHLOC equivalent to nursing facility; benefits individualized by assessment tier; statewide but local offices/ADRCs handle intake; strict financial lookback and patient liability.
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.mainehousing.org/programs-services/energy/energydetails/liheap))
  - Shape notes: Income table provided in 1/3/12-month formats; benefits scale by household size, income, fuel type, deductions; administered via local CAAs statewide with apply-early funding constraint; TANF auto-max benefit; no cooling aid.
- **Weatherization Assistance Program (WAP)** — in_kind ([source](https://www.mainehousing.org/programs-services/HomeImprovement/homeimprovementdetail/weatherization))
  - Shape notes: WAP is a decentralized program administered by MaineHousing but delivered through regional Community Action Agencies, each with its own application process and contact information. Income eligibility is based on 200% of federal poverty level, which varies by household size and changes annually — specific dollar amounts must be obtained from your local provider. Benefits are fixed (free improvements) but the scope of work varies by individual home assessment. Priority criteria and re-weatherization restrictions vary by regional provider. No processing time, waitlist, or specific form information is publicly available in standard sources.
- **Home Delivered Meals (Maine Nutrition Services Program)** — in_kind ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/food-and-nutrition[6]))
  - Shape notes: This program is regionally fragmented across five Area Agencies on Aging with different service areas, costs, and eligibility criteria. No statewide income or asset limits are published; families must contact their local AAA. Eligibility is based on functional need (homebound, unable to prepare meals) rather than income alone, but income may be a factor. The program includes both meals and supportive services (nutrition counseling, safety check-ins). Costs are nominal but not free. Geographic restrictions are significant — not all regions serve all counties.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.myworksourcemaine.gov/resources/senior-community-service-employment-program-scsep-associates-training-development or https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/scsep[1][2]))
  - Shape notes: Dual state/national grants split by counties (state: Cumberland/Lincoln/part York; national: rest); priority enrollment tiers; capacity-capped with rolling entry on transitions; income-based at 125% FPL without asset test
- **Maine Legal Services for the Elderly** — service ([source](https://mainelse.org[9]))
  - Shape notes: No fixed income/asset tables; eligibility prioritizes 'socially and economically needy' with case-by-case review; statewide helpline with regional attorney offices; services are legal advocacy, not direct financial or in-kind aid
- **Maine SHIP (State Health Insurance Assistance Program)** — advocacy|counseling|referral ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance))
  - Shape notes: SHIP is a counseling and advocacy program, not a direct financial assistance program. It serves as a gateway to other programs (Medicare Savings Programs, MaineCare, prescription drug assistance). Eligibility is universal for Medicare beneficiaries and older adults — there are no income, asset, or other restrictive requirements. The program's value lies in personalized guidance rather than direct benefits. Regional variations exist in how appointments are offered (phone, Zoom, in-person) and which Area Agencies on Aging serve different parts of the state, but the core services and eligibility are statewide and uniform.

## Program Details

### MaineCare Elderly and Adults with Disabilities Waiver


**Eligibility:**
- Age: 65+ or 18+ with physical disabilities+
- Income: Determined by Office of Family Independence (OFI) under MaineCare financial eligibility rules; specific dollar amounts or household size tables not detailed in sources—use MaineCare Eligibility Test for seniors via American Council on Aging[1]
- Assets: Not specified in sources; follows standard MaineCare long-term care rules—consult OFI for details[1]
- Maine resident
- Nursing Facility Level of Care (NFLOC) determined by in-person functional needs assessment using Medical Eligibility Determination (MED) tool by a registered nurse[1]
- At risk of institutionalization (nursing home admission)[1]

**Benefits:** Care coordination, personal care, respite, financial management services, skills training, assistive technology, attendant care services, environmental modifications, home delivered meals, home health services, living well for better health (chronic disease self-management), matter of balance (falls prevention), non-medical transportation, personal emergency response system, non-traditional communication consultation/assessments, occupational/physical/speech therapy (maintenance), shared living (adult foster care), specialized medical equipment and supplies[2]
- Varies by: priority_tier

**How to apply:**
- Online: My Maine Connection[1]
- Phone: Office for Family Independence at 855-797-4357[1]
- In-person: District Department of Health and Human Services office[1]
- Mail: Download and print Application for Long Term Care MaineCare[1]

**Timeline:** Up to 90 days for determination[5]
**Waitlist:** Exists; average wait time varies by needs and can range from no time to several years[5]

**Watch out for:**
- Must meet both financial (OFI) and functional (Assessing Services Agency) eligibility separately[1]
- Requires Nursing Facility Level of Care (NFLOC)—not just disability[1]
- Waitlists can be several years depending on needs[5]
- Estate recovery possible if received services age 55+ and no surviving spouse or qualifying children[4]
- Only one waiver at a time; distinguish from other waivers like those for intellectual disabilities[2][5]

**Data shape:** Statewide with waitlist; benefits detailed by service type with tiered/priority access; dual eligibility determination (financial + functional); monthly/annual service caps updated periodically[1][2][3]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/oms/mainecare-options/older-adults-and-adults-with-disabilities[4]

---

### Home and Community-Based Services (HCBS) Waivers (e.g., MaineCare In-Home Services)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For Long Term Care MaineCare programs including HCBS waivers, income limits vary by program and household size. Waiver programs have a limit of $2,742/month (2023 data; updated annually). Nursing Home Medicaid (related): single applicant under $2,982/month (2026). General MaineCare: up to 138% FPL or specific tables like Adults (21-64): 1-person $1,836/month, 2-person $2,490/month. Must meet Long Term Care financial eligibility with 60-month lookback.[2][5][7]
- Assets: Assets under $10,000 for single Nursing Home Medicaid applicant ($2,000 base + $8,000 exemption); $13,000 for couple ($3,000 base + $10,000? note: sources vary slightly on couple exemption to $12,000-$13,000). Counts all assets; exemptions not detailed but standard Medicaid rules apply (e.g., primary home may be exempt under conditions). 60-month lookback for transfers.[2][5]
- Maine resident with intent to remain.
- MaineCare enrollment or eligibility.
- Nursing Home Level of Care (NHLOC): require extensive/total assistance with 3+ ADLs (bed mobility, transfer, locomotion, eating, toilet use).
- Medical/functional need assessed by Goold Health Systems (GHS).
- Age 65+, blind, or disabled.
- US citizen or qualified immigrant.

**Benefits:** Home and community-based long-term care services equivalent to nursing facility or ICF/IID level, including in-home personal care, assistance with ADLs (bathing, dressing, eating, mobility), Consumer Directed Attendant Services, Private Duty Nursing, Independent Support/Homemaker Services, potential home modifications. Hours/services based on assessment; Personal Needs Allowance $2,430 (waiver) or $50/$70 (facility). No fixed dollar/hour cap specified; individualized.[1][3][5][6]
- Varies by: priority_tier

**How to apply:**
- Apply for MaineCare via Long-Term Care application through local Aging and Disability Resource Center (ADRC) or DHHS district office.
- Contact PineView Care at 207-707-3004 for eligibility screening and assistance.
- Functional assessment by Goold Health Systems (state-contracted).
- No specific online URL or form number listed; use CoverME.gov for general MaineCare info.

**Timeline:** OFI processes MaineCare eligibility within 45 days.[7]
**Waitlist:** Not specified in sources; may exist based on priority and funding.

**Watch out for:**
- Must meet NHLOC, not just general ADL needs; assessed by GHS.[3]
- 60-month financial lookback for asset transfers.[5]
- All income (minus PNA, Medicare premiums) may be patient liability.[2]
- Income/asset limits updated annually; contact for current figures.[1][2]
- Enrollment in MaineCare required first; separate functional assessment.[6]
- Not automatic; needs care coordinator assessment for specific hours/services.[1]

**Data shape:** Requires NHLOC equivalent to nursing facility; benefits individualized by assessment tier; statewide but local offices/ADRCs handle intake; strict financial lookback and patient liability.

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/home-care

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: No minimum age requirement for the household; however, seniors 60+ qualify for special income rules (see other_requirements)+
- Income: {"standard_households":"200% of Federal Poverty Level (FPL). Gross monthly income limits by household size (Oct. 1, 2025 - Sept. 30, 2026): 1 person: $2,609 | 2 people: $3,525 | 3 people: $4,442 | 4 people: $5,359 | 5 people: $6,275 | 6 people: $7,192 | 7 people: $8,109 | 8 people: $9,025 | Each additional person: +$917[1][4]","elderly_or_disabled_households":"Only must meet net income limit of 100% FPL (gross income limit does not apply). Net income = gross income minus allowable deductions[1][5][6]"}
- Assets: {"maine_expanded_rule":"No asset limit in Maine as of January 1, 2022[1][7]","what_counts":"Countable resources include funds in bank accounts[1]","what_is_exempt":"Home is not counted. One household vehicle and any income-producing vehicles are not counted. For all other vehicles, count only the value exceeding $4,650[1]","federal_alternative":"Households with elderly or disabled members who do not meet the Gross Income test can alternatively qualify under federal program rules, which have an asset limit of $4,500 but no Gross Income limit[1]"}
- Must be a Maine resident[5]
- Must be a U.S. citizen or lawfully present non-citizen[5]
- All applicants must have a Social Security number or proof of application for one[5]
- Able-bodied adults ages 18-54 without dependents (ABAWD) must meet work requirements: can only receive benefits for 3 months during a 36-month period (current period: Oct. 1, 2023 - Sept. 30, 2026) unless exempted[2]
- ABAWD exemptions include: pregnant individuals, caregivers for children under 6 or certain disabled people, households with someone under 18, physically/mentally unable to work, in alcohol/drug treatment, eligible college students (half-time or more), meeting work requirements for TANF or unemployment, experiencing homelessness, veterans of any age/discharge status, or former foster youth under 25[2]
- Work requirement waiver applies through Sept. 30, 2024 in certain Maine territories, towns, and cities (check full list)[2]

**Benefits:** Monthly SNAP benefit amounts by household size (Oct. 1, 2025 - Sept. 30, 2026): 1 person: $298 | 2 people: $546 | 3 people: $785 | 4 people: $994 | 5 people: $1,183 | 6 people: $1,421 | 7 people: $1,571 | 8 people: $1,789 | Each additional member: +$218. Actual benefit amount depends on household income, composition, and certain expenses (medical bills over $35 for elderly/disabled households)[4][5]
- Varies by: household_size and income

**How to apply:**
- Online: My Maine Connection (www.mymaineconnection.gov)[7]
- Mail: Office for Family Independence, 114 Corn Shop Lane, Farmington, ME 04938[7]
- Paper application available for printing and mailing[7]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Maine has expanded SNAP eligibility beyond federal requirements — other websites may show stricter limits than Maine actually enforces[1]
- Elderly (60+) and disabled households have dramatically different income rules: they only need to meet net income (not gross income), making them eligible at higher income levels[1][5][6]
- No asset limit in Maine means seniors can own homes, vehicles, and savings and still qualify — this is more generous than federal rules[1][7]
- Elderly/disabled households can deduct medical expenses over $35/month from gross income when calculating net income eligibility[5]
- Work requirements (ABAWD) apply to able-bodied adults 18-54 without dependents — but many exemptions exist (homelessness, veteran status, former foster youth, caregiving, disability, school enrollment)[2]
- The current 36-month ABAWD period runs Oct. 1, 2023 - Sept. 30, 2026; benefits limited to 3 months unless exempted[2]
- Household definition matters: must include everyone who lives with you AND buys and prepares food with you[3]
- Students may have additional eligibility requirements; check if you're under 17, over 50, disabled, or responsible for dependent care[4]

**Data shape:** Benefits scale by household size with a per-person increment. Income limits are 200% FPL for standard households but only 100% FPL (net) for elderly/disabled households, creating a significant eligibility advantage for seniors. Maine's elimination of asset limits (as of 2022) is a major expansion beyond federal rules. Work requirements create a complex eligibility matrix based on age, household composition, and exemption status, with geographic variation in waiver applicability.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/ofi/programs-services/food-supplement

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: For the 2025-2026 season, maximum gross household income limits are: 1 person - $3,070/month, $9,209/3 months, $36,836/12 months; 2 - $4,014/$12,043/$48,170; 3 - $4,959/$14,876/$59,504; 4 - $5,903/$17,710/$70,839; 5 - $6,848/$20,543/$82,173. For 6+ up to 10: 6-$89,700 (annual implied), 7-$91,739, 8-$93,777, 9-$95,816, 10-$97,855. Households >10 contact local CAA. TANF recipients automatically eligible at highest benefit level. Medical expenses may be deducted; apply even if over limits. Proof required for last 30 days or 12 months gross income (wages, SS, unemployment, pension, disability).[2][4][5]
- Assets: No asset limits mentioned in available sources.
- U.S. citizen, qualified alien, refugee, asylee, paroled >=1 year, deportation withheld, or conditional entry. Undocumented ineligible; mixed-status households eligible for qualifying members.
- Household includes all at address sharing utility/fuel, even non-expense sharers.
- Proof of citizenship/residency, SSN/DOB for all household members.

**Benefits:** One-time payment to utility/fuel provider for heating costs (oil, firewood, electricity, gas). Amount based on household size, income, fuel type, and factors like medical deductions. TANF recipients get highest benefit for size. Crisis: for emergencies (shutoff, broken heater, out of fuel). Max/min benefits vary but not specified numerically here; regular heating fall/winter, crisis year-round as needed. Cooling not offered.[1][2][5]
- Varies by: household_size|priority_tier

**How to apply:**
- Online via My Maine Connection (starting 2024; upload docs).
- In-person or phone appointment at local Community Action Agency (CAA)/CAP (many start July 1; contact for scheduling).
- Phone examples: Community Concepts 800-866-5588; statewide help 1-800-452-4668.

**Timeline:** Not specified; first-come first-served, funds limited.
**Waitlist:** No waitlist mentioned; apply early as funding may run out and demand up 20%. Respond immediately to doc requests.

**Watch out for:**
- Funding first-come first-served; apply ASAP, especially post-20% demand increase; agencies may close early.
- Household counts all at address on utility bill, unlike SNAP.
- Crisis only for true emergencies; regular seasonal (fall/winter heating).
- Even over income? Apply—deductions (medical, etc.) may qualify you.
- TANF auto-eligible at max benefit; use Notice of Decision as proof.
- Mixed immigration status: eligible members only.
- Apps incomplete without docs; upload/respond fast.

**Data shape:** Income table provided in 1/3/12-month formats; benefits scale by household size, income, fuel type, deductions; administered via local CAAs statewide with apply-early funding constraint; TANF auto-max benefit; no cooling aid.

**Source:** https://www.mainehousing.org/programs-services/energy/energydetails/liheap

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the federal poverty level. Income thresholds change annually; contact your local Community Action Agency for current dollar amounts specific to your household size.[1][3] Households receiving HEAP (Home Energy Assistance Program) benefits are often automatically eligible and have 'Categorical Income Eligibility.'[1][3]
- Assets: Not specified in available sources.
- Home must be in good structural condition.[2]
- Household must be eligible for HEAP or have income verified within the previous 12 months to be at or below 200% poverty level.[3]
- For rental units: landlord/building owner written authorization required, and at least 66% of units in the building must be occupied by income-eligible households.[3]
- Applicants must provide all required documentation to determine eligibility.[3]
- Some regional providers (e.g., Penquis) prioritize households with adults over 60, children 6 years and younger, and individuals with disabilities, and require that homes have not been weatherized in the past 15 years.[6]

**Benefits:** Free energy efficiency improvements with no cost to qualifying homeowners and renters. Typical projects include: blown-in cellulose insulation for attics, walls, and basements; air sealing (closing gaps and cracks); heating system repair or replacement; health and safety measures (ventilation, carbon monoxide detection, moisture control); weather-stripping; caulking; and some safety-related repairs. Central Heating Improvement Program (CHIP) grants may be used to repair or replace central heating systems.[1][2]
- Varies by: household_size (income eligibility thresholds vary by household size, though specific dollar amounts are not provided in search results)

**How to apply:**
- Contact your local Community Action Agency directly. In the Greater Portland area, contact The Opportunity Alliance.[1]
- For York County: York County Community Action Corporation (YCCAC) — contact Junelle Soucy, Energy Services Coordinator at 207-206-1261.[5]
- For Penquis service area: call (207) 974-2407.[6]
- General inquiries: MaineHousing administers the program; visit mainehousing.org or contact your regional Community Action Agency.

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources.

**Watch out for:**
- Income thresholds change annually — you must contact your local Community Action Agency to get current dollar amounts for your household size; the 200% poverty level figure alone is insufficient for determining eligibility.[1][3]
- HEAP eligibility often simplifies qualification, but it is not required — you can qualify based on income verification alone if your income is at or below 200% poverty level.[1][3]
- Both homeowners and renters qualify; you do not need to be on public assistance, though receiving HEAP or other benefits can streamline the process.[1]
- Homes must be in 'good structural condition' — severely damaged homes may not qualify.[2]
- For rental properties, landlord authorization is required, and at least 66% of units in the building must be income-eligible.[3]
- Some regional providers (e.g., Penquis) have a 15-year re-weatherization restriction — homes weatherized in the past 15 years may not qualify again.[6]
- Priority may be given to vulnerable populations (elderly, young children, individuals with disabilities) depending on your regional provider.[6]
- Processing time and waitlist status are not publicly specified — contact your local provider directly for current timelines.
- This is a grant program (free service), not a loan or rebate you apply for after work is completed.[1]

**Data shape:** WAP is a decentralized program administered by MaineHousing but delivered through regional Community Action Agencies, each with its own application process and contact information. Income eligibility is based on 200% of federal poverty level, which varies by household size and changes annually — specific dollar amounts must be obtained from your local provider. Benefits are fixed (free improvements) but the scope of work varies by individual home assessment. Priority criteria and re-weatherization restrictions vary by regional provider. No processing time, waitlist, or specific form information is publicly available in standard sources.

**Source:** https://www.mainehousing.org/programs-services/HomeImprovement/homeimprovementdetail/weatherization

---

### State Health Insurance Assistance Program (SHIP) - Maine Senior Health Insurance Assistance Program


**Eligibility:**
- Income: No income limits or asset limits. Open to all Maine residents with Medicare or expecting Medicare, including those 65+ and people with Medicare due to disability.
- Assets: No asset limits or test.
- Must be a Maine resident
- Must have Medicare or expect to have Medicare soon (includes older adults and those with Medicare due to disability)

**Benefits:** Free, confidential counseling services including: information on Medicare, Medicare Advantage, MaineCare, Medigap, and supplemental programs; preventive health benefits; Medicare Part D options; help with medical bills, claims, and notices. Counselors do not sell insurance or recommend policies.

**How to apply:**
- Phone: 1-800-262-2232
- Website: https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance
- In-person or local: Contact via phone for local counselors through Maine's five Area Agencies on Aging

**Timeline:** No formal application or processing time; services available immediately upon contact.

**Watch out for:**
- Not an insurance or financial aid program—provides counseling only, no direct payments or coverage.
- Counselors do not sell or recommend specific policies.
- Not limited to seniors; includes younger people with Medicare due to disability.
- Separate from MaineCare/Medicaid eligibility which has income/asset rules.
- No online application form; contact by phone or website to connect with counselor.

**Data shape:** no income test; open to all Medicare beneficiaries; service-based counseling only; delivered via regional Area Agencies on Aging but uniform benefits statewide

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance

---

### Home Delivered Meals (Maine Nutrition Services Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older, OR under 60 if on SSDI (Social Security Disability Insurance)[2][5]+
- Income: Not specified in available sources. Contact your local Area Agency on Aging for income eligibility thresholds.[6]
- Assets: Not specified in available sources.
- Must be homebound and unable to leave home without assistance[2]
- Must be unable to prepare a meal and have no one available to prepare a meal[2]
- Must be unable to prepare a nutritionally balanced meal due to physical or cognitive limitations[6]
- Maine resident[5]
- Must be home at time of delivery to receive meals[5]

**Benefits:** Home-delivered meals up to 5 days per week; meals are nutritionally balanced and prepared in USDA and FDA inspected kitchens[6]. Includes access to registered dietitians for private nutrition counseling, wellness information, and safety check-ins during delivery[6]
- Varies by: frequency (up to 5 days/week) and meal type (standard or pureed)

**How to apply:**
- Contact your local Area Agency on Aging (Maine has five regional AAAs)[6]
- Contact your local Aging & Disability Resource Center[6]
- Phone or in-person at your regional Area Agency on Aging office

**Timeline:** Providers must conduct an in-person assessment within 10 business days of referral to determine eligibility[1]
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limits are NOT specified in public materials — families must contact their local Area Agency on Aging directly to learn if they qualify financially[1][6]
- Delivery is NOT statewide for all providers. Some regional AAAs have county or geographic restrictions (e.g., Simply Delivered for ME excludes Brunswick)[5]
- Recipient MUST be home at delivery time; meals cannot be left unattended[5]
- Minimum order requirements may apply (e.g., Simply Delivered for ME requires minimum 3 meals)[5]
- This is distinct from private meal delivery services like Mom's Meals, which may be available at lower cost through health insurance but are separate programs[3][4]
- Processing includes a mandatory in-person assessment within 10 business days — this is not a phone-only application[1]
- Meals are typically purchased in advance at nominal cost ($9.00–$11.00 per meal depending on type), not free[5]
- Specific income thresholds, asset limits, and priority tier systems are not publicly detailed — these must be obtained directly from your regional AAA

**Data shape:** This program is regionally fragmented across five Area Agencies on Aging with different service areas, costs, and eligibility criteria. No statewide income or asset limits are published; families must contact their local AAA. Eligibility is based on functional need (homebound, unable to prepare meals) rather than income alone, but income may be a factor. The program includes both meals and supportive services (nutrition counseling, safety check-ins). Costs are nominal but not free. Geographic restrictions are significant — not all regions serve all counties.

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/food-and-nutrition[6]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in current sources; families must verify current federal poverty guidelines via official channels[2][5].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Looking for work
- U.S. citizen or authorized to work
- Enrollment priority: veterans and qualified spouses first, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users[5]

**Benefits:** Part-time paid training (average 20 hours/week) at highest applicable minimum wage (federal, state, or local), placed at nonprofits or public agencies (e.g., schools, hospitals, senior centers) for hands-on experience in fields like healthcare, administration, food prep, customer service; includes on-site training, workshops, CareerCenter services, and supportive services (e.g., assistance with qualifying expenses for training/employment success)[1][3][5][6]. Positions are temporary/transitional to unsubsidized jobs.
- Varies by: priority_tier

**How to apply:**
- Online: Maine Department of Labor's Work Source Maine Virtual CareerCenter (https://www.myworksourcemaine.gov/resources/senior-community-service-employment-program-scsep-associates-training-development)[1][2]
- Phone: (800) 439-3307 (A4TD provider)[4]
- Online orientation webinars via Zoom (e.g., https://zoom.us/j/95908370915, Meeting ID: 959 0837 0915; check for current sessions)[4]
- In-person: Maine CareerCenters statewide; contact Area Agencies on Aging (AAAs) for information/referral[2]
- Mail/in-person: Via AAAs or providers like A4TD (https://www.a4td.org)[2][4]

**Timeline:** Not specified in sources.
**Waitlist:** Capacity limited to ~122 participants statewide; new enrollees enter as others transition to employment[3]

**Watch out for:**
- Temporary training only (not permanent jobs); must actively seek unsubsidized employment[6]
- Strict priority tiers may delay entry for non-priority applicants[5]
- Income test at 125% FPL (lower than some programs); verify current FPL amounts as they change yearly
- Limited slots (~122 statewide); waitlist likely when full[3]
- Must attend training/workshops and use CareerCenter services[1]

**Data shape:** Dual state/national grants split by counties (state: Cumberland/Lincoln/part York; national: rest); priority enrollment tiers; capacity-capped with rolling entry on transitions; income-based at 125% FPL without asset test

**Source:** https://www.myworksourcemaine.gov/resources/senior-community-service-employment-program-scsep-associates-training-development or https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/scsep[1][2]

---

### Maine Legal Services for the Elderly

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Specific dollar amounts or tables not detailed in sources; services targeted to 'socially and economically needy' elderly, often at or below 200% of federal poverty guidelines based on similar programs, but exact limits determined case-by-case for priority[2][4][7].
- Assets: No asset limits specified in sources.
- Maine resident
- Basic human needs at stake (e.g., MaineCare/Medicare issues, elder abuse, housing, public benefits)
- Priority for those with income-related barriers; referrals if ineligible[2][4][9]

**Benefits:** Free legal services including information, advice, and representation on: Medicare/MaineCare disputes, health coverage, elder abuse/protection orders, housing (eviction/foreclosure), consumer debt, public assistance benefits, guardianship, discharges from care, powers of attorney, health care advance directives, Medicare Part D prescription drug assistance[2][4][9].
- Varies by: priority_tier

**How to apply:**
- Phone: Helpline 1-800-750-5353 (in-state) or 207-623-1797[2][4][6][9]
- Website: https://mainelse.org for information and Elder Rights Handbook[2][9]
- In-person: Attorneys in offices across the state for representation cases[4]

**Timeline:** Not specified.

**Watch out for:**
- Not a general entitlement; services prioritized for those with basic needs at stake and economic need—may get advice/referral only[2][4]
- Avoid pre-printed powers of attorney forms from stores/internet as some are invalid in Maine; consult LSE attorney[2]
- If ineligible, referred to private attorneys possibly at reduced fees[4]
- Focuses on non-criminal civil legal issues, not broad healthcare/financial aid[4]

**Data shape:** No fixed income/asset tables; eligibility prioritizes 'socially and economically needy' with case-by-case review; statewide helpline with regional attorney offices; services are legal advocacy, not direct financial or in-kind aid

**Source:** https://mainelse.org[9]

---

### Maine SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits for SHIP eligibility. SHIP is available to all older people and people who have Medicare because of a disability, regardless of income.[4]
- Must be an older adult OR have Medicare because of a disability[4]
- No citizenship or residency requirements stated for SHIP itself (distinct from Medicaid)

**Benefits:** Free, confidential one-on-one health insurance counseling and information. Specific services include: information about Medicare Part A and B, Medicare Prescription Drug Coverage (Part D), Medicare Supplement Insurance (Medigap), Medicare Advantage Plans, long-term care insurance, Medicare Savings Programs (QMB, SLMB, QI), prescription drug assistance programs, Medicaid, and other insurance programs. Counselors help beneficiaries enroll in Medicare, compare and change Medicare Advantage and Part D plans, answer questions about state Medigap protections, and provide information about local agencies offering home care and long-term care services.[3][4][6]

**How to apply:**
- Phone: 1-800-262-2232 (toll-free)[5][7]
- In-person: Office of Aging and Disability Services, 11 State House Station, 41 Anthony Ave., Augusta, ME 04333[5]
- Email: Anna.Fox@maine.gov[5]
- Regional appointments available through Area Agencies on Aging (e.g., Southern Maine Agency on Aging: 207-396-6524 for phone, Zoom, or in-person appointments)[8]

**Timeline:** Not specified in search results. Counseling is typically provided by appointment.[8]
**Waitlist:** Not mentioned in search results.

**Watch out for:**
- SHIP is NOT a financial assistance program itself — it is a counseling and referral service. Families often confuse SHIP with Medicare Savings Programs (MSP), which DO provide financial assistance for premiums and costs. SHIP counselors help you determine if you qualify for MSP or other assistance programs.[3][4][9]
- SHIP counselors do not sell insurance or recommend specific policies — they provide unbiased information to help you make your own decisions.[4][8]
- SHIP can help you apply for related programs like Medicare Savings Programs (QMB, SLMB, QI) and MaineCare, which have their own income and asset limits.[3][6][9]
- If seeking financial assistance for Medicare costs, you need to separately apply for Medicare Savings Programs (MSP), which have specific income limits ($1,183/month for singles, $1,637/month for couples) and asset limits ($10,000 for singles, $15,000 for couples).[3]
- SHIP services are free and confidential — there is no cost for counseling.[4][8]
- Hours of operation: 9:00 AM–5:00 PM Monday–Thursday, 9:00 AM–4:00 PM Friday[5]

**Data shape:** SHIP is a counseling and advocacy program, not a direct financial assistance program. It serves as a gateway to other programs (Medicare Savings Programs, MaineCare, prescription drug assistance). Eligibility is universal for Medicare beneficiaries and older adults — there are no income, asset, or other restrictive requirements. The program's value lies in personalized guidance rather than direct benefits. Regional variations exist in how appointments are offered (phone, Zoom, in-person) and which Area Agencies on Aging serve different parts of the state, but the core services and eligibility are statewide and uniform.

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance

---

### Legal Services for Maine Elders (LSE)


**Eligibility:**
- Age: 60+
- Income: No specific dollar amounts or tables provided in sources; eligibility based on being 'socially and/or economically needy' for persons age 60 and over. Other legal aid programs reference up to 200% of federal poverty guidelines, but not explicitly confirmed for LSE[2][4].
- Assets: No asset limits or details on what counts/exempts mentioned in sources.
- Maine resident
- Age 60 and over
- Basic human needs at stake (e.g., health care, housing, abuse)
- Non-criminal legal problems

**Benefits:** Free legal advice, information, and in some cases representation on: health care, health insurance, Medicare (including Part D), MaineCare (Medicaid), Social Security/public benefits, pension/retirement benefits, powers of attorney, consumer matters (creditor/debt/bankruptcy), physical/financial abuse, guardianship defense, housing (eviction/foreclosure), elder abuse/protection orders, discharges, health care advance directives. Medicare Part D Unit for prescription drug issues[2][3][7].

**How to apply:**
- Phone: Helpline 1-800-750-5353 (in-state) or 207-623-1797; Medicare Part D Unit: 1-877-774-7772
- Website: www.mainelse.org
- In-person: Attorneys in offices across the state for representation cases

**Timeline:** Not specified in sources.
**Waitlist:** Limited resources mean not all demands can be met; referrals to private attorneys if unable to help[3][4].

**Watch out for:**
- Limited resources; may not take all cases and provide referrals instead[3][4]
- Helpline hours: 9am-12pm and 1pm-4pm[3]
- Focus on non-criminal matters; separate Medicare Part D unit with different phone[2][3]
- Partnership with Area Agencies on Aging, but contact LSE directly[2]

**Data shape:** No fixed income/asset tables or strict financial tests detailed; eligibility emphasizes 'socially/economically needy' age 60+ Maine residents; statewide with offices but resource-limited; helpline primary access with potential representation.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/legal-assistance and https://mainelse.org[2][7]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| MaineCare Elderly and Adults with Disabi | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Home Delivered Meals (Maine Nutrition Se | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Maine Legal Services for the Elderly | resource | state | simple |
| Maine SHIP (State Health Insurance Assis | resource | federal | simple |
| Legal Services for Maine Elders (LSE) | navigator | state | simple |

**Types:** {"benefit":6,"resource":3,"employment":1,"navigator":1}
**Scopes:** {"state":5,"federal":6}
**Complexity:** {"deep":6,"simple":4,"medium":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/ME/drafts.json`.

- **MaineCare Elderly and Adults with Disabilities Waiver** (benefit) — 3 content sections, 6 FAQs
- **Home and Community-Based Services (HCBS) Waivers (e.g., MaineCare In-Home Services)** (benefit) — 4 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **household_size and income**: 1 programs
- **household_size|priority_tier**: 1 programs
- **household_size (income eligibility thresholds vary by household size, though specific dollar amounts are not provided in search results)**: 1 programs
- **not_applicable**: 3 programs
- **frequency (up to 5 days/week) and meal type (standard or pureed)**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MaineCare Elderly and Adults with Disabilities Waiver**: Statewide with waitlist; benefits detailed by service type with tiered/priority access; dual eligibility determination (financial + functional); monthly/annual service caps updated periodically[1][2][3]
- **Home and Community-Based Services (HCBS) Waivers (e.g., MaineCare In-Home Services)**: Requires NHLOC equivalent to nursing facility; benefits individualized by assessment tier; statewide but local offices/ADRCs handle intake; strict financial lookback and patient liability.
- **SNAP (Supplemental Nutrition Assistance Program)**: Benefits scale by household size with a per-person increment. Income limits are 200% FPL for standard households but only 100% FPL (net) for elderly/disabled households, creating a significant eligibility advantage for seniors. Maine's elimination of asset limits (as of 2022) is a major expansion beyond federal rules. Work requirements create a complex eligibility matrix based on age, household composition, and exemption status, with geographic variation in waiver applicability.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income table provided in 1/3/12-month formats; benefits scale by household size, income, fuel type, deductions; administered via local CAAs statewide with apply-early funding constraint; TANF auto-max benefit; no cooling aid.
- **Weatherization Assistance Program (WAP)**: WAP is a decentralized program administered by MaineHousing but delivered through regional Community Action Agencies, each with its own application process and contact information. Income eligibility is based on 200% of federal poverty level, which varies by household size and changes annually — specific dollar amounts must be obtained from your local provider. Benefits are fixed (free improvements) but the scope of work varies by individual home assessment. Priority criteria and re-weatherization restrictions vary by regional provider. No processing time, waitlist, or specific form information is publicly available in standard sources.
- **State Health Insurance Assistance Program (SHIP) - Maine Senior Health Insurance Assistance Program**: no income test; open to all Medicare beneficiaries; service-based counseling only; delivered via regional Area Agencies on Aging but uniform benefits statewide
- **Home Delivered Meals (Maine Nutrition Services Program)**: This program is regionally fragmented across five Area Agencies on Aging with different service areas, costs, and eligibility criteria. No statewide income or asset limits are published; families must contact their local AAA. Eligibility is based on functional need (homebound, unable to prepare meals) rather than income alone, but income may be a factor. The program includes both meals and supportive services (nutrition counseling, safety check-ins). Costs are nominal but not free. Geographic restrictions are significant — not all regions serve all counties.
- **Senior Community Service Employment Program (SCSEP)**: Dual state/national grants split by counties (state: Cumberland/Lincoln/part York; national: rest); priority enrollment tiers; capacity-capped with rolling entry on transitions; income-based at 125% FPL without asset test
- **Maine Legal Services for the Elderly**: No fixed income/asset tables; eligibility prioritizes 'socially and economically needy' with case-by-case review; statewide helpline with regional attorney offices; services are legal advocacy, not direct financial or in-kind aid
- **Maine SHIP (State Health Insurance Assistance Program)**: SHIP is a counseling and advocacy program, not a direct financial assistance program. It serves as a gateway to other programs (Medicare Savings Programs, MaineCare, prescription drug assistance). Eligibility is universal for Medicare beneficiaries and older adults — there are no income, asset, or other restrictive requirements. The program's value lies in personalized guidance rather than direct benefits. Regional variations exist in how appointments are offered (phone, Zoom, in-person) and which Area Agencies on Aging serve different parts of the state, but the core services and eligibility are statewide and uniform.
- **Legal Services for Maine Elders (LSE)**: No fixed income/asset tables or strict financial tests detailed; eligibility emphasizes 'socially/economically needy' age 60+ Maine residents; statewide with offices but resource-limited; helpline primary access with potential representation.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Maine?
