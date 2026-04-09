# Colorado Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.070 (14 calls, 2.1m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 12 |
| Programs deep-dived | 11 |
| New (not in our data) | 5 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 2 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 3 programs
- **service**: 4 programs
- **in_kind**: 1 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Health First Colorado Buy-In (QMB, SLMB, QI)

- **income_limit**: Ours says `$994` → Source says `$1,275` ([source](https://hcpf.colorado.gov/medicaid-buy-program (general Buy-In; MSPs via https://www.healthfirstcolorado.com/)))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `QMB: Pays Medicare Part B premium (~$185/month in 2026), deductibles, copays, coinsurance (covers 20% Medicare does not, providing full coverage). SLMB/QI: Pays only Part B premium; individual pays deductibles, copays, coinsurance.[1]` ([source](https://hcpf.colorado.gov/medicaid-buy-program (general Buy-In; MSPs via https://www.healthfirstcolorado.com/)))
- **source_url**: Ours says `MISSING` → Source says `https://hcpf.colorado.gov/medicaid-buy-program (general Buy-In; MSPs via https://www.healthfirstcolorado.com/)`

### Supplemental Nutrition Assistance Program (SNAP)

- **min_age**: Ours says `65` → Source says `60` ([source](https://cdhs.colorado.gov/PEAK))
- **income_limit**: Ours says `$1980` → Source says `$2,608` ([source](https://cdhs.colorado.gov/PEAK))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases. Max amounts (2025-2026): 1 person $298, 2 $546, 3 $785, 4 $994, 5 $1,183 (scales with net income, household size).[7]` ([source](https://cdhs.colorado.gov/PEAK))
- **source_url**: Ours says `MISSING` → Source says `https://cdhs.colorado.gov/PEAK`

### Low-Income Energy Assistance Program (LEAP)

- **income_limit**: Ours says `$2825` → Source says `$3,607` ([source](https://cdhs.colorado.gov/leap (state program page; county sites reference state guidelines)))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time financial assistance payment toward winter heating bills (exact amount not specified; not intended to cover full heating costs—continue paying bills). Eligible households may also qualify for emergency heating system repair/replacement and free furnace/weatherization services via Energy Saving Partners.[1]` ([source](https://cdhs.colorado.gov/leap (state program page; county sites reference state guidelines)))
- **source_url**: Ours says `MISSING` → Source says `https://cdhs.colorado.gov/leap (state program page; county sites reference state guidelines)`

### State Health Insurance Assistance Program (SHIP)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, personalized one-on-one counseling and education. No dollar limits or hour restrictions specified in available sources.[2][4]` ([source](acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[2] and shiphelp.org[7]))
- **source_url**: Ours says `MISSING` → Source says `acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[2] and shiphelp.org[7]`

### Colorado Legal Services (Seniors)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal aid including: advice from attorney, assistance filing cases, full court representation; specific senior issues: estate planning, wills/trusts, power of attorney, guardianship/conservatorship, advance directives, liens, consumer issues, landlord/tenant disputes, Medicaid/Medicare, government benefits (SNAP, SSI), housing, family law, debt/bankruptcy, tax controversies, immigration for eligible categories; holistic support via social workers in some areas (Denver, Colorado Springs)[1][2][3][4]` ([source](https://www.coloradolegalservices.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.coloradolegalservices.org`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints on resident rights violations (e.g., privacy, dignity, abuse), care issues (e.g., medications, hygiene), transfers/discharges; investigation, problem-solving, resource linkage, education, and consultation. Services are free, confidential, and resident-directed.` ([source](https://www.coombudsman.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.coombudsman.org`

## New Programs (Not in Our Data)

- **Home and Community-Based Services (HCBS) Waivers** — service ([source](https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/CO))
  - Shape notes: Multiple (10) distinct waivers targeting specific populations (e.g., EBD for elderly 65+/disabled 18-64); regional Case Management Agencies handle assessments; waitlists due to limited slots; nursing home level of care required across waivers
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://coloradopace.org))
  - Shape notes: Restricted to designated service areas (county/zip-specific); no fixed income/asset limits for enrollment (tied to optional Medicaid); benefits fully customized by IDT with no tiers or hours specified; single provider (Colorado PACE) with regional centers.
- **Weatherization Assistance Program (WAP)** — in_kind ([source](https://county.pueblo.org/human-services-department/colorado-energy-office-weatherization-program (Pueblo County example); https://socgov02.my.site.com/ceoweatherization/s/ (Colorado Energy Office central application portal)))
  - Shape notes: This program's eligibility structure is complex and geographically fragmented. Income limits are determined by county, household size, and utility provider, creating multiple overlapping thresholds. The program is administered by multiple regional providers (Pueblo County, NWCCOG, Energy Resource Center, and others), each with potentially different processing times, wait lists, and office locations. Automatic qualification through public assistance programs bypasses income verification but requires current approval letters. The 15-year weatherization history requirement creates a significant eligibility barrier. Funding availability and program capacity vary by region and time, meaning eligibility alone does not guarantee service provision. For elderly applicants, there is no age-based priority or special consideration documented in available search results.
- **Alzheimer’s Disease and Related Dementia (ADRD) Respite** — service ([source](https://archrespite.org/ta-center-for-respite/respite-voucher-programs/apply-for-state-lifespan-respite-voucher-programs/ (Colorado Respite Coalition); https://www.211colorado.org/adrd/))
  - Shape notes: Statewide voucher via coalition but funnels through local AAAs/counties with residency rules; ties to Medicaid EBD Waiver for some; multiple overlapping programs (voucher, GUIDE, local); no fixed income table or hours in sources
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://cdhs.colorado.gov/benefits-assistance/employment-assistance/senior-community-service-employment-program))
  - Shape notes: Federally funded via DOL grantees (state agencies/nonprofits like SER, AARP); varies by region/provider with priority enrollment tiers; income at 125% FPL (federal table); 20 hrs/wk wage-based training only, no fixed statewide processing/waitlist data.

## Program Details

### Health First Colorado Buy-In (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: These are federal Medicare Savings Programs (MSPs) administered through Health First Colorado. Limits are based on Federal Poverty Level (FPL) and typically updated annually; exact 2026 figures unavailable in sources but structured as: QMB: ≤100% FPL (~$1,275/month single, $1,724 couple); SLMB: 100-120% FPL (~$1,531-$1,830 single, $2,055-$2,190 couple); QI: 120-135% FPL (~$1,831-$2,056 single, $2,460-$2,760 couple). Household size affects limits (higher for larger households); must have Medicare Part A eligibility. Does not vary by standard household size beyond individual/couple but considers dependents in some calculations.[1]
- Assets: Yes, resource limits apply (three levels by program): typically $9,090 individual/$13,630 couple (2024 figures; may adjust). Counts: bank accounts, stocks, bonds. Exempt: home/land, one vehicle, personal belongings, life insurance (up to $1,500 face value), burial funds/plots.[1]
- Must be enrolled in Medicare Part A.
- Colorado resident.
- U.S. citizen or qualified immigrant.
- Not eligible for full Medicaid.
- For QI, funding is limited and first-come, first-served.

**Benefits:** QMB: Pays Medicare Part B premium (~$185/month in 2026), deductibles, copays, coinsurance (covers 20% Medicare does not, providing full coverage). SLMB/QI: Pays only Part B premium; individual pays deductibles, copays, coinsurance.[1]
- Varies by: priority_tier

**How to apply:**
- Online: https://www.healthfirstcolorado.com/apply-now/
- Phone: Contact local county human services office (find via https://cdhs.colorado.gov/counties or 1-800-221-3943)
- Mail/In-person: Local county Department of Human Services office.
- Through Health First Colorado general application.

**Timeline:** 45-90 days typical for MSPs; varies by county.
**Waitlist:** QI may have waitlist due to federal funding caps.

**Watch out for:**
- Confused with Working Adults/Children with Disabilities Buy-In (different program for disabled under 65, premium-based on income).[2]
- QI has limited federal funding—may close enrollment.
- Must already have Medicare Part A; auto-enrollment not guaranteed.
- Assets include non-exempt items people overlook (e.g., second car).
- Income is countable after deductions; SLMB/QI higher thresholds but no copay coverage.[1][3]

**Data shape:** Tiered by QMB/SLMB/QI with escalating income limits but decreasing benefit generosity; asset-tested unlike some Medicaid Buy-Ins; federal MSP standards uniform but county-administered.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hcpf.colorado.gov/medicaid-buy-program (general Buy-In; MSPs via https://www.healthfirstcolorado.com/)

---

### Home and Community-Based Services (HCBS) Waivers

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for elderly; 18-64 if blind, physically disabled, or HIV/AIDS diagnosis+
- Income: Financial eligibility determined by county human/social services office; for elderly/disabled, income must be 300% or more below Federal Poverty Level (exact 2026 dollar amounts vary by FPL updates and household size—contact county for current table); no specific dollar table in sources
- Assets: Home equity interest no greater than $1,130,000 in 2026; exemptions include spouse or dependent relative living in home
- Colorado resident
- Nursing facility level of care (functional eligibility assessed by caseworker)
- At risk of nursing home placement
- Live in home or intent to return home

**Benefits:** Adult day health, homemaker, personal care, respite, alternative care facility, consumer-directed attendant support, home-delivered meals, home modification, in-home support services, life skills training, non-medical transportation, peer mentorship, personal emergency response systems, remote support, supplies/equipment/medication reminder, transition setup, wellness education; individualized based on needs (no fixed dollar amounts or hours specified)
- Varies by: priority_tier

**How to apply:**
- County human or social services office (financial eligibility)
- Contracted Case Management Agencies (47 regional agencies for functional assessment)
- No specific phone, URL, or address listed—start with local county office

**Timeline:** Not specified
**Waitlist:** Yes, limited slots (not an entitlement); can be on one waiver while waiting for another

**Watch out for:**
- 10 separate HCBS waivers exist (e.g., EBD for elderly/disabled, others for mental health, developmental disabilities)—must choose/target correct one; only one at a time
- Not an entitlement—waitlists common
- Dual eligibility process: financial via county, functional via case management agency
- Persons disabled/blind enrolling before 65 can continue post-65
- Family/friends may be paid caregivers under some waivers like In-Home Support Services

**Data shape:** Multiple (10) distinct waivers targeting specific populations (e.g., EBD for elderly 65+/disabled 18-64); regional Case Management Agencies handle assessments; waitlists due to limited slots; nursing home level of care required across waivers

**Source:** https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/CO

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits for PACE enrollment itself; Medicaid (Health First Colorado) eligibility determines premium coverage. If eligible for Medicaid long-term care (income under 300% of Federal Benefit Rate: $2,901/month in 2025; assets $2,000 or less excluding primary home), Medicaid pays a portion of the premium. Non-Medicaid eligible pay the Medicaid portion out-of-pocket. Colorado PACE staff assist with Medicaid determination.[1][3]
- Assets: No specific asset limits for PACE enrollment; tied to Medicaid if applicable (assets $2,000 or less excluding primary home). Medicaid planning available to meet criteria.[1][3]
- Meet Colorado's nursing home level of care as certified by interdisciplinary team (IDT) assessment and Colorado Department of Human Services.
- Live in a Colorado PACE designated service area (specific counties and zip codes).
- Able to live safely in the community without jeopardizing health or safety at time of enrollment.
- Medicare eligible (65+, disabled, ALS, or end-stage renal disease; US citizen or 5-year legal resident).[1][2][3]

**Benefits:** Comprehensive, individualized services via Interdisciplinary Team (IDT) including primary care provider, registered nurse, social worker, physical/occupational/recreational therapists, dietitian, home care coordinator, personal care attendant, transportation driver, center director. Covers all healthcare and supportive services in care plan: medical, social, nursing home-level care to live at home/community. No specific dollar amounts or hours stated; customized per participant.[1][2][4]
- Varies by: region

**How to apply:**
- Phone: Toll-free 888-788-1241 (contact Enrollment Specialist for home visit and info).
- In-person: Via scheduled home visit and assessment by PACE team.
- No specific online URL, mail address, or form listed; process starts with phone referral.[1][2]

**Timeline:** Comprehensive assessment by IDT, then state approval by Colorado Department of Health Care Policy and Financing (HCPF) takes 7-14 days.[2]
**Waitlist:** Not mentioned in sources; may vary by service area.

**Watch out for:**
- Must live in specific service area; not statewide.
- Requires agreement to receive all care through PACE IDT (cannot keep own doctor outside plan).[1]
- Nursing home level of care required but must be safe in community with PACE support at enrollment.[1][2][3]
- Non-Medicaid eligible pay full premium (Medicare covers part, self-pay remainder).[1]
- Medicaid eligibility not required for PACE but affects costs; staff help determine.[1]

**Data shape:** Restricted to designated service areas (county/zip-specific); no fixed income/asset limits for enrollment (tied to optional Medicaid); benefits fully customized by IDT with no tiers or hours specified; single provider (Colorado PACE) with regional centers.

**Source:** https://coloradopace.org

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled, gross income limit is 200% FPL (Oct 1, 2025-Sept 30, 2026): 1 person $2,608/mo, 2 $3,526, 3 $4,442, 4 $5,358, 5 $6,276, 6 $7,192, 7 $8,108, +$916 each additional. If over gross, qualify via net income (100% FPL) and asset test. Max shelter deduction applies for some. Net income determines benefit amount ($100 more net = ~$30 less benefit).[1][7]
- Assets: No asset limit for most Colorado households (home/vehicles exempt). Households 60+ or disabled failing gross income test must meet $4,500 federal asset limit (exempt: home, vehicles, retirement savings).[1][4]
- Colorado resident
- U.S. citizen or qualified non-citizen (e.g., lawful permanent resident 5+ years, 40 work quarters, or parent of U.S. citizen child)
- Social Security number (or applied for one)
- Meet work requirements if able-bodied adult without dependents (ABAWD, age <65, expanded to include homeless/veterans/foster youth; parents with kids 14+)
- For 60+: SSI/SSDI recipients qualify as elderly/disabled; prove medical expenses >$35/mo for deduction ($165+)[2][4][5][7]

**Benefits:** Monthly EBT card for food purchases. Max amounts (2025-2026): 1 person $298, 2 $546, 3 $785, 4 $994, 5 $1,183 (scales with net income, household size).[7]
- Varies by: household_size

**How to apply:**
- Online: PEAK (cdhs.colorado.gov/PEAK)
- Phone: Local county human services (e.g., via Hunger Free Colorado referral) or EBT 1-888-328-2656
- Mail/In-person: County Department of Human Services offices
- Assistance: Hunger Free Colorado (hungerfreecolorado.org)

**Timeline:** Up to several weeks[2]

**Watch out for:**
- 60+ households over gross income (200% FPL) must pass net income + $4,500 asset test (people miss asset trigger)[1][4]
- Medical deduction only if out-of-pocket >$35/mo and documented[2]
- Redetermination every 6-12 months + annual change report; miss deadlines = lapse[2]
- Work requirements for ABAWDs/parents with kids 14+ (recent expansions)[5]
- EBT only for food, not cash/hot meals
- Immigrants: strict rules unless qualified categories[7]

**Data shape:** Elderly/disabled have simplified tests (gross 200% FPL or net 100% FPL + assets); no standard asset limit in CO; benefits/net income scale by household size; county-administered

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://cdhs.colorado.gov/PEAK

---

### Low-Income Energy Assistance Program (LEAP)


**Eligibility:**
- Income: Gross monthly household income must not exceed 60% of Colorado State Median Income. For the most recent available guidelines (likely applicable to 2025-26 season):
| Household Size | Maximum Gross Monthly Income |
|---------------|------------------------------|
| 1 | $3,607 |
| 2 | $4,717 |
| 3 | $5,827 |
| 4 | $6,938 |
| 5 | $8,048 |
| 6 | $9,158 |
| 7 | $9,366 |
| 8 | $9,574 |
| Each Additional | +$208 | Limits are set annually and posted by November 1.[2][1]
- Assets: No asset limits mentioned in program guidelines.[1][2]
- U.S. citizen or legal alien (proof of lawful presence required for non-U.S. born household members, e.g., Naturalization Certificate, U.S. Passport, Permanent Resident Card).[1][2]
- Colorado resident.[1][2]
- Pay home heating costs directly to an energy provider, fuel dealer, or as part of rent.[1][2][3]
- Household members include those financially responsible for (e.g., spouses, children).[2]

**Benefits:** One-time financial assistance payment toward winter heating bills (exact amount not specified; not intended to cover full heating costs—continue paying bills). Eligible households may also qualify for emergency heating system repair/replacement and free furnace/weatherization services via Energy Saving Partners.[1]
- Varies by: household_size

**How to apply:**
- Online: Apply via Goodwill of Colorado partnership (specific URL not listed; email LEAPHELP@GoodwillColorado.org or use provider application portal).[3]
- Phone: 1-866-432-8435 (Goodwill).[3]
- Mail: Submit paper application with documents to local county human services office (e.g., Adams or Pueblo County).[1][2]
- In-person: Local county human services offices (varies by county).[1][2]

**Timeline:** Applications processed as long as funding available; no specific timeline stated.[3]
**Waitlist:** None mentioned; funding-limited, so apply early (season Nov 1-Apr 30).[1][3]

**Watch out for:**
- Assistance does not cover full heating bill—must continue paying utility/rent.[1][3]
- Funding limited; apply early in season (Nov 1-Apr 30) as processing stops when funds exhausted.[1][3]
- Income based on gross monthly for all household members financially responsible; self-employment requires profit/loss receipts.[2]
- No age requirement, but elderly may qualify if income/heating criteria met—no special elderly priority noted.[1][2]
- Proof of lawful presence strictly required for non-citizens.[2]

**Data shape:** Statewide with uniform 60% SMI income guidelines by household size; county-administered with local application contacts; seasonal and funding-capped; no asset test or age restriction

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://cdhs.colorado.gov/leap (state program page; county sites reference state guidelines)

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Income limits vary by county, household size, and utility provider. For most households (1-7 members), limits are based on 60% of State Median Income. For households with 8+ members, limits are based on 200% of Federal Poverty Level. For Xcel, Black Hills, Atmos, and Colorado Natural Gas customers, limits are based on 80% Area Median Income. Example income limits for a sample county: 1 person: $30,900; 2 people: $39,750; 3 people: $50,100; 4 people: $60,450; 5 people: $65,400; 6 people: $73,650; 7 people: $81,900; 8 people: $108,300; 9 people: $119,300; 10 people: $130,300. For households with more than 10 people, add $11,000 for each additional person annually. Income limits are determined by county, so applicants should contact their local provider for exact limits in their area.[3] Alternatively, households automatically qualify if they receive SNAP, LEAP, TANF, SSI, OAP, or AND benefits—income verification may not be necessary if current approval letters are provided.[1][2]
- Assets: Not specified in available search results.
- Home must not have received weatherization services in the past 15 years (or 15¼ years in some documentation).[1][6]
- Applicant must be lawfully present and submit a completed lawful presence affidavit with their application.[4]
- For renters, a Release Form from the landlord must be obtained allowing the program to work on the property.[1]
- Homeowners and renters are both eligible.[1]

**Benefits:** Energy efficiency upgrades to residential structures to reduce energy costs. Specific services include weatherization improvements, but exact service details and dollar amounts per household are not specified in available search results.
- Varies by: household_size, region, and funding availability

**How to apply:**
- Online application: https://socgov02.my.site.com/ceoweatherization/s/[1]
- Mail: Completed applications can be emailed to the local Weatherization office (specific email addresses vary by region; contact your local office for details).[1]
- In-person: Applications can be picked up and dropped off at local Weatherization offices (specific office locations vary by region).[1]
- Phone: Contact your local weatherization service provider (specific phone numbers vary by region).[3]

**Timeline:** Not specified in available search results. Applicants may be placed on a waiting list with timelines varying based on program demand and capacity.[3]
**Waitlist:** Eligible households may be placed on a waiting list. Timelines vary based on program demand and capacity. Contact your local weatherization service provider for estimated wait times.[3]

**Watch out for:**
- Program availability depends on current funding and may vary by utility provider—not all areas may have services available at all times.[3]
- Meeting income requirements alone does not guarantee services will be provided; eligible households may be placed on a waiting list with potentially long timelines.[3]
- Home must not have been weatherized in the past 15 years to qualify—if weatherization was done within this window, the household is ineligible.[1][6]
- For renters, landlord permission is required via a Release Form; without it, renters cannot access services even if otherwise eligible.[1]
- As of July 1, 2024, all applicants must submit a completed lawful presence affidavit with their application.[4]
- Public assistance approval letters must be current to qualify through the automatic pre-qualification route; expired letters require income documentation instead.[2]
- Income limits vary significantly by county and utility provider—a household may qualify in one county but not another, or with one utility but not another.[3]
- Wait times and program capacity vary by region; contact your local provider for current status before applying.[3]

**Data shape:** This program's eligibility structure is complex and geographically fragmented. Income limits are determined by county, household size, and utility provider, creating multiple overlapping thresholds. The program is administered by multiple regional providers (Pueblo County, NWCCOG, Energy Resource Center, and others), each with potentially different processing times, wait lists, and office locations. Automatic qualification through public assistance programs bypasses income verification but requires current approval letters. The 15-year weatherization history requirement creates a significant eligibility barrier. Funding availability and program capacity vary by region and time, meaning eligibility alone does not guarantee service provision. For elderly applicants, there is no age-based priority or special consideration documented in available search results.

**Source:** https://county.pueblo.org/human-services-department/colorado-energy-office-weatherization-program (Pueblo County example); https://socgov02.my.site.com/ceoweatherization/s/ (Colorado Energy Office central application portal)

---

### State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Income: Not specified in available sources. SHIP serves people with limited incomes, but specific dollar thresholds are not provided in the search results.
- Assets: Not specified in available sources.
- Must be eligible for Medicare (typically age 65+, or younger with certain disabilities)[1][4]
- Family members and caregivers of Medicare-eligible individuals can also access services[1]
- Can contact SHIP counselors if you will be eligible for Medicare soon[1]

**Benefits:** Free, personalized one-on-one counseling and education. No dollar limits or hour restrictions specified in available sources.[2][4]
- Varies by: Program offerings may vary slightly by location, but core services are consistent statewide

**How to apply:**
- Phone: 1-888-696-7213 (statewide)[5]
- Phone: 303-894-5953 (statewide Spanish language counseling)[5]
- Website: Colorado Department of Insurance (doi.colorado.gov)[3][5]
- In-person: Department of Regulatory Agencies, 1560 Broadway, Suite 850, Denver, CO 80202[3]
- Hours: 8:30 AM - 4:30 PM[3]
- Email: Brandon.D.Davis@state.co.us[3]
- National hotline: 877-839-2675 (to find local SHIP services)[2]

**Timeline:** Not specified in available sources. John Williams (SHIP Indiana) recommends contacting 3 months before Medicare starts, but no processing timeline is provided.[1]
**Waitlist:** Not specified in available sources.

**Watch out for:**
- SHIP counselors are NOT insurance agents and cannot sell insurance products[1]. They provide unbiased, objective advice only.[1]
- SHIP staff and volunteers are not permitted to hold insurance licenses to ensure beneficiaries receive unbiased guidance[1]
- Counselors complete 8-10 hours of required training and testing, but this does not make them licensed insurance professionals[1]
- Income and asset limits exist but are not specified in publicly available search results — you must contact SHIP directly to determine eligibility[2]
- Services are free, but specific eligibility for financial assistance programs (Medicaid, Medicare Savings Program, Extra Help) depends on individual circumstances and must be assessed by a counselor[2]
- Regional variations exist: services may be delivered through different local agencies depending on your county, so contact information and availability may vary[8]
- The program also offers Senior Medicare Patrol (SMP) services in addition to SHIP, which specifically helps detect and report healthcare fraud, errors, and abuse — this is a separate but related service[2]

**Data shape:** SHIP is a federally funded, statewide program with no income or asset limits published in standard sources — eligibility determination requires direct contact with counselors. Services are entirely free and unbiased. The program operates through a network of local agencies, so the specific provider and contact method may vary by county. Colorado's SHIP is administered by the Department of Regulatory Agencies but delivered through partnerships with local Area Agencies on Aging. No processing times, waitlists, or formal application forms are specified in available sources, suggesting services are provided on a walk-in or call-in basis without formal application procedures.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** acl.gov/programs/connecting-people-services/state-health-insurance-assistance-program-ship[2] and shiphelp.org[7]

---

### Alzheimer’s Disease and Related Dementia (ADRD) Respite

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by Medicaid financial eligibility for programs like EBD Waiver; specific dollar amounts not listed in sources but tied to SSI levels and state-determined limits for limited income/assets. No fixed table provided for ADRD respite specifically.
- Assets: Medicaid-linked programs require limited assets; exact counts/exemptions (e.g., primary home often exempt) follow state Medicaid rules but not detailed for ADRD respite.
- Colorado resident
- Diagnosis of Alzheimer's or related dementia
- Care recipient frail or at risk of nursing home placement (NFLOC: assistance with 2+ ADLs or moderate cognitive/behavioral supervision needs)
- For voucher programs: family caregiver providing unpaid care
- For GUIDE: traditional Medicare (not Advantage), living in home/assisted living/memory care (not nursing home/hospice/PACE)
- County residency for some local programs (e.g., Weld County)

**Benefits:** Respite vouchers for self-directed family caregiver payments to respite providers; in-home respite care; 24/7 support line; comprehensive assessments; support for caregivers to delay nursing home placement. Specific hours/dollars not quantified in sources.
- Varies by: region

**How to apply:**
- Colorado Respite Coalition Self-Directed Family Respite Voucher Program (apply via https://archrespite.org/ta-center-for-respite/respite-voucher-programs/apply-for-state-lifespan-respite-voucher-programs/ marker for CO)
- Dial 211 for local ADRD resources (https://www.211colorado.org/adrd/)
- For GUIDE: Call CU Medicine GUIDE at 303-724-3141 (https://www.cumedicine.us/services/guide)
- Local human services (e.g., Weld County programs)

**Timeline:** Not specified; GUIDE involves intake visits and Medicare approval after initial contact.
**Waitlist:** Possible for Medicaid EBD Waiver due to limited slots; not specified for respite voucher.

**Watch out for:**
- Not an entitlement; waitlists possible via linked Medicaid waivers
- Dementia diagnosis alone insufficient—must meet NFLOC (2+ ADLs or cognitive needs)
- GUIDE requires traditional Medicare only, home-based living
- County-specific residency for some supports
- Limited slots; call 211 first for local options
- Not available in nursing homes or certain facilities

**Data shape:** Statewide voucher via coalition but funnels through local AAAs/counties with residency rules; ties to Medicaid EBD Waiver for some; multiple overlapping programs (voucher, GUIDE, local); no fixed income table or hours in sources

**Source:** https://archrespite.org/ta-center-for-respite/respite-voucher-programs/apply-for-state-lifespan-respite-voucher-programs/ (Colorado Respite Coalition); https://www.211colorado.org/adrd/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are not specified in current sources; families must check current federal poverty guidelines via official channels[3][6].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Actively looking for employment
- Poor employment prospects
- U.S. citizen or authorized to work
- Priority for veterans and qualified spouses, individuals over 65, those with disabilities, low literacy or limited English proficiency, rural residents, homeless or at-risk, or those who failed to find employment via American Job Centers[3]

**Benefits:** Part-time community service training positions averaging 20 hours per week at the highest of federal, state, or local minimum wage (Colorado minimum wage applies); on-the-job training in nonprofits/public facilities (e.g., schools, hospitals, senior centers, libraries, food banks); job readiness workshops, career coaching, resume/interview prep, skills training (e.g., computer literacy), and assistance to unsubsidized employment[1][2][3][5].
- Varies by: priority_tier

**How to apply:**
- Statewide info: https://cdhs.colorado.gov/benefits-assistance/employment-assistance/senior-community-service-employment-program[1]
- Phone (Weld County/northern CO): (877) 872-5627[4]
- Phone (AARP Foundation, Denver region: Adams, Arapahoe, Denver, El Paso counties): 1-855-850-2525[7]
- Locator tool: https://my.aarpfoundation.org/locator/scsep/ (enter zip code for local providers)[7]
- Regional providers: SER Colorado (northern CO: Loveland, Fort Collins, Greeley, Windsor, Longmont)[2]; AARP Foundation SCSEP[5]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may vary by region and provider due to limited slots.

**Watch out for:**
- Limited slots due to federal funding; priority tiers may cause delays for non-priority applicants[3]
- Income test strictly at 125% FPL; participants must be unemployed and actively job-seeking—it's training, not permanent aid[1][3]
- Not direct cash assistance but paid training wages only; goal is bridge to unsubsidized jobs[1][3][5]
- Regional grantees vary; must contact local provider, not a single statewide office[2][6][7]
- No asset test, but proof of low income required; veterans/65+/disabled get first access[3]

**Data shape:** Federally funded via DOL grantees (state agencies/nonprofits like SER, AARP); varies by region/provider with priority enrollment tiers; income at 125% FPL (federal table); 20 hrs/wk wage-based training only, no fixed statewide processing/waitlist data.

**Source:** https://cdhs.colorado.gov/benefits-assistance/employment-assistance/senior-community-service-employment-program

---

### Colorado Legal Services (Seniors)


**Eligibility:**
- Age: 60+
- Income: No strict income or asset limits for seniors 60+ in many regions (e.g., Larimer County explicitly states none); statewide preference for low-income based on federal poverty guidelines, but seniors qualify regardless if resources available[1][2][3]
- Assets: No asset limits mentioned for seniors; not required in documented examples[2]
- Must be Colorado resident
- Civil legal issues only (no criminal or traffic)
- Complete intake screening process
- Some regions require residency in specific counties served by local office (e.g., Larimer, Pueblo, or Metro Denver counties like Adams, Arapahoe, etc.)[1][2][8]

**Benefits:** Free civil legal aid including: advice from attorney, assistance filing cases, full court representation; specific senior issues: estate planning, wills/trusts, power of attorney, guardianship/conservatorship, advance directives, liens, consumer issues, landlord/tenant disputes, Medicaid/Medicare, government benefits (SNAP, SSI), housing, family law, debt/bankruptcy, tax controversies, immigration for eligible categories; holistic support via social workers in some areas (Denver, Colorado Springs)[1][2][3][4]
- Varies by: region

**How to apply:**
- Online pre-apply: https://www.coloradolegalservices.org/get-help/[3][7]
- Phone: Call local office (statewide intake process required; specific numbers via website or local AAA)[1][3][7]
- In-person: Visit nearby office (13 offices statewide; e.g., Pueblo County via local human services, Larimer via Senior Access Point)[1][2][7]
- Mail: Not specified as primary; use intake process via phone/online

**Timeline:** Team contacts after application to assess eligibility; no specific timeline stated
**Waitlist:** Limited resources may result in turning away cases; prioritization for high-need low-income seniors[2][5][6]

**Watch out for:**
- Not a hotline for quick advice—must complete full intake screening[2][3][7]
- Limited resources mean not all cases accepted, even if eligible; turn away rate high[2][6]
- Case types vary by local office—contact specific region first[2][5]
- Prioritizes high social/economic need; low-income get preference but seniors 60+ often qualify without strict limits[1][3][5]
- Operates alongside separate Older Americans Act-funded network via Disability Law Colorado/AAAs, which may overlap or refer[5]

**Data shape:** Seniors 60+ have priority access without strict income/asset tests unlike general low-income program; delivered via statewide CLS offices + regional AAA-contracted providers; services/case acceptance varies by 16 AAA regions and office resources

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.coloradolegalservices.org

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident of a skilled nursing home or licensed assisted living residence in Colorado.
- Services also extend to relatives, friends, facility staff, or any concerned individual about such residents.

**Benefits:** Advocacy to resolve complaints on resident rights violations (e.g., privacy, dignity, abuse), care issues (e.g., medications, hygiene), transfers/discharges; investigation, problem-solving, resource linkage, education, and consultation. Services are free, confidential, and resident-directed.

**How to apply:**
- Visit https://www.coombudsman.org and use 'Find an Ombudsman' tool for local contacts.
- Contact local offices (e.g., Boulder County: implied via county site; Pueblo County: 719-601-6282 or dmason@srda.org).
- Phone or email varies by local program; statewide site provides directory.

**Timeline:** Immediate response for complaints; no formal processing as it's advocacy service, not benefits enrollment.

**Watch out for:**
- Not a healthcare or financial benefits program—purely advocacy for rights in facilities; requires resident direction (or POA if impaired); anyone can contact but action is resident-led; only covers licensed nursing homes/assisted living, not other settings like home care.
- Confidentiality means no action without resident permission.

**Data shape:** no income/asset/age test; open to residents/families/public; regionally delivered via local ombudsman offices; advocacy-only, complaint-driven service.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.coombudsman.org

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Health First Colorado Buy-In (QMB, SLMB, | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low-Income Energy Assistance Program (LE | benefit | state | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Alzheimer’s Disease and Related Dementia | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Colorado Legal Services (Seniors) | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":7,"resource":3,"employment":1}
**Scopes:** {"state":5,"local":1,"federal":5}
**Complexity:** {"deep":8,"simple":3}

## Content Drafts

Generated 4 page drafts. Review in admin dashboard or `data/pipeline/CO/drafts.json`.

- **Health First Colorado Buy-In (QMB, SLMB, QI)** (benefit) — 6 content sections, 6 FAQs
- **Home and Community-Based Services (HCBS) Waivers** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 2 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 3 programs
- **region**: 3 programs
- **household_size**: 2 programs
- **household_size, region, and funding availability**: 1 programs
- **Program offerings may vary slightly by location, but core services are consistent statewide**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Health First Colorado Buy-In (QMB, SLMB, QI)**: Tiered by QMB/SLMB/QI with escalating income limits but decreasing benefit generosity; asset-tested unlike some Medicaid Buy-Ins; federal MSP standards uniform but county-administered.
- **Home and Community-Based Services (HCBS) Waivers**: Multiple (10) distinct waivers targeting specific populations (e.g., EBD for elderly 65+/disabled 18-64); regional Case Management Agencies handle assessments; waitlists due to limited slots; nursing home level of care required across waivers
- **Program of All-Inclusive Care for the Elderly (PACE)**: Restricted to designated service areas (county/zip-specific); no fixed income/asset limits for enrollment (tied to optional Medicaid); benefits fully customized by IDT with no tiers or hours specified; single provider (Colorado PACE) with regional centers.
- **Supplemental Nutrition Assistance Program (SNAP)**: Elderly/disabled have simplified tests (gross 200% FPL or net 100% FPL + assets); no standard asset limit in CO; benefits/net income scale by household size; county-administered
- **Low-Income Energy Assistance Program (LEAP)**: Statewide with uniform 60% SMI income guidelines by household size; county-administered with local application contacts; seasonal and funding-capped; no asset test or age restriction
- **Weatherization Assistance Program (WAP)**: This program's eligibility structure is complex and geographically fragmented. Income limits are determined by county, household size, and utility provider, creating multiple overlapping thresholds. The program is administered by multiple regional providers (Pueblo County, NWCCOG, Energy Resource Center, and others), each with potentially different processing times, wait lists, and office locations. Automatic qualification through public assistance programs bypasses income verification but requires current approval letters. The 15-year weatherization history requirement creates a significant eligibility barrier. Funding availability and program capacity vary by region and time, meaning eligibility alone does not guarantee service provision. For elderly applicants, there is no age-based priority or special consideration documented in available search results.
- **State Health Insurance Assistance Program (SHIP)**: SHIP is a federally funded, statewide program with no income or asset limits published in standard sources — eligibility determination requires direct contact with counselors. Services are entirely free and unbiased. The program operates through a network of local agencies, so the specific provider and contact method may vary by county. Colorado's SHIP is administered by the Department of Regulatory Agencies but delivered through partnerships with local Area Agencies on Aging. No processing times, waitlists, or formal application forms are specified in available sources, suggesting services are provided on a walk-in or call-in basis without formal application procedures.
- **Alzheimer’s Disease and Related Dementia (ADRD) Respite**: Statewide voucher via coalition but funnels through local AAAs/counties with residency rules; ties to Medicaid EBD Waiver for some; multiple overlapping programs (voucher, GUIDE, local); no fixed income table or hours in sources
- **Senior Community Service Employment Program (SCSEP)**: Federally funded via DOL grantees (state agencies/nonprofits like SER, AARP); varies by region/provider with priority enrollment tiers; income at 125% FPL (federal table); 20 hrs/wk wage-based training only, no fixed statewide processing/waitlist data.
- **Colorado Legal Services (Seniors)**: Seniors 60+ have priority access without strict income/asset tests unlike general low-income program; delivered via statewide CLS offices + regional AAA-contracted providers; services/case acceptance varies by 16 AAA regions and office resources
- **Long-Term Care Ombudsman Program**: no income/asset/age test; open to residents/families/public; regionally delivered via local ombudsman offices; advocacy-only, complaint-driven service.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Colorado?
