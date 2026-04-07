# Michigan Benefits Exploration Report

> Generated 2026-04-07 by benefits-pipeline.js
> Cost: $0.000 (0 calls, 0s)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 18 |
| Programs deep-dived | 18 |
| New (not in our data) | 16 |
| Data discrepancies | 2 |
| Fields our model can't capture | 2 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 2 | Our model has no asset limit fields |
| `regional_variations` | 2 | Program varies by region — our model doesn't capture this |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |
| `documents_required` | 2 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |

## Program Types

- **service**: 8 programs
- **financial**: 3 programs
- **in_kind**: 3 programs
- **advocacy**: 2 programs
- **employment**: 1 programs
- **unknown**: 1 programs

## Data Discrepancies

Our data differs from what official sources say:

### Michigan PACE Program

- **min_age**: Ours says `65` → Source says `55` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/program-of-all-inclusive-care-for-the-elderly-pace))
- **income_limit**: Ours says `$2901` → Source says `$2,829` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/program-of-all-inclusive-care-for-the-elderly-pace))
- **benefit_value**: Ours says `$15,000 – $35,000/year` → Source says `Comprehensive package including all Medicare/Medicaid-covered services plus extras deemed necessary: primary/acute care, hospital/nursing facility if needed, adult day health center services, in-home care, personal care, social services, transportation, meals, therapy, dental/vision/hearing, prescription drugs. Delivered by interdisciplinary team via day center, home visits, referrals. No copays/deductibles for dual-eligible; private pay covers Medicaid portion otherwise[1][2][4][5][8].` ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/program-of-all-inclusive-care-for-the-elderly-pace))
- **source_url**: Ours says `MISSING` → Source says `https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/program-of-all-inclusive-care-for-the-elderly-pace`

### MI Bridges Food Assistance Program (SNAP)

- **income_limit**: Ours says `$1763` → Source says `$2,608` ([source](https://www.michigan.gov/mdhhs/assistance-programs/food))
- **benefit_value**: Ours says `$1,500 – $3,600/year` → Source says `Monthly benefits on Michigan Bridge Card for groceries (healthy foods, no hot prepared). Amount varies by income, household size, expenses; single seniors 60+: $23-$292/month typical. Exact issuance per federal tables (e.g., max benefits scale down with income).[4][9]` ([source](https://www.michigan.gov/mdhhs/assistance-programs/food))
- **source_url**: Ours says `MISSING` → Source says `https://www.michigan.gov/mdhhs/assistance-programs/food`

## New Programs (Not in Our Data)

- **MI Health Link** — service ([source](https://www.michigan.gov/mdhhs/doing-business/providers/integrated/beneficiaries/mi-health-link-information-for-people-with-medicare-and-medicaid[4]))
  - Shape notes: County-restricted to 10 Lower Peninsula + all Upper Peninsula counties; dual Medicare-Medicaid integration with optional HCBS waiver requiring NFLOC assessment; enrollment via plans/state auto-assignment, not standard Medicaid application
- **MI Choice Medicaid Waiver** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver/mi-choice-waiver-program-use))
  - Shape notes: MI Choice is a statewide program with decentralized administration through regional waiver agencies, creating geographic variation in access and processing. Eligibility is binary (meets NFLOC or does not) rather than tiered. Income and asset limits are fixed annually but change each year. Benefits are individualized and person-centered rather than standardized by tier. The program requires dual eligibility: financial (income/assets) AND medical (functional need for nursing facility level of care). The 60-month Look-Back Rule creates a unique penalty mechanism for asset transfers. Spousal protections add complexity for married applicants.
- **Medicaid Medicare Premium Payment (QMB, SLMB, QI) Programs** — financial ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/disabilities/dualeligible/medicare-savings-programs))
  - Shape notes: Tiered by income (QMB <100% FPL, SLMB 100-120%, QI 120-135%); asset-capped; QI funding-limited/not entitlement; auto-Extra Help; MI follows federal but local MDHHS processing.
- **Michigan Energy Assistance Program (LIHEAP)** — financial ([source](https://www.michigan.gov/mpsc/consumer/energy-assistance and https://www.michigan.gov/mdhhs))
  - Shape notes: Multi-program structure (MEAP preventive, LIHEAP crisis/regular, SER emergency, Home Heating Credit, Weatherization) with tiered income limits by component; automatic eligibility via SNAP/SSI/TANF; local agency delivery statewide; benefits scale by income/size/fuel/emergency status[1][5][6][7][8]
- **Michigan Weatherization Assistance Program** — in_kind ([source](https://www.michigan.gov/mdhhs/doing-business/weatherization))
  - Shape notes: This program's structure is highly decentralized: administered statewide through local Community Action Agencies with varying income thresholds (200-250% of poverty guidelines), different service areas by county, and funding-dependent availability. Income eligibility varies by household size with specific dollar thresholds. Benefits are customized per home based on energy audit rather than fixed amounts. Home eligibility has multiple deferral criteria that can disqualify properties. Regional variation is significant due to different local providers and funding availability.
- **Michigan Medicare Assistance Program (MMAP)** — advocacy ([source](https://www.michigan.gov/mdhhs/adult-child-serv/adults-and-seniors/acls/long-term-services-and-supports[8]))
  - Shape notes: MMAP is fundamentally different from most assistance programs: it is a free counseling and navigation service rather than a direct benefit program. There are no income or asset limits to receive MMAP counseling itself. The program's value lies in helping clients understand complex Medicare/Medicaid rules and identify which other programs they qualify for. MMAP is statewide but delivered through regional offices and providers, with a centralized hotline (1-800-803-7174) for access. The program is volunteer-staffed and grant-funded, making it a public health information resource rather than an entitlement program.
- **Home Delivered Meals (via Area Agencies on Aging)** — in_kind ([source](https://www.michigan.gov/mdhhs/assistance-programs/other-help/food/home-delivered-meals))
  - Shape notes: This is a decentralized program administered through regional Area Agencies on Aging, resulting in significant variation by county in delivery schedules, meal frequency, donation amounts, and specific eligibility criteria. There are no statewide income or asset limits. Eligibility is purely functional (homebound/nutritional risk) rather than means-tested. The program includes a wellness check component—delivery staff conduct regular check-ins. Families must contact their specific county/regional agency for precise details, as the search results show substantial variation across Michigan's regions.
- **Respite Care (MI Choice Waiver & POS)** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
  - Shape notes: Administered regionally by MI Choice Waiver Agencies with waitlists and priority tiers; requires NFLOC + specific service combo; no fixed respite hours/dollars—instead person-centered with minimum frequency.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://www.michigan.gov/mdhhs (administered by MDHHS Bureau of Aging; federal: https://www.dol.gov/agencies/eta/seniors)[3][5]))
  - Shape notes: Administered through regional sub-recipients with county-specific providers; income at 125% FPL scales by household size; priority service tiers; requires Michigan Works integration; no centralized statewide application
- **Legal Assistance for Seniors (AAA-funded)** — service ([source](https://www.ageways.org (AgeWays example); https://4ami.org (AAAs of Michigan); contact local AAA via Eldercare Locator))
  - Shape notes: Decentralized by AAA region with different nonprofit providers per area; no uniform statewide income/asset tables or processing times; eligibility often ties to federal poverty guidelines but not quantified here; contact local AAA required
- **Michigan Long Term Care Ombudsman Program (MLTCOP)** — unknown ([source](mltcop.org and Michigan Department of Health and Human Services))
  - Shape notes: This program has no traditional 'eligibility' in the sense of income/asset tests. Access is automatic for facility residents. The program structure is statewide with local ombudsmen assigned by region. Services are investigative and advocacy-based, not direct service provision.
- **Michigan's Choice Waiver Program** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
  - Shape notes: Statewide but county-administered with local agencies; eligibility via 3-prong test (financial/Medicaid, NFLOC via LOCD tool with Doors scoring, waiver service need); income/assets tied to annual FBR adjustments; no fixed benefit caps, individualized.
- **MI Health Link Program** — service ([source](https://www.michigan.gov/mdhhs/doing-business/providers/integrated))
  - Shape notes: Dual-eligible only (full Medicare + Medicaid), county-restricted (not statewide), delivered via regional ICOs with no explicit income/asset tables (tied to Medicaid), HCBS tiered by NFLOC/ADL levels.
- **MI Choice Program** — service ([source](https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver))
  - Shape notes: Administered via 16 regional MI Choice Waiver Agencies with slot limits leading to waitlists; income fixed at 300% FBR (individual, not household-scaled); benefits individualized by NFLOC assessment and priority, not fixed hours/dollars
- **Michigan Homestead Property Tax Credit (HPTC) for Seniors** — financial ([source](https://www.michigan.gov/taxes/iit/tax-guidance/credits-exemptions/hptc))
  - Shape notes: Income-based refundable tax credit (not direct relief); phases by THR thresholds; enhanced for seniors; supplemented by local exemptions/deferments; annual adjustments to limits/caps
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)** — advocacy ([source](https://www.elderlawofmi.org/micafe[2][8]))
  - Shape notes: Advocacy program via statewide network; eligibility tied to variable SNAP/SER rules (household-based income/assets minus medical expenses); no fixed MiCAFE-specific limits or direct benefits provided[1][3][4]

## Program Details

### MI Health Link

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: No specific dollar amounts stated for MI Health Link; requires full Medicaid eligibility, which for related Aged/Blind/Disabled programs has income limits (e.g., spend-down via medical expenses if over limit) and for single applicants in 2026 aligns with asset-tested programs[1][6].
- Assets: No program-specific asset limits stated; related Michigan Medicaid programs (e.g., Nursing Home, Aged/Blind/Disabled) limit countable assets to $9,950 for a single applicant in 2026. Countable assets include bank accounts, retirement accounts, stocks, bonds, CDs, cash, and other easily convertible items[1]. Exemptions not detailed in results.
- Eligible for both full Medicare (Parts A, B, D) and full Medicaid
- Reside in specific counties: Barry, Berrien, Branch, Calhoun, Cass, Kalamazoo, Macomb, St. Joseph, Van Buren, Wayne, or any Upper Peninsula county (Alger, Baraga, Chippewa, Delta, Dickinson, Gogebic, Houghton, Iron, Keweenaw, Luce, Mackinac, Marquette, Menominee, Ontonagon, Schoolcraft)[2][4][7]
- Not enrolled in hospice
- For HCBS Waiver component: Nursing Facility Level of Care (NFLOC) via Michigan Medicaid Nursing Facility Level of Care Determination (LOCD), based on ADLs (mobility, bathing, dressing, eating, toileting), cognitive/behavioral issues[2][5]
- People with Medicaid deductibles not eligible; nursing home residents eligible but must pay deductible if applicable; Medigap holders eligible if other criteria met; must disenroll from other products[3]

**Benefits:** Integrated Medicare-Medicaid plan covering comprehensive health care, including for those needing long-term Home and Community Based Services (HCBS). Specific services include those at Nursing Facility Level of Care in home/community (personal care for ADLs at level 3+), physician visits, prescriptions, ER/hospital, vision, dental, mental health. Nursing home residents covered with deductible payment[1][2][3][5][6].
- Varies by: region

**How to apply:**
- Auto-assignment, self-selection, or passive enrollment by state (varies by phase/county)[3][7]
- Select plans like HAP CareSource MI Health Link Plan[3]
- Must disenroll from conflicting programs (e.g., MI Choice Waiver, PACE, D-SNP, employer plans)[3][7]
- Contact local MDHHS office or plans for enrollment (specific phone/website not in results; check official MDHHS site)
- No specific forms, online URLs, phone numbers, mail, or in-person detailed in results

**Timeline:** Enrollment phases (e.g., passive starts May/July 2015 historically); current timelines not specified[7]

**Watch out for:**
- Not statewide—only specific counties; check residence first[2][4]
- Must have both full Medicare and Medicaid; dual eligible only[3][4]
- No hospice; must disenroll from MI Choice, PACE, Medigap conflicts, D-SNPs[3][7]
- HCBS requires NFLOC via LOCD—not automatic with dementia diagnosis[2]
- Nursing home residents pay deductibles; Medicaid deductible holders ineligible[3]
- Passive/auto-enrollment possible, but some (e.g., employer plan holders) excluded[7]

**Data shape:** County-restricted to 10 Lower Peninsula + all Upper Peninsula counties; dual Medicare-Medicaid integration with optional HCBS waiver requiring NFLOC assessment; enrollment via plans/state auto-assignment, not standard Medicaid application

**Source:** https://www.michigan.gov/mdhhs/doing-business/providers/integrated/beneficiaries/mi-health-link-information-for-people-with-medicare-and-medicaid[4]

---

### MI Choice Medicaid Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18 or older (with disability if under 65); 65 or older without disability requirement+
- Income: Gross income cannot exceed $2,982 per month (excludes spousal income)[5]. This is 300% of the SSI rate and changes annually[5]. For married couples, a minimum Spousal Income Allowance of $2,643.75/month applies (effective 7/1/25–6/30/26)[1].
- Assets: Allowable assets limited to $9,950 (excludes one home and one car)[5]. Home equity interest must not exceed $730,000 in 2025 if applicant lives in home or has intent to return[1]. Federal Protected Spousal Asset guidelines apply[5]. Assets cannot be given away or sold under fair market value within 60 months of application (Look-Back Rule violation results in penalty period of Medicaid ineligibility)[1].
- Must meet Medicaid financial eligibility[2]
- Must require Nursing Facility Level of Care (NFLOC) as determined by in-person Level of Care Determination (LOCD) assessment[1]
- Must require supports coordination plus at least one other waiver service[1]
- Functional assessment evaluates Activities of Daily Living (transferring, mobility, eating, toileting), cognitive abilities (decision-making, memory, communication), and behavioral considerations[1]
- Diagnosis of dementia alone does not guarantee eligibility; functional need must be demonstrated[1]

**Benefits:** Medicaid-covered long-term care services including: adult day health, respite, supports coordination, specialized medical equipment and supplies, fiscal intermediary, goods and services, supports brokerage, assistive technology, chore services, community health worker, community living supports, community transportation, counseling, environmental accessibility adaptations, home delivered meals, nursing services (preventative), personal emergency response systems (PERS), private duty nursing/respiratory care, residential services, training, and vehicle modifications[7]. Services are person-centered and individualized based on needs and preferences[2].
- Varies by: individual_need

**How to apply:**
- Contact MI Choice Waiver Agency in your area (in-person assessment required for Level of Care Determination)[1]
- Call Area Agency on Aging: (800) 654-2810[8]
- Contact regional MI Choice Waiver agencies (varies by county)[2]
- Online MI Choice Intake Guidelines assessment (completed by waiver agencies only, not directly by applicants)[6]

**Timeline:** Not specified in available sources; contact local waiver agency for timeline
**Waitlist:** Potential waiting list placement based on MI Choice Intake Guidelines telephonic evaluation[6]; specific wait times not provided in sources

**Watch out for:**
- Diagnosis alone is insufficient: Having Alzheimer's disease or dementia does not automatically qualify someone; functional need for nursing facility level of care must be demonstrated through assessment[1]
- 60-month Look-Back Rule: Assets transferred or sold below fair market value within 60 months of application trigger a penalty period of Medicaid ineligibility[1]
- In-person assessment required: Level of Care Determination must be completed in person by the MI Choice Waiver Agency; it cannot be done remotely[1]
- Spousal income/asset protections are limited: While spousal income is excluded from the applicant's income limit, special rules and protected asset guidelines apply to married couples[1][5]
- Income limits change annually: The $2,982 monthly income limit is recalculated each year at 300% of SSI rate; families should verify current limits[5]
- Must require waiver services: Simply meeting medical and financial criteria is insufficient; applicant must require supports coordination plus at least one additional waiver service[1]
- Regional agency variation: Service availability, wait times, and application processes may differ depending on which MI Choice Waiver agency serves your area[2]
- Not a nursing home alternative for all: This program is specifically for those who meet nursing facility level of care criteria but prefer community-based services; it is not a general home care program

**Data shape:** MI Choice is a statewide program with decentralized administration through regional waiver agencies, creating geographic variation in access and processing. Eligibility is binary (meets NFLOC or does not) rather than tiered. Income and asset limits are fixed annually but change each year. Benefits are individualized and person-centered rather than standardized by tier. The program requires dual eligibility: financial (income/assets) AND medical (functional need for nursing facility level of care). The 60-month Look-Back Rule creates a unique penalty mechanism for asset transfers. Spousal protections add complexity for married applicants.

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver/mi-choice-waiver-program-use

---

### Michigan PACE Program


**Eligibility:**
- Age: 55+
- Income: No strict income limits for PACE itself; eligibility hinges on qualifying for Medicaid (which funds the program for dual-eligible participants). Medicaid income and asset limits apply if seeking full coverage without private pay. PACE organizations assist with Medicaid applications and determinations; exact Medicaid limits (e.g., ~$2,829/month for an individual in 2026, subject to annual updates) are assessed case-by-case, varying by household size. Contact PACE provider for current Medicaid thresholds[1][2][5].
- Assets: No strict asset limits for PACE; tied to Medicaid eligibility where applicable (e.g., Medicaid asset limit typically $2,000 for individual, higher for couples; primary home, one vehicle, personal belongings often exempt). PACE staff help verify[1][2][5].
- Live in the service area of a specific PACE organization
- Meet Michigan's nursing home level of care (LTC) criteria, as determined by PACE interdisciplinary team
- Able to live safely in the community (not in a nursing facility) at time of enrollment with PACE support
- Not concurrently enrolled in Medicaid MIChoice waiver or Medicare HMO
- Medicare-eligible or able/willing to private pay if not Medicaid-eligible[2][3][4][5][6]

**Benefits:** Comprehensive package including all Medicare/Medicaid-covered services plus extras deemed necessary: primary/acute care, hospital/nursing facility if needed, adult day health center services, in-home care, personal care, social services, transportation, meals, therapy, dental/vision/hearing, prescription drugs. Delivered by interdisciplinary team via day center, home visits, referrals. No copays/deductibles for dual-eligible; private pay covers Medicaid portion otherwise[1][2][4][5][8].
- Varies by: region

**How to apply:**
- Contact specific PACE organization by phone or website (e.g., Thome PACE, PACE Southwest MI, etc.)
- In-person intake assessment at PACE center
- PACE assists with Medicaid application if needed; no central state form, provider-specific process

**Timeline:** Intake assessment immediate; full enrollment assessment and care plan development follows shortly after (days to weeks); no specific statewide timeline given[2][7].
**Waitlist:** Possible depending on PACE organization capacity and region; varies, not detailed statewide[2].

**Watch out for:**
- Must use **only** PACE-approved providers for non-emergency care; liable for unauthorized services[1][5]
- Not statewide—check specific provider service area first; unavailable in many Michigan areas[3][5]
- Nursing home level of care required, even if living independently now[2][3][4]
- Private pay required if not Medicaid-eligible (monthly premium for Medicaid portion)[1][4][5]
- Cannot combine with MIChoice waiver or Medicare HMO[2]
- ~90% participants dual-eligible; lower SES focus[8]

**Data shape:** Regionally restricted to specific PACE provider service areas (not statewide); no direct income/asset caps but Medicaid-linked for full funding; requires nursing facility-level care certification; multiple providers with varying geographies

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/program-of-all-inclusive-care-for-the-elderly-pace

---

### Medicaid Medicare Premium Payment (QMB, SLMB, QI) Programs

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be entitled to Medicare Part A (typically age 65+ or disabled). Income limits based on Federal Poverty Level (FPL), updated annually April 1; Michigan follows federal standards with possible state variations. For 2026 (approximate from sources, check current at medicare.gov):
- **QMB**: ≤100% FPL (~$1,330/month single, $1,790/month couple)
- **SLMB**: >QMB up to 120% FPL (~$1,585/month single, $2,135/month couple)
- **QI**: >SLMB up to 135% FPL (~$1,781/month single, $2,400/month couple)
If SSI-related Medicaid, automatic QMB. Counts household income; no full table by size in sources but scales with FPL for households.[3][5][2]
- Assets: Applies: $9,950 single / $14,910 couple (or living with someone). Exempt: home, one car, burial plots, life insurance (up to $1,500 face value), household goods. Counts: bank accounts, second car, investments. States may waive (e.g., no asset limit in some for QI federally, but MI has limits).[3][1]
- Entitled to Medicare Part A (premium-free for most).
- U.S. citizen or qualified immigrant.
- Michigan resident.
- Not eligible for full Medicaid (except auto-QMB via SSI).

**Benefits:** **QMB**: Pays Medicare Part A premium (if applicable), Part B premium (~$185/month in 2026), deductibles, coinsurance, copays for Medicare-covered services. Providers cannot bill enrollee. Auto-qualifies for Extra Help (Part D, ≤$12.65/drug copay).**SLMB**: Part B premium only.**QI (ALMB)**: Part B premium only (block grant funding, finite).[1][2][6][9]
- Varies by: priority_tier

**How to apply:**
- Online: MI Bridges (michigan.gov/mibridges)
- Phone: Local MDHHS office or MI Choices (1-855-432-3853) / SHIP (1-800- MEDICARE)
- Mail/In-person: Local MDHHS office (find at michigan.gov/mdhhs locations)
- Contact MI Options or SHIP for counseling.

**Timeline:** Varies; QMB/SLMB: coverage from month after eligibility (QMB forward-only); SLMB retroactive to prior eligible months; QI from Jan 1 of approval year (e.g., April approval covers Jan forward, first-come first-served).[2][8]
**Waitlist:** QI: Possible due to finite block grant funds; priority to prior-year recipients.

**Watch out for:**
- QI funding exhausts (first-come, first-served; reapply yearly; no retro before Jan).
- QMB no retro pay; only forward months.[2]
- Providers must accept QMB (no billing enrollee), but some unaware—report issues.
- Auto-QMB if SSI Medicaid, but check.[2][3]
- Income/asset limits change yearly; verify current FPL at medicare.gov.
- SLMB retro only if income-qualified prior months.

**Data shape:** Tiered by income (QMB <100% FPL, SLMB 100-120%, QI 120-135%); asset-capped; QI funding-limited/not entitlement; auto-Extra Help; MI follows federal but local MDHHS processing.

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/disabilities/dualeligible/medicare-savings-programs

---

### MI Bridges Food Assistance Program (SNAP)


**Eligibility:**
- Income: Michigan SNAP (Food Assistance Program or FAP) uses three tests: Gross Income (200% FPL for most households), Net Income, and Asset (with exemptions). Gross income limits effective Oct 1, 2025 - Sept 30, 2026: 1 person $2,608/month, 2 people $3,526, 3 people $4,442, 4 people $5,358, 5 people $6,276, 6 people $7,192, 7 people $8,108, each additional +$916. Households with member 60+ or disabled may skip Gross Income test and qualify on Net Income + Asset only. Net income calculated after deductions like shelter, medical (for elderly/disabled), child support. Up to 200% FPL depending on expenses.[1][2][5][6]
- Assets: Most households have no asset limit (effective March 1, 2024). Asset limit applies if household has disqualification (IPV, work rule violation, fleeing felon): $3,000 standard, $4,500 if includes 60+ or disabled. Countable assets: cash, checking/savings, investments, some trusts, property (excludes primary home). $4,250 limit if income >200% FPL and eligible due to senior/disability/veteran status. $2,750 if certain disqualifications.[2][6]
- Michigan resident.
- U.S. citizen or qualified non-citizen.
- SSN or proof applied.
- Work registration for able-bodied adults (exceptions for 60+, disabled, parents of young kids, students in certain programs). New federal work rules from March 1, 2026: 18-64 able-bodied without dependents (or with kids 14+) must work 80 hours/month avg or earn equivalent; 3 countable months in 36-month period unless exempt/deferral/good cause. Varies by county (e.g., earlier in Kent excl. Grand Rapids, Oakland excl. Oak Park/Pontiac, Livingston).
- Household = those who buy/prepare food together (kids <22 with parents included).

**Benefits:** Monthly benefits on Michigan Bridge Card for groceries (healthy foods, no hot prepared). Amount varies by income, household size, expenses; single seniors 60+: $23-$292/month typical. Exact issuance per federal tables (e.g., max benefits scale down with income).[4][9]
- Varies by: household_size

**How to apply:**
- Online: MI Bridges at https://newmibridges.michigan.gov (create account to apply, save progress, check status).
- Phone: Local MDHHS office (find via MI Bridges or 211).
- Mail/In-person: Local MDHHS office or download form from MI Bridges.

**Timeline:** Not specified in sources; typically 30 days standard, expedited possible if very low income.

**Watch out for:**
- Elderly 60+ households can qualify without Gross Income test (use Net + Asset); many miss this and think income too high.[1][4]
- No asset test for most; primary home exempt.
- Work rules new/changing by county from 2026; exemptions for elderly/disabled.
- Benefits for grocery purchases only (Bridge Card); update changes in MI Bridges promptly.
- Kids <22 auto-included in parents' household.
- Homeless/shelter residents eligible; card can mail to shelter/friend.

**Data shape:** Expanded eligibility (200% FPL gross, elderly/disabled skip gross test); benefits scale by household size/income/expenses; asset test rare (disqualifications only); work requirements vary by county rollout; statewide via MI Bridges.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/food

---

### Michigan Energy Assistance Program (LIHEAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Varies by program component. MEAP: up to 60% State Median Income (SMI), e.g., monthly: 1-person $3,043; 2 $3,979; 3 $4,916; 4 $5,852; 5 $6,788; 6 $7,725; 7 $7,900; 8 $8,076 (+$176 per additional). Regular LIHEAP Heating: 1-person $1,434/mo; 2 $1,939; 3 $2,443; 4 $2,946; 5 $3,451; 6 $3,955. Crisis LIHEAP: 1-person $1,956/mo; 2 $2,644; 3 $3,331; 4 $4,018; 5 $4,707; 6 $5,394. Automatic eligibility if household receives SNAP, SSI, TANF[1][2][4][5][6].
- Assets: Crisis/SER: Up to $15,000 cash assets and $15,000 material assets[3].
- Michigan resident
- Need financial assistance with home energy costs
- For Crisis: Immediate need (e.g., shut-off notice, deliverable fuel need, energy-related home repair)
- U.S. citizenship/legal residency proof

**Benefits:** Regular LIHEAP: Heating assistance $1-$2,205 one-time payment to utility. Crisis LIHEAP: Up to $800. MEAP: Supplemental bill payment assistance plus self-sufficiency services (e.g., bill payment plans, budgeting, energy efficiency enrollment). Related: Home Heating Credit (winter bills via MI-1040CR-7); State Emergency Relief (SER) for emergencies; Weatherization (insulation, repairs)[1][5][8].
- Varies by: household_size|priority_tier|region

**How to apply:**
- Online: MI Bridges at michigan.gov/mibridges or newmichigan.gov/s/isd-find-community-partners
- Phone: Michigan Department of Treasury at 517-636-4486 (Home Heating Credit)
- Local agencies/providers (e.g., Wayne Metro for MEAP/SER)
- Mail/in-person: Via local MDHHS offices or community partners

**Timeline:** Not specified in sources

**Watch out for:**
- Multi-component structure: MEAP (self-sufficiency), LIHEAP Regular/Crisis (heating), Home Heating Credit (tax credit), SER (emergency), Weatherization—families must identify correct one[5][7].
- Household includes all at address sharing utility bill, unlike SNAP[1].
- MEAP often requires prior SER approval for extras[8].
- Home Heating Credit deadline Sept 30; no tax return needed[5].
- Recent 2024 changes: MEAP income to 60% SMI, no LIEAF cap[5].
- Assets apply only to Crisis/SER[3].

**Data shape:** Multi-program structure (MEAP preventive, LIHEAP crisis/regular, SER emergency, Home Heating Credit, Weatherization) with tiered income limits by component; automatic eligibility via SNAP/SSI/TANF; local agency delivery statewide; benefits scale by income/size/fuel/emergency status[1][5][6][7][8]

**Source:** https://www.michigan.gov/mpsc/consumer/energy-assistance and https://www.michigan.gov/mdhhs

---

### Michigan Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Household income at or below 200% of Federal Poverty Guidelines for most providers[4][5]. Some providers (Kent County) use 250% of Federal Poverty Guidelines[1]. Income thresholds vary by household size. Example from Wayne Metro: 1 person = $2,510/month ($7,530/3 months); 2 people = $3,407/month ($10,221/3 months); 3 people = $4,303/month ($12,909/3 months); 4 people = $5,200/month ($15,600/3 months); 5 people = $6,097/month ($18,291/3 months)[2]. Automatic eligibility if receiving Supplemental Security Income (SSI), State Disability Assistance (SDA), or Family Independence Program (FIP)[2][4][5].
- Assets: Not specified in search results
- Must own the home (homeowners) or be a renter with owner approval[1][4][6]
- Must reside in the service area of the local Community Action Agency[1][3]
- Home cannot have been weatherized in the past 15 years[2]
- Home must not have deferral reasons: damaged roof, asbestos, active knob & tube wiring, visible mold or standing water in basement, or major areas of infiltration (missing drywall, windows, etc.)[2]
- Client must provide access to basement and attic[2]

**Benefits:** Free energy conservation and health & safety services. Potential savings of 20-25% on heating costs, approximately $450 per year[5]. Services include: home energy audit, weather-stripping, caulking, air sealing, attic/foundation/wall/sill box insulation, programmable thermostat installation, furnace or water heater tune-up or replacement, refrigerator replacement, lightbulb replacement, smoke detectors, carbon monoxide detectors, dryer venting installation[3][5][6]. Program does NOT include window replacement, structural repairs (roofs, doors), plumbing, or electrical repairs[6].
- Varies by: household_size (services customized based on whole-home energy audit; no single service is guaranteed)

**How to apply:**
- Phone: Contact local Community Action Agency. Kent County: 616-632-7950[1]. Northeast Michigan Community Services Agency (nemcsa): 989-358-4700[6]
- Online application available through Wayne Metro and other providers[2]
- Email: weatherization@nemcsa.org (for Northeast Michigan)[6]
- In-person at local Community Action Agency office

**Timeline:** Weatherization is a multi-step process that can take several months to complete[2]. Specific processing timelines not provided in search results.
**Waitlist:** Screening can only be done when there is available funding[1]. Specific waitlist information not provided in search results.

**Watch out for:**
- This is NOT a home repair or emergency program[3][6]. It only funds energy efficiency improvements, not structural repairs, roofs, windows, doors, plumbing, or electrical work[6].
- Homes weatherized in the past 15 years are ineligible[2].
- Homes with certain conditions (damaged roof, asbestos, active knob & tube wiring, mold, standing water, major infiltration) cannot be weatherized[2].
- No single service is guaranteed; services are customized based on energy audit results[3].
- Renters must have owner approval to participate[4][6].
- Screening only occurs when funding is available; availability varies by region and time[1].
- Processing can take several months; families should apply early[2].
- Automatic eligibility exists for SSI, SDA, or FIP recipients, bypassing income verification[2][4][5].
- Program does not replace windows despite air sealing being a service[4].

**Data shape:** This program's structure is highly decentralized: administered statewide through local Community Action Agencies with varying income thresholds (200-250% of poverty guidelines), different service areas by county, and funding-dependent availability. Income eligibility varies by household size with specific dollar thresholds. Benefits are customized per home based on energy audit rather than fixed amounts. Home eligibility has multiple deferral criteria that can disqualify properties. Regional variation is significant due to different local providers and funding availability.

**Source:** https://www.michigan.gov/mdhhs/doing-business/weatherization

---

### Michigan Medicare Assistance Program (MMAP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits for MMAP counseling services. However, MMAP counselors help screen clients for Medicare Savings Programs (QMB, SLMB, QI) which have income limits: QMB ($1,325/month single, $1,783/month married), SLMB ($1,585/month single, $2,135/month married), QI ($1,781/month single, $2,400/month married).[1][3]
- Assets: No asset limits for MMAP counseling services. However, MMAP counselors help screen for Medicare Savings Programs which use federal asset limits: $9,660 if single and $14,470 if married.[1]
- Must be a Michigan resident[2]
- Program serves seniors and newly qualifying adults with disabilities[4]
- Persons new to Medicare because they are leaving a workplace plan also qualify[4]

**Benefits:** Free counseling and information services (no dollar limit or hour restriction). Services include: one-on-one health insurance counseling, printed materials, referrals to other agencies, assistance understanding Medicare Parts A, B, and D, Medigap options, Medicare Advantage plans, long-term care insurance, Medicare Savings Programs, prescription drug assistance programs, Medicaid eligibility, help reviewing doctor/hospital bills and Medicare Summary Notices, assistance with enrollment/coverage/claims/appeals, fraud protection education, and group presentations.[2][3][4][6]

**How to apply:**
- Phone: Call statewide MMAP hotline at 1-800-803-7174 to be connected to the MMAP office nearest to your home[4][5][6]
- In-person: Visit MMAP office locations across Michigan (specific locations vary by region)[2]
- Website: Visit thesenioralliance.org for more information[7]
- Email: Contact local MMAP office via email (specific email addresses vary by region)[5]

**Timeline:** Not specified in available sources
**Waitlist:** Not specified in available sources

**Watch out for:**
- MMAP is a counseling and information service, NOT a financial assistance program itself. It helps clients understand and apply for other programs (Medicare Savings Programs, Extra Help, Medicaid, etc.) that provide actual financial assistance.[2][3][4][6]
- MMAP counselors are volunteers and cannot sell insurance—they provide unbiased information only.[2][3][6]
- MMAP counselors are not connected with any insurance company, which is why they can provide objective advice.[2][6]
- The program is grant-funded through Centers for Medicare and Medicaid Services and the Administration on Aging, so availability or services could theoretically change with funding.[2]
- Processing times and waitlists for the programs MMAP helps you apply for (like Medicare Savings Programs) are not specified—these vary by program and are separate from MMAP's counseling service.
- While MMAP serves 'newly qualifying adults with disabilities,' most marketing and availability focuses on seniors.[4]

**Data shape:** MMAP is fundamentally different from most assistance programs: it is a free counseling and navigation service rather than a direct benefit program. There are no income or asset limits to receive MMAP counseling itself. The program's value lies in helping clients understand complex Medicare/Medicaid rules and identify which other programs they qualify for. MMAP is statewide but delivered through regional offices and providers, with a centralized hotline (1-800-803-7174) for access. The program is volunteer-staffed and grant-funded, making it a public health information resource rather than an entitlement program.

**Source:** https://www.michigan.gov/mdhhs/adult-child-serv/adults-and-seniors/acls/long-term-services-and-supports[8]

---

### Home Delivered Meals (via Area Agencies on Aging)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No financial eligibility requirements. Eligibility is based on functional need (homebound status), not income.
- Must be homebound or have high nutritional risk due to illness, recent hospitalization, living alone, or inability to shop/prepare meals[1]
- Must be unable to leave home without assistance on a regular basis[3]
- Family members with disabilities who permanently live in the home of an eligible older adult may also qualify[1]

**Benefits:** Nutritionally balanced, hot meals delivered to home. Number of meals varies by individual assessment of need. Typically includes weekday meals (Monday-Friday) with hot noon meal; some programs offer cold second meals and frozen weekend meals[1][3]
- Varies by: individual_assessment_and_region

**How to apply:**
- Contact your local Area Agency on Aging (primary method)[1]
- County-specific contact: Ionia County Commission on Aging at (616) 527-5365[3]
- County-specific contact: AgeWays (Southeast Michigan, 6 counties) at (800) 852-7795[2]
- County-specific contact: Wayne County at online application or phone[5]
- County-specific contact: Valley Area Agency on Aging (Genesee County)[4]
- County-specific contact: Meals on Wheels Western Michigan at (616) 459-3111[8]

**Timeline:** Service can begin within a few days of application[1]
**Waitlist:** Not specified in search results

**Watch out for:**
- No income test means eligibility is purely functional (homebound status), not financial—this differs from many other senior programs[2]
- Meals are free, but participants are asked to make voluntary donations ($3-$4 per meal suggested)[1][3][5]—families should understand this is optional but encouraged
- Delivery schedules vary significantly by county; not all areas offer weekend meals or daily delivery[2][3][5][6]
- Clients must be home to receive meals; missed deliveries may not be rescheduled[3]
- Bi-annual in-home assessment is required to maintain eligibility; this is not a one-time application[3]
- Area Agencies on Aging do not always provide meals directly—they fund and oversee local organizations that deliver[2]
- Some programs serve only homebound seniors; others serve 'prioritized older adults' with broader definitions of need[1]
- Meals are typically sodium-restricted and designed for senior nutritional needs, which may differ from what the senior is accustomed to[6]

**Data shape:** This is a decentralized program administered through regional Area Agencies on Aging, resulting in significant variation by county in delivery schedules, meal frequency, donation amounts, and specific eligibility criteria. There are no statewide income or asset limits. Eligibility is purely functional (homebound/nutritional risk) rather than means-tested. The program includes a wellness check component—delivery staff conduct regular check-ins. Families must contact their specific county/regional agency for precise details, as the search results show substantial variation across Michigan's regions.

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/other-help/food/home-delivered-meals

---

### Respite Care (MI Choice Waiver & POS)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+
- Income: Gross monthly income cannot exceed 300% of the Federal SSI rate, which is $2,982 per month for an individual in recent figures (excludes spousal income; changes annually and special rules apply for married couples). No full household size table specified; federal Medicaid long-term care limits apply.[4][1]
- Assets: Allowable assets limited to $2,000 for an individual ($9,950 cited in some regional sources, but standard Medicaid LTC is $2,000). Home equity interest no greater than $730,000 in 2025 (home exempt if applicant lives there, intends to return, spouse lives there, or dependent child lives there). One car exempt. Federal protected spousal asset guidelines apply.[1][4]
- Michigan resident at risk of nursing home placement, living in home/community (not nursing home, ICF/IID, or state psychiatric hospital).
- Medicaid financially eligible.
- Nursing Facility Level of Care (NFLOC) determined via in-person Michigan Medicaid Nursing Facility LOCD assessment.
- Requires at least two MI Choice services, one being supports coordination; needs cannot be fully met by State Plan Medicaid services.
- Must agree to receive services at least every 30 days.
- For ages 18-64, must have disability; frail elderly 65+ qualify if meeting frailty criteria.

**Benefits:** Respite care (in-home, friend/relative home excluding parent of minor/spouse/legal guardian/primary unpaid caregiver), plus supports coordination (required) and one+ other services: adult day care, chore services, community living supports/transportation, counseling, home-delivered meals, home modifications, medical equipment/supplies, nursing (preventative/private duty/respiratory), personal emergency response system, training. No fixed dollar amounts or hours specified; person-centered plan determines amount.[2][4][6]
- Varies by: priority_tier

**How to apply:**
- Contact local MI Choice Waiver Agency (regional AAAs or providers; e.g., The Senior Alliance at 734.722.2830; CareWell Services for specific counties).[4][2]
- State site: https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver.[7]
- In-person/home assessment for LOCD by MI Choice agency.
- Renewal: MI Choice Waiver Renewal Application via agency.[7]

**Timeline:** Not specified; involves in-person assessment and person-centered planning.
**Waitlist:** Yes, if financially eligible but slots unavailable; placed on waiting list by MI Choice agency.[3]

**Watch out for:**
- Must need supports coordination + at least one other waiver service; State Plan services not interchangeable with MI Choice (stricter provider quals).
- Not for those whose needs are fully met by regular Medicaid/State Plan.
- Home/community-based only; no nursing home residents.
- Waitlists common; annual income/asset limits change (tied to SSI).
- Respite providers restricted (no spouse/parent/guardian/primary caregiver).
- POS likely refers to program operation structure, but core is waiver services via agencies.

**Data shape:** Administered regionally by MI Choice Waiver Agencies with waitlists and priority tiers; requires NFLOC + specific service combo; no fixed respite hours/dollars—instead person-centered with minimum frequency.

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No more than 125% of the federal poverty level. Example from NEMCSA provider (may vary slightly by year/provider): 1 person household: $19,562 annually; 2 person household: $26,437 annually. Full table depends on current federal poverty guidelines and household size; proof of all household income required[1][3][4].
- Assets: No asset limits mentioned in sources.
- Unemployed
- Limited employment prospects
- Registration with Michigan Works
- Desire for job training
- Priority to veterans/qualified spouses, then individuals over 65, with disabilities, low literacy, limited English proficiency, rural residents, homeless/at risk, low employment prospects, or prior American Job Center users[1][2][3][4][5]

**Benefits:** Part-time community service work at non-profit/public agencies (e.g., schools, hospitals, senior centers); 19-20 hours/week at Michigan minimum wage; job training, resume assistance, career preparedness, employability skills development; yearly physical examinations; bridge to unsubsidized employment[2][3][4][5][7]
- Varies by: priority_tier

**How to apply:**
- Contact providers directly: The Senior Alliance (Lauren Wonsowski, contact via https://thesenioralliance.org/services/senior-community-service-employment-program/)[1]
- Macomb/St. Clair Oakland Workforce (MSC-MW): https://msc-mw.org/for-job-seekers/scsep/ (serves Macomb, Oakland, St. Clair Counties)[2]
- NEMCSA: https://www.nemcsa.org/services/senior-services/senior-community-service-employment-program-scsep.html[4]
- Region VII AAA: Toll Free 1-800-858-1637 or (989) 893-4506[8]
- Michigan Works enrollment required; general American Job Centers for assistance[3]

**Timeline:** Not specified in sources.
**Waitlist:** Not specified; may vary by provider/region.

**Watch out for:**
- Must be actively unemployed and commit to job search/Michigan Works registration; not permanent employment—training bridge to unsubsidized jobs[1][2][4]
- Income based on full household, not individual; priority tiers may delay entry[3][5]
- Part-time only (19-20 hrs/wk); requires ongoing participation in meetings/job search[2][8]
- Regional providers—must contact local sub-recipient, not centralized application[1][2][4]

**Data shape:** Administered through regional sub-recipients with county-specific providers; income at 125% FPL scales by household size; priority service tiers; requires Michigan Works integration; no centralized statewide application

**Source:** https://www.michigan.gov/mdhhs (administered by MDHHS Bureau of Aging; federal: https://www.dol.gov/agencies/eta/seniors)[3][5]

---

### Legal Assistance for Seniors (AAA-funded)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Typically follows federal poverty guidelines for low-income seniors; exact dollar amounts not specified in sources and may vary by provider or year. No full table by household size provided.
- Assets: Not specified in sources.
- Low-income status (meeting federal poverty guidelines where applicable)
- Residency in the service area of the specific AAA or provider
- Civil legal matters only (e.g., consumer problems, housing, public benefits)

**Benefits:** Civil legal services including: consumer problems, domestic relations, elder law, housing, public benefits, school problems; basic discussion of rights, counseling, preparation of letters/documents/deeds/pleadings, negotiations, administrative hearings, trials, appeals in some cases, community legal education; legal education and elder abuse prevention training.
- Varies by: region

**How to apply:**
- Phone: Varies by region/provider, e.g., Legal Services of Northern Michigan (888) 356-9009, Lakeshore Legal Aid (888) 783-8190, Elder Law & Advocacy Center (313) 937-8291, Legal Aid of Western Michigan (616) 774-0672, Counsel & Advocacy Law Line (CALL) 1-888-783-8190
- Online: Varies, e.g., Lakeshore Legal Aid online application
- In-person: Varies by provider, e.g., Legal Aid of Western Michigan at 25 Division Ave S, Ste 300, Grand Rapids, MI 49503

**Timeline:** Not specified in sources.
**Waitlist:** Funding and services are limited, implying potential waitlists or capacity constraints[1]

**Watch out for:**
- Not a single statewide program; must contact local AAA or specific regional provider based on county/residence
- Funding and services limited; may not cover all cases or have capacity[1]
- Civil matters only; no criminal law
- Some providers prioritize federal poverty guideline qualifiers even for seniors 60+[3]
- Varies significantly by region; one phone number won't work statewide

**Data shape:** Decentralized by AAA region with different nonprofit providers per area; no uniform statewide income/asset tables or processing times; eligibility often ties to federal poverty guidelines but not quantified here; contact local AAA required

**Source:** https://www.ageways.org (AgeWays example); https://4ami.org (AAAs of Michigan); contact local AAA via Eldercare Locator

---

### Michigan Long Term Care Ombudsman Program (MLTCOP)

> **NEW** — not currently in our data

**Eligibility:**
- Already living in a long-term care facility (not a program to help you enter one)
- No financial eligibility test — service is free to all residents

**Data shape:** This program has no traditional 'eligibility' in the sense of income/asset tests. Access is automatic for facility residents. The program structure is statewide with local ombudsmen assigned by region. Services are investigative and advocacy-based, not direct service provision.

**Source:** mltcop.org and Michigan Department of Health and Human Services

---

### Michigan's Choice Waiver Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 18+
- Income: Monthly income limit is 300% of the Federal Benefit Rate (FBR), which adjusts annually each January. In 2025: up to $2,901 per applicant regardless of marital status (each spouse assessed individually if both applying). In 2026: $2,982 per month.[1][4]
- Assets: Standard Medicaid limits apply: $2,000 for an individual (not explicitly stated but implied via Medicaid eligibility); reported as $9,950 for individuals and $14,910 for couples in 2026 by one source (may vary or be outdated). Home equity limit: $730,000 in 2025 if applicant lives in home or intends to return. Exempt assets: primary home (if equity under limit and spouse, disabled/blind child any age, or minor child under 21 lives there), one car.[1][4]
- Medicaid financial eligibility.
- Nursing Facility Level of Care (NFLOC) via in-person Michigan Medicaid Nursing Facility Level of Care Determination (LOCD) tool, assessing ADLs (e.g., transferring, mobility, eating, toileting), cognitive abilities, behavior; must score sufficiently (e.g., at least 6 points on Door 1).
- Need supports coordination plus at least one other waiver service; needs cannot be fully met by State Plan or other services.
- For under 65: must have a disability.
- Live in home/community setting (not nursing home); ongoing eligibility required.

**Benefits:** Home and community-based services equivalent to nursing facility level, including: supports coordination, personal care, homemaker, home modifications, non-medical transportation, adult day care, respite, nutritional services, medical equipment/supplies, private duty nursing/respiratory care, training, preventative nursing. Basic Medicaid services also covered. No fixed dollar amounts or hours specified; individualized based on assessed needs.[3][7]
- Varies by: priority_tier

**How to apply:**
- Contact local MI Choice Waiver Agency by county (phone interview for preliminary assessment of ADLs, income, assets).
- In-person/home assessment for LOCD by agency.
- No specific statewide phone/URL/form listed; use MDHHS site for local agencies: https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver.[5][7][8]

**Timeline:** Not specified in sources.
**Waitlist:** Not mentioned; may exist regionally but no details.

**Watch out for:**
- Must meet *all* three criteria (financial, NFLOC, waiver service need) ongoing; dementia diagnosis alone insufficient.
- Income limit strict—even $1 over disqualifies (e.g., $2,901 in 2025).
- Home equity counts if over $730,000 unless exceptions apply.
- Not for nursing home residents; only community settings.
- Under 65 requires disability proof.
- Assessed via local agency—not centralized.

**Data shape:** Statewide but county-administered with local agencies; eligibility via 3-prong test (financial/Medicaid, NFLOC via LOCD tool with Doors scoring, waiver service need); income/assets tied to annual FBR adjustments; no fixed benefit caps, individualized.

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver

---

### MI Health Link Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 21+
- Income: No specific dollar amounts or household size table stated; requires full Medicaid eligibility (no spend down or deductible). Income limit for related HCBS waiver context is 300% of Federal Benefit Rate (FBR), but core program ties to full dual Medicare-Medicaid eligibility without explicit limits listed.[1][2][3][7]
- Assets: Tied to full Medicaid eligibility; for HCBS waiver component, home equity limit of $730,000 (2025) if intending to return home. Exemptions include spouse or dependent child(ren) living in home. Other assets follow standard Medicaid rules (not detailed).[3]
- Enrolled in both full Medicare (Parts A, B, D) and full Medicaid benefits.
- Live in specific counties: Barry, Berrien, Branch, Calhoun, Cass, Kalamazoo, Macomb, St. Joseph, Van Buren, Wayne, or any Upper Peninsula county (full list: Alger, Baraga, Barry, Berrien, Branch, Calhoun, Cass, Chippewa, Delta, Dickinson, Gogebic, Houghton, Iron, Kalamazoo, Keweenaw, Luce, Mackinac, Marquette, Menominee, Ontonagon, Schoolcraft).[1][3][6]
- Not residing in state-operated veteran's home.
- Not enrolled in hospice.
- For HCBS: Nursing Facility Level of Care (NFLOC) via Michigan Medicaid LOCD, considering ADLs, cognition, behavior.[3][5]
- Must disenroll from PACE, MI Choice, or employer/union plans to join.[2][6]

**Benefits:** Integrated Medicare-Medicaid coverage: medical, behavioral health, pharmacy (replaces Medicare Part D), dental, hearing, vision, Medicare services, care coordination, home/community-based services (HCBS requiring NFLOC), nursing home care. No co-pays or deductibles for in-network services. Personal care for ADL level 3+.[1][2][5][7]
- Varies by: region

**How to apply:**
- Passive enrollment via letter from Michigan ENROLLS with ICO options (Integrated Care Organizations). Opt-in available.[1][6]
- Contact local MDHHS office or Michigan ENROLLS (specific phone/website not in results; general MI Bridges at www.michigan.gov/mibridges for Medicaid).[4]
- Forms: Authorization to Disclose Protected Health Information (DCH-1183), Behavioral Health Consent Form (MDHHS-5515).[1]

**Timeline:** Varies by phase; Phase 1 services May 1, 2015; Phase 2 opt-in April 1, 2015 onward with services May 1, 2015; passive enrollment starts May/July 2015 (historical).[6]

**Watch out for:**
- Must have full dual eligibility (no Medicaid spend down/deductible).[2][7]
- Not statewide—only specific counties.[1]
- Requires disenrolling from PACE/MI Choice; no auto-assignment for these.[2][6]
- MI Health Link Part D replaces Medicare Part D plan.[1]
- HCBS requires NFLOC; personal care only for ADL level 3+.[3][5]
- Nursing home residents pay patient pay amount.[2]

**Data shape:** Dual-eligible only (full Medicare + Medicaid), county-restricted (not statewide), delivered via regional ICOs with no explicit income/asset tables (tied to Medicaid), HCBS tiered by NFLOC/ADL levels.

**Source:** https://www.michigan.gov/mdhhs/doing-business/providers/integrated

---

### MI Choice Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for elderly or 18+ if disabled+
- Income: Up to 300% of the Federal Benefit Rate (FBR) or Supplemental Security Income federal benefit rate. Examples: $2,829/month in 2024[3], $2,982/month (Region 7)[8], $2,910/month approximate (video reference, likely 2024/2025 FBR)[5]. Exact amount adjusts annually with FBR; no household size table specified as it applies to individual applicant income.
- Assets: Up to $2,000 for Medicaid financial eligibility[3]. Home equity limit of $730,000 in 2025 if living in home or intending to return (exemptions: spouse or dependent child living in home)[1]. Standard Medicaid countable assets apply; primary home often exempt if equity under limit.
- Categorically eligible for Medicaid as aged (65+) or disabled (requires disability determination if under 65)[3][4]
- Nursing Facility Level of Care (NFLOC) determined via in-person Michigan Medicaid LOCD assessment[1][2]
- Require supports coordination plus at least one other waiver service; needs unmet by other programs[1][3]
- At risk of nursing home placement; assessed via Activities of Daily Living (ADLs), cognitive abilities, behavior[1]

**Benefits:** Home and community-based services (HCBS) equivalent to nursing facility level, including basic Medicaid services, supports coordination, and one or more waiver services such as personal care, homemaker, respite, home modifications, non-medical transportation, adult day care, personal emergency response systems (PERS), and more. Provided in home, adult foster care, home for the aged, or assisted living[1][4][6][7][8]. No fixed dollar amounts or hours specified; individualized based on assessed needs.
- Varies by: priority_tier

**How to apply:**
- Contact local MI Choice Waiver Agency for telephone screening (find agency by region at Michigan.gov/mdhhs MI Choice page)[3][6]
- Phone examples: Region 7 1-800-858-1637[8], Region 11 UPCAP 906-786-4701[6]
- In-person or phone assessment follows screening[1][5]
- No specific online form or mail mentioned; starts with agency contact

**Timeline:** Varies by region; initial telephone screening, then functional assessment if slot available[3]
**Waitlist:** Common due to limited slots per agency; depends on location—may occur after screening[3]

**Watch out for:**
- Must require supports coordination + one other service; dementia diagnosis alone insufficient[1][3]
- Strict income limit (e.g., $1 over disqualifies)[5]; 300% FBR applies even if household has multiple people
- Waitlists common—varies regionally, no statewide guarantee of immediate access[3]
- Home equity limit ($730,000 in 2025) if intending to return home[1]
- Services only in community settings compliant with federal HCBS rules (no isolating institutional settings)[6]
- Financial eligibility tied to Medicaid; separate disability proof needed if under 65[3][4]

**Data shape:** Administered via 16 regional MI Choice Waiver Agencies with slot limits leading to waitlists; income fixed at 300% FBR (individual, not household-scaled); benefits individualized by NFLOC assessment and priority, not fixed hours/dollars

**Source:** https://www.michigan.gov/mdhhs/assistance-programs/healthcare/seniors/michoicewaiver

---

### Michigan Homestead Property Tax Credit (HPTC) for Seniors

> **NEW** — not currently in our data

**Eligibility:**
- Income: No strict age requirement, but seniors (typically 65+) receive enhanced benefits up to 100% credit. Total Household Resources (THR) must be under specified annual limits; eligibility phases out above $51,001 and ends at $60,001. Taxable value of homestead under annual cap (e.g., $135,000 excluding agricultural portions for homeowners). Exact THR limits and caps adjusted annually; THR excludes certain FIP/DHHS benefits but reduces credit proportionally if partial. Full table not in sources—check annual Treasury guidance.
- Assets: No asset limits specified; based on income (THR) and property taxes exceeding 3.2% of income.
- Michigan resident for at least 6 months of the tax year.
- Homestead in Michigan (own and occupy or rent under lease).
- Natural person (not trust, LLC, etc.).
- Property taxes >3.2% of annual income.
- Homeowners: homestead taxable value under annual cap.
- Not fully composed of FIP or DHHS benefits (reduces credit if partial).

**Benefits:** Tax credit up to $1,500 maximum. Deducts up to 60% of millage increase cost; seniors eligible for up to 100%. Credit amount based on property taxes/rent vs. THR; phases out above $51,001 THR, ends at $60,001. Helps offset property taxes billed to homeowners/renters. Adjustable annually; claimable up to 4 years retroactively.
- Varies by: household_size|priority_tier|region

**How to apply:**
- File with Michigan income tax return (MI-1040CR form).
- Visit Michigan Treasury Homestead Property Tax Credit webpages for guidance: https://www.michigan.gov/taxes/iit/tax-guidance/credits-exemptions/hptc.
- Consult tax professional or IRS-trained volunteers for low/no-cost assistance.
- Local Board of Review for related poverty exemption (March annually).

**Timeline:** Processed with tax return; no specific timeline stated.

**Watch out for:**
- Phases out between $51,001-$60,001 THR—many miss partial eligibility.
- Homeowners taxable value cap (e.g., $135,000); renters exempt from this.
- FIP/DHHS benefits reduce or disqualify credit.
- Must file with taxes or up to 4 years retro; annual reapplication for local exemptions.
- Not full exemption—max $1,500 credit; compare to local poverty deferments.
- Seniors get 100% but still income/property tax threshold applies.

**Data shape:** Income-based refundable tax credit (not direct relief); phases by THR thresholds; enhanced for seniors; supplemented by local exemptions/deferments; annual adjustments to limits/caps

**Source:** https://www.michigan.gov/taxes/iit/tax-guidance/credits-exemptions/hptc

---

### MiCAFE (Michigan's Coordinated Access to Food for the Elderly)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Eligibility for underlying benefits like SNAP is based on household composition, monthly income (minus medical expenses in some cases), and countable assets; specific dollar amounts and full household size tables not detailed in sources—refer to SNAP guidelines via MiCAFE assistance[1][2][4]
- Assets: Countable assets apply for SER and SNAP eligibility based on household; details on what counts or exemptions not specified[1]
- Limited income
- Primarily for individuals 60 and older
- Living on limited income to access benefits like SNAP, utilities, medical assistance, prescriptions[1][2]

**Benefits:** Application assistance for SNAP (Bridge Card/food benefits), Medicare premiums, Medicare Part D prescription drug benefits, utility assistance, tax programs, medical assistance, and prescriptions; includes phone support, in-home assistance where available, outreach, education, and electronic submission help[1][2][3][5]

**How to apply:**
- Phone: 1-877-664-2233 (Monday-Friday, 9:00 a.m. to 3:00 p.m.)[1][2][5][8]
- Website: elderlawofmi.org/micafe[2][8]
- In-home or in-person via MiCAFE Network partners where available[3]
- Electronic submission assistance through partners[3]

**Timeline:** Times vary by program (e.g., SNAP); not specified for MiCAFE assistance itself[5]

**Watch out for:**
- MiCAFE is application assistance, not direct benefits—success depends on underlying program eligibility like SNAP[1][2]
- Nearly 50% of eligible seniors do not enroll in SNAP without help[8]
- Phone hours limited to 9am-3pm M-F[1][2]
- May assist even if not qualifying for Bridge Card (e.g., Medicare help)[2]
- Stigma/barriers addressed via network, but over 160,000 seniors still face hunger[3]

**Data shape:** Advocacy program via statewide network; eligibility tied to variable SNAP/SER rules (household-based income/assets minus medical expenses); no fixed MiCAFE-specific limits or direct benefits provided[1][3][4]

**Source:** https://www.elderlawofmi.org/micafe[2][8]

---

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **region**: 4 programs
- **individual_need**: 1 programs
- **priority_tier**: 5 programs
- **household_size**: 1 programs
- **household_size|priority_tier|region**: 2 programs
- **household_size (services customized based on whole-home energy audit; no single service is guaranteed)**: 1 programs
- **not_applicable**: 2 programs
- **individual_assessment_and_region**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **MI Health Link**: County-restricted to 10 Lower Peninsula + all Upper Peninsula counties; dual Medicare-Medicaid integration with optional HCBS waiver requiring NFLOC assessment; enrollment via plans/state auto-assignment, not standard Medicaid application
- **MI Choice Medicaid Waiver**: MI Choice is a statewide program with decentralized administration through regional waiver agencies, creating geographic variation in access and processing. Eligibility is binary (meets NFLOC or does not) rather than tiered. Income and asset limits are fixed annually but change each year. Benefits are individualized and person-centered rather than standardized by tier. The program requires dual eligibility: financial (income/assets) AND medical (functional need for nursing facility level of care). The 60-month Look-Back Rule creates a unique penalty mechanism for asset transfers. Spousal protections add complexity for married applicants.
- **Michigan PACE Program**: Regionally restricted to specific PACE provider service areas (not statewide); no direct income/asset caps but Medicaid-linked for full funding; requires nursing facility-level care certification; multiple providers with varying geographies
- **Medicaid Medicare Premium Payment (QMB, SLMB, QI) Programs**: Tiered by income (QMB <100% FPL, SLMB 100-120%, QI 120-135%); asset-capped; QI funding-limited/not entitlement; auto-Extra Help; MI follows federal but local MDHHS processing.
- **MI Bridges Food Assistance Program (SNAP)**: Expanded eligibility (200% FPL gross, elderly/disabled skip gross test); benefits scale by household size/income/expenses; asset test rare (disqualifications only); work requirements vary by county rollout; statewide via MI Bridges.
- **Michigan Energy Assistance Program (LIHEAP)**: Multi-program structure (MEAP preventive, LIHEAP crisis/regular, SER emergency, Home Heating Credit, Weatherization) with tiered income limits by component; automatic eligibility via SNAP/SSI/TANF; local agency delivery statewide; benefits scale by income/size/fuel/emergency status[1][5][6][7][8]
- **Michigan Weatherization Assistance Program**: This program's structure is highly decentralized: administered statewide through local Community Action Agencies with varying income thresholds (200-250% of poverty guidelines), different service areas by county, and funding-dependent availability. Income eligibility varies by household size with specific dollar thresholds. Benefits are customized per home based on energy audit rather than fixed amounts. Home eligibility has multiple deferral criteria that can disqualify properties. Regional variation is significant due to different local providers and funding availability.
- **Michigan Medicare Assistance Program (MMAP)**: MMAP is fundamentally different from most assistance programs: it is a free counseling and navigation service rather than a direct benefit program. There are no income or asset limits to receive MMAP counseling itself. The program's value lies in helping clients understand complex Medicare/Medicaid rules and identify which other programs they qualify for. MMAP is statewide but delivered through regional offices and providers, with a centralized hotline (1-800-803-7174) for access. The program is volunteer-staffed and grant-funded, making it a public health information resource rather than an entitlement program.
- **Home Delivered Meals (via Area Agencies on Aging)**: This is a decentralized program administered through regional Area Agencies on Aging, resulting in significant variation by county in delivery schedules, meal frequency, donation amounts, and specific eligibility criteria. There are no statewide income or asset limits. Eligibility is purely functional (homebound/nutritional risk) rather than means-tested. The program includes a wellness check component—delivery staff conduct regular check-ins. Families must contact their specific county/regional agency for precise details, as the search results show substantial variation across Michigan's regions.
- **Respite Care (MI Choice Waiver & POS)**: Administered regionally by MI Choice Waiver Agencies with waitlists and priority tiers; requires NFLOC + specific service combo; no fixed respite hours/dollars—instead person-centered with minimum frequency.
- **Senior Community Service Employment Program (SCSEP)**: Administered through regional sub-recipients with county-specific providers; income at 125% FPL scales by household size; priority service tiers; requires Michigan Works integration; no centralized statewide application
- **Legal Assistance for Seniors (AAA-funded)**: Decentralized by AAA region with different nonprofit providers per area; no uniform statewide income/asset tables or processing times; eligibility often ties to federal poverty guidelines but not quantified here; contact local AAA required
- **Michigan Long Term Care Ombudsman Program (MLTCOP)**: This program has no traditional 'eligibility' in the sense of income/asset tests. Access is automatic for facility residents. The program structure is statewide with local ombudsmen assigned by region. Services are investigative and advocacy-based, not direct service provision.
- **Michigan's Choice Waiver Program**: Statewide but county-administered with local agencies; eligibility via 3-prong test (financial/Medicaid, NFLOC via LOCD tool with Doors scoring, waiver service need); income/assets tied to annual FBR adjustments; no fixed benefit caps, individualized.
- **MI Health Link Program**: Dual-eligible only (full Medicare + Medicaid), county-restricted (not statewide), delivered via regional ICOs with no explicit income/asset tables (tied to Medicaid), HCBS tiered by NFLOC/ADL levels.
- **MI Choice Program**: Administered via 16 regional MI Choice Waiver Agencies with slot limits leading to waitlists; income fixed at 300% FBR (individual, not household-scaled); benefits individualized by NFLOC assessment and priority, not fixed hours/dollars
- **Michigan Homestead Property Tax Credit (HPTC) for Seniors**: Income-based refundable tax credit (not direct relief); phases by THR thresholds; enhanced for seniors; supplemented by local exemptions/deferments; annual adjustments to limits/caps
- **MiCAFE (Michigan's Coordinated Access to Food for the Elderly)**: Advocacy program via statewide network; eligibility tied to variable SNAP/SER rules (household-based income/assets minus medical expenses); no fixed MiCAFE-specific limits or direct benefits provided[1][3][4]

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Michigan?
