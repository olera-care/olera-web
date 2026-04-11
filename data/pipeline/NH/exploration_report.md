# New Hampshire Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.100 (20 calls, 10.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 18 |
| New (not in our data) | 8 |
| Data discrepancies | 10 |
| Fields our model can't capture | 10 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 10 | Our model has no asset limit fields |
| `regional_variations` | 8 | Program varies by region — our model doesn't capture this |
| `waitlist` | 4 | Has waitlist info — our model has no wait time field |
| `documents_required` | 10 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 11 programs
- **financial**: 3 programs
- **employment**: 1 programs
- **advocacy**: 2 programs
- **employment + in_kind**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid for Aged, Blind, Disabled (ABD)

- **min_age**: Ours says `65` → Source says `65 or older, OR blind at any age, OR disabled at any age` ([source](New Hampshire Department of Health and Human Services (DHHS) — specific URL not provided in search results; general reference: HealthCare.gov))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Varies by specific ABD program. For Choices for Independence Program (home-based care option): case management and assistance with bathing, dressing, meals, housework, and more to enable aging in place. For MOAD (Medicaid for Employed Older Adults with Disabilities, age 65+): Medicaid coverage for working disabled adults. For Aid to the Needy Blind and APTD: health coverage (specific services not detailed in search results).` ([source](New Hampshire Department of Health and Human Services (DHHS) — specific URL not provided in search results; general reference: HealthCare.gov))
- **source_url**: Ours says `MISSING` → Source says `New Hampshire Department of Health and Human Services (DHHS) — specific URL not provided in search results; general reference: HealthCare.gov`

### Choices for Independence (CFI) Waiver

- **min_age**: Ours says `65` → Source says `18` ([source](www.dhhs.nh.gov (DHHS) or www.servicelink.nh.gov[1]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Wide range of home and community-based services including care coordination, case management, and supports to remain at home (specific services determined by assessment; no fixed dollar amounts or hours stated)[1][3][4]` ([source](www.dhhs.nh.gov (DHHS) or www.servicelink.nh.gov[1]))
- **source_url**: Ours says `MISSING` → Source says `www.dhhs.nh.gov (DHHS) or www.servicelink.nh.gov[1]`

### NH PACE (Program of All-Inclusive Care for the Elderly)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive, all-inclusive care from an interdisciplinary team including primary care, specialists, nursing, therapies, personal care, home care, transportation, meals (including home-delivered), medications, social services, and adult day health at PACE center; no deductibles or copays for PACE-provided services once enrolled[1][3]. Specific hours or dollar amounts not fixed; care is individualized based on needs.` ([source](No operational NH PACE program; general info at https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[5]. For NH development: https://chhs.unh.edu/sites/default/files/bring-pace-to-nh-presentation-liz-parry.pdf[6]. Check https://www.dhhs.nh.gov/ for updates.))
- **source_url**: Ours says `MISSING` → Source says `No operational NH PACE program; general info at https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[5]. For NH development: https://chhs.unh.edu/sites/default/files/bring-pace-to-nh-presentation-liz-parry.pdf[6]. Check https://www.dhhs.nh.gov/ for updates.`

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI/SLMB-135)

- **income_limit**: Ours says `$1304` → Source says `$13` ([source](https://www.dhhs.nh.gov/health-care/medicaid (inferred state Medicaid site; federal: https://www.medicare.gov/basics/costs/help/medicare-savings-programs)[6]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `**QMB**: Part A premiums (if applicable, up to $565/mo), Part A deductible ($1,736/benefit period), Part A copays (e.g., $434/day days 61-90), Part B premium ($202.90/mo 2026), Part B deductible ($283/yr), Part B 20% coinsurance. Providers cannot bill QMB for Medicare-covered cost-sharing.
**SLMB**: Part B premiums only.
**QI (SLMB-135)**: Part B premiums only.
Automatic qualification for Extra Help (Part D low-income subsidy)[1][2][3][4].` ([source](https://www.dhhs.nh.gov/health-care/medicaid (inferred state Medicaid site; federal: https://www.medicare.gov/basics/costs/help/medicare-savings-programs)[6]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov/health-care/medicaid (inferred state Medicaid site; federal: https://www.medicare.gov/basics/costs/help/medicare-savings-programs)[6]`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhhs.nh.gov/programs-services/food-stamps (or via NHEasy: https://www.nheasy.nh.gov)))
- **income_limit**: Ours says `$1990` → Source says `$2608` ([source](https://www.dhhs.nh.gov/programs-services/food-stamps (or via NHEasy: https://www.nheasy.nh.gov)))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (groceries, no hot foods/alcohol/tobacco). Amount based on net income, household size: ~$100 more net income = $30 less benefits. Minimum/maximum allotments vary (e.g., example 2-person elderly: $415/month).[1][3]` ([source](https://www.dhhs.nh.gov/programs-services/food-stamps (or via NHEasy: https://www.nheasy.nh.gov)))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov/programs-services/food-stamps (or via NHEasy: https://www.nheasy.nh.gov)`

### LIHEAP (Low-Income Home Energy Assistance Program)

- **income_limit**: Ours says `$2800` → Source says `$3,967` ([source](https://www.energy.nh.gov/ (NH Department of Energy); local via CAPNH at https://www.caphr.org/services/fuel-assistance))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating assistance: $94 minimum to $2,177 maximum per household, paid directly to heating vendor. Winter crisis: up to $2,177. No summer crisis. Varies by income, household size, fuel type. Does not count as income for other programs.[1][2][5]` ([source](https://www.energy.nh.gov/ (NH Department of Energy); local via CAPNH at https://www.caphr.org/services/fuel-assistance))
- **source_url**: Ours says `MISSING` → Source says `https://www.energy.nh.gov/ (NH Department of Energy); local via CAPNH at https://www.caphr.org/services/fuel-assistance`

### SHIP (State Health Insurance Assistance Program)

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free one-on-one personalized health insurance counseling, information and printed materials, referrals to agencies; covers Medicare Part A/B, Part D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, and other programs; helps understand benefits, compare options, avoid overpayment[2][4][5][6].` ([source](http://www.servicelink.nh.gov/medicare/index.htm))
- **source_url**: Ours says `MISSING` → Source says `http://www.servicelink.nh.gov/medicare/index.htm`

### Family Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Information about community programs and resources; assistance accessing services; individual counseling and support groups; education and caregiver training; respite care (temporary break for full-time caregivers); limited supplemental services including chore services, assistive equipment, home modifications, and transportation[3][4][5].` ([source](https://www.dhhs.nh.gov (inferred from program context; see also national: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[3][4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov (inferred from program context; see also national: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[3][4]`

### Legal Assistance for Older Adults

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free civil legal services including representation at hearings/court, advice, negotiation (e.g., with landlords), assistance navigating government programs (e.g., Medicare/Medicaid appeals), education for community groups; covers consumer contracts, debt collection, utility shutoffs, healthcare, housing/landlord-tenant, domestic/family issues, estate planning/probate/wills/power of attorney[2][3][5][6]` ([source](https://www.nhla.org or https://www.603legalaid.org[3]))
- **source_url**: Ours says `MISSING` → Source says `https://www.nhla.org or https://www.603legalaid.org[3]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free and confidential advocacy services, including resolving complaints about care quality, obtaining information on facilities, representing interests to ensure fair treatment, dignity, and respect; collaborates with residents, families, facility staff, and lawmakers; does not provide direct patient care.` ([source](https://www.dhhs.state.nh.us))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.state.nh.us`

## New Programs (Not in Our Data)

- **Weatherization Assistance Program (WAP)** — service ([source](https://www.energy.nh.gov/ (NH Department of Energy administers statewide; regional CAPs handle delivery; federal overview at energy.gov[5][7])))
  - Shape notes: Eligibility tied directly to FAP/EAP (200% FPG, varies by household size annually); priority tiers (elderly, disabled, young children); administered regionally by CAPs with county restrictions; free services based on energy audit, not fixed dollar amounts.
- **Meals on Wheels (Elderly Nutrition Program)** — service ([source](https://mealsonwheelsnh.org (Meals on Wheels New Hampshire coalition); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/))
  - Shape notes: Decentralized by local non-profit providers with county/town restrictions; no uniform income test for 60+ but required for younger disabled; varies by region including service areas and exact rules
- **SCSEP (Senior Community Service Employment Program)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: Federally uniform but locally administered via grantees like Operation ABLE in NH; priority tiers affect access; no fixed dollar benefits (stipend ties to minimum wage); income test at 125% FPL scales by household size per annual HHS guidelines
- **Adult Day Services** — service ([source](https://www.dhhs.nh.gov/programs-services/medicaid (DHHS Medicaid); Rules at N.H. Admin. Code § He-E 803))
  - Shape notes: Medicaid-funded via State Plan (non-waiver) or waivers; eligibility hinges on Medicaid qualification + medical/nursing-level need; provider-specific with statewide licensing but local delivery; no fixed hours cap beyond minimum, scales by care plan
- **Easterseals NH In-Home Care & Health Services** — service ([source](https://eastersealsnh.org/programs/senior-services/in-home-care-health-services/[4]))
  - Shape notes: Private/non-profit in-home care provider accepting multiple payments; no fixed income/asset tests or age minimum published; availability staff-dependent with regional focus; personalized plans post-assessment rather than standardized benefits
- **Caregiver Respite and Senior Volunteer Programs** — service ([source](No single primary .gov URL identified; closest is NH Care Collaborative (nhcare-c.org) for regional implementation and UNH CHHS PDF on NH Family Caregiver Support Program[3][6].))
  - Shape notes: Decentralized by region with local Aging and Disability Resource Centers as key access points; mix of state-funded grants (NH Family Caregiver Program) and private paid services; no uniform income/asset tests or statewide processing times
- **AmeriCorps Senior Companion Program (NH)** — employment + in_kind ([source](https://www.manchesternh.gov/Departments/Senior-Services/AmeriCorps-Senior-Companion-Program))
  - Shape notes: This is a federal Senior Corps program with statewide reach but county-based administration. Income limits are the primary eligibility gate. The program is volunteer-based with a modest stipend, not a direct service benefit. Key distinction: eligibility for *volunteering* (55+, low-income) differs from eligibility for *receiving* services (60+, frail/homebound, or caregiver). Processing timelines and waitlist status are not documented in available sources.
- **Monadnock at Home Community Services** — service ([source](https://www.cc-nh.org/services/senior-support-services/monadnock-at-home/))
  - Shape notes: town-restricted to 12 Monadnock Region communities; membership model with fee, not needs-tested; partners with local entities like Monadnock Community Hospital and CVTC for services.

## Program Details

### Medicaid for Aged, Blind, Disabled (ABD)


**Eligibility:**
- Age: 65 or older, OR blind at any age, OR disabled at any age+
- Income: Search results do not provide specific income dollar limits for ABD category. Income limits vary by specific ABD program (e.g., Aid to the Needy Blind, Aid to the Permanently Disabled). For APTD (Aid to the Permanently Disabled), income and resource limits apply but specific amounts are not detailed in available sources. Applicants should contact DHHS directly for current income thresholds by program.
- Assets: For long-term care Medicaid (which includes some ABD services): $2,500 asset limit for applicants, though New Hampshire applies an asset disregard allowing up to $7,500 in assets. Primary home is automatically exempt if spouse, child under 21, or permanently blind/disabled child lives in it; otherwise, home equity interest limit is $752,000 (2026). Asset limits may differ for non-long-term-care ABD programs; specific limits for Aid to the Needy Blind and APTD not provided in search results.
- Must be a New Hampshire resident
- Must be a U.S. citizen or qualified non-citizen
- For certain ABD programs, must have functional need for services (e.g., Activities of Daily Living support for long-term care)

**Benefits:** Varies by specific ABD program. For Choices for Independence Program (home-based care option): case management and assistance with bathing, dressing, meals, housework, and more to enable aging in place. For MOAD (Medicaid for Employed Older Adults with Disabilities, age 65+): Medicaid coverage for working disabled adults. For Aid to the Needy Blind and APTD: health coverage (specific services not detailed in search results).
- Varies by: program_type

**How to apply:**
- Online: HealthCare.gov or directly through New Hampshire Department of Health and Human Services
- Phone: 1-800-852-3345, extension 9700
- Mail: Paper application (specific mailing address not provided in search results)
- In-person: Contact DHHS for local office locations

**Timeline:** Not specified in search results
**Waitlist:** Not specified in search results

**Watch out for:**
- ABD is an umbrella category covering multiple distinct programs (Aid to the Needy Blind, APTD, MEAD, MOAD, Choices for Independence). Each has different eligibility criteria and benefits. Families must identify which specific ABD program applies to their situation.
- Income and asset limits vary significantly by specific program within ABD. Search results do not provide complete income/asset thresholds for all ABD programs.
- For long-term care ABD services: all monthly income except $93 Personal Needs Allowance, Medicare premiums, and potentially a spouse's needs allowance must go toward care costs (Patient Liability). This is a significant financial obligation.
- Home equity exemption is NOT automatic for all applicants—only if spouse, child under 21, or permanently blind/disabled child lives in the home. Otherwise, $752,000 home equity limit applies (2026).
- Medicaid renewal required annually; open enrollment for plan switching occurs in August.
- Search results recommend applying even if you think you exceed income or asset limits, as exceptions and disregards may apply.
- For employed disabled adults (MEAD/MOAD), higher resource limits and income thresholds apply compared to other ABD programs, but specific amounts not provided.

**Data shape:** ABD is a categorical umbrella with multiple sub-programs (Aid to the Needy Blind, APTD, MEAD, MOAD, Choices for Independence), each with distinct eligibility, benefits, and income/asset limits. Search results provide general ABD framework but lack specific dollar amounts for most income limits and detailed benefit schedules. Long-term care ABD programs have well-defined asset limits ($2,500/$7,500) and home equity rules, but non-long-term-care ABD programs' financial thresholds are not detailed. Applicants must contact DHHS directly for program-specific details. No regional variations documented in search results.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** New Hampshire Department of Health and Human Services (DHHS) — specific URL not provided in search results; general reference: HealthCare.gov

---

### Choices for Independence (CFI) Waiver


**Eligibility:**
- Age: 18+
- Income: Must meet Medicaid income guidelines for long-term care; specific dollar amounts and household size variations not detailed in sources—follows NH Medicaid thresholds for nursing home level of care[1]
- Assets: Must meet Medicaid asset guidelines for long-term care; specific limits, countable assets, and exemptions not detailed in sources—standard Medicaid rules apply (e.g., primary home often exempt)[1]
- Medically eligible for nursing home placement (nursing home level of care)[1][3]
- In need of one or more services to live at home[1]
- NH resident[5]

**Benefits:** Wide range of home and community-based services including care coordination, case management, and supports to remain at home (specific services determined by assessment; no fixed dollar amounts or hours stated)[1][3][4]
- Varies by: priority_tier

**How to apply:**
- Online: www.NHEasy.NH.gov[1]
- Phone: Aging and Disability Resource Center (ADRC/ServiceLink) at 1-866-634-9412 or www.servicelink.nh.gov[1]
- In-person: Local DHHS Office (find via 603-271-9700 or www.dhhs.nh.gov); local ADRC[1]
- Regional contacts: e.g., Community Partners (Strafford/Rockingham Counties) at 603-516-9300 or 800-454-0630[3]

**Timeline:** Not specified in sources

**Watch out for:**
- Financial eligibility tied to Medicaid long-term care guidelines, which may be stricter than standard Medicaid—confirm current income/asset limits via DHHS[1]
- Must have nursing home level of care medically; not just age or disability[1][3]
- Post-eligibility, assigned a case management agency (can request specific one); services based on assessment and local availability[1][3]
- If ineligible, ADRC counselors offer alternatives[1]

**Data shape:** Medicaid 1915(c) waiver program; eligibility determined by DHHS; services person-centered via regional case managers; no fixed benefit amounts—varies by assessed needs and local providers[1][2][3]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** www.dhhs.nh.gov (DHHS) or www.servicelink.nh.gov[1]

---

### NH PACE (Program of All-Inclusive Care for the Elderly)


**Eligibility:**
- Age: 55+
- Income: No financial eligibility requirements; no income or asset limits. Fully covered for Medicaid-eligible individuals; private pay monthly premium option available for non-Medicaid Medicare beneficiaries[1][5].
- Assets: No asset limits or tests apply[1].
- Must require Nursing Facility Level of Care (NFLOC) as certified by New Hampshire[1][5][6].
- Must be able to live safely in the community (home or assisted living) with PACE services[1][5].
- Must live in the service area of an approved PACE provider (not yet operational statewide in NH)[1][3][6].

**Benefits:** Comprehensive, all-inclusive care from an interdisciplinary team including primary care, specialists, nursing, therapies, personal care, home care, transportation, meals (including home-delivered), medications, social services, and adult day health at PACE center; no deductibles or copays for PACE-provided services once enrolled[1][3]. Specific hours or dollar amounts not fixed; care is individualized based on needs.
- Varies by: region

**Timeline:** Not specified; national PACE programs may have enrollment processes post-eligibility certification, but NH-specific details unavailable as program not launched[2][3].
**Waitlist:** Possible waitlists due to capped financing and limited provider availability nationally; NH status unknown[2].

**Watch out for:**
- NH does not currently have any PACE programs operational; families cannot enroll today—program is in planning/discussion phase[6].
- Availability strictly limited to specific PACE center service areas; must live nearby (typically 30-45 min drive)[1][3].
- Requires NFLOC certification, which is more than just age or dementia—must need nursing home-level care but can safely avoid it with PACE[1].
- Once enrolled, care is 'lock-in': must use PACE providers (except emergencies); out-of-network use may not be covered[4].
- Private pay premium can be substantial for non-Medicaid (exact NH amounts TBD if launched).

**Data shape:** No operational programs in NH; eligibility tied to non-existent provider service areas; no income/asset tests but requires state NFLOC certification and proximity to center; national model with state-specific rollout barriers.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** No operational NH PACE program; general info at https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE[5]. For NH development: https://chhs.unh.edu/sites/default/files/bring-pace-to-nh-presentation-liz-parry.pdf[6]. Check https://www.dhhs.nh.gov/ for updates.

---

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI/SLMB-135)


**Eligibility:**
- Income: New Hampshire specific monthly income limits (with $13 unearned income disregard):
- **QMB**: $1,235 single / $1,663 married (≤100% FPL)
- **SLMB**: $1,235-$1,478 single / $1,663-$1,992 married (100-120% FPL)
- **QI (SLMB-135)**: $1,478-$1,660 single / $1,992-$2,239 married (120-135% FPL)
Limits based on Federal Poverty Guidelines, updated April 1 annually. Household size not detailed beyond single/married; states may adjust[3][5].
- Assets: Federal limits apply: $9,090 single / $13,630 married. Counts: real estate, retirement accounts, savings/checking. Exemptions not specified in NH details; primary residence, one car often exempt federally[1][3].
- Must be eligible for Medicare (Parts A/B, even if not enrolled)
- New Hampshire disregards first $13 of unearned income (e.g., Social Security, pensions)

**Benefits:** **QMB**: Part A premiums (if applicable, up to $565/mo), Part A deductible ($1,736/benefit period), Part A copays (e.g., $434/day days 61-90), Part B premium ($202.90/mo 2026), Part B deductible ($283/yr), Part B 20% coinsurance. Providers cannot bill QMB for Medicare-covered cost-sharing.
**SLMB**: Part B premiums only.
**QI (SLMB-135)**: Part B premiums only.
Automatic qualification for Extra Help (Part D low-income subsidy)[1][2][3][4].
- Varies by: priority_tier

**How to apply:**
- Apply through New Hampshire Department of Health and Human Services (DHHS) Medicaid - specific phone, URL, form not in results; contact state Medicaid office
- Multiple routes likely exist (online, phone, mail, in-person) via DHHS

**Timeline:** Not specified in sources
**Waitlist:** QI may have funding limits/priority (e.g., first-come first-served federally); NH details unavailable[2]

**Watch out for:**
- QI (SLMB-135) called differently in NH; limited funding may create waitlist/priority[3][5]
- Providers cannot bill QMB for cost-sharing, but must educate to avoid errors[2]
- $13 NH unearned income disregard often missed[3]
- Income limits update April 1; use current FPL[2][3]
- Automatic Extra Help eligibility overlooked[8]

**Data shape:** Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); NH uses federal assets + state $13 disregard; benefits degrade by tier (full cost-sharing to premiums only)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov/health-care/medicaid (inferred state Medicaid site; federal: https://www.medicare.gov/basics/costs/help/medicare-savings-programs)[6]

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (Oct 1, 2025 - Sept 30, 2026): Gross income limit at 200% FPG - 1 person: $2608/month, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, each additional +$916. If over gross limit, qualify via Net Income test (100% FPG) and Asset test. Most households (no elderly/disabled) exempt from Asset test if under gross; elderly/disabled over 200% FPG must meet federal asset limit of $4500.[1][5]
- Assets: No asset limit for most NH households (expanded eligibility). Households with elderly/disabled member over 200% FPG gross income: $4500 limit. Exempt: primary home, retirement savings, household goods, one vehicle (value if owned), cash value of life insurance. Application may still ask for assets.[1][2]
- U.S. citizen or qualified non-citizen.
- Live in NH.
- Net income test: generally 100% FPG after deductions (e.g., shelter, medical for elderly).
- Categorical eligibility if all members receive SSI, TANF, etc., or gross <=185% FPG (older rule).[4]
- Work requirements may apply (exempt for 60+).

**Benefits:** Monthly EBT card for food purchases (groceries, no hot foods/alcohol/tobacco). Amount based on net income, household size: ~$100 more net income = $30 less benefits. Minimum/maximum allotments vary (e.g., example 2-person elderly: $415/month).[1][3]
- Varies by: household_size

**How to apply:**
- Online: NHEasy (https://www.nheasy.nh.gov), accessible via DHHS site.
- Phone: 1-877-347-SNAP (1-877-347-7627).
- Mail or in-person: Local DHHS District Offices (find via dhhs.nh.gov).

**Timeline:** Generally 30 days; expedited for urgent cases within 7 days if qualify.

**Watch out for:**
- Elderly over gross limit can still qualify via Net + Assets (missed by many).[1]
- Medical expenses deductible for 60+ (out-of-pocket >$35/month boosts eligibility).[2]
- Social Security/pensions count as income; only ~40% eligible elderly participate.[6]
- No asset test for most, but app asks anyway.[1]
- Broadened gross to 200% FPG since 2023; older info shows stricter limits.[5]

**Data shape:** Elderly/disabled: simplified to Net test if under 200% FPG gross (no assets); over uses federal $4500 assets. Benefits scale precisely by household size/net income. Statewide expanded beyond federal minimums.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov/programs-services/food-stamps (or via NHEasy: https://www.nheasy.nh.gov)

---

### LIHEAP (Low-Income Home Energy Assistance Program)


**Eligibility:**
- Income: Gross monthly income limits (2025): 1 person $3,967; 2 people $5,187; 3 people $6,408; 4 people $7,629; 5 people $8,849; 6 people $10,070. Annual guidelines at 75% state median (e.g., 1 person $48,711; 2 $63,699; 3 $78,688; 4 $93,676; 5 $108,664; 6 $123,653; 7 $126,463; 8 $129,274) may apply for related emergency aid. Everyone at the address counts as household, including roommates on same utility bill.[1][4]
- Assets: No asset limit.[1]
- Must reside in New Hampshire.
- Renters and homeowners eligible.
- Priority for elderly, disabled, families with young children under 6.
- Available for heating season (fall/winter); crisis for emergencies like shutoffs or broken furnace. Cooling not offered.[1][2][5]

**Benefits:** Heating assistance: $94 minimum to $2,177 maximum per household, paid directly to heating vendor. Winter crisis: up to $2,177. No summer crisis. Varies by income, household size, fuel type. Does not count as income for other programs.[1][2][5]
- Varies by: household_size|priority_tier

**How to apply:**
- Contact regional Community Action Agency by phone for appointment (e.g., Belknap/Merrimack: 603-223-0043; Rockingham: 603-436-3896; Strafford: 603-435-2500).
- In-person at local Community Action offices (open M-F 8:30am-4:30pm year-round). Pre-applications for priority (elderly/disabled/young kids) after July 1; others after Sept 1 for 2025-2026 season. Applications start ~July 30, 2025, until funds exhausted.[2][3][5]
- Mail or other routes via local agency.

**Timeline:** Not specified; apply early as funds limited.
**Waitlist:** No waitlist mentioned; funding awarded until depleted.

**Watch out for:**
- Household includes all at address on same utility (even non-sharing roommates).[1]
- Not year-round; heating seasonal (Oct onward), crisis only for emergencies.[1][2]
- Apply early (July 30, 2025 start); funds run out.[2][5]
- Priority pre-apps July 1 for elderly/disabled/kids under 6; others Sept 1.[5]
- Separate from state emergency aid (60-75% median) or HEA weatherization.[4][6]

**Data shape:** Administered regionally by Community Action Agencies; benefits scale by household size, income, fuel type, priority (elderly/disabled prioritized); seasonal with early funding exhaustion.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.energy.nh.gov/ (NH Department of Energy); local via CAPNH at https://www.caphr.org/services/fuel-assistance

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Eligibility is determined by qualification for New Hampshire Fuel Assistance Program (FAP) or Electric Assistance Program (EAP), typically at or below 200% of Federal Poverty Guidelines (FPG). Exact dollar amounts vary annually and by household size; families must apply through FAP/EAP to confirm current limits. Priority given to elderly, disabled households, families with children under 6, high energy burden households, and long-term FAP participants[1][2][3][5].
- Assets: No specific asset limits mentioned; focus is on income qualification via FAP/EAP[1][2].
- Must qualify for and/or participate in Fuel Assistance Program (FAP) or Electric Assistance Program (EAP)[1][2][3][5].
- Home cannot have significant structural issues, disrepair, leaking roof, or failing plumbing/electrical systems[1].
- Homeowners (including mobile/stick-built) and renters eligible; renters require landlord permission[1][2][3].
- Homes previously weatherized after September 1994 generally ineligible (case-by-case for others)[1][2].
- For multi-unit buildings, at least 66% must be enrolled in fuel/electric assistance[2].

**Benefits:** Free energy conservation services including: energy audit, air sealing, insulation, LED bulbs, low-flow devices, ventilation, health/safety devices (e.g., smoke/CO alarms), potential refrigerator replacement, limited heating system repairs/replacements. Services determined by audit cost-effectiveness and health/safety standards; partnerships with utilities (Eversource, Unitil, NH Electric Co-op, Liberty Utilities) may add measures[1][2][3][4][5].
- Varies by: priority_tier|region

**How to apply:**
- Apply through Fuel Assistance Program (FAP) or Electric Assistance Program (EAP) application; answer 'YES' to weatherization interest question[1][2][3][5].
- Contact regional Community Action Partnership (CAP) agencies: e.g., CAPBM (Merrimack/Belknap: capbm.org), CAPHR (Hillsborough/Rockingham: caphr.org), CAPSC Strafford (email: weatherization@straffordcap.org, phone: 603-435-2500 x 2350, mail: 577 Central Ave. Suite 10, Dover NH 03820, online application available)[1][3][5].
- Statewide: Contact NH Department of Energy or local CAP via NH Office of Strategic Initiatives (no central phone/URL specified in results)[5][7].

**Timeline:** Not specified; involves energy audit, contractor work, and follow-up inspection[1][2][3].
**Waitlist:** Funding limited; priority tiers affect access, but no specific waitlist details[1][5].

**Watch out for:**
- Must first qualify via FAP/EAP application—WAP is not standalone[1][2][3][5].
- Renters need landlord permission; multi-unit requires 66% enrollment[1][2].
- Homes weatherized post-1994 generally ineligible[1][2].
- No fixes for structural issues, minor tune-ups, or ongoing repairs—focus on energy conservation only[1].
- Heating repairs/replacements limited, especially for rentals[1].
- Regional CAP assignment required; not all NH covered uniformly in results.

**Data shape:** Eligibility tied directly to FAP/EAP (200% FPG, varies by household size annually); priority tiers (elderly, disabled, young children); administered regionally by CAPs with county restrictions; free services based on energy audit, not fixed dollar amounts.

**Source:** https://www.energy.nh.gov/ (NH Department of Energy administers statewide; regional CAPs handle delivery; federal overview at energy.gov[5][7])

---

### SHIP (State Health Insurance Assistance Program)


**Eligibility:**
- Income: No income or asset limits; open to all Medicare beneficiaries, their families, and caregivers seeking health insurance counseling[2][3][4][5][6].
- Assets: No asset limits apply[2][4][6].
- Must be a Medicare beneficiary or family member/caregiver with questions about Medicare or related insurance; services are free and confidential with no personal information shared unless requested[2][5]

**Benefits:** Free one-on-one personalized health insurance counseling, information and printed materials, referrals to agencies; covers Medicare Part A/B, Part D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, and other programs; helps understand benefits, compare options, avoid overpayment[2][4][5][6].

**How to apply:**
- Phone: 1-866-634-9412 (toll-free, 8am-4pm or by appointment)[3][5]
- Website: http://www.servicelink.nh.gov/medicare/index.htm[5]
- In-person: Appointments via ServiceLink Resource Center, NH DHHS Bureau of Elderly & Adult Services, 105 Pleasant St., Gov. Gallan State Office Park S., Concord NH 03301-3857[5]

**Timeline:** Immediate counseling available by phone or appointment; no formal processing as it's direct service[2][5].

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling and education, no direct payment or services; does not handle enrollments itself but refers/guides; people confuse with Medicare Savings Programs (which SHIP counselors explain but have separate eligibility like income up to $1,660 single/$2,239 couple for QI/SLMB-135 and assets $9,090 single/$13,630 couple)[1][2][4]
- Requires trained counselors/volunteers; availability by appointment outside 8am-4pm[5]
- Focuses on Medicare navigation, not general Medicaid or long-term care applications (though refers)[2][6]

**Data shape:** no income/asset test; counseling-only service statewide via single provider (ServiceLink); refers to programs with limits like MSPs but SHIP itself is universal for Medicare-related questions

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** http://www.servicelink.nh.gov/medicare/index.htm

---

### Meals on Wheels (Elderly Nutrition Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits for those 60+; low-income requirement applies only to adults 18-59 with disabilities[1][6]. No specific dollar amounts or household size tables provided in sources.
- Assets: No asset limits mentioned in sources.
- Homebound or difficulty leaving home, shopping, and preparing meals[1][2][3][6]
- Unable to meet basic nutritional needs, temporarily or long-term[1]
- Residency in the specific county or service area of the local provider (e.g., Rockingham County, Hillsborough County, Gibson Center towns)[1][4][5]
- For under 60: disability, recuperating from illness/procedure, or chronic illness, and under physician care[1][4][6]

**Benefits:** Home-delivered nutritionally balanced meals, typically one meal per weekday (5 meals per week); certified by dietitians; may include congregate dining or grab-and-go options[5][7]
- Varies by: region

**How to apply:**
- Contact local provider or Area Agency on Aging for your region (use Meals on Wheels NH provider search at https://mealsonwheelsnh.org or https://www.mealsonwheelsamerica.org/find-meals-and-services/ )[3][7]
- Online referral forms (e.g., Gibson Center: https://www.gibsoncenter.org/meals-on-wheels-referral-form/ )[4]
- Phone or in-person via local programs (e.g., Rockingham: https://rockinghammealsonwheels.org/register/ )[1]

**Timeline:** Varies; some within a week, longer if waitlist[2]
**Waitlist:** Possible depending on program and demand[2]

**Watch out for:**
- Not statewide—must confirm residency in specific provider's delivery zone; living outside means no service[1][2][4][5]
- Car ownership or ability to leave home easily may disqualify[2]
- Under 60 requires disability, income limits, and often physician care—stricter than 60+[1][4][6]
- Spouses/dependents sometimes eligible, but verify locally[2][6]
- Contact local Area Agency on Aging first, as national sites don't handle applications[2]

**Data shape:** Decentralized by local non-profit providers with county/town restrictions; no uniform income test for 60+ but required for younger disabled; varies by region including service areas and exact rules

**Source:** https://mealsonwheelsnh.org (Meals on Wheels New Hampshire coalition); local providers via https://www.mealsonwheelsamerica.org/find-meals-and-services/

---

### Family Caregiver Support Program


**Eligibility:**
- Income: No specific income limits or asset limits mentioned in program details; services available to caregivers of all income levels through Aging and Disability Resource Centers[2][5].
- Assets: No asset limits specified; no details on what counts or is exempt.
- Adult family members or informal caregivers (18+ years old) providing care to individuals 60 years and older[3][4].
- Caregivers (18+ years old) for individuals of any age with Alzheimer’s disease or related disorders (must live under the same roof; care recipient unable to follow through after cuing)[3][4].
- Grandparents or relative caregivers 55+ years old providing care to children under 18 (in absence of parent; live full-time with child)[3][4][5].
- Grandparents, relative caregivers, or parents 55+ years old providing care to adults 18-59 with disabilities (priority for severe disabilities)[3][4].
- Care recipient (for Title III-E) requires assistance with at least two Activities of Daily Living (ADLs)[4].

**Benefits:** Information about community programs and resources; assistance accessing services; individual counseling and support groups; education and caregiver training; respite care (temporary break for full-time caregivers); limited supplemental services including chore services, assistive equipment, home modifications, and transportation[3][4][5].
- Varies by: priority_tier

**How to apply:**
- Phone: 866-634-9412[5].
- Aging and Disability Resource Centers (ADRCs) as single point of entry[2].
- Granite State Independent Living: 603-228-9680 or 800-826-3700[2].

**Timeline:** No specific timeline provided in sources.

**Watch out for:**
- No direct payment to caregivers (unlike Medicaid CFI program); focuses on support services and respite only[1][5].
- Specific subgroups have age requirements (e.g., 55+ for grandparents/relatives caring for children or disabled adults)[3][4].
- Medicare alone does not qualify (relevant for confusion with other programs)[1].
- Priority given to caregivers of adults with severe disabilities or certain populations[4].
- Caregivers for dementia must live under the same roof[4].

**Data shape:** Funded under National Family Caregiver Support Program (Older Americans Act Title III-E); no income/asset test; tiered by caregiver/care recipient type (e.g., age 60+, ADRD, grandparents 55+); services via regional ADRCs statewide[2][3][4][5].

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov (inferred from program context; see also national: http://acl.gov/programs/support-caregivers/national-family-caregiver-support-program)[3][4]

---

### SCSEP (Senior Community Service Employment Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. Exact dollar amounts vary annually by household size and are updated in HHS Poverty Guidelines (effective January 15, 2025 per DOL); consult current guidelines for precise figures as they are not specified in static NH sources[1][2].
- Assets: No asset limits mentioned in program sources.
- Unemployed at time of enrollment
- Resident of New Hampshire
- Eligible to work in the United States
- Desire to learn/refresh job skills as a path to employment

**Benefits:** Part-time community service work (average 20 hours per week) at non-profit/public facilities (e.g., schools, hospitals, day-care centers, senior centers); paid stipend at the highest of federal, state, or local minimum wage; job search assistance and guidance toward unsubsidized permanent employment.
- Varies by: priority_tier

**How to apply:**
- Phone: Operation ABLE (NH provider) - specific number not in results; national toll-free: 1-877-872-5627 (1-877-US2-JOBS)
- Online: CareerOneStop Older Worker Program Finder (national tool to locate NH providers)
- In-person: Contact local NH SCSEP provider such as Operation ABLE for offices

**Timeline:** Not specified
**Waitlist:** Not specified; may vary by demand and priority

**Watch out for:**
- Enrollment priority given first to veterans/qualified spouses, then over 65, disabled, low literacy, limited English, rural residents, homeless/at-risk, low prospects, or prior American Job Center users - may delay non-priority applicants[2]
- Program is temporary training bridge to unsubsidized jobs, not permanent employment
- Must be actively unemployed and seeking skills refresh; not for current workers
- Income calculated as family income at 125% FPL - check current guidelines as they update yearly

**Data shape:** Federally uniform but locally administered via grantees like Operation ABLE in NH; priority tiers affect access; no fixed dollar benefits (stipend ties to minimum wage); income test at 125% FPL scales by household size per annual HHS guidelines

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### Legal Assistance for Older Adults


**Eligibility:**
- Age: 60+
- Income: No strict income limits; program prioritizes low-income seniors but serves all eligible applicants age 60+ regardless of income[2][3][5]
- Assets: No asset limits; designed to help low-income, isolated, and/or institutionalized older persons, but open to all age 60+[5]
- New Hampshire resident
- Civil legal issues relevant to seniors (e.g., housing, public benefits, family law, consumer issues, estate planning)[2][3][5]

**Benefits:** Free civil legal services including representation at hearings/court, advice, negotiation (e.g., with landlords), assistance navigating government programs (e.g., Medicare/Medicaid appeals), education for community groups; covers consumer contracts, debt collection, utility shutoffs, healthcare, housing/landlord-tenant, domestic/family issues, estate planning/probate/wills/power of attorney[2][3][5][6]

**How to apply:**
- Phone: 1-888-353-9944 (Senior Law Project); TTY: 7-1-1 or 1-800-735-2964[5]
- Phone: 1-800-639-5290 (603 Legal Aid centralized intake)[3]
- Online: Connect via 603 Legal Aid at www.603legalaid.org[3]
- In-person: NH Legal Assistance, 93 North State Street, Suite 200, Concord, NH 03301 (intake 9:00 am - 12:30 pm Mon-Wed)[3][7]
- Mail: NH Legal Assistance, 117 North State Street, Concord, NH 03301[5]

**Timeline:** Not specified in sources

**Watch out for:**
- No income/asset limits but prioritizes low-income/isolated/institutionalized seniors, so higher-resource applicants may be deprioritized[5]
- Focuses on civil legal aid only (not criminal cases)[3]
- Specific to common senior issues; not general legal advice or private attorney services[2][5]
- Some links outdated (e.g., nhla.org/seniors-17 not working as of 2021)[2]

**Data shape:** no income test; statewide via centralized intake; prioritizes low-income/isolated seniors without hard limits; advocacy/representation only

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nhla.org or https://www.603legalaid.org[3]

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; program is free and available to all regardless of financial status.
- Assets: No asset limits; no financial tests apply.
- Must be a resident (or family/staff on behalf of resident) of a long-term care facility in New Hampshire, including nursing homes, assisted living facilities, long-term rehabilitation centers, adult day care facilities, or hospice centers.

**Benefits:** Free and confidential advocacy services, including resolving complaints about care quality, obtaining information on facilities, representing interests to ensure fair treatment, dignity, and respect; collaborates with residents, families, facility staff, and lawmakers; does not provide direct patient care.

**How to apply:**
- Phone: Toll Free (800) 442-5640, Local (603) 271-4375 (Hours: 8:00 am - 4:30 pm)
- Fax: (603) 271-5574
- Mail/In-person: New Hampshire Office of the Long-Term Care Ombudsman, 129 Pleasant Street, Concord, NH 03301-3857
- Website: https://www.dhhs.state.nh.us

**Timeline:** Not specified; services provided as needed upon contact for complaints or information.

**Watch out for:**
- Not a direct care or financial assistance program—focuses solely on advocacy and complaint resolution, not medical treatment or funding.
- Services are for facility residents only, not home-based care.
- Confidential and free, but requires contact to initiate; no automatic enrollment.
- People may miss that it's available to families and staff, not just residents.

**Data shape:** no income test; advocacy-only for long-term care facility residents statewide; free/confidential with direct phone access

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.state.nh.us

---

### Adult Day Services

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Tied to New Hampshire Medicaid eligibility. For long-term care services like adult day (2025 figures): $2,901/month for an individual. Varies by household size and marital status; married couples with one applicant allow community spouse up to $157,920 in assets (income not specified per household size in sources). Annual adjustments apply.[2]
- Assets: Medicaid-linked: $2,500 countable assets for a single applicant. Community spouse can retain higher amount up to $157,920. Countable assets typically include bank accounts, investments; exempt generally include primary home (if intent to return), one vehicle, personal belongings, burial funds (specific exemptions follow federal Medicaid rules).[2]
- Eligible for New Hampshire Medicaid
- Living in own home, relative's, or friend's home
- At risk for immediate institutionalization without services
- Physical exam and physician referral within 60 days of request
- Diagnosed subacute or chronic illness (excludes primary mental illness or intellectual/developmental disability)
- Needs services at least 4 hours/day on regularly scheduled basis (1+ days/week)
- Needs cannot exceed what provider can meet; not a danger to self/others
- New Hampshire resident; U.S. citizen or qualified immigrant[1][2]

**Benefits:** Adult medical day care services including health monitoring, medication management, therapeutic activities, nutritional meals, supervision, socialization. Provided minimum 4 hours/day on scheduled basis. Staffing includes at least one RN or LPN on site. Care plan developed with physician orders, reviewed every 90 days.[1][3][7]
- Varies by: priority_tier

**How to apply:**
- Contact New Hampshire Department of Health and Human Services (DHHS) Bureau of Elderly and Adult Services for Medicaid eligibility screening (phone not specified in sources; start via DHHS Medicaid intake)
- Physician referral and physical exam required prior to initiation
- Provider determines eligibility per He-E 803.04 and must be licensed under He-P 818, Medicaid-enrolled[1][3]

**Timeline:** Not specified in sources
**Waitlist:** Not specified; may vary by provider capacity as needs cannot exceed services offered[1]

**Watch out for:**
- Must be Medicaid-eligible first; not standalone program
- Excludes primary mental health or developmental disability needs
- Physician exam/referral within 60 days mandatory
- At risk of institutionalization required; provider can deny if needs exceed capacity
- Minimum 4 hours/day commitment; not for those needing 24-hour care
- Income/asset limits apply via Medicaid (2025: $2,901/mo individual, $2,500 assets); spousal protections differ[1][2]

**Data shape:** Medicaid-funded via State Plan (non-waiver) or waivers; eligibility hinges on Medicaid qualification + medical/nursing-level need; provider-specific with statewide licensing but local delivery; no fixed hours cap beyond minimum, scales by care plan

**Source:** https://www.dhhs.nh.gov/programs-services/medicaid (DHHS Medicaid); Rules at N.H. Admin. Code § He-E 803

---

### Easterseals NH In-Home Care & Health Services

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income limits or tables stated for this program; accepts Medicaid, which has its own eligibility criteria, long-term care insurance, private pay, and Veterans’ vouchers[4].
- Assets: No asset limits mentioned; Medicaid eligibility may apply if using that payment method, but details not provided here.
- Services available to older adults, people with chronic illness, or disabilities needing in-home support (statewide Caring Companions Program for non-medical care)[7]
- Primarily for elderly or those requiring nursing, homemaker, or personal care services[4]
- Services subject to staff availability in served areas[4]

**Benefits:** Nursing services (medication management, routine health and wellness checks); Homemaker services (light housekeeping, errands, laundry, meal preparation); Personal Care services (assistance with bathing and daily personal routines); non-medical home care via Caring Companions Program[4][7]. No specific dollar amounts or hours per week stated; personalized care plans created after home visit[4].
- Varies by: region

**How to apply:**
- Phone: 603-845-9318 for free consultation[4]
- Online inquiry form via eastersealsnh.org/programs/senior-services/in-home-care-health-services/[4]
- Home visit arranged after initial contact to create personalized care plan[4]

**Timeline:** Home visit arranged after contact; no specific processing timeline stated[4].
**Waitlist:** Services subject to staff availability, implying potential delays but no formal waitlist mentioned[4].

**Watch out for:**
- Not a free government waiver program with strict eligibility like MI Choice; primarily private pay, insurance, Medicaid, or Veterans-funded with potential out-of-pocket costs[4]
- Services limited by staff availability, so access may vary even in served areas[4]
- No detailed eligibility criteria published (e.g., no income/asset tables), requiring direct contact for assessment[4]
- Focuses on specific regions with statewide intent, but not guaranteed everywhere[4][7]

**Data shape:** Private/non-profit in-home care provider accepting multiple payments; no fixed income/asset tests or age minimum published; availability staff-dependent with regional focus; personalized plans post-assessment rather than standardized benefits

**Source:** https://eastersealsnh.org/programs/senior-services/in-home-care-health-services/[4]

---

### Caregiver Respite and Senior Volunteer Programs

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: No specific income limits mentioned in available sources; all family caregivers encouraged to explore options[3]. For related NH Caregiver Support Program, caregiver must be 55+ with priority to those caring for adults with severe disabilities, but no dollar amounts provided[6].
- Assets: No asset limits or details on what counts/exempt mentioned.
- Caregiver must be unpaid[3]
- Priority for caregivers of adults with severe disabilities in some programs[6]
- Care recipient typically 55+ or with disabilities/special needs[6][8]

**Benefits:** Respite grants for in-home respite (family member/friend hired by agency for personal care, homemaking, companionship), adult day programs, impromptu/emergency respite (limited to 10% of budget); supplemental services on limited basis; individual counseling, support groups, training[3][6]. Private providers offer short-term stays (3+ days), in-home hours (few hours/week to 24/7), personal care, meals, activities[1][2][4].
- Varies by: region

**How to apply:**
- Contact Monadnock or Sullivan County Aging and Disability Resource Centers for options counselor (home visit possible)[3]
- Call local providers like Comfort Keepers Plymouth for in-home assessment[2]
- Contact St. Teresa Rehab Center or As Life Goes On for stays[1][4]

**Timeline:** Not specified.
**Waitlist:** Options and beds may be limited; every effort for preferred facility but availability varies[8].

**Watch out for:**
- Program is not fully centralized—must contact specific regional Aging and Disability Resource Centers or local providers; private options (e.g., St. Teresa, Comfort Keepers) are fee-based, not free grants[1][2][3]
- Impromptu respite limited to 10% of budget[6]
- Availability/beds limited, especially for preferred facilities[8]
- Senior volunteer programs mentioned in title but no specific details in sources[7]
- Eligibility encouragement is broad, but grants require assessment[3]

**Data shape:** Decentralized by region with local Aging and Disability Resource Centers as key access points; mix of state-funded grants (NH Family Caregiver Program) and private paid services; no uniform income/asset tests or statewide processing times

**Source:** No single primary .gov URL identified; closest is NH Care Collaborative (nhcare-c.org) for regional implementation and UNH CHHS PDF on NH Family Caregiver Support Program[3][6].

---

### AmeriCorps Senior Companion Program (NH)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Single: $21,660–$25,760 (sources vary slightly); Couple: $29,140–$34,840 (sources vary slightly). Out-of-pocket medical expenses may be deducted to meet eligibility standards.[1][4]
- Must pass a comprehensive Criminal History Check[1]
- Must have reliable transportation and required auto insurance coverage to transport homebound adults[2]
- Must commit to a minimum of 10 hours per week of volunteer service[1]

**Benefits:** $3.00 per hour stipend (tax-free and non-reportable); mileage reimbursement; paid personal leave and holidays; accident and liability insurance; training opportunities; recognition events[1][2]
- Varies by: fixed

**How to apply:**
- Phone: (603) 225-3295 or 1-800-856-5525[1][3]
- Contact: Kathleen Stuart, Program Coordinator, Community Action Program, (603) 225-3295 ext. 1114; kstuart@bm-cap.org[3][5]
- In-person: Community Action Program in Concord[1]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- Income limits vary slightly across sources ($21,660–$25,760 for single; $29,140–$34,840 for couple)—confirm exact current limits when applying[1][4]
- Companions do NOT provide housekeeping, meal preparation, or personal care[2][3]
- Visits are only available Monday–Friday, 8:30 a.m.–4:30 p.m.[2][3]
- Stipend is $3.00/hour, which is modest; this is a volunteer program, not employment[1]
- Stipend does NOT affect financial or housing assistance, but confirm this with your benefits administrator[3]
- Volunteers must have their own reliable transportation and auto insurance to transport clients[2]
- Eligibility for *receiving* companionship requires being 60+ and frail/homebound, OR any age with serious disability, OR a caregiver of adults with Alzheimer's[1]

**Data shape:** This is a federal Senior Corps program with statewide reach but county-based administration. Income limits are the primary eligibility gate. The program is volunteer-based with a modest stipend, not a direct service benefit. Key distinction: eligibility for *volunteering* (55+, low-income) differs from eligibility for *receiving* services (60+, frail/homebound, or caregiver). Processing timelines and waitlist status are not documented in available sources.

**Source:** https://www.manchesternh.gov/Departments/Senior-Services/AmeriCorps-Senior-Companion-Program

---

### Monadnock at Home Community Services

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income or asset limits mentioned; open to seniors able to benefit from membership.
- Assets: No asset limits or exemptions specified.
- Must reside in specific towns: Dublin, Fitzwilliam, Greenfield, Hancock, Harrisville, Jaffrey, Marlborough, New Ipswich, Peterborough, Rindge, Sharon, and Temple.
- Targeted at seniors seeking to maintain independence at home.

**Benefits:** Central access to services via one phone call; volunteers for basic home maintenance/technical help; network of vetted providers (home maintenance, home health aides, auto repair, pet care); grocery/medication delivery; transportation to medical appointments and weekly grocery trips; check-in calls/companion visits; social/wellness/educational programming; volunteer opportunities.

**How to apply:**
- Contact via website form at https://www.cc-nh.org/services/senior-support-services/monadnock-at-home/ (click to request help)
- Phone or email through Monadnock at Home (specific number not listed; operates via Catholic Charities NH)

**Timeline:** Not specified.

**Watch out for:**
- Requires nominal membership fee (not free); geographic restriction to 12 specific towns only; not a government-funded entitlement program but a membership-based service network; no detailed application phone number listed—use contact form.

**Data shape:** town-restricted to 12 Monadnock Region communities; membership model with fee, not needs-tested; partners with local entities like Monadnock Community Hospital and CVTC for services.

**Source:** https://www.cc-nh.org/services/senior-support-services/monadnock-at-home/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid for Aged, Blind, Disabled (ABD) | benefit | state | deep |
| Choices for Independence (CFI) Waiver | benefit | state | deep |
| NH PACE (Program of All-Inclusive Care f | benefit | local | deep |
| Qualified Medicare Beneficiary (QMB), Sp | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| LIHEAP (Low-Income Home Energy Assistanc | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| SHIP (State Health Insurance Assistance  | resource | federal | simple |
| Meals on Wheels (Elderly Nutrition Progr | benefit | federal | deep |
| Family Caregiver Support Program | benefit | state | deep |
| SCSEP (Senior Community Service Employme | employment | federal | deep |
| Legal Assistance for Older Adults | resource | state | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Adult Day Services | benefit | state | deep |
| Easterseals NH In-Home Care & Health Ser | benefit | state | medium |
| Caregiver Respite and Senior Volunteer P | benefit | local | medium |
| AmeriCorps Senior Companion Program (NH) | resource | state | simple |
| Monadnock at Home Community Services | benefit | local | medium |

**Types:** {"benefit":13,"resource":4,"employment":1}
**Scopes:** {"state":7,"local":3,"federal":8}
**Complexity:** {"deep":11,"simple":4,"medium":3}

## Content Drafts

Generated 18 page drafts. Review in admin dashboard or `data/pipeline/NH/drafts.json`.

- **Medicaid for Aged, Blind, Disabled (ABD)** (benefit) — 3 content sections, 6 FAQs
- **Choices for Independence (CFI) Waiver** (benefit) — 2 content sections, 6 FAQs
- **NH PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 3 content sections, 5 FAQs
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI/SLMB-135)** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **LIHEAP (Low-Income Home Energy Assistance Program)** (benefit) — 5 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 4 content sections, 6 FAQs
- **SHIP (State Health Insurance Assistance Program)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels (Elderly Nutrition Program)** (benefit) — 4 content sections, 6 FAQs
- **Family Caregiver Support Program** (benefit) — 3 content sections, 6 FAQs
- **SCSEP (Senior Community Service Employment Program)** (employment) — 3 content sections, 6 FAQs
- **Legal Assistance for Older Adults** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Adult Day Services** (benefit) — 4 content sections, 6 FAQs
- **Easterseals NH In-Home Care & Health Services** (benefit) — 2 content sections, 6 FAQs
- **Caregiver Respite and Senior Volunteer Programs** (benefit) — 3 content sections, 6 FAQs
- **AmeriCorps Senior Companion Program (NH)** (resource) — 3 content sections, 6 FAQs
- **Monadnock at Home Community Services** (benefit) — 3 content sections, 5 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_type**: 1 programs
- **priority_tier**: 5 programs
- **region**: 4 programs
- **household_size**: 1 programs
- **household_size|priority_tier**: 1 programs
- **priority_tier|region**: 1 programs
- **not_applicable**: 4 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid for Aged, Blind, Disabled (ABD)**: ABD is a categorical umbrella with multiple sub-programs (Aid to the Needy Blind, APTD, MEAD, MOAD, Choices for Independence), each with distinct eligibility, benefits, and income/asset limits. Search results provide general ABD framework but lack specific dollar amounts for most income limits and detailed benefit schedules. Long-term care ABD programs have well-defined asset limits ($2,500/$7,500) and home equity rules, but non-long-term-care ABD programs' financial thresholds are not detailed. Applicants must contact DHHS directly for program-specific details. No regional variations documented in search results.
- **Choices for Independence (CFI) Waiver**: Medicaid 1915(c) waiver program; eligibility determined by DHHS; services person-centered via regional case managers; no fixed benefit amounts—varies by assessed needs and local providers[1][2][3]
- **NH PACE (Program of All-Inclusive Care for the Elderly)**: No operational programs in NH; eligibility tied to non-existent provider service areas; no income/asset tests but requires state NFLOC certification and proximity to center; national model with state-specific rollout barriers.
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI/SLMB-135)**: Tiered by income brackets (QMB <100% FPL, SLMB 100-120%, QI 120-135%); NH uses federal assets + state $13 disregard; benefits degrade by tier (full cost-sharing to premiums only)
- **SNAP (Supplemental Nutrition Assistance Program)**: Elderly/disabled: simplified to Net test if under 200% FPG gross (no assets); over uses federal $4500 assets. Benefits scale precisely by household size/net income. Statewide expanded beyond federal minimums.
- **LIHEAP (Low-Income Home Energy Assistance Program)**: Administered regionally by Community Action Agencies; benefits scale by household size, income, fuel type, priority (elderly/disabled prioritized); seasonal with early funding exhaustion.
- **Weatherization Assistance Program (WAP)**: Eligibility tied directly to FAP/EAP (200% FPG, varies by household size annually); priority tiers (elderly, disabled, young children); administered regionally by CAPs with county restrictions; free services based on energy audit, not fixed dollar amounts.
- **SHIP (State Health Insurance Assistance Program)**: no income/asset test; counseling-only service statewide via single provider (ServiceLink); refers to programs with limits like MSPs but SHIP itself is universal for Medicare-related questions
- **Meals on Wheels (Elderly Nutrition Program)**: Decentralized by local non-profit providers with county/town restrictions; no uniform income test for 60+ but required for younger disabled; varies by region including service areas and exact rules
- **Family Caregiver Support Program**: Funded under National Family Caregiver Support Program (Older Americans Act Title III-E); no income/asset test; tiered by caregiver/care recipient type (e.g., age 60+, ADRD, grandparents 55+); services via regional ADRCs statewide[2][3][4][5].
- **SCSEP (Senior Community Service Employment Program)**: Federally uniform but locally administered via grantees like Operation ABLE in NH; priority tiers affect access; no fixed dollar benefits (stipend ties to minimum wage); income test at 125% FPL scales by household size per annual HHS guidelines
- **Legal Assistance for Older Adults**: no income test; statewide via centralized intake; prioritizes low-income/isolated seniors without hard limits; advocacy/representation only
- **Long-Term Care Ombudsman Program**: no income test; advocacy-only for long-term care facility residents statewide; free/confidential with direct phone access
- **Adult Day Services**: Medicaid-funded via State Plan (non-waiver) or waivers; eligibility hinges on Medicaid qualification + medical/nursing-level need; provider-specific with statewide licensing but local delivery; no fixed hours cap beyond minimum, scales by care plan
- **Easterseals NH In-Home Care & Health Services**: Private/non-profit in-home care provider accepting multiple payments; no fixed income/asset tests or age minimum published; availability staff-dependent with regional focus; personalized plans post-assessment rather than standardized benefits
- **Caregiver Respite and Senior Volunteer Programs**: Decentralized by region with local Aging and Disability Resource Centers as key access points; mix of state-funded grants (NH Family Caregiver Program) and private paid services; no uniform income/asset tests or statewide processing times
- **AmeriCorps Senior Companion Program (NH)**: This is a federal Senior Corps program with statewide reach but county-based administration. Income limits are the primary eligibility gate. The program is volunteer-based with a modest stipend, not a direct service benefit. Key distinction: eligibility for *volunteering* (55+, low-income) differs from eligibility for *receiving* services (60+, frail/homebound, or caregiver). Processing timelines and waitlist status are not documented in available sources.
- **Monadnock at Home Community Services**: town-restricted to 12 Monadnock Region communities; membership model with fee, not needs-tested; partners with local entities like Monadnock Community Hospital and CVTC for services.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Hampshire?
