# Hawaii Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 58s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 13 |
| New (not in our data) | 12 |
| Data discrepancies | 1 |
| Fields our model can't capture | 1 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 1 | Our model has no asset limit fields |
| `regional_variations` | 1 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 1 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 8 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Med-QUEST Home and Community-Based Services (HCBS) Waivers

- **income_limit**: Ours says `$1500` → Source says `$2,000` ([source](https://health.hawaii.gov/ddd/participants-families/waiver/ and https://medquest.hawaii.gov/[2][7]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) as alternatives to institutional care, including person-centered services/supports identified via planning process. Specifics for I/DD waiver: case management, services from qualified providers or Consumer-Directed (CD) Option. Not generic healthcare; targets needs like long-term supports for frail seniors or I/DD (e.g., home modifications if unable to live safely at home without). No fixed dollar amounts or hours per week specified; individualized based on service plan[1][2][3].` ([source](https://health.hawaii.gov/ddd/participants-families/waiver/ and https://medquest.hawaii.gov/[2][7]))
- **source_url**: Ours says `MISSING` → Source says `https://health.hawaii.gov/ddd/participants-families/waiver/ and https://medquest.hawaii.gov/[2][7]`

## New Programs (Not in Our Data)

- **Hawai‘i PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](https://files.hawaii.gov/dhs/main/har/har_current/17-1746.PDF (Hawaii Administrative Rules for PACE)[1][8]))
  - Shape notes: Restricted to specific PACE provider service areas (not statewide); ties directly to Hawaii Medicaid eligibility with acuity levels A/C; no fixed income/asset tables beyond Medicaid rules; limited provider info available
- **Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://medquest.hawaii.gov/content/medquest/en/members-applicants/get-started/programs.html))
  - Shape notes: Tiered by income (QMB lowest, QI highest); Hawaii higher income/resource limits than federal; QI capped funding/first-come; benefits fixed by tier not household size beyond couple.
- **Supplemental Nutrition Assistance Program (SNAP)** — financial ([source](https://humanservices.hawaii.gov/bessd/snap/))
  - Shape notes: Hawaii's SNAP program is notable for: (1) having NO asset limit, unlike federal rules; (2) expanded eligibility through BBCE for most households; (3) special flexibility for households with members 60+ or with disabilities who can qualify through Net Income and Asset tests if they exceed gross income limits; (4) recent federal changes (2025) that may restrict work requirement exemptions for seniors aged 60-64; (5) significant participation gap among eligible seniors due to awareness and application barriers; (6) medical expense deductions that substantially affect benefit calculations for elderly and disabled households.
- **Low Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://humanservices.hawaii.gov (DHS Benefit Employment & Support Services Division); https://www.hawaiianelectric.com/billing-and-payment/payment-assistance/low-income-programs/h-heap))
  - Shape notes: Regionally administered with different providers and application methods per island/county; short annual windows (e.g., June); automatic qualifiers via SNAP/SSI/TANF in H-HEAP variant; benefits tiered by heating/cooling/crisis and household factors.
- **Weatherization Assistance Program (WAP)** — service ([source](https://labor.hawaii.gov/ocs/service-programs-index/weatherization-assistance-program/))
  - Shape notes: County-specific subgrantees handle applications; priority-based allocation with limited funding; income at 200% FPG or TANF/SSI auto-eligible; benefits from fixed Hawaii priority list.
- **Family Caregiver Support Program** — service ([source](No single primary .gov URL identified; related info at health.hawaii.gov (DDD, not direct) or implied via executiveofficeonaging.hawaii.gov (not in results)[5]))
  - Shape notes: Tied to National Family Caregiver Support Program via Area Agencies on Aging; Native Hawaiian variant with ethnicity proof; prioritizes by need tier, no fixed income/asset numbers; services not cash payments
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://labor.hawaii.gov/wdd/job-seekers/scsep/))
  - Shape notes: Income test at 125% FPL by household size (annual HHS guidelines); statewide with county-specific providers and residency rules; priority tiers affect enrollment; no fixed hours/wage beyond avg 19-20/wk at min wage
- **Legal Assistance for Seniors in Hawaii** — service ([source](https://www.legalaidhawaii.org))
  - Shape notes: Critical gaps in available data: Specific income dollar amounts by household size not provided; processing times unknown; document requirements not specified; service scope and hours not detailed; waitlist status unclear. Search results confirm program existence and basic eligibility but lack operational details needed for comprehensive family guidance.
- **Long-Term Care Ombudsman Program (LTCOP)** — advocacy ([source](https://www.hi-ltc-ombudsman.org))
  - Shape notes: no income or asset test; advocacy-only for residents of licensed LTC facilities statewide; on-demand complaint resolution rather than enrollment-based benefits
- **Kupuna Caregivers Program** — service ([source](https://elderlyaffairs.com/services/eligibility-requirements/ (Honolulu example); statewide via http://www.hawaiiadrc.org))
  - Shape notes: State/county-funded with priority tiers; caregiver employment required; services via contracted providers; county AAAs administer with potential regional variations in delivery and wait times.
- **Kumu Kahi – Ke Ola Pono No Nā Kūpuna Program** — service ([source](https://www.alulike.org/services/kumu-kahi/ke-ola-pono-no-na-kupuna/))
  - Shape notes: Ancestry-restricted to Native Hawaiians; island-specific sites with limited services; no income/asset tests; separate from caregiver support program under same department[1][4]
- **Kumu Kahi – Native American Caregivers Support Program** — service ([source](https://www.alulike.org/services/kumu-kahi/caregiver-support/))
  - Shape notes: No income or asset tests; eligibility hinges on Native Hawaiian ethnicity proof for recipient, elder's need level ('unable to be left alone'), and limited funding tiers; Oahu-centric administration with potential statewide reach via Native Hawaiian networks.

## Program Details

### Med-QUEST Home and Community-Based Services (HCBS) Waivers


**Eligibility:**
- Income: Must meet Medicaid financial eligibility through Med-QUEST Division (Department of Human Services). For long-term care programs like HCBS waivers targeting seniors, income must be contributed nearly entirely toward care costs (specific 2026 dollar amounts not detailed in sources; e.g., simplified single nursing home applicant contributes nearly all monthly income). Asset limit of $2,000 for singles applying for nursing home level care (applies to HCBS requiring similar level). Limits vary annually by marital status and household; low income/resources required for aged 65+, blind, or disabled. No full household size table provided; children under 65 have no asset test[3][5][6].
- Assets: $2,000 for single applicants in long-term care HCBS/nursing home programs (excludes primary home in some cases, but specifics on exempt assets like home equity not detailed). What counts: countable resources like bank accounts, investments. Exempt: typically primary residence (if intent to return), one vehicle, personal belongings (confirm via Med-QUEST). No asset limits for children or non-elderly adults under MAGI rules[3][5][6].
- Must be Medicaid eligible via Med-QUEST Division[2][4].
- Eligible for specific division services, e.g., Developmental Disabilities Division (DDD) for I/DD waiver: intellectual/developmental disabilities[2][4].
- Meet Nursing Home Level of Care (NHLOC) or equivalent institutional level of care[1][3].
- For DDD waiver: eligible for DDD case management services[2][4].
- Target group criteria (varies by waiver, e.g., chronic mental illness age 22-64 or 65+ in some cases, but primarily I/DD focused in Hawaii sources)[1].
- Functional need in Activities of Daily Living (ADLs) for some services[3].

**Benefits:** Home and Community-Based Services (HCBS) as alternatives to institutional care, including person-centered services/supports identified via planning process. Specifics for I/DD waiver: case management, services from qualified providers or Consumer-Directed (CD) Option. Not generic healthcare; targets needs like long-term supports for frail seniors or I/DD (e.g., home modifications if unable to live safely at home without). No fixed dollar amounts or hours per week specified; individualized based on service plan[1][2][3].
- Varies by: priority_tier

**How to apply:**
- Online: My Medical Benefits (medquest.hawaii.gov for Med-QUEST eligibility)[5][7].
- Phone: 1-877-628-5076 (Med-QUEST application); (808) 586-4400 for DDD/HDOH accommodations[2][5].
- Application form: Application for 1915(c) HCBS Waiver (health.hawaii.gov/ddd/files/2026/01/HCBS-Waiver-Application-July2026.pdf); Med-QUEST general application[1][5].
- In-person/mail: Contact Med-QUEST Division or DDD offices (specific addresses via phone/online)[2].

**Timeline:** Not specified in sources.
**Waitlist:** Likely exists due to waiver caps (federal 1915(c) limits slots); apply early as services for those meeting institutional level of care[1][2].

**Watch out for:**
- Multiple waivers exist under Med-QUEST HCBS (e.g., I/DD-focused via DDD); not a single elderly-only program—confirm target group (e.g., I/DD vs. aged/disabled)[2][4].
- Must qualify for BOTH Medicaid AND specific waiver (DDD eligibility + level of care); people miss DDD case management step[2][4].
- Waiver slots capped federally—waitlists common despite eligibility[1].
- Financial eligibility stricter for long-term care HCBS ($2,000 assets); spend-down required, varies by marital status[3].
- Not all frail elderly qualify without disability/DD diagnosis or NHLOC[3].

**Data shape:** Multiple targeted waivers under Med-QUEST (e.g., I/DD via DDD partnership); requires dual eligibility (Medicaid + division-specific + institutional LOC); no fixed elderly age cutoff but $2k assets for LTC seniors; individualized person-centered services, not fixed hours/dollars; statewide but DDD-focused in sources.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://health.hawaii.gov/ddd/participants-families/waiver/ and https://medquest.hawaii.gov/[2][7]

---

### Hawai‘i PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Must be eligible for Hawaii Medicaid (federally-funded medical assistance). For long-term care Medicaid in 2025, income under 300% of Federal Benefit Rate ($2,901/month); exact limits vary and Medicaid planning can help qualify. No program-specific income table provided beyond Medicaid rules[1][2].
- Assets: Medicaid asset limit of $2,000 or less (excluding primary home) for long-term care eligibility. Medicaid planning pathways exist if not met[2].
- Reside in the specified geographical service area of the PACE provider[1]
- Certified by department's medical consultant as requiring acuity level A or acuity level C (nursing home level of care)[1]
- Not enrolled in Hawaii QUEST program[1]
- Able to live safely in the community with PACE services[1][2][3]
- Voluntarily elects to participate and signs statement[1]

**Benefits:** Comprehensive all-inclusive care for the elderly, including nursing home-level services delivered in community settings via PACE provider (specific services like primary care, hospitalization, prescription drugs, social services, restorative therapies, transportation, and supportive services; PACE becomes sole source for Medicare/Medicaid enrollees). No specific dollar amounts or hours stated[1][5].
- Varies by: region

**How to apply:**
- Contact local PACE provider or Hawaii Department of Human Services (specific phone/website not in results; general Medicaid office recommended)[4]
- No specific URLs, phone numbers, or addresses listed in results

**Timeline:** Not specified in available data

**Watch out for:**
- Must reside in specific PACE provider service area; not available statewide[1]
- Cannot be enrolled in Hawaii QUEST, Medicare Advantage, hospice, or certain other programs[1][3]
- Requires Medicaid eligibility determination by state; private pay possible if Medicare-only but with premiums (rare)[2][4]
- Certification of specific acuity levels A or C needed, not just general nursing home level[1]
- Voluntary election in lieu of standard Medicaid services[1]

**Data shape:** Restricted to specific PACE provider service areas (not statewide); ties directly to Hawaii Medicaid eligibility with acuity levels A/C; no fixed income/asset tables beyond Medicaid rules; limited provider info available

**Source:** https://files.hawaii.gov/dhs/main/har/har_current/17-1746.PDF (Hawaii Administrative Rules for PACE)[1][8]

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Hawaii uses higher limits than federal standards. Federal base for 2026 (with $20 disregard): QMB individual $1,350/month, couple $1,824/month; SLMB individual $1,616/month, couple $2,184/month; QI individual ~$1,823/month (135% FPL), couple ~$2,463/month. Hawaii limits slightly higher; older sources cite QMB individual $1,550/month, couple $2,095/month. Limits apply monthly; vary by program tier (QMB <100% FPL, SLMB 100-120% FPL, QI 120-135% FPL). No full household size table beyond couple; contact state for exact current figures as they adjust annually.[5][6][7]
- Assets: Individual: $9,950; Couple: $14,910 (2026 federal/Hawaii limits). Counts: Bank accounts, stocks (some exempt). Exempt: Primary home, one vehicle, household items, engagement/wedding rings, burial plots/expenses up to $1,500, life insurance < $1,500 cash value, certain Native American payments/stocks. Hawaii may disregard more resources per federal allowance.[3][4][5][6]
- Must have Medicare Part A (free for most over 65); US citizen/resident; Hawaii resident; not eligible for full Medicaid for QI; QI first-come-first-served and annual reapplication with priority to prior enrollees.

**Benefits:** QMB: Part A premium (if applicable), Part B premium (~$202.90/month 2026), Part A deductible ($1,484+ annually), Part B deductible ($203+), coinsurance/copayments. SLMB: Part B premium only. QI: Part B premium only. All auto-qualify for Extra Help (low/no cost Part D drugs). No direct services; pays costs to Medicare.[1][4][6][7]
- Varies by: priority_tier

**How to apply:**
- Online: medquest.hawaii.gov (MedQUEST portal)
- Phone: Hawaii MedQUEST at 1-800-316-8005
- Mail/In-person: Local MedQUEST district offices (e.g., Oahu: 601 Kamokila Blvd, Kapolei)
- Through SHIP counselor: hawaiiship.org

**Timeline:** Typically 45 days; no specific Hawaii data.
**Waitlist:** QI: First-come, first-served with funding caps; possible waitlist if funds exhausted.

**Watch out for:**
- Outdated limits in sources (use 2026 figures, confirm with state as Hawaii higher); QI annual reapply + funding limits; income disregards ($20 general, wage/shelter deductions) often missed; assets include spouse even if not applying; auto-Extra Help but must confirm enrollment; differs from mainland by higher limits/no resource test in some states.[1][3][5][6]

**Data shape:** Tiered by income (QMB lowest, QI highest); Hawaii higher income/resource limits than federal; QI capped funding/first-come; benefits fixed by tier not household size beyond couple.

**Source:** https://medquest.hawaii.gov/content/medquest/en/members-applicants/get-started/programs.html

---

### Supplemental Nutrition Assistance Program (SNAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: No minimum age requirement for household members, but special rules apply to households with members 60 or older[1][3]+
- Income: {"standard_gross_income_limits_200_percent_fpl":"1 person: $2,998/month | 2 people: $4,054/month | 3 people: $5,108/month | 4 people: $6,164/month | 5 people: $7,218/month | 6 people: $8,274/month | 7 people: $9,328/month | Each additional person: +$1,056/month[1]","note_for_elderly_or_disabled":"Households with a member 60+ or with a disability that exceed the gross income limit can qualify by meeting Net Income and Asset tests instead[1]","federal_poverty_level_reference":"Gross income limits are 200% of federal poverty level[1]","broad_based_categorical_eligibility":"Most households qualify for BBCE, which expands eligibility to households with gross incomes up to 200% FPL and waives certain tests[5]","categorical_eligibility":"Households where all members receive or are authorized to receive TANF or SSI have no gross income limit or net income limit[5][8]"}
- Assets: {"hawaii_specific":"There is no asset limit in Hawaii[1]","what_counts":"Countable resources include funds in bank accounts[1]","what_is_exempt":"A home and vehicles are not counted as resources[1]","alternative_federal_rules":"If a household with a member 60+ or with a disability did not meet the gross income test, they can alternatively qualify under federal program rules which have an asset limit of $4,500 but no gross income limit[1]"}
- Must be a resident of Hawaii[2][5]
- Must be a U.S. citizen, legal permanent resident (of 5+ years), or other qualified alien[5]
- All applicants must have a Social Security number or proof of application for one[5]
- Most able-bodied adults must register for work and accept suitable employment, with exemptions for seniors, pregnant individuals, and those with disabilities[2][5]
- As of April 2025, the ABAWD (Able-Bodied Adults Without Dependents) rule may require work documentation of 20 hours per week for adults under 65 who do not qualify as officially disabled[4]

**Benefits:** SNAP benefit amounts are based on a household's net income. In general, $100 more in net income equals $30 less in benefits. There are minimum and maximum SNAP benefit amounts, though specific amounts are not detailed in available sources[1]
- Varies by: household_size and net_income

**How to apply:**
- Online: Through Hawaii's Department of Human Services[7]
- In-person: At Department of Human Services offices[5][7]
- By mail: Mail applications to Hawaii's Department of Human Services[5][7]
- Phone: Contact Lanakila Pacific SNAP Outreach staff for assistance with application (specific phone number not provided in sources, but organization offers phone support)[7]

**Timeline:** Not specified in available sources
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- Work requirements changed in 2025: The One Big Beautiful Bill Act of 2025 modified SNAP work requirements. The ABAWD exemption may no longer be available until age 65 (previously 60), potentially pushing an estimated 16,570 older adults in Hawaii off the program unless they can document 20 hours of work per week[4][6]
- Participation gap among seniors: Only about half of eligible seniors participate in SNAP, often because they are unaware they qualify or have difficulty completing applications[4]
- Gray zone for older adults: Many older adults aged 60-64 may not qualify as officially disabled but have chronic conditions (arthritis, diabetes, back pain) that make steady work difficult, creating a gap in coverage[4]
- Job instability in rural areas: The kinds of jobs available in rural Hawaii are often unstable and don't guarantee 20 hours per week, meaning one missed day could result in losing SNAP benefits[4]
- Hawaii expanded eligibility: Hawaii has expanded eligibility beyond standard federal SNAP requirements, so other websites may display stricter financial eligibility requirements than what actually applies in Hawaii[1]
- Medical expense deductions available: Households with members 60+ or with disabilities can deduct medical expenses over $35/month, which can significantly affect net income calculations and benefit amounts[6]
- Broad-Based Categorical Eligibility (BBCE): Most households qualify for BBCE, which waives certain tests and raises income limits to 200% FPL—families should ask about this when applying[5]
- ESAP tool underutilized: The USDA offers the Elderly Simplified Application Project (ESAP) federal waiver to make enrollment easier for households with adults 60+, but it is not widely known or utilized[4]

**Data shape:** Hawaii's SNAP program is notable for: (1) having NO asset limit, unlike federal rules; (2) expanded eligibility through BBCE for most households; (3) special flexibility for households with members 60+ or with disabilities who can qualify through Net Income and Asset tests if they exceed gross income limits; (4) recent federal changes (2025) that may restrict work requirement exemptions for seniors aged 60-64; (5) significant participation gap among eligible seniors due to awareness and application barriers; (6) medical expense deductions that substantially affect benefit calculations for elderly and disabled households.

**Source:** https://humanservices.hawaii.gov/bessd/snap/

---

### Low Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly income must be at or below 150% of Federal Poverty Level (standard LIHEAP threshold). Specific limits: 1 person $3,495/month; 2 people $4,570/month; 3 people $5,645/month; 4 people $6,721/month; 5 people $7,796/month; 6 people $8,872/month. Alternative program (H-HEAP) uses 60% National Median Income: ~$37,000/year (1 person), $71,000/year (family of 4), or automatic qualification if household receives TANF, SSI, or SNAP.[1][6]
- Assets: No asset limits mentioned in available sources.
- U.S. citizen or Lawful Permanent Resident for all household members.
- All adults must sign application and provide picture ID.
- Social Security Number required for all household members over 1 year old.
- Must reside in Hawaii and be responsible for electric and/or gas utility bill.
- Proof of residence and active utility account required.
- Household includes all living at address covered by same utility bill.

**Benefits:** Heating/Cooling: Maximum $1,400, Minimum $280. Crisis: Maximum $700. One-time payment applied directly to utility bill (H-HEAP variant). Benefits calculated based on income, household size, and fuel type.[1]
- Varies by: household_size|priority_tier|region

**How to apply:**
- In-person (Oahu: Honolulu Community Action Program (HCAP); Maui: Maui Economic Opportunity (MEO); Hawaii Island: Hawaii County Economic Opportunity Council (HCEOC); Kauai: Kauai Economic Opportunity, Inc.). June 1-30 for H-HEAP.[4][6]
- Mail or drop-off (Maui County).[6]
- Phone to reserve appointment (Hawaii Island).[6]
- Forms include State of Hawaii DHS L-1 Application, L-3 Consent to Release, L-4 Declaration of Active Utility Account.[2][5]

**Timeline:** Not specified; limited funding periods (e.g., Heating/Cooling Mar 1-Sep 30, Crisis year-round; H-HEAP June applications).[1][4]
**Waitlist:** Funding limited; applications may close early if funds exhausted. No formal waitlist mentioned.[1]

**Watch out for:**
- Limited application windows (e.g., June 1-30 for H-HEAP, Mar-Sep for heating/cooling); funds run out early—apply ASAP.[1][4][6]
- Must have active utility account at time of payment posting, or ineligible.[5]
- All adults must sign and provide ID/SSN; incomplete apps denied.[2][3][5]
- Household includes all at address on utility bill, even non-expense sharers.[1]
- Program formerly LIHEAP, now H-HEAP in some contexts; check current name.[4]
- No year-round regular assistance; crisis only for emergencies.[1]

**Data shape:** Regionally administered with different providers and application methods per island/county; short annual windows (e.g., June); automatic qualifiers via SNAP/SSI/TANF in H-HEAP variant; benefits tiered by heating/cooling/crisis and household factors.

**Source:** https://humanservices.hawaii.gov (DHS Benefit Employment & Support Services Division); https://www.hawaiianelectric.com/billing-and-payment/payment-assistance/low-income-programs/h-heap

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Guidelines for Hawaii. Automatic eligibility if any household member receives TANF or SSI. Example limits from Kauai provider (may vary by year): 1-person: $28,260; 2: $38,440; 3: $48,620; 4: $58,800; 5: $69,000; 6: $79,140; 7: $89,280; 8: $99,420; add $5,220 per additional person.[6][1][3]
- Assets: No asset limits mentioned in Hawaii-specific sources.[1][3][5]
- Priority to elderly (60+), persons with disabilities, families with children (under 19 or 6 per some providers), high energy users, high energy burden households.[1][3][7]
- Homeowners, renters, mobile home owners eligible; single-family homes and multi-family up to 4 units.[4]

**Benefits:** Free weatherization measures per Hawaii Priority List: low-flow showerheads/faucet aerators, CFL/LED lighting, advanced power strips, hybrid heat pump/solar water heaters, small/very large room ACs, refrigerator replacement. Includes energy efficiency education and in-home assessment.[3][1]
- Varies by: priority_tier

**How to apply:**
- Oahu (Honolulu): Contact HCAP via https://www.hcapweb.org/weatherization-assistance-program/ or their site form.[1]
- Hawaii County (Hilo): Email wap@hceoc.net (PDF/DOC), mail or in-person to 47 Rainbow Drive, WAP Office Bldg 2, Hilo, HI 96720.[5]
- Kauai: Complete KEO Intake Form via https://keoinc.org/services/weatherization-assistance/.[6]
- Statewide admin: Hawaii Dept of Labor OCS at https://labor.hawaii.gov/ocs/service-programs-index/weatherization-assistance-program/.[3]
- No specific statewide phone listed; contact local providers.

**Timeline:** Not specified in sources.
**Waitlist:** Limited applications due to funding; HCEOC notes limited approvals.[5]

**Watch out for:**
- Funding-limited, so not all eligible get services; must apply via specific county provider, not centralized; automatic eligibility for TANF/SSI but still need to apply/contact local agency; priority tiers mean elderly may wait if high demand; verify current 200% FPG as they update annually.[1][3][5]
- Services free but only pre-approved measures from Hawaii list.[3]

**Data shape:** County-specific subgrantees handle applications; priority-based allocation with limited funding; income at 200% FPG or TANF/SSI auto-eligible; benefits from fixed Hawaii priority list.

**Source:** https://labor.hawaii.gov/ocs/service-programs-index/weatherization-assistance-program/

---

### Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Prioritizes greatest economic need (low-income), but no specific dollar amounts or household size table provided in sources[2][5]
- Assets: No asset limits mentioned[1][2]
- Family caregiver of adult age 60+ needing care (unable to be left alone for Native Hawaiian program)[1][2]
- Special populations: Caregivers age 55+ for adults 18+ with developmental disabilities (not their child); grandparents/relatives 55+ caring for children 18 and under[1]
- For Native Hawaiian program: Care recipient must be Native Hawaiian age 60+ with chronic illness/disability; proof of age/ethnicity required[1][2]
- Limited funding for Native Hawaiian grandparents/relatives caring for children 18 and under[2]

**Benefits:** Case management, respite care, training, counseling, support groups, supplemental services (e.g., transportation, attendant care, home-delivered meals, homemaker, adult day care, personal care via Kupuna Caregivers Program); no specific hours, dollar amounts, or payment to caregivers stated[1][5]
- Varies by: priority_tier

**How to apply:**
- Phone: 808-768-7700 (Kupuna Caregivers Program)[5]
- Contact local Area Agency on Aging on Aging (implied via caregiver.org, no specific numbers)[1]

**Timeline:** Not specified
**Waitlist:** Limited funding may imply waitlists, but not explicitly stated[2]

**Watch out for:**
- Multiple similar programs (e.g., Native Hawaiian-specific via ALU LIKE, Kupuna Caregivers, VA, Medicaid); confirm exact program[1][2][5]
- Proof of Native Hawaiian ethnicity required for targeted program[2]
- Prioritizes low-income, at-risk for institutionalization, minorities, rural, limited English; not all qualify equally[5]
- No direct pay to family caregivers specified; focuses on support services[1][5]
- VA and Medicaid programs have separate, stricter criteria (e.g., 70% disability rating)[3]

**Data shape:** Tied to National Family Caregiver Support Program via Area Agencies on Aging; Native Hawaiian variant with ethnicity proof; prioritizes by need tier, no fixed income/asset numbers; services not cash payments

**Source:** No single primary .gov URL identified; related info at health.hawaii.gov (DDD, not direct) or implied via executiveofficeonaging.hawaii.gov (not in results)[5]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must be at or below 125% of the federal poverty level for the calendar year. Exact dollar amounts vary by household size and are updated annually; refer to current Poverty Guidelines at https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines. For example, in Maui County, gross family income cannot exceed 125% of HHS poverty levels.[2][3][6]
- Assets: No asset limits mentioned in program requirements.[2][6]
- Unemployed at time of enrollment and eligible to work in the US
- Resident of Hawaii (or specific service area, e.g., Maui County for some providers)
- Poor employment prospects (job-ready individuals may be referred to WIOA instead)
- Enrollment priority: veterans/qualified spouses, age 65+, disabled, limited English/low literacy, rural residents, low employment prospects, homeless/at-risk[2][5][6]

**Benefits:** Paid part-time community service training at host agencies (government/non-profits) averaging 19-20 hours/week at Hawaii state minimum wage; skills assessment, job search training, counseling, supportive services to transition to unsubsidized employment.[1][2][5]
- Varies by: priority_tier

**How to apply:**
- Phone: Leila Shar, Acting Programs Manager at (808) 586-9169 or [email protected][1]
- Phone: Tekawitha M. Iese, Program Specialist at (808) 586-8819 or [email protected][4]
- Website: https://labor.hawaii.gov/wdd/job-seekers/scsep/ or https://labor.hawaii.gov/wdd/employers/scsep/[1][2][4]
- In-person: Through local American Job Centers or providers like Maui American Job Center (Maui County)[3]

**Timeline:** Not specified in sources
**Waitlist:** Not mentioned; may vary by demand and region

**Watch out for:**
- Must have poor employment prospects; job-ready seniors may be disqualified and referred to WIOA Adult Program[2]
- Training is temporary; participants must seek unsubsidized employment after completion (host agencies may hire but not required)[6]
- Income based on family/household, not individual; includes all members[3]
- Priority groups get preference, potentially creating waitlists for others[5][6]
- Paid at state minimum wage only (no additional benefits specified like health insurance)

**Data shape:** Income test at 125% FPL by household size (annual HHS guidelines); statewide with county-specific providers and residency rules; priority tiers affect enrollment; no fixed hours/wage beyond avg 19-20/wk at min wage

**Source:** https://labor.hawaii.gov/wdd/job-seekers/scsep/

---

### Legal Assistance for Seniors in Hawaii

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: 125% of federal poverty guidelines (2024). Specific dollar amounts not provided in available sources. Income thresholds adjust annually as federal poverty guidelines change.[1][5]
- Assets: Not specified in available sources
- No conflict of interest issues (Legal Aid cannot have previously assisted anyone with a legal problem involving the applicant)[1]
- Exception: Income limits may be waived for seniors facing foreclosure, losing public benefits, or needing advice on specific matters[1]

**Benefits:** Free civil legal assistance. Specific service hours, case limits, or dollar caps not provided in available sources.[4]
- Varies by: Legal problem type (some areas have income-limit exceptions)

**How to apply:**
- Phone: 808-536-4302 (Oahu)[4]
- Phone: 1-800-499-4302 (Neighbor Islands)[4]
- Senior Legal Hotline: 536-0011 (Oahu) or 1-888-536-8011 (Neighbor Islands)[1]
- In-person: Physical office spaces not currently open to public; accommodations available for current clients[4]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limits may be waived for specific situations (foreclosure, loss of public benefits) even if household income exceeds 125% threshold[1]
- Conflict of interest rules strictly applied—if Legal Aid previously assisted anyone with a legal problem involving you, they cannot help[1]
- Physical offices not accepting walk-in intake; phone intake is primary access method[4]
- If income exceeds Legal Aid guidelines, Affordable Lawyers Project may offer low-fee services depending on legal problem type[1]
- Legal Aid responds to up to 20,000 inquiries annually, suggesting potential volume constraints[1]

**Data shape:** Critical gaps in available data: Specific income dollar amounts by household size not provided; processing times unknown; document requirements not specified; service scope and hours not detailed; waitlist status unclear. Search results confirm program existence and basic eligibility but lack operational details needed for comprehensive family guidance.

**Source:** https://www.legalaidhawaii.org

---

### Long-Term Care Ombudsman Program (LTCOP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; open to any resident of a qualifying facility regardless of financial status.
- Assets: No asset limits or tests apply.
- Must be a resident of a licensed long-term care facility in Hawaii, such as nursing homes, assisted living facilities, adult residential care homes (ARCH), community care foster family homes (CCFFH), expanded ARCH, hospice centers, or adult day care.[5][6]

**Benefits:** Advocacy services including identifying, investigating, and resolving complaints made by or on behalf of residents; regular in-person facility visits; protection of health, safety, welfare, and rights; technical support for resident and family councils; information on obtaining services; timely responses to complaints; monitoring for abuse, neglect, and exploitation.[1][5][6]

**How to apply:**
- Phone: 1-888-229-2231 (toll-free) or (808) 586-7268[4][6]
- Website: https://www.hi-ltc-ombudsman.org (for information and contact)[6]
- Email: lynn.niitani@doh.hawaii.gov[3]
- In-person: Contact via phone for facility visits or office at 250 S. Hotel St., Ste. 406, Honolulu, HI 96813[7]

**Timeline:** Timely and responsive handling of complaints and concerns; no formal processing time specified as services are provided on-demand via advocacy visits and investigations.

**Watch out for:**
- This is not a direct service or financial aid program but pure advocacy for residents already in facilities—families cannot 'apply' their loved one into a facility through LTCOP.[6]
- Services are for current facility residents only, not for qualification into care or home-based care.[5]
- Strict confidentiality: Information shared is protected unless resident consents or required by law.[1][6]
- Not for volunteers (who must apply separately with training and checks).[3][4]

**Data shape:** no income or asset test; advocacy-only for residents of licensed LTC facilities statewide; on-demand complaint resolution rather than enrollment-based benefits

**Source:** https://www.hi-ltc-ombudsman.org

---

### Kupuna Caregivers Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific dollar amounts or household size table provided in sources; cost-sharing may apply based on income and ability to pay. Priority for greatest economic need, low-income, minorities, limited English proficiency, rural residents, and those at risk of institutional placement.[1][5]
- Assets: No asset limits or details on what counts/exempts mentioned.
- Care recipient must be Hawaii resident, US citizen or qualified alien, 60+, not residing in long-term care facility, and have impairments in at least two ADLs or two IADLs, or one ADL and one IADL, or substantive cognitive impairment requiring substantial supervision.[3]
- Caregiver must be employed at least 30 hours/week (may be reduced during state of emergency).[3][6]
- Care recipient must have functional needs (frailty or limitations in ADLs/IADLs) and not qualify for Medicaid or comparable programs.[1]
- Provides direct care to care recipient.[3]

**Benefits:** Up to $70 per day (or up to $210 per week) in services paid directly to contracted providers (not caregiver), including attendant care, transportation, home-delivered meals, homemaker, adult day care, personal care, case management, chore services. Delivered via traditional service delivery or kupuna caregiver-directed services based on support plan.[3][5][6][7]
- Varies by: priority_tier

**How to apply:**
- Phone: Statewide Aging and Disability Resource Center (ADRC) at (808) 643-2372 or TTY (808) 643-0899; call will be directed to local Area Agency on Aging (AAA) by county.[3][7]
- Website: http://www.hawaiiadrc.org[3]

**Timeline:** Not specified; includes employment verification, care recipient assessment, and caregiver burden assessment.[3]
**Waitlist:** Some services may have waitlists; priority for greatest economic/social need and at-risk individuals. Funding limited (e.g., historical $600,000 until June 2018).[1][3]

**Watch out for:**
- Payments go directly to contracted providers, not the caregiver.[3][6]
- Does not cover those eligible for Medicaid or comparable programs; it's a gap-filler.[1]
- Funding is limited and subject to availability; may have waitlists.[1][3]
- Caregiver must meet 30-hour work requirement (flexible in emergencies).[6]
- Distinct from federal OAA Title III (no cost-sharing) and Native Hawaiian-specific programs.[1][2]

**Data shape:** State/county-funded with priority tiers; caregiver employment required; services via contracted providers; county AAAs administer with potential regional variations in delivery and wait times.

**Source:** https://elderlyaffairs.com/services/eligibility-requirements/ (Honolulu example); statewide via http://www.hawaiiadrc.org

---

### Kumu Kahi – Ke Ola Pono No Nā Kūpuna Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits specified; voluntary donations accepted for services[1][4]
- Assets: No asset limits specified or mentioned[1][4]
- Independent individuals (able to live independently)
- Native Hawaiian ancestry (proof required via birth certificate)
- Spouses of eligible individuals also qualify
- Available on Hawaii, Kauai, Maui, Molokai, and Oahu islands only[1]

**Benefits:** Nutritious congregate meals at sites; limited home-delivered meals for those unable to attend; limited transportation to/from sites and health-related locations during program hours; outreach, information, and assistance linking to other agencies; cultural activities (hula, Hawaiian language, history); intergenerational activities; health monitoring, promotion, education, nutritional counseling, physical activities; phone reassurance, friendly visits; education; recreation and social support; volunteer opportunities. Voluntary donations accepted; no fixed dollar amounts or hours specified[1]
- Varies by: region

**How to apply:**
- Contact ALU LIKE, Inc. Kumu Kahi Department (specific phone/website not listed in sources; primary site: https://www.alulike.org/services/kumu-kahi/ke-ola-pono-no-na-kupuna/ )[1][4]
- In-person at program sites on Hawaii, Kauai, Maui, Molokai, Oahu[1]

**Timeline:** Not specified
**Waitlist:** Not mentioned; limited services (e.g., home meals, transportation) imply potential capacity constraints[1]

**Watch out for:**
- Must prove Native Hawaiian ancestry with birth certificate even for spouses[1]
- Only for independent elders (not those unable to be left alone, which is a separate caregiver program)[1][3][4]
- Limited availability of some services like home meals and transportation[1]
- Not statewide; no service on Lanai[1]
- Funded by Older Americans Act Title VI Part B; eligibility strictly tied to Native Hawaiian ancestry[1][4]

**Data shape:** Ancestry-restricted to Native Hawaiians; island-specific sites with limited services; no income/asset tests; separate from caregiver support program under same department[1][4]

**Source:** https://www.alulike.org/services/kumu-kahi/ke-ola-pono-no-na-kupuna/

---

### Kumu Kahi – Native American Caregivers Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits mentioned in available sources.
- Assets: No asset limits mentioned in available sources.
- Family caregivers of Native Hawaiian elders age 60+ who are unable to be left alone (due to chronic condition or disability).
- Proof of age and Native Hawaiian ethnicity required for the care recipient (e.g., birth certificate); not required for caregiver.
- Limited funding available for Native Hawaiian grandparents or older relatives (age 60+) caring for children age 18 and under; birth certificate required for proof of age and ethnicity.

**Benefits:** Information and assistance about available services; assistance gaining access to supportive services; referrals to individual counseling, support groups, and caregiver training; respite support to relieve caregivers temporarily; limited supplemental services to complement caregiver-provided care. No cost to participants.
- Varies by: priority_tier

**How to apply:**
- Phone: (808) 535-6700
- Email: info@alulike.org
- Website: https://www.alulike.org/services/kumu-kahi/caregiver-support/
- In-person: 550 Paiea St., Suite 226, Honolulu, HI 96819

**Timeline:** Not specified in sources.
**Waitlist:** Limited funding may imply waitlist or prioritization, but not explicitly stated.

**Watch out for:**
- Proof of Native Hawaiian ethnicity and age required only for care recipient (not caregiver), which families may overlook.
- Elders must be 'unable to be left alone' due to chronic condition/disability.
- Limited funding available, especially for grandparents caring for children—may affect access.
- Free services, but respite and supplemental services are limited.
- Funded under Older Americans Act Title VI, Part C—distinct from general caregiver programs.

**Data shape:** No income or asset tests; eligibility hinges on Native Hawaiian ethnicity proof for recipient, elder's need level ('unable to be left alone'), and limited funding tiers; Oahu-centric administration with potential statewide reach via Native Hawaiian networks.

**Source:** https://www.alulike.org/services/kumu-kahi/caregiver-support/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Med-QUEST Home and Community-Based Servi | benefit | state | deep |
| Hawai‘i PACE (Program of All-Inclusive C | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Family Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Seniors in Hawaii | resource | state | simple |
| Long-Term Care Ombudsman Program (LTCOP) | resource | federal | simple |
| Kupuna Caregivers Program | benefit | state | deep |
| Kumu Kahi – Ke Ola Pono No Nā Kūpuna Pro | benefit | local | medium |
| Kumu Kahi – Native American Caregivers S | resource | local | simple |

**Types:** {"benefit":9,"employment":1,"resource":3}
**Scopes:** {"state":4,"local":3,"federal":6}
**Complexity:** {"deep":9,"simple":3,"medium":1}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/HI/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **region**: 2 programs
- **household_size and net_income**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **Legal problem type (some areas have income-limit exceptions)**: 1 programs
- **not_applicable**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Med-QUEST Home and Community-Based Services (HCBS) Waivers**: Multiple targeted waivers under Med-QUEST (e.g., I/DD via DDD partnership); requires dual eligibility (Medicaid + division-specific + institutional LOC); no fixed elderly age cutoff but $2k assets for LTC seniors; individualized person-centered services, not fixed hours/dollars; statewide but DDD-focused in sources.
- **Hawai‘i PACE (Program of All-Inclusive Care for the Elderly)**: Restricted to specific PACE provider service areas (not statewide); ties directly to Hawaii Medicaid eligibility with acuity levels A/C; no fixed income/asset tables beyond Medicaid rules; limited provider info available
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income (QMB lowest, QI highest); Hawaii higher income/resource limits than federal; QI capped funding/first-come; benefits fixed by tier not household size beyond couple.
- **Supplemental Nutrition Assistance Program (SNAP)**: Hawaii's SNAP program is notable for: (1) having NO asset limit, unlike federal rules; (2) expanded eligibility through BBCE for most households; (3) special flexibility for households with members 60+ or with disabilities who can qualify through Net Income and Asset tests if they exceed gross income limits; (4) recent federal changes (2025) that may restrict work requirement exemptions for seniors aged 60-64; (5) significant participation gap among eligible seniors due to awareness and application barriers; (6) medical expense deductions that substantially affect benefit calculations for elderly and disabled households.
- **Low Income Home Energy Assistance Program (LIHEAP)**: Regionally administered with different providers and application methods per island/county; short annual windows (e.g., June); automatic qualifiers via SNAP/SSI/TANF in H-HEAP variant; benefits tiered by heating/cooling/crisis and household factors.
- **Weatherization Assistance Program (WAP)**: County-specific subgrantees handle applications; priority-based allocation with limited funding; income at 200% FPG or TANF/SSI auto-eligible; benefits from fixed Hawaii priority list.
- **Family Caregiver Support Program**: Tied to National Family Caregiver Support Program via Area Agencies on Aging; Native Hawaiian variant with ethnicity proof; prioritizes by need tier, no fixed income/asset numbers; services not cash payments
- **Senior Community Service Employment Program (SCSEP)**: Income test at 125% FPL by household size (annual HHS guidelines); statewide with county-specific providers and residency rules; priority tiers affect enrollment; no fixed hours/wage beyond avg 19-20/wk at min wage
- **Legal Assistance for Seniors in Hawaii**: Critical gaps in available data: Specific income dollar amounts by household size not provided; processing times unknown; document requirements not specified; service scope and hours not detailed; waitlist status unclear. Search results confirm program existence and basic eligibility but lack operational details needed for comprehensive family guidance.
- **Long-Term Care Ombudsman Program (LTCOP)**: no income or asset test; advocacy-only for residents of licensed LTC facilities statewide; on-demand complaint resolution rather than enrollment-based benefits
- **Kupuna Caregivers Program**: State/county-funded with priority tiers; caregiver employment required; services via contracted providers; county AAAs administer with potential regional variations in delivery and wait times.
- **Kumu Kahi – Ke Ola Pono No Nā Kūpuna Program**: Ancestry-restricted to Native Hawaiians; island-specific sites with limited services; no income/asset tests; separate from caregiver support program under same department[1][4]
- **Kumu Kahi – Native American Caregivers Support Program**: No income or asset tests; eligibility hinges on Native Hawaiian ethnicity proof for recipient, elder's need level ('unable to be left alone'), and limited funding tiers; Oahu-centric administration with potential statewide reach via Native Hawaiian networks.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Hawaii?
