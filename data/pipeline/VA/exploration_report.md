# Virginia Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 2.1m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 15 |
| New (not in our data) | 8 |
| Data discrepancies | 7 |
| Fields our model can't capture | 7 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 7 | Our model has no asset limit fields |
| `regional_variations` | 6 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 7 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 8 programs
- **financial**: 4 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Program of All-Inclusive Care for the Elderly (PACE) in Virginia

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `All Medicare and Medicaid-covered services plus additional services determined medically necessary, including: prescription medications, dentistry, adult day care, occupational and physical therapy, hospital care, primary care, respite care, and any other services needed to support health. Covers nursing facility care if needed long-term or temporarily (only 7% of enrollees live in nursing facilities). Provided by an interdisciplinary team for individualized, coordinated care aligned with personal goals.[1][5]` ([source](https://www.dmas.virginia.gov/for-members/benefits-and-services/other-programs-and-guidelines/pace/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dmas.virginia.gov/for-members/benefits-and-services/other-programs-and-guidelines/pace/`

### Medicare Savings Programs (QMB, SLMB, QI)

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `[object Object]` ([source](https://www.dmas.virginia.gov (Virginia Department of Medical Assistance Services)))
- **source_url**: Ours says `MISSING` → Source says `https://www.dmas.virginia.gov (Virginia Department of Medical Assistance Services)`

### Supplemental Nutrition Assistance Program (SNAP)

- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly SNAP allotments vary by household size. For Oct. 1, 2025 - Sept. 30, 2026: 1 person = $298/month, 2 people = $546/month, 3 people = $785/month, 4 people = $994/month, 5 people = $1,183/month, 6 people = $1,421/month, 7 people = $1,571/month, 8 people = $1,789/month, plus $218 per additional member.[5]` ([source](https://www.dss.virginia.gov/benefit/snap.cgi))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.virginia.gov/benefit/snap.cgi`

### Low-Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2355` → Source says `$1,956` ([source](https://www.dss.virginia.gov/benefit/ea/))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Regular: Heating max $703 (min $198), Cooling max $700 (min $50). Crisis: Winter max $4,200, Summer not available. Payments made directly to utility company. Related: Weatherization for energy efficiency upgrades.[2]` ([source](https://www.dss.virginia.gov/benefit/ea/))
- **source_url**: Ours says `MISSING` → Source says `https://www.dss.virginia.gov/benefit/ea/`

### Virginia Insurance Counseling and Assistance Program (VICAP) - Virginia's SHIP

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, unbiased one-on-one counseling and education on Medicare options (Parts A, B, C, D, Medigap), plan comparisons, eligibility/enrollment rules, financial assistance applications (e.g., Medicaid, Medicare Savings Programs, Extra Help/Low-Income Subsidy), appeals of denied claims, managing bills, fraud prevention via Senior Medicare Patrol (SMP), outreach presentations, and referrals. Delivered by trained staff/volunteers in-person, phone, or events. No sales of insurance products[1][2][3][5][7].` ([source](https://www.shiphelp.org/ships/virginia/ (VICAP) or https://www.dars.virginia.gov (Virginia DARS administers)[3][7]))
- **source_url**: Ours says `MISSING` → Source says `https://www.shiphelp.org/ships/virginia/ (VICAP) or https://www.dars.virginia.gov (Virginia DARS administers)[3][7]`

### Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Advocacy services including investigating complaints, resolving issues related to care quality, residents' rights violations (e.g., poor food quality, unsanitary conditions, staff shortages, hygiene issues, roommate conflicts), promoting the Residents' Bill of Rights, providing information on rights, and supporting residents in exercising those rights. Ombudsmen listen, observe, negotiate, and communicate on behalf of residents.` ([source](https://dars.virginia.gov/aging/ombudsman/))
- **source_url**: Ours says `MISSING` → Source says `https://dars.virginia.gov/aging/ombudsman/`

### Commonwealth Coordinated Care Plus (CCC+) Waiver

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Home and Community-Based Services (HCBS) including personal care, companion care, adult day health care, skilled nursing, respite (480 hours per state fiscal year, July 1-June 30), environmental modifications (up to $5,000 per calendar year), assistive technology (up to $5,000 per calendar year), private duty nursing (up to 112 hours per week), transition services (up to $5,000 per lifetime). Services determined by comprehensive assessment; Consumer-Directed Services (CDS) option allows hiring own attendants, including some family members.[2][4]` ([source](https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/[3]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/[3]`

## New Programs (Not in Our Data)

- **Medicaid for Persons Who are Aged, Blind, or Disabled (ABD)** — service ([source](https://coverva.dmas.virginia.gov/learn/coverage-for-adults/medicaid-for-persons-who-are-aged-blind-or-disabled-abd/ and https://www.dmas.virginia.gov/for-applicants/populations-served/for-adults/aged-blind-or-disabled/))
  - Shape notes: This program has multiple eligibility pathways (full-benefit ABD, Medically Needy Spenddown, Medicare Savings Programs) with different income and asset thresholds. Benefits vary significantly by program tier (nursing home vs. community-based services). Income limits are indexed annually and include a $20 unearned income disregard. The program is administered at the county level through local DSS offices, creating potential for regional variation in processing and service availability, though eligibility criteria are statewide. Critical distinction: this is a non-MAGI (Modified Adjusted Gross Income) program with more complex eligibility determination than other Medicaid pathways.
- **Home and Community-Based Services (HCBS) Waiver** — service ([source](https://law.lis.virginia.gov/admincode/title12/agency30/chapter120/section920/))
  - Shape notes: Multiple HCBS waivers in VA (e.g., DD Waivers, elderly/disability focus); eligibility ties to Medicaid + strict institutional LOC; **local CSB priority scoring** and slot caps create regional waitlist variation; services individualized by assessment/POC, not fixed menu
- **Weatherization Assistance Program (WAP)** — service ([source](https://www.dhcd.virginia.gov/wx))
  - Shape notes: Income eligibility uses max of 60% SMI (higher for 1-8 persons) or 200% FPL (higher for 9+); priority tiers for elderly/disabled/children; decentralized via local sub-grantees with regional variations in access/wait times.
- **Home Delivered Meals (Meals on Wheels)** — in_kind ([source](https://dars.virginia.gov/aging/home-community/nutrition-meals/))
  - Shape notes: This program has no statewide single provider — it is fragmented across multiple regional providers (Feed More, District Three, The Span Center, etc.) and coordinated through DARS Area Agencies on Aging. Eligibility criteria are consistent (age 60+, homebound, unable to cook), but application process, processing time, and service area vary significantly by region. Income limits are not published as specific dollar amounts; income is assessed but not a disqualifier. Benefits are fixed (meals meeting 1/3 DRI) but dietary customization varies. No published waitlist or processing timeline data available. Geographic service area is the primary constraint — many Virginians may not have access depending on county/city.
- **Virginia Lifespan Respite Voucher Program (VLRVP)** — financial ([source](https://www.vda.virginia.gov/vlrv.htm))
  - Shape notes: Statewide voucher with fixed $595 cap per household; no income/asset test; tied to documented disability and non-replacement of existing services; kinship variant for minors with custody proof.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://dars.virginia.gov/aging/senior-employment-program/))
  - Shape notes: SCSEP is a federally authorized program under the Older Americans Act with fixed eligibility criteria (age 55+, unemployed, low income) and fixed benefits (20 hours/week at minimum wage, ~6 months training). The primary Virginia-specific information is limited; most details come from federal program documentation. Income limits vary by household size but specific dollar amounts require contacting local offices. Availability and processing times vary by region and are currently affected by federal funding transitions. No online application portal URL is provided in available documentation—applicants must contact offices directly or use the national CareerOneStop tool.
- **Legal Aid for Seniors** — service ([source](https://www.valegalaid.org/issues/elder-law))
  - Shape notes: Delivered via 9 regional legal aid societies, not centralized; income as % of federal poverty (varies 125-200% by region/case); seniors 60+ often have financial exceptions for advice; no fixed asset dollar limits or processing times specified.
- **Virginia Adult Services Program** — service ([source](https://www.dss.virginia.gov/adults.cgi[6]))
  - Shape notes: Administered locally by 120+ DSS offices with no statewide income/asset limits; services need-based and vary by county availability; separate from Medicaid long-term care programs

## Program Details

### Medicaid for Persons Who are Aged, Blind, or Disabled (ABD)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: For 2026: Income limits vary by eligibility category and household composition. For single individuals age 65+, the limit is $851/month. For married couples where both are 65+ or disabled, combined income must be below $1,150/month. Income counted includes Social Security benefits, pensions, IRA withdrawals, and employment wages. A $20 monthly unearned income disregard applies. Applicants with income above full-Medicaid limits may qualify for Medically Needy Spenddown (must accumulate medical bills to reach eligibility) or Medicare Savings Programs (assistance with Medicare premiums and cost-sharing).[1][5]
- Assets: Single individuals: $2,000 in countable assets. Married couples: $3,000 in countable assets. The home is excluded from asset calculations. Other excluded assets may apply depending on circumstances.[1][8]
- U.S. Citizen, Permanent Resident Alien (admitted before August 22, 1996, or after with 40 quarters of employment earnings; as of April 1, 2021, only 5 years residency required), Refugee, or Asylee[2]
- Virginia resident[2]
- Disabled individuals must either receive SSA or SSI disability benefits or be considered disabled by the Medicaid Disability Unit[2]
- For Emergency Medicaid only, citizenship/alienage requirements do not apply[2]

**Benefits:** Full Medicaid coverage including long-term care services such as personal care assistance, nursing home care, and home and community-based services (HCBS). Specific service hours and dollar amounts are not detailed in available sources but vary by program tier (Regular Medicaid/ABD, Institutional/Nursing Home Medicaid, Medicaid Waivers/HCBS, and Medicare Savings Programs).[3][5]
- Varies by: program_tier_and_medical_necessity

**How to apply:**
- Online: coverva.dmas.virginia.gov (Cover Virginia Application for Health Coverage and Help Paying Costs)[2][5]
- In-person: Contact your local Department of Social Services office (county-specific; contact information available through Virginia DMAS website)[2]
- Mail: Submit completed application to local DSS office
- Phone: Contact local DSS office or Virginia DMAS for guidance

**Timeline:** Not specified in available sources. Applicants are advised that complete and accurate submissions reduce risk of delays or denials.[3]
**Waitlist:** Not specified in available sources. Home and Community-Based Services (HCBS) waivers may have waitlists, but specific timelines are not provided.[3]

**Watch out for:**
- Disability does not automatically qualify you for Medicaid — you must still meet income and asset limits, even if receiving SSI or SSA disability benefits.[7]
- Income limits are very strict ($851 single, $1,150 married in 2026) and include all countable income sources. Many seniors exceed these limits.[1]
- If income exceeds limits, applicants may qualify for Medically Needy Spenddown, but must accumulate medical bills before approval — this is not automatic.[5][6]
- Asset limits are low ($2,000 single, $3,000 married). The home is excluded, but other assets count toward the limit.[1][8]
- Applicants with income above full-Medicaid limits but below federal poverty level may only qualify for Medicare Savings Programs (help with Medicare costs only, not full Medicaid).[8]
- If you receive Supplemental Security Income (SSI), most states automatically grant Medicaid without separate application, but Virginia's automatic eligibility status is not explicitly confirmed in available sources — verify with local DSS.[7]
- Estate recovery: Virginia may recoup certain Medicaid costs after enrollees die through estate recovery process.[8]
- Home and Community-Based Services (HCBS) waivers may have waitlists; availability varies by region and service type.[3]
- Spenddown amounts depend on household size and income — not a fixed dollar amount.[5]

**Data shape:** This program has multiple eligibility pathways (full-benefit ABD, Medically Needy Spenddown, Medicare Savings Programs) with different income and asset thresholds. Benefits vary significantly by program tier (nursing home vs. community-based services). Income limits are indexed annually and include a $20 unearned income disregard. The program is administered at the county level through local DSS offices, creating potential for regional variation in processing and service availability, though eligibility criteria are statewide. Critical distinction: this is a non-MAGI (Modified Adjusted Gross Income) program with more complex eligibility determination than other Medicaid pathways.

**Source:** https://coverva.dmas.virginia.gov/learn/coverage-for-adults/medicaid-for-persons-who-are-aged-blind-or-disabled-abd/ and https://www.dmas.virginia.gov/for-applicants/populations-served/for-adults/aged-blind-or-disabled/

---

### Home and Community-Based Services (HCBS) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Tied to Medicaid financial eligibility criteria under § 1614 of the Social Security Act; specific dollar amounts not listed in sources but typically follow Federal Poverty Level and spousal impoverishment rules for community settings. Varies by household size via Medicaid rules; no full table provided in results[1][4].
- Assets: Medicaid resource rules apply under § 1614; spousal impoverishment protections allow higher assets for spouses. What counts and exemptions follow standard Medicaid guidelines (e.g., primary home often exempt); exact details require Medicaid application review[1][4].
- Must be Medicaid-eligible financially and non-financially
- Meet **institutional level of care (LOC)** for nursing facility (NF), long-stay hospital, or specialized care NF (eligible for admission within 30 days)
- Elderly (as defined by § 1614) or individuals with disability (as defined by § 1614)
- Thorough assessment by LTSS screening team confirming needs and available supports
- Choose community-based options over institutional placement

**Benefits:** Community-based long-term services and supports as alternative to institutional care in NF, long-stay hospital, or specialized care NF. Specific services not enumerated in results but include waiver services authorized post-assessment to enable remaining at home (e.g., potential for personal care, homemaker, therapies based on plan of care). No fixed dollar amounts or hours stated; individualized per POC[1][6].
- Varies by: priority_tier

**How to apply:**
- Contact local Department of Social Services (DSS) for application and assistance
- In-person assessment by LTSS screening team or Community Services Board (CSB) case manager
- Formal application for specific waiver via DSS worker (forms provided by worker)

**Timeline:** Not specified; involves assessment review and in-person evaluations
**Waitlist:** Yes, slot-limited by federal waiver caps; prioritized by local CSB need scores from Critical Needs Summary (highest scores first); annual review; emergency slots possible via DBHDS[7]

**Watch out for:**
- Must meet **exact institutional LOC** (NF/hospital admission-ready within 30 days); not just general need
- Slot-limited with **priority tiers** by local CSB scores—highest needs first; waitlists common
- Requires full Medicaid eligibility first; community income/asset rules apply (spousal protections help but not unlimited)
- Elderly defined specifically by § 1614 (typically 65+); choice of waiver vs. PACE (55+) or institution post-assessment[1]
- Annual CSB review for waitlist; changes in needs can shift priority[7]

**Data shape:** Multiple HCBS waivers in VA (e.g., DD Waivers, elderly/disability focus); eligibility ties to Medicaid + strict institutional LOC; **local CSB priority scoring** and slot caps create regional waitlist variation; services individualized by assessment/POC, not fixed menu

**Source:** https://law.lis.virginia.gov/admincode/title12/agency30/chapter120/section920/

---

### Program of All-Inclusive Care for the Elderly (PACE) in Virginia


**Eligibility:**
- Age: 55+
- Income: No specific income limits; no financial criteria considered. Approximately 90% of participants are dually eligible for Medicare and Medicaid, but enrollment does not require Medicare or Medicaid enrollment.[2][1]
- Assets: No asset limits or financial criteria for eligibility.[2]
- Certified by the state as meeting the need for nursing facility level of care.
- Live in the service area of a PACE organization.
- Able to live safely in the community (at home or in a PACE service community) with PACE services.
- Cannot be enrolled in Medicare Advantage (Part C), Medicare prepayment plan, Medicare prescription drug plan, or hospice services.[2][1][3]

**Benefits:** All Medicare and Medicaid-covered services plus additional services determined medically necessary, including: prescription medications, dentistry, adult day care, occupational and physical therapy, hospital care, primary care, respite care, and any other services needed to support health. Covers nursing facility care if needed long-term or temporarily (only 7% of enrollees live in nursing facilities). Provided by an interdisciplinary team for individualized, coordinated care aligned with personal goals.[1][5]

**How to apply:**
- Contact local PACE organization directly (addresses, phone numbers, and websites available in 'Virginia PACE Locations' document from DMAS).[8]
- PACE team members can meet to assess eligibility.[5]

**Timeline:** Not specified in available data.
**Waitlist:** Not specified in available data.

**Watch out for:**
- Not available statewide—must live in a specific PACE service area; check local availability first.
- No private pay option mentioned for Virginia; primarily for Medicare/Medicaid-eligible (though not required).
- Cannot enroll if in Medicare Advantage, certain other Medicare plans, or hospice.
- New programs require DMAS approval via RFA; limited expansion.[4]
- Medical certification for nursing home level of care is key—many miss that it's required despite no financial test.[1][2]

**Data shape:** Limited to specific service areas and PACE centers in Virginia (not statewide); no income or asset test; medically driven eligibility only; multiple regional providers with unique contact points.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dmas.virginia.gov/for-members/benefits-and-services/other-programs-and-guidelines/pace/

---

### Medicare Savings Programs (QMB, SLMB, QI)


**Eligibility:**
- Income: {"note":"Virginia uses federal limits; income limits vary by program tier and household size. All figures are monthly gross income as of 2026.","QMB":{"individual":"$1,350","married_couple":"$1,824","description":"Lowest income tier; covers Part A and B premiums, deductibles, coinsurance, and copayments"},"SLMB":{"individual":"$1,526 to $1,585","married_couple":"$2,064 to $2,135","description":"Income must be above QMB level but below SLMB ceiling; covers Part B premiums only"},"QI":{"individual":"$1,715 to $1,781","married_couple":"$2,320 to $2,400","description":"Highest income tier; covers Part B premiums only. Limited program, first-come, first-served basis"},"income_disregard":"Federal guidelines include a $20 general income disregard"}
- Assets: {"QMB_SLMB_QI":{"individual":"$9,950","married_couple":"$14,910","description":"Federal limits; Virginia uses these limits for QMB, SLMB, and QI"},"what_counts":["Money in checking or savings accounts","Stocks","Bonds"],"what_does_not_count":["Your home","One car","Burial plot","Up to $3,500 set aside for burial expenses (for QMB, SLMB, QI)"]}
- Must be entitled to Medicare Part A
- Must have both Part A and Part B to qualify for SLMB or QI
- U.S. citizen or qualified alien
- Virginia resident

**Benefits:** [object Object]
- Varies by: program_tier

**How to apply:**
- In-person: Contact your local Department of Social Services office in your county
- Phone: Contact your local Department of Social Services (specific county numbers vary)
- Mail: Submit application to your local Department of Social Services
- Online: Virginia Medicaid website (www.dmas.virginia.gov) for information and potential online application options

**Timeline:** Not specified in available Virginia-specific documentation; contact local DSS for current processing times
**Waitlist:** QI program operates on first-come, first-served basis; other programs do not have documented waitlists

**Watch out for:**
- Income limits vary significantly by program tier—a single person earning $1,400/month qualifies for SLMB but not QMB; verify which tier applies before applying
- SLMB and QI require enrollment in both Part A AND Part B; those with only Part A do not qualify
- QI program is first-come, first-served with limited funding; even if income-eligible, you may not be able to enroll if funding is exhausted
- Asset limits are strict ($9,950 for individuals); liquid assets in savings accounts count toward this limit, but your home and one car do not
- Income limits are based on gross income before deductions; Social Security benefits, pensions, and other income all count
- Qualifying for QMB, SLMB, or QI automatically qualifies you for Extra Help with prescription drug costs—this is a significant additional benefit many families miss
- Virginia uses federal income and asset limits, but some states have higher limits; verify you're using Virginia's current limits, not another state's
- The $20 general income disregard means income up to $20 above the stated limit may still qualify you; don't assume you're ineligible if slightly over the limit

**Data shape:** Medicare Savings Programs are tiered by income level (QMB < SLMB < QI), with each tier offering different benefits. Benefits are financial (premium and cost-sharing assistance) rather than service-based. The program is administered at the county level through local DSS offices, but eligibility criteria are uniform statewide based on federal guidelines. QI differs from QMB and SLMB in that it operates on a first-come, first-served basis with limited federal funding. Income and asset limits are adjusted annually. All three programs automatically confer Extra Help prescription drug assistance, which is a critical secondary benefit.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dmas.virginia.gov (Virginia Department of Medical Assistance Services)

---

### Supplemental Nutrition Assistance Program (SNAP)


**Eligibility:**
- Income: {"description":"Most households must have gross income below 200% of Federal Poverty Level (FPL). Households with elderly or disabled members only need to meet net income limit (100% FPL).[3][4] For 2025, elderly/disabled seniors: $15,060 for one person, $20,440 for two people.[2]","virginia_specific_table":"For Oct. 1, 2025 - Sept. 30, 2026:[5]","table":{"household_size":[1,2,3,4,5,6,7,8,"Each additional"],"non_bbce_net_monthly_100_fpl":["$1,305","$1,763","$2,221","$2,680","$3,138","$3,596","$4,055","$4,513","$459"],"non_bbce_gross_monthly_130_fpl":["$1,696","$2,292","$2,888","$3,483","$4,079","$4,675","$5,271","$5,867","$596"],"bbce_gross_monthly_165_fpl":["$2,152","$2,909","$3,665","$4,421","$5,177","$5,934","$6,690","$7,446","$757"]},"note":"BBCE (Broad-Based Categorical Eligibility) households have higher income limits. Households receiving TANF, SSI, or other general assistance may be categorically eligible.[5]"}
- Assets: {"standard":"$2,750 in countable resources (cash, bank accounts)[1]","elderly_or_disabled":"$4,250 in countable resources if at least one household member is age 60+ or has a disability[1]","bbce_households":"No asset limit required[1]","exempt_assets":["Primary residence and land it sits on[1]","Most retirement and pension plans (though withdrawals count as income)[1]","Value of house if you own it[2]","Cash value of life insurance policies[2]","Income-producing property[2]","Household goods[2]"]}
- Must be a resident of Virginia[1]
- Household defined as people who live together and buy food and prepare meals together[1]
- Able-bodied adults with no dependents must meet work requirements, with some exceptions[1]
- Seniors with high shelter or medical expenses may qualify if net income is below 100% FPL; medical expenses can be deducted from net income[3]

**Benefits:** Monthly SNAP allotments vary by household size. For Oct. 1, 2025 - Sept. 30, 2026: 1 person = $298/month, 2 people = $546/month, 3 people = $785/month, 4 people = $994/month, 5 people = $1,183/month, 6 people = $1,421/month, 7 people = $1,571/month, 8 people = $1,789/month, plus $218 per additional member.[5]
- Varies by: household_size

**How to apply:**
- Online: CommonHelp (visit CommonHelp and click 'Apply for All Benefit Programs')[6]
- In-person or phone: Contact Virginia Department of Social Services (specific phone number not provided in search results)
- Mail: Application can be mailed (specific address not provided in search results)
- Eligibility screening: Virginia Poverty Law Center offers short eligibility screening questionnaire at benefitscheckup.org[1]

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Only about half of eligible seniors apply for SNAP despite qualifying — many don't realize they're eligible.[2]
- Elderly Simplified Application Project (ESAP) offers major benefits: 3-year certification period instead of typical 12 months, no recertification interview required, shorter application form — but only if ALL household members are 60+ with no earned income.[1][3]
- Even if one household member doesn't qualify for SNAP, other family members born in the country can still apply.[1]
- Social Security, veterans' benefits, and disability payments all count toward income limits.[2]
- Medical expenses can significantly reduce net income for elderly/disabled households — if you have more than $35 in medical expenses, you can deduct them, potentially qualifying you even if gross income exceeds limits.[3][6]
- The One Big Beautiful Bill Act of 2025 changed SNAP work requirements and non-citizen eligibility — verify current rules as they may differ from previous years.[4]
- BBCE (Broad-Based Categorical Eligibility) households have higher income limits (165% FPL) and no asset test — check if your household qualifies through TANF or other programs.[5]
- Households must report changes in household composition, earned income, and lottery/gambling winnings over $4,250 during certification period.[3]
- Income limits are based on gross income (130% FPL) for most households, but net income (100% FPL) for elderly/disabled households — these are different calculations.[4][5]

**Data shape:** SNAP benefits scale by household size with a fixed maximum allotment per person. For elderly/disabled households, there's a special net income calculation that allows medical and shelter expense deductions, potentially qualifying households that exceed gross income limits. Virginia offers simplified application and extended certification (3 years vs. 12 months) for all-elderly households with no earned income through ESAP. Income limits vary based on whether household qualifies for BBCE (Broad-Based Categorical Eligibility), which raises the threshold from 130% FPL to 165% FPL. Asset limits are higher for elderly/disabled households ($4,250 vs. $2,750) and waived entirely for BBCE households.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.virginia.gov/benefit/snap.cgi

---

### Low-Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly household income must be at or below: 1 person $1,956; 2 people $2,644; 3 people $3,331; 4 people $4,018; 5 people $4,707; 6 people $5,394. This aligns with approximately 150% of the Federal Poverty Level (FPL). Households with members aged 60+ receive preference, but there is no minimum age requirement.[2][1][3]
- Assets: No asset limit applies in Virginia.[2]
- U.S. citizen or qualifying foreigner.
- Household must participate with utility provider.
- For crisis assistance: heating emergency, imminent utility cut-off, inoperable/unsafe heating equipment, or pending shut-off.[1][3][4]

**Benefits:** Regular: Heating max $703 (min $198), Cooling max $700 (min $50). Crisis: Winter max $4,200, Summer not available. Payments made directly to utility company. Related: Weatherization for energy efficiency upgrades.[2]
- Varies by: household_size|priority_tier|fuel_type

**How to apply:**
- Online: commonhelp.virginia.gov
- Phone: 855-635-4370 (Mon-Fri 7am-6pm)
- Mail/In-person: Local department of social services (complete EA application form)
- Contact local utility for verification

**Timeline:** Notification in late December for some components; varies by type (regular vs. crisis).[4]
**Waitlist:** Not specified; crisis has seasonal windows (e.g., LIHEAP Crisis Fuel Jan 2-Mar 15).[3]

**Watch out for:**
- Must reapply annually, even if applied previously.[3]
- Household includes all at address sharing utility bill (e.g., roommates count).[2]
- Eligibility does not guarantee assistance.[1]
- Crisis requires verified emergency; regular is one-time payment.[2][4]
- Preference for 60+ but open to all qualifying households.[1]

**Data shape:** Income limits by household size; benefits vary by heating/cooling/crisis type, household size, fuel; no asset test; local DSS administration with statewide portal; annual reapplication required; elderly/disabled/child priority for some cooling aid.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dss.virginia.gov/benefit/ea/

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below the higher of 200% Federal Poverty Level (FPL) or 60% State Median Income (SMI), based on combined income of all household occupants over age 18. Effective 07/01/2025 (still current as of 2026): For family sizes 1-8, use 60% SMI (e.g., family of 4: $83,500 based on SMI $139,167); for 9+: 200% FPL (9: $119,300; 10: $130,300; add $11,000 per additional person beyond 8). Full table in DHCD Notice IN-02-2025. Priority for elderly, disabled, children.[1][5][2]
- Assets: No asset limits mentioned in program guidelines.[1]
- Virginia resident.
- Must own or rent eligible single-family, multifamily, or mobile home.
- Verification of income via documents during intake.
- Eligible if received cash assistance under Title IV/XVI in prior 12 months, or meets LIHEAP criteria at 200%+ FPL (state-elected).[1]

**Benefits:** No-cost installation of energy-saving measures: sealing air leaks (insulation, caulking, weather-stripping), adding insulation, repairing/replacing heating/cooling systems and ductwork, installing ventilation fans, energy-efficient lighting, health/safety checks (CO testing, CO/fire alarms). Improves energy efficiency, reduces costs, addresses health/safety hazards. No utility bill payment assistance.[6]
- Varies by: priority_tier

**How to apply:**
- Contact local provider by location via DHCD 'Find Your Local Provider' tool: https://www.dhcd.virginia.gov/wx.
- Phone examples: Community Housing Partners at 888-229-3714 (multiple regions).[2][3]
- Intake process: application, interview, eligibility determination, income verification.

**Timeline:** Not specified in sources; varies by local provider.
**Waitlist:** Likely due to funding limits; contact local provider for status (regional variation expected).[6]

**Watch out for:**
- Income based on *higher* of 60% SMI or 200% FPL—check both for your size (shifts at 9+ members).[5]
- No direct utility bill help—only home improvements.[6]
- Priority populations (elderly 60+, disabled, children) get preference; others may face longer waits.[2]
- Must verify income for *all* adult household members; exceptions defined in manual.[1]
- Not automatic—contact *local* provider, not state office directly.[6]

**Data shape:** Income eligibility uses max of 60% SMI (higher for 1-8 persons) or 200% FPL (higher for 9+); priority tiers for elderly/disabled/children; decentralized via local sub-grantees with regional variations in access/wait times.

**Source:** https://www.dhcd.virginia.gov/wx

---

### Virginia Insurance Counseling and Assistance Program (VICAP) - Virginia's SHIP


**Eligibility:**
- Income: No income limits; open to all Medicare beneficiaries regardless of income. Supports people with limited incomes but not restricted to them[1][2].
- Assets: No asset limits or tests apply[1][2].
- Must be a Medicare beneficiary (typically age 65+ or under 65 with certain disabilities), family member, or caregiver[1][2][7]

**Benefits:** Free, unbiased one-on-one counseling and education on Medicare options (Parts A, B, C, D, Medigap), plan comparisons, eligibility/enrollment rules, financial assistance applications (e.g., Medicaid, Medicare Savings Programs, Extra Help/Low-Income Subsidy), appeals of denied claims, managing bills, fraud prevention via Senior Medicare Patrol (SMP), outreach presentations, and referrals. Delivered by trained staff/volunteers in-person, phone, or events. No sales of insurance products[1][2][3][5][7].

**How to apply:**
- Phone: 1-800-552-3402[7]
- Website: Virginia VICAP site (accessible via shiphelp.org/ships/virginia/)[7]
- In-person or local: Through network of area agencies on aging and community partners statewide[1][5]

**Timeline:** Immediate counseling available via phone or local appointment; no formal application processing as it's a free service, not enrollment-based[1][2].

**Watch out for:**
- Not a healthcare or financial aid program itself—provides counseling only, not direct payments or care; counselors do not sell insurance and are unbiased[2][5]
- People may confuse with Medicare Savings Programs (which have income/asset limits); SHIP helps apply for those but has no limits itself[1]
- Younger disabled Medicare beneficiaries (under 65) and dual-eligible (Medicare/Medicaid) are priority but all qualify[1]
- Services via volunteers/staff at local sites; availability may depend on scheduling[1][5]

**Data shape:** no income or asset test; counseling service only, not benefits/enrollment program; delivered via statewide local network reflecting regional Medicare options; Virginia-specific name is VICAP[1][3][5][7]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.shiphelp.org/ships/virginia/ (VICAP) or https://www.dars.virginia.gov (Virginia DARS administers)[3][7]

---

### Home Delivered Meals (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No specific dollar limits stated in available sources. Income may be assessed for service eligibility but does not disqualify applicants.[4] One provider notes 'There are no income requirements, but income may be assessed for service eligibility.'[4]
- Assets: Not specified in available sources.
- Must be homebound (unable to leave home without difficulty or assistance)[1][2]
- Unable to meet basic nutritional needs or unable to prepare at least one nutritious meal per day[1]
- Have no other reliable means of obtaining daily meals[1]
- Must receive a qualifying score on a needs-based assessment[2]
- Spouse and/or disabled dependent child of recipient may qualify regardless of age if in best interest of participant[1][2]

**Benefits:** Hot, nutritious meals delivered to home. Each meal provides at least one-third of daily Dietary Reference Intakes (DRIs).[5][6] Meals are heart-healthy and diabetes-friendly, approved by registered dietitian.[6] Includes daily contact from volunteer and safety checks during delivery (11am-1:30pm window).[4] Nutrition counseling with registered dietitian may be available.[6]
- Varies by: dietary_needs

**How to apply:**
- Online screening form at feedmore.org (60-second eligibility check)[1]
- Contact local Area Agency on Aging or service provider directly
- In-person at service provider offices

**Timeline:** Not specified in available sources.
**Waitlist:** Not specified in available sources. One source notes 'Priority is given to applicants in the greatest need.'[2]

**Watch out for:**
- Program is NOT statewide with single provider — eligibility and application depend entirely on which county/city you live in. You must contact your local Area Agency on Aging or specific regional provider.[5]
- Income is not a disqualifier, but 'income may be assessed for service eligibility'[4] — meaning it may affect priority or other factors even if you're not denied.
- Meals are free but donations are encouraged/voluntary.[4][6] Some sources say 'no charge' while emphasizing donations — clarify with provider.
- Specific dollar amounts for income limits are not published in available sources — you must apply or contact provider for your specific situation.
- Processing time and waitlist status not documented — varies by provider and region.
- Disabled children and spouses under 60 may qualify, but only if they live with the primary recipient (60+).[1][2]
- Program requires needs-based assessment, not just age/homebound status — subjective evaluation of 'greatest need' affects priority.[2]
- Meals are delivered once weekly (not daily) according to one source.[6]
- Alternative: If you don't qualify for traditional Meals on Wheels, Mom's Meals offers Medicaid/Medicare Advantage home-delivered meals in Virginia at $9.49/meal or free through qualifying health plans.[3]

**Data shape:** This program has no statewide single provider — it is fragmented across multiple regional providers (Feed More, District Three, The Span Center, etc.) and coordinated through DARS Area Agencies on Aging. Eligibility criteria are consistent (age 60+, homebound, unable to cook), but application process, processing time, and service area vary significantly by region. Income limits are not published as specific dollar amounts; income is assessed but not a disqualifier. Benefits are fixed (meals meeting 1/3 DRI) but dietary customization varies. No published waitlist or processing timeline data available. Geographic service area is the primary constraint — many Virginians may not have access depending on county/city.

**Source:** https://dars.virginia.gov/aging/home-community/nutrition-meals/

---

### Virginia Lifespan Respite Voucher Program (VLRVP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income or asset limits specified; eligibility based on residency, caregiver status, and care recipient's documented disability or chronic condition.
- Assets: No asset limits or exclusions mentioned.
- Family caregiver and care recipient must reside in the Commonwealth of Virginia.
- Caregiver must be primary caregiver residing at least part-time with care recipient.
- Care recipient must have documented disability, chronic condition, or special needs (e.g., intellectual/developmental disability, neurological impairment, Alzheimer's; documentation required).
- Funds cannot replace existing respite or other care funding.
- Funds cannot be used for caregiver to work.
- For kinship caregivers: Must have custody of minor child (verified by court documents, TANF verification, power of attorney, school records, or foster care confirmation, less than 2 years old).

**Benefits:** Reimbursement vouchers up to $595 total per household for temporary, short-term respite care costs.
- Varies by: fixed

**How to apply:**
- Submit completed application with documentation to Virginia Department for Aging and Rehabilitative Services (DARS).
- Phone: 1-800-552-3402 or 804-662-9333 (Virginia Caregiver Coalition).
- Website: https://www.vda.virginia.gov/vlrv.htm (Virginia Lifespan Respite Voucher Program page).
- Email or mail to DARS (specific methods listed in application PDF).

**Timeline:** Not specified.
**Waitlist:** Funding available until June 30, 2026 or funds exhausted; families may apply once per year.

**Watch out for:**
- Limited to $595 per household total; one application per year.
- Cannot replace existing funding or support caregiver employment.
- Funds expire June 30, 2026 or when exhausted—apply early.
- Requires documented disability; not for general elderly care without condition.
- Separate from Medicaid waivers (FIS, CL) or VA programs which have different rules.

**Data shape:** Statewide voucher with fixed $595 cap per household; no income/asset test; tied to documented disability and non-replacement of existing services; kinship variant for minors with custody proof.

**Source:** https://www.vda.virginia.gov/vlrv.htm

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. The federal poverty guidelines were updated as of January 15, 2025, but specific dollar amounts by household size are not provided in available Virginia-specific documentation. Contact your local DARS office or Area Agency on Aging to verify current thresholds for your household size.[1][2][3]
- Assets: Not specified in available program documentation.
- Must be unemployed[2][3]
- Enrollment priority given to: veterans and qualified spouses, individuals over 65, those with disabilities, those with low literacy skills or limited English proficiency, those in rural areas, those experiencing homelessness or at risk of homelessness, those with low employment prospects, and those who have failed to find employment after using American Job Center services[2]

**Benefits:** Part-time paid job training averaging 20 hours per week at federal, state, or local minimum wage (whichever is highest). Training typically lasts about 6 months before placement into permanent employment. Participants gain work experience, on-the-job training in computer or vocational skills, professional job placement assistance, and support through DARS services including job search help, training, or assistive technology if needed.[1][2][3][4]
- Varies by: fixed

**How to apply:**
- Contact your local Department of Rehabilitative Services (DARS) office[1]
- Contact your local Area Agency on Aging[1]
- Use CareerOneStop's Older Worker Program Finder (online)[2]
- Call toll-free: 1-877-US2-JOBS (1-877-872-5627)[2]

**Timeline:** Not specified in available documentation.
**Waitlist:** Not specified in available documentation. Note: The program is experiencing a period of transition due to changes and delays in federal funding, which may affect availability and processing times.[3]

**Watch out for:**
- Income limits are tied to federal poverty guidelines that update annually (most recently January 15, 2025). You must verify current thresholds for your household size—don't assume last year's limits apply.[2]
- Having a disability is not required for eligibility, but those with disabilities receive priority of service, meaning they may be enrolled ahead of others.[1]
- The program is currently experiencing federal funding transitions and delays, which may affect availability in some areas. Verify current program status in your locality before applying.[3]
- This is a part-time training program (average 20 hours/week), not full-time employment. It's designed as a bridge to permanent work, not a permanent job itself.[2][3]
- Participants must be unemployed to qualify—those with current employment are ineligible.[2][3]
- The program provides training at nonprofits and public agencies (schools, libraries, hospitals, day-care centers, senior centers), not private sector employers directly, though it leads to private sector placement.[1][2]

**Data shape:** SCSEP is a federally authorized program under the Older Americans Act with fixed eligibility criteria (age 55+, unemployed, low income) and fixed benefits (20 hours/week at minimum wage, ~6 months training). The primary Virginia-specific information is limited; most details come from federal program documentation. Income limits vary by household size but specific dollar amounts require contacting local offices. Availability and processing times vary by region and are currently affected by federal funding transitions. No online application portal URL is provided in available documentation—applicants must contact offices directly or use the national CareerOneStop tool.

**Source:** https://dars.virginia.gov/aging/senior-employment-program/

---

### Legal Aid for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Varies by regional legal aid society and circumstances; up to 125% of federal poverty level standard, exceptions to 187.5% (Central Virginia) or 200% (Southwest Virginia). Seniors 60+ may receive legal advice without regard to finances in some programs. Contact local office for exact table, as no statewide dollar amounts specified and guidelines use federal poverty percentages with deductions for expenses like childcare or medical bills.[1][2][6]
- Assets: Low resources required; no specific dollar amounts or exemptions detailed statewide.[1]
- U.S. citizenship or meet citizenship requirements[1]
- Live in or have legal problem in service area of specific legal aid society[2]
- Civil legal issue in covered areas like elder law, public benefits, housing, abuse/neglect[1][2][5]

**Benefits:** Free civil legal advice and representation in elder law areas including power of attorney, long-term care, public benefits (Medicaid/SSI), guardianship alternatives, age discrimination, financial exploitation, abuse/neglect, housing, consumer issues. No specified dollar amounts or hours.[1][5][8]
- Varies by: priority_tier

**How to apply:**
- Phone: Statewide Senior Legal Helpline (844) 802-5910[5][8]
- Phone: Regional examples - Central Virginia Legal Aid 804-648-1012 or toll-free 800-868-1012/866-534-5243[1]
- Phone: Virginia Legal Aid Society (regional contacts via valegalaid.org)[9]
- Online: valegalaid.org to locate local program and check eligibility[6][8]
- In-person: Local legal aid offices (9 programs statewide, find via valegalaid.org)[7]

**Timeline:** Not specified in sources.

**Watch out for:**
- Not a single statewide program but 9 regional societies with varying income guidelines and service areas; seniors may get advice regardless of income but full representation requires low income/assets[1][6]
- Does not cover criminal cases, domestic violence, prisoners, or community groups in some areas[1]
- Exceptions for seniors but still need to contact specific office to confirm[1][6]
- VaLegalAid.org does not guarantee services even if guidelines met[6]

**Data shape:** Delivered via 9 regional legal aid societies, not centralized; income as % of federal poverty (varies 125-200% by region/case); seniors 60+ often have financial exceptions for advice; no fixed asset dollar limits or processing times specified.

**Source:** https://www.valegalaid.org/issues/elder-law

---

### Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; open to all residents of long-term care facilities regardless of financial status.
- Assets: No asset limits or tests; no financial eligibility requirements.
- Must be a resident of a certified long-term care facility in Virginia, such as a nursing home or assisted living facility.
- For complaint investigation, resident consent is required unless involving abuse, neglect, or exploitation where a legal representative's consent may apply.
- Also available for individuals receiving home and community-based care.

**Benefits:** Advocacy services including investigating complaints, resolving issues related to care quality, residents' rights violations (e.g., poor food quality, unsanitary conditions, staff shortages, hygiene issues, roommate conflicts), promoting the Residents' Bill of Rights, providing information on rights, and supporting residents in exercising those rights. Ombudsmen listen, observe, negotiate, and communicate on behalf of residents.

**How to apply:**
- Phone: Contact local regional ombudsman via Virginia Easy Access Long-Term Care Service Finder (no central number specified; use service finder for local contacts).
- Online: Virginia Easy Access at easyaccess.virginia.gov for service finder and local ombudsman contacts.
- In-person: Visit local long-term care facilities or regional ombudsman offices (e.g., Northern Virginia program serves Arlington, Fairfax, Loudoun, Alexandria).

**Timeline:** Immediate response for urgent issues; no formal processing time as services are complaint-driven and on-demand.

**Watch out for:**
- This is not a direct service provider (e.g., no healthcare, APS investigations, or personal care); it focuses solely on advocacy and rights protection.
- Requires resident consent for most actions; ombudsmen represent the resident's interests at their direction.
- Not for facility staff or licensing; separate from regulatory bodies.
- Volunteers must avoid conflicts like employment or financial interest in facilities; families cannot become ombudsmen for relatives' facilities.
- Complaints are confidential unless consent to disclose is given.

**Data shape:** no income test; complaint-driven advocacy only, no financial aid or direct services; resident consent required; delivered via regional volunteer and paid ombudsmen networks; authorized under Older Americans Act with state mandates.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dars.virginia.gov/aging/ombudsman/

---

### Commonwealth Coordinated Care Plus (CCC+) Waiver


**Eligibility:**
- Income: Follows Virginia Medicaid financial eligibility standards for long-term services and supports. No specific dollar amounts or household size table provided in sources; income of non-applicant spouse is not counted, and spousal income allowance may apply. Consult Virginia DMAS for current limits, as they change annually.[1][3]
- Assets: Follows Virginia Medicaid asset limits for long-term services. No specific dollar amounts detailed; applicants should verify with DMAS or use eligibility test tools. Primary residence and certain assets may be exempt per standard Medicaid rules.[1]
- Virginia resident.
- Must meet Nursing Facility Level of Care (NFLOC) via Virginia Uniform Assessment Instrument (UAI), assessing ADLs like bathing, mobility, toileting; or Hospital Level of Care requiring mechanical ventilator or substantial ongoing skilled nursing.
- At imminent risk of nursing facility placement without waiver services.
- Medicaid eligible.
- For those under 65: physical disability, chronically ill, or severely impaired with loss of vital body function.[1][3][4]

**Benefits:** Home and Community-Based Services (HCBS) including personal care, companion care, adult day health care, skilled nursing, respite (480 hours per state fiscal year, July 1-June 30), environmental modifications (up to $5,000 per calendar year), assistive technology (up to $5,000 per calendar year), private duty nursing (up to 112 hours per week), transition services (up to $5,000 per lifetime). Services determined by comprehensive assessment; Consumer-Directed Services (CDS) option allows hiring own attendants, including some family members.[2][4]
- Varies by: priority_tier

**How to apply:**
- Request LTSS Screening through local Department of Social Services (DSS).[3]
- Online Medicaid application at CommonHelp.virginia.gov.[3]
- Phone: Cover Virginia Call Center at 1-833-522-5582 (TDD: 1-888-221-1590).[3]
- Local DSS for paper Medicaid application and Appendix D for long-term services.[3]
- In-hospital screening by discharge planner if hospitalized.[3]
- Regional contacts: e.g., Fairfax County - under 18 call 703-222-0880; 18+ call 703-324-7948.[6]

**Timeline:** Not specified in sources.
**Waitlist:** No current waiting list.[5]

**Watch out for:**
- Must meet both financial (Medicaid) and clinical (NFLOC via UAI) criteria; dementia diagnosis alone insufficient.[1]
- Services strictly based on individual assessment, not all listed services guaranteed.[2][4]
- Apply only if eligible to avoid denial; use pre-eligibility tests.[1]
- Enrolled in managed care; transition supports included.[4]
- Can use while on waitlist for other waivers like DD waivers.[5][6]

**Data shape:** No waitlist unlike some waivers; services capped by specific hours/dollars and vary by assessed need/priority; screenings community-based via local DSS; requires Medicaid eligibility first; statewide but local screening teams.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dmas.virginia.gov/for-members/benefits-and-services/waivers/ccc-plus-waiver/[3]

---

### Virginia Adult Services Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific statewide income or asset limits identified for the Virginia Adult Services Program; eligibility is determined locally based on need for services like home-based care, without fixed dollar amounts or household size tables. Medicaid-related long-term care programs (separate from Adult Services) have limits such as $2,982/month income and $2,000 assets for a single nursing home applicant in 2026[1].
- Assets: No asset limits specified for Adult Services Program; countable assets and exemptions not detailed as program focuses on functional need rather than strict financial tests[3][5].
- Residency in the local county/city (no minimum time required)
- Demonstrated need for adult services such as home-based care, companion services, or assistance with Instrumental Activities of Daily Living (IADLs) like meal preparation, housekeeping, laundry, or money management[3][5]
- No citizenship requirements
- Functional dependency, e.g., at least one major IADL for companion services[5]
- Anyone may apply regardless of prior residency[3]

**Benefits:** Specific services include screenings for assisted living, nursing home placement, home-based care, Adult Day Care, waiver services, and Companion Services Program providing up to 15 hours per week of assistance with IADLs such as meal preparation, housekeeping, laundry, or money management. Also includes Adult Protective Services (APS) for abuse/neglect investigations and arrangements for health, housing, social, and legal services[5][6].
- Varies by: region

**How to apply:**
- In-person or mail to local Department of Social Services (DSS) office, e.g., King George County sample application[3]
- Phone: Local DSS or state hotline (specific number not listed in results; contact local office)[5]
- Assistance available to complete application on request day[3]

**Timeline:** Eligibility decision within 45 days; services begin within 45 days if eligible[3]
**Waitlist:** Optional services depend on local department availability; no statewide waitlist details[3]

**Watch out for:**
- No strict income/asset tests like Medicaid, but must provide accurate income proof or face prosecution; optional services only if local DSS offers them[3]
- Services like companion care limited to 15 hours/week and require IADL dependency[5]
- Must report changes within 10 days or risk eligibility loss[3]
- Provider approvals vary locally with strict criteria (age, background checks, references)[2]
- Anyone can apply but rights to services depend on meeting need and local availability[3]

**Data shape:** Administered locally by 120+ DSS offices with no statewide income/asset limits; services need-based and vary by county availability; separate from Medicaid long-term care programs

**Source:** https://www.dss.virginia.gov/adults.cgi[6]

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Medicaid for Persons Who are Aged, Blind | benefit | state | deep |
| Home and Community-Based Services (HCBS) | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Supplemental Nutrition Assistance Progra | benefit | federal | medium |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Virginia Insurance Counseling and Assist | resource | federal | simple |
| Home Delivered Meals (Meals on Wheels) | benefit | federal | deep |
| Virginia Lifespan Respite Voucher Progra | benefit | state | medium |
| Senior Community Service Employment Prog | employment | federal | deep |
| Legal Aid for Seniors | resource | local | simple |
| Long-Term Care Ombudsman Program | resource | federal | simple |
| Commonwealth Coordinated Care Plus (CCC+ | benefit | state | deep |
| Virginia Adult Services Program | benefit | state | deep |

**Types:** {"benefit":11,"resource":3,"employment":1}
**Scopes:** {"state":5,"local":2,"federal":8}
**Complexity:** {"deep":10,"medium":2,"simple":3}

## Content Drafts

Generated 6 page drafts. Review in admin dashboard or `data/pipeline/VA/drafts.json`.

- **Medicaid for Persons Who are Aged, Blind, or Disabled (ABD)** (benefit) — 6 content sections, 6 FAQs
- **Home and Community-Based Services (HCBS) Waiver** (benefit) — 3 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE) in Virginia** (benefit) — 3 content sections, 6 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Supplemental Nutrition Assistance Program (SNAP)** (benefit) — 5 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **program_tier_and_medical_necessity**: 1 programs
- **priority_tier**: 4 programs
- **not_applicable**: 3 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|fuel_type**: 1 programs
- **dietary_needs**: 1 programs
- **fixed**: 2 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Medicaid for Persons Who are Aged, Blind, or Disabled (ABD)**: This program has multiple eligibility pathways (full-benefit ABD, Medically Needy Spenddown, Medicare Savings Programs) with different income and asset thresholds. Benefits vary significantly by program tier (nursing home vs. community-based services). Income limits are indexed annually and include a $20 unearned income disregard. The program is administered at the county level through local DSS offices, creating potential for regional variation in processing and service availability, though eligibility criteria are statewide. Critical distinction: this is a non-MAGI (Modified Adjusted Gross Income) program with more complex eligibility determination than other Medicaid pathways.
- **Home and Community-Based Services (HCBS) Waiver**: Multiple HCBS waivers in VA (e.g., DD Waivers, elderly/disability focus); eligibility ties to Medicaid + strict institutional LOC; **local CSB priority scoring** and slot caps create regional waitlist variation; services individualized by assessment/POC, not fixed menu
- **Program of All-Inclusive Care for the Elderly (PACE) in Virginia**: Limited to specific service areas and PACE centers in Virginia (not statewide); no income or asset test; medically driven eligibility only; multiple regional providers with unique contact points.
- **Medicare Savings Programs (QMB, SLMB, QI)**: Medicare Savings Programs are tiered by income level (QMB < SLMB < QI), with each tier offering different benefits. Benefits are financial (premium and cost-sharing assistance) rather than service-based. The program is administered at the county level through local DSS offices, but eligibility criteria are uniform statewide based on federal guidelines. QI differs from QMB and SLMB in that it operates on a first-come, first-served basis with limited federal funding. Income and asset limits are adjusted annually. All three programs automatically confer Extra Help prescription drug assistance, which is a critical secondary benefit.
- **Supplemental Nutrition Assistance Program (SNAP)**: SNAP benefits scale by household size with a fixed maximum allotment per person. For elderly/disabled households, there's a special net income calculation that allows medical and shelter expense deductions, potentially qualifying households that exceed gross income limits. Virginia offers simplified application and extended certification (3 years vs. 12 months) for all-elderly households with no earned income through ESAP. Income limits vary based on whether household qualifies for BBCE (Broad-Based Categorical Eligibility), which raises the threshold from 130% FPL to 165% FPL. Asset limits are higher for elderly/disabled households ($4,250 vs. $2,750) and waived entirely for BBCE households.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Income limits by household size; benefits vary by heating/cooling/crisis type, household size, fuel; no asset test; local DSS administration with statewide portal; annual reapplication required; elderly/disabled/child priority for some cooling aid.
- **Weatherization Assistance Program (WAP)**: Income eligibility uses max of 60% SMI (higher for 1-8 persons) or 200% FPL (higher for 9+); priority tiers for elderly/disabled/children; decentralized via local sub-grantees with regional variations in access/wait times.
- **Virginia Insurance Counseling and Assistance Program (VICAP) - Virginia's SHIP**: no income or asset test; counseling service only, not benefits/enrollment program; delivered via statewide local network reflecting regional Medicare options; Virginia-specific name is VICAP[1][3][5][7]
- **Home Delivered Meals (Meals on Wheels)**: This program has no statewide single provider — it is fragmented across multiple regional providers (Feed More, District Three, The Span Center, etc.) and coordinated through DARS Area Agencies on Aging. Eligibility criteria are consistent (age 60+, homebound, unable to cook), but application process, processing time, and service area vary significantly by region. Income limits are not published as specific dollar amounts; income is assessed but not a disqualifier. Benefits are fixed (meals meeting 1/3 DRI) but dietary customization varies. No published waitlist or processing timeline data available. Geographic service area is the primary constraint — many Virginians may not have access depending on county/city.
- **Virginia Lifespan Respite Voucher Program (VLRVP)**: Statewide voucher with fixed $595 cap per household; no income/asset test; tied to documented disability and non-replacement of existing services; kinship variant for minors with custody proof.
- **Senior Community Service Employment Program (SCSEP)**: SCSEP is a federally authorized program under the Older Americans Act with fixed eligibility criteria (age 55+, unemployed, low income) and fixed benefits (20 hours/week at minimum wage, ~6 months training). The primary Virginia-specific information is limited; most details come from federal program documentation. Income limits vary by household size but specific dollar amounts require contacting local offices. Availability and processing times vary by region and are currently affected by federal funding transitions. No online application portal URL is provided in available documentation—applicants must contact offices directly or use the national CareerOneStop tool.
- **Legal Aid for Seniors**: Delivered via 9 regional legal aid societies, not centralized; income as % of federal poverty (varies 125-200% by region/case); seniors 60+ often have financial exceptions for advice; no fixed asset dollar limits or processing times specified.
- **Long-Term Care Ombudsman Program**: no income test; complaint-driven advocacy only, no financial aid or direct services; resident consent required; delivered via regional volunteer and paid ombudsmen networks; authorized under Older Americans Act with state mandates.
- **Commonwealth Coordinated Care Plus (CCC+) Waiver**: No waitlist unlike some waivers; services capped by specific hours/dollars and vary by assessed need/priority; screenings community-based via local DSS; requires Medicaid eligibility first; statewide but local screening teams.
- **Virginia Adult Services Program**: Administered locally by 120+ DSS offices with no statewide income/asset limits; services need-based and vary by county availability; separate from Medicaid long-term care programs

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Virginia?
