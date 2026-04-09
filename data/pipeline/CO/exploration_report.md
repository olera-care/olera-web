# Colorado Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 56s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 14 |
| New (not in our data) | 10 |
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
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **financial**: 6 programs
- **service**: 5 programs
- **not_applicable**: 1 programs
- **employment**: 1 programs
- **service|advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Health First Colorado Buy-In (QMB, SLMB, QI)

- **income_limit**: Ours says `$994` → Source says `$1,735` ([source](https://hcpf.colorado.gov (search Medicare Savings Programs or contact for MSP details); apply at https://www.healthfirstcolorado.com/apply-now/[1][2]))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `**QMB:** Pays Medicare Part B monthly premium, deductibles, copays, coinsurance (covers the 20% Medicare does not, providing full coverage). **SLMB & QI-1:** Pays Part B monthly premium only; responsible for deductibles, copays, coinsurance (supplemental plans may fill gaps)[1].` ([source](https://hcpf.colorado.gov (search Medicare Savings Programs or contact for MSP details); apply at https://www.healthfirstcolorado.com/apply-now/[1][2]))
- **source_url**: Ours says `MISSING` → Source says `https://hcpf.colorado.gov (search Medicare Savings Programs or contact for MSP details); apply at https://www.healthfirstcolorado.com/apply-now/[1][2]`

### Colorado PACE

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive healthcare and supportive services including: primary care, specialty physician services, registered nursing, social work, physical therapy, occupational therapy, recreational therapy, dietitian services, home care coordination, personal care assistance, transportation, medication management, and social engagement[4][6]` ([source](coloradopace.org))
- **source_url**: Ours says `MISSING` → Source says `coloradopace.org`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.colorado.gov/PEAK))
- **income_limit**: Ours says `$1980` → Source says `$2608` ([source](https://www.colorado.gov/PEAK))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases; amount based on net income ($100 more net income = ~$30 less benefits); minimum/maximum vary by household size; medical deduction if out-of-pocket >$35/mo ($165+); shelter deduction cap for some.[1][2]` ([source](https://www.colorado.gov/PEAK))
- **source_url**: Ours says `MISSING` → Source says `https://www.colorado.gov/PEAK`

### Colorado Legal Services (Senior Legal Hotline)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free civil legal services including: attorney advice, assistance filing cases, full court representation. Specific practice areas include estate planning, wills, trusts, power of attorney, guardianship/conservatorship, advanced directives, liens, consumer issues, landlord/tenant disputes, Medicaid/Medicare issues, Social Security/SSI problems, living wills, medical durable powers of attorney[1][3][4]. Some offices provide social workers for emotional support and resource identification[4].` ([source](https://www.coloradolegalservices.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.coloradolegalservices.org`

## New Programs (Not in Our Data)

- **Colorado Medicaid HCBS Waivers (e.g., Home Care Allowance)** — service ([source](https://hcpf.colorado.gov/hcbs-waivers (Colorado Dept. of Health Care Policy & Financing); https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/CO[5]))
  - Shape notes: Multiple waivers (e.g., EBD for elderly); eligibility via dual county (financial) + regional agency (functional) assessments; benefits individualized by service plan, not fixed $; waitlists and regional case managers create variability; SSI-multiple for income
- **LEAP (Low-income Energy Assistance Program)** — financial ([source](https://cdhs.colorado.gov/leap (referenced across county sites)[2]))
  - Shape notes: Income limits at 60% state median, updated annually by Nov 1 and vary by household size; priority-based benefits with add-ons like weatherization; county-administered with statewide uniformity but local application points
- **Weatherization Assistance Program (WAP)** — service ([source](https://socgov02.my.site.com/ceoweatherization/s/))
  - Shape notes: Income eligibility hybrid: auto-qualify via listed assistance programs or tiered limits (60% SMI for 1-7, 200% FPL for 8+, 80% AMI for select utilities), fully county/provider-specific charts required; local sub-grantees handle apps with varying forms/contacts/waitlists
- **Colorado SHIP (State Health Insurance Assistance Program)** — service ([source](https://doi.colorado.gov/insurance-products/health-insurance/senior-health-care))
  - Shape notes: no income/asset test; open to Medicare-eligible and families statewide; service-based counseling via phone statewide with local delivery network; no formal application or waitlist
- **Meals on Wheels Colorado** — service ([source](No single statewide .gov site; primary network via mealsonwheelsamerica.org/find-meals-and-services/))
  - Shape notes: Decentralized by county/provider with no uniform eligibility/fees; regionally fragmented providers, no income test but sliding donations; homebound focus with exceptions for disability/referral
- **Community Access Services (CAS)** — not_applicable ([source](No primary .gov URL for elderly CAS program identified; closest is https://dpo.colorado.gov/AddictionCounselor for counselor certification.[4]))
  - Shape notes: No data on elderly program; results show CAS as statewide counselor certification with tiered education/experience (CAT/CAS/LAC), no income/asset tests, not client services.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: Federally uniform but locally administered by grantees like SER National in CO; income scales by household size at 125% FPL (annual updates); priority tiers affect access; county-restricted by provider coverage; waitlists common
- **Old Age Pension (OAP)** — financial ([source](https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=5243&fileName=9+CCR+2503-3 (Colorado Code of Regulations 9 CCR 2503-3)[2]))
  - Shape notes: County-administered with varying reported income/benefit caps; cash benefit scales inversely with countable income (dollar-for-dollar reduction); tied to pursuing other benefits; medical benefits via separate programs (OAP Health Care or Medicaid)
- **Home Care Allowance (HCA)** — financial ([source](https://www.law.cornell.edu/regulations/colorado/9-CCR-2503-5-3.570 (primary regs); county sites like https://www.douglas.co.us/human-services/assistance/financial-assistance/home-care-allowance/[1][2]))
  - Shape notes: Tiered by functional assessment scores (Capacity ≥21, Need 1-51); financial tied to SSI/AND-SO/OAP (no fixed $ table); county-administered with local variations; cash to client for provider choice, no direct services
- **Older Coloradans Cash Fund** — financial ([source](https://www.colorado.gov/pga/office-aging (inferred from administration by Colorado’s Office on Aging; primary rules in CDHS sites)))
  - Shape notes: One-time grant model distinct from monthly OAP payments; ties into broader elder care assessments like ACAT; income at 200% FPL threshold higher than some programs

## Program Details

### Health First Colorado Buy-In (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: These are federal Medicare Savings Programs (MSPs) administered through Health First Colorado. Exact 2026 dollar amounts not in search results; limits vary by tier (QMB, SLMB, QI) and are typically 100% FPL for QMB, 120% for SLMB, 135% for QI, adjusted annually for household size. Contact county office for current table as general Health First Colorado limits (e.g., family of 1: up to $1,735 adults) do not apply directly[1][4].
- Assets: There are three levels of MSP depending on income and asset limits; specific 2026 asset thresholds (often ~$9,090 individual/$13,630 couple, excluding home, car, etc.) not detailed in results. What counts: countable assets like bank accounts; exempt: primary home, one vehicle, personal belongings[1].
- Must be enrolled in Medicare Part A and B
- Colorado resident
- U.S. citizen or qualified immigrant
- For elderly loved ones: age 65+ or disabled under 65 qualifying for Medicare

**Benefits:** **QMB:** Pays Medicare Part B monthly premium, deductibles, copays, coinsurance (covers the 20% Medicare does not, providing full coverage). **SLMB & QI-1:** Pays Part B monthly premium only; responsible for deductibles, copays, coinsurance (supplemental plans may fill gaps)[1].
- Varies by: priority_tier

**How to apply:**
- Online: https://www.healthfirstcolorado.com/apply-now/
- Phone: Contact local county Human Services office (numbers via https://cdhs.colorado.gov/counties)
- Mail or in-person: Local county Department of Human Services office

**Timeline:** Not specified in results
**Waitlist:** QI often has federal funding caps and waitlists; others generally no waitlist[1]

**Watch out for:**
- Not full Medicaid—only Medicare cost-sharing assistance; does not cover long-term care or services beyond Medicare gaps
- QI has limited federal slots and potential waitlist
- Must already have Medicare; auto-enrollment not guaranteed
- Asset test applies (often overlooked vs. income-only programs)
- Three distinct tiers with different income/asset cutoffs—check exact level
- If in Working Adults with Disabilities Buy-In, different rules (premiums $0-$200 based on income, full Medicaid services)[2]

**Data shape:** Tiered by QMB/SLMB/QI with escalating income limits and decreasing benefit levels; asset-tested unlike some Medicaid; funding-capped for QI; separate from disability Buy-In programs which offer full Health First Colorado services for premium

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://hcpf.colorado.gov (search Medicare Savings Programs or contact for MSP details); apply at https://www.healthfirstcolorado.com/apply-now/[1][2]

---

### Colorado Medicaid HCBS Waivers (e.g., Home Care Allowance)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for elderly under EBD Waiver; 18-64 for physical disabilities or blind under EBD; varies by waiver (e.g., 18+ for DD, 0-17 for children waivers)+
- Income: For EBD Waiver (most relevant for elderly): Income < $2,022/month (300% SSI, older figure) or up to $4,066.50/month max spousal allowance in 2026; minimum spousal allowance $2,643.75/month (7/1/25-6/30/26). General HCBS: < $2,199/month (single). Varies slightly by waiver; apply via county for exact current thresholds as SSI-based and updated annually. No full household size table in sources—typically individual or spousal[2][3][4]
- Assets: Countable resources < $2,000 (single) or $3,000 (couple). Exempt: primary home (if intent to return, equity ≤ $1,130,000 in 2026; or spouse/dependent lives there), household furnishings/appliances, personal effects, one vehicle. Look-Back Rule: No asset transfers under fair market value in prior 60 months or face penalty period[3][4]
- Nursing Facility Level of Care (NFLOC): Assistance with ≥2/6 Activities of Daily Living (ADLs); assessed via Level of Care Determination Screening Instrument or ULTC 100.2[1][3]
- Functional eligibility assessed by one of 47 regional Case Management Agencies[1]
- Financial eligibility via county human/social services office[1]
- At risk of nursing facility/hospital/ICF placement; willing to receive services at home/community[2][4]
- Medicaid/Health First Colorado enrollment required[4]

**Benefits:** EBD Waiver (elderly-relevant): adult day health, homemaker, personal care, respite, alternative care facility, consumer-directed attendant support, home-delivered meals, home modification, in-home support, life skills training, non-medical transport, peer mentorship, personal emergency response systems, remote support, supplies/equipment/medication reminders, transition setup, wellness education. No fixed $ or hours—individualized service plan by case manager; cost ≤ institutional care[3][5]
- Varies by: priority_tier

**How to apply:**
- County Department of Human/Social Services (financial eligibility; 64 counties, contact local via https://cdhs.colorado.gov/local-county-offices)
- Regional Case Management Agency for functional assessment (47 agencies, contracted regionally; find via state referral)
- Phone: Local county human services (e.g., statewide info 1-800-221-3943 for Health First Colorado)
- Online: Health First Colorado portal at https://www.healthfirstcolorado.com/apply
- In-person/mail: County offices

**Timeline:** Not specified in sources; individualized after assessments
**Waitlist:** Yes, common due to non-entitlement; can be on one waiver while waiting for another; varies by waiver/program[1][4]

**Watch out for:**
- Only one waiver at a time; waitlists common—non-entitlement unlike regular Medicaid[1][4]
- Must meet NFLOC (≥2 ADLs) via specific assessment; not automatic for elderly[3]
- 60-month Look-Back for assets; home equity cap $1,130,000[3]
- Income thresholds SSI-based, update annually—verify current via county[2][3]
- Home Care Allowance likely under EBD or similar; confirm specific waiver as 'Home Care Allowance' not explicitly named (may refer to consumer-directed/personal care allowances)[3][5]
- Spousal impoverishment protections have min/max income allowances[3]

**Data shape:** Multiple waivers (e.g., EBD for elderly); eligibility via dual county (financial) + regional agency (functional) assessments; benefits individualized by service plan, not fixed $; waitlists and regional case managers create variability; SSI-multiple for income

**Source:** https://hcpf.colorado.gov/hcbs-waivers (Colorado Dept. of Health Care Policy & Financing); https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/Waiver-Descript-Factsheet/CO[5]

---

### Colorado PACE


**Eligibility:**
- Age: 55+
- Income: Not specified in available sources. Search results indicate that Medicaid income/asset limits apply if seeking Medicaid coverage, but no specific dollar amounts are provided. Colorado PACE staff can help determine Medicaid eligibility.[2] Private pay options exist for those who don't qualify for Medicaid.[6]
- Assets: Not specified in available sources. Medicaid asset limits would apply for those seeking Medicaid coverage, but specific thresholds are not detailed.
- Meet state's nursing home level of care requirement, as determined by Colorado PACE's Interdisciplinary Team (IDT) assessment and certified by the Colorado Department of Human Services[2][3]
- Live in a PACE-covered service area in Colorado (specific by county and zip code)[1][2]
- Be able to live safely in the community without jeopardizing health or safety with PACE services[2][3]
- Cannot be enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, hospice services, or certain other programs[5]

**Benefits:** Comprehensive healthcare and supportive services including: primary care, specialty physician services, registered nursing, social work, physical therapy, occupational therapy, recreational therapy, dietitian services, home care coordination, personal care assistance, transportation, medication management, and social engagement[4][6]
- Varies by: Individual care plan developed by IDT based on participant needs and goals[4]

**How to apply:**
- Phone: 888-788-1241 (Toll Free) or 303-381-1234 (Front Desk)[2]
- TTY: 800-659-2656 or 711[2]
- Online: Contact form available at coloradopace.org[2]
- In-person: Colorado PACE Office (address not provided in search results)

**Timeline:** State-level approval typically takes 7 to 14 days after comprehensive assessment[1]
**Waitlist:** Not specified in available sources

**Watch out for:**
- Participants must receive ALL healthcare services from Colorado PACE contracted providers (except emergency services). You cannot keep your own doctor outside the PACE network.[2][4]
- Participants may be fully liable for costs of unauthorized or out-of-PACE services.[6]
- Private pay participants who don't qualify for Medicaid are responsible for the portion of the monthly premium that Medicaid would have covered.[2]
- Nursing home level of care is a strict requirement—not everyone over 55 qualifies. This is determined through formal assessment, not self-reported need.[3]
- Service area is limited by county and zip code—geographic eligibility must be verified before applying.[1][2]

**Data shape:** Colorado PACE is a service-based program (not a cash benefit). Eligibility hinges on nursing home level of care certification, not income. The program operates through multiple regional providers (at least Colorado PACE and Rocky Mountain PACE identified). Income limits are tied to Medicaid/Medicare eligibility, not program-specific thresholds. Specific dollar amounts for income/asset limits, detailed benefit schedules, application forms, required documents, and regional wait times are not available in the provided search results.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** coloradopace.org

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (Oct 1, 2025 - Sept 30, 2026): Gross income limit at 200% FPL - 1: $2608/mo, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, +$916 each additional. If over gross, qualify via net income (100% FPL) and asset test. Most households must pass gross (200% FPL), net, and asset tests; elderly/disabled exempt from gross if meeting others.[1][2][4]
- Assets: No asset limit in Colorado for standard eligibility (home/vehicles exempt). If gross income exceeds limit and household has 60+ or disabled member, federal rules apply: $4500 asset limit (countable: bank accounts; exempt: home, vehicles, retirement savings).[1][4]
- Colorado resident
- U.S. citizen or lawfully present non-citizen
- Social Security number (or applied for one)
- Meet work requirements if able-bodied adult without dependents (ABAWD, age <65, 80 hrs/mo work) or parent with child 14+; exemptions for elderly/disabled, homeless, veterans, foster care aging out
- Household includes those who buy/prepare food together

**Benefits:** Monthly EBT card for food purchases; amount based on net income ($100 more net income = ~$30 less benefits); minimum/maximum vary by household size; medical deduction if out-of-pocket >$35/mo ($165+); shelter deduction cap for some.[1][2]
- Varies by: household_size

**How to apply:**
- Online: PEAK (https://www.colorado.gov/PEAK)
- Phone: EBT Customer Service 1-888-328-2656; local dept of human services
- Mail: To local county human services office
- In-person: Local county human services office

**Timeline:** Up to several weeks[2]

**Watch out for:**
- Elderly/disabled over gross income limit can still qualify via net income + $4500 asset test—many miss this[1]
- Redetermination every 6-12 months; submit periodic change report if certified >1 year to avoid lapse[2]
- Medical deduction only if unreimbursed >$35/mo[2][6]
- Work requirements expanded (e.g., parents with kids 14+, some visas ineligible per 2025 Act)[5][6]
- Household must include food-sharing members; Social Security/SSI/pensions count as income[2][3]

**Data shape:** Eligibility expands for 60+/disabled (no gross test if net/assets met, no standard asset limit); benefits scale by household size/net income; county-administered with work rule variations

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.colorado.gov/PEAK

---

### LEAP (Low-income Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income at or below 60% of Colorado State Median Income, set annually (posted by Nov 1). Example for 2024-25 (Adams County): 1: $3,607; 2: $4,717; 3: $5,827; 4: $6,938; 5: $8,048; 6: $9,158; 7: $9,366; 8: $9,574; +1: $208. Household size based on income-earning members only for eligibility determination[3][4].
- Assets: No asset limits mentioned in program guidelines[1][2][3][4][5].
- Colorado resident
- U.S. citizen or legal permanent resident (at least one household member; non-documented adults may apply if all citizens/residents are minors)[1][2][3][4][5]
- Pay home heating costs directly to energy provider/fuel dealer or as part of rent[1][2][3][4][5][6]
- Proof of lawful presence for applicant and non-U.S.-born household members (e.g., Naturalization Certificate, U.S. Passport, Permanent Resident Card, Refugee/Asylee docs)[2][3][4]

**Benefits:** Partial payment toward winter home heating bills (not full cost; households must continue paying bills). Eligible households may also access emergency heating system repair/replacement and free furnace/weatherization via Energy Saving Partners[1][2]. Exact payment amount not specified (varies by funding, household needs)[1][5].
- Varies by: priority_tier

**How to apply:**
- Online: Colorado PEAK website (Nov 1 - Apr 30)[1][2][3]
- Phone: HEAT HELP at 1-866-432-8435[4][5]
- Email: e.g., leap@adamscountyco.gov (county-specific); LEAPHELP@GoodwillColorado.org[3][5]
- Mail: e.g., Adams County: 11860 Pecos St., Westminster, CO 80234 or LEAP PO Box 39200, Colorado Springs, CO 80949[3]
- In-person/Drop-off: County human services offices (e.g., Pueblo: 320 W 10th St, 2631 E 4th St, 405 W 9th St)[1]

**Timeline:** Not specified; applications processed as long as funding available[2][5]
**Waitlist:** No waitlist mentioned; funding-limited[5]

**Watch out for:**
- Assistance covers only part of heating bill—continue paying utility/rent[1][5]
- Household size for income eligibility counts only income-earning members[4]
- At least one household member must be U.S. citizen/legal resident; non-documented can apply under conditions[4]
- Program runs Nov 1-Apr 30; funding may run out before end[1][2][5]
- Must provide income proof from last month, including all sources[3][4]

**Data shape:** Income limits at 60% state median, updated annually by Nov 1 and vary by household size; priority-based benefits with add-ons like weatherization; county-administered with statewide uniformity but local application points

**Source:** https://cdhs.colorado.gov/leap (referenced across county sites)[2]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households automatically qualify if receiving LEAP, SNAP, TANF, SSI, or AND (requires current approval letter). Otherwise, income-based: For households of 1-7 members, 60% of State Median Income; for 8+ members, 200% Federal Poverty Level (varies by utility provider and county, e.g., Xcel/Black Hills/Atmos/Colorado Natural Gas at 80% Area Median Income). Example annual limits for NWCCOG region (households 8+): 8 members $108,300-$159,040 range (exact max depends on county/AMI/SMI/FPL); 9: $119,300; 10: $130,300; add $11,000 per additional person beyond 10. Full county-specific chart required via local provider; meeting income does not guarantee services due to funding[1][2][3][5].
- Assets: No asset limits mentioned in sources.
- Household must own or rent eligible home (not weatherized in past 15 years)[6]
- Valid photo ID required (CO driver's license/ID current/expired <10 years, US military card, or US Coast Guard Merchant Mariner card)[1]
- List all household members with ages, disability status, Indigenous American status, gross monthly income, and sources[1]

**Benefits:** Installation of cost-effective energy-saving measures to reduce energy use, improve health/safety (e.g., insulation, sealing, repairs; specific measures not itemized but exclude utility bill payments)[3]
- Varies by: priority_tier

**How to apply:**
- Online: Colorado Energy Office portal at https://socgov02.my.site.com/ceoweatherization/s/[6]
- Phone: Energy Resource Center (Denver) (720) 236-1321[1]; contact local provider for others[2][3]
- Mail/In-person: Varies by provider, e.g., Energy Resource Center, 953 Decatur Street, Denver, CO 80204[1]; Pueblo County provider[5]; NWCCOG for NW region[2]; find local via Colorado Energy Office[3]

**Timeline:** Not specified; varies by demand/funding
**Waitlist:** Eligible households may be placed on waiting list; timelines vary by program demand, capacity, region, utility provider[2]

**Watch out for:**
- Auto-qualification via public assistance requires current approval letter; income verification still possible[1][2]
- Meeting income limits does not guarantee services—depends on funding, prior weatherization (none in 15 years), utility, demand[2][6]
- Regional/provider variations in income max (AMI/SMI/FPL), waitlists, availability[2]
- Program year July-June; apply via specific local provider, not centrally[3]
- Xcel/others auto-qualify LEAP/SSI/TANF/COAP recipients[4]

**Data shape:** Income eligibility hybrid: auto-qualify via listed assistance programs or tiered limits (60% SMI for 1-7, 200% FPL for 8+, 80% AMI for select utilities), fully county/provider-specific charts required; local sub-grantees handle apps with varying forms/contacts/waitlists

**Source:** https://socgov02.my.site.com/ceoweatherization/s/

---

### Colorado SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to anyone eligible for Medicare (typically age 65+ or under 65 with certain disabilities), family members, caregivers, and those soon to be eligible[1][2][3]
- Assets: No asset limits or tests apply[1]
- Must be Medicare-eligible or soon eligible; family/caregivers of Medicare beneficiaries also qualify[1][2][3]

**Benefits:** Free, unbiased one-on-one counseling and education on Medicare options (Parts A, B, C, D, Medigap), enrollment, appeals, coordinating benefits, prescription drug help, applying for low-income programs like Extra Help/LIS or Medicare Savings Programs; outreach presentations; no insurance sales[1][2][3][4]

**How to apply:**
- Phone: 1-888-696-7213 (toll-free, 8:30 am - 4:30 pm); Spanish: 303-894-5953; Website: https://doi.colorado.gov/insurance-products/health-insurance/senior-health-care (Colorado DOI SHIP page); Email: Brandon.D.Davis@state.co.us; In-person or local counseling via state network (contact phone for appointment)[4][5]

**Timeline:** No formal application processing; counseling available upon contact, typically by appointment[1][7]

**Watch out for:**
- Counselors do not sell insurance and provide unbiased advice only—not agents; contact 3 months before Medicare starts for best help; not a direct financial benefit but assistance accessing other programs; training ensures expertise but services are advisory, not healthcare provision[1][3]

**Data shape:** no income/asset test; open to Medicare-eligible and families statewide; service-based counseling via phone statewide with local delivery network; no formal application or waitlist

**Source:** https://doi.colorado.gov/insurance-products/health-insurance/senior-health-care

---

### Meals on Wheels Colorado

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict income limits statewide; some providers use sliding scale fees based on income (e.g., Fort Collins: reduced fees with gross monthly income verification, max $6.50-$7.50/meal). Broomfield: any income level. No specific dollar amounts or household tables provided.
- Assets: No asset limits mentioned across providers.
- Homebound or unable to shop/prepare meals safely
- Some allow under 60 with disability proof or medical referral (e.g., Fort Collins age 62+ or disability; Broomfield under 60 with referral)
- Lives alone or with caregiving family in some areas (e.g., Broomfield)
- Assessed as needing service

**Benefits:** Home-delivered nutritious meals providing at least 1/3 of daily nutrients (entree, vegetables, fruits, bread, milk); hot meals weekdays (e.g., Broomfield 11am-12:30pm Mon-Fri); frozen weekend meals in some areas; no fixed hours/week but typically daily delivery; suggested donations $2-$7.50/meal but no one denied for inability to pay.
- Varies by: region

**How to apply:**
- Phone: VOA Denver metro/Adams/Arapahoe/Clear Creek/Denver/Douglas/Gilpin/Jefferson 303-294-0111; Larimer 970-472-9630; Broomfield via senior services (number not specified); Fort Collins via website; Mesa County phone/office; Coal Creek (Lafayette/Louisville/Erie/Superior) 303-665-0566
- Email: mdeherrera@voacolorado.org (Denver area), larimer@voacolorado.org, mtrejo@voacolorado.org
- Online: mealsonwheelsfc.org (Fort Collins), coalcreekmow.org (some areas)
- Mail/In-person: Application mailed or downloaded (Mesa County); short phone intake (Broomfield)

**Timeline:** Within 24 business hours (Broomfield); office call after application (Mesa County)
**Waitlist:** Possible longer wait due to application influx (Mesa County); varies by region

**Watch out for:**
- Not a single unified program—must contact specific county/provider; no one denied for inability to pay but contributions requested; varies by exact location (e.g., age 60 vs 62, homebound assessment required); waitlists in high-demand areas; changes/cancellations need 24hr notice; caregivers may qualify if co-residing in some areas

**Data shape:** Decentralized by county/provider with no uniform eligibility/fees; regionally fragmented providers, no income test but sliding donations; homebound focus with exceptions for disability/referral

**Source:** No single statewide .gov site; primary network via mealsonwheelsamerica.org/find-meals-and-services/

---

### Community Access Services (CAS)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits identified in available sources; search results do not describe a CAS program for elderly families with income tables.
- Assets: No asset limits or exemptions detailed; sources lack program-specific information.
- Search results primarily reference Certified Addiction Specialist (CAS), a professional credential for addiction counselors in Colorado requiring a bachelor's degree, 2,000 supervised hours, and exams—not a service program for elderly.[1][4][6]
- No matching elderly community access service found in results; may refer to HCBS waivers or similar, but not explicitly CAS.[5]

**Benefits:** No benefits described; results indicate CAS is a counseling certification, not client services like healthcare or support for elderly.[1][8]

**How to apply:**
- No application methods for elderly CAS program; for counselor CAS, apply via DORA website (pre-2021 grandfathering noted).[4]

**Timeline:** Unknown for this program

**Watch out for:**
- CAS likely refers to Certified Addiction Specialist, a professional license, not a community service for elderly—common mismatch in query.[1][4][6]
- No evidence of 'Community Access Services (CAS)' for Colorado elderly; may confuse with HCBS waivers or ACC program.[2][5]
- Search results lack any elderly-focused CAS program details.

**Data shape:** No data on elderly program; results show CAS as statewide counselor certification with tiered education/experience (CAT/CAS/LAC), no income/asset tests, not client services.

**Source:** No primary .gov URL for elderly CAS program identified; closest is https://dpo.colorado.gov/AddictionCounselor for counselor certification.[4]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of federal poverty level. Example limits (from a 2024 application form, subject to annual updates based on federal poverty guidelines): 1-person household: $18,825; 2-person: $25,550; 3-person: $32,725; 4-person: $39,000; 5-person: $45,725. Contact local provider for current table by household size.
- Assets: No asset limits mentioned in program guidelines.
- Unemployed
- U.S. work authorization (implied)
- Willing to participate in occupational skills training and job search assistance
- Reside in a county served by the local SCSEP provider

**Benefits:** Part-time work-based training (average 20 hours/week) at community service sites (e.g., child care, customer service, teachers' aide, computer technician, building maintenance, health care). Paid the highest of federal, state, or local minimum wage. Training lasts about 6 months, followed by assistance to find unsubsidized permanent employment. Support services like job search assistance.
- Varies by: priority_tier

**How to apply:**
- Contact local SCSEP provider (e.g., SER National for Colorado: no direct phone/URL in results, use national locator via dol.gov or state workforce agency)
- In-person or phone at local grantee office
- Waiting list applications (e.g., PDF forms from providers like A4TD)

**Timeline:** Not specified; if eligible and no waitlist, enrolled promptly.
**Waitlist:** Common; some providers actively accepting waiting list applications.

**Watch out for:**
- Income calculated for full family household at 125% FPL (contact provider to confirm exact amount and what counts)
- Priority enrollment tiers may delay non-priority applicants (veterans first, then 65+, disabled, rural, etc.)
- Temporary training program (avg. 6 months) aimed at unsubsidized job placement, not permanent employment
- Must be unemployed and seeking training to bridge to work; not general welfare
- Availability and waitlists vary by county/provider—check local office
- Residency restricted to provider's service counties

**Data shape:** Federally uniform but locally administered by grantees like SER National in CO; income scales by household size at 125% FPL (annual updates); priority tiers affect access; county-restricted by provider coverage; waitlists common

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### Colorado Legal Services (Senior Legal Hotline)


**Eligibility:**
- Age: 60+
- Income: Based on federal poverty guidelines. One source specifies 125% of federal poverty guidelines for individuals 50 and older in some service areas[5]. General eligibility: seniors 60+ may qualify with preference given to low-income seniors[1]. Exact dollar amounts vary by household size and are determined during intake[2].
- Assets: Not specified in available sources. Income-based qualification appears primary[2].
- Colorado residency (varies by office)[3]
- Must complete intake process; not a hotline for quick guidance[3]
- Some offices do not handle all case types due to limited resources[3]

**Benefits:** Free civil legal services including: attorney advice, assistance filing cases, full court representation. Specific practice areas include estate planning, wills, trusts, power of attorney, guardianship/conservatorship, advanced directives, liens, consumer issues, landlord/tenant disputes, Medicaid/Medicare issues, Social Security/SSI problems, living wills, medical durable powers of attorney[1][3][4]. Some offices provide social workers for emotional support and resource identification[4].
- Varies by: region|case_type

**How to apply:**
- Online pre-application: https://www.coloradolegalservices.org (click 'pre-apply online')[6]
- Phone: Call your local office (Denver: 303-area; Colorado Springs: 719-471-0380)[6][8]
- In-person: Visit nearby office during business hours[6]
- In-person courthouse application (Colorado Springs): Room W163, Tuesday and Thursday, 8:30am-12:00pm[8]
- Online intake form: https://colsoi.legalserver.org/modules/matter/extern_intake.php?pid=129&h=daa817[8]

**Timeline:** Not specified in available sources. All applicants must complete intake process before services begin[2][3].
**Waitlist:** Not specified in available sources.

**Watch out for:**
- NOT a hotline for quick guidance — requires full intake screening before any assistance[3]
- Some offices do not handle all case types; must contact local office to confirm they accept your issue[3]
- New applicants have limited hours (typically 8:30am-3pm, not all weekdays)[6]
- Income limits vary by region and household size; must apply to learn exact eligibility[2]
- Preference given to low-income seniors, but seniors above poverty threshold may still qualify[1]
- All services are civil legal only — does not handle criminal matters[2][4]
- Seniors 50-59 may qualify in some service areas under different income thresholds (125% poverty)[5]

**Data shape:** Program eligibility is primarily income-based with age preference (60+), but varies significantly by county and office. No statewide asset limits specified. Benefits are service-based (legal representation/advice) rather than financial. Application requires intake screening; no quick-access hotline model. Regional variations in income thresholds and case type acceptance create complexity for families determining eligibility.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.coloradolegalservices.org

---

### Old Age Pension (OAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income must be less than the maximum monthly benefit, which varies by source but is reported as up to $952 (statewide effective 1/1/2023, reduced dollar-for-dollar by other income)[1], $1,032 or less (Boulder/Douglas Counties)[5][6], or not exceeding $750 grant standard (Grand County)[3]. All income sources counted, including spouse's income; must pursue/apply for other benefits first (e.g., Social Security, SSI, SSDI, pensions, wages). No full household size table available; primarily individual or couple focus ($3,000 resources for couple).
- Assets: Countable resources under $2,000 for individual or $3,000 for couple[1][3][5][6]. Countable: cash, checking/savings accounts, CDs, vehicles, boats, motor homes, stocks, bonds, life insurance, burial contracts/policies, secondary property[3]. Exemptions not fully detailed in sources.
- Colorado resident[4][5]
- U.S. citizen or qualified alien/legal immigrant[2]
- Apply for and pursue all other benefits/sources of income first, providing proof if requested[1]
- Divided into OAP-A (65+), OAP-B (60-64), and OAP-C (with disability criteria)[2]

**Benefits:** Cash benefits up to maximum of $952 per month (effective 1/1/2023, statewide; reduced dollar-for-dollar by other income)[1]; other counties report up to $750 (Grand)[3] or imply similar based on $1,032 income cap[5][6]. Paid via direct deposit or EBT/Quest Card (prepaid debit usable at stores/ATMs)[1][5]. Medical: OAP Health Care Program (ages 60-64, appropriations-based) or Medicaid/Health First Colorado (65+, categorical eligibility)[1][2][5].
- Varies by: region

**How to apply:**
- Online: Colorado PEAK (https://peak.colorado.gov) - fastest[5]
- Phone: Varies by county (e.g., Douglas County: 303-688-4825[6])
- Mail/Paper: County human services department[3][6]
- In-person: County human services office (required interview after application)[6]

**Timeline:** Not specified in sources; annual redetermination every 12 months[1]

**Watch out for:**
- Must exhaust/apply for all other benefits first (e.g., Social Security, SSI) and provide proof; failure disqualifies[1]
- Spouse's income fully countable[3]
- Annual redetermination required, including re-applying for new benefits (e.g., Medicare at 65)[1]
- Benefit reduced dollar-for-dollar by other income; not supplemental to high earners[1]
- County variations in amounts/thresholds; check local county dept[1][3][5][6]
- OAP-B (60-64) and OAP-C have specific disability/employment history rules[2]

**Data shape:** County-administered with varying reported income/benefit caps; cash benefit scales inversely with countable income (dollar-for-dollar reduction); tied to pursuing other benefits; medical benefits via separate programs (OAP Health Care or Medicaid)

**Source:** https://www.sos.state.co.us/CCR/GenerateRulePdf.do?ruleVersionId=5243&fileName=9+CCR+2503-3 (Colorado Code of Regulations 9 CCR 2503-3)[2]

---

### Home Care Allowance (HCA)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific dollar amounts or household size tables provided in regulations; financial eligibility requires: 1) Approval for Supplemental Security Income (SSI); or 2) Meeting all criteria for Aid to the Needy Disabled – State Only (AND-SO); or 3) Continuous receipt of both Old Age Pension (OAP) and HCA as of December 31, 2013. Some sources mention income ≤ 300% Federal Benefit Rate (~$3,200/month individual) or ≤ $19,000/year, but these are not in official regs[1][2][4].
- Assets: Asset limit of $2,000 mentioned in secondary source (likely for individuals); official regs do not specify amounts or what counts/exempts[4].
- Must be evaluated for and denied Home and Community Based Services (HCBS) through Health First Colorado (Medicaid) before HCA consideration[1].
- Functional eligibility based on Capacity Score ≥21 and Need for Paid Care Score (varies by tier: Tier 1: 1-23; Tier 2: 24-37; Tier 3: 38-51)[1].
- Functional assessment determines need: 0=None, 1=Weekly, 2=Daily paid care[1].
- Cannot receive HCA while on HCBS[1][2].
- Designed for lowest functional abilities/greatest need for paid care; case manager assesses[2].
- Income guidelines vary by age and disability severity (contact county for details)[3].

**Benefits:** Cash payments to client for hiring home care provider of choice for unskilled personal care (activities of daily living: transfers, bladder/bowel care, mobility, dressing, bathing, hygiene, eating) and supportive services (e.g., money management, appointments). Skilled personal care not covered. Up to $1,500/month mentioned in secondary source; tiered by functional scores but no exact $ amounts/hours specified in regs[1][3][4].
- Varies by: priority_tier

**How to apply:**
- Online: Colorado PEAK (statewide)[2].
- Phone: Hunger Free Colorado hotline at 855-855-4626[2].
- Paper: Mail to county office (e.g., Douglas: 4400 Castleton Court, Castle Rock, CO 80109), drop-off (Mon-Fri 8am-5pm or secure drop box), fax (e.g., Douglas: 877-285-8988), email (e.g., Douglas: [email protected])[2].
- In-person: County human services office with completed application and documents (e.g., Jefferson County)[3].
- Required interview after application[2].
- Married applicants apply separately[2].

**Timeline:** Within 90 days from receipt of completed application and documents (Jefferson County example)[3].

**Watch out for:**
- Must be denied HCBS/Medicaid first; cannot receive both[1][2].
- Skilled personal care not covered (only unskilled ADL)[1].
- Functional assessment required via case manager; high thresholds (Capacity ≥21)[1][2].
- County-administered: methods/documents vary; bring all docs or delayed[2][3].
- Married apply separately; continuous OAP/HCA grandfathered only if pre-2014[2].
- Not for highest needs (HCBS priority); designed for lowest functional abilities needing paid unskilled care[1][2].

**Data shape:** Tiered by functional assessment scores (Capacity ≥21, Need 1-51); financial tied to SSI/AND-SO/OAP (no fixed $ table); county-administered with local variations; cash to client for provider choice, no direct services

**Source:** https://www.law.cornell.edu/regulations/colorado/9-CCR-2503-5-3.570 (primary regs); county sites like https://www.douglas.co.us/human-services/assistance/financial-assistance/home-care-allowance/[1][2]

---

### Older Coloradans Cash Fund

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Household income ≤ 200% of Federal Poverty Level (approximately $2,400/month or $19,000/year for a one-person household; varies by household size based on FPL tables)
- Assets: Assets not specified in detail; general senior program limits around $2,000 for individuals may apply but not confirmed for this fund
- Colorado resident
- U.S. citizen or qualified non-citizen

**Benefits:** One-time grants up to $1,200/year or $1,500/month for personal care, respite, home modifications, supplies, home repairs (ramps, grab bars), utility assistance, minor adaptive equipment (walkers, shower chairs)
- Varies by: household_size

**How to apply:**
- Contact Colorado’s Office on Aging (specific phone/website not in results; apply via local county Department of Human Services or case manager)
- Complete Adult Client Assessment Tool (ACAT) via county Department of Human Services
- Submit Health First Colorado application online or by mail

**Timeline:** Not specified

**Watch out for:**
- One-time grants only, not ongoing; must coordinate with other benefits like OAP or Health First Colorado; income includes all sources like Social Security; tax filing required for some rebates; often confused with Old Age Pension (OAP) cash assistance program

**Data shape:** One-time grant model distinct from monthly OAP payments; ties into broader elder care assessments like ACAT; income at 200% FPL threshold higher than some programs

**Source:** https://www.colorado.gov/pga/office-aging (inferred from administration by Colorado’s Office on Aging; primary rules in CDHS sites)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Health First Colorado Buy-In (QMB, SLMB, | benefit | state | deep |
| Colorado Medicaid HCBS Waivers (e.g., Ho | benefit | state | deep |
| Colorado PACE | benefit | local | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LEAP (Low-income Energy Assistance Progr | benefit | state | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Colorado SHIP (State Health Insurance As | resource | federal | simple |
| Meals on Wheels Colorado | benefit | federal | deep |
| Community Access Services (CAS) | benefit | local | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Colorado Legal Services (Senior Legal Ho | resource | state | simple |
| Old Age Pension (OAP) | benefit | state | deep |
| Home Care Allowance (HCA) | benefit | state | deep |
| Older Coloradans Cash Fund | benefit | state | deep |

**Types:** {"benefit":11,"resource":2,"employment":1}
**Scopes:** {"state":7,"local":2,"federal":5}
**Complexity:** {"deep":11,"simple":2,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/CO/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **Individual care plan developed by IDT based on participant needs and goals[4]**: 1 programs
- **household_size**: 2 programs
- **not_applicable**: 2 programs
- **region**: 2 programs
- **region|case_type**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Health First Colorado Buy-In (QMB, SLMB, QI)**: Tiered by QMB/SLMB/QI with escalating income limits and decreasing benefit levels; asset-tested unlike some Medicaid; funding-capped for QI; separate from disability Buy-In programs which offer full Health First Colorado services for premium
- **Colorado Medicaid HCBS Waivers (e.g., Home Care Allowance)**: Multiple waivers (e.g., EBD for elderly); eligibility via dual county (financial) + regional agency (functional) assessments; benefits individualized by service plan, not fixed $; waitlists and regional case managers create variability; SSI-multiple for income
- **Colorado PACE**: Colorado PACE is a service-based program (not a cash benefit). Eligibility hinges on nursing home level of care certification, not income. The program operates through multiple regional providers (at least Colorado PACE and Rocky Mountain PACE identified). Income limits are tied to Medicaid/Medicare eligibility, not program-specific thresholds. Specific dollar amounts for income/asset limits, detailed benefit schedules, application forms, required documents, and regional wait times are not available in the provided search results.
- **SNAP (Supplemental Nutrition Assistance Program)**: Eligibility expands for 60+/disabled (no gross test if net/assets met, no standard asset limit); benefits scale by household size/net income; county-administered with work rule variations
- **LEAP (Low-income Energy Assistance Program)**: Income limits at 60% state median, updated annually by Nov 1 and vary by household size; priority-based benefits with add-ons like weatherization; county-administered with statewide uniformity but local application points
- **Weatherization Assistance Program (WAP)**: Income eligibility hybrid: auto-qualify via listed assistance programs or tiered limits (60% SMI for 1-7, 200% FPL for 8+, 80% AMI for select utilities), fully county/provider-specific charts required; local sub-grantees handle apps with varying forms/contacts/waitlists
- **Colorado SHIP (State Health Insurance Assistance Program)**: no income/asset test; open to Medicare-eligible and families statewide; service-based counseling via phone statewide with local delivery network; no formal application or waitlist
- **Meals on Wheels Colorado**: Decentralized by county/provider with no uniform eligibility/fees; regionally fragmented providers, no income test but sliding donations; homebound focus with exceptions for disability/referral
- **Community Access Services (CAS)**: No data on elderly program; results show CAS as statewide counselor certification with tiered education/experience (CAT/CAS/LAC), no income/asset tests, not client services.
- **Senior Community Service Employment Program (SCSEP)**: Federally uniform but locally administered by grantees like SER National in CO; income scales by household size at 125% FPL (annual updates); priority tiers affect access; county-restricted by provider coverage; waitlists common
- **Colorado Legal Services (Senior Legal Hotline)**: Program eligibility is primarily income-based with age preference (60+), but varies significantly by county and office. No statewide asset limits specified. Benefits are service-based (legal representation/advice) rather than financial. Application requires intake screening; no quick-access hotline model. Regional variations in income thresholds and case type acceptance create complexity for families determining eligibility.
- **Old Age Pension (OAP)**: County-administered with varying reported income/benefit caps; cash benefit scales inversely with countable income (dollar-for-dollar reduction); tied to pursuing other benefits; medical benefits via separate programs (OAP Health Care or Medicaid)
- **Home Care Allowance (HCA)**: Tiered by functional assessment scores (Capacity ≥21, Need 1-51); financial tied to SSI/AND-SO/OAP (no fixed $ table); county-administered with local variations; cash to client for provider choice, no direct services
- **Older Coloradans Cash Fund**: One-time grant model distinct from monthly OAP payments; ties into broader elder care assessments like ACAT; income at 200% FPL threshold higher than some programs

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Colorado?
