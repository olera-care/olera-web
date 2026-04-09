# New Hampshire Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 1.4m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 13 |
| New (not in our data) | 4 |
| Data discrepancies | 9 |
| Fields our model can't capture | 9 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 9 | Our model has no asset limit fields |
| `regional_variations` | 9 | Program varies by region — our model doesn't capture this |
| `documents_required` | 9 | Has document checklist — our model doesn't store per-program documents |
| `waitlist` | 6 | Has waitlist info — our model has no wait time field |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### New Hampshire Medicaid (Nursing Home Medicaid for seniors)

- **income_limit**: Ours says `$2901` → Source says `$2,982` ([source](https://www.dhhs.nh.gov/programs-services/medicaid (inferred primary; specifics from search results point to DHHS ACCESS)))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Coverage for nursing home care including room and board, 24-hour skilled nursing care, medical supplies/equipment, rehabilitation services, personal care assistance, medication management. Beneficiaries contribute most income (patient liability) toward costs, keeping $90-$93/month personal needs allowance + Medicare premiums.` ([source](https://www.dhhs.nh.gov/programs-services/medicaid (inferred primary; specifics from search results point to DHHS ACCESS)))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov/programs-services/medicaid (inferred primary; specifics from search results point to DHHS ACCESS)`

### Choices for Independence (CFI) Waiver

- **min_age**: Ours says `65` → Source says `65+ or 18-64 and disabled (can continue services after turning 65 if previously eligible)[1]` ([source](https://www.dhhs.nh.gov (inferred from program admin; see also Medicaid.gov waiver: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/82541)[2]))
- **income_limit**: Ours says `$2901` → Source says `$2,901` ([source](https://www.dhhs.nh.gov (inferred from program admin; see also Medicaid.gov waiver: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/82541)[2]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Wide range of home and community-based services to enable remaining at home (specific services not enumerated in sources; includes case management to identify goals and develop comprehensive care plan)[3][5]` ([source](https://www.dhhs.nh.gov (inferred from program admin; see also Medicaid.gov waiver: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/82541)[2]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov (inferred from program admin; see also Medicaid.gov waiver: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/82541)[2]`

### Program of All-Inclusive Care for the Elderly (PACE)

- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive medical and social services including: primary care, specialists (podiatrist, dentist, optometrist, audiologist), in-home nursing assessments and care, adult day center social support, transportation, physical/speech/rehabilitation therapy, social work support for paperwork/life challenges; also covers prescriptions, durable medical equipment, nutritional counseling, caregiver support, 24/7 emergency access; nursing home stays if needed but 95% live in community[1][2][4][5]` ([source](https://www.nhpace.org (NH provider); https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal overview)))
- **source_url**: Ours says `MISSING` → Source says `https://www.nhpace.org (NH provider); https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal overview)`

### Medicare Savings Program (MSP) - QMB, SLMB, QI

- **income_limit**: Ours says `$1400` → Source says `$13` ([source](https://www.dhhs.nh.gov/programs-services/medicaid))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles, coinsurance/copayments for Medicare-covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only; auto-qualifies for Extra Help (low copays on drugs, e.g., ≤$12.65 per drug in 2026)[1][2][6].` ([source](https://www.dhhs.nh.gov/programs-services/medicaid))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov/programs-services/medicaid`

### SNAP (Supplemental Nutrition Assistance Program)

- **min_age**: Ours says `65` → Source says `60` ([source](https://www.dhhs.nh.gov/programs-services/food-stamps (inferred from context; apply via NHEasy.nh.gov)[5]))
- **income_limit**: Ours says `$1990` → Source says `$2608` ([source](https://www.dhhs.nh.gov/programs-services/food-stamps (inferred from context; apply via NHEasy.nh.gov)[5]))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly EBT card for food purchases (groceries only, no hot foods/alcohol/tobacco). Amount based on net income, household size: ~$100 more net income = $30 less benefits. Minimum/maximum allotments vary (e.g., example: 2-person elderly/disabled household with $1200 gross may get $415/month).[1][3]` ([source](https://www.dhhs.nh.gov/programs-services/food-stamps (inferred from context; apply via NHEasy.nh.gov)[5]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov/programs-services/food-stamps (inferred from context; apply via NHEasy.nh.gov)[5]`

### Low Income Home Energy Assistance Program (LIHEAP)

- **income_limit**: Ours says `$2800` → Source says `$3,967` ([source](https://www.energy.nh.gov/ (NH Department of Energy referenced); national LIHEAP site via local agencies.[4]))
- **benefit_value**: Ours says `$500 – $2,000/year` → Source says `Heating assistance grants from $94 minimum to $2,177 maximum per household for winter season (October through following winter); applied to fuel costs. Winter Crisis assistance up to $2,177. No cooling assistance. Does not count as income for other programs.[1][3][4]` ([source](https://www.energy.nh.gov/ (NH Department of Energy referenced); national LIHEAP site via local agencies.[4]))
- **source_url**: Ours says `MISSING` → Source says `https://www.energy.nh.gov/ (NH Department of Energy referenced); national LIHEAP site via local agencies.[4]`

### New Hampshire State Health Insurance Assistance Program (SHIP)

- **min_age**: Ours says `65` → Source says `No specific age requirement for counseling services; however, the program primarily serves Medicare beneficiaries (age 65+), Medicare beneficiaries under age 65 with disabilities, and individuals dually eligible for Medicare and Medicaid[2][6]` ([source](https://www.cms.gov/contacts/nh-ship-servicelink-resource-center/general-beneficiary-contact/1562141 and shiphelp.org))
- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free, one-on-one personalized health insurance counseling and assistance. Specific services include: information and printed materials about Medicare Parts A & B, Part D (prescription drug coverage), Medigap (Medicare Supplement Insurance), Medicare Advantage plans, long-term care insurance, Medicare Savings Programs (QMB, SLMB, QI), prescription drug assistance programs, Medicaid, and other insurance programs[5]. SHIP also assists with enrollment in coverage options and helps beneficiaries apply for cost-assistance programs[2]. Nationally, SHIP oversees a network of over 2,200 local sites with over 12,500 team members[2]` ([source](https://www.cms.gov/contacts/nh-ship-servicelink-resource-center/general-beneficiary-contact/1562141 and shiphelp.org))
- **source_url**: Ours says `MISSING` → Source says `https://www.cms.gov/contacts/nh-ship-servicelink-resource-center/general-beneficiary-contact/1562141 and shiphelp.org`

### New Hampshire Family Caregiver Support Program

- **min_age**: Ours says `60` → Source says `Caregivers: 18+; Care recipients vary by category (60+ for primary, any age for ADRD if living together, children <18 for grandparents 55+)[1][4]` ([source](https://www.dhhs.nh.gov/programs-services/elderly-adult-services (inferred from administration; primary details via nasua.org/sf-nh.pdf)[1]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Respite grants, care management, counseling, assistive technology, emergency response, home modifications, homemaker/personal care, education/training, support groups, individual counseling, follow-up for respite[1][3][4]` ([source](https://www.dhhs.nh.gov/programs-services/elderly-adult-services (inferred from administration; primary details via nasua.org/sf-nh.pdf)[1]))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.nh.gov/programs-services/elderly-adult-services (inferred from administration; primary details via nasua.org/sf-nh.pdf)[1]`

### New Hampshire Long-Term Care Ombudsman Program

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Free and confidential advocacy services, including investigating and resolving complaints about care quality, treatment, rights, and facility issues; providing information on facilities and rights; representing interests to ensure dignity, fair treatment, and ethical care; collaborating with residents, families, facility staff, and officials.` ([source](https://www.dhhs.state.nh.us (referenced in program contacts; primary state DHHS site)))
- **source_url**: Ours says `MISSING` → Source says `https://www.dhhs.state.nh.us (referenced in program contacts; primary state DHHS site)`

## New Programs (Not in Our Data)

- **Weatherization Assistance Program (WAP)** — service ([source](https://www.energy.nh.gov/ (NH Department of Energy administers; regional via community action partnerships); federal https://www.energy.gov/cmei/scep/wap[4][6]))
  - Shape notes: Eligibility fully tied to Fuel Assistance Program (FAP)/Electric Assistance Program (EAP) qualification (200% FPG); regionally administered by community action agencies with utility partnerships; priority-tiered with elderly emphasis but no strict age cutoff; home condition pre-check required.
- **Meals on Wheels (Council on Aging programs)** — in_kind ([source](www.servicelink.nh.gov (Aging and Disability Resource Center); www.NHEasy.NH.gov (online applications); www.dhhs.nh.gov (local DHHS offices)))
  - Shape notes: This program's structure is highly decentralized: eligibility, income limits, delivery frequency, and application processes vary significantly by county and provider. No income restrictions exist for seniors 60+, but income restrictions apply for younger disabled adults with amounts varying by location. The program operates through multiple funding sources (federal Title 3 and Title 20, Medicaid, state, local, and donations) and is administered through local Area Agencies on Aging rather than a single state entity. Geographic service areas are fragmented—not all of New Hampshire is covered. Delivery frequency varies from five days per week to three days per week in rural areas.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors[2]))
  - Shape notes: Federally uniform but locally administered via grantees like Operation ABLE in NH; priority tiers affect access; no asset test or fixed dollar benefits - wage-based stipend; income scales by household size via federal poverty guidelines.
- **New Hampshire Legal Assistance (NHLA) Justice in Aging Project** — service ([source](https://www.nhla.org))
  - Shape notes: Seniors (60+) have no income/asset test—unique priority access; intake centralized via 603 Legal Aid partnership; case acceptance varies by priority and resources, not fixed benefits

## Program Details

### New Hampshire Medicaid (Nursing Home Medicaid for seniors)


**Eligibility:**
- Age: 65+
- Income: For a single applicant in 2026, income must be under $2,982/month (almost all income counts, including Social Security, pensions, wages; most income goes to patient liability after $90-$93 personal needs allowance and Medicare premiums). Income cannot exceed the Medicaid reimbursement rate for the specific nursing facility (typically over $5,500/month, so rarely an issue). For married couples, community spouse income not counted; applicant entitled to certain deductions (e.g., alimony, debts). No full household size table provided in sources, but couples have higher asset considerations.[2][3][5][7]
- Assets: Single applicant: $2,500 countable assets (some sources note $7,500 with asset disregard or allowance; excess must be spent down). Married (one applying): Community spouse can retain up to $157,920 (depending on circumstances); all assets counted jointly regardless of ownership. Countable: Cash, bank accounts, stocks, non-exempt property (must liquidate). Exempt: Primary home (under conditions), one vehicle, personal belongings, burial plots, life insurance (limited face value), IRA/pensions in payout. 5-year look-back for transfers/gifts with penalties.[2][3][4][6][7][8]
- New Hampshire resident
- U.S. citizen or qualified immigrant
- Nursing Facility Level of Care (NFLOC): Need full-time nursing home care based on ADLs (bathing, dressing, eating, etc.), IADLs, cognitive/behavioral issues; assessed by state
- Care needed for 30 consecutive days

**Benefits:** Coverage for nursing home care including room and board, 24-hour skilled nursing care, medical supplies/equipment, rehabilitation services, personal care assistance, medication management. Beneficiaries contribute most income (patient liability) toward costs, keeping $90-$93/month personal needs allowance + Medicare premiums.
- Varies by: fixed

**How to apply:**
- Online: New Hampshire Department of Health and Human Services ACCESS portal (dhhs.nh.gov specific application page not detailed; general Medicaid application via ACCESS)
- Phone: Contact local District Office or central line (specific numbers not in results; call 211 or local DHHS office)
- Mail/In-person: Local DHHS District Offices (locations vary by region)

**Timeline:** Not specified in sources

**Watch out for:**
- Asset confusion: Official limit $2,500 but $7,500 allowance/disregard often applies; must spend down excess properly (no gifting due to 5-year look-back/penalties)
- Patient liability: Most income goes to care costs post-allowance; not full income retention
- Married couples: All joint assets counted; community spouse protections exist but complex
- NFLOC required: Functional assessment mandatory, not automatic at 65
- Facility-specific income cap: Rare but ties to nursing home's rate
- No full household income/asset tables; single/couple focus

**Data shape:** Income capped by facility reimbursement rate (not fixed SSI level); asset limit varies in reporting ($2,500 vs $7,500 allowance); spousal asset protections up to $157,920; statewide but regional DHHS offices and facility rate variations

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov/programs-services/medicaid (inferred primary; specifics from search results point to DHHS ACCESS)

---

### Choices for Independence (CFI) Waiver


**Eligibility:**
- Age: 65+ or 18-64 and disabled (can continue services after turning 65 if previously eligible)[1]+
- Income: Individual: $2,901/month (300% of 2025 Federal Benefit Rate). Married couple both applying: $5,802/month. One spouse applying: $2,901/month (non-applicant spouse income disregarded)[1]
- Assets: Home equity limit: $730,000 (2025) if applicant lives in home or intends to return. Exemptions: home if spouse, child under 21, or disabled/blind child of any age lives there. Other assets follow standard Medicaid rules (not detailed in sources)[1]
- New Hampshire resident[1]
- Nursing Facility Level of Care (NFLOC) determined by registered nurse using Medical Eligibility Assessment (MEA) based on limitations in Activities of Daily Living (ADLs: bathing, dressing, eating, toileting, transferring, continence)[1]

**Benefits:** Wide range of home and community-based services to enable remaining at home (specific services not enumerated in sources; includes case management to identify goals and develop comprehensive care plan)[3][5]
- Varies by: priority_tier

**How to apply:**
- Contact NH Department of Health and Human Services (DHHS) or case management agency (e.g., Community Partners: (603) 516-9300, 25 Old Dover Road, Rochester, NH 03867)[3]
- No specific online URL, form name, mail address, or in-person offices listed in sources; eligibility determined by DHHS after financial and medical criteria met[3]

**Timeline:** Not specified in sources
**Waitlist:** Not specified in sources

**Watch out for:**
- Income limit is 300% FBR ($2,901 individual for 2025); exceeds standard Medicaid but spousal rules apply[1]
- Must meet NFLOC via MEA assessment, not just age/disability[1]
- Home equity limit $730,000 with specific exemptions; intent to return required[1]
- Assigned case management agency post-eligibility; can request specific one[3]
- Limited 2022-2027; rules in He-E 801[2][4]

**Data shape:** Financial eligibility uses 300% FBR (higher than standard Medicaid); services via assigned case managers with comprehensive care plan; statewide but provider-based delivery; NFLOC via nurse MEA tool[1][3][4]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov (inferred from program admin; see also Medicaid.gov waiver: https://www.medicaid.gov/medicaid/section-1115-demo/demonstration-and-waiver-list/82541)[2]

---

### Program of All-Inclusive Care for the Elderly (PACE)


**Eligibility:**
- Age: 55+
- Income: No specific dollar amounts or household size table provided in sources; eligibility tied to state Medicaid financial criteria and nursing facility level of care (NFLOC) certification, with most participants dually eligible for Medicare and Medicaid[2][4][5][6]
- Assets: Not specified in sources; financial criteria referenced generally under state Medicaid rules[5]
- Live in the service area of a PACE organization (in NH, Neighborhood Healthcare PACE contracted areas)[1][4][6]
- Meet New Hampshire's definition of Nursing Facility Level of Care (NFLOC)[4][6]
- Able to live safely in the community (home, assisted living, or similar) with PACE services[2][4][6]

**Benefits:** Comprehensive medical and social services including: primary care, specialists (podiatrist, dentist, optometrist, audiologist), in-home nursing assessments and care, adult day center social support, transportation, physical/speech/rehabilitation therapy, social work support for paperwork/life challenges; also covers prescriptions, durable medical equipment, nutritional counseling, caregiver support, 24/7 emergency access; nursing home stays if needed but 95% live in community[1][2][4][5]

**How to apply:**
- Contact Neighborhood Healthcare PACE via their website at https://www.nhpace.org[1]
- No specific phone number, mail address, or in-person details listed; general inquiry through provider recommended[1]

**Timeline:** Not specified in sources
**Waitlist:** Not specified in sources

**Watch out for:**
- Not available statewide in NH—must live in Neighborhood Healthcare PACE service area[1][7]
- Requires nursing home level of care certification, even if living at home or assisted living[4][6]
- Most participants dual-eligible (Medicare/Medicaid), but not strictly required—financial criteria apply via state Medicaid[2][4][5]
- Limited to specific provider (Neighborhood Healthcare); use NPA finder for confirmation[8]

**Data shape:** Only available through Neighborhood Healthcare at 3 centers in contracted NH areas; no income/asset dollar specifics or statewide coverage; eligibility hinges on NFLOC and service area residency

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.nhpace.org (NH provider); https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal overview)

---

### Medicare Savings Program (MSP) - QMB, SLMB, QI


**Eligibility:**
- Income: New Hampshire-specific monthly income limits (effective as of latest available data, with $13 unearned income disregard): QMB: $1,235 single / $1,663 married; SLMB: $1,478 single / $1,992 married (from QMB levels up to this); QI (SLMB-135): $1,660 single / $2,239 married (from SLMB levels up). Limits based on Federal Poverty Level, updated annually around April 1; states may adjust but NH follows these tiers[1]. Note: Figures from other sources vary by year (e.g., 2026 federal: QMB $1,350 single / $1,824 couple[6]); confirm current with state.
- Assets: Federal limits apply: $9,090 single / $13,630 married for QMB, SLMB, QI. Counts typical countable assets (e.g., bank accounts, stocks); exempts home, one car, burial plots, life insurance up to certain values (standard Medicaid rules). NH has not eliminated asset test unlike some states[1][4].
- Must be eligible for Medicare Part A (even if not enrolled for QMB); Part A and B required for SLMB/QI[1][2][6].
- U.S. citizen or qualified immigrant.
- Reside in New Hampshire.

**Benefits:** QMB: Pays Medicare Part A premiums (if applicable), Part B premiums/deductibles, coinsurance/copayments for Medicare-covered services. SLMB: Pays Part B premiums only. QI: Pays Part B premiums only; auto-qualifies for Extra Help (low copays on drugs, e.g., ≤$12.65 per drug in 2026)[1][2][6].
- Varies by: program_tier

**How to apply:**
- Apply through NH Department of Health and Human Services (DHHS) Medicaid agency: Online via NH EASY portal (https://www.dhhs.nh.gov/programs-services/medicaid/apply-medicaid), phone 1-800-852-3345, mail/in-person at local DHHS district offices[1][4].
- No specific form number listed; use Medicaid application which covers MSP.

**Timeline:** Effective first day of month of application for QMB; SLMB/QI may vary, typically 45 days for Medicaid apps[2].
**Waitlist:** QI has first-come, first-served with priority to prior-year recipients; possible waitlist if funds exhausted[6].

**Watch out for:**
- QI called SLMB-135 in NH; must reapply annually for QI, first-come priority[1][6].
- QMB providers cannot bill beneficiary for Medicare-covered services (key protection often missed)[2].
- Income disregard of first $13 unearned income specific to NH[1].
- Asset test still applies (unlike 13 states); home/car exempt but others count[1][4].
- If income exceeds one tier, check next (e.g., over QMB may qualify SLMB)[1].
- Limits update yearly ~April; verify current FPL-based amounts.

**Data shape:** Tiered by income brackets (QMB 100% FPL, SLMB 120%, QI 135%); NH uses federal assets with $13 unearned disregard; QI funding-limited with annual reapplication and priority queue.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov/programs-services/medicaid

---

### SNAP (Supplemental Nutrition Assistance Program)


**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (Oct 1, 2025 - Sept 30, 2026): Gross income limit at 200% federal poverty level - 1 person: $2608/month, 2: $3526, 3: $4442, 4: $5358, 5: $6276, 6: $7192, 7: $8108, each additional +$916. If gross exceeds this, qualify via Net Income test (100% FPG, e.g., ~$15060/year for 1, $20440 for 2 in 2025) and Asset test. Most households (gross ≤200% FPG) exempt from gross/net/asset tests due to NH expansion.[1][5]
- Assets: No asset limit for most households (gross ≤200% FPG). For households with 60+ or disabled member exceeding gross limit: $4500 federal limit applies. Exempt: primary home, retirement savings, 1 vehicle (value if owned), household goods, life insurance cash value (if not income-producing).[1][2]
- U.S. citizen or qualified non-citizen.
- Live in NH.
- Household includes those who buy/prepare food together.
- Categorical eligibility if all members receive SSI, TANF, etc., or gross ≤185% FPG (older rule).[4]
- Work requirements may apply (exempt for 60+).[4]

**Benefits:** Monthly EBT card for food purchases (groceries only, no hot foods/alcohol/tobacco). Amount based on net income, household size: ~$100 more net income = $30 less benefits. Minimum/maximum allotments vary (e.g., example: 2-person elderly/disabled household with $1200 gross may get $415/month).[1][3]
- Varies by: household_size

**How to apply:**
- Online: NHEasy (https://www.nheasy.nh.gov), help via 1-877-347-SNAP (1-877-347-7627) or email.[5]
- Phone: Local DHHS office or 1-877-347-SNAP.[5]
- Mail/In-person: Local DHHS District Offices (statewide locations via dhhs.nh.gov).

**Timeline:** Not specified in sources; contact local office for NH-specific timeline.[3]

**Watch out for:**
- Elderly/disabled over gross limit (200% FPG) must pass net income + $4500 asset test (missed by many).[1]
- Application may still ask for assets even if limit doesn't apply.[1]
- Include all who buy/prepare food as household.[2]
- Medical expenses >$35/month deductible for 60+ (boosts eligibility).[2]
- Only ~40% eligible elderly in NH participate.[6]
- Gross income includes Social Security/pensions.[2]

**Data shape:** NH expanded: gross limit 200% FPG (most exempt asset test); elderly/disabled special path if over gross (net + assets); benefits scale by household size/net income.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov/programs-services/food-stamps (inferred from context; apply via NHEasy.nh.gov)[5]

---

### Low Income Home Energy Assistance Program (LIHEAP)


**Eligibility:**
- Income: Gross monthly income limits (2025): 1 Person: $3,967; 2 People: $5,187; 3 People: $6,408; 4 People: $7,629; 5 People: $8,849; 6 People: $10,070. Alternative source lists slightly higher: 1: $4,004 monthly/$48,711 annually; 2: $5,236/$63,699; 3: $6,467/$78,688; 4: $7,700/$93,676; 5: $8,931/$108,634; 6: $10,163/$123,653; 7: $10,394/$126,463; 8: $10,625/$129,274. Limits subject to change; priority for elderly, disabled, families with young children.[1][2][4]
- Assets: No asset limit.[1]
- New Hampshire resident.
- Household includes everyone at the address sharing utility bills.
- Priority for elderly, disabled, or families with children under 6.
- Program targets low-income, elderly, and handicapped for heating/utility expenses.[2][3][4]

**Benefits:** Heating assistance grants from $94 minimum to $2,177 maximum per household for winter season (October through following winter); applied to fuel costs. Winter Crisis assistance up to $2,177. No cooling assistance. Does not count as income for other programs.[1][3][4]
- Varies by: household_size|priority_tier|income|fuel_type

**How to apply:**
- Contact local Community Action Agency by region: Hillsborough/Rockingham Counties: (603) 893-9172 or (603) 924-2243; Strafford County: (603) 435-2500; Belknap/Merrimack Counties: (603) 223-0043.[3]
- Complete Fuel Assistance Application; pre-applications for priority groups (elderly, disabled, young children) after July 1, others after September 1 for 2025-2026 season.[4]
- Offices open year-round M-F 8:30am-4:30pm; applications accepted starting ~July 30, 2025 until funding exhausted. Program open Dec 1 - Apr 30.[2][3][4]

**Timeline:** Not specified; apply early as funding limited.[3][4]
**Waitlist:** No waitlist mentioned; benefits until funding depleted.[3]

**Watch out for:**
- Not year-round; heating seasonal (fall/winter), crisis only for emergencies like shutoffs.[1]
- Funding limited; apply early (pre-apps July/Sept 2025), stops when exhausted.[3][4]
- Household includes all at address sharing utilities, even non-related.[1]
- Over-income applicants may qualify for Senior Energy Assistance Program (SEAS) up to $500 if 60+.[2]
- Denials possible for incomplete docs, prior benefit, subsidized heat; appeal via Fair Hearing.[4]
- Conflicting income limits across sources; verify with local agency.

**Data shape:** Administered regionally via Community Action Agencies; income limits vary slightly by source and may update annually; benefits scale by income, size, fuel type, priority (elderly/disabled prioritized); seasonal with early application windows for priority groups.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.energy.nh.gov/ (NH Department of Energy referenced); national LIHEAP site via local agencies.[4]

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Eligibility is determined by qualification for New Hampshire Fuel Assistance Program (FAP) or Electric Assistance Program (EAP), typically at or below 200% of Federal Poverty Guidelines (FPG). Exact income limits are not listed in sources but tied to FAP/EAP; priority given to elderly, disabled, families with children under 6, high energy burden households. For related Eversource income-eligible program (potentially overlapping), limits at 100% State Median Income are: 1 person < $69,394; 2 < $90,746; 3 < $112,098; 4 < $133,449; 5 < $154,801; 6 < $176,154[5].
- Assets: No asset limits mentioned.
- Must qualify for and/or participate in Fuel Assistance Program (FAP) or Electric Assistance Program (EAP); FAP/EAP application serves as WAP application.
- Home cannot have significant structural issues, disrepair, leaking roof, failing plumbing or electrical systems[1].
- Homeowners (stick-built and manufactured), renters eligible with landlord permission[1][2].
- Homes previously weatherized after September 1994 generally ineligible; case-by-case for others[1][2].
- Priority: elderly, disabled, families with young children (under 6), high energy use, long-term FAP participants[1][2][4].

**Benefits:** Free energy conservation services including: energy audit, air sealing, insulation, heating system repairs/replacements (limited funding), LED bulbs, low-flow devices, ventilation, health/safety items (smoke/CO alarms), potential refrigerator replacement if qualified. Follow-up inspection. Focuses on cost-effective measures per audit; not rehabilitation or ongoing repairs[1][2][3].
- Varies by: priority_tier

**How to apply:**
- Apply through Fuel Assistance Program (FAP) or Electric Assistance Program (EAP) application; answer 'YES' to weatherization interest question[1][2][7].
- Regional providers: CAPBM (Merrimack/Belknap Counties) via CAPBM.org[1]; CAPHR via caphr.org[2][7]; Strafford County (CAPSC): online application, email info@straffordcap.org, phone 603-435-2500 x 2350, mail to 577 Central Ave. Suite 10, Dover, NH 03820[4].
- Statewide admin: NH Department of Energy; contact local community action agencies or utilities (Eversource, Unitil, NH Electric Co-op)[4].
- Federal DOE map for state administrator[6].

**Timeline:** Not specified; involves energy audit scheduling and contractor work with follow-up inspection[1][2].
**Waitlist:** Funding limited; priority-based, potential wait implied but not detailed[1][4].

**Watch out for:**
- Must first qualify via FAP/EAP; not standalone application[1][2][4].
- Home must be in reasonable condition—no major structural/ roof/plumbing/electrical issues[1].
- Renters need landlord permission; heating repairs more restricted for rentals[1].
- Previously weatherized homes (post-1994) usually ineligible[1][2].
- Limited funding for heating replacements; no ongoing tune-ups[1].
- Priority tiers mean elderly may wait if high demand[1][2][4].

**Data shape:** Eligibility fully tied to Fuel Assistance Program (FAP)/Electric Assistance Program (EAP) qualification (200% FPG); regionally administered by community action agencies with utility partnerships; priority-tiered with elderly emphasis but no strict age cutoff; home condition pre-check required.

**Source:** https://www.energy.nh.gov/ (NH Department of Energy administers; regional via community action partnerships); federal https://www.energy.gov/cmei/scep/wap[4][6]

---

### New Hampshire State Health Insurance Assistance Program (SHIP)


**Eligibility:**
- Age: No specific age requirement for counseling services; however, the program primarily serves Medicare beneficiaries (age 65+), Medicare beneficiaries under age 65 with disabilities, and individuals dually eligible for Medicare and Medicaid[2][6]+
- Income: No income limits for SHIP counseling services themselves[8]. However, the programs SHIP helps people apply for have income limits: Medicare Savings Programs (MSPs) have income limits up to approximately $1,800/month for individuals or $2,400/month for couples, though exact limits vary by state[4]. In New Hampshire specifically: QMB ($1,235/month single, $1,663/month married), SLMB ($1,478/month single, $1,992/month married), QI/SLMB-135 ($1,660/month single, $2,239/month married)[3]. Extra Help has income limits up to approximately $2,000/month for individuals or $2,600/month for couples[4]
- Assets: No asset limits for SHIP counseling services. However, for Medicare Savings Programs that SHIP helps people access: New Hampshire uses federal asset limits of $9,090 if single and $13,630 if married[3]. New Hampshire disregards the first $13 of unearned income (e.g., Social Security, pensions) when determining eligibility[3]
- Must be a Medicare beneficiary, family member, or caregiver of a Medicare beneficiary[2]
- No citizenship or residency restrictions stated for SHIP counseling access

**Benefits:** Free, one-on-one personalized health insurance counseling and assistance. Specific services include: information and printed materials about Medicare Parts A & B, Part D (prescription drug coverage), Medigap (Medicare Supplement Insurance), Medicare Advantage plans, long-term care insurance, Medicare Savings Programs (QMB, SLMB, QI), prescription drug assistance programs, Medicaid, and other insurance programs[5]. SHIP also assists with enrollment in coverage options and helps beneficiaries apply for cost-assistance programs[2]. Nationally, SHIP oversees a network of over 2,200 local sites with over 12,500 team members[2]
- Varies by: not_applicable — counseling services are free and available to all Medicare beneficiaries regardless of income or demographics[8]

**How to apply:**
- Phone: 877-839-2675 (national SHIP hotline; say 'Medicare' when prompted)[4]
- Online: Visit shiphelp.org to locate your local SHIP or use the SHIP Locator[4][9]
- In-person: Contact NH SHIP - ServiceLink Resource Center at NH DHHS, Bureau of Elderly & Adult Services, 105 Pleasant St., Gov. Gallan State Office Park S., Concord, NH 03301-3857[7]
- Local community sites: SHIP services are delivered through state units on aging, state departments of insurance, local area agencies on aging, senior housing programs, and hospitals[2][6]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- SHIP provides counseling and assistance to apply for benefits, but does not directly provide financial assistance or pay healthcare costs itself[2][5]. Families must apply separately for the actual assistance programs (Medicare Savings Programs, Extra Help, Medicaid) that SHIP helps them access[4]
- SHIP services are free, but eligibility for the programs SHIP helps people apply for (QMB, SLMB, QI, Extra Help) depends on meeting specific income and asset limits that vary by program and state[3][4]
- Extra Help requires that beneficiaries maintain a Part D plan; Extra Help alone does not provide prescription drug coverage[4]
- Some programs require automatic enrollment (e.g., Extra Help if you have Medicaid or SSI), while others require manual application[4]
- New Hampshire's income disregard of $13 for unearned income is a state-specific rule that may affect eligibility calculations compared to other states[3]

**Data shape:** SHIP is a counseling and enrollment assistance program, not a direct benefit program. Its primary value is helping Medicare beneficiaries navigate complex eligibility rules and apply for multiple overlapping programs (Medicare Savings Programs, Extra Help, Medicaid). Income limits and asset limits are program-specific, not SHIP-specific. Processing times, waitlists, and detailed application procedures are not publicly documented in available sources and should be obtained directly from the program. Regional variations in service delivery exist but are not detailed in available documentation.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.cms.gov/contacts/nh-ship-servicelink-resource-center/general-beneficiary-contact/1562141 and shiphelp.org

---

### Meals on Wheels (Council on Aging programs)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60 years or older, or disabled and homebound (any age)+
- Income: No income restrictions for adults 60+. Income restrictions apply for adults with disabilities under 60 years old; specific dollar amounts not provided in available sources. Varies by location and provider.
- Assets: Not specified in available sources
- Must be homebound or have mobility challenges that make it difficult to shop for food, prepare meals, or socialize
- Must reside within a designated delivery zone (geographic coverage varies by local program)
- Spouses of eligible seniors may qualify
- Disabled individuals accompanying a senior or residing in housing facilities where congregate meals are served may qualify

**Benefits:** One meal per delivery day that meets 1/3 of the Recommended Daily Allowances for people age 60+. Includes entrée, two vegetables or fruits, bread, dessert, and milk. Deliveries are five days per week in most areas; Monday, Wednesday, and Friday in very rural towns.
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (primary method)
- Contact Aging and Disability Resource Center (ADRC) at 1-866-634-9412 or www.servicelink.nh.gov
- Online application at www.NHEasy.NH.gov (for Choices for Independence program, which includes Medicaid meals)
- Visit local DHHS Office (call 603-271-9700 or visit www.dhhs.nh.gov to find nearest office)

**Timeline:** Not specified in available sources; described as varying by program with note that 'patience might be needed'
**Waitlist:** Not specified in available sources

**Watch out for:**
- Geographic coverage is NOT statewide for all providers—you must verify your address is within a delivery zone before applying. Rural areas may have limited delivery days.
- Income limits for disabled adults under 60 are NOT specified in public materials—you must contact your local provider for exact thresholds.
- The program operates on a suggested donation model ($2.00 per meal in some areas), but there is no charge for those who cannot pay. However, drivers collect donation envelopes weekly.
- Meals must be eaten upon delivery while hot; food left unrefrigerated may become unsafe.
- Eligibility criteria and income guidelines vary significantly by location and provider—what qualifies in one county may not in another.
- Some programs serve meals at congregate dining sites (like senior centers) rather than home-delivered; verify the service type available in your area.
- For disabled adults under 60, Medicaid eligibility through the Choices for Independence (CFI) program may be required, which has separate income and asset guidelines.
- Referrals from doctors or social workers may be required by some providers.

**Data shape:** This program's structure is highly decentralized: eligibility, income limits, delivery frequency, and application processes vary significantly by county and provider. No income restrictions exist for seniors 60+, but income restrictions apply for younger disabled adults with amounts varying by location. The program operates through multiple funding sources (federal Title 3 and Title 20, Medicaid, state, local, and donations) and is administered through local Area Agencies on Aging rather than a single state entity. Geographic service areas are fragmented—not all of New Hampshire is covered. Delivery frequency varies from five days per week to three days per week in rural areas.

**Source:** www.servicelink.nh.gov (Aging and Disability Resource Center); www.NHEasy.NH.gov (online applications); www.dhhs.nh.gov (local DHHS offices)

---

### New Hampshire Family Caregiver Support Program


**Eligibility:**
- Age: Caregivers: 18+; Care recipients vary by category (60+ for primary, any age for ADRD if living together, children <18 for grandparents 55+)[1][4]+
- Income: No specific income or asset limits mentioned across sources; financial eligibility tied to Medicaid waivers in related programs but not core FCSP[1][2][6]
- Assets: Not applicable; no asset tests specified, though Medicaid-linked services may apply separately[6]
- Care recipients 60+ with impairment in at least two ADLs (Title III-E)[1][4]
- For ADRD: Caregivers 18+, care recipient with Alzheimer's/related dementia, live together, recipient cannot follow through after cuing[4]
- Grandparents/relative caregivers 55+ caring for children <18 (in absence of parent) or adult children >18 with severe disabilities (priority)[1][4]
- Unpaid family caregivers; priority for severe disabilities[3][4]

**Benefits:** Respite grants, care management, counseling, assistive technology, emergency response, home modifications, homemaker/personal care, education/training, support groups, individual counseling, follow-up for respite[1][3][4]
- Varies by: priority_tier

**How to apply:**
- Contact local Aging and Disability Resource Center (ADRC) Options Counselors (e.g., Monadnock Region/Sullivan County)[3]
- Home visits available by counselor[3]
- State administration via NH Department of Health and Human Services/Bureau of Elderly and Adult Services[1]

**Timeline:** Not specified
**Waitlist:** Limited availability in related Medicaid waivers; respite grants may have follow-up but no core waitlist details[3][6]

**Watch out for:**
- Multiple sub-programs with varying eligibility (e.g., ADRD requires cohabitation, grandparents 55+ only)[1][4]
- Not direct payment to caregivers (unlike CFI Medicaid program); focuses on support services/respite[1][2][6]
- Priority for severe disabilities or specific groups; all unpaid caregivers encouraged but respite grants require assessment[3][4]
- Often confused with paid Medicaid programs like Choices for Independence (CFI) or veteran stipends[2][6]

**Data shape:** Tiered by care recipient type (60+ frail, ADRD, grandparents 55+ for kids/disabled adults); no income/asset tests in core program; local ADRC delivery with statewide admin; services not cash payments

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.nh.gov/programs-services/elderly-adult-services (inferred from administration; primary details via nasua.org/sf-nh.pdf)[1]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually via HHS Poverty Guidelines (effective January 15, 2025). No specific NH table in sources; consult current federal guidelines for precise figures by household size[1][2][3].
- Assets: No asset limits mentioned in sources.
- Unemployed at time of enrollment[1][2][3]
- Resident of New Hampshire[1]
- Eligible to work in the United States[1]
- Desire to learn/refresh job skills as a path to employment[1]
- Interest in returning to work[1]

**Benefits:** Part-time community service work (average 20 hours per week) at non-profit/public facilities (e.g., schools, hospitals, day-care centers, senior centers); paid stipend at highest of federal, state, or local minimum wage; job search assistance and guidance to permanent employment; on-the-job training in skills like computers or vocational areas[1][2][3][4].
- Varies by: priority_tier

**How to apply:**
- Phone: Operation ABLE (NH provider) - specific number not in sources; national toll-free: 1-877-872-5627 (1-877-US2-JOBS)[2]
- Online: CareerOneStop Older Worker Program Finder for local NH programs[2]
- In-person: Local NH providers like Operation ABLE (info sessions highlighted)[1]
- Contact AARP Foundation SCSEP for eligibility check (no specific NH number)[4]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may vary by demand and priority (e.g., veterans first)[2][3].

**Watch out for:**
- Enrollment priority: Veterans/qualified spouses first, then over 65, disabled, low literacy, limited English, rural residents, homeless/at-risk, low prospects, or prior American Job Center users - may delay non-priority applicants[2][3]
- Program is temporary bridge to unsubsidized work, not permanent job[2][4]
- Must be actively unemployed and motivated to return to work - not for retirees seeking supplemental income[1]
- Income limit strictly 125% FPL; excludes those above threshold even if otherwise eligible[1][2]

**Data shape:** Federally uniform but locally administered via grantees like Operation ABLE in NH; priority tiers affect access; no asset test or fixed dollar benefits - wage-based stipend; income scales by household size via federal poverty guidelines.

**Source:** https://www.dol.gov/agencies/eta/seniors[2]

---

### New Hampshire Legal Assistance (NHLA) Justice in Aging Project

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits for seniors; eligible regardless of income. For non-seniors, up to 200% of federal poverty level (e.g., family of four up to $53,000 per year as of referenced data).
- Assets: No asset limits for seniors; eligible regardless of assets.
- New Hampshire resident
- Civil legal issues in NHLA priority areas (e.g., housing, public benefits, aging-specific issues like nursing home rights, debt collection, financial exploitation)

**Benefits:** Free civil legal services including advice, representation in court (e.g., eviction defense, protective orders), negotiation (e.g., with landlords), appeals for public benefits denials, assistance with nursing home rights, debt collection harassment, financial exploitation, estate planning, Medicare/Medicaid, housing, domestic issues.
- Varies by: priority_tier

**How to apply:**
- Phone: 1-800-639-5290 (603 Legal Aid intake for NHLA referral)
- Online: 603 Legal Aid website (connect via nh-cls.org or 603legalaid.org)
- Regional offices (e.g., Nashua: 800-517-0577 or 603-598-3800, 21 East Pearl Street, Suite 2)

**Timeline:** Initial assessment upon contact; representation subject to availability (not specified)
**Waitlist:** NHLA may not take every case due to resource limits

**Watch out for:**
- Not all cases accepted due to resource limits even if eligible
- Must be civil legal issue in NHLA priority areas (no criminal cases)
- Seniors prioritized regardless of income/assets, but apply via 603 Legal Aid for seamless referral
- Data from 2021; confirm current details via intake

**Data shape:** Seniors (60+) have no income/asset test—unique priority access; intake centralized via 603 Legal Aid partnership; case acceptance varies by priority and resources, not fixed benefits

**Source:** https://www.nhla.org

---

### New Hampshire Long-Term Care Ombudsman Program


**Eligibility:**
- Income: No income limits; services are free and available to all regardless of financial status.
- Assets: No asset limits or tests apply.
- Must be a resident of a long-term care facility in New Hampshire, including nursing homes, assisted living facilities, long-term rehabilitation centers, adult day care facilities, or hospice centers.
- Services also extend to families, friends, and staff of residents.

**Benefits:** Free and confidential advocacy services, including investigating and resolving complaints about care quality, treatment, rights, and facility issues; providing information on facilities and rights; representing interests to ensure dignity, fair treatment, and ethical care; collaborating with residents, families, facility staff, and officials.

**How to apply:**
- Phone: Toll-free (800) 442-5640 or local (603) 271-4375 (hours: 8:00 am - 4:30 pm)
- Fax: (603) 271-5574
- Mail/In-person: New Hampshire Long-Term Care Ombudsman Program, 129 Pleasant Street, Concord, NH 03301-3857

**Timeline:** Not specified in available sources; immediate assistance typically available via phone for urgent issues.

**Watch out for:**
- Not a direct care or healthcare provider—ombudsmen do not deliver medical services, only advocate and resolve issues.
- Requires residency in a qualifying long-term care facility; does not cover home-based or community care.
- Services are confidential but involve collaboration with facilities and officials to resolve complaints.
- Potentially outdated contact leadership (e.g., prior State Ombudsman named).

**Data shape:** no income test; advocacy-only for long-term care facility residents statewide; free/confidential; no formal application or waitlist

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.dhhs.state.nh.us (referenced in program contacts; primary state DHHS site)

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| New Hampshire Medicaid (Nursing Home Med | benefit | state | deep |
| Choices for Independence (CFI) Waiver | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Medicare Savings Program (MSP) - QMB, SL | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | deep |
| Low Income Home Energy Assistance Progra | benefit | federal | medium |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| New Hampshire State Health Insurance Ass | navigator | federal | simple |
| Meals on Wheels (Council on Aging progra | benefit | federal | medium |
| New Hampshire Family Caregiver Support P | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| New Hampshire Legal Assistance (NHLA) Ju | resource | state | simple |
| New Hampshire Long-Term Care Ombudsman P | resource | federal | simple |

**Types:** {"benefit":9,"navigator":1,"employment":1,"resource":2}
**Scopes:** {"state":4,"local":1,"federal":8}
**Complexity:** {"deep":8,"medium":2,"simple":3}

## Content Drafts

Generated 3 page drafts. Review in admin dashboard or `data/pipeline/NH/drafts.json`.

- **New Hampshire Medicaid (Nursing Home Medicaid for seniors)** (benefit) — 4 content sections, 6 FAQs
- **Choices for Independence (CFI) Waiver** (benefit) — 5 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **fixed**: 1 programs
- **priority_tier**: 5 programs
- **not_applicable**: 2 programs
- **program_tier**: 1 programs
- **household_size**: 1 programs
- **household_size|priority_tier|income|fuel_type**: 1 programs
- **not_applicable — counseling services are free and available to all Medicare beneficiaries regardless of income or demographics[8]**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **New Hampshire Medicaid (Nursing Home Medicaid for seniors)**: Income capped by facility reimbursement rate (not fixed SSI level); asset limit varies in reporting ($2,500 vs $7,500 allowance); spousal asset protections up to $157,920; statewide but regional DHHS offices and facility rate variations
- **Choices for Independence (CFI) Waiver**: Financial eligibility uses 300% FBR (higher than standard Medicaid); services via assigned case managers with comprehensive care plan; statewide but provider-based delivery; NFLOC via nurse MEA tool[1][3][4]
- **Program of All-Inclusive Care for the Elderly (PACE)**: Only available through Neighborhood Healthcare at 3 centers in contracted NH areas; no income/asset dollar specifics or statewide coverage; eligibility hinges on NFLOC and service area residency
- **Medicare Savings Program (MSP) - QMB, SLMB, QI**: Tiered by income brackets (QMB 100% FPL, SLMB 120%, QI 135%); NH uses federal assets with $13 unearned disregard; QI funding-limited with annual reapplication and priority queue.
- **SNAP (Supplemental Nutrition Assistance Program)**: NH expanded: gross limit 200% FPG (most exempt asset test); elderly/disabled special path if over gross (net + assets); benefits scale by household size/net income.
- **Low Income Home Energy Assistance Program (LIHEAP)**: Administered regionally via Community Action Agencies; income limits vary slightly by source and may update annually; benefits scale by income, size, fuel type, priority (elderly/disabled prioritized); seasonal with early application windows for priority groups.
- **Weatherization Assistance Program (WAP)**: Eligibility fully tied to Fuel Assistance Program (FAP)/Electric Assistance Program (EAP) qualification (200% FPG); regionally administered by community action agencies with utility partnerships; priority-tiered with elderly emphasis but no strict age cutoff; home condition pre-check required.
- **New Hampshire State Health Insurance Assistance Program (SHIP)**: SHIP is a counseling and enrollment assistance program, not a direct benefit program. Its primary value is helping Medicare beneficiaries navigate complex eligibility rules and apply for multiple overlapping programs (Medicare Savings Programs, Extra Help, Medicaid). Income limits and asset limits are program-specific, not SHIP-specific. Processing times, waitlists, and detailed application procedures are not publicly documented in available sources and should be obtained directly from the program. Regional variations in service delivery exist but are not detailed in available documentation.
- **Meals on Wheels (Council on Aging programs)**: This program's structure is highly decentralized: eligibility, income limits, delivery frequency, and application processes vary significantly by county and provider. No income restrictions exist for seniors 60+, but income restrictions apply for younger disabled adults with amounts varying by location. The program operates through multiple funding sources (federal Title 3 and Title 20, Medicaid, state, local, and donations) and is administered through local Area Agencies on Aging rather than a single state entity. Geographic service areas are fragmented—not all of New Hampshire is covered. Delivery frequency varies from five days per week to three days per week in rural areas.
- **New Hampshire Family Caregiver Support Program**: Tiered by care recipient type (60+ frail, ADRD, grandparents 55+ for kids/disabled adults); no income/asset tests in core program; local ADRC delivery with statewide admin; services not cash payments
- **Senior Community Service Employment Program (SCSEP)**: Federally uniform but locally administered via grantees like Operation ABLE in NH; priority tiers affect access; no asset test or fixed dollar benefits - wage-based stipend; income scales by household size via federal poverty guidelines.
- **New Hampshire Legal Assistance (NHLA) Justice in Aging Project**: Seniors (60+) have no income/asset test—unique priority access; intake centralized via 603 Legal Aid partnership; case acceptance varies by priority and resources, not fixed benefits
- **New Hampshire Long-Term Care Ombudsman Program**: no income test; advocacy-only for long-term care facility residents statewide; free/confidential; no formal application or waitlist

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in New Hampshire?
