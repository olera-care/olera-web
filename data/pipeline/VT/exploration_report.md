# Vermont Benefits Exploration Report

> Generated 2026-04-09 by benefits-pipeline.js
> Cost: $0.085 (17 calls, 8.5m)

---

## Summary

| Metric | Value |
|--------|-------|
| Programs discovered | 15 |
| Programs deep-dived | 15 |
| New (not in our data) | 11 |
| Data discrepancies | 4 |
| Fields our model can't capture | 4 |

## Data Model Gaps

These data fields appeared across programs but don't exist in our current model:

| Field | Programs | Note |
|-------|----------|------|
| `asset_limits` | 4 | Our model has no asset limit fields |
| `regional_variations` | 4 | Program varies by region — our model doesn't capture this |
| `documents_required` | 4 | Has document checklist — our model doesn't store per-program documents |
| `household_size_table` | 1 | Benefits/eligibility vary by household size — we store a single number |
| `waitlist` | 1 | Has waitlist info — our model has no wait time field |

## Program Types

- **service**: 8 programs
- **financial**: 3 programs
- **in_kind**: 1 programs
- **employment**: 1 programs
- **advocacy**: 2 programs

## Data Discrepancies

Our data differs from what official sources say:

### Medicaid for Aged, Blind, and Disabled (ABD)

- **income_limit**: Ours says `$1333` → Source says `$1,375` ([source](https://mabdapply.vermont.gov/))
- **benefit_value**: Ours says `$5,000 – $20,000/year` → Source says `Comprehensive health care coverage including doctor visits, hospital care, prescription drugs, dental/vision (limited), and long-term services/supports for those needing ADL help (e.g., home health, personal care). For LTC via Choices for Care: nursing home or HCBS. No specific dollar amounts or hours stated; covers costs based on assessed needs.[1][3][5]` ([source](https://mabdapply.vermont.gov/))
- **source_url**: Ours says `MISSING` → Source says `https://mabdapply.vermont.gov/`

### Fuel Assistance Program

- **benefit_value**: Ours says `$3,000 – $10,000/year` → Source says `Yearly one-time benefit payment paid directly to fuel provider; amount based on income and average annual heating costs. May increase 3SquaresVT benefits if eligible. Covers kerosene, oil, propane, electricity, wood, pellets, or combination.` ([source](https://dcf.vermont.gov/ (implied via DCF Economic Services Division; specific fuel page not directly linked in results)))
- **source_url**: Ours says `MISSING` → Source says `https://dcf.vermont.gov/ (implied via DCF Economic Services Division; specific fuel page not directly linked in results)`

### Caregiver Support Program

- **benefit_value**: Ours says `$2,000 – $8,000/year` → Source says `VA CSP: Personal care services, training, stipends (amounts not specified); ASP: Self-directed attendant services (hours based on need, entitlement no waitlist); Dementia Respite: Respite care (details limited); Paid family caregiving up to $1700/month tax-free via Medicaid programs[1][2][3][4]` ([source](No single official .gov for 'Caregiver Support Program'; see dvha.vermont.gov for Medicaid/Global Commitment[2][3], asd.vermont.gov for Choices[3]))
- **source_url**: Ours says `MISSING` → Source says `No single official .gov for 'Caregiver Support Program'; see dvha.vermont.gov for Medicaid/Global Commitment[2][3], asd.vermont.gov for Choices[3]`

### Long-Term Care Ombudsman

- **benefit_value**: Ours says `$10,000 – $30,000/year` → Source says `Investigate complaints and concerns; assist with decisions on long-term care; monitor facilities via visits; educate staff on rights; advocate for system changes; provide information on services; help with denials, quality issues, discharges, privacy, care, food, finances, transfers, roommates for facility residents or Choices for Care participants[1][2][4]` ([source](https://vtlawhelp.org/long-term-care-help))
- **source_url**: Ours says `MISSING` → Source says `https://vtlawhelp.org/long-term-care-help`

## New Programs (Not in Our Data)

- **Choices for Care (CFC) Waiver** — service ([source](https://www.medicaid.gov/Medicaid-CHIP-Program-Information/By-Topics/Waivers/1115/downloads/vt/vt-choices-for-care-ca.pdf[5]))
  - Shape notes: Tiered by need level (Highest/High/Moderate) with entitlement only for Highest; income up to 300% SSI with spend-down; $10k asset allowance for community-living high/highest need singles; 60-month look-back applies[1][2][3][5]
- **Program of All-Inclusive Care for the Elderly (PACE)** — service ([source](https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal); Vermont Medicaid: https://dail.vermont.gov/ (state); NPA: https://www.npaonline.org/find-a-pace-program[6][8]))
  - Shape notes: Only available at limited centers in select Vermont regions; no fixed income/asset tables (Medicaid-based); heavy waitlists and service area restrictions; dual-eligible focus with private pay option
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI)** — financial ([source](https://dvha.vermont.gov/ (Vermont Dept. of Vermont Health Access); supplemental https://vtlawhelp.org/medicare-savings-buy-programs[5]))
  - Shape notes: No asset test in Vermont (state waiver); tiered by income brackets (QMB<100%FPL, SLMB 100-120%, QI 120-135%); benefits degrade by tier (full cost-sharing to Part B only); auto Extra Help; household size limited to Medicare unit (individual/couple)
- **3SquaresVT for Older Vermonters** — financial ([source](dcf.vermont.gov/benefits/3SquaresVT/SNAP))
  - Shape notes: Simplified application and 3-year certification only for households all 60+/disabled with no earned income; asset test only for elderly/disabled over 185% FPL; cash benefits option for 65+/SSI.
- **Weatherization Assistance Program** — service ([source](https://outside.vermont.gov/dept/DCF/Shared%20Documents/Benefits/Weatherization-Income-Guidelines.pdf))
  - Shape notes: County-grouped income limits that vary by household size; delivered regionally via 5 community action agencies; property-level 15-year limit; dual tenant/landlord consent for rentals
- **State Health Insurance Assistance Program (SHIP)** — service ([source](http://www.vermont4a.org/[2]))
  - Shape notes: No income/asset tests; counseling-only service via statewide network of local Area Agencies on Aging; appointment-based with regional providers
- **Meals on Wheels (Vermont)** — in_kind
  - Shape notes: Vermont Meals on Wheels is a multi-provider system with no statewide unified eligibility or application process. Age Well is the largest provider but does not serve all counties. VCIL operates a separate program for under-60 individuals. Eligibility is primarily age-based (60+) with no income or asset limits, making it unusual among means-tested programs. Benefits are fixed (meals delivered 5 days/week) rather than scaled. Regional variation is significant: different providers, different counties, different donation amounts, different processing times. Families must first identify their local provider, then contact that provider directly.
- **Senior Community Service Employment Program (SCSEP)** — employment ([source](https://a4td.org/scs-employment-program/))
  - Shape notes: Vermont-specific via A4TD grantee; national SCSEP rules apply with income at 125% FPL (annual update); no asset limits or fixed dollar tables in sources - requires local verification; statewide but community-host dependent
- **Legal Assistance for Seniors (Vermont Legal Aid Elder Law Project)** — advocacy ([source](https://www.vtlegalaid.org/legal-projects/elder-law-medicare-advocacy))
  - Shape notes: No fixed income/asset tables; eligibility via low-income screening and civil legal need priority; statewide centralized intake with pro bono network
- **Vermont Senior Companion Program** — service ([source](No single primary .gov URL; program via AmeriCorps Seniors, administered by Vermont Area Agencies on Aging (e.g., www.agewellvt.org)))
  - Shape notes: Volunteer stipend program (AmeriCorps Seniors) matching low-income 55+ volunteers to provide companionship/services to homebound elders; income-tested for volunteers (200% poverty, varies by household size/year); statewide via 4 regional agencies; no client eligibility test mentioned.
- **Senior Solutions Vet-to-Vet Program** — service ([source](https://www.seniorsolutionsvt.org/services/veterans/))
  - Shape notes: Volunteer matching service only, no income/asset test, region-restricted to 46 towns with Brattleboro partnership, no quantified benefits like hours or dollars

## Program Details

### Choices for Care (CFC) Waiver

> **NEW** — not currently in our data

**Eligibility:**
- Age: 65+ for seniors or 18+ for adults with physical disabilities[1][2][7]+
- Income: Up to 300% of SSI (e.g., $1,911/month for single individual in 2008; current amounts not specified in sources, consult ESD for 2026 figures). Applicant keeps some/all income for personal needs, uncovered medical expenses, spouse/dependent support. Spouse can have up to $2,644 (standard) or $3,948 (maximum) of applicant's income if excess shelter costs. Spend-down allowed to qualify[3][5][6]
- Assets: $2,000 general resource limit for nursing home care eligibility (other limited exclusions). $10,000 for high/highest need medically needy single individuals owning/residing in own home selecting HCBS. Exempt: primary home (equity ≤$730,000 in 2025 if intent to return, spouse/minor child/disabled adult child living there), household furnishings/appliances, personal effects, vehicle. 60-month look-back rule penalizes asset transfers below fair market value[1][3][5][6]
- Vermont resident[1][2]
- Nursing Facility Level of Care (NFLOC): significant ADL assistance (transferring, eating, toileting, bed mobility), skilled nursing needs (wound care, tube feedings), cognitive/behavioral issues (e.g., dementia-related wandering, impaired judgment). Determined by in-person RN assessment[1][2]
- Both clinical (functional need via assessment) and financial eligibility required. Assigned to Highest Needs (entitled), High Needs (as resources permit), or Moderate Needs (limited, as resources permit) groups[1][2][3]

**Benefits:** Home and Community-Based Services (HCBS) equivalent to nursing facility level, including assistance with ADLs/IADLs, skilled nursing, behavioral support. Specific services not itemized by hours/dollars; managed via global cap with priority for highest needs[1][2][3]
- Varies by: priority_tier

**How to apply:**
- Contact Department of Vermont Health Access (DVHA), Economic Services Division (ESD) for financial eligibility; Department of Disabilities, Aging & Independent Living (DAIL) for functional assessment[3][4]
- No specific phone/website/form listed; start with eligibility screening including PASARR if appropriate[2][4]

**Timeline:** Not specified[null]
**Waitlist:** High/Moderate Needs groups subject to state resources; Highest Needs entitled with no waitlist mentioned. Managed by professional judgment prioritizing unmet ADL/IADL/behavioral needs[2][3]

**Watch out for:**
- 60-month look-back penalizes asset transfers[1]
- Only Highest Needs guaranteed; High/Moderate depend on resources[2][3]
- Spouse income/assets handled specifically (not counted for applicant, but shelter allowances apply)[6]
- Dementia diagnosis alone insufficient; requires NFLOC assessment[1]
- Must meet both financial and clinical criteria[4]

**Data shape:** Tiered by need level (Highest/High/Moderate) with entitlement only for Highest; income up to 300% SSI with spend-down; $10k asset allowance for community-living high/highest need singles; 60-month look-back applies[1][2][3][5]

**Source:** https://www.medicaid.gov/Medicaid-CHIP-Program-Information/By-Topics/Waivers/1115/downloads/vt/vt-choices-for-care-ca.pdf[5]

---

### Medicaid for Aged, Blind, and Disabled (ABD)


**Eligibility:**
- Age: 65+
- Income: In 2026, monthly income limit is $1,375 for single applicants outside Chittenden County; $1,441 inside Chittenden County (2025 figure, likely similar). Limits apply to countable income and vary by marital status, location, and program specifics (e.g., higher for nursing home). No full household size table available; financial responsibility group size determines maximums.[1][3][6][7]
- Assets: Single applicant: $2,000 in countable assets. Countable assets include most savings, investments, and property (excluding primary home in some cases, one vehicle, personal belongings, burial plots). Exempt assets: primary residence (if intent to return), household goods, one vehicle. Varies by marital status; spousal protections apply. Standard Medicaid resource rules.[1][3]
- Blind or disabled (as defined by SSI criteria, including children under 18 or 22 if students).[1][2]
- Vermont resident.[1]
- U.S. citizen or qualified immigrant.[2]
- Functional assessment for long-term care needs: help with ADLs/IADLs (e.g., bathing, dressing, mobility, shopping); no NHLOC required for basic MABD coverage, but needed for some LTC services.[1][3]

**Benefits:** Comprehensive health care coverage including doctor visits, hospital care, prescription drugs, dental/vision (limited), and long-term services/supports for those needing ADL help (e.g., home health, personal care). For LTC via Choices for Care: nursing home or HCBS. No specific dollar amounts or hours stated; covers costs based on assessed needs.[1][3][5]
- Varies by: priority_tier

**How to apply:**
- Online: https://mabdapply.vermont.gov/[5]
- Phone: Call Green Mountain Care at 1-800-250-8427 to request application[5]
- Paper: Print and mail 205ALLMED form[5]
- Note: Separate from general Medicaid; do not use Vermont Health Connect for MABD[5]

**Timeline:** Not specified in sources.

**Watch out for:**
- Separate application process from general Medicaid/Vermont Health Connect—must use MABD-specific form or site.[5]
- Income/asset limits vary by Chittenden County, marital status, and LTC program (e.g., nursing home higher).[1][3][7]
- Functional assessment required for LTC benefits, even if basic coverage approved.[1][3]
- Applying without meeting financial criteria leads to denial; spousal impoverishment rules apply.[1]
- Distinguish from Choices for Care (HCBS/nursing) or MWD (working disabled, higher limits).[1][5]

**Data shape:** Income limits vary by Chittenden County residence and marital status; functional needs assessed for LTC add-ons; separate track from general Medicaid with specific ABD application portal.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://mabdapply.vermont.gov/

---

### Program of All-Inclusive Care for the Elderly (PACE)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: No specific income limits mentioned; primarily serves dually eligible Medicare/Medicaid individuals (about 90%), but Medicare-only or self-pay possible with financial responsibility for premiums (avg. $4,000-$5,000/month for long-term care if transitioning to nursing home). Exact Vermont limits not detailed in sources—contact state Medicaid office[1][2][7].
- Assets: No asset limits specified in sources.
- Live in the service area of a Vermont PACE program
- Eligible for nursing home level of care (NFLOC) as determined by Vermont Medicaid
- Able to live safely in the community with PACE support

**Benefits:** Comprehensive medical and social services including primary care, doctor's visits, medications, hospitalizations, prescription drugs (via Medicare Part D), long-term services (in-home nursing, personal care, durable medical equipment), adult day health care, transportation, home care, therapies; all Medicare/Medicaid-covered services provided by PACE team as sole source; personalized interdisciplinary care plan[1][2][3][4][6][7].
- Varies by: region

**How to apply:**
- Contact local Vermont PACE program for in-person assessment (find via NPA map)
- Call state Medicaid office or Medicare at 1-800-633-4227
- In-person meeting with PACE staff to assess health, needs, and develop care plan

**Timeline:** Not specified; depends on location and enrollment capacity
**Waitlist:** Common due to limited spaces; varies by program[1][2][5]

**Watch out for:**
- Geographically limited—not available everywhere in Vermont; biggest barrier is no local program or waitlist[1][2]
- Becomes sole source of Medicare/Medicaid services—cannot use Medicare Advantage, HCBS waivers, other Part D plans, or hospice simultaneously[2]
- Must use only PACE-selected providers; free to leave anytime but denial requires written reason[1][2][3]
- Non-Medicaid enrollees pay high premiums if needing long-term care later ($4,000-$5,000/month avg.)[1]
- Nursing home eligibility required despite community living goal[1][4][7]

**Data shape:** Only available at limited centers in select Vermont regions; no fixed income/asset tables (Medicaid-based); heavy waitlists and service area restrictions; dual-eligible focus with private pay option

**Source:** https://www.cms.gov/medicare/medicaid-coordination/about/pace (federal); Vermont Medicaid: https://dail.vermont.gov/ (state); NPA: https://www.npaonline.org/find-a-pace-program[6][8]

---

### Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI)

> **NEW** — not currently in our data

**Eligibility:**
- Income: Must be enrolled in Medicare Part A. Vermont has **no asset limits** for any program[3][5]. Income limits include $20 general income disregard; earned income has additional 50% deduction after $65 disregard; unearned income disregards $20. Limits apply to countable income and are for 2025 (most recent specified; federal updates annually in January). **QMB (100% FPL):** $1,305/month individual, $1,763/month couple[5]. **SLMB (120% FPL):** $1,565/month individual, $2,115/month couple[5]. **QI-1 (135% FPL):** Up to $1,781/month individual, $2,400/month couple[1]. Older sources show slight variations (e.g., QMB $1,325 single[1]), but Vermont-specific 2025 figures from vtlawhelp.org are authoritative[5]. No household size table beyond individual/couple; assumes 1-2 person Medicare households.
- Assets: None in Vermont for QMB, SLMB, or QI[3][5].
- Must be enrolled in (or eligible for) Medicare Part A[2][7].
- U.S. citizen or qualified immigrant.
- Reside in Vermont.
- QI cannot have full Medicaid[3].
- Automatic 'deemed' eligibility for Extra Help (LIS) for Part D if enrolled in any MSP[3][6].

**Benefits:** **QMB:** Pays Medicare Part A premiums (if applicable), Part B premiums ($202.90/month in 2026[4]), Part A/B deductibles, coinsurance, copayments for Medicare-covered services. Providers cannot bill QMB enrollees for Medicare-covered costs[2][4]. **SLMB & QI:** Pay Part B premiums only[1][3][5]. All provide automatic Extra Help for Part D drugs[3][6]. Does not cover non-Medicare services.
- Varies by: priority_tier

**How to apply:**
- Apply through Vermont Department of Vermont Health Access (DVHA) Medicaid programs; state screens for best fit (QMB, SLMB, or QI-1)[5].
- Online: Vermont benefits portal (https://benefits.vermont.gov/ - inferred from standard state process; confirm via official site).
- Phone: Vermont Medicaid helpline at 1-800-250-8427 (standard VT Medicaid contact).
- Mail or in-person: Local Economic Services Division offices statewide or mail to DVHA, 280 State Drive, NOB-4, Waterbury, VT 05671 (standard VT Medicaid addresses).

**Timeline:** Not specified in sources; typically 45 days for Medicaid-related apps per federal rules, but apply early as retroactive coverage possible.
**Waitlist:** QI may have funding caps federally (priority levels QI-1 first), but Vermont sources do not indicate waitlists[3].

**Watch out for:**
- Vermont waives asset test (unlike federal defaults ~$9,950 single[2][7]); many miss this and self-deny.
- Income disregards ($20 general, $65+50% on earned) can qualify borderline cases—always apply[5].
- QI ineligible if on full Medicaid; state auto-assigns highest program[3][5].
- Limits updated yearly (Jan); 2025 figures used, check current via DVHA.
- QMB doesn't cover non-Medicare services (key vs. full dual Medicaid)[3].
- Providers can't balance bill QMB for covered services, but confirm with provider[2][4].

**Data shape:** No asset test in Vermont (state waiver); tiered by income brackets (QMB<100%FPL, SLMB 100-120%, QI 120-135%); benefits degrade by tier (full cost-sharing to Part B only); auto Extra Help; household size limited to Medicare unit (individual/couple)

**Source:** https://dvha.vermont.gov/ (Vermont Dept. of Vermont Health Access); supplemental https://vtlawhelp.org/medicare-savings-buy-programs[5]

---

### 3SquaresVT for Older Vermonters

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Households where all members are 60+ or disabled and have no earned income from jobs or self-employment qualify via simplified process. General 3SquaresVT gross income limit is 185% FPL (household size table not specified in sources; check current FPL). Households with older adults (60+) or disabled members are exempt from gross income limit if over 185% FPL, but resources apply.[1][2][3]
- Assets: No resource limits for most Vermonters. For elderly/disabled households over 185% FPL: $4,250 limit (includes savings, checking, investments, other assets; excludes primary home, vehicle, retirement/educational savings accounts like 401Ks, IRAs). Another source notes $3,500 limit for similar cases.[2][3]
- Households where everyone is 60+ or receiving disability benefits with no job/self-employment income for '3SquaresVT in a SNAP' simplified application and 3-year certification.[1]
- Categorical eligibility if receiving SSI, Reach Up (TANF), or Vermont EITC.[3]
- No general work requirements for elderly/disabled households.[2][3]

**Benefits:** Monthly food benefits via EBT card (usable at 600+ VT retailers, 40+ farmers' markets). For households where all are 65+ or SSI recipients: benefits issued as cash on EBT or direct bank deposit with verification. Exact amounts based on income/deductions (specific tables not in sources).[3][7]
- Varies by: household_size

**How to apply:**
- Online: dcf.vermont.gov/benefits/3SquaresVT/SNAP (simplified '3SquaresVT in a SNAP' application for 60+/disabled).[1]
- Phone: Not specified in sources; contact Economic Services Department (ESD).
- Other routes (mail, in-person) available via ESD offices statewide, not detailed.

**Timeline:** Not specified.

**Watch out for:**
- Must have no earned income from job/self-employment for simplified '3SquaresVT in a SNAP' process.[1]
- Asset limits ($3,500-$4,250) only apply if income over 185% FPL for elderly/disabled; many miss exemptions for home/vehicle/retirement accounts.[2][3]
- 65+ or SSI households get cash benefits option, not just EBT food-only.[3]
- 5-year wait for some noncitizens, with exceptions.[3]
- Traditional applications can lapse benefits; simplified version prevents this for qualifiers.[4]

**Data shape:** Simplified application and 3-year certification only for households all 60+/disabled with no earned income; asset test only for elderly/disabled over 185% FPL; cash benefits option for 65+/SSI.

**Source:** dcf.vermont.gov/benefits/3SquaresVT/SNAP

---

### Fuel Assistance Program


**Eligibility:**
- Income: Income at or below 200% of the Federal Poverty Level (FPL) for main Fuel Assistance and Crisis Fuel; 185% of FPL for Seasonal Fuel Assistance and VGS Assistance. Exact dollar amounts vary by household size and year; families must check current FPL guidelines via DCF as specific tables not listed in sources. Applies to households heating with oil, propane, kerosene, electricity, wood, pellets, or paying landlord for heat.
- Assets: No asset limits mentioned in sources.
- Available to homeowners and renters.
- For Crisis Fuel, apply when almost or completely out of fuel during winter months (last Monday in November to last Friday in April).

**Benefits:** Yearly one-time benefit payment paid directly to fuel provider; amount based on income and average annual heating costs. May increase 3SquaresVT benefits if eligible. Covers kerosene, oil, propane, electricity, wood, pellets, or combination.
- Varies by: household_size

**How to apply:**
- Online: DCF website (main fuel assistance page) or short application via Vermont Food Help/VTLawHelp.
- Phone: 1-800-479-6151 to request paper application or for general inquiries.
- Mail: Economic Services Division, Application & Document Processing Center, 280 State Drive, Waterbury, VT 05671-1500.
- In-person: Local Community Action Agency (call first, especially for Crisis) or DCF district office.
- Crisis-specific: Contact local agency like Capstone at 1-802-479-1053 or 1-800-639-1053 (statewide); Lamoille County: 1-802-888-7993 or 1-800-639-8710.

**Timeline:** Not specified in sources.

**Watch out for:**
- Apply before end of November for largest benefit.
- Crisis Fuel requires in-person application at local agency (phone option if elderly/disabled); available only Nov-April.
- Separate from utility discounts (e.g., Green Mountain Power, Vermont Gas); eligible for both.
- Eligibility may boost 3SquaresVT benefits.
- Fuel Buying Program via EastRise Credit Union is separate low-interest option.

**Data shape:** Multiple sub-programs (Seasonal, Crisis, VGS Assistance) with slightly different income thresholds (185-200% FPL) and providers; regional Community Action Agencies handle delivery; no fixed benefit amounts listed, scales by income/household/heating costs.

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `household_size_table`: Benefits/eligibility vary by household size — we store a single number
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://dcf.vermont.gov/ (implied via DCF Economic Services Division; specific fuel page not directly linked in results)

---

### Weatherization Assistance Program

> **NEW** — not currently in our data

**Eligibility:**
- Income: Gross household income over prior 12 months must be below county-specific limits (July 1, 2025–June 30, 2026). Varies by county and household size:

| Household Size | Addison | Chittenden/Franklin/Grand Isle | Rest of State |
|---------------|---------|-------------------------------|---------------|
| 1             | $65,030 | $72,695                       | $62,580       |
| 2             | $74,320 | $83,080                       | $71,520       |
| 3             | $83,610 | $93,465                       | $80,460       |
| 4             | $92,900 | $103,850                      | $89,400       |
| 5             | $100,332| $112,158                      | $96,552       |
| 6             | $107,764| $120,466                      | $103,704      |
| 7             | $115,196| $128,774                      | $110,856      |
| 8             | $122,628| $137,082                      | $118,008      |
Add $7,532 (Addison), $8,308 (Chittenden/Franklin/Grand Isle), or $7,152 (Rest of State) per additional person.[2]
- Assets: No asset limits mentioned.
- Tenant must receive seasonal fuel assistance (below 185% FPL),
- At least one household member receives SSI,
- Household receives Reach Up benefits (adult recipient; child-only does not qualify),
- Landlord and tenant both willing to participate,
- Property eligible once every 15 years (focuses on properties, especially rentals)

**Benefits:** Free energy efficiency improvements including insulation, air sealing, safety upgrades; averages about $10,000 worth of improvements per home with no landlord match.[1][3]
- Varies by: region

**How to apply:**
- Contact local community action agency (BROC, Capstone, CVOEO, NETO, SEVCA) for single-unit weatherization; find agency via local agency list.[1][3]
- For multi-family (5+ units): Contact local agency or 3E Thermal (statewide).[1]
- CVOEO Weatherization (for VGS customers): Call 1-800-545-1084.[4]

**Timeline:** Not specified

**Watch out for:**
- Properties limited to weatherization once every 15 years.[1]
- Primarily targets rentals; both tenant and landlord must agree.[1]
- Income based on prior 12 months gross; categorical eligibility (SSI, Reach Up, fuel assistance) also qualifies.[1][2]
- Not automatic; must apply via local agency.[1]
- Child-only Reach Up does not qualify.[1]

**Data shape:** County-grouped income limits that vary by household size; delivered regionally via 5 community action agencies; property-level 15-year limit; dual tenant/landlord consent for rentals

**Source:** https://outside.vermont.gov/dept/DCF/Shared%20Documents/Benefits/Weatherization-Income-Guidelines.pdf

---

### State Health Insurance Assistance Program (SHIP)

> **NEW** — not currently in our data

**Eligibility:**
- Income: No income limits; prioritizes people with limited incomes but open to all Medicare beneficiaries[1][3][5]
- Assets: No asset limits or tests[1][3]
- Medicare beneficiaries (including under age 65 with disabilities or End-Stage Renal Disease), their families, and caregivers[1][3][6]

**Benefits:** Free one-on-one health insurance counseling, information and printed materials, referrals to agencies; covers Medicare Parts A/B/D, Medigap, Medicare Advantage, long-term care insurance, Medicare Savings Programs (QMB/SLMB/QI), prescription assistance, Medicaid, fraud prevention (via SMP); personalized help understanding benefits, comparing options, appeals, enrollment[1][2][3][5]

**How to apply:**
- Phone: Toll-free (800) 642-5119 or local (802) 865-0360, hours 8:30am-4:30pm ET M-F[2][4]
- Email: Donna@vermont4a.org[2]
- Website: http://www.vermont4a.org/[2]
- Regional: e.g., NEK Council on Aging helpline 1-800-642-5119 or info@nekcouncil.org[4]
- In-person: Via local Area Agencies on Aging or affiliates (appointments required)[1][2][3]

**Timeline:** No formal processing; services provided via appointment scheduling (timeline not specified in sources)

**Watch out for:**
- Not a financial aid or healthcare provider program—only free counseling and education, no direct payments or medical services[1][5]
- Requires contacting specific phone/email or local affiliate to schedule; no online self-service application[1][2]
- Prioritizes limited-income, disabled under 65, dually eligible—but open to all; people may assume strict eligibility and not call[3]
- Services via trained volunteers/staff at local sites; availability may depend on regional affiliate capacity[3][5]

**Data shape:** No income/asset tests; counseling-only service via statewide network of local Area Agencies on Aging; appointment-based with regional providers

**Source:** http://www.vermont4a.org/[2]

---

### Meals on Wheels (Vermont)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: No income eligibility threshold. Program serves recipients regardless of income.[2]
- Must be unable to obtain or prepare meals on a temporary or permanent basis due to physical, mental, or cognitive condition requiring assistance to leave home.[2]
- Spouse of eligible participant, regardless of age.[1][2]
- Under 60 with disability living in senior housing where congregate meals are provided.[1]
- Under 60 with disability residing with or in care of eligible senior receiving Meals on Wheels.[1][2]
- Under 60 with disability referred by Vermont Center for Independent Living (VCIL) under their funding.[1]
- Non-senior volunteers performing essential duties for meal program operation.[1]

**Benefits:** Hot, nutritious meals delivered Monday–Friday (five days per week). Frozen meals provided for weekends, holidays, or days kitchen is closed. Meals include protein, vegetables, milk, juice, bread, and fruit, meeting Older Americans Act nutrition guidelines.[2][3]
- Varies by: region (provider-dependent)

**How to apply:**
- Phone: Age Well Meal Intake line: 802-465-7293 (Senior Solutions)[6]
- Email: info@seniorsolutionsvt.org (Senior Solutions)[6]
- In-person: Contact local provider in your county
- Online: Contact local Area Agency on Aging (AAA) or provider website

**Timeline:** Not specified in available sources. Contact local provider for timeline.
**Waitlist:** Not specified in available sources. Contact local provider.

**Watch out for:**
- No income test means program is available to all eligible seniors regardless of wealth, but this also means no subsidies based on income—everyone pays the same suggested donation.[2]
- Under-60 eligibility is highly restricted and requires either disability + residence with eligible senior, disability + senior housing, or referral through VCIL. Simply being disabled under 60 does not automatically qualify.[1][5]
- Service is NOT statewide—availability depends entirely on which provider serves your county. Must contact local provider to determine if service is available in your specific town.[2][3][6]
- Frozen meals for weekends/holidays are provided, but hot meal delivery is Monday–Friday only in most areas.[2][3]
- Program is volunteer-dependent; service capacity may be limited by volunteer availability in your region.[2]
- Meals on Wheels is distinct from congregate meal programs (community meal centers). This program delivers to your home.[2]
- VCIL's under-60 program has strict eligibility: those with access to assistive technology, personal assistance, or other supports for meal preparation are NOT eligible.[5]
- Suggested donation is just that—suggested. However, all participants are encouraged to contribute what they can afford.[2][3]

**Data shape:** Vermont Meals on Wheels is a multi-provider system with no statewide unified eligibility or application process. Age Well is the largest provider but does not serve all counties. VCIL operates a separate program for under-60 individuals. Eligibility is primarily age-based (60+) with no income or asset limits, making it unusual among means-tested programs. Benefits are fixed (meals delivered 5 days/week) rather than scaled. Regional variation is significant: different providers, different counties, different donation amounts, different processing times. Families must first identify their local provider, then contact that provider directly.

---

### Caregiver Support Program


**Eligibility:**
- Income: No specific income limits identified in search results for a Vermont state Caregiver Support Program; related programs like Medicaid ASP follow general Medicaid financial criteria without detailed tables provided here[2].
- Assets: No specific asset limits or exemptions detailed; Medicaid programs referenced require standard Medicaid asset tests[2].
- No single program matches 'Caregiver Support Program' exactly in Vermont; closest are VA Caregiver Support Program (for Veterans with serious injuries needing 6+ months personal care, caregiver 18+ and family relation)[1]
- Medicaid Attendant Services Program (ASP): VT resident 18+, self-direct care, physical help with 2+ ADLs, nursing home level of care not required[2]
- Dementia Care Respite (CVCOA): Care recipient with dementia, VT resident living at home in Lamoille/Washington/Orange counties, caregiver 18+[3][5]
- Global Commitment to Health Waiver: Allows family/spouses as paid caregivers under Medicaid for adults 18+[3]

**Benefits:** VA CSP: Personal care services, training, stipends (amounts not specified); ASP: Self-directed attendant services (hours based on need, entitlement no waitlist); Dementia Respite: Respite care (details limited); Paid family caregiving up to $1700/month tax-free via Medicaid programs[1][2][3][4]
- Varies by: priority_tier

**How to apply:**
- VA CSP: Contact local VA medical center (no VT-specific phone); ASP: Apply via Medicaid, use American Council on Aging eligibility test[2]
- Global Commitment: dvha.vermont.gov/global-commitment-to-health[3]
- Dementia Respite: CVCOA service area specific, contact (802) number from caregiver.org[3][5]
- General: asd.vermont.gov/services/choices-for-care-program for related nursing services[3]

**Timeline:** Not specified; ASP is entitlement with no waitlist[2]
**Waitlist:** None for ASP (entitlement); waivers may have waitlists unlike state plan HCBS[2]

**Watch out for:**
- No exact 'Caregiver Support Program' in VT; may confuse with VA federal program (Veterans only)[1]
- Many are Medicaid-tied with financial eligibility tests[2]
- Regional limits (e.g., CVCOA not statewide)[5]
- Spouses excluded in some caregiver eligibility, allowed in others like Global Commitment[3]
- Must self-direct in ASP; not for residential settings[2]

**Data shape:** Fragmented across Medicaid waivers/state plan (ASP entitlement), regional dementia respite, VA federal; no unified statewide caregiver support program with fixed income/assets; varies by care recipient condition (dementia, ADLs, Veteran status)

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `waitlist`: Has waitlist info — our model has no wait time field
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** No single official .gov for 'Caregiver Support Program'; see dvha.vermont.gov for Medicaid/Global Commitment[2][3], asd.vermont.gov for Choices[3]

---

### Senior Community Service Employment Program (SCSEP)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Family income no more than 125% of the federal poverty level. Exact dollar amounts vary by household size and are updated annually via HHS Poverty Guidelines (effective January 15, 2025). Contact local provider for current table, as specific 2026 figures not listed in sources.
- Unemployed
- Priority to veterans and qualified spouses, individuals over 65, with disabilities, low literacy or limited English proficiency, rural residents, homeless or at-risk, low employment prospects, or those who failed to find work via American Job Centers

**Benefits:** Part-time paid training (average 20 hours/week) at public agencies or 501(c)(3) nonprofits in community service roles (e.g., schools, hospitals, senior centers); paid highest of federal, state, or local minimum wage on bi-weekly basis; transitional to unsubsidized jobs (typically 6 months); no cost to host organizations.

**How to apply:**
- Phone: A4TD (Vermont provider) - contact via https://a4td.org/scs-employment-program/ (specific number not listed; national toll-free: 1-877-872-5627 or 1-877-US2-JOBS)
- Online: CareerOneStop Older Worker Program Finder (national tool to locate Vermont SCSEP sponsors like A4TD)
- In-person: Local A4TD offices or community host sites in Vermont
- American Job Centers for employment assistance

**Waitlist:** Possible due to funding limits and transitions, but not specified for Vermont

**Watch out for:**
- Transitional training only - positions temporary, not permanent employment
- Income eligibility strictly ≤125% FPL; check current HHS guidelines as they update yearly
- Training wages may impact unemployment or retirement benefits - consult unemployment office
- Priority enrollment tiers may delay non-priority applicants
- No asset test, but must be unemployed and job-seeking

**Data shape:** Vermont-specific via A4TD grantee; national SCSEP rules apply with income at 125% FPL (annual update); no asset limits or fixed dollar tables in sources - requires local verification; statewide but community-host dependent

**Source:** https://a4td.org/scs-employment-program/

---

### Legal Assistance for Seniors (Vermont Legal Aid Elder Law Project)

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+
- Income: Targeted at low-income seniors; specific dollar amounts not listed but prioritizes those unable to afford private counsel. Qualification screened via intake process.[2][5][8]
- Assets: Not specified; focuses on low-income qualifiers without detailed asset tests mentioned.[2][5]
- Vermont resident
- Civil legal issue relevant to seniors (e.g., housing, benefits, elder abuse)
- Typically low-income and unable to pay for private attorney[2][5][8]

**Benefits:** Advice, advocacy, and full legal representation for issues including housing problems, state/federal benefits (e.g., Social Security, 3SquaresVT, Medicaid planning), elder abuse, financial exploitation, neglect; Medicare Advocacy Project handles Medicare/Medicaid appeals and coverage denials.[2][8]

**How to apply:**
- Phone: 1-800-889-2047
- Online Legal Help Tool at VTLawHelp.org
- Legal Help Request Form at VTLawHelp.org
- In-person via referral after screening[4][5][8]

**Timeline:** Not specified
**Waitlist:** Not mentioned; intake screening determines eligibility promptly[5]

**Watch out for:**
- Must be low-income to qualify for free services; not guaranteed representation—intake screens priority
- Focuses on civil matters only, not criminal
- Medicare Advocacy limited to dual Medicare/Medicaid recipients
- Use Seniors category in Legal Help Tool for elder specialists[2][5][8]

**Data shape:** No fixed income/asset tables; eligibility via low-income screening and civil legal need priority; statewide centralized intake with pro bono network

**Source:** https://www.vtlegalaid.org/legal-projects/elder-law-medicare-advocacy

---

### Long-Term Care Ombudsman


**Eligibility:**
- Income: No income limits; available to all receiving qualifying long-term care services regardless of financial status[2][4][5]
- Assets: No asset limits or tests; no assets count or are exempt as there is no financial eligibility requirement[2][4][5]
- Must reside in or receive services from: nursing homes, residential care homes, assisted living facilities, adult family care homes, or community-based long-term care through Vermont’s Choices for Care program[1][2][4][5]

**Benefits:** Investigate complaints and concerns; assist with decisions on long-term care; monitor facilities via visits; educate staff on rights; advocate for system changes; provide information on services; help with denials, quality issues, discharges, privacy, care, food, finances, transfers, roommates for facility residents or Choices for Care participants[1][2][4]

**How to apply:**
- Phone: 1-800-889-2047 (toll-free) or (802) 863-5620 (local)[2][4][6]
- Online form: https://vtlawhelp.org/long-term-care-help[2]
- Website for info: https://www.vtlegalaid.org/legal-projects/long-term-care-ombudsman or https://vtlawhelp.org/long-term-care[1][4]

**Timeline:** Response within three business days[4]

**Watch out for:**
- Not a paid service provider or financial aid program—purely advocacy and complaint resolution, not direct care or funding[2][4][5]
- Separate from Vermont's Health Care Ombudsman for certain home care (though closely related)[3]
- For community services, help is limited to Choices for Care participants with specific issues like denials or quality[2]
- Free service, but relies on volunteers who need certification and commitment[1][5]

**Data shape:** no income test; advocacy only, not financial or direct services; covers facilities and Choices for Care community program; volunteer-based with statewide reach but targeted recruitment

**Our model can't capture:**
- `asset_limits`: Our model has no asset limit fields
- `regional_variations`: Program varies by region — our model doesn't capture this
- `documents_required`: Has document checklist — our model doesn't store per-program documents

**Source:** https://vtlawhelp.org/long-term-care-help

---

### Vermont Senior Companion Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 55+
- Income: Based on 200% of DHHS poverty guidelines. Examples: $31,300 or less for a single person, $42,300 or less for a couple (202? from [1]); $27,180 (1), $36,620 (2), $46,060 (3), $55,500 (4) for 2022 [2]; $30,120 (single), $40,880 (couple), $51,640 (family of 3), $62,400 (family of 4) [5]. Exact current limits vary by year; contact agency for 2026 table.
- Assets: No asset limits mentioned in sources.
- Able to serve at least 10 hours per week (up to 40 hours)
- Reside in Vermont

**Benefits:** Non-financial services to elderly clients: companionship, friendship, assistance with daily living tasks (e.g., shopping, paying bills, errands, rides), helping clients live independently at home, respite for family caregivers. Provided by low-income volunteers age 55+ who receive: $4.00/hour non-taxable stipend (does not affect benefits like 3SquaresVT or subsidized housing), $0.70/mile mileage reimbursement, flexible schedule (10-40 hours/week), monthly gatherings, ongoing training (4 hours/month average), support.
- Varies by: fixed

**How to apply:**
- Contact Vermont’s Area Agencies on Aging: Age Well (www.agewellvt.org), Northeast Kingdom Council on Aging (www.nekcouncil.org), Senior Solutions (www.seniorsolutionsvt.org), Southwestern Vermont Council on Aging (www.svcoa.org)
- Phone: Helpline 1-800-642-5119 (Age Well, Senior Solutions); 802-885-2669 (Senior Solutions); 802-465-4293 (Meals-related, but for companions contact HelpLine)

**Timeline:** Not specified in sources.

**Watch out for:**
- This is a volunteer program for low-income seniors (55+) to help other elderly, not direct benefits for families seeking care for loved ones—families request companions for their elderly relative via agencies.
- Income eligibility for volunteers only; clients (those receiving help) have no stated eligibility (focus on those needing help with daily tasks to stay independent).
- Stipend is non-taxable and does not affect recipient's public benefits.
- Income limits outdated in sources (2022 or earlier); verify current with agency.
- Not a paid job; flexible volunteer opportunity with stipend.

**Data shape:** Volunteer stipend program (AmeriCorps Seniors) matching low-income 55+ volunteers to provide companionship/services to homebound elders; income-tested for volunteers (200% poverty, varies by household size/year); statewide via 4 regional agencies; no client eligibility test mentioned.

**Source:** No single primary .gov URL; program via AmeriCorps Seniors, administered by Vermont Area Agencies on Aging (e.g., www.agewellvt.org)

---

### Senior Solutions Vet-to-Vet Program

> **NEW** — not currently in our data

**Eligibility:**
- Age: 60+ (senior veterans)+
- Income: No specific income limits mentioned; many Senior Solutions programs are available regardless of income or assets[7][5]
- Assets: No asset limits mentioned; many Senior Solutions programs are available regardless of income or assets[7]
- Must be a senior veteran (implied homebound or needing companionship)[5][6]
- Resident of one of the 46 towns served by Senior Solutions (applies to related programs, likely similar)[3]
- Program matches veteran volunteers with fellow senior veterans[6]

**Benefits:** Volunteer companionship and support from fellow veteran volunteers; regular phone chats, safety check-ins, and emotional understanding tailored to veterans' unique experiences; provided through partnership with American Legion Brattleboro Post 5[5][6]

**How to apply:**
- Phone: Call Senior Solutions HelpLine at 800-642-5119 or 802-885-2669[5]
- Phone: Contact volunteer coordinator (no separate number specified)[6]
- Email: info@seniorsolutionsvt.org (for general services)[3]

**Timeline:** Not specified

**Watch out for:**
- Not a financial, medical, or home care program—purely volunteer companionship matching; distinct from Veteran Directed Care Program (which is VA-funded case-managed home care)[6]
- Limited to Senior Solutions' 46 towns, not statewide[3]
- No formal application process detailed; simple phone call to volunteer coordinator[6]
- People may confuse with pet assistance or other Senior Solutions veteran services[3][6]

**Data shape:** Volunteer matching service only, no income/asset test, region-restricted to 46 towns with Brattleboro partnership, no quantified benefits like hours or dollars

**Source:** https://www.seniorsolutionsvt.org/services/veterans/

---

## Program Classification

| Program | Type | Scope | Complexity |
|---------|------|-------|------------|
| Choices for Care (CFC) Waiver | benefit | state | deep |
| Medicaid for Aged, Blind, and Disabled ( | benefit | state | deep |
| Program of All-Inclusive Care for the El | benefit | local | deep |
| Qualified Medicare Beneficiary (QMB), Sp | benefit | federal | deep |
| 3SquaresVT for Older Vermonters | benefit | state | medium |
| Fuel Assistance Program | benefit | state | deep |
| Weatherization Assistance Program | benefit | federal | deep |
| State Health Insurance Assistance Progra | resource | federal | simple |
| Meals on Wheels (Vermont) | benefit | federal | medium |
| Caregiver Support Program | resource | local | simple |
| Senior Community Service Employment Prog | employment | federal | medium |
| Legal Assistance for Seniors (Vermont Le | resource | state | simple |
| Long-Term Care Ombudsman | resource | federal | simple |
| Vermont Senior Companion Program | benefit | state | medium |
| Senior Solutions Vet-to-Vet Program | benefit | local | medium |

**Types:** {"benefit":10,"resource":4,"employment":1}
**Scopes:** {"state":6,"local":3,"federal":6}
**Complexity:** {"deep":6,"medium":5,"simple":4}

## Content Drafts

Generated 15 page drafts. Review in admin dashboard or `data/pipeline/VT/drafts.json`.

- **Choices for Care (CFC) Waiver** (benefit) — 5 content sections, 6 FAQs
- **Medicaid for Aged, Blind, and Disabled (ABD)** (benefit) — 4 content sections, 6 FAQs
- **Program of All-Inclusive Care for the Elderly (PACE)** (benefit) — 3 content sections, 6 FAQs
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI)** (benefit) — 4 content sections, 6 FAQs
- **3SquaresVT for Older Vermonters** (benefit) — 3 content sections, 6 FAQs
- **Fuel Assistance Program** (benefit) — 3 content sections, 6 FAQs
- **Weatherization Assistance Program** (benefit) — 4 content sections, 6 FAQs
- **State Health Insurance Assistance Program (SHIP)** (resource) — 2 content sections, 6 FAQs
- **Meals on Wheels (Vermont)** (benefit) — 4 content sections, 6 FAQs
- **Caregiver Support Program** (resource) — 3 content sections, 6 FAQs
- **Senior Community Service Employment Program (SCSEP)** (employment) — 3 content sections, 6 FAQs
- **Legal Assistance for Seniors (Vermont Legal Aid Elder Law Project)** (resource) — 2 content sections, 6 FAQs
- **Long-Term Care Ombudsman** (resource) — 1 content sections, 6 FAQs
- **Vermont Senior Companion Program** (benefit) — 2 content sections, 6 FAQs
- **Senior Solutions Vet-to-Vet Program** (benefit) — 3 content sections, 6 FAQs

## What We Learned

### Patterns Observed

How benefits vary across these programs:
- **priority_tier**: 4 programs
- **region**: 2 programs
- **household_size**: 2 programs
- **not_applicable**: 5 programs
- **region (provider-dependent)**: 1 programs
- **fixed**: 1 programs

### Data Shape Notes

Unique structural observations from each program:

- **Choices for Care (CFC) Waiver**: Tiered by need level (Highest/High/Moderate) with entitlement only for Highest; income up to 300% SSI with spend-down; $10k asset allowance for community-living high/highest need singles; 60-month look-back applies[1][2][3][5]
- **Medicaid for Aged, Blind, and Disabled (ABD)**: Income limits vary by Chittenden County residence and marital status; functional needs assessed for LTC add-ons; separate track from general Medicaid with specific ABD application portal.
- **Program of All-Inclusive Care for the Elderly (PACE)**: Only available at limited centers in select Vermont regions; no fixed income/asset tables (Medicaid-based); heavy waitlists and service area restrictions; dual-eligible focus with private pay option
- **Qualified Medicare Beneficiary (QMB), Specified Low-Income Medicare Beneficiary (SLMB), Qualified Individual (QI)**: No asset test in Vermont (state waiver); tiered by income brackets (QMB<100%FPL, SLMB 100-120%, QI 120-135%); benefits degrade by tier (full cost-sharing to Part B only); auto Extra Help; household size limited to Medicare unit (individual/couple)
- **3SquaresVT for Older Vermonters**: Simplified application and 3-year certification only for households all 60+/disabled with no earned income; asset test only for elderly/disabled over 185% FPL; cash benefits option for 65+/SSI.
- **Fuel Assistance Program**: Multiple sub-programs (Seasonal, Crisis, VGS Assistance) with slightly different income thresholds (185-200% FPL) and providers; regional Community Action Agencies handle delivery; no fixed benefit amounts listed, scales by income/household/heating costs.
- **Weatherization Assistance Program**: County-grouped income limits that vary by household size; delivered regionally via 5 community action agencies; property-level 15-year limit; dual tenant/landlord consent for rentals
- **State Health Insurance Assistance Program (SHIP)**: No income/asset tests; counseling-only service via statewide network of local Area Agencies on Aging; appointment-based with regional providers
- **Meals on Wheels (Vermont)**: Vermont Meals on Wheels is a multi-provider system with no statewide unified eligibility or application process. Age Well is the largest provider but does not serve all counties. VCIL operates a separate program for under-60 individuals. Eligibility is primarily age-based (60+) with no income or asset limits, making it unusual among means-tested programs. Benefits are fixed (meals delivered 5 days/week) rather than scaled. Regional variation is significant: different providers, different counties, different donation amounts, different processing times. Families must first identify their local provider, then contact that provider directly.
- **Caregiver Support Program**: Fragmented across Medicaid waivers/state plan (ASP entitlement), regional dementia respite, VA federal; no unified statewide caregiver support program with fixed income/assets; varies by care recipient condition (dementia, ADLs, Veteran status)
- **Senior Community Service Employment Program (SCSEP)**: Vermont-specific via A4TD grantee; national SCSEP rules apply with income at 125% FPL (annual update); no asset limits or fixed dollar tables in sources - requires local verification; statewide but community-host dependent
- **Legal Assistance for Seniors (Vermont Legal Aid Elder Law Project)**: No fixed income/asset tables; eligibility via low-income screening and civil legal need priority; statewide centralized intake with pro bono network
- **Long-Term Care Ombudsman**: no income test; advocacy only, not financial or direct services; covers facilities and Choices for Care community program; volunteer-based with statewide reach but targeted recruitment
- **Vermont Senior Companion Program**: Volunteer stipend program (AmeriCorps Seniors) matching low-income 55+ volunteers to provide companionship/services to homebound elders; income-tested for volunteers (200% poverty, varies by household size/year); statewide via 4 regional agencies; no client eligibility test mentioned.
- **Senior Solutions Vet-to-Vet Program**: Volunteer matching service only, no income/asset test, region-restricted to 46 towns with Brattleboro partnership, no quantified benefits like hours or dollars

### Questions for Chantel's Review

1. Are the data discrepancies above correct? (Our data may be outdated)
2. For new programs found — are these real programs we should add?
3. What data fields are we missing that matter most for families?
4. Are there programs NOT found that should exist in Vermont?
