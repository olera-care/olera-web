# North Carolina Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 10.1m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 15 |
| New (not in our data) | 7 |
| Data discrepancies | 8 |
| Fields our model can't capture | 8 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 8 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 6 | Has waitlist info — our model has no wait time field |
| `documents_required` | 8 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 5 programs
- **financial**: 5 programs
- **in_kind**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs
- **service|in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### NC Medicaid Home and Community-Based Services (HCBS) Waivers

- **min_age**: Ours says `65` → Source says `Varies by waiver: CAP/DA (18+), CAP/C (0-20), TBI (18+), Innovations (all ages with I/DD)[1][2][5][8]` ([source](https://medicaid.ncdhhs.gov/))
- **income_limit**: Ours says `$2500` → Source says `$1,255` ([source](https://medicaid.ncdhhs.gov/))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Specific services vary by waiver; e.g., CAP/DA: personal assistance, adult day health, respite, home modifications, non-medical transport, nutritional services, PERS; CAP/C: in-home aide, respite, assistive tech, vehicle mods, nurse aide; TBI: day supports, therapies, home mods, supported living; Innovations: wide range for I/DD; no fixed $ or hours stated, cost-neutral to institutional care[1][2][4][5]` ([source](https://medicaid.ncdhhs.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ncdhhs.gov/`

### NC Program of All-Inclusive Care for the Elderly (PACE)

- **income_limit**: Ours says `$1305` → Source says `$2,901` ([source](https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care/program-all-inclusive-care-elderly-pace and https://www.ncpace.org/))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive managed care including: primary care, specialist care, hospital care, prescription drugs, therapy services, social services, transportation, and other services needed to support community living. Participants receive no deductibles, co-pays, or co-insurance for approved services[3]. PACE becomes both insurer and provider[8].` ([source](https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care/program-all-inclusive-care-elderly-pace and https://www.ncpace.org/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care/program-all-inclusive-care-elderly-pace and https://www.ncpace.org/`

### NC Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1305` → Source says `$20` ([source](https://medicaid.ncdhhs.gov/providers/programs-and-services/medicare-savings-programs))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Medicare Part A premiums (if applicable), Part B premiums ($202.90/mo in 2026), deductibles, copays, coinsurance; providers prohibited from billing beneficiary for covered costs. SLMB: Part B premium only ($202.90/mo, ~$2,435/year). QI: Part B premium only ($202.90/mo, ~$2,435/year). All auto-qualify for full Extra Help (LIS) for Part D drugs, no separate application. Annual savings $2,400-$8,000+ depending on program.[1][2][4][5]` ([source](https://medicaid.ncdhhs.gov/providers/programs-and-services/medicare-savings-programs))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ncdhhs.gov/providers/programs-and-services/medicare-savings-programs`

### NC Food and Nutrition Services (FNS)/SNAP

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps))
- **income_limit**: Ours says `$1924` → Source says `$193` ([source](https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `EBT card for purchasing food (groceries, fresh produce, non-alcoholic beverages at authorized retailers). Maximum monthly allotments as in income table (e.g., $281 for 1-person, actual amount based on income/deductions; average $188 for seniors). Simplified SNAP certified for 3 years.[1][4][5]` ([source](https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps))
- **source_url**: Ours says `MISSING` → Source says `https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps`

### NC Low-Income Energy Assistance Program (LIHEAP)

- **min_age**: Ours says `65` → Source says `60 or older (priority tier); disabled persons receiving services through NC Division of Aging and Adult Services also qualify for priority tier` ([source](https://www.ncdhhs.gov/divisions/social-services/energy-assistance/low-income-energy-assistance-lieap))
- **income_limit**: Ours says `$2400` → Source says `$34,056` ([source](https://www.ncdhhs.gov/divisions/social-services/energy-assistance/low-income-energy-assistance-lieap))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `One-time vendor payment of $300, $400, or $500 sent directly to heating vendor. Last year (2023-2024), the program provided approximately $48 million to help more than 134,000 households.[2][3]` ([source](https://www.ncdhhs.gov/divisions/social-services/energy-assistance/low-income-energy-assistance-lieap))
- **source_url**: Ours says `MISSING` → Source says `https://www.ncdhhs.gov/divisions/social-services/energy-assistance/low-income-energy-assistance-lieap`

### NC Home-Delivered Meals (County-Specific Programs)

- **min_age**: Ours says `60` → Source says `60+ years old (65+ in Brunswick County)`
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritious meals delivered to home; frequency and meal count not specified in sources`

### NC Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy to resolve complaints about resident rights, quality of care/life; investigation of grievances; mediation with facilities; education on rights, elder abuse prevention/detection/reporting; monitoring of federal/state/local laws; facility visits (e.g., nursing homes every 3 months, adult care homes every 3 months, family care homes annually); confidential services at no cost.` ([source](https://www.ncdhhs.gov/divisions/aging/long-term-care-ombudsman))
- **source_url**: Ours says `MISSING` → Source says `https://www.ncdhhs.gov/divisions/aging/long-term-care-ombudsman`

### State-County Special Assistance - In Home

- **min_age**: Ours says `65` → Source says `65 or older, or 18-64 and disabled per Social Security definition, or under 18 and legally blind[1][2][3]` ([source](https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Monthly cash payments for living expenses (food, shelter, clothing, daily necessities); 2024 maximum rates: Basic $1,326/month, Enhanced $1,700/month (requires Alzheimer's/dementia diagnosis verified by FL-2); automatic Medicaid eligibility[2][5]` ([source](https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]`

## New Programs (Not in Our Data)

- **NC Weatherization Assistance Program** — service ([source](https://www.deq.nc.gov/energy-climate/state-energy-office/weatherization-assistance-program[8]))
  - Shape notes: Decentralized by region/local providers; DOE-funded statewide but contact county-specific agency; priority tiers; no age minimum but elderly prioritized; income at 200% FPL or SSI/TANF auto-qualify.
- **NC Lifespan Respite Program / Family Caregiver Support** — financial ([source](www.highcountryaging.org/services/lifespan-respite-project))
  - Shape notes: Referral-only via agencies; priority tiers over strict income/assets; administered by specific regional agency despite statewide scope; flexible voucher for any-age special needs.
- **NC Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.ncdhhs.gov/divisions/aging/senior-community-services-employment-program))
  - Shape notes: Grantee-administered with priority tiers; income scales by household size at 125% FPL; regional providers determine slots/wait times; no fixed asset limits
- **NC Legal Assistance for Older Adults** — service ([source](https://legalaidnc.org/project/senior-law-project/[3]))
  - Shape notes: no income test; age 60+ exempt from financial eligibility; statewide helpline with priority tiers; services via advice, letters, referrals rather than full representation for all
- **North Carolina Homestead Exemption** — financial ([source](https://www.ncleg.net/enactedlegislation/statutes/html/bysection/chapter_105/gs_105-277.1.html))
  - Shape notes: Statewide uniform eligibility/benefit formula, but county-administered applications; fixed income threshold (not scaled by household); one-time vs. annual application types; confusable with bankruptcy homestead protection
- **North Carolina Long-Term Care Medicaid** — service ([source](https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care))
  - Shape notes: Income test is facility-specific pay rate (regional variation), not fixed amount; requires NFLOC assessment; multiple programs/waivers (nursing home vs HCBS) with tiered access/waitlists; spousal protections scale by joint assets.
- **Project C.A.R.E. (Caregiver Alternatives to Running on Empty)** — service|in_kind ([source](https://www.ncdhhs.gov/divisions/aging/project-care-caregiver-alternatives-running-empty))
  - Shape notes: Project C.A.R.E. is a regionally fragmented program with no statewide uniform application process. Benefits are service-based rather than cash-based, with respite care vouchers being the primary financial component (limited availability). Eligibility is straightforward (dementia diagnosis + caregiver recognition of need) with no income or asset tests, but priority is given to underserved populations. The program's structure relies on regional Area Agencies on Aging as host agencies, meaning application methods, contact information, and processing times vary by county/region. No public data on processing times or waitlists is available.

## Program Details

### NC Medicaid Home and Community-Based Services (HCBS) Waivers


**Eligibility:**
- Age: Varies by waiver: CAP/DA (18+), CAP/C (0-20), TBI (18+), Innovations (all ages with I/DD)[1][2][5][8]+
- Income: Must qualify for NC Medicaid; typically ~$1,255/month for individual (2025, subject to change); 2026 nursing home level est. $7,898-$11,218/month but waivers follow Medicaid standard ~$2,901/month individual; waiver slots use applicant income only, not family[1][2][3][4]
- Assets: $2,000 countable resources for individual; exempt: primary home (equity limit $752,000 in 2026 if no qualifying resident), car, personal belongings; most bank accounts, retirement, cash count[1][3][4]
- Nursing Facility Level of Care (NFLOC) or equivalent institutional level required across waivers[1][3][4][5][8]
- Medically fragile/complex or at risk of institutionalization; functional needs assessment (ADLs, mobility, health risks)[1][2]
- Able to remain safely at home with services[1]
- Specific: CAP/DA (disabled adults 18-64 or 65+ physical), CAP/C (medically fragile children), TBI (traumatic brain injury 18+), Innovations (I/DD or related conditions)[2][5][6][7][8]

**Benefits:** Specific services vary by waiver; e.g., CAP/DA: personal assistance, adult day health, respite, home modifications, non-medical transport, nutritional services, PERS; CAP/C: in-home aide, respite, assistive tech, vehicle mods, nurse aide; TBI: day supports, therapies, home mods, supported living; Innovations: wide range for I/DD; no fixed $ or hours stated, cost-neutral to institutional care[1][2][4][5]
- Varies by: priority_tier

**How to apply:**
- CAP/DA: Confirm Medicaid via NC ePASS or local DSS, then request assessment[1]
- CAP/C: Local Case Management Agency (directory: CAP-C Case Management Agency Directory) or Acentra Health[2]
- Innovations: Local LME/MCO (NC DHHS LME/MCO Directory)[2]
- General: Local DSS for Medicaid, then waiver-specific agency[1][2]

**Timeline:** Not specified; includes assessment after Medicaid approval[1]
**Waitlist:** Yes for some (e.g., Innovations 'Registry of Unmet Needs'); others limited slots, not entitlement[2][3][4]

**Watch out for:**
- Multiple waivers exist (not one program): CAP/DA for disabled adults, CAP/C children, TBI, Innovations I/DD—match to needs[2][5][7][8]
- Not entitlement: limited slots, waitlists common[3][4]
- Must qualify for Medicaid first, but waiver uses applicant-only income[1][2]
- NFLOC required, assessed via functional needs—not just age/disability[1][3]
- Home equity limits apply ($752K 2026)[3]
- Spend-down/Miller Trusts possible if over limits[1]

**Data shape:** Multiple distinct waivers (CAP/DA, CAP/C, TBI, Innovations) with target populations, all statewide but local admin; benefits/service arrays waiver-specific; waitlists and NFLOC universal; applicant-only income for Medicaid qual

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ncdhhs.gov/

---

### NC Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No income limit for eligibility. However, if you qualify for Medicaid long-term care, most states (including NC) cap income at 300% of the Federal Benefit Rate ($2,901/month as of 2025)[2]. If your income exceeds this, you may still enroll by paying a monthly Patient Monthly Liability determined by Medicaid based on your assets and income[3]. If you have only Medicare (no Medicaid), you pay a set monthly fee[3]. If you have neither Medicare nor Medicaid, you can private pay at approximately $4,000–$5,000/month[2].
- Assets: For Medicaid eligibility: $2,000 or less in countable assets (excluding primary home)[2]. The primary residence is exempt from asset calculations[2].
- Must be certified by NC Medicaid as needing nursing facility level of care (extensive assistance with Activities of Daily Living: bathing, grooming, toileting, walking, transferring, eating)[2][4]
- Must reside in the service area of a PACE organization[1][6]
- Must be able to live safely in the community with PACE support at time of enrollment[1][3]
- Cannot be enrolled in Medicare Advantage (Part C) plan, Medicare prepayment plan, or Medicare prescription drug plan[1]
- Cannot be enrolled in hospice services or certain other programs[1]
- Must be a U.S. citizen or legal resident for 5 years prior to application (if Medicare-eligible)[2]

**Benefits:** Comprehensive managed care including: primary care, specialist care, hospital care, prescription drugs, therapy services, social services, transportation, and other services needed to support community living. Participants receive no deductibles, co-pays, or co-insurance for approved services[3]. PACE becomes both insurer and provider[8].
- Varies by: funding_source — Medicare covers Medicare-eligible services; Medicaid covers Medicaid-eligible services; private pay covers all services at negotiated rates. Specific service mix is individualized based on care plan[3].

**How to apply:**
- Phone: Contact your local PACE Center directly[6]. NC PACE Association phone: 919-855-4340[4]
- In-person: Visit your local PACE Center[6]
- Self-referral or referral by family member, physician, or provider[6]
- Online: Visit NC PACE Association website to locate local PACE centers[6][8]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- PACE is NOT available statewide — you must live in a service area where a PACE organization operates[7]. Check availability before assuming eligibility[8].
- You cannot be enrolled in Medicare Advantage (Part C) — if you have a Medicare Advantage plan, you must disenroll before joining PACE[1].
- Nursing home level of care certification is required and is determined by the state, not by the program — this is a gatekeeping requirement[1][4].
- If you exceed Medicaid income limits, you don't lose eligibility; instead, you pay a Patient Monthly Liability (out-of-pocket cost) determined by Medicaid[3].
- Private pay costs are substantial (~$4,000–$5,000/month) if you have neither Medicare nor Medicaid[2].
- All services except emergencies must be approved in advance by your PACE organization — using out-of-network providers without approval may result in full cost to you[3].
- You can disenroll at any time, but PACE becomes your sole insurer and provider — you won't have separate health insurance coverage[3][8].
- The average PACE participant is 76 years old with multiple complex medical conditions — this is designed for frail seniors, not those with minimal care needs[1].

**Data shape:** NC PACE is a regionally fragmented program with multiple independent PACE organizations, each serving specific counties. Eligibility is standardized statewide (age 55+, nursing home level of care, service area residency), but availability, service offerings, and costs vary by provider. Income limits apply only if seeking Medicaid coverage; otherwise, no income test exists. Asset limits ($2,000) apply only for Medicaid eligibility. The program is voluntary enrollment with no waitlist information publicly available. Processing timelines and required documentation are not standardized across providers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care/program-all-inclusive-care-elderly-pace and https://www.ncpace.org/

---

### NC Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Age: 65+
- Income: Income limits for 2026 vary by program and household size, expressed as percentages of the Federal Poverty Level (FPL) with a $20 general income disregard. Use the most recent figures from authoritative sources: QMB (≤100% FPL): Individual $1,325-$1,350/mo, Couple $1,783-$1,824/mo; SLMB (100-120% FPL): Individual $1,585-$1,616/mo, Couple $2,135-$2,184/mo; QI (120-135% FPL): Individual $1,816/mo, Couple $2,455/mo. Older sources list lower amounts (e.g., QMB Individual $1,235), so verify current FPL-adjusted limits with NC DHHS.[1][2][4][6]
- Assets: Resources ≤$9,950 (individual) or $14,910 (couple) across QMB, SLMB, QI. Countable resources include bank accounts, stocks; exempt: home, one car, burial plots, life insurance (up to certain values), personal belongings. Some sources note slightly lower prior-year limits ($9,290/$14,810 or $9,090/$13,630).[1][2][3][4][6]
- Must be enrolled in Medicare Part A and/or B.
- North Carolina resident.
- U.S. citizen or qualified immigrant.
- Not eligible for full Medicaid (MSPs are for Medicare beneficiaries with limited income/assets).

**Benefits:** QMB: Medicare Part A premiums (if applicable), Part B premiums ($202.90/mo in 2026), deductibles, copays, coinsurance; providers prohibited from billing beneficiary for covered costs. SLMB: Part B premium only ($202.90/mo, ~$2,435/year). QI: Part B premium only ($202.90/mo, ~$2,435/year). All auto-qualify for full Extra Help (LIS) for Part D drugs, no separate application. Annual savings $2,400-$8,000+ depending on program.[1][2][4][5]
- Varies by: priority_tier

**How to apply:**
- Phone: Local county Department of Social Services (DSS) office; find via NC DHHS directory.
- Online: NC Medicaid ePASS portal (epass.nc.gov).
- Mail/In-person: Local county DSS office.
- No specific national form; use state Medicaid application (Form DMA-3000 or equivalent via DSS).

**Timeline:** Typically 45 days, but varies by county; no specific statewide timeline stated.
**Waitlist:** QI only: first-come, first-served with limited federal funding; may run out annually (reapply each year).[1][2][8]

**Watch out for:**
- QI funding limited—first-come, first-served, may exhaust before year-end; reapply annually.[1][2][8]
- Income includes $20 disregard; countable income must be under exact FPL-based limits—many miss eligibility due to unawareness.[2]
- Assets include most liquid resources but exempt primary home/car; people overlook countable items like second vehicles.
- Auto-triggers Extra Help for Part D, but confirm enrollment.
- Providers cannot bill QMB for covered services, but some unaware—carry MSP card.
- Outdated asset/income figures in older sources; always check current year.
- Must have Medicare; not for full Medicaid eligibles.

**Data shape:** Tiered by income brackets (QMB lowest, QI highest); QI capped enrollment; asset limits fixed federally but income FPL-adjusted annually; local county administration with statewide uniformity in rules.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ncdhhs.gov/providers/programs-and-services/medicare-savings-programs

---

### NC Food and Nutrition Services (FNS)/SNAP


**Eligibility:**
- Age: 60+
- Income: Households with a senior (60+) must have monthly net income at or below these thresholds after deductions (standard $193 for 1-4 members, 20% earnings deduction, medical expenses over $35/month for elderly/disabled): |Household Size|Maximum Monthly Net Income|Maximum Monthly Benefits Allotment| |1|$1,133|$281| |2|$1,526|$516| |3|$1,920|$740| |4|$2,313|$939| Thresholds increase with household size. For elderly/disabled-only households, only net income limit applies (no gross income test). Simplified SNAP variant for SSI recipients age 65+ has no specific income limit beyond SSI receipt.[1][3][5]
- Assets: For households with elderly (60+) or disabled members, countable resources must be $4,500 or less. Exemptions typically include primary home, one vehicle, household goods, retirement accounts, and certain life insurance; exact countable assets follow federal SNAP rules with state application.[5][6]
- U.S. citizen or qualified non-citizen (e.g., 5+ years residency, children under 18, disability benefits).
- Reside in North Carolina.
- For Simplified SNAP: Receive SSI, age 65+, purchase/prepare food separately, not in institution/ADTC, not on regular FNS elsewhere, not disqualified from FNS.[4][9]
- Household includes those who buy/prepare food together.
- Work requirements may apply (e.g., 80 hours/month work/volunteer/training for ages 55-64 without dependents under 2025 changes), but exemptions for elderly 60+.[5]

**Benefits:** EBT card for purchasing food (groceries, fresh produce, non-alcoholic beverages at authorized retailers). Maximum monthly allotments as in income table (e.g., $281 for 1-person, actual amount based on income/deductions; average $188 for seniors). Simplified SNAP certified for 3 years.[1][4][5]
- Varies by: household_size

**How to apply:**
- Online: NC ePASS at https://epass.nc.gov
- Phone: Local county DSS office (find via https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps)
- Mail/In-person: Local Department of Social Services (DSS) office by county
- Automatic for Simplified SNAP via monthly NC State Data Exchange (SDX) match if eligible.

**Timeline:** 30 days standard; expedited within 7 days if income < $150 and cash < $100, or income/cash < rent/utilities.[2][4]

**Watch out for:**
- Elderly households skip gross income test (only net matters), but must calculate deductions accurately (medical key for seniors).[1][3]
- Simplified SNAP only for SSI/65+ separate food prep; married couples count as one household.[4]
- Assets $4,500 limit applies to elderly/disabled (higher than non-elderly $3,000).[5]
- Post-2025 changes: Work rules for 55-64, non-citizen restrictions; expedited SNAP often missed for urgent need.[2][8]
- Include all who buy/prepare food in household; students 18-51 need exemptions.[7]
- Benefits loaded on EBT card; can't buy hot foods/alcohol/tobacco.

**Data shape:** Net income only for elderly/disabled households (no gross test); deductions heavily favor seniors (medical, standard); Simplified SNAP auto-enrollment for SSI/65+; benefits scale by household size with max allotments; county DSS processing.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ncdhhs.gov/divisions/child-and-family-well-being/food-and-nutrition-services-food-stamps

---

### NC Low-Income Energy Assistance Program (LIHEAP)


**Eligibility:**
- Age: 60 or older (priority tier); disabled persons receiving services through NC Division of Aging and Adult Services also qualify for priority tier+
- Income: Priority households (age 60+ or disabled): up to 150% of Federal Poverty Level. All other households: up to 130% of Federal Poverty Level. For a household of four, the 130% threshold is $34,056 gross annual income ($2,838/month) as of the current funding cycle. Income limits vary by household size and may change year to year.[1][4]
- Assets: Countable resources (savings, checking accounts, cash on hand) must be at or below $2,250. One source indicates $3,000 for Union County specifically, suggesting possible regional variation.[1][6][7]
- At least one U.S. citizen or qualified non-citizen in the household must meet eligibility criteria[6]
- Household must be responsible for paying the home heating/cooling bill[1]
- Applicant must reside in the county where the application is submitted[7]
- Applicant does not need to be behind on energy bills to qualify[3]

**Benefits:** One-time vendor payment of $300, $400, or $500 sent directly to heating vendor. Last year (2023-2024), the program provided approximately $48 million to help more than 134,000 households.[2][3]
- Varies by: household_size and primary heating source

**How to apply:**
- Online: Visit NCDHHS website (specific URL not provided in search results; contact local social services department for link)
- In-person: Local social services departments (funds distributed through these offices)[1]
- Phone: Contact local county Department of Social Services or Division of Aging and Adult Services

**Timeline:** Not specified in search results; funds distributed on ongoing basis until exhausted
**Waitlist:** No formal waitlist mentioned; program operates on first-come, first-served basis until funds are exhausted[1]

**Watch out for:**
- Application windows are time-limited and critical: Priority households (age 60+ or disabled) can apply December 1-31 only; all other households can apply January 1-March 31 or until funds are exhausted. Missing these windows means waiting until the next funding cycle.[1][4][6][7]
- North Carolina received approximately $96.3 million in LIHEAP funding for the current cycle, but $1.8 million is reserved for Tribal communities, reducing available funds for general population.[1]
- Income limits are based on gross (pre-tax) income, not net income.[1]
- Households that received LIEAP in the prior year (2023-2024) and meet priority criteria may receive automatic payments without reapplying, but only if they received notice of eligibility; those who did not receive notice must apply manually.[2]
- The program provides only a one-time payment per funding cycle, not ongoing assistance.[1][2]
- Payment goes directly to the heating vendor, not to the household, so applicants cannot redirect funds.[2]
- Disabled persons must be receiving services through the NC Division of Aging and Adult Services to qualify for priority status; simply having a disability is insufficient.[1][4]
- Asset limits are strict: even modest savings can disqualify a household if they exceed the threshold.[1]

**Data shape:** This program operates on a strict annual cycle with two application windows: a priority window (December 1-31) for elderly and disabled households, and a general window (January 1-March 31) for all other eligible households. Benefits are fixed at $300-$500 per household (not scaled by household size as one might expect) and vary only by primary heating source. The program is entirely dependent on annual federal appropriations and available funds; it is not an entitlement program. Income thresholds are percentage-based (130-150% of FPL) rather than fixed dollar amounts, meaning eligibility changes annually. County-level administration creates potential for minor regional variations in asset limits and processing procedures, though core eligibility criteria are statewide.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ncdhhs.gov/divisions/social-services/energy-assistance/low-income-energy-assistance-lieap

---

### NC Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Total household income at or below 200% of the federal poverty guidelines, or receiving Work First (TANF), Supplemental Security Income (SSI), or similar assistance. Example limits (likely 2024/2025 levels, subject to annual updates): 1 person: $31,300; 2: $42,300; 3: $53,300; 4: $64,300; 5: $75,300; 6: $86,300; 7: $97,300; 8: $108,300; add $11,000 per additional person.[2][5][6]
- Assets: No asset limits mentioned in program guidelines.[1][2]
- Household must reside in a home eligible for weatherization (not needing major repairs; single-family homes, duplexes, condos, mobile homes qualify).[2][3][4]
- Homeowners or renters with written landlord permission.[1][2][4]
- One service per household.[1]
- Priority for elderly, disabled, or families with children when funds limited.[2][5][6]

**Benefits:** In-home energy assessments and installations of energy-saving measures (e.g., insulation, air sealing, heating/cooling efficiency upgrades) at little to no cost. Average cost per household ~$2,500 in materials/labor; saves ~$215-$372/year on energy bills.[1][4][5][6]
- Varies by: priority_tier

**How to apply:**
- Contact NC Energy Office at 919-713-1570 for statewide info or local provider.[2]
- Regional providers: e.g., Resources for Seniors (Wake/Durham: 919-713-1570, download packet); PTRC (Piedmont Triad: 336-904-0338 mailed app); EICCA (application request); Action Pathways (southeastern NC counties).[2][4][5][6]
- Mail or in-person to local provider; online forms via some providers (e.g., EICCA link).[5]
- Sign Customer Program Application and Assessment Form.[1]

**Timeline:** Not specified; first-come, first-served until funds exhausted. Two-step: income/home approval, then audit.[1][3]
**Waitlist:** Funds limited; priority-based when funds low; no formal waitlist details.[1][2]

**Watch out for:**
- Funds limited, first-come first-served; may exhaust quickly.[1]
- Home must pass pre-assessment (not for major repairs/rehab).[2][3]
- Renters need landlord permission; only one service per household.[1][4]
- Income/SSI/TANF automatic qualifier, but priority for elderly/disabled/kids—still apply early.[2][6]
- Verify current poverty guidelines (annual update); example table may be outdated.[2]

**Data shape:** Decentralized by region/local providers; DOE-funded statewide but contact county-specific agency; priority tiers; no age minimum but elderly prioritized; income at 200% FPL or SSI/TANF auto-qualify.

**Source:** https://www.deq.nc.gov/energy-climate/state-energy-office/weatherization-assistance-program[8]

---

### NC Home-Delivered Meals (County-Specific Programs)


**Eligibility:**
- Age: 60+ years old (65+ in Brunswick County)+
- Income: Not specified in available sources; contact county program
- Assets: Not specified in available sources; contact county program
- Homebound due to illness or incapacitating disability
- Unable to obtain food or prepare meals due to physical or cognitive impairment
- No responsible person able and willing to assist
- County resident (program-specific)
- May be unable to attend congregate nutrition sites

**Benefits:** Nutritious meals delivered to home; frequency and meal count not specified in sources
- Varies by: county

**How to apply:**
- Phone screening (varies by county)
- In-person referral from medical provider, family member, or caregiver
- Self-referral by phone

**Timeline:** Not specified; varies by county and waitlist status
**Waitlist:** Waiting lists exist in all documented programs; specific wait times not available

**Watch out for:**
- No unified statewide program—eligibility and application vary significantly by county
- Waiting lists are standard; enrollment delays expected
- County residency requirement is strict
- Age requirement varies (60+ vs. 65+)
- Income and asset limits not documented in available sources—must verify with county
- Spouse eligibility is conditional on primary applicant's eligibility
- No income test mentioned, but this should be confirmed with each county program

**Data shape:** This is not a single program but a collection of county-operated programs with common eligibility principles but different administrative structures. Families must identify their county and contact that specific program for accurate, current information.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

---

### NC Lifespan Respite Program / Family Caregiver Support

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No specific dollar amounts or household size table provided; priority given to caregivers with the greatest economic need.[3][5]
- Assets: No asset limits mentioned.[1][3][5]
- Caregiver must be a North Carolina resident.
- Caregiver must provide unpaid care to an older adult (60+) or an adult/minor of any age with disabilities requiring regular assistance with activities of daily living.
- Neither caregiver nor care recipient can be receiving ongoing, publicly-funded in-home care or respite care.
- Priority to those who have provided direct care for at least 3 months in a home-like setting, have not received publicly-funded respite in the last 3 months, or are in an emergency/extenuating circumstances.
- Voucher funds must be used within 90 days.
- Applications must come from a referring agency/professional; direct caregiver applications not accepted.[1][3][5]

**Benefits:** Up to $750 per calendar year in reimbursement vouchers for respite care services; flexible use to hire agency, facility, or individual for short-term break from caregiving.[1][5]
- Varies by: priority_tier

**How to apply:**
- Online: Submit secure application at www.highcountryaging.org/services/lifespan-respite-project (via referring agency/professional only).
- Phone: Contact Pat Guarnieri at 828-265-5434 ext. 139 or Tammy Nelson at 828-265-5434 ext. 139; email lifespan@hccog.org or pguarnieri@regiond.org.[1][4][5]

**Timeline:** Application takes only minutes; further contact handled by High Country Area Agency on Aging (no specific processing timeline stated).[1]

**Watch out for:**
- Must be referred by a professional agency; caregiver-direct applications rejected.
- No ongoing publicly-funded respite or in-home care allowed.
- Funds expire in 90 days; reimbursement-based only.
- Priority-based allocation may limit access for non-priority caregivers.
- Not a direct service; voucher for family-chosen respite providers.[1][3][5]

**Data shape:** Referral-only via agencies; priority tiers over strict income/assets; administered by specific regional agency despite statewide scope; flexible voucher for any-age special needs.

**Source:** www.highcountryaging.org/services/lifespan-respite-project

---

### NC Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level (varies by family size; exact dollar amounts change annually with federal poverty guidelines—check current HHS poverty guidelines for NC household table, e.g., for 2026, consult ASPE.hhs.gov/poverty-guidelines)
- Unemployed
- U.S. citizen or authorized to work
- Priority: veterans and qualified spouses first, then over 65, disability, low literacy/limited English proficiency, rural resident, homeless/at risk, low employment prospects, failed American Job Center services, formerly incarcerated

**Benefits:** Part-time paid community service job training (average 20 hours/week at highest of federal/state/local minimum wage); on-the-job training in roles like child care, customer service, teachers' aide, computer technician, maintenance, health care; skills training (e.g., computer); job placement assistance to unsubsidized employment; typically 6 months training
- Varies by: priority_tier

**How to apply:**
- Contact NC DHHS Division of Aging and Adult Services (specific phone/website via ncdhhs.gov/divisions/aging); local grantees like NCBA (ncbainc.org/scsep), Mid-Carolina Regional Council (mccog.org/scsep); American Job Centers; phone not specified—call NC 211 or local provider
- In-person at community nonprofits/public agencies (schools, hospitals, senior centers)
- Multiple routes via 19 national grantees/state agencies including NC operators

**Timeline:** Not specified; training starts after eligibility determination, typically leads to 6 months placement
**Waitlist:** Possible due to funding limits and transitions; varies by grantee/community availability

**Watch out for:**
- Income limit strictly 125% FPL—no asset test but proof required
- Temporary bridge program (avg 6 months) to unsubsidized work—not permanent job
- Priority tiers limit access for non-priority applicants
- Funding delays/transitions may cause waitlists or slots
- Must be unemployed and seeking work—not retirement income support
- Paid at minimum wage only

**Data shape:** Grantee-administered with priority tiers; income scales by household size at 125% FPL; regional providers determine slots/wait times; no fixed asset limits

**Source:** https://www.ncdhhs.gov/divisions/aging/senior-community-services-employment-program

---

### NC Legal Assistance for Older Adults

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; clients age 60 or older are exempt from income limitations and eligible for services[1][2][3][8]
- Assets: No asset limits mentioned; eligibility based on age with priority for greatest economic or social need[1][2][3]
- Priority given to seniors with the greatest economic or social need[1][2][3][5]
- Does not serve prisoners[1]

**Benefits:** Free civil legal help including: wills and powers of attorney; public benefits (Medicaid, food stamps/SNAP, SSI, SSDI, Veteran's benefits); abuse and neglect; unemployment compensation; housing (foreclosure, eviction, subsidized housing, repairs, utilities); consumer issues; wrongful repossession. Services include answering legal questions, advice, writing letters, phone calls, document review, and referrals to local offices or pro bono attorneys[2][3][5]
- Varies by: priority_tier

**How to apply:**
- Phone: Toll-free Senior Legal Helpline 1-877-579-7562 (9:00 AM–11:00 AM & 1:00 PM–3:00 PM, Monday-Friday)[1][2][3][5][8]
- Online: Apply via JusticeHub client portal at legalaidnc.org[7]
- Website: legalaidnc.org/project/senior-law-project/ or www.legalaidnc.org[1][2][3]

**Timeline:** Not specified in sources

**Watch out for:**
- Priority for those with greatest economic/social need may mean non-priority cases receive referrals rather than direct representation[2][3][5]
- Specific intake hours (9-11 AM, 1-3 PM M-F); call during those times[2][5]
- Excludes prisoners; not for those under 60 (separate line: 1-866-219-5262)[1][5]
- Free but civil matters only, focused on basic needs like safety, shelter, income[2][3]

**Data shape:** no income test; age 60+ exempt from financial eligibility; statewide helpline with priority tiers; services via advice, letters, referrals rather than full representation for all

**Source:** https://legalaidnc.org/project/senior-law-project/[3]

---

### NC Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents, families, and concerned parties regardless of financial status.
- Assets: No asset limits or tests apply.
- Resides (or loved one resides) in a qualifying long-term care facility in North Carolina, including nursing homes, adult care homes, family care homes, multiunit assisted housing with services, continuing care retirement communities (CCRCs), or independent living (rental) communities for seniors and disabled adults.
- Open to current/former residents, families, individuals seeking facilities, advocacy groups, and facility staff with concerns.
- No age requirement for receiving assistance; program serves adults in long-term care.

**Benefits:** Advocacy to resolve complaints about resident rights, quality of care/life; investigation of grievances; mediation with facilities; education on rights, elder abuse prevention/detection/reporting; monitoring of federal/state/local laws; facility visits (e.g., nursing homes every 3 months, adult care homes every 3 months, family care homes annually); confidential services at no cost.

**How to apply:**
- Phone or contact local regional office via county list (specific numbers vary by county; statewide info at NCDHHS site).
- In-person or visit to one of 16 regional offices housed in Area Agencies on Aging.
- Provide details verbally or in writing: resident name/address, age/birthdate, caregiver name, situation explanation, mental/physical condition.

**Timeline:** Initial consultation provided promptly upon contact; no formal processing time specified as it's complaint-resolution based.

**Watch out for:**
- Not a financial aid, healthcare, or Medicaid program—purely advocacy/complaint resolution; no direct services like care or funding.
- Abuse/neglect reports go to NC Division of Health Service Regulation or law enforcement, not solely ombudsman.
- Review admission agreements carefully, especially arbitration clauses—consult attorney before signing.
- Services are confidential and free, but ombudsmen cannot act if resident refuses involvement.
- For Medicaid/long-term care funding, apply separately via local DSS; ombudsman can assist in facility selection but not approval.
- Volunteering as CAC member has strict requirements (e.g., 18+, local residency, no conflicts of interest, 36-hour training).

**Data shape:** no income/asset test; advocacy-only for long-term care facility residents/families; delivered via 16 regional offices + local CACs with county-specific appointments/visits; complaint-driven, not enrollment-based

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ncdhhs.gov/divisions/aging/long-term-care-ombudsman

---

### North Carolina Homestead Exemption

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For the Elderly/Disabled Property Tax Homestead Exclusion (primary program for seniors): Income for the preceding calendar year must not exceed $38,800 (2025 figure; prior years like 2024 were $36,700). This limit applies regardless of household size and covers combined income for spouses. No variation by household size mentioned. Circuit Breaker program (separate) has tiered limits: $0-$38,800 (4% tax cap), $38,801-$55,050 (5% tax cap), over $55,050 ineligible, requires 5 years occupancy.
- Assets: No asset limits specified. Focus is on income and residency.
- North Carolina resident
- Own and occupy the property as permanent residence on January 1 of the tax year
- Totally and permanently disabled (alternative to age 65; requires physician or government certification)
- One-time application for main exclusion (annual for Circuit Breaker)
- Deadline: June 1 for applications
- Temporary absence allowed for health reasons or nursing home if residence unoccupied or occupied by spouse/dependent

**Benefits:** Exclusion from property taxes on the greater of $25,000 or 50% of the appraised value of the residence (home + up to 1 acre). Cannot combine with other property tax relief. Separate Disabled Veteran exclusion: first $45,000 of appraised value (no income/age limit). Circuit Breaker: caps taxes at 4-5% of income.
- Varies by: property_value

**How to apply:**
- Contact your county tax assessor's office (varies by county; e.g., Gaston County, Davidson County, Harnett County, Iredell County)
- Download/print county-specific application forms
- Mail or in-person to county tax office
- No statewide online portal specified; apply locally

**Timeline:** Notification if denied; no specific statewide timeline, handled by county

**Watch out for:**
- One-time application for main exclusion, but annual for Circuit Breaker—must reapply or lose benefit
- Income based on prior full calendar year; exceeds limit = ineligible
- Must own/occupy as of Jan 1; disqualifiers: death, property transfer, not using as permanent residence
- Cannot receive other property tax relief simultaneously
- Note: Separate from bankruptcy/creditor homestead exemption ($35k/$60k equity protection; automatic, no application)
- Deadline June 1—miss it, miss the year
- Veteran exclusion separate (no income test)

**Data shape:** Statewide uniform eligibility/benefit formula, but county-administered applications; fixed income threshold (not scaled by household); one-time vs. annual application types; confusable with bankruptcy homestead protection

**Source:** https://www.ncleg.net/enactedlegislation/statutes/html/bysection/chapter_105/gs_105-277.1.html

---

### North Carolina Long-Term Care Medicaid

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No fixed dollar limit; income must be less than the regional Medicaid nursing home pay rate (estimated $7,898–$11,218/month for singles in 2026, varying by facility/area). Nearly all income counts (IRA, pensions, Social Security, wages, etc.). Applicant pays most income toward care minus $70/month personal needs allowance, health premiums, and certain spousal allowances. For ABD Medicaid (basic coverage), single limit is $1,330/month (April 2026–March 2027). Married couples: spousal income generally not counted unless both applying; community spouse can retain up to half of joint assets up to $162,660 (2026).[1][2][3][6][7][10]
- Assets: Singles: $2,000 max in countable assets (cash, bank accounts, stocks, non-exempt property). Married (both needing care): $3,000. Exempt: primary home (equity up to $730,000 if intent to return, spouse/child under 21/disabled child lives there), one vehicle, personal belongings, life insurance (face value ≤$1,500), burial plots/funds.[2][3][7]
- NC resident and US citizen/qualified immigrant.
- Nursing Facility Level of Care (NFLOC): need full-time care based on assessment of Activities of Daily Living (ADLs: mobility, bathing, dressing, eating, toileting) and Instrumental ADLs (IADLs: cleaning, cooking, shopping, managing meds/bills), plus cognitive/behavioral issues.
- Need care for 30+ consecutive days.

**Benefits:** Coverage for nursing home care (full cost minus patient liability), assisted living, home/community-based services (HCBS) waivers (e.g., personal care, adult day health, home modifications), intermediate care facilities. Patient pays income toward facility cost (minus $70 PNA); Medicaid covers remainder. Specific HCBS varies by waiver/program (e.g., CAP/DA for disabled adults 18+, PACE for 55+ in select areas).[1][3][4][9]
- Varies by: priority_tier|region

**How to apply:**
- Online: epass.nc.gov (NC ePASS portal).
- Phone: Local Department of Social Services (DSS) or NC Medicaid Contact Center at 1-888-245-0179.
- In-person/mail: Local county DSS office (find via ncdhhs.gov/divisions/social-services/local-dss-directory).
- Assisted: Through aging/cognitive supports specialists.

**Timeline:** 45–90 days for full determination, including NFLOC assessment.
**Waitlist:** Yes, for HCBS waivers (e.g., CAP/DA); nursing home Medicaid generally no waitlist but bed availability varies.

**Watch out for:**
- No single income cap—must be <facility's Medicaid rate, but all income pays toward care (only $70 PNA kept).
- 5-year look-back penalty for asset transfers/gifts.
- HCBS waivers have waitlists; nursing home preferred for faster access.
- Home equity limit $730,000; intent to return must be realistic.
- Spousal impoverishment rules complex—community spouse asset allowance up to $162,660.
- ABD Medicaid (65+/blind/disabled) needed first for LTC add-ons.
- Medically needy spend-down via medical expenses if over limit.

**Data shape:** Income test is facility-specific pay rate (regional variation), not fixed amount; requires NFLOC assessment; multiple programs/waivers (nursing home vs HCBS) with tiered access/waitlists; spousal protections scale by joint assets.

**Source:** https://medicaid.ncdhhs.gov/providers/programs-and-services/long-term-care

---

### Project C.A.R.E. (Caregiver Alternatives to Running on Empty)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits. Program gives priority to low-income individuals, minorities, and those in rural areas.[2][3]
- Care recipient must have a diagnosis of Alzheimer's disease or related dementia (including Lewy Body Dementia, Vascular Dementia, Frontotemporal Dementia).[2]
- Adult caregiver must recognize they can benefit from care consultation.[2][4]
- Caregiver must be unpaid (family member or friend).[7]
- Caregiver must be a North Carolina resident.[7]
- Caregivers of persons currently receiving NC Medicaid CAP/DA Waiver are NOT eligible for care consultation, though they may receive dementia education, training, and referrals.[2]
- Caregivers of persons on a waitlist for CAP/DA enrollment CAN be served.[2]
- No age requirements for care recipients or caregivers.[2]

**Benefits:** Care consultation; dementia-specific information and training; caregiver education; funds for self-directed respite care (subject to eligibility and availability); connections to community-based services and resources; referrals to Family Caregiver Support Program and Area Agencies on Aging.[2][3][6]
- Varies by: Availability and individual need. Respite care vouchers are limited.[5] The level of assistance provided varies based on what the caregiver needs and prefers.[3]

**How to apply:**
- Phone: Contact your regional Area Agency on Aging or Just1Call intake line (example: 704-432-1111 for Mecklenburg County).[6]
- In-person: Visit your regional Family Consultant or Area Agency on Aging office.[3]
- Referral: Health and human service professionals can complete a referral application on behalf of a caregiver.[7]
- Online eligibility pre-check available through some regional providers.[7]

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources. Services can be provided while on waitlists for other programs like Medicaid CAP/DA.[3]

**Watch out for:**
- Caregivers of persons CURRENTLY on Medicaid CAP/DA Waiver are ineligible for care consultation services, though they can still receive dementia education and referrals. This is a common point of confusion.[2]
- There is NO income limit, but the program prioritizes low-income, minority, and rural families—meaning higher-income families may face longer waits or lower priority.[2][3]
- Respite care vouchers are explicitly limited in availability.[5] Not all eligible caregivers will receive them.
- The program is NOT statewide—coverage depends on which regional host agency serves your county. You must contact your specific regional provider.[2]
- Processing time and waitlist status are not publicly documented, making it difficult to plan ahead.
- The program began in 2001 and is described as the 'only state-funded, dementia-specific support' for caregivers in North Carolina, but availability varies significantly by region.[5]

**Data shape:** Project C.A.R.E. is a regionally fragmented program with no statewide uniform application process. Benefits are service-based rather than cash-based, with respite care vouchers being the primary financial component (limited availability). Eligibility is straightforward (dementia diagnosis + caregiver recognition of need) with no income or asset tests, but priority is given to underserved populations. The program's structure relies on regional Area Agencies on Aging as host agencies, meaning application methods, contact information, and processing times vary by county/region. No public data on processing times or waitlists is available.

**Source:** https://www.ncdhhs.gov/divisions/aging/project-care-caregiver-alternatives-running-empty

---

### State-County Special Assistance - In Home


**Eligibility:**
- Age: 65 or older, or 18-64 and disabled per Social Security definition, or under 18 and legally blind[1][2][3]+
- Income: Must be below federal poverty level or meet State/County Special Assistance income requirements (exact dollar amounts not specified in sources; same as traditional Special Assistance; higher for Enhanced Rate with Alzheimer's/dementia diagnosis)[1][2][5]
- Assets: Must meet State/County Special Assistance resource requirements (specific limits and exemptions not detailed in sources)[2][3]
- U.S. citizen or qualified alien[1][2][3]
- North Carolina resident[1][2][3]
- Require level of care provided in licensed Adult Care Home (verified by doctor via FL-2 form) but desire to live at home[1][2][5]
- Health, safety, and well-being can be maintained at home with services like in-home aide, home modifications, case management, supplies[1]
- Receive SSI or financially ineligible for SSI solely due to excess income[3]
- Not inmate of public institution[3]
- All Medicaid and community resources considered first[1]

**Benefits:** Monthly cash payments for living expenses (food, shelter, clothing, daily necessities); 2024 maximum rates: Basic $1,326/month, Enhanced $1,700/month (requires Alzheimer's/dementia diagnosis verified by FL-2); automatic Medicaid eligibility[2][5]
- Varies by: priority_tier

**How to apply:**
- Contact local county Department of Social Services (DSS)[2][5]
- Wake County example: Call Catherine Goldman at 919-250-3835 for info or Tracy Gregory at 919-212-7549 to apply[1]

**Timeline:** Up to 45 days for 65+; up to 60 days for 18-64[1][2]
**Waitlist:** Eliminated; eligible applicants approved without delay[5]

**Watch out for:**
- Must exhaust Medicaid/community resources first[1]
- Requires doctor-verified FL-2 form for Adult Care Home level of care[2][5]
- Enhanced rate only for Alzheimer's/dementia with valid FL-2[2]
- Case management mandatory: monthly contact, quarterly visits, annual assessment[1]
- Spouse's income/assets do not affect eligibility[5]
- Eligibility case-by-case; not automatic even if criteria met[1]

**Data shape:** County-administered statewide with local DSS variation; tiered benefits (Basic/Enhanced) by dementia diagnosis; no waitlist; scales by diagnosed needs rather than household size

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.ncdhhs.gov/divisions/social-services/special-assistance/state-and-county-special-assistance-home-residents[7]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| NC Medicaid Home and Community-Based Ser | benefit | state | deep |
| NC Program of All-Inclusive Care for the | benefit | local | deep |
| NC Medicare Savings Programs (QMB, SLMB, | benefit | federal | deep |
| NC Food and Nutrition Services (FNS)/SNA | benefit | federal | deep |
| NC Low-Income Energy Assistance Program  | benefit | federal | deep |
| NC Weatherization Assistance Program | benefit | federal | deep |
| NC Home-Delivered Meals (County-Specific | benefit | local | medium |
| NC Lifespan Respite Program / Family Car | benefit | state | deep |
| NC Senior Community Service Employment P | employment | federal | deep |
| NC Legal Assistance for Older Adults | resource | state | simple |
| NC Long-Term Care Ombudsman Program | resource | federal | simple |
| North Carolina Homestead Exemption | benefit | state | deep |
| North Carolina Long-Term Care Medicaid | benefit | state | deep |
| Project C.A.R.E. (Caregiver Alternatives | benefit | local | medium |
| State-County Special Assistance - In Hom | benefit | state | deep |

**Types:** {"benefit":12,"employment":1,"resource":2}
**Scopes:** {"state":6,"local":3,"federal":6}
**Complexity:** {"deep":11,"medium":2,"simple":2}

## Content Drafts

Generated 15 page drafts. Review in admin dashboard or `data/pipeline/NC/drafts.json`.

- **NC Medicaid Home and Community-Based Services (HCBS) Waivers** (benefit) — 5 content sections, 6 FAQs
- **NC Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 4 content sections, 6 FAQs
- **NC Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **NC Food and Nutrition Services (FNS)/SNAP** (benefit) — 4 content sections, 6 FAQs
- **NC Low-Income Energy Assistance Program (LIHEAP)** (benefit) — 5 content sections, 6 FAQs
- **NC Weatherization Assistance Program** (benefit) — 5 content sections, 6 FAQs
- **NC Home-Delivered Meals (County-Specific Programs)** (benefit) — 4 content sections, 6 FAQs
- **NC Lifespan Respite Program / Family Caregiver Support** (benefit) — 2 content sections, 6 FAQs
- **NC Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **NC Legal Assistance for Older Adults** (resource) — 1 content sections, 6 FAQs
- **NC Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **North Carolina Homestead Exemption** (benefit) — 3 content sections, 6 FAQs
- **North Carolina Long-Term Care Medicaid** (benefit) — 4 content sections, 6 FAQs
- **Project C.A.R.E. (Caregiver Alternatives to Running on Empty)** (benefit) — 4 content sections, 6 FAQs
- **State-County Special Assistance - In Home** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 7 programs
- **funding_source — Medicare covers Medicare-eligible services; Medicaid covers Medicaid-eligible services; private pay covers all services at negotiated rates. Specific service mix is individualized based on care plan[3].**: 1 programs
- **household_size**: 1 programs
- **household_size and primary heating source**: 1 programs
- **county**: 1 programs
- **not_applicable**: 1 programs
- **property_value**: 1 programs
- **priority_tier|region**: 1 programs
- **Availability and individual need. Respite care vouchers are limited.[5] The level of assistance provided varies based on what the caregiver needs and prefers.[3]**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **NC Medicaid Home and Community-Based Services (HCBS) Waivers**: Multiple distinct waivers (CAP/DA, CAP/C, TBI, Innovations) with target populations, all statewide but local admin; benefits/service arrays waiver-specific; waitlists and NFLOC universal; applicant-only income for Medicaid qual
- **NC Program of All-Inclusive Care for the Elderly (PACE)**: NC PACE is a regionally fragmented program with multiple independent PACE organizations, each serving specific counties. Eligibility is standardized statewide (age 55+, nursing home level of care, service area residency), but availability, service offerings, and costs vary by provider. Income limits apply only if seeking Medicaid coverage; otherwise, no income test exists. Asset limits ($2,000) apply only for Medicaid eligibility. The program is voluntary enrollment with no waitlist information publicly available. Processing timelines and required documentation are not standardized across providers.
- **NC Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB lowest, QI highest); QI capped enrollment; asset limits fixed federally but income FPL-adjusted annually; local county administration with statewide uniformity in rules.
- **NC Food and Nutrition Services (FNS)/SNAP**: Net income only for elderly/disabled households (no gross test); deductions heavily favor seniors (medical, standard); Simplified SNAP auto-enrollment for SSI/65+; benefits scale by household size with max allotments; county DSS processing.
- **NC Low-Income Energy Assistance Program (LIHEAP)**: This program operates on a strict annual cycle with two application windows: a priority window (December 1-31) for elderly and disabled households, and a general window (January 1-March 31) for all other eligible households. Benefits are fixed at $300-$500 per household (not scaled by household size as one might expect) and vary only by primary heating source. The program is entirely dependent on annual federal appropriations and available funds; it is not an entitlement program. Income thresholds are percentage-based (130-150% of FPL) rather than fixed dollar amounts, meaning eligibility changes annually. County-level administration creates potential for minor regional variations in asset limits and processing procedures, though core eligibility criteria are statewide.
- **NC Weatherization Assistance Program**: Decentralized by region/local providers; DOE-funded statewide but contact county-specific agency; priority tiers; no age minimum but elderly prioritized; income at 200% FPL or SSI/TANF auto-qualify.
- **NC Home-Delivered Meals (County-Specific Programs)**: This is not a single program but a collection of county-operated programs with common eligibility principles but different administrative structures. Families must identify their county and contact that specific program for accurate, current information.
- **NC Lifespan Respite Program / Family Caregiver Support**: Referral-only via agencies; priority tiers over strict income/assets; administered by specific regional agency despite statewide scope; flexible voucher for any-age special needs.
- **NC Senior Community Service Employment Program (SCSEP)**: Grantee-administered with priority tiers; income scales by household size at 125% FPL; regional providers determine slots/wait times; no fixed asset limits
- **NC Legal Assistance for Older Adults**: no income test; age 60+ exempt from financial eligibility; statewide helpline with priority tiers; services via advice, letters, referrals rather than full representation for all
- **NC Long-Term Care Ombudsman Program**: no income/asset test; advocacy-only for long-term care facility residents/families; delivered via 16 regional offices + local CACs with county-specific appointments/visits; complaint-driven, not enrollment-based
- **North Carolina Homestead Exemption**: Statewide uniform eligibility/benefit formula, but county-administered applications; fixed income threshold (not scaled by household); one-time vs. annual application types; confusable with bankruptcy homestead protection
- **North Carolina Long-Term Care Medicaid**: Income test is facility-specific pay rate (regional variation), not fixed amount; requires NFLOC assessment; multiple programs/waivers (nursing home vs HCBS) with tiered access/waitlists; spousal protections scale by joint assets.
- **Project C.A.R.E. (Caregiver Alternatives to Running on Empty)**: Project C.A.R.E. is a regionally fragmented program with no statewide uniform application process. Benefits are service-based rather than cash-based, with respite care vouchers being the primary financial component (limited availability). Eligibility is straightforward (dementia diagnosis + caregiver recognition of need) with no income or asset tests, but priority is given to underserved populations. The program's structure relies on regional Area Agencies on Aging as host agencies, meaning application methods, contact information, and processing times vary by county/region. No public data on processing times or waitlists is available.
- **State-County Special Assistance - In Home**: County-administered statewide with local DSS variation; tiered benefits (Basic/Enhanced) by dementia diagnosis; no waitlist; scales by diagnosed needs rather than household size

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in North Carolina?
