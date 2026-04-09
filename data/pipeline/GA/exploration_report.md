# Georgia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 60s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 13 |
| New (not in our data) | 9 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 8 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Elderly and Disabled Waiver Program (EDWP)

- **income_limit**: Ours says `$2982` → Source says `$3,853` ([source](https://georgia.gov/apply-elderly-and-disabled-waiver-program))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Community-based services as alternative to nursing home: Personal Support Services/Extended (meal prep, bathing, light housekeeping); Consumer-Directed Personal Support (hire own worker after 6 months); Adult Day services; Home-delivered meals; Out-of-Home Respite Care (overnight in approved facility); other HCBS to support home/community living. No fixed dollar/hour amounts specified; based on care plan.[6][8]` ([source](https://georgia.gov/apply-elderly-and-disabled-waiver-program))
- **source_url**: Ours says `MISSING` → Source says `https://georgia.gov/apply-elderly-and-disabled-waiver-program`

### Supplemental Nutrition Assistance Program (SNAP) - Senior SNAP in Georgia

- **min_age**: Ours says `65` → Source says `66` ([source](https://dfcs.georgia.gov/services/snap/senior-snap))
- **income_limit**: Ours says `$1982` → Source says `$35` ([source](https://dfcs.georgia.gov/services/snap/senior-snap))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card benefits for purchasing eligible food (groceries, not hot/prepared foods). Amount calculated based on net income, household size, and deductions (e.g., medical over $35/month, shelter costs). Seniors often receive higher benefits due to deductions. Exact amount determined post-application.` ([source](https://dfcs.georgia.gov/services/snap/senior-snap))
- **source_url**: Ours says `MISSING` → Source says `https://dfcs.georgia.gov/services/snap/senior-snap`

### Low Income Home Energy Assistance Program (LIHEAP)

- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Financial assistance paid directly to energy suppliers. Minimum $350 and maximum $400 per eligible household for heating assistance. Seniors (60+) in the home receive the maximum $400. Maximum one heating and one cooling benefit per program year. Amount determined by federal funding[6].` ([source](https://dfcs.georgia.gov/regular-home-energy-assistance (Georgia DFCS Energy Assistance page)[5]))
- **source_url**: Ours says `MISSING` → Source says `https://dfcs.georgia.gov/regular-home-energy-assistance (Georgia DFCS Energy Assistance page)[5]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigates and resolves complaints; advocates for resident rights; provides information on long-term care; routine facility visits and monitoring; education for residents, families, staff, and communities; assistance with transfers/discharges, access to benefits; no charge for services[1][2][3][4][5]` ([source](https://aging.georgia.gov/programs-and-services/long-term-care-ombudsman-program or https://www.georgiaombudsman.org[3][2]))
- **source_url**: Ours says `MISSING` → Source says `https://aging.georgia.gov/programs-and-services/long-term-care-ombudsman-program or https://www.georgiaombudsman.org[3][2]`

## New Programs (Not in Our Data)

- **Medicaid Aged, Blind, and Disabled Program (ABD Medicaid)** — service ([source](https://medicaid.georgia.gov and https://dfcs.georgia.gov))
  - Shape notes: ABD Medicaid has 19 different coverage categories (classes of assistance) with varying benefits.[4] Basic healthcare coverage is an entitlement program, but long-term care services are need- and availability-based, creating a two-tier structure. Income and asset limits are uniform statewide for 2026. The program requires both categorical eligibility (age 65+, blind, or disabled) AND financial eligibility (income and asset limits) AND functional need (for long-term care). Search results lack specific 2026 income limits, current processing times, waitlist information, and detailed regional office locations.
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://dch.georgia.gov/programs/program-all-inclusive-care-elderly-pace-updates (Georgia Department of Community Health); https://www.cms.gov/medicare/medicaid-coordination/about/pace (Centers for Medicare & Medicaid Services); https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE (Medicare.gov)))
  - Shape notes: PACE is a highly localized program with significant geographic restrictions. Eligibility is largely standardized nationally (age 55+, nursing home level of care, ability to live safely in community, residency in service area), but availability varies dramatically by region. Georgia is actively expanding PACE as of April 2025, suggesting the program's footprint in the state is still developing. Income and asset limits follow federal Medicaid guidelines for most states, but Georgia-specific thresholds and alternative pathways were not found in available sources. Benefits are individualized by care plan rather than tiered, making them difficult to quantify in advance. The most critical first step for Georgia families is determining whether their county/area has a PACE program using Medicare's Find a PACE Plan tool.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)** — financial ([source](https://medicaid.georgia.gov/medicare-savings-plans-programs-faqs and https://pamms.dhs.ga.gov/dfcs/medicaid/[1][5]))
  - Shape notes: Tiered by income (QMB<SLMB<QI); federal FPL-based with Georgia DFCS administration; resource limit shared across programs; couple vs individual budgeting; QI capped funding.
- **Weatherization Assistance Program (WAP)** — service ([source](https://gefa.georgia.gov/weatherization-assistance-program))
  - Shape notes: Administered regionally by county-specific community action agencies with county contact list; income at 200% FPL or SSI; priority tiers; services determined by per-home energy audit.
- **Georgia State Health Insurance Assistance Program (Georgia SHIP)** — service ([source](https://aging.georgia.gov/georgia-ship))
  - Shape notes: no income test; counseling-only service with volunteer/local delivery model; prioritizes Medicare beneficiaries without barriers
- **Home Delivered Meals (via Community Care Services Program)** — service ([source](https://aging.georgia.gov/))
  - Shape notes: Bundled service within Medicaid CCSP waiver; eligibility tied to full NFLOC assessment and multiple criteria; no standalone meal program; local AAA administration with statewide standards but regional providers.
- **Caregiver Respite Services (via Georgia Medicaid Home and Community-Based Services)** — service ([source](aging.georgia.gov and Georgia Department of Behavioral Health and Developmental Disabilities (DBHDD)))
  - Shape notes: Respite care in Georgia is not a single unified program but a service available through multiple Medicaid waiver programs (COMP, NOW, EDWP) and non-Medicaid programs (Older Americans Act, State-Funded Alzheimer's Program). Eligibility, benefits, and application processes vary by which program the care recipient qualifies for. The service is strictly time-limited (28 days per six months) and requires prior functional assessment. Specific financial details (income limits, benefit amounts, processing times) are not provided in available search results, requiring families to contact regional offices directly for complete information.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://aging.georgia.gov/programs-and-services/senior-community-service-employment-program-scsep (notes state transition); https://www.dol.gov/agencies/eta/seniors (federal)))
  - Shape notes: Administered by multiple regional non-profit/state grantees post-2025 DHS exit; county-restricted availability; priority-based enrollment with waitlists; no fixed asset limits; income at 125% FPL scales by household size via federal table
- **Legal Assistance for Older Georgians** — service ([source](https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program))
  - Shape notes: No income or asset test required statewide per standards; county-specific providers and contacts; priority on cases threatening independence/well-being; Metro-Atlanta counties may have different access[1][3]

## Program Details

### Medicaid Aged, Blind, and Disabled Program (ABD Medicaid)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For 2026, the monthly income maximum for a single applicant is not explicitly stated in current search results, but 2012 data showed $698/month for an individual and $1,048/month for a couple. Search results indicate income limits exist but do not provide 2026 figures. Income is counted differently when only one spouse applies—both spouses' income counts toward the applicant spouse's income eligibility, with no Minimum Monthly Maintenance Needs Allowance for the non-applicant spouse.[1][6]
- Assets: For a single applicant in 2026, the asset limit is $2,000 in countable assets.[1] Search results do not specify which assets are exempt or how assets are counted for couples.
- Must be aged 65 or older, legally blind, or totally disabled[1][4]
- Must be a Georgia resident[3]
- Must be a U.S. citizen, national, legal alien, or permanent resident[3]
- Must have a valid Social Security Number[7]
- For long-term care services, must have functional need demonstrated through assessment of Activities of Daily Living (mobility, bathing, dressing, eating, toileting) and Instrumental Activities of Daily Living (shopping, cooking, cleaning, taking medications)[1]
- For nursing home care specifically, must require Nursing Facility Level of Care (NFLOC)[6]

**Benefits:** Basic healthcare coverage includes physician visits, prescription medication, emergency room visits, and short-term hospital stays.[1] Long-term care benefits include institutionalized care (nursing home, hospice, hospital stays of 30+ days), community care services, Mental Retardation Waiver program, and community-based services provided at home or adult daycare.[4] Long-term care benefits are provided based on need and availability, not as an entitlement.[1] Personal Needs Allowance of $70/month is provided to beneficiaries.[6]
- Varies by: priority_tier

**How to apply:**
- Online: Georgia Gateway member services website[5]
- In-person: Local Medicaid office (assistance available if applicant has difficulty completing application)[4]
- Phone: Contact local county health department (specific phone numbers not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Long-term care benefits are provided based on need and availability; specific waitlist information not provided in search results

**Watch out for:**
- Long-term care benefits are NOT an entitlement—they are provided based on need and availability, unlike basic healthcare coverage which is guaranteed to eligible applicants.[1]
- Income and asset limits are strict: $2,000 asset limit for singles in 2026 is very low.[1]
- If only one spouse applies, BOTH spouses' income counts toward eligibility, which can disqualify applicants with higher-earning spouses.[6]
- For long-term care, applicants must demonstrate functional need through Activities of Daily Living assessment—simply being 65+ is not sufficient.[1]
- ABD Medicaid should not be confused with regular Medicaid for all ages; it is specifically for aged, blind, or disabled populations.[1]
- There is an alternative pathway—the Aged, Blind and Disabled Medically Needy Program—for those over income limits; excess income can be applied toward medical expenses (spend-down program).[3][6]
- Form 71 for disability verification is no longer used as of September 2013; applicants must use SSA Form 831 instead.[2]
- Search results do not provide 2026 income limits; families should verify current limits directly with Georgia Medicaid as limits may have changed since 2012 data in results.

**Data shape:** ABD Medicaid has 19 different coverage categories (classes of assistance) with varying benefits.[4] Basic healthcare coverage is an entitlement program, but long-term care services are need- and availability-based, creating a two-tier structure. Income and asset limits are uniform statewide for 2026. The program requires both categorical eligibility (age 65+, blind, or disabled) AND financial eligibility (income and asset limits) AND functional need (for long-term care). Search results lack specific 2026 income limits, current processing times, waitlist information, and detailed regional office locations.

**Source:** https://medicaid.georgia.gov and https://dfcs.georgia.gov

---

### Elderly and Disabled Waiver Program (EDWP)


**Eligibility:**
- Income: Must be eligible for Medicaid, which may require a Qualified Income Trust (QIT) if income exceeds the Medicaid CAP (exact current CAP not specified in sources; limits adjust annually with SSA/SSI increases). For married applicants, up to $3,853.50/month income may be diverted to a community spouse.[5][1]
- Assets: Single: $2,000 countable assets. Married couple both applying: $3,000 combined. One spouse applying: $2,000 for applicant; non-applicant spouse up to $157,920 (or $157,986 in some sources) Community Spouse Resource Allowance. Exempt: primary home (with equity/residency rules), one vehicle, personal belongings, irrevocable burial trusts. 5-year look-back period applies; excess assets must transfer to community spouse within one year of eligibility.[1][5]
- Medicaid eligible (or become eligible during application)
- Nursing home level of care (intermediate NFLOC) confirmed by medical evaluation, physician approval for care plan, and tools like DON-R or MDS-HC
- Physically impaired in ADLs/IADLs (e.g., bathing, eating, mobility, meal prep); cognitive issues like Alzheimer's qualify as physical
- Georgia resident, U.S. citizen/eligible immigrant
- Choose community/home services over nursing home
- Enrolled in only one Medicaid waiver program
- Functional impairment with unmet care needs; some sources note 21+ or 65+ (or disabled under 65), but no strict age minimum[1][2][3][5][7]

**Benefits:** Community-based services as alternative to nursing home: Personal Support Services/Extended (meal prep, bathing, light housekeeping); Consumer-Directed Personal Support (hire own worker after 6 months); Adult Day services; Home-delivered meals; Out-of-Home Respite Care (overnight in approved facility); other HCBS to support home/community living. No fixed dollar/hour amounts specified; based on care plan.[6][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Toll-free statewide Area Agency on Aging at 866-552-4464 (initial screening for eligibility/priority/waitlist)
- Through local Area Agencies on Aging (administered by Georgia Division of Aging Services)
- Medicaid application process (accept application, interview, verify via Elderly and Disabled Waiver Communicator/CCC)[2][3]

**Timeline:** Not specified
**Waitlist:** Yes; placement based on screening for urgency of need/priority[2]

**Watch out for:**
- Must choose EDWP over nursing home; only one waiver program at a time
- 5-year look-back for asset transfers; penalties for improper transfers
- Spousal assets/income rules complex; excess must transfer within 1 year
- Medicaid eligibility required (QIT for high income); not automatic
- Priority/waitlist based on screening urgency; not first-come
- Physical impairment required (dementia qualifies, but NFLOC assessment needed; not all cases approve)
- Assets treated as jointly owned for married couples regardless of title[1][2][3][5]

**Data shape:** Tied to Medicaid with NFLOC; priority-based waitlist via AAAs; spousal protections with asset transfer rules; no fixed age but functional/physical criteria; benefits via care plan not fixed amounts

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://georgia.gov/apply-elderly-and-disabled-waiver-program

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: For Medicaid-funded PACE in most states (2025): income under 300% of Federal Benefit Rate ($2,901/month). However, Medicaid offers multiple pathways to eligibility beyond this threshold, and Medicaid Planning Professionals can assist in meeting requirements. Not all PACE participants require Medicaid enrollment; some qualify through Medicare alone.[3] Georgia-specific income limits were not found in available sources.
- Assets: For Medicaid-funded PACE: assets valued at $2,000 or less (excluding primary home). This applies to most states; Georgia-specific limits not specified in available sources.[3]
- Must need nursing home level of care as defined by their state[1][2][6]
- Must be able to live safely in their home or community with PACE support[1][2][6]
- Must live in a PACE service area[1][2][6]
- For Medicare eligibility: must be U.S. citizen or legal resident of the state for 5 years prior to application, AND be at least 65 years old OR disabled OR have Lou Gehrig's disease (ALS) OR have end-stage renal disease[3]
- Medicaid or Medicare enrollment is not required to apply for PACE[1][3]

**Benefits:** Comprehensive medical and social services including: primary care doctor visits, nursing services, medications, therapies (physical, occupational, speech), in-home nursing services, durable medical equipment, social work services, caregiver support, and nursing home stays when necessary. 95% of PACE participants live in the community rather than nursing homes.[2][5][8]
- Varies by: Individual care plan developed by interdisciplinary team; not fixed by tier or priority level

**How to apply:**
- Online: Use Medicare's Find a PACE Plan tool at Medicare.gov to locate Georgia PACE programs and initiate contact[1]
- Phone: Contact the specific PACE organization serving your area (identified through Medicare's Find a PACE Plan tool)
- In-person: Visit a PACE center in your service area
- Mail: Contact information available through PACE organizations

**Timeline:** Not specified in available sources
**Waitlist:** PACE is not necessarily tied to state Medicaid waiver waitlists, so it may provide an alternative when HCBS Medicaid Waiver waitlists exist.[3] Specific Georgia waitlist status not found in available sources.

**Watch out for:**
- Geographic availability is the primary barrier: PACE is only available in certain areas, and you must live within a PACE service area to qualify. This is non-negotiable.[1][2][6]
- The 'nursing home level of care' requirement is state-defined and varies by state. Georgia's specific definition was not found in available sources; contact Georgia DCH or your local PACE organization for clarification.[2][3]
- You do NOT need to be enrolled in Medicare or Medicaid to apply for PACE, but most participants are dually eligible. This is a common misconception that may prevent eligible individuals from applying.[1][3][5]
- PACE is expanding in Georgia: as of April 2025, Georgia DCH was actively soliciting proposals for new PACE programs in Special Health Focus Service Areas (RFP deadline May 16, 2025). This means availability may change; check current status before assuming your area is or isn't served.[4][7]
- Income and asset limits for Medicaid-funded PACE are not absolute barriers. Multiple pathways to Medicaid eligibility exist beyond the standard thresholds, and Medicaid Planning Professionals can help.[3]
- PACE is an alternative to nursing home placement, not a supplement to it. The program is designed for people who would otherwise require nursing home care but can safely remain in the community with support.[2][6]
- Georgia-specific details (exact income limits, asset limits, processing times, required documents, regional provider lists) are not available in these sources. Direct contact with Georgia DCH or local PACE organizations is necessary for complete information.

**Data shape:** PACE is a highly localized program with significant geographic restrictions. Eligibility is largely standardized nationally (age 55+, nursing home level of care, ability to live safely in community, residency in service area), but availability varies dramatically by region. Georgia is actively expanding PACE as of April 2025, suggesting the program's footprint in the state is still developing. Income and asset limits follow federal Medicaid guidelines for most states, but Georgia-specific thresholds and alternative pathways were not found in available sources. Benefits are individualized by care plan rather than tiered, making them difficult to quantify in advance. The most critical first step for Georgia families is determining whether their county/area has a PACE program using Medicare's Find a PACE Plan tool.

**Source:** https://dch.georgia.gov/programs/program-all-inclusive-care-elderly-pace-updates (Georgia Department of Community Health); https://www.cms.gov/medicare/medicaid-coordination/about/pace (Centers for Medicare & Medicaid Services); https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE (Medicare.gov)

---

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Income limits are monthly, based on 100% FPL for QMB, 120% for SLMB, and 135% for QI, updated annually around April. Georgia follows federal standards with figures varying slightly by source/year (e.g., 2024/2026 estimates): QMB ≤$1,235 single/$1,663 couple; SLMB >QMB up to $1,478 single/$1,992 couple; QI >SLMB up to $1,660 single/$2,239 couple. Exact current limits confirmed via Georgia DHS or SSA FPL tables; COLAs disregarded until new limit effective. Household size considered (individual or couple); larger households use couple limits if applicable. First $20 unearned/$65+half earned income disregarded; ISM not counted.[1][2][3][6]
- Assets: Countable resources ≤ current QMB/SLMB/QI limit (federal ~$9,660 individual/$14,470 couple in 2024 examples; Georgia matches). Counts: bank accounts, stocks (after disregards). Exempt: home, one car, burial plots, $1,500 burial funds, personal belongings, Native American trust payments, student aid. No state-specific exemptions noted beyond federal.[1][3][6]
- Eligible for Medicare Part A (even if not enrolled; SSA verifies).
- Georgia resident.
- U.S. citizen or qualified immigrant.
- Not eligible for SSI if resources exceed (but QMB possible).
- For couples: test individually for income if couple ineligible.[1][4][5][6]

**Benefits:** QMB: Part A premium (if owed), Part B premium, deductibles, 20% coinsurance/copayments for Medicare-covered services. SLMB: Part B premium only. QI: Part B premium only (higher income than SLMB).[1][2][4][5]
- Varies by: priority_tier

**How to apply:**
- Online: https://pamms.dhs.ga.gov/dfcs/medicaid/[1][6]
- Phone: Local DFCS office or Georgia Medicaid (404-657-2708 or 1-877-423-4746 via medicaid.georgia.gov).
- Mail/In-person: Local DFCS county office (find via https://dfcs.georgia.gov/locations).
- Request form from state Medicaid agency.[4]

**Timeline:** QMB: First day of month after disposition (≤45 days). SLMB/QI: Up to 3 months retroactive.[1][4][6]
**Waitlist:** QI may have funding limits/priority (QI-1 no wait; QI-2 potential waitlist if funds exhausted; not specified for Georgia currently).[1]

**Watch out for:**
- QI funding limited—apply early; may be waitlisted if exceeds QI-1.
- Income limits change April; COLAs ignored until then—reapply if close.
- QMB doesn't auto-enroll Part B; SSA handles separately.
- Providers can't bill QMB enrollees for Medicare-covered services (key protection).
- Assets include couple's jointly; test individual income if couple over.
- Even over limits, apply—disregards may qualify.[1][2][3][4][6]

**Data shape:** Tiered by income (QMB<SLMB<QI); federal FPL-based with Georgia DFCS administration; resource limit shared across programs; couple vs individual budgeting; QI capped funding.

**Source:** https://medicaid.georgia.gov/medicare-savings-plans-programs-faqs and https://pamms.dhs.ga.gov/dfcs/medicaid/[1][5]

---

### Supplemental Nutrition Assistance Program (SNAP) - Senior SNAP in Georgia


**Eligibility:**
- Age: 66+
- Income: Households with all members age 66+ (effective February 2, 2026; previously 60+) must meet standard SNAP net income limits for elderly/disabled households (only net income test applies, no gross income test). Seniors/disabled qualify for medical deductions over $35/month. Gross income limits for elderly/disabled: up to 165% of poverty line (e.g., ~$2,909/month for household of 2). 2025 examples: $15,060/year ($1,255/month) for 1 person; $20,440/year ($1,703/month) for 2 people. Exact limits vary annually by household size and are checked via Georgia Gateway screening tool. No earned income allowed; only fixed income like SSI, SSDI, Social Security, pensions, VA benefits.
- Assets: Standard SNAP resource limits apply (not waived for seniors in Georgia). Resources up to $2,750 for most households or $4,250 if elderly/disabled (exempt: primary home, most retirement accounts, household goods, personal vehicles, life insurance). Exact details verified during application.
- All household members must be 66+ (effective Feb 2, 2026) and purchase/prepare food together.
- No earned income (countable or excluded).
- Fixed income only (e.g., Social Security, SSI, pensions, VA, Railroad Retirement).
- Georgia resident.
- U.S. citizen or qualified non-citizen.
- Verification of identity, citizenship, residency, shelter/medical expenses, and unverified income.

**Benefits:** Monthly EBT card benefits for purchasing eligible food (groceries, not hot/prepared foods). Amount calculated based on net income, household size, and deductions (e.g., medical over $35/month, shelter costs). Seniors often receive higher benefits due to deductions. Exact amount determined post-application.
- Varies by: household_size

**How to apply:**
- Online: Georgia Gateway at https://gateway.ga.gov (recommended; includes Senior SNAP screening).
- Email application request: seniorsnap@dhr.state.ga.us.
- Phone: (404) 370-6236 to request mailed application.
- Mail: Send completed application to local DFCS office (address varies by county; find via dfcs.georgia.gov).
- In-person: Local Division of Family & Children Services (DFCS) offices statewide.

**Timeline:** Typically 30 days for standard SNAP; expedited (7 days) if very low income/no income. Senior SNAP simplifies process but follows standard timelines.

**Watch out for:**
- Age requirement changes to 66+ effective February 2, 2026 (was 60+ prior).
- No earned income allowed (even excluded types); only fixed unearned income.
- All household members must be elderly and food-share; mixed households cascade to regular SNAP.
- Medical deductions over $35/month can significantly boost benefits but require proof.
- Seniors skip gross income test but must meet net income limit.
- Assets counted unless exempt; home ownership doesn't auto-disqualify.
- Automatic conversion between Senior/regular SNAP at recertification if criteria change.

**Data shape:** Simplified elderly-only application with no earned income, fixed income only, and medical/shelter deductions; age threshold rising to 66 in 2026; statewide but local DFCS processing; benefits scale by household size and net income after elderly-specific deductions.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfcs.georgia.gov/services/snap/senior-snap

---

### Low Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Total gross household income at or below 60% of Georgia's State Median Income (SMI), which varies by household size. Specific dollar amounts not listed in sources; check current SMI guidelines via local agency. Seniors (60+ or 65+) receive priority but no age requirement for general eligibility[1][2][5][6].
- Assets: No asset limits mentioned in sources.
- Responsibility for paying the cost of energy for the primary home heating source (sometimes cooling)[1][2][5][6].
- U.S. citizen or lawfully admitted immigrant[1][2][5][6].
- Household energy supplier must be a registered LIHEAP vendor with Georgia Department of Human Services[1].

**Benefits:** Financial assistance paid directly to energy suppliers. Minimum $350 and maximum $400 per eligible household for heating assistance. Seniors (60+) in the home receive the maximum $400. Maximum one heating and one cooling benefit per program year. Amount determined by federal funding[6].
- Varies by: priority_tier

**How to apply:**
- Online appointment scheduling via local Community Action Agency portals (e.g., https://www.cafi-ga.org for some counties; varies by agency)[1][2].
- Phone: Call local agency publicized number to schedule appointment or join waitlist (specific numbers vary by county/provider)[2][4].
- In-person: At scheduled appointments with local Community Action Agencies (CAAs) after booking; must select county of residence[1][3][4].
- Mail or home visits: Not specified as primary; applications taken in homes for homebound[6].

**Timeline:** First-come, first-served basis until funds exhausted; no specific timeline given, but appointments required[1][2][4][5].
**Waitlist:** Yes, if appointment slots full; check portal periodically for openings or call to be placed on waitlist. County-specific budgets[1][4].

**Watch out for:**
- Energy supplier must be registered LIHEAP vendor, or ineligible[1].
- Appointments required; first-come, first-served, funds limited—slots fill quickly, especially pre-senior priority[1][2][4].
- Must apply in exact county of residence—no switching for availability[1].
- Priority for seniors 65+ (heating opens Jan 2, 2026), homebound, life-threatening cases (Nov start); general public later (Dec/Feb)[1][2][5].
- Bring copies of all documents; zero-income verification needed if applicable[1][3].
- Cooling assistance seasonal/sometimes available, separate from heating[2][4][6].

**Data shape:** Administered via county-specific Community Action Agencies with varying portals/phone lines; priority tiers for seniors/homebound; fixed min/max benefit with senior max; 60% SMI income test; county-residence restricted with separate budgets.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dfcs.georgia.gov/regular-home-energy-assistance (Georgia DFCS Energy Assistance page)[5]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of the Federal Poverty Level (FPL). Alternative qualification: receipt of Supplemental Security Income (SSI). Exact dollar amounts vary annually with FPL updates and by household size; no specific table provided in sources for current year. Priority given to elderly, households with disabilities, and families with children.[1][2][3][7]
- Assets: No asset limits mentioned in sources.
- Eligible home types: single-family homes, manufactured homes, appropriate multi-family units. Campers and non-stationary trailers ineligible.[1][3]
- Homeowners and renters eligible; renters require landlord agreement.[1]
- Must reside in a county served by a local agency.

**Benefits:** No-cost home energy efficiency improvements based on energy audit results, including: air and duct sealing, wall/floor/attic insulation, heating/ventilation/air conditioning improvements, energy-efficient lighting, hot water tank/pipe insulation, water conservation devices. Does not cover pre-existing structural issues like roofing, walls, flooring holes, underpinning, or ceiling replacement.[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact local community action agency by county (full list at https://gefa.georgia.gov/weatherization-assistance-program).[4]
- Examples: CSRA EOA (706-945-1616, www.csraeoa.org); Action Pact for Savannah/Chatham; Middle Georgia Community Action Agency.[1][3][8]
- Download application from agency website or call office; in-person audits follow qualification.

**Timeline:** Not specified; involves energy audit after qualification, then installation by contractors.
**Waitlist:** Due to high demand, there may be a waiting list.[4]

**Watch out for:**
- Renters need landlord agreement.[1]
- Excludes pre-existing structural repairs (e.g., roofs, walls, major flooring).[3]
- Priority for elderly/disabled/families with children may create longer waits for others.[1][2]
- High demand leads to waitlists.[4]
- Must contact specific county agency; not centralized statewide application.

**Data shape:** Administered regionally by county-specific community action agencies with county contact list; income at 200% FPL or SSI; priority tiers; services determined by per-home energy audit.

**Source:** https://gefa.georgia.gov/weatherization-assistance-program

---

### Georgia State Health Insurance Assistance Program (Georgia SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[2][3][8]
- Assets: No asset limits or tests apply; no specification of what counts or is exempt[2][3]
- Must be a Medicare beneficiary or caregiver/family member of one
- Georgia resident (implied for state program access)
- Services focus on Medicare-related issues, but no incarceration or citizenship requirements specified for SHIP itself[1][2]

**Benefits:** Free, unbiased one-on-one counseling and assistance on Medicare (Parts A, B, C, D), Medigap, Medicaid, prescription drug programs, long-term care insurance, claims/billing resolution, appeals, fraud reporting via SMP, enrollment in plans and financial assistance programs (e.g., Medicare Savings Programs like QMB/SLMB/QI, Extra Help), information/referrals, public education presentations, and outreach events; no fixed dollar amounts or hours, provided via phone, face-to-face, or community sessions[2][3][5][6][8][10]

**How to apply:**
- Phone: 1-866-552-4464 (select Option 4)[7][8]
- Website: https://aging.georgia.gov/georgia-ship[7][8][10]
- Local in-person or email via regional providers (e.g., 706-549-4850 or lplatter@accaging.org for ACCA area)[5]
- Request counseling sessions, presentations, or referrals directly; no formal application form required for counseling

**Timeline:** Immediate assistance available via phone or sessions; no specified processing timeline as it's counseling-based, not enrollment with approval wait[2][8]

**Watch out for:**
- Not a healthcare or financial aid program itself—provides counseling only, does not pay bills or provide direct services; not affiliated with insurance companies and does not sell plans[8][10]
- People may confuse with direct enrollment programs; must be Medicare-related issue[2]
- Volunteer-based, so availability may depend on local counselor schedules[5][9]
- Assists with low-income programs like SLMB/QI but has no eligibility test itself[3][4][6]

**Data shape:** no income test; counseling-only service with volunteer/local delivery model; prioritizes Medicare beneficiaries without barriers

**Source:** https://aging.georgia.gov/georgia-ship

---

### Home Delivered Meals (via Community Care Services Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Medicaid eligibility required. Monthly gross income limit of $2,349 for single applicants. For married applicants with both applying, limit remains $2,349 per spouse. Non-applicant spouse can receive up to $3,216/month from applicant's income. Income over limit can be managed via special income trust or monthly contributions.[3]
- Assets: Medicaid countable asset limits apply (specific amounts not stated in sources). Home equity exempt if applicant lives there or intends to return (up to $752,000 equity interest in 2026), spouse lives there, or dependent relative lives there (child, grandchild, in-law, parent, sibling, etc.). Home may be subject to estate recovery post-benefits.[1]
- Functional impairment due to physical limitations (Alzheimer’s and dementia qualify as physical conditions).[1][2][4][7]
- Require Nursing Facility Level of Care (NFLOC), assessed via Determination of Need Functional Assessment-Revised (DON-R) and Minimum Data Set Home Care (MDS-HC) by a nurse. Involves ADLs/IADLs like mobility, eating, toileting, meal prep, money management.[1]
- Physician approval/certification of NFLOC and care plan.[2][3][4][6][7]
- Unmet need for care; health/safety needs met by CCSP (not Medicare home health or hospice).[4]
- Home Delivered Meals not the only service needed; must receive at least one other CCSP service.[4][6]
- Home environment free of illegal behavior/threats.[4]
- Agree to receive personal services in home; not required to be homebound.[2][4]
- Medicaid eligible or potentially eligible (apply at county DFCS).[4][6][7]
- Choose community over institutional care; one waiver program at a time.[4][7]

**Benefits:** Nutritionally balanced home-delivered meals. Provided as part of CCSP waiver; must receive alongside at least one other CCSP service (e.g., personal support, skilled nursing, therapy). No specific dollar amount, meal count, or hours per week stated; priority to those most in need.[4][6][7]
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) for assessment (toll-free statewide number not specified; locate via aging.georgia.gov).[7]
- Apply for Medicaid at county Department of Family and Children Services (DFCS).[4]
- Referral or self-application via AAA.[6]

**Timeline:** Not specified in sources.
**Waitlist:** Priority given to those most in need; services dependent on availability and continued eligibility.[6]

**Watch out for:**
- Home Delivered Meals requires at least one other CCSP service; not standalone.[4][6]
- Must be Medicaid eligible (or potentially); income over $2,349/month needs trust or contributions.[3]
- Home equity limit $752,000 (2026); potential estate recovery.[1]
- Priority to most needy; waitlists possible.[6]
- Not for homebound only; functional impairment via specific assessments required.[1][4]
- Cannot combine with Medicare home health or hospice.[4]
- One waiver program at a time.[4][7]

**Data shape:** Bundled service within Medicaid CCSP waiver; eligibility tied to full NFLOC assessment and multiple criteria; no standalone meal program; local AAA administration with statewide standards but regional providers.

**Source:** https://aging.georgia.gov/

---

### Caregiver Respite Services (via Georgia Medicaid Home and Community-Based Services)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Varies by program: 60+ for Older Americans Act programs; 18+ for Comprehensive Supports Waiver Program (COMP) and New Options Waiver Program (NOW); medically fragile children for facility-based respite[1][5][6]+
- Income: Not explicitly stated in search results. Respite care is authorized under Georgia Medicaid HCBS waivers, which typically require Medicaid enrollment or waiver program participation[5]. For Medicaid eligibility generally, applicants must meet Georgia Medicaid's financial criteria, but specific dollar amounts are not provided in available sources[1]
- Assets: For CCSP (Community Care Services Program), home equity interest cannot exceed $752,000 as of 2026[2]. Other asset limits for respite-specific programs are not detailed in search results
- Care recipient must have a documented disability, chronic illness, age-related condition, or special health care need[5][8]
- Care recipient must require assistance with Activities of Daily Living (ADLs) or Instrumental Activities of Daily Living (IADLs)[1][2]
- Care recipient must be capable of living safely in a family home with appropriate supports[1]
- Caregiver must be an adult relative or friend providing informal but regular care[4]
- Must be enrolled in Georgia Medicaid or a Medicaid Waiver program (COMP, NOW, EDWP)[1][5]
- Functional assessment required to determine nursing facility level of care need[2]

**Benefits:** Short-term, temporary care and supervision; limited to no more than 14 consecutive days and no more than 28 days total within any six-month period[6]. Specific hourly rates or dollar amounts not provided in search results
- Varies by: program_type_and_waiver

**How to apply:**
- Contact regional DBHDD (Department of Behavioral Health and Developmental Disabilities) office to begin application process[1]
- Georgia Department of Human Services Division of Aging Services (aging.georgia.gov) for information and assistance[7]
- Individual program providers (e.g., Sally Panfel In-Home Care and Respite Program)[10]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Respite care is strictly time-limited: maximum 14 consecutive days and 28 days total per six-month period[6]. This is not ongoing care but temporary relief only
- Medicaid enrollment or waiver program participation is required; respite care is not a standalone program but a service within larger waiver programs[5]
- Functional assessment by a nurse (MDS-HC) is required in-person; this is not a simple application[2]
- Search results do not provide specific dollar amounts, hourly rates, or detailed benefit structures, making it difficult to compare value across providers
- Eligibility criteria vary significantly by program (COMP, NOW, EDWP, CCSP, Older Americans Act programs), and families must determine which program their loved one qualifies for first[1][5]
- For facility-based respite, the facility must meet DBHDD or DCH licensing requirements[5]
- Processing timelines and waitlist status are not documented in available sources, creating uncertainty for planning

**Data shape:** Respite care in Georgia is not a single unified program but a service available through multiple Medicaid waiver programs (COMP, NOW, EDWP) and non-Medicaid programs (Older Americans Act, State-Funded Alzheimer's Program). Eligibility, benefits, and application processes vary by which program the care recipient qualifies for. The service is strictly time-limited (28 days per six months) and requires prior functional assessment. Specific financial details (income limits, benefit amounts, processing times) are not provided in available search results, requiring families to contact regional offices directly for complete information.

**Source:** aging.georgia.gov and Georgia Department of Behavioral Health and Developmental Disabilities (DBHDD)

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income at or below 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are set by U.S. Department of Health and Human Services guidelines (not specified in current sources for 2026; check HHS poverty guidelines for latest table).
- Unemployed and seeking to re-enter the workforce
- Low employment prospects
- Priority for veterans and qualified spouses, individuals over 65, those with disabilities, low literacy or limited English proficiency, rural residents, homeless or at-risk, or those who failed to find employment via American Job Centers

**Benefits:** Part-time community service work (average 20 hours/week) at non-profit/public agencies (e.g., schools, hospitals, senior centers); paid highest of federal/state/local minimum wage (e.g., $7.25/hour noted in one source); on-the-job training; job placement assistance; up to 1300 hours annual service; co-enrollment for skills/education; annual physicals; social service referrals.
- Varies by: priority_tier

**How to apply:**
- Contact current providers: Legacy Link (details via provider search), AARP Foundation SCSEP (contact form or phone via aarp.org/aarp-foundation/our-work/income/scsep/)
- Regional: Northwest GA (ACCA/Keith Adams at (706) 549-4850 or kadams@accaging.org; Rachel Hunton for specific counties at rhunton@accaging.org)
- Northeast GA: Contact ACCA at (888) 808-8020
- Georgia Dept of Labor/WorkSource Georgia for job search referrals (no direct SCSEP apps)
- SCSEP Application (via regional providers like accaging.org)

**Waitlist:** Likely due to limited slots (e.g., 236 participants in SFY2020 statewide); varies by region/provider

**Watch out for:**
- Georgia DHS no longer administers directly as of July 1, 2025—must contact private/non-profit providers like Legacy Link/AARP
- Not available in all 159 counties; confirm county coverage with provider
- Limited slots (e.g., only 236 participants in 2020 statewide) lead to waitlists
- Income test is strict at 125% FPL; includes total family income
- Goal is transition to unsubsidized work—positions are temporary training (not permanent jobs)
- Priority tiers may exclude non-priority applicants even if eligible

**Data shape:** Administered by multiple regional non-profit/state grantees post-2025 DHS exit; county-restricted availability; priority-based enrollment with waitlists; no fixed asset limits; income at 125% FPL scales by household size via federal table

**Source:** https://aging.georgia.gov/programs-and-services/senior-community-service-employment-program-scsep (notes state transition); https://www.dol.gov/agencies/eta/seniors (federal)

---

### Legal Assistance for Older Georgians

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No statewide income limits set by ELAP; some providers like Georgia Legal Services Program (GLSP) use generally not more than 200% of federal poverty level, but ELAP standards require no income requirements[1][2][3]
- Assets: No asset limits mentioned or required[1][3]
- Live in Georgia
- Legal problem is civil (not criminal)
- Legal problem is one ELAP handles (e.g., abuse/neglect/exploitation, age discrimination, accessing health care, debt collection, housing, consumer fraud, Medicare fraud, advance directives, powers of attorney)
- Circumstances put life or well-being at risk or in danger[1]

**Benefits:** Free legal help including advice, brief services, representation by attorneys/paralegals/law firms in priority civil cases such as abuse/neglect/exploitation, age discrimination, accessing health care, debt collection, housing, consumer fraud, Medicare fraud, advance directives, durable powers of attorney[1][4][8]
- Varies by: priority_tier

**How to apply:**
- Contact local ELAP law firm by county (phone numbers listed by county on aging.georgia.gov/tools-resources/elderly-legal-assistance-program)
- Georgia Senior Legal Hotline: (404) 389-9992 (Mon-Thu 9am-2pm, phone advice/brief service/referrals)
- Aging and Disability Resource Connection: 866-552-4464 or aging.georgia.gov/adrc (if need more than legal help)
- Regional examples: Coastal area Georgia Legal Services 1-888-220-8399[1][4][8]
- Atlanta Legal Aid: (404) 389-9992, atlantalegalaid.org[7][8]

**Timeline:** Not specified

**Watch out for:**
- Must contact specific law firm for your county, not a central office
- Only civil non-criminal cases ELAP handles; problem must threaten life/well-being
- No income test statewide but some providers apply one
- Excludes certain Metro-Atlanta counties for some providers like GLSP
- If need non-legal help too, use ADRC instead of direct law firm[1][2]

**Data shape:** No income or asset test required statewide per standards; county-specific providers and contacts; priority on cases threatening independence/well-being; Metro-Atlanta counties may have different access[1][3]

**Source:** https://aging.georgia.gov/tools-resources/elderly-legal-assistance-program

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; available to all residents and anyone with concerns about long-term care facilities[2][3][4]
- Assets: No asset limits; no financial eligibility requirements[4]
- Resident of a long-term care facility in Georgia (nursing homes, personal care homes, assisted living, community living arrangements, or ICF/IDDs), or family/friend with a concern on their behalf. Requires resident permission for intervention[2][3]

**Benefits:** Investigates and resolves complaints; advocates for resident rights; provides information on long-term care; routine facility visits and monitoring; education for residents, families, staff, and communities; assistance with transfers/discharges, access to benefits; no charge for services[1][2][3][4][5]

**How to apply:**
- Phone: 1-866-552-4464 (select option 5); Website: https://www.georgiaombudsman.org (locate community ombudsman by county); Local offices (e.g., State Ombudsman: 888/454-5826, Sowega COA for south GA, ACCA at 706.549-4850 for east GA); Email state ombudsman: bakurtz@dhr.state.ga.us[2][3][4][5]

**Timeline:** Not specified; focuses on informal resolution, no formal processing timeline mentioned[2][3]

**Watch out for:**
- Not a healthcare or financial aid program—purely advocacy and complaint resolution; requires resident permission to intervene; families can contact on behalf of loved one but ombudsman prioritizes resident's wishes; not for pre-admission qualification—services for those already in facilities; people miss that it's free and confidential with no eligibility barriers[1][2][3][4][5]

**Data shape:** no income test; statewide advocacy via 13 regional community providers; resident permission required; free service focused on rights protection and complaint resolution in facilities, not admission or direct care

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://aging.georgia.gov/programs-and-services/long-term-care-ombudsman-program or https://www.georgiaombudsman.org[3][2]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid Aged, Blind, and Disabled Progr | benefit | state | deep |
| Elderly and Disabled Waiver Program (EDW | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Qualified Medicare Beneficiary (QMB), Sp | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Georgia State Health Insurance Assistanc | resource | federal | simple |
| Home Delivered Meals (via Community Care | benefit | state | deep |
| Caregiver Respite Services (via Georgia  | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Assistance for Older Georgians | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |

**Types:** {"benefit":9,"resource":3,"employment":1}
**Scopes:** {"state":5,"local":1,"federal":7}
**Complexity:** {"deep":10,"simple":3}

## Content Drafts

Generated 0 page drafts. Review in admin dashboard or `data/pipeline/GA/drafts.json`.


## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 8 programs
- **Individual care plan developed by interdisciplinary team; not fixed by tier or priority level**: 1 programs
- **household_size**: 1 programs
- **not_applicable**: 2 programs
- **program_type_and_waiver**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid Aged, Blind, and Disabled Program (ABD Medicaid)**: ABD Medicaid has 19 different coverage categories (classes of assistance) with varying benefits.[4] Basic healthcare coverage is an entitlement program, but long-term care services are need- and availability-based, creating a two-tier structure. Income and asset limits are uniform statewide for 2026. The program requires both categorical eligibility (age 65+, blind, or disabled) AND financial eligibility (income and asset limits) AND functional need (for long-term care). Search results lack specific 2026 income limits, current processing times, waitlist information, and detailed regional office locations.
- **Elderly and Disabled Waiver Program (EDWP)**: Tied to Medicaid with NFLOC; priority-based waitlist via AAAs; spousal protections with asset transfer rules; no fixed age but functional/physical criteria; benefits via care plan not fixed amounts
- **Program of All-Inclusive Care for the Elderly (PACE)**: PACE is a highly localized program with significant geographic restrictions. Eligibility is largely standardized nationally (age 55+, nursing home level of care, ability to live safely in community, residency in service area), but availability varies dramatically by region. Georgia is actively expanding PACE as of April 2025, suggesting the program's footprint in the state is still developing. Income and asset limits follow federal Medicaid guidelines for most states, but Georgia-specific thresholds and alternative pathways were not found in available sources. Benefits are individualized by care plan rather than tiered, making them difficult to quantify in advance. The most critical first step for Georgia families is determining whether their county/area has a PACE program using Medicare's Find a PACE Plan tool.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualifying Individual (QI)**: Tiered by income (QMB<SLMB<QI); federal FPL-based with Georgia DFCS administration; resource limit shared across programs; couple vs individual budgeting; QI capped funding.
- **Supplemental Nutrition Assistance Program (SNAP) - Senior SNAP in Georgia**: Simplified elderly-only application with no earned income, fixed income only, and medical/shelter deductions; age threshold rising to 66 in 2026; statewide but local DFCS processing; benefits scale by household size and net income after elderly-specific deductions.
- **Low Income Home Energy Assistance Program (LIHEAP)**: Administered via county-specific Community Action Agencies with varying portals/phone lines; priority tiers for seniors/homebound; fixed min/max benefit with senior max; 60% SMI income test; county-residence restricted with separate budgets.
- **Weatherization Assistance Program (WAP)**: Administered regionally by county-specific community action agencies with county contact list; income at 200% FPL or SSI; priority tiers; services determined by per-home energy audit.
- **Georgia State Health Insurance Assistance Program (Georgia SHIP)**: no income test; counseling-only service with volunteer/local delivery model; prioritizes Medicare beneficiaries without barriers
- **Home Delivered Meals (via Community Care Services Program)**: Bundled service within Medicaid CCSP waiver; eligibility tied to full NFLOC assessment and multiple criteria; no standalone meal program; local AAA administration with statewide standards but regional providers.
- **Caregiver Respite Services (via Georgia Medicaid Home and Community-Based Services)**: Respite care in Georgia is not a single unified program but a service available through multiple Medicaid waiver programs (COMP, NOW, EDWP) and non-Medicaid programs (Older Americans Act, State-Funded Alzheimer's Program). Eligibility, benefits, and application processes vary by which program the care recipient qualifies for. The service is strictly time-limited (28 days per six months) and requires prior functional assessment. Specific financial details (income limits, benefit amounts, processing times) are not provided in available search results, requiring families to contact regional offices directly for complete information.
- **Senior Community Service Employment Program (SCSEP)**: Administered by multiple regional non-profit/state grantees post-2025 DHS exit; county-restricted availability; priority-based enrollment with waitlists; no fixed asset limits; income at 125% FPL scales by household size via federal table
- **Legal Assistance for Older Georgians**: No income or asset test required statewide per standards; county-specific providers and contacts; priority on cases threatening independence/well-being; Metro-Atlanta counties may have different access[1][3]
- **Long-Term Care Ombudsman Program**: no income test; statewide advocacy via 13 regional community providers; resident permission required; free service focused on rights protection and complaint resolution in facilities, not admission or direct care

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Georgia?
