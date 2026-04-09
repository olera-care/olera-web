# Louisiana Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 1.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 14 |
| New (not in our data) | 9 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 3 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 10 programs
- **financial**: 2 programs
- **employment**: 1 programs
- **unknown**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `No minimum age requirement for household members, but special rules apply to households with members 60 or older[1][7]` ([source](https://dcfs.louisiana.gov/page/524 and https://ldh.la.gov/page/esap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly SNAP benefits that help eligible low-income households buy food[9]. Specific benefit amounts vary by household size and income. Example: 2-person elderly/disabled household with $1,200 gross income receives $415/month SNAP allotment[8]. Beginning October 1, 2025, more than 400,000 Louisiana households received a modest increase in monthly SNAP benefits due to annual cost-of-living adjustment[5]` ([source](https://dcfs.louisiana.gov/page/524 and https://ldh.la.gov/page/esap))
- **source_url**: Ours says `MISSING` → Source says `https://dcfs.louisiana.gov/page/524 and https://ldh.la.gov/page/esap`

### LIHEAP (Low-Income Home Energy Assistance Program)

- **income_limit**: Ours says `$2794` → Source says `$2,551` ([source](https://www.lhc.la.gov/energy-assistance))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Regular LIHEAP: $200–$800 per season (heating or cooling). Crisis LIHEAP: up to $1,000 for emergency situations (broken furnace, utility shutoff notice, running out of fuel)[2]. Benefits are one-time payments made directly to utility companies[2].` ([source](https://www.lhc.la.gov/energy-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://www.lhc.la.gov/energy-assistance`

### Louisiana Senior Health Insurance Information Program (SHIP)

- **benefit_value**: Ours says `Free counseling service` → Source says `Free, unbiased, personalized one-on-one health insurance counseling and guidance on Medicare coverage options, benefits, enrollment, appeals, prescription drug plans, and applying for low-income assistance programs like Medicaid, Medicare Savings Program, and Extra Help/Low Income Subsidy; provided via telephone or face-to-face sessions; also includes outreach presentations, enrollment events, and fraud prevention education through Senior Medicare Patrol[1][2][4][5].` ([source](https://www.ldi.la.gov/consumers/senior-health-shiip[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.ldi.la.gov/consumers/senior-health-shiip[4]`

### Louisiana Senior Legal Helpline

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.capitalaaa.org/programs/legal-services/ (via Capital Area Agency on Aging, referencing SLLS)[1]))
- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free legal representation, advocacy, and legal education for low-income seniors on civil legal issues.[1]` ([source](https://www.capitalaaa.org/programs/legal-services/ (via Capital Area Agency on Aging, referencing SLLS)[1]))
- **source_url**: Ours says `MISSING` → Source says `https://www.capitalaaa.org/programs/legal-services/ (via Capital Area Agency on Aging, referencing SLLS)[1]`

### Louisiana Long-Term Care Ombudsman Program

- **source_url**: Ours says `MISSING` → Source says `https://goea.louisiana.gov/services/louisiana-ombudsman-program/`

## New Programs (Not in Our Data)

- **Louisiana Medicaid Home and Community-Based Services (HCBS) Waivers** — service ([source](https://ldh.la.gov/office-of-aging-and-adult-services/community-choices-waiver-ccw))
  - Shape notes: Multiple waivers under HCBS umbrella (e.g., CCW primary for elderly NFLOC); priority-based access with waitlists; financials tie to LTC Medicaid/SSI limits; services via licensed providers, varies by assessed needs and region
- **Louisiana Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://ldh.la.gov/assets/docs/OAAS/Manuals/PACE-Manual.pdf))
  - Shape notes: Limited to 4 regional providers/service areas; Medicaid financial test with specific LA income/asset caps; NFLOC via multi-step assessment (LOCET + iHC); benefits per individualized plan, not fixed hours/dollars
- **Meals on Wheels - Louisiana Council on Aging** — service ([source](No single statewide .gov; local parish Councils on Aging sites (e.g., terrebonnecoa.org, caddocoa.org); Governor’s Office of Elderly Affairs assessment tool referenced[3].))
  - Shape notes: Parish-administered by local Councils on Aging with varying providers, wait times, donation amounts, and exact delivery schedules; requires local contact; pre-qual assessment in some areas; priority to greatest need.
- **Louisiana Respite Care Program** — service ([source](https://ldh.la.gov/faq/category/94 (LDH Respite FAQ); https://archrespite.org/wp-content/uploads/2022/09/louisiana.pdf (ARCH overview).[2][7]))
  - Shape notes: Fragmented across waivers/populations (elderly via LT-PCS/Medicare, DD via OCDD, children via CSOC); hour caps and enrollment limits; provider-focused regs heavy; no central eligibility table—income/assets via Medicaid where applicable.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://goea.louisiana.gov/services/senior-community-service-employment-program-scsep/))
  - Shape notes: Income at 125% FPL (varies by household size, annual updates); parish-specific directors create regional variations; priority enrollment tiers; no fixed asset test
- **Community Choices Waiver** — service ([source](https://ldh.la.gov/page/community-choices-waiver (based on LDH OAAS PDFs)[5][6]))
  - Shape notes: Priority-based waitlist with 5+ tiers; no 24/7 services; spend-down and asset exemptions allow higher-income qualification; NFLOC assessment drives everything; statewide but phone-registry only application noted
- **Louisiana Long Term–Personal Care Services (LT-PCS)** — service ([source](https://ldh.la.gov/office-of-aging-and-adult-services/LTPCS))
  - Shape notes: LT-PCS eligibility is highly individualized and multi-layered: it requires simultaneous qualification across financial criteria (income/assets), functional criteria (NFLOC via LOCET), situational criteria (one of three specific circumstances), and administrative criteria (Medicaid enrollment, care direction ability). Benefits are not fixed dollar amounts or hours but are determined through individual assessment. Income limits are dynamic (based on care costs, not fixed thresholds). Search results lack specific application procedures, processing timelines, waitlist information, and regional office details — families will need to contact OAAS directly for operational details.
- **COAHELPS (East Baton Rouge Council on Aging)** — service ([source](https://ebrcoa.org/))
  - Shape notes: Parish-restricted to East Baton Rouge; no fixed income/asset tables; benefits are service-based with availability limits; multiple one-off aids vs. ongoing entitlements
- **Lotus Rides (EBRCOA Transportation)** — service ([source](https://ebrcoa.org/transportation/))
  - Shape notes: Restricted to East Baton Rouge Parish seniors attending EBRCOA senior centers; no income/asset tests; application in-person only at senior centers; demand-response with advance booking required.

## Program Details

### Louisiana Medicaid Home and Community-Based Services (HCBS) Waivers

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Must meet Louisiana Long-Term Care (LTC) Medicaid financial eligibility, which follows SSI-related income limits (typically around $943/month for an individual in 2023, subject to annual updates; exact current amounts require checking LDH Medicaid eligibility charts as they vary by household size and are not specified in fixed tables here). Couples use shared limits per Medicaid policy[1][2][4].
- Assets: Countable assets limited to SSI resource limit ($2,000 for individual, $3,000 for couple). Countable: cash, bank accounts, investments, secondary property. Exempt: primary home, household furnishings, appliances, personal effects, one vehicle. 60-month Look-Back Rule applies; transfers below fair market value result in penalty period[1][2].
- Louisiana resident
- Meet Nursing Facility Level of Care (NFLOC): inability to perform Activities of Daily Living (ADLs) independently, unstable medical conditions, need for therapies, or cognitive impairments (e.g., dementia-related); diagnosis alone insufficient[1][4]
- At risk of nursing home placement
- Priority groups get first access: 1) Abuse/neglect referrals, 2) ALS diagnosis, 3) Permanent Supportive Housing residents, 4) Nursing home residents (Medicaid sole payer), 5) Expedited needs with 32 hours LT-PCS approval, 6) Not receiving PACE, LT-PCS, or other HCBS waivers[1][4]

**Benefits:** Adult day health care, caregiver temporary support (respite), support coordination, financial management, personal care attendant, monitored in-home care, and other HCBS like adult day care, family support, substitute family care, supervised independent living, supported employment. Specific hours/dollars not fixed; based on assessed needs and NFLOC[1][7][8].
- Varies by: priority_tier

**How to apply:**
- Contact Louisiana Department of Health (LDH) Office of Aging and Adult Services for CCW: visit https://ldh.la.gov/office-of-aging-and-adult-services/community-choices-waiver-ccw[4]
- Call local Medicaid office or Healthy Louisiana helpline (1-855-618-2229 inferred from general Medicaid contacts; confirm via LDH)
- Physician completes medical evaluation report; apply via Medicaid eligibility worker, support coordinator[2][4]
- In-person at regional offices or nursing homes for priority referrals[1][4]

**Timeline:** Not specified; medical certification via Level I/II assessment, eligibility from later of financial date or OBH/OCDD approval[2].
**Waitlist:** Yes, limited slots; priority groups offered opportunities first, others waitlisted[1][2][4].

**Watch out for:**
- Multiple HCBS waivers exist (e.g., CCW for elderly/disabled 21+, Supports for developmental disabilities 18+); CCW is primary for elderly but excludes those in other programs like PACE or LT-PCS[1][3][4]
- Must meet NFLOC, not just diagnosis; dementia alone insufficient[1]
- Priority tiers mean non-priority face long waitlists[4]
- 60-month Look-Back penalizes asset transfers[1]
- Limited enrollment; not guaranteed even if eligible[2]

**Data shape:** Multiple waivers under HCBS umbrella (e.g., CCW primary for elderly NFLOC); priority-based access with waitlists; financials tie to LTC Medicaid/SSI limits; services via licensed providers, varies by assessed needs and region

**Source:** https://ldh.la.gov/office-of-aging-and-adult-services/community-choices-waiver-ccw

---

### Louisiana Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Medicaid financial eligibility required: Individual income no more than $2,163 per month; married couples (both receiving services) no more than $4,326 per month. General Medicaid long-term care threshold is 300% of Federal Benefit Rate ($2,901/month in 2025). Limits may vary; pathways exist to qualify via spend-down[1][3][5].
- Assets: Individual: less than $2,000 in resources; married couples (both receiving services): less than $3,000. Primary home typically excluded[3][5].
- Live in a PACE provider service area (specific zip codes in Greater New Orleans, Baton Rouge/East-West Baton Rouge, Lafayette, Alexandria/Rapides/Avoyelles)[1][2][6]
- Nursing Facility Level of Care (NFLOC) certified via LOCET screening and iHC assessment[1]
- Able to live safely in community with PACE services (no 24/7 skilled care need, ability to call for help, non-condemned residence)[1]
- Not enrolled in Medicare Advantage, hospice, or certain other programs[4]

**Benefits:** Comprehensive, individualized services including primary care, hospital/inpatient, emergency, short-term respite, home care (personal care, homemaker, nursing), therapies (OT/PT/ST), social services, adult day health, meals, transportation, prescription drugs, dental, vision, assistive devices; all Medicare/Medicaid-covered plus additional as needed per plan of care, at no extra cost beyond premiums/cost-sharing[1][2][4][5].
- Varies by: region

**How to apply:**
- Phone: Baton Rouge – 225-490-0604; Greater New Orleans – 504-945-1531; Alexandria – 337-470-4500; Lafayette – 318-206-1020[2]
- Contact local PACE provider for assessment; no specific online URL or form named in sources[1][2]

**Timeline:** Not specified; involves LOCET screening, iHC assessment, and plan of care development[1]
**Waitlist:** Not mentioned; potential regional variation[2]

**Watch out for:**
- Not statewide—must live in specific service areas/zips; check exact coverage[1][2]
- Medicaid eligibility required (financial criteria apply, though spend-down possible); ~90% dual Medicare/Medicaid[3][4][5]
- NFLOC confirmed only after full iHC assessment, not just initial screening[1]
- Must be able to live safely in community at enrollment; no 24/7 care needs[1]
- Voluntary enrollment; can disenroll but process involves assessments[1][4]

**Data shape:** Limited to 4 regional providers/service areas; Medicaid financial test with specific LA income/asset caps; NFLOC via multi-step assessment (LOCET + iHC); benefits per individualized plan, not fixed hours/dollars

**Source:** https://ldh.la.gov/assets/docs/OAAS/Manuals/PACE-Manual.pdf

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: No minimum age requirement for household members, but special rules apply to households with members 60 or older[1][7]+
- Income: {"standard_households":"Gross income must not exceed 130% of Federal Poverty Level (approximately $3,250/month for household of four as of 2025)[5]","bbce_households":"Broad-Based Categorically Eligible (BBCE) households: gross income up to 200% FPL[7]","elderly_or_disabled_households":"Only must meet net income limit of 100% FPL; no gross income limit[1][7]. Specific monthly gross income limits for elderly/disabled households: 1 person $2,608/month, 2 people $3,526/month, 3 people $4,442/month, 4 people $5,358/month, 5 people $6,276/month, 6 people $7,192/month, 7 people $8,108/month, each additional person +$916/month[1]","note":"Louisiana has expanded eligibility beyond federal requirements[1]"}
- Assets: {"louisiana_standard":"No asset limit in Louisiana for most households[1]","federal_alternative":"Households with member 60+ or disabled who exceed gross income limit can qualify under federal rules with $4,500 asset limit[1]","what_counts":"Countable resources like funds in bank accounts[1]","what_is_exempt":"Home and vehicles are not counted as resources[1]"}
- Must be a resident of Louisiana[7]
- Must be a U.S. citizen or lawfully present non-citizen[7]
- Must have a Social Security number or proof of application for one[7]
- Able-bodied adults aged 18-49 without dependents must work or participate in training for at least 20 hours per week, or limited to 3 months of benefits in 36-month period (work requirements apply statewide as of October 1, 2024)[5]
- For Elderly Simplified Application Project (ESAP): must be 60+ or disabled AND have no earned income[6]

**Benefits:** Monthly SNAP benefits that help eligible low-income households buy food[9]. Specific benefit amounts vary by household size and income. Example: 2-person elderly/disabled household with $1,200 gross income receives $415/month SNAP allotment[8]. Beginning October 1, 2025, more than 400,000 Louisiana households received a modest increase in monthly SNAP benefits due to annual cost-of-living adjustment[5]
- Varies by: household_size

**How to apply:**
- Online application (specific URL not provided in search results; contact Louisiana Department of Children & Family Services)
- Phone: Contact your parish Council on Aging for assistance[4]
- In-person: Parish Council on Aging offices[4]
- Mail: (specific address not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Louisiana has expanded eligibility beyond federal requirements — income limits are higher than standard federal SNAP[1]
- Households with elderly (60+) or disabled members have dramatically different eligibility rules: they only need to meet net income limits, not gross income limits, making qualification much easier[1][7]
- For ESAP (Elderly Simplified Application Project): eligible seniors are certified for up to 36 months instead of typical shorter periods, and recertification interviews are waived — but this only applies to households with ONLY elderly members and NO earned income[2][6]
- Seniors must reapply every year for Senior Farmers Market Nutrition Program (SFMNP) — they do not automatically renew[4]
- Work requirements apply to able-bodied adults 18-49 without dependents statewide as of October 1, 2024; failure to meet work requirements limits benefits to 3 months in a 36-month period[5]
- Income counts include Social Security, veterans' benefits, and disability payments — not just wages[3]
- The household must include everyone who lives with you AND buys and prepares food with you for SNAP purposes[3]
- Asset limits vary depending on which eligibility pathway is used: no limit under Louisiana rules, but $4,500 under federal alternative rules for elderly/disabled[1]

**Data shape:** SNAP in Louisiana has a bifurcated eligibility structure: standard households follow federal 130% FPL gross income rules, but households with elderly (60+) or disabled members follow different rules (net income only, no gross income limit). This creates two distinct pathways to qualification. Additionally, Louisiana offers ESAP, a simplified application process specifically for elderly households with no earned income, which extends certification to 36 months and waives recertification interviews. Benefits scale by household size and income. The program is statewide but application assistance is distributed through parish Councils on Aging.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dcfs.louisiana.gov/page/524 and https://ldh.la.gov/page/esap

---

### LIHEAP (Low-Income Home Energy Assistance Program)


**Eligibility:**
- Income: Household gross monthly income must be at or below 60% of Louisiana's estimated state median income. Income limits by household size: 1 person: $2,551/month | 2 people: $3,336/month | 3 people: $4,121/month | 4 people: $4,906/month | 5 people: $5,691/month | 6 people: $6,477/month | 7+ people: add $110 per additional member over 6[2][3]. Note: Some parishes provide annual income limits in addition to monthly limits (e.g., Jefferson Parish lists annual limits ranging from $30,612 for 1 person to $68,851 for 6 people)[3].
- Assets: Not specified in available search results. Contact your local parish agency for asset limit information.
- Applicant must be responsible for the household energy bill[4][5]
- Applicant must have an active heating/cooling utility account[4][5]
- Applicant may only receive one LIHEAP benefit each season[4][5]
- Households must contain at least one individual who is: 0 to 5 years old, disabled, or 60 years or older (priority targeting, though not explicitly stated as absolute requirement)[3]
- Must be a Louisiana resident; some programs require residency in specific parishes (e.g., Jefferson Parish residents for that office)[3]

**Benefits:** Regular LIHEAP: $200–$800 per season (heating or cooling). Crisis LIHEAP: up to $1,000 for emergency situations (broken furnace, utility shutoff notice, running out of fuel)[2]. Benefits are one-time payments made directly to utility companies[2].
- Varies by: household_size and fuel_type_and_season

**How to apply:**
- Online portal: Available April 1–April 12, 2026 for cooling season (specific dates vary by year)[5]
- In-person at local parish agencies: April 13–September 30, 2026 (normal local intake procedures)[5]
- Phone: Contact your local parish Community Center or agency (appointments first-come, first-serve)[3]
- Mail: Mail applications to your local parish LIHEAP office (specific addresses vary by parish)

**Timeline:** Applications completed through online portal processed for payment between May 1–July 15, 2026. Local agencies will contact applicants if information is missing or incomplete between April–July 2026[5]. Crisis assistance typically processed faster due to emergency nature.
**Waitlist:** No formal waitlist mentioned, but assistance is contingent upon availability of funding. Applications taken on first-come, first-serve basis[3][4][5].

**Watch out for:**
- Program is NOT available year-round. Heating assistance: November 15–March 31 (or December 15–March 31 depending on source). Cooling assistance: April 1–September 30 (or April 13–September 30 depending on source). Crisis assistance: October 1–September 30[2][4][5]. Verify exact dates with your local agency.
- One benefit per season maximum—applicants cannot receive both heating and cooling assistance in the same year[4][5].
- Funding is not guaranteed. Assistance is contingent upon availability of funding, and applications are processed on first-come, first-serve basis[3][4][5].
- Online applications only available during specific windows (e.g., April 1–12, 2026 for cooling season). Outside these windows, applicants must apply in-person or by other local methods[5].
- LHC and local agencies will NEVER ask for account logins, passwords, or bank/credit card information. Beware of scams[5].
- Utility bills must be current (no older than 30 days). Outdated bills will delay processing[3][5].
- Applicant must be responsible for the household energy bill—renters may qualify if they pay utilities directly, but this must be verified[4][5].
- Households with roommates covered by the same utility bill are counted as a single LIHEAP household, which may affect income limits[2].
- Priority targeting includes households with members 0–5 years old, disabled, or 60+ years old, but this is not explicitly stated as an absolute requirement in all sources[3].
- Crisis assistance limited to once per year[4].

**Data shape:** LIHEAP benefits are highly seasonal and funding-dependent. Income limits scale by household size with a base amount plus per-person increments. Benefits are fixed dollar amounts ($200–$800 regular, $1,000 crisis) rather than percentage-based. The program operates on a fiscal-year cycle with distinct heating and cooling seasons. Application windows are time-limited, particularly for online applications. Regional variation exists in implementation through local parish agencies, but eligibility criteria and benefit amounts appear standardized statewide. The program prioritizes but does not exclusively serve households with elderly members, children, or disabled individuals.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.lhc.la.gov/energy-assistance

---

### Louisiana Senior Health Insurance Information Program (SHIP)


**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries, including those with limited incomes, under age 65 with disabilities, and dually eligible for Medicare and Medicaid[2][4].
- Assets: No asset limits or tests apply[2].
- Must be a Medicare beneficiary (Part A, Part B, Medicare Advantage, or Part D enrollees); families and caregivers also eligible for assistance[1][2][4]

**Benefits:** Free, unbiased, personalized one-on-one health insurance counseling and guidance on Medicare coverage options, benefits, enrollment, appeals, prescription drug plans, and applying for low-income assistance programs like Medicaid, Medicare Savings Program, and Extra Help/Low Income Subsidy; provided via telephone or face-to-face sessions; also includes outreach presentations, enrollment events, and fraud prevention education through Senior Medicare Patrol[1][2][4][5].

**How to apply:**
- Phone: 1-800-259-5300 or (225) 342-5301[1][3][4][7]
- Website: https://www.ldi.la.gov/consumers/senior-health-shiip (for information, updates signup, and find local counselor)[1][3][4][7]
- In-person or face-to-face: Local counselors available throughout Louisiana (find via website or phone)[4][6]

**Timeline:** Immediate assistance via phone or sessions; no formal application processing[4].

**Watch out for:**
- Not a healthcare or financial aid program—provides counseling only, does not pay premiums or provide direct benefits; during Medicare Open Enrollment (Oct 15-Dec 7), high demand may require scheduling; must be Medicare beneficiary for core services[2][4][5]
- People miss that it helps with applications for other programs like Extra Help but does not guarantee approval[2]

**Data shape:** no income or asset test; counseling-only service for Medicare beneficiaries statewide via phone/local counselors

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ldi.la.gov/consumers/senior-health-shiip[4]

---

### Meals on Wheels - Louisiana Council on Aging

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits statewide; priority given to those with greatest economic/social need, including low-income minority/Native American individuals. Some programs encourage donations ($1-$3/meal) but no one denied for inability to pay. Vary by parish; follows federal poverty guidelines in some cases[1][3].
- Assets: No asset limits mentioned across sources.
- Homebound and unable to shop/cook/prepare meals due to physical disability or mobility issues[1][2][3][4][5][6]
- Live in the service parish/region[3][4]
- Pre-qualified via Governor’s Office of Elderly Affairs assessment tool in some parishes (e.g., Terrebonne)[3]
- No daily family/friend support for meals[4]
- Annual assessments required for ongoing eligibility[4]

**Benefits:** Home-delivered nutritious meals (1/3 daily nutrition for 60+), low/no salt, customizable for dietary needs; typically 5 meals/week (Mon-Thu hot/fresh + Thu frozen for Fri); may extend to spouse/eligible caregiver[3][4][5].
- Varies by: region

**How to apply:**
- Contact local parish Council on Aging (e.g., Terrebonne: terrebonnecoa.org[3]; Caddo: caddocoa.org[4]; Lafayette: laf-coa.org[6]; DeSoto: desotocouncilonaging.com[5])
- Phone national directory: 1-888-998-6325[1]
- In-person or mail via local provider
- Phone/paper/online via local agency; referrals accepted for others[1][2]

**Timeline:** Varies by provider; urgent cases faster[1].
**Waitlist:** Yes in some parishes (e.g., very long in Caddo Parish)[4]; regional variation.

**Watch out for:**
- Not emergency service; deliveries require someone home, eat upon delivery[4]
- Long waitlists in high-demand parishes like Caddo[4]
- Must report changes in condition; annual reassessments[4]
- Parish-restricted—not statewide uniform program
- Younger disabled may qualify in some areas but primarily 60+[1]
- Donations encouraged but voluntary; no denial for non-payment[3][4][5]

**Data shape:** Parish-administered by local Councils on Aging with varying providers, wait times, donation amounts, and exact delivery schedules; requires local contact; pre-qual assessment in some areas; priority to greatest need.

**Source:** No single statewide .gov; local parish Councils on Aging sites (e.g., terrebonnecoa.org, caddocoa.org); Governor’s Office of Elderly Affairs assessment tool referenced[3].

---

### Louisiana Respite Care Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits detailed for a singular 'Louisiana Respite Care Program'; varies by related programs like LT-PCS (Medicaid, income/asset rules apply but exact 2026 figures not listed beyond home equity ≤$752,000) or dementia credit (strict Medicare recipients only, no income test specified).[1][4]
- Assets: For LT-PCS (related Medicaid program): Home exempt if applicant lives there/intends to return (equity ≤$752,000 in 2026), spouse/minor child/disabled child lives there. Other assets follow standard Medicaid rules (not detailed here).[1]
- Varies by sub-program: LT-PCS requires age 65+ or disabled 21+, Nursing Facility Level of Care (NFLOC via LOCET), ability to direct care; OCDD respite for developmental disabilities (age 3+/18+, ICF/IID level); dementia credit requires documented dementia diagnosis and strict Medicare; CSOC for children with special needs; general respite for adults/children with disabilities, special needs, or aging conditions. Caregiver relief need common across.[1][2][4][6][7][9]

**Benefits:** Short-term relief care: out-of-home center-based respite up to 720 hours per plan of care (POC) year (excess requires approval); includes companion care, host home, shared living (not personal residence); room/board if in approved center; specific examples like dementia credit $2,563 for day programs/in-home sitters up to 4 hours.[4][6]
- Varies by: priority_tier

**How to apply:**
- OCDD as single point for developmental disabilities respite (contact OCDD); Healthy Louisiana Plan referral for child/youth; general: contact Louisiana Department of Health (LDH) or licensed providers; no central phone/URL listed for unified program.[2][3][7]

**Timeline:** Several weeks to months for provider licensing (not consumer application); unspecified for enrollment.[3]
**Waitlist:** Enrollment limits indicate potential waitlists (e.g., 2400 for some OCDD by 06/30/2024, 1025 by 06/30/2023).[2]

**Watch out for:**
- Not a single unified program—respite embedded in waivers (LT-PCS, OCDD, CSOC) or credits (dementia); 720-hour cap per POC year; no respite by legally responsible person/relative in some (varies); must meet specific level of care (NFLOC/ICF/IID); provider licensing strict; check good standing/backgrounds; home equity limits if Medicaid-linked.[1][2][6][7]

**Data shape:** Fragmented across waivers/populations (elderly via LT-PCS/Medicare, DD via OCDD, children via CSOC); hour caps and enrollment limits; provider-focused regs heavy; no central eligibility table—income/assets via Medicaid where applicable.

**Source:** https://ldh.la.gov/faq/category/94 (LDH Respite FAQ); https://archrespite.org/wp-content/uploads/2022/09/louisiana.pdf (ARCH overview).[2][7]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually by the U.S. Department of Health and Human Services; some income excluded such as disability benefits and unemployment benefits. Contact local SCSEP Director for current table specific to family size[1].
- Assets: No asset limits mentioned in program guidelines[1][2].
- Unemployed or earning limited income
- Eligible to work in the U.S.
- Poor employment prospects (implied by program focus)
- Priority to veterans/qualified spouses (first), then those 65+, with disabilities, limited English/low literacy, rural residents, needing extra training, homeless/at risk, or failed prior workforce services[1][2][5]

**Benefits:** Part-time work-based training (average 20 hours/week) at community service sites (e.g., day-care, senior centers, schools, libraries, museums, hospitals); paid highest of federal/state/local minimum wage; supportive services (physical exams, transportation, uniforms, safety equipment); skills assessment, individualized training plan (IEP), annual free health check-up; bridge to unsubsidized jobs[1][2][7].
- Varies by: priority_tier

**How to apply:**
- Contact SCSEP Director in parish of residency (no specific statewide phone listed; local offices handle intake)[1]
- In-person or phone via local parish SCSEP Director[1]

**Timeline:** Not specified; enrollment if eligible and no waitlist[2].
**Waitlist:** Possible waitlist if program full; enrollment as positions open (varies by location)[1][3].

**Watch out for:**
- Income exclusions (e.g., disability, unemployment benefits) often missed—still may qualify[1]
- Must be unemployed; limited income if employed[1][2]
- Priority tiers affect enrollment speed—not first-come[1][5]
- Temporary training (up to 48 months max in some areas) aimed at unsubsidized jobs, not permanent[3]
- Local parish variations in waitlists/positions; call specific director[1]

**Data shape:** Income at 125% FPL (varies by household size, annual updates); parish-specific directors create regional variations; priority enrollment tiers; no fixed asset test

**Source:** https://goea.louisiana.gov/services/senior-community-service-employment-program-scsep/

---

### Louisiana Senior Legal Helpline


**Eligibility:**
- Age: 60+
- Income: Family income below 200% of federal poverty guidelines; guidelines may be higher specifically for seniors age 60+. Exact dollar amounts not specified in sources and vary by household size per standard poverty tables (contact provider for current figures).[1]
- Assets: No asset limits mentioned.
- Low-income status
- Resident of served parishes in Southeast Louisiana (e.g., Assumption, Ascension, East Baton Rouge, etc.)[1]

**Benefits:** Free legal representation, advocacy, and legal education for low-income seniors on civil legal issues.[1]
- Varies by: region

**How to apply:**
- Phone contacts by parish/region: (985) 851-5687 (Assumption Parish, Houma office); (225) 448-0080 or 1-855-512-3980 (Ascension, East Baton Rouge, etc., Baton Rouge office); (985) 345-2130 or 1-800-349-0886 (St. Helena, Tangipahoa, Washington, Hammond office)[1]
- Website: www.lawhelp.org/la[1]

**Timeline:** Not specified.

**Watch out for:**
- Not statewide—only 22 Southeast parishes; check specific parish coverage.[1]
- Income guidelines vary and may be higher for seniors, but exact amounts require direct inquiry as not listed.[1]
- Free services but limited to certain civil legal issues; contact to confirm qualification.[1]
- No centralized 'Senior Legal Helpline' phone; region-specific contacts via SLLS.[1]

**Data shape:** Regionally administered by Southeast Louisiana Legal Services (SLLS) through parish-specific offices; eligibility tied to varying income guidelines without fixed dollar tables in sources; not a single helpline but targeted legal aid for seniors 60+ in select areas.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.capitalaaa.org/programs/legal-services/ (via Capital Area Agency on Aging, referencing SLLS)[1]

---

### Louisiana Long-Term Care Ombudsman Program


**Eligibility:**
- Income: Not applicable — this is not a benefits program
- Assets: Not applicable — this is not a benefits program

**How to apply:**
- Phone: (866) 632-0922 (toll-free) or (225) 342-7100 (local)
- Phone: (225) 342-9723 (State Ombudsman Office)
- Website: https://goea.louisiana.gov/services/louisiana-ombudsman-program/
- Mail: State Long-Term Care Ombudsman Office, Governor's Office of Elderly Affairs, P.O. Box 61, Baton Rouge, LA 70821-0061
- Email: [email protected]

**Timeline:** Not specified in search results
**Waitlist:** Not applicable — this is a complaint/advocacy service, not a benefits program

**Watch out for:**
- This is NOT a program that provides services or financial assistance to elderly individuals
- This is an ADVOCACY program — it helps resolve complaints and protect rights, but does not provide personal care, healthcare, or financial benefits
- If you're looking for actual services (personal care, nursing home coverage, etc.), you may be interested in the LT-PCS (Long-Term Personal Care Services) program instead, which is Medicaid-based
- Ombudsmen may conduct unannounced visits to facilities to investigate concerns
- Federal law requires every state to operate this program

**Data shape:** This program's structure is fundamentally different from typical benefits programs — it has no eligibility requirements, income/asset limits, or application process for residents seeking help. Instead, residents or families contact the office with complaints or concerns. The program is federally mandated under the Older Americans Act (OAA), Title VII, Chapter 2, Sections 711/712.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `waitlist`: Has waitlist info — our model has no wait time field

**Source:** https://goea.louisiana.gov/services/louisiana-ombudsman-program/

---

### Community Choices Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: Income must meet Louisiana Medicaid long-term care limits, approximately $2,742/month for an individual and $5,484/month for a couple (both needing long-term care) as of recent data; older sources cite $2,199 individual/$4,398 couple. Limits subject to annual adjustment. Waiver spend-down option available if over limits. Varies by Medicaid rules, not explicitly by household size beyond couples.[2][4][5]
- Assets: Single: $2,000 max resources. Couples (both in long-term care): $3,000. Couples (one spouse at home): up to $117,240. Exempt assets include primary home (equity ≤$752,000 in 2026 if intent to return, spouse/minor/disabled child lives there), one vehicle, household furnishings/appliances, personal effects. 60-month look-back rule applies; transfers below fair market value cause penalty period.[2][3]
- Louisiana resident
- Medicaid long-term care eligible
- Nursing Facility Level of Care (NFLOC): inability to perform ADLs (e.g., transferring, mobility, eating, toileting), unstable medical conditions, cognitive issues like dementia (diagnosis alone insufficient)
- At risk of nursing home placement; elderly 65+ or 21-64 if physically disabled (can continue post-65 if enrolled earlier)

**Benefits:** Specific services: Nursing Services, Home Delivered Meals, Caregiver Temporary Support (respite), Housing Stabilization, Housing Transition/Crisis Intervention. Promotes home-based care to avoid nursing homes. No 24/7 care provided; alternative arrangements required. No fixed dollar amounts or hours specified; individualized based on need.[1][3]
- Varies by: priority_tier

**How to apply:**
- Phone: Call Louisiana Options in Long-Term Care at 1-877-456-1146 to add name to Request for Services Registry
- No specific online URL, mail, or in-person detailed; phone is primary route

**Timeline:** Not specified; offers based on priority and first-come-first-served after registry date
**Waitlist:** Yes; prioritized by need (e.g., APS/EPS abuse/neglect referrals, ALS, permanent supportive housing, nursing facility >90 days, non-dual waiver recipients). Expedited for qualified LT-PCS. Others first-come-first-served; apply immediately

**Watch out for:**
- No 24/7 care; must arrange separately[1][4]
- Strict priority tiers cause waits for non-priority; apply ASAP even if wait expected[1][4][5]
- NFLOC required (not just age/diagnosis); comprehensive ADL/medical assessment needed[2]
- 60-month look-back on asset transfers; penalties apply[2]
- Cannot receive with other HCBS waivers (e.g., PACE, NOW, LT-PCS unless expedited)[4][5]
- Income/asset limits outdated in some sources; verify current with LDH

**Data shape:** Priority-based waitlist with 5+ tiers; no 24/7 services; spend-down and asset exemptions allow higher-income qualification; NFLOC assessment drives everything; statewide but phone-registry only application noted

**Source:** https://ldh.la.gov/page/community-choices-waiver (based on LDH OAAS PDFs)[5][6]

---

### Louisiana Long Term–Personal Care Services (LT-PCS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21 years or older[2]+
- Income: Louisiana is a non-income-cap state. Income eligibility is determined by whether the applicant's income exceeds the cost of nursing home care each month. There is no fixed income limit; rather, if monthly income does not exceed the cost of care, the applicant is income-eligible[6]. Specific dollar amounts vary based on current nursing home costs in Louisiana.
- Assets: Single applicant resource limit: $2,000 in countable assets[6]. For married applicants, spousal impoverishment rules apply with different thresholds[6]. Home equity exemption (2026): up to $752,000 if applicant lives in home or has intent to return home[1]. Additional non-countable assets include: primary vehicle, personal items (non-investment grade), cash value life insurance (up to $10,000), funeral/burial plans, and individual countable resource allowance (up to $2,000)[6]. Home is exempt if: applicant or spouse lives there, applicant has minor child (under 21) living there, or applicant has blind or disabled child (any age) living there[1].
- Must be a Louisiana resident[3]
- Must receive Medicaid benefits (ABD Medicaid)[2][4]
- Must qualify for Nursing Facility Level of Care (NFLOC) as determined by Level of Care Eligibility Tool (LOCET)[1][2][5]
- Must require at least limited assistance with one Activity of Daily Living (ADL)[2]
- Must be able to direct their care independently or through a responsible representative[2]
- Must meet ONE of: (1) currently in nursing facility and able to be discharged with community services, OR (2) likely to require nursing facility admission within 120 days, OR (3) have primary caregiver who is disabled or at least 70 years old[2]

**Benefits:** In-home personal care assistance including: bathing, dressing, grooming, eating, toileting, mobility, transferring in/out of beds or chairs, light housekeeping, meal preparation, medication reminders, laundry, shopping, and help arranging transportation for medical appointments[7]. Program does NOT provide 24-hour supervision or skilled nursing care[7].
- Varies by: Individual need (determined through assessment); specific hours and services are individualized based on ADL assessment scores and functional need[5]

**How to apply:**
- S
- e
- a
- r
- c
- h
-  
- r
- e
- s
- u
- l
- t
- s
-  
- d
- o
-  
- n
- o
- t
-  
- p
- r
- o
- v
- i
- d
- e
-  
- s
- p
- e
- c
- i
- f
- i
- c
-  
- a
- p
- p
- l
- i
- c
- a
- t
- i
- o
- n
-  
- m
- e
- t
- h
- o
- d
- s
-  
- (
- o
- n
- l
- i
- n
- e
-  
- U
- R
- L
- ,
-  
- p
- h
- o
- n
- e
-  
- n
- u
- m
- b
- e
- r
- ,
-  
- m
- a
- i
- l
-  
- a
- d
- d
- r
- e
- s
- s
- ,
-  
- o
- r
-  
- i
- n
- -
- p
- e
- r
- s
- o
- n
-  
- o
- f
- f
- i
- c
- e
-  
- l
- o
- c
- a
- t
- i
- o
- n
- s
- )
- .
-  
- C
- o
- n
- t
- a
- c
- t
-  
- L
- o
- u
- i
- s
- i
- a
- n
- a
-  
- D
- e
- p
- a
- r
- t
- m
- e
- n
- t
-  
- o
- f
-  
- H
- e
- a
- l
- t
- h
- ,
-  
- O
- f
- f
- i
- c
- e
-  
- o
- f
-  
- A
- g
- i
- n
- g
-  
- a
- n
- d
-  
- A
- d
- u
- l
- t
-  
- S
- e
- r
- v
- i
- c
- e
- s
-  
- (
- O
- A
- A
- S
- )
-  
- f
- o
- r
-  
- a
- p
- p
- l
- i
- c
- a
- t
- i
- o
- n
-  
- p
- r
- o
- c
- e
- d
- u
- r
- e
- s
- [
- 2
- ]
- [
- 5
- ]
- .

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- LT-PCS does NOT provide support coordination — applicant must be able to direct their own care or have a representative do so[1]. This is a critical requirement that disqualifies those unable to manage care direction.
- Program requires Nursing Facility Level of Care determination via LOCET assessment — simply needing help with daily living is insufficient; applicant must meet the specific threshold for nursing home-level care[1][2].
- Income eligibility is NOT based on a fixed dollar amount but on whether income exceeds actual nursing home care costs — this requires individual calculation and may change as care costs fluctuate[6].
- Home equity exemption has a specific dollar cap ($752,000 in 2026) — homes exceeding this value may disqualify applicants[1].
- Applicant must meet ONE of three situational criteria (currently institutionalized, anticipated admission within 120 days, or have elderly/disabled caregiver) — simply needing care is insufficient[2].
- Program is designed for community-based care, not 24-hour supervision or skilled nursing — applicants expecting round-the-clock care may be disappointed[7].
- Must already be receiving Medicaid benefits to qualify — Medicaid eligibility is a prerequisite, not determined through LT-PCS application[2].

**Data shape:** LT-PCS eligibility is highly individualized and multi-layered: it requires simultaneous qualification across financial criteria (income/assets), functional criteria (NFLOC via LOCET), situational criteria (one of three specific circumstances), and administrative criteria (Medicaid enrollment, care direction ability). Benefits are not fixed dollar amounts or hours but are determined through individual assessment. Income limits are dynamic (based on care costs, not fixed thresholds). Search results lack specific application procedures, processing timelines, waitlist information, and regional office details — families will need to contact OAAS directly for operational details.

**Source:** https://ldh.la.gov/office-of-aging-and-adult-services/LTPCS

---

### COAHELPS (East Baton Rouge Council on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income limits or tables provided in sources; proof of income required for certain services like utility assistance, but open to all over 60 in parish[1][5]
- Assets: No asset limits mentioned; no details on what counts or exemptions[1]
- Must live in East Baton Rouge Parish[1][3]
- For utility assistance (Entergy Power to Care): at least 60 or disabled, with proof of income, ID, Entergy bill in name, all household bills[1]

**Benefits:** Information & Assistance (assessments, Medicaid apps, care management, utility bill assistance-Entergy/Demco/water/rent, legal aid, insurance counseling, fans/AC/blankets, donated supplies); Meals on Wheels; Congregate hot meals at senior centers; Food Pantry; Senior Activity Centers; Housing referrals (Lotus Village, Dumas House); Home repair referrals; Material aid (wheelchairs, walkers, etc., subject to availability); Incontinence supplies/nutritional supplements (subject to availability); Transportation (Lotus Rides for 60+ or disabled); Disaster preparedness[1][2][5][6][7]
- Varies by: service|availability

**How to apply:**
- Online form: ebrcoa.org/services-application/[5][7]
- Phone: 225.923.8000 (general), ext. 227 for Entergy Power to Care[1][5]
- Email questions: info@ebrcoa.org[3]
- In-person: appointments for assessments/utility aid, senior centers (e.g., Lotus Center)[1][6]

**Timeline:** Not specified

**Watch out for:**
- Services like material aid/incontinence supplies subject to availability[1]
- Must reside in East Baton Rouge Parish—no statewide access[1][3]
- Utility assistance focused on Entergy (Power to Care) with specific docs; also covers Demco/water/rent but details vary[1][5]
- No income/asset dollar limits stated, but proof of income required for aid[1]
- Open to all 60+ in parish, even short-term needs[5]

**Data shape:** Parish-restricted to East Baton Rouge; no fixed income/asset tables; benefits are service-based with availability limits; multiple one-off aids vs. ongoing entitlements

**Source:** https://ebrcoa.org/

---

### Lotus Rides (EBRCOA Transportation)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified.
- Assets: No asset limits specified.
- Do not have access to their own transportation.
- Currently use public transportation to travel to and from senior centers.
- Facing difficulty in finding reliable transportation due to financial difficulties or disability.

**Benefits:** Free demand-response transportation services to and from senior centers (primarily), medical appointments, and agency events. Available Monday-Friday, 8:00 a.m. to 4:30 p.m. Rides must be scheduled at least 2 business days in advance on a first-come, first-served basis.

**How to apply:**
- Complete transportation application in person at the senior center they attend.
- Phone: (225) 361-0299 (Lotus Ride Line for ride reservations; contact for questions).
- Email: transport@ebrcoa.org (for questions).

**Timeline:** Not specified.
**Waitlist:** Rides scheduled first-come, first-served according to availability; no formal waitlist mentioned.

**Watch out for:**
- Limited to East Baton Rouge Parish, not statewide.
- Primarily to/from senior centers; expansion to other destinations planned but current focus is senior centers and agency events.
- Rides require 2 business days advance scheduling and are availability-based.
- Application must be completed at a senior center—no online or mail option specified.
- No mention of costs, but described as free service.

**Data shape:** Restricted to East Baton Rouge Parish seniors attending EBRCOA senior centers; no income/asset tests; application in-person only at senior centers; demand-response with advance booking required.

**Source:** https://ebrcoa.org/transportation/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Louisiana Medicaid Home and Community-Ba | benefit | state | deep |
| Louisiana Program of All-Inclusive Care  | benefit | local | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Louisiana Senior Health Insurance Inform | resource | federal | simple |
| Meals on Wheels - Louisiana Council on A | benefit | federal | deep |
| Louisiana Respite Care Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Louisiana Senior Legal Helpline | resource | local | simple |
| Louisiana Long-Term Care Ombudsman Progr | resource | federal | simple |
| Community Choices Waiver | benefit | state | deep |
| Louisiana Long Term–Personal Care Servic | benefit | state | deep |
| COAHELPS (East Baton Rouge Council on Ag | benefit | local | medium |
| Lotus Rides (EBRCOA Transportation) | resource | local | simple |

**Types:** {"benefit":9,"resource":4,"employment":1}
**Scopes:** {"state":4,"local":4,"federal":6}
**Complexity:** {"deep":9,"simple":4,"medium":1}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/LA/drafts.json`.

- **Louisiana Medicaid Home and Community-Based Services (HCBS) Waivers** (benefit) — 5 content sections, 6 FAQs
- **Louisiana Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 3 programs
- **household_size**: 1 programs
- **household_size and fuel_type_and_season**: 1 programs
- **not_applicable**: 2 programs
- **Individual need (determined through assessment); specific hours and services are individualized based on ADL assessment scores and functional need[5]**: 1 programs
- **service|availability**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Louisiana Medicaid Home and Community-Based Services (HCBS) Waivers**: Multiple waivers under HCBS umbrella (e.g., CCW primary for elderly NFLOC); priority-based access with waitlists; financials tie to LTC Medicaid/SSI limits; services via licensed providers, varies by assessed needs and region
- **Louisiana Program of All-Inclusive Care for the Elderly (PACE)**: Limited to 4 regional providers/service areas; Medicaid financial test with specific LA income/asset caps; NFLOC via multi-step assessment (LOCET + iHC); benefits per individualized plan, not fixed hours/dollars
- **SNAP (Supplemental Nutrition Assistance Program)**: SNAP in Louisiana has a bifurcated eligibility structure: standard households follow federal 130% FPL gross income rules, but households with elderly (60+) or disabled members follow different rules (net income only, no gross income limit). This creates two distinct pathways to qualification. Additionally, Louisiana offers ESAP, a simplified application process specifically for elderly households with no earned income, which extends certification to 36 months and waives recertification interviews. Benefits scale by household size and income. The program is statewide but application assistance is distributed through parish Councils on Aging.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: LIHEAP benefits are highly seasonal and funding-dependent. Income limits scale by household size with a base amount plus per-person increments. Benefits are fixed dollar amounts ($200–$800 regular, $1,000 crisis) rather than percentage-based. The program operates on a fiscal-year cycle with distinct heating and cooling seasons. Application windows are time-limited, particularly for online applications. Regional variation exists in implementation through local parish agencies, but eligibility criteria and benefit amounts appear standardized statewide. The program prioritizes but does not exclusively serve households with elderly members, children, or disabled individuals.
- **Louisiana Senior Health Insurance Information Program (SHIP)**: no income or asset test; counseling-only service for Medicare beneficiaries statewide via phone/local counselors
- **Meals on Wheels - Louisiana Council on Aging**: Parish-administered by local Councils on Aging with varying providers, wait times, donation amounts, and exact delivery schedules; requires local contact; pre-qual assessment in some areas; priority to greatest need.
- **Louisiana Respite Care Program**: Fragmented across waivers/populations (elderly via LT-PCS/Medicare, DD via OCDD, children via CSOC); hour caps and enrollment limits; provider-focused regs heavy; no central eligibility table—income/assets via Medicaid where applicable.
- **Senior Community Service Employment Program (SCSEP)**: Income at 125% FPL (varies by household size, annual updates); parish-specific directors create regional variations; priority enrollment tiers; no fixed asset test
- **Louisiana Senior Legal Helpline**: Regionally administered by Southeast Louisiana Legal Services (SLLS) through parish-specific offices; eligibility tied to varying income guidelines without fixed dollar tables in sources; not a single helpline but targeted legal aid for seniors 60+ in select areas.
- **Louisiana Long-Term Care Ombudsman Program**: This program's structure is fundamentally different from typical benefits programs — it has no eligibility requirements, income/asset limits, or application process for residents seeking help. Instead, residents or families contact the office with complaints or concerns. The program is federally mandated under the Older Americans Act (OAA), Title VII, Chapter 2, Sections 711/712.
- **Community Choices Waiver**: Priority-based waitlist with 5+ tiers; no 24/7 services; spend-down and asset exemptions allow higher-income qualification; NFLOC assessment drives everything; statewide but phone-registry only application noted
- **Louisiana Long Term–Personal Care Services (LT-PCS)**: LT-PCS eligibility is highly individualized and multi-layered: it requires simultaneous qualification across financial criteria (income/assets), functional criteria (NFLOC via LOCET), situational criteria (one of three specific circumstances), and administrative criteria (Medicaid enrollment, care direction ability). Benefits are not fixed dollar amounts or hours but are determined through individual assessment. Income limits are dynamic (based on care costs, not fixed thresholds). Search results lack specific application procedures, processing timelines, waitlist information, and regional office details — families will need to contact OAAS directly for operational details.
- **COAHELPS (East Baton Rouge Council on Aging)**: Parish-restricted to East Baton Rouge; no fixed income/asset tables; benefits are service-based with availability limits; multiple one-off aids vs. ongoing entitlements
- **Lotus Rides (EBRCOA Transportation)**: Restricted to East Baton Rouge Parish seniors attending EBRCOA senior centers; no income/asset tests; application in-person only at senior centers; demand-response with advance booking required.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Louisiana?
