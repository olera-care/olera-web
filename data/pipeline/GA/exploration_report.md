# Georgia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 7.1m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 11 |
| New (not in our data) | 6 |
| Data discrepancies | 5 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **employment**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Georgia Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$994` → Source says `$1,325` ([source](https://medicaid.georgia.gov/medicare-savings-plans-programs-faqs))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums (~$202.90/month in 2026[1]), Part B deductible, coinsurance/copayments for Medicare-covered services (Parts A/B). Providers cannot bill QMB enrollees for these; acts like Medigap. Auto-qualifies for Part D Extra Help.

**SLMB:** Pays only Part B premium.

**QI:** Pays only Part B premium (same as SLMB, but higher income cap; funded by finite federal block grant[3]).` ([source](https://medicaid.georgia.gov/medicare-savings-plans-programs-faqs))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.georgia.gov/medicare-savings-plans-programs-faqs`

### Senior Supplemental Nutrition Assistance Program (Senior SNAP)

- **min_age**: Ours says `65` → Source says `All household members must be 60 years or older before February 2, 2026; increases to 66 years or older effective February 2, 2026. They must purchase and prepare meals together[1][3]` ([source](https://dfcs.georgia.gov/services/snap/senior-snap[1]))
- **income_limit**: Ours says `$1982` → Source says `$1695` ([source](https://dfcs.georgia.gov/services/snap/senior-snap[1]))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `SNAP benefits loaded monthly onto an EBT card for purchasing groceries at stores (works like debit card); amount based on household net income (generally $100 more net income = $30 less benefits), with minimum/maximum per federal SNAP scale[2][4]` ([source](https://dfcs.georgia.gov/services/snap/senior-snap[1]))
- **source_url**: Ours says `MISSING` → Source says `https://dfcs.georgia.gov/services/snap/senior-snap[1]`

### Low Income Home Energy Assistance Program (LIHEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Payments applied directly to energy supplier account. Minimum $350, maximum $400 per eligible household. Seniors 60+ in household receive maximum $400. One heating and one cooling benefit per program year possible. Amount determined by federal funding[6].` ([source](https://dfcs.georgia.gov/regular-home-energy-assistance/energy-assistance-eligibility-requirements))
- **source_url**: Ours says `MISSING` → Source says `https://dfcs.georgia.gov/regular-home-energy-assistance/energy-assistance-eligibility-requirements`

### Home-Delivered Meals

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Nutritious meals delivered to residence, providing at least 1/3 of Reference Daily Intakes per meal, following USDA Dietary Guidelines; typically 5 meals per week (M-F); includes nutrition education, social check-in; no charge, voluntary contributions accepted; alternative meals (shelf-stable, frozen, etc.) allowed if meeting nutrient targets; meals may extend to spouse/caregiver or household dependents to support home maintenance.[1][5][8]` ([source](https://pamms.dhs.ga.gov/das/hcbs-5300-manual/304/))
- **source_url**: Ours says `MISSING` → Source says `https://pamms.dhs.ga.gov/das/hcbs-5300-manual/304/`

### Caregiver Programs (Out-of-Home Respite Care)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Out-of-home respite in licensed facility, community setting, or provider's home (where permitted); includes daytime/overnight supervision, personal care, assistance with ADLs (bathing, dressing, grooming, toileting); emergency or scheduled respite. DFCS program: up to 5 hours/month at $6/hour for first child, $2/hour for siblings. Other programs: 4-hour blocks, up to 18 hours/week in specific cases (e.g., ALS).` ([source](https://dfcs.georgia.gov/respite-care))
- **source_url**: Ours says `MISSING` → Source says `https://dfcs.georgia.gov/respite-care`

## New Programs (Not in Our Data)

- **Community Care Services Program (CCSP)** — service ([source](https://aging.georgia.gov (Division of Aging Services); https://georgia.gov/apply-elderly-and-disabled-waiver-program (note: formerly CCSP, now Elderly and Disabled Waiver)[6][7]))
  - Shape notes: Medicaid waiver with NFLOC functional assessment; services capped at nursing facility cost average; prioritized by need; regional AAAs handle delivery; potential Medicaid post-enrollment
- **Home & Community-Based Services Program** — service ([source](https://dch.georgia.gov/programs/hcbs))
  - Shape notes: Medicaid waiver with NFLOC via in-person MDS-HC nurse assessment; priority to greatest need if funding limited; statewide but regional AAAs; caps create waitlists
- **Weatherization Assistance Program (WAP)** — service ([source](https://gefa.georgia.gov/weatherization))
  - Shape notes: County-specific local agencies handle intake/processing; uniform 200% FPL/SSI eligibility statewide but priority tiers and waitlists vary regionally; services audit-driven, not fixed dollar amounts.
- **Georgia State Health Insurance Assistance Program (Georgia SHIP)** — service ([source](https://aging.georgia.gov/georgia-ship and https://ship.georgia.gov[8][9][10]))
  - Shape notes: no income/asset test; volunteer counseling network statewide with local variation in access points; services are advisory/enrollment assistance only, not direct benefits
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://aging.georgia.gov/programs-and-services/senior-community-service-employment-program-scsep (notes state no longer offers directly; refers to providers); https://www.dol.gov/agencies/eta/seniors (federal)))
  - Shape notes: Provider-led post-2025 (no central state office); county-restricted by grantee; income fixed at 125% FPL (varies household size annually); priority enrollment tiers; limited total slots with regional waitlists
- **Elderly Legal Assistance Program (ELAP)** — service ([source](https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program))
  - Shape notes: No income/asset test (federally prohibited); county-based local providers via 12 Area Agencies on Aging; priority-based targeting; related but distinct brief-service hotline

## Program Details

### Community Care Services Program (CCSP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Financial eligibility follows Medicaid nursing facility criteria. SSI recipients are automatically eligible. For non-SSI, countable income must meet Medicaid standards (specific 2026 dollar amounts not listed; varies by category). If spouse not in program/institution, combined countable assets ≤ $121,220. No explicit income table by household size provided[1][5][6].
- Assets: Countable assets follow Medicaid rules. Combined countable assets with non-institutionalized spouse ≤ $121,220. Home equity ≤ $752,000 (2026) if living in home or intent to return. Home exempt if spouse or dependent relative (child, grandchild, in-law, parent, sibling, etc.) lives there. Client must transfer assets in their name. Subject to Medicaid Estate Recovery[1][5].
- Georgia resident
- Require intermediate Nursing Facility Level of Care (NFLOC), assessed via Determination of Need Functional Assessment-Revised (DON-R) and Minimum Data Set Home Care (MDS-HC) for ADLs/IADLs (e.g., mobility, eating, toileting, meal prep, money management)
- Functional impairment from physical condition (includes Alzheimer's/dementia)
- Unmet need for care
- Physician approval of care plan and intermediate LOC
- Medicaid eligible or potentially eligible post-admission
- Choose community-based over institutional services
- Live safely in community with services
- Participate in only one waiver program
- Under 65 allowed if physically disabled; continues at 65[1][2][3][4][5][7]

**Benefits:** Community-based services as alternative to nursing home: Personal Support Services (personal care/hygiene, meal prep, light housekeeping, shopping, in-home respite); Out-of-Home Respite Care (overnight in approved facility); Home Delivered Meals; care coordination; other social/health/support services arranged via care plan. Limited to average annual cost of Medicaid nursing facility care[5][7].
- Varies by: priority_tier

**How to apply:**
- Phone: Call Area Agency on Aging at 1-866-55-AGING (866-552-4464) or regional (e.g., Coastal: 1-800-580-6860) for assessment/intake screening[4][7]
- In-person: Contact local Area Agency on Aging (AAA) or county Department of Family and Children Services for Medicaid application[2]
- Apply for Medicaid via county DFCS after CCSP assessment[2]

**Timeline:** Not specified in sources
**Waitlist:** Possible; prioritizes those most in need[7]

**Watch out for:**
- Potentially Medicaid eligible only after CCSP admission (apply for Medicaid post-assessment)[2][5]
- Home may be subject to Medicaid Estate Recovery even if exempt during benefits[1]
- Must choose community over nursing home; only one waiver at a time[5][7]
- Program prioritizes most needy; waitlists common[7]
- Spousal assets fully considered if spouse not institutionalized[5]
- Now rebranded as Elderly and Disabled Waiver Program in some official contexts[6]

**Data shape:** Medicaid waiver with NFLOC functional assessment; services capped at nursing facility cost average; prioritized by need; regional AAAs handle delivery; potential Medicaid post-enrollment

**Source:** https://aging.georgia.gov (Division of Aging Services); https://georgia.gov/apply-elderly-and-disabled-waiver-program (note: formerly CCSP, now Elderly and Disabled Waiver)[6][7]

---

### Home & Community-Based Services Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Must meet Georgia Medicaid financial eligibility (specific 2026 dollar amounts not listed in sources; follows standard Medicaid income rules with spousal impoverishment protections). No household size table provided in sources.
- Assets: Georgia Medicaid asset limit applies (exact countable limit not specified in sources). Countable assets exclude primary home (if equity ≤ $752,000 in 2026, applicant lives there/intends to return, spouse/dependent relative resides there), one vehicle, household furnishings/appliances, personal effects. 60-month look-back rule penalizes asset transfers below fair market value.
- Georgia resident
- Medicaid eligible
- Meet Nursing Facility Level of Care (NFLOC) via Minimum Data Set Home Care (MDS-HC) assessment by nurse: impairments in ADLs (transferring, mobility, eating, toileting, meal prep, money management, housework) or cognitive issues (e.g., dementia)

**Benefits:** In-home/community services to avoid nursing home placement: personal care, homemaker, adult day care, respite, skilled nursing, therapies (not specified hours/dollars; individualized based on needs).
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging or Department of Community Health (specific phone/website not listed; start via Medicaid intake)
- In-person nurse assessment for MDS-HC

**Timeline:** Not specified in sources
**Waitlist:** Often waiting lists due to enrollment caps (state sets maximum served)

**Watch out for:**
- Must meet strict NFLOC (nursing home level need); not for mild needs
- 60-month look-back penalizes asset transfers
- Home exempt now but subject to Estate Recovery later
- Enrollment caps create waitlists
- Not all seniors qualify; requires Medicaid eligibility first
- Confused with non-Medicaid HCBS for 60+ (sliding scale, no Medicaid req)[2]

**Data shape:** Medicaid waiver with NFLOC via in-person MDS-HC nurse assessment; priority to greatest need if funding limited; statewide but regional AAAs; caps create waitlists

**Source:** https://dch.georgia.gov/programs/hcbs

---

### Georgia Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: Must be entitled to Medicare Part A (typically age 65+ or disabled). Income limits vary by program and are based on Federal Poverty Level (FPL), updated annually (current 2026 figures from sources). Georgia follows federal standards with slight state variations reported:

**QMB (100% FPL):** Individual: $1,325/month; Couple: $1,783/month[1][2]. Other sources cite ~$1,235-$1,350 individual[4][9].

**SLMB (120% FPL):** Individual: $1,478-$1,590/month; Couple: $1,992-$2,140/month[4]. Above QMB but below QI.

**QI (135% FPL):** Individual: $1,660/month; Couple: $2,239/month[4]. Highest limit, same Part B premium benefit as SLMB.

Full household tables not explicitly provided; limits scale for larger households (e.g., add ~$458/person beyond couple per FPL standards). Confirm current via official site as figures conflict slightly across sources.
- Assets: Federal limits apply statewide: Individual: $9,090-$9,950; Couple: $13,630-$14,910 (varies by source[1][4][5][9]). Countable assets include bank accounts, stocks; exempt: home, one car, personal belongings, burial plots, life insurance (up to $1,500 face value), irrevocable burial trusts. States may not be less restrictive; Georgia uses federal[3][4].
- Must be enrolled in Medicare Part A (entitled, not necessarily premium-paying).
- U.S. citizen or qualified immigrant.
- Georgia resident.
- Not eligible for full Medicaid (these are for 'dual eligibles' with higher income).

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums (~$202.90/month in 2026[1]), Part B deductible, coinsurance/copayments for Medicare-covered services (Parts A/B). Providers cannot bill QMB enrollees for these; acts like Medigap. Auto-qualifies for Part D Extra Help.

**SLMB:** Pays only Part B premium.

**QI:** Pays only Part B premium (same as SLMB, but higher income cap; funded by finite federal block grant[3]).
- Varies by: priority_tier

**How to apply:**
- Phone: Call Georgia SHIP counselors at 1-866-552-4464 (Option 4), Mon-Fri 8am-5pm for assistance[6].
- Online: Apply via Georgia Gateway at https://gateway.ga.gov (Medicaid portal; select Medicare Savings Program)[2] (inferred from state Medicaid site).
- Mail/In-person: Local DFCS Medicaid offices (find via medicaid.georgia.gov); no specific form number listed, use Medicaid application (J2F or online equivalent)[10].

**Timeline:** QMB: Starts month after eligibility determination. SLMB/QI: Up to 3 months retroactive before application month (premium refunds possible)[2]. Typical processing: 45 days (standard Medicaid).
**Waitlist:** QI may have waitlist or cap due to finite federal block grant funding; once funds exhausted, eligible applicants denied for year[3]. QMB/SLMB not typically waitlisted.

**Watch out for:**
- QI funding is limited (block grant); apply early in calendar year or risk denial even if eligible[3].
- Income/asset limits updated April 1 annually; confirm current FPL-based figures[3].
- QMB protects from provider billing for Medicare cost-sharing, but non-Medicare services may bill[3].
- Retroactive premiums (up to 3 months) for SLMB/QI only, not always QMB[2].
- Automatic Extra Help for Part D with QMB, but must verify enrollment.
- Conflicting income figures across sources; use official GA Medicaid for exact.
- Assets include spouse's even if not applying.

**Data shape:** Tiered by income brackets (QMB lowest, QI highest); all pay Part B premiums but QMB adds full cost-sharing; asset-tested with federal exemptions; QI capped by federal funding; scales minimally by household size via FPL add-ons.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.georgia.gov/medicare-savings-plans-programs-faqs

---

### Senior Supplemental Nutrition Assistance Program (Senior SNAP)


**Eligibility:**
- Age: All household members must be 60 years or older before February 2, 2026; increases to 66 years or older effective February 2, 2026. They must purchase and prepare meals together[1][3]+
- Income: Household must meet SNAP gross income limits (130% of federal poverty level, Oct 1, 2025 - Sept 30, 2026) if applicable: 1 person $1695/month, 2 people $2291/month, 3 people $2887/month, 4 people $3482/month, 5 people $4079/month, 6 people $4674/month, 7 people $5270/month, each additional +$595/month. Households with members 60+ or disabled only meet gross income test if assets exceed $4500; otherwise exempt from net income and asset tests if under 200% FPL. No earned income allowed; only fixed income like Social Security, SSI, retirement, VA, Railroad Retirement[1][2][3]
- Assets: Generally exempt for households with all members 60+ or disabled if gross income met and assets under $4500; standard SNAP asset test applies if over $4500 (exempt: home, retirement savings, household goods; countable: cash, bank accounts, non-exempt property)[2][3]
- No earned income (countable or excluded) for any household member[3]
- Fixed permanent income only (e.g., Social Security, SSI, federal/state retirement, VA benefits, Railroad Retirement, disability income)[1][3]
- Residency in Georgia; U.S. citizen or qualified non-citizen (5+ years residency, disability benefits, or child under 18)[3][7]

**Benefits:** SNAP benefits loaded monthly onto an EBT card for purchasing groceries at stores (works like debit card); amount based on household net income (generally $100 more net income = $30 less benefits), with minimum/maximum per federal SNAP scale[2][4]
- Varies by: household_size

**How to apply:**
- Phone: Call (404) 370-6236 to request application mailed[4]
- Email: seniorsnap@dhr.state.ga.us to request application[4]
- Mail: Return completed application to Georgia DFCS (address provided upon request via phone/email)[4]
- No in-person office or face-to-face interview required; no standard online portal specified for Senior SNAP (use regular SNAP portals if ineligible for Senior SNAP)[3][4]

**Timeline:** Not specified in sources[1][3][4]

**Watch out for:**
- Age requirement changes to 66+ effective February 2, 2026 (currently 60+)[3]
- No earned income allowed at all, even excluded types[3]
- Must verify only specific items; fixed income often auto-verified via computer matches (SDX, BENDEX, IEVS)[3]
- All household members must meet age/no-work criteria and share food prep[1][3]
- If ineligible for Senior SNAP, can apply for regular SNAP using medical deductions[6]
- Benefits via EBT card only, not cash[4]

**Data shape:** Simplified process with minimal verification for fixed-income seniors; age threshold rising to 66 in 2026; no earned income permitted; ties directly to standard SNAP income/benefit rules but with exemptions and easier application

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfcs.georgia.gov/services/snap/senior-snap[1]

---

### Low Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Total gross household income at or below 60% of Georgia's State Median Income (SMI), varying by household size. Specific dollar amounts not listed in sources; check current SMI guidelines via local agency. Seniors (60+ or 65+) receive priority but no age requirement for general eligibility[1][2][5][6].
- Assets: No asset limits mentioned in sources.
- Responsibility for paying the cost of energy for the primary home heating source (sometimes cooling)[1][2][5][6].
- U.S. citizen or lawfully admitted immigrant[1][2][5][6].
- Household energy supplier must be a registered LIHEAP vendor with Georgia Department of Human Services[1].

**Benefits:** Payments applied directly to energy supplier account. Minimum $350, maximum $400 per eligible household. Seniors 60+ in household receive maximum $400. One heating and one cooling benefit per program year possible. Amount determined by federal funding[6].
- Varies by: priority_tier

**How to apply:**
- Online appointment scheduling via local Community Action Agency portals (e.g., https://www.cafi-ga.org/liheap-faq/ for some counties; varies by agency)[1][2].
- Phone: Call local agency publicized number to schedule appointment or join waitlist (specific numbers vary by county/provider)[2][4].
- In-person: At scheduled appointments with local Community Action Agencies (CAAs) after booking[1][3][4].
- Home visits for homebound applicants[6].

**Timeline:** First-come, first-served; served by each agency in service counties. No specific timeline stated[5].
**Waitlist:** Yes, if appointment slots full; check portal periodically or call to join waitlist. Varies by county budget[1][4].

**Watch out for:**
- Energy supplier must be registered LIHEAP vendor, or ineligible[1].
- Appointments required; first-come, first-served until funds exhausted; seniors/disabled priority (e.g., opens January 2, 2026 for 65+)[1][2][5].
- Must apply in own county; no switching if slots full[1].
- Bring copies of all documents; zero-income verification needed[3].
- Cooling assistance seasonal/if funding available; one benefit per type per year[4][6].

**Data shape:** Administered by county-specific Community Action Agencies with separate budgets and appointment systems; priority tiers for seniors (60+/65+) and homebound; income at 60% SMI (varies by household size, table not in sources); direct payments to vendors only.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfcs.georgia.gov/regular-home-energy-assistance/energy-assistance-eligibility-requirements

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Level (FPL). Alternative qualification: receipt of Supplemental Security Income (SSI). Exact dollar amounts vary annually with FPL updates and by household size (e.g., for 2026, consult current HHS FPL guidelines as specific table not in sources; typically ~$30,120 for 1 person, ~$40,880 for 2, scaling up). Priority given to elderly, households with disabilities, and families with children.[1][2][3][7]
- Assets: No asset limits mentioned in sources.
- Eligible home types: single-family, manufactured homes, appropriate multi-family units (campers and non-stationary trailers ineligible).[1][3]
- Homeowners and renters qualify; renters need landlord agreement.[1]

**Benefits:** No-cost home energy efficiency improvements based on energy audit results, including: air and duct sealing, wall/floor/attic insulation, HVAC system improvements, energy-efficient lighting, hot water tank/pipe insulation, water conservation devices. Does not cover pre-existing structural issues like roofing, walls, flooring holes, underpinning, or ceiling replacement.[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact local community action agency by county (full list at https://gefa.georgia.gov/weatherization).[4]
- Examples: CSRA EOA at (706) 945-1616 or www.csraeoa.org (download application); Savannah/Chatham via Action Pact; Middle Georgia Community Action Agency.[1][3][8]

**Timeline:** Not specified; energy audit follows qualification, then measures installed by contractors.
**Waitlist:** Due to high demand, there may be a waiting list.[4]

**Watch out for:**
- Renters need landlord agreement; ineligible for campers/non-stationary trailers or pre-existing structural repairs (e.g., no roof/wall replacement); priority to elderly/disabled/families with children may create longer waits for others; must contact specific county agency, not centralized.[1][3][4]

**Data shape:** County-specific local agencies handle intake/processing; uniform 200% FPL/SSI eligibility statewide but priority tiers and waitlists vary regionally; services audit-driven, not fixed dollar amounts.

**Source:** https://gefa.georgia.gov/weatherization

---

### Georgia State Health Insurance Assistance Program (Georgia SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[2][3][8]
- Assets: No asset limits or tests apply; no specification of what counts or is exempt as limits do not exist[2][3]
- Must be a Medicare beneficiary or caregiver/family member of one
- Georgia resident (inferred from program scope)
- Services focus on Medicare-related issues[2][3][8]

**Benefits:** Free, unbiased one-on-one counseling and assistance on Medicare (Parts A, B, C, D), Medigap, Medicaid, prescription drug programs, long-term care insurance, claims/billing resolution, appeals, enrollment in plans and financial assistance programs (e.g., Medicare Savings Programs like QMB/SLMB/QI, Extra Help/Low Income Subsidy), fraud prevention via SMP, public education presentations, and referrals; no fixed dollar amounts or hours specified[2][3][5][6][8][10]

**How to apply:**
- Phone: 1-866-552-4464 (select option 4)
- Website: ship.georgia.gov (for contact, counseling requests, events)
- Email: varies by local provider (e.g., lplatter@accaging.org for Athens area)
- In-person: Local sessions via community outreach, presentations, or partner offices (e.g., Athens Community Council on Aging at 706-549-4850)
- No specific online form or mail application mentioned; contact to schedule[5][7][8][9]

**Timeline:** Not specified; services provided via phone/face-to-face sessions upon contact (Monday-Friday 8am-5pm)[9]

**Watch out for:**
- Not an insurance provider or seller—provides information only, does not sell plans[10]
- Volunteer-based, so availability may depend on local counselors[5][8]
- Focused exclusively on Medicare/health insurance counseling, not direct healthcare or financial aid[2][3]
- Must select option 4 on helpline for SHIP[7][8]
- Supports low-income applications (e.g., QMB up to ~$1,478/month single, SLMB/QI higher) but SHIP itself has no limits[4]

**Data shape:** no income/asset test; volunteer counseling network statewide with local variation in access points; services are advisory/enrollment assistance only, not direct benefits

**Source:** https://aging.georgia.gov/georgia-ship and https://ship.georgia.gov[8][9][10]

---

### Home-Delivered Meals


**Eligibility:**
- Age: 60+
- Income: No specific income limits or dollar amounts stated; priority given to those in greatest social and economic need.[1]
- Assets: No asset limits mentioned in program guidelines.[1]
- Aged 60 and over, or spouse (regardless of age) of a person aged 60+.
- Persons with disabilities residing in housing facilities primarily for older adults where congregate nutrition services are provided.
- Homebound with functional impairments preventing shopping or meal preparation (e.g., high functional impairment on DON-R instrument).[1][4]
- Moderate to high nutrition risk (NSI), high functional impairment (DON-R for home-delivered only), or food insecurity.[1]
- Priority for greatest social/economic need, nutrition risk, functional impairment, and food security status.[1]

**Benefits:** Nutritious meals delivered to residence, providing at least 1/3 of Reference Daily Intakes per meal, following USDA Dietary Guidelines; typically 5 meals per week (M-F); includes nutrition education, social check-in; no charge, voluntary contributions accepted; alternative meals (shelf-stable, frozen, etc.) allowed if meeting nutrient targets; meals may extend to spouse/caregiver or household dependents to support home maintenance.[1][5][8]
- Varies by: priority_tier

**How to apply:**
- Contact Georgia Aging and Disability Resource Connection (ADRC) or local Area Agency on Aging (AAA); call Eldercare Locator at 1-800-677-1116 or visit Eldercare.acl.gov to find local AAA.[5][7]
- Over-the-phone assessment for need and diet (e.g., Fulton County via provider).[8]
- Contact case manager if on Medicaid, Medicare Advantage, or Community Care Services Program.[3][4][7]
- Regional providers (e.g., Open Hand Atlanta in Fulton County, Mom's Meals, GA Foods via plans).[3][7][8]

**Timeline:** Not specified in sources.
**Waitlist:** After 20 consecutive meals, reassessment required; may place on waiting list if needed.[1]

**Watch out for:**
- Not automatic; requires assessment showing homebound status, nutrition risk, functional impairment; priority-based, not all qualify immediately.[1]
- After 20 consecutive meals, reassessment and possible waitlist/referral.[1]
- Meals typically M-F only, number varies; voluntary contributions expected despite 'no charge'.[5]
- Separate from SNAP or Medicaid waivers; contact AAA/case manager, not direct state application.[5][7]
- Spouse/non-elderly household meals conditional on supporting eligible elder.[1]

**Data shape:** Administered via 12 regional AAAs with local providers; priority tiers based on need/risk scores (NSI, DON-R); no fixed income/asset tests; reassessment after 20 meals triggers waitlist.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://pamms.dhs.ga.gov/das/hcbs-5300-manual/304/

---

### Caregiver Programs (Out-of-Home Respite Care)


**Eligibility:**
- Income: Varies by program; no statewide uniform limits specified. Family Support Funds consider income, family size, and care level. Some programs like DFCS Respite for Medically Fragile Adoptive Children have no explicit dollar amounts but target adoption assistance recipients. Private or assessed programs use burden/stress index and income evaluation without fixed tables.
- Assets: Not applicable or not specified in available sources.
- Enrollment in Georgia Medicaid HCBS waivers: Comprehensive Supports Waiver (COMP), New Options Waiver (NOW), or Elderly and Disabled Waiver Program (EDWP) for aging populations.
- Care recipient must have disabilities, chronic illnesses, age-related conditions, or be medically fragile (e.g., adoptive children in DFCS program).
- Primary caregiver needs temporary relief; for DFCS, child must receive adoption assistance, be deemed medically fragile by licensed provider, placed via DFCS custody.
- Some programs assess caregiver stress/burden index for priority.

**Benefits:** Out-of-home respite in licensed facility, community setting, or provider's home (where permitted); includes daytime/overnight supervision, personal care, assistance with ADLs (bathing, dressing, grooming, toileting); emergency or scheduled respite. DFCS program: up to 5 hours/month at $6/hour for first child, $2/hour for siblings. Other programs: 4-hour blocks, up to 18 hours/week in specific cases (e.g., ALS).
- Varies by: priority_tier

**How to apply:**
- Phone: Georgia Center for Resources and Support for Adoptive & Foster Families at 1-866-272-7368 (DFCS program).
- Website: www.gacrs.org (DFCS program).
- Contact local waiver providers or Medicaid for HCBS waivers.
- Easterseals Southern Georgia: info@essga.org or 229-439-7061.

**Timeline:** DFCS: 1 year approval timeframe from approval date; other programs not specified.
**Waitlist:** Not specified; priority based on stress index in some programs.

**Watch out for:**
- Not a single unified program; primarily accessed via Medicaid HCBS waivers (COMP, NOW, EDWP) or targeted initiatives (e.g., DFCS for adoptive medically fragile children only until age 18).
- Out-of-home specifically requires licensed facilities/provider homes; not all respite is out-of-home.
- No fixed hours/dollars statewide; varies by waiver approval and provider.
- Elderly focus often under EDWP, but must meet waiver criteria; private pay or assessments common if not waiver-eligible.
- DFCS limited to specific adoptive custody cases.

**Data shape:** Decentralized via Medicaid waivers and targeted programs (e.g., adoptive children); no uniform income table or fixed benefits; provider-specific delivery with priority tiers by need/stress.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfcs.georgia.gov/respite-care

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are based on U.S. Department of Health and Human Services (HHS) Poverty Guidelines. For example, in 2025, 125% for a household of 1 is approximately $19,563; for 2 is $26,519; for 4 is $40,182 (consult current HHS guidelines for precise figures as they update yearly).
- Unemployed and seeking to re-enter the workforce
- Poor employment prospects
- Reside in a county served by a Georgia SCSEP provider (majority of 159 counties, but varies by provider)
- Priority given to veterans/qualified spouses, individuals over 65, those with disabilities, low literacy/limited English proficiency, rural residents, homeless/at risk, low employment prospects, or American Job Center non-successful users

**Benefits:** Part-time community service work (average 20 hours/week) at non-profits/public facilities (e.g., schools, hospitals, senior centers); paid highest of federal/state/local minimum wage (e.g., $7.25/hour noted in some areas); up to 1,300 hours/year; job training, resume-building experience, job placement assistance, skill development (computer/vocational), educational opportunities, annual physical exams, social service referrals.
- Varies by: region

**How to apply:**
- AARP Foundation (serves Cobb, DeKalb, Douglas, Fulton, Gwinnett counties): Call 1-855-850-2525 (Mon-Fri 9am-6pm ET) or visit in-person at 1718 Peachtree Street NW, Suite 991, Atlanta, GA 30309
- Legacy Link or other providers: Contact current providers directly (specific contacts not listed; use AARP locator at my.aarpfoundation.org/locator/scsep/ or call Georgia DOL/WorkSource Georgia)
- Area Agency on Aging (e.g., Northwest GA: (706) 549-4850 or kadams@accaging.org; specific counties like Catoosa, Chattooga, etc.: rhunton@accaging.org)
- Online: AARP Foundation locator (my.aarpfoundation.org/locator/scsep/); ACC Aging SCSEP Application (via accaging.org)
- Georgia DOL/WorkSource Georgia for job search assistance and provider referrals

**Waitlist:** Possible due to limited spots (e.g., 236 participants in SFY2020); varies by region/provider

**Watch out for:**
- Georgia DHS ended direct program July 1, 2025—must contact specific providers like AARP/Legacy Link, not state agencies
- Not available in all counties—check provider coverage via locator or call
- Limited enrollment (e.g., ~236 participants in 2020); waitlists common
- Income is total family household (125% FPL strict cutoff)
- Part-time training only (20 hrs/wk avg), not full-time job or cash assistance
- Priority tiers may delay non-priority applicants
- Must be unemployed and actively seeking unsubsidized work transition

**Data shape:** Provider-led post-2025 (no central state office); county-restricted by grantee; income fixed at 125% FPL (varies household size annually); priority enrollment tiers; limited total slots with regional waitlists

**Source:** https://aging.georgia.gov/programs-and-services/senior-community-service-employment-program-scsep (notes state no longer offers directly; refers to providers); https://www.dol.gov/agencies/eta/seniors (federal)

---

### Elderly Legal Assistance Program (ELAP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or means-testing; federal law prohibits income/asset tests for eligibility[1][5].
- Assets: No asset limits or means-testing; federal law prohibits asset tests for eligibility[5].
- Resident of Georgia[1][5]
- Civil legal issue (not criminal)[1]
- Legal problem in ELAP priority areas (e.g., public benefits like SNAP/Medicaid denial, income/Social Security issues, health care access, housing, consumer issues, elder abuse, debt collection, Medicare/Medicaid appeals, long-term care, advance directives, end-of-life issues, defense of guardianship)[1][2][5]
- Circumstances put life or well-being at risk (targeted to those in greatest social/economic need, LEP, rural, low-income minorities)[1][5]

**Benefits:** Free civil legal assistance including legal information, community education, brief advice, and direct case representation/advocacy by contracted law firms/attorneys in priority areas such as public benefits, health care access, housing, consumer fraud, Medicare/Medicaid appeals, Social Security, elder abuse, advance directives[1][2][5]. No specified dollar amounts or hours; services provided via phone, in-person at senior centers, or emergency basis as needed[3].
- Varies by: priority_tier

**How to apply:**
- Contact local ELAP law firm by county (full list at https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program)[1]
- Phone examples: Coastal region 1-888-220-8399[4]; River Valley AAA info 1-800-615-4379[3]; Atlanta (404) 657-5258[6]; Georgia Senior Legal Hotline (related brief service) (404) 389-9992[2][7]
- Aging and Disability Resource Connection for broader help: 866-552-4464 or https://aging.georgia.gov/adrc[1]
- In-person/quarterly at senior centers in some regions[3]

**Timeline:** Not specified for ELAP; Georgia Senior Legal Hotline callback within 2 business days[2].

**Watch out for:**
- Must contact specific county law firm directly; not all civil issues covered—only priority areas where well-being at risk[1]
- No criminal cases; not for fee-generating cases[1]
- Targeted to greatest need; may prioritize vulnerable (e.g., low-income, rural, LEP)[5]
- Separate from Georgia Senior Legal Hotline (brief advice/referrals only, not full representation)[2][7]
- Voluntary contributions encouraged but must not discourage access[5]

**Data shape:** No income/asset test (federally prohibited); county-based local providers via 12 Area Agencies on Aging; priority-based targeting; related but distinct brief-service hotline

**Source:** https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Community Care Services Program (CCSP) | benefit | state | deep |
| Home & Community-Based Services Program | benefit | state | deep |
| Georgia Medicare Savings Programs (QMB,  | benefit | federal | deep |
| Senior Supplemental Nutrition Assistance | benefit | federal | medium |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Georgia State Health Insurance Assistanc | resource | federal | simple |
| Home-Delivered Meals | benefit | state | deep |
| Caregiver Programs (Out-of-Home Respite  | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | medium |
| Elderly Legal Assistance Program (ELAP) | resource | state | simple |

**Types:** {"benefit":8,"resource":2,"employment":1}
**Scopes:** {"state":5,"federal":6}
**Complexity:** {"deep":7,"medium":2,"simple":2}

## Content Drafts

Generated 11 page drafts. Review in admin dashboard or `data/pipeline/GA/drafts.json`.

- **Community Care Services Program (CCSP)** (benefit) — 4 content sections, 6 FAQs
- **Home & Community-Based Services Program** (benefit) — 4 content sections, 6 FAQs
- **Georgia Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Senior Supplemental Nutrition Assistance Program (Senior SNAP)** (benefit) — 4 content sections, 6 FAQs
- **Low Income Home Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 5 content sections, 6 FAQs
- **Georgia State Health Insurance Assistance Program (Georgia SHIP)** (resource) — 1 content sections, 5 FAQs
- **Home-Delivered Meals** (benefit) — 3 content sections, 6 FAQs
- **Caregiver Programs (Out-of-Home Respite Care)** (benefit) — 5 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 4 content sections, 6 FAQs
- **Elderly Legal Assistance Program (ELAP)** (resource) — 2 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 8 programs
- **household_size**: 1 programs
- **not_applicable**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Community Care Services Program (CCSP)**: Medicaid waiver with NFLOC functional assessment; services capped at nursing facility cost average; prioritized by need; regional AAAs handle delivery; potential Medicaid post-enrollment
- **Home & Community-Based Services Program**: Medicaid waiver with NFLOC via in-person MDS-HC nurse assessment; priority to greatest need if funding limited; statewide but regional AAAs; caps create waitlists
- **Georgia Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB lowest, QI highest); all pay Part B premiums but QMB adds full cost-sharing; asset-tested with federal exemptions; QI capped by federal funding; scales minimally by household size via FPL add-ons.
- **Senior Supplemental Nutrition Assistance Program (Senior SNAP)**: Simplified process with minimal verification for fixed-income seniors; age threshold rising to 66 in 2026; no earned income permitted; ties directly to standard SNAP income/benefit rules but with exemptions and easier application
- **Low Income Home Energy Assistance Program (LIHEAP)**: Administered by county-specific Community Action Agencies with separate budgets and appointment systems; priority tiers for seniors (60+/65+) and homebound; income at 60% SMI (varies by household size, table not in sources); direct payments to vendors only.
- **Weatherization Assistance Program (WAP)**: County-specific local agencies handle intake/processing; uniform 200% FPL/SSI eligibility statewide but priority tiers and waitlists vary regionally; services audit-driven, not fixed dollar amounts.
- **Georgia State Health Insurance Assistance Program (Georgia SHIP)**: no income/asset test; volunteer counseling network statewide with local variation in access points; services are advisory/enrollment assistance only, not direct benefits
- **Home-Delivered Meals**: Administered via 12 regional AAAs with local providers; priority tiers based on need/risk scores (NSI, DON-R); no fixed income/asset tests; reassessment after 20 meals triggers waitlist.
- **Caregiver Programs (Out-of-Home Respite Care)**: Decentralized via Medicaid waivers and targeted programs (e.g., adoptive children); no uniform income table or fixed benefits; provider-specific delivery with priority tiers by need/stress.
- **Senior Community Service Employment Program (SCSEP)**: Provider-led post-2025 (no central state office); county-restricted by grantee; income fixed at 125% FPL (varies household size annually); priority enrollment tiers; limited total slots with regional waitlists
- **Elderly Legal Assistance Program (ELAP)**: No income/asset test (federally prohibited); county-based local providers via 12 Area Agencies on Aging; priority-based targeting; related but distinct brief-service hotline

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Georgia?
