# Mississippi Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.090 (18 calls, 8.0m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 16 |
| Programs deep-dived | 14 |
| New (not in our data) | 8 |
| Data discrepancies | 6 |
| Fields our model can't capture | 6 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 6 | Our model has no asset limit fields |
| `regional_variations` | 5 | Program varies by region — our model doesn't capture this |
| `waitlist` | 5 | Has waitlist info — our model has no wait time field |
| `documents_required` | 6 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **in_kind**: 2 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Mississippi Medicaid (Elderly and Disabled)

- **min_age**: Ours says `65` → Source says `21 or older (65+ or 21-64 if disabled)` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Home and community-based services (HCBS) to avoid nursing facility placement: Case Management, Adult Day Services, Expanded Home Health Services, Home Delivered Meals, Personal Care Services, Institutional Respite/In-Home Respite, Transition Assistance. No specific dollar amounts or hours stated; services sized to meet NFLOC needs for 31+ days.[4][8]` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/`

### Mississippi Elderly and Disabled (E&D) Waiver

- **min_age**: Ours says `65` → Source says `21 or older (65+ for elderly; 21-64 for physically disabled; those enrolled before 65 can continue after)[1][2]` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Adult day health care, home-delivered meals, personal care services, institutional respite, in-home respite, expanded/extended home health (skilled nursing, nurse aide, physical/speech therapy after state plan exhausted), community transition services, medication management, environmental safety services. Case management by RN/social worker. No specific dollar amounts or hours per week stated[2][5][7]` ([source](https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]`

### Medicare Savings Programs

- **income_limit**: Ours says `$967` → Source says `$20` ([source](https://medicaid.ms.gov/medicaid-coverage/who-qualifies-for-coverage/medicare-cost-sharing/))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `QMB: Pays Medicare Part A/B premiums (including Part A if owed), deductibles, coinsurance/copayments. SLMB: Pays Part B premiums only (up to 3 months retroactive). QI: Pays Part B premiums only. QMB recipients get a Medicaid card; SLMB/QI do not qualify for additional Medicaid benefits.[1][2]` ([source](https://medicaid.ms.gov/medicaid-coverage/who-qualifies-for-coverage/medicare-cost-sharing/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.ms.gov/medicaid-coverage/who-qualifies-for-coverage/medicare-cost-sharing/`

### SNAP (Supplemental Nutrition Assistance Program) in Mississippi

- **min_age**: Ours says `65` → Source says `No minimum age requirement for the household, but special simplified programs exist for elderly (60+) applicants` ([source](https://www.mdhs.ms.gov/help/snap/special/))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Food assistance benefits (amount varies by household size and income; specific benefit amounts not detailed in search results but calculated based on household composition and income)` ([source](https://www.mdhs.ms.gov/help/snap/special/))
- **source_url**: Ours says `MISSING` → Source says `https://www.mdhs.ms.gov/help/snap/special/`

### National Family Caregiver Support Program (Mississippi)

- **min_age**: Ours says `60` → Source says `Care recipient 60+ or caregiver 60+ caring for child under 18; also grandparents/relatives 60+ caring for children 18 and under, or adults 55+ caring for non-child adults 18+ with developmental disabilities[1][4][5]` ([source](https://www.mdhs.ms.gov/aging/caregivers/[5]))
- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `Five basic services: 1. Information about available services; 2. Assistance gaining access to services; 3. Individual counseling, support groups, caregiver training; 4. Respite care for temporary relief; 5. Supplemental services on limited basis to complement care[4][5][6]` ([source](https://www.mdhs.ms.gov/aging/caregivers/[5]))
- **source_url**: Ours says `MISSING` → Source says `https://www.mdhs.ms.gov/aging/caregivers/[5]`

### Mississippi Legal Services / Senior Legal Aid

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Free civil legal assistance (no attorney fees), including advice, representation in areas like elder care, family, housing, employment, consumer, income maintenance, health, domestic violence, foreclosure prevention; provided by nonprofit law firms for low-income persons.[1][3][4]` ([source](https://www.mslegalservices.org (guide); https://mscenterforlegalservices.org; https://www.nmrls.com))
- **source_url**: Ours says `MISSING` → Source says `https://www.mslegalservices.org (guide); https://mscenterforlegalservices.org; https://www.nmrls.com`

## New Programs (Not in Our Data)

- **Low-Income Home Energy Assistance Program (LIHEAP)** — financial ([source](https://www.mdhs.ms.gov/community/liheap/))
  - Shape notes: Administered county-by-county via Community Action Agencies; income at 60% state median (household size-based); priority for vulnerable households; seasonal components (heating Oct-Apr, cooling May-Sep, crisis year-round, weatherization Sep-Aug).[1][3]
- **Weatherization Assistance Program (WAP)** — in_kind ([source](https://www.mdhs.ms.gov/wap/))
  - Shape notes: Benefits are fixed (energy efficiency improvements) rather than scaled by household size or priority tier, though priority tier determines who receives services first. Income limits scale by household size but specific thresholds are not provided in available documentation. Program is statewide but administered through regional CAAs, creating potential variation in processing times and service availability. No asset limits are specified in available documentation.
- **Mississippi State Health Insurance Assistance Program (SHIP)** — service ([source](https://www.mdhs.ms.gov/post/navigating-medicare-made-easy-with-ship/[5]))
  - Shape notes: no income/asset test, open to all Medicare-related inquiries, counseling-only service via statewide phone/in-person network with local customization[1][5][7]
- **Home Delivered Meals (Meals on Wheels)** — service ([source](https://www.law.cornell.edu/regulations/mississippi/18-Miss-Code-R-SS-2-2-10 (Mississippi Code R. 2-2.10)[1]))
  - Shape notes: Decentralized by local Area Agencies on Aging with no statewide application; no income/asset test but homebound and zone-restricted; priority via waitlist system[1][2]
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.dol.gov/agencies/eta/seniors))
  - Shape notes: County-specific subgrantees with unique contacts; not uniform statewide; priority tiers affect access; income tied to varying federal poverty levels by household size
- **State Long Term Care Ombudsman Program** — advocacy ([source](https://www.mdhs.ms.gov/aging/ombudsman/))
  - Shape notes: no income test; advocacy-only for facility residents; delivered via 19 regional ombudsmen statewide; open to anyone with concerns, no eligibility barriers.
- **Mississippi Respite Voucher Program** — financial ([source](https://www.mdhs.ms.gov/wp-content/uploads/2023/09/Respite-Flyer.pdf (MDHS flyer); https://archrespite.org/wp-content/uploads/2022/12/MS-Voucher-Flyers-2022.pdf[2][3]))
  - Shape notes: No income/asset test; caregiver-focused for any-age dependents needing 24/7 care; fixed low-dollar vouchers per household with repeat option; statewide via centralized phone intake with local offices[2][3]
- **Central Mississippi Area Agency on Aging Reassurance Program** — service ([source](https://cmpdd.org/images/aging/Reassurance-Program-brochure.pdf))
  - Shape notes: County-restricted to 7 Central MS counties; phone reassurance service with no income/age tests detailed; minimal documentation required; operates via single helpline and agency office

## Program Details

### Mississippi Medicaid (Elderly and Disabled)


**Eligibility:**
- Age: 21 or older (65+ or 21-64 if disabled)+
- Income: Must qualify as SSI beneficiary or have monthly income not exceeding 300% of SSI federal benefit rate (exact dollar amount varies annually with SSI; if exceeds, pay excess via income trust). SSI recipients automatically eligible. No specific household size table provided; primarily individual-based for aged/disabled.[1][2][4][6]
- Assets: Standard Medicaid limits apply (e.g., $2,000 for individual in related programs). Exempt: primary home (if living there or intend to return), one vehicle, household furnishings/appliances, personal effects, life insurance up to $1,500 total face value per person. 60-month look-back rule penalizes asset transfers below fair market value.[1][7]
- Require Nursing Facility Level of Care (NFLOC), assessed in-person by licensed social worker/nurse using Long-Term Services and Supports (LTSS) InterRAI tool (score 50+).[1][2][6]
- Physician certification of NFLOC, recertified at least every 12 months.[5][6]
- Mississippi resident; functionally limited in 2+ ADLs (e.g., bathing, dressing, eating, toileting, transferring, mobility) or IADLs (e.g., meals, laundry, cleaning, shopping); cognitive deficits considered but dementia diagnosis alone insufficient.[1][2]
- Apply for/accept all other benefits (e.g., VA, retirement, disability).[5][7]

**Benefits:** Home and community-based services (HCBS) to avoid nursing facility placement: Case Management, Adult Day Services, Expanded Home Health Services, Home Delivered Meals, Personal Care Services, Institutional Respite/In-Home Respite, Transition Assistance. No specific dollar amounts or hours stated; services sized to meet NFLOC needs for 31+ days.[4][8]

**How to apply:**
- Online: https://medicaid.ms.gov (Mississippi Division of Medicaid portal)
- Phone: Contact local Division of Medicaid office or SSI via Social Security Administration (specific local numbers via medicaid.ms.gov)
- Mail/In-person: Local Division of Medicaid offices (locations via medicaid.ms.gov); apply for SSI first if applicable via SSA
- Multiple routes exist; SSI auto-enrolls for Medicaid

**Timeline:** Not specified; must meet all criteria during 3 months prior with medical services each month for nursing/HCBS.[5]
**Waitlist:** Possible due to waiver slots (not explicitly detailed; program has enrollment caps as HCBS waiver).[1]

**Watch out for:**
- Must meet NFLOC via in-person assessment (score 50+ on InterRAI); dementia alone insufficient.[1][2]
- 60-month look-back on asset transfers triggers penalty period.[1]
- Income over 300% SSI requires monthly payment of excess via trust.[6]
- SSI auto-eligibility, but former SSI or specific groups (e.g., COL recipients, disabled adult children) have nuances.[3][7]
- Must accept all other benefits or risk ineligibility.[5][7]
- Waiver slots limited; waitlists possible.[1]
- Services for 31+ consecutive days need only.[5]

**Data shape:** Tied to SSI thresholds (300% limit, annual COLA changes); NFLOC via scored in-person tool; waiver caps create waitlists; regional districts handle delivery but statewide uniform rules

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/

---

### Mississippi Elderly and Disabled (E&D) Waiver


**Eligibility:**
- Age: 21 or older (65+ for elderly; 21-64 for physically disabled; those enrolled before 65 can continue after)[1][2]+
- Income: Qualify as SSI beneficiaries or up to 300% of SSI federal benefit rate (exact 2026 dollar amount not specified in sources; if exceeds 300% SSI, pay excess via income trust to Division of Medicaid). No household size table provided; applies to individual applicant[2][3][4]
- Assets: Standard Medicaid SSI resource limits apply (not numerically specified); primary home exempt if: applicant lives there or intends to return and home equity ≤ $752,000 (2026), spouse lives there, or minor/permanently disabled/blind child lives there[1]
- Mississippi resident
- Medicaid eligible
- Nursing Facility Level of Care (NFLOC) via in-person LTSS assessment by RN and social worker (considers ADLs, IADLs, cognitive deficits; numerical score required)[1][2][3][4]
- Physician certification of NFLOC, re-certified every 12 months[3][4]

**Benefits:** Adult day health care, home-delivered meals, personal care services, institutional respite, in-home respite, expanded/extended home health (skilled nursing, nurse aide, physical/speech therapy after state plan exhausted), community transition services, medication management, environmental safety services. Case management by RN/social worker. No specific dollar amounts or hours per week stated[2][5][7]
- Varies by: fixed

**How to apply:**
- Contact Office of Long Term Care or Planning and Development Districts for case management screening/assessment (administered by Division of Medicaid)[2]
- No specific online URL, phone, mail, or in-person details in sources; start via Medicaid eligibility screening

**Timeline:** Not specified
**Waitlist:** Not mentioned (null)

**Watch out for:**
- Must meet NFLOC via specific in-person assessment (dementia diagnosis alone insufficient)[1]
- Income over 300% SSI requires monthly payment via income trust[2][3][4]
- Home equity limit $752,000 (2026) for exemption if intending to return[1]
- Services only after Medicaid state plan benefits exhausted (e.g., extended home health)[7]
- Distinguish from Independent Living Waiver (more severe impairments, ages 16+) or Assisted Living Waiver[5][6]

**Data shape:** Tied to Medicaid/SSI eligibility with NFLOC assessment; no asset numbers but home equity cap; services fixed list, case-managed regionally; income trust for excess over 300% SSI

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ms.gov/programs/elderly-and-disabled-waiver/[2]

---

### Medicare Savings Programs


**Eligibility:**
- Income: Mississippi's Medicare Savings Programs (MSPs) have three tiers with specific monthly income limits for individuals and couples (married). No limits for larger households specified; spousal impoverishment rules apply for long-term care scenarios where only the applicant's income is counted if one spouse applies. Current 2026 limits (most states, including MS): QMB (100% FPL + $20): $1,350 individual, $1,824 couple; SLMB (120% FPL + $20): $1,616 individual, $2,184 couple; QI (135% FPL + $20): $1,816 individual, $2,455 couple. Older MS-specific data: QMB $1,325/$1,783; SLMB up to $1,585/$2,135; QI up to $1,781/$2,400 (individual/couple). All require Medicare Part A eligibility. Income disregards: first $20/month, $65 wages + half remaining wages.[1][2][3]
- Assets: No resource/asset test for any MSP tier in Mississippi (QMB, SLMB, QI). Federal baselines ($9,950 individual/$14,910 couple) do not apply here; resources do not matter.[2]
- Must be eligible for Medicare Part A (Hospital Insurance).
- Mississippi resident.
- U.S. citizen or qualified non-citizen.

**Benefits:** QMB: Pays Medicare Part A/B premiums (including Part A if owed), deductibles, coinsurance/copayments. SLMB: Pays Part B premiums only (up to 3 months retroactive). QI: Pays Part B premiums only. QMB recipients get a Medicaid card; SLMB/QI do not qualify for additional Medicaid benefits.[1][2]
- Varies by: priority_tier

**How to apply:**
- Online: https://medicaid.ms.gov (apply for Medicaid/Medicare cost-sharing)
- Phone: Contact Mississippi Division of Medicaid at 1-800-421-2408 or local office
- Mail/In-person: Local Mississippi Department of Human Services (DHS) Medicaid office (find via medicaid.ms.gov)
- Through State Health Insurance Assistance Program (SHIP): www.shiphelp.org

**Timeline:** QMB: Begins one month after approval (no retroactive). SLMB: Month qualified, up to 3 months before application month. QI: Varies, federal funding capped.[2]
**Waitlist:** QI may have waitlist or funding caps as Congress appropriates limited funds annually; not guaranteed.[2][9]

**Watch out for:**
- No asset test in MS (unlike many states), but income limits are strict and tiered—check exact tier as benefits differ significantly.
- QI has federal funding caps, leading to waitlists or denials even if income-eligible.
- QMB has no retroactive coverage; SLMB does (up to 3 months).
- Spousal impoverishment only for LTSS, not standard MSP.
- Income limits updated annually based on FPL; 2026 figures apply but verify current via official site.
- SLMB/QI do not provide Medicaid card or extra benefits beyond Part B premium.
- Even if over federal limits, MS may disregard certain income/assets—always apply.[2][3][5]

**Data shape:** No asset test (unique to MS among many states); tiered by income with different benefits and retroactivity; income only for individual/couple (no full household table); QI funding capped federally; spousal rules differ for LTSS.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.ms.gov/medicaid-coverage/who-qualifies-for-coverage/medicare-cost-sharing/

---

### SNAP (Supplemental Nutrition Assistance Program) in Mississippi


**Eligibility:**
- Age: No minimum age requirement for the household, but special simplified programs exist for elderly (60+) applicants+
- Income: {"general_households":"Maximum net monthly income limits (100% Federal Poverty Level) vary by household size[3]: 1 person: $1,255; 2 people: $1,704; 3 people: $2,152; 4 people: $2,600; 5 people: $3,049; each additional person add $449[3]","households_with_elderly_or_disabled":"No gross income limit if household has at least one member age 60+ or with a disability[4]. Only the net income test applies (gross income minus allowable deductions)[5]","note":"Net income is calculated by subtracting allowable deductions from gross income[4]"}
- Assets: {"standard_households":"$3,000 in countable resources[3]","households_with_elderly_or_disabled":"$4,500 in countable resources[3]","what_counts":"Bank accounts, cash, real estate, personal property, and vehicles[3]","what_is_exempt":"Your primary residence (house) and at least one vehicle per household are not counted[3]"}
- Must be a resident of Mississippi and apply in the state where you currently live[6]
- Household income must fall within limits for household size[3]
- If household has member 60+ or disabled, only net income test applies (not gross income or asset tests)[5][6]
- Able-bodied adults without dependents must work or participate in work program for at least 20 hours per week to receive benefits beyond 3 months in 36-month period (seniors are exempt)[6]

**Benefits:** Food assistance benefits (amount varies by household size and income; specific benefit amounts not detailed in search results but calculated based on household composition and income)
- Varies by: household_size

**How to apply:**
- In-person at local Mississippi Department of Human Services (MDHS) office
- Phone contact to local MDHS office
- Mail application
- Online application (specific URL not provided in search results)

**Timeline:** Not specified in search results
**Waitlist:** Not mentioned in search results

**Watch out for:**
- Elderly Simplified Application Project (ESAP) is MANDATORY for eligible elderly households — if you meet ESAP criteria (all household members 60+, no earned income, not MSCAP-eligible), you cannot use regular SNAP and must use ESAP[1][2]
- Earned income disqualifies households from ESAP — even one household member with any earned income makes the household ineligible for the simplified elderly program[1][2]
- If you're 60+ or disabled, you only need to pass the net income test, not the gross income test — this is a significant advantage[5][6]
- Asset limits are higher ($4,500 vs $3,000) if household has elderly or disabled member, but primary residence and one vehicle don't count toward limits[3]
- About half of eligible seniors don't receive SNAP despite qualifying — many elderly don't know they're eligible or don't apply[5]
- Mississippi Combined Application Project (MSCAP) is a separate program for SSI recipients with specific requirements; households mandatory for MSCAP cannot use ESAP[1]
- If an MSCAP participant becomes employed, they get 3 consecutive months of earnings before losing MSCAP eligibility and being referred to regular SNAP[1]

**Data shape:** Mississippi offers a specialized Elderly Simplified Application Project (ESAP) that streamlines the application process for elderly households with no earned income. This program is mandatory for eligible elderly households and provides a simpler alternative to regular SNAP. The key structural feature is that households with elderly (60+) or disabled members are exempt from gross income and asset tests, needing only to meet the net income test. Income limits vary significantly by household size. The program distinguishes between three application pathways: regular SNAP, ESAP (for elderly), and MSCAP (for SSI recipients), each with different eligibility criteria.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mdhs.ms.gov/help/snap/special/

---

### Low-Income Home Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 60% of the state median income for household size (exact dollar amounts not specified in sources; varies by household size). Note: General federal guidelines mention 110-150% of federal poverty level, but Mississippi uses 60% state median.[1][2]
- Assets: No asset limits mentioned.
- Has an energy bill due to an energy company or landlord.
- U.S. citizen or legal permanent resident.
- Vulnerable households (elderly, disabled, or children age 5 or younger) receive priority, but not required for eligibility.[1][3]

**Benefits:** Payments made directly to energy vendors to help pay home energy bills (electricity, gas); amount determined by the bill due at the time. Specific dollar amounts not fixed; funding limited.[1][3]
- Varies by: priority_tier

**How to apply:**
- Online: Submit application via MDHS portal, marking 'Community Services' for LIHEAP at https://www.mdhs.ms.gov/community/liheap/[1]
- In-person or through local Community Action Agencies (CAAs) in each of 82 counties.[1]
- Phone/mail/in-person: Contact local CAA (specific numbers not listed; use MDHS site for county contacts).[1]

**Timeline:** Approval within 30 days for regular benefits; 48 hours for emergency (general, not MS-specific). Benefits start within 15 days of approval.[2]
**Waitlist:** Funds limited, first-come first-served; no formal waitlist mentioned, but vulnerable households prioritized.[1]

**Watch out for:**
- Funding is limited and first-come, first-served; apply early.[1][2]
- Must have a current energy bill due.[1]
- Continue paying your full energy bill while waiting for approval.[2]
- Vulnerable households (elderly, disabled, young children) get priority, so highlight if applicable.[1][3]
- Exact income limits are 60% state median (not federal poverty levels as in some states).[1]

**Data shape:** Administered county-by-county via Community Action Agencies; income at 60% state median (household size-based); priority for vulnerable households; seasonal components (heating Oct-Apr, cooling May-Sep, crisis year-round, weatherization Sep-Aug).[1][3]

**Source:** https://www.mdhs.ms.gov/community/liheap/

---

### Weatherization Assistance Program (WAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Households at or below 200% of current Federal Poverty Guidelines[1][3]. Income limits vary by household size; specific dollar amounts are available through the Federal Poverty Guidelines table referenced on the MDHS website[1]. Applicants must be Mississippi residents[2].
- Assets: Not specified in available documentation
- Must be a homeowner, renter, or mobile-home owner[3]
- Proof of identity required for all household members over 18[1]
- Proof of income required[3]
- Proof of residency (utility bills, lease agreement, or mortgage documents)[1]

**Benefits:** Energy efficiency improvements to reduce heating/cooling costs. Nationally, households save an average of $372 or more per year[5]. Services include energy audits, installation of cost-effective energy-efficient measures, health and safety improvements, comfort and air quality enhancements, and energy efficiency education[4].
- Varies by: priority_tier

**How to apply:**
- Online pre-application through Common Web Portal on Access MS (mark 'Community Services' on program list)[1]
- Contact local Community Action Agency (CAA) directly after pre-application submission[1]
- Phone: Contact your regional CAA (example: Southwest Mississippi Opportunity, Inc. at (601) 684-1777 or toll-free (877) 891-1271)[4]

**Timeline:** Not specified in available documentation. CAA staff will contact applicant to schedule appointment after pre-application submission[1].
**Waitlist:** Applicants on waiting lists must have eligibility documentation updated at least annually[2]

**Watch out for:**
- Income eligibility is based on 200% of Federal Poverty Guidelines, not 100%—this is a higher threshold than many assume[1][3]
- Priority is given to seniors (60+), people with disabilities, households with children under 5, high energy users, and households with high energy burden—but all income-eligible households can apply[1]
- Application requires in-person completion with CAA staff after online pre-application; you cannot complete the entire process online[1]
- Eligibility documentation must be updated annually for applicants on waiting lists[2]
- The program focuses on energy efficiency improvements, not direct bill payment assistance; for help paying bills, applicants should explore the Low Income Home Energy Assistance Program (LIHEAP)[6]
- Specific dollar amounts for income limits by household size are not provided in search results—families must check the Federal Poverty Guidelines table on the MDHS website or contact their local CAA[1]

**Data shape:** Benefits are fixed (energy efficiency improvements) rather than scaled by household size or priority tier, though priority tier determines who receives services first. Income limits scale by household size but specific thresholds are not provided in available documentation. Program is statewide but administered through regional CAAs, creating potential variation in processing times and service availability. No asset limits are specified in available documentation.

**Source:** https://www.mdhs.ms.gov/wap/

---

### Mississippi State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all Medicare beneficiaries, their families, and caregivers[1][5]
- Assets: No asset limits or tests apply[1]
- Must be a Medicare beneficiary, under age 65 with Medicare due to disability, dually eligible for Medicare and Medicaid, or family/caregiver of such individuals[1][5]

**Benefits:** Free one-on-one counseling (in-person or phone), education, assistance with Medicare options (Parts A/B/C/D, Medigap), applications for Medicare Savings Programs, Extra Help/LIS, Medicaid; help with claims, appeals, fraud prevention via SMP, policy comparisons, paperwork organization, referrals; group presentations and outreach[1][3][5]

**How to apply:**
- Phone: 1-844-822-4622 (M-F 8am-5pm) or 601-709-0624[5][8]
- Website: Mississippi Department of Human Services (mdhs.ms.gov) Finding Services for Older Adults page[5]
- In-person: Through MDHS Division of Aging and Adult Services or local network providers (contact via phone for appointment)[2][5]

**Timeline:** No formal processing; services provided via appointment scheduling upon contact[3][5]

**Watch out for:**
- Not a financial aid or healthcare provider program—only counseling/education, no direct payments or medical services; prioritizes but doesn't restrict to low-income; during Open Enrollment (e.g., Oct 15-Dec 7), high demand may affect appointment availability; counselors help with but don't guarantee approval for Savings Programs[1][3][5]

**Data shape:** no income/asset test, open to all Medicare-related inquiries, counseling-only service via statewide phone/in-person network with local customization[1][5][7]

**Source:** https://www.mdhs.ms.gov/post/navigating-medicare-made-easy-with-ship/[5]

---

### Home Delivered Meals (Meals on Wheels)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits or means testing; program is not income-based[1][2].
- Assets: No asset limits or means testing[1].
- Homebound or unable to prepare meals due to age, disability, or health status[1][2]
- Reside in a service delivery area/zone[1][2]
- Priority to those on no congregate meals waiting list; may extend to others if no waitlist[1]
- 60+ years old or disabled/homebound (varies slightly by local provider)[2][7]

**Benefits:** Minimum of 33 1/3% of dietary reference intakes (DRIs) per meal; one meal per delivery, nutritionally balanced per Older Americans Act standards; may include emergency/shelf-stable meals[1]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging for your region (no statewide phone; find via local search)[2]
- In-person or phone assessment with local provider (e.g., Union Nutrition Site for specific areas)[2][7]

**Timeline:** Varies; some within a week, longer if waitlist[2]
**Waitlist:** Yes, home-delivered waiting list takes priority; access limited if waitlist exists[1]

**Watch out for:**
- Not means-tested but strictly homebound-focused; car ownership or ability to leave home/cook may disqualify[2]
- Must live in delivery zone; out-of-area seniors need alternatives[2]
- Priority waitlists block access even if eligible[1]
- Separate from Medicaid HCBS waivers (Elderly & Disabled, etc.) which may offer additional meals but require enrollment[3]
- Voluntary contributions requested but not mandatory[1]

**Data shape:** Decentralized by local Area Agencies on Aging with no statewide application; no income/asset test but homebound and zone-restricted; priority via waitlist system[1][2]

**Source:** https://www.law.cornell.edu/regulations/mississippi/18-Miss-Code-R-SS-2-2-10 (Mississippi Code R. 2-2.10)[1]

---

### National Family Caregiver Support Program (Mississippi)


**Eligibility:**
- Age: Care recipient 60+ or caregiver 60+ caring for child under 18; also grandparents/relatives 60+ caring for children 18 and under, or adults 55+ caring for non-child adults 18+ with developmental disabilities[1][4][5]+
- Income: No specific income limits mentioned in available sources[1][4][5]
- Assets: No asset limits mentioned; no details on what counts or exemptions[1][4][5]
- Caregiver providing care for family member age 60 or older, or caregiver age 60+ caring for child under 18
- Includes primary caregivers (spouse, child, relative) of ill, functionally impaired older individual or dementia patient requiring constant in-home care[4][5]

**Benefits:** Five basic services: 1. Information about available services; 2. Assistance gaining access to services; 3. Individual counseling, support groups, caregiver training; 4. Respite care for temporary relief; 5. Supplemental services on limited basis to complement care[4][5][6]

**How to apply:**
- Phone: Mississippi Access to Care (MAC) Center at 844-822-4622[4][5]
- Website: https://www.mdhs.ms.gov/adults-seniors/ or https://www.mdhs.ms.gov/aging/caregivers/[4][5]
- Contact local Area Agencies on Aging (AAA) or community service providers through MAC Center[5]

**Timeline:** No specific timeline provided in sources
**Waitlist:** No information on waitlists

**Watch out for:**
- Program provides non-financial services like respite and counseling, not direct payment to caregivers (distinguish from Medicaid self-direction or VA programs)[2][3][7]
- Separate from Lifespan Respite Program (vouchers: $300 initial/repeat, $400 emergency) and Mississippi Dementia Care Program (27 hours respite/month)[4][5]
- No income/asset tests specified, but eligibility focuses on age and caregiving role; confirm with local AAA for special populations[1][5]
- Services limited/temporary; supplemental services on limited basis only[5]

**Data shape:** State-administered via 10 AAAs with no income/asset tests; services fixed (5 types) but delivered regionally; not cash payment program, focuses on support/respite[4][5]

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mdhs.ms.gov/aging/caregivers/[5]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income of no more than 125% of the federal poverty level. Exact dollar amounts vary annually and by household size; families must check current federal poverty guidelines via HHS or DOL as specific 2026 figures not detailed in sources[2][3].
- Assets: No asset limits mentioned in sources.
- Unemployed
- U.S. citizen or authorized to work
- Enrollment priority: veterans and qualified spouses first, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users[2][3]

**Benefits:** Part-time community service work (average 20 hours/week) at non-profit/public sites (e.g., schools, hospitals, senior centers); paid highest of federal, state, or local minimum wage; on-the-job training and skills development to bridge to unsubsidized jobs; employment assistance via American Job Centers[2][3].
- Varies by: priority_tier

**How to apply:**
- Phone or email via regional subgrantees (see geography.offices_or_providers)
- In-person or mail to subgrantee offices
- No statewide online application; contact local partner for forms[6]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may vary by region and funding.

**Watch out for:**
- Not statewide—must confirm county coverage and contact specific subgrantee; unlisted counties require CWI Works outreach[6]
- Priority enrollment favors veterans/65+/disabilities—non-priority may face longer waits[2][3]
- Part-time (20 hrs/wk) bridge to unsubsidized work, not permanent/full-time job guarantee[2]
- Income at 125% FPL—families often miss annual updates or household size adjustments[2][3]

**Data shape:** County-specific subgrantees with unique contacts; not uniform statewide; priority tiers affect access; income tied to varying federal poverty levels by household size

**Source:** https://www.dol.gov/agencies/eta/seniors

---

### Mississippi Legal Services / Senior Legal Aid


**Eligibility:**
- Income: Gross household income at or below 125% of federal poverty guidelines (based on actual current total receipts before taxes for all resident household members, including wages, salaries, and regular public assistance like Social Security, SSI, TANF). Exact dollar amounts vary annually by household size per HHS guidelines; exceptions possible for seniors considering expenses like medical bills or debts.[2][3][6]
- Assets: No asset limits mentioned in available sources.
- Reside in service area (central/southern Mississippi for MCLSC: 43 counties; northern for NMRLS).
- Priority for special groups like seniors, though no strict age cutoff.
- Must have civil legal issue in areas like elder care, housing, family, consumer, etc.

**Benefits:** Free civil legal assistance (no attorney fees), including advice, representation in areas like elder care, family, housing, employment, consumer, income maintenance, health, domestic violence, foreclosure prevention; provided by nonprofit law firms for low-income persons.[1][3][4]
- Varies by: priority_tier

**How to apply:**
- Phone: MCLSC (central/southern MS) 1-800-519-2915 or 1-800-498-1804; NMRLS (northern MS) 1-800-898-8731.
- Online intake: Temporarily closed for NMRLS; apply via MCLSC site at mscenterforlegalservices.org.
- In-person/mail: Contact intake hotlines for local offices in 43-county areas.

**Timeline:** Not specified in sources.

**Watch out for:**
- Not fully statewide—must contact correct regional provider (north vs. central/south).
- Income is gross household total for all residents contributing to support; exceptions for seniors not guaranteed.
- Online intake temporarily closed for northern region—use phone.
- Separate hotlines effective Jan 2026; verify current numbers.
- Limited to civil law, not criminal.

**Data shape:** Regionally divided providers with separate intake; income at 125% FPL with senior exceptions; no asset test or fixed age requirement; services priority-based for special groups like seniors.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.mslegalservices.org (guide); https://mscenterforlegalservices.org; https://www.nmrls.com

---

### State Long Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; available to any resident, family, or representative in covered facilities regardless of financial status.
- Assets: No asset limits or financial tests apply.
- Must be a resident of a covered long-term care facility in Mississippi (nursing homes, assisted living facilities, personal care homes, extended care homes, skilled nursing facilities, intermediate care facilities, boarding homes), or their family/representative with a concern about care, rights, abuse, neglect, or quality of life.

**Benefits:** Advocacy services including complaint investigation and resolution (71% resolved or partially resolved to resident satisfaction in 2023), facility visits (151,094 in 2023), information and assistance (provided to 973 individuals in 2023), education on resident rights, liaison with facilities and agencies, systemic issue reporting to state/local/federal levels, help choosing facilities, and promotion of resident councils.

**How to apply:**
- Phone: 1-888-844-0041 (toll-free), 601-359-4927 (State Ombudsman Lisa M. Smith)
- Website: https://www.mdhs.ms.gov/aging/ombudsman/
- Mail: MDHS, 200 South Lamar St., Jackson, MS 39201
- In-person or regional: Contact 19 local ombudsmen covering 82 counties (e.g., Golden Triangle at 662-498-1170)

**Timeline:** Immediate assistance for complaints; no formal processing time specified as services are responsive rather than application-based.

**Watch out for:**
- Not a financial aid or direct service program—provides advocacy only, not healthcare, housing, or payment; requires resident in licensed facility (not home care); confidential unless permission given; becoming an ombudsman volunteer requires 40-hour training (unrelated to receiving services).

**Data shape:** no income test; advocacy-only for facility residents; delivered via 19 regional ombudsmen statewide; open to anyone with concerns, no eligibility barriers.

**Source:** https://www.mdhs.ms.gov/aging/ombudsman/

---

### Mississippi Respite Voucher Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits specified; available to Mississippi caregivers providing unpaid care for a dependent person of any age with a significant disability or chronic illness requiring 24/7 care[2][3]
- Assets: No asset limits mentioned[2][3]
- Must be a Mississippi resident providing unpaid care for a dependent person of any age with a significant disability or chronic illness requiring 24/7 care[2][3]

**Benefits:** Vouchers to pay in-home care agency, Adult Day Center, or private individual for respite care while caregiver is away. Initial voucher: $300 per household. Repeat voucher: $290 after approximately six months from initial approval. Emergency respite available (details not specified)[2][3]
- Varies by: fixed

**How to apply:**
- Phone: Call Mississippi Access to Care (MAC) Center at 1-844-822-4622 to speak to a resource specialist for assistance completing an application or request from local office[2][3]
- In-person or mail: Request application from local office via MAC Center[2][3]

**Timeline:** Not specified in available sources

**Watch out for:**
- Separate from Medicaid waivers like Elderly & Disabled Waiver which have strict age, income, asset, and nursing facility level of care requirements— this program has no such limits and covers caregivers of dependents of any age[1][2]
- Initial $300 is per household, not per caregiver; repeat requires reapplication after ~6 months[2]
- Vouchers for short-term respite breaks only, not ongoing care[2][3]
- Must specify preferred respite type (in-home agency, out-of-home facility, etc.) on application[8]

**Data shape:** No income/asset test; caregiver-focused for any-age dependents needing 24/7 care; fixed low-dollar vouchers per household with repeat option; statewide via centralized phone intake with local offices[2][3]

**Source:** https://www.mdhs.ms.gov/wp-content/uploads/2023/09/Respite-Flyer.pdf (MDHS flyer); https://archrespite.org/wp-content/uploads/2022/12/MS-Voucher-Flyers-2022.pdf[2][3]

---

### Central Mississippi Area Agency on Aging Reassurance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: No specific income or asset limits mentioned; program appears open to aging population in service area without financial thresholds detailed[6][8]
- Assets: No asset limits or exemptions specified in available information[6][8]
- Must reside in Central Mississippi service counties: Copiah, Hinds, Madison, Rankin, Simpson, Warren, Yazoo[6]
- Must be available for scheduled phone calls (client's only obligation)[6]
- Provide primary doctor name, doctor's phone, preferred hospital, hospital number on application[8]

**Benefits:** Regular social phone calls; wellness checks; helpline for assistance; emergency follow-up calls. Provided via fully staffed helpline by trained Resource Specialists[6]
- Varies by: fixed

**How to apply:**
- Phone: 844-822-4622 (Mississippi Access to Care Center, call between 8:00 a.m. and 4:30 p.m.)[6][8]
- In-person or mail: Central MS Area Agency on Aging, 1170 Lakeland Drive, Jackson, MS 39296-4935[6]
- Email: macjackson@cmpdd.org[6]
- Download application form from cmpdd.org[6][8]

**Timeline:** Not specified in available sources

**Watch out for:**
- Limited to specific 7 counties only—not statewide[6]
- Client must be available for calls; no other obligations but non-availability may disqualify[6]
- Not a comprehensive care program—focuses on phone-based reassurance, not in-home or medical services[6]
- Separate from Medicaid E&D Waiver or other statewide programs; do not confuse with nursing facility level care waivers[3][4]

**Data shape:** County-restricted to 7 Central MS counties; phone reassurance service with no income/age tests detailed; minimal documentation required; operates via single helpline and agency office

**Source:** https://cmpdd.org/images/aging/Reassurance-Program-brochure.pdf

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Mississippi Medicaid (Elderly and Disabl | benefit | state | deep |
| Mississippi Elderly and Disabled (E&D) W | benefit | state | deep |
| Medicare Savings Programs | benefit | federal | deep |
| SNAP (Supplemental Nutrition Assistance  | benefit | federal | medium |
| Low-Income Home Energy Assistance Progra | benefit | federal | deep |
| Weatherization Assistance Program (WAP) | benefit | federal | deep |
| Mississippi State Health Insurance Assis | resource | federal | simple |
| Home Delivered Meals (Meals on Wheels) | benefit | federal | medium |
| National Family Caregiver Support Progra | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Mississippi Legal Services / Senior Lega | resource | local | simple |
| State Long Term Care Ombudsman Program | resource | federal | simple |
| Mississippi Respite Voucher Program | benefit | state | medium |
| Central Mississippi Area Agency on Aging | navigator | local | simple |

**Types:** {"benefit":9,"resource":3,"employment":1,"navigator":1}
**Scopes:** {"state":4,"federal":8,"local":2}
**Complexity:** {"deep":7,"medium":3,"simple":4}

## Content Drafts

Generated 14 page drafts. Review in admin dashboard or `data/pipeline/MS/drafts.json`.

- **Mississippi Medicaid (Elderly and Disabled)** (benefit) — 4 content sections, 6 FAQs
- **Mississippi Elderly and Disabled (E&D) Waiver** (benefit) — 4 content sections, 6 FAQs
- **Medicare Savings Programs** (benefit) — 5 content sections, 6 FAQs
- **SNAP (Supplemental Nutrition Assistance Program) in Mississippi** (benefit) — 4 content sections, 6 FAQs
- **Low-Income Home Energy Assistance Program (LIHEAP)** (benefit) — 4 content sections, 6 FAQs
- **Weatherization Assistance Program (WAP)** (benefit) — 3 content sections, 6 FAQs
- **Mississippi State Health Insurance Assistance Program (SHIP)** (resource) — 1 content sections, 6 FAQs
- **Home Delivered Meals (Meals on Wheels)** (benefit) — 3 content sections, 6 FAQs
- **National Family Caregiver Support Program (Mississippi)** (benefit) — 2 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Mississippi Legal Services / Senior Legal Aid** (resource) — 2 content sections, 6 FAQs
- **State Long Term Care Ombudsman Program** (resource) — 1 content sections, 6 FAQs
- **Mississippi Respite Voucher Program** (benefit) — 1 content sections, 6 FAQs
- **Central Mississippi Area Agency on Aging Reassurance Program** (navigator) — 1 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **not_applicable**: 4 programs
- **fixed**: 3 programs
- **priority_tier**: 5 programs
- **household_size**: 1 programs
- **region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Mississippi Medicaid (Elderly and Disabled)**: Tied to SSI thresholds (300% limit, annual COLA changes); NFLOC via scored in-person tool; waiver caps create waitlists; regional districts handle delivery but statewide uniform rules
- **Mississippi Elderly and Disabled (E&D) Waiver**: Tied to Medicaid/SSI eligibility with NFLOC assessment; no asset numbers but home equity cap; services fixed list, case-managed regionally; income trust for excess over 300% SSI
- **Medicare Savings Programs**: No asset test (unique to MS among many states); tiered by income with different benefits and retroactivity; income only for individual/couple (no full household table); QI funding capped federally; spousal rules differ for LTSS.
- **SNAP (Supplemental Nutrition Assistance Program) in Mississippi**: Mississippi offers a specialized Elderly Simplified Application Project (ESAP) that streamlines the application process for elderly households with no earned income. This program is mandatory for eligible elderly households and provides a simpler alternative to regular SNAP. The key structural feature is that households with elderly (60+) or disabled members are exempt from gross income and asset tests, needing only to meet the net income test. Income limits vary significantly by household size. The program distinguishes between three application pathways: regular SNAP, ESAP (for elderly), and MSCAP (for SSI recipients), each with different eligibility criteria.
- **Low-Income Home Energy Assistance Program (LIHEAP)**: Administered county-by-county via Community Action Agencies; income at 60% state median (household size-based); priority for vulnerable households; seasonal components (heating Oct-Apr, cooling May-Sep, crisis year-round, weatherization Sep-Aug).[1][3]
- **Weatherization Assistance Program (WAP)**: Benefits are fixed (energy efficiency improvements) rather than scaled by household size or priority tier, though priority tier determines who receives services first. Income limits scale by household size but specific thresholds are not provided in available documentation. Program is statewide but administered through regional CAAs, creating potential variation in processing times and service availability. No asset limits are specified in available documentation.
- **Mississippi State Health Insurance Assistance Program (SHIP)**: no income/asset test, open to all Medicare-related inquiries, counseling-only service via statewide phone/in-person network with local customization[1][5][7]
- **Home Delivered Meals (Meals on Wheels)**: Decentralized by local Area Agencies on Aging with no statewide application; no income/asset test but homebound and zone-restricted; priority via waitlist system[1][2]
- **National Family Caregiver Support Program (Mississippi)**: State-administered via 10 AAAs with no income/asset tests; services fixed (5 types) but delivered regionally; not cash payment program, focuses on support/respite[4][5]
- **Senior Community Service Employment Program (SCSEP)**: County-specific subgrantees with unique contacts; not uniform statewide; priority tiers affect access; income tied to varying federal poverty levels by household size
- **Mississippi Legal Services / Senior Legal Aid**: Regionally divided providers with separate intake; income at 125% FPL with senior exceptions; no asset test or fixed age requirement; services priority-based for special groups like seniors.
- **State Long Term Care Ombudsman Program**: no income test; advocacy-only for facility residents; delivered via 19 regional ombudsmen statewide; open to anyone with concerns, no eligibility barriers.
- **Mississippi Respite Voucher Program**: No income/asset test; caregiver-focused for any-age dependents needing 24/7 care; fixed low-dollar vouchers per household with repeat option; statewide via centralized phone intake with local offices[2][3]
- **Central Mississippi Area Agency on Aging Reassurance Program**: County-restricted to 7 Central MS counties; phone reassurance service with no income/age tests detailed; minimal documentation required; operates via single helpline and agency office

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Mississippi?
