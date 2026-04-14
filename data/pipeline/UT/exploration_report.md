# Utah Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.075 (15 calls, 8.3m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 13 |
| Programs deep-dived | 13 |
| New (not in our data) | 11 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `waitlist` | 2 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |

## Program Types

- **service**: 7 programs
- **financial**: 3 programs
- **service|advocacy**: 1 programs
- **employment**: 1 programs
- **advocacy**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Utah Medicaid Program

- **income_limit**: Ours says `$1255` → Source says `$45` ([source](https://medicaid.utah.gov/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Long-term care: Nursing home care, HCBS waivers (home/community-based services like daily living assistance), assisted living, adult foster care, non-medical home supports; regular ABD covers health services for aged/blind/disabled[1][2]. No specific dollar amounts/hours stated; covers as long as eligible, potentially lifelong[4].` ([source](https://medicaid.utah.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.utah.gov/`

### Utah Aging Waiver

- **income_limit**: Ours says `$1255` → Source says `$1,305` ([source](https://medicaid.utah.gov (inferred from context; county sites like sanjuancountyut.gov/aging-services and saltlakecounty.gov reference state program)[4][5].))
- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Core: case management; other services include personal care, respite/respite care (including LTC facility extension >13 days), adult day care, home modifications/environmental adaptations, specialized medical equipment/supplies/assistive technology (no physician prescription needed for some), non-medical transportation, supplemental meals, personal emergency response systems (PERS) installation/testing/removal/purchase/rental/repair/response, training services, personal budget assistance; no fixed dollar/hour limits specified, tailored via case manager plan of care[4][6].` ([source](https://medicaid.utah.gov (inferred from context; county sites like sanjuancountyut.gov/aging-services and saltlakecounty.gov reference state program)[4][5].))
- **source_url**: Ours says `MISSING` → Source says `https://medicaid.utah.gov (inferred from context; county sites like sanjuancountyut.gov/aging-services and saltlakecounty.gov reference state program)[4][5].`

## New Programs (Not in Our Data)

- **Utah PACE (Program of All-Inclusive Care for the Elderly)** — service ([source](No Utah-specific .gov source; general PACE info at https://www.cms.gov/medicare/medicaid-coordination/about/pace))
  - Shape notes: Program not available in Utah; no providers, applications, or regional variations; national PACE model has no financial tests but requires service area proximity which does not exist here
- **Medicare Savings Programs (QMB, SLMB, QI)** — financial ([source](https://medicaid.utah.gov/medicare-cost-sharing-programs/[2]))
  - Shape notes: Tiered by income brackets (QMB ≤100% FPL, SLMB 100-120%, QI 120-135%); QI funding capped; asset test with standard federal exemptions; statewide uniform
- **Utah SNAP (Supplemental Nutrition Assistance Program)** — financial ([source](https://jobs.utah.gov/customereducation/services/foodstamps/))
  - Shape notes: No gross income test for households with 60+ member; higher $4,500 asset limit; ESAP 3-year approval with single interview; benefits calculated via net income + elderly-specific deductions (medical/shelter)[2][4][6]
- **Utah LIHEAP (Low-Income Home Energy Assistance Program)** — financial ([source](https://jobs.utah.gov/housing/scso/seal/heat.html))
  - Shape notes: Administered as HEAT program under LIHEAP; regional providers required; income at 150% FPL; priority tiers for elderly/disabled/kids; benefits capped by type (heating/cooling/crisis); funds limited by exhaustion not fixed deadlines.
- **Utah Weatherization Assistance Program** — service ([source](https://jobs.utah.gov/housing/scso/wap/how.html))
  - Shape notes: Administered by 7 county-specific agencies with unique contacts; eligibility ties to HEAT program for priority; priority tiers drive waitlist order; no age minimum but elderly prioritized.
- **Utah SHIP (State Health Insurance Assistance Program)** — service|advocacy ([source](https://www.cms.gov/contacts/senior-health-insurance-information-program-ship/general-beneficiary-contact/1565301 and daas.utah.gov/seniors/[3]))
  - Shape notes: Utah SHIP is a counseling and navigation service rather than a direct benefits program. It has no income or asset limits for eligibility (serves all Medicare beneficiaries), no application process (just contact to schedule counseling), and no processing timeline (it's immediate consultation). The program's value is in helping beneficiaries understand complex Medicare options and identify other assistance programs they may qualify for. Unlike CHIP, which has specific income thresholds and enrollment deadlines, SHIP is an ongoing advisory service available to all Medicare-eligible individuals.
- **Utah Meals on Wheels** — service ([source](https://rules.utah.gov/publicat/code_rtf/r510-104.rtf (Utah Admin Code R510-104, Aging & Adult Services)))
  - Shape notes: Decentralized by county/PSA with local AAAs managing; no statewide income/asset tests; variations in costs, waitlists, exact rules, and providers; homebound + 60+ core but priority to isolated/frail
- **Utah Caregiver Support Program (UCSP)** — service ([source](https://daas.utah.gov/seniors/ and https://magutah.gov/cgsupport/))
  - Shape notes: This program is unique in having NO income limits but STRICT burden/stress requirements. Benefits are capped at $1,500/year (not unlimited). Eligibility is determined through a multi-step assessment process (intake screening + burden score) rather than simple demographic criteria. Program is statewide but county-administered, creating potential regional variation in wait times and service availability. Priority tiers exist based on age and economic need, not first-come-first-served. Care recipient must meet functional criteria (2+ ADL deficits), not just age/diagnosis.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://daas.utah.gov/wp-content/uploads/2024/05/Utah-SCSEP-Four-Year-State-Plan-2024-for-public-comment-1.pdf (Utah SCSEP Four-Year State Plan)))
  - Shape notes: Federally-funded but administered by grantees like Easterseals-Goodwill in Utah (not fully statewide); income at 125% FPL with family calculation; strict lifetime 48-month limit; priority tiers heavily influence enrollment over basic eligibility
- **Utah Legal Services for Seniors** — service ([source](https://www.utahlegalservices.org/))
  - Shape notes: Income at 125% FPL standard with exceptions to 200%; no fixed asset table or current dollar table in sources (uses annual FPL); senior-specific (60+) with Older Americans Act funding beyond LSC; regional providers and county contracts add variation.
- **Utah Long-Term Care Ombudsman Program** — advocacy ([source](https://daas.utah.gov/long-term-care-ombudsman/))
  - Shape notes: This is a statewide advocacy program with no eligibility barriers (no income/asset tests). It operates through 11 regional programs. The key distinction: families should contact this program if their loved one is ALREADY in a facility and needs advocacy; this is not an entry or funding program.

## Program Details

### Utah Medicaid Program


**Eligibility:**
- Age: 65+
- Income: Varies by program (2025-2026 figures): Institutional/Nursing Home Medicaid: No strict limit, but most income pays toward care with $45 personal needs allowance[1][2][5]. HCBS Waivers: $2,901/month (New Choices Waiver) or $1,255-$1,305/month (Aging Waiver)[1][5]. Regular Medicaid (ABD): $1,255/month single or $1,704/month couple[1][5]. Medically Needy (Spenddown): $1,330/month single or $1,803.33/month couple (effective 3/1/26-2/28/27)[2]. No household size table specified beyond couples; applies to low-income elderly.
- Assets: Single applicant: $2,000 countable assets[2][4][5]. Married couples: $3,000-$4,000 combined if both apply; community spouse keeps up to 50% of assets ($157,920 max or $31,584 min if lower) if one applies[5]. Exempt: Primary home (equity ≤$730,000 if intent to return), one vehicle, personal belongings/household items/appliances, burial plots/irrevocable trusts ≤$7,000, life insurance ≤$1,500 face value[1][5].
- Utah resident and U.S. citizen/qualified immigrant[1]
- Blind, disabled, or nursing home level of care (NHLOC) for long-term care programs[1][2]
- Functional need for ADLs in some programs[2]

**Benefits:** Long-term care: Nursing home care, HCBS waivers (home/community-based services like daily living assistance), assisted living, adult foster care, non-medical home supports; regular ABD covers health services for aged/blind/disabled[1][2]. No specific dollar amounts/hours stated; covers as long as eligible, potentially lifelong[4].
- Varies by: priority_tier

**How to apply:**
- Online: https://medicaid.utah.gov/apply/[3] (inferred from official site structure)
- Phone: 1-866-435-7414 or 801-526-0950 (regional)[8]
- In-person: Local offices (e.g., Utah/Wasatch/Summit Counties via MAG: 801-526-9675)[8]
- Mail: Not specified; use online/paper forms via official site

**Timeline:** Coverage may begin 3 months prior to approval; applications sometimes take longer than expected—ask for usual timeframe[4]
**Waitlist:** Not mentioned in sources; may vary by waiver demand[null]

**Watch out for:**
- Multiple program tiers (Institutional, HCBS Waivers like Aging/New Choices, Regular ABD) with different income/asset rules—must select correct one[1][2]
- Home exempt but subject to Estate Recovery after death[5]
- Most income goes to care costs in nursing home program, only $45 personal allowance[1][2][5]
- Medically Needy Spenddown for those over limits via high medical expenses[2]
- Spousal impoverishment protections for community spouse assets/income[5]

**Data shape:** Multiple sub-programs with varying income caps by waiver type (e.g., Aging Waiver lower than New Choices); no strict income limit for nursing home but pay-down required; asset exemptions detailed but home equity capped at $730,000; medically needy spenddown pathway unique

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.utah.gov/

---

### Utah PACE (Program of All-Inclusive Care for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No income limits; no financial criteria considered for eligibility
- Assets: No asset limits; financial eligibility not required
- Live in the service area of a PACE organization (none currently in Utah)
- Certified by the state as requiring nursing home level of care (NFLOC)
- Able to live safely in the community with PACE services
- Not enrolled in Medicare Advantage, Medicare prepayment plan, Medicare prescription drug plan, or hospice

**Benefits:** Comprehensive medical and social services including primary care, nursing, therapies, caregivers, social workers, medications, and long-term care; no deductibles or copays for covered services; specific hours or amounts not detailed in sources

**Timeline:** Not applicable; no program available

**Watch out for:**
- Utah does not currently offer PACE; one of 19 states without a program
- No local providers or service areas exist in Utah
- Families cannot apply; program unavailable despite national eligibility criteria
- Other Utah programs (e.g., C-PACE for property, SLCC PACE scholarship) are unrelated

**Data shape:** Program not available in Utah; no providers, applications, or regional variations; national PACE model has no financial tests but requires service area proximity which does not exist here

**Source:** No Utah-specific .gov source; general PACE info at https://www.cms.gov/medicare/medicaid-coordination/about/pace

---

### Medicare Savings Programs (QMB, SLMB, QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Utah follows federal standards with income disregards. For 2026 (effective April 2026): QMB: Individual $1,350/month, married couple $1,824/month (at or below 100% FPL + $20 disregard). SLMB: Above QMB up to 120% FPL (individual ~$1,620, couple ~$2,189). QI: Above SLMB up to 135% FPL (individual ~$1,823, couple ~$2,462). Exact limits from prior years (2024): QMB individual $1,325/couple $1,783; SLMB individual $1,585/couple $2,135; QI individual $1,781/couple $2,400. Verify current FPL at state agency as announced yearly[2][3][6].
- Assets: Federal limits apply: $9,950 individual/$14,910 couple (2026); prior $9,660/$14,470. Countable: cash, bank accounts, stocks (over $1,500 face value), non-exempt life insurance. Exempt: primary home, one vehicle, household items, wedding/engagement rings, burial plots, up to $1,500 burial expenses, $20/$65 + half wages income disregard, food stamps, certain Native American payments[3][4][6].
- Must be eligible for Medicare Part A (QMB) or enrolled in Part A (SLMB/QI); Part B required for SLMB/QI.
- Utah resident.
- QI: Cannot receive Medicaid[2].

**Benefits:** QMB: Pays Part A premiums (if applicable), Part B premiums/deductibles, Part A/B coinsurance/copayments/deductibles. SLMB: Part B premiums only. QI: Part B premiums only. QMB issues Medicaid card ('MEDICARE COST-SHARING ONLY' if no other Medicaid); no card for SLMB/QI[1][2][6].
- Varies by: priority_tier

**How to apply:**
- Contact Utah Medicaid agency: https://medicaid.utah.gov/medicare-cost-sharing-programs/[2].
- Phone or request application from state Medicaid office (specific local numbers via site).
- Mail, phone, or in-person at local Medicaid offices.

**Timeline:** QMB: Up to 45 days, effective first of month after determination. SLMB/QI: Up to 3 months retroactive[1][2].
**Waitlist:** QI: Possible when federal funds exhausted (not entitlement); no new applicants until next year[2].

**Watch out for:**
- QI not entitlement; funds can run out, blocking new applicants[2].
- Income limits update April yearly with FPL; use $20 disregard for QMB[1][4].
- Must have Part A enrolled for SLMB/QI, eligible for QMB[2].
- QMB card needed to prevent provider billing; providers can't charge QMB beneficiaries[2].
- Assets include most non-exempt items; exemptions often missed (e.g., one car, home)[3][4].
- SLMB/QI no card issued; premium paid directly[2].

**Data shape:** Tiered by income brackets (QMB ≤100% FPL, SLMB 100-120%, QI 120-135%); QI funding capped; asset test with standard federal exemptions; statewide uniform

**Source:** https://medicaid.utah.gov/medicare-cost-sharing-programs/[2]

---

### Utah SNAP (Supplemental Nutrition Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: For households with a member 60+ or disabled (common for elderly), no gross income limit in Utah. Must meet net income limit only (net income = gross minus deductions like medical expenses over $35/month for elderly/disabled, shelter costs, utilities). Federal reference: $15,060 annual net for 1 person, $20,440 for 2 (Oct 2025-Sept 2026); exact net varies by deductions and household size[1][2][3].
- Assets: Households with member 60+ or disabled: $4,500 countable resources (e.g., bank accounts). Exempt: home, vehicles, retirement savings, household goods, life insurance cash value (if not income-producing), primary residence[2][6].
- Household includes those who live together, buy/prepare food together (include spouse/children under 22 even if separate)[2]
- U.S. citizenship not required; many non-citizens qualify if lived in U.S. 5+ years, children under 18, or receiving disability benefits[4][5]
- No work requirements for seniors 60+[4][5]
- ESAP for elderly/disabled: simplified process[4]

**Benefits:** Monthly EBT card for food purchases; amount based on net income, household size, deductions (e.g., example 2-person elderly household: $415/month after calculation)[3].
- Varies by: household_size

**How to apply:**
- Online: mycase.utah.gov (primary Utah portal, inferred from state Workforce Services)[4]
- Phone: 1-866-526-3663 (Utah SNAP hotline, standard state contact)
- In-person: local Workforce Services offices (statewide)
- Mail: Download form from jobs.utah.gov and mail to local office

**Timeline:** ESAP for elderly: one interview, approved for 3 years; standard processing 30 days[4].

**Watch out for:**
- Elderly households skip gross income test but must pass net income; high medical/shelter costs can deduct significantly[1][2]
- Assets $4,500 for elderly (higher than $3,000 standard); exempt items often missed (home, cars OK)[6]
- Include all who buy/prepare food; non-citizens may qualify[2][5]
- ESAP simplifies recertification to 3 years for elderly/disabled[4]
- Only ~half of eligible seniors apply[1]

**Data shape:** No gross income test for households with 60+ member; higher $4,500 asset limit; ESAP 3-year approval with single interview; benefits calculated via net income + elderly-specific deductions (medical/shelter)[2][4][6]

**Source:** https://jobs.utah.gov/customereducation/services/foodstamps/

---

### Utah LIHEAP (Low-Income Home Energy Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross monthly household income at or below 150% of the Federal Poverty Level. Specific limits from one source: 1 person $1,956; 2 people $2,644; 3 people $3,331; 4 people $4,018; 5 people $4,707; 6 people $5,394. Other sources cite examples like family of four at $3,750-$4,125/month.[1][3][6]
- Assets: No asset limits mentioned in state program sources; tribal program considers resources but not detailed for state LIHEAP.[2]
- Household responsible for paying home energy costs (directly or indirectly, e.g., via rent).[3][4]
- At least one adult (18+ or emancipated).[3]
- At least one US citizen or qualified non-citizen.[3][4][5]
- Household includes all at address sharing utility bill.[1]

**Benefits:** Heating/cooling: $190 minimum to $850 maximum; Crisis: up to $2,000 maximum. Paid directly to utility vendor based on income, size, fuel type.[1]
- Varies by: household_size|priority_tier|region

**How to apply:**
- Contact local HEAT office (regional providers handle applications; see geography.offices_or_providers).[3][6]
- Online eligibility check and possible application via mydoorway.utah.gov/utility-assistance.[6]
- Phone or in-person at local agencies.[3][4][5]

**Timeline:** Not specified; funds limited, apply early.[1][3]
**Waitlist:** No waitlist mentioned; applications stop when funds exhausted.[1][3]

**Watch out for:**
- Priority applications for elderly (60+), disabled, children under 6 start Oct 1; general public Nov 1; funds exhaust quickly.[1][3]
- Cannot apply to both state HEAT and tribal programs.[2]
- Household includes all sharing address/utility bill, unlike SNAP.[1]
- Year-round but program year Oct 1-Sep 30 or funds end.[3]
- Must reapply annually.[2]

**Data shape:** Administered as HEAT program under LIHEAP; regional providers required; income at 150% FPL; priority tiers for elderly/disabled/kids; benefits capped by type (heating/cooling/crisis); funds limited by exhaustion not fixed deadlines.

**Source:** https://jobs.utah.gov/housing/scso/seal/heat.html

---

### Utah Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross annual household income at or below 200% of the Federal Poverty Level (FPL). Exact dollar amounts vary by household size and year; for example, consult current HHS Poverty Guidelines (e.g., for 2026, a single person might be around $30,120, family of 4 around $62,400—verify latest at agency). Also eligible if current HEAT program recipient (which uses 150% FPL). Income based on gross monthly without deductions.[1][2][3]
- Assets: No asset limits mentioned in program guidelines.[1][2][3]
- Household must include at least one adult who is a U.S. citizen or qualified non-citizen.[1]
- Homeowners or renters eligible; renters need notarized Weatherization Rental Agreement.[2]
- Home must have never been weatherized or weatherized more than 15 years ago; determined by energy audit.[2]
- Priority to elderly, disabled, households with children under 6, and high energy cost households.[2][3]

**Benefits:** Professional weatherization services including computerized energy audits, advanced diagnostic equipment for cost-effective home improvements (e.g., insulation, sealing, furnace/AC/water heater repairs if crisis via HEAT), safety inspections, and indoor air quality checks. No specific dollar amount or hours; services tailored per audit.[2]
- Varies by: priority_tier

**How to apply:**
- Contact regional agency by county (7 agencies statewide): e.g., Bear River AoG for Box Elder/Cache/Rich (435-752-7242, weatherization@brag.utah.gov, 95 W 100 S #116, Logan UT 84321); Utah Community Action for Davis/Morgan/Weber/Salt Lake/Tooele (801-214-3215, info@utahca.org, 1307 S 900 W, Salt Lake City UT 84104); Mountainland for other areas (weatherization@mountainland.org, 478 South Geneva Rd, Vineyard UT 84059); Five County AoG for Beaver/Iron/Washington/Garfield/Kane (435-865-0195, Cedar City office).[1][2][3]
- Submit by mail, email, fax, or drop-off to regional agency.
- Agency service area map and full list at https://jobs.utah.gov/housing/scso/wap/how.html[1]

**Timeline:** Not specified; eligibility determined after submission, then prioritized and placed on waiting list.[1][2]
**Waitlist:** Yes, applications prioritized by need (e.g., elderly, disabled) and placed on waiting list.[1][2][3]

**Watch out for:**
- Must contact specific agency by your county—statewide but regionally administered; wrong agency delays.[1]
- Renters need notarized landlord agreement; HEAT recipients get priority/fast-track but must match names.[1][2][3]
- Home eligibility requires audit; previously weatherized within 15 years ineligible.[2]
- Priority-based waitlist favors elderly/disabled/kids under 6—others wait longer.[2][3]
- U.S. citizen/qualified non-citizen adult required in household.[1]

**Data shape:** Administered by 7 county-specific agencies with unique contacts; eligibility ties to HEAT program for priority; priority tiers drive waitlist order; no age minimum but elderly prioritized.

**Source:** https://jobs.utah.gov/housing/scso/wap/how.html

---

### Utah SHIP (State Health Insurance Assistance Program)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65 or older (implied by Medicare eligibility requirement)+
- Income: No specific income limits stated in available sources. SHIP serves all Medicare beneficiaries regardless of income, though some related programs (Medicare Savings Programs) have income limits around $1,800/month for individuals or $2,400/month for couples[5].
- Assets: Not specified in available sources
- Must be eligible for Medicare or will be eligible for Medicare soon[2]
- Family members and caregivers of Medicare beneficiaries can also access SHIP services[2]

**Benefits:** Free, personalized one-on-one counseling and assistance. Counselors provide guidance on: Medicare terms and options, enrollment timing and procedures, Medicare Parts A, B, C, D and Medigap/supplemental insurance, Medicare appeals process, enrollment penalties, coordinating benefits, and helping with Medicare costs including prescription drugs[2]. Counselors can also help identify eligibility for Medicare Savings Programs (MSPs) and Extra Help prescription drug assistance[5].
- Varies by: not_applicable — services are standardized across the program

**How to apply:**
- Phone: 1-800-541-7735 (Utah SHIP toll-free number)[3]
- Phone: 1-877-839-2675 (National SHIP program)[2]
- Online: Visit shiphelp.org, click 'Find Local Medicare Help' or 'SHIP Locator,' then select Utah[2]
- In-person: Contact the Utah Department of Human Services office at 195 North 1950 West, Salt Lake City, UT 84116[3]
- Email: dhotton@utah.gov[3]
- Website: daas.utah.gov/seniors/[3]

**Timeline:** Not specified. Counselors suggest contacting SHIP 3 months before Medicare starts, but assistance is available at any point after that[2].
**Waitlist:** Not mentioned in available sources

**Watch out for:**
- SHIP is a counseling and assistance program, NOT a health insurance program itself — it helps people navigate Medicare and find other programs they may qualify for[7]
- SHIP can help identify eligibility for Medicare Savings Programs (MSPs) and Extra Help, but you must apply separately for those programs through Social Security Administration or other channels[5]
- SHIP counselors receive 8-10 hours of intensive training on Medicare, but availability and response times may vary by local office[2]
- This is different from Utah's Children's Health Insurance Program (CHIP) — SHIP is for Medicare beneficiaries (typically 65+), while CHIP serves children under 19[1][4]
- Services are free and unbiased, but SHIP is an information and counseling service — it does not directly enroll you in programs or process applications for benefits

**Data shape:** Utah SHIP is a counseling and navigation service rather than a direct benefits program. It has no income or asset limits for eligibility (serves all Medicare beneficiaries), no application process (just contact to schedule counseling), and no processing timeline (it's immediate consultation). The program's value is in helping beneficiaries understand complex Medicare options and identify other assistance programs they may qualify for. Unlike CHIP, which has specific income thresholds and enrollment deadlines, SHIP is an ongoing advisory service available to all Medicare-eligible individuals.

**Source:** https://www.cms.gov/contacts/senior-health-insurance-information-program-ship/general-beneficiary-contact/1565301 and daas.utah.gov/seniors/[3]

---

### Utah Meals on Wheels

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income limits; program is available regardless of income[6].
- Assets: No asset limits mentioned across sources.
- Homebound (unable to leave home without assistance)[1][5][6][8]
- Unable to shop or prepare meals due to mobility challenges, disability, or frailty[1][2][5][7]
- Resident of the local program's delivery zone or service area (varies by county/PSA)[1][5]
- Do not drive a vehicle (in some areas like Davis County)[5]
- Priority to isolated individuals[6][8]
- Spouses or disabled dependents may qualify in some programs[1][6]
- Under 60 may qualify in limited cases (e.g., disabilities, alternatives clients, or spouses/children with payment)[3][6]

**Benefits:** Nutritious home-delivered midday/lunch meals (hot, one-third daily nutritional needs, low-sodium, heart-healthy; includes protein, vegetables, fruit, grains, milk); 1 meal per delivery day, 5 days/week (Mon-Fri, excluding holidays); optional weekend meals (delivered Thu/Fri in some areas); frequency 1-5 days/week based on need; personal wellness check during delivery[3][5][6][7][8]
- Varies by: region

**How to apply:**
- Contact local Area Agency on Aging (AAA), senior center, or Meals on Wheels provider by phone or online referral[1][2][6]
- Phone examples: Davis County (801-525-5099 implied via site), Utah/Wasatch/Summit Counties (801-229-3802), Cache County (435-755-1720 or 435-755-1722)[5][6][7]
- Online referral (e.g., MAG Utah: magutah.gov/meals/)[6]
- In-person assessment required by staff before starting[6][7]

**Timeline:** Varies; some within a week, others longer due to waitlists; initial assessment after contact[1]
**Waitlist:** Yes, in some areas (e.g., Utah County since Jan 2022)[6]

**Watch out for:**
- Must live in specific delivery zone; check local program first[1]
- Homebound strictly assessed/documented annually; able to leave easily or have caregivers may not qualify[1][3][5]
- Suggested donations ($3.50-$4/meal) are voluntary but help expand service; under 60 often pay full[5][6]
- Meals not left if client absent; must cancel by 9am[7]
- Waitlists in high-demand areas like Utah County[6]
- Car ownership may disqualify in some areas[1][5]
- In-person assessment mandatory before starting[6][7]

**Data shape:** Decentralized by county/PSA with local AAAs managing; no statewide income/asset tests; variations in costs, waitlists, exact rules, and providers; homebound + 60+ core but priority to isolated/frail

**Source:** https://rules.utah.gov/publicat/code_rtf/r510-104.rtf (Utah Admin Code R510-104, Aging & Adult Services)

---

### Utah Caregiver Support Program (UCSP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: Caregiver must be 18 or older (with priority given to caregivers 55+); care recipient must be 60+ OR any age with Alzheimer's Disease or related neurological disorder+
- Income: No income requirement or cap[1][2]
- Assets: Not specified in available sources
- Caregiver must be an unpaid, informal family member or other individual providing in-home and community care[1][2]
- Caregiver must demonstrate medium-to-high risk score on DAAS Approved Demographic Intake and Screening tool[3]
- Caregiver must complete DAAS-approved Assessment and Caregiver Burden score[3]
- Care recipient must have deficits in at least two activities of daily living[5]
- Caregiver must demonstrate a level of stress[5]
- Special eligibility for older relatives (55+) serving as primary caregivers to children under 18 or adults 18-59 with disabilities when biological/adoptive parents cannot serve[1][2]

**Benefits:** Up to $1,500 in services over a 12-month period[1]; services include respite care, case management, personal care aides, adult day care, overnight respite, information & referral services, caregiver support groups, counseling, caregiver education/training[1][2]
- Varies by: caregiver_need_and_priority_tier

**How to apply:**
- Contact Local Area Agency on Aging (specific offices vary by county)[2]
- Salt Lake County: 801-468-2460[5]
- Davis County: 801-451-3377[5]
- Weber/Morgan Counties (Care for the Caregiver Program): 801-625-3866[5]
- Online: https://daas.utah.gov/seniors/[2]
- Main program website: https://magutah.gov/cgsupport/[1]

**Timeline:** Not specified in available sources; program often has a waiting list[5]
**Waitlist:** Yes, program often maintains a waiting list; applicants served in priority order using DAAS-approved Demographic Intake and Risk Screening tool and Caregiver Burden score[3][5]

**Watch out for:**
- No income requirement means eligibility is broader than many assume, but caregiver MUST demonstrate medium-to-high caregiver burden/stress — this is not automatic[3][5]
- Services capped at $1,500 per 12-month period — this is a significant limitation for ongoing care needs[1]
- Program often has a waiting list; applicants are prioritized by burden score and demographic factors, not first-come-first-served[3][5]
- Care recipient must have deficits in at least TWO activities of daily living — single-activity limitations may not qualify[5]
- Caregiver must be unpaid/informal — paid caregivers or facility staff do not qualify[1][2]
- No fees charged, but donations encouraged — this is a low-cost program but not necessarily comprehensive[1]
- Priority is given to older caregivers with greatest social/economic need; younger caregivers may face longer waits[3]
- Different county offices may have different wait times and service availability — contact your specific county Area Agency on Aging for current status

**Data shape:** This program is unique in having NO income limits but STRICT burden/stress requirements. Benefits are capped at $1,500/year (not unlimited). Eligibility is determined through a multi-step assessment process (intake screening + burden score) rather than simple demographic criteria. Program is statewide but county-administered, creating potential regional variation in wait times and service availability. Priority tiers exist based on age and economic need, not first-come-first-served. Care recipient must meet functional criteria (2+ ADL deficits), not just age/diagnosis.

**Source:** https://daas.utah.gov/seniors/ and https://magutah.gov/cgsupport/

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income must not exceed 125% of the federal poverty level (FPL). Exact dollar amounts vary annually by household size and are published by the U.S. Department of Health and Human Services (HHS); for example, consult current HHS poverty guidelines as income is calculated for the individual or family, with persons with disabilities potentially treated as a family of one[2][3][4].
- Assets: No asset limits specified in program guidelines[1][2][3].
- Unemployed or employed with notice of pending termination
- Resident of Utah (specifically in an area served by the program)
- Legally able to work in the U.S. (able to complete I-9 form)
- Not job-ready
- Not exceeded 48-month/4-year lifetime participation cap across all SCSEP providers
- Must register with Utah State Workforce within two weeks if not already registered

**Benefits:** Paid part-time community service work-based job training at a host agency (up to 20 hours per week); wages paid via direct deposit (specific wage amount not detailed, serves as bridge to unsubsidized employment); training in skills like computer use for roles such as child care, customer service, teachers' aide, computer technician, building maintenance, or health care worker; Individual Employment Plan (IEP) required[1][2][4][5].
- Varies by: priority_tier

**How to apply:**
- Phone: Utah (800) 771-2153 (Easterseals-Goodwill Northern Rocky Mountain)[7]
- Online application: https://www.ipdcscsep.org/scsep-application[1]
- In-person or local SCSEP office (contact provider for locations; Easterseals-Goodwill serves Utah)[4][7]

**Timeline:** Not specified; application reviewed by Project Director based on eligibility, suitability, and other criteria (not first-come, first-served)[1].
**Waitlist:** Possible waitlist if no immediate openings after eligibility determination[4].

**Watch out for:**
- Enrollment not first-come, first-served; Project Director decides based on suitability and criteria[1]
- 125% FPL income limit is strict; willful misreporting disqualifies[1]
- 48-month lifetime cap across all SCSEP providers, even if switching[3]
- Must accept up to 20 hours/week assignment and comply with IEP; professional conduct required[1]
- Re-enrollment discretionary if previously exited[3]
- Priority given to veterans/qualified spouses first, then over-65, disabled, rural, etc.—may affect access[2][5]

**Data shape:** Federally-funded but administered by grantees like Easterseals-Goodwill in Utah (not fully statewide); income at 125% FPL with family calculation; strict lifetime 48-month limit; priority tiers heavily influence enrollment over basic eligibility

**Source:** https://daas.utah.gov/wp-content/uploads/2024/05/Utah-SCSEP-Four-Year-State-Plan-2024-for-public-comment-1.pdf (Utah SCSEP Four-Year State Plan)

---

### Utah Legal Services for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Income must be at or below 125% of the federal poverty guidelines (e.g., in 2012: $13,613 annually for a 1-person household, $27,938 for a family of four). Exceptions up to 200% allowed if documented economic hardship (e.g., high medical expenses, non-medical disability costs). Exact current dollar amounts vary by year and household size; check current federal poverty guidelines via ULS[3][4].
- Assets: Very limited assets required; specific limits not detailed in sources, but financial eligibility considers low assets alongside income[4].
- Legal issues must relate to senior-specific problems like public benefits (Social Security, SSI, Medicare, Medicaid), adult protective services (abuse, guardianship, powers-of-attorney), housing, consumer issues, living wills[4][5][6].

**Benefits:** Free legal assistance including counseling, representation, document preparation, and preventive legal presentations on topics like public benefits, housing, consumer issues, Medicare claims, elder abuse, guardianship, powers-of-attorney, wills, estates. Specialized Senior Citizen Law Center staff; volunteer attorneys for wills/estates via Senior Law Project[4][5][6]. No specific dollar amounts or hours stated.
- Varies by: priority_tier

**How to apply:**
- Phone: Contact Utah Legal Services (specific intake numbers not listed; call main line or local offices, e.g., Timpanogos Legal Center hotline 801-649-8895 for Utah County[2][9]
- Email: e.g., tlcinfo@timplegal.org for intake forms (TLC example)[2]
- In-person: Clinics like TLC document clinic at Family Justice Center, Utah County (Tuesdays 5-8pm by appointment)[2]
- Website: https://www.utahlegalservices.org/ for general info and contacts[4]

**Timeline:** Not specified; intake screening response sent after form submission (e.g., TLC sets virtual attorney meeting if approved)[2].
**Waitlist:** Not mentioned; by appointment only for some clinics[2].

**Watch out for:**
- Income up to 200% FPL possible only with Executive Director approval and hardship documentation—don't assume auto-approval[3].
- Not all legal issues covered; must match senior priorities like benefits/housing/abuse[4][6].
- Asset limits are strict and 'very limited'—often overlooked[4].
- Some services via county contracts or volunteers, so availability varies[5].
- Older example figures (2012); always verify current FPL[3][4].

**Data shape:** Income at 125% FPL standard with exceptions to 200%; no fixed asset table or current dollar table in sources (uses annual FPL); senior-specific (60+) with Older Americans Act funding beyond LSC; regional providers and county contracts add variation.

**Source:** https://www.utahlegalservices.org/

---

### Utah Long-Term Care Ombudsman Program

> **NEW** — not currently in our data

**Eligibility:**
- Must already be a resident of a long-term care facility[2]
- Services available to person attempting to enter a facility[2]

**Benefits:** Complaint investigation, problem resolution, advocacy for residents' rights, education about long-term care issues, free and confidential services[2][6]

**How to apply:**
- Phone: Contact your local Area Agency on Aging ombudsman program[4]
- Online: File complaint at state ombudsman office website[5]
- In-person: Visit local ombudsman office within your Area Agency on Aging[4]
- On behalf of resident: Services provided as requested by individual or on behalf of individual[2]

**Timeline:** Not specified in available sources

**Watch out for:**
- This is NOT a program to help pay for or enter long-term care—it advocates for people already in facilities[4]
- Ombudsmen are NOT regulatory and cannot hold facilities accountable for regulation compliance[4]
- Program is advocacy-focused, not enforcement-focused[4]
- Confidentiality is maintained except in immediate life-threatening situations[2]
- Ombudsmen must avoid conflicts of interest, including financial gain[2]

**Data shape:** This is a statewide advocacy program with no eligibility barriers (no income/asset tests). It operates through 11 regional programs. The key distinction: families should contact this program if their loved one is ALREADY in a facility and needs advocacy; this is not an entry or funding program.

**Source:** https://daas.utah.gov/long-term-care-ombudsman/

---

### Utah Aging Waiver


**Eligibility:**
- Age: 65+
- Income: Single applicant limit is $1,305/month (effective 3/1/25–2/28/26) or $1,330/month (effective March 2026–Feb 2027); limits increase annually in March and apply to individual income with special deductions for living expenses and exemption of spousal income even if living together; almost all income counted[1][2][3].
- Assets: Single applicant: $2,000 in countable assets; exempt: primary home (equity under $730,000 if applicant or spouse resides there or intends to return), one automobile (any value), household furnishings/appliances, personal effects/belongings, burial plots/irrevocable burial trusts up to $7,000 each, life insurance face value ≤$1,500; 60-month look-back rule applies with penalty period for transfers below fair market value[1][2][3].
- Utah resident and U.S. citizen or qualified immigrant[2][4].
- Nursing Facility Level of Care (NFLOC) determined by RN using InterRAI MDS-HC tool: requires 2 of 3 conditions—significant physical assistance with ≥2 ADLs (toileting, bathing, dressing, transferring, mobility, eating), poor orientation requiring NF care, or medical condition unmet safely without waiver services; dementia diagnosis alone insufficient[1][3][4].

**Benefits:** Core: case management; other services include personal care, respite/respite care (including LTC facility extension >13 days), adult day care, home modifications/environmental adaptations, specialized medical equipment/supplies/assistive technology (no physician prescription needed for some), non-medical transportation, supplemental meals, personal emergency response systems (PERS) installation/testing/removal/purchase/rental/repair/response, training services, personal budget assistance; no fixed dollar/hour limits specified, tailored via case manager plan of care[4][6].
- Varies by: priority_tier

**How to apply:**
- Phone intake with local Aging & Adult Services office (e.g., Salt Lake County or San Juan County); statewide via Utah Medicaid[4][5].
- In-person: local county aging services offices (e.g., San Juan County, Salt Lake County)[4][5].

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; applications accepted anytime (waiver allows continuous enrollment outside tri-annual periods)[6].

**Watch out for:**
- Income limit ~100% FPL but updates March annually (not January like federal); check current effective dates[1][3].
- 60-month look-back penalty for asset transfers; spousal income exempt even if cohabiting, but separate asset formula[1][4].
- NFLOC requires specific ADL/orientation criteria via MDS-HC assessment; dementia alone insufficient[1].
- Distinguish from New Choices Waiver (higher income limit $2,901/month, different target group) or ABD Medicaid[2][3].

**Data shape:** Income limits update March annually with special spousal exemptions and separate asset formula; NFLOC via specific MDS-HC tool; services tailored by case management plan without fixed hours/dollars; statewide but county-administered.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://medicaid.utah.gov (inferred from context; county sites like sanjuancountyut.gov/aging-services and saltlakecounty.gov reference state program)[4][5].

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Utah Medicaid Program | benefit | state | deep |
| Utah PACE (Program of All-Inclusive Care | benefit | local | medium |
| Medicare Savings Programs (QMB, SLMB, QI | benefit | federal | deep |
| Utah SNAP (Supplemental Nutrition Assist | benefit | federal | deep |
| Utah LIHEAP (Low-Income Home Energy Assi | benefit | federal | deep |
| Utah Weatherization Assistance Program | benefit | federal | deep |
| Utah SHIP (State Health Insurance Assist | resource | federal | simple |
| Utah Meals on Wheels | benefit | federal | medium |
| Utah Caregiver Support Program (UCSP) | benefit | state | deep |
| Senior Community Service Employment Prog | employment | federal | deep |
| Utah Legal Services for Seniors | resource | state | simple |
| Utah Long-Term Care Ombudsman Program | resource | federal | simple |
| Utah Aging Waiver | benefit | state | deep |

**Types:** {"benefit":9,"resource":3,"employment":1}
**Scopes:** {"state":4,"local":1,"federal":8}
**Complexity:** {"deep":8,"medium":2,"simple":3}

## Content Drafts

Generated 13 page drafts. Review in admin dashboard or `data/pipeline/UT/drafts.json`.

- **Utah Medicaid Program** (benefit) — 5 content sections, 6 FAQs
- **Utah PACE (Program of All-Inclusive Care for the Elderly)** (benefit) — 1 content sections, 5 FAQs
- **Medicare Savings Programs (QMB, SLMB, QI)** (benefit) — 5 content sections, 6 FAQs
- **Utah SNAP (Supplemental Nutrition Assistance Program)** (benefit) — 4 content sections, 6 FAQs
- **Utah LIHEAP (Low-Income Home Energy Assistance Program)** (benefit) — 5 content sections, 6 FAQs
- **Utah Weatherization Assistance Program** (benefit) — 6 content sections, 6 FAQs
- **Utah SHIP (State Health Insurance Assistance Program)** (resource) — 3 content sections, 6 FAQs
- **Utah Meals on Wheels** (benefit) — 4 content sections, 6 FAQs
- **Utah Caregiver Support Program (UCSP)** (benefit) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Utah Legal Services for Seniors** (resource) — 3 content sections, 6 FAQs
- **Utah Long-Term Care Ombudsman Program** (resource) — 2 content sections, 6 FAQs
- **Utah Aging Waiver** (benefit) — 4 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 6 programs
- **not_applicable**: 2 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 1 programs
- **not_applicable — services are standardized across the program**: 1 programs
- **region**: 1 programs
- **caregiver_need_and_priority_tier**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Utah Medicaid Program**: Multiple sub-programs with varying income caps by waiver type (e.g., Aging Waiver lower than New Choices); no strict income limit for nursing home but pay-down required; asset exemptions detailed but home equity capped at $730,000; medically needy spenddown pathway unique
- **Utah PACE (Program of All-Inclusive Care for the Elderly)**: Program not available in Utah; no providers, applications, or regional variations; national PACE model has no financial tests but requires service area proximity which does not exist here
- **Medicare Savings Programs (QMB, SLMB, QI)**: Tiered by income brackets (QMB ≤100% FPL, SLMB 100-120%, QI 120-135%); QI funding capped; asset test with standard federal exemptions; statewide uniform
- **Utah SNAP (Supplemental Nutrition Assistance Program)**: No gross income test for households with 60+ member; higher $4,500 asset limit; ESAP 3-year approval with single interview; benefits calculated via net income + elderly-specific deductions (medical/shelter)[2][4][6]
- **Utah LIHEAP (Low-Income Home Energy Assistance Program)**: Administered as HEAT program under LIHEAP; regional providers required; income at 150% FPL; priority tiers for elderly/disabled/kids; benefits capped by type (heating/cooling/crisis); funds limited by exhaustion not fixed deadlines.
- **Utah Weatherization Assistance Program**: Administered by 7 county-specific agencies with unique contacts; eligibility ties to HEAT program for priority; priority tiers drive waitlist order; no age minimum but elderly prioritized.
- **Utah SHIP (State Health Insurance Assistance Program)**: Utah SHIP is a counseling and navigation service rather than a direct benefits program. It has no income or asset limits for eligibility (serves all Medicare beneficiaries), no application process (just contact to schedule counseling), and no processing timeline (it's immediate consultation). The program's value is in helping beneficiaries understand complex Medicare options and identify other assistance programs they may qualify for. Unlike CHIP, which has specific income thresholds and enrollment deadlines, SHIP is an ongoing advisory service available to all Medicare-eligible individuals.
- **Utah Meals on Wheels**: Decentralized by county/PSA with local AAAs managing; no statewide income/asset tests; variations in costs, waitlists, exact rules, and providers; homebound + 60+ core but priority to isolated/frail
- **Utah Caregiver Support Program (UCSP)**: This program is unique in having NO income limits but STRICT burden/stress requirements. Benefits are capped at $1,500/year (not unlimited). Eligibility is determined through a multi-step assessment process (intake screening + burden score) rather than simple demographic criteria. Program is statewide but county-administered, creating potential regional variation in wait times and service availability. Priority tiers exist based on age and economic need, not first-come-first-served. Care recipient must meet functional criteria (2+ ADL deficits), not just age/diagnosis.
- **Senior Community Service Employment Program (SCSEP)**: Federally-funded but administered by grantees like Easterseals-Goodwill in Utah (not fully statewide); income at 125% FPL with family calculation; strict lifetime 48-month limit; priority tiers heavily influence enrollment over basic eligibility
- **Utah Legal Services for Seniors**: Income at 125% FPL standard with exceptions to 200%; no fixed asset table or current dollar table in sources (uses annual FPL); senior-specific (60+) with Older Americans Act funding beyond LSC; regional providers and county contracts add variation.
- **Utah Long-Term Care Ombudsman Program**: This is a statewide advocacy program with no eligibility barriers (no income/asset tests). It operates through 11 regional programs. The key distinction: families should contact this program if their loved one is ALREADY in a facility and needs advocacy; this is not an entry or funding program.
- **Utah Aging Waiver**: Income limits update March annually with special spousal exemptions and separate asset formula; NFLOC via specific MDS-HC tool; services tailored by case management plan without fixed hours/dollars; statewide but county-administered.

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Utah?
