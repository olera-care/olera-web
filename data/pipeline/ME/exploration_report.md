# Maine Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.055 (11 calls, 4.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 9 |
| Programs deep-dived | 7 |
| New (not in our data) | 5 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 5 programs
- **financial**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]))
- **income_limit**: Ours says `$1924` → Source says `$2,608` ([source](https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases; max amounts by household size (e.g., 1-person: $298/mo, scales up; actual amount based on income/expenses like medical >$35/mo for 60+).[4]` ([source](https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]`

### State Health Insurance Assistance Program (SHIP) - Maine Senior Health Insurance Assistance Program

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, confidential one-on-one counseling including: information on Medicare (Parts A, B, C, D), Medicare Advantage, Medigap, MaineCare, prescription drug coverage/options, preventive benefits, medical bills/claims/appeals, comparison of supplemental policies/plans, enrollment in Medicare Savings Programs, referrals to agencies (e.g., CMS, SSA, DHHS), and programs to reduce out-of-pocket costs like prescription discounts. Provided by trained counselors who do not sell insurance.[2][5]` ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance[2]))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance[2]`

## New Programs (Not in Our Data)

- **Home and Community-Based Services (HCBS) Waivers** — service ([source](https://www.maine.gov/dhhs/oads/about-us/initiatives/hcbs))
  - Shape notes: Multiple waivers under HCBS umbrella with target populations (e.g., elderly/disabled vs. intellectual disabilities); eligibility ties to MaineCare + NFLOC; services person-centered with funding caps creating waitlists; no fixed hours/dollars, varies by plan and availability
- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.mainehousing.org/programs-services/energy/energydetails/liheap))
  - Shape notes: Income table by time period (1/3/12 months) and household size; medical deductions and TANF auto-qualify; CAA-administered statewide with local contacts; benefits by size/income/fuel.
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.mainehousing.org/programs-services/HomeImprovement/homeimprovementdetail/weatherization[2]))
  - Shape notes: Administered regionally via local Community Action Agencies/subgrantees under MaineHousing; eligibility tied to HEAP or 200% FPL with annual updates; priority tiers favor vulnerable households (elderly, disabled, young children); no fixed dollar benefits—in-kind services only.
- **Home Delivered Meals** — service ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/food-and-nutrition))
  - Shape notes: Administered regionally through 5 Area Agencies on Aging with local providers; no income/asset tables or fixed dollar values; eligibility via functional assessment, not financial test; short/long-term flexibility
- **Maine Legal Services for the Elderly** — service ([source](https://mainelse.org[9]))
  - Shape notes: No fixed income/asset tables; eligibility case-by-case for low-income seniors with priority on human needs crises; statewide with local offices; distinguishes from general legal aid by elder-specific focus and free helpline advice

## Program Details

### Home and Community-Based Services (HCBS) Waivers

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Follows MaineCare Medicaid financial eligibility rules, which include income limits varying by household size (specific 2026 dollar amounts not detailed in sources; use MaineCare Eligibility Test for current figures). No waiver-specific income limits stated beyond standard Medicaid thresholds.
- Assets: Home equity exempt if applicant lives there or intends to return, with equity interest ≤ $1,130,000 in 2026; exempt if spouse or child under 21 or disabled/blind child lives there. Other assets follow standard MaineCare rules (details not specified).
- Maine resident
- Nursing Facility Level of Care (NFLOC): requires daily skilled nursing or significant assistance with ≥3 ADLs (bed mobility, locomotion, transferring, toileting, eating), or combination of behavior/cognition/skilled nursing with assistance in ≥1 ADL
- Assessed via in-person Medical Eligibility Determination (MED) tool by registered nurse
- At risk of institutionalization
- Physically disabled (ages 18+ for adults waiver) or senior (65+)

**Benefits:** Care coordination, personal support services, home health services, adult day health services, transportation, emergency response system, environmental modifications, respite services (Elderly/Adults with Disabilities Waiver - Section 19). Other waivers (e.g., Section 21, 29) include community support, work support, home support (1/4 hour or per diem), assistive technology, non-medical transportation, employment specialist services. No specific dollar amounts or hours per week stated; services based on person-centered plan and available funding.
- Varies by: priority_tier

**How to apply:**
- Contact Office for Family Independence for MaineCare eligibility (no specific phone/URL listed; see maine.gov/dhhs)
- Case Manager assists with MaineCare and waiver application
- In-person functional needs assessment by registered nurse

**Timeline:** Not specified
**Waitlist:** Funded openings must be available; waitlists exist due to limited slots (e.g., for Sections 21/29)

**Watch out for:**
- Multiple distinct HCBS waivers exist (e.g., Elderly/Adults with Disabilities - ME 0276/Section 19; Intellectual Disabilities/Autism - Section 21/29; Brain Injury - ME 1082); can only enroll in one at a time
- Must first qualify for MaineCare; waiver adds services but requires NFLOC
- Limited funded slots create waitlists; not guaranteed access
- Home equity limit is $1,130,000 (2026); exceeds may disqualify unless exemptions apply
- Relatives/spouses can provide services but must complete training/certification by deadline

**Data shape:** Multiple waivers under HCBS umbrella with target populations (e.g., elderly/disabled vs. intellectual disabilities); eligibility ties to MaineCare + NFLOC; services person-centered with funding caps creating waitlists; no fixed hours/dollars, varies by plan and availability

**Source:** https://www.maine.gov/dhhs/oads/about-us/initiatives/hcbs

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled, only net income test (100% FPL) applies if over gross limit; gross income limit (200% FPL, Oct 1, 2025–Sept 30, 2026): 1: $2,608/mo, 2: $3,526/mo, 3: $4,442/mo, 4: $5,358/mo, 5: $6,276/mo, 6: $7,192/mo, 7: $8,108/mo (+$916/additional). Maximum monthly SNAP amounts: 1: $298, 2: $546, 3: $785, 4: $994, 5: $1,183, 6: $1,421, 7: $1,571, 8: $1,789 (+$218/additional).[1][4]
- Assets: No asset limit in Maine due to state-funded expansion; home, one vehicle (plus income-producing vehicles), and vehicles under $4,650 value exempt. Federal rules ($4,500 limit) may apply alternatively for 60+/disabled over gross income.[1][2]
- Maine resident
- U.S. citizen or qualified non-citizen
- Social Security number (or applied for one)
- Work registration for able-bodied adults 18-54 (ABAWD rule: 3 months/36 months unless exempt; exemptions include 60+, disabled, caring for child<6 or disabled person, pregnant, student, homeless, veteran, former foster youth<25; waived in some Maine areas thru Sept 30, 2024)
- Household includes those who buy/prepare food together

**Benefits:** Monthly EBT card for food purchases; max amounts by household size (e.g., 1-person: $298/mo, scales up; actual amount based on income/expenses like medical >$35/mo for 60+).[4]
- Varies by: household_size

**How to apply:**
- Online: https://www.mymaineconnection.gov[7]
- Mail: Office for Family Independence, 114 Corn Shop Lane, Farmington, ME 04938[7]
- Phone: Contact local DHHS Office for Family Independence (specific numbers via https://www.maine.gov/dhhs/ofi/)[4]
- In-person: Local DHHS Office for Family Independence offices

**Timeline:** Not specified in sources; typically 30 days, expedited for urgent cases

**Watch out for:**
- Elderly/disabled households skip gross income test, only need net income; report medical expenses >$35/mo to maximize benefits[1][5]
- Maine's state-funded expansion eliminates effective asset limit[2]
- Household defined by food purchase/preparation, not just cohabitation[3]
- ABAWD exemptions expanded (e.g., veterans, homeless); check local waivers[2]
- Same benefits whether federal or Maine-funded[2]

**Data shape:** Elderly/disabled special rules (no gross income test, net only at 100% FPL); benefits scale by household size; no asset limit due to state expansion; ABAWD waivers in select areas

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Maximum gross household income for 2025-2026 season (applies to HEAP/LIHEAP in Maine): Household of 1: $3,070 (1 month), $9,209 (3 months), $36,836 (12 months); 2: $4,014/$12,043/$48,170; 3: $4,959/$14,876/$59,504; 4: $5,903/$17,710/$70,839; 5: $6,848/$20,543/$82,173; 6: $7,792/$23,377/$93,507; 7: $7,969/$23,908/$95,632; 8: $8,146/$24,439/$97,757; 9: $8,324/$24,971/$99,882; 10: $8,501/$25,502/$102,008. For >10 persons, contact Community Action Agency (CAA). Paid documented medical expenses may be deducted from income. TANF recipients are automatically income-eligible and receive highest benefit for household size. Household includes everyone at address sharing utility bill. Proof of citizenship or eligible immigration status required (US citizen, refugee, asylee, paroled >=1 year, etc.; mixed status OK for eligible members).
- Assets: No asset limits mentioned.
- Proof of citizenship/immigration status for household members.
- Must face energy costs (homeowners/renters, even if heat in rent).

**Benefits:** One-time payment for heating costs directly to utility/fuel provider. Amount based on household size, income, fuel type, and other factors. Crisis component for emergencies (e.g., shutoff, broken heater). Highest benefit for TANF households. Specific max/min amounts not detailed; varies.
- Varies by: household_size|priority_tier

**How to apply:**
- Online via MaineHousing portal (starting 2024; exact URL: mainehousing.org/programs-services/energy/energydetails/liheap)
- In-person or phone appointment at local Community Action Agency (CAA; many start July 1; contact CAA directly)
- Phone examples: Community Concepts 800-866-5588; general info 1-800-452-4668 or mainehousing.org

**Timeline:** Not specified; first-come first-served, funds limited.
**Waitlist:** No waitlist mentioned; apply early as funding may run out and demand up 20%.

**Watch out for:**
- Funding first-come first-served; apply ASAP, especially fall/winter for heating (not year-round; no cooling).
- Respond immediately to document requests or app incomplete.
- Income gross before taxes; includes all at address on utility bill.
- Medical deductions or TANF can qualify over limits—apply anyway.
- Crisis only for emergencies.
- Immigration status: eligible members only in mixed households.

**Data shape:** Income table by time period (1/3/12 months) and household size; medical deductions and TANF auto-qualify; CAA-administered statewide with local contacts; benefits by size/income/fuel.

**Source:** https://www.mainehousing.org/programs-services/energy/energydetails/liheap

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the federal poverty level, or categorical eligibility via participation in HEAP, SNAP, TANF, or MaineCare. Households receiving HEAP benefits are automatically eligible. Exact dollar amounts vary annually by household size and federal poverty guidelines; contact local agency for current table as thresholds change yearly.[1][2][3]
- Assets: No asset limits mentioned in program guidelines.[1][2][3]
- Home must be in good structural condition.[2]
- Principal year-round residence (not seasonal, second home, or vacation rental).[6]
- Not previously weatherized under WAP or MaineHousing within the past 15 years.[6][7]
- For rentals: Written landlord authorization required, with at least 66% (or 50% in some cases) of units benefiting.[3]

**Benefits:** Free energy efficiency improvements at no cost to qualifying households, including insulation (e.g., blown-in cellulose for attics, walls, basements), air sealing (closing gaps/cracks), heating system repairs/replacements if unsafe/inefficient, health/safety measures (ventilation, carbon monoxide detectors, moisture control), weather-stripping, caulking, and some safety-related repairs. Services for single-family homes, mobile homes, and 2-4 unit dwellings.[1][2][5][7]
- Varies by: priority_tier

**How to apply:**
- Contact local Community Action Agency or subgrantee (e.g., Greater Portland: The Opportunity Alliance; York County: York County Community Action Corporation (YCCAC) at 207-206-1261; Penquis area: Penquis at 207-974-2407).[1][5][7]
- Administered statewide by MaineHousing through regional providers; no central online application listed, apply via phone or local agency.[1][2]

**Timeline:** Not specified; income re-verified prior to energy audit.[3]
**Waitlist:** Likely due to funding limits and priority (e.g., elderly 60+, young children, disabled), but no specific details provided.[7]

**Watch out for:**
- Must not have received prior WAP or MaineHousing weatherization in the past 15 years; home cannot be seasonal/vacation property.[6][7]
- Renters need landlord approval; structural issues disqualify home.[2][3]
- Priority for elderly (60+), young children, disabled—others may face longer waits.[7]
- Income thresholds change annually; HEAP participation simplifies but not required if under 200% FPL.[1][3]
- Not a loan/rebate—services only if eligible; previously weatherized homes ineligible for some related programs.[1][6]

**Data shape:** Administered regionally via local Community Action Agencies/subgrantees under MaineHousing; eligibility tied to HEAP or 200% FPL with annual updates; priority tiers favor vulnerable households (elderly, disabled, young children); no fixed dollar benefits—in-kind services only.

**Source:** https://www.mainehousing.org/programs-services/HomeImprovement/homeimprovementdetail/weatherization[2]

---

### State Health Insurance Assistance Program (SHIP) - Maine Senior Health Insurance Assistance Program


**Eligibility:**
- Income: No income limits; services are free and available regardless of income.[2]
- Assets: No asset limits or tests apply.[2]
- Available to older people (typically Medicare-eligible age 65+), people with Medicare due to disability (under 65), their families, and caregivers.[2][4]

**Benefits:** Free, confidential one-on-one counseling including: information on Medicare (Parts A, B, C, D), Medicare Advantage, Medigap, MaineCare, prescription drug coverage/options, preventive benefits, medical bills/claims/appeals, comparison of supplemental policies/plans, enrollment in Medicare Savings Programs, referrals to agencies (e.g., CMS, SSA, DHHS), and programs to reduce out-of-pocket costs like prescription discounts. Provided by trained counselors who do not sell insurance.[2][5]

**How to apply:**
- Phone: Contact local providers such as Southern Maine Agency on Aging at 207-396-6524 for appointments (phone, Zoom, in-person at select locations);[8]
- Statewide: Call Maine Office of Aging and Disability Services (no direct number in results, use shiphelp.org for local connection);[3][9]
- In-person or phone through Maine's five Area Agencies on Aging or Legal Services for Maine Elders;[2]
- Website: www.shiphelp.org to connect with local Maine SHIP counselors.[9]

**Timeline:** No formal application or processing; services provided via appointment scheduling, typically immediate upon contact.[2][8]

**Watch out for:**
- Not an insurance or financial aid program—provides counseling only, no direct payments or coverage;[2]
- Counselors do not sell or recommend specific policies, only objective info—people miss this and expect sales;[2]
- Confused with MaineCare (which has income limits); SHIP helps navigate Medicare/MaineCare but has open eligibility;[1][2]
- Services via local agencies, not centralized—must contact regional provider for appointment.[7][8]

**Data shape:** no income/asset test; counseling-only service via statewide network of Area Agencies on Aging with local delivery variations; open to Medicare beneficiaries/families regardless of income

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance[2]

---

### Home Delivered Meals

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned in state program sources; priority given to low-income older adults, but not a strict cutoff. Mom's Meals through health plans may have separate Medicaid/Medicare criteria.
- Assets: No asset limits or details on what counts/exempts specified.
- Homebound and unable to leave home without assistance
- Unable to prepare a nutritionally balanced meal themselves
- No one available to prepare meals for them
- Physical or cognitive limitations preventing meal preparation
- Confirmed via in-person assessment within 10 business days of referral (provider requirement)

**Benefits:** Healthy, nutritious, balanced meals delivered to the home up to 5 days a week by volunteers/staff; includes wellness/healthy eating information; access to registered dietitians for private nutrition counseling (e.g., diabetes, weight management); safety check-ins during delivery; short-term (post-hospital) or long-term basis.
- Varies by: priority_tier

**How to apply:**
- Contact your local Aging & Disability Resource Center (ADRC) or Area Agency on Aging (AAA) for assessment and referral
- No central statewide phone or online form specified; Eastern Agency on Aging example for their region
- Provider conducts in-person assessment post-referral

**Timeline:** In-person assessment within 10 business days of referral; meals provided within 2 business days of assessment or next scheduled delivery date[6]
**Waitlist:** Not mentioned; may vary regionally due to provider capacity

**Watch out for:**
- Not a direct state application; must go through local AAA/ADRC for assessment—no central phone/website for statewide apply
- Requires in-person eligibility assessment by provider, not self-determined
- Priority for low-income/rural/vulnerable, but no strict income test—others may be waitlisted
- Separate from private options like Mom's Meals ($9.49/meal if not through health plan)
- Also available to spouses/caregivers/disabled under 60 in some cases, but primary for 60+ homebound

**Data shape:** Administered regionally through 5 Area Agencies on Aging with local providers; no income/asset tables or fixed dollar values; eligibility via functional assessment, not financial test; short/long-term flexibility

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/food-and-nutrition

---

### Maine Legal Services for the Elderly

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income limits are not explicitly stated in available sources; services target low-income seniors, often those at or below 200% of federal poverty guidelines based on similar Maine legal aid programs, but families should call the helpline for current assessment[2][5][7]. No specific dollar amounts or household size table provided.
- Assets: No asset limits specified; focus is on low-income eligibility determined case-by-case[2][5].
- Maine resident
- Basic human needs at stake (e.g., MaineCare eligibility issues, elder abuse, housing, public benefits)
- Non-criminal legal problems

**Benefits:** Free legal services including information, advice, and representation on Medicare/MaineCare disputes, health coverage, elder abuse/protection orders, housing/eviction/foreclosure, consumer debt, public assistance benefits, guardianship, discharges, powers of attorney, health care advance directives, and Medicare Part D prescription drug assistance[2][5][9].
- Varies by: priority_tier

**How to apply:**
- Phone: Helpline at 1-800-750-5353 (in-state) or 207-623-1797[2][5][9]
- Website: mainelse.org for information and Elder Rights Handbook[2][9]
- In-person: Attorneys in offices across the state for representation cases[5]

**Timeline:** Not specified; initial helpline advice is immediate, representation depends on case priority.

**Watch out for:**
- Services are priority-based for basic human needs at stake, not all cases accepted; may refer to private attorneys if unable to help[5]
- Do not use generic pre-printed legal forms (e.g., powers of attorney) as they may be invalid in Maine—consult LSE attorney[2]
- Not a general legal aid; focused on seniors 60+ with specific elder issues, not criminal matters[2][5]
- Nursing homes may push MaineCare applications without asset protection advice—seek LSE for related issues[3]

**Data shape:** No fixed income/asset tables; eligibility case-by-case for low-income seniors with priority on human needs crises; statewide with local offices; distinguishes from general legal aid by elder-specific focus and free helpline advice

**Source:** https://mainelse.org[9]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Home Delivered Meals | benefit | state | deep |
| Maine Legal Services for the Elderly | resource | state | simple |

**Types:** {"benefit":5,"resource":2}
**Scopes:** {"state":3,"federal":4}
**Complexity:** {"deep":5,"simple":2}

## Content Drafts

Generated 7 page drafts. Review in admin dashboard or `data/pipeline/ME/drafts.json`.

- **Home and Community-Based Services (HCBS) Waivers** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 4 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP) - Maine Senior Health Insurance Assistance Program** (resource) — 2 content sections, 6 FAQs
- **Home Delivered Meals** (benefit) — 3 content sections, 6 FAQs
- **Maine Legal Services for the Elderly** (resource) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Home and Community-Based Services (HCBS) Waivers**: Multiple waivers under HCBS umbrella with target populations (e.g., elderly/disabled vs. intellectual disabilities); eligibility ties to MaineCare + NFLOC; services person-centered with funding caps creating waitlists; no fixed hours/dollars, varies by plan and availability
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled special rules (no gross income test, net only at 100% FPL); benefits scale by household size; no asset limit due to state expansion; ABAWD waivers in select areas
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income table by time period (1/3/12 months) and household size; medical deductions and TANF auto-qualify; CAA-administered statewide with local contacts; benefits by size/income/fuel.
- **Weatherization Assistance Program (WAP)**: Administered regionally via local Community Action Agencies/subgrantees under MaineHousing; eligibility tied to HEAP or 200% FPL with annual updates; priority tiers favor vulnerable households (elderly, disabled, young children); no fixed dollar benefits—in-kind services only.
- **State Health Insurance Assistance Program (SHIP) - Maine Senior Health Insurance Assistance Program**: no income/asset test; counseling-only service via statewide network of Area Agencies on Aging with local delivery variations; open to Medicare beneficiaries/families regardless of income
- **Home Delivered Meals**: Administered regionally through 5 Area Agencies on Aging with local providers; no income/asset tables or fixed dollar values; eligibility via functional assessment, not financial test; short/long-term flexibility
- **Maine Legal Services for the Elderly**: No fixed income/asset tables; eligibility case-by-case for low-income seniors with priority on human needs crises; statewide with local offices; distinguishes from general legal aid by elder-specific focus and free helpline advice

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Maine?
