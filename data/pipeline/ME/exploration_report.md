# Maine Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.060 (12 calls, 48s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 10 |
| Programs deep-dived | 8 |
| New (not in our data) | 6 |
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
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 7 programs
- **financial**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### SNAP (Supplemental Nutrition Assistance Program)

- **income_limit**: Ours says `$1924` → Source says `$2,608` ([source](https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for food purchases (groceries, not hot food/alcohol/tobacco). Maximum monthly amounts (Oct. 1, 2025-Sept. 30, 2026): 1: $298; 2: $546; 3: $785; 4: $994; 5: $1,183; 6: $1,421; 7: $1,571; 8: $1,789; each additional: +$218. Actual amount based on income, expenses (e.g., higher for medical costs in elderly/disabled households).[4]` ([source](https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]`

### Legal Services for Maine Elders (LSE)

- **benefit_value**: Ours says `$500 – $3,000/year` → Source says `Free legal advice and representation on: Medicare/MaineCare, health care coverage disputes, elder abuse and protection orders, housing issues (eviction, foreclosure), consumer debt, public assistance benefits, guardianship, discharges, powers of attorney, health care advance directives. Specialized Medicare Part D unit for prescription drug assistance.[2][3]` ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/legal-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/legal-assistance`

## New Programs (Not in Our Data)

- **Program of All-Inclusive Care for the Elderly (PACE) - Maine PACE** — service ([source](No official Maine PACE program website; general info at https://www.npaonline.org/ or https://www.cms.gov/medicare/medicaid-coordination/about/pace[1][8]))
  - Shape notes: No operational programs in Maine; eligibility mirrors national PACE but no service areas or providers; not available statewide or regionally
- **Home and Community-Based Services Waiver Programs (MaineCare Sections 21 and 29)** — service ([source](https://www.maine.gov/dhhs/oads/get-support/adults-intellectual-disability-and-autism/waiver-services))
  - Shape notes: This program has two distinct sections (21 and 29) with different eligibility criteria and service focuses. Section 21 targets individuals with ID/ASD who would otherwise need institutional care; Section 29 serves adults with developmental disabilities more broadly. Both are capped programs with waitlists. Income and asset limits are standardized statewide but may vary by household composition. The program is transitioning to a new 'Lifespan Waiver' structure as of 2026, which may consolidate or restructure current Section 21 and 29 services. Case Managers play a critical role in application and service planning. Financial eligibility is determined by the Office for Family Independence, while medical eligibility is determined separately.
- **Community Aging in Place Grant Program** — service ([source](https://mainehousing.org/docs/default-source/ehs-partners-library/elderly-home-modification-programs/program-guidance-brochures/program-guidance/community-aging-in-place-programs-guidance-01012023.pdf?sfvrsn=742d8115_2))
  - Shape notes: Administered regionally by partner non-profits with varying service areas; AMI-based income (varies by location/household); two variants (State/Federal) with age/income differences; no central application—partner dependent
- **State Health Insurance Assistance Program (SHIP) - Maine SHIP** — service ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance[4]))
  - Shape notes: no income/asset test for counseling; free service for all Medicare-eligible; delivered via network of 5 Area Agencies on Aging; distinguishes from financial programs like MSP by providing enrollment assistance only
- **Home Delivered Meals** — service ([source](https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/food-and-nutrition))
  - Shape notes: Delivered via 5 regional Area Agencies on Aging with provider variations; no strict income/asset tests but functional eligibility via assessment; some paid tiers alongside subsidized options; county restrictions in private variants.
- **Maine Legal Services for the Elderly** — service ([source](https://mainelse.org[8]))
  - Shape notes: No strict income/asset tables or fixed benefits; eligibility based on age 60+, residency, economic/social need, and priority legal issues affecting basic needs; services tiered by case urgency with statewide helpline access but representation varies by office availability

## Program Details

### Program of All-Inclusive Care for the Elderly (PACE) - Maine PACE

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits; no financial criteria considered for eligibility[1][2][3]
- Assets: No asset limits; no financial criteria considered for eligibility[1][2][3]
- Live in the service area of a PACE organization (no programs currently operating in Maine)[1][3]
- Certified by the state of Maine as requiring nursing home level of care[1][2]
- Able to live safely in the community with PACE services[1][2]
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice[1]

**Benefits:** Comprehensive medical and social services including primary care, hospital and emergency care, prescription drugs, social services, restorative therapies, personal care, respite care, and all other services determined necessary by the interdisciplinary team to keep participants in the community; no deductibles or copays for covered services; person-centered care plan coordinated with primary care physician[1][2][3][8]

**Timeline:** Not applicable; no operational programs in Maine

**Watch out for:**
- Maine does not currently have any operational PACE programs or providers[2][3][9]
- State certification for nursing home level of care required, but no programs available to enroll in[1][3]
- While no programs exist now, past RFI indicates potential future development; check Maine DHHS for updates[9]
- Private pay possible if programs launch, but Medicaid covers fully for eligible; Medicare-only pay Medicaid portion[3]
- Confused with other Maine programs like Elderly and Adults with Disabilities Waiver, which has financial limits and different criteria[4]

**Data shape:** No operational programs in Maine; eligibility mirrors national PACE but no service areas or providers; not available statewide or regionally

**Source:** No official Maine PACE program website; general info at https://www.npaonline.org/ or https://www.cms.gov/medicare/medicaid-coordination/about/pace[1][8]

---

### Home and Community-Based Services Waiver Programs (MaineCare Sections 21 and 29)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18 or older for Section 21 and 29; Section 19 (elderly/disabled waiver) requires age 18++
- Income: Income limits vary by program and household composition. For Long-Term Care MaineCare (waiver programs), the income standard is $2,742 for individuals in waiver settings[2]. Applicants with income above the limit may qualify through a 'spend-down' process, where they reduce monthly income to the MaineCare standard; once the deductible is met, coverage is granted for a limited time period (usually 6 months or less)[2]. Asset limits: up to $8,000 of savings for an individual, $12,000 for a couple may be excluded; any amount over the excluded amount is counted toward the asset limit[2]. A 60-month financial lookback is completed for applicants seeking Long Term Care MaineCare to determine if the individual engaged in improper asset transfers[2].
- Assets: Up to $8,000 for an individual or $12,000 for a couple excluded from asset calculation; amounts exceeding these thresholds count toward the asset limit[2].
- Must be enrolled in MaineCare[3]
- Must meet medical eligibility requirements (medical level of care)[1][3]
- For Section 21: Must have intellectual disability (ID) or autism spectrum disorder (ASD) and would otherwise qualify for care in an Intermediate Care Facility for Individuals with Intellectual Disabilities (ICF/IID)[1]
- For Section 29: Similar medical eligibility requirements for individuals with developmental disabilities[1]
- Personal plan must identify needs for habilitative, therapeutic, and intervention services with the overall goal of community inclusion[1]
- A funded opening must be available (program is capped)[1][3]
- Can only be enrolled in one waiver at a time[3]

**Benefits:** Section 21 and 29 provide a comprehensive mix of services including: home support (support to live alone or in group home settings), community support, work support, career planning, assistive technology, durable medical equipment, therapy services, transportation, and respite care[1][3]. Personal Needs Allowance for waiver recipients: $2,430[2].
- Varies by: program_section_and_individual_plan

**How to apply:**
- Contact a Case Manager who can help applicants apply for MaineCare and waiver services[3]
- Apply through the Office for Family Independence for MaineCare eligibility determination[3]
- In-person, phone, or mail through local MaineCare offices (specific contact information not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Yes — there are waitlists for Section 21 and Section 29 waivers. As of 2026, current waitlist members will receive priority consideration for enrollment in Maine's new Lifespan Waiver[7].

**Watch out for:**
- Only one waiver enrollment at a time — applicants must choose between Section 21 and Section 29[3]
- Funded openings are limited and capped; availability is not guaranteed even if medically and financially eligible[1][3]
- MaineCare enrollment is a prerequisite; applicants must qualify for MaineCare before accessing waiver services[3]
- 60-month financial lookback applies to Long Term Care MaineCare applications, which can disqualify applicants who transferred assets within the past 5 years[2]
- Income spend-down may be required; applicants with income above the limit must reduce income to the MaineCare standard to qualify[2]
- Section 21 is specifically for individuals with ID or ASD; other developmental disabilities may fall under Section 29 or other waivers[1]
- Personal Needs Allowance ($2,430 for waiver recipients) is separate from service benefits and represents the amount individuals can retain for personal expenses[2]
- Two-thirds of Section 21 waitlist members already receive Section 29 services, suggesting some waitlist placements may be precautionary rather than reflecting immediate need[7]

**Data shape:** This program has two distinct sections (21 and 29) with different eligibility criteria and service focuses. Section 21 targets individuals with ID/ASD who would otherwise need institutional care; Section 29 serves adults with developmental disabilities more broadly. Both are capped programs with waitlists. Income and asset limits are standardized statewide but may vary by household composition. The program is transitioning to a new 'Lifespan Waiver' structure as of 2026, which may consolidate or restructure current Section 21 and 29 services. Case Managers play a critical role in application and service planning. Financial eligibility is determined by the Office for Family Independence, while medical eligibility is determined separately.

**Source:** https://www.maine.gov/dhhs/oads/get-support/adults-intellectual-disability-and-autism/waiver-services

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Income: Maine uses a gross income limit of 200% of the Federal Poverty Level (FPL) for Oct. 1, 2025 through Sept. 30, 2026. Households with a member 60+ or disabled can qualify by meeting net income (100% FPL) and asset tests if over gross limit. Gross monthly income limits by household size: 1: $2,608-$2,609; 2: $3,526-$3,525; 3: $4,442; 4: $5,358-$5,359; 5: $6,276-$6,275; 6: $7,192; 7: $8,108-$8,109; 8: $9,025; each additional: +$916-$917.[1][4][5]
- Assets: No asset limit in Maine for most households (broad-based categorical eligibility). For households with member 60+ or disabled over gross income limit, federal asset limit of $4,500 applies if qualifying under net income test. Exempt: primary home, one household vehicle (plus income-producing vehicles), vehicles valued under $4,650. Countable: bank accounts, other resources.[1][8]
- Maine resident.
- U.S. citizen or lawfully present non-citizen.
- Social Security number (or proof applied).
- Able-bodied adults without dependents (ABAWD) aged 18-54 face 3-month limit in 36 months unless exempt (e.g., caring for child under 6/disabled, pregnant, homeless, veteran, former foster youth under 25, student exemptions, physically/mentally unable to work); waivers in some Maine areas through Sept. 30, 2024.
- Household includes those who buy/prepare food together; report medical costs over $35/month for 60+/disabled to increase benefits.
- Register for work if able-bodied (exceptions for elderly/disabled).

**Benefits:** Monthly EBT card benefits for food purchases (groceries, not hot food/alcohol/tobacco). Maximum monthly amounts (Oct. 1, 2025-Sept. 30, 2026): 1: $298; 2: $546; 3: $785; 4: $994; 5: $1,183; 6: $1,421; 7: $1,571; 8: $1,789; each additional: +$218. Actual amount based on income, expenses (e.g., higher for medical costs in elderly/disabled households).[4]
- Varies by: household_size

**How to apply:**
- Online: My Maine Connection at https://www.mymaineconnection.gov[8]
- Mail paper application to: Office for Family Independence, 114 Corn Shop Lane, Farmington, ME 04938[8]
- Phone: Contact local DHHS Office for Family Independence (numbers vary by region; find via https://www.maine.gov/dhhs/ofi/contact-us.html)
- In-person: Local DHHS Office for Family Independence offices statewide

**Timeline:** Typically 30 days; expedited if very low income (7 days).[1]

**Watch out for:**
- Elderly/disabled households over gross limit can still qualify via net income test (100% FPL) + federal asset limit ($4,500); many miss this.[1][5]
- Report out-of-pocket medical expenses >$35/month to boost benefits for 60+/disabled.[5][8]
- Household defined by who buys/prepares food together, not just who lives together.[3]
- No asset test for most, but federal rules apply if bypassing gross income.[1]
- ABAWD limits for 18-54 unless exempt/waived; check local waivers.[2]
- Maine expanded beyond federal rules (200% FPL gross vs. stricter elsewhere).[1]

**Data shape:** Elderly/disabled special rules: optional net income path bypassing gross limit; no asset limit except federal fallback; benefits enhanced by medical deductions; scales by household size; statewide with minor regional ABAWD waivers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/ofi/programs-services/food-supplement[4]

---

### Community Aging in Place Grant Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Household income at or below 100% of Area Median Income (AMI) for State CAIP; 80% AMI for owner-occupied primary residences in some contexts. Specific dollar amounts vary by location and household size (e.g., median income of recipients ~$18,000-$19,000; one source mentions < $40,000 but not confirmed as official limit). No full table provided in sources—check current AMI via MaineHousing.[1][2][5]
- Assets: Not specified in program guidance; one non-official source mentions liquid assets below $50,000 (or $75,000 for couples) but this is unconfirmed for CAIP.[8]
- Homeowners or living in a home owned by a family member
- Primary residence with confirmed health and safety hazards
- Age 55+ or person with a disability resides there
- Live within service area of partner agency
- Owner-occupied for principal residence units[1][2][4][5]

**Benefits:** No-cost home safety checks, minor maintenance repairs, and accessibility modifications (e.g., smoke/CO detectors, dryer vents, furnace filters). Average grant limit $2,500-$3,000 per unit (State: ~$2,500-$3,000; Federal variant: $3,000).[1][2][4][5]
- Varies by: region

**How to apply:**
- Contact local partner agency (e.g., KVCAP for Kennebec/Somerset: (207) 859-1524, homeservices@kvcap.org)
- Application process via partner organizations administering the program for MaineHousing
- No central statewide phone/website/form specified; varies by partner[4][5]

**Timeline:** Not specified

**Watch out for:**
- Not directly available statewide—must contact specific partner agency for service area
- Distinguish State CAIP (age 55+, 100% AMI) from Federal variant (62+, 80% AMI, stricter owner rules)
- Funds only for homes with confirmed health/safety hazards
- Administered via local partners, not central MaineHousing intake
- Income based on AMI, which varies by county/household size—no fixed dollar table in sources[1][2][4][5]

**Data shape:** Administered regionally by partner non-profits with varying service areas; AMI-based income (varies by location/household); two variants (State/Federal) with age/income differences; no central application—partner dependent

**Source:** https://mainehousing.org/docs/default-source/ehs-partners-library/elderly-home-modification-programs/program-guidance-brochures/program-guidance/community-aging-in-place-programs-guidance-01012023.pdf?sfvrsn=742d8115_2

---

### State Health Insurance Assistance Program (SHIP) - Maine SHIP

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits. Services are free and available to all Medicare beneficiaries, older adults, and people with Medicare due to disability[4][3][6].
- Assets: No asset limits or tests apply[4][6].
- Must be a Medicare beneficiary or expect to have Medicare soon; available to older people and those with Medicare due to disability; Maine resident implied by program scope[4][3]

**Benefits:** Free, confidential, one-on-one counseling including: information on Medicare (Parts A, B, Advantage, Part D), Medigap, MaineCare, preventive benefits, prescription drug coverage/options, Medicare Savings Programs enrollment help, medical bills/claims follow-up, supplemental policy comparisons, referrals to agencies (e.g., CMS, SSA, DHHS), programs to reduce out-of-pocket costs; provided by trained counselors who do not sell or recommend policies; delivered via phone, in-person, or Zoom[4][6][3][8]. No specific dollar amounts, hours per week, or tiers.

**How to apply:**
- Phone: Toll-free 1-800-262-2232 (statewide, hours 9AM-5PM Mon-Thu, 9AM-4PM Fri)[5][7][3]
- Website: https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance[4][5]
- In-person or Zoom: Through local Area Agencies on Aging, e.g., Southern Maine Agency on Aging at 207-396-6524[8]
- Regional providers: Five Area Agencies on Aging and Legal Services for Maine Elders[4]

**Timeline:** No formal application or processing; services available immediately upon contact for counseling appointments[4][8].

**Watch out for:**
- Counselors do not sell insurance or recommend specific policies—purely informational and unbiased[4][8]
- Not a financial aid program itself; helps enroll in Medicare Savings Programs (MSP) or MaineCare which have income/asset limits (e.g., MSP: $1,183/month single, $10,000 assets; varies and separate application)[3][9]
- People may confuse with Medicaid/MaineCare or MSP—SHIP is counseling only, not direct benefits[4][6]
- For Medicare Savings Programs it assists with, eligibility finalized by DHHS with asset limits and no estate recovery[9]

**Data shape:** no income/asset test for counseling; free service for all Medicare-eligible; delivered via network of 5 Area Agencies on Aging; distinguishes from financial programs like MSP by providing enrollment assistance only

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/ship-medicare-assistance[4]

---

### Home Delivered Meals

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific income or asset limits mentioned in state program sources; prioritization for low-income older adults, but not a strict cutoff. Some private programs like Simply Delivered for ME target age 60+ or under 60 on SSDI without income details.[2][5][6]
- Assets: No asset limits or details on what counts/exempts specified in available sources.[1][6]
- Homebound and unable to leave home without assistance
- Unable to prepare a nutritionally balanced meal themselves and no one available to do so
- Physical or cognitive limitations preventing meal preparation
- Maine resident
- In-person assessment within 10 business days of referral for some providers[1][2][5][6]

**Benefits:** Nutritionally balanced meals delivered to the home (up to 5 days a week via state program; up to 7 meals/week in some regional programs like Simply Delivered for ME). Includes wellness info, access to nutritionists, chronic disease counseling (e.g., diabetes), and safety check-ins by volunteers/staff. Meals meet low-sodium, low-fat, nutrient-rich guidelines.[1][5][6]
- Varies by: region

**How to apply:**
- Contact local Aging & Disability Resource Center (ADRC) or Area Agency on Aging (AAA) for intake and referral (statewide via 5 AAAs)
- Eastern Agency on Aging for Meals on Wheels (criteria-based assessment)
- Southern Maine Agency on Aging for Simply Delivered for ME (York/Cumberland counties)
- Health plan referral for Mom's Meals if covered by Medicaid/Medicare Advantage (not state program)

**Timeline:** In-person assessment within 10 business days of referral; overall approval varies by program (weeks to months for providers, but client intake faster via AAAs).[1]
**Waitlist:** Not specified; may vary regionally due to provider capacity.

**Watch out for:**
- Not free for all; some regional programs like Simply Delivered for ME charge $9-11/meal (accepts SNAP), while state AAA programs may be low/no cost based on need but require assessment.
- Must be home for delivery; no one else can accept in some cases.
- Short- or long-term only if truly unable to prepare meals—no casual use.
- Private options like Mom's Meals require health plan coverage or out-of-pocket purchase, not state-funded.
- Prioritization for low-income/rural/vulnerable; waitlists possible in high-demand areas.
- Confused with free Meals on Wheels—state program is via AAAs with specific homebound criteria.

**Data shape:** Delivered via 5 regional Area Agencies on Aging with provider variations; no strict income/asset tests but functional eligibility via assessment; some paid tiers alongside subsidized options; county restrictions in private variants.

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/food-and-nutrition

---

### Maine Legal Services for the Elderly

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Specific dollar amounts or tables not detailed in sources; prioritizes 'socially and economically needy' Maine residents age 60+, often at or below 200% of federal poverty guidelines based on similar programs, but determined case-by-case for legal services[2][5][6]
- Assets: No asset limits specified; focus is on economic need rather than strict financial cutoffs[2][6]
- Maine resident
- Basic human needs at stake (e.g., MaineCare/Medicare issues, elder abuse, housing, public benefits)
- Non-criminal legal problems

**Benefits:** Free confidential legal information, advice, and representation on issues including Medicare/MaineCare disputes, health coverage, elder abuse/protection orders, housing (eviction/foreclosure), consumer debt, public assistance benefits, guardianship, discharges, powers of attorney, health care advance directives, and Medicare Part D prescription drug assistance; attorneys in offices across the state for select representation cases[2][4][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Helpline 1-800-750-5353 (in-state) or 207-623-1797[2][4][5][8]
- Website: https://mainelse.org for information and Elder Rights Handbook[2][8]
- In-person: Attorneys located in offices across the state[4]

**Timeline:** Not specified

**Watch out for:**
- Not a general entitlement; services for when 'basic human needs are at stake' with priority triage—may get advice/referral only, not full representation[2][4]
- Avoid pre-printed powers of attorney forms from stores/internet as they may not be legal in Maine; consult LSE attorney instead[2]
- If ineligible, referrals to private attorneys at reduced fees[4]
- Focuses on non-criminal matters; not for all legal needs

**Data shape:** No strict income/asset tables or fixed benefits; eligibility based on age 60+, residency, economic/social need, and priority legal issues affecting basic needs; services tiered by case urgency with statewide helpline access but representation varies by office availability

**Source:** https://mainelse.org[8]

---

### Legal Services for Maine Elders (LSE)


**Eligibility:**
- Age: 60+
- Income: Not specified in available sources. LSE serves 'socially and/or economically needy' Maine residents age 60 and over, but exact income thresholds are not provided in search results.
- Assets: Not specified in available sources.
- Must be age 60 or older[2][7]
- Must have 'basic human needs at stake'[7]
- Socially and/or economically needy[6]

**Benefits:** Free legal advice and representation on: Medicare/MaineCare, health care coverage disputes, elder abuse and protection orders, housing issues (eviction, foreclosure), consumer debt, public assistance benefits, guardianship, discharges, powers of attorney, health care advance directives. Specialized Medicare Part D unit for prescription drug assistance.[2][3]

**How to apply:**
- Phone: 1-800-750-5353 (in-state) or 207-623-1797[7]
- Phone: 1-877-774-7772 (Medicare Part D Unit)[3]
- Website: www.mainelse.org[2][7]
- In-person: Attorneys located in offices across the state[3]

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources. Search results note that 'because of limited resources, none of these agencies is able to meet the demand for services'[4], suggesting potential delays.

**Watch out for:**
- Income and asset limits are not publicly specified in available sources—families must call to determine eligibility[2][3]
- Limited resources mean the agency cannot meet all demand for services[4]
- LSE provides legal advice and representation 'in some situations'[3]—not all cases qualify for full representation
- If LSE cannot help, they offer referrals to private attorneys, potentially at reduced fees[3]
- Hours of operation are limited: 9am-12pm and 1pm-4pm[3]
- Medicare Part D assistance has a separate phone line (1-877-774-7772) with the same limited hours[3]
- This is a legal services program, not a financial assistance program—it provides advice and representation, not direct payment for services

**Data shape:** LSE's eligibility criteria emphasize 'socially and/or economically needy' status rather than specific income/asset thresholds, requiring direct contact for determination. The program is statewide with regional offices but specific locations and regional service variations are not documented in available sources. Benefits are service-based (legal advice and representation) rather than financial. The program has documented resource constraints affecting availability.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.maine.gov/dhhs/oads/get-support/older-adults-disabilities/older-adult-services/legal-assistance

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Program of All-Inclusive Care for the El | benefit | local | medium |
| Home and Community-Based Services Waiver | benefit | state | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Community Aging in Place Grant Program | benefit | state | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Home Delivered Meals | benefit | state | deep |
| Maine Legal Services for the Elderly | navigator | state | simple |
| Legal Services for Maine Elders (LSE) | resource | state | simple |

**Types:** {"benefit":5,"resource":2,"navigator":1}
**Scopes:** {"local":1,"state":5,"federal":2}
**Complexity:** {"medium":1,"deep":4,"simple":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/ME/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 3 programs
- **program_section_and_individual_plan**: 1 programs
- **household_size**: 1 programs
- **region**: 2 programs
- **priority_tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Program of All-Inclusive Care for the Elderly (PACE) - Maine PACE**: No operational programs in Maine; eligibility mirrors national PACE but no service areas or providers; not available statewide or regionally
- **Home and Community-Based Services Waiver Programs (MaineCare Sections 21 and 29)**: This program has two distinct sections (21 and 29) with different eligibility criteria and service focuses. Section 21 targets individuals with ID/ASD who would otherwise need institutional care; Section 29 serves adults with developmental disabilities more broadly. Both are capped programs with waitlists. Income and asset limits are standardized statewide but may vary by household composition. The program is transitioning to a new 'Lifespan Waiver' structure as of 2026, which may consolidate or restructure current Section 21 and 29 services. Case Managers play a critical role in application and service planning. Financial eligibility is determined by the Office for Family Independence, while medical eligibility is determined separately.
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled special rules: optional net income path bypassing gross limit; no asset limit except federal fallback; benefits enhanced by medical deductions; scales by household size; statewide with minor regional ABAWD waivers.
- **Community Aging in Place Grant Program**: Administered regionally by partner non-profits with varying service areas; AMI-based income (varies by location/household); two variants (State/Federal) with age/income differences; no central application—partner dependent
- **State Health Insurance Assistance Program (SHIP) - Maine SHIP**: no income/asset test for counseling; free service for all Medicare-eligible; delivered via network of 5 Area Agencies on Aging; distinguishes from financial programs like MSP by providing enrollment assistance only
- **Home Delivered Meals**: Delivered via 5 regional Area Agencies on Aging with provider variations; no strict income/asset tests but functional eligibility via assessment; some paid tiers alongside subsidized options; county restrictions in private variants.
- **Maine Legal Services for the Elderly**: No strict income/asset tables or fixed benefits; eligibility based on age 60+, residency, economic/social need, and priority legal issues affecting basic needs; services tiered by case urgency with statewide helpline access but representation varies by office availability
- **Legal Services for Maine Elders (LSE)**: LSE's eligibility criteria emphasize 'socially and/or economically needy' status rather than specific income/asset thresholds, requiring direct contact for determination. The program is statewide with regional offices but specific locations and regional service variations are not documented in available sources. Benefits are service-based (legal advice and representation) rather than financial. The program has documented resource constraints affecting availability.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Maine?
