# Texas Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 1.7m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 17 |
| New (not in our data) | 12 |
| Data discrepancies | 4 |
| Fields our model can't capture | 5 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 5 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 5 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 11 programs
- **financial**: 4 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicare Savings Programs (QMB, SLMB, QI)

- **income_limit**: Ours says `$1,796` → Source says `$1,350` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/medicare-medicaid))
- **benefit_value**: Ours says `$2,000 – $8,000/year in 2026` → Source says `QMB: Pays Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copays for Medicare-covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only; auto-qualifies for Extra Help (prescription drugs, max $12.65 copay/drug in 2026). State Medicaid pays providers directly; no balance billing allowed under QMB.[1][4][6]` ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/medicare-medicaid))

### Weatherization Assistance Program (WAP)

- **benefit_value**: Ours says `$5,000 – $8,000 in free improvements` → Source says `Energy audit to identify inefficiencies; installation of weatherization measures including caulking, weather-stripping, ceiling/wall/floor insulation, patching building envelope holes, duct work, tune-up/repair/replacement of heating/cooling systems. Must meet energy-savings goals per DOE regulations (10 CFR Part 440). No specific dollar amounts or hours; services free to eligible households.` ([source](https://www.tdhca.texas.gov/weatherization-assistance-program))

### Meals on Wheels (via Area Agencies on Aging)

- **benefit_value**: Ours says `$1,500 – $3,600/year in 2026` → Source says `Home-delivered nutritious, often medically-tailored meals (typically 1 hot meal per weekday; optional frozen weekend meals in some areas). Includes safety check and brief social contact during delivery; case management for holistic needs assessment.[2][3][4]` ([source](https://www.mealsonwheelsamerica.org/find-meals-and-services/ (national locator for Texas locals); Texas Area Agencies on Aging via state aging services))

### Senior Community Service Employment Program (SCSEP)

- **benefit_value**: Ours says `$3,000 – $8,000/year in 2026` → Source says `Part-time paid work (average 20 hours/week) at nonprofits or public agencies (e.g., schools, hospitals, senior centers); wage is highest of federal, state, or local minimum wage; on-the-job training (e.g., computer, vocational skills); job placement assistance; support classes (reading, writing, math, resume workshops); bridge to unsubsidized jobs[1][2][3].` ([source](https://www.twc.texas.gov/programs/senior-community-service-employment))

## New Programs (Not in Our Data)

- **Texas Medicaid for Long-Term Care (Elderly and People with Disabilities)** — service ([source](Texas Health and Human Services Commission (HHSC) website; contact 877-541-7905 or 2-1-1))
  - Shape notes: Texas Medicaid long-term care is complex because: (1) Three distinct program types (Nursing Home, HCBS Waivers, MEPD) with different eligibility criteria and benefits; (2) Financial limits vary by marital status and program type; (3) Income and asset limits change annually; (4) Medical/functional need assessment required in addition to financial eligibility; (5) Special rules for home equity depending on program type; (6) 5-year look-back rule applies to some programs but not others; (7) Multiple application pathways (online, phone, mail, in-person) but specific URLs and form numbers not detailed in available sources
- **Community Based Alternatives (CBA) Waiver** — service ([source](https://www.hhs.texas.gov/services/long-term-care/community-based-alternatives-cba))
  - Shape notes: Tied to STAR+PLUS managed care; no waitlist (unlike IDD waivers); eligibility hinges on State Plan Medicaid + NFLOC; benefits individualized via MCOs, not fixed dollars/hours; regional MCO delivery
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); Texas-specific via https://www.bienvivir.org/eligibility or Texas HHS))
  - Shape notes: Only available in limited regional service areas with specific centers; eligibility tightly linked to Medicaid nursing facility level of care and dual-eligibility; provider-managed enrollment with state approval; not statewide or uniform
- **Texas Simplified Application Project (TSAP) for SNAP** — financial ([source](https://www.hhs.texas.gov/services/food/snap-food-benefits/texas-simplified-application-project-tsap-snap-food-benefits))
  - Shape notes: Simplified process eliminates asset test for seniors 60+ and disabled; eligibility tied to standard SNAP with household-size varying income limits and benefits; statewide with local assisters.
- **Low Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.tdhca.texas.gov (Texas Department of Housing and Community Affairs)[2]))
  - Shape notes: LIHEAP in Texas is administered through a decentralized network of Community Action Agencies, meaning eligibility criteria, benefit amounts, and processing times vary by region. The program prioritizes vulnerable populations (elderly, disabled, young children) who may have no income limit. Benefits are not a fixed dollar amount but depend on household need, energy costs, and available federal funding. The program is part of a larger federal block grant system, making it subject to annual funding fluctuations.
- **Texas State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.shiphelp.org/ships/texas/ (Texas SHIP page); program managed by Texas Health Information, Counseling, and Advocacy Program (HICAP)[7]))
  - Shape notes: no income/asset test; counseling-only service via statewide local networks; named HICAP in Texas; immediate access, no waitlist or application[1][2][7]
- **Family Caregiver Support Program** — service ([source](https://www.hhs.texas.gov/services/aging/long-term-care/home-community-based-care))
  - Shape notes: Administered regionally via 24 Councils of Governments/Area Agencies on Aging; ties to Medicaid HCBS waivers like STAR+PLUS (no strict asset test, income varies); no standalone income/asset tables for core program; eligibility dual medical/financial with local assessment.
- **Legal Aid for Seniors (via AAAs)** — service ([source](https://acl.gov/programs/legal-help/legal-services-elderly-program))
  - Shape notes: No income/asset tests; delivered regionally via 28 AAAs; prioritized by economic/social need; restricted service reporting limits detailed tracking[4][5]
- **Texas Tax Deferral for Seniors** — financial ([source](https://comptroller.texas.gov/taxes/property-tax/exemptions/))
  - Shape notes: No income/asset tests; tied to homestead exemption; county-administered with uniform state law (Texas Tax Code Section 33.06); interest accrues automatically; ends on triggering events like death/sale.
- **Medically Needy Program** — service ([source](https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members (HHSC Medicaid page; regulations at https://www.law.cornell.edu/regulations/texas/title-1/part-15/chapter-366/subchapter-H).[4]))
  - Shape notes: Spend-down via 3-month certification periods using medical bills; elderly-restricted (not for institutional LTC); county variations in expense rules.
- **In-Home and Community-Based Services (HCBS)** — service ([source](https://www.hhs.texas.gov/services/long-term-care/home-community-based-services-hcbs))
  - Shape notes: Multiple HCBS waivers under Texas Medicaid (e.g., STAR+PLUS for elderly/disabled 65+/21+, others for IDD, MH); eligibility ties to specific NFLOC per program; benefits need-assessed by tier, not fixed; regional MCO delivery with waitlists.[1][2][3]
- **Texas Aging and Disability Resource Centers (ADRCs)** — service ([source](https://www.hhs.texas.gov (Texas Health and Human Services Commission oversees 28 ADRCs)[3][6]))
  - Shape notes: No income/asset tests for ADRC access; decentralized with 28 regional centers covering all counties; benefits are navigational/referral only, varying by local resources and referred programs

## Program Details

### Texas Medicaid for Long-Term Care (Elderly and People with Disabilities)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: {"description":"Income limits vary by program type and marital status. For Nursing Home Medicaid (single applicant, 2026): $2,982/month[6]. For basic healthcare coverage under MEPD, income must be at or below 100% of Federal Poverty Level: $1,064/month for single individual, $1,437/month for couple (as of 2023)[2].","note":"Income limits change annually and vary significantly by program (Nursing Home Medicaid vs. HCBS Waivers vs. MEPD)[4][6]"}
- Assets: {"single_applicant":"$2,000 in countable assets (2026)[4][6]","married_couple":"$3,000 in countable assets (as of 2023)[2]","what_counts":"Savings accounts, retirement accounts, and property (among others)[2]","exemptions":"Primary residence is exempt from asset limit. For MEPD applicants specifically, home equity value does not matter—the home is exempt regardless of value[4]. For other Medicaid types, home equity interest must be at or below $752,000 if no one else lives in the home and applicant files 'intent to return'[4]","look_back_rule":"Texas has a 5-year look-back period for Nursing Home Medicaid and Medicaid Waivers. State scrutinizes all asset transfers to ensure no assets were gifted or sold below fair market value. Violations trigger a Penalty Period of Medicaid ineligibility[6]"}
- Must be 65 years or older, blind, or permanently disabled[5]
- Must be a legal U.S. citizen or qualified alien (some resident aliens eligible; undocumented aliens only eligible for emergency coverage)[3]
- Must be a permanent resident of Texas[1]
- Must demonstrate medical/functional need: For Nursing Home Medicaid and HCBS Waivers, applicant must require Nursing Facility Level of Care (NFLOC)[6]. For basic MEPD healthcare, only need to be aged 65+ or disabled[4]. For long-term care services, functional need with Activities of Daily Living (ADLs) assessment required[6]
- Pre-admission screening required to determine eligibility for nursing home care[5]

**Benefits:** Varies by program type. MEPD basic coverage includes: physician visits, prescription medication, emergency room visits, short-term hospital stays[4]. Long-term care services include: nursing home care, home and community-based services (HCBS), meals and snacks, professional supervision, medication management, personal care assistance with toileting and other tasks[7]. Specific dollar amounts and hours per week not provided in search results
- Varies by: program_type_and_medical_need

**How to apply:**
- Online: Texas Health and Human Services Commission (HHSC) website[2]
- Phone: 2-1-1 in Texas or toll-free 877-541-7905[2]
- Mail: Submit required documentation to HHSC[3]
- In-person: Apply directly at HHSC office[3]

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- Multiple program types with different eligibility rules: Nursing Home Medicaid, HCBS Waivers, and MEPD have different income/asset limits and benefits. Families must determine which program applies to their situation[4][6]
- Income and asset limits change annually—2026 figures differ from 2023/2024 figures in search results[2][4][6]
- Asset limits are strict ($2,000 single/$3,000 couple) but home is exempt—however, MEPD has special rules where home equity value doesn't matter at all[4]
- 5-year look-back rule for asset transfers: State can penalize applicants for gifting or selling assets below fair market value within 5 years before application, creating period of ineligibility[6]
- Texas participates in Medicaid Estate Recovery Program (MERP): State can reclaim some Medicaid expenses from estate of deceased recipient who received nursing home care[3]
- Medical necessity is required: Simply meeting age/income/asset requirements is insufficient—applicant must demonstrate need for skilled nursing care or long-term services[3][6]
- Seniors over financial limits may still qualify: Search results indicate pathways exist for those exceeding income/asset limits, but details not provided[6]
- Undocumented aliens have limited eligibility: Only emergency coverage available[3]
- Processing time and waitlist information not available in search results—families should contact HHSC directly for current timelines

**Data shape:** Texas Medicaid long-term care is complex because: (1) Three distinct program types (Nursing Home, HCBS Waivers, MEPD) with different eligibility criteria and benefits; (2) Financial limits vary by marital status and program type; (3) Income and asset limits change annually; (4) Medical/functional need assessment required in addition to financial eligibility; (5) Special rules for home equity depending on program type; (6) 5-year look-back rule applies to some programs but not others; (7) Multiple application pathways (online, phone, mail, in-person) but specific URLs and form numbers not detailed in available sources

**Source:** Texas Health and Human Services Commission (HHSC) website; contact 877-541-7905 or 2-1-1

---

### Community Based Alternatives (CBA) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must qualify for Texas Medicaid under a State Plan eligibility group (e.g., SSI or similar categories including nursing facility services). Income within 300% of SSI for most HCBS waivers (exact 2026 dollar amounts not specified in sources; varies by category). STAR+PLUS HCBS participants with incomes exceeding SSI via 1115 waiver are ineligible for CFC/CBA. No parental income consideration except for specific waivers like TxHmL.
- Assets: Standard Texas Medicaid asset rules apply (e.g., countable assets typically under $2,000 for individual via SSI rules, though not explicitly stated for CBA). Home exempt if applicant lives there or intends to return with equity ≤ $730,000, spouse lives there, or child under 21/disabled child lives there. Other assets counted per Medicaid rules; use TX Medicaid Spend Down Calculator for estimates.
- Texas resident
- Must meet **institutional level of care** (e.g., nursing facility level - NFLOC: at risk of nursing home placement, needs assistance with ≥2 Activities of Daily Living like bathing, dressing, eating, toileting, transferring; behavioral issues may qualify)
- Medicaid-eligible under State Plan group (not 1115 waiver-only)
- Receive at least one waiver service monthly if qualifying via special HCBS group
- U.S. citizen or qualified legal resident

**Benefits:** Home and community-based attendant services and supports, including personal assistance (help with activities of daily living: dressing, bathing, eating, mobility, toileting) and habilitation services. Delivered cost-effectively to avoid institutionalization. Specific hours/dollars not fixed; individualized based on needs. Available via STAR+PLUS managed care for older adults/physical disabilities.
- Varies by: priority_tier

**How to apply:**
- Phone: Contact local Texas Health and Human Services (HHS) office or STAR+PLUS managed care organization (specific numbers via 2-1-1 Texas or hhs.texas.gov)
- Online: Apply for Medicaid at YourTexasBenefits.com
- In-person: Local HHS benefits office
- Mail: Form H1200 or relevant Medicaid application to local office

**Timeline:** Not specified; Medicaid applications typically 45 days
**Waitlist:** No waitlist (entitlement under State Plan, unlike 1915(c) waivers)

**Watch out for:**
- Not a standalone waiver - integrated into **Community First Choice (CFC)** State Plan services and **STAR+PLUS HCBS**; elderly often access via STAR+PLUS (age 65+ or 21+ disabled)
- Must meet **NFLOC** - dementia diagnosis alone insufficient without ADL/behavioral needs
- Ineligible if only under 1115 waiver (e.g., high-income HCBS participants)
- Home equity limit $730,000; estate recovery may claim home post-death
- Confused with 1915(c) waivers like HCS (IDD-focused, waitlists); CBA/CFC has no wait
- Requires ongoing Medicaid State Plan eligibility

**Data shape:** Tied to STAR+PLUS managed care; no waitlist (unlike IDD waivers); eligibility hinges on State Plan Medicaid + NFLOC; benefits individualized via MCOs, not fixed dollars/hours; regional MCO delivery

**Source:** https://www.hhs.texas.gov/services/long-term-care/community-based-alternatives-cba

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Tied to Medicaid eligibility; countable monthly income must meet Texas Medicaid limits for long-term care (varies by household size, typically around 300% of SSI federal benefit rate or ~$2,829 for an individual in 2024; full table not specified in sources but scales for couples/households, often double for couples). Dual-eligible for Medicare/Medicaid preferred for free services; private pay or share-of-cost ($200-$900/month) possible if over limits[2][3][4].
- Assets: Medicaid asset limits apply (e.g., ~$2,000 for individual excluding primary home, one vehicle, burial funds, and certain exempt items; exact Texas figures align with standard Medicaid LTC rules, not specified per household size in sources)[4].
- Live in the service area of a Texas PACE provider
- Certified by state as needing nursing home level of care
- Able to live safely in the community with PACE services
- Eligible for nursing home care
- Dually eligible for Medicare and Medicaid (99% of enrollees)

**Benefits:** Comprehensive all-inclusive care: primary/acute medical care, hospital care, prescription drugs, social services, therapeutic activities, respite care, home care (personal and homemaker), transportation, adult day health center services (typically 3+ days/week), meals, nursing home care if needed; becomes sole source of Medicare/Medicaid services for enrollees; no specific hours/dollars fixed but covers all needs[2][3].
- Varies by: region

**How to apply:**
- Contact local PACE provider for screening (e.g., Bienvivir in El Paso)
- Provider assists with state Medicaid application submission
- Phone/website via providers like Bienvivir (bienvivir.org) or Texas Health and Human Services
- No central statewide phone/form specified; starts with provider screening

**Timeline:** Not specified in sources
**Waitlist:** Possible; varies by provider/region, not detailed

**Watch out for:**
- Not statewide—must live in a PACE service area with an operational center
- Requires nursing home level of care certification but must be safe at home initially
- Financial eligibility via Medicaid (income/assets tested); private pay expensive ($7,000+/month) if ineligible
- Enrollment makes PACE sole service provider—cannot use other Medicare/Medicaid benefits concurrently
- Provider screens first, then applies to state; dual-eligibility key for no-cost access
- Limited providers in Texas (not like broader Medicaid waivers)

**Data shape:** Only available in limited regional service areas with specific centers; eligibility tightly linked to Medicaid nursing facility level of care and dual-eligibility; provider-managed enrollment with state approval; not statewide or uniform

**Source:** https://www.medicaid.gov/medicaid/long-term-services-supports/program-of-all-inclusive-care-for-elderly (federal); Texas-specific via https://www.bienvivir.org/eligibility or Texas HHS

---

### Medicare Savings Programs (QMB, SLMB, QI)

> Last verified: 2026-04-04

**Eligibility:**
- Income: Federal standards apply in Texas with no state-specific variations noted. Limits effective 2026 (updated annually April 1 based on Federal Poverty Level). QMB: Individual $1,350/month (100% FPL), couple $1,824/month. SLMB: Individual ~$1,620/month (120% FPL), couple ~$2,189/month (exact 2026 figures align with federal chart). QI: Individual ~$1,823/month (135% FPL), couple ~$2,462/month. Income disregards include first $20/month, $65 + half wages, food stamps. Limits for household size beyond couple not specified; based on individual/couple.[3][4][6]
- Assets: 2026 limits: Individual $9,950 (QMB/SLMB/QI), couple $14,910. Counts: bank accounts, stocks (some Native corp exempt). Exempt: primary home, one vehicle, household items, wedding/engagement rings, burial plots/expenses up to $1,500, life insurance under $1,500 cash value. Texas follows federal; some states waive assets but Texas does not.[4][6]
- Eligible for Medicare Part A (enrolled or entitled, even if not using). Must have Part A & B for SLMB/QI.
- Texas resident.
- U.S. citizen or qualified immigrant.
- QI: Annual reapplication; first-come first-served with priority to prior recipients.

**Benefits:** QMB: Pays Part A premiums (if applicable), Part B premiums/deductibles/coinsurance/copays for Medicare-covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only; auto-qualifies for Extra Help (prescription drugs, max $12.65 copay/drug in 2026). State Medicaid pays providers directly; no balance billing allowed under QMB.[1][4][6]
- Varies by: program_tier

**How to apply:**
- Online: YourTexasBenefits.com (Texas Health and Human Services)
- Phone: 2-1-1 or 1-877-541-7905 (Texas HHSC Medicaid line)
- Mail: Form H1010 to local HHSC office (find via 211texas.org)
- In-person: Local HHSC benefits office (locations at 211texas.org or call 2-1-1)

**Timeline:** Up to 45 days for QMB (effective first of next month after determination). SLMB/QI retroactive up to 3 months prior.[1]
**Waitlist:** QI: First-come first-served; limited federal funding may create waitlist (priority to prior year recipients). No waitlists noted for QMB/SLMB.[1][6]

**Watch out for:**
- QI requires annual reapplication and may exhaust funding mid-year.
- Must have Part A eligibility (even premium-free); providers cannot bill QMB enrollees.
- Income disregards often missed ($20 + wage deductions).
- Assets include most countable resources; home/car exempt but verify burial/life insurance.
- Auto-enrolls in Extra Help for QI/SLMB but confirm LIS status.
- Outdated limits common; always check current FPL-based figures (change April 1).

**Data shape:** Tiered by program (QMB/SLMB/QI) with escalating income thresholds (100%/120%/135% FPL); QI funding-capped first-come; Texas administers via HHSC statewide with uniform federal standards

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members/medicare-medicaid

---

### Texas Simplified Application Project (TSAP) for SNAP

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: TSAP uses SNAP eligibility rules, which include gross monthly income limits varying by household size (e.g., for October 1, 2025–September 30, 2026: 1 person $1,634, 2 people $2,210, 3 people $2,786; full table available via official SNAP resources). Seniors over 60 and disabled individuals have simplified broad-based categorical eligibility with no separate asset test.
- Assets: No asset limits or test apply under TSAP's simplified broad-based categorical eligibility; primary residence, one vehicle, and most household goods are exempt under standard SNAP rules for this group.
- Texas resident
- U.S. citizen or qualified non-citizen
- Meets SNAP income and categorical requirements (age 60+ or disabled)
- Intended for seniors over 60 and Texans with disabilities

**Benefits:** SNAP (Supplemental Nutrition Assistance Program) food benefits loaded monthly on an Electronic Benefits Transfer (EBT) card for purchasing eligible groceries; benefit amounts vary by income, household size, and expenses (e.g., average $200–$300/month per person, calculated individually).
- Varies by: household_size

**How to apply:**
- Phone: Call 844-583-1500 to reach a local TSAP assister anywhere in Texas
- Online: YourTexasBenefits.com prescreening tool and application
- In-person or mail via local Texas Health and Human Services office (find via 844-583-1500)

**Timeline:** Standard SNAP processing: 30 days for most applicants; expedited up to 7 days if very low income/no assets.

**Watch out for:**
- TSAP is a simplified application process for standard SNAP benefits, not a separate program with unique benefits—expect regular SNAP rules on recertification every 6–12 months.
- Income limits follow annual SNAP adjustments; verify current figures as they change October 1.
- Disabled applicants under 60 qualify if they meet disability criteria, but must be 60+ for pure senior eligibility.
- No separate asset test, but must still report countable resources if questioned.
- Benefits are for food only; EBT card cannot be used for hot foods or non-grocery items.

**Data shape:** Simplified process eliminates asset test for seniors 60+ and disabled; eligibility tied to standard SNAP with household-size varying income limits and benefits; statewide with local assisters.

**Source:** https://www.hhs.texas.gov/services/food/snap-food-benefits/texas-simplified-application-project-tsap-snap-food-benefits

---

### Low Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households with incomes at or below 150% of the federal poverty level[2]. Income limits are based on household size and gross income (before taxes)[2]. Federal poverty thresholds vary by family size; for example, in 2025 the federal poverty level for a single person is approximately $14,600 and for a family of four is approximately $30,000, making 150% roughly $21,900 and $45,000 respectively. However, the search results do not provide Texas-specific dollar amounts or a complete household-size table[1][2].
- Assets: Not specified in available search results.
- Must reside in Texas with proof (utility bill or lease agreement)[2]
- Must be a U.S. citizen or qualified non-citizen (lawful permanent residents, refugees, individuals with certain immigration status)[2]
- Households with vulnerable members (elderly, persons with disabilities, young children) have no income limit[1]
- Categorical eligibility available if at least one household member receives SSI payments or Means-Tested Veterans Program payments[1]

**Benefits:** Heating and cooling assistance; specific dollar amounts per household not provided in search results[5]. The program provides assistance to prevent utility shutoffs or help with heating and cooling bills[5].
- Varies by: household_size, priority_tier, and available federal funding

**How to apply:**
- Phone: (877) 399-8939 or 211[4]
- Online: Visit 211Texas[4]
- In-person: Contact local Community Action Agency (CAA) in your service area[2][4]
- Mail: Contact local agency for mailing procedures[3]

**Timeline:** Not specified in search results. One source mentions applications are placed on a waiting list and a case worker will call to discuss next steps[4].
**Waitlist:** Yes—applications are placed on a waiting list at the local site; processing occurs when your turn comes up[4].

**Watch out for:**
- All LIHEAP assistance is subject to available federal funding—funding is not guaranteed[4]
- Households with vulnerable members (elderly, disabled, young children) receive priority and have no income limit, but this priority status must be documented[1]
- Program guidelines vary by local Community Action Agency; you must contact your specific local agency for exact eligibility and benefit amounts[2]
- Waitlists exist; applications are processed in order, not immediately[4]
- Having an online utility account can speed up the documentation process[4]
- Categorical eligibility (automatic qualification based on receiving SSI or Veterans benefits) exists but requires verification[1]

**Data shape:** LIHEAP in Texas is administered through a decentralized network of Community Action Agencies, meaning eligibility criteria, benefit amounts, and processing times vary by region. The program prioritizes vulnerable populations (elderly, disabled, young children) who may have no income limit. Benefits are not a fixed dollar amount but depend on household need, energy costs, and available federal funding. The program is part of a larger federal block grant system, making it subject to annual funding fluctuations.

**Source:** https://www.tdhca.texas.gov (Texas Department of Housing and Community Affairs)[2]

---

### Weatherization Assistance Program (WAP)

> Last verified: 2026-04-04

**Eligibility:**
- Income: Varies by funding source and subrecipient: LIHEAP WAP at 150% of Federal Poverty Guidelines; DOE WAP at 200% of Federal Poverty Guidelines (effective January 27, 2025). Exact dollar amounts depend on annual HHS Federal Poverty Guidelines and household size; no specific table in sources but must be at or below these limits for all household members over 18. Examples: Dallas County specifies 200% FPL; Austin Energy requires enrollment in Customer Assistance Program or Medically Vulnerable Registry at 80% Median Family Income (as of March 7, 2025). Proof required for last 30 days via check stubs, award letters (SSI/SSDI/SSA/unemployment/TANF/SNAP), or notarized Declaration of Income if no recent income.
- Assets: No asset limits mentioned across sources.
- U.S. Citizen, U.S. National, or Qualified Alien (proof for every household member: birth certificate + ID, U.S. Passport, Certificate of Naturalization/Citizenship + ID, Permanent Resident Card + ID, etc.)
- Owner or renter (landlord agreement if renting)
- Single-family home, duplex, triplex, fourplex, or mobile home (some limits: e.g., Austin Energy - <2,500 sq ft, >10 years old, value ≤$478,195 excluding land, Austin Energy customer, no prior WAP/Home Energy Savings in last 10 years)
- Household must benefit from weatherization (energy audit required)
- Proof of identification for all over 18 (driver's license, state ID, passport, military ID, etc.)

**Benefits:** Energy audit to identify inefficiencies; installation of weatherization measures including caulking, weather-stripping, ceiling/wall/floor insulation, patching building envelope holes, duct work, tune-up/repair/replacement of heating/cooling systems. Must meet energy-savings goals per DOE regulations (10 CFR Part 440). No specific dollar amounts or hours; services free to eligible households.
- Varies by: priority_tier

**How to apply:**
- Mail: Varies by subrecipient (e.g., TCOG: 1117 Gallagher Dr., Suite 450, Sherman TX 75090; Austin Energy: 4815 Mueller Blvd, Austin, TX 78723-3573; Dallas County: 509 Main St. 3rd Floor, Dallas, Texas 75207-2710)
- Online: Varies (e.g., cacost.org English/Spanish applications; Austin Energy online form; traviscountytx.gov application process)
- Phone: Varies by subrecipient (e.g., TCOG: 800-677-8264 ext. 3530; Austin Energy: 512-482-5346)
- In-person/Email: Varies (e.g., Dallas County email: wapassistance@dallascounty.org; CCSCT specific county applications)

**Timeline:** Eligibility memorandum via US mail after processing (exact timeline not specified; delays if missing documents)
**Waitlist:** Not explicitly mentioned; applications processed upon complete submission, regional demand may imply waits

**Watch out for:**
- Must contact specific subrecipient for your county; not centralized application
- Two funding streams (LIHEAP 150% FPL vs DOE 200% FPL) - confirm which applies locally
- All household members need citizenship/residency proof, even children
- Income proof strictly last 30 days; no bank statements/W2s; notarized declaration if zero income
- Home must pass energy audit and meet local criteria (e.g., age, size, prior program exclusion)
- Renting requires landlord permission; services may prioritize elderly/disabled via tiers
- Processing delays without complete docs; mail-only in some areas

**Data shape:** Administered via 20+ regional subrecipients with county-specific providers, forms, contacts, and slight rule variations (e.g., income % FPL, home limits); no statewide uniform app/process; priority for elderly/disabled/vulnerable often implied but tiered by subrecipient

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.tdhca.texas.gov/weatherization-assistance-program

---

### Texas State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits; open to all Medicare-eligible individuals, their families, and caregivers, including those with limited incomes, under age 65 with disabilities, or dually eligible for Medicare and Medicaid[1][2][3]
- Assets: No asset limits or tests apply[2][3]
- Must be Medicare-eligible (typically age 65+ or under 65 with certain disabilities)
- Available to Medicare beneficiaries, families, and caregivers[1][2][3]

**Benefits:** Free one-on-one counseling and assistance on Medicare options (Parts A, B, C, D, Medigap), prescription drug plans, applying for Medicare Savings Programs (MSP), Low-Income Subsidy (Extra Help/LIS), Medicaid; group presentations, outreach events, fraud prevention via Senior Medicare Patrol (SMP); provided in-person, by phone, media[1][2][3][4][7]

**How to apply:**
- Phone: 1-800-252-9240[7]
- Website: Texas Health Information, Counseling, and Advocacy Program (HICAP) site (linked via shiphelp.org/ships/texas/)[7]
- In-person or local counseling via community-based networks (contact phone for local sites)[1][2][7]

**Timeline:** No formal application or processing time; services provided upon contact with counselors[2][3]

**Watch out for:**
- Not direct financial aid or healthcare—only free counseling/advocacy; no enrollment on your behalf, but guides you; Texas calls it HICAP (not always listed as SHIP); often paired with SMP for fraud help; states have flexibility, so confirm Texas details via phone[2][3][6][7]
- People miss that it's volunteer/staff-based with no cost or eligibility barriers beyond Medicare[1][3]

**Data shape:** no income/asset test; counseling-only service via statewide local networks; named HICAP in Texas; immediate access, no waitlist or application[1][2][7]

**Source:** https://www.shiphelp.org/ships/texas/ (Texas SHIP page); program managed by Texas Health Information, Counseling, and Advocacy Program (HICAP)[7]

---

### Meals on Wheels (via Area Agencies on Aging)

> Last verified: 2026-04-04

**Eligibility:**
- Age: 60+
- Income: No income limits or asset limits apply statewide; eligibility is based on need, not finances. Voluntary contributions requested but no one denied for inability to pay.[1][3][4]
- Assets: No asset limits; income and assets not a factor in eligibility determination.[1][3][4]
- Primarily homebound and unable to prepare nutritious meals without assistance[1][2][3][4][5][6]
- No consistent daytime help from others[2]
- Reside in the specific service area or delivery zone of the local provider[1][2][3][5][6]
- Able to accept delivery during program time window (e.g., 10:30am-1pm in some areas)[3]
- 60+ or disabled (some programs explicitly include disabled under 60)[1][2][6]
- May include spouses, dependents, or caregivers in some cases[1][3]
- Assessment by case manager or social worker required[2][3][4][5][6]

**Benefits:** Home-delivered nutritious, often medically-tailored meals (typically 1 hot meal per weekday; optional frozen weekend meals in some areas). Includes safety check and brief social contact during delivery; case management for holistic needs assessment.[2][3][4]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging or Meals on Wheels provider by phone (examples: 817-336-0912 Tarrant County[4], 972-771-9514 Rockwall[6]; find local via https://www.mealsonwheelsamerica.org/find-meals-and-services/[7])
- Online referral forms where available (e.g., Meals on Wheels Central Texas apply link[2], Tarrant County referral form[4])
- Phone referral by anyone (family, hospital, self)[4]
- In-person assessment visit by caseworker (typically within 2 days)[4]

**Timeline:** Varies; some within a week, caseworker visit often within 2 working days[1][4]
**Waitlist:** Possible in high-demand areas; varies by local program[1]

**Watch out for:**
- Must live in exact delivery zone/county of local provider; verify service area first[1][2][3][6]
- Homebound status strictly assessed; those who can easily leave home or have cooking help may not qualify[1]
- No single statewide phone/website/application; must find and contact specific local provider[1][7]
- Voluntary contributions expected but not mandatory; some programs offer trial meals with payment[6]
- Priority to greatest need (e.g., economic/social, disabilities); short-term for recovery available[3][5]
- Car ownership or non-homebound status may disqualify[1]

**Data shape:** Decentralized by local providers/Area Agencies; no uniform income/asset tests, heavy emphasis on homebound need and geography; eligibility confirmed via in-home assessment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mealsonwheelsamerica.org/find-meals-and-services/ (national locator for Texas locals); Texas Area Agencies on Aging via state aging services

---

### Family Caregiver Support Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits or tables identified for this program in Texas; related programs like Medicaid waivers (e.g., STAR+PLUS) have varying income maximums based on household size and waiver type, but require Medicaid eligibility with financial and medical assessments. Caregivers in DFPS-related assistance cannot exceed 300% of federal poverty guidelines for cash aid.
- Assets: No asset limits specified for this program; HCBS waivers do not have strict $2,000 nonexempt asset max like LTC Medicaid, but financial eligibility is assessed.
- Care recipient typically must be elderly (60+ implied for aging programs), Texas resident, need daily assistance or nursing home level care, and enrolled in Medicaid for paid family caregiving options like STAR+PLUS; family caregiver must be non-spouse relative or friend meeting training/background requirements.

**Benefits:** Specific services not detailed; related programs provide in-home personal care, respite, training, and potential paid caregiving at minimum wage (hours vary, not guaranteed 40/week); STAR+PLUS offers long-term home care with family as paid attendants.
- Varies by: region

**How to apply:**
- Phone: 2-1-1 (Texas Health and Human Services)
- Website: YourTexasBenefits.com
- Contact local Area Agency on Aging via Council of Governments region
- In-person: Local Area Agency on Aging offices

**Timeline:** Not specified
**Waitlist:** Possible regional waitlists due to demand, varies by waiver and area

**Watch out for:**
- Not direct state payment to family caregivers without Medicaid waiver eligibility; spouse typically cannot be paid; requires nursing home level 'at need' medical assessment plus financial eligibility; hours/payment not guaranteed at desired levels (e.g., minimum wage, <40/week); confused with VA or DFPS programs; regional variations mean contacting local AAA essential; no automatic pay—must qualify loved one first.

**Data shape:** Administered regionally via 24 Councils of Governments/Area Agencies on Aging; ties to Medicaid HCBS waivers like STAR+PLUS (no strict asset test, income varies); no standalone income/asset tables for core program; eligibility dual medical/financial with local assessment.

**Source:** https://www.hhs.texas.gov/services/aging/long-term-care/home-community-based-care

---

### Senior Community Service Employment Program (SCSEP)

> Last verified: 2026-04-04

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually via HHS Poverty Guidelines (effective January 15, 2025). Families must contact local SCSEP provider for current table, as specific figures not listed in sources[2].
- Assets: No asset limits mentioned in sources[1][2].
- Unemployed and actively seeking employment
- Priority for: age 65+, veterans and qualified spouses, individuals with disabilities, limited English proficiency, rural residents, homeless or at-risk, low employment prospects, failed to find work after American Job Center services, or recent incarceration (within last 5 years)[1][2]

**Benefits:** Part-time paid work (average 20 hours/week) at nonprofits or public agencies (e.g., schools, hospitals, senior centers); wage is highest of federal, state, or local minimum wage; on-the-job training (e.g., computer, vocational skills); job placement assistance; support classes (reading, writing, math, resume workshops); bridge to unsubsidized jobs[1][2][3].
- Varies by: priority_tier

**How to apply:**
- Contact local SCSEP provider via Texas Workforce Commission (TWC) site: https://www.twc.texas.gov/programs/senior-community-service-employment[1]
- AARP Foundation locator: https://my.aarpfoundation.org/locator/scsep/ (enter ZIP for Texas providers)[5]
- CWI Works/MET, Inc. for specific counties: (832) 432-7170, labanzat@metinc.org[6]
- TWC partners with 28 Local Workforce Development Boards (Workforce Solutions offices) for in-person assistance[1]
- National DOL helpline: 1-877-872-5627 (1-877-US2-JOBS)[2]

**Timeline:** Not specified in sources
**Waitlist:** Local providers decide eligibility; potential waitlists due to funding limits, varies by region (not detailed)[1]

**Watch out for:**
- Not available in all 254 Texas counties (only 82 via AARP/TWC, others via partners; check county-specific provider)[1][6]
- Must be unemployed and job-seeking; not general welfare or retirement income[1][2]
- Priority groups get preference, creating potential waitlists for others[1][2]
- Local providers make final eligibility call; income at exactly 125% FPL requires current guidelines verification[1][2]
- Wage is minimum (modest income), part-time only as training bridge[2][3]

**Data shape:** County-restricted coverage (not statewide uniform); multiple sub-grantees/providers (AARP Foundation, MET Inc.); priority tiers affect access; income tied to annual federal poverty guidelines table (household size-based)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.twc.texas.gov/programs/senior-community-service-employment

---

### Legal Aid for Seniors (via AAAs)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No strict financial criteria; income and resources may be considered to prioritize those with greatest economic or social needs, but services are available regardless[3][4].
- Assets: No asset limits specified; prioritization based on economic need without formal cutoffs[3][4].
- Targeted to older individuals with economic or social needs
- Texas resident
- Civil legal matters only (e.g., benefits access, housing, guardianship)

**Benefits:** Legal assistance including: access to public benefits (SSI/SSDI, Medicaid, Medicare, veterans benefits); drafting advance directives and surrogate decision makers; guardianship issues (focused on client representation); housing access and protection from eviction/foreclosure; long-term care financing options. Provided as nearly 1 million hours nationwide annually via ~1,000 providers[3].
- Varies by: priority_tier

**How to apply:**
- Contact local Area Agency on Aging (AAA) by finding your AAA via Texas Health and Human Services (search 'Texas AAAs' or texaslawhelp.org)
- Phone and in-person via 28 AAAs covering all 254 counties (specific numbers vary by region; e.g., via texaslawhelp.org/aaa)
- No specific statewide form; referrals through AAAs

**Timeline:** Not specified in sources

**Watch out for:**
- No financial eligibility barriers, but services prioritize greatest need—may not guarantee case acceptance[3][4]
- Civil matters only; not for criminal or personal injury[1]
- Must go through local AAA, not direct statewide application; find your AAA first[4]
- Even if eligible, organization may not take every case[2]

**Data shape:** No income/asset tests; delivered regionally via 28 AAAs; prioritized by economic/social need; restricted service reporting limits detailed tracking[4][5]

**Source:** https://acl.gov/programs/legal-help/legal-services-elderly-program

---

### Long-Term Care Ombudsman Program

> Last verified: 2026-04-04

**Eligibility:**
- Income: No income limits; services are free and available to any resident regardless of financial status[5][6]
- Assets: No asset limits; no financial eligibility requirements[5][6]
- Must be a resident of a nursing facility or assisted living facility in Texas[5][6][8]
- Services also extend to certain caregivers and family members of persons 60 years or older[2]

**Benefits:** Advocacy for residents' rights including investigating and resolving complaints, representing resident perspectives on laws and policies, preventing abuse and neglect through education and support, ensuring freedom from abuse/restraints, privacy, access to records/inspections, notification of services/costs, protection from improper transfer/discharge, non-discrimination, grievance rights, personal/financial autonomy, and advance directives[1][5][6][8]

**How to apply:**
- Phone: 1-800-252-2412[5][6]
- Website: https://ltco.texas.gov (find local ombudsman)[6]
- Email the state office[6]
- Contact local program (e.g., in-person visits to facilities by ombudsmen)[3][4]

**Timeline:** Immediate assistance available upon contact; no formal application processing[5][6]

**Watch out for:**
- Not a direct service provider like healthcare or financial aid—purely advocacy and complaint resolution[1][6]
- Families often confuse with eligibility-based programs; no income/asset tests, but only for those already in LTC facilities[5][6]
- Volunteers must be 18+, pass background checks, complete training/internship, and avoid conflicts of interest (e.g., no licensing or care provision roles)—this is for becoming an ombudsman, not receiving services[1][2][3][7]
- Independent of facilities; cannot determine Medicaid eligibility or conduct PASRR[2]
- Complaints are confidential and impartial[1][6]

**Data shape:** no income test; advocacy-only for residents of nursing homes/assisted living facilities; free, confidential, statewide with local administration; not for volunteers or facility admission—focuses on rights protection inside facilities

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://ltco.texas.gov[6]

---

### Texas Tax Deferral for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: No income limits or financial hardship requirements.
- Assets: No asset limits.
- Own and occupy the home as principal residence
- Have a homestead exemption on the property
- Also available to disabled persons (as defined by Section 11.13(m) of Texas Tax Code) or disabled veterans/surviving spouses

**Benefits:** Deferral of property taxes on residence homestead (with 5% annual interest accrual); taxes plus interest due upon sale, death (181 days after, unless surviving spouse qualifies), or end of occupancy.
- Varies by: fixed

**How to apply:**
- File Form 50-126 (Tax Deferral Affidavit) with local county appraisal district: online, mail, or in-person (specific office varies by county; e.g., Harris CAD forms page, Denton County appraisal district)
- Phone or visit: Contact your county appraisal district (no statewide phone; e.g., local district offices)
- Ensure homestead exemption is filed first (Form 50-114 for over-65 exemption if needed)

**Timeline:** Not specified; simpler than expected, applied retroactively if needed.

**Watch out for:**
- Not a cancellation—taxes accrue with 5% interest annually; full amount due upon sale/death (181 days after, penalties if unpaid)
- Requires existing homestead exemption; deferral ends if property no longer principal residence
- Surviving spouse (55+) may continue if qualified, but heirs/estate responsible otherwise
- Confused with over-65 exemption (which reduces taxes by extra $10,000 appraisal value, applied separately)
- Local district may have specific residency duration rules

**Data shape:** No income/asset tests; tied to homestead exemption; county-administered with uniform state law (Texas Tax Code Section 33.06); interest accrues automatically; ends on triggering events like death/sale.

**Source:** https://comptroller.texas.gov/taxes/property-tax/exemptions/

---

### Medically Needy Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No fixed income cap; eligibility achieved by spending down excess income above the Medically Needy Income Limit (MNIL) using medical expenses over a 3-month certification period. Exact MNIL dollar amounts not specified in sources and vary annually; for context, standard Medicaid long-term care cap is $2,982/month for a single applicant in 2026, but spend-down applies differently. Primarily for pregnant women and children under 19; limited applicability for elderly.[2][6][7]
- Assets: No separate asset limit specified for Medically Needy; standard Medicaid category rules apply, which for long-term care include $2,000 countable assets for singles (exemptions typically include primary home up to equity limit of $730,000, one vehicle, personal belongings, burial plots; countable assets: cash, bank accounts, secondary properties, investments). Not tailored for elderly long-term care spend-down.[1][7]
- Texas resident and U.S. citizen or qualified non-citizen.[4][5]
- Significant medical expenses (e.g., doctor/hospital bills, prescriptions, medical supplies, sometimes insurance premiums) incurred in the 3-month certification period (month of application + 2 prior months) must equal or exceed excess income.[2][7]
- Primarily targets pregnant women and children under 19; elderly (65+) typically use Qualified Income Trust (Miller Trust) for incomes over cap rather than spend-down, as spend-down not available for nursing home/institutional Medicaid.[6][7]
- Medical/functional need for services, but Nursing Facility Level of Care (NFLOC) not always required unless for long-term care.[1]

**Benefits:** Medicaid coverage for remaining medical costs after spend-down is met within the 3-month certification period; covers doctor visits, hospital bills, prescriptions, medical supplies, hospice care; eligibility resets every 3 months requiring new spend-down.[2][5][8]
- Varies by: certification_period

**How to apply:**
- Online via Texas Health and Human Services (HHSC) portal (yourtexasbenefits.com).
- Phone: Call 2-1-1 or 877-541-7905.
- Mail or in-person at local HHSC offices (locations vary by county).

**Timeline:** Not specified; application processing per state regs (§366.811), but resets every 3 months.[2][4]

**Watch out for:**
- Not for elderly nursing home/long-term care; use Miller Trust instead for income over $2,982/month.[1][7]
- Eligibility resets every 3 months; must re-demonstrate spend-down or lose coverage.[2]
- Spend-down limited to pregnant women/children under 19; elderly often ineligible via this path.[6][7]
- Not all expenses count (e.g., OTC meds vary by county); nursing home has stricter rules.[2][8]
- Income defined more broadly than IRS (includes more sources).[3]

**Data shape:** Spend-down via 3-month certification periods using medical bills; elderly-restricted (not for institutional LTC); county variations in expense rules.

**Source:** https://www.hhs.texas.gov/services/health/medicaid-chip/medicaid-chip-members (HHSC Medicaid page; regulations at https://www.law.cornell.edu/regulations/texas/title-1/part-15/chapter-366/subchapter-H).[4]

---

### In-Home and Community-Based Services (HCBS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Countable income must be less than the Medicaid waiver income limit of $2,829/month (2024 figure; may adjust annually). Must meet Medicaid financial eligibility, which includes SSI or HHSC Medicaid program criteria. Income limits vary by household size under general Medicaid rules, but specific HCBS waiver cap is $2,829 for the applicant.[1][3]
- Assets: Countable assets must be less than $2,000 for a single individual. Exempt assets typically include the primary home (if home equity interest ≤ $730,000, applicant lives there or intends to return, or spouse/child under 21/disabled child lives there), one vehicle, personal belongings, and certain life insurance. Home may be subject to Medicaid Estate Recovery.[1][3]
- Texas resident and U.S. citizen.
- At risk of nursing home placement and meet Nursing Facility Level of Care (NFLOC) via Medical Necessity/Level of Care (MN/LOC) assessment, considering ADLs like bathing, eating, mobility, and behavioral issues.
- Not enrolled in another Medicaid waiver program.
- Live in home or community setting (or intend to return).
- Have unmet need for at least one HCBS service.
- Physician-ordered medical/nursing services requiring skilled care on a regular basis.[1][3]

**Benefits:** Specific in-home and community-based services to avoid nursing home placement, including personal care assistance, adult day care, respite care, minor home modifications, medical supplies/equipment, nursing, therapies, and case management. Amount/hours determined by assessed needs and NFLOC, not fixed dollar or weekly limits.[1][3]
- Varies by: priority_tier

**How to apply:**
- Contact local Texas Health and Human Services Commission (HHSC) office or STAR+PLUS managed care organization (MCO) via phone: 2-1-1 or 1-877-541-7905.
- Online screening via Texas Medicaid eligibility tools (e.g., Your Texas Benefits at yourtexasbenefits.com).
- In-person at local HHSC offices.
- Mail or fax forms to HHSC.[1]

**Timeline:** Medicaid eligibility determination immediate if eligible; waiver may take 1-2 years if waitlisted.[3]
**Waitlist:** 1-2 year waiting list if not immediately Medicaid-eligible for waiver slot.[3]

**Watch out for:**
- Must meet NFLOC; dementia diagnosis alone insufficient without ADL deficits or behavioral needs.[1]
- Home equity limit $730,000; potential estate recovery on home post-death.[1]
- Cannot be in another waiver; enrolling ends prior waiver.[3]
- Waitlist 1-2 years if not Medicaid-qualified immediately.[3]
- Services only if unmet need demonstrated; not all Medicaid recipients qualify for HCBS waiver.[1][3]

**Data shape:** Multiple HCBS waivers under Texas Medicaid (e.g., STAR+PLUS for elderly/disabled 65+/21+, others for IDD, MH); eligibility ties to specific NFLOC per program; benefits need-assessed by tier, not fixed; regional MCO delivery with waitlists.[1][2][3]

**Source:** https://www.hhs.texas.gov/services/long-term-care/home-community-based-services-hcbs

---

### Texas Aging and Disability Resource Centers (ADRCs)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; services provided without regard to income levels[1][3][5]
- Assets: No asset limits or tests mentioned; access is free regardless of financial status[1][3][5]
- Serves older adults (typically 65+), people with disabilities of any age, family caregivers, veterans, and families with children with special needs; residency in Texas (all 254 counties)[1][2][3][4]

**Benefits:** Free personalized guidance, information and assistance, referrals to local services (in-home care, housing assistance, transportation, respite care), help navigating eligibility for state/federal programs, person-centered planning, service coordination, advocacy; no direct financial aid or fixed hours/dollars provided by ADRC itself[1][2][3][5]
- Varies by: region

**How to apply:**
- Statewide toll-free phone: 1-855-YES-ADRC (1-855-937-2372) - routed to local ADRC[1][3][4]
- Local ADRC phone (e.g., Heart of Texas: 254-292-1855)[3]
- In-person walk-ins at local ADRC offices[3][5]
- Online referrals or agency contact via local ADRC websites (e.g., atcog.org/adrc, wctcog.org/adrc)[1][5]

**Timeline:** Immediate guidance and referrals upon contact; no specified processing time as it's information/referral service[3][5]

**Watch out for:**
- Not a direct service provider—offers referrals and navigation only, not the services themselves; people may expect direct aid; 'No Wrong Door' means it's an entry point to other programs with their own eligibility (e.g., income for housing aid); must call local ADRC for region-specific help[2][3][5]
- Free info service, but referred programs may have waits, income tests, or limits[5]

**Data shape:** No income/asset tests for ADRC access; decentralized with 28 regional centers covering all counties; benefits are navigational/referral only, varying by local resources and referred programs

**Source:** https://www.hhs.texas.gov (Texas Health and Human Services Commission oversees 28 ADRCs)[3][6]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Texas Medicaid for Long-Term Care (Elder | benefit | state | deep |
| Community Based Alternatives (CBA) Waive | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Texas Simplified Application Project (TS | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Texas State Health Insurance Assistance  | resource | federal | simple |
| Meals on Wheels (via Area Agencies on Ag | benefit | federal | deep |
| Family Caregiver Support Program | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors (via AAAs) | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Texas Tax Deferral for Seniors | benefit | state | medium |
| Medically Needy Program | benefit | state | deep |
| In-Home and Community-Based Services (HC | benefit | state | deep |
| Texas Aging and Disability Resource Cent | navigator | state | simple |

**Types:** {"benefit":12,"resource":3,"employment":1,"navigator":1}
**Scopes:** {"state":8,"local":1,"federal":8}
**Complexity:** {"deep":12,"simple":4,"medium":1}

## Content Drafts

Generated 1 page drafts. Review in admin dashboard or `data/pipeline/TX/drafts.json`.

- **Texas Medicaid for Long-Term Care (Elderly and People with Disabilities)** (benefit) — 5 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_type_and_medical_need**: 1 programs
- **priority_tier**: 5 programs
- **region**: 4 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size, priority_tier, and available federal funding**: 1 programs
- **not_applicable**: 2 programs
- **fixed**: 1 programs
- **certification_period**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Texas Medicaid for Long-Term Care (Elderly and People with Disabilities)**: Texas Medicaid long-term care is complex because: (1) Three distinct program types (Nursing Home, HCBS Waivers, MEPD) with different eligibility criteria and benefits; (2) Financial limits vary by marital status and program type; (3) Income and asset limits change annually; (4) Medical/functional need assessment required in addition to financial eligibility; (5) Special rules for home equity depending on program type; (6) 5-year look-back rule applies to some programs but not others; (7) Multiple application pathways (online, phone, mail, in-person) but specific URLs and form numbers not detailed in available sources
- **Community Based Alternatives (CBA) Waiver**: Tied to STAR+PLUS managed care; no waitlist (unlike IDD waivers); eligibility hinges on State Plan Medicaid + NFLOC; benefits individualized via MCOs, not fixed dollars/hours; regional MCO delivery
- **Program of All-Inclusive Care for the Elderly (PACE)**: Only available in limited regional service areas with specific centers; eligibility tightly linked to Medicaid nursing facility level of care and dual-eligibility; provider-managed enrollment with state approval; not statewide or uniform
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by program (QMB/SLMB/QI) with escalating income thresholds (100%/120%/135% FPL); QI funding-capped first-come; Texas administers via HHSC statewide with uniform federal standards
- **Texas Simplified Application Project (TSAP) for SNAP**: Simplified process eliminates asset test for seniors 60+ and disabled; eligibility tied to standard SNAP with household-size varying income limits and benefits; statewide with local assisters.
- **Low Income Home Energy Assistance Program (LIHEAP)**: LIHEAP in Texas is administered through a decentralized network of Community Action Agencies, meaning eligibility criteria, benefit amounts, and processing times vary by region. The program prioritizes vulnerable populations (elderly, disabled, young children) who may have no income limit. Benefits are not a fixed dollar amount but depend on household need, energy costs, and available federal funding. The program is part of a larger federal block grant system, making it subject to annual funding fluctuations.
- **Weatherization Assistance Program (WAP)**: Administered via 20+ regional subrecipients with county-specific providers, forms, contacts, and slight rule variations (e.g., income % FPL, home limits); no statewide uniform app/process; priority for elderly/disabled/vulnerable often implied but tiered by subrecipient
- **Texas State Health Insurance Assistance Program (SHIP)**: no income/asset test; counseling-only service via statewide local networks; named HICAP in Texas; immediate access, no waitlist or application[1][2][7]
- **Meals on Wheels (via Area Agencies on Aging)**: Decentralized by local providers/Area Agencies; no uniform income/asset tests, heavy emphasis on homebound need and geography; eligibility confirmed via in-home assessment
- **Family Caregiver Support Program**: Administered regionally via 24 Councils of Governments/Area Agencies on Aging; ties to Medicaid HCBS waivers like STAR+PLUS (no strict asset test, income varies); no standalone income/asset tables for core program; eligibility dual medical/financial with local assessment.
- **Senior Community Service Employment Program (SCSEP)**: County-restricted coverage (not statewide uniform); multiple sub-grantees/providers (AARP Foundation, MET Inc.); priority tiers affect access; income tied to annual federal poverty guidelines table (household size-based)
- **Legal Aid for Seniors (via AAAs)**: No income/asset tests; delivered regionally via 28 AAAs; prioritized by economic/social need; restricted service reporting limits detailed tracking[4][5]
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only for residents of nursing homes/assisted living facilities; free, confidential, statewide with local administration; not for volunteers or facility admission—focuses on rights protection inside facilities
- **Texas Tax Deferral for Seniors**: No income/asset tests; tied to homestead exemption; county-administered with uniform state law (Texas Tax Code Section 33.06); interest accrues automatically; ends on triggering events like death/sale.
- **Medically Needy Program**: Spend-down via 3-month certification periods using medical bills; elderly-restricted (not for institutional LTC); county variations in expense rules.
- **In-Home and Community-Based Services (HCBS)**: Multiple HCBS waivers under Texas Medicaid (e.g., STAR+PLUS for elderly/disabled 65+/21+, others for IDD, MH); eligibility ties to specific NFLOC per program; benefits need-assessed by tier, not fixed; regional MCO delivery with waitlists.[1][2][3]
- **Texas Aging and Disability Resource Centers (ADRCs)**: No income/asset tests for ADRC access; decentralized with 28 regional centers covering all counties; benefits are navigational/referral only, varying by local resources and referred programs

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Texas?
